"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Home,
  HeartPulse,
  Wallet,
  ShieldCheck,
  ShieldPlus,
  TrendingUp,
  Landmark,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Info,
  Target,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  // Monthly Income & Expenses
  monthlyIncome: string;
  monthlyExpenses: string;

  // Emergency Fund
  emergencyFundMonths: string;

  // Insurance Coverage
  hasHealthInsurance: "yes" | "no" | "";
  healthInsuranceAmount: string;
  hasLifeInsurance: "yes" | "no" | "";
  lifeInsuranceAmount: string;

  // Investments
  sipAmount: string;
  lumpsumInvestments: string;

  // Loans / EMIs
  totalEMI: string;

  // Retirement Planning
  currentAge: string;
  targetRetirementAge: string;
  currentRetirementSavings: string;
}

interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  textColor: string;
  bgColor: string;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  monthlyIncome: "",
  monthlyExpenses: "",
  emergencyFundMonths: "",
  hasHealthInsurance: "",
  healthInsuranceAmount: "",
  hasLifeInsurance: "",
  lifeInsuranceAmount: "",
  sipAmount: "",
  lumpsumInvestments: "",
  totalEMI: "",
  currentAge: "",
  targetRetirementAge: "",
  currentRetirementSavings: "",
};

// ---------------------------------------------------------------------------
// Section Config
// ---------------------------------------------------------------------------

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: "income",
    title: "Monthly Income & Expenses",
    icon: Wallet,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    description: "Your monthly earnings and spending",
  },
  {
    id: "emergency",
    title: "Emergency Fund",
    icon: ShieldCheck,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    description: "Months of expenses saved for emergencies",
  },
  {
    id: "insurance",
    title: "Insurance Coverage",
    icon: ShieldPlus,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    description: "Health and life insurance protection",
  },
  {
    id: "investments",
    title: "Investments",
    icon: TrendingUp,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    description: "SIP, lumpsum, and investment allocation",
  },
  {
    id: "loans",
    title: "Loans / EMIs",
    icon: Landmark,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    description: "Total EMIs as a percentage of income",
  },
  {
    id: "retirement",
    title: "Retirement Planning",
    icon: Clock,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
    description: "Age, target retirement, and savings",
  },
];

// ---------------------------------------------------------------------------
// Scoring Logic
// ---------------------------------------------------------------------------

function calculateEmergencyFundScore(months: number): number {
  if (months >= 6) return 20;
  if (months >= 3) return 10;
  if (months >= 1) return 5;
  return 0;
}

function calculateInsuranceScore(
  hasHealth: string,
  healthAmount: number,
  hasLife: string,
  lifeAmount: number,
  annualIncome: number
): { score: number; recommendations: string[] } {
  let score = 0;
  const recommendations: string[] = [];

  // Health insurance scoring (out of 10)
  if (hasHealth === "yes") {
    if (healthAmount >= 1000000) {
      score += 10;
    } else if (healthAmount >= 500000) {
      score += 7;
    } else if (healthAmount > 0) {
      score += 3;
      recommendations.push(
        "Increase health insurance cover to at least 10 lakhs for adequate protection"
      );
    }
  } else {
    recommendations.push(
      "Get a family floater health insurance plan with minimum 10 lakh cover"
    );
  }

  // Life insurance scoring (out of 10)
  if (hasLife === "yes") {
    const idealCover = annualIncome * 10;
    if (lifeAmount >= idealCover) {
      score += 10;
    } else if (lifeAmount >= annualIncome * 5) {
      score += 7;
      recommendations.push(
        "Increase life insurance to at least 10x your annual income"
      );
    } else if (lifeAmount > 0) {
      score += 3;
      recommendations.push(
        "Your life cover is too low. Aim for 10x annual income with a term plan"
      );
    }
  } else {
    recommendations.push(
      "Get a term life insurance plan with cover of at least 10x annual income"
    );
  }

  return { score, recommendations };
}

