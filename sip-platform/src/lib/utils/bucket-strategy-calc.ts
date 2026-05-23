// =============================================================================
// Bucket Strategy Calculator — Gap-Based Retirement Income Planning
// Trustner Asset Services Pvt Ltd (ARN-286886)
// =============================================================================

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface CorpusSource {
  id: string;
  type: 'epf' | 'ppf' | 'gratuity' | 'nps_lumpsum' | 'insurance_maturity' | 'fd' | 'mf' | 'esop' | 'savings' | 'other';
  label: string;
  amount: number;
}

export interface RegularIncome {
  id: string;
  type: 'pension' | 'nps_annuity' | 'scss' | 'swp' | 'rental' | 'epf_pension' | 'pmvvy' | 'other';
  label: string;
  monthlyAmount: number;
  growthRate?: number;
  startAge?: number;
  endAge?: number;
}

export interface LumpsumEvent {
  id: string;
  type: 'investment' | 'withdrawal';
  label: string;
  amount: number;
  atAge: number;
}

export interface BucketInputs {
  clientName: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentMonthlyHHE: number;
  retirementHHE?: number;
  inflationRate: number;

  liquidReturn: number;       // B0 Emergency — default 5%
  shortTermReturn: number;    // B1 Short-Term — default 6%
  debtReturn: number;         // B2 Medium-Term — default 7%
  balancedReturn: number;     // B3 Growth — default 10%
  equityReturn: number;       // B4 Equity — default 12%

  corpusSources: CorpusSource[];
  regularIncome: RegularIncome[];
  lumpsumEvents: LumpsumEvent[];

  wantsLegacy: boolean;
  legacyPercent: number;
  includeEmergencyBucket?: boolean; // Default true
}

export interface BucketAllocation {
  bucketNumber: number;
  label: string;
  timeline: string;
  amount: number;
  amountInLakhs: string;
  returnRate: number;
  products: string[];
  color: string;
}

export interface YearlyBreakdown {
  year: number;
  age: number;
  monthlyExpense: number;
  monthlyIncome: number;
  monthlyGap: number;
  annualGapWithdrawal: number;
  lumpsumEvent?: string;
  activeBucket: string;
  bucket0: number;
  bucket1: number;
  bucket2: number;
  bucket3: number;
  bucket4: number;
  totalCorpus: number;
  refillEvent?: string;
}

export interface BucketInsight {
  type: 'positive' | 'warning' | 'critical' | 'tip';
  title: string;
  description: string;
}

export interface BucketResult {
  clientName: string;
  totalCorpus: number;
  totalMonthlyIncome: number;
  monthlyHHEAtRetirement: number;
  monthlyGap: number;
  gapPercent: number;
  incomeCoversPercent: number;

  corpusForBucketing: number;
  legacyAmount: number;

  buckets: BucketAllocation[];
  yearlyBreakdown: YearlyBreakdown[];

  isSustainable: boolean;
  depletionAge?: number;
  legacyCorpus: number;

