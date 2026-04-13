import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

function StatusBadge({ status }) {
  const map = {
    matched:   'badge badge--success',
    pending:   'badge badge--warn',
    unmatched: 'badge badge--danger',
  }
  const cls = map[status] ?? 'badge badge--default'
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  return <span className={cls}>{label}</span>
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    async function fetchStudent() {
      try {
        const snap = await getDocs(collection(db, 'students'))
        const found = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .find(s => s.email === user.email)
        setStudent(found ?? null)
      } catch (err) {
        console.error('Error fetching student:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [user])

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading your dashboard…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-sub">Welcome, {user?.displayName ?? user?.email}</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <div className="empty-text">You are not registered yet</div>
          <div className="empty-sub">
            Please complete your student registration to get started.
          </div>
          <a href="/profile" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Register Now
          </a>
        </div>
      </div>
    )
  }

  const status = student.status ?? 'unmatched'

  const bannerMeta = {
    matched: {
      title: 'Placement Confirmed',
      sub: `You have been matched with ${student.organisation ?? 'an organisation'}.`,
    },
    pending: {
      title: 'Application Under Review',
      sub: 'Your profile is being reviewed by a coordinator.',
    },
    unmatched: {
      title: 'Awaiting Placement',
      sub: 'Your registration is complete. You will be matched with an organisation soon.',
    },
  }

  const meta = bannerMeta[status] ?? bannerMeta.unmatched

  const skills = Array.isArray(student.skills)
    ? student.skills
    : typeof student.skills === 'string'
    ? student.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-sub">
          Welcome back, {student.firstName ?? user?.displayName ?? user?.email}
        </p>
      </div>

      {/* Status banner */}
      <div className={`status-banner ${status}`}>
        <div>
          <div className="status-banner-title">{meta.title}</div>
          <div className="status-banner-sub">{meta.sub}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Two-column section */}
      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        {/* Left: Registration details */}
        <div className="info-box">
          <div className="info-box-title">My Registration Details</div>

          <div className="info-row">
            <span className="info-label">Full Name</span>
            <span className="info-value">
              {student.firstName} {student.lastName}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Student ID</span>
            <span className="info-value">{student.studentId ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{student.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Location</span>
            <span className="info-value">{student.location ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Attachment Type</span>
            <span className="info-value">{student.attachmentType ?? '—'}</span>
          </div>

          {skills.length > 0 && (
            <div className="info-row" style={{ alignItems: 'flex-start' }}>
              <span className="info-label">Skills</span>
              <span className="info-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skills.map((skill, i) => (
                  <span key={i} className="tag">{skill}</span>
                ))}
              </span>
            </div>
          )}

          {student.notes && (
            <div className="info-row" style={{ alignItems: 'flex-start' }}>
              <span className="info-label">Notes</span>
              <span className="info-value">{student.notes}</span>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attachment Timeline</span>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot done" />
                <div>
                  <div className="timeline-label">Registered</div>
                  <div className="timeline-sub">Profile submitted successfully</div>
                </div>
              </div>

              <div className="timeline-item">
                <div className={`timeline-dot ${status === 'unmatched' ? 'active' : 'done'}`} />
                <div>
                  <div className="timeline-label">Waiting for Match</div>
                  <div className="timeline-sub">
                    {status === 'unmatched'
                      ? 'Currently awaiting organisation assignment'
                      : 'Completed'}
                  </div>
                </div>
              </div>

              <div className="timeline-item">
                <div className={`timeline-dot ${status === 'matched' ? 'done' : status === 'pending' ? 'active' : 'idle'}`} />
                <div>
                  <div className="timeline-label">Organisation Assigned</div>
                  <div className="timeline-sub">
                    {student.organisation ?? 'Pending assignment'}
                  </div>
                </div>
              </div>

              <div className="timeline-item">
                <div className={`timeline-dot ${status === 'matched' ? 'active' : 'idle'}`} />
                <div>
                  <div className="timeline-label">Attachment Begins</div>
                  <div className="timeline-sub">
                    {student.startDate ?? 'Date to be confirmed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="metrics-grid cols-3" style={{ marginTop: '1.5rem' }}>
        <div className="metric">
          <div className="metric-label">Logbooks Submitted</div>
          <div className="metric-val">0</div>
          <div className="metric-sub">No entries yet</div>
        </div>
        <div className="metric">
          <div className="metric-label">Supervisor Comments</div>
          <div className="metric-val">0</div>
          <div className="metric-sub">No comments yet</div>
        </div>
        <div className="metric">
          <div className="metric-label">Next Deadline</div>
          <div className="metric-val">Pending</div>
          <div className="metric-sub">Will be set by coordinator</div>
        </div>
      </div>
    </div>
  )
}
