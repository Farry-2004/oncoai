import { Link } from 'react-router-dom'
import { useTBPreparation } from '@/hooks/useDashboardSummary'
import { LoadingRow } from '@/components/ui/Spinner'
import type { PreparationChecklist } from '@/types/api'
import styles from './TBPreparationCard.module.css'

const CHECKLIST_LABELS: Record<keyof PreparationChecklist, string> = {
  patient_history: 'Patient history',
  pathology: 'Pathology',
  imaging: 'Imaging',
  laboratory: 'Laboratory',
  treatment_history: 'Treatment history',
  workup_complete: 'Workup complete',
}
const CHECKLIST_KEYS = Object.keys(CHECKLIST_LABELS) as (keyof PreparationChecklist)[]

export function TBPreparationCard() {
  const { data, isLoading } = useTBPreparation()

  return (
    <div className={`panel ${styles.card}`}>
      <div className="panel-head">
        <div className="title">
          <span className="ic">
            <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          Tumor Board Preparation
        </div>
        {data?.session_id && (
          <Link to={`/tumor-board/${data.session_id}`} className="view-all">
            Open Tumor Board →
          </Link>
        )}
      </div>

      {isLoading && <LoadingRow label="Checking case readiness…" />}

      {!isLoading && !data?.session_id && (
        <div className={styles.emptyState}>No upcoming tumor board session is scheduled yet.</div>
      )}

      {!isLoading && data?.session_id && (
        <>
          <div className={styles.summaryRow}>
            <span>
              <strong>{data.total_count}</strong> case{data.total_count === 1 ? '' : 's'} scheduled
            </span>
            <span>
              <strong style={{ color: 'var(--success-fg)' }}>{data.ready_count}</strong> ready
            </span>
            <span>
              <strong style={{ color: data.total_count - data.ready_count > 0 ? 'var(--warning-fg)' : undefined }}>
                {data.total_count - data.ready_count}
              </strong>{' '}
              need attention
            </span>
            {data.session_title && (
              <span className={styles.summaryMeta}>
                {data.session_title}
                {data.scheduled_at &&
                  ` · ${new Date(data.scheduled_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
                {data.chair_name && ` · Chair: ${data.chair_name}`}
              </span>
            )}
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${data.total_count ? Math.round((data.ready_count / data.total_count) * 100) : 0}%` }}
            />
          </div>

          <div className={styles.caseGrid}>
            {data.cases.map((c) => (
              <div key={c.case_id} className={`${styles.caseTile} ${c.ready ? styles.ready : ''}`}>
                <div className={styles.caseName}>
                  <Link to={`/patients/${c.patient_id}`}>{c.patient_name}</Link>
                </div>
                <div className={styles.checklistList}>
                  {CHECKLIST_KEYS.map((key) => (
                    <span key={key} className={c.checklist[key] ? styles.checkYes : styles.checkNo}>
                      {c.checklist[key] ? '✓' : '⚠'} {CHECKLIST_LABELS[key]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <Link to={`/tumor-board/${data.session_id}`} className="btn btn-dark btn-sm">
              Open Tumor Board
            </Link>
            <Link to="/patients" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>
              Review Cases
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
