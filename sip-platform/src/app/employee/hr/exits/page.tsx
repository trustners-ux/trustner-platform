'use client';

/**
 * Phase 8 — Exits & F&F: List page.
 *
 * Shows every separation case grouped by lifecycle tab.
 * Data source: GET /api/employee/hr/exits
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LogOut, Plus, Loader2, ExternalLink } from 'lucide-react';
import type { SeparationStatus } from '@/lib/hr/separation-state';
import { statusLabel } from '@/lib/hr/separation-state';

interface SeparationRow {
  id: number;
  case_code: string;
  employee_id: number;
  employee_name: string | null;
  employee_code: string | null;
  employee_photo_url: string | null;
  separation_type: string;
  status: SeparationStatus;
  intent_date: string;
  requested_lwd: string | null;
  approved_lwd: string | null;
  lwd: string | null;
  fnf_net_payable: number | null;
  created_at: string;
}

const TABS: { key: string; label: string; statuses: SeparationStatus[] | null }[] = [
  { key: 'all',       label: 'All',                 statuses: null },
  { key: 'active',    label: 'Active',              statuses: ['draft', 'manager_review', 'notice_active'] },
  { key: 'clearance', label: 'Clearance Pending',   statuses: ['clearance_pending'] },
  { key: 'fnf_pend',  label: 'F&F Pending',         statuses: ['fnf_pending'] },
  { key: 'fnf_appr',  label: 'F&F Approved',        statuses: ['fnf_approved', 'fnf_disbursed'] },
  { key: 'closed',    label: 'Closed',              statuses: ['closed', 'withdrawn', 'rejected'] },
];

const STATUS_COLOR: Record<SeparationStatus, string> = {
  draft:              'bg-slate-100 text-slate-700',
  manager_review:     'bg-amber-100 text-amber-800',
  notice_active:      'bg-blue-100 text-blue-800',
  clearance_pending:  'bg-violet-100 text-violet-800',
  fnf_pending:        'bg-orange-100 text-orange-800',
  fnf_approved:       'bg-emerald-100 text-emerald-800',
  fnf_disbursed:      'bg-emerald-200 text-emerald-900',
  closed:             'bg-slate-200 text-slate-700',
  withdrawn:          'bg-slate-200 text-slate-600',
  rejected:           'bg-rose-100 text-rose-800',
};

const TYPE_LABEL: Record<string, string> = {
  resignation:                 'Resignation',
  termination_with_cause:      'Termination (cause)',
  termination_without_cause:   'Termination',
  retirement:                  'Retirement',
  death:                       'Death',
  permanent_disability:        'Disability',
  contract_end:                'Contract end',
  abandonment:                 'Abandonment',
  mutual_separation:           'Mutual separation',
};

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function inr(v: number | null): string {
  if (v == null) return '—';
  return '₹ ' + Math.round(v).toLocaleString('en-IN');
}

export default function ExitsListPage() {
  const [rows, setRows] = useState<SeparationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/employee/hr/exits')
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = TABS.find((x) => x.key === tab);
    if (!t || !t.statuses) return rows;
    return rows.filter((r) => t.statuses!.includes(r.status));
  }, [rows, tab]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Exits &amp; F&amp;F</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Separation cases · clearance · full &amp; final settlement
            </p>
          </div>
        </div>
        <Link
          href="/employee/hr/exits/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> New Separation
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const count = t.statuses === null ? rows.length : rows.filter((r) => t.statuses!.includes(r.status)).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Case</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Intent</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">LWD</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Days→LWD</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">F&amp;F Net</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const targetLwd = r.lwd || r.approved_lwd || r.requested_lwd;
              const daysToLwd = daysBetween(today, targetLwd);
              return (
                <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{r.case_code}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {r.employee_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.employee_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                          {(r.employee_name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{r.employee_name || `#${r.employee_id}`}</div>
                        {r.employee_code && <div className="text-[11px] text-slate-500 font-mono">{r.employee_code}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {TYPE_LABEL[r.separation_type] || r.separation_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{r.intent_date}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{targetLwd || '—'}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-mono ${daysToLwd != null && daysToLwd < 7 && daysToLwd >= 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                    {daysToLwd == null ? '—' : daysToLwd >= 0 ? `${daysToLwd}d` : `${Math.abs(daysToLwd)}d past`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{inr(r.fnf_net_payable)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[r.status]}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/employee/hr/exits/${r.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[10px] font-bold hover:bg-brand-700"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                No separation cases in this view.
              </td></tr>
            )}
            {loading && (
              <tr><td colSpan={9} className="px-4 py-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
