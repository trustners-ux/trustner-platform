/**
 * Cron — PD stock-level holdings refresh (monthly).
 *
 * Iterates the AMC source registry, builds each AMC's consolidated monthly
 * portfolio URL for the target month-end, fetches it, and ingests the equity
 * holdings into pd_fund_holdings (powering the look-through on portfolio
 * reviews). Best-effort: an AMC that hasn't published yet (404) or moved its
 * URL is logged and skipped — the team tops it up via the admin upload page.
 *
 * Runs the 12th of each month (by which AMCs have published the prior month).
 * Manual: GET ?month=YYYY-MM to target a specific month.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` (or ?secret= for manual).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { AMC_SOURCES, resolveSourceUrl, defaultTargetMonthEnd, monthEndIso } from '@/lib/portfolio-diagnostic/holdings/amc-sources';
import { ingestAmcWorkbook } from '@/lib/portfolio-diagnostic/holdings/ingest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const maxDuration = 300;

const FETCH_TIMEOUT_MS = 60_000;
const MAX_BYTES = 40 * 1024 * 1024;

async function fetchWorkbook(url: string): Promise<{ ok: true; buf: Buffer } | { ok: false; reason: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrustnerHoldingsBot/1.0)' },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return { ok: false, reason: `too large (${ab.byteLength} bytes)` };
    const buf = Buffer.from(ab);
    // Must be a spreadsheet — PK (xlsx/zip) or OLE (xls). An HTML error page is not.
    const isPk = buf[0] === 0x50 && buf[1] === 0x4b;
    const isOle = buf[0] === 0xd0 && buf[1] === 0xcf;
    if (!isPk && !isOle) return { ok: false, reason: 'not a spreadsheet (got HTML/other)' };
    return { ok: true, buf };
  } catch (e) {
    return { ok: false, reason: (e as Error).name === 'AbortError' ? 'timeout' : (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  // Header-only (audit P1-5) — a ?secret= query string leaks the cron secret
  // into access logs, referrers, and browser history.
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Target month-end: ?month=YYYY-MM override, else last day of the previous month.
  const monthParam = request.nextUrl.searchParams.get('month');
  let asOfDate: string;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    asOfDate = monthEndIso(y, m);
  } else {
    asOfDate = defaultTargetMonthEnd(new Date());
  }

  const results: Array<Record<string, unknown>> = [];
  let totalRows = 0;
  for (const src of AMC_SOURCES) {
    if (!src.enabled) { results.push({ amc: src.amc, skipped: 'disabled' }); continue; }
    const url = resolveSourceUrl(src.urlTemplate, asOfDate);
    const fetched = await fetchWorkbook(url);
    if (!fetched.ok) {
      results.push({ amc: src.amc, url, ok: false, reason: fetched.reason });
      continue;
    }
    try {
      const r = await ingestAmcWorkbook(fetched.buf, { source: src.source, asOfDate, equityOnly: true });
      totalRows += r.rowsUpserted;
      results.push({
        amc: src.amc, ok: true, asOfDate: r.asOfDate,
        matched: r.matched.length, unmatched: r.unmatched.length, rows: r.rowsUpserted,
        errors: r.errors.slice(0, 3),
      });
    } catch (e) {
      results.push({ amc: src.amc, url, ok: false, reason: `ingest: ${(e as Error).message}` });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  return NextResponse.json({
    success: true,
    targetMonthEnd: asOfDate,
    sourcesAttempted: AMC_SOURCES.filter((s) => s.enabled).length,
    sourcesIngested: ok,
    totalRowsUpserted: totalRows,
    results,
  });
}
