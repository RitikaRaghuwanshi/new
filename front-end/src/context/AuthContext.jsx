import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser  = localStorage.getItem('user')
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
        API.defaults.headers.common['Authorization']   = `Bearer ${savedToken}`
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    let userData  = null
    let authToken = null

    try {
      const res = await axios.post('/api/auth/login', { email, password })
      authToken = res.data.token
      userData  = res.data.user
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 404) throw err
    }

    if (!userData) {
      const res = await axios.post('/api/faculty/login', { email, password })
      authToken = res.data.token
      userData  = { ...res.data.user, role: 'faculty' }
    }

    setToken(authToken)
    setUser(userData)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user',  JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
    API.defaults.headers.common['Authorization']   = `Bearer ${authToken}`

    return userData
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    delete API.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)