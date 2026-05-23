// =============================================================================
// SIP Shield Calculator — Fund Recurring Costs Through SIP Investments
// Trustner Asset Services Pvt Ltd (ARN-286886)
// =============================================================================

// ── Types & Interfaces ──────────────────────────────────────────────────────

export type CostType = 'term_plan' | 'endowment' | 'home_loan' | 'car_loan' | 'personal_loan' | 'education_loan' | 'health_insurance' | 'other';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export type SIPFrequency = 'monthly' | 'yearly';

export type StepUpType = 'percentage' | 'fixed';

export type SWPFrequency = 'monthly' | 'yearly';

export type InvestmentType = 'mutual_fund' | 'fixed_deposit' | 'ppf' | 'epf' | 'nps' | 'stocks' | 'gold' | 'real_estate' | 'other';

export type RegularIncomeType = 'pension' | 'rental' | 'freelance' | 'business' | 'other';

export interface ExistingInvestment {
  id: string;
  type: InvestmentType;
  label: string;
  currentValue: number;
  expectedReturn: number; // % p.a.
  monthlyAddition: number; // 0 if not contributing
}

export interface RegularIncome {
  id: string;
  type: RegularIncomeType;
  label: string;
  monthlyAmount: number;
  startYear: number;
  endYear: number | null; // null = plan end
  annualGrowth: number; // %
}

export interface RecurringCost {
  id: string;
  type: CostType;
  label: string;
  amount: number;        // 0 – 2500000
  frequency: PaymentFrequency;
  totalTenure: number;
  alreadyPaidYears: number;
  inflationRate: number; // Per-cost inflation (health insurance 5-8%, others 0%)
}

export interface LumpsumEvent {
  id: string;
  type: 'investment' | 'withdrawal';
  label: string;
  amount: number;
  atYear: number;
}

export interface SIPShieldInputs {
  clientName: string;
  currentAge: number;

  /** Multiple recurring costs whose annual amounts are summed. */
  costs: RecurringCost[];

  /** Single inflation rate applied to all costs. */
  inflationRate: number;

  monthlySIP: number;
  sipFrequency: SIPFrequency;      // monthly | yearly
  sipDuration: number;
  sipReturn: number;

  stepUpEnabled: boolean;
  stepUpType: StepUpType;          // 'percentage' | 'fixed'
  stepUpValue: number;             // percent (e.g. 10) or fixed Rs. (e.g. 1000)

  growthPhaseYears: number;
  growthReturn: number;
  withdrawalReturn: number;

  /** SWP — additional monthly/yearly withdrawal during withdrawal phase. */
  swpEnabled: boolean;
  swpAmount: number;
  swpFrequency: SWPFrequency;
  swpStartYear: number; // absolute year when SWP begins (0 = start of withdrawal phase)
  swpInflationAdjusted: boolean;
  swpInflationRate: number; // default 5%

  lumpsumEvents: LumpsumEvent[];

  /** Optional: Parallel existing investments (MF, FD, PPF, EPF, NPS, etc.). */
  existingInvestments?: ExistingInvestment[];

  /** Optional: Post-retirement regular incomes (pension, rental, freelance, etc.). */
  regularIncomes?: RegularIncome[];
}

export interface YearlyDetail {
  year: number;
  age: number;
  phase: 'SIP' | 'Growth' | 'Withdrawal';
  sipInflow: number;
  costPaidFromPocket: number;
  costPaidFromCorpus: number;
  swpWithdrawn: number;
  returnEarned: number;
  lumpsumEvent?: string;
  yearEndCorpus: number;
  /** Year-end total value of ALL existing investments (parallel corpus). */
  existingInvestmentsValue: number;
  /** Total regular income received this year (offsets corpus drawdown). */
  regularIncomeThisYear: number;
}

export interface SIPShieldInsight {
  type: 'positive' | 'warning' | 'critical' | 'tip';
  title: string;
  description: string;
}

