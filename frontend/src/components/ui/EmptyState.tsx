import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  icon,
  actions,
}: {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="state-block" role="status">
      <div className="state-icon">
        {icon ?? (
          <svg className="icon" width={22} height={22} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </div>
      <div className="state-title">{title}</div>
      {description && <div className="state-desc">{description}</div>}
      {actions && <div className="state-actions">{actions}</div>}
    </div>
  )
}
