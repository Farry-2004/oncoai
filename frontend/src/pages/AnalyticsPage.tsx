import { useAnalytics } from '@/hooks/useAnalytics'
import { DemoDataBanner } from '@/components/ui/DemoDataBanner'
import { LoadingRow } from '@/components/ui/Spinner'
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart'
import type { BarDatum } from '@/components/charts/HorizontalBarChart'
import styles from './AnalyticsPage.module.css'

// Validated against the OncoAI teal/navy brand (see dataviz skill run in-session):
// adjacent-pair CVD + normal-vision floors pass; amber/green need label relief,
// which every bar row already has (category label + value are always shown).
const CATEGORICAL_PALETTE = ['#0f8f82', '#6a3fb5', '#eda100', '#1b6ec2', '#c0362c', '#1baf7a', '#8a4a1f']

const WORKUP_STATUS_COLORS: Record<string, string> = {
  completed: '#178067', // var(--success-fg)
  in_progress: '#a3651c', // var(--warning-fg)
  ordered: '#6b7a77', // var(--gray-500)
  cancelled: '#c0362c', // var(--danger-fg)
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#c0362c',
  high: '#a3651c',
  medium: '#178067',
  low: '#6b7a77',
}

function StatCard({ num, name, sub }: { num: string | number; name: string; sub?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.num}>{num}</div>
      <div className={styles.name}>{name}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  )
}

export function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics()

  const siteBars: BarDatum[] =
    data?.patients_by_cancer_site.map((d, i) => ({
      key: d.key,
      label: d.label,
      value: d.value,
      color: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length],
    })) ?? []

  const workupBars: BarDatum[] =
    data?.workup_by_status.map((d) => ({
      key: d.key,
      label: d.label,
      value: d.value,
      color: WORKUP_STATUS_COLORS[d.key] ?? '#6b7a77',
    })) ?? []

  const priorityBars: BarDatum[] =
    data?.cases_by_priority.map((d) => ({
      key: d.key,
      label: d.label,
      value: d.value,
      color: PRIORITY_COLORS[d.key] ?? '#6b7a77',
    })) ?? []

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Analytics</h1>
          <p className="sub">Oncology operations overview</p>
        </div>
      </div>

      <DemoDataBanner />

      {isError && <div className="form-error">Couldn't load analytics. Is the API running?</div>}

      <div className={styles.statGrid}>
        <StatCard num={isLoading ? '–' : data?.patients_registered ?? 0} name="Patients Registered" />
        <StatCard num={isLoading ? '–' : data?.cases_reviewed ?? 0} name="Cases Reviewed" />
        <StatCard num={isLoading ? '–' : data?.cases_awaiting_tb ?? 0} name="Cases Awaiting TB" />
        <StatCard num={isLoading ? '–' : data?.pending_investigations ?? 0} name="Pending Investigations" />
        <StatCard
          num={isLoading ? '–' : data?.avg_workup_completion_days ?? '—'}
          name="Avg Workup Completion"
          sub="days"
        />
        <StatCard
          num={isLoading ? '–' : data?.avg_diagnosis_to_tb_days ?? '—'}
          name="Avg Diagnosis → TB"
          sub="days"
        />
        <StatCard
          num={isLoading ? '–' : data?.avg_treatment_turnaround_days ?? '—'}
          name="Treatment Planning Turnaround"
          sub="days"
        />
        <StatCard
          num={isLoading ? '–' : `${data?.follow_up_completion_pct ?? 0}%`}
          name="Follow-up Completion"
        />
      </div>

      <div className={styles.chartGrid}>
        <div className="panel">
          <div className="panel-head">
            <div className="title">
              <span className="ic">
                <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
                  <circle cx="14" cy="9" r="0.9" fill="currentColor" stroke="none" />
                  <circle cx="13" cy="14" r="1.4" fill="currentColor" stroke="none" />
                </svg>
              </span>
              Patients by Cancer Site
            </div>
          </div>
          {isLoading ? <LoadingRow /> : <HorizontalBarChart data={siteBars} />}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="title">
              <span className="ic">
                <svg className="icon" width={17} height={17} viewBox="0 0 24 24">
                  <rect x="6" y="4" width="12" height="17" rx="2" />
                  <path d="m9 13 2 2 4-4" />
                </svg>
              </span>
              Investigations by Status
            </div>
          </div>
          {isLoading ? <LoadingRow /> : <HorizontalBarChart data={workupBars} />}
        </div>

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
              Tumor Board Cases by Priority
            </div>
          </div>
          {isLoading ? <LoadingRow /> : <HorizontalBarChart data={priorityBars} />}
        </div>
      </div>
    </div>
  )
}
