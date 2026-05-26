/**
 * Portfolio Diagnostic — Methodology Constants
 *
 * The deterministic 4-criterion weighted scoring methodology used to
 * assign each mutual fund holding a verdict (STAR / KEEP / WATCH / SWAP
 * / LIQUIDATE).
 *
 * IMPORTANT: This module must remain deterministic. No LLM input here.
 * Changes to weights/thresholds require approval from Ram Shah, CFP™
 * and a documented changelog entry below.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { ScoringWeights, VerdictThresholds } from './types';

// ─────────────────────────────────────────────────────────────────
// FOUR-CRITERION WEIGHTED SCORING
// ─────────────────────────────────────────────────────────────────

/**
 * Each fund's composite score is the weighted sum of four criteria,
 * each normalised to a 0-1 range. Weights sum to 1.0.
 *
 * Weights are derived from the Trustner CFP-team's experience of which
 * factors most consistently predict fund persistence over 3-5 year
 * holding periods.
 */
export const SCORING_WEIGHTS: ScoringWeights = Object.freeze({
  cagr3y_vs_category_median: 0.30,
  cagr5y_vs_category_median: 0.25,
  manager_tenure_amc_stability: 0.20,
  category_quartile_position: 0.25,
});

// Validate weights sum to 1.0 at module load
const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 1e-6) {
  throw new Error(
    `Methodology error: scoring weights sum to ${weightSum}, expected 1.0`
  );
}

// ─────────────────────────────────────────────────────────────────
// VERDICT THRESHOLDS
// ─────────────────────────────────────────────────────────────────

/**
 * Verdict assignment from composite score:
 *  - STAR     ≥ 0.80  (top quartile across all criteria)
 *  - KEEP     0.60 - 0.80  (solid; top half)
 *  - SWAP     < 0.60  (median or below; recommend replacement)
 *
 * Special cases (override score-based verdict):
 *  - WATCH    if fund has < 36 months of track record
 *  - LIQUIDATE if current position value < ₹2,000 (immaterial)
 */
export const VERDICT_THRESHOLDS: VerdictThresholds = Object.freeze({
  star: 0.80,
  keep: 0.60,
  swapUpper: 0.60,
  liquidateValueInr: 2_000,
  watchMinTrackRecordMonths: 36,
});

// ─────────────────────────────────────────────────────────────────
// CRITERION NORMALISATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a CAGR delta (pp vs category median) to a 0-1 score.
 *
 * Anchored such that:
 *   delta of -10pp → 0.00 (much worse than median)
 *   delta of  0pp  → 0.50 (at median)
 *   delta of +10pp → 1.00 (much better than median)
 */
export function normaliseCagrDelta(deltaPp: number): number {
  return clamp01(0.5 + deltaPp / 20);
}

/**
 * Convert category quartile (1-4) to a 0-1 score.
 *   Q1 → 1.00 (top quartile)
 *   Q2 → 0.75
 *   Q3 → 0.50
 *   Q4 → 0.25 (bottom quartile)
 */
export function normaliseQuartile(quartile: 1 | 2 | 3 | 4): number {
  return (5 - quartile) / 4;
}

/**
 * Manager stability score combines:
 *   - Tenure of current fund manager (longer = higher)
 *   - AMC stability flag (compliance issues, ownership change, etc.)
 *
 * Returns a 0-1 score.
 *
 * IMPORTANT — null-safe default: when manager tenure data is missing
 * (managerSinceDate not populated in fund_master), we use a NEUTRAL
 * 0.60 instead of penalising as 0.20. Data gaps in our master are not
 * the fund's fault — a confidently identified fund with no tenure data
 * was being dragged from "KEEP" to "SWAP" purely on missing data
 * (the PPFAS Flexi Cap consistency bug Ram caught on 26 May 2026).
 *
 * Pass `tenureUnknown: true` when managerSinceDate is null/missing to
 * get the neutral score. The "0 months tenure" path now only applies
 * to GENUINELY new managers (data exists but is recent).
 */
export function computeManagerStability(input: {
  managerTenureMonths: number;     // 0+
  amcCompliancePenalty?: number;   // 0-0.3 deducted for known issues
  tenureUnknown?: boolean;         // true if managerSinceDate was null/missing
}): number {
  if (input.tenureUnknown) {
    // Neutral: don't reward, don't penalise. Equivalent to ~36 months tenure.
    const penalty = input.amcCompliancePenalty ?? 0;
    return clamp01(0.60 - penalty);
  }
  // Tenure curve: 0 mo → 0.20, 24 mo → 0.60, 60+ mo → 1.00
  const tenureScore = clamp01(0.20 + (input.managerTenureMonths / 60) * 0.80);
  const penalty = input.amcCompliancePenalty ?? 0;
  return clamp01(tenureScore - penalty);
}

// ─────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────

export function clamp01(x: number): number {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// ─────────────────────────────────────────────────────────────────
// METHODOLOGY VERSION
// ─────────────────────────────────────────────────────────────────

/**
 * Bump this when weights or thresholds change. Persist with each
 * DiagnosticRun for reproducibility.
 */
export const METHODOLOGY_VERSION = '1.1.0';

/**
 * Changelog (maintain in chronological order):
 *
 * v1.1.0 (26 May 2026) — Consistency floors, Ram + Claude collaboration
 *   - Quality floor: a fund that beats category median on BOTH 3Y AND 5Y
 *     CAGR cannot fall to SWAP (minimum verdict = KEEP). Mathematically
 *     contradictory to recommend swapping out of a top-half-by-both-windows
 *     fund. Fixes the PPFAS Flexi Cap inconsistency Ram caught:
 *     beat 3Y median by +0.23pp and 5Y median by +3.08pp yet was flagged
 *     SWAP because manager-stability data was null in master.
 *   - Null-safe manager stability: missing managerSinceDate now returns
 *     neutral 0.60 instead of penalty 0.20. Data gaps in our master are
 *     not the fund's fault.
 *   - Trustner-preferred floor: if pd_fund_master.trustner_preferred=true,
 *     minimum verdict = KEEP. An analyst endorsement overrides a marginal
 *     composite-score miss.
 *   - Rationale text: when both deltas are positive, the rationale must
 *     not say "better alternatives exist" — that contradicts the numbers.
 *
 * v1.0.0 (23 May 2026) — Initial methodology by Ram Shah, CFP™
 *   - 4-criterion weighted scoring
 *   - Thresholds: STAR 0.80, KEEP 0.60, SWAP < 0.60
 *   - WATCH override < 36 months track record
 *   - LIQUIDATE override < ₹2,000 position value
 */
