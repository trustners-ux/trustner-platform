// ═══════════════════════════════════════════════
// BUCKET STRATEGY ENGINE — Retirement Income Optimization
// CFP-Grade Retirement Bucketing Calculator
// ═══════════════════════════════════════════════

// ── Interfaces ───────────────────────────────────

export interface BucketStrategyInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyExpenses: number;
  inflationRate: number;

  liquidReturn: number;
  debtReturn: number;
  assetAllocationReturn: number;
  equityReturn: number;

  lumpsumCorpus: number;
  additionalMonthlyIncome: number;

  existingInvestments: number;
  preRetirementReturn: number;
}

export interface BucketAllocation {
  bucketNumber: number;
  label: string;
  timeline: string;
  monthsFrom: number;
  monthsTo: number;
  durationMonths: number;
  returnRate: number;
  products: string[];
  productCategory: string;
  requiredCorpus: number;
  monthlyWithdrawal: number;
  allocationPercent: number;
  color: string;
  refillSource: string;
}

export interface BucketStrategyResult {
  retirementYears: number;
  retirementMonths: number;
  monthlyExpenseAtRetirement: number;
  netMonthlyNeed: number;

  buckets: BucketAllocation[];
  totalCorpusNeeded: number;
  emergencyFund: number;

  lumpsumAvailable: number;
  shortfall: number;
  surplus: number;

  yearsToRetirement: number;
  monthlySIPNeeded: number;
  stepUpSIPNeeded: number;

  depletionSchedule: DepletionYear[];

  insights: BucketInsight[];

  corpusLastsUntilAge: number;
  isSustainable: boolean;
}

export interface DepletionYear {
  year: number;
  age: number;
  activeBucket: number;
  yearStartCorpus: number;
  annualWithdrawal: number;
  annualReturn: number;
  yearEndCorpus: number;
  cumulativeWithdrawn: number;
}

export interface BucketInsight {
  type: 'positive' | 'warning' | 'critical' | 'tip';
  title: string;
  description: string;
}

// ── Constants ────────────────────────────────────

const BUCKET_PRODUCTS: string[][] = [
  ['Bank FD (1-year)', 'Liquid Fund', 'Savings Account'],
  ['Liquid Fund', 'Ultra Short Duration Fund', 'Bank FD (1-3 year)', 'Savings Account'],
  ['Equity Savings Fund', 'Balanced Advantage Fund (BAF)', 'Multi-Asset Allocation Fund (MAAF)', 'Conservative Hybrid Fund'],
  ['Multi-Asset Fund', 'Flexi Cap Fund', 'Large & Mid Cap Fund', 'Aggressive Hybrid Fund'],
  ['Multi Cap Fund', 'Flexi Cap Fund', 'Large Cap Fund', 'Value Fund', 'Index Fund (Nifty 50/500)'],
];

const BUCKET_LABELS = [
  'Emergency Fund',
  'Short-Term Income',
  'Medium-Term Income',
  'Growth Income',
  'Long-Term Growth',
];

const BUCKET_CATEGORIES = [
  'Liquid/FD',
  'Liquid/Ultra Short',
  'Debt/Hybrid',
  'Balanced/Multi-Asset',
  'Equity',
];

const BUCKET_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#10B981',
];

const BUCKET_REFILL = [
  'Refilled from Bucket 1, 2, or 3',
  'Refilled from Bucket 2',
  'Refilled from Bucket 3',
  'Refilled from Bucket 4',
  'Growth bucket — feeds all other buckets when they deplete',
];

// ── Helpers ──────────────────────────────────────

/**
 * Present value of a series of inflation-adjusted monthly withdrawals,
 * starting at `baseMonthlyAmount` inflated to `startMonth`, running for
 * `durationMonths`, discounted at `monthlyDiscountRate`.
 */
