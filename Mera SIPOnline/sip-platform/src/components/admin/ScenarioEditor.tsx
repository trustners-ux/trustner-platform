'use client';

/**
 * What-If Scenario Editor
 * --------------------------------------------------------------------------
 * Renders inline on /admin/reports/[id]. Lets the admin tweak the highest-
 * leverage inputs (income, expenses, SIP, goal targets, retirement age,
 * insurance covers) and see live recalculated metrics — without sending the
 * client back through the 30-minute wizard.
 *
 * Two modes:
 *   PREVIEW  → debounced live recalc. Posts to /api/admin/reports/[id]/scenario
 *              with mode=preview; no persistence.
 *   APPLY    → posts mode=replace. Saves the new planning data to blob,
 *              regenerates AI narrative + PDF, refreshes the parent page.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Sparkles, RotateCcw, Save, TrendingUp, TrendingDown, Minus,
  IndianRupee, Calendar, Target, Heart, Briefcase, Loader2, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FinancialPlanningData } from '@/types/financial-planning';

interface Props {
  reportId: string;
  planningData: FinancialPlanningData;
  /** Called after a successful Apply so the parent can refresh */
  onApplied?: () => void;
}

interface ScenarioOverrides {
  monthlyInHandSalary?: number;
  annualBonus?: number;
  monthlyHouseholdExpenses?: number;
  annualDiscretionary?: number;
  monthlyEMIs?: number;
  monthlySIPsRunning?: number;
  monthlyInsurancePremiums?: number;
  retirementAge?: number;
  termInsuranceCover?: number;
  healthInsuranceCover?: number;
  goals?: Record<string, {
    targetAmount?: number;
    targetYear?: number;
    currentSavingsForGoal?: number;
    costType?: 'present' | 'future';
    customInflationRate?: number;
  }>;
}

interface ScenarioPreview {
  healthScore: number;
  grade: string;
  netWorth: number;
  retirementCorpusRequired: number;
  retirementCurrentProgress: number;
  retirementGap: number;
  retirementReadinessPct: number;
  totalGoalMonthlySIP: number;
  goalFeasibility: { id: string; name: string; futureCost: number; monthlyRequired: number; feasibility: string }[];
  estimatedYear1Surplus: number;
  pillars: { cashflow: number; protection: number; investments: number; debt: number; retirementReadiness: number };
}

