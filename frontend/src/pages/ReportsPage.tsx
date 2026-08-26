import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReports } from '@/hooks/useReports'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { GenerateReportDrawer } from '@/features/reports/GenerateReportDrawer'
import { REPORT_TYPE_LABELS } from '@/types/api'
import type { ReportType } from '@/types/api'
import styles from './ReportsPage.module.css'

export function ReportsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: reports, isLoading, isError } = useReports({
    report_type: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Reports</h1>
          <p className="sub">Tumor board, clinical, and patient-facing reports</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" type="button" onClick={() => setDrawerOpen(true)}>
            + Generate Report
          </button>
        </div>
      </div>

      <DemoDataBanner />

      <div className={styles.filters}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | '')}>
          <option value="">All report types</option>
          {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
            <option key={t} value={t}>
              {REPORT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {isError && <div className="form-error">Couldn't load reports. Is the API running?</div>}

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton columns={6} />}
              {!isLoading && !reports?.length && (
                <tr>
                  <td colSpan={6}>No reports yet. Generate one to get started.</td>
                </tr>
              )}
              {reports?.map((r) => (
                <tr key={r.id} className={styles.rowLink} onClick={() => navigate(`/reports/${r.id}`)}>
                  <td className="case-id">
                    {r.title}
                    {r.ai_sourced && <span className={styles.aiTag}>AI-sourced</span>}
                  </td>
                  <td>{REPORT_TYPE_LABELS[r.report_type]}</td>
                  <td>{r.patient_name ?? 'Tumor board session'}</td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[r.status]}`}>{r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{r.approved_by_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && <GenerateReportDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
