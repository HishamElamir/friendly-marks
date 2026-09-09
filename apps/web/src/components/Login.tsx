import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { useLogin } from '../state/useAuth'

export function Login({ onGoSignup }: { onGoSignup: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate({ email, password })
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
          <h2 style={{ margin: '0 0 6px' }}>Welcome back</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
            Sign in to reach your shelf and marks on this device.
          </p>
        </div>

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {login.isError && (
          <div style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>
            {login.error instanceof ApiError ? login.error.message : 'Something went wrong.'}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ fontSize: 13, textAlign: 'center' }}>
          New here?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onGoSignup()
            }}
          >
            Create an account
          </a>
        </div>
      </form>
    </main>
  )
}
