import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Report, ReportGenerateInput, ReportUpdateInput } from '@/types/api'

export interface ReportFilters {
  patient_id?: string
  report_type?: string
  status?: string
}

function buildQuery(filters: ReportFilters): string {
  const params = new URLSearchParams()
  if (filters.patient_id) params.set('patient_id', filters.patient_id)
  if (filters.report_type) params.set('report_type', filters.report_type)
  if (filters.status) params.set('status_filter', filters.status)
  return params.toString()
}

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => api.get<Report[]>(`/reports?${buildQuery(filters)}`),
  })
}

export function useReport(reportId: string | undefined) {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: () => api.get<Report>(`/reports/${reportId}`),
    enabled: !!reportId,
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportGenerateInput) => api.post<Report>('/reports/generate', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdateReport(reportId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportUpdateInput) => api.patch<Report>(`/reports/${reportId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useApproveReport(reportId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Report>(`/reports/${reportId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
