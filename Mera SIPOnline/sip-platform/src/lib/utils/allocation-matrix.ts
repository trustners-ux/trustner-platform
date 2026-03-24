// Trustner Financial Planning — Asset Allocation Matrix Engine
// Maps each goal to recommended asset allocation based on time horizon and risk profile

import type { FinancialPlanningData, GoalGapResult, AssetAllocation } from '@/types/financial-planning';
import type { GoalAllocationEntry, AssetAllocationMatrix } from '@/types/financial-planning-v2';

// ---------------------------------------------------------------------------
// Allocation bucket (internal)
// ---------------------------------------------------------------------------

interface AllocationBucket {
  equity: number;
  debt: number;
  gold: number;
  liquid: number;
  expectedReturn: number;
}

/**
 * Asset Allocation based on XLFP/QPFP methodology:
 *
 * Time Horizon -> Allocation:
 * 0-1 year:  70% liquid, 30% debt, 0% gold, 0% equity  -> 5.8% return
 * 1-3 years: 10% liquid, 60% debt, 10% gold, 20% equity -> 6.6% return
 * 3-5 years: 5% liquid, 40% debt, 15% gold, 40% equity  -> 8.6% return
 * 5-10 years: 0% liquid, 20% debt, 10% gold, 70% equity -> 10.2% return
 * 10+ years: 0% liquid, 5% debt, 5% gold, 90% equity    -> 10.6% return
 *
 * Risk profile adjusts equity allocation +/-10-15%
 */
function getAllocationForHorizon(years: number, riskCategory: string): AllocationBucket {
  let base: AllocationBucket;

  if (years <= 1) {
    base = { equity: 0, debt: 30, gold: 0, liquid: 70, expectedReturn: 5.8 };
  } else if (years <= 3) {
    base = { equity: 20, debt: 60, gold: 10, liquid: 10, expectedReturn: 6.6 };
  } else if (years <= 5) {
    base = { equity: 40, debt: 40, gold: 15, liquid: 5, expectedReturn: 8.6 };
  } else if (years <= 10) {
    base = { equity: 70, debt: 20, gold: 10, liquid: 0, expectedReturn: 10.2 };
  } else {
    base = { equity: 90, debt: 5, gold: 5, liquid: 0, expectedReturn: 10.6 };
  }

  // Adjust for risk profile
  if (riskCategory === 'conservative') {
    const shift = Math.min(15, base.equity);
    base.equity -= shift;
    base.debt += shift;
    base.expectedReturn -= (shift / 100) * 4; // equity premium ~4%
  } else if (riskCategory === 'aggressive' && years > 3) {
    const shift = Math.min(10, base.debt);
    base.debt -= shift;
    base.equity += shift;
    base.expectedReturn += (shift / 100) * 4;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Recommended investment vehicles per allocation bucket
// ---------------------------------------------------------------------------

function getRecommendedVehicles(allocation: AllocationBucket, years: number): string[] {
  const vehicles: string[] = [];

  if (allocation.liquid > 0) {
    vehicles.push(years <= 1 ? 'Liquid Fund' : 'Ultra Short Duration Fund');
  }
  if (allocation.debt > 0) {
    if (years <= 1) vehicles.push('Overnight / Liquid Fund');
    else if (years <= 3) vehicles.push('Short Duration Debt Fund');
    else if (years <= 5) vehicles.push('Corporate Bond Fund');
    else vehicles.push('Medium to Long Duration Debt Fund');
  }
  if (allocation.gold > 0) {
    vehicles.push('Gold ETF / Sovereign Gold Bond');
  }
  if (allocation.equity > 0) {
    if (years <= 5) vehicles.push('Large Cap / Index Fund');
    else if (years <= 10) vehicles.push('Flexi Cap / Large & Mid Cap Fund');
    else vehicles.push('Flexi Cap / Mid Cap Fund');
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
