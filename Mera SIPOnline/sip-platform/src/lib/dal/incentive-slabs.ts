// ─── Incentive Slabs DAL ───
// Abstracts incentive slab data access — works with local data or Supabase

import { isLocal } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { IncentiveSlab, SlabTable, DST_SLABS, POSP_RM_SLABS } from '@/lib/mis/types';
import { writeAuditLog } from './audit';

export interface IncentiveSlabRow {
  id: number;
  slabTableName: SlabTable;
  achievementMin: number;
  achievementMax: number | null;
  incentiveRate: number;
  slabLabel: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: string;
}

// ─── Map Supabase DB row to IncentiveSlabRow ───
function mapRow(row: Record<string, unknown>): IncentiveSlabRow {
  return {
    id: row.id as number,
    slabTableName: row.slab_table_name as SlabTable,
    achievementMin: Number(row.achievement_min) || 0,
    achievementMax: row.achievement_max != null ? Number(row.achievement_max) : null,
    incentiveRate: Number(row.incentive_rate) || 0,
    slabLabel: (row.slab_label as string) || '',
    effectiveFrom: (row.effective_from as string) || new Date().toISOString().split('T')[0],
    effectiveTo: (row.effective_to as string) || null,
    version: (row.version as string) || 'v1.0',
  };
}

// ─── Convert local IncentiveSlab to IncentiveSlabRow (with synthetic id) ───
function localSlabToRow(slab: IncentiveSlab, index: number): IncentiveSlabRow {
  return {
    id: index + 1,
    slabTableName: slab.slabTableName,
    achievementMin: slab.achievementMin,
    achievementMax: slab.achievementMax,
    incentiveRate: slab.incentiveRate,
    slabLabel: slab.slabLabel,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: null,
    version: 'v1.0',
  };
}

// ─── Get All Incentive Slabs ───
export async function getIncentiveSlabs(
  tableName?: SlabTable
): Promise<IncentiveSlabRow[]> {
  if (isLocal) {
    console.log('[IncentiveSlabs] Using local data');
    const allSlabs = [...DST_SLABS, ...POSP_RM_SLABS];
    let result = allSlabs.map((s, i) => localSlabToRow(s, i));
    if (tableName) {
      result = result.filter((s) => s.slabTableName === tableName);
    }
    return result;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('incentive_slabs').select('*');
  if (tableName) query = query.eq('slab_table_name', tableName);

  const { data, error } = await query.order('slab_table_name').order('achievement_min');
  if (error) throw new Error(`Supabase incentive_slabs query failed: ${error.message}`);

  console.log(`[IncentiveSlabs] Fetched ${(data || []).length} slabs from Supabase`);
  return (data || []).map(mapRow);
}

// ─── Get Single Slab by ID ───
export async function getSlabById(id: number): Promise<IncentiveSlabRow | null> {
  if (isLocal) {
    const allSlabs = [...DST_SLABS, ...POSP_RM_SLABS];
    const rows = allSlabs.map((s, i) => localSlabToRow(s, i));
    return rows.find((r) => r.id === id) || null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from('incentive_slabs').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data);
}

// ─── Update Slab ───
export async function updateSlab(
  id: number,
  updates: Partial<IncentiveSlabRow>,
  changedBy: string
): Promise<IncentiveSlabRow | null> {
  if (isLocal) {
    console.log('[IncentiveSlabs] Local mode — no mutation (read-only seed data)');
    return getSlabById(id);
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Map camelCase to snake_case for Supabase
  const dbUpdates: Record<string, unknown> = {};
  if (updates.slabTableName !== undefined) dbUpdates.slab_table_name = updates.slabTableName;
  if (updates.achievementMin !== undefined) dbUpdates.achievement_min = updates.achievementMin;
  if (updates.achievementMax !== undefined) dbUpdates.achievement_max = updates.achievementMax;
  if (updates.incentiveRate !== undefined) dbUpdates.incentive_rate = updates.incentiveRate;
  if (updates.slabLabel !== undefined) dbUpdates.slab_label = updates.slabLabel;
  if (updates.effectiveFrom !== undefined) dbUpdates.effective_from = updates.effectiveFrom;
  if (updates.effectiveTo !== undefined) dbUpdates.effective_to = updates.effectiveTo;
  if (updates.version !== undefined) dbUpdates.version = updates.version;

  // Fetch old data for audit
  const { data: oldData } = await sb.from('incentive_slabs').select('*').eq('id', id).single();

  const { data, error } = await sb
    .from('incentive_slabs')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Incentive slab update failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'incentive_slabs',
    recordId: id,
    action: 'UPDATE',
    changedBy,
    oldValues: oldData || undefined,
    newValues: dbUpdates,
  });

  console.log(`[IncentiveSlabs] Updated slab ${id} by ${changedBy}`);
  return data ? mapRow(data) : null;
}

// ─── Insert New Slab ───
export async function insertSlab(
  data: Omit<IncentiveSlabRow, 'id'>,
  changedBy: string
): Promise<IncentiveSlabRow | null> {
  if (isLocal) {
    console.log('[IncentiveSlabs] Local mode — cannot insert (read-only seed data)');
    return null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const dbRow = {
    slab_table_name: data.slabTableName,
    achievement_min: data.achievementMin,
    achievement_max: data.achievementMax,
    incentive_rate: data.incentiveRate,
    slab_label: data.slabLabel,
    effective_from: data.effectiveFrom,
    effective_to: data.effectiveTo,
    version: data.version,
  };

  const { data: inserted, error } = await sb
    .from('incentive_slabs')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(`Incentive slab insert failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'incentive_slabs',
    recordId: inserted?.id,
    action: 'INSERT',
    changedBy,
    newValues: dbRow,
  });

  console.log(`[IncentiveSlabs] Inserted new slab by ${changedBy}`);
  return inserted ? mapRow(inserted) : null;
}

// ─── Delete Slab ───
export async function deleteSlab(
  id: number,
  changedBy: string
): Promise<boolean> {
  if (isLocal) {
    console.log('[IncentiveSlabs] Local mode — cannot delete (read-only seed data)');
    return false;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  // Fetch old data for audit
  const { data: oldData } = await sb.from('incentive_slabs').select('*').eq('id', id).single();

  const { error } = await sb.from('incentive_slabs').delete().eq('id', id);
  if (error) throw new Error(`Incentive slab delete failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'incentive_slabs',
    recordId: id,
    action: 'DELETE',
    changedBy,
    oldValues: oldData || undefined,
  });

  console.log(`[IncentiveSlabs] Deleted slab ${id} by ${changedBy}`);
  return true;
}
