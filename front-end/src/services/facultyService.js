// src/services/facultyService.js
// Matches your existing authService.js / studentService.js pattern

import API from './api'  // your existing axios instance with interceptors

// ── Faculty profile ────────────────────────────────────────────────────────────
export const getFacultyProfile = () => API.get('/faculty/profile')

// ── Students ───────────────────────────────────────────────────────────────────
export const getStudents = (params = {}) => API.get('/faculty/students', { params })

// ── Attendance ─────────────────────────────────────────────────────────────────
export const getAttendance   = (params = {}) => API.get('/faculty/attendance', { params })
export const markAttendance  = (records)      => API.post('/faculty/attendance', { records })

// ── Marks ──────────────────────────────────────────────────────────────────────
export const getMarks        = (params = {}) => API.get('/faculty/marks', { params })
export const saveManualMarks = (data)         => API.post('/faculty/manual-marks', data)
export const uploadMarksFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return API.post('/faculty/upload-marks', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ── Admin — faculty CRUD ───────────────────────────────────────────────────────
export const getAllFaculty   = ()     => API.get('/admin/faculty')
export const createFaculty  = (data) => API.post('/admin/faculty', data)
export const deleteFaculty  = (id)   => API.delete(`/admin/faculty/${id}`)