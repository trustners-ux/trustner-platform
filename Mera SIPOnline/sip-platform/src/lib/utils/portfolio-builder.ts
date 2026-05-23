/**
 * Model Portfolio Builder — calculation engine.
 *
 * Pure functions only. Given a list of fund holdings (id + weight),
 * computes weighted aggregate metrics, allocation breakdowns, and
 * SIP projections.
 *
 * Math notes:
 *  - Weighted return / TER / standard deviation: simple sum of (weight × metric).
 *    Note: weighted std-dev is an approximation that ignores covariance between
 *    funds. For client-facing presentation this is acceptable as long as we
 *    disclose the assumption (see disclaimer in the UI).
 *  - SIP projection uses end-of-month annuity formula with monthly compounding.
 */

import type { TrustnerCuratedFund, FundCategory, TrustnerFundList } from '@/types/funds';

// ─── Holding type — ID + percentage allocation ───

export interface PortfolioHolding {
  fundId: string;
  weight: number; // 0–100, treated as percent
}

export interface PortfolioMetrics {
  weightedReturn1Y: number;    // decimal CAGR
  weightedReturn3Y: number;
  weightedReturn5Y: number;
  weightedTER: number;          // decimal
  weightedStdDev: number;       // decimal
  weightedSharpe: number;
  totalWeight: number;          // sum of all weights (should be 100)
  fundCount: number;
  // For convenience — ready-to-display percentages
  return1YPct: number;          // 1Y return × 100
  return3YPct: number;
  return5YPct: number;
  terPct: number;
  stdDevPct: number;
}

export interface CategoryAllocation {
  category: FundCategory;
  weight: number;       // total weight for this category
  fundCount: number;
}

export interface CapBucket {
  bucket: 'Large' | 'Mid' | 'Small' | 'Hybrid' | 'Debt' | 'Gold' | 'International';
  weight: number;
}

export interface SIPProjection {
  monthlyAmountForGoal: number; // in INR — required SIP to hit target
  futureValueForSIP: number;    // future value if user invests `monthlyAmount` over horizon
  realFutureValue?: number;     // inflation-adjusted (optional)
}

// ─── Lookup ───

/** Build a flat fundId → fund map from the master list. */
export function buildFundLookup(list: TrustnerFundList): Map<string, TrustnerCuratedFund> {
  const map = new Map<string, TrustnerCuratedFund>();
  for (const cat of list.categories) {
    for (const fund of cat.funds) {
      map.set(fund.id, fund);
    }
  }
  return map;
}

// ─── Core metric computation ───

export function computePortfolioMetrics(
  holdings: PortfolioHolding[],
  lookup: Map<string, TrustnerCuratedFund>,
): PortfolioMetrics {
  let totalWeight = 0;
  let r1 = 0, r3 = 0, r5 = 0, ter = 0, sd = 0, sharpe = 0;
  let count = 0;

  for (const h of holdings) {
    const f = lookup.get(h.fundId);
    if (!f) continue;
    const w = h.weight / 100;
    totalWeight += h.weight;
    r1 += w * (f.returns.oneYear || 0);
    r3 += w * (f.returns.threeYear || 0);
    r5 += w * (f.returns.fiveYear || 0);
    ter += w * (f.ter || 0);
    sd += w * (f.standardDeviation || 0);
    sharpe += w * (f.sharpeRatio || 0);
    count += 1;
  }

  return {
    weightedReturn1Y: r1,
    weightedReturn3Y: r3,
    weightedReturn5Y: r5,
    weightedTER: ter,
    weightedStdDev: sd,
    weightedSharpe: sharpe,
    totalWeight,
    fundCount: count,
    return1YPct: r1 * 100,
    return3YPct: r3 * 100,
    return5YPct: r5 * 100,
    terPct: ter * 100,
    stdDevPct: sd * 100,
  };
}

// ─── Category allocation ───

