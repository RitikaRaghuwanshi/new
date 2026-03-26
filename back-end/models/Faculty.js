const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const facultySchema = new mongoose.Schema({
  facultyId:   { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  subject:     { type: String, required: true },
  subjectCode: { type: String },
  department:  { type: String, default: 'IT' },
  role:        { type: String, default: 'faculty' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

facultySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

facultySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema)