// ─── Business Entries DAL ───
// Core operational module — RMs log daily business here

import { isLocal, getCurrentMonth } from '@/lib/db/config';
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
  return [];
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

  const entry: MonthlyBusinessEntry = {
    id: 0, // will be set
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

  if (isLocal) {
    entry.id = localNextId++;
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

  // TODO: Supabase insert
  throw new Error('Supabase not configured');
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

    // Recalculate if amount or product changed
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
  return null;
}

/**
 * Delete a business entry
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
  return false;
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
