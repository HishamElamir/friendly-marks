import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Annotation, HighlightRect } from '../api/types'
import { pdfjsLib } from '../pdf/setupWorker'
import { THEMES } from '../data'
import type { Tool } from '../types'

interface PdfPageProps {
  pdfDoc: PDFDocumentProxy
  pageNumber: number
  targetWidth: number
  annotations: Annotation[]
  tool: Tool
  color: string
  onVisible: (page: number) => void
  onCreateHighlight: (page: number, quoteText: string, rects: HighlightRect[]) => void
  onCreateNote: (page: number, xPct: number, yPct: number) => void
  onCreateStroke: (page: number, xPct: number, yPct: number, w: number, path: string) => void
  onPinClick: () => void
}

const theme = THEMES.paper
const DEFAULT_ASPECT = 1010 / 780 // US-Letter-ish, used only before the real page loads

export function PdfPage({
  pdfDoc,
  pageNumber,
  targetWidth,
  annotations,
  tool,
  color,
  onVisible,
  onCreateHighlight,
  onCreateNote,
  onCreateStroke,
  onPinClick,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [drawing, setDrawing] = useState<{ x: number; y: number; path: string } | null>(null)

  // trigger a lazy render once the page is within ~800px of the viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setShouldRender(true)), {
      rootMargin: '800px 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // report actual visibility (for reading progress) independent of the render-trigger margin above
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.intersectionRatio >= 0.5 && onVisible(pageNumber)),
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pageNumber, onVisible])

  useEffect(() => {
    if (!shouldRender) return
    let cancelled = false
    let renderTask: ReturnType<import('pdfjs-dist').PDFPageProxy['render']> | null = null

    pdfDoc.getPage(pageNumber).then(async (page) => {
      if (cancelled) return
      const fitScale = targetWidth / page.getViewport({ scale: 1 }).width
      const outputScale = window.devicePixelRatio || 1
      const baseViewport = page.getViewport({ scale: fitScale })
      const renderViewport = page.getViewport({ scale: fitScale * outputScale })
      setSize({ width: baseViewport.width, height: baseViewport.height })

      const canvas = canvasRef.current
      const textLayerEl = textLayerRef.current
      if (!canvas || !textLayerEl) return
      canvas.width = renderViewport.width
      canvas.height = renderViewport.height
      canvas.style.width = `${baseViewport.width}px`
      canvas.style.height = `${baseViewport.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      renderTask = page.render({ canvasContext: ctx, viewport: renderViewport })
      await renderTask.promise
      if (cancelled) return

      textLayerEl.innerHTML = ''
      const textContent = await page.getTextContent()
      if (cancelled) return
      const textLayer = new pdfjsLib.TextLayer({ textContentSource: textContent, container: textLayerEl, viewport: baseViewport })
      await textLayer.render()
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [shouldRender, pdfDoc, pageNumber, targetWidth])

  function handleMouseUp() {
    if (tool !== 'highlight') return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!textLayerRef.current?.contains(range.commonAncestorContainer)) return
    const text = selection.toString().trim()
    if (!text || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const rects: HighlightRect[] = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        xPct: ((r.left - containerRect.left) / containerRect.width) * 100,
        yPct: ((r.top - containerRect.top) / containerRect.height) * 100,
        wPct: (r.width / containerRect.width) * 100,
        hPct: (r.height / containerRect.height) * 100,
      }))
    if (rects.length === 0) return

    onCreateHighlight(pageNumber, text, rects)
    selection.removeAllRanges()
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    if (tool === 'note') {
      onCreateNote(pageNumber, xPct, yPct)
      return
    }
    if (tool === 'pen') {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrawing({ x: xPct, y: yPct, path: `M${e.clientX - rect.left} ${e.clientY - rect.top}` })
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drawing || tool !== 'pen') return
    const rect = e.currentTarget.getBoundingClientRect()
    setDrawing((prev) =>
      prev ? { ...prev, path: `${prev.path} L${(e.clientX - rect.left).toFixed(1)} ${(e.clientY - rect.top).toFixed(1)}` } : prev,
    )
  }

  function handlePointerUp() {
    if (!drawing) return
    onCreateStroke(pageNumber, drawing.x, drawing.y, 3, drawing.path)
    setDrawing(null)
  }

  const drawMode = tool === 'pen' || tool === 'note'
  const highlights = annotations.filter((a) => a.type === 'highlight')
  const notes = annotations.filter((a) => a.type === 'note')
  const strokes = annotations.filter((a) => a.type === 'stroke')

  const width = size?.width ?? targetWidth
  const height = size?.height ?? targetWidth * DEFAULT_ASPECT

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        margin: '0 auto var(--space-6)',
        borderRadius: 'var(--radius-md)',
        background: theme.bg,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {highlights.map((h) =>
        ((h.data.rects as HighlightRect[]) ?? []).map((r, i) => (
          <div
            key={`${h.id}-${i}`}
            style={{
              position: 'absolute',
              left: `${r.xPct}%`,
              top: `${r.yPct}%`,
              width: `${r.wPct}%`,
              height: `${r.hPct}%`,
              background: h.color ?? 'var(--color-accent)',
              mixBlendMode: 'multiply',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
        )),
      )}

      <div ref={textLayerRef} className="fm-textlayer" onMouseUp={handleMouseUp} style={{ cursor: tool === 'highlight' ? 'text' : 'default' }} />

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {strokes.map((s) => {
          const d = s.data as { path: string; w: number }
          return <path key={s.id} d={d.path} fill="none" stroke={s.color ?? '#c67139'} strokeWidth={d.w} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        })}
        {drawing && <path d={drawing.path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
      </svg>

      {notes.map((n, i) => {
        const d = n.data as { xPct: number; yPct: number }
        return (
          <button
            key={n.id}
            onClick={onPinClick}
            title="Sticky note"
            style={{
              position: 'absolute',
              left: `${d.xPct}%`,
              top: `${d.yPct}%`,
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
            {i + 1}
          </button>
        )
      })}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: drawMode ? 'auto' : 'none',
          cursor: tool === 'pen' ? 'crosshair' : 'copy',
          touchAction: 'none',
        }}
      />
    </div>
  )
}
