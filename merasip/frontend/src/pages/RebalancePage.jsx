import { useState, useEffect } from 'react'
import { api } from '../api'
import PortfolioCard from '../components/PortfolioCard'
import ComplianceFooter from '../components/ComplianceFooter'

const C = { navy: '#1B3A6B', green: '#0A7C4E', red: '#B91C1C', amber: '#92400E', muted: '#6B7280', border: '#D1D5DB', ink: '#111827' }

export default function RebalancePage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

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

  const loadPortfolio = async (clientId) => {
    setLoading(true)
    try {
      const data = await api.getPortfolio(clientId)
      setPortfolio(data.data || data)
      setSelectedClient(clients.find(c => c.id === clientId))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!portfolio || !selectedClient) return
    setGenerating(true)
    try {
      const result = await api.generateReport('individual', {
        ...portfolio,
        client_id: selectedClient.id,
      })
      if (result.pdf_url) {
        window.open(result.pdf_url, '_blank')
      }
    } catch (err) {
      alert('Failed to generate report: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const funds = portfolio?.funds || []
  const switchFunds = funds.filter(f => f.action === 'SWITCH')
  const reviewFunds = funds.filter(f => f.action === 'REVIEW')
  const holdFunds = funds.filter(f => f.action === 'HOLD')

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <header style={{
        background: C.navy, padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <a href="/advisor" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            MeraSIP
          </a>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 12 }}>Rebalancing Engine</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>ARN-286886</div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 8 }}>
          Rebalancing Engine
        </h1>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 24 }}>
          Select a client to view rebalancing recommendations based on MeraSIP shortlist
        </p>

        {/* Client selector */}
        {!selectedClient && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>Loading clients...</div>
            ) : clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
                No clients found. Add clients from the Dashboard.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => loadPortfolio(client.id)}
                    style={{
                      padding: '14px 18px', background: '#fff',
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.navy)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {client.type || 'Individual'} {client.pan ? `| ${client.pan}` : ''}
                      </div>
                    </div>
                    <div style={{ color: C.navy, fontSize: 12, fontWeight: 600, alignSelf: 'center' }}>
                      View →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rebalancing view */}
        {selectedClient && portfolio && (
          <div>
            <button
              onClick={() => { setSelectedClient(null); setPortfolio(null) }}
              style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '6px 16px', color: C.muted,
                fontSize: 11, cursor: 'pointer', marginBottom: 20,
              }}
            >
              ← Back to clients
            </button>

            <div style={{
              background: C.navy, borderRadius: 12, padding: 20, marginBottom: 24, color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Georgia, serif' }}>
                  {selectedClient.name}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                  {funds.length} funds analysed
                </div>
              </div>
              <button onClick={handleGenerateReport} disabled={generating} style={{
                background: '#fff', color: C.navy, border: 'none',
                borderRadius: 8, padding: '10px 20px', fontWeight: 700,
                fontSize: 12, cursor: generating ? 'wait' : 'pointer',
              }}>
                {generating ? 'Generating...' : 'Generate Rebalancing PDF'}
              </button>
            </div>

            {/* Action summary chips */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <Chip count={switchFunds.length} label="SWITCH" color={C.red} />
              <Chip count={reviewFunds.length} label="REVIEW" color={C.amber} />
              <Chip count={holdFunds.length} label="HOLD" color={C.green} />
            </div>

            {/* SWITCH funds */}
            {switchFunds.length > 0 && (
              <Section title="Immediate Action — Switch" color={C.red}>
                {switchFunds.map((f, i) => <PortfolioCard key={i} fund={f} />)}
              </Section>
            )}

            {/* REVIEW funds */}
            {reviewFunds.length > 0 && (
              <Section title="Needs Review" color={C.amber}>
                {reviewFunds.map((f, i) => <PortfolioCard key={i} fund={f} />)}
              </Section>
            )}

            {/* HOLD funds */}
            {holdFunds.length > 0 && (
              <Section title="Continue Holding" color={C.green}>
                {holdFunds.map((f, i) => <PortfolioCard key={i} fund={f} />)}
              </Section>
            )}
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}

function Chip({ count, label, color }) {
  if (!count) return null
  return (
    <span style={{
      background: color + '15', color, padding: '8px 16px',
      borderRadius: 20, fontSize: 13, fontWeight: 700,
    }}>
      {count} {label}
    </span>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{
        fontSize: 14, fontWeight: 700, color,
        borderBottom: `2px solid ${color}`, paddingBottom: 6, marginBottom: 12,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
