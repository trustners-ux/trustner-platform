import { useState, useRef } from 'react'
import { api } from '../api'
import PortfolioCard from '../components/PortfolioCard'
import ComplianceFooter from '../components/ComplianceFooter'

const C = {
  navy: '#1B3A6B', navyDim: '#2E5299', navyPale: '#E8EEF8',
  green: '#0A7C4E', red: '#B91C1C', amber: '#92400E',
  ink: '#111827', muted: '#6B7280', border: '#D1D5DB',
  bg0: '#FFFFFF', bg1: '#FAFBFC', bg2: '#F4F6F9',
}

const inr = (v) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toLocaleString('en-IN')
  return `${neg ? '-' : ''}${s}`
}

export default function ReviewPage() {
  const [step, setStep] = useState('upload') // upload | loading | result | submitted
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', mobile: '' })
  const fileRef = useRef(null)

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

  const handleParse = async () => {
    if (!file) return
    setStep('loading')
    setError('')
    try {
      const result = await api.parseCAS(file, password || undefined)
      setPortfolio(result)
      setClientInfo({
        name: result.investor?.name || '',
        email: result.investor?.email || '',
        mobile: result.investor?.mobile || '',
      })
      setStep('result')
    } catch (err) {
      setError(err.message || 'Failed to parse PDF. Please check the file and try again.')
      setStep('upload')
    }
  }

  const handleSubmitForReview = async () => {
    setReviewLoading(true)
    try {
      await api.submitForReview({
        client_name: clientInfo.name || portfolio?.investor?.name || 'Unknown',
        client_email: clientInfo.email || portfolio?.investor?.email,
        client_mobile: clientInfo.mobile || portfolio?.investor?.mobile,
        client_pan: portfolio?.investor?.pan,
        portfolio_data: portfolio,
        suggested_actions: { funds: portfolio?.funds },
      })
      setReviewSubmitted(true)
      setStep('submitted')
    } catch (err) {
      setError(err.message || 'Failed to submit for review.')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      // For direct download without auth, generate report via public endpoint
      // In production, this would call a public report generation endpoint
      alert('Report generation requires advisor login. Please share this portfolio with your advisor for a detailed PDF report.')
    } catch (err) {
      setError(err.message)
    }
  }

  const summary = portfolio?.summary || {}
  const funds = portfolio?.funds || []
  const investor = portfolio?.investor || {}

  return (
    <div style={{ minHeight: '100vh', background: C.bg1 }}>
      {/* Header */}
      <header style={{
        background: C.navy, padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif' }}>
            MeraSIP
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
            S.M.A.R.T Portfolio Review | ARN-286886
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
          by Trustner Asset Services
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {/* Upload Section */}
        {step === 'upload' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
                Instant Portfolio Review
              </h1>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
                Upload your CAS (Consolidated Account Statement) PDF from CAMS, KFintech, or MF Central
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
                background: file ? '#F0FAF5' : C.bg0,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect}
                style={{ display: 'none' }} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '✓' : '📄'}</div>
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
                    Drop your CAS PDF here or click to browse
                  </div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                    Supports CAMS, KFintech, and MF Central statements
                  </div>
                </div>
              )}
            </div>

            {/* PAN password field */}
            <div style={{ marginTop: 16 }}>
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
                marginTop: 12, padding: '10px 14px', background: '#FEF2F2',
                border: '1px solid #FECACA', borderRadius: 6, color: C.red, fontSize: 12,
              }}>
                {error}
              </div>
            )}

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
              Analyse My Portfolio
            </button>

            <div style={{
              marginTop: 24, padding: 16, background: C.bg2, borderRadius: 8,
              fontSize: 11, color: C.muted, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.ink }}>Your data is safe.</strong> We do not store your CAS PDF.
              It is processed in memory and deleted immediately. Only structured portfolio data is retained
              for your review. Read our <a href="/privacy" style={{ color: C.navy }}>Privacy Policy</a>.
            </div>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ fontWeight: 700, color: C.navy, fontSize: 16 }}>Analysing your portfolio...</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
              Extracting fund data and running rebalancing analysis
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'result' && portfolio && (
          <div>
            {/* Investor info */}
            <div style={{
              background: C.navy, borderRadius: 12, padding: 24, marginBottom: 24, color: '#fff',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6 }}>
                PORTFOLIO REVIEW
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, fontFamily: 'Georgia, serif' }}>
                {investor.name || 'Investor'}
              </div>
              {investor.pan && (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  PAN: {investor.pan} | {investor.report_date || 'Latest'}
                </div>
              )}
            </div>

            {/* KPI cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12, marginBottom: 24,
            }}>
              {[
                { label: 'Total Invested', value: `₹${inr(summary.total_invested)}`, color: C.navy },
                { label: 'Current Value', value: `₹${inr(summary.total_value)}`, color: C.navy },
                { label: 'Total Gain', value: `₹${inr(summary.total_gain)}`, color: summary.total_gain >= 0 ? C.green : C.red },
                { label: 'Abs. Return', value: `${summary.abs_return >= 0 ? '+' : ''}${summary.abs_return?.toFixed(1) || 0}%`, color: summary.abs_return >= 0 ? C.green : C.red },
                ...(summary.xirr != null ? [{ label: 'XIRR', value: `${summary.xirr >= 0 ? '+' : ''}${summary.xirr?.toFixed(1)}%`, color: summary.xirr >= 0 ? C.green : C.red }] : []),
                { label: 'Funds', value: String(funds.length), color: C.navy },
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

            {/* Action summary */}
            {funds.length > 0 && (
              <div style={{
                display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
              }}>
                {['HOLD', 'SWITCH', 'REVIEW', 'EXIT'].map(action => {
                  const count = funds.filter(f => f.action === action).length
                  if (!count) return null
                  const colors = {
                    HOLD: { bg: '#F0FAF5', text: C.green },
                    SWITCH: { bg: '#FEF2F2', text: C.red },
                    REVIEW: { bg: '#FFFBEB', text: C.amber },
                    EXIT: { bg: '#FEF2F2', text: C.red },
                  }[action]
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

            {/* Fund list */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
                Fund Analysis ({funds.length} funds)
              </h2>
              {funds.map((fund, i) => (
                <PortfolioCard key={i} fund={fund} />
              ))}
            </div>

            {/* CTA section */}
            <div style={{
              background: C.bg0, border: `2px solid ${C.navyPale}`, borderRadius: 12,
              padding: 24, marginBottom: 32,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
                What would you like to do?
              </h3>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>
                Choose how you'd like to proceed with your portfolio review
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Option 1: Direct download */}
                <button onClick={handleDownloadReport} style={{
                  padding: '14px 20px', background: C.bg2, border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>📥</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>Download Summary</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      Get your portfolio analysis as shown above
                    </div>
                  </div>
                </button>

                {/* Option 2: Expert review */}
                <button onClick={handleSubmitForReview} disabled={reviewLoading} style={{
                  padding: '14px 20px', background: C.navy, border: 'none',
                  borderRadius: 8, cursor: reviewLoading ? 'wait' : 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12, color: '#fff',
                }}>
                  <span style={{ fontSize: 24 }}>🔍</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {reviewLoading ? 'Submitting...' : 'Request Expert Review from Trustner'}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                      Our team will personally review and curate your recommendations, then send you a branded PDF report
                    </div>
                  </div>
                </button>
              </div>

              {/* Contact info for expert review */}
              {!reviewSubmitted && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>
                    Your contact details (for receiving the reviewed report)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      value={clientInfo.name}
                      onChange={e => setClientInfo(p => ({ ...p, name: e.target.value }))}
                      placeholder="Full Name"
                      style={inputStyle}
                    />
                    <input
                      value={clientInfo.email}
                      onChange={e => setClientInfo(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      style={inputStyle}
                    />
                    <input
                      value={clientInfo.mobile}
                      onChange={e => setClientInfo(p => ({ ...p, mobile: e.target.value }))}
                      placeholder="Mobile"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Start over */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <button
                onClick={() => { setStep('upload'); setPortfolio(null); setFile(null); setError('') }}
                style={{
                  background: 'transparent', border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '8px 20px', color: C.muted,
                  fontSize: 12, cursor: 'pointer',
                }}
              >
                Upload Another CAS
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: '#FEF2F2',
                border: '1px solid #FECACA', borderRadius: 6, color: C.red, fontSize: 12,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Review submitted confirmation */}
        {step === 'submitted' && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>
              Expert Review Requested
            </h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
              Your portfolio has been submitted to the Trustner team for a personalized review.
              We will curate the recommendations and send you a branded PDF report within 24 hours.
            </p>
            <div style={{
              marginTop: 24, padding: 16, background: C.navyPale, borderRadius: 8,
              fontSize: 12, color: C.navy, fontWeight: 600,
            }}>
              We'll reach you at: {clientInfo.email || clientInfo.mobile || 'your registered contact'}
            </div>
            <button
              onClick={() => { setStep('upload'); setPortfolio(null); setFile(null); setReviewSubmitted(false) }}
              style={{
                marginTop: 24, background: C.navy, color: '#fff',
                border: 'none', borderRadius: 8, padding: '12px 32px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Upload Another CAS
            </button>
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}

const inputStyle = {
  padding: '8px 12px', border: '1px solid #D1D5DB',
  borderRadius: 6, fontSize: 12, outline: 'none',
}