export interface CostBreakdownItem {
  label: string;
  totalPaid: number;
  paidFromPocket: number;
  paidFromCorpus: number;
}

export interface SIPShieldResult {
  clientName: string;
  costLabel: string;
  sipPhaseYears: number;
  growthPhaseYears: number;
  withdrawalPhaseYears: number;
  totalYears: number;
  totalSIPInvested: number;
  totalCostPaidFromPocket: number;
  totalCostPaidFromCorpus: number;
  totalCostOverTenure: number;
  totalReturnEarned: number;
  totalSWPWithdrawn: number;
  corpusAtEndOfSIP: number;
  corpusAtEndOfGrowth: number;
  finalCorpus: number;
  netBenefit: number;
  benefitMultiple: number;
  isSustainable: boolean;
  depletionYear?: number;
  yearlyDetails: YearlyDetail[];
  insights: SIPShieldInsight[];
  costBreakdown: CostBreakdownItem[];
  /** Final value of all existing investments at plan end. */
  existingInvestmentsFinal: number;
  /** Total contributions made to existing investments over the plan. */
  totalExistingInvestmentsContributed: number;
  /** Combined wealth at plan end (SIP corpus + existing investments). */
  totalWealthAtEnd: number;
  /** Total regular income received across the plan. */
  totalRegularIncomeReceived: number;
  /** Total "outflow" that corpus had to service (cost during withdrawal + SWP). */
  totalCorpusOutflowNeeded: number;
  /** % of that outflow that regular income covered (0-100). */
  regularIncomeCoveragePct: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  mutual_fund: 'Mutual Fund',
  fixed_deposit: 'Fixed Deposit',
  ppf: 'PPF',
  epf: 'EPF',
  nps: 'NPS',
  stocks: 'Stocks / Equity',
  gold: 'Gold',
  real_estate: 'Real Estate',
  other: 'Other',
};

export const INVESTMENT_DEFAULT_RETURN: Record<InvestmentType, number> = {
  mutual_fund: 12,
  fixed_deposit: 6.5,
  ppf: 7.1,
  epf: 8.25,
  nps: 10,
  stocks: 12,
  gold: 8,
  real_estate: 6,
  other: 8,
};

export const REGULAR_INCOME_TYPE_LABELS: Record<RegularIncomeType, string> = {
  pension: 'Pension',
  rental: 'Rental Income',
  freelance: 'Freelance / Consulting',
  business: 'Business Income',
  other: 'Other Income',
};

export const COST_TYPE_LABELS: Record<CostType, string> = {
  term_plan: 'Term Insurance Premium',
  endowment: 'Endowment/ULIP Premium',
  home_loan: 'Home Loan EMI',
  car_loan: 'Car Loan EMI',
  personal_loan: 'Personal Loan EMI',
  education_loan: 'Education Loan EMI',
  health_insurance: 'Health Insurance Premium',
  other: 'Recurring Payment',
};

const TAX_TIPS: Record<CostType, string> = {
  term_plan: 'Term plan premium qualifies for Section 80C deduction (up to Rs.1.5L/year). Combined with SIP in ELSS, you can maximize your 80C benefit.',
  endowment: 'Endowment premium qualifies for Section 80C. Consider if term + SIP gives better returns than endowment alone.',
  home_loan: 'Home loan EMI interest qualifies for Section 24(b) deduction (up to Rs.2L/year for self-occupied). Principal under 80C.',
  car_loan: 'Car loan EMI does not offer direct tax benefits for salaried individuals.',
  personal_loan: 'Personal loan EMI does not qualify for tax deductions unless used for home renovation (Section 24b) or education.',
  education_loan: 'Education loan interest qualifies for Section 80E deduction with no upper limit. Available for 8 years from start of repayment.',
  health_insurance: 'Health insurance premium qualifies for Section 80D deduction. Up to Rs.25,000 (self) + Rs.50,000 (senior citizen parents).',
  other: 'Check with your tax advisor for any applicable deductions on this recurring payment.',
};

