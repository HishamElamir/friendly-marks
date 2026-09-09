import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import * as api from '../api/client'
import type { CreateAnnotationPayload } from '../api/client'
import { COLORS } from '../data'
import { pdfjsLib } from '../pdf/setupWorker'
import { useCurrentDevice } from './useAuth'
import type { Tool } from '../types'

const PROGRESS_DEBOUNCE_MS = 1200

export function useDocumentReader(documentId: string) {
  const queryClient = useQueryClient()
  const { data: device } = useCurrentDevice()
  const deviceId = device?.id

  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.getDocument(documentId),
  })

  const fileUrlQuery = useQuery({
    queryKey: ['file-url', documentId],
    queryFn: () => api.getFileUrl(documentId),
    staleTime: 10 * 60_000,
  })

  const annotationsQuery = useQuery({
    queryKey: ['annotations', documentId],
    queryFn: () => api.listAnnotations(documentId),
  })

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileUrlQuery.data) return
    let cancelled = false
    const loadingTask = pdfjsLib.getDocument({ url: fileUrlQuery.data.url })
    loadingTask.promise
      .then((doc) => {
        if (!cancelled) setPdfDoc(doc)
      })
      .catch((e) => {
        if (!cancelled) setPdfError(e instanceof Error ? e.message : 'Could not open this PDF.')
      })
    return () => {
      cancelled = true
      loadingTask.destroy()
    }
  }, [fileUrlQuery.data])

  const [tool, setTool] = useState<Tool>('highlight')
  const [color, setColor] = useState<string>(COLORS[0].color)

  const [currentPage, setCurrentPage] = useState(1)
  const numPages = pdfDoc?.numPages ?? 0

  // Seed from server progress once, when the document first loads — deliberately keyed
  // on just the id, not the whole query result, so a background refetch after a progress
  // mutation doesn't yank the reader back to the last-saved page mid-scroll.
  useEffect(() => {
    if (documentQuery.data) setCurrentPage(Math.max(1, documentQuery.data.progress_page))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentQuery.data?.id])

  const progressMutation = useMutation({
    mutationFn: (vars: { page: number; percent: number }) =>
      api.updateProgress(documentId, vars.page, vars.percent, deviceId),
  })
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function reportPageVisible(page: number) {
    setCurrentPage(page)
    if (progressTimer.current) clearTimeout(progressTimer.current)
    progressTimer.current = setTimeout(() => {
      const percent = numPages > 0 ? Math.round((page / numPages) * 100) : 0
      progressMutation.mutate({ page, percent })
    }, PROGRESS_DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current)
    }
  }, [])

  const invalidateAnnotations = () => queryClient.invalidateQueries({ queryKey: ['annotations', documentId] })

  const createMutation = useMutation({
    mutationFn: (payload: CreateAnnotationPayload) => api.createAnnotation(documentId, payload),
    onSuccess: invalidateAnnotations,
  })
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; body_text?: string; color?: string }) =>
      api.updateAnnotation(vars.id, { body_text: vars.body_text, color: vars.color }),
    onSuccess: invalidateAnnotations,
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAnnotation(id),
    onSuccess: invalidateAnnotations,
  })

  function createHighlight(page: number, quoteText: string, rects: { xPct: number; yPct: number; wPct: number; hPct: number }[]) {
    createMutation.mutate({
      type: 'highlight',
      page_number: page,
      color,
      quote_text: quoteText,
      data: { rects },
      device_id: deviceId,
    })
  }

  function createNote(page: number, xPct: number, yPct: number) {
    createMutation.mutate({
      type: 'note',
      page_number: page,
      body_text: '',
      data: { xPct, yPct },
      device_id: deviceId,
    })
  }

  function createStroke(page: number, xPct: number, yPct: number, w: number, path: string) {
    createMutation.mutate({
      type: 'stroke',
      page_number: page,
      color,
      data: { xPct, yPct, w, path },
      device_id: deviceId,
    })
  }

  function updateNoteText(id: string, text: string) {
    updateMutation.mutate({ id, body_text: text })
  }

  function removeAnnotation(id: string) {
    deleteMutation.mutate(id)
  }

  function clearStrokes() {
    const strokes = (annotationsQuery.data ?? []).filter((a) => a.type === 'stroke')
    strokes.forEach((s) => deleteMutation.mutate(s.id))
  }

  return {
    document: documentQuery.data,
    documentLoading: documentQuery.isLoading,
    pdfDoc,
    pdfError,
    numPages,
    currentPage,
    reportPageVisible,
    annotations: annotationsQuery.data ?? [],
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
  }
}

export type DocumentReaderState = ReturnType<typeof useDocumentReader>
