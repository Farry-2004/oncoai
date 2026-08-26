import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TumorBoardDecision, TumorBoardDecisionCreateInput } from '@/types/api'

export function useTumorBoardDecision(sessionId: string | undefined, caseId: string) {
  return useQuery({
    queryKey: ['tumor-board-decision', sessionId, caseId],
    queryFn: () => api.get<TumorBoardDecision | null>(`/tumor-boards/${sessionId}/cases/${caseId}/decision`),
    enabled: !!sessionId,
  })
}

export function useRecordDecision(sessionId: string | undefined, caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TumorBoardDecisionCreateInput) =>
      api.post<TumorBoardDecision>(`/tumor-boards/${sessionId}/cases/${caseId}/decision`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumor-board-decision', sessionId, caseId] })
      queryClient.invalidateQueries({ queryKey: ['tumor-board-session', sessionId] })
    },
  })
}
