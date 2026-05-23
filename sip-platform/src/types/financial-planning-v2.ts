import type { FinancialPlanningData, FinancialHealthReport, GoalGapResult, AssetAllocation } from './financial-planning';

export type PlanTier = 'basic' | 'standard' | 'comprehensive';

export interface PlanMetadata {
  tier: PlanTier;
  version: number;
  createdAt: string;
  upgradedFrom?: PlanTier;
  upgradedAt?: string;
}

export interface ComprehensiveProfile {
  spouseName: string;
  childrenDetails: { name: string; dob: string }[];
  fatherName: string;
  fatherAge: number;
  fatherHealthNotes: string;
  motherName: string;
  motherAge: number;
  motherHealthNotes: string;
  familyHealthHistory: string[]; // diabetes, heart disease, cancer, etc.
  monthlyExpenseBreakdown: {
    housing: number;
    groceries: number;
    utilities: number;
    transport: number;
    education: number;
    medical: number;
    entertainment: number;
    clothing: number;
    other: number;
  };
  existingInvestmentDetails: {
    type: string;
    name: string;
    currentValue: number;
    monthlyContribution: number;
    startYear: number;
  }[];
  incomeGrowthScenario: 'conservative' | 'moderate' | 'optimistic';
}

export interface FinancialPlanningDataV2 extends FinancialPlanningData {
  planMetadata: PlanMetadata;
  comprehensiveProfile?: ComprehensiveProfile;
}

// 5-Year Cashflow Projection
export interface CashflowProjectionYear {
  year: number;
  age: number;
  grossIncome: number;
  incomeGrowthRate: number;
  totalExpenses: number;
  expenseInflationRate: number;
  totalEMIs: number;
  insurancePremiums: number;
  sipCommitments: number;
  surplus: number;
  cumulativeSavings: number;
}

export interface CashflowProjectionWarning {
  year: number;
  type: 'negative-surplus' | 'no-income' | 'high-emi-ratio';
  message: string;
}

export interface CashflowProjection {
  years: CashflowProjectionYear[];
  assumptions: {
    incomeGrowthRate: number;
    expenseInflationRate: number;
    educationInflationRate: number;
    medicalInflationRate: number;
    sipStepUpRate: number;
    premiumInflationRate: number;
  };
  warnings: CashflowProjectionWarning[];
}

// Asset Allocation Matrix
export interface GoalAllocationEntry {
  goalName: string;
  goalType: string;
  timeHorizon: number;
  equity: number;
  debt: number;
  gold: number;
  liquid: number;
  expectedReturn: number;
  monthlySIP: number;
  recommendedVehicles: string[];
}

export interface AssetAllocationMatrix {
  entries: GoalAllocationEntry[];
  overallRecommended: AssetAllocation;
  rebalancingFrequency: 'quarterly' | 'semi-annually' | 'annually';
  disclaimer: string;
}

// Executive Summary (Comprehensive only)
export interface ExecutiveSummaryItem {
  area: string;
  clientGoal: string;
  recommendation: string;
  priority: 'critical' | 'important' | 'nice-to-have';
}

export interface ExecutiveSummary {
  items: ExecutiveSummaryItem[];
  overallMessage: string;
}

// Extended Report
export interface FinancialHealthReportV2 extends FinancialHealthReport {
  tier: PlanTier;
  cashflowProjection?: CashflowProjection;
  allocationMatrix?: AssetAllocationMatrix;
  executiveSummary?: ExecutiveSummary;
  taxOptimization?: {
    currentRegime: 'old' | 'new';
    recommendedRegime: 'old' | 'new';
    currentTax: number;
    optimizedTax: number;
    savings: number;
    recommendations: string[];
  };
  debtStrategy?: {
    totalDebt: number;
    monthlyEMIs: number;
    debtFreeDate: string;
    prepaymentRecommendations: string[];
    interestSavings: number;
  };
}

// Default ComprehensiveProfile
export const DEFAULT_COMPREHENSIVE_PROFILE: ComprehensiveProfile = {
  spouseName: '',
  childrenDetails: [],
  fatherName: '',
  fatherAge: 0,
  fatherHealthNotes: '',
  motherName: '',
  motherAge: 0,
  motherHealthNotes: '',
  familyHealthHistory: [],
  monthlyExpenseBreakdown: {
    housing: 0, groceries: 0, utilities: 0, transport: 0,
    education: 0, medical: 0, entertainment: 0, clothing: 0, other: 0,
  },
  existingInvestmentDetails: [],
  incomeGrowthScenario: 'moderate',
};

export const DEFAULT_PLAN_METADATA: PlanMetadata = {
  tier: 'basic',
  version: 2,
  createdAt: new Date().toISOString(),
};
