// ═══════════════════════════════════════════════
// SIP CALCULATION ENGINE - Trustner SIP Platform
// ═══════════════════════════════════════════════

export interface SIPResult {
  totalInvested: number;
  estimatedReturns: number;
  totalValue: number;
}

export interface YearlyBreakdown {
  year: number;
  invested: number;
  value: number;
  returns: number;
  growthPercent: number;
}

export interface StepUpSIPResult extends SIPResult {
  yearlyBreakdown: (YearlyBreakdown & { monthlyAmount: number })[];
}

export interface GoalSIPResult {
  requiredMonthly: number;
  totalInvested: number;
  totalValue: number;
  estimatedReturns: number;
}

export interface ScenarioResult {
  scenario: string;
  returnRate: number;
  totalValue: number;
  totalInvested: number;
  returns: number;
}

// ── Basic SIP Calculator ───────────────────────
export function calculateSIP(
  monthlyAmount: number,
  annualReturn: number,
  years: number
): SIPResult {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    const totalInvested = monthlyAmount * months;
    return { totalInvested, estimatedReturns: 0, totalValue: totalInvested };
  }

  const totalValue =
    monthlyAmount *
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  const totalInvested = monthlyAmount * months;
  const estimatedReturns = totalValue - totalInvested;

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
  };
}

// ── SIP Year-by-Year Breakdown ─────────────────
export function calculateSIPBreakdown(
  monthlyAmount: number,
  annualReturn: number,
  years: number
): YearlyBreakdown[] {
  const monthlyRate = annualReturn / 100 / 12;
  const result: YearlyBreakdown[] = [];

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const invested = monthlyAmount * months;
    let value: number;

    if (monthlyRate === 0) {
      value = invested;
    } else {
      value =
        monthlyAmount *
        (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    }

    result.push({
      year: y,
      invested: Math.round(invested),
      value: Math.round(value),
      returns: Math.round(value - invested),
      growthPercent: invested > 0 ? Math.round(((value - invested) / invested) * 100) : 0,
    });
  }

  return result;
}

// ── Step-Up SIP Calculator ─────────────────────
export function calculateStepUpSIP(
  initialMonthly: number,
  annualStepUp: number,
  annualReturn: number,
  years: number
): StepUpSIPResult {
  const monthlyRate = annualReturn / 100 / 12;
  let totalInvested = 0;
  let futureValue = 0;
  let currentMonthly = initialMonthly;
  const yearlyBreakdown: (YearlyBreakdown & { monthlyAmount: number })[] = [];

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      totalInvested += currentMonthly;
      futureValue = (futureValue + currentMonthly) * (1 + monthlyRate);
    }

    yearlyBreakdown.push({
      year: y,
      monthlyAmount: Math.round(currentMonthly),
      invested: Math.round(totalInvested),
      value: Math.round(futureValue),
      returns: Math.round(futureValue - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((futureValue - totalInvested) / totalInvested) * 100) : 0,
    });

    currentMonthly = currentMonthly * (1 + annualStepUp / 100);
  }

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(futureValue - totalInvested),
    totalValue: Math.round(futureValue),
    yearlyBreakdown,
  };
}

// ── Goal-Based SIP Calculator ──────────────────
export function calculateGoalSIP(
  targetAmount: number,
  annualReturn: number,
  years: number
): GoalSIPResult {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    const requiredMonthly = targetAmount / months;
    return {
      requiredMonthly: Math.round(requiredMonthly),
      totalInvested: Math.round(requiredMonthly * months),
      totalValue: Math.round(targetAmount),
      estimatedReturns: 0,
    };
  }

  const requiredMonthly =
    targetAmount / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  const totalInvested = requiredMonthly * months;

  return {
    requiredMonthly: Math.round(requiredMonthly),
    totalInvested: Math.round(totalInvested),
    totalValue: Math.round(targetAmount),
    estimatedReturns: Math.round(targetAmount - totalInvested),
  };
}

// ── Goal-Based SIP with Step-Up ──────────────────
export function calculateGoalSIPWithStepUp(
  targetAmount: number,
  annualReturn: number,
  years: number,
  stepUpType: 'percentage' | 'amount',
  stepUpValue: number
): GoalSIPResult & { startingMonthly: number; yearlyBreakdown: (YearlyBreakdown & { monthlyAmount: number })[] } {
  const monthlyRate = annualReturn / 100 / 12;

  // Simulate function: given a starting SIP, calculate the final corpus with step-up
  const simulate = (startingSIP: number) => {
    let totalInvested = 0;
    let corpus = 0;
    let currentMonthly = startingSIP;
    const breakdown: (YearlyBreakdown & { monthlyAmount: number })[] = [];

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        totalInvested += currentMonthly;
        corpus = (corpus + currentMonthly) * (1 + monthlyRate);
      }
      breakdown.push({
        year: y,
        monthlyAmount: Math.round(currentMonthly),
        invested: Math.round(totalInvested),
        value: Math.round(corpus),
        returns: Math.round(corpus - totalInvested),
        growthPercent: totalInvested > 0 ? Math.round(((corpus - totalInvested) / totalInvested) * 100) : 0,
      });
      // Apply step-up for next year
      if (y < years) {
        if (stepUpType === 'percentage') {
          currentMonthly *= (1 + stepUpValue / 100);
        } else {
          currentMonthly += stepUpValue;
        }
      }
    }
    return { totalInvested, corpus, breakdown };
  };

  // Binary search for the starting SIP that achieves the target
  let low = 100;
  let high = targetAmount / 12; // Upper bound: paying the entire target in 1 year
  let bestStart = low;
  let bestResult = simulate(low);

  for (let i = 0; i < 100; i++) { // 100 iterations for precision
    const mid = (low + high) / 2;
    const result = simulate(mid);
    if (result.corpus < targetAmount) {
      low = mid;
    } else {
      high = mid;
      bestStart = mid;
      bestResult = result;
    }
    if (Math.abs(result.corpus - targetAmount) < 1) break;
  }

  const finalResult = simulate(bestStart);

  return {
    startingMonthly: Math.round(bestStart),
    requiredMonthly: Math.round(bestStart),
    totalInvested: Math.round(finalResult.totalInvested),
    estimatedReturns: Math.round(finalResult.corpus - finalResult.totalInvested),
    totalValue: Math.round(finalResult.corpus),
    yearlyBreakdown: finalResult.breakdown,
  };
}

