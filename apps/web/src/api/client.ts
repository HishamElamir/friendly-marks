import type {
  Annotation,
  AnnotationType,
  Device,
  DeviceType,
  Document,
  DocumentCategory,
  ProgressUpdate,
  SearchResponse,
  User,
} from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail ?? message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// --- auth ---

export function signup(email: string, password: string, displayName: string): Promise<User> {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  })
}

export function login(email: string, password: string): Promise<User> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' })
}

export function me(): Promise<User> {
  return request('/auth/me')
}

// --- devices ---

export function registerDevice(clientDeviceId: string, name: string, deviceType: DeviceType): Promise<Device> {
  return request('/devices/register', {
    method: 'POST',
    body: JSON.stringify({ client_device_id: clientDeviceId, name, device_type: deviceType }),
  })
}

export function listDevices(): Promise<Device[]> {
  return request('/devices')
}

// --- documents ---

export interface DocumentListFilters {
  category?: DocumentCategory
  markedUp?: boolean
  q?: string
}

export function listDocuments(filters: DocumentListFilters = {}): Promise<Document[]> {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.markedUp !== undefined) params.set('marked_up', String(filters.markedUp))
  if (filters.q) params.set('q', filters.q)
  const qs = params.toString()
  return request(`/documents${qs ? `?${qs}` : ''}`)
}

export function getDocument(documentId: string): Promise<Document> {
  return request(`/documents/${documentId}`)
}

export function createDocument(
  title: string,
  category: DocumentCategory,
  filename: string,
  contentType: string,
  authors?: string,
): Promise<{ document_id: string; upload_url: string }> {
  return request('/documents', {
    method: 'POST',
    body: JSON.stringify({ title, category, filename, content_type: contentType, authors }),
  })
}

/** Uses XMLHttpRequest rather than fetch because fetch has no upload-progress event. */
export function uploadFile(uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.statusText)))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}

export function completeUpload(documentId: string): Promise<Document> {
  return request(`/documents/${documentId}/complete`, { method: 'POST' })
}

export function getFileUrl(documentId: string): Promise<{ url: string }> {
  return request(`/documents/${documentId}/file-url`)
}

export function deleteDocument(documentId: string): Promise<void> {
  return request(`/documents/${documentId}`, { method: 'DELETE' })
}

// --- annotations ---

export function listAnnotations(documentId: string): Promise<Annotation[]> {
  return request(`/documents/${documentId}/annotations`)
}

export interface CreateAnnotationPayload {
  type: AnnotationType
  page_number: number
  color?: string
  quote_text?: string
  body_text?: string
  data: Record<string, unknown>
  device_id?: string
}

export function createAnnotation(documentId: string, payload: CreateAnnotationPayload): Promise<Annotation> {
  return request(`/documents/${documentId}/annotations`, { method: 'POST', body: JSON.stringify(payload) })
}

export function updateAnnotation(
  annotationId: string,
  payload: { body_text?: string; color?: string },
): Promise<Annotation> {
  return request(`/annotations/${annotationId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteAnnotation(annotationId: string): Promise<void> {
  return request(`/annotations/${annotationId}`, { method: 'DELETE' })
}

// --- progress ---

export function updateProgress(
  documentId: string,
  pageNumber: number,
  percent: number,
  deviceId?: string,
): Promise<ProgressUpdate> {
  return request(`/documents/${documentId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ page_number: pageNumber, percent, device_id: deviceId }),
  })
}

// --- search ---

export function search(q: string): Promise<SearchResponse> {
  return request(`/search?q=${encodeURIComponent(q)}`)
}
