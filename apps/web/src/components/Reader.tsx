import { useMemo } from 'react'
import { COLORS, TOOLS } from '../data'
import { useDocumentReader } from '../state/useDocumentReader'
import { PdfPage } from './PdfPage'

const PAGE_TARGET_WIDTH = 780

export function Reader({ documentId, onBack }: { documentId: string; onBack: () => void }) {
  const reader = useDocumentReader(documentId)
  const {
    document,
    documentLoading,
    pdfDoc,
    pdfError,
    numPages,
    currentPage,
    reportPageVisible,
    annotations,
    tool,
    setTool,
    color,
    setColor,
    createHighlight,
    createNote,
    createStroke,
    updateNoteText,
    removeAnnotation,
    clearStrokes,
  } = reader

  const annotationsByPage = useMemo(() => {
    const map = new Map<number, typeof annotations>()
    for (const a of annotations) {
      const list = map.get(a.page_number) ?? []
      list.push(a)
      map.set(a.page_number, list)
    }
    return map
  }, [annotations])

  const marks = useMemo(
    () =>
      [...annotations]
        .filter((a) => a.type !== 'stroke')
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [annotations],
  )

  const drawMode = tool === 'pen' || tool === 'note'
  const toolLabel = TOOLS.find((t) => t.id === tool)!.label + ' tool'
  const hintLabel =
    tool === 'highlight'
      ? 'Select text to mark it'
      : tool === 'pen'
        ? 'Drag across the page to scratch'
        : tool === 'note'
          ? 'Click the page to drop a note'
          : 'Reading — pick a tool to mark up'
  const pageLabel = numPages ? `Page ${currentPage} of ${numPages}` : ''
  const percent = numPages ? Math.round((currentPage / numPages) * 100) : 0

  if (documentLoading) {
    return (
      <main style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <span className="text-muted">Loading…</span>
      </main>
    )
  }

  if (!document) {
    return (
      <main style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="text-muted">This document could not be found.</p>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to shelf
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 'none', width: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 'var(--space-4) 0' }}>
        <button className="btn btn-icon btn-secondary" onClick={onBack} title="Back to shelf">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M11 6l-6 6 6 6"></path>
          </svg>
        </button>
        <div style={{ width: 26, height: 1, background: 'var(--color-divider)', margin: '4px 0' }}></div>
        {TOOLS.map((t) => {
          const on = tool === t.id
          return (
            <button
              key={t.id}
              className="btn btn-icon"
              onClick={() => setTool(t.id)}
              title={t.label}
              style={{ background: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-bg)' : 'var(--color-text)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.d}></path>
                {t.d2 && <path d={t.d2}></path>}
              </svg>
            </button>
          )
        })}
        <div style={{ width: 26, height: 1, background: 'var(--color-divider)', margin: '4px 0' }}></div>
        {COLORS.map((c) => {
          const on = color === c.color
          return (
            <button
              key={c.name}
              onClick={() => {
                setColor(c.color)
                setTool('highlight')
              }}
              title={c.name}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                cursor: 'pointer',
                background: c.color,
                border: `2px solid ${on ? 'var(--color-text)' : 'transparent'}`,
                boxShadow: on ? 'var(--shadow-sm)' : 'none',
              }}
            ></button>
          )
        })}
        <button className="btn btn-icon btn-ghost" onClick={clearStrokes} title="Clear scratches" style={{ marginTop: 'auto' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16"></path>
            <path d="M7 7l1 13h8l1-13M10 7V4h4v3"></path>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)' }}>
          <h4 style={{ margin: 0, fontSize: 17, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {document.title}
          </h4>
          <span className="tag tag-neutral" style={{ whiteSpace: 'nowrap', flex: 'none' }}>
            {toolLabel}
          </span>
          <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hintLabel}
          </span>
        </div>

        <div className="fm-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 var(--space-4) var(--space-8)', cursor: drawMode ? undefined : 'auto' }}>
          {pdfError && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <p className="text-muted">{pdfError}</p>
            </div>
          )}
          {!pdfError && !pdfDoc && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span className="text-muted">Opening PDF…</span>
            </div>
          )}
          {pdfDoc &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <PdfPage
                key={pageNumber}
                pdfDoc={pdfDoc}
                pageNumber={pageNumber}
                targetWidth={PAGE_TARGET_WIDTH}
                annotations={annotationsByPage.get(pageNumber) ?? []}
                tool={tool}
                color={color}
                onVisible={reportPageVisible}
                onCreateHighlight={createHighlight}
                onCreateNote={createNote}
                onCreateStroke={createStroke}
                onPinClick={() => setTool('read')}
              />
            ))}
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px var(--space-4)', background: 'var(--color-surface)' }}>
          <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap', flex: 'none' }}>{pageLabel}</span>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--color-accent-2-600)', width: `${percent}%` }}></div>
          </div>
          <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap', flex: 'none' }}>Saved</span>
        </div>
      </div>

      <aside style={{ flex: 'none', width: 'clamp(260px,26vw,330px)', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderTopLeftRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-4) var(--space-4) var(--space-3)' }}>
          <h5 style={{ margin: 0, fontSize: 15, marginRight: 'auto' }}>Marks &amp; notes</h5>
          <span className="tag tag-accent">{marks.length} total</span>
        </div>
        <div className="fm-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {marks.length === 0 && (
            <div style={{ padding: 'var(--space-6) var(--space-3)', textAlign: 'center', fontSize: 13, opacity: 0.6 }}>
              Nothing marked yet. Pick a colour and select some text.
            </div>
          )}
          {marks.map((m) => (
            <div
              key={m.id}
              className="fm-row"
              style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                borderLeft: `4px solid ${m.color ?? 'var(--color-accent)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.5 }}>
                  {m.type === 'highlight' ? 'Highlight' : 'Note'} · p{m.page_number}
                </span>
                <button
                  className="btn btn-icon btn-ghost fm-hover"
                  onClick={() => removeAnnotation(m.id)}
                  title="Delete"
                  style={{ marginLeft: 'auto', width: 24, height: 24 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                    <path d="M5 5l14 14"></path>
                    <path d="M19 5L5 19"></path>
                  </svg>
                </button>
              </div>
              {m.type === 'highlight' ? (
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>{m.quote_text}</div>
              ) : (
                <textarea
                  className="input"
                  value={m.body_text ?? ''}
                  onChange={(e) => updateNoteText(m.id, e.target.value)}
                  placeholder="Write a note…"
                  style={{ borderRadius: 'var(--radius-md)', minHeight: 64, fontSize: 13, background: 'var(--color-surface)' }}
                ></textarea>
              )}
            </div>
          ))}
        </div>
        <div style={{ flex: 'none', padding: 'var(--space-3) var(--space-4)', fontSize: 11, opacity: 0.55, display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4 10-10"></path>
          </svg>
          Saved · available on all your devices
        </div>
      </aside>
    </main>
  )
}
