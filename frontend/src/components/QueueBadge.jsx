const labels = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  SEATED: 'Seated',
  CANCELLED: 'Cancelled',
}

export default function QueueBadge({ status }) {
  return (
    <span className={`queue-badge queue-badge-${status?.toLowerCase()}`}>
      {labels[status] ?? status}
    </span>
  )
}