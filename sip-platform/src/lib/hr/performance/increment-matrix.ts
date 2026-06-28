/**
 * Performance — Increment Matrix.
 *
 * Reads hr_increment_matrix (fiscal_year, rating) → {default, min, max}.
 * Computes salary deltas and persists the approved increment back to
 * hr_rating.final_increment_pct + increment_amount.
 *
 * Rule: requested_pct MUST be within [min_pct, max_pct] for the
 * (fiscal_year, rating) row, else throws.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface IncrementBands {
  fiscal_year: string;
  rating: number;
  default_pct: number;
  min_pct: number;
  max_pct: number;
  notes?: string | null;
}

export interface IncrementResult {
  newGrossMonthly: number;
  deltaMonthly: number;
  deltaAnnual: number;
}

/** Read the increment band for (fiscal_year, rating). */
export async function getIncrementBands(
  fiscal_year: string,
  rating: number
): Promise<IncrementBands | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from('hr_increment_matrix')
    .select('fiscal_year, rating, default_pct, min_pct, max_pct, notes')
    .eq('fiscal_year', fiscal_year)
    .eq('rating', rating)
    .maybeSingle();
  if (error || !data) return null;
  return data as IncrementBands;
}

/**
 * Pure math — does NOT touch the database.
 * Given current gross monthly and a chosen increment %, returns the
 * new gross monthly + monthly + annual delta.
 */
export function computeIncrement(
  currentGrossMonthly: number,
  ratingPct: number
): IncrementResult {
  if (currentGrossMonthly < 0) throw new Error('currentGrossMonthly must be >= 0');
  if (ratingPct < 0) throw new Error('ratingPct must be >= 0');
  const newGross = currentGrossMonthly * (1 + ratingPct / 100);
  const deltaMonthly = newGross - currentGrossMonthly;
  return {
    newGrossMonthly: Math.round(newGross * 100) / 100,
    deltaMonthly: Math.round(deltaMonthly * 100) / 100,
    deltaAnnual: Math.round(deltaMonthly * 12 * 100) / 100,
  };
}

/**
 * Persist a final increment % to hr_rating.
 * Validates against the matrix band; throws if outside [min, max].
 *
 * `currentGrossMonthly` is required to compute increment_amount (delta
 * annual). Pass the employee's last-known gross monthly from
 * hr_salary_runs / hr_employees.
 */
export async function finalizeIncrement(args: {
  rating_id: number;
  fiscal_year: string;
  rating: number;
  requested_pct: number;
  currentGrossMonthly: number;
  approver_email: string;
}): Promise<{
  rating_id: number;
  final_increment_pct: number;
  increment_amount: number;
  bands: IncrementBands;
}> {
  const bands = await getIncrementBands(args.fiscal_year, args.rating);
  if (!bands) {
    throw new Error(
      `No increment matrix for fiscal_year=${args.fiscal_year} rating=${args.rating}`
    );
  }
  if (
    args.requested_pct < bands.min_pct ||
    args.requested_pct > bands.max_pct
  ) {
    throw new Error(
      `Requested pct ${args.requested_pct} is outside band [${bands.min_pct}, ${bands.max_pct}] for FY ${args.fiscal_year} rating ${args.rating}.`
    );
  }

  const delta = computeIncrement(args.currentGrossMonthly, args.requested_pct);

  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('supabase not configured');

  const { error } = await sb
    .from('hr_rating')
    .update({
      final_increment_pct: args.requested_pct,
      increment_amount: delta.deltaAnnual,
    })
    .eq('id', args.rating_id);

  if (error) throw new Error(`Failed to persist final increment: ${error.message}`);

  return {
    rating_id: args.rating_id,
    final_increment_pct: args.requested_pct,
    increment_amount: delta.deltaAnnual,
    bands,
  };
}
