'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, X, Loader2,
  ChevronRight, Clock, IndianRupee, FileSpreadsheet,
  ArrowLeft, Eye, RotateCcw, ThumbsUp, ThumbsDown,
  ChevronDown, Filter, ArrowUpDown, History, Users,
  Ban, CircleDot, ChevronUp,
} from 'lucide-react';
import type { AdminRole } from '@/lib/auth/config';
import type {
  ApprovalStatus,
  LOBType,
  PayoutBatch,
  ApprovalAction,
} from '@/lib/dal/approval-workflow';

// ─── Types ───

interface AuthUser {
  email: string;
  name: string;
  role: AdminRole;
}

interface BatchStats {
  total: number;
  byStatus: Record<ApprovalStatus, number>;
  byLob: Record<LOBType, number>;
  totalAmount: number;
  totalPayout: number;
  pendingActions: number;
  rejectedCount: number;
}

type SortField = 'month' | 'lob' | 'status' | 'totalEntries' | 'totalAmount' | 'totalPayout' | 'updatedAt';
type SortDir = 'asc' | 'desc';

// ─── Constants ───

const PIPELINE_STEPS: { status: ApprovalStatus; label: string; shortLabel: string }[] = [
  { status: 'uploaded', label: 'VJ Infosoft Upload', shortLabel: 'Uploaded' },
  { status: 'maker_filled', label: 'Maker (MIS Coordinator)', shortLabel: 'Maker' },
  { status: 'checker_approved', label: 'Checker Review', shortLabel: 'Checker' },
  { status: 'lob_approved', label: 'LOB Head Approval', shortLabel: 'LOB' },
  { status: 'finance_approved', label: 'Finance Approval', shortLabel: 'Finance' },
  { status: 'paid', label: 'Final Approval & Paid', shortLabel: 'Paid' },
];

const STATUS_COLORS: Record<ApprovalStatus, { bg: string; text: string; badge: string; dot: string }> = {
  uploaded: { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  maker_filled: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  checker_approved: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  lob_approved: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  finance_approved: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const LOB_COLORS: Record<LOBType, string> = {
  Life: 'bg-blue-100 text-blue-700',
  Health: 'bg-emerald-100 text-emerald-700',
  GI: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  uploaded: 'Uploaded',
  maker_filled: 'Maker Filled',
  checker_approved: 'Checker Approved',
  lob_approved: 'LOB Approved',
  finance_approved: 'Finance Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

// ─── Helpers ───

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatFullINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: formatMonthLabel(value) });
  }
  return options;
}

function canUserAdvanceStatus(
  status: ApprovalStatus,
  role: AdminRole,
  email: string
): boolean {
  const FINAL_EMAILS = ['ram@trustner.in', 'sangeeta@trustner.in'];
  const perms: Record<ApprovalStatus, AdminRole[]> = {
    uploaded: ['hr', 'admin', 'super_admin'],
    maker_filled: ['admin', 'super_admin'],
    checker_approved: ['admin', 'super_admin'],
    lob_approved: ['admin', 'super_admin'],
    finance_approved: ['admin', 'super_admin'],
    paid: [],
    rejected: [],
  };

  const allowed = perms[status];
  if (!allowed || allowed.length === 0) return false;
  if (status === 'finance_approved') return FINAL_EMAILS.includes(email.toLowerCase());
  return allowed.includes(role);
}

function canUserReject(role: AdminRole): boolean {
  return ['admin', 'super_admin'].includes(role);
}

function canUserResubmit(role: AdminRole): boolean {
  return ['hr', 'admin', 'super_admin'].includes(role);
}

function getNextStepLabel(status: ApprovalStatus): string {
  const map: Record<string, string> = {
    uploaded: 'Mark as Maker Filled',
    maker_filled: 'Approve (Checker)',
    checker_approved: 'Approve (LOB Head)',
    lob_approved: 'Approve (Finance)',
    finance_approved: 'Final Approve & Pay',
  };
  return map[status] || 'Advance';
}

