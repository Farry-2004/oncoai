import { usePatientCases, usePatientWorkups, useFollowUps } from '@/hooks/usePatientProfile'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Patient } from '@/types/api'

function calculateAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

export function OverviewTab({ patient }: { patient: Patient }) {
  const { data: workups } = usePatientWorkups(patient.id)
  const { data: cases } = usePatientCases(patient.id)
  const { data: followUps } = useFollowUps(patient.id)

  const completedCount = workups?.filter((w) => w.status === 'completed').length ?? 0
  const completionPct = workups?.length ? Math.round((completedCount / workups.length) * 100) : 0
  const upcomingFollowUp = followUps?.find((f) => f.status === 'scheduled')

  return (
    <div className="dash-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <div className="panel">
        <div className="panel-head">
          <div className="title">Clinical Summary</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.92rem' }}>
          <div>
            <strong>Age / Sex:</strong> {calculateAge(patient.date_of_birth)} / {patient.sex}
          </div>
          <div>
            <strong>Cancer site:</strong> {patient.cancer_site}
          </div>
          <div>
            <strong>Histology:</strong> {patient.histology ?? 'Not recorded'}
          </div>
          <div>
            <strong>Stage:</strong> {patient.stage ?? 'Not recorded'}
          </div>
          <div>
            <strong>Facility:</strong> {patient.facility}
          </div>
          <div>
            <strong>Primary physician:</strong> {patient.primary_physician_name ?? 'Unassigned'}
          </div>
          <div>
            <strong>Status:</strong> <StatusBadge status={patient.status} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="panel">
          <div className="panel-head">
            <div className="title">Workup Completion</div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{completionPct}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            {completedCount} of {workups?.length ?? 0} items complete
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="title">Tumor Board</div>
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            {cases?.length ? `Presented ${cases.length} time${cases.length === 1 ? '' : 's'}` : 'Not yet presented'}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="title">Next Follow-up</div>
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            {upcomingFollowUp ? new Date(upcomingFollowUp.follow_up_date).toLocaleDateString() : 'None scheduled'}
          </div>
        </div>
      </div>
    </div>
  )
}
