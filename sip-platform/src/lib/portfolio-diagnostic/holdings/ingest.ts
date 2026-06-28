/**
 * Holdings ingestion — takes an AMC monthly-portfolio workbook, splits it into
 * per-scheme portfolios, resolves each scheme → Regular-plan amfi_code (so the
 * look-through aligns with the codes the PD resolves client holdings to), and
 * upserts pd_fund_holdings.
 *
 * Used by BOTH paths: the reliable admin-upload route (a human downloads the
 * file through the AMC dropdown and uploads it) AND the best-effort monthly
 * auto-resolver. The upload path means the feature works today regardless of
 * how many AMC URLs the resolver can fetch.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { parseAmcPortfolioWorkbookGrouped } from './portfolio-parser';
import { fuzzyMatchSchemeName } from '@/lib/portfolio-diagnostic/fund-data-client';

export interface IngestResult {
  asOfDate: string;
  schemesParsed: number;
  matched: Array<{ scheme: string; amfiCode: string; confidence: number; rows: number }>;
  unmatched: Array<{ scheme: string; bestConfidence: number }>;
  rowsUpserted: number;
  errors: string[];
}

const MIN_CONFIDENCE = 0.5;

type Candidate = { amfiCode: string; schemeName: string };

/** Regular-plan, Growth, non-IDCW candidates — the canonical scheme per fund. */
async function loadRegularCandidates(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<Candidate[]> {
  if (!supabase) return [];
  const out: Candidate[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 6000; from += PAGE) {
    const { data, error } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, scheme_name')
      .not('scheme_name', 'ilike', '%direct%')
      .not('scheme_name', 'ilike', '%idcw%')
      .ilike('scheme_name', '%growth%')
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data as Array<{ amfi_code: string; scheme_name: string }>) {
      out.push({ amfiCode: r.amfi_code, schemeName: r.scheme_name });
    }
    if (data.length < PAGE) break;
  }
  return out;
}

/**
 * Ingest one AMC monthly workbook.
 * @param opts.asOfDate  override the parsed month-end (yyyy-mm-dd). Required if
 *                       the file has no detectable "as on" date.
 * @param opts.source    provenance tag stored on each row (e.g. "amc:HDFC", "upload").
 * @param opts.equityOnly store only equity rows (the look-through default — debt/cash
 *                       don't participate in stock-overlap). Default true.
 */
export async function ingestAmcWorkbook(
  buffer: Buffer,
  opts: { asOfDate?: string; source: string; equityOnly?: boolean }
): Promise<IngestResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Database unavailable');

  const equityOnly = opts.equityOnly !== false;
  const groups = parseAmcPortfolioWorkbookGrouped(buffer);
  const candidates = await loadRegularCandidates(supabase);

  const parsedDate = groups.find((g) => g.asOfDate)?.asOfDate ?? '';
  const asOfDate = (opts.asOfDate && /^\d{4}-\d{2}-\d{2}$/.test(opts.asOfDate)) ? opts.asOfDate : parsedDate;

  const result: IngestResult = {
    asOfDate, schemesParsed: groups.length, matched: [], unmatched: [], rowsUpserted: 0, errors: [],
  };

  if (groups.length === 0) {
    result.errors.push('No SEBI-format portfolio blocks found — is this a monthly portfolio disclosure file?');
    return result;
  }
  if (!asOfDate) {
    result.errors.push('No portfolio month-end date detected in the file. Re-upload selecting the month, or pass asOfDate (yyyy-mm-dd).');
    return result;
  }
  if (candidates.length === 0) {
    result.errors.push('Could not load the fund master for scheme matching.');
    return result;
  }

  for (const g of groups) {
    const m = fuzzyMatchSchemeName(g.schemeName, candidates);
    if (!m || m.confidence < MIN_CONFIDENCE) {
      result.unmatched.push({ scheme: g.schemeName, bestConfidence: Math.round((m?.confidence ?? 0) * 100) / 100 });
      continue;
    }
    const picked = (equityOnly ? g.rows.filter((r) => r.instrumentType === 'equity') : g.rows)
      .filter((r) => r.pctOfAum != null || r.marketValueInr != null);
    if (picked.length === 0) continue;

    // Dedupe within the scheme by stock_name (the UNIQUE key) — a name appearing
    // twice in one batch would otherwise abort the upsert. Keep the larger weight.
    const byStock = new Map<string, typeof picked[number]>();
    for (const r of picked) {
      const key = r.stockName.trim().toLowerCase();
      const prev = byStock.get(key);
      if (!prev || Math.abs(r.pctOfAum ?? 0) > Math.abs(prev.pctOfAum ?? 0)) byStock.set(key, r);
    }

    const records = [...byStock.values()].map((r) => ({
      amfi_code: m.amfiCode,
      scheme_name: g.schemeName.slice(0, 220),
      as_of_date: asOfDate,
      stock_name: r.stockName.slice(0, 220),
      isin: r.isin,
      instrument_type: r.instrumentType,
      sector: r.sector ? r.sector.slice(0, 120) : null,
      pct_of_aum: r.pctOfAum,
      market_value_inr: r.marketValueInr,
      source: opts.source.slice(0, 40),
    }));

    const { error } = await supabase
      .from('pd_fund_holdings')
      .upsert(records, { onConflict: 'amfi_code,as_of_date,stock_name' });
    if (error) {
      result.errors.push(`${g.schemeName}: ${error.message}`);
      continue;
    }
    result.matched.push({ scheme: g.schemeName, amfiCode: m.amfiCode, confidence: Math.round(m.confidence * 100) / 100, rows: records.length });
    result.rowsUpserted += records.length;
  }

  return result;
}
