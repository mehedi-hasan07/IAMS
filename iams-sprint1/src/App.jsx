import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import StaffRegisterPage from './pages/StaffRegisterPage'
import DashboardPage from './pages/DashboardPage'

// Existing
import StudentsPage from './pages/StudentsPage'
import StudentRegisterPage from './pages/StudentRegisterPage'

// Coordinator pages
import StudentEditPage from './pages/StudentEditPage'
import OrganisationsPage from './pages/OrganisationsPage'
import OrganisationRegisterPage from './pages/OrganisationRegisterPage'
import MatchingPage from './pages/MatchingPage'
import CoordLogbooksPage from './pages/CoordLogbooksPage'
import CoordReportsPage from './pages/CoordReportsPage'
import AssessmentsPage from './pages/AssessmentsPage'

// Student pages
import StudentProfilePage from './pages/StudentProfilePage'
import StudentLogbooksPage from './pages/StudentLogbooksPage'
import StudentFeedbackPage from './pages/StudentFeedbackPage'

// Supervisor pages
import SuperStudentsPage from './pages/SuperStudentsPage'
import SuperLogbooksPage from './pages/SuperLogbooksPage'
import SuperReportPage from './pages/SuperReportPage'

// Shared (role-aware)
import NotificationsPage from './pages/NotificationsPage'
import CoordNotificationsPage from './pages/CoordNotificationsPage'
import SuperNotificationsPage from './pages/SuperNotificationsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff/register" element={<StaffRegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* All roles */}
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="notifications" element={<NotificationsRouter />} />

            {/* Student */}
            <Route path="profile"   element={<RoleRoute roles={['student']}><StudentProfilePage /></RoleRoute>} />
            <Route path="logbooks"  element={
              <RoleRoute roles={['student','coordinator','supervisor']}>
                <LogbooksRouter />
              </RoleRoute>
            } />
            <Route path="feedback"  element={<RoleRoute roles={['student']}><StudentFeedbackPage /></RoleRoute>} />

            {/* Coordinator */}
            <Route path="students"                element={<RoleRoute roles={['coordinator']}><StudentsPage /></RoleRoute>} />
            <Route path="students/register"       element={<RoleRoute roles={['coordinator']}><StudentRegisterPage /></RoleRoute>} />
            <Route path="students/:id/edit"       element={<RoleRoute roles={['coordinator']}><StudentEditPage /></RoleRoute>} />
            <Route path="organisations"           element={<RoleRoute roles={['coordinator']}><OrganisationsPage /></RoleRoute>} />
            <Route path="organisations/register"  element={<RoleRoute roles={['coordinator']}><OrganisationRegisterPage /></RoleRoute>} />
            <Route path="matching"                element={<RoleRoute roles={['coordinator']}><MatchingPage /></RoleRoute>} />
            <Route path="reports"                 element={
              <RoleRoute roles={['coordinator','supervisor']}>
                <ReportsRouter />
              </RoleRoute>
            } />
            <Route path="assessments"             element={<RoleRoute roles={['coordinator']}><AssessmentsPage /></RoleRoute>} />

            {/* Supervisor */}
            <Route path="my-students" element={<RoleRoute roles={['supervisor']}><SuperStudentsPage /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Route-level role switchers
import { useAuth } from './context/AuthContext'

function LogbooksRouter() {
  const { role } = useAuth()
  if (role === 'coordinator') return <CoordLogbooksPage />
  if (role === 'supervisor')  return <SuperLogbooksPage />
  return <StudentLogbooksPage />
}

function ReportsRouter() {
  const { role } = useAuth()
  if (role === 'supervisor') return <SuperReportPage />
  return <CoordReportsPage />
}

function NotificationsRouter() {
  const { role } = useAuth()
  if (role === 'coordinator') return <CoordNotificationsPage />
  if (role === 'supervisor')  return <SuperNotificationsPage />
  return <NotificationsPage />
}
