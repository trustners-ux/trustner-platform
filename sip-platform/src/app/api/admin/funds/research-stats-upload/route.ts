/**
 * POST /api/admin/funds/research-stats-upload
 *
 * Admin uploads a research-stats XLSX (e.g. the weekly NGEN export).
 * The file is parsed, scheme names are fuzzy-matched to amfi_code via
 * pd_fund_master, and rows are upserted into pd_fund_research_stats with
 * the snapshot_date inferred from the NAV Date column in the file.
 *
 * Returns:
 *   {
 *     success: true,
 *     parsed: 2026,
 *     matched: 1987,
 *     deduped: 1941,
 *     upserted: 1941,
 *     unmatched: 39,
 *     snapshotDate: '2026-05-24',
 *     elapsedSec: 18,
 *     unmatchedSample: [...first 10 unmatched scheme names]
 *   }
 *
 * Auth: admin JWT or employee JWT cookie required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Normalization for fuzzy matching (mirrors import-fund-research-stats.mjs) ───

const CATEGORY_DISCRIMINATORS = [
  'flexi', 'large', 'mid', 'small', 'multi', 'focused', 'contra',
  'value', 'elss', 'taxsaver', 'tax', 'bluechip', 'dividend', 'yield',
  'liquid', 'overnight', 'gilt', 'arbitrage', 'balanced',
];

function normalizeName(name: string): string {
  if (!name) return '';
  let s = String(name).toLowerCase();
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/\bbalance\s+advantage\b/g, 'balanced advantage'); // NGEN typo for the SEBI "Balanced Advantage" cat
  s = s
    .replace(/\bregular\s+plan\b/g, '').replace(/\bdirect\s+plan\b/g, '')
    .replace(/\bgrowth\s+option\b/g, '').replace(/\bgrowth\s+sub\s+option\b/g, '')
    .replace(/\bdiscontinued\s+regular\s+option\b/g, '').replace(/\bdiscontinued\b/g, '')
    .replace(/\bidcw-payout\b|\bidcw-reinvest\b|\bidcw-w\b|\bidcw-m\b|\bidcw-q\b|\bidcw\b/g, '')
    .replace(/\bdividend\s+payout\b|\bdividend\s+reinvest\b|\bdividend\s+option\b/g, '')
    .replace(/\bgrowth\b/g, '').replace(/\boption\b/g, '')
    .replace(/\bregulr\b/g, '').replace(/\bregulat\b/g, '').replace(/\bregular\b/g, '').replace(/\bdirect\b/g, '').replace(/\breg\b/g, '')
    .replace(/\bplan\b/g, '');
  s = s
    .replace(/\baditya\s+birla\s+sun\s+life\b/g, 'absl').replace(/\baditya\s+birla\s+sl\b/g, 'absl')
    .replace(/\bicici\s+prudential\b/g, 'icicipru').replace(/\bicici\s+pru\b/g, 'icicipru')
    .replace(/\bnippon\s+india\b/g, 'nippon').replace(/\bnippon\b/g, 'nippon')
    .replace(/\bkotak\s+mahindra\b/g, 'kotak')
    .replace(/\bfranklin\s+templeton\b/g, 'franklin').replace(/\bfranklin\s+india\b/g, 'franklin')
    .replace(/\bfranklin\b/g, 'franklin')
    .replace(/\bbaroda\s+bnp\s+paribas\b/g, 'barodabnp').replace(/\bbaroda\s+bnp\b/g, 'barodabnp')
    .replace(/\bmahindra\s+manulife\b/g, 'mahindramanulife')
    .replace(/\bsundaram\s+amc\b/g, 'sundaram').replace(/\bpgim\s+india\b/g, 'pgim')
    .replace(/\bdsp\s+blackrock\b/g, 'dsp').replace(/\binvesco\s+india\b/g, 'invesco')
    .replace(/\bidfc\b/g, 'bandhan').replace(/\b360\s+one\b/g, '360one')
    .replace(/\bjm\s+financial\b/g, 'jm').replace(/\bjio\s+blackrock\b/g, 'jioblackrock')
    .replace(/\bbank\s+of\s+india\b/g, 'boi').replace(/\bunion\s+kbc\b/g, 'union')
    .replace(/\bwhiteoak\s+capital\b/g, 'whiteoak').replace(/\baxis\s+mutual\b/g, 'axis')
    .replace(/\bppfas\b|\bparag\s+parikh\b/g, 'ppfas');
  s = s.replace(/\bmutual\s+fund\b/g, '').replace(/\basset\s+management\b/g, '')
    .replace(/\bamc\b/g, '').replace(/\bfund\s+of\s+funds?\b/g, 'fof')
    .replace(/\bfund\b/g, '');
  // Include "_" (junk separator in some AMFI names, e.g. Kotak Focused) and drop
  // the "and" connector so NGEN "Large & Mid" and AMFI "Large and Mid" unify.
  s = s.replace(/[-–—•·,._&'"/]/g, ' ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

type MasterRow = { amfi_code: string; scheme_name: string; amc_name: string; norm?: string };

function preferRegularGrowth(candidates: MasterRow[]): MasterRow {
  const isRegular = (c: MasterRow) => !/\bdirect\b/i.test(c.scheme_name);
  const isGrowth = (c: MasterRow) => /\bgrowth\b/i.test(c.scheme_name) && !/\bidcw\b|\bdividend\b/i.test(c.scheme_name);
  const both = candidates.find((c) => isRegular(c) && isGrowth(c));
  if (both) return both;
  return candidates.find(isRegular) || candidates.find(isGrowth) || candidates[0];
}

// Re-select the Regular-Growth sibling sharing the despaced norm — the NGEN feed
// is Regular-only, so any match to a Direct/IDCW code is wrong (e.g. Nippon Vision
// Regular "Midcap" vs Direct "Mid Cap" can exact-match the Direct twin).
function finalizeMatch(row: MasterRow | null, despacedIndex?: Map<string, MasterRow[]>): MasterRow | null {
  if (!row || !despacedIndex) return row;
  const key = normalizeName(row.scheme_name).replace(/\s+/g, '');
  const group = despacedIndex.get(key);
  if (group && group.length > 1) return preferRegularGrowth(group);
  return row;
}

function matchFund(
  ngenName: string,
  index: Map<string, MasterRow[]>,
  flatIndex: MasterRow[],
  despacedIndex?: Map<string, MasterRow[]>
): MasterRow | null {
  const norm = normalizeName(ngenName);
  if (!norm) return null;
  const exact = index.get(norm) || [];
  if (exact.length > 0) return finalizeMatch(preferRegularGrowth(exact), despacedIndex);

  // Despaced exact match — bridges cap-size word spacing ("Flexi Cap" vs
  // "Flexicap", "Large and Mid Cap" vs "Large and Midcap", "Mid Cap" vs
  // "Midcap"). Additive: only fires when the spaced exact match failed, so it
  // cannot regress a currently-correct match.
  if (despacedIndex) {
    const dArr = despacedIndex.get(norm.replace(/\s+/g, ''));
    if (dArr && dArr.length > 0) return preferRegularGrowth(dArr);
  }

  const tokens = norm.split(' ');
  for (let drop = 1; drop <= 3 && drop < tokens.length; drop++) {
    const reduced = tokens.slice(drop).join(' ');
    const arr = index.get(reduced);
    if (arr && arr.length > 0) return finalizeMatch(preferRegularGrowth(arr), despacedIndex);
  }

  const ngenTokens = new Set(tokens.filter((t) => t.length > 2));
  if (ngenTokens.size === 0) return null;
  const ngenFirstToken = tokens[0];
  const ngenDisc = new Set([...ngenTokens].filter((t) => CATEGORY_DISCRIMINATORS.includes(t)));

  let best: { row: MasterRow | null; score: number } = { row: null, score: -1 };
  for (const f of flatIndex) {
    const fTokens = new Set((f.norm || '').split(' ').filter((t) => t.length > 2));
    if (!fTokens.has(ngenFirstToken)) continue;
    const fDisc = new Set([...fTokens].filter((t) => CATEGORY_DISCRIMINATORS.includes(t)));
    if (ngenDisc.size > 0) {
      if (fDisc.size !== ngenDisc.size) continue;
      let allMatch = true;
      for (const d of ngenDisc) if (!fDisc.has(d)) { allMatch = false; break; }
      if (!allMatch) continue;
    } else if (fDisc.size > 0) continue;

    let score = 0;
    for (const t of ngenTokens) if (fTokens.has(t)) score++;
    if (score / ngenTokens.size < 0.6) continue;
    const excess = Math.max(0, fTokens.size - ngenTokens.size);
    const adjScore = score - excess * 0.25;
    if (adjScore > best.score) best = { row: f, score: adjScore };
  }
  return finalizeMatch(best.row, despacedIndex);
}

function toIsoDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
}

function toNum(v: unknown): number | null {
  if (v == null || v === '' || v === 'NA' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Excel parser (mirrors the CLI script's logic) ───

interface ParsedFund {
  sheetType: string;
  category: string;
  scheme_name_source: string;
  [k: string]: unknown;
}

function parseSheet(wb: ReturnType<typeof XLSX.read>, sheetName: string, sheetType: string): ParsedFund[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true }) as unknown[][];

  // Find header row (col 0 === '#')
  const idx: Record<string, number> = {};
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    if (data[i]?.[0] === '#' || data[i]?.[0] === '# ') {
      data[i].forEach((h, j) => { if (h) idx[String(h).trim()] = j; });
      break;
    }
  }
  if (!idx['Fund Name']) return [];

  const funds: ParsedFund[] = [];
  let currentCategory: string | null = null;
  const SKIP_HEADERS = new Set(['NGEN MARKETS', '#']);
  const SKIP_PHRASES = ['all returns for periods', 'report date', 'fund name'];

  for (const row of data) {
    if (!row || row.length === 0) continue;
    const c0 = row[0], c1 = row[1];

    if (typeof c0 === 'number' && currentCategory) {
      const schemeName = row[idx['Fund Name']];
      if (!schemeName) continue;
      funds.push({
        sheetType,
        category: currentCategory,
        scheme_name_source: String(schemeName).trim(),
        launch_date: row[idx['Launch Date']],
        nav: row[idx['NAV']],
        nav_date: row[idx['NAV Date']],
        aum_inr_cr: row[idx['AUM (Cr)']],
        riskometer: row[idx['Riskometer']],
        returns_1d: row[idx['1 Day']], returns_5d: row[idx['5 Day']],
        returns_mtd: row[idx['MTD']], returns_ytd: row[idx['YTD']],
        returns_1m: row[idx['1 Month']], returns_3m: row[idx['3 Month']],
        returns_6m: row[idx['6 Month']], returns_1y: row[idx['1 Year']],
        returns_2y: row[idx['2 Year']], returns_3y: row[idx['3 Year']],
        returns_5y: row[idx['5 Year']], returns_7y: row[idx['7 Year']],
        returns_10y: row[idx['10 Year']], returns_15y: row[idx['15 Year']],
        returns_since_launch: row[idx['Since Launch']],
        annual_2025: row[idx['2025']], annual_2024: row[idx['2024']],
        annual_2023: row[idx['2023']], annual_2022: row[idx['2022']],
        annual_2021: row[idx['2021']],
        volatility: row[idx['Volatility']], sharpe: row[idx['Sharpe']],
        sortino: row[idx['Sortino']], hist_var: row[idx['Hist VaR']],
        imp_var: row[idx['Imp VaR']], ter: row[idx['TER']],
        equity_pct: row[idx['Equity %']], debt_pct: row[idx['Debt %']],
        cash_pct: row[idx['Cash %']], net_equity_pct: row[idx['Net Equity %']],
        large_cap_pct: row[idx['Large Cap %']], mid_cap_pct: row[idx['Mid Cap %']],
        small_cap_pct: row[idx['Small Cap %']],
        holdings_count: row[idx['Holdings']],
        top_3_pct: row[idx['Top 3 %']], top_5_pct: row[idx['Top 5 %']],
        top_10_pct: row[idx['Top 10 %']], top_20_pct: row[idx['Top 20 %']],
        pe: row[idx['P/E']], pb: row[idx['P/B']], mkt_cap_cr: row[idx['Mkt Cap (Cr)']],
        ytm: row[idx['YTM']], net_ytm: row[idx['Net YTM']],
        avg_maturity: row[idx['Avg Maturity']], duration: row[idx['Duration']],
        turnover_cost: row[idx['Turn. Cost']],
        aaa_pct: row[idx['AAA %']], aa_pct: row[idx['AA %']],
        a_pct: row[idx['A %']], sov_pct: row[idx['SOV %']],
        feed_fund_score: row[idx['NGEN Fund Score']],
        feed_risk_score: row[idx['NGEN Risk Score']],
        feed_return_score: row[idx['NGEN Return Score']],
      });
      continue;
    }
    if (typeof c0 === 'string' && (c1 == null || c1 === '')) {
      const t = c0.trim();
      if (!t || SKIP_HEADERS.has(t)) continue;
      const lower = t.toLowerCase();
      if (SKIP_PHRASES.some((p) => lower.startsWith(p))) continue;
      currentCategory = t;
    }
  }
  return funds;
}

// ─── POST handler ───

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifyToken(adminToken))) return true;
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken && (await verifyEmployeeToken(empToken))) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const t0 = Date.now();
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

    // Parse XLSX
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { cellDates: true });
    const allFunds = [
      ...parseSheet(wb, 'Equity', 'equity'),
      ...parseSheet(wb, 'Debt', 'debt'),
      ...parseSheet(wb, 'Hybrid', 'hybrid'),
      ...parseSheet(wb, 'Other', 'other'),
      ...parseSheet(wb, 'Solution Oriented', 'solution_oriented'),
    ];

    if (allFunds.length === 0) {
      return NextResponse.json({
        error: 'No funds parsed. Confirm the file is a research-stats export (Equity/Debt/Hybrid/Other/Solution Oriented sheets).',
      }, { status: 400 });
    }

    let snapshotDate: string | null = null;
    for (const f of allFunds) {
      const d = toIsoDate(f.nav_date);
      if (d && (!snapshotDate || d > snapshotDate)) snapshotDate = d;
    }
    snapshotDate = snapshotDate || new Date().toISOString().slice(0, 10);

    // Load fund master
    const master: MasterRow[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('pd_fund_master')
        .select('amfi_code, scheme_name, amc_name')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      master.push(...(data as MasterRow[]));
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Build index
    const byNormName = new Map<string, MasterRow[]>();
    const despacedIndex = new Map<string, MasterRow[]>();
    const flatIndex: MasterRow[] = [];
    for (const row of master) {
      const norm = normalizeName(row.scheme_name);
      const item = { ...row, norm };
      flatIndex.push(item);
      if (!byNormName.has(norm)) byNormName.set(norm, []);
      byNormName.get(norm)!.push(item);
      const dKey = norm.replace(/\s+/g, '');
      if (dKey) {
        if (!despacedIndex.has(dKey)) despacedIndex.set(dKey, []);
        despacedIndex.get(dKey)!.push(item);
      }
    }

    const matched: Array<ParsedFund & { amfi_code: string }> = [];
    const unmatched: ParsedFund[] = [];
    for (const f of allFunds) {
      const hit = matchFund(f.scheme_name_source, byNormName, flatIndex, despacedIndex);
      if (hit) matched.push({ ...f, amfi_code: hit.amfi_code });
      else unmatched.push(f);
    }

    // Dedupe
    const dedupedMap = new Map<string, ParsedFund & { amfi_code: string }>();
    for (const row of matched) {
      const key = `${row.amfi_code}|${snapshotDate}`;
      const existing = dedupedMap.get(key);
      const curAum = toNum(row.aum_inr_cr) || 0;
      const exAum = (existing?.aum_inr_cr ? toNum(existing.aum_inr_cr) : 0) || 0;
      if (!existing || curAum > exAum) dedupedMap.set(key, row);
    }
    const dedupedRows = [...dedupedMap.values()].map((f) => ({
      amfi_code: f.amfi_code,
      snapshot_date: snapshotDate!,
      source: 'manual',
      external_category: f.category,
      launch_date: toIsoDate(f.launch_date),
      current_nav: toNum(f.nav), nav_date: toIsoDate(f.nav_date),
      aum_inr_cr: toNum(f.aum_inr_cr),
      riskometer: f.riskometer || null,
      returns_1d: toNum(f.returns_1d), returns_5d: toNum(f.returns_5d),
      returns_mtd: toNum(f.returns_mtd), returns_ytd: toNum(f.returns_ytd),
      returns_1m: toNum(f.returns_1m), returns_3m: toNum(f.returns_3m),
      returns_6m: toNum(f.returns_6m), returns_1y: toNum(f.returns_1y),
      returns_2y: toNum(f.returns_2y), returns_3y: toNum(f.returns_3y),
      returns_5y: toNum(f.returns_5y), returns_7y: toNum(f.returns_7y),
      returns_10y: toNum(f.returns_10y), returns_15y: toNum(f.returns_15y),
      returns_since_launch: toNum(f.returns_since_launch),
      annual_2025: toNum(f.annual_2025), annual_2024: toNum(f.annual_2024),
      annual_2023: toNum(f.annual_2023), annual_2022: toNum(f.annual_2022),
      annual_2021: toNum(f.annual_2021),
      volatility: toNum(f.volatility), sharpe: toNum(f.sharpe), sortino: toNum(f.sortino),
      hist_var: toNum(f.hist_var), imp_var: toNum(f.imp_var),
      ter: toNum(f.ter),
      equity_pct: toNum(f.equity_pct), debt_pct: toNum(f.debt_pct),
      cash_pct: toNum(f.cash_pct), net_equity_pct: toNum(f.net_equity_pct),
      large_cap_pct: toNum(f.large_cap_pct), mid_cap_pct: toNum(f.mid_cap_pct),
      small_cap_pct: toNum(f.small_cap_pct),
      holdings_count: toNum(f.holdings_count),
      top_3_pct: toNum(f.top_3_pct), top_5_pct: toNum(f.top_5_pct),
      top_10_pct: toNum(f.top_10_pct), top_20_pct: toNum(f.top_20_pct),
      pe: toNum(f.pe), pb: toNum(f.pb), mkt_cap_cr: toNum(f.mkt_cap_cr),
      ytm: toNum(f.ytm), net_ytm: toNum(f.net_ytm),
      avg_maturity: toNum(f.avg_maturity), duration: toNum(f.duration),
      turnover_cost: toNum(f.turnover_cost),
      aaa_pct: toNum(f.aaa_pct), aa_pct: toNum(f.aa_pct),
      a_pct: toNum(f.a_pct), sov_pct: toNum(f.sov_pct),
      feed_fund_score: toNum(f.feed_fund_score),
      feed_risk_score: toNum(f.feed_risk_score),
      feed_return_score: toNum(f.feed_return_score),
    }));

    // Upsert in batches
    const BATCH = 500;
    let upserted = 0;
    for (let i = 0; i < dedupedRows.length; i += BATCH) {
      const slice = dedupedRows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('pd_fund_research_stats')
        .upsert(slice, { onConflict: 'amfi_code,snapshot_date' });
      if (error) {
        console.error(error.message);
        return NextResponse.json({
          error: `Upsert failed at batch ${i}`,
        }, { status: 500 });
      }
      upserted += slice.length;
    }

    // Log unmatched
    if (unmatched.length > 0) {
      const unmRows = unmatched.map((u) => ({
        source_scheme_name: u.scheme_name_source,
        source_category: u.category,
        source_snapshot_date: snapshotDate!,
        reason: 'fuzzy_match_failed',
      }));
      for (let i = 0; i < unmRows.length; i += BATCH) {
        await supabase.from('pd_fund_research_unmatched').insert(unmRows.slice(i, i + BATCH));
      }
    }

    return NextResponse.json({
      success: true,
      parsed: allFunds.length,
      matched: matched.length,
      deduped: dedupedRows.length,
      upserted,
      unmatched: unmatched.length,
      matchRate: ((matched.length / allFunds.length) * 100).toFixed(1) + '%',
      snapshotDate,
      elapsedSec: Math.round((Date.now() - t0) / 1000),
      unmatchedSample: unmatched.slice(0, 10).map((u) => ({
        scheme: u.scheme_name_source,
        category: u.category,
      })),
    });
  } catch (e) {
    console.error((e as Error).message);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
