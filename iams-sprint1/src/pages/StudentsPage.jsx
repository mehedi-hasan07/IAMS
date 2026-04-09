import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'students'), orderBy('registeredAt', 'desc'))
        const snap = await getDocs(q)
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        // orderBy requires a Firestore index on first run — fall back to unordered
        const snap = await getDocs(collection(db, 'students'))
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Client-side filter
  const visible = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchSearch =
      search === '' ||
      name.includes(search.toLowerCase()) ||
      s.studentId?.includes(search)
    const matchFilter = filter === 'all' || s.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-sub">{students.length} registered</p>
        </div>
        <button className="btn-primary-sm" onClick={() => navigate('/students/register')}>
          + Register Student
        </button>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          style={{ width: 220, padding: '8px 11px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ padding: '8px 11px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit', background: '#fff' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="matched">Matched</option>
          <option value="pending">Pending</option>
          <option value="unmatched">Unmatched</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="empty-text">Loading students…</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">
              {students.length === 0
                ? 'No students registered yet.'
                : 'No students match your search.'}
            </p>
            {students.length === 0 && (
              <button
                className="btn-primary-sm"
                onClick={() => navigate('/students/register')}
              >
                Register first student
              </button>
            )}
          </div>
        ) : (
          <table className="tbl" style={{ tableLayout: 'fixed' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '10px 16px', width: '22%' }}>Name</th>
                <th style={{ padding: '10px 16px', width: '16%' }}>ID</th>
                <th style={{ padding: '10px 16px', width: '28%' }}>Skills</th>
                <th style={{ padding: '10px 16px', width: '16%' }}>Location</th>
                <th style={{ padding: '10px 16px', width: '12%' }}>Status</th>
                <th style={{ padding: '10px 16px', width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '8px 16px', fontWeight: 500 }}>
                    {s.firstName} {s.lastName}
                  </td>
                  <td style={{ padding: '8px 16px' }} className="muted">
                    {s.studentId}
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    {s.skills?.split(',').map((sk) => (
                      <span key={sk} className="tag">{sk.trim()}</span>
                    ))}
                  </td>
                  <td style={{ padding: '8px 16px' }} className="muted">
                    {s.location}
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/students/register`)}
                    >
                      Edit
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
