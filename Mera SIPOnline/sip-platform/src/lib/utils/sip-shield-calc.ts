// =============================================================================
// SIP Shield Calculator — Fund Recurring Costs Through SIP Investments
// Trustner Asset Services Pvt Ltd (ARN-286886)
// =============================================================================

// ── Types & Interfaces ──────────────────────────────────────────────────────

export type CostType = 'term_plan' | 'endowment' | 'home_loan' | 'car_loan' | 'personal_loan' | 'education_loan' | 'health_insurance' | 'other';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export type SIPFrequency = 'monthly';

export interface RecurringCost {
  type: CostType;
  label: string;
  amount: number;
  frequency: PaymentFrequency;
  totalTenure: number;
  alreadyPaidYears: number;
  inflationRate: number;
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
  cost: RecurringCost;
  monthlySIP: number;
  sipDuration: number;
  sipReturn: number;
  stepUpEnabled: boolean;
  stepUpPercent: number;
  growthPhaseYears: number;
  growthReturn: number;
  withdrawalReturn: number;
  lumpsumEvents: LumpsumEvent[];
}

export interface YearlyDetail {
  year: number;
  age: number;
  phase: 'SIP' | 'Growth' | 'Withdrawal';
  sipInflow: number;
  costPaidFromPocket: number;
  costPaidFromCorpus: number;
  returnEarned: number;
  lumpsumEvent?: string;
  yearEndCorpus: number;
}

export interface SIPShieldInsight {
  type: 'positive' | 'warning' | 'critical' | 'tip';
  title: string;
  description: string;
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
  corpusAtEndOfSIP: number;
  corpusAtEndOfGrowth: number;
  finalCorpus: number;
  netBenefit: number;
  benefitMultiple: number;
  isSustainable: boolean;
  depletionYear?: number;
  yearlyDetails: YearlyDetail[];
  insights: SIPShieldInsight[];
}

// ── Constants ───────────────────────────────────────────────────────────────

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

function annualCostForYear(cost: RecurringCost, yearFromStart: number): number {
  const baseCost = cost.amount * FREQUENCY_MULTIPLIER[cost.frequency];
  const effectiveYear = cost.alreadyPaidYears + yearFromStart;
  if (cost.inflationRate <= 0) return baseCost;
  return baseCost * Math.pow(1 + cost.inflationRate / 100, effectiveYear);
}

function sipInflowForYear(inputs: SIPShieldInputs, year: number): number {
  const base = inputs.monthlySIP * 12;
  if (!inputs.stepUpEnabled || inputs.stepUpPercent <= 0) return base;
  return base * Math.pow(1 + inputs.stepUpPercent / 100, year - 1);
}

// ── Main Calculator ─────────────────────────────────────────────────────────

