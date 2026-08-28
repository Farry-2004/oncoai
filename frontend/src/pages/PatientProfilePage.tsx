import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePatient } from '@/hooks/usePatientProfile'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriorityPill } from '@/components/ui/PriorityPill'
import { NewTaskDrawer } from '@/features/tasks/NewTaskDrawer'
import { GenerateReportDrawer } from '@/features/reports/GenerateReportDrawer'
import { OverviewTab } from '@/features/patients/tabs/OverviewTab'
import { RecordListTab } from '@/features/patients/tabs/RecordListTab'
import { ImagingTab } from '@/features/patients/tabs/ImagingTab'
import { InvestigationsTab } from '@/features/patients/tabs/InvestigationsTab'
import { TumorBoardHistoryTab } from '@/features/patients/tabs/TumorBoardHistoryTab'
import { FollowUpTab } from '@/features/patients/tabs/FollowUpTab'
import { AiAnalysisTab } from '@/features/patients/tabs/AiAnalysisTab'
import { TabIcon } from '@/features/patients/TabIcon'
import styles from './PatientProfilePage.module.css'

const TABS = [
  'Overview',
  'Clinical History',
  'Investigations',
  'Imaging',
  'Pathology',
  'Laboratory',
  'Treatment',
  'Tumor Board',
  'Follow-up',
  'AI Analysis',
] as const
type Tab = (typeof TABS)[number]

function calculateAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading, isError, refetch } = usePatient(id)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)

  if (isLoading) return <div className="panel">Loading patient…</div>
  if (isError || !patient) {
    return (
      <div>
        <Link to="/patients" className="back-link">
          ← Back to Patient Tracking
        </Link>
        <ErrorState title="Couldn't load this patient" onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div>
      <Link to="/patients" className="back-link">
        ← Back to Patient Tracking
      </Link>

      <div className="dash-header">
        <div>
          <h1>{patient.full_name}</h1>
          <div className={styles.headerMeta}>
            <span className={styles.mrn}>{patient.mrn}</span>
            <span>
              {calculateAge(patient.date_of_birth)} / {patient.sex}
            </span>
            <span>{patient.cancer_site}</span>
            <span>{patient.stage ?? 'Stage not recorded'}</span>
            <PriorityPill priority={patient.priority} />
            <StatusBadge status={patient.status} />
          </div>
        </div>
        <div className="dash-actions">
          <button className="btn btn-ghost" type="button" onClick={() => setReportDrawerOpen(true)} style={{ border: '1px solid var(--border)' }}>
            Generate Report
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setTaskDrawerOpen(true)}>
            + Assign Task
          </button>
        </div>
      </div>

      <DemoDataBanner />

      <div className={styles.tabStrip}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <TabIcon tab={tab} />
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewTab patient={patient} />}
      {activeTab === 'Clinical History' && (
        <RecordListTab
          patientId={patient.id}
          recordType="clinical_note"
          titlePlaceholder="e.g. Initial consultation"
          findingsPlaceholder="Clinical notes, history of presenting complaint..."
        />
      )}
      {activeTab === 'Investigations' && <InvestigationsTab patientId={patient.id} />}
      {activeTab === 'Imaging' && <ImagingTab patientId={patient.id} />}
      {activeTab === 'Pathology' && (
        <RecordListTab
          patientId={patient.id}
          recordType="pathology"
          titlePlaceholder="e.g. Core biopsy histopathology"
          findingsPlaceholder="Pathology findings..."
        />
      )}
      {activeTab === 'Laboratory' && (
        <RecordListTab
          patientId={patient.id}
          recordType="lab"
          titlePlaceholder="e.g. Full blood count"
          findingsPlaceholder="Lab results..."
        />
      )}
      {activeTab === 'Treatment' && (
        <RecordListTab
          patientId={patient.id}
          recordType="treatment"
          titlePlaceholder="e.g. Cycle 1 chemotherapy"
          findingsPlaceholder="Treatment given, response, tolerance..."
        />
      )}
      {activeTab === 'Tumor Board' && <TumorBoardHistoryTab patientId={patient.id} />}
      {activeTab === 'Follow-up' && <FollowUpTab patientId={patient.id} />}
      {activeTab === 'AI Analysis' && <AiAnalysisTab patientId={patient.id} />}

      {taskDrawerOpen && (
        <NewTaskDrawer
          onClose={() => setTaskDrawerOpen(false)}
          patientId={patient.id}
          patientName={patient.full_name}
        />
      )}

      {reportDrawerOpen && (
        <GenerateReportDrawer onClose={() => setReportDrawerOpen(false)} fixedPatientId={patient.id} />
      )}
    </div>
  )
}
