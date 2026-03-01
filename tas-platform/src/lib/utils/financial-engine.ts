import type {
  RetirementResult,
  EMIResult,
  TermInsuranceResult,
  HealthInsuranceResult,
  EducationPlanResult,
  Asset,
  Liability,
  NetWorthStatement,
  FinancialPlan,
  FinancialAnalysis,
  GoalFeasibility,
  TaxOpportunity,
  ActionItem,
  FinancialGoal,
} from "@/types/financial-plan";
import {
  MEDICAL_COST_MULTIPLIER,
  INSURANCE_BENCHMARKS,
  BENCHMARKS,
  INFLATION,
  TAX_LIMITS,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  ALLOCATION_BY_RISK,
  getAgeAdjustedEquity,
  getSuggestedFundCategory,
} from "@/lib/constants/financial-constants";

// ===== Retirement Planning =====
export function calculateRetirementCorpus(params: {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentMonthlyExpenses: number;
  inflationRate: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  currentSavings: number;
  pensionIncome: number;
  sipStepUpRate: number;
}): RetirementResult {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentMonthlyExpenses,
    inflationRate,
    preRetirementReturn,
    postRetirementReturn,
    currentSavings,
    pensionIncome,
    sipStepUpRate,
  } = params;

  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;

  // Monthly expenses at retirement (inflation-adjusted)
  const monthlyExpensesAtRetirement =
    currentMonthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // Net monthly need after pension
  const netMonthlyNeed = Math.max(0, monthlyExpensesAtRetirement - pensionIncome);

  // Corpus needed at retirement (PV of annuity with real return)
  const realReturn =
    (1 + postRetirementReturn / 100) / (1 + inflationRate / 100) - 1;
  const monthlyRealReturn = realReturn / 12;
  const retirementMonths = retirementYears * 12;

  let corpusNeeded: number;
  if (monthlyRealReturn <= 0) {
    corpusNeeded = netMonthlyNeed * retirementMonths;
  } else {
    corpusNeeded =
      netMonthlyNeed *
      ((1 - Math.pow(1 + monthlyRealReturn, -retirementMonths)) /
        monthlyRealReturn);
  }

  // Future value of current savings
  const futureValueOfCurrentSavings =
    currentSavings *
    Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);

  // Gap to be filled by SIP
  const gap = Math.max(0, corpusNeeded - futureValueOfCurrentSavings);

  // Required monthly SIP (with step-up)
  const monthlyPreRetReturn = preRetirementReturn / 100 / 12;
  const months = yearsToRetirement * 12;

  let requiredMonthlySIP: number;
  if (sipStepUpRate > 0 && yearsToRetirement > 1) {
    // SIP with annual step-up: approximate using geometric series
    const g = sipStepUpRate / 100;
    const r = preRetirementReturn / 100;
    let totalFV = 0;
    for (let year = 0; year < yearsToRetirement; year++) {
      const sipAmount = 1 * Math.pow(1 + g, year); // normalized to 1
      const monthsRemaining = (yearsToRetirement - year) * 12;
      const yearFV =
        sipAmount *
        12 *
        ((Math.pow(1 + monthlyPreRetReturn, monthsRemaining) - 1) /
          monthlyPreRetReturn) *
        (1 / 12); // approximate monthly contribution
      totalFV += yearFV;
    }
    requiredMonthlySIP = totalFV > 0 ? gap / totalFV : 0;
  } else {
    // Simple SIP without step-up
    if (monthlyPreRetReturn === 0) {
      requiredMonthlySIP = months > 0 ? gap / months : 0;
    } else {
      const sipFactor =
        ((Math.pow(1 + monthlyPreRetReturn, months) - 1) /
          monthlyPreRetReturn) *
        (1 + monthlyPreRetReturn);
      requiredMonthlySIP = sipFactor > 0 ? gap / sipFactor : 0;
    }
  }

  // Year-by-year breakdown
  const yearlyBreakdown: RetirementResult["yearlyBreakdown"] = [];
  let corpus = currentSavings;
  let annualSIP = requiredMonthlySIP * 12;

  for (let year = 1; year <= lifeExpectancy - currentAge; year++) {
    const age = currentAge + year;
    if (age <= retirementAge) {
      // Accumulation phase
      corpus = corpus * (1 + preRetirementReturn / 100) + annualSIP;
      annualSIP *= 1 + sipStepUpRate / 100;
      yearlyBreakdown.push({
        year,
        age,
        corpus: Math.round(corpus),
        phase: "accumulation",
      });
    } else {
      // Retirement phase - withdrawals
      const yearExpense =
        currentMonthlyExpenses *
        12 *
        Math.pow(1 + inflationRate / 100, age - currentAge);
      const yearPension = pensionIncome * 12;
      corpus =
        corpus * (1 + postRetirementReturn / 100) -
        (yearExpense - yearPension);
      yearlyBreakdown.push({
        year,
        age,
        corpus: Math.round(Math.max(0, corpus)),
        phase: "retirement",
      });
    }
  }

  return {
    corpusNeeded: Math.round(corpusNeeded),
    monthlyExpensesAtRetirement: Math.round(monthlyExpensesAtRetirement),
    futureValueOfCurrentSavings: Math.round(futureValueOfCurrentSavings),
    gap: Math.round(gap),
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    yearlyBreakdown,
  };
}

