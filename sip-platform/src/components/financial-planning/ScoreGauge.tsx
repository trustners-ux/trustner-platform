'use client';

import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0-900
  grade: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const GRADE_COLORS: Record<string, { stroke: string; text: string; bg: string }> = {
  'Excellent': { stroke: '#065F46', text: '#065F46', bg: '#ECFDF5' },
  'Good': { stroke: '#0F766E', text: '#0F766E', bg: '#F0FDFA' },
  'Fair': { stroke: '#D97706', text: '#92400E', bg: '#FFFBEB' },
  'Needs Improvement': { stroke: '#EA580C', text: '#9A3412', bg: '#FFF7ED' },
  'Critical': { stroke: '#DC2626', text: '#991B1B', bg: '#FEF2F2' },
};

const SIZE_CONFIG = {
  sm: { width: 200, height: 120, strokeWidth: 12, radius: 70, fontSize: 30, labelSize: 10, padding: 20 },
  md: { width: 280, height: 165, strokeWidth: 16, radius: 100, fontSize: 44, labelSize: 13, padding: 25 },
  lg: { width: 360, height: 210, strokeWidth: 20, radius: 130, fontSize: 58, labelSize: 16, padding: 30 },
};

export default function ScoreGauge({ score, grade, size = 'md', animate = true }: ScoreGaugeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const shouldAnimate = animate && !prefersReducedMotion;
  const [displayScore, setDisplayScore] = useState(shouldAnimate ? 0 : score);
  const config = SIZE_CONFIG[size];
  const colors = GRADE_COLORS[grade] || GRADE_COLORS['Fair'];

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setDisplayScore(score);
    }
  }, [score]);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayScore(score);
      return;
    }

    let start = 0;
    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score, shouldAnimate]);

  // Arc calculation — semicircle (180 degrees)
  const centerX = config.width / 2;
  const centerY = config.height - config.padding;
  const r = config.radius;
  const sw = config.strokeWidth;

  // SVG arc: start from left (180°) to right (0°)
  const startAngle = Math.PI; // 180 degrees (left)
  const scorePercent = Math.min(displayScore / 900, 1);
  const currentAngle = startAngle - scorePercent * Math.PI;

  const arcStartX = centerX + r * Math.cos(startAngle);
  const arcStartY = centerY - r * Math.sin(startAngle);
  const arcEndX = centerX + r * Math.cos(0);
  const arcEndY = centerY - r * Math.sin(0);
  const scoreEndX = centerX + r * Math.cos(currentAngle);
  const scoreEndY = centerY - r * Math.sin(currentAngle);

  const largeArcFlag = scorePercent > 0.5 ? 1 : 0;

  // Background arc (full semicircle)
  const bgArcPath = `M ${arcStartX} ${arcStartY} A ${r} ${r} 0 1 1 ${arcEndX} ${arcEndY}`;
  // Score arc
  const scoreArcPath = scorePercent > 0
    ? `M ${arcStartX} ${arcStartY} A ${r} ${r} 0 ${largeArcFlag} 1 ${scoreEndX} ${scoreEndY}`
    : '';

  // Tick marks at 0, 180, 360, 540, 720, 900
  const ticks = [0, 180, 360, 540, 720, 900];
  const tickMarks = ticks.map((val) => {
    const pct = val / 900;
    const angle = startAngle - pct * Math.PI;
    const innerR = r - sw / 2 - 3;
    const outerR = r + sw / 2 + 3;
    return {
      val,
      x1: centerX + innerR * Math.cos(angle),
      y1: centerY - innerR * Math.sin(angle),
      x2: centerX + outerR * Math.cos(angle),
      y2: centerY - outerR * Math.sin(angle),
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={config.width} height={config.height} viewBox={`0 0 ${config.width} ${config.height}`} role="img" aria-label={`Financial wellness score: ${score} out of 900. Grade: ${grade}`}>
        {/* Background arc — multi-color band showing the full scale */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={sw}
          strokeLinecap="round"
        />

        {/* Score arc — solid color based on grade */}
        {scoreArcPath && (
          <path
            d={scoreArcPath}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={sw + 2}
            strokeLinecap="round"
          />
        )}

        {/* Small tick marks */}
        {tickMarks.map((t) => (
          <line
            key={t.val}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#CBD5E1"
            strokeWidth={1.5}
          />
        ))}

        {/* Score text */}
        <text
          x={centerX}
          y={centerY - r * 0.35}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={config.fontSize}
          fontWeight="800"
          fill={colors.text}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {displayScore}
        </text>

        {/* "out of 900" label */}
        <text
          x={centerX}
          y={centerY - r * 0.35 + config.fontSize * 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={config.labelSize}
          fill="#94A3B8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          out of 900
        </text>

        {/* Scale labels — placed below the arc ends with padding */}
        <text
          x={arcStartX - 2}
          y={centerY + config.labelSize + 4}
          fontSize={config.labelSize - 1}
          fill="#94A3B8"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          0
        </text>
        <text
          x={arcEndX + 2}
          y={centerY + config.labelSize + 4}
          fontSize={config.labelSize - 1}
          fill="#94A3B8"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          900
        </text>
      </svg>

      {/* Grade badge */}
      <div
        className="mt-1 px-4 py-1.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {grade}
      </div>
    </div>
  );
}
