// Trustner Financial Planning — 5-Year Cashflow Projection Engine
// Comprehensive tier: year-by-year income, expenses, EMIs, premiums, SIPs, surplus

import type { FinancialPlanningData } from '@/types/financial-planning';
import type {
  CashflowProjection,
  CashflowProjectionYear,
  CashflowProjectionWarning,
  ComprehensiveProfile,
} from '@/types/financial-planning-v2';

// ---------------------------------------------------------------------------
// Inflation rates by category
// ---------------------------------------------------------------------------

const INCOME_GROWTH_RATES = {
  conservative: 0.06,
  moderate: 0.08,
  optimistic: 0.12,
} as const;

const GENERAL_INFLATION = 0.06;
const EDUCATION_INFLATION = 0.10;
const MEDICAL_INFLATION = 0.12;
const SIP_STEP_UP = 0.10;
const PREMIUM_INFLATION = 0.05;

/**
 * Generate a 5-year cashflow projection showing year-by-year:
 * - Gross income (with growth)
 * - Total expenses (with category-specific inflation)
 * - EMIs (reducing as loans end)
 * - Insurance premiums (with 5% annual increase)
 * - SIP commitments (with 10% step-up)
 * - Surplus (income - all outflows)
 * - Cumulative savings
 * - Warnings for negative surplus and other red flags
 */
