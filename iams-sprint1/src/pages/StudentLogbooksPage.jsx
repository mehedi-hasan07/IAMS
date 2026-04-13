import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

function StatusBadge({ status }) {
  const map = {
    submitted: 'badge badge--blue',
    reviewed:  'badge badge--success',
    rejected:  'badge badge--danger',
    pending:   'badge badge--warn',
  }
  const cls = map[status] ?? 'badge badge--default'
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  return <span className={cls}>{label}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function StudentLogbooksPage() {
  const { user } = useAuth()
  const [logbooks, setLogbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)

  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  useEffect(() => {
    if (!user?.email) return
    fetchLogbooks()
  }, [user])

  async function fetchLogbooks() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'logbooks'),
        where('studentEmail', '==', user.email),
        orderBy('submittedAt', 'desc')
      )
      const snap = await getDocs(q)
      setLogbooks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error fetching logbooks:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return
    setAlert(null)
    setSubmitting(true)

    const newEntry = {
      studentEmail: user.email,
      week: logbooks.length + 1,
      title: newTitle.trim(),
      content: newContent.trim(),
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    }

    try {
      const ref = await addDoc(collection(db, 'logbooks'), newEntry)
      setLogbooks(prev => [{ id: ref.id, ...newEntry }, ...prev])
      setNewTitle('')
      setNewContent('')
      setAlert({ type: 'success', msg: 'Logbook entry submitted successfully.' })
    } catch (err) {
      console.error('Error submitting logbook:', err)
      setAlert({ type: 'error', msg: 'Failed to submit logbook. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const withComments = logbooks.filter(l => l.supervisorComment || l.comment).length

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
        <h1 className="page-title">My Logbooks</h1>
        <p className="page-sub">Track your weekly attachment progress</p>
      </div>

      {/* Metrics */}
      <div className="metrics-grid cols-3">
        <div className="metric">
          <div className="metric-label">Submitted</div>
          <div className="metric-val">{logbooks.length}</div>
          <div className="metric-sub">Total logbook entries</div>
        </div>
        <div className="metric">
          <div className="metric-label">With Comments</div>
          <div className="metric-val">{withComments}</div>
          <div className="metric-sub">Supervisor has responded</div>
        </div>
        <div className="metric">
          <div className="metric-label">Next Due</div>
          <div className="metric-val">—</div>
          <div className="metric-sub">Set by coordinator</div>
        </div>
      </div>

      {/* Logbook list */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 className="section-title">Submitted Entries</h2>

        {logbooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📓</div>
            <div className="empty-text">No logbook entries yet</div>
            <div className="empty-sub">Submit your first entry using the form below.</div>
          </div>
        ) : (
          logbooks.map(entry => {
            const hasComment = entry.supervisorComment || entry.comment
            return (
              <div
                key={entry.id}
                className={`logbook-entry${hasComment && entry.status !== 'reviewed' ? ' needs-action' : ''}`}
              >
                <div className="logbook-meta">
                  <span className="logbook-week">Week {entry.week}</span>
                  <StatusBadge status={entry.status} />
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {formatDate(entry.submittedAt)}
                  </span>
                </div>
                <div className="logbook-title">{entry.title}</div>
                <div className="logbook-body">{entry.content}</div>

                {hasComment && (
                  <div className="logbook-comment">
                    <span className="logbook-comment-author">
                      Supervisor:&nbsp;
                    </span>
                    {entry.supervisorComment ?? entry.comment}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Submit new logbook form */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <span className="card-title">Submit New Entry — Week {logbooks.length + 1}</span>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {alert && (
            <div
              className={alert.type === 'success' ? 'alert-success' : 'alert-error'}
              style={{ marginBottom: '1rem' }}
            >
              {alert.msg}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="logTitle">Week Title / Summary</label>
            <input
              id="logTitle"
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Onboarding & orientation"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="logContent">Activities &amp; Reflections</label>
            <textarea
              id="logContent"
              rows={5}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Describe the tasks you completed, what you learned, and any challenges faced…"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
