const jwt     = require('jsonwebtoken')
const Faculty = require('../models/faculty')
const User    = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'acadplace_secret_key'

const verifyToken = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role === 'faculty') {
      const faculty = await Faculty.findById(decoded.id).select('-password')
      if (!faculty) return res.status(401).json({ message: 'Faculty not found' })
      req.user = { ...faculty.toObject(), role: 'faculty' }
    } else if (decoded.role === 'student') {
      req.user = decoded
    } else {
      const user = await User.findById(decoded.id).select('-password')
      if (!user) return res.status(401).json({ message: 'User not found' })
      req.user = user
    }
    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    return res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

const isFaculty = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') return next()
  res.status(403).json({ message: 'Access denied. Faculty only.' })
}

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next()
  res.status(403).json({ message: 'Access denied. Admin only.' })
}

const isTPO = (req, res, next) => {
  if (req.user && (req.user.role === 'tpo' || req.user.role === 'admin')) return next()
  res.status(403).json({ message: 'Access denied. TPO only.' })
}

module.exports = { verifyToken, isFaculty, isAdmin, isTPO }