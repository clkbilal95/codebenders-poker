import { useEffect, useState } from 'react'

export default function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 320 }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast }) {
  const [visible, setVisible] = useState(true)

  const bg = {
    gift: 'linear-gradient(135deg, #1E2438, #2A3050)',
    vote: 'linear-gradient(135deg, #1a2e1a, #1e3a20)',
    reveal: 'linear-gradient(135deg, #2e1a2e, #3a1e38)',
    info: 'linear-gradient(135deg, #1a1e2e, #1e2438)',
  }[toast.type] || 'linear-gradient(135deg, #1E2438, #2A3050)'

  const border = {
    gift: '#F5C842',
    vote: '#3DFFA0',
    reveal: '#6C63FF',
    info: '#6C63FF',
  }[toast.type] || '#6C63FF'

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm shadow-xl toast-enter"
      style={{
        background: bg,
        border: `1px solid ${border}40`,
        color: '#E8EAFF',
        fontFamily: 'Inter',
      }}
    >
      <span style={{ marginRight: 8 }}>{toast.emoji}</span>
      {toast.message}
    </div>
  )
}