function pvOfInflatedWithdrawals(
  baseMonthlyAmount: number,
  monthlyInflation: number,
  monthlyDiscountRate: number,
  startMonth: number,
  durationMonths: number
): number {
  let pv = 0;
  for (let m = 0; m < durationMonths; m++) {
    const month = startMonth + m;
    const withdrawal = baseMonthlyAmount * Math.pow(1 + monthlyInflation, month);
    const discount = Math.pow(1 + monthlyDiscountRate, month);
    pv += withdrawal / discount;
  }
  return pv;
}

/**
 * Average monthly withdrawal for a bucket (simple average of all
 * inflation-adjusted withdrawals over the bucket's duration).
 */
function avgMonthlyWithdrawal(
  baseMonthlyAmount: number,
  monthlyInflation: number,
  startMonth: number,
  durationMonths: number
): number {
  if (durationMonths <= 0) return 0;
  let total = 0;
  for (let m = 0; m < durationMonths; m++) {
    total += baseMonthlyAmount * Math.pow(1 + monthlyInflation, startMonth + m);
  }
  return total / durationMonths;
}

/**
 * PMT — fixed monthly payment needed to accumulate `fv` in `n` months
 * at monthly rate `r`.
 */
function pmt(monthlyRate: number, months: number, fv: number): number {
  if (monthlyRate === 0) return fv / months;
  return (fv * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
}

/**
 * Step-up SIP — monthly SIP starting amount that grows by `stepUpPct`
 * annually and accumulates to `targetFV` in `years` years at `annualReturn`.
 */
function stepUpSIP(
  annualReturn: number,
  years: number,
  stepUpPct: number,
  targetFV: number
): number {
  const r = annualReturn / 100 / 12;
  const g = stepUpPct / 100;

  // FV of a step-up SIP of ₹1/month with g% annual step-up
  let fv1 = 0;
  for (let y = 0; y < years; y++) {
    const yearlyMultiplier = Math.pow(1 + g, y);
    // FV of 12 monthly payments of `yearlyMultiplier` made in year `y`,
    // compounded to end of investment horizon.
    for (let m = 0; m < 12; m++) {
      const monthsRemaining = (years - y) * 12 - m;
      if (monthsRemaining <= 0) continue;
      fv1 += yearlyMultiplier * Math.pow(1 + r, monthsRemaining);
    }
  }

  return fv1 > 0 ? targetFV / fv1 : 0;
}

// ── Main Calculator ──────────────────────────────

export function calculateBucketStrategy(
  inputs: BucketStrategyInputs
): BucketStrategyResult {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    monthlyExpenses,
    inflationRate,
    liquidReturn,
    debtReturn,
    assetAllocationReturn,
    equityReturn,
    lumpsumCorpus,
    additionalMonthlyIncome,
    existingInvestments,
    preRetirementReturn,
  } = inputs;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const retirementYears = Math.max(0, lifeExpectancy - retirementAge);
  const retirementMonths = retirementYears * 12;

  // 1. Future expenses at retirement
  const monthlyExpenseAtRetirement =
    monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // 2. Net monthly need
  const netMonthlyNeed = Math.max(0, monthlyExpenseAtRetirement - additionalMonthlyIncome);

  const monthlyInflation = inflationRate / 100 / 12;
  const monthlyLiquidReturn = liquidReturn / 100 / 12;
  const monthlyDebtReturn = debtReturn / 100 / 12;
  const monthlyAAReturn = assetAllocationReturn / 100 / 12;
  const monthlyEquityReturn = equityReturn / 100 / 12;

  // ── Bucket boundaries (months from retirement) ──
  // Bucket 0: months 0–5  (6 months emergency)
  // Bucket 1: months 0–35 (first 3 years income)
  // Bucket 2: months 36–71 (years 4–6)
  // Bucket 3: months 72–119 (years 7–10)
  // Bucket 4: months 120+ (year 11 onwards)

  const b0Start = 0;
  const b0Duration = 6;
  const b1Start = 0;
  const b1Duration = Math.min(36, retirementMonths);
  const b2Start = 36;
  const b2Duration = retirementMonths > 36 ? Math.min(36, retirementMonths - 36) : 0;
  const b3Start = 72;
  const b3Duration = retirementMonths > 72 ? Math.min(48, retirementMonths - 72) : 0;
  const b4Start = 120;
  const b4Duration = retirementMonths > 120 ? retirementMonths - 120 : 0;

  // 3. Bucket 0 — Emergency Fund (6 months, no inflation adjustment)
  const emergencyFund = Math.round(netMonthlyNeed * b0Duration);

  // 4. Bucket 1 — PV of months 1–36 at liquidReturn
  const bucket1Corpus = Math.round(
    pvOfInflatedWithdrawals(netMonthlyNeed, monthlyInflation, monthlyLiquidReturn, b1Start, b1Duration)
  );

  // 5. Bucket 2 — PV of months 37–72 at debtReturn, discounted back to retirement
  const bucket2Corpus = b2Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawals(netMonthlyNeed, monthlyInflation, monthlyDebtReturn, b2Start, b2Duration)
          / Math.pow(1 + monthlyDebtReturn, 36)
      )
    : 0;

  // 6. Bucket 3 — PV of months 73–120 at assetAllocationReturn, discounted back
  const bucket3Corpus = b3Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawals(netMonthlyNeed, monthlyInflation, monthlyAAReturn, b3Start, b3Duration)
          / Math.pow(1 + monthlyAAReturn, 72)
      )
    : 0;

  // 7. Bucket 4 — PV of months 121+ at equityReturn, discounted back
  const bucket4Corpus = b4Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawals(netMonthlyNeed, monthlyInflation, monthlyEquityReturn, b4Start, b4Duration)
          / Math.pow(1 + monthlyEquityReturn, 120)
      )
    : 0;

  // 8. Total corpus
  const totalCorpusNeeded = emergencyFund + bucket1Corpus + bucket2Corpus + bucket3Corpus + bucket4Corpus;

  // Allocation percentages
  const pct = (v: number) => (totalCorpusNeeded > 0 ? Math.round((v / totalCorpusNeeded) * 10000) / 100 : 0);

  // Build bucket allocations
  const bucketCorpuses = [emergencyFund, bucket1Corpus, bucket2Corpus, bucket3Corpus, bucket4Corpus];
  const bucketReturns = [liquidReturn, liquidReturn, debtReturn, assetAllocationReturn, equityReturn];
  const bucketTimelines = [
    '6 months',
    `1–36 months`,
    `37–72 months`,
    `73–120 months`,
    retirementMonths > 120 ? `121–${retirementMonths} months` : 'N/A',
  ];
  const bucketMonthsFrom = [b0Start, b1Start, b2Start, b3Start, b4Start];
  const bucketMonthsTo = [
    b0Duration - 1,
    b1Start + b1Duration - 1,
    b2Duration > 0 ? b2Start + b2Duration - 1 : b2Start,
    b3Duration > 0 ? b3Start + b3Duration - 1 : b3Start,
    b4Duration > 0 ? b4Start + b4Duration - 1 : b4Start,
  ];
  const bucketDurations = [b0Duration, b1Duration, b2Duration, b3Duration, b4Duration];

  const buckets: BucketAllocation[] = Array.from({ length: 5 }, (_, i) => ({
    bucketNumber: i,
    label: BUCKET_LABELS[i],
    timeline: bucketTimelines[i],
    monthsFrom: bucketMonthsFrom[i],
    monthsTo: bucketMonthsTo[i],
    durationMonths: bucketDurations[i],
    returnRate: bucketReturns[i],
    products: BUCKET_PRODUCTS[i],
    productCategory: BUCKET_CATEGORIES[i],
    requiredCorpus: bucketCorpuses[i],
    monthlyWithdrawal: i === 0
      ? Math.round(netMonthlyNeed)
      : Math.round(avgMonthlyWithdrawal(netMonthlyNeed, monthlyInflation, bucketMonthsFrom[i], bucketDurations[i])),
    allocationPercent: pct(bucketCorpuses[i]),
    color: BUCKET_COLORS[i],
    refillSource: BUCKET_REFILL[i],
  }));

  // 9. SIP calculation (pre-retirement)
  let monthlySIPNeeded = 0;
  let stepUpSIPNeeded = 0;

  const fvExisting =
    yearsToRetirement > 0 && existingInvestments > 0
      ? existingInvestments * Math.pow(1 + preRetirementReturn / 100 / 12, yearsToRetirement * 12)
      : existingInvestments;

  const sipShortfall = Math.max(0, totalCorpusNeeded - fvExisting);

  if (yearsToRetirement > 0 && sipShortfall > 0) {
    monthlySIPNeeded = Math.round(
      pmt(preRetirementReturn / 100 / 12, yearsToRetirement * 12, sipShortfall)
    );
    stepUpSIPNeeded = Math.round(
      stepUpSIP(preRetirementReturn, yearsToRetirement, 10, sipShortfall)
    );
  }

  // Corpus vs available
  const shortfall = lumpsumCorpus > 0 ? Math.max(0, totalCorpusNeeded - lumpsumCorpus) : 0;
  const surplus = lumpsumCorpus > 0 ? Math.max(0, lumpsumCorpus - totalCorpusNeeded) : 0;

  // 10. Depletion schedule
  const depletionSchedule = buildDepletionSchedule(
    retirementAge,
    retirementYears,
    netMonthlyNeed,
    inflationRate,
    buckets,
    lumpsumCorpus > 0 ? lumpsumCorpus : totalCorpusNeeded
  );

  // Sustainability check
  const lastYear = depletionSchedule.length > 0
    ? depletionSchedule[depletionSchedule.length - 1]
    : null;
  const corpusLastsUntilAge = lastYear
    ? (lastYear.yearEndCorpus > 0 ? retirementAge + retirementYears : findDepletionAge(depletionSchedule, retirementAge))
    : retirementAge;
  const isSustainable = corpusLastsUntilAge >= lifeExpectancy;

  // 11. Insights
  const insights = generateInsights(inputs, totalCorpusNeeded, surplus, shortfall, isSustainable, corpusLastsUntilAge);

  return {
    retirementYears,
    retirementMonths,
    monthlyExpenseAtRetirement: Math.round(monthlyExpenseAtRetirement),
    netMonthlyNeed: Math.round(netMonthlyNeed),
    buckets,
    totalCorpusNeeded,
    emergencyFund,
    lumpsumAvailable: lumpsumCorpus,
    shortfall,
    surplus,
    yearsToRetirement,
    monthlySIPNeeded,
    stepUpSIPNeeded,
    depletionSchedule,
    insights,
    corpusLastsUntilAge,
    isSustainable,
  };
}

