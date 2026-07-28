import { useState, useRef } from 'react'

const FIBONACCI = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']

const GIFTS = [
  { emoji: '🍕', label: 'Pizza', msg: 'sana pizza ısmarlıyor!' },
  { emoji: '☕', label: 'Kahve', msg: 'sana kahve ısmarlıyor!' },
  { emoji: '🍺', label: 'Bira', msg: 'sana bira ısmarlıyor!' },
  { emoji: '🍩', label: 'Donut', msg: 'sana donut gönderiyor!' },
  { emoji: '🎯', label: 'Dart', msg: 'sana dart atıyor!' },
  { emoji: '💜', label: 'Sevgi', msg: 'sana sevgi gönderiyor!' },
  { emoji: '🔥', label: 'Ateş', msg: 'sana ateş gönderiyor!' },
  { emoji: '🧃', label: 'Meyve suyu', msg: 'sana meyve suyu ısmarlıyor!' },
]

export default function PlayerCard({
  player,
  currentPlayerId,
  votesVisible,
  onSendGift,
  myRef,
}) {
  const [showGiftMenu, setShowGiftMenu] = useState(false)
  const buttonRef = useRef(null)

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

  return (
    <div
      ref={isMe ? myRef : null}
      className="relative flex flex-col items-center gap-2"
      style={{ minWidth: 90 }}
    >
      {/* Avatar */}
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: isMe
            ? 'linear-gradient(135deg, #6C63FF33, #6C63FF55)'
            : '#1E2438',
          border: isMe ? '2px solid #6C63FF' : '2px solid #2A3050',
          boxShadow: isMe ? '0 0 16px rgba(108, 99, 255, 0.3)' : 'none',
        }}
      >
        {player.avatar}
        {hasVoted && !votesVisible && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: '#3DFFA0', color: '#0D0F1A' }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Vote card */}
      <div
        className="perspective"
        style={{ width: 48, height: 64 }}
      >
        <div className={`card-inner ${showNumber ? 'flipped' : ''}`}>
          {/* Front - hidden */}
          <div
            className="card-face flex items-center justify-center rounded-xl"
            style={{
              background: hasVoted ? 'linear-gradient(135deg, #2A3050, #1E2438)' : '#151929',
              border: hasVoted ? '2px solid #6C63FF55' : '2px dashed #2A3050',
            }}
          >
            {hasVoted ? (
              <span style={{ fontSize: '1.2rem' }}>🂠</span>
            ) : (
              <span style={{ color: '#3D4466', fontSize: '1.2rem' }}>…</span>
            )}
          </div>
          {/* Back - revealed */}
          <div
            className="card-face card-back flex items-center justify-center rounded-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
              border: '2px solid #8B85FF',
              color: 'white',
              fontSize: isSpecial ? '1.3rem' : voteValue?.length > 2 ? '0.9rem' : '1.2rem',
              fontFamily: 'Space Grotesk',
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.5)',
            }}
          >
            {voteValue || '—'}
          </div>
        </div>
      </div>

      {/* Name */}
      <span
        className="text-xs font-medium text-center"
        style={{
          color: isMe ? '#8B85FF' : '#7B82A8',
          fontFamily: 'Space Grotesk',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isMe ? 'Sen' : player.name}
      </span>

      {/* Gift button - only show for others */}
      {!isMe && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setShowGiftMenu(v => !v)}
            className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
            style={{
              background: '#1E2438',
              border: '1px solid #2A3050',
              color: '#7B82A8',
              fontFamily: 'Space Grotesk',
              cursor: 'pointer',
            }}
            title="Hediye gönder"
          >
            🎁
          </button>

          {showGiftMenu && (
            <div
              className="absolute bottom-full mb-2 left-1/2 rounded-xl p-2 z-40"
              style={{
                transform: 'translateX(-50%)',
                background: '#1E2438',
                border: '1px solid #2A3050',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                minWidth: 160,
              }}
            >
              <p className="text-xs mb-2 px-1" style={{ color: '#7B82A8', fontFamily: 'Space Grotesk' }}>
                {player.name}&apos;e gönder:
              </p>
              <div className="grid grid-cols-4 gap-1">
                {GIFTS.map(gift => (
                  <button
                    key={gift.emoji}
                    onClick={() => handleSendGift(gift)}
                    className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: '#0D0F1A', cursor: 'pointer' }}
                    title={gift.label}
                  >
                    {gift.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
