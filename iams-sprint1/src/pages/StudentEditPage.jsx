import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

const LOCATIONS = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse',
  'Serowe', 'Kanye', 'Molepolole', 'Palapye', 'Selibe Phikwe',
  'Jwaneng', 'Sowa Town', 'Ramotswa', 'Tlokweng', 'Any',
]
const ATTACHMENT_TYPES = [
  'Software Development',
  'Networking & IT',
  'Data Science',
  'IT Support',
  'Cybersecurity',
]

export default function StudentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '', lastName: '', studentId: '', email: '',
    skills: '', location: 'Gaborone', attachmentType: 'Software Development', notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'students', id))
        if (!snap.exists()) {
          setNotFound(true)
          return
        }
        const data = snap.data()
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          studentId: data.studentId ?? '',
          email: data.email ?? '',
          skills: data.skills ?? '',
          location: data.location ?? 'Gaborone',
          attachmentType: data.attachmentType ?? 'Software Development',
          notes: data.notes ?? '',
        })
      } catch (err) {
        console.error(err)
        setError('Failed to load student data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'students', id), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        skills: form.skills,
        location: form.location,
        attachmentType: form.attachmentType,
        notes: form.notes,
        updatedAt: new Date().toISOString(),
      })
      setSuccess(true)
      setTimeout(() => navigate('/students'), 1500)
    } catch (err) {
      console.error(err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${form.firstName} ${form.lastName}? This action cannot be undone.`
    )
    if (!confirmed) return
    try {
      await deleteDoc(doc(db, 'students', id))
      navigate('/students')
    } catch (err) {
      console.error(err)
      setError('Failed to delete student. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state"><p className="empty-text">Loading student…</p></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p className="empty-text">Student not found.</p>
          <button className="btn-secondary" onClick={() => navigate('/students')}>Back to students</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Edit Student</h2>
          <p className="page-sub">{form.firstName} {form.lastName}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/students')}>
          ← Back to students
        </button>
      </div>

      <div className="card" style={{ maxWidth: '760px' }}>
        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">Changes saved successfully! Redirecting…</div>}

        <form onSubmit={handleSubmit} className="reg-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name *</label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name *</label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                name="studentId"
                value={form.studentId}
                readOnly
                style={{ background: 'var(--surface-alt, #f3f4f6)', cursor: 'not-allowed' }}
              />
              <span className="field-hint">Student ID cannot be changed</span>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <hr className="form-divider" />

          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Firebase, Python (comma-separated)"
            />
            <span className="field-hint">Comma-separated list of skills</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Preferred location</label>
              <select id="location" name="location" value={form.location} onChange={handleChange}>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="attachmentType">Attachment type</label>
              <select id="attachmentType" name="attachmentType" value={form.attachmentType} onChange={handleChange}>
                {ATTACHMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes…"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary-sm" disabled={saving || success}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/students')}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
              style={{ marginLeft: 'auto' }}
            >
              Delete Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
