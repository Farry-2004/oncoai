import type { ReactNode } from 'react'

type AlertType = 'info' | 'success' | 'warning' | 'error'

const ICON_PATHS: Record<AlertType, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
}

export function Alert({
  type = 'info',
  className,
  children,
}: {
  type?: AlertType
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`alert alert-${type}${className ? ` ${className}` : ''}`} role={type === 'error' ? 'alert' : 'status'}>
      <svg className="icon alert-icon" viewBox="0 0 24 24" aria-hidden="true">
        {ICON_PATHS[type]}
      </svg>
      <div>{children}</div>
    </div>
  )
}
