import { useAuth } from '../context/AuthContext'
import StudentDashboardPage from './StudentDashboardPage'
import CoordDashboardPage from './CoordDashboardPage'
import SuperDashboardPage from './SuperDashboardPage'

export default function DashboardPage() {
  const { role } = useAuth()
  if (role === 'coordinator') return <CoordDashboardPage />
  if (role === 'supervisor')  return <SuperDashboardPage />
  return <StudentDashboardPage />
}
