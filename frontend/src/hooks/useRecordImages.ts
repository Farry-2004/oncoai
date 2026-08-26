import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { RecordImage } from '@/types/api'

export function useRecordImages(patientId: string, recordId: string | undefined) {
  return useQuery({
    queryKey: ['record-images', patientId, recordId],
    queryFn: () => api.get<RecordImage[]>(`/patients/${patientId}/records/${recordId}/images`),
    enabled: !!recordId,
  })
}

export function useUploadRecordImage(patientId: string, recordId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.postFile<RecordImage>(`/patients/${patientId}/records/${recordId}/images`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-images', patientId, recordId] })
    },
  })
}

export function useDeleteRecordImage(patientId: string, recordId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) =>
      api.delete(`/patients/${patientId}/records/${recordId}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-images', patientId, recordId] })
    },
  })
}
