import type { ReactNode } from 'react'

export function ErrorState({
  title = "Something didn't load",
  description = "That's on us, not you. Try again in a moment.",
  onRetry,
  actions,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  actions?: ReactNode
}) {
  return (
    <div className="state-block state-error" role="alert">
      <div className="state-icon">
        <svg className="icon" width={22} height={22} viewBox="0 0 24 24">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{description}</div>
      <div className="state-actions">
        {onRetry && (
          <button type="button" className="btn btn-dark btn-sm" onClick={onRetry}>
            Retry
          </button>
        )}
        {actions}
      </div>
    </div>
  )
}
