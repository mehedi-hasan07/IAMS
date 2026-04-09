import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'
import './StudentRegisterPage.css'

const LOCATIONS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse', 'Any']
const ATTACHMENT_TYPES = [
  'Software Development',
  'Networking & IT',
  'Data Science',
  'IT Support',
  'Cybersecurity',
]

export default function StudentRegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    skills: '',
    location: 'Gaborone',
    attachmentType: 'Software Development',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!form.firstName || !form.lastName || !form.studentId || !form.email) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      // Save to Firestore 'students' collection
      await addDoc(collection(db, 'students'), {
        ...form,
        status: 'unmatched', // default — will change once matched in Sprint 2
        registeredAt: new Date().toISOString(),
      })
      setSuccess(true)
      setTimeout(() => navigate('/students'), 1500)
    } catch (err) {
      console.error(err)
      setError('Failed to save student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Register student</h2>
          <p className="page-sub">US-02 — Saves to Firestore &apos;students&apos; collection</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/students')}>
          ← Back to students
        </button>
      </div>

      <div className="reg-card">
        {error && <div className="reg-error">{error}</div>}
        {success && (
          <div className="reg-success">
            Student registered successfully! Redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit} className="reg-form">
          {/* Name row */}
          <div className="reg-row">
            <div className="form-group">
              <label htmlFor="firstName">First name *</label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Thabo"
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
                placeholder="e.g. Mokoena"
                required
              />
            </div>
          </div>

          {/* ID + Email row */}
          <div className="reg-row">
            <div className="form-group">
              <label htmlFor="studentId">Student ID *</label>
              <input
                id="studentId"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                placeholder="e.g. 202301001"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="student@ub.ac.bw"
                required
              />
            </div>
          </div>

          <hr className="reg-divider" />

          {/* Skills */}
          <div className="form-group">
            <label htmlFor="skills">Preferred skills</label>
            <input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Firebase, Python (comma-separated)"
            />
            <span className="field-hint">Comma-separated list of skills</span>
          </div>

          {/* Location + Attachment type row */}
          <div className="reg-row">
            <div className="form-group">
              <label htmlFor="location">Preferred location</label>
              <select
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
              >
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="attachmentType">Attachment type</label>
              <select
                id="attachmentType"
                name="attachmentType"
                value={form.attachmentType}
                onChange={handleChange}
              >
                {ATTACHMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Additional notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any extra information about the student's preferences…"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="reg-actions">
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={loading || success}
            >
              {loading ? 'Saving…' : 'Save to Firestore'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/students')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
