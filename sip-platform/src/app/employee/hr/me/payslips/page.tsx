'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Download, Loader2 } from 'lucide-react';

interface Slip {
  id: number;
  salary_run_id: number;
  gross: number;
  net_pay: number;
  total_deductions: number;
  paid_days: number | null;
  lop_days: number | null;
  status: string;
  basic: number;
  hra: number;
  special_allowance: number;
  variable_pay: number;
  pf_employee: number;
  esi_employee: number;
  professional_tax: number;
  tds: number;
  hr_salary_runs: { pay_month: string; entity: string; status: string } | null;
}

export default function MyPayslipsPage() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employee/hr/me/payslips')
      .then((r) => r.json())
      .then((j) => setSlips(j.slips || []))
      .finally(() => setLoading(false));
  }, []);

  const inr = (v: number | null | undefined) =>
    v == null ? '—' : '₹ ' + Math.round(Number(v)).toLocaleString('en-IN');

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/me" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Payslips</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${slips.length} slip(s)`}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Month</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Paid Days</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Gross</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Deductions</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Net</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">PDF</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((s, i) => (
              <tr key={s.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5 font-bold text-slate-900">{s.hr_salary_runs?.pay_month || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700">{s.hr_salary_runs?.entity || '—'}</td>
                <td className="px-4 py-2.5 text-right text-xs font-mono">{s.paid_days ?? '—'}</td>
                <td className="px-4 py-2.5 text-right font-mono">{inr(s.gross)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-rose-600">{inr(s.total_deductions)}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{inr(s.net_pay)}</td>
                <td className="px-4 py-2.5 text-right">
                  <a
                    href={`/api/employee/hr/payroll/runs/${s.salary_run_id}/slips/${s.id}?pdf=1`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-brand text-white text-xs font-bold hover:bg-brand-700"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </a>
                </td>
              </tr>
            ))}
            {!loading && slips.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No payslips yet. They&apos;ll appear here after each monthly payroll run.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
