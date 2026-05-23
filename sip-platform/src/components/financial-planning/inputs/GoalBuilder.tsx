'use client';

import { useState } from 'react';
import { Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import SelectInput from '@/components/financial-planning/inputs/SelectInput';
import type { FinancialGoal, GoalType } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_GOALS = 8;

const GOAL_TYPE_OPTIONS = [
  { value: 'retirement', label: 'Retirement Corpus', defaultAmount: 50000000, defaultInflation: 6 },
  { value: 'child-education', label: 'Child Education', defaultAmount: 5000000, defaultInflation: 10 },
  { value: 'child-marriage', label: 'Child Marriage', defaultAmount: 3000000, defaultInflation: 7 },
  { value: 'house-purchase', label: 'House Purchase', defaultAmount: 10000000, defaultInflation: 7 },
  { value: 'car-purchase', label: 'Car Purchase', defaultAmount: 1500000, defaultInflation: 5 },
  { value: 'vacation', label: 'Dream Vacation', defaultAmount: 500000, defaultInflation: 6 },
  { value: 'emergency-fund', label: 'Emergency Fund', defaultAmount: 600000, defaultInflation: 6 },
  { value: 'wealth-creation', label: 'Wealth Creation', defaultAmount: 10000000, defaultInflation: 6 },
  { value: 'early-retirement', label: 'Early Retirement (FIRE)', defaultAmount: 80000000, defaultInflation: 6 },
  { value: 'custom', label: 'Custom Goal', defaultAmount: 1000000, defaultInflation: 6 },
];

const GOAL_PRIORITY_OPTIONS: { value: FinancialGoal['priority']; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'important', label: 'Important', color: '#f59e0b' },
  { value: 'nice-to-have', label: 'Nice to Have', color: '#3b82f6' },
];

const SELECT_TYPE_OPTIONS = GOAL_TYPE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoalBuilderProps {
  goals: FinancialGoal[];
  onChange: (goals: FinancialGoal[]) => void;
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

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function getDefaultGoal(): FinancialGoal {
  const currentYear = new Date().getFullYear();
  return {
    id: generateId(),
    name: '',
    type: 'custom' as GoalType,
    targetAmount: 1000000,
    targetYear: currentYear + 10,
    priority: 'important',
    currentSavingsForGoal: 0,
  };
}

function getPriorityDotColor(priority: FinancialGoal['priority']): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500';
    case 'important':
      return 'bg-amber-500';
    case 'nice-to-have':
      return 'bg-blue-500';
    default:
      return 'bg-slate-400';
  }
}

function getPriorityBadgeClasses(priority: FinancialGoal['priority']): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'important':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'nice-to-have':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

// ---------------------------------------------------------------------------
// Goal Card Sub-Component
// ---------------------------------------------------------------------------

