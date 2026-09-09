import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { useSignup } from '../state/useAuth'

export function Signup({ onGoLogin }: { onGoLogin: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signup = useSignup()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    signup.mutate({ email, password, displayName })
  }

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'var(--space-6)' }}>
      <form
        onSubmit={handleSubmit}
        className="elev-md"
        style={{
          width: 'min(380px, 100%)',
          background: 'var(--color-surface)',
          borderRadius: 'calc(var(--radius-lg) * 1.15)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Create your shelf</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
            One account, synced across every device you read on.
          </p>
        </div>

        <div className="field">
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            className="input"
            required
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            className="input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {signup.isError && (
          <div style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>
            {signup.error instanceof ApiError ? signup.error.message : 'Something went wrong.'}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </button>

        <div style={{ fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onGoLogin()
            }}
          >
            Sign in
          </a>
        </div>
      </form>
    </main>
  )
}
