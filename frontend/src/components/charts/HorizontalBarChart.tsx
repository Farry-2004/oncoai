import styles from './HorizontalBarChart.module.css'

export interface BarDatum {
  key: string
  label: string
  value: number
  color: string
}

export function HorizontalBarChart({ data }: { data: BarDatum[] }) {
  if (!data.length) {
    return <div className={styles.empty}>No data yet.</div>
  }
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={styles.chart}>
      {data.map((d) => (
        <div key={d.key} className={styles.row}>
          <div className={styles.label} title={d.label}>
            {d.label}
          </div>
          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, background: d.color }}
            />
          </div>
          <div className={styles.value}>{d.value}</div>
        </div>
      ))}
    </div>
  )
}
