import { useState } from 'react'
import { useCreatePatient } from '@/hooks/usePatients'
import { useToast } from '@/context/ToastContext'
import { Alert } from '@/components/ui/Alert'
import { ApiError } from '@/lib/api'
import type { PatientCreateInput, Sex } from '@/types/api'
import styles from './NewPatientDrawer.module.css'

const CANCER_SITES = [
  'Oropharynx', 'Larynx', 'Oral Cavity', 'Nasopharynx', 'Hypopharynx', 'Thyroid', 'Salivary Gland',
]

export function NewPatientDrawer({ onClose }: { onClose: () => void }) {
  const createPatient = useCreatePatient()
  const { showToast } = useToast()
  const [form, setForm] = useState<PatientCreateInput>({
    mrn: '',
    full_name: '',
    date_of_birth: '',
    sex: 'female' as Sex,
    cancer_site: CANCER_SITES[0],
    stage: '',
    facility: '',
    priority: 'medium',
  })
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof PatientCreateInput>(key: K, value: PatientCreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await createPatient.mutateAsync(form)
      showToast(`${form.full_name} registered successfully`, 'success')
      onClose()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create patient.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <h3>Register Patient</h3>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="np-full-name">Full name</label>
            <input
              id="np-full-name"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="np-mrn">Patient MRN</label>
              <input
                id="np-mrn"
                value={form.mrn}
                onChange={(e) => update('mrn', e.target.value)}
                placeholder="MNH-2026-00099"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="np-dob">Date of birth</label>
              <input
                id="np-dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update('date_of_birth', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="np-sex">Sex</label>
              <select id="np-sex" value={form.sex} onChange={(e) => update('sex', e.target.value as Sex)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="np-priority">Priority</label>
              <select id="np-priority" value={form.priority} onChange={(e) => update('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="np-cancer-site">Cancer site</label>
              <select
                id="np-cancer-site"
                value={form.cancer_site}
                onChange={(e) => update('cancer_site', e.target.value)}
              >
                {CANCER_SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="np-stage">Stage</label>
              <input
                id="np-stage"
                value={form.stage ?? ''}
                onChange={(e) => update('stage', e.target.value)}
                placeholder="Stage III (T2N1M0)"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="np-facility">Facility</label>
            <input
              id="np-facility"
              list="np-facility-options"
              value={form.facility}
              onChange={(e) => update('facility', e.target.value)}
              placeholder="Hospital or clinic name"
              required
            />
            <datalist id="np-facility-options">
              <option value="Muhimbili National Hospital" />
              <option value="Ocean Road Cancer Institute" />
            </datalist>
          </div>

          <button type="submit" className="btn btn-dark btn-block" disabled={createPatient.isPending}>
            {createPatient.isPending ? 'Registering…' : 'Register Patient'}
          </button>
        </form>
      </div>
    </div>
  )
}
