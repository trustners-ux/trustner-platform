import type { SalaryStructure } from "@/types/employee";

export interface EarningsBreakdown {
  basic: number;
  hra: number;
  dearness_allowance: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  gross: number;
}

export interface DeductionsBreakdown {
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  tds: number;
  lwf_employee: number;
  total: number;
}

/** Calculate LOP days from attendance */
export function calculateLOP(
  daysAbsent: number,
  daysHalfDay: number
): number {
  return daysAbsent + daysHalfDay * 0.5;
}

/** Adjust a monthly component for LOP */
export function adjustForLOP(
  monthlyAmount: number,
  totalWorkingDays: number,
  lopDays: number
): number {
  if (totalWorkingDays <= 0) return 0;
  const effectiveDays = totalWorkingDays - lopDays;
  return Math.round((monthlyAmount * effectiveDays) / totalWorkingDays);
}

/** Calculate earnings adjusted for LOP */
export function calculateGrossEarnings(
  structure: SalaryStructure,
  totalWorkingDays: number,
  lopDays: number
): EarningsBreakdown {
  const basic = adjustForLOP(structure.basic, totalWorkingDays, lopDays);
  const hra = adjustForLOP(structure.hra, totalWorkingDays, lopDays);
  const da = adjustForLOP(
    structure.dearness_allowance,
    totalWorkingDays,
    lopDays
  );
  const conv = adjustForLOP(structure.conveyance, totalWorkingDays, lopDays);
  const med = adjustForLOP(
    structure.medical_allowance,
    totalWorkingDays,
    lopDays
  );
  const special = adjustForLOP(
    structure.special_allowance,
    totalWorkingDays,
    lopDays
  );

  return {
    basic,
    hra,
    dearness_allowance: da,
    conveyance: conv,
    medical_allowance: med,
    special_allowance: special,
    gross: basic + hra + da + conv + med + special,
  };
}

/** Calculate deductions — PF recalculated on adjusted basic, others from structure */
export function calculateDeductions(
  structure: SalaryStructure,
  adjustedBasic: number,
  grossEarnings: number
): DeductionsBreakdown {
  // PF: 12% of basic capped at 15000 base (max 1800/month)
  const pfBase = Math.min(adjustedBasic, 15000);
  const pf_employee = Math.round(pfBase * 0.12);
  const pf_employer = Math.round(pfBase * 0.12);

  // ESI: applicable only if gross <= 21000
  let esi_employee = 0;
  let esi_employer = 0;
  if (grossEarnings <= 21000) {
    esi_employee = Math.round(grossEarnings * 0.0075);
    esi_employer = Math.round(grossEarnings * 0.0325);
  }

  const professional_tax = structure.professional_tax;
  const tds = structure.tds_monthly;
  const lwf_employee = structure.lwf_employee;

  const total =
    pf_employee + esi_employee + professional_tax + tds + lwf_employee;

  return {
    pf_employee,
    pf_employer,
    esi_employee,
    esi_employer,
    professional_tax,
    tds,
    lwf_employee,
    total,
  };
}

/** Auto-calculate standard Indian salary structure from CTC */
export function autoCalculateStructure(ctcAnnual: number): {
  basic: number;
  hra: number;
  dearness_allowance: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  tds_monthly: number;
  lwf_employee: number;
  lwf_employer: number;
} {
  const monthly = Math.round(ctcAnnual / 12);

  // Basic = 40% of CTC monthly
  const basic = Math.round(monthly * 0.4);

  // HRA = 50% of Basic
  const hra = Math.round(basic * 0.5);

  // PF: 12% of basic, capped at 15000 base
  const pfBase = Math.min(basic, 15000);
  const pf_employee = Math.round(pfBase * 0.12);
  const pf_employer = Math.round(pfBase * 0.12);

  // Conveyance = 1600/month standard
  const conveyance = 1600;

  // Medical = 1250/month standard
  const medical_allowance = 1250;

  // DA = 0 for private sector typically
  const dearness_allowance = 0;

  // Professional Tax = 200/month (most states)
  const professional_tax = 200;

  // ESI: check if gross <= 21000
  const grossEstimate = basic + hra + conveyance + medical_allowance;
  let esi_employee = 0;
  let esi_employer = 0;
  if (grossEstimate <= 21000) {
    esi_employee = Math.round(grossEstimate * 0.0075);
    esi_employer = Math.round(grossEstimate * 0.0325);
  }

  // LWF = nominal
  const lwf_employee = 0;
  const lwf_employer = 0;

  // TDS = 0 initially (needs manual input based on tax regime)
  const tds_monthly = 0;

  // Special Allowance = remainder
  const special_allowance =
    monthly -
    basic -
    hra -
    dearness_allowance -
    conveyance -
    medical_allowance -
    pf_employer;

  return {
    basic,
    hra,
    dearness_allowance,
    conveyance,
    medical_allowance,
    special_allowance: Math.max(0, special_allowance),
    pf_employee,
    pf_employer,
    esi_employee,
    esi_employer,
    professional_tax,
    tds_monthly,
    lwf_employee,
    lwf_employer,
  };
}