// ===== EMI Calculator with Amortization =====
export function calculateEMI(params: {
  principal: number;
  annualRate: number;
  tenureMonths: number;
}): EMIResult {
  const { principal, annualRate, tenureMonths } = params;
  const monthlyRate = annualRate / 100 / 12;

  let emi: number;
  if (monthlyRate === 0) {
    emi = principal / tenureMonths;
  } else {
    emi =
      (principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  // Amortization schedule
  const amortization: EMIResult["amortization"] = [];
  let outstanding = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = outstanding * monthlyRate;
    const principalComponent = emi - interest;
    outstanding = Math.max(0, outstanding - principalComponent);

    amortization.push({
      month,
      emi: Math.round(emi),
      principal: Math.round(principalComponent),
      interest: Math.round(interest),
      outstanding: Math.round(outstanding),
    });
  }

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    interestToPaymentRatio: totalPayment > 0 ? totalInterest / totalPayment : 0,
    amortization,
  };
}

// ===== Term Insurance Need (3 Methods) =====
export function calculateTermInsuranceNeed(params: {
  annualIncome: number;
  currentAge: number;
  retirementAge: number;
  incomeGrowthRate: number;
  discountRate: number;
  annualExpenses: number;
  outstandingLoans: number;
  futureGoals: number;
  existingLifeCover: number;
}): TermInsuranceResult {
  const {
    annualIncome,
    currentAge,
    retirementAge,
    incomeGrowthRate,
    discountRate,
    annualExpenses,
    outstandingLoans,
    futureGoals,
    existingLifeCover,
  } = params;

  const yearsToRetirement = retirementAge - currentAge;

  // Method 1: Human Life Value (HLV)
  // PV of future income stream till retirement
  let hlvMethod = 0;
  for (let i = 1; i <= yearsToRetirement; i++) {
    const incomeInYear = annualIncome * Math.pow(1 + incomeGrowthRate / 100, i);
    hlvMethod += incomeInYear / Math.pow(1 + discountRate / 100, i);
  }

  // Method 2: Income Replacement
  // 10-15x annual income based on age
  let multiplier = 15; // default for young
  if (currentAge >= 45) multiplier = 10;
  else if (currentAge >= 35) multiplier = 12;
  const incomeReplacementMethod = annualIncome * multiplier;

  // Method 3: Expense Method
  // PV of family expenses + outstanding loans + future goals - existing cover
  let expenseMethod = 0;
  for (let i = 1; i <= yearsToRetirement; i++) {
    const expenseInYear =
      annualExpenses * Math.pow(1 + INFLATION.general, i);
    expenseMethod += expenseInYear / Math.pow(1 + discountRate / 100, i);
  }
  expenseMethod += outstandingLoans + futureGoals;

  // Recommended = highest of 3 methods
  const recommendedCover = Math.max(
    hlvMethod,
    incomeReplacementMethod,
    expenseMethod
  );

  return {
    hlvMethod: Math.round(hlvMethod),
    incomeReplacementMethod: Math.round(incomeReplacementMethod),
    expenseMethod: Math.round(expenseMethod),
    recommendedCover: Math.round(recommendedCover),
    existingCover: existingLifeCover,
    gap: Math.round(Math.max(0, recommendedCover - existingLifeCover)),
  };
}

