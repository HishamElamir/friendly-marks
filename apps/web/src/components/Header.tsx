import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type CSSProperties } from 'react'
import * as api from '../api/client'
import type { Device, DeviceType, User } from '../api/types'
import { getClientDeviceId } from '../state/useDevice'
import { useLogout } from '../state/useAuth'
import type { View } from '../types'

const brand = 'Friendly Marks'

const DEVICE_ICON: Record<DeviceType, { rx: number; rw: number; foot: string }> = {
  desktop: { rx: 3, rw: 18, foot: 'M2 20h20' },
  tablet: { rx: 5, rw: 14, foot: 'M12 17h.01' },
  phone: { rx: 8, rw: 8, foot: 'M12 16h.01' },
  other: { rx: 4, rw: 16, foot: 'M6 20h12' },
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

interface HeaderProps {
  user: User
  view: View
  hasCurrentDocument: boolean
  onGoLibrary: () => void
  onGoReader: () => void
  onSelectSearchResult: (documentId: string) => void
}

export function Header({ user, view, hasCurrentDocument, onGoLibrary, onGoReader, onSelectSearchResult }: HeaderProps) {
  const [syncOpen, setSyncOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const logout = useLogout()
  const thisDeviceId = getClientDeviceId()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: api.listDevices,
    enabled: syncOpen,
  })

  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  })

  const initials = user.display_name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const showResults = searchOpen && debouncedQuery.length > 0

  return (
    <header
      className="nav"
      style={{
        flex: 'none',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        position: 'relative',
        zIndex: 20,
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: 'var(--color-accent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bg)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 4h9l5 5v11H5z"></path>
            <path d="M9 13h6"></path>
          </svg>
        </div>
        <span className="nav-brand" style={{ marginRight: 0, whiteSpace: 'nowrap' }}>
          {brand}
        </span>
      </div>
      <nav style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onGoLibrary()
          }}
          style={{ cursor: 'pointer', fontWeight: 600, color: view === 'library' ? 'var(--color-accent)' : 'inherit' }}
        >
          Shelf
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (hasCurrentDocument) onGoReader()
          }}
          style={{
            cursor: hasCurrentDocument ? 'pointer' : 'default',
            fontWeight: 600,
            opacity: hasCurrentDocument ? 1 : 0.4,
            color: view === 'reader' ? 'var(--color-accent)' : 'inherit',
          }}
        >
          Reading now
        </a>
      </nav>
      <div style={{ position: 'relative', flex: '1 1 120px', maxWidth: 260, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface)',
            borderRadius: 999,
            padding: '6px 14px',
            minWidth: 0,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            style={{ opacity: 0.5, flex: 'none' }}
          >
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20l-3.5-3.5"></path>
          </svg>
          <input
            placeholder="Search text and marks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            style={{ border: 0, background: 'transparent', outline: 'none', font: 'inherit', fontSize: 13, width: '100%', color: 'inherit' }}
          />
        </div>

        {showResults && (
          <div
            className="elev-lg"
            style={{
              position: 'absolute',
              top: 42,
              left: 0,
              width: 340,
              maxHeight: 360,
              overflowY: 'auto',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3)',
              zIndex: 30,
            }}
          >
            {searchQuery.isFetching && <div style={{ fontSize: 12, opacity: 0.6, padding: 8 }}>Searching…</div>}
            {!searchQuery.isFetching &&
              searchQuery.data &&
              searchQuery.data.pages.length === 0 &&
              searchQuery.data.marks.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.6, padding: 8 }}>No matches.</div>
              )}
            {searchQuery.data && searchQuery.data.pages.length > 0 && (
              <>
                <h6 style={{ margin: '0 0 6px', opacity: 0.6 } as CSSProperties}>In text</h6>
                {searchQuery.data.pages.map((p) => (
                  <button
                    key={`${p.document_id}-${p.page_number}`}
                    onClick={() => onSelectSearchResult(p.document_id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      padding: '6px 4px',
                      borderRadius: 8,
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {p.document_title} · p{p.page_number}
                    </div>
                    <div
                      style={{ fontSize: 12, opacity: 0.7 }}
                      dangerouslySetInnerHTML={{ __html: p.snippet }}
                    />
                  </button>
                ))}
              </>
            )}
            {searchQuery.data && searchQuery.data.marks.length > 0 && (
              <>
                <h6 style={{ margin: '10px 0 6px', opacity: 0.6 } as CSSProperties}>In marks</h6>
                {searchQuery.data.marks.map((m) => (
                  <button
                    key={m.annotation_id}
                    onClick={() => onSelectSearchResult(m.document_id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      padding: '6px 4px',
                      borderRadius: 8,
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {m.document_title} · p{m.page_number}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }} dangerouslySetInnerHTML={{ __html: m.snippet }} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      <button className="btn btn-secondary" onClick={() => setSyncOpen((v) => !v)} style={{ gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--color-accent-2-600)',
            display: 'inline-block',
          }}
        ></span>
        Synced
      </button>
      <button
        className="btn btn-icon btn-ghost"
        title="Log out"
        onClick={() => logout.mutate()}
        style={{ width: 32, height: 32 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <path d="M16 17l5-5-5-5"></path>
          <path d="M21 12H9"></path>
        </svg>
      </button>
      <div
        title={user.display_name}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: 'var(--color-accent-2-300)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {initials || '?'}
      </div>

      {syncOpen && (
        <div
          className="elev-lg"
          style={{
            position: 'absolute',
            top: 60,
            right: 'var(--space-6)',
            width: 300,
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            zIndex: 30,
          }}
        >
          <h6 style={{ margin: '0 0 var(--space-3)', opacity: 0.6 } as CSSProperties}>Everywhere you left off</h6>
          {devicesQuery.isLoading && <div style={{ fontSize: 12, opacity: 0.6 }}>Loading…</div>}
          {devicesQuery.data?.length === 0 && (
            <div style={{ fontSize: 12, opacity: 0.6 }}>No other devices yet.</div>
          )}
          {devicesQuery.data?.map((d: Device) => {
            const icon = DEVICE_ICON[d.device_type]
            const isThisDevice = d.client_device_id === thisDeviceId
            return (
              <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: 'var(--color-bg)',
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x={icon.rx} y="4" width={icon.rw} height="14" rx={2}></rect>
                    <path d={icon.foot}></path>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>
                    {d.last_page ? `p.${d.last_page} · ` : ''}
                    {relativeTime(d.last_active_at)}
                  </div>
                </div>
                <span className="tag tag-accent-2">{isThisDevice ? 'This device' : 'Up to date'}</span>
              </div>
            )
          })}
          <div className="hr"></div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Marks, notes and scratches are saved as you make them.</div>
        </div>
      )}
    </header>
  )
}
