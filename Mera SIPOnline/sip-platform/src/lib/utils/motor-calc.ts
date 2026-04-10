// ─── Motor Insurance Calculation Utilities ───
// Commission is earned ONLY on OD (Own Damage), NOT on TP (Third Party — IRDAI regulated, 0% commission)

import {
  DEFAULT_POSP_GRID,
  ALL_POSP_CATEGORIES,
  type POSPCategory,
  type POSPPayoutGrid,
} from '@/lib/mis/types';
import {
  getPOSPCategoryPct,
  calculateFranchiseDifferential,
  calculateFranchiseSelfSourced,
} from '@/lib/mis/incentive-engine';

// ─── Types ───

export interface MotorPolicyInput {
  totalPremium: number;
  odPremium: number;
  tpPremium: number;
  vehicleType: 'Two Wheeler' | 'Private Car' | 'Commercial Vehicle';
  region: 'Metro' | 'Non-Metro' | 'All India';
  insurer: string;
  pospCategory?: POSPCategory;
  channelType: 'POSP' | 'BQP' | 'Franchise' | 'Direct';
  franchiseAgreementPct?: number;
}

export interface MotorCalculationResult {
  totalPremium: number;
  odPremium: number;
  tpPremium: number;

  // Commission (on OD only)
  commissionRate: number;        // % from insurer on OD
  grossCommission: number;       // OD x rate%

  // Channel payout
  channelPayoutPct: number;      // POSP category % or BQP 85% etc.
  channelPayout: number;

  // Franchise differential (if applicable)
  franchiseDifferentialPct: number;
  franchisePayout: number;

  // Company retention
  companyRetention: number;
  companyRetentionPct: number;

  // For incentive calculation
  productTier: 3;               // Motor is always Tier 3
  weightage: 50;                // Tier 3 = 50%
  weightedBusiness: number;     // totalPremium x 50%
}

// ─── Grid Lookup Helpers ───

/** Get all unique insurers from the POSP grid */
export function getAvailableInsurers(): string[] {
  const set = new Set<string>();
  DEFAULT_POSP_GRID.filter(g => g.isActive).forEach(g => set.add(g.insurer));
  return Array.from(set).sort();
}

/** Get all unique product lines from the POSP grid */
export function getAvailableProductLines(): string[] {
  const set = new Set<string>();
  DEFAULT_POSP_GRID.filter(g => g.isActive).forEach(g => set.add(g.productLine));
  return Array.from(set).sort();
}

/** Get unique vehicle types from the grid */
export function getAvailableVehicleTypes(): string[] {
  const set = new Set<string>();
  DEFAULT_POSP_GRID.filter(g => g.isActive).forEach(g => set.add(g.vehicleType));
  return Array.from(set).sort();
}

/** Get unique regions from the grid */
export function getAvailableRegions(): string[] {
  const set = new Set<string>();
  DEFAULT_POSP_GRID.filter(g => g.isActive).forEach(g => set.add(g.region));
  return Array.from(set).sort();
}

/**
 * Derive the product line from vehicleType + region.
 * Maps to the coded product lines in DEFAULT_POSP_GRID.
 */
export function deriveProductLine(
  vehicleType: 'Two Wheeler' | 'Private Car' | 'Commercial Vehicle',
  region: 'Metro' | 'Non-Metro' | 'All India'
): string {
  // Try to find a matching product line in the grid
  const match = DEFAULT_POSP_GRID.find(
    g => g.isActive && g.vehicleType === vehicleType && g.region === region
  );
  if (match) return match.productLine;

  // Fallback: try 'All India' region for this vehicle type
  const fallback = DEFAULT_POSP_GRID.find(
    g => g.isActive && g.vehicleType === vehicleType && g.region === 'All India'
  );
  if (fallback) return fallback.productLine;

  // Last resort: just find any entry for this vehicle type
  const any = DEFAULT_POSP_GRID.find(
    g => g.isActive && g.vehicleType === vehicleType
  );
  return any?.productLine ?? 'Unknown';
}

/**
 * Lookup commission rate from grid based on category, productLine, insurer
 */
export function lookupCommissionRate(
  category: POSPCategory,
  productLine: string,
  insurer: string
): number {
  const entry = DEFAULT_POSP_GRID.find(
    g =>
      g.isActive &&
      g.category === category &&
      g.productLine === productLine &&
      g.insurer === insurer
  );
  return entry?.commissionPct ?? 0;
}

/**
 * Get available insurers for a specific product line
 */
export function getInsurersForProductLine(productLine: string): string[] {
  const set = new Set<string>();
  DEFAULT_POSP_GRID
    .filter(g => g.isActive && g.productLine === productLine)
    .forEach(g => set.add(g.insurer));
  return Array.from(set).sort();
}

