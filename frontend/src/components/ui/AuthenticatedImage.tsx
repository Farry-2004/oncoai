import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

// Plain <img src> can't send an Authorization header, and every image
// endpoint in this app requires one — so this fetches the bytes through the
// authenticated api client and renders them as a blob: URL instead.
export function AuthenticatedImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    let currentUrl: string | null = null
    let cancelled = false
    setObjectUrl(null)
    api.getBlob(src).then((blob) => {
      if (cancelled) return
      currentUrl = URL.createObjectURL(blob)
      setObjectUrl(currentUrl)
    })
    return () => {
      cancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [src])

  if (!objectUrl) {
    return <div className={className} style={{ background: 'var(--cream-100)' }} />
  }
  return <img src={objectUrl} alt={alt} className={className} onClick={onClick} />
}
