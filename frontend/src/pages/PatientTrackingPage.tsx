import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/hooks/usePatients'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { NewPatientDrawer } from '@/features/patients/NewPatientDrawer'
import type { PatientStatus } from '@/types/api'
import styles from './PatientTrackingPage.module.css'

const STATUS_OPTIONS: { value: PatientStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_workup', label: 'In Workup' },
  { value: 'ready_for_board', label: 'Ready for TB' },
  { value: 'under_treatment', label: 'Under Treatment' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'discharged', label: 'Discharged' },
]

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const diff = Date.now() - birth.getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export function PatientTrackingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PatientStatus | ''>('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pageSize = 10

  const { data, isLoading, isError } = usePatients({ search, status: status || undefined, page, page_size: pageSize })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Patient Tracking</h1>
          <p className="sub">Centralized tracking from registration through tumor board</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)} type="button">
            + Register Patient
          </button>
        </div>
      </div>

      <DemoDataBanner />

      <div className={styles.filters}>
        <input
          placeholder="Search by name or MRN…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PatientStatus | '')
            setPage(1)
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isError && <div className="form-error">Couldn't load patients. Is the API running?</div>}

      <div className="panel">
        <div className="panel-head">
          <div className="title">
            <span className="ic">
              <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            Registered Patients
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MRN</th>
                <th>Patient</th>
                <th>Age / Sex</th>
                <th>Cancer Site</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Primary Physician</th>
                <th>Facility</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton columns={8} />}
              {!isLoading && !data?.items.length && (
                <tr>
                  <td colSpan={8}>No patients match these filters.</td>
                </tr>
              )}
              {data?.items.map((p) => (
                <tr
                  key={p.id}
                  className={styles.rowLink}
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  <td className="mrn">{p.mrn}</td>
                  <td>{p.full_name}</td>
                  <td>
                    {calculateAge(p.date_of_birth)} / {p.sex}
                  </td>
                  <td>{p.cancer_site}</td>
                  <td>{p.stage ?? '—'}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p.primary_physician_name ?? '—'}</td>
                  <td>{p.facility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className={styles.pagination}>
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of {data.total}
            </span>
            <div className={styles.btns}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                type="button"
              >
                Previous
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {drawerOpen && <NewPatientDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
