'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, RefreshCw, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Search, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditEntry {
  id?: number;
  tableName: string;
  recordId?: number;
  action: string;
  changedBy: string;
  changedAt?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTION_BADGE: Record<string, { bg: string; text: string }> = {
  INSERT: { bg: 'bg-green-50', text: 'text-green-700' },
  UPDATE: { bg: 'bg-blue-50', text: 'text-blue-700' },
  DELETE: { bg: 'bg-red-50', text: 'text-red-600' },
  LOGIN: { bg: 'bg-slate-100', text: 'text-slate-600' },
  APPROVE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  REJECT: { bg: 'bg-amber-50', text: 'text-amber-700' },
  FREEZE: { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const TABLE_OPTIONS = [
  'all',
  'business_entries',
  'employees',
  'incentive_slabs',
  'products',
  'audit_log',
  'change_requests',
  'users',
];

const ACTION_OPTIONS = ['all', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'FREEZE'];

const PAGE_SIZE = 25;

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function truncateJson(obj?: Record<string, unknown>, maxLen = 60): string {
  if (!obj || Object.keys(obj).length === 0) return '—';
  const str = JSON.stringify(obj);
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

/* ------------------------------------------------------------------ */
/*  Expanded Row Detail                                                */
/* ------------------------------------------------------------------ */

function AuditDetailPanel({ entry }: { entry: AuditEntry }) {
  return (
    <div className="bg-surface-50 border-t border-surface-200 p-6 space-y-4">
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>Record ID: <span className="font-mono font-semibold text-primary-700">{entry.recordId ?? '—'}</span></span>
        <span>Changed by: <span className="font-semibold text-primary-700">{entry.changedBy}</span></span>
        <span>At: {formatDateTime(entry.changedAt)}</span>
      </div>

      {entry.reason && (
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-500">Reason:</span> {entry.reason}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Old Values */}
        <div className="bg-white border border-surface-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Old Values</h4>
          {entry.oldValues && Object.keys(entry.oldValues).length > 0 ? (
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono bg-surface-50 p-3 rounded-lg max-h-64 overflow-auto">
              {JSON.stringify(entry.oldValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic">No previous values</p>
          )}
        </div>

        {/* New Values */}
        <div className="bg-white border border-surface-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">New Values</h4>
          {entry.newValues && Object.keys(entry.newValues).length > 0 ? (
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono bg-surface-50 p-3 rounded-lg max-h-64 overflow-auto">
              {JSON.stringify(entry.newValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic">No new values</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [changedBySearch, setChangedBySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchAuditLog = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tableFilter !== 'all') params.set('tableName', tableFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (changedBySearch.trim()) params.set('changedBy', changedBySearch.trim());
      params.set('limit', '500');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [tableFilter, actionFilter, changedBySearch]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [tableFilter, actionFilter, changedBySearch]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Audit Log</h1>
          <p className="text-sm text-slate-500">Compliance audit trail for all data mutations</p>
        </div>
        <button
          onClick={fetchAuditLog}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Table Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Table</label>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            >
              {TABLE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Tables' : t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'All Actions' : a}
                </option>
              ))}
            </select>
          </div>

          {/* Changed By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Changed By</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={changedBySearch}
                onChange={(e) => setChangedBySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
          </div>

          {/* Date Range (UI only) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  title="From date (coming soon)"
                />
              </div>
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-2 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                title="To date (coming soon)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ScrollText className="w-4 h-4" />
          <span>{entries.length} entries found</span>
        </div>
      </div>

      {/* Table */}
      {loading && entries.length === 0 ? (
        <div className="card-base p-12 text-center">
          <div className="animate-pulse text-sm text-slate-400">Loading audit log...</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  {['Time', 'Table', 'Action', 'Changed By', 'Record ID', 'Details'].map((label) => (
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
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No audit log entries found
                    </td>
                  </tr>
                ) : (
                  paged.map((entry) => {
                    const actionCfg = ACTION_BADGE[entry.action] || { bg: 'bg-slate-100', text: 'text-slate-600' };
                    const isExpanded = expandedId === entry.id;
                    const entryId = entry.id ?? 0;

                    return (
                      <tr key={entryId} className="group">
                        <td colSpan={6} className="p-0">
                          {/* Main row */}
                          <div
                            className="grid grid-cols-[160px_140px_100px_180px_100px_1fr] items-center hover:bg-surface-50 transition-colors cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : entryId)}
                          >
                            <div className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {formatDateTime(entry.changedAt)}
                            </div>
                            <div className="px-4 py-3">
                              <span className="text-xs font-semibold text-primary-700">
                                {entry.tableName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </div>
                            <div className="px-4 py-3">
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold', actionCfg.bg, actionCfg.text)}>
                                {entry.action}
                              </span>
                            </div>
                            <div className="px-4 py-3 text-xs text-slate-600 truncate">
                              {entry.changedBy}
                            </div>
                            <div className="px-4 py-3 text-xs text-slate-400 font-mono">
                              {entry.recordId ?? '—'}
                            </div>
                            <div className="px-4 py-3 flex items-center gap-2">
                              <span className="text-xs text-slate-500 truncate flex-1 font-mono">
                                {truncateJson(entry.newValues || entry.oldValues)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && <AuditDetailPanel entry={entry} />}
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
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, entries.length)} of{' '}
                {entries.length}
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
