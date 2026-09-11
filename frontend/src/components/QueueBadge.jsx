const labels = {
  WAITING: 'รอคิว',
  CALLED: 'เรียกแล้ว',
  SEATED: 'รับโต๊ะ',
  CANCELLED: 'ยกเลิก',
}

export default function QueueBadge({ status }) {
  return (
    <span className={`badge badge-${status?.toLowerCase()}`}>
      {labels[status] ?? status}
    </span>
  )
}
