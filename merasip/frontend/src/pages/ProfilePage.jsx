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

const roleBadgeStyle = (role) => {
  if (role === 'admin') return { background: C.navy, color: '#fff' }
  if (role === 'manager') return { background: C.navyDim, color: '#fff' }
  return { background: C.bg2, color: C.muted, border: `1px solid ${C.border}` }
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

const formatDate = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const formatDateTime = (ts) => {
  if (!ts) return 'Never'
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const inputStyle = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: C.bg0,
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4,
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function ProfilePage() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  const validatePassword = () => {
    if (!currentPassword) return 'Current password is required'
    if (newPassword.length < 8) return 'New password must be at least 8 characters'
    if (!/\d/.test(newPassword)) return 'New password must include a number'
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleChangePassword = async () => {
    setPwSuccess('')
    setPwError('')
    const validationError = validatePassword()
    if (validationError) {
      setPwError(validationError)
      return
    }
    setPwSaving(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setPwSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const rb = roleBadgeStyle(user?.role)

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

      {/* Page content - centered */}
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>

        {/* ═══ PROFILE CARD ═══ */}
        <div style={{
          background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 32, marginBottom: 24, textAlign: 'center',
        }}>
          {/* Large avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: avatarColor(user?.role),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 auto 16px',
            letterSpacing: '0.02em',
          }}>
            {initials(user?.name, user?.email)}
          </div>

          {/* Name */}
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            {user?.name || 'User'}
          </div>

          {/* Designation */}
          <div style={{ fontSize: 16, color: C.muted, marginBottom: 12 }}>
            {user?.designation || '—'}
          </div>

          {/* Department + Role + Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Department */}
            {user?.department && (
              <span style={{
                background: C.bg2, color: C.muted, border: `1px solid ${C.border}`,
                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 10,
              }}>
                {user.department}
              </span>
            )}

            {/* Role */}
            <span style={{
              ...rb, fontSize: 11, fontWeight: 700, padding: '4px 12px',
              borderRadius: 10, textTransform: 'capitalize', display: 'inline-block',
            }}>
              {user?.role || 'employee'}
            </span>

            {/* Status */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: user?.status === 'active' ? C.green : C.red,
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: user?.status === 'active' ? C.green : C.red,
              }}>
                {user?.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>

          {/* Details */}
          <div style={{
            borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8,
            display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
            maxWidth: 400, margin: '16px auto 0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted, fontWeight: 500 }}>Email</span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{user?.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted, fontWeight: 500 }}>Member since</span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{formatDate(user?.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted, fontWeight: 500 }}>Last login</span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{formatDateTime(user?.last_login)}</span>
            </div>
          </div>
        </div>

        {/* ═══ CHANGE PASSWORD CARD ═══ */}
        <div style={{
          background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: '0 0 20px' }}>
            Change Password
          </h2>

          {/* Success message */}
          {pwSuccess && (
            <div style={{
              background: C.greenPale, color: C.green, border: `1px solid ${C.green}30`,
              padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              marginBottom: 16,
            }}>
              {pwSuccess}
            </div>
          )}

          {/* Error message */}
          {pwError && (
            <div style={{
              background: C.redPale, color: C.red, border: `1px solid ${C.red}30`,
              padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              marginBottom: 16,
            }}>
              {pwError}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter current password"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter new password"
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Min 8 characters, include a number
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <div style={{ fontSize: 11, color: C.red, marginTop: 4, fontWeight: 600 }}>
                Passwords do not match
              </div>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            style={{
              background: C.navy, color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px 24px', fontWeight: 700, fontSize: 14,
              cursor: pwSaving ? 'wait' : 'pointer', opacity: pwSaving ? 0.7 : 1,
              width: '100%',
            }}
          >
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </main>

      <ComplianceFooter />
    </div>
  )
}
