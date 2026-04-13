import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'students'), orderBy('registeredAt', 'desc'))
        const snap = await getDocs(q)
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        const snap = await getDocs(collection(db, 'students'))
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visible = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchSearch = search === '' || name.includes(search.toLowerCase()) || s.studentId?.includes(search)
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

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="search-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="matched">Matched</option>
          <option value="pending">Pending</option>
          <option value="unmatched">Unmatched</option>
        </select>
      </div>

      <div className="card-p0">
        {loading ? (
          <div className="empty-state"><p className="empty-text">Loading students…</p></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p className="empty-text">{students.length === 0 ? 'No students registered yet.' : 'No students match your search.'}</p>
            {students.length === 0 && (
              <button className="btn-primary-sm" onClick={() => navigate('/students/register')}>
                Register first student
              </button>
            )}
          </div>
        ) : (
          <table className="tbl" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Name</th>
                <th style={{ width: '14%' }}>Student ID</th>
                <th style={{ width: '26%' }}>Skills</th>
                <th style={{ width: '14%' }}>Location</th>
                <th style={{ width: '14%' }}>Status</th>
                <th style={{ width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id}>
                  <td className="tbl-name">{s.firstName} {s.lastName}</td>
                  <td className="muted">{s.studentId}</td>
                  <td>
                    {s.skills?.split(',').map((sk) => (
                      <span key={sk} className="tag">{sk.trim()}</span>
                    ))}
                  </td>
                  <td className="muted">{s.location}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/students/${s.id}/edit`)}
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
  const map = { matched: 'badge--success', pending: 'badge--warn', unmatched: 'badge--danger' }
  return <span className={`badge ${map[status] ?? 'badge--default'}`}>{status ?? 'unmatched'}</span>
}
