/**
 * Trustner Verdict Engine v2 — CLIENT RISK MODEL
 * ================================================
 * Best-in-field planning does NOT use "100 minus age". It reconciles three
 * INDEPENDENT dimensions, then lets the binding constraint set the equity band —
 * with the explicit rule that CAPACITY can override age UPWARD when the client's
 * survival needs are funded by sources other than this portfolio.
 *
 *   CAPACITY   — ABILITY to take risk (does their living depend on this money?)
 *   TOLERANCE  — WILLINGNESS (temperament + how they behaved in past crashes)
 *   REQUIRED   — NEED (how much return goals actually demand)
 *
 * It also produces the piece that pure risk-scoring misses: a WITHIN-EQUITY RISK
 * CEILING. Two clients can both be "60% equity", but a capital-first retiree's
 * 60% must be Large-Cap/Hybrid, while a high-tolerance HNI's 60% can include
 * Small-Cap/Thematic. The ceiling is what makes "EXIT the smallcap even though
 * it's a great fund" computable.
 *
 * Behavioural finance is baked in:
 *   - Past-drawdown behaviour calibrates true tolerance (Dalbar behaviour gap).
 *   - Maslow goal-tiering lets surplus capital ("money never needed") run high
 *     equity regardless of age, while survival capital stays safe.
 *
 * Trustner is an AMFI MFD (ARN-286886). No "advisor/advisory" terminology.
 */

// ── Risk tiers used across the engine (ordered) ──────────────────────────────
export const RISK_TIERS = ['Low', 'Low-Moderate', 'Moderate', 'High', 'Very High'] as const;
export type RiskTier = typeof RISK_TIERS[number];
export const tierRank = (t: RiskTier): number => RISK_TIERS.indexOf(t);

// ── Maslow money-tiers: capital is bucketed by PURPOSE × HORIZON, not by age ──
export type GoalTier = 'survival' | 'security' | 'growth' | 'legacy';

export interface GoalBucket {
  label: string;
  tier: GoalTier;
  amountInr: number;
  horizonYears: number;       // time until the money is needed
}

// ── Inputs captured per client family (the missing data spine in PD today) ───
export interface ClientRiskInputs {
  // identity / life-stage
  primaryAge: number;
  lifeStage: 'accumulation' | 'pre_retirement' | 'retirement' | 'legacy';

  // CAPACITY inputs
  monthlyGuaranteedIncomeInr: number;   // pension + rent + annuity + SCSS etc (NOT this portfolio)
  monthlyEssentialExpenseInr: number;
  livingDependsOnThisPortfolio: boolean; // the capacity-override switch
  liquidNetWorthBufferInr: number;       // assets outside this portfolio
  longestHorizonYears: number;           // longest goal horizon in the family book

  // TOLERANCE inputs
  questionnaireScore0to100: number | null; // 8-Q MASTER_SPEC engine (optional)
  statedPriority: 'capital_first' | 'balanced' | 'growth_first';
  pastDrawdownBehaviour: 'stayed_invested' | 'stopped_sip' | 'panic_sold' | 'added_more' | 'unknown';

  // REQUIRED inputs
  targetCorpusInr: number | null;        // if a specific goal corpus exists
  currentInvestableInr: number;
  yearsToGoal: number | null;

  // optional Maslow bucketing of the portfolio
  goalBuckets?: GoalBucket[];
}

export interface RiskModelOutput {
  capacityScore: number;        // 0-100
  toleranceScore: number;       // 0-100
  requiredReturnPct: number | null;   // % p.a. needed to hit goal, null if no goal
  bindingConstraint: 'capacity' | 'tolerance' | 'required';
  capacityOverrodeAge: boolean;

  targetEquityPct: number;      // reconciled equity %
  ageRuleEquityPct: number;     // naive 100-minus-age, for contrast
  withinEquityCeiling: RiskTier; // max risk-tier of equity funds this client should hold
  profileLabel: string;         // human label
  rationale: string[];          // explainable, defensible reasoning trail
  bucketPlan?: { label: string; tier: GoalTier; equityPct: number; ceiling: RiskTier; reason: string }[];
}

