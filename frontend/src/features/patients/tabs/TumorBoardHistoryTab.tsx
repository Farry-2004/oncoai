import { Link } from 'react-router-dom'
import { usePatientCases } from '@/hooks/usePatientProfile'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'

export function TumorBoardHistoryTab({ patientId }: { patientId: string }) {
  const { data: cases, isLoading } = usePatientCases(patientId)

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Presenter</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <TableRowsSkeleton columns={5} />}
          {!isLoading && !cases?.length && (
            <tr>
              <td colSpan={5}>This patient has not been presented at a tumor board yet.</td>
            </tr>
          )}
          {cases?.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/tumor-board/${c.session_id}`} className="case-id">
                  Session
                </Link>
              </td>
              <td>
                <PriorityPill priority={c.priority} />
              </td>
              <td>
                <span className="status">{c.status.replace(/_/g, ' ')}</span>
              </td>
              <td>{c.presenter_name ?? '—'}</td>
              <td>{c.summary ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