function calculateInvestmentScore(
  sipAmount: number,
  monthlyIncome: number
): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (monthlyIncome <= 0) return { score: 0, recommendations };

  const sipPercent = (sipAmount / monthlyIncome) * 100;

  let score = 0;
  if (sipPercent >= 20) {
    score = 20;
  } else if (sipPercent >= 10) {
    score = 10;
    recommendations.push(
      `Increase SIP from ${sipPercent.toFixed(0)}% to 20% of income for faster wealth creation`
    );
  } else if (sipPercent > 0) {
    score = 5;
    recommendations.push(
      `Your SIP is only ${sipPercent.toFixed(0)}% of income. Aim for at least 20%`
    );
  } else {
    recommendations.push(
      "Start a SIP of at least 10-20% of your monthly income"
    );
  }

  return { score, recommendations };
}

function calculateDebtScore(
  totalEMI: number,
  monthlyIncome: number
): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (monthlyIncome <= 0) return { score: 0, recommendations };

  const emiPercent = (totalEMI / monthlyIncome) * 100;

  let score = 0;
  if (emiPercent < 10) {
    score = 20;
  } else if (emiPercent <= 30) {
    score = 15;
    recommendations.push(
      "Your debt is manageable. Try to reduce it further to free up more for investments"
    );
  } else if (emiPercent <= 50) {
    score = 5;
    recommendations.push(
      "EMIs at " +
        emiPercent.toFixed(0) +
        "% of income is high. Prioritise paying off high-interest debt"
    );
  } else {
    score = 0;
    recommendations.push(
      "EMI burden exceeds 50% of income. Urgently restructure or consolidate debt"
    );
    recommendations.push(
      "Avoid taking new loans until existing ones are significantly reduced"
    );
  }

  if (totalEMI === 0) {
    score = 20;
  }

  return { score, recommendations };
}

function calculateRetirementScore(
  currentAge: number,
  targetRetirementAge: number,
  currentSavings: number,
  monthlyIncome: number
): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];

  if (currentAge <= 0 || targetRetirementAge <= 0) {
    return { score: 0, recommendations: ["Enter your age details to get retirement score"] };
  }

  const yearsToRetirement = targetRetirementAge - currentAge;
  const annualIncome = monthlyIncome * 12;

  // Ideal retirement corpus = 25x annual expenses (rough 4% rule benchmark)
  // Use a simpler heuristic: compare savings to years of income needed
  const yearsOfIncomeNeeded = Math.max(25 - yearsToRetirement * 0.5, 10);
  const idealCorpusProxy = annualIncome * yearsOfIncomeNeeded * 0.3; // Simplified proxy

  let score = 0;

  if (yearsToRetirement <= 0) {
    // Already past target retirement
    score = currentSavings > annualIncome * 10 ? 15 : 5;
    recommendations.push(
      "You have passed your target retirement age. Consult an advisor for withdrawal strategy"
    );
  } else if (yearsToRetirement > 25) {
    // Plenty of time
    if (currentSavings > 0) {
      score = 15;
      recommendations.push(
        "Great start! Keep investing consistently. Time is your biggest advantage"
      );
    } else {
      score = 8;
      recommendations.push(
        "Start investing for retirement now. Even small SIPs compound significantly over 25+ years"
      );
    }
    if (currentSavings > idealCorpusProxy) score = 20;
  } else if (yearsToRetirement > 15) {
    if (currentSavings > idealCorpusProxy * 0.5) {
      score = 15;
    } else if (currentSavings > 0) {
      score = 10;
      recommendations.push(
        "Increase retirement contributions. Consider NPS for additional tax benefits"
      );
    } else {
      score = 3;
      recommendations.push(
        "Start retirement planning immediately. Open an NPS account and start SIPs in equity funds"
      );
    }
    if (currentSavings > idealCorpusProxy) score = 20;
  } else {
    // Less than 15 years
    if (currentSavings > idealCorpusProxy) {
      score = 18;
    } else if (currentSavings > idealCorpusProxy * 0.3) {
      score = 10;
      recommendations.push(
        "You need to aggressively save for retirement. Consult a financial advisor for a catch-up plan"
      );
    } else {
      score = 3;
      recommendations.push(
        "Retirement savings are critically low. Urgently increase investments and consider delaying retirement"
      );
    }
  }

  return { score, recommendations };
}

