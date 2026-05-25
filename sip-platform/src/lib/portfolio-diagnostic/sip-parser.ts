/**
 * SIP File Parser — accepts XLSX, CSV, or PDF SIP listings and returns
 * normalized RawSip[] for the diagnostic upload flow.
 *
 * Supported input shapes (all normalize to the same RawSip array):
 *
 *   1. Trustner "My SIP's" XLSX export
 *        Row 1-3:  Firm header + client + date metadata
 *        Row 4:    | SR NO | INVESTOR | SCHEME | FOLIO | <MMM YY> | <MMM YY> ... |
 *        Row 5+:   | 1     | NAME     | scheme | folio | 0        | 2000   ...  |
 *        Last:     | Total | ...                                | 12498        |
 *
 *      The right-most non-zero monthly column is the current SIP amount.
 *      If the latest month is 0 but a prior month had a value, the SIP
 *      is flagged as Stopped (so the diagnostic engine surfaces it).
 *
 *   2. Generic CSV — same column layout as the XLSX
 *
 *   3. PDF of the "My SIP's" report — text extraction + same regex
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import * as XLSX from 'xlsx';
import { extractText, getDocumentProxy } from 'unpdf';
import type { RawSip, SipFrequency } from './types';

export interface SipParseResult {
  success: boolean;
  error?: string;
  sips: RawSip[];
  totalRows: number;
  /** Free-text warnings shown to the planner (e.g., "3 stopped SIPs flagged"). */
  warnings: string[];
  /** What we detected the file as. */
  detectedFormat: 'xlsx' | 'csv' | 'pdf' | 'unknown';
}

const EMPTY_RESULT: SipParseResult = {
  success: false,
  sips: [],
  totalRows: 0,
  warnings: [],
  detectedFormat: 'unknown',
};

// ─────────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────────

/**
 * Parse a SIP file. Dispatches on extension/MIME, falls back to byte
 * sniffing if MIME is misleading (some browsers report XLSX as
 * application/octet-stream).
 */
export async function parseSipFile(input: {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
}): Promise<SipParseResult> {
  const lower = input.filename.toLowerCase();

  // Byte-sniff for PDF since some browsers misreport
  const isPdfBytes = input.buffer.length >= 4 && input.buffer.subarray(0, 4).toString('ascii') === '%PDF';
  // XLSX/ZIP starts with "PK"
  const isZipBytes = input.buffer.length >= 2 && input.buffer.subarray(0, 2).toString('ascii') === 'PK';

  try {
    if (isPdfBytes || lower.endsWith('.pdf') || input.mimeType === 'application/pdf') {
      return await parseSipPdf(input.buffer);
    }
    if (isZipBytes || lower.endsWith('.xlsx') || lower.endsWith('.xls') ||
        input.mimeType?.includes('spreadsheet')) {
      return parseSipXlsx(input.buffer);
    }
    if (lower.endsWith('.csv') || input.mimeType === 'text/csv') {
      return parseSipCsv(input.buffer.toString('utf-8'));
    }
    return { ...EMPTY_RESULT, error: `Unsupported file type: ${input.filename}` };
  } catch (e) {
    return {
      ...EMPTY_RESULT,
      error: `Parse error: ${(e as Error).message}`,
      detectedFormat: isPdfBytes ? 'pdf' : isZipBytes ? 'xlsx' : 'unknown',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// XLSX PARSER
// ─────────────────────────────────────────────────────────────────

function parseSipXlsx(buffer: Buffer): SipParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    return { ...EMPTY_RESULT, detectedFormat: 'xlsx', error: 'XLSX has no sheets' };
  }
  const sheet = wb.Sheets[firstSheetName];

  // Convert to 2D array of cell values (header: 1 returns array-of-arrays)
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  return parseRows(aoa as unknown[][], 'xlsx');
}

// ─────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────

function parseSipCsv(text: string): SipParseResult {
  // Simple CSV — assumes commas, supports quoted strings with embedded commas
  const rows: string[][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < rawLine.length; i++) {
      const ch = rawLine[i];
      if (ch === '"' && rawLine[i - 1] !== '\\') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.replace(/^"|"$/g, '').trim()));
  }
  return parseRows(rows, 'csv');
}

// ─────────────────────────────────────────────────────────────────
// PDF PARSER (text extraction of the "My SIP's" PDF report)
// ─────────────────────────────────────────────────────────────────

