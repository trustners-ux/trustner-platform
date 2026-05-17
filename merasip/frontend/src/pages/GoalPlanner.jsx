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

const GOAL_PRESETS = [
  'Retirement',
  'Child Education',
  'Child Marriage',
  'House Purchase',
  'Car Purchase',
  'Emergency Fund',
  'Vacation',
  'Custom',
]

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
const PRIORITY_COLORS = {
  High:   { bg: C.redPale, text: C.red },
  Medium: { bg: C.amberPale, text: C.amber },
  Low:    { bg: C.greenPale, text: C.green },
}

// ─── HELPERS ─────────────────────────────────────────────────
const inr = (v) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  return `${neg ? '-' : ''}₹${abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr` : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L` : abs.toLocaleString('en-IN')}`
}

const parseNum = (s) => {
  if (!s) return 0
  const cleaned = String(s).replace(/[₹,\s]/g, '')
  return parseFloat(cleaned) || 0
}

const formatInput = (v) => {
  const num = parseNum(v)
  if (!num) return ''
  return num.toLocaleString('en-IN')
}

const defaultGoal = () => ({
  id: Date.now() + Math.random(),
  name: 'Retirement',
  customName: '',
  targetAmount: '',
  targetDate: '',
  currentSavings: '',
  monthlySIP: '',
  expectedReturn: 12,
  inflation: 6,
  priority: 'Medium',
})

// ─── FINANCIAL CALCULATIONS ──────────────────────────────────
function computeProjection(goal) {
  const target = parseNum(goal.targetAmount)
  const current = parseNum(goal.currentSavings)
  const sip = parseNum(goal.monthlySIP)
  const annualReturn = goal.expectedReturn / 100
  const annualInflation = goal.inflation / 100
  const monthlyRate = annualReturn / 12

  if (!goal.targetDate) {
    return { valid: false }
  }

  const now = new Date()
  const end = new Date(goal.targetDate)
  const totalMonths = Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()))
  const years = totalMonths / 12

  if (totalMonths <= 0 || target <= 0) {
    return { valid: false }
  }

  // Inflation-adjusted target
  const inflationAdjustedTarget = target * Math.pow(1 + annualInflation, years)

  // FV of lumpsum
  const fvLumpsum = current * Math.pow(1 + monthlyRate, totalMonths)

  // FV of SIP (annuity due — SIP paid at beginning of month)
  const fvSIP = sip > 0 && monthlyRate > 0
    ? sip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
    : sip * totalMonths

  const projectedCorpus = fvLumpsum + fvSIP
  const gap = inflationAdjustedTarget - projectedCorpus
  const onTrack = gap <= 0

  // Required SIP to fill the gap (PMT formula)
  let requiredSIP = 0
  if (gap > 0 && totalMonths > 0 && monthlyRate > 0) {
    const remaining = inflationAdjustedTarget - fvLumpsum
    if (remaining > 0) {
      requiredSIP = (remaining * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate))
    }
  }

  // Probability score
  const probability = onTrack ? 100 : Math.min(99, Math.max(1, Math.round((projectedCorpus / inflationAdjustedTarget) * 100)))

  // Year-by-year projection for chart
  const yearlyProjection = []
  for (let y = 0; y <= Math.ceil(years); y++) {
    const m = Math.min(y * 12, totalMonths)
    const fvL = current * Math.pow(1 + monthlyRate, m)
    const fvS = sip > 0 && monthlyRate > 0
      ? sip * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate)
      : sip * m
    yearlyProjection.push({ year: y, value: fvL + fvS })
  }

  return {
    valid: true,
    years,
    totalMonths,
    inflationAdjustedTarget,
    projectedCorpus,
    gap,
    onTrack,
    requiredSIP,
    probability,
    yearlyProjection,
    progressPct: Math.min(100, Math.max(0, (projectedCorpus / inflationAdjustedTarget) * 100)),
  }
}

