import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

// ─── HELPERS ─────────────────────────────────────────────────
const inr = (v) => {
  if (v == null || v === 0) return '0'
  const abs = Math.abs(v)
  return `${v < 0 ? '-' : ''}${abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr` : abs >= 1e5 ? `${(abs / 1e5).toFixed(1)}L` : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)}K` : abs.toFixed(0)}`
}

/** Parse **bold** markdown into JSX */
function renderMarkdown(text) {
  if (!text) return null
  return text.split('\n').map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/).map((seg, si) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={si}>{seg.slice(2, -2)}</strong>
      }
      return seg
    })
    return (
      <span key={li}>
        {li > 0 && <br />}
        {parts}
      </span>
    )
  })
}

// ─── TYPING INDICATOR ────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%', background: C.navyDim,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}

// ─── HEALTH SCORE MINI GAUGE ─────────────────────────────────
function MiniGauge({ score, size = 56 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(score || 0, 0), 100)
  const offset = circ - (pct / 100) * circ
  const color = pct >= 80 ? C.green : pct >= 60 ? C.amber : C.red

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.bg2} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={14} fontWeight={800} fill={color} fontFamily="Georgia, serif">
        {pct}
      </text>
    </svg>
  )
}

// ─── CONTEXT SIDEBAR CARD ────────────────────────────────────
function ContextCard({ title, icon, children }) {
  return (
    <div style={{
      background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: 14, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: '0.03em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function AIAdvisor() {
  const location = useLocation()
  const { user, isAuthenticated, isManager, isAdmin, logout } = useAuth()
  const isAdvisorRoute = location.pathname.startsWith('/advisor')

  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [context, setContext] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load context from localStorage on mount
  useEffect(() => {
    const riskProfile = JSON.parse(localStorage.getItem('merasip_risk_profile') || 'null')
    const portfolioData = JSON.parse(localStorage.getItem('merasip_portfolio_data') || 'null')
    const ctx = {
      risk_profile: riskProfile,
      portfolio: portfolioData ? { funds: portfolioData.funds || [], summary: portfolioData.summary || {} } : null,
      health_score: portfolioData?.healthScore || null,
      goals: null,
    }
    setContext(ctx)

    // Build welcome message
    const welcome = buildWelcome(ctx)
    setMessages([{ role: 'assistant', content: welcome, suggestions: getInitialSuggestions(ctx) }])
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function buildWelcome(ctx) {
    const hasPortfolio = ctx?.portfolio?.summary?.total_value
    const hasHealth = ctx?.health_score?.total_score
    const hasRisk = ctx?.risk_profile?.profile

    if (hasPortfolio && hasHealth) {
      const val = ctx.portfolio.summary.total_value
      const score = ctx.health_score.total_score
      return `Welcome back! I can see your portfolio (**${'₹'}${inr(val)}**, Health Score: **${score}/100**).\n\nWhat would you like to explore today? I can help with portfolio analysis, goal planning, rebalancing, or any investment question.`
    }
    if (hasRisk) {
      return `I know your risk profile is **${ctx.risk_profile.profile}**. Upload your CAS in the **Analyse** tab to get personalized portfolio insights.\n\nIn the meantime, feel free to ask me anything about investing, SIPs, or financial planning!`
    }
    return `Welcome to **MeraSIP AI Advisor**!\n\nStart by taking a **Risk Assessment** or uploading your **CAS statement** in the Analyse tab for personalized guidance.\n\nYou can also ask me general questions about mutual funds, SIPs, and financial planning.`
  }

  function getInitialSuggestions(ctx) {
    if (ctx?.portfolio?.funds?.length) {
      return ['How is my portfolio doing?', 'Am I well-diversified?', 'What should I improve?', 'How much SIP for retirement?']
    }
    if (ctx?.risk_profile) {
      return ['What funds suit my profile?', 'How should I start investing?', 'Explain asset allocation', 'How much SIP for retirement?']
    }
    return ['How do mutual funds work?', 'What is a SIP?', 'How to start investing?', 'Why choose an MFD?']
  }

  // Send message
  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.aiAdvisorChat({
        message: msg,
        context: context,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply,
        suggestions: res.suggestions || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, I\'m having trouble connecting right now. Please try again in a moment.',
        suggestions: ['Try again'],
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── RENDER ────────────────────────────────────────────────
  const rp = context?.risk_profile
  const pf = context?.portfolio
  const hs = context?.health_score
  const summary = pf?.summary || {}
  const hasContext = rp || pf || hs

  return (
    <div style={{ minHeight: '100vh', background: C.bg1, display: 'flex', flexDirection: 'column' }}>

      {/* ─── HEADER ───────────────────────────────────────────── */}
      {isAdvisorRoute ? (
        <header style={{ background: C.navy, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/advisor" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>MeraSIP</a>
            <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Dashboard', href: '/advisor' },
                { label: 'Rebalance', href: '/advisor/rebalance' },
                { label: 'Analyse', href: '/advisor/analyse' },
                { label: 'Risk Profile', href: '/advisor/risk-profile' },
                { label: 'Goals', href: '/advisor/goals' },
                { label: 'Models', href: '/advisor/models' },
                { label: 'AI Advisor', href: '/advisor/ai' },
                { label: 'NAV Engine', href: '/advisor/nav' },
                ...(isManager ? [{ label: 'Review Queue', href: '/advisor/review-queue' }] : []),
                { label: 'Team', href: '/advisor/team' },
                ...(isAdmin ? [{ label: 'Admin', href: '/advisor/admin' }] : []),
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
      ) : (
        <header style={{ background: C.navy, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>MeraSIP</a>
          <span style={{ color: '#ffffff90', fontSize: 13 }}>AI Advisor &bull; Trustner Asset Services</span>
        </header>
      )}

      {/* ─── MAIN LAYOUT ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1400, margin: '0 auto', width: '100%', padding: '0 16px' }}>

        {/* ─── CONTEXT SIDEBAR ──────────────────────────────────── */}
        {sidebarOpen && (
          <aside style={{
            width: 280, flexShrink: 0, padding: '20px 12px 20px 0',
            overflowY: 'auto', maxHeight: 'calc(100vh - 60px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Your Context</span>
              <button onClick={() => setSidebarOpen(false)} style={{
                background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px',
              }} title="Hide sidebar">&times;</button>
            </div>

            {!hasContext && (
              <div style={{
                background: C.amberPale, border: `1px solid #F59E0B33`, borderRadius: 10,
                padding: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#128202;</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 4 }}>No data yet</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
                  Complete your Risk Profile or upload a CAS statement for personalized guidance.
                </div>
                <a href={isAdvisorRoute ? '/advisor/risk-profile' : '/risk-profile'}
                  style={{
                    display: 'inline-block', background: C.navy, color: '#fff', padding: '6px 14px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: 'none', marginBottom: 6,
                  }}>Take Risk Assessment</a>
                <br />
                {isAdvisorRoute && (
                  <a href="/advisor/analyse"
                    style={{ color: C.navyDim, fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}>
                    Upload CAS Statement
                  </a>
                )}
              </div>
            )}

            {rp && (
              <ContextCard title="RISK PROFILE" icon="&#127919;">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: C.navyPale, color: C.navy, fontSize: 12, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 6,
                  }}>{rp.profile}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>Score: {rp.score}/100</span>
                </div>
                {rp.description && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                    {rp.description.length > 100 ? rp.description.slice(0, 100) + '...' : rp.description}
                  </div>
                )}
              </ContextCard>
            )}

            {pf && summary.total_value != null && (
              <ContextCard title="PORTFOLIO" icon="&#128188;">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted }}>Invested</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'Georgia, serif' }}>
                      {'₹'}{inr(summary.total_invested)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted }}>Current</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'Georgia, serif' }}>
                      {'₹'}{inr(summary.total_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted }}>Return</div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, fontFamily: 'Georgia, serif',
                      color: (summary.abs_return || 0) >= 0 ? C.green : C.red,
                    }}>
                      {(summary.abs_return || 0) >= 0 ? '+' : ''}{(summary.abs_return || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted }}>Funds</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'Georgia, serif' }}>
                      {(pf.funds || []).length}
                    </div>
                  </div>
                </div>
              </ContextCard>
            )}

            {hs && (
              <ContextCard title="HEALTH SCORE" icon="&#128153;">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MiniGauge score={hs.total_score} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: 'Georgia, serif' }}>
                      {hs.grade || '?'}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>Grade</div>
                  </div>
                </div>
                {hs.dimensions && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Object.entries(hs.dimensions).slice(0, 5).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: C.muted, textTransform: 'capitalize' }}>{k}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 40, height: 4, background: C.bg2, borderRadius: 2, overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${((v.score || 0) / (v.max || 20)) * 100}%`,
                              height: '100%', borderRadius: 2,
                              background: (v.score || 0) / (v.max || 20) >= 0.7 ? C.green : (v.score || 0) / (v.max || 20) >= 0.5 ? C.amber : C.red,
                            }} />
                          </div>
                          <span style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>
                            {v.score}/{v.max || 20}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ContextCard>
            )}
          </aside>
        )}

        {/* ─── CHAT AREA ────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

          {/* Chat header */}
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} style={{
                  background: C.navyPale, border: 'none', color: C.navy, cursor: 'pointer',
                  width: 32, height: 32, borderRadius: 8, fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Show context sidebar">&#9776;</button>
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navyDim})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 16, fontWeight: 700,
              }}>&#10022;</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>MeraSIP AI Advisor</div>
                <div style={{ fontSize: 11, color: C.muted }}>Ask me anything about your portfolio</div>
              </div>
            </div>
            {hasContext && (
              <div style={{
                background: C.greenPale, color: C.green, fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 20, letterSpacing: '0.03em',
              }}>CONTEXT LOADED</div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 20px 0',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: 14,
                    fontSize: 13, lineHeight: 1.65,
                    ...(msg.role === 'user' ? {
                      background: C.navy, color: '#fff',
                      borderBottomRightRadius: 4,
                    } : {
                      background: C.bg0, color: C.ink,
                      border: `1px solid ${C.border}`,
                      borderBottomLeftRadius: 4,
                    }),
                  }}>
                    {renderMarkdown(msg.content)}
                  </div>
                </div>

                {/* Suggestions after last AI message */}
                {msg.role === 'assistant' && msg.suggestions?.length > 0 && i === messages.length - 1 && !loading && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, paddingLeft: 4 }}>
                    {msg.suggestions.map((s, si) => (
                      <button key={si} onClick={() => sendMessage(s)} style={{
                        background: C.navyPale, color: C.navy, border: `1px solid ${C.navyDim}22`,
                        padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.target.style.background = C.navy; e.target.style.color = '#fff' }}
                        onMouseLeave={e => { e.target.style.background = C.navyPale; e.target.style.color = C.navy }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 14,
                  borderBottomLeftRadius: 4, padding: '12px 20px',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 20px 16px', borderTop: `1px solid ${C.border}`, background: C.bg0,
          }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-end',
              background: C.bg2, borderRadius: 14, border: `1px solid ${C.border}`,
              padding: '8px 12px',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your portfolio, goals, or investments..."
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent', resize: 'none',
                  fontSize: 13, lineHeight: 1.5, color: C.ink, outline: 'none',
                  fontFamily: 'inherit', minHeight: 24, maxHeight: 120,
                }}
                onInput={e => {
                  e.target.style.height = '24px'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: input.trim() && !loading ? C.navy : C.border,
                  color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: C.muted }}>
                MeraSIP AI Advisor provides general guidance only. Not investment advice. ARN-286886
              </span>
            </div>
          </div>
        </div>
      </div>

      <ComplianceFooter />
    </div>
  )
}
