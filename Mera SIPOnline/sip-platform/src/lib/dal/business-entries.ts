// ─── Business Entries DAL ───
// Core operational module — RMs log daily business here

import { isLocal, getCurrentMonth } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { MonthlyBusinessEntry } from '@/lib/mis/types';
import { SEED_BUSINESS_ENTRIES } from '@/lib/mis/seed-business-entries';
import { PRODUCTS, getTierMultiplier } from '@/lib/mis/employee-data';
import { calculateWeightedBusiness } from '@/lib/mis/incentive-engine';
import { writeAuditLog } from './audit';

// ─── In-memory store for local mode ───
let localEntries = [...SEED_BUSINESS_ENTRIES];
let localNextId = localEntries.length + 1;

export interface BusinessEntryInput {
  employeeId: number;
  month: string;
  productId: number;
  channelId?: number;
  rawAmount: number;
  channelPayoutPct?: number;
  isFpRoute?: boolean;
  policyNumber?: string;
  clientName?: string;
  clientPan?: string;
  insurer?: string;
}

export interface BusinessEntryFilters {
  employeeId?: number;
  month?: string;
  productId?: number;
  status?: string;
}

// ─── Map Supabase row to MonthlyBusinessEntry ───
function mapRow(row: Record<string, unknown>): MonthlyBusinessEntry {
  return {
    id: row.id as number,
    employeeId: row.employee_id as number,
    month: row.month as string,
    productId: row.product_id as number,
    channelId: row.channel_id as number | undefined,
    rawAmount: Number(row.raw_amount) || 0,
    productCreditPct: Number(row.product_credit_pct) || 0,
    channelPayoutPct: Number(row.channel_payout_pct) || 0,
    companyMarginPct: Number(row.company_margin_pct) || 100,
    marginCreditFactor: row.channel_payout_pct ? (100 - Number(row.channel_payout_pct)) / 100 : 1,
    tierMultiplier: Number(row.tier_multiplier) || 100,
    weightedAmount: Number(row.weighted_amount) || 0,
    isFpRoute: row.is_fp_route as boolean || false,
    policyNumber: row.policy_number as string | undefined,
    clientName: row.client_name as string | undefined,
    insurer: row.insurer as string | undefined,
  };
}

/**
 * Get business entries with filters
 */
export async function getBusinessEntries(
  filters?: BusinessEntryFilters
): Promise<MonthlyBusinessEntry[]> {
  if (isLocal) {
    let result = [...localEntries];
    if (filters?.employeeId) result = result.filter(e => e.employeeId === filters.employeeId);
    if (filters?.month) result = result.filter(e => e.month === filters.month);
    if (filters?.productId) result = result.filter(e => e.productId === filters.productId);
    return result;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('business_entries').select('*');
  if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters?.month) query = query.eq('month', filters.month);
  if (filters?.productId) query = query.eq('product_id', filters.productId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Business entries query failed: ${error.message}`);
  return (data || []).map(mapRow);
}

/**
 * Get entries for a specific employee's current month
 */
export async function getMyMonthEntries(
  employeeId: number,
  month?: string
): Promise<MonthlyBusinessEntry[]> {
  return getBusinessEntries({
    employeeId,
    month: month || getCurrentMonth(),
  });
}

/**
 * Create a new business entry with computed weighted amount
 */
export async function createBusinessEntry(
  input: BusinessEntryInput,
  createdBy: string
): Promise<MonthlyBusinessEntry> {
  // Look up product for credit rules
  const product = PRODUCTS.find(p => p.id === input.productId);
  if (!product) throw new Error(`Product not found: ${input.productId}`);

  const channelPayoutPct = input.channelPayoutPct || 0;
  const tierMultiplier = getTierMultiplier(product.tier);
  const productCreditPct = product.creditPct;

  // Calculate weighted amount using the incentive engine
  const weightedAmount = calculateWeightedBusiness({
    rawAmount: input.rawAmount,
    productCreditPct,
    channelPayoutPct,
    tierMultiplier,
    isFpRoute: input.isFpRoute || false,
  });

  if (isLocal) {
    const entry: MonthlyBusinessEntry = {
      id: localNextId++,
      employeeId: input.employeeId,
      month: input.month || getCurrentMonth(),
      productId: input.productId,
      channelId: input.channelId,
      rawAmount: input.rawAmount,
      productCreditPct,
      channelPayoutPct,
      companyMarginPct: 100 - channelPayoutPct,
      marginCreditFactor: channelPayoutPct > 0 ? (100 - channelPayoutPct) / 100 : 1,
      tierMultiplier,
      weightedAmount,
      isFpRoute: input.isFpRoute || false,
      policyNumber: input.policyNumber,
      clientName: input.clientName,
      insurer: input.insurer,
    };
    localEntries.push(entry);

    await writeAuditLog({
      tableName: 'business_entries',
      recordId: entry.id,
      action: 'INSERT',
      changedBy: createdBy,
      newValues: { rawAmount: input.rawAmount, weightedAmount, productId: input.productId },
    });

    return entry;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  const { data, error } = await sb
    .from('business_entries')
    .insert({
      employee_id: input.employeeId,
      month: input.month || getCurrentMonth(),
      product_id: input.productId,
      channel_id: input.channelId || null,
      raw_amount: input.rawAmount,
      product_credit_pct: productCreditPct,
      channel_payout_pct: channelPayoutPct,
      company_margin_pct: 100 - channelPayoutPct,
      tier_multiplier: tierMultiplier,
      weighted_amount: weightedAmount,
      is_fp_route: input.isFpRoute || false,
      policy_number: input.policyNumber || null,
      client_name: input.clientName || null,
      client_pan: input.clientPan || null,
      insurer: input.insurer || null,
      status: 'draft',
      created_by: input.employeeId,
    })
    .select()
    .single();

  if (error) throw new Error(`Business entry insert failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'business_entries',
    recordId: data.id,
    action: 'INSERT',
    changedBy: createdBy,
    newValues: {
      rawAmount: input.rawAmount,
      weightedAmount,
      productId: input.productId,
      clientName: input.clientName,
    },
  });

  return mapRow(data);
}

