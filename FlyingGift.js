import { useEffect, useState } from 'react'

export default function FlyingGift({ gift, fromPos, toPos, onDone }) {
  const [style, setStyle] = useState({
    position: 'fixed',
    left: fromPos.x,
    top: fromPos.y,
    fontSize: '2.5rem',
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'none',
    transform: 'translate(-50%, -50%)',
  })

  useEffect(() => {
    // Start animation
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

  return (
    <div style={style}>
      {gift.emoji}
    </div>
  )
}
