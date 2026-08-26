import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { NewTaskDrawer } from '@/features/tasks/NewTaskDrawer'
import { TaskRow } from '@/features/tasks/TaskRow'
import type { TaskStatus } from '@/types/api'
import styles from './TasksPage.module.css'

export function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: tasks, isLoading, isError } = useTasks({
    status: statusFilter || undefined,
    assigned_to_id: assigneeFilter || undefined,
  })
  const { data: users } = useUsers()

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Tasks</h1>
          <p className="sub">Care-team task tracking across patients and tumor board cases</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" type="button" onClick={() => setDrawerOpen(true)}>
            + Assign Task
          </button>
        </div>
      </div>

      <DemoDataBanner />

      <div className={styles.filters}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="">Everyone</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>
      </div>

      {isError && <div className="form-error">Couldn't load tasks. Is the API running?</div>}

      <div className="panel">
        <div className="panel-head">
          <div className="title">
            <span className="ic">
              <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="17" rx="2" />
                <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                <path d="m9 13 2 2 4-4" />
              </svg>
            </span>
            Care Team Tasks
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton columns={5} />}
              {!isLoading && !tasks?.length && (
                <tr>
                  <td colSpan={5}>No tasks match these filters.</td>
                </tr>
              )}
              {tasks?.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && <NewTaskDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