// ===== Health Insurance Adequacy =====
export function calculateHealthInsuranceNeed(params: {
  age: number;
  city: "metro" | "tier1" | "tier2" | "tier3";
  familySize: number;
  preExistingConditions: boolean;
  currentCover: number;
  hasCorporateCover: boolean;
  corporateCoverAmount: number;
}): HealthInsuranceResult {
  const {
    age,
    city,
    familySize,
    preExistingConditions,
    currentCover,
    hasCorporateCover,
    corporateCoverAmount,
  } = params;

  const baseCover = INSURANCE_BENCHMARKS.idealHealthCover;
  const cityMultiplier = MEDICAL_COST_MULTIPLIER[city] || 1.0;

  let ageMultiplier = 1.0;
  if (age >= 55) ageMultiplier = 2.0;
  else if (age >= 45) ageMultiplier = 1.5;
  else if (age >= 35) ageMultiplier = 1.3;

  const familyMultiplier = 1 + (Math.max(0, familySize - 1) * 0.3);
  const conditionMultiplier = preExistingConditions ? 1.3 : 1.0;

  const recommendedCover = Math.round(
    baseCover *
      cityMultiplier *
      ageMultiplier *
      familyMultiplier *
      conditionMultiplier
  );

  // Corporate cover is unreliable (changes with job), so only count 50%
  const effectiveCurrent =
    currentCover + (hasCorporateCover ? corporateCoverAmount * 0.5 : 0);

  const factors = [
    { label: "Base Cover", multiplier: 1.0 },
    { label: `City: ${city}`, multiplier: cityMultiplier },
    { label: `Age: ${age}`, multiplier: ageMultiplier },
    { label: `Family: ${familySize} members`, multiplier: familyMultiplier },
  ];
  if (preExistingConditions) {
    factors.push({
      label: "Pre-existing conditions",
      multiplier: conditionMultiplier,
    });
  }

  return {
    recommendedCover,
    currentCover: Math.round(effectiveCurrent),
    gap: Math.round(Math.max(0, recommendedCover - effectiveCurrent)),
    factors,
  };
}

// ===== Child Education Planner =====
export function calculateEducationCorpus(params: {
  childAge: number;
  targetEducationAge: number;
  currentCost: number;
  educationInflation: number;
  existingSavings: number;
  expectedReturn: number;
}): EducationPlanResult {
  const {
    childAge,
    targetEducationAge,
    currentCost,
    educationInflation,
    existingSavings,
    expectedReturn,
  } = params;

  const yearsToGoal = Math.max(1, targetEducationAge - childAge);
  const futureCost =
    currentCost * Math.pow(1 + educationInflation / 100, yearsToGoal);

  const futureValueOfSavings =
    existingSavings * Math.pow(1 + expectedReturn / 100, yearsToGoal);

  const gap = Math.max(0, futureCost - futureValueOfSavings);

  // Required monthly SIP
  const monthlyRate = expectedReturn / 100 / 12;
  const months = yearsToGoal * 12;
  let requiredMonthlySIP: number;

  if (monthlyRate === 0) {
    requiredMonthlySIP = months > 0 ? gap / months : 0;
  } else {
    const sipFactor =
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
    requiredMonthlySIP = sipFactor > 0 ? gap / sipFactor : 0;
  }

  return {
    currentCost: Math.round(currentCost),
    futureCost: Math.round(futureCost),
    yearsToGoal,
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    futureValueOfSavings: Math.round(futureValueOfSavings),
    gap: Math.round(gap),
  };
}

// ===== Emergency Fund Target =====
export function calculateEmergencyFundTarget(
  monthlyExpenses: number,
  occupation: string,
  numberOfEarners: number,
  hasInsurance: boolean
): number {
  let months =
    BENCHMARKS.emergencyMonthsByOccupation[occupation] ||
    BENCHMARKS.emergencyMonths.ideal;

  // Single earner family needs more
  if (numberOfEarners <= 1) months += 2;

  // No insurance means higher emergency fund
  if (!hasInsurance) months += 2;

  return monthlyExpenses * months;
}

