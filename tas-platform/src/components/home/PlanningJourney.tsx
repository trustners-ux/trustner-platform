"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  ClipboardList,
  Brain,
  Gauge,
  Target,
  Play,
  ArrowRight,
} from "lucide-react";

const JOURNEY_STEPS = [
  {
    step: 1,
    icon: Rocket,
    title: "Start",
    description: "15-minute guided session. No registration needed.",
    color: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Input",
    description: "Income, expenses, goals, insurance, tax — all captured.",
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    step: 3,
    icon: Brain,
    title: "Analyze",
    description: "AI crunches numbers across 6 financial dimensions.",
    color: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    step: 4,
    icon: Gauge,
    title: "Score",
    description: "Get your Financial Health Score out of 100.",
    color: "from-amber-500 to-amber-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 5,
    icon: Target,
    title: "Recommend",
    description: "Personalized action items with specific gaps identified.",
    color: "from-rose-500 to-rose-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    step: 6,
    icon: Play,
    title: "Execute",
    description: "Start SIPs, get insurance, optimize tax — all in one place.",
    color: "from-cyan-500 to-cyan-600",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PlanningJourney() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Your Planning Journey
          </p>
          <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            From Zero to Financial Clarity
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              in 6 Simple Steps
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Our structured flow takes you from data collection through AI
            analysis to actionable recommendations — just like a professional
            financial planner would, but in 15 minutes instead of 15 days.
          </p>
        </div>

        {/* Journey Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {JOURNEY_STEPS.map((item) => (
            <motion.div
              key={item.step}
              variants={stepVariants}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-md"
            >
              {/* Step number */}
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-xs font-bold text-white`}
                >
                  {item.step}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}
                >
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
              </div>

              {/* Content */}
              <h3 className="mb-1 text-base font-extrabold text-gray-900">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/ai-planner"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/35 hover:brightness-110"
          >
            Start My Financial Plan
            <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            No registration required. Data stays on your device.
          </p>
        </div>
      </div>
    </section>
  );
}
