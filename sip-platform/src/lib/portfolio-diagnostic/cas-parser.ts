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

/**
 * Strip a stray statistics-column label that the CAS layout occasionally glues
 * onto the front of a scheme name (observed: "XIRR ICICI Prudential Smallcap
 * Fund Growth" on small-cap rows where the XIRR column header bled into the
 * name). None of these tokens EVER begin a real Indian mutual-fund scheme name,
 * so removing a single leading one is safe and lets the fund matcher resolve it.
 * Idempotent — a clean name passes through untouched.
 */
export function sanitizeSchemeName(name: string | null | undefined): string {
  if (!name) return '';
  let n = name.replace(/\s+/g, ' ').trim();
  n = n.replace(/^(?:XIRR|IRR|NAV|CAGR|Abs\.?|Absolute|Gain|Loss|Reinv\.?)\s+/i, '');
  return n.trim();
}

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
/**
 * Open a (possibly encrypted) PDF, trying the password as-entered first and
 * then its upper/lower-case variants. PDF passwords ARE case-sensitive, so this
 * only helps when the supplied password matches the real one except for case
 * (e.g. a PAN typed in lowercase, or a password the client wrote in small
 * letters) — it never accepts a genuinely wrong password. Non-password errors
 * are re-thrown immediately so they aren't masked.
 */
async function openPdfWithPasswordVariants(uint8: Uint8Array, password?: string) {
  const pw = password?.trim();
  const variants: (string | undefined)[] = [];
  if (!pw) {
    variants.push(undefined);
  } else {
    const seen = new Set<string>();
    for (const v of [pw, pw.toUpperCase(), pw.toLowerCase()]) {
      if (!seen.has(v)) { seen.add(v); variants.push(v); }
    }
  }
  let lastErr: unknown;
  for (const v of variants) {
    try {
      return await getDocumentProxy(uint8, { password: v } as { password?: string });
    } catch (e) {
      lastErr = e;
      if (!/password/i.test((e as Error).message)) throw e; // not a password issue — surface it
    }
  }
  throw lastErr;
}

