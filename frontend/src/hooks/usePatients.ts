import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Patient, PatientCreateInput, PatientListResponse } from '@/types/api'

export interface PatientFilters {
  status?: string
  cancer_site?: string
  search?: string
  page?: number
  page_size?: number
}

function buildQuery(filters: PatientFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status_filter', filters.status)
  if (filters.cancer_site) params.set('cancer_site', filters.cancer_site)
  if (filters.search) params.set('search', filters.search)
  params.set('page', String(filters.page ?? 1))
  params.set('page_size', String(filters.page_size ?? 20))
  return params.toString()
}

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: () => api.get<PatientListResponse>(`/patients?${buildQuery(filters)}`),
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PatientCreateInput) => api.post<Patient>('/patients', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
