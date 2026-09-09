export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
}

export type DeviceType = 'desktop' | 'tablet' | 'phone' | 'other'

export interface Device {
  id: string
  client_device_id: string
  name: string
  device_type: DeviceType
  last_document_id: string | null
  last_page: number | null
  last_active_at: string | null
}

export type DocumentCategory = 'paper' | 'textbook' | 'book' | 'transcript' | 'other'
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface Document {
  id: string
  title: string
  authors: string | null
  category: DocumentCategory
  original_filename: string
  file_size_bytes: number | null
  page_count: number | null
  status: DocumentStatus
  created_at: string
  updated_at: string
  marks_count: number
  progress_percent: number
  progress_page: number
}

export type AnnotationType = 'highlight' | 'note' | 'stroke'

export interface HighlightRect {
  xPct: number
  yPct: number
  wPct: number
  hPct: number
}

export interface Annotation {
  id: string
  document_id: string
  type: AnnotationType
  page_number: number
  color: string | null
  quote_text: string | null
  body_text: string | null
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProgressUpdate {
  document_id: string
  page_number: number
  percent: number
}

export interface PageMatch {
  document_id: string
  document_title: string
  page_number: number
  snippet: string
}

export interface MarkMatch {
  annotation_id: string
  document_id: string
  document_title: string
  type: AnnotationType
  page_number: number
  snippet: string
}

export interface SearchResponse {
  pages: PageMatch[]
  marks: MarkMatch[]
}
