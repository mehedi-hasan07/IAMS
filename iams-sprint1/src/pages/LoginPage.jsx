import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')

  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupName, setSignupName]         = useState('')
  const [signupEmail, setSignupEmail]       = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
      await setDoc(doc(db, 'users', user.uid), {
        name: signupName,
        email: signupEmail,
        role: 'student',
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
          <div className="login-logo-badge"><span>IA</span></div>
          <h1 className="login-logo-title">IAMS</h1>
          <p className="login-logo-sub">Industrial Attachment Management System</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Sign in
          </button>
          <button
            className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError('') }}
          >
            Create account
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {tab === 'login' ? (
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
        ) : (
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
            <div className="role-info">
              Registering as <strong>Student</strong>
              <div className="role-info-sub">Staff accounts are created by the system administrator.</div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <p className="login-footer-note">
          University of Botswana · CSI341
        </p>
      </div>
    </div>
  )
}

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
