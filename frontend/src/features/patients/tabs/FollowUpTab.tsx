import { useState } from 'react'
import { useCreateFollowUp, useFollowUps } from '@/hooks/usePatientProfile'
import styles from './RecordListTab.module.css'

export function FollowUpTab({ patientId }: { patientId: string }) {
  const { data: followUps, isLoading } = useFollowUps(patientId)
  const createFollowUp = useCreateFollowUp(patientId)
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createFollowUp.mutateAsync({ follow_up_date: date, notes: notes || undefined })
    setDate('')
    setNotes('')
    setShowForm(false)
  }

  return (
    <div>
      <div className={styles.list}>
        {isLoading && <div className={styles.empty}>Loading…</div>}
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
    </div>
  )
}
