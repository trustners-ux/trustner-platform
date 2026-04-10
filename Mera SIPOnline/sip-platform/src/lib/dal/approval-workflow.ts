// ─── Payout Approval Workflow DAL ───
// 6-step pipeline: uploaded → maker_filled → checker_approved → lob_approved → finance_approved → paid
// Any step can reject and send back to previous step

import { writeAuditLog } from './audit';
import type { AdminRole } from '@/lib/auth/config';

// ─── Types ───

export type ApprovalStatus =
  | 'uploaded'
  | 'maker_filled'
  | 'checker_approved'
  | 'lob_approved'
  | 'finance_approved'
  | 'paid'
  | 'rejected';

export type LOBType = 'Life' | 'Health' | 'GI';

export interface PayoutBatch {
  id: number;
  month: string; // YYYY-MM
  lob: LOBType;
  status: ApprovalStatus;
  totalEntries: number;
  totalAmount: number;
  totalPayout: number;

  // Step timestamps and actors
  uploadedAt?: string;
  uploadedBy?: string;
  makerFilledAt?: string;
  makerFilledBy?: string;
  checkerApprovedAt?: string;
  checkerApprovedBy?: string;
  lobApprovedAt?: string;
  lobApprovedBy?: string;
  financeApprovedAt?: string;
  financeApprovedBy?: string;
  finalApprovedAt?: string;
  finalApprovedBy?: string;

  // Rejection
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  rejectedFromStep?: ApprovalStatus;

  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ApprovalAction {
  id: number;
  batchId: number;
  action: 'approve' | 'reject' | 'fill' | 'upload' | 'resubmit';
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  actorEmail: string;
  actorName: string;
  timestamp: string;
  comments?: string;
}

// ─── Status progression (the 6-step pipeline) ───

const STATUS_PIPELINE: ApprovalStatus[] = [
  'uploaded',
  'maker_filled',
  'checker_approved',
  'lob_approved',
  'finance_approved',
  'paid',
];

function getNextStatus(current: ApprovalStatus): ApprovalStatus | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  if (idx === -1 || idx >= STATUS_PIPELINE.length - 1) return null;
  return STATUS_PIPELINE[idx + 1];
}

function getPreviousStatus(current: ApprovalStatus): ApprovalStatus | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  if (idx <= 0) return null;
  return STATUS_PIPELINE[idx - 1];
}

// ─── Role permissions: who can advance at each step ───

const FINAL_APPROVER_EMAILS = ['ram@trustner.in', 'sangeeta@trustner.in'];

const STEP_PERMISSIONS: Record<ApprovalStatus, AdminRole[]> = {
  uploaded: ['hr', 'admin', 'super_admin'], // Maker (MIS Coordinator)
  maker_filled: ['admin', 'super_admin'], // Checker
  checker_approved: ['admin', 'super_admin'], // LOB Heads
  lob_approved: ['admin', 'super_admin'], // Finance Head
  finance_approved: ['admin', 'super_admin'], // Final (Ram/Sangeeta only)
  paid: [], // Terminal — no further advance
  rejected: [], // Must resubmit first
};

export function canUserAdvance(
  status: ApprovalStatus,
  userRole: AdminRole,
  userEmail?: string
): boolean {
  const allowedRoles = STEP_PERMISSIONS[status];
  if (!allowedRoles || allowedRoles.length === 0) return false;

  // Final step (finance_approved → paid) is restricted to Ram/Sangeeta
  if (status === 'finance_approved') {
    if (!userEmail) return false;
    return FINAL_APPROVER_EMAILS.includes(userEmail.toLowerCase());
  }

  return allowedRoles.includes(userRole);
}

// ─── Status Labels ───

export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  uploaded: 'Uploaded',
  maker_filled: 'Maker Filled',
  checker_approved: 'Checker Approved',
  lob_approved: 'LOB Approved',
  finance_approved: 'Finance Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export const PIPELINE_STEPS: { status: ApprovalStatus; label: string; shortLabel: string }[] = [
  { status: 'uploaded', label: 'VJ Infosoft Upload', shortLabel: 'Uploaded' },
  { status: 'maker_filled', label: 'Maker (MIS Coordinator)', shortLabel: 'Maker' },
  { status: 'checker_approved', label: 'Checker Review', shortLabel: 'Checker' },
  { status: 'lob_approved', label: 'LOB Head Approval', shortLabel: 'LOB' },
  { status: 'finance_approved', label: 'Finance Approval', shortLabel: 'Finance' },
  { status: 'paid', label: 'Final Approval & Paid', shortLabel: 'Paid' },
];

