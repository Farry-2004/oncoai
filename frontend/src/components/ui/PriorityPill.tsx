import type { CasePriority } from '@/types/api'

export function PriorityPill({ priority }: { priority: CasePriority | string }) {
  return <span className={`pill ${priority}`}>{priority}</span>
}
