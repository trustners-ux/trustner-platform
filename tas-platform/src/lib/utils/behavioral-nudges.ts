/**
 * Behavioral Nudges & Peer Comparison Generator
 *
 * Uses existing BENCHMARKS, getIncomePercentile(), and computed FinancialAnalysis
 * to produce peer-comparison nudges that motivate action through social proof.
 */

import type { FinancialPlan, FinancialAnalysis } from "@/types/financial-plan";
import { formatLakhsCrores, formatINR } from "@/lib/utils/formatters";
import {
  BENCHMARKS,
  getIncomePercentile,
} from "@/lib/constants/financial-constants";

export interface NudgeItem {
  id: string;
  title: string;
  description: string;
  /** User's current value (0-100 scale for bar) */
  userValue: number;
  /** Benchmark value (0-100 scale for bar) */
  benchmarkValue: number;
  userLabel: string;
  benchmarkLabel: string;
  /** Whether user is at or above benchmark */
  isAbove: boolean;
  category: "savings" | "emergency" | "insurance" | "debt" | "retirement";
}

export function generateBehavioralNudges(
  plan: Partial<FinancialPlan>,
  analysis: FinancialAnalysis
): NudgeItem[] {
  const nudges: NudgeItem[] = [];

  // ── 1. Savings Rate Comparison ───────────────────────────────────────
  const savingsRate = analysis.savingsRate;
  const benchmarkSavings = BENCHMARKS.savingsRate.good; // 20%
  const savingsBarUser = Math.min(100, (savingsRate / 50) * 100); // scale to 50% max
  const savingsBarBench = (benchmarkSavings / 50) * 100;

  nudges.push({
    id: "nudge-savings",
    title: `You save ${savingsRate.toFixed(0)}% of income`,
    description:
      savingsRate >= benchmarkSavings
        ? `That's above the recommended ${benchmarkSavings}% benchmark. Top savers in India save 30%+. Keep up the momentum!`
        : `Financial planners recommend saving at least ${benchmarkSavings}% of income. Even increasing by 5% can compound significantly over a decade.`,
    userValue: savingsBarUser,
    benchmarkValue: savingsBarBench,
    userLabel: `${savingsRate.toFixed(0)}%`,
    benchmarkLabel: `${benchmarkSavings}%`,
    isAbove: savingsRate >= benchmarkSavings,
    category: "savings",
  });

  // ── 2. Emergency Fund Comparison ─────────────────────────────────────
  const efMonths = analysis.emergencyFundMonths;
  const occupation = plan.personal?.occupation || "salaried";
  const reqMonths =
    BENCHMARKS.emergencyMonthsByOccupation[occupation] ??
    BENCHMARKS.emergencyMonths.ideal;
  const efBarUser = Math.min(100, (efMonths / 18) * 100); // scale to 18 months max
  const efBarBench = (reqMonths / 18) * 100;

  nudges.push({
    id: "nudge-emergency",
    title: `Emergency fund: ${efMonths.toFixed(1)} months`,
    description:
      efMonths >= reqMonths
        ? `You exceed the recommended ${reqMonths} months for ${occupation} professionals. Your safety net is solid.`
        : `Financial planners recommend ${reqMonths} months of expenses for ${occupation} professionals. A shortfall here means you may need to break long-term investments during emergencies.`,
    userValue: efBarUser,
    benchmarkValue: efBarBench,
    userLabel: `${efMonths.toFixed(1)} mo`,
    benchmarkLabel: `${reqMonths} mo`,
    isAbove: efMonths >= reqMonths,
    category: "emergency",
  });

  // ── 3. Income Percentile + Insurance Gap ─────────────────────────────
  const totalAnnualIncome =
    plan.income?.totalAnnualIncome ??
    ((plan.income?.monthlySalary ?? 0) * 12 +
      (plan.income?.bonusAnnual ?? 0) +
      (plan.income?.rentalIncome ?? 0) * 12 +
      (plan.income?.businessIncome ?? 0) * 12 +
      (plan.income?.otherIncome ?? 0) * 12);

  if (totalAnnualIncome > 0) {
    const percentile = getIncomePercentile(totalAnnualIncome);
    const hasInsuranceGap =
      analysis.termInsuranceGap > 0 || analysis.healthInsuranceGap > 0;

    if (hasInsuranceGap) {
      const totalGap =
        analysis.termInsuranceGap + analysis.healthInsuranceGap;
      nudges.push({
        id: "nudge-insurance-income",
        title: `You earn more than ${percentile}% of Indians`,
        description: `But your insurance coverage has a gap of ${formatLakhsCrores(totalGap)}. Higher income families need proportionally more protection. Term insurance is the most affordable way to close this gap.`,
        userValue: percentile,
        benchmarkValue: 100,
        userLabel: `Top ${(100 - percentile).toFixed(0)}%`,
        benchmarkLabel: "Full cover",
        isAbove: false,
        category: "insurance",
      });
    }
  }

  // ── 4. Debt-to-Income Comparison ─────────────────────────────────────
  const debtRatio = analysis.debtToIncomeRatio;
  if (debtRatio > 0) {
    const healthyThreshold = BENCHMARKS.emiToIncome.healthy; // 10%
    const debtBarUser = Math.min(100, (debtRatio / 60) * 100); // scale to 60% max
    const debtBarBench = (healthyThreshold / 60) * 100;

    nudges.push({
      id: "nudge-debt",
      title: `EMI-to-income: ${debtRatio.toFixed(0)}%`,
      description:
        debtRatio <= healthyThreshold
          ? `Your debt ratio of ${debtRatio.toFixed(0)}% is well within the healthy threshold of ${healthyThreshold}%. This gives you ample room for savings and investments.`
          : `The healthy threshold is ${healthyThreshold}%. At ${debtRatio.toFixed(0)}%, consider prepaying high-interest debt first (credit cards, personal loans) to free up cash flow for investments.`,
      userValue: debtBarUser,
      benchmarkValue: debtBarBench,
      userLabel: `${debtRatio.toFixed(0)}%`,
      benchmarkLabel: `${healthyThreshold}%`,
      isAbove: debtRatio <= healthyThreshold, // for debt, lower is better
      category: "debt",
    });
  }

  // ── 5. Retirement SIP Nudge ──────────────────────────────────────────
  const retirementGoal = analysis.goalFeasibility.find(
    (g) => g.goalType === "retirement"
  );
  if (retirementGoal && !retirementGoal.isOnTrack) {
    const sipNeeded = retirementGoal.requiredMonthlySIP;
    const yearsRemaining = retirementGoal.yearsRemaining;
    // Scale: user progress as percentage of target
    const progressPct = retirementGoal.inflatedTarget > 0
      ? Math.min(100, (retirementGoal.currentProjection / retirementGoal.inflatedTarget) * 100)
      : 0;

    nudges.push({
      id: "nudge-retirement",
      title: `Retirement gap: ${formatINR(sipNeeded)}/month SIP needed`,
      description: `Starting a SIP of just ${formatINR(sipNeeded)}/month today can close your retirement gap over ${yearsRemaining} years in ${retirementGoal.suggestedFundCategory}. The earlier you start, the less you need to invest.`,
      userValue: progressPct,
      benchmarkValue: 100,
      userLabel: `${progressPct.toFixed(0)}%`,
      benchmarkLabel: "Target",
      isAbove: false,
      category: "retirement",
    });
  }

  return nudges;
}
