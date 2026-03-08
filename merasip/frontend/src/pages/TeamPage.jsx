import { useState, useEffect } from 'react'
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
const avatarColor = (role) => {
  if (role === 'admin') return C.navy
  if (role === 'manager') return C.navyDim
  return C.muted
}

const roleBadge = (role) => {
  if (role === 'admin') return { bg: C.navy, color: '#fff', border: 'none' }
  if (role === 'manager') return { bg: C.navyDim, color: '#fff', border: 'none' }
  return { bg: C.bg0, color: C.muted, border: `1px solid ${C.border}` }
}

const initials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return (email || '?')[0].toUpperCase()
}

const formatLastLogin = (ts) => {
  if (!ts) return null
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── ROLE FILTERS ────────────────────────────────────────────
const ROLE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'manager', label: 'Managers' },
  { key: 'employee', label: 'Employees' },
]

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function TeamPage() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees()
      setEmployees(res.employees || res || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(emp => {
    const matchesSearch = !search ||
      (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter
    return matchesSearch && matchesRole
  })

  const counts = {
    all: employees.length,
    admin: employees.filter(e => e.role === 'admin').length,
    manager: employees.filter(e => e.role === 'manager').length,
    employee: employees.filter(e => e.role === 'employee').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg1, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: C.ink }}>
      {/* Navigation header */}
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

      {/* Page content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
              Trustner Team
            </h1>
            <span style={{
              background: C.navyPale, color: C.navy, fontSize: 11, fontWeight: 700,
              padding: '3px 10px', borderRadius: 10,
            }}>
              {employees.length}
            </span>
          </div>
          {isAdmin && (
            <a href="/advisor/admin" style={{
              background: C.navy, color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              textDecoration: 'none', display: 'inline-block',
            }}>
              Manage Team
            </a>
          )}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or designation..."
            style={{
              flex: 1, minWidth: 240, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              background: C.bg0,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {ROLE_FILTERS.map(rf => (
              <button
                key={rf.key}
                onClick={() => setRoleFilter(rf.key)}
                style={{
                  background: roleFilter === rf.key ? C.navy : C.bg0,
                  color: roleFilter === rf.key ? '#fff' : C.muted,
                  border: `1px solid ${roleFilter === rf.key ? C.navy : C.border}`,
                  borderRadius: 6, padding: '7px 14px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {rf.label} ({counts[rf.key]})
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: C.muted, fontSize: 14 }}>
            Loading team...
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No team members found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter.</div>
          </div>
        )}

        {/* Employee card grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {filtered.map(emp => {
              const badge = roleBadge(emp.role)
              const isHovered = hoveredCard === emp.id
              return (
                <div
                  key={emp.id}
                  onMouseEnter={() => setHoveredCard(emp.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', transition: 'box-shadow 0.2s',
                    boxShadow: isHovered ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: avatarColor(emp.role),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 12,
                    letterSpacing: '0.02em',
                  }}>
                    {initials(emp.name, emp.email)}
                  </div>

                  {/* Name */}
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
                    {emp.name || 'Unnamed'}
                  </div>

                  {/* Designation */}
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 2 }}>
                    {emp.designation || '—'}
                  </div>

                  {/* Department */}
                  {emp.department && (
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                      {emp.department}
                    </div>
                  )}

                  {/* Role badge + Status dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      background: badge.bg, color: badge.color,
                      border: badge.border, fontSize: 10, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 10, textTransform: 'capitalize',
                    }}>
                      {emp.role || 'employee'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: emp.status === 'active' ? C.green : C.red,
                        display: 'inline-block',
                      }} />
                      <span style={{ fontSize: 10, color: emp.status === 'active' ? C.green : C.red, fontWeight: 600 }}>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>

                  {/* Email */}
                  <a
                    href={`mailto:${emp.email}`}
                    style={{ fontSize: 12, color: C.muted, textDecoration: 'none', marginBottom: 6, wordBreak: 'break-all' }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.navy)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                  >
                    {emp.email}
                  </a>

                  {/* Last login */}
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {emp.last_login_at
                      ? `Last login: ${formatLastLogin(emp.last_login_at)}`
                      : 'Never logged in'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <ComplianceFooter />
    </div>
  )
}