async function parseSipPdf(buffer: Buffer): Promise<SipParseResult> {
  const uint8 = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8);
  const { text: pages } = await extractText(pdf, { mergePages: true });
  const text = Array.isArray(pages) ? pages.join('\n') : String(pages);

  if (!/My\s+SIP/i.test(text) && !/SR\s*NO/i.test(text)) {
    return {
      ...EMPTY_RESULT,
      detectedFormat: 'pdf',
      error: 'PDF does not look like a Trustner SIP report (missing "My SIP" header or SR NO column)',
    };
  }

  // Find header row to determine number of month columns
  const headerMatch = text.match(/SR\s*NO\.?[^A-Za-z]*INVESTOR[^A-Za-z]*SCHEME[^A-Za-z]*FOLIO\s*((?:\s*[A-Z]{3}\s*\d{2,4})+)/i);
  const monthCols = headerMatch ? headerMatch[1].trim().split(/\s+/).filter((s) => /[A-Z]{3}/i.test(s)) : [];

  // Per-row extraction. PDF text often loses table structure — anchor on
  // sequence number at start of line and amount at end.
  const lines = text.split(/\n/);
  const rows: string[][] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip headers / footers
    if (/^(Trustner|My SIP|Client:|Relationship Manager|Report printed|SR\s*NO|Total)/i.test(trimmed)) continue;
    // Row: digit(s) at start, then content, then trailing amounts
    const rowMatch = trimmed.match(/^(\d{1,3})\s+([A-Z][A-Z\s&.]+?)\s+(.+?(?:\(G\)|\(D\)|\(IDCW\)|Fund))\s+([\w/\-]+)\s+(.+)$/);
    if (rowMatch) {
      const [, sr, investor, scheme, folio, amountTail] = rowMatch;
      // Pull trailing numbers (one per month column)
      const nums = amountTail.split(/\s+/).filter((s) => /^-?[\d,]+(?:\.\d+)?$/.test(s));
      rows.push([sr, investor, scheme, folio, ...nums]);
    }
  }

  // Synthesize the same shape parseRows expects: header at index 3 then data
  const synthetic: unknown[][] = [
    ['Trustner SIP PDF'],
    ['Client / source unknown'],
    ['Detected via PDF text extraction'],
    ['SR NO.', 'INVESTOR', 'SCHEME', 'FOLIO', ...monthCols.length > 0 ? monthCols : rows[0] ? rows[0].slice(4).map((_, i) => `M${i + 1}`) : []],
    ...rows,
  ];
  return parseRows(synthetic, 'pdf');
}

// ─────────────────────────────────────────────────────────────────
// SHARED ROW PARSER — works on 2D array regardless of source
// ─────────────────────────────────────────────────────────────────

interface RowParseContext {
  headerRowIdx: number;
  schemeCol: number;
  investorCol: number;
  folioCol: number;
  firstMonthCol: number;
  monthHeaders: string[];
}

function parseRows(rows: unknown[][], detectedFormat: 'xlsx' | 'csv' | 'pdf'): SipParseResult {
  // 1) Find the header row — the row containing "SR NO" / "INVESTOR" / "SCHEME"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const cells = rows[i].map(cellStr);
    const joined = cells.join('|').toUpperCase();
    if (joined.includes('INVESTOR') && joined.includes('SCHEME')) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) {
    return {
      ...EMPTY_RESULT,
      detectedFormat,
      error: 'Could not find a row with both "INVESTOR" and "SCHEME" — not a recognized SIP file layout.',
    };
  }

  const headerCells = rows[headerRowIdx].map(cellStr);
  const investorCol = headerCells.findIndex((c) => /INVESTOR/i.test(c));
  const schemeCol = headerCells.findIndex((c) => /SCHEME/i.test(c));
  const folioCol = headerCells.findIndex((c) => /FOLIO/i.test(c));
  // Month columns are anything that looks like "MMM YY" or "MMM YYYY"
  const monthColIndices: number[] = [];
  for (let i = 0; i < headerCells.length; i++) {
    if (/^\s*[A-Z]{3}\s*\d{2,4}\s*$/i.test(headerCells[i])) monthColIndices.push(i);
  }
  if (schemeCol === -1 || investorCol === -1 || monthColIndices.length === 0) {
    return {
      ...EMPTY_RESULT,
      detectedFormat,
      error: `Header row found but missing required columns. scheme=${schemeCol}, investor=${investorCol}, months=${monthColIndices.length}.`,
    };
  }

  const ctx: RowParseContext = {
    headerRowIdx,
    schemeCol,
    investorCol,
    folioCol,
    firstMonthCol: monthColIndices[0],
    monthHeaders: monthColIndices.map((i) => cellStr(headerCells[i])),
  };

  // 2) Walk data rows after the header
  const sips: RawSip[] = [];
  const warnings: string[] = [];
  let dataRowCount = 0;
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const scheme = cellStr(row[ctx.schemeCol]);
    const investor = cellStr(row[ctx.investorCol]);
    // Skip Total row + blank rows
    if (!scheme || /^total/i.test(scheme.trim())) continue;
    if (!investor || /^total/i.test(investor.trim())) continue;
    dataRowCount++;

    const folio = ctx.folioCol >= 0 ? cellStr(row[ctx.folioCol]) : undefined;
    const monthValues = monthColIndices.map((c) => numericCell(row[c]));

    // Determine the "current" SIP amount + status:
    //   - latest non-Total column with > 0 → that's the current amount, status Active
    //   - latest is 0 but prior month was > 0 → Stopped (flag for advisor)
    //   - all zeros → skip (not a real SIP)
    let amount = 0;
    let status: 'Active' | 'Stopped' | 'Paused' | 'Completed' = 'Active';
    const lastIdx = monthValues.length - 1;
    if (lastIdx < 0) continue;
    if (monthValues[lastIdx] > 0) {
      amount = monthValues[lastIdx];
      status = 'Active';
    } else {
      // Look back for the most recent month with a value
      let lookback = lastIdx - 1;
      while (lookback >= 0 && monthValues[lookback] === 0) lookback--;
      if (lookback >= 0) {
        amount = monthValues[lookback];
        status = 'Stopped';
        warnings.push(`SIP for "${scheme}" (${investor}) was active until ${ctx.monthHeaders[lookback].trim()} — stopped in ${ctx.monthHeaders[lastIdx].trim()}.`);
      } else {
        // All zeros — not a real SIP, skip
        continue;
      }
    }
    if (amount <= 0) continue;

    sips.push({
      entityName: investor.trim(),
      fundName: scheme.trim(),
      folioNumber: folio?.trim() || undefined,
      amcName: guessAmcFromSchemeName(scheme.trim()),
      monthlyAmountInr: amount,
      actualAmountInr: amount,
      frequency: 'Monthly' as SipFrequency,
      startDate: inferStartDateFromHeaders(monthValues, ctx.monthHeaders),
      status,
      hasStepUp: false,
    });
  }

  return {
    success: sips.length > 0,
    detectedFormat,
    sips,
    totalRows: dataRowCount,
    warnings,
    error: sips.length === 0
      ? `No SIP rows extracted. Checked ${dataRowCount} data row(s). Make sure your file has at least one non-zero monthly amount.`
      : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function numericCell(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, '').replace(/[^\d.\-]/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

/**
 * Pick the first month that has a value > 0 — that's our best guess
 * for the SIP start date. Returns ISO date (1st of the month).
 *
 * Header format from Trustner: " FEB 26" / "MAR 2026" — try both.
 */
function inferStartDateFromHeaders(values: number[], headers: string[]): string {
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) {
      const iso = parseMonthHeader(headers[i]);
      if (iso) return iso;
    }
  }
  return new Date().toISOString().split('T')[0];
}

