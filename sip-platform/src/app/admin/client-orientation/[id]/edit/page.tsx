/**
 * Client Orientation — Edit Draft (risk questionnaire + goals)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Send, Plus, Trash2, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import {
  RISK_QUESTIONS,
  computeRiskCategory,
  inflateCorpus,
  requiredMonthlySip,
} from '@/lib/client-orientation/types';
import type { GoalType, FinancialGoal } from '@/lib/client-orientation/types';

const GOAL_TYPES: GoalType[] = [
  'Retirement', 'Child Education', 'Child Marriage', 'House Purchase',
  'House Down Payment', 'Vacation', 'Emergency Fund', 'Wealth Creation',
  'Business Capital', 'Other',
];

interface Orientation {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  risk_score: number | null;
  risk_category: string | null;
  monthly_household_income_inr: number | null;
  monthly_household_expenses_inr: number | null;
  num_dependents: number;
  pref_channel: string | null;
  pref_review_frequency: string | null;
  risk_responses: Array<{ question_code: string; response_text: string; response_score: number; response_order: number | null }>;
  goals: Array<{
    id: number;
    goal_type: string;
    custom_goal_name: string | null;
    target_year: number;
    target_corpus_today_value_inr: number;
    inflation_assumption_pct: number;
    target_corpus_future_value_inr: number | null;
    expected_return_pct: number;
    required_monthly_sip_inr: number | null;
    existing_corpus_inr: number;
    priority: 'High' | 'Medium' | 'Low';
    notes: string | null;
  }>;
}

interface GoalForm extends FinancialGoal {
  _key: string;
}

export default function EditOrientationPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [orient, setOrient] = useState<Orientation | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [goals, setGoals] = useState<GoalForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-orientation/${id}`);
      if (res.ok) {
        const data = await res.json();
        const o = data.orientation as Orientation;
        setOrient(o);
        const a: Record<string, number> = {};
        (o.risk_responses ?? []).forEach((r) => {
          a[r.question_code] = r.response_order ?? 0;
        });
        setAnswers(a);
        setGoals(
          (o.goals ?? []).map((g) => ({
            _key: String(g.id),
            goalType: g.goal_type as GoalType,
            customGoalName: g.custom_goal_name ?? undefined,
            targetYear: g.target_year,
            targetCorpusTodayValueInr: g.target_corpus_today_value_inr,
            inflationAssumptionPct: g.inflation_assumption_pct,
            targetCorpusFutureValueInr: g.target_corpus_future_value_inr ?? undefined,
            expectedReturnPct: g.expected_return_pct,
            requiredMonthlySipInr: g.required_monthly_sip_inr ?? undefined,
            existingCorpusInr: g.existing_corpus_inr,
            priority: g.priority,
            notes: g.notes ?? undefined,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Risk score from answers
  const liveRiskScore = RISK_QUESTIONS.reduce((sum, q) => {
    const order = answers[q.code];
    const opt = q.options[order - 1];
    return sum + (opt?.score ?? 0);
  }, 0);
  const liveRiskCategory = computeRiskCategory(liveRiskScore);
  const answeredCount = Object.keys(answers).length;

  function updateGoal(key: string, patch: Partial<FinancialGoal>) {
    setGoals((gs) =>
      gs.map((g) => {
        if (g._key !== key) return g;
        const merged = { ...g, ...patch } as GoalForm;
        const yearsAway = Math.max(0, merged.targetYear - new Date().getFullYear());
        const fv = inflateCorpus({
          todayValueInr: merged.targetCorpusTodayValueInr || 0,
          years: yearsAway,
          inflationPct: merged.inflationAssumptionPct || 6,
        });
        const sip = requiredMonthlySip({
          futureValueInr: fv,
          years: yearsAway || 1,
          expectedReturnPct: merged.expectedReturnPct || 12,
          existingCorpusInr: merged.existingCorpusInr || 0,
        });
        merged.targetCorpusFutureValueInr = fv;
        merged.requiredMonthlySipInr = sip;
        return merged;
      })
    );
  }

  function addGoal() {
    const thisYear = new Date().getFullYear();
    setGoals((gs) => [
      ...gs,
      {
        _key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        goalType: 'Wealth Creation',
        targetYear: thisYear + 10,
        targetCorpusTodayValueInr: 1000000,
        inflationAssumptionPct: 6,
        targetCorpusFutureValueInr: inflateCorpus({ todayValueInr: 1000000, years: 10, inflationPct: 6 }),
        expectedReturnPct: 12,
        requiredMonthlySipInr: requiredMonthlySip({ futureValueInr: inflateCorpus({ todayValueInr: 1000000, years: 10, inflationPct: 6 }), years: 10, expectedReturnPct: 12 }),
        existingCorpusInr: 0,
        priority: 'Medium',
      },
    ]);
  }

  function removeGoal(key: string) {
    setGoals((gs) => gs.filter((g) => g._key !== key));
  }

  // Returns true on success, false on failure (so callers can guard)
  async function handleSave(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const riskResponses = Object.entries(answers).map(([code, order]) => {
        const q = RISK_QUESTIONS.find((x) => x.code === code);
        const opt = q?.options[order - 1];
        return {
          questionCode: code,
          questionText: q?.text ?? '',
          responseText: opt?.label ?? '',
          responseScore: opt?.score ?? 0,
          responseOrder: order,
        };
      });

      const goalsPayload = goals.map((g) => ({
        goalType: g.goalType,
        customGoalName: g.customGoalName,
        targetYear: g.targetYear,
        targetCorpusTodayValueInr: g.targetCorpusTodayValueInr,
        inflationAssumptionPct: g.inflationAssumptionPct,
        targetCorpusFutureValueInr: g.targetCorpusFutureValueInr,
        expectedReturnPct: g.expectedReturnPct,
        requiredMonthlySipInr: g.requiredMonthlySipInr,
        existingCorpusInr: g.existingCorpusInr,
        priority: g.priority,
        notes: g.notes,
      }));

      const res = await fetch(`/api/admin/client-orientation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskResponses, goals: goalsPayload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Save failed' });
        return false;
      }
      setMessage({ type: 'success', text: 'Saved' });
      load();
      return true;
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (answeredCount < RISK_QUESTIONS.length) {
      setMessage({ type: 'error', text: `Please answer all ${RISK_QUESTIONS.length} risk questions before submitting (currently ${answeredCount}).` });
      return;
    }
    if (goals.length === 0) {
      setMessage({ type: 'error', text: 'Capture at least one financial goal before submitting.' });
      return;
    }
    setSubmitting(true);
    try {
      // Save first — if save fails, ABORT (don't submit stale data)
      const ok = await handleSave();
      if (!ok) {
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/admin/client-orientation/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Submit failed' });
        setSubmitting(false);
        return;
      }
      router.push('/admin/client-orientation');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">
        Loading orientation…
      </div>
    );
  }
  if (!orient) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        Orientation not found.
      </div>
    );
  }

  const readOnly = orient.status !== 'DRAFT' && orient.status !== 'CHANGES_REQUESTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link href="/admin/client-orientation" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{orient.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{orient.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {orient.num_dependents} dependent{orient.num_dependents !== 1 ? 's' : ''}
              {orient.pref_channel ? ` · ${orient.pref_channel}` : ''}
              {orient.pref_review_frequency ? ` · ${orient.pref_review_frequency} reviews` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/api/admin/client-orientation/${id}/summary`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50">
              <FileText className="w-3.5 h-3.5" /> Preview Summary
            </a>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {orient.status}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Questionnaire */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Risk Profile Questionnaire
          </h2>
          <div className="text-xs text-slate-500">
            {answeredCount} / {RISK_QUESTIONS.length} answered
          </div>
        </div>

        {answeredCount > 0 && (
          <div className="mb-4 rounded-lg bg-brand-50 border border-brand-100 p-3 flex items-center justify-between">
            <span className="text-sm text-brand-900">
              Live score: <strong>{liveRiskScore}</strong> / {RISK_QUESTIONS.length * 5}
            </span>
            <span className="text-sm font-bold text-brand-700">{liveRiskCategory}</span>
          </div>
        )}

        <div className="space-y-5">
          {RISK_QUESTIONS.map((q, qIdx) => (
            <div key={q.code} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="text-sm font-semibold text-slate-800 mb-2">
                <span className="text-slate-400 mr-2">{qIdx + 1}.</span>
                {q.text}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
                {q.options.map((opt, optIdx) => {
                  const order = optIdx + 1;
                  const isSelected = answers[q.code] === order;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setAnswers((a) => ({ ...a, [q.code]: order }))}
                      className={`text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Financial Goals
          </h2>
          {!readOnly && (
            <button
              type="button"
              onClick={addGoal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </button>
          )}
        </div>

        {goals.length === 0 && (
          <p className="text-sm text-slate-500 italic">No goals captured yet. Click &quot;Add Goal&quot; to start.</p>
        )}

        <div className="space-y-4">
          {goals.map((g, idx) => {
            const yearsAway = Math.max(0, g.targetYear - new Date().getFullYear());
            return (
              <div key={g._key} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Goal #{idx + 1}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeGoal(g._key)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Goal Type</label>
                    <select
                      value={g.goalType}
                      onChange={(e) => updateGoal(g._key, { goalType: e.target.value as GoalType })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    >
                      {GOAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Target Year</label>
                    <input
                      type="number"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 60}
                      value={g.targetYear}
                      onChange={(e) => updateGoal(g._key, { targetYear: parseInt(e.target.value, 10) })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                    <select
                      value={g.priority}
                      onChange={(e) => updateGoal(g._key, { priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Target ₹ (today)</label>
                    <input
                      type="number"
                      min={0}
                      value={g.targetCorpusTodayValueInr}
                      onChange={(e) => updateGoal(g._key, { targetCorpusTodayValueInr: parseFloat(e.target.value) || 0 })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Inflation %</label>
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={20}
                      value={g.inflationAssumptionPct}
                      onChange={(e) => updateGoal(g._key, { inflationAssumptionPct: parseFloat(e.target.value) || 6 })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Expected Return %</label>
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={30}
                      value={g.expectedReturnPct}
                      onChange={(e) => updateGoal(g._key, { expectedReturnPct: parseFloat(e.target.value) || 12 })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Existing Corpus (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={g.existingCorpusInr}
                      onChange={(e) => updateGoal(g._key, { existingCorpusInr: parseFloat(e.target.value) || 0 })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Live calculation */}
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <Pill label="Years away" value={`${yearsAway} yr`} />
                  <Pill label="Future value" value={`₹${(g.targetCorpusFutureValueInr ?? 0).toLocaleString('en-IN')}`} />
                  <Pill label="Required SIP/mo" value={`₹${(g.requiredMonthlySipInr ?? 0).toLocaleString('en-IN')}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 flex items-start gap-2 ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 sticky bottom-4">
          <p className="text-xs text-slate-500">
            All 8 questions + at least one goal required to submit.
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || answeredCount < RISK_QUESTIONS.length || goals.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
