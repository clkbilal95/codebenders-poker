import { useState, useRef, useEffect } from 'react'

const GIFTS = [
  { img: '/gifts/cay.jpg',          label: 'Çay',              msg: 'sana çay ısmarlıyor!' },
  { img: '/gifts/oralet.jpg',       label: 'Oralet',           msg: 'sana oralet gönderiyor!' },
  { img: '/gifts/cocacola.jpg',     label: 'Coca Cola',        msg: 'sana Coca Cola ısmarlıyor!' },
  { img: '/gifts/ayran.jpg',        label: 'Ayran',            msg: 'sana Özer Hisar ayran gönderiyor!' },
  { img: '/gifts/latte.jpg',        label: 'Ice Latte',        msg: 'sana ice karamel latte ısmarlıyor!' },
  { img: '/gifts/filtrekahve.jpg',  label: 'Filtre Kahve',     msg: 'sana filtre kahve ısmarlıyor!' },
  { img: '/gifts/tost.jpg',         label: 'Tost',             msg: 'sana tost ısmarlıyor!' },
  { img: '/gifts/pizza.jpg',        label: 'Pizza',            msg: 'sana pizza ısmarlıyor!' },
  { img: '/gifts/zurna.jpg',           label: 'Zurna Dürüm',       msg: 'sana zurna dürüm ısmarlıyor!' },
  { img: '/gifts/baklava.jpg',         label: 'Baklava',            msg: 'sana baklava gönderiyor!' },
  { img: '/gifts/hamburger.jpg',       label: 'Hamburger',          msg: 'sana hamburger ısmarlıyor!' },
  { img: '/gifts/simit.jpg',           label: 'Ankara Simidi',      msg: 'sana Ankara simidi gönderiyor!' },
  { img: '/gifts/beypazarikurusu.jpg', label: 'Beypazarı Kurusu',   msg: 'sana Beypazarı kurusu gönderiyor!' },
  { img: '/gifts/beypazarisoda.jpg',   label: 'Beypazarı Sodası',   msg: 'sana Beypazarı sodası ısmarlıyor!' },
]

const EFFECTS = [
  { id: 'matrix',    emoji: '💊', label: 'Matrix' },
  { id: 'fireworks', emoji: '🎆', label: 'Havai Fişek' },
  { id: 'shake',     emoji: '💥', label: 'Ekranı Salla' },
  { id: 'money',     emoji: '💵', label: 'Para Yağmuru' },
  { id: 'sleep',     emoji: '😴', label: 'Uyku Modu' },
]