// ── Inflation-Adjusted SIP Calculator ──────────
export function calculateInflationAdjustedSIP(
  monthlyAmount: number,
  annualReturn: number,
  years: number,
  inflationRate: number
): { nominal: SIPResult; real: SIPResult; inflationImpact: number } {
  const nominal = calculateSIP(monthlyAmount, annualReturn, years);
  const realReturn = ((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1) * 100;
  const real = calculateSIP(monthlyAmount, realReturn, years);

  return {
    nominal,
    real,
    inflationImpact: nominal.totalValue - real.totalValue,
  };
}

// ── Lumpsum Calculator ─────────────────────────
export function calculateLumpsum(
  principal: number,
  annualReturn: number,
  years: number
): SIPResult {
  const totalValue = principal * Math.pow(1 + annualReturn / 100, years);

  return {
    totalInvested: Math.round(principal),
    estimatedReturns: Math.round(totalValue - principal),
    totalValue: Math.round(totalValue),
  };
}

// ── SIP vs Lumpsum Comparison ──────────────────
export function compareSIPvsLumpsum(
  sipMonthly: number,
  years: number,
  annualReturn: number
): { sip: SIPResult & { yearlyBreakdown: YearlyBreakdown[] }; lumpsum: SIPResult & { yearlyBreakdown: YearlyBreakdown[] } } {
  const totalSIPInvestment = sipMonthly * years * 12;
  const sipResult = calculateSIP(sipMonthly, annualReturn, years);
  const sipBreakdown = calculateSIPBreakdown(sipMonthly, annualReturn, years);

  const lumpsumResult = calculateLumpsum(totalSIPInvestment, annualReturn, years);
  const lumpsumBreakdown: YearlyBreakdown[] = [];
  for (let y = 1; y <= years; y++) {
    const value = totalSIPInvestment * Math.pow(1 + annualReturn / 100, y);
    lumpsumBreakdown.push({
      year: y,
      invested: Math.round(totalSIPInvestment),
      value: Math.round(value),
      returns: Math.round(value - totalSIPInvestment),
      growthPercent: Math.round(((value - totalSIPInvestment) / totalSIPInvestment) * 100),
    });
  }

  return {
    sip: { ...sipResult, yearlyBreakdown: sipBreakdown },
    lumpsum: { ...lumpsumResult, yearlyBreakdown: lumpsumBreakdown },
  };
}

// ── SWP Calculator ─────────────────────────────
export function calculateSWP(
  corpus: number,
  monthlyWithdrawal: number,
  annualReturn: number,
  years: number,
  stepUpEnabled: boolean = false,
  stepUpType: 'percentage' | 'amount' = 'percentage',
  stepUpValue: number = 5
): { yearlyData: { year: number; remaining: number; withdrawn: number; interest: number; monthlyWithdrawal: number }[]; totalWithdrawn: number; finalCorpus: number; corpusLasts: number } {
  const monthlyRate = annualReturn / 100 / 12;
  let remaining = corpus;
  let totalWithdrawn = 0;
  let corpusLasts = years;
  let currentMonthlyWithdrawal = monthlyWithdrawal;
  const yearlyData: { year: number; remaining: number; withdrawn: number; interest: number; monthlyWithdrawal: number }[] = [];

  for (let y = 1; y <= years; y++) {
    let yearWithdrawn = 0;
    let yearInterest = 0;

    for (let m = 0; m < 12; m++) {
      const interest = remaining * monthlyRate;
      yearInterest += interest;
      remaining = remaining + interest - currentMonthlyWithdrawal;
      yearWithdrawn += currentMonthlyWithdrawal;
      totalWithdrawn += currentMonthlyWithdrawal;

      if (remaining <= 0) {
        remaining = 0;
        corpusLasts = y - 1 + (m + 1) / 12;
        break;
      }
    }

    yearlyData.push({
      year: y,
      remaining: Math.round(Math.max(0, remaining)),
      withdrawn: Math.round(yearWithdrawn),
      interest: Math.round(yearInterest),
      monthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
    });

    if (remaining <= 0) break;

    // Step-up withdrawal at year end for next year
    if (stepUpEnabled && y < years) {
      if (stepUpType === 'percentage') {
        currentMonthlyWithdrawal = currentMonthlyWithdrawal * (1 + stepUpValue / 100);
      } else {
        currentMonthlyWithdrawal = currentMonthlyWithdrawal + stepUpValue;
      }
    }
  }

  return {
    yearlyData,
    totalWithdrawn: Math.round(totalWithdrawn),
    finalCorpus: Math.round(Math.max(0, remaining)),
    corpusLasts: Math.round(corpusLasts * 10) / 10,
  };
}

// ── Retirement SIP Planner — Types ─────────────────────
export interface RetirementAccumulationYear {
  year: number;
  age: number;
  invested: number;
  existingSavingsValue: number;
  sipValue: number;
  totalValue: number;
  phase: 'accumulation';
}

export interface RetirementDepletionYear {
  year: number;
  age: number;
  openingCorpus: number;
  monthlyExpense: number;
  annualWithdrawal: number;
  pensionIncome: number;
  investmentReturn: number;
  closingCorpus: number;
  phase: 'distribution';
}

export interface RetirementSIPResult {
  // Core (backward compatible)
  yearsToRetirement: number;
  yearsInRetirement: number;
  futureMonthlyExpense: number;
  corpusRequired: number;
  monthlySIPRequired: number;
  totalInvested: number;
  // New breakdown
  adjustedMonthlyExpense: number;
  existingSavingsAtRetirement: number;
  pensionPV: number;
  healthcareReserve: number;
  gapCorpus: number;
  shortfallOrSurplus: number;
  corpusAdequacyRatio: number;
  yearsCorpusLasts: number;
  retirementReadinessScore: number;
  depletionSchedule: RetirementDepletionYear[];
  accumulationSchedule: RetirementAccumulationYear[];
}

// ── Retirement SIP Planner ─────────────────────
export function calculateRetirementSIP(
  currentAge: number,
  retirementAge: number,
  monthlyExpense: number,
  inflationRate: number,
  preRetirementReturn: number,
  postRetirementReturn: number,
  lifeExpectancy: number,
  existingSavings: number = 0,
  monthlyPension: number = 0,
  expenseReductionPercent: number = 0,
  healthcareReserveAmount: number = 0
): RetirementSIPResult {
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  // Future monthly expense at retirement (inflation-adjusted)
  const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // Apply expense reduction
  const adjustedMonthlyExpense = futureMonthlyExpense * (1 - expenseReductionPercent / 100);

  // Corpus for expenses (PV of inflation-adjusted annuity)
  const retirementMonths = yearsInRetirement * 12;
  let corpusForExpenses: number;

  const monthlyPostReturnRate = postRetirementReturn / 100 / 12;
  if (monthlyPostReturnRate === 0) {
    corpusForExpenses = adjustedMonthlyExpense * retirementMonths;
  } else {
    const realPostReturnRate = ((1 + postRetirementReturn / 100) / (1 + inflationRate / 100) - 1);
    const monthlyRealRate = realPostReturnRate / 12;
    if (monthlyRealRate === 0) {
      corpusForExpenses = adjustedMonthlyExpense * retirementMonths;
    } else {
      corpusForExpenses = adjustedMonthlyExpense * ((1 - Math.pow(1 + monthlyRealRate, -retirementMonths)) / monthlyRealRate);
    }
  }

  // Factor in pension: reduces required corpus
  let pensionPV = 0;
  if (monthlyPension > 0) {
    // Pension is assumed to start at retirement and last through retirement
    // PV of pension annuity at post-retirement return rate
    if (monthlyPostReturnRate === 0) {
      pensionPV = monthlyPension * retirementMonths;
    } else {
      pensionPV = monthlyPension * ((1 - Math.pow(1 + monthlyPostReturnRate, -retirementMonths)) / monthlyPostReturnRate);
    }
  }

  // Total corpus required = expenses corpus + healthcare - pension PV
  const totalCorpusRequired = Math.max(0, corpusForExpenses + healthcareReserveAmount - pensionPV);

  // Existing savings compounded to retirement
  const existingSavingsAtRetirement = existingSavings * Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);

  // Gap corpus = what SIP needs to build
  const gapCorpus = Math.max(0, totalCorpusRequired - existingSavingsAtRetirement);

  // Monthly SIP required (reuse existing calculateGoalSIP)
  const goalResult = calculateGoalSIP(gapCorpus, preRetirementReturn, yearsToRetirement);

  // Total available at retirement
  const totalAvailable = existingSavingsAtRetirement + (gapCorpus > 0 ? totalCorpusRequired - existingSavingsAtRetirement + existingSavingsAtRetirement : existingSavingsAtRetirement);
  // Simplify: if SIP covers the gap, total available = totalCorpusRequired
  const actualAvailable = gapCorpus > 0 ? goalResult.totalValue + existingSavingsAtRetirement : existingSavingsAtRetirement;

  // Shortfall/surplus
  const shortfallOrSurplus = actualAvailable - totalCorpusRequired;

  // Adequacy ratio
  const corpusAdequacyRatio = totalCorpusRequired > 0
    ? Math.min(200, (actualAvailable / totalCorpusRequired) * 100)
    : 100;

  // ── Accumulation schedule ──
  const accumulationSchedule: RetirementAccumulationYear[] = [];
  const monthlyPreRate = preRetirementReturn / 100 / 12;
  let sipCorpus = 0;
  let cumInvested = 0;

  for (let y = 1; y <= yearsToRetirement; y++) {
    for (let m = 0; m < 12; m++) {
      cumInvested += goalResult.requiredMonthly;
      sipCorpus = (sipCorpus + goalResult.requiredMonthly) * (1 + monthlyPreRate);
    }
    const existingVal = existingSavings * Math.pow(1 + preRetirementReturn / 100, y);
    accumulationSchedule.push({
      year: y,
      age: currentAge + y,
      invested: Math.round(cumInvested),
      existingSavingsValue: Math.round(existingVal),
      sipValue: Math.round(sipCorpus),
      totalValue: Math.round(sipCorpus + existingVal),
      phase: 'accumulation',
    });
  }

  // ── Depletion schedule ──
  const depletionSchedule: RetirementDepletionYear[] = [];
  let depletionCorpus = totalCorpusRequired > 0 ? totalCorpusRequired : actualAvailable;
  let currentExpense = adjustedMonthlyExpense;
  let yearsCorpusLasts = yearsInRetirement;
  let corpusDepleted = false;

  for (let y = 1; y <= yearsInRetirement; y++) {
    const opening = depletionCorpus;
    let yearReturn = 0;
    let yearWithdrawal = 0;
    const yearPension = monthlyPension * 12;

    for (let m = 0; m < 12; m++) {
      const monthReturn = depletionCorpus * (postRetirementReturn / 100 / 12);
      yearReturn += monthReturn;
      depletionCorpus += monthReturn;

      const netWithdrawal = Math.max(0, currentExpense - monthlyPension);
      yearWithdrawal += netWithdrawal;

      depletionCorpus -= netWithdrawal;
      if (depletionCorpus <= 0) {
        depletionCorpus = 0;
        if (!corpusDepleted) {
          yearsCorpusLasts = y - 1 + (m + 1) / 12;
          corpusDepleted = true;
        }
      }
    }

    depletionSchedule.push({
      year: y,
      age: retirementAge + y,
      openingCorpus: Math.round(opening),
      monthlyExpense: Math.round(currentExpense),
      annualWithdrawal: Math.round(yearWithdrawal),
      pensionIncome: Math.round(yearPension),
      investmentReturn: Math.round(yearReturn),
      closingCorpus: Math.round(Math.max(0, depletionCorpus)),
      phase: 'distribution',
    });

    // Inflate expense for next year
    currentExpense = currentExpense * (1 + inflationRate / 100);
  }

  if (!corpusDepleted) yearsCorpusLasts = yearsInRetirement;

  // ── Retirement readiness score (0-100) ──
  let readinessScore = Math.min(100, corpusAdequacyRatio);
  // Bonus for planning factors
  if (existingSavings > 0) readinessScore = Math.min(100, readinessScore + 3);
  if (monthlyPension > 0) readinessScore = Math.min(100, readinessScore + 3);
  if (expenseReductionPercent > 0) readinessScore = Math.min(100, readinessScore + 2);
  if (healthcareReserveAmount > 0) readinessScore = Math.min(100, readinessScore + 2);
  readinessScore = Math.max(0, Math.min(100, Math.round(readinessScore)));

  return {
    yearsToRetirement,
    yearsInRetirement,
    futureMonthlyExpense: Math.round(futureMonthlyExpense),
    corpusRequired: Math.round(totalCorpusRequired),
    monthlySIPRequired: goalResult.requiredMonthly,
    totalInvested: goalResult.totalInvested,
    adjustedMonthlyExpense: Math.round(adjustedMonthlyExpense),
    existingSavingsAtRetirement: Math.round(existingSavingsAtRetirement),
    pensionPV: Math.round(pensionPV),
    healthcareReserve: Math.round(healthcareReserveAmount),
    gapCorpus: Math.round(gapCorpus),
    shortfallOrSurplus: Math.round(shortfallOrSurplus),
    corpusAdequacyRatio: Math.round(corpusAdequacyRatio * 10) / 10,
    yearsCorpusLasts: Math.round(yearsCorpusLasts * 10) / 10,
    retirementReadinessScore: readinessScore,
    depletionSchedule,
    accumulationSchedule,
  };
}

