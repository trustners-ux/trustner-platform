/**
 * Portfolio Diagnostic — Type Definitions
 *
 * Shared TypeScript interfaces for the Trustner Portfolio Diagnostic Workbench.
 * These types flow through every stage: data upload → fund lookup →
 * scoring → review workflow → narrative → PDF generation.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

// ─────────────────────────────────────────────────────────────────
// CORE ENUMS
// ─────────────────────────────────────────────────────────────────

export type Verdict = 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';

export type FundCategory =
  | 'Large Cap'
  | 'Large & Mid Cap'
  | 'Mid Cap'
  | 'Small Cap'
  | 'Flexi Cap'
  | 'Multi Cap'
  | 'Focused'
  | 'Value'
  | 'Contra'
  | 'ELSS'
  | 'Aggressive Hybrid'
  | 'Conservative Hybrid'
  | 'Multi Asset'
  | 'Balanced Advantage'
  | 'Arbitrage'
  | 'Liquid'
  | 'Ultra Short'
  | 'Short Duration'
  | 'Medium Duration'
  | 'Long Duration'
  | 'Corporate Bond'
  | 'Gilt'
  | 'Index'
  | 'Sectoral / Thematic'
  | 'Gold ETF'
  | 'International'
  | 'Other';

export type EntityType =
  | 'Individual'
  | 'HUF'
  | 'Partnership'
  | 'Pvt Ltd'
  | 'LLP'
  | 'Trust'
  | 'Other';

export type ClientSegment = 'Mass' | 'Affluent' | 'HNI' | 'UHNI';

// ─────────────────────────────────────────────────────────────────
// ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────

export type RoleLevel = 1 | 2 | 3 | 4 | 5;

export type RoleName =
  | 'trainee'           // L1 — read-only
  | 'junior_analyst'    // L2 — upload + draft
  | 'mid_reviewer'      // L3 — review + recommend
  | 'senior_reviewer'   // L4 — approve up to ₹5 Cr family AUM
  | 'admin';            // L5 — override; user mgmt; publish anything

export interface Role {
  id: string;
  name: RoleName;
  level: RoleLevel;
  // Permissions
  canUpload: boolean;
  canEditDraft: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canOverrideHierarchy: boolean;
  canManageUsers: boolean;
  // AUM-based ceiling (₹). Reviews above this auto-escalate to higher role.
  approvalAumCeilingInr: number | null; // null = unlimited (L5)
}

export type CertificationName =
  | 'CFP'
  | 'CFA-L1'
  | 'CFA-L2'
  | 'CFA-L3'
  | 'NISM-V-A'
  | 'NISM-VA-Investment-Adviser'
  | 'CA'
  | 'MBA-Finance';

export interface Employee {
  id: string;
  email: string;
  fullName: string;
  mobile?: string;
  role: Role;
  managerId?: string;            // reporting hierarchy
  managerEmail?: string;         // denormalised for convenience
  certifications: CertificationName[];
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // SLA tracking
  avgReviewTurnaroundHours?: number;
  pendingReviewCount?: number;
}

// ─────────────────────────────────────────────────────────────────
// WORKFLOW STATE MACHINE
// ─────────────────────────────────────────────────────────────────

export type WorkflowStatus =
  | 'DRAFT'             // L2 is preparing
  | 'SUBMITTED'         // L2 submitted; awaiting reviewer assignment
  | 'IN_REVIEW'         // L3 actively reviewing
  | 'ESCALATED'         // AUM > L3 ceiling, sent up to L4
  | 'CHANGES_REQUESTED' // reviewer asked for revisions; back to DRAFT
  | 'APPROVED'          // signed off; ready to publish
  | 'PUBLISHED'         // PDFs generated; client communication initiated
  | 'REJECTED'          // hard-no; archived without publishing
  | 'ARCHIVED';         // historical; no further action

export type WorkflowAction =
  | 'CREATE_DRAFT'
  | 'EDIT_DRAFT'
  | 'SUBMIT'
  | 'ASSIGN_REVIEWER'
  | 'START_REVIEW'
  | 'COMMENT'
  | 'REQUEST_CHANGES'
  | 'APPROVE'
  | 'ESCALATE'
  | 'REJECT'
  | 'PUBLISH'
  | 'SHARE_WITH_CLIENT'    // planner selectively shared a subset of deliverables
  | 'ARCHIVE'
  | 'OVERRIDE';

export interface WorkflowEvent {
  id: string;
  diagnosticRunId: string;
  actorId: string;                 // employee who took the action
  actorRole: RoleName;
  action: WorkflowAction;
  fromStatus?: WorkflowStatus;
  toStatus?: WorkflowStatus;
  assigneeId?: string;             // if action = ASSIGN_REVIEWER
  comment?: string;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  diagnosticRunId: string;
  parentCommentId?: string;        // for threaded discussions
  authorId: string;
  authorName: string;
  authorRole: RoleName;
  holdingId?: string;              // if comment targets a specific holding
  sipId?: string;                  // if comment targets a specific SIP
  commentText: string;
  resolvedAt?: string;
  resolvedById?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// CLIENT FAMILY (top-level grouping)
// ─────────────────────────────────────────────────────────────────

export interface ClientFamily {
  id: string;
  familyName: string;               // 'Rohit Jain Family'
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactMobile: string;
  primaryContactPan?: string;
  segment: ClientSegment;
  assignedRmId?: string;           // primary RM
  assignedCfpId?: string;          // assigned CFP for review

  // Denormalised summary (updated on each diagnostic)
  totalAumInr: number;
  numEntities: number;
  numActiveSips: number;
  monthlySipFlowInr: number;       // sum of active monthly SIPs

  createdAt: string;
  lastDiagnosticAt?: string;
}

export interface FamilyEntity {
  id: string;
  familyId: string;
  entityName: string;               // 'ROHIT JAIN' or 'Neelkamal Distributors'
  entityType: EntityType;
  pan?: string;                     // encrypted at rest
  dateOfBirth?: string;
  relationshipToPrimary?:
    | 'Self'
    | 'Spouse'
    | 'Son'
    | 'Daughter'
    | 'Father'
    | 'Mother'
    | 'Brother'
    | 'Sister'
    | 'Grandparent'
    | 'Corporate'
    | 'Other';
  authorizedSignatoryEntityId?: string;  // for corporates: which individual signs
  totalAumInr: number;              // denormalised
}

// ─────────────────────────────────────────────────────────────────
// HOLDING (current position) — distinct from SIP (forward cash flow)
// ─────────────────────────────────────────────────────────────────

export interface RawHolding {
  entityName: string;               // PAN/entity name (resolved to FamilyEntity later)
  entityType?: EntityType;
  fundName: string;                 // raw scheme name
  folioNumber?: string;
  amcName?: string;
  units: number;
  currentNav?: number;
  currentValue: number;             // INR
  investedAmount: number;           // INR (cost basis)
  firstInvestmentDate?: string;     // YYYY-MM-DD
  lastTransactionDate?: string;
}

// ─────────────────────────────────────────────────────────────────
// SIP DETAILS — NEW IN v2.0
// ─────────────────────────────────────────────────────────────────

export type SipStatus = 'Active' | 'Paused' | 'Stopped' | 'Completed';

export type SipFrequency = 'Monthly' | 'Quarterly' | 'Weekly' | 'Daily' | 'One-Time-STP';

export interface RawSip {
  entityName: string;
  fundName: string;
  folioNumber?: string;
  amcName?: string;
  monthlyAmountInr: number;         // normalised to monthly for comparison
  actualAmountInr: number;          // as defined by user (e.g., ₹15K quarterly)
  frequency: SipFrequency;
  sipDayOfMonth?: number;           // 1-28
  startDate: string;                // YYYY-MM-DD
  endDate?: string;                 // null = perpetual
  status: SipStatus;
  // Step-up
  hasStepUp: boolean;
  stepUpPct?: number;               // e.g., 10% annual step-up
  stepUpFrequency?: 'Annual' | 'Half-Yearly';
  // Tracking
  installmentsCompleted?: number;
  totalInstallments?: number;       // null = perpetual
  nextInstallmentDate?: string;
  bankMandateStatus?: 'Active' | 'Inactive' | 'Pending';
}

export interface AnalyzedSip extends RawSip {
  id: string;
  entityId: string;
  amfiCode?: string;
  category: FundCategory;
  ageInMonths: number;              // months since startDate
  // Forecasts
  expectedAnnualInflowInr: number;
  expected5YInflowInr: number;      // assumes step-up applied
  fundVerdict?: Verdict;            // copies from holding's verdict
  recommendedAction?: 'Continue' | 'Pause' | 'Re-direct' | 'Stop';
  recommendedRedirectFund?: string; // if action = Re-direct
}

// ─────────────────────────────────────────────────────────────────
// FUND MASTER (from MFAPI / AMFI / our DB)
// ─────────────────────────────────────────────────────────────────

export interface FundMaster {
  amfiCode: string;
  schemeName: string;
  amcName: string;
  category: FundCategory;
  subCategory?: string;
  currentNav: number;
  aumInrCr: number;
  expenseRatio?: number;
  fundManager?: string;
  managerSinceDate?: string;
  cagr1y: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
  cagr10y: number | null;
  categoryRank3y?: number;
  categoryRank5y?: number;
  categoryTotal?: number;
  lastRefreshedAt: string;
  trustnerPreferred: boolean;
}

export interface CategoryBenchmark {
  category: FundCategory;
  median3y: number;
  median5y: number;
  top10Pct3y: number;
  bottom10Pct3y: number;
  totalFundsInCategory: number;
  asOfDate: string;
}

// ─────────────────────────────────────────────────────────────────
// SCORING (the deterministic engine)
// ─────────────────────────────────────────────────────────────────

export interface ScoringInputs {
  cagr3yDelta: number;
  cagr5yDelta: number;
  managerStability: number;
  quartile: 1 | 2 | 3 | 4;
}

export interface ScoringOutput {
  compositeScore: number;
  verdict: Verdict;
  componentScores: {
    cagr3y: number;
    cagr5y: number;
    manager: number;
    quartile: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// REPLACEMENT RECOMMENDATION (for SWAP verdicts)
// ─────────────────────────────────────────────────────────────────

export interface ReplacementRecommendation {
  primary: FundMaster;
  secondary?: FundMaster;
  rationale: string;
  expectedCagrDelta: number;
}

// ─────────────────────────────────────────────────────────────────
// TAX CALCULATION
// ─────────────────────────────────────────────────────────────────

export interface TaxImpact {
  holdingPeriodMonths: number;
  isLongTerm: boolean;
  realizedGainInr: number;
  taxRate: number;
  applicableExemption: number;
  estimatedTaxInr: number;
  netCashFromRedemption: number;
}

// ─────────────────────────────────────────────────────────────────
// ENRICHED HOLDING (raw + master + score + tax)
// ─────────────────────────────────────────────────────────────────

export interface AnalyzedHolding {
  id: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  fundName: string;
  amfiCode?: string;
  folioNumber?: string;
  category: FundCategory;

  units: number;
  investedInr: number;
  currentValueInr: number;
  unrealisedGainInr: number;
  xirrPct: number | null;
  holdingPeriodMonths: number;
  firstInvestmentDate?: string;

  cagr1y: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
  categoryMedian3y: number | null;
  categoryMedian5y: number | null;
  categoryQuartile: 1 | 2 | 3 | 4 | null;

  compositeScore: number | null;
  verdict: Verdict;
  verdictRationale: string;

  recommendedReplacement?: ReplacementRecommendation;
  taxImpact?: TaxImpact;

  // SIP linkage (if there is an active SIP into this fund)
  linkedSipId?: string;
}

// ─────────────────────────────────────────────────────────────────
// SORT / FILTER OPTIONS (for UI tables)
// ─────────────────────────────────────────────────────────────────

export type HoldingSortField =
  | 'fundName'
  | 'category'
  | 'entityName'
  | 'investedInr'
  | 'currentValueInr'
  | 'unrealisedGainInr'
  | 'xirrPct'
  | 'cagr3y'
  | 'cagr5y'
  | 'categoryQuartile'
  | 'compositeScore'
  | 'verdict'
  | 'holdingPeriodMonths';

export type SipSortField =
  | 'fundName'
  | 'entityName'
  | 'monthlyAmountInr'
  | 'startDate'
  | 'ageInMonths'
  | 'status'
  | 'nextInstallmentDate'
  | 'expected5YInflowInr';

export type SortDirection = 'asc' | 'desc';

export interface SortSpec<TField extends string> {
  field: TField;
  direction: SortDirection;
  // Secondary sort (tie-breaker)
  secondaryField?: TField;
  secondaryDirection?: SortDirection;
}

export interface FilterSpec {
  verdicts?: Verdict[];
  categories?: FundCategory[];
  entityIds?: string[];
  entityTypes?: EntityType[];
  minInvestedInr?: number;
  maxInvestedInr?: number;
  onlyActiveSips?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// DIAGNOSTIC RUN — top-level workflow object
// ─────────────────────────────────────────────────────────────────

export interface DiagnosticRun {
  id: string;
  documentId: string;               // e.g. 'RJF-PDR-2026-05-22'
  createdAt: string;
  methodologyVersion: string;

  // Client
  familyId: string;
  family?: ClientFamily;            // joined when needed

  // Workflow
  status: WorkflowStatus;
  uploadedById: string;             // L2 who created the draft
  uploadedByName: string;
  currentReviewerId?: string;       // current assignee
  currentReviewerName?: string;
  approvedById?: string;            // L4/L5 who approved
  approvedByName?: string;
  approvedAt?: string;
  publishedAt?: string;

  // Family snapshot
  familyName: string;
  numEntities: number;
  numHoldings: number;
  numActiveSips: number;
  numUniqueFunds: number;
  numAmcs: number;
  totalInvestedInr: number;
  currentValueInr: number;
  unrealisedGainInr: number;
  familyXirrPct: number;
  monthlySipFlowInr: number;
  annualSipFlowInr: number;

  // Verdict summary
  verdictCounts: Record<Verdict, number>;
  totalSwapValueInr: number;
  totalLiquidateValueInr: number;
  estimatedTotalTaxInr: number;

  // Data
  holdings: AnalyzedHolding[];
  sips: AnalyzedSip[];

  // Outputs (only populated after PUBLISH)
  diagnosticReportPdfUrl?: string;
  fullReviewPdfUrl?: string;
  actionSheetPdfUrl?: string;
  sipScheduleReportPdfUrl?: string; // NEW in v2.0

  // Delivery
  emailSentAt?: string;
  whatsappSentAt?: string;

  // Audit
  events?: WorkflowEvent[];
  comments?: ReviewComment[];
}

// ─────────────────────────────────────────────────────────────────
// METHODOLOGY CONSTANTS (re-exported for convenience)
// ─────────────────────────────────────────────────────────────────

export interface ScoringWeights {
  readonly cagr3y_vs_category_median: number;
  readonly cagr5y_vs_category_median: number;
  readonly manager_tenure_amc_stability: number;
  readonly category_quartile_position: number;
}

export interface VerdictThresholds {
  readonly star: number;
  readonly keep: number;
  readonly swapUpper: number;
  readonly liquidateValueInr: number;
  readonly watchMinTrackRecordMonths: number;
}
