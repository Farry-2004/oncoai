import { useRef, useState } from 'react'
import { useCreatePatientRecord, usePatientRecords } from '@/hooks/usePatientProfile'
import { useDeleteRecordImage, useRecordImages, useUploadRecordImage } from '@/hooks/useRecordImages'
import { LoadingRow } from '@/components/ui/Spinner'
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage'
import { ApiError } from '@/lib/api'
import recordStyles from './RecordListTab.module.css'
import styles from './ImagingTab.module.css'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

function imageFilePath(patientId: string, recordId: string, imageId: string): string {
  return `/patients/${patientId}/records/${recordId}/images/${imageId}/file`
}

function ImageGallery({ patientId, recordId }: { patientId: string; recordId: string }) {
  const { data: images } = useRecordImages(patientId, recordId)
  const uploadImage = useUploadRecordImage(patientId, recordId)
  const deleteImage = useDeleteRecordImage(patientId, recordId)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      await uploadImage.mutateAsync(file)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.')
    }
    e.target.value = ''
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbRow}>
        {images?.map((img) => {
          const path = imageFilePath(patientId, recordId, img.id)
          return (
            <div key={img.id} className={styles.thumbWrap}>
              <AuthenticatedImage
                src={path}
                alt={img.filename}
                className={styles.thumb}
                onClick={() => setLightboxSrc(path)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                title="Remove image"
                onClick={() => deleteImage.mutate(img.id)}
              >
                ×
              </button>
            </div>
          )
        })}
        <label className={styles.uploadTile}>
          {uploadImage.isPending ? '…' : '+ Image'}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            hidden
          />
        </label>
      </div>
      {error && <div className="form-error" style={{ marginTop: 6 }}>{error}</div>}

      {lightboxSrc && (
        <div className={styles.lightbox} onClick={() => setLightboxSrc(null)}>
          <AuthenticatedImage src={lightboxSrc} alt="Full size scan" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  )
}

export function ImagingTab({ patientId }: { patientId: string }) {
  const { data: records, isLoading } = usePatientRecords(patientId, 'imaging')
  const createRecord = useCreatePatientRecord(patientId)
  const [title, setTitle] = useState('')
  const [findings, setFindings] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createRecord.mutateAsync({ record_type: 'imaging', title, findings })
    setTitle('')
    setFindings('')
    setShowForm(false)
  }

  return (
    <div>
      <div className={recordStyles.list}>
        {isLoading && (
          <div className={recordStyles.empty}>
            <LoadingRow />
          </div>
        )}
        {!isLoading && !records?.length && (
          <div className={recordStyles.empty}>No entries recorded yet.</div>
        )}
        {records?.map((r) => (
          <div key={r.id} className={recordStyles.entry}>
            <div className={recordStyles.entryHead}>
              <span className={recordStyles.entryTitle}>{r.title}</span>
              <span className={recordStyles.entryDate}>{new Date(r.recorded_at).toLocaleDateString()}</span>
            </div>
            <div className={recordStyles.entryFindings}>{r.findings}</div>
            {r.recorded_by_name && (
              <div className={recordStyles.entryMeta}>Recorded by {r.recorded_by_name}</div>
            )}
            <ImageGallery patientId={patientId} recordId={r.id} />
          </div>
        ))}
      </div>

      {showForm ? (
        <form className={recordStyles.formCard} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="imaging-title">Title</label>
            <input
              id="imaging-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contrast CT Neck"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="imaging-findings">Findings</label>
            <textarea
              id="imaging-findings"
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Imaging findings..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-dark btn-sm" disabled={createRecord.isPending}>
              {createRecord.isPending ? 'Saving…' : 'Save entry'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
          + Add entry
        </button>
      )}
    </div>
  )
}
