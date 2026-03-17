// Financial Planning Engine - Constants, Scoring Model & Defaults
// Trustner Asset Services Pvt Ltd | ARN-286886

import type {
  FinancialPlanningData,
  GoalType,
  WizardStepConfig,
} from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// 1. WIZARD STEPS
// ---------------------------------------------------------------------------

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 1,
    title: 'Personal Profile',
    description: 'Tell us about yourself and your family',
    icon: 'User',
    required: true,
  },
  {
    id: 2,
    title: 'Career & Employment',
    description: 'Your career details and income stability',
    icon: 'Briefcase',
    required: true,
  },
  {
    id: 3,
    title: 'Income & Expenses',
    description: 'Monthly income, expenses and existing commitments',
    icon: 'IndianRupee',
    required: true,
  },
  {
    id: 4,
    title: 'Assets & Liabilities',
    description: 'Your current wealth and outstanding debts',
    icon: 'Landmark',
    required: true,
  },
  {
    id: 5,
    title: 'Insurance & Protection',
    description: 'Life, health and other insurance covers',
    icon: 'ShieldCheck',
    required: true,
  },
  {
    id: 6,
    title: 'Financial Goals',
    description: 'Define your life goals with target amounts and timelines',
    icon: 'Target',
    required: true,
  },
  {
    id: 7,
    title: 'Risk & Behavior',
    description: 'Understand your risk appetite and investment behavior',
    icon: 'Brain',
    required: true,
  },
  {
    id: 8,
    title: 'Tax & Emergency',
    description: 'Tax regime, deductions and emergency preparedness',
    icon: 'Calculator',
    required: true,
  },
] as const;

// ---------------------------------------------------------------------------
// 2. GENDER OPTIONS
// ---------------------------------------------------------------------------

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

// ---------------------------------------------------------------------------
// 3. MARITAL STATUS OPTIONS
// ---------------------------------------------------------------------------

export const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
] as const;

// ---------------------------------------------------------------------------
// 4. CITY TIER OPTIONS
// ---------------------------------------------------------------------------

export const CITY_TIER_OPTIONS = [
  {
    value: 'metro',
    label: 'Metro City',
    description: 'Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune',
  },
  {
    value: 'tier1',
    label: 'Tier 1 City',
    description: 'Jaipur, Lucknow, Ahmedabad, Chandigarh, Indore, Nagpur, Coimbatore',
  },
  {
    value: 'tier2',
    label: 'Tier 2 City',
    description: 'Guwahati, Bhopal, Patna, Ranchi, Dehradun, Mysore, Vizag',
  },
  {
    value: 'tier3',
    label: 'Tier 3 / Smaller City',
    description: 'Smaller cities and towns',
  },
] as const;

// ---------------------------------------------------------------------------
// 5. RESIDENTIAL STATUS OPTIONS
// ---------------------------------------------------------------------------

export const RESIDENTIAL_STATUS_OPTIONS = [
  { value: 'own', label: 'Own House' },
  { value: 'rent', label: 'Rented' },
  { value: 'family', label: 'Living with Family' },
] as const;

// ---------------------------------------------------------------------------
// 6. EMPLOYMENT TYPE OPTIONS
// ---------------------------------------------------------------------------

export const EMPLOYMENT_TYPE_OPTIONS = [
  {
    value: 'salaried',
    label: 'Salaried',
    description: 'Regular monthly salary from an employer',
  },
  {
    value: 'self-employed',
    label: 'Self-Employed / Freelancer',
    description: 'Independent professional or consultant',
  },
  {
    value: 'business',
    label: 'Business Owner',
    description: 'Owner of a business or partnership firm',
  },
  {
    value: 'retired',
    label: 'Retired',
    description: 'Retired from active employment',
  },
  {
    value: 'homemaker',
    label: 'Homemaker',
    description: 'Managing household, not currently employed',
  },
] as const;

// ---------------------------------------------------------------------------
// 7. INCOME STABILITY OPTIONS
// ---------------------------------------------------------------------------

export const INCOME_STABILITY_OPTIONS = [
  {
    value: 'very-stable',
    label: 'Very Stable',
    description: 'Government job, large corporate with long tenure',
  },
  {
    value: 'stable',
    label: 'Stable',
    description: 'Private sector job with regular income',
  },
  {
    value: 'variable',
    label: 'Variable',
    description: 'Income fluctuates seasonally or by project',
  },
  {
    value: 'highly-variable',
    label: 'Highly Variable',
    description: 'Freelance, commission-based, or startup income',
  },
] as const;

