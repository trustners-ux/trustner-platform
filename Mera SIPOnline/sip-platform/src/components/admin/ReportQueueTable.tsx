'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown,
  Clock, Eye, Mail, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReportQueueEntry, ReportStatus, PlanTierLabel } from '@/types/report-queue';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<ReportStatus, { label: string; bg: string; text: string }> = {
  pending_review: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-blue-50', text: 'text-blue-700' },
  sent: { label: 'Sent', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600' },
};

const ALL_STATUSES: (ReportStatus | 'all')[] = ['all', 'pending_review', 'approved', 'sent', 'rejected'];

const ALL_TIERS: (PlanTierLabel | 'all')[] = ['all', 'basic', 'standard', 'comprehensive'];

const TIER_BADGE_CONFIG: Record<PlanTierLabel, { bg: string; text: string }> = {
  basic: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  standard: { bg: 'bg-teal-100', text: 'text-teal-700' },
  comprehensive: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const PAGE_SIZE = 15;

type SortField = 'userName' | 'createdAt' | 'totalScore' | 'status';
type SortDir = 'asc' | 'desc';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function gradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'Excellent': 'text-green-700',
    'Good': 'text-teal-700',
    'Fair': 'text-amber-700',
    'Needs Improvement': 'text-orange-600',
    'Needs Attention': 'text-orange-600',
    'Critical': 'text-red-600',
  };
  return colors[grade] || 'text-slate-700';
}

/* ------------------------------------------------------------------ */
/*  ReportQueueTable                                                   */
/* ------------------------------------------------------------------ */

export function ReportQueueTable({
  reports: initialReports,
  onRefresh,
}: {
  reports: ReportQueueEntry[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportQueueEntry[]>(initialReports);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<PlanTierLabel | 'all'>('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Sync when parent re-fetches
  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  /* ---------- Filter + Sort ---------- */
  const filtered = reports
    .filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (tierFilter !== 'all' && r.tier !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.userName.toLowerCase().includes(q) &&
          !r.userEmail.toLowerCase().includes(q) &&
          !r.userPhone.includes(q) &&
          !r.userCity.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'userName') cmp = a.userName.localeCompare(b.userName);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'totalScore') cmp = a.totalScore - b.totalScore;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, tierFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => {
          const isActive = statusFilter === s;
          const count = s === 'all' ? reports.length : reports.filter((r) => r.status === s).length;
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
              {s === 'all' ? 'All' : STATUS_CONFIG[s as ReportStatus].label}
              <span className={cn('ml-1.5', isActive ? 'text-white/70' : 'text-slate-400')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tier filter pills */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Tier:</span>
        {ALL_TIERS.map((t) => {
          const isActive = tierFilter === t;
          const count = t === 'all' ? reports.length : reports.filter((r) => r.tier === t).length;
          return (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                isActive
                  ? t === 'all'
                    ? 'bg-primary-700 text-white shadow-sm'
                    : cn(TIER_BADGE_CONFIG[t as PlanTierLabel].bg, TIER_BADGE_CONFIG[t as PlanTierLabel].text, 'ring-2 ring-offset-1 ring-current')
                  : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
              )}
            >
              {t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}
              <span className={cn('ml-1.5', isActive ? (t === 'all' ? 'text-white/70' : 'opacity-70') : 'text-slate-400')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                {[
                  { label: 'Name', field: 'userName' as SortField },
                  { label: 'Score', field: 'totalScore' as SortField },
                  { label: 'City', field: null },
                  { label: 'Status', field: 'status' as SortField },
                  { label: 'Created', field: 'createdAt' as SortField },
                  { label: 'Waiting', field: null },
                  { label: 'Action', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    className={cn(
                      'text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                      field && 'cursor-pointer hover:text-primary-700 select-none'
                    )}
                    onClick={field ? () => handleSort(field) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {field && (
                        <ArrowUpDown
                          className={cn(
                            'w-3 h-3',
                            sortField === field ? 'text-brand' : 'text-slate-300'
                          )}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No reports found
                  </td>
                </tr>
              ) : (
                paged.map((report) => {
                  const cfg = STATUS_CONFIG[report.status];
                  const isPending = report.status === 'pending_review';
                  return (
                    <tr
                      key={report.id}
                      className={cn(
                        'hover:bg-surface-50 transition-colors cursor-pointer',
                        isPending && 'border-l-4 border-l-amber-400'
                      )}
                      onClick={() => router.push(`/admin/reports/${report.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary-700 whitespace-nowrap">
                          {report.userName}
                          {report.tier && (
                            <span className={cn(
                              'ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              TIER_BADGE_CONFIG[report.tier].bg,
                              TIER_BADGE_CONFIG[report.tier].text
                            )}>
                              {report.tier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {report.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-primary-700">{report.totalScore}</span>
                        <span className="text-slate-400 text-xs">/900</span>
                        <div className={cn('text-xs font-semibold', gradeColor(report.grade))}>
                          {report.grade}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {report.userCity}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                            cfg.bg, cfg.text
                          )}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(report.createdAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/reports/${report.id}`);
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            isPending
                              ? 'bg-brand text-white hover:bg-brand-800'
                              : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
                          )}
                        >
                          <Eye className="w-3 h-3" />
                          {isPending ? 'Review' : 'View'}
                        </button>
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
    </div>
  );
}
