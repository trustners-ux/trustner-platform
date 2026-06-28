/**
 * AMC / AMFI monthly portfolio-disclosure parser (look-through data layer).
 *
 * SEBI mandates a standardised monthly portfolio disclosure; every AMC publishes
 * an Excel whose holdings block follows the same shape:
 *
 *   Name of the Instrument | ISIN | Industry/Rating | Quantity | Market Value | % to NAV
 *
 * Real files vary in header wording, a few preamble rows, and multiple section
 * blocks (equity, debt, derivatives, cash, TREPS). This parser is format-tolerant:
 * it sniffs the header row by keyword, maps columns positionally, classifies each
 * instrument, and stops at the totals row. One worksheet → normalised rows.
 *
 * Phase-6 prototype: the PARSER is built + unit-tested; live monthly ingestion
 * (resolving each AMC's current file URL — they are JS-gated dropdowns, not static
 * links) is the documented next step. See the Phase-6 decision memo.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import * as XLSX from 'xlsx';

export interface ParsedHoldingRow {
  stockName: string;
  isin: string | null;
  instrumentType: 'equity' | 'debt' | 'cash' | 'derivative' | 'reit' | 'other';
  sector: string | null;
  pctOfAum: number | null;
  marketValueInr: number | null;
}

const HEADER_HINTS = {
  name: /name of the instrument|instrument|security|scrip|company|particular/i,
  isin: /isin/i,
  industry: /industry|rating|sector/i,
  qty: /quantity|qty|units|no\.? of shares/i,
  value: /market\s*value|fair value|value.*lakh|value.*cr|amount/i,
  // SBI uses "% to AUM", most use "% to NAV", a few "% to Net Assets".
  pct: /%\s*(to|of)\s*(nav|net asset|aum)|% to net|percentage/i,
};

function norm(v: unknown): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/[,%\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function classify(name: string, isin: string | null): ParsedHoldingRow['instrumentType'] {
  const n = name.toLowerCase();
  if (/treps|tri-?party|reverse repo|net receivable|cash|deposit|margin/.test(n)) return 'cash';
  if (/futures?|options?|derivative/.test(n)) return 'derivative';
  if (/reit|invit/.test(n)) return 'reit';
  // Debt FIRST — a coupon-rate prefix ("7.10% GOI 2034"), sovereign G-Sec ISINs
  // (IN0...), or debt keywords win over the equity ISIN default.
  if (/^\s*\d{1,2}\.?\d{0,2}\s*%/.test(name)) return 'debt';
  if (isin && /^IN0/i.test(isin)) return 'debt';
  if (/\bgoi\b|govt|government|g-?sec|gilt|sdl|t-?bill|treasury|bond|debenture|commercial paper|certificate of deposit|\bncd\b|sovereign/.test(n)) return 'debt';
  if (isin && /^INF/i.test(isin)) return 'debt'; // MF-of-MF / debt ISIN prefix
  if (isin && /^INE/i.test(isin)) return 'equity';
  return isin ? 'equity' : 'other';
}

/** Find the header row index + a positional column map within a sheet matrix. */
function locateHeader(rows: unknown[][]): { idx: number; col: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const cells = rows[i].map(norm);
    const joined = cells.join(' | ').toLowerCase();
    if (HEADER_HINTS.name.test(joined) && (HEADER_HINTS.pct.test(joined) || HEADER_HINTS.value.test(joined))) {
      const col: Record<string, number> = {};
      cells.forEach((c, j) => {
        const lc = c.toLowerCase();
        if (col.name == null && HEADER_HINTS.name.test(lc)) col.name = j;
        else if (col.isin == null && HEADER_HINTS.isin.test(lc)) col.isin = j;
        else if (col.industry == null && HEADER_HINTS.industry.test(lc)) col.industry = j;
        else if (col.value == null && HEADER_HINTS.value.test(lc)) col.value = j;
        else if (col.pct == null && HEADER_HINTS.pct.test(lc)) col.pct = j;
      });
      if (col.name != null) return { idx: i, col };
    }
  }
  return null;
}

