'use client';

/**
 * ESS — Resignation case detail (employee view).
 *
 * Read-mostly. Surfaces:
 *   • Status timeline
 *   • Handover checklist — employee-owned items are editable (laptop returned,
 *     KT done, NDA reaffirmed). HR-owned items show as read-only.
 *   • Letters — links to issued letters (resignation_acceptance / relieving /
 *     experience), download via /api/employee/hr/letters/:id.
 *   • F&F statement — visible read-only once status >= fnf_approved.
 *   • Exit interview — form once status >= clearance_pending.
 *   • Withdraw button — disabled if status in (fnf_approved, fnf_disbursed,
 *     closed, withdrawn, rejected).
 *
 * Compliance: no "advisor"/"adviser"/"advisory" wording anywhere.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Clock, FileText,
  Wallet, ShieldCheck, ClipboardCheck, Send, Download, MessageSquare,
} from 'lucide-react';

interface SeparationDetail {
  id: number;
  case_code: string;
  separation_type: string;
  reason_category: string | null;
  reason_notes: string | null;
  intent_date: string;
  requested_lwd: string | null;
  approved_lwd: string | null;
  lwd: string | null;
  notice_period_days_contractual: number;
  notice_period_days_served: number;
  notice_period_days_waived: number;
  notice_period_days_shortfall: number;
  status: string;
  initiated_at: string;
  bonus_clause_present: boolean;
  bonus_amount: number;
}

interface ChecklistItem {
  id: number;
  item_code: string;
  label: string;
  owner: 'employee' | 'manager' | 'hr' | 'finance' | 'it' | 'compliance';
  status: 'not_started' | 'in_progress' | 'completed' | 'na' | 'waived';
  required: boolean;
  notes: string | null;
  proof_blob_url: string | null;
  recovery_amount: number | null;
  completed_at: string | null;
}

interface IssuedLetter {
  id: number;
  letter_type: string;
  serial_number: string | null;
  status: string;
  generated_at: string;
}

interface FnFView {
  status: 'computed' | 'approved' | 'disbursed';
  fnf_month: string;
  paid_days: number;
  lop_days: number;
  el_balance_days: number;
  el_encash_amount: number;
  gratuity_amount: number;
  reimbursement_pending: number;
  notice_shortfall_recovery: number;
  loan_recovery: number;
  asset_recovery: number;
  other_recovery: number;
  gross_payable: number;
  net_payable: number;
  payable_by_date: string;
  pdf_url?: string | null;
}

interface CaseBundle {
  separation: SeparationDetail;
  checklist: ChecklistItem[];
  letters: IssuedLetter[];
  fnf: FnFView | null;
  exit_interview: { id: number; submitted_at: string } | null;
}

// Mirror lib/hr/separation-state-machine ordering
const TIMELINE: Array<{ key: string; label: string }> = [
  { key: 'draft',              label: 'Submitted' },
  { key: 'manager_review',     label: 'Manager review' },
  { key: 'notice_active',      label: 'Notice period' },
  { key: 'clearance_pending',  label: 'Clearance' },
  { key: 'fnf_pending',        label: 'F&F computation' },
  { key: 'fnf_approved',       label: 'F&F approved' },
  { key: 'fnf_disbursed',      label: 'F&F disbursed' },
  { key: 'closed',             label: 'Closed' },
];

const TERMINAL = new Set(['fnf_approved', 'fnf_disbursed', 'closed', 'withdrawn', 'rejected']);

// Status >= clearance_pending means we expose the exit-interview form.
const STATUS_ORDER: Record<string, number> = {
  draft: 0, manager_review: 1, notice_active: 2, clearance_pending: 3,
  fnf_pending: 4, fnf_approved: 5, fnf_disbursed: 6, closed: 7,
  withdrawn: -1, rejected: -1,
};

function inr(v: number | null | undefined) {
  if (v == null) return '—';
  return '₹ ' + Math.round(Number(v)).toLocaleString('en-IN');
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExitCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [data, setData] = useState<CaseBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/employee/hr/me/exit-request/${caseId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (caseId) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [caseId]);

  const updateChecklistItem = async (itemId: number, patch: Partial<Pick<ChecklistItem, 'status' | 'notes'>>) => {
    setSavingItem(itemId);
    try {
      const res = await fetch(`/api/employee/hr/me/exit-request/${caseId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'Could not save. Please retry.');
      }
      refresh();
    } finally {
      setSavingItem(null);
    }
  };

  const withdraw = async () => {
    if (!data) return;
    const reason = window.prompt('Reason for withdrawing your resignation (this will be recorded):');
    if (!reason || !reason.trim()) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/employee/hr/me/exit-request/${caseId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || 'Could not withdraw. Please contact HR at wecare@trustner.in.');
        return;
      }
      router.replace('/employee/hr/me/exit-request');
    } finally {
      setWithdrawing(false);
    }
  };

  const currentIdx = useMemo(() => {
    if (!data) return -1;
    return TIMELINE.findIndex((t) => t.key === data.separation.status);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const sep = data.separation;
  const canWithdraw = !TERMINAL.has(sep.status);
  const employeeItems = data.checklist.filter((i) => i.owner === 'employee');
  const otherItems = data.checklist.filter((i) => i.owner !== 'employee');
  const statusRank = STATUS_ORDER[sep.status] ?? -1;
  const showFnF = statusRank >= STATUS_ORDER['fnf_approved'];
  const showInterview = statusRank >= STATUS_ORDER['clearance_pending'];

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/employee/hr/me/exit-request" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Exit Request
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Case · {sep.case_code}</div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1 capitalize">
              {sep.separation_type.replace(/_/g, ' ')}
            </h1>
            <div className="text-xs text-slate-500 mt-1">
              Submitted {fmtDate(sep.intent_date)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Status</div>
            <div className="text-base font-extrabold text-slate-900 mt-1 capitalize">
              {sep.status.replace(/_/g, ' ')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              LWD: {fmtDate(sep.lwd || sep.approved_lwd || sep.requested_lwd)}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 relative">
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
          <div
            className="absolute top-3 left-3 h-0.5 bg-emerald-500"
            style={{
              width: currentIdx >= 0
                ? `calc(${(currentIdx / Math.max(TIMELINE.length - 1, 1)) * 100}% - 12px)`
                : '0%',
            }}
          />
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${TIMELINE.length}, minmax(0, 1fr))` }}>
            {TIMELINE.map((step, i) => {
              const isDone = currentIdx > i;
              const isActive = currentIdx === i;
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isDone ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive ? 'bg-white border-emerald-500 text-emerald-700'
                      : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div className={`mt-2 text-[10px] text-center leading-tight px-1 ${isActive ? 'text-emerald-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notice period rollup */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Contractual</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">{sep.notice_period_days_contractual} d</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Served</div>
            <div className="text-base font-extrabold text-emerald-700 mt-0.5">{sep.notice_period_days_served} d</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Waived</div>
            <div className="text-base font-extrabold text-slate-700 mt-0.5">{sep.notice_period_days_waived} d</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Shortfall</div>
            <div className={`text-base font-extrabold mt-0.5 ${sep.notice_period_days_shortfall > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {sep.notice_period_days_shortfall} d
            </div>
          </div>
        </div>

        {/* Withdraw */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={withdraw}
            disabled={!canWithdraw || withdrawing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title={canWithdraw ? 'Withdraw your resignation' : 'F&F is already approved or case is closed — please contact HR'}
          >
            {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Withdraw resignation
          </button>
        </div>
      </div>

      {/* Reason — read-only echo */}
      {(sep.reason_category || sep.reason_notes) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            What you told us
          </h2>
          {sep.reason_category && (
            <div className="text-xs text-slate-600">
              Primary reason: <b className="capitalize">{sep.reason_category.replace(/_/g, ' ')}</b>
            </div>
          )}
          {sep.reason_notes && (
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-200 p-3">
              {sep.reason_notes}
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      <div id="checklist" className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-slate-700" />
          Handover checklist
        </h2>

        {employeeItems.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              Your items
            </div>
            <div className="space-y-2 mb-5">
              {employeeItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      {item.label}
                      {item.required && <span className="ml-2 text-[10px] text-rose-600 font-bold">REQUIRED</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.item_code}</div>
                    {item.notes && <div className="text-xs text-slate-600 mt-1">{item.notes}</div>}
                  </div>
                  <select
                    value={item.status}
                    disabled={savingItem === item.id || !canWithdraw && item.status === 'completed'}
                    onChange={(e) => updateChecklistItem(item.id, { status: e.target.value as ChecklistItem['status'] })}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="na">N/A</option>
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {otherItems.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              Other departments
            </div>
            <div className="space-y-1.5">
              {otherItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    <span className="text-slate-500 ml-2">· owned by <span className="capitalize">{item.owner}</span></span>
                  </div>
                  <div className={`text-[10px] uppercase font-bold ${
                    item.status === 'completed' ? 'text-emerald-700'
                    : item.status === 'in_progress' ? 'text-amber-700'
                    : 'text-slate-500'
                  }`}>
                    {item.status.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {data.checklist.length === 0 && (
          <div className="text-xs text-slate-500">Checklist will appear once HR opens it.</div>
        )}
      </div>

      {/* Letters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          Letters
        </h2>
        {data.letters.length === 0 ? (
          <div className="text-xs text-slate-500">
            No letters issued yet. Resignation acceptance is typically issued after manager review.
            Relieving and experience letters are issued once handover is complete and F&amp;F is disbursed.
          </div>
        ) : (
          <div className="space-y-1.5">
            {data.letters.map((l) => (
              <a
                key={l.id}
                href={`/api/employee/hr/letters/${l.id}?pdf=1`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-between gap-2 p-2.5 rounded hover:bg-slate-50 border border-slate-100"
              >
                <div className="text-xs">
                  <div className="font-bold text-slate-900 capitalize">
                    {l.letter_type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-slate-500 font-mono">{l.serial_number || '—'} · {fmtDate(l.generated_at)}</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* F&F — read-only once approved */}
      {showFnF && data.fnf && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              Full &amp; Final settlement
            </h2>
            <div className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {data.fnf.status}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">F&F month</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">{data.fnf.fnf_month}</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Paid days</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">{data.fnf.paid_days}</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">EL balance</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">{data.fnf.el_balance_days} d</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Payable by</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">{fmtDate(data.fnf.payable_by_date)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-3 py-2 text-slate-700">EL encashment</td><td className="px-3 py-2 text-right font-mono">{inr(data.fnf.el_encash_amount)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Gratuity</td><td className="px-3 py-2 text-right font-mono">{inr(data.fnf.gratuity_amount)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Reimbursements pending</td><td className="px-3 py-2 text-right font-mono">{inr(data.fnf.reimbursement_pending)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Loan recovery</td><td className="px-3 py-2 text-right font-mono text-rose-700">{inr(-data.fnf.loan_recovery)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Notice shortfall recovery</td><td className="px-3 py-2 text-right font-mono text-rose-700">{inr(-data.fnf.notice_shortfall_recovery)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Asset recovery</td><td className="px-3 py-2 text-right font-mono text-rose-700">{inr(-data.fnf.asset_recovery)}</td></tr>
                <tr><td className="px-3 py-2 text-slate-700">Other recovery</td><td className="px-3 py-2 text-right font-mono text-rose-700">{inr(-data.fnf.other_recovery)}</td></tr>
                <tr className="bg-slate-50"><td className="px-3 py-2 font-bold text-slate-900">Gross payable</td><td className="px-3 py-2 text-right font-mono font-bold">{inr(data.fnf.gross_payable)}</td></tr>
                <tr className="bg-emerald-50"><td className="px-3 py-2 font-extrabold text-emerald-900">Net payable</td><td className="px-3 py-2 text-right font-mono font-extrabold text-emerald-900">{inr(data.fnf.net_payable)}</td></tr>
              </tbody>
            </table>
          </div>

          <a
            href={`/api/employee/hr/me/exit-request/${caseId}/fnf/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand font-semibold hover:underline"
          >
            <Download className="w-3 h-3" /> Download F&amp;F statement (PDF)
          </a>
        </div>
      )}

      {/* Exit interview */}
      {showInterview && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-600" />
            Exit interview
          </h2>
          {data.exit_interview ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900">
                Thank you — you submitted the exit interview on {fmtDate(data.exit_interview.submitted_at)}.
                Your answers are visible only to HR and the founders.
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-3">
                A short, confidential questionnaire. Your candid feedback helps us improve. Answers stay with HR and the founders.
              </p>
              <Link
                href={`/employee/hr/me/exit-request/${caseId}/interview`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
              >
                <Send className="w-4 h-4" />
                Start exit interview
              </Link>
            </>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500 leading-relaxed">
        Questions about your case? Email <a href="mailto:wecare@trustner.in" className="text-brand font-semibold hover:underline">wecare@trustner.in</a>
        {' '}or raise a ticket via <Link href="/employee/hr/helpdesk" className="text-brand font-semibold hover:underline">Help Desk</Link>.
      </div>
    </div>
  );
}
