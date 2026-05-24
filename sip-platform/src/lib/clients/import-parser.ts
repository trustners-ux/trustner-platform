/**
 * Client Master Import Parser
 *
 * Parses a CSV or XLSX upload into normalized client family rows
 * with header-mapping flexibility — accepts the most common variants
 * Trustner's team has historically used in spreadsheets ("Name" vs
 * "Family Name" vs "Client Name", "Mobile" vs "Phone" vs "Contact").
 *
 * DPDP-aware: extracts only the fields we explicitly recognize,
 * never persists unknown columns. PAN is stored separately (encrypted
 * field) and never exposed in the dry-run preview unless caller has
 * elevated role.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────
// CANONICAL FIELDS + HEADER ALIASES
// ─────────────────────────────────────────────────────────────────

export type CanonicalField =
  | 'familyName'
  | 'primaryContactName'
  | 'primaryContactMobile'
  | 'primaryContactEmail'
  | 'primaryContactPan'
  | 'segment'
  | 'familyCode'
  | 'notes';

/**
 * For each canonical field: list of header-text variants we'll accept
 * (case- + whitespace-insensitive match). Add new aliases here as the
 * team encounters them.
 */
const HEADER_ALIASES: Record<CanonicalField, string[]> = {
  familyName: [
    'family name', 'family', 'household name', 'household', 'client name',
    'name', 'investor name', 'investor', 'group name',
  ],
  primaryContactName: [
    'contact name', 'primary contact', 'primary contact name', 'contact person',
    'kyc name', 'individual name', 'first name + last name', 'full name',
  ],
  primaryContactMobile: [
    'mobile', 'mobile number', 'mobile no', 'phone', 'phone number',
    'contact', 'contact no', 'contact number', 'cell', 'cell number',
    'whatsapp', 'whatsapp number', 'primary mobile',
  ],
  primaryContactEmail: [
    'email', 'email id', 'email address', 'e-mail', 'mail',
    'primary email', 'contact email',
  ],
  primaryContactPan: [
    'pan', 'pan number', 'pan no', 'pan card', 'permanent account number',
    'income tax pan',
  ],
  segment: [
    'segment', 'category', 'client category', 'tier', 'aum band',
    'classification', 'client type',
  ],
  familyCode: [
    'family code', 'code', 'client code', 'arn code', 'unique id', 'cid',
    'customer id',
  ],
  notes: [
    'notes', 'remarks', 'comments', 'description', 'about', 'memo',
  ],
};

const VALID_SEGMENTS = ['Mass', 'Retail', 'HNI', 'UHNI', 'Corporate'];

// ─────────────────────────────────────────────────────────────────
// PARSING
// ─────────────────────────────────────────────────────────────────

export interface ParsedRow {
  rowNumber: number;        // 1-indexed line in source file (header is row 1)
  familyName: string | null;
  primaryContactName: string | null;
  primaryContactMobile: string | null;
  primaryContactEmail: string | null;
  primaryContactPan: string | null;
  segment: string | null;
  familyCode: string | null;
  notes: string | null;
  /** Per-row validation errors (empty array = row is valid). */
  errors: string[];
  /** Per-row warnings — non-blocking issues we'll still import. */
  warnings: string[];
}

export interface ParseResult {
  ok: boolean;
  rows: ParsedRow[];
  /** Column → canonical-field mapping we inferred. Shown to the user
   *  to confirm before commit. */
  columnMap: Record<string, CanonicalField | 'IGNORED'>;
  /** Headers we couldn't map (for the "we didn't recognize these"
   *  warning). */
  unmappedHeaders: string[];
  /** Total rows scanned (excludes header). */
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatesInFile: number;
  /** Top-level error (e.g. file format, unreadable). Stops processing. */
  fatalError?: string;
}

/**
 * Parse a CSV/XLSX/XLS buffer into canonical rows. Pure function —
 * doesn't touch the DB. Caller uses this for both dry-run preview
 * and commit.
 */