/** Parse one worksheet's holdings block. Returns [] if no header is found. */
export function parseWorksheetHoldings(rows: unknown[][]): ParsedHoldingRow[] {
  const head = locateHeader(rows);
  if (!head) return [];
  const out: ParsedHoldingRow[] = [];
  for (let i = head.idx + 1; i < rows.length; i++) {
    const r = rows[i];
    const name = norm(r[head.col.name]);
    if (!name) continue;
    // stop at the section/grand totals row
    if (/^(grand\s+)?total|sub\s*total|net (current )?assets|portfolio total/i.test(name)) continue;
    const isinRaw = head.col.isin != null ? norm(r[head.col.isin]) : '';
    const isin = /^IN[EF][A-Z0-9]{9}$/i.test(isinRaw) ? isinRaw.toUpperCase() : null;
    const pct = head.col.pct != null ? toNumber(r[head.col.pct]) : null;
    const value = head.col.value != null ? toNumber(r[head.col.value]) : null;
    // skip pure header echoes / blank instrument rows
    if (pct == null && value == null && !isin) continue;
    out.push({
      stockName: name,
      isin,
      instrumentType: classify(name, isin),
      sector: head.col.industry != null ? (norm(r[head.col.industry]) || null) : null,
      pctOfAum: pct,
      marketValueInr: value,
    });
  }
  return out;
}

/** Parse a full AMC portfolio workbook buffer → normalised rows (all sheets merged). */
export function parseAmcPortfolioWorkbook(buffer: Buffer | ArrayBuffer): ParsedHoldingRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const all: ParsedHoldingRow[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
    all.push(...parseWorksheetHoldings(rows));
  }
  return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-scheme attribution (for monthly AMC files that pack MANY schemes into one
// workbook — needed to upsert pd_fund_holdings one scheme at a time). An AMC file
// comes in three shapes, all handled here:
//   (a) one sheet per scheme  → scheme name from the sheet name / title row
//   (b) one sheet, schemes stacked, each under its own title + header block
//   (c) one file = one scheme → single block, name from the title row / sheet
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedSchemePortfolio {
  schemeName: string;
  asOfDate: string | null; // ISO yyyy-mm-dd (portfolio month-end), best-effort
  rows: ParsedHoldingRow[];
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/** Excel serial date → ISO yyyy-mm-dd (1900 system; offset 25569 already absorbs
 *  the 1900 leap-year bug for serials > 60). Pure UTC arithmetic — TZ-safe. */
function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 30000 || serial > 80000) return null; // ~1982..2119
  const d = new Date(Math.round((serial - 25569) * 86400000)); // days from 1900→1970 epoch
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Best-effort portfolio month-end from a sheet's preamble. Handles strings,
 *  JS Date cells (cellDates:true), and bare Excel serials next to "as on". */
export function detectAsOfDate(rows: unknown[][]): string | null {
  const scan = rows.slice(0, 25);

  // 1) A bare Excel serial (or Date cell) in a date-ish row, e.g.
  //    "PORTFOLIO STATEMENT AS ON :" │ 46173.
  for (const r of scan) {
    const rowText = r.map(norm).join(' ').toLowerCase();
    const dateish = /as\s*(on|at|of)|statement|portfolio/.test(rowText);
    if (!dateish) continue;
    for (const c of r) {
      if (c instanceof Date && !isNaN(c.getTime())) {
        return `${c.getUTCFullYear()}-${String(c.getUTCMonth() + 1).padStart(2, '0')}-${String(c.getUTCDate()).padStart(2, '0')}`;
      }
      if (typeof c === 'number') { const iso = excelSerialToIso(c); if (iso) return iso; }
      if (typeof c === 'string' && /^\d{5}$/.test(c.trim())) { const iso = excelSerialToIso(Number(c)); if (iso) return iso; }
    }
  }

  // 2) String date patterns.
  const head = scan.map((r) => r.map(norm).join(' ')).join(' │ ');
  // "as on 31-May-2026" / "as at 31 May 2026"
  let m = head.match(/as\s*(?:on|at|of)\s*:?\s*(?:[a-z]{3,9},?\s+)?(\d{1,2})[-\s/]([A-Za-z]{3,9})[-\s/,]*\s*(\d{4})/i);
  if (m) { const mo = MONTHS[m[2].slice(0, 3).toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2, '0')}`; }
  // "as on May 31, 2026" (optionally with a leading weekday)
  m = head.match(/as\s*(?:on|at|of)\s*:?\s*(?:[a-z]{3,9}\s+)?([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})/i);
  if (m) { const mo = MONTHS[m[1].slice(0, 3).toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2, '0')}`; }
  // bare "31/05/2026" or "31-05-2026" (dd mm yyyy)
  m = head.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

/** Explicit "SCHEME NAME :" marker (SBI/ICICI style) → scheme. */
function detectSheetScheme(rows: unknown[][]): string | null {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const cells = rows[i].map(norm);
    const idx = cells.findIndex((c) => /^scheme name\b/i.test(c));
    if (idx >= 0) {
      const same = cells[idx].replace(/^scheme name\s*:?\s*/i, '').trim();
      if (same) return cleanScheme(same);
      const after = cells.slice(idx + 1).find(Boolean);
      if (after) return cleanScheme(after);
    }
  }
  return null;
}

