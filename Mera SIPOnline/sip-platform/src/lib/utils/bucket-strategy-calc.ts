// ═══════════════════════════════════════════════
// BUCKET STRATEGY ENGINE — Retirement Income Optimization
// CFP-Grade Retirement Bucketing Calculator
// With Bucket Refill/Rebalancing Cascade & Multiple Income Sources
// ═══════════════════════════════════════════════

// ── Interfaces ───────────────────────────────────

export interface RetirementIncomeSource {
  type: 'pension' | 'rental' | 'scss' | 'nps' | 'swp' | 'epf_pension' | 'other';
  label: string;
  monthlyAmount: number;
  startYear?: number;               // Year of retirement when this starts (0 = from day 1)
  endYear?: number;                  // When it stops (undefined = lifetime)
  growthRate?: number;               // Annual growth % (e.g. rental income grows 5%)
}

export interface RebalancingEvent {
  year: number;
  fromBucket: number;
  toBucket: number;
  amount: number;
  trigger: string;
}

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
  additionalMonthlyIncome: number;   // Backward compat — used if incomeSources is empty/absent
  incomeSources?: RetirementIncomeSource[];

  existingInvestments: number;
  preRetirementReturn: number;
  currentMonthlySavings?: number;   // Monthly SIP/savings the person is already doing
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

  // Income source details
  incomeSources: RetirementIncomeSource[];
  totalMonthlyIncomeYear1: number;
  incomeCoversPercent: number;
  netMonthlyWithdrawalYear1: number;

  // Rebalancing tracking
  rebalancingEvents: RebalancingEvent[];
  bucket4GrowthMultiple: number;
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
  // Individual bucket balances
  bucket0Balance: number;
  bucket1Balance: number;
  bucket2Balance: number;
  bucket3Balance: number;
  bucket4Balance: number;
  refillEvents: string[];
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

// Income source type labels for display
const INCOME_TYPE_LABELS: Record<RetirementIncomeSource['type'], string> = {
  pension: 'Employer/Govt Pension',
  rental: 'Rental Income',
  scss: 'SCSS Interest',
  nps: 'NPS Annuity',
  swp: 'SWP from Mutual Fund',
  epf_pension: 'EPF Pension (EPS-95)',
  other: 'Other Income',
};

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
 * Present value of inflation-adjusted monthly withdrawals NET of income sources.
 * This accounts for income changes over time (e.g. SCSS ending after 5 years,
 * rental growing, etc.) so each bucket's corpus correctly reflects the actual
 * withdrawal needed during its time horizon.
 */
