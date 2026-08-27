import { useState } from 'react'
import { usePatientImagingPhotos } from '@/hooks/useRecordImages'
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage'
import { LoadingRow } from '@/components/ui/Spinner'
import styles from './PatientImagingGallery.module.css'

export function PatientImagingGallery({ patientId }: { patientId: string }) {
  const { data: photos, isLoading } = usePatientImagingPhotos(patientId)
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="title">Patient Imaging</div>
      </div>

      {isLoading && <LoadingRow />}
      {!isLoading && !photos?.length && (
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
          No imaging uploaded yet — add photos from the Imaging tab.
        </div>
      )}
      {!!photos?.length && (
        <div className={styles.row}>
          {photos.map((p) => (
            <div key={p.id} className={styles.item}>
              <AuthenticatedImage
                src={p.path}
                alt={p.filename}
                className={styles.thumb}
                onClick={() => setLightbox(p.path)}
              />
              <div className={styles.caption}>{p.recordTitle}</div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <AuthenticatedImage src={lightbox} alt="Full size" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  )
}
