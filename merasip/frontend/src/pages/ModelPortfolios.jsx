import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ComplianceFooter from '../components/ComplianceFooter'

// ─── COLOUR TOKENS ───────────────────────────────────────────
const C = {
  navy: '#1B3A6B', navyDim: '#2E5299', navyPale: '#E8EEF8',
  green: '#0A7C4E', greenPale: '#F0FAF5',
  red: '#B91C1C', redPale: '#FEF2F2',
  amber: '#92400E', amberPale: '#FFFBEB',
  violet: '#5B21B6', violetPale: '#F5F3FF',
  ink: '#111827', muted: '#6B7280', border: '#D1D5DB',
  bg0: '#FFFFFF', bg1: '#FAFBFC', bg2: '#F4F6F9',
}

// ─── MODEL DATA ──────────────────────────────────────────────
const MODELS = {
  Conservative: {
    description: 'Capital preservation focused. Ideal for retirees or those with less than 3-year horizon.',
    color: '#0A7C4E',
    riskLevel: 1,
    allocation: { equity: 30, debt: 60, gold: 10 },
    equity_split: [
      { category: 'Large Cap', pct: 70, role: 'Stability & steady growth' },
      { category: 'Flexi Cap', pct: 30, role: 'Diversified equity exposure' },
    ],
    debt_split: [
      { category: 'Short Duration', pct: 40, role: 'Low volatility income' },
      { category: 'Corporate Bond', pct: 30, role: 'Better yields with safety' },
      { category: 'Liquid', pct: 30, role: 'Emergency liquidity' },
    ],
  },
  Moderate: {
    description: 'Balanced approach. Good for 3-7 year goals with moderate risk tolerance.',
    color: '#2E5299',
    riskLevel: 2,
    allocation: { equity: 50, debt: 40, gold: 10 },
    equity_split: [
      { category: 'Large Cap', pct: 40, role: 'Core stability' },
      { category: 'Flexi Cap', pct: 30, role: 'Diversified growth' },
      { category: 'Mid Cap', pct: 20, role: 'Growth kicker' },
      { category: 'ELSS', pct: 10, role: 'Tax saving + equity' },
    ],
    debt_split: [
      { category: 'Short Duration', pct: 50, role: 'Low volatility income' },
      { category: 'Corporate Bond', pct: 50, role: 'Better yields' },
    ],
  },
  Aggressive: {
    description: 'Growth-oriented. Ideal for 7-15 year goals with high risk appetite.',
    color: '#92400E',
    riskLevel: 3,
    allocation: { equity: 70, debt: 20, gold: 10 },
    equity_split: [
      { category: 'Large Cap', pct: 30, role: 'Stable foundation' },
      { category: 'Flexi Cap', pct: 25, role: 'All-weather growth' },
      { category: 'Mid Cap', pct: 25, role: 'Growth engine' },
      { category: 'Small Cap', pct: 10, role: 'High growth potential' },
      { category: 'ELSS', pct: 10, role: 'Tax saving + growth' },
    ],
    debt_split: [
      { category: 'Short Duration', pct: 50, role: 'Stability anchor' },
      { category: 'Corporate Bond', pct: 50, role: 'Yield enhancement' },
    ],
  },
  'Very Aggressive': {
    description: 'Maximum growth. For 15+ year goals, high risk tolerance, and strong income stability.',
    color: '#B91C1C',
    riskLevel: 4,
    allocation: { equity: 85, debt: 10, gold: 5 },
    equity_split: [
      { category: 'Flexi Cap', pct: 30, role: 'Core growth engine' },
      { category: 'Mid Cap', pct: 25, role: 'Outperformance potential' },
      { category: 'Small Cap', pct: 20, role: 'Maximum growth' },
      { category: 'Large Cap', pct: 15, role: 'Stability anchor' },
      { category: 'Sectoral/Thematic', pct: 10, role: 'Tactical opportunities' },
    ],
    debt_split: [
      { category: 'Liquid', pct: 100, role: 'Emergency only' },
    ],
  },
}

const PROFILE_ICONS = {
  Conservative: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  Moderate: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
  Aggressive: 'M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z',
  'Very Aggressive': 'M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31A7.98 7.98 0 0012 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31z',
}

const ALLOC_COLORS = {
  equity: C.navy,
  debt: C.green,
  gold: C.amber,
}

