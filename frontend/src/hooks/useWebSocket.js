import { useEffect, useRef } from 'react'

export function useWebSocket(onMessage) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${window.location.host}/ws/queue`
    let ws

    const connect = () => {
      ws = new WebSocket(url)
      ws.onmessage = (e) => onMessageRef.current(e.data)
      ws.onclose = () => setTimeout(connect, 3000)
    }

    connect()
    return () => ws?.close()
  }, [])
}
