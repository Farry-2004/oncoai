import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGenerateReport } from '@/hooks/useReports'
import { usePatients } from '@/hooks/usePatients'
import { useTumorBoardSessions } from '@/hooks/useTumorBoard'
import { ApiError } from '@/lib/api'
import { REPORT_TYPE_LABELS } from '@/types/api'
import type { ReportType } from '@/types/api'
import styles from './GenerateReportDrawer.module.css'

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[]

export function GenerateReportDrawer({
  onClose,
  fixedPatientId,
  fixedSessionId,
  fixedType,
}: {
  onClose: () => void
  fixedPatientId?: string
  fixedSessionId?: string
  fixedType?: ReportType
}) {
  const navigate = useNavigate()
  const generateReport = useGenerateReport()
  const [reportType, setReportType] = useState<ReportType>(
    fixedType ?? (fixedSessionId ? 'tumor_board_report' : 'clinical_summary'),
  )
  const [patientId, setPatientId] = useState(fixedPatientId ?? '')
  const [sessionId, setSessionId] = useState(fixedSessionId ?? '')
  const [error, setError] = useState<string | null>(null)

  const { data: patients } = usePatients({ page_size: 100 })
  const { data: sessions } = useTumorBoardSessions()

  const isSessionScoped = reportType === 'tumor_board_report'
  const canSubmit = isSessionScoped ? !!sessionId : !!patientId
  const visibleTypes = fixedPatientId
    ? REPORT_TYPES.filter((t) => t !== 'tumor_board_report')
    : fixedSessionId
      ? REPORT_TYPES.filter((t) => t === 'tumor_board_report')
      : REPORT_TYPES

  async function handleGenerate() {
    setError(null)
    try {
      const report = await generateReport.mutateAsync({
        report_type: reportType,
        patient_id: isSessionScoped ? undefined : patientId,
        tumor_board_session_id: isSessionScoped ? sessionId : undefined,
      })
      navigate(`/reports/${report.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to generate report.')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <h3>Generate Report</h3>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {!fixedType && (
          <div className={styles.typeGrid}>
            {visibleTypes.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.typeBtn} ${reportType === t ? styles.typeBtnActive : ''}`}
                onClick={() => setReportType(t)}
              >
                {REPORT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {isSessionScoped ? (
          !fixedSessionId && (
            <div className="field">
              <label htmlFor="report-session">Tumor board session</label>
              <select id="report-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                <option value="">Select session…</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          !fixedPatientId && (
            <div className="field">
              <label htmlFor="report-patient">Patient</label>
              <select id="report-patient" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select patient…</option>
                {patients?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        <button
          type="button"
          className="btn btn-dark btn-block"
          disabled={!canSubmit || generateReport.isPending}
          onClick={handleGenerate}
        >
          {generateReport.isPending ? 'Generating…' : 'Generate Report'}
        </button>
      </div>
    </div>
  )
}