// ── SIP Duration Optimizer ─────────────────────
export function optimizeSIPDuration(
  monthlyAmount: number,
  targetAmount: number,
  annualReturn: number
): { years: number; months: number; totalInvested: number; totalValue: number } {
  const monthlyRate = annualReturn / 100 / 12;
  let months = 1;
  let value = 0;

  while (months < 600) { // max 50 years
    if (monthlyRate === 0) {
      value = monthlyAmount * months;
    } else {
      value = monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    }

    if (value >= targetAmount) break;
    months++;
  }

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalInvested: Math.round(monthlyAmount * months),
    totalValue: Math.round(value),
  };
}

// ── Market Correction Impact ───────────────────
export function calculateCorrectionImpact(
  monthlyAmount: number,
  annualReturn: number,
  years: number,
  correctionYear: number,
  correctionPercent: number,
  recoveryYears: number
): YearlyBreakdown[] {
  const monthlyRate = annualReturn / 100 / 12;
  let portfolio = 0;
  const result: YearlyBreakdown[] = [];
  let totalInvested = 0;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      totalInvested += monthlyAmount;
      portfolio = (portfolio + monthlyAmount) * (1 + monthlyRate);
    }

    // Apply correction
    if (y === correctionYear) {
      portfolio = portfolio * (1 - correctionPercent / 100);
    }

    // Reduced returns during recovery period
    if (y > correctionYear && y <= correctionYear + recoveryYears) {
      // Already calculated with normal returns above, this models the scenario
    }

    result.push({
      year: y,
      invested: Math.round(totalInvested),
      value: Math.round(portfolio),
      returns: Math.round(portfolio - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((portfolio - totalInvested) / totalInvested) * 100) : 0,
    });
  }

  return result;
}

