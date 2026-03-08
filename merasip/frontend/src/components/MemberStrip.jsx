const MEMBER_COLORS = ['#1B3A6B', '#0A7C4E', '#B91C1C', '#5B21B6', '#92400E', '#2E5299']

const inr = (v) => {
  if (v == null) return '—'
  const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toFixed(0)
  return `${v < 0 ? '-' : ''}${s}`
}

export default function MemberStrip({ member, index = 0, onClick }) {
  const color = MEMBER_COLORS[index % MEMBER_COLORS.length]
  const xirr = member.xirr
  const isPositive = (xirr ?? 0) >= 0

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: '#fff',
        border: '1px solid #D1D5DB', borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Color dot */}
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, flexShrink: 0,
      }}>
        {member.name?.charAt(0) || '?'}
      </div>

      {/* Name & type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.name}
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>
          {member.type || 'Individual'} {member.relation ? `| ${member.relation}` : ''}
        </div>
      </div>

      {/* Value */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
          {inr(member.val ?? member.value)}
        </div>
        {xirr != null && (
          <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? '#0A7C4E' : '#B91C1C' }}>
            {isPositive ? '+' : ''}{xirr.toFixed(1)}% XIRR
          </div>
        )}
      </div>
    </div>
  )
}
