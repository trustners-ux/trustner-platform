'use client';

/**
 * ESS — Performance Improvement Plan (PIP) dashboard.
 *
 * Read-only view for the employee. Shows:
 *   • Opening context (date, manager, rating that triggered the PIP)
 *   • Expected outcomes / milestones with target dates and status
 *   • 30 / 60 / 90 day review notes (as your manager records them)
 *   • Current outcome status
 *
 * The employee CANNOT change milestone status, outcome, or notes from this
 * page — that is the manager's tool. This page exists so the employee has
 * a transparent, always-on view of what's expected and where they stand.
 *
 * If no active PIP exists for the signed-in employee, the page renders a
 * calm "no PIP on file" empty state.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, Loader2, Calendar, CheckCircle2, Clock,
  XCircle, MessageSquare,
} from 'lucide-react';

interface PipMilestone {
  milestone: string;
  target_date: string;
  status: 'open' | 'done' | 'missed';
}

interface PipBundle {
  pip: {
    id: number;
    cycle_code: string | null;
    opened_at: string;
    manager_email: string | null;
    expected_outcomes: PipMilestone[];
    m30_review_at: string | null;
    m30_note: string | null;
    m60_review_at: string | null;
    m60_note: string | null;
    m90_review_at: string | null;
    m90_note: string | null;
    outcome: 'open' | 'succeeded' | 'extended' | 'failed';
    closed_at: string | null;
    rating: {
      final_performance_rating: number;
      pip_required: boolean;
    } | null;
  } | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const OUTCOME_LABEL: Record<string, string> = {
  open: 'In progress',
  succeeded: 'Successfully completed',
  extended: 'Extended',
  failed: 'Did not meet expectations',
};

const OUTCOME_CLS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-900 border-amber-200',
  succeeded: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  extended: 'bg-blue-50 text-blue-900 border-blue-200',
  failed: 'bg-rose-50 text-rose-900 border-rose-200',
};

function MilestoneRow({ m, idx }: { m: PipMilestone; idx: number }) {
  const Icon = m.status === 'done' ? CheckCircle2 : m.status === 'missed' ? XCircle : Clock;
  const cls = m.status === 'done' ? 'text-emerald-700' : m.status === 'missed' ? 'text-rose-700' : 'text-amber-700';
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-900">{m.milestone}</div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Target {fmtDate(m.target_date)}</span>
          <span className={`inline-flex items-center gap-1 font-bold uppercase ${cls}`}>
            <Icon className="w-3 h-3" /> {m.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({
  title, when, note,
}: { title: string; when: string | null; note: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title}</div>
        <div className="text-[10px] text-slate-500">{when ? fmtDate(when) : 'Not yet reviewed'}</div>
      </div>
      {note ? (
        <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{note}</div>
      ) : (
        <div className="text-xs text-slate-400 italic">Your manager hasn&apos;t added a note yet.</div>
      )}
    </div>
  );
}

export default function MyPipPage() {
  const [data, setData] = useState<PipBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employee/hr/me/appraisal/pip')
      .then(async (r) => {
        if (!r.ok) return { pip: null };
        return r.json();
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!data.pip) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <h1 className="text-base font-bold text-slate-900">No active PIP on file</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            There&apos;s no Performance Improvement Plan open for you. If your manager opens one in
            future, it will appear here with milestones and review notes.
          </p>
        </div>
      </div>
    );
  }

  const p = data.pip;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-700" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            {p.cycle_code ? `Cycle ${p.cycle_code} · ` : ''}Performance Improvement Plan
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">My PIP</h1>
          <p className="text-sm text-slate-600 mt-1">
            A PIP is a structured 90-day plan to close a specific performance gap. It is not a
            decision about your future — it&apos;s a chance to demonstrate the change. Your manager owns
            the assessment; this page is your transparent view.
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border-2 ${OUTCOME_CLS[p.outcome]} p-5 mb-6`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Current status</div>
            <div className="text-xl font-extrabold mt-0.5">{OUTCOME_LABEL[p.outcome]}</div>
            <div className="text-xs mt-1 opacity-80">
              Opened {fmtDate(p.opened_at)}{p.closed_at ? ` · closed ${fmtDate(p.closed_at)}` : ''}
            </div>
          </div>
          {p.manager_email && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Owning manager</div>
              <div className="text-sm font-bold mt-0.5">{p.manager_email}</div>
            </div>
          )}
        </div>
      </div>

      {/* Expected outcomes / milestones */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-slate-700" />
          Expected outcomes
        </h2>
        <p className="text-xs text-slate-600 mb-3">
          The specific, measurable things you and your manager agreed would close the gap.
        </p>
        {p.expected_outcomes && p.expected_outcomes.length > 0 ? (
          <div>
            {p.expected_outcomes.map((m, i) => <MilestoneRow key={i} m={m} idx={i} />)}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No outcomes recorded yet.</div>
        )}
      </div>

      {/* 30 / 60 / 90 reviews */}
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
        <MessageSquare className="w-3 h-3" />
        Manager review notes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ReviewBlock title="30-day review" when={p.m30_review_at} note={p.m30_note} />
        <ReviewBlock title="60-day review" when={p.m60_review_at} note={p.m60_note} />
        <ReviewBlock title="90-day review" when={p.m90_review_at} note={p.m90_note} />
      </div>

      <div className="text-xs text-slate-500 leading-relaxed">
        Questions, concerns, or need support? Reach out to your manager directly or HR at{' '}
        <a href="mailto:wecare@trustner.in" className="text-brand font-semibold hover:underline">wecare@trustner.in</a>.
      </div>
    </div>
  );
}