function parseMonthHeader(h: string): string | undefined {
  const m = h.trim().match(/^([A-Z]{3})\s+(\d{2,4})$/i);
  if (!m) return undefined;
  const [, mon, yr] = m;
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const mm = months[mon.toLowerCase()];
  if (!mm) return undefined;
  const yyyy = yr.length === 2 ? `20${yr}` : yr;
  return `${yyyy}-${mm}-01`;
}

// Mirrors the same lookup used by cas-parser. Kept local to avoid a
// circular import (cas-parser doesn't export its private map yet).
function guessAmcFromSchemeName(scheme: string): string | undefined {
  const knownAmcs: Record<string, string> = {
    'icici pru': 'ICICI Prudential Mutual Fund',
    'icici prudential': 'ICICI Prudential Mutual Fund',
    'hdfc': 'HDFC Mutual Fund',
    'axis': 'Axis Mutual Fund',
    'mirae': 'Mirae Asset Mutual Fund',
    'motilal oswal': 'Motilal Oswal Mutual Fund',
    'parag parikh': 'PPFAS Mutual Fund',
    'ppfas': 'PPFAS Mutual Fund',
    'invesco': 'Invesco Mutual Fund',
    'bandhan': 'Bandhan Mutual Fund',
    'pgim': 'PGIM India Mutual Fund',
    'nippon': 'Nippon India Mutual Fund',
    'franklin': 'Franklin Templeton Mutual Fund',
    'sbi': 'SBI Mutual Fund',
    'kotak': 'Kotak Mutual Fund',
    'aditya birla': 'Aditya Birla Sun Life Mutual Fund',
    'absl': 'Aditya Birla Sun Life Mutual Fund',
    'uti': 'UTI Mutual Fund',
    'dsp': 'DSP Mutual Fund',
    'tata': 'Tata Mutual Fund',
    'sundaram': 'Sundaram Mutual Fund',
    'edelweiss': 'Edelweiss Mutual Fund',
    'baroda bnp': 'Baroda BNP Paribas Mutual Fund',
    'hsbc': 'HSBC Mutual Fund',
    'lic': 'LIC Mutual Fund',
    'quant': 'Quant Mutual Fund',
    'mahindra manulife': 'Mahindra Manulife Mutual Fund',
    'samco': 'Samco Mutual Fund',
    '360 one': '360 ONE Mutual Fund',
    'navi': 'Navi Mutual Fund',
    'groww': 'Groww Mutual Fund',
    'old bridge': 'Old Bridge Mutual Fund',
    'iti': 'ITI Mutual Fund',
    'union': 'Union Mutual Fund',
    'zerodha': 'Zerodha Mutual Fund',
    'taurus': 'Taurus Mutual Fund',
    'nj': 'NJ Mutual Fund',
    'bajaj finserv': 'Bajaj Finserv Mutual Fund',
    'whiteoak': 'WhiteOak Capital Mutual Fund',
  };
  const lower = scheme.toLowerCase();
  for (const [needle, fullName] of Object.entries(knownAmcs)) {
    if (lower.includes(needle)) return fullName;
  }
  return undefined;
}
