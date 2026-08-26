import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SearchResults } from '@/types/api'

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
  })
}
