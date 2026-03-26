const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const {
  getAllUsers,
  createUser,
  toggleUserStatus,
  uploadStudentsCSV,
  getAdminStats
} = require('../controllers/admin.controller')
const facultyCtrl = require('../controllers/faculty.controller')
// ✅ Change this line
const { verifyToken } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `students_${Date.now()}${path.extname(file.originalname)}`)
})
const upload = multer({ storage })

// ✅ Use verifyToken instead of protect
router.use(verifyToken, authorize('admin'))

router.get('/stats',                    getAdminStats)
router.get('/users',                    getAllUsers)
router.post('/users',                   createUser)
router.put('/users/:id/toggle',         toggleUserStatus)
router.post('/upload-students', upload.single('file'), uploadStudentsCSV)
router.get('/faculty',      facultyCtrl.getAllFaculty)    // List all faculty
router.post('/faculty',     facultyCtrl.createFaculty)   // Create faculty + User
router.delete('/faculty/:id', facultyCtrl.deleteFaculty) // Delete faculty + User

module.exports = router