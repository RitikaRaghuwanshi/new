import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { GraduationCap, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(`/${user.role}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const quickFill = (role) => {
    const creds = {
      admin:   { email: 'admin@it.edu',                 password: 'admin123'   },
      tpo:     { email: 'tpo@it.edu',                   password: 'tpo123'     },
      student: { email: 'muskan.dhakariya.1040@it.edu', password: 'student123' },
      faculty: { email: 'roopam@it.edu',                password: 'roopam123'  },
    }
    if (creds[role]) {
      setEmail(creds[role].email)
      setPassword(creds[role].password)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.4 }} />
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={26} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>AcadPlace</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>IT Department Portal</div>
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
            Unified Academic &<br /><span style={{ color: 'var(--accent)' }}>Placement System</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 400 }}>
            One platform for tracking student lifecycle — from academics to placement. Powered by AI-driven readiness scoring.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {['AI Readiness Score', 'CGPA Tracking', 'Placement Analytics', 'Skill Gap Analysis'].map(f => (
              <span key={f} style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{ width: 460, minWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>Access your dashboard</p>

          {/* Quick Demo Login — 4 roles in one row */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>Quick Demo Login</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['admin', 'tpo', 'student', 'faculty'].map(role => (
                <button
                  key={role}
                  onClick={() => quickFill(role)}
                  style={{
                    flex: 1, padding: '8px 4px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '0.7rem', color: 'var(--text-secondary)',
                    letterSpacing: '0.05em', textTransform: 'capitalize',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--accent-glow)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>or enter credentials</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="form-input" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: 36, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 4, fontSize: '0.9rem' }}>
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
                : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}