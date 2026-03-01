"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Wallet,
  Receipt,
  PiggyBank,
  Shield,
  Target,
  Activity,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const AuthGate = dynamic(() => import("@/components/auth/AuthGate"), {
  ssr: false,
});

interface Props {
  onPrev: () => void;
}

const LOADING_MESSAGES = [
  "Analyzing your cash flow...",
  "Calculating insurance gaps...",
  "Optimizing asset allocation...",
  "Generating action plan...",
  "Saving your plan securely...",
];

export default function ReviewStep({ onPrev }: Props) {
  const { plan, setStep, generateAnalysis, markComplete, savePlanToBackend } =
    useFinancialPlanStore();
  const { isAuthenticated } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showAuthGate, setShowAuthGate] = useState(false);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 750);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = useCallback(async () => {
    // If not authenticated, show AuthGate first
    if (!isAuthenticated) {
      setShowAuthGate(true);
      return;
    }

    setIsGenerating(true);
    setLoadingMsgIdx(0);

    // Simulate processing time for UX
    await new Promise((resolve) => setTimeout(resolve, 3000));

    generateAnalysis();
    markComplete();

    // Save to backend (non-blocking)
    savePlanToBackend().catch(console.error);
  }, [isAuthenticated, generateAnalysis, markComplete, savePlanToBackend]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthGate(false);
    // After successful auth, proceed with plan generation
    handleGenerate();
  }, [handleGenerate]);

  const goToStep = (step: number) => {
    setStep(step);
  };

  const { personal, income, expenses, netWorth, insurance, goals, riskProfile, tax } =
    plan;

  const sections = [
    {
      label: "Personal Info",
      step: 1,
      icon: User,
      color: "bg-blue-100 text-blue-600",
      filled: !!personal,
      summary: personal
        ? `${personal.name}, ${personal.age}y, ${personal.occupation}, ${personal.city}`
        : "Not filled",
    },
    {
      label: "Income",
      step: 2,
      icon: Wallet,
      color: "bg-emerald-100 text-emerald-600",
      filled: !!income,
      summary: income
        ? `Monthly: ${formatINR(income.totalMonthlyIncome)} | Annual: ${formatINR(income.totalAnnualIncome)}`
        : "Not filled",
    },
    {
      label: "Expenses",
      step: 3,
      icon: Receipt,
      color: "bg-amber-100 text-amber-600",
      filled: !!expenses,
      summary: expenses
        ? `${formatINR(expenses.totalMonthlyExpenses)}/mo | Savings rate: ${expenses.savingsRate}%`
        : "Not filled",
    },
    {
      label: "Net Worth",
      step: 4,
      icon: PiggyBank,
      color: "bg-blue-100 text-blue-600",
      filled: !!netWorth,
      summary: netWorth
        ? `Assets: ${formatLakhsCrores(netWorth.totalAssets)} | Liabilities: ${formatLakhsCrores(netWorth.totalLiabilities)} | Net: ${formatLakhsCrores(netWorth.netWorth)}`
        : "Not filled",
    },
    {
      label: "Insurance",
      step: 6,
      icon: Shield,
      color: "bg-purple-100 text-purple-600",
      filled: !!insurance,
      summary: insurance
        ? `Health: ${insurance.hasHealthInsurance ? formatLakhsCrores(insurance.totalHealthCover) : "None"} | Life: ${insurance.totalLifeCover > 0 ? formatLakhsCrores(insurance.totalLifeCover) : "None"}`
        : "Not filled",
    },
    {
      label: "Goals",
      step: 7,
      icon: Target,
      color: "bg-orange-100 text-orange-600",
      filled: !!goals && goals.length > 0,
      summary:
        goals && goals.length > 0
          ? `${goals.length} goal${goals.length > 1 ? "s" : ""}: ${goals.map((g) => g.name).join(", ")}`
          : "No goals added",
    },
    {
      label: "Risk Profile",
      step: 8,
      icon: Activity,
      color: "bg-indigo-100 text-indigo-600",
      filled: !!riskProfile,
      summary: riskProfile
        ? `${riskProfile.type.replace("_", " ")} (score: ${riskProfile.score}) | Equity: ${riskProfile.equityAllocation}%`
        : "Not assessed",
    },
    {
      label: "Tax",
      step: 9,
      icon: Receipt,
      color: "bg-teal-100 text-teal-600",
      filled: !!tax,
      summary: tax
        ? `${tax.regime === "old" ? "Old" : "New"} regime | Tax: ${formatINR(tax.taxPayable)} | Rate: ${tax.effectiveRate}%`
        : "Not filled",
    },
  ];

  const allFilled = sections.every((s) => s.filled);

  if (isGenerating) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={48} className="text-blue-500" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -right-1 -top-1"
              >
                <Sparkles size={20} className="text-amber-500" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-xl font-extrabold text-gray-900"
          >
            Generating Your Financial Plan
          </motion.h3>

          <div className="mt-6 space-y-3">
            {LOADING_MESSAGES.map((msg, idx) => (
              <motion.div
                key={msg}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: idx <= loadingMsgIdx ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                {idx < loadingMsgIdx ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : idx === loadingMsgIdx ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 size={16} className="text-blue-500" />
                  </motion.div>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-gray-200" />
                )}
                <span
                  className={`text-sm font-medium ${
                    idx <= loadingMsgIdx ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {msg}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-emerald-100">
          <Sparkles size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Review &amp; Generate
          </h2>
          <p className="text-sm text-gray-500">
            Verify your inputs before we create your plan
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              onClick={() => goToStep(section.step)}
              className="flex w-full items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${section.color}`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-700">
                    {section.label}
                  </p>
                  {section.filled ? (
                    <CheckCircle size={14} className="text-emerald-500" />
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Missing
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {section.summary}
                </p>
              </div>
            </button>
          );
        })}

        {/* Warning if not all sections filled */}
        {!allFilled && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-800">
              Some sections are incomplete. Click on them above to fill in the
              missing details. The analysis will be more accurate with complete
              data.
            </p>
          </div>
        )}
      </div>

      {/* Auth status indicator */}
      {isAuthenticated && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
          <CheckCircle size={14} className="text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">
            Verified — Your plan will be saved securely to your account
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={!allFilled}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
        >
          <Sparkles size={16} />
          Generate My Financial Plan
        </button>
      </div>

      {/* AuthGate Modal */}
      {showAuthGate && (
        <AuthGate
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthGate(false)}
          prefillName={plan.personal?.name}
          prefillCity={plan.personal?.city}
        />
      )}
    </div>
  );
}
