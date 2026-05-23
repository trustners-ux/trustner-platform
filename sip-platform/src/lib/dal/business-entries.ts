// ─── Business Entries DAL ───
// Core operational module — RMs log daily business here

import { isLocal, getCurrentMonth } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { MonthlyBusinessEntry } from '@/lib/mis/types';
import { SEED_BUSINESS_ENTRIES } from '@/lib/mis/seed-business-entries';
import { PRODUCTS, EMPLOYEES, getTierMultiplier } from '@/lib/mis/employee-data';
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
  policyNumber?: string;
  clientName?: string;
  clientPan?: string;
  insurer?: string;
  transactionDate?: string;
  isCrossSale?: boolean;
  isBusinessLoss?: boolean;
  lossReason?: string;
}

export interface BusinessEntryFilters {
  employeeId?: number;
  month?: string;
  productId?: number;
  // NEW filters:
  startDate?: string;       // YYYY-MM-DD — filter by transactionDate
  endDate?: string;          // YYYY-MM-DD — filter by transactionDate (max 60 days from startDate)
  status?: string;           // 'draft' | 'submitted' | 'approved' | 'rejected' | 'error' | 'all'
  minAmount?: number;        // Premium range min
  maxAmount?: number;        // Premium range max
  productCategory?: string;  // 'Life' | 'Health' | 'GI Motor' | 'GI Non-Motor' | 'MF'
  isCrossSale?: boolean;
  isBusinessLoss?: boolean;
  entityFilter?: string;     // 'TAS' | 'TIB' — filter by employee entity
}

export interface BusinessAnalytics {
  totalRawBusiness: number;
  totalWeightedBusiness: number;
  entryCount: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, { raw: number; weighted: number; count: number }>;
  crossSaleCount: number;
  crossSaleValue: number;
  businessLossCount: number;
  businessLossValue: number;
  pendingCount: number;
  rejectedCount: number;
  errorCount: number;
  premiumRangeBreakdown: {
    range: string;
    count: number;
    rawTotal: number;
  }[];
  topEmployees: { employeeId: number; name: string; weightedBusiness: number }[];
  topProducts: { productId: number; productName: string; weightedBusiness: number; count: number }[];
  dailyTrend: { date: string; rawBusiness: number; entryCount: number }[];
}

// ─── Helper: get product category for a productId ───
function getProductCategory(productId: number): string | undefined {
  return PRODUCTS.find(p => p.id === productId)?.productCategory;
}

// ─── Helper: get employee entity for an employeeId ───
function getEmployeeEntity(employeeId: number): string | undefined {
  return EMPLOYEES.find(e => e.id === employeeId)?.entity;
}

// ─── Helper: get employee name for an employeeId ───
function getEmployeeName(employeeId: number): string {
  return EMPLOYEES.find(e => e.id === employeeId)?.name || `Employee ${employeeId}`;
}

// ─── Helper: get product name for a productId ───
function getProductName(productId: number): string {
  return PRODUCTS.find(p => p.id === productId)?.productName || `Product ${productId}`;
}

// ─── Helper: classify premium into range bucket ───
function getPremiumRange(amount: number): string {
  if (amount <= 10000) return '0-10K';
  if (amount <= 50000) return '10K-50K';
  if (amount <= 100000) return '50K-1L';
  if (amount <= 500000) return '1L-5L';
  return '5L+';
}

// ─── Helper: apply filters to a list of entries (used by local mode) ───
function applyLocalFilters(
  entries: MonthlyBusinessEntry[],
  filters?: BusinessEntryFilters
): MonthlyBusinessEntry[] {
  if (!filters) return entries;
  let result = [...entries];

  if (filters.employeeId) result = result.filter(e => e.employeeId === filters.employeeId);
  if (filters.month) result = result.filter(e => e.month === filters.month);
  if (filters.productId) result = result.filter(e => e.productId === filters.productId);

  // Status filter
  if (filters.status && filters.status !== 'all') {
    result = result.filter(e => (e.status || 'draft') === filters.status);
  }

  // Date range filter (by transactionDate)
  if (filters.startDate) {
    result = result.filter(e => {
      const txDate = e.transactionDate;
      return txDate ? txDate >= filters.startDate! : false;
    });
  }
  if (filters.endDate) {
    result = result.filter(e => {
      const txDate = e.transactionDate;
      return txDate ? txDate <= filters.endDate! : false;
    });
  }

  // Premium range filter
  if (filters.minAmount !== undefined) {
    result = result.filter(e => e.rawAmount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    result = result.filter(e => e.rawAmount <= filters.maxAmount!);
  }

  // Product category filter
  if (filters.productCategory) {
    result = result.filter(e => getProductCategory(e.productId) === filters.productCategory);
  }

  // Cross-sale filter
  if (filters.isCrossSale !== undefined) {
    result = result.filter(e => !!e.isCrossSale === filters.isCrossSale);
  }

  // Business loss filter
  if (filters.isBusinessLoss !== undefined) {
    result = result.filter(e => !!e.isBusinessLoss === filters.isBusinessLoss);
  }

  // Entity filter (employee entity)
  if (filters.entityFilter) {
    result = result.filter(e => getEmployeeEntity(e.employeeId) === filters.entityFilter);
  }

  return result;
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
    tierMultiplier: Number(row.tier_multiplier) || 100,
    weightedAmount: Number(row.weighted_amount) || 0,
    policyNumber: row.policy_number as string | undefined,
    clientName: row.client_name as string | undefined,
    insurer: row.insurer as string | undefined,
    status: (row.status as MonthlyBusinessEntry['status']) || 'draft',
    rejectionReason: row.rejection_reason as string | undefined,
    isCrossSale: row.is_cross_sale as boolean | undefined,
    isBusinessLoss: row.is_business_loss as boolean | undefined,
    lossReason: row.loss_reason as string | undefined,
    transactionDate: row.transaction_date as string | undefined,
    errorMessage: row.error_message as string | undefined,
  };
}

