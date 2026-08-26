import type { PatientStatus } from '@/types/api'

const LABELS: Record<PatientStatus, string> = {
  new: 'New',
  in_workup: 'In Workup',
  ready_for_board: 'Ready for TB',
  under_treatment: 'Under Treatment',
  follow_up: 'Follow-up',
  discharged: 'Discharged',
}

export function StatusBadge({ status }: { status: PatientStatus }) {
  return <span className={`badge ${status}`}>{LABELS[status] ?? status}</span>
}