export default function PlayerCard({ player, currentPlayerId, votesVisible, onSendGift, onSendEffect, lastGift, isOwner, onKick }) {
  const [showGiftMenu,   setShowGiftMenu]   = useState(false)
  const [showEffectMenu, setShowEffectMenu] = useState(false)
  const buttonRef     = useRef(null)
  const giftMenuRef   = useRef(null)
  const effectMenuRef = useRef(null)

  const isMe        = player.id === currentPlayerId
  const hasVoted    = !!player.vote
  const voteValue   = player.vote
  const showNumber  = votesVisible && hasVoted
  const isSpecial   = voteValue === '?' || voteValue === '☕'
  const displayName = isMe ? 'Sen' : player.name

  useEffect(() => {
    if (!showGiftMenu && !showEffectMenu) return
    function handleClick(e) {
      const inGift   = giftMenuRef.current?.contains(e.target)
      const inEffect = effectMenuRef.current?.contains(e.target)
      if (!inGift && !inEffect) { setShowGiftMenu(false); setShowEffectMenu(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showGiftMenu, showEffectMenu])

  function handleSendGift(gift) {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    onSendGift(gift, player, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setShowGiftMenu(false)
  }

  function handleSendEffect(effect) {
    onSendEffect(effect, player)
    setShowEffectMenu(false)
  }

  return (
    <div className="relative flex flex-col items-center" style={{ width: 100 }}>
      {/* Owner crown */}
      {player.is_owner && (
        <div className="absolute -top-5 left-1/2 flex items-center gap-1"
          style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.75rem' }}>👑</span>
          <span style={{ color: '#F5C842', fontSize: '0.6rem', fontFamily: 'Space Grotesk', fontWeight: 600 }}>YÖNETİCİ</span>
        </div>
      )}

      {/* Kick button — only owner sees, only for non-owner players */}
      {isOwner && !isMe && !player.is_owner && (
        <button
          onClick={() => onKick(player)}
          title={`${player.name}'ı odadan çıkar`}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
          style={{ background: '#FF4444', border: '2px solid #0D0F1A', cursor: 'pointer', fontSize: '0.6rem', color: 'white', fontWeight: 'bold', lineHeight: 1 }}>
          ✕
        </button>
      )}

      {/* Avatar — photo or emoji */}
      <div className="relative flex items-center justify-center rounded-2xl overflow-hidden"
        style={{
          width: 56, height: 56,
          background: isMe ? 'linear-gradient(135deg,#6C63FF44,#6C63FF77)'
            : player.is_owner ? 'linear-gradient(135deg,#F5C84222,#F5C84244)' : '#1E2438',
          border: isMe ? '2.5px solid #6C63FF'
            : player.is_owner ? '2.5px solid #F5C842' : '2px solid #2A3050',
          boxShadow: isMe ? '0 0 18px rgba(108,99,255,0.4)'
            : player.is_owner ? '0 0 14px rgba(245,200,66,0.35)' : 'none',
        }}>
        {player.avatar && player.avatar.startsWith('data:')
          ? <img src={player.avatar} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{player.avatar}</span>
        }
        {hasVoted && !votesVisible && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#3DFFA0', color: '#0D0F1A', fontSize: '0.65rem', fontWeight: 'bold', zIndex: 2 }}>✓</div>
        )}
      </div>

      {/* Last gift badge */}
      {lastGift && (
        <div style={{
          position: 'absolute', top: -6, right: 4,
          width: 22, height: 22, borderRadius: 8, overflow: 'hidden',
          border: '2px solid #0D0F1A', zIndex: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <img src={lastGift} alt="gift" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Name */}
      <div className="mt-2 text-center w-full px-1">
        <p className="font-semibold leading-tight"
          style={{ fontFamily: 'Space Grotesk', fontSize: '0.78rem', color: isMe ? '#8B85FF' : '#E8EAFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </p>
      </div>

      {/* Vote card */}
      <div className="perspective mt-1" style={{ width: 44, height: 58 }}>
        <div className={`card-inner ${showNumber ? 'flipped' : ''}`}>
          <div className="card-face flex items-center justify-center rounded-xl"
            style={{ background: hasVoted ? 'linear-gradient(135deg,#2A3050,#1E2438)' : '#151929', border: hasVoted ? '2px solid #6C63FF55' : '2px dashed #2A3050' }}>
            {hasVoted ? <span style={{ fontSize: '1.1rem' }}>🂠</span> : <span style={{ color: '#3D4466', fontSize: '1rem' }}>…</span>}
          </div>
          <div className="card-face card-back flex items-center justify-center rounded-xl font-bold"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#8B85FF)', border: '2px solid #8B85FF', color: 'white', fontSize: isSpecial ? '1.2rem' : voteValue?.length > 2 ? '0.8rem' : '1.1rem', fontFamily: 'Space Grotesk', boxShadow: '0 0 16px rgba(108,99,255,0.5)' }}>
            {voteValue || '—'}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (
        <div className="flex gap-1 mt-2">
          <div className="relative" ref={giftMenuRef}>
            <button ref={buttonRef}
              onClick={() => { setShowGiftMenu(v => !v); setShowEffectMenu(false) }}
              className="flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{ width: 28, height: 24, background: '#1E2438', border: '1px solid #2A3050', cursor: 'pointer', fontSize: '0.75rem' }}
              title="Hediye gönder">🎁</button>
            {showGiftMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 rounded-xl p-3 z-40"
                style={{ transform: 'translateX(-50%)', background: '#1E2438', border: '1px solid #2A3050', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', minWidth: 228 }}>
                <p className="text-xs mb-3 px-1" style={{ color: '#7B82A8', fontFamily: 'Space Grotesk' }}>{player.name}&apos;ya gönder:</p>
                <div className="grid grid-cols-4 gap-2">
                  {GIFTS.map(gift => (
                    <button key={gift.label} onClick={() => handleSendGift(gift)}
                      className="flex flex-col items-center gap-1 rounded-xl p-1 transition-all hover:scale-105 hover:bg-indigo-900"
                      style={{ background: '#0D0F1A', cursor: 'pointer', border: 'none' }} title={gift.label}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={gift.img} alt={gift.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <span style={{ fontSize: '0.52rem', color: '#A0A8CC', fontFamily: 'Space Grotesk', textAlign: 'center', lineHeight: 1.2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gift.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={effectMenuRef}>
            <button onClick={() => { setShowEffectMenu(v => !v); setShowGiftMenu(false) }}
              className="flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{ width: 28, height: 24, background: '#1E2438', border: '1px solid #2A3050', cursor: 'pointer', fontSize: '0.75rem' }}
              title="Efekt gönder">✨</button>
            {showEffectMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 rounded-xl p-2 z-40"
                style={{ transform: 'translateX(-50%)', background: '#1E2438', border: '1px solid #6C63FF55', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', minWidth: 160 }}>
                <p className="text-xs mb-2 px-1" style={{ color: '#7B82A8', fontFamily: 'Space Grotesk' }}>Efekt gönder:</p>
                <div className="flex flex-col gap-1">
                  {EFFECTS.map(eff => (
                    <button key={eff.id} onClick={() => handleSendEffect(eff)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 hover:bg-indigo-900"
                      style={{ background: '#0D0F1A', cursor: 'pointer', color: '#E8EAFF', fontFamily: 'Space Grotesk' }}>
                      <span>{eff.emoji}</span><span>{eff.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
