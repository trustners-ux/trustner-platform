"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Zustand/localStorage
const PlannerWizard = dynamic(
  () => import("@/components/ai-planner/PlannerWizard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Loading AI Planner...</p>
        </div>
      </div>
    ),
  }
);

export default function AIPlannerPage() {
  return <PlannerWizard />;
}
