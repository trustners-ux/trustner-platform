// ─── Simple CSV Parser ───
// Handles quoted fields, commas inside quotes, and newlines

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV text into headers + rows.
 * Handles: quoted fields, commas in quotes, escaped quotes (""), CRLF/LF.
 */
export function parseCSV(text: string): ParsedCSV {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ""
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r') {
        // Skip \r, handle \r\n
        i++;
      } else if (ch === '\n') {
        current.push(field.trim());
        field = '';
        if (current.length > 1 || current[0] !== '') {
          rows.push(current);
        }
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Handle last field/row
  if (field || current.length > 0) {
    current.push(field.trim());
    if (current.length > 1 || current[0] !== '') {
      rows.push(current);
    }
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0];
  return { headers, rows: rows.slice(1) };
}

/**
 * Parse an Excel file (.xlsx / .xls) buffer into headers + rows.
 * Uses the first sheet by default.
 */
export async function parseExcel(buffer: ArrayBuffer): Promise<ParsedCSV> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (data.length === 0) return { headers: [], rows: [] };

  const headers = data[0].map((h: unknown) => String(h ?? '').trim());
  const rows = data.slice(1).filter((row: string[]) =>
    row.some((cell: string) => String(cell ?? '').trim() !== '')
  ).map((row: string[]) => row.map((cell: string) => String(cell ?? '').trim()));

  return { headers, rows };
}

// ─── Column Detection & Mapping ───

export type SystemField =
  | 'employeeName'
  | 'employeeCode'
  | 'product'
  | 'amount'
  | 'clientName'
  | 'policyNumber'
  | 'insurer'
  | 'channelPayoutPct'
  | 'fpRoute'
  | 'date'
  | 'status'
  | 'ignore';

export interface ColumnMapping {
  [csvColumn: string]: SystemField;
}

export type FileFormat = 'mf' | 'insurance' | 'generic' | 'unknown';

// Known header patterns for auto-detection
const MF_PATTERNS: Record<string, SystemField> = {
  'transaction date': 'date',
  'trans date': 'date',
  'date': 'date',
  'client name': 'clientName',
  'investor name': 'clientName',
  'client': 'clientName',
  'scheme': 'product',
  'scheme name': 'product',
  'fund': 'product',
  'amount': 'amount',
  'investment amount': 'amount',
  'sip amount': 'amount',
  'nav amount': 'amount',
  'sip date': 'ignore',
  'folio': 'policyNumber',
  'folio no': 'policyNumber',
  'folio number': 'policyNumber',
  'advisor': 'employeeName',
  'advisor/rm': 'employeeName',
  'rm': 'employeeName',
  'rm name': 'employeeName',
  'amc': 'insurer',
  'amc name': 'insurer',
  'fund house': 'insurer',
};

const INSURANCE_PATTERNS: Record<string, SystemField> = {
  'policy no': 'policyNumber',
  'policy number': 'policyNumber',
  'policy no.': 'policyNumber',
  'certificate no': 'policyNumber',
  'customer name': 'clientName',
  'insured name': 'clientName',
  'proposer name': 'clientName',
  'client name': 'clientName',
  'premium': 'amount',
  'gross premium': 'amount',
  'net premium': 'amount',
  'premium amount': 'amount',
  'product': 'product',
  'product name': 'product',
  'plan name': 'product',
  'plan': 'product',
  'company': 'insurer',
  'insurer': 'insurer',
  'insurance company': 'insurer',
  'date': 'date',
  'issue date': 'date',
  'policy date': 'date',
  'status': 'status',
  'advisor': 'employeeName',
  'rm': 'employeeName',
  'rm name': 'employeeName',
  'agent': 'employeeName',
};

const GENERIC_PATTERNS: Record<string, SystemField> = {
  'employee code': 'employeeCode',
  'emp code': 'employeeCode',
  'employee': 'employeeName',
  'employee name': 'employeeName',
  'rm': 'employeeName',
  'product': 'product',
  'product name': 'product',
  'amount': 'amount',
  'raw amount': 'amount',
  'premium': 'amount',
  'client': 'clientName',
  'client name': 'clientName',
  'policy no': 'policyNumber',
  'policy number': 'policyNumber',
  'folio': 'policyNumber',
  'insurer': 'insurer',
  'amc': 'insurer',
  'company': 'insurer',
  'channel payout %': 'channelPayoutPct',
  'channel payout': 'channelPayoutPct',
  'payout %': 'channelPayoutPct',
  'fp route': 'fpRoute',
  'financial plan': 'fpRoute',
};

/**
 * Detect the format of a CSV based on its headers
 */
