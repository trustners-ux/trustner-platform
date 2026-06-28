/**
 * FundPeerCompareCanonical — top peers in the same external_category,
 * sorted by AUM descending. Current fund is highlighted. Peers are linked
 * to /funds/<peer_amfi_code>.
 */

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  current: FundDetail;
  peers: FundDetail[];
}

const fmtPct = (v: number | null) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const fmtAum = (v: number | null) => {
  if (v == null) return '—';
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L Cr`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K Cr`;
  return `${v.toFixed(0)} Cr`;
};

const pctTone = (v: number | null) => {
  if (v == null) return 'text-slate-400';
  if (v >= 0) return 'text-emerald-700';
  return 'text-rose-700';
};

export function FundPeerCompareCanonical({ current, peers }: Props) {
  // Merge + dedupe + sort by AUM. Current fund highlighted; first row.
  const seen = new Set<string>();
  const merged = [current, ...peers].filter((f) => {
    if (seen.has(f.amfi_code)) return false;
    seen.add(f.amfi_code);
    return true;
  });
  merged.sort((a, b) => {
    if (a.amfi_code === current.amfi_code) return -1;
    if (b.amfi_code === current.amfi_code) return 1;
    return (b.aum_inr_cr ?? 0) - (a.aum_inr_cr ?? 0);
  });

  if (peers.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-surface-100">
      <div className="container-custom">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900">
              Peers in {current.external_category ?? 'this category'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top {peers.length} schemes by AUM. Current fund highlighted in brand colour.
            </p>
          </div>
          {current.external_category && (
            <Link
              href={`/funds/universe?category=${encodeURIComponent(current.external_category)}`}
              className="text-xs font-semibold text-brand hover:text-brand-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Scheme
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  AUM
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  1Y
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  3Y CAGR
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Sharpe
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  TER
                </th>
              </tr>
            </thead>
            <tbody>
              {merged.map((p) => {
                const isCurrent = p.amfi_code === current.amfi_code;
                return (
                  <tr
                    key={p.amfi_code}
                    className={`border-b border-slate-100 last:border-none transition-colors ${
                      isCurrent
                        ? 'bg-brand/5'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/funds/${p.amfi_code}`}
                        className="flex items-center gap-1.5 group"
                      >
                        {p.trustner_preferred && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium truncate max-w-[260px] ${
                              isCurrent
                                ? 'text-brand-700 font-semibold'
                                : 'text-slate-900 group-hover:text-brand'
                            }`}
                          >
                            {p.scheme_name}
                            {isCurrent && (
                              <span className="ml-2 inline-block text-[10px] uppercase tracking-wider bg-brand text-white px-1.5 py-0.5 rounded">
                                This Fund
                              </span>
                            )}
                          </div>
                          {p.amc_name && (
                            <div className="text-[11px] text-slate-500">{p.amc_name}</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">
                      ₹{fmtAum(p.aum_inr_cr)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${pctTone(p.returns_1y)}`}>
                      {fmtPct(p.returns_1y)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${pctTone(p.returns_3y)}`}>
                      {fmtPct(p.returns_3y)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {p.sharpe != null ? p.sharpe.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {p.ter != null ? `${p.ter.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
