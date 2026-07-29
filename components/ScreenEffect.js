import { useEffect, useState } from 'react'

// Matrix rain effect
function MatrixEffect({ onDone }) {
  const [chars, setChars] = useState([])

  useEffect(() => {
    const cols = Math.floor(window.innerWidth / 20)
    const newChars = Array.from({ length: cols * 15 }, (_, i) => ({
      id: i,
      x: (i % cols) * 20,
      y: -Math.random() * 500,
      speed: Math.random() * 3 + 2,
      char: String.fromCharCode(0x30A0 + Math.random() * 96),
      opacity: Math.random(),
    }))
    setChars(newChars)

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => ({
        ...c,
        y: c.y + c.speed,
        char: Math.random() > 0.95 ? String.fromCharCode(0x30A0 + Math.random() * 96) : c.char,
        opacity: c.y > window.innerHeight ? 0 : c.opacity,
      })))
    }, 50)

    setTimeout(() => {
      clearInterval(interval)
      onDone()
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9998, pointerEvents: 'none', background: 'rgba(0,0,0,0.85)',
      overflow: 'hidden',
    }}>
      {chars.map(c => (
        <span key={c.id} style={{
          position: 'absolute',
          left: c.x,
          top: c.y,
          color: '#00FF41',
          fontFamily: 'monospace',
          fontSize: '18px',
          opacity: c.opacity,
          textShadow: '0 0 8px #00FF41',
          transition: 'top 0.05s linear',
        }}>
          {c.char}
        </span>
      ))}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#00FF41', fontFamily: 'monospace',
        fontSize: '2rem', fontWeight: 'bold',
        textShadow: '0 0 20px #00FF41',
        animation: 'matrixPulse 0.5s ease-in-out infinite alternate',
      }}>
        WAKE UP, NEO... 🐰
      </div>
      <style>{`
        @keyframes matrixPulse {
          from { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

// Fireworks effect
function FireworksEffect({ onDone }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    function burst() {
      const cx = Math.random() * window.innerWidth
      const cy = Math.random() * window.innerHeight * 0.7
      const color = ['#FF6B9D', '#6C63FF', '#F5C842', '#3DFFA0', '#FF4444', '#44AAFF'][Math.floor(Math.random() * 6)]
      const newP = Array.from({ length: 30 }, (_, i) => ({
        id: Math.random(),
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color, opacity: 1,
        size: Math.random() * 6 + 3,
      }))
      setParticles(prev => [...prev.slice(-200), ...newP])
    }

    burst()
    const burstInterval = setInterval(burst, 600)

    const physics = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy + 0.3, vy: p.vy + 0.15, opacity: p.opacity - 0.025 }))
        .filter(p => p.opacity > 0)
      )
    }, 30)

    setTimeout(() => {
      clearInterval(burstInterval)
      clearInterval(physics)
      onDone()
    }, 4000)

    return () => { clearInterval(burstInterval); clearInterval(physics) }
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9998, pointerEvents: 'none',
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x, top: p.y,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: p.opacity,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
        }} />
      ))}
    </div>
  )
}

// Shake effect
function ShakeEffect({ onDone }) {
  useEffect(() => {
    document.body.style.animation = 'screenShake 0.1s ease-in-out infinite'
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes screenShake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10% { transform: translate(-8px, -4px) rotate(-1deg); }
        20% { transform: translate(8px, 4px) rotate(1deg); }
        30% { transform: translate(-6px, 6px) rotate(0deg); }
        40% { transform: translate(6px, -6px) rotate(1deg); }
        50% { transform: translate(-4px, 4px) rotate(-1deg); }
        60% { transform: translate(4px, -4px) rotate(0deg); }
        70% { transform: translate(-8px, 8px) rotate(-1deg); }
        80% { transform: translate(8px, -8px) rotate(1deg); }
        90% { transform: translate(-4px, 4px) rotate(0deg); }
      }
    `
    document.head.appendChild(style)

    setTimeout(() => {
      document.body.style.animation = ''
      document.head.removeChild(style)
      onDone()
    }, 2500)

    return () => {
      document.body.style.animation = ''
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9998, pointerEvents: 'none',
      fontSize: '5rem', animation: 'none',
    }}>
      💥
    </div>
  )
}

export default function ScreenEffect({ effect, onDone }) {
  if (!effect) return null
  if (effect === 'matrix') return <MatrixEffect onDone={onDone} />
  if (effect === 'fireworks') return <FireworksEffect onDone={onDone} />
  if (effect === 'shake') return <ShakeEffect onDone={onDone} />
  return null
}
