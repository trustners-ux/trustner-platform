'use client';

import { useMemo } from 'react';
import { Target } from 'lucide-react';
import GoalBuilder from '@/components/financial-planning/inputs/GoalBuilder';
import type { FinancialGoal } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  goals: FinancialGoal[];
  onUpdate: (goals: FinancialGoal[]) => void;
  age: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as Indian shorthand (e.g. 50 L, 5 Cr) */
function formatIndian(value: number): string {
  if (value <= 0) return '\u20B90';
  if (value >= 1_00_00_000) {
    const cr = value / 1_00_00_000;
    return `\u20B9${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 1_00_000) {
    const l = value / 1_00_000;
    return `\u20B9${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
  }
  return `\u20B9${value.toLocaleString('en-IN')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GoalsStep({ goals, onUpdate, age }: Props) {
  // Compute summary stats
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + (g.currentSavingsForGoal || 0), 0);
    const criticalCount = goals.filter((g) => g.priority === 'critical').length;
    const importantCount = goals.filter((g) => g.priority === 'important').length;
    const niceToHaveCount = goals.filter((g) => g.priority === 'nice-to-have').length;

    return { totalTarget, totalSaved, criticalCount, importantCount, niceToHaveCount };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Intro message */}
      <p className="text-sm text-slate-500 leading-relaxed">
        Add your financial goals below. We will analyze the gap between where you are
        and where you want to be.
      </p>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-surface-300 bg-surface-50">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-3">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No goals added yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Start by clicking &quot;Add Goal&quot; below
          </p>
        </div>
      )}

      {/* Goal Builder */}
      <GoalBuilder goals={goals} onChange={onUpdate} />

      {/* Summary card — only show when goals exist */}
      {goals.length > 0 && (
        <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-4">
          <h4 className="text-sm font-bold text-primary-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Goals Summary
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3 border border-surface-300">
              <p className="text-[11px] text-slate-500 font-medium">Total Goals</p>
              <p className="text-lg font-bold text-primary-700 tabular-nums">
                {goals.length}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-surface-300">
              <p className="text-[11px] text-slate-500 font-medium">Combined Target Amount</p>
              <p className="text-lg font-bold text-brand tabular-nums">
                {formatIndian(summary.totalTarget)}
              </p>
            </div>
          </div>

          {/* Priority breakdown */}
          {(summary.criticalCount > 0 || summary.importantCount > 0 || summary.niceToHaveCount > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {summary.criticalCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[11px] font-semibold text-red-600">
                    {summary.criticalCount} Critical
                  </span>
                </div>
              )}
              {summary.importantCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-600">
                    {summary.importantCount} Important
                  </span>
                </div>
              )}
              {summary.niceToHaveCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-semibold text-blue-600">
                    {summary.niceToHaveCount} Nice to Have
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Already saved note */}
          {summary.totalSaved > 0 && (
            <p className="text-xs text-slate-400">
              You have already saved {formatIndian(summary.totalSaved)} towards these goals.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
