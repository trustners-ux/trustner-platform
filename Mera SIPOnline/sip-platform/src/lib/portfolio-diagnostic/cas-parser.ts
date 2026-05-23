/**
 * Portfolio Diagnostic — CAS PDF Parser
 *
 * Parses Karvy/CAMS Consolidated Account Statement (CAS) PDFs into
 * structured holdings + active SIPs.
 *
 * Indian CAS PDFs are text-based (not scanned). Both CAMS and Karvy
 * use similar formats with sections per AMC and per folio.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

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
 * Parse a CAS PDF buffer. Returns structured holdings + SIPs.
 *
 * Implementation note: we use `pdf-parse` (npm) to extract text;
 * then regex-based section parsing. CAS format is stable enough
 * that regex is reliable for v1.
 */
export async function parseCasPdf(input: {
  pdfBuffer: Buffer;
  password?: string;          // CAS PDFs are usually password-protected (PAN)
}): Promise<CasParseResult> {
  try {
    // Lazy import so the heavy dep is only loaded server-side.
    // pdf-parse's installed ESM index doesn't expose a clean `default` —
    // cast through unknown then a permissive callable type so build is
    // happy whether the resolved module is CJS-default or ESM-named.
    const mod = (await import('pdf-parse')) as unknown as {
      default?: (buf: Buffer, opts?: unknown) => Promise<{ text: string }>;
    } & ((buf: Buffer, opts?: unknown) => Promise<{ text: string }>);
    const pdfParse = (mod.default ?? mod) as (buf: Buffer, opts?: unknown) => Promise<{ text: string }>;

    const data = await pdfParse(input.pdfBuffer, {
      password: input.password,
    });

    const text = data.text;
    if (!text || text.length < 500) {
      return {
        success: false,
        error: 'PDF text is too short — likely scanned image, not text-based',
        holdings: [],
        sips: [],
        totalFoliosFound: 0,
        totalAmcsFound: 0,
      };
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
