// ─── Trustner MIS Type Definitions ───
// Based on CLAUDE_CODE_MIS_DEPLOYMENT_PROMPT.md specification

export type LevelCode = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
export type Entity = 'TIB' | 'TAS' | 'Vendor';
export type Segment = 'Direct Sales' | 'FP Team' | 'CDM/POSP RM' | 'Area Manager' | 'Support';
export type SlabTable = 'DST' | 'POSP_RM';
export type PerformanceStatus = 'Champion' | 'Star' | 'Achiever' | 'Below Target' | 'No Incentive';
export type ChannelType = 'Direct' | 'POSP Normal' | 'POSP Higher Pay' | 'Sub-broker' | 'Franchise' | 'Digital Platform';
export type ProductCategory = 'Life' | 'Health' | 'GI Motor' | 'GI Non-Motor' | 'MF';
export type ProductTier = 1 | 2 | 3;
export type CLVTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email?: string;
  phone?: string;
  doj: string; // ISO date
  designation: string;
  department: string;
  jobResponsibility?: string;
  grossSalary: number; // Monthly
  entity: Entity;
  annualCTC: number;
  tenureYears: number;
  levelCode: LevelCode;
  segment: Segment;
  reportingManagerId?: number;
  location?: string;
  targetMultiplier: number; // 6, 20, 23, 0
  monthlyTarget: number;
  annualTarget: number;
  costRecoveryMin: number; // salary × 1.6
  isActive: boolean;
}

export interface Product {
  id: number;
  productName: string;
  productCategory: ProductCategory;
  tier: ProductTier;
  commissionRange: string;
  creditPct: number;
  referralCreditPct: number;
  isMotor: boolean;
  notes?: string;
}

export interface Channel {
  id: number;
  channelName: string;
  channelType: ChannelType;
  payoutPct: number;
  companyMarginPct: number;
  pospCode?: string;
  managedByRmId?: number;
  grade?: string;
  isActive: boolean;
  monthlyMinBusiness: number;
}

export interface IncentiveSlab {
  slabTableName: SlabTable;
  achievementMin: number;
  achievementMax: number | null;
  incentiveRate: number;
  multiplier: number;
  slabLabel: string;
}

export interface MonthlyBusinessEntry {
  id: number;
  employeeId: number;
  month: string; // YYYY-MM
  productId: number;
  channelId?: number;
  rawAmount: number;
  productCreditPct: number;
  channelPayoutPct: number;
  companyMarginPct: number;
  marginCreditFactor: number;
  tierMultiplier: number;
  weightedAmount: number;
  isFpRoute: boolean;
  policyNumber?: string;
  clientName?: string;
  insurer?: string;
}

export interface MonthlyIncentiveCalc {
  employeeId: number;
  employeeName: string;
  month: string;
  monthlyTarget: number;
  totalRawBusiness: number;
  totalWeightedBusiness: number;
  sipClawbackDebit: number;
  netWeightedBusiness: number;
  achievementPct: number;
  applicableSlab: SlabTable;
  slabLabel: string;
  incentiveRate: number;
  slabMultiplier: number;
  grossIncentive: number;
  complianceFactor: number;
  netIncentive: number;
  trailIncome: number;
  recruitmentBonus: number;
  activationBonus: number;
  motorIncentive: number;
  referralCreditAmount: number;
  totalPayout: number;
  performanceStatus: PerformanceStatus;
}

export interface TrailIncome {
  employeeId: number;
  clientPan: string;
  clientName: string;
  clientType: 'New PAN' | 'Existing Client';
  channelType: ChannelType;
  startingAum: number;
  currentAum: number;
  incrementalAum: number;
  eligibleTrailRate: number;
  actualRmTrailPct: number;
  annualTrailIncome: number;
  monthlyTrailIncome: number;
  isFrozen: boolean;
}

export interface DashboardData {
  employee: Employee;
  currentMonth: MonthlyIncentiveCalc;
  businessEntries: MonthlyBusinessEntry[];
  trailPortfolio: TrailIncome[];
  nextSlabInfo: {
    nextSlabLabel: string;
    amountNeeded: number;
    achievementNeeded: number;
  } | null;
  performanceHistory: {
    month: string;
    achievementPct: number;
    totalPayout: number;
    status: PerformanceStatus;
  }[];
}

