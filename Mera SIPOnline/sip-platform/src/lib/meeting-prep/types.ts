/**
 * Meeting Prep Agent — Type Definitions
 *
 * Pre-meeting briefing pack assembled by the RM 24 hours before a
 * client meeting. Internal output — not delivered to the client.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  AgentWorkflowStatus,
} from '@/lib/trustner-agent-platform/types';

// ─────────────────────────────────────────────────────────────────
// MEETING CONTEXT
// ─────────────────────────────────────────────────────────────────

export type MeetingPurpose =
  | 'Quarterly Review'
  | 'Annual Review'
  | 'New Investment Discussion'
  | 'SIP Step-Up'
  | 'Grievance / Concern'
  | 'Onboarding Kickoff'
  | 'Retention Conversation'
  | 'Family Wealth Planning'
  | 'Other';

export type MeetingFormat = 'In-Person' | 'Phone' | 'Video' | 'WhatsApp';

export interface MeetingContext {
  scheduledAt: string;                // ISO datetime
  durationMinutes: number;
  format: MeetingFormat;
  purpose: MeetingPurpose;
  customPurposeNote?: string;
  primaryAttendees: string[];         // names: client + family members attending
  trustnerAttendees: number[];        // employee IDs attending
  location?: string;                  // physical location or video link
}

// ─────────────────────────────────────────────────────────────────
// BRIEFING SECTIONS (8 sections in the output PDF)
// ─────────────────────────────────────────────────────────────────

/**
 * Section 1 — Relationship Snapshot
 *
 * Auto-populated from CRM. Shows how long the family has been with
 * Trustner, last meeting date, total AUM, key relationships.
 */
export interface RelationshipSnapshot {
  clientSinceDate: string;            // YYYY-MM-DD
  yearsWithTrustner: number;
  lastMeetingDate?: string;
  lastMeetingPurpose?: MeetingPurpose;
  totalAumInr: number;
  numEntities: number;
  primaryRmName: string;
  assignedCfpName?: string;
  relationshipQualityScore?: 1 | 2 | 3 | 4 | 5;  // RM's subjective rating
  notes?: string;
}

/**
 * Section 2 — Portfolio Current State
 *
 * Pulled from the latest Portfolio Diagnostic run if one exists,
 * else computed live from holdings.
 */
export interface PortfolioCurrentState {
  totalAumInr: number;
  totalInvestedInr: number;
  unrealisedGainInr: number;
  familyXirrPct: number | null;
  numHoldings: number;
  numActiveSips: number;
  monthlySipFlowInr: number;
  lastDiagnosticDate?: string;
  lastDiagnosticVerdictCounts?: {
    star: number;
    keep: number;
    watch: number;
    swap: number;
    liquidate: number;
  };
}

/**
 * Section 3 — Recent Transactions (last 90 days)
 */
export interface RecentTransaction {
  date: string;
  entityName: string;
  fundName: string;
  type: 'Purchase' | 'Redemption' | 'SIP' | 'Switch' | 'Dividend';
  amountInr: number;
  notes?: string;
}

/**
 * Section 4 — Open Action Items from Last Meeting
 */
export interface OpenActionItem {
  id: number;
  fromMeetingDate: string;
  description: string;
  owner: 'Client' | 'RM' | 'Both';
  status: 'Open' | 'In Progress' | 'Blocked';
  dueDate?: string;
  notes?: string;
}

/**
 * Section 5 — Market Context Relevant to Client's Holdings
 *
 * Auto-curated based on which categories the client is exposed to.
 * E.g. if client has heavy small-cap, show recent small-cap moves.
 */
export interface MarketContextPoint {
  topic: string;                      // 'Small Cap Rebound', 'RBI Rate Hold', etc.
  bullet: string;                     // 1-2 sentence summary
  relevanceToClient: string;          // why this matters to THEIR portfolio
}

/**
 * Section 6 — Suggested Talking Points
 *
 * RM-customised; can be auto-suggested by Claude from sections 1-5.
 */
export interface TalkingPoint {
  order: number;
  point: string;                      // the prompt/question RM should raise
  intent: 'Inform' | 'Discuss' | 'Decide' | 'Confirm';
  estimatedMinutes: number;
  supportingDataRef?: string;         // e.g. 'See Portfolio Diagnostic Section IV'
}

/**
 * Section 7 — Anticipated Client Questions + Prepared Answers
 *
 * Auto-suggested from client's last-meeting comments + current market
 * context. RM can edit / add / remove.
 */
export interface AnticipatedQA {
  question: string;
  preparedAnswer: string;
  source?: string;                    // 'From last meeting notes' / 'Common Q for this segment'
}

/**
 * Section 8 — Next-Step Opportunities (cross-sell / up-sell)
 *
 * Identified gaps: missing categories, under-funded goals,
 * insurance gaps, estate-planning gaps.
 */
export interface OpportunityCandidate {
  category: 'Cross-Sell' | 'Up-Sell' | 'New Product' | 'Family Member Onboarding';
  description: string;
  estimatedTicketSizeInr?: number;
  rationale: string;
  priority: 'High' | 'Medium' | 'Low';
}

// ─────────────────────────────────────────────────────────────────
// FULL BRIEFING PACK
// ─────────────────────────────────────────────────────────────────

export interface MeetingPrepBrief {
  id: number;
  documentId: string;                 // 'RJF-MP-2026-05-22'
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  uploadedByEmployeeId: number;
  uploadedByName: string;
  currentReviewerEmployeeId?: number;
  currentReviewerName?: string;
  approvedByEmployeeId?: number;
  approvedAt?: string;
  publishedAt?: string;

  // Meeting context
  meeting: MeetingContext;

  // 8 sections
  section1RelationshipSnapshot: RelationshipSnapshot;
  section2PortfolioCurrentState: PortfolioCurrentState;
  section3RecentTransactions: RecentTransaction[];
  section4OpenActionItems: OpenActionItem[];
  section5MarketContext: MarketContextPoint[];
  section6TalkingPoints: TalkingPoint[];
  section7AnticipatedQa: AnticipatedQA[];
  section8Opportunities: OpportunityCandidate[];

  // Output PDF
  briefingPackPdfUrl?: string;

  // Delivery
  emailSentAt?: string;
  whatsappSentAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD / QUEUE TYPES
// ─────────────────────────────────────────────────────────────────

export interface MeetingPrepListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  meetingScheduledAt: string;
  meetingPurpose: MeetingPurpose;
  meetingFormat: MeetingFormat;
  hoursUntilMeeting: number;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  numOpenActionItems: number;
  numOpportunities: number;
  createdAt: string;
  updatedAt: string;
}
