import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

export default function SuperStudentsPage() {
  const { user } = useAuth()

  const [students, setStudents] = useState([])
  const [logbooks, setLogbooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        const studentsSnap = await getDocs(
          query(collection(db, 'students'), where('status', '==', 'matched'))
        )
        setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        const logbooksSnap = await getDocs(collection(db, 'logbooks'))
        setLogbooks(logbooksSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('SuperStudents fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  function getStudentLogbooks(email) {
    return logbooks.filter(l => l.studentEmail === email)
  }

  function getPendingCount(email) {
    return logbooks.filter(l => l.studentEmail === email && l.status === 'submitted').length
  }

  function statusBadge(status) {
    if (status === 'matched') return <span className="badge badge--success">Matched</span>
    if (status === 'pending') return <span className="badge badge--warn">Pending</span>
    return <span className="badge badge--default">{status}</span>
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading students…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-sub">All students matched to your organisation</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No matched students assigned to you yet.</div>
          </div>
        </div>
      ) : (
        students.map(student => {
          const allLogbooks = getStudentLogbooks(student.email)
          const pending = getPendingCount(student.email)

          return (
            <div className="card" key={student.id} style={{ marginBottom: '1.25rem' }}>
              {/* Student header */}
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span className="card-title tbl-name" style={{ fontSize: '1.1rem' }}>
                    {student.firstName} {student.lastName}
                  </span>
                  {statusBadge(student.status)}
                </div>
                <span className="muted" style={{ fontSize: '0.85rem' }}>{student.email}</span>
              </div>

              {/* Three column details */}
              <div className="three-col" style={{ marginTop: '0.75rem' }}>
                {/* Details */}
                <div className="info-box">
                  <div className="info-box-title">Details</div>
                  <div className="info-row">
                    <span className="info-label">Student ID</span>
                    <span className="info-value">{student.studentId || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Attachment Type</span>
                    <span className="info-value">{student.attachmentType || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location</span>
                    <span className="info-value">{student.location || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Organisation</span>
                    <span className="info-value">{student.matchedOrgName || '—'}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="info-box">
                  <div className="info-box-title">Skills</div>
                  {(student.skills || []).length === 0 ? (
                    <p className="muted" style={{ fontSize: '0.85rem' }}>No skills listed.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                      {(student.skills || []).map(s => (
                        <span className="tag" key={s}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logbooks summary */}
                <div className="info-box">
                  <div className="info-box-title">Logbooks</div>
                  <div className="info-row">
                    <span className="info-label">Total Submitted</span>
                    <span className="info-value">{allLogbooks.length}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Reviewed</span>
                    <span className="info-value">
                      {allLogbooks.filter(l => l.status === 'reviewed').length}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Awaiting Review</span>
                    <span className="info-value">
                      {pending > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>{pending} pending</span>
                      ) : (
                        <span className="badge badge--success">All reviewed</span>
                      )}
                    </span>
                  </div>
                  {pending > 0 && (
                    <div
                      style={{
                        marginTop: '0.6rem',
                        background: '#fef3c7',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.82rem',
                        color: '#92400e',
                        fontWeight: 500,
                      }}
                    >
                      ⚠ {pending} logbook{pending !== 1 ? 's' : ''} need your feedback
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