// ---------------------------------------------------------------------------
// Animated Score Circle
// ---------------------------------------------------------------------------

function AnimatedScoreCircle({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const duration = 1400;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={200} height={200} className="-rotate-90">
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={10}
        />
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.08s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold" style={{ color }}>
          {displayScore}
        </span>
        <span className="text-sm font-semibold text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Bar Sub-component
// ---------------------------------------------------------------------------

function ScoreBar({
  label,
  score,
  maxScore,
  color,
}: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-bold" style={{ color }}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: format currency input display
// ---------------------------------------------------------------------------

function formatINR(value: string): string {
  const num = parseInt(value.replace(/,/g, ""), 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-IN");
}

function parseNum(value: string): number {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function FinancialHealthCheckPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    income: true,
  });
  const [showResults, setShowResults] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Toggle section
  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Update form field
  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Derived values
  const monthlyIncome = parseNum(form.monthlyIncome);
  const monthlyExpenses = parseNum(form.monthlyExpenses);
  const emergencyMonths = parseFloat(form.emergencyFundMonths) || 0;
  const healthAmount = parseNum(form.healthInsuranceAmount);
  const lifeAmount = parseNum(form.lifeInsuranceAmount);
  const sipAmount = parseNum(form.sipAmount);
  const totalEMI = parseNum(form.totalEMI);
  const currentAge = parseInt(form.currentAge, 10) || 0;
  const targetRetirementAge = parseInt(form.targetRetirementAge, 10) || 0;
  const retirementSavings = parseNum(form.currentRetirementSavings);

  // --- Scoring ---
  const scores: CategoryScore[] = useMemo(() => {
    // Emergency Fund Score
    const emergencyScore = calculateEmergencyFundScore(emergencyMonths);
    const emergencyRecs: string[] = [];
    if (emergencyMonths < 6) {
      emergencyRecs.push(
        `Increase emergency fund to ${Math.max(6 - Math.floor(emergencyMonths), 1)} more month(s) of expenses`
      );
    }
    if (emergencyMonths < 3) {
      emergencyRecs.push(
        "Build at least 3 months of expenses in a liquid fund as a priority"
      );
    }
    if (emergencyMonths === 0) {
      emergencyRecs.push(
        "Start an emergency fund immediately. Park money in a liquid mutual fund"
      );
    }

    // Insurance Score
    const insurance = calculateInsuranceScore(
      form.hasHealthInsurance,
      healthAmount,
      form.hasLifeInsurance,
      lifeAmount,
      monthlyIncome * 12
    );

    // Investment Score
    const investment = calculateInvestmentScore(sipAmount, monthlyIncome);

    // Debt Score
    const debt = calculateDebtScore(totalEMI, monthlyIncome);

    // Retirement Score
    const retirement = calculateRetirementScore(
      currentAge,
      targetRetirementAge,
      retirementSavings,
      monthlyIncome
    );

    return [
      {
        name: "Emergency Fund",
        score: emergencyScore,
        maxScore: 20,
        icon: ShieldCheck,
        color: "#059669",
        textColor: "text-emerald-600",
        bgColor: "bg-emerald-50",
        recommendations: emergencyRecs,
      },
      {
        name: "Insurance Coverage",
        score: insurance.score,
        maxScore: 20,
        icon: ShieldPlus,
        color: "#7C3AED",
        textColor: "text-violet-600",
        bgColor: "bg-violet-50",
        recommendations: insurance.recommendations,
      },
      {
        name: "Investments",
        score: investment.score,
        maxScore: 20,
        icon: TrendingUp,
        color: "#D97706",
        textColor: "text-amber-600",
        bgColor: "bg-amber-50",
        recommendations: investment.recommendations,
      },
      {
        name: "Debt Health",
        score: debt.score,
        maxScore: 20,
        icon: Landmark,
        color: "#DC2626",
        textColor: "text-red-600",
        bgColor: "bg-red-50",
        recommendations: debt.recommendations,
      },
      {
        name: "Retirement Readiness",
        score: retirement.score,
        maxScore: 20,
        icon: Clock,
        color: "#0891B2",
        textColor: "text-cyan-600",
        bgColor: "bg-cyan-50",
        recommendations: retirement.recommendations,
      },
    ];
  }, [
    emergencyMonths,
    form.hasHealthInsurance,
    form.hasLifeInsurance,
    healthAmount,
    lifeAmount,
    sipAmount,
    monthlyIncome,
    totalEMI,
    currentAge,
    targetRetirementAge,
    retirementSavings,
  ]);

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  const scoreColor =
    totalScore > 70 ? "#059669" : totalScore >= 40 ? "#D97706" : "#DC2626";
  const scoreLabel =
    totalScore > 70
      ? "Healthy"
      : totalScore >= 40
        ? "Needs Improvement"
        : "Needs Attention";
  const scoreBgClass =
    totalScore > 70
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : totalScore >= 40
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  // Check if minimum data is provided for calculation
  const hasMinimumData = monthlyIncome > 0;

  const handleCalculate = () => {
    if (!hasMinimumData) return;
    // Expand all sections for review, then show results
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const resetAll = () => {
    setForm(INITIAL_FORM);
    setOpenSections({ income: true });
    setShowResults(false);
    setFormSubmitted(false);
    setLeadForm({ name: "", email: "", phone: "" });
  };

  const whatsappUrl = `https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20Trustner,%20I%20just%20completed%20the%20financial%20health%20check.`;

  // ----- Input helper -----
  const inputClass =
    "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";
  const selectClass =
    "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white";
  const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

  // -----------------------------------------------------------------------
  // Results View
  // -----------------------------------------------------------------------
  if (showResults) {
    const weakAreas = scores.filter((s) => s.score < s.maxScore * 0.6);
    const allRecommendations = scores.flatMap((s) =>
      s.recommendations.map((r) => ({ category: s.name, text: r, color: s.color }))
    );

    return (
      <>
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-white">
          <div className="container-custom py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-400">
              <Link
                href="/"
                className="flex items-center gap-1 transition hover:text-primary-500"
              >
                <Home size={14} />
                Home
              </Link>
              <ChevronRight size={14} />
              <span className="font-medium text-gray-900">
                Financial Health Check
              </span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />

          <div className="container-custom relative py-16 text-center lg:py-24">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-primary-200 backdrop-blur-sm">
              <Sparkles size={16} />
              Your Financial Health Score
            </div>
            <h1 className="mb-3 text-4xl font-extrabold sm:text-5xl">
              Your Score:{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}dd)`,
                }}
              >
                {scoreLabel}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              {totalScore > 70
                ? "Great job! Your finances are in good shape. Keep up the disciplined approach and consider fine-tuning for optimal growth."
                : totalScore >= 40
                  ? "Your finances have a decent foundation, but there are areas that need attention to build long-term security."
                  : "Your financial health needs significant improvement. Focus on the recommendations below to strengthen your foundation."}
            </p>
          </div>
        </section>

        {/* Results Body */}
        <section className="bg-surface-100 py-16 sm:py-20">
          <div className="container-custom">
            <div className="mx-auto max-w-4xl">
              {/* Score Circle */}
              <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-10 shadow-card">
                <div className="flex flex-col items-center">
                  <AnimatedScoreCircle score={totalScore} color={scoreColor} />
                  <div className="mt-6">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold ${scoreBgClass}`}
                    >
                      {totalScore > 70 ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      {scoreLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <h3 className="mb-6 text-center text-xl font-bold text-gray-900">
                Score Breakdown
              </h3>
              <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scores.map((cat) => {
                  const Icon = cat.icon;
                  const catPct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
                  const catLabel =
                    catPct >= 75
                      ? "Good"
                      : catPct >= 40
                        ? "Fair"
                        : "Needs Attention";
                  return (
                    <div
                      key={cat.name}
                      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.bgColor}`}
                        >
                          <Icon size={20} className={cat.textColor} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {cat.name}
                          </p>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: cat.color }}
                          >
                            {catLabel}
                          </p>
                        </div>
                      </div>
                      <ScoreBar
                        label=""
                        score={cat.score}
                        maxScore={cat.maxScore}
                        color={cat.color}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Action Items */}
              {allRecommendations.length > 0 && (
                <div className="mb-12 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-amber-50 px-6 py-4">
                    <Target size={18} className="text-amber-600" />
                    <h3 className="text-base font-bold text-amber-800">
                      Recommended Action Items
                    </h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {allRecommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <span
                            className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: rec.color }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-500">
                              [{rec.category}]
                            </span>{" "}
                            {rec.text}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* CTA: Book Consultation */}
              <div className="mb-10 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-6 text-center text-white">
                  <h3 className="text-xl font-bold">
                    Get a Free Financial Consultation
                  </h3>
                  <p className="mt-1 text-sm text-blue-100">
                    Our experts will review your score and create a personalised
                    improvement plan.
                  </p>
                </div>

                {formSubmitted ? (
                  <div className="flex flex-col items-center gap-4 p-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-positive-50">
                      <CheckCircle2 size={32} className="text-positive" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Thank You!
                    </h4>
                    <p className="text-gray-500">
                      Our financial advisor will contact you within 24 hours.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        <MessageCircle size={16} />
                        Chat on WhatsApp
                      </a>
                      <button onClick={resetAll} className="btn-secondary">
                        Retake Assessment
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-5 p-8">
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <User size={14} /> Full Name
                          </span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Your name"
                          value={leadForm.name}
                          onChange={(e) =>
                            setLeadForm({ ...leadForm, name: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <Mail size={14} /> Email
                          </span>
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="you@email.com"
                          value={leadForm.email}
                          onChange={(e) =>
                            setLeadForm({ ...leadForm, email: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} /> Phone
                          </span>
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={leadForm.phone}
                          onChange={(e) =>
                            setLeadForm({ ...leadForm, phone: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full">
                      Book Free Consultation
                      <ArrowRight size={16} />
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      By submitting, you agree to be contacted by our team. Your
                      information is safe and will never be shared.
                    </p>
                  </form>
                )}
              </div>

              {/* WhatsApp CTA */}
              <div className="mb-10 text-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  <MessageCircle size={18} />
                  Discuss Your Score on WhatsApp
                </a>
              </div>

              {/* Retake */}
              <div className="text-center">
                <button
                  onClick={resetAll}
                  className="text-sm font-semibold text-primary-500 transition hover:text-primary-600"
                >
                  Retake the Health Check
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SEBI / AMFI Disclaimer */}
        <div className="border-t border-gray-100 bg-surface-100 px-4 py-8">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl space-y-3 text-center">
              <p className="text-xs italic text-gray-400">
                This financial health check is for educational and informational
                purposes only and does not constitute financial, investment, or
                insurance advice. Please consult a qualified financial advisor for
                personalised guidance.
              </p>
              <p className="text-[11px] text-gray-400">
                {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
              </p>
              <p className="text-[11px] text-gray-400">
                {REGULATORY.DISTRIBUTOR_DISCLAIMER}
              </p>
              <p className="text-[11px] text-gray-400">
                {REGULATORY.MF_ENTITY} | {REGULATORY.AMFI_ARN}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Form View
  // -----------------------------------------------------------------------
  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link
              href="/"
              className="flex items-center gap-1 transition hover:text-primary-500"
            >
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900">
              Financial Health Check
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="container-custom relative py-16 text-center lg:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-primary-200 backdrop-blur-sm">
            <HeartPulse size={16} />
            Financial Health Check
          </div>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            How Healthy Are{" "}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Your Finances?
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Fill in your financial details across 6 key areas to get an instant
            health score with personalised recommendations.
          </p>
        </div>
      </section>

      {/* Form + Live Score */}
      <section className="bg-surface-100 py-16 sm:py-20">
        <div className="container-custom">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left: Form Sections */}
              <div className="space-y-4 lg:col-span-2">
                {SECTIONS.map((section) => {
                  const isOpen = openSections[section.id] ?? false;
                  const SIcon = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden"
                    >
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-gray-50"
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}
                        >
                          <SIcon size={20} className={section.iconColor} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900">
                            {section.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {section.description}
                          </p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Section Body */}
                      {isOpen && (
                        <div className="border-t border-gray-100 px-6 py-5">
                          {section.id === "income" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>
                                  Monthly Income (INR)
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 80,000"
                                  value={
                                    form.monthlyIncome
                                      ? formatINR(form.monthlyIncome)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    updateField("monthlyIncome", raw);
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  Monthly Expenses (INR)
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 45,000"
                                  value={
                                    form.monthlyExpenses
                                      ? formatINR(form.monthlyExpenses)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    updateField("monthlyExpenses", raw);
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              {monthlyIncome > 0 && monthlyExpenses > 0 && (
                                <div className="sm:col-span-2">
                                  <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                    <Info
                                      size={14}
                                      className="mr-1.5 inline-block"
                                    />
                                    Monthly savings:{" "}
                                    <strong>
                                      {(
                                        monthlyIncome - monthlyExpenses
                                      ).toLocaleString("en-IN")}{" "}
                                      INR
                                    </strong>{" "}
                                    (
                                    {(
                                      ((monthlyIncome - monthlyExpenses) /
                                        monthlyIncome) *
                                      100
                                    ).toFixed(0)}
                                    % savings rate)
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {section.id === "emergency" && (
                            <div className="max-w-sm">
                              <label className={labelClass}>
                                Months of Expenses Saved
                              </label>
                              <select
                                value={form.emergencyFundMonths}
                                onChange={(e) =>
                                  updateField(
                                    "emergencyFundMonths",
                                    e.target.value
                                  )
                                }
                                className={selectClass}
                              >
                                <option value="">Select</option>
                                <option value="0">None (0 months)</option>
                                <option value="1">1 month</option>
                                <option value="2">2 months</option>
                                <option value="3">3 months</option>
                                <option value="4">4 months</option>
                                <option value="5">5 months</option>
                                <option value="6">6 months</option>
                                <option value="9">9 months</option>
                                <option value="12">12+ months</option>
                              </select>
                              <p className="mt-2 text-xs text-gray-500">
                                An emergency fund of 6+ months of expenses is
                                recommended.
                              </p>
                            </div>
                          )}

                          {section.id === "insurance" && (
                            <div className="space-y-5">
                              {/* Health Insurance */}
                              <div>
                                <p className="mb-2 text-sm font-bold text-gray-800">
                                  Health Insurance
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className={labelClass}>
                                      Do you have health insurance?
                                    </label>
                                    <select
                                      value={form.hasHealthInsurance}
                                      onChange={(e) =>
                                        updateField(
                                          "hasHealthInsurance",
                                          e.target.value as "yes" | "no"
                                        )
                                      }
                                      className={selectClass}
                                    >
                                      <option value="">Select</option>
                                      <option value="yes">Yes</option>
                                      <option value="no">No</option>
                                    </select>
                                  </div>
                                  {form.hasHealthInsurance === "yes" && (
                                    <div>
                                      <label className={labelClass}>
                                        Sum Insured (INR)
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="e.g. 10,00,000"
                                        value={
                                          form.healthInsuranceAmount
                                            ? formatINR(
                                                form.healthInsuranceAmount
                                              )
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                          );
                                          updateField(
                                            "healthInsuranceAmount",
                                            raw
                                          );
                                        }}
                                        className={inputClass}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Life Insurance */}
                              <div>
                                <p className="mb-2 text-sm font-bold text-gray-800">
                                  Life Insurance (Term Plan)
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className={labelClass}>
                                      Do you have life insurance?
                                    </label>
                                    <select
                                      value={form.hasLifeInsurance}
                                      onChange={(e) =>
                                        updateField(
                                          "hasLifeInsurance",
                                          e.target.value as "yes" | "no"
                                        )
                                      }
                                      className={selectClass}
                                    >
                                      <option value="">Select</option>
                                      <option value="yes">Yes</option>
                                      <option value="no">No</option>
                                    </select>
                                  </div>
                                  {form.hasLifeInsurance === "yes" && (
                                    <div>
                                      <label className={labelClass}>
                                        Cover Amount (INR)
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="e.g. 1,00,00,000"
                                        value={
                                          form.lifeInsuranceAmount
                                            ? formatINR(
                                                form.lifeInsuranceAmount
                                              )
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                          );
                                          updateField(
                                            "lifeInsuranceAmount",
                                            raw
                                          );
                                        }}
                                        className={inputClass}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {section.id === "investments" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>
                                  Monthly SIP Amount (INR)
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 15,000"
                                  value={
                                    form.sipAmount
                                      ? formatINR(form.sipAmount)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    updateField("sipAmount", raw);
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  Total Lumpsum Investments (INR)
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 5,00,000"
                                  value={
                                    form.lumpsumInvestments
                                      ? formatINR(form.lumpsumInvestments)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    updateField("lumpsumInvestments", raw);
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              {monthlyIncome > 0 && sipAmount > 0 && (
                                <div className="sm:col-span-2">
                                  <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <Info
                                      size={14}
                                      className="mr-1.5 inline-block"
                                    />
                                    SIP as % of income:{" "}
                                    <strong>
                                      {(
                                        (sipAmount / monthlyIncome) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </strong>{" "}
                                    {sipAmount / monthlyIncome >= 0.2
                                      ? "(Excellent!)"
                                      : sipAmount / monthlyIncome >= 0.1
                                        ? "(Good, aim for 20%+)"
                                        : "(Low, aim for at least 10-20%)"}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {section.id === "loans" && (
                            <div className="max-w-sm">
                              <label className={labelClass}>
                                Total Monthly EMIs (INR)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="e.g. 20,000"
                                value={
                                  form.totalEMI
                                    ? formatINR(form.totalEMI)
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(
                                    /[^0-9]/g,
                                    ""
                                  );
                                  updateField("totalEMI", raw);
                                }}
                                className={inputClass}
                              />
                              {monthlyIncome > 0 && totalEMI > 0 && (
                                <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                                  <Info
                                    size={14}
                                    className="mr-1.5 inline-block"
                                  />
                                  EMI-to-income ratio:{" "}
                                  <strong>
                                    {(
                                      (totalEMI / monthlyIncome) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </strong>{" "}
                                  {totalEMI / monthlyIncome <= 0.1
                                    ? "(Healthy)"
                                    : totalEMI / monthlyIncome <= 0.3
                                      ? "(Manageable)"
                                      : totalEMI / monthlyIncome <= 0.5
                                        ? "(High - try to reduce)"
                                        : "(Critical - needs immediate attention)"}
                                </div>
                              )}
                            </div>
                          )}

                          {section.id === "retirement" && (
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <label className={labelClass}>
                                  Current Age
                                </label>
                                <input
                                  type="number"
                                  min="18"
                                  max="80"
                                  placeholder="e.g. 30"
                                  value={form.currentAge}
                                  onChange={(e) =>
                                    updateField("currentAge", e.target.value)
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  Target Retirement Age
                                </label>
                                <input
                                  type="number"
                                  min="40"
                                  max="80"
                                  placeholder="e.g. 60"
                                  value={form.targetRetirementAge}
                                  onChange={(e) =>
                                    updateField(
                                      "targetRetirementAge",
                                      e.target.value
                                    )
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  Current Retirement Savings (INR)
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 10,00,000"
                                  value={
                                    form.currentRetirementSavings
                                      ? formatINR(
                                          form.currentRetirementSavings
                                        )
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    updateField(
                                      "currentRetirementSavings",
                                      raw
                                    );
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              {currentAge > 0 && targetRetirementAge > 0 && (
                                <div className="sm:col-span-3">
                                  <div className="rounded-lg bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                                    <Info
                                      size={14}
                                      className="mr-1.5 inline-block"
                                    />
                                    Years to retirement:{" "}
                                    <strong>
                                      {Math.max(
                                        targetRetirementAge - currentAge,
                                        0
                                      )}{" "}
                                      years
                                    </strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Calculate Button */}
                <div className="pt-4">
                  <button
                    onClick={handleCalculate}
                    disabled={!hasMinimumData}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition ${
                      hasMinimumData
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    <HeartPulse size={18} />
                    Calculate My Financial Health Score
                  </button>
                  {!hasMinimumData && (
                    <p className="mt-2 text-center text-xs text-gray-400">
                      Enter at least your monthly income to get started.
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Live Score Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Live Score Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                    <h3 className="mb-4 text-center text-sm font-bold text-gray-900">
                      Live Health Score
                    </h3>
                    <div className="flex justify-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg width={140} height={140} className="-rotate-90">
                          <circle
                            cx={70}
                            cy={70}
                            r={56}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth={8}
                          />
                          <circle
                            cx={70}
                            cy={70}
                            r={56}
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 56}
                            strokeDashoffset={
                              2 * Math.PI * 56 -
                              (totalScore / 100) * (2 * Math.PI * 56)
                            }
                            style={{
                              transition: "stroke-dashoffset 0.5s ease-out",
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className="text-3xl font-extrabold"
                            style={{ color: scoreColor }}
                          >
                            {totalScore}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400">
                            / 100
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${scoreBgClass}`}
                      >
                        {totalScore > 70 ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        {scoreLabel}
                      </span>
                    </div>
                  </div>

                  {/* Category Scores */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                    <h3 className="mb-4 text-sm font-bold text-gray-900">
                      Category Scores
                    </h3>
                    <div className="space-y-4">
                      {scores.map((cat) => (
                        <ScoreBar
                          key={cat.name}
                          label={cat.name}
                          score={cat.score}
                          maxScore={cat.maxScore}
                          color={cat.color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                    <h3 className="mb-3 text-sm font-bold text-gray-900">
                      Quick Tips
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-emerald-500"
                        />
                        Keep 6+ months expenses as emergency fund
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-emerald-500"
                        />
                        SIP at least 20% of monthly income
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-emerald-500"
                        />
                        Health cover of minimum 10 lakhs
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-emerald-500"
                        />
                        Keep EMIs under 30% of income
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEBI / AMFI Disclaimer */}
      <div className="border-t border-gray-100 bg-surface-100 px-4 py-8">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="text-xs italic text-gray-400">
              This financial health check is for educational and informational
              purposes only and does not constitute financial, investment, or
              insurance advice. Please consult a qualified financial advisor for
              personalised guidance.
            </p>
            <p className="text-[11px] text-gray-400">
              {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
            </p>
            <p className="text-[11px] text-gray-400">
              {REGULATORY.DISTRIBUTOR_DISCLAIMER}
            </p>
            <p className="text-[11px] text-gray-400">
              {REGULATORY.MF_ENTITY} | {REGULATORY.AMFI_ARN}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
