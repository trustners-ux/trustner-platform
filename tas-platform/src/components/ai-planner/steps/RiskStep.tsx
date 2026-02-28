"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Activity } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import type { RiskProfile, RiskProfileType } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

interface Question {
  id: number;
  question: string;
  options: { label: string; value: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question:
      "How would you react if your investments dropped 20% in a month?",
    options: [
      { label: "Sell everything", value: 1 },
      { label: "Sell some holdings", value: 2 },
      { label: "Hold and wait", value: 3 },
      { label: "Buy more at lower prices", value: 4 },
    ],
  },
  {
    id: 2,
    question: "What is your primary investment goal?",
    options: [
      { label: "Preserve my capital", value: 1 },
      { label: "Generate regular income", value: 2 },
      { label: "Balanced growth", value: 3 },
      { label: "Aggressive growth", value: 5 },
    ],
  },
  {
    id: 3,
    question: "How long can you keep your money invested?",
    options: [
      { label: "Less than 3 years", value: 1 },
      { label: "3 to 5 years", value: 2 },
      { label: "5 to 10 years", value: 3 },
      { label: "More than 10 years", value: 5 },
    ],
  },
  {
    id: 4,
    question: "What percentage of your income can you invest monthly?",
    options: [
      { label: "Less than 10%", value: 1 },
      { label: "10% - 20%", value: 2 },
      { label: "20% - 30%", value: 4 },
      { label: "More than 30%", value: 5 },
    ],
  },
];

const ALLOCATION_MAP: Record<
  string,
  { equity: number; debt: number; gold: number; cash: number }
> = {
  conservative: { equity: 20, debt: 60, gold: 10, cash: 10 },
  moderate: { equity: 45, debt: 35, gold: 10, cash: 10 },
  moderately_aggressive: { equity: 65, debt: 20, gold: 10, cash: 5 },
  aggressive: { equity: 80, debt: 10, gold: 5, cash: 5 },
};

const PROFILE_LABELS: Record<
  RiskProfileType,
  { label: string; description: string; color: string; bgColor: string }
> = {
  conservative: {
    label: "Conservative",
    description:
      "You prefer safety over returns. Focus on capital preservation with limited equity exposure.",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  moderate: {
    label: "Moderate",
    description:
      "You seek a balance between growth and safety. A diversified mix works best for you.",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  moderately_aggressive: {
    label: "Moderately Aggressive",
    description:
      "You can handle market volatility for higher returns. Strong equity tilt with some safety net.",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  aggressive: {
    label: "Aggressive",
    description:
      "You seek maximum returns and can stomach significant short-term losses. Equity-heavy portfolio.",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

const ALLOCATION_COLORS: Record<string, string> = {
  equity: "bg-blue-500",
  debt: "bg-emerald-500",
  gold: "bg-amber-500",
  cash: "bg-gray-400",
};

function getProfileType(score: number): RiskProfileType {
  if (score <= 6) return "conservative";
  if (score <= 12) return "moderate";
  if (score <= 16) return "moderately_aggressive";
  return "aggressive";
}

export default function RiskStep({ onNext, onPrev }: Props) {
  const { plan, setRiskProfile } = useFinancialPlanStore();

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    // Attempt to restore from existing risk profile score
    if (plan.riskProfile?.score) {
      // We can't perfectly reverse-engineer individual answers, so start fresh
      return {};
    }
    return {};
  });

  const totalScore = useMemo(
    () => Object.values(answers).reduce((sum, v) => sum + v, 0),
    [answers]
  );

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  const profileType = useMemo(() => getProfileType(totalScore), [totalScore]);
  const allocation = ALLOCATION_MAP[profileType];
  const profileInfo = PROFILE_LABELS[profileType];

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;

    const data: RiskProfile = {
      type: profileType,
      score: totalScore,
      equityAllocation: allocation.equity,
      debtAllocation: allocation.debt,
      goldAllocation: allocation.gold,
    };

    setRiskProfile(data);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Activity size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Risk Assessment
          </h2>
          <p className="text-sm text-gray-500">
            4 quick questions to determine your investment style
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id}>
            <p className="mb-3 text-sm font-bold text-gray-700">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-600">
                {idx + 1}
              </span>
              {q.question}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition ${
                    answers[q.id] === opt.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Result */}
        {allAnswered && (
          <>
            {/* Profile type */}
            <div
              className={`rounded-xl ${profileInfo.bgColor} p-5`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className={`text-lg font-extrabold ${profileInfo.color}`}>
                  {profileInfo.label}
                </h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-gray-600">
                  Score: {totalScore}/19
                </span>
              </div>
              <p className={`text-sm ${profileInfo.color} opacity-80`}>
                {profileInfo.description}
              </p>
            </div>

            {/* Allocation bars */}
            <div>
              <p className="mb-3 text-sm font-bold text-gray-700">
                Recommended Asset Allocation
              </p>

              {/* Combined bar */}
              <div className="mb-4 flex h-8 overflow-hidden rounded-xl">
                {Object.entries(allocation).map(([key, value]) => (
                  <div
                    key={key}
                    className={`${ALLOCATION_COLORS[key]} flex items-center justify-center transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  >
                    {value >= 10 && (
                      <span className="text-xs font-bold text-white">
                        {value}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(allocation).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${ALLOCATION_COLORS[key]}`}
                    />
                    <div>
                      <p className="text-xs font-bold capitalize text-gray-700">
                        {key}
                      </p>
                      <p className="text-xs text-gray-400">{value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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
          disabled={!allAnswered}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Next: Tax Details <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
