'use client';

/**
 * ESS — Resignation Submission form.
 *
 * Files an hr_separation row with separation_type='resignation', status='draft'.
 * Validates that proposed LWD is at least (today + contractual notice period).
 * Soft confirmation before POST. On success → redirect to the case detail page.
 *
 * Compliance: no "advisor"/"adviser"/"advisory" wording anywhere. Tone is
 * matter-of-fact and neutral.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Send,
} from 'lucide-react';

// Reasons mirror Q1 of EXIT_INTERVIEW_QUESTIONS (multi_select primary_reason).
const REASON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'better_opportunity', label: 'Better opportunity elsewhere' },
  { value: 'compensation',       label: 'Compensation' },
  { value: 'work_life_balance',  label: 'Work–life balance' },
  { value: 'growth',             label: 'Career growth / learning' },
  { value: 'manager',            label: 'Manager / reporting relationship' },
  { value: 'role_fit',           label: 'Role fit' },
  { value: 'relocation',         label: 'Relocation' },
  { value: 'family',             label: 'Family reasons' },
  { value: 'health',             label: 'Health reasons' },
  { value: 'other',              label: 'Other' },
];

interface BootstrapMe {
  notice_period_days: number;
  full_name: string;
  active_separation_id: number | null;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function NewExitRequestPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<BootstrapMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resignationDate, setResignationDate] = useState(isoToday());
  const [proposedLwd, setProposedLwd] = useState('');
  const [reasonPrimary, setReasonPrimary] = useState('');
  const [reasonSecondary, setReasonSecondary] = useState('');
  const [notes, setNotes] = useState('');
  const [ack, setAck] = useState(false);

  useEffect(() => {
    fetch('/api/employee/hr/me/exit-request')
      .then((r) => r.json())
      .then((j) => {
        const np = Number(j?.notice_period_days ?? 30);
        setMeta({
          notice_period_days: np,
          full_name: j?.profile?.full_name ?? '',
          active_separation_id: j?.active?.id ?? null,
        });
        // Default proposed LWD = today + notice period
        setProposedLwd(addDays(isoToday(), np));
      })
      .finally(() => setLoading(false));
  }, []);

  // Guard: if a case is already active, bounce back to landing.
  useEffect(() => {
    if (meta?.active_separation_id) {
      router.replace('/employee/hr/me/exit-request');
    }
  }, [meta, router]);

  const minLwd = meta ? addDays(resignationDate, meta.notice_period_days) : isoToday();

  const validate = (): string | null => {
    if (!resignationDate) return 'Resignation date is required.';
    if (!proposedLwd) return 'Proposed last working day is required.';
    if (proposedLwd < isoToday()) return 'Last working day cannot be in the past.';
    if (!reasonPrimary) return 'Please select a primary reason.';
    if (!ack) return 'Please acknowledge the notice period and F&F timeline.';
    return null;
  };

  const openConfirm = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/employee/hr/me/exit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          separation_type: 'resignation',
          intent_date: resignationDate,
          requested_lwd: proposedLwd,
          reason_category: reasonPrimary,
          reason_notes: [reasonSecondary, notes].filter(Boolean).join('\n\n').trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || 'Could not submit. Please try again or contact HR.');
        setConfirmOpen(false);
        return;
      }
      const id = j?.separation?.id || j?.id;
      router.replace(id ? `/employee/hr/me/exit-request/${id}` : '/employee/hr/me/exit-request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !meta) {
    return (
      <div className="p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/employee/hr/me/exit-request" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to Exit Request
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Resignation Submission</h1>
        <p className="text-sm text-slate-600 mt-1">
          This formally notifies HR and your line manager. You can withdraw any time before F&amp;F is approved.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* Resignation date */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
              Resignation date
            </label>
            <input
              type="date"
              value={resignationDate}
              max={isoToday()}
              onChange={(e) => {
                setResignationDate(e.target.value);
                // bump proposed LWD if it now violates minimum
                const newMin = addDays(e.target.value, meta.notice_period_days);
                if (proposedLwd < newMin) setProposedLwd(newMin);
              }}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
            <div className="text-[11px] text-slate-500 mt-1">Defaults to today. Use an earlier date only if you discussed this with HR prior.</div>
          </div>

          {/* Proposed last working day */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
              Proposed last working day
            </label>
            <input
              type="date"
              value={proposedLwd}
              min={minLwd}
              onChange={(e) => setProposedLwd(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Earliest possible date based on your <b>{meta.notice_period_days}-day</b> notice period: <b className="font-mono">{minLwd}</b>.
              An earlier LWD may be granted only with a written notice-period waiver from your manager + HR.
            </div>
          </div>

          {/* Primary reason */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
              Primary reason for leaving
            </label>
            <select
              value={reasonPrimary}
              onChange={(e) => setReasonPrimary(e.target.value)}
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="">— select —</option>
              {REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500 mt-1">You will be able to elaborate in the confidential exit interview later.</div>
          </div>

          {/* Secondary reason */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
              Secondary reason <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={reasonSecondary}
              onChange={(e) => setReasonSecondary(e.target.value)}
              placeholder="A short phrase, e.g. 'pursuing higher studies'"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
              Notes for HR <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Anything else HR should know — handover plans, requests for flexibility, things you want kept confidential."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          {/* Acknowledgement */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                I understand my notice period is <b>{meta.notice_period_days} days</b> and that Full &amp; Final
                settlement will be paid within <b>45 days</b> of my last working day, subject to completion of
                the handover checklist and clearance from all departments.
              </span>
            </label>
          </div>

          {/* Submit row */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={openConfirm}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit resignation
            </button>
            <Link
              href="/employee/hr/me/exit-request"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900">Confirm submission</h2>
                <p className="text-sm text-slate-600 mt-2">
                  This will notify HR and your line manager. You can withdraw any time before F&amp;F is approved.
                </p>
                <ul className="mt-3 text-xs text-slate-700 space-y-1">
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" /> Resignation date: <b className="font-mono">{resignationDate}</b></li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" /> Proposed LWD: <b className="font-mono">{proposedLwd}</b></li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" /> Primary reason: <b>{REASON_OPTIONS.find((o) => o.value === reasonPrimary)?.label}</b></li>
                </ul>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Go back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm &amp; submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
