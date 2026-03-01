"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Shield,
  Target,
  MessageCircle,
  BarChart3,
  Receipt,
  HeartPulse,
  Sparkles,
} from "lucide-react";

const ROTATING_WORDS = [
  "Retirement Readiness",
  "Insurance Gaps",
  "Tax Savings",
  "Goal Planning",
  "Debt Analysis",
  "Wealth Score",
];

const FEATURE_CARDS = [
  {
    icon: Brain,
    title: "AI-Powered Planning",
    desc: "Get a CFP-quality financial plan in 15 minutes. Covers net worth, cash flow, goals, insurance, tax and asset allocation.",
    color: "from-violet-500/20 to-violet-600/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Shield,
    title: "Insurance Gap Analysis",
    desc: "Find out if your health and life cover are adequate. Three-method analysis with city-wise medical cost benchmarks.",
    color: "from-green-500/20 to-green-600/20",
    iconColor: "text-green-400",
  },
  {
    icon: Target,
    title: "Goal Roadmap with SIPs",
    desc: "Retirement, child education, house, travel — each goal gets its own SIP plan with inflation-adjusted projections.",
    color: "from-amber-500/20 to-amber-600/20",
    iconColor: "text-amber-400",
  },
];

const STATS = [
  { value: "12", label: "Free Calculators" },
  { value: "15 min", label: "Full Financial Plan" },
  { value: "100%", label: "Data on Your Device" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: BarChart3,
    title: "Answer Questions",
    desc: "Share your income, expenses, assets and goals in a simple step-by-step wizard.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Get Your Plan",
    desc: "Our AI engine analyses your finances and creates a comprehensive plan with scores and gaps.",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Start Executing",
    desc: "Act on recommendations — start SIPs, fix insurance gaps, optimise taxes through our platform.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: 0.3 + i * 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Main Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
        {/* Background Dot Grid Pattern */}
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

        {/* Subtle Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/5 blur-[100px]" />

        <div className="container-custom relative py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Text Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Badge Pill */}
              <motion.div variants={fadeUpVariants}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-primary-200 backdrop-blur-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
                  </span>
                  AI-Powered Financial Planning
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUpVariants}
                className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Understand Your
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  Complete Financial Life
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl">in 15 Minutes</span>
              </motion.h1>

              {/* Rotating Words */}
              <motion.div
                variants={fadeUpVariants}
                className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-300 sm:text-2xl"
              >
                <span className="text-gray-400">for</span>
                <div className="relative h-9 overflow-hidden sm:h-10">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="absolute left-0 whitespace-nowrap bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent"
                    >
                      {ROTATING_WORDS[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                variants={fadeUpVariants}
                className="mb-8 max-w-lg text-lg leading-relaxed text-gray-300"
              >
                Get a CFP-quality financial plan worth ₹15,000 — absolutely free.
                AI analyzes your income, expenses, goals, insurance, and tax to
                give you a personalized action plan. No registration required.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUpVariants}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/ai-planner"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40 hover:brightness-110"
                >
                  Create My Free Plan
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 rounded-xl border-2 border-white/20 px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5"
                >
                  <MessageCircle size={18} />
                  Talk to an Advisor
                </Link>
              </motion.div>

              {/* Trust Stats */}
              <motion.div
                variants={fadeUpVariants}
                className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8"
              >
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-extrabold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Feature Cards (Desktop Only) */}
            <div className="hidden lg:block">
              <div className="space-y-4">
                {FEATURE_CARDS.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="group cursor-default rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
                      >
                        <feature.icon size={24} className={feature.iconColor} />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-bold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-400">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-violet-600">
              How It Works
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900 lg:text-4xl">
              Your Financial Plan in 3 Steps
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              No sign-up required. No data shared with anyone. Everything runs
              locally on your device.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-1.5 text-xs font-bold text-white">
                  Step {item.step}
                </div>
                <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                  <item.icon size={28} className="text-violet-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-gray-300 md:block">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/ai-planner"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/35 hover:brightness-110"
            >
              Start My Free Financial Plan
              <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              AMFI Registered | ARN-286886 | IRDAI License 1067
            </p>
          </div>
        </div>
      </section>

      {/* Plan Coverage Section */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
              What You Get
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900 lg:text-4xl">
              A Complete Financial Health Report
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BarChart3,
                title: "Net Worth Tracking",
                desc: "Assets vs liabilities with liquid asset analysis",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Target,
                title: "Goal Roadmap",
                desc: "Inflation-adjusted targets with SIP plans for each goal",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: HeartPulse,
                title: "Insurance Gap Analysis",
                desc: "Health and term cover adequacy with city benchmarks",
                color: "bg-rose-50 text-rose-600",
              },
              {
                icon: Receipt,
                title: "Tax Optimization",
                desc: "Old vs New regime comparison with unused deductions",
                color: "bg-violet-50 text-violet-600",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                >
                  <item.icon size={22} />
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