// ── 3-Scenario Analysis ────────────────────────
export function calculateScenarios(
  monthlyAmount: number,
  years: number
): ScenarioResult[] {
  const scenarios = [
    { scenario: 'Conservative', returnRate: 8 },
    { scenario: 'Moderate', returnRate: 12 },
    { scenario: 'Aggressive', returnRate: 15 },
  ];

  return scenarios.map((s) => {
    const result = calculateSIP(monthlyAmount, s.returnRate, years);
    return {
      ...s,
      totalValue: result.totalValue,
      totalInvested: result.totalInvested,
      returns: result.estimatedReturns,
    };
  });
}

// ── SIP with Growth Period (Hybrid) ─────────────
export function calculateSIPWithGrowth(
  monthlyAmount: number,
  annualReturn: number,
  sipYears: number,
  totalYears: number
): { result: SIPResult; breakdown: (YearlyBreakdown & { phase: 'SIP' | 'Growth' })[] } {
  const monthlyRate = annualReturn / 100 / 12;
  const breakdown: (YearlyBreakdown & { phase: 'SIP' | 'Growth' })[] = [];

  let corpus = 0;
  let totalInvested = 0;

  // Phase 1: Active SIP period
  for (let y = 1; y <= sipYears; y++) {
    for (let m = 0; m < 12; m++) {
      totalInvested += monthlyAmount;
      if (monthlyRate === 0) {
        corpus += monthlyAmount;
      } else {
        corpus = (corpus + monthlyAmount) * (1 + monthlyRate);
      }
    }

    breakdown.push({
      year: y,
      invested: Math.round(totalInvested),
      value: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((corpus - totalInvested) / totalInvested) * 100) : 0,
      phase: 'SIP',
    });
  }

  // Phase 2: Growth-only period (corpus compounds, no new investment)
  for (let y = sipYears + 1; y <= totalYears; y++) {
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + monthlyRate);
    }

    breakdown.push({
      year: y,
      invested: Math.round(totalInvested),
      value: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((corpus - totalInvested) / totalInvested) * 100) : 0,
      phase: 'Growth',
    });
  }

  return {
    result: {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(corpus - totalInvested),
      totalValue: Math.round(corpus),
    },
    breakdown,
  };
}

// ── Step-Up SIP with Growth Period (Hybrid) ──────
export function calculateStepUpSIPWithGrowth(
  initialMonthly: number,
  annualStepUp: number,
  annualReturn: number,
  sipYears: number,
  totalYears: number
): StepUpSIPResult & { growthBreakdown: (YearlyBreakdown & { monthlyAmount: number; phase: 'SIP' | 'Growth' })[] } {
  const monthlyRate = annualReturn / 100 / 12;
  let totalInvested = 0;
  let corpus = 0;
  let currentMonthly = initialMonthly;
  const growthBreakdown: (YearlyBreakdown & { monthlyAmount: number; phase: 'SIP' | 'Growth' })[] = [];
  const yearlyBreakdown: (YearlyBreakdown & { monthlyAmount: number })[] = [];

  // Phase 1: Active Step-Up SIP period
  for (let y = 1; y <= sipYears; y++) {
    for (let m = 0; m < 12; m++) {
      totalInvested += currentMonthly;
      corpus = (corpus + currentMonthly) * (1 + monthlyRate);
    }

    const row = {
      year: y,
      monthlyAmount: Math.round(currentMonthly),
      invested: Math.round(totalInvested),
      value: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((corpus - totalInvested) / totalInvested) * 100) : 0,
    };

    yearlyBreakdown.push(row);
    growthBreakdown.push({ ...row, phase: 'SIP' });

    currentMonthly = currentMonthly * (1 + annualStepUp / 100);
  }

  // Phase 2: Growth-only period (corpus compounds, no new investment)
  for (let y = sipYears + 1; y <= totalYears; y++) {
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + monthlyRate);
    }

    const row = {
      year: y,
      monthlyAmount: 0,
      invested: Math.round(totalInvested),
      value: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      growthPercent: totalInvested > 0 ? Math.round(((corpus - totalInvested) / totalInvested) * 100) : 0,
    };

    yearlyBreakdown.push(row);
    growthBreakdown.push({ ...row, phase: 'Growth' });
  }

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(corpus - totalInvested),
    totalValue: Math.round(corpus),
    yearlyBreakdown,
    growthBreakdown,
  };
}

// ── Hybrid Life-Stage Calculator ─────────────────
export interface LifeStageStepUpConfig {
  investmentMode: 'constant' | 'step-up';
  stepUpType?: 'amount' | 'percentage';
  stepUpValue?: number;
  withdrawalMode: 'constant' | 'incremental';
  withdrawIncrementType?: 'amount' | 'percentage';
  withdrawIncrementValue?: number;
}

export interface LifeStageYearData {
  year: number;
  phase: 'invest' | 'grow' | 'withdraw';
  invested: number;
  withdrawn: number;
  corpus: number;
  monthlySIP?: number;
  monthlyWithdrawal?: number;
}

export interface LifeStageResult {
  // Phase 1: Investment
  phase1_totalInvested: number;
  phase1_corpusAtEnd: number;
  phase1_returns: number;
  // Phase 2: Growth (no new investment)
  phase2_corpusAtEnd: number;
  phase2_growthAmount: number;
  // Phase 3: Withdrawal
  phase3_totalWithdrawn: number;
  phase3_remainingCorpus: number;
  phase3_corpusLasts: boolean;
  // Year-by-year combined breakdown
  yearlyBreakdown: LifeStageYearData[];
}

