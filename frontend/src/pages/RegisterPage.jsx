import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      login({ username: res.data.username, role: res.data.role }, res.data.token)
      navigate('/customer')
    } catch (err) {
      setError(err.response?.data?.error ?? 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🥢</div>
          <h1 style={{ fontSize: '20px', fontWeight: 500 }}>สมัครสมาชิก</h1>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {[
              { key: 'username', label: 'ชื่อผู้ใช้', type: 'text', placeholder: 'อย่างน้อย 3 ตัวอักษร' },
              { key: 'email', label: 'อีเมล',      type: 'email', placeholder: 'email@example.com' },
              { key: 'password', label: 'รหัสผ่าน', type: 'password', placeholder: 'อย่างน้อย 6 ตัวอักษร' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  {label}
                </label>
                <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} required />
              </div>
            ))}
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </div>
          </form>
          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b6b6b' }}>
            มีบัญชีแล้ว?{' '}
            <Link to="/login" style={{ color: '#1558a0', textDecoration: 'none', fontWeight: 500 }}>
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
