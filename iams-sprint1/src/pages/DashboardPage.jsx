import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const snapshot = await getDocs(collection(db, 'students'))
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setStudents(data)
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const matched = students.filter((s) => s.status === 'matched').length
  const pending = students.filter((s) => s.status === 'pending').length
  const unmatched = students.filter((s) => s.status === 'unmatched').length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-sub">Welcome back, {user?.email}</p>
        </div>
        <button className="btn-primary-sm" onClick={() => navigate('/students/register')}>
          + Register Student
        </button>
      </div>

      {/* Sprint 1 banner */}
      <div className="sprint-banner">
        <span className="sprint-pill">Sprint 1 complete</span>
        <span className="sprint-pill sprint-pill--warn">Sprint 2 in progress</span>
        <span className="sprint-text">Release 1 MVP — Auth &amp; Student Registration done</span>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <p className="metric-label">Total students</p>
          <p className="metric-val">{students.length}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Matched</p>
          <p className="metric-val" style={{ color: '#16a34a' }}>{matched}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Pending</p>
          <p className="metric-val" style={{ color: '#d97706' }}>{pending}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Unmatched</p>
          <p className="metric-val" style={{ color: '#dc2626' }}>{unmatched}</p>
        </div>
      </div>

      {/* Recent students table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent students</h3>
          <button className="link-btn" onClick={() => navigate('/students')}>
            View all →
          </button>
        </div>

        {loading ? (
          <p className="empty-text">Loading students…</p>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No students registered yet.</p>
            <button
              className="btn-primary-sm"
              onClick={() => navigate('/students/register')}
            >
              Register first student
            </button>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Skills</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 8).map((s) => (
                <tr key={s.id}>
                  <td>{s.firstName} {s.lastName}</td>
                  <td className="muted">{s.studentId}</td>
                  <td>
                    {s.skills?.split(',').map((sk) => (
                      <span key={sk} className="tag">{sk.trim()}</span>
                    ))}
                  </td>
                  <td className="muted">{s.location}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Release 2 coming soon */}
      <div className="r2-notice">
        <p className="r2-title">Release 2 features are not built yet</p>
        <p className="r2-sub">
          Logbooks, supervisor reports, assessments and notifications unlock in Release 2 — due 1 May 2026
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    matched: 'badge--success',
    pending: 'badge--warn',
    unmatched: 'badge--danger',
  }
  return (
    <span className={`badge ${map[status] ?? 'badge--default'}`}>
      {status ?? 'unmatched'}
    </span>
  )
}
