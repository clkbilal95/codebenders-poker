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
function FireworksEffect({ onDone, consensusVote }) {
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
      {consensusVote && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
          animation: 'consensusPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <div style={{
            background: 'rgba(13,15,26,0.82)',
            border: '2px solid #6C63FF',
            borderRadius: 24,
            padding: '20px 36px',
            boxShadow: '0 0 60px rgba(108,99,255,0.5), 0 0 120px rgba(108,99,255,0.2)',
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 4 }}>🎉</div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#A0A8CC',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>Oy Birliği</div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: '3.2rem',
              color: '#FFFFFF',
              lineHeight: 1,
              textShadow: '0 0 30px rgba(108,99,255,0.9)',
            }}>{consensusVote}</div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 500,
              fontSize: '1rem',
              color: '#8B85FF',
              marginTop: 6,
            }}>Herkes aynı puanı verdi!</div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes consensusPop {
          from { opacity:0; transform: translate(-50%,-50%) scale(0.6); }
          to   { opacity:1; transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
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

// ─── DISCO PARTY ──────────────────────────────────────────────────────────────
function DiscoEffect({ onDone }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let time = 0
    const beams = Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      hue: (i / 24) * 360,
      speed: 0.4 + Math.random() * 0.6,
      width: 2 + Math.random() * 3,
    }))

    const particles = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 4,
      hue: Math.random() * 360,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      alpha: Math.random(),
    }))

    const cx = canvas.width / 2
    const ballY = canvas.height * 0.18
    const ballR = Math.min(canvas.width, canvas.height) * 0.09

    function drawDiscoBall() {
      // Ball glow
      const glow = ctx.createRadialGradient(cx, ballY, 0, cx, ballY, ballR * 2.5)
      glow.addColorStop(0, `hsla(${time * 60 % 360},100%,70%,0.25)`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, ballY, ballR * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Ball body
      const ballGrad = ctx.createRadialGradient(cx - ballR * 0.3, ballY - ballR * 0.3, ballR * 0.05, cx, ballY, ballR)
      ballGrad.addColorStop(0, '#ffffff')
      ballGrad.addColorStop(0.4, '#cccccc')
      ballGrad.addColorStop(1, '#555555')
      ctx.beginPath()
      ctx.arc(cx, ballY, ballR, 0, Math.PI * 2)
      ctx.fillStyle = ballGrad
      ctx.fill()

      // Mirror tiles
      const tileRows = 8, tileCols = 12
      for (let row = 0; row < tileRows; row++) {
        for (let col = 0; col < tileCols; col++) {
          const phi = (row / tileRows) * Math.PI
          const theta = (col / tileCols) * Math.PI * 2 + time
          const tx = cx + ballR * 0.95 * Math.sin(phi) * Math.cos(theta)
          const ty = ballY + ballR * 0.95 * Math.cos(phi)
          const tr = (ballR / tileRows) * 0.7
          const brightness = 0.4 + 0.6 * Math.abs(Math.sin(theta + time * 2))
          const hue = (col * 30 + time * 120) % 360
          ctx.beginPath()
          ctx.arc(tx, ty, tr, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 100%, ${40 + brightness * 50}%, ${0.7 + brightness * 0.3})`
          ctx.fill()
        }
      }

      // String holding ball
      ctx.strokeStyle = 'rgba(200,200,200,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, 0)
      ctx.lineTo(cx, ballY - ballR)
      ctx.stroke()
    }

    function drawBeams() {
      beams.forEach(b => {
        b.angle += b.speed * 0.015
        const endX = cx + Math.cos(b.angle) * canvas.width
        const endY = ballY + Math.sin(b.angle) * canvas.height

        const grad = ctx.createLinearGradient(cx, ballY, endX, endY)
        grad.addColorStop(0, `hsla(${b.hue}, 100%, 70%, 0.7)`)
        grad.addColorStop(1, `hsla(${b.hue}, 100%, 70%, 0)`)

        ctx.beginPath()
        ctx.moveTo(cx, ballY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = grad
        ctx.lineWidth = b.width
        ctx.stroke()
        b.hue = (b.hue + 0.5) % 360
      })
    }

    function drawParticles() {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        p.alpha = Math.abs(Math.sin(time * 2 + p.x * 0.01))
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        p.hue = (p.hue + 1) % 360
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`
        ctx.fill()
        ctx.shadowBlur = 0
      })
    }

    const animFrame = { id: null }
    function loop() {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      time += 0.016
      drawBeams()
      drawParticles()
      drawDiscoBall()
      animFrame.id = requestAnimationFrame(loop)
    }
    loop()

    setTimeout(() => { cancelAnimationFrame(animFrame.id); onDone() }, 5000)
    return () => cancelAnimationFrame(animFrame.id)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '1.4rem', fontWeight: 800,
        fontFamily: 'Space Grotesk, sans-serif',
        color: '#fff', letterSpacing: '0.15em',
        textTransform: 'uppercase',
        textShadow: '0 0 20px #ff6bd6, 0 0 40px #6c63ff',
        animation: 'discoText 0.4s ease-in-out infinite alternate',
        whiteSpace: 'nowrap',
      }}>🪩 PARTİ MODU 🪩</div>
      <style>{`@keyframes discoText { from{opacity:.7;transform:translateX(-50%) scale(1)} to{opacity:1;transform:translateX(-50%) scale(1.05)} }`}</style>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
// effect can be a string ('matrix', 'fireworks', ...) or an object { type: 'fireworks', vote: '8' }
export default function ScreenEffect({ effect, onDone }) {
  if (!effect) return null
  const effectType = typeof effect === 'object' ? effect.type : effect
  const consensusVote = typeof effect === 'object' ? effect.vote : null

  if (effectType === 'matrix')    return <MatrixEffect    onDone={onDone} />
  if (effectType === 'fireworks') return <FireworksEffect onDone={onDone} consensusVote={consensusVote} />
  if (effectType === 'shake')     return <ShakeEffect     onDone={onDone} />
  if (effectType === 'money')     return <MoneyRainEffect onDone={onDone} />
  if (effectType === 'sleep')     return <SleepEffect     onDone={onDone} />
  if (effectType === 'disco')     return <DiscoEffect     onDone={onDone} />
  return null
}