// ── Depletion Schedule Builder ───────────────────

function buildDepletionSchedule(
  retirementAge: number,
  retirementYears: number,
  netMonthlyNeedAtRetirement: number,
  inflationRate: number,
  buckets: BucketAllocation[],
  startingCorpus: number
): DepletionYear[] {
  const schedule: DepletionYear[] = [];
  let corpus = startingCorpus;
  let cumWithdrawn = 0;

  for (let y = 1; y <= retirementYears; y++) {
    const age = retirementAge + y;
    const yearStartCorpus = corpus;

    // Determine active bucket based on year
    const monthIndex = (y - 1) * 12;
    let activeBucket: number;
    if (monthIndex < 36) activeBucket = 1;
    else if (monthIndex < 72) activeBucket = 2;
    else if (monthIndex < 120) activeBucket = 3;
    else activeBucket = 4;

    // Annual withdrawal = 12 months of inflation-adjusted expenses
    const annualInflationFactor = Math.pow(1 + inflationRate / 100, y);
    const annualWithdrawal = Math.round(netMonthlyNeedAtRetirement * annualInflationFactor * 12);

    // Return earned on remaining corpus (weighted by active bucket's return)
    const activeReturn = activeBucket < buckets.length ? buckets[activeBucket].returnRate / 100 : 0;
    // Approximate: return on average corpus during the year
    const avgCorpus = Math.max(0, corpus - annualWithdrawal / 2);
    const annualReturn = Math.round(avgCorpus * activeReturn);

    corpus = Math.max(0, corpus - annualWithdrawal + annualReturn);
    cumWithdrawn += annualWithdrawal;

    schedule.push({
      year: y,
      age,
      activeBucket,
      yearStartCorpus: Math.round(yearStartCorpus),
      annualWithdrawal,
      annualReturn,
      yearEndCorpus: Math.round(corpus),
      cumulativeWithdrawn: Math.round(cumWithdrawn),
    });

    if (corpus <= 0) break;
  }

  return schedule;
}

