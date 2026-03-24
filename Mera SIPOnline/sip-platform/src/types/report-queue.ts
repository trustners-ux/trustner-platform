/**
 * Report Queue Types — Maker-Checker Workflow
 * Reports are queued for admin review before being emailed to users.
 */

export type ReportStatus = 'pending_review' | 'approved' | 'sent' | 'rejected';

export interface PillarSummary {
  score: number;
  grade: string;
}

export interface EditHistoryEntry {
  timestamp: string;
  adminEmail: string;
  action: 'narrative_edited' | 'narrative_regenerated' | 'approved' | 'rejected' | 'reviewed';
  details?: string;
}

export type PlanTierLabel = 'basic' | 'standard' | 'comprehensive';

export interface ReportQueueEntry {
  id: string; // "rpt-{timestamp}-{random6}"
  status: ReportStatus;
  tier?: PlanTierLabel; // Financial planning tier (basic/standard/comprehensive)

  // User info (denormalized for table display)
  userName: string;
  userEmail: string;
  userPhone: string;
  userAge: number;
  userCity: string;
  riskCategory: string;

  // Report summary
  totalScore: number;
  grade: string;
  netWorth: number;
  pillarScores: {
    cashflow: PillarSummary;
    protection: PillarSummary;
    investments: PillarSummary;
    debt: PillarSummary;
    retirementReadiness: PillarSummary;
  };
  topActions: string[];

  // Narrative
  claudeNarrative: string;
  editedNarrative: string | null;
  narrativeVersion: number;

  // Blob references
  pdfBlobUrl: string;
  dataBlobUrl: string;

  // Timestamps
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  rejectedAt: string | null;

  // Audit
  reviewedBy: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  editHistory: EditHistoryEntry[];

  // Reminder tracking
  remindersSent: number;
  lastReminderAt: string | null;
}