// ---------------------------------------------------------------------------
// 8. INDUSTRY OPTIONS
// ---------------------------------------------------------------------------

export const INDUSTRY_OPTIONS = [
  { value: 'it-software', label: 'IT / Software' },
  { value: 'banking-finance', label: 'Banking / Finance' },
  { value: 'government-psu', label: 'Government / PSU' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'retail', label: 'Retail' },
  { value: 'media-entertainment', label: 'Media / Entertainment' },
  { value: 'legal', label: 'Legal' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'pharma', label: 'Pharma' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'others', label: 'Others' },
] as const;

// ---------------------------------------------------------------------------
// 9. GOAL TYPE OPTIONS
// ---------------------------------------------------------------------------

export const GOAL_TYPE_OPTIONS: {
  value: GoalType;
  label: string;
  icon: string;
  defaultAmount: number;
  defaultInflation: number;
}[] = [
  {
    value: 'retirement',
    label: 'Retirement Corpus',
    icon: 'Armchair',
    defaultAmount: 50000000, // 5 Cr
    defaultInflation: 6,
  },
  {
    value: 'child-education',
    label: 'Child Education',
    icon: 'GraduationCap',
    defaultAmount: 5000000, // 50 Lakh
    defaultInflation: 10,
  },
  {
    value: 'child-marriage',
    label: 'Child Marriage',
    icon: 'Heart',
    defaultAmount: 3000000, // 30 Lakh
    defaultInflation: 7,
  },
  {
    value: 'house-purchase',
    label: 'House Purchase',
    icon: 'Home',
    defaultAmount: 10000000, // 1 Cr
    defaultInflation: 7,
  },
  {
    value: 'car-purchase',
    label: 'Car Purchase',
    icon: 'Car',
    defaultAmount: 1500000, // 15 Lakh
    defaultInflation: 5,
  },
  {
    value: 'vacation',
    label: 'Dream Vacation',
    icon: 'Plane',
    defaultAmount: 500000, // 5 Lakh
    defaultInflation: 6,
  },
  {
    value: 'emergency-fund',
    label: 'Emergency Fund',
    icon: 'LifeBuoy',
    defaultAmount: 600000, // 6 Lakh
    defaultInflation: 6,
  },
  {
    value: 'wealth-creation',
    label: 'Wealth Creation',
    icon: 'TrendingUp',
    defaultAmount: 10000000, // 1 Cr
    defaultInflation: 6,
  },
  {
    value: 'early-retirement',
    label: 'Early Retirement (FIRE)',
    icon: 'Flame',
    defaultAmount: 80000000, // 8 Cr
    defaultInflation: 6,
  },
  {
    value: 'custom',
    label: 'Custom Goal',
    icon: 'Star',
    defaultAmount: 1000000, // 10 Lakh
    defaultInflation: 6,
  },
];

// ---------------------------------------------------------------------------
// 10. GOAL PRIORITY OPTIONS
// ---------------------------------------------------------------------------

export const GOAL_PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'important', label: 'Important', color: '#f59e0b' },
  { value: 'nice-to-have', label: 'Nice to Have', color: '#3b82f6' },
] as const;

// ---------------------------------------------------------------------------
// 11. RISK QUESTIONS
// ---------------------------------------------------------------------------

