export type View = 'library' | 'reader' | 'login' | 'signup'
export type Tool = 'read' | 'highlight' | 'pen' | 'note'
export type ReaderTheme = 'paper' | 'sepia' | 'night'

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