export function detectFormat(headers: string[]): FileFormat {
  const lower = headers.map(h => h.toLowerCase().trim());

  // Check MF patterns
  const mfMatches = lower.filter(h =>
    h.includes('scheme') || h.includes('folio') || h.includes('amc') ||
    h.includes('sip') || h.includes('nav')
  ).length;

  // Check Insurance patterns
  const insMatches = lower.filter(h =>
    h.includes('policy') || h.includes('premium') || h.includes('insurer') ||
    h.includes('insured') || h.includes('proposer')
  ).length;

  // Check Generic patterns
  const genMatches = lower.filter(h =>
    h.includes('employee code') || h.includes('emp code') || h.includes('channel payout')
  ).length;

  if (genMatches >= 1) return 'generic';
  if (mfMatches >= 2) return 'mf';
  if (insMatches >= 2) return 'insurance';

  return 'unknown';
}

/**
 * Auto-map CSV columns to system fields based on detected format
 */
export function autoMapColumns(headers: string[], format: FileFormat): ColumnMapping {
  const patterns =
    format === 'mf' ? MF_PATTERNS :
    format === 'insurance' ? INSURANCE_PATTERNS :
    GENERIC_PATTERNS;

  const mapping: ColumnMapping = {};

  for (const header of headers) {
    const lower = header.toLowerCase().trim();

    // Exact match first
    if (patterns[lower]) {
      mapping[header] = patterns[lower];
      continue;
    }

    // Partial match
    let matched = false;
    for (const [pattern, field] of Object.entries(patterns)) {
      if (lower.includes(pattern) || pattern.includes(lower)) {
        mapping[header] = field;
        matched = true;
        break;
      }
    }

    if (!matched) {
      mapping[header] = 'ignore';
    }
  }

  return mapping;
}

/**
 * Fuzzy match a product name to system products
 */
export function fuzzyMatchProduct(
  name: string,
  products: { id: number; productName: string; productCategory: string }[]
): { id: number; productName: string } | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  // Exact match
  const exact = products.find(p => p.productName.toLowerCase() === lower);
  if (exact) return exact;

  // Category-based heuristics
  if (lower.includes('sip') || lower.includes('systematic')) {
    return products.find(p => p.productName.includes('MF SIP')) || null;
  }
  if (lower.includes('lumpsum') && lower.includes('equity')) {
    return products.find(p => p.productName.includes('Lumpsum Equity')) || null;
  }
  if (lower.includes('lumpsum') && lower.includes('debt')) {
    return products.find(p => p.productName.includes('Lumpsum Debt')) || null;
  }
  if (lower.includes('ulip')) {
    return products.find(p => p.productName.includes('ULIP')) || null;
  }
  if (lower.includes('single premium') || lower.includes('single pay')) {
    return products.find(p => p.productName.includes('Single Premium')) || null;
  }
  if (lower.includes('term') || lower.includes('life') || lower.includes('endow')) {
    if (lower.includes('10') || lower.includes('long')) {
      return products.find(p => p.productName.includes('Life Regular 10yr+')) || null;
    }
    return products.find(p => p.productName.includes('Life Regular <10yr')) || null;
  }
  if (lower.includes('health') && (lower.includes('port') || lower.includes('renew'))) {
    return products.find(p => p.productName.includes('Port/Renewal')) || null;
  }
  if (lower.includes('health') && (lower.includes('quarter') || lower.includes('half'))) {
    return products.find(p => p.productName.includes('Quarterly/HY')) || null;
  }
  if (lower.includes('health') && lower.includes('2')) {
    return products.find(p => p.productName.includes('2yr')) || null;
  }
  if (lower.includes('health') && lower.includes('3')) {
    return products.find(p => p.productName.includes('3yr')) || null;
  }
  if (lower.includes('health')) {
    return products.find(p => p.productName.includes('Health Fresh')) || null;
  }
  if (lower.includes('motor') && lower.includes('tp')) {
    return products.find(p => p.productName.includes('TP Only')) || null;
  }
  if (lower.includes('motor') && (lower.includes('cv') || lower.includes('lcv') || lower.includes('hcv'))) {
    return products.find(p => p.productName.includes('CV')) || null;
  }
  if (lower.includes('motor') || lower.includes('car') || lower.includes('vehicle')) {
    return products.find(p => p.productName.includes('Private Car')) || null;
  }
  if (lower.includes('gmc') || lower.includes('gpa') || lower.includes('group')) {
    return products.find(p => p.productName.includes('GMC/GPA')) || null;
  }
  if (lower.includes('fire') || lower.includes('marine') || lower.includes('liability') || lower.includes('non-motor') || lower.includes('non motor')) {
    return products.find(p => p.productName === 'GI Non-Motor') || null;
  }
  if (lower.includes('stp')) {
    return products.find(p => p.productName.includes('STP')) || null;
  }

  // Partial match on product name words
  const bestMatch = products.find(p => {
    const pLower = p.productName.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 2);
    return words.filter(w => pLower.includes(w)).length >= 2;
  });

  return bestMatch || null;
}
