import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

export default function SuperNotificationsPage() {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchNotifications()
  }, [user])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientEmail', '==', user.email),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Notifications fetch error:', err)
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return

    setMarkingAll(true)
    setError('')
    try {
      const batch = writeBatch(db)
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true })
      })
      await batch.commit()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Mark all read error:', err)
      setError('Failed to mark notifications as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    try {
      const date = new Date(iso)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return iso
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading notifications…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn-secondary"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {notifications.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <div className="empty-icon">🔔</div>
          <div className="empty-text">No notifications yet.</div>
        </div>
      ) : (
        <div className="card card-p0">
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              className={`notif-item${!notif.read ? ' unread' : ''}`}
              style={{
                borderBottom: idx < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span
                  className={`notif-dot${!notif.read ? ' unread' : ' read'}`}
                  style={{ flexShrink: 0, marginTop: '0.35rem' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span className="notif-title">{notif.title}</span>
                    <span className="notif-time" style={{ whiteSpace: 'nowrap' }}>
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="notif-body">{notif.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
