import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const SEND_TO_OPTIONS = [
  { value: 'all_students', label: 'All Students' },
  { value: 'unmatched_students', label: 'Unmatched Students' },
  { value: 'all_supervisors', label: 'All Supervisors' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function CoordNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  const [sendTo, setSendTo] = useState('all_students')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState('')
  const [sendError, setSendError] = useState('')

  async function loadNotifications() {
    setLoadingNotifs(true)
    try {
      const snap = await getDocs(collection(db, 'notifications'))
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = all.filter(
        (n) => n.recipientEmail === 'coordinator' || n.recipientEmail === (user?.email ?? '')
      )
      filtered.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      setNotifications(filtered)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNotifs(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  async function handleMarkAllRead() {
    try {
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSendReminder(e) {
    e.preventDefault()
    setSendError('')
    setSendSuccess('')
    if (!message.trim()) {
      setSendError('Please enter a message.')
      return
    }
    setSending(true)
    try {
      let recipients = []

      if (sendTo === 'all_students') {
        const snap = await getDocs(collection(db, 'students'))
        recipients = snap.docs.map((d) => d.data().email).filter(Boolean)
      } else if (sendTo === 'unmatched_students') {
        const snap = await getDocs(
          query(collection(db, 'students'), where('status', '==', 'unmatched'))
        )
        recipients = snap.docs.map((d) => d.data().email).filter(Boolean)
      } else if (sendTo === 'all_supervisors') {
        const snap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'supervisor'))
        )
        recipients = snap.docs.map((d) => d.data().email).filter(Boolean)
      }

      if (recipients.length === 0) {
        setSendError('No recipients found for the selected group.')
        setSending(false)
        return
      }

      const now = new Date().toISOString()
      await Promise.all(
        recipients.map((email) =>
          addDoc(collection(db, 'notifications'), {
            recipientEmail: email,
            title: 'Reminder from Coordinator',
            body: message,
            read: false,
            createdAt: now,
          })
        )
      )

      setSendSuccess(`Reminder sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`)
      setMessage('')
      await loadNotifications()
    } catch (err) {
      console.error(err)
      setSendError('Failed to send reminder. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-sub">Manage alerts and send reminders</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Left: Notifications Feed */}
        <div>
          <h3 className="section-title">Inbox</h3>
          <div className="card-p0">
            {loadingNotifs ? (
              <div className="empty-state"><p className="empty-text">Loading notifications…</p></div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <p className="empty-text">No notifications yet.</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item${!n.read ? ' unread' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span className={`notif-dot${!n.read ? ' unread' : ' read'}`} />
                      <div style={{ flex: 1 }}>
                        <div className="notif-title">{n.title ?? 'Notification'}</div>
                        <div className="notif-body">{n.body ?? n.message ?? ''}</div>
                        <div className="notif-time">{formatDate(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Send Reminder Form */}
        <div>
          <h3 className="section-title">Send Reminder</h3>
          <div className="card">
            {sendSuccess && <div className="alert-success" style={{ marginBottom: '1rem' }}>{sendSuccess}</div>}
            {sendError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{sendError}</div>}

            <form onSubmit={handleSendReminder} className="reg-form">
              <div className="form-group">
                <label htmlFor="sendTo">Send to</label>
                <select
                  id="sendTo"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                >
                  {SEND_TO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reminderMessage">Message</label>
                <textarea
                  id="reminderMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your reminder message…"
                  rows={5}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary-sm" disabled={sending}>
                  {sending ? 'Sending…' : 'Send Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
