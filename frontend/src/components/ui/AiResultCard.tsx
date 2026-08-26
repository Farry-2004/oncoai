import styles from './AiResultCard.module.css'

export function AiResultCard({
  title,
  content,
  ok,
  meta,
}: {
  title: string
  content: string
  ok: boolean
  meta?: string
}) {
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span>{title}</span>
        <span className={`${styles.tag} ${ok ? '' : styles.tagWarning}`}>{ok ? 'AI Generated' : 'Unavailable'}</span>
      </div>
      <div className={styles.text}>{content}</div>
      {meta && <div className={styles.meta}>{meta}</div>}
    </div>
  )
}
