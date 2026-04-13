import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

// Navigation config per role
const NAV = {
  student: [
    { section: 'My Account' },
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/profile',        label: 'My Registration' },
    { section: 'Attachment' },
    { to: '/logbooks',       label: 'My Logbooks' },
    { to: '/feedback',       label: 'Supervisor Feedback' },
    { to: '/notifications',  label: 'Notifications' },
  ],
  coordinator: [
    { section: 'Management' },
    { to: '/dashboard',               label: 'Dashboard' },
    { to: '/students',                label: 'Students' },
    { to: '/students/register',       label: 'Register Student' },
    { to: '/organisations',           label: 'Organisations' },
    { to: '/organisations/register',  label: 'Register Organisation' },
    { to: '/matching',                label: 'Matching' },
    { section: 'Monitoring' },
    { to: '/logbooks',       label: 'Logbooks' },
    { to: '/reports',        label: 'Supervisor Reports' },
    { to: '/assessments',    label: 'Assessments' },
    { to: '/notifications',  label: 'Notifications' },
  ],
  supervisor: [
    { section: 'My Supervision' },
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/my-students',    label: 'My Students' },
    { section: 'Tools' },
    { to: '/logbooks',       label: 'Review Logbooks' },
    { to: '/reports',        label: 'Submit Reports' },
    { to: '/notifications',  label: 'Notifications' },
  ],
}

export default function Sidebar() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const links = NAV[role] ?? NAV.student
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <span className="sb-logo-title">IAMS</span>
        <span className="sb-logo-sub">Industrial Attachment System</span>
        {role && (
          <span className={`sb-role-pill ${role}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sb-nav">
        {links.map((item, i) => {
          if (item.section) {
            return <p key={i} className="sb-section">{item.section}</p>
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `sb-link${isActive ? ' sb-link--active' : ''}`
              }
            >
              <span className="sb-dot" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="sb-footer">
        <div className={`sb-avatar ${role ?? 'student'}`}>{initials}</div>
        <div className="sb-user">
          <span className="sb-user-name">{displayName}</span>
          <span className="sb-user-email">{user?.email}</span>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Log out">⏻</button>
      </div>
    </aside>
  )
}
