import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const LOCATIONS = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse',
  'Serowe', 'Kanye', 'Molepolole', 'Palapye', 'Selibe Phikwe',
  'Jwaneng', 'Sowa Town', 'Ramotswa', 'Tlokweng', 'Any',
]

const ATTACHMENT_TYPES = [
  'Software Development', 'Networking & IT', 'Data Science', 'IT Support', 'Cybersecurity',
]

function StatusBadge({ status }) {
  const map = {
    matched:   'badge badge--success',
    pending:   'badge badge--warn',
    unmatched: 'badge badge--danger',
  }
  const cls = map[status] ?? 'badge badge--default'
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Registered'
  return <span className={cls}>{label}</span>
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  studentId: '',
  skills: '',
  location: '',
  attachmentType: '',
  notes: '',
}

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [docId, setDocId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [alert, setAlert] = useState(null) // { type: 'success' | 'error', msg }

  useEffect(() => {
    if (!user?.email) return
    async function fetchStudent() {
      try {
        const snap = await getDocs(collection(db, 'students'))
        const found = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .find(s => s.email === user.email)

        if (found) {
          setStudent(found)
          setDocId(found.id)
          const skillsStr = Array.isArray(found.skills)
            ? found.skills.join(', ')
            : found.skills ?? ''
          setForm({
            firstName: found.firstName ?? '',
            lastName: found.lastName ?? '',
            studentId: found.studentId ?? '',
            skills: skillsStr,
            location: found.location ?? '',
            attachmentType: found.attachmentType ?? '',
            notes: found.notes ?? '',
          })
        }
      } catch (err) {
        console.error('Error fetching student profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [user])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setSaving(true)

    const skillsArray = form.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      studentId: form.studentId.trim(),
      email: user.email,
      skills: skillsArray,
      location: form.location,
      attachmentType: form.attachmentType,
      notes: form.notes.trim(),
      status: student?.status ?? 'unmatched',
      updatedAt: new Date().toISOString(),
    }

    try {
      if (docId) {
        await setDoc(doc(db, 'students', docId), payload, { merge: true })
        setStudent(prev => ({ ...prev, ...payload }))
        setAlert({ type: 'success', msg: 'Profile updated successfully.' })
      } else {
        payload.createdAt = new Date().toISOString()
        const ref = await addDoc(collection(db, 'students'), payload)
        setDocId(ref.id)
        setStudent({ id: ref.id, ...payload })
        setAlert({ type: 'success', msg: 'Registration submitted successfully.' })
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setAlert({ type: 'error', msg: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading profile…</p>
      </div>
    )
  }

  const isNew = !student

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">{isNew ? 'Student Registration' : 'My Profile'}</h1>
          <p className="page-sub">
            {isNew
              ? 'Fill in your details to register for industrial attachment.'
              : 'Update your registration details below.'}
          </p>
        </div>
        {!isNew && <StatusBadge status={student?.status} />}
      </div>

      {alert && (
        <div className={alert.type === 'success' ? 'alert-success' : 'alert-error'} style={{ marginBottom: '1rem' }}>
          {alert.msg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {isNew ? 'Registration Form' : 'Edit Profile'}
          </span>
        </div>

        <form className="reg-form" onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {/* Name row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Ahmad"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g. Razali"
                required
              />
            </div>
          </div>

          {/* Student ID and Email */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={form.studentId}
                onChange={handleChange}
                placeholder="e.g. S12345"
                readOnly={!isNew}
                required
              />
              {!isNew && (
                <span className="field-hint">Student ID cannot be changed after registration.</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={user?.email ?? ''}
                readOnly
              />
              <span className="field-hint">Email is tied to your login account.</span>
            </div>
          </div>

          <div className="form-divider" />

          {/* Location and Attachment Type */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Preferred Location</label>
              <select
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
              >
                <option value="">— Select location —</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="attachmentType">Attachment Type</label>
              <select
                id="attachmentType"
                name="attachmentType"
                value={form.attachmentType}
                onChange={handleChange}
                required
              >
                <option value="">— Select type —</option>
                {ATTACHMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              name="skills"
              type="text"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, Python (comma-separated)"
            />
            <span className="field-hint">Separate skills with commas.</span>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional information for the coordinator…"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Submit Registration' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
