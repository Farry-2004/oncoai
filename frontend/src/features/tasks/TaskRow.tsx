import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAddTaskComment, useTaskComments, useUpdateTask } from '@/hooks/useTasks'
import { PriorityPill } from '@/components/ui/PriorityPill'
import type { Task, TaskStatus } from '@/types/api'
import styles from '@/pages/TasksPage.module.css'

export function TaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const updateTask = useUpdateTask()
  const { data: comments } = useTaskComments(task.id, expanded)
  const addComment = useAddTaskComment(task.id)

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    await addComment.mutateAsync(commentBody.trim())
    setCommentBody('')
  }

  return (
    <>
      <tr>
        <td>
          <button type="button" className={styles.expandToggle} onClick={() => setExpanded((v) => !v)}>
            {task.title} {task.comment_count > 0 && `(${task.comment_count})`}
          </button>
          {task.patient_id && (
            <div>
              <Link to={`/patients/${task.patient_id}`} className={styles.linkChip}>
                {task.patient_name ?? 'View patient'}
              </Link>
            </div>
          )}
        </td>
        <td>{task.assigned_to_name ?? 'Unassigned'}</td>
        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
        <td>
          <PriorityPill priority={task.priority} />
        </td>
        <td>
          <select
            className={styles.statusSelect}
            value={task.status}
            onChange={(e) => updateTask.mutate({ taskId: task.id, status: e.target.value as TaskStatus })}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </td>
      </tr>
      {expanded && (
        <tr className={styles.expandRow}>
          <td colSpan={5} className={styles.expandCell}>
            {task.description && <div style={{ marginBottom: 10, fontSize: '0.85rem' }}>{task.description}</div>}
            {comments?.map((c) => (
              <div key={c.id} className={styles.comment}>
                <div className={styles.commentMeta}>
                  {c.author_name ?? 'Unknown'} · {new Date(c.created_at).toLocaleString()}
                </div>
                <div>{c.body}</div>
              </div>
            ))}
            {!comments?.length && <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>No comments yet.</div>}
            <form className={styles.commentForm} onSubmit={handleAddComment}>
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment…"
              />
              <button type="submit" className="btn btn-ghost btn-sm" disabled={addComment.isPending}>
                Post
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
