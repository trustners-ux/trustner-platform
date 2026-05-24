/**
 * Artefact-View Audit Log Viewer
 *
 * Route: /admin/audit/views
 *
 * Compliance + governance UI. Answers "who viewed client X's data
 * in the last N days" in 2 clicks.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Download, ScrollText, Filter, RefreshCw } from 'lucide-react';

interface ViewRow {
  id: number;
  viewedAt: string;
  viewerId: number;
  viewerName: string;
  viewerEmail: string;
  viewerRole: string;
  artefactType: string;
  artefactId: number;
  artefactLabel: string;
  artefactStatus: string | null;
  scopeUsed: string | null;
}

const ARTEFACT_TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'portfolio_diagnostic', label: 'Portfolio Diagnostic' },
  { value: 'meeting_brief', label: 'Meeting Brief' },
  { value: 'investment_proposal', label: 'Investment Proposal' },
  { value: 'client_orientation', label: 'Client Orientation' },
  { value: 'periodic_review', label: 'Periodic Review' },
  { value: 'client_family', label: 'Client Family (PII)' },
];

export default function AuditViewsPage() {
  const [views, setViews] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterFamilyId, setFilterFamilyId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('artefactType', filterType);
      if (filterFamilyId) params.set('familyId', filterFamilyId);
      if (filterEmployeeId) params.set('employeeId', filterEmployeeId);
      if (filterFrom) params.set('from', new Date(filterFrom).toISOString());
      if (filterTo) {
        const t = new Date(filterTo);
        t.setHours(23, 59, 59, 999);
        params.set('to', t.toISOString());
      }
      params.set('limit', '500');
      const res = await fetch(`/api/admin/audit/views?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setViews(data.views ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (views.length === 0) return;
    const headers = ['viewed_at', 'viewer', 'viewer_email', 'artefact_type', 'artefact_id', 'artefact_label', 'status', 'scope_used'];
    const rows = views.map((v) => [
      v.viewedAt,
      v.viewerName,
      v.viewerEmail,
      v.artefactType,
      String(v.artefactId),
      v.artefactLabel,
      v.artefactStatus ?? '',
      v.scopeUsed ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `audit-views-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(u);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
            <ScrollText className="h-6 w-6" />
            Audit Log — Artefact Views
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compliance trail of who read which client artefact, when, and under what scope.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={views.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Table Changes →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-600 block mb-1">Artefact type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
            >
              {ARTEFACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Family ID</label>
            <input
              type="number"
              value={filterFamilyId}
              onChange={(e) => setFilterFamilyId(e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Viewer (employee ID)</label>
            <input
              type="number"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              placeholder="e.g. 1"
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">From</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">To</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Apply filters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">When</th>
              <th className="text-left px-3 py-2 font-semibold">Viewer</th>
              <th className="text-left px-3 py-2 font-semibold">Artefact</th>
              <th className="text-left px-3 py-2 font-semibold">Type</th>
              <th className="text-left px-3 py-2 font-semibold">Status</th>
              <th className="text-left px-3 py-2 font-semibold">Scope</th>
            </tr>
          </thead>
          <tbody>
            {loading && views.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
            ) : views.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-8">
                  No artefact views in the selected range. As the team uses the platform, every read will appear here.
                </td>
              </tr>
            ) : (
              views.map((v) => (
                <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    <div className="font-semibold text-slate-900">
                      {new Date(v.viewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold text-slate-900">{v.viewerName}</div>
                    <div className="text-[11px] text-slate-500">{v.viewerEmail}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold">
                      {v.artefactType === 'portfolio_diagnostic' ? (
                        <Link href={`/admin/portfolio-diagnostic/${v.artefactId}/review`} className="text-primary-700 hover:text-primary-900">
                          {v.artefactLabel}
                        </Link>
                      ) : (
                        v.artefactLabel
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">#{v.artefactId}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {v.artefactType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-slate-600">{v.artefactStatus ?? '—'}</td>
                  <td className="px-3 py-2 align-top">
                    {v.scopeUsed ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                        {v.scopeUsed}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 flex items-center gap-2">
        <Eye className="h-3 w-3" />
        Showing {views.length} most recent view{views.length !== 1 ? 's' : ''} (max 500).
      </div>
    </div>
  );
}
