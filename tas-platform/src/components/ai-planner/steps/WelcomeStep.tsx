"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Clock,
  Lock,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { hasStarted, resetPlan } = useFinancialPlanStore();

  return (
    <div className="mx-auto max-w-3xl text-center">
      {/* Icon */}
      <motion.div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <Brain size={36} className="text-white" />
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Your AI Financial Planner
      </motion.h1>

      <motion.p
        className="mb-2 text-lg text-gray-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Get a comprehensive financial plan that would normally cost
        <span className="mx-1 font-bold text-gray-900">
          ₹10,000 - ₹25,000
        </span>
        from a Certified Financial Planner.
      </motion.p>

      <motion.p
        className="mb-8 text-3xl font-extrabold text-emerald-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Absolutely Free.
      </motion.p>

      {/* Features */}
      <motion.div
        className="mb-10 grid gap-4 text-left sm:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {[
          {
            icon: Clock,
            title: "15 Minutes",
            desc: "Quick guided process, one step at a time",
          },
          {
            icon: Lock,
            title: "100% Private",
            desc: "Data stays on your device. No server storage.",
          },
          {
            icon: Target,
            title: "Goal-Based Planning",
            desc: "Retirement, education, house — all covered",
          },
          {
            icon: Shield,
            title: "Insurance Gap Analysis",
            desc: "Know exactly how much cover you need",
          },
          {
            icon: TrendingUp,
            title: "Tax Optimization",
            desc: "Save more with smart tax planning",
          },
          {
            icon: Brain,
            title: "AI-Powered Insights",
            desc: "Personalized recommendations for your situation",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <feature.icon size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{feature.title}</p>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
        >
          {hasStarted ? "Continue My Plan" : "Create My Financial Plan"}
          <ArrowRight size={20} />
        </button>

        {hasStarted && (
          <div>
            <button
              onClick={() => {
                resetPlan();
                onNext();
              }}
              className="text-sm text-gray-400 transition hover:text-gray-600"
            >
              or start fresh
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400">
          No registration required. No credit card needed.
        </p>
      </motion.div>
    </div>
  );
}
