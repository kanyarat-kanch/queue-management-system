import { useState } from 'react'
import { authApi, saveAuth } from '../services/api'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = isLogin
        ? await authApi.login({
            username: form.username,
            password: form.password,
          })
        : await authApi.register(form)

      saveAuth(data)
      onLogin({
        username: data.username,
        role: data.role,
        userId: data.userId,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-content">
          <div className="restaurant-label">Chinese Restaurant</div>

          <header className="auth-heading">
            <h1>{isLogin ? 'Welcome back' : 'Join the queue'}</h1>
            <p>
              {isLogin
                ? 'Sign in to manage your queue status.'
                : 'Create an account to get started.'}
            </p>
          </header>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              type="button"
              onClick={() => changeMode('login')}
            >
              Sign in
            </button>

            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              type="button"
              onClick={() => changeMode('register')}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={setField('username')}
                autoComplete="username"
                required
              />
            </div>

            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={setField('email')}
                  autoComplete="email"
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={setField('password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {error && <div className="inline-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}