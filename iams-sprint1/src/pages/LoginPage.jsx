import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import './LoginPage.css'

const ROLES = ['student', 'coordinator', 'supervisor']

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'signup'

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupRole, setSignupRole] = useState('student')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      navigate('/dashboard')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Signup ─────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      // 1. Create the Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword
      )
      // 2. Write the user's role and name to Firestore
      //    This is what ProtectedRoute and the dashboard read later
      await setDoc(doc(db, 'users', user.uid), {
        name: signupName,
        email: signupEmail,
        role: signupRole,
        createdAt: new Date().toISOString(),
      })
      navigate('/dashboard')
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
          <h1 className="login-logo-title">IAMS</h1>
          <p className="login-logo-sub">Industrial Attachment Management System</p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Log in
          </button>
          <button
            className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError('') }}
          >
            Sign up
          </button>
        </div>

        {/* Error banner */}
        {error && <div className="login-error">{error}</div>}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="l-email">Email address</label>
              <input
                id="l-email"
                type="email"
                placeholder="you@ub.ac.bw"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="l-pw">Password</label>
              <input
                id="l-pw"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="login-form">
            <div className="form-group">
              <label htmlFor="s-name">Full name</label>
              <input
                id="s-name"
                type="text"
                placeholder="e.g. Thabo Mokoena"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="s-email">Email address</label>
              <input
                id="s-email"
                type="email"
                placeholder="you@ub.ac.bw"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="s-pw">Password</label>
              <input
                id="s-pw"
                type="password"
                placeholder="Min. 8 characters"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>I am a</label>
              <div className="role-row">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-badge ${signupRole === r ? 'selected' : ''}`}
                    onClick={() => setSignupRole(r)}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Turn Firebase error codes into readable messages
function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
