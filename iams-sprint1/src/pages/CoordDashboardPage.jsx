import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

export default function CoordDashboardPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [studSnap, orgSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'organisations')),
        ])
        setStudents(studSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setOrgs(orgSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const matched = students.filter((s) => s.status === 'matched')
  const unmatched = students.filter((s) => s.status === 'unmatched')
  const orgsWithSlots = orgs.filter((o) => (o.availableSlots ?? 0) > 0)
  const recentStudents = [...students]
    .sort((a, b) => (b.registeredAt ?? '').localeCompare(a.registeredAt ?? ''))
    .slice(0, 8)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-sub">System overview</p>
        </div>
      </div>

      <div className="metrics-grid cols-4">
        <div className="metric">
          <div className="metric-label">Total Students</div>
          <div className="metric-val">{loading ? '—' : students.length}</div>
          <div className="metric-sub">registered</div>
        </div>
        <div className="metric">
          <div className="metric-label">Matched</div>
          <div className="metric-val">{loading ? '—' : matched.length}</div>
          <div className="metric-sub">placed at organisations</div>
        </div>
        <div className="metric">
          <div className="metric-label">Unmatched</div>
          <div className="metric-val">{loading ? '—' : unmatched.length}</div>
          <div className="metric-sub">awaiting placement</div>
        </div>
        <div className="metric">
          <div className="metric-label">Organisations</div>
          <div className="metric-val">{loading ? '—' : orgs.length}</div>
          <div className="metric-sub">registered</div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        {/* Left: Recent Students */}
        <div>
          <h3 className="section-title">Recent Students</h3>
          <div className="card-p0">
            {loading ? (
              <div className="empty-state"><p className="empty-text">Loading…</p></div>
            ) : recentStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <p className="empty-text">No students registered yet.</p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Organisation</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="tbl-name">{s.firstName} {s.lastName}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="muted">
                        {s.status === 'matched' ? (s.matchedOrgName ?? '—') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Organisations + action card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 className="section-title">Organisations</h3>
            <div className="card-p0">
              {loading ? (
                <div className="empty-state"><p className="empty-text">Loading…</p></div>
              ) : orgs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <p className="empty-text">No organisations registered yet.</p>
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Slots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.slice(0, 6).map((o) => (
                      <tr key={o.id}>
                        <td className="tbl-name">{o.orgName}</td>
                        <td className="muted">{o.location}</td>
                        <td className="muted">{o.availableSlots ?? 0} / {o.totalSlots ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {!loading && unmatched.length > 0 && orgsWithSlots.length > 0 && (
            <div className="action-card blue">
              <div className="action-card-title">Placement Needed</div>
              <div className="action-card-body">
                {unmatched.length} student{unmatched.length !== 1 ? 's' : ''} unmatched — go to Matching to assign placements.
              </div>
              <button
                className="btn-primary-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={() => navigate('/matching')}
              >
                Go to Matching
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { matched: 'badge--success', pending: 'badge--warn', unmatched: 'badge--danger' }
  return <span className={`badge ${map[status] ?? 'badge--default'}`}>{status ?? 'unmatched'}</span>
}
