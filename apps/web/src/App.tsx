import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Header } from './components/Header'
import { Library } from './components/Library'
import { Login } from './components/Login'
import { Signup } from './components/Signup'
import { UploadDialog } from './components/UploadDialog'
import { useCurrentDevice, useCurrentUser } from './state/useAuth'
import type { View } from './types'

// pdfjs-dist is a large dependency the Login/Library screens never need —
// only load it once a document is actually opened.
const Reader = lazy(() => import('./components/Reader').then((m) => ({ default: m.Reader })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
})

function AppShell() {
  const { data: user, isLoading } = useCurrentUser()
  useCurrentDevice() // registers/refreshes this browser's device row as soon as we're authenticated
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [view, setView] = useState<View>('library')
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const shellStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    overflow: 'hidden' as const,
  }

  if (isLoading) {
    return <div style={shellStyle} />
  }

  if (!user) {
    return (
      <div style={shellStyle}>
        {authView === 'login' ? (
          <Login onGoSignup={() => setAuthView('signup')} />
        ) : (
          <Signup onGoLogin={() => setAuthView('login')} />
        )}
      </div>
    )
  }

  function goLibrary() {
    setView('library')
  }

  function goReader(documentId: string) {
    setCurrentDocumentId(documentId)
    setView('reader')
  }

  return (
    <div style={shellStyle}>
      <Header
        user={user}
        view={view}
        hasCurrentDocument={currentDocumentId !== null}
        onGoLibrary={goLibrary}
        onGoReader={() => currentDocumentId && goReader(currentDocumentId)}
        onSelectSearchResult={goReader}
      />
      {view === 'library' && (
        <Library onOpenDocument={goReader} onOpenUpload={() => setUploadOpen(true)} />
      )}
      {view === 'reader' && currentDocumentId && (
        <Suspense fallback={<main style={{ flex: 1 }} />}>
          <Reader documentId={currentDocumentId} onBack={goLibrary} />
        </Suspense>
      )}
      {uploadOpen && (
        <UploadDialog
          onClose={() => setUploadOpen(false)}
          onUploaded={(documentId) => {
            setUploadOpen(false)
            goReader(documentId)
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}
