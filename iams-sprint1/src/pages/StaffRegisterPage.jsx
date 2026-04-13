import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import './LoginPage.css'

const ROLES = ['coordinator', 'supervisor']

export default function StaffRegisterPage() {
  const navigate = useNavigate()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('coordinator')

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      })
      setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} account created for ${email}`)
      setName('')
      setEmail('')
      setPassword('')
      setRole('coordinator')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-badge"><span>IA</span></div>
          <h1 className="login-logo-title">Staff Registration</h1>
          <p className="login-logo-sub">Create coordinator or supervisor accounts</p>
        </div>

        {error   && <div className="login-error">{error}</div>}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', fontWeight: 500, marginBottom: 16 }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Kefilwe Sithole"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="staff@ub.ac.bw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <div className="role-row">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-badge ${role === r ? 'selected' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create staff account'}
          </button>
        </form>

        <p className="login-footer-note" style={{ marginTop: 16 }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}
          >
            ← Back to login
          </button>
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.'
    case 'auth/weak-password':        return 'Password must be at least 8 characters.'
    case 'auth/invalid-email':        return 'Please enter a valid email address.'
    default:                          return 'Something went wrong. Please try again.'
  }
}
