import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
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

// ─── PROFILE COLOUR MAP ─────────────────────────────────────
const PROFILE_COLORS = {
  Conservative:      { primary: C.green,  pale: C.greenPale,  ring: '#10B981' },
  Moderate:          { primary: C.navy,   pale: C.navyPale,   ring: '#3B82F6' },
  Aggressive:        { primary: C.amber,  pale: C.amberPale,  ring: '#F59E0B' },
  'Very Aggressive': { primary: C.red,    pale: C.redPale,    ring: '#EF4444' },
}

// ─── HARDCODED QUESTIONS (API fallback) ──────────────────────
const FALLBACK_QUESTIONS = [
  { id: 'age', text: 'What is your age group?', options: [
    { label: 'Under 30', weight: 10 },
    { label: '30 – 40', weight: 8 },
    { label: '40 – 50', weight: 6 },
    { label: '50 – 60', weight: 4 },
    { label: '60+', weight: 2 },
  ]},
  { id: 'income', text: 'What is your annual income?', options: [
    { label: 'Below ₹5 Lakh', weight: 2 },
    { label: '₹5 – 10 Lakh', weight: 4 },
    { label: '₹10 – 25 Lakh', weight: 6 },
    { label: '₹25 – 50 Lakh', weight: 8 },
    { label: '₹50 Lakh+', weight: 10 },
  ]},
  { id: 'savings', text: 'What percentage of your income do you save monthly?', options: [
    { label: 'Less than 10%', weight: 2 },
    { label: '10% – 20%', weight: 4 },
    { label: '20% – 30%', weight: 6 },
    { label: '30% – 50%', weight: 8 },
    { label: 'Over 50%', weight: 10 },
  ]},
  { id: 'horizon', text: 'What is your investment time horizon?', options: [
    { label: 'Less than 1 year', weight: 2 },
    { label: '1 – 3 years', weight: 4 },
    { label: '3 – 5 years', weight: 6 },
    { label: '5 – 10 years', weight: 8 },
    { label: '10+ years', weight: 10 },
  ]},
  { id: 'experience', text: 'How much investment experience do you have?', options: [
    { label: "None — I'm new", weight: 2 },
    { label: 'Less than 2 years', weight: 4 },
    { label: '2 – 5 years', weight: 6 },
    { label: '5 – 10 years', weight: 8 },
    { label: '10+ years', weight: 10 },
  ]},
  { id: 'market_drop', text: 'If the market drops 20% tomorrow, what would you do?', options: [
    { label: 'Sell everything immediately', weight: 2 },
    { label: 'Sell some investments', weight: 4 },
    { label: 'Do nothing, wait it out', weight: 6 },
    { label: 'Buy more at lower prices', weight: 8 },
    { label: 'Invest aggressively at the dip', weight: 10 },
  ]},
  { id: 'risk_return', text: 'Which statement best describes your preference?', options: [
    { label: 'I want zero risk, even if returns are low', weight: 2 },
    { label: 'Low risk with moderate returns', weight: 4 },
    { label: 'Moderate risk for good returns', weight: 7 },
    { label: 'High risk for potentially high returns', weight: 10 },
  ]},
  { id: 'liabilities', text: 'What is your current liability burden (EMIs, loans)?', options: [
    { label: 'More than 50% of income', weight: 2 },
    { label: '30% – 50% of income', weight: 4 },
    { label: '10% – 30% of income', weight: 6 },
    { label: 'Less than 10% of income', weight: 8 },
    { label: 'No liabilities', weight: 10 },
  ]},
  { id: 'emergency', text: 'How large is your emergency fund?', options: [
    { label: 'No emergency fund', weight: 2 },
    { label: 'Less than 3 months expenses', weight: 4 },
    { label: '3 – 6 months expenses', weight: 6 },
    { label: '6 – 12 months expenses', weight: 8 },
    { label: 'More than 12 months expenses', weight: 10 },
  ]},
  { id: 'goal', text: 'What is your primary financial goal?', options: [
    { label: 'Capital preservation', weight: 2 },
    { label: 'Regular income', weight: 4 },
    { label: 'Balanced growth', weight: 6 },
    { label: 'Aggressive growth', weight: 8 },
    { label: 'Long-term wealth creation', weight: 10 },
  ]},
]

