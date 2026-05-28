/**
 * Old vs New Tax Regime Calculator — FY 2025-26 (AY 2026-27)
 *
 * Implements the Finance Act 2024 slab structure for both regimes,
 * computes tax + cess + surcharge under each, and returns a comparison
 * with the optimal choice + savings amount.
 *
 * Deductions only apply in the OLD regime. NEW regime has higher standard
 * deduction (Rs. 75K vs Rs. 50K) and lower slab rates but no 80C/80D/HRA.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

// ─────────────────────────────────────────────────────────────────
// SLAB TABLES (Finance Act 2024 — FY 2025-26 / AY 2026-27)
// ─────────────────────────────────────────────────────────────────

interface Slab {
  upTo: number;       // upper bound of slab in INR (Infinity for top slab)
  rate: number;       // marginal rate as fraction (e.g. 0.20 for 20%)
}

const OLD_REGIME_SLABS: Slab[] = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 300_000, rate: 0 },
  { upTo: 700_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.10 },
  { upTo: 1_200_000, rate: 0.15 },
  { upTo: 1_500_000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// Standard deduction (salaried/pensioners)
const STANDARD_DEDUCTION_OLD = 50_000;
const STANDARD_DEDUCTION_NEW = 75_000;

// Section 87A rebate
const REBATE_87A_OLD_THRESHOLD = 500_000;
const REBATE_87A_OLD_MAX = 12_500;
const REBATE_87A_NEW_THRESHOLD = 700_000;
const REBATE_87A_NEW_MAX = 25_000;

// Surcharge (on tax, applies above thresholds)
interface SurchargeStep { incomeAbove: number; rate: number }
const SURCHARGE_OLD: SurchargeStep[] = [
  { incomeAbove: 50_000_000, rate: 0.37 }, // > 5 Cr
  { incomeAbove: 20_000_000, rate: 0.25 }, // > 2 Cr
  { incomeAbove: 10_000_000, rate: 0.15 }, // > 1 Cr
  { incomeAbove: 5_000_000,  rate: 0.10 }, // > 50 L
];
const SURCHARGE_NEW: SurchargeStep[] = [
  { incomeAbove: 20_000_000, rate: 0.25 }, // > 2 Cr (capped at 25% — Finance Act 2023 change)
  { incomeAbove: 10_000_000, rate: 0.15 }, // > 1 Cr
  { incomeAbove: 5_000_000,  rate: 0.10 }, // > 50 L
];

const HEALTH_EDUCATION_CESS = 0.04; // 4% on tax + surcharge

// ─────────────────────────────────────────────────────────────────
// COMPUTATION
// ─────────────────────────────────────────────────────────────────

function applySlabs(taxableIncome: number, slabs: Slab[]): number {
  let tax = 0;
  let prevUpTo = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prevUpTo) break;
    const upper = Math.min(taxableIncome, slab.upTo);
    tax += (upper - prevUpTo) * slab.rate;
    prevUpTo = slab.upTo;
  }
  return Math.round(tax);
}

function applySurcharge(tax: number, taxableIncome: number, surchargeTable: SurchargeStep[]): number {
  // Apply HIGHEST applicable surcharge rate (not stacked)
  for (const step of surchargeTable) {
    if (taxableIncome > step.incomeAbove) {
      return Math.round(tax * step.rate);
    }
  }
  return 0;
}

export interface TaxRegimeInput {
  /** Gross total annual income in INR (salary + bonus + rental + business + other). */
  grossAnnualIncomeInr: number;
  /** Section 80C investments — PPF, EPF, ELSS, life insurance premium, etc. Capped at Rs 1.5L. Old regime only. */
  section80cInr?: number;
  /** Section 80D — health insurance premium self + family. Old regime only. */
  section80dInr?: number;
  /** Section 24(b) — home loan interest. Capped at Rs 2L for self-occupied. Old regime only. */
  homeLoanInterestInr?: number;
  /** HRA exemption (if rent paid). Old regime only. Caller should compute the actual exempt portion separately. */
  hraExemptionInr?: number;
  /** Other old-regime-only deductions (NPS 80CCD(1B), 80E, 80G etc.) */
  otherOldRegimeDeductionsInr?: number;
}

export interface TaxRegimeResult {
  oldRegime: {
    taxableIncomeInr: number;
    deductionsClaimedInr: number;
    incomeTaxInr: number;
    surchargeInr: number;
    cessInr: number;
    totalTaxInr: number;
  };
  newRegime: {
    taxableIncomeInr: number;
    deductionsClaimedInr: number;
    incomeTaxInr: number;
    surchargeInr: number;
    cessInr: number;
    totalTaxInr: number;
  };
  optimalRegime: 'old' | 'new';
  savingsInr: number;
  rationale: string;
}

