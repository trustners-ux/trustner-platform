// Trustner Financial Planning — Asset Allocation Matrix Engine
// Maps each goal to recommended asset allocation based on time horizon and risk profile
// All recommendations for Regular plans via MFD (ARN-286886)

import type { FinancialPlanningData, GoalGapResult, AssetAllocation } from '@/types/financial-planning';
import type { GoalAllocationEntry, AssetAllocationMatrix } from '@/types/financial-planning-v2';

// ---------------------------------------------------------------------------
// MFD Disclaimer
// ---------------------------------------------------------------------------

const MFD_DISCLAIMER =
  'All recommendations are for Regular plan mutual funds via MFD (ARN-286886). ' +
  'Trustner Asset Services Pvt Ltd. Past performance does not guarantee future results.';

// ---------------------------------------------------------------------------
// Allocation bands (XLFP/QPFP methodology)
// ---------------------------------------------------------------------------

interface AllocationBucket {
  equity: number;
  debt: number;
  gold: number;
  liquid: number;
  expectedReturn: number;
}

type BandKey = '0-1' | '1-3' | '3-5' | '5-10' | '10+';

const ALLOCATION_BANDS: Record<BandKey, AllocationBucket> = {
  '0-1':  { liquid: 70, debt: 30, gold: 0,  equity: 0,  expectedReturn: 5.8  },
  '1-3':  { liquid: 10, debt: 60, gold: 10, equity: 20, expectedReturn: 6.6  },
  '3-5':  { liquid: 5,  debt: 40, gold: 15, equity: 40, expectedReturn: 8.6  },
  '5-10': { liquid: 0,  debt: 20, gold: 10, equity: 70, expectedReturn: 10.2 },
  '10+':  { liquid: 0,  debt: 5,  gold: 5,  equity: 90, expectedReturn: 10.6 },
};

const BAND_ORDER: BandKey[] = ['0-1', '1-3', '3-5', '5-10', '10+'];

/**
 * Get the default band for a given time horizon in years.
 */
function getBandForYears(years: number): BandKey {
  if (years <= 1) return '0-1';
  if (years <= 3) return '1-3';
  if (years <= 5) return '3-5';
  if (years <= 10) return '5-10';
  return '10+';
}

/**
 * Risk profile adjustment:
 * - Conservative: shift one band shorter (e.g., 5-10Y uses 3-5Y allocation)
 * - Aggressive: shift one band longer (e.g., 3-5Y uses 5-10Y allocation)
 * - Moderate: use default bands
 */
function getAllocationForHorizon(years: number, riskCategory: string): AllocationBucket {
  const defaultBand = getBandForYears(years);
  const bandIndex = BAND_ORDER.indexOf(defaultBand);

  let effectiveBand: BandKey;
  if (riskCategory === 'conservative') {
    // Shift one band shorter (more conservative), but clamp at index 0
    effectiveBand = BAND_ORDER[Math.max(0, bandIndex - 1)];
  } else if (riskCategory === 'aggressive') {
    // Shift one band longer (more aggressive), but clamp at last index
    effectiveBand = BAND_ORDER[Math.min(BAND_ORDER.length - 1, bandIndex + 1)];
  } else {
    effectiveBand = defaultBand;
  }

  // Return a copy so we don't mutate the constant
  return { ...ALLOCATION_BANDS[effectiveBand] };
}

// ---------------------------------------------------------------------------
// Recommended investment vehicles per allocation bucket (categories only)
// ---------------------------------------------------------------------------

function getRecommendedVehicles(allocation: AllocationBucket, years: number): string[] {
  const vehicles: string[] = [];

  if (allocation.liquid > 0) {
    vehicles.push('Liquid Fund');
  }
  if (allocation.debt > 0) {
    if (years <= 1) vehicles.push('Liquid Fund / Overnight Fund');
    else if (years <= 3) vehicles.push('Short Duration Fund');
    else vehicles.push('Corporate Bond Fund');
  }
  if (allocation.gold > 0) {
    vehicles.push('Sovereign Gold Bond / Gold ETF');
  }
  if (allocation.equity > 0) {
    if (years <= 5) vehicles.push('Large Cap Fund / Flexi Cap Fund');
    else if (years <= 10) vehicles.push('Flexi Cap Fund / Large & Mid Cap Fund');
    else vehicles.push('Mid Cap Fund / Small Cap Fund');
  }

  return vehicles;
}

