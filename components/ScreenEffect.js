import { useEffect, useState, useRef } from 'react'

// ─── MATRIX ───────────────────────────────────────────────────────────────────
function MatrixEffect({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const fontSize = 18
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array(cols).fill(1)

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00FF41'
      ctx.font = `${fontSize}px monospace`
      drops.forEach((y, i) => {
        const char = String.fromCharCode(0x30A0 + Math.random() * 96)
        ctx.fillStyle = y * fontSize < 60 ? '#AFFFAF' : '#00FF41'
        ctx.fillText(char, i * fontSize, y * fontSize)
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }

    const interval = setInterval(draw, 40)
    setTimeout(() => { clearInterval(interval); onDone() }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#00FF41', fontFamily: 'monospace', fontSize: '2.5rem',
        fontWeight: 'bold', textShadow: '0 0 30px #00FF41, 0 0 60px #00FF41',
        animation: 'matrixPulse 0.6s ease-in-out infinite alternate',
        whiteSpace: 'nowrap',
      }}>WAKE UP, NEO... 🐰</div>
      <style>{`@keyframes matrixPulse { from{opacity:.6;transform:translate(-50%,-50%) scale(1)} to{opacity:1;transform:translate(-50%,-50%) scale(1.06)} }`}</style>
    </div>
  )
}

// ─── FIREWORKS ────────────────────────────────────────────────────────────────
function FireworksEffect({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#FF6B9D','#6C63FF','#F5C842','#3DFFA0','#FF4444','#44AAFF','#FF9F43','#FF6348','#FFFFFF','#FFC312']
    let particles = []

    function burst(cx, cy) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const count = 80 + Math.floor(Math.random() * 60) // more particles
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = 4 + Math.random() * 10
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 3 + Math.random() * 6,
          trail: [],
        })
      }
    }

    // Initial big burst in center
    burst(canvas.width / 2, canvas.height / 3)
    setTimeout(() => burst(canvas.width * 0.25, canvas.height * 0.4), 300)
    setTimeout(() => burst(canvas.width * 0.75, canvas.height * 0.4), 500)

    const burstInterval = setInterval(() => {
      const cx = 100 + Math.random() * (canvas.width - 200)
      const cy = 80 + Math.random() * (canvas.height * 0.6)
      burst(cx, cy)
    }, 500)

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.shadowBlur = 20
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0

        p.x += p.vx
        p.y += p.vy + 0.2
        p.vy += 0.18
        p.vx *= 0.98
        p.alpha -= 0.018
        p.size *= 0.995
      })

      particles = particles.filter(p => p.alpha > 0)
    }

    const animFrame = { id: null }
    function loop() { draw(); animFrame.id = requestAnimationFrame(loop) }
    loop()

    // Big text
    setTimeout(() => { clearInterval(burstInterval); cancelAnimationFrame(animFrame.id); onDone() }, 4500)
    return () => { clearInterval(burstInterval); cancelAnimationFrame(animFrame.id) }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ─── SHAKE ────────────────────────────────────────────────────────────────────
