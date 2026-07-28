export default function PokerCard({ value, selected, onClick, disabled }) {
  const isSpecial = value === '?' || value === '☕'
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="perspective relative"
      style={{ width: 64, height: 96, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div
        className="rounded-xl border-2 flex flex-col items-center justify-center font-bold transition-all duration-200 hover:scale-110 hover:-translate-y-1 select-none"
        style={{
          width: '100%',
          height: '100%',
          background: selected
            ? 'linear-gradient(135deg, #6C63FF, #8B85FF)'
            : '#1E2438',
          borderColor: selected ? '#8B85FF' : '#2A3050',
          color: selected ? 'white' : '#E8EAFF',
          fontSize: isSpecial ? '1.5rem' : value.length > 2 ? '1rem' : '1.4rem',
          boxShadow: selected
            ? '0 0 24px rgba(108, 99, 255, 0.6), 0 8px 24px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          transform: selected ? 'scale(1.12) translateY(-6px)' : 'scale(1)',
          opacity: disabled && !selected ? 0.5 : 1,
          fontFamily: 'Space Grotesk',
        }}
      >
        <span>{value}</span>
        {selected && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
            style={{ background: '#3DFFA0', color: '#0D0F1A' }}
          >
            ✓
          </div>
        )}
        {/* Corner decorations */}
        <span
          style={{
            position: 'absolute',
            top: 4,
            left: 6,
            fontSize: '0.55rem',
            opacity: 0.6,
            color: selected ? 'rgba(255,255,255,0.7)' : '#7B82A8',
            fontFamily: 'Space Grotesk',
          }}
        >
          {value}
        </span>
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            right: 6,
            fontSize: '0.55rem',
            opacity: 0.6,
            transform: 'rotate(180deg)',
            color: selected ? 'rgba(255,255,255,0.7)' : '#7B82A8',
            fontFamily: 'Space Grotesk',
          }}
        >
          {value}
        </span>
      </div>
    </button>
  )
}