export function calculateSIPShield(inputs: SIPShieldInputs): SIPShieldResult {
  const { cost, sipDuration, growthPhaseYears } = inputs;
  const remainingTenure = cost.totalTenure - cost.alreadyPaidYears;
  const withdrawalPhaseYears = Math.max(0, remainingTenure - sipDuration - growthPhaseYears);
  const totalYears = sipDuration + growthPhaseYears + withdrawalPhaseYears;

  const yearlyDetails: YearlyDetail[] = [];
  let corpus = 0;
  let totalSIPInvested = 0;
  let totalCostPaidFromPocket = 0;
  let totalCostPaidFromCorpus = 0;
  let totalReturnEarned = 0;
  let corpusAtEndOfSIP = 0;
  let corpusAtEndOfGrowth = 0;
  let isSustainable = true;
  let depletionYear: number | undefined;

  for (let yr = 1; yr <= totalYears; yr++) {
    const age = inputs.currentAge + yr;
    let phase: 'SIP' | 'Growth' | 'Withdrawal';
    let returnRate: number;
    let sipInflow = 0;
    let costFromPocket = 0;
    let costFromCorpus = 0;

    if (yr <= sipDuration) {
      phase = 'SIP';
      returnRate = inputs.sipReturn;
      sipInflow = sipInflowForYear(inputs, yr);
      costFromPocket = annualCostForYear(cost, yr);
    } else if (yr <= sipDuration + growthPhaseYears) {
      phase = 'Growth';
      returnRate = inputs.growthReturn;
      costFromPocket = annualCostForYear(cost, yr);
    } else {
      phase = 'Withdrawal';
      returnRate = inputs.withdrawalReturn;
      costFromCorpus = annualCostForYear(cost, yr);
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

    // Withdraw from corpus for cost payment
    if (costFromCorpus > 0) {
      if (corpus >= costFromCorpus) {
        corpus -= costFromCorpus;
        totalCostPaidFromCorpus += costFromCorpus;
      } else {
        // Corpus depleted
        totalCostPaidFromCorpus += Math.max(0, corpus);
        costFromCorpus = Math.max(0, corpus);
        corpus = 0;
        if (isSustainable) {
          isSustainable = false;
          depletionYear = yr;
        }
      }
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
      returnEarned: round2(returnEarned),
      lumpsumEvent: lumpsumLabel,
      yearEndCorpus: round2(corpus),
    });
  }

  if (growthPhaseYears === 0) corpusAtEndOfGrowth = corpusAtEndOfSIP;

  const finalCorpus = round2(corpus);
  const totalCostOverTenure = round2(totalCostPaidFromPocket + totalCostPaidFromCorpus);
  const netBenefit = round2(finalCorpus + totalCostPaidFromCorpus - totalSIPInvested);
  const benefitMultiple = totalSIPInvested > 0 ? round2(netBenefit / totalSIPInvested) : 0;

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights: SIPShieldInsight[] = [];

  // 1. SIP corpus summary (always)
  insights.push({
    type: 'positive',
    title: 'SIP Corpus Built',
    description: `Your SIP of ${formatRs(inputs.monthlySIP)}/month for ${sipDuration} years builds a corpus of ${formatRs(corpusAtEndOfSIP)}.`,
  });

  // 2. Freedom year
  if (withdrawalPhaseYears > 0) {
    const freedomYear = sipDuration + growthPhaseYears + 1;
    const annualCostAtFreedom = annualCostForYear(cost, freedomYear);
    insights.push({
      type: 'positive',
      title: 'Freedom From Pocket Payments',
      description: `From year ${freedomYear} onwards, your corpus pays ${formatRs(annualCostAtFreedom)}/year in ${COST_TYPE_LABELS[cost.type].toLowerCase()} — you never pay from pocket again.`,
    });
  }

  // 3. Return on investment
  if (totalCostPaidFromCorpus > 0) {
    const multiple = totalSIPInvested > 0 ? (totalCostPaidFromCorpus / totalSIPInvested).toFixed(1) : '0';
    insights.push({
      type: 'positive',
      title: 'Total Cost Covered By Corpus',
      description: `Over the full tenure, your corpus pays ${formatRs(totalCostPaidFromCorpus)} in ${cost.label || COST_TYPE_LABELS[cost.type].toLowerCase()} while you invested only ${formatRs(totalSIPInvested)} — a ${multiple}x return.`,
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
  if (inputs.stepUpEnabled && inputs.stepUpPercent > 0) {
    const baseCorpus = inputs.monthlySIP * 12 * sipDuration;
    const boost = totalSIPInvested > baseCorpus
      ? Math.round(((totalSIPInvested - baseCorpus) / baseCorpus) * 100)
      : 0;
    insights.push({
      type: 'tip',
      title: 'Step-Up SIP Advantage',
      description: `With ${inputs.stepUpPercent}% annual step-up, your total investment is ${boost}% higher than a flat SIP — compounding amplifies this further.`,
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

  // 8. Tax tip
  insights.push({
    type: 'tip',
    title: 'Tax Benefit',
    description: TAX_TIPS[cost.type],
  });

  // 9. Annual free money equivalent
  if (isSustainable && withdrawalPhaseYears > 0) {
    const avgAnnualFromCorpus = round2(totalCostPaidFromCorpus / withdrawalPhaseYears);
    insights.push({
      type: 'positive',
      title: 'Free Money Every Year',
      description: `This strategy is equivalent to getting ${formatRs(avgAnnualFromCorpus)} FREE every year for ${withdrawalPhaseYears} years.`,
    });
  }

  // 10. Net benefit summary
  if (isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Net Benefit',
      description: `Your total out-of-pocket SIP is ${formatRs(totalSIPInvested)} but the strategy delivers ${formatRs(totalCostPaidFromCorpus + finalCorpus)} in value — ${formatRs(netBenefit)} net benefit.`,
    });
  }

  return {
    clientName: inputs.clientName,
    costLabel: cost.label || COST_TYPE_LABELS[cost.type],
    sipPhaseYears: sipDuration,
    growthPhaseYears,
    withdrawalPhaseYears,
    totalYears,
    totalSIPInvested: round2(totalSIPInvested),
    totalCostPaidFromPocket: round2(totalCostPaidFromPocket),
    totalCostPaidFromCorpus: round2(totalCostPaidFromCorpus),
    totalCostOverTenure,
    totalReturnEarned: round2(totalReturnEarned),
    corpusAtEndOfSIP: round2(corpusAtEndOfSIP),
    corpusAtEndOfGrowth: round2(corpusAtEndOfGrowth),
    finalCorpus,
    netBenefit,
    benefitMultiple,
    isSustainable,
    depletionYear,
    yearlyDetails,
    insights,
  };
}
