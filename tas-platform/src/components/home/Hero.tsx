"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Target,
  MessageCircle,
} from "lucide-react";

const ROTATING_WORDS = [
  "Mutual Funds",
  "SIP Investments",
  "Health Insurance",
  "Tax Saving ELSS",
  "Life Insurance",
  "NPS & Retirement",
];

const FEATURE_CARDS = [
  {
    icon: TrendingUp,
    title: "Smart Fund Selection",
    desc: "Compare 5000+ mutual funds across all categories with data-driven insights to pick the right fund for your goals.",
    color: "from-blue-500/20 to-blue-600/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Shield,
    title: "Complete Protection",
    desc: "Health, Life, Motor & Travel insurance from 30+ top insurers. Best coverage at the best price, guaranteed.",
    color: "from-green-500/20 to-green-600/20",
    iconColor: "text-green-400",
  },
  {
    icon: Target,
    title: "Goal-Based Planning",
    desc: "SIP calculators, tax-saving tools, and retirement planners to help you achieve every financial milestone.",
    color: "from-amber-500/20 to-amber-600/20",
    iconColor: "text-amber-400",
  },
];

const STATS = [
  { value: "500+", label: "Families Served" },
  { value: "40+", label: "AMC Partners" },
  { value: "Rs.100 Cr+", label: "Assets Managed" },
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
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                AMFI Registered | ARN-286886
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUpVariants}
              className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Grow Your Wealth
              <br />
              with{" "}
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Confidence
              </span>
            </motion.h1>

            {/* Rotating Words */}
            <motion.div
              variants={fadeUpVariants}
              className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-300 sm:text-2xl"
            >
              <span className="text-gray-400">in</span>
              <div className="relative h-9 overflow-hidden sm:h-10">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute left-0 whitespace-nowrap bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent"
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
              One platform for all your financial needs. Compare mutual funds,
              start SIP, get insurance quotes, and plan your financial future
              with expert guidance.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/mutual-funds"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:brightness-110"
              >
                Explore Mutual Funds
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
  );
}
