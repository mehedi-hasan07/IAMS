import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

export default function CoordLogbooksPage() {
  const [logbooks, setLogbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'logbooks'))
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => (b.submittedAt ?? b.createdAt ?? '').localeCompare(a.submittedAt ?? a.createdAt ?? ''))
        setLogbooks(docs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visible = logbooks.filter((lb) => {
    const matchSearch = search === '' || (lb.studentEmail ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'needs review' && lb.status === 'needs review') ||
      (filter === 'reviewed' && lb.status === 'reviewed')
    return matchSearch && matchFilter
  })

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Logbooks</h2>
          <p className="page-sub">{logbooks.length} entr{logbooks.length === 1 ? 'y' : 'ies'} submitted</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by student email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="search-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="needs review">Needs Review</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="card-p0">
        {loading ? (
          <div className="empty-state"><p className="empty-text">Loading logbooks…</p></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📔</div>
            <p className="empty-text">
              {logbooks.length === 0 ? 'No logbook entries yet.' : 'No entries match your search.'}
            </p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Week</th>
                <th>Title</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lb) => (
                <>
                  <tr key={lb.id}>
                    <td className="tbl-name">{lb.studentEmail ?? lb.studentName ?? '—'}</td>
                    <td className="muted">{lb.week != null ? `Week ${lb.week}` : '—'}</td>
                    <td>{lb.title ?? '—'}</td>
                    <td className="muted">{formatDate(lb.submittedAt ?? lb.createdAt)}</td>
                    <td>
                      <StatusBadge status={lb.status} />
                    </td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => toggleExpand(lb.id)}
                      >
                        {expandedId === lb.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === lb.id && (
                    <tr key={`${lb.id}-detail`}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="logbook-entry">
                          <div className="logbook-meta">
                            <span className="logbook-week">
                              {lb.week != null ? `Week ${lb.week}` : ''}
                            </span>
                            <span>{formatDate(lb.submittedAt ?? lb.createdAt)}</span>
                          </div>
                          {lb.title && <div className="logbook-title">{lb.title}</div>}
                          <div className="logbook-body">
                            {lb.body ?? lb.content ?? lb.description ?? 'No content provided.'}
                          </div>
                          {lb.supervisorComment && (
                            <div className="logbook-comment">
                              <span className="logbook-comment-author">Supervisor comment:</span>{' '}
                              {lb.supervisorComment}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'reviewed') return <span className="badge badge--success">Reviewed</span>
  if (status === 'needs review') return <span className="badge badge--warn">Needs Review</span>
  return <span className="badge badge--default">{status ?? 'Pending'}</span>
}
