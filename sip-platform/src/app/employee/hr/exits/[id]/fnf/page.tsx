'use client';

/**
 * Phase 8 — F&F breakdown page.
 *
 * - Run-calculation button (POST /fnf/compute)
 * - Earnings | Deductions | Recoveries side-by-side
 * - Gratuity + EL encashment cards
 * - Net payable big number + payable_by countdown
 * - Approve / Override / Download PDF actions
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calculator, ArrowLeft, Loader2, Download, CheckCircle2, Send, AlertTriangle,
  Plus, Save,
} from 'lucide-react';

type FnFStatus = 'computed' | 'approved' | 'disbursed' | null;

interface FnfData {
  id: number;
  status: FnFStatus;
  separation_id: number;
  employee_id: number;
  doj: string;
  lwd: string;
  fnf_month: string;
  paid_days: number;
  lop_days: number;
  // Earnings
  final_basic: number;
  final_hra: number;
  final_special: number;
  final_variable: number;
  bonus_prorate: number;
  el_balance_days: number;
  el_encash_amount: number;
  gratuity_applicable: boolean;
  gratuity_years: number;
  gratuity_amount: number;
  gratuity_taxable_excess: number;
  reimbursement_pending: number;
  // Deductions
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  tds_deduction: number;
  loan_recovery: number;
  notice_shortfall_recovery: number;
  asset_recovery: number;
  other_recovery: number;
  // Totals
  gross_payable: number;
  net_payable: number;
  payable_by_date: string;
  approved_by: string | null;
  approved_at: string | null;
  disbursed_by: string | null;
  disbursed_at: string | null;
}

function inr(v: number | null | undefined): string {
  if (v == null) return '—';
  return '₹ ' + Math.round(v).toLocaleString('en-IN');
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const OVERRIDE_FIELDS: { key: keyof FnfData; label: string }[] = [
  { key: 'final_basic',                label: 'Basic' },
  { key: 'final_hra',                  label: 'HRA' },
  { key: 'final_special',              label: 'Special allowance' },
  { key: 'final_variable',             label: 'Variable' },
  { key: 'bonus_prorate',              label: 'Bonus (pro-rate)' },
  { key: 'el_encash_amount',           label: 'EL encashment' },
  { key: 'gratuity_amount',            label: 'Gratuity' },
  { key: 'reimbursement_pending',      label: 'Reimbursements' },
  { key: 'loan_recovery',              label: 'Loan recovery' },
  { key: 'notice_shortfall_recovery',  label: 'Notice shortfall' },
  { key: 'asset_recovery',             label: 'Asset recovery' },
  { key: 'other_recovery',             label: 'Other recovery' },
];

export default function FnFPage() {
  const { id } = useParams() as { id: string };
  const [fnf, setFnf] = useState<FnfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideKey, setOverrideKey] = useState<keyof FnfData>('final_basic');
  const [overrideVal, setOverrideVal] = useState<string>('');

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/exits/${id}/fnf`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => setFnf(j?.row || j || null))
      .catch(() => setFnf(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const compute = async () => {
    setActing('compute');
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/fnf/compute`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Compute failed'); return; }
      load();
    } finally { setActing(null); }
  };

  const approve = async () => {
    setActing('approve');
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/fnf/approve`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Approve failed'); return; }
      load();
    } finally { setActing(null); }
  };

  const disburse = async () => {
    setActing('disburse');
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/fnf/disburse`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Disburse failed'); return; }
      load();
    } finally { setActing(null); }
  };

  const saveOverride = async () => {
    if (!overrideVal) return;
    setActing('override');
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/fnf`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [overrideKey]: Number(overrideVal) }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Override failed'); return; }
      setOverrideVal('');
      load();
    } finally { setActing(null); }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <Link href={`/employee/hr/exits/${id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to case
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Full &amp; Final Settlement</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {fnf ? `F&F month ${fnf.fnf_month} · paid days ${fnf.paid_days}` : 'Not yet computed'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!fnf && (
            <button
              onClick={compute}
              disabled={acting === 'compute'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {acting === 'compute' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Run F&amp;F calculation
            </button>
          )}
          {fnf && (
            <>
              <button
                onClick={compute}
                disabled={acting === 'compute' || fnf.status === 'disbursed'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
              >
                {acting === 'compute' && <Loader2 className="w-3 h-3 animate-spin" />}
                Re-run
              </button>
              <a
                href={`/api/employee/hr/exits/${id}/fnf/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-800"
              >
                <Download className="w-3 h-3" /> Download PDF
              </a>
              {fnf.status === 'computed' && (
                <button
                  onClick={approve}
                  disabled={acting === 'approve'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {acting === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Approve
                </button>
              )}
              {fnf.status === 'approved' && (
                <button
                  onClick={disburse}
                  disabled={acting === 'disburse'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50"
                >
                  {acting === 'disburse' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Mark Disbursed
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      {!fnf && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">
            F&amp;F has not been computed for this case yet.<br />
            Move the case to <b>Clearance Pending</b> and run the calculation.
          </p>
        </div>
      )}

      {fnf && (
        <>
          {/* NET PAYABLE big number */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Net Payable</div>
                <div className="text-4xl font-extrabold text-emerald-900 mt-1">{inr(fnf.net_payable)}</div>
                <div className="text-xs text-emerald-800 mt-1">
                  Gross {inr(fnf.gross_payable)} · F&amp;F month {fnf.fnf_month}
                </div>
              </div>
              <CountdownBlock target={fnf.payable_by_date} />
            </div>
          </div>

          {/* Three column split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {/* Earnings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Earnings</h3>
              <dl className="space-y-1.5 text-sm">
                <KV k="Basic" v={inr(fnf.final_basic)} />
                <KV k="HRA" v={inr(fnf.final_hra)} />
                <KV k="Special allowance" v={inr(fnf.final_special)} />
                <KV k="Variable" v={inr(fnf.final_variable)} />
                <KV k="Bonus (pro-rate)" v={inr(fnf.bonus_prorate)} />
                <KV k="EL encashment" v={inr(fnf.el_encash_amount)} />
                <KV k="Gratuity" v={inr(fnf.gratuity_amount)} />
                <KV k="Reimbursements" v={inr(fnf.reimbursement_pending)} />
              </dl>
            </div>

            {/* Deductions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Statutory Deductions</h3>
              <dl className="space-y-1.5 text-sm">
                <KV k="PF" v={inr(fnf.pf_deduction)} />
                <KV k="ESI" v={inr(fnf.esi_deduction)} />
                <KV k="Professional Tax" v={inr(fnf.pt_deduction)} />
                <KV k="TDS" v={inr(fnf.tds_deduction)} />
              </dl>
            </div>

            {/* Recoveries */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">Recoveries</h3>
              <dl className="space-y-1.5 text-sm">
                <KV k="Loan recovery" v={inr(fnf.loan_recovery)} />
                <KV k="Notice shortfall" v={inr(fnf.notice_shortfall_recovery)} highlight={fnf.notice_shortfall_recovery > 0} />
                <KV k="Asset recovery" v={inr(fnf.asset_recovery)} />
                <KV k="Other recovery" v={inr(fnf.other_recovery)} />
              </dl>
            </div>
          </div>

          {/* Gratuity + EL cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gratuity</h3>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">{inr(fnf.gratuity_amount)}</div>
              <div className="text-xs text-slate-600">
                {fnf.gratuity_applicable ? (
                  <>
                    Applicable — completed years: <b>{fnf.gratuity_years}</b><br />
                    Formula: (Basic + DA) × 15 ÷ 26 × years of service.<br />
                    Taxable excess over ₹20L limit: <b>{inr(fnf.gratuity_taxable_excess)}</b>
                  </>
                ) : (
                  <>Not applicable — under 5 years of completed service.</>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">EL Encashment</h3>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">{inr(fnf.el_encash_amount)}</div>
              <div className="text-xs text-slate-600">
                Balance: <b>{fnf.el_balance_days}</b> days × (Basic ÷ 30) per day.<br />
                Encashed as part of F&amp;F.
              </div>
            </div>
          </div>

          {/* Override field */}
          {fnf.status !== 'disbursed' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> HR Override (audited)
              </h3>
              <div className="flex items-end gap-2 flex-wrap">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Field</label>
                  <select
                    value={overrideKey}
                    onChange={(e) => setOverrideKey(e.target.value as keyof FnfData)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    {OVERRIDE_FIELDS.map((f) => (
                      <option key={String(f.key)} value={String(f.key)}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New value (₹)</label>
                  <input
                    type="number"
                    value={overrideVal}
                    onChange={(e) => setOverrideVal(e.target.value)}
                    placeholder="e.g. 12500"
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <button
                  onClick={saveOverride}
                  disabled={acting === 'override' || !overrideVal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {acting === 'override' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Apply override
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Overrides write to <code className="font-mono text-[10px] bg-slate-100 px-1 rounded">hr_fnf_override</code> with actor + timestamp.
              </p>
            </div>
          )}

          {/* Approval audit */}
          {(fnf.approved_by || fnf.disbursed_by) && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Audit trail</h3>
              <div className="space-y-1">
                {fnf.approved_by && (
                  <div className="text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    Approved by <b>{fnf.approved_by}</b> on {fnf.approved_at ? new Date(fnf.approved_at).toLocaleString() : ''}
                  </div>
                )}
                {fnf.disbursed_by && (
                  <div className="text-violet-700">
                    <Send className="w-3 h-3 inline mr-1" />
                    Disbursed by <b>{fnf.disbursed_by}</b> on {fnf.disbursed_at ? new Date(fnf.disbursed_at).toLocaleString() : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KV({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 text-xs">{k}</dt>
      <dd className={`font-mono text-xs ${highlight ? 'text-rose-700 font-bold' : 'text-slate-900'}`}>{v}</dd>
    </div>
  );
}

function CountdownBlock({ target }: { target: string }) {
  const d = daysUntil(target);
  if (d == null) return null;
  let label = `${d}d until payable_by`;
  let color = 'bg-white/50 text-emerald-900 border-emerald-300';
  if (d < 0) { label = `${Math.abs(d)}d OVERDUE`; color = 'bg-rose-50 text-rose-800 border-rose-300'; }
  else if (d <= 7) { color = 'bg-amber-50 text-amber-900 border-amber-300'; }
  return (
    <div className={`px-3 py-2 rounded-lg border ${color}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Pay by</div>
      <div className="text-sm font-mono">{target}</div>
      <div className="text-[11px] font-bold mt-0.5">{label}</div>
    </div>
  );
}
