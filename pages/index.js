import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import Head from 'next/head'
import StarField from '../components/StarField'

const TEAMS = [
  {
    id: 'codebenders',
    name: 'Codebenders',
    emoji: '⚡',
    color: '#6C63FF',
    glow: 'rgba(108,99,255,0.5)',
    gradient: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
  },
  {
    id: 'ironbirds',
    name: 'Ironbirds',
    emoji: '🦅',
    color: '#FF6B9D',
    glow: 'rgba(255,107,157,0.5)',
    gradient: 'linear-gradient(135deg, #FF6B9D, #FF8E53)',
  },
]

export default function Home() {
  const router = useRouter()
  const [phase, setPhase] = useState('team') // team | lobby
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(true)

  const theme = darkMode ? {
    bg: '#0D0F1A', surface: '#151929', card: '#1E2438',
    border: '#2A3050', text: '#E8EAFF', muted: '#7B82A8',
  } : {
    bg: '#F0F2FF', surface: '#FFFFFF', card: '#F0F2FF',
    border: '#DDE1FF', text: '#1A1D35', muted: '#6B7280',
  }

  function getOrCreatePlayerId() {
    if (typeof window === 'undefined') return uuidv4()
    const stored = sessionStorage.getItem('playerId')
    if (stored) return stored
    const newId = uuidv4()
    sessionStorage.setItem('playerId', newId)
    return newId
  }

  function selectTeam(team) {
    setSelectedTeam(team)
    // Store team in session
    if (typeof window !== 'undefined') sessionStorage.setItem('team', team.id)
    setPhase('lobby')
  }

  async function createRoom() {
    setCreating(true)
    setError('')
    try {
      const playerId = getOrCreatePlayerId()
      const roomId = uuidv4().slice(0, 8).toUpperCase()
      const { error: err } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          status: 'waiting',
          votes_visible: false,
          current_story: '',
          owner_id: playerId,
          team: selectedTeam?.id || 'codebenders',
        })
      if (err) throw err
      router.push(`/room/${roomId}`)
    } catch (e) {
      setError('Oda oluşturulamadı. Supabase ayarlarını kontrol et.')
      setCreating(false)
    }
  }

  async function joinRoom() {
    if (!roomCode.trim()) return
    setJoining(true)
    setError('')
    try {
      const code = roomCode.trim().toUpperCase()
      const { data, error: err } = await supabase.from('rooms').select('id').eq('id', code).single()
      if (err || !data) { setError('Oda bulunamadı. Kodu kontrol et!'); setJoining(false); return }
      router.push(`/room/${code}`)
    } catch (e) {
      setError('Bir hata oluştu.')
      setJoining(false)
    }
  }

  // ─── TEAM SELECTION ───
  if (phase === 'team') {
    return (
      <>
        <Head><title>Biletbank Poker 🃏</title></Head>
        <div style={{ background: theme.bg, minHeight: '100vh' }}>
          <StarField />

          <div className="absolute top-4 right-4 z-20">
            <button onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg text-sm transition-all hover:scale-105"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <div className="text-center mb-12">
              <div className="text-6xl mb-4 animate-float">🃏</div>
              <h1 className="text-5xl font-bold mb-2"
                style={{ fontFamily: 'Space Grotesk', color: '#6C63FF', letterSpacing: '-1px' }}>
                Biletbank Poker
              </h1>
              <p className="text-lg" style={{ color: theme.muted, fontFamily: 'Space Grotesk' }}>
                Hangi ekiptesin?
              </p>
            </div>

            {/* Team cards */}
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
              {TEAMS.map(team => (
                <button key={team.id} onClick={() => selectTeam(team)}
                  className="flex-1 rounded-3xl p-8 flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: theme.surface,
                    border: `2px solid ${theme.border}`,
                    cursor: 'pointer',
                    boxShadow: `0 0 0 rgba(0,0,0,0)`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `2px solid ${team.color}`
                    e.currentTarget.style.boxShadow = `0 0 32px ${team.glow}`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = `2px solid ${theme.border}`
                    e.currentTarget.style.boxShadow = `0 0 0 rgba(0,0,0,0)`
                  }}>
                  {/* Team emoji badge */}
                  <div className="rounded-2xl flex items-center justify-center"
                    style={{ width: 80, height: 80, fontSize: '2.8rem', background: team.gradient, boxShadow: `0 8px 32px ${team.glow}` }}>
                    {team.emoji}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold"
                      style={{ fontFamily: 'Space Grotesk', color: team.color }}>
                      {team.name}
                    </p>
                  </div>
                  <div className="px-6 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: team.gradient, fontFamily: 'Space Grotesk' }}>
                    Seç →
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-12 text-xs" style={{ color: darkMode ? '#3D4466' : '#C0C4D8' }}>
              Made with 💜 for Biletbank
            </p>
          </div>
        </div>
      </>
    )
  }

  // ─── LOBBY ───
  return (
    <>
      <Head><title>Biletbank Poker 🃏</title></Head>
      <div style={{ background: theme.bg, minHeight: '100vh' }}>
        <StarField />

        <div className="absolute top-4 right-4 z-20">
          <button onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-2 rounded-lg text-sm transition-all hover:scale-105"
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          {/* Team badge + back */}
          <div className="mb-8 text-center">
            <button onClick={() => setPhase('team')}
              className="mb-4 text-sm px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
              ← Ekip değiştir
            </button>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="rounded-xl flex items-center justify-center text-2xl"
                style={{ width: 48, height: 48, background: selectedTeam?.gradient, boxShadow: `0 4px 20px ${selectedTeam?.glow}` }}>
                {selectedTeam?.emoji}
              </div>
              <div className="text-left">
                <p className="text-xs" style={{ color: theme.muted }}>Seçilen ekip</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: selectedTeam?.color }}>
                  {selectedTeam?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md space-y-4">
            {/* Create Room */}
            <div className="rounded-2xl p-6 border" style={{ background: theme.surface, borderColor: theme.border }}>
              <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>
                🚀 Yeni Oda Oluştur
              </h2>
              <p className="text-sm mb-4" style={{ color: theme.muted }}>
                Oda kodu alırsın, ekibine link atarsın.
              </p>
              <button onClick={createRoom} disabled={creating}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: creating ? theme.border : (selectedTeam?.gradient || 'linear-gradient(135deg,#6C63FF,#8B85FF)'),
                  fontFamily: 'Space Grotesk',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}>
                {creating ? '⏳ Oluşturuluyor...' : '✨ Oda Oluştur'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: theme.border }} />
              <span className="text-sm" style={{ color: theme.muted }}>veya</span>
              <div className="flex-1 h-px" style={{ background: theme.border }} />
            </div>

            {/* Join Room */}
            <div className="rounded-2xl p-6 border" style={{ background: theme.surface, borderColor: theme.border }}>
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk', color: theme.text }}>
                🔗 Odaya Katıl
              </h2>
              <input type="text" placeholder="Oda kodunu gir (örn: AB12CD34)"
                value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                className="w-full px-4 py-3 rounded-xl mb-3 text-sm outline-none border focus:border-indigo-500 transition-colors"
                style={{ background: theme.bg, borderColor: theme.border, color: theme.text, fontFamily: 'Space Grotesk', letterSpacing: '2px' }}
                maxLength={8} />
              <button onClick={joinRoom} disabled={joining || !roomCode.trim()}
                className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: (joining || !roomCode.trim()) ? theme.border : theme.card,
                  border: `1px solid ${(joining || !roomCode.trim()) ? theme.border : (selectedTeam?.color || '#6C63FF')}`,
                  color: (joining || !roomCode.trim()) ? theme.muted : (selectedTeam?.color || '#8B85FF'),
                  fontFamily: 'Space Grotesk',
                  cursor: (joining || !roomCode.trim()) ? 'not-allowed' : 'pointer',
                }}>
                {joining ? '⏳ Katılıyorum...' : '🎯 Katıl'}
              </button>
            </div>

            {error && (
              <div className="text-center py-3 px-4 rounded-xl text-sm"
                style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.2)' }}>
                {error}
              </div>
            )}
          </div>

          <p className="mt-12 text-xs" style={{ color: darkMode ? '#3D4466' : '#C0C4D8' }}>
            Made with 💜 for Biletbank
          </p>
        </div>
      </div>
    </>
  )
}