// ─── SVG LINE CHART ──────────────────────────────────────────
function GrowthChart({ projection, target }) {
  if (!projection.valid || projection.yearlyProjection.length < 2) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>
        Enter goal details to see the growth chart
      </div>
    )
  }

  const data = projection.yearlyProjection
  const W = 520, H = 200, PAD_LEFT = 55, PAD_RIGHT = 20, PAD_TOP = 20, PAD_BOTTOM = 30
  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOTTOM

  const maxVal = Math.max(target, ...data.map(d => d.value)) * 1.1
  const maxYear = data[data.length - 1].year

  const xScale = (year) => PAD_LEFT + (year / maxYear) * chartW
  const yScale = (val) => PAD_TOP + chartH - (val / maxVal) * chartH

  // Build path
  const linePath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.year).toFixed(1)} ${yScale(d.value).toFixed(1)}`
  ).join(' ')

  // Fill area path
  const areaPath = linePath +
    ` L ${xScale(data[data.length - 1].year).toFixed(1)} ${yScale(0).toFixed(1)}` +
    ` L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`

  // Target line Y
  const targetY = yScale(target)

  // Y-axis labels
  const yTicks = 5
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i)

  // X-axis labels
  const xStep = Math.max(1, Math.ceil(maxYear / 6))
  const xLabels = []
  for (let y = 0; y <= maxYear; y += xStep) xLabels.push(y)
  if (xLabels[xLabels.length - 1] !== maxYear) xLabels.push(maxYear)

  const shortInr = (v) => {
    if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`
    if (v >= 1e5) return `${(v / 1e5).toFixed(0)}L`
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
    return v.toFixed(0)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      {/* Grid lines */}
      {yLabels.map((v, i) => (
        <line key={i} x1={PAD_LEFT} y1={yScale(v)} x2={W - PAD_RIGHT} y2={yScale(v)}
          stroke={C.border} strokeWidth={0.5} strokeDasharray="3,3" />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((v, i) => (
        <text key={i} x={PAD_LEFT - 6} y={yScale(v) + 4} textAnchor="end"
          fill={C.muted} fontSize={9} fontFamily="system-ui">{shortInr(v)}</text>
      ))}

      {/* X-axis labels */}
      {xLabels.map((yr, i) => (
        <text key={i} x={xScale(yr)} y={H - 6} textAnchor="middle"
          fill={C.muted} fontSize={9} fontFamily="system-ui">Yr {yr}</text>
      ))}

      {/* Target line */}
      <line x1={PAD_LEFT} y1={targetY} x2={W - PAD_RIGHT} y2={targetY}
        stroke={C.red} strokeWidth={1.5} strokeDasharray="6,4" />
      <text x={W - PAD_RIGHT + 2} y={targetY + 3} fill={C.red} fontSize={8} fontFamily="system-ui">Target</text>

      {/* Area fill */}
      <path d={areaPath} fill={C.navyPale} opacity={0.5} />

      {/* Projection line */}
      <path d={linePath} fill="none" stroke={C.navy} strokeWidth={2} />

      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i} cx={xScale(d.year)} cy={yScale(d.value)} r={3}
          fill={C.navy} stroke={C.bg0} strokeWidth={1.5} />
      ))}

      {/* Legend */}
      <rect x={PAD_LEFT + 8} y={4} width={8} height={3} rx={1} fill={C.navy} />
      <text x={PAD_LEFT + 20} y={8} fill={C.ink} fontSize={8} fontFamily="system-ui">Your Projection</text>
      <line x1={PAD_LEFT + 100} y1={6} x2={PAD_LEFT + 115} y2={6} stroke={C.red} strokeWidth={1.5} strokeDasharray="4,2" />
      <text x={PAD_LEFT + 119} y={8} fill={C.red} fontSize={8} fontFamily="system-ui">Target</text>
    </svg>
  )
}

