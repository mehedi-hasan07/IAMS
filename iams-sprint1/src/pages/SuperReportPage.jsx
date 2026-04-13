import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const RATING_FIELDS = [
  { key: 'technicalSkills', label: 'Technical Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'teamwork', label: 'Teamwork' },
]

const DEFAULT_RATINGS = {
  technicalSkills: 0,
  communication: 0,
  punctuality: 0,
  initiative: 0,
  teamwork: 0,
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star ${n <= (hovered || value) ? 'filled' : 'empty'}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: '0 2px',
            color: n <= (hovered || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >
          ★
        </button>
      ))}
      <span className="muted" style={{ fontSize: '0.82rem', marginLeft: '0.4rem' }}>
        {value > 0 ? `${value}/5` : 'Not rated'}
      </span>
    </div>
  )
}

export default function SuperReportPage() {
  const { user } = useAuth()

  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [reportType, setReportType] = useState('')
  const [ratings, setRatings] = useState({ ...DEFAULT_RATINGS })
  const [comments, setComments] = useState('')
  const [recommendation, setRecommendation] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    async function fetchStudents() {
      try {
        const snap = await getDocs(
          query(collection(db, 'students'), where('status', '==', 'matched'))
        )
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Fetch students error:', err)
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [user])

  function setRating(field, value) {
    setRatings(prev => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setSelectedStudentId('')
    setReportType('')
    setRatings({ ...DEFAULT_RATINGS })
    setComments('')
    setRecommendation('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!selectedStudentId) {
      setError('Please select a student.')
      return
    }
    if (!reportType) {
      setError('Please select a report type.')
      return
    }
    const unrated = RATING_FIELDS.filter(f => ratings[f.key] === 0)
    if (unrated.length > 0) {
      setError(`Please rate: ${unrated.map(f => f.label).join(', ')}.`)
      return
    }
    if (!comments.trim()) {
      setError('Please enter comments.')
      return
    }
    if (!recommendation) {
      setError('Please select a recommendation.')
      return
    }

    const selectedStudent = students.find(s => s.id === selectedStudentId)
    if (!selectedStudent) {
      setError('Selected student not found.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        studentEmail: selectedStudent.email,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        supervisorEmail: user.email,
        supervisorName: user.email,
        organisation: selectedStudent.matchedOrgName || '—',
        reportType,
        technicalSkills: ratings.technicalSkills,
        communication: ratings.communication,
        punctuality: ratings.punctuality,
        initiative: ratings.initiative,
        teamwork: ratings.teamwork,
        comments: comments.trim(),
        recommendation,
        submittedAt: new Date().toISOString(),
      })
      setSuccess(true)
      resetForm()
    } catch (err) {
      console.error('Submit report error:', err)
      setError('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Evaluation Report</h1>
          <p className="page-sub">Evaluate a student's performance during attachment</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        {success && (
          <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
            Report submitted successfully!
          </div>
        )}
        {error && (
          <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>
        )}

        <form className="reg-form" onSubmit={handleSubmit}>
          {/* Student select */}
          <div className="form-group">
            <label htmlFor="student-select">Student</label>
            {loadingStudents ? (
              <p className="muted">Loading students…</p>
            ) : (
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">— Select a student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.studentId || s.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Report type */}
          <div className="form-group">
            <label htmlFor="report-type">Report Type</label>
            <select
              id="report-type"
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              required
            >
              <option value="">— Select report type —</option>
              <option value="Mid-term Evaluation">Mid-term Evaluation</option>
              <option value="Final Evaluation">Final Evaluation</option>
            </select>
          </div>

          <div className="form-divider" />

          {/* Star ratings */}
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>Performance Ratings</h3>
          {RATING_FIELDS.map(field => (
            <div className="form-group" key={field.key}>
              <label>{field.label}</label>
              <StarRating
                value={ratings[field.key]}
                onChange={val => setRating(field.key, val)}
              />
            </div>
          ))}

          <div className="form-divider" />

          {/* Comments */}
          <div className="form-group">
            <label htmlFor="comments">Comments <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              id="comments"
              rows={4}
              placeholder="Provide detailed feedback on the student's performance…"
              value={comments}
              onChange={e => setComments(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Recommendation */}
          <div className="form-group">
            <label htmlFor="recommendation">Recommendation</label>
            <select
              id="recommendation"
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              required
            >
              <option value="">— Select recommendation —</option>
              <option value="Highly recommended">Highly recommended</option>
              <option value="Recommended">Recommended</option>
              <option value="Satisfactory performance">Satisfactory performance</option>
              <option value="Needs improvement">Needs improvement</option>
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
