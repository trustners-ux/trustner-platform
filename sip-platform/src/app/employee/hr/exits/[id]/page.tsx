'use client';

/**
 * Phase 8 — Separation case detail page.
 *
 * Header + tabs (Overview / Checklist / F&F / Letters / Interview / History) +
 * sidebar of quick actions gated by status.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  LogOut, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Send, FileText,
  Calculator, ShieldAlert, ExternalLink, ClipboardCheck, ScrollText, MessagesSquare, History,
} from 'lucide-react';
import {
  canTransition, statusLabel, type SeparationStatus,
} from '@/lib/hr/separation-state';

interface CaseDetail {
  id: number;
  case_code: string;
  employee_id: number;
  employee_name: string | null;
  employee_code: string | null;
  employee_photo_url: string | null;
  separation_type: string;
  status: SeparationStatus;
  reason_category: string | null;
  reason_notes: string | null;
  intent_date: string;
  requested_lwd: string | null;
  approved_lwd: string | null;
  lwd: string | null;
  separation_effective_date: string | null;
  notice_period_days_contractual: number;
  notice_period_days_served: number;
  notice_period_days_waived: number;
  notice_period_days_shortfall: number;
  manager_signoff_by: string | null;
  manager_signoff_at: string | null;
  hr_signoff_by: string | null;
  hr_signoff_at: string | null;
  finance_signoff_by: string | null;
  finance_signoff_at: string | null;
  ceo_signoff_by: string | null;
  ceo_signoff_at: string | null;
  bonus_clause_present: boolean;
  bonus_amount: number;
  bonus_notes: string | null;
  fnf_id: number | null;
  fnf_net_payable: number | null;
  posp_handover_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: number;
  actor: string;
  from_status: SeparationStatus | null;
  to_status: SeparationStatus | null;
  note: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<SeparationStatus, string> = {
  draft:              'bg-slate-100 text-slate-700',
  manager_review:     'bg-amber-100 text-amber-800',
  notice_active:      'bg-blue-100 text-blue-800',
  clearance_pending:  'bg-violet-100 text-violet-800',
  fnf_pending:        'bg-orange-100 text-orange-800',
  fnf_approved:       'bg-emerald-100 text-emerald-800',
  fnf_disbursed:      'bg-emerald-200 text-emerald-900',
  closed:             'bg-slate-200 text-slate-700',
  withdrawn:          'bg-slate-200 text-slate-600',
  rejected:           'bg-rose-100 text-rose-800',
};

const TIMELINE_STEPS: { status: SeparationStatus; label: string }[] = [
  { status: 'draft',             label: 'Resigned / Initiated' },
  { status: 'manager_review',    label: 'Manager Review' },
  { status: 'notice_active',     label: 'Notice Period' },
  { status: 'clearance_pending', label: 'Clearance' },
  { status: 'fnf_pending',       label: 'F&F Computed' },
  { status: 'fnf_approved',      label: 'F&F Approved' },
  { status: 'fnf_disbursed',     label: 'Disbursed' },
  { status: 'closed',            label: 'Closed' },
];

function stepIndex(s: SeparationStatus): number {
  const i = TIMELINE_STEPS.findIndex((t) => t.status === s);
  return i;
}

function inr(v: number | null | undefined): string {
  if (v == null) return '—';
  return '₹ ' + Math.round(v).toLocaleString('en-IN');
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function SeparationDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<CaseDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/employee/hr/exits/${id}`).then((r) => r.json()),
      fetch(`/api/employee/hr/exits/${id}/history`).then((r) => r.ok ? r.json() : { rows: [] }).catch(() => ({ rows: [] })),
    ])
      .then(([detail, hist]) => {
        setData(detail.row || detail);
        setHistory(hist.rows || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const transition = async (to: SeparationStatus) => {
    if (!data) return;
    setActing(to);
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || `Failed: ${to}`); return; }
      load();
    } finally {
      setActing(null);
    }
  };

  const runFnf = async () => {
    setActing('fnf');
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/fnf/compute`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'F&F compute failed'); return; }
      load();
    } finally { setActing(null); }
  };

  const issueLetter = async (type: 'resignation_acceptance' | 'termination' | 'relieving' | 'experience') => {
    setActing(`letter_${type}`);
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/letters/${type}`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `Letter ${type} failed`);
        return;
      }
      load();
    } finally { setActing(null); }
  };

  const withdraw = async () => {
    if (!confirm('Withdraw this separation case? This is terminal.')) return;
    await transition('withdrawn');
  };

  // Compute "next allowed step" so action buttons gate correctly.
  const nextSteps = useMemo<SeparationStatus[]>(() => {
    if (!data) return [];
    const all: SeparationStatus[] = ['manager_review', 'notice_active', 'clearance_pending', 'fnf_pending', 'fnf_approved', 'fnf_disbursed', 'closed'];
    return all.filter((t) => canTransition(data.status, t));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Link href="/employee/hr/exits" className="text-xs text-slate-500 hover:text-slate-900">← Back</Link>
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-800">
          Could not load case: {error || 'not found'}
        </div>
      </div>
    );
  }

  const currentStep = stepIndex(data.status);
  const ageDays = daysSince(data.intent_date);

  return (
    <div className="p-8 max-w-7xl">
      <Link href="/employee/hr/exits" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Exits
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">{data.case_code}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLOR[data.status]}`}>
                {statusLabel(data.status)}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-700">
              <span className="font-medium">{data.employee_name || `#${data.employee_id}`}</span>
              {data.employee_code && <span className="text-slate-500 font-mono text-xs ml-2">({data.employee_code})</span>}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {data.separation_type.replace(/_/g, ' ')} · raised {ageDays}d ago · LWD {data.lwd || data.approved_lwd || data.requested_lwd || '—'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">F&amp;F Net Payable</div>
          <div className="text-2xl font-extrabold text-slate-900">{inr(data.fnf_net_payable)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-4 flex-wrap">
        {[
          { k: 'overview', label: 'Overview', icon: ClipboardCheck, href: null },
          { k: 'checklist', label: 'Checklist', icon: ClipboardCheck, href: `/employee/hr/exits/${id}/checklist` },
          { k: 'fnf', label: 'F&F', icon: Calculator, href: `/employee/hr/exits/${id}/fnf` },
          { k: 'letters', label: 'Letters', icon: ScrollText, href: null },
          { k: 'interview', label: 'Interview', icon: MessagesSquare, href: `/employee/hr/exits/${id}/interview` },
          { k: 'history', label: 'History', icon: History, href: null },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.k;
          if (t.href) {
            return (
              <Link
                key={t.k}
                href={t.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 -mb-px"
              >
                <Icon className="w-4 h-4" /> {t.label}
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            );
          }
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as 'overview' | 'history')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                active ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {tab === 'overview' && (
            <>
              {/* Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Lifecycle</h2>
                <div className="flex items-center justify-between">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = currentStep >= i;
                    const isCurr = currentStep === i;
                    return (
                      <div key={step.status} className="flex-1 flex flex-col items-center min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isCurr ? 'border-brand bg-brand text-white' :
                            done ? 'border-emerald-500 bg-emerald-500 text-white' :
                            'border-slate-300 bg-white text-slate-400'
                          }`}
                        >
                          {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <div className={`mt-1 text-[10px] text-center leading-tight px-1 ${isCurr ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                          {step.label}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`absolute h-0.5 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key dates + sign-offs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Key dates</h3>
                  <dl className="space-y-2 text-sm">
                    <Row k="Intent / resignation" v={data.intent_date} />
                    <Row k="Requested LWD" v={data.requested_lwd} />
                    <Row k="Approved LWD" v={data.approved_lwd} />
                    <Row k="Actual LWD" v={data.lwd} />
                    <Row k="Notice (contract)" v={`${data.notice_period_days_contractual}d`} />
                    <Row k="Notice served" v={`${data.notice_period_days_served}d`} />
                    <Row k="Notice waived" v={`${data.notice_period_days_waived}d`} />
                    <Row k="Notice shortfall" v={`${data.notice_period_days_shortfall}d`} highlight={data.notice_period_days_shortfall > 0 ? 'amber' : null} />
                  </dl>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Sign-offs</h3>
                  <dl className="space-y-2 text-sm">
                    <SignoffRow label="Manager" by={data.manager_signoff_by} at={data.manager_signoff_at} />
                    <SignoffRow label="HR" by={data.hr_signoff_by} at={data.hr_signoff_at} />
                    <SignoffRow label="Finance" by={data.finance_signoff_by} at={data.finance_signoff_at} />
                    <SignoffRow label="CEO" by={data.ceo_signoff_by} at={data.ceo_signoff_at} />
                  </dl>
                  {data.bonus_clause_present && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[12px]">
                      <div className="flex items-center gap-1 text-amber-700 font-bold mb-1">
                        <AlertTriangle className="w-3 h-3" /> Bonus clawback active
                      </div>
                      <div className="text-slate-600">
                        {inr(data.bonus_amount)} {data.bonus_notes ? `· ${data.bonus_notes}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">When</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actor</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Transition</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-slate-100">
                      <td className="px-4 py-2 text-xs font-mono text-slate-600">{new Date(h.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs text-slate-700">{h.actor}</td>
                      <td className="px-4 py-2 text-xs">
                        {h.from_status ? statusLabel(h.from_status) : '—'} → {h.to_status ? statusLabel(h.to_status) : '—'}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">{h.note || '—'}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No history entries.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Transition actions */}
          {nextSteps.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Advance status</h3>
              <div className="space-y-2">
                {nextSteps.filter((s) => s !== 'withdrawn' && s !== 'rejected').map((s) => {
                  const gateOk = !(s === 'fnf_approved' && !data.fnf_id);
                  return (
                    <button
                      key={s}
                      onClick={() => transition(s)}
                      disabled={acting === s || !gateOk}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {acting === s && <Loader2 className="w-3 h-3 animate-spin" />}
                      → {statusLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick actions</h3>
            <div className="space-y-2">
              <button
                onClick={runFnf}
                disabled={acting === 'fnf' || (data.status !== 'clearance_pending' && data.status !== 'fnf_pending' && data.status !== 'fnf_approved')}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                title="Available from Clearance Pending onwards"
              >
                {acting === 'fnf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />}
                Run F&amp;F Calculation
              </button>

              <a
                href={`/api/employee/hr/exits/${id}/fnf/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!data.fnf_id}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
                  data.fnf_id ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                <FileText className="w-3 h-3" /> F&amp;F PDF
              </a>

              <button
                onClick={() => issueLetter('relieving')}
                disabled={data.status !== 'fnf_disbursed' && data.status !== 'closed' || !data.posp_handover_complete || acting === 'letter_relieving'}
                title={!data.posp_handover_complete ? 'POSP handover not complete' : data.status !== 'fnf_disbursed' && data.status !== 'closed' ? 'Available after F&F disbursal' : ''}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acting === 'letter_relieving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Issue Relieving Letter
              </button>
              {!data.posp_handover_complete && (
                <div className="text-[10px] text-amber-700 flex items-start gap-1 mt-1">
                  <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" />
                  Relieving blocked — POSP handover not complete.
                </div>
              )}

              <button
                onClick={() => issueLetter('experience')}
                disabled={data.status !== 'fnf_disbursed' && data.status !== 'closed' || acting === 'letter_experience'}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 disabled:opacity-50"
              >
                {acting === 'letter_experience' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                Issue Experience Letter
              </button>

              <button
                onClick={withdraw}
                disabled={data.status === 'closed' || data.status === 'withdrawn' || data.status === 'rejected' || data.status === 'fnf_approved' || data.status === 'fnf_disbursed'}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 disabled:opacity-50"
              >
                Withdraw case
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string | null | undefined; highlight?: 'amber' | null }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`font-mono text-xs ${highlight === 'amber' ? 'text-amber-700 font-bold' : 'text-slate-900'}`}>{v || '—'}</dd>
    </div>
  );
}

function SignoffRow({ label, by, at }: { label: string; by: string | null; at: string | null }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-xs">
        {by ? (
          <span className="text-emerald-700 font-medium">{by} · {at ? new Date(at).toLocaleDateString() : ''}</span>
        ) : (
          <span className="text-slate-400">Pending</span>
        )}
      </dd>
    </div>
  );
}
