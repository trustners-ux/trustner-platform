/**
 * Portfolio Diagnostic — Portfolio PDF Parser
 *
 * Parses three input formats:
 *   1. CAMS Consolidated Account Statement (CAS)
 *   2. Karvy Consolidated Account Statement (CAS)
 *   3. Trustner Valuation Report (MFD back-office export)
 *
 * All formats normalize to the same RawHolding[] / RawSip[] schema.
 *
 * Indian CAS PDFs are text-based (not scanned). Trustner valuation
 * reports are also text-based with tabular columns.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { extractText, getDocumentProxy } from 'unpdf';
import type { RawHolding, RawSip, EntityType, SipFrequency } from './types';

// ─────────────────────────────────────────────────────────────────
// HIGH-LEVEL ENTRY POINT
// ─────────────────────────────────────────────────────────────────

export interface CasParseResult {
  success: boolean;
  error?: string;
  investorName?: string;
  pan?: string;
  statementPeriod?: { from: string; to: string };
  holdings: RawHolding[];
  sips: RawSip[];
  // Diagnostic counters
  totalFoliosFound: number;
  totalAmcsFound: number;
}

/**
 * Parse a portfolio PDF buffer (CAS or Trustner Valuation Report).
 * Auto-detects format and routes to the right sub-parser.
 *
 * Implementation note: uses `unpdf` (serverless-friendly fork of
 * pdfjs-dist that works on Vercel/Cloudflare). `pdf-parse` requires
 * `DOMMatrix` which is not available in Node runtime.
 */
