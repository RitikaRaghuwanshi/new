import React, { useEffect, useState, useRef } from 'react'
import { API } from '../../context/AuthContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Users, ClipboardList, Upload, PenLine,
  Search, CheckCircle, XCircle,
  FileSpreadsheet, RefreshCw, BookOpen,
  Plus, X, Trash2, Save, BookMarked, GraduationCap,
  Calendar, Calculator, AlertTriangle, TrendingUp, BarChart2
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)

function cgpaColor(v) {
  if (v >= 8) return { bg: '#dcfce7', color: '#16a34a' }
  if (v >= 6) return { bg: '#fef9c3', color: '#ca8a04' }
  return { bg: '#fee2e2', color: '#dc2626' }
}

// ─── StatBox ─────────────────────────────────────────────────────────────────
function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 130,
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
      padding: '18px 20px', borderTop: `4px solid ${color}`,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)'
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

// ─── AttendanceCalculatorTab ──────────────────────────────────────────────────
function AttendanceCalculatorTab({ profile }) {
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [results,   setResults]   = useState(null) // { rows, totalClasses, dateList }
  const [students,  setStudents]  = useState([])

  // Load students once
  useEffect(() => {
    API.get('/faculty/students')
      .then(r => setStudents(r.data.data || []))
      .catch(() => {})
  }, [])

  const calculate = async () => {
    if (!startDate || !endDate) return toast.error('Please pick both start and end dates')
    if (startDate > endDate)    return toast.error('Start date must be before end date')
    setLoading(true)
    try {
      // Fetch ALL attendance records for this subject (no date filter — we filter client-side)
      const { data } = await API.get('/faculty/attendance')
      const allRecords = data.data || []

      // Build list of unique dates between startDate and endDate that have at least 1 record
      const inRange = allRecords.filter(r => r.date >= startDate && r.date <= endDate)
      const uniqueDates = [...new Set(inRange.map(r => r.date))].sort()
      const totalClasses = uniqueDates.length

      if (totalClasses === 0) {
        toast.error('No attendance records found in that date range')
        setLoading(false)
        setResults(null)
        return
      }

      // Build per-student summary
      const byStudent = {}
      students.forEach(s => {
        byStudent[s.enrollmentNumber] = { name: s.name, present: 0, absent: 0 }
      })

      inRange.forEach(r => {
        if (!byStudent[r.enrollmentNumber]) {
          byStudent[r.enrollmentNumber] = { name: r.enrollmentNumber, present: 0, absent: 0 }
        }
        if (r.status === 'Present') byStudent[r.enrollmentNumber].present++
        else                        byStudent[r.enrollmentNumber].absent++
      })

      const rows = Object.entries(byStudent)
        .map(([enroll, d]) => {
          const attended = d.present
          const pct      = totalClasses > 0 ? parseFloat(((attended / totalClasses) * 100).toFixed(1)) : 0
          return { enroll, name: d.name, attended, totalClasses, pct, safe: pct >= 75 }
        })
        .sort((a, b) => b.pct - a.pct)

      setResults({ rows, totalClasses, dateList: uniqueDates })
    } catch {
      toast.error('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }

  const safeCount    = results?.rows.filter(r => r.safe).length  || 0
  const dangerCount  = results?.rows.filter(r => !r.safe).length || 0

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>
          Attendance Calculator
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Select a date range. All dates in that range that have at least one attendance entry will be counted as classes held. Then the attendance % of each student is calculated.
        </p>
      </div>

      {/* Date Range Picker */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Start Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date" className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">End Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date" className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={calculate}
            disabled={loading}
            style={{ marginBottom: 1, minWidth: 160, justifyContent: 'center' }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Calculating…</>
              : <><Calculator size={14} /> Calculate Attendance</>
            }
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140, padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderTop: '4px solid #7c3aed', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{results.totalClasses}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Classes Held</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{startDate} → {endDate}</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderTop: '4px solid #059669', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{safeCount}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>≥ 75% (Safe)</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderTop: '4px solid #dc2626', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{dangerCount}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{'< 75% (Shortage)'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderTop: '4px solid #2563eb', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#2563eb', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{results.rows.length}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Students</div>
            </div>
          </div>

          {/* Dates held info */}
          <div style={{ marginBottom: 16, padding: '10px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Classes held on: </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {results.dateList.join('  •  ')}
            </span>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={15} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Student Attendance — {profile?.subject} ({startDate} to {endDate})
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Enrollment</th>
                    <th>Name</th>
                    <th>Attended</th>
                    <th>Total Classes</th>
                    <th>Attendance %</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Classes Needed (for 75%)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, i) => {
                    const needed = row.safe
                      ? 0
                      : Math.ceil((0.75 * row.totalClasses - row.attended) / 0.25)
                    const pctColor = row.pct >= 75 ? '#059669' : row.pct >= 60 ? '#d97706' : '#dc2626'
                    const pctBg    = row.pct >= 75 ? '#dcfce7' : row.pct >= 60 ? '#fef3c7' : '#fee2e2'
                    return (
                      <tr key={row.enroll}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, background: '#1e293b', color: '#7dd3fc', padding: '2px 7px', borderRadius: 6 }}>
                            {row.enroll}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.name}</td>
                        <td style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text-primary)' }}>{row.attended}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{row.totalClasses}</td>
                        <td>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', padding: '3px 10px', borderRadius: 8, background: pctBg, color: pctColor }}>
                            {row.pct}%
                          </span>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(row.pct, 100)}%`, background: `linear-gradient(90deg, ${pctColor}88, ${pctColor})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                          </div>
                          {/* 75% marker */}
                          <div style={{ position: 'relative', height: 0 }}>
                            <div style={{ position: 'absolute', left: '75%', top: -10, width: 1, height: 10, background: '#94a3b8', opacity: 0.5 }} />
                          </div>
                        </td>
                        <td>
                          {row.safe
                            ? <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#059669' }}>✓ Safe</span>
                            : <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#fee2e2', color: '#dc2626' }}>⚠ Shortage</span>
                          }
                        </td>
                        <td>
                          {row.safe
                            ? <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>—</span>
                            : <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>Need {needed} more</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shortage list highlight */}
          {dangerCount > 0 && (
            <div style={{ marginTop: 16, padding: '14px 18px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={16} color="#dc2626" />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>
                  Students with Attendance Shortage ({dangerCount})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {results.rows.filter(r => !r.safe).map(r => (
                  <div key={r.enroll} style={{ padding: '6px 12px', background: '#fee2e2', borderRadius: 10, border: '1px solid #fca5a5', fontSize: '0.78rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>{r.enroll}</span>
                    <span style={{ color: '#b91c1c', marginLeft: 6 }}>{r.name} — {r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!results && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-muted)' }}>
          <Calculator size={40} style={{ margin: '0 auto 14px', opacity: 0.25 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No results yet</p>
          <p style={{ fontSize: '0.8rem' }}>Pick a start and end date, then click Calculate Attendance</p>
        </div>
      )}
    </div>
  )
}

// ─── SyllabusTab (unchanged from original, kept intact) ───────────────────────
function SyllabusTab({ profile }) {
  const [syllabus,   setSyllabus]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [activeView, setActiveView] = useState('units')

  const [unitForm,    setUnitForm]    = useState({ unitNumber: '', title: '', topics: '' })
  const [addingUnit,  setAddingUnit]  = useState(false)
  const [showUnitForm,setShowUnitForm]= useState(false)
  const [editingUnit, setEditingUnit] = useState(null)

  const [mstForm,    setMstForm]    = useState({ mstNumber: 1, syllabus: '', units: '', scheduledDate: '' })
  const [savingMst,  setSavingMst]  = useState(false)

  const [refBooks,     setRefBooks]     = useState('')
  const [endSemTopics, setEndSemTopics] = useState('')
  const [academicYear, setAcademicYear] = useState('2024-25')

  useEffect(() => {
    API.get('/faculty/syllabus')
      .then(r => {
        const d = r.data.data
        setSyllabus(d)
        setRefBooks((d.referenceBooks || []).join('\n'))
        setEndSemTopics(d.endSemTopics || '')
        setAcademicYear(d.academicYear || '2024-25')
        if (d.mstSyllabus?.length > 0) {
          const m1 = d.mstSyllabus.find(m => m.mstNumber === 1) || {}
          setMstForm({ mstNumber: 1, syllabus: m1.syllabus || '', units: (m1.units || []).join(', '), scheduledDate: m1.scheduledDate || '' })
        }
      })
      .catch(() => toast.error('Could not load syllabus'))
      .finally(() => setLoading(false))
  }, [])

  const saveUnit = async (e) => {
    e.preventDefault()
    if (!unitForm.unitNumber || !unitForm.title) return toast.error('Unit number and title required')
    setAddingUnit(true)
    try {
      const { data } = await API.patch('/faculty/syllabus/unit', {
        unitNumber: parseInt(unitForm.unitNumber),
        title:      unitForm.title,
        topics:     unitForm.topics.split('\n').map(t => t.trim()).filter(Boolean),
      })
      setSyllabus(data.data)
      setUnitForm({ unitNumber: '', title: '', topics: '' })
      setShowUnitForm(false)
      setEditingUnit(null)
      toast.success('Unit saved!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally {
      setAddingUnit(false)
    }
  }

  const startEditUnit = (unit) => {
    setUnitForm({ unitNumber: String(unit.unitNumber), title: unit.title, topics: (unit.topics || []).join('\n') })
    setEditingUnit(unit.unitNumber)
    setShowUnitForm(true)
  }

  const deleteUnit = async (unitNumber) => {
    if (!window.confirm(`Delete Unit ${unitNumber}?`)) return
    try {
      const { data } = await API.delete(`/faculty/syllabus/unit/${unitNumber}`)
      setSyllabus(data.data)
      toast.success('Unit deleted')
    } catch { toast.error('Failed to delete unit') }
  }

  const saveMst = async (e) => {
    e.preventDefault()
    setSavingMst(true)
    try {
      const { data } = await API.patch('/faculty/syllabus/mst', {
        mstNumber:     mstForm.mstNumber,
        syllabus:      mstForm.syllabus,
        units:         mstForm.units.split(',').map(u => u.trim()).filter(Boolean),
        scheduledDate: mstForm.scheduledDate,
      })
      setSyllabus(data.data)
      toast.success(`MST-${mstForm.mstNumber} saved!`)
    } catch { toast.error('Failed to save MST') }
    finally { setSavingMst(false) }
  }

  const saveExtras = async () => {
    setSaving(true)
    try {
      const { data } = await API.post('/faculty/syllabus', {
        units:          syllabus?.units || [],
        mstSyllabus:    syllabus?.mstSyllabus || [],
        referenceBooks: refBooks.split('\n').map(b => b.trim()).filter(Boolean),
        endSemTopics,
        academicYear,
      })
      setSyllabus(data.data)
      toast.success('Saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading syllabus…</span>
    </div>
  )

  const subTabs = [
    { id: 'units',   label: 'Unit Syllabus',   icon: BookOpen      },
    { id: 'mst',     label: 'MST Syllabus',    icon: GraduationCap },
    { id: 'summary', label: 'Summary & Books', icon: BookMarked    },
  ]

  return (
    <div>
      {/* Subject header */}
      <div style={{ padding: '14px 18px', background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <BookOpen size={18} color="var(--accent)" />
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {profile?.subject}
          </span>
          {profile?.subjectCode && (
            <span style={{ marginLeft: 8, fontSize: '0.8rem', fontFamily: 'monospace', color: '#7dd3fc', background: '#1e293b', padding: '1px 6px', borderRadius: 5 }}>
              {profile.subjectCode}
            </span>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Year:</span>
          <input
            className="form-input"
            style={{ width: 100, padding: '4px 8px', fontSize: '0.8rem' }}
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            onBlur={saveExtras}
            placeholder="2024-25"
          />
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#fff', padding: 5, borderRadius: 14, border: '1px solid var(--border)', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        {subTabs.map(t => {
          const active = activeView === t.id
          return (
            <button key={t.id} onClick={() => setActiveView(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.15s',
              background: active ? 'var(--accent)' : 'transparent',
              color:      active ? '#fff' : 'var(--text-muted)',
              boxShadow:  active ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
            }}>
              <t.icon size={13} />{t.label}
            </button>
          )
        })}
      </div>

      {/* ══ UNITS VIEW ══ */}
      {activeView === 'units' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
              Unit-wise Syllabus
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                ({syllabus?.units?.length || 0} units)
              </span>
            </h3>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem' }}
              onClick={() => { setUnitForm({ unitNumber: '', title: '', topics: '' }); setEditingUnit(null); setShowUnitForm(true) }}>
              <Plus size={13} /> Add Unit
            </button>
          </div>

          {showUnitForm && (
            <div className="card" style={{ marginBottom: 16, border: '1.5px solid var(--accent)', background: 'var(--accent-glow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>
                  {editingUnit ? `Edit Unit ${editingUnit}` : 'New Unit'}
                </span>
                <button onClick={() => { setShowUnitForm(false); setEditingUnit(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={saveUnit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Unit No. *</label>
                    <input required type="number" min="1" max="10" className="form-input" placeholder="e.g. 1"
                      value={unitForm.unitNumber}
                      onChange={e => setUnitForm({ ...unitForm, unitNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Title *</label>
                    <input required className="form-input" placeholder="e.g. Introduction to Computer Networks"
                      value={unitForm.title}
                      onChange={e => setUnitForm({ ...unitForm, title: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Topics (one per line)</label>
                  <textarea className="form-input" rows={4}
                    placeholder={"OSI Model\nTCP/IP Protocol Suite\nNetwork Topologies"}
                    value={unitForm.topics}
                    onChange={e => setUnitForm({ ...unitForm, topics: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}
                    onClick={() => { setShowUnitForm(false); setEditingUnit(null) }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }} disabled={addingUnit}>
                    {addingUnit ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Saving…</> : <><Save size={13} /> {editingUnit ? 'Update Unit' : 'Save Unit'}</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!syllabus?.units?.length ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No units added yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Click "Add Unit" to start building the syllabus</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {syllabus.units.map(unit => (
                <div key={unit.unitNumber} className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: unit.topics?.length ? 10 : 0 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }}>
                        U{unit.unitNumber}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Unit {unit.unitNumber}: {unit.title}
                        </div>
                        {unit.topics?.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {unit.topics.length} topic{unit.topics.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => startEditUnit(unit)}>
                        <PenLine size={12} /> Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => deleteUnit(unit.unitNumber)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {unit.topics?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {unit.topics.map((topic, i) => (
                        <span key={i} className="chip" style={{ fontSize: '0.75rem' }}>{topic}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MST VIEW ══ */}
      {activeView === 'mst' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
            MST (Mid-Semester Test) Syllabus
          </h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[1, 2].map(n => (
              <button key={n}
                onClick={() => {
                  const existing = syllabus?.mstSyllabus?.find(m => m.mstNumber === n)
                  setMstForm({
                    mstNumber:     n,
                    syllabus:      existing?.syllabus || '',
                    units:         (existing?.units || []).join(', '),
                    scheduledDate: existing?.scheduledDate || '',
                  })
                }}
                style={{
                  padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                  border: 'none',
                  background: mstForm.mstNumber === n ? 'var(--accent)' : 'var(--bg-elevated)',
                  color:      mstForm.mstNumber === n ? '#fff' : 'var(--text-secondary)',
                  boxShadow:  mstForm.mstNumber === n ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                  transition: 'all 0.15s',
                }}>
                MST-{n}
              </button>
            ))}
          </div>

          {syllabus?.mstSyllabus?.map(m => (
            <div key={m.mstNumber} style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 10,
              background: m.mstNumber === 1 ? '#eff6ff' : '#fdf4ff',
              border: `1.5px solid ${m.mstNumber === 1 ? '#bfdbfe' : '#e9d5ff'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: m.mstNumber === 1 ? '#1d4ed8' : '#7c3aed', fontSize: '0.9rem' }}>
                  MST-{m.mstNumber} {m.scheduledDate && `— 📅 ${m.scheduledDate}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Units: {(m.units || []).join(', ') || 'Not specified'}
                </span>
              </div>
              {m.syllabus && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{m.syllabus}</p>
              )}
            </div>
          ))}

          <div className="card" style={{ borderColor: mstForm.mstNumber === 1 ? '#bfdbfe' : '#e9d5ff', background: mstForm.mstNumber === 1 ? '#f8fbff' : '#fdf7ff' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14, color: mstForm.mstNumber === 1 ? '#1d4ed8' : '#7c3aed' }}>
              {syllabus?.mstSyllabus?.find(m => m.mstNumber === mstForm.mstNumber) ? 'Update' : 'Add'} MST-{mstForm.mstNumber} Details
            </h4>
            <form onSubmit={saveMst} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input type="date" className="form-input"
                    value={mstForm.scheduledDate}
                    onChange={e => setMstForm({ ...mstForm, scheduledDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Units Covered (e.g. 1, 2, 3)</label>
                  <input className="form-input" placeholder="1, 2, 3"
                    value={mstForm.units}
                    onChange={e => setMstForm({ ...mstForm, units: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Syllabus / Topics for MST-{mstForm.mstNumber}</label>
                <textarea className="form-input" rows={5}
                  placeholder={`Describe the topics covered in MST-${mstForm.mstNumber}.`}
                  value={mstForm.syllabus}
                  onChange={e => setMstForm({ ...mstForm, syllabus: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={savingMst} style={{ fontSize: '0.85rem' }}>
                  {savingMst ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save MST-{mstForm.mstNumber}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ SUMMARY VIEW ══ */}
      {activeView === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            {[
              { label: 'Subject',       value: profile?.subject || '—'            },
              { label: 'Subject Code',  value: profile?.subjectCode || '—'        },
              { label: 'Units Added',   value: syllabus?.units?.length || 0        },
              { label: 'MST Entries',   value: syllabus?.mstSyllabus?.length || 0 },
              { label: 'Academic Year', value: academicYear                        },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Reference Books</h4>
            <textarea className="form-input" rows={4}
              placeholder={"One book per line:\nData Communications and Networking — Forouzan\nComputer Networks — Tanenbaum"}
              value={refBooks}
              onChange={e => setRefBooks(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          <div className="card">
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>End-Semester Additional Notes</h4>
            <textarea className="form-input" rows={4}
              placeholder="Topics or chapters added for end-semester exam beyond regular units…"
              value={endSemTopics}
              onChange={e => setEndSemTopics(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={saveExtras} disabled={saving} style={{ fontSize: '0.875rem' }}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Summary</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main FacultyDashboard ────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const { user } = useAuth()

  const [profile,         setProfile]         = useState(null)
  const [profileLoading,  setProfileLoading]  = useState(true)
  const [students,        setStudents]        = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [searchEnroll,    setSearchEnroll]    = useState('')
  const [searchName,      setSearchName]      = useState('')
  const [tab,             setTab]             = useState('overview')

  const [attDate,        setAttDate]        = useState(today())
  const [attendance,     setAttendance]     = useState({})
  const [submittingAtt,  setSubmittingAtt]  = useState(false)
  const [attLoading,     setAttLoading]     = useState(false)

  const [marksForm,      setMarksForm]      = useState({ enrollmentNumber: '', theoryMarks: '', practicalMarks: '' })
  const [savingMarks,    setSavingMarks]    = useState(false)
  const [excelFile,      setExcelFile]      = useState(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [uploadResult,   setUploadResult]   = useState(null)
  const [marksList,      setMarksList]      = useState([])
  const [marksLoading,   setMarksLoading]   = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    API.get('/faculty/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Could not load faculty profile'))
      .finally(() => setProfileLoading(false))
  }, [])

  const fetchStudents = (enroll = '', name = '') => {
    setStudentsLoading(true)
    const params = {}
    if (enroll) params.enrollmentNumber = enroll
    if (name)   params.name = name
    API.get('/faculty/students', { params })
      .then(r => {
        const list = r.data.data || []
        setStudents(list)
        const map = {}
        list.forEach(s => { map[s.enrollmentNumber] = 'Present' })
        setAttendance(map)
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setStudentsLoading(false))
  }
  useEffect(() => { fetchStudents() }, [])

  const fetchAttendance = (date) => {
    setAttLoading(true)
    API.get('/faculty/attendance', { params: { date } })
      .then(r => {
        const records = r.data.data || []
        const map = {}
        students.forEach(s => { map[s.enrollmentNumber] = 'Present' })
        records.forEach(rec => { map[rec.enrollmentNumber] = rec.status })
        setAttendance(map)
      })
      .catch(() => {})
      .finally(() => setAttLoading(false))
  }
  useEffect(() => {
    if (tab === 'attendance' && students.length > 0) fetchAttendance(attDate)
  }, [tab, attDate, students.length])

  const fetchMarks = () => {
    setMarksLoading(true)
    API.get('/faculty/marks')
      .then(r => setMarksList(r.data.data || []))
      .catch(() => {})
      .finally(() => setMarksLoading(false))
  }
  useEffect(() => { if (tab === 'marks') fetchMarks() }, [tab])

  const submitAttendance = async () => {
    if (!students.length) return toast.error('No students loaded')
    setSubmittingAtt(true)
    try {
      const records = students.map(s => ({
        enrollmentNumber: s.enrollmentNumber,
        date:   attDate,
        status: attendance[s.enrollmentNumber] || 'Present'
      }))
      await API.post('/faculty/attendance', { records })
      toast.success(`Attendance saved for ${records.length} students!`)
      fetchAttendance(attDate)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance')
    } finally {
      setSubmittingAtt(false)
    }
  }

  const submitManualMarks = async (e) => {
    e.preventDefault()
    if (!marksForm.enrollmentNumber) return toast.error('Enrollment number required')
    setSavingMarks(true)
    try {
      await API.post('/faculty/manual-marks', {
        enrollmentNumber: marksForm.enrollmentNumber.toUpperCase(),
        theoryMarks:      parseFloat(marksForm.theoryMarks)    || 0,
        practicalMarks:   parseFloat(marksForm.practicalMarks) || 0,
      })
      toast.success('Marks saved!')
      setMarksForm({ enrollmentNumber: '', theoryMarks: '', practicalMarks: '' })
      fetchMarks()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save marks')
    } finally {
      setSavingMarks(false)
    }
  }

  const uploadExcel = async () => {
    if (!excelFile) return toast.error('Select a file first')
    setUploadingExcel(true); setUploadResult(null)
    try {
      const fd = new FormData(); fd.append('file', excelFile)
      const { data } = await API.post('/faculty/upload-marks', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadResult(data)
      toast.success(`Saved: ${data.data?.saved?.length || 0} records`)
      setExcelFile(null); fetchMarks()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingExcel(false)
    }
  }

  if (profileLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )
  if (!profile) return (
    <div className="card" style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
      Faculty profile not found. Contact the administrator.
    </div>
  )

  const present = students.filter(s => attendance[s.enrollmentNumber] === 'Present').length
  const absent  = students.length - present

  const tabs = [
    { id: 'overview',   label: 'Overview',       icon: BookOpen      },
    { id: 'attendance', label: 'Mark Attendance', icon: ClipboardList },
    { id: 'att_calc',   label: 'Att. Calculator', icon: Calculator    },
    { id: 'marks',      label: 'Marks',           icon: PenLine       },
    { id: 'syllabus',   label: 'Syllabus',        icon: BookMarked    },
  ]

  return (
    <div className="page-enter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header Banner ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #9d5cf5 100%)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 24,
        boxShadow: '0 8px 32px rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
            {profile.name?.charAt(0)}
          </div>
          <div style={{ flex: 1, color: '#fff' }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{profile.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Faculty ID: {profile.facultyId}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                📚 {profile.subject}
              </span>
              {profile.subjectCode && (
                <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                  {profile.subjectCode}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{students.length}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff' }}>Students</div>
          </div>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatBox icon={Users}       label="Total Students" value={students.length} color="#7c3aed" />
        <StatBox icon={CheckCircle} label="Present Today"  value={present}         color="#059669" />
        <StatBox icon={XCircle}     label="Absent Today"   value={absent}          color="#dc2626" />
        <StatBox icon={PenLine}     label="Marks Entered"  value={marksList.length}color="#2563eb" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, background: '#fff', padding: 6, borderRadius: 16, border: '1px solid #e2e8f0', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,.06)', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.18s',
              background: active ? '#7c3aed' : 'transparent',
              color:      active ? '#fff' : '#64748b',
              boxShadow:  active ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
            }}>
              <t.icon size={14} />{t.label}
            </button>
          )
        })}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {tab === 'overview' && (
        <div>
          <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 180 }}>
                <label className="form-label">Search by Enrollment</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" placeholder="0101IT221001" value={searchEnroll}
                    onChange={e => setSearchEnroll(e.target.value)}
                    style={{ paddingLeft: 32 }}
                    onKeyDown={e => { if (e.key === 'Enter') fetchStudents(searchEnroll, searchName) }} />
                </div>
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: 180 }}>
                <label className="form-label">Search by Name</label>
                <input className="form-input" placeholder="Student name…" value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchStudents(searchEnroll, searchName) }} />
              </div>
              <button className="btn btn-primary" onClick={() => fetchStudents(searchEnroll, searchName)} style={{ marginBottom: 1 }}>
                <Search size={14} /> Search
              </button>
              <button className="btn btn-ghost" onClick={() => { setSearchEnroll(''); setSearchName(''); fetchStudents() }} style={{ marginBottom: 1 }}>
                <RefreshCw size={14} /> Reset
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>4th Year IT Students — {profile.subject}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{students.length} students</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Enrollment No.</th><th>Name</th><th>Division</th><th>CGPA</th><th>Technical Skills</th><th>Placement Status</th></tr>
                </thead>
                <tbody>
                  {studentsLoading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span></div>
                    </td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found</td></tr>
                  ) : students.map((s, i) => {
                    const c = cgpaColor(s.cgpa)
                    return (
                      <tr key={s._id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, background: '#1e293b', color: '#7dd3fc', padding: '2px 7px', borderRadius: 6 }}>{s.enrollmentNumber}</span></td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</td>
                        <td>{s.division}</td>
                        <td><span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: 7, background: c.bg, color: c.color }}>{s.cgpa?.toFixed(2)}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {s.technicalSkills?.slice(0, 3).map(sk => <span key={sk} className="chip" style={{ fontSize: '0.7rem' }}>{sk}</span>)}
                            {(s.technicalSkills?.length || 0) > 3 && <span className="chip" style={{ fontSize: '0.7rem' }}>+{s.technicalSkills.length - 3}</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${s.placementStatus === 'placed' ? 'badge-green' : s.placementStatus === 'in_process' ? 'badge-amber' : 'badge-muted'}`}>
                            {s.placementStatus?.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ ATTENDANCE TAB ══ */}
      {tab === 'attendance' && (
        <div>
          <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ width: 170 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#16a34a' }}>✓ Present: {present}</span>
                <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>✗ Absent: {absent}</span>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { const a = {}; students.forEach(s => { a[s.enrollmentNumber] = 'Present' }); setAttendance(a) }}>All Present</button>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { const a = {}; students.forEach(s => { a[s.enrollmentNumber] = 'Absent' }); setAttendance(a) }}>All Absent</button>
                <button className="btn btn-primary" onClick={submitAttendance} disabled={submittingAtt}>
                  {submittingAtt ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><CheckCircle size={14} /> Save Attendance</>}
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Subject: <strong style={{ color: 'var(--text-primary)' }}>{profile.subject}</strong> {profile.subjectCode && `(${profile.subjectCode})`} — Click row to toggle
            </div>
            {attLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
              </div>
            ) : (
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students loaded.</div>
                ) : students.map(s => {
                  const status = attendance[s.enrollmentNumber] || 'Present'
                  const isPresent = status === 'Present'
                  return (
                    <div key={s.enrollmentNumber}
                      onClick={() => setAttendance(prev => ({ ...prev, [s.enrollmentNumber]: isPresent ? 'Absent' : 'Present' }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: isPresent ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${isPresent ? '#bbf7d0' : '#fecdd3'}`, transition: 'all 0.15s' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: isPresent ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: isPresent ? '#16a34a' : '#dc2626', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
                        {s.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{s.enrollmentNumber}</div>
                      </div>
                      <div style={{ width: 44, height: 24, borderRadius: 99, position: 'relative', background: isPresent ? '#16a34a' : '#cbd5e1', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', left: isPresent ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, minWidth: 52, textAlign: 'right', color: isPresent ? '#16a34a' : '#dc2626' }}>{status}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ATTENDANCE CALCULATOR TAB ══ */}
      {tab === 'att_calc' && <AttendanceCalculatorTab profile={profile} />}

      {/* ══ MARKS TAB ══ */}
      {tab === 'marks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <PenLine size={15} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Manual Marks Entry</span>
            </div>
            <form onSubmit={submitManualMarks} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Enrollment Number *</label>
                <input required className="form-input" placeholder="e.g. 0101IT221001"
                  value={marksForm.enrollmentNumber}
                  onChange={e => setMarksForm({ ...marksForm, enrollmentNumber: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Theory (0–100)</label>
                  <input type="number" min="0" max="100" className="form-input" placeholder="e.g. 75"
                    value={marksForm.theoryMarks}
                    onChange={e => setMarksForm({ ...marksForm, theoryMarks: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Practical (0–100)</label>
                  <input type="number" min="0" max="100" className="form-input" placeholder="e.g. 48"
                    value={marksForm.practicalMarks}
                    onChange={e => setMarksForm({ ...marksForm, practicalMarks: e.target.value })} />
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Subject: <strong style={{ color: 'var(--text-primary)' }}>{profile.subject}</strong>
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingMarks} style={{ justifyContent: 'center' }}>
                {savingMarks ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><PenLine size={14} /> Save Marks</>}
              </button>
            </form>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <FileSpreadsheet size={15} color="var(--blue)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Upload Marks via Excel</span>
            </div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Required Excel columns:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['EnrollmentNumber', 'TheoryMarks', 'PracticalMarks'].map(col => (
                  <span key={col} style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: '#1e293b', color: '#7dd3fc', padding: '2px 7px', borderRadius: 5 }}>{col}</span>
                ))}
              </div>
            </div>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${excelFile ? '#16a34a' : 'var(--border-light)'}`, borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, background: excelFile ? '#f0fdf4' : 'var(--bg-elevated)', transition: 'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { setExcelFile(e.target.files[0]); setUploadResult(null) }} />
              <FileSpreadsheet size={32} color={excelFile ? '#16a34a' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
              {excelFile ? (
                <>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>{excelFile.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(excelFile.size / 1024).toFixed(1)} KB</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Click to select Excel file</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>.xlsx or .xls only</div>
                </>
              )}
            </div>
            <button className="btn btn-primary" onClick={uploadExcel} disabled={!excelFile || uploadingExcel} style={{ width: '100%', justifyContent: 'center' }}>
              {uploadingExcel ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</> : <><Upload size={14} /> Upload & Process</>}
            </button>
            {uploadResult && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10, fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>✓ Saved: {uploadResult.data?.saved?.length || 0}</div>
                {uploadResult.data?.notFound?.length > 0 && <div style={{ color: 'var(--red)' }}>✗ Not found: {uploadResult.data.notFound.join(', ')}</div>}
              </div>
            )}
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PenLine size={15} color="var(--blue)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Entered Marks — {profile.subject}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{marksList.length} records</span>
              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={fetchMarks}><RefreshCw size={12} /></button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Enrollment No.</th><th>Theory</th><th>Practical</th><th>Total</th><th>Via</th><th>Updated</th></tr></thead>
                <tbody>
                  {marksLoading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  ) : marksList.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No marks entered yet</td></tr>
                  ) : marksList.map(m => (
                    <tr key={m._id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, background: '#1e293b', color: '#7dd3fc', padding: '2px 7px', borderRadius: 6 }}>{m.enrollmentNumber}</span></td>
                      <td style={{ fontWeight: 700 }}>{m.theoryMarks ?? '—'}</td>
                      <td style={{ fontWeight: 700 }}>{m.practicalMarks ?? '—'}</td>
                      <td><span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--accent)' }}>{(m.theoryMarks || 0) + (m.practicalMarks || 0)}</span></td>
                      <td>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: m.uploadedVia === 'excel' ? '#dcfce7' : '#dbeafe', color: m.uploadedVia === 'excel' ? '#16a34a' : '#1d4ed8' }}>
                          {m.uploadedVia}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ SYLLABUS TAB ══ */}
      {tab === 'syllabus' && <SyllabusTab profile={profile} />}
    </div>
  )
}