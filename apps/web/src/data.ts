import type { ColorSwatch, ReaderTheme, ToolDef } from './types'

export const COLORS: ColorSwatch[] = [
  { name: 'Butter', color: '#ffd97a' },
  { name: 'Terracotta', color: '#f6a06b' },
  { name: 'Sage', color: '#ccdbb2' },
  { name: 'Sky', color: '#a9cbe0' },
]

export const TOOLS: ToolDef[] = [
  { id: 'read', label: 'Read', d: 'M5 3l14 9-6.5 1.5L16 20l-3 1-3.5-6.5L5 19z', d2: '' },
  { id: 'highlight', label: 'Highlight', d: 'M9 15l6-6 4 4-6 6H7z', d2: 'M4 21h7' },
  { id: 'pen', label: 'Scratch', d: 'M4 20l4-1L20 7l-3-3L5 16z', d2: 'M15 6l3 3' },
  { id: 'note', label: 'Sticky note', d: 'M5 5h14v9l-5 5H5z', d2: 'M19 14h-5v5' },
]

export const THEMES: Record<ReaderTheme, { bg: string; fg: string }> = {
  paper: { bg: '#fffaf1', fg: '#201e1d' },
  sepia: { bg: '#f3e3c8', fg: '#2e2418' },
  night: { bg: '#2a2724', fg: '#ece4d6' },
}
