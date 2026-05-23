/**
 * Investment Proposal Agent — Type Definitions
 *
 * Recommends a specific allocation + fund picks for a new investment
 * or SIP step-up. Client-facing output with mandatory signoff.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  AgentWorkflowStatus,
} from '@/lib/trustner-agent-platform/types';

export type ProposalPurpose =
  | 'New Investment'
  | 'SIP Step-Up'
  | 'Lump Sum Top-Up'
  | 'Goal-Based Plan'
  | 'Tax-Saver (ELSS)'
  | 'Other';

export type RiskProfile =
  | 'Conservative'
  | 'Moderate'
  | 'Moderately Aggressive'
  | 'Aggressive'
  | 'Very Aggressive';

export type HorizonBand =
  | '< 1 year'
  | '1-3 years'
  | '3-5 years'
  | '5-7 years'
  | '7-10 years'
  | '> 10 years';

// ─────────────────────────────────────────────────────────────────
// ALLOCATION
// ─────────────────────────────────────────────────────────────────

export interface AssetAllocation {
  largeCap: number;
  midCap: number;
  smallCap: number;
  flexiCap: number;
  multiCap: number;
  largeAndMid: number;
  hybrid: number;
  debt: number;
  international: number;
  gold: number;
}

export type AllocationKey = keyof AssetAllocation;

/**
 * Default allocation templates by risk profile.
 * These are STARTING POINTS — the L3/L4 reviewer customises before publishing.
 */
export const ALLOCATION_TEMPLATES: Record<RiskProfile, AssetAllocation> = {
  Conservative: {
    largeCap: 10, midCap: 5, smallCap: 0, flexiCap: 10, multiCap: 5,
    largeAndMid: 0, hybrid: 30, debt: 35, international: 0, gold: 5,
  },
  Moderate: {
    largeCap: 20, midCap: 10, smallCap: 5, flexiCap: 15, multiCap: 10,
    largeAndMid: 5, hybrid: 20, debt: 10, international: 0, gold: 5,
  },
  'Moderately Aggressive': {
    largeCap: 20, midCap: 15, smallCap: 10, flexiCap: 20, multiCap: 10,
    largeAndMid: 10, hybrid: 10, debt: 0, international: 5, gold: 0,
  },
  Aggressive: {
    largeCap: 15, midCap: 20, smallCap: 20, flexiCap: 20, multiCap: 5,
    largeAndMid: 10, hybrid: 5, debt: 0, international: 5, gold: 0,
  },
  'Very Aggressive': {
    largeCap: 10, midCap: 25, smallCap: 30, flexiCap: 15, multiCap: 5,
    largeAndMid: 10, hybrid: 0, debt: 0, international: 5, gold: 0,
  },
};

// ─────────────────────────────────────────────────────────────────
// PROPOSAL
// ─────────────────────────────────────────────────────────────────

export interface InvestmentProposal {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  uploadedByEmployeeId: number;
  uploadedByName?: string;
  currentReviewerEmployeeId?: number;
  approvedByEmployeeId?: number;
  approvedAt?: string;
  publishedAt?: string;

  // Proposal context
  purpose: ProposalPurpose;
  customPurposeNote?: string;
  proposedAmountInr: number;
  proposedLumpSumInr: number;
  proposedMonthlySipInr: number;
  horizon: HorizonBand;
  riskProfile: RiskProfile;
  goalStatement?: string;

  // Allocation
  allocation: AssetAllocation;

  // Expected outcomes
  expected5yConservativeInr?: number;
  expected5yBaseInr?: number;
  expected5yOptimisticInr?: number;
  expected10yBaseInr?: number;

  // Tax
  expectedLtcgAt5yInr?: number;
  elssSavingsInr?: number;

  // Recommendations
  recommendations: ProposalRecommendation[];

  // Output
  proposalPdfUrl?: string;
  riskDisclosurePdfUrl?: string;
  clientSignedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProposalRecommendation {
  id: number;
  proposalId: number;
  orderIndex: number;
  amfiCode?: string;
  fundName: string;
  category?: string;
  allocationPct: number;
  allocationInr: number;
  instrumentType: 'Lump Sum' | 'Monthly SIP' | 'Both';
  monthlySipInr: number;
  lumpSumInr: number;
  rationale: string;
  cagr3yAtRecommendation?: number;
  cagr5yAtRecommendation?: number;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────

export interface InvestmentProposalListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  purpose: ProposalPurpose;
  proposedAmountInr: number;
  riskProfile: RiskProfile;
  horizon: HorizonBand;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  numRecommendations: number;
  clientSigned: boolean;
  createdAt: string;
  updatedAt: string;
}
