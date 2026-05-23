/**
 * Portfolio Diagnostic — SIP Analytics
 *
 * Captures and analyzes ACTIVE SIP commitments separately from current
 * holdings. SIPs are forward-looking cash flows; holdings are current
 * positions. Both are tracked together to provide complete advisory.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  RawSip,
  AnalyzedSip,
  FundMaster,
  CategoryBenchmark,
  AnalyzedHolding,
  Verdict,
} from './types';
import { analyzeHolding } from './scoring-engine';

// ─────────────────────────────────────────────────────────────────
// SIP NORMALISATION
// ─────────────────────────────────────────────────────────────────

/**
 * Convert any-frequency SIP amount to monthly-equivalent.
 * Used for cross-SIP comparison and family-level monthly flow.
 */
export function normaliseToMonthlyInr(input: {
  actualAmountInr: number;
  frequency: RawSip['frequency'];
}): number {
  switch (input.frequency) {
    case 'Monthly':
      return input.actualAmountInr;
    case 'Quarterly':
      return input.actualAmountInr / 3;
    case 'Weekly':
      // 4.33 weeks per month avg
      return input.actualAmountInr * 4.33;
    case 'Daily':
      // 21 trading days per month avg
      return input.actualAmountInr * 21;
    case 'One-Time-STP':
      // STP is not a recurring SIP; treat as zero monthly flow
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────
// SIP AGE & FORECASTING
// ─────────────────────────────────────────────────────────────────

export function computeSipAgeMonths(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth())
  );
}

/**
 * Project the total inflow from this SIP over the next N years.
 * Accounts for step-up if applicable.
 */