// ─── In-memory Store ───

const now = new Date().toISOString();

let localBatches: PayoutBatch[] = [
  {
    id: 1,
    month: '2026-04',
    lob: 'Life',
    status: 'uploaded',
    totalEntries: 47,
    totalAmount: 1850000,
    totalPayout: 92500,
    uploadedAt: '2026-04-05T10:30:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    createdAt: '2026-04-05T10:30:00Z',
    updatedAt: '2026-04-05T10:30:00Z',
    notes: 'April 2026 Life insurance batch from HDFC Life, Max Life, ICICI Pru',
  },
  {
    id: 2,
    month: '2026-04',
    lob: 'Health',
    status: 'maker_filled',
    totalEntries: 32,
    totalAmount: 1250000,
    totalPayout: 75000,
    uploadedAt: '2026-04-04T09:15:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-04-06T14:20:00Z',
    makerFilledBy: 'priya@trustner.in',
    createdAt: '2026-04-04T09:15:00Z',
    updatedAt: '2026-04-06T14:20:00Z',
    notes: 'Health batch — Star Health, Care Health, Niva Bupa',
  },
  {
    id: 3,
    month: '2026-04',
    lob: 'GI',
    status: 'checker_approved',
    totalEntries: 28,
    totalAmount: 980000,
    totalPayout: 58800,
    uploadedAt: '2026-04-03T11:00:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-04-04T16:00:00Z',
    makerFilledBy: 'priya@trustner.in',
    checkerApprovedAt: '2026-04-07T10:45:00Z',
    checkerApprovedBy: 'sangeeta@trustner.in',
    createdAt: '2026-04-03T11:00:00Z',
    updatedAt: '2026-04-07T10:45:00Z',
    notes: 'GI Motor + Non-Motor combined batch',
  },
  {
    id: 4,
    month: '2026-04',
    lob: 'Life',
    status: 'lob_approved',
    totalEntries: 55,
    totalAmount: 2200000,
    totalPayout: 132000,
    uploadedAt: '2026-04-01T08:30:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-04-02T10:00:00Z',
    makerFilledBy: 'priya@trustner.in',
    checkerApprovedAt: '2026-04-03T15:00:00Z',
    checkerApprovedBy: 'sangeeta@trustner.in',
    lobApprovedAt: '2026-04-05T11:30:00Z',
    lobApprovedBy: 'sangeeta@trustner.in',
    createdAt: '2026-04-01T08:30:00Z',
    updatedAt: '2026-04-05T11:30:00Z',
  },
  {
    id: 5,
    month: '2026-04',
    lob: 'Health',
    status: 'finance_approved',
    totalEntries: 41,
    totalAmount: 1650000,
    totalPayout: 99000,
    uploadedAt: '2026-03-28T10:00:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-03-29T12:00:00Z',
    makerFilledBy: 'priya@trustner.in',
    checkerApprovedAt: '2026-03-30T14:00:00Z',
    checkerApprovedBy: 'sangeeta@trustner.in',
    lobApprovedAt: '2026-04-01T09:00:00Z',
    lobApprovedBy: 'sangeeta@trustner.in',
    financeApprovedAt: '2026-04-03T16:30:00Z',
    financeApprovedBy: 'sangeeta@trustner.in',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-04-03T16:30:00Z',
  },
  {
    id: 6,
    month: '2026-04',
    lob: 'GI',
    status: 'paid',
    totalEntries: 36,
    totalAmount: 1420000,
    totalPayout: 85200,
    uploadedAt: '2026-03-25T09:00:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-03-26T11:00:00Z',
    makerFilledBy: 'priya@trustner.in',
    checkerApprovedAt: '2026-03-27T13:00:00Z',
    checkerApprovedBy: 'sangeeta@trustner.in',
    lobApprovedAt: '2026-03-28T10:00:00Z',
    lobApprovedBy: 'sangeeta@trustner.in',
    financeApprovedAt: '2026-03-29T15:00:00Z',
    financeApprovedBy: 'sangeeta@trustner.in',
    finalApprovedAt: '2026-04-01T10:00:00Z',
    finalApprovedBy: 'ram@trustner.in',
    createdAt: '2026-03-25T09:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 7,
    month: '2026-04',
    lob: 'Life',
    status: 'rejected',
    totalEntries: 18,
    totalAmount: 720000,
    totalPayout: 43200,
    uploadedAt: '2026-04-02T10:00:00Z',
    uploadedBy: 'vj.infosoft@trustner.in',
    makerFilledAt: '2026-04-03T12:00:00Z',
    makerFilledBy: 'priya@trustner.in',
    rejectedAt: '2026-04-04T09:30:00Z',
    rejectedBy: 'sangeeta@trustner.in',
    rejectionReason: 'Duplicate entries found for policy numbers LI-2026-441 and LI-2026-445. Please reconcile and resubmit.',
    rejectedFromStep: 'maker_filled',
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-04T09:30:00Z',
  },
];

