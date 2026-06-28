/**
 * Trustner Payroll Engine — Phase 5 MVP.
 *
 * ASSUMPTIONS (defaults; override per company policy when ready):
 *   - PF:  12% of (basic + special, capped at ₹15,000) employee + 12% employer
 *   - ESI: 0.75% employee + 3.25% employer, only if gross ≤ ₹21,000
 *   - PT:  Assam slabs — ₹0 if ≤ ₹10K gross/mo; ₹150 if 10–15K; ₹208 if > 15K
 *          (Karnataka/Telangana/WB slabs add ~₹200 — implement per-state later)
 *   - TDS: NEW REGIME default (FY2026 slabs)
 *          0–₹3 L: 0%   ₹3–7 L: 5%   ₹7–10 L: 10%   ₹10–12 L: 15%
 *          ₹12–15 L: 20%   > ₹15 L: 30%   Section 87A rebate up to ₹7 L = nil tax
 *          Annual tax /12 = monthly TDS.
 *   - Working days assumed 22 days/month. lop_days deducted pro-rata.
 *
 * The output is per-employee slip line items + totals.
 */

export interface PayrollInput {
  basic_monthly: number;
  hra_monthly: number;
  special_allowance_monthly: number;
  pf_monthly: number;          // employer's PF, displayed but not deducted from gross
  variable_pay_monthly: number;
  paid_days?: number;
  lop_days?: number;
  state?: string;              // Assam / Karnataka / etc. — for PT
  regime?: 'old' | 'new';      // default 'new'
  // Old-regime declarations (used only if regime='old')
  hra_exemption_monthly?: number;
  section_80c_annual?: number;
  section_80d_annual?: number;
  standard_deduction_annual?: number;
}

export interface PayrollOutput {
  basic: number;
  hra: number;
  special_allowance: number;
  variable_pay: number;
  other_earnings: number;
  gross: number;
  pf_employee: number;
  esi_employee: number;
  professional_tax: number;
  tds: number;
  loan_recovery: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  paid_days: number;
  lop_days: number;
}

const PF_RATE = 0.12;
const PF_CAP = 15_000; // basic+special cap for PF
const ESI_EMPLOYEE_RATE = 0.0075;
const ESI_THRESHOLD = 21_000;
const STANDARD_DAYS = 22;

/**
 * Per-state Professional Tax slabs.
 * Source: each state's Commercial Taxes Department schedule, FY2026.
 *
 * - Assam:     0 (≤10K) · 150 (10–15K) · 208 (>15K)  [Trustner HO + Tezpur]
 * - Karnataka: 0 (≤15K) · 200 (>15K) — flat slab     [Bangalore office]
 * - West Bengal: 0 (≤10K) · 110 (10–15K) · 130 (15–25K)
 *                · 150 (25–40K) · 200 (>40K)         [Kolkata office]
 * - Telangana: 0 (≤15K) · 150 (15–20K) · 200 (>20K)  [Hyderabad office]
 * - Maharashtra/Delhi/Tamil Nadu: not used by Trustner today;
 *   default fallback = no PT (most states without PT scheme).
 *
 * March one-off PT (Maharashtra) NOT implemented — Trustner has no MH office.
 */
function professionalTax(grossMonthly: number, state?: string): number {
  const s = (state || '').toLowerCase().trim();
  if (s === 'assam') {
    if (grossMonthly <= 10_000) return 0;
    if (grossMonthly <= 15_000) return 150;
    return 208;
  }
  if (s === 'karnataka') {
    if (grossMonthly <= 15_000) return 0;
    return 200;
  }
  if (s === 'west bengal' || s === 'wb') {
    if (grossMonthly <= 10_000) return 0;
    if (grossMonthly <= 15_000) return 110;
    if (grossMonthly <= 25_000) return 130;
    if (grossMonthly <= 40_000) return 150;
    return 200;
  }
  if (s === 'telangana') {
    if (grossMonthly <= 15_000) return 0;
    if (grossMonthly <= 20_000) return 150;
    return 200;
  }
  // States without a configured PT scheme (or unknown state) → 0
  // Safer to under-deduct than over-deduct; admin can review the run.
  return 0;
}

