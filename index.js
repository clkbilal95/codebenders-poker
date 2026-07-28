import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import Head from 'next/head'
import StarField from '../components/StarField'

export default function Home() {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  async function createRoom() {
    setCreating(true)
    setError('')
    try {
      const roomId = uuidv4().slice(0, 8).toUpperCase()
      const { error: err } = await supabase
        .from('rooms')
        .insert({ id: roomId, status: 'waiting', votes_visible: false, current_story: '' })

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
      const { data, error: err } = await supabase
        .from('rooms')
        .select('id')
        .eq('id', code)
        .single()

      if (err || !data) {
        setError('Oda bulunamadı. Kodu kontrol et!')
        setJoining(false)
        return
      }
      router.push(`/room/${code}`)
    } catch (e) {
      setError('Bir hata oluştu.')
      setJoining(false)
    }
  }

  return (
    <>
      <Head>
        <title>Codebenders Poker 🃏</title>
        <meta name="description" content="Eğlenceli Scrum Poker - Codebenders ekibi için" />
      </Head>

      <StarField />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="text-6xl mb-4 animate-float">🃏</div>
          <h1
            className="text-5xl font-bold mb-2"
            style={{ fontFamily: 'Space Grotesk', color: '#6C63FF', letterSpacing: '-1px' }}
          >
            Codebenders
          </h1>
          <p className="text-xl" style={{ color: '#8B85FF', fontFamily: 'Space Grotesk' }}>
            Scrum Poker
          </p>
          <p className="mt-2 text-sm" style={{ color: '#7B82A8' }}>
            Tahmin et, eğlen, birbirine yemek gönder 🍕
          </p>
        </div>

        {/* Cards */}
        <div className="w-full max-w-md space-y-4">
          {/* Create Room */}
          <div
            className="rounded-2xl p-6 border"
            style={{ background: '#151929', borderColor: '#2A3050' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#E8EAFF' }}>
              🚀 Yeni Oda Oluştur
            </h2>
            <p className="text-sm mb-4" style={{ color: '#7B82A8' }}>
              Bir oda kodu alırsın, ekibine link atarsın, refinement başlar.
            </p>
            <button
              onClick={createRoom}
              disabled={creating}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: creating ? '#2A3050' : 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                fontFamily: 'Space Grotesk',
                cursor: creating ? 'not-allowed' : 'pointer'
              }}
            >
              {creating ? '⏳ Oluşturuluyor...' : '✨ Oda Oluştur'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#2A3050' }} />
            <span className="text-sm" style={{ color: '#7B82A8' }}>veya</span>
            <div className="flex-1 h-px" style={{ background: '#2A3050' }} />
          </div>

          {/* Join Room */}
          <div
            className="rounded-2xl p-6 border"
            style={{ background: '#151929', borderColor: '#2A3050' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#E8EAFF' }}>
              🔗 Odaya Katıl
            </h2>
            <input
              type="text"
              placeholder="Oda kodunu gir (örn: AB12CD34)"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              className="w-full px-4 py-3 rounded-xl mb-3 text-sm outline-none border focus:border-indigo-500 transition-colors"
              style={{
                background: '#0D0F1A',
                borderColor: '#2A3050',
                color: '#E8EAFF',
                fontFamily: 'Space Grotesk',
                letterSpacing: '2px'
              }}
              maxLength={8}
            />
            <button
              onClick={joinRoom}
              disabled={joining || !roomCode.trim()}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: (joining || !roomCode.trim()) ? '#2A3050' : '#1E2438',
                border: '1px solid #6C63FF',
                color: (joining || !roomCode.trim()) ? '#7B82A8' : '#8B85FF',
                fontFamily: 'Space Grotesk',
                cursor: (joining || !roomCode.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {joining ? '⏳ Katılıyorum...' : '🎯 Katıl'}
            </button>
          </div>

          {error && (
            <div
              className="text-center py-3 px-4 rounded-xl text-sm"
              style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.2)' }}
            >
              {error}
            </div>
          )}
        </div>

        <p className="mt-12 text-xs" style={{ color: '#3D4466' }}>
          Made with 💜 for Codebenders
        </p>
      </div>
    </>
  )
}
