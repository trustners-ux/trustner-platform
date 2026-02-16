"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Shield,
  TrendingUp,
  Target,
  Zap,
  Home,
  MessageCircle,
  CheckCircle2,
  PieChart,
  Briefcase,
  Clock,
  BarChart3,
  Wallet,
  User,
  Layers,
  AlertTriangle,
  Info,
} from "lucide-react";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Option {
  label: string;
  description: string;
  score: number;
}

interface Question {
  id: string;
  question: string;
  subtitle: string;
  icon: React.ElementType;
  options: Option[];
}

interface RiskProfile {
  type: string;
  tagline: string;
  color: string;
  bgGradient: string;
  iconColor: string;
  icon: React.ElementType;
  equity: number;
  debt: number;
  gold: number;
  fundCategories: string[];
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Questions Data                                                     */
/* ------------------------------------------------------------------ */

const QUESTIONS: Question[] = [
  {
    id: "experience",
    question: "What is your investment experience?",
    subtitle:
      "This helps us understand your familiarity with financial markets.",
    icon: Briefcase,
    options: [
      {
        label: "Beginner",
        description: "I have little to no experience with investing",
        score: 1,
      },
      {
        label: "Some Experience",
        description: "I have invested in FDs, PPF, or basic mutual funds",
        score: 2,
      },
      {
        label: "Intermediate",
        description:
          "I actively invest in mutual funds and understand market cycles",
        score: 3,
      },
      {
        label: "Experienced",
        description:
          "I invest in stocks, derivatives, and various asset classes",
        score: 5,
      },
    ],
  },
  {
    id: "horizon",
    question: "What is your investment time horizon?",
    subtitle: "How long can you keep your money invested without needing it?",
    icon: Clock,
    options: [
      {
        label: "Short-term (1-3 years)",
        description: "I may need the money within the next 3 years",
        score: 1,
      },
      {
        label: "Medium-term (3-5 years)",
        description: "I can stay invested for 3 to 5 years",
        score: 3,
      },
      {
        label: "Long-term (5-10 years)",
        description: "I plan to stay invested for 5 to 10 years",
        score: 4,
      },
      {
        label: "Very Long-term (10+ years)",
        description:
          "I am investing for a decade or more (e.g., retirement)",
        score: 5,
      },
    ],
  },
  {
    id: "market_reaction",
    question: "How would you react if your portfolio dropped 20%?",
    subtitle:
      "Your emotional response to losses reveals your true risk tolerance.",
    icon: BarChart3,
    options: [
      {
        label: "Sell everything immediately",
        description:
          "I cannot tolerate any significant loss in my portfolio",
        score: 1,
      },
      {
        label: "Sell some and wait",
        description:
          "I would reduce my exposure and wait for the market to recover",
        score: 2,
      },
      {
        label: "Hold and wait patiently",
        description:
          "I would not panic and wait for the market to bounce back",
        score: 4,
      },
      {
        label: "Buy more at lower prices",
        description:
          "I see drops as buying opportunities and would invest more",
        score: 5,
      },
    ],
  },
  {
    id: "income_stability",
    question: "How stable is your current income?",
    subtitle: "A stable income allows you to take on more investment risk.",
    icon: Wallet,
    options: [
      {
        label: "Irregular or uncertain",
        description:
          "Freelance, commission-based, or seasonal income",
        score: 1,
      },
      {
        label: "Somewhat stable",
        description:
          "Mostly stable with some variation (business owner, contract worker)",
        score: 3,
      },
      {
        label: "Very stable",
        description:
          "Salaried employee with a steady monthly income and job security",
        score: 5,
      },
    ],
  },
  {
    id: "goal_priority",
    question: "What matters most to you in an investment?",
    subtitle:
      "This reveals whether you prioritize capital safety or growth.",
    icon: Target,
    options: [
      {
        label: "Capital preservation",
        description:
          "Protecting my initial investment is the top priority",
        score: 1,
      },
      {
        label: "Balanced approach",
        description:
          "I want a good mix of safety and reasonable growth",
        score: 3,
      },
      {
        label: "Wealth creation",
        description:
          "I want maximum growth and can accept short-term volatility",
        score: 5,
      },
    ],
  },
  {
    id: "age",
    question: "Which age bracket do you fall in?",
    subtitle:
      "Younger investors generally have more time to recover from market downturns.",
    icon: User,
    options: [
      {
        label: "Above 55 years",
        description: "Nearing or in retirement",
        score: 1,
      },
      {
        label: "41-55 years",
        description: "Mid-career, building wealth for retirement",
        score: 3,
      },
      {
        label: "26-40 years",
        description: "Early to mid-career with long investment runway",
        score: 4,
      },
      {
        label: "18-25 years",
        description: "Just starting out with maximum time advantage",
        score: 5,
      },
    ],
  },
  {
    id: "portfolio_allocation",
    question: "How is your current portfolio allocated?",
    subtitle:
      "Your existing allocation tells us about your comfort with different asset classes.",
    icon: Layers,
    options: [
      {
        label: "Mostly FDs and savings",
        description:
          "Over 80% in fixed deposits, savings accounts, or PPF",
        score: 1,
      },
      {
        label: "Mix of FDs and mutual funds",
        description:
          "A balanced mix of fixed income and some equity exposure",
        score: 3,
      },
      {
        label: "Mostly equity / mutual funds",
        description:
          "Over 60% in equity mutual funds, stocks, or ETFs",
        score: 4,
      },
      {
        label: "Aggressive equity-heavy",
        description:
          "Over 80% in equities, including mid/small-caps or thematic funds",
        score: 5,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Risk Profile Definitions                                           */
/* ------------------------------------------------------------------ */

const RISK_PROFILES: Record<string, RiskProfile> = {
  conservative: {
    type: "Conservative",
    tagline: "Safety First, Steady Growth",
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-sky-50",
    iconColor: "text-blue-500",
    icon: Shield,
    equity: 20,
    debt: 70,
    gold: 10,
    fundCategories: [
      "Liquid Funds",
      "Ultra Short Duration Funds",
      "Banking & PSU Debt Funds",
      "Conservative Hybrid Funds",
      "Overnight Funds",
    ],
    description:
      "You prefer stability and capital protection over high returns. Your portfolio focuses on debt instruments with minimal equity exposure to protect against market volatility while still beating inflation.",
  },
  moderate: {
    type: "Moderate",
    tagline: "Balanced Growth with Managed Risk",
    color: "text-emerald-600",
    bgGradient: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-500",
    icon: Target,
    equity: 45,
    debt: 45,
    gold: 10,
    fundCategories: [
      "Balanced Advantage Funds",
      "Aggressive Hybrid Funds",
      "Large Cap Funds",
      "Short Duration Debt Funds",
      "Multi-Asset Allocation Funds",
    ],
    description:
      "You seek a balance between risk and reward. Your portfolio combines equity and debt instruments to generate moderate returns while cushioning against severe market downturns.",
  },
  moderately_aggressive: {
    type: "Moderately Aggressive",
    tagline: "Growth-Oriented with Calculated Risk",
    color: "text-amber-600",
    bgGradient: "from-amber-50 to-orange-50",
    iconColor: "text-amber-500",
    icon: TrendingUp,
    equity: 65,
    debt: 25,
    gold: 10,
    fundCategories: [
      "Flexi Cap Funds",
      "Large & Mid Cap Funds",
      "Index Funds (Nifty 50 / Nifty Next 50)",
      "Equity Savings Funds",
      "Value / Contra Funds",
    ],
    description:
      "You are comfortable with moderate volatility for the potential of higher returns. Your portfolio is tilted towards equity with a meaningful debt allocation to provide a safety net during downturns.",
  },
  aggressive: {
    type: "Aggressive",
    tagline: "Maximum Growth, High Conviction",
    color: "text-red-600",
    bgGradient: "from-red-50 to-rose-50",
    iconColor: "text-red-500",
    icon: Zap,
    equity: 80,
    debt: 10,
    gold: 10,
    fundCategories: [
      "Mid Cap Funds",
      "Small Cap Funds",
      "Sectoral / Thematic Funds",
      "Flexi Cap Funds",
      "International / Global Funds",
    ],
    description:
      "You have a high appetite for risk and are focused on long-term wealth maximization. Your portfolio is heavily equity-focused with exposure to higher-growth segments that can deliver superior returns over time.",
  },
};

/* ------------------------------------------------------------------ */
/*  Scoring Logic                                                      */
/* ------------------------------------------------------------------ */

function getProfile(score: number): RiskProfile {
  if (score <= 14) return RISK_PROFILES.conservative;
  if (score <= 21) return RISK_PROFILES.moderate;
  if (score <= 28) return RISK_PROFILES.moderately_aggressive;
  return RISK_PROFILES.aggressive;
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const fadeSlide = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function RiskProfilePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const totalSteps = QUESTIONS.length;
  const progress = showResult
    ? 100
    : Math.round((currentStep / totalSteps) * 100);

  const currentQuestion = QUESTIONS[currentStep];

  /* ---- Handlers ---- */

  const handleSelect = useCallback(
    (score: number) => {
      const newAnswers = { ...answers, [currentQuestion.id]: score };
      setAnswers(newAnswers);

      if (currentStep < totalSteps - 1) {
        setDirection(1);
        setTimeout(() => setCurrentStep((s) => s + 1), 150);
      } else {
        setDirection(1);
        setTimeout(() => setShowResult(true), 150);
      }
    },
    [answers, currentQuestion, currentStep, totalSteps],
  );

  const handleBack = useCallback(() => {
    if (showResult) {
      setShowResult(false);
      setDirection(-1);
    } else if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, showResult]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
    setShowResult(false);
    setDirection(-1);
  }, []);

  /* ---- Derived values ---- */

  const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);
  const profile = getProfile(totalScore);

  const whatsappLink = `https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20Trustner,%20I%20just%20completed%20the%20risk%20profile%20quiz.`;

  /* ---- Render ---- */

  return (
    <>
      {/* ================================================================ */}
      {/*  HERO SECTION                                                     */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        {/* Dot grid background */}
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

        {/* Gradient orbs */}
        <div className="absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="container-custom relative py-14 lg:py-20">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
            <Link
              href="/"
              className="flex items-center gap-1 transition hover:text-white"
            >
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white">Risk Profile</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-200 backdrop-blur-sm">
              <PieChart size={14} />
              Free Risk Assessment
            </div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Discover Your{" "}
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Investor Profile
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-gray-300">
              Answer {totalSteps} quick questions to understand your risk
              appetite and get a personalised asset allocation recommendation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  MAIN CONTENT                                                     */}
      {/* ================================================================ */}
      <section className="bg-surface-100 py-12 lg:py-16">
        <div className="container-custom">
          {/* ---- Progress Bar ---- */}
          <div className="mx-auto mb-10 max-w-2xl">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600">
                {showResult
                  ? "Assessment Complete"
                  : `Question ${currentStep + 1} of ${totalSteps}`}
              </span>
              <span className="font-semibold text-primary-500">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* ---- Questionnaire / Result ---- */}
          <div className="mx-auto max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              {!showResult ? (
                /* ======================================================= */
                /*  QUESTION CARD                                           */
                /* ======================================================= */
                <motion.div
                  key={currentQuestion.id}
                  custom={direction}
                  variants={fadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="rounded-2xl border border-gray-100 bg-white shadow-card"
                >
                  {/* Header */}
                  <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                      <currentQuestion.icon
                        size={24}
                        className="text-primary-500"
                      />
                    </div>
                    <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
                      {currentQuestion.question}
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-500">
                      {currentQuestion.subtitle}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 px-6 py-6 sm:px-8">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected =
                        answers[currentQuestion.id] === option.score;
                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: 0.1 + idx * 0.06,
                              duration: 0.35,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          }}
                          onClick={() => handleSelect(option.score)}
                          className={`group flex w-full items-start gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-primary-500 bg-primary-50 shadow-glow-blue"
                              : "border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/30"
                          }`}
                        >
                          {/* Radio indicator */}
                          <span
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected
                                ? "border-primary-500 bg-primary-500"
                                : "border-gray-300 group-hover:border-primary-300"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>

                          <div>
                            <span className="block text-sm font-semibold text-gray-900">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                              {option.description}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Footer navigation */}
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 sm:px-8">
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                    <span className="text-xs text-gray-400">
                      Select an option to proceed
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* ======================================================= */
                /*  RESULT SCREEN                                           */
                /* ======================================================= */
                <motion.div
                  key="result"
                  custom={direction}
                  variants={fadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-6"
                  >
                    {/* ---- Profile Summary Card ---- */}
                    <motion.div
                      variants={staggerItem}
                      className={`overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br ${profile.bgGradient} shadow-card`}
                    >
                      <div className="px-6 py-8 text-center sm:px-8 sm:py-10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
                          <profile.icon
                            size={32}
                            className={profile.iconColor}
                          />
                        </div>
                        <div className="mb-1 flex items-center justify-center gap-2">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-500">
                            Your Risk Profile
                          </span>
                        </div>
                        <h2
                          className={`mb-2 text-3xl font-extrabold sm:text-4xl ${profile.color}`}
                        >
                          {profile.type}
                        </h2>
                        <p className="mb-3 text-base font-medium text-gray-600">
                          {profile.tagline}
                        </p>
                        <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500">
                          {profile.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-4 py-1.5 text-xs font-semibold text-gray-600 backdrop-blur-sm">
                          Score: {totalScore} / {totalSteps * 5}
                        </div>
                      </div>
                    </motion.div>

                    {/* ---- Asset Allocation Card ---- */}
                    <motion.div
                      variants={staggerItem}
                      className="rounded-2xl border border-gray-100 bg-white shadow-card"
                    >
                      <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          <PieChart size={20} className="text-primary-500" />
                          Recommended Asset Allocation
                        </h3>
                      </div>
                      <div className="px-6 py-6 sm:px-8">
                        {/* Individual bars */}
                        <div className="space-y-5">
                          {/* Equity */}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-700">
                                Equity (Mutual Funds)
                              </span>
                              <span className="font-bold text-blue-600">
                                {profile.equity}%
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.equity}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.2,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>

                          {/* Debt */}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-700">
                                Debt (Bonds & FDs)
                              </span>
                              <span className="font-bold text-emerald-600">
                                {profile.debt}%
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.debt}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.35,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>

                          {/* Gold */}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-700">
                                Gold (SGBs & Gold Funds)
                              </span>
                              <span className="font-bold text-amber-600">
                                {profile.gold}%
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.gold}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.5,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Combined stacked bar */}
                        <div className="mt-6 flex h-5 overflow-hidden rounded-full">
                          <motion.div
                            className="bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${profile.equity}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.6,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                          <motion.div
                            className="bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${profile.debt}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.7,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                          <motion.div
                            className="bg-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${profile.gold}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.8,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        </div>

                        {/* Legend */}
                        <div className="mt-2 flex items-center justify-center gap-5 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Equity
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Debt
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                            Gold
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* ---- Suggested Fund Categories Card ---- */}
                    <motion.div
                      variants={staggerItem}
                      className="rounded-2xl border border-gray-100 bg-white shadow-card"
                    >
                      <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          <Layers size={20} className="text-primary-500" />
                          Suggested Fund Categories
                        </h3>
                      </div>
                      <div className="px-6 py-5 sm:px-8">
                        <ul className="space-y-3">
                          {profile.fundCategories.map((cat, idx) => (
                            <motion.li
                              key={cat}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: 0.3 + idx * 0.08,
                                  duration: 0.35,
                                },
                              }}
                              className="flex items-center gap-3 text-sm text-gray-700"
                            >
                              <CheckCircle2
                                size={16}
                                className="flex-shrink-0 text-emerald-500"
                              />
                              {cat}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>

                    {/* ---- CTA Buttons ---- */}
                    <motion.div
                      variants={staggerItem}
                      className="flex flex-col gap-3 sm:flex-row"
                    >
                      <Link
                        href="/mutual-funds"
                        className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
                      >
                        Explore Mutual Funds
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        <MessageCircle size={16} />
                        Talk to an Advisor on WhatsApp
                      </a>
                    </motion.div>

                    {/* ---- Bottom actions ---- */}
                    <motion.div
                      variants={staggerItem}
                      className="flex items-center justify-between"
                    >
                      <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                      >
                        <ArrowLeft size={16} />
                        Review Answers
                      </button>
                      <button
                        onClick={handleRestart}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary-500 transition hover:text-primary-700"
                      >
                        <RotateCcw size={16} />
                        Retake Quiz
                      </button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SEBI DISCLAIMER                                                  */}
      {/* ================================================================ */}
      <div className="border-y border-amber-100/50 bg-gradient-to-r from-amber-50/60 via-amber-50/40 to-amber-50/60 py-4">
        <div className="container-custom">
          <div className="flex items-start justify-center gap-2.5 text-center">
            <AlertTriangle
              size={14}
              className="mt-0.5 flex-shrink-0 text-amber-500"
            />
            <div>
              <p className="text-xs leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-700">
                  {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
                </span>{" "}
                <span className="text-gray-500">
                  {REGULATORY.PAST_PERFORMANCE.split(".")[0]}.
                </span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                <Info
                  size={12}
                  className="mr-1 inline-block text-gray-400"
                />
                {REGULATORY.DISTRIBUTOR_DISCLAIMER}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            {REGULATORY.MF_ENTITY} | {REGULATORY.AMFI_ARN} | Mutual Fund
            Distributor (Not a SEBI Registered Investment Adviser)
          </p>
        </div>
      </div>
    </>
  );
}