/**
 * Update a draft business entry
 */
export async function updateBusinessEntry(
  id: number,
  updates: Partial<BusinessEntryInput>,
  updatedBy: string
): Promise<MonthlyBusinessEntry | null> {
  if (isLocal) {
    const idx = localEntries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const old = localEntries[idx];

    if (updates.rawAmount !== undefined || updates.productId !== undefined) {
      const productId = updates.productId || old.productId;
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) throw new Error(`Product not found: ${productId}`);

      const rawAmount = updates.rawAmount ?? old.rawAmount;
      const channelPayoutPct = updates.channelPayoutPct ?? old.channelPayoutPct;
      const tierMultiplier = getTierMultiplier(product.tier);
      const isFpRoute = updates.isFpRoute ?? old.isFpRoute;

      const weightedAmount = calculateWeightedBusiness({
        rawAmount,
        productCreditPct: product.creditPct,
        channelPayoutPct,
        tierMultiplier,
        isFpRoute,
      });

      localEntries[idx] = {
        ...old,
        ...updates,
        rawAmount,
        productCreditPct: product.creditPct,
        channelPayoutPct,
        tierMultiplier,
        weightedAmount,
        isFpRoute,
      } as MonthlyBusinessEntry;
    } else {
      localEntries[idx] = { ...old, ...updates } as MonthlyBusinessEntry;
    }

    await writeAuditLog({
      tableName: 'business_entries',
      recordId: id,
      action: 'UPDATE',
      changedBy: updatedBy,
      oldValues: { rawAmount: old.rawAmount },
      newValues: { rawAmount: localEntries[idx].rawAmount },
    });

    return localEntries[idx];
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Get current entry
  const { data: oldData } = await sb.from('business_entries').select('*').eq('id', id).single();
  if (!oldData) return null;

  // Recalculate if needed
  const dbUpdates: Record<string, unknown> = {};

  if (updates.rawAmount !== undefined || updates.productId !== undefined) {
    const productId = updates.productId || oldData.product_id;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    const rawAmount = updates.rawAmount ?? Number(oldData.raw_amount);
    const channelPayoutPct = updates.channelPayoutPct ?? Number(oldData.channel_payout_pct);
    const tierMultiplier = getTierMultiplier(product.tier);
    const isFpRoute = updates.isFpRoute ?? oldData.is_fp_route;

    const weightedAmount = calculateWeightedBusiness({
      rawAmount,
      productCreditPct: product.creditPct,
      channelPayoutPct,
      tierMultiplier,
      isFpRoute,
    });

    dbUpdates.raw_amount = rawAmount;
    dbUpdates.product_id = productId;
    dbUpdates.product_credit_pct = product.creditPct;
    dbUpdates.channel_payout_pct = channelPayoutPct;
    dbUpdates.company_margin_pct = 100 - channelPayoutPct;
    dbUpdates.tier_multiplier = tierMultiplier;
    dbUpdates.weighted_amount = weightedAmount;
    dbUpdates.is_fp_route = isFpRoute;
  }

  if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
  if (updates.policyNumber !== undefined) dbUpdates.policy_number = updates.policyNumber;
  if (updates.insurer !== undefined) dbUpdates.insurer = updates.insurer;

  const { data, error } = await sb
    .from('business_entries')
    .update(dbUpdates)
    .eq('id', id)
    .eq('status', 'draft') // Can only edit drafts
    .select()
    .single();

  if (error) throw new Error(`Business entry update failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'business_entries',
    recordId: id,
    action: 'UPDATE',
    changedBy: updatedBy,
    oldValues: { raw_amount: oldData.raw_amount },
    newValues: dbUpdates,
  });

  return data ? mapRow(data) : null;
}

/**
 * Delete a business entry (draft only)
 */
export async function deleteBusinessEntry(id: number, deletedBy: string): Promise<boolean> {
  if (isLocal) {
    const idx = localEntries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const old = localEntries[idx];
    localEntries.splice(idx, 1);

    await writeAuditLog({
      tableName: 'business_entries',
      recordId: id,
      action: 'DELETE',
      changedBy: deletedBy,
      oldValues: { rawAmount: old.rawAmount, clientName: old.clientName },
    });
    return true;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const { data: oldData } = await sb.from('business_entries').select('*').eq('id', id).single();

  const { error } = await sb
    .from('business_entries')
    .delete()
    .eq('id', id)
    .eq('status', 'draft'); // Can only delete drafts

  if (error) return false;

  await writeAuditLog({
    tableName: 'business_entries',
    recordId: id,
    action: 'DELETE',
    changedBy: deletedBy,
    oldValues: oldData ? { raw_amount: oldData.raw_amount, client_name: oldData.client_name } : undefined,
  });

  return true;
}

/**
 * Submit entries for approval (change draft → submitted)
 */
export async function submitMonthEntries(
  employeeId: number,
  month: string,
  submittedBy: string
): Promise<number> {
  if (isLocal) return 0; // No-op in local mode

  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const { data, error } = await sb
    .from('business_entries')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .eq('month', month)
    .eq('status', 'draft')
    .select();

  if (error) throw new Error(`Submit failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'business_entries',
    action: 'UPDATE',
    changedBy: submittedBy,
    newValues: { action: 'bulk_submit', employeeId, month, count: data?.length },
  });

  return data?.length || 0;
}

