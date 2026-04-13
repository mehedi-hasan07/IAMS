import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

export default function SuperLogbooksPage() {
  const { user } = useAuth()

  const [logbooks, setLogbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [successIds, setSuccessIds] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchLogbooks()
  }, [user])

  async function fetchLogbooks() {
    setLoading(true)
    try {
      const q = query(collection(db, 'logbooks'), orderBy('submittedAt', 'desc'))
      const snap = await getDocs(q)
      setLogbooks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Logbooks fetch error:', err)
      setError('Failed to load logbooks.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment(logbookId) {
    const comment = (comments[logbookId] || '').trim()
    if (!comment) {
      setError('Please enter a comment before submitting.')
      return
    }
    setError('')
    setSubmitting(prev => ({ ...prev, [logbookId]: true }))
    try {
      await updateDoc(doc(db, 'logbooks', logbookId), {
        supervisorComment: comment,
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
      })
      setSuccessIds(prev => [...prev, logbookId])
      // Update local state
      setLogbooks(prev =>
        prev.map(l =>
          l.id === logbookId
            ? { ...l, supervisorComment: comment, status: 'reviewed', reviewedAt: new Date().toISOString() }
            : l
        )
      )
      setComments(prev => ({ ...prev, [logbookId]: '' }))
    } catch (err) {
      console.error('Submit comment error:', err)
      setError('Failed to submit comment. Please try again.')
    } finally {
      setSubmitting(prev => ({ ...prev, [logbookId]: false }))
    }
  }

  function formatDate(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const needsAction = logbooks.filter(l => l.status === 'submitted')
  const reviewed = logbooks.filter(l => l.status === 'reviewed')

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading logbooks…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logbook Review</h1>
          <p className="page-sub">
            {needsAction.length} pending review · {reviewed.length} reviewed
          </p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Needs Action */}
      {needsAction.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 className="section-title">Pending Review</h2>
          {needsAction.map(logbook => (
            <div className="logbook-entry needs-action" key={logbook.id}>
              <div className="logbook-meta">
                <span className="logbook-week">Week {logbook.week}</span>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Submitted: {formatDate(logbook.submittedAt)}
                </span>
                <span className="badge badge--warn" style={{ marginLeft: 'auto' }}>Awaiting Review</span>
              </div>

              <div className="logbook-title">{logbook.title}</div>
              <div className="logbook-body">{logbook.content}</div>

              <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
                Student: <strong>{logbook.studentEmail}</strong>
              </p>

              {successIds.includes(logbook.id) ? (
                <div className="alert-success" style={{ marginTop: '0.75rem' }}>
                  Comment submitted successfully.
                </div>
              ) : (
                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.35rem' }}>
                    Supervisor Comment
                  </label>
                  <textarea
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }}
                    placeholder="Write your feedback for the student…"
                    value={comments[logbook.id] || ''}
                    onChange={e =>
                      setComments(prev => ({ ...prev, [logbook.id]: e.target.value }))
                    }
                  />
                  <div className="form-actions" style={{ marginTop: '0.6rem' }}>
                    <button
                      className="btn-primary-sm"
                      disabled={submitting[logbook.id]}
                      onClick={() => handleSubmitComment(logbook.id)}
                    >
                      {submitting[logbook.id] ? 'Submitting…' : 'Submit Comment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Reviewed */}
      <section>
        <h2 className="section-title">Reviewed</h2>
        {reviewed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No reviewed logbooks yet.</div>
          </div>
        ) : (
          reviewed.map(logbook => (
            <div className="logbook-entry" key={logbook.id}>
              <div className="logbook-meta">
                <span className="logbook-week">Week {logbook.week}</span>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Submitted: {formatDate(logbook.submittedAt)}
                </span>
                <span className="badge badge--success" style={{ marginLeft: 'auto' }}>Reviewed</span>
              </div>

              <div className="logbook-title">{logbook.title}</div>
              <div className="logbook-body">{logbook.content}</div>

              <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
                Student: <strong>{logbook.studentEmail}</strong>
              </p>

              {logbook.supervisorComment && (
                <div className="logbook-comment">
                  <span className="logbook-comment-author">Supervisor Feedback:</span>{' '}
                  {logbook.supervisorComment}
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {logbooks.length === 0 && (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <div className="empty-icon">📓</div>
          <div className="empty-text">No logbooks have been submitted yet.</div>
        </div>
      )}
    </div>
  )
}