export async function parseCasPdf(input: {
  pdfBuffer: Buffer;
  password?: string;          // CAS PDFs are usually password-protected (PAN); Trustner reports are not
}): Promise<CasParseResult> {
  try {
    // Convert Buffer to Uint8Array for unpdf
    const uint8 = new Uint8Array(input.pdfBuffer);

    // Open the document. PDF passwords are case-sensitive, but a client may
    // share the password (often the PAN) in any case while the planner types it
    // differently — so try the password as-entered, then its upper- and
    // lower-case variants before giving up.
    const pdf = await openPdfWithPasswordVariants(uint8, input.password);

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
    // MF Central "Consolidated Account Summary" (CAMS+KFintech summary via
    // mfcentral.com — distinct from the detailed CAS: no transactions, a 3-line
    // value/return/units block per holding). Unique footer marker, so check first.
    if (isMfCentralCasSummary(text)) {
      return parseMfCentralCasSummary(text);
    }
    if (isPortfolioValuationSummary(text)) {
      return parsePortfolioValuationSummary(text);
    }
    // CAMS / KFintech detailed Consolidated Account Statement (transaction-level,
    // full scheme names). Most reliable source — check before the generic fallback.
    if (isCamsDetailedCas(text)) {
      return parseCamsDetailedCas(text);
    }
    // Trustner "Portfolio Valuation Report By CAS" — the newer compact MFD
    // back-office export (distinct row layout from the older Valuation Report).
    if (isTrustnerCasValuationReport(text)) {
      return parseTrustnerCasValuationReport(text);
    }
    if (isTrustnerFamilyReport(text)) {
      // Newer Trustner multi-PAN "Family" valuation report (e.g., Aashish
      // Jalan, Madhuchanda Dhar). Has per-PAN detail sections with full
      // holdings + folio + units + NAV + XIRR per fund.
      return parseTrustnerFamilyReport(text);
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

  // ── Line-block parser ──────────────────────────────────────────────
  // unpdf emits each fund as a multi-LINE block:
  //   <name line 1> [<name line 2> …]
  //   <folio>            (digits, optional /digits)
  //   ARN-…              (broker code)
  //   <code>             (a stray single digit on some rows)
  //   <DD-MM-YY>         (first investment date)
  //   (NNNN              \n  Days)
  //   <Sensex> <InvCost> <SDuty> <DivR> <Units> <Price> <CurNav> <NavDate> <CurValue> <DivReinv> <DivPaid> <Total> <Gain> <Abs%> <XIRR%>   ← THE DATA LINE
  // We accumulate the block, and on the data line emit a holding. Category
  // headers and "Total :-" subtotal lines reset the block.
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // The data line: 15 columns, with a NavDate (e.g. "09-Jun") in the middle.
  const dataLineRe =
    /^([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+(\d{1,2}-[A-Za-z]{3,9})\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,\-]+%?)\s+([\d.,\-]+%?)$/;
  const categoryRe =
    /^(Equity|Debt|Hybrid|Other|Sol(?:ution)?\s*Oriented|Liquid|Index|ETF|Gold|International|Commodit(?:y|ies)|Fund\s*of\s*Funds)\s*[-–].+/i;
  const folioRe = /^[A-Z]?\d[\d/]{3,}$/i;     // e.g. 3712288/94, 6983679, 9103302914
  const ddmmyyRe = /^\d{2}-\d{2}-\d{2,4}$/;    // first-investment date

  let block: string[] = [];

  const flush = (g: RegExpMatchArray) => {
    let folio: string | null = null;
    let firstDate: string | null = null;
    const nameParts: string[] = [];
    // Page headers, column headers and subtotal fragments repeat on every page
    // and must never become part of a fund name.
    const isJunk = (s: string): boolean =>
      /^Page\s+no\s+\d+/i.test(s) ||
      /Scheme\s+Name|Inv\.\s*Since|Cur\.\s*Nav|Nav\s*Date|Abs\.\s*Rtn|Div\s*Reinv/i.test(s) ||
      /^Paid\b/i.test(s) ||
      /\bTotal\s*:?-/i.test(s) ||
      /Valuation\s+Report|Mutual\s+Fund\s+Summary|AMFI[- ]Registered/i.test(s);
    for (const ln of block) {
      if (/^ARN[-\s]/i.test(ln)) continue;                  // broker code line
      if (ddmmyyRe.test(ln)) { firstDate = ln; continue; }   // first-investment date
      if (folio === null && folioRe.test(ln)) { folio = ln; continue; }
      if (/^\(?\d+$/.test(ln) || /^Days\)?$/i.test(ln) || /^\(\d+\s*Days?\)?$/i.test(ln)) continue; // days/code fragments
      if (categoryRe.test(ln) || isJunk(ln)) continue;
      if (folio === null) nameParts.push(ln);                // scheme-name lines precede the folio
    }
    let schemeRaw = nameParts.join(' ').replace(/\s+/g, ' ').trim();
    // unpdf sometimes glues a grand-total row, a section header and the next
    // fund name onto ONE line. Peel those leaked prefixes/suffixes off the name:
    schemeRaw = schemeRaw
      .replace(/^.*?Total\s*:?-[\d.,\s%-]+/i, '')                                              // leaked "…Total :- <nums> NN%"
      .replace(/^(?:Sol(?:ution)?\s*Oriented|Equity|Debt|Hybrid|Other|Index|ETF|Gold|International)\s*[-–]\s*[A-Za-z/&. ]+?Fund\s+/i, '') // leaked section header
      .replace(/\s+[A-Z]?\d{5,}(?:\/\d+)?$/i, '')                                              // trailing folio glued to the name
      .replace(/\s+/g, ' ')
      .trim();
    const invCostInr = numeric(g[2]);
    const currentValInr = numeric(g[9]);
    if (!schemeRaw || !invCostInr || !currentValInr) return;

    const units = numeric(g[5]);
    const currentNav = numeric(g[7]);
    const hasSip = /\(SIP\)/i.test(schemeRaw);
    const amc = guessAmcFromSchemeName(schemeRaw);
    const entityName = investorName ?? 'Unknown';
    const cleanedScheme = cleanSchemeName(schemeRaw);
    const firstInvDate = firstDate ? normaliseDdMmYy(firstDate) : undefined;

    holdings.push({
      entityName,
      entityType: detectEntityType(entityName),
      fundName: cleanedScheme,
      folioNumber: folio ?? '',
      amcName: amc,
      units,
      currentNav,
      currentValue: currentValInr,
      investedAmount: invCostInr,
      firstInvestmentDate: firstInvDate,
    });

    if (hasSip && firstInvDate) {
      const monthsHeld = Math.max(1, monthsBetween(firstInvDate, new Date()));
      const estMonthly = Math.round(invCostInr / monthsHeld);
      sips.push({
        entityName,
        fundName: cleanedScheme,
        folioNumber: folio ?? '',
        amcName: amc,
        monthlyAmountInr: estMonthly,
        actualAmountInr: estMonthly,
        frequency: 'Monthly' as SipFrequency,
        startDate: firstInvDate,
        status: 'Active',
        hasStepUp: false,
      });
    }
  };

  for (const ln of lines) {
    if (categoryRe.test(ln)) { block = []; continue; }       // new category section
    if (/\bTotal\s*:?-/i.test(ln)) { block = []; continue; } // subtotal row — discard the block
    // The "(N Days)" held-period token sometimes sits on its OWN line and
    // sometimes is glued to the front of the data line — strip it either way.
    const daysMatch = ln.match(/^\((\d+)\s*Days?\)\s*/i);
    if (daysMatch && /^\(\d+\s*Days?\)\s*$/i.test(ln)) { continue; } // standalone "(N Days)" — ignore
    const candidate = daysMatch ? ln.slice(daysMatch[0].length) : ln;
    const dm = candidate.match(dataLineRe);
    if (dm) { flush(dm); block = []; continue; }
    block.push(ln);
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
  // Most reliable anchor: the holder's name sits on its OWN line immediately
  // before "(PAN: XXXXX)". Works whether the name is Title Case ("Ram Shah") or
  // ALL CAPS, and regardless of the Sensex/quote lines between the header and it.
  let m = text.match(/\n\s*([A-Za-z][A-Za-z\s.]{2,40}?)\s*\n\s*\(\s*PAN\s*:/i);
  if (m?.[1]) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    if (!/^(Current\s+Sensex|TRUSTNER|Valuation|Mutual\s+Fund)/i.test(name)) return name;
  }
  // Fallback: CAPS name right after the report header line.
  m = text.match(/Valuation\s+Report\s+as\s+on\s+Date[^\n]*\n([A-Z][A-Z\s.]+?)\s*\(PAN:/);
  return m?.[1]?.trim();
}

// ─────────────────────────────────────────────────────────────────
// TRUSTNER FAMILY VALUATION REPORT (newer multi-PAN format)
//
// Distinguishing markers vs the single-PAN variant above:
//   - "Mutual Fund Family Report"               (vs "Summary Report")
//   - "Mutual Fund Family Investment Summary"   (table of PANs)
//   - "Scheme Wise Family Investment Summary"   (family-level scheme table)
//   - "Fund House Wise Family Investment Summary"
//   - "Fund Type Wise Family Investment Summary"
//
// Structure:
//   Page 1-2: family-level summary tables
//   Page 3..N: per-PAN detail blocks, each starting with
//              "Client Name : <NAME> [PAN : <CODE>]"
//
// Per-row format inside a PAN detail block (text often broken across
// multiple lines by pypdf — we re-join):
//   <Scheme Name> ... Growth[(SIP)] <Folio> ARN-<code> <DD-MM-YY>
//   (<Days> Days) <Sensex> <InvCost> <SDuty> <DivR> <Units> <Price>
//   <CurNav> <NavDate> <CurValue> <DivRein> <DivPaid> <Total>
//   <Gain/Loss> <AbsRet%> <XIRR%>
//
// We extract holdings WITH PAN attribution so the diagnostic builds
// the right multi-entity family structure.
// ─────────────────────────────────────────────────────────────────

function isTrustnerFamilyReport(text: string): boolean {
  // Need at least 2 of these distinctive Family markers
  const markers = [
    /Mutual\s+Fund\s+Family\s+Report/i,
    /Mutual\s+Fund\s+Family\s+Investment\s+Summary/i,
    /Scheme\s+Wise\s+Family\s+Investment\s+Summary/i,
    /Fund\s+House\s+Wise\s+Family\s+Investment\s+Summary/i,
    /Fund\s+Type\s+Wise\s+Family\s+Investment\s+Summary/i,
  ];
  let hits = 0;
  for (const m of markers) if (m.test(text)) hits++;
  return hits >= 2;
}

function parseTrustnerFamilyReport(text: string): CasParseResult {
  const holdings: RawHolding[] = [];
  const sips: RawSip[] = [];

  // ── Step 1: extract the family's PAN list ──
  // Pattern: "1 AASHISH JALAN [3562658] 21,93,159.88 ..."
  // The number in [brackets] is some internal code, NOT the PAN.
  // We capture all PAN names from the "Mutual Fund Family Investment
  // Summary" table.
  const familySummaryStart = text.search(/Mutual\s+Fund\s+Family\s+Investment\s+Summary/i);
  const familySummaryEnd = familySummaryStart >= 0
    ? text.indexOf('Scheme Wise Family Investment Summary', familySummaryStart)
    : -1;
  const familySummaryBlock = familySummaryStart >= 0 && familySummaryEnd >= 0
    ? text.slice(familySummaryStart, familySummaryEnd)
    : text.slice(0, 4000);

  const panNames: string[] = [];
  // Each PAN row starts with a sequence number, then the PAN name (may
  // be ALL CAPS like "AASHISH JALAN" or Title Case like "Madhuchanda Dhar"
  // depending on what the advisor entered in the back-office), then
  // [code], then numerics. We capture the name only.
  const panRowRe = /^\s*\d+\s+([A-Z][A-Za-z\s.&]{2,40}?)\s+\[\d+\]\s+[\d,]+\.\d+/gm;
  for (const m of familySummaryBlock.matchAll(panRowRe)) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    if (name && !/^total/i.test(name)) panNames.push(name);
  }

  // Extract the first investor as primary name (used for the family display)
  const primaryName = panNames[0];
  const pan = extractPan(text); // grabs the first PAN code (usually the head's)

  // ── Step 2: walk each PAN's detail section ──
  // PAN section starts with "Client Name :\n<NAME>\n[PAN : <CODE>]"
  // and ends at the next "Client Name :" OR "Scheme Past Performance" OR EOF.
  //
  // Names may be ALL CAPS ("AASHISH JALAN") OR Title Case
  // ("Madhuchanda Dhar") depending on the back-office input — accept both.
  const clientHeaderRe = /Client\s+Name\s*:\s*\n([A-Z][A-Za-z\s.&]{2,40}?)\s*\n\s*\[PAN\s*:\s*([A-Z]{5}\d{4}[A-Z])\]/g;
  const clientHeaders = [...text.matchAll(clientHeaderRe)];

  for (let i = 0; i < clientHeaders.length; i++) {
    const m = clientHeaders[i];
    const panName = m[1].trim().replace(/\s+/g, ' ');
    const panCode = m[2];
    const startIdx = m.index ?? 0;
    const endIdx = i + 1 < clientHeaders.length
      ? (clientHeaders[i + 1].index ?? text.length)
      : (text.indexOf('Scheme Past Performance', startIdx) > 0
          ? text.indexOf('Scheme Past Performance', startIdx)
          : text.length);
    const panBlock = text.slice(startIdx, endIdx);

    // Parse all holdings within this PAN block
    const panHoldings = extractHoldingsFromFamilyPanBlock(panBlock, panName);
    holdings.push(...panHoldings);

    // Detect SIPs from "(SIP)" suffix on scheme names
    for (const h of panHoldings) {
      if (/\(SIP\)/i.test(h.fundName)) {
        const cleanedFundName = h.fundName.replace(/\s*\(SIP\)\s*/i, '').trim();
        // Estimate monthly amount: invested ÷ months held (best-effort
        // until we parse actual SIP register)
        const monthsHeld = h.firstInvestmentDate
          ? monthsBetween(h.firstInvestmentDate, new Date())
          : 12;
        const estMonthly = Math.round(h.investedAmount / Math.max(1, monthsHeld));
        sips.push({
          entityName: panName,
          fundName: cleanedFundName,
          folioNumber: h.folioNumber,
          amcName: h.amcName,
          monthlyAmountInr: estMonthly,
          actualAmountInr: estMonthly,
          frequency: 'Monthly' as SipFrequency,
          startDate: h.firstInvestmentDate ?? new Date().toISOString().split('T')[0],
          status: 'Active',
          hasStepUp: false,
        });
      }
    }
  }

  // ── Step 3: clean up scheme names (strip the (SIP) suffix on the stored
  //           holding so it matches fund-master names) ──
  for (const h of holdings) {
    h.fundName = h.fundName.replace(/\s*\(SIP\)\s*/i, '').trim();
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'Trustner Family Report detected but no rows could be extracted. The PDF layout may have changed; share the file with engineering.'
      : undefined,
    investorName: primaryName,
    pan,
    holdings,
    sips,
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

/**
 * Extract holdings from one PAN's detail block. The block has category
 * sub-sections ("Equity - Flexi Cap Fund", "Equity - Small Cap Fund",
 * etc.) and within each, multi-line rows where pypdf has broken the
 * single logical row across many lines.
 *
 * Strategy: walk lines, accumulate into a buffer, flush when we hit
 * the "all numerics" trailing line that ends in "<n.nn>%" (XIRR%).
 * Then parse the buffer as a single logical row.
 */
function extractHoldingsFromFamilyPanBlock(block: string, panName: string): RawHolding[] {
  const out: RawHolding[] = [];

  // Skip everything before the first category header.
  // Headers seen in production PDFs include:
  //   "Equity - Flexi Cap Fund"
  //   "Hybrid - Aggressive Hybrid Fund"
  //   "Hybrid - Dynamic Asset Allocation or Balanced Advantage" (lowercase "or")
  //   "Others - FoF Domestic"             (no trailing "Fund")
  //   "Others - Index Funds"              (plural "Funds")
  //   "Equity - Sectoral/ Thematic"       (slash)
  //   "Equity - ELSS"                     (no trailing "Fund")
  const firstCategoryIdx = block.search(/(?:Equity|Debt|Hybrid|Solution\s+Oriented|Others?)\s*-\s*[A-Z]/);
  if (firstCategoryIdx === -1) return out;

  // Stop ONLY at end-of-block markers. "Equity Fund Total :-" used to be a
  // stop but that cut off Uma's Hybrid + Others rows that come AFTER it.
  // The real end-of-PAN-block markers are "Grand Total" or the start of
  // the per-PAN summary tables.
  let endIdx = block.length;
  for (const stop of [
    /Grand\s+Total\s+[\d,]/,                  // "Grand Total 20,29,773.94 ..."
    /Fund\s+House\s+Wise\s+Investment\s+Summary/i,
    /Scheme\s+Past\s+Performance/i,
  ]) {
    const idx = block.slice(firstCategoryIdx).search(stop);
    if (idx >= 0) {
      endIdx = Math.min(endIdx, firstCategoryIdx + idx);
    }
  }
  const holdingsArea = block.slice(firstCategoryIdx, endIdx);
  const lines = holdingsArea.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let currentCategory: string | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const joined = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    const holding = parseFamilyHoldingRow(joined, panName, currentCategory);
    if (holding) out.push(holding);
  };

  for (const line of lines) {
    // Category header lines — must end at line boundary (no trailing
    // numbers, which would mean it's a category SUMMARY row instead of
    // a section HEADER).
    //
    //   "Equity - Flexi Cap Fund"
    //   "Equity - ELSS"                              (no "Fund" suffix)
    //   "Equity - Sectoral/ Thematic"                (slash + no "Fund")
    //   "Hybrid - Aggressive Hybrid Fund"
    //   "Hybrid - Dynamic Asset Allocation or Balanced Advantage" (lc "or")
    //   "Others - FoF Domestic"                      (no "Fund")
    //   "Others - Index Funds"                       (plural)
    const catMatch = line.match(/^(Equity|Debt|Hybrid|Solution\s+Oriented|Others?)\s*-\s*([A-Z][A-Za-z0-9 &/\-]{1,80}?)(?:\s+Funds?)?\s*$/);
    if (catMatch) {
      flushBuffer();
      currentCategory = `${catMatch[1]} - ${catMatch[2]}`.replace(/\s+/g, ' ');
      continue;
    }
    // Asset-class wrappers — "Equity Fund Total", "Hybrid Fund Total",
    // "Others Fund Total" — these are ABOVE the per-category sub-totals
    // and we just skip them.
    if (/^(Equity|Debt|Hybrid|Others?)\s+Fund\s+Total/i.test(line)) {
      flushBuffer();
      continue;
    }
    // Per-category sub-total lines like "Flexi Cap Fund Total :- 5,54,972.62 ..."
    if (/Fund\s+Total\s*:-/.test(line)) {
      flushBuffer();
      continue;
    }
    // Skip table header repeats (both halves — pypdf often splits the
    // header line into two: first half ends with "Div", second half
    // starts with "Paid Total Gain / Loss Abs. Rtn. XIRR")
    if (/^Scheme\s+Name\s+Inv\.\s*Since/i.test(line) || /^Paid\s+Total\s+Gain\s*\/\s*Loss/i.test(line)) {
      flushBuffer();
      continue;
    }
    // Skip page-number lines
    if (/^Page\s+no\s+\d+\s+out\s+of/i.test(line)) continue;

    buffer.push(line);

    // Detect "end of row": line ends in a percentage value (XIRR %)
    // Pattern: any combo ending in "<+-?n.nn>%"
    if (/-?\d+(?:\.\d+)?%\s*$/.test(line)) {
      flushBuffer();
    }
  }
  flushBuffer();

  return out;
}

/**
 * Parse one logical holding row (lines already joined by space).
 *
 * Row shape (whitespace-normalised):
 *   <Scheme Name> Growth[(SIP)] <Folio> ARN-<code,...> <DD-MM-YY>
 *   (<Days> Days) <Sensex> <InvCost> <SDuty> <DivR> <Units> <Price>
 *   <CurNav> <NavDate> <CurValue> <DivRein> <DivPaid> <Total>
 *   <Gain/Loss> <AbsRet%> <XIRR%>
 */
function parseFamilyHoldingRow(row: string, panName: string, category: string | null): RawHolding | null {
  // Anchor on folio number + ARN code, with optional plan-option
  // keyword (Growth / Dividend / IDCW) in the scheme name. Some funds
  // (e.g., "ICICI Prudential Multi-Asset Fund") have no plan suffix at
  // all in the report because they only have one option. We make the
  // plan-option group optional so those rows still match.
  const re = new RegExp(
    // Scheme name (non-greedy) with optional trailing plan-option token.
    // The capture group includes the plan-option when present, so the
    // stored fundName ends in "Growth"/"Dividend"/"IDCW" or just "Fund".
    '^([A-Za-z][A-Za-z0-9 &\\-/().,\']{1,100}?(?:\\s+(?:Growth|Dividend|IDCW))?)' +
    '(\\s*\\(SIP\\))?' +
    '\\s+([\\d/\\-]+)' +                      // folio
    '\\s+ARN-[\\d,]+' +                       // ARN code (digits + commas)
    '\\s*\\d*' +                              // sometimes trailing digit from broken line
    '\\s+(\\d{2}-\\d{2}-\\d{2})' +            // first investment date
    '\\s*\\(\\s*(\\d+)\\s*Days?\\s*\\)' +     // (NNNN Days)
    // Now 14 numeric fields:
    '\\s+([\\d.,]+)' +                        // Sensex
    '\\s+([\\d.,]+)' +                        // Inv Cost
    '\\s+([\\d.,]+)' +                        // S Duty
    '\\s+([\\d.,]+)' +                        // DivR (Dividend Reinvest cost)
    '\\s+([\\d.,]+)' +                        // Units
    '\\s+([\\d.,]+)' +                        // Price (allotment)
    '\\s+([\\d.,]+)' +                        // Cur NAV
    '\\s+(\\d{1,2}-[A-Za-z]+)' +              // NAV Date (e.g., 25-May)
    '\\s+([\\d.,]+)' +                        // Cur Value
    '\\s+([\\d.,]+)' +                        // Div Reinv
    '\\s+([\\d.,]+)' +                        // Div Paid
    '\\s+([\\d.,]+)' +                        // Total
    '\\s+(-?[\\d.,]+)' +                      // Gain/Loss
    '\\s+(-?[\\d.,]+)%' +                     // Abs Rtn % (allow commas
                                              //   — 23-year holds can be
                                              //   2,292% absolute return)
    '\\s+(-?[\\d.,]+)%'                       // XIRR %
  );

  const m = row.match(re);
  if (!m) return null;
  const [
    , schemeRaw, sipTag, folio, , invSinceDdMmYy, , , invCostStr, , , unitsStr, , currentNavStr, , currentValueStr, , , , , ,
  ] = m;
  // The variadic destructure above is awkward; use indexed access for safety.
  const schemeName = (m[1] + (m[2] ?? '')).trim();
  // m[3] = folio, m[4] = date, m[5] = days
  const folioNumber = m[3];
  const firstInvDate = normaliseDdMmYy(m[4]);
  // m[6]=Sensex, m[7]=InvCost, m[8]=SDuty, m[9]=DivR, m[10]=Units,
  // m[11]=Price, m[12]=CurNAV, m[13]=NavDate, m[14]=CurValue
  const invCost = numeric(m[7]);
  const units = numeric(m[10]);
  const currentNav = numeric(m[12]);
  const currentValue = numeric(m[14]);

  if (invCost <= 0 || currentValue <= 0) return null;

  const cleanedScheme = cleanSchemeName(schemeName);
  const amcName = guessAmcFromSchemeName(cleanedScheme);

  // Suppress unused-var lint
  void schemeRaw; void sipTag; void invSinceDdMmYy; void invCostStr; void unitsStr; void currentNavStr; void currentValueStr; void category;

  return {
    entityName: panName,
    entityType: detectEntityType(panName),
    fundName: schemeName,                     // keep "(SIP)" for downstream SIP detection
    folioNumber,
    amcName,
    units,
    currentNav,
    currentValue,
    investedAmount: invCost,
    firstInvestmentDate: firstInvDate,
  };
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
    'canara robeco': 'Canara Robeco Mutual Fund',
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
// CAMS / KFintech DETAILED CONSOLIDATED ACCOUNT STATEMENT
//
// The transaction-level CAS investors download from CAMS/KFintech.
// Most reliable source: full scheme names, exact units / cost / value.
//
// Per-scheme block structure (each appears exactly once per holding):
//   <AMC> Mutual Fund                                   ← AMC header (own line)
//   PAN: XXXXX KYC: OK ...
//   <CODE>-<Scheme Name> - <Plan> - ISIN: <isin>...     ← scheme line (may wrap)
//   Folio No: <folio> / <n>
//   <holder name> / Nominee lines / Opening Unit Balance
//   <DD-Mon-YYYY> <amt> <price><units>Purchase <bal>    ← transactions
//   *** Stamp Duty ***
//   NAV on <date>: INR <nav> Market Value on <date>: INR <value>
//   <exit-load prose>
//   Closing Unit Balance: <units> Total Cost Value: <cost>   ← closes the block
// ─────────────────────────────────────────────────────────────────

/**
 * MF Central "Consolidated Account Summary" (mfcentral.com — a CAMS+KFintech
 * summary). Distinct from the detailed CAS: holdings-only, no transactions, with
 * a unique footer marker. Each holding is three lines under a (possibly wrapped)
 * scheme name:
 *   <Invested> <Market> <Gain>
 *   (<±pct>%)
 *   <Units> <NavDate><Folio> <NAV>     ← NAV date is glued to the folio number
 */
function isMfCentralCasSummary(text: string): boolean {
  return (
    /MFCentralCASSummary/i.test(text) ||
    (/Consolidated\s+Account\s+Summary/i.test(text) && /CAMS\s+and\s+KFintech/i.test(text))
  );
}

function extractInvestorNameMfc(text: string): string | undefined {
  // The PAN-holder name is the line immediately after "PAN :ABCDE1234F".
  const m = text.match(/PAN\s*:\s*[A-Z]{5}\d{4}[A-Z]\s*[\r\n]+\s*([A-Z][A-Z .]{2,60})/);
  return m ? m[1].trim().replace(/\s+/g, ' ') : undefined;
}

function parseMfCentralCasSummary(text: string): CasParseResult {
  const investorName = extractInvestorNameMfc(text) ?? extractInvestorNameCams(text) ?? extractInvestorName(text);
  const pan = extractPan(text);
  const holdings: RawHolding[] = [];

  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

  // Page chrome / column headers / totals / address block — never part of a name.
  const NOISE = /^(Consolidated Account Summary|\( As on Date|MFCentralCASSummary|SoA Holdings|Demat Holdings|Invested Value|Market Value|Gain\/Loss|\(INR\)|\(Absolute\)|Balance|Units NAV Date|Scheme Details|Folio No\.|Client Id|NAV$|Total\b|-- No MF|#IDCW|Allocation by Asset Class|EQUITY|DEBT|The Consolidated Account|CAMS and KFintech|investor friendly|are holding investments|If you find|Mutual Fund folios|PAN\s*:|Mobile\s*:|Email\s*:|Page \d+ of \d+|\d{6},\s)/i;

  // Anchor: "<name-tail?> <Invested> <Market> <Gain(±)>"
  const anchorRe = /^(.*?)([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+\(?-?[\d,]+\.\d{2}\)?\s*$/;
  // "<Units> <NavDate><Folio> <NAV>" — NavDate (DD-Mon-YYYY) is glued to the folio.
  const unitsRe = /^([\d,]+\.\d+)\s+(?:(\d{1,2}-[A-Za-z]{3}-\d{4})(\d+))?\s*([\d,]+\.?\d*)?\s*$/;
  const pctOnly = /^\([+-]?[\d.,]+%\)$/;

  let nameBuf: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (NOISE.test(ln)) { nameBuf = []; continue; }

    const m = ln.match(anchorRe);
    if (!m) {
      if (!pctOnly.test(ln)) nameBuf.push(ln); // accumulate a (possibly wrapped) scheme name
      continue;
    }

    const fullName = [...nameBuf, m[1].trim()].join(' ').replace(/\s+/g, ' ').trim();
    const invested = numeric(m[2]);
    const market = numeric(m[3]);
    nameBuf = [];

    // The next data line (skipping the percentage line) carries units / folio / NAV.
    let units = 0, folio = '', nav = 0;
    for (let j = i + 1; j <= i + 3 && j < lines.length; j++) {
      if (anchorRe.test(lines[j])) break; // ran into the next holding — no units line
      const um = lines[j].match(unitsRe);
      if (um) {
        units = numeric(um[1]);
        folio = um[3] || '';
        nav = numeric(um[4] || '');
        i = j; // consume up to and including the units line
        break;
      }
    }

    // Skip zero-balance / redeemed folios and any nameless block.
    if (!fullName || (market <= 0 && invested <= 0)) continue;

    holdings.push({
      entityName: investorName ?? 'Unknown',
      entityType: detectEntityType(investorName ?? ''),
      fundName: cleanSchemeName(fullName),
      folioNumber: folio,
      amcName: guessAmcFromSchemeName(fullName),
      units,
      currentNav: nav || undefined,
      currentValue: market,
      investedAmount: invested,
    });
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));
  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'MF Central Consolidated Account Summary detected but no holdings could be extracted. The PDF layout may have changed.'
      : undefined,
    investorName,
    pan,
    holdings,
    sips: [], // a summary has no SIP register — add SIPs separately, never fabricate
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

function isCamsDetailedCas(text: string): boolean {
  return (
    /Consolidated\s+Account\s+Statement/i.test(text) &&
    /Closing\s+Unit\s+Balance/i.test(text) &&
    /Total\s+Cost\s+Value/i.test(text)
  );
}

/** Strip plan/option/parenthetical noise from a CAMS scheme line to the base fund name. */
function cleanCamsSchemeName(raw: string): string {
  let n = raw.replace(/\s*-\s*ISIN.*$/i, '');                                   // drop "- ISIN: ..." onward
  n = n.replace(/\s*[-–]\s*(Direct|Regular)\b.*$/i, '');                        // "- Direct Plan - Growth ..."
  n = n.replace(/\s+(Direct|Regular)\b.*$/i, '');                              // "...Fund Direct Growth" (no hyphen)
  n = n.replace(/\(erstwhile[^)]*\)/gi, '').replace(/\(formerly[^)]*\)/gi, '').replace(/\(Demat\)/gi, '');
  n = n.replace(/\s*[-–]\s*(Growth|Dividend|IDCW)\b.*$/i, '');                  // residual "- Growth"
  n = n.replace(/\s+(Growth|Dividend|IDCW)\b.*$/i, '');                        // residual bare option
  return n.replace(/\s+/g, ' ').trim();
}

function extractInvestorNameCams(text: string): string | undefined {
  // Holder name sits on its own line right after the "Email Id: ..." line.
  const m = text.match(/Email\s*Id\s*:\s*\S+\s*\n\s*([A-Z][A-Za-z .]{2,50}?)\s*\n/i);
  if (m?.[1] && !/Mutual\s+Fund|Consolidated/i.test(m[1])) return m[1].replace(/\s+/g, ' ').trim();
  return undefined;
}

function parseCamsDetailedCas(text: string): CasParseResult {
  const investorName = extractInvestorNameCams(text) ?? extractInvestorName(text);
  const pan = extractPan(text);
  const holdings: RawHolding[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const amcRe = /^([A-Z][A-Za-z&.\s]+?(?:Mutual\s+Fund|MF))$/;
  const schemeCodeRe = /^([A-Z0-9]{3,12})-(.+)$/;
  const folioRe = /Folio\s*No\s*:\s*([0-9][0-9/\s-]*)/i;
  const navMvRe = /NAV\s+on\s+[^:]+:\s*INR\s*([\d,]+\.?\d*)\s*Market\s+Value\s+on\s+[^:]+:\s*INR\s*([\d,]+\.?\d*)/i;
  const closingRe = /Closing\s+Unit\s+Balance\s*:\s*([\d,]+\.?\d*)\s*Total\s+Cost\s+Value\s*:\s*([\d,]+\.?\d*)/i;
  const txnDateRe = /^(\d{2}-[A-Za-z]{3}-\d{4})\b/;

  let currentAmc = '';
  let pName = '';
  let pNameDone = false;
  let pFolio = '';
  let pNav = 0, pValue = 0, pUnits = 0, pCost = 0;
  let pFirstDate: string | undefined;
  let inBlock = false;

  const reset = () => {
    pName = ''; pNameDone = false; pFolio = '';
    pNav = 0; pValue = 0; pUnits = 0; pCost = 0;
    pFirstDate = undefined; inBlock = false;
  };

  for (const ln of lines) {
    if (!ln) continue;

    // AMC header (own line, no digits → not the PORTFOLIO SUMMARY rows)
    const am = ln.match(amcRe);
    if (am && !/\d/.test(ln)) { currentAmc = am[1].trim(); continue; }

    // Scheme-code line starts a fresh block
    const sc = ln.match(schemeCodeRe);
    if (sc && /ISIN|Direct|Regular|Growth|Plan|Fund/i.test(ln)) {
      reset();
      inBlock = true;
      pName = sc[2];
      if (/\bISIN\b/i.test(ln)) pNameDone = true;
      continue;
    }

    if (!inBlock) continue;

    // Accumulate a wrapped scheme name until the ISIN appears
    if (!pNameDone) {
      if (folioRe.test(ln) || txnDateRe.test(ln) || /^Opening\s+Unit\s+Balance/i.test(ln)) {
        pNameDone = true; // fall through to folio handling below
      } else {
        pName += ' ' + ln;
        if (/\bISIN\b/i.test(ln)) pNameDone = true;
        continue;
      }
    }

    const fm = ln.match(folioRe);
    if (fm && !pFolio) { pFolio = fm[1].replace(/\s+/g, '').replace(/\/+$/, ''); continue; }

    if (!pFirstDate) {
      const dm = ln.match(txnDateRe);
      if (dm && /Purchase/i.test(ln)) pFirstDate = normaliseDate(dm[1]);
    }

    const nm = ln.match(navMvRe);
    if (nm) { pNav = numeric(nm[1]); pValue = numeric(nm[2]); continue; }

    const cm = ln.match(closingRe);
    if (cm) {
      pUnits = numeric(cm[1]);
      pCost = numeric(cm[2]);
      const name = cleanCamsSchemeName(pName);
      if (name && pCost > 0 && pValue > 0) {
        holdings.push({
          entityName: investorName ?? 'Unknown',
          entityType: detectEntityType(investorName ?? ''),
          fundName: name,
          folioNumber: pFolio || '',
          amcName: currentAmc || guessAmcFromSchemeName(name),
          units: pUnits,
          currentNav: pNav,
          currentValue: pValue,
          investedAmount: pCost,
          firstInvestmentDate: pFirstDate,
        });
      }
      reset();
      continue;
    }
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'CAMS/KFintech statement detected but no scheme blocks could be extracted. The PDF layout may have changed; share the file with engineering.'
      : undefined,
    investorName,
    pan,
    holdings,
    sips: [], // CAMS detailed CAS has no explicit SIP register — added separately
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
}

// ─────────────────────────────────────────────────────────────────
// TRUSTNER "PORTFOLIO VALUATION REPORT BY CAS" (newer compact export)
//
// Header: "Portfolio Valuation Report By CAS as on Date - <date>"
//         "TRUSTNER  AMFI-Registered Mutual Fund Distributor"
//         "Mutual Fund Summary Report"
//         "Scheme Name Inv. Since Sensex Inv. Cost Units Pur. Nav Cur. Nav
//          Nav Date Cur. Value Div Reinv Div Paid Gain / Loss Abs. Rtn. XIRR"
//
// Per-holding block (pypdf breaks the scheme name across 1-2 lines):
//   Equity - Flexi Cap Fund                 ← category header
//   Nippon India Flexi Cap                  ← scheme name (line 1)
//   Fund Growth                             ← scheme name (line 2) [+ glued "(ISIN)"]
//   (INF204KC1121)                          ← ISIN (own line OR glued to name)
//   Folio: 488382587322
//   ARN - INZ000031633
//   PAN: [code]
//   <DD-MM-YY> [<Sensex>] <InvCost> <Units> <PurNav> <CurNav> <NavDate>
//             <CurValue> <DivReinv> <DivPaid> <Gain> <Abs%> <XIRR%>   ← DATA LINE
//
// The Sensex column is sometimes BLANK, so we anchor positions off the
// NavDate token (DD-Mon) rather than counting from the left.
// ─────────────────────────────────────────────────────────────────

function isTrustnerCasValuationReport(text: string): boolean {
  return (
    /Portfolio\s+Valuation\s+Report\s+By\s+CAS/i.test(text) ||
    (/Valuation\s+Report\s+By\s+CAS\s+as\s+on\s+Date/i.test(text) &&
      /Mutual\s+Fund\s+Summary\s+Report/i.test(text))
  );
}

function cleanTrustnerCasName(s: string): string {
  return s
    .replace(/\(INF[A-Z0-9]{9,12}\)/gi, '')
    .replace(/\s+(Growth|Dividend|IDCW|Reinvestment|Payout)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTrustnerCasValuationReport(text: string): CasParseResult {
  const investorName =
    text.match(/Client\s+Name\s*:\s*\n\s*([A-Z][A-Za-z .]{2,50}?)\s*\n/i)?.[1]?.trim() ??
    extractInvestorName(text);
  const pan = extractPan(text);
  const holdings: RawHolding[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const categoryRe = /^(Equity|Debt|Hybrid|Others?|Solution\s+Oriented)\s*[-–]\s*.+/i;
  const totalRe = /Total\s*:?-/i;
  const folioLineRe = /^Folio\s*:\s*(\S+)/i;
  const isinGluedRe = /\(INF[A-Z0-9]{9,12}\)/i;
  const isinOnlyRe = /^\(INF[A-Z0-9]{9,12}\)$/i;
  const navDateTok = /^\d{1,2}-[A-Za-z]{3,}$/;
  // Data row: starts with InvSince DD-MM-YY, ends with two percentage columns.
  const dataLineRe = /^\d{2}-\d{2}-\d{2}\s+.*-?\d+(?:\.\d+)?%\s+-?\d+(?:\.\d+)?%$/;

  let nameBuf: string[] = [];
  let pFolio = '';
  let nameDone = false;

  const resetPending = () => { nameBuf = []; pFolio = ''; nameDone = false; };

  for (const ln of lines) {
    if (categoryRe.test(ln)) { resetPending(); continue; }
    if (totalRe.test(ln)) { resetPending(); continue; }
    if (/^Scheme\s+Name\s+Inv/i.test(ln)) { resetPending(); continue; }
    if (/^(Top\s+\d+|Scheme\s+Type\s+Wise|Portfolio\s+Asset|Grand\s+Total|Disclaimer|Fund\s+Type|Sector|Equity\s+Holding|Debt\s+Holding|Asset\s+Type)/i.test(ln)) {
      resetPending();
      continue;
    }

    // Data line → emit the pending holding
    if (dataLineRe.test(ln) && nameBuf.length > 0) {
      const tokens = ln.split(/\s+/);
      const navIdx = tokens.findIndex((t) => navDateTok.test(t) && !/^\d{2}-\d{2}-\d{2}$/.test(t));
      if (navIdx >= 4) {
        const left = tokens.slice(0, navIdx);   // [InvSince, (Sensex?), InvCost, Units, PurNav, CurNav]
        const right = tokens.slice(navIdx + 1); // [CurValue, DivReinv, DivPaid, Gain, Abs%, XIRR%]
        const invSince = left[0];
        const curNav = numeric(left[left.length - 1]);
        const units = numeric(left[left.length - 3]);
        const invCost = numeric(left[left.length - 4]);
        const curValue = numeric(right[0]);
        const name = cleanTrustnerCasName(nameBuf.join(' '));
        if (name && invCost > 0 && curValue > 0) {
          holdings.push({
            entityName: investorName ?? 'Unknown',
            entityType: detectEntityType(investorName ?? ''),
            fundName: name,
            folioNumber: pFolio || '',
            amcName: guessAmcFromSchemeName(name),
            units,
            currentNav: curNav,
            currentValue: curValue,
            investedAmount: invCost,
            firstInvestmentDate: normaliseDdMmYy(invSince),
          });
        }
      }
      resetPending();
      continue;
    }

    const fm = ln.match(folioLineRe);
    if (fm) { pFolio = fm[1].replace(/\/+$/, ''); continue; }
    if (/^ARN\b/i.test(ln) || /^PAN\s*:/i.test(ln)) continue;
    if (isinOnlyRe.test(ln)) { nameDone = true; continue; }

    // Otherwise a scheme-name fragment — accumulate until the ISIN closes it
    if (!nameDone) {
      const cleaned = ln.replace(isinGluedRe, '').trim();
      if (cleaned) nameBuf.push(cleaned);
      if (isinGluedRe.test(ln)) nameDone = true;
    }
  }

  const amcSet = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));
  const folioSet = new Set(holdings.map((h) => h.folioNumber ?? '').filter(Boolean));

  return {
    success: holdings.length > 0,
    error: holdings.length === 0
      ? 'Trustner Portfolio Valuation Report (By CAS) detected but no scheme rows could be extracted. The PDF layout may have changed; share the file with engineering.'
      : undefined,
    investorName,
    pan,
    holdings,
    sips: [], // SIP register not present in this report — added separately
    totalFoliosFound: folioSet.size,
    totalAmcsFound: amcSet.size,
  };
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
