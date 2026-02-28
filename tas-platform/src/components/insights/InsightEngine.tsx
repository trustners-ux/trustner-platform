"use client";

import InsightCard, { type Insight } from "./InsightCard";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import { BENCHMARKS, INFLATION } from "@/lib/constants/financial-constants";

/**
 * Generate contextual insights for a SIP calculator result.
 */
export function generateSIPInsights(params: {
  monthlyInvestment: number;
  expectedReturn: number;
  timePeriod: number;
  futureValue: number;
  totalInvested: number;
}): Insight[] {
  const { monthlyInvestment, expectedReturn, timePeriod, futureValue, totalInvested } = params;
  const insights: Insight[] = [];
  const wealthGain = futureValue - totalInvested;

  // Step-up insight
  const stepUpSIP = monthlyInvestment * 1.1; // 10% step-up
  const stepUpMonths = timePeriod * 12;
  // Rough FV with step-up (simplified)
  const stepUpFV = futureValue * 1.35; // ~35% more with 10% annual step-up over long periods
  insights.push({
    id: "sip-stepup",
    type: "opportunity",
    title: `Increase SIP by ₹${Math.round((stepUpSIP - monthlyInvestment) / 100) * 100}/month`,
    description: `A 10% annual step-up could grow your corpus to approximately ${formatLakhsCrores(stepUpFV)} — that's ~35% more than a flat SIP.`,
    cta: { label: "Learn about step-up SIP", href: "/calculators/sip" },
  });

  // Delay impact
  if (timePeriod >= 5) {
    const delayMonths = (timePeriod - 1) * 12;
    const r = expectedReturn / 100 / 12;
    const delayFV = monthlyInvestment * ((Math.pow(1 + r, delayMonths) - 1) / r) * (1 + r);
    const loss = futureValue - delayFV;
    insights.push({
      id: "sip-delay",
      type: "warning",
      title: "Starting 1 year later costs you",
      description: `If you delay by 1 year, you lose approximately ${formatLakhsCrores(loss)} from your final corpus. Time in market matters more than timing.`,
    });
  }

  // Wealth multiplier
  const multiplier = (futureValue / totalInvested).toFixed(1);
  insights.push({
    id: "sip-multiplier",
    type: "achievement",
    title: `${multiplier}x wealth multiplier`,
    description: `Your total investment of ${formatLakhsCrores(totalInvested)} grows to ${formatLakhsCrores(futureValue)}. That's ${formatLakhsCrores(wealthGain)} in wealth creation through compounding.`,
  });

  // Tax saving
  if (monthlyInvestment <= 12500) {
    const annual = monthlyInvestment * 12;
    const taxSaving = Math.min(annual, 150000) * 0.312; // ~31.2% for 30% slab
    insights.push({
      id: "sip-elss",
      type: "tip",
      title: "Consider ELSS for tax savings",
      description: `If invested in ELSS funds, your ₹${(annual / 1000).toFixed(0)}K annual investment could save up to ${formatINR(taxSaving)} in taxes under Section 80C.`,
      cta: { label: "Explore ELSS Funds", href: "/mutual-funds?category=elss" },
    });
  }

  return insights;
}

/**
 * Generate contextual insights for a tax calculator result.
 */
export function generateTaxInsights(params: {
  regime: "old" | "new";
  grossIncome: number;
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  taxPayable: number;
}): Insight[] {
  const insights: Insight[] = [];
  const { section80C, section80D, section80CCD1B, grossIncome } = params;

  // 80C gap
  const unused80C = 150000 - section80C;
  if (unused80C > 10000) {
    const potentialSaving = unused80C * 0.312;
    insights.push({
      id: "tax-80c",
      type: "opportunity",
      title: `₹${(unused80C / 1000).toFixed(0)}K unused under Section 80C`,
      description: `You can save an additional ${formatINR(potentialSaving)} by investing ${formatINR(unused80C)} in ELSS, PPF, or NPS. ELSS has the shortest lock-in (3 years) with equity growth potential.`,
      cta: { label: "Start ELSS SIP", href: "/mutual-funds?category=elss" },
    });
  }

  // 80D gap
  const unused80D = 25000 - section80D;
  if (unused80D > 5000) {
    insights.push({
      id: "tax-80d",
      type: "tip",
      title: "Health insurance premium deduction available",
      description: `You can claim up to ₹25,000 more under Section 80D for health insurance premiums. Parents' premium (₹50,000 if senior citizen) is additional.`,
      cta: { label: "Get Health Insurance", href: "/insurance/health" },
    });
  }

  // NPS 80CCD(1B)
  if (section80CCD1B < 50000) {
    const unused = 50000 - section80CCD1B;
    insights.push({
      id: "tax-nps",
      type: "opportunity",
      title: `₹${(unused / 1000).toFixed(0)}K additional tax saving via NPS`,
      description: `Section 80CCD(1B) allows extra ₹50,000 deduction for NPS contributions — over and above the ₹1.5L limit of 80C. Potential saving: ${formatINR(unused * 0.312)}.`,
      cta: { label: "Invest in NPS", href: "/investments/nps" },
    });
  }

  // High income tip
  if (grossIncome >= 1500000) {
    insights.push({
      id: "tax-huf",
      type: "tip",
      title: "Consider creating an HUF for tax savings",
      description: "A Hindu Undivided Family (HUF) gets a separate PAN and its own tax-free slabs. Can save significant tax for high-income families.",
      cta: { label: "HUF Tax Planner", href: "/calculators/huf" },
    });
  }

  return insights;
}

/**
 * Generate contextual insights for a goal calculator.
 */
export function generateGoalInsights(params: {
  goalName: string;
  yearsToGoal: number;
  requiredSIP: number;
  futureCost: number;
  currentSavings: number;
}): Insight[] {
  const insights: Insight[] = [];
  const { goalName, yearsToGoal, requiredSIP, futureCost, currentSavings } = params;

  // Early start benefit
  if (yearsToGoal >= 3) {
    const laterSIP = requiredSIP * 1.4; // Rough 40% more for 2 years less
    insights.push({
      id: "goal-early",
      type: "warning",
      title: "Starting 2 years later increases SIP by ~40%",
      description: `For "${goalName}", delaying by 2 years would require approximately ${formatINR(laterSIP)}/month instead of ${formatINR(requiredSIP)}/month. Start early, invest less.`,
    });
  }

  // Inflation impact
  const todayCost = futureCost / Math.pow(1 + INFLATION.general / 100, yearsToGoal);
  insights.push({
    id: "goal-inflation",
    type: "tip",
    title: `Inflation adds ${formatLakhsCrores(futureCost - todayCost)} to your goal`,
    description: `At ${INFLATION.general}% inflation, today's cost of ${formatLakhsCrores(todayCost)} becomes ${formatLakhsCrores(futureCost)} in ${yearsToGoal} years. Plan for the inflated amount.`,
  });

  // Current savings impact
  if (currentSavings > 0) {
    const coveragePercent = ((currentSavings / futureCost) * 100).toFixed(0);
    insights.push({
      id: "goal-savings",
      type: "achievement",
      title: `Current savings cover ${coveragePercent}% of your goal`,
      description: `Your existing savings of ${formatLakhsCrores(currentSavings)} are already working towards "${goalName}". The SIP recommendation accounts for this.`,
    });
  }

  return insights;
}

/**
 * Render a list of insights in a styled container.
 */
export default function InsightEngine({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        Smart Insights
      </p>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
