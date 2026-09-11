import { useState } from 'react'
import { authApi, saveAuth } from '../services/api'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')  // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await authApi.login({ username: form.username, password: form.password })
        : await authApi.register(form)
      saveAuth(data)
      onLogin({ username: data.username, role: data.role, userId: data.userId })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      {/* Logo / Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏮</div>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px' }}>ระบบคิวร้านอาหารจีน</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>Chinese Restaurant Queue System</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 3, marginBottom: '1.5rem', background: 'var(--surface)' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: 7, fontSize: 14,
                background: mode === m ? 'var(--card)' : 'transparent',
                border: mode === m ? '1px solid var(--border2)' : 'none',
                color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: mode === m ? 500 : 400,
              }}>
              {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>ชื่อผู้ใช้งาน</label>
            <input type="text" placeholder="username" value={form.username} onChange={set('username')} />
          </div>

          {mode === 'register' && (
            <div>
              <label>อีเมล</label>
              <input type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
            </div>
          )}

          <div>
            <label>รหัสผ่าน</label>
            <input type="password" placeholder="••••••" value={form.password} onChange={set('password')}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>

          {error && (
            <div style={{ background: 'var(--red-lt)', color: 'var(--red-dk)', fontSize: 13, padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'กำลังโหลด...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </div>
      </div>

    </div>
  )
}
