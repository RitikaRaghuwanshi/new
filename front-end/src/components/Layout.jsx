import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Upload, BarChart3, GraduationCap,
  Target, Filter, User, TrendingUp, LogOut, ChevronRight, Bell,
  ClipboardList, PenLine, BookOpen, Calculator
} from 'lucide-react'

const navConfig = {
  admin: [
    { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard'   },
    { to: '/admin/students', icon: Users,           label: 'Students'    },
    { to: '/admin/upload',   icon: Upload,          label: 'Upload Data' },
    { to: '/admin/reports',  icon: BarChart3,       label: 'Reports'     },
  ],
  tpo: [
    { to: '/tpo',           icon: LayoutDashboard, label: 'Overview'        },
    { to: '/tpo/readiness', icon: Target,          label: 'Readiness List'  },
    { to: '/tpo/filter',    icon: Filter,          label: 'Filter Students' },
  ],
  student: [
    { to: '/student',           icon: LayoutDashboard, label: 'My Dashboard'   },
    { to: '/student/profile',   icon: User,            label: 'Update Profile' },
    { to: '/student/readiness', icon: TrendingUp,      label: 'My Readiness'   },
  ],
  faculty: [
    { to: '/faculty',     icon: LayoutDashboard, label: 'Dashboard'        },
  ],
}

const roleLabel = { admin: 'Administrator', tpo: 'Placement Officer', student: 'Student', faculty: 'Faculty' }
const roleColor = {
  admin:   'var(--accent)',
  tpo:     'var(--blue)',
  student: 'var(--green)',
  faculty: 'var(--purple)',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = navConfig[user?.role] || []

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 240, minWidth: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--accent)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>AcadPlace</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>IT Department</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px 8px' }}>
          <div style={{
            fontSize: '0.65rem', fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: roleColor[user?.role] || 'var(--text-muted)',
          }}>
            {roleLabel[user?.role]}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', overflow: 'auto' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to.split('/').length <= 2}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius)', marginBottom: 2,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                border: isActive ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem',
                transition: 'all 0.15s', textDecoration: 'none',
              })}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--bg-hover)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-display)',
              fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem',
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.name}</div>
              <div style={{
                fontSize: '0.7rem', color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 60, minHeight: 60, background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 'var(--radius)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <Bell size={15} />
          </button>
          <div style={{
            padding: '5px 12px', background: 'var(--accent-glow)',
            border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {roleLabel[user?.role]}
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}