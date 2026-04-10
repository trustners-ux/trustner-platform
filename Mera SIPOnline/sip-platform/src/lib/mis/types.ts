// ─── Trustner MIS Type Definitions ───
// Based on CLAUDE_CODE_MIS_DEPLOYMENT_PROMPT.md specification

// ─── Partner Types ───
export type PartnerType = 'POSP' | 'BQP' | 'Franchise' | 'Referral';
export type FranchiseSubType = 'Basic' | 'BQP_Certified';
export type PartnerManagedByType = 'DST' | 'CDM' | 'BQP' | 'Franchise';

export interface PartnerRecord {
  id: number;
  code: string;                    // TIB/POSP/001/2526 or TIB/REF/001/2526 etc.
  type: PartnerType;
  name: string;
  email?: string;
  phone?: string;
  franchiseSubType?: FranchiseSubType;  // for Franchise only
  managedByType: PartnerManagedByType;
  managedById: number;             // employee or partner ID
  parentFranchiseId?: number;      // if POSP is under a Franchise
  agreementPct: number;            // overall agreement % (for Franchise/Referral)
  categoryPerLOB?: {               // for POSP — per LOB category
    life: POSPCategory;
    health: POSPCategory;
    giNonMotor: POSPCategory;
    giMotor: POSPCategory;
  };
  isActive: boolean;
  onboardingDate: string;          // ISO date
  bqpCertDate?: string;            // when BQP was obtained
  upgradedFrom?: PartnerType;      // if upgraded from Referral→POSP etc.
  upgradeDate?: string;
  location?: string;
  city?: string;
  notes?: string;
}

export type LevelCode = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
export type Entity = 'TIB' | 'TAS' | 'Vendor';
export type Segment = 'Direct Sales' | 'FP Team' | 'CDM/POSP RM' | 'Area Manager' | 'Support';
export type SlabTable = 'DST' | 'POSP_RM';
export type PerformanceStatus = 'Champion' | 'Star' | 'Achiever' | 'Below Target' | 'No Incentive';
export type ChannelType = 'Direct' | 'POSP Normal' | 'POSP Higher Pay' | 'Sub-broker' | 'Franchise' | 'Digital Platform';
export type ProductCategory = 'Life' | 'Health' | 'GI Motor' | 'GI Non-Motor' | 'MF';
export type ProductTier = 1 | 2 | 3 | 4;
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
  slabLabel: string;
}

