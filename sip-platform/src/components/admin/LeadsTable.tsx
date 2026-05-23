'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Download, ChevronDown, ChevronLeft, ChevronRight,
  Phone, Mail, Calendar, ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { StoredLead, LeadStatus } from '@/lib/admin/leads-store';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new:        { label: 'New',        bg: 'bg-slate-100',  text: 'text-slate-700' },
  contacted:  { label: 'Contacted',  bg: 'bg-blue-50',    text: 'text-blue-700' },
  'follow-up': { label: 'Follow-up', bg: 'bg-amber-50',   text: 'text-amber-700' },
  converted:  { label: 'Converted',  bg: 'bg-green-50',   text: 'text-green-700' },
  archived:   { label: 'Archived',   bg: 'bg-red-50',     text: 'text-red-600' },
};

const ALL_STATUSES: (LeadStatus | 'all')[] = ['all', 'new', 'contacted', 'follow-up', 'converted', 'archived'];

const PAGE_SIZE = 20;

type SortField = 'name' | 'createdAt' | 'status';
type SortDir = 'asc' | 'desc';

/* ------------------------------------------------------------------ */
/*  StatusBadge with dropdown                                         */
/* ------------------------------------------------------------------ */

function StatusBadge({
  lead,
  onStatusChange,
}: {
  lead: StoredLead;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const cfg = STATUS_CONFIG[lead.status];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
          cfg.bg, cfg.text, 'hover:ring-2 hover:ring-offset-1 hover:ring-current/20'
        )}
      >
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-elevated border border-surface-200 py-1 z-30">
          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                onStatusChange(lead.id, s);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors',
                lead.status === s
                  ? 'bg-surface-100 text-primary-700'
                  : 'text-slate-600 hover:bg-surface-50'
              )}
            >
              <span className={cn('inline-block w-2 h-2 rounded-full mr-2', STATUS_CONFIG[s].bg, 'ring-1 ring-inset', STATUS_CONFIG[s].text.replace('text-', 'ring-'))} />
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LeadsTable                                                         */
/* ------------------------------------------------------------------ */

export function LeadsTable({ leads: initialLeads }: { leads: StoredLead[] }) {
  const [leads, setLeads] = useState<StoredLead[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Sync when parent re-fetches
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  /* ---------- Filter + Sort ---------- */
  const filtered = leads
    .filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.phone.includes(q) &&
          !(l.email && l.email.toLowerCase().includes(q))
        )
          return false;
      }
      if (dateFrom && new Date(l.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(l.createdAt) > to) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, dateFrom, dateTo]);

  /* ---------- Handlers ---------- */
  const handleStatusChange = useCallback(async (id: string, status: LeadStatus) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );

    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Revert on failure — re-fetch
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    }
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    window.open('/api/admin/leads/export', '_blank');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

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
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 text-xs bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 text-xs bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => {
          const isActive = statusFilter === s;
          const count = s === 'all' ? leads.length : leads.filter((l) => l.status === s).length;
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
              {s === 'all' ? 'All' : STATUS_CONFIG[s as LeadStatus].label}
              <span className={cn('ml-1.5', isActive ? 'text-white/70' : 'text-slate-400')}>
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
                  { label: 'Name', field: 'name' as SortField },
                  { label: 'Phone', field: null },
                  { label: 'Email', field: null },
                  { label: 'Goal', field: null },
                  { label: 'Source', field: null },
                  { label: 'Status', field: 'status' as SortField },
                  { label: 'Date', field: 'createdAt' as SortField },
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
                    No leads found
                  </td>
                </tr>
              ) : (
                paged.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary-700 whitespace-nowrap">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.email ? (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {lead.email}
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                      {lead.goal || <span className="text-slate-300">--</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-500 bg-surface-100 px-2 py-0.5 rounded-md">
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge lead={lead} onStatusChange={handleStatusChange} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <span className="text-xs text-slate-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}--{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
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
