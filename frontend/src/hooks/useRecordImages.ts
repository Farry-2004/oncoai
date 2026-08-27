import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePatientRecords } from '@/hooks/usePatientProfile'
import { api } from '@/lib/api'
import type { RecordImage } from '@/types/api'

export interface PatientPhoto extends RecordImage {
  path: string
  recordTitle: string
}

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

// Flattens every image across all of this patient's imaging records into one
// gallery — used to show real uploaded imaging (as opposed to the schematic
// AnatomyViewer3D) on the patient Overview tab.
export function usePatientImagingPhotos(patientId: string) {
  const { data: records } = usePatientRecords(patientId, 'imaging')
  const recordIds = records?.map((r) => r.id).join(',') ?? ''

  return useQuery({
    queryKey: ['patient-imaging-photos', patientId, recordIds],
    queryFn: async (): Promise<PatientPhoto[]> => {
      if (!records?.length) return []
      const perRecord = await Promise.all(
        records.map((r) =>
          api.get<RecordImage[]>(`/patients/${patientId}/records/${r.id}/images`).then((imgs) =>
            imgs.map((img) => ({
              ...img,
              path: `/patients/${patientId}/records/${img.patient_record_id}/images/${img.id}/file`,
              recordTitle: r.title,
            })),
          ),
        ),
      )
      return perRecord.flat().sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    enabled: !!records,
  })
}
