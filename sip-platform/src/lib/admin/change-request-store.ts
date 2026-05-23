/**
 * Change Request Store — Vercel Blob-backed storage for maker-checker approval workflow.
 * Each change request is stored at approvals/{id}.json
 */

import { put, list } from '@vercel/blob';
import type {
  ChangeRequest,
  ChangeRequestType,
  ChangeRequestStatus,
} from '@/types/change-request';
import { updateSlab, insertSlab, deleteSlab } from '@/lib/dal/incentive-slabs';
import { updateProduct, insertProduct, deleteProduct } from '@/lib/dal/products';
import { updateEmployee } from '@/lib/dal/employees';
import { writeAuditLog } from '@/lib/dal/audit';

// ─── ID Generator ───
function generateRequestId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `cr-${ts}-${rand}`;
}

// ─── Create Change Request ───
export async function createChangeRequest(params: {
  type: ChangeRequestType;
  title: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
  changeData: Record<string, unknown>;
  previousData?: Record<string, unknown> | null;
}): Promise<ChangeRequest> {
  const id = generateRequestId();

  const entry: ChangeRequest = {
    id,
    type: params.type,
    status: 'pending',
    title: params.title,
    description: params.description,
    requestedBy: params.requestedBy,
    requestedByName: params.requestedByName,
    requestedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    changeData: params.changeData,
    previousData: params.previousData || null,
  };

  await put(`approvals/${id}.json`, JSON.stringify(entry), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  console.log(`[ChangeRequest] Created ${id} — type=${params.type}, by=${params.requestedBy}`);
  return entry;
}

// ─── List Change Requests ───
export async function getChangeRequests(filter?: {
  type?: ChangeRequestType;
  status?: ChangeRequestStatus;
}): Promise<ChangeRequest[]> {
  const entries: ChangeRequest[] = [];

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await list({
      prefix: 'approvals/',
      cursor,
      limit: 100,
    });

    for (const blob of result.blobs) {
      try {
        const res = await fetch(blob.url);
        if (!res.ok) continue;
        const entry = (await res.json()) as ChangeRequest;
        entries.push(entry);
      } catch {
        console.error(`[ChangeRequest] Failed to parse ${blob.pathname}`);
      }
    }

    hasMore = result.hasMore;
    cursor = result.cursor;
  }

  // Apply filters
  let filtered = entries;

  if (filter?.type) {
    filtered = filtered.filter((e) => e.type === filter.type);
  }

  if (filter?.status) {
    filtered = filtered.filter((e) => e.status === filter.status);
  }

  // Sort by requestedAt descending (newest first)
  filtered.sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

  console.log(`[ChangeRequest] Listed ${filtered.length} entries (total=${entries.length})`);
  return filtered;
}

// ─── Get Single Change Request ───
export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
  try {
    const result = await list({ prefix: `approvals/${id}.json`, limit: 1 });
    if (result.blobs.length === 0) return null;

    const res = await fetch(result.blobs[0].url);
    if (!res.ok) return null;
    return (await res.json()) as ChangeRequest;
  } catch {
    console.error(`[ChangeRequest] Failed to get entry ${id}`);
    return null;
  }
}

