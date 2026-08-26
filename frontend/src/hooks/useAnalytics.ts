import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AnalyticsSummary } from '@/types/api'

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get<AnalyticsSummary>('/analytics/summary'),
  })
}