// ---------------------------------------------------------------------------
// Main: goal-wise allocation matrix
// ---------------------------------------------------------------------------

export function calculateAllocationMatrix(
  data: FinancialPlanningData,
  goalGaps: GoalGapResult[]
): AssetAllocationMatrix {
  const currentYear = new Date().getFullYear();
  const riskCategory = data.riskProfile?.riskCategory || 'moderate';

  const entries: GoalAllocationEntry[] = data.goals.map((goal) => {
    const timeHorizon = Math.max(1, goal.targetYear - currentYear);
    const allocation = getAllocationForHorizon(timeHorizon, riskCategory);
    const gap = goalGaps.find((g) => g.goalName === goal.name);

    return {
      goalName: goal.name,
      goalType: goal.type,
      timeHorizon,
      equity: allocation.equity,
      debt: allocation.debt,
      gold: allocation.gold,
      liquid: allocation.liquid,
      expectedReturn: Math.round(allocation.expectedReturn * 10) / 10,
      monthlySIP: gap?.monthlyRequired || 0,
      recommendedVehicles: getRecommendedVehicles(allocation, timeHorizon),
    };
  });

  // Calculate overall recommended allocation (weighted by monthly SIP)
  const totalSIP = entries.reduce((sum, e) => sum + e.monthlySIP, 0) || 1;
  const overallRecommended: AssetAllocation = {
    equity: Math.round(
      entries.reduce((sum, e) => sum + (e.equity * e.monthlySIP) / totalSIP, 0)
    ),
    debt: Math.round(
      entries.reduce((sum, e) => sum + (e.debt * e.monthlySIP) / totalSIP, 0)
    ),
    gold: Math.round(
      entries.reduce((sum, e) => sum + (e.gold * e.monthlySIP) / totalSIP, 0)
    ),
    realEstate: 0,
    cash: Math.round(
      entries.reduce((sum, e) => sum + (e.liquid * e.monthlySIP) / totalSIP, 0)
    ),
  };

  // Normalize to 100%
  const total =
    overallRecommended.equity +
    overallRecommended.debt +
    overallRecommended.gold +
    overallRecommended.cash;
  if (total > 0 && total !== 100) {
    const factor = 100 / total;
    overallRecommended.equity = Math.round(overallRecommended.equity * factor);
    overallRecommended.debt = Math.round(overallRecommended.debt * factor);
    overallRecommended.gold = Math.round(overallRecommended.gold * factor);
    overallRecommended.cash =
      100 - overallRecommended.equity - overallRecommended.debt - overallRecommended.gold;
  }

  return {
    entries,
    overallRecommended,
    rebalancingFrequency: riskCategory === 'conservative' ? 'annually' : 'semi-annually',
    disclaimer: MFD_DISCLAIMER,
  };
}

// ---------------------------------------------------------------------------
// Standalone: recommended allocation by age + risk (rule of thumb)
// ---------------------------------------------------------------------------

/**
 * Calculate recommended overall asset allocation based on age and risk.
 * Rule of thumb: Equity % = 100 - age (adjusted for risk)
 */
export function calculateRecommendedAllocation(data: FinancialPlanningData): AssetAllocation {
  const age = data.personalProfile.age || 30;
  const risk = data.riskProfile?.riskCategory || 'moderate';

  let equityBase = Math.max(10, Math.min(90, 100 - age));
  if (risk === 'conservative') equityBase = Math.max(10, equityBase - 15);
  if (risk === 'aggressive') equityBase = Math.min(90, equityBase + 10);

  const gold = 10;
  const debt = Math.max(5, 100 - equityBase - gold);

  return {
    equity: equityBase,
    debt,
    gold,
    realEstate: 0,
    cash: Math.max(0, 100 - equityBase - debt - gold),
  };
}