// ─── Update Change Request ───
export async function updateChangeRequest(
  id: string,
  updates: Partial<ChangeRequest>
): Promise<ChangeRequest | null> {
  const entry = await getChangeRequest(id);
  if (!entry) return null;

  const updated: ChangeRequest = { ...entry, ...updates, id: entry.id };

  await put(`approvals/${id}.json`, JSON.stringify(updated), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  console.log(`[ChangeRequest] Updated ${id} — status=${updated.status}`);
  return updated;
}

// ─── Approve Change Request ───
export async function approveChangeRequest(
  id: string,
  reviewerEmail: string
): Promise<ChangeRequest | null> {
  const entry = await getChangeRequest(id);
  if (!entry) {
    console.error(`[ChangeRequest] Cannot approve — entry ${id} not found`);
    return null;
  }

  if (entry.status !== 'pending') {
    console.error(`[ChangeRequest] Cannot approve — entry ${id} status is ${entry.status}`);
    return null;
  }

  // Execute the actual change based on type
  try {
    await executeChange(entry, reviewerEmail);
  } catch (error) {
    console.error(`[ChangeRequest] Failed to execute change for ${id}:`, error);
    throw error;
  }

  // Update the change request status
  const updated = await updateChangeRequest(id, {
    status: 'approved',
    reviewedBy: reviewerEmail,
    reviewedAt: new Date().toISOString(),
  });

  // Write audit log
  await writeAuditLog({
    tableName: 'change_requests',
    action: 'APPROVE',
    changedBy: reviewerEmail,
    newValues: { id, type: entry.type, title: entry.title },
  });

  console.log(`[ChangeRequest] Approved ${id} by ${reviewerEmail}`);
  return updated;
}

// ─── Reject Change Request ───
export async function rejectChangeRequest(
  id: string,
  reviewerEmail: string,
  reason: string
): Promise<ChangeRequest | null> {
  const entry = await getChangeRequest(id);
  if (!entry) {
    console.error(`[ChangeRequest] Cannot reject — entry ${id} not found`);
    return null;
  }

  if (entry.status !== 'pending') {
    console.error(`[ChangeRequest] Cannot reject — entry ${id} status is ${entry.status}`);
    return null;
  }

  const updated = await updateChangeRequest(id, {
    status: 'rejected',
    reviewedBy: reviewerEmail,
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason,
  });

  // Write audit log
  await writeAuditLog({
    tableName: 'change_requests',
    action: 'REJECT',
    changedBy: reviewerEmail,
    newValues: { id, type: entry.type, title: entry.title, reason },
  });

  console.log(`[ChangeRequest] Rejected ${id} by ${reviewerEmail} — reason: ${reason}`);
  return updated;
}

// ─── Execute Change (called on approval) ───
async function executeChange(entry: ChangeRequest, approverEmail: string): Promise<void> {
  const { type, changeData } = entry;

  switch (type) {
    case 'incentive_slab': {
      const action = changeData.action as string;
      if (action === 'update' && changeData.id) {
        await updateSlab(
          changeData.id as number,
          changeData.updates as Record<string, unknown>,
          approverEmail
        );
      } else if (action === 'insert') {
        await insertSlab(changeData.slab as Parameters<typeof insertSlab>[0], approverEmail);
      } else if (action === 'delete' && changeData.id) {
        await deleteSlab(changeData.id as number, approverEmail);
      }
      console.log(`[ChangeRequest] Executed incentive_slab ${action}`);
      break;
    }

    case 'product_rule': {
      const action = changeData.action as string;
      if (action === 'update' && changeData.id) {
        await updateProduct(
          changeData.id as number,
          changeData.updates as Record<string, unknown>,
          approverEmail
        );
      } else if (action === 'insert') {
        await insertProduct(changeData.product as Parameters<typeof insertProduct>[0], approverEmail);
      } else if (action === 'delete' && changeData.id) {
        await deleteProduct(changeData.id as number, approverEmail);
      }
      console.log(`[ChangeRequest] Executed product_rule ${action}`);
      break;
    }

    case 'employee_add': {
      // Employee add is handled via a different flow — the data is in changeData.employee
      // For now, log that it would be inserted
      console.log(`[ChangeRequest] Employee add approved — data:`, changeData.employee);
      // Note: insertEmployee not yet in DAL — extend when needed
      break;
    }

    case 'employee_edit': {
      if (changeData.id) {
        await updateEmployee(
          changeData.id as number,
          changeData.updates as Record<string, unknown>,
          approverEmail
        );
      }
      console.log(`[ChangeRequest] Executed employee_edit for id=${changeData.id}`);
      break;
    }

    case 'employee_delete': {
      if (changeData.id) {
        await updateEmployee(
          changeData.id as number,
          { isActive: false },
          approverEmail
        );
      }
      console.log(`[ChangeRequest] Executed employee_delete (soft) for id=${changeData.id}`);
      break;
    }

    default:
      console.warn(`[ChangeRequest] Unknown type: ${type}`);
  }
}
