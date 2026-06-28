'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, FileText, Banknote } from 'lucide-react';

interface Slip {
  id: number;
  employee_id: number;
  gross: number;
  net_pay: number;
  total_deductions: number;
  paid_days: number | null;
  lop_days: number | null;
  status: string;
  hr_employees?: {
    full_name?: string;
    employee_code?: string;
  };
}

export default function PayrollRunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employee/hr/payroll/runs/${id}/slips`)
      .then((r) => r.json())
      .then((j) => setSlips(j.slips || []))
      .finally(() => setLoading(false));
  }, [id]);

  const inr = (v: number | null) => v == null ? '—' : '₹ ' + Math.round(Number(v)).toLocaleString('en-IN');

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/payroll" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payroll Run #{id} — Slips</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${slips.length} slip(s) generated`}
          </p>
        </div>
      </div>

      {/* Disbursement actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Disbursement</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Generic CSV is for any bank reconciliation. ICICI CIB CSV is the 16-column NACH-format file ready to upload via CIB → Bulk → Salary.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/employee/hr/payroll/runs/${id}/slips?bank=1`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Generic Bank Advice CSV
          </a>
          <a
            href={`/api/employee/hr/payroll/runs/${id}/nach-export`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
          >
            <Banknote className="w-3.5 h-3.5" />
            ICICI CIB Salary Upload
            <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[9px] tracking-wider">ICICI · NACH</span>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Paid Days</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Gross</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Deductions</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Net</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Slip</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((s, i) => (
              <tr key={s.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{s.hr_employees?.full_name || '—'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{s.hr_employees?.employee_code}</div>
                </td>
                <td className="px-4 py-2 text-right text-xs">{s.paid_days ?? '—'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{inr(s.gross)}</td>
                <td className="px-4 py-2 text-right font-mono text-xs text-rose-600">{inr(s.total_deductions)}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{inr(s.net_pay)}</td>
                <td className="px-4 py-2 text-xs uppercase">{s.status}</td>
                <td className="px-4 py-2 text-right">
                  <a
                    href={`/api/employee/hr/payroll/runs/${id}/slips/${s.id}?pdf=1`}
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
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No slips yet. Click <b>Calc</b> on the parent run to generate.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
