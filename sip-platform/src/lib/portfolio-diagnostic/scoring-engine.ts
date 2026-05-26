/**
 * Portfolio Diagnostic — Scoring Engine
 *
 * The deterministic core of the diagnostic. Takes a raw holding +
 * fund master data + category benchmark, returns a verdict and
 * composite score.
 *
 * NO LLM CALLS IN THIS MODULE. All scoring is rule-based.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  RawHolding,
  FundMaster,
  CategoryBenchmark,
  AnalyzedHolding,
  ScoringInputs,
  ScoringOutput,
  Verdict,
} from './types';
import {
  SCORING_WEIGHTS,
  VERDICT_THRESHOLDS,
  normaliseCagrDelta,
  normaliseQuartile,
  computeManagerStability,
  clamp01,
} from './methodology';

// ─────────────────────────────────────────────────────────────────
// PRIMARY ENTRY POINT
// ─────────────────────────────────────────────────────────────────

/**
 * Score a single holding and return enriched analysis.
 *
 * This is the function the API route calls for each row of the
 * user's portfolio. It is pure (no side effects, deterministic).
 */
export function analyzeHolding(input: {
  raw: RawHolding;
  fundMaster: FundMaster;
  benchmark: CategoryBenchmark;
  entityId: string;
  holdingId?: string;
}): AnalyzedHolding {
  const { raw, fundMaster, benchmark, entityId, holdingId } = input;

  // 1. Compute holding period
  const holdingPeriodMonths = computeHoldingPeriodMonths(
    raw.firstInvestmentDate
  );

  // 2. Determine special-case overrides BEFORE scoring
  const liquidateOverride = raw.currentValue < VERDICT_THRESHOLDS.liquidateValueInr;
  const watchOverride =
    !liquidateOverride &&
    holdingPeriodMonths < VERDICT_THRESHOLDS.watchMinTrackRecordMonths &&
    (fundMaster.cagr3y === null || fundMaster.cagr3y === undefined);

  // 3. If no special case, compute composite score
  let scoring: ScoringOutput | null = null;
  if (!liquidateOverride && !watchOverride) {
    scoring = computeCompositeScore({
      fundMaster,
      benchmark,
    });
  }

  // 4. Assign verdict
  let verdict: Verdict;
  if (liquidateOverride) {
    verdict = 'LIQUIDATE';
  } else if (watchOverride) {
    verdict = 'WATCH';
  } else if (scoring && scoring.compositeScore >= VERDICT_THRESHOLDS.star) {
    verdict = 'STAR';
  } else if (scoring && scoring.compositeScore >= VERDICT_THRESHOLDS.keep) {
    verdict = 'KEEP';
  } else {
    verdict = 'SWAP';
  }

  // 4a. ── CONSISTENCY FLOORS (v1.1.0) ────────────────────────────
  //
  // The composite score can put a genuinely good fund into SWAP when
  // upstream data has gaps (e.g., managerSinceDate is null in master).
  // These floors prevent advisor-facing inconsistency where the same
  // fund gets opposite recommendations across portfolios.
  //
  // Floor 1: "Beats both 3Y and 5Y median" → minimum KEEP. A fund that
  //          tops the category median on BOTH long-window CAGRs is
  //          mathematically a top-half performer. Cannot justify SWAP.
  //
  // Floor 2: trustner_preferred=true → minimum KEEP. An explicit
  //          analyst endorsement overrides marginal score gaps.
  //
  // Floors only LIFT the verdict — they never demote.
  if (verdict === 'SWAP' && fundMaster.cagr3y !== null && fundMaster.cagr5y !== null) {
    const beats3y = (fundMaster.cagr3y ?? 0) > benchmark.median3y;
    const beats5y = (fundMaster.cagr5y ?? 0) > benchmark.median5y;
    if (beats3y && beats5y) {
      verdict = 'KEEP';
    }
  }
  if (verdict === 'SWAP' && fundMaster.trustnerPreferred) {
    verdict = 'KEEP';
  }

  // 5. Compute quartile from raw rank if available
  const quartile = computeQuartile(
    fundMaster.categoryRank3y,
    fundMaster.categoryTotal
  );

  // 6. Generate templated rationale (LLM layer will improve this later)
  const verdictRationale = generateTemplateRationale({
    verdict,
    fundMaster,
    benchmark,
    holdingPeriodMonths,
    compositeScore: scoring?.compositeScore ?? null,
  });

  // 7. Assemble enriched holding
  return {
    id: holdingId ?? generateHoldingId(),
    entityId,
    entityName: raw.entityName,
    entityType: raw.entityType ?? 'Individual',
    fundName: fundMaster.schemeName,
    amfiCode: fundMaster.amfiCode,
    folioNumber: raw.folioNumber,
    category: fundMaster.category,

    units: raw.units,
    investedInr: raw.investedAmount,
    currentValueInr: raw.currentValue,
    unrealisedGainInr: raw.currentValue - raw.investedAmount,
    xirrPct: computeApproxXirr({
      invested: raw.investedAmount,
      current: raw.currentValue,
      months: holdingPeriodMonths,
    }),
    holdingPeriodMonths,
    firstInvestmentDate: raw.firstInvestmentDate,

    cagr1y: fundMaster.cagr1y,
    cagr3y: fundMaster.cagr3y,
    cagr5y: fundMaster.cagr5y,
    categoryMedian3y: benchmark.median3y,
    categoryMedian5y: benchmark.median5y,
    categoryQuartile: quartile,

    compositeScore: scoring?.compositeScore ?? null,
    verdict,
    verdictRationale,

    // recommendedReplacement & taxImpact are populated by downstream
    // modules (replacement-recommender.ts and tax-calculator.ts)
  };
}

