/**
 * Periodic Review — Edit Draft
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Send, Plus, Trash2, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

interface Review {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  cadence: string;
  review_period_start: string;
  review_period_end: string;
  current_aum_inr: number | null;
  period_start_aum_inr: number | null;
  period_gain_inr: number | null;
  period_return_pct: number | null;
  family_xirr_pct: number | null;
  benchmark_return_pct: number | null;
  alpha_pct: number | null;
  top_contributor_1: string | null;
  top_contributor_1_contribution_inr: number | null;
  top_contributor_2: string | null;
  top_contributor_2_contribution_inr: number | null;
  top_detractor_1: string | null;
  top_detractor_1_contribution_inr: number | null;
  top_detractor_2: string | null;
  top_detractor_2_contribution_inr: number | null;
  num_active_goals: number;
  num_goals_on_track: number;
  num_goals_behind: number;
  market_summary: string | null;
  outlook_next_period: string | null;
  action_items: Array<{
    id: number;
    description: string;
    owner: 'Client' | 'RM' | 'Both';
    status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
    due_date: string | null;
    notes: string | null;
  }>;
}

interface ActionItemForm {
  _key: string;
  description: string;
  owner: 'Client' | 'RM' | 'Both';
  status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
  dueDate?: string;
  notes?: string;
}

export default function EditPeriodicReviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable numeric fields
  const [currentAumInr, setCurrentAumInr] = useState('');
  const [periodStartAumInr, setPeriodStartAumInr] = useState('');
  const [periodReturnPct, setPeriodReturnPct] = useState('');
  const [familyXirrPct, setFamilyXirrPct] = useState('');
  const [benchmarkReturnPct, setBenchmarkReturnPct] = useState('');
  const [topC1, setTopC1] = useState('');
  const [topC1Amt, setTopC1Amt] = useState('');
  const [topC2, setTopC2] = useState('');
  const [topC2Amt, setTopC2Amt] = useState('');
  const [topD1, setTopD1] = useState('');
  const [topD1Amt, setTopD1Amt] = useState('');
  const [topD2, setTopD2] = useState('');
  const [topD2Amt, setTopD2Amt] = useState('');
  const [numActiveGoals, setNumActiveGoals] = useState('0');
  const [numGoalsOnTrack, setNumGoalsOnTrack] = useState('0');
  const [numGoalsBehind, setNumGoalsBehind] = useState('0');
  const [marketSummary, setMarketSummary] = useState('');
  const [outlookNextPeriod, setOutlookNextPeriod] = useState('');
  const [actionItems, setActionItems] = useState<ActionItemForm[]>([]);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/periodic-review/${id}`);
      if (res.ok) {
        const data = await res.json();
        const r = data.review as Review;
        setReview(r);
        setCurrentAumInr(String(r.current_aum_inr ?? ''));
        setPeriodStartAumInr(String(r.period_start_aum_inr ?? ''));
        setPeriodReturnPct(String(r.period_return_pct ?? ''));
        setFamilyXirrPct(String(r.family_xirr_pct ?? ''));
        setBenchmarkReturnPct(String(r.benchmark_return_pct ?? ''));
        setTopC1(r.top_contributor_1 ?? '');
        setTopC1Amt(String(r.top_contributor_1_contribution_inr ?? ''));
        setTopC2(r.top_contributor_2 ?? '');
        setTopC2Amt(String(r.top_contributor_2_contribution_inr ?? ''));
        setTopD1(r.top_detractor_1 ?? '');
        setTopD1Amt(String(r.top_detractor_1_contribution_inr ?? ''));
        setTopD2(r.top_detractor_2 ?? '');
        setTopD2Amt(String(r.top_detractor_2_contribution_inr ?? ''));
        setNumActiveGoals(String(r.num_active_goals));
        setNumGoalsOnTrack(String(r.num_goals_on_track));
        setNumGoalsBehind(String(r.num_goals_behind));
        setMarketSummary(r.market_summary ?? '');
        setOutlookNextPeriod(r.outlook_next_period ?? '');
        setActionItems(
          (r.action_items ?? []).map((i) => ({
            _key: String(i.id),
            description: i.description,
            owner: i.owner,
            status: i.status,
            dueDate: i.due_date ?? undefined,
            notes: i.notes ?? undefined,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const periodGain =
    (parseFloat(currentAumInr) || 0) - (parseFloat(periodStartAumInr) || 0);
  const alphaPct =
    (parseFloat(periodReturnPct) || 0) - (parseFloat(benchmarkReturnPct) || 0);

  function addActionItem() {
    setActionItems((ai) => [
      ...ai,
      {
        _key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: '',
        owner: 'RM',
        status: 'Open',
      },
    ]);
  }
  function updateActionItem(key: string, patch: Partial<ActionItemForm>) {
    setActionItems((ai) => ai.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }
  function removeActionItem(key: string) {
    setActionItems((ai) => ai.filter((i) => i._key !== key));
  }

  // Returns true on success, false on failure
  async function handleSave(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/periodic-review/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAumInr: parseFloat(currentAumInr) || null,
          periodStartAumInr: parseFloat(periodStartAumInr) || null,
          periodGainInr: periodGain,
          periodReturnPct: parseFloat(periodReturnPct) || null,
          familyXirrPct: parseFloat(familyXirrPct) || null,
          benchmarkReturnPct: parseFloat(benchmarkReturnPct) || null,
          alphaPct,
          topContributor1: topC1 || null,
          topContributor1ContributionInr: parseFloat(topC1Amt) || null,
          topContributor2: topC2 || null,
          topContributor2ContributionInr: parseFloat(topC2Amt) || null,
          topDetractor1: topD1 || null,
          topDetractor1ContributionInr: parseFloat(topD1Amt) || null,
          topDetractor2: topD2 || null,
          topDetractor2ContributionInr: parseFloat(topD2Amt) || null,
          numActiveGoals: parseInt(numActiveGoals, 10) || 0,
          numGoalsOnTrack: parseInt(numGoalsOnTrack, 10) || 0,
          numGoalsBehind: parseInt(numGoalsBehind, 10) || 0,
          marketSummary: marketSummary || null,
          outlookNextPeriod: outlookNextPeriod || null,
          actionItems: actionItems.map(({ _key, ...rest }) => rest),
        }),
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
    setSubmitting(true);
    try {
      // Save first — abort if save fails
      const ok = await handleSave();
      if (!ok) {
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/admin/periodic-review/${id}/submit`, {
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
      router.push('/admin/periodic-review');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">Loading…</div>;
  if (!review) return <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">Review not found.</div>;

  const readOnly = review.status !== 'DRAFT' && review.status !== 'CHANGES_REQUESTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link href="/admin/periodic-review" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{review.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{review.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {review.cadence} review · {review.review_period_start} → {review.review_period_end}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/api/admin/periodic-review/${id}/note`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50">
              <FileText className="w-3.5 h-3.5" /> Preview Note
            </a>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{review.status}</span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Performance Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Period Start AUM (₹)" value={periodStartAumInr} onChange={setPeriodStartAumInr} disabled={readOnly} />
          <Field label="Current AUM (₹)" value={currentAumInr} onChange={setCurrentAumInr} disabled={readOnly} />
          <Pill label="Period Gain (₹)" value={`₹${periodGain.toLocaleString('en-IN')}`} accent={periodGain >= 0 ? 'green' : 'red'} />

          <Field label="Period Return %" value={periodReturnPct} onChange={setPeriodReturnPct} disabled={readOnly} step={0.1} />
          <Field label="Family XIRR %" value={familyXirrPct} onChange={setFamilyXirrPct} disabled={readOnly} step={0.1} />
          <Field label="Benchmark Return %" value={benchmarkReturnPct} onChange={setBenchmarkReturnPct} disabled={readOnly} step={0.1} />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Excess Return vs Benchmark</span>
          <span className={`text-lg font-bold ${alphaPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {alphaPct >= 0 ? '+' : ''}{alphaPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Top contributors / detractors */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Top Contributors / Detractors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-emerald-700 mb-2">TOP CONTRIBUTORS</h3>
            <div className="space-y-2">
              <ContribRow label="#1" name={topC1} onName={setTopC1} amt={topC1Amt} onAmt={setTopC1Amt} disabled={readOnly} accent="green" />
              <ContribRow label="#2" name={topC2} onName={setTopC2} amt={topC2Amt} onAmt={setTopC2Amt} disabled={readOnly} accent="green" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-red-700 mb-2">TOP DETRACTORS</h3>
            <div className="space-y-2">
              <ContribRow label="#1" name={topD1} onName={setTopD1} amt={topD1Amt} onAmt={setTopD1Amt} disabled={readOnly} accent="red" />
              <ContribRow label="#2" name={topD2} onName={setTopD2} amt={topD2Amt} onAmt={setTopD2Amt} disabled={readOnly} accent="red" />
            </div>
          </div>
        </div>
      </div>

      {/* Goals progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Goals Progress
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Active Goals" value={numActiveGoals} onChange={setNumActiveGoals} disabled={readOnly} />
          <Field label="On Track" value={numGoalsOnTrack} onChange={setNumGoalsOnTrack} disabled={readOnly} />
          <Field label="Behind" value={numGoalsBehind} onChange={setNumGoalsBehind} disabled={readOnly} />
        </div>
      </div>

      {/* Action items */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Action Items
          </h2>
          {!readOnly && (
            <button type="button" onClick={addActionItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          )}
        </div>
        {actionItems.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No action items.</p>
        ) : (
          <div className="space-y-2">
            {actionItems.map((i) => (
              <div key={i._key} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      value={i.description}
                      onChange={(e) => updateActionItem(i._key, { description: e.target.value })}
                      disabled={readOnly}
                      placeholder="Action description…"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <select value={i.owner} onChange={(e) => updateActionItem(i._key, { owner: e.target.value as 'Client' | 'RM' | 'Both' })} disabled={readOnly} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                      <option>RM</option>
                      <option>Client</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <select value={i.status} onChange={(e) => updateActionItem(i._key, { status: e.target.value as 'Open' | 'In Progress' | 'Completed' | 'Blocked' })} disabled={readOnly} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Blocked</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <input
                      type="date"
                      value={i.dueDate ?? ''}
                      onChange={(e) => updateActionItem(i._key, { dueDate: e.target.value || undefined })}
                      disabled={readOnly}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  {!readOnly && (
                    <div className="md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeActionItem(i._key)} className="text-slate-400 hover:text-red-600 p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commentary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Market Summary</label>
          <textarea value={marketSummary} onChange={(e) => setMarketSummary(e.target.value)} disabled={readOnly} rows={3} placeholder="2-3 sentences on what happened in markets this period…" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 focus:outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Outlook Next Period</label>
          <textarea value={outlookNextPeriod} onChange={(e) => setOutlookNextPeriod(e.target.value)} disabled={readOnly} rows={3} placeholder="Key themes, positioning, things to watch…" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 focus:outline-none focus:border-brand-500" />
        </div>
      </div>

      {message && (
        <div className={`rounded-lg border p-3 flex items-start gap-2 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-end gap-3 sticky bottom-4">
          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300">
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, disabled, step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
      />
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const cls = accent === 'green' ? 'bg-emerald-50 text-emerald-900' : accent === 'red' ? 'bg-red-50 text-red-900' : 'bg-slate-50 text-slate-900';
  return (
    <div className={`rounded-md px-2.5 py-1.5 ${cls}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ContribRow({
  label, name, onName, amt, onAmt, disabled, accent,
}: {
  label: string;
  name: string;
  onName: (v: string) => void;
  amt: string;
  onAmt: (v: string) => void;
  disabled?: boolean;
  accent: 'green' | 'red';
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <span className="col-span-1 text-xs font-bold text-slate-500">{label}</span>
      <input
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        disabled={disabled}
        placeholder="Fund name"
        className="col-span-7 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
      />
      <input
        type="number"
        value={amt}
        onChange={(e) => onAmt(e.target.value)}
        disabled={disabled}
        placeholder="₹ contribution"
        className={`col-span-4 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100 ${accent === 'green' ? 'text-emerald-700' : 'text-red-700'} font-semibold`}
      />
    </div>
  );
}
