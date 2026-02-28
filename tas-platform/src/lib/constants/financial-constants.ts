// ===== Education Costs (Current year, in INR) =====
export const EDUCATION_COSTS: Record<
  string,
  { label: string; cost: number; duration: string; country: string }
> = {
  iit_btech: {
    label: "IIT B.Tech",
    cost: 1000000,
    duration: "4 years",
    country: "India",
  },
  nit_btech: {
    label: "NIT B.Tech",
    cost: 600000,
    duration: "4 years",
    country: "India",
  },
  private_eng: {
    label: "Private Engineering",
    cost: 800000,
    duration: "4 years",
    country: "India",
  },
  iim_mba: {
    label: "IIM MBA",
    cost: 2500000,
    duration: "2 years",
    country: "India",
  },
  private_mba: {
    label: "Private MBA",
    cost: 1500000,
    duration: "2 years",
    country: "India",
  },
  mbbs_govt: {
    label: "MBBS (Government)",
    cost: 500000,
    duration: "5.5 years",
    country: "India",
  },
  mbbs_private: {
    label: "MBBS (Private)",
    cost: 5000000,
    duration: "5.5 years",
    country: "India",
  },
  ca: {
    label: "Chartered Accountancy",
    cost: 300000,
    duration: "3-5 years",
    country: "India",
  },
  law_nlu: {
    label: "NLU Law (5-Year)",
    cost: 1200000,
    duration: "5 years",
    country: "India",
  },
  ms_usa: {
    label: "MS in USA",
    cost: 4000000,
    duration: "2 years",
    country: "USA",
  },
  mba_usa: {
    label: "MBA in USA",
    cost: 8000000,
    duration: "2 years",
    country: "USA",
  },
  ms_uk: {
    label: "Masters in UK",
    cost: 3500000,
    duration: "1-2 years",
    country: "UK",
  },
  masters_australia: {
    label: "Masters in Australia",
    cost: 3000000,
    duration: "2 years",
    country: "Australia",
  },
  masters_canada: {
    label: "Masters in Canada",
    cost: 2500000,
    duration: "2 years",
    country: "Canada",
  },
  mbbs_abroad: {
    label: "MBBS Abroad",
    cost: 4000000,
    duration: "5-6 years",
    country: "Abroad",
  },
};

// ===== Medical Cost Multipliers by City Tier =====
export const MEDICAL_COST_MULTIPLIER: Record<string, number> = {
  metro: 1.5, // Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata
  tier1: 1.2, // Pune, Ahmedabad, Jaipur, Lucknow, etc.
  tier2: 1.0, // Guwahati, Indore, Bhopal, etc.
  tier3: 0.8, // Smaller cities and towns
};

// ===== Insurance Benchmarks =====
export const INSURANCE_BENCHMARKS = {
  minHealthCover: 500000, // 5L minimum
  idealHealthCover: 1000000, // 10L recommended
  metroHealthCover: 1500000, // 15L for metro cities
  termInsuranceMultiple: 10, // 10x annual income (minimum)
  idealTermMultiple: 15, // 15x for young earners
  medicalInflation: 0.12, // 12% per annum
  criticalIllnessCost: {
    heartSurgery: 500000,
    cancerTreatment: 2000000,
    kidneyTransplant: 1000000,
    kneeReplacement: 400000,
  },
};

// ===== Financial Health Benchmarks =====
export const BENCHMARKS = {
  savingsRate: {
    poor: 10,
    fair: 20,
    good: 30,
    excellent: 40,
  },
  emiToIncome: {
    healthy: 10,
    manageable: 30,
    high: 50,
  },
  emergencyMonths: {
    minimum: 3,
    ideal: 6,
    excellent: 12,
  },
  investmentToIncome: {
    poor: 5,
    fair: 10,
    good: 20,
    excellent: 30,
  },
  emergencyMonthsByOccupation: {
    salaried: 6,
    "self-employed": 9,
    business: 12,
    professional: 9,
    retired: 12,
    homemaker: 6,
  } as Record<string, number>,
};

// ===== Inflation Rates =====
export const INFLATION = {
  general: 0.06, // 6%
  education: 0.08, // 8% (India), conservative estimate
  educationAbroad: 0.04, // 4% (developed countries)
  medical: 0.12, // 12%
  lifestyle: 0.07, // 7%
  housing: 0.05, // 5%
  food: 0.07, // 7%
};