// ── CAPACITY ─────────────────────────────────────────────────────────────────
// Ability to take risk. The single most important question: does the client's
// LIVING depend on this money? If guaranteed income already covers expenses, the
// portfolio is "surplus" and capacity is high even at 60.
function scoreCapacity(i: ClientRiskInputs): { score: number; notes: string[] } {
  const notes: string[] = [];
  let score = 0;

  // 1) Income coverage ratio (40 pts) — guaranteed income vs essential expense
  const coverage = i.monthlyEssentialExpenseInr > 0
    ? i.monthlyGuaranteedIncomeInr / i.monthlyEssentialExpenseInr
    : 1;
  const coveragePts = Math.max(0, Math.min(40, (coverage - 0.5) / (1.5 - 0.5) * 40));
  score += coveragePts;
  if (coverage >= 1.2) notes.push(`Guaranteed income covers ${(coverage * 100).toFixed(0)}% of essential expenses → portfolio is surplus, not survival`);
  else if (coverage < 0.8) notes.push(`Guaranteed income covers only ${(coverage * 100).toFixed(0)}% of expenses → this portfolio funds living → capacity constrained`);

  // 2) The capacity-override switch (25 pts) — explicit "does living depend on it"
  if (!i.livingDependsOnThisPortfolio) { score += 25; notes.push('Living does NOT depend on this portfolio → capacity-override engaged (age becomes secondary)'); }

  // 3) Net-worth buffer relative to portfolio (20 pts)
  const bufferRatio = i.currentInvestableInr > 0 ? i.liquidNetWorthBufferInr / i.currentInvestableInr : 0;
  score += Math.max(0, Math.min(20, bufferRatio * 20));
  if (bufferRatio >= 0.5) notes.push(`Outside buffer = ${(bufferRatio * 100).toFixed(0)}% of portfolio → shocks absorbable`);

  // 4) Horizon (15 pts) — longest family-book horizon (the HUF/legacy doesn't retire)
  score += Math.max(0, Math.min(15, (i.longestHorizonYears / 20) * 15));

  return { score: Math.round(Math.max(0, Math.min(100, score))), notes };
}

// ── TOLERANCE ────────────────────────────────────────────────────────────────
// Willingness. Past behaviour in real drawdowns is the best predictor (better
// than any questionnaire) — this is the Dalbar behaviour-gap correction.
function scoreTolerance(i: ClientRiskInputs): { score: number; notes: string[] } {
  const notes: string[] = [];
  // base from questionnaire if present, else from stated priority
  let base = i.questionnaireScore0to100 ??
    (i.statedPriority === 'capital_first' ? 25 : i.statedPriority === 'balanced' ? 55 : 80);

  // stated priority always caps/anchors
  if (i.statedPriority === 'capital_first') { base = Math.min(base, 35); notes.push('Stated priority "capital first" → tolerance anchored low'); }
  if (i.statedPriority === 'growth_first') { base = Math.max(base, 65); notes.push('Stated priority "growth first" → tolerance anchored high'); }

  // past-drawdown behaviour adjustment (the behaviour-gap signal)
  const behaviourAdj: Record<ClientRiskInputs['pastDrawdownBehaviour'], number> = {
    added_more: +15, stayed_invested: +8, unknown: 0, stopped_sip: -12, panic_sold: -25,
  };
  base += behaviourAdj[i.pastDrawdownBehaviour];
  if (i.pastDrawdownBehaviour === 'panic_sold') notes.push('Panic-sold in a past crash → real tolerance well below stated → bias to lower-drawdown funds (closes the behaviour gap)');
  if (i.pastDrawdownBehaviour === 'stayed_invested' || i.pastDrawdownBehaviour === 'added_more') notes.push('Held / added in past crashes → genuine tolerance confirmed by behaviour');

  return { score: Math.round(Math.max(0, Math.min(100, base))), notes };
}

// ── REQUIRED return ──────────────────────────────────────────────────────────
// How much CAGR the goal actually needs. If goals are already funded, required
// is low → no need to take risk (but capacity may still PERMIT it for legacy).
function computeRequiredReturn(i: ClientRiskInputs): { pct: number | null; notes: string[] } {
  const notes: string[] = [];
  if (!i.targetCorpusInr || !i.yearsToGoal || i.yearsToGoal <= 0 || i.currentInvestableInr <= 0) {
    return { pct: null, notes: ['No explicit target corpus → required-return not binding (goals appear already met)'] };
  }
  const r = (Math.pow(i.targetCorpusInr / i.currentInvestableInr, 1 / i.yearsToGoal) - 1) * 100;
  notes.push(`Goal needs ${r.toFixed(1)}% p.a. to reach ₹${(i.targetCorpusInr / 1e7).toFixed(2)} Cr in ${i.yearsToGoal} yrs`);
  return { pct: r, notes };
}

// equity% → expected nominal CAGR (7% debt floor + 8% equity premium, MASTER_SPEC)
const equityToCagr = (eq: number) => 7 + (eq / 100) * 8;
// inverse: required CAGR → equity needed
const cagrToEquity = (cagr: number) => Math.max(0, Math.min(100, ((cagr - 7) / 8) * 100));

// score (0-100) → equity band anchor
const scoreToEquity = (s: number) => Math.round(Math.max(15, Math.min(90, 15 + (s / 100) * 75)));