function pvOfInflatedWithdrawalsNetOfIncome(
  baseExpenseAtRetirement: number,
  monthlyInflation: number,
  monthlyDiscountRate: number,
  startMonth: number,
  durationMonths: number,
  incomeSources: RetirementIncomeSource[]
): number {
  let pv = 0;
  for (let m = 0; m < durationMonths; m++) {
    const month = startMonth + m;
    const retirementYear = Math.floor(month / 12);
    const grossExpense = baseExpenseAtRetirement * Math.pow(1 + monthlyInflation, month);
    const monthlyIncome = getMonthlyIncomeForYear(incomeSources, retirementYear);
    const netWithdrawal = Math.max(0, grossExpense - monthlyIncome);
    const discount = Math.pow(1 + monthlyDiscountRate, month);
    pv += netWithdrawal / discount;
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

  let fv1 = 0;
  for (let y = 0; y < years; y++) {
    const yearlyMultiplier = Math.pow(1 + g, y);
    for (let m = 0; m < 12; m++) {
      const monthsRemaining = (years - y) * 12 - m;
      if (monthsRemaining <= 0) continue;
      fv1 += yearlyMultiplier * Math.pow(1 + r, monthsRemaining);
    }
  }

  return fv1 > 0 ? targetFV / fv1 : 0;
}

/**
 * Calculate total monthly income from all active income sources for a given
 * retirement year (0-indexed: year 0 = first year of retirement).
 */
function getMonthlyIncomeForYear(
  sources: RetirementIncomeSource[],
  retirementYear: number
): number {
  let total = 0;
  for (const src of sources) {
    const startYr = src.startYear ?? 0;
    const endYr = src.endYear ?? Infinity;
    if (retirementYear < startYr || retirementYear >= endYr) continue;

    const yearsActive = retirementYear - startYr;
    const growth = src.growthRate ?? 0;
    total += src.monthlyAmount * Math.pow(1 + growth / 100, yearsActive);
  }
  return total;
}

/**
 * Convert legacy additionalMonthlyIncome into a single income source,
 * or use the provided incomeSources array.
 */
function resolveIncomeSources(inputs: BucketStrategyInputs): RetirementIncomeSource[] {
  if (inputs.incomeSources && inputs.incomeSources.length > 0) {
    return inputs.incomeSources;
  }
  if (inputs.additionalMonthlyIncome > 0) {
    return [{
      type: 'other',
      label: 'Monthly Income',
      monthlyAmount: inputs.additionalMonthlyIncome,
      startYear: 0,
      growthRate: 0,
    }];
  }
  return [];
}

/**
 * Format a number as lakhs/crores for display in refill events.
 */
function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${Math.round(amount)}`;
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
    existingInvestments,
    preRetirementReturn,
  } = inputs;

  const incomeSources = resolveIncomeSources(inputs);

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const retirementYears = Math.max(0, lifeExpectancy - retirementAge);
  const retirementMonths = retirementYears * 12;

  // 1. Future expenses at retirement
  const monthlyExpenseAtRetirement =
    monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // 2. Year-1 income from all sources
  const totalMonthlyIncomeYear1 = getMonthlyIncomeForYear(incomeSources, 0);

  // 3. Net monthly need (what must come from buckets)
  const netMonthlyNeed = Math.max(0, monthlyExpenseAtRetirement - totalMonthlyIncomeYear1);

  // Income coverage percentage
  const incomeCoversPercent = monthlyExpenseAtRetirement > 0
    ? Math.round((totalMonthlyIncomeYear1 / monthlyExpenseAtRetirement) * 10000) / 100
    : 0;

  const monthlyInflation = inflationRate / 100 / 12;
  const monthlyLiquidReturn = liquidReturn / 100 / 12;
  const monthlyDebtReturn = debtReturn / 100 / 12;
  const monthlyAAReturn = assetAllocationReturn / 100 / 12;
  const monthlyEquityReturn = equityReturn / 100 / 12;

  // ── Bucket boundaries (months from retirement) ──
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

  // Bucket 0 — Emergency Fund (6 months, no inflation adjustment)
  const emergencyFund = Math.round(netMonthlyNeed * b0Duration);

  // Bucket 1 — PV of months 1-36 at liquidReturn (income-aware)
  const bucket1Corpus = Math.round(
    pvOfInflatedWithdrawalsNetOfIncome(monthlyExpenseAtRetirement, monthlyInflation, monthlyLiquidReturn, b1Start, b1Duration, incomeSources)
  );

  // Bucket 2 — PV of months 37-72 at debtReturn, discounted back (income-aware)
  const bucket2Corpus = b2Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawalsNetOfIncome(monthlyExpenseAtRetirement, monthlyInflation, monthlyDebtReturn, b2Start, b2Duration, incomeSources)
          / Math.pow(1 + monthlyDebtReturn, 36)
      )
    : 0;

  // Bucket 3 — PV of months 73-120 at assetAllocationReturn, discounted back (income-aware)
  const bucket3Corpus = b3Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawalsNetOfIncome(monthlyExpenseAtRetirement, monthlyInflation, monthlyAAReturn, b3Start, b3Duration, incomeSources)
          / Math.pow(1 + monthlyAAReturn, 72)
      )
    : 0;

  // Bucket 4 — PV of months 121+ at equityReturn, discounted back (income-aware)
  const bucket4Corpus = b4Duration > 0
    ? Math.round(
        pvOfInflatedWithdrawalsNetOfIncome(monthlyExpenseAtRetirement, monthlyInflation, monthlyEquityReturn, b4Start, b4Duration, incomeSources)
          / Math.pow(1 + monthlyEquityReturn, 120)
      )
    : 0;

  // Total corpus
  const totalCorpusNeeded = emergencyFund + bucket1Corpus + bucket2Corpus + bucket3Corpus + bucket4Corpus;

  // Allocation percentages
  const pct = (v: number) => (totalCorpusNeeded > 0 ? Math.round((v / totalCorpusNeeded) * 10000) / 100 : 0);

  // Build bucket allocations
  const bucketCorpuses = [emergencyFund, bucket1Corpus, bucket2Corpus, bucket3Corpus, bucket4Corpus];
  const bucketReturns = [liquidReturn, liquidReturn, debtReturn, assetAllocationReturn, equityReturn];
  const bucketTimelines = [
    '6 months',
    '1-36 months',
    '37-72 months',
    '73-120 months',
    retirementMonths > 120 ? `121-${retirementMonths} months` : 'N/A',
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

  // SIP calculation (pre-retirement)
  let monthlySIPNeeded = 0;
  let stepUpSIPNeeded = 0;

  const monthlyRate = preRetirementReturn / 100 / 12;
  const totalMonths = yearsToRetirement * 12;

  // FV of existing lumpsum investments
  const fvExisting =
    yearsToRetirement > 0 && existingInvestments > 0
      ? existingInvestments * Math.pow(1 + monthlyRate, totalMonths)
      : existingInvestments;

  // FV of current monthly savings/SIPs (if person is already saving regularly)
  const currentMonthlySavings = inputs.currentMonthlySavings || 0;
  const fvMonthlySavings =
    yearsToRetirement > 0 && currentMonthlySavings > 0
      ? currentMonthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      : 0;

  // Total projected corpus at retirement from existing savings + ongoing SIPs
  const projectedFromSavings = fvExisting + fvMonthlySavings;

  // Available corpus at retirement:
  // All sources are ADDITIVE:
  // - Lumpsum: one-time corpus at retirement (inheritance, property sale, gratuity, etc.)
  // - FV of existing savings: current investments compounded to retirement
  // - FV of monthly savings: ongoing SIPs compounded to retirement
  // If nothing is provided at all, assume ideal corpus (no shortfall)
  const totalAvailable = lumpsumCorpus + fvExisting + fvMonthlySavings;
  let availableCorpus: number;
  if (totalAvailable > 0) {
    availableCorpus = totalAvailable;
  } else {
    availableCorpus = totalCorpusNeeded; // Assume ideal if nothing provided
  }

  const shortfall = Math.max(0, totalCorpusNeeded - availableCorpus);
  const surplus = Math.max(0, availableCorpus - totalCorpusNeeded);

  // SIP needed = gap between available and needed
  const sipTarget = Math.max(0, totalCorpusNeeded - availableCorpus);
  if (yearsToRetirement > 0 && sipTarget > 0) {
    monthlySIPNeeded = Math.round(
      pmt(preRetirementReturn / 100 / 12, yearsToRetirement * 12, sipTarget)
    );
    stepUpSIPNeeded = Math.round(
      stepUpSIP(preRetirementReturn, yearsToRetirement, 10, sipTarget)
    );
  }

  // Month-by-month depletion simulation with bucket refill cascade
  const startingCorpus = availableCorpus;
  const cascadeResult = buildDepletionScheduleWithCascade(
    retirementAge,
    retirementYears,
    netMonthlyNeed,
    inflationRate,
    bucketCorpuses,
    bucketReturns,
    startingCorpus,
    incomeSources,
    monthlyExpenseAtRetirement
  );

  const { depletionSchedule, rebalancingEvents, bucket4InitialBalance } = cascadeResult;

  // Sustainability check
  const lastYear = depletionSchedule.length > 0
    ? depletionSchedule[depletionSchedule.length - 1]
    : null;
  const corpusLastsUntilAge = lastYear
    ? (lastYear.yearEndCorpus > 0 ? retirementAge + retirementYears : findDepletionAge(depletionSchedule, retirementAge))
    : retirementAge;
  const isSustainable = corpusLastsUntilAge >= lifeExpectancy;

  // Bucket 4 growth multiple
  const finalB4 = lastYear ? lastYear.bucket4Balance : 0;
  const bucket4GrowthMultiple = bucket4InitialBalance > 0
    ? Math.round((finalB4 / bucket4InitialBalance) * 100) / 100
    : 0;

  // Insights
  const insights = generateInsights(
    inputs,
    totalCorpusNeeded,
    surplus,
    shortfall,
    isSustainable,
    corpusLastsUntilAge,
    incomeSources,
    totalMonthlyIncomeYear1,
    monthlyExpenseAtRetirement,
    incomeCoversPercent,
    rebalancingEvents,
    bucket4InitialBalance,
    finalB4,
    bucket4GrowthMultiple
  );

  return {
    retirementYears,
    retirementMonths,
    monthlyExpenseAtRetirement: Math.round(monthlyExpenseAtRetirement),
    netMonthlyNeed: Math.round(netMonthlyNeed),
    buckets,
    totalCorpusNeeded,
    emergencyFund,
    lumpsumAvailable: availableCorpus,
    shortfall,
    surplus,
    yearsToRetirement,
    monthlySIPNeeded,
    stepUpSIPNeeded,
    depletionSchedule,
    insights,
    corpusLastsUntilAge,
    isSustainable,
    incomeSources,
    totalMonthlyIncomeYear1: Math.round(totalMonthlyIncomeYear1),
    incomeCoversPercent,
    netMonthlyWithdrawalYear1: Math.round(netMonthlyNeed),
    rebalancingEvents,
    bucket4GrowthMultiple,
  };
}

// ── Depletion Schedule with Bucket Cascade Refill ─────────────

interface CascadeResult {
  depletionSchedule: DepletionYear[];
  rebalancingEvents: RebalancingEvent[];
  bucket4InitialBalance: number;
}

function buildDepletionScheduleWithCascade(
  retirementAge: number,
  retirementYears: number,
  netMonthlyNeedAtRetirement: number,
  inflationRate: number,
  bucketCorpuses: number[],
  bucketReturnRates: number[],
  startingCorpus: number,
  incomeSources: RetirementIncomeSource[],
  monthlyExpenseAtRetirement: number
): CascadeResult {
  const schedule: DepletionYear[] = [];
  const allRebalancingEvents: RebalancingEvent[] = [];

  // Initialize each bucket with its allocated corpus.
  // If user has a different starting corpus (lumpsum), scale proportionally.
  const allocatedTotal = bucketCorpuses.reduce((s, v) => s + v, 0);
  const scaleFactor = allocatedTotal > 0 ? startingCorpus / allocatedTotal : 1;

  // Bucket balances: index 0 = emergency, 1-4 = income/growth buckets
  const bal = bucketCorpuses.map(c => c * scaleFactor);

  // Monthly return rates for each bucket
  const monthlyRates = bucketReturnRates.map(r => r / 100 / 12);
  const monthlyInflation = inflationRate / 100 / 12;

  const bucket4Initial = bal[4];
  let cumWithdrawn = 0;

  for (let y = 1; y <= retirementYears; y++) {
    const age = retirementAge + y;
    const yearStartCorpus = bal.reduce((s, v) => s + v, 0);
    const yearRefillEvents: string[] = [];
    let yearWithdrawal = 0;
    let yearReturn = 0;

    // Simulate 12 months for this year
    for (let m = 0; m < 12; m++) {
      const monthIndex = (y - 1) * 12 + m;
      const retirementYear = y - 1; // 0-indexed retirement year

      // Step 1: Apply monthly return to each bucket
      for (let b = 0; b < 5; b++) {
        if (bal[b] > 0) {
          const monthReturn = bal[b] * monthlyRates[b];
          bal[b] += monthReturn;
          yearReturn += monthReturn;
        }
      }

      // Step 2: Calculate this month's gross expense (inflation-adjusted)
      const monthlyExpense = monthlyExpenseAtRetirement * Math.pow(1 + monthlyInflation, monthIndex);

      // Step 3: Calculate income for this month from all sources
      const monthlyIncome = getMonthlyIncomeForYear(incomeSources, retirementYear);

      // Step 4: Net withdrawal from buckets = expense minus income
      const netWithdrawal = Math.max(0, monthlyExpense - monthlyIncome);
      yearWithdrawal += netWithdrawal;

      // Step 5: Withdraw from Bucket 1 first, then cascade upward
      // Bucket 0 (emergency) is NOT touched for regular withdrawals
      let remaining = netWithdrawal;
      for (let b = 1; b <= 4; b++) {
        if (remaining <= 0) break;
        if (bal[b] > 0) {
          const deducted = Math.min(bal[b], remaining);
          bal[b] -= deducted;
          remaining -= deducted;
          break; // Only deduct from the first bucket that has money
        }
      }
      // Last resort: dip into emergency fund (bucket 0) if all income buckets empty
      if (remaining > 0 && bal[0] > 0) {
        const deducted = Math.min(bal[0], remaining);
        bal[0] -= deducted;
        remaining -= deducted;
      }

      // Step 6: Refill triggers — when a bucket's balance drops below 3 months' expenses
      const threeMonthThreshold = netWithdrawal > 0 ? netWithdrawal * 3 : 0;

      if (threeMonthThreshold > 0) {
        // Bucket 1 low -> refill from Bucket 2 (transfer 12 months' worth)
        if (bal[1] < threeMonthThreshold && bal[2] > 0) {
          const refillAmount = Math.min(bal[2], netWithdrawal * 12);
          if (refillAmount > 0) {
            bal[2] -= refillAmount;
            bal[1] += refillAmount;
            yearRefillEvents.push(`B2 ->B1: Rs.${formatLakhs(refillAmount)}`);
            allRebalancingEvents.push({
              year: y,
              fromBucket: 2,
              toBucket: 1,
              amount: Math.round(refillAmount),
              trigger: 'Bucket 1 balance below 3-month threshold',
            });
          }
        }

        // Bucket 2 low -> refill from Bucket 3
        if (bal[2] < threeMonthThreshold && bal[3] > 0) {
          const refillAmount = Math.min(bal[3], netWithdrawal * 12);
          if (refillAmount > 0) {
            bal[3] -= refillAmount;
            bal[2] += refillAmount;
            yearRefillEvents.push(`B3 ->B2: Rs.${formatLakhs(refillAmount)}`);
            allRebalancingEvents.push({
              year: y,
              fromBucket: 3,
              toBucket: 2,
              amount: Math.round(refillAmount),
              trigger: 'Bucket 2 balance below 3-month threshold',
            });
          }
        }

        // Bucket 3 low -> refill from Bucket 4 (the growth engine)
        if (bal[3] < threeMonthThreshold && bal[4] > 0) {
          const refillAmount = Math.min(bal[4], netWithdrawal * 12);
          if (refillAmount > 0) {
            bal[4] -= refillAmount;
            bal[3] += refillAmount;
            yearRefillEvents.push(`B4 ->B3: Rs.${formatLakhs(refillAmount)}`);
            allRebalancingEvents.push({
              year: y,
              fromBucket: 4,
              toBucket: 3,
              amount: Math.round(refillAmount),
              trigger: 'Bucket 3 balance below 3-month threshold',
            });
          }
        }
      }
    }

    cumWithdrawn += yearWithdrawal;

    // Determine active bucket (first bucket with non-trivial balance)
    let activeBucket = 4; // default if all lower buckets depleted
    for (let b = 1; b <= 4; b++) {
      if (bal[b] > 100) { // small threshold to avoid float noise
        activeBucket = b;
        break;
      }
    }

    const yearEndCorpus = bal.reduce((s, v) => s + Math.max(0, v), 0);

    schedule.push({
      year: y,
      age,
      activeBucket,
      yearStartCorpus: Math.round(yearStartCorpus),
      annualWithdrawal: Math.round(yearWithdrawal),
      annualReturn: Math.round(yearReturn),
      yearEndCorpus: Math.round(yearEndCorpus),
      cumulativeWithdrawn: Math.round(cumWithdrawn),
      bucket0Balance: Math.round(Math.max(0, bal[0])),
      bucket1Balance: Math.round(Math.max(0, bal[1])),
      bucket2Balance: Math.round(Math.max(0, bal[2])),
      bucket3Balance: Math.round(Math.max(0, bal[3])),
      bucket4Balance: Math.round(Math.max(0, bal[4])),
      refillEvents: yearRefillEvents,
    });

    if (yearEndCorpus <= 0) break;
  }

  return {
    depletionSchedule: schedule,
    rebalancingEvents: allRebalancingEvents,
    bucket4InitialBalance: bucket4Initial,
  };
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
  corpusLastsUntilAge: number,
  incomeSources: RetirementIncomeSource[],
  totalMonthlyIncomeYear1: number,
  monthlyExpenseAtRetirement: number,
  incomeCoversPercent: number,
  rebalancingEvents: RebalancingEvent[],
  bucket4Initial: number,
  bucket4Final: number,
  bucket4GrowthMultiple: number
): BucketInsight[] {
  const insights: BucketInsight[] = [];

  // 1. Sustainability
  if (isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Sustainable Strategy',
      description: 'Your bucket strategy is sustainable  -- corpus lasts through your life expectancy.',
    });
  } else {
    insights.push({
      type: 'critical',
      title: 'Corpus Depletes Early',
      description: `At current estimates, your corpus runs out at age ${corpusLastsUntilAge}. Consider increasing SIP, reducing expenses, or delaying retirement.`,
    });
  }

  // 2. Income coverage
  if (totalMonthlyIncomeYear1 > 0) {
    const coverLabel = incomeCoversPercent >= 60 ? 'good' : incomeCoversPercent >= 30 ? 'moderate' : 'insufficient';
    const activeNames = incomeSources
      .filter(s => (s.startYear ?? 0) === 0)
      .map(s => s.label || INCOME_TYPE_LABELS[s.type])
      .join(' + ');
    insights.push({
      type: coverLabel === 'good' ? 'positive' : coverLabel === 'moderate' ? 'tip' : 'warning',
      title: 'Income Coverage',
      description: `Your ${activeNames || 'income sources'} cover${incomeSources.length === 1 ? 's' : ''} ${incomeCoversPercent.toFixed(1)}% of Year 1 expenses  -- ${coverLabel}. This reduces withdrawal pressure on your bucket corpus.`,
    });
  }

  // 3. SCSS tax tip
  if (incomeSources.some(s => s.type === 'scss')) {
    insights.push({
      type: 'tip',
      title: 'SCSS Tax Benefit',
      description: 'SCSS @ 8.2% is tax-efficient for the first Rs.50,000 interest per year under Section 80TTB for senior citizens. Renew after 5 years if the scheme is still available.',
    });
  }

  // 4. NPS suggestion
  if (!incomeSources.some(s => s.type === 'nps') && inputs.currentAge < 60) {
    insights.push({
      type: 'tip',
      title: 'Consider NPS',
      description: 'Consider NPS for additional tax benefit under Section 80CCD(1B)  -- Rs.50,000 extra deduction over and above Section 80C limit.',
    });
  }

  // 5. SWP sustainability check
  for (const swp of incomeSources.filter(s => s.type === 'swp')) {
    if (swp.monthlyAmount > monthlyExpenseAtRetirement * 0.5) {
      insights.push({
        type: 'warning',
        title: 'High SWP Withdrawal',
        description: `Your SWP of Rs.${formatLakhs(swp.monthlyAmount)}/month is substantial. Ensure the underlying mutual fund corpus supports a withdrawal rate below 4% annually for sustainability.`,
      });
    }
  }

  // 6. Bucket 4 growth insight
  if (bucket4Initial > 0 && bucket4Final > 0 && bucket4GrowthMultiple > 1) {
    insights.push({
      type: 'positive',
      title: 'Equity Compounding Power',
      description: `Bucket 4 grew from Rs.${formatLakhs(bucket4Initial)} to Rs.${formatLakhs(bucket4Final)} over retirement (${bucket4GrowthMultiple}x)  -- equity compounding protected your corpus while other buckets funded your income.`,
    });
  } else if (bucket4Initial > 0 && bucket4Final <= 0) {
    insights.push({
      type: 'warning',
      title: 'Growth Bucket Depleted',
      description: 'Bucket 4 (equity growth engine) was fully consumed during retirement. This indicates the initial corpus was insufficient for the withdrawal rate.',
    });
  }

  // 7. Rebalancing events summary
  if (rebalancingEvents.length > 0) {
    insights.push({
      type: 'tip',
      title: 'Rebalancing Activity',
      description: `Rebalancing occurred ${rebalancingEvents.length} time${rebalancingEvents.length === 1 ? '' : 's'} over retirement  -- each time the growth bucket cascaded funds down to sustain your income.`,
    });
  }

  // 8. Low equity return warning
  if (inputs.equityReturn < inputs.inflationRate + 4) {
    insights.push({
      type: 'warning',
      title: 'Low Equity Return Assumption',
      description: 'Consider higher equity allocation for Bucket 4  -- equity return should ideally be 4%+ above inflation for long-term growth.',
    });
  }

  // 9. Strong income base (if >50% coverage and not already flagged)
  if (incomeCoversPercent > 50 && totalMonthlyIncomeYear1 > 0) {
    insights.push({
      type: 'positive',
      title: 'Strong Income Base',
      description: 'Your income sources cover over 50% of projected retirement expenses, significantly reducing withdrawal pressure on your corpus.',
    });
  }

  // 10. Limited accumulation time
  if (inputs.retirementAge - inputs.currentAge < 5 && inputs.retirementAge > inputs.currentAge) {
    insights.push({
      type: 'warning',
      title: 'Limited Accumulation Time',
      description: 'With less than 5 years to retirement, consider a more conservative allocation and focus on building the emergency and short-term buckets first.',
    });
  }

  // 11. Surplus
  if (surplus > 0) {
    insights.push({
      type: 'tip',
      title: 'Corpus Surplus',
      description: 'You have surplus corpus beyond your bucket needs. Consider allocating it to a healthcare reserve or legacy fund for your family.',
    });
  }

  // 12. Shortfall
  if (shortfall > 0) {
    insights.push({
      type: 'critical',
      title: 'Corpus Shortfall',
      description: 'Your available corpus falls short by the required amount. Bridge the gap by increasing savings, working part-time in early retirement, or optimizing expenses.',
    });
  }

  // 13. Emergency fund
  insights.push({
    type: 'tip',
    title: 'Never Skip the Emergency Fund',
    description: 'Bucket 0 (Emergency Fund) is critical  -- it prevents forced withdrawals from growth buckets during market downturns or unexpected expenses.',
  });

  return insights;
}
