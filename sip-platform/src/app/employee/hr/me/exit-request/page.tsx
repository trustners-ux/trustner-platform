'use client';

/**
 * ESS — Exit Request landing page.
 *
 * If the signed-in employee has NO active separation case, this page shows
 * the "Initiate Resignation" CTA, what-to-expect explainer and a link to
 * the separation policy.
 *
 * If a case is open, it surfaces a status card (case_code, days to LWD,
 * status timeline), checklist progress bar, and a withdraw button
 * (disabled once F&F is approved / disbursed / closed).
 *
 * Tone: matter-of-fact, supportive, neutral. No "advisor"/"adviser"
 * language anywhere — Trustner is an MFD, not an investment adviser.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LogOut, Loader2, ArrowRight, ArrowLeft, AlertTriangle, Clock,
  CheckCircle2, FileText, ShieldCheck, BookOpen,
} from 'lucide-react';

interface ActiveSeparation {
  id: number;
  case_code: string;
  separation_type: string;
  intent_date: string;
  requested_lwd: string | null;
  approved_lwd: string | null;
  lwd: string | null;
  notice_period_days_contractual: number;
  notice_period_days_served: number;
  notice_period_days_shortfall: number;
  status: string;
  initiated_at: string;
}

interface ChecklistRollup {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
}

interface ExitRequestBundle {
  active: ActiveSeparation | null;
  notice_period_days: number;
  checklist?: ChecklistRollup;
  policy_url?: string | null;
}

// Status timeline — same order as canTransition() in lib/hr/separation-state-machine
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

const TERMINAL_STATUSES = new Set(['fnf_approved', 'fnf_disbursed', 'closed', 'withdrawn', 'rejected']);

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExitRequestLanding() {
  const [data, setData] = useState<ExitRequestBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetch('/api/employee/hr/me/exit-request')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const withdraw = async () => {
    if (!data?.active) return;
    const reason = window.prompt('Reason for withdrawing your resignation (this will be recorded):');
    if (!reason || !reason.trim()) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/employee/hr/me/exit-request/${data.active.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || 'Could not withdraw. Please contact HR at wecare@trustner.in.');
        return;
      }
      refresh();
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ─── EMPTY STATE — no active separation ──────────────────────────────
  if (!data.active) {
    return (
      <div className="p-8 max-w-4xl">
        <Link href="/employee/hr/me" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Dashboard
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-6 h-6 text-slate-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-slate-900">Exit Request</h1>
              <p className="text-sm text-slate-600 mt-1">
                If you have decided to move on from Trustner, this page is where you formally submit your resignation
                and track the separation process end-to-end.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Your notice period</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.notice_period_days} days</div>
              <div className="text-[11px] text-slate-500 mt-1">As per your appointment letter</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">F&amp;F settlement</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">Within 45 days</div>
              <div className="text-[11px] text-slate-500 mt-1">Of your last working day</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Withdrawal</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">Anytime</div>
              <div className="text-[11px] text-slate-500 mt-1">Until F&amp;F is approved</div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/employee/hr/me/exit-request/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
            >
              Initiate Resignation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            What happens after you submit
          </h2>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <b>Manager review.</b> Your line manager is notified and acknowledges your resignation. They may
                discuss your reasons with you — this is a conversation, not a negotiation requirement.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <b>Notice period &amp; clearance.</b> You serve your notice period (or any waiver agreed in writing).
                During this time you will complete a handover checklist — laptop return, knowledge transfer, NDA
                re-affirmation, and (if applicable) POSP/client-relationship handover.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <b>Full &amp; Final (F&amp;F).</b> HR and Finance compute your F&amp;F — prorated salary, leave encashment,
                gratuity (if eligible), reimbursements, less any recoveries (loans, asset shortfall, notice shortfall).
                The statement is shared with you before disbursement.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
              <div>
                <b>Relieving &amp; experience letters.</b> Issued once the handover checklist is complete and F&amp;F is
                disbursed. Both letters land in your <i>My Documents</i> section.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">5</span>
              <div>
                <b>Exit interview.</b> A short, confidential questionnaire. Your candid feedback helps us improve
                — answers are visible only to HR and the founders.
              </div>
            </li>
          </ol>
        </div>

        <div className="text-xs text-slate-500 leading-relaxed">
          Need help? Email <a href="mailto:wecare@trustner.in" className="text-brand font-semibold hover:underline">wecare@trustner.in</a>
          {' '}or raise a ticket via <Link href="/employee/hr/helpdesk" className="text-brand font-semibold hover:underline">Help Desk</Link>.
          {data.policy_url && (
            <> · <Link href={data.policy_url} className="text-brand font-semibold hover:underline">Read the separation policy</Link></>
          )}
        </div>
      </div>
    );
  }

  // ─── ACTIVE STATE — case in progress ─────────────────────────────────
  const sep = data.active;
  const today = new Date().toISOString().slice(0, 10);
  const effectiveLwd = sep.lwd || sep.approved_lwd || sep.requested_lwd;
  const daysToLwd = effectiveLwd ? daysBetween(today, effectiveLwd) : null;
  const currentIdx = TIMELINE.findIndex((t) => t.key === sep.status);
  const canWithdraw = !TERMINAL_STATUSES.has(sep.status);
  const checklistPct = data.checklist && data.checklist.total > 0
    ? Math.round((data.checklist.completed / data.checklist.total) * 100)
    : 0;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/employee/hr/me" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to My Dashboard
      </Link>

      {/* Status card */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Case · {sep.case_code}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Resignation in progress</h1>
            <div className="text-xs text-slate-500 mt-1">
              Submitted {fmtDate(sep.intent_date)} · {sep.separation_type.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Last working day</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{fmtDate(effectiveLwd)}</div>
            {daysToLwd !== null && daysToLwd >= 0 && (
              <div className="text-[11px] text-amber-700 mt-0.5 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysToLwd === 0 ? 'Today' : `${daysToLwd} day${daysToLwd === 1 ? '' : 's'} remaining`}
              </div>
            )}
            {daysToLwd !== null && daysToLwd < 0 && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                LWD passed {Math.abs(daysToLwd)} day{Math.abs(daysToLwd) === 1 ? '' : 's'} ago
              </div>
            )}
          </div>
        </div>

        {/* Notice period mini-stats */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Contractual notice</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">{sep.notice_period_days_contractual} d</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Served</div>
            <div className="text-base font-extrabold text-emerald-700 mt-0.5">{sep.notice_period_days_served} d</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Shortfall</div>
            <div className={`text-base font-extrabold mt-0.5 ${sep.notice_period_days_shortfall > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {sep.notice_period_days_shortfall} d
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Status</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 capitalize">
              {sep.status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-5 flex gap-2 flex-wrap">
          <Link
            href={`/employee/hr/me/exit-request/${sep.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
          >
            Open case <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={withdraw}
            disabled={!canWithdraw || withdrawing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title={canWithdraw ? 'Withdraw your resignation' : 'F&F is already approved — please contact HR'}
          >
            {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Withdraw resignation
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-slate-700" />
          Status timeline
        </h2>
        <div className="relative">
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
      </div>

      {/* Checklist progress */}
      {data.checklist && data.checklist.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              Handover checklist
            </h2>
            <div className="text-xs text-slate-500">
              {data.checklist.completed} / {data.checklist.total} complete
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${checklistPct}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {checklistPct}% done · {data.checklist.in_progress} in progress · {data.checklist.not_started} not started
          </div>
          <Link
            href={`/employee/hr/me/exit-request/${sep.id}#checklist`}
            className="inline-flex items-center gap-1 mt-3 text-xs text-brand font-semibold hover:underline"
          >
            Update my checklist items <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="text-xs text-slate-500 leading-relaxed">
        <FileText className="w-3 h-3 inline mr-1" />
        All letters and the F&amp;F statement will appear in <Link href="/employee/hr/me/documents" className="text-brand font-semibold hover:underline">My Documents</Link> as they are issued.
      </div>
    </div>
  );
}
