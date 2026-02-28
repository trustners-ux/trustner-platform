"use client";

import { useState, useMemo } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Clock,
  GraduationCap,
  Home,
  Car,
  Heart,
  Shield,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import type { FinancialGoal, GoalType } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const GOAL_TEMPLATES: {
  type: GoalType;
  name: string;
  icon: React.ElementType;
  defaultAmount: number;
  defaultYears: number;
  color: string;
}[] = [
  {
    type: "retirement",
    name: "Retirement",
    icon: Clock,
    defaultAmount: 50000000,
    defaultYears: 25,
    color: "text-amber-600 bg-amber-100",
  },
  {
    type: "child-education",
    name: "Child Education",
    icon: GraduationCap,
    defaultAmount: 3000000,
    defaultYears: 15,
    color: "text-blue-600 bg-blue-100",
  },
  {
    type: "house",
    name: "Buy a House",
    icon: Home,
    defaultAmount: 10000000,
    defaultYears: 10,
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    type: "car",
    name: "Buy a Car",
    icon: Car,
    defaultAmount: 1500000,
    defaultYears: 3,
    color: "text-purple-600 bg-purple-100",
  },
  {
    type: "wedding",
    name: "Wedding",
    icon: Heart,
    defaultAmount: 2000000,
    defaultYears: 5,
    color: "text-rose-600 bg-rose-100",
  },
  {
    type: "emergency-fund",
    name: "Emergency Fund",
    icon: Shield,
    defaultAmount: 500000,
    defaultYears: 1,
    color: "text-teal-600 bg-teal-100",
  },
];

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "border-red-500 bg-red-50 text-red-700" },
  { value: "important", label: "Important", color: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "aspirational", label: "Aspirational", color: "border-blue-500 bg-blue-50 text-blue-700" },
] as const;

const INFLATION_RATE = 6;
const currentYear = new Date().getFullYear();

function calculateInflatedTarget(amount: number, years: number): number {
  return Math.round(amount * Math.pow(1 + INFLATION_RATE / 100, years));
}

