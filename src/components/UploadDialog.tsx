import type { FriendlyMarksState } from '../state/useFriendlyMarks'

export function UploadDialog({ state }: { state: FriendlyMarksState }) {
  const { closeUpload, fakeUpload, uploading, uploadPct } = state

  return (
    <div className="dialog-backdrop" style={{ zIndex: 60 }}>
      <div className="dialog" style={{ width: 'min(520px,100%)' }}>
        <div className="dialog-title">Add a PDF to your shelf</div>
        <div
          onClick={fakeUpload}
          style={{
            border: '2px dashed var(--color-neutral-400)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8) var(--space-4)',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--color-bg)',
          }}
        >
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
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--color-accent)', width: `${uploadPct}%`, transition: 'width .25s' }}></div>
            </div>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{uploadPct >= 100 ? 'Indexed' : `${uploadPct}%`}</span>
          </div>
        )}
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={closeUpload}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={fakeUpload}>
            Upload &amp; open
          </button>
        </div>
      </div>
    </div>
  )
}
