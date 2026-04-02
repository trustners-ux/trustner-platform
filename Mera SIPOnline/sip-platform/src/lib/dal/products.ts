// ─── Products DAL ───
// Abstracts product data access — works with local data or Supabase

import { isLocal } from '@/lib/db/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { writeAuditLog } from './audit';

export interface ProductRow {
  id: number;
  productName: string;
  productCategory: string | null;
  tier: number | null;
  commissionRange: string | null;
  creditPct: number;
  referralCreditPct: number;
  isMotor: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
}

// ─── Local seed data (from types.ts PRODUCT_CREDIT_RULES) ───
const LOCAL_PRODUCTS: ProductRow[] = [
  { id: 1, productName: 'MF SIP (Monthly)', productCategory: 'MF', tier: 1, commissionRange: '0.5-1.0%', creditPct: 100, referralCreditPct: 0, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 2, productName: 'MF Lumpsum - Equity', productCategory: 'MF', tier: 2, commissionRange: '0.3-0.8%', creditPct: 10, referralCreditPct: 0, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 3, productName: 'MF Lumpsum - LT Debt', productCategory: 'MF', tier: 2, commissionRange: '0.2-0.5%', creditPct: 7.5, referralCreditPct: 0, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 4, productName: 'MF Lumpsum - ST Debt', productCategory: 'MF', tier: 3, commissionRange: '0.1-0.3%', creditPct: 5, referralCreditPct: 0, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 5, productName: 'Health - Annual', productCategory: 'Health', tier: 1, commissionRange: '15-25%', creditPct: 100, referralCreditPct: 5, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 6, productName: 'Health - 2yr Pay', productCategory: 'Health', tier: 1, commissionRange: '15-25%', creditPct: 62.5, referralCreditPct: 5, isMotor: false, notes: 'Prem/2 x 125%', isActive: true, createdAt: '2026-01-01' },
  { id: 7, productName: 'Health - 3yr Pay', productCategory: 'Health', tier: 1, commissionRange: '15-25%', creditPct: 50, referralCreditPct: 5, isMotor: false, notes: 'Prem/3 x 150%', isActive: true, createdAt: '2026-01-01' },
  { id: 8, productName: 'GI Non-Motor', productCategory: 'GI Non-Motor', tier: 2, commissionRange: '10-20%', creditPct: 100, referralCreditPct: 3, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 9, productName: 'Motor', productCategory: 'GI Motor', tier: 3, commissionRange: '2-5%', creditPct: 0, referralCreditPct: 0, isMotor: true, notes: 'Grid-based', isActive: true, createdAt: '2026-01-01' },
  { id: 10, productName: 'Life 10yr+ Regular', productCategory: 'Life', tier: 1, commissionRange: '20-35%', creditPct: 125, referralCreditPct: 5, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 11, productName: 'Life <10yr Regular', productCategory: 'Life', tier: 2, commissionRange: '15-25%', creditPct: 100, referralCreditPct: 5, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
  { id: 12, productName: 'Life ULIP', productCategory: 'Life', tier: 3, commissionRange: '5-10%', creditPct: 25, referralCreditPct: 0, isMotor: false, notes: null, isActive: true, createdAt: '2026-01-01' },
];

// ─── Map Supabase DB row to ProductRow ───
function mapRow(row: Record<string, unknown>): ProductRow {
  return {
    id: row.id as number,
    productName: row.product_name as string,
    productCategory: (row.product_category as string) || null,
    tier: row.tier != null ? Number(row.tier) : null,
    commissionRange: (row.commission_range as string) || null,
    creditPct: Number(row.credit_pct) || 0,
    referralCreditPct: Number(row.referral_credit_pct) || 0,
    isMotor: (row.is_motor as boolean) || false,
    notes: (row.notes as string) || null,
    isActive: row.is_active !== false,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

// ─── Get All Products ───
export async function getProducts(filters?: ProductFilters): Promise<ProductRow[]> {
  if (isLocal) {
    console.log('[Products] Using local data');
    let result = [...LOCAL_PRODUCTS];
    if (filters?.category) {
      result = result.filter((p) => p.productCategory === filters.category);
    }
    if (filters?.isActive !== undefined) {
      result = result.filter((p) => p.isActive === filters.isActive);
    }
    return result;
  }

  // ─── Supabase Path ───
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  let query = sb.from('products').select('*');
  if (filters?.category) query = query.eq('product_category', filters.category);
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);

  const { data, error } = await query.order('id');
  if (error) throw new Error(`Supabase products query failed: ${error.message}`);

  console.log(`[Products] Fetched ${(data || []).length} products from Supabase`);
  return (data || []).map(mapRow);
}

// ─── Get Single Product by ID ───
export async function getProductById(id: number): Promise<ProductRow | null> {
  if (isLocal) {
    return LOCAL_PRODUCTS.find((p) => p.id === id) || null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from('products').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data);
}

// ─── Update Product ───
export async function updateProduct(
  id: number,
  updates: Partial<ProductRow>,
  changedBy: string
): Promise<ProductRow | null> {
  if (isLocal) {
    console.log('[Products] Local mode — no mutation (read-only seed data)');
    return getProductById(id);
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Map camelCase to snake_case for Supabase
  const dbUpdates: Record<string, unknown> = {};
  if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
  if (updates.productCategory !== undefined) dbUpdates.product_category = updates.productCategory;
  if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
  if (updates.commissionRange !== undefined) dbUpdates.commission_range = updates.commissionRange;
  if (updates.creditPct !== undefined) dbUpdates.credit_pct = updates.creditPct;
  if (updates.referralCreditPct !== undefined) dbUpdates.referral_credit_pct = updates.referralCreditPct;
  if (updates.isMotor !== undefined) dbUpdates.is_motor = updates.isMotor;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  // Fetch old data for audit
  const { data: oldData } = await sb.from('products').select('*').eq('id', id).single();

  const { data, error } = await sb
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Product update failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'products',
    recordId: id,
    action: 'UPDATE',
    changedBy,
    oldValues: oldData || undefined,
    newValues: dbUpdates,
  });

  console.log(`[Products] Updated product ${id} by ${changedBy}`);
  return data ? mapRow(data) : null;
}

// ─── Insert Product ───
export async function insertProduct(
  data: Omit<ProductRow, 'id' | 'createdAt'>,
  changedBy: string
): Promise<ProductRow | null> {
  if (isLocal) {
    console.log('[Products] Local mode — cannot insert (read-only seed data)');
    return null;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const dbRow = {
    product_name: data.productName,
    product_category: data.productCategory,
    tier: data.tier,
    commission_range: data.commissionRange,
    credit_pct: data.creditPct,
    referral_credit_pct: data.referralCreditPct,
    is_motor: data.isMotor,
    notes: data.notes,
    is_active: data.isActive,
  };

  const { data: inserted, error } = await sb
    .from('products')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(`Product insert failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'products',
    recordId: inserted?.id,
    action: 'INSERT',
    changedBy,
    newValues: dbRow,
  });

  console.log(`[Products] Inserted new product by ${changedBy}`);
  return inserted ? mapRow(inserted) : null;
}

// ─── Delete Product (soft delete — set is_active=false) ───
export async function deleteProduct(
  id: number,
  changedBy: string
): Promise<boolean> {
  if (isLocal) {
    console.log('[Products] Local mode — cannot delete (read-only seed data)');
    return false;
  }

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  // Fetch old data for audit
  const { data: oldData } = await sb.from('products').select('*').eq('id', id).single();

  const { error } = await sb
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(`Product soft-delete failed: ${error.message}`);

  await writeAuditLog({
    tableName: 'products',
    recordId: id,
    action: 'DELETE',
    changedBy,
    oldValues: oldData || undefined,
    newValues: { is_active: false },
  });

  console.log(`[Products] Soft-deleted product ${id} by ${changedBy}`);
  return true;
}
