"use client";

import { Users } from "lucide-react";
import type { NudgeItem } from "@/lib/utils/behavioral-nudges";

/**
 * NudgeCard — Peer comparison visualization card.
 *
 * Renders a horizontal bar showing the user's position vs a benchmark,
 * color-coded green when above benchmark and amber when below.
 */
export default function NudgeCard({ nudge }: { nudge: NudgeItem }) {
  const barColor = nudge.isAbove ? "bg-emerald-500" : "bg-amber-500";
  const benchmarkColor = nudge.isAbove ? "text-emerald-600" : "text-amber-600";
  const tagBg = nudge.isAbove
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="text-sm font-extrabold text-gray-900">{nudge.title}</h4>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tagBg}`}
        >
          <Users size={10} />
          {nudge.isAbove ? "Above benchmark" : "Below benchmark"}
        </span>
      </div>

      {/* Comparison bar */}
      <div className="relative mb-3">
        {/* Track */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          {/* User bar */}
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-1000`}
            style={{ width: `${Math.max(2, nudge.userValue)}%` }}
          />
        </div>

        {/* Benchmark marker */}
        {nudge.benchmarkValue < 100 && (
          <div
            className="absolute top-0 h-3 w-0.5 bg-gray-800"
            style={{ left: `${nudge.benchmarkValue}%` }}
            title={`Benchmark: ${nudge.benchmarkLabel}`}
          />
        )}

        {/* Labels */}
        <div className="mt-1.5 flex items-center justify-between text-[10px]">
          <span className="font-bold text-gray-700">
            You: {nudge.userLabel}
          </span>
          <span className={`font-bold ${benchmarkColor}`}>
            Benchmark: {nudge.benchmarkLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-gray-500">
        {nudge.description}
      </p>
    </div>
  );
}
