// Trustner Financial Planning — Core Calculation Engine
// CFP-grade financial calculations for health score, gap analysis, and action planning

import type {
  FinancialPlanningData,
  PillarGrade,
  PillarScore,
  FinancialHealthScore,
  GoalGapResult,
  InsuranceGapResult,
  AssetAllocation,
  ActionItem,
  FinancialHealthReport,
  TeaserData,
  GoalType,
} from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Local helpers (no external imports so this file works server + client)
// ---------------------------------------------------------------------------

function formatAmount(n: number): string {
  if (n < 0) return '-' + formatAmount(-n);
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return '₹' + (cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)) + ' Cr';
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return '₹' + (l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)) + ' L';
  }
  if (n >= 1_000) {
    return '₹' + (n / 1_000).toFixed(1) + 'K';
  }
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Grade mapping
// ---------------------------------------------------------------------------

function getGrade(score: number, maxScore: number): PillarGrade {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.83) return 'Excellent';
  if (pct >= 0.67) return 'Good';
  if (pct >= 0.50) return 'Fair';
  if (pct >= 0.33) return 'Needs Attention';
  return 'Critical';
}

// ---------------------------------------------------------------------------
// Income / outflow helpers
// ---------------------------------------------------------------------------

function getTotalMonthlyIncome(data: FinancialPlanningData): number {
  const inc = data.incomeProfile;
  return (
    inc.monthlyInHandSalary +
    inc.annualBonus / 12 +
    inc.rentalIncome +
    inc.businessIncome +
    inc.otherIncome
  );
}

function getTotalMonthlyOutflow(data: FinancialPlanningData): number {
  const inc = data.incomeProfile;
  return (
    inc.monthlyHouseholdExpenses +
    inc.monthlyEMIs +
    inc.monthlyRent +
    inc.monthlySIPsRunning +
    inc.monthlyInsurancePremiums
  );
}

// ---------------------------------------------------------------------------
// Goal-specific inflation and return helpers
// ---------------------------------------------------------------------------

function getGoalInflationRate(goalType: GoalType): number {
  switch (goalType) {
    case 'child-education':
      return 0.10;
    // medical-related goals would use 12%, but GoalType doesn't have a medical type
    case 'child-marriage':
    case 'house-purchase':
    case 'car-purchase':
    case 'vacation':
    case 'emergency-fund':
    case 'wealth-creation':
    case 'early-retirement':
    case 'retirement':
    case 'custom':
    default:
      return 0.06;
  }
}

function getReturnForHorizon(years: number, risk: string): number {
  let base: number;
  if (years < 3) base = 0.07;
  else if (years < 5) base = 0.09;
  else if (years < 10) base = 0.11;
  else base = 0.12;

  if (risk === 'conservative') return base - 0.04;
  if (risk === 'moderate') return base - 0.02;
  return base; // aggressive
}

// ---------------------------------------------------------------------------
// FV / PV math helpers
// ---------------------------------------------------------------------------

/** Future value of a lump sum */
function fvLumpSum(pv: number, rate: number, years: number): number {
  return pv * Math.pow(1 + rate, years);
}

