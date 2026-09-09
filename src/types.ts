export type View = 'library' | 'reader'
export type Tool = 'read' | 'highlight' | 'pen' | 'note'
export type ReaderTheme = 'paper' | 'sepia' | 'night'

export interface Block {
  t: 'h' | 'p' | 'q'
  text: string
}

export interface DocPage {
  header: string
  blocks: Block[]
}

export interface Note {
  id: string
  page: number
  x: number
  y: number
  text: string
}

export interface Stroke {
  page: number
  color: string
  w: number
  d: string
}

export type HighlightMap = Record<string, string>
export type StrokeMap = Record<number, Stroke[]>

export interface ShelfDoc {
  title: string
  meta: string
  pct: number
  marks: number
  device: string
}

export interface ColorSwatch {
  name: string
  color: string
}

export interface ToolDef {
  id: Tool
  label: string
  d: string
  d2: string
}

export interface Device {
  name: string
  detail: string
  state: string
  rx: number
  rw: number
  foot: string
}

export interface PersistedState {
  view: View
  highlights: HighlightMap
  notes: Note[]
  strokes: StrokeMap
  progress: number
}
