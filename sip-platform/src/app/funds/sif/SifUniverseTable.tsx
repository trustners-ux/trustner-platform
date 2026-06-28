'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SifRichRow, SifRichUniverse } from '@/lib/services/sif-data';
import type { SifCat, SifVerdict } from '@/data/sif/sif-editorial';

/* ── tiny formatters ─────────────────────────────────────────────── */
const fmtNav = (n: number | null) =>
  n == null ? '—' : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const fmtPct = (n: number | null) =>
  n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(n <= -10 || n >= 10 ? 1 : 2)}%`;
const fmtAum = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')} Cr`);
const fmtTer = (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}%`);
const inceptMonth = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const pctClass = (n: number | null) =>
  n == null ? 'text-slate-400' : n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-700' : 'text-slate-500';

/* verdict pill — institutional muted palette */
const VERDICT_STYLE: Record<SifVerdict, string> = {
  '★ Buy': 'bg-[#F5EFE3] text-[#8A6A40] border-[#D8C7A6]',
  '★ Buy (sat.)': 'bg-[#F5EFE3] text-[#8A6A40] border-[#D8C7A6]',
  Accumulate: 'bg-[#E8F1EC] text-[#2F6F4F] border-[#B9D4C5]',
  Hold: 'bg-slate-100 text-slate-600 border-slate-300',
  Monitor: 'bg-slate-50 text-slate-400 border-slate-200',
};
const tfsClass = (t: number | null) =>
  t == null ? 'text-slate-400 bg-slate-50 border-slate-200'
    : t >= 70 ? 'text-[#8A6A40] bg-[#F5EFE3] border-[#D8C7A6]'
    : t >= 60 ? 'text-[#2F6F4F] bg-[#E8F1EC] border-[#B9D4C5]'
    : 'text-slate-600 bg-slate-100 border-slate-300';
const RISK_LABEL = ['', 'Low', 'Low–Mod', 'Moderate', 'Mod–High', 'High', 'Very High'];
const riskClass = (r: number | null) =>
  r == null ? 'text-slate-400' : r <= 2 ? 'text-emerald-700' : r <= 4 ? 'text-amber-700' : 'text-rose-700';

type SortKey = 'tfs' | 'nav' | 'si' | 'm1' | 'm3' | 'aum' | 'ter';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'tfs', label: 'Trustner Fund Score' },
  { key: 'si', label: 'Since inception' },
  { key: 'm3', label: '3-month return' },
  { key: 'm1', label: '1-month return' },
  { key: 'nav', label: 'NAV' },
  { key: 'aum', label: 'AUM' },
  { key: 'ter', label: 'TER (low → high)' },
];

export default function SifUniverseTable({ data }: { data: SifRichUniverse }) {
  const [cat, setCat] = useState<'all' | SifCat>('all');
  const [sortKey, setSortKey] = useState<SortKey>('tfs');

  const rows = useMemo(() => {
    const filtered = data.rows.filter((r) => cat === 'all' || r.cat === cat);
    const val = (r: SifRichRow): number | null => (sortKey === 'tfs' ? r.tfs : r[sortKey]);
    const asc = sortKey === 'ter';
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;   // nulls always last
      if (bv == null) return -1;
      return asc ? av - bv : bv - av;
    });
  }, [data.rows, cat, sortKey]);

  return (
    <div>
      {/* status line */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mb-3">
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
          <span className={`inline-block w-2 h-2 rounded-full ${data.engineOk ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          Official AMFI NAVs ({data.officialCount}/{data.total} funds)
        </span>
        {data.navAsOf && <span>· as of <strong className="text-primary-700">{fmtDate(data.navAsOf)}</strong></span>}
        <span>· SI exact vs face value · 1M/3M, AUM, risk &amp; TER: Value Research ({fmtDate(data.vrAsOf)})</span>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {[{ cat: 'all' as const, label: 'All', count: data.total }, ...data.byCat.map((c) => ({ cat: c.cat as 'all' | SifCat, label: c.label, count: c.count }))].map((c) => (
            <button
              key={c.cat}
              onClick={() => setCat(c.cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                cat === c.cat
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-slate-600 border-surface-300 hover:border-brand-300 hover:text-primary-700'
              }`}
            >
              {c.label} <span className="opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-500">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 outline-none focus:border-brand-400"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* table (desktop) */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-surface-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-700 text-white text-xs">
              <th className="px-3 py-2.5 text-left font-semibold">Fund</th>
              <th className="px-2 py-2.5 text-right font-semibold">NAV</th>
              <th className="px-2 py-2.5 text-right font-semibold">1D</th>
              <th className="px-2 py-2.5 text-right font-semibold">5D</th>
              <th className="px-2 py-2.5 text-right font-semibold">1M</th>
              <th className="px-2 py-2.5 text-right font-semibold">3M</th>
              <th className="px-2 py-2.5 text-right font-semibold">SI</th>
              <th className="px-2 py-2.5 text-right font-semibold">AUM</th>
              <th className="px-2 py-2.5 text-center font-semibold">Risk</th>
              <th className="px-2 py-2.5 text-right font-semibold">TER</th>
              <th className="px-2 py-2.5 text-center font-semibold">TFS</th>
              <th className="px-3 py-2.5 text-center font-semibold">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-surface-200 hover:bg-surface-100/60">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {r.source === 'amfi' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Official AMFI NAV" />}
                    <Link href={`/funds/sif/${r.id}`} className="font-semibold text-primary-700 hover:text-brand hover:underline">{r.name}</Link>
                  </div>
                  <div className="text-[11px] text-slate-500">{r.amc} · since {inceptMonth(r.incept)}</div>
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-slate-800 whitespace-nowrap">{fmtNav(r.nav)}</td>
                <td className={`px-2 py-2.5 text-right tabular-nums ${pctClass(r.d1)}`}>{fmtPct(r.d1)}</td>
                <td className={`px-2 py-2.5 text-right tabular-nums ${pctClass(r.d5)}`}>{fmtPct(r.d5)}</td>
                <td className={`px-2 py-2.5 text-right tabular-nums ${pctClass(r.m1)}`}>{fmtPct(r.m1)}</td>
                <td className={`px-2 py-2.5 text-right tabular-nums ${pctClass(r.m3)}`}>{fmtPct(r.m3)}</td>
                <td className={`px-2 py-2.5 text-right tabular-nums font-semibold ${pctClass(r.si)}`}>{fmtPct(r.si)}</td>
                <td className="px-2 py-2.5 text-right tabular-nums text-slate-600 whitespace-nowrap">{fmtAum(r.aum)}</td>
                <td className={`px-2 py-2.5 text-center text-[11px] font-semibold ${riskClass(r.risk)}`}>{r.risk == null ? '—' : RISK_LABEL[r.risk] ?? r.risk}</td>
                <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">{fmtTer(r.ter)}</td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded border text-xs font-bold tabular-nums ${tfsClass(r.tfs)}`}>{r.tfs ?? '—'}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${VERDICT_STYLE[r.verdict]}`}>{r.verdict}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cards (mobile / tablet) */}
      <div className="lg:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  {r.source === 'amfi' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  <Link href={`/funds/sif/${r.id}`} className="font-bold text-primary-700 text-sm leading-tight hover:text-brand hover:underline">{r.name}</Link>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{r.amc} · {r.catLabel} · since {inceptMonth(r.incept)}</div>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${VERDICT_STYLE[r.verdict]}`}>{r.verdict}</span>
            </div>
            <div className="grid grid-cols-4 gap-x-3 gap-y-2 mt-3 text-center">
              <Cell label="NAV" value={fmtNav(r.nav)} cls="text-slate-800 font-semibold" />
              <Cell label="SI" value={fmtPct(r.si)} cls={`font-semibold ${pctClass(r.si)}`} />
              <Cell label="1M" value={fmtPct(r.m1)} cls={pctClass(r.m1)} />
              <Cell label="3M" value={fmtPct(r.m3)} cls={pctClass(r.m3)} />
              <Cell label="1D" value={fmtPct(r.d1)} cls={pctClass(r.d1)} />
              <Cell label="5D" value={fmtPct(r.d5)} cls={pctClass(r.d5)} />
              <Cell label="AUM" value={fmtAum(r.aum)} cls="text-slate-700" />
              <Cell label="TER" value={fmtTer(r.ter)} cls="text-slate-700" />
              <Cell label="Risk" value={r.risk == null ? '—' : RISK_LABEL[r.risk] ?? String(r.risk)} cls={`font-semibold ${riskClass(r.risk)}`} />
              <div className="col-span-1">
                <div className="text-[9px] uppercase tracking-wide text-slate-400">TFS</div>
                <span className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded border text-xs font-bold mt-0.5 ${tfsClass(r.tfs)}`}>{r.tfs ?? '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-xs tabular-nums mt-0.5 ${cls ?? 'text-slate-700'}`}>{value}</div>
    </div>
  );
}
