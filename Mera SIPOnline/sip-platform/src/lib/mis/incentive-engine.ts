// ─── Trustner MIS: Incentive Calculation Engine ───
// Implements Section 1.18 — Weighted Business Calculation (Master Formula)

import {
  Employee,
  MonthlyBusinessEntry,
  MonthlyIncentiveCalc,
  IncentiveSlab,
  PerformanceStatus,
  SlabTable,
  DST_SLABS,
  POSP_RM_SLABS,
} from './types';

/**
 * Step 1-6: Calculate weighted business for a single entry
 */
export function calculateWeightedBusiness(entry: {
  rawAmount: number;
  productCreditPct: number;
  channelPayoutPct: number;
  tierMultiplier: number; // 100, 75, or 50
  isFpRoute: boolean;
}): number {
  // Step 2: Apply Product Credit %
  let weighted = entry.rawAmount * (entry.productCreditPct / 100);

  // FP Route gets 125% credit bonus
  if (entry.isFpRoute) {
    weighted *= 1.25;
  }

  // Step 4: Apply Channel Margin Credit (for non-direct business)
  if (entry.channelPayoutPct > 0) {
    weighted *= (100 - entry.channelPayoutPct) / 100;
  }

  // Step 5: Apply Tier Multiplier
  weighted *= entry.tierMultiplier / 100;

  return Math.round(weighted * 100) / 100;
}

/**
 * Step 7: Calculate Achievement %
 */
export function calculateAchievementPct(
  netWeightedBusiness: number,
  monthlyTarget: number
): number {
  if (monthlyTarget <= 0) return 0;
  return Math.round((netWeightedBusiness / monthlyTarget) * 10000) / 100;
}

/**
 * Step 8: Look up applicable slab
 */
export function lookupSlab(
  achievementPct: number,
  slabTable: SlabTable
): IncentiveSlab {
  const slabs = slabTable === 'DST' ? DST_SLABS : POSP_RM_SLABS;

  // Find matching slab (highest that applies)
  for (let i = slabs.length - 1; i >= 0; i--) {
    const slab = slabs[i];
    if (achievementPct >= slab.achievementMin) {
      return slab;
    }
  }

  return slabs[0]; // No Incentive
}

/**
 * Step 9: Calculate incentive amount
 */
export function calculateIncentive(
  netWeightedBusiness: number,
  slab: IncentiveSlab
): number {
  if (slab.incentiveRate === 0) return 0;
  const amount = netWeightedBusiness * (slab.incentiveRate / 100) * slab.multiplier;
  return Math.round(amount * 100) / 100;
}

/**
 * Determine applicable slab table based on employee segment
 */
export function getSlabTable(employee: Employee): SlabTable {
  if (
    employee.segment === 'Direct Sales' ||
    employee.segment === 'FP Team'
  ) {
    return 'DST';
  }
  if (
    employee.segment === 'CDM/POSP RM' ||
    employee.segment === 'Area Manager'
  ) {
    return 'POSP_RM';
  }
  return 'DST'; // Default for support (won't qualify anyway)
}

/**
 * Determine performance status
 */
export function getPerformanceStatus(achievementPct: number): PerformanceStatus {
  if (achievementPct >= 151) return 'Champion';
  if (achievementPct >= 131) return 'Star';
  if (achievementPct >= 80) return 'Achiever';
  if (achievementPct >= 1) return 'Below Target';
  return 'No Incentive';
}

/**
 * Get next slab info for motivational display
 */
export function getNextSlabInfo(
  achievementPct: number,
  netWeightedBusiness: number,
  monthlyTarget: number,
  slabTable: SlabTable
): { nextSlabLabel: string; amountNeeded: number; achievementNeeded: number } | null {
  const slabs = slabTable === 'DST' ? DST_SLABS : POSP_RM_SLABS;
  const currentSlabIndex = slabs.findIndex(
    (s) => achievementPct >= s.achievementMin && (s.achievementMax === null || achievementPct <= s.achievementMax)
  );

  if (currentSlabIndex === -1 || currentSlabIndex >= slabs.length - 1) {
    return null; // Already at highest slab
  }

  const nextSlab = slabs[currentSlabIndex + 1];
  const achievementNeeded = nextSlab.achievementMin;
  const businessNeeded = (achievementNeeded / 100) * monthlyTarget;
  const amountNeeded = Math.max(0, businessNeeded - netWeightedBusiness);

  return {
    nextSlabLabel: nextSlab.slabLabel,
    amountNeeded: Math.round(amountNeeded),
    achievementNeeded,
  };
}

