import { useState } from 'react'
import { useAddCaseFinding, useCaseFindings } from '@/hooks/useTumorBoard'
import { LoadingRow } from '@/components/ui/Spinner'
import type { FindingFormat, FindingType } from '@/types/api'
import styles from './DiscussionAndDecision.module.css'

const TYPE_LABEL: Record<FindingType, string> = {
  pathology: 'Pathology',
  imaging: 'Imaging',
  other: 'Other',
}

export function CaseFindingsSection({ sessionId, caseId }: { sessionId: string; caseId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { data: findings, isLoading } = useCaseFindings(sessionId, caseId)
  const addFinding = useAddCaseFinding(sessionId, caseId)

  const [findingType, setFindingType] = useState<FindingType>('pathology')
  const [format, setFormat] = useState<FindingFormat>('written')
  const [content, setContent] = useState('')
  const [isRemoteConsult, setIsRemoteConsult] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await addFinding.mutateAsync({ finding_type: findingType, format, content, is_remote_consult: isRemoteConsult })
    setContent('')
    setIsRemoteConsult(false)
    setShowForm(false)
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        Pre-recorded &amp; Remote Findings {findings?.length ? `(${findings.length})` : ''} {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className={styles.panel}>
          {isLoading && <LoadingRow />}
          {!isLoading && !findings?.length && (
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 12 }}>
              No pre-recorded findings or remote consults logged yet.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {findings?.map((f) => (
              <div
                key={f.id}
                style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.86rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <strong>{TYPE_LABEL[f.finding_type]}</strong>
                  <span style={{ display: 'flex', gap: 8 }}>
                    {f.is_remote_consult && <span className="pill high">on-call / remote</span>}
                    {f.format === 'video_link' && <span className="pill low">video</span>}
                  </span>
                </div>
                {f.format === 'video_link' ? (
                  <a href={f.content} target="_blank" rel="noreferrer">
                    {f.content}
                  </a>
                ) : (
                  <div style={{ marginTop: 4, color: 'var(--ink-700)', whiteSpace: 'pre-wrap' }}>{f.content}</div>
                )}
                {f.contributed_by_name && (
                  <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--gray-500)' }}>By {f.contributed_by_name}</div>
                )}
              </div>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={findingType} onChange={(e) => setFindingType(e.target.value as FindingType)}>
                  <option value="pathology">Pathology</option>
                  <option value="imaging">Imaging</option>
                  <option value="other">Other</option>
                </select>
                <select value={format} onChange={(e) => setFormat(e.target.value as FindingFormat)}>
                  <option value="written">Written</option>
                  <option value="video_link">Video link</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="finding-content">{format === 'video_link' ? 'Video URL' : 'Findings'}</label>
                {format === 'video_link' ? (
                  <input
                    id="finding-content"
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                ) : (
                  <textarea
                    id="finding-content"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Written pathology/imaging findings..."
                    required
                  />
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
                <input type="checkbox" checked={isRemoteConsult} onChange={(e) => setIsRemoteConsult(e.target.checked)} />
                Contributed by an on-call / remote diagnostician
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-dark btn-sm" disabled={addFinding.isPending}>
                  {addFinding.isPending ? 'Saving…' : 'Add finding'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>
              + Add finding
            </button>
          )}
        </div>
      )}
    </div>
  )
}
