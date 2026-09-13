const BASE = '/api'

export const getToken = () => localStorage.getItem('token')

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export const saveAuth = (data) => {
  localStorage.setItem('token', data.token)
  localStorage.setItem(
    'user',
    JSON.stringify({
      username: data.username,
      role: data.role,
      userId: data.userId,
    }),
  )
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const request = async (method, path, body) => {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Something went wrong. Please try again.',
    }))

    throw new Error(error.error || 'Something went wrong. Please try again.')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const authApi = {
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
}

export const queueApi = {
  getStatus: () => request('GET', '/queue/status'),
  getMyEntry: () => request('GET', '/queue/my'),
  takeQueue: (data) => request('POST', '/queue/take', data),
  cancelMy: () => request('DELETE', '/queue/my'),
}

export const staffApi = {
  getAllEntries: () => request('GET', '/staff/queue'),
  callNext: () => request('POST', '/staff/call-next'),
  updateStatus: (id, status) => request('PUT', `/staff/status/${id}?status=${status}`),
}

export const createQueueSocket = (onMessage) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  let socket = null
  let destroyed = false
  let retryTimeout = null
  let retryDelay = 1000

  const connect = () => {
    socket = new WebSocket(`${protocol}://${window.location.host}/ws/queue`)

    socket.onmessage = () => onMessage()

    socket.onopen = () => {
      retryDelay = 1000
    }

    socket.onclose = () => {
      if (destroyed) return

      retryTimeout = window.setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 30000)
        connect()
      }, retryDelay)
    }
  }

  connect()

  return {
    close: () => {
      destroyed = true
      window.clearTimeout(retryTimeout)
      socket?.close()
    },
  }
}