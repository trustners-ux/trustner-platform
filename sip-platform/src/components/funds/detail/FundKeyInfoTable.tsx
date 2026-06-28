/**
 * FundKeyInfoTable — scheme reference data (launch, category, AMFI code, TER, etc).
 */

import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
  benchmark?: string | null;
  exitLoad?: string | null;
  isin?: string | null;
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FundKeyInfoTable({ fund, benchmark, exitLoad, isin }: Props) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'AMFI Code', value: fund.amfi_code },
    { label: 'Scheme Name', value: fund.scheme_name },
    { label: 'AMC', value: fund.amc_name ?? '—' },
    { label: 'Category (AMFI)', value: fund.amfi_category ?? '—' },
    { label: 'Sub-category', value: fund.amfi_sub_category ?? '—' },
    { label: 'External Category', value: fund.external_category ?? '—' },
    { label: 'Launch Date', value: fmtDate(fund.launch_date) },
    { label: 'TER', value: fund.ter != null ? `${fund.ter.toFixed(2)}%` : '—' },
    { label: 'Riskometer', value: fund.riskometer ?? '—' },
    { label: 'Benchmark', value: benchmark ?? '—' },
    { label: 'Exit Load', value: exitLoad ?? '—' },
    { label: 'ISIN', value: isin ?? '—' },
  ];

  return (
    <section className="py-8 bg-white border-y border-slate-200">
      <div className="container-custom">
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">
          Scheme Information
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <dl className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[160px_1fr] lg:grid-cols-[200px_1fr] gap-3 px-4 py-2.5 odd:bg-slate-50/50"
              >
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {r.label}
                </dt>
                <dd className="text-sm text-slate-900 break-words">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
