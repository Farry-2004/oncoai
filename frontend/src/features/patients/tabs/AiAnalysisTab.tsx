import { useState } from 'react'
import { useAiAnalyses, useRunAiAnalysis } from '@/hooks/usePatientProfile'
import { AiResultCard } from '@/components/ui/AiResultCard'
import type { AnalysisType } from '@/types/api'
import styles from './AiAnalysisTab.module.css'

const ACTIONS: { type: AnalysisType; label: string }[] = [
  { type: 'case_summary', label: 'Summarize Case' },
  { type: 'extract_clinical_facts', label: 'Extract Clinical Facts' },
  { type: 'missing_information', label: 'Identify Missing Information' },
  { type: 'timeline_analysis', label: 'Analyze Timeline' },
  { type: 'tumor_board_brief', label: 'Prepare Tumor Board Brief' },
  { type: 'compare_evidence', label: 'Compare Available Evidence' },
  { type: 'specialist_questions', label: 'Generate Questions for Specialists' },
  { type: 'patient_explanation', label: 'Generate Patient-Friendly Explanation' },
  { type: 'follow_up_summary', label: 'Draft Follow-Up Summary' },
]

const LABELS: Record<AnalysisType, string> = Object.fromEntries(ACTIONS.map((a) => [a.type, a.label])) as Record<
  AnalysisType,
  string
>

export function AiAnalysisTab({ patientId }: { patientId: string }) {
  const { data: analyses, isLoading } = useAiAnalyses(patientId)
  const runAnalysis = useRunAiAnalysis(patientId)
  const [pendingType, setPendingType] = useState<AnalysisType | null>(null)

  async function handleRun(type: AnalysisType) {
    setPendingType(type)
    try {
      await runAnalysis.mutateAsync(type)
    } finally {
      setPendingType(null)
    }
  }

  return (
    <div>
      <div className={styles.actions}>
        {ACTIONS.map((a) => (
          <button
            key={a.type}
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid var(--border)' }}
            disabled={pendingType !== null}
            onClick={() => handleRun(a.type)}
          >
            {pendingType === a.type ? 'Generating…' : a.label}
          </button>
        ))}
      </div>

      <div className={styles.results}>
        {isLoading && <div>Loading past analyses…</div>}
        {!isLoading && !analyses?.length && (
          <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            No AI analysis has been run for this patient yet. Choose an action above to generate one from
            this patient's real records.
          </div>
        )}
        {analyses?.map((a) => (
          <AiResultCard
            key={a.id}
            title={`OncoAI Clinical Intelligence — ${LABELS[a.analysis_type] ?? a.analysis_type}`}
            content={a.content}
            ok={a.ok}
            meta={`${a.requested_by_name ?? 'Unknown'} · ${new Date(a.created_at).toLocaleString()} · ${a.model_used}`}
          />
        ))}
      </div>
    </div>
  )
}
