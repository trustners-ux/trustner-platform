/**
 * Full & Final settlement engine — pure functions, no DB.
 *
 * POLICY (Ram-signed-off May 31 2026):
 *   • Gratuity threshold for permanent employees: STRICT 5 years continuous
 *     service. No 4-years-240-days lenient rule.
 *   • Gratuity threshold for fixed-term contracts: 1 year pro-rata
 *     (Code on Social Security, 2020, Section 53).
 *   • Death / permanent disability: 0 years minimum.
 *   • Gratuity formula: (last_basic + da) × 15 / 26 × completed_years
 *   • Tax-free cap: ₹20,00,000 (Income Tax Act s.10(10)(ii))
 *   • Notice-shortfall recovery: gross_monthly ÷ 30 per shortfall day
 *     (calendar-day basis, employee-friendly vs working-day basis).
 *   • Bonus on F&F: NONE automatic. Only paid if explicit offer-letter
 *     clause; tracked manually via separation.bonus_amount.
 *   • EL encashment: YES, capped at 30-day carry-forward.
 *     Encash rate = (basic + da) × el_balance ÷ 26.
 *   • SL / CL encashment: NO.
 *
 * All amounts in INR. Internal math runs as `number`; the OUTPUT layer
 * rounds to 2 decimals via `round2()`.
 */

import type { SeparationStatus } from './separation-state';

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export type EmploymentType = 'permanent' | 'fixed_term' | 'intern' | 'consultant';

export type SeparationType =
  | 'resignation'
  | 'termination_with_cause'
  | 'termination_without_cause'
  | 'retirement'
  | 'death'
  | 'permanent_disability'
  | 'contract_end'
  | 'abandonment'
  | 'mutual_separation';

/** Last 3 salary slip snapshots used to derive last-drawn basic/da/gross. */
export interface SalarySlipSnapshot {
  pay_month: string;          // 'YYYY-MM'
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
}

export interface SalaryStructureSnapshot {
  basic_monthly: number;
  hra_monthly: number;
  special_allowance_monthly: number;
  variable_pay_monthly: number;
  pf_monthly: number;
  da_monthly?: number;        // Trustner has zero DA today, but the formula respects it
}

export interface LeaveBalanceSnapshot {
  leave_code: string;         // 'EL','SL','CL',...
  is_encashable: boolean;
  available_days: number;
  max_carry_forward: number;
}

export interface PendingRecovery {
  kind: 'loan' | 'asset' | 'advance' | 'other';
  amount: number;
  label?: string;
}

export interface PendingReimbursement {
  amount: number;
  category?: string;
}

export interface EmployeeSnapshot {
  id: number;
  employee_code: string;
  full_name: string;
  entity: 'TAS' | 'TIB';
  employment_type: EmploymentType;
  date_of_joining: string;          // ISO 'YYYY-MM-DD'
  notice_period_days_contractual: number;
}

export interface SeparationSnapshot {
  id: number;
  case_code: string;
  separation_type: SeparationType;
  status: SeparationStatus;
  lwd: string;                       // ISO 'YYYY-MM-DD'
  notice_period_days_contractual: number;
  notice_period_days_served: number;
  notice_period_days_waived: number;
  notice_period_days_shortfall?: number; // computed by DB; engine recomputes if absent
  bonus_clause_present: boolean;
  bonus_amount: number;              // 0 unless explicit clause
}

export interface FnFInput {
  employee: EmployeeSnapshot;
  separation: SeparationSnapshot;
  last_3_slips: SalarySlipSnapshot[];        // most recent first; may be < 3 for new hires
  leave_balances: LeaveBalanceSnapshot[];
  salary_structure: SalaryStructureSnapshot;
  pending_recoveries: PendingRecovery[];
  pending_reimbursements: PendingReimbursement[];
  /** Optional override for partial-month attendance. */
  paid_days?: number;
  lop_days?: number;
  /** Optional TDS override (e.g. from payroll team’s annualized projection). */
  tds_override?: number;
}

