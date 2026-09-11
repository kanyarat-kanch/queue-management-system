import { useState, useEffect, useRef } from 'react'
import { staffApi, createQueueSocket } from '../services/api'

const STATUS_LABEL = { WAITING: 'รอคิว', CALLED: 'ถูกเรียกแล้ว', SEATED: 'นั่งโต๊ะแล้ว', CANCELLED: 'ยกเลิกแล้ว' }
const STATUS_BADGE = { WAITING: 'badge-waiting', CALLED: 'badge-called', SEATED: 'badge-seated', CANCELLED: 'badge-cancelled' }

export default function StaffPage({ user, onLogout }) {
  const [entries, setEntries]     = useState([])
  const [calling, setCalling]     = useState(false)
  const [lastCalled, setLastCalled] = useState(null)
  const [filter, setFilter]       = useState('WAITING')
  const wsRef = useRef(null)

  const fetchEntries = async () => {
    try {
      const data = await staffApi.getAllEntries()
      setEntries(data)
    } catch (_) {}
  }

  useEffect(() => {
    fetchEntries()
    wsRef.current = createQueueSocket(fetchEntries)
    return () => wsRef.current?.close()
  }, [])

  const callNext = async () => {
    setCalling(true)
    try {
      const data = await staffApi.callNext()
      setLastCalled(data)
      fetchEntries()
    } catch (e) {
      alert(e.message)
    } finally {
      setCalling(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await staffApi.updateStatus(id, status)
      fetchEntries()
    } catch (e) {
      alert(e.message)
    }
  }

  const counts = entries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})

  const filtered = entries.filter(e => filter === 'ALL' ? true : e.status === filter)

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 4rem' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏮</span>
          <span style={{ fontWeight: 500 }}>แดชบอร์ดพนักงาน</span>
          <span style={{ fontSize: 12, background: 'var(--gold-lt)', color: 'var(--gold)', padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>
            STAFF
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{user.username}</span>
          <button className="btn-secondary" onClick={onLogout} style={{ fontSize: 13, padding: '7px 14px' }}>ออกจากระบบ</button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'รอคิว', key: 'WAITING', color: '#1A5276' },
            { label: 'ถูกเรียกแล้ว', key: 'CALLED', color: '#7D6608' },
            { label: 'นั่งโต๊ะแล้ว', key: 'SEATED', color: '#1E8449' },
            { label: 'ยกเลิก', key: 'CANCELLED', color: 'var(--ink-3)' },
          ].map(s => (
            <div key={s.key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 500, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>
                {counts[s.key] || 0}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Call next + last called */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          <button className="btn-primary" onClick={callNext} disabled={calling || !counts['WAITING']}
            style={{ flex: 1, padding: '18px', fontSize: 16 }}>
            {calling ? 'กำลังเรียก...' : `เรียกคิวถัดไป ${counts['WAITING'] ? `(${counts['WAITING']} คิวรออยู่)` : '(ไม่มีคิว)'}`}
          </button>

          {lastCalled && (
            <div className="card" style={{ minWidth: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: '4px solid var(--gold)' }}>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>เรียกล่าสุด</p>
              <p className="mono" style={{ fontSize: 36, fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>
                {String(lastCalled.queueNumber).padStart(3, '0')}
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>{lastCalled.customerName}</p>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['ALL', 'ทั้งหมด'], ['WAITING', 'รอคิว'], ['CALLED', 'ถูกเรียก'], ['SEATED', 'นั่งโต๊ะ'], ['CANCELLED', 'ยกเลิก']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                fontSize: 13, padding: '6px 14px',
                background: filter === k ? 'var(--red)' : 'var(--card)',
                color: filter === k ? '#fff' : 'var(--ink-2)',
                border: '1px solid var(--border2)',
                borderRadius: 20,
              }}>
              {label} {k !== 'ALL' && counts[k] ? `(${counts[k]})` : ''}
            </button>
          ))}
          <button className="btn-secondary" onClick={fetchEntries} style={{ fontSize: 13, padding: '6px 14px', marginLeft: 'auto' }}>
            รีเฟรช
          </button>
        </div>

        {/* Entry list */}
        <div className="card" style={{ padding: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-3)' }}>ไม่มีรายการ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((entry, i) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  {/* Queue number */}
                  <span className="mono" style={{ fontSize: 24, fontWeight: 500, color: 'var(--red)', minWidth: 52 }}>
                    {String(entry.queueNumber).padStart(3, '0')}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{entry.customerName}</span>
                      <span className={`badge ${STATUS_BADGE[entry.status]}`}>{STATUS_LABEL[entry.status]}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {entry.partySize} คน
                      {entry.notes && ` · ${entry.notes}`}
                      {entry.createdAt && ` · ${new Date(entry.createdAt).toLocaleTimeString('th-TH')}`}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {entry.status === 'WAITING' && (
                      <button className="btn-secondary"
                        onClick={() => updateStatus(entry.id, 'CALLED')}
                        style={{ fontSize: 12, padding: '6px 12px' }}>
                        เรียก
                      </button>
                    )}
                    {entry.status === 'CALLED' && (
                      <button className="btn-gold"
                        onClick={() => updateStatus(entry.id, 'SEATED')}
                        style={{ fontSize: 12, padding: '6px 12px' }}>
                        นั่งโต๊ะแล้ว
                      </button>
                    )}
                    {(entry.status === 'WAITING' || entry.status === 'CALLED') && (
                      <button className="btn-secondary"
                        onClick={() => updateStatus(entry.id, 'CANCELLED')}
                        style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)' }}>
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
