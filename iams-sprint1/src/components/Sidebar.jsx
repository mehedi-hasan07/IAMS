import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

const R1_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/students/register', label: 'Register Student' },
]

const R2_LOCKED = [
  'Logbooks',
  'Supervisor Reports',
  'Assessments',
  'Notifications',
]

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  // Initials avatar from email
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <span className="sb-logo-title">IAMS</span>
        <span className="sb-logo-sub">Release 1 — MVP</span>
      </div>

      <nav className="sb-nav">
        <p className="sb-section">Sprint 1 &amp; 2</p>
        {R1_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `sb-link ${isActive ? 'sb-link--active' : ''}`
            }
          >
            <span className="sb-dot" />
            {label}
          </NavLink>
        ))}

        <p className="sb-section" style={{ marginTop: 16 }}>
          Release 2 only
        </p>
        {R2_LOCKED.map((label) => (
          <div key={label} className="sb-link sb-link--locked">
            <span className="sb-dot" />
            {label}
            <span className="sb-lock">R2</span>
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-avatar">{initials}</div>
        <div className="sb-user">
          <span className="sb-user-email">{user?.email}</span>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Log out">
          ⏻
        </button>
      </div>
    </aside>
  )
}
