"use client";

import { cn } from "@/lib/utils/cn";
import type { RiskLevel } from "@/lib/constants/fund-categories";

interface RiskOMeterProps {
  level: RiskLevel | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const RISK_CONFIG: Record<
  string,
  { index: number; color: string; bg: string; rotation: number }
> = {
  Low: { index: 0, color: "#00875A", bg: "#E3FCEF", rotation: -75 },
  "Moderately Low": { index: 1, color: "#36B37E", bg: "#E3FCEF", rotation: -45 },
  Moderate: { index: 2, color: "#FF991F", bg: "#FFF7E6", rotation: -15 },
  "Moderately High": { index: 3, color: "#FF6B35", bg: "#FFF0E6", rotation: 15 },
  High: { index: 4, color: "#DE350B", bg: "#FFEBE6", rotation: 45 },
  "Very High": { index: 5, color: "#BF2600", bg: "#FFEBE6", rotation: 75 },
};

export default function RiskOMeter({
  level,
  size = "md",
  showLabel = true,
}: RiskOMeterProps) {
  const config = RISK_CONFIG[level] || RISK_CONFIG["Moderate"];

  const sizeClasses = {
    sm: "w-16 h-10",
    md: "w-24 h-14",
    lg: "w-36 h-20",
  };

  const textSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Gauge */}
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 120 70" className="h-full w-full">
          {/* Background arc segments */}
          {[
            { color: "#00875A", start: -90, end: -60 },
            { color: "#36B37E", start: -60, end: -30 },
            { color: "#FF991F", start: -30, end: 0 },
            { color: "#FF6B35", start: 0, end: 30 },
            { color: "#DE350B", start: 30, end: 60 },
            { color: "#BF2600", start: 60, end: 90 },
          ].map((seg, i) => {
            const r = 45;
            const cx = 60;
            const cy = 60;
            const startAngle = (seg.start * Math.PI) / 180;
            const endAngle = (seg.end * Math.PI) / 180;
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={i === config.index ? seg.color : `${seg.color}30`}
                strokeWidth={i === config.index ? 10 : 6}
                strokeLinecap="round"
              />
            );
          })}

          {/* Needle */}
          <line
            x1="60"
            y1="60"
            x2={60 + 30 * Math.cos((config.rotation * Math.PI) / 180 - Math.PI / 2)}
            y2={60 + 30 * Math.sin((config.rotation * Math.PI) / 180 - Math.PI / 2)}
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="3" fill={config.color} />
        </svg>
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            "font-bold",
            textSizes[size]
          )}
          style={{ color: config.color }}
        >
          {level}
        </span>
      )}
    </div>
  );
}
