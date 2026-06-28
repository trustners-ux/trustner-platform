/**
 * FundReturnsCanonical
 *
 * Returns table with 1D/5D/1M/3M/6M/1Y/3Y/5Y/10Y columns.
 * Rows: Fund + Category Median (computed by caller; passed in via `median`).
 * Heatmap colouring on each cell to give a quick visual read.
 */

import type { FundDetail, CategoryMedianReturns } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
  median: CategoryMedianReturns | null;
}

const HORIZONS: Array<{
  key: keyof FundDetail & keyof CategoryMedianReturns;
  label: string;
  isAnnualised: boolean;
}> = [
  { key: 'returns_1d', label: '1D', isAnnualised: false },
  { key: 'returns_5d', label: '5D', isAnnualised: false },
  { key: 'returns_1m', label: '1M', isAnnualised: false },
  { key: 'returns_3m', label: '3M', isAnnualised: false },
  { key: 'returns_6m', label: '6M', isAnnualised: false },
  { key: 'returns_1y', label: '1Y', isAnnualised: false },
  { key: 'returns_3y', label: '3Y', isAnnualised: true },
  { key: 'returns_5y', label: '5Y', isAnnualised: true },
  { key: 'returns_10y', label: '10Y', isAnnualised: true },
];

const heat = (v: number | null, isAnnualised: boolean): string => {
  if (v == null) return '';
  if (isAnnualised) {
    if (v >= 18) return 'bg-emerald-100 text-emerald-900';
    if (v >= 12) return 'bg-emerald-50 text-emerald-800';
    if (v >= 8) return 'bg-yellow-50 text-yellow-900';
    if (v >= 0) return 'bg-orange-50 text-orange-900';
    return 'bg-rose-50 text-rose-900';
  }
  if (v >= 5) return 'bg-emerald-100 text-emerald-900';
  if (v >= 1) return 'bg-emerald-50 text-emerald-800';
  if (v >= -1) return 'bg-slate-50 text-slate-700';
  if (v >= -5) return 'bg-orange-50 text-orange-900';
  return 'bg-rose-50 text-rose-900';
};

const fmt = (v: number | null) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

export function FundReturnsCanonical({ fund, median }: Props) {
  return (
    <section className="py-8 bg-white border-y border-slate-200">
      <div className="container-custom">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900">Returns Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trailing returns. ≥1Y figures are annualised (CAGR).
            </p>
          </div>
          {median?.sampleSize && (
            <span className="text-[11px] text-slate-500">
              Category median based on {median.sampleSize} peers
            </span>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 sticky left-0 bg-slate-50">
                  Period
                </th>
                {HORIZONS.map((h) => (
                  <th
                    key={h.key as string}
                    className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                  >
                    {h.label}
                    {h.isAnnualised && (
                      <span className="block text-[9px] font-normal text-slate-400 normal-case">CAGR</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold text-slate-900 sticky left-0 bg-white">
                  This Fund
                </td>
                {HORIZONS.map((h) => {
                  const v = fund[h.key] as number | null;
                  return (
                    <td
                      key={h.key as string}
                      className={`px-3 py-3 text-right tabular-nums font-medium ${heat(v, h.isAnnualised)}`}
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
              {median && (
                <tr className="bg-slate-50/60">
                  <td className="px-3 py-2.5 text-slate-600 sticky left-0 bg-slate-50/60">
                    Category Median
                  </td>
                  {HORIZONS.map((h) => {
                    const v = median[h.key] as number | null;
                    return (
                      <td
                        key={h.key as string}
                        className="px-3 py-2.5 text-right tabular-nums text-slate-600"
                      >
                        {fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          Past performance does not guarantee future returns. Returns are net of expenses but
          do not account for taxes or exit loads. Mutual fund investments are subject to market risks.
        </p>
      </div>
    </section>
  );
}
