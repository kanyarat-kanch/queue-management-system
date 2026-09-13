import { useState } from 'react'
import { authApi, saveAuth } from '../services/api'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!isLogin) {
      const passwordValid =
        form.password.length >= 8 &&
        /[A-Za-z]/.test(form.password) &&
        /\d/.test(form.password)

      if (!passwordValid) {
        setError(
          'Password must be at least 8 characters and contain at least one letter and one number.'
        )
        return
      }
    }

    setLoading(true)

    try {
      if (isLogin) {
        const data = await authApi.login({
          username: form.username,
          password: form.password,
        })

        saveAuth(data)

        onLogin({
          username: data.username,
          role: data.role,
        })
      } else {
        await authApi.register(form)

        setForm({
          username: form.username,
          email: '',
          password: '',
        })

        setMode('login')
        setShowPassword(false)
        setSuccess('Account created successfully. Please sign in.')
      }
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

              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={setField('password')}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {!isLogin && (
                <small>
                  At least 8 characters, including one letter and one number.
                </small>
              )}
            </div>

            {error && <div className="inline-error">{error}</div>}

            {success && <div className="inline-success">{success}</div>}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
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