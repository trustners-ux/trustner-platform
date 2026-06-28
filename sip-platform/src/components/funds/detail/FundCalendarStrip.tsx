/**
 * FundCalendarStrip — 5-year calendar-year return heat strip.
 */

import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
}

const YEARS: Array<{ key: keyof FundDetail; label: string }> = [
  { key: 'annual_2021', label: '2021' },
  { key: 'annual_2022', label: '2022' },
  { key: 'annual_2023', label: '2023' },
  { key: 'annual_2024', label: '2024' },
  { key: 'annual_2025', label: '2025' },
];

const heatTile = (v: number | null): string => {
  if (v == null) return 'bg-slate-100 text-slate-400 border-slate-200';
  if (v >= 25) return 'bg-emerald-600 text-white border-emerald-700';
  if (v >= 15) return 'bg-emerald-400 text-white border-emerald-500';
  if (v >= 8) return 'bg-emerald-100 text-emerald-900 border-emerald-200';
  if (v >= 0) return 'bg-yellow-50 text-yellow-900 border-yellow-200';
  if (v >= -10) return 'bg-orange-100 text-orange-900 border-orange-200';
  return 'bg-rose-200 text-rose-900 border-rose-300';
};

export function FundCalendarStrip({ fund }: Props) {
  const all = YEARS.map((y) => ({ ...y, v: fund[y.key] as number | null }));
  const hasAny = all.some((y) => y.v != null);

  if (!hasAny) return null;

  return (
    <section className="py-8 bg-white border-y border-slate-200">
      <div className="container-custom">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900">Calendar-Year Returns</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Year-by-year performance (Jan – Dec, absolute, not annualised).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 lg:gap-3">
          {all.map((y) => (
            <div
              key={y.label}
              className={`rounded-lg border p-3 text-center transition-transform hover:scale-[1.02] ${heatTile(y.v)}`}
            >
              <div className="text-[11px] font-semibold opacity-80">{y.label}</div>
              <div className="text-base lg:text-lg font-bold tabular-nums mt-0.5">
                {y.v == null ? '—' : `${y.v >= 0 ? '+' : ''}${y.v.toFixed(1)}%`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
