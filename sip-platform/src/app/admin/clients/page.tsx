/**
 * Admin Client Directory
 *
 * Route: /admin/clients
 *
 * Searchable, sortable list of every client family with artefact
 * counts + last activity + latest published AUM. The home for the
 * 6000-client scale-up Ram has planned.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Search, Loader2, ClipboardList, FileText, Briefcase,
  CompassIcon, RefreshCw, ChevronDown,
} from 'lucide-react';

interface ClientRow {
  id: number;
  familyCode: string | null;
  familyName: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactMobile: string | null;
  segment: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  diagnosticCount: number;
  publishedDiagnosticCount: number;
  briefCount: number;
  proposalCount: number;
  orientationCount: number;
  reviewCount: number;
  latestPublishedAumInr: number | null;
  latestPublishedDiagId: number | null;
}

function formatInr(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n === 0) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

const SEGMENTS = ['', 'Mass', 'Retail', 'HNI', 'UHNI', 'Corporate'];

export default function ClientsDirectoryPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState('');
  const [hasActivity, setHasActivity] = useState(false);
  const [sort, setSort] = useState('updated_desc');

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (segment) params.set('segment', segment);
      if (hasActivity) params.set('hasActivity', '1');
      if (sort) params.set('sort', sort);
      params.set('limit', '500');
      const res = await fetch(`/api/admin/clients?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setClients(data.clients ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => ({
    families: clients.length,
    aum: clients.reduce((s, c) => s + (c.latestPublishedAumInr ?? 0), 0),
    activeWithDiag: clients.filter((c) => c.diagnosticCount > 0).length,
  }), [clients]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Client Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every family Trustner serves — searchable, filterable, with one-click drill-down into their complete history.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">FAMILIES</div>
          <div className="text-2xl font-extrabold text-primary-700 mt-1">{totals.families.toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">TOTAL AUM (LATEST PUBLISHED)</div>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">{formatInr(totals.aum)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">WITH DIAGNOSTICS</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{totals.activeWithDiag.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600 block mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
                placeholder="Family name, contact name, or mobile"
                className="w-full pl-8 border border-slate-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Segment</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs">
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>{s || 'All segments'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs">
              <option value="updated_desc">Recently active</option>
              <option value="aum_desc">AUM (high → low)</option>
              <option value="name_asc">Name (A → Z)</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={hasActivity} onChange={(e) => setHasActivity(e.target.checked)} />
              Only with diagnostics
            </label>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Apply
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
              <th className="text-left px-3 py-2 font-semibold">Family</th>
              <th className="text-left px-3 py-2 font-semibold">Contact</th>
              <th className="text-left px-3 py-2 font-semibold">Segment</th>
              <th className="text-right px-3 py-2 font-semibold">Latest AUM</th>
              <th className="text-center px-3 py-2 font-semibold">Artefacts</th>
              <th className="text-left px-3 py-2 font-semibold">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {loading && clients.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-8">No families match your filters.</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 align-top">
                    <Link href={`/admin/clients/${c.id}`} className="font-semibold text-slate-900 hover:text-primary-700">
                      {c.familyName}
                    </Link>
                    <div className="text-[11px] text-slate-500">{c.familyCode ?? '—'}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="text-slate-700">{c.primaryContactName ?? '—'}</div>
                    <div className="text-[11px] text-slate-500">{c.primaryContactMobile ?? '—'}</div>
                    {c.primaryContactEmail && <div className="text-[11px] text-slate-500">{c.primaryContactEmail}</div>}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {c.segment ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        {c.segment}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2 align-top text-right font-mono">
                    {formatInr(c.latestPublishedAumInr)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center justify-center gap-2 text-[11px]">
                      <CountChip icon={ClipboardList} value={c.diagnosticCount} label="PD" tone="primary" />
                      <CountChip icon={FileText} value={c.briefCount} label="MP" tone="teal" />
                      <CountChip icon={Briefcase} value={c.proposalCount} label="IP" tone="amber" />
                      <CountChip icon={CompassIcon} value={c.orientationCount} label="CO" tone="emerald" />
                      <CountChip icon={RefreshCw} value={c.reviewCount} label="PR" tone="rose" />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-slate-600">
                    {c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleString('en-IN', { dateStyle: 'medium' }) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Showing {clients.length} families · 5-letter chips: PD=Diagnostic, MP=Meeting Prep, IP=Investment Proposal, CO=Client Orientation, PR=Periodic Review.
      </div>
    </div>
  );
}

function CountChip({
  icon: Icon, value, label, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  tone: 'primary' | 'teal' | 'amber' | 'emerald' | 'rose';
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  } as const;
  if (value === 0) return <span className="text-slate-300 w-7 text-center">{label}</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold ${tones[tone]}`} title={`${label}: ${value}`}>
      <Icon className="h-2.5 w-2.5" />
      {value}
    </span>
  );
}
