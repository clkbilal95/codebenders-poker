import { useEffect, useState } from 'react'

export default function FlyingGift({ gift, fromPos, toPos, onDone }) {
  const [style, setStyle] = useState({
    position: 'fixed',
    left: fromPos.x,
    top: fromPos.y,
    width: 56,
    height: 56,
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'none',
    transform: 'translate(-50%, -50%) scale(1.2)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        left: toPos.x,
        top: toPos.y,
        transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translate(-50%, -50%) scale(0.3)',
        opacity: 0,
      }))
    }, 50)
    const done = setTimeout(onDone, 1000)
    return () => { clearTimeout(timer); clearTimeout(done) }
  }, [])

  const isImage = gift.img && gift.img.startsWith('/')

  return (
    <div style={style}>
      {isImage
        ? <img src={gift.img} alt={gift.label || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{gift.emoji}</span>
      }
    </div>
  )
}
