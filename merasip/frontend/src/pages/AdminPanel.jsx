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
const roleBadgeStyle = (role) => {
  if (role === 'admin') return { background: C.navy, color: '#fff' }
  if (role === 'manager') return { background: C.navyDim, color: '#fff' }
  return { background: C.bg2, color: C.muted, border: `1px solid ${C.border}` }
}

const actionBadgeStyle = (action) => {
  const map = {
    login: { bg: C.greenPale, color: C.green },
    password_changed: { bg: C.amberPale, color: C.amber },
    report_generated: { bg: C.navyPale, color: C.navy },
    cas_parsed: { bg: C.violetPale, color: C.violet },
  }
  return map[action] || { bg: C.bg2, color: C.muted }
}

const formatRelativeTime = (ts) => {
  if (!ts) return 'Never'
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── MODAL OVERLAY ───────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: C.bg0, borderRadius: 12, width: 520, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: `1px solid ${C.border}`,
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── FORM INPUT ──────────────────────────────────────────────
const inputStyle = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: C.bg0,
}

const selectStyle = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto',
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4,
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function AdminPanel() {
  const { user, isManager, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [tab, setTab] = useState('team')
  const [employees, setEmployees] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [resetResult, setResetResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [editForm, setEditForm] = useState({ name: '', designation: '', department: '', role: 'employee', status: 'active' })
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', designation: '', department: '', role: 'employee' })

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (tab === 'activity') loadActivityLog()
  }, [tab])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const res = await api.getEmployees()
      setEmployees(res.employees || res || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLog = async () => {
    setActivityLoading(true)
    try {
      const res = await api.getActivityLog()
      setActivityLog((res.entries || res || []).slice(0, 100))
    } catch (err) {
      console.error('Failed to load activity log:', err)
    } finally {
      setActivityLoading(false)
    }
  }

  // ─── Edit Employee ───
  const openEdit = (emp) => {
    setEditingEmployee(emp)
    setEditForm({
      name: emp.name || '',
      designation: emp.designation || '',
      department: emp.department || '',
      role: emp.role || 'employee',
      status: emp.status || 'active',
    })
    setError('')
    setShowEditModal(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    setError('')
    try {
      await api.updateEmployee(editingEmployee.id, editForm)
      setShowEditModal(false)
      loadEmployees()
    } catch (err) {
      setError(err.message || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  // ─── Add Employee ───
  const openAdd = () => {
    setAddForm({ name: '', email: '', password: '', designation: '', department: '', role: 'employee' })
    setError('')
    setShowAddModal(true)
  }

  const saveAdd = async () => {
    setSaving(true)
    setError('')
    try {
      await api.createEmployee(addForm)
      setShowAddModal(false)
      loadEmployees()
    } catch (err) {
      setError(err.message || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  // ─── Reset Password ───
  const openReset = (emp) => {
    setEditingEmployee(emp)
    setResetResult(null)
    setError('')
    setShowResetModal(true)
  }

  const confirmReset = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await api.resetEmployeePassword(editingEmployee.id)
      setResetResult(res.new_password || res.password || 'Password reset successfully')
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle status ───
  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active'
    try {
      await api.updateEmployee(emp.id, { status: newStatus })
      loadEmployees()
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  // ─── KPI calculations ───
  const totalCount = employees.length
  const activeCount = employees.filter(e => e.status === 'active').length
  const managerCount = employees.filter(e => e.role === 'manager').length
  const adminCount = employees.filter(e => e.role === 'admin').length

  const kpis = [
    { label: 'Total Employees', value: totalCount, bg: C.navyPale, color: C.navy },
    { label: 'Active', value: activeCount, bg: C.greenPale, color: C.green },
    { label: 'Managers', value: managerCount, bg: C.amberPale, color: C.amber },
    { label: 'Admins', value: adminCount, bg: C.violetPale, color: C.violet },
  ]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
            Administration
          </h1>
          <span style={{
            background: C.navy, color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 10, textTransform: 'capitalize',
          }}>
            {user?.role || 'admin'}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${C.border}`, paddingBottom: 0 }}>
          {[
            { key: 'team', label: 'Team Management' },
            { key: 'activity', label: 'Activity Log' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'transparent', border: 'none', borderBottom: tab === t.key ? `2px solid ${C.navy}` : '2px solid transparent',
                color: tab === t.key ? C.navy : C.muted,
                fontWeight: 700, fontSize: 13, padding: '10px 20px',
                cursor: 'pointer', marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ TEAM MANAGEMENT TAB ═══ */}
        {tab === 'team' && (
          <div>
            {/* KPI row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {kpis.map((kpi, i) => (
                <div key={i} style={{
                  flex: 1, background: kpi.bg, borderRadius: 10, padding: '18px 20px',
                  border: `1px solid ${kpi.color}20`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: kpi.color, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Employee button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={openAdd} style={{
                background: C.navy, color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                + Add Employee
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted, fontSize: 14 }}>
                Loading employees...
              </div>
            )}

            {/* Employee table */}
            {!loading && (
              <div style={{ background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                      {['Name', 'Email', 'Designation', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '12px 14px', fontSize: 11,
                          fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => {
                      const rb = roleBadgeStyle(emp.role)
                      return (
                        <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{emp.name || '—'}</td>
                          <td style={{ padding: '12px 14px', color: C.muted }}>{emp.email}</td>
                          <td style={{ padding: '12px 14px', color: C.muted }}>{emp.designation || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              ...rb, fontSize: 10, fontWeight: 700, padding: '3px 10px',
                              borderRadius: 10, textTransform: 'capitalize', display: 'inline-block',
                            }}>
                              {emp.role || 'employee'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: emp.status === 'active' ? C.green : C.red,
                                display: 'inline-block',
                              }} />
                              <span style={{
                                fontSize: 12, fontWeight: 600,
                                color: emp.status === 'active' ? C.green : C.red,
                              }}>
                                {emp.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: C.muted, fontSize: 12 }}>
                            {formatRelativeTime(emp.last_login_at)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openEdit(emp)} style={{
                                background: C.navyPale, color: C.navy, border: 'none',
                                borderRadius: 6, padding: '5px 10px', fontSize: 11,
                                fontWeight: 600, cursor: 'pointer',
                              }}>
                                Edit
                              </button>
                              <button onClick={() => openReset(emp)} style={{
                                background: C.amberPale, color: C.amber, border: 'none',
                                borderRadius: 6, padding: '5px 10px', fontSize: 11,
                                fontWeight: 600, cursor: 'pointer',
                              }}>
                                Reset Password
                              </button>
                              <button onClick={() => toggleStatus(emp)} style={{
                                background: emp.status === 'active' ? C.redPale : C.greenPale,
                                color: emp.status === 'active' ? C.red : C.green,
                                border: 'none', borderRadius: 6, padding: '5px 10px',
                                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              }}>
                                {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {employees.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>
                    No employees found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ ACTIVITY LOG TAB ═══ */}
        {tab === 'activity' && (
          <div>
            {activityLoading && (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted, fontSize: 14 }}>
                Loading activity log...
              </div>
            )}

            {!activityLoading && (
              <div style={{ background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                      {['Timestamp', 'Employee', 'Action', 'Details'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '12px 14px', fontSize: 11,
                          fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activityLog.map((entry, i) => {
                      const ab = actionBadgeStyle(entry.action)
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px 14px', color: C.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                            {entry.timestamp
                              ? new Date(entry.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                            {entry.employee_name || entry.employee || '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: ab.bg, color: ab.color,
                              fontSize: 10, fontWeight: 700, padding: '3px 10px',
                              borderRadius: 10, display: 'inline-block',
                            }}>
                              {(entry.action || '—').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: C.muted, fontSize: 12 }}>
                            {entry.details || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {activityLog.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>
                    No activity log entries found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ EDIT MODAL ═══ */}
      {showEditModal && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <div style={{ padding: '24px 24px 8px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>Edit Employee</h2>
            <button onClick={() => setShowEditModal(false)} style={{
              background: C.bg2, border: 'none', width: 28, height: 28, borderRadius: 6,
              cursor: 'pointer', fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
          </div>
          <div style={{ padding: 24 }}>
            {error && <div style={{ background: C.redPale, color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>{error}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Designation</label>
              <input value={editForm.designation} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Department</label>
              <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={selectStyle}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{
                background: C.bg2, color: C.ink, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{
                background: C.navy, color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ ADD EMPLOYEE MODAL ═══ */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <div style={{ padding: '24px 24px 8px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>Add Employee</h2>
            <button onClick={() => setShowAddModal(false)} style={{
              background: C.bg2, border: 'none', width: 28, height: 28, borderRadius: 6,
              cursor: 'pointer', fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
          </div>
          <div style={{ padding: 24 }}>
            {error && <div style={{ background: C.redPale, color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>{error}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name</label>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Full name" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="employee@trustner.com" type="email" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} placeholder="Initial password" type="password" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Designation</label>
              <input value={addForm.designation} onChange={e => setAddForm(f => ({ ...f, designation: e.target.value }))} style={inputStyle} placeholder="e.g. Financial Analyst" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Department</label>
              <input value={addForm.department} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} placeholder="e.g. Advisory" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Role</label>
              <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} style={selectStyle}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} style={{
                background: C.bg2, color: C.ink, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={saveAdd} disabled={saving} style={{
                background: C.navy, color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ RESET PASSWORD MODAL ═══ */}
      {showResetModal && (
        <ModalOverlay onClose={() => setShowResetModal(false)}>
          <div style={{ padding: '24px 24px 8px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>Reset Password</h2>
            <button onClick={() => setShowResetModal(false)} style={{
              background: C.bg2, border: 'none', width: 28, height: 28, borderRadius: 6,
              cursor: 'pointer', fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
          </div>
          <div style={{ padding: 24 }}>
            {error && <div style={{ background: C.redPale, color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>{error}</div>}

            {!resetResult ? (
              <div>
                <p style={{ fontSize: 13, color: C.ink, marginBottom: 20 }}>
                  Are you sure you want to reset the password for <strong>{editingEmployee?.name || editingEmployee?.email}</strong>?
                  This will generate a new temporary password.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowResetModal(false)} style={{
                    background: C.bg2, color: C.ink, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                  <button onClick={confirmReset} disabled={saving} style={{
                    background: C.amber, color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13,
                    cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}>
                    {saving ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 12 }}>
                  Password has been reset successfully.
                </p>
                <div style={{
                  background: C.greenPale, border: `1px solid ${C.green}30`, borderRadius: 8,
                  padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: '0.04em' }}>
                    {resetResult}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(resetResult) }}
                    style={{
                      background: C.green, color: '#fff', border: 'none', borderRadius: 6,
                      padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowResetModal(false)} style={{
                    background: C.navy, color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </ModalOverlay>
      )}

      <ComplianceFooter />
    </div>
  )
}
