// Trustner Financial Planning — 5-Year Cashflow Projection Engine
// Comprehensive tier: year-by-year income, expenses, EMIs, premiums, SIPs, surplus

import type { FinancialPlanningData } from '@/types/financial-planning';
import type { CashflowProjection, CashflowProjectionYear, ComprehensiveProfile } from '@/types/financial-planning-v2';

/**
 * Generate a 5-year cashflow projection showing year-by-year:
 * - Gross income (with growth)
 * - Total expenses (with inflation)
 * - EMIs (reducing as loans end)
 * - Insurance premiums (with 5% annual increase)
 * - SIP commitments (with 10% step-up)
 * - Surplus
 * - Cumulative savings
 */
export function calculate5YearCashflow(
  data: FinancialPlanningData,
  comprehensiveProfile?: ComprehensiveProfile
): CashflowProjection {
  const currentYear = new Date().getFullYear();
  const age = data.personalProfile.age || 30;

  // Income: monthly salary * 12 + bonus + rental + business + other
  const baseAnnualIncome =
    data.incomeProfile.monthlyInHandSalary * 12 +
    data.incomeProfile.annualBonus +
    data.incomeProfile.rentalIncome * 12 +
    data.incomeProfile.businessIncome * 12 +
    data.incomeProfile.otherIncome * 12;

  // Growth rate from comprehensive profile or default
  const scenario = comprehensiveProfile?.incomeGrowthScenario || 'moderate';
  const incomeGrowthRate =
    scenario === 'conservative' ? 0.06 : scenario === 'optimistic' ? 0.12 : 0.08;

  const expenseInflationRate = 0.06; // 6% general inflation
  const sipStepUpRate = 0.10; // 10% annual SIP step-up
  const premiumInflation = 0.05; // 5% insurance premium increase

  // Base annual values
  const baseExpenses =
    data.incomeProfile.monthlyHouseholdExpenses * 12 +
    data.incomeProfile.annualDiscretionary +
    data.incomeProfile.monthlyRent * 12;

  const baseSIPs = data.incomeProfile.monthlySIPsRunning * 12;
  const basePremiums =
    (data.insuranceProfile.annualLifePremium || 0) +
    (data.insuranceProfile.annualHealthPremium || 0);

  // Calculate EMIs per year (they reduce as loans end)
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

  const years: CashflowProjectionYear[] = [];
  let cumulativeSavings = 0;

  for (let i = 0; i < 5; i++) {
    const grossIncome = Math.round(baseAnnualIncome * Math.pow(1 + incomeGrowthRate, i));
    const totalExpenses = Math.round(baseExpenses * Math.pow(1 + expenseInflationRate, i));
    const totalEMIs = Math.round(getEMIsForYear(i));
    const insurancePremiums = Math.round(basePremiums * Math.pow(1 + premiumInflation, i));
    const sipCommitments = Math.round(baseSIPs * Math.pow(1 + sipStepUpRate, i));
    const surplus = grossIncome - totalExpenses - totalEMIs - insurancePremiums - sipCommitments;
    cumulativeSavings += surplus;

    years.push({
      year: currentYear + i,
      age: age + i,
      grossIncome,
      incomeGrowthRate,
      totalExpenses,
      expenseInflationRate,
      totalEMIs,
      insurancePremiums,
      sipCommitments,
      surplus: Math.round(surplus),
      cumulativeSavings: Math.round(cumulativeSavings),
    });
  }

  return {
    years,
    assumptions: { incomeGrowthRate, expenseInflationRate, sipStepUpRate },
  };
}
