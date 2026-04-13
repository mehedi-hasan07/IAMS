import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

function formatTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`

    return d.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (!user?.email) return
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
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return

    setMarkingAll(true)
    try {
      const batch = writeBatch(db)
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true })
      })
      await batch.commit()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    } finally {
      setMarkingAll(false)
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title">
            Notifications
            {unreadCount > 0 && (
              <span
                className="badge badge--danger"
                style={{ marginLeft: '0.6rem', fontSize: '0.75rem', verticalAlign: 'middle' }}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="page-sub">
            {notifications.length === 0
              ? 'You have no notifications.'
              : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} total`}
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

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-text">No notifications</div>
          <div className="empty-sub">
            You're all caught up. Notifications will appear here when there are updates.
          </div>
        </div>
      ) : (
        <div className="card card-p0" style={{ marginTop: '0.5rem' }}>
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              className={`notif-item${!notif.read ? ' unread' : ''}`}
              style={{
                borderBottom:
                  idx < notifications.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none',
              }}
            >
              <div className={`notif-dot${!notif.read ? ' unread' : ' read'}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notif-title">{notif.title ?? 'Notification'}</div>
                {notif.body && (
                  <div className="notif-body">{notif.body}</div>
                )}
                {notif.message && !notif.body && (
                  <div className="notif-body">{notif.message}</div>
                )}
                <div className="notif-time">{formatTime(notif.createdAt)}</div>
              </div>
              {!notif.read && (
                <span className="badge badge--blue" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