// ===== Goal-wise SIP Calculator =====
export function calculateGoalSIP(params: {
  targetAmount: number;
  years: number;
  expectedReturn: number;
  existingSavings: number;
  inflationRate: number;
}): {
  monthlySIP: number;
  inflatedTarget: number;
  projectedValue: number;
} {
  const { targetAmount, years, expectedReturn, existingSavings, inflationRate } =
    params;

  const inflatedTarget =
    targetAmount * Math.pow(1 + inflationRate / 100, years);
  const fvSavings =
    existingSavings * Math.pow(1 + expectedReturn / 100, years);
  const gap = Math.max(0, inflatedTarget - fvSavings);

  const monthlyRate = expectedReturn / 100 / 12;
  const months = years * 12;

  let monthlySIP: number;
  if (monthlyRate === 0) {
    monthlySIP = months > 0 ? gap / months : 0;
  } else {
    const sipFactor =
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
    monthlySIP = sipFactor > 0 ? gap / sipFactor : 0;
  }

  return {
    monthlySIP: Math.round(monthlySIP),
    inflatedTarget: Math.round(inflatedTarget),
    projectedValue: Math.round(fvSavings),
  };
}

// ===== Tax Calculation =====
function calculateTaxOnSlabs(
  taxableIncome: number,
  slabs: { min: number; max: number; rate: number }[]
): number {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break;
    const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
    tax += (taxableInSlab * slab.rate) / 100;
  }
  return tax;
}

export function calculateTaxOldRegime(
  grossIncome: number,
  deductions: {
    section80C?: number;
    section80D?: number;
    section80CCD1B?: number;
    hra?: number;
    section80TTA?: number;
    homeLoanInterest?: number;
    otherDeductions?: number;
  }
): { taxableIncome: number; tax: number; cess: number; totalTax: number } {
  const totalDeductions =
    Math.min(deductions.section80C || 0, TAX_LIMITS.section80C) +
    Math.min(deductions.section80D || 0, TAX_LIMITS.section80D_self + TAX_LIMITS.section80D_parents) +
    Math.min(deductions.section80CCD1B || 0, TAX_LIMITS.section80CCD1B) +
    (deductions.hra || 0) +
    Math.min(deductions.section80TTA || 0, TAX_LIMITS.section80TTA) +
    Math.min(deductions.homeLoanInterest || 0, TAX_LIMITS.section24b_homeLoan) +
    (deductions.otherDeductions || 0) +
    TAX_LIMITS.standardDeduction;

  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  let tax = calculateTaxOnSlabs(taxableIncome, OLD_REGIME_SLABS);

  // Rebate u/s 87A
  if (taxableIncome <= TAX_LIMITS.oldRegimeRebateLimit) {
    tax = Math.max(0, tax - TAX_LIMITS.oldRegimeRebateAmount);
  }

  const cess = tax * 0.04;
  return {
    taxableIncome: Math.round(taxableIncome),
    tax: Math.round(tax),
    cess: Math.round(cess),
    totalTax: Math.round(tax + cess),
  };
}

export function calculateTaxNewRegime(grossIncome: number): {
  taxableIncome: number;
  tax: number;
  cess: number;
  totalTax: number;
} {
  const taxableIncome = Math.max(
    0,
    grossIncome - TAX_LIMITS.standardDeduction
  );
  let tax = calculateTaxOnSlabs(taxableIncome, NEW_REGIME_SLABS);

  // Rebate u/s 87A (new regime)
  if (taxableIncome <= TAX_LIMITS.newRegimeRebateLimit) {
    tax = Math.max(0, tax - TAX_LIMITS.newRegimeRebateAmount);
  }

  const cess = tax * 0.04;
  return {
    taxableIncome: Math.round(taxableIncome),
    tax: Math.round(tax),
    cess: Math.round(cess),
    totalTax: Math.round(tax + cess),
  };
}

export function optimizeTax(
  grossIncome: number,
  deductions: Record<string, number>
): {
  oldRegimeTax: number;
  newRegimeTax: number;
  recommendedRegime: "old" | "new";
  savings: number;
} {
  const oldResult = calculateTaxOldRegime(grossIncome, deductions);
  const newResult = calculateTaxNewRegime(grossIncome);

  const recommendedRegime: "old" | "new" =
    oldResult.totalTax <= newResult.totalTax ? "old" : "new";
  const savings = Math.abs(oldResult.totalTax - newResult.totalTax);

  return {
    oldRegimeTax: oldResult.totalTax,
    newRegimeTax: newResult.totalTax,
    recommendedRegime,
    savings,
  };
}

