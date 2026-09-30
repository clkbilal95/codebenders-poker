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
  '🧙‍♂️', '🥷', '🧛', '🤖', '👾', '🦊',
  '🐼', '🦁', '🐯', '🦄', '🐉', '🚀',
  '⚡', '🌙', '👨‍💻', '🕵️‍♂️', '🧑‍🔬', '🦸‍♂️',
  '🧟‍♂️', '🐺', '🦅', '🐙', '💀', '🎮',
  '🧑‍✈️', '👩‍💻', '🦸‍♀️',
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
  const [customAvatar, setCustomAvatar] = useState(null)
  const fileInputRef = useRef(null)

  // ── Persistent player ID (localStorage survives refresh) ──
  const [playerId] = useState(() => {
    if (typeof window === 'undefined') return uuidv4()
    const stored = localStorage.getItem('cb_playerId')
    if (stored) return stored
    const newId = uuidv4()
    localStorage.setItem('cb_playerId', newId)
    return newId
  })

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setCustomAvatar(ev.target.result)
    reader.readAsDataURL(file)

    // Upload to Supabase Storage so everyone can see it
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `avatars/${playerId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (!error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        if (urlData?.publicUrl) setCustomAvatar(urlData.publicUrl)
      }
    } catch (_) {
      // Keep base64 fallback if storage fails
    }
  }

  function clearCustomAvatar() {
    setCustomAvatar(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
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
  const [timer, setTimer] = useState(null)       // null | number (seconds remaining)
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60)
  const timerRef = useRef(null)
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

  // ── Auto-rejoin if player was already in this room ──
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return
    const savedRoom = localStorage.getItem('cb_roomId')
    const savedName = localStorage.getItem('cb_playerName')
    const savedAvatar = localStorage.getItem('cb_playerAvatar')
    if (savedRoom === roomId && savedName) {
      setPlayerName(savedName)
      if (savedAvatar) {
        if (AVATARS.includes(savedAvatar)) setSelectedAvatar(savedAvatar)
        else setCustomAvatar(savedAvatar)
      }
      // Re-mark as online and jump to game
      supabase.from('players').update({ online: true }).eq('id', playerId).then(() => setPhase('game'))
    }
  }, [roomId, playerId])

  async function joinRoom() {
    if (!playerName.trim() || !roomId) return
    const nameWithHoca = addHoca(playerName)
    const { data: roomData } = await supabase.from('rooms').select('owner_id').eq('id', roomId).single()
    const amOwner = roomData?.owner_id === playerId
    setIsOwner(amOwner)
    const avatar = customAvatar || selectedAvatar
    await supabase.from('players').upsert({
      id: playerId, room_id: roomId, name: nameWithHoca,
      avatar, vote: null, online: true, is_owner: amOwner,
    })
    // Save session to localStorage
    localStorage.setItem('cb_roomId', roomId)
    localStorage.setItem('cb_playerName', nameWithHoca)
    localStorage.setItem('cb_playerAvatar', avatar)
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
      .on('broadcast', { event: 'consensus_fireworks' }, ({ payload }) => setActiveEffect({ type: 'fireworks', vote: payload?.vote || null }))
      .on('broadcast', { event: 'timer_start' }, ({ payload }) => {
        setTimer(payload.seconds)
        setTimerActive(true)
      })
      .on('broadcast', { event: 'timer_stop' }, () => {
        setTimerActive(false)
        setTimer(null)
      })
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
        const consensusVote = votes[0]
        supabase.channel(`gifts-${roomId}`).send({ type: 'broadcast', event: 'consensus_fireworks', payload: { vote: consensusVote } })
        setActiveEffect({ type: 'fireworks', vote: consensusVote })
      }
    }, 400)
  }

  async function resetVotes() {
    await supabase.from('rooms').update({ votes_visible: false }).eq('id', roomId)
    await supabase.from('players').update({ vote: null }).eq('room_id', roomId)
    setMyVote(null)
    setTimer(null)
    setTimerActive(false)
  }

  // ── Timer countdown ──
  useEffect(() => {
    if (!timerActive || timer === null) return
    if (timer <= 0) {
      setTimerActive(false)
      addToast('⏰ Süre doldu!', '⏰', 'info')
      return
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerActive, addToast])

  function startTimer() {
    setTimer(timerDuration)
    setTimerActive(true)
    supabase.channel(`gifts-${roomId}`).send({ type: 'broadcast', event: 'timer_start', payload: { seconds: timerDuration } })
  }

  function stopTimer() {
    setTimer(null)
    setTimerActive(false)
    supabase.channel(`gifts-${roomId}`).send({ type: 'broadcast', event: 'timer_stop', payload: {} })
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

  async function handleKick(player) {
    if (!isOwner) return
    await supabase.from('players').update({ online: false }).eq('id', player.id)
    addToast(`${player.name} odadan çıkarıldı.`, '🚪', 'info')
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
                {/* Photo upload */}
                <p className="text-sm font-medium mb-2" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>Avatarını seç</p>

                {/* Upload button */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  {customAvatar ? (
                    <div className="flex items-center gap-3">
                      <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', border: '2.5px solid #6C63FF', flexShrink: 0 }}>
                        <img src={customAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#3DFFA0', fontFamily: 'Space Grotesk' }}>✓ Fotoğraf yüklendi</p>
                        <button onClick={clearCustomAvatar}
                          className="text-xs px-3 py-1 rounded-lg transition-all hover:scale-105"
                          style={{ background: '#1E2438', border: '1px solid #2A3050', color: '#FF6B9D', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                          Kaldır
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-[1.02] w-full"
                      style={{ background: theme.card, border: `2px dashed ${theme.border}`, color: theme.muted, cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📷</span>
                      <span>Fotoğraf yükle</span>
                      <span className="ml-auto text-xs" style={{ color: theme.muted, opacity: 0.6 }}>opsiyonel</span>
                    </button>
                  )}
                </div>

                {/* Divider */}
                {!customAvatar && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px" style={{ background: theme.border }} />
                      <span className="text-xs" style={{ color: theme.muted }}>veya emoji seç</span>
                      <div className="flex-1 h-px" style={{ background: theme.border }} />
                    </div>

                    {/* Emoji grid */}
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
                  </>
                )}

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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #6C63FF33, #6C63FF55)', border: '2px solid #6C63FF', flexShrink: 0 }}>
                      {customAvatar
                        ? <img src={customAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.2rem' }}>{selectedAvatar}</span>
                      }
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

          {/* ── TIMER ── */}
          {(timer !== null || isOwner) && !votesVisible && (
            <div className="rounded-2xl p-4 border flex items-center gap-4 flex-wrap"
              style={{ background: theme.surface, borderColor: timer !== null && timer <= 10 ? '#FF4444' : theme.border,
                boxShadow: timer !== null && timer <= 10 ? '0 0 20px rgba(255,68,68,0.2)' : 'none',
                transition: 'all 0.3s' }}>
              {/* Big countdown */}
              {timer !== null ? (
                <div className="flex items-center gap-3 flex-1">
                  <span style={{ fontSize: '1.5rem' }}>{timer <= 10 ? '🔴' : timer <= 30 ? '🟡' : '🟢'}</span>
                  <div>
                    <div style={{
                      fontFamily: 'Space Grotesk', fontWeight: 800,
                      fontSize: '2.2rem', lineHeight: 1,
                      color: timer <= 10 ? '#FF4444' : timer <= 30 ? '#F5C842' : '#3DFFA0',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'color 0.3s',
                    }}>
                      {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.7rem', color: theme.muted, marginTop: 2 }}>
                      {timerActive ? 'kalan süre' : 'süre doldu'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.85rem', color: theme.muted }}>⏱ Timer</span>
                </div>
              )}

              {/* Owner controls */}
              {isOwner && (
                <div className="flex items-center gap-2 flex-wrap">
                  {timer === null && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl overflow-hidden"
                        style={{ border: `1px solid ${theme.border}`, background: theme.card }}>
                        <input
                          type="number" min="0" max="99"
                          value={Math.floor(timerDuration / 60)}
                          onChange={e => {
                            const mins = Math.max(0, Math.min(99, parseInt(e.target.value) || 0))
                            setTimerDuration(mins * 60 + (timerDuration % 60))
                          }}
                          className="text-center outline-none bg-transparent"
                          style={{ width: 44, padding: '4px 2px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: theme.text, MozAppearance: 'textfield' }}
                        />
                        <span style={{ color: theme.muted, fontSize: '0.8rem', fontFamily: 'Space Grotesk', padding: '0 2px' }}>dk</span>
                        <div style={{ width: 1, height: 24, background: theme.border }} />
                        <input
                          type="number" min="0" max="59"
                          value={timerDuration % 60}
                          onChange={e => {
                            const secs = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                            setTimerDuration(Math.floor(timerDuration / 60) * 60 + secs)
                          }}
                          className="text-center outline-none bg-transparent"
                          style={{ width: 44, padding: '4px 2px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: theme.text, MozAppearance: 'textfield' }}
                        />
                        <span style={{ color: theme.muted, fontSize: '0.8rem', fontFamily: 'Space Grotesk', padding: '0 6px 0 2px' }}>sn</span>
                      </div>
                      <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
                    </div>
                  )}
                  {timer === null ? (
                    <button onClick={startTimer}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg,#6C63FF,#8B85FF)', color: 'white', fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
                      ▶ Başlat
                    </button>
                  ) : (
                    <button onClick={stopTimer}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: '#1E2438', border: '1px solid #FF4444', color: '#FF4444', fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
                      ■ Durdur
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

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
                    isOwner={isOwner}
                    onKick={handleKick}
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
                className="px-8 py-3 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #F5C842, #FFB347)',
                  color: '#0D0F1A',
                  fontFamily: 'Space Grotesk',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(245,200,66,0.4)',
                  animation: 'newRoundPulse 2s ease-in-out infinite',
                }}>
                🔄 Yeni El Başlat
              </button>
            )}
            <style>{`@keyframes newRoundPulse { 0%,100%{box-shadow:0 0 30px rgba(245,200,66,0.4)} 50%{box-shadow:0 0 50px rgba(245,200,66,0.7)} }`}</style>
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