// ─── SVG RISK GAUGE (semi-circle) ────────────────────────────
function RiskGauge({ level, color, size = 80 }) {
  // level: 1-4
  const maxLevel = 4
  const cx = size / 2, cy = size / 2 + 4
  const r = size / 2 - 8
  const startAngle = Math.PI // left
  const endAngle = 0       // right
  const sweepAngle = Math.PI * (level / maxLevel)

  const arcPath = (startA, endA) => {
    const x1 = cx + r * Math.cos(startA)
    const y1 = cy - r * Math.sin(startA)
    const x2 = cx + r * Math.cos(endA)
    const y2 = cy - r * Math.sin(endA)
    const largeArc = (startA - endA) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Background arc (full semi-circle)
  const bgArc = arcPath(Math.PI, 0)
  // Value arc
  const valEndAngle = Math.PI - sweepAngle
  const valArc = arcPath(Math.PI, valEndAngle)

  // Needle position
  const needleAngle = Math.PI - sweepAngle
  const nx = cx + (r - 6) * Math.cos(needleAngle)
  const ny = cy - (r - 6) * Math.sin(needleAngle)

  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      <path d={bgArc} fill="none" stroke={C.border} strokeWidth={6} strokeLinecap="round" />
      <path d={valArc} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <circle cx={nx} cy={ny} r={3} fill={color} />
      <circle cx={cx} cy={cy} r={2} fill={C.muted} />
      <text x={cx} y={cy + 10} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily="system-ui">
        {['Low', 'Medium', 'High', 'Very High'][level - 1]}
      </text>
    </svg>
  )
}

