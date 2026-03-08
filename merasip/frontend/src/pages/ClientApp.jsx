import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import PortfolioCard from '../components/PortfolioCard'
import ComplianceFooter from '../components/ComplianceFooter'

const C = { navy: '#1B3A6B', green: '#0A7C4E', red: '#B91C1C', muted: '#6B7280', border: '#D1D5DB', ink: '#111827' }

const inr = (v) => {
  if (v == null) return '—'
  const neg = v < 0; const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toLocaleString('en-IN')
  return `${neg ? '-' : ''}${s}`
}

export default function ClientApp() {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPortfolio()
  }, [id])

  const loadPortfolio = async () => {
    try {
      const data = await api.getPortfolio(id)
      setPortfolio(data.data || data)
    } catch (err) {
      setError('Portfolio not found or link has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.navy }}>
        Loading portfolio...
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
        <header style={{ background: C.navy, padding: '16px 24px' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif' }}>MeraSIP</div>
        </header>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ color: C.navy, fontFamily: 'Georgia, serif' }}>Portfolio Not Found</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{error || 'The requested portfolio could not be loaded.'}</p>
          <a href="/review" style={{
            display: 'inline-block', marginTop: 24, background: C.navy, color: '#fff',
            padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13,
          }}>
            Upload Your CAS
          </a>
        </div>
        <ComplianceFooter />
      </div>
    )
  }

  const investor = portfolio.investor || {}
  const summary = portfolio.summary || {}
  const funds = portfolio.funds || []

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <header style={{
        background: C.navy, padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif' }}>MeraSIP</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Portfolio View | ARN-286886</div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {/* Investor header */}
        <div style={{
          background: C.navy, borderRadius: 12, padding: 24, marginBottom: 24, color: '#fff',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6 }}>
            PORTFOLIO REVIEW
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, fontFamily: 'Georgia, serif' }}>
            {investor.name || 'Investor'}
          </div>
          {investor.report_date && (
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
              As on {investor.report_date}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Invested', value: `₹${inr(summary.total_invested)}`, color: C.navy },
            { label: 'Current Value', value: `₹${inr(summary.total_value)}`, color: C.navy },
            { label: 'Gain/Loss', value: `₹${inr(summary.total_gain)}`, color: summary.total_gain >= 0 ? C.green : C.red },
            { label: 'Return', value: `${(summary.abs_return || 0) >= 0 ? '+' : ''}${(summary.abs_return || 0).toFixed(1)}%`, color: (summary.abs_return || 0) >= 0 ? C.green : C.red },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontFamily: 'Georgia, serif' }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Fund list */}
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
          Your Funds ({funds.length})
        </h2>
        {funds.map((fund, i) => (
          <PortfolioCard key={i} fund={fund} />
        ))}

        {/* Disclaimer */}
        <div style={{
          marginTop: 32, padding: 16, background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 8, fontSize: 11, color: C.ink, lineHeight: 1.6,
        }}>
          <strong>Disclaimer:</strong> This portfolio view is based on your CAS statement and is for informational purposes only.
          Trustner Asset Services Pvt. Ltd. (ARN-286886) is an AMFI Registered Mutual Fund Distributor, not a SEBI Registered Investment Adviser.
          Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing.
        </div>
      </main>

      <ComplianceFooter />
    </div>
  )
}
