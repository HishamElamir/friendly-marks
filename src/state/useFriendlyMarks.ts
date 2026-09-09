import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COLORS, DOC } from '../data'
import type { HighlightMap, Note, PersistedState, StrokeMap, Stroke, Tool, View } from '../types'

const STORAGE_KEY = 'fm.state'

function loadPersisted(): Partial<PersistedState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function useFriendlyMarks() {
  const saved = useMemo(loadPersisted, [])

  const [view, setView] = useState<View>(saved.view || 'library')
  const [tool, setTool] = useState<Tool>('highlight')
  const [color, setColor] = useState<string>(COLORS[0].color)
  const [highlights, setHighlights] = useState<HighlightMap>(
    saved.highlights || { '0-1-1': '#ffd97a', '0-4-2': '#ccdbb2' },
  )
  const [notes, setNotes] = useState<Note[]>(
    saved.notes || [{ id: 'n1', page: 0, x: 74, y: 46, text: 'Selectivity > volume — use for lit review intro.' }],
  )
  const [strokes, setStrokes] = useState<StrokeMap>(saved.strokes || {})
  const [drawing, setDrawing] = useState<Stroke | null>(null)
  const [progress, setProgress] = useState<number>(saved.progress ?? 34)

  const [syncOpen, setSyncOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ view, highlights, notes, strokes, progress }),
      )
    } catch {
      // ignore persistence failures (e.g. private browsing)
    }
  }, [view, highlights, notes, strokes, progress])

  const goLibrary = useCallback(() => {
    setView('library')
    setSyncOpen(false)
  }, [])

  const goReader = useCallback(() => {
    setView('reader')
    setSyncOpen(false)
  }, [])

  const toggleSync = useCallback(() => setSyncOpen((v) => !v), [])

  const pickTool = useCallback((t: Tool) => setTool(t), [])

  const pickColor = useCallback((c: string) => {
    setColor(c)
    setTool('highlight')
  }, [])

  const onSentence = useCallback(
    (id: string) => {
      if (tool !== 'highlight') return
      setHighlights((prev) => {
        const next = { ...prev }
        if (next[id] === color) delete next[id]
        else next[id] = color
        return next
      })
    },
    [tool, color],
  )

  const addNote = useCallback((page: number, x: number, y: number) => {
    const id = 'n' + Date.now()
    setNotes((prev) => [...prev, { id, page, x, y, text: '' }])
  }, [])

  const editNote = useCallback((id: string, text: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))
  }, [])

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const beginStroke = useCallback(
    (page: number, x: number, y: number) => {
      setDrawing({ page, color, w: 3, d: `M${x} ${y}` })
    },
    [color],
  )

  const extendStroke = useCallback((x: number, y: number) => {
    setDrawing((prev) => (prev ? { ...prev, d: `${prev.d} L${x.toFixed(1)} ${y.toFixed(1)}` } : prev))
  }, [])

  const endStroke = useCallback(() => {
    setDrawing((prev) => {
      if (!prev) return prev
      setStrokes((prevStrokes) => ({
        ...prevStrokes,
        [prev.page]: [...(prevStrokes[prev.page] || []), prev],
      }))
      return null
    })
  }, [])

  const clearInk = useCallback(() => {
    setStrokes({})
    setDrawing(null)
  }, [])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const p = Math.min(100, Math.round((el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 60) + 34)
    setProgress((prev) => (Math.abs(p - prev) >= 1 ? p : prev))
  }, [])

  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const openUpload = useCallback(() => {
    setUploadOpen(true)
    setUploading(false)
    setUploadPct(0)
  }, [])

  const closeUpload = useCallback(() => {
    setUploadOpen(false)
    setUploading(false)
    if (uploadTimer.current) {
      clearInterval(uploadTimer.current)
      uploadTimer.current = null
    }
  }, [])

  const fakeUpload = useCallback(() => {
    if (uploading) return
    setUploading(true)
    setUploadPct(8)
    uploadTimer.current = setInterval(() => {
      setUploadPct((prev) => {
        const next = prev + 17
        if (next >= 100) {
          if (uploadTimer.current) clearInterval(uploadTimer.current)
          uploadTimer.current = null
          setTimeout(() => {
            setUploadOpen(false)
            setUploading(false)
            setView('reader')
          }, 550)
          return 100
        }
        return next
      })
    }, 220)
  }, [uploading])

  useEffect(() => {
    return () => {
      if (uploadTimer.current) clearInterval(uploadTimer.current)
    }
  }, [])

  const noteCount = notes.length
  const pageCount = DOC.length

  return {
    view,
    tool,
    color,
    highlights,
    notes,
    strokes,
    drawing,
    progress,
    syncOpen,
    uploadOpen,
    uploading,
    uploadPct,
    noteCount,
    pageCount,
    scrollRef,
    goLibrary,
    goReader,
    toggleSync,
    pickTool,
    pickColor,
    onSentence,
    addNote,
    editNote,
    removeNote,
    removeHighlight,
    beginStroke,
    extendStroke,
    endStroke,
    clearInk,
    onScroll,
    openUpload,
    closeUpload,
    fakeUpload,
  }
}

export type FriendlyMarksState = ReturnType<typeof useFriendlyMarks>
