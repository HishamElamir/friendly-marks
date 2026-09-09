import type { CSSProperties } from 'react'
import { DEVICES } from '../data'
import type { FriendlyMarksState } from '../state/useFriendlyMarks'

const brand = 'Friendly Marks'

export function Header({ state }: { state: FriendlyMarksState }) {
  const { view, syncOpen, toggleSync, goLibrary, goReader } = state

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
            goLibrary()
          }}
          style={{ cursor: 'pointer', fontWeight: 600, color: view === 'library' ? 'var(--color-accent)' : 'inherit' }}
        >
          Shelf
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            goReader()
          }}
          style={{ cursor: 'pointer', fontWeight: 600, color: view === 'reader' ? 'var(--color-accent)' : 'inherit' }}
        >
          Reading now
        </a>
      </nav>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-surface)',
          borderRadius: 999,
          padding: '6px 14px',
          minWidth: 0,
          flex: '1 1 120px',
          maxWidth: 260,
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
          style={{ opacity: 0.5 }}
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M20 20l-3.5-3.5"></path>
        </svg>
        <input
          placeholder="Search text and marks"
          style={{ border: 0, background: 'transparent', outline: 'none', font: 'inherit', fontSize: 13, width: '100%', color: 'inherit' }}
        />
      </div>
      <button className="btn btn-secondary" onClick={toggleSync} style={{ gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--color-accent-2-600)',
            display: 'inline-block',
          }}
        ></span>
        Synced 2m ago
      </button>
      <div
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
        HE
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
          {DEVICES.map((d) => (
            <div key={d.name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0' }}>
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
                  <rect x={d.rx} y="4" width={d.rw} height="14" rx={2}></rect>
                  <path d={d.foot}></path>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 11, opacity: 0.55 }}>{d.detail}</div>
              </div>
              <span className="tag tag-accent-2">{d.state}</span>
            </div>
          ))}
          <div className="hr"></div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Marks, notes and scratches are saved as you make them.</div>
        </div>
      )}
    </header>
  )
}