export function parseClientImport(
  fileBuffer: Buffer,
  fileName: string
): ParseResult {
  const result: ParseResult = {
    ok: false,
    rows: [],
    columnMap: {},
    unmappedHeaders: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    duplicatesInFile: 0,
  };

  // ── 1. Read the file into a worksheet ──
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: false,
      raw: false,
    });
  } catch (e) {
    result.fatalError = `Could not parse file: ${e instanceof Error ? e.message : String(e)}. Make sure it is a valid CSV, XLS, or XLSX.`;
    return result;
  }

  if (workbook.SheetNames.length === 0) {
    result.fatalError = 'File contains no sheets.';
    return result;
  }

  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  if (aoa.length < 2) {
    result.fatalError =
      'File contains no data rows. Need at least 1 header row + 1 data row.';
    return result;
  }

  // ── 2. Map headers → canonical fields ──
  const headerRow = (aoa[0] as unknown[]).map((c) => String(c ?? '').trim());
  const colCount = headerRow.length;
  const headerToCanonical: Array<CanonicalField | 'IGNORED'> = headerRow.map((h) => {
    const norm = h.toLowerCase().replace(/[_\-./]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!norm) return 'IGNORED';
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => a === norm)) return canonical as CanonicalField;
    }
    return 'IGNORED';
  });

  // Build a more readable columnMap for the response
  for (let i = 0; i < colCount; i++) {
    const original = headerRow[i] || `(empty col ${i + 1})`;
    result.columnMap[original] = headerToCanonical[i];
    if (headerToCanonical[i] === 'IGNORED' && original.length > 0) {
      result.unmappedHeaders.push(original);
    }
  }

  // Make sure we have at least familyName (or contactName as fallback)
  const haveFamilyName = headerToCanonical.includes('familyName');
  const haveContactName = headerToCanonical.includes('primaryContactName');
  if (!haveFamilyName && !haveContactName) {
    result.fatalError =
      'Could not find a "Family Name" or "Contact Name" column. Make sure your file has at least one of these (any of: family name, household, client name, contact name).';
    return result;
  }

  // ── 3. Walk data rows ──
  const seenKeys = new Set<string>(); // for in-file duplicate detection
  for (let i = 1; i < aoa.length; i++) {
    const sourceRow = aoa[i] as unknown[];
    const rowNumber = i + 1;

    const parsed: ParsedRow = {
      rowNumber,
      familyName: null,
      primaryContactName: null,
      primaryContactMobile: null,
      primaryContactEmail: null,
      primaryContactPan: null,
      segment: null,
      familyCode: null,
      notes: null,
      errors: [],
      warnings: [],
    };

    for (let c = 0; c < colCount; c++) {
      const canonical = headerToCanonical[c];
      if (canonical === 'IGNORED') continue;
      const raw = String(sourceRow[c] ?? '').trim();
      if (!raw) continue;
      switch (canonical) {
        case 'familyName':            parsed.familyName = raw; break;
        case 'primaryContactName':    parsed.primaryContactName = raw; break;
        case 'primaryContactMobile':  parsed.primaryContactMobile = normalizeMobile(raw); break;
        case 'primaryContactEmail':   parsed.primaryContactEmail = raw.toLowerCase(); break;
        case 'primaryContactPan':     parsed.primaryContactPan = raw.toUpperCase().replace(/\s/g, ''); break;
        case 'segment':               parsed.segment = normalizeSegment(raw); break;
        case 'familyCode':            parsed.familyCode = raw; break;
        case 'notes':                 parsed.notes = raw; break;
      }
    }

    // Fallback: if no family name but we have contact name, use contact as family
    if (!parsed.familyName && parsed.primaryContactName) {
      parsed.familyName = parsed.primaryContactName;
      parsed.warnings.push(`Auto-derived family name from contact name "${parsed.primaryContactName}"`);
    }

    // Skip fully empty rows
    if (
      !parsed.familyName && !parsed.primaryContactName &&
      !parsed.primaryContactMobile && !parsed.primaryContactEmail
    ) {
      continue;
    }

    // ── Validation ──
    if (!parsed.familyName) parsed.errors.push('Family name is required');
    if (!parsed.primaryContactMobile && !parsed.primaryContactEmail) {
      parsed.errors.push('Either mobile OR email is required (need to be able to contact this client)');
    }
    if (parsed.primaryContactMobile && !/^\d{10}$/.test(parsed.primaryContactMobile)) {
      parsed.warnings.push(`Mobile "${parsed.primaryContactMobile}" is not 10 digits — saved as-is, please verify`);
    }
    if (parsed.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.primaryContactEmail)) {
      parsed.warnings.push(`Email "${parsed.primaryContactEmail}" looks malformed — saved as-is, please verify`);
    }
    if (parsed.primaryContactPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(parsed.primaryContactPan)) {
      parsed.warnings.push(`PAN "${parsed.primaryContactPan}" does not match standard format ABCDE1234F`);
    }
    if (parsed.segment && !VALID_SEGMENTS.includes(parsed.segment)) {
      parsed.warnings.push(`Segment "${parsed.segment}" not standard — defaulting to "Mass"`);
      parsed.segment = 'Mass';
    }

    // In-file duplicate detection — flag if same mobile or email appears twice
    const dedupKey = (parsed.primaryContactMobile ?? '') + '|' + (parsed.primaryContactEmail ?? '');
    if (dedupKey !== '|' && seenKeys.has(dedupKey)) {
      parsed.warnings.push('Duplicate of an earlier row in this file (same mobile + email)');
      result.duplicatesInFile += 1;
    } else if (dedupKey !== '|') {
      seenKeys.add(dedupKey);
    }

    if (parsed.errors.length === 0) result.validRows += 1;
    else result.invalidRows += 1;

    result.rows.push(parsed);
    result.totalRows += 1;
  }

  result.ok = result.totalRows > 0 && result.validRows > 0;
  return result;
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function normalizeMobile(raw: string): string {
  // Strip spaces, dashes, parens, plus signs, country code "91" prefix
  let s = raw.replace(/[\s\-().]/g, '');
  s = s.replace(/^\+91/, '').replace(/^0091/, '').replace(/^91(?=\d{10})/, '');
  // Strip leading 0
  s = s.replace(/^0+/, '');
  return s;
}

