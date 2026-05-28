#!/usr/bin/env node
/**
 * Fund Research Stats Importer
 *
 * Reads the Excel research-stats export, fuzzy-matches each fund's
 * scheme name + AMC to pd_fund_master.amfi_code, and upserts into
 * pd_fund_research_stats.
 *
 * Usage:
 *   SUPABASE_URL=https://...supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/import-fund-research-stats.mjs <path-to.xlsx>
 *
 * Or from .env.local in sip-platform/:
 *   node scripts/import-fund-research-stats.mjs <path-to.xlsx>
 */

import { readFileSync } from 'node:fs';
import { resolve as pathResolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import xlsxPkg from 'xlsx';
const XLSX = xlsxPkg;

// ─── Load env (.env.local) ────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const envPath = pathResolve(here, '..', '.env.local');
try {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SVC) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add to .env.local or pass via env.');
  process.exit(1);
}

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error('Usage: node scripts/import-fund-research-stats.mjs <path-to.xlsx>');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SVC, {
  auth: { persistSession: false },
});

// ─── Normalization for fuzzy matching ─────────────────────────
// Both NGEN and AMFI names get normalised to a common form so they can be
// matched. The key insight: NGEN uses abbreviated AMC names (ABSL, ICICI Pru,
// SL) while AMFI uses the full registered names (Aditya Birla Sun Life,
// ICICI Prudential, Sun Life). We collapse BOTH sides to the abbreviation.
function normalizeName(name) {
  if (!name) return '';
  let s = String(name).toLowerCase();

  // Strip parentheticals like "(G)", "(IDCW-D)" etc
  s = s.replace(/\([^)]*\)/g, ' ');

  // Strip common scheme-type tokens.
  // CRITICAL: NGEN uses bare "Regular" / "Reg" / "Regulr" (typo) without
  // "Plan". AMFI uses "Regular Plan" or "- Regular -". We strip ALL bare
  // forms PLUS the compound forms.
  s = s
    .replace(/\bregular\s+plan\b/g, '')
    .replace(/\bdirect\s+plan\b/g, '')
    .replace(/\bgrowth\s+option\b/g, '')
    .replace(/\bgrowth\s+sub\s+option\b/g, '')
    .replace(/\bdiscontinued\s+regular\s+option\b/g, '')
    .replace(/\bdiscontinued\b/g, '')
    // NOTE: do NOT strip a bare "dividend" — many schemes have "Dividend
    // Yield" as part of their scheme name (e.g. "ABSL Dividend Yield Fund").
    .replace(/\bidcw-payout\b|\bidcw-reinvest\b|\bidcw-w\b|\bidcw-m\b|\bidcw-q\b|\bidcw\b/g, '')
    .replace(/\bdividend\s+payout\b|\bdividend\s+reinvest\b|\bdividend\s+option\b/g, '')
    .replace(/\bgrowth\b/g, '')
    .replace(/\boption\b/g, '')
    // Strip BARE regular / direct / reg / regulr (NGEN abbreviations + typos)
    .replace(/\bregulr\b/g, '')
    .replace(/\bregular\b/g, '')
    .replace(/\bdirect\b/g, '')
    .replace(/\breg\b/g, '')
    .replace(/\bplan\b/g, '');

  // Normalize AMC name abbreviations (collapse both NGEN-style and AMFI-style → canonical)
  s = s
    .replace(/\baditya\s+birla\s+sun\s+life\b/g, 'absl')
    .replace(/\baditya\s+birla\s+sl\b/g, 'absl')
    .replace(/\bicici\s+prudential\b/g, 'icicipru')
    .replace(/\bicici\s+pru\b/g, 'icicipru')
    .replace(/\bnippon\s+india\b/g, 'nippon')
    .replace(/\bnippon\b/g, 'nippon')
    .replace(/\bsbi\s+magnum\b/g, 'sbi')
    .replace(/\bkotak\s+mahindra\b/g, 'kotak')
    .replace(/\bfranklin\s+templeton\b/g, 'franklin')
    .replace(/\bfranklin\s+india\b/g, 'franklin')
    .replace(/\bfranklin\b/g, 'franklin')
    .replace(/\bhdfc\s+amc\b/g, 'hdfc')
    .replace(/\bbaroda\s+bnp\s+paribas\b/g, 'barodabnp')
    .replace(/\bbaroda\s+bnp\b/g, 'barodabnp')
    .replace(/\bmahindra\s+manulife\b/g, 'mahindramanulife')
    .replace(/\bsundaram\s+amc\b/g, 'sundaram')
    .replace(/\bpgim\s+india\b/g, 'pgim')
    .replace(/\bdsp\s+blackrock\b/g, 'dsp')
    .replace(/\binvesco\s+india\b/g, 'invesco')
    .replace(/\binvesco\s+oppenheimer\b/g, 'invesco')
    .replace(/\bbnp\s+paribas\b/g, 'bnpparibas')
    .replace(/\bcanara\s+robeco\b/g, 'canararobeco')
    .replace(/\bidfc\b/g, 'bandhan') // IDFC was rebranded to Bandhan
    .replace(/\b360\s+one\b/g, '360one')
    .replace(/\bjm\s+financial\b/g, 'jm')
    .replace(/\bjio\s+blackrock\b/g, 'jioblackrock')
    .replace(/\bbank\s+of\s+india\b/g, 'boi')
    .replace(/\bunion\s+kbc\b/g, 'union')
    .replace(/\bwhiteoak\s+capital\b/g, 'whiteoak')
    .replace(/\baxis\s+mutual\b/g, 'axis')
    .replace(/\bppfas\b|\bparag\s+parikh\b/g, 'ppfas')
    .replace(/\btata\s+amc\b/g, 'tata');

  // Drop the "mutual fund" / "asset management" company suffixes that appear in AMFI but not NGEN
  s = s
    .replace(/\bmutual\s+fund\b/g, '')
    .replace(/\basset\s+management\b/g, '')
    .replace(/\bamc\b/g, '')
    .replace(/\bfund\s+of\s+funds?\b/g, 'fof')
    .replace(/\bfof\b/g, 'fof');

  // Also strip "fund" at the very end — AMFI almost always has " Fund -" but NGEN may not
  // (don't strip mid-name "fund" because some schemes have "Fund" as part of category name)
  // Actually: strip ALL "fund" tokens since they're rarely meaningful for disambiguation
  s = s.replace(/\bfund\b/g, '');

  // Collapse all punctuation + whitespace + abbreviations
  s = s
    .replace(/[-–—•·,.&'"/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

// ─── Excel reading ────────────────────────────────────────────
function parseSheet(workbook, sheetName, sheetType) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true });

  // Locate the FIRST header row (where col 0 === '#') to build column-index map.
  // Subsequent header rows repeat per category — we use this single map.
  let idx = {};
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    if (data[i]?.[0] === '#' || data[i]?.[0] === '# ') {
      data[i].forEach((h, j) => { if (h) idx[String(h).trim()] = j; });
      break;
    }
  }
  if (!idx['Fund Name']) {
    console.warn(`  ! No header row found in sheet ${sheetName}`);
    return [];
  }

  const funds = [];
  let currentCategory = null;
  const SKIP_HEADERS = new Set(['NGEN MARKETS', '#']);
  const SKIP_PHRASES = ['all returns for periods', 'report date', 'fund name'];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const c0 = row[0];
    const c1 = row[1];

    // Real fund row: col 0 is a number (the # serial)
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
      returns_1d: row[idx['1 Day']],
      returns_5d: row[idx['5 Day']],
      returns_mtd: row[idx['MTD']],
      returns_ytd: row[idx['YTD']],
      returns_1m: row[idx['1 Month']],
      returns_3m: row[idx['3 Month']],
      returns_6m: row[idx['6 Month']],
      returns_1y: row[idx['1 Year']],
      returns_2y: row[idx['2 Year']],
      returns_3y: row[idx['3 Year']],
      returns_5y: row[idx['5 Year']],
      returns_7y: row[idx['7 Year']],
      returns_10y: row[idx['10 Year']],
      returns_15y: row[idx['15 Year']],
      returns_since_launch: row[idx['Since Launch']],
      annual_2025: row[idx['2025']],
      annual_2024: row[idx['2024']],
      annual_2023: row[idx['2023']],
      annual_2022: row[idx['2022']],
      annual_2021: row[idx['2021']],
      volatility: row[idx['Volatility']],
      sharpe: row[idx['Sharpe']],
      sortino: row[idx['Sortino']],
      hist_var: row[idx['Hist VaR']],
      imp_var: row[idx['Imp VaR']],
      ter: row[idx['TER']],
      equity_pct: row[idx['Equity %']],
      debt_pct: row[idx['Debt %']],
      cash_pct: row[idx['Cash %']],
      net_equity_pct: row[idx['Net Equity %']],
      large_cap_pct: row[idx['Large Cap %']],
      mid_cap_pct: row[idx['Mid Cap %']],
      small_cap_pct: row[idx['Small Cap %']],
      holdings_count: row[idx['Holdings']],
      top_3_pct: row[idx['Top 3 %']],
      top_5_pct: row[idx['Top 5 %']],
      top_10_pct: row[idx['Top 10 %']],
      top_20_pct: row[idx['Top 20 %']],
      pe: row[idx['P/E']],
      pb: row[idx['P/B']],
      mkt_cap_cr: row[idx['Mkt Cap (Cr)']],
      ytm: row[idx['YTM']],
      net_ytm: row[idx['Net YTM']],
      avg_maturity: row[idx['Avg Maturity']],
      duration: row[idx['Duration']],
      turnover_cost: row[idx['Turn. Cost']],
      aaa_pct: row[idx['AAA %']],
      aa_pct: row[idx['AA %']],
      a_pct: row[idx['A %']],
      sov_pct: row[idx['SOV %']],
      feed_fund_score: row[idx['NGEN Fund Score']],
      feed_risk_score: row[idx['NGEN Risk Score']],
      feed_return_score: row[idx['NGEN Return Score']],
      });
      continue;
    }

    // Category header: col 0 is a string, col 1 is empty/null AND it's not one of the masthead lines
    if (typeof c0 === 'string' && (c1 == null || c1 === '')) {
      const t = c0.trim();
      if (!t || SKIP_HEADERS.has(t)) continue;
      const lower = t.toLowerCase();
      if (SKIP_PHRASES.some(p => lower.startsWith(p))) continue;
      currentCategory = t;
      continue;
    }

    // Header row repetition (col 0 === '#') — already captured idx from first one; ignore
    // Category Average row (col 1 starts with that) — skip
    // All other rows — skip silently
  }
  return funds;
}