// within-equity ceiling from the reconciled profile
function ceilingFromProfile(targetEquity: number, tolerance: number, capacity: number): RiskTier {
  // capital-preservation temperament caps the KIND of equity, independent of %
  if (tolerance <= 35) return 'Moderate';       // capital-first → Large/Hybrid/BAF/MultiAsset only
  if (tolerance <= 55) return 'High';            // balanced → + Flexi/Value/Focused/LargeMid
  // high tolerance → Very High allowed, but only if capacity also supports it
  return capacity >= 50 ? 'Very High' : 'High';
}

export function runRiskModel(i: ClientRiskInputs): RiskModelOutput {
  const cap = scoreCapacity(i);
  const tol = scoreTolerance(i);
  const req = computeRequiredReturn(i);
  const rationale: string[] = [...cap.notes, ...tol.notes, ...req.notes];

  const ageRuleEquity = Math.max(20, Math.min(90, 100 - i.primaryAge));

  // Candidate equity from each dimension
  const capacityEquity = scoreToEquity(cap.score);
  const toleranceEquity = scoreToEquity(tol.score);
  const requiredEquity = req.pct != null ? cagrToEquity(req.pct) : null;

  // RECONCILIATION — the binding constraint sets the band.
  // Rule: never take MORE risk than tolerance allows (behavioural safety), and
  // never take more than needed UNLESS capacity is high AND there is a legacy
  // bucket that benefits (handled in bucketing). Capacity sets the CEILING of
  // what is permissible; tolerance and required pull it down.
  let target = Math.min(capacityEquity, toleranceEquity);
  let binding: RiskModelOutput['bindingConstraint'] = toleranceEquity <= capacityEquity ? 'tolerance' : 'capacity';
  if (requiredEquity != null && requiredEquity < target) {
    // goals met with less risk — respect it unless legacy surplus argues otherwise
    target = Math.max(requiredEquity, Math.min(target, requiredEquity + 10));
    binding = 'required';
    rationale.push(`Goals met with ~${requiredEquity.toFixed(0)}% equity → no need to chase return; band trimmed toward need`);
  }
  target = Math.round(target);

  // capacity-override-age flag: did capacity let us hold MORE equity than 100-age?
  const capacityOverrodeAge = !i.livingDependsOnThisPortfolio && capacityEquity > ageRuleEquity + 5;
  if (capacityOverrodeAge) {
    rationale.push(`Capacity permits ~${capacityEquity}% equity vs the naive 100−age = ${ageRuleEquity}% — because survival is separately funded, age is not the binding constraint`);
  }

  const ceiling = ceilingFromProfile(target, tol.score, cap.score);
  rationale.push(`Within-equity ceiling = ${ceiling} → equity sleeve may only hold funds at or below this risk-tier (this is what forces a great-but-too-risky fund out for this client)`);

  // Maslow bucket plan (if buckets provided): each bucket's equity by horizon+tier
  let bucketPlan: RiskModelOutput['bucketPlan'];
  if (i.goalBuckets?.length) {
    bucketPlan = i.goalBuckets.map(b => {
      let eq: number; let ceil: RiskTier; let reason: string;
      if (b.tier === 'survival') { eq = 0; ceil = 'Low'; reason = 'Survival capital — guaranteed/liquid only, never at market risk'; }
      else if (b.tier === 'security') { eq = Math.min(target, 40); ceil = 'Moderate'; reason = 'Security goals — low-volatility hybrid'; }
      else if (b.tier === 'growth') { eq = Math.max(target, 65); ceil = ceiling; reason = `Growth bucket, ${b.horizonYears}y horizon — equity-led`; }
      else { // legacy — never-needed money compounds aggressively regardless of age
        eq = 85; ceil = cap.score >= 40 ? 'Very High' : 'High';
        reason = `Legacy bucket (${b.horizonYears}y, never drawn for own needs) — runs high equity REGARDLESS of age; this is where a 60-year-old can hold small/mid-cap`;
      }
      return { label: b.label, tier: b.tier, equityPct: eq, ceiling: ceil, reason };
    });
    rationale.push('Maslow bucketing applied: survival stays safe, legacy bucket runs high equity independent of age');
  }

  const profileLabel =
    target <= 30 ? 'Conservative (capital-preservation)' :
    target <= 50 ? 'Moderately Conservative' :
    target <= 68 ? 'Balanced' :
    target <= 80 ? 'Growth' : 'Aggressive Growth';

  return {
    capacityScore: cap.score,
    toleranceScore: tol.score,
    requiredReturnPct: req.pct,
    bindingConstraint: binding,
    capacityOverrodeAge,
    targetEquityPct: target,
    ageRuleEquityPct: ageRuleEquity,
    withinEquityCeiling: ceiling,
    profileLabel,
    rationale,
    bucketPlan,
  };
}
