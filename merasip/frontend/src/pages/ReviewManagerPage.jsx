import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import PortfolioCard from '../components/PortfolioCard'
import ComplianceFooter from '../components/ComplianceFooter'

const C = {
  navy: '#1B3A6B', navyDim: '#2E5299', green: '#0A7C4E', red: '#B91C1C', amber: '#92400E',
  muted: '#6B7280', border: '#D1D5DB', ink: '#111827', bg2: '#F4F6F9',
}

const STATUS_STYLES = {
  pending_review: { bg: '#FFFBEB', color: C.amber, label: 'Pending Review' },
  in_review:      { bg: '#E8EEF8', color: C.navy, label: 'In Review' },
  approved:       { bg: '#F0FAF5', color: C.green, label: 'Approved' },
  rejected:       { bg: '#FEF2F2', color: C.red, label: 'Rejected' },
}

const inr = (v) => {
  if (v == null) return '—'
  const abs = Math.abs(v)
  let s = abs >= 1e7 ? `${(abs / 1e7).toFixed(2)} Cr`
        : abs >= 1e5 ? `${(abs / 1e5).toFixed(2)} L`
        : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)} K`
        : abs.toLocaleString('en-IN')
  return `${v < 0 ? '-' : ''}${s}`
}

export default function ReviewManagerPage() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [editedFunds, setEditedFunds] = useState([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => { loadQueue() }, [filter])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const res = await api.getReviewQueue(filter || undefined)
      setQueue(res.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadItem = async (id) => {
    try {
      const item = await api.getReviewItem(id)
      setSelected(item)
      setNotes(item.reviewer_notes || '')
      const funds = item.portfolio_data?.funds || item.curated_actions?.funds || []
      setEditedFunds(funds.map(f => ({ ...f })))

      // Mark as in_review if pending
      if (item.status === 'pending_review') {
        await api.updateReview(id, { status: 'in_review' })
        loadQueue()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const updateFundAction = (index, field, value) => {
    setEditedFunds(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleApprove = async () => {
    if (!selected) return
    try {
      await api.updateReview(selected.id, {
        status: 'approved',
        curated_actions: { funds: editedFunds },
        reviewer_notes: notes,
      })
      loadQueue()
      setSelected(null)
    } catch (err) {
      alert('Failed to approve: ' + err.message)
    }
  }

  const handleReject = async () => {
    if (!selected || !notes) {
      alert('Please add a note explaining the rejection.')
      return
    }
    try {
      await api.updateReview(selected.id, {
        status: 'rejected',
        reviewer_notes: notes,
      })
      loadQueue()
      setSelected(null)
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    }
  }

  const handleGeneratePDF = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      const result = await api.generateReviewedReport(selected.id)
      if (result.pdf_url) {
        window.open(result.pdf_url, '_blank')
      }
      loadQueue()
    } catch (err) {
      alert('Failed to generate: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <header style={{ background: C.navy, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/advisor" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>MeraSIP</a>
          <nav style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Dashboard', href: '/advisor' },
              { label: 'Rebalance', href: '/advisor/rebalance' },
              { label: 'Analyse', href: '/advisor/analyse' },
              { label: 'NAV Engine', href: '/advisor/nav' },
              ...(isManager ? [{ label: 'Review Queue', href: '/advisor/review-queue' }] : []),
              { label: 'Team', href: '/advisor/team' },
              ...(isAdmin ? [{ label: 'Admin', href: '/advisor/admin' }] : []),
            ].map(link => (
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
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{user?.name || user?.email}</span>
          </a>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        {/* Queue view */}
        {!selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
                Review Queue
              </h1>
              <div style={{ display: 'flex', gap: 6 }}>
                {['', 'pending_review', 'in_review', 'approved', 'rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    background: filter === f ? C.navy : '#fff',
                    color: filter === f ? '#fff' : C.muted,
                    border: `1px solid ${filter === f ? C.navy : C.border}`,
                    borderRadius: 6, padding: '5px 12px', fontSize: 10,
                    fontWeight: 600, cursor: 'pointer',
                  }}>
                    {f ? STATUS_STYLES[f]?.label : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>Loading...</div>
            ) : queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                No items in queue{filter ? ` with status "${STATUS_STYLES[filter]?.label}"` : ''}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queue.map(item => {
                  const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending_review
                  const summary = item.portfolio_data?.summary || {}
                  return (
                    <div
                      key={item.id}
                      onClick={() => loadItem(item.id)}
                      style={{
                        padding: '16px 20px', background: '#fff',
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{item.client_name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {item.client_email || item.client_mobile || 'No contact'} |
                          Uploaded: {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </div>
                        {summary.total_value && (
                          <div style={{ fontSize: 11, color: C.navy, fontWeight: 600, marginTop: 4 }}>
                            Portfolio: ₹{inr(summary.total_value)} |
                            Return: {summary.abs_return ? `${summary.abs_return.toFixed(1)}%` : '—'}
                          </div>
                        )}
                      </div>
                      <span style={{
                        background: st.bg, color: st.color, padding: '4px 12px',
                        borderRadius: 4, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                      }}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail / Edit view */}
        {selected && (
          <div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '6px 16px', color: C.muted,
                fontSize: 11, cursor: 'pointer', marginBottom: 20,
              }}
            >
              ← Back to queue
            </button>

            {/* Client info header */}
            <div style={{
              background: C.navy, borderRadius: 12, padding: 20, marginBottom: 24, color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6 }}>REVIEW ITEM</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, fontFamily: 'Georgia, serif' }}>
                    {selected.client_name}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                    {selected.client_email} | {selected.client_mobile} | PAN: {selected.client_pan || '—'}
                  </div>
                </div>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
                  borderRadius: 4, fontSize: 10, fontWeight: 700,
                }}>
                  {STATUS_STYLES[selected.status]?.label}
                </span>
              </div>
            </div>

            {/* Editable fund list */}
            <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              Fund Analysis — Edit Recommendations
            </h2>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
              Modify the action (HOLD/SWITCH/REVIEW) and analysis text for each fund before approving.
            </p>

            {editedFunds.map((fund, i) => (
              <div key={i} style={{
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
                padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{fund.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {fund.category || fund.cat || '—'} | Inv: ₹{inr(fund.invested ?? fund.inv)} | Val: ₹{inr(fund.value ?? fund.val)}
                    </div>
                  </div>
                  <select
                    value={fund.action || 'HOLD'}
                    onChange={e => updateFundAction(i, 'action', e.target.value)}
                    style={{
                      padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      color: { HOLD: C.green, SWITCH: C.red, REVIEW: C.amber, EXIT: C.red }[fund.action] || C.ink,
                    }}
                  >
                    <option value="HOLD">HOLD</option>
                    <option value="SWITCH">SWITCH</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="EXIT">EXIT</option>
                  </select>
                </div>
                <textarea
                  value={fund.analysis || ''}
                  onChange={e => updateFundAction(i, 'analysis', e.target.value)}
                  placeholder="Analysis / recommendation notes..."
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`,
                    borderRadius: 6, fontSize: 11, resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {/* Reviewer notes */}
            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.ink, display: 'block', marginBottom: 8 }}>
                Reviewer Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any overall notes or observations about this portfolio..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 12, resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              {selected.status !== 'approved' && (
                <>
                  <button onClick={handleApprove} style={{
                    flex: 1, padding: '14px', background: C.green, color: '#fff',
                    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                    Approve & Save
                  </button>
                  <button onClick={handleReject} style={{
                    padding: '14px 24px', background: '#fff', color: C.red,
                    border: `2px solid ${C.red}`, borderRadius: 8, fontWeight: 700,
                    fontSize: 14, cursor: 'pointer',
                  }}>
                    Reject
                  </button>
                </>
              )}
              {selected.status === 'approved' && (
                <button onClick={handleGeneratePDF} disabled={generating} style={{
                  flex: 1, padding: '14px', background: C.navy, color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                  cursor: generating ? 'wait' : 'pointer',
                }}>
                  {generating ? 'Generating PDF...' : 'Generate Final PDF Report'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}
