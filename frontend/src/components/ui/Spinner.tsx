import styles from './Spinner.module.css'

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className={styles.spinner}
      style={{ '--size': `${size}px` } as React.CSSProperties}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className={styles.row}>
      <Spinner size={15} />
      {label}
    </span>
  )
}