/** Future value of monthly SIP (annuity) */
function fvSIP(monthly: number, annualRate: number, years: number): number {
  if (annualRate <= 0 || years <= 0) return monthly * years * 12;
  const r = annualRate / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

/** Present value annuity factor: PMT * factor = PV for given real rate & months */
function pvAnnuityFactor(realAnnualRate: number, months: number): number {
  if (realAnnualRate <= 0) return months;
  const r = realAnnualRate / 12;
  return (1 - Math.pow(1 + r, -months)) / r;
}

/** SIP FV factor: how much ₹1/month becomes after n months at annual rate */
function sipFvFactor(annualRate: number, months: number): number {
  if (annualRate <= 0 || months <= 0) return months;
  const r = annualRate / 12;
  return ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

// =========================================================================
// 1. CASHFLOW PILLAR
// =========================================================================

export function calculateCashflowScore(data: FinancialPlanningData): PillarScore {
  const income = getTotalMonthlyIncome(data);
  const outflow = getTotalMonthlyOutflow(data);
  const monthlySavings = income - outflow;
  const savingsRate = income > 0 ? monthlySavings / income : 0;
  const inc = data.incomeProfile;

  // --- Savings rate (0-80) ---
  let savingsPoints: number;
  if (savingsRate >= 0.40) savingsPoints = 80;
  else if (savingsRate >= 0.30) savingsPoints = 65;
  else if (savingsRate >= 0.20) savingsPoints = 50;
  else if (savingsRate >= 0.10) savingsPoints = 30;
  else if (savingsRate >= 0) savingsPoints = 15;
  else savingsPoints = 0;

  // --- Income diversification (0-40) ---
  let sources = 0;
  if (inc.monthlyInHandSalary > 0) sources++;
  if (inc.rentalIncome > 0) sources++;
  if (inc.businessIncome > 0) sources++;
  if (inc.otherIncome > 0) sources++;
  const diversificationPoints = Math.min(40, sources * 15);

  // --- SIP discipline (0-30) ---
  const sipRatio = income > 0 ? inc.monthlySIPsRunning / income : 0;
  let sipPoints: number;
  if (sipRatio >= 0.20) sipPoints = 30;
  else if (sipRatio >= 0.10) sipPoints = 20;
  else if (sipRatio > 0) sipPoints = 10;
  else sipPoints = 0;

  // --- Income stability (0-30) ---
  let stabilityPoints: number;
  switch (data.careerProfile.incomeStability) {
    case 'very-stable': stabilityPoints = 30; break;
    case 'stable': stabilityPoints = 22; break;
    case 'variable': stabilityPoints = 12; break;
    case 'highly-variable': stabilityPoints = 5; break;
    default: stabilityPoints = 12;
  }

  const score = savingsPoints + diversificationPoints + sipPoints + stabilityPoints;

  // Key insight based on savings rate
  let keyInsight: string;
  if (savingsRate >= 0.30) {
    keyInsight = `Excellent savings rate of ${(savingsRate * 100).toFixed(0)}% — you're saving ${formatAmount(monthlySavings)}/month.`;
  } else if (savingsRate >= 0.20) {
    keyInsight = `Good savings rate of ${(savingsRate * 100).toFixed(0)}%. Aim for 30%+ to accelerate wealth creation.`;
  } else if (savingsRate >= 0.10) {
    keyInsight = `Savings rate of ${(savingsRate * 100).toFixed(0)}% is below optimal. Target at least 20% to meet long-term goals.`;
  } else if (savingsRate >= 0) {
    keyInsight = `Very low savings rate of ${(savingsRate * 100).toFixed(0)}%. Immediate expense review needed.`;
  } else {
    keyInsight = `Negative cashflow — you're spending more than you earn. Urgent expense restructuring required.`;
  }

  return {
    name: 'Cashflow Management',
    score,
    maxScore: 180,
    grade: getGrade(score, 180),
    keyInsight,
  };
}

// =========================================================================
// 2. PROTECTION PILLAR
// =========================================================================

export function calculateCashflowScoreHelper_HLV(data: FinancialPlanningData): number {
  return calculateHLV(data);
}

export function calculateProtectionScore(data: FinancialPlanningData): PillarScore {
  const ins = data.insuranceProfile;
  const emg = data.emergencyProfile;
  const income = getTotalMonthlyIncome(data);
  const monthlyExpenses = data.incomeProfile.monthlyHouseholdExpenses;

  // --- Life insurance adequacy (0-70) ---
  const hlv = calculateHLV(data);
  const totalLifeCover = ins.termInsuranceCover + ins.lifeInsuranceCover;
  const lifeRatio = hlv > 0 ? totalLifeCover / hlv : (totalLifeCover > 0 ? 1 : 0);
  let lifePoints: number;
  if (lifeRatio >= 1.0) lifePoints = 70;
  else if (lifeRatio >= 0.70) lifePoints = 50;
  else if (lifeRatio >= 0.50) lifePoints = 35;
  else if (lifeRatio >= 0.30) lifePoints = 20;
  else if (totalLifeCover > 0) lifePoints = 10;
  else lifePoints = 0;

  // --- Health insurance (0-50) ---
  const healthNeedMap = { metro: 25_00_000, tier1: 15_00_000, tier2: 10_00_000, tier3: 5_00_000 };
  const healthNeed = healthNeedMap[data.personalProfile.cityTier] ?? 15_00_000;
  const healthRatio = healthNeed > 0 ? ins.healthInsuranceCover / healthNeed : 0;
  let healthPoints: number;
  if (healthRatio >= 1.0) healthPoints = 50;
  else if (healthRatio >= 0.60) healthPoints = 35;
  else if (ins.healthInsuranceCover > 0) healthPoints = 15;
  else healthPoints = 0;

  // --- Emergency fund (0-40) ---
  const monthsCovered = monthlyExpenses > 0 ? emg.emergencyFundAmount / monthlyExpenses : 0;
  let emergencyPoints: number;
  if (monthsCovered >= 6) emergencyPoints = 40;
  else if (monthsCovered >= 3) emergencyPoints = 25;
  else if (monthsCovered >= 1) emergencyPoints = 10;
  else emergencyPoints = 0;

  // --- Critical illness + Accident (0-20) ---
  let additionalPoints = 0;
  if (ins.hasCriticalIllnessCover) additionalPoints += 10;
  if (ins.hasAccidentalCover) additionalPoints += 10;

  const score = lifePoints + healthPoints + emergencyPoints + additionalPoints;

  // Key insight based on biggest gap
  let keyInsight: string;
  const lifeGap = hlv - totalLifeCover;
  const healthGap = healthNeed - ins.healthInsuranceCover;
  const emergencyGapMonths = Math.max(0, 6 - monthsCovered);

  if (lifeGap > healthGap && lifeGap > 0) {
    keyInsight = `Life insurance gap of ${formatAmount(lifeGap)} — your family needs ${formatAmount(hlv)} cover but you have ${formatAmount(totalLifeCover)}.`;
  } else if (healthGap > 0) {
    keyInsight = `Health insurance gap of ${formatAmount(healthGap)} — for your city tier, ${formatAmount(healthNeed)} cover is recommended.`;
  } else if (emergencyGapMonths > 0) {
    keyInsight = `Emergency fund covers only ${monthsCovered.toFixed(1)} months. Build it to at least 6 months (${formatAmount(monthlyExpenses * 6)}).`;
  } else {
    keyInsight = `Protection foundation is strong — life, health, and emergency fund are well-covered.`;
  }

  return {
    name: 'Protection & Insurance',
    score,
    maxScore: 180,
    grade: getGrade(score, 180),
    keyInsight,
  };
}

// =========================================================================
// 3. INVESTMENT PILLAR
// =========================================================================

export function calculateInvestmentScore(data: FinancialPlanningData): PillarScore {
  const assets = data.assetProfile;
  const income = getTotalMonthlyIncome(data);
  const annualIncome = income * 12;
  const salary = data.incomeProfile.monthlyInHandSalary;
  const age = data.personalProfile.age;

  const totalInvestments =
    assets.mutualFunds +
    assets.stocks +
    assets.ppfEpf +
    assets.nps +
    assets.gold +
    assets.realEstateInvestment +
    assets.fixedDeposits;

  // --- Investment-to-income multiple (0-60) ---
  const multiple = annualIncome > 0 ? totalInvestments / annualIncome : 0;
  let multiplePoints: number;
  if (multiple >= 5) multiplePoints = 60;
  else if (multiple >= 3) multiplePoints = 45;
  else if (multiple >= 1) multiplePoints = 30;
  else if (multiple >= 0.5) multiplePoints = 15;
  else multiplePoints = 0;

  // --- Asset allocation alignment (0-40) ---
  const equityAssets = assets.mutualFunds + assets.stocks;
  const equityPct = totalInvestments > 0 ? (equityAssets / totalInvestments) * 100 : 0;
  const idealEquity = Math.max(20, 100 - age);
  const deviation = Math.abs(equityPct - idealEquity);
  let allocationPoints: number;
  if (deviation <= 10) allocationPoints = 40;
  else if (deviation <= 20) allocationPoints = 28;
  else if (deviation <= 30) allocationPoints = 16;
  else allocationPoints = 5;

  // --- Diversification (0-40) ---
  let assetClasses = 0;
  if (assets.mutualFunds > 0) assetClasses++;
  if (assets.stocks > 0) assetClasses++;
  if (assets.ppfEpf > 0) assetClasses++;
  if (assets.nps > 0) assetClasses++;
  if (assets.gold > 0) assetClasses++;
  if (assets.realEstateInvestment > 0) assetClasses++;
  if (assets.fixedDeposits > 0) assetClasses++;
  const diversificationPoints = Math.min(40, assetClasses * 8);

  // --- SIP regularity (0-40) ---
  const sipSalaryRatio = salary > 0 ? data.incomeProfile.monthlySIPsRunning / salary : 0;
  let sipRegPoints: number;
  if (sipSalaryRatio >= 0.20) sipRegPoints = 40;
  else if (sipSalaryRatio >= 0.10) sipRegPoints = 25;
  else if (sipSalaryRatio > 0) sipRegPoints = 12;
  else sipRegPoints = 0;

  const score = multiplePoints + allocationPoints + diversificationPoints + sipRegPoints;

  // Key insight
  let keyInsight: string;
  if (assetClasses <= 2) {
    keyInsight = `Low diversification — only ${assetClasses} asset class(es). Spread across equity, debt, and gold for stability.`;
  } else if (deviation > 20) {
    keyInsight = `Asset allocation is off target — ${equityPct.toFixed(0)}% equity vs ideal ${idealEquity.toFixed(0)}% for your age.`;
  } else if (multiple < 1) {
    keyInsight = `Investment corpus is only ${multiple.toFixed(1)}x annual income. Build towards at least 3x for a solid base.`;
  } else {
    keyInsight = `Well-diversified across ${assetClasses} asset classes with ${equityPct.toFixed(0)}% in equity — solid foundation.`;
  }

  return {
    name: 'Investments',
    score,
    maxScore: 180,
    grade: getGrade(score, 180),
    keyInsight,
  };
}

// =========================================================================
// 4. DEBT PILLAR
// =========================================================================

export function calculateDebtScore(data: FinancialPlanningData): PillarScore {
  const income = getTotalMonthlyIncome(data);
  const liab = data.liabilityProfile;

  const totalEMI =
    liab.homeLoan.emi +
    liab.carLoan.emi +
    liab.personalLoan.emi +
    liab.educationLoan.emi;

  const totalDebt =
    liab.homeLoan.outstanding +
    liab.carLoan.outstanding +
    liab.personalLoan.outstanding +
    liab.educationLoan.outstanding +
    liab.creditCardDebt +
    liab.otherLoans;

  const goodDebt = liab.homeLoan.outstanding + liab.educationLoan.outstanding;

  // --- DTI ratio (0-80) ---
  const dti = income > 0 ? totalEMI / income : 0;
  let dtiPoints: number;
  if (totalEMI === 0) dtiPoints = 80;
  else if (dti <= 0.20) dtiPoints = 65;
  else if (dti <= 0.35) dtiPoints = 45;
  else if (dti <= 0.50) dtiPoints = 25;
  else dtiPoints = 5;

  // --- Debt quality (0-50) ---
  let qualityPoints: number;
  if (totalDebt === 0) {
    qualityPoints = 50;
  } else {
    const goodRatio = goodDebt / totalDebt;
    qualityPoints = Math.round(goodRatio * 50);
  }

  // --- Credit card debt (0-30) ---
  let ccPoints: number;
  if (liab.creditCardDebt === 0) ccPoints = 30;
  else if (liab.creditCardDebt <= 50_000) ccPoints = 15;
  else ccPoints = 0;

  // --- Remaining years (0-20) ---
  const maxRemainingYears = Math.max(
    liab.homeLoan.remainingYears,
    liab.carLoan.remainingYears,
    liab.personalLoan.remainingYears,
    liab.educationLoan.remainingYears
  );
  let remainingPoints: number;
  if (maxRemainingYears === 0) remainingPoints = 20;
  else if (maxRemainingYears <= 5) remainingPoints = 15;
  else if (maxRemainingYears <= 10) remainingPoints = 8;
  else remainingPoints = 0;

  const score = dtiPoints + qualityPoints + ccPoints + remainingPoints;

  // Key insight based on DTI
  let keyInsight: string;
  if (totalDebt === 0) {
    keyInsight = `Debt-free — excellent financial flexibility.`;
  } else if (dti <= 0.20) {
    keyInsight = `Healthy DTI of ${(dti * 100).toFixed(0)}% — EMIs are well within comfort zone.`;
  } else if (dti <= 0.35) {
    keyInsight = `DTI of ${(dti * 100).toFixed(0)}% is manageable but leaves less room for saving. Consider prepayments.`;
  } else {
    keyInsight = `DTI of ${(dti * 100).toFixed(0)}% is high — ${formatAmount(totalEMI)}/month in EMIs vs ${formatAmount(income)} income. Prioritize debt reduction.`;
  }

  return {
    name: 'Debt Management',
    score,
    maxScore: 180,
    grade: getGrade(score, 180),
    keyInsight,
  };
}

// =========================================================================
// 5. RETIREMENT READINESS PILLAR
// =========================================================================

export function calculateRetirementReadinessScore(data: FinancialPlanningData): PillarScore {
  const age = data.personalProfile.age;
  const retirementAge = data.careerProfile.expectedRetirementAge;
  const yearsToRetirement = Math.max(0, retirementAge - age);
  const yearsInRetirement = Math.max(0, 85 - retirementAge);
  const monthlyExpense = data.incomeProfile.monthlyHouseholdExpenses;
  const assets = data.assetProfile;
  const sip = data.incomeProfile.monthlySIPsRunning;

  // Future monthly expense at retirement
  const futureMonthlyExpense = monthlyExpense * Math.pow(1.06, yearsToRetirement);

  // Required corpus = futureMonthlyExpense × PV annuity factor at 3% real return
  const retirementMonths = yearsInRetirement * 12;
  const requiredCorpus = futureMonthlyExpense * pvAnnuityFactor(0.03, retirementMonths);

  // Current retirement savings projected forward
  const currentRetirementSavings = assets.ppfEpf + assets.nps + 0.5 * assets.mutualFunds;
  const projectedSavings = fvLumpSum(currentRetirementSavings, 0.10, yearsToRetirement);

  // SIP contribution to retirement (assume 50% of running SIPs)
  const retirementSIP = sip * 0.5;
  const sipCorpusAtRetirement = fvSIP(retirementSIP, 0.10, yearsToRetirement);

  const totalProjected = projectedSavings + sipCorpusAtRetirement;
  const readinessRatio = requiredCorpus > 0 ? totalProjected / requiredCorpus : 0;

  // --- Readiness (0-100) ---
  let readinessPoints: number;
  if (readinessRatio >= 1.0) readinessPoints = 100;
  else if (readinessRatio >= 0.70) readinessPoints = 75;
  else if (readinessRatio >= 0.50) readinessPoints = 50;
  else if (readinessRatio >= 0.30) readinessPoints = 30;
  else if (readinessRatio > 0) readinessPoints = 15;
  else readinessPoints = 0;

  // --- Years remaining bonus (0-40) ---
  let yearsPoints: number;
  if (yearsToRetirement >= 25) yearsPoints = 40;
  else if (yearsToRetirement >= 15) yearsPoints = 30;
  else if (yearsToRetirement >= 10) yearsPoints = 18;
  else if (yearsToRetirement >= 5) yearsPoints = 8;
  else yearsPoints = 0;

  // --- Active saving channels (0-40) ---
  const hasSIP = sip > 0;
  const hasEPF = assets.ppfEpf > 0;
  const hasNPS = assets.nps > 0;
  let activePoints: number;
  if (hasSIP && hasEPF && hasNPS) activePoints = 40;
  else if (hasSIP && hasEPF) activePoints = 28;
  else if (hasSIP) activePoints = 15;
  else activePoints = 0;

  const score = readinessPoints + yearsPoints + activePoints;

  // Key insight
  let keyInsight: string;
  if (readinessRatio >= 1.0) {
    keyInsight = `On track for retirement — projected corpus of ${formatAmount(totalProjected)} meets the ${formatAmount(requiredCorpus)} target.`;
  } else if (readinessRatio >= 0.50) {
    keyInsight = `${(readinessRatio * 100).toFixed(0)}% retirement-ready. You need an additional ${formatAmount(requiredCorpus - totalProjected)} corpus. ${yearsToRetirement} years remaining to close the gap.`;
  } else {
    keyInsight = `Only ${(readinessRatio * 100).toFixed(0)}% retirement-ready. Significant gap of ${formatAmount(requiredCorpus - totalProjected)} — start boosting SIPs now with ${yearsToRetirement} years in hand.`;
  }

  return {
    name: 'Retirement Readiness',
    score,
    maxScore: 180,
    grade: getGrade(score, 180),
    keyInsight,
  };
}

// =========================================================================
// 6. HUMAN LIFE VALUE (HLV)
// =========================================================================

export function calculateHLV(data: FinancialPlanningData): number {
  const age = data.personalProfile.age;
  const retirementAge = data.careerProfile.expectedRetirementAge;
  const years = Math.max(0, retirementAge - age);
  const annualIncome = getTotalMonthlyIncome(data) * 12;

  // Personal expense percent by family situation
  let personalExpensePercent: number;
  if (data.personalProfile.maritalStatus === 'single') {
    personalExpensePercent = 0.50;
  } else if (data.personalProfile.dependents === 0) {
    personalExpensePercent = 0.35;
  } else {
    personalExpensePercent = 0.25;
  }

  const annualContribution = annualIncome * (1 - personalExpensePercent);

  // PV of growing annuity: C × [(1 - ((1+g)/(1+d))^n) / (d - g)]
  // g = income growth 6%, d = discount 8%
  const g = 0.06;
  const d = 0.08;
  let pvContributions: number;

  if (Math.abs(d - g) < 0.0001) {
    // Edge case: g ≈ d
    pvContributions = annualContribution * years / (1 + d);
  } else {
    pvContributions =
      annualContribution *
      ((1 - Math.pow((1 + g) / (1 + d), years)) / (d - g));
  }

  // Add total outstanding liabilities
  const liab = data.liabilityProfile;
  const totalLiabilities =
    liab.homeLoan.outstanding +
    liab.carLoan.outstanding +
    liab.personalLoan.outstanding +
    liab.educationLoan.outstanding +
    liab.creditCardDebt +
    liab.otherLoans;

  return Math.round(pvContributions + totalLiabilities);
}

// =========================================================================
// 7. RETIREMENT GAP ANALYSIS
// =========================================================================

export function calculateRetirementGap(data: FinancialPlanningData): {
  requiredCorpus: number;
  currentProgress: number;
  gap: number;
  monthlyToClose: number;
  yearsToRetirement: number;
} {
  const age = data.personalProfile.age;
  const retirementAge = data.careerProfile.expectedRetirementAge;
  const yearsToRetirement = Math.max(0, retirementAge - age);
  const yearsInRetirement = Math.max(0, 85 - retirementAge);
  const monthlyExpense = data.incomeProfile.monthlyHouseholdExpenses;
  const assets = data.assetProfile;
  const sip = data.incomeProfile.monthlySIPsRunning;

  const futureMonthlyExpense = monthlyExpense * Math.pow(1.06, yearsToRetirement);
  const retirementMonths = yearsInRetirement * 12;
  const requiredCorpus = futureMonthlyExpense * pvAnnuityFactor(0.03, retirementMonths);

  const currentRetirementSavings = assets.ppfEpf + assets.nps + 0.5 * assets.mutualFunds;
  const projectedSavings = fvLumpSum(currentRetirementSavings, 0.10, yearsToRetirement);

  const retirementSIP = sip * 0.5;
  const sipCorpusAtRetirement = fvSIP(retirementSIP, 0.10, yearsToRetirement);

  const currentProgress = projectedSavings + sipCorpusAtRetirement;
  const gap = Math.max(0, requiredCorpus - currentProgress);

  // Monthly SIP needed to close gap
  const months = yearsToRetirement * 12;
  const factor = sipFvFactor(0.10, months);
  const monthlyToClose = factor > 0 ? gap / factor : 0;

  return {
    requiredCorpus: Math.round(requiredCorpus),
    currentProgress: Math.round(currentProgress),
    gap: Math.round(gap),
    monthlyToClose: Math.round(monthlyToClose),
    yearsToRetirement,
  };
}

// =========================================================================
// 8. GOAL GAP ANALYSIS
// =========================================================================

export function calculateGoalGaps(data: FinancialPlanningData): GoalGapResult[] {
  const currentYear = new Date().getFullYear();
  const income = getTotalMonthlyIncome(data);
  const risk = data.riskProfile.riskCategory;

  return data.goals.map((goal) => {
    const yearsToGoal = Math.max(0, goal.targetYear - currentYear);
    const inflationRate = getGoalInflationRate(goal.type);
    const futureCost = goal.targetAmount * Math.pow(1 + inflationRate, yearsToGoal);

    const returnRate = getReturnForHorizon(yearsToGoal, risk);
    const projectedSavings = fvLumpSum(goal.currentSavingsForGoal, returnRate, yearsToGoal);

    const gap = Math.max(0, futureCost - projectedSavings);

    // SIP needed to fill gap
    const months = yearsToGoal * 12;
    const factor = sipFvFactor(returnRate, months);
    const monthlyRequired = factor > 0 ? gap / factor : 0;

    // Feasibility
    const sipIncomeRatio = income > 0 ? monthlyRequired / income : 1;
    let feasibility: GoalGapResult['feasibility'];
    if (gap <= 0) feasibility = 'on-track';
    else if (sipIncomeRatio <= 0.10) feasibility = 'possible';
    else if (sipIncomeRatio <= 0.25) feasibility = 'stretch';
    else feasibility = 'unrealistic';

    return {
      goalName: goal.name,
      goalType: goal.type,
      futureCost: Math.round(futureCost),
      currentProgress: Math.round(projectedSavings),
      monthlyRequired: Math.round(monthlyRequired),
      gap: Math.round(gap),
      feasibility,
    };
  });
}

// =========================================================================
// 9. INSURANCE GAP ANALYSIS
// =========================================================================

export function calculateInsuranceGap(data: FinancialPlanningData): InsuranceGapResult {
  const ins = data.insuranceProfile;

  // Life insurance need = HLV
  const lifeInsuranceNeed = calculateHLV(data);
  const currentLifeCover = ins.termInsuranceCover + ins.lifeInsuranceCover;
  const lifeInsuranceGap = Math.max(0, lifeInsuranceNeed - currentLifeCover);

  // Health insurance need by city tier
  const healthNeedMap = { metro: 25_00_000, tier1: 15_00_000, tier2: 10_00_000, tier3: 5_00_000 };
  const healthInsuranceNeed = healthNeedMap[data.personalProfile.cityTier] ?? 15_00_000;
  const currentHealthCover = ins.healthInsuranceCover;
  const healthInsuranceGap = Math.max(0, healthInsuranceNeed - currentHealthCover);

  // Health adequacy
  let healthAdequacy: InsuranceGapResult['healthAdequacy'];
  if (currentHealthCover >= healthInsuranceNeed) {
    healthAdequacy = 'adequate';
  } else if (currentHealthCover >= 0.60 * healthInsuranceNeed) {
    healthAdequacy = 'low';
  } else {
    healthAdequacy = 'critical';
  }

  return {
    lifeInsuranceNeed,
    currentLifeCover,
    lifeInsuranceGap,
    healthInsuranceNeed,
    currentHealthCover,
    healthInsuranceGap,
    healthAdequacy,
  };
}

// =========================================================================
// 10. NET WORTH
// =========================================================================

export function calculateNetWorth(data: FinancialPlanningData): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
} {
  const a = data.assetProfile;
  const totalAssets =
    a.bankSavings +
    a.fixedDeposits +
    a.mutualFunds +
    a.stocks +
    a.ppfEpf +
    a.nps +
    a.gold +
    a.realEstateInvestment +
    a.primaryResidenceValue +
    a.otherAssets;

  const l = data.liabilityProfile;
  const totalLiabilities =
    l.homeLoan.outstanding +
    l.carLoan.outstanding +
    l.personalLoan.outstanding +
    l.educationLoan.outstanding +
    l.creditCardDebt +
    l.otherLoans;

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

// =========================================================================
// 11. CURRENT ASSET ALLOCATION
// =========================================================================

export function calculateCurrentAllocation(data: FinancialPlanningData): AssetAllocation {
  const a = data.assetProfile;
  const total =
    a.mutualFunds +
    a.stocks +
    a.fixedDeposits +
    a.ppfEpf +
    a.nps +
    a.gold +
    a.realEstateInvestment +
    a.bankSavings;

  if (total === 0) {
    return { equity: 0, debt: 0, gold: 0, realEstate: 0, cash: 100 };
  }

  const equity = ((a.mutualFunds + a.stocks) / total) * 100;
  const debt = ((a.fixedDeposits + a.ppfEpf + a.nps) / total) * 100;
  const gold = (a.gold / total) * 100;
  const realEstate = (a.realEstateInvestment / total) * 100;
  const cash = (a.bankSavings / total) * 100;

  return {
    equity: Math.round(equity * 10) / 10,
    debt: Math.round(debt * 10) / 10,
    gold: Math.round(gold * 10) / 10,
    realEstate: Math.round(realEstate * 10) / 10,
    cash: Math.round(cash * 10) / 10,
  };
}

// =========================================================================
// 12. RECOMMENDED ASSET ALLOCATION
// =========================================================================

export function calculateRecommendedAllocation(data: FinancialPlanningData): AssetAllocation {
  const age = data.personalProfile.age;
  const risk = data.riskProfile.riskCategory;

  let baseEquity = Math.max(20, 100 - age);

  // Adjust for risk profile
  if (risk === 'conservative') {
    baseEquity = Math.max(20, baseEquity - 15);
  } else if (risk === 'aggressive') {
    baseEquity = Math.min(85, baseEquity + 10);
  }

  // Remainder allocated: 70% debt, 20% gold, 10% cash
  const remainder = 100 - baseEquity;
  const debtAlloc = remainder * 0.70;
  const goldAlloc = remainder * 0.20;
  const cashAlloc = remainder * 0.10;

  return {
    equity: Math.round(baseEquity * 10) / 10,
    debt: Math.round(debtAlloc * 10) / 10,
    gold: Math.round(goldAlloc * 10) / 10,
    realEstate: 0,
    cash: Math.round(cashAlloc * 10) / 10,
  };
}

// =========================================================================
// 13. RISK SCORE
// =========================================================================

export function calculateRiskScore(data: FinancialPlanningData): {
  score: number;
  category: 'conservative' | 'moderate' | 'aggressive';
} {
  const rp = data.riskProfile;

  // Map each risk answer to 1-3 score
  const marketDropScore =
    rp.marketDropReaction === 'sell-immediately' ? 1 :
    rp.marketDropReaction === 'wait-patiently' ? 2 : 3;

  const horizonScore =
    rp.investmentHorizon === 'less-than-3' ? 1 :
    rp.investmentHorizon === '3-to-5' ? 2 :
    rp.investmentHorizon === '5-to-10' ? 2.5 : 3;

  const objectiveScore =
    rp.primaryObjective === 'capital-protection' ? 1 :
    rp.primaryObjective === 'balanced-growth' ? 2 : 3;

  const experienceScore =
    rp.pastExperience === 'none' ? 1 :
    rp.pastExperience === 'limited' ? 1.5 :
    rp.pastExperience === 'moderate' ? 2 : 3;

  // Average and normalize to 0-100
  const avg = (marketDropScore + horizonScore + objectiveScore + experienceScore) / 4;
  // avg ranges from 1 to 3; normalize: (avg - 1) / 2 * 100
  const score = Math.round(((avg - 1) / 2) * 100);

  let category: 'conservative' | 'moderate' | 'aggressive';
  if (score < 40) category = 'conservative';
  else if (score <= 65) category = 'moderate';
  else category = 'aggressive';

  return { score, category };
}

// =========================================================================
// 14. BEHAVIORAL SCORE
// =========================================================================

export function calculateBehavioralScore(data: FinancialPlanningData): number {
  const bp = data.behavioralProfile;

  // Expense tracking: true = 3, false = 1
  const trackingScore = bp.tracksExpensesMonthly ? 3 : 1;

  // Market news influence: never = 3 (best — not swayed), rarely = 2.5, somewhat = 1.5, heavily = 1
  const newsScore =
    bp.marketNewsInfluence === 'never' ? 3 :
    bp.marketNewsInfluence === 'rarely' ? 2.5 :
    bp.marketNewsInfluence === 'somewhat' ? 1.5 : 1;

  // Discipline: very-disciplined = 3, mostly = 2.5, sometimes = 1.5, rarely = 1
  const disciplineScore =
    bp.investmentDiscipline === 'very-disciplined' ? 3 :
    bp.investmentDiscipline === 'mostly-disciplined' ? 2.5 :
    bp.investmentDiscipline === 'sometimes' ? 1.5 : 1;

  const avg = (trackingScore + newsScore + disciplineScore) / 3;
  // Normalize avg (1-3) to 0-100
  return Math.round(((avg - 1) / 2) * 100);
}

// =========================================================================
// 15. ACTION PLAN GENERATOR
// =========================================================================

export function generateActionPlan(
  data: FinancialPlanningData,
  report: Partial<FinancialHealthReport>
): ActionItem[] {
  const actions: ActionItem[] = [];
  const income = getTotalMonthlyIncome(data);
  const monthlyExpenses = data.incomeProfile.monthlyHouseholdExpenses;
  const emg = data.emergencyProfile;
  const ins = data.insuranceProfile;
  const liab = data.liabilityProfile;
  const sip = data.incomeProfile.monthlySIPsRunning;
  const assets = data.assetProfile;

  // Emergency fund check
  const monthsCovered = monthlyExpenses > 0 ? emg.emergencyFundAmount / monthlyExpenses : 0;
  if (monthsCovered < 3) {
    const targetFund = monthlyExpenses * 6;
    actions.push({
      priority: 1,
      action: `Build emergency fund of 6 months expenses (${formatAmount(targetFund)}). Currently only ${monthsCovered.toFixed(1)} months covered.`,
      impact: 'high',
      category: 'Protection',
    });
  }

  // Life insurance gap
  const insuranceGap = report.insuranceGap ?? calculateInsuranceGap(data);
  if (insuranceGap.lifeInsuranceGap > 0) {
    actions.push({
      priority: 2,
      action: `Get term insurance cover of ${formatAmount(insuranceGap.lifeInsuranceNeed)}. Current gap: ${formatAmount(insuranceGap.lifeInsuranceGap)}.`,
      impact: 'high',
      category: 'Protection',
    });
  }

  // Health insurance gap
  if (insuranceGap.healthInsuranceGap > 0) {
    actions.push({
      priority: 3,
      action: `Increase health insurance to ${formatAmount(insuranceGap.healthInsuranceNeed)}. Current cover: ${formatAmount(insuranceGap.currentHealthCover)}.`,
      impact: 'high',
      category: 'Protection',
    });
  }

  // Credit card debt
  if (liab.creditCardDebt > 0) {
    actions.push({
      priority: 4,
      action: `Clear credit card debt of ${formatAmount(liab.creditCardDebt)} immediately (18-42% interest eats into wealth).`,
      impact: 'high',
      category: 'Debt',
    });
  }

  // DTI > 35%
  const totalEMI = liab.homeLoan.emi + liab.carLoan.emi + liab.personalLoan.emi + liab.educationLoan.emi;
  const dti = income > 0 ? totalEMI / income : 0;
  if (dti > 0.35) {
    actions.push({
      priority: 5,
      action: `Reduce EMI burden (currently ${(dti * 100).toFixed(0)}% of income) — consider prepayment of highest-rate loan.`,
      impact: 'high',
      category: 'Debt',
    });
  }

  // SIP < 20% of income
  const sipRatio = income > 0 ? sip / income : 0;
  if (sipRatio < 0.20) {
    const targetSIP = Math.round(income * 0.20);
    actions.push({
      priority: 6,
      action: `Increase SIP to at least 20% of income (${formatAmount(targetSIP)}/month). Currently at ${(sipRatio * 100).toFixed(0)}%.`,
      impact: 'medium',
      category: 'Investments',
    });
  }

  // No NPS
  if (assets.nps === 0) {
    actions.push({
      priority: 7,
      action: `Start NPS for additional tax saving (₹50K extra deduction under 80CCD(1B)) + retirement corpus.`,
      impact: 'medium',
      category: 'Investments',
    });
  }

  // Retirement readiness < 50%
  const retGap = report.retirementGap ?? calculateRetirementGap(data);
  const readiness = retGap.requiredCorpus > 0 ? (retGap.currentProgress / retGap.requiredCorpus) : 0;
  if (readiness < 0.50 && retGap.monthlyToClose > 0) {
    actions.push({
      priority: 8,
      action: `Boost retirement savings by ${formatAmount(retGap.monthlyToClose)}/month SIP to close the ${formatAmount(retGap.gap)} gap in ${retGap.yearsToRetirement} years.`,
      impact: 'high',
      category: 'Retirement',
    });
  }

  // Sort by priority and return top 7
  actions.sort((a, b) => a.priority - b.priority);
  return actions.slice(0, 7);
}

// =========================================================================
// 16. FINANCIAL HEALTH SCORE (COMPOSITE)
// =========================================================================

export function calculateFinancialHealthScore(data: FinancialPlanningData): FinancialHealthScore {
  const cashflow = calculateCashflowScore(data);
  const protection = calculateProtectionScore(data);
  const investments = calculateInvestmentScore(data);
  const debt = calculateDebtScore(data);
  const retirementReadiness = calculateRetirementReadinessScore(data);

  const totalScore =
    cashflow.score +
    protection.score +
    investments.score +
    debt.score +
    retirementReadiness.score;

  // Max possible = 5 × 180 = 900
  let grade: string;
  if (totalScore >= 750) grade = 'Excellent';
  else if (totalScore >= 600) grade = 'Good';
  else if (totalScore >= 450) grade = 'Fair';
  else if (totalScore >= 300) grade = 'Needs Improvement';
  else grade = 'Critical';

  return {
    totalScore,
    grade,
    pillars: {
      cashflow,
      protection,
      investments,
      debt,
      retirementReadiness,
    },
  };
}

// =========================================================================
// 17. FULL REPORT GENERATOR
// =========================================================================

export function generateFullReport(
  data: FinancialPlanningData
): Omit<FinancialHealthReport, 'claudeNarrative'> {
  const score = calculateFinancialHealthScore(data);
  const netWorth = calculateNetWorth(data);
  const retirementGap = calculateRetirementGap(data);
  const goalGaps = calculateGoalGaps(data);
  const insuranceGap = calculateInsuranceGap(data);
  const currentAllocation = calculateCurrentAllocation(data);
  const recommendedAllocation = calculateRecommendedAllocation(data);

  const income = getTotalMonthlyIncome(data);
  const liab = data.liabilityProfile;
  const totalEMIs =
    liab.homeLoan.emi +
    liab.carLoan.emi +
    liab.personalLoan.emi +
    liab.educationLoan.emi;
  const debtToIncomeRatio = income > 0 ? totalEMIs / income : 0;

  const partialReport: Partial<FinancialHealthReport> = {
    score,
    netWorth,
    retirementGap,
    goalGaps,
    insuranceGap,
    assetAllocation: {
      current: currentAllocation,
      recommended: recommendedAllocation,
    },
    debtManagement: {
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 10000) / 100, // as percentage
      totalEMIs,
      monthlyIncome: income,
    },
  };

  const actionPlan = generateActionPlan(data, partialReport);

  return {
    score,
    netWorth,
    retirementGap,
    goalGaps,
    insuranceGap,
    assetAllocation: {
      current: currentAllocation,
      recommended: recommendedAllocation,
    },
    debtManagement: {
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 10000) / 100,
      totalEMIs,
      monthlyIncome: income,
    },
    actionPlan,
  };
}