// Convert Excel date-serial or JS date to YYYY-MM-DD
function toIsoDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel serial date: days since 1899-12-30
    const date = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
}

function toNum(v) {
  if (v == null || v === '' || v === 'NA' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Fuzzy match against pd_fund_master ───────────────────────
async function loadFundMaster() {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, scheme_name, amc_name')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`Loaded ${all.length} rows from pd_fund_master`);
  return all;
}

// Build a normalized lookup index
function buildIndex(masterRows) {
  const byNormName = new Map();
  for (const row of masterRows) {
    const key = normalizeName(row.scheme_name);
    if (!byNormName.has(key)) byNormName.set(key, []);
    byNormName.get(key).push({ ...row, norm: key });
  }
  return byNormName;
}

// Build a flat list of {row, norm} for token-overlap fallback
function buildFlatIndex(masterRows) {
  return masterRows.map((row) => ({ ...row, norm: normalizeName(row.scheme_name) }));
}

// Pick the "Regular Growth" variant out of multiple plan options for a fund
function preferRegularGrowth(candidates) {
  // The AMFI scheme names include " - Regular " / " - Direct " / "- Growth"
  // explicitly even though normalisation strips them. Use the ORIGINAL
  // scheme name to disambiguate.
  const isRegular = (c) => !/\bdirect\b/i.test(c.scheme_name);
  const isGrowth = (c) => /\bgrowth\b/i.test(c.scheme_name) && !/\bidcw\b|\bdividend\b/i.test(c.scheme_name);
  const both = candidates.find((c) => isRegular(c) && isGrowth(c));
  if (both) return both;
  const reg = candidates.find(isRegular);
  if (reg) return reg;
  const grow = candidates.find(isGrowth);
  if (grow) return grow;
  return candidates[0];
}

// Try to match a NGEN fund to an amfi_code using a multi-stage strategy.
// Returns the matched master row, or null.
function matchFund(ngenFund, index, flatIndex) {
  const norm = normalizeName(ngenFund.scheme_name_source);
  if (!norm) return null;

  // Stage 1: exact normalised name
  const exact = index.get(norm) || [];
  if (exact.length > 0) return preferRegularGrowth(exact);

  // Stage 2: drop the first 1-3 leading tokens (handles unrecognised AMC abbreviation)
  const tokens = norm.split(' ');
  for (let drop = 1; drop <= 3 && drop < tokens.length; drop++) {
    const reduced = tokens.slice(drop).join(' ');
    const arr = index.get(reduced);
    if (arr && arr.length > 0) return preferRegularGrowth(arr);
  }

  // Stage 3: token-set overlap — find AMFI fund where ALL ngen tokens (len>2)
  // appear in the AMFI tokens, AND the first token (likely AMC) matches.
  const ngenTokens = new Set(tokens.filter((t) => t.length > 2));
  if (ngenTokens.size === 0) return null;
  const ngenFirstToken = tokens[0];

  let best = { row: null, score: -1 };
  for (const f of flatIndex) {
    const fTokens = new Set(f.norm.split(' ').filter((t) => t.length > 2));
    // Require AMC token (first ngen token) to be present in AMFI tokens
    if (!fTokens.has(ngenFirstToken)) continue;
    // Score = number of ngen tokens that appear in AMFI tokens
    let score = 0;
    for (const t of ngenTokens) if (fTokens.has(t)) score++;
    // Require >= 60% of ngen tokens to overlap
    if (score / ngenTokens.size < 0.6) continue;
    // Penalise excess AMFI tokens (we want closest length match)
    const excess = Math.max(0, fTokens.size - ngenTokens.size);
    const adjScore = score - excess * 0.25;
    if (adjScore > best.score) {
      best = { row: f, score: adjScore };
    }
  }
  if (best.row) return best.row;

  return null;
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log(`Reading ${xlsxPath}...`);
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  console.log(`Sheets: ${wb.SheetNames.join(', ')}`);

  const allFunds = [
    ...parseSheet(wb, 'Equity', 'equity'),
    ...parseSheet(wb, 'Debt', 'debt'),
    ...parseSheet(wb, 'Hybrid', 'hybrid'),
    ...parseSheet(wb, 'Other', 'other'),
    ...parseSheet(wb, 'Solution Oriented', 'solution_oriented'),
  ];
  console.log(`Parsed ${allFunds.length} funds total.`);

  // Snapshot date — use latest NAV Date in file
  let snapshotDate = null;
  for (const f of allFunds) {
    const d = toIsoDate(f.nav_date);
    if (d && (!snapshotDate || d > snapshotDate)) snapshotDate = d;
  }
  snapshotDate = snapshotDate || new Date().toISOString().slice(0, 10);
  console.log(`Snapshot date: ${snapshotDate}`);

  const master = await loadFundMaster();
  const index = buildIndex(master);
  const flatIndex = buildFlatIndex(master);

  const matched = [];
  const unmatched = [];
  for (const f of allFunds) {
    const hit = matchFund(f, index, flatIndex);
    if (hit) matched.push({ ...f, amfi_code: hit.amfi_code });
    else unmatched.push(f);
  }
  console.log(`Matched: ${matched.length} / ${allFunds.length} (${((matched.length / allFunds.length) * 100).toFixed(1)}%)`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (process.argv.includes('--dry-run') || process.argv.includes('--debug-unmatched')) {
    console.log('\n--- First 30 unmatched funds with normalized form + closest AMFI candidate ---');
    // Build a flat list of all AMFI names with their normalized forms for substring lookup
    const masterNorms = master.map(m => ({ ...m, norm: normalizeName(m.scheme_name) }));
    for (const u of unmatched.slice(0, 30)) {
      const ngenNorm = normalizeName(u.scheme_name_source);
      // Find closest AMFI fund by token overlap
      const tokens = new Set(ngenNorm.split(' ').filter(t => t.length > 2));
      let best = { row: null, score: 0 };
      for (const m of masterNorms) {
        const mTokens = new Set(m.norm.split(' ').filter(t => t.length > 2));
        const intersection = [...tokens].filter(t => mTokens.has(t)).length;
        if (intersection > best.score) best = { row: m, score: intersection };
      }
      console.log(`\n  NGEN: "${u.scheme_name_source}"`);
      console.log(`        norm → "${ngenNorm}"`);
      if (best.row) {
        console.log(`  AMFI: "${best.row.scheme_name}" (overlap ${best.score})`);
        console.log(`        norm → "${best.row.norm}"`);
      }
    }
    console.log('\n--dry-run: not writing to DB.');
    return;
  }

  // ─── Upsert matched rows in batches of 500 ──────────────────
  const BATCH = 500;
  const rows = matched.map((f) => ({
    amfi_code: f.amfi_code,
    snapshot_date: snapshotDate,
    source: 'manual',
    external_category: f.category,
    launch_date: toIsoDate(f.launch_date),
    current_nav: toNum(f.nav),
    nav_date: toIsoDate(f.nav_date),
    aum_inr_cr: toNum(f.aum_inr_cr),
    riskometer: f.riskometer || null,
    returns_1d: toNum(f.returns_1d),
    returns_5d: toNum(f.returns_5d),
    returns_mtd: toNum(f.returns_mtd),
    returns_ytd: toNum(f.returns_ytd),
    returns_1m: toNum(f.returns_1m),
    returns_3m: toNum(f.returns_3m),
    returns_6m: toNum(f.returns_6m),
    returns_1y: toNum(f.returns_1y),
    returns_2y: toNum(f.returns_2y),
    returns_3y: toNum(f.returns_3y),
    returns_5y: toNum(f.returns_5y),
    returns_7y: toNum(f.returns_7y),
    returns_10y: toNum(f.returns_10y),
    returns_15y: toNum(f.returns_15y),
    returns_since_launch: toNum(f.returns_since_launch),
    annual_2025: toNum(f.annual_2025),
    annual_2024: toNum(f.annual_2024),
    annual_2023: toNum(f.annual_2023),
    annual_2022: toNum(f.annual_2022),
    annual_2021: toNum(f.annual_2021),
    volatility: toNum(f.volatility),
    sharpe: toNum(f.sharpe),
    sortino: toNum(f.sortino),
    hist_var: toNum(f.hist_var),
    imp_var: toNum(f.imp_var),
    ter: toNum(f.ter),
    equity_pct: toNum(f.equity_pct),
    debt_pct: toNum(f.debt_pct),
    cash_pct: toNum(f.cash_pct),
    net_equity_pct: toNum(f.net_equity_pct),
    large_cap_pct: toNum(f.large_cap_pct),
    mid_cap_pct: toNum(f.mid_cap_pct),
    small_cap_pct: toNum(f.small_cap_pct),
    holdings_count: toNum(f.holdings_count),
    top_3_pct: toNum(f.top_3_pct),
    top_5_pct: toNum(f.top_5_pct),
    top_10_pct: toNum(f.top_10_pct),
    top_20_pct: toNum(f.top_20_pct),
    pe: toNum(f.pe),
    pb: toNum(f.pb),
    mkt_cap_cr: toNum(f.mkt_cap_cr),
    ytm: toNum(f.ytm),
    net_ytm: toNum(f.net_ytm),
    avg_maturity: toNum(f.avg_maturity),
    duration: toNum(f.duration),
    turnover_cost: toNum(f.turnover_cost),
    aaa_pct: toNum(f.aaa_pct),
    aa_pct: toNum(f.aa_pct),
    a_pct: toNum(f.a_pct),
    sov_pct: toNum(f.sov_pct),
    feed_fund_score: toNum(f.feed_fund_score),
    feed_risk_score: toNum(f.feed_risk_score),
    feed_return_score: toNum(f.feed_return_score),
  }));

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('pd_fund_research_stats')
      .upsert(slice, { onConflict: 'amfi_code,snapshot_date' });
    if (error) {
      console.error(`Batch ${i}-${i + slice.length}: ${error.message}`);
      process.exit(3);
    }
    console.log(`Upserted ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }

  // ─── Log unmatched ──────────────────────────────────────────
  if (unmatched.length > 0) {
    const unmRows = unmatched.map((u) => ({
      source_scheme_name: u.scheme_name_source,
      source_category: u.category,
      source_snapshot_date: snapshotDate,
      reason: 'fuzzy_match_failed',
    }));
    for (let i = 0; i < unmRows.length; i += BATCH) {
      const slice = unmRows.slice(i, i + BATCH);
      const { error } = await supabase.from('pd_fund_research_unmatched').insert(slice);
      if (error) console.error(`Unmatched log batch ${i}: ${error.message}`);
    }
    console.log(`Logged ${unmRows.length} unmatched funds to pd_fund_research_unmatched.`);
  }

  console.log('\n✓ Import complete.');
  console.log(`  Snapshot: ${snapshotDate}`);
  console.log(`  Matched + upserted: ${matched.length}`);
  console.log(`  Unmatched (logged): ${unmatched.length}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
