import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PatientTrackingPage } from '@/pages/PatientTrackingPage'
import { PatientProfilePage } from '@/pages/PatientProfilePage'
import { TumorBoardWorkspacePage } from '@/pages/TumorBoardWorkspacePage'
import { TasksPage } from '@/pages/TasksPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReportDetailPage } from '@/pages/ReportDetailPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/patients',
    element: (
      <ProtectedRoute>
        <AppShell>
          <PatientTrackingPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/patients/:id',
    element: (
      <ProtectedRoute>
        <AppShell>
          <PatientProfilePage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    element: (
      <ProtectedRoute>
        <AppShell>
          <TasksPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <AppShell>
          <ReportsPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/:id',
    element: (
      <ProtectedRoute>
        <AppShell>
          <ReportDetailPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <AppShell>
          <AnalyticsPage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tumor-board',
    element: (
      <ProtectedRoute>
        <AppShell>
          <TumorBoardWorkspacePage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tumor-board/:sessionId',
    element: (
      <ProtectedRoute>
        <AppShell>
          <TumorBoardWorkspacePage />
        </AppShell>
      </ProtectedRoute>
    ),
  },
])