let localActions: ApprovalAction[] = [
  // Batch 1 — uploaded
  { id: 1, batchId: 1, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-04-05T10:30:00Z', comments: 'Raw data uploaded for April 2026 Life batch' },

  // Batch 2 — maker_filled
  { id: 2, batchId: 2, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-04-04T09:15:00Z' },
  { id: 3, batchId: 2, action: 'fill', fromStatus: 'uploaded', toStatus: 'maker_filled', actorEmail: 'priya@trustner.in', actorName: 'Priya Sharma', timestamp: '2026-04-06T14:20:00Z', comments: 'Filled all missing fields — RM mapping, product codes verified' },

  // Batch 3 — checker_approved
  { id: 4, batchId: 3, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-04-03T11:00:00Z' },
  { id: 5, batchId: 3, action: 'fill', fromStatus: 'uploaded', toStatus: 'maker_filled', actorEmail: 'priya@trustner.in', actorName: 'Priya Sharma', timestamp: '2026-04-04T16:00:00Z' },
  { id: 6, batchId: 3, action: 'approve', fromStatus: 'maker_filled', toStatus: 'checker_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-04-07T10:45:00Z', comments: 'Amounts verified against insurer statements' },

  // Batch 4 — lob_approved
  { id: 7, batchId: 4, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-04-01T08:30:00Z' },
  { id: 8, batchId: 4, action: 'fill', fromStatus: 'uploaded', toStatus: 'maker_filled', actorEmail: 'priya@trustner.in', actorName: 'Priya Sharma', timestamp: '2026-04-02T10:00:00Z' },
  { id: 9, batchId: 4, action: 'approve', fromStatus: 'maker_filled', toStatus: 'checker_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-04-03T15:00:00Z' },
  { id: 10, batchId: 4, action: 'approve', fromStatus: 'checker_approved', toStatus: 'lob_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-04-05T11:30:00Z', comments: 'Life LOB head approved — all policies verified' },

  // Batch 6 — paid (full trail)
  { id: 11, batchId: 6, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-03-25T09:00:00Z' },
  { id: 12, batchId: 6, action: 'fill', fromStatus: 'uploaded', toStatus: 'maker_filled', actorEmail: 'priya@trustner.in', actorName: 'Priya Sharma', timestamp: '2026-03-26T11:00:00Z' },
  { id: 13, batchId: 6, action: 'approve', fromStatus: 'maker_filled', toStatus: 'checker_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-03-27T13:00:00Z' },
  { id: 14, batchId: 6, action: 'approve', fromStatus: 'checker_approved', toStatus: 'lob_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-03-28T10:00:00Z' },
  { id: 15, batchId: 6, action: 'approve', fromStatus: 'lob_approved', toStatus: 'finance_approved', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-03-29T15:00:00Z' },
  { id: 16, batchId: 6, action: 'approve', fromStatus: 'finance_approved', toStatus: 'paid', actorEmail: 'ram@trustner.in', actorName: 'Ram Shah', timestamp: '2026-04-01T10:00:00Z', comments: 'Final approval — payment released' },

  // Batch 7 — rejected
  { id: 17, batchId: 7, action: 'upload', fromStatus: 'uploaded', toStatus: 'uploaded', actorEmail: 'vj.infosoft@trustner.in', actorName: 'VJ Infosoft', timestamp: '2026-04-02T10:00:00Z' },
  { id: 18, batchId: 7, action: 'fill', fromStatus: 'uploaded', toStatus: 'maker_filled', actorEmail: 'priya@trustner.in', actorName: 'Priya Sharma', timestamp: '2026-04-03T12:00:00Z' },
  { id: 19, batchId: 7, action: 'reject', fromStatus: 'maker_filled', toStatus: 'rejected', actorEmail: 'sangeeta@trustner.in', actorName: 'Sangeeta Shah', timestamp: '2026-04-04T09:30:00Z', comments: 'Duplicate entries found for policy numbers LI-2026-441 and LI-2026-445' },
];

let localNextBatchId = localBatches.length + 1;
let localNextActionId = localActions.length + 1;

// ─── CRUD Functions ───

/**
 * Create a new payout batch (VJ Infosoft upload step)
 */
export async function createBatch(
  month: string,
  lob: LOBType,
  totalEntries: number,
  totalAmount: number,
  uploadedBy: string
): Promise<PayoutBatch> {
  const ts = new Date().toISOString();
  const totalPayout = Math.round(totalAmount * 0.06); // ~6% default payout estimate

  const batch: PayoutBatch = {
    id: localNextBatchId++,
    month,
    lob,
    status: 'uploaded',
    totalEntries,
    totalAmount,
    totalPayout,
    uploadedAt: ts,
    uploadedBy,
    createdAt: ts,
    updatedAt: ts,
  };

  localBatches.push(batch);

  // Record the upload action
  localActions.push({
    id: localNextActionId++,
    batchId: batch.id,
    action: 'upload',
    fromStatus: 'uploaded',
    toStatus: 'uploaded',
    actorEmail: uploadedBy,
    actorName: uploadedBy,
    timestamp: ts,
    comments: `New ${lob} batch uploaded for ${month}`,
  });

  await writeAuditLog({
    tableName: 'payout_batches',
    recordId: batch.id,
    action: 'INSERT',
    changedBy: uploadedBy,
    newValues: { month, lob, totalEntries, totalAmount },
  });

  return batch;
}

/**
 * Get a single batch by ID
 */
export async function getBatch(id: number): Promise<PayoutBatch | undefined> {
  return localBatches.find((b) => b.id === id);
}

/**
 * List batches with optional filters
 */
export async function listBatches(filters?: {
  month?: string;
  lob?: LOBType;
  status?: ApprovalStatus;
}): Promise<PayoutBatch[]> {
  let result = [...localBatches];

  if (filters?.month) result = result.filter((b) => b.month === filters.month);
  if (filters?.lob) result = result.filter((b) => b.lob === filters.lob);
  if (filters?.status) result = result.filter((b) => b.status === filters.status);

  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Advance a batch to the next pipeline step
 */
export async function advanceBatch(
  id: number,
  actorEmail: string,
  actorName: string,
  comments?: string
): Promise<PayoutBatch> {
  const batch = localBatches.find((b) => b.id === id);
  if (!batch) throw new Error(`Batch ${id} not found`);

  const nextStatus = getNextStatus(batch.status);
  if (!nextStatus) throw new Error(`Batch ${id} is already at terminal status "${batch.status}"`);

  const ts = new Date().toISOString();
  const fromStatus = batch.status;

  // Update batch status and step-specific fields
  batch.status = nextStatus;
  batch.updatedAt = ts;
  if (comments) batch.notes = comments;

  switch (nextStatus) {
    case 'maker_filled':
      batch.makerFilledAt = ts;
      batch.makerFilledBy = actorEmail;
      break;
    case 'checker_approved':
      batch.checkerApprovedAt = ts;
      batch.checkerApprovedBy = actorEmail;
      break;
    case 'lob_approved':
      batch.lobApprovedAt = ts;
      batch.lobApprovedBy = actorEmail;
      break;
    case 'finance_approved':
      batch.financeApprovedAt = ts;
      batch.financeApprovedBy = actorEmail;
      break;
    case 'paid':
      batch.finalApprovedAt = ts;
      batch.finalApprovedBy = actorEmail;
      break;
  }

  // Record the action
  const actionType = fromStatus === 'uploaded' ? 'fill' : 'approve';
  localActions.push({
    id: localNextActionId++,
    batchId: id,
    action: actionType,
    fromStatus,
    toStatus: nextStatus,
    actorEmail,
    actorName,
    timestamp: ts,
    comments,
  });

  await writeAuditLog({
    tableName: 'payout_batches',
    recordId: id,
    action: 'APPROVE',
    changedBy: actorEmail,
    oldValues: { status: fromStatus },
    newValues: { status: nextStatus },
    reason: comments,
  });

  return batch;
}

/**
 * Reject a batch — sets status to 'rejected' and records the source step
 */
export async function rejectBatch(
  id: number,
  actorEmail: string,
  actorName: string,
  reason: string
): Promise<PayoutBatch> {
  const batch = localBatches.find((b) => b.id === id);
  if (!batch) throw new Error(`Batch ${id} not found`);
  if (batch.status === 'paid') throw new Error('Cannot reject a paid batch');
  if (batch.status === 'rejected') throw new Error('Batch is already rejected');

  const ts = new Date().toISOString();
  const fromStatus = batch.status;

  batch.rejectedAt = ts;
  batch.rejectedBy = actorEmail;
  batch.rejectionReason = reason;
  batch.rejectedFromStep = fromStatus;
  batch.status = 'rejected';
  batch.updatedAt = ts;

  localActions.push({
    id: localNextActionId++,
    batchId: id,
    action: 'reject',
    fromStatus,
    toStatus: 'rejected',
    actorEmail,
    actorName,
    timestamp: ts,
    comments: reason,
  });

  await writeAuditLog({
    tableName: 'payout_batches',
    recordId: id,
    action: 'REJECT',
    changedBy: actorEmail,
    oldValues: { status: fromStatus },
    newValues: { status: 'rejected', reason },
  });

  return batch;
}

/**
 * Resubmit a rejected batch — moves it back to the step before rejection
 */
export async function resubmitBatch(
  id: number,
  actorEmail: string,
  actorName: string
): Promise<PayoutBatch> {
  const batch = localBatches.find((b) => b.id === id);
  if (!batch) throw new Error(`Batch ${id} not found`);
  if (batch.status !== 'rejected') throw new Error('Only rejected batches can be resubmitted');

  const ts = new Date().toISOString();

  // Move back to the step before the rejection occurred
  const returnToStep = batch.rejectedFromStep
    ? getPreviousStatus(batch.rejectedFromStep) || 'uploaded'
    : 'uploaded';

  const fromStatus = batch.status;
  batch.status = returnToStep;
  batch.updatedAt = ts;

  // Clear rejection fields
  batch.rejectedAt = undefined;
  batch.rejectedBy = undefined;
  batch.rejectionReason = undefined;
  batch.rejectedFromStep = undefined;

  localActions.push({
    id: localNextActionId++,
    batchId: id,
    action: 'resubmit',
    fromStatus,
    toStatus: returnToStep,
    actorEmail,
    actorName,
    timestamp: ts,
    comments: `Resubmitted — returned to ${STATUS_LABELS[returnToStep]} step`,
  });

  await writeAuditLog({
    tableName: 'payout_batches',
    recordId: id,
    action: 'UPDATE',
    changedBy: actorEmail,
    oldValues: { status: 'rejected' },
    newValues: { status: returnToStep, action: 'resubmit' },
  });

  return batch;
}

/**
 * Get the full audit trail for a batch
 */
export async function getBatchHistory(batchId: number): Promise<ApprovalAction[]> {
  return localActions
    .filter((a) => a.batchId === batchId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Get aggregate stats for batches
 */
export async function getBatchStats(month?: string): Promise<{
  total: number;
  byStatus: Record<ApprovalStatus, number>;
  byLob: Record<LOBType, number>;
  totalAmount: number;
  totalPayout: number;
  pendingActions: number;
  rejectedCount: number;
}> {
  let batches = [...localBatches];
  if (month) batches = batches.filter((b) => b.month === month);

  const byStatus: Record<ApprovalStatus, number> = {
    uploaded: 0,
    maker_filled: 0,
    checker_approved: 0,
    lob_approved: 0,
    finance_approved: 0,
    paid: 0,
    rejected: 0,
  };

  const byLob: Record<LOBType, number> = {
    Life: 0,
    Health: 0,
    GI: 0,
  };

  let totalAmount = 0;
  let totalPayout = 0;
  let pendingActions = 0;
  let rejectedCount = 0;

  for (const b of batches) {
    byStatus[b.status]++;
    byLob[b.lob]++;
    totalAmount += b.totalAmount;
    totalPayout += b.totalPayout;

    if (b.status === 'rejected') {
      rejectedCount++;
    } else if (b.status !== 'paid') {
      pendingActions++;
    }
  }

  return {
    total: batches.length,
    byStatus,
    byLob,
    totalAmount,
    totalPayout,
    pendingActions,
    rejectedCount,
  };
}
