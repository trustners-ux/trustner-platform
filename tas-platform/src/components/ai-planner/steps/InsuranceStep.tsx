"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import { INSURANCE_BENCHMARKS } from "@/lib/constants/financial-constants";
import type {
  InsuranceCoverage,
  HealthPolicy,
  TermPolicy,
  OtherLifePolicy,
} from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const OTHER_LIFE_TYPES = [
  { value: "endowment", label: "Endowment" },
  { value: "ulip", label: "ULIP" },
  { value: "moneyback", label: "Money Back" },
  { value: "wholelife", label: "Whole Life" },
] as const;

export default function InsuranceStep({ onNext, onPrev }: Props) {
  const { plan, setInsurance } = useFinancialPlanStore();

  const [hasHealthInsurance, setHasHealthInsurance] = useState(
    plan.insurance?.hasHealthInsurance ?? true
  );
  const [healthCover, setHealthCover] = useState(
    plan.insurance?.totalHealthCover || 500000
  );

  const [hasTermInsurance, setHasTermInsurance] = useState(
    plan.insurance?.hasTermInsurance ?? false
  );
  const [termCover, setTermCover] = useState(
    plan.insurance?.termPolicies?.[0]?.sumAssured || 0
  );

  const [hasOtherLifeInsurance, setHasOtherLifeInsurance] = useState(
    plan.insurance?.hasOtherLifeInsurance ?? false
  );
  const [otherLifeType, setOtherLifeType] = useState<OtherLifePolicy["type"]>(
    plan.insurance?.otherLifePolicies?.[0]?.type || "endowment"
  );
  const [otherLifeValue, setOtherLifeValue] = useState(
    plan.insurance?.otherLifePolicies?.[0]?.currentValue || 0
  );

  const [totalPremium, setTotalPremium] = useState(() => {
    const hp = plan.insurance?.healthPolicies?.reduce((s, p) => s + p.annualPremium, 0) || 0;
    const tp = plan.insurance?.termPolicies?.reduce((s, p) => s + p.annualPremium, 0) || 0;
    const op = plan.insurance?.otherLifePolicies?.reduce((s, p) => s + p.annualPremium, 0) || 0;
    return hp + tp + op || 25000;
  });

  const annualIncome = plan.income?.totalAnnualIncome || 0;
  const age = plan.personal?.age || 30;
  const city = plan.personal?.city || "tier2";

  const insights = useMemo(() => {
    const recommendedTerm = annualIncome * INSURANCE_BENCHMARKS.termInsuranceMultiple;
    const recommendedHealth =
      city === "metro"
        ? INSURANCE_BENCHMARKS.metroHealthCover
        : INSURANCE_BENCHMARKS.idealHealthCover;

    const effectiveHealthCover = hasHealthInsurance ? healthCover : 0;
    const effectiveTermCover = hasTermInsurance ? termCover : 0;

    const healthGap = Math.max(0, recommendedHealth - effectiveHealthCover);
    const termGap = Math.max(0, recommendedTerm - effectiveTermCover);

    return {
      recommendedTerm,
      recommendedHealth,
      effectiveHealthCover,
      effectiveTermCover,
      healthGap,
      termGap,
      healthAdequate: healthGap === 0,
      termAdequate: termGap === 0,
    };
  }, [annualIncome, city, hasHealthInsurance, healthCover, hasTermInsurance, termCover]);

  const handleSubmit = () => {
    const healthPolicies: HealthPolicy[] = hasHealthInsurance
      ? [
          {
            id: crypto.randomUUID(),
            insurer: "Existing Policy",
            type: "floater",
            sumInsured: healthCover,
            annualPremium: Math.round(totalPremium * 0.4),
            coveredMembers: (plan.personal?.dependents || 0) + 1,
          },
        ]
      : [];

    const termPolicies: TermPolicy[] = hasTermInsurance
      ? [
          {
            id: crypto.randomUUID(),
            insurer: "Existing Policy",
            sumAssured: termCover,
            annualPremium: Math.round(totalPremium * 0.3),
            policyTenure: Math.max(1, 60 - age),
            remainingYears: Math.max(1, 60 - age),
          },
        ]
      : [];

    const otherLifePolicies: OtherLifePolicy[] = hasOtherLifeInsurance
      ? [
          {
            id: crypto.randomUUID(),
            type: otherLifeType,
            sumAssured: otherLifeValue * 2,
            annualPremium: Math.round(totalPremium * 0.3),
            currentValue: otherLifeValue,
          },
        ]
      : [];

    const totalLifeCover =
      (hasTermInsurance ? termCover : 0) +
      (hasOtherLifeInsurance ? otherLifeValue * 2 : 0);

    const data: InsuranceCoverage = {
      hasHealthInsurance,
      healthPolicies,
      hasTermInsurance,
      termPolicies,
      hasOtherLifeInsurance,
      otherLifePolicies,
      totalHealthCover: hasHealthInsurance ? healthCover : 0,
      totalLifeCover,
    };

    setInsurance(data);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Shield size={20} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Insurance Coverage
          </h2>
          <p className="text-sm text-gray-500">
            Your safety net against life&apos;s uncertainties
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Health Insurance */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Do you have Health Insurance?
          </label>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setHasHealthInsurance(val)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  hasHealthInsurance === val
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        {hasHealthInsurance && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">
                Total Health Insurance Cover
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="mr-1 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  value={healthCover}
                  onChange={(e) =>
                    setHealthCover(
                      Math.max(0, Math.min(10000000, Number(e.target.value)))
                    )
                  }
                  className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10000000}
              step={100000}
              value={healthCover}
              onChange={(e) => setHealthCover(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>₹0</span>
              <span>₹1 Cr</span>
            </div>
          </div>
        )}

        {/* Term Insurance */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Do you have Term Insurance?
          </label>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setHasTermInsurance(val)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  hasTermInsurance === val
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        {hasTermInsurance && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">
                Total Term Insurance Cover
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="mr-1 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  value={termCover}
                  onChange={(e) =>
                    setTermCover(
                      Math.max(0, Math.min(100000000, Number(e.target.value)))
                    )
                  }
                  className="w-28 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100000000}
              step={500000}
              value={termCover}
              onChange={(e) => setTermCover(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>₹0</span>
              <span>₹10 Cr</span>
            </div>
          </div>
        )}

        {/* Other Life Insurance */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Do you have other Life Insurance (Endowment, ULIP, etc.)?
          </label>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setHasOtherLifeInsurance(val)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  hasOtherLifeInsurance === val
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        {hasOtherLifeInsurance && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Policy Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OTHER_LIFE_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOtherLifeType(opt.value)}
                    className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                      otherLifeType === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">
                  Current Policy Value
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                  <span className="mr-1 text-sm text-gray-400">₹</span>
                  <input
                    type="number"
                    value={otherLifeValue}
                    onChange={(e) =>
                      setOtherLifeValue(
                        Math.max(0, Math.min(10000000, Number(e.target.value)))
                      )
                    }
                    className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10000000}
                step={50000}
                value={otherLifeValue}
                onChange={(e) => setOtherLifeValue(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>₹0</span>
                <span>₹1 Cr</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Annual Premium */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700">
              Total Annual Premium (All Insurance)
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
              <span className="mr-1 text-sm text-gray-400">₹</span>
              <input
                type="number"
                value={totalPremium}
                onChange={(e) =>
                  setTotalPremium(
                    Math.max(0, Math.min(500000, Number(e.target.value)))
                  )
                }
                className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={500000}
            step={1000}
            value={totalPremium}
            onChange={(e) => setTotalPremium(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>₹0</span>
            <span>₹5L</span>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-5">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Health Cover</span>
            <span className="text-sm font-bold text-gray-900">
              {hasHealthInsurance ? formatLakhsCrores(healthCover) : "None"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Life Cover (Term)</span>
            <span className="text-sm font-bold text-gray-900">
              {hasTermInsurance ? formatLakhsCrores(termCover) : "None"}
            </span>
          </div>
          {hasOtherLifeInsurance && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">
                Other Life ({otherLifeType})
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatLakhsCrores(otherLifeValue)}
              </span>
            </div>
          )}
          <div className="border-t border-purple-200 pt-3">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-700">
                Annual Premium
              </span>
              <span className="text-sm font-bold text-purple-700">
                {formatINR(totalPremium)}
              </span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {annualIncome > 0 && (
          <div className="space-y-2">
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                insights.healthAdequate
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-amber-100 bg-amber-50"
              }`}
            >
              {insights.healthAdequate ? (
                <CheckCircle
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-emerald-600"
                />
              ) : (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-amber-600"
                />
              )}
              <p
                className={`text-sm ${insights.healthAdequate ? "text-emerald-800" : "text-amber-800"}`}
              >
                {insights.healthAdequate
                  ? `Your health cover of ${formatLakhsCrores(insights.effectiveHealthCover)} meets the recommended ${formatLakhsCrores(insights.recommendedHealth)}.`
                  : `Recommended health cover: ${formatLakhsCrores(insights.recommendedHealth)}. You have a gap of ${formatLakhsCrores(insights.healthGap)}.`}
              </p>
            </div>

            <div
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                insights.termAdequate
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-amber-100 bg-amber-50"
              }`}
            >
              {insights.termAdequate ? (
                <CheckCircle
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-emerald-600"
                />
              ) : (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-amber-600"
                />
              )}
              <p
                className={`text-sm ${insights.termAdequate ? "text-emerald-800" : "text-amber-800"}`}
              >
                {insights.termAdequate
                  ? `Your term cover of ${formatLakhsCrores(insights.effectiveTermCover)} meets the recommended ${formatLakhsCrores(insights.recommendedTerm)} (10x income).`
                  : `Recommended term cover: ${formatLakhsCrores(insights.recommendedTerm)} (10x income). Gap: ${formatLakhsCrores(insights.termGap)}.`}
              </p>
            </div>
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
          Next: Goals <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
