/**
 * Cron — Fund Master Refresh
 *
 * Runs weekly (suggested: Sundays at 02:00 IST). Fetches the latest
 * AMFI NAV file + MFAPI scheme data for each fund, computes 1Y/3Y/5Y
 * CAGRs, recomputes category benchmarks, and upserts everything into
 * pd_fund_master + pd_category_benchmarks.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Usage (Vercel cron config in vercel.json):
 *   {
 *     "crons": [
 *       { "path": "/api/cron/refresh-fund-master", "schedule": "0 21 * * 6" }
 *     ]
 *   }
 *   (21:00 UTC Saturday = 02:30 IST Sunday)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  fetchAmfiNavFile,
  fetchMfApiScheme,
  computeCagrFromNavHistory,
  mapAmfiCategoryToInternal,
  computeCategoryBenchmarks,
  type AmfiNavRow,
} from '@/lib/portfolio-diagnostic/fund-data-client';
import type { FundCategory } from '@/lib/portfolio-diagnostic/types';

export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Run ─────────────────────────────────────────────────────
  const startTime = Date.now();
  const log: string[] = [];

  try {
    log.push(`[${new Date().toISOString()}] Starting fund-master refresh`);

    // Step 1: Fetch AMFI NAV file (~12,000 schemes)
    const amfiRows = await fetchAmfiNavFile();
    log.push(`✓ AMFI: ${amfiRows.length} scheme rows fetched`);

    // Step 2: Filter to only equity/hybrid/debt main categories (skip ETF
    //         direct plans, IDCW variants — we keep growth + regular only
    //         for the analyzer)
    const filtered = filterRelevantSchemes(amfiRows);
    log.push(`✓ Filtered to ${filtered.length} relevant schemes`);

    // Step 3: Upsert into pd_fund_master in batches
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];
    const batchSize = 100;
    let upserted = 0;

    for (let i = 0; i < filtered.length; i += batchSize) {
      const batch = filtered.slice(i, i + batchSize);
      const rows = batch.map((row) => ({
        amfi_code: row.schemeCode,
        scheme_name: row.schemeName,
        amc_name: row.amcName,
        category: mapAmfiCategoryToInternal(row.category),
        sub_category: row.category, // raw AMFI category
        current_nav: row.nav,
        last_refreshed_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('pd_fund_master')
        .upsert(rows, { onConflict: 'amfi_code' });

      if (error) {
        log.push(`✗ Batch ${i}: ${error.message}`);
      } else {
        upserted += batch.length;
      }
    }
    log.push(`✓ Upserted ${upserted} rows into pd_fund_master`);

    // Step 4: For a subset (top 500 by AUM proxy / popular schemes),
    //         fetch full NAV history from MFAPI and compute CAGRs.
    //         (Doing all 12,000 would hit rate limits / take too long.)
    const TOP_N_FOR_CAGR = 500;
    const priorityCodes = await getPriorityFundCodes(supabase, TOP_N_FOR_CAGR);
    log.push(`✓ ${priorityCodes.length} priority schemes for CAGR computation`);

    let cagrComputed = 0;
    for (const code of priorityCodes) {
      const scheme = await fetchMfApiScheme(code);
      if (!scheme) continue;

      const cagr1y = computeCagrFromNavHistory(scheme.data, 1);
      const cagr3y = computeCagrFromNavHistory(scheme.data, 3);
      const cagr5y = computeCagrFromNavHistory(scheme.data, 5);
      const cagr10y = computeCagrFromNavHistory(scheme.data, 10);

      await supabase
        .from('pd_fund_master')
        .update({
          cagr_1y: cagr1y,
          cagr_3y: cagr3y,
          cagr_5y: cagr5y,
          cagr_10y: cagr10y,
          fund_manager: scheme.meta.scheme_name, // placeholder; MFAPI doesn't expose manager
        })
        .eq('amfi_code', code);

      cagrComputed++;

      // Throttle: 100ms between MFAPI calls
      await sleep(100);
    }
    log.push(`✓ CAGRs computed for ${cagrComputed} schemes`);

    // Step 5: Recompute category benchmarks
    const { data: fundsForBench } = await supabase
      .from('pd_fund_master')
      .select('category, cagr_3y, cagr_5y');

    if (fundsForBench) {
      const benchmarks = computeCategoryBenchmarks(
        fundsForBench.map((f) => ({
          category: f.category as FundCategory,
          cagr3y: f.cagr_3y,
          cagr5y: f.cagr_5y,
        })),
        today
      );

      for (const b of benchmarks) {
        await supabase.from('pd_category_benchmarks').upsert(
          {
            category: b.category,
            median_3y: b.median3y,
            median_5y: b.median5y,
            top_10_pct_3y: b.top10Pct3y,
            bottom_10_pct_3y: b.bottom10Pct3y,
            total_funds_in_category: b.totalFundsInCategory,
            as_of_date: today,
          },
          { onConflict: 'category,as_of_date' }
        );
      }

      log.push(`✓ Recomputed benchmarks for ${benchmarks.length} categories`);
    }

    // Step 6: Update category quartile ranks
    await recomputeCategoryQuartiles(supabase);
    log.push(`✓ Recomputed category quartile ranks`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`✓ Done in ${elapsed}s`);

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}s`,
      log,
    });
  } catch (e) {
    const msg = (e as Error).message;
    log.push(`✗ FATAL: ${msg}`);
    return NextResponse.json(
      { success: false, error: msg, log },
      { status: 500 }
    );
  }
}

// Allow manual triggering via POST too (same logic, same auth)
export const POST = GET;

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Filter AMFI rows to only the schemes we care about analyzing:
 *   - Growth or Direct-Growth plans (skip IDCW variants — same fund,
 *     different distribution mode)
 *   - Open-ended schemes (skip close-ended FMP-style)
 *   - Equity, Hybrid, Debt, Multi-Asset (skip pure ETFs for now)
 */