/**
 * Compute tax payable under both regimes and return the optimal choice
 * + savings amount. Uses Finance Act 2024 slabs for FY 2025-26.
 *
 * This is a pure function — no DB calls, no side effects. Suitable for
 * exposure as a Claude tool or direct UI usage.
 */
export function compareTaxRegimes(input: TaxRegimeInput): TaxRegimeResult {
  const gross = Math.max(0, input.grossAnnualIncomeInr || 0);

  // ── OLD REGIME ────────────────────────────────────────────────
  const old80c = Math.min(150_000, Math.max(0, input.section80cInr || 0));
  const old80d = Math.max(0, input.section80dInr || 0);
  const oldHomeLoan = Math.min(200_000, Math.max(0, input.homeLoanInterestInr || 0));
  const oldHra = Math.max(0, input.hraExemptionInr || 0);
  const oldOther = Math.max(0, input.otherOldRegimeDeductionsInr || 0);
  const oldDeductions = STANDARD_DEDUCTION_OLD + old80c + old80d + oldHomeLoan + oldHra + oldOther;
  const oldTaxable = Math.max(0, gross - oldDeductions);

  let oldTax = applySlabs(oldTaxable, OLD_REGIME_SLABS);
  // 87A rebate (Old regime — only if taxable income <= 5L)
  if (oldTaxable <= REBATE_87A_OLD_THRESHOLD) {
    oldTax = Math.max(0, oldTax - REBATE_87A_OLD_MAX);
  }
  const oldSurcharge = applySurcharge(oldTax, oldTaxable, SURCHARGE_OLD);
  const oldCess = Math.round((oldTax + oldSurcharge) * HEALTH_EDUCATION_CESS);
  const oldTotal = oldTax + oldSurcharge + oldCess;

  // ── NEW REGIME ────────────────────────────────────────────────
  const newDeductions = STANDARD_DEDUCTION_NEW; // only standard deduction allowed
  const newTaxable = Math.max(0, gross - newDeductions);

  let newTax = applySlabs(newTaxable, NEW_REGIME_SLABS);
  if (newTaxable <= REBATE_87A_NEW_THRESHOLD) {
    newTax = Math.max(0, newTax - REBATE_87A_NEW_MAX);
  }
  const newSurcharge = applySurcharge(newTax, newTaxable, SURCHARGE_NEW);
  const newCess = Math.round((newTax + newSurcharge) * HEALTH_EDUCATION_CESS);
  const newTotal = newTax + newSurcharge + newCess;

  // ── COMPARISON ────────────────────────────────────────────────
  const savingsInr = Math.abs(oldTotal - newTotal);
  const optimalRegime: 'old' | 'new' = newTotal <= oldTotal ? 'new' : 'old';

  let rationale: string;
  if (savingsInr === 0) {
    rationale = `Both regimes produce identical tax of approx ${formatIndianRs(oldTotal)}. Choose either; New regime is administratively simpler.`;
  } else if (optimalRegime === 'new') {
    rationale = `New regime saves approx ${formatIndianRs(savingsInr)} vs Old regime. New regime is better at this income because the lower slab rates + higher standard deduction (Rs 75K vs Rs 50K) outweigh the value of Rs ${formatIndianRsCompact(oldDeductions - STANDARD_DEDUCTION_OLD)} in Old-regime deductions.`;
  } else {
    rationale = `Old regime saves approx ${formatIndianRs(savingsInr)} vs New regime. The Rs ${formatIndianRsCompact(oldDeductions - STANDARD_DEDUCTION_OLD)} in deductions (80C + 80D + home loan + HRA + others) is worth more than the New regime's lower slab rates at this income.`;
  }

  return {
    oldRegime: {
      taxableIncomeInr: oldTaxable,
      deductionsClaimedInr: oldDeductions,
      incomeTaxInr: oldTax,
      surchargeInr: oldSurcharge,
      cessInr: oldCess,
      totalTaxInr: oldTotal,
    },
    newRegime: {
      taxableIncomeInr: newTaxable,
      deductionsClaimedInr: newDeductions,
      incomeTaxInr: newTax,
      surchargeInr: newSurcharge,
      cessInr: newCess,
      totalTaxInr: newTotal,
    },
    optimalRegime,
    savingsInr,
    rationale,
  };
}

// ─────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────

function formatIndianRs(inr: number): string {
  if (inr >= 10_000_000) return `Rs. ${(inr / 10_000_000).toFixed(2)} Cr`;
  if (inr >= 100_000)    return `Rs. ${(inr / 100_000).toFixed(2)} L`;
  if (inr >= 1_000)      return `Rs. ${(inr / 1_000).toFixed(1)} K`;
  return `Rs. ${inr}`;
}

function formatIndianRsCompact(inr: number): string {
  if (inr >= 100_000) return `${(inr / 100_000).toFixed(1)} L`;
  if (inr >= 1_000)   return `${(inr / 1_000).toFixed(0)} K`;
  return String(inr);
}
