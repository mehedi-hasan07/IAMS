import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

function calcAvgScore(report) {
  const ratings = report.ratings ?? report.scores ?? {}
  const values = Object.values(ratings).filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CoordReportsPage() {
  const [reports, setReports] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [repSnap, studSnap] = await Promise.all([
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'students')),
        ])
        setReports(repSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setStudents(studSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))

  // Build rows: each matched student has either a report or a "missing" placeholder
  const matchedStudents = students.filter((s) => s.status === 'matched')
  const reportsByStudent = Object.fromEntries(reports.map((r) => [r.studentId, r]))

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2 className="page-title">Reports</h2>
            <p className="page-sub">Supervisor reports overview</p>
          </div>
        </div>
        <div className="empty-state"><p className="empty-text">Loading reports…</p></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-sub">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card-p0">
        {reports.length === 0 && matchedStudents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No reports submitted yet.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Supervisor</th>
                <th>Organisation</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Students with reports */}
              {reports.map((r) => {
                const student = studentMap[r.studentId]
                const avg = calcAvgScore(r)
                return (
                  <>
                    <tr key={r.id}>
                      <td className="tbl-name">
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : r.studentEmail ?? r.studentId ?? '—'}
                      </td>
                      <td className="muted">{r.supervisorName ?? r.supervisorEmail ?? '—'}</td>
                      <td className="muted">{r.orgName ?? student?.matchedOrgName ?? '—'}</td>
                      <td>
                        {r.reportType === 'final'
                          ? <span className="badge badge--purple">Final</span>
                          : <span className="badge badge--blue">Mid-term</span>}
                      </td>
                      <td className="muted">{formatDate(r.submittedAt ?? r.createdAt)}</td>
                      <td>
                        {avg !== null
                          ? <span className="badge badge--success">{avg}</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td>
                        <button className="link-btn" onClick={() => toggleExpand(r.id)}>
                          {expandedId === r.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-alt, #f9fafb)' }}>
                            <div className="two-col" style={{ gap: '1.5rem' }}>
                              <div>
                                <div className="info-box">
                                  <div className="info-box-title">Report Details</div>
                                  <div className="info-row">
                                    <span className="info-label">Type</span>
                                    <span className="info-value">{r.reportType ?? '—'}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">Submitted</span>
                                    <span className="info-value">{formatDate(r.submittedAt ?? r.createdAt)}</span>
                                  </div>
                                  {r.overallComment && (
                                    <div className="info-row">
                                      <span className="info-label">Comment</span>
                                      <span className="info-value">{r.overallComment}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {r.ratings && Object.keys(r.ratings).length > 0 && (
                                <div>
                                  <div className="info-box">
                                    <div className="info-box-title">Ratings</div>
                                    {Object.entries(r.ratings).map(([k, v]) => (
                                      <div key={k} className="info-row">
                                        <span className="info-label" style={{ textTransform: 'capitalize' }}>
                                          {k.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span className="info-value">{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {/* Matched students without a report */}
              {matchedStudents
                .filter((s) => !reportsByStudent[s.id])
                .map((s) => (
                  <tr key={`missing-${s.id}`}>
                    <td className="tbl-name">{s.firstName} {s.lastName}</td>
                    <td className="muted">—</td>
                    <td className="muted">{s.matchedOrgName ?? '—'}</td>
                    <td><span className="muted">—</span></td>
                    <td><span className="muted">—</span></td>
                    <td><span className="muted">—</span></td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                        onClick={() => alert(`Reminder stub: would send reminder to ${s.email ?? s.firstName}`)}
                      >
                        Remind
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
