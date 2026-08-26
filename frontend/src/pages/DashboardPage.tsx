import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { CareNetwork3D } from '@/features/dashboard/CareNetwork3D'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboardSummary()

  const firstName = user?.full_name.split(' ').slice(-1)[0] ?? ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Clinical Dashboard</h1>
          <p className="sub">
            <span>
              {greeting}, {user?.title ? `${user.title} ` : ''}
              {firstName}
            </span>
            <span className="live-badge">
              <span className="live-dot"></span>Live · Muhimbili National Hospital
            </span>
          </p>
        </div>
        <div className="dash-actions">
          <Link to="/patients" className="btn btn-primary">
            + New Case
          </Link>
        </div>
      </div>

      <DemoDataBanner />

      {isError && <div className="form-error">Couldn't load dashboard data. Is the API running?</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon blue">
              <svg className="icon" width={20} height={20} viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="num">{isLoading ? '–' : data?.active_patients}</div>
          <div className="name">Active Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon amber">
              <svg className="icon" width={20} height={20} viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="17" rx="2" />
                <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                <path d="m9 13 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="num">{isLoading ? '–' : data?.open_cases}</div>
          <div className="name">Cases Ready for TB</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon rose">
              <svg className="icon" width={20} height={20} viewBox="0 0 24 24">
                <path d="M12 20.5s-6.9-4.2-9.3-8.4C1 8.9 3 5.5 6.4 5.5c1.9 0 3.1 1 5.6 3.2 2.5-2.2 3.7-3.2 5.6-3.2C21 5.5 23 8.9 21.3 12.1 18.9 16.3 12 20.5 12 20.5Z" />
                <path d="M5 12h3l1.5-3 2 6 1.5-3H17" />
              </svg>
            </div>
          </div>
          <div className="num">{isLoading ? '–' : data?.critical_cases}</div>
          <div className="name">Critical Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon violet">
              <svg className="icon" width={20} height={20} viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
                <path d="M12 13v5M9.5 15.5h5" />
              </svg>
            </div>
          </div>
          <div className="num">{isLoading ? '–' : data?.upcoming_boards}</div>
          <div className="name">Upcoming Boards</div>
          <div className="meta">
            {data?.next_board_at
              ? `Next: ${new Date(data.next_board_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
              : 'Next: —'}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <div className="title">
              <span className="ic">
                <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                  <rect x="6" y="4" width="12" height="17" rx="2" />
                  <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                  <path d="m9 13 2 2 4-4" />
                </svg>
              </span>
              Recent Tumor Board Cases
            </div>
            <Link to="/tumor-board" className="view-all">
              View All →
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Diagnosis</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Presenter</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5}>Loading cases…</td>
                  </tr>
                )}
                {!isLoading && !data?.recent_cases.length && (
                  <tr>
                    <td colSpan={5}>No cases yet.</td>
                  </tr>
                )}
                {data?.recent_cases.map((c) => (
                  <tr key={c.id}>
                    <td className="case-id">{c.patient?.full_name ?? c.patient_id}</td>
                    <td>{c.patient?.cancer_site ?? '—'}</td>
                    <td>
                      <PriorityPill priority={c.priority} />
                    </td>
                    <td>
                      <span className="status">{c.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{c.presenter_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CareNetwork3D />
          <div className="panel">
            <div className="panel-head">
              <div className="title">
                <span className="ic">
                  <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                    <path d="M3 12h4l2 8 4-16 2 8h6" />
                  </svg>
                </span>
                Recent Activity
              </div>
            </div>
            {isLoading && <div className="activity-item">Loading…</div>}
            {data?.recent_activity.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="activity-icon">
                  <svg className="icon" width={15} height={15} viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <strong>{a.action.replace(/[._]/g, ' ')}</strong>
                  <div className="meta">{a.actor_name ?? 'System'}</div>
                  <div className="time">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            ))}
            {!isLoading && !data?.recent_activity.length && <div className="activity-item">No recent activity.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
