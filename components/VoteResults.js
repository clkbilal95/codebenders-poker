export default function VoteResults({ players, theme }) {
  const t = theme || {
    surface: '#151929', card: '#1E2438', border: '#2A3050',
    text: '#E8EAFF', muted: '#7B82A8',
  }

  const numericVotes = players
    .filter(p => p.vote && !isNaN(Number(p.vote)))
    .map(p => Number(p.vote))

  if (numericVotes.length === 0) return null

  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
  const min = Math.min(...numericVotes)
  const max = Math.max(...numericVotes)

  const dist = {}
  players.forEach(p => {
    if (!p.vote) return
    if (!dist[p.vote]) dist[p.vote] = []
    dist[p.vote].push(p.name)
  })

  const consensus = Object.keys(dist).length === 1

  return (
    <div className="rounded-2xl p-5 border mt-4"
      style={{ background: t.surface, borderColor: consensus ? '#3DFFA0' : t.border }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{consensus ? '🎉' : '📊'}</span>
        <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk', color: t.text }}>
          {consensus ? 'Oy birliği! Harika iş!' : 'Sonuçlar'}
        </h3>
      </div>

      {numericVotes.length > 0 && (
        <div className="flex gap-4 mb-4">
          {[
            { label: 'Ortalama', value: avg.toFixed(1), color: '#8B85FF' },
            { label: 'En düşük', value: min, color: '#3DFFA0' },
            { label: 'En yüksek', value: max, color: '#F5C842' },
          ].map(stat => (
            <div key={stat.label} className="flex-1 rounded-xl p-3 text-center" style={{ background: t.card }}>
              <div className="text-xl font-bold" style={{ color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: t.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(dist).sort((a, b) => b[1].length - a[1].length).map(([vote, names]) => (
          <div key={vote} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: 'white', fontFamily: 'Space Grotesk', fontSize: vote.length > 2 ? '0.8rem' : '1rem' }}>
              {vote}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 rounded-full"
                  style={{ width: `${(names.length / players.length) * 100}%`, background: 'linear-gradient(90deg, #6C63FF, #8B85FF)', minWidth: 8 }} />
                <span className="text-xs" style={{ color: t.muted }}>{names.length}</span>
              </div>
              <p className="text-xs" style={{ color: t.muted }}>{names.join(', ')}</p>
            </div>
          </div>
        ))}
      </div>

      {!consensus && max - min > 5 && (
        <div className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}>
          ⚡ Yüksek fark var! Tartışmak lazım.
        </div>
      )}
    </div>
  )
}
