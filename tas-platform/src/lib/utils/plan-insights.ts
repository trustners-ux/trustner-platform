/**
 * Plan-level AI Narrative Insight Generator
 *
 * Reads the already-computed FinancialAnalysis and produces human-readable
 * narrative insights for display on PlanDashboard and Dashboard pages.
 *
 * Uses existing InsightCard type from @/components/insights/InsightCard.
 */

import type { FinancialPlan, FinancialAnalysis } from "@/types/financial-plan";
import type { Insight } from "@/components/insights/InsightCard";
import { formatLakhsCrores, formatINR } from "@/lib/utils/formatters";
import { BENCHMARKS } from "@/lib/constants/financial-constants";

export function generatePlanInsights(
  plan: Partial<FinancialPlan>,
  analysis: FinancialAnalysis
): Insight[] {
  const insights: Insight[] = [];

  // ── 1. Savings Rate ──────────────────────────────────────────────
  const savingsRate = analysis.savingsRate;
  if (savingsRate < BENCHMARKS.savingsRate.fair) {
    insights.push({
      id: "plan-savings-low",
      type: "warning",
      title: `Your savings rate is ${savingsRate.toFixed(0)}% — below the recommended 20%`,
      description: `Financial planners recommend saving at least 20% of your monthly income. At ${savingsRate.toFixed(0)}%, you're saving less than ideal. Even a small increase of 5% can make a significant difference over 10-20 years through compounding.`,
      cta: { label: "Start a SIP", href: "/mutual-funds" },
    });
  } else if (savingsRate >= BENCHMARKS.savingsRate.good) {
    insights.push({
      id: "plan-savings-great",
      type: "achievement",
      title: `Excellent savings rate of ${savingsRate.toFixed(0)}%`,
      description: `You're saving ${savingsRate.toFixed(0)}% of your income, which puts you well above the recommended 20%. Focus now on optimizing where these savings are invested for maximum growth.`,
    });
  } else {
    insights.push({
      id: "plan-savings-ok",
      type: "tip",
      title: `Savings rate: ${savingsRate.toFixed(0)}% — good, but there's room to grow`,
      description: `You're saving ${savingsRate.toFixed(0)}% of your income which meets the minimum benchmark. Aim for 30%+ to accelerate your goals. Consider automating savings via SIP on salary day.`,
      cta: { label: "Explore SIP options", href: "/calculators/sip" },
    });
  }

  // ── 2. Emergency Fund ────────────────────────────────────────────
  const efMonths = analysis.emergencyFundMonths;
  const occupation = plan.personal?.occupation || "salaried";
  const requiredMonths =
    BENCHMARKS.emergencyMonthsByOccupation[occupation] ||
    BENCHMARKS.emergencyMonths.ideal;

  if (analysis.emergencyFundAdequacy === "critical") {
    insights.push({
      id: "plan-emergency-critical",
      type: "warning",
      title: `Emergency fund covers only ${efMonths.toFixed(1)} months — critically low`,
      description: `You need at least ${requiredMonths} months of expenses in liquid assets for a ${occupation} professional. An unexpected job loss or medical emergency could leave you financially vulnerable. Build this up first before other investments.`,
      cta: { label: "Build emergency fund", href: "/mutual-funds?category=liquid" },
    });
  } else if (analysis.emergencyFundAdequacy === "insufficient") {
    insights.push({
      id: "plan-emergency-low",
      type: "warning",
      title: `Emergency fund: ${efMonths.toFixed(1)} months — needs improvement`,
      description: `Your emergency fund covers ${efMonths.toFixed(1)} months of expenses, but ${requiredMonths} months is recommended for ${occupation} professionals. A shortfall here means you might have to break long-term investments during emergencies.`,
      cta: { label: "Liquid fund options", href: "/mutual-funds?category=liquid" },
    });
  } else if (analysis.emergencyFundAdequacy === "excellent") {
    insights.push({
      id: "plan-emergency-great",
      type: "achievement",
      title: `Strong emergency fund — ${efMonths.toFixed(1)} months of coverage`,
      description: `Your liquid assets cover ${efMonths.toFixed(1)} months of expenses, exceeding the recommended ${requiredMonths} months. You have a solid safety net in place.`,
    });
  }

  // ── 3. Term Insurance Gap ────────────────────────────────────────
  const termGap = analysis.termInsuranceGap;
  if (termGap > 0) {
    insights.push({
      id: "plan-term-gap",
      type: "warning",
      title: `Term insurance gap: ${formatLakhsCrores(termGap)}`,
      description: `Your family needs ${formatLakhsCrores(analysis.recommendedTermCover)} in life cover, but you currently have ${formatLakhsCrores(analysis.recommendedTermCover - termGap)}. This gap of ${formatLakhsCrores(termGap)} means your family would face a financial shortfall if something happened to you. Term insurance is the most affordable way to close this gap.`,
      cta: { label: "Get term insurance quote", href: "/insurance/life" },
    });
  } else {
    insights.push({
      id: "plan-term-adequate",
      type: "achievement",
      title: "Term life insurance coverage is adequate",
      description: `Your current life insurance of ${formatLakhsCrores(analysis.recommendedTermCover - termGap)} meets or exceeds the recommended ${formatLakhsCrores(analysis.recommendedTermCover)}. Your family is financially protected.`,
    });
  }

  // ── 4. Health Insurance Gap ──────────────────────────────────────
  const healthGap = analysis.healthInsuranceGap;
  if (healthGap > 0) {
    const city = plan.personal?.city || "metro";
    insights.push({
      id: "plan-health-gap",
      type: "warning",
      title: `Health insurance gap: ${formatLakhsCrores(healthGap)}`,
      description: `Medical costs in ${city === "metro" ? "metro cities" : "your city"} are rising at 12% annually. Your recommended health cover is ${formatLakhsCrores(analysis.recommendedHealthCover)}, but you have ${formatLakhsCrores(analysis.recommendedHealthCover - healthGap)}. A single hospitalization could wipe out years of savings without adequate cover.`,
      cta: { label: "Compare health plans", href: "/insurance/health" },
    });
  }

  // ── 5. Retirement Readiness ──────────────────────────────────────
  const retirementGoal = analysis.goalFeasibility.find(
    (g) => g.goalType === "retirement"
  );
  if (retirementGoal) {
    if (retirementGoal.isOnTrack) {
      insights.push({
        id: "plan-retirement-ontrack",
        type: "achievement",
        title: `Retirement planning is on track`,
        description: `At your current savings trajectory, you're projected to accumulate ${formatLakhsCrores(retirementGoal.currentProjection)} against a target of ${formatLakhsCrores(retirementGoal.inflatedTarget)}. Keep it up and consider reviewing annually.`,
      });
    } else {
      insights.push({
        id: "plan-retirement-gap",
        type: "warning",
        title: `Retirement gap: Need ${formatINR(retirementGoal.requiredMonthlySIP)}/month SIP`,
        description: `You're projected to have ${formatLakhsCrores(retirementGoal.currentProjection)}, but need ${formatLakhsCrores(retirementGoal.inflatedTarget)} for retirement (inflation-adjusted). Starting a SIP of ${formatINR(retirementGoal.requiredMonthlySIP)}/month in ${retirementGoal.suggestedFundCategory} can help close this gap over ${retirementGoal.yearsRemaining} years.`,
        cta: { label: "Plan retirement SIP", href: "/calculators/retirement" },
      });
    }
  } else if (analysis.retirementScore < 50) {
    insights.push({
      id: "plan-retirement-low",
      type: "warning",
      title: `Retirement readiness score: ${analysis.retirementScore}/100`,
      description: `Your retirement preparedness is below average. Without a dedicated retirement goal and systematic investment, you risk running out of money in your post-retirement years. Start planning now — even small steps matter.`,
      cta: { label: "Retirement calculator", href: "/calculators/retirement" },
    });
  }

  // ── 6. Tax Optimization ──────────────────────────────────────────
  if (analysis.potentialTaxSavings > 5000) {
    const unusedDeductions = analysis.taxOpportunities.filter(
      (t) => t.unusedLimit > 0
    );
    const sections = unusedDeductions
      .slice(0, 3)
      .map((t) => t.section)
      .join(", ");
    insights.push({
      id: "plan-tax-savings",
      type: "opportunity",
      title: `You're leaving ${formatLakhsCrores(analysis.potentialTaxSavings)} in tax savings on the table`,
      description: `Unused deductions under ${sections} could save you ${formatLakhsCrores(analysis.potentialTaxSavings)} in taxes. ${analysis.recommendedRegime === "old" ? "Under the old regime, maximizing deductions is key." : "Even under the new regime, NPS benefits are available."} These savings can be redirected towards your financial goals.`,
      cta: { label: "Tax optimization tips", href: "/calculators/tax" },
    });
  } else {
    insights.push({
      id: "plan-tax-optimized",
      type: "achievement",
      title: "Tax planning is well-optimized",
      description: `You're utilizing most available tax deductions under the ${analysis.recommendedRegime} regime. Your tax efficiency score is ${analysis.taxEfficiencyScore}/100.`,
    });
  }

  // ── 7. Debt Health ───────────────────────────────────────────────
  const debtRatio = analysis.debtToIncomeRatio;
  if (debtRatio > BENCHMARKS.emiToIncome.manageable) {
    insights.push({
      id: "plan-debt-high",
      type: "warning",
      title: `High debt burden: ${debtRatio.toFixed(0)}% of income goes to EMIs`,
      description: `Your EMI-to-income ratio of ${debtRatio.toFixed(0)}% exceeds the manageable threshold of 30%. This limits your ability to save and invest. Consider prepaying high-interest loans (credit cards, personal loans) first to free up cash flow.`,
    });
  } else if (debtRatio > BENCHMARKS.emiToIncome.healthy && debtRatio <= BENCHMARKS.emiToIncome.manageable) {
    insights.push({
      id: "plan-debt-moderate",
      type: "tip",
      title: `EMI-to-income ratio: ${debtRatio.toFixed(0)}% — manageable but watch closely`,
      description: `While ${debtRatio.toFixed(0)}% is within manageable limits, the ideal threshold is under 10%. Focus on paying off high-interest debt while maintaining SIP commitments.`,
    });
  } else if (debtRatio > 0) {
    insights.push({
      id: "plan-debt-healthy",
      type: "achievement",
      title: `Healthy debt levels — only ${debtRatio.toFixed(0)}% of income in EMIs`,
      description: `Your EMI-to-income ratio of ${debtRatio.toFixed(0)}% is well within the healthy range (under 10%). This gives you ample room for savings and investments.`,
    });
  }

  // ── 8. Goal Progress Summary ─────────────────────────────────────
  const totalGoals = analysis.goalFeasibility.length;
  if (totalGoals > 0) {
    const offTrackGoals = analysis.goalFeasibility.filter((g) => !g.isOnTrack);
    const totalSIPNeeded = offTrackGoals.reduce(
      (sum, g) => sum + g.requiredMonthlySIP,
      0
    );

    if (offTrackGoals.length === 0) {
      insights.push({
        id: "plan-goals-ontrack",
        type: "achievement",
        title: `All ${totalGoals} financial goals are on track`,
        description: `Great job! Your current savings and investments are projected to meet all your financial goals. Keep monitoring and adjusting as life changes.`,
      });
    } else {
      insights.push({
        id: "plan-goals-offtrack",
        type: "tip",
        title: `${offTrackGoals.length} of ${totalGoals} goals need attention`,
        description: `${offTrackGoals.map((g) => g.goalName).join(", ")} ${offTrackGoals.length === 1 ? "is" : "are"} currently off-track. A total additional SIP of ${formatINR(totalSIPNeeded)}/month across recommended fund categories can help close the gaps.`,
        cta: { label: "View goal roadmap", href: "/dashboard" },
      });
    }
  }

  // ── 9. Asset Allocation Assessment ───────────────────────────────
  const current = analysis.currentAllocation;
  const recommended = analysis.recommendedAllocation;
  const equityDiff = Math.abs(current.equity - recommended.equity);

  if (equityDiff > 15) {
    const direction = current.equity > recommended.equity ? "overweight" : "underweight";
    insights.push({
      id: "plan-allocation-drift",
      type: "tip",
      title: `Asset allocation is ${direction} on equity by ${equityDiff.toFixed(0)}%`,
      description: `Your current equity allocation is ${current.equity.toFixed(0)}% vs recommended ${recommended.equity.toFixed(0)}%. ${direction === "overweight" ? "Consider shifting some equity to debt for stability." : "Increasing equity exposure can help achieve better long-term returns for your risk profile."} Rebalancing annually is a best practice.`,
      cta: { label: "View allocation details", href: "/dashboard" },
    });
  }

  // Sort: warnings first, then opportunities, then tips, then achievements
  const typeOrder: Record<string, number> = {
    warning: 0,
    opportunity: 1,
    tip: 2,
    achievement: 3,
  };
  insights.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return insights;
}
