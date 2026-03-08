import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import MemberStrip from '../components/MemberStrip'
import ComplianceFooter from '../components/ComplianceFooter'

// ─── COLOUR TOKENS ───────────────────────────────────────────
const C = {
  navy: '#1B3A6B', navyDim: '#2E5299', navyPale: '#E8EEF8',
  green: '#0A7C4E', greenPale: '#F0FAF5',
  red: '#B91C1C', redPale: '#FEF2F2',
  amber: '#92400E', amberPale: '#FFFBEB',
  violet: '#5B21B6', violetPale: '#F5F3FF',
  ink: '#111827', ink2: '#1F2937', ink3: '#374151',
  muted: '#6B7280', border: '#D1D5DB',
  bg0: '#FFFFFF', bg1: '#FAFBFC', bg2: '#F4F6F9', bg3: '#EDF0F5',
}

const REPORT_TYPES = [
  { id: 'family',      label: 'Family / Group Report',      icon: 'F', desc: 'All members consolidated + individual sections', color: C.navy },
  { id: 'individual',  label: 'Individual Review',           icon: 'I', desc: 'Single investor deep dive with fund-level advice', color: C.green },
  { id: 'rebalancing', label: 'Rebalancing Report',          icon: 'R', desc: 'Switch / Stop / Continue recommendations', color: C.amber },
  { id: 'tax',         label: 'Tax Planning Report',         icon: 'T', desc: 'LTCG/STCG harvest, ELSS status, 80C optimisation', color: C.violet },
  { id: 'onepager',    label: 'Client One-Pager',            icon: '1', desc: 'Single-page summary for WhatsApp / email sharing', color: C.navyDim },
]

// ─── HELPERS ─────────────────────────────────────────────────
const inr = (v, sign = false) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toFixed(0)
  return `${neg ? '-' : sign && v > 0 ? '+' : ''}${s}`
}
const pct = (v, sign = false) => v != null ? `${sign && v > 0 ? '+' : ''}${v.toFixed(2)}%` : '—'

const Badge = ({ status }) => {
  const styles = {
    done:    { bg: C.greenPale, text: C.green, label: 'Generated' },
    pending: { bg: C.amberPale, text: C.amber, label: 'Pending' },
    ready:   { bg: C.greenPale, text: C.green, label: 'Ready' },
  }
  const s = styles[status] || styles.pending
  return (
    <span style={{
      background: s.bg, color: s.text, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace',
    }}>{s.label.toUpperCase()}</span>
  )
}

const KPI = ({ label, value, color }) => (
  <div style={{
    background: C.bg2, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 100,
  }}>
    <div style={{ fontSize: 18, fontWeight: 800, color: color || C.navy, fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>{value}</div>
    <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontWeight: 500 }}>{label}</div>
  </div>
)

