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

  // Fetch all (category, broad_bucket) pairs and aggregate in JS.
  // PostgREST caps page size at 1000 by default — paginate via .range().
  type Row = { external_category: string; broad_bucket: string | null };
  const all: Row[] = [];
  const PAGE = 1000;
  let from = 0;
  let error: { message: string } | null = null;

  while (true) {
    const { data: page, error: pageErr } = await supabase
      .from('pd_fund_universe_latest')
      .select('external_category, broad_bucket')
      .not('snapshot_date', 'is', null)
      .not('external_category', 'is', null)
      .range(from, from + PAGE - 1);
    if (pageErr) { error = pageErr; break; }
    if (!page || page.length === 0) break;
    all.push(...(page as Row[]));
    if (page.length < PAGE) break;
    from += PAGE;
  }

  const data = all;

  if (error) {
    const missingTable =
      /not\s+find\s+the\s+table|relation .* does not exist|schema cache/i.test(error.message);
    if (missingTable) {
      return NextResponse.json({ categories: [], pendingSetup: true });
    }
    console.error('[FundsCategories]', error.message);
    return NextResponse.json({ categories: [], error: 'Failed to load categories' });
  }

  // Aggregate: { (category, broad_bucket) → count }
  const keyed = new Map<string, { name: string; broad: string; count: number }>();
  for (const r of data) {
    const key = `${r.broad_bucket || 'Other'}::${r.external_category}`;
    const existing = keyed.get(key);
    if (existing) existing.count++;
    else keyed.set(key, { name: r.external_category, broad: r.broad_bucket || 'Other', count: 1 });
  }

  const categories = [...keyed.values()]
    .map((c) => ({ name: c.name, broad_bucket: c.broad, count: c.count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ categories });
}
