'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Play, CheckCircle2, Send, Download, Loader2, FileText, Banknote, Info } from 'lucide-react';

interface Run {
  id: number;
  fy: string;
  pay_month: string;
  entity: 'TAS' | 'TIB';
  status: 'draft' | 'calculating' | 'calculated' | 'approved' | 'disbursed' | 'locked';
  total_employees: number | null;
  total_gross: number | null;
  total_net: number | null;
  total_pf: number | null;
  total_tds: number | null;
  approved_by: string | null;
  approved_at: string | null;
  disbursed_at: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  draft:       'bg-slate-100 text-slate-700',
  calculating: 'bg-amber-100 text-amber-800',
  calculated:  'bg-blue-100 text-blue-800',
  approved:    'bg-emerald-100 text-emerald-800',
  disbursed:   'bg-violet-100 text-violet-800',
  locked:      'bg-rose-100 text-rose-800',
};

export default function PayrollPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<number | null>(null);
  const [newForm, setNewForm] = useState({ fy: 'FY2026', pay_month: new Date().toISOString().slice(0, 7), entity: 'TIB' });

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/payroll/runs').then((r) => r.json()).then((j) => setRuns(j.rows || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const createRun = async () => {
    const res = await fetch('/api/employee/hr/payroll/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || 'Failed');
      return;
    }
    load();
  };

  const act = async (id: number, action: 'calculate' | 'approve' | 'disburse') => {
    setActing(id);
    try {
      const res = await fetch('/api/employee/hr/payroll/runs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const j = await res.json();
      if (!res.ok) alert(j.error || 'Failed');
      load();
    } finally {
      setActing(null);
    }
  };

  const inr = (v: number | null) => v == null ? '—' : '₹ ' + Math.round(v).toLocaleString('en-IN');

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monthly salary runs · PF/ESI/PT/TDS auto-calc · Bank advice CSV
          </p>
        </div>
      </div>

      {/* ICICI CIB integration notice */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-orange-100 text-orange-700 shrink-0">
          <Banknote className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-orange-900">ICICI CIB Salary Upload available</span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-200 text-orange-900">NACH</span>
          </div>
          <p className="text-[12px] text-orange-900/90 leading-relaxed">
            Approved runs export a 16-column ICICI CIB / NACH-format CSV ready to upload via Corporate Internet Banking → Bulk → Salary.
            Open any approved run to download. Set <code className="font-mono bg-orange-100 px-1 rounded">ICICI_CIB_DEBIT_ACCOUNT</code>
            {' '}(12-digit corp account) and <code className="font-mono bg-orange-100 px-1 rounded">HR_BANK_ENCRYPTION_KEY</code>
            {' '}(AES-256 key) in env before going live — without these, files generate with placeholder values for inspection only.
          </p>
        </div>
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
      </div>

      {/* New run */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Start New Payroll Run</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">FY</label>
            <select value={newForm.fy} onChange={(e) => setNewForm({ ...newForm, fy: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="FY2026">FY 2026-27</option>
              <option value="FY2027">FY 2027-28</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pay Month</label>
            <input type="month" value={newForm.pay_month} onChange={(e) => setNewForm({ ...newForm, pay_month: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Entity</label>
            <select value={newForm.entity} onChange={(e) => setNewForm({ ...newForm, entity: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="TAS">TAS</option>
              <option value="TIB">TIB</option>
            </select>
          </div>
          <button onClick={createRun} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700">
            Create Draft
          </button>
        </div>
      </div>

      {/* Runs table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Month</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600"># Emp</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Gross</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Net</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">PF</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">TDS</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2 font-mono text-xs">{r.pay_month}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.entity === 'TAS' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>{r.entity}</span>
                </td>
                <td className="px-4 py-2 text-right">{r.total_employees ?? '—'}</td>
                <td className="px-4 py-2 text-right font-mono">{inr(r.total_gross)}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{inr(r.total_net)}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{inr(r.total_pf)}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{inr(r.total_tds)}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-1">
                  {r.status === 'draft' && (
                    <button onClick={() => act(r.id, 'calculate')} disabled={acting === r.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700">
                      {acting === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Calc
                    </button>
                  )}
                  {r.status === 'calculated' && (
                    <button onClick={() => act(r.id, 'approve')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <>
                      <a href={`/api/employee/hr/payroll/runs/${r.id}/slips?bank=1`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-white text-[10px] font-bold hover:bg-slate-800">
                        <Download className="w-3 h-3" /> Bank CSV
                      </a>
                      <button onClick={() => act(r.id, 'disburse')} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700">
                        <Send className="w-3 h-3" /> Disburse
                      </button>
                    </>
                  )}
                  {r.status === 'disbursed' && (
                    <a href={`/api/employee/hr/payroll/runs/${r.id}/slips?bank=1`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200">
                      <Download className="w-3 h-3" /> Bank CSV
                    </a>
                  )}
                  {(r.status === 'calculated' || r.status === 'approved' || r.status === 'disbursed') && (
                    <Link href={`/employee/hr/payroll/runs/${r.id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[10px] font-bold hover:bg-brand-700">
                      <FileText className="w-3 h-3" /> Slips
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {!loading && runs.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">No payroll runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
