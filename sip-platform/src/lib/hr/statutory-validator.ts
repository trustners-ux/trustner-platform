/**
 * Trustner HRMS — Statutory Compliance Validator
 * ────────────────────────────────────────────────────────────────────────────
 * Checks every salary structure / offer letter against Indian labour law
 * before it can be published. Single source of truth used by:
 *   - /employee/hr/salary-structure-preview (interactive designer)
 *   - Offer Letter generator (blocks publish if errors)
 *   - Payroll engine (sanity check before monthly run)
 *   - Employee Master (on Basic/HRA/CTC edit)
 *
 * Coverage:
 *   1. Minimum Wages Act, 1948 — state schedule
 *   2. Code on Wages, 2019 — "50% rule" (Sec 7)
 *   3. EPF & MP Act, 1952 — Form 11 conditions (Para 26A)
 *   4. ESI Act, 1948 — ₹21k wage ceiling (Sec 2(9))
 *   5. Payment of Bonus Act, 1965 — Sec 10 & 12
 *   6. Payment of Gratuity Act, 1972 + Code on Social Security, 2020
 *   7. Income Tax Act, 1961 — Sec 10(13A) HRA exemption
 *   8. Finance Act 2018 — Conveyance allowance withdrawal
 *   9. Constitution Article 276(2) — PT cap ₹2,500/yr
 *  10. Code on Wages — judicial reading on sustained variable
 *  11. IT Act Sec 192 vs 194J — intern stipend classification
 */

export type StateCode =
  | 'Assam' | 'Tripura' | 'Meghalaya' | 'Nagaland' | 'Manipur' | 'Mizoram' | 'Arunachal' | 'Sikkim'
  | 'WB' | 'Bihar' | 'Jharkhand' | 'Odisha'
  | 'Delhi' | 'UP' | 'Haryana' | 'Punjab' | 'Rajasthan' | 'Uttarakhand' | 'HP' | 'JK'
  | 'MH' | 'Gujarat' | 'Goa' | 'MP' | 'Chhattisgarh'
  | 'KA' | 'TN' | 'Kerala' | 'AP' | 'Telangana' | 'Puducherry';

export type PfMode = 'standard' | 'fixed_1800' | 'opted_out';
export type EmploymentType = 'permanent' | 'fixed_term' | 'intern' | 'consultant';
export type Track = 'permanent' | 'sales';

export interface SalaryStructure {
  /** Track defines whether at-risk components apply */
  track: Track;
  /** State of employment (for MW + PT) */
  state: StateCode;
  /** PF election */
  pfMode: PfMode;
  /** Employment classification */
  employmentType: EmploymentType;
  /** Monthly components */
  basic: number;
  hra: number;
  conveyance: number;
  otherAllowance: number;
  /** Statutory bonus (Payment of Bonus Act 1965) carved INTO CTC as monthly accrual.
   *  Set to 0 if Trustner pays statutory bonus separately on top of CTC. */
  statutoryBonus: number;
  /** Sales-only at-risk pool (paid only on hit, NOT in monthly net) */
  variable: number;
  perfBonus: number;
  travel: number;
  /** Computed monthly Gross = basic + hra + conveyance + otherAllowance (fixed portion only) */
  gross: number;
  /** Employer side */
  employerEpf: number;
  gratuity: number;
  esicEr: number;
  medical: number;
  /** Statutory deductions */
  employeeEpf: number;
  pt: number;
  esicEe: number;
  net: number;
  /** Target CTC monthly */
  ctc: number;
  /** Derived flags */
  isEsic: boolean;
}

export interface ComplianceFinding {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  citation: string;
}

export interface ComplianceResult {
  errors: ComplianceFinding[];
  warnings: ComplianceFinding[];
  canPublish: boolean;
}

/**
 * State minimum wages — SKILLED category, monthly, in INR.
 * Source: each state's Labour Department schedule (latest revision known
 * as of 2026-06). HR must re-verify against current state notification
 * before publishing.
 */
