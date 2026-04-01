// ─── Audit Log DAL ───
// Every data mutation writes here for SEBI/IRDAI compliance

import { isLocal } from '@/lib/db/config';

export interface AuditEntry {
  id?: number;
  tableName: string;
  recordId?: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT' | 'FREEZE';
  changedBy: string;
  changedAt?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
}

// In-memory audit log for local mode
const localAuditLog: AuditEntry[] = [];

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const enriched = {
    ...entry,
    changedAt: new Date().toISOString(),
  };

  if (isLocal) {
    localAuditLog.push({ ...enriched, id: localAuditLog.length + 1 });
    return;
  }

  // TODO: Supabase insert
  // const { error } = await supabaseAdmin.from('audit_log').insert({...});
}

export async function getAuditLog(filters?: {
  tableName?: string;
  action?: string;
  changedBy?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  if (isLocal) {
    let result = [...localAuditLog];
    if (filters?.tableName) result = result.filter(e => e.tableName === filters.tableName);
    if (filters?.action) result = result.filter(e => e.action === filters.action);
    if (filters?.changedBy) result = result.filter(e => e.changedBy === filters.changedBy);
    return result.reverse().slice(0, filters?.limit || 100);
  }

  // TODO: Supabase query
  return [];
}