export function calculateLifeStage(
  monthlyInvestment: number,
  investmentReturn: number,
  investYears: number,
  growYears: number,
  withdrawalReturn: number,
  monthlyWithdrawal: number,
  withdrawYears: number,
  stepUpConfig?: LifeStageStepUpConfig
): LifeStageResult {
  const investMonthlyRate = investmentReturn / 100 / 12;
  const withdrawMonthlyRate = withdrawalReturn / 100 / 12;
  const yearlyBreakdown: LifeStageYearData[] = [];

  let corpus = 0;
  let totalInvested = 0;
  let totalWithdrawn = 0;
  let yearCounter = 0;

  // ── Phase 1: Invest ──
  let currentMonthlySIP = monthlyInvestment;
  for (let y = 1; y <= investYears; y++) {
    yearCounter++;
    for (let m = 0; m < 12; m++) {
      totalInvested += currentMonthlySIP;
      corpus = (corpus + currentMonthlySIP) * (1 + investMonthlyRate);
    }
    yearlyBreakdown.push({
      year: yearCounter,
      phase: 'invest',
      invested: Math.round(totalInvested),
      withdrawn: 0,
      corpus: Math.round(corpus),
      monthlySIP: Math.round(currentMonthlySIP),
    });
    // Step-up at end of year for next year
    if (stepUpConfig?.investmentMode === 'step-up' && y < investYears) {
      if (stepUpConfig.stepUpType === 'amount') {
        currentMonthlySIP += (stepUpConfig.stepUpValue ?? 0);
      } else if (stepUpConfig.stepUpType === 'percentage') {
        currentMonthlySIP *= (1 + (stepUpConfig.stepUpValue ?? 0) / 100);
      }
    }
  }

  const phase1_corpusAtEnd = Math.round(corpus);
  const phase1_totalInvested = Math.round(totalInvested);
  const phase1_returns = phase1_corpusAtEnd - phase1_totalInvested;

  // ── Phase 2: Grow (compound with no new investment) ──
  for (let y = 1; y <= growYears; y++) {
    yearCounter++;
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + investMonthlyRate);
    }
    yearlyBreakdown.push({
      year: yearCounter,
      phase: 'grow',
      invested: Math.round(totalInvested),
      withdrawn: 0,
      corpus: Math.round(corpus),
    });
  }

  const phase2_corpusAtEnd = Math.round(corpus);
  const phase2_growthAmount = phase2_corpusAtEnd - phase1_corpusAtEnd;

  // ── Phase 3: Withdraw ──
  let corpusLasts = true;
  let currentMonthlyWithdrawal = monthlyWithdrawal;

  for (let y = 1; y <= withdrawYears; y++) {
    yearCounter++;
    let yearWithdrawn = 0;

    for (let m = 0; m < 12; m++) {
      const interest = corpus * withdrawMonthlyRate;
      corpus = corpus + interest - currentMonthlyWithdrawal;
      yearWithdrawn += currentMonthlyWithdrawal;

      if (corpus <= 0) {
        corpus = 0;
        totalWithdrawn += yearWithdrawn;
        corpusLasts = false;
        yearlyBreakdown.push({
          year: yearCounter,
          phase: 'withdraw',
          invested: Math.round(totalInvested),
          withdrawn: Math.round(totalWithdrawn),
          corpus: 0,
          monthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
        });
        // Fill remaining years with zero corpus
        for (let ry = y + 1; ry <= withdrawYears; ry++) {
          yearCounter++;
          yearlyBreakdown.push({
            year: yearCounter,
            phase: 'withdraw',
            invested: Math.round(totalInvested),
            withdrawn: Math.round(totalWithdrawn),
            corpus: 0,
            monthlyWithdrawal: 0,
          });
        }
        return {
          phase1_totalInvested,
          phase1_corpusAtEnd,
          phase1_returns,
          phase2_corpusAtEnd,
          phase2_growthAmount,
          phase3_totalWithdrawn: Math.round(totalWithdrawn),
          phase3_remainingCorpus: 0,
          phase3_corpusLasts: false,
          yearlyBreakdown,
        };
      }
    }

    totalWithdrawn += yearWithdrawn;
    yearlyBreakdown.push({
      year: yearCounter,
      phase: 'withdraw',
      invested: Math.round(totalInvested),
      withdrawn: Math.round(totalWithdrawn),
      corpus: Math.round(corpus),
      monthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
    });

    // Increment withdrawal at end of year for next year
    if (stepUpConfig?.withdrawalMode === 'incremental' && y < withdrawYears) {
      if (stepUpConfig.withdrawIncrementType === 'amount') {
        currentMonthlyWithdrawal += (stepUpConfig.withdrawIncrementValue ?? 0);
      } else if (stepUpConfig.withdrawIncrementType === 'percentage') {
        currentMonthlyWithdrawal *= (1 + (stepUpConfig.withdrawIncrementValue ?? 0) / 100);
      }
    }
  }

  return {
    phase1_totalInvested,
    phase1_corpusAtEnd,
    phase1_returns,
    phase2_corpusAtEnd,
    phase2_growthAmount,
    phase3_totalWithdrawn: Math.round(totalWithdrawn),
    phase3_remainingCorpus: Math.round(Math.max(0, corpus)),
    phase3_corpusLasts: corpusLasts,
    yearlyBreakdown,
  };
}

// ── Lifeline Financial Planner ────────────────────
export type LifelineEventType = 'sip' | 'lumpsum_invest' | 'swp' | 'lumpsum_withdraw';

export interface LifelineEvent {
  id: number;
  type: LifelineEventType;
  startYear: number;
  label?: string;
  // SIP fields
  monthlyAmount?: number;
  duration?: number;
  stepUpEnabled?: boolean;
  stepUpType?: 'amount' | 'percentage';
  stepUpValue?: number;
  // Lump sum fields
  amount?: number;
  // SWP fields
  withdrawalAmount?: number;
  incrementEnabled?: boolean;
  incrementType?: 'amount' | 'percentage';
  incrementValue?: number;
  // Per-event return rate (used during SWP to model lower returns during withdrawal phase)
  returnRate?: number;
}

export interface LifelineYearData {
  year: number;
  openingCorpus: number;
  sipInflows: number;
  lumpsumInflows: number;
  swpOutflows: number;
  lumpsumOutflows: number;
  interestEarned: number;
  closingCorpus: number;
  totalInvested: number;
  totalWithdrawn: number;
  activeEvents: string[];
  corpusDepleted: boolean;
}

export interface LifelineResult {
  yearlyData: LifelineYearData[];
  totalInvested: number;
  totalWithdrawn: number;
  netInvested: number;
  finalCorpus: number;
  totalReturns: number;
  peakCorpus: number;
  peakCorpusYear: number;
  corpusDepletedYear: number | null;
  effectiveReturn: number;
}