// ===== Asset Allocation Recommendation =====
export function getRecommendedAllocation(
  age: number,
  riskProfileType: string,
  goals: { years: number; priority: string }[]
): { equity: number; debt: number; gold: number; cash: number } {
  const baseAllocation =
    ALLOCATION_BY_RISK[riskProfileType] || ALLOCATION_BY_RISK.moderate;

  // Age adjustment
  const adjustedEquity = getAgeAdjustedEquity(age, baseAllocation.equity);
  const equityReduction = baseAllocation.equity - adjustedEquity;

  // Distribute reduced equity to debt
  return {
    equity: adjustedEquity,
    debt: baseAllocation.debt + equityReduction,
    gold: baseAllocation.gold,
    cash: baseAllocation.cash,
  };
}

// ===== Net Worth Calculator =====
export function calculateNetWorth(
  assets: Asset[],
  liabilities: Liability[]
): NetWorthStatement {
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + l.outstandingAmount,
    0
  );
  const liquidAssets = assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.currentValue, 0);

  return {
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    liquidAssets,
  };
}

// ===== Comprehensive Financial Health Score =====
export function calculateFinancialHealthScore(
  plan: FinancialPlan
): FinancialAnalysis {
  const { personal, income, expenses, netWorth, insurance, goals, tax, riskProfile } =
    plan;

  // 1. Emergency Fund Score (0-100)
  const monthlyExpenses = expenses.totalMonthlyExpenses || 1;
  const emergencyFundMonths = netWorth.liquidAssets / monthlyExpenses;
  const requiredMonths =
    BENCHMARKS.emergencyMonthsByOccupation[personal.occupation] ||
    BENCHMARKS.emergencyMonths.ideal;
  const emergencyFundScore = Math.min(
    100,
    Math.round((emergencyFundMonths / requiredMonths) * 100)
  );
  const emergencyFundAdequacy: FinancialAnalysis["emergencyFundAdequacy"] =
    emergencyFundMonths >= requiredMonths
      ? "excellent"
      : emergencyFundMonths >= requiredMonths * 0.5
        ? "adequate"
        : emergencyFundMonths >= 1
          ? "insufficient"
          : "critical";

  // 2. Insurance Score (0-100)
  const annualIncome = income.totalAnnualIncome || 1;
  const recommendedTermCover =
    annualIncome * INSURANCE_BENCHMARKS.termInsuranceMultiple;
  const termCoverRatio = Math.min(
    1,
    insurance.totalLifeCover / recommendedTermCover
  );

  const recommendedHealthCover =
    personal.city === "metro"
      ? INSURANCE_BENCHMARKS.metroHealthCover
      : INSURANCE_BENCHMARKS.idealHealthCover;
  const healthCoverRatio = Math.min(
    1,
    insurance.totalHealthCover / recommendedHealthCover
  );
  const insuranceScore = Math.round((termCoverRatio * 50 + healthCoverRatio * 50));

  // 3. Investment Score (0-100)
  const savingsRate = income.totalMonthlyIncome > 0
    ? (expenses.monthlySurplus / income.totalMonthlyIncome) * 100
    : 0;
  let investmentScore: number;
  if (savingsRate >= BENCHMARKS.savingsRate.excellent) investmentScore = 100;
  else if (savingsRate >= BENCHMARKS.savingsRate.good) investmentScore = 80;
  else if (savingsRate >= BENCHMARKS.savingsRate.fair) investmentScore = 60;
  else if (savingsRate >= BENCHMARKS.savingsRate.poor) investmentScore = 40;
  else investmentScore = 20;

  // 4. Debt Score (0-100)
  const debtToIncomeRatio = income.totalMonthlyIncome > 0
    ? (expenses.emiPayments / income.totalMonthlyIncome) * 100
    : 0;
  let debtScore: number;
  if (debtToIncomeRatio <= BENCHMARKS.emiToIncome.healthy) debtScore = 100;
  else if (debtToIncomeRatio <= BENCHMARKS.emiToIncome.manageable)
    debtScore = 60;
  else if (debtToIncomeRatio <= BENCHMARKS.emiToIncome.high) debtScore = 30;
  else debtScore = 10;

  // 5. Retirement Score (0-100)
  const retirementGoal = goals.find((g) => g.type === "retirement");
  let retirementScore = 50; // default if no retirement goal
  if (retirementGoal) {
    const yearsToRetirement = Math.max(
      1,
      retirementGoal.targetYear - new Date().getFullYear()
    );
    const inflatedTarget =
      retirementGoal.targetAmount *
      Math.pow(1 + INFLATION.general, yearsToRetirement);
    const projectedSavings =
      retirementGoal.currentAllocation *
      Math.pow(1.1, yearsToRetirement); // assume 10% return
    const readiness = Math.min(1, projectedSavings / inflatedTarget);
    retirementScore = Math.round(readiness * 100);
  }

  // 6. Tax Efficiency Score (0-100)
  const maxDeductions =
    TAX_LIMITS.section80C +
    TAX_LIMITS.section80D_self +
    TAX_LIMITS.section80CCD1B;
  const usedDeductions =
    (tax.section80C || 0) + (tax.section80D || 0) + (tax.section80CCD1B || 0);
  const taxEfficiencyScore = Math.min(
    100,
    Math.round((usedDeductions / maxDeductions) * 100)
  );

  // Overall Score (weighted average)
  const overallScore = Math.round(
    emergencyFundScore * 0.15 +
      insuranceScore * 0.2 +
      investmentScore * 0.2 +
      debtScore * 0.15 +
      retirementScore * 0.15 +
      taxEfficiencyScore * 0.15
  );

  // Goal Feasibility
  const goalFeasibility: GoalFeasibility[] = goals.map((goal) => {
    const yearsRemaining = Math.max(
      1,
      goal.targetYear - new Date().getFullYear()
    );
    const inflatedTarget =
      goal.targetAmount *
      Math.pow(1 + (goal.inflationRate || INFLATION.general * 100) / 100, yearsRemaining);
    const currentProjection =
      goal.currentAllocation * Math.pow(1.1, yearsRemaining);
    const gap = Math.max(0, inflatedTarget - currentProjection);
    const suggestion = getSuggestedFundCategory(yearsRemaining);

    const monthlyRate = 0.1 / 12; // assume 10% return
    const months = yearsRemaining * 12;
    const sipFactor =
      monthlyRate > 0
        ? ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
          (1 + monthlyRate)
        : months;
    const requiredMonthlySIP = sipFactor > 0 ? gap / sipFactor : 0;

    return {
      goalId: goal.id,
      goalName: goal.name,
      goalType: goal.type,
      isOnTrack: gap <= 0,
      targetAmount: goal.targetAmount,
      inflatedTarget: Math.round(inflatedTarget),
      currentProjection: Math.round(currentProjection),
      gap: Math.round(gap),
      requiredMonthlySIP: Math.round(requiredMonthlySIP),
      suggestedFundCategory: suggestion.category,
      yearsRemaining,
    };
  });

  // Current Asset Allocation
  const totalAssets = netWorth.totalAssets || 1;
  const assetsByCategory = netWorth.assets.reduce(
    (acc, a) => {
      if (a.category === "equity") acc.equity += a.currentValue;
      else if (a.category === "debt" || a.category === "ppf" || a.category === "epf")
        acc.debt += a.currentValue;
      else if (a.category === "gold") acc.gold += a.currentValue;
      else if (a.category === "real-estate") acc.realEstate += a.currentValue;
      else acc.cash += a.currentValue;
      return acc;
    },
    { equity: 0, debt: 0, gold: 0, cash: 0, realEstate: 0 }
  );

  const currentAllocation = {
    equity: Math.round((assetsByCategory.equity / totalAssets) * 100),
    debt: Math.round((assetsByCategory.debt / totalAssets) * 100),
    gold: Math.round((assetsByCategory.gold / totalAssets) * 100),
    cash: Math.round((assetsByCategory.cash / totalAssets) * 100),
    realEstate: Math.round((assetsByCategory.realEstate / totalAssets) * 100),
  };

  const recommendedAllocation = getRecommendedAllocation(
    personal.age,
    riskProfile.type,
    goals.map((g) => ({
      years: Math.max(1, g.targetYear - new Date().getFullYear()),
      priority: g.priority,
    }))
  );

  // Tax Optimization Opportunities
  const taxOpportunities: TaxOpportunity[] = [];
  const unused80C = TAX_LIMITS.section80C - (tax.section80C || 0);
  if (unused80C > 0) {
    const approxSaving = unused80C * 0.3; // 30% slab
    taxOpportunities.push({
      section: "Section 80C",
      description: "Invest in ELSS, PPF, or NPS Tier-1 to save tax",
      maxLimit: TAX_LIMITS.section80C,
      currentUsage: tax.section80C || 0,
      unusedLimit: unused80C,
      potentialSaving: Math.round(approxSaving),
      suggestedProduct: "ELSS Mutual Funds",
      productLink: "/mutual-funds?category=ELSS",
    });
  }

  const unused80D = TAX_LIMITS.section80D_self - (tax.section80D || 0);
  if (unused80D > 0) {
    taxOpportunities.push({
      section: "Section 80D",
      description: "Buy or top-up health insurance to save tax",
      maxLimit: TAX_LIMITS.section80D_self,
      currentUsage: tax.section80D || 0,
      unusedLimit: unused80D,
      potentialSaving: Math.round(unused80D * 0.3),
      suggestedProduct: "Health Insurance",
      productLink: "/insurance/health",
    });
  }

  const unused80CCD = TAX_LIMITS.section80CCD1B - (tax.section80CCD1B || 0);
  if (unused80CCD > 0) {
    taxOpportunities.push({
      section: "Section 80CCD(1B)",
      description: "Invest in NPS for additional Rs.50,000 deduction",
      maxLimit: TAX_LIMITS.section80CCD1B,
      currentUsage: tax.section80CCD1B || 0,
      unusedLimit: unused80CCD,
      potentialSaving: Math.round(unused80CCD * 0.3),
      suggestedProduct: "National Pension System (NPS)",
      productLink: "/investments/nps",
    });
  }

  // Recommended regime
  const taxOptimization = optimizeTax(
    income.totalAnnualIncome,
    {
      section80C: tax.section80C,
      section80D: tax.section80D,
      section80CCD1B: tax.section80CCD1B,
      hra: tax.hra,
      section80TTA: tax.section80TTA,
      homeLoanInterest: tax.homeLoanInterest,
    }
  );

  // Action Items
  const actionItems: ActionItem[] = [];

  if (emergencyFundAdequacy === "critical" || emergencyFundAdequacy === "insufficient") {
    const efGap = (monthlyExpenses * requiredMonths) - netWorth.liquidAssets;
    actionItems.push({
      id: "ef-1",
      priority: emergencyFundAdequacy === "critical" ? "urgent" : "high",
      category: "emergency-fund",
      title: "Build Emergency Fund",
      description: `You need ${requiredMonths} months of expenses (${formatAmount(monthlyExpenses * requiredMonths)}) as emergency fund. Currently at ${emergencyFundMonths.toFixed(1)} months.`,
      impact: "Protects against job loss, medical emergencies, and unexpected expenses",
      cta: { label: "Explore Liquid Funds", href: "/mutual-funds?category=Debt" },
      executionFlow: {
        gapType: "emergency",
        gapAmount: Math.max(0, efGap),
        recommendedCategory: "Liquid Funds",
        recommendedProducts: [
          { name: "Liquid Funds", href: "/mutual-funds?category=Debt", reason: "Instant liquidity with better returns than savings account" },
          { name: "Ultra Short Duration Funds", href: "/mutual-funds?category=Debt", reason: "Slightly higher returns for 3-6 month horizon" },
        ],
      },
    });
  }

  if (insurance.totalLifeCover < recommendedTermCover) {
    actionItems.push({
      id: "ins-1",
      priority: insurance.totalLifeCover === 0 ? "urgent" : "high",
      category: "insurance",
      title: "Get Adequate Term Insurance",
      description: `Recommended: ${formatAmount(recommendedTermCover)}. Current: ${formatAmount(insurance.totalLifeCover)}. Gap: ${formatAmount(recommendedTermCover - insurance.totalLifeCover)}.`,
      impact: "Protects family's financial future in case of untimely demise",
      cta: { label: "Calculate Term Need", href: "/calculators/term-insurance" },
      executionFlow: {
        gapType: "insurance",
        gapAmount: recommendedTermCover - insurance.totalLifeCover,
        recommendedCategory: "Term Insurance",
        recommendedProducts: [
          { name: "Term Life Insurance", href: "/insurance/life", reason: `Close ${formatAmount(recommendedTermCover - insurance.totalLifeCover)} coverage gap` },
        ],
      },
    });
  }

  if (insurance.totalHealthCover < recommendedHealthCover) {
    actionItems.push({
      id: "ins-2",
      priority: insurance.totalHealthCover === 0 ? "urgent" : "high",
      category: "insurance",
      title: "Increase Health Insurance Cover",
      description: `Recommended: ${formatAmount(recommendedHealthCover)}. Current: ${formatAmount(insurance.totalHealthCover)}. Gap: ${formatAmount(recommendedHealthCover - insurance.totalHealthCover)}.`,
      impact: "Medical costs inflate at 12% p.a. Adequate cover prevents financial stress",
      cta: { label: "Check Health Cover", href: "/calculators/health-insurance" },
      executionFlow: {
        gapType: "insurance",
        gapAmount: recommendedHealthCover - insurance.totalHealthCover,
        recommendedCategory: "Health Insurance",
        recommendedProducts: [
          { name: "Health Insurance Plans", href: "/insurance/health", reason: `Close ${formatAmount(recommendedHealthCover - insurance.totalHealthCover)} health cover gap` },
        ],
      },
    });
  }

  if (debtToIncomeRatio > BENCHMARKS.emiToIncome.manageable) {
    actionItems.push({
      id: "debt-1",
      priority: "high",
      category: "debt",
      title: "Reduce Debt Burden",
      description: `EMI-to-income ratio is ${debtToIncomeRatio.toFixed(0)}% (should be under ${BENCHMARKS.emiToIncome.manageable}%). Consider prepaying high-interest loans.`,
      impact: "Frees up cash flow for savings and investment",
      cta: { label: "EMI Calculator", href: "/calculators/emi" },
    });
  }

  if (taxOpportunities.length > 0) {
    const totalPotentialSaving = taxOpportunities.reduce(
      (sum, t) => sum + t.potentialSaving,
      0
    );
    actionItems.push({
      id: "tax-1",
      priority: "medium",
      category: "tax",
      title: "Optimize Tax Savings",
      description: `You can save up to ${formatAmount(totalPotentialSaving)} in taxes by utilizing unused deductions.`,
      impact: "Tax savings can be redirected to wealth-building investments",
      cta: { label: "Tax Calculator", href: "/calculators/tax" },
      executionFlow: {
        gapType: "tax",
        gapAmount: totalPotentialSaving,
        recommendedCategory: "ELSS Funds",
        recommendedProducts: [
          { name: "ELSS Funds", href: "/mutual-funds?category=ELSS", reason: "Save tax under 80C with potential for high returns" },
          { name: "NPS", href: "/calculators/retirement", reason: "Additional ₹50,000 deduction under 80CCD(1B)" },
        ],
      },
    });
  }

  goalFeasibility
    .filter((g) => !g.isOnTrack)
    .forEach((g) => {
      const fundCategory = g.suggestedFundCategory || "Flexi Cap Funds";
      const fundHref = g.goalType === "retirement"
        ? "/mutual-funds?category=Equity"
        : g.yearsRemaining <= 3
          ? "/mutual-funds?category=Debt"
          : "/mutual-funds?category=Equity";
      actionItems.push({
        id: `goal-${g.goalId}`,
        priority: g.goalType === "retirement" ? "high" : "medium",
        category: "goal",
        title: `Start SIP for ${g.goalName}`,
        description: `Need ${formatAmount(g.requiredMonthlySIP)}/month in ${g.suggestedFundCategory} to reach ${formatAmount(g.inflatedTarget)} in ${g.yearsRemaining} years.`,
        impact: `Bridge the gap of ${formatAmount(g.gap)}`,
        cta: { label: "Start SIP", href: "/mutual-funds" },
        executionFlow: {
          gapType: "investment",
          gapAmount: g.gap,
          recommendedCategory: fundCategory,
          recommendedProducts: [
            { name: fundCategory, href: fundHref, reason: `Best for ${g.yearsRemaining}+ year goals` },
          ],
        },
      });
    });

  // Sort action items by priority
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  actionItems.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return {
    overallScore,
    emergencyFundScore,
    insuranceScore,
    investmentScore,
    debtScore,
    retirementScore,
    taxEfficiencyScore,

    emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    emergencyFundAdequacy,
    savingsRate: Math.round(savingsRate * 10) / 10,
    debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,

    termInsuranceGap: Math.round(
      Math.max(0, recommendedTermCover - insurance.totalLifeCover)
    ),
    healthInsuranceGap: Math.round(
      Math.max(0, recommendedHealthCover - insurance.totalHealthCover)
    ),
    recommendedTermCover: Math.round(recommendedTermCover),
    recommendedHealthCover: Math.round(recommendedHealthCover),

    goalFeasibility,

    currentAllocation,
    recommendedAllocation,

    taxOpportunities,
    recommendedRegime: taxOptimization.recommendedRegime,
    potentialTaxSavings: taxOptimization.savings,

    actionItems,
  };
}

// Helper for formatting amounts in action items
function formatAmount(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return `\u20B9${amount}`;
}