export const MIN_WAGES_SKILLED_MONTHLY: Record<StateCode, number> = {
  // North-East
  Assam:       11648,
  Tripura:     10010,
  Meghalaya:   11280,
  Nagaland:    10920,
  Manipur:     10870,
  Mizoram:     11700,
  Arunachal:   10920,
  Sikkim:      12350,
  // East
  WB:          10335,
  Bihar:       11440,
  Jharkhand:   11960,
  Odisha:      11050,
  // North
  Delhi:       18066,
  UP:          10500,
  Haryana:     12090,
  Punjab:      11270,
  Rajasthan:   10530,
  Uttarakhand: 11700,
  HP:          10920,
  JK:          11700,
  // West
  MH:          13500,
  Gujarat:     11700,
  Goa:         13520,
  MP:          11050,
  Chhattisgarh:11375,
  // South
  KA:          14500,
  TN:          12000,
  Kerala:      14040,
  AP:          12740,
  Telangana:   13260,
  Puducherry:  10920,
};

/**
 * Sec 10(13A) of IT Act defines four "metros" for the 50% HRA cap:
 * Delhi, Mumbai (MH), Kolkata (WB), Chennai (TN). All others = 40%.
 * Bangalore/KA is NOT a metro for this provision.
 */
const METRO_STATES: StateCode[] = ['Delhi', 'MH', 'WB', 'TN'];

/**
 * Professional Tax monthly amount, per state slab.
 * Returns 0 for states that don't levy PT.
 */
export function ptMonthly(state: StateCode, gross: number): number {
  switch (state) {
    case 'Assam':     return gross <= 10000 ? 0 : gross <= 15000 ? 150 : gross <= 25000 ? 180 : 208;
    case 'WB':        return gross <= 10000 ? 0 : gross <= 15000 ? 110 : gross <= 25000 ? 130 : gross <= 40000 ? 150 : 200;
    case 'MH':        return gross <= 7500 ? 0 : gross <= 10000 ? 175 : 200;
    case 'KA':        return gross <= 25000 ? 0 : 200;
    case 'TN':        return gross <= 21000 ? 0 : gross <= 30000 ? 135 : gross <= 45000 ? 315 : gross <= 60000 ? 690 : gross <= 75000 ? 1025 : 1250;
    case 'Telangana': return gross <= 15000 ? 0 : gross <= 20000 ? 150 : 200;
    case 'AP':        return gross <= 15000 ? 0 : gross <= 20000 ? 150 : 200;
    case 'Kerala':    return gross <= 11999 ? 0 : gross <= 17999 ? 120 : gross <= 23999 ? 180 : gross <= 29999 ? 300 : gross <= 35999 ? 450 : gross <= 41999 ? 600 : gross <= 49999 ? 750 : gross <= 60000 ? 1000 : 1250;
    case 'Gujarat':   return gross <= 12000 ? 0 : 200;
    case 'Odisha':    return gross <= 13304 ? 0 : gross <= 25000 ? 125 : 200;
    case 'MP':        return gross <= 18750 ? 0 : gross <= 25000 ? 125 : gross <= 33333 ? 167 : 208;
    case 'Chhattisgarh': return gross <= 12500 ? 0 : gross <= 16666 ? 150 : gross <= 25000 ? 180 : 208;
    case 'Sikkim':    return gross <= 20000 ? 0 : gross <= 30000 ? 125 : gross <= 40000 ? 150 : 200;
    case 'Tripura':   return gross <= 7500 ? 0 : gross <= 15000 ? 151 : 208;
    case 'Meghalaya': return gross <= 4166 ? 0 : gross <= 8333 ? 25 : gross <= 12500 ? 42 : gross <= 16666 ? 63 : 208;
    case 'Nagaland':  return gross <= 4000 ? 0 : gross <= 5000 ? 35 : gross <= 7000 ? 75 : gross <= 9000 ? 110 : 208;
    case 'Manipur':   return gross <= 4250 ? 0 : 208;
    case 'Mizoram':   return gross <= 5000 ? 0 : gross <= 8000 ? 75 : gross <= 10000 ? 120 : gross <= 12000 ? 150 : 208;
    case 'Jharkhand': return gross <= 25000 ? 0 : gross <= 41666 ? 100 : gross <= 66666 ? 150 : gross <= 83333 ? 175 : 208;
    case 'Puducherry':return gross <= 16666 ? 0 : gross <= 33333 ? 17 : gross <= 50000 ? 42 : gross <= 66666 ? 83 : gross <= 83333 ? 167 : 208;
    // Bihar, Delhi, UP, Haryana, Punjab, Rajasthan, Uttarakhand, HP, JK, Arunachal, Goa — NO Professional Tax
    default: return 0;
  }
}

