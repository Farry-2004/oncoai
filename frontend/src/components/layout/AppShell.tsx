import type { ReactNode } from 'react'
import { AuthedNav } from './AuthedNav'
import { PageTransition } from './PageTransition'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthedNav />
      <div className="app-shell">
        <div className="container">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </>
  )
}
