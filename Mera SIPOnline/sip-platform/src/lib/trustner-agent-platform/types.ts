/**
 * Trustner Agent Platform — Shared Type Definitions
 *
 * Generic types reusable by ALL finance agents on the Trustner platform:
 *   - Portfolio Diagnostic
 *   - Meeting Prep
 *   - Investment Proposal
 *   - Client Orientation
 *   - Periodic Review
 *
 * Each agent has its own domain-specific data, but they all share:
 *   - Workflow state machine
 *   - Role-based access control
 *   - Audit log
 *   - Review comments
 *   - Client family + entity model
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

// ─────────────────────────────────────────────────────────────────
// AGENT IDENTITY
// ─────────────────────────────────────────────────────────────────

export type AgentName =
  | 'portfolio_diagnostic'
  | 'meeting_prep'
  | 'investment_proposal'
  | 'client_orientation'
  | 'periodic_review';

/**
 * Registry of all live agents on the platform. Used by routing,
 * audit log, and admin tooling to identify which agent a given
 * run belongs to.
 */
export interface AgentMetadata {
  name: AgentName;
  displayName: string;
  description: string;
  baseRoute: string;                  // e.g. '/admin/portfolio-diagnostic'
  apiBase: string;                    // e.g. '/api/admin/portfolio-diagnostic'
  outputAudience: 'internal' | 'client';
  requiresClientSignoff: boolean;
  averageDraftMinutes: number;
  averageReviewMinutes: number;
}

export const AGENT_REGISTRY: Record<AgentName, AgentMetadata> = {
  portfolio_diagnostic: {
    name: 'portfolio_diagnostic',
    displayName: 'Portfolio Diagnostic',
    description: 'Category-benchmarked fund analysis & re-alignment plan',
    baseRoute: '/admin/portfolio-diagnostic',
    apiBase: '/api/admin/portfolio-diagnostic',
    outputAudience: 'client',
    requiresClientSignoff: true,
    averageDraftMinutes: 30,
    averageReviewMinutes: 20,
  },
  meeting_prep: {
    name: 'meeting_prep',
    displayName: 'Meeting Prep Brief',
    description: 'Pre-meeting briefing pack for the RM',
    baseRoute: '/admin/meeting-prep',
    apiBase: '/api/admin/meeting-prep',
    outputAudience: 'internal',
    requiresClientSignoff: false,
    averageDraftMinutes: 15,
    averageReviewMinutes: 10,
  },
  investment_proposal: {
    name: 'investment_proposal',
    displayName: 'Investment Proposal',
    description: 'New investment recommendation with allocation & funds',
    baseRoute: '/admin/investment-proposal',
    apiBase: '/api/admin/investment-proposal',
    outputAudience: 'client',
    requiresClientSignoff: true,
    averageDraftMinutes: 45,
    averageReviewMinutes: 30,
  },
  client_orientation: {
    name: 'client_orientation',
    displayName: 'Client Orientation',
    description: 'New-client welcome pack + risk profile + goals',
    baseRoute: '/admin/client-orientation',
    apiBase: '/api/admin/client-orientation',
    outputAudience: 'client',
    requiresClientSignoff: true,
    averageDraftMinutes: 60,
    averageReviewMinutes: 30,
  },
  periodic_review: {
    name: 'periodic_review',
    displayName: 'Periodic Review',
    description: 'Quarterly / annual performance review note',
    baseRoute: '/admin/periodic-review',
    apiBase: '/api/admin/periodic-review',
    outputAudience: 'client',
    requiresClientSignoff: false,
    averageDraftMinutes: 20,
    averageReviewMinutes: 15,
  },
};

// ─────────────────────────────────────────────────────────────────
// COMMON WORKFLOW (agent-agnostic copy of the state machine types)
// ─────────────────────────────────────────────────────────────────

export type AgentWorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'ESCALATED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type AgentWorkflowAction =
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
  | 'ARCHIVE'
  | 'OVERRIDE';

/**
 * A run of ANY agent. The shape is generic; agent-specific data sits
 * in the `details` payload typed by the consuming agent.
 */
export interface AgentRunBase {
  id: number;
  agent: AgentName;
  documentId: string;                 // e.g. 'RJF-MP-2026-05-22'
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
  createdAt: string;
  updatedAt: string;
  // Output PDFs (filled only on PUBLISHED transition)
  outputPdfUrls?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD COMMON SHAPES
// ─────────────────────────────────────────────────────────────────

export interface AgentDashboardCounts {
  myDrafts: number;
  awaitingMyReview: number;
  approvedNotYetPublished: number;
  publishedThisMonth: number;
}

export interface AgentQueueItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  agent: AgentName;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Agent-specific badges/summary text shown on each queue row.
   * E.g. portfolio shows "5 swaps · ₹34 L"; meeting prep shows
   * "Meeting at 3 PM · 1 open action item".
   */
  summaryChips?: Array<{ label: string; tone?: 'default' | 'warning' | 'success' | 'danger' }>;
}

// ─────────────────────────────────────────────────────────────────
// SHARED CLIENT/EMPLOYEE TYPES (re-exports for convenience)
// ─────────────────────────────────────────────────────────────────

export type { ClientFamily, FamilyEntity, Employee, Role, RoleName, RoleLevel, CertificationName, ClientSegment, EntityType }
    from '@/lib/portfolio-diagnostic/types';
