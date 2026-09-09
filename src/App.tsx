import { Header } from './components/Header'
import { Library } from './components/Library'
import { Reader } from './components/Reader'
import { UploadDialog } from './components/UploadDialog'
import { useFriendlyMarks } from './state/useFriendlyMarks'

export default function App() {
  const state = useFriendlyMarks()

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
    >
      <Header state={state} />
      {state.view === 'library' && <Library state={state} />}
      {state.view === 'reader' && <Reader state={state} />}
      {state.uploadOpen && <UploadDialog state={state} />}
    </div>
  )
}
