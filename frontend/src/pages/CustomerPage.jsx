import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import QueueBadge from '../components/QueueBadge'
import { createQueueSocket, queueApi } from '../services/api'

export default function CustomerPage({ user, onLogout }) {
  const [queue, setQueue] = useState([])
  const [myEntry, setMyEntry] = useState(null)
  const [form, setForm] = useState({
    customerName: user.username,
    partySize: 2,
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const socketRef = useRef(null)

  const fetchStatus = async () => {
    try {
      setQueue(await queueApi.getStatus())
    } catch {
      setQueue([])
    }
  }

  const fetchMyEntry = async () => {
    try {
      setMyEntry(await queueApi.getMyEntry())
    } catch {
      setMyEntry(null)
    }
  }

  const refreshQueue = () => {
    fetchStatus()
    fetchMyEntry()
  }

  useEffect(() => {
    refreshQueue()
    socketRef.current = createQueueSocket(refreshQueue)

    return () => socketRef.current?.close()
  }, [])

  const takeQueue = async () => {
    setError('')
    setLoading(true)

    try {
      const entry = await queueApi.takeQueue(form)
      setMyEntry(entry)
      fetchStatus()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelQueue = async () => {
    if (!window.confirm('Cancel your queue number?')) return

    try {
      await queueApi.cancelMy()
      setMyEntry(null)
      fetchStatus()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="app-page">
      <AppHeader user={user} onLogout={onLogout} mode="Guest queue" />

      <section className="app-main">
        <p className="page-kicker">Your visit</p>
        <h1 className="page-heading">Your table awaits.</h1>
        <p className="page-subtitle">
          Join the queue and follow your place in real time.
        </p>

        <div className="customer-layout">
          <section>
            {myEntry ? (
              <article className="queue-ticket">
                <p className="ticket-label">Your queue number</p>
                <p className="ticket-number">
                  {String(myEntry.queueNumber).padStart(3, '0')}
                </p>

                <div className="ticket-info">
                  <span>{myEntry.customerName} · Party of {myEntry.partySize}</span>
                  {myEntry.notes && <span> · {myEntry.notes}</span>}
                </div>

                <div className="ticket-bottom">
                  <QueueBadge status={myEntry.status} />
                  {myEntry.status === 'WAITING' && (
                    <span className="ticket-ahead">
                      {myEntry.waitingAhead} ahead
                    </span>
                  )}
                </div>

                {myEntry.status === 'WAITING' && (
                  <button className="ticket-cancel" onClick={cancelQueue}>
                    Cancel queue
                  </button>
                )}
              </article>
            ) : (
              <article className="content-panel">
                <header className="panel-header">
                  <div>
                    <h2>Join the queue</h2>
                    <p>Reserve your place before you arrive.</p>
                  </div>
                </header>

                <div className="queue-form">
                  <div className="form-field">
                    <label htmlFor="customer-name">Name</label>
                    <input
                      id="customer-name"
                      value={form.customerName}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="party-size">Party size</label>
                    <input
                      id="party-size"
                      type="number"
                      min="1"
                      max="20"
                      value={form.partySize}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        partySize: Number(event.target.value) || 1,
                      }))}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="notes">Special notes <small>(optional)</small></label>
                    <input
                      id="notes"
                      placeholder="Allergy information, window seat..."
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))}
                    />
                  </div>

                  {error && <div className="inline-error">{error}</div>}

                  <button className="primary-action" onClick={takeQueue} disabled={loading}>
                    {loading ? 'Joining queue...' : 'Join the queue'}
                  </button>
                </div>
              </article>
            )}
          </section>

          <section className="content-panel">
            <header className="panel-header">
              <div>
                <h2>Now waiting</h2>
                <p>{queue.length} parties in line</p>
              </div>
              <button className="refresh-button" onClick={fetchStatus}>
                Refresh
              </button>
            </header>

            {queue.length === 0 ? (
              <div className="empty-state">No one is waiting right now.</div>
            ) : (
              <div className="queue-list">
                {queue.map((entry, index) => (
                  <div className="queue-row" key={entry.id}>
                    <span className="queue-position">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="queue-number">
                      {String(entry.queueNumber).padStart(3, '0')}
                    </span>

                    <div className="queue-row-info">
                      <p>{entry.customerName}</p>
                      <span>Party of {entry.partySize}</span>
                    </div>

                    {entry.id === myEntry?.id && (
                      <span className="you-label">You</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}