function generateHoldingId(): string {
  return `hld_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────
// COMPOSITE SCORE
// ─────────────────────────────────────────────────────────────────

export function computeCompositeScore(input: {
  fundMaster: FundMaster;
  benchmark: CategoryBenchmark;
}): ScoringOutput {
  const { fundMaster, benchmark } = input;

  const inputs: ScoringInputs = {
    cagr3yDelta: (fundMaster.cagr3y ?? 0) - benchmark.median3y,
    cagr5yDelta: (fundMaster.cagr5y ?? 0) - benchmark.median5y,
    managerStability: computeManagerStability({
      managerTenureMonths: monthsSince(fundMaster.managerSinceDate),
      tenureUnknown: !fundMaster.managerSinceDate,
      amcCompliancePenalty: 0, // TODO: source from AMC stability table
    }),
    quartile: computeQuartile(
      fundMaster.categoryRank3y,
      fundMaster.categoryTotal
    ) ?? 3,
  };

  return scoreFromInputs(inputs);
}

/**
 * Pure function — given the four normalized inputs, compute the
 * weighted composite score.
 */
export function scoreFromInputs(inputs: ScoringInputs): ScoringOutput {
  const c1 = normaliseCagrDelta(inputs.cagr3yDelta);
  const c2 = normaliseCagrDelta(inputs.cagr5yDelta);
  const c3 = inputs.managerStability;
  const c4 = normaliseQuartile(inputs.quartile);

  const compositeScore = clamp01(
    c1 * SCORING_WEIGHTS.cagr3y_vs_category_median +
      c2 * SCORING_WEIGHTS.cagr5y_vs_category_median +
      c3 * SCORING_WEIGHTS.manager_tenure_amc_stability +
      c4 * SCORING_WEIGHTS.category_quartile_position
  );

  let verdict: Verdict;
  if (compositeScore >= VERDICT_THRESHOLDS.star) verdict = 'STAR';
  else if (compositeScore >= VERDICT_THRESHOLDS.keep) verdict = 'KEEP';
  else verdict = 'SWAP';

  return {
    compositeScore,
    verdict,
    componentScores: { cagr3y: c1, cagr5y: c2, manager: c3, quartile: c4 },
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

export function computeHoldingPeriodMonths(
  firstInvestmentDate?: string
): number {
  if (!firstInvestmentDate) return 0;
  const start = new Date(firstInvestmentDate);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth())
  );
}

export function monthsSince(isoDate?: string): number {
  if (!isoDate) return 0;
  return computeHoldingPeriodMonths(isoDate);
}

export function computeQuartile(
  rank?: number,
  total?: number
): 1 | 2 | 3 | 4 | null {
  if (!rank || !total || total === 0) return null;
  const ratio = rank / total;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Crude XIRR approximation using simple CAGR formula.
 *
 * For a production-grade XIRR, we should use Newton-Raphson with the
 * actual SIP cash flow dates. v1 uses the simplified formula:
 *   XIRR ≈ (current / invested)^(12 / months) - 1
 */
export function computeApproxXirr(input: {
  invested: number;
  current: number;
  months: number;
}): number | null {
  if (input.months === 0 || input.invested === 0) return null;
  const ratio = input.current / input.invested;
  if (ratio <= 0) return null;
  const years = input.months / 12;
  return (Math.pow(ratio, 1 / years) - 1) * 100;
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATED RATIONALE (v1 — LLM replaces this later)
// ─────────────────────────────────────────────────────────────────

function generateTemplateRationale(input: {
  verdict: Verdict;
  fundMaster: FundMaster;
  benchmark: CategoryBenchmark;
  holdingPeriodMonths: number;
  compositeScore: number | null;
}): string {
  const { verdict, fundMaster, benchmark, holdingPeriodMonths } = input;
  const cagr3y = fundMaster.cagr3y ?? null;
  const cagr5y = fundMaster.cagr5y ?? null;

  switch (verdict) {
    case 'STAR':
      return `Top-quartile performance: 3Y CAGR ${cagr3y?.toFixed(2)}% vs category median ${benchmark.median3y.toFixed(2)}%. Continue.`;
    case 'KEEP': {
      // Two flavours of KEEP:
      //   (a) plain KEEP — score landed in [0.60, 0.80)
      //   (b) "floor KEEP" — score was <0.60 but the consistency floor
      //       upgraded it because the fund beats both medians OR is
      //       Trustner-preferred. Use a different rationale so the
      //       advisor knows WHY we keep it.
      const beats3y = (cagr3y ?? -Infinity) > benchmark.median3y;
      const beats5y = (cagr5y ?? -Infinity) > benchmark.median5y;
      if (fundMaster.trustnerPreferred) {
        return `Trustner-preferred fund. 3Y CAGR ${cagr3y?.toFixed(2)}% vs category median ${benchmark.median3y.toFixed(2)}%; 5Y CAGR ${cagr5y?.toFixed(2)}% vs median ${benchmark.median5y.toFixed(2)}%. Continue.`;
      }
      if (beats3y && beats5y) {
        return `Beats category median on both 3Y (${cagr3y?.toFixed(2)}% vs ${benchmark.median3y.toFixed(2)}%) and 5Y (${cagr5y?.toFixed(2)}% vs ${benchmark.median5y.toFixed(2)}%). Continue.`;
      }
      return `Solid fund: 3Y CAGR ${cagr3y?.toFixed(2)}% vs category median ${benchmark.median3y.toFixed(2)}%. ${holdingPeriodMonths < 24 ? 'SIP in J-curve phase; give 24-36 months.' : 'No change required.'}`;
    }
    case 'WATCH':
      return `Fund has only ${holdingPeriodMonths} months of track record. Insufficient data for full assessment; re-assess at next quarterly review.`;
    case 'SWAP': {
      // Build a precise, non-contradictory rationale. The earlier blanket
      // "Better category alternatives exist" was wrong when deltas were
      // positive (PPFAS Flexi Cap bug — Ram, 26 May 2026). The post-floor
      // code path should rarely reach SWAP for a positive-delta fund,
      // but if it does we MUST tell the truth.
      const d3 = (cagr3y ?? 0) - benchmark.median3y;
      const d5 = (cagr5y ?? 0) - benchmark.median5y;
      const parts: string[] = [];
      if (d3 < -1) parts.push(`3Y CAGR ${cagr3y?.toFixed(2)}% trails median ${benchmark.median3y.toFixed(2)}% by ${Math.abs(d3).toFixed(2)}pp`);
      else if (d3 < 0) parts.push(`3Y CAGR ${cagr3y?.toFixed(2)}% slightly below median ${benchmark.median3y.toFixed(2)}%`);
      else parts.push(`3Y CAGR ${cagr3y?.toFixed(2)}% (median ${benchmark.median3y.toFixed(2)}%)`);
      if (d5 < -1) parts.push(`5Y CAGR ${cagr5y?.toFixed(2)}% trails median ${benchmark.median5y.toFixed(2)}% by ${Math.abs(d5).toFixed(2)}pp`);
      else parts.push(`5Y CAGR ${cagr5y?.toFixed(2)}% vs median ${benchmark.median5y.toFixed(2)}%`);
      const closing = (d3 < 0 && d5 < 0)
        ? ' Stronger category options exist; recommend switch on next tax-efficient window.'
        : ' Composite score sits in lower half — review against tax cost before acting.';
      return parts.join('; ') + '.' + closing;
    }
    case 'LIQUIDATE':
      return `Position value below ₹2,000 — immaterial to portfolio outcome. Redeem and redeploy to a meaningful holding.`;
  }
}
