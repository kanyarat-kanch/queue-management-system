import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import QueueBadge from '../components/QueueBadge'
import { createQueueSocket, staffApi } from '../services/api'

const statuses = ['ALL', 'WAITING', 'CALLED', 'SEATED', 'CANCELLED']

const labels = {
  ALL: 'All',
  WAITING: 'Waiting',
  CALLED: 'Called',
  SEATED: 'Seated',
  CANCELLED: 'Cancelled',
}

export default function StaffPage({ user, onLogout }) {
  const [entries, setEntries] = useState([])
  const [calling, setCalling] = useState(false)
  const [lastCalled, setLastCalled] = useState(null)
  const [filter, setFilter] = useState('WAITING')
  const socketRef = useRef(null)

  const fetchEntries = async () => {
    try {
      setEntries(await staffApi.getAllEntries())
    } catch {
      setEntries([])
    }
  }

  useEffect(() => {
    fetchEntries()
    socketRef.current = createQueueSocket(fetchEntries)

    return () => socketRef.current?.close()
  }, [])

  const callNext = async () => {
    setCalling(true)

    try {
      const entry = await staffApi.callNext()
      setLastCalled(entry)
      fetchEntries()
    } catch (requestError) {
      window.alert(requestError.message)
    } finally {
      setCalling(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await staffApi.updateStatus(id, status)
      fetchEntries()
    } catch (requestError) {
      window.alert(requestError.message)
    }
  }

  const counts = entries.reduce((result, entry) => {
    result[entry.status] = (result[entry.status] || 0) + 1
    return result
  }, {})

  const filteredEntries = entries.filter(
    (entry) => filter === 'ALL' || entry.status === filter,
  )

  return (
    <main className="app-page">
      <AppHeader user={user} onLogout={onLogout} mode="Staff dashboard" />

      <section className="app-main">
        <p className="page-kicker">Dining room</p>
        <h1 className="page-heading">Keep the room moving.</h1>
        <p className="page-subtitle">
          Manage arrivals and seat every guest with ease.
        </p>

        <div className="stats-grid">
          {[
            ['WAITING', 'stat-gold'],
            ['CALLED', 'stat-red'],
            ['SEATED', 'stat-green'],
            ['CANCELLED', 'stat-muted'],
          ].map(([status, colorClass]) => (
            <article className="stat-card" key={status}>
              <p className={`stat-number ${colorClass}`}>{counts[status] || 0}</p>
              <p className="stat-label">{labels[status]}</p>
            </article>
          ))}
        </div>

        <section className="next-call-panel">
          <div>
            <p className="page-kicker">Queue control</p>
            <h2>Ready for the next party?</h2>
            <p>
              {counts.WAITING || 0} party{counts.WAITING === 1 ? '' : 'ies'} currently waiting.
            </p>
          </div>

          <button
            className="primary-action"
            onClick={callNext}
            disabled={calling || !counts.WAITING}
          >
            {calling ? 'Calling...' : 'Call next party'}
          </button>
        </section>

        {lastCalled && (
          <section className="last-called">
            <span>Last called</span>
            <strong>{String(lastCalled.queueNumber).padStart(3, '0')}</strong>
            <span>{lastCalled.customerName}</span>
          </section>
        )}

        <section className="content-panel staff-panel">
          <header className="panel-header">
            <div>
              <h2>Queue overview</h2>
              <p>{filteredEntries.length} entries shown</p>
            </div>
            <button className="refresh-button" onClick={fetchEntries}>
              Refresh
            </button>
          </header>

          <div className="filter-bar">
            {statuses.map((status) => (
              <button
                className={`filter-button ${filter === status ? 'active' : ''}`}
                key={status}
                onClick={() => setFilter(status)}
              >
                {labels[status]}
              </button>
            ))}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="empty-state">No queue entries found.</div>
          ) : (
            <div className="queue-list">
              {filteredEntries.map((entry) => (
                <div className="queue-row staff-row" key={entry.id}>
                  <span className="queue-number">
                    {String(entry.queueNumber).padStart(3, '0')}
                  </span>

                  <div className="queue-row-info">
                    <p>{entry.customerName}</p>
                    <span>
                      Party of {entry.partySize}
                      {entry.notes ? ` · ${entry.notes}` : ''}
                    </span>
                  </div>

                  <QueueBadge status={entry.status} />

                  <div className="staff-actions">
                    {entry.status === 'WAITING' && (
                      <button
                        className="small-button"
                        onClick={() => updateStatus(entry.id, 'CALLED')}
                      >
                        Call
                      </button>
                    )}

                    {entry.status === 'CALLED' && (
                      <button
                        className="small-button"
                        onClick={() => updateStatus(entry.id, 'SEATED')}
                      >
                        Seat
                      </button>
                    )}

                    {(entry.status === 'WAITING' || entry.status === 'CALLED') && (
                      <button
                        className="small-button danger-button"
                        onClick={() => updateStatus(entry.id, 'CANCELLED')}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}