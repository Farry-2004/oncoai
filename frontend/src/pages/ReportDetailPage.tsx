import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApproveReport, useReport, useUpdateReport } from '@/hooks/useReports'
import { Alert } from '@/components/ui/Alert'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { ErrorState } from '@/components/ui/ErrorState'
import { ApiError } from '@/lib/api'
import { REPORT_TYPE_LABELS } from '@/types/api'
import styles from './ReportDetailPage.module.css'

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: report, isLoading, isError, refetch } = useReport(id)
  const updateReport = useUpdateReport(id ?? '')
  const approveReport = useApproveReport(id ?? '')

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (report) {
      setTitle(report.title)
      setContent(report.content)
    }
  }, [report])

  if (isLoading) return <div className="panel">Loading report…</div>
  if (isError || !report) {
    return (
      <div>
        <Link to="/reports" className="back-link">
          ← Back to Reports
        </Link>
        <ErrorState title="Couldn't load this report" onRetry={() => refetch()} />
      </div>
    )
  }

  async function handleSave() {
    setError(null)
    try {
      await updateReport.mutateAsync({ title, content })
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save changes.')
    }
  }

  async function handleApprove() {
    setError(null)
    try {
      await approveReport.mutateAsync()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to approve report.')
    }
  }

  return (
    <div>
      <Link to="/reports" className="back-link no-print">
        ← Back to Reports
      </Link>

      <div className={styles.header}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <input className={styles.docTitleInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          ) : (
            <h1>{report.title}</h1>
          )}
          <div className={styles.headerMeta}>
            <span>{REPORT_TYPE_LABELS[report.report_type]}</span>
            <span className={`${styles.statusPill} ${styles[report.status]}`}>{report.status}</span>
            {report.ai_sourced && <span className={styles.aiPill}>Contains AI-generated content</span>}
            {report.patient_name && <span>Patient: {report.patient_name}</span>}
          </div>
          {report.status === 'approved' && (
            <div className={styles.headerMeta}>
              Approved by {report.approved_by_name ?? 'Unknown'} on{' '}
              {report.approved_at ? new Date(report.approved_at).toLocaleString() : '—'}
            </div>
          )}
        </div>
        <div className={`${styles.actions} no-print`}>
          {editing ? (
            <>
              <button className="btn btn-dark btn-sm" type="button" onClick={handleSave} disabled={updateReport.isPending}>
                {updateReport.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => {
                  setTitle(report.title)
                  setContent(report.content)
                  setEditing(false)
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(true)}>
                Edit
              </button>
              {report.status !== 'approved' && (
                <button className="btn btn-dark btn-sm" type="button" onClick={handleApprove} disabled={approveReport.isPending}>
                  {approveReport.isPending ? 'Approving…' : 'Approve'}
                </button>
              )}
              <button className="btn btn-primary btn-sm" type="button" onClick={() => window.print()}>
                Print / Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="no-print">
        <DemoDataBanner />
      </div>

      {error && (
        <Alert type="error" className="no-print">
          {error}
        </Alert>
      )}

      {editing ? (
        <textarea className={styles.reportTextarea} value={content} onChange={(e) => setContent(e.target.value)} />
      ) : (
        <div className="panel">
          <div className={styles.reportBody}>{report.content}</div>
        </div>
      )}
    </div>
  )
}
