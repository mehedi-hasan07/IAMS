import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

export default function OrganisationsPage() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'organisations'))
        setOrgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function getStatusInfo(org) {
    const slots = org.availableSlots ?? 0
    if (slots === 0) return { label: 'Full', cls: 'badge--danger' }
    if (slots === 1) return { label: '1 slot left', cls: 'badge--warn' }
    return { label: 'Available', cls: 'badge--success' }
  }

  const visible = orgs.filter((o) => {
    const haystack = `${o.orgName ?? ''} ${o.location ?? ''}`.toLowerCase()
    const matchSearch = search === '' || haystack.includes(search.toLowerCase())
    if (filter === 'all') return matchSearch
    const slots = o.availableSlots ?? 0
    if (filter === 'available') return matchSearch && slots > 1
    if (filter === 'warning') return matchSearch && slots === 1
    if (filter === 'full') return matchSearch && slots === 0
    return matchSearch
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Organisations</h2>
          <p className="page-sub">{orgs.length} registered</p>
        </div>
        <button className="btn-primary-sm" onClick={() => navigate('/organisations/register')}>
          + Register Organisation
        </button>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="search-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="warning">1 slot left</option>
          <option value="full">Full</option>
        </select>
      </div>

      <div className="card-p0">
        {loading ? (
          <div className="empty-state"><p className="empty-text">Loading organisations…</p></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <p className="empty-text">
              {orgs.length === 0 ? 'No organisations registered yet.' : 'No organisations match your search.'}
            </p>
            {orgs.length === 0 && (
              <button className="btn-primary-sm" onClick={() => navigate('/organisations/register')}>
                Register first organisation
              </button>
            )}
          </div>
        ) : (
          <table className="tbl" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Organisation</th>
                <th style={{ width: '14%' }}>Industry</th>
                <th style={{ width: '12%' }}>Location</th>
                <th style={{ width: '22%' }}>Required Skills</th>
                <th style={{ width: '10%' }}>Slots</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const { label, cls } = getStatusInfo(o)
                const skills = o.requiredSkills
                  ? o.requiredSkills.split(',').map((sk) => sk.trim()).filter(Boolean)
                  : []
                return (
                  <tr key={o.id}>
                    <td className="tbl-name">{o.orgName}</td>
                    <td className="muted">{o.industry ?? '—'}</td>
                    <td className="muted">{o.location ?? '—'}</td>
                    <td>
                      {skills.length > 0
                        ? skills.map((sk) => <span key={sk} className="tag">{sk}</span>)
                        : <span className="muted">—</span>}
                    </td>
                    <td className="muted">{o.availableSlots ?? 0} / {o.totalSlots ?? 0}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => navigate(`/organisations/${o.id}/edit`)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
