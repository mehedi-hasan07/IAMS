import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wrap any route you want to protect.
// If Firebase has no session, the user is sent back to /login.
// While Firebase is still checking the session, show a plain loading state.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={styles.spinner} />
        <p style={styles.text}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

const styles = {
  wrap: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: '#f5f5f4',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2px solid #d1d5db',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  text: {
    fontSize: 13,
    color: '#6b7280',
    margin: 0,
  },
}