const FREQUENCY_MULTIPLIER: Record<PaymentFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  half_yearly: 2,
  yearly: 1,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatRs(v: number): string {
  if (Math.abs(v) >= 1_00_00_000) return 'Rs.' + (v / 1_00_00_000).toFixed(2) + ' Cr';
  if (Math.abs(v) >= 1_00_000) return 'Rs.' + (v / 1_00_000).toFixed(2) + ' L';
  return 'Rs.' + Math.round(v).toLocaleString('en-IN');
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Total annual cost across all recurring costs for a given year.
 * Uses each cost's own inflationRate (health insurance may have 5-8%, others 0%).
 */
function totalAnnualCostForYear(
  costs: RecurringCost[],
  _sharedInflation: number, // kept for backward compat, per-cost rate takes priority
  yearFromStart: number,
): number {
  let total = 0;
  for (const cost of costs) {
    total += singleCostAnnualForYear(cost, 0, yearFromStart);
  }
  return total;
}

/**
 * Annual cost for a single cost item (used for per-cost breakdown tracking).
 * Uses the cost's own inflationRate field.
 */
function singleCostAnnualForYear(
  cost: RecurringCost,
  _sharedInflation: number, // ignored, uses cost.inflationRate
  yearFromStart: number,
): number {
  const remainingYears = cost.totalTenure - cost.alreadyPaidYears;
  if (yearFromStart > remainingYears) return 0;
  const baseCost = cost.amount * FREQUENCY_MULTIPLIER[cost.frequency];
  const costInflation = cost.inflationRate || 0;
  const effectiveYear = cost.alreadyPaidYears + yearFromStart;
  if (costInflation <= 0) return baseCost;
  return baseCost * Math.pow(1 + costInflation / 100, effectiveYear);
}

function sipInflowForYear(inputs: SIPShieldInputs, year: number): number {
  const periodsPerYear = inputs.sipFrequency === 'yearly' ? 1 : 12;
  const baseAnnual = inputs.monthlySIP * periodsPerYear;

  if (!inputs.stepUpEnabled || inputs.stepUpValue <= 0) return baseAnnual;

  if (inputs.stepUpType === 'percentage') {
    return baseAnnual * Math.pow(1 + inputs.stepUpValue / 100, year - 1);
  }
  // fixed step-up: add stepUpValue per year to the per-period SIP, then multiply
  const adjustedPerPeriod = inputs.monthlySIP + inputs.stepUpValue * (year - 1);
  return adjustedPerPeriod * periodsPerYear;
}

function annualSWP(inputs: SIPShieldInputs, withdrawalYear: number): number {
  if (!inputs.swpEnabled || inputs.swpAmount <= 0) return 0;
  const baseAnnual = inputs.swpFrequency === 'yearly' ? inputs.swpAmount : inputs.swpAmount * 12;
  if (!inputs.swpInflationAdjusted || withdrawalYear <= 1) return baseAnnual;
  const rate = inputs.swpInflationRate > 0 ? inputs.swpInflationRate : 5;
  return baseAnnual * Math.pow(1 + rate / 100, withdrawalYear - 1);
}

// ── Main Calculator ─────────────────────────────────────────────────────────

export function calculateSIPShield(inputs: SIPShieldInputs): SIPShieldResult {
  const { costs, sipDuration, growthPhaseYears, inflationRate } = inputs;

  // Max remaining tenure across all costs
  const maxRemainingTenure = costs.reduce(
    (mx, c) => Math.max(mx, c.totalTenure - c.alreadyPaidYears),
    0,
  );
  const withdrawalPhaseYears = Math.max(0, maxRemainingTenure - sipDuration - growthPhaseYears);
  const totalYears = sipDuration + growthPhaseYears + withdrawalPhaseYears;

  // Per-cost breakdown accumulators
  const costPocketMap = new Map<string, number>();
  const costCorpusMap = new Map<string, number>();
  const costTotalMap = new Map<string, number>();
  for (const c of costs) {
    costPocketMap.set(c.id, 0);
    costCorpusMap.set(c.id, 0);
    costTotalMap.set(c.id, 0);
  }

  const yearlyDetails: YearlyDetail[] = [];
  let corpus = 0;
  let totalSIPInvested = 0;
  let totalCostPaidFromPocket = 0;
  let totalCostPaidFromCorpus = 0;
  let totalReturnEarned = 0;
  let totalSWPWithdrawn = 0;
  let corpusAtEndOfSIP = 0;
  let corpusAtEndOfGrowth = 0;
  let isSustainable = true;
  let depletionYear: number | undefined;

  // ── Existing Investments: track per-investment running value ──
  const existingInvestments = inputs.existingInvestments ?? [];
  const existingValues = new Map<string, number>();
  for (const inv of existingInvestments) {
    existingValues.set(inv.id, Math.max(0, inv.currentValue || 0));
  }
  let totalExistingInvestmentsContributed = 0;

  // ── Regular Incomes tracking ──
  const regularIncomes = inputs.regularIncomes ?? [];
  let totalRegularIncomeReceived = 0;
  let totalCorpusOutflowNeeded = 0;

  for (let yr = 1; yr <= totalYears; yr++) {
    const age = inputs.currentAge + yr;
    let phase: 'SIP' | 'Growth' | 'Withdrawal';
    let returnRate: number;
    let sipInflow = 0;
    let costFromPocket = 0;
    let costFromCorpus = 0;
    let swpThisYear = 0;

    if (yr <= sipDuration) {
      phase = 'SIP';
      returnRate = inputs.sipReturn;
      sipInflow = sipInflowForYear(inputs, yr);
      costFromPocket = totalAnnualCostForYear(costs, inflationRate, yr);
      // Track per-cost pocket
      for (const c of costs) {
        const amt = singleCostAnnualForYear(c, inflationRate, yr);
        costPocketMap.set(c.id, (costPocketMap.get(c.id) ?? 0) + amt);
        costTotalMap.set(c.id, (costTotalMap.get(c.id) ?? 0) + amt);
      }
    } else if (yr <= sipDuration + growthPhaseYears) {
      phase = 'Growth';
      returnRate = inputs.growthReturn;
      costFromPocket = totalAnnualCostForYear(costs, inflationRate, yr);
      for (const c of costs) {
        const amt = singleCostAnnualForYear(c, inflationRate, yr);
        costPocketMap.set(c.id, (costPocketMap.get(c.id) ?? 0) + amt);
        costTotalMap.set(c.id, (costTotalMap.get(c.id) ?? 0) + amt);
      }
    } else {
      phase = 'Withdrawal';
      returnRate = inputs.withdrawalReturn;
      costFromCorpus = totalAnnualCostForYear(costs, inflationRate, yr);
      // SWP only starts from the specified year (swpStartYear is absolute year number)
      const swpEffectiveStart = inputs.swpStartYear > 0 ? inputs.swpStartYear : (sipDuration + growthPhaseYears + 1);
      if (yr >= swpEffectiveStart) {
        const swpYearsSinceStart = yr - swpEffectiveStart + 1;
        swpThisYear = annualSWP(inputs, swpYearsSinceStart);
      }
      for (const c of costs) {
        const amt = singleCostAnnualForYear(c, inflationRate, yr);
        costTotalMap.set(c.id, (costTotalMap.get(c.id) ?? 0) + amt);
        // corpus allocation tracked after deduction below
      }
    }

    // Add SIP inflow
    corpus += sipInflow;
    totalSIPInvested += sipInflow;
    totalCostPaidFromPocket += costFromPocket;

    // Process lumpsum events at this year
    let lumpsumLabel: string | undefined;
    for (const ev of inputs.lumpsumEvents) {
      if (ev.atYear === yr) {
        const sign = ev.type === 'investment' ? 1 : -1;
        corpus += sign * ev.amount;
        lumpsumLabel = (lumpsumLabel ? lumpsumLabel + ', ' : '') +
          `${ev.label} ${sign > 0 ? '+' : '-'}${formatRs(ev.amount)}`;
      }
    }

    // Apply returns
    const returnEarned = corpus * (returnRate / 100);
    corpus += returnEarned;
    totalReturnEarned += returnEarned;

    // ── Existing Investments: grow + add contributions in parallel ──
    for (const inv of existingInvestments) {
      let val = existingValues.get(inv.id) ?? 0;
      const annualAddition = (inv.monthlyAddition || 0) * 12;
      // Grow existing value, then add contributions (contributions assumed spread through year)
      val = val * (1 + (inv.expectedReturn || 0) / 100);
      val += annualAddition;
      totalExistingInvestmentsContributed += annualAddition;
      existingValues.set(inv.id, Math.max(0, val));
    }

    // ── Regular Income for this year (used to offset corpus drawdown) ──
    let regularIncomeThisYear = 0;
    for (const inc of regularIncomes) {
      const incStart = inc.startYear;
      const incEnd = inc.endYear ?? totalYears;
      if (yr < incStart || yr > incEnd) continue;
      const yearsSinceStart = yr - incStart;
      const baseAnnual = (inc.monthlyAmount || 0) * 12;
      const grown = baseAnnual * Math.pow(1 + (inc.annualGrowth || 0) / 100, yearsSinceStart);
      regularIncomeThisYear += grown;
    }
    totalRegularIncomeReceived += regularIncomeThisYear;

    // Apply regular income to offset corpus-funded outflows (withdrawal phase only).
    // Logic: income first covers recurring costs drawn from corpus, then SWP. Any surplus is not
    // reinvested (conservative — user keeps it as liquid cash outside the modelled corpus).
    const originalCostFromCorpus = costFromCorpus;
    let incomeRemaining = regularIncomeThisYear;
    if (phase === 'Withdrawal' && incomeRemaining > 0 && costFromCorpus > 0) {
      const offset = Math.min(incomeRemaining, costFromCorpus);
      costFromCorpus -= offset;
      incomeRemaining -= offset;
    }

    // Track total outflow the corpus had to "face" (pre-income); used for coverage metric.
    if (phase === 'Withdrawal') {
      totalCorpusOutflowNeeded += originalCostFromCorpus;
    }

    // Withdraw from corpus for cost payment
    if (costFromCorpus > 0) {
      // Per-cost scaling ratio: costs reduced by income cover fewer rupees from each cost proportionally.
      const incomeScale = originalCostFromCorpus > 0 ? costFromCorpus / originalCostFromCorpus : 1;
      if (corpus >= costFromCorpus) {
        corpus -= costFromCorpus;
        totalCostPaidFromCorpus += costFromCorpus;
        // Track per-cost corpus proportionally (scaled by incomeScale)
        for (const c of costs) {
          const amt = singleCostAnnualForYear(c, inflationRate, yr) * incomeScale;
          costCorpusMap.set(c.id, (costCorpusMap.get(c.id) ?? 0) + amt);
        }
      } else {
        totalCostPaidFromCorpus += Math.max(0, corpus);
        // partial per-cost tracking (proportional to corpus available AND incomeScale)
        const ratio = costFromCorpus > 0 ? Math.max(0, corpus) / costFromCorpus : 0;
        for (const c of costs) {
          const amt = singleCostAnnualForYear(c, inflationRate, yr) * incomeScale;
          costCorpusMap.set(c.id, (costCorpusMap.get(c.id) ?? 0) + amt * ratio);
        }
        costFromCorpus = Math.max(0, corpus);
        corpus = 0;
        if (isSustainable) {
          isSustainable = false;
          depletionYear = yr;
        }
      }
    }

    // SWP withdrawal (additional to cost) — regular income left over also offsets SWP
    if (swpThisYear > 0 && phase === 'Withdrawal') {
      const originalSWP = swpThisYear;
      if (incomeRemaining > 0) {
        const offset = Math.min(incomeRemaining, swpThisYear);
        swpThisYear -= offset;
        incomeRemaining -= offset;
      }
      totalCorpusOutflowNeeded += originalSWP;
      if (swpThisYear > 0) {
        if (corpus >= swpThisYear) {
          corpus -= swpThisYear;
          totalSWPWithdrawn += swpThisYear;
        } else {
          totalSWPWithdrawn += Math.max(0, corpus);
          swpThisYear = Math.max(0, corpus);
          corpus = 0;
          if (isSustainable) {
            isSustainable = false;
            depletionYear = yr;
          }
        }
      }
    }

    // Compute total existing investments value at year end
    let existingInvestmentsValue = 0;
    for (const inv of existingInvestments) {
      existingInvestmentsValue += existingValues.get(inv.id) ?? 0;
    }

    // Snapshot end-of-phase corpus
    if (yr === sipDuration) corpusAtEndOfSIP = corpus;
    if (yr === sipDuration + growthPhaseYears) corpusAtEndOfGrowth = corpus;

    yearlyDetails.push({
      year: yr,
      age,
      phase,
      sipInflow: round2(sipInflow),
      costPaidFromPocket: round2(costFromPocket),
      costPaidFromCorpus: round2(costFromCorpus),
      swpWithdrawn: round2(swpThisYear),
      returnEarned: round2(returnEarned),
      lumpsumEvent: lumpsumLabel,
      yearEndCorpus: round2(corpus),
      existingInvestmentsValue: round2(existingInvestmentsValue),
      regularIncomeThisYear: round2(regularIncomeThisYear),
    });
  }

  // Final existing investment aggregate
  let existingInvestmentsFinal = 0;
  for (const inv of existingInvestments) {
    existingInvestmentsFinal += existingValues.get(inv.id) ?? 0;
  }
  existingInvestmentsFinal = round2(existingInvestmentsFinal);

  if (growthPhaseYears === 0) corpusAtEndOfGrowth = corpusAtEndOfSIP;

  const finalCorpus = round2(corpus);
  const totalCostOverTenure = round2(totalCostPaidFromPocket + totalCostPaidFromCorpus);
  const netBenefit = round2(finalCorpus + totalCostPaidFromCorpus - totalSIPInvested);
  const benefitMultiple = totalSIPInvested > 0 ? round2(netBenefit / totalSIPInvested) : 0;

  // Build per-cost breakdown
  const costBreakdown: CostBreakdownItem[] = costs.map(c => ({
    label: c.label || COST_TYPE_LABELS[c.type],
    totalPaid: round2(costTotalMap.get(c.id) ?? 0),
    paidFromPocket: round2(costPocketMap.get(c.id) ?? 0),
    paidFromCorpus: round2(costCorpusMap.get(c.id) ?? 0),
  }));

  // Combined cost label for display
  const costLabel =
    costs.length === 1
      ? costs[0].label || COST_TYPE_LABELS[costs[0].type]
      : `${costs.length} Recurring Costs`;

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights: SIPShieldInsight[] = [];

  const sipLabelFreq = inputs.sipFrequency === 'yearly' ? 'year' : 'month';

  // 1. SIP corpus summary
  insights.push({
    type: 'positive',
    title: 'SIP Corpus Built',
    description: `Your SIP of ${formatRs(inputs.monthlySIP)}/${sipLabelFreq} for ${sipDuration} years builds a corpus of ${formatRs(corpusAtEndOfSIP)}.`,
  });

  // 2. Freedom year
  if (withdrawalPhaseYears > 0) {
    const freedomYear = sipDuration + growthPhaseYears + 1;
    const annualCostAtFreedom = totalAnnualCostForYear(costs, inflationRate, freedomYear);
    insights.push({
      type: 'positive',
      title: 'Freedom From Pocket Payments',
      description: `From year ${freedomYear} onwards, your corpus pays ${formatRs(annualCostAtFreedom)}/year in recurring costs — you never pay from pocket again.`,
    });
  }

  // 3. Return on investment
  if (totalCostPaidFromCorpus > 0) {
    const multiple = totalSIPInvested > 0 ? (totalCostPaidFromCorpus / totalSIPInvested).toFixed(1) : '0';
    insights.push({
      type: 'positive',
      title: 'Total Cost Covered By Corpus',
      description: `Over the full tenure, your corpus pays ${formatRs(totalCostPaidFromCorpus)} in recurring costs while you invested only ${formatRs(totalSIPInvested)} — a ${multiple}x return.`,
    });
  }

  // 4. Bonus wealth
  if (finalCorpus > 0 && isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Bonus Wealth Remaining',
      description: `After all payments are covered, you still have ${formatRs(finalCorpus)} left — that's your bonus wealth.`,
    });
  }

  // 5. Step-up benefit
  if (inputs.stepUpEnabled && inputs.stepUpValue > 0) {
    const periodsPerYear = inputs.sipFrequency === 'yearly' ? 1 : 12;
    const baseCorpus = inputs.monthlySIP * periodsPerYear * sipDuration;
    const boost = totalSIPInvested > baseCorpus
      ? Math.round(((totalSIPInvested - baseCorpus) / baseCorpus) * 100)
      : 0;
    const stepLabel = inputs.stepUpType === 'percentage'
      ? `${inputs.stepUpValue}% annual step-up`
      : `Rs.${inputs.stepUpValue.toLocaleString('en-IN')}/period annual step-up`;
    insights.push({
      type: 'tip',
      title: 'Step-Up SIP Advantage',
      description: `With ${stepLabel}, your total investment is ${boost}% higher than a flat SIP — compounding amplifies this further.`,
    });
  }

  // 6. Growth phase benefit
  if (growthPhaseYears > 0) {
    const growthAdded = round2(corpusAtEndOfGrowth - corpusAtEndOfSIP);
    insights.push({
      type: 'positive',
      title: 'Growth Phase Compounding',
      description: `The ${growthPhaseYears}-year growth phase adds ${formatRs(growthAdded)} to your corpus through compounding alone.`,
    });
  }

  // 7. Depletion warning
  if (!isSustainable && depletionYear) {
    insights.push({
      type: 'critical',
      title: 'Corpus Runs Out Early',
      description: `Your corpus depletes in year ${depletionYear} (age ${inputs.currentAge + depletionYear}), ${totalYears - depletionYear} years before your cost tenure ends. Consider increasing SIP amount or duration.`,
    });
  }

  // 8. Tax tip (use first cost's type)
  if (costs.length > 0) {
    insights.push({
      type: 'tip',
      title: 'Tax Benefit',
      description: TAX_TIPS[costs[0].type],
    });
  }

  // 9. SWP insight
  if (inputs.swpEnabled && totalSWPWithdrawn > 0) {
    insights.push({
      type: 'positive',
      title: 'SWP Income Received',
      description: `You also received ${formatRs(totalSWPWithdrawn)} as SWP income during the withdrawal phase — additional cash flow beyond cost coverage.`,
    });
  }

  // 10. Annual free money equivalent
  if (isSustainable && withdrawalPhaseYears > 0) {
    const avgAnnualFromCorpus = round2(totalCostPaidFromCorpus / withdrawalPhaseYears);
    insights.push({
      type: 'positive',
      title: 'Free Money Every Year',
      description: `This strategy is equivalent to getting ${formatRs(avgAnnualFromCorpus)} FREE every year for ${withdrawalPhaseYears} years.`,
    });
  }

  // 11. Net benefit summary
  if (isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Net Benefit',
      description: `Your total out-of-pocket SIP is ${formatRs(totalSIPInvested)} but the strategy delivers ${formatRs(totalCostPaidFromCorpus + finalCorpus)} in value — ${formatRs(netBenefit)} net benefit.`,
    });
  }

  // ── Derived totals for Existing Investments + Regular Income ──
  const totalWealthAtEnd = round2(finalCorpus + existingInvestmentsFinal);
  const regularIncomeCoveragePct = totalCorpusOutflowNeeded > 0
    ? Math.min(100, round2((totalRegularIncomeReceived / totalCorpusOutflowNeeded) * 100))
    : 0;

  // 12. Existing Investments contribution
  if (existingInvestmentsFinal > 0) {
    const pct = totalWealthAtEnd > 0 ? round2((existingInvestmentsFinal / totalWealthAtEnd) * 100) : 0;
    insights.push({
      type: 'positive',
      title: 'Existing Investments at Work',
      description: `Your existing investments grow to ${formatRs(existingInvestmentsFinal)} at plan end — ${pct}% of your total wealth of ${formatRs(totalWealthAtEnd)}. Review allocations with your Relationship Manager.`,
    });
  }

  // 13. Regular Income Coverage
  if (totalRegularIncomeReceived > 0 && withdrawalPhaseYears > 0) {
    if (regularIncomeCoveragePct >= 100) {
      insights.push({
        type: 'positive',
        title: 'Post-Retirement Income Fully Covers Outflows',
        description: `Congratulations — your post-retirement regular income of ${formatRs(totalRegularIncomeReceived)} fully covers your recurring outflows (${formatRs(totalCorpusOutflowNeeded)}). Your corpus grows untouched and compounds for legacy or future needs.`,
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Regular Income Offsets Corpus Drawdown',
        description: `Post-retirement regular income of ${formatRs(totalRegularIncomeReceived)} covers ${regularIncomeCoveragePct.toFixed(1)}% of your total outflows (${formatRs(totalCorpusOutflowNeeded)}). Your corpus lasts longer as a result.`,
      });
    }
  }

  // 14. Total Wealth insight
  if (existingInvestmentsFinal > 0 || totalRegularIncomeReceived > 0) {
    insights.push({
      type: 'tip',
      title: 'Total Wealth at Plan End',
      description: `Combining your SIP corpus (${formatRs(finalCorpus)}) with existing investments (${formatRs(existingInvestmentsFinal)}) gives ${formatRs(totalWealthAtEnd)} in total wealth. Your Relationship Manager can help rebalance across these holdings.`,
    });
  }

  return {
    clientName: inputs.clientName,
    costLabel,
    sipPhaseYears: sipDuration,
    growthPhaseYears,
    withdrawalPhaseYears,
    totalYears,
    totalSIPInvested: round2(totalSIPInvested),
    totalCostPaidFromPocket: round2(totalCostPaidFromPocket),
    totalCostPaidFromCorpus: round2(totalCostPaidFromCorpus),
    totalCostOverTenure,
    totalReturnEarned: round2(totalReturnEarned),
    totalSWPWithdrawn: round2(totalSWPWithdrawn),
    corpusAtEndOfSIP: round2(corpusAtEndOfSIP),
    corpusAtEndOfGrowth: round2(corpusAtEndOfGrowth),
    finalCorpus,
    netBenefit,
    benefitMultiple,
    isSustainable,
    depletionYear,
    yearlyDetails,
    insights,
    costBreakdown,
    existingInvestmentsFinal,
    totalExistingInvestmentsContributed: round2(totalExistingInvestmentsContributed),
    totalWealthAtEnd,
    totalRegularIncomeReceived: round2(totalRegularIncomeReceived),
    totalCorpusOutflowNeeded: round2(totalCorpusOutflowNeeded),
    regularIncomeCoveragePct,
  };
}