// =========================================================================
// 18. TEASER DATA GENERATOR
// =========================================================================

export function generateTeaserData(
  data: FinancialPlanningData,
  report: FinancialHealthReport,
  tier: 'basic' | 'standard' | 'comprehensive' = 'standard'
): TeaserData {
  const pillars = report.score.pillars;

  // Sort pillars by score descending for strengths, ascending for weaknesses
  const pillarEntries = [
    { name: 'Cashflow', pillar: pillars.cashflow },
    { name: 'Protection', pillar: pillars.protection },
    { name: 'Investments', pillar: pillars.investments },
    { name: 'Debt', pillar: pillars.debt },
    { name: 'Retirement', pillar: pillars.retirementReadiness },
  ];

  const sorted = [...pillarEntries].sort((a, b) => b.pillar.score - a.pillar.score);

  // Top 2-3 strengths (pillars scoring Good or above)
  const topStrengths: string[] = sorted
    .filter((p) => p.pillar.grade === 'Excellent' || p.pillar.grade === 'Good')
    .slice(0, 3)
    .map((p) => `${p.name}: ${p.pillar.grade} (${p.pillar.score}/${p.pillar.maxScore})`);

  // If no pillars are Good+, take the best one
  if (topStrengths.length === 0 && sorted.length > 0) {
    topStrengths.push(
      `${sorted[0].name}: ${sorted[0].pillar.grade} (${sorted[0].pillar.score}/${sorted[0].pillar.maxScore})`
    );
  }

  // Top 2-3 weaknesses (lowest scoring)
  const reversed = [...pillarEntries].sort((a, b) => a.pillar.score - b.pillar.score);
  const topWeaknesses: string[] = reversed
    .filter((p) => p.pillar.grade === 'Critical' || p.pillar.grade === 'Needs Attention' || p.pillar.grade === 'Fair')
    .slice(0, 3)
    .map((p) => `${p.name}: ${p.pillar.grade} (${p.pillar.score}/${p.pillar.maxScore})`);

  if (topWeaknesses.length === 0 && reversed.length > 0) {
    topWeaknesses.push(
      `${reversed[0].name}: ${reversed[0].pillar.grade} (${reversed[0].pillar.score}/${reversed[0].pillar.maxScore})`
    );
  }

  // Quick insights
  const quickInsights: string[] = [];
  const income = getTotalMonthlyIncome(data);
  const outflow = getTotalMonthlyOutflow(data);
  const savingsRate = income > 0 ? ((income - outflow) / income) * 100 : 0;

  if (savingsRate >= 25) {
    quickInsights.push(`Your savings rate of ${savingsRate.toFixed(0)}% is exceptional — well above the 20% benchmark.`);
  } else if (savingsRate >= 15) {
    quickInsights.push(`Your savings rate is ${savingsRate.toFixed(0)}% — good, but aim for 25%+ for faster wealth creation.`);
  } else {
    quickInsights.push(`Your savings rate of ${savingsRate.toFixed(0)}% is below the 20% benchmark — room for improvement.`);
  }

  if (report.insuranceGap.lifeInsuranceGap > 0) {
    quickInsights.push(`You need ${formatAmount(report.insuranceGap.lifeInsuranceGap)} more term insurance cover to protect your family.`);
  } else {
    quickInsights.push(`Your life insurance cover is adequate — well done.`);
  }

  if (report.retirementGap.gap > 0) {
    const readinessPct = report.retirementGap.requiredCorpus > 0
      ? (report.retirementGap.currentProgress / report.retirementGap.requiredCorpus) * 100
      : 0;
    quickInsights.push(`Retirement readiness is at ${readinessPct.toFixed(0)}% — a SIP of ${formatAmount(report.retirementGap.monthlyToClose)}/month can close the gap.`);
  } else {
    quickInsights.push(`You're on track for retirement — your projected corpus meets the requirement.`);
  }

  // Retirement gap percent
  const retirementGapPercent = report.retirementGap.requiredCorpus > 0
    ? Math.round((report.retirementGap.gap / report.retirementGap.requiredCorpus) * 100)
    : 0;

  const result: TeaserData = {
    score: report.score,
    topStrengths,
    topWeaknesses,
    quickInsights,
    netWorth: report.netWorth.netWorth,
    retirementGapPercent,
  };

  // Include extra data for standard and comprehensive tiers
  if (tier === 'standard' || tier === 'comprehensive') {
    result.goalGaps = report.goalGaps;
    result.actionPlan = report.actionPlan.slice(0, 5);
    result.netWorthBreakdown = {
      totalAssets: report.netWorth.totalAssets,
      totalLiabilities: report.netWorth.totalLiabilities,
    };
  }

  return result;
}
