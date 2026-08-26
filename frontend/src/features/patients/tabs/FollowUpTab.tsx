import { useState } from 'react'
import {
  useCreateFamilyConference,
  useCreateFollowUp,
  useFamilyConferences,
  useFollowUps,
} from '@/hooks/usePatientProfile'
import { LoadingRow } from '@/components/ui/Spinner'
import type { FamilyConferenceOutcome } from '@/types/api'
import styles from './RecordListTab.module.css'

const OUTCOME_LABEL: Record<FamilyConferenceOutcome, string> = {
  proceeding: 'Patient proceeding with plan',
  needs_more_time: 'Needs more time to decide',
  declined: 'Patient could not proceed — referred back to TB',
}

export function FollowUpTab({ patientId }: { patientId: string }) {
  const { data: followUps, isLoading } = useFollowUps(patientId)
  const createFollowUp = useCreateFollowUp(patientId)
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: conferences, isLoading: conferencesLoading } = useFamilyConferences(patientId)
  const createConference = useCreateFamilyConference(patientId)
  const [participants, setParticipants] = useState('')
  const [questions, setQuestions] = useState('')
  const [outcome, setOutcome] = useState<FamilyConferenceOutcome>('proceeding')
  const [showConferenceForm, setShowConferenceForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createFollowUp.mutateAsync({ follow_up_date: date, notes: notes || undefined })
    setDate('')
    setNotes('')
    setShowForm(false)
  }

  async function handleConferenceSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createConference.mutateAsync({
      participants,
      questions_raised: questions || undefined,
      outcome,
    })
    setParticipants('')
    setQuestions('')
    setOutcome('proceeding')
    setShowConferenceForm(false)
  }

  return (
    <div>
      <div className={styles.list}>
        {isLoading && (
          <div className={styles.empty}>
            <LoadingRow />
          </div>
        )}
        {!isLoading && !followUps?.length && <div className={styles.empty}>No follow-ups scheduled yet.</div>}
        {followUps?.map((f) => (
          <div key={f.id} className={styles.entry}>
            <div className={styles.entryHead}>
              <span className={styles.entryTitle}>{new Date(f.follow_up_date).toLocaleDateString()}</span>
              <span className={`badge ${f.status === 'completed' ? 'ready_for_board' : f.status === 'missed' ? 'discharged' : 'in_workup'}`}>
                {f.status}
              </span>
            </div>
            {f.notes && <div className={styles.entryFindings}>{f.notes}</div>}
            {f.created_by_name && <div className={styles.entryMeta}>Scheduled by {f.created_by_name}</div>}
          </div>
        ))}
      </div>

      {showForm ? (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fu-date">Follow-up date</label>
            <input id="fu-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="fu-notes">Notes</label>
            <textarea
              id="fu-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Purpose of the visit, care instructions..."
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-dark btn-sm" disabled={createFollowUp.isPending}>
              {createFollowUp.isPending ? 'Saving…' : 'Schedule follow-up'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
          + Schedule follow-up
        </button>
      )}

      <div className="panel-head" style={{ marginTop: 28 }}>
        <div className="title">Family Conferences (Post-TB)</div>
      </div>
      <div className={styles.list}>
        {conferencesLoading && (
          <div className={styles.empty}>
            <LoadingRow />
          </div>
        )}
        {!conferencesLoading && !conferences?.length && (
          <div className={styles.empty}>No family conference calls logged yet.</div>
        )}
        {conferences?.map((c) => (
          <div key={c.id} className={styles.entry}>
            <div className={styles.entryHead}>
              <span className={styles.entryTitle}>{new Date(c.conducted_at).toLocaleDateString()}</span>
              <span
                className={`badge ${c.outcome === 'proceeding' ? 'ready_for_board' : c.outcome === 'declined' ? 'discharged' : 'in_workup'}`}
              >
                {OUTCOME_LABEL[c.outcome]}
              </span>
            </div>
            <div className={styles.entryFindings}>Participants: {c.participants}</div>
            {c.questions_raised && <div className={styles.entryFindings}>Questions raised: {c.questions_raised}</div>}
            {c.conducted_by_name && <div className={styles.entryMeta}>Called by {c.conducted_by_name}</div>}
          </div>
        ))}
      </div>

      {showConferenceForm ? (
        <form className={styles.formCard} onSubmit={handleConferenceSubmit}>
          <div className="field">
            <label htmlFor="fc-participants">Participants</label>
            <input
              id="fc-participants"
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Patient, spouse, ..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="fc-questions">Questions raised</label>
            <textarea
              id="fc-questions"
              rows={3}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="Cost of treatment, appointment logistics..."
            />
          </div>
          <div className="field">
            <label htmlFor="fc-outcome">Outcome</label>
            <select id="fc-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as FamilyConferenceOutcome)}>
              <option value="proceeding">Patient proceeding with plan</option>
              <option value="needs_more_time">Needs more time to decide</option>
              <option value="declined">Patient could not proceed — refer back to TB</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-dark btn-sm" disabled={createConference.isPending}>
              {createConference.isPending ? 'Saving…' : 'Log conference call'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowConferenceForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowConferenceForm(true)}>
          + Log family conference call
        </button>
      )}
    </div>
  )
}
