import { useState } from 'react'
import { useRecordDecision, useTumorBoardDecision } from '@/hooks/useTumorBoardDecision'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/api'
import { LoadingRow } from '@/components/ui/Spinner'
import { CHECKLIST_LABELS, EMPTY_CHECKLIST } from '@/types/api'
import type { DiscussionChecklist } from '@/types/api'
import styles from './DiscussionAndDecision.module.css'

const CHECKLIST_KEYS = Object.keys(EMPTY_CHECKLIST) as (keyof DiscussionChecklist)[]

export function DiscussionAndDecision({ sessionId, caseId }: { sessionId: string; caseId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { data: decision, isLoading } = useTumorBoardDecision(sessionId, caseId)
  const recordDecision = useRecordDecision(sessionId, caseId)
  const { showToast } = useToast()

  const [checklist, setChecklist] = useState<DiscussionChecklist>(EMPTY_CHECKLIST)
  const [decisionText, setDecisionText] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [rationale, setRationale] = useState('')
  const [additionalInvestigations, setAdditionalInvestigations] = useState('')
  const [responsibleTeam, setResponsibleTeam] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const checkedCount = CHECKLIST_KEYS.filter((k) => checklist[k]).length
  const checklistComplete = checkedCount === CHECKLIST_KEYS.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await recordDecision.mutateAsync({
        checklist,
        decision: decisionText,
        treatment_plan: treatmentPlan,
        rationale,
        additional_investigations: additionalInvestigations || undefined,
        responsible_team: responsibleTeam,
        follow_up_date: followUpDate || undefined,
      })
      showToast('Tumor board decision recorded', 'success')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to record decision.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        {decision ? 'View Discussion & Decision' : 'Discussion & Decision'} {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className={styles.panel}>
          {isLoading && <LoadingRow />}

          {!isLoading && decision && (
            <div className={styles.decisionCard}>
              <div className={styles.decisionHead}>Tumor Board Decision — Recorded</div>
              <div className={styles.decisionRow}>
                <strong>Decision</strong>
                {decision.decision}
              </div>
              <div className={styles.decisionRow}>
                <strong>Treatment Plan</strong>
                {decision.treatment_plan}
              </div>
              <div className={styles.decisionRow}>
                <strong>Rationale</strong>
                {decision.rationale}
              </div>
              {decision.additional_investigations && (
                <div className={styles.decisionRow}>
                  <strong>Additional Investigations</strong>
                  {decision.additional_investigations}
                </div>
              )}
              <div className={styles.decisionRow}>
                <strong>Responsible Team</strong>
                {decision.responsible_team}
              </div>
              {decision.follow_up_date && (
                <div className={styles.decisionRow}>
                  <strong>Follow-up Date</strong>
                  {new Date(decision.follow_up_date).toLocaleDateString()}
                </div>
              )}
              <div className={styles.decisionMeta}>
                Recorded by {decision.decided_by_name ?? 'Unknown'} on{' '}
                {new Date(decision.created_at).toLocaleString()}
              </div>
            </div>
          )}

          {!isLoading && !decision && (
            <>
              <div className={styles.progress}>
                Structured discussion checklist: <strong>{checkedCount}/10</strong> complete
              </div>
              <div className={styles.checklist}>
                {CHECKLIST_KEYS.map((key) => (
                  <label key={key} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={checklist[key]}
                      onChange={(e) => setChecklist((c) => ({ ...c, [key]: e.target.checked }))}
                    />
                    {CHECKLIST_LABELS[key]}
                  </label>
                ))}
              </div>

              {error && <div className="form-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor={`${caseId}-decision`}>Decision</label>
                  <input
                    id={`${caseId}-decision`}
                    value={decisionText}
                    onChange={(e) => setDecisionText(e.target.value)}
                    placeholder="e.g. Proceed with concurrent chemoradiation"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${caseId}-plan`}>Treatment Plan</label>
                  <textarea
                    id={`${caseId}-plan`}
                    rows={2}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${caseId}-rationale`}>Rationale</label>
                  <textarea
                    id={`${caseId}-rationale`}
                    rows={2}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    required
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor={`${caseId}-team`}>Responsible Team</label>
                    <input
                      id={`${caseId}-team`}
                      value={responsibleTeam}
                      onChange={(e) => setResponsibleTeam(e.target.value)}
                      placeholder="e.g. Radiation Oncology"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`${caseId}-followup`}>Follow-up Date</label>
                    <input
                      id={`${caseId}-followup`}
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`${caseId}-additional`}>Additional Investigations</label>
                  <input
                    id={`${caseId}-additional`}
                    value={additionalInvestigations}
                    onChange={(e) => setAdditionalInvestigations(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-dark btn-sm"
                  disabled={!checklistComplete || recordDecision.isPending}
                  title={!checklistComplete ? 'Complete the discussion checklist first' : undefined}
                >
                  {recordDecision.isPending ? 'Recording…' : 'Record Tumor Board Decision'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