// ─── SVG DONUT CHART ─────────────────────────────────────────
function DonutChart({ allocation, size = 220 }) {
  const cx = size / 2, cy = size / 2
  const outerR = size / 2 - 10
  const innerR = outerR * 0.6
  const entries = Object.entries(allocation).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)

  let cumulative = 0
  const segments = entries.map(([key, value]) => {
    const startPct = cumulative
    const endPct = cumulative + value / total
    cumulative = endPct
    return { key, value, startPct, endPct, color: ALLOC_COLORS[key] || C.muted }
  })

  const polarToCartesian = (angle) => ({
    x: cx + outerR * Math.cos(angle),
    y: cy + outerR * Math.sin(angle),
  })

  const polarToCartesianInner = (angle) => ({
    x: cx + innerR * Math.cos(angle),
    y: cy + innerR * Math.sin(angle),
  })

  const getArcPath = (startPct, endPct) => {
    const startAngle = startPct * 2 * Math.PI - Math.PI / 2
    const endAngle = endPct * 2 * Math.PI - Math.PI / 2

    const outerStart = polarToCartesian(startAngle)
    const outerEnd = polarToCartesian(endAngle)
    const innerStart = polarToCartesianInner(startAngle)
    const innerEnd = polarToCartesianInner(endAngle)

    const largeArc = (endPct - startPct) > 0.5 ? 1 : 0

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ')
  }

  // Label positions (midpoint of each arc)
  const getLabel = (seg) => {
    const midAngle = ((seg.startPct + seg.endPct) / 2) * 2 * Math.PI - Math.PI / 2
    const labelR = (outerR + innerR) / 2
    return {
      x: cx + labelR * Math.cos(midAngle),
      y: cy + labelR * Math.sin(midAngle),
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {segments.map((seg, i) => (
        <path key={i} d={getArcPath(seg.startPct, seg.endPct)} fill={seg.color}
          stroke={C.bg0} strokeWidth={2} />
      ))}
      {segments.map((seg, i) => {
        const pos = getLabel(seg)
        return (
          <g key={`label-${i}`}>
            <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="#fff" fontSize={12}
              fontWeight={700} fontFamily="Georgia, serif">{seg.value}%</text>
            <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="#ffffffcc" fontSize={8}
              fontFamily="system-ui" textTransform="capitalize">{seg.key}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── GAP ANALYSIS STACKED BARS ───────────────────────────────
function StackedBar({ label, segments, maxValue = 100 }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{
        display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden',
        border: `1px solid ${C.border}`, background: C.bg2,
      }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            width: `${(seg.value / maxValue) * 100}%`,
            background: seg.color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'width 0.3s ease',
          }}>
            {seg.value >= 8 && (
              <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>{seg.value}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function GapAnalysis() {
  // Check for portfolio data in localStorage
  const portfolioData = useMemo(() => {
    try {
      const raw = localStorage.getItem('portfolio_analysis')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return null
  }, [])

  if (!portfolioData) {
    return (
      <div style={{
        background: C.navyPale, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>&#128202;</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
          No Portfolio Data Found
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>
          Upload your CAS statement to see how your current portfolio compares with our model portfolios.
        </div>
        <a href="/advisor/analyse" style={{
          display: 'inline-block', padding: '10px 24px', background: C.navy, color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700,
        }}>
          Upload CAS to Analyse
        </a>
      </div>
    )
  }

  // If we have portfolio data, show comparison
  const userAlloc = portfolioData.allocation || { equity: 0, debt: 0, gold: 0 }
  return (
    <div style={{ background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>
        Your Portfolio vs Model
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>YOUR PORTFOLIO</div>
          <StackedBar label="Allocation" segments={[
            { value: userAlloc.equity || 0, color: C.navy },
            { value: userAlloc.debt || 0, color: C.green },
            { value: userAlloc.gold || 0, color: C.amber },
          ]} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>MODEL PORTFOLIO</div>
          <StackedBar label="Allocation" segments={[
            { value: 70, color: C.navy },
            { value: 20, color: C.green },
            { value: 10, color: C.amber },
          ]} />
        </div>
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ModelPortfolios() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [selected, setSelected] = useState(null)

  const profileNames = Object.keys(MODELS)
  const selectedModel = selected ? MODELS[selected] : null

  // Build combined sub-allocation table for selected model
  const subAllocationRows = useMemo(() => {
    if (!selectedModel) return []
    const rows = []
    const eqPct = selectedModel.allocation.equity
    const debtPct = selectedModel.allocation.debt
    const goldPct = selectedModel.allocation.gold

    selectedModel.equity_split.forEach(s => {
      rows.push({
        type: 'Equity',
        category: s.category,
        pctOfAsset: s.pct,
        pctOfTotal: ((s.pct / 100) * eqPct).toFixed(1),
        role: s.role,
        color: C.navy,
      })
    })
    selectedModel.debt_split.forEach(s => {
      rows.push({
        type: 'Debt',
        category: s.category,
        pctOfAsset: s.pct,
        pctOfTotal: ((s.pct / 100) * debtPct).toFixed(1),
        role: s.role,
        color: C.green,
      })
    })
    if (goldPct > 0) {
      rows.push({
        type: 'Gold',
        category: 'Gold / SGBs',
        pctOfAsset: 100,
        pctOfTotal: goldPct.toFixed(1),
        role: 'Hedge & diversification',
        color: C.amber,
      })
    }
    return rows
  }, [selectedModel])

  return (
    <div style={{ minHeight: '100vh', background: C.bg1 }}>
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <header style={{ background: C.navy, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/advisor" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>MeraSIP</a>
          <nav style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Dashboard', href: '/advisor' },
              { label: 'Rebalance', href: '/advisor/rebalance' },
              { label: 'Analyse', href: '/advisor/analyse' },
              { label: 'Risk Profile', href: '/advisor/risk-profile' },
              { label: 'Goals', href: '/advisor/goals' },
              { label: 'Models', href: '/advisor/models' },
              { label: 'AI Advisor', href: '/advisor/ai' },
            ].map(link => (
              <a key={link.href} href={link.href}
                style={{
                  color: location.pathname === link.href ? '#fff' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '6px 12px',
                  borderRadius: 6,
                  background: location.pathname === link.href ? 'rgba(255,255,255,0.15)' : 'transparent',
                }}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/advisor/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{user?.name || user?.email}</span>
          </a>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>
            Model Portfolios
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            Research-backed asset allocation templates. Select a risk profile to explore its composition.
          </p>
        </div>

        {/* ─── SECTION 1: PROFILE SELECTOR ─────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230, 1fr))',
          gap: 14, marginBottom: 32,
        }}>
          {profileNames.map(name => {
            const model = MODELS[name]
            const isActive = selected === name
            return (
              <button key={name} onClick={() => setSelected(isActive ? null : name)} style={{
                background: isActive ? model.color : C.bg0,
                border: `2px solid ${isActive ? model.color : C.border}`,
                borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.2s ease',
                transform: isActive ? 'scale(1.02)' : 'none',
                boxShadow: isActive ? `0 4px 16px ${model.color}33` : 'none',
              }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.2)' : `${model.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill={isActive ? '#fff' : model.color}>
                    <path d={PROFILE_ICONS[name]} />
                  </svg>
                </div>

                {/* Name */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : C.ink,
                  marginBottom: 6,
                }}>{name}</div>

                {/* Risk Gauge */}
                <RiskGauge level={model.riskLevel} color={isActive ? '#fff' : model.color} size={70} />

                {/* Description */}
                <div style={{
                  fontSize: 11, color: isActive ? 'rgba(255,255,255,0.85)' : C.muted,
                  lineHeight: 1.4, marginTop: 6,
                }}>{model.description}</div>

                {/* Quick allocation preview */}
                <div style={{
                  display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10,
                }}>
                  {Object.entries(model.allocation).map(([key, val]) => (
                    <span key={key} style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: isActive ? 'rgba(255,255,255,0.2)' : `${ALLOC_COLORS[key]}12`,
                      color: isActive ? '#fff' : ALLOC_COLORS[key],
                      textTransform: 'capitalize',
                    }}>
                      {key} {val}%
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* ─── SECTION 2: SELECTED MODEL DETAIL ────────────────── */}
        {selectedModel && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start',
            }}>
              {/* Donut Chart */}
              <div style={{
                flex: '0 0 280px', background: C.bg0, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 20, textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
                  {selected} Allocation
                </div>
                <DonutChart allocation={selectedModel.allocation} size={200} />

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                  {Object.entries(selectedModel.allocation).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: ALLOC_COLORS[key] }} />
                      <span style={{ fontSize: 11, color: C.ink, fontWeight: 500, textTransform: 'capitalize' }}>{key}: {val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Allocation Table */}
              <div style={{
                flex: 1, minWidth: 380, background: C.bg0, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
                  Detailed Breakdown
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Asset', 'Category', 'Allocation', 'Portfolio %', 'Role'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${C.border}`,
                          fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subAllocationRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.bg2}` }}>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                            background: `${row.color}12`, color: row.color, textTransform: 'uppercase',
                          }}>{row.type}</span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: C.ink }}>{row.category}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 60, height: 6, borderRadius: 3, background: C.bg2,
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${row.pctOfAsset}%`, height: '100%', borderRadius: 3,
                                background: row.color, transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{row.pctOfAsset}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: C.muted, fontSize: 12 }}>{row.pctOfTotal}%</td>
                        <td style={{ padding: '8px 10px', color: C.muted, fontSize: 12 }}>{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px', marginTop: 8,
                  background: C.bg2, borderRadius: 6, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: C.ink }}>Total Portfolio</span>
                  <span style={{ fontWeight: 700, color: C.ink }}>
                    Equity {selectedModel.allocation.equity}% | Debt {selectedModel.allocation.debt}% | Gold {selectedModel.allocation.gold}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION 3: GAP ANALYSIS ─────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 14 }}>
            Gap Analysis
          </div>
          <GapAnalysis />
        </div>

        {/* ─── QUICK COMPARISON TABLE ──────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 14 }}>
            Model Comparison
          </div>
          <div style={{
            background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg2 }}>
                  {['Profile', 'Equity', 'Debt', 'Gold', 'Risk Level', 'Ideal For'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600,
                      color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileNames.map((name, i) => {
                  const m = MODELS[name]
                  const isActive = selected === name
                  return (
                    <tr key={name}
                      onClick={() => setSelected(name)}
                      style={{
                        cursor: 'pointer', background: isActive ? `${m.color}08` : 'transparent',
                        borderBottom: `1px solid ${C.bg2}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.bg2 }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: m.color }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                          {name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.navy }}>{m.allocation.equity}%</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.green }}>{m.allocation.debt}%</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.amber }}>{m.allocation.gold}%</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1, 2, 3, 4].map(l => (
                            <div key={l} style={{
                              width: 14, height: 6, borderRadius: 2,
                              background: l <= m.riskLevel ? m.color : C.bg2,
                            }} />
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: C.muted, fontSize: 12 }}>
                        {name === 'Conservative' && '< 3 year goals, retirees'}
                        {name === 'Moderate' && '3-7 year goals, balanced'}
                        {name === 'Aggressive' && '7-15 year goals, growth'}
                        {name === 'Very Aggressive' && '15+ years, max growth'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ComplianceFooter />
    </div>
  )
}
