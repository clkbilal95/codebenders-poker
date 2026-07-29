import { useState, useRef } from 'react'

const GIFTS = [
  { emoji: '🍵', label: 'Çay', msg: 'sana çay ısmarlıyor!' },
  { emoji: '🥝', label: 'Kivi Oralet', msg: 'sana kivi oralet gönderiyor!' },
  { emoji: '🥤', label: 'Coca Cola', msg: 'sana Coca Cola ısmarlıyor!' },
  { emoji: '🥛', label: 'Ayran', msg: 'sana Özer Hisar ayran gönderiyor!' },
  { emoji: '🧋', label: 'Ice Karamel Latte', msg: 'sana ice karamel latte ısmarlıyor!' },
  { emoji: '🥪', label: 'Tost', msg: 'sana tost ısmarlıyor!' },
  { emoji: '🍓', label: 'Alevli Meyve Tabağı', msg: 'sana alevli meyve tabağı gönderiyor!' },
  { emoji: '🍮', label: 'Baklava', msg: 'sana baklava gönderiyor!' },
  { emoji: '🍔', label: 'Hamburger', msg: 'sana hamburger ısmarlıyor!' },
  { emoji: '🥨', label: 'Ankara Simidi', msg: 'sana Ankara simidi gönderiyor!' },
]

const EFFECTS = [
  { id: 'matrix', emoji: '💊', label: 'Matrix' },
  { id: 'fireworks', emoji: '🎆', label: 'Havai Fişek' },
  { id: 'shake', emoji: '💥', label: 'Ekranı Salla' },
]

export default function PlayerCard({
  player,
  currentPlayerId,
  votesVisible,
  onSendGift,
  onSendEffect,
  isOwner,
}) {
  const [showGiftMenu, setShowGiftMenu] = useState(false)
  const [showEffectMenu, setShowEffectMenu] = useState(false)
  const buttonRef = useRef(null)
  const effectButtonRef = useRef(null)

  const isMe = player.id === currentPlayerId
  const hasVoted = !!player.vote
  const voteValue = player.vote
  const showNumber = votesVisible && hasVoted
  const isSpecial = voteValue === '?' || voteValue === '☕'

  function handleSendGift(gift) {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    onSendGift(gift, player, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    setShowGiftMenu(false)
  }

  function handleSendEffect(effect) {
    onSendEffect(effect, player)
    setShowEffectMenu(false)
  }

  return (
    <div className="relative flex flex-col items-center gap-2" style={{ minWidth: 90 }}>
      {/* Owner crown */}
      {player.is_owner && (
        <div style={{ fontSize: '0.8rem', position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          👑 <span style={{ color: '#F5C842', fontSize: '0.65rem', fontFamily: 'Space Grotesk' }}>Yönetici</span>
        </div>
      )}

      {/* Avatar */}
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: isMe ? 'linear-gradient(135deg, #6C63FF33, #6C63FF55)' : '#1E2438',
          border: isMe ? '2px solid #6C63FF' : player.is_owner ? '2px solid #F5C842' : '2px solid #2A3050',
          boxShadow: isMe ? '0 0 16px rgba(108, 99, 255, 0.3)' : player.is_owner ? '0 0 12px rgba(245, 200, 66, 0.3)' : 'none',
        }}
      >
        {player.avatar}
        {hasVoted && !votesVisible && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: '#3DFFA0', color: '#0D0F1A' }}>✓</div>
        )}
      </div>

      {/* Vote card */}
      <div className="perspective" style={{ width: 48, height: 64 }}>
        <div className={`card-inner ${showNumber ? 'flipped' : ''}`}>
          <div className="card-face flex items-center justify-center rounded-xl"
            style={{
              background: hasVoted ? 'linear-gradient(135deg, #2A3050, #1E2438)' : '#151929',
              border: hasVoted ? '2px solid #6C63FF55' : '2px dashed #2A3050',
            }}>
            {hasVoted ? <span style={{ fontSize: '1.2rem' }}>🂠</span> : <span style={{ color: '#3D4466', fontSize: '1.2rem' }}>…</span>}
          </div>
          <div className="card-face card-back flex items-center justify-center rounded-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
              border: '2px solid #8B85FF',
              color: 'white',
              fontSize: isSpecial ? '1.3rem' : voteValue?.length > 2 ? '0.9rem' : '1.2rem',
              fontFamily: 'Space Grotesk',
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.5)',
            }}>
            {voteValue || '—'}
          </div>
        </div>
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-center" style={{
        color: isMe ? '#8B85FF' : '#7B82A8',
        fontFamily: 'Space Grotesk',
        maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {isMe ? 'Sen' : player.name}
      </span>

      {/* Action buttons - only for others */}
      {!isMe && (
        <div className="flex gap-1">
          {/* Gift button */}
          <div className="relative">
            <button ref={buttonRef} onClick={() => { setShowGiftMenu(v => !v); setShowEffectMenu(false) }}
              className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: '#1E2438', border: '1px solid #2A3050', color: '#7B82A8', cursor: 'pointer' }}
              title="Hediye gönder">
              🎁
            </button>
            {showGiftMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 rounded-xl p-2 z-40"
                style={{
                  transform: 'translateX(-50%)', background: '#1E2438',
                  border: '1px solid #2A3050', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 180,
                }}>
                <p className="text-xs mb-2 px-1" style={{ color: '#7B82A8', fontFamily: 'Space Grotesk' }}>
                  {player.name}&apos;e gönder:
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {GIFTS.map(gift => (
                    <button key={gift.emoji} onClick={() => handleSendGift(gift)}
                      className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: '#0D0F1A', cursor: 'pointer' }} title={gift.label}>
                      {gift.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Effect button */}
          <div className="relative">
            <button ref={effectButtonRef} onClick={() => { setShowEffectMenu(v => !v); setShowGiftMenu(false) }}
              className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: '#1E2438', border: '1px solid #2A3050', color: '#7B82A8', cursor: 'pointer' }}
              title="Efekt gönder">
              ✨
            </button>
            {showEffectMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 rounded-xl p-2 z-40"
                style={{
                  transform: 'translateX(-50%)', background: '#1E2438',
                  border: '1px solid #6C63FF55', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160,
                }}>
                <p className="text-xs mb-2 px-1" style={{ color: '#7B82A8', fontFamily: 'Space Grotesk' }}>
                  Efekt gönder:
                </p>
                <div className="flex flex-col gap-1">
                  {EFFECTS.map(eff => (
                    <button key={eff.id} onClick={() => handleSendEffect(eff)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:scale-105"
                      style={{ background: '#0D0F1A', cursor: 'pointer', color: '#E8EAFF', fontFamily: 'Space Grotesk' }}>
                      <span>{eff.emoji}</span>
                      <span>{eff.label}</span>
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