// ─── Product Credit Rules (Section 1.4) ───
export const PRODUCT_CREDIT_RULES: Record<string, number> = {
  'MF SIP (Monthly)': 100,
  'MF Lumpsum - Equity': 10,
  'MF Lumpsum - LT Debt': 7.5,
  'MF Lumpsum - ST Debt': 5,
  'MF Debt→Equity via STP': 10,
  'FP Route (any product)': 125,
  'Health - Annual': 100,
  'Health - 2yr Pay': 62.5, // Prem/2 × 125%
  'Health - 3yr Pay': 50,   // Prem/3 × 150%
  'Health - Quarterly/HY': 50,
  'GI Non-Motor': 100,
  'GI GMC/GPA': 20,
  'GI Renewal': 33,
  'Motor': 0, // Grid-based
  'Life 10yr+ Regular': 125,
  'Life <10yr Regular': 100,
  'Life ULIP': 25,
  'Life Single Premium': 10,
  "Directors' Business": 30,
};

// ─── Incentive Slab Tables (Section 1.7) ───
export const DST_SLABS: IncentiveSlab[] = [
  { slabTableName: 'DST', achievementMin: 0, achievementMax: 80, incentiveRate: 0, multiplier: 0, slabLabel: 'No Incentive' },
  { slabTableName: 'DST', achievementMin: 80, achievementMax: 100, incentiveRate: 4, multiplier: 1.0, slabLabel: 'Base 4%' },
  { slabTableName: 'DST', achievementMin: 101, achievementMax: 110, incentiveRate: 5, multiplier: 1.25, slabLabel: 'Enhanced 5%' },
  { slabTableName: 'DST', achievementMin: 111, achievementMax: 130, incentiveRate: 6, multiplier: 1.5, slabLabel: 'Super 6%' },
  { slabTableName: 'DST', achievementMin: 131, achievementMax: 150, incentiveRate: 7, multiplier: 1.75, slabLabel: 'Star 7%' },
  { slabTableName: 'DST', achievementMin: 151, achievementMax: null, incentiveRate: 8, multiplier: 2.0, slabLabel: 'Champion 8%' },
];

export const POSP_RM_SLABS: IncentiveSlab[] = [
  { slabTableName: 'POSP_RM', achievementMin: 0, achievementMax: 80, incentiveRate: 0, multiplier: 0, slabLabel: 'No Incentive' },
  { slabTableName: 'POSP_RM', achievementMin: 80, achievementMax: 100, incentiveRate: 1.2, multiplier: 1.0, slabLabel: 'Base 1.2%' },
  { slabTableName: 'POSP_RM', achievementMin: 101, achievementMax: 110, incentiveRate: 1.5, multiplier: 1.25, slabLabel: 'Enhanced 1.5%' },
  { slabTableName: 'POSP_RM', achievementMin: 111, achievementMax: 130, incentiveRate: 1.8, multiplier: 1.5, slabLabel: 'Super 1.8%' },
  { slabTableName: 'POSP_RM', achievementMin: 131, achievementMax: 150, incentiveRate: 2.1, multiplier: 1.75, slabLabel: 'Star 2.1%' },
  { slabTableName: 'POSP_RM', achievementMin: 151, achievementMax: null, incentiveRate: 2.4, multiplier: 2.0, slabLabel: 'Champion 2.4%' },
];

// ─── Target Multipliers (Section 1.2) ───
export const TARGET_MULTIPLIERS: Record<Segment, number> = {
  'Direct Sales': 6,
  'FP Team': 6,
  'CDM/POSP RM': 20,
  'Area Manager': 23,
  'Support': 0,
};

// ─── Trail Rates (Section 1.9) ───
export const TRAIL_RATES = {
  selfSourcedNewPan: { rm: 25, mgmt: 10, company: 65 },
  selfSourcedExisting: { rm: 15, mgmt: 10, company: 75 },
  assignedNewBusiness: { rm: 15, mgmt: 7.5, company: 77.5 },
  assignedNoNewBusiness: { rm: 0, mgmt: 5, company: 95 },
  officeWalkIn: { rm: 10, mgmt: 10, company: 80 },
};

// ─── CLV Tiers (Section 1.15) ───
export const CLV_TIERS: { tier: CLVTier; min: number; max: number; bonus: number }[] = [
  { tier: 'Bronze', min: 100000, max: 500000, bonus: 5000 },
  { tier: 'Silver', min: 500001, max: 1500000, bonus: 15000 },
  { tier: 'Gold', min: 1500001, max: 3000000, bonus: 35000 },
  { tier: 'Platinum', min: 3000001, max: 5000000, bonus: 60000 },
  { tier: 'Diamond', min: 5000001, max: Infinity, bonus: 100000 },
];