/** All header-row indices in a sheet (a stacked file repeats the header per scheme). */
function locateAllHeaders(rows: unknown[][]): Array<{ idx: number; col: Record<string, number> }> {
  const out: Array<{ idx: number; col: Record<string, number> }> = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(norm);
    const joined = cells.join(' | ').toLowerCase();
    if (HEADER_HINTS.name.test(joined) && (HEADER_HINTS.pct.test(joined) || HEADER_HINTS.value.test(joined))) {
      const col: Record<string, number> = {};
      cells.forEach((c, j) => {
        const lc = c.toLowerCase();
        if (col.name == null && HEADER_HINTS.name.test(lc)) col.name = j;
        else if (col.isin == null && HEADER_HINTS.isin.test(lc)) col.isin = j;
        else if (col.industry == null && HEADER_HINTS.industry.test(lc)) col.industry = j;
        else if (col.value == null && HEADER_HINTS.value.test(lc)) col.value = j;
        else if (col.pct == null && HEADER_HINTS.pct.test(lc)) col.pct = j;
      });
      if (col.name != null) out.push({ idx: i, col });
    }
  }
  return out;
}

// Rows that look like a scheme title but are actually preamble / section noise.
const TITLE_EXCLUDE = /portfolio statement|monthly portfolio|as\s*(on|at|of)\b|statement of|disclosure|^notes?\b|page \d|^total|sub\s*total|net (current )?assets|continued|annexure|^index\b|mutual fund$|equity\s*&|equity shares|debt instrument|money market|listed\s*\/|awaiting list|exchange traded|mutual fund units|treps|reverse repo|derivativ|government securit|^cash\b|preference shares|warrants?|details of|repo transaction|riskometer|yield to maturity|portfolio turnover|total exposure|the scheme (has|does|may|invest)|^\(.*\)$/i;
// A scheme title almost always carries one of these scheme-type words.
const TITLE_SCHEMEISH = /\bfund\b|\bscheme\b|\bplan\b|\bportfolio of\b/i;

// A scheme code prepended to the name ("RLMF001 Nippon India Growth Fund") and a
// "Back to Index" hyperlink suffix are noise that drags down name-matching.
const CODE_PREFIX = /^[A-Z0-9]*\d[A-Z0-9]*\s+(?=[A-Za-z])/; // leading token with a digit, then a word
const BACKLINK_SUFFIX = /\s*\b(back to )?index\b\s*$/i;