export default function GoalsStep({ onNext, onPrev }: Props) {
  const { plan, setGoals } = useFinancialPlanStore();

  const [goals, setGoalsLocal] = useState<FinancialGoal[]>(
    plan.goals || []
  );

  const [customGoalName, setCustomGoalName] = useState("");

  const addGoal = (
    type: GoalType,
    name: string,
    defaultAmount: number,
    defaultYears: number
  ) => {
    const targetYear = currentYear + defaultYears;
    const inflatedTarget = calculateInflatedTarget(defaultAmount, defaultYears);

    setGoalsLocal([
      ...goals,
      {
        id: crypto.randomUUID(),
        name,
        type,
        targetAmount: defaultAmount,
        targetYear,
        inflationRate: INFLATION_RATE,
        inflatedTarget,
        currentAllocation: 0,
        priority: "important",
        recommendedSIP: 0,
        recommendedAllocation: "",
      },
    ]);
  };

  const addCustomGoal = () => {
    if (!customGoalName.trim()) return;
    addGoal("custom", customGoalName.trim(), 1000000, 5);
    setCustomGoalName("");
  };

  const updateGoal = (id: string, updates: Partial<FinancialGoal>) => {
    setGoalsLocal(
      goals.map((g) => {
        if (g.id !== id) return g;
        const updated = { ...g, ...updates };
        // Recalculate inflated target when amount or year changes
        if (updates.targetAmount !== undefined || updates.targetYear !== undefined) {
          const years = Math.max(0, updated.targetYear - currentYear);
          updated.inflatedTarget = calculateInflatedTarget(
            updated.targetAmount,
            years
          );
        }
        return updated;
      })
    );
  };

  const removeGoal = (id: string) => {
    setGoalsLocal(goals.filter((g) => g.id !== id));
  };

  // Templates not yet added (unique by type, allow multiple custom)
  const availableTemplates = GOAL_TEMPLATES.filter(
    (t) => !goals.some((g) => g.type === t.type)
  );

  const totalInflatedTarget = useMemo(
    () => goals.reduce((sum, g) => sum + g.inflatedTarget, 0),
    [goals]
  );

  const handleSubmit = () => {
    setGoals(goals);
    onNext();
  };

  const getTemplateForGoal = (type: GoalType) =>
    GOAL_TEMPLATES.find((t) => t.type === type);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Target size={20} className="text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Financial Goals
          </h2>
          <p className="text-sm text-gray-500">
            What are you saving and investing for?
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Goal template cards */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-gray-400">
            Add a Goal
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableTemplates.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.type}
                  onClick={() => addGoal(t.type, t.name, t.defaultAmount, t.defaultYears)}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.color}`}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-700">
                    {t.name}
                  </span>
                </button>
              );
            })}
            {/* Custom goal */}
            <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-3">
              <input
                type="text"
                value={customGoalName}
                onChange={(e) => setCustomGoalName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomGoal()}
                placeholder="Custom goal..."
                className="min-w-0 flex-1 bg-transparent text-xs font-medium text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                onClick={addCustomGoal}
                disabled={!customGoalName.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition hover:bg-blue-200 disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <Target size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">
              Add at least one financial goal to get personalized recommendations
            </p>
          </div>
        )}

        {/* Goal cards */}
        {goals.map((goal) => {
          const template = getTemplateForGoal(goal.type);
          const Icon = template?.icon || Target;
          const colorClass = template?.color || "text-gray-600 bg-gray-100";
          const yearsAway = Math.max(0, goal.targetYear - currentYear);

          return (
            <div
              key={goal.id}
              className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      {goal.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {yearsAway} year{yearsAway !== 1 ? "s" : ""} away
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Target Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500">
                    Target Amount (today&apos;s value)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1">
                    <span className="mr-1 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      value={goal.targetAmount}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          targetAmount: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={
                    goal.type === "retirement"
                      ? 200000000
                      : goal.type === "house"
                        ? 50000000
                        : 20000000
                  }
                  step={
                    goal.type === "retirement"
                      ? 500000
                      : goal.type === "house"
                        ? 100000
                        : 50000
                  }
                  value={goal.targetAmount}
                  onChange={(e) =>
                    updateGoal(goal.id, {
                      targetAmount: Number(e.target.value),
                    })
                  }
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Target Year */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500">
                    Target Year
                  </label>
                  <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-bold text-gray-900">
                    {goal.targetYear}
                  </span>
                </div>
                <input
                  type="range"
                  min={currentYear}
                  max={2060}
                  value={goal.targetYear}
                  onChange={(e) =>
                    updateGoal(goal.id, {
                      targetYear: Number(e.target.value),
                    })
                  }
                  className="w-full accent-orange-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{currentYear}</span>
                  <span>2060</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-500">
                  Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        updateGoal(goal.id, { priority: opt.value })
                      }
                      className={`flex-1 rounded-xl border-2 py-2 text-xs font-bold transition ${
                        goal.priority === opt.value
                          ? opt.color
                          : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflation adjusted */}
              <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
                <span className="text-xs text-gray-500">
                  Inflation-adjusted target ({INFLATION_RATE}% p.a.)
                </span>
                <span className="text-sm font-bold text-orange-700">
                  {formatLakhsCrores(goal.inflatedTarget)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        {goals.length > 0 && (
          <div className="space-y-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-5">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Goals</span>
              <span className="text-lg font-extrabold text-gray-900">
                {goals.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">
                Total Target (inflation-adjusted)
              </span>
              <span className="text-sm font-bold text-orange-700">
                {formatLakhsCrores(totalInflatedTarget)}
              </span>
            </div>
          </div>
        )}

        {/* Insight */}
        {goals.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <TrendingUp
              size={18}
              className="mt-0.5 flex-shrink-0 text-blue-600"
            />
            <p className="text-sm text-blue-800">
              With {INFLATION_RATE}% inflation, your goals will cost{" "}
              <span className="font-bold">
                {formatLakhsCrores(totalInflatedTarget)}
              </span>{" "}
              in today&apos;s terms. We&apos;ll calculate the exact SIP needed
              for each goal in the final analysis.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Next: Risk Profile <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