export function calculateLifeline(
  startingCorpus: number,
  annualReturn: number,
  planningHorizon: number,
  events: LifelineEvent[]
): LifelineResult {
  const monthlyRate = annualReturn / 100 / 12;
  const yearlyData: LifelineYearData[] = [];
  let corpus = startingCorpus;
  let totalInvested = startingCorpus;
  let totalWithdrawn = 0;
  let peakCorpus = startingCorpus;
  let peakCorpusYear = 0;
  let corpusDepletedYear: number | null = null;

  for (let y = 1; y <= planningHorizon; y++) {
    const openingCorpus = corpus;
    let yearSipInflows = 0;
    let yearLumpsumInflows = 0;
    let yearSwpOutflows = 0;
    let yearLumpsumOutflows = 0;
    let yearInterest = 0;
    let depleted = false;
    const activeLabels: string[] = [];

    // 1. Lump sum investments at start of year
    events.forEach((ev) => {
      if (ev.type === 'lumpsum_invest' && ev.startYear === y) {
        const amt = ev.amount ?? 0;
        corpus += amt;
        yearLumpsumInflows += amt;
        totalInvested += amt;
        activeLabels.push(ev.label || 'Lump Sum Investment');
      }
    });

    // 2. Lump sum withdrawals at start of year
    events.forEach((ev) => {
      if (ev.type === 'lumpsum_withdraw' && ev.startYear === y) {
        const amt = Math.min(ev.amount ?? 0, corpus);
        corpus -= amt;
        yearLumpsumOutflows += amt;
        totalWithdrawn += amt;
        activeLabels.push(ev.label || 'Lump Sum Withdrawal');
        if (corpus <= 0) { corpus = 0; depleted = true; }
      }
    });

    // 3. Determine active SIPs and SWPs
    const activeSIPs = events.filter(
      (ev) => ev.type === 'sip' && y >= ev.startYear && y < ev.startYear + (ev.duration ?? 0)
    );
    const activeSWPs = events.filter(
      (ev) => ev.type === 'swp' && y >= ev.startYear && y < ev.startYear + (ev.duration ?? 0)
    );

    activeSIPs.forEach((ev) => activeLabels.push(ev.label || 'SIP'));
    activeSWPs.forEach((ev) => activeLabels.push(ev.label || 'SWP'));

    // 4. Determine effective monthly rate for this year
    // If any SWP has a custom returnRate, use the lowest SWP return rate for this year
    // (conservative approach — during withdrawal, portfolio is typically more conservative)
    let effectiveMonthlyRate = monthlyRate;
    if (activeSWPs.length > 0) {
      const swpRates = activeSWPs
        .map((ev) => ev.returnRate)
        .filter((r): r is number => r !== undefined && r > 0);
      if (swpRates.length > 0) {
        const lowestSwpReturn = Math.min(...swpRates);
        effectiveMonthlyRate = lowestSwpReturn / 100 / 12;
      }
    }

    // 5. Monthly loop
    for (let m = 0; m < 12; m++) {
      // Add SIP amounts
      activeSIPs.forEach((ev) => {
        const yearIndex = y - ev.startYear;
        let monthlyAmt = ev.monthlyAmount ?? 0;
        if (ev.stepUpEnabled && yearIndex > 0) {
          if (ev.stepUpType === 'percentage') {
            monthlyAmt = (ev.monthlyAmount ?? 0) * Math.pow(1 + (ev.stepUpValue ?? 0) / 100, yearIndex);
          } else {
            monthlyAmt = (ev.monthlyAmount ?? 0) + (ev.stepUpValue ?? 0) * yearIndex;
          }
        }
        corpus += monthlyAmt;
        yearSipInflows += monthlyAmt;
        totalInvested += monthlyAmt;
      });

      // Subtract SWP amounts
      activeSWPs.forEach((ev) => {
        const yearIndex = y - ev.startYear;
        let withdrawAmt = ev.withdrawalAmount ?? 0;
        if (ev.incrementEnabled && yearIndex > 0) {
          if (ev.incrementType === 'percentage') {
            withdrawAmt = (ev.withdrawalAmount ?? 0) * Math.pow(1 + (ev.incrementValue ?? 0) / 100, yearIndex);
          } else {
            withdrawAmt = (ev.withdrawalAmount ?? 0) + (ev.incrementValue ?? 0) * yearIndex;
          }
        }
        const actualWithdraw = Math.min(withdrawAmt, corpus);
        corpus -= actualWithdraw;
        yearSwpOutflows += actualWithdraw;
        totalWithdrawn += actualWithdraw;
      });

      // Compound interest (uses effective rate — may be lower during SWP years)
      const interest = corpus * effectiveMonthlyRate;
      yearInterest += interest;
      corpus += interest;

      if (corpus <= 0) { corpus = 0; depleted = true; }
    }

    if (corpus > peakCorpus) { peakCorpus = corpus; peakCorpusYear = y; }
    if (depleted && corpusDepletedYear === null) { corpusDepletedYear = y; }

    yearlyData.push({
      year: y,
      openingCorpus: Math.round(openingCorpus),
      sipInflows: Math.round(yearSipInflows),
      lumpsumInflows: Math.round(yearLumpsumInflows),
      swpOutflows: Math.round(yearSwpOutflows),
      lumpsumOutflows: Math.round(yearLumpsumOutflows),
      interestEarned: Math.round(yearInterest),
      closingCorpus: Math.round(Math.max(0, corpus)),
      totalInvested: Math.round(totalInvested),
      totalWithdrawn: Math.round(totalWithdrawn),
      activeEvents: [...new Set(activeLabels)],
      corpusDepleted: depleted,
    });
  }

  const netInvested = totalInvested - totalWithdrawn;
  const totalReturns = corpus - netInvested;
  let effectiveReturn = 0;
  if (netInvested > 0 && corpus > 0 && planningHorizon > 0) {
    effectiveReturn = (Math.pow(corpus / netInvested, 1 / planningHorizon) - 1) * 100;
  }

  return {
    yearlyData,
    totalInvested: Math.round(totalInvested),
    totalWithdrawn: Math.round(totalWithdrawn),
    netInvested: Math.round(netInvested),
    finalCorpus: Math.round(Math.max(0, corpus)),
    totalReturns: Math.round(totalReturns),
    peakCorpus: Math.round(peakCorpus),
    peakCorpusYear,
    corpusDepletedYear,
    effectiveReturn: Math.round(effectiveReturn * 10) / 10,
  };
}

