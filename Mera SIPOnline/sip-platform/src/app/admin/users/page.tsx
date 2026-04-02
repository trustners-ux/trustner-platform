'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserCog, Plus, Trash2, KeyRound, Shield, ShieldCheck,
  X, Check, Eye, EyeOff, Copy, RefreshCw, Search,
  CheckCircle2, AlertCircle, Loader2, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─────────────────── Types ─────────────────── */
interface AdminUser {
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';
  isSuperAdmin?: boolean;
}

type OTPAction = 'add' | 'delete' | 'reset';

// Hardcoded to match backend — users authorized to reset passwords
const PASSWORD_RESET_AUTHORIZED = ['ram@trustner.in', 'sangeeta@trustner.in'];

/* ─────────────────── Main Page ─────────────────── */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: AdminUser['role']; password: string }>({ name: '', email: '', role: 'editor', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // OTP modal
  const [otpModal, setOtpModal] = useState<{
    show: boolean;
    action: OTPAction;
    targetEmail?: string;
    targetName?: string;
    pendingData?: Record<string, string>;
  }>({ show: false, action: 'add' });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Action states
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Password reset result modal
  const [resetResult, setResetResult] = useState<{ email: string; name: string; password: string } | null>(null);
  const [resetPasswordCopied, setResetPasswordCopied] = useState(false);

  // ─── Check if current user can reset passwords ───
  const canReset = PASSWORD_RESET_AUTHORIZED.some(
    (e) => e.toLowerCase() === currentUserEmail.toLowerCase()
  );

  // ─── Fetch current user ───
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.email) setCurrentUserEmail(d.user.email);
      })
      .catch(() => {});
  }, []);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Auto-dismiss toast ───
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ─── Resend cooldown timer ───
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ─── Generate password ───
  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 2; i++) {
      const pos = Math.floor(Math.random() * pwd.length);
      pwd = pwd.slice(0, pos) + specials[Math.floor(Math.random() * specials.length)] + pwd.slice(pos);
    }
    setNewUser((p) => ({ ...p, password: pwd }));
  }

  function copyPassword() {
    navigator.clipboard.writeText(newUser.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── OTP Flow ───
  async function sendOTP(action: OTPAction, targetEmail?: string) {
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await fetch('/api/admin/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send OTP');
        return false;
      }
      setOtpSent(true);
      setResendCooldown(30);
      return true;
    } catch {
      setOtpError('Network error. Please try again.');
      return false;
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOTPAndExecute() {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      // Step 1: Verify OTP and get action token
      const verifyRes = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp,
          action: otpModal.action,
          targetEmail: otpModal.targetEmail,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setOtpError(verifyData.error || 'OTP verification failed');
        setOtpVerifying(false);
        return;
      }

      const actionToken = verifyData.actionToken;

      // Step 2: Execute the action
      setActionLoading(true);
      let actionRes: Response;

      if (otpModal.action === 'add') {
        actionRes = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newUser,
            actionToken,
          }),
        });
      } else if (otpModal.action === 'delete') {
        actionRes = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: otpModal.targetEmail,
            actionToken,
          }),
        });
      } else {
        // reset
        actionRes = await fetch('/api/admin/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: otpModal.targetEmail,
            actionToken,
          }),
        });
      }

      const actionData = await actionRes.json();

      if (!actionRes.ok) {
        setOtpError(actionData.error || 'Action failed');
        setOtpVerifying(false);
        setActionLoading(false);
        return;
      }

      // Success!
      if (otpModal.action === 'reset' && actionData.newPassword) {
        // Show the new password to the admin
        const targetUser = users.find((u) => u.email === otpModal.targetEmail);
        setResetResult({
          email: otpModal.targetEmail || '',
          name: targetUser?.name || otpModal.targetName || '',
          password: actionData.newPassword,
        });
      }

      setToast({
        message: actionData.message,
        type: 'success',
      });
      closeOTPModal();
      setShowAddForm(false);
      setDeleteConfirmEmail(null);
      setNewUser({ name: '', email: '', role: 'editor', password: '' });
      fetchUsers();
    } catch {
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpVerifying(false);
      setActionLoading(false);
    }
  }

  function openOTPModal(action: OTPAction, targetEmail?: string, targetName?: string) {
    setOtpModal({ show: true, action, targetEmail, targetName });
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSent(false);
    // Auto-send OTP
    sendOTP(action, targetEmail);
  }

  function closeOTPModal() {
    setOtpModal({ show: false, action: 'add' });
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSent(false);
  }

  // ─── OTP Input Handlers ───
  function handleOTPChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (value && index === 5 && newDigits.every((d) => d)) {
      setTimeout(() => verifyOTPAndExecute(), 100);
    }
  }

  function handleOTPKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOTPPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(''));
      otpRefs.current[5]?.focus();
      setTimeout(() => verifyOTPAndExecute(), 100);
    }
  }

  // ─── Filtered Users ───
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter((u) => u.role === 'super_admin').length,
    admins: users.filter((u) => u.role === 'admin').length,
    hr: users.filter((u) => u.role === 'hr').length,
    editors: users.filter((u) => u.role === 'editor').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  };

  // ─── Role badge helper ───
  function roleBadge(role: string, superAdmin?: boolean) {
    if (superAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-brand-50 to-amber-50 text-brand border border-brand/30">
          <ShieldCheck className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    const styles: Record<string, string> = {
      super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
      admin: 'bg-brand-50 text-brand border-brand/20',
      hr: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      editor: 'bg-amber-50 text-amber-700 border-amber-200',
      viewer: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      hr: 'HR Manager',
      editor: 'Editor',
      viewer: 'Viewer',
    };
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', styles[role] || styles.viewer)}>
        {labels[role] || role}
      </span>
    );
  }

  const actionLabel =
    otpModal.action === 'add' ? 'Add New User' :
    otpModal.action === 'delete' ? `Delete ${otpModal.targetName || otpModal.targetEmail}` :
    `Reset Password for ${otpModal.targetName || otpModal.targetEmail}`;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-elevated text-sm font-semibold animate-fade-in',
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">User Management</h1>
          <p className="text-sm text-slate-500">Manage admin panel access and roles</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) generatePassword();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Admins', value: stats.admins, color: 'bg-brand-50 text-brand' },
          { label: 'Editors', value: stats.editors, color: 'bg-amber-50 text-amber-700' },
          { label: 'Viewers', value: stats.viewers, color: 'bg-slate-100 text-slate-600' },
        ].map((s) => (
          <div key={s.label} className="card-base p-4 text-center">
            <div className={cn('text-2xl font-extrabold', s.color.split(' ')[1])}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card-base p-5 space-y-4 border-l-4 border-brand animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary-700">Add New User</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name</label>
              <input
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="e.g., Vatsal Sharma"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="user@trustner.in"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as AdminUser['role'] }))}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Content management)</option>
                <option value="hr">HR Manager (Employee management)</option>
                <option value="admin">Admin (Full access + approvals)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 pr-20 text-sm font-mono focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                    placeholder="Min 8 characters"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="p-1 text-slate-400 hover:text-brand"
                      title="Copy password"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-3 py-2 rounded-lg border border-surface-200 text-slate-500 hover:bg-surface-100 text-xs font-semibold whitespace-nowrap"
                  title="Generate new password"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                if (!newUser.name || !newUser.email || !newUser.password) {
                  setToast({ message: 'Please fill in all fields', type: 'error' });
                  return;
                }
                if (newUser.password.length < 8) {
                  setToast({ message: 'Password must be at least 8 characters', type: 'error' });
                  return;
                }
                openOTPModal('add');
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Add User (Verify OTP)
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="border border-surface-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none w-56"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="hr">HR Manager</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <span className="text-xs text-slate-400">{filtered.length} users</span>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 text-brand animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-2">Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No users found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || roleFilter !== 'all' ? 'Try changing your filters' : 'Add your first user above'}
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((user) => (
            <div
              key={user.email}
              className={cn(
                'card-base p-4 hover:shadow-elevated transition-shadow',
                user.isSuperAdmin && 'ring-1 ring-brand/20 bg-brand-50/30'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                    user.isSuperAdmin ? 'bg-gradient-to-br from-brand to-brand-700 text-white' :
                    user.role === 'admin' ? 'bg-brand-50 text-brand' :
                    user.role === 'editor' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  )}>
                    {user.isSuperAdmin ? <ShieldCheck className="w-5 h-5" /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-primary-700 truncate">{user.name}</h4>
                      {roleBadge(user.role, user.isSuperAdmin)}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Reset Password — only for Ram & Sangeeta */}
                  {canReset && (
                    <button
                      onClick={() => openOTPModal('reset', user.email, user.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Reset password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete — not shown for super admin */}
                  {user.isSuperAdmin ? (
                    <div className="p-2 text-slate-200" title="Super Admin cannot be deleted">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : deleteConfirmEmail === user.email ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openOTPModal('delete', user.email, user.name)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Confirm delete"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmEmail(null)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-surface-100 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmEmail(user.email)}
                      className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── OTP Verification Modal ─── */}
      {otpModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeOTPModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            {/* Close */}
            <button
              onClick={closeOTPModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-3">
                <Shield className="w-7 h-7 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-primary-700">OTP Verification</h3>
              <p className="text-sm text-slate-500 mt-1">{actionLabel}</p>
            </div>

            {/* OTP Status */}
            {otpSent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-blue-700 font-semibold">
                  Verification code sent to <span className="font-bold">ram@trustner.in</span>
                </p>
              </div>
            )}

            {/* Error */}
            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-red-700 font-semibold">{otpError}</p>
              </div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-4">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(i, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(i, e)}
                  onPaste={i === 0 ? handleOTPPaste : undefined}
                  className={cn(
                    'w-11 h-12 text-center text-lg font-bold rounded-lg border-2 transition-all outline-none',
                    digit ? 'border-brand bg-brand-50 text-primary-700' : 'border-surface-300 focus:border-brand'
                  )}
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOTPAndExecute}
              disabled={otpVerifying || actionLoading || otpDigits.some((d) => !d)}
              className={cn(
                'w-full py-3 rounded-lg text-sm font-bold transition-all',
                otpVerifying || actionLoading || otpDigits.some((d) => !d)
                  ? 'bg-surface-200 text-slate-400 cursor-not-allowed'
                  : 'bg-brand text-white hover:bg-brand-700'
              )}
            >
              {otpVerifying || actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {otpVerifying ? 'Verifying...' : 'Processing...'}
                </span>
              ) : (
                'Verify & Proceed'
              )}
            </button>

            {/* Resend */}
            <div className="mt-3 text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-400">
                  Resend OTP in <span className="font-bold text-brand">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  onClick={() => sendOTP(otpModal.action, otpModal.targetEmail)}
                  disabled={otpSending}
                  className="text-xs font-semibold text-brand hover:text-brand-700"
                >
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Password Reset Result Modal (admin sees the new password) ─── */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResetResult(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <button
              onClick={() => setResetResult(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-primary-700">Password Reset Successful</h3>
              <p className="text-sm text-slate-500 mt-1">{resetResult.name} ({resetResult.email})</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">New Password</p>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-4 py-3">
                <code className="flex-1 text-base font-bold text-primary-700 tracking-wider font-mono">
                  {resetResult.password}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetResult.password);
                    setResetPasswordCopied(true);
                    setTimeout(() => setResetPasswordCopied(false), 2000);
                  }}
                  className="p-1.5 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                  title="Copy password"
                >
                  {resetPasswordCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700 font-semibold text-center">
                Share this password with the user securely. It will not be emailed to them.
              </p>
            </div>

            <button
              onClick={() => setResetResult(null)}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
