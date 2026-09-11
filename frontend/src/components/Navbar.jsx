import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid rgba(0,0,0,0.10)',
      padding: '0 1.5rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🥢</span>
        <span style={{ fontWeight: 500, fontSize: '16px' }}>ระบบคิวร้านอาหาร</span>
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6b6b6b' }}>
            {user.username}
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '20px',
              background: user.role === 'STAFF' ? '#edf7f2' : '#eaf2fb',
              color: user.role === 'STAFF' ? '#1a7a4a' : '#1558a0',
            }}>
              {user.role === 'STAFF' ? 'พนักงาน' : 'ลูกค้า'}
            </span>
          </span>
          <button className="btn-outline" onClick={handleLogout}
            style={{ padding: '6px 14px', fontSize: '14px' }}>
            ออกจากระบบ
          </button>
        </div>
      )}
    </nav>
  )
}
