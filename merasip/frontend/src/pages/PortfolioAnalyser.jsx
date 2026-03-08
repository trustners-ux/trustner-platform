import { useState, useRef, useCallback } from 'react'
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

const ACTION_OPTIONS = ['HOLD', 'SWITCH', 'REVIEW', 'EXIT']

const ACTION_COLORS = {
  HOLD:   { bg: C.greenPale, text: C.green },
  SWITCH: { bg: C.redPale,   text: C.red },
  REVIEW: { bg: C.amberPale, text: C.amber },
  EXIT:   { bg: C.redPale,   text: C.red },
}

// ─── HELPERS ─────────────────────────────────────────────────
const inr = (v) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toFixed(0)
  return `${neg ? '-' : ''}${s}`
}

const pct = (v, sign = false) =>
  v != null ? `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}%` : '—'

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function PortfolioAnalyser() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()

  // Upload state
  const [step, setStep] = useState('upload') // upload | loading | result
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  // Portfolio state
  const [portfolio, setPortfolio] = useState(null)
  const [editableFunds, setEditableFunds] = useState([])
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', mobile: '' })

  // Action state
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [expandedNotes, setExpandedNotes] = useState({})

  // ─── FILE HANDLING ─────────────────────────────────────────
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setError('')
    } else {
      setError('Please select a PDF file.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setError('')
    } else {
      setError('Please drop a PDF file.')
    }
  }

  // ─── PARSE CAS ────────────────────────────────────────────
  const handleParse = async () => {
    if (!file) return
    setStep('loading')
    setError('')
    setSaveSuccess('')
    try {
      const result = await api.parseCAS(file, password || undefined)
      setPortfolio(result)
      setClientInfo({
        name: result.investor?.name || '',
        email: result.investor?.email || '',
        mobile: result.investor?.mobile || '',
      })
      // Build editable funds array with advisor fields
      const funds = (result.funds || []).map((f, idx) => ({
        ...f,
        _idx: idx,
        action: f.action || 'HOLD',
        advisor_notes: '',
        action_detail: f.action_detail || '',
      }))
      setEditableFunds(funds)
      setExpandedNotes({})
      setStep('result')
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('timed out') || msg.includes('Unable to reach') || msg.includes('Load Failed') || msg.includes('load failed') || msg.includes('fetch')) {
        setError('Server is starting up (free tier). Please wait 30 seconds and try again. Your file is safe.')
      } else {
        setError(msg || 'Failed to parse PDF. Please check the file and try again.')
      }
      setStep('upload')
    }
  }

  // ─── FUND ACTIONS ─────────────────────────────────────────
  const updateFund = useCallback((idx, field, value) => {
    setEditableFunds(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }, [])

  const toggleNotes = useCallback((idx) => {
    setExpandedNotes(prev => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  // ─── SAVE CLIENT ──────────────────────────────────────────
  const handleSaveClient = async () => {
    if (!clientInfo.name.trim()) {
      setError('Client name is required to save.')
      return
    }
    setSaving(true)
    setError('')
    setSaveSuccess('')
    try {
      const clientRes = await api.createClient({
        name: clientInfo.name.trim(),
        email: clientInfo.email.trim() || undefined,
        mobile: clientInfo.mobile.trim() || undefined,
        pan: portfolio?.investor?.pan || undefined,
        type: 'Individual',
      })
      const clientId = clientRes.client?.id || clientRes.id
      if (clientId) {
        await api.savePortfolio(clientId, {
          ...portfolio,
          funds: editableFunds.map(f => ({
            ...f,
            advisor_notes: f.advisor_notes || undefined,
            action_detail: f.action_detail || undefined,
          })),
        })
      }
      setSaveSuccess('Client and portfolio saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save client.')
    } finally {
      setSaving(false)
    }
  }

  // ─── SUBMIT FOR REVIEW ────────────────────────────────────
  const handleSubmitForReview = async () => {
    setSubmitting(true)
    setError('')
    setSaveSuccess('')
    try {
      await api.submitForReview({
        client_name: clientInfo.name || portfolio?.investor?.name || 'Unknown',
        client_email: clientInfo.email || portfolio?.investor?.email,
        client_mobile: clientInfo.mobile || portfolio?.investor?.mobile,
        client_pan: portfolio?.investor?.pan,
        portfolio_data: {
          ...portfolio,
          funds: editableFunds,
        },
        suggested_actions: {
          funds: editableFunds.map(f => ({
            name: f.name,
            action: f.action,
            action_detail: f.action_detail,
            advisor_notes: f.advisor_notes,
          })),
        },
      })
      setSaveSuccess('Portfolio submitted for expert review. You will be notified when the review is complete.')
    } catch (err) {
      setError(err.message || 'Failed to submit for review.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── RESET ────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload')
    setPortfolio(null)
    setEditableFunds([])
    setFile(null)
    setPassword('')
    setError('')
    setSaveSuccess('')
    setClientInfo({ name: '', email: '', mobile: '' })
    setExpandedNotes({})
  }

  // ─── DERIVED DATA ─────────────────────────────────────────
  const summary = portfolio?.summary || {}
  const investor = portfolio?.investor || {}
  const familyMembers = investor.family_members || []

  const actionCounts = editableFunds.reduce((acc, f) => {
    acc[f.action] = (acc[f.action] || 0) + 1
    return acc
  }, {})

  // ─── NAV LINKS ────────────────────────────────────────────
  const navLinks = [
    { label: 'Dashboard', href: '/advisor' },
    { label: 'Rebalance', href: '/advisor/rebalance' },
    { label: 'Analyse', href: '/advisor/analyse' },
    { label: 'NAV Engine', href: '/advisor/nav' },
    ...(isManager ? [{ label: 'Review Queue', href: '/advisor/review-queue' }] : []),
    { label: 'Team', href: '/advisor/team' },
    ...(isAdmin ? [{ label: 'Admin', href: '/advisor/admin' }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg1, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: C.ink }}>
      {/* ─── HEADER ────────────────────────────────────────── */}
      <header style={{
        background: C.navy, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/advisor" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            MeraSIP
          </a>
          <nav style={{ display: 'flex', gap: 8 }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} style={{
                color: location.pathname === link.href ? '#fff' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '6px 12px',
                borderRadius: 6,
                background: location.pathname === link.href ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}>{link.label}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/advisor/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{user?.name || user?.email}</span>
          </a>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
          }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* ─── STEP 1: UPLOAD ──────────────────────────────── */}
        {step === 'upload' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
                Portfolio Analyser
              </h1>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
                Upload a client's CAS PDF to analyse their portfolio, add your recommendations, and generate reports
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${file ? C.green : C.border}`,
                borderRadius: 12, padding: 48, textAlign: 'center',
                background: file ? C.greenPale : C.bg0,
                cursor: 'pointer', transition: 'all 0.2s',
                maxWidth: 600, margin: '0 auto',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect}
                style={{ display: 'none' }} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '\u2713' : '\uD83D\uDCC4'}</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{file.name}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                    {(file.size / 1024).toFixed(0)} KB — Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>
                    Drop CAS PDF here or click to browse
                  </div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                    Supports CAMS, KFintech, and MF Central statements
                  </div>
                </div>
              )}
            </div>

            {/* PAN password field */}
            <div style={{ maxWidth: 600, margin: '16px auto 0' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>
                PAN (required only if PDF is password-protected)
              </label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                style={{
                  width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`,
                  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                maxWidth: 600, margin: '12px auto 0', padding: '10px 14px',
                background: C.redPale, border: '1px solid #FECACA',
                borderRadius: 6, color: C.red, fontSize: 12,
              }}>
                {error}
              </div>
            )}

            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <button
                onClick={handleParse}
                disabled={!file}
                style={{
                  width: '100%', marginTop: 20, padding: '14px 24px',
                  background: file ? C.navy : '#D1D5DB', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
                  cursor: file ? 'pointer' : 'not-allowed',
                }}
              >
                Analyse Portfolio
              </button>
            </div>

            <div style={{
              maxWidth: 600, margin: '24px auto 0', padding: 16,
              background: C.bg2, borderRadius: 8,
              fontSize: 11, color: C.muted, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.ink }}>Data is processed securely.</strong>{' '}
              The CAS PDF is parsed in memory and not stored. Only structured portfolio data is retained for analysis.
            </div>
          </div>
        )}

        {/* ─── LOADING ──────────────────────────────────────── */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `4px solid ${C.navyPale}`,
                borderTopColor: C.navy,
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 22,
              }}>{'\uD83D\uDCCA'}</div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100% { opacity: .5 } 50% { opacity: 1 } }`}</style>
            <div style={{ fontWeight: 700, color: C.navy, fontSize: 18, fontFamily: 'Georgia, serif' }}>
              Analysing portfolio...
            </div>
            <div style={{
              color: C.muted, fontSize: 13, marginTop: 10,
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              Extracting fund data and running rebalancing analysis
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: C.navy,
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 20, opacity: 0.7 }}>
              This may take 15-30 seconds if the server is starting up
            </div>
          </div>
        )}

        {/* ─── STEP 2: RESULTS ──────────────────────────────── */}
        {step === 'result' && portfolio && (
          <div>
            {/* ─ Alerts ─ */}
            {error && (
              <div style={{
                padding: '10px 14px', background: C.redPale,
                border: '1px solid #FECACA', borderRadius: 6, color: C.red,
                fontSize: 12, marginBottom: 16,
              }}>
                {error}
              </div>
            )}
            {saveSuccess && (
              <div style={{
                padding: '10px 14px', background: C.greenPale,
                border: `1px solid ${C.green}40`, borderRadius: 6, color: C.green,
                fontSize: 12, marginBottom: 16,
              }}>
                {saveSuccess}
              </div>
            )}

            {/* ─ Client Info Card ─ */}
            <div style={{
              background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDim} 100%)`,
              borderRadius: 12, padding: 24, marginBottom: 20, color: '#fff',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6 }}>
                PORTFOLIO ANALYSIS
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, fontFamily: 'Georgia, serif' }}>
                {investor.name || 'Investor'}
              </div>
              {investor.pan && (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  PAN: {investor.pan} {investor.report_date ? `| Report Date: ${investor.report_date}` : ''}
                </div>
              )}
            </div>

            {/* ─ Editable Client Contact ─ */}
            <div style={{
              background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 20, marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', marginBottom: 12 }}>
                CLIENT CONTACT DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    value={clientInfo.name}
                    onChange={e => setClientInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="Client name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    value={clientInfo.email}
                    onChange={e => setClientInfo(p => ({ ...p, email: e.target.value }))}
                    placeholder="client@email.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mobile</label>
                  <input
                    value={clientInfo.mobile}
                    onChange={e => setClientInfo(p => ({ ...p, mobile: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* ─ Family Members ─ */}
            {familyMembers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', marginBottom: 10 }}>
                  FAMILY MEMBERS
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {familyMembers.map((member, i) => (
                    <div key={i} style={{
                      background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '14px 18px', minWidth: 180, flexShrink: 0,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 8 }}>
                        {member.name || `Member ${i + 1}`}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div>
                          <div style={{ fontSize: 9, color: C.muted }}>Invested</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>
                            {inr(member.invested ?? member.inv)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: C.muted }}>Value</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>
                            {inr(member.value ?? member.val)}
                          </div>
                        </div>
                        {(member.abs_return != null || member.abs != null) && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: 9, color: C.muted }}>Return</div>
                            <div style={{
                              fontSize: 12, fontWeight: 700,
                              color: (member.abs_return ?? member.abs ?? 0) >= 0 ? C.green : C.red,
                            }}>
                              {pct(member.abs_return ?? member.abs, true)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ KPI Row ─ */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12, marginBottom: 20,
            }}>
              {[
                { label: 'Total Invested', value: `\u20B9${inr(summary.total_invested)}`, color: C.navy },
                { label: 'Current Value', value: `\u20B9${inr(summary.total_value)}`, color: C.navy },
                { label: 'Total Gain', value: `\u20B9${inr(summary.total_gain)}`, color: (summary.total_gain ?? 0) >= 0 ? C.green : C.red },
                { label: 'Abs. Return', value: pct(summary.abs_return, true), color: (summary.abs_return ?? 0) >= 0 ? C.green : C.red },
                ...(summary.xirr != null ? [{ label: 'XIRR', value: pct(summary.xirr, true), color: (summary.xirr ?? 0) >= 0 ? C.green : C.red }] : []),
                { label: 'Fund Count', value: String(editableFunds.length), color: C.navy },
              ].map((kpi, i) => (
                <div key={i} style={{
                  background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontFamily: 'Georgia, serif' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {/* ─ Action Summary ─ */}
            {editableFunds.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {ACTION_OPTIONS.map(action => {
                  const count = actionCounts[action] || 0
                  if (!count) return null
                  const colors = ACTION_COLORS[action]
                  return (
                    <span key={action} style={{
                      background: colors.bg, color: colors.text,
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>
                      {count} {action}
                    </span>
                  )
                })}
              </div>
            )}

            {/* ─ Fund Analysis Cards ─ */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
                Fund Analysis ({editableFunds.length} funds)
              </h2>
              {editableFunds.map((fund, idx) => {
                const actionStyle = ACTION_COLORS[fund.action] || ACTION_COLORS.HOLD
                const absReturn = fund.abs_return ?? fund.abs
                const isPositive = (absReturn ?? 0) >= 0
                const notesOpen = expandedNotes[idx] || false

                return (
                  <div key={idx} style={{
                    background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: 16, marginBottom: 12,
                    borderLeft: `4px solid ${actionStyle.text}`,
                  }}>
                    {/* Fund header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{fund.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {fund.category || fund.cat || '—'} {fund.plan ? `| ${fund.plan}` : ''}
                          {fund.folio ? ` | Folio: ${fund.folio}` : ''}
                        </div>
                      </div>
                      {/* Action dropdown */}
                      <div style={{ position: 'relative' }}>
                        <select
                          value={fund.action}
                          onChange={e => updateFund(idx, 'action', e.target.value)}
                          style={{
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            background: actionStyle.bg,
                            color: actionStyle.text,
                            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                            padding: '4px 28px 4px 10px',
                            borderRadius: 4, border: `1px solid ${actionStyle.text}30`,
                            cursor: 'pointer', outline: 'none',
                          }}
                        >
                          {ACTION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <span style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          pointerEvents: 'none', fontSize: 8, color: actionStyle.text,
                        }}>{'\u25BC'}</span>
                      </div>
                    </div>

                    {/* Fund stats */}
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

                    {/* Auto-generated analysis */}
                    {fund.analysis && (
                      <div style={{
                        marginTop: 10, padding: '8px 10px', background: C.bg2,
                        borderRadius: 4, fontSize: 11, color: C.ink, lineHeight: 1.5,
                      }}>
                        {fund.analysis}
                      </div>
                    )}

                    {/* Switch-to field (if SWITCH) */}
                    {fund.action === 'SWITCH' && (
                      <div style={{ marginTop: 10 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: C.red, display: 'block', marginBottom: 4 }}>
                          Switch to fund
                        </label>
                        <input
                          type="text"
                          value={fund.action_detail}
                          onChange={e => updateFund(idx, 'action_detail', e.target.value)}
                          placeholder="Enter recommended fund name..."
                          style={{
                            width: '100%', padding: '8px 10px', border: `1px solid ${C.red}40`,
                            borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                            background: C.redPale,
                          }}
                        />
                      </div>
                    )}

                    {/* Original action_detail display (for non-SWITCH or pre-existing) */}
                    {fund.action !== 'SWITCH' && fund.action_detail && (
                      <div style={{ marginTop: 6, fontSize: 11, color: actionStyle.text, fontWeight: 600 }}>
                        Note: {fund.action_detail}
                      </div>
                    )}

                    {/* Advisor Notes toggle + textarea */}
                    <div style={{ marginTop: 10 }}>
                      <button
                        onClick={() => toggleNotes(idx)}
                        style={{
                          background: 'transparent', border: 'none', padding: 0,
                          fontSize: 11, fontWeight: 600, color: C.navyDim,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span style={{
                          display: 'inline-block', transition: 'transform 0.2s',
                          transform: notesOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          fontSize: 10,
                        }}>{'\u25B6'}</span>
                        Advisor Notes
                        {fund.advisor_notes && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: C.navy, display: 'inline-block', marginLeft: 4,
                          }} />
                        )}
                      </button>
                      {notesOpen && (
                        <textarea
                          value={fund.advisor_notes}
                          onChange={e => updateFund(idx, 'advisor_notes', e.target.value)}
                          placeholder="Add your recommendation for this fund..."
                          rows={3}
                          style={{
                            width: '100%', marginTop: 8, padding: '10px 12px',
                            border: `1px solid ${C.navyPale}`, borderRadius: 6,
                            fontSize: 12, outline: 'none', boxSizing: 'border-box',
                            background: C.navyPale + '60', resize: 'vertical',
                            fontFamily: 'inherit', lineHeight: 1.5,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ─ Bottom Actions Bar ─ */}
            <div style={{
              background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 24, marginBottom: 32,
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky', bottom: 0,
              boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
            }}>
              <button
                onClick={handleReset}
                style={{
                  background: 'transparent', border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 20px', color: C.muted,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Upload Another
              </button>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleSaveClient}
                  disabled={saving}
                  style={{
                    background: C.bg0, border: `2px solid ${C.navy}`,
                    borderRadius: 8, padding: '10px 24px', color: C.navy,
                    fontSize: 13, fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Save as Client'}
                </button>
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  style={{
                    background: C.navy, border: 'none',
                    borderRadius: 8, padding: '10px 24px', color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit for Expert Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}

// ─── SHARED STYLES ───────────────────────────────────────────
const labelStyle = {
  fontSize: 10, fontWeight: 600, color: C.muted,
  display: 'block', marginBottom: 4,
  letterSpacing: '0.04em', textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: C.bg0,
}
