import { CURRENT_DOC, SHELF } from '../data'
import type { FriendlyMarksState } from '../state/useFriendlyMarks'

export function Library({ state }: { state: FriendlyMarksState }) {
  const { progress, goReader, openUpload } = state

  return (
    <main
      className="fm-scroll"
      style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-4) var(--space-6) var(--space-8)' }}
    >
      <div style={{ maxWidth: 1180 }}>
        <h1 style={{ fontSize: 40, margin: '0 0 6px' }}>Everything you&apos;ve marked</h1>
        <p className="text-muted" style={{ maxWidth: '52ch' }}>
          One shelf, every device. Pick up on the page — and the paragraph — you stopped on.
        </p>

        <section
          style={{
            display: 'flex',
            gap: 'var(--space-6)',
            alignItems: 'stretch',
            margin: 'var(--space-6) 0 var(--space-8)',
            flexWrap: 'wrap',
          }}
        >
          <div
            className="elev-md"
            style={{
              flex: '1 1 520px',
              minWidth: 320,
              display: 'flex',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              borderRadius: 'calc(var(--radius-lg) * 1.15)',
              background: 'var(--color-surface)',
            }}
          >
            <div
              className="washed"
              style={{
                width: 96,
                flex: 'none',
                borderRadius: 'var(--radius-md)',
                background:
                  'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 7px,var(--color-neutral-300) 7px 14px)',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                fontFamily: 'ui-monospace,Menlo,monospace',
                fontSize: 9,
                color: 'var(--color-neutral-700)',
                padding: 6,
              }}
            >
              page 14
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="card-kicker">Continue reading</span>
              <h3 style={{ margin: 0 }}>{CURRENT_DOC.title}</h3>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {CURRENT_DOC.authors}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                <div
                  style={{
                    flex: 1,
                    height: 7,
                    borderRadius: 999,
                    background: 'var(--color-neutral-300)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: '100%', borderRadius: 999, background: 'var(--color-accent)', width: `${progress}%` }}></div>
                </div>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{Math.round(progress)}%</span>
                <button className="btn btn-primary" onClick={goReader}>
                  Resume
                </button>
              </div>
            </div>
          </div>
          <button
            className="btn"
            onClick={openUpload}
            style={{
              flex: '1 1 260px',
              minWidth: 240,
              flexDirection: 'column',
              gap: 10,
              padding: 'var(--space-6)',
              border: '2px dashed var(--color-neutral-400)',
              borderRadius: 'calc(var(--radius-lg) * 1.15)',
              background: 'transparent',
              fontSize: 15,
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4"></path>
              <path d="M7 9l5-5 5 5"></path>
              <path d="M4 18h16"></path>
            </svg>
            Drop a PDF here
            <span className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>
              or browse your files
            </span>
          </button>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0, marginRight: 'auto' }}>Your shelf</h4>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="fmfilter" defaultChecked />
              All 12
            </label>
            <label className="seg-opt">
              <input type="radio" name="fmfilter" />
              Papers
            </label>
            <label className="seg-opt">
              <input type="radio" name="fmfilter" />
              Textbooks
            </label>
            <label className="seg-opt">
              <input type="radio" name="fmfilter" />
              Marked up
            </label>
          </div>
          <button className="btn btn-primary" onClick={openUpload}>
            Upload PDF
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 'var(--space-4)' }}>
          {SHELF.map((doc) => (
            <div
              key={doc.title}
              className="card elev-sm fm-doc"
              onClick={goReader}
              style={{ cursor: 'pointer', gap: 'var(--space-3)', padding: 'var(--space-3)' }}
            >
              <div
                className="washed"
                style={{
                  aspectRatio: '4/3',
                  borderRadius: 'var(--radius-md)',
                  background:
                    'repeating-linear-gradient(135deg,var(--color-neutral-200) 0 7px,var(--color-neutral-300) 7px 14px)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'ui-monospace,Menlo,monospace',
                  fontSize: 10,
                  color: 'var(--color-neutral-700)',
                }}
              >
                cover
              </div>
              <div className="card-title" style={{ fontSize: 15 }}>
                {doc.title}
              </div>
              <div className="card-meta">{doc.meta}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-accent)', width: `${doc.pct}%` }}></div>
                </div>
                <span style={{ fontSize: 11, opacity: 0.55 }}>{doc.pct}%</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-accent">{doc.marks} marks</span>
                <span className="tag tag-neutral">{doc.device}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
