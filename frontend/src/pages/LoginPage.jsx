import { useState } from 'react'
import { authApi, saveAuth } from '../services/api'

export default function LoginPage({ onLogin }) {
  // Controls whether the page displays login or registration form
  const [mode, setMode] = useState('login')

  // Form data for both login and registration
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })

  // Error message returned from the API
  const [error, setError] = useState('')

  // Prevents multiple submissions while the request is processing
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  // Update the selected form field when the user types
  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  // Switch between login and registration modes
  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  // Handle login or registration submission
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use a different API endpoint depending on the current mode
      const data = isLogin
        ? await authApi.login({
            username: form.username,
            password: form.password,
          })
        : await authApi.register(form)

      // Save authentication data and notify the parent component
      saveAuth(data)
      onLogin({
        username: data.username,
        role: data.role,
        userId: data.userId,
      })
    } catch (requestError) {
      // Display the error message returned by the API
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-content">

          {/* Customizable restaurant name or branding */}
          <div className="restaurant-label">Chinese Restaurant</div>

          <header className="auth-heading">
            {/* Change these texts to customize the page heading */}
            <h1>{isLogin ? 'Welcome back' : 'Join the queue'}</h1>
            <p>
              {isLogin
                ? 'Sign in to manage your queue status.'
                : 'Create an account to get started.'}
            </p>
          </header>

          {/* Login / registration mode selector */}
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

            {/* Email is required only when creating an account */}
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

            {/* API errors are displayed here */}
            {error && <div className="inline-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {/* Customize button text or loading message here */}
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