/**
 * Approve a submitted entry (admin only)
 */
export async function approveBusinessEntry(
  id: number,
  approvedBy: string,
  approverEmployeeId: number
): Promise<boolean> {
  if (isLocal) return true; // No-op in local mode

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const { error } = await sb
    .from('business_entries')
    .update({
      status: 'approved',
      approved_by: approverEmployeeId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'submitted');

  if (error) return false;

  await writeAuditLog({
    tableName: 'business_entries',
    recordId: id,
    action: 'APPROVE',
    changedBy: approvedBy,
  });

  return true;
}

/**
 * Get monthly summary for an employee
 */
export async function getMonthlyBusinessSummary(
  employeeId: number,
  month?: string
): Promise<{
  totalRawBusiness: number;
  totalWeightedBusiness: number;
  entryCount: number;
  byProduct: { productId: number; rawAmount: number; weightedAmount: number }[];
}> {
  const entries = await getMyMonthEntries(employeeId, month);

  const byProduct = new Map<number, { rawAmount: number; weightedAmount: number }>();
  let totalRaw = 0;
  let totalWeighted = 0;

  for (const e of entries) {
    totalRaw += e.rawAmount;
    totalWeighted += e.weightedAmount;

    const existing = byProduct.get(e.productId) || { rawAmount: 0, weightedAmount: 0 };
    byProduct.set(e.productId, {
      rawAmount: existing.rawAmount + e.rawAmount,
      weightedAmount: existing.weightedAmount + e.weightedAmount,
    });
  }

  return {
    totalRawBusiness: Math.round(totalRaw),
    totalWeightedBusiness: Math.round(totalWeighted * 100) / 100,
    entryCount: entries.length,
    byProduct: Array.from(byProduct.entries()).map(([productId, data]) => ({
      productId,
      ...data,
    })),
  };
}

/**
 * Get all employees' monthly summaries (admin view)
 */
export async function getCompanyBusinessSummary(month?: string) {
  const m = month || getCurrentMonth();
  const entries = await getBusinessEntries({ month: m });

  const byEmployee = new Map<number, { rawBusiness: number; weightedBusiness: number; count: number }>();

  for (const e of entries) {
    const existing = byEmployee.get(e.employeeId) || { rawBusiness: 0, weightedBusiness: 0, count: 0 };
    byEmployee.set(e.employeeId, {
      rawBusiness: existing.rawBusiness + e.rawAmount,
      weightedBusiness: existing.weightedBusiness + e.weightedAmount,
      count: existing.count + 1,
    });
  }

  return Array.from(byEmployee.entries()).map(([employeeId, data]) => ({
    employeeId,
    ...data,
  }));
}
