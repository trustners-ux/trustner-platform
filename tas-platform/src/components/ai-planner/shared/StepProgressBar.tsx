"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Welcome", short: "Start" },
  { label: "Personal", short: "You" },
  { label: "Income", short: "Income" },
  { label: "Expenses", short: "Spend" },
  { label: "Assets", short: "Own" },
  { label: "Liabilities", short: "Owe" },
  { label: "Insurance", short: "Cover" },
  { label: "Goals", short: "Goals" },
  { label: "Risk", short: "Risk" },
  { label: "Tax", short: "Tax" },
  { label: "Review", short: "Review" },
];

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export default function StepProgressBar({
  currentStep,
  totalSteps = STEPS.length,
}: StepProgressBarProps) {
  const progress = Math.min(100, (currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="w-full">
      {/* Mobile: simple progress bar */}
      <div className="lg:hidden">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700">
            {currentStep < STEPS.length
              ? STEPS[currentStep].label
              : "Complete"}
          </span>
          <span className="text-gray-400">
            {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Desktop: step dots */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="relative flex items-center">
                {index > 0 && (
                  <div
                    className={`absolute right-full h-0.5 w-8 xl:w-12 ${
                      index <= currentStep ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
                <motion.div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    index < currentStep
                      ? "bg-emerald-500 text-white"
                      : index === currentStep
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-gray-100 text-gray-400"
                  }`}
                  animate={
                    index === currentStep ? { scale: [1, 1.1, 1] } : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  {index < currentStep ? (
                    <Check size={14} />
                  ) : (
                    index + 1
                  )}
                </motion.div>
              </div>
              <span
                className={`mt-1.5 text-[10px] ${
                  index === currentStep
                    ? "font-bold text-blue-600"
                    : index < currentStep
                      ? "font-medium text-emerald-600"
                      : "text-gray-400"
                }`}
              >
                {step.short}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