function cleanScheme(name: string): string {
  return name
    .replace(/^scheme name\s*:?\s*/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ') // drop the SEBI parenthetical ("(Mid Cap Fund- …)", "(erstwhile …)")
    .replace(BACKLINK_SUFFIX, '')
    .replace(CODE_PREFIX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nearest scheme-like title above `headerIdx`, or null if none looks scheme-like.
 *  The raw cell can be long (code + name + a wrapped SEBI description) — clean it
 *  FIRST, then judge: the scheme name itself is always short. */
function findSchemeTitle(rows: unknown[][], headerIdx: number, lowerBound: number): string | null {
  for (let i = headerIdx - 1; i >= lowerBound; i--) {
    const cells = rows[i].map(norm).filter(Boolean);
    if (cells.length === 0) continue;
    const text = cells.join(' ');
    if (TITLE_EXCLUDE.test(text)) continue;
    const cleaned = cleanScheme(text);
    if (TITLE_SCHEMEISH.test(cleaned) && /[a-z]/i.test(cleaned) && cleaned.length > 0 && cleaned.length < 90) {
      return cleaned;
    }
  }
  return null;
}

/** Some AMCs publish "% to NAV" as a FRACTION (0.0332) not a percent (3.32). A
 *  scheme's weights sum to ~1.0 (fractions) or ~100 (percents) — scale fractions up. */
function normalizeSchemePct(rows: ParsedHoldingRow[]): void {
  const sum = rows.reduce((s, r) => s + Math.abs(r.pctOfAum ?? 0), 0);
  if (sum > 0 && sum < 5) for (const r of rows) if (r.pctOfAum != null) r.pctOfAum = r.pctOfAum * 100;
}

/** Parse holding rows for the block (headerIdx, col) up to the next block start. */
function parseBlock(rows: unknown[][], header: { idx: number; col: Record<string, number> }, endIdx: number): ParsedHoldingRow[] {
  const out: ParsedHoldingRow[] = [];
  for (let i = header.idx + 1; i < endIdx; i++) {
    const r = rows[i];
    const name = norm(r[header.col.name]);
    if (!name) continue;
    if (/^(grand\s+)?total|sub\s*total|net (current )?assets|portfolio total/i.test(name)) continue;
    const isinRaw = header.col.isin != null ? norm(r[header.col.isin]) : '';
    const isin = /^IN[EF][A-Z0-9]{9}$/i.test(isinRaw) ? isinRaw.toUpperCase() : null;
    const pct = header.col.pct != null ? toNumber(r[header.col.pct]) : null;
    const value = header.col.value != null ? toNumber(r[header.col.value]) : null;
    if (pct == null && value == null && !isin) continue;
    out.push({
      stockName: name,
      isin,
      instrumentType: classify(name, isin),
      sector: header.col.industry != null ? (norm(r[header.col.industry]) || null) : null,
      pctOfAum: pct,
      marketValueInr: value,
    });
  }
  return out;
}

/**
 * Parse an AMC monthly workbook into PER-SCHEME portfolios. This is what the
 * ingestion pipeline uses (each group → fuzzy-match scheme→amfi_code → upsert).
 */
export function parseAmcPortfolioWorkbookGrouped(buffer: Buffer | ArrayBuffer): ParsedSchemePortfolio[] {
  // Raw read (no cellDates) — keep the "as on" cell as a bare serial so
  // excelSerialToIso converts it TZ-safely (cellDates Date objects shift a day in IST).
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const out: ParsedSchemePortfolio[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
    if (rows.length === 0) continue;
    const asOf = detectAsOfDate(rows);
    const headers = locateAllHeaders(rows);
    if (headers.length === 0) continue;

    // Scheme-like title above each header block (null if it's just a section label).
    const titles = headers.map((h, i) =>
      findSchemeTitle(rows, h.idx, i === 0 ? 0 : headers[i - 1].idx + 1)
    );
    const explicit = detectSheetScheme(rows);
    const topScheme =
      explicit || titles[0] || (TITLE_SCHEMEISH.test(sheetName) ? cleanScheme(sheetName) : null);

    // ── ONE scheme per sheet (SBI/Nippon: headers repeat per equity/debt/MM
    // section) UNLESS a LATER header carries its OWN distinct scheme title (a
    // genuine stacked-multi-scheme sheet). Merge avoids phantom schemes. ──
    const laterHaveOwnTitles = titles.slice(1).some((t) => t && t !== titles[0]);

    if (!laterHaveOwnTitles && topScheme) {
      const merged: ParsedHoldingRow[] = [];
      for (let h = 0; h < headers.length; h++) {
        merged.push(...parseBlock(rows, headers[h], h + 1 < headers.length ? headers[h + 1].idx : rows.length));
      }
      if (merged.length > 0) {
        normalizeSchemePct(merged);
        out.push({ schemeName: topScheme, asOfDate: asOf, rows: merged });
      }
      continue;
    }

    // ── Stacked-multi: each header block is its own scheme. ──
    const fallback = sheetName.trim();
    for (let h = 0; h < headers.length; h++) {
      const blockEnd = h + 1 < headers.length ? headers[h + 1].idx : rows.length;
      const scheme = titles[h] || `${fallback}${headers.length > 1 ? ` (${h + 1})` : ''}`;
      const blockRows = parseBlock(rows, headers[h], blockEnd);
      if (blockRows.length === 0) continue;
      normalizeSchemePct(blockRows);
      out.push({ schemeName: scheme, asOfDate: asOf, rows: blockRows });
    }
  }
  return out;
}
