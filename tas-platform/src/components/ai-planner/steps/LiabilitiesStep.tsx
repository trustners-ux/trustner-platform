"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, CreditCard, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR } from "@/lib/utils/formatters";
import { BENCHMARKS } from "@/lib/constants/financial-constants";
import type { Liability, NetWorthStatement } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const LOAN_TEMPLATES: {
  type: Liability["type"];
  label: string;
  defaultRate: number;
  defaultTenure: number;
}[] = [
  { type: "home-loan", label: "Home Loan", defaultRate: 8.5, defaultTenure: 240 },
  { type: "car-loan", label: "Car Loan", defaultRate: 9.0, defaultTenure: 60 },
  { type: "personal-loan", label: "Personal Loan", defaultRate: 12.0, defaultTenure: 36 },
  { type: "education-loan", label: "Education Loan", defaultRate: 8.0, defaultTenure: 120 },
  { type: "credit-card", label: "Credit Card Debt", defaultRate: 36.0, defaultTenure: 12 },
  { type: "gold-loan", label: "Gold Loan", defaultRate: 9.5, defaultTenure: 24 },
  { type: "other", label: "Other Loan", defaultRate: 12.0, defaultTenure: 36 },
];

export default function LiabilitiesStep({ onNext, onPrev }: Props) {
  const { plan, setNetWorth } = useFinancialPlanStore();

  const [liabilities, setLiabilities] = useState<Liability[]>(
    plan.netWorth?.liabilities || []
  );

  const addLiability = (template: (typeof LOAN_TEMPLATES)[number]) => {
    setLiabilities([
      ...liabilities,
      {
        id: crypto.randomUUID(),
        type: template.type,
        name: template.label,
        outstandingAmount: 0,
        emi: 0,
        interestRate: template.defaultRate,
        remainingTenureMonths: template.defaultTenure,
      },
    ]);
  };

  const updateLiability = (id: string, field: string, value: number) => {
    setLiabilities(
      liabilities.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLiability = (id: string) => {
    setLiabilities(liabilities.filter((l) => l.id !== id));
  };

  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + l.outstandingAmount,
    0
  );
  const totalEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);
  const monthlyIncome = plan.income?.totalMonthlyIncome || 1;

  const emiToIncomeRatio = useMemo(
    () => (monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0),
    [totalEMI, monthlyIncome]
  );

  const handleSubmit = () => {
    const assets = plan.netWorth?.assets || [];
    const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
    const liquidAssets = assets
      .filter((a) => a.isLiquid)
      .reduce((s, a) => s + a.currentValue, 0);

    const data: NetWorthStatement = {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      liquidAssets,
    };
    setNetWorth(data);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
          <CreditCard size={20} className="text-rose-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            What You Owe
          </h2>
          <p className="text-sm text-gray-500">Add your loans and liabilities</p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Quick add */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-gray-400">
            Quick Add
          </p>
          <div className="flex flex-wrap gap-2">
            {LOAN_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => addLiability(t)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <Plus size={12} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {liabilities.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">
              No loans? That&apos;s great! Click Next to continue.
            </p>
          </div>
        )}

        {liabilities.map((loan) => (
          <div
            key={loan.id}
            className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">{loan.name}</p>
              <button
                onClick={() => removeLiability(loan.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-400">
                  Outstanding
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                  <span className="mr-1 text-xs text-gray-400">₹</span>
                  <input
                    type="number"
                    value={loan.outstandingAmount}
                    onChange={(e) =>
                      updateLiability(
                        loan.id,
                        "outstandingAmount",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-400">
                  Monthly EMI
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                  <span className="mr-1 text-xs text-gray-400">₹</span>
                  <input
                    type="number"
                    value={loan.emi}
                    onChange={(e) =>
                      updateLiability(
                        loan.id,
                        "emi",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-400">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={loan.interestRate}
                  onChange={(e) =>
                    updateLiability(
                      loan.id,
                      "interestRate",
                      Math.max(0, Math.min(50, Number(e.target.value)))
                    )
                  }
                  step={0.1}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-400">
                  Remaining (months)
                </label>
                <input
                  type="number"
                  value={loan.remainingTenureMonths}
                  onChange={(e) =>
                    updateLiability(
                      loan.id,
                      "remainingTenureMonths",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        {liabilities.length > 0 && (
          <div className="space-y-3 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 p-5">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Outstanding</span>
              <span className="text-lg font-extrabold text-gray-900">
                {formatINR(totalLiabilities)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Monthly EMI</span>
              <span className="text-sm font-bold text-rose-600">
                {formatINR(totalEMI)}
              </span>
            </div>
            <div className="border-t border-rose-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  EMI-to-Income Ratio
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    emiToIncomeRatio <= BENCHMARKS.emiToIncome.healthy
                      ? "bg-emerald-50 text-emerald-600"
                      : emiToIncomeRatio <= BENCHMARKS.emiToIncome.manageable
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {emiToIncomeRatio.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {emiToIncomeRatio > BENCHMARKS.emiToIncome.manageable && (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              Your EMI-to-income ratio is high ({emiToIncomeRatio.toFixed(0)}%).
              Ideally it should be under {BENCHMARKS.emiToIncome.manageable}%.
              Consider prepaying high-interest loans first.
            </p>
          </div>
        )}
      </div>

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
          Next: Insurance <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
