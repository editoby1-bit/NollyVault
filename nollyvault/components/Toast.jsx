// components/Toast.jsx
import { useEffect, useState } from 'react'

let toastQueue = []
let listeners = []

export function showToast(msg, type = '') {
  const id = Date.now()
  toastQueue = [...toastQueue, { id, msg, type }]
  listeners.forEach(fn => fn([...toastQueue]))
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    listeners.forEach(fn => fn([...toastQueue]))
  }, 3000)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => { listeners = listeners.filter(fn => fn !== setToasts) }
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'gold' ? 'toast-gold' : t.type === 'red' ? 'toast-red' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
