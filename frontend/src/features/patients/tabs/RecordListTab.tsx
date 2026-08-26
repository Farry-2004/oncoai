import { useState } from 'react'
import { useCreatePatientRecord, usePatientRecords } from '@/hooks/usePatientProfile'
import type { RecordType } from '@/types/api'
import styles from './RecordListTab.module.css'

export function RecordListTab({
  patientId,
  recordType,
  titlePlaceholder,
  findingsPlaceholder,
}: {
  patientId: string
  recordType: RecordType
  titlePlaceholder: string
  findingsPlaceholder: string
}) {
  const { data: records, isLoading } = usePatientRecords(patientId, recordType)
  const createRecord = useCreatePatientRecord(patientId)
  const [title, setTitle] = useState('')
  const [findings, setFindings] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createRecord.mutateAsync({ record_type: recordType, title, findings })
    setTitle('')
    setFindings('')
    setShowForm(false)
  }

  return (
    <div>
      <div className={styles.list}>
        {isLoading && <div className={styles.empty}>Loading…</div>}
        {!isLoading && !records?.length && <div className={styles.empty}>No entries recorded yet.</div>}
        {records?.map((r) => (
          <div key={r.id} className={styles.entry}>
            <div className={styles.entryHead}>
              <span className={styles.entryTitle}>{r.title}</span>
              <span className={styles.entryDate}>{new Date(r.recorded_at).toLocaleDateString()}</span>
            </div>
            <div className={styles.entryFindings}>{r.findings}</div>
            {r.recorded_by_name && <div className={styles.entryMeta}>Recorded by {r.recorded_by_name}</div>}
          </div>
        ))}
      </div>

      {showForm ? (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor={`${recordType}-title`}>Title</label>
            <input
              id={`${recordType}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`${recordType}-findings`}>Findings</label>
            <textarea
              id={`${recordType}-findings`}
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder={findingsPlaceholder}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-dark btn-sm" disabled={createRecord.isPending}>
              {createRecord.isPending ? 'Saving…' : 'Save entry'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
          + Add entry
        </button>
      )}
    </div>
  )
}
