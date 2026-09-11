import { useState, useEffect, useRef } from 'react'
import { queueApi, createQueueSocket } from '../services/api'

const STATUS_LABEL = { WAITING: 'รอคิว', CALLED: 'ถูกเรียกแล้ว', SEATED: 'รับโต๊ะแล้ว', CANCELLED: 'ยกเลิกแล้ว' }
const STATUS_BADGE = { WAITING: 'badge-waiting', CALLED: 'badge-called', SEATED: 'badge-seated', CANCELLED: 'badge-cancelled' }

export default function CustomerPage({ user, onLogout }) {
  const [queue, setQueue] = useState([])        // waiting list
  const [myEntry, setMyEntry] = useState(null)
  const [form, setForm] = useState({ customerName: user.username, partySize: 2, notes: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const wsRef = useRef(null)

  // fetch queue status
  const fetchStatus = async () => {
    try {
      const data = await queueApi.getStatus()
      setQueue(data)
      setLastUpdate(new Date())
    } catch (_) {}
  }

  // fetch my entry
  const fetchMyEntry = async () => {
    try {
      const data = await queueApi.getMyEntry()
      setMyEntry(data)
    } catch (_) {
      setMyEntry(null)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchMyEntry()

    // WebSocket — refresh whenever queue changes
    wsRef.current = createQueueSocket(() => {
      fetchStatus()
      fetchMyEntry()
    })

    return () => wsRef.current?.close()
  }, [])

  const takeQueue = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await queueApi.takeQueue(form)
      setMyEntry(data)
      fetchStatus()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelQueue = async () => {
    if (!confirm('ยืนยันการยกเลิกคิว?')) return
    try {
      await queueApi.cancelMy()
      setMyEntry(null)
      fetchStatus()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 4rem' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏮</span>
          <span style={{ fontWeight: 500 }}>ระบบคิวร้านอาหารจีน</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>สวัสดี {user.username}</span>
          <button className="btn-secondary" onClick={onLogout} style={{ padding: '7px 14px', fontSize: 13 }}>ออกจากระบบ</button>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* My ticket */}
        {myEntry ? (
          <div className="card" style={{ borderLeft: '4px solid var(--red)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>บัตรคิวของคุณ</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 52, fontWeight: 500, color: 'var(--red)', lineHeight: 1 }}>
                    {String(myEntry.queueNumber).padStart(3, '0')}
                  </span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge ${STATUS_BADGE[myEntry.status]}`}>{STATUS_LABEL[myEntry.status]}</span>
                  {myEntry.status === 'WAITING' && (
                    <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                      รออีก {myEntry.waitingAhead} คิว
                    </span>
                  )}
                  {myEntry.status === 'CALLED' && (
                    <span style={{ fontSize: 13, color: '#7D6608', fontWeight: 500 }}>
                      กรุณาเดินมาที่เคาน์เตอร์!
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
                  {myEntry.customerName} · {myEntry.partySize} คน
                  {myEntry.notes && ` · ${myEntry.notes}`}
                </p>
              </div>
              {myEntry.status === 'WAITING' && (
                <button className="btn-secondary" onClick={cancelQueue} style={{ fontSize: 13, padding: '7px 14px', color: 'var(--red)' }}>
                  ยกเลิกคิว
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Take queue form */
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: '1.25rem' }}>จับคิวรอโต๊ะ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>ชื่อ</label>
                <input type="text" value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div>
                <label>จำนวนคน</label>
                <input type="number" min={1} max={20} value={form.partySize}
                  onChange={e => setForm(f => ({ ...f, partySize: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label>หมายเหตุ (ถ้ามี)</label>
                <input type="text" placeholder="เช่น แพ้ถั่ว ต้องการที่นั่งริมหน้าต่าง"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {error && (
                <div style={{ background: 'var(--red-lt)', color: 'var(--red-dk)', fontSize: 13, padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                  {error}
                </div>
              )}
              <button className="btn-primary" onClick={takeQueue} disabled={loading} style={{ padding: '12px' }}>
                {loading ? 'กำลังจับคิว...' : 'จับคิว'}
              </button>
            </div>
          </div>
        )}

        {/* Queue board */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>คิวที่กำลังรอ ({queue.length} คิว)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastUpdate && (
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  อัพเดต {lastUpdate.toLocaleTimeString('th-TH')}
                </span>
              )}
              <button className="btn-secondary" onClick={fetchStatus} style={{ fontSize: 13, padding: '6px 12px' }}>
                รีเฟรช
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <p>ไม่มีคิวรออยู่ในขณะนี้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.map((entry, i) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: entry.id === myEntry?.id ? 'var(--red-lt)' : 'var(--surface)',
                  borderRadius: 'var(--radius)', border: entry.id === myEntry?.id ? '1px solid #F1948A' : '1px solid transparent'
                }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 20 }}>#{i + 1}</span>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--red)', minWidth: 48 }}>
                    {String(entry.queueNumber).padStart(3, '0')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{entry.customerName}</p>
                    <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>{entry.partySize} คน{entry.notes ? ` · ${entry.notes}` : ''}</p>
                  </div>
                  {entry.id === myEntry?.id && (
                    <span style={{ fontSize: 12, color: 'var(--red-dk)', fontWeight: 500 }}>← คิวของคุณ</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
