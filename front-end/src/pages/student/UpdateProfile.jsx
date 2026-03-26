import React from 'react'
import { useEffect, useState } from 'react'
import { useAuth, API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, X, Save, Code2, Briefcase, Award, FolderGit2, ChevronDown, ChevronUp } from 'lucide-react'

const TagInput = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i))
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input" style={{ flex: 1 }}
          value={input} placeholder={placeholder}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn btn-ghost" style={{ padding: '8px 14px' }} onClick={add}>
          <Plus size={14} />
        </button>
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {values.map((v, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
              fontSize: '0.78rem', color: 'var(--text-primary)'
            }}>
              {v}
              <button type="button" onClick={() => remove(i)} style={{ color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 0, background: 'none', border: 'none' }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const SectionHeader = ({ icon: Icon, title, color = 'var(--accent)', open, onToggle }) => (
  <button type="button" onClick={onToggle} style={{
    width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', background: 'none',
    border: 'none', cursor: 'pointer', padding: '0 0 14px',
    borderBottom: '1px solid var(--border)', marginBottom: 20
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
    </div>
    {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
  </button>
)

const emptyProject = { title: '', type: 'major', description: '', techStack: '', githubLink: '', year: new Date().getFullYear() }
const emptyCert    = { title: '', issuedBy: '', issueDate: '', credentialId: '' }
const emptyIntern  = { company: '', role: '', startDate: '', endDate: '', stipend: '', description: '', isCompleted: false }

export default function UpdateProfile() {
  const { user } = useAuth()

  const [technicalSkills,      setTechSkills]   = useState([])
  const [softSkills,           setSoftSkills]   = useState([])
  const [programmingLanguages, setProgLangs]    = useState([])
  const [achievements,         setAchievements] = useState([])
  const [projects,             setProjects]     = useState([])
  const [certifications,       setCerts]        = useState([])
  const [internships,          setInternships]  = useState([])

  const [newProject, setNewProject] = useState(emptyProject)
  const [newCert,    setNewCert]    = useState(emptyCert)
  const [newIntern,  setNewIntern]  = useState(emptyIntern)

  const [open, setOpen] = useState({ skills: true, projects: true, certs: true, internships: true, achievements: true })
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }))

  const [loading,       setLoading]       = useState(true)
  const [savingSkills,  setSavingSkills]  = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [savingCert,    setSavingCert]    = useState(false)
  const [savingIntern,  setSavingIntern]  = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.enrollmentNumber) return
        const { data } = await API.get(`/students/${user.enrollmentNumber}`)
        const s = data.data
        setTechSkills(s.technicalSkills || [])
        setSoftSkills(s.softSkills || [])
        setProgLangs(s.programmingLanguages || [])
        setAchievements(s.achievements || [])
        setProjects(s.projects || [])
        setCerts(s.certifications || [])
        setInternships(s.internships || [])
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    fetchProfile()
  }, [user])

  const saveSkills = async () => {
    setSavingSkills(true)
    try {
      await API.put(`/students/${user.enrollmentNumber}`, {
        technicalSkills, softSkills, programmingLanguages, achievements
      })
      toast.success('Profile saved!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed') }
    finally { setSavingSkills(false) }
  }

  const handleAddProject = async (e) => {
    e.preventDefault()
    setSavingProject(true)
    try {
      const payload = {
        ...newProject,
        year: parseInt(newProject.year),
        techStack: newProject.techStack.split(',').map(s => s.trim()).filter(Boolean)
      }
      const { data } = await API.post(`/students/${user.enrollmentNumber}/projects`, payload)
      setProjects(data.data)
      setNewProject(emptyProject)
      toast.success('Project added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingProject(false) }
  }

  const handleAddCert = async (e) => {
    e.preventDefault()
    setSavingCert(true)
    try {
      const { data } = await API.post(`/students/${user.enrollmentNumber}/certifications`, newCert)
      setCerts(data.data)
      setNewCert(emptyCert)
      toast.success('Certification added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingCert(false) }
  }

  const handleAddIntern = async (e) => {
    e.preventDefault()
    setSavingIntern(true)
    try {
      const updated = [...internships, { ...newIntern, stipend: parseFloat(newIntern.stipend) || 0 }]
      await API.put(`/students/${user.enrollmentNumber}`, { internships: updated })
      setInternships(updated)
      setNewIntern(emptyIntern)
      toast.success('Internship added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingIntern(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  return (
    <div className="page-enter" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Update Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Keep your profile updated to improve your AI Readiness Score</p>
      </div>

      {/* SKILLS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Code2} title="Skills & Languages" color="var(--accent)" open={open.skills} onToggle={() => toggle('skills')} />
        {open.skills && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <TagInput label="Technical Skills" values={technicalSkills} onChange={setTechSkills} placeholder="Type skill + Enter  e.g. React" />
            <TagInput label="Programming Languages" values={programmingLanguages} onChange={setProgLangs} placeholder="Type language + Enter  e.g. Python" />
            <TagInput label="Soft Skills" values={softSkills} onChange={setSoftSkills} placeholder="e.g. Leadership" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveSkills} disabled={savingSkills}>
                {savingSkills ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Skills</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROJECTS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={FolderGit2} title={`Projects (${projects.length})`} color="var(--blue)" open={open.projects} onToggle={() => toggle('projects')} />
        {open.projects && (
          <>
            {projects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {projects.map((p, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.title}</span>
                      <span className={`badge ${p.type === 'major' ? 'badge-amber' : 'badge-blue'}`}>{p.type}</span>
                      {p.year && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.year}</span>}
                    </div>
                    {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.description}</p>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.techStack?.map(t => <span key={t} className="chip" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                    </div>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: '0.75rem', color: 'var(--accent)' }}>GitHub →</a>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: projects.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: projects.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Project</p>
              <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input required className="form-input" placeholder="e.g. E-Commerce Website"
                      value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tech Stack (comma separated)</label>
                    <input className="form-input" placeholder="React, Node.js, MongoDB"
                      value={newProject.techStack} onChange={e => setNewProject({ ...newProject, techStack: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-input" min="2018" max="2030"
                      value={newProject.year} onChange={e => setNewProject({ ...newProject, year: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} placeholder="Brief description…"
                    value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Link</label>
                  <input className="form-input" placeholder="https://github.com/…"
                    value={newProject.githubLink} onChange={e => setNewProject({ ...newProject, githubLink: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProject}>
                    {savingProject ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Project</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* CERTIFICATIONS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Award} title={`Certifications (${certifications.length})`} color="var(--green)" open={open.certs} onToggle={() => toggle('certs')} />
        {open.certs && (
          <>
            {certifications.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {certifications.map((c, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.issuedBy} {c.issueDate && `· ${c.issueDate?.slice(0,7)}`}</div>
                    </div>
                    <span className="badge badge-green">Certified</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: certifications.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: certifications.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Certification</p>
              <form onSubmit={handleAddCert} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Certificate Title *</label>
                    <input required className="form-input" placeholder="e.g. AWS Cloud Practitioner"
                      value={newCert.title} onChange={e => setNewCert({ ...newCert, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issued By</label>
                    <input className="form-input" placeholder="e.g. Amazon Web Services"
                      value={newCert.issuedBy} onChange={e => setNewCert({ ...newCert, issuedBy: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input type="date" className="form-input"
                      value={newCert.issueDate} onChange={e => setNewCert({ ...newCert, issueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credential ID</label>
                    <input className="form-input" placeholder="Optional"
                      value={newCert.credentialId} onChange={e => setNewCert({ ...newCert, credentialId: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingCert}>
                    {savingCert ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Certification</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* INTERNSHIPS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Briefcase} title={`Internships (${internships.length})`} color="var(--purple)" open={open.internships} onToggle={() => toggle('internships')} />
        {open.internships && (
          <>
            {internships.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {internships.map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>{n.role}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@ {n.company}</span>
                      {n.isCompleted && <span className="badge badge-green">Completed</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {n.startDate?.slice(0,7)} → {n.endDate?.slice(0,7)} {n.stipend > 0 && `· ₹${n.stipend}/month`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: internships.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: internships.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Internship</p>
              <form onSubmit={handleAddIntern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <input required className="form-input" placeholder="e.g. TCS"
                      value={newIntern.company} onChange={e => setNewIntern({ ...newIntern, company: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" placeholder="e.g. Web Developer Intern"
                      value={newIntern.role} onChange={e => setNewIntern({ ...newIntern, role: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input"
                      value={newIntern.startDate} onChange={e => setNewIntern({ ...newIntern, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input"
                      value={newIntern.endDate} onChange={e => setNewIntern({ ...newIntern, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stipend (₹/month)</label>
                    <input type="number" className="form-input" placeholder="e.g. 10000"
                      value={newIntern.stipend} onChange={e => setNewIntern({ ...newIntern, stipend: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={String(newIntern.isCompleted)} onChange={e => setNewIntern({ ...newIntern, isCompleted: e.target.value === 'true' })}>
                      <option value="false">Ongoing</option>
                      <option value="true">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} placeholder="What you worked on…"
                    value={newIntern.description} onChange={e => setNewIntern({ ...newIntern, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingIntern}>
                    {savingIntern ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Internship</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ACHIEVEMENTS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Award} title={`Achievements (${achievements.length})`} color="var(--amber)" open={open.achievements} onToggle={() => toggle('achievements')} />
        {open.achievements && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {achievements.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {achievements.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a}</span>
                    <button type="button" onClick={() => setAchievements(achievements.filter((_, j) => j !== i))} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <TagInput values={achievements} onChange={setAchievements} placeholder="e.g. Won Hackathon 2024" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveSkills} disabled={savingSkills}>
                {savingSkills ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Achievements</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}