/** New-regime FY2026 slabs */
function tdsAnnualNewRegime(annualGross: number): number {
  // Standard deduction ₹50K → taxable
  const taxable = Math.max(0, annualGross - 50_000);
  if (taxable <= 700_000) return 0; // Section 87A
  let tax = 0;
  const slabs: Array<[number, number]> = [
    [300_000, 0],
    [700_000, 0.05],
    [1_000_000, 0.10],
    [1_200_000, 0.15],
    [1_500_000, 0.20],
    [Infinity, 0.30],
  ];
  let prev = 0;
  for (const [cap, rate] of slabs) {
    const inSlab = Math.min(taxable, cap) - prev;
    if (inSlab > 0) tax += inSlab * rate;
    if (taxable <= cap) break;
    prev = cap;
  }
  // 4% health & education cess
  return tax * 1.04;
}

function tdsAnnualOldRegime(
  annualGross: number,
  hraExemption: number,
  sec80c: number,
  sec80d: number,
  standardDeduction: number
): number {
  const taxable = Math.max(0,
    annualGross - hraExemption - sec80c - sec80d - standardDeduction
  );
  if (taxable <= 500_000) return 0; // 87A
  let tax = 0;
  const slabs: Array<[number, number]> = [
    [250_000, 0],
    [500_000, 0.05],
    [1_000_000, 0.20],
    [Infinity, 0.30],
  ];
  let prev = 0;
  for (const [cap, rate] of slabs) {
    const inSlab = Math.min(taxable, cap) - prev;
    if (inSlab > 0) tax += inSlab * rate;
    if (taxable <= cap) break;
    prev = cap;
  }
  return tax * 1.04;
}

export function computePayroll(input: PayrollInput): PayrollOutput {
  const paidDays = input.paid_days ?? STANDARD_DAYS;
  const lopDays = Math.max(0, input.lop_days ?? 0);
  const dayFactor = (paidDays - lopDays) / STANDARD_DAYS;

  const basic = Math.round(input.basic_monthly * dayFactor);
  const hra = Math.round(input.hra_monthly * dayFactor);
  const special = Math.round(input.special_allowance_monthly * dayFactor);
  const variable = Math.round(input.variable_pay_monthly * dayFactor);
  const gross = basic + hra + special + variable;

  // PF
  const pfBase = Math.min(basic + special, PF_CAP);
  const pfEmployee = Math.round(pfBase * PF_RATE);

  // ESI (only if monthly gross ≤ 21K)
  const esiEmployee = gross <= ESI_THRESHOLD ? Math.round(gross * ESI_EMPLOYEE_RATE) : 0;

  // PT
  const pt = professionalTax(gross, input.state);

  // TDS — annualized
  const annualGross = gross * 12;
  const regime = input.regime || 'new';
  const tdsAnnual = regime === 'new'
    ? tdsAnnualNewRegime(annualGross)
    : tdsAnnualOldRegime(
        annualGross,
        (input.hra_exemption_monthly || 0) * 12,
        input.section_80c_annual || 0,
        input.section_80d_annual || 0,
        input.standard_deduction_annual || 50_000
      );
  const tdsMonthly = Math.round(tdsAnnual / 12);

  const totalDeductions = pfEmployee + esiEmployee + pt + tdsMonthly;
  const netPay = gross - totalDeductions;

  return {
    basic, hra, special_allowance: special, variable_pay: variable, other_earnings: 0,
    gross,
    pf_employee: pfEmployee,
    esi_employee: esiEmployee,
    professional_tax: pt,
    tds: tdsMonthly,
    loan_recovery: 0,
    other_deductions: 0,
    total_deductions: totalDeductions,
    net_pay: netPay,
    paid_days: paidDays,
    lop_days: lopDays,
  };
}
