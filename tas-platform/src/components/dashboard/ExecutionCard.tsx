"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { formatLakhsCrores } from "@/lib/utils/formatters";
import type { ActionItem } from "@/types/financial-plan";

const PRIORITY_STYLES: Record<
  ActionItem["priority"],
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  urgent: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Urgent",
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    label: "High",
  },
  medium: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Medium",
  },
  low: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    label: "Low",
  },
};

/**
 * ExecutionCard — Enhanced action item card with 3-step execution flow.
 *
 * Shows: [1. Gap Identified] → [2. Recommended Category] → [3. Execute]
 * Falls back to standard action card if executionFlow is not present.
 */
export default function ExecutionCard({ action }: { action: ActionItem }) {
  const style = PRIORITY_STYLES[action.priority];
  const flow = action.executionFlow;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Header: Priority badge + title */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
        <h4 className="text-sm font-extrabold text-gray-900">
          {action.title}
        </h4>
      </div>

      {/* Execution flow: 3-step visual */}
      {flow ? (
        <div className="mb-4">
          <div className="flex items-stretch gap-0">
            {/* Step 1: Gap Identified */}
            <div className="flex-1 rounded-l-xl border border-r-0 border-red-100 bg-red-50/50 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Gap Identified
                </span>
              </div>
              <p className="text-xs font-bold text-red-700">
                {formatLakhsCrores(flow.gapAmount)}
              </p>
              <p className="text-[10px] text-red-500/80">{flow.gapType} gap</p>
            </div>

            {/* Arrow connector */}
            <div className="flex items-center bg-gray-50 px-1">
              <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            </div>

            {/* Step 2: Recommended Category */}
            <div className="flex-1 border border-x-0 border-blue-100 bg-blue-50/50 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Recommended
                </span>
              </div>
              <p className="text-xs font-bold text-blue-700">
                {flow.recommendedCategory}
              </p>
              <p className="text-[10px] text-blue-500/80">
                {flow.recommendedProducts[0]?.reason || "Based on your profile"}
              </p>
            </div>

            {/* Arrow connector */}
            <div className="flex items-center bg-gray-50 px-1">
              <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            </div>

            {/* Step 3: Execute */}
            <div className="flex flex-1 flex-col items-center justify-center rounded-r-xl border border-l-0 border-emerald-100 bg-emerald-50/50 p-3">
              <Link
                href={flow.recommendedProducts[0]?.href || action.cta.href}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700"
              >
                {action.cta.label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Description */}
      <p className="text-xs leading-relaxed text-gray-500">
        {action.description}
      </p>

      {/* Impact */}
      {action.impact && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-blue-600">
          <TrendingUp className="w-3 h-3" /> {action.impact}
        </p>
      )}

      {/* Fallback CTA if no execution flow */}
      {!flow && action.cta && (
        <Link
          href={action.cta.href}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          {action.cta.label} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
