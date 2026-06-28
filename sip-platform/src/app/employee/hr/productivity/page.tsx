'use client';

/**
 * Productivity Dashboard — Founder / CDO view.
 * Per-employee salary cost vs business contribution + DSR + attendance.
 * Anti-leakage controls Ram asked for.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, ArrowLeft, Users, Wallet, IndianRupee } from 'lucide-react';

interface Row {
  employee_id: number;
  employee_code: string;
  full_name: string;
  entity: string;
  designation: string | null;
  grade_band: string | null;
  total_salary_6mo: number;
  total_business_6mo: number;
  total_commission_6mo: number;
  avg_roi_6mo: number;
  avg_attendance_6mo: number;
  avg_dsr_6mo: number;
  months_flagged: number;
  months_in_period: number;
  dsr_days_30d: number;
  present_days_30d: number;
  dsr_pct_30d: number;
  attendance_pct_30d: number;
  flag_reason: string | null;
}

interface Summary {
  total_employees: number;
  flagged_count: number;
  total_salary_6mo: number;
  total_commission_6mo: number;
  overall_roi: number;
}

export default function ProductivityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');

  useEffect(() => {
    fetch('/api/employee/hr/productivity')
      .then((r) => r.json())
      .then((j) => {
        setRows(j.rows || []);
        setSummary(j.summary || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const inr = (v: number) => '₹ ' + Math.round(Number(v || 0)).toLocaleString('en-IN');
  const inrLakh = (v: number) => {
    const n = Number(v || 0);
    if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹ ${(n / 100000).toFixed(1)} L`;
    if (n >= 1000) return `₹ ${(n / 1000).toFixed(0)}K`;
    return '₹ ' + Math.round(n).toLocaleString('en-IN');
  };

  const visible = filter === 'flagged' ? rows.filter((r) => r.flag_reason) : rows;

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> HR Dashboard
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6 flex-wrap justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Productivity &amp; Anti-Leakage</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Salary cost vs commission earned · DSR submission % · Attendance % · Auto-flagged
            </p>
          </div>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'flagged')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
          <option value="all">All employees</option>
          <option value="flagged">Flagged only</option>
        </select>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs text-slate-500">Active employees</div>
            <div className="text-2xl font-extrabold text-slate-900">{summary.total_employees}</div>
          </div>
          <div className="bg-white rounded-xl border border-rose-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xs text-rose-700">Flagged</div>
            <div className="text-2xl font-extrabold text-rose-700">{summary.flagged_count}</div>
            <div className="text-[10px] text-slate-400">need review</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xs text-slate-500">6-mo salary cost</div>
            <div className="text-xl font-extrabold text-slate-900">{inrLakh(summary.total_salary_6mo)}</div>
          </div>
          <div className={`rounded-xl border p-4 ${summary.overall_roi >= 1 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <IndianRupee className={`w-4 h-4 ${summary.overall_roi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`} />
              {summary.overall_roi >= 1 ? <TrendingUp className="w-4 h-4 text-emerald-700" /> : <TrendingDown className="w-4 h-4 text-rose-700" />}
            </div>
            <div className={`text-xs ${summary.overall_roi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`}>Group ROI</div>
            <div className={`text-2xl font-extrabold ${summary.overall_roi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {summary.overall_roi.toFixed(2)}x
            </div>
            <div className="text-[10px] text-slate-400">commission / salary</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-slate-700 flex justify-between">
          <span>{loading ? 'Loading…' : `${visible.length} of ${rows.length} employees`}</span>
          <span className="text-xs text-slate-500 font-normal">
            ROI &lt; 0.5 OR DSR &lt; 60% OR Attendance &lt; 75% = flagged
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Grade</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Salary 6mo</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Commission 6mo</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">ROI</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">DSR 30d</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Attend 30d</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Flag</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const roi = Number(r.avg_roi_6mo);
              const dsr = Number(r.dsr_pct_30d);
              const att = Number(r.attendance_pct_30d);
              return (
                <tr key={r.employee_id} className={`border-b border-slate-100 ${r.flag_reason ? 'bg-rose-50/40' : i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-3 py-2.5">
                    <Link href={`/employee/hr/employees/${r.employee_id}`} className="font-medium text-slate-900 hover:text-brand">
                      {r.full_name}
                    </Link>
                    <div className="text-[11px] text-slate-500 font-mono">{r.employee_code} · {r.entity}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs uppercase font-bold text-slate-600">{r.grade_band || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{inrLakh(r.total_salary_6mo)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{inrLakh(r.total_commission_6mo)}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${roi >= 1 ? 'text-emerald-700' : roi >= 0.5 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {roi.toFixed(2)}x
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono text-xs ${dsr >= 80 ? 'text-emerald-700' : dsr >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {dsr.toFixed(0)}%
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono text-xs ${att >= 90 ? 'text-emerald-700' : att >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {att.toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5">
                    {r.flag_reason ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="w-3 h-3" />
                        {r.flag_reason}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600">✓ healthy</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-500">
                {filter === 'flagged' ? '✓ Nobody flagged. Healthy team!' : 'No data. Run a payroll month + collect a few DSR entries to populate.'}
              </td></tr>
            )}
            {loading && <tr><td colSpan={8} className="px-3 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-[11px] text-slate-500 leading-relaxed">
        <b>Methodology:</b> Salary cost from <code>hr_salary_slips</code> over last 6 months. Commission earned is the trail/upfront
        commission Trustner received attributable to this employee&apos;s book. ROI = commission ÷ salary; a healthy
        sales hire should be ≥ 1.0x within the first 6 months. DSR % = days a DSR was submitted ÷ 22 expected
        working days. Attendance % = present days (incl. WFH approved) ÷ 22.
      </div>
    </div>
  );
}
