import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import StarField from '../../components/StarField'
import PokerCard from '../../components/PokerCard'
import PlayerCard from '../../components/PlayerCard'
import VoteResults from '../../components/VoteResults'
import FlyingGift from '../../components/FlyingGift'
import Toast from '../../components/Toast'
import ScreenEffect from '../../components/ScreenEffect'
import { v4 as uuidv4 } from 'uuid'

const FIBONACCI = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']

const AVATARS = [
  '🧙‍♂️', '🥷', '🦸‍♀️', '🧛', '🧜‍♂️', '🧝‍♀️',
  '👨‍🚀', '👩‍🔬', '🧑‍💻', '👨‍🎨', '🦊', '🐼',
  '🦁', '🐯', '🦄', '🐉', '🤖', '👾',
  '🎭', '🃏', '🎯', '🚀', '⚡', '🌙'
]

export default function RoomPage() {
  const router = useRouter()
  const { roomId } = router.query

  const [phase, setPhase] = useState('join')
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('playerId')
      if (stored) return stored
      const newId = uuidv4()
      sessionStorage.setItem('playerId', newId)
      return newId
    }
    return uuidv4()
  })

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [myVote, setMyVote] = useState(null)
  const [story, setStory] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [activeEffect, setActiveEffect] = useState(null)

  const [flyingGifts, setFlyingGifts] = useState([])
  const [toasts, setToasts] = useState([])
  const playerRefs = useRef({})

  const addToast = useCallback((msg, emoji = '🎁', type = 'gift') => {
    const id = uuidv4()
    setToasts(prev => [...prev.slice(-3), { id, message: msg, emoji, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  // Theme colors
  const theme = darkMode ? {
    bg: '#0D0F1A', surface: '#151929', card: '#1E2438',
    border: '#2A3050', text: '#E8EAFF', muted: '#7B82A8',
    accent: '#6C63FF', accentLight: '#8B85FF',
  } : {
    bg: '#F0F2FF', surface: '#FFFFFF', card: '#F8F9FF',
    border: '#DDE1FF', text: '#1A1D35', muted: '#6B7280',
    accent: '#6C63FF', accentLight: '#8B85FF',
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomId) return

    // Check if this player is owner
    const { data: roomData } = await supabase.from('rooms').select('owner_id').eq('id', roomId).single()
    const amOwner = roomData?.owner_id === playerId
    setIsOwner(amOwner)

    const { error } = await supabase.from('players').upsert({
      id: playerId,
      room_id: roomId,
      name: playerName.trim(),
      avatar: selectedAvatar,
      vote: null,
      online: true,
      is_owner: amOwner,
    })
    if (!error) setPhase('game')
  }

  useEffect(() => {
    if (phase !== 'game' || !roomId) return
    const handleLeave = () => supabase.from('players').update({ online: false }).eq('id', playerId)
    window.addEventListener('beforeunload', handleLeave)
    return () => { window.removeEventListener('beforeunload', handleLeave); handleLeave() }
  }, [phase, roomId, playerId])

  useEffect(() => {
    if (!roomId || phase !== 'game') return

    async function fetchAll() {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      if (roomData) {
        setRoom(roomData)
        setStory(roomData.current_story || '')
        setIsOwner(roomData.owner_id === playerId)
      }
      const { data: playersData } = await supabase.from('players').select('*').eq('room_id', roomId).eq('online', true)
      if (playersData) setPlayers(playersData)
    }
    fetchAll()

    const roomSub = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => {
        if (payload.new) {
          setRoom(payload.new)
          setStory(payload.new.current_story || '')
          if (payload.new.votes_visible === false && payload.old?.votes_visible === true) setMyVote(null)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setPlayers(prev => {
            if (!payload.new.online) return prev.filter(p => p.id !== payload.new.id)
            const existing = prev.find(p => p.id === payload.new.id)
            if (existing) return prev.map(p => p.id === payload.new.id ? payload.new : p)
            return [...prev, payload.new]
          })
          if (payload.eventType === 'INSERT' && payload.new.id !== playerId) {
            addToast(`${payload.new.avatar} ${payload.new.name} odaya katıldı!`, '👋', 'info')
          }
        }
        if (payload.eventType === 'DELETE') setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    const giftSub = supabase.channel(`gifts-${roomId}`)
      .on('broadcast', { event: 'gift' }, ({ payload }) => {
        if (payload.toId === playerId) {
          addToast(`${payload.fromAvatar} ${payload.fromName} ${payload.giftMsg}`, payload.giftEmoji, 'gift')
        } else if (payload.fromId !== playerId) {
          addToast(`${payload.fromName} → ${payload.toName}: ${payload.giftEmoji}`, payload.giftEmoji, 'gift')
        }
      })
      .on('broadcast', { event: 'effect' }, ({ payload }) => {
        if (payload.toId === playerId) {
          setActiveEffect(payload.effectId)
          addToast(`${payload.fromAvatar} ${payload.fromName} sana ${payload.effectLabel} efekti gönderdi!`, payload.effectEmoji, 'gift')
        } else if (payload.fromId !== playerId) {
          addToast(`${payload.fromName} → ${payload.toName}: ${payload.effectEmoji} ${payload.effectLabel}`, payload.effectEmoji, 'info')
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(roomSub); supabase.removeChannel(giftSub) }
  }, [roomId, phase, playerId, addToast])

  async function vote(value) {
    setMyVote(value)
    await supabase.from('players').update({ vote: value }).eq('id', playerId)
  }

  async function revealVotes() {
    await supabase.from('rooms').update({ votes_visible: true }).eq('id', roomId)
    addToast('Kartlar açıldı!', '🎴', 'reveal')
  }

  async function resetVotes() {
    await supabase.from('rooms').update({ votes_visible: false }).eq('id', roomId)
    await supabase.from('players').update({ vote: null }).eq('room_id', roomId)
    setMyVote(null)
  }

  async function updateStory(val) {
    setStory(val)
    await supabase.from('rooms').update({ current_story: val }).eq('id', roomId)
  }

  function handleSendGift(gift, toPlayer, fromPos) {
    const targetEl = playerRefs.current[toPlayer.id]
    const targetRect = targetEl?.getBoundingClientRect()
    const toPos = targetRect
      ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
      : { x: window.innerWidth / 2, y: 100 }

    const giftId = uuidv4()
    setFlyingGifts(prev => [...prev, { id: giftId, emoji: gift.emoji, fromPos, toPos }])

    supabase.channel(`gifts-${roomId}`).send({
      type: 'broadcast', event: 'gift',
      payload: {
        fromId: playerId,
        fromName: playerName,
        fromAvatar: players.find(p => p.id === playerId)?.avatar || '🎁',
        toId: toPlayer.id, toName: toPlayer.name,
        giftEmoji: gift.emoji, giftMsg: gift.msg,
      }
    })
    addToast(`${gift.emoji} ${toPlayer.name}'e gönderildi!`, gift.emoji, 'gift')
  }

  function handleSendEffect(effect, toPlayer) {
    supabase.channel(`gifts-${roomId}`).send({
      type: 'broadcast', event: 'effect',
      payload: {
        fromId: playerId,
        fromName: playerName,
        fromAvatar: players.find(p => p.id === playerId)?.avatar || '✨',
        toId: toPlayer.id, toName: toPlayer.name,
        effectId: effect.id, effectLabel: effect.label, effectEmoji: effect.emoji,
      }
    })
    addToast(`${effect.emoji} ${toPlayer.name}'e ${effect.label} gönderildi!`, effect.emoji, 'gift')
  }

  const allVoted = players.length > 0 && players.every(p => !!p.vote)
  const votesVisible = room?.votes_visible || false

  // ─── JOIN SCREEN ───
  if (phase === 'join') {
    return (
      <>
        <Head><title>Codebenders Poker – Katıl</title></Head>
        <div style={{ background: theme.bg, minHeight: '100vh' }}>
          <StarField />
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="text-5xl mb-3 animate-float">🃏</div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: theme.accent }}>
                  Odaya Katıl
                </h1>
                <p className="text-sm mt-1" style={{ color: theme.muted }}>
                  Oda: <span style={{ color: theme.accentLight, letterSpacing: 2 }}>{roomId}</span>
                </p>
              </div>

              <div className="rounded-2xl p-6 border" style={{ background: theme.surface, borderColor: theme.border }}>
                <p className="text-sm font-medium mb-3" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>
                  Avatarını seç
                </p>
                <div className="grid grid-cols-8 gap-2 mb-5">
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setSelectedAvatar(av)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: selectedAvatar === av ? 'linear-gradient(135deg, #6C63FF, #8B85FF)' : theme.card,
                        border: selectedAvatar === av ? '2px solid #8B85FF' : `2px solid ${theme.border}`,
                        cursor: 'pointer',
                        transform: selectedAvatar === av ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: selectedAvatar === av ? '0 0 12px rgba(108, 99, 255, 0.5)' : 'none',
                      }}>
                      {av}
                    </button>
                  ))}
                </div>

                <p className="text-sm font-medium mb-2" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>Adın</p>
                <input type="text" placeholder="Adını gir..." value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()}
                  className="w-full px-4 py-3 rounded-xl mb-4 outline-none border focus:border-indigo-500 transition-colors text-sm"
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: 'Space Grotesk' }}
                  maxLength={20} autoFocus />

                {playerName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: theme.bg }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'linear-gradient(135deg, #6C63FF33, #6C63FF55)', border: '2px solid #6C63FF' }}>
                      {selectedAvatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>{playerName}</p>
                      <p className="text-xs" style={{ color: theme.muted }}>Codebenders üyesi</p>
                    </div>
                  </div>
                )}

                <button onClick={joinRoom} disabled={!playerName.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: playerName.trim() ? 'linear-gradient(135deg, #6C63FF, #8B85FF)' : theme.border,
                    fontFamily: 'Space Grotesk', cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                    color: playerName.trim() ? 'white' : theme.muted,
                  }}>
                  🚀 Oyuna Gir
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── GAME SCREEN ───
  return (
    <>
      <Head><title>Codebenders Poker 🃏</title></Head>
      <div style={{ background: theme.bg, minHeight: '100vh' }}>
        <StarField />
        <Toast toasts={toasts} />

        {activeEffect && (
          <ScreenEffect effect={activeEffect} onDone={() => setActiveEffect(null)} />
        )}

        {flyingGifts.map(g => (
          <FlyingGift key={g.id} gift={{ emoji: g.emoji }} fromPos={g.fromPos} toPos={g.toPos}
            onDone={() => setFlyingGifts(prev => prev.filter(x => x.id !== g.id))} />
        ))}

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: theme.border, background: darkMode ? 'rgba(13,15,26,0.85)' : 'rgba(240,242,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🃏</span>
            <div>
              <h1 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk', color: theme.accent }}>
                Codebenders Poker
              </h1>
              <p className="text-xs" style={{ color: theme.muted }}>
                Oda: <span style={{ letterSpacing: 2 }}>{roomId}</span>
                {isOwner && <span style={{ color: '#F5C842', marginLeft: 8 }}>👑 Yönetici</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark/Light mode toggle */}
            <button onClick={() => setDarkMode(!darkMode)}
              className="text-xs px-3 py-2 rounded-lg transition-all hover:scale-105"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('Link kopyalandı!', '🔗', 'info') }}
              className="text-xs px-3 py-2 rounded-lg transition-all hover:scale-105"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
              🔗 Link kopyala
            </button>
            <div className="text-xs px-3 py-2 rounded-lg"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted }}>
              👥 {players.length}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 flex flex-col gap-6" style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Story input */}
          <div className="rounded-2xl p-4 border" style={{ background: theme.surface, borderColor: theme.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span>📋</span>
              <span className="text-sm font-medium" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>
                Puanlanacak Konu
              </span>
            </div>
            <input type="text"
              placeholder="User Story / Bug Başlığını Buraya Girebilirsiniz"
              value={story} onChange={e => updateStory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-indigo-500 transition-colors"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: 'Inter' }} />
          </div>

          {/* Players */}
          <div>
            <p className="text-xs mb-4" style={{ color: theme.muted, fontFamily: 'Space Grotesk' }}>
              TEAM MEMBERS ({players.length})
            </p>
            <div className="flex flex-wrap gap-6">
              {players.map(player => (
                <div key={player.id} ref={el => { playerRefs.current[player.id] = el }}>
                  <PlayerCard
                    player={player}
                    currentPlayerId={playerId}
                    votesVisible={votesVisible}
                    onSendGift={handleSendGift}
                    onSendEffect={handleSendEffect}
                    isOwner={isOwner}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status / controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {!votesVisible && (
              <>
                <div className="text-sm px-4 py-2 rounded-xl"
                  style={{
                    background: allVoted ? 'rgba(61,255,160,0.1)' : theme.card,
                    border: `1px solid ${allVoted ? 'rgba(61,255,160,0.3)' : theme.border}`,
                    color: allVoted ? '#3DFFA0' : theme.muted,
                    fontFamily: 'Space Grotesk',
                  }}>
                  {allVoted ? '✅ Herkes Puanladı!' : `⏳ ${players.filter(p => p.vote).length}/${players.length} puan`}
                </div>
                {/* Only owner can reveal */}
                {isOwner && allVoted && (
                  <button onClick={revealVotes}
                    className="px-5 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                      fontFamily: 'Space Grotesk', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(108,99,255,0.4)',
                    }}>
                    🎴 Kartları Aç!
                  </button>
                )}
                {!isOwner && allVoted && (
                  <div className="text-sm px-4 py-2 rounded-xl"
                    style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, fontFamily: 'Space Grotesk' }}>
                    ⏳ Yönetici kartları açacak...
                  </div>
                )}
              </>
            )}
            {votesVisible && isOwner && (
              <button onClick={resetVotes}
                className="px-5 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                  background: theme.card, border: '1px solid #F5C842',
                  color: '#F5C842', fontFamily: 'Space Grotesk', cursor: 'pointer',
                }}>
                🔄 Yeniden Oyla
              </button>
            )}
          </div>

          {votesVisible && <VoteResults players={players} theme={theme} />}

          {/* Card deck */}
          {!votesVisible && (
            <div>
              <p className="text-xs mb-3" style={{ color: theme.muted, fontFamily: 'Space Grotesk' }}>
                PUANINIZI SEÇİN
              </p>
              <div className="flex flex-wrap gap-3">
                {FIBONACCI.map(val => (
                  <PokerCard key={val} value={val} selected={myVote === val} onClick={() => vote(val)} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
