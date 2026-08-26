import { useEffect, useState } from 'react'
import { usePatientConcerns, useSavePatientConcerns } from '@/hooks/usePatientProfile'
import type { ConcernCategory, ConcernLevel, PatientConcernsInput } from '@/types/api'

const EMPTY_INPUT: PatientConcernsInput = {
  transportation_barrier: false,
  housing_barrier: false,
  financial_barrier: false,
  dependent_care_barrier: false,
  other_barrier_notes: '',
  travel_concern: 'not_concerned',
  financial_concern: 'not_concerned',
  risk_tolerance_concern: 'not_concerned',
  radiation_openness_concern: 'not_concerned',
}

const CATEGORY_PILL: Record<ConcernCategory, string> = { low: 'medium', moderate: 'high', high: 'critical' }
const LEVEL_LABEL: Record<ConcernLevel, string> = {
  not_concerned: 'Not concerned',
  somewhat_concerned: 'Somewhat concerned',
  very_concerned: 'Very concerned',
}

const CONCERN_FIELDS: { key: keyof PatientConcernsInput & string; label: string }[] = [
  { key: 'travel_concern', label: 'Ability to travel' },
  { key: 'financial_concern', label: 'Financial cost' },
  { key: 'risk_tolerance_concern', label: 'Risk tolerance for treatment' },
  { key: 'radiation_openness_concern', label: 'Openness to radiation' },
]

const BARRIER_FIELDS: { key: keyof PatientConcernsInput & string; label: string }[] = [
  { key: 'transportation_barrier', label: 'Transportation' },
  { key: 'housing_barrier', label: 'Housing' },
  { key: 'financial_barrier', label: 'Financial' },
  { key: 'dependent_care_barrier', label: 'Dependent care' },
]

export function ConcernsCard({ patientId }: { patientId: string }) {
  const { data: concerns, isLoading } = usePatientConcerns(patientId)
  const saveConcerns = useSavePatientConcerns(patientId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<PatientConcernsInput>(EMPTY_INPUT)

  useEffect(() => {
    if (concerns) {
      setForm({
        transportation_barrier: concerns.transportation_barrier,
        housing_barrier: concerns.housing_barrier,
        financial_barrier: concerns.financial_barrier,
        dependent_care_barrier: concerns.dependent_care_barrier,
        other_barrier_notes: concerns.other_barrier_notes ?? '',
        travel_concern: concerns.travel_concern,
        financial_concern: concerns.financial_concern,
        risk_tolerance_concern: concerns.risk_tolerance_concern,
        radiation_openness_concern: concerns.radiation_openness_concern,
      })
    }
  }, [concerns])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await saveConcerns.mutateAsync(form)
    setEditing(false)
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="title">Patient Concerns &amp; Barriers</div>
        {concerns && <span className={`pill ${CATEGORY_PILL[concerns.concern_category]}`}>{concerns.concern_category} concern</span>}
      </div>

      {isLoading && <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Loading…</div>}

      {!isLoading && !editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
          {!concerns && <div style={{ color: 'var(--gray-500)' }}>Not yet recorded for this patient.</div>}
          {concerns && (
            <>
              <div>
                <strong>Socioeconomic barriers:</strong>{' '}
                {BARRIER_FIELDS.filter((f) => concerns[f.key as keyof typeof concerns]).map((f) => f.label).join(', ') ||
                  'None noted'}
              </div>
              {concerns.other_barrier_notes && (
                <div>
                  <strong>Other:</strong> {concerns.other_barrier_notes}
                </div>
              )}
              {CONCERN_FIELDS.map((f) => (
                <div key={f.key}>
                  <strong>{f.label}:</strong> {LEVEL_LABEL[concerns[f.key as keyof typeof concerns] as ConcernLevel]}
                </div>
              ))}
              {concerns.updated_by_name && (
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Last updated by {concerns.updated_by_name}
                </div>
              )}
            </>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            {concerns ? 'Edit' : '+ Record concerns'}
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Socioeconomic barriers</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {BARRIER_FIELDS.map((f) => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={form[f.key] as boolean}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="other-barriers">Other barrier notes</label>
            <input
              id="other-barriers"
              type="text"
              value={form.other_barrier_notes ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, other_barrier_notes: e.target.value }))}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Treatment concern survey</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CONCERN_FIELDS.map((f) => (
                <div key={f.key} className="field">
                  <label htmlFor={f.key}>{f.label}</label>
                  <select
                    id={f.key}
                    value={form[f.key] as string}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value as ConcernLevel }))}
                  >
                    <option value="not_concerned">Not concerned</option>
                    <option value="somewhat_concerned">Somewhat concerned</option>
                    <option value="very_concerned">Very concerned</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-dark btn-sm" disabled={saveConcerns.isPending}>
              {saveConcerns.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
