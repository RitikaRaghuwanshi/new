const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  name:           { type: String },
  code:           { type: String },
  theoryMarks:    { type: Number, min: 0, max: 100 },
  practicalMarks: { type: Number, min: 0, max: 100 },
}, { _id: false })

const semesterResultSchema = new mongoose.Schema({
  semester: { type: Number },
  sgpa:     { type: Number, default: 0, min: 0, max: 10 },
  backlogs: { type: Number, default: 0 },
  subjects: [subjectSchema],
}, { _id: false })

const projectSchema = new mongoose.Schema({
  title:       { type: String },
  type:        { type: String, enum: ['major', 'minor'], default: 'minor' },
  description: { type: String },
  techStack:   [String],
  githubLink:  { type: String },
  year:        { type: Number },
}, { _id: false })

const certificationSchema = new mongoose.Schema({
  title:        { type: String },
  issuedBy:     { type: String },
  issueDate:    { type: String },
  credentialId: { type: String },
}, { _id: false })

const internshipSchema = new mongoose.Schema({
  company:     { type: String },
  role:        { type: String },
  startDate:   { type: String },
  endDate:     { type: String },
  stipend:     { type: Number, default: 0 },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
}, { _id: false })

const attendanceSchema = new mongoose.Schema({
  subject:          { type: String },
  subjectCode:      { type: String },
  semester:         { type: Number },
  totalClasses:     { type: Number, default: 0 },
  attendedClasses:  { type: Number, default: 0 },
}, { _id: false })

const studentSchema = new mongoose.Schema({
  enrollmentNumber:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:                    { type: String, required: true, trim: true },
  email:                   { type: String, trim: true, lowercase: true },
  phone:                   { type: String, trim: true },
  branch:                  { type: String, default: 'Information Technology' },
  division:                { type: String, enum: ['A','B','C','D'], default: 'A' },
  batch:                   { type: String, default: '2022-2026' },
  semester:                { type: Number, default: 8, min: 1, max: 8 },
  year:                    { type: Number, default: 4 },
  cgpa:                    { type: Number, default: 0, min: 0, max: 10 },
  semesterResults:         [semesterResultSchema],
  totalBacklogs:           { type: Number, default: 0 },
  activeBacklogs:          { type: Number, default: 0 },
  technicalSkills:         [String],
  softSkills:              [String],
  programmingLanguages:    [String],
  projects:                [projectSchema],
  certifications:          [certificationSchema],
  internships:             [internshipSchema],
  achievements:            [String],
  attendance:              [attendanceSchema],
  linkedinUrl:             { type: String },
  githubUrl:               { type: String },
  placementStatus:         { type: String, enum: ['not_started','in_process','placed','opted_out','higher_studies'], default: 'not_started' },
  placedCompany:           { type: String },
  placedPackage:           { type: Number },
  offerDate:               { type: Date },
  placementReadinessScore: { type: Number, default: 0, min: 0, max: 100 },
  skillGaps:               [String],
  suggestedSkills:         [String],
  extraCurricular:         [String],
  isActive:                { type: Boolean, default: true },
}, { timestamps: true })


studentSchema.index({ cgpa: -1 })
studentSchema.index({ placementReadinessScore: -1 })

module.exports = mongoose.model('Student', studentSchema)