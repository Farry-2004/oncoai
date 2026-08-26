import styles from './BrandMark.module.css'

/**
 * Small medical-cross-in-pulse mark used alongside the "OncoAI" wordmark
 * everywhere the logo appears, so every screen reads as clinical at a glance.
 */
export function BrandMark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`${styles.mark} ${onDark ? styles.markOnDark : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2 7 4-14 2 7h4" />
        <path d="M17 5v4M15 7h4" />
      </svg>
    </span>
  )
}