export interface FnFEarnings {
  final_basic: number;
  final_hra: number;
  final_special: number;
  final_variable: number;
  bonus_prorate: number;
  el_encash_amount: number;
  el_balance_days: number;
  gratuity_amount: number;
  gratuity_taxable_excess: number;
  gratuity_applicable: boolean;
  gratuity_years: number;
  reimbursement_pending: number;
  gross_payable: number;
}

export interface FnFDeductions {
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  tds_deduction: number;
  loan_recovery: number;
  notice_shortfall_recovery: number;
  asset_recovery: number;
  other_recovery: number;
  total_deductions: number;
}

export interface FnFOutput {
  /** Snapshot reflecting hr_fnf row shape, ready to upsert. */
  separation_id: number;
  employee_id: number;
  doj: string;
  lwd: string;
  fnf_month: string;
  paid_days: number;
  lop_days: number;
  // Earnings
  final_basic: number;
  final_hra: number;
  final_special: number;
  final_variable: number;
  bonus_prorate: number;
  el_balance_days: number;
  el_encash_amount: number;
  gratuity_applicable: boolean;
  gratuity_years: number;
  gratuity_amount: number;
  gratuity_taxable_excess: number;
  reimbursement_pending: number;
  // Deductions
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  tds_deduction: number;
  loan_recovery: number;
  notice_shortfall_recovery: number;
  asset_recovery: number;
  other_recovery: number;
  // Totals
  gross_payable: number;
  net_payable: number;
  // Convenience
  payable_by_date: string;            // lwd + 45 days
  // Audit
  input_snapshot: FnFInput;
  // Detailed breakups for the PDF generator
  breakup: {
    earnings: FnFEarnings;
    deductions: FnFDeductions;
  };
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const GRATUITY_TAX_FREE_CAP = 2_000_000; // ₹20,00,000

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function nonNeg(n: number): number {
  return n < 0 ? 0 : n;
}

function parseISO(s: string): Date {
  // Force midnight UTC to avoid TZ skew in day diffs.
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function daysBetween(a: string, b: string): number {
  const da = parseISO(a).getTime();
  const db = parseISO(b).getTime();
  return Math.floor((db - da) / (1000 * 60 * 60 * 24));
}

function addDaysISO(s: string, days: number): string {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function tenureYears(doj: string, lwd: string): number {
  const days = Math.max(0, daysBetween(doj, lwd));
  return days / 365.25;
}

/** Completed years used in gratuity formula. Per Payment of Gratuity Act:
 *  - "completed year of service" is any year ≥ 6 months in the final partial
 *    year (only AFTER threshold is met). Below threshold = 0.
 *
 *  But because Ram has explicitly locked the STRICT 5-yr threshold for
 *  permanents (no 4yr+240d lenient rule), the rounding rule only matters
 *  for the partial year AFTER year 5. We still apply the "≥ 6 months
 *  rounds up" rule for the final partial year, which is the standard
 *  Payment of Gratuity Act, 1972 reading.
 */
function completedYearsForGratuity(yearsExact: number): number {
  const wholeYears = Math.floor(yearsExact);
  const fractional = yearsExact - wholeYears;
  // ≥ 6 months in the final year → round up by 1
  return fractional >= 0.5 ? wholeYears + 1 : wholeYears;
}

function lastBasicPlusDa(structure: SalaryStructureSnapshot): number {
  return (structure.basic_monthly ?? 0) + (structure.da_monthly ?? 0);
}

function monthLabelFromIso(iso: string): string {
  return iso.slice(0, 7); // 'YYYY-MM'
}

// ──────────────────────────────────────────────────────────────────────
// Core sub-engines
// ──────────────────────────────────────────────────────────────────────

export interface GratuityInput {
  employmentType: EmploymentType;
  tenureYears: number;
  lastBasicPlusDa: number;
  separationType: SeparationType;
}

export interface GratuityOutput {
  applicable: boolean;
  completedYears: number;
  amount: number;
  taxableExcess: number;
}

/**
 * Gratuity calculator with locked threshold policy.
 *
 *   Permanent:        5 yrs strict
 *   Fixed-term:       1 yr pro-rata (Code on Social Security 2020 s.53)
 *   Death / PD:       0 yrs minimum
 *   Intern / consultant: not eligible
 */
export function computeGratuity(input: GratuityInput): GratuityOutput {
  const { employmentType, tenureYears: ty, lastBasicPlusDa: base, separationType } = input;

  // Death or permanent disability → always eligible, 0-yr threshold.
  const deathOrDisability =
    separationType === 'death' || separationType === 'permanent_disability';

  let threshold: number;
  if (deathOrDisability) {
    threshold = 0;
  } else if (employmentType === 'permanent') {
    threshold = 5;
  } else if (employmentType === 'fixed_term') {
    threshold = 1; // Code on Social Security 2020 s.53 pro-rata
  } else {
    // intern / consultant — not eligible regardless of tenure
    return { applicable: false, completedYears: 0, amount: 0, taxableExcess: 0 };
  }

  if (ty < threshold) {
    return { applicable: false, completedYears: 0, amount: 0, taxableExcess: 0 };
  }

  // Years used in the formula. Fixed-term: use exact pro-rata fractional years
  // (per s.53 reading). Others (permanent, death/PD): use Payment of Gratuity
  // Act rounding (≥ 6 months rounds up).
  const yearsForFormula =
    employmentType === 'fixed_term' ? ty : completedYearsForGratuity(ty);

  const amount = (base * 15 * yearsForFormula) / 26;
  const taxableExcess = Math.max(0, amount - GRATUITY_TAX_FREE_CAP);

  return {
    applicable: true,
    completedYears: yearsForFormula,
    amount: round2(amount),
    taxableExcess: round2(taxableExcess),
  };
}

export interface NoticeShortfallInput {
  noticePeriodDays: number;
  noticeServedDays: number;
  grossMonthly: number;
  waived: number;             // days waived by employer
}

/**
 * Notice shortfall recovery — gross/30 per shortfall day (calendar basis).
 */
export function computeNoticeShortfallRecovery(input: NoticeShortfallInput): number {
  const shortfall = Math.max(
    0,
    (input.noticePeriodDays ?? 0) - (input.noticeServedDays ?? 0) - (input.waived ?? 0)
  );
  if (shortfall === 0 || input.grossMonthly <= 0) return 0;
  return round2((input.grossMonthly / 30) * shortfall);
}

export interface ElEncashInput {
  elBalanceDays: number;
  basicPlusDa: number;
  capDays?: number;                  // default 30
}

export interface ElEncashOutput {
  encashable_days: number;
  amount: number;
}

/**
 * EL encashment. Rate = (basic + da) × days ÷ 26.
 * Capped at capDays (default 30 per handbook v3).
 */
export function computeElEncashment(input: ElEncashInput): ElEncashOutput {
  const cap = input.capDays ?? 30;
  const days = Math.max(0, Math.min(input.elBalanceDays ?? 0, cap));
  if (days === 0 || input.basicPlusDa <= 0) {
    return { encashable_days: 0, amount: 0 };
  }
  const amount = (input.basicPlusDa * days) / 26;
  return { encashable_days: round2(days), amount: round2(amount) };
}

export interface ProratedSalaryInput {
  doj: string;
  lwd: string;
  grossMonthly: number;
  basic: number;
  hra: number;
  special: number;
  variable?: number;
  lopDays?: number;
}

export interface ProratedSalaryOutput {
  paid_days: number;
  final_basic: number;
  final_hra: number;
  final_special: number;
  final_variable: number;
}

/**
 * Prorate the final partial month's salary based on paid days in the LWD
 * month. Trustner uses calendar-day basis (e.g. 31 days in March).
 *
 * paid_days = days-from-1st-of-month-up-to-and-including-LWD − lopDays
 */
export function computeProratedSalary(input: ProratedSalaryInput): ProratedSalaryOutput {
  const lwd = parseISO(input.lwd);
  const monthDays = new Date(Date.UTC(lwd.getUTCFullYear(), lwd.getUTCMonth() + 1, 0)).getUTCDate();
  const workedThroughDay = lwd.getUTCDate();

  // If DOJ falls inside the same month (very short tenure), prorate from DOJ.
  const doj = parseISO(input.doj);
  let startDay = 1;
  if (doj.getUTCFullYear() === lwd.getUTCFullYear() && doj.getUTCMonth() === lwd.getUTCMonth()) {
    startDay = doj.getUTCDate();
  }

  const rawWorked = workedThroughDay - startDay + 1;
  const lop = input.lopDays ?? 0;
  const paid_days = Math.max(0, rawWorked - lop);

  const ratio = monthDays > 0 ? paid_days / monthDays : 0;

  return {
    paid_days: round2(paid_days),
    final_basic:    round2((input.basic   ?? 0) * ratio),
    final_hra:      round2((input.hra     ?? 0) * ratio),
    final_special:  round2((input.special ?? 0) * ratio),
    final_variable: round2((input.variable ?? 0) * ratio),
  };
}

// ──────────────────────────────────────────────────────────────────────
// Main compute
// ──────────────────────────────────────────────────────────────────────

export function computeFnF(input: FnFInput): FnFOutput {
  const { employee, separation, last_3_slips, leave_balances, salary_structure } = input;

  // 1. Tenure
  const ty = tenureYears(employee.date_of_joining, separation.lwd);
  const basicPlusDa = lastBasicPlusDa(salary_structure);
  const grossMonthly =
    (salary_structure.basic_monthly ?? 0) +
    (salary_structure.hra_monthly ?? 0) +
    (salary_structure.special_allowance_monthly ?? 0) +
    (salary_structure.variable_pay_monthly ?? 0);

  // 2. Final partial-month earnings
  const prorated = computeProratedSalary({
    doj: employee.date_of_joining,
    lwd: separation.lwd,
    grossMonthly,
    basic:   salary_structure.basic_monthly,
    hra:     salary_structure.hra_monthly,
    special: salary_structure.special_allowance_monthly,
    variable: salary_structure.variable_pay_monthly,
    lopDays: input.lop_days ?? 0,
  });

  const paid_days = input.paid_days ?? prorated.paid_days;
  const lop_days = input.lop_days ?? 0;

  // 3. Gratuity
  const gratuity = computeGratuity({
    employmentType: employee.employment_type,
    tenureYears: ty,
    lastBasicPlusDa: basicPlusDa,
    separationType: separation.separation_type,
  });

  // 4. EL encashment
  const elRow = leave_balances.find(
    l => l.leave_code === 'EL' && l.is_encashable
  );
  const elBalance = elRow?.available_days ?? 0;
  const elCap = elRow?.max_carry_forward ?? 30;
  const el = computeElEncashment({
    elBalanceDays: elBalance,
    basicPlusDa,
    capDays: elCap,
  });

  // 5. Bonus on F&F — ONLY if explicit clause flag set
  const bonusProrate = separation.bonus_clause_present
    ? round2(separation.bonus_amount ?? 0)
    : 0;

  // 6. Reimbursements pending
  const reimbursementPending = round2(
    input.pending_reimbursements.reduce((s, r) => s + (r.amount ?? 0), 0)
  );

  // 7. Notice shortfall recovery
  const noticeShortfall = computeNoticeShortfallRecovery({
    noticePeriodDays: separation.notice_period_days_contractual,
    noticeServedDays: separation.notice_period_days_served,
    grossMonthly,
    waived: separation.notice_period_days_waived ?? 0,
  });

  // 8. Statutory deductions on the partial month
  const lastSlip = last_3_slips[0];
  const pf = round2(lastSlip ? lastSlip.pf_employee * (paid_days / 30) : 0);
  const esi = round2(lastSlip ? lastSlip.esi_employee * (paid_days / 30) : 0);
  const pt = round2(lastSlip ? lastSlip.professional_tax : 0); // PT is flat-monthly per state
  const tds = input.tds_override !== undefined
    ? round2(input.tds_override)
    : round2(lastSlip ? lastSlip.tds * (paid_days / 30) : 0);

  // 9. Recoveries
  const loanRecovery = round2(
    input.pending_recoveries
      .filter(r => r.kind === 'loan' || r.kind === 'advance')
      .reduce((s, r) => s + (r.amount ?? 0), 0)
  );
  const assetRecovery = round2(
    input.pending_recoveries
      .filter(r => r.kind === 'asset')
      .reduce((s, r) => s + (r.amount ?? 0), 0)
  );
  const otherRecovery = round2(
    input.pending_recoveries
      .filter(r => r.kind === 'other')
      .reduce((s, r) => s + (r.amount ?? 0), 0)
  );

  // 10. Roll up earnings
  const grossPayable = round2(
    prorated.final_basic +
    prorated.final_hra +
    prorated.final_special +
    prorated.final_variable +
    bonusProrate +
    el.amount +
    gratuity.amount +
    reimbursementPending
  );

  const totalDeductions = round2(
    pf + esi + pt + tds + loanRecovery + noticeShortfall + assetRecovery + otherRecovery
  );

  const netPayable = nonNeg(round2(grossPayable - totalDeductions));

  const earnings: FnFEarnings = {
    final_basic: prorated.final_basic,
    final_hra: prorated.final_hra,
    final_special: prorated.final_special,
    final_variable: prorated.final_variable,
    bonus_prorate: bonusProrate,
    el_encash_amount: el.amount,
    el_balance_days: el.encashable_days,
    gratuity_amount: gratuity.amount,
    gratuity_taxable_excess: gratuity.taxableExcess,
    gratuity_applicable: gratuity.applicable,
    gratuity_years: gratuity.completedYears,
    reimbursement_pending: reimbursementPending,
    gross_payable: grossPayable,
  };

  const deductions: FnFDeductions = {
    pf_deduction: pf,
    esi_deduction: esi,
    pt_deduction: pt,
    tds_deduction: tds,
    loan_recovery: loanRecovery,
    notice_shortfall_recovery: noticeShortfall,
    asset_recovery: assetRecovery,
    other_recovery: otherRecovery,
    total_deductions: totalDeductions,
  };

  return {
    separation_id: separation.id,
    employee_id: employee.id,
    doj: employee.date_of_joining,
    lwd: separation.lwd,
    fnf_month: monthLabelFromIso(separation.lwd),
    paid_days,
    lop_days,
    final_basic: earnings.final_basic,
    final_hra: earnings.final_hra,
    final_special: earnings.final_special,
    final_variable: earnings.final_variable,
    bonus_prorate: earnings.bonus_prorate,
    el_balance_days: earnings.el_balance_days,
    el_encash_amount: earnings.el_encash_amount,
    gratuity_applicable: earnings.gratuity_applicable,
    gratuity_years: earnings.gratuity_years,
    gratuity_amount: earnings.gratuity_amount,
    gratuity_taxable_excess: earnings.gratuity_taxable_excess,
    reimbursement_pending: earnings.reimbursement_pending,
    pf_deduction: deductions.pf_deduction,
    esi_deduction: deductions.esi_deduction,
    pt_deduction: deductions.pt_deduction,
    tds_deduction: deductions.tds_deduction,
    loan_recovery: deductions.loan_recovery,
    notice_shortfall_recovery: deductions.notice_shortfall_recovery,
    asset_recovery: deductions.asset_recovery,
    other_recovery: deductions.other_recovery,
    gross_payable: grossPayable,
    net_payable: netPayable,
    payable_by_date: addDaysISO(separation.lwd, 45),
    input_snapshot: input,
    breakup: { earnings, deductions },
  };
}
