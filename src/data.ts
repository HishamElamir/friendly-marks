import type { ColorSwatch, Device, DocPage, ReaderTheme, ShelfDoc, ToolDef } from './types'

export const DOC: DocPage[] = [
  {
    header: 'Reading Practices Quarterly · 2026 · p.14',
    blocks: [
      { t: 'h', text: '3. Marking as a memory device' },
      {
        t: 'p',
        text: 'Readers who annotate recall roughly a third more of a text than readers who do not. The effect is not about the ink itself. It comes from the decision that precedes the mark: choosing what deserves a line forces a judgement about relative importance, and that judgement is what survives.',
      },
      {
        t: 'p',
        text: 'In our study of 214 graduate students, participants read the same twelve-page paper under three conditions. The first group read without tools. The second could highlight. The third could highlight and write in the margin. Recall was measured after seven days.',
      },
      {
        t: 'q',
        text: '“The margin is not storage. It is a place to argue with the page while the argument is still warm.”',
      },
      {
        t: 'p',
        text: 'The margin-writing group outperformed both others by a wide margin, but the interesting result was the failure mode. Students who highlighted heavily and wrote nothing did no better than students who read plainly. Volume of marking predicted nothing; selectivity predicted almost everything.',
      },
    ],
  },
  {
    header: 'Reading Practices Quarterly · 2026 · p.15',
    blocks: [
      { t: 'h', text: '3.1 Where the marks go' },
      {
        t: 'p',
        text: 'A second problem is retrieval. Marks made on a printed page are stranded on that page. Students in our follow-up interviews described re-reading whole chapters to find a single sentence they were certain they had underlined.',
      },
      {
        t: 'p',
        text: 'This suggests a design requirement that has little to do with reading and everything to do with return: annotations should be addressable, searchable, and present wherever the reader next opens the document. Reading is rarely finished in one sitting or on one device.',
      },
      {
        t: 'p',
        text: 'We therefore treat the annotation layer as the primary artefact and the document as its substrate. Under this framing, progress, marks and scratch notes are one synchronised object, and the page is simply where they happen to be anchored.',
      },
    ],
  },
]

export const COLORS: ColorSwatch[] = [
  { name: 'Butter', color: '#ffd97a' },
  { name: 'Terracotta', color: '#f6a06b' },
  { name: 'Sage', color: '#ccdbb2' },
  { name: 'Sky', color: '#a9cbe0' },
]

export const SHELF: ShelfDoc[] = [
  { title: 'Attention Without Anxiety', meta: 'Paper · 24 pp', pct: 62, marks: 31, device: 'MacBook' },
  { title: 'Statistical Rethinking, ch. 4', meta: 'Textbook · 58 pp', pct: 18, marks: 12, device: 'iPad' },
  { title: 'Notes on Distributed Systems', meta: 'Paper · 16 pp', pct: 100, marks: 44, device: 'Web' },
  { title: 'Thermodynamics for Engineers', meta: 'Textbook · 412 pp', pct: 7, marks: 3, device: 'iPad' },
  { title: 'A Grammar of Motives', meta: 'Book · 340 pp', pct: 41, marks: 27, device: 'MacBook' },
  { title: 'Fieldwork Interviews, batch 3', meta: 'Transcript · 9 pp', pct: 88, marks: 15, device: 'Web' },
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

export const DEVICES: Device[] = [
  { name: 'MacBook Pro', detail: 'p.14 · 2 minutes ago', state: 'This device', rx: 3, rw: 18, foot: 'M2 20h20' },
  { name: 'iPad', detail: 'p.11 · yesterday', state: 'Up to date', rx: 5, rw: 14, foot: 'M12 17h.01' },
  { name: 'Phone', detail: 'p.9 · Sunday', state: 'Up to date', rx: 8, rw: 8, foot: 'M12 16h.01' },
]

export const CURRENT_DOC = {
  title: 'Attention Without Anxiety',
  authors: 'R. Okonjo, L. Vidal · Reading Practices Quarterly',
}

export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?”]+[.!?”]*\s*/g) || [text]
  return parts.filter((p) => p.trim().length > 0)
}
