// ─── Audit Log DAL ───
// Every data mutation writes here for SEBI/IRDAI compliance

import { isLocal } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';

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

// ─── Map Supabase row to AuditEntry ───
function mapRow(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as number,
    tableName: row.table_name as string,
    recordId: row.record_id as number | undefined,
    action: row.action as AuditEntry['action'],
    changedBy: row.changed_by as string,
    changedAt: row.changed_at as string,
    oldValues: row.old_values as Record<string, unknown> | undefined,
    newValues: row.new_values as Record<string, unknown> | undefined,
    reason: row.reason as string | undefined,
  };
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const enriched = {
    ...entry,
    changedAt: new Date().toISOString(),
  };

  if (isLocal) {
    localAuditLog.push({ ...enriched, id: localAuditLog.length + 1 });
    return;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) return; // Silently skip if Supabase not configured (audit should never block)

  try {
    await sb.from('audit_log').insert({
      table_name: enriched.tableName,
      record_id: enriched.recordId || null,
      action: enriched.action,
      changed_by: enriched.changedBy,
      changed_at: enriched.changedAt,
      old_values: enriched.oldValues ? JSON.stringify(enriched.oldValues) : null,
      new_values: enriched.newValues ? JSON.stringify(enriched.newValues) : null,
      reason: enriched.reason || null,
    });
  } catch {
    // Audit write failure should never crash the main operation
    console.error('[Audit] Failed to write audit log entry');
  }
}

export async function getAuditLog(filters?: {
  tableName?: string;
  action?: string;
  changedBy?: string;
  recordId?: number;
  limit?: number;
}): Promise<AuditEntry[]> {
  if (isLocal) {
    let result = [...localAuditLog];
    if (filters?.tableName) result = result.filter(e => e.tableName === filters.tableName);
    if (filters?.action) result = result.filter(e => e.action === filters.action);
    if (filters?.changedBy) result = result.filter(e => e.changedBy === filters.changedBy);
    return result.reverse().slice(0, filters?.limit || 100);
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  let query = sb.from('audit_log').select('*');
  if (filters?.tableName) query = query.eq('table_name', filters.tableName);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.changedBy) query = query.eq('changed_by', filters.changedBy);
  if (filters?.recordId) query = query.eq('record_id', filters.recordId);

  const { data, error } = await query
    .order('changed_at', { ascending: false })
    .limit(filters?.limit || 100);

  if (error) {
    console.error('[Audit] Query failed:', error.message);
    return [];
  }

  return (data || []).map(mapRow);
}