// ── Daily SIP Calculator ─────────────────────────
export function calculateDailySIP(
  dailyAmount: number,
  annualReturn: number,
  years: number,
  mode: 'calendar' | 'working'
): { totalInvested: number; estimatedReturns: number; totalValue: number; daysPerMonth: number; monthlyEquivalent: number } {
  const daysPerMonth = mode === 'calendar' ? 30 : 22;
  const daysPerYear = mode === 'calendar' ? 365 : 264;
  const dailyRate = annualReturn / 100 / daysPerYear;
  const totalDays = daysPerYear * years;

  let corpus = 0;
  for (let d = 0; d < totalDays; d++) {
    corpus = (corpus + dailyAmount) * (1 + dailyRate);
  }

  const totalInvested = dailyAmount * daysPerMonth * 12 * years;
  return {
    totalInvested,
    estimatedReturns: Math.round(corpus - totalInvested),
    totalValue: Math.round(corpus),
    daysPerMonth,
    monthlyEquivalent: dailyAmount * daysPerMonth,
  };
}

export function calculateDailySIPBreakdown(
  dailyAmount: number,
  annualReturn: number,
  years: number,
  mode: 'calendar' | 'working'
): { year: number; invested: number; value: number; returns: number; growthPercent: number }[] {
  const daysPerYear = mode === 'calendar' ? 365 : 264;
  const daysPerMonth = mode === 'calendar' ? 30 : 22;
  const dailyRate = annualReturn / 100 / daysPerYear;
  const breakdown: { year: number; invested: number; value: number; returns: number; growthPercent: number }[] = [];

  let corpus = 0;
  for (let y = 1; y <= years; y++) {
    for (let d = 0; d < daysPerYear; d++) {
      corpus = (corpus + dailyAmount) * (1 + dailyRate);
    }
    const invested = dailyAmount * daysPerMonth * 12 * y;
    breakdown.push({
      year: y,
      invested,
      value: Math.round(corpus),
      returns: Math.round(corpus - invested),
      growthPercent: invested > 0 ? ((corpus - invested) / invested) * 100 : 0,
    });
  }
  return breakdown;
}

// ── Lumpsum Planner with Cash Flows ──────────
export interface LumpsumCashFlow {
  year: number;
  type: 'invest' | 'withdraw';
  amount: number;
}

export interface LumpsumPlannerYearData {
  year: number;
  openingBalance: number;
  investmentAdded: number;
  withdrawal: number;
  interestEarned: number;
  closingBalance: number;
  totalInvested: number;
  totalWithdrawn: number;
}

export interface LumpsumPlannerResult {
  yearlyData: LumpsumPlannerYearData[];
  totalInvested: number;
  totalWithdrawn: number;
  netInvested: number;
  finalValue: number;
  totalReturns: number;
  effectiveReturn: number;
}

export function calculateLumpsumPlanner(
  initialAmount: number,
  annualReturn: number,
  years: number,
  cashFlows: LumpsumCashFlow[]
): LumpsumPlannerResult {
  const rate = annualReturn / 100;
  const yearlyData: LumpsumPlannerYearData[] = [];
  let totalInvested = initialAmount;
  let totalWithdrawn = 0;
  let corpus = initialAmount;

  for (let y = 1; y <= years; y++) {
    const openingBalance = corpus;

    // Gather cash flows for this year
    const yearInvestments = cashFlows
      .filter((cf) => cf.year === y && cf.type === 'invest')
      .reduce((sum, cf) => sum + cf.amount, 0);
    const yearWithdrawals = cashFlows
      .filter((cf) => cf.year === y && cf.type === 'withdraw')
      .reduce((sum, cf) => sum + cf.amount, 0);

    // Add investments at start of year
    corpus += yearInvestments;
    totalInvested += yearInvestments;

    // Subtract withdrawals at start of year
    corpus -= yearWithdrawals;
    totalWithdrawn += yearWithdrawals;

    // Clamp to zero if withdrawal exceeded corpus
    if (corpus < 0) corpus = 0;

    // Compound for the year
    const interestEarned = corpus * rate;
    corpus += interestEarned;

    yearlyData.push({
      year: y,
      openingBalance: Math.round(openingBalance),
      investmentAdded: Math.round(yearInvestments),
      withdrawal: Math.round(yearWithdrawals),
      interestEarned: Math.round(interestEarned),
      closingBalance: Math.round(corpus),
      totalInvested: Math.round(totalInvested),
      totalWithdrawn: Math.round(totalWithdrawn),
    });
  }

  const netInvested = totalInvested - totalWithdrawn;
  const totalReturns = corpus - netInvested;

  // Effective annualized return: (finalValue / netInvested)^(1/years) - 1
  let effectiveReturn = 0;
  if (netInvested > 0 && corpus > 0 && years > 0) {
    effectiveReturn = (Math.pow(corpus / netInvested, 1 / years) - 1) * 100;
  }

  return {
    yearlyData,
    totalInvested: Math.round(totalInvested),
    totalWithdrawn: Math.round(totalWithdrawn),
    netInvested: Math.round(netInvested),
    finalValue: Math.round(corpus),
    totalReturns: Math.round(totalReturns),
    effectiveReturn: Math.round(effectiveReturn * 10) / 10,
  };
}

export function calculateDailySIPWithGrowth(
  dailyAmount: number,
  annualReturn: number,
  sipYears: number,
  totalYears: number,
  mode: 'calendar' | 'working'
): { result: { totalInvested: number; estimatedReturns: number; totalValue: number; daysPerMonth: number; monthlyEquivalent: number }; breakdown: { year: number; invested: number; value: number; returns: number; growthPercent: number; phase: 'SIP' | 'Growth' }[] } {
  const daysPerYear = mode === 'calendar' ? 365 : 264;
  const daysPerMonth = mode === 'calendar' ? 30 : 22;
  const dailyRate = annualReturn / 100 / daysPerYear;
  const breakdown: { year: number; invested: number; value: number; returns: number; growthPercent: number; phase: 'SIP' | 'Growth' }[] = [];

  let corpus = 0;
  const totalInvested = dailyAmount * daysPerMonth * 12 * sipYears;

  // Phase 1: Active SIP
  for (let y = 1; y <= sipYears; y++) {
    for (let d = 0; d < daysPerYear; d++) {
      corpus = (corpus + dailyAmount) * (1 + dailyRate);
    }
    const invested = dailyAmount * daysPerMonth * 12 * y;
    breakdown.push({
      year: y, invested, value: Math.round(corpus),
      returns: Math.round(corpus - invested),
      growthPercent: invested > 0 ? ((corpus - invested) / invested) * 100 : 0,
      phase: 'SIP',
    });
  }

  // Phase 2: Growth only
  for (let y = sipYears + 1; y <= totalYears; y++) {
    for (let d = 0; d < daysPerYear; d++) {
      corpus = corpus * (1 + dailyRate);
    }
    breakdown.push({
      year: y, invested: totalInvested, value: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      growthPercent: totalInvested > 0 ? ((corpus - totalInvested) / totalInvested) * 100 : 0,
      phase: 'Growth',
    });
  }

  return {
    result: {
      totalInvested,
      estimatedReturns: Math.round(corpus - totalInvested),
      totalValue: Math.round(corpus),
      daysPerMonth,
      monthlyEquivalent: dailyAmount * daysPerMonth,
    },
    breakdown,
  };
}

