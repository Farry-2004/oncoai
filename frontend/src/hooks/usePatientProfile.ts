import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AIAnalysis,
  AnalysisType,
  FollowUp,
  FollowUpCreateInput,
  Patient,
  PatientRecord,
  PatientRecordCreateInput,
  RecordType,
  TumorBoardCase,
  WorkupItem,
  WorkupItemType,
} from '@/types/api'

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api.get<Patient>(`/patients/${patientId}`),
    enabled: !!patientId,
  })
}

export function usePatientWorkups(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-workups', patientId],
    queryFn: () => api.get<WorkupItem[]>(`/patients/${patientId}/workups`),
    enabled: !!patientId,
  })
}

export function useCreateWorkup(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { item_type: WorkupItemType; description: string; due_date?: string }) =>
      api.post<WorkupItem>(`/patients/${patientId}/workups`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-workups', patientId] })
    },
  })
}

export function useUpdateWorkup(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workupId, status }: { workupId: string; status: WorkupItem['status'] }) =>
      api.patch<WorkupItem>(`/patients/${patientId}/workups/${workupId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-workups', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export function usePatientCases(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-cases', patientId],
    queryFn: () => api.get<TumorBoardCase[]>(`/patients/${patientId}/cases`),
    enabled: !!patientId,
  })
}

export function usePatientRecords(patientId: string | undefined, recordType?: RecordType) {
  return useQuery({
    queryKey: ['patient-records', patientId, recordType],
    queryFn: () =>
      api.get<PatientRecord[]>(
        `/patients/${patientId}/records${recordType ? `?record_type=${recordType}` : ''}`,
      ),
    enabled: !!patientId,
  })
}

export function useCreatePatientRecord(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PatientRecordCreateInput) =>
      api.post<PatientRecord>(`/patients/${patientId}/records`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-records', patientId] })
    },
  })
}

export function useFollowUps(patientId: string | undefined) {
  return useQuery({
    queryKey: ['follow-ups', patientId],
    queryFn: () => api.get<FollowUp[]>(`/patients/${patientId}/follow-ups`),
    enabled: !!patientId,
  })
}

export function useCreateFollowUp(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FollowUpCreateInput) =>
      api.post<FollowUp>(`/patients/${patientId}/follow-ups`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', patientId] })
    },
  })
}

export function useAiAnalyses(patientId: string | undefined) {
  return useQuery({
    queryKey: ['ai-analyses', patientId],
    queryFn: () => api.get<AIAnalysis[]>(`/patients/${patientId}/ai`),
    enabled: !!patientId,
  })
}

export function useRunAiAnalysis(patientId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (analysisType: AnalysisType) =>
      api.post<AIAnalysis>(`/patients/${patientId}/ai/${analysisType}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', patientId] })
    },
  })
}