export async function parseCasPdf(input: {
  pdfBuffer: Buffer;
  password?: string;          // CAS PDFs are usually password-protected (PAN); Trustner reports are not
}): Promise<CasParseResult> {
  try {
    // Convert Buffer to Uint8Array for unpdf
    const uint8 = new Uint8Array(input.pdfBuffer);

    // Try to open the document (handles password if provided)
    const pdf = await getDocumentProxy(uint8, {
      password: input.password,
    } as { password?: string });

    const { text: pages } = await extractText(pdf, { mergePages: false });
    const text = Array.isArray(pages) ? pages.join('\n') : String(pages);

    if (!text || text.length < 500) {
      return {
        success: false,
        error: 'PDF text is too short — likely a scanned image, not text-based',
        holdings: [],
        sips: [],
        totalFoliosFound: 0,
        totalAmcsFound: 0,
      };
    }

    // Auto-detect format — order matters: most-specific markers first
    if (isPortfolioValuationSummary(text)) {
      return parsePortfolioValuationSummary(text);
    }
    if (isTrustnerValuationReport(text)) {
      return parseTrustnerValuationReport(text);
    }

    return parseTextContent(text);
  } catch (e) {
    const msg = (e as Error).message;
    if (/password/i.test(msg)) {
      return {
        success: false,
        error: 'PDF is password-protected. Provide PAN as password.',
        holdings: [],
        sips: [],
        totalFoliosFound: 0,
        totalAmcsFound: 0,
      };
    }
    return {
      success: false,
      error: `Parse error: ${msg}`,
      holdings: [],
      sips: [],
      totalFoliosFound: 0,
      totalAmcsFound: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// TRUSTNER VALUATION REPORT (MFD back-office export)
// ─────────────────────────────────────────────────────────────────

/**
 * Detects a Trustner Valuation Report by the distinctive header
 * markers used by the MFD back-office tool.
 */
function isTrustnerValuationReport(text: string): boolean {
  const markers = [
    /Valuation\s+Report\s+as\s+on\s+Date/i,
    /Mutual\s+Fund\s+Summary\s+Report/i,
    /Fund\s+House\s+Wise\s+Investment\s+Summary/i,
    /Scheme\s+Type\s+Wise\s+Investment\s+Summary/i,
  ];
  let hits = 0;
  for (const m of markers) if (m.test(text)) hits++;
  return hits >= 2;
}

/**
 * Parser for Trustner Valuation Report format. Sections look like:
 *
 *   Equity - Flexi Cap Fund
 *   <Scheme Name> <Folio> <ARN> <Inv Since> (<days>) <Sensex> <InvCost> <SDuty> <DivR> <Units> <Price> <CurNav> <NavDate> <CurValue> <DivReinv> <DivPaid> <Total> <Gain> <AbsRtn> <XIRR>
 *
 * Active SIPs are flagged by "(SIP)" in the scheme name.
 */
function parseTrustnerValuationReport(text: string): CasParseResult {
  // The unpdf text extraction often loses line breaks inside table rows.
  // We normalize whitespace and then scan for "scheme blocks" by recognizing
  // category headers and per-row anchors.

  const investorName = extractInvestorNameTrustner(text) ?? extractInvestorName(text);
  const pan = extractPan(text);

  const holdings: RawHolding[] = [];
  const sips: RawSip[] = [];

  // Known asset/category markers from the report
  const categoryRe = /(Debt\s*-\s*[A-Z][^\n]*?Fund|Equity\s*-\s*[A-Z][^\n]*?Fund|Hybrid\s*-\s*[A-Z][^\n]*?Fund)/g;
  const categoryMatches = [...text.matchAll(categoryRe)];

  // Build a list of (category, span) pairs to limit per-row parsing
  const spans: Array<{ category: string; start: number; end: number }> = [];
  for (let i = 0; i < categoryMatches.length; i++) {
    const m = categoryMatches[i];
    spans.push({
      category: m[1].trim(),
      start: m.index ?? 0,
      end: i + 1 < categoryMatches.length ? (categoryMatches[i + 1].index ?? text.length) : text.length,
    });
  }

  // For each span, extract individual holdings using a row regex anchored on
  // (a) presence of "ARN-" tag and (b) a date in DD-MM-YY format.
  // Tolerant to extra whitespace because unpdf flattens columns.
  const rowRe = /([A-Za-z][A-Za-z0-9 &\-/().,'']+?)(?:Growth|Dividend|IDCW)(?:\s*\(SIP\))?\s*(?:\(Direct\)|\(Regular\))?\s+([0-9/]+)\s*ARN-[\d,]+\s+(\d{2}-\d{2}-\d{2})\s*\((\d+)\s*Days?\)\s+([\d.,]+)?\s*([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+(\d{1,2}-[A-Za-z]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,-]+)\s+([\d.\-]+%)\s+([\d.\-]+%)/g;

  for (const span of spans) {
    const slice = text.slice(span.start, span.end);
    for (const m of slice.matchAll(rowRe)) {
      const [
        ,
        rawScheme,
        folio,
        invSince,
        ,
        ,
        invCost,
        ,
        ,
        unitsStr,
        ,
        currentNav,
        ,
        currentValue,
        ,
        ,
        ,
        gainLoss,
        absRtn,
        xirr,
      ] = m as unknown as string[];

      // Reconstruct scheme name + plan/option
      const schemeMatch = slice.slice(Math.max(0, (m.index ?? 0) - 80), (m.index ?? 0) + 200).match(/([A-Za-z][A-Za-z0-9 &\-/().,'']+?)(?:Growth|Dividend|IDCW)(?:\s*\(SIP\))?/);
      const schemeRaw = (schemeMatch?.[0] ?? rawScheme).trim();
      const hasSip = /\(SIP\)/i.test(schemeRaw);

      // Resolve AMC by scanning leading words
      const amc = guessAmcFromSchemeName(schemeRaw);

      const units = numeric(unitsStr);
      const invCostInr = numeric(invCost);
      const currentValInr = numeric(currentValue);
      const gain = numeric(gainLoss);
      const absRtnPct = pctNumeric(absRtn);
      const xirrPct = pctNumeric(xirr);

      if (!invCostInr || !currentValInr) continue;

      void absRtnPct; void xirrPct; void gain; // captured for future use; not in RawHolding shape

      const entityName = investorName ?? 'Unknown';
      const cleanedScheme = cleanSchemeName(schemeRaw);
      const firstInvDate = normaliseDdMmYy(invSince);

      const holding: RawHolding = {
        entityName,
        entityType: detectEntityType(entityName),
        fundName: cleanedScheme,
        folioNumber: folio,
        amcName: amc,
        units,
        currentNav: numeric(currentNav),
        currentValue: currentValInr,
        investedAmount: invCostInr,
        firstInvestmentDate: firstInvDate,
      };
      holdings.push(holding);

      // Infer active SIP from the (SIP) flag.
      // We don't know the actual installment amount from the valuation report,
      // so we estimate by amortizing invested amount over months-held.
      if (hasSip && firstInvDate) {
        const monthsHeld = Math.max(1, monthsBetween(firstInvDate, new Date()));
        const estMonthly = Math.round(invCostInr / monthsHeld);
        sips.push({
          entityName,
          fundName: cleanedScheme,
          folioNumber: folio,
          amcName: amc,
          monthlyAmountInr: estMonthly,
          actualAmountInr: estMonthly,
          frequency: 'Monthly' as SipFrequency,
          startDate: firstInvDate,
          status: 'Active',
          hasStepUp: false,
        });
      }
    }
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'Trustner Valuation Report detected but no rows could be extracted. The PDF layout may have changed.'
      : undefined,
    investorName,
    pan,
    holdings,
    sips,
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

function extractInvestorNameTrustner(text: string): string | undefined {
  // Trustner reports start with the holder's full name in caps on its own line
  // right after "Valuation Report as on Date - <date>".
  const m = text.match(/Valuation\s+Report\s+as\s+on\s+Date[^\n]*\n([A-Z][A-Z\s.]+?)\s*\(PAN:/);
  return m?.[1]?.trim();
}

// ─────────────────────────────────────────────────────────────────
// PORTFOLIO VALUATION SUMMARY (BSE Star MF / Wealth Spectrum / Investwell)
//
// Format produced by several MFD back-office tools. Distinct from the
// older "Valuation Report" format above. Layout:
//
//   <Firm header>
//   <Investor name + PAN + address + RM info>
//   Portfolio Valuation Summary
//   As on <date>
//   Investment snapshot since <YYYY-MM-DD>
//   Investment (A) ... XIRR x.xx %
//   Allocation By Applicant
//   Mutual Fund Allocation by Applicant
//   Mutual Fund Allocation by Fund         ← AMC-level summary
//   Mutual Fund Allocation by Scheme       ← THE HOLDINGS TABLE
//   Mutual Fund Allocation by Sub Category
//   Mutual Fund (Equity) Cap Allocation
//
// The holdings table format is:
//   <Scheme Name (G|D|IDCW)>  <PurchaseValue>  <CurrentValue>  <AbsRet%>  <CAGR%>  <Alloc%>
//
// No folio numbers, no units, no current NAV in this format — just the
// per-scheme rollup. The SIP detail comes from a separate XLSX export
// (handled by the SIP parser).
// ─────────────────────────────────────────────────────────────────

function isPortfolioValuationSummary(text: string): boolean {
  // Require ALL THREE to avoid false positives — these strings together
  // uniquely identify this format.
  return (
    /Portfolio\s+Valuation\s+Summary/i.test(text) &&
    /Investment\s+snapshot\s+since/i.test(text) &&
    /Mutual\s+Fund\s+Allocation\s+by\s+Scheme/i.test(text)
  );
}

function parsePortfolioValuationSummary(text: string): CasParseResult {
  const investorName = extractInvestorNamePVS(text) ?? extractInvestorName(text);
  const pan = extractPan(text);

  // Find the "Mutual Fund Allocation by Scheme" block. The block ends at
  // whichever comes first: next "Mutual Fund Allocation by ..." header or
  // "Mutual Fund (Equity)" or "Total :" followed by another section.
  const blockStartMatch = text.match(/Mutual\s+Fund\s+Allocation\s+by\s+Scheme/i);
  if (!blockStartMatch) {
    return {
      success: false,
      error: 'Portfolio Valuation Summary detected but "by Scheme" section not found',
      investorName,
      pan,
      holdings: [],
      sips: [],
      totalFoliosFound: 0,
      totalAmcsFound: 0,
    };
  }
  const blockStart = (blockStartMatch.index ?? 0) + blockStartMatch[0].length;
  // Look for the next "by Sub Category" or "(Equity) Cap Allocation" header
  // as the block end.
  const rest = text.slice(blockStart);
  const endMatch = rest.match(/Mutual\s+Fund\s+Allocation\s+by\s+Sub\s+Category|Mutual\s+Fund\s*\(Equity\)\s+Cap\s+Allocation/i);
  const blockEnd = endMatch ? blockStart + (endMatch.index ?? 0) : text.length;
  const block = text.slice(blockStart, blockEnd);

  // Investment-snapshot earliest date — fallback firstInvestmentDate for
  // each holding (we don't have per-fund start dates in this report).
  const sinceMatch = text.match(/Investment\s+snapshot\s+since\s+(\d{2}-\d{2}-\d{4})/i);
  const firstInvDate = sinceMatch ? normaliseDdMmYyyy(sinceMatch[1]) : undefined;

  // Row pattern: <words ending in "(G)" or "(D)" or "(IDCW)" or "(B)"> <inv> <cur> <abs%> <cagr%> <alloc%>
  // Numbers can be Indian-format (with commas), include decimals, and the
  // %% columns can be negative.
  //
  // Examples:
  //   Bandhan Small Cap Fund Reg (G) 40,000 42,212 5.53 5.03 7.26
  //   Edelweiss Business Cycle Fund Reg (G) 50,000 43,878 -12.24 -6.92 7.55
  //   ICICI Pru Balanced Advantage Fund Reg (G) 1,29,451 1,44,089 11.31 5.83 24.79
  //
  // The (G)/(D)/(IDCW) suffix is the anchor — it's always present.
  const rowRe = /([A-Z][A-Za-z0-9 &\-/().,'']*?\((?:G|D|IDCW|B)\))\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\b/g;

  const holdings: RawHolding[] = [];
  const entityName = investorName ?? 'Unknown';

  for (const m of block.matchAll(rowRe)) {
    const [, schemeRaw, invStr, curStr, , , ] = m;
    const fundName = cleanSchemeName(schemeRaw.trim());

    // Skip the "Total :" row if it got matched (it won't have a (G)/(D)/(IDCW)
    // suffix though, so this is belt-and-braces)
    if (/^Total\b/i.test(fundName)) continue;

    const investedAmount = numeric(invStr);
    const currentValue = numeric(curStr);
    if (!investedAmount || !currentValue) continue;

    const amc = guessAmcFromSchemeName(fundName);

    holdings.push({
      entityName,
      entityType: detectEntityType(entityName),
      fundName,
      folioNumber: undefined, // not in this format; planner can fill via SIP upload
      amcName: amc,
      units: 0,             // not in this format
      currentNav: 0,        // not in this format
      currentValue,
      investedAmount,
      firstInvestmentDate: firstInvDate,
    });
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'Portfolio Valuation Summary detected but no scheme rows could be extracted. The PDF layout may have changed.'
      : undefined,
    investorName,
    pan,
    holdings,
    sips: [], // SIPs come from the separate "My SIP's" XLSX
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

function extractInvestorNamePVS(text: string): string | undefined {
  // The investor name appears just after "Trustner Asset Services Pvt. Ltd."
  // and before the PAN. The line is in ALL CAPS on its own.
  //
  // Example:
  //   Trustner Asset Services Pvt. Ltd.
  //    MOHIT GULATI
  //   AKAPG5617P
  const m = text.match(/Trustner\s+Asset\s+Services\s+Pvt\.\s*Ltd\.\s*[\n\r]+\s*([A-Z][A-Z\s.&]{2,60}?)\s*[\n\r]+\s*[A-Z]{5}\d{4}[A-Z]/i);
  if (m?.[1]) return m[1].replace(/\s+/g, ' ').trim();
  return undefined;
}

function normaliseDdMmYyyy(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return s;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function numeric(s?: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/,/g, '').replace(/[^\d.\-]/g, '');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function pctNumeric(s?: string): number {
  if (!s) return 0;
  return numeric(s.replace('%', ''));
}

function normaliseDdMmYy(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const [, dd, mm, yy] = m;
  const fullYear = parseInt(yy, 10) > 50 ? `19${yy}` : `20${yy}`;
  return `${fullYear}-${mm}-${dd}`;
}

function monthsBetween(startIso: string, end: Date): number {
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return 1;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return Math.max(1, years * 12 + months);
}

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

function cleanSchemeName(s: string): string {
  return s
    .replace(/\s*\(SIP\)\s*/i, '')
    .replace(/\s+ARN-[\d,]+\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategoryFromHeader(header: string): string {
  // "Equity - Flexi Cap Fund" → "Flexi Cap"
  // "Debt - Ultra Short Duration Fund" → "Ultra Short Duration"
  // "Hybrid - Aggressive Hybrid Fund" → "Aggressive Hybrid"
  return header
    .replace(/^Equity\s*-\s*/i, '')
    .replace(/^Debt\s*-\s*/i, '')
    .replace(/^Hybrid\s*-\s*/i, '')
    .replace(/\s*Fund\s*$/i, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────────
// TEXT-LEVEL PARSER
// ─────────────────────────────────────────────────────────────────

/**
 * Exposed for unit-testing — given the raw extracted text from a CAS
 * PDF, return structured data. No file I/O.
 */
export function parseTextContent(text: string): CasParseResult {
  const investorName = extractInvestorName(text);
  const pan = extractPan(text);
  const statementPeriod = extractStatementPeriod(text);

  const holdings = extractHoldings(text, investorName ?? 'Unknown');
  const sips = extractSips(text, investorName ?? 'Unknown');

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: true,
    investorName,
    pan,
    statementPeriod,
    holdings,
    sips,
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

// ─────────────────────────────────────────────────────────────────
// FIELD EXTRACTORS
// ─────────────────────────────────────────────────────────────────

function extractInvestorName(text: string): string | undefined {
  // Patterns observed in CAS PDFs:
  //   "Name : ROHIT JAIN"
  //   "Investor Name: ROHIT JAIN"
  //   "Sole/First holder: ROHIT JAIN"
  const patterns = [
    /(?:Investor\s+)?Name\s*[:\-]\s*([A-Z][A-Z\s]+(?:\([^\)]+\))?)/i,
    /Sole\/First\s+Holder\s*[:\-]\s*([A-Z][A-Z\s]+)/i,
    /Holder(?:\(s\))?\s*[:\-]\s*([A-Z][A-Z\s]+)/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) return m[1].trim();
  }
  return undefined;
}

function extractPan(text: string): string | undefined {
  // PAN format: 5 letters, 4 digits, 1 letter
  const m = text.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
  return m?.[1];
}

function extractStatementPeriod(text: string): { from: string; to: string } | undefined {
  // Patterns:
  //   "Statement Period: 01-Apr-2024 to 31-Mar-2026"
  //   "From: 01-Apr-2024 To: 31-Mar-2026"
  const m = text.match(
    /(?:Statement\s+Period|From)\s*[:\-]?\s*(\d{1,2}[\s-][A-Za-z]{3}[\s-]\d{4})\s*(?:to|To)\s*(\d{1,2}[\s-][A-Za-z]{3}[\s-]\d{4})/i
  );
  if (m) return { from: m[1], to: m[2] };
  return undefined;
}

// ─────────────────────────────────────────────────────────────────
// HOLDINGS EXTRACTOR
// ─────────────────────────────────────────────────────────────────

/**
 * CAS PDFs structure holdings per AMC → per folio → per scheme.
 * Each scheme block contains: name, units, NAV, cost, market value,
 * and transaction history.
 *
 * We look for lines matching the closing-balance pattern:
 *   "Closing Unit Balance: 1,234.5670  NAV: ₹85.4321  Market Value: ₹1,05,432"
 *   or the per-scheme summary block.
 */
function extractHoldings(text: string, defaultEntityName: string): RawHolding[] {
  const holdings: RawHolding[] = [];
  const lines = text.split(/\r?\n/);

  let currentAmc = '';
  let currentFolio = '';
  let currentScheme = '';
  let currentInvested = 0;
  let currentCurrentValue = 0;
  let currentUnits = 0;
  let currentFirstTxnDate: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // AMC header line — varies; common: "AXIS MUTUAL FUND" / "Mirae Asset Mutual Fund"
    const amcMatch = line.match(/^([A-Z][A-Za-z\s&]+(?:Mutual Fund|MF))$/);
    if (amcMatch) {
      currentAmc = amcMatch[1].trim();
      continue;
    }

    // Folio number — "Folio No: 12345/678" or "Folio No.: 12345/678"
    const folioMatch = line.match(/Folio\s*No\.?\s*[:\-]?\s*([\d\/A-Z\-]+)/i);
    if (folioMatch) {
      currentFolio = folioMatch[1].trim();
      continue;
    }

    // Scheme name + units + NAV + market value (single line)
    // Common patterns in CAS:
    //   "Scheme Name - Growth   1234.567   85.4321   1,05,432.00"
    const schemeRowMatch = line.match(
      /^(.+?(?:Growth|Direct Plan|Reg(?:ular)? Plan|IDCW)).+?([\d,]+\.\d{1,4})\s+(?:₹|Rs\.?\s*)?([\d,]+\.\d{1,4})\s+(?:₹|Rs\.?\s*)?([\d,]+\.\d{0,2})\s*$/
    );
    if (schemeRowMatch && currentAmc) {
      currentScheme = schemeRowMatch[1].trim();
      currentUnits = parseNumber(schemeRowMatch[2]);
      // schemeRowMatch[3] is NAV; we don't currently need to capture it
      currentCurrentValue = parseNumber(schemeRowMatch[4]);
    }

    // Cost / Total Invested
    const costMatch = line.match(/(?:Cost|Invested|Total\s+Invested)\s*(?:Value)?\s*[:\-]?\s*(?:₹|Rs\.?\s*)?([\d,]+\.\d{0,2})/i);
    if (costMatch) {
      currentInvested = parseNumber(costMatch[1]);
    }

    // First transaction date — "First Transaction Date: 12-Aug-2024"
    const firstDateMatch = line.match(/First\s+(?:Transaction|Purchase)\s+Date\s*[:\-]?\s*(\d{1,2}[\s-][A-Za-z]{3}[\s-]\d{4})/i);
    if (firstDateMatch) {
      currentFirstTxnDate = normaliseDate(firstDateMatch[1]);
    }

    // End of scheme block — look for blank line or new scheme/folio
    const isEndOfBlock =
      i === lines.length - 1 ||
      lines[i + 1]?.trim() === '' ||
      /^(?:Folio|Scheme|\S+\s+Mutual Fund)/i.test(lines[i + 1] ?? '');

    if (
      isEndOfBlock &&
      currentScheme &&
      currentUnits > 0 &&
      currentCurrentValue > 0
    ) {
      holdings.push({
        entityName: defaultEntityName,
        entityType: detectEntityType(defaultEntityName),
        fundName: currentScheme,
        folioNumber: currentFolio || undefined,
        amcName: currentAmc || undefined,
        units: currentUnits,
        currentValue: currentCurrentValue,
        investedAmount: currentInvested || currentCurrentValue, // fallback
        firstInvestmentDate: currentFirstTxnDate,
      });

      // Reset for next scheme (but keep AMC + folio)
      currentScheme = '';
      currentInvested = 0;
      currentCurrentValue = 0;
      currentUnits = 0;
      currentFirstTxnDate = undefined;
    }
  }

  return holdings;
}

// ─────────────────────────────────────────────────────────────────
// SIPs EXTRACTOR
// ─────────────────────────────────────────────────────────────────

/**
 * SIPs are usually listed in a separate section of the CAS labeled
 * "SIP Details" or "Active Systematic Investment Plans".
 *
 * Typical row format:
 *   "Scheme Name | Monthly | ₹5,000 | 5th | 12-Aug-2024 | Active"
 */
function extractSips(text: string, defaultEntityName: string): RawSip[] {
  const sips: RawSip[] = [];

  // Find the SIP section
  const sipSectionMatch = text.match(
    /(?:Active\s+)?(?:SIP|Systematic\s+Investment\s+Plan)s?\s+Details?([\s\S]+?)(?:Active\s+STP|Active\s+SWP|$)/i
  );
  if (!sipSectionMatch) return sips;

  const sipBlock = sipSectionMatch[1];
  const lines = sipBlock.split(/\r?\n/);

  let currentAmc = '';
  let currentFolio = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const amcMatch = line.match(/^([A-Z][A-Za-z\s&]+Mutual Fund)$/);
    if (amcMatch) {
      currentAmc = amcMatch[1].trim();
      continue;
    }

    const folioMatch = line.match(/Folio\s*No\.?\s*[:\-]?\s*([\d\/A-Z\-]+)/i);
    if (folioMatch) {
      currentFolio = folioMatch[1].trim();
      continue;
    }

    // SIP row pattern: "Scheme | Frequency | Amount | Date | StartDate | Status"
    // We parse a flexible version of this
    const sipRow = parseSipRow(line);
    if (sipRow) {
      sips.push({
        entityName: defaultEntityName,
        fundName: sipRow.schemeName,
        folioNumber: currentFolio || undefined,
        amcName: currentAmc || undefined,
        monthlyAmountInr: normaliseSipToMonthly(sipRow.amount, sipRow.frequency),
        actualAmountInr: sipRow.amount,
        frequency: sipRow.frequency,
        sipDayOfMonth: sipRow.sipDate,
        startDate: sipRow.startDate,
        endDate: sipRow.endDate,
        status: sipRow.status,
        hasStepUp: false, // CAS doesn't always show step-up; we capture manually
      });
    }
  }

  return sips;
}

interface SipRowMatch {
  schemeName: string;
  frequency: SipFrequency;
  amount: number;
  sipDate?: number;
  startDate: string;
  endDate?: string;
  status: RawSip['status'];
}

function parseSipRow(line: string): SipRowMatch | null {
  // Heuristic: an SIP row contains a scheme name + a frequency + an amount + a date
  const freqMatch = line.match(/\b(Monthly|Quarterly|Weekly|Daily)\b/i);
  if (!freqMatch) return null;

  const amountMatch = line.match(/(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d{2})?)/);
  const startDateMatch = line.match(/(\d{1,2}[\s-][A-Za-z]{3}[\s-]\d{4})/);
  const statusMatch = line.match(/\b(Active|Paused|Stopped|Completed)\b/i);

  if (!amountMatch || !startDateMatch) return null;

  // Scheme name is the prefix before the frequency keyword
  const idx = line.indexOf(freqMatch[0]);
  const schemeName = line.slice(0, idx).trim().replace(/[|;,]+$/, '').trim();
  if (!schemeName) return null;

  return {
    schemeName,
    frequency: freqMatch[1] as SipFrequency,
    amount: parseNumber(amountMatch[1]),
    startDate: normaliseDate(startDateMatch[1]),
    status: (statusMatch?.[1] as RawSip['status']) ?? 'Active',
  };
}

function normaliseSipToMonthly(amount: number, frequency: SipFrequency): number {
  switch (frequency) {
    case 'Monthly': return amount;
    case 'Quarterly': return amount / 3;
    case 'Weekly': return amount * 4.33;
    case 'Daily': return amount * 21;
    case 'One-Time-STP': return 0;
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function parseNumber(s: string): number {
  return parseFloat(s.replace(/,/g, ''));
}

function detectEntityType(name: string): EntityType {
  const upper = name.toUpperCase();
  if (/\b(LIMITED|LTD|PRIVATE LTD|PVT LTD|PVT\.?\s*LTD)\b/.test(upper)) return 'Pvt Ltd';
  if (/\b(LLP|LIMITED LIABILITY PARTNERSHIP)\b/.test(upper)) return 'LLP';
  if (/\b(PARTNERSHIP|& CO|AND CO|FIRM)\b/.test(upper)) return 'Partnership';
  if (/\b(HUF|HINDU UNDIVIDED FAMILY)\b/.test(upper)) return 'HUF';
  if (/\b(TRUST|FOUNDATION)\b/.test(upper)) return 'Trust';
  return 'Individual';
}

function normaliseDate(s: string): string {
  // '12-Aug-2024' or '12 Aug 2024' → '2024-08-12'
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const m = s.match(/(\d{1,2})[\s-]([A-Za-z]{3})[\s-](\d{4})/);
  if (!m) return s;
  const [, d, mon, y] = m;
  return `${y}-${months[mon] ?? '01'}-${d.padStart(2, '0')}`;
}