// ─── MODEL PORTFOLIOS ────────────────────────────────────────
const MODEL_PORTFOLIOS = {
  Conservative: {
    allocation: { Equity: 25, Debt: 60, Gold: 10, Cash: 5 },
    subs: [
      { name: 'Large Cap', pct: 15, color: '#2563EB' },
      { name: 'Flexi Cap', pct: 10, color: '#3B82F6' },
      { name: 'Short Duration Debt', pct: 25, color: '#10B981' },
      { name: 'Corporate Bond', pct: 20, color: '#34D399' },
      { name: 'Gilt Fund', pct: 15, color: '#6EE7B7' },
      { name: 'Gold Fund', pct: 10, color: '#F59E0B' },
      { name: 'Liquid Fund', pct: 5, color: '#9CA3AF' },
    ],
    description: 'Your profile suggests a preference for capital safety with modest growth. A debt-heavy portfolio cushions volatility while a small equity allocation provides inflation-beating returns over time.',
  },
  Moderate: {
    allocation: { Equity: 50, Debt: 35, Gold: 10, Cash: 5 },
    subs: [
      { name: 'Large Cap', pct: 20, color: '#2563EB' },
      { name: 'Flexi Cap', pct: 15, color: '#3B82F6' },
      { name: 'Mid Cap', pct: 10, color: '#60A5FA' },
      { name: 'Value / Contra', pct: 5, color: '#93C5FD' },
      { name: 'Short Duration Debt', pct: 15, color: '#10B981' },
      { name: 'Dynamic Bond', pct: 15, color: '#34D399' },
      { name: 'Arbitrage', pct: 5, color: '#6EE7B7' },
      { name: 'Gold Fund', pct: 10, color: '#F59E0B' },
      { name: 'Liquid Fund', pct: 5, color: '#9CA3AF' },
    ],
    description: 'You are comfortable with moderate risk for better returns. A balanced 50-35 equity-debt split aims for steady compounding while debt provides a cushion during market corrections.',
  },
  Aggressive: {
    allocation: { Equity: 70, Debt: 15, Gold: 10, Cash: 5 },
    subs: [
      { name: 'Large Cap', pct: 20, color: '#2563EB' },
      { name: 'Flexi Cap', pct: 20, color: '#3B82F6' },
      { name: 'Mid Cap', pct: 15, color: '#60A5FA' },
      { name: 'Small Cap', pct: 10, color: '#93C5FD' },
      { name: 'Sectoral / Thematic', pct: 5, color: '#BFDBFE' },
      { name: 'Dynamic Bond', pct: 10, color: '#10B981' },
      { name: 'Liquid Fund', pct: 5, color: '#34D399' },
      { name: 'Gold Fund', pct: 10, color: '#F59E0B' },
      { name: 'Cash / Overnight', pct: 5, color: '#9CA3AF' },
    ],
    description: 'You have a strong appetite for growth and can tolerate short-term volatility. A 70% equity allocation across market caps aims for wealth creation, with debt and gold acting as stabilisers.',
  },
  'Very Aggressive': {
    allocation: { Equity: 85, Debt: 5, Gold: 5, Cash: 5 },
    subs: [
      { name: 'Large Cap', pct: 20, color: '#2563EB' },
      { name: 'Flexi Cap', pct: 25, color: '#3B82F6' },
      { name: 'Mid Cap', pct: 15, color: '#60A5FA' },
      { name: 'Small Cap', pct: 15, color: '#93C5FD' },
      { name: 'Sectoral / Thematic', pct: 10, color: '#BFDBFE' },
      { name: 'Dynamic Bond', pct: 5, color: '#10B981' },
      { name: 'Gold Fund', pct: 5, color: '#F59E0B' },
      { name: 'Cash / Overnight', pct: 5, color: '#9CA3AF' },
    ],
    description: 'You are a high-conviction investor seeking maximum long-term growth. With 85% in equities including meaningful mid and small-cap exposure, this portfolio targets aggressive wealth creation. Be prepared for significant short-term swings.',
  },
}

