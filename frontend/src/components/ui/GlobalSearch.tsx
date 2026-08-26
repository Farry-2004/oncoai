import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '@/hooks/useSearch'
import type { SearchResultItem, SearchResults } from '@/types/api'
import styles from './GlobalSearch.module.css'

const GROUPS: { key: keyof SearchResults; label: string }[] = [
  { key: 'patients', label: 'Patients' },
  { key: 'tumor_boards', label: 'Tumor Boards' },
  { key: 'specialists', label: 'Specialists' },
  { key: 'reports', label: 'Reports' },
]

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [rawQuery, setRawQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(rawQuery), 250)
    return () => clearTimeout(t)
  }, [rawQuery])

  const { data, isFetching } = useGlobalSearch(debouncedQuery)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else {
      setRawQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSelect(item: SearchResultItem) {
    setOpen(false)
    navigate(item.link)
  }

  const hasAnyResults = data && GROUPS.some((g) => data[g.key].length > 0)

  return (
    <>
      <button className={styles.triggerBtn} type="button" onClick={() => setOpen(true)} aria-label="Search">
        <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.inputRow}>
              <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Search patients, cases, specialists, reports…"
              />
              <span className={styles.hint}>Esc</span>
            </div>
            <div className={styles.results}>
              {debouncedQuery.trim().length < 2 && (
                <div className={styles.empty}>Type at least 2 characters to search.</div>
              )}
              {debouncedQuery.trim().length >= 2 && isFetching && <div className={styles.empty}>Searching…</div>}
              {debouncedQuery.trim().length >= 2 && !isFetching && data && !hasAnyResults && (
                <div className={styles.empty}>No results for "{debouncedQuery}".</div>
              )}
              {data &&
                GROUPS.map(
                  (g) =>
                    data[g.key].length > 0 && (
                      <div key={g.key}>
                        <div className={styles.groupLabel}>{g.label}</div>
                        {data[g.key].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={styles.resultItem}
                            onClick={() => handleSelect(item)}
                          >
                            <div className={styles.resultLabel}>{item.label}</div>
                            {item.sublabel && <div className={styles.resultSub}>{item.sublabel}</div>}
                          </button>
                        ))}
                      </div>
                    ),
                )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
