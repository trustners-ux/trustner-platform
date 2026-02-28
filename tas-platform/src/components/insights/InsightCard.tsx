"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Insight {
  id: string;
  type: "tip" | "opportunity" | "warning" | "achievement";
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

const TYPE_CONFIG: Record<
  Insight["type"],
  { icon: LucideIcon; bg: string; border: string; iconColor: string; titleColor: string }
> = {
  tip: {
    icon: Lightbulb,
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
  },
  opportunity: {
    icon: TrendingUp,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
  },
  achievement: {
    icon: CheckCircle2,
    bg: "bg-violet-50",
    border: "border-violet-100",
    iconColor: "text-violet-600",
    titleColor: "text-violet-900",
  },
};

export default function InsightCard({ insight }: { insight: Insight }) {
  const config = TYPE_CONFIG[insight.type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-4`}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Icon size={18} className={config.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${config.titleColor}`}>
          {insight.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
          {insight.description}
        </p>
        {insight.cta && (
          <Link
            href={insight.cta.href}
            className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${config.iconColor} transition hover:underline`}
          >
            {insight.cta.label} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
