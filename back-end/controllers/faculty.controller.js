// back-end/controllers/faculty.controller.js

const Faculty    = require('../models/faculty')
const Student    = require('../models/Student')
const Attendance = require('../models/Attendance')
const Marks      = require('../models/Marks')
const User       = require('../models/User')
const xlsx       = require('xlsx')
const fs         = require('fs')

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ─── Helper: resolve facultyId from JWT payload ───────────────────────────────
// req.user can be a full Faculty doc (when role=faculty) or a decoded JWT object.
// Both should expose facultyId. The auth middleware sets req.user.facultyId for faculty.
function getFacultyId(req) {
  return req.user?.facultyId || req.user?.enrollmentNumber || null
}

// ─── GET /api/faculty/profile ──────────────────────────────────────────────────
const getFacultyProfile = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' })
  res.json({ success: true, data: faculty })
})

// ─── GET /api/admin/faculty  (admin only) ─────────────────────────────────────
const getAllFaculty = asyncHandler(async (req, res) => {
  const faculties = await Faculty.find().sort({ createdAt: -1 })
  res.json({ success: true, data: faculties })
})

// ─── GET /api/faculty/students ────────────────────────────────────────────────
const getStudents = asyncHandler(async (req, res) => {
  const { search, enrollmentNumber, name } = req.query
  const query = { branch: 'IT', semester: { $in: [7, 8] } }

  if (enrollmentNumber) query.enrollmentNumber = { $regex: enrollmentNumber, $options: 'i' }
  if (name)             query.name             = { $regex: name,             $options: 'i' }
  if (search) {
    query.$or = [
      { enrollmentNumber: { $regex: search, $options: 'i' } },
      { name:             { $regex: search, $options: 'i' } },
    ]
  }

  const students = await Student.find(query).select('-__v').sort({ enrollmentNumber: 1 })
  res.json({ success: true, count: students.length, data: students })
})

// ─── GET /api/faculty/attendance ──────────────────────────────────────────────
const getAttendance = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  const { date, enrollmentNumber } = req.query
  const query = { subject: faculty.subject }
  if (date)             query.date             = date            // keep as string YYYY-MM-DD
  if (enrollmentNumber) query.enrollmentNumber = enrollmentNumber

  const records = await Attendance.find(query).sort({ date: -1 }).limit(2000)
  res.json({ success: true, count: records.length, data: records })
})

// ─── POST /api/faculty/attendance ─────────────────────────────────────────────
const markAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body
  const facultyId   = getFacultyId(req)
  const faculty     = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })
  if (!Array.isArray(records) || !records.length)
    return res.status(400).json({ success: false, message: 'records array is required' })

  const results = { saved: [], duplicates: [], notFound: [] }

  for (const rec of records) {
    const student = await Student.findOne({ enrollmentNumber: rec.enrollmentNumber })
    if (!student) { results.notFound.push(rec.enrollmentNumber); continue }

    try {
      await Attendance.findOneAndUpdate(
        { enrollmentNumber: rec.enrollmentNumber, subject: faculty.subject, date: rec.date },
        { status: rec.status, facultyId: faculty.facultyId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      results.saved.push(rec.enrollmentNumber)
    } catch (err) {
      if (err.code === 11000) results.duplicates.push(rec.enrollmentNumber)
      else throw err
    }
  }

  res.status(201).json({ success: true, data: results })
})

// ─── GET /api/faculty/marks ───────────────────────────────────────────────────
const getMarks = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  const { enrollmentNumber } = req.query
  const query = { subject: faculty.subject }
  if (enrollmentNumber) query.enrollmentNumber = enrollmentNumber

  const marks = await Marks.find(query).sort({ enrollmentNumber: 1 })
  res.json({ success: true, count: marks.length, data: marks })
})

// ─── POST /api/faculty/upload-marks ──────────────────────────────────────────
const uploadMarks = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  const workbook = xlsx.readFile(req.file.path)
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = xlsx.utils.sheet_to_json(sheet)
  fs.unlink(req.file.path, () => {})

  if (!rows.length) return res.status(400).json({ success: false, message: 'Excel file is empty' })

  const first = rows[0]
  if (!('EnrollmentNumber' in first) || !('TheoryMarks' in first) || !('PracticalMarks' in first))
    return res.status(400).json({
      success: false,
      message: 'Excel must have columns: EnrollmentNumber, TheoryMarks, PracticalMarks',
    })

  const results = { saved: [], notFound: [], errors: [] }

  for (const row of rows) {
    const enroll  = String(row.EnrollmentNumber).trim()
    const student = await Student.findOne({ enrollmentNumber: enroll })
    if (!student) { results.notFound.push(enroll); continue }

    try {
      await Marks.findOneAndUpdate(
        { enrollmentNumber: enroll, subject: faculty.subject },
        {
          theoryMarks:    row.TheoryMarks,
          practicalMarks: row.PracticalMarks,
          facultyId:      faculty.facultyId,
          uploadedVia:    'excel',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      results.saved.push(enroll)
    } catch (err) {
      results.errors.push({ enrollmentNumber: enroll, error: err.message })
    }
  }

  res.status(201).json({ success: true, data: results })
})

// ─── POST /api/faculty/manual-marks ──────────────────────────────────────────
// FIX: was using req.user.facultyId which doesn't exist on the decoded JWT.
// Now uses getFacultyId() helper to resolve from either decoded token or full object.
const manualMarks = asyncHandler(async (req, res) => {
  const { enrollmentNumber, theoryMarks, practicalMarks } = req.body
  if (!enrollmentNumber)
    return res.status(400).json({ success: false, message: 'enrollmentNumber is required' })

  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty)
    return res.status(404).json({ success: false, message: 'Faculty not found' })

  const student = await Student.findOne({ enrollmentNumber })
  if (!student)
    return res.status(404).json({ success: false, message: 'Student not found' })

  const marks = await Marks.findOneAndUpdate(
    { enrollmentNumber, subject: faculty.subject },
    {
      theoryMarks,
      practicalMarks,
      facultyId:   faculty.facultyId,
      uploadedVia: 'manual',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  res.status(201).json({ success: true, data: marks })
})

// ─── POST /api/admin/faculty  (create) ───────────────────────────────────────
const createFaculty = asyncHandler(async (req, res) => {
  const { facultyId, name, email, phone, subject, subjectCode, password } = req.body

  const exists = await Faculty.findOne({ $or: [{ facultyId }, { email }] })
  if (exists)
    return res.status(400).json({ success: false, message: 'Faculty ID or Email already exists' })

  const faculty = await Faculty.create({ facultyId, name, email, phone, subject, subjectCode, password: password || 'faculty123' })

  await User.create({
    name,
    email,
    password:         password || 'faculty123',
    role:             'faculty',
    enrollmentNumber: facultyId,
  })

  res.status(201).json({ success: true, data: faculty })
})

// ─── DELETE /api/admin/faculty/:id ───────────────────────────────────────────
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  await User.findOneAndDelete({ enrollmentNumber: faculty.facultyId })
  await faculty.deleteOne()

  res.json({ success: true, message: 'Faculty deleted' })
})

module.exports = {
  getFacultyProfile,
  getAllFaculty,
  getStudents,
  getAttendance,
  markAttendance,
  getMarks,
  uploadMarks,
  manualMarks,
  createFaculty,
  deleteFaculty,
}