function GoalCard({
  goal,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  goal: FinancialGoal;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<FinancialGoal>) => void;
  onDelete: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const displayName = goal.name || 'Untitled Goal';

  const handleTypeChange = (value: string) => {
    const typeConfig = GOAL_TYPE_OPTIONS.find((opt) => opt.value === value);
    if (typeConfig) {
      onUpdate({
        type: value as GoalType,
        name: typeConfig.label,
        targetAmount: typeConfig.defaultAmount,
      });
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        expanded
          ? 'border-brand-300 bg-brand-50/30 shadow-sm'
          : 'border-surface-300 bg-white hover:border-brand-200'
      }`}
    >
      {/* ---- Collapsed Header ---- */}
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
        >
          {/* Priority color dot */}
          <span className={`w-3 h-3 rounded-full shrink-0 ${getPriorityDotColor(goal.priority)}`} />

          {/* Goal info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-primary-700 truncate">
                {displayName}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityBadgeClasses(
                  goal.priority
                )}`}
              >
                {goal.priority === 'nice-to-have' ? 'Nice to Have' : goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
              </span>
            </div>
            {!expanded && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target: {formatIndian(goal.targetAmount)} by {goal.targetYear}
              </p>
            )}
          </div>

          {/* Expand / Collapse icon */}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          className="ml-2 p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
          title="Remove goal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ---- Expanded Fields ---- */}
      {expanded && (
        <div className="px-4 pb-5 space-y-4 animate-slide-down">
          {/* Goal Type */}
          <SelectInput
            label="Goal Type"
            value={goal.type}
            onChange={handleTypeChange}
            options={SELECT_TYPE_OPTIONS}
            placeholder="Select a goal type"
          />

          {/* Goal Name */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              value={goal.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g. Retirement at 60, Son's IIT"
              className={INPUT_CLASS}
            />
          </div>

          {/* Target Amount Type — Present vs Future cost */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Is your target amount in today&apos;s prices, or already a future budget?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { value: 'present', title: 'Today\'s Prices', sub: 'We will inflate it to your target year', icon: '🪙' },
                { value: 'future', title: 'Future Cost', sub: 'Already adjusted by you — we use as-is', icon: '🎯' },
              ] as const).map((opt) => {
                const isActive = (goal.costType ?? 'present') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate({ costType: opt.value })}
                    className={`text-left rounded-xl border-2 px-3 py-2.5 transition-all ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/60'
                        : 'border-surface-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg">{opt.icon}</span>
                      <span className={`text-sm font-bold ${isActive ? 'text-brand-700' : 'text-slate-700'}`}>
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Most clients enter today&apos;s prices for goals like education or marriage, and a future budget when they have a hard cap (e.g. &ldquo;I want exactly ₹2 Cr at 60 for retirement&rdquo;).
            </p>
          </div>

          {/* Target Amount */}
          <CurrencyInput
            label={
              (goal.costType ?? 'present') === 'future'
                ? 'Target Amount (already a future budget)'
                : 'Target Amount (today\'s prices)'
            }
            value={goal.targetAmount}
            onChange={(v) => onUpdate({ targetAmount: v })}
            min={0}
            helpText={
              (goal.costType ?? 'present') === 'future'
                ? 'We will not apply any inflation. Use as-is.'
                : 'How much it would cost today. We will adjust for inflation.'
            }
          />

          {/* Inflation override — only when present cost */}
          {(goal.costType ?? 'present') === 'present' && (
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Expected Inflation for This Goal (optional)
              </label>
              <div className="flex items-stretch rounded-xl border border-surface-300 bg-white overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={20}
                  value={goal.customInflationRate ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    onUpdate({ customInflationRate: v === '' ? undefined : Math.max(0, Math.min(20, Number(v))) });
                  }}
                  placeholder={
                    goal.type === 'child-education' ? '10'
                    : goal.type === 'child-marriage' ? '8'
                    : goal.type === 'house-purchase' ? '7'
                    : '6'
                  }
                  className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-transparent tabular-nums"
                />
                <span className="px-3 py-2 bg-slate-50 text-slate-500 text-xs border-l border-slate-200 flex items-center">% p.a.</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Leave blank to use category default — Education 10%, Marriage 8%, Housing 7%, others 6%.
              </p>
            </div>
          )}

          {/* Target Year */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Target Year
            </label>
            <input
              type="number"
              value={goal.targetYear || ''}
              onChange={(e) => {
                const val = Math.min(
                  currentYear + 40,
                  Math.max(currentYear + 1, Number(e.target.value) || currentYear + 1)
                );
                onUpdate({ targetYear: val });
              }}
              min={currentYear + 1}
              max={currentYear + 40}
              placeholder={`${currentYear + 10}`}
              className={INPUT_CLASS}
            />
            <p className="text-xs text-slate-400 mt-1">
              Between {currentYear + 1} and {currentYear + 40}
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-2">
              Priority
            </label>
            <div className="flex gap-3">
              {GOAL_PRIORITY_OPTIONS.map((opt) => {
                const isSelected = goal.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate({ priority: opt.value })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      isSelected
                        ? 'shadow-sm'
                        : 'border-surface-300 bg-white text-slate-500 hover:border-slate-400'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: opt.color,
                            backgroundColor: `${opt.color}10`,
                            color: opt.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Savings for this Goal */}
          <CurrencyInput
            label="Current Savings for this Goal"
            value={goal.currentSavingsForGoal}
            onChange={(v) => onUpdate({ currentSavingsForGoal: v })}
            min={0}
            helpText="How much have you already saved specifically for this goal?"
          />

          {/* Live preview — Future cost when in present mode */}
          {(goal.costType ?? 'present') === 'present' && goal.targetAmount > 0 && goal.targetYear > currentYear && (() => {
            const yrs = goal.targetYear - currentYear;
            const rate =
              typeof goal.customInflationRate === 'number'
                ? goal.customInflationRate / 100
                : goal.type === 'child-education' ? 0.10
                : goal.type === 'child-marriage' ? 0.08
                : goal.type === 'house-purchase' ? 0.07
                : 0.06;
            const future = goal.targetAmount * Math.pow(1 + rate, yrs);
            return (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[12px] text-slate-700">
                <div className="font-semibold text-amber-700 mb-0.5">Future cost preview</div>
                <div>
                  At <span className="font-semibold">{(rate * 100).toFixed(1)}% p.a.</span> inflation over {yrs} years,
                  {' '}<span className="font-semibold">{formatIndian(goal.targetAmount)}</span> today
                  {' '}≈ <span className="font-extrabold text-amber-800">{formatIndian(Math.round(future))}</span> in {goal.targetYear}.
                </div>
                <div className="text-[10.5px] text-slate-500 mt-1">
                  If this looks too high, switch to <strong>Future Cost</strong> mode and enter the budget you actually want — we will not inflate it further.
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main GoalBuilder Component
// ---------------------------------------------------------------------------

export default function GoalBuilder({ goals, onChange }: GoalBuilderProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(
    goals.length > 0 ? goals[0].id : null
  );

  const addGoal = () => {
    if (goals.length >= MAX_GOALS) return;
    const newGoal = getDefaultGoal();
    const updated = [...goals, newGoal];
    onChange(updated);
    setExpandedGoalId(newGoal.id);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    onChange(updated);
    if (expandedGoalId === id) {
      setExpandedGoalId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateGoal = (id: string, updates: Partial<FinancialGoal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    onChange(updated);
  };

  const toggleGoal = (id: string) => {
    setExpandedGoalId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {/* Goal count indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Your Goals
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {goals.length} of {MAX_GOALS} goals
        </span>
      </div>

      {/* Goal cards */}
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          expanded={expandedGoalId === goal.id}
          onToggle={() => toggleGoal(goal.id)}
          onUpdate={(updates) => updateGoal(goal.id, updates)}
          onDelete={() => deleteGoal(goal.id)}
        />
      ))}

      {/* Add Goal button */}
      {goals.length < MAX_GOALS ? (
        <button
          type="button"
          onClick={addGoal}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-brand-300 text-brand-600 font-semibold text-sm hover:border-brand-500 hover:bg-brand-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      ) : (
        <p className="text-center text-xs text-slate-400 py-2">
          Maximum of {MAX_GOALS} goals reached. Remove a goal to add a new one.
        </p>
      )}
    </div>
  );
}
