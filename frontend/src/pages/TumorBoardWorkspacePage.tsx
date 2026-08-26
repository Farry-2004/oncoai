import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  useAddCaseToQueue,
  useTumorBoardSession,
  useTumorBoardSessions,
  useUpdateCase,
} from '@/hooks/useTumorBoard'
import { usePatients } from '@/hooks/usePatients'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { NewTaskDrawer } from '@/features/tasks/NewTaskDrawer'
import { DiscussionAndDecision } from '@/features/tumor-board/DiscussionAndDecision'
import { GenerateReportDrawer } from '@/features/reports/GenerateReportDrawer'
import type { CasePriority, CaseStatus, TumorBoardCase } from '@/types/api'
import styles from './TumorBoardWorkspacePage.module.css'

const NEXT_STATUS: Record<CaseStatus, CaseStatus | null> = {
  pending: 'presenting',
  presenting: 'discussed',
  discussed: null,
  deferred: 'pending',
}
const STATUS_ACTION_LABEL: Record<CaseStatus, string> = {
  pending: 'Start Presenting',
  presenting: 'Mark Discussed',
  discussed: 'Discussed',
  deferred: 'Reopen',
}

export function TumorBoardWorkspacePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { data: sessions, isLoading: sessionsLoading } = useTumorBoardSessions()
  const [addPatientId, setAddPatientId] = useState('')
  const [addPriority, setAddPriority] = useState<CasePriority>('medium')
  const [taskDrawerCase, setTaskDrawerCase] = useState<TumorBoardCase | null>(null)
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)

  const activeSessionId = sessionId ?? sessions?.find((s) => s.status === 'in_progress')?.id ?? sessions?.[0]?.id

  useEffect(() => {
    if (!sessionId && activeSessionId) {
      navigate(`/tumor-board/${activeSessionId}`, { replace: true })
    }
  }, [sessionId, activeSessionId, navigate])

  const { data: session, isLoading: sessionLoading, isError } = useTumorBoardSession(activeSessionId)
  const updateCase = useUpdateCase(activeSessionId)
  const addCase = useAddCaseToQueue(activeSessionId)
  const { data: allPatients } = usePatients({ page_size: 100 })

  const isLoading = sessionsLoading || sessionLoading

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Tumor Board Workspace</h1>
          <p className="sub">Multidisciplinary case review and decision-making</p>
        </div>
      </div>

      <DemoDataBanner />

      {sessions && sessions.length > 0 && (
        <div className={styles.sessionPicker}>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.sessionTab} ${s.id === activeSessionId ? styles.sessionTabActive : ''}`}
              onClick={() => navigate(`/tumor-board/${s.id}`)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {isLoading && <div className="panel">Loading tumor board…</div>}
      {isError && <div className="form-error">Couldn't load this tumor board session.</div>}

      {session && (
        <>
          <div className={styles.sessionHeader}>
            <div>
              <h2>{session.title}</h2>
              <div className={styles.sessionMeta}>
                <span>
                  <strong>{new Date(session.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                </span>
                <span>{session.location ?? 'Location TBD'}</span>
                <span>
                  Chair: <strong>{session.chair_name ?? '—'}</strong>
                </span>
                <span>
                  Coordinator: <strong>{session.coordinator_name ?? '—'}</strong>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                style={{ border: '1px solid var(--border)' }}
                onClick={() => setReportDrawerOpen(true)}
              >
                Generate Report
              </button>
              <span className="badge new">{session.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className={styles.caseList}>
            {session.cases.length === 0 && <div className="panel">No cases queued for this session yet.</div>}
            {session.cases.map((c) => {
              const nextStatus = NEXT_STATUS[c.status]
              return (
                <div key={c.id} className={styles.caseCard}>
                  <div className={styles.caseCardTop}>
                    <div className={styles.caseCardLeft}>
                      <div className={styles.queueNum}>{c.queue_position + 1}</div>
                      <div>
                        <div className={styles.patientName}>
                          {c.patient_id ? (
                            <Link to={`/patients/${c.patient_id}`}>{c.patient?.full_name ?? 'Unknown patient'}</Link>
                          ) : (
                            c.patient?.full_name ?? 'Unknown patient'
                          )}
                        </div>
                        <div className={styles.patientMeta}>
                          {c.patient?.mrn} · {c.patient?.cancer_site} · {c.patient?.stage ?? 'Stage n/a'}
                        </div>
                        <div className={styles.patientMeta}>Presenter: {c.presenter_name ?? '—'}</div>
                      </div>
                    </div>
                    <div className={styles.caseCardActions}>
                      <PriorityPill priority={c.priority} />
                      <span className="status">{c.status.replace(/_/g, ' ')}</span>
                      {nextStatus && (
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={updateCase.isPending}
                          onClick={() => updateCase.mutate({ caseId: c.id, status: nextStatus })}
                        >
                          {STATUS_ACTION_LABEL[c.status]}
                        </button>
                      )}
                      {c.status !== 'deferred' && c.status !== 'discussed' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={updateCase.isPending}
                          onClick={() => updateCase.mutate({ caseId: c.id, status: 'deferred' })}
                        >
                          Defer
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setTaskDrawerCase(c)}>
                        + Assign Task
                      </button>
                    </div>
                  </div>

                  {c.summary && <div className={styles.summary}>{c.summary}</div>}

                  {c.ai_summary_demo && (
                    <div className={styles.aiBox}>
                      <div className={styles.aiBoxHead}>
                        <span>OncoAI Clinical Intelligence — Case Brief</span>
                        <span className={styles.aiDemoTag}>Demo Content</span>
                      </div>
                      <div className={styles.aiText}>{c.ai_summary_demo}</div>
                    </div>
                  )}

                  {activeSessionId && <DiscussionAndDecision sessionId={activeSessionId} caseId={c.id} />}
                </div>
              )
            })}
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <div className="panel-head">
              <div className="title">
                <span className="ic">
                  <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6M22 11h-6" />
                  </svg>
                </span>
                Add Case to Queue
              </div>
            </div>
            <div className={styles.addCaseRow}>
              <select value={addPatientId} onChange={(e) => setAddPatientId(e.target.value)}>
                <option value="">Select patient…</option>
                {allPatients?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.mrn})
                  </option>
                ))}
              </select>
              <select value={addPriority} onChange={(e) => setAddPriority(e.target.value as CasePriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={!addPatientId || addCase.isPending}
                onClick={() => {
                  addCase.mutate(
                    { patient_id: addPatientId, priority: addPriority },
                    { onSuccess: () => setAddPatientId('') },
                  )
                }}
              >
                {addCase.isPending ? 'Adding…' : 'Add to Queue'}
              </button>
            </div>
          </div>
        </>
      )}

      {taskDrawerCase && (
        <NewTaskDrawer
          onClose={() => setTaskDrawerCase(null)}
          patientId={taskDrawerCase.patient_id}
          tumorBoardCaseId={taskDrawerCase.id}
          contextLabel={`${taskDrawerCase.patient?.full_name ?? 'Patient'} — tumor board case`}
        />
      )}

      {reportDrawerOpen && activeSessionId && (
        <GenerateReportDrawer onClose={() => setReportDrawerOpen(false)} fixedSessionId={activeSessionId} />
      )}
    </div>
  )
}
