import { useState } from 'react'
import { useCreateWorkup, usePatientWorkups, useUpdateWorkup } from '@/hooks/usePatientProfile'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import type { WorkupItemType, WorkupStatus } from '@/types/api'
import styles from './InvestigationsTab.module.css'

const ITEM_TYPES: WorkupItemType[] = ['imaging', 'pathology', 'labs', 'genomics', 'other']
const STATUSES: WorkupStatus[] = ['ordered', 'in_progress', 'completed', 'cancelled']

export function InvestigationsTab({ patientId }: { patientId: string }) {
  const { data: workups, isLoading } = usePatientWorkups(patientId)
  const createWorkup = useCreateWorkup(patientId)
  const updateWorkup = useUpdateWorkup(patientId)
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<WorkupItemType>('imaging')
  const [showForm, setShowForm] = useState(false)

  const completedCount = workups?.filter((w) => w.status === 'completed').length ?? 0
  const completionPct = workups?.length ? Math.round((completedCount / workups.length) * 100) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createWorkup.mutateAsync({ item_type: itemType, description })
    setDescription('')
    setShowForm(false)
  }

  return (
    <div>
      {!isLoading && !!workups?.length && (
        <div className={styles.completion}>
          Workup completion: <strong>{completionPct}%</strong> ({completedCount}/{workups.length})
          {completionPct === 100 && ' — Ready for Tumor Board'}
        </div>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <TableRowsSkeleton columns={4} />}
            {!isLoading && !workups?.length && (
              <tr>
                <td colSpan={4}>No investigations recorded yet.</td>
              </tr>
            )}
            {workups?.map((w) => (
              <tr key={w.id}>
                <td style={{ textTransform: 'capitalize' }}>{w.item_type}</td>
                <td>{w.description}</td>
                <td>
                  <select
                    className={styles.statusSelect}
                    value={w.status}
                    onChange={(e) => updateWorkup.mutate({ workupId: w.id, status: e.target.value as WorkupStatus })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{w.due_date ? new Date(w.due_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        {showForm ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="wu-type">Type</label>
              <select id="wu-type" value={itemType} onChange={(e) => setItemType(e.target.value as WorkupItemType)}>
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label htmlFor="wu-desc">Description</label>
              <input
                id="wu-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Contrast CT Neck"
                required
              />
            </div>
            <button type="submit" className="btn btn-dark btn-sm" disabled={createWorkup.isPending}>
              {createWorkup.isPending ? 'Adding…' : 'Add'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
            + Add investigation
          </button>
        )}
      </div>
    </div>
  )
}
