import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CaseFinding,
  CaseFindingCreateInput,
  CasePriority,
  CaseStatus,
  SessionMeetingLink,
  TumorBoardAttendance,
  TumorBoardSession,
  TumorBoardSessionDetail,
} from '@/types/api'

export function useTumorBoardSessions() {
  return useQuery({
    queryKey: ['tumor-board-sessions'],
    queryFn: () => api.get<TumorBoardSession[]>('/tumor-boards'),
  })
}

export function useTumorBoardSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['tumor-board-session', sessionId],
    queryFn: () => api.get<TumorBoardSessionDetail>(`/tumor-boards/${sessionId}`),
    enabled: !!sessionId,
  })
}

export function useUpdateCase(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      caseId,
      status,
      priority,
    }: {
      caseId: string
      status?: CaseStatus
      priority?: CasePriority
    }) => api.patch(`/tumor-boards/${sessionId}/cases/${caseId}`, { status, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumor-board-session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

export function useAddCaseToQueue(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { patient_id: string; priority: CasePriority }) =>
      api.post(`/tumor-boards/${sessionId}/cases`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumor-board-session', sessionId] })
    },
  })
}

export function useTumorBoardAttendance(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['tumor-board-attendance', sessionId],
    queryFn: () => api.get<TumorBoardAttendance[]>(`/tumor-boards/${sessionId}/attendance`),
    enabled: !!sessionId,
  })
}

export function useMarkAttendance(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { user_id: string; cme_credit?: number }) =>
      api.post<TumorBoardAttendance>(`/tumor-boards/${sessionId}/attendance`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumor-board-attendance', sessionId] })
    },
  })
}

export function useRemoveAttendance(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attendanceId: string) =>
      api.delete(`/tumor-boards/${sessionId}/attendance/${attendanceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumor-board-attendance', sessionId] })
    },
  })
}

export function useCaseFindings(sessionId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: ['case-findings', sessionId, caseId],
    queryFn: () => api.get<CaseFinding[]>(`/tumor-boards/${sessionId}/cases/${caseId}/findings`),
    enabled: !!sessionId && !!caseId,
  })
}

export function useAddCaseFinding(sessionId: string | undefined, caseId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CaseFindingCreateInput) =>
      api.post<CaseFinding>(`/tumor-boards/${sessionId}/cases/${caseId}/findings`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-findings', sessionId, caseId] })
    },
  })
}

export function useSessionMeetingLink(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-meeting-link', sessionId],
    queryFn: () => api.get<SessionMeetingLink | null>(`/tumor-boards/${sessionId}/meeting-link`),
    enabled: !!sessionId,
  })
}

export function useSetSessionMeetingLink(sessionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (meetingLink: string) =>
      api.put<SessionMeetingLink>(`/tumor-boards/${sessionId}/meeting-link`, { meeting_link: meetingLink }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-meeting-link', sessionId] })
    },
  })
}
