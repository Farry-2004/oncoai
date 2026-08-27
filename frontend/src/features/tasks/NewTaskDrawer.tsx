import { useState } from 'react'
import { useCreateTask } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/context/ToastContext'
import type { TaskPriority } from '@/types/api'
import styles from './NewTaskDrawer.module.css'

export function NewTaskDrawer({
  onClose,
  patientId,
  patientName,
  tumorBoardCaseId,
  contextLabel,
}: {
  onClose: () => void
  patientId?: string
  patientName?: string
  tumorBoardCaseId?: string
  contextLabel?: string
}) {
  const createTask = useCreateTask()
  const { data: users } = useUsers()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createTask.mutateAsync({
      title,
      description: description || undefined,
      patient_id: patientId,
      tumor_board_case_id: tumorBoardCaseId,
      assigned_to_id: assignedTo || undefined,
      priority,
      due_date: dueDate || undefined,
    })
    showToast('Task assigned', 'success')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <h3>Assign Task</h3>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </div>

        {contextLabel && <div className={styles.context}>Linked to: {contextLabel}</div>}
        {patientName && !contextLabel && <div className={styles.context}>Patient: {patientName}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="task-title">Task</label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pathology review"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="task-assignee">Assigned to</label>
              <select id="task-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-due">Due date</label>
            <input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-dark btn-block" disabled={createTask.isPending}>
            {createTask.isPending ? 'Assigning…' : 'Assign Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
