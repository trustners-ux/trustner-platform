'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle,
  RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  AlertTriangle, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ChangeRequest, ChangeRequestType, ChangeRequestStatus } from '@/types/change-request';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const APPROVER_EMAILS = ['ram@trustner.in', 'sangeeta@trustner.in'];
const SUPER_ADMIN_EMAIL = 'ram@trustner.in';

interface StatsCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const STATUS_BADGE: Record<ChangeRequestStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600' },
};

const TYPE_BADGE: Record<ChangeRequestType, { label: string; bg: string; text: string }> = {
  incentive_slab: { label: 'Incentive Slab', bg: 'bg-purple-50', text: 'text-purple-700' },
  product_rule: { label: 'Product Rule', bg: 'bg-blue-50', text: 'text-blue-700' },
  employee_add: { label: 'Employee Add', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  employee_edit: { label: 'Employee Edit', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  employee_delete: { label: 'Employee Delete', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  payout_rule: { label: 'Payout Rule', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const TYPE_FILTERS: { key: ChangeRequestType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'incentive_slab', label: 'Incentive Slabs' },
  { key: 'product_rule', label: 'Product Rules' },
  { key: 'employee_add', label: 'Employee Changes' },
];

const STATUS_FILTERS: (ChangeRequestStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected'];

const PAGE_SIZE = 15;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncateId(id: string) {
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
}

/** Check if a type filter matches (employee_add covers all employee_* types) */
function matchesTypeFilter(type: ChangeRequestType, filter: ChangeRequestType | 'all'): boolean {
  if (filter === 'all') return true;
  if (filter === 'employee_add') return type.startsWith('employee_');
  return type === filter;
}

/* ------------------------------------------------------------------ */
/*  Detail / Review Panel                                              */
/* ------------------------------------------------------------------ */

function ReviewPanel({
  item,
  userEmail,
  onAction,
  acting,
}: {
  item: ChangeRequest;
  userEmail: string;
  onAction: (id: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  acting: boolean;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  const canApprove = APPROVER_EMAILS.includes(userEmail.toLowerCase());
  const isSuperAdmin = userEmail.toLowerCase() === SUPER_ADMIN_EMAIL;
  const isIncentive = item.type === 'incentive_slab';
  const isPending = item.status === 'pending';

  const handleApprove = async () => {
    await onAction(item.id, 'approve');
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    await onAction(item.id, 'reject', reason.trim());
    setRejectMode(false);
    setReason('');
  };

  return (
    <div className="bg-surface-50 border-t border-surface-200 p-6 space-y-4">
      {/* Requested By */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">Requested by:</span>
        <span className="font-semibold text-primary-700">{item.requestedByName}</span>
        <span className="text-slate-400">({item.requestedBy})</span>
        <span className="text-slate-400">on {formatDate(item.requestedAt)}</span>
      </div>

      {item.description && (
        <p className="text-sm text-slate-600">{item.description}</p>
      )}

      {/* Change Data */}
      <div className={cn('grid gap-4', item.previousData ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
        {item.previousData && (
          <div className="bg-white border border-surface-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Before</h4>
            <div className="space-y-1.5">
              {Object.entries(item.previousData).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500 min-w-[120px] font-medium">{key}:</span>
                  <span className="text-slate-700">{typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-surface-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {item.previousData ? (
              <span className="flex items-center gap-1.5">After <ArrowRight className="w-3 h-3 text-green-600" /></span>
            ) : 'Change Data'}
          </h4>
          <div className="space-y-1.5">
            {Object.entries(item.changeData).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px] font-medium">{key}:</span>
                <span className="text-slate-700">{typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviewed info for already-processed requests */}
      {item.reviewedBy && (
        <div className="text-sm text-slate-500">
          {item.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
          <span className="font-semibold text-primary-700">{item.reviewedBy}</span>
          {item.reviewedAt && <> on {formatDate(item.reviewedAt)}</>}
          {item.rejectionReason && (
            <div className="mt-1 text-red-600">Reason: {item.rejectionReason}</div>
          )}
        </div>
      )}

      {/* Incentive slab warning */}
      {isIncentive && isPending && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Only Super Admin can approve incentive structure changes
        </div>
      )}

      {/* Action buttons */}
      {isPending && canApprove && (
        <div className="flex items-center gap-3 pt-2">
          {!rejectMode ? (
            <>
              <button
                onClick={handleApprove}
                disabled={acting || (isIncentive && !isSuperAdmin)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => setRejectMode(true)}
                disabled={acting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <input
                type="text"
                placeholder="Reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                autoFocus
              />
              <button
                onClick={handleReject}
                disabled={acting || !reason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setRejectMode(false); setReason(''); }}
                className="px-3 py-2 text-sm font-semibold text-slate-600 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [typeFilter, setTypeFilter] = useState<ChangeRequestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ChangeRequestStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch current user
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setUserEmail(data.email);
      })
      .catch(() => {});
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/approvals?${params.toString()}`);
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setExpandedId(null);
        await fetchApprovals();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed. Check console.');
    } finally {
      setActing(false);
    }
  };

  /* ---------- Filtering (client-side for employee_* grouping) ---------- */
  const filtered = approvals.filter((a) => {
    if (!matchesTypeFilter(a.type, typeFilter)) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ---------- Stats ---------- */
  const stats: StatsCard[] = [
    { label: 'Total Requests', value: approvals.length, icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending', value: approvals.filter((a) => a.status === 'pending').length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Approved', value: approvals.filter((a) => a.status === 'approved').length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Rejected', value: approvals.filter((a) => a.status === 'rejected').length, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Approvals</h1>
          <p className="text-sm text-slate-500">Maker-checker approval queue for configuration changes</p>
        </div>
        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-base p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-primary-700">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((t) => {
          const isActive = typeFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Status:</span>
        {STATUS_FILTERS.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                isActive
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
              )}
            >
              {s === 'all' ? 'All' : STATUS_BADGE[s].label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading && approvals.length === 0 ? (
        <div className="card-base p-12 text-center">
          <div className="animate-pulse text-sm text-slate-400">Loading approvals...</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  {['ID', 'Type', 'Title', 'Requested By', 'Date', 'Status', 'Actions'].map((label) => (
                    <th
                      key={label}
                      className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No change requests found
                    </td>
                  </tr>
                ) : (
                  paged.map((item) => {
                    const statusCfg = STATUS_BADGE[item.status];
                    const typeCfg = TYPE_BADGE[item.type];
                    const isExpanded = expandedId === item.id;
                    const isPending = item.status === 'pending';

                    return (
                      <tr key={item.id} className="group">
                        <td colSpan={7} className="p-0">
                          {/* Main row */}
                          <div
                            className={cn(
                              'grid grid-cols-[80px_130px_1fr_160px_100px_100px_100px] items-center hover:bg-surface-50 transition-colors',
                              isPending && 'border-l-4 border-l-amber-400'
                            )}
                          >
                            <div className="px-4 py-3 text-xs text-slate-400 font-mono">
                              {truncateId(item.id)}
                            </div>
                            <div className="px-4 py-3">
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold', typeCfg.bg, typeCfg.text)}>
                                {typeCfg.label}
                              </span>
                            </div>
                            <div className="px-4 py-3">
                              <div className="font-semibold text-primary-700 truncate">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-slate-400 truncate">{item.description}</div>
                              )}
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-sm font-medium text-slate-700 truncate">{item.requestedByName}</div>
                              <div className="text-xs text-slate-400 truncate">{item.requestedBy}</div>
                            </div>
                            <div className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {formatDate(item.requestedAt)}
                            </div>
                            <div className="px-4 py-3">
                              <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', statusCfg.bg, statusCfg.text)}>
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="px-4 py-3">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                className={cn(
                                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                  isPending
                                    ? 'bg-brand text-white hover:bg-brand-800'
                                    : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
                                )}
                              >
                                {isPending ? 'Review' : 'View'}
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable detail panel */}
                          {isExpanded && (
                            <ReviewPanel
                              item={item}
                              userEmail={userEmail}
                              onAction={handleAction}
                              acting={acting}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
              <span className="text-xs text-slate-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1]) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={cn(
                          'w-8 h-8 text-xs font-semibold rounded-lg transition-colors',
                          safePage === item
                            ? 'bg-brand text-white'
                            : 'text-slate-600 hover:bg-surface-200'
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
