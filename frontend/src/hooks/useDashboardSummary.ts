import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardSummary, TBPreparationSummary } from '@/types/api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  })
}

export function useTBPreparation() {
  return useQuery({
    queryKey: ['dashboard-tb-preparation'],
    queryFn: () => api.get<TBPreparationSummary>('/dashboard/tb-preparation'),
  })
}
