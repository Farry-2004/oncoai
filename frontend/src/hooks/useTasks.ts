import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Task, TaskComment, TaskCreateInput, TaskStatus } from '@/types/api'

export interface TaskFilters {
  status?: TaskStatus
  assigned_to_id?: string
  patient_id?: string
  tumor_board_case_id?: string
}

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status_filter', filters.status)
  if (filters.assigned_to_id) params.set('assigned_to_id', filters.assigned_to_id)
  if (filters.patient_id) params.set('patient_id', filters.patient_id)
  if (filters.tumor_board_case_id) params.set('tumor_board_case_id', filters.tumor_board_case_id)
  return params.toString()
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.get<Task[]>(`/tasks?${buildQuery(filters)}`),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskCreateInput) => api.post<Task>('/tasks', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...changes }: { taskId: string; status?: string; priority?: string }) =>
      api.patch<Task>(`/tasks/${taskId}`, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useTaskComments(taskId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => api.get<TaskComment[]>(`/tasks/${taskId}/comments`),
    enabled: !!taskId && enabled,
  })
}

export function useAddTaskComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post<TaskComment>(`/tasks/${taskId}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