// ── Term Plan Regular Pay + SIP vs Limited Pay ──
export interface TermPlanSIPYearRow {
  year: number;
  phase: 'accumulation' | 'distribution';
  regularPremium: number;
  limitedPremium: number;
  sipInvestment: number;
  withdrawal: number;
  corpusValue: number;
  interestEarned: number;
}

export interface TermPlanSIPResult {
  yearlyData: TermPlanSIPYearRow[];
  sipCorpusAtSwitch: number;
  remainingCorpusAtMaturity: number;
  totalRegularPremiums: number;
  totalLimitedPremiums: number;
  totalSIPInvested: number;
  totalWithdrawnForPremiums: number;
  premiumDifferenceSaved: number;
  corpusLasts: number;
  verdict: 'wins' | 'exact' | 'shortfall';
}

export function calculateTermPlanSIP(
  policyTerm: number,
  regularPremium: number,
  limitedPremium: number,
  limitedPayPeriod: number,
  accumulationReturn: number,
  distributionReturn: number,
  frequency: 'monthly' | 'yearly',
  extraLumpsum: number = 0,
  lumpsumYear: number = 1,
  extraWithdrawal: number = 0,
  withdrawalYear: number = 0,
): TermPlanSIPResult {
  const premiumDiff = Math.max(0, limitedPremium - regularPremium);
  const yearlyData: TermPlanSIPYearRow[] = [];

  let corpus = 0;
  let totalSIPInvested = 0;
  let totalWithdrawn = 0;
  let sipCorpusAtSwitch = 0;
  let corpusLasts = policyTerm;
  let corpusDepleted = false;

  // Phase 1: Accumulation (year 1 to limitedPayPeriod)
  const accMonthlyRate = accumulationReturn / 100 / 12;

  for (let y = 1; y <= limitedPayPeriod; y++) {
    let yearInterest = 0;
    let yearSIP = 0;

    if (frequency === 'monthly') {
      const monthlySIP = premiumDiff / 12;
      for (let m = 0; m < 12; m++) {
        const interest = corpus * accMonthlyRate;
        yearInterest += interest;
        corpus += interest + monthlySIP;
        yearSIP += monthlySIP;
      }
    } else {
      // Yearly: invest full difference at start of year, compound monthly
      corpus += premiumDiff;
      yearSIP = premiumDiff;
      for (let m = 0; m < 12; m++) {
        const interest = corpus * accMonthlyRate;
        yearInterest += interest;
        corpus += interest;
      }
    }

    // Add lumpsum if applicable
    if (extraLumpsum > 0 && y === lumpsumYear) {
      corpus += extraLumpsum;
      yearSIP += extraLumpsum;
    }

    totalSIPInvested += yearSIP;

    yearlyData.push({
      year: y,
      phase: 'accumulation',
      regularPremium: regularPremium,
      limitedPremium: limitedPremium,
      sipInvestment: Math.round(yearSIP),
      withdrawal: 0,
      corpusValue: Math.round(corpus),
      interestEarned: Math.round(yearInterest),
    });
  }

  sipCorpusAtSwitch = Math.round(corpus);

  // Phase 2: Distribution (limitedPayPeriod+1 to policyTerm)
  const distMonthlyRate = distributionReturn / 100 / 12;

  for (let y = limitedPayPeriod + 1; y <= policyTerm; y++) {
    if (corpusDepleted) {
      yearlyData.push({
        year: y,
        phase: 'distribution',
        regularPremium: regularPremium,
        limitedPremium: 0,
        sipInvestment: 0,
        withdrawal: 0,
        corpusValue: 0,
        interestEarned: 0,
      });
      continue;
    }

    let yearInterest = 0;
    let yearWithdrawn = 0;

    // Extra one-time withdrawal in specified year
    const yearExtraWithdrawal = (extraWithdrawal > 0 && y === withdrawalYear) ? extraWithdrawal : 0;

    if (frequency === 'monthly') {
      const monthlyPremium = regularPremium / 12;
      for (let m = 0; m < 12; m++) {
        const interest = corpus * distMonthlyRate;
        yearInterest += interest;
        corpus += interest;
        corpus -= monthlyPremium;
        yearWithdrawn += monthlyPremium;

        // Apply extra withdrawal at start of year (first month)
        if (m === 0 && yearExtraWithdrawal > 0) {
          corpus -= yearExtraWithdrawal;
          yearWithdrawn += yearExtraWithdrawal;
        }

        if (corpus <= 0) {
          corpus = 0;
          corpusDepleted = true;
          corpusLasts = y - 1 + (m + 1) / 12;
          break;
        }
      }
    } else {
      // Yearly: compound for the year, then deduct premium + extra withdrawal at year end
      for (let m = 0; m < 12; m++) {
        const interest = corpus * distMonthlyRate;
        yearInterest += interest;
        corpus += interest;
      }
      corpus -= regularPremium;
      corpus -= yearExtraWithdrawal;
      yearWithdrawn = regularPremium + yearExtraWithdrawal;

      if (corpus <= 0) {
        corpus = 0;
        corpusDepleted = true;
        corpusLasts = y;
      }
    }

    totalWithdrawn += yearWithdrawn;

    yearlyData.push({
      year: y,
      phase: 'distribution',
      regularPremium: regularPremium,
      limitedPremium: 0,
      sipInvestment: 0,
      withdrawal: Math.round(yearWithdrawn),
      corpusValue: Math.round(Math.max(0, corpus)),
      interestEarned: Math.round(yearInterest),
    });
  }

  const remaining = Math.round(Math.max(0, corpus));
  let verdict: 'wins' | 'exact' | 'shortfall';
  if (remaining > 1000) {
    verdict = 'wins';
  } else if (!corpusDepleted) {
    verdict = 'exact';
  } else {
    verdict = 'shortfall';
  }

  return {
    yearlyData,
    sipCorpusAtSwitch,
    remainingCorpusAtMaturity: remaining,
    totalRegularPremiums: regularPremium * policyTerm,
    totalLimitedPremiums: limitedPremium * limitedPayPeriod,
    totalSIPInvested: Math.round(totalSIPInvested),
    totalWithdrawnForPremiums: Math.round(totalWithdrawn),
    premiumDifferenceSaved: premiumDiff * limitedPayPeriod,
    corpusLasts: Math.round(corpusLasts * 10) / 10,
    verdict,
  };
}
