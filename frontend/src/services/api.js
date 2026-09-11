const BASE = '/api'

// ─── Auth helpers 
export const getToken = () => localStorage.getItem('token')
export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null')
export const isLoggedIn = () => !!getToken()

export const saveAuth = (data) => {
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// Fetch wrapper
const req = async (method, path, body) => {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาด' }))
    throw new Error(err.error || 'เกิดข้อผิดพลาด')
  }

  if (res.status === 204) return null
  return res.json()
}

// Auth API 
export const authApi = {
  register: (data) => req('POST', '/auth/register', data),
  login: (data) => req('POST', '/auth/login', data),
}

// Queue API
export const queueApi = {
  getStatus: () => req('GET', '/queue/status'),
  getMyEntry: () => req('GET', '/queue/my'),
  takeQueue: (data) => req('POST', '/queue/take', data),
  cancelMy: () => req('DELETE', '/queue/my'),
}

// Staff API
export const staffApi = {
  getAllEntries: () => req('GET',  '/staff/queue'),
  callNext: () => req('POST', '/staff/call-next'),
  updateStatus: (id, status) => req('PUT',  `/staff/status/${id}?status=${status}`),
}

// WebSocket — auto reconnect, ตรงไป queue-service
export const createQueueSocket = (onMessage) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.hostname + ':8082'
  let ws = null
  let destroyed = false
  let retryTimeout = null
  let delay = 1000

  const connect = () => {
    ws = new WebSocket(`${protocol}://${host}/ws/queue`)
    ws.onmessage = (e) => onMessage(e.data)
    ws.onerror = () => console.warn('WebSocket error')
    ws.onclose = () => {
      if (destroyed) return
      retryTimeout = setTimeout(() => {
        delay = Math.min(delay * 2, 30000)
        connect()
      }, delay)
    }
    ws.onopen = () => { delay = 1000 }
  }

  connect()

  return {
    close: () => {
      destroyed = true
      clearTimeout(retryTimeout)
      ws?.close()
    }
  }
}