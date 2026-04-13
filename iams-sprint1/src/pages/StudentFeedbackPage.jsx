import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

function StarRating({ score, max = 5 }) {
  const filled = Math.round(score ?? 0)
  return (
    <span className="stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < filled ? 'filled' : 'empty'}`}>
          {i < filled ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function ReportTypeBadge({ type }) {
  const map = {
    midterm:  'badge badge--blue',
    final:    'badge badge--purple',
    monthly:  'badge badge--warn',
    weekly:   'badge badge--default',
  }
  const key = (type ?? '').toLowerCase()
  const cls = map[key] ?? 'badge badge--default'
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Report'
  return <span className={cls}>{label}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function StudentFeedbackPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    async function fetchReports() {
      try {
        const q = query(
          collection(db, 'reports'),
          where('studentEmail', '==', user.email)
        )
        const snap = await getDocs(q)
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const da = new Date(a.submittedAt ?? 0)
            const db2 = new Date(b.submittedAt ?? 0)
            return db2 - da
          })
        setReports(data)
      } catch (err) {
        console.error('Error fetching reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [user])

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading feedback…</p>
      </div>
    )
  }

  // Derive supervisor info from the most recent report (if any)
  const latestReport = reports[0] ?? null

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Supervisor Feedback</h1>
        <p className="page-sub">View evaluations and comments from your supervisor</p>
      </div>

      {/* Supervisor info box */}
      {latestReport && (
        <div className="info-box" style={{ marginBottom: '1.5rem' }}>
          <div className="info-box-title">Supervisor Details</div>
          <div className="info-row">
            <span className="info-label">Supervisor</span>
            <span className="info-value">{latestReport.supervisorName ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Organisation</span>
            <span className="info-value">{latestReport.organisation ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Total Reports</span>
            <span className="info-value">{reports.length}</span>
          </div>
        </div>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-text">No feedback yet</div>
          <div className="empty-sub">
            Your supervisor has not submitted any reports for your attachment.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map(report => {
            // Collect all numeric rating fields dynamically
            const ratingFields = Object.entries(report).filter(
              ([key, val]) =>
                typeof val === 'number' &&
                key !== 'week' &&
                !['createdAt', 'updatedAt', 'submittedAt'].includes(key)
            )

            return (
              <div key={report.id} className="card">
                <div className="card-header">
                  <span className="card-title">
                    <ReportTypeBadge type={report.reportType ?? report.type} />
                    &nbsp;
                    {report.title ?? `${(report.reportType ?? 'Report').charAt(0).toUpperCase() + (report.reportType ?? 'Report').slice(1)} Evaluation`}
                  </span>
                  <span className="muted" style={{ fontSize: '0.82rem' }}>
                    Submitted {formatDate(report.submittedAt ?? report.createdAt)}
                  </span>
                </div>

                <div style={{ padding: '1rem 1.25rem' }}>
                  {/* Ratings */}
                  {ratingFields.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="section-title" style={{ marginBottom: '0.5rem' }}>
                        Ratings
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '0.5rem 1.5rem',
                        }}
                      >
                        {ratingFields.map(([key, val]) => (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span className="muted" style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <StarRating score={val} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall score */}
                  {report.overallScore != null && (
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="info-label">Overall</span>
                      <StarRating score={report.overallScore} />
                      <span className="muted" style={{ fontSize: '0.82rem' }}>
                        ({report.overallScore}/5)
                      </span>
                    </div>
                  )}

                  {/* Comments */}
                  {report.comments && (
                    <div>
                      <div className="section-title" style={{ marginBottom: '0.4rem' }}>
                        Supervisor Comments
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>
                        {report.comments}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="section-title" style={{ marginBottom: '0.4rem' }}>
                        Recommendations
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>
                        {report.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
