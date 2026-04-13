import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

export default function SuperDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [logbooks, setLogbooks] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        // Fetch matched students
        const studentsSnap = await getDocs(
          query(collection(db, 'students'), where('status', '==', 'matched'))
        )
        const studentsData = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setStudents(studentsData)

        // Fetch all logbooks
        const logbooksSnap = await getDocs(collection(db, 'logbooks'))
        const logbooksData = logbooksSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setLogbooks(logbooksData)

        // Fetch reports submitted by this supervisor
        const reportsSnap = await getDocs(
          query(collection(db, 'reports'), where('supervisorEmail', '==', user.email))
        )
        setReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('SuperDashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const pendingLogbooks = logbooks.filter(l => l.status === 'submitted')

  // Helper: does this student have a pending logbook?
  function hasPending(studentEmail) {
    return pendingLogbooks.some(l => l.studentEmail === studentEmail)
  }

  function statusBadge(status) {
    if (status === 'matched') return <span className="badge badge--success">Matched</span>
    if (status === 'pending') return <span className="badge badge--warn">Pending</span>
    return <span className="badge badge--default">{status}</span>
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">My Students — {user?.email}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid cols-3">
        <div className="metric">
          <div className="metric-label">Assigned Students</div>
          <div className="metric-val">{students.length}</div>
          <div className="metric-sub">matched &amp; active</div>
        </div>
        <div className="metric">
          <div className="metric-label">Logbooks to Review</div>
          <div className="metric-val">{pendingLogbooks.length}</div>
          <div className="metric-sub">awaiting feedback</div>
        </div>
        <div className="metric">
          <div className="metric-label">Reports Submitted</div>
          <div className="metric-val">{reports.length}</div>
          <div className="metric-sub">evaluations done</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        {/* Left: My Students */}
        <div>
          <h2 className="section-title">My Students</h2>

          {students.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-text">No matched students yet.</div>
              </div>
            </div>
          ) : (
            students.map(student => (
              <div className="card" key={student.id} style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                  <div>
                    <span className="card-title tbl-name">
                      {student.firstName} {student.lastName}
                    </span>
                    &nbsp;{statusBadge(student.status)}
                  </div>
                </div>
                <div style={{ padding: '0 0 0.25rem' }}>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>
                    ID: {student.studentId} &nbsp;·&nbsp; {student.email}
                  </p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(student.skills || []).map(s => (
                      <span className="tag" key={s}>{s}</span>
                    ))}
                  </div>
                  {hasPending(student.email) && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#d97706', fontWeight: 600 }}>
                      ⚠ Pending logbook submission awaiting review
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Action card + contact info */}
        <div>
          <div className="action-card purple" style={{ marginBottom: '1.25rem' }}>
            <div className="action-card-title">Action Required</div>
            <div className="action-card-body">
              {pendingLogbooks.length > 0 ? (
                <p>
                  You have <strong>{pendingLogbooks.length}</strong> logbook{pendingLogbooks.length !== 1 ? 's' : ''} waiting for your review.
                  <br />
                  <button
                    className="btn-primary-sm"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => navigate('/supervisor/logbooks')}
                  >
                    Review Logbooks
                  </button>
                </p>
              ) : (
                <p>No logbooks pending review. All up to date!</p>
              )}
              <hr style={{ margin: '0.85rem 0', borderColor: 'rgba(255,255,255,0.2)' }} />
              <p>
                Reports submitted: <strong>{reports.length}</strong>.
                {students.length > 0 && reports.length < students.length && (
                  <>
                    <br />
                    <button
                      className="btn-primary-sm"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => navigate('/supervisor/report')}
                    >
                      Submit Evaluation
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="info-box">
            <div className="info-box-title">Supervisor Info</div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">Supervisor</span>
            </div>
            <div className="info-row">
              <span className="info-label">Students</span>
              <span className="info-value">{students.length} assigned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