function formatINR(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function feasibilityLabel(f: string): { label: string; cls: string } {
  switch (f) {
    case 'on-track': return { label: 'On Track', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'possible': return { label: 'Possible', cls: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'stretch':  return { label: 'Stretch — Phase It', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'unrealistic': return { label: 'Re-frame & Stage', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    default: return { label: f, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
}

export default function ScenarioEditor({ reportId, planningData, onApplied }: Props) {
  // Initial values from current planningData
  const initial = useMemo<ScenarioOverrides>(() => ({
    monthlyInHandSalary:        planningData.incomeProfile.monthlyInHandSalary,
    annualBonus:                planningData.incomeProfile.annualBonus,
    monthlyHouseholdExpenses:   planningData.incomeProfile.monthlyHouseholdExpenses,
    annualDiscretionary:        planningData.incomeProfile.annualDiscretionary,
    monthlyEMIs:                planningData.incomeProfile.monthlyEMIs,
    monthlySIPsRunning:         planningData.incomeProfile.monthlySIPsRunning,
    monthlyInsurancePremiums:   planningData.incomeProfile.monthlyInsurancePremiums,
    termInsuranceCover:         planningData.insuranceProfile.termInsuranceCover,
    healthInsuranceCover:       planningData.insuranceProfile.healthInsuranceCover,
    retirementAge: (planningData as unknown as { careerProfile?: { retirementAge?: number } }).careerProfile?.retirementAge ?? 60,
  }), [planningData]);

  const [overrides, setOverrides] = useState<ScenarioOverrides>(initial);
  const [baseline, setBaseline] = useState<ScenarioPreview | null>(null);
  const [preview, setPreview] = useState<ScenarioPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedFlash, setAppliedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPreview = useCallback(async (next: ScenarioOverrides) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: next, mode: 'preview' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setBaseline(data.baseline);
      setPreview(data.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }, [reportId]);

  // Initial preview on mount (gives us the baseline and the current numbers)
  useEffect(() => {
    runPreview(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  // Debounced live recalc on every input change
  const update = useCallback((patch: Partial<ScenarioOverrides>) => {
    setOverrides((prev) => {
      const next = { ...prev, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runPreview(next), 400);
      return next;
    });
  }, [runPreview]);

  const reset = useCallback(() => {
    setOverrides(initial);
    runPreview(initial);
  }, [initial, runPreview]);

  const [lastApplied, setLastApplied] = useState<{ before: number; after: number; pdfUrl: string; version: number } | null>(null);

  const apply = useCallback(async () => {
    if (applying) return;
    // Show projected change in the confirm so the user knows what they're committing to
    const beforeScore = baseline?.healthScore ?? 0;
    const afterScore  = preview?.healthScore  ?? 0;
    const delta = afterScore - beforeScore;
    const sign = delta > 0 ? '+' : '';
    const msg = `Apply these scenario changes and regenerate the PDF?\n\nProjected Health Score: ${beforeScore} → ${afterScore} (${sign}${delta})\n\nThe PDF will be re-rendered with the new numbers. This takes 10-15 seconds.`;
    const ok = window.confirm(msg);
    if (!ok) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides, mode: 'replace' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Apply failed');
      setAppliedFlash(true);
      setLastApplied({
        before: beforeScore,
        after: data.preview?.healthScore ?? afterScore,
        pdfUrl: data.pdfUrl,
        version: data.narrativeVersion ?? 0,
      });
      // The confetti banner persists until next change
      if (onApplied) onApplied();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  }, [applying, overrides, reportId, onApplied, baseline, preview]);

  // Helpers
  const Delta = ({ from, to, betterIsHigher = true, suffix = '' }: { from?: number; to?: number; betterIsHigher?: boolean; suffix?: string }) => {
    if (from === undefined || to === undefined) return null;
    const diff = to - from;
    if (Math.abs(diff) < 1) {
      return <span className="text-[11px] text-slate-400 inline-flex items-center gap-0.5"><Minus className="w-3 h-3" /></span>;
    }
    const better = betterIsHigher ? diff > 0 : diff < 0;
    const Icon = diff > 0 ? TrendingUp : TrendingDown;
    return (
      <span className={cn('text-[11px] font-semibold inline-flex items-center gap-0.5', better ? 'text-emerald-600' : 'text-rose-600')}>
        <Icon className="w-3 h-3" />
        {diff > 0 ? '+' : ''}{suffix === '%' ? Math.round(diff) + '%' : suffix === 'pts' ? Math.round(diff) + ' pts' : formatINR(Math.abs(diff)) }
      </span>
    );
  };

  const NumInput = ({
    label, value, onChange, min = 0, step = 1000, prefix = '₹', suffix, hint,
  }: {
    label: string; value: number | undefined; onChange: (v: number) => void;
    min?: number; step?: number; prefix?: string; suffix?: string; hint?: string;
  }) => (
    <label className="block">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="mt-1 flex rounded-lg border border-slate-300 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand bg-white overflow-hidden">
        {prefix && <span className="px-2 py-1.5 bg-slate-50 text-slate-500 text-xs border-r border-slate-200">{prefix}</span>}
        <input
          type="number"
          value={value ?? ''}
          min={min}
          step={step}
          onChange={(e) => {
            const v = e.target.value === '' ? 0 : Number(e.target.value);
            onChange(isNaN(v) ? 0 : v);
          }}
          className="flex-1 px-2 py-1.5 text-sm font-semibold text-slate-700 outline-none bg-transparent"
        />
        {suffix && <span className="px-2 py-1.5 bg-slate-50 text-slate-500 text-xs border-l border-slate-200">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </label>
  );

  return (
    <div className="card-base p-5 border-2 border-amber-200 bg-amber-50/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">What-If Scenario Editor</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Tweak the high-leverage inputs and see live recalculated metrics. Apply when you have a plan that works for the family — no need to re-do the 30-minute wizard.
            </p>
          </div>
        </div>
        {previewLoading && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
      </div>

      {/* Live Preview Strip */}
      {baseline && preview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 bg-white rounded-xl border border-slate-200">
          <Metric
            label="Health Score"
            current={`${preview.healthScore}/900`}
            sub={preview.grade}
            delta={<Delta from={baseline.healthScore} to={preview.healthScore} betterIsHigher suffix="pts" />}
          />
          <Metric
            label="Year 1 Surplus"
            current={formatINR(preview.estimatedYear1Surplus)}
            sub={preview.estimatedYear1Surplus >= 0 ? 'Sustainable' : 'Negative — re-balance'}
            delta={<Delta from={baseline.estimatedYear1Surplus} to={preview.estimatedYear1Surplus} betterIsHigher />}
            tone={preview.estimatedYear1Surplus >= 0 ? 'good' : 'bad'}
          />
          <Metric
            label="Retirement Readiness"
            current={`${preview.retirementReadinessPct}%`}
            sub={`Gap ${formatINR(preview.retirementGap)}`}
            delta={<Delta from={baseline.retirementReadinessPct} to={preview.retirementReadinessPct} betterIsHigher suffix="%" />}
          />
          <Metric
            label="Total Goal SIP"
            current={`${formatINR(preview.totalGoalMonthlySIP)}/mo`}
            sub={`vs surplus ${formatINR(preview.estimatedYear1Surplus / 12)}/mo`}
            delta={<Delta from={baseline.totalGoalMonthlySIP} to={preview.totalGoalMonthlySIP} betterIsHigher={false} />}
          />
        </div>
      )}

      {/* Editable Inputs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Income Cluster */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="w-3 h-3" /> Income
          </div>
          <NumInput label="Monthly Salary (in-hand)" value={overrides.monthlyInHandSalary} onChange={(v) => update({ monthlyInHandSalary: v })} step={5000} hint="Take-home after taxes" />
          <NumInput label="Annual Bonus" value={overrides.annualBonus} onChange={(v) => update({ annualBonus: v })} step={50000} hint="Performance bonus + variable pay" />
        </div>

        {/* Expenses Cluster */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3 h-3" /> Expenses & Outflows
          </div>
          <NumInput label="Monthly Household Expenses" value={overrides.monthlyHouseholdExpenses} onChange={(v) => update({ monthlyHouseholdExpenses: v })} step={5000} />
          <NumInput label="Annual Discretionary" value={overrides.annualDiscretionary} onChange={(v) => update({ annualDiscretionary: v })} step={25000} hint="Vacations, gadgets, lifestyle" />
          <NumInput label="Monthly EMIs" value={overrides.monthlyEMIs} onChange={(v) => update({ monthlyEMIs: v })} step={5000} />
        </div>

        {/* Investing Cluster */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Investing
          </div>
          <NumInput label="Current Monthly SIP" value={overrides.monthlySIPsRunning} onChange={(v) => update({ monthlySIPsRunning: v })} step={1000} hint="What you already invest each month" />
          <NumInput label="Monthly Insurance Premiums" value={overrides.monthlyInsurancePremiums} onChange={(v) => update({ monthlyInsurancePremiums: v })} step={500} />
          <NumInput label="Retirement Age" value={overrides.retirementAge} onChange={(v) => update({ retirementAge: v })} prefix="" suffix="yrs" min={45} step={1} hint="Each extra year compounds significantly" />
        </div>

        {/* Insurance Cluster */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3 h-3" /> Protection Cover
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumInput label="Term Life Cover" value={overrides.termInsuranceCover} onChange={(v) => update({ termInsuranceCover: v })} step={500000} hint="Sum assured of pure-term policy" />
            <NumInput label="Health Insurance Cover" value={overrides.healthInsuranceCover} onChange={(v) => update({ healthInsuranceCover: v })} step={500000} hint="Family floater + super top-up combined" />
          </div>
        </div>
      </div>

      {/* Per-Goal Editor (preserves goal IDs) */}
      {(planningData as unknown as { goals?: Array<{ id?: string; name: string; type?: string; targetAmount: number; targetYear: number; currentSavingsForGoal?: number; costType?: 'present' | 'future'; customInflationRate?: number }> }).goals?.length ? (
        <div className="mt-5 pt-4 border-t border-amber-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Goals — Re-target & Re-time
          </div>
          <p className="text-[11px] text-slate-500 mb-3 -mt-1">
            <strong>Tip:</strong> If the original entry treated the target as <em>today&apos;s prices</em> (and inflation pushed it to an unrealistic future cost), switch to <em>Future Cost</em> mode. The system will use your stated number as-is, no inflation applied.
          </p>
          <div className="space-y-3">
            {((planningData as unknown as { goals: Array<{ id?: string; name: string; type?: string; targetAmount: number; targetYear: number; currentSavingsForGoal?: number; costType?: 'present' | 'future'; customInflationRate?: number }> }).goals).map((g, idx) => {
              const key = g.id || g.name;
              const live = preview?.goalFeasibility[idx];
              const fz = feasibilityLabel(live?.feasibility || 'on-track');
              const effectiveCostType = overrides.goals?.[key]?.costType ?? g.costType ?? 'present';
              return (
                <div key={key} className="p-3 rounded-lg bg-white border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-700">{g.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Future cost: <span className="font-semibold">{live ? formatINR(live.futureCost) : '—'}</span> · SIP needed: <span className="font-semibold">{live ? formatINR(live.monthlyRequired) + '/mo' : '—'}</span>
                      </div>
                      <span className={cn('inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border', fz.cls)}>
                        {fz.label}
                      </span>
                    </div>
                    {/* Cost type toggle */}
                    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-[10px] font-bold shrink-0">
                      {(['present', 'future'] as const).map((opt) => {
                        const active = effectiveCostType === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => update({ goals: { ...(overrides.goals || {}), [key]: { ...(overrides.goals?.[key] || {}), costType: opt } } })}
                            className={cn(
                              'px-2.5 py-1.5 transition-colors',
                              active ? 'bg-brand text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                            )}
                            title={opt === 'present' ? 'Inflate to target year using category default' : 'Already a future budget — use as-is'}
                          >
                            {opt === 'present' ? 'Today’s Prices' : 'Future Cost'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <NumInput
                      label="Target Amount"
                      value={overrides.goals?.[key]?.targetAmount ?? g.targetAmount}
                      onChange={(v) => update({ goals: { ...(overrides.goals || {}), [key]: { ...(overrides.goals?.[key] || {}), targetAmount: v } } })}
                      step={100000}
                    />
                    <NumInput
                      label="Target Year"
                      value={overrides.goals?.[key]?.targetYear ?? g.targetYear}
                      onChange={(v) => update({ goals: { ...(overrides.goals || {}), [key]: { ...(overrides.goals?.[key] || {}), targetYear: v } } })}
                      prefix=""
                      step={1}
                      min={new Date().getFullYear()}
                    />
                    <NumInput
                      label="Saved So Far"
                      value={overrides.goals?.[key]?.currentSavingsForGoal ?? g.currentSavingsForGoal ?? 0}
                      onChange={(v) => update({ goals: { ...(overrides.goals || {}), [key]: { ...(overrides.goals?.[key] || {}), currentSavingsForGoal: v } } })}
                      step={50000}
                    />
                    {effectiveCostType === 'present' ? (
                      <NumInput
                        label="Inflation (optional)"
                        value={overrides.goals?.[key]?.customInflationRate ?? g.customInflationRate ?? undefined}
                        onChange={(v) => update({ goals: { ...(overrides.goals || {}), [key]: { ...(overrides.goals?.[key] || {}), customInflationRate: v } } })}
                        prefix=""
                        suffix="% p.a."
                        step={0.5}
                        min={0}
                        hint={
                          (g.type === 'child-education') ? 'Default 10%'
                          : (g.type === 'child-marriage') ? 'Default 8%'
                          : (g.type === 'house-purchase') ? 'Default 7%'
                          : 'Default 6%'
                        }
                      />
                    ) : (
                      <div className="text-[11px] text-slate-500 px-2 py-2 self-end leading-snug">
                        Inflation: <span className="font-semibold text-emerald-700">Not applied</span><br />
                        <span className="text-[10px]">Target used as-is</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Coach Tip */}
      <div className="mt-5 p-3 rounded-lg bg-blue-50 border border-blue-200 flex gap-2">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-900 leading-relaxed">
          <strong>CFP nudge:</strong> when a goal flags as <em>Stretch</em> or <em>Re-frame & Stage</em>, try the four levers in order — extend the horizon by 3-7 years, re-size the target to 60-70% of the original, stage the goal into 2-3 sub-goals, then ramp SIP step-up to 10-15%/year. The combination almost always converges within 2 iterations.
        </p>
      </div>

      {/* Action Buttons */}
      {/* Result banner — only shows after a successful Apply */}
      {lastApplied && (
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Save className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-emerald-900">Report regenerated successfully — v{lastApplied.version}</div>
              <div className="text-xs text-emerald-800 mt-0.5">
                Health Score: <span className="font-bold">{lastApplied.before}</span>
                {' '}<span className="mx-0.5">→</span>{' '}
                <span className="font-bold">{lastApplied.after}</span>
                {' '}(<span className={lastApplied.after - lastApplied.before > 0 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                  {lastApplied.after - lastApplied.before > 0 ? '+' : ''}{lastApplied.after - lastApplied.before}
                </span>)
                {' · '}
                The PDF preview to the right has refreshed automatically.
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={lastApplied.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Open fresh PDF in new tab
                </a>
                <span className="text-xs text-emerald-600">|</span>
                <button
                  type="button"
                  onClick={() => setLastApplied(null)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end">
        {error && (
          <span className="text-xs text-rose-600 mr-auto font-semibold">⚠ {error}</span>
        )}
        {!error && !lastApplied && baseline && preview && (
          <span className="text-xs text-slate-600 mr-auto">
            Projected: <span className="font-bold text-slate-800">{baseline.healthScore}</span>
            {' → '}
            <span className={
              (preview.healthScore - baseline.healthScore) > 0 ? 'font-bold text-emerald-700'
              : (preview.healthScore - baseline.healthScore) < 0 ? 'font-bold text-rose-700'
              : 'font-bold text-slate-800'
            }>{preview.healthScore}</span>
            {' '}
            <span className="text-slate-400">on Apply</span>
          </span>
        )}
        {appliedFlash && !lastApplied && (
          <span className="text-xs text-emerald-700 font-semibold mr-auto inline-flex items-center gap-1">
            <Save className="w-3.5 h-3.5" /> Applied & report regenerating
          </span>
        )}
        <button
          type="button"
          onClick={reset}
          disabled={applying}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Original
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={applying || previewLoading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm transition-colors disabled:opacity-50"
        >
          {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Apply & Regenerate Report
        </button>
      </div>
    </div>
  );
}

function Metric({
  label, current, sub, delta, tone = 'neutral',
}: {
  label: string; current: string; sub?: string; delta?: React.ReactNode;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={cn(
          'text-base font-extrabold truncate',
          tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-800',
        )}>{current}</span>
        {delta}
      </div>
      {sub && <div className="text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}