function filterRelevantSchemes(rows: AmfiNavRow[]): AmfiNavRow[] {
  return rows.filter((r) => {
    const name = r.schemeName.toLowerCase();
    // Skip IDCW variants
    if (/idcw|dividend|payout|reinvestment/i.test(name)) return false;
    // Skip FMP / close-ended
    if (/fmp|series|fixed maturity/i.test(name)) return false;
    // Skip Bonus
    if (/bonus/i.test(name)) return false;
    return true;
  });
}

async function getPriorityFundCodes(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  limit: number
): Promise<string[]> {
  // For v1: pull the top N "trustner_preferred" funds + any fund that
  // appears in any active diagnostic_holdings. This keeps CAGR data
  // fresh for funds we actually analyze.
  const { data: preferred } = await supabase
    .from('pd_fund_master')
    .select('amfi_code')
    .eq('trustner_preferred', true);

  const { data: inHoldings } = await supabase
    .from('pd_diagnostic_holdings')
    .select('amfi_code')
    .not('amfi_code', 'is', null);

  const codes = new Set<string>();
  for (const row of preferred ?? []) codes.add(row.amfi_code as string);
  for (const row of inHoldings ?? []) codes.add(row.amfi_code as string);

  // Plus top-AUM seed list of well-known schemes (popular Indian MFs).
  // This ensures we always have CAGRs for the major funds even on a
  // fresh install with no diagnostic history yet.
  const POPULAR_SEED = [
    '120503', '118989', '120710',  // Bandhan Small Cap, Nippon Mid Cap, Motilal L&M
    '125354', '120594',            // Invesco Small Cap, ICICI Pru Equity & Debt
    '122639', '113177',            // Parag Parikh Flexi, HDFC Flexi
    '120825', '120504',            // Mirae Asset Multicap, Canara Robeco Small Cap
  ];
  for (const code of POPULAR_SEED) codes.add(code);

  return [...codes].slice(0, limit);
}

async function recomputeCategoryQuartiles(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
): Promise<void> {
  // For each category, sort funds by 3Y CAGR descending, assign rank.
  // Then derive quartile.
  const { data: categories } = await supabase
    .from('pd_fund_master')
    .select('category')
    .not('cagr_3y', 'is', null);

  if (!categories) return;

  const uniqueCategories = [...new Set(categories.map((c) => c.category))];

  for (const category of uniqueCategories) {
    const { data: funds } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, cagr_3y, cagr_5y')
      .eq('category', category)
      .not('cagr_3y', 'is', null)
      .order('cagr_3y', { ascending: false });

    if (!funds || funds.length === 0) continue;

    const total = funds.length;
    for (let i = 0; i < funds.length; i++) {
      const rank3y = i + 1;
      await supabase
        .from('pd_fund_master')
        .update({
          category_rank_3y: rank3y,
          category_total: total,
        })
        .eq('amfi_code', funds[i].amfi_code as string);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
