const C = {
  navy: '#1B3A6B', green: '#0A7C4E', red: '#B91C1C', amber: '#92400E',
  violet: '#5B21B6', ink: '#111827', muted: '#6B7280', border: '#D1D5DB',
  bg1: '#FAFBFC', bg2: '#F4F6F9',
}

const ACTION_STYLES = {
  HOLD:   { bg: '#F0FAF5', color: C.green, label: 'HOLD' },
  SWITCH: { bg: '#FEF2F2', color: C.red,   label: 'SWITCH' },
  REVIEW: { bg: '#FFFBEB', color: C.amber, label: 'REVIEW' },
  EXIT:   { bg: '#FEF2F2', color: C.red,   label: 'EXIT' },
}

const inr = (v) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toFixed(0)
  return `${neg ? '-' : ''}${s}`
}

export default function PortfolioCard({ fund }) {
  const action = ACTION_STYLES[fund.action] || ACTION_STYLES.HOLD
  const absReturn = fund.abs_return ?? fund.abs
  const isPositive = (absReturn ?? 0) >= 0

  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
      padding: 16, marginBottom: 12,
      borderLeft: `4px solid ${action.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{fund.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {fund.category || fund.cat || '—'} {fund.plan ? `| ${fund.plan}` : ''}
            {fund.folio ? ` | Folio: ${fund.folio}` : ''}
          </div>
        </div>
        <span style={{
          background: action.bg, color: action.color,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          padding: '3px 10px', borderRadius: 4, whiteSpace: 'nowrap',
        }}>
          {action.label}
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: 8, marginTop: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted }}>Invested</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{inr(fund.invested ?? fund.inv)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.muted }}>Value</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{inr(fund.value ?? fund.val)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.muted }}>Return</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isPositive ? C.green : C.red }}>
            {absReturn != null ? `${isPositive ? '+' : ''}${absReturn.toFixed(1)}%` : '—'}
          </div>
        </div>
        {fund.xirr != null && (
          <div>
            <div style={{ fontSize: 10, color: C.muted }}>XIRR</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: fund.xirr >= 0 ? C.green : C.red }}>
              {fund.xirr >= 0 ? '+' : ''}{fund.xirr.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {fund.analysis && (
        <div style={{
          marginTop: 10, padding: '8px 10px', background: C.bg2,
          borderRadius: 4, fontSize: 11, color: C.ink, lineHeight: 1.5,
        }}>
          {fund.analysis}
        </div>
      )}

      {fund.action_detail && (
        <div style={{
          marginTop: 6, fontSize: 11, color: action.color, fontWeight: 600,
        }}>
          Recommended: Switch to {fund.action_detail}
        </div>
      )}
    </div>
  )
}