function ShakeEffect({ onDone }) {
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes hardShake {
        0%,100%{transform:translate(0,0) rotate(0deg)}
        10%{transform:translate(-12px,-6px) rotate(-2deg)}
        20%{transform:translate(12px,6px) rotate(2deg)}
        30%{transform:translate(-10px,10px) rotate(0deg)}
        40%{transform:translate(10px,-10px) rotate(2deg)}
        50%{transform:translate(-8px,8px) rotate(-2deg)}
        60%{transform:translate(8px,-8px) rotate(0deg)}
        70%{transform:translate(-14px,14px) rotate(-2deg)}
        80%{transform:translate(14px,-14px) rotate(2deg)}
        90%{transform:translate(-6px,6px) rotate(0deg)}
      }
      body { animation: hardShake 0.12s ease-in-out infinite !important; }
    `
    document.head.appendChild(style)
    setTimeout(() => { document.head.removeChild(style); onDone() }, 2500)
    return () => { try { document.head.removeChild(style) } catch(e){} }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '8rem', animation: 'none' }}>💥</div>
    </div>
  )
}

// ─── MONEY RAIN ───────────────────────────────────────────────────────────────
function MoneyRainEffect({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const SYMBOLS = ['💵','💵','💵','💵','💵']
    const bills = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -80 - Math.random() * canvas.height,
      size: 28 + Math.random() * 36,
      speed: 3 + Math.random() * 6,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.05,
      symbol: '💵',
      rotation: (Math.random() - 0.5) * 0.5,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      bills.forEach(b => {
        b.y += b.speed
        b.wobble += b.wobbleSpeed
        b.x += Math.sin(b.wobble) * 2.5
        if (b.y > canvas.height + 80) {
          b.y = -80
          b.x = Math.random() * canvas.width
        }
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.rotation + Math.sin(b.wobble) * 0.2)
        ctx.font = `${b.size}px serif`
        ctx.textAlign = 'center'
        ctx.shadowBlur = 12
        ctx.shadowColor = '#F5C842'
        ctx.fillText(b.symbol, 0, 0)
        ctx.restore()
      })
    }

    const animFrame = { id: null }
    function loop() { draw(); animFrame.id = requestAnimationFrame(loop) }
    loop()

    setTimeout(() => { cancelAnimationFrame(animFrame.id); onDone() }, 4000)
    return () => cancelAnimationFrame(animFrame.id)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

// ─── SLEEP MODE ───────────────────────────────────────────────────────────────
function SleepEffect({ onDone }) {
  const [zeds, setZeds] = useState([])

  useEffect(() => {
    let count = 0
    const interval = setInterval(() => {
      count++
      setZeds(prev => [...prev, {
        id: count,
        x: 30 + Math.random() * 60, // % from left
        size: 1.5 + Math.random() * 3,
        duration: 2.5 + Math.random() * 1.5,
        delay: Math.random() * 0.5,
        char: count % 5 === 0 ? '😴' : count % 3 === 0 ? 'z' : 'Z',
      }])
      if (count > 20) clearInterval(interval)
    }, 200)

    setTimeout(() => { clearInterval(interval); onDone() }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', background: 'rgba(5,8,30,0.82)' }}>
      {/* Stars dimming */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(20,20,60,0.7) 0%, rgba(5,8,30,0.95) 100%)',
      }} />

      {/* Floating Zs */}
      {zeds.map(z => (
        <div key={z.id} style={{
          position: 'absolute',
          bottom: '35%',
          left: `${z.x}%`,
          fontSize: `${z.size}rem`,
          fontWeight: 900,
          fontFamily: 'Space Grotesk, sans-serif',
          color: z.char === '😴' ? 'white' : `hsl(${220 + Math.random()*40}, 80%, ${60 + Math.random()*20}%)`,
          textShadow: '0 0 20px rgba(100,120,255,0.8)',
          animation: `sleepFloat ${z.duration}s ease-out ${z.delay}s forwards`,
          opacity: 0,
        }}>{z.char}</div>
      ))}

      {/* Big sleeping emoji center */}
      <div style={{
        position: 'absolute', top: '42%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '8rem', lineHeight: 1,
        animation: 'sleepBob 2s ease-in-out infinite',
      }}>😴</div>

      <style>{`
        @keyframes sleepFloat {
          0%   { opacity:0; transform: translateY(0) scale(0.5); }
          15%  { opacity:1; }
          100% { opacity:0; transform: translateY(-280px) scale(1.3) rotate(15deg); }
        }
        @keyframes sleepBob {
          0%,100% { transform: rotate(-5deg) scale(1); }
          50%     { transform: rotate(5deg) scale(1.08); }
        }
      `}</style>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function ScreenEffect({ effect, onDone }) {
  if (!effect) return null
  if (effect === 'matrix')    return <MatrixEffect    onDone={onDone} />
  if (effect === 'fireworks') return <FireworksEffect onDone={onDone} />
  if (effect === 'shake')     return <ShakeEffect     onDone={onDone} />
  if (effect === 'money')     return <MoneyRainEffect onDone={onDone} />
  if (effect === 'sleep')     return <SleepEffect     onDone={onDone} />
  return null
}
