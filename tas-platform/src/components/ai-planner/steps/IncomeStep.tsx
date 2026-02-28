"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Wallet, TrendingUp } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR } from "@/lib/utils/formatters";
import { getIncomePercentile } from "@/lib/constants/financial-constants";
import type { IncomeDetails } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function IncomeStep({ onNext, onPrev }: Props) {
  const { plan, setIncome } = useFinancialPlanStore();

  const [form, setForm] = useState({
    monthlySalary: plan.income?.monthlySalary || 75000,
    bonusAnnual: plan.income?.bonusAnnual || 100000,
    rentalIncome: plan.income?.rentalIncome || 0,
    businessIncome: plan.income?.businessIncome || 0,
    otherIncome: plan.income?.otherIncome || 0,
  });

  const computed = useMemo(() => {
    const totalMonthlyIncome =
      form.monthlySalary +
      form.bonusAnnual / 12 +
      form.rentalIncome +
      form.businessIncome +
      form.otherIncome;
    const totalAnnualIncome = totalMonthlyIncome * 12;
    return { totalMonthlyIncome, totalAnnualIncome };
  }, [form]);

  const percentile = useMemo(
    () => getIncomePercentile(computed.totalAnnualIncome),
    [computed.totalAnnualIncome]
  );

  const handleSubmit = () => {
    const data: IncomeDetails = {
      ...form,
      totalMonthlyIncome: Math.round(computed.totalMonthlyIncome),
      totalAnnualIncome: Math.round(computed.totalAnnualIncome),
    };
    setIncome(data);
    onNext();
  };

  const fields = [
    {
      key: "monthlySalary" as const,
      label: "Monthly Salary (Gross)",
      min: 0,
      max: 5000000,
      step: 5000,
    },
    {
      key: "bonusAnnual" as const,
      label: "Annual Bonus / Variable Pay",
      min: 0,
      max: 5000000,
      step: 10000,
    },
    {
      key: "rentalIncome" as const,
      label: "Monthly Rental Income",
      min: 0,
      max: 500000,
      step: 1000,
    },
    {
      key: "businessIncome" as const,
      label: "Monthly Business / Professional Income",
      min: 0,
      max: 5000000,
      step: 5000,
    },
    {
      key: "otherIncome" as const,
      label: "Other Monthly Income",
      min: 0,
      max: 500000,
      step: 1000,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <Wallet size={20} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Your Income
          </h2>
          <p className="text-sm text-gray-500">
            All sources of income (monthly unless specified)
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {fields.map((field) => (
          <div key={field.key}>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">
                {field.label}
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="mr-1 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.key]: Math.max(
                        field.min,
                        Math.min(field.max, Number(e.target.value))
                      ),
                    })
                  }
                  className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={form[field.key]}
              onChange={(e) =>
                setForm({ ...form, [field.key]: Number(e.target.value) })
              }
              className="w-full accent-emerald-500"
            />
          </div>
        ))}

        {/* Computed totals */}
        <div className="space-y-3 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 p-5">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Monthly Income</span>
            <span className="text-lg font-extrabold text-gray-900">
              {formatINR(Math.round(computed.totalMonthlyIncome))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Annual Income</span>
            <span className="text-sm font-bold text-gray-700">
              {formatINR(Math.round(computed.totalAnnualIncome))}
            </span>
          </div>
        </div>

        {/* Insight */}
        {computed.totalAnnualIncome > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <TrendingUp
              size={18}
              className="mt-0.5 flex-shrink-0 text-blue-600"
            />
            <p className="text-sm text-blue-800">
              Your annual income of{" "}
              <span className="font-bold">
                {formatINR(Math.round(computed.totalAnnualIncome))}
              </span>{" "}
              places you in the{" "}
              <span className="font-bold">top {100 - percentile}%</span> of
              income earners in India.
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
          Next: Expenses <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