function findDepletionAge(schedule: DepletionYear[], retirementAge: number): number {
  for (const row of schedule) {
    if (row.yearEndCorpus <= 0) return row.age;
  }
  return schedule.length > 0
    ? schedule[schedule.length - 1].age
    : retirementAge;
}

// ── Insights Generator ───────────────────────────

function generateInsights(
  inputs: BucketStrategyInputs,
  totalCorpusNeeded: number,
  surplus: number,
  shortfall: number,
  isSustainable: boolean,
  corpusLastsUntilAge: number
): BucketInsight[] {
  const insights: BucketInsight[] = [];

  if (isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Sustainable Strategy',
      description: 'Your bucket strategy is sustainable — corpus lasts through your life expectancy.',
    });
  } else {
    insights.push({
      type: 'critical',
      title: 'Corpus Depletes Early',
      description: `At current estimates, your corpus runs out at age ${corpusLastsUntilAge}. Consider increasing SIP, reducing expenses, or delaying retirement.`,
    });
  }

  if (inputs.equityReturn < inputs.inflationRate + 4) {
    insights.push({
      type: 'warning',
      title: 'Low Equity Return Assumption',
      description: 'Consider higher equity allocation for Bucket 4 — equity return should ideally be 4%+ above inflation for long-term growth.',
    });
  }

  if (inputs.additionalMonthlyIncome > 0 && inputs.additionalMonthlyIncome > inputs.monthlyExpenses * 0.5 * Math.pow(1 + inputs.inflationRate / 100, inputs.retirementAge - inputs.currentAge)) {
    insights.push({
      type: 'positive',
      title: 'Strong Pension Base',
      description: 'Your pension/rental income covers over 50% of projected retirement expenses, reducing withdrawal pressure on your corpus.',
    });
  }

  if (inputs.retirementAge - inputs.currentAge < 5 && inputs.retirementAge > inputs.currentAge) {
    insights.push({
      type: 'warning',
      title: 'Limited Accumulation Time',
      description: 'With less than 5 years to retirement, consider a more conservative allocation and focus on building the emergency and short-term buckets first.',
    });
  }

  if (surplus > 0) {
    insights.push({
      type: 'tip',
      title: 'Corpus Surplus',
      description: 'You have surplus corpus beyond your bucket needs. Consider allocating it to a healthcare reserve or legacy fund for your family.',
    });
  }

  if (shortfall > 0 && inputs.lumpsumCorpus > 0) {
    insights.push({
      type: 'critical',
      title: 'Corpus Shortfall',
      description: `Your available corpus falls short by the required amount. Bridge the gap by increasing savings, working part-time in early retirement, or optimizing expenses.`,
    });
  }

  // Emergency fund importance
  insights.push({
    type: 'tip',
    title: 'Never Skip the Emergency Fund',
    description: 'Bucket 0 (Emergency Fund) is critical — it prevents forced withdrawals from growth buckets during market downturns or unexpected expenses.',
  });

  return insights;
}
