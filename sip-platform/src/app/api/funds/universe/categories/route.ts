/**
 * GET /api/funds/universe/categories
 *
 * Returns the distinct external_category list (with counts) for the
 * /funds/explore page's category drilldown.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ categories: [] });

  // Fetch all categories with counts via a manual aggregation
  // (Supabase PostgREST doesn't expose GROUP BY directly)
  const { data, error } = await supabase
    .from('pd_fund_universe_latest')
    .select('external_category')
    .not('snapshot_date', 'is', null)
    .not('external_category', 'is', null);

  if (error) {
    return NextResponse.json({ categories: [], error: error.message });
  }

  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const c = (r as { external_category: string }).external_category;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  const categories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ categories });
}
