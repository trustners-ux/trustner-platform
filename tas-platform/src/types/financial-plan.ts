// ===== Personal Profile =====
export interface PersonalProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  dependents: number;
  city: "metro" | "tier1" | "tier2" | "tier3";
  occupation:
    | "salaried"
    | "self-employed"
    | "business"
    | "professional"
    | "retired"
    | "homemaker";
}

// ===== Income & Expenses =====
export interface IncomeDetails {
  monthlySalary: number;
  bonusAnnual: number;
  rentalIncome: number;
  businessIncome: number;
  otherIncome: number;
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
}

export interface ExpenseDetails {
  housing: number;
  utilities: number;
  groceries: number;
  transportation: number;
  education: number;
  healthcare: number;
  entertainment: number;
  personalCare: number;
  insurance: number;
  emiPayments: number;
  domesticHelp: number;
  other: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
  savingsRate: number;
}

// ===== Assets & Liabilities =====
export interface Asset {
  id: string;
  category:
    | "cash"
    | "equity"
    | "debt"
    | "real-estate"
    | "gold"
    | "ppf"
    | "nps"
    | "epf"
    | "other";
  name: string;
  currentValue: number;
  isLiquid: boolean;
}

export interface Liability {
  id: string;
  type:
    | "home-loan"
    | "car-loan"
    | "personal-loan"
    | "education-loan"
    | "credit-card"
    | "gold-loan"
    | "other";
  name: string;
  outstandingAmount: number;
  emi: number;
  interestRate: number;
  remainingTenureMonths: number;
}

export interface NetWorthStatement {
  assets: Asset[];
  liabilities: Liability[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
}

// ===== Insurance =====
export interface HealthPolicy {
  id: string;
  insurer: string;
  type: "individual" | "floater" | "top-up" | "corporate";
  sumInsured: number;
  annualPremium: number;
  coveredMembers: number;
}

export interface TermPolicy {
  id: string;
  insurer: string;
  sumAssured: number;
  annualPremium: number;
  policyTenure: number;
  remainingYears: number;
}

export interface OtherLifePolicy {
  id: string;
  type: "endowment" | "ulip" | "moneyback" | "wholelife";
  sumAssured: number;
  annualPremium: number;
  currentValue: number;
}

export interface InsuranceCoverage {
  hasHealthInsurance: boolean;
  healthPolicies: HealthPolicy[];
  hasTermInsurance: boolean;
  termPolicies: TermPolicy[];
  hasOtherLifeInsurance: boolean;
  otherLifePolicies: OtherLifePolicy[];
  totalHealthCover: number;
  totalLifeCover: number;
}

// ===== Financial Goals =====
export type GoalType =
  | "retirement"
  | "child-education"
  | "house"
  | "car"
  | "wedding"
  | "vacation"
  | "emergency-fund"
  | "wealth-creation"
  | "custom";

export interface FinancialGoal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetYear: number;
  inflationRate: number;
  inflatedTarget: number;
  currentAllocation: number;
  priority: "critical" | "important" | "aspirational";
  recommendedSIP: number;
  recommendedAllocation: string;
}

// ===== Tax Details =====
export interface TaxDetails {
  regime: "old" | "new";
  grossIncome: number;
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  hra: number;
  section80TTA: number;
  homeLoanInterest: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  taxPayable: number;
  effectiveRate: number;
  potentialSavings: number;
}

// ===== Risk Profile =====
export type RiskProfileType =
  | "conservative"
  | "moderate"
  | "moderately_aggressive"
  | "aggressive";

export interface RiskProfile {
  type: RiskProfileType;
  score: number;
  equityAllocation: number;
  debtAllocation: number;
  goldAllocation: number;
}

// ===== Analysis & Recommendations =====
export interface GoalFeasibility {
  goalId: string;
  goalName: string;
  goalType: GoalType;
  isOnTrack: boolean;
  targetAmount: number;
  inflatedTarget: number;
  currentProjection: number;
  gap: number;
  requiredMonthlySIP: number;
  suggestedFundCategory: string;
  yearsRemaining: number;
}

export interface TaxOpportunity {
  section: string;
  description: string;
  maxLimit: number;
  currentUsage: number;
  unusedLimit: number;
  potentialSaving: number;
  suggestedProduct: string;
  productLink: string;
}

export interface ActionItem {
  id: string;
  priority: "urgent" | "high" | "medium" | "low";
  category:
    | "emergency-fund"
    | "insurance"
    | "investment"
    | "debt"
    | "tax"
    | "retirement"
    | "goal";
  title: string;
  description: string;
  impact: string;
  cta: { label: string; href: string };
}

export interface FinancialAnalysis {
  // Scores (0-100)
  overallScore: number;
  emergencyFundScore: number;
  insuranceScore: number;
  investmentScore: number;
  debtScore: number;
  retirementScore: number;
  taxEfficiencyScore: number;

  // Key Metrics
  emergencyFundMonths: number;
  emergencyFundAdequacy:
    | "critical"
    | "insufficient"
    | "adequate"
    | "excellent";
  savingsRate: number;
  debtToIncomeRatio: number;

  // Insurance Gap Analysis
  termInsuranceGap: number;
  healthInsuranceGap: number;
  recommendedTermCover: number;
  recommendedHealthCover: number;

  // Goal Analysis
  goalFeasibility: GoalFeasibility[];

  // Asset Allocation
  currentAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
    realEstate: number;
  };
  recommendedAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };

  // Tax Optimization
  taxOpportunities: TaxOpportunity[];
  recommendedRegime: "old" | "new";
  potentialTaxSavings: number;

  // Action Items
  actionItems: ActionItem[];
}

// ===== The Complete Financial Plan =====
export interface FinancialPlan {
  id: string;
  createdAt: string;
  updatedAt: string;

  personal: PersonalProfile;
  income: IncomeDetails;
  expenses: ExpenseDetails;
  netWorth: NetWorthStatement;
  insurance: InsuranceCoverage;
  goals: FinancialGoal[];
  tax: TaxDetails;
  riskProfile: RiskProfile;

  analysis: FinancialAnalysis;
}

// ===== Calculator-specific Result Types =====
export interface RetirementResult {
  corpusNeeded: number;
  monthlyExpensesAtRetirement: number;
  futureValueOfCurrentSavings: number;
  gap: number;
  requiredMonthlySIP: number;
  yearlyBreakdown: {
    year: number;
    age: number;
    corpus: number;
    phase: "accumulation" | "retirement";
  }[];
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  interestToPaymentRatio: number;
  amortization: {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    outstanding: number;
  }[];
}

export interface TermInsuranceResult {
  hlvMethod: number;
  incomeReplacementMethod: number;
  expenseMethod: number;
  recommendedCover: number;
  existingCover: number;
  gap: number;
}

export interface HealthInsuranceResult {
  recommendedCover: number;
  currentCover: number;
  gap: number;
  factors: {
    label: string;
    multiplier: number;
  }[];
}

export interface EducationPlanResult {
  currentCost: number;
  futureCost: number;
  yearsToGoal: number;
  requiredMonthlySIP: number;
  futureValueOfSavings: number;
  gap: number;
}