/**
 * MASTER CALCULATION: Full monthly incentive for an employee
 * Implements all 10 steps from Section 1.18
 */
export function calculateMonthlyIncentive(
  employee: Employee,
  businessEntries: MonthlyBusinessEntry[],
  sipClawbackDebit: number = 0,
  complianceFactor: number = 1.0,
  additionalBonuses: {
    trailIncome?: number;
    recruitmentBonus?: number;
    activationBonus?: number;
    motorIncentive?: number;
    referralCreditAmount?: number;
  } = {}
): MonthlyIncentiveCalc {
  const month = businessEntries[0]?.month || new Date().toISOString().slice(0, 7);

  // Step 6: Sum all product lines → Total Weighted Business
  const totalRawBusiness = businessEntries.reduce((sum, e) => sum + e.rawAmount, 0);
  const totalWeightedBusiness = businessEntries.reduce((sum, e) => sum + e.weightedAmount, 0);

  // Step 3: Apply SIP Clawback
  const netWeightedBusiness = Math.max(0, totalWeightedBusiness - sipClawbackDebit);

  // Step 7: Calculate Achievement %
  const achievementPct = calculateAchievementPct(netWeightedBusiness, employee.monthlyTarget);

  // Step 8: Determine Slab
  const slabTable = getSlabTable(employee);
  const slab = lookupSlab(achievementPct, slabTable);

  // Step 9: Calculate Incentive
  const grossIncentive = calculateIncentive(netWeightedBusiness, slab);

  // Step 10: Apply Compliance Multiplier
  const netIncentive = Math.round(grossIncentive * complianceFactor * 100) / 100;

  // Additional bonuses
  const trailIncome = additionalBonuses.trailIncome || 0;
  const recruitmentBonus = additionalBonuses.recruitmentBonus || 0;
  const activationBonus = additionalBonuses.activationBonus || 0;
  const motorIncentive = additionalBonuses.motorIncentive || 0;
  const referralCreditAmount = additionalBonuses.referralCreditAmount || 0;

  const totalPayout = netIncentive + trailIncome + recruitmentBonus + activationBonus + motorIncentive + referralCreditAmount;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    month,
    monthlyTarget: employee.monthlyTarget,
    totalRawBusiness: Math.round(totalRawBusiness),
    totalWeightedBusiness: Math.round(totalWeightedBusiness * 100) / 100,
    sipClawbackDebit,
    netWeightedBusiness: Math.round(netWeightedBusiness * 100) / 100,
    achievementPct,
    applicableSlab: slabTable,
    slabLabel: slab.slabLabel,
    incentiveRate: slab.incentiveRate,
    slabMultiplier: slab.multiplier,
    grossIncentive,
    complianceFactor,
    netIncentive,
    trailIncome,
    recruitmentBonus,
    activationBonus,
    motorIncentive,
    referralCreditAmount,
    totalPayout: Math.round(totalPayout * 100) / 100,
    performanceStatus: getPerformanceStatus(achievementPct),
  };
}

/**
 * Target Adjustment Formula (Section 1.2)
 * Adjusted Target = (30% / Actual Margin%) × Base Target
 */
export function adjustTargetForMargin(
  baseTarget: number,
  actualMarginPct: number
): number {
  if (actualMarginPct <= 0) return baseTarget * 10; // Cap at 10x if margin is zero/negative
  return Math.round((30 / actualMarginPct) * baseTarget);
}

/**
 * POSP RM Credit Calculation (Section 1.5)
 * RM Credit % = 100% − Channel Payout %
 */
export function calculateRmCredit(
  rawBusiness: number,
  channelPayoutPct: number,
  tierMultiplier: number // 100, 75, or 50
): number {
  const rmCreditPct = 100 - channelPayoutPct;
  return Math.round(rawBusiness * (rmCreditPct / 100) * (tierMultiplier / 100) * 100) / 100;
}

/**
 * Format currency for display (INR)
 */
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