// ─── Toast ───

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── Stat Card ───

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: string; icon: React.ElementType; color: string; subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ───

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} />;
}

// ─── Modal Shell ───

function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }: {
  title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Pipeline Status Bar ───

function PipelineBar({
  stats,
  activeFilter,
  onFilterClick,
  rejectedCount,
}: {
  stats: BatchStats;
  activeFilter: ApprovalStatus | null;
  onFilterClick: (status: ApprovalStatus | null) => void;
  rejectedCount: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((step, i) => {
          const count = stats.byStatus[step.status] || 0;
          const isActive = activeFilter === step.status;
          const colors = STATUS_COLORS[step.status];

          return (
            <div key={step.status} className="flex items-center shrink-0">
              <button
                onClick={() => onFilterClick(isActive ? null : step.status)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? `${colors.bg} ${colors.text} border-current ring-2 ring-offset-1 ring-current/20`
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className="hidden sm:inline">{step.shortLabel}</span>
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                  count > 0 ? colors.badge : 'bg-slate-100 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5 shrink-0 hidden md:block" />
              )}
            </div>
          );
        })}

        {/* Rejected filter pill */}
        <div className="flex items-center shrink-0 ml-2 pl-2 border-l border-slate-200">
          <button
            onClick={() => onFilterClick(activeFilter === 'rejected' ? null : 'rejected')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeFilter === 'rejected'
                ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-offset-1 ring-red-200'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rejected</span>
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
              rejectedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {rejectedCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch History Timeline ───

function BatchTimeline({ history }: { history: ApprovalAction[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No actions recorded yet.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {history.map((a) => {
          const actionColors: Record<string, string> = {
            upload: 'bg-slate-500',
            fill: 'bg-blue-500',
            approve: 'bg-emerald-500',
            reject: 'bg-red-500',
            resubmit: 'bg-amber-500',
          };
          const actionLabels: Record<string, string> = {
            upload: 'Uploaded',
            fill: 'Maker Filled',
            approve: 'Approved',
            reject: 'Rejected',
            resubmit: 'Resubmitted',
          };

          return (
            <div key={a.id} className="relative flex items-start gap-4 pl-2">
              <div className={`relative z-10 w-5 h-5 rounded-full ${actionColors[a.action] || 'bg-slate-400'} ring-4 ring-white flex items-center justify-center shrink-0 mt-0.5`}>
                {a.action === 'approve' && <CheckCircle className="w-3 h-3 text-white" />}
                {a.action === 'reject' && <X className="w-3 h-3 text-white" />}
                {a.action === 'fill' && <FileSpreadsheet className="w-3 h-3 text-white" />}
                {a.action === 'upload' && <ChevronUp className="w-3 h-3 text-white" />}
                {a.action === 'resubmit' && <RotateCcw className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-700">
                    {actionLabels[a.action] || a.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {STATUS_LABELS[a.fromStatus]} &rarr; {STATUS_LABELS[a.toStatus]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  by <span className="font-medium">{a.actorName}</span> ({a.actorEmail})
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(a.timestamp)}</p>
                {a.comments && (
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1 border border-slate-100">
                    {a.comments}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// ─── MAIN PAGE COMPONENT ───
// =====================================================================

export default function ApprovalsPage() {
  // ─── Auth State ───
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Data State ───
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Filter State ───
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | null>(null);
  const [lobFilter, setLobFilter] = useState<LOBType | ''>('');

  // ─── Sort State ───
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ─── Modal State ───
  const [approveModal, setApproveModal] = useState<PayoutBatch | null>(null);
  const [rejectModal, setRejectModal] = useState<PayoutBatch | null>(null);
  const [detailModal, setDetailModal] = useState<PayoutBatch | null>(null);
  const [batchHistory, setBatchHistory] = useState<ApprovalAction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Form State ───
  const [approveComments, setApproveComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Toast ───
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // ─── Fetch Auth ───
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ─── Fetch Batches ───
  const fetchBatches = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedMonth) params.set('month', selectedMonth);

    fetch(`/api/admin/mis/approvals?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.batches) setBatches(d.batches);
        if (d.stats) setStats(d.stats);
      })
      .catch(() => showToast('Failed to load approval data', 'error'))
      .finally(() => setLoading(false));
  }, [selectedMonth, showToast]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ─── Fetch Batch History ───
  const fetchHistory = useCallback((batchId: number) => {
    setHistoryLoading(true);
    fetch(`/api/admin/mis/approvals?section=history&batchId=${batchId}`)
      .then(r => r.json())
      .then(d => { if (d.history) setBatchHistory(d.history); })
      .catch(() => showToast('Failed to load batch history', 'error'))
      .finally(() => setHistoryLoading(false));
  }, [showToast]);

  // ─── Filtered + Sorted Batches ───
  const filteredBatches = useMemo(() => {
    let result = [...batches];

    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }
    if (lobFilter) {
      result = result.filter(b => b.lob === lobFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'month': cmp = a.month.localeCompare(b.month); break;
        case 'lob': cmp = a.lob.localeCompare(b.lob); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'totalEntries': cmp = a.totalEntries - b.totalEntries; break;
        case 'totalAmount': cmp = a.totalAmount - b.totalAmount; break;
        case 'totalPayout': cmp = a.totalPayout - b.totalPayout; break;
        case 'updatedAt': cmp = a.updatedAt.localeCompare(b.updatedAt); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [batches, statusFilter, lobFilter, sortField, sortDir]);

  // ─── Action Handlers ───

  const handleAdvance = async () => {
    if (!approveModal || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mis/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: approveModal.id,
          action: 'advance',
          comments: approveComments || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to advance batch');
      showToast(data.message || 'Batch advanced successfully', 'success');
      setApproveModal(null);
      setApproveComments('');
      fetchBatches();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to advance batch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !user) return;
    if (!rejectReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mis/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: rejectModal.id,
          action: 'reject',
          reason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject batch');
      showToast(data.message || 'Batch rejected', 'info');
      setRejectModal(null);
      setRejectReason('');
      fetchBatches();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject batch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (batch: PayoutBatch) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mis/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          action: 'resubmit',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resubmit batch');
      showToast(data.message || 'Batch resubmitted', 'success');
      fetchBatches();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resubmit batch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (batch: PayoutBatch) => {
    setDetailModal(batch);
    fetchHistory(batch.id);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // ─── Auth Gate ───
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Authentication required</p>
          <a href="/admin" className="text-sm text-primary-600 hover:underline mt-2 inline-block">Go to admin login</a>
        </div>
      </div>
    );
  }

  // ─── Loading State ───
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Spinner className="w-6 h-6" />
            <p className="text-slate-500">Loading approval pipeline...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingForUser = batches.filter(
    b => b.status !== 'paid' && b.status !== 'rejected' && canUserAdvanceStatus(b.status, user.role, user.email)
  ).length;

  // ─── Render ───
  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin/mis" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Payout Approval Pipeline</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                6-step insurance incentive payout workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {monthOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* LOB Filter */}
            <div className="relative">
              <select
                value={lobFilter}
                onChange={e => setLobFilter(e.target.value as LOBType | '')}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All LOBs</option>
                <option value="Life">Life</option>
                <option value="Health">Health</option>
                <option value="GI">GI</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="text-xs font-medium text-slate-600">{user.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                user.role === 'hr' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Pipeline Status Bar ─── */}
        {stats && (
          <PipelineBar
            stats={stats}
            activeFilter={statusFilter}
            onFilterClick={setStatusFilter}
            rejectedCount={stats.rejectedCount}
          />
        )}

        {/* ─── Stat Cards ─── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Batches"
              value={String(stats.total)}
              icon={FileSpreadsheet}
              color="bg-blue-600"
              subtext={`${formatMonthLabel(selectedMonth)}`}
            />
            <StatCard
              label="Pending Your Action"
              value={String(pendingForUser)}
              icon={Clock}
              color="bg-amber-500"
              subtext={pendingForUser > 0 ? 'Needs attention' : 'All clear'}
            />
            <StatCard
              label="Total Payout"
              value={formatINR(stats.totalPayout)}
              icon={IndianRupee}
              color="bg-emerald-600"
              subtext={`from ${formatINR(stats.totalAmount)} premium`}
            />
            <StatCard
              label="Rejected"
              value={String(stats.rejectedCount)}
              icon={AlertTriangle}
              color={stats.rejectedCount > 0 ? 'bg-red-500' : 'bg-slate-400'}
              subtext={stats.rejectedCount > 0 ? 'Needs resolution' : 'None'}
            />
          </div>
        )}

        {/* ─── Active Filter Indicator ─── */}
        {(statusFilter || lobFilter) && (
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Filtered:</span>
            {statusFilter && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[statusFilter].badge}`}>
                {STATUS_LABELS[statusFilter]}
                <button onClick={() => setStatusFilter(null)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {lobFilter && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${LOB_COLORS[lobFilter]}`}>
                {lobFilter}
                <button onClick={() => setLobFilter('')} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setStatusFilter(null); setLobFilter(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ─── Batch Table ─── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {([
                    { field: 'month' as SortField, label: 'Month' },
                    { field: 'lob' as SortField, label: 'LOB' },
                    { field: 'status' as SortField, label: 'Status' },
                    { field: 'totalEntries' as SortField, label: 'Entries' },
                    { field: 'totalAmount' as SortField, label: 'Premium' },
                    { field: 'totalPayout' as SortField, label: 'Payout' },
                    { field: 'updatedAt' as SortField, label: 'Last Updated' },
                  ]).map(col => (
                    <th
                      key={col.field}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                      onClick={() => toggleSort(col.field)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Spinner className="w-6 h-6 mx-auto" />
                      <p className="text-sm text-slate-400 mt-2">Loading batches...</p>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No batches found for the selected filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => {
                    const colors = STATUS_COLORS[batch.status];
                    const canAdvance = canUserAdvanceStatus(batch.status, user.role, user.email);
                    const canReject = canUserReject(user.role) && batch.status !== 'paid' && batch.status !== 'rejected';
                    const canResubmit_ = canUserResubmit(user.role) && batch.status === 'rejected';

                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">{formatMonthLabel(batch.month)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${LOB_COLORS[batch.lob]}`}>
                            {batch.lob}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {STATUS_LABELS[batch.status]}
                          </span>
                          {batch.status === 'rejected' && batch.rejectionReason && (
                            <p className="text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={batch.rejectionReason}>
                              {batch.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{batch.totalEntries}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatINR(batch.totalAmount)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatINR(batch.totalPayout)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{formatDate(batch.updatedAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* View detail / history */}
                            <button
                              onClick={() => openDetail(batch)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                              title="View Details & History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Advance button */}
                            {canAdvance && (
                              <button
                                onClick={() => { setApproveModal(batch); setApproveComments(''); }}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title={getNextStepLabel(batch.status)}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reject button */}
                            {canReject && (
                              <button
                                onClick={() => { setRejectModal(batch); setRejectReason(''); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                title="Reject"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            )}

                            {/* Resubmit button */}
                            {canResubmit_ && (
                              <button
                                onClick={() => handleResubmit(batch)}
                                disabled={submitting}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors disabled:opacity-50"
                                title="Resubmit"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredBatches.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/30 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing {filteredBatches.length} of {batches.length} batches
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Total Premium: <span className="font-semibold text-slate-700">{formatFullINR(filteredBatches.reduce((s, b) => s + b.totalAmount, 0))}</span></span>
                <span className="text-slate-300">|</span>
                <span>Total Payout: <span className="font-semibold text-emerald-600">{formatFullINR(filteredBatches.reduce((s, b) => s + b.totalPayout, 0))}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Legend ─── */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pipeline Steps</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.status} className="flex items-start gap-2">
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-slate-400">{i + 1}.</span>
                  <CircleDot className={`w-3.5 h-3.5 ${STATUS_COLORS[step.status].text}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">{step.shortLabel}</p>
                  <p className="text-[10px] text-slate-400">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ─── APPROVE MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {approveModal && (
        <Modal
          title={getNextStepLabel(approveModal.status)}
          onClose={() => setApproveModal(null)}
        >
          <div className="space-y-4">
            {/* Batch summary */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Batch ID</span>
                <span className="text-sm font-mono font-semibold text-slate-700">#{approveModal.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">LOB</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${LOB_COLORS[approveModal.lob]}`}>
                  {approveModal.lob}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Month</span>
                <span className="text-sm font-medium text-slate-700">{formatMonthLabel(approveModal.month)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Entries</span>
                <span className="text-sm font-mono text-slate-700">{approveModal.totalEntries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Premium</span>
                <span className="text-sm font-semibold text-slate-700">{formatFullINR(approveModal.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Payout</span>
                <span className="text-sm font-semibold text-emerald-600">{formatFullINR(approveModal.totalPayout)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Current Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[approveModal.status].badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[approveModal.status].dot}`} />
                  {STATUS_LABELS[approveModal.status]}
                </span>
              </div>
            </div>

            {/* Comments field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments (optional)</label>
              <textarea
                value={approveComments}
                onChange={e => setApproveComments(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                placeholder="Add any notes for the audit trail..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAdvance}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {getNextStepLabel(approveModal.status)}
              </button>
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ─── REJECT MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {rejectModal && (
        <Modal
          title="Reject Batch"
          onClose={() => setRejectModal(null)}
        >
          <div className="space-y-4">
            {/* Batch summary */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">Rejecting Batch #{rejectModal.id}</span>
              </div>
              <p className="text-xs text-red-600">
                This will send the batch back and require resubmission. The rejection reason will be visible to all pipeline participants.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${LOB_COLORS[rejectModal.lob]}`}>
                  {rejectModal.lob}
                </span>
                <span className="text-sm text-slate-600">{formatMonthLabel(rejectModal.month)}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-600">{formatINR(rejectModal.totalPayout)}</span>
            </div>

            {/* Reason field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                placeholder="Explain why this batch is being rejected..."
                required
              />
              {!rejectReason.trim() && (
                <p className="text-[11px] text-red-400 mt-1">A rejection reason is required.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReject}
                disabled={submitting || !rejectReason.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                Reject Batch
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ─── BATCH DETAIL MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {detailModal && (
        <Modal
          title={`Batch #${detailModal.id} — ${detailModal.lob} ${formatMonthLabel(detailModal.month)}`}
          onClose={() => { setDetailModal(null); setBatchHistory([]); }}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Status and summary */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-slate-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch Info</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${STATUS_COLORS[detailModal.status].badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[detailModal.status].dot}`} />
                    {STATUS_LABELS[detailModal.status]}
                  </span>
                  <span className="text-slate-500">LOB</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-fit ${LOB_COLORS[detailModal.lob]}`}>{detailModal.lob}</span>
                  <span className="text-slate-500">Month</span>
                  <span className="font-medium text-slate-700">{formatMonthLabel(detailModal.month)}</span>
                  <span className="text-slate-500">Entries</span>
                  <span className="font-mono text-slate-700">{detailModal.totalEntries}</span>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financials</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Premium</span>
                  <span className="font-semibold text-slate-700">{formatFullINR(detailModal.totalAmount)}</span>
                  <span className="text-slate-500">Payout</span>
                  <span className="font-semibold text-emerald-600">{formatFullINR(detailModal.totalPayout)}</span>
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-600">{formatDate(detailModal.createdAt)}</span>
                  <span className="text-slate-500">Updated</span>
                  <span className="text-slate-600">{formatDate(detailModal.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Pipeline progress visualization */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pipeline Progress</h4>
              <div className="flex items-center gap-1">
                {PIPELINE_STEPS.map((step, i) => {
                  const stepIdx = PIPELINE_STEPS.findIndex(s => s.status === detailModal.status);
                  const isCompleted = detailModal.status === 'paid'
                    ? true
                    : detailModal.status === 'rejected'
                    ? false
                    : i < stepIdx;
                  const isCurrent = step.status === detailModal.status && detailModal.status !== 'rejected';

                  return (
                    <div key={step.status} className="flex items-center flex-1">
                      <div className={`flex-1 h-2 rounded-full ${
                        isCompleted ? 'bg-emerald-500' :
                        isCurrent ? 'bg-blue-500' :
                        'bg-slate-200'
                      }`} />
                      {i < PIPELINE_STEPS.length - 1 && <div className="w-1" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {PIPELINE_STEPS.map(step => (
                  <span key={step.status} className="text-[9px] text-slate-400 text-center flex-1">{step.shortLabel}</span>
                ))}
              </div>
            </div>

            {/* Rejection info */}
            {detailModal.status === 'rejected' && detailModal.rejectionReason && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700">Rejected</span>
                  <span className="text-xs text-red-500">from {STATUS_LABELS[detailModal.rejectedFromStep || 'uploaded']}</span>
                </div>
                <p className="text-sm text-red-600">{detailModal.rejectionReason}</p>
                <p className="text-xs text-red-400 mt-1">
                  by {detailModal.rejectedBy} on {formatDateTime(detailModal.rejectedAt)}
                </p>
              </div>
            )}

            {/* Step actors */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Step Actors</h4>
              <div className="space-y-2">
                {[
                  { label: 'Uploaded by', actor: detailModal.uploadedBy, time: detailModal.uploadedAt },
                  { label: 'Maker filled by', actor: detailModal.makerFilledBy, time: detailModal.makerFilledAt },
                  { label: 'Checker approved by', actor: detailModal.checkerApprovedBy, time: detailModal.checkerApprovedAt },
                  { label: 'LOB approved by', actor: detailModal.lobApprovedBy, time: detailModal.lobApprovedAt },
                  { label: 'Finance approved by', actor: detailModal.financeApprovedBy, time: detailModal.financeApprovedAt },
                  { label: 'Final approved by', actor: detailModal.finalApprovedBy, time: detailModal.finalApprovedAt },
                ].filter(s => s.actor).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded px-3 py-2">
                    <span className="text-slate-500">{s.label}</span>
                    <div className="text-right">
                      <span className="font-medium text-slate-700">{s.actor}</span>
                      <span className="text-xs text-slate-400 ml-2">{formatDate(s.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {detailModal.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{detailModal.notes}</p>
              </div>
            )}

            {/* Audit Trail */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Trail
              </h4>
              {historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner className="w-5 h-5" />
                </div>
              ) : (
                <BatchTimeline history={batchHistory} />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              {canUserAdvanceStatus(detailModal.status, user.role, user.email) && (
                <button
                  onClick={() => { setDetailModal(null); setBatchHistory([]); setApproveModal(detailModal); setApproveComments(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {getNextStepLabel(detailModal.status)}
                </button>
              )}
              {canUserReject(user.role) && detailModal.status !== 'paid' && detailModal.status !== 'rejected' && (
                <button
                  onClick={() => { setDetailModal(null); setBatchHistory([]); setRejectModal(detailModal); setRejectReason(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject
                </button>
              )}
              {canUserResubmit(user.role) && detailModal.status === 'rejected' && (
                <button
                  onClick={() => { handleResubmit(detailModal); setDetailModal(null); setBatchHistory([]); }}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resubmit
                </button>
              )}
              <button
                onClick={() => { setDetailModal(null); setBatchHistory([]); }}
                className="ml-auto px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
