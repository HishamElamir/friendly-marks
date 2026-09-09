import { useMemo, type PointerEvent as ReactPointerEvent } from 'react'
import { COLORS, DOC, THEMES, TOOLS, splitSentences } from '../data'
import type { FriendlyMarksState } from '../state/useFriendlyMarks'

interface Mark {
  id: string
  kind: 'Highlight' | 'Note'
  page: number
  color: string
  quote: string
  isNote: boolean
  text: string
}

export function Reader({ state }: { state: FriendlyMarksState }) {
  const {
    goLibrary,
    tool,
    pickTool,
    color,
    pickColor,
    clearInk,
    highlights,
    notes,
    strokes,
    drawing,
    onSentence,
    addNote,
    beginStroke,
    extendStroke,
    endStroke,
    editNote,
    removeNote,
    removeHighlight,
    progress,
    scrollRef,
    onScroll,
  } = state

  const theme = THEMES.paper

  const pages = useMemo(
    () =>
      DOC.map((pg, pi) => ({
        header: pg.header,
        blocks: pg.blocks.map((blk, bi) => {
          const isH = blk.t === 'h'
          const isQ = blk.t === 'q'
          return {
            font: isH ? 'var(--font-heading)' : 'Iowan Old Style, Palatino, Georgia, serif',
            size: isH ? '21px' : isQ ? '17px' : '16px',
            lh: isH ? '1.2' : '1.72',
            gap: isH ? '16px' : '20px',
            align: isQ ? ('center' as const) : ('left' as const),
            sents: splitSentences(blk.text).map((text, si) => {
              const id = `${pi}-${bi}-${si}`
              return { id, text, bg: highlights[id] || 'transparent' }
            }),
          }
        }),
        strokes: (strokes[pi] || []).concat(drawing && drawing.page === pi ? [drawing] : []),
        pins: notes
          .filter((n) => n.page === pi)
          .map((n, i) => ({ id: n.id, x: n.x, y: n.y, n: i + 1 })),
      })),
    [highlights, notes, strokes, drawing],
  )

  const marks: Mark[] = useMemo(() => {
    const result: Mark[] = []
    Object.keys(highlights).forEach((id) => {
      const p = id.split('-').map(Number)
      const blk = DOC[p[0]].blocks[p[1]]
      result.push({
        id,
        kind: 'Highlight',
        page: p[0] + 14,
        color: highlights[id],
        quote: splitSentences(blk.text)[p[2]].trim(),
        isNote: false,
        text: '',
      })
    })
    notes.forEach((n) => {
      result.push({
        id: n.id,
        kind: 'Note',
        page: n.page + 14,
        color: 'var(--color-accent)',
        quote: `Anchored on page ${n.page + 14}`,
        isNote: true,
        text: n.text,
      })
    })
    return result
  }, [highlights, notes])

  const drawMode = tool === 'pen' || tool === 'note'
  const overlayPE: 'auto' | 'none' = drawMode ? 'auto' : 'none'
  const overlayCursor = tool === 'pen' ? 'crosshair' : 'copy'
  const textCursor = tool === 'highlight' ? 'pointer' : 'text'
  const toolLabel = TOOLS.find((t) => t.id === tool)!.label + ' tool'
  const hintLabel =
    tool === 'highlight'
      ? 'Click any sentence to mark it'
      : tool === 'pen'
        ? 'Drag across the page to scratch'
        : tool === 'note'
          ? 'Click the page to drop a note'
          : 'Reading — pick a tool to mark up'
  const pageLabel = `Page ${14 + Math.min(1, Math.floor(progress / 55))} of 24`
  const savedLabel = 'Saved just now'

  function handleInkDown(e: ReactPointerEvent<HTMLDivElement>, pi: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    if (tool === 'note') {
      addNote(pi, Math.round(((e.clientX - rect.left) / rect.width) * 100), Math.round(((e.clientY - rect.top) / rect.height) * 100))
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    beginStroke(pi, e.clientX - rect.left, e.clientY - rect.top)
  }

  function handleInkMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drawing || tool !== 'pen') return
    const rect = e.currentTarget.getBoundingClientRect()
    extendStroke(e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <main style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 'none', width: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 'var(--space-4) 0' }}>
        <button className="btn btn-icon btn-secondary" onClick={goLibrary} title="Back to shelf">
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
              onClick={() => pickTool(t.id)}
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
              onClick={() => pickColor(c.color)}
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
        <button className="btn btn-icon btn-ghost" onClick={clearInk} title="Clear scratches" style={{ marginTop: 'auto' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16"></path>
            <path d="M7 7l1 13h8l1-13M10 7V4h4v3"></path>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)' }}>
          <h4 style={{ margin: 0, fontSize: 17, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Attention Without Anxiety
          </h4>
          <span className="tag tag-neutral" style={{ whiteSpace: 'nowrap', flex: 'none' }}>
            {toolLabel}
          </span>
          <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hintLabel}
          </span>
        </div>

        <div className="fm-scroll" ref={scrollRef} onScroll={onScroll} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 var(--space-4) var(--space-8)' }}>
          {pages.map((pg, pi) => (
            <div
              key={pi}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 780,
                margin: '0 auto var(--space-6)',
                borderRadius: 'var(--radius-md)',
                background: theme.bg,
                color: theme.fg,
                boxShadow: 'var(--shadow-md)',
                padding: '56px 60px 64px',
              }}
            >
              <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10, opacity: 0.4, marginBottom: 26 }}>{pg.header}</div>
              {pg.blocks.map((blk, bi) => (
                <p
                  key={bi}
                  style={{
                    fontFamily: blk.font,
                    fontSize: blk.size,
                    lineHeight: blk.lh,
                    fontWeight: 400,
                    margin: `0 0 ${blk.gap}`,
                    textAlign: blk.align,
                    textWrap: 'pretty',
                  }}
                >
                  {blk.sents.map((s) => (
                    <span
                      key={s.id}
                      onClick={() => onSentence(s.id)}
                      style={{
                        background: s.bg,
                        borderRadius: 5,
                        padding: '1px 0',
                        cursor: textCursor,
                        boxDecorationBreak: 'clone',
                        WebkitBoxDecorationBreak: 'clone',
                      }}
                    >
                      {s.text}
                    </span>
                  ))}
                </p>
              ))}

              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                {pg.strokes.map((st, si) => (
                  <path key={si} d={st.d} fill="none" stroke={st.color} strokeWidth={st.w} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}></path>
                ))}
              </svg>

              {pg.pins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => pickTool('read')}
                  title="Sticky note"
                  style={{
                    position: 'absolute',
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    width: 26,
                    height: 26,
                    borderRadius: '999px 999px 999px 4px',
                    border: '2px solid var(--color-bg)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {pin.n}
                </button>
              ))}

              <div
                onPointerDown={(e) => handleInkDown(e, pi)}
                onPointerMove={handleInkMove}
                onPointerUp={endStroke}
                style={{ position: 'absolute', inset: 0, pointerEvents: overlayPE, cursor: overlayCursor, touchAction: 'none' }}
              ></div>
            </div>
          ))}
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '10px var(--space-4)', background: 'var(--color-surface)' }}>
          <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap', flex: 'none' }}>{pageLabel}</span>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--color-accent-2-600)', width: `${progress}%` }}></div>
          </div>
          <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap', flex: 'none' }}>{savedLabel}</span>
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
              Nothing marked yet. Pick a colour and click a sentence.
            </div>
          )}
          {marks.map((m) => (
            <div
              key={m.id}
              className="fm-row"
              style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7, borderLeft: `4px solid ${m.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.5 }}>
                  {m.kind} · p{m.page}
                </span>
                <button
                  className="btn btn-icon btn-ghost fm-hover"
                  onClick={() => (m.isNote ? removeNote(m.id) : removeHighlight(m.id))}
                  title="Delete"
                  style={{ marginLeft: 'auto', width: 24, height: 24 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                    <path d="M5 5l14 14"></path>
                    <path d="M19 5L5 19"></path>
                  </svg>
                </button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.45 }}>{m.quote}</div>
              {m.isNote && (
                <textarea
                  className="input"
                  value={m.text}
                  onChange={(e) => editNote(m.id, e.target.value)}
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
          {savedLabel} · available on all your devices
        </div>
      </aside>
    </main>
  )
}