// ─── GENERATE MODAL ──────────────────────────────────────────
function GenerateModal({ client, portfolio, onClose }) {
  const [step, setStep] = useState(0)
  const [selType, setSelType] = useState(null)
  const [progress, setProgress] = useState(0)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startGenerate = async () => {
    setStep(2)
    setProgress(0)
    setError('')

    // Simulate progress while API call is in flight
    let p = 0
    timerRef.current = setInterval(() => {
      p += Math.random() * 8
      if (p > 85) p = 85
      setProgress(p)
    }, 300)

    try {
      const result = await api.generateReport(selType || 'individual', {
        ...(portfolio || {}),
        client_id: client?.id,
      })
      clearInterval(timerRef.current)
      setProgress(100)
      setPdfUrl(result.pdf_url)
      setTimeout(() => setStep(3), 400)
    } catch (err) {
      clearInterval(timerRef.current)
      setError(err.message || 'Failed to generate report')
      setStep(1)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.bg0, width: 640, maxHeight: '90vh', overflowY: 'auto',
        borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', border: `1px solid ${C.border}`,
      }}>
        {/* Header */}
        <div style={{ background: C.navy, padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
                GENERATE REPORT
              </div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginTop: 2 }}>{client?.name || 'Client'}</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 16,
            }}>x</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Step 0: Select type */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 12 }}>Select Report Type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REPORT_TYPES.map(rt => (
                  <div key={rt.id} onClick={() => setSelType(rt.id)} style={{
                    border: `2px solid ${selType === rt.id ? rt.color : C.border}`,
                    borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                    background: selType === rt.id ? rt.color + '10' : C.bg1,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: rt.color + '15',
                      color: rt.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16,
                    }}>{rt.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: selType === rt.id ? rt.color : C.ink }}>{rt.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{rt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => selType && setStep(1)} style={{
                  background: selType ? C.navy : C.bg3, color: selType ? '#fff' : C.muted,
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontWeight: 700, fontSize: 13, cursor: selType ? 'pointer' : 'not-allowed',
                }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 1: Confirm */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 16 }}>
                Confirm Generation
              </div>
              <div style={{ padding: 16, background: C.bg2, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.muted }}>Report Type: <strong style={{ color: C.ink }}>{REPORT_TYPES.find(r => r.id === selType)?.label}</strong></div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Client: <strong style={{ color: C.ink }}>{client?.name}</strong></div>
              </div>
              {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setStep(0)} style={{
                  background: C.bg2, color: C.ink3, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>Back</button>
                <button onClick={startGenerate} style={{
                  background: C.navy, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>Generate PDF</button>
              </div>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>Generating Report...</div>
              <div style={{ background: C.bg3, borderRadius: 8, height: 12, overflow: 'hidden', margin: '24px 32px 0' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: C.navy, borderRadius: 8, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 12, color: C.navy, fontWeight: 700, marginTop: 8 }}>{progress.toFixed(0)}%</div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32, background: C.greenPale,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', border: `2px solid ${C.green}`, fontSize: 28,
              }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>Report Ready!</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, margin: '20px auto' }}>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: C.navy, color: '#fff', border: 'none',
                    borderRadius: 8, padding: '12px 16px', textDecoration: 'none', fontWeight: 700,
                  }}>
                    <span style={{ fontSize: 20 }}>📥</span> Download PDF
                  </a>
                )}
              </div>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: C.muted,
                fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
              }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function AdvisorDashboard() {
  const { user, isManager, logout } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [reports, setReports] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientPortfolio, setClientPortfolio] = useState(null)
  const [search, setSearch] = useState('')
  const [showGen, setShowGen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadClients() }, [])

  const loadClients = async () => {
    try {
      const res = await api.getClients()
      setClients(res.clients || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectClient = async (client) => {
    setSelectedClient(client)
    try {
      const portfolio = await api.getPortfolio(client.id)
      setClientPortfolio(portfolio.data || portfolio)
      const reps = await api.getReports(client.id)
      setReports(reps.reports || [])
    } catch {
      setClientPortfolio(null)
      setReports([])
    }
  }

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAUM = clients.reduce((s, c) => s + (c.total_val || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg1, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: C.ink }}>
      {/* Top nav */}
      <div style={{
        background: C.navy, borderBottom: `1px solid ${C.navyDim}`,
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>MeraSIP</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 8 }}>by Trustner</span>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
            S.M.A.R.T REPORT CENTRE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>ARN-286886</span>
          {/* Nav links */}
          <button onClick={() => navigate('/advisor/rebalance')} style={navBtn}>Rebalance</button>
          <button onClick={() => navigate('/advisor/nav')} style={navBtn}>NAV</button>
          {isManager && <button onClick={() => navigate('/advisor/review-queue')} style={{ ...navBtn, background: 'rgba(255,255,255,0.2)' }}>Review Queue</button>}
          <button onClick={logout} style={{ ...navBtn, opacity: 0.6 }}>Logout</button>
        </div>
      </div>

      {/* Summary banner */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '10px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {[
            { label: 'Total AUM', value: inr(totalAUM), color: C.navy },
            { label: 'Total Clients', value: String(clients.length), color: C.ink2 },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {i > 0 && <div style={{ width: 1, height: 24, background: C.border }} />}
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 104px)' }}>
        {/* Left sidebar — client list */}
        <div style={{
          width: 300, borderRight: `1px solid ${C.border}`, background: '#fff',
          overflowY: 'auto', padding: 16, flexShrink: 0,
        }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{
              width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '8px 12px', fontSize: 12, marginBottom: 12, boxSizing: 'border-box', outline: 'none',
            }}
          />
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 12 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 12 }}>No clients yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => selectClient(c)}
                  style={{
                    border: `2px solid ${selectedClient?.id === c.id ? C.navy : C.border}`,
                    borderRadius: 10, padding: 14, cursor: 'pointer',
                    background: selectedClient?.id === c.id ? C.navyPale : C.bg0,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    {c.type || 'Individual'} {c.pan ? `| ${c.pan}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!selectedClient ? (
            <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Select a client to view details</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Choose from the sidebar or <a href="/review" style={{ color: C.navy }}>upload a new CAS</a>
              </div>
            </div>
          ) : (
            <div>
              {/* Client header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>
                    {selectedClient.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {selectedClient.type} {selectedClient.pan ? `| PAN: ${selectedClient.pan}` : ''}
                  </div>
                </div>
                <button onClick={() => setShowGen(true)} style={{
                  background: C.navy, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>+ Generate Report</button>
              </div>

              {/* Portfolio KPIs */}
              {clientPortfolio?.summary && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  <KPI label="Invested" value={`₹${inr(clientPortfolio.summary.total_invested)}`} color={C.navy} />
                  <KPI label="Current Value" value={`₹${inr(clientPortfolio.summary.total_value)}`} color={C.navy} />
                  <KPI label="Gain" value={`₹${inr(clientPortfolio.summary.total_gain)}`}
                    color={clientPortfolio.summary.total_gain >= 0 ? C.green : C.red} />
                  <KPI label="Return" value={pct(clientPortfolio.summary.abs_return, true)}
                    color={clientPortfolio.summary.abs_return >= 0 ? C.green : C.red} />
                  {clientPortfolio.summary.xirr != null && (
                    <KPI label="XIRR" value={pct(clientPortfolio.summary.xirr, true)} color={C.navy} />
                  )}
                </div>
              )}

              {/* Reports */}
              {reports.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>
                    GENERATED REPORTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reports.map(r => (
                      <div key={r.id} style={{
                        border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px',
                        background: C.bg1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{r.type} Report</div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                            {new Date(r.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.pdf_url && (
                            <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" style={{
                              background: C.navyPale, color: C.navy, border: `1px solid ${C.navy}30`,
                              borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                              textDecoration: 'none',
                            }}>PDF</a>
                          )}
                          <Badge status={r.pdf_url ? 'done' : 'pending'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>
                  QUICK GENERATE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {REPORT_TYPES.slice(0, 3).map(rt => (
                    <button key={rt.id} onClick={() => { setShowGen(true) }} style={{
                      border: `1.5px solid ${rt.color}30`, borderRadius: 8, padding: '12px 8px',
                      background: rt.color + '08', cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: rt.color }}>{rt.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: rt.color, marginTop: 4 }}>{rt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGen && selectedClient && (
        <GenerateModal
          client={selectedClient}
          portfolio={clientPortfolio}
          onClose={() => { setShowGen(false); selectClient(selectedClient) }}
        />
      )}
    </div>
  )
}

const navBtn = {
  background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
  borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600,
  cursor: 'pointer',
}
