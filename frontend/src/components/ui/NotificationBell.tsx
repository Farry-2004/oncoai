import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/useNotifications'
import type { Notification } from '@/types/api'
import styles from './NotificationBell.module.css'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { data: unread } = useUnreadCount()
  const { data: notifications } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  function handleClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const count = unread?.count ?? 0

  return (
    <div className={styles.wrap}>
      <button className={styles.bellBtn} type="button" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <svg className="icon" width={18} height={18} viewBox="0 0 24 24">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 && <span className={styles.dot}>{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <strong>Notifications</strong>
              {count > 0 && (
                <button className={styles.markAll} type="button" onClick={() => markAllRead.mutate()}>
                  Mark all read
                </button>
              )}
            </div>
            {!notifications?.length && <div className={styles.empty}>No notifications yet.</div>}
            {notifications?.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`${styles.item} ${n.read ? '' : styles.unread}`}
                onClick={() => handleClick(n)}
              >
                {n.message}
                <div className={styles.itemTime}>{timeAgo(n.created_at)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
