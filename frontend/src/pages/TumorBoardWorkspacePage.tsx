import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  useAddCaseToQueue,
  useMarkAttendance,
  useRemoveAttendance,
  useSessionMeetingLink,
  useSetSessionMeetingLink,
  useTumorBoardAttendance,
  useTumorBoardSession,
  useTumorBoardSessions,
  useUpdateCase,
} from '@/hooks/useTumorBoard'
import { usePatients } from '@/hooks/usePatients'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { NewTaskDrawer } from '@/features/tasks/NewTaskDrawer'
import { CaseFindingsSection } from '@/features/tumor-board/CaseFindingsSection'
import { DiscussionAndDecision } from '@/features/tumor-board/DiscussionAndDecision'
import { GenerateReportDrawer } from '@/features/reports/GenerateReportDrawer'
import type { CasePriority, CaseStatus, TumorBoardCase } from '@/types/api'
import styles from './TumorBoardWorkspacePage.module.css'

const CAN_MANAGE_ATTENDANCE = new Set(['tumor_board_coordinator', 'administrator'])

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

  const { user } = useAuth()
  const canManageAttendance = !!user && CAN_MANAGE_ATTENDANCE.has(user.role)
  const { data: attendance } = useTumorBoardAttendance(activeSessionId)
  const { data: allUsers } = useUsers()
  const markAttendance = useMarkAttendance(activeSessionId)
  const removeAttendance = useRemoveAttendance(activeSessionId)
  const [attendeeId, setAttendeeId] = useState('')
  const attendeeOptions = (allUsers ?? []).filter((u) => !attendance?.some((a) => a.user_id === u.id))

  const { data: meetingLink } = useSessionMeetingLink(activeSessionId)
  const setMeetingLink = useSetSessionMeetingLink(activeSessionId)
  const [editingLink, setEditingLink] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')

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
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {editingLink ? (
                  <>
                    <input
                      type="url"
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      placeholder="https://meet.example.com/..."
                      style={{ minWidth: 260 }}
                    />
                    <button
                      type="button"
                      className="btn btn-dark btn-sm"
                      disabled={!linkDraft || setMeetingLink.isPending}
                      onClick={() => {
                        setMeetingLink.mutate(linkDraft, { onSuccess: () => setEditingLink(false) })
                      }}
                    >
                      {setMeetingLink.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingLink(false)}>
                      Cancel
                    </button>
                  </>
                ) : meetingLink ? (
                  <>
                    <a href={meetingLink.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                      Dial in patient
                    </a>
                    {canManageAttendance && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setLinkDraft(meetingLink.meeting_link)
                          setEditingLink(true)
                        }}
                      >
                        Edit link
                      </button>
                    )}
                  </>
                ) : (
                  canManageAttendance && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ border: '1px solid var(--border)' }}
                      onClick={() => {
                        setLinkDraft('')
                        setEditingLink(true)
                      }}
                    >
                      + Add meeting link for patient dial-in
                    </button>
                  )
                )}
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

                  {activeSessionId && <CaseFindingsSection sessionId={activeSessionId} caseId={c.id} />}
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

          <div className="panel" style={{ marginTop: 20 }}>
            <div className="panel-head">
              <div className="title">Attendance &amp; CME Credit</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: canManageAttendance ? 14 : 0 }}>
              {!attendance?.length && <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>No attendance recorded yet.</div>}
              {attendance?.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span>
                    {a.user_name ?? 'Unknown'} <span style={{ color: 'var(--gray-500)' }}>({a.user_role?.replace(/_/g, ' ')})</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="pill medium">{a.cme_credit} CME</span>
                    {canManageAttendance && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={removeAttendance.isPending}
                        onClick={() => removeAttendance.mutate(a.id)}
                      >
                        Remove
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {canManageAttendance && (
              <div className={styles.addCaseRow}>
                <select value={attendeeId} onChange={(e) => setAttendeeId(e.target.value)}>
                  <option value="">Select attendee…</option>
                  {attendeeOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  disabled={!attendeeId || markAttendance.isPending}
                  onClick={() => {
                    markAttendance.mutate({ user_id: attendeeId }, { onSuccess: () => setAttendeeId('') })
                  }}
                >
                  {markAttendance.isPending ? 'Marking…' : 'Mark Present'}
                </button>
              </div>
            )}
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
