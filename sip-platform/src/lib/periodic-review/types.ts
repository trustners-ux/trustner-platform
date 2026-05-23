/**
 * Periodic Review Agent — Type Definitions
 *
 * Quarterly / annual performance review note. Auto-drafted by cron
 * 7 days before period end; references the underlying Portfolio
 * Diagnostic for the same period.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { AgentWorkflowStatus } from '@/lib/trustner-agent-platform/types';

export type ReviewCadence = 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Ad-Hoc';

export interface PeriodicReview {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;

  // Review context
  cadence: ReviewCadence;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  underlyingDiagnosticRunId?: number;
  priorPeriodicReviewId?: number;

  // Snapshot
  currentAumInr?: number;
  periodStartAumInr?: number;
  periodGainInr?: number;
  periodReturnPct?: number;
  familyXirrPct?: number;
  benchmarkReturnPct?: number;
  alphaPct?: number;

  // Performance attribution
  topContributor1?: string;
  topContributor1ContributionInr?: number;
  topContributor2?: string;
  topContributor2ContributionInr?: number;
  topContributor3?: string;
  topContributor3ContributionInr?: number;
  topDetractor1?: string;
  topDetractor1ContributionInr?: number;
  topDetractor2?: string;
  topDetractor2ContributionInr?: number;
  topDetractor3?: string;
  topDetractor3ContributionInr?: number;

  // Goals
  numActiveGoals: number;
  numGoalsOnTrack: number;
  numGoalsBehind: number;

  // Action items
  numActionItemsCompleted: number;
  numActionItemsNew: number;
  numActionItemsPending: number;

  // Commentary
  marketSummary?: string;
  outlookNextPeriod?: string;

  // Output
  reviewNotePdfUrl?: string;
  clientAcknowledgedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PeriodicActionItem {
  id: number;
  reviewId: number;
  familyId: number;
  description: string;
  owner: 'Client' | 'RM' | 'Both';
  status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
  dueDate?: string;
  completedAt?: string;
  completedByEmployeeId?: number;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────

export interface PeriodicReviewListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  cadence: ReviewCadence;
  reviewPeriodEnd: string;
  periodReturnPct: number | null;
  alphaPct: number | null;
  numOpenActionItems: number;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// PERIOD HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Compute the period start/end dates for a given cadence + end date.
 */
export function computePeriodWindow(
  cadence: ReviewCadence,
  endDate: Date = new Date()
): { start: string; end: string } {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  switch (cadence) {
    case 'Quarterly':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'Half-Yearly':
      start.setMonth(end.getMonth() - 6);
      break;
    case 'Annual':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'Ad-Hoc':
      start.setMonth(end.getMonth() - 3); // default to quarterly window
      break;
  }
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}