export interface MonthlyBusinessEntry {
  id: number;
  employeeId: number;
  month: string; // YYYY-MM
  productId: number;
  channelId?: number;
  partnerId?: number;              // POSP/BQP/Franchise/Referral partner ID
  partnerType?: PartnerType;       // type of partner for this entry
  parentFranchiseId?: number;      // if partner is POSP under a franchise
  franchiseDifferentialPct?: number; // calculated franchise differential
  franchisePayout?: number;        // calculated franchise payout amount
  rawAmount: number;
  productCreditPct: number;   // product weightage %
  channelPayoutPct: number;
  companyMarginPct: number;
  tierMultiplier: number;
  weightedAmount: number;
  policyNumber?: string;
  clientName?: string;
  insurer?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'error';
  rejectionReason?: string;
  isCrossSale?: boolean;       // True if product sold is from a different category than RM's primary
  isBusinessLoss?: boolean;    // True if entry is a cancellation/lapse/surrender
  lossReason?: string;         // Cancellation reason
  transactionDate?: string;    // Actual policy/transaction date (YYYY-MM-DD)
  errorMessage?: string;       // For entries flagged with data issues
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

// ─── Product Weightage Rules (Section 1.4) ───
export const PRODUCT_WEIGHTAGE_RULES: Record<string, number> = {
  'MF SIP (Monthly)': 100,
  'MF Lumpsum - Equity': 10,
  'MF Lumpsum - LT Debt': 7.5,
  'MF Lumpsum - ST Debt': 5,
  'MF Debt→Equity via STP': 10,
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
  { slabTableName: 'DST', achievementMin: 0, achievementMax: 80, incentiveRate: 0, slabLabel: 'No Incentive' },
  { slabTableName: 'DST', achievementMin: 80.01, achievementMax: 100, incentiveRate: 4, slabLabel: 'Base' },
  { slabTableName: 'DST', achievementMin: 100.01, achievementMax: 125, incentiveRate: 5, slabLabel: 'Enhanced' },
  { slabTableName: 'DST', achievementMin: 125.01, achievementMax: 150, incentiveRate: 6, slabLabel: 'Super' },
  { slabTableName: 'DST', achievementMin: 150.01, achievementMax: null, incentiveRate: 8, slabLabel: 'Champion' },
];

export const POSP_RM_SLABS: IncentiveSlab[] = [
  { slabTableName: 'POSP_RM', achievementMin: 0, achievementMax: 80, incentiveRate: 0, slabLabel: 'No Incentive' },
  { slabTableName: 'POSP_RM', achievementMin: 80.01, achievementMax: 100, incentiveRate: 1.2, slabLabel: 'Base' },
  { slabTableName: 'POSP_RM', achievementMin: 100.01, achievementMax: 125, incentiveRate: 1.5, slabLabel: 'Enhanced' },
  { slabTableName: 'POSP_RM', achievementMin: 125.01, achievementMax: 150, incentiveRate: 1.8, slabLabel: 'Super' },
  { slabTableName: 'POSP_RM', achievementMin: 150.01, achievementMax: null, incentiveRate: 2.4, slabLabel: 'Champion' },
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
  selfSourcedNewPan: { rm: 25, company: 75 },
  selfSourcedExisting: { rm: 15, company: 85 },
  assignedNewBusiness: { rm: 15, company: 85 },
  assignedNoNewBusiness: { rm: 0, company: 100 },
  officeWalkIn: { rm: 10, company: 90 },
};

// ─── POSP Payout Category System (A through F2) ───

export type POSPCategory = 'A' | 'B' | 'C' | 'D' | 'D+' | 'E' | 'E+' | 'F1' | 'F2';

export interface POSPPayoutGrid {
  id: number;
  category: POSPCategory;
  productLine: string;         // e.g., "TW Comprehensive Metro", "TW SATP", "PC OD Private"
  vehicleType: string;         // "Two Wheeler" | "Private Car" | "Commercial Vehicle"
  region: string;              // "Metro" | "Non-Metro" | "All India"
  insurer: string;             // "ICICI Lombard" | "Bajaj Allianz" | "HDFC ERGO" | etc.
  commissionPct: number;       // The payout % for this category
  effectiveFrom: string;       // FY start date
  effectiveTo?: string;        // FY end date
  isActive: boolean;
  notes?: string;
}

export interface POSPCategoryConfig {
  category: POSPCategory;
  label: string;               // "Category A" etc.
  description: string;         // "Entry level POSP"
  minMonthlyBusiness: number;  // Minimum monthly business threshold
  maxMonthlyBusiness?: number;
  qualificationCriteria: string;
  color: string;               // For badge display
}

// Channel types for the payout system
export type POSPChannelType = 'POSP' | 'BQP' | 'Referral' | 'Employee' | 'Sub-Broker' | 'Franchise';

export interface ChannelPayoutRule {
  id: number;
  channelType: POSPChannelType;
  payoutPct: number;           // What we pay the channel
  companyMarginPct: number;    // What company retains (100 - payoutPct)
  rmCreditPct: number;         // What RM gets credit for
  isActive: boolean;
  effectiveFrom: string;
  notes?: string;
}

// ─── POSP Category Configs (A through F2) ───
export const POSP_CATEGORIES: POSPCategoryConfig[] = [
  { category: 'A', label: 'Category A', description: 'Entry Level POSP', minMonthlyBusiness: 0, maxMonthlyBusiness: 20000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'slate' },
  { category: 'B', label: 'Category B', description: 'Active POSP', minMonthlyBusiness: 20001, maxMonthlyBusiness: 50000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'blue' },
  { category: 'C', label: 'Category C', description: 'Growing POSP', minMonthlyBusiness: 50001, maxMonthlyBusiness: 100000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'teal' },
  { category: 'D', label: 'Category D', description: 'Established POSP', minMonthlyBusiness: 100001, maxMonthlyBusiness: 200000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'emerald' },
  { category: 'D+', label: 'Category D+', description: 'High Performer POSP', minMonthlyBusiness: 200001, maxMonthlyBusiness: 300000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'green' },
  { category: 'E', label: 'Category E', description: 'Premium POSP', minMonthlyBusiness: 300001, maxMonthlyBusiness: 500000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'amber' },
  { category: 'E+', label: 'Category E+', description: 'Elite POSP', minMonthlyBusiness: 500001, maxMonthlyBusiness: 750000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'orange' },
  { category: 'F1', label: 'Category F1', description: 'Star POSP', minMonthlyBusiness: 750001, maxMonthlyBusiness: 1000000, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'rose' },
  { category: 'F2', label: 'Category F2', description: 'Platinum POSP \u2014 Maximum Payout', minMonthlyBusiness: 1000001, qualificationCriteria: 'Assigned by Admin/Super Admin \u2014 quarterly review', color: 'purple' },
];

export const DEFAULT_CHANNEL_RULES: ChannelPayoutRule[] = [
  { id: 1, channelType: 'POSP', payoutPct: 70, companyMarginPct: 30, rmCreditPct: 30, isActive: true, effectiveFrom: '2025-04-01', notes: 'Standard POSP payout' },
  { id: 2, channelType: 'BQP', payoutPct: 85, companyMarginPct: 15, rmCreditPct: 15, isActive: true, effectiveFrom: '2025-04-01', notes: 'BQP — high payout, low company margin' },
  { id: 3, channelType: 'Referral', payoutPct: 50, companyMarginPct: 50, rmCreditPct: 50, isActive: true, effectiveFrom: '2025-04-01', notes: 'Referral partner payout' },
  { id: 4, channelType: 'Employee', payoutPct: 0, companyMarginPct: 100, rmCreditPct: 100, isActive: true, effectiveFrom: '2025-04-01', notes: 'Direct employee \u2014 full credit' },
  { id: 5, channelType: 'Sub-Broker', payoutPct: 60, companyMarginPct: 40, rmCreditPct: 40, isActive: true, effectiveFrom: '2025-04-01', notes: 'Sub-broker standard payout' },
  { id: 6, channelType: 'Franchise', payoutPct: 85, companyMarginPct: 15, rmCreditPct: 15, isActive: true, effectiveFrom: '2025-04-01', notes: 'Franchise \u2014 range 80-90%, default 85%' },
];

// ─── POSP Category Approval Hierarchy ───
// CDM can approve up to D, Regional Manager up to E, CDO up to F1, F2 = Admin/Super Admin only
export const POSP_CATEGORY_ORDER: POSPCategory[] = ['A', 'B', 'C', 'D', 'D+', 'E', 'E+', 'F1', 'F2'];

export interface CategoryApprovalLimit {
  designation: string;
  maxCategory: POSPCategory;
  label: string;
}

export const CATEGORY_APPROVAL_LIMITS: CategoryApprovalLimit[] = [
  { designation: 'CDM', maxCategory: 'C', label: 'CDM (up to Category C — 60%)' },
  { designation: 'RM CDM', maxCategory: 'C', label: 'RM CDM (up to Category C — 60%)' },
  { designation: 'Regional Head', maxCategory: 'D+', label: 'Regional Head (up to Category D+ — 70%)' },
  { designation: 'Regional Manager', maxCategory: 'D+', label: 'Regional Manager (up to Category D+ — 70%)' },
  { designation: 'CDO', maxCategory: 'E+', label: 'CDO (up to Category E+ — 80%)' },
  { designation: 'Admin', maxCategory: 'F2', label: 'Admin (up to Category F2 — 90%)' },
  { designation: 'Super Admin', maxCategory: 'F2', label: 'Super Admin (up to Category F2 — 90%)' },
];

// ─── Default POSP Payout Grid Seed Data ───
export const DEFAULT_POSP_GRID: POSPPayoutGrid[] = [
  // TW Comprehensive Metro - ICICI Lombard
  { id: 1, category: 'A', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 13.75, effectiveFrom: '2025-04-01', isActive: true },
  { id: 2, category: 'B', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 15, effectiveFrom: '2025-04-01', isActive: true },
  { id: 3, category: 'C', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 16.25, effectiveFrom: '2025-04-01', isActive: true },
  { id: 4, category: 'D', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 17.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 5, category: 'D+', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 18, effectiveFrom: '2025-04-01', isActive: true },
  { id: 6, category: 'E', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 18, effectiveFrom: '2025-04-01', isActive: true },
  { id: 7, category: 'E+', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 18.75, effectiveFrom: '2025-04-01', isActive: true },
  { id: 8, category: 'F1', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 18.75, effectiveFrom: '2025-04-01', isActive: true },
  { id: 9, category: 'F2', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'ICICI Lombard', commissionPct: 20, effectiveFrom: '2025-04-01', isActive: true },
  // TW Comprehensive Metro - Bajaj Allianz
  { id: 11, category: 'A', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 14, effectiveFrom: '2025-04-01', isActive: true },
  { id: 12, category: 'B', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 15.25, effectiveFrom: '2025-04-01', isActive: true },
  { id: 13, category: 'C', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 16.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 14, category: 'D', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 17.75, effectiveFrom: '2025-04-01', isActive: true },
  { id: 15, category: 'D+', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 18.25, effectiveFrom: '2025-04-01', isActive: true },
  { id: 16, category: 'E', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 18.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 17, category: 'E+', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 19, effectiveFrom: '2025-04-01', isActive: true },
  { id: 18, category: 'F1', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 19, effectiveFrom: '2025-04-01', isActive: true },
  { id: 19, category: 'F2', productLine: 'TW Comp Metro', vehicleType: 'Two Wheeler', region: 'Metro', insurer: 'Bajaj Allianz', commissionPct: 20.25, effectiveFrom: '2025-04-01', isActive: true },
  // TW SATP - ICICI Lombard
  { id: 21, category: 'A', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 8, effectiveFrom: '2025-04-01', isActive: true },
  { id: 22, category: 'B', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 9, effectiveFrom: '2025-04-01', isActive: true },
  { id: 23, category: 'C', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 10, effectiveFrom: '2025-04-01', isActive: true },
  { id: 24, category: 'D', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 11, effectiveFrom: '2025-04-01', isActive: true },
  { id: 25, category: 'D+', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 11.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 26, category: 'E', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 12, effectiveFrom: '2025-04-01', isActive: true },
  { id: 27, category: 'E+', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 12.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 28, category: 'F1', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 12.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 29, category: 'F2', productLine: 'TW SATP', vehicleType: 'Two Wheeler', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 13.5, effectiveFrom: '2025-04-01', isActive: true },
  // PC OD Private - ICICI Lombard
  { id: 31, category: 'A', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 15, effectiveFrom: '2025-04-01', isActive: true },
  { id: 32, category: 'B', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 16.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 33, category: 'C', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 18, effectiveFrom: '2025-04-01', isActive: true },
  { id: 34, category: 'D', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 19.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 35, category: 'D+', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 20, effectiveFrom: '2025-04-01', isActive: true },
  { id: 36, category: 'E', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 20.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 37, category: 'E+', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 21, effectiveFrom: '2025-04-01', isActive: true },
  { id: 38, category: 'F1', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 21.5, effectiveFrom: '2025-04-01', isActive: true },
  { id: 39, category: 'F2', productLine: 'PC OD Private', vehicleType: 'Private Car', region: 'All India', insurer: 'ICICI Lombard', commissionPct: 22.5, effectiveFrom: '2025-04-01', isActive: true },
];

// All POSP categories list for iteration
export const ALL_POSP_CATEGORIES: POSPCategory[] = ['A', 'B', 'C', 'D', 'D+', 'E', 'E+', 'F1', 'F2'];

// ─── Franchise Agreement Defaults ───
export const FRANCHISE_DEFAULTS = {
  defaultAgreementPct: 80,    // Default franchise payout %
  minAgreementPct: 80,        // Minimum franchise agreement
  maxAgreementPct: 90,        // Maximum normal range
  exceptionalMaxPct: 95,      // Admin-only exceptional cases
};

// ─── Referral Defaults ───
export const REFERRAL_DEFAULTS = {
  defaultPayoutPct: 60,       // Category C equivalent
  minPayoutPct: 50,           // Category A equivalent
  maxPayoutPct: 90,           // Admin approval for any change from 60%
};

// ─── Partner Code Format: TIB/{TYPE}/{SERIAL}/{FY} ───
export const PARTNER_CODE_PREFIX: Record<PartnerType, string> = {
  POSP: 'TIB/POSP',
  BQP: 'TIB/BQP',
  Franchise: 'TIB/FRAN',
  Referral: 'TIB/REF',
};
