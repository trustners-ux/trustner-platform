"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Receipt, TrendingUp } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR } from "@/lib/utils/formatters";
import {
  calculateTaxOldRegime,
  calculateTaxNewRegime,
} from "@/lib/utils/financial-engine";
import type { TaxDetails } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const DEDUCTION_FIELDS = [
  {
    key: "section80C" as const,
    label: "Section 80C (ELSS, PPF, LIC, etc.)",
    max: 150000,
    step: 5000,
    default: 150000,
  },
  {
    key: "section80D" as const,
    label: "Section 80D (Health Insurance Premium)",
    max: 100000,
    step: 1000,
    default: 25000,
  },
  {
    key: "section80CCD1B" as const,
    label: "Section 80CCD(1B) (NPS)",
    max: 50000,
    step: 1000,
    default: 0,
  },
  {
    key: "hra" as const,
    label: "HRA Exemption",
    max: 500000,
    step: 5000,
    default: 0,
  },
  {
    key: "section80TTA" as const,
    label: "Section 80TTA (Savings Interest)",
    max: 10000,
    step: 500,
    default: 5000,
  },
  {
    key: "homeLoanInterest" as const,
    label: "Home Loan Interest u/s 24(b)",
    max: 200000,
    step: 5000,
    default: 0,
  },
];

type DeductionKey = (typeof DEDUCTION_FIELDS)[number]["key"];

export default function TaxStep({ onNext, onPrev }: Props) {
  const { plan, setTax } = useFinancialPlanStore();

  const grossIncome = plan.income?.totalAnnualIncome || 0;

  const [regime, setRegime] = useState<"old" | "new">(
    plan.tax?.regime || "new"
  );

  const [deductions, setDeductions] = useState<Record<DeductionKey, number>>(
    () => {
      const saved: Record<string, number> = {};
      DEDUCTION_FIELDS.forEach((f) => {
        saved[f.key] =
          (plan.tax as unknown as Record<string, number>)?.[f.key] ?? f.default;
      });
      return saved as Record<DeductionKey, number>;
    }
  );

  const taxComparison = useMemo(() => {
    const oldResult = calculateTaxOldRegime(grossIncome, {
      section80C: deductions.section80C,
      section80D: deductions.section80D,
      section80CCD1B: deductions.section80CCD1B,
      hra: deductions.hra,
      section80TTA: deductions.section80TTA,
      homeLoanInterest: deductions.homeLoanInterest,
    });

    const newResult = calculateTaxNewRegime(grossIncome);

    const betterRegime: "old" | "new" =
      oldResult.totalTax <= newResult.totalTax ? "old" : "new";
    const savings = Math.abs(oldResult.totalTax - newResult.totalTax);

    return { oldResult, newResult, betterRegime, savings };
  }, [grossIncome, deductions]);

  const totalDeductions = useMemo(
    () => Object.values(deductions).reduce((a, b) => a + b, 0),
    [deductions]
  );

  const activeResult =
    regime === "old" ? taxComparison.oldResult : taxComparison.newResult;

  const handleSubmit = () => {
    const data: TaxDetails = {
      regime,
      grossIncome,
      section80C: deductions.section80C,
      section80D: deductions.section80D,
      section80CCD1B: deductions.section80CCD1B,
      hra: deductions.hra,
      section80TTA: deductions.section80TTA,
      homeLoanInterest: deductions.homeLoanInterest,
      otherDeductions: 0,
      totalDeductions: totalDeductions,
      taxableIncome: activeResult.taxableIncome,
      taxPayable: activeResult.totalTax,
      effectiveRate:
        grossIncome > 0
          ? Math.round((activeResult.totalTax / grossIncome) * 1000) / 10
          : 0,
      potentialSavings: taxComparison.savings,
    };

    setTax(data);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
          <Receipt size={20} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Tax Details
          </h2>
          <p className="text-sm text-gray-500">
            Deductions and tax regime for FY 2025-26
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Gross income display */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-bold text-gray-700">
            Gross Annual Income
          </span>
          <span className="text-lg font-extrabold text-gray-900">
            {formatINR(grossIncome)}
          </span>
        </div>

        {/* Tax Regime Toggle */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Preferred Tax Regime
          </label>
          <div className="flex gap-2">
            {(["old", "new"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegime(r)}
                className={`flex-1 rounded-xl border-2 py-3 text-center transition ${
                  regime === r
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <p
                  className={`text-sm font-bold ${regime === r ? "text-teal-700" : "text-gray-500"}`}
                >
                  {r === "old" ? "Old Regime" : "New Regime"}
                </p>
                <p className="text-[11px] text-gray-400">
                  {r === "old"
                    ? "With deductions"
                    : "Lower rates, fewer deductions"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Deduction Sliders (only meaningful for old regime, but we collect anyway) */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase text-gray-400">
            Deductions (applicable under Old Regime)
          </p>
          <div className="space-y-4">
            {DEDUCTION_FIELDS.map((field) => (
              <div key={field.key}>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    {field.label}
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
                    <span className="mr-1 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      value={deductions[field.key]}
                      onChange={(e) =>
                        setDeductions({
                          ...deductions,
                          [field.key]: Math.max(
                            0,
                            Math.min(field.max, Number(e.target.value))
                          ),
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
                  value={deductions[field.key]}
                  onChange={(e) =>
                    setDeductions({
                      ...deductions,
                      [field.key]: Number(e.target.value),
                    })
                  }
                  className="w-full accent-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tax Comparison */}
        <div className="space-y-3 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 p-5">
          <p className="text-xs font-bold uppercase text-gray-400">
            Tax Comparison
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div
              className={`rounded-xl border-2 p-4 ${
                taxComparison.betterRegime === "old"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <p className="mb-1 text-xs font-bold text-gray-500">
                Old Regime
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                {formatINR(taxComparison.oldResult.totalTax)}
              </p>
              <p className="text-[11px] text-gray-400">
                Taxable: {formatINR(taxComparison.oldResult.taxableIncome)}
              </p>
              {taxComparison.betterRegime === "old" && (
                <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                  Better
                </span>
              )}
            </div>

            <div
              className={`rounded-xl border-2 p-4 ${
                taxComparison.betterRegime === "new"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <p className="mb-1 text-xs font-bold text-gray-500">
                New Regime
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                {formatINR(taxComparison.newResult.totalTax)}
              </p>
              <p className="text-[11px] text-gray-400">
                Taxable: {formatINR(taxComparison.newResult.taxableIncome)}
              </p>
              {taxComparison.betterRegime === "new" && (
                <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                  Better
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Insight */}
        {grossIncome > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <TrendingUp
              size={18}
              className="mt-0.5 flex-shrink-0 text-blue-600"
            />
            <p className="text-sm text-blue-800">
              Based on your deductions of{" "}
              <span className="font-bold">{formatINR(totalDeductions)}</span>,
              the{" "}
              <span className="font-bold">
                {taxComparison.betterRegime === "old"
                  ? "Old Regime"
                  : "New Regime"}
              </span>{" "}
              saves you{" "}
              <span className="font-bold">
                {formatINR(taxComparison.savings)}
              </span>{" "}
              more. Effective tax rate:{" "}
              <span className="font-bold">
                {grossIncome > 0
                  ? (
                      (Math.min(
                        taxComparison.oldResult.totalTax,
                        taxComparison.newResult.totalTax
                      ) /
                        grossIncome) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </span>
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
          Next: Review <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
