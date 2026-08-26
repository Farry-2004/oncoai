import type { ReactNode } from 'react'
import { AuthedNav } from './AuthedNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthedNav />
      <div className="app-shell">
        <div className="container">{children}</div>
      </div>
    </>
  )
}