// ─── CLIENT-SIDE SCORING FALLBACK ────────────────────────────
function calculateProfileLocal(answers, questions) {
  const total = Object.values(answers).reduce((sum, w) => sum + w, 0)
  const maxPossible = questions.length * 10
  const scorePct = Math.round((total / maxPossible) * 100)

  let profile
  if (total <= 30) profile = 'Conservative'
  else if (total <= 50) profile = 'Moderate'
  else if (total <= 70) profile = 'Aggressive'
  else profile = 'Very Aggressive'

  const modelPortfolio = MODEL_PORTFOLIOS[profile]

  return {
    score: total,
    scorePct,
    maxScore: maxPossible,
    profile,
    description: modelPortfolio.description,
    allocation: modelPortfolio.allocation,
    subAllocation: modelPortfolio.subs,
  }
}


// ─── SVG DONUT COMPONENT ─────────────────────────────────────
function ScoreDonut({ pct, color, ringColor, size = 200 }) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  const offset = circumference - (animatedPct / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth}
      />
      {/* Score arc */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={ringColor} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}


// ─── STACKED BAR COMPONENT ───────────────────────────────────
function StackedBar({ allocation }) {
  const colors = { Equity: '#3B82F6', Debt: '#10B981', Gold: '#F59E0B', Cash: '#9CA3AF' }
  const entries = Object.entries(allocation)

  return (
    <div>
      <div style={{
        display: 'flex', borderRadius: 8, overflow: 'hidden', height: 36,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{
            width: `${val}%`, background: colors[key] || '#D1D5DB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: val >= 10 ? 13 : 10, fontWeight: 700,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {val >= 8 ? `${val}%` : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: colors[key] || '#D1D5DB', display: 'inline-block',
            }} />
            <span style={{ color: C.ink, fontWeight: 600 }}>{key}</span>
            <span style={{ color: C.muted }}>{val}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function RiskProfiler() {
  let user = null
  try { ({ user } = useAuth()) } catch { user = null }

  const navigate = useNavigate()

  // Page state
  const [step, setStep] = useState('welcome')       // welcome | questions | calculating | results
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [fade, setFade] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const autoAdvanceTimer = useRef(null)

  // ─── FETCH QUESTIONS FROM API ──────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getRiskQuestions()
        if (!cancelled && data?.questions?.length) {
          setQuestions(data.questions)
          setApiAvailable(true)
        }
      } catch {
        // API not available, use fallback
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ─── QUESTION NAVIGATION ──────────────────────────────────
  const transitionTo = useCallback((idx) => {
    setFade(false)
    setTimeout(() => {
      setCurrentQ(idx)
      setFade(true)
    }, 250)
  }, [])

  const handleSelect = useCallback((qId, weight) => {
    setAnswers(prev => ({ ...prev, [qId]: weight }))

    // Auto-advance after 500ms
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    autoAdvanceTimer.current = setTimeout(() => {
      if (currentQ < questions.length - 1) {
        transitionTo(currentQ + 1)
      }
    }, 500)
  }, [currentQ, questions.length, transitionTo])

  const goBack = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (currentQ > 0) transitionTo(currentQ - 1)
  }, [currentQ, transitionTo])

  const goNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (currentQ < questions.length - 1) transitionTo(currentQ + 1)
  }, [currentQ, questions.length, transitionTo])

  // ─── SUBMIT & CALCULATE ────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setStep('calculating')

    // Try API first
    if (apiAvailable) {
      try {
        const data = await api.calculateRiskProfile(answers)
        if (data?.profile) {
          const profileResult = {
            score: data.score,
            scorePct: data.scorePct || Math.round((data.score / (questions.length * 10)) * 100),
            maxScore: data.maxScore || questions.length * 10,
            profile: data.profile,
            description: data.description || MODEL_PORTFOLIOS[data.profile]?.description || '',
            allocation: data.allocation || MODEL_PORTFOLIOS[data.profile]?.allocation || {},
            subAllocation: data.subAllocation || MODEL_PORTFOLIOS[data.profile]?.subs || [],
          }
          setResult(profileResult)
          // Save to localStorage for cross-page use (PortfolioAnalyser, ModelPortfolios, AI Advisor)
          try { localStorage.setItem('merasip_risk_profile', data.profile) } catch {}
          try { localStorage.setItem('merasip_risk_profile_full', JSON.stringify({ score: data.score, profile: data.profile, description: profileResult.description, model_allocation: profileResult.allocation })) } catch {}
          setTimeout(() => setStep('results'), 1500)
          return
        }
      } catch {
        // Fall through to local calculation
      }
    }

    // Client-side fallback
    const localResult = calculateProfileLocal(answers, questions)
    setResult(localResult)
    // Save to localStorage for cross-page use
    try { localStorage.setItem('merasip_risk_profile', localResult.profile) } catch {}
    try { localStorage.setItem('merasip_risk_profile_full', JSON.stringify({ score: localResult.score, profile: localResult.profile, description: localResult.description, model_allocation: localResult.allocation })) } catch {}
    setTimeout(() => setStep('results'), 1500)
  }, [answers, apiAvailable, questions])

  // ─── RESET ─────────────────────────────────────────────────
  const handleRetake = () => {
    setStep('welcome')
    setCurrentQ(0)
    setAnswers({})
    setResult(null)
    setFade(true)
    window.scrollTo(0, 0)
  }

  // ─── WHATSAPP SHARE ────────────────────────────────────────
  const shareWhatsApp = () => {
    if (!result) return
    const text = encodeURIComponent(
      `I just took the MeraSIP Risk Profiler and my profile is: ${result.profile} (Score: ${result.score}/${result.maxScore})!\n\n` +
      `My suggested allocation: Equity ${result.allocation.Equity}%, Debt ${result.allocation.Debt}%, Gold ${result.allocation.Gold}%.\n\n` +
      `Take yours at: ${window.location.origin}/risk-profile`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // ─── ANSWERED COUNT ────────────────────────────────────────
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length
  const currentQuestion = questions[currentQ]
  const profileColors = result ? PROFILE_COLORS[result.profile] || PROFILE_COLORS.Moderate : null

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg1 }}>
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header style={{
        background: C.navy, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <a href="/" style={{
          color: '#fff', fontWeight: 800, fontSize: 20,
          fontFamily: 'Georgia, serif', textDecoration: 'none',
        }}>
          MeraSIP
        </a>
        <span style={{ color: '#ffffff90', fontSize: 13 }}>
          Trustner Asset Services | ARN-286886
        </span>
      </header>

      {/* ─── WELCOME STEP ────────────────────────────────────── */}
      {step === 'welcome' && (
        <div style={{ flex: 1 }}>
          {/* Hero */}
          <div style={{
            background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDim} 60%, #4169B2 100%)`,
            padding: '80px 24px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative shapes */}
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 220, height: 220, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }} />
            <div style={{
              position: 'absolute', bottom: -40, left: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
            }} />

            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 32, color: '#F59E0B',
            }}>
              ✦
            </div>

            <h1 style={{
              color: '#fff', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800,
              margin: '0 0 16px', fontFamily: 'Georgia, serif', lineHeight: 1.2,
            }}>
              Discover Your Investment DNA
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(15px, 2.5vw, 18px)',
              maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.6,
            }}>
              Answer 10 simple questions to understand your risk appetite
              and get a personalized portfolio template
            </p>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', borderRadius: 24,
              padding: '8px 20px', marginBottom: 36,
            }}>
              <span style={{ fontSize: 16 }}>&#9201;</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 }}>
                Takes only 2 minutes
              </span>
            </div>

            <div>
              <button
                onClick={() => { setStep('questions'); setCurrentQ(0); setFade(true) }}
                style={{
                  background: '#F59E0B', color: '#111827',
                  border: 'none', borderRadius: 12, padding: '16px 48px',
                  fontSize: 17, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(245,158,11,0.5)' }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(245,158,11,0.4)' }}
              >
                Start Assessment &rarr;
              </button>
            </div>
          </div>

          {/* Benefits section */}
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: '🎯', title: 'Know Your Risk', desc: 'Understand whether you are conservative, moderate, or aggressive as an investor' },
                { icon: '📊', title: 'Model Portfolio', desc: 'Get a suggested asset allocation template based on your profile' },
                { icon: '🔒', title: 'Private & Secure', desc: 'Your answers stay on this device. No data is shared with anyone' },
              ].map(b => (
                <div key={b.title} style={{
                  background: C.bg0, borderRadius: 16, padding: '28px 24px',
                  border: `1px solid ${C.border}`, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>{b.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance note */}
          <div style={{
            textAlign: 'center', padding: '0 24px 40px',
            fontSize: 12, color: C.muted, lineHeight: 1.6, maxWidth: 600, margin: '0 auto',
          }}>
            This is a risk assessment tool for educational purposes only, not personalised investment advice.
            Mutual fund investments are subject to market risks.
            <br />
            <span style={{ fontWeight: 600 }}>Trustner Asset Services Pvt. Ltd. | ARN-286886</span>
          </div>
        </div>
      )}

      {/* ─── QUESTIONS STEP ──────────────────────────────────── */}
      {step === 'questions' && currentQuestion && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Progress bar */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 700 }}>
                  {Math.round(((currentQ + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div style={{
                height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: `linear-gradient(90deg, ${C.navy}, ${C.navyDim})`,
                  borderRadius: 3,
                  width: `${((currentQ + 1) / questions.length) * 100}%`,
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
            </div>
          </div>

          {/* Question card */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px',
          }}>
            <div style={{
              maxWidth: 680, width: '100%',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}>
              <h2 style={{
                fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: C.ink,
                margin: '0 0 32px', lineHeight: 1.4, textAlign: 'center',
              }}>
                {currentQuestion.text}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = answers[currentQuestion.id] === opt.weight
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(currentQuestion.id, opt.weight)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${isSelected ? C.navy : C.border}`,
                        background: isSelected ? C.navyPale : C.bg0,
                        transition: 'all 0.2s ease',
                        textAlign: 'left', width: '100%',
                        outline: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = C.navyDim
                          e.currentTarget.style.background = '#F8FAFD'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = C.border
                          e.currentTarget.style.background = C.bg0
                        }
                      }}
                    >
                      {/* Radio circle */}
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? C.navy : '#D1D5DB'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.2s',
                      }}>
                        {isSelected && (
                          <span style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: C.navy,
                            animation: 'scaleIn 0.2s ease',
                          }} />
                        )}
                      </span>

                      <span style={{
                        fontSize: 15, fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? C.navy : C.ink,
                        transition: 'color 0.2s, font-weight 0.2s',
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{
            padding: '16px 24px 32px',
            display: 'flex', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ maxWidth: 680, width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={currentQ === 0 ? () => setStep('welcome') : goBack}
                style={{
                  padding: '12px 28px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.bg0,
                  color: C.muted, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = C.navy; e.target.style.color = C.navy }}
                onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted }}
              >
                &larr; {currentQ === 0 ? 'Back' : 'Previous'}
              </button>

              {currentQ === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  style={{
                    padding: '12px 36px', borderRadius: 10, border: 'none',
                    background: allAnswered ? C.navy : '#D1D5DB',
                    color: allAnswered ? '#fff' : '#9CA3AF',
                    fontSize: 14, fontWeight: 700, cursor: allAnswered ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    boxShadow: allAnswered ? '0 4px 12px rgba(27,58,107,0.3)' : 'none',
                  }}
                  onMouseEnter={e => { if (allAnswered) e.target.style.background = C.navyDim }}
                  onMouseLeave={e => { if (allAnswered) e.target.style.background = C.navy }}
                >
                  See My Profile &rarr;
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!answers[currentQuestion.id]}
                  style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: answers[currentQuestion.id] ? C.navy : '#D1D5DB',
                    color: answers[currentQuestion.id] ? '#fff' : '#9CA3AF',
                    fontSize: 14, fontWeight: 600,
                    cursor: answers[currentQuestion.id] ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (answers[currentQuestion.id]) e.target.style.background = C.navyDim }}
                  onMouseLeave={e => { if (answers[currentQuestion.id]) e.target.style.background = C.navy }}
                >
                  Next &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Question dots indicator */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8,
            paddingBottom: 24,
          }}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => transitionTo(i)}
                title={`Question ${i + 1}`}
                style={{
                  width: i === currentQ ? 24 : 8, height: 8,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: answers[q.id]
                    ? C.navy
                    : i === currentQ
                      ? C.navyDim
                      : '#D1D5DB',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── CALCULATING STEP ────────────────────────────────── */}
      {step === 'calculating' && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 24, padding: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: `4px solid ${C.navyPale}`, borderTopColor: C.navy,
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>
            Analysing your responses...
          </div>
          <div style={{ fontSize: 14, color: C.muted }}>
            Building your personalised risk profile
          </div>
        </div>
      )}

      {/* ─── RESULTS STEP ────────────────────────────────────── */}
      {step === 'results' && result && profileColors && (
        <div style={{ flex: 1 }}>
          {/* Score hero */}
          <div style={{
            background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDim} 60%, #4169B2 100%)`,
            padding: '48px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 220, height: 220, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }} />

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 24, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Your Risk Profile
            </div>

            {/* Donut + centered score */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
              <ScoreDonut pct={result.scorePct} color={profileColors.primary} ringColor={profileColors.ring} size={180} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {result.score}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  out of {result.maxScore}
                </div>
              </div>
            </div>

            {/* Profile badge */}
            <div style={{
              display: 'inline-block', background: profileColors.ring,
              color: '#fff', borderRadius: 24, padding: '10px 32px',
              fontSize: 20, fontWeight: 800, letterSpacing: 0.5,
              boxShadow: `0 4px 16px ${profileColors.ring}55`,
              marginBottom: 16,
            }}>
              {result.profile}
            </div>

            <p style={{
              color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 560,
              margin: '0 auto', lineHeight: 1.7,
            }}>
              {result.description}
            </p>
          </div>

          {/* Content section */}
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

            {/* ─── ASSET ALLOCATION ───────────────────────────── */}
            <div style={{
              background: C.bg0, borderRadius: 16, padding: '32px 28px',
              border: `1px solid ${C.border}`, marginBottom: 24,
            }}>
              <h3 style={{
                fontSize: 18, fontWeight: 700, color: C.ink, margin: '0 0 24px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>&#9670;</span>
                Model Portfolio Allocation
              </h3>

              <StackedBar allocation={result.allocation} />

              {/* Sub-allocation cards */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12, marginTop: 28,
              }}>
                {result.subAllocation.map(sub => (
                  <div key={sub.name} style={{
                    background: C.bg2, borderRadius: 10, padding: '14px 16px',
                    borderLeft: `4px solid ${sub.color}`,
                  }}>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{sub.name}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{sub.pct}%</div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 20, padding: '12px 16px', background: C.amberPale,
                borderRadius: 8, fontSize: 12, color: C.amber, lineHeight: 1.6,
              }}>
                <strong>Note:</strong> This is a model template. Actual fund selection depends on your goals, tax status, and existing investments. Consult your advisor before investing.
              </div>
            </div>

            {/* ─── WHAT'S NEXT ────────────────────────────────── */}
            <div style={{
              background: C.bg0, borderRadius: 16, padding: '32px 28px',
              border: `1px solid ${C.border}`, marginBottom: 24,
            }}>
              <h3 style={{
                fontSize: 18, fontWeight: 700, color: C.ink, margin: '0 0 24px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>&#10148;</span>
                What's Next?
              </h3>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}>
                {/* Upload CAS */}
                <button
                  onClick={() => navigate('/advisor/analyse')}
                  style={{
                    background: C.navyPale, border: `1px solid ${C.navyDim}30`,
                    borderRadius: 14, padding: '24px 20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(27,58,107,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>&#128203;</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Upload Your CAS</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                    Analyse your existing mutual fund portfolio with detailed fund-level insights
                  </div>
                </button>

                {/* Plan goals */}
                <button
                  onClick={() => navigate('/advisor/goals')}
                  style={{
                    background: C.greenPale, border: `1px solid ${C.green}30`,
                    borderRadius: 14, padding: '24px 20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,124,78,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>&#127919;</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 6 }}>Plan Your Goals</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                    Set financial goals and create a systematic investment plan to achieve them
                  </div>
                </button>

                {/* Talk to team */}
                <a
                  href="https://wa.me/916003903737?text=Hi%2C%20I%20just%20completed%20the%20MeraSIP%20Risk%20Profiler.%20I%20would%20like%20to%20discuss%20my%20portfolio."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: C.violetPale, border: `1px solid ${C.violet}30`,
                    borderRadius: 14, padding: '24px 20px', cursor: 'pointer',
                    textAlign: 'left', textDecoration: 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    display: 'block',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,33,182,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>&#128172;</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.violet, marginBottom: 6 }}>Talk to Our Team</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                    Chat with a Trustner advisor on WhatsApp for personalised guidance
                  </div>
                </a>
              </div>
            </div>

            {/* ─── ACTION BUTTONS ─────────────────────────────── */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12,
              justifyContent: 'center', marginBottom: 32,
            }}>
              <button
                onClick={handleRetake}
                style={{
                  padding: '12px 28px', borderRadius: 10,
                  border: `2px solid ${C.navy}`, background: 'transparent',
                  color: C.navy, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = C.navyPale }}
                onMouseLeave={e => { e.target.style.background = 'transparent' }}
              >
                &#8634; Retake Assessment
              </button>

              <button
                disabled
                style={{
                  padding: '12px 28px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.bg2,
                  color: '#9CA3AF', fontSize: 14, fontWeight: 600,
                  cursor: 'not-allowed', opacity: 0.6,
                }}
                title="Coming soon"
              >
                &#128196; Download PDF (Coming Soon)
              </button>

              <button
                onClick={shareWhatsApp}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: '#25D366', color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.target.style.background = '#20BD5A' }}
                onMouseLeave={e => { e.target.style.background = '#25D366' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>
            </div>

            {/* Score breakdown */}
            <div style={{
              background: C.bg0, borderRadius: 16, padding: '24px 28px',
              border: `1px solid ${C.border}`, marginBottom: 24,
            }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 16px' }}>
                Your Answer Summary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q, i) => {
                  const w = answers[q.id]
                  const selectedOption = q.options.find(o => o.weight === w)
                  return (
                    <div key={q.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: i % 2 === 0 ? C.bg2 : C.bg0,
                      borderRadius: 8, gap: 12,
                    }}>
                      <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>
                        {i + 1}. {q.text}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: C.navy,
                        whiteSpace: 'nowrap',
                      }}>
                        {selectedOption?.label || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      <ComplianceFooter />

      {/* ─── KEYFRAME ANIMATIONS ──────────────────────────────── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        /* Smooth scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      `}</style>
    </div>
  )
}