export const RISK_QUESTIONS = [
  {
    question:
      'If the stock market drops 30% in one month and your portfolio loses Rs 3 lakh, what would you do?',
    options: [
      { label: 'Sell everything immediately to prevent further losses', score: 1 },
      { label: 'Wait patiently for the market to recover', score: 3 },
      { label: 'Invest more to buy at lower prices', score: 5 },
    ],
  },
  {
    question: 'What is your primary investment horizon for the majority of your wealth?',
    options: [
      { label: 'Less than 3 years', score: 1 },
      { label: '3 to 5 years', score: 2 },
      { label: '5 to 10 years', score: 4 },
      { label: 'More than 10 years', score: 5 },
    ],
  },
  {
    question: 'What is your primary objective when investing money?',
    options: [
      { label: 'Protect my capital at all costs, even if returns are low', score: 1 },
      { label: 'Balanced growth with moderate ups and downs', score: 3 },
      { label: 'Aggressive growth — I can tolerate significant short-term losses', score: 5 },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// 12. BEHAVIORAL QUESTIONS
// ---------------------------------------------------------------------------

export const BEHAVIORAL_QUESTIONS = [
  {
    question: 'Do you track your monthly income and expenses regularly?',
    options: [
      { label: 'Yes, I maintain a detailed budget every month', score: 5 },
      { label: 'I have a rough idea but do not track actively', score: 3 },
      { label: 'No, I rarely check my spending', score: 1 },
    ],
  },
  {
    question:
      'When you see negative market news or a friend panic-selling, how does it influence your investment decisions?',
    options: [
      { label: 'It heavily influences me — I tend to follow the crowd', score: 1 },
      { label: 'I get anxious but usually stick to my plan', score: 3 },
      { label: 'It rarely affects me — I follow my long-term strategy', score: 5 },
    ],
  },
  {
    question:
      'How disciplined are you with your SIPs and regular investments during market downturns?',
    options: [
      { label: 'Very disciplined — I never stop or pause my SIPs', score: 5 },
      { label: 'Mostly disciplined — I may pause briefly but restart soon', score: 3 },
      { label: 'I often pause or stop SIPs when markets fall', score: 1 },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// 13. TAX REGIME OPTIONS
// ---------------------------------------------------------------------------

export const TAX_REGIME_OPTIONS = [
  {
    value: 'old',
    label: 'Old Tax Regime',
    description:
      'Allows deductions under 80C, 80D, HRA, NPS etc. Better if you have high deductions.',
  },
  {
    value: 'new',
    label: 'New Tax Regime',
    description:
      'Lower tax rates with minimal deductions. Better if your total deductions are low.',
  },
] as const;

// ---------------------------------------------------------------------------
// 14. SCORING WEIGHTS & ASSUMPTIONS
// ---------------------------------------------------------------------------

export const SCORING_WEIGHTS = {
  /** Savings rate thresholds (savings as % of income) */
  savingsRate: {
    excellent: 30, // 30%+ savings rate
    good: 20,
    fair: 10,
    poor: 5,
  },
  /** Debt-to-income ratio thresholds (total EMIs as % of income) */
  debtToIncome: {
    excellent: 10, // Under 10%
    good: 20,
    fair: 35,
    poor: 50, // Over 50% is critical
  },
  /** Emergency fund: months of expenses covered */
  emergencyMonths: {
    excellent: 12, // 12+ months
    good: 6,
    fair: 3,
    poor: 1,
  },
  /** Minimum health insurance cover needed by city tier (in lakhs) */
  healthInsuranceNeed: {
    metro: 2000000, // 20 Lakh
    tier1: 1500000, // 15 Lakh
    tier2: 1000000, // 10 Lakh
    tier3: 750000, // 7.5 Lakh
  },
  /** Inflation rate assumptions (% per annum) */
  inflationRates: {
    general: 6,
    education: 10,
    medical: 12,
  },
  /** Return assumptions (% per annum, long-term CAGR) */
  returnAssumptions: {
    equity: 12,
    debt: 7,
    gold: 8,
    balanced: 10,
  },
  /** Life expectancy assumption for retirement planning */
  lifeExpectancy: 85,
} as const;

// ---------------------------------------------------------------------------
// 15. GRADE THRESHOLDS
// ---------------------------------------------------------------------------

export const GRADE_THRESHOLDS = [
  { min: 750, grade: 'Excellent', color: '#16a34a', bgColor: '#f0fdf4' },
  { min: 600, grade: 'Good', color: '#0d9488', bgColor: '#f0fdfa' },
  { min: 450, grade: 'Fair', color: '#d97706', bgColor: '#fffbeb' },
  { min: 300, grade: 'Needs Improvement', color: '#ea580c', bgColor: '#fff7ed' },
  { min: 0, grade: 'Critical', color: '#dc2626', bgColor: '#fef2f2' },
] as const;

// ---------------------------------------------------------------------------
// 16. PILLAR CONFIG
// ---------------------------------------------------------------------------

export const PILLAR_CONFIG = [
  { key: 'cashflow', name: 'Cash Flow & Savings', icon: 'Wallet', color: '#16a34a' },
  { key: 'protection', name: 'Insurance & Protection', icon: 'ShieldCheck', color: '#2563eb' },
  { key: 'investments', name: 'Investments & Growth', icon: 'TrendingUp', color: '#7c3aed' },
  { key: 'debt', name: 'Debt Management', icon: 'CreditCard', color: '#ea580c' },
  {
    key: 'retirementReadiness',
    name: 'Retirement Readiness',
    icon: 'Armchair',
    color: '#0d9488',
  },
] as const;

// ---------------------------------------------------------------------------
// 17. DISCLAIMER
// ---------------------------------------------------------------------------

export const DISCLAIMER_FP =
  'This Financial Health Report is generated for educational and informational purposes only. ' +
  'It does not constitute investment advice, tax advice, or a recommendation to buy or sell ' +
  'any financial product. The projections and scores are based on assumptions and the data you ' +
  'have provided; actual results may vary. Mutual fund investments are subject to market risks. ' +
  'Please read all scheme-related documents carefully before investing. Past performance is not ' +
  'indicative of future returns. For personalised investment advice, consult your financial ' +
  'advisor. Trustner Asset Services Pvt Ltd is an AMFI-registered Mutual Fund Distributor ' +
  '(ARN-286886). AMFI-registered distributors earn trail commission from AMCs — this does not ' +
  'increase the cost to the investor.';

// ---------------------------------------------------------------------------
// 18. DEFAULT PLANNING DATA
// ---------------------------------------------------------------------------

const defaultLoan = {
  outstanding: 0,
  emi: 0,
  remainingYears: 0,
};

export const DEFAULT_PLANNING_DATA: FinancialPlanningData = {
  personalProfile: {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: 0,
    gender: 'male',
    maritalStatus: 'single',
    dependents: 0,
    spouseAge: null,
    childrenAges: [],
    state: '',
    city: '',
    cityTier: 'metro',
    otherCity: '',
    pincode: '',
    residentialStatus: 'rent',
  },
  careerProfile: {
    employmentType: 'salaried',
    industry: '',
    yearsInCurrentJob: 0,
    incomeStability: 'stable',
    expectedRetirementAge: 60,
    spouseWorks: false,
    expectedAnnualGrowth: 8,
  },
  incomeProfile: {
    monthlyInHandSalary: 0,
    annualBonus: 0,
    rentalIncome: 0,
    businessIncome: 0,
    otherIncome: 0,
    monthlyHouseholdExpenses: 0,
    monthlyEMIs: 0,
    monthlyRent: 0,
    monthlySIPsRunning: 0,
    monthlyInsurancePremiums: 0,
    annualDiscretionary: 0,
  },
  assetProfile: {
    bankSavings: 0,
    fixedDeposits: 0,
    mutualFunds: 0,
    stocks: 0,
    ppfEpf: 0,
    nps: 0,
    gold: 0,
    realEstateInvestment: 0,
    primaryResidenceValue: 0,
    otherAssets: 0,
  },
  liabilityProfile: {
    homeLoan: { ...defaultLoan },
    carLoan: { ...defaultLoan },
    personalLoan: { ...defaultLoan },
    educationLoan: { ...defaultLoan },
    creditCardDebt: 0,
    otherLoans: 0,
  },
  insuranceProfile: {
    termInsuranceCover: 0,
    lifeInsuranceCover: 0,
    healthInsuranceCover: 0,
    hasCriticalIllnessCover: false,
    hasAccidentalCover: false,
    annualLifePremium: 0,
    annualHealthPremium: 0,
  },
  goals: [],
  riskProfile: {
    marketDropReaction: 'wait-patiently',
    investmentHorizon: '5-to-10',
    primaryObjective: 'balanced-growth',
    pastExperience: 'limited',
    riskScore: 0,
    riskCategory: 'moderate',
  },
  behavioralProfile: {
    tracksExpensesMonthly: false,
    marketNewsInfluence: 'somewhat',
    investmentDiscipline: 'mostly-disciplined',
    behavioralScore: 0,
  },
  emergencyProfile: {
    hasEmergencyFund: false,
    emergencyFundAmount: 0,
    monthsOfExpensesCovered: 0,
  },
  taxProfile: {
    taxRegime: 'new',
    annualTaxableIncome: 0,
    section80CUsed: 0,
    section80DUsed: 0,
    hasHRA: false,
    npsContribution: 0,
  },
};
