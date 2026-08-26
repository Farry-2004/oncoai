import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  Overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  'Clinical History': (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </>
  ),
  Investigations: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  Imaging: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
    </>
  ),
  Pathology: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  Laboratory: (
    <>
      <path d="M9 2v6.5a2 2 0 0 1-.35 1.13L4.4 16.1A2 2 0 0 0 6 19.3h12a2 2 0 0 0 1.6-3.2l-4.25-6.47A2 2 0 0 1 15 8.5V2" />
      <path d="M8 2h8M7.5 14h9" />
    </>
  ),
  Treatment: (
    <>
      <rect x="3" y="11" width="18" height="7" rx="1.5" />
      <path d="M5 11V8a2 2 0 0 1 2-2h3v5M9 6v5" />
      <circle cx="8" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  'Tumor Board': (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  'Follow-up': (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="m8.5 15 2 2 4-4" />
    </>
  ),
  'AI Analysis': (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export function TabIcon({ tab }: { tab: string }) {
  const path = PATHS[tab]
  if (!path) return null
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: 6 }}
    >
      {path}
    </svg>
  )
}