  insights: BucketInsight[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const BUCKET_LABELS = [
  'Emergency Fund',
  'Short-Term Income',
  'Medium-Term Growth',
  'Long-Term Growth',
  'Equity Growth Engine',
];

const BUCKET_TIMELINES = [
  '6 months reserve',
  'Years 1-3',
  'Years 4-7',
  'Years 8-12',
  'Years 13+',
];

const BUCKET_PRODUCTS = [
  ['Bank FD', 'Liquid Fund'],
  ['Liquid Fund', 'Ultra Short Duration', 'FD'],
  ['Equity Savings Fund', 'BAF', 'MAAF'],
  ['Multi-Asset Fund', 'Flexi Cap', 'Large & Mid Cap'],
  ['Multi Cap Fund', 'Flexi Cap', 'Value Fund'],
];

const BUCKET_COLORS = ['#10b981', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ceilToLakh(v: number): number {
  if (v <= 0) return 0;
  return Math.ceil(v / 100000) * 100000;
}

function formatLakhs(v: number): string {
  return 'Rs. ' + (v / 100000).toFixed(2) + ' L';
}

function monthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12;
}

function getMonthlyIncome(
  source: RegularIncome,
  age: number,
  retirementAge: number
): number {
  const startAge = source.startAge ?? retirementAge;
  const endAge = source.endAge ?? 999;
  if (age < startAge || age > endAge) return 0;

  const yearsFromStart = age - startAge;
  const growth = source.growthRate ?? 0;
  return source.monthlyAmount * Math.pow(1 + growth / 100, yearsFromStart);
}

// ── Main Calculator ──────────────────────────────────────────────────────────

export function calculateBucketStrategy(inputs: BucketInputs): BucketResult {
  const {
    clientName,
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentMonthlyHHE,
    retirementHHE,
    inflationRate,
    liquidReturn,
    shortTermReturn,
    debtReturn,
    balancedReturn,
    equityReturn,
    corpusSources,
    regularIncome,
    lumpsumEvents,
    wantsLegacy,
    legacyPercent,
  } = inputs;

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const retirementYears = lifeExpectancy - retirementAge;

  // ── Step 1: Total Corpus ───────────────────────────────────────────────
  const totalCorpus = corpusSources.reduce((sum, s) => sum + s.amount, 0);

  // ── Step 2: Monthly HHE at Retirement ──────────────────────────────────
  const monthlyHHEAtRetirement =
    retirementHHE && retirementHHE > 0
      ? retirementHHE
      : currentMonthlyHHE * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // ── Step 3: Total Monthly Income at Retirement ─────────────────────────
  const totalMonthlyIncome = regularIncome.reduce(
    (sum, src) => sum + getMonthlyIncome(src, retirementAge, retirementAge),
    0
  );

  // ── Step 4: Gap Analysis ───────────────────────────────────────────────
  const monthlyGap = Math.max(monthlyHHEAtRetirement - totalMonthlyIncome, 0);
  const gapPercent =
    monthlyHHEAtRetirement > 0
      ? (monthlyGap / monthlyHHEAtRetirement) * 100
      : 0;
  const incomeCoversPercent = 100 - gapPercent;

  // If no gap, return early
  if (monthlyGap <= 0) {
    return buildNoGapResult(inputs, totalCorpus, monthlyHHEAtRetirement, totalMonthlyIncome);
  }

  // ── Step 5: Corpus for Bucketing ───────────────────────────────────────
  const legacyAmount = wantsLegacy
    ? Math.round((legacyPercent / 100) * totalCorpus)
    : 0;
  const corpusForBucketing = totalCorpus - legacyAmount;

  // ── Step 6: Bucket Allocation ──────────────────────────────────────────
  const bucketReturnRates = [liquidReturn, shortTermReturn, debtReturn, balancedReturn, equityReturn];

  // B0: 6 months of FULL HHE (emergency covers everything) — optional
  const includeEmergency = inputs.includeEmergencyBucket !== false; // default true
  const b0Raw = includeEmergency ? 6 * monthlyHHEAtRetirement : 0;

  // B1: 3 years of gap, inflation-adjusted across years 1-3
  let b1Raw = 0;
  for (let yr = 0; yr < 3; yr++) {
    const adjustedGap = monthlyGap * Math.pow(1 + inflationRate / 100, yr);
    b1Raw += adjustedGap * 12;
  }

  const b0 = ceilToLakh(b0Raw);
  const b1 = ceilToLakh(b1Raw);

  const remaining = Math.max(corpusForBucketing - b0 - b1, 0);
  const b2 = ceilToLakh(remaining * 0.35);
  const b3 = ceilToLakh(remaining * 0.35);
  const b4 = Math.max(corpusForBucketing - b0 - b1 - b2 - b3, 0);

  const bucketAmounts = [b0, b1, b2, b3, b4];

  const buckets: BucketAllocation[] = bucketAmounts.map((amount, i) => ({
    bucketNumber: i,
    label: BUCKET_LABELS[i],
    timeline: BUCKET_TIMELINES[i],
    amount,
    amountInLakhs: formatLakhs(amount),
    returnRate: bucketReturnRates[i],
    products: BUCKET_PRODUCTS[i],
    color: BUCKET_COLORS[i],
  }));

  // ── Step 7: Year-by-Year Simulation ────────────────────────────────────
  const yearlyBreakdown: YearlyBreakdown[] = [];
  const bal = [b0, b1, b2, b3, b4];

  for (let yr = 0; yr < retirementYears; yr++) {
    const age = retirementAge + yr;
    const monthlyExpense = monthlyHHEAtRetirement * Math.pow(1 + inflationRate / 100, yr);

    const monthlyInc = regularIncome.reduce(
      (sum, src) => sum + getMonthlyIncome(src, age, retirementAge),
      0
    );

    const gap = Math.max(monthlyExpense - monthlyInc, 0);
    let annualWithdrawal = 0;
    let activeBucket = 'B1';
    const refillEvents: string[] = [];

    // Process lumpsum events FIRST (at start of year) so investments
    // boost corpus before withdrawals, and withdrawals reduce corpus before growth
    let lumpsumEventStr: string | undefined;
    const eventsThisYear = lumpsumEvents.filter((e) => e.atAge === age);
    for (const ev of eventsThisYear) {
      if (ev.type === 'investment') {
        bal[4] += ev.amount; // Investments go to equity bucket (growth engine)
        lumpsumEventStr = (lumpsumEventStr ? lumpsumEventStr + ', ' : '') + `${ev.label} +${formatLakhs(ev.amount)}`;
      } else {
        let toDeduct = ev.amount;
        for (let bi = 4; bi >= 1; bi--) {
          if (toDeduct <= 0) break;
          const deducted = Math.min(bal[bi], toDeduct);
          bal[bi] -= deducted;
          toDeduct -= deducted;
        }
        lumpsumEventStr = (lumpsumEventStr ? lumpsumEventStr + ', ' : '') + `${ev.label} -${formatLakhs(ev.amount)}`;
      }
    }

    // Month-by-month simulation
    let refillDoneThisYear = false; // Only one refill per year

    for (let m = 0; m < 12; m++) {
      // Grow each bucket
      for (let bi = 0; bi < 5; bi++) {
        if (bal[bi] > 0) {
          bal[bi] *= 1 + monthlyRate(bucketReturnRates[bi]);
        }
      }

      // Withdraw gap from lowest available non-emergency bucket
      let remaining = gap;
      for (let bi = 1; bi <= 4; bi++) {
        if (remaining <= 0) break;
        if (bal[bi] <= 0) continue;
        const take = Math.min(bal[bi], remaining);
        bal[bi] -= take;
        remaining -= take;
        annualWithdrawal += take;
        activeBucket = `B${bi}`;
      }
      if (remaining > 0) {
        activeBucket = 'Depleted';
      }

      // Refill logic: cascade ONLY when a bucket is fully empty
      // and ONLY ONCE per year to avoid draining upper buckets
      if (!refillDoneThisYear) {
        if (bal[1] <= 0 && bal[2] > 0) {
          const refillAmt = Math.min(bal[2], gap * 36); // 3 years' worth
          bal[1] += refillAmt;
          bal[2] -= refillAmt;
          refillEvents.push(`B2->B1: ${formatLakhs(refillAmt)}`);
          refillDoneThisYear = true;
        } else if (bal[2] <= 0 && bal[3] > 0) {
          const refillAmt = Math.min(bal[3], gap * 36); // 3 years' worth
          bal[2] += refillAmt;
          bal[3] -= refillAmt;
          refillEvents.push(`B3->B2: ${formatLakhs(refillAmt)}`);
          refillDoneThisYear = true;
        } else if (bal[3] <= 0 && bal[4] > 0) {
          const refillAmt = Math.min(bal[4], gap * 48); // 4 years' worth
          bal[3] += refillAmt;
          bal[4] -= refillAmt;
          refillEvents.push(`B4->B3: ${formatLakhs(refillAmt)}`);
          refillDoneThisYear = true;
        }
      }
    }

    const totalBal = bal[0] + bal[1] + bal[2] + bal[3] + bal[4];

    yearlyBreakdown.push({
      year: yr + 1,
      age,
      monthlyExpense: Math.round(monthlyExpense),
      monthlyIncome: Math.round(monthlyInc),
      monthlyGap: Math.round(gap),
      annualGapWithdrawal: Math.round(annualWithdrawal),
      lumpsumEvent: lumpsumEventStr,
      activeBucket,
      bucket0: Math.round(bal[0]),
      bucket1: Math.round(bal[1]),
      bucket2: Math.round(bal[2]),
      bucket3: Math.round(bal[3]),
      bucket4: Math.round(bal[4]),
      totalCorpus: Math.round(totalBal),
      refillEvent: refillEvents.length > 0 ? refillEvents[refillEvents.length - 1] : undefined,
    });
  }

  // ── Step 8: Sustainability ─────────────────────────────────────────────
  const finalTotal = bal[0] + bal[1] + bal[2] + bal[3] + bal[4];
  const legacyCorpus = Math.round(finalTotal) + legacyAmount;
  const isSustainable = finalTotal > 0;

  let depletionAge: number | undefined;
  if (!isSustainable) {
    const depletedRow = yearlyBreakdown.find(
      (row) => row.bucket1 + row.bucket2 + row.bucket3 + row.bucket4 <= 0
    );
    depletionAge = depletedRow?.age;
  }

  // ── Step 9: Insights ───────────────────────────────────────────────────
  const insights = generateInsights(
    inputs,
    monthlyHHEAtRetirement,
    totalMonthlyIncome,
    monthlyGap,
    incomeCoversPercent,
    isSustainable,
    depletionAge,
    legacyCorpus,
    corpusForBucketing,
    retirementYears
  );

  return {
    clientName,
    totalCorpus,
    totalMonthlyIncome: Math.round(totalMonthlyIncome),
    monthlyHHEAtRetirement: Math.round(monthlyHHEAtRetirement),
    monthlyGap: Math.round(monthlyGap),
    gapPercent: Math.round(gapPercent * 10) / 10,
    incomeCoversPercent: Math.round(incomeCoversPercent * 10) / 10,
    corpusForBucketing,
    legacyAmount,
    buckets,
    yearlyBreakdown,
    isSustainable,
    depletionAge,
    legacyCorpus,
    insights,
  };
}

// ── No-Gap Result ────────────────────────────────────────────────────────────

function buildNoGapResult(
  inputs: BucketInputs,
  totalCorpus: number,
  monthlyHHE: number,
  totalMonthlyIncome: number
): BucketResult {
  const retirementYears = inputs.lifeExpectancy - inputs.retirementAge;
  const bucketReturnRates = [inputs.liquidReturn, inputs.shortTermReturn, inputs.debtReturn, inputs.balancedReturn, inputs.equityReturn];

  const b0 = ceilToLakh(6 * monthlyHHE);
  const rem = Math.max(totalCorpus - b0, 0);
  const b2 = ceilToLakh(rem * 0.3);
  const b3 = ceilToLakh(rem * 0.35);
  const b4 = Math.max(rem - b2 - b3, 0);
  const bucketAmounts = [b0, 0, b2, b3, b4];

  const buckets: BucketAllocation[] = bucketAmounts.map((amount, i) => ({
    bucketNumber: i,
    label: BUCKET_LABELS[i],
    timeline: BUCKET_TIMELINES[i],
    amount,
    amountInLakhs: formatLakhs(amount),
    returnRate: bucketReturnRates[i],
    products: BUCKET_PRODUCTS[i],
    color: BUCKET_COLORS[i],
  }));

  const yearlyBreakdown: YearlyBreakdown[] = [];
  const bal = [...bucketAmounts];

  for (let yr = 0; yr < retirementYears; yr++) {
    const age = inputs.retirementAge + yr;
    const monthlyExpense = monthlyHHE * Math.pow(1 + inputs.inflationRate / 100, yr);
    const monthlyInc = inputs.regularIncome.reduce(
      (sum, src) => sum + getMonthlyIncome(src, age, inputs.retirementAge),
      0
    );

    for (let bi = 0; bi < 5; bi++) {
      bal[bi] *= 1 + bucketReturnRates[bi] / 100;
    }

    yearlyBreakdown.push({
      year: yr + 1,
      age,
      monthlyExpense: Math.round(monthlyExpense),
      monthlyIncome: Math.round(monthlyInc),
      monthlyGap: 0,
      annualGapWithdrawal: 0,
      activeBucket: 'None',
      bucket0: Math.round(bal[0]),
      bucket1: Math.round(bal[1]),
      bucket2: Math.round(bal[2]),
      bucket3: Math.round(bal[3]),
      bucket4: Math.round(bal[4]),
      totalCorpus: Math.round(bal[0] + bal[1] + bal[2] + bal[3] + bal[4]),
    });
  }

  const finalTotal = bal[0] + bal[1] + bal[2] + bal[3] + bal[4];

  return {
    clientName: inputs.clientName,
    totalCorpus,
    totalMonthlyIncome: Math.round(totalMonthlyIncome),
    monthlyHHEAtRetirement: Math.round(monthlyHHE),
    monthlyGap: 0,
    gapPercent: 0,
    incomeCoversPercent: 100,
    corpusForBucketing: totalCorpus,
    legacyAmount: 0,
    buckets,
    yearlyBreakdown,
    isSustainable: true,
    legacyCorpus: Math.round(finalTotal),
    insights: [
      {
        type: 'positive',
        title: 'Income Fully Covers Expenses',
        description: `Your regular income of Rs. ${Math.round(totalMonthlyIncome).toLocaleString('en-IN')}/month fully covers your estimated expenses of Rs. ${Math.round(monthlyHHE).toLocaleString('en-IN')}/month. Your corpus can remain invested for growth and legacy.`,
      },
      {
        type: 'tip',
        title: 'Keep Corpus Growing',
        description: 'Since your income covers expenses, invest your corpus in growth-oriented funds. Consider a mix of Multi-Asset, Flexi Cap, and Value Funds for long-term wealth creation.',
      },
      {
        type: 'positive',
        title: 'Strong Legacy Potential',
        description: `At life expectancy of ${inputs.lifeExpectancy}, your corpus could grow to Rs. ${(finalTotal / 100000).toFixed(0)} L — a substantial legacy for your nominees.`,
      },
    ],
  };
}

// ── Insights Generator ───────────────────────────────────────────────────────

function generateInsights(
  inputs: BucketInputs,
  monthlyHHE: number,
  totalMonthlyIncome: number,
  monthlyGap: number,
  incomeCoversPercent: number,
  isSustainable: boolean,
  depletionAge: number | undefined,
  legacyCorpus: number,
  corpusForBucketing: number,
  retirementYears: number
): BucketInsight[] {
  const insights: BucketInsight[] = [];

  // 1. Income coverage
  if (incomeCoversPercent >= 70) {
    insights.push({
      type: 'positive',
      title: `Income Covers ${incomeCoversPercent.toFixed(0)}% of Expenses`,
      description: `Your regular income of Rs. ${Math.round(totalMonthlyIncome).toLocaleString('en-IN')}/month covers most of your expenses. Only the gap of Rs. ${Math.round(monthlyGap).toLocaleString('en-IN')}/month needs corpus funding.`,
    });
  } else if (incomeCoversPercent >= 40) {
    insights.push({
      type: 'warning',
      title: `Income Covers Only ${incomeCoversPercent.toFixed(0)}% of Expenses`,
      description: `Your corpus needs to fund Rs. ${Math.round(monthlyGap).toLocaleString('en-IN')}/month. Consider adding SCSS (Rs. 30L limit, ~8% p.a.) or PMVVY to reduce this gap.`,
    });
  } else {
    insights.push({
      type: 'critical',
      title: `Income Covers Only ${incomeCoversPercent.toFixed(0)}% of Expenses`,
      description: `Your corpus has heavy lifting — funding Rs. ${Math.round(monthlyGap).toLocaleString('en-IN')}/month. Consider increasing income sources aggressively before retirement.`,
    });
  }

  // 2. Sustainability
  if (isSustainable) {
    insights.push({
      type: 'positive',
      title: 'Corpus is Sustainable',
      description: `Your bucket strategy sustains withdrawals through age ${inputs.lifeExpectancy}. Remaining corpus of Rs. ${(legacyCorpus / 100000).toFixed(0)} L provides a buffer beyond life expectancy.`,
    });
  } else {
    insights.push({
      type: 'critical',
      title: `Corpus Depletes at Age ${depletionAge}`,
      description: `Your buckets run out ${inputs.lifeExpectancy - (depletionAge ?? inputs.lifeExpectancy)} years before life expectancy. Consider: (a) reducing expenses, (b) increasing income sources, (c) delaying retirement by 2-3 years, or (d) adding more to corpus.`,
    });
  }

  // 3. Legacy
  if (inputs.wantsLegacy && inputs.legacyPercent > 0) {
    const legacyAmt = (inputs.legacyPercent / 100) * inputs.corpusSources.reduce((s, c) => s + c.amount, 0);
    insights.push({
      type: 'tip',
      title: `Legacy Allocation: ${inputs.legacyPercent}%`,
      description: `Rs. ${(legacyAmt / 100000).toFixed(0)} L set aside for nominees. This is invested separately and not touched for retirement expenses. Review annually.`,
    });
  }

  // 4. Tax tips
  const hasNPS = inputs.corpusSources.some((s) => s.type === 'nps_lumpsum') ||
    inputs.regularIncome.some((s) => s.type === 'nps_annuity');
  const hasSCSS = inputs.regularIncome.some((s) => s.type === 'scss');

  if (hasNPS) {
    insights.push({
      type: 'tip',
      title: 'NPS Tax Benefits',
      description: 'NPS lumpsum (60%) is tax-free on maturity. The annuity portion is taxable as income. Claim deduction under Section 80CCD(1B) for additional Rs. 50,000 before retirement.',
    });
  }

  if (hasSCSS) {
    insights.push({
      type: 'tip',
      title: 'SCSS Tax Benefit — Section 80TTB',
      description: 'Senior citizens get Rs. 50,000 deduction on interest income under Section 80TTB. SCSS interest qualifies. TDS threshold is Rs. 50,000 for senior citizens.',
    });
  }

  // 5. Corpus adequacy
  const annualGap = monthlyGap * 12;
  const corpusToGapRatio = annualGap > 0 ? corpusForBucketing / annualGap : Infinity;

  if (corpusToGapRatio < retirementYears * 0.5) {
    insights.push({
      type: 'critical',
      title: 'Corpus May Be Insufficient',
      description: `Your corpus covers roughly ${Math.round(corpusToGapRatio)} years of the gap at current levels (before growth). With ${retirementYears} years of retirement, consider adding more corpus or reducing the gap.`,
    });
  } else if (corpusToGapRatio >= retirementYears * 1.5) {
    insights.push({
      type: 'positive',
      title: 'Strong Corpus Position',
      description: 'Your corpus is well-sized relative to the gap. Even conservative returns should sustain your retirement comfortably. Consider allocating more to growth (B3/B4) for legacy building.',
    });
  }

  // 6. Inflation warning
  if (inputs.inflationRate >= 6) {
    insights.push({
      type: 'warning',
      title: 'High Inflation Assumption',
      description: `At ${inputs.inflationRate}% inflation, your monthly expenses will double every ${Math.round(72 / inputs.inflationRate)} years. Ensure growth buckets (B3, B4) earn above inflation to maintain purchasing power.`,
    });
  }

  // 7. Annual review
  insights.push({
    type: 'tip',
    title: 'Annual Review Recommended',
    description: 'Review your bucket strategy every year. Rebalance if any bucket deviates by more than 10% from plan. Adjust for actual inflation and returns experienced.',
  });

  return insights;
}
