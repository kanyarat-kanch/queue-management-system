import { useState } from 'react'
import { clearAuth, getUser } from './services/api'
import LoginPage from './pages/LoginPage'
import CustomerPage from './pages/CustomerPage'
import StaffPage from './pages/StaffPage'

export default function App() {
  const [user, setUser] = useState(getUser())

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    clearAuth()
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (user.role === 'STAFF') {
    return <StaffPage user={user} onLogout={handleLogout} />
  }

  return <CustomerPage user={user} onLogout={handleLogout} />
}