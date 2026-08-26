import styles from './Skeleton.module.css'

export function Skeleton({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return <span className={styles.bar} style={{ width, height }} />
}

export function TableRowsSkeleton({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className={styles.row}>
          {Array.from({ length: columns }, (_, c) => (
            <td key={c}>
              <Skeleton width={c === 0 ? '70%' : '90%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