/**
 * Get business entries with filters
 */
export async function getBusinessEntries(
  filters?: BusinessEntryFilters
): Promise<MonthlyBusinessEntry[]> {
  if (isLocal) {
    return applyLocalFilters(localEntries, filters);
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('business_entries').select('*');
  if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters?.month) query = query.eq('month', filters.month);
  if (filters?.productId) query = query.eq('product_id', filters.productId);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.startDate) query = query.gte('transaction_date', filters.startDate);
  if (filters?.endDate) query = query.lte('transaction_date', filters.endDate);
  if (filters?.minAmount !== undefined) query = query.gte('raw_amount', filters.minAmount);
  if (filters?.maxAmount !== undefined) query = query.lte('raw_amount', filters.maxAmount);
  if (filters?.isCrossSale !== undefined) query = query.eq('is_cross_sale', filters.isCrossSale);
  if (filters?.isBusinessLoss !== undefined) query = query.eq('is_business_loss', filters.isBusinessLoss);

  // productCategory and entityFilter require joins or post-filter — we post-filter for simplicity
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Business entries query failed: ${error.message}`);

  let entries = (data || []).map(mapRow);

  // Post-filter for product category (needs product lookup)
  if (filters?.productCategory) {
    entries = entries.filter(e => getProductCategory(e.productId) === filters.productCategory);
  }

  // Post-filter for entity (needs employee lookup)
  if (filters?.entityFilter) {
    entries = entries.filter(e => getEmployeeEntity(e.employeeId) === filters.entityFilter);
  }

  return entries;
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
 * Compute analytics summary from entries matching filters
 */
export async function getBusinessAnalytics(
  filters?: BusinessEntryFilters
): Promise<BusinessAnalytics> {
  const entries = await getBusinessEntries(filters);

  let totalRaw = 0;
  let totalWeighted = 0;
  let crossSaleCount = 0;
  let crossSaleValue = 0;
  let businessLossCount = 0;
  let businessLossValue = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let errorCount = 0;

  const statusBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, { raw: number; weighted: number; count: number }> = {};
  const premiumBuckets: Record<string, { count: number; rawTotal: number }> = {};
  const employeeAgg: Record<number, number> = {};
  const productAgg: Record<number, { weighted: number; count: number }> = {};
  const dailyAgg: Record<string, { raw: number; count: number }> = {};

  for (const e of entries) {
    totalRaw += e.rawAmount;
    totalWeighted += e.weightedAmount;

    // Status breakdown
    const status = e.status || 'draft';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    if (status === 'submitted' || status === 'draft') pendingCount++;
    if (status === 'rejected') rejectedCount++;
    if (status === 'error') errorCount++;

    // Category breakdown
    const cat = getProductCategory(e.productId) || 'Unknown';
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { raw: 0, weighted: 0, count: 0 };
    categoryBreakdown[cat].raw += e.rawAmount;
    categoryBreakdown[cat].weighted += e.weightedAmount;
    categoryBreakdown[cat].count += 1;

    // Cross-sale
    if (e.isCrossSale) {
      crossSaleCount++;
      crossSaleValue += e.rawAmount;
    }

    // Business loss
    if (e.isBusinessLoss) {
      businessLossCount++;
      businessLossValue += e.rawAmount;
    }

    // Premium range
    const range = getPremiumRange(e.rawAmount);
    if (!premiumBuckets[range]) premiumBuckets[range] = { count: 0, rawTotal: 0 };
    premiumBuckets[range].count += 1;
    premiumBuckets[range].rawTotal += e.rawAmount;

    // Top employees
    employeeAgg[e.employeeId] = (employeeAgg[e.employeeId] || 0) + e.weightedAmount;

    // Top products
    if (!productAgg[e.productId]) productAgg[e.productId] = { weighted: 0, count: 0 };
    productAgg[e.productId].weighted += e.weightedAmount;
    productAgg[e.productId].count += 1;

    // Daily trend
    const date = e.transactionDate || e.month + '-01';
    if (!dailyAgg[date]) dailyAgg[date] = { raw: 0, count: 0 };
    dailyAgg[date].raw += e.rawAmount;
    dailyAgg[date].count += 1;
  }

  // Build premium range array in order
  const rangeOrder = ['0-10K', '10K-50K', '50K-1L', '1L-5L', '5L+'];
  const premiumRangeBreakdown = rangeOrder
    .filter(r => premiumBuckets[r])
    .map(r => ({ range: r, count: premiumBuckets[r].count, rawTotal: premiumBuckets[r].rawTotal }));

  // Top employees (sorted desc, top 10)
  const topEmployees = Object.entries(employeeAgg)
    .map(([id, weighted]) => ({
      employeeId: Number(id),
      name: getEmployeeName(Number(id)),
      weightedBusiness: Math.round(weighted * 100) / 100,
    }))
    .sort((a, b) => b.weightedBusiness - a.weightedBusiness)
    .slice(0, 10);

  // Top products (sorted desc, top 10)
  const topProducts = Object.entries(productAgg)
    .map(([id, data]) => ({
      productId: Number(id),
      productName: getProductName(Number(id)),
      weightedBusiness: Math.round(data.weighted * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.weightedBusiness - a.weightedBusiness)
    .slice(0, 10);

  // Daily trend (sorted by date)
  const dailyTrend = Object.entries(dailyAgg)
    .map(([date, data]) => ({
      date,
      rawBusiness: Math.round(data.raw),
      entryCount: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRawBusiness: Math.round(totalRaw),
    totalWeightedBusiness: Math.round(totalWeighted * 100) / 100,
    entryCount: entries.length,
    statusBreakdown,
    categoryBreakdown,
    crossSaleCount,
    crossSaleValue: Math.round(crossSaleValue),
    businessLossCount,
    businessLossValue: Math.round(businessLossValue),
    pendingCount,
    rejectedCount,
    errorCount,
    premiumRangeBreakdown,
    topEmployees,
    topProducts,
    dailyTrend,
  };
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
  });

  // Default transactionDate to today if not provided
  const transactionDate = input.transactionDate || new Date().toISOString().split('T')[0];

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
      tierMultiplier,
      weightedAmount,
      policyNumber: input.policyNumber,
      clientName: input.clientName,
      insurer: input.insurer,
      status: 'draft',
      transactionDate,
      isCrossSale: input.isCrossSale,
      isBusinessLoss: input.isBusinessLoss,
      lossReason: input.lossReason,
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
      policy_number: input.policyNumber || null,
      client_name: input.clientName || null,
      client_pan: input.clientPan || null,
      insurer: input.insurer || null,
      status: 'draft',
      transaction_date: transactionDate,
      is_cross_sale: input.isCrossSale || false,
      is_business_loss: input.isBusinessLoss || false,
      loss_reason: input.lossReason || null,
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

      const weightedAmount = calculateWeightedBusiness({
        rawAmount,
        productCreditPct: product.creditPct,
        channelPayoutPct,
        tierMultiplier,
      });

      localEntries[idx] = {
        ...old,
        ...updates,
        rawAmount,
        productCreditPct: product.creditPct,
        channelPayoutPct,
        tierMultiplier,
        weightedAmount,
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

    const weightedAmount = calculateWeightedBusiness({
      rawAmount,
      productCreditPct: product.creditPct,
      channelPayoutPct,
      tierMultiplier,
    });

    dbUpdates.raw_amount = rawAmount;
    dbUpdates.product_id = productId;
    dbUpdates.product_credit_pct = product.creditPct;
    dbUpdates.channel_payout_pct = channelPayoutPct;
    dbUpdates.company_margin_pct = 100 - channelPayoutPct;
    dbUpdates.tier_multiplier = tierMultiplier;
    dbUpdates.weighted_amount = weightedAmount;
  }

  if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
  if (updates.policyNumber !== undefined) dbUpdates.policy_number = updates.policyNumber;
  if (updates.insurer !== undefined) dbUpdates.insurer = updates.insurer;
  if (updates.transactionDate !== undefined) dbUpdates.transaction_date = updates.transactionDate;
  if (updates.isCrossSale !== undefined) dbUpdates.is_cross_sale = updates.isCrossSale;
  if (updates.isBusinessLoss !== undefined) dbUpdates.is_business_loss = updates.isBusinessLoss;
  if (updates.lossReason !== undefined) dbUpdates.loss_reason = updates.lossReason;

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
  const allEntries = await getMyMonthEntries(employeeId, month);
  // Only count approved and submitted entries in business summary
  const entries = allEntries.filter(
    e => e.status === 'approved' || e.status === 'submitted'
  );

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