// ─── PROGRESS BAR ────────────────────────────────────────────
function ProgressBar({ pct, height = 16 }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped >= 100 ? C.green : clamped >= 70 ? C.amber : C.red
  return (
    <div style={{ width: '100%', background: C.bg2, borderRadius: height / 2, height, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div style={{
        width: `${clamped}%`, height: '100%', borderRadius: height / 2,
        background: color, transition: 'width 0.5s ease, background 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: clamped > 15 ? 8 : 0,
      }}>
        {clamped > 15 && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{clamped.toFixed(0)}%</span>}
      </div>
    </div>
  )
}

// ─── SUMMARY CARD ────────────────────────────────────────────
function SummaryCard({ label, value, color, sub }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, background: C.bg0, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || C.navy, fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ─── GOAL MINI CARD (for multi-goal dashboard) ──────────────
function GoalCard({ goal, projection, onRemove }) {
  const displayName = goal.name === 'Custom' ? (goal.customName || 'Custom Goal') : goal.name
  const pc = PRIORITY_COLORS[goal.priority]
  return (
    <div style={{
      background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{displayName}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{inr(parseNum(goal.targetAmount))} by {goal.targetDate || '—'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: pc.bg, color: pc.text, fontSize: 9, fontWeight: 700,
            padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{goal.priority}</span>
          {projection.valid && (
            <span style={{
              background: projection.onTrack ? C.greenPale : C.redPale,
              color: projection.onTrack ? C.green : C.red,
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            }}>
              {projection.onTrack ? 'ON TRACK' : 'GAP'}
            </span>
          )}
        </div>
      </div>

      {projection.valid && (
        <>
          <ProgressBar pct={projection.progressPct} height={10} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
            <span>SIP: {inr(parseNum(goal.monthlySIP))}/mo</span>
            <span>{projection.years.toFixed(1)} yrs</span>
            <span>{projection.progressPct.toFixed(0)}% covered</span>
          </div>
        </>
      )}

      <button onClick={onRemove} style={{
        alignSelf: 'flex-end', background: 'none', border: 'none', color: C.red, fontSize: 10,
        cursor: 'pointer', padding: '2px 4px', opacity: 0.6,
      }}>Remove</button>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function GoalPlanner() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()

  // Current form state
  const [form, setForm] = useState(defaultGoal())
  // Saved goals
  const [goals, setGoals] = useState([])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // Live projection
  const projection = useMemo(() => computeProjection(form), [
    form.targetAmount, form.targetDate, form.currentSavings,
    form.monthlySIP, form.expectedReturn, form.inflation,
  ])

  // Multi-goal projections
  const goalProjections = useMemo(() => goals.map(g => ({ goal: g, projection: computeProjection(g) })), [goals])

  // Multi-goal summary
  const totalTarget = goalProjections.reduce((s, gp) => s + (gp.projection.valid ? gp.projection.inflationAdjustedTarget : 0), 0)
  const totalSIP = goals.reduce((s, g) => s + parseNum(g.monthlySIP), 0)
  const totalProjected = goalProjections.reduce((s, gp) => s + (gp.projection.valid ? gp.projection.projectedCorpus : 0), 0)
  const overallProgress = totalTarget > 0 ? (totalProjected / totalTarget) * 100 : 0

  const addGoal = () => {
    if (!form.targetDate || parseNum(form.targetAmount) <= 0) return
    setGoals(prev => [...prev, { ...form, id: Date.now() + Math.random() }])
    setForm(defaultGoal())
  }

  const removeGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id))

  // ─── INPUT COMPONENTS ───────────────────────────────────────
  const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{children}</label>
  )

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
    borderRadius: 6, fontSize: 13, color: C.ink, outline: 'none', boxSizing: 'border-box',
    background: C.bg0,
  }

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
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>
            Goal Planner
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            Plan financial goals with real-time projections. Add goals, track progress, and see if your clients are on track.
          </p>
        </div>

        {/* ─── TWO-PANEL LAYOUT ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── LEFT: GOAL INPUT FORM (40%) ─────────────────────── */}
          <div style={{
            flex: '0 0 38%', minWidth: 320, background: C.bg0, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 }}>
              Define Goal
            </div>

            {/* Goal Name */}
            <div style={{ marginBottom: 14 }}>
              <Label>Goal Name</Label>
              <select
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {GOAL_PRESETS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {form.name === 'Custom' && (
              <div style={{ marginBottom: 14 }}>
                <Label>Custom Goal Name</Label>
                <input
                  type="text"
                  value={form.customName}
                  onChange={e => updateField('customName', e.target.value)}
                  placeholder="e.g., World Tour"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Target Amount */}
            <div style={{ marginBottom: 14 }}>
              <Label>Target Amount (₹)</Label>
              <input
                type="text"
                value={form.targetAmount ? `₹${formatInput(form.targetAmount)}` : ''}
                onChange={e => updateField('targetAmount', e.target.value.replace(/[₹,\s]/g, ''))}
                placeholder="₹50,00,000"
                style={inputStyle}
              />
            </div>

            {/* Target Date */}
            <div style={{ marginBottom: 14 }}>
              <Label>Target Date</Label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => updateField('targetDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={inputStyle}
              />
            </div>

            {/* Current Savings */}
            <div style={{ marginBottom: 14 }}>
              <Label>Current Savings (₹)</Label>
              <input
                type="text"
                value={form.currentSavings ? `₹${formatInput(form.currentSavings)}` : ''}
                onChange={e => updateField('currentSavings', e.target.value.replace(/[₹,\s]/g, ''))}
                placeholder="₹0"
                style={inputStyle}
              />
            </div>

            {/* Monthly SIP */}
            <div style={{ marginBottom: 14 }}>
              <Label>Monthly SIP (₹)</Label>
              <input
                type="text"
                value={form.monthlySIP ? `₹${formatInput(form.monthlySIP)}` : ''}
                onChange={e => updateField('monthlySIP', e.target.value.replace(/[₹,\s]/g, ''))}
                placeholder="₹10,000"
                style={inputStyle}
              />
            </div>

            {/* Expected Return Slider */}
            <div style={{ marginBottom: 14 }}>
              <Label>Expected Annual Return: {form.expectedReturn}%</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: C.muted }}>6%</span>
                <input
                  type="range" min={6} max={18} step={0.5}
                  value={form.expectedReturn}
                  onChange={e => updateField('expectedReturn', parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: C.navy }}
                />
                <span style={{ fontSize: 10, color: C.muted }}>18%</span>
              </div>
            </div>

            {/* Inflation Slider */}
            <div style={{ marginBottom: 14 }}>
              <Label>Inflation: {form.inflation}%</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: C.muted }}>4%</span>
                <input
                  type="range" min={4} max={10} step={0.5}
                  value={form.inflation}
                  onChange={e => updateField('inflation', parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: C.amber }}
                />
                <span style={{ fontSize: 10, color: C.muted }}>10%</span>
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 20 }}>
              <Label>Priority</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITY_OPTIONS.map(p => {
                  const active = form.priority === p
                  const pc = PRIORITY_COLORS[p]
                  return (
                    <button
                      key={p}
                      onClick={() => updateField('priority', p)}
                      style={{
                        flex: 1, padding: '8px 0', border: `1.5px solid ${active ? pc.text : C.border}`,
                        borderRadius: 6, background: active ? pc.bg : C.bg0,
                        color: active ? pc.text : C.muted, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Add Goal Button */}
            <button
              onClick={addGoal}
              disabled={!form.targetDate || parseNum(form.targetAmount) <= 0}
              style={{
                width: '100%', padding: '12px 0', background: C.navy, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: !form.targetDate || parseNum(form.targetAmount) <= 0 ? 'not-allowed' : 'pointer',
                opacity: !form.targetDate || parseNum(form.targetAmount) <= 0 ? 0.5 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              + Add Goal to Dashboard
            </button>
          </div>

          {/* ── RIGHT: LIVE PROJECTION (60%) ─────────────────────── */}
          <div style={{ flex: 1, minWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status indicator */}
            <div style={{
              background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Live Projection</div>
                {projection.valid && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: projection.onTrack ? C.greenPale : C.redPale,
                    color: projection.onTrack ? C.green : C.red,
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    <span style={{ fontSize: 16 }}>{projection.onTrack ? '✓' : '⚠'}</span>
                    {projection.onTrack ? 'On Track' : 'Gap Detected'}
                  </div>
                )}
              </div>

              {!projection.valid ? (
                <div style={{ color: C.muted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
                  Fill in the goal details to see real-time projections
                </div>
              ) : (
                <>
                  {/* Key Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 2 }}>INFLATION-ADJUSTED TARGET</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: 'Georgia, serif' }}>{inr(projection.inflationAdjustedTarget)}</div>
                    </div>
                    <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 2 }}>PROJECTED CORPUS</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>{inr(projection.projectedCorpus)}</div>
                    </div>
                    <div style={{ background: projection.onTrack ? C.greenPale : C.redPale, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 2 }}>{projection.onTrack ? 'SURPLUS' : 'GAP'}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: projection.onTrack ? C.green : C.red, fontFamily: 'Georgia, serif' }}>
                        {inr(Math.abs(projection.gap))}
                      </div>
                    </div>
                    <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 2 }}>REQUIRED SIP</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: projection.requiredSIP > 0 ? C.amber : C.green, fontFamily: 'Georgia, serif' }}>
                        {projection.requiredSIP > 0 ? `${inr(projection.requiredSIP)}/mo` : 'Current SIP is sufficient'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>GOAL COVERAGE</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: projection.progressPct >= 100 ? C.green : C.amber }}>{projection.progressPct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={projection.progressPct} />
                  </div>

                  {/* Chart */}
                  <div style={{ marginBottom: 16 }}>
                    <GrowthChart
                      projection={projection}
                      target={projection.inflationAdjustedTarget}
                    />
                  </div>

                  {/* Summary Cards */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <SummaryCard
                      label="Years to Goal"
                      value={`${projection.years.toFixed(1)} yrs`}
                      color={C.navy}
                    />
                    <SummaryCard
                      label="Monthly SIP Needed"
                      value={projection.requiredSIP > 0 ? inr(projection.requiredSIP) : inr(parseNum(form.monthlySIP))}
                      color={projection.requiredSIP > 0 ? C.amber : C.green}
                      sub={projection.requiredSIP > 0 ? 'To reach inflation-adjusted target' : 'Your current SIP works'}
                    />
                    <SummaryCard
                      label="Gap Amount"
                      value={projection.onTrack ? 'None' : inr(projection.gap)}
                      color={projection.onTrack ? C.green : C.red}
                    />
                    <SummaryCard
                      label="Probability"
                      value={projection.probability >= 100 ? 'High' : `${projection.probability}%`}
                      color={projection.probability >= 80 ? C.green : projection.probability >= 50 ? C.amber : C.red}
                      sub={projection.probability >= 80 ? 'Strong likelihood' : projection.probability >= 50 ? 'Needs attention' : 'Increase SIP recommended'}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── MULTI-GOAL DASHBOARD ─────────────────────────────── */}
        {goals.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 16 }}>
              My Goals ({goals.length})
            </div>

            {/* Summary Bar */}
            <div style={{
              display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
              background: C.navyPale, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px',
            }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>TOTAL TARGET</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>{inr(totalTarget)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>TOTAL MONTHLY SIP</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: 'Georgia, serif' }}>{inr(totalSIP)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>OVERALL PROGRESS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                  <ProgressBar pct={overallProgress} height={10} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: overallProgress >= 100 ? C.green : C.amber, whiteSpace: 'nowrap' }}>{overallProgress.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Goal Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 14 }}>
              {goalProjections.map(({ goal, projection: proj }) => (
                <GoalCard key={goal.id} goal={goal} projection={proj} onRemove={() => removeGoal(goal.id)} />
              ))}
            </div>
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}
