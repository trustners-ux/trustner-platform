"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Receipt, AlertTriangle } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR } from "@/lib/utils/formatters";
import { BENCHMARKS } from "@/lib/constants/financial-constants";
import type { ExpenseDetails } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const EXPENSE_FIELDS = [
  { key: "housing" as const, label: "Housing (Rent / EMI)", max: 300000, step: 1000, icon: "🏠" },
  { key: "utilities" as const, label: "Utilities (Electric, Water, Internet)", max: 50000, step: 500, icon: "💡" },
  { key: "groceries" as const, label: "Groceries & Food", max: 100000, step: 500, icon: "🛒" },
  { key: "transportation" as const, label: "Transportation / Fuel", max: 50000, step: 500, icon: "🚗" },
  { key: "education" as const, label: "Children's Education / School Fees", max: 200000, step: 1000, icon: "📚" },
  { key: "healthcare" as const, label: "Healthcare / Medical", max: 100000, step: 500, icon: "🏥" },
  { key: "entertainment" as const, label: "Entertainment / Dining Out", max: 100000, step: 500, icon: "🎬" },
  { key: "personalCare" as const, label: "Personal Care / Shopping", max: 100000, step: 500, icon: "👔" },
  { key: "insurance" as const, label: "Insurance Premiums", max: 100000, step: 500, icon: "🛡️" },
  { key: "emiPayments" as const, label: "Loan EMIs (Non-Housing)", max: 200000, step: 1000, icon: "💳" },
  { key: "domesticHelp" as const, label: "Domestic Help / Staff", max: 50000, step: 500, icon: "🏡" },
  { key: "other" as const, label: "Other Expenses", max: 100000, step: 500, icon: "📦" },
];

type ExpenseKey = typeof EXPENSE_FIELDS[number]["key"];

export default function ExpenseStep({ onNext, onPrev }: Props) {
  const { plan, setExpenses } = useFinancialPlanStore();

  const defaults: Record<ExpenseKey, number> = {
    housing: 20000,
    utilities: 3000,
    groceries: 8000,
    transportation: 5000,
    education: 5000,
    healthcare: 2000,
    entertainment: 3000,
    personalCare: 2000,
    insurance: 3000,
    emiPayments: 0,
    domesticHelp: 2000,
    other: 2000,
  };

  const [form, setForm] = useState<Record<ExpenseKey, number>>(() => {
    const saved: Record<string, number> = {};
    EXPENSE_FIELDS.forEach((f) => {
      saved[f.key] = (plan.expenses as unknown as Record<string, number>)?.[f.key] ?? defaults[f.key];
    });
    return saved as Record<ExpenseKey, number>;
  });

  const monthlyIncome = plan.income?.totalMonthlyIncome || 1;

  const computed = useMemo(() => {
    const total = Object.values(form).reduce((a, b) => a + b, 0);
    const surplus = monthlyIncome - total;
    const rate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;
    return { total, surplus, rate };
  }, [form, monthlyIncome]);

  const getSavingsStatus = () => {
    if (computed.rate >= BENCHMARKS.savingsRate.excellent)
      return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (computed.rate >= BENCHMARKS.savingsRate.good)
      return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (computed.rate >= BENCHMARKS.savingsRate.fair)
      return { label: "Fair", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-50" };
  };

  const status = getSavingsStatus();

  const handleSubmit = () => {
    const data: ExpenseDetails = {
      ...form,
      totalMonthlyExpenses: Math.round(computed.total),
      monthlySurplus: Math.round(computed.surplus),
      savingsRate: Math.round(computed.rate * 10) / 10,
    };
    setExpenses(data);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Receipt size={20} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Monthly Expenses
          </h2>
          <p className="text-sm text-gray-500">
            Enter your approximate monthly spending by category
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {EXPENSE_FIELDS.map((field) => (
          <div key={field.key}>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <span className="text-base">{field.icon}</span>
                {field.label}
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
                <span className="mr-1 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.key]: Math.max(0, Math.min(field.max, Number(e.target.value))),
                    })
                  }
                  className="w-20 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={field.max}
              step={field.step}
              value={form[field.key]}
              onChange={(e) =>
                setForm({ ...form, [field.key]: Number(e.target.value) })
              }
              className="w-full accent-amber-500"
            />
          </div>
        ))}

        {/* Summary */}
        <div className="space-y-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Monthly Expenses</span>
            <span className="text-lg font-extrabold text-gray-900">
              {formatINR(Math.round(computed.total))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Monthly Surplus</span>
            <span
              className={`text-lg font-extrabold ${computed.surplus >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatINR(Math.round(computed.surplus))}
            </span>
          </div>
          <div className="border-t border-amber-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">
                Savings Rate
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${status.bg} ${status.color}`}
              >
                {computed.rate.toFixed(1)}% — {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Warning if overspending */}
        {computed.surplus < 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              Your expenses exceed your income by{" "}
              <span className="font-bold">{formatINR(Math.abs(computed.surplus))}</span>{" "}
              per month. Consider reviewing your expenses.
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
          Next: Assets <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