function normalizeSegment(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('uhni') || lower.includes('ultra')) return 'UHNI';
  if (lower.includes('hni') || lower.includes('high net')) return 'HNI';
  if (lower.includes('corp')) return 'Corporate';
  if (lower.includes('retail')) return 'Retail';
  if (lower.includes('mass')) return 'Mass';
  return raw; // let caller validate
}

// ─────────────────────────────────────────────────────────────────
// CSV TEMPLATE BUILDER
// ─────────────────────────────────────────────────────────────────

/** Returns a CSV template string the team can download + fill out. */
export function buildCsvTemplate(): string {
  const headers = [
    'Family Name',
    'Primary Contact Name',
    'Mobile',
    'Email',
    'PAN',
    'Segment',
    'Family Code',
    'Notes',
  ];
  const examples = [
    [
      'Sharma Family',
      'Ramesh Sharma',
      '9988776655',
      'ramesh.sharma@example.com',
      'ABCDE1234F',
      'HNI',
      'SHA-2026-001',
      'Long-term client; goal: child education + retirement',
    ],
    [
      'Gupta',
      'Priya Gupta',
      '9876543210',
      'priya@example.com',
      '',
      'Retail',
      '',
      'Onboarded via Sangeeta',
    ],
  ];
  const lines = [headers, ...examples].map((r) =>
    r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
  );
  return lines.join('\n');
}
