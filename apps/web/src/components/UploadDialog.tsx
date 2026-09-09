import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import * as api from '../api/client'
import { ApiError } from '../api/client'

type Stage = 'idle' | 'uploading' | 'indexing' | 'error'

function titleFromFilename(filename: string): string {
  return filename.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || filename
}

export function UploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: (documentId: string) => void
}) {
  const [stage, setStage] = useState<Stage>('idle')
  const [pct, setPct] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.')
      setStage('error')
      return
    }
    setError(null)
    setStage('uploading')
    setPct(0)
    try {
      const { document_id, upload_url } = await api.createDocument(
        titleFromFilename(file.name),
        'other',
        file.name,
        file.type || 'application/pdf',
      )
      await api.uploadFile(upload_url, file, setPct)
      setStage('indexing')
      await api.completeUpload(document_id)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onUploaded(document_id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed. Please try again.')
      setStage('error')
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const busy = stage === 'uploading' || stage === 'indexing'

  return (
    <div className="dialog-backdrop" style={{ zIndex: 60 }}>
      <div className="dialog" style={{ width: 'min(520px,100%)' }}>
        <div className="dialog-title">Add a PDF to your shelf</div>
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={{
            border: '2px dashed var(--color-neutral-400)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8) var(--space-4)',
            textAlign: 'center',
            cursor: busy ? 'default' : 'pointer',
            background: 'var(--color-bg)',
          }}
        >
          <input ref={inputRef} type="file" accept="application/pdf" onChange={onPick} style={{ display: 'none' }} />
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 10px' }}
          >
            <path d="M12 16V4"></path>
            <path d="M7 9l5-5 5 5"></path>
            <path d="M4 18h16"></path>
          </svg>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17 }}>Drop files, or click to browse</div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
            PDF up to 200 MB · text is indexed for search
          </div>
        </div>

        {busy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: 'var(--color-accent)',
                  width: `${stage === 'indexing' ? 100 : pct}%`,
                  transition: 'width .25s',
                }}
              ></div>
            </div>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{stage === 'indexing' ? 'Opening…' : `${pct}%`}</span>
          </div>
        )}

        {stage === 'error' && error && (
          <div style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>{error}</div>
        )}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => !busy && inputRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Choose file'}
          </button>
        </div>
      </div>
    </div>
  )
}