/**
 * Get the full grid entries grouped by product line for display
 */
export function getGridGroupedByProductLine(): Record<string, POSPPayoutGrid[]> {
  const grouped: Record<string, POSPPayoutGrid[]> = {};
  DEFAULT_POSP_GRID.filter(g => g.isActive).forEach(g => {
    if (!grouped[g.productLine]) grouped[g.productLine] = [];
    grouped[g.productLine].push(g);
  });
  return grouped;
}

// ─── Channel Payout Logic ───

function getChannelPayoutPct(
  channelType: 'POSP' | 'BQP' | 'Franchise' | 'Direct',
  pospCategory?: POSPCategory,
  franchiseAgreementPct?: number
): number {
  switch (channelType) {
    case 'POSP':
      return pospCategory ? getPOSPCategoryPct(pospCategory) : 50;
    case 'BQP':
      return 85;
    case 'Franchise':
      return franchiseAgreementPct ?? 85;
    case 'Direct':
      return 0;
    default:
      return 0;
  }
}

// ─── Main Calculation ───

/**
 * Calculate motor insurance commission breakdown.
 * Commission is earned ONLY on OD premium, never on TP.
 */
export function calculateMotorCommission(
  input: MotorPolicyInput
): MotorCalculationResult {
  const {
    totalPremium,
    odPremium,
    tpPremium,
    vehicleType,
    region,
    insurer,
    pospCategory,
    channelType,
    franchiseAgreementPct,
  } = input;

  // Step 1: Derive product line from vehicle type + region
  const productLine = deriveProductLine(vehicleType, region);

  // Step 2: Get the commission rate from the POSP grid
  // Use the POSP category if provided, else default to 'A'
  const effectiveCategory = pospCategory ?? 'A';
  const commissionRate = lookupCommissionRate(effectiveCategory, productLine, insurer);

  // Step 3: Gross commission = OD premium x commission rate
  // TP premium earns 0% commission (IRDAI regulated)
  const grossCommission = Math.round(odPremium * (commissionRate / 100) * 100) / 100;

  // Step 4: Channel payout
  const channelPayoutPct = getChannelPayoutPct(channelType, pospCategory, franchiseAgreementPct);

  let channelPayout = 0;
  let franchiseDifferentialPct = 0;
  let franchisePayout = 0;
  let companyRetention = 0;
  let companyRetentionPct = 0;

  if (channelType === 'Franchise' && pospCategory) {
    // Franchise with underlying POSP — differential model
    const pospPct = getPOSPCategoryPct(pospCategory);
    const franPct = franchiseAgreementPct ?? 85;
    const result = calculateFranchiseDifferential(grossCommission, franPct, pospPct);
    channelPayout = result.pospPayout;
    franchiseDifferentialPct = result.franchiseDifferentialPct;
    franchisePayout = result.franchisePayout;
    companyRetention = result.companyRetention;
    companyRetentionPct = result.companyRetentionPct;
  } else if (channelType === 'Franchise') {
    // Franchise self-sourced (no POSP underneath)
    const franPct = franchiseAgreementPct ?? 85;
    const result = calculateFranchiseSelfSourced(grossCommission, franPct);
    channelPayout = 0;
    franchiseDifferentialPct = 0;
    franchisePayout = result.franchisePayout;
    companyRetention = result.companyRetention;
    companyRetentionPct = grossCommission > 0
      ? Math.round((result.companyRetention / grossCommission) * 10000) / 100
      : 0;
  } else if (channelType === 'Direct') {
    // Direct — company retains 100%
    channelPayout = 0;
    companyRetention = grossCommission;
    companyRetentionPct = 100;
  } else {
    // POSP or BQP
    channelPayout = Math.round(grossCommission * (channelPayoutPct / 100) * 100) / 100;
    companyRetention = Math.round((grossCommission - channelPayout) * 100) / 100;
    companyRetentionPct = grossCommission > 0
      ? Math.round((companyRetention / grossCommission) * 10000) / 100
      : 0;
  }

  // Step 5: Incentive weightage — Motor is always Tier 3 = 50%
  const weightedBusiness = Math.round(totalPremium * 0.5 * 100) / 100;

  return {
    totalPremium,
    odPremium,
    tpPremium,
    commissionRate,
    grossCommission,
    channelPayoutPct,
    channelPayout,
    franchiseDifferentialPct,
    franchisePayout,
    companyRetention,
    companyRetentionPct,
    productTier: 3,
    weightage: 50,
    weightedBusiness,
  };
}