export function projectSipInflow(input: {
  monthlyAmountInr: number;
  yearsForward: number;
  hasStepUp: boolean;
  stepUpPct?: number;
  stepUpFrequency?: 'Annual' | 'Half-Yearly';
  remainingInstallments?: number;
}): number {
  const months = Math.min(
    input.yearsForward * 12,
    input.remainingInstallments ?? Infinity
  );

  if (!input.hasStepUp || !input.stepUpPct) {
    return input.monthlyAmountInr * months;
  }

  // Apply step-up at the configured frequency
  const stepUpEveryNMonths = input.stepUpFrequency === 'Half-Yearly' ? 6 : 12;
  const stepUpFactor = input.stepUpPct / 100;

  let total = 0;
  let currentMonthly = input.monthlyAmountInr;
  for (let m = 0; m < months; m++) {
    if (m > 0 && m % stepUpEveryNMonths === 0) {
      currentMonthly = currentMonthly * (1 + stepUpFactor);
    }
    total += currentMonthly;
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────
// SIP-TO-HOLDING LINKAGE
// ─────────────────────────────────────────────────────────────────

/**
 * Match each SIP to its corresponding current holding (by entity +
 * fund). This enables: (a) showing combined view in the report, and
 * (b) propagating the holding's verdict to the SIP's recommendation.
 */
export function linkSipsToHoldings(input: {
  sips: AnalyzedSip[];
  holdings: AnalyzedHolding[];
}): AnalyzedSip[] {
  const { sips, holdings } = input;

  return sips.map((sip) => {
    const matchingHolding = holdings.find(
      (h) =>
        h.entityName === sip.entityName &&
        (h.amfiCode === sip.amfiCode || h.fundName === sip.fundName)
    );

    if (!matchingHolding) {
      // SIP without a current holding (new SIP that hasn't deposited yet)
      return {
        ...sip,
        fundVerdict: 'WATCH' as Verdict,
        recommendedAction: 'Continue',
      };
    }

    return {
      ...sip,
      fundVerdict: matchingHolding.verdict,
      recommendedAction: recommendSipAction(matchingHolding.verdict),
      recommendedRedirectFund: matchingHolding.recommendedReplacement?.primary.schemeName,
    };
  });
}

function recommendSipAction(
  fundVerdict: Verdict
): AnalyzedSip['recommendedAction'] {
  switch (fundVerdict) {
    case 'STAR':
    case 'KEEP':
      return 'Continue';
    case 'WATCH':
      return 'Continue';
    case 'SWAP':
      return 'Re-direct'; // Stop current SIP, start in recommended fund
    case 'LIQUIDATE':
      return 'Stop';
  }
}

// ─────────────────────────────────────────────────────────────────
// FAMILY-LEVEL SIP AGGREGATES
// ─────────────────────────────────────────────────────────────────

export interface FamilySipSummary {
  numActiveSips: number;
  numPausedSips: number;
  totalMonthlyFlowInr: number;
  totalAnnualFlowInr: number;
  averageSipAgeMonths: number;
  oldestSipMonths: number;
  newestSipMonths: number;
  sipFlowByCategory: Record<string, number>;
  sipFlowByEntity: Record<string, number>;
  sipsRequiringRedirect: number;
  sipsRequiringStop: number;
  projected5YInflowInr: number;
}

export function summarizeFamilySips(sips: AnalyzedSip[]): FamilySipSummary {
  const active = sips.filter((s) => s.status === 'Active');
  const paused = sips.filter((s) => s.status === 'Paused');

  const totalMonthly = active.reduce((sum, s) => sum + s.monthlyAmountInr, 0);

  const sipFlowByCategory: Record<string, number> = {};
  const sipFlowByEntity: Record<string, number> = {};

  for (const sip of active) {
    sipFlowByCategory[sip.category] =
      (sipFlowByCategory[sip.category] || 0) + sip.monthlyAmountInr;
    sipFlowByEntity[sip.entityName] =
      (sipFlowByEntity[sip.entityName] || 0) + sip.monthlyAmountInr;
  }

  const ages = active.map((s) => s.ageInMonths);
  const avgAge =
    ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

  const projected5Y = active.reduce(
    (sum, s) => sum + s.expected5YInflowInr,
    0
  );

  return {
    numActiveSips: active.length,
    numPausedSips: paused.length,
    totalMonthlyFlowInr: totalMonthly,
    totalAnnualFlowInr: totalMonthly * 12,
    averageSipAgeMonths: avgAge,
    oldestSipMonths: ages.length > 0 ? Math.max(...ages) : 0,
    newestSipMonths: ages.length > 0 ? Math.min(...ages) : 0,
    sipFlowByCategory,
    sipFlowByEntity,
    sipsRequiringRedirect: active.filter((s) => s.recommendedAction === 'Re-direct').length,
    sipsRequiringStop: active.filter((s) => s.recommendedAction === 'Stop').length,
    projected5YInflowInr: projected5Y,
  };
}

// ─────────────────────────────────────────────────────────────────
// PRIMARY ENTRY POINT — analyze a SIP
// ─────────────────────────────────────────────────────────────────

export function analyzeSip(input: {
  raw: RawSip;
  fundMaster: FundMaster;
  entityId: string;
}): AnalyzedSip {
  const { raw, fundMaster, entityId } = input;

  const ageMonths = computeSipAgeMonths(raw.startDate);
  const monthlyAmount = normaliseToMonthlyInr({
    actualAmountInr: raw.actualAmountInr,
    frequency: raw.frequency,
  });

  const expectedAnnualInflow = monthlyAmount * 12;
  const expected5YInflow = projectSipInflow({
    monthlyAmountInr: monthlyAmount,
    yearsForward: 5,
    hasStepUp: raw.hasStepUp,
    stepUpPct: raw.stepUpPct,
    stepUpFrequency: raw.stepUpFrequency,
    remainingInstallments:
      raw.totalInstallments && raw.installmentsCompleted
        ? raw.totalInstallments - raw.installmentsCompleted
        : undefined,
  });

  return {
    ...raw,
    monthlyAmountInr: monthlyAmount,
    id: generateSipId(),
    entityId,
    amfiCode: fundMaster.amfiCode,
    category: fundMaster.category,
    ageInMonths: ageMonths,
    expectedAnnualInflowInr: expectedAnnualInflow,
    expected5YInflowInr: expected5YInflow,
  };
}

function generateSipId(): string {
  return `sip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
