const dotenv = require('dotenv')
dotenv.config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const morgan   = require('morgan')
const path     = require('path')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173','http://localhost:5174','http://localhost:5175',
    'http://localhost:5176','http://localhost:5177','http://localhost:5178'
  ],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

const uploadsDir = path.join(__dirname, 'uploads')
const fs = require('fs')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// Routes (each mounted only once)
app.use('/api/auth',      require('./routes/auth.routes'))
app.use('/api/students',  require('./routes/student.routes'))
app.use('/api/tpo',       require('./routes/tpo.routes'))
app.use('/api/analytics', require('./routes/analytics.routes'))
app.use('/api/admin',     require('./routes/admin.routes'))
app.use('/api/faculty',   require('./routes/faculty.routes'))

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AcadPlace API' }))
app.get('/',       (_req, res) => res.json({ message: 'Academic Placement API is running' }))

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: err.message || 'Server Error' })
})

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/acadplace'

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  })