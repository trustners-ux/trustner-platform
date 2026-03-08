import { useState } from 'react'
import { api } from '../api'
import ComplianceFooter from '../components/ComplianceFooter'

const C = { navy: '#1B3A6B', green: '#0A7C4E', red: '#B91C1C', muted: '#6B7280', border: '#D1D5DB', ink: '#111827' }

export default function NavEngine() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      // If query is a number, fetch directly
      if (/^\d+$/.test(query.trim())) {
        const nav = await api.getNAV(query.trim())
        setSelected(nav)
        setResults([])
        const hist = await api.getNAVHistory(query.trim(), 30)
        setHistory(hist.history || [])
      } else {
        const res = await api.searchFunds(query.trim())
        setResults(res.results || [])
        setSelected(null)
        setHistory([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFund = async (fund) => {
    setLoading(true)
    try {
      const code = fund.schemeCode || fund.scheme_code
      const nav = await api.getNAV(code)
      setSelected(nav)
      const hist = await api.getNAVHistory(code, 30)
      setHistory(hist.history || [])
      setResults([])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 12 }}>NAV Engine</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>ARN-286886</div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 16 }}>
          Live NAV Engine
        </h1>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 24 }}>
          Search by fund name or enter scheme code directly. Data from mfapi.in.
        </p>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Fund name or scheme code (e.g. 118989)"
            style={{
              flex: 1, padding: '12px 16px', border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleSearch} disabled={loading} style={{
            background: C.navy, color: '#fff', border: 'none',
            borderRadius: 8, padding: '12px 24px', fontWeight: 700,
            fontSize: 13, cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
              {results.length} schemes found
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {results.map((fund, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectFund(fund)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: '#fff', fontSize: 12,
                    display: 'flex', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F4F6F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <span style={{ color: C.ink, fontWeight: 500 }}>{fund.schemeName || fund.scheme_name}</span>
                  <span style={{ color: C.muted, fontSize: 10, fontFamily: 'monospace' }}>
                    {fund.schemeCode || fund.scheme_code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected fund NAV */}
        {selected && (
          <div style={{
            background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 24, marginBottom: 24,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em' }}>
              SCHEME CODE: {selected.scheme_code}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 4, fontFamily: 'Georgia, serif' }}>
              {selected.scheme_name}
            </div>
            {selected.fund_house && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{selected.fund_house}</div>
            )}

            <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted }}>Latest NAV</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>
                  {selected.nav?.toFixed(4)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted }}>As on</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 6 }}>
                  {selected.date}
                </div>
              </div>
              {selected.scheme_category && (
                <div>
                  <div style={{ fontSize: 10, color: C.muted }}>Category</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 6 }}>
                    {selected.scheme_category}
                  </div>
                </div>
              )}
            </div>

            {/* Simple NAV history table */}
            {history.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                  Recent NAV History
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 0, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden',
                }}>
                  <div style={thStyle}>Date</div>
                  <div style={thStyle}>NAV</div>
                  {history.slice(0, 15).map((point, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <div style={tdStyle(i)}>{point.date}</div>
                      <div style={{ ...tdStyle(i), fontWeight: 600, fontFamily: 'monospace' }}>
                        {point.nav?.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}

const thStyle = {
  padding: '8px 12px', background: '#1B3A6B', color: '#fff',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
}
const tdStyle = (i) => ({
  padding: '6px 12px', fontSize: 11, color: '#111827',
  background: i % 2 === 0 ? '#fff' : '#F4F6F9',
  borderBottom: '1px solid #D1D5DB',
})
