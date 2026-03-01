"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, RotateCcw, FlaskConical } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { calculateFinancialHealthScore } from "@/lib/utils/financial-engine";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import type { FinancialPlan, FinancialAnalysis } from "@/types/financial-plan";

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}

/**
 * ScenarioModeler — Interactive what-if scenario panel.
 *
 * Lets users adjust key financial assumptions (retirement age, inflation,
 * expected returns, income change, additional SIP) and see real-time impact
 * on their financial plan without saving changes.
 */
export default function ScenarioModeler() {
  const { plan } = useFinancialPlanStore();
  const baseAnalysis = plan?.analysis;
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract defaults from plan
  const defaultRetirementAge = useMemo(() => {
    const retGoal = plan?.goals?.find((g) => g.type === "retirement");
    if (retGoal && plan?.personal?.age) {
      const currentYear = new Date().getFullYear();
      return plan.personal.age + (retGoal.targetYear - currentYear);
    }
    return 60;
  }, [plan?.goals, plan?.personal?.age]);

  const defaultInflation = 6;
  const defaultReturn = useMemo(() => {
    if (!plan?.riskProfile) return 10;
    const type = plan.riskProfile.type;
    if (type === "aggressive") return 13;
    if (type === "moderately_aggressive") return 12;
    if (type === "moderate") return 10;
    if (type === "conservative") return 8;
    return 10;
  }, [plan?.riskProfile]);

  // Slider states
  const [retirementAge, setRetirementAge] = useState(defaultRetirementAge);
  const [inflationRate, setInflationRate] = useState(defaultInflation);
  const [expectedReturn, setExpectedReturn] = useState(defaultReturn);
  const [incomeChange, setIncomeChange] = useState(0);
  const [additionalSIP, setAdditionalSIP] = useState(0);

  const sliders: (SliderConfig & {
    value: number;
    setValue: (v: number) => void;
  })[] = [
    {
      key: "retirementAge",
      label: "Retirement Age",
      min: 45,
      max: 70,
      step: 1,
      unit: " yrs",
      defaultValue: defaultRetirementAge,
      value: retirementAge,
      setValue: setRetirementAge,
    },
    {
      key: "inflationRate",
      label: "Inflation Rate",
      min: 4,
      max: 10,
      step: 0.5,
      unit: "%",
      defaultValue: defaultInflation,
      value: inflationRate,
      setValue: setInflationRate,
    },
    {
      key: "expectedReturn",
      label: "Expected Return",
      min: 6,
      max: 15,
      step: 0.5,
      unit: "%",
      defaultValue: defaultReturn,
      value: expectedReturn,
      setValue: setExpectedReturn,
    },
    {
      key: "incomeChange",
      label: "Income Change",
      min: -20,
      max: 50,
      step: 5,
      unit: "%",
      defaultValue: 0,
      value: incomeChange,
      setValue: setIncomeChange,
    },
    {
      key: "additionalSIP",
      label: "Additional SIP",
      min: 0,
      max: 50000,
      step: 1000,
      unit: "",
      defaultValue: 0,
      value: additionalSIP,
      setValue: setAdditionalSIP,
    },
  ];

  const hasChanges = sliders.some((s) => s.value !== s.defaultValue);

  // Recompute analysis with scenario overrides
  const scenarioAnalysis = useMemo<FinancialAnalysis | null>(() => {
    if (!plan?.personal || !plan?.income || !plan?.expenses || !plan?.netWorth || !plan?.insurance || !plan?.goals || !plan?.tax || !plan?.riskProfile) {
      return null;
    }
    if (!hasChanges) return null;

    try {
      // Deep clone plan data
      const scenarioPlan: FinancialPlan = JSON.parse(JSON.stringify(plan));

      // Apply income change
      if (incomeChange !== 0) {
        const multiplier = 1 + incomeChange / 100;
        scenarioPlan.income.monthlySalary = Math.round(scenarioPlan.income.monthlySalary * multiplier);
        scenarioPlan.income.totalMonthlyIncome = Math.round(scenarioPlan.income.totalMonthlyIncome * multiplier);
        scenarioPlan.income.totalAnnualIncome = Math.round(scenarioPlan.income.totalAnnualIncome * multiplier);
        // Recalculate surplus
        scenarioPlan.expenses.monthlySurplus =
          scenarioPlan.income.totalMonthlyIncome - scenarioPlan.expenses.totalMonthlyExpenses;
      }

      // Apply additional SIP — treat as additional savings added to monthly surplus
      if (additionalSIP > 0) {
        scenarioPlan.expenses.monthlySurplus += additionalSIP;
      }

      // Apply retirement age change to retirement goal
      if (retirementAge !== defaultRetirementAge) {
        const retGoal = scenarioPlan.goals.find((g) => g.type === "retirement");
        if (retGoal) {
          const currentYear = new Date().getFullYear();
          retGoal.targetYear = currentYear + (retirementAge - scenarioPlan.personal.age);
        }
      }

      return calculateFinancialHealthScore(scenarioPlan);
    } catch {
      return null;
    }
  }, [plan, hasChanges, incomeChange, additionalSIP, retirementAge, defaultRetirementAge, inflationRate, expectedReturn]);

  const resetAll = useCallback(() => {
    setRetirementAge(defaultRetirementAge);
    setInflationRate(defaultInflation);
    setExpectedReturn(defaultReturn);
    setIncomeChange(0);
    setAdditionalSIP(0);
  }, [defaultRetirementAge, defaultReturn]);

  if (!baseAnalysis) return null;

  // Comparison metrics
  const comparisonData = scenarioAnalysis
    ? [
        {
          label: "Overall Score",
          base: baseAnalysis.overallScore,
          scenario: scenarioAnalysis.overallScore,
          format: (v: number) => `${v}/100`,
        },
        {
          label: "Retirement Score",
          base: baseAnalysis.retirementScore,
          scenario: scenarioAnalysis.retirementScore,
          format: (v: number) => `${v}/100`,
        },
        {
          label: "Monthly Surplus",
          base:
            plan?.expenses?.monthlySurplus ?? 0,
          scenario:
            (plan?.expenses?.monthlySurplus ?? 0) *
              (1 + incomeChange / 100) +
            additionalSIP,
          format: (v: number) => formatINR(v),
        },
        {
          label: "Savings Rate",
          base: baseAnalysis.savingsRate,
          scenario: scenarioAnalysis.savingsRate,
          format: (v: number) => `${v.toFixed(0)}%`,
        },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <FlaskConical className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              What-If Scenarios
            </h3>
            <p className="text-xs text-gray-500">
              Adjust assumptions and see real-time impact on your plan
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-5">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Sliders */}
            <div className="space-y-5">
              {sliders.map((slider) => (
                <div key={slider.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">
                      {slider.label}
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {slider.key === "additionalSIP"
                        ? formatINR(slider.value)
                        : `${slider.value}${slider.unit}`}
                      {slider.value !== slider.defaultValue && (
                        <span className="ml-1.5 text-[10px] font-semibold text-violet-600">
                          (changed)
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={slider.value}
                    onChange={(e) => slider.setValue(Number(e.target.value))}
                    className="w-full cursor-pointer accent-violet-600"
                  />
                  <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
                    <span>
                      {slider.key === "additionalSIP"
                        ? formatINR(slider.min)
                        : `${slider.min}${slider.unit}`}
                    </span>
                    <span>
                      {slider.key === "additionalSIP"
                        ? formatINR(slider.max)
                        : `${slider.max}${slider.unit}`}
                    </span>
                  </div>
                </div>
              ))}

              {/* Reset button */}
              {hasChanges && (
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
                </button>
              )}
            </div>

            {/* Right: Results comparison */}
            <div>
              {!hasChanges ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 p-8 text-center">
                  <div>
                    <FlaskConical className="mx-auto mb-3 w-8 h-8 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">
                      Adjust the sliders to see how changes affect your plan
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try changing retirement age, inflation, or adding a SIP
                    </p>
                  </div>
                </div>
              ) : scenarioAnalysis ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Impact Analysis
                  </h4>
                  {comparisonData.map((item) => {
                    const delta = item.scenario - item.base;
                    const isPositive = delta > 0;
                    const isNeutral = delta === 0;
                    return (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="mb-2 text-xs font-semibold text-gray-500">
                          {item.label}
                        </p>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400">
                              Base Case
                            </p>
                            <p className="text-sm font-bold text-gray-700">
                              {item.format(item.base)}
                            </p>
                          </div>
                          <div className="text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isNeutral
                                  ? "bg-gray-100 text-gray-500"
                                  : isPositive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isNeutral
                                ? "No change"
                                : isPositive
                                  ? `+${typeof item.base === "number" && item.base > 1000 ? formatINR(delta) : delta.toFixed(1)} ↑`
                                  : `${typeof item.base === "number" && item.base > 1000 ? formatINR(delta) : delta.toFixed(1)} ↓`}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">
                              Scenario
                            </p>
                            <p
                              className={`text-sm font-bold ${
                                isNeutral
                                  ? "text-gray-700"
                                  : isPositive
                                    ? "text-emerald-700"
                                    : "text-red-700"
                              }`}
                            >
                              {item.format(item.scenario)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 p-8">
                  <p className="text-sm text-gray-500">
                    Unable to compute scenario. Ensure plan data is complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
