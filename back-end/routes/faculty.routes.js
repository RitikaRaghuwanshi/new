const express  = require('express')
const router   = express.Router()
const {
  getFacultyProfile,
  getStudents,
  getAttendance,
  markAttendance,
  getMarks,
  uploadMarks,
  manualMarks,
} = require('../controllers/faculty.controller')
const { verifyToken } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(verifyToken)

router.get('/profile',       getFacultyProfile)
router.get('/students',      getStudents)
router.get('/attendance',    getAttendance)
router.get('/marks',         getMarks)
router.post('/attendance',   markAttendance)
router.post('/upload-marks', upload.single('file'), uploadMarks)
router.post('/manual-marks', manualMarks)

module.exports = router