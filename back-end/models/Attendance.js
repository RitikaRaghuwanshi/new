const mongoose = require('mongoose')

const attendanceSchema = new mongoose.Schema({
  enrollmentNumber: { type: String, required: true, ref: 'Student' },
  subject:          { type: String, required: true },
  facultyId:        { type: String, required: true },
  date:             { type: String, required: true }, // "YYYY-MM-DD"
  status:           { type: String, enum: ['Present', 'Absent'], required: true }
}, { timestamps: true })

attendanceSchema.index({ enrollmentNumber: 1, subject: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Attendance', attendanceSchema)