// ===== Tax Constants FY 2025-26 =====
export const TAX_LIMITS = {
  section80C: 150000,
  section80D_self: 25000,
  section80D_self_senior: 50000,
  section80D_parents: 25000,
  section80D_parents_senior: 50000,
  section80CCD1B: 50000, // NPS
  section80TTA: 10000,
  section80TTB_senior: 50000,
  section24b_homeLoan: 200000,
  standardDeduction: 75000,
  // New Regime FY 2025-26
  newRegimeBasicExemption: 400000,
  newRegimeRebateLimit: 1200000,
  newRegimeRebateAmount: 60000,
  // Old Regime
  oldRegimeBasicExemption: 250000,
  oldRegimeRebateLimit: 500000,
  oldRegimeRebateAmount: 12500,
};

// Tax slabs - New Regime FY 2025-26
export const NEW_REGIME_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 5 },
  { min: 800000, max: 1200000, rate: 10 },
  { min: 1200000, max: 1600000, rate: 15 },
  { min: 1600000, max: 2000000, rate: 20 },
  { min: 2000000, max: 2400000, rate: 25 },
  { min: 2400000, max: Infinity, rate: 30 },
];

// Tax slabs - Old Regime
export const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

// ===== Default Return Assumptions =====
export const RETURN_ASSUMPTIONS = {
  equity: {
    conservative: 10,
    moderate: 12,
    aggressive: 14,
  },
  debt: {
    conservative: 6,
    moderate: 7,
    aggressive: 8,
  },
  gold: {
    long_term: 8,
  },
  ppf: 7.1, // Current PPF rate
  epf: 8.25, // Current EPF rate
  nps_equity: 10,
  nps_corporate: 8,
  nps_govt: 7,
  fd: 7.0,
  savings: 3.5,
  realEstate: 6,
};

// ===== Asset Allocation by Risk Profile =====
export const ALLOCATION_BY_RISK: Record<
  string,
  { equity: number; debt: number; gold: number; cash: number }
> = {
  conservative: { equity: 20, debt: 60, gold: 10, cash: 10 },
  moderate: { equity: 45, debt: 35, gold: 10, cash: 10 },
  moderately_aggressive: { equity: 65, debt: 20, gold: 10, cash: 5 },
  aggressive: { equity: 80, debt: 10, gold: 5, cash: 5 },
};

// ===== Age-adjusted Allocation =====
export function getAgeAdjustedEquity(age: number, riskEquity: number): number {
  // Rule of thumb: max equity = 100 - age, but modified by risk profile
  const ageBasedMax = Math.max(100 - age, 20);
  return Math.min(riskEquity, ageBasedMax);
}

// ===== Fund Category Suggestions by Goal Timeline =====
export const FUND_CATEGORY_BY_TIMELINE: Record<
  string,
  { category: string; description: string }
> = {
  "0-2": {
    category: "Liquid / Ultra Short Duration",
    description: "Capital preservation for near-term goals",
  },
  "2-4": {
    category: "Short Duration / Corporate Bond",
    description: "Moderate stability with better returns than FDs",
  },
  "4-7": {
    category: "Aggressive Hybrid / Balanced Advantage",
    description: "Mix of equity and debt for medium-term growth",
  },
  "7-10": {
    category: "Flexi Cap / Large & Mid Cap",
    description: "Equity-oriented growth for long-term goals",
  },
  "10+": {
    category: "Small Cap / Mid Cap / Index",
    description: "High-growth equity for very long-term wealth creation",
  },
};

export function getSuggestedFundCategory(years: number): {
  category: string;
  description: string;
} {
  if (years <= 2) return FUND_CATEGORY_BY_TIMELINE["0-2"];
  if (years <= 4) return FUND_CATEGORY_BY_TIMELINE["2-4"];
  if (years <= 7) return FUND_CATEGORY_BY_TIMELINE["4-7"];
  if (years <= 10) return FUND_CATEGORY_BY_TIMELINE["7-10"];
  return FUND_CATEGORY_BY_TIMELINE["10+"];
}

// ===== Income Percentiles (approximate, India 2024-25) =====
export const INCOME_PERCENTILES: { income: number; percentile: number }[] = [
  { income: 250000, percentile: 50 },
  { income: 500000, percentile: 70 },
  { income: 750000, percentile: 80 },
  { income: 1000000, percentile: 88 },
  { income: 1500000, percentile: 93 },
  { income: 2500000, percentile: 97 },
  { income: 5000000, percentile: 99 },
  { income: 10000000, percentile: 99.5 },
];

export function getIncomePercentile(annualIncome: number): number {
  for (let i = INCOME_PERCENTILES.length - 1; i >= 0; i--) {
    if (annualIncome >= INCOME_PERCENTILES[i].income) {
      return INCOME_PERCENTILES[i].percentile;
    }
  }
  return 30; // Below 2.5L
}