export function calculate5YearCashflow(
  data: FinancialPlanningData,
  comprehensiveProfile?: ComprehensiveProfile
): CashflowProjection {
  const warnings: CashflowProjectionWarning[] = [];

  // Edge case: no income data — return empty projection
  const baseAnnualIncome =
    data.incomeProfile.monthlyInHandSalary * 12 +
    data.incomeProfile.annualBonus +
    data.incomeProfile.rentalIncome * 12 +
    data.incomeProfile.businessIncome * 12 +
    data.incomeProfile.otherIncome * 12;

  if (baseAnnualIncome <= 0) {
    warnings.push({
      year: new Date().getFullYear(),
      type: 'no-income',
      message: 'No income data provided. Cannot generate meaningful cashflow projection.',
    });
    return {
      years: [],
      assumptions: {
        incomeGrowthRate: INCOME_GROWTH_RATES.moderate,
        expenseInflationRate: GENERAL_INFLATION,
        educationInflationRate: EDUCATION_INFLATION,
        medicalInflationRate: MEDICAL_INFLATION,
        sipStepUpRate: SIP_STEP_UP,
        premiumInflationRate: PREMIUM_INFLATION,
      },
      warnings,
    };
  }

  const currentYear = new Date().getFullYear();
  const age = data.personalProfile.age || 30;

  // Growth rate from comprehensive profile or default moderate
  const scenario = comprehensiveProfile?.incomeGrowthScenario || 'moderate';
  const incomeGrowthRate = INCOME_GROWTH_RATES[scenario];

  // ---------------------------------------------------------------------------
  // Base annual expense calculation
  // ---------------------------------------------------------------------------
  // When comprehensive profile has detailed breakdown, use category-specific
  // inflation for education and medical; otherwise use general inflation for all.
  const breakdown = comprehensiveProfile?.monthlyExpenseBreakdown;

  let baseGeneralExpenses: number;
  let baseEducationExpenses: number;
  let baseMedicalExpenses: number;

  if (breakdown && (breakdown.education > 0 || breakdown.medical > 0)) {
    // Comprehensive mode: separate education & medical from general expenses
    baseEducationExpenses = breakdown.education * 12;
    baseMedicalExpenses = breakdown.medical * 12;
    baseGeneralExpenses =
      (breakdown.housing +
        breakdown.groceries +
        breakdown.utilities +
        breakdown.transport +
        breakdown.entertainment +
        breakdown.clothing +
        breakdown.other) *
        12 +
      data.incomeProfile.annualDiscretionary +
      data.incomeProfile.monthlyRent * 12;
  } else {
    // Standard mode: all expenses at general inflation
    baseGeneralExpenses =
      data.incomeProfile.monthlyHouseholdExpenses * 12 +
      data.incomeProfile.annualDiscretionary +
      data.incomeProfile.monthlyRent * 12;
    baseEducationExpenses = 0;
    baseMedicalExpenses = 0;
  }

  const baseSIPs = data.incomeProfile.monthlySIPsRunning * 12;
  const basePremiums =
    (data.insuranceProfile.annualLifePremium || 0) +
    (data.insuranceProfile.annualHealthPremium || 0);

  // ---------------------------------------------------------------------------
  // Loans: EMIs reduce as loans end within projection window
  // ---------------------------------------------------------------------------
  const loans = [
    data.liabilityProfile.homeLoan,
    data.liabilityProfile.carLoan,
    data.liabilityProfile.personalLoan,
    data.liabilityProfile.educationLoan,
  ];

  function getEMIsForYear(yearOffset: number): number {
    let totalEMI = 0;
    for (const loan of loans) {
      if (loan && loan.emi > 0 && loan.remainingYears > yearOffset) {
        totalEMI += loan.emi * 12;
      }
    }
    return totalEMI;
  }

  // ---------------------------------------------------------------------------
  // Year-by-year projection
  // ---------------------------------------------------------------------------
  const years: CashflowProjectionYear[] = [];
  let cumulativeSavings = 0;

  for (let i = 0; i < 5; i++) {
    const grossIncome = Math.round(baseAnnualIncome * Math.pow(1 + incomeGrowthRate, i));

    // Category-specific expense inflation
    const generalExp = Math.round(baseGeneralExpenses * Math.pow(1 + GENERAL_INFLATION, i));
    const educationExp = Math.round(baseEducationExpenses * Math.pow(1 + EDUCATION_INFLATION, i));
    const medicalExp = Math.round(baseMedicalExpenses * Math.pow(1 + MEDICAL_INFLATION, i));
    const totalExpenses = generalExp + educationExp + medicalExp;

    const totalEMIs = Math.round(getEMIsForYear(i));
    const insurancePremiums = Math.round(basePremiums * Math.pow(1 + PREMIUM_INFLATION, i));
    const sipCommitments = Math.round(baseSIPs * Math.pow(1 + SIP_STEP_UP, i));
    const surplus = grossIncome - totalExpenses - totalEMIs - insurancePremiums - sipCommitments;
    cumulativeSavings += surplus;

    const yearValue = currentYear + i;

    // Flag negative surplus
    if (surplus < 0) {
      warnings.push({
        year: yearValue,
        type: 'negative-surplus',
        message: `Projected outflows exceed income by ${Math.abs(Math.round(surplus)).toLocaleString('en-IN')} in ${yearValue}. Review expenses or increase income targets.`,
      });
    }

    // Flag high EMI-to-income ratio (above 50%)
    if (grossIncome > 0 && totalEMIs / grossIncome > 0.5) {
      warnings.push({
        year: yearValue,
        type: 'high-emi-ratio',
        message: `EMI-to-income ratio is ${Math.round((totalEMIs / grossIncome) * 100)}% in ${yearValue}. Healthy threshold is below 40%.`,
      });
    }

    years.push({
      year: yearValue,
      age: age + i,
      grossIncome,
      incomeGrowthRate,
      totalExpenses,
      expenseInflationRate: GENERAL_INFLATION,
      totalEMIs,
      insurancePremiums,
      sipCommitments,
      surplus: Math.round(surplus),
      cumulativeSavings: Math.round(cumulativeSavings),
    });
  }

  return {
    years,
    assumptions: {
      incomeGrowthRate,
      expenseInflationRate: GENERAL_INFLATION,
      educationInflationRate: EDUCATION_INFLATION,
      medicalInflationRate: MEDICAL_INFLATION,
      sipStepUpRate: SIP_STEP_UP,
      premiumInflationRate: PREMIUM_INFLATION,
    },
    warnings,
  };
}
