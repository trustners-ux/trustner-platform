// Types for Trustner Financial Planning Engine

export interface LoanDetail {
  outstanding: number;
  emi: number;
  remainingYears: number;
}

export interface PersonalProfile {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;
  spouseAge: number | null;
  childrenAges: number[];
  state: string;
  city: string;
  cityTier: 'metro' | 'tier1' | 'tier2' | 'tier3';
  otherCity: string;
  pincode: string;
  residentialStatus: 'own' | 'rent' | 'family';
}

export interface CareerProfile {
  employmentType: 'salaried' | 'self-employed' | 'business' | 'retired' | 'homemaker';
  industry: string;
  yearsInCurrentJob: number;
  incomeStability: 'very-stable' | 'stable' | 'variable' | 'highly-variable';
  expectedRetirementAge: number;
  spouseWorks: boolean;
  expectedAnnualGrowth: number;
}

export interface IncomeProfile {
  monthlyInHandSalary: number;
  annualBonus: number;
  rentalIncome: number;
  businessIncome: number;
  otherIncome: number;
  monthlyHouseholdExpenses: number;
  monthlyEMIs: number;
  monthlyRent: number;
  monthlySIPsRunning: number;
  monthlyInsurancePremiums: number;
  annualDiscretionary: number;
}

export interface AssetProfile {
  bankSavings: number;
  fixedDeposits: number;
  mutualFunds: number;
  stocks: number;
  ppfEpf: number;
  nps: number;
  gold: number;
  realEstateInvestment: number;
  primaryResidenceValue: number;
  otherAssets: number;
}

export interface LiabilityProfile {
  homeLoan: LoanDetail;
  carLoan: LoanDetail;
  personalLoan: LoanDetail;
  educationLoan: LoanDetail;
  creditCardDebt: number;
  otherLoans: number;
}

export interface InsuranceProfile {
  termInsuranceCover: number;
  lifeInsuranceCover: number;
  healthInsuranceCover: number;
  hasCriticalIllnessCover: boolean;
  hasAccidentalCover: boolean;
  annualLifePremium: number;
  annualHealthPremium: number;
}

export type GoalType = 'retirement' | 'child-education' | 'child-marriage' | 'house-purchase' | 'car-purchase' | 'vacation' | 'emergency-fund' | 'wealth-creation' | 'early-retirement' | 'custom';

export interface FinancialGoal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetYear: number;
  priority: 'critical' | 'important' | 'nice-to-have';
  currentSavingsForGoal: number;
}

export interface RiskProfile {
  marketDropReaction: 'sell-immediately' | 'wait-patiently' | 'invest-more';
  investmentHorizon: 'less-than-3' | '3-to-5' | '5-to-10' | '10-plus';
  primaryObjective: 'capital-protection' | 'balanced-growth' | 'aggressive-growth';
  pastExperience: 'none' | 'limited' | 'moderate' | 'extensive';
  riskScore: number;
  riskCategory: 'conservative' | 'moderate' | 'aggressive';
}

export interface BehavioralProfile {
  tracksExpensesMonthly: boolean;
  marketNewsInfluence: 'heavily' | 'somewhat' | 'rarely' | 'never';
  investmentDiscipline: 'very-disciplined' | 'mostly-disciplined' | 'sometimes' | 'rarely';
  behavioralScore: number;
}

export interface EmergencyProfile {
  hasEmergencyFund: boolean;
  emergencyFundAmount: number;
  monthsOfExpensesCovered: number;
}

export interface TaxProfile {
  taxRegime: 'old' | 'new';
  annualTaxableIncome: number;
  section80CUsed: number;
  section80DUsed: number;
  hasHRA: boolean;
  npsContribution: number;
}

/** Master data structure containing all questionnaire responses */
export interface FinancialPlanningData {
  personalProfile: PersonalProfile;
  careerProfile: CareerProfile;
  incomeProfile: IncomeProfile;
  assetProfile: AssetProfile;
  liabilityProfile: LiabilityProfile;
  insuranceProfile: InsuranceProfile;
  goals: FinancialGoal[];
  riskProfile: RiskProfile;
  behavioralProfile: BehavioralProfile;
  emergencyProfile: EmergencyProfile;
  taxProfile: TaxProfile;
}

export type PillarGrade = 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Critical';

export interface PillarScore {
  name: string;
  score: number;
  maxScore: 180;
  grade: PillarGrade;
  keyInsight: string;
}

export interface FinancialHealthScore {
  totalScore: number;
  grade: string;
  pillars: {
    cashflow: PillarScore;
    protection: PillarScore;
    investments: PillarScore;
    debt: PillarScore;
    retirementReadiness: PillarScore;
  };
}

export interface GoalGapResult {
  goalName: string;
  goalType: GoalType;
  futureCost: number;
  currentProgress: number;
  monthlyRequired: number;
  gap: number;
  feasibility: 'on-track' | 'possible' | 'stretch' | 'unrealistic';
}

export interface InsuranceGapResult {
  lifeInsuranceNeed: number;
  currentLifeCover: number;
  lifeInsuranceGap: number;
  healthInsuranceNeed: number;
  currentHealthCover: number;
  healthInsuranceGap: number;
  healthAdequacy: 'adequate' | 'low' | 'critical';
}

export interface AssetAllocation {
  equity: number;
  debt: number;
  gold: number;
  realEstate: number;
  cash: number;
}

export interface ActionItem {
  priority: number;
  action: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

/** Complete financial health report output */
export interface FinancialHealthReport {
  score: FinancialHealthScore;
  netWorth: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  retirementGap: {
    requiredCorpus: number;
    currentProgress: number;
    gap: number;
    monthlyToClose: number;
    yearsToRetirement: number;
  };
  goalGaps: GoalGapResult[];
  insuranceGap: InsuranceGapResult;
  assetAllocation: {
    current: AssetAllocation;
    recommended: AssetAllocation;
  };
  debtManagement: {
    debtToIncomeRatio: number;
    totalEMIs: number;
    monthlyIncome: number;
  };
  actionPlan: ActionItem[];
  claudeNarrative: string;
}

export interface WizardStepConfig {
  id: number;
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

export interface OTPSession {
  phone: string;
  email: string;
  verified: boolean;
  token: string;
  expiresAt: number;
}

/** Data returned to client after submission for the teaser page */
export interface TeaserData {
  score: FinancialHealthScore;
  topStrengths: string[];
  topWeaknesses: string[];
  quickInsights: string[];
  netWorth: number;
  retirementGapPercent: number;
}
