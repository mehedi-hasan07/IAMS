import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [recentLogbooks, setRecentLogbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalOrganizations: 0,
    matched: 0,
    pending: 0,
    unmatched: 0,
    pendingAssessments: 0
  })

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      try {
        // Fetch students
        const studentsSnapshot = await getDocs(collection(db, 'students'))
        const studentsData = studentsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setStudents(studentsData)

        // Fetch organizations
        const orgsSnapshot = await getDocs(collection(db, 'organizations'))
        const orgsData = orgsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setOrganizations(orgsData)

        // Calculate metrics
        const matchedCount = studentsData.filter(s => s.status === 'matched').length
        const pendingCount = studentsData.filter(s => s.status === 'pending').length
        const unmatchedCount = studentsData.filter(s => s.status === 'unmatched').length

        // Fetch recent logbooks (last 5)
        const logbooksQuery = query(collection(db, 'logbooks'), where('submittedAt', '!=', null))
        const logbooksSnapshot = await getDocs(logbooksQuery)
        const logbooksData = logbooksSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => b.submittedAt?.toDate() - a.submittedAt?.toDate())
          .slice(0, 5)
        setRecentLogbooks(logbooksData)

        setMetrics({
          totalStudents: studentsData.length,
          totalOrganizations: orgsData.length,
          matched: matchedCount,
          pending: pendingCount,
          unmatched: unmatchedCount,
          pendingAssessments: 5 // Placeholder - fetch actual count
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  // Role-based quick actions
  const getQuickActions = () => {
    const actions = {
      coordinator: [
        { label: 'Register Student', path: '/students/register', icon: '👨‍🎓', primary: true },
        { label: 'Register Organization', path: '/organizations/register', icon: '🏢' },
        { label: 'Run Matching', path: '/matching', icon: '🔄' },
        { label: 'View Reports', path: '/reports', icon: '📊' }
      ],
      student: [
        { label: 'Submit Logbook', path: '/logbooks/submit', icon: '📓', primary: true },
        { label: 'Submit Final Report', path: '/reports/submit', icon: '📄' },
        { label: 'View Placement', path: '/my-placement', icon: '📍' },
        { label: 'My Progress', path: '/my-progress', icon: '📈' }
      ],
      industrial_supervisor: [
        { label: 'Submit Assessment', path: '/assessments/submit', icon: '⭐', primary: true },
        { label: 'View Assigned Students', path: '/my-students', icon: '👥' },
        { label: 'Review Logbooks', path: '/logbooks/review', icon: '📓' }
      ],
      university_supervisor: [
        { label: 'Conduct Assessment', path: '/assessments/conduct', icon: '📝', primary: true },
        { label: 'Track Students', path: '/student-progress', icon: '👨‍🎓' },
        { label: 'View Reports', path: '/supervisor-reports', icon: '📊' }
      ],
      organization: [
        { label: 'Post Opportunity', path: '/opportunities/create', icon: '📢', primary: true },
        { label: 'View Applicants', path: '/applicants', icon: '👥' },
        { label: 'Company Profile', path: '/organization/profile', icon: '⚙️' }
      ]
    }
    return actions[userRole] || actions.coordinator
  }

  const quickActions = getQuickActions()

  // Role-based welcome message
  const getWelcomeMessage = () => {
    const messages = {
      coordinator: 'Monitor and manage the entire attachment process',
      student: 'Track your attachment progress and submit requirements',
      industrial_supervisor: 'Evaluate student performance and provide feedback',
      university_supervisor: 'Conduct assessments and monitor student progress',
      organization: 'Manage opportunities and review potential candidates'
    }
    return messages[userRole] || 'Manage your industrial attachment activities'
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-sub">
            Welcome back, {user?.displayName || user?.email} • <span className="role-badge">{userRole?.replace('_', ' ')}</span>
          </p>
          <p className="page-sub">{getWelcomeMessage()}</p>
        </div>
      </div>

      {/* Sprint Progress Banner */}
      <div className="sprint-banner">
        <div className="sprint-progress">
          <div className="sprint-progress-header">
            <span className="sprint-title">Release 1.0 (MVP)</span>
            <span className="sprint-percent">100%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '100%' }}></div>
          </div>
          <span className="sprint-status complete">✓ Complete</span>
        </div>
        <div className="sprint-progress">
          <div className="sprint-progress-header">
            <span className="sprint-title">Release 2.0 (Beta)</span>
            <span className="sprint-percent">40%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '40%' }}></div>
          </div>
          <span className="sprint-status in-progress">⏳ In Progress</span>
        </div>
      </div>

      {/* Metrics Grid - Role-specific metrics */}
      <div className="metrics-grid">
        {(userRole === 'coordinator' || userRole === 'university_supervisor') && (
          <>
            <div className="metric">
              <p className="metric-label">Total Students</p>
              <p className="metric-val">{metrics.totalStudents}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Organizations</p>
              <p className="metric-val">{metrics.totalOrganizations}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Matched</p>
              <p className="metric-val success">{metrics.matched}</p>
            </div>
            <div className="metric">
              <p className="metric-label">Pending</p>
              <p className="metric-val warning">{metrics.pending}</p>
            </div>
          </>
        )}
        
        {(userRole === 'student') && (
          <>
            <div className="metric">
              <p className="metric-label">Logbooks Submitted</p>
              <p className="metric-val">6/12</p>
            </div>
            <div className="metric">
              <p className="metric-label">Final Report</p>
              <p className="metric-val warning">Pending</p>
            </div>
            <div className="metric">
              <p className="metric-label">Assessments</p>
              <p className="metric-val">2/3</p>
            </div>
            <div className="metric">
              <p className="metric-label">Days Remaining</p>
              <p className="metric-val">45</p>
            </div>
          </>
        )}

        {(userRole === 'industrial_supervisor') && (
          <>
            <div className="metric">
              <p className="metric-label">Assigned Students</p>
              <p className="metric-val">3</p>
            </div>
            <div className="metric">
              <p className="metric-label">Pending Assessments</p>
              <p className="metric-val warning">2</p>
            </div>
            <div className="metric">
              <p className="metric-label">Logbooks to Review</p>
              <p className="metric-val">4</p>
            </div>
            <div className="metric">
              <p className="metric-label">Completed</p>
              <p className="metric-val success">1</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className={`action-card ${action.primary ? 'primary' : ''}`}
              onClick={() => navigate(action.path)}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout for recent data */}
      <div className="two-columns">
        {/* Recent Students */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Students</h3>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td className="student-name">{s.firstName} {s.lastName}</td>
                    <td className="muted">{s.studentId}</td>
                    <td>
                      {s.skills?.split(',').slice(0, 2).map((sk) => (
                        <span key={sk} className="tag">{sk.trim()}</span>
                      ))}
                      {s.skills?.split(',').length > 2 && <span className="tag">+{s.skills.split(',').length - 2}</span>}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Logbooks - Release 2 preview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Logbook Submissions</h3>
            <span className="release-badge">Release 2</span>
          </div>
          {recentLogbooks.length === 0 ? (
            <div className="coming-soon">
              <p className="coming-soon-icon">📓</p>
              <p className="coming-soon-text">Logbook tracking coming in Release 2</p>
              <p className="coming-soon-date">Expected: May 2026</p>
            </div>
          ) : (
            <div className="logbook-list">
              {recentLogbooks.map(log => (
                <div key={log.id} className="logbook-item">
                  <span className="logbook-student">{log.studentName}</span>
                  <span className="logbook-week">Week {log.week}</span>
                  <span className="logbook-date">{log.submittedAt?.toDate().toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="card deadlines-card">
        <div className="card-header">
          <h3 className="card-title">📅 Upcoming Deadlines</h3>
          <span className="notification-badge">3 pending</span>
        </div>
        <div className="deadlines-list">
          <div className="deadline-item">
            <span className="deadline-title">Weekly Logbook #8</span>
            <span className="deadline-date warning">Due in 2 days</span>
          </div>
          <div className="deadline-item">
            <span className="deadline-title">Industrial Supervisor Assessment</span>
            <span className="deadline-date danger">Due tomorrow</span>
          </div>
          <div className="deadline-item">
            <span className="deadline-title">Final Report Draft</span>
            <span className="deadline-date">Due in 14 days</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    matched: 'badge--success',
    pending: 'badge--warn',
    unmatched: 'badge--danger',
    in_progress: 'badge--info',
    completed: 'badge--success'
  }
  const labels = {
    matched: '✓ Matched',
    pending: '⏳ Pending',
    unmatched: '✗ Unmatched',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return (
    <span className={`badge ${map[status] ?? 'badge--default'}`}>
      {labels[status] ?? status ?? 'Unknown'}
    </span>
  )
}