export function computeCategoryAllocation(
  holdings: PortfolioHolding[],
  lookup: Map<string, TrustnerCuratedFund>,
): CategoryAllocation[] {
  const map = new Map<FundCategory, CategoryAllocation>();
  for (const h of holdings) {
    const f = lookup.get(h.fundId);
    if (!f) continue;
    const existing = map.get(f.category);
    if (existing) {
      existing.weight += h.weight;
      existing.fundCount += 1;
    } else {
      map.set(f.category, { category: f.category, weight: h.weight, fundCount: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

// ─── Cap-bucket allocation (Large / Mid / Small / Hybrid / Debt / Gold) ───

/**
 * Map each fund category to its dominant cap bucket. Multi-Cap and Flexi-Cap
 * funds are distributed across Large/Mid/Small via SEBI norms (50/35/15).
 * For client presentation only — accuracy depends on actual fund holdings,
 * which we don't have without paid data.
 */
const CATEGORY_CAP_MIX: Record<FundCategory, Partial<Record<CapBucket['bucket'], number>>> = {
  'Large Cap':           { Large: 1.0 },
  'Large & Mid Cap':     { Large: 0.5, Mid: 0.5 },
  'Mid Cap':             { Mid: 1.0 },
  'Small Cap':           { Small: 1.0 },
  'Flexi Cap':           { Large: 0.55, Mid: 0.30, Small: 0.15 },
  'Multi Cap':           { Large: 0.40, Mid: 0.30, Small: 0.30 }, // SEBI 25/25/25 + flex 25
  'Value':               { Large: 0.45, Mid: 0.40, Small: 0.15 },
  'Contra':              { Large: 0.45, Mid: 0.40, Small: 0.15 },
  'ELSS':                { Large: 0.55, Mid: 0.30, Small: 0.15 },
  'Focused':             { Large: 0.50, Mid: 0.35, Small: 0.15 },
  'Index':               { Large: 0.85, Mid: 0.10, Small: 0.05 },
  'Sectoral':            { Large: 0.50, Mid: 0.35, Small: 0.15 },
  'International':       { International: 1.0 },
  'Multi Asset':         { Large: 0.40, Mid: 0.10, Debt: 0.30, Gold: 0.15, International: 0.05 },
  'Balanced Advantage':  { Large: 0.45, Mid: 0.10, Debt: 0.45 },
  'Aggressive Hybrid':   { Large: 0.55, Mid: 0.15, Debt: 0.30 },
  'Equity Savings':      { Large: 0.30, Debt: 0.55, Hybrid: 0.15 },
  'Conservative Hybrid': { Debt: 0.75, Large: 0.20, Mid: 0.05 },
  'Gold & Silver':       { Gold: 1.0 },
  'Fund of Fund':        { International: 1.0 },
};

export function computeCapBuckets(
  holdings: PortfolioHolding[],
  lookup: Map<string, TrustnerCuratedFund>,
): CapBucket[] {
  const buckets: Record<string, number> = {};
  for (const h of holdings) {
    const f = lookup.get(h.fundId);
    if (!f) continue;
    const mix = CATEGORY_CAP_MIX[f.category] || { Large: 1.0 };
    for (const [bucket, share] of Object.entries(mix)) {
      buckets[bucket] = (buckets[bucket] || 0) + h.weight * (share || 0);
    }
  }
  return Object.entries(buckets)
    .map(([bucket, weight]) => ({ bucket: bucket as CapBucket['bucket'], weight }))
    .filter((b) => b.weight > 0.01)
    .sort((a, b) => b.weight - a.weight);
}

// ─── SIP projection ───

/**
 * Required monthly SIP to hit a target corpus over `years` at the given
 * (decimal) annual return. Uses end-of-month annuity FV formula:
 *
 *   FV = SIP × [((1+r)^n − 1) / r]
 *
 * where r = monthlyRate, n = months. Solving for SIP:
 *
 *   SIP = FV × r / ((1+r)^n − 1)
 */
export function requiredSIP(
  targetCorpus: number,
  years: number,
  annualReturn: number,
): number {
  if (targetCorpus <= 0 || years <= 0 || annualReturn <= 0) return 0;
  const r = annualReturn / 12;
  const n = years * 12;
  const factor = (Math.pow(1 + r, n) - 1) / r;
  if (factor <= 0) return 0;
  return targetCorpus / factor;
}

/**
 * Future value of a monthly SIP over `years` at `annualReturn`.
 *   FV = SIP × [((1+r)^n − 1) / r]
 */
export function futureValueOfSIP(
  monthlySIP: number,
  years: number,
  annualReturn: number,
): number {
  if (monthlySIP <= 0 || years <= 0 || annualReturn <= 0) return 0;
  const r = annualReturn / 12;
  const n = years * 12;
  return monthlySIP * ((Math.pow(1 + r, n) - 1) / r);
}

export function projectSIP(
  goalAmount: number,
  years: number,
  annualReturn: number,
  monthlySIP: number,
): SIPProjection {
  return {
    monthlyAmountForGoal: requiredSIP(goalAmount, years, annualReturn),
    futureValueForSIP: futureValueOfSIP(monthlySIP, years, annualReturn),
  };
}

// ─── Allocation templates ───

export interface AllocationTemplate {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive';
  // Category-level target weights (sum to 100)
  weights: { category: FundCategory; weight: number }[];
}

export const ALLOCATION_TEMPLATES: AllocationTemplate[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Capital preservation with steady growth. Ideal for short horizons (3–5 yrs) or low risk appetite.',
    riskLevel: 'Conservative',
    weights: [
      { category: 'Large Cap', weight: 25 },
      { category: 'Conservative Hybrid', weight: 35 },
      { category: 'Equity Savings', weight: 25 },
      { category: 'Gold & Silver', weight: 15 },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Moderate growth with reasonable downside protection. Suitable for 5–10 year goals.',
    riskLevel: 'Moderate',
    weights: [
      { category: 'Large Cap', weight: 25 },
      { category: 'Flexi Cap', weight: 25 },
      { category: 'Mid Cap', weight: 15 },
      { category: 'Balanced Advantage', weight: 20 },
      { category: 'Gold & Silver', weight: 10 },
      { category: 'Multi Asset', weight: 5 },
    ],
  },
  {
    id: 'aggressive',
    name: 'Aggressive Growth',
    description: 'Maximises long-term wealth creation. Best for 10+ year horizons with high risk tolerance.',
    riskLevel: 'Aggressive',
    weights: [
      { category: 'Large Cap', weight: 20 },
      { category: 'Flexi Cap', weight: 25 },
      { category: 'Mid Cap', weight: 20 },
      { category: 'Small Cap', weight: 20 },
      { category: 'Multi Cap', weight: 15 },
    ],
  },
  {
    id: 'very-aggressive',
    name: 'Very Aggressive',
    description: 'Maximum growth potential with high volatility. Only for 15+ year horizons and seasoned investors.',
    riskLevel: 'Very Aggressive',
    weights: [
      { category: 'Mid Cap', weight: 30 },
      { category: 'Small Cap', weight: 35 },
      { category: 'Flexi Cap', weight: 20 },
      { category: 'Multi Cap', weight: 15 },
    ],
  },
];

/**
 * Given an allocation template and the master fund list, build a default
 * portfolio by picking the rank-1 fund from each category in the template.
 */
export function buildPortfolioFromTemplate(
  template: AllocationTemplate,
  list: TrustnerFundList,
): PortfolioHolding[] {
  const holdings: PortfolioHolding[] = [];
  for (const slot of template.weights) {
    const cat = list.categories.find((c) => c.name === slot.category);
    if (!cat) continue;
    const topFund = [...cat.funds].sort((a, b) => a.rank - b.rank)[0];
    if (!topFund) continue;
    holdings.push({ fundId: topFund.id, weight: slot.weight });
  }
  return holdings;
}

// ─── Validation ───

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export function validatePortfolio(
  holdings: PortfolioHolding[],
  lookup: Map<string, TrustnerCuratedFund>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (holdings.length === 0) {
    issues.push({ level: 'error', message: 'Add at least one fund to begin.' });
    return issues;
  }
  const total = holdings.reduce((s, h) => s + h.weight, 0);
  if (Math.abs(total - 100) > 0.5) {
    issues.push({
      level: 'error',
      message: `Total allocation is ${total.toFixed(1)}% — adjust to exactly 100%.`,
    });
  }
  // No fund > 50%
  const overweight = holdings.find((h) => h.weight > 50);
  if (overweight) {
    const f = lookup.get(overweight.fundId);
    issues.push({
      level: 'warning',
      message: `${f?.name ?? 'A fund'} is at ${overweight.weight.toFixed(0)}% — single-fund concentration above 50% is risky. Consider splitting.`,
    });
  }
  // Too few funds
  if (holdings.length < 3) {
    issues.push({
      level: 'warning',
      message: 'Most balanced portfolios have 4–7 funds. Consider adding more diversification.',
    });
  }
  // Too many funds (over-diversification)
  if (holdings.length > 10) {
    issues.push({
      level: 'warning',
      message: 'More than 10 funds typically adds complexity without meaningful diversification benefit.',
    });
  }
  // Same category > 60% weight
  const catAlloc = computeCategoryAllocation(holdings, lookup);
  const overcat = catAlloc.find((c) => c.weight > 60);
  if (overcat) {
    issues.push({
      level: 'warning',
      message: `${overcat.weight.toFixed(0)}% in ${overcat.category} is heavy — consider diversifying across categories.`,
    });
  }
  return issues;
}

// ─── URL encode/decode for shareable links ───

export function encodePortfolioToURL(
  holdings: PortfolioHolding[],
  meta: { name?: string; goalAmount?: number; horizonYears?: number; sip?: number },
): string {
  const payload = JSON.stringify({ h: holdings, m: meta });
  // Base64URL-safe encoding
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(payload)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(payload).toString('base64url');
}

export function decodePortfolioFromURL(encoded: string): {
  holdings: PortfolioHolding[];
  meta: { name?: string; goalAmount?: number; horizonYears?: number; sip?: number };
} | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(escape(atob(padded)))
      : Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as { h: PortfolioHolding[]; m: object };
    if (!Array.isArray(parsed.h)) return null;
    return { holdings: parsed.h, meta: (parsed.m as Record<string, never>) || {} };
  } catch {
    return null;
  }
}
