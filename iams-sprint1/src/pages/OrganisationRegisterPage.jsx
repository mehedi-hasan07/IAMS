import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

const INDUSTRIES = [
  'IT',
  'Finance & Banking',
  'Telecommunications',
  'Healthcare',
  'Education',
  'Government',
  'Other',
]

const LOCATIONS = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse',
  'Serowe', 'Kanye', 'Molepolole', 'Palapye', 'Selibe Phikwe',
  'Jwaneng', 'Sowa Town', 'Ramotswa', 'Tlokweng',
]

const ATTACHMENT_TYPES = [
  'Software Development',
  'Networking & IT',
  'Data Science',
  'IT Support',
  'Cybersecurity',
]

export default function OrganisationRegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    orgName: '',
    industry: 'IT',
    location: 'Gaborone',
    totalSlots: '',
    requiredSkills: '',
    contactPerson: '',
    contactEmail: '',
    notes: '',
  })
  const [attachmentTypes, setAttachmentTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function toggleAttachmentType(type) {
    setAttachmentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.orgName.trim()) {
      setError('Organisation name is required.')
      return
    }
    if (!form.totalSlots || isNaN(Number(form.totalSlots)) || Number(form.totalSlots) < 1) {
      setError('Please enter a valid number of slots (minimum 1).')
      return
    }
    if (!form.contactPerson.trim()) {
      setError('Contact person is required.')
      return
    }
    if (!form.contactEmail.trim()) {
      setError('Contact email is required.')
      return
    }

    setLoading(true)
    try {
      const slots = Number(form.totalSlots)
      await addDoc(collection(db, 'organisations'), {
        ...form,
        totalSlots: slots,
        availableSlots: slots,
        attachmentTypes,
        status: 'available',
        registeredAt: new Date().toISOString(),
      })
      setSuccess(true)
      setTimeout(() => navigate('/organisations'), 1500)
    } catch (err) {
      console.error(err)
      setError('Failed to register organisation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Register Organisation</h2>
          <p className="page-sub">Add a new host organisation to the system</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/organisations')}>
          ← Back to organisations
        </button>
      </div>

      <div className="card" style={{ maxWidth: '760px' }}>
        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">Organisation registered successfully! Redirecting…</div>}

        <form onSubmit={handleSubmit} className="reg-form">
          {/* Organisation Name */}
          <div className="form-group">
            <label htmlFor="orgName">Organisation name *</label>
            <input
              id="orgName"
              name="orgName"
              value={form.orgName}
              onChange={handleChange}
              placeholder="e.g. Botswana Innovation Hub"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select id="industry" name="industry" value={form.industry} onChange={handleChange}>
                {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <select id="location" name="location" value={form.location} onChange={handleChange}>
                {LOCATIONS.map((loc) => <option key={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="totalSlots">Total attachment slots *</label>
            <input
              id="totalSlots"
              name="totalSlots"
              type="number"
              min="1"
              value={form.totalSlots}
              onChange={handleChange}
              placeholder="e.g. 5"
              required
            />
          </div>

          <hr className="form-divider" />

          <div className="form-group">
            <label htmlFor="requiredSkills">Required skills</label>
            <input
              id="requiredSkills"
              name="requiredSkills"
              value={form.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. React, Python, SQL (comma-separated)"
            />
            <span className="field-hint">Comma-separated list of skills</span>
          </div>

          <div className="form-group">
            <label>Attachment types accepted</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {ATTACHMENT_TYPES.map((type) => (
                <label
                  key={type}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 400 }}
                >
                  <input
                    type="checkbox"
                    checked={attachmentTypes.includes(type)}
                    onChange={() => toggleAttachmentType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <hr className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactPerson">Contact person *</label>
              <input
                id="contactPerson"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Mr. Kabo Sithole"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactEmail">Contact email *</label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="contact@organisation.bw"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional information about the organisation…"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary-sm" disabled={loading || success}>
              {loading ? 'Saving…' : 'Register Organisation'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/organisations')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