/**
 * EPF amount per the chosen mode.
 *   - 'standard'  : 12% of Basic capped at ₹15,000 → max ₹1,800
 *   - 'fixed_1800': locked at ₹1,800 regardless of Basic (Trustner default)
 *   - 'opted_out' : 0 (only legal under Form 11 conditions — see validator)
 */
export function pfFor(basic: number, mode: PfMode): number {
  if (mode === 'opted_out') return 0;
  if (mode === 'fixed_1800') return 1800;
  return Math.min(basic, 15000) * 0.12;
}

const fmtINR = (n: number) => Math.round(n).toLocaleString('en-IN');

/**
 * Run all statutory checks against a salary structure.
 * Returns errors (block publish) + warnings (review before signoff).
 */
export function validateStatutoryCompliance(s: SalaryStructure): ComplianceResult {
  const errors: ComplianceFinding[] = [];
  const warnings: ComplianceFinding[] = [];

  const E = (code: string, message: string, citation: string) =>
    errors.push({ code, severity: 'error', message, citation });
  const W = (code: string, message: string, citation: string) =>
    warnings.push({ code, severity: 'warning', message, citation });

  // ── 1. MINIMUM WAGES ACT, 1948 ─────────────────────────────────────────
  const mw = MIN_WAGES_SKILLED_MONTHLY[s.state] || 0;
  if (mw > 0 && s.basic < mw) {
    E('MW_BELOW_FLOOR',
      `Basic ₹${fmtINR(s.basic)} is below ${s.state} skilled minimum wage ₹${fmtINR(mw)}/mo. Cannot publish offer letter.`,
      'Minimum Wages Act, 1948 — State Schedule');
  } else if (mw > 0 && s.basic < mw * 1.10) {
    W('MW_NEAR_FLOOR',
      `Basic ₹${fmtINR(s.basic)} is within 10% of MW floor (₹${fmtINR(mw)}). Any future MW revision will breach.`,
      'Minimum Wages Act, 1948');
  }

  // ── 2. CODE ON WAGES, 2019 — Sec 7 "50% rule" ─────────────────────────
  // Tolerance: 0.5% buffer for float-point rounding (50.0% exact is compliant).
  const totalRemuneration = s.gross + s.variable + s.perfBonus + s.travel;
  const wagesPct = totalRemuneration > 0 ? s.basic / totalRemuneration : 0;
  if (wagesPct < 0.495) {
    W('COW_50_RULE',
      `Basic is ${(wagesPct * 100).toFixed(1)}% of total remuneration. Code on Wages requires ≥ 50%. PF/Gratuity may be recomputed by regulator on a higher notional base.`,
      'Code on Wages, 2019 — Sec 7 (definition of wages)');
  }

  // ── 3. EPF & MP ACT, 1952 ─────────────────────────────────────────────
  if (s.pfMode === 'opted_out' && s.basic <= 15000) {
    E('EPF_FORM11_INVALID',
      `Form 11 opt-out is only legal if Basic > ₹15,000. Current Basic ₹${fmtINR(s.basic)} ≤ ₹15k → PF mandatory.`,
      'EPF & MP Act, 1952 — Para 26A; Form 11');
  }
  if (s.pfMode === 'opted_out') {
    W('EPF_FORM11_HISTORY',
      `Form 11 opt-out also requires the employee never having been an EPF member at any prior employer. HR must collect signed Form 11 + UAN-history declaration.`,
      'EPF & MP Act, 1952 — Form 11');
  }

  // ── 4. EMPLOYEES' STATE INSURANCE ACT, 1948 ───────────────────────────
  if (s.gross <= 21000 && !s.isEsic) {
    E('ESI_BYPASS',
      `Fixed Gross ₹${fmtINR(s.gross)} ≤ ₹21k → ESI is statutorily mandatory. Cannot substitute with Mediclaim.`,
      'ESI Act, 1948 — Sec 2(9), Wage ceiling');
  }
  if (s.gross > 21000 && s.gross <= 22000) {
    W('ESI_AT_THRESHOLD',
      `Fixed Gross ₹${fmtINR(s.gross)} is just above the ₹21k ESI ceiling. Any LOP day or component shuffle could drop below → ESI re-applies for the contribution period.`,
      'ESI Act, 1948 — Sec 2(9)');
  }

  // ── 5. PAYMENT OF BONUS ACT, 1965 ─────────────────────────────────────
  // Only warn if Bonus Act applies (Basic ≤ ₹21k) AND no statutory bonus is
  // structurally carved into the CTC. If statutoryBonus > 0, the liability
  // is already provisioned — no warning.
  if (s.basic <= 21000 && s.statutoryBonus <= 0) {
    const bonusBase = Math.max(7000, mw || 7000);
    const minBonusAnnual = bonusBase * 12 * 0.0833;
    W('BONUS_ACT_UNFUNDED',
      `Basic ₹${fmtINR(s.basic)} ≤ ₹21k → Payment of Bonus Act applies, but no Statutory Bonus line is carved into CTC. Minimum statutory bonus ≈ ₹${fmtINR(minBonusAnnual)}/yr must be paid separately on top of CTC.`,
      'Payment of Bonus Act, 1965 — Sec 10 & 12');
  }

  // ── 6. PAYMENT OF GRATUITY ACT, 1972 + Code on Social Security, 2020 ──
  if (s.gratuity <= 0 && s.employmentType !== 'intern' && s.employmentType !== 'consultant') {
    E('GRATUITY_MISSING',
      `No gratuity accrual shown. Payable on permanent or fixed-term contracts under PoG Act + CoSS 2020. Standard accrual = 4.81% of Basic.`,
      'Payment of Gratuity Act, 1972; Code on Social Security, 2020');
  }

  // ── 7. INCOME TAX ACT, 1961 — Sec 10(13A) HRA exemption ───────────────
  const isMetro = METRO_STATES.includes(s.state);
  const hraCap = s.basic * (isMetro ? 0.50 : 0.40);
  // 2% buffer for rounding; trigger only when HRA materially exceeds the cap.
  if (s.hra > hraCap * 1.02 + 1) {
    W('IT_HRA_OVER_CAP',
      `HRA ₹${fmtINR(s.hra)} exceeds Sec 10(13A) tax-shield cap of ${isMetro ? '50%' : '40%'} of Basic (₹${fmtINR(hraCap)}). Excess HRA is fully taxable — relabel as Special Allowance for cleaner structure.`,
      'Income Tax Act, 1961 — Sec 10(13A) & Rule 2A');
  }

  // ── 8. FINANCE ACT 2018 — Conveyance allowance ────────────────────────
  // ₹1,600 was the historical exemption ceiling. Tolerate small rounding.
  if (s.conveyance > 1700) {
    W('IT_CONV_TAXABLE',
      `Conveyance ₹${fmtINR(s.conveyance)}/mo exceeds the historical ₹1,600 limit. The exemption was withdrawn (Finance Act 2018) — excess is just taxable Special Allowance in disguise. Relabel for clarity.`,
      'Income Tax Act, 1961 — Finance Act 2018');
  }

  // ── 9. CONSTITUTION ART. 276(2) — PT cap ──────────────────────────────
  if (s.pt * 12 > 2500) {
    E('PT_CONSTITUTIONAL_CAP',
      `Annual PT ₹${fmtINR(s.pt * 12)} exceeds Constitutional cap of ₹2,500/yr.`,
      'Constitution of India — Article 276(2)');
  }

  // ── 10. SALES AT-RISK ─────────────────────────────────────────────────
  if (s.track === 'sales') {
    const atRisk = s.variable + s.perfBonus + s.travel;
    const atRiskPct = s.ctc > 0 ? atRisk / s.ctc : 0;
    if (atRiskPct > 0.50) {
      W('SALES_AT_RISK_HIGH',
        `At-risk pool is ${(atRiskPct * 100).toFixed(0)}% of CTC. Regulators/labour courts may treat sustained variable as "wages" if consistently paid.`,
        'Code on Wages, 2019 — judicial interpretation');
    }
    if (s.hra === 0) {
      W('SALES_HRA_ZERO',
        `HRA = ₹0 → RM loses Sec 10(13A) tax shield entirely. Consider lowering Variable% to free room for HRA.`,
        'Income Tax Act, 1961 — Sec 10(13A)');
    }
  }

  // ── 11. INTERN STIPEND CLASSIFICATION ─────────────────────────────────
  if (s.employmentType === 'intern' && s.gross > 25000) {
    W('INTERN_STIPEND_TDS',
      `Intern stipend > ₹25k/mo. TDS u/s 192 applies if salaried; u/s 194J if consultancy. Tag engagement type clearly in offer letter.`,
      'Income Tax Act, 1961 — Sec 192 vs 194J');
  }

  return {
    errors,
    warnings,
    canPublish: errors.length === 0,
  };
}
