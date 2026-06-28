'use client';

/**
 * ESS — Mid-year self check-in.
 *
 * Per-goal: actual progress value + a short reflection note (max ~600 char).
 * This is NOT the final self-review — it's a course-correction touchpoint.
 *
 * Save Draft → PATCH /api/employee/hr/me/appraisal/midyear  status: draft
 * Submit     → PATCH /api/employee/hr/me/appraisal/midyear  status: submitted
 *
 * Both calls degrade gracefully if the endpoint isn't yet wired — the page
 * shows a friendly error and the user can copy their notes elsewhere.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass, ArrowLeft, Loader2, Save, Send, CheckCircle2, AlertTriangle,
} from 'lucide-react';

interface Goal {
  id: number;
  kra_category: 'business' | 'operational' | 'behavioural' | 'learning' | 'compliance';
  goal_title: string;
  goal_description: string | null;
  weight: number;
  target_value: number | null;
  target_unit: string | null;
  midyear_actual: number | null;
  midyear_note: string | null;
}

interface Bundle {
  cycle: { id: number; cycle_code: string; status: string; midyear_due_date: string | null } | null;
  goals: Goal[];
}

const CATEGORY_LABEL: Record<Goal['kra_category'], string> = {
  business: 'Business',
  operational: 'Operational',
  behavioural: 'Behavioural',
  learning: 'Learning',
  compliance: 'Compliance',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MidYearForm() {
  const [data, setData] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { actual: string; note: string }>>({});
  const [saving, setSaving] = useState<'idle' | 'draft' | 'submit'>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/employee/hr/me/appraisal/midyear')
      .then(async (r) => {
        if (!r.ok) {
          setData({ cycle: null, goals: [] });
          return;
        }
        return r.json();
      })
      .then((j) => {
        if (j) {
          setData(j);
          const seed: Record<number, { actual: string; note: string }> = {};
          for (const g of j.goals ?? []) {
            seed[g.id] = {
              actual: g.midyear_actual != null ? String(g.midyear_actual) : '',
              note: g.midyear_note ?? '',
            };
          }
          setDrafts(seed);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (gid: number, field: 'actual' | 'note', val: string) => {
    setDrafts((d) => ({ ...d, [gid]: { ...d[gid], [field]: val } }));
  };

  const save = async (action: 'draft' | 'submit') => {
    if (!data?.cycle) return;
    setSaving(action);
    setMsg(null);
    try {
      const payload = {
        cycle_id: data.cycle.id,
        action,
        goals: Object.entries(drafts).map(([id, v]) => ({
          goal_id: Number(id),
          midyear_actual: v.actual.trim() === '' ? null : Number(v.actual),
          midyear_note: v.note.trim() || null,
        })),
      };
      const res = await fetch('/api/employee/hr/me/appraisal/midyear', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(j.error || 'Could not save. Please retry.');
        return;
      }
      if (action === 'submit') {
        setSubmitted(true);
      } else {
        setMsg('Draft saved.');
      }
    } finally {
      setSaving('idle');
    }
  };

  if (loading || !data) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  // Not open
  if (!data.cycle || data.cycle.status !== 'mid_year') {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-extrabold text-amber-900">Mid-year window is not open</h1>
            <p className="text-sm text-amber-900 mt-1">
              The mid-year check-in is open for a fixed window. You&apos;ll be notified when it opens —
              check the appraisal hub for the latest status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
        </Link>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 flex items-start gap-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-700 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-extrabold text-emerald-900">Mid-year check-in submitted</h1>
            <p className="text-sm text-emerald-900 mt-1">
              Thanks for the update. Your manager has been notified and may reach out for a brief
              conversation. You can revisit this any time before the cycle moves to self-review.
            </p>
            <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-800 font-bold underline">
              Return to appraisal hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Compass className="w-6 h-6 text-amber-700" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Cycle {data.cycle.cycle_code} · mid-year check-in
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Mid-year self check-in</h1>
          <p className="text-sm text-slate-600 mt-1">
            Update the actual progress so far on each goal and add a short reflection.
            This is a course-correction conversation, not the final review. Due by{' '}
            <b>{fmtDate(data.cycle.midyear_due_date)}</b>.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {data.goals.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {CATEGORY_LABEL[g.kra_category]} · weight {Number(g.weight).toFixed(0)}%
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">{g.goal_title}</div>
                {g.goal_description && (
                  <div className="text-xs text-slate-600 mt-1">{g.goal_description}</div>
                )}
                {g.target_value != null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Target: <span className="font-mono font-bold text-slate-700">
                      {g.target_value}{g.target_unit ? ' ' + g.target_unit : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Actual so far {g.target_unit && <span className="text-slate-400">({g.target_unit})</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={drafts[g.id]?.actual ?? ''}
                  onChange={(e) => update(g.id, 'actual', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded text-sm font-mono"
                  placeholder="—"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Reflection / blockers
                </label>
                <textarea
                  value={drafts[g.id]?.note ?? ''}
                  onChange={(e) => update(g.id, 'note', e.target.value)}
                  rows={2}
                  maxLength={600}
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
                  placeholder="Briefly — what's going well, what isn't, what would help."
                />
                <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                  {(drafts[g.id]?.note ?? '').length} / 600
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="text-xs text-slate-700 bg-slate-100 rounded p-2 mb-3 inline-block">{msg}</div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => save('draft')}
          disabled={saving !== 'idle'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {saving === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save draft
        </button>
        <button
          onClick={() => save('submit')}
          disabled={saving !== 'idle'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
        >
          {saving === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit mid-year check-in
        </button>
      </div>
    </div>
  );
}
