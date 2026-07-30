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
  '🧙‍♂️', '🥷', '🧛', '🤖', '👾', '🐼',
  '🦁', '🐯', '🦄', '🐉', '🚀', '⚡',
  '🌙', '👨‍💻', '🕵️‍♂️', '🧑‍🔬', '🦸‍♂️', '🧟‍♂️',
  '🐺', '🦅', '🐙', '💀', '🎮', '🧑‍✈️',
  '👩‍💻', '🦸‍♀️',
]

function addHoca(name) {
  const t = name.trim()
  if (!t) return t
  if (t.toLowerCase().endsWith('hoca')) return t
  return t + ' Hoca'
}

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
  const [lastGifts, setLastGifts] = useState({})
  const playerRefs = useRef({})
  const resultsRef = useRef(null)

  const addToast = useCallback((msg, emoji = '🎁', type = 'gift') => {
    const id = uuidv4()
    setToasts(prev => [...prev.slice(-3), { id, message: msg, emoji, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const theme = darkMode ? {
    bg: '#0D0F1A', surface: '#151929', card: '#1E2438',
    border: '#2A3050', text: '#E8EAFF', muted: '#7B82A8',
    accent: '#6C63FF', accentLight: '#8B85FF',
    headerBg: 'rgba(13,15,26,0.9)',
  } : {
    bg: '#F0F2FF', surface: '#FFFFFF', card: '#F0F2FF',
    border: '#DDE1FF', text: '#1A1D35', muted: '#6B7280',
    accent: '#6C63FF', accentLight: '#8B85FF',
    headerBg: 'rgba(240,242,255,0.95)',
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomId) return
    const nameWithHoca = addHoca(playerName)
    const { data: roomData } = await supabase.from('rooms').select('owner_id').eq('id', roomId).single()
    const amOwner = roomData?.owner_id === playerId
    setIsOwner(amOwner)
    await supabase.from('players').upsert({
      id: playerId, room_id: roomId, name: nameWithHoca,
      avatar: selectedAvatar, vote: null, online: true, is_owner: amOwner,
    })
    setPhase('game')
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
      if (roomData) { setRoom(roomData); setStory(roomData.current_story || ''); setIsOwner(roomData.owner_id === playerId) }
      const { data: playersData } = await supabase.from('players').select('*').eq('room_id', roomId).eq('online', true)
      if (playersData) setPlayers(playersData)
    }
    fetchAll()

    const roomSub = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => {
        if (payload.new) {
          setRoom(payload.new); setStory(payload.new.current_story || '')
          if (payload.new.votes_visible === false && payload.old?.votes_visible === true) setMyVote(null)
          if (payload.new.votes_visible === true && payload.old?.votes_visible === false)
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400)
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
          if (payload.eventType === 'INSERT' && payload.new.id !== playerId)
            addToast(`${payload.new.name} odaya katıldı!`, '👋', 'info')
        }
        if (payload.eventType === 'DELETE') setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    const giftSub = supabase.channel(`gifts-${roomId}`)
      .on('broadcast', { event: 'gift' }, ({ payload }) => {
        setLastGifts(prev => ({ ...prev, [payload.toId]: payload.giftImg }))
        if (payload.toId === playerId)
          addToast(`${payload.fromName} ${payload.giftMsg}`, '🎁', 'gift')
        else if (payload.fromId !== playerId)
          addToast(`${payload.fromName} → ${payload.toName}: ${payload.giftLabel}`, '🎁', 'gift')
      })
      .on('broadcast', { event: 'consensus_fireworks' }, () => setActiveEffect('fireworks'))
      .on('broadcast', { event: 'effect' }, ({ payload }) => {
        if (payload.toId === playerId) {
          setActiveEffect(payload.effectId)
          addToast(`${payload.fromName} sana ${payload.effectLabel} efekti gönderdi!`, payload.effectEmoji, 'gift')
        } else if (payload.fromId !== playerId)
          addToast(`${payload.fromName} → ${payload.toName}: ${payload.effectEmoji} ${payload.effectLabel}`, payload.effectEmoji, 'info')
      })
      .subscribe()

    return () => { supabase.removeChannel(roomSub); supabase.removeChannel(giftSub) }
  }, [roomId, phase, playerId, addToast])

  async function vote(value) { setMyVote(value); await supabase.from('players').update({ vote: value }).eq('id', playerId) }

  async function revealVotes() {
    await supabase.from('rooms').update({ votes_visible: true }).eq('id', roomId)
    addToast('Kartlar açıldı!', '🎴', 'reveal')
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const votes = players.map(p => p.vote).filter(Boolean)
      const allSame = votes.length > 0 && new Set(votes).size === 1
      if (allSame) {
        supabase.channel(`gifts-${roomId}`).send({ type: 'broadcast', event: 'consensus_fireworks', payload: {} })
        setActiveEffect('fireworks')
      }
    }, 400)
  }

  async function resetVotes() {
    await supabase.from('rooms').update({ votes_visible: false }).eq('id', roomId)
    await supabase.from('players').update({ vote: null }).eq('room_id', roomId)
    setMyVote(null)
  }

  async function updateStory(val) { setStory(val); await supabase.from('rooms').update({ current_story: val }).eq('id', roomId) }

  function handleSendGift(gift, toPlayer, fromPos) {
    const targetEl = playerRefs.current[toPlayer.id]
    const targetRect = targetEl?.getBoundingClientRect()
    const toPos = targetRect
      ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }
      : { x: window.innerWidth / 2, y: 100 }
    setFlyingGifts(prev => [...prev, { id: uuidv4(), img: gift.img, fromPos, toPos }])
    setLastGifts(prev => ({ ...prev, [toPlayer.id]: gift.img }))
    supabase.channel(`gifts-${roomId}`).send({
      type: 'broadcast', event: 'gift',
      payload: {
        fromId: playerId, fromName: players.find(p => p.id === playerId)?.name || '',
        toId: toPlayer.id, toName: toPlayer.name,
        giftLabel: gift.label, giftImg: gift.img, giftMsg: gift.msg,
      }
    })
    addToast(`🎁 ${toPlayer.name}'ya ${gift.label} gönderildi!`, '🎁', 'gift')
  }

  function handleSendEffect(effect, toPlayer) {
    supabase.channel(`gifts-${roomId}`).send({
      type: 'broadcast', event: 'effect',
      payload: {
        fromId: playerId, fromName: players.find(p => p.id === playerId)?.name || '',
        toId: toPlayer.id, toName: toPlayer.name,
        effectId: effect.id, effectLabel: effect.label, effectEmoji: effect.emoji,
      }
    })
    addToast(`${effect.emoji} ${toPlayer.name}'ya ${effect.label} gönderildi!`, effect.emoji, 'gift')
  }

  const allVoted = players.length > 0 && players.every(p => !!p.vote)
  const votesVisible = room?.votes_visible || false

  // ─── JOIN SCREEN ───
  if (phase === 'join') {
    return (
      <>
        <Head><title>Biletbank Poker – Katıl</title></Head>
        <div style={{ background: theme.bg, minHeight: '100vh' }}>
          <StarField />
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="text-5xl mb-3 animate-float">🃏</div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: theme.accent }}>Odaya Katıl</h1>
                <p className="text-sm mt-1" style={{ color: theme.muted }}>
                  Oda: <span style={{ color: theme.accentLight, letterSpacing: 2 }}>{roomId}</span>
                </p>
              </div>

              <div className="rounded-2xl p-6 border" style={{ background: theme.surface, borderColor: theme.border }}>
                {/* Avatar picker */}
                <p className="text-sm font-medium mb-3" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>Avatarını seç</p>
                <div className="grid grid-cols-8 gap-2 mb-5">
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setSelectedAvatar(av)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: selectedAvatar === av ? 'linear-gradient(135deg, #6C63FF, #8B85FF)' : theme.card,
                        border: selectedAvatar === av ? '2px solid #8B85FF' : `2px solid ${theme.border}`,
                        cursor: 'pointer',
                        transform: selectedAvatar === av ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: selectedAvatar === av ? '0 0 12px rgba(108,99,255,0.5)' : 'none',
                      }}>
                      {av}
                    </button>
                  ))}
                </div>

                {/* Name */}
                <p className="text-sm font-medium mb-2" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>Adın</p>
                <input type="text" placeholder="Adını gir..." value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()}
                  className="w-full px-4 py-3 rounded-xl mb-4 outline-none border focus:border-indigo-500 transition-colors text-sm"
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: 'Space Grotesk' }}
                  maxLength={20} autoFocus />

                {/* Preview */}
                {playerName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: theme.bg }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'linear-gradient(135deg, #6C63FF33, #6C63FF55)', border: '2px solid #6C63FF' }}>
                      {selectedAvatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>{playerName.trim()}</p>
                      <p className="text-xs" style={{ color: theme.muted }}>Biletbank üyesi</p>
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
      <Head><title>Biletbank Poker 🃏</title></Head>
      <div style={{ background: theme.bg, minHeight: '100vh' }}>
        <StarField />
        <Toast toasts={toasts} />
        {activeEffect && <ScreenEffect effect={activeEffect} onDone={() => setActiveEffect(null)} />}
        {flyingGifts.map(g => (
          <FlyingGift key={g.id} gift={{ img: g.img }} fromPos={g.fromPos} toPos={g.toPos}
            onDone={() => setFlyingGifts(prev => prev.filter(x => x.id !== g.id))} />
        ))}

        <header className="flex items-center justify-between px-5 py-3 border-b sticky top-0 z-30"
          style={{ borderColor: theme.border, background: theme.headerBg, backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🃏</span>
            <div>
              <h1 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk', color: theme.accent }}>Biletbank Poker</h1>
              <p className="text-xs" style={{ color: theme.muted }}>
                Oda: <span style={{ letterSpacing: 2 }}>{roomId}</span>
                {isOwner && <span style={{ color: '#F5C842', marginLeft: 8 }}>👑 Yönetici</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('Link kopyalandı!', '🔗', 'info') }}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
              🔗 Link kopyala
            </button>
            <div className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted }}>
              👥 {players.length}
            </div>
          </div>
        </header>

        <main className="px-4 py-5 flex flex-col gap-5" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="rounded-2xl p-4 border" style={{ background: theme.surface, borderColor: theme.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span>📋</span>
              <span className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>Puanlanacak Konu</span>
            </div>
            <input type="text"
              placeholder={isOwner ? 'User Story / Bug Başlığını Buraya Girebilirsiniz' : 'Yönetici başlık girecek...'}
              value={story} onChange={e => isOwner && updateStory(e.target.value)}
              readOnly={!isOwner}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border transition-colors"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: 'Inter', cursor: isOwner ? 'text' : 'default', opacity: isOwner ? 1 : 0.7 }} />
          </div>

          <div>
            <p className="text-xs font-semibold mb-4" style={{ color: theme.muted, fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}>
              TEAM MEMBERS ({players.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '24px 16px', paddingTop: '20px' }}>
              {players.map(player => (
                <div key={player.id} ref={el => { playerRefs.current[player.id] = el }} className="flex justify-center">
                  <PlayerCard
                    player={player}
                    currentPlayerId={playerId}
                    votesVisible={votesVisible}
                    onSendGift={handleSendGift}
                    onSendEffect={handleSendEffect}
                    lastGift={lastGifts[player.id] || null}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: theme.border }} />

          <div className="flex items-center gap-3 flex-wrap">
            {!votesVisible && (
              <>
                <div className="text-sm px-4 py-2 rounded-xl"
                  style={{ background: allVoted ? 'rgba(61,255,160,0.1)' : theme.card, border: `1px solid ${allVoted ? 'rgba(61,255,160,0.3)' : theme.border}`, color: allVoted ? '#3DFFA0' : theme.muted, fontFamily: 'Space Grotesk' }}>
                  {allVoted ? '✅ Herkes Puanladı!' : `⏳ ${players.filter(p => p.vote).length}/${players.length} puan`}
                </div>
                {isOwner && (
                  <button onClick={revealVotes}
                    className="px-5 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
                    style={{ background: allVoted ? 'linear-gradient(135deg,#6C63FF,#8B85FF)' : 'linear-gradient(135deg,#3a3060,#4a3f80)', fontFamily: 'Space Grotesk', cursor: 'pointer', boxShadow: allVoted ? '0 0 20px rgba(108,99,255,0.4)' : 'none', opacity: allVoted ? 1 : 0.75 }}>
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
                style={{ background: theme.card, border: '1px solid #F5C842', color: '#F5C842', fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
                🔄 Yeniden Oyla
              </button>
            )}
          </div>

          {votesVisible && <div ref={resultsRef}><VoteResults players={players} theme={theme} /></div>}

          {!votesVisible && (
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: theme.muted, fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}>PUANINIZI SEÇİN</p>
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
