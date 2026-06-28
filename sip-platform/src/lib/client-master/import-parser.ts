/**
 * P12.2.5a — Universal client-master import parser.
 *
 * Handles three real-world sources at once:
 *
 *   1. **Investwell** XLSX/CSV exports — MFD client master from
 *      investwellonline.com. Columns include InvestorCode, Holder Name,
 *      PAN, DOB, Family Head, KYC Status, etc.
 *
 *   2. **Redvision Wealth Elite** XLSX/CSV — similar MFD client export.
 *      Often has JointHolder1/2, NomineeName, RiskProfile.
 *
 *   3. **Generic RM Excel** — per-relationship-manager spreadsheets
 *      with ad-hoc column names. Most messy in practice.
 *
 * Strategy (same as the brokerage MIS parser — proven):
 *   - Convert XLSX → tab-separated text via xlsx lib
 *   - PDF → pdf-parse text (then Claude for structure)
 *   - Scan first 5 rows for known column aliases
 *   - If ≥3 of the 5 critical columns found heuristically → use heuristic
 *   - Else → Claude fallback with a strict JSON schema prompt
 *
 * The 5 critical columns:
 *   - name (mandatory)
 *   - mobile OR email (at least one)
 *   - PAN
 *   - DOB
 *   - city OR state (address fragment)
 *
 * Output: array of CreateClientInput-shaped rows + per-row warnings.
 * The wizard then surfaces these for human review BEFORE any commit.
 */

import type { CreateClientInput } from './clients';

// ─── Public types ───────────────────────────────────────────

export interface ParsedClientRow {
  source_row: number; // 1-based, after header
  first_name: string;
  middle_name: string | null;
  last_name: string;
  salutation: string | null;
  display_name: string;
  gender: 'M' | 'F' | 'O' | 'U';
  dob: string | null;
  mobile_primary: string | null;
  mobile_alt: string | null;
  email_primary: string | null;
  email_alt: string | null;
  pan: string | null;
  // We deliberately DON'T capture Aadhaar from imports — MFD platforms
  // don't carry it, and asking RMs to put Aadhaar in Excel is a
  // DPDPA-noncompliant practice. Aadhaar capture happens in the New
  // Client form OR via document upload only.
  aadhaar_full12: null;
  addr_current_line1: string | null;
  addr_current_line2: string | null;
  addr_current_city: string | null;
  addr_current_state: string | null;
  addr_current_pincode: string | null;
  residential_status: 'resident' | 'nri' | 'foreign_national' | 'pio' | 'oci';
  occupation: string | null;
  annual_income_band: string | null;
  risk_profile: 'conservative' | 'moderate' | 'aggressive' | 'unknown';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';
  // Source platform fingerprint
  source_platform_code: string | null;       // their InvestorCode / IWELL CODE
  source_family_head: string | null;          // family head NAME
  source_family_head_code: string | null;     // family head IWELL CODE — graph link
  // Extras: Wealth Elite + similar platforms have 50+ extra fields
  // (AUM, RM, target SIP, joint holders, FATCA, CKYC, etc.) that we
  // preserve verbatim in metadata.* on the created client. This lets
  // us mine them later (Phase G mutual-fund layer especially) without
  // re-importing.
  extras: Record<string, string>;
  tags: string | null;
  notes: string | null;
  // Per-row diagnostics
  warnings: string[];
  errors: string[];
  // Raw row as parsed (kept for debugging + audit trail)
  raw: Record<string, string>;
}

export interface ImportParseResult {
  rows: ParsedClientRow[];
  total: number;
  valid_count: number;
  error_count: number;
  parsing_method: 'heuristic' | 'llm' | 'mixed';
  detected_source: 'investwell' | 'redvision' | 'generic_rm' | 'unknown';
  source_format: 'csv' | 'xlsx' | 'pdf' | 'txt' | 'unknown';
  fatal: string | null;
  header_mapping_debug?: Record<string, string>; // for the wizard's "show me what you mapped" debug pane
}

// ─── Logical columns ────────────────────────────────────────

type LogicalCol =
  | 'salutation'
  | 'name_full'
  | 'first_name'
  | 'middle_name'
  | 'last_name'
  | 'gender'
  | 'dob'
  | 'mobile_primary'
  | 'mobile_alt'
  | 'email_primary'
  | 'email_alt'
  | 'pan'
  | 'addr_line1'
  | 'addr_line2'
  | 'addr_line3'      // WE: ADDRESS3 — concat into addr_line2
  | 'addr_city'
  | 'addr_state'
  | 'addr_pincode'
  | 'addr_country'
  | 'residential_status'
  | 'occupation'
  | 'annual_income_band'  // WE: GROSS ANNUAL INCOME (raw number)
  | 'annual_income_raw'   // WE: ANNUAL INCOME (raw number)
  | 'risk_profile'
  | 'marital_status'
  | 'source_platform_code'        // WE: IWELL CODE
  | 'source_family_head'          // WE: FAMILY HEAD (name)
  | 'source_family_head_code'     // WE: FAMILY HEAD IWELL CODE — the graph link
  | 'source_username'
  | 'source_onboarding_method'    // WE: SOURCE
  | 'rm_name'
  | 'rm_code'
  | 'sub_broker_name'
  | 'sub_broker_code'
  | 'service_rm_name'
  | 'service_rm_code'
  | 'first_investment_date'
  | 'last_review_date'
  | 'client_rating'
  | 'aum'
  | 'target_sip'
  | 'nationality'
  | 'place_of_birth'
  | 'country_of_birth'
  | 'father_name'
  | 'mother_name'
  | 'spouse_name'
  | 'date_of_death'
  | 'joint_holder_1'
  | 'joint_holder_2'
  | 'guardian_name'
  | 'guardian_pan'
  | 'attorney_name'
  | 'attorney_pan'
  | 'nominee_details_raw'
  | 'bank_details_raw'
  | 'mode_of_holding'
  | 'tax_status_raw'
  | 'ckyc_number'
  | 'fatca_status'
  | 'addr_overseas_line1'
  | 'addr_overseas_line2'
  | 'addr_overseas_city'
  | 'addr_overseas_state'
  | 'addr_overseas_country'
  | 'addr_overseas_pincode'
  | 'mobile_overseas'
  | 'phone_overseas'
  | 'referred_by'
  | 'bill_state'
  | 'bill_gstin'
  | 'tags'
  | 'notes';

// ─── Header alias map ───────────────────────────────────────
//
// Lower-cased, stripped of punctuation/spaces in the matcher. Sorted
// roughly by frequency in MFD platform exports.
const HEADER_ALIASES: Record<string, LogicalCol> = {
  // Salutation
  salutation: 'salutation',
  title: 'salutation',
  honorific: 'salutation',
  prefix: 'salutation',

  // Name (full)
  name: 'name_full',
  clientname: 'name_full',
  investorname: 'name_full',
  holdername: 'name_full',
  holder1name: 'name_full',
  primaryholder: 'name_full',
  fullname: 'name_full',
  customername: 'name_full',
  proposername: 'name_full',
  applicantname: 'name_full',
  insuredname: 'name_full',
  displayname: 'name_full',

  // Name parts (when split)
  firstname: 'first_name',
  givenname: 'first_name',
  middlename: 'middle_name',
  middleinitial: 'middle_name',
  lastname: 'last_name',
  surname: 'last_name',
  familyname: 'last_name',

  // Gender
  gender: 'gender',
  sex: 'gender',

  // DOB
  dob: 'dob',
  dateofbirth: 'dob',
  birthdate: 'dob',
  birthday: 'dob',

  // Mobile
  mobile: 'mobile_primary',
  mobileno: 'mobile_primary',
  mobilenumber: 'mobile_primary',
  phone: 'mobile_primary',
  phoneno: 'mobile_primary',
  contactnumber: 'mobile_primary',
  contactno: 'mobile_primary',
  contact: 'mobile_primary',
  primarymobile: 'mobile_primary',
  primaryphone: 'mobile_primary',
  cell: 'mobile_primary',
  cellno: 'mobile_primary',
  whatsapp: 'mobile_primary',
  whatsappno: 'mobile_primary',
  altmobile: 'mobile_alt',
  altphone: 'mobile_alt',
  alternatemobile: 'mobile_alt',
  alternatephone: 'mobile_alt',
  secondarymobile: 'mobile_alt',
  landline: 'mobile_alt',

  // Email
  email: 'email_primary',
  emailid: 'email_primary',
  emailaddress: 'email_primary',
  primaryemail: 'email_primary',
  emailprimary: 'email_primary',
  altemail: 'email_alt',
  alternateemail: 'email_alt',
  secondaryemail: 'email_alt',

  // PAN
  pan: 'pan',
  panno: 'pan',
  pannumber: 'pan',
  panid: 'pan',

  // Address
  address: 'addr_line1',
  address1: 'addr_line1',
  addressline1: 'addr_line1',
  addr1: 'addr_line1',
  corraddress: 'addr_line1',
  correspondenceaddress: 'addr_line1',
  currentaddress: 'addr_line1',
  homeaddress: 'addr_line1',
  residenceaddress: 'addr_line1',
  permanentaddress: 'addr_line1',

  address2: 'addr_line2',
  addressline2: 'addr_line2',
  addr2: 'addr_line2',

  city: 'addr_city',
  town: 'addr_city',
  cityname: 'addr_city',

  state: 'addr_state',
  province: 'addr_state',

  pincode: 'addr_pincode',
  pin: 'addr_pincode',
  zip: 'addr_pincode',
  zipcode: 'addr_pincode',
  postalcode: 'addr_pincode',

  // Profile
  residentialstatus: 'residential_status',
  resident: 'residential_status',
  residency: 'residential_status',
  taxresidence: 'residential_status',
  // Note: `taxstatus` is mapped further down to tax_status_raw so we
  // can preserve the WE verbatim string ("INDIVIDUAL", "NRI -
  // REPATRIABLE (NRE)") AND derive residential_status from it at row-
  // build time. See buildRow().

  occupation: 'occupation',
  profession: 'occupation',
  job: 'occupation',
  designation: 'occupation',

  incomerange: 'annual_income_band',
  income: 'annual_income_band',
  annualincome: 'annual_income_band',
  incomeband: 'annual_income_band',
  incomeslab: 'annual_income_band',
  yearlyincome: 'annual_income_band',

  riskprofile: 'risk_profile',
  risk: 'risk_profile',
  riskappetite: 'risk_profile',
  risktype: 'risk_profile',
  riskcategory: 'risk_profile',
  investorprofile: 'risk_profile',

  maritalstatus: 'marital_status',
  married: 'marital_status',

  // Platform-specific (Investwell / Redvision Wealth Elite IDs)
  clientcode: 'source_platform_code',
  investorcode: 'source_platform_code',
  customercode: 'source_platform_code',
  investorid: 'source_platform_code',
  customerid: 'source_platform_code',
  clientid: 'source_platform_code',
  folio: 'source_platform_code',
  folionumber: 'source_platform_code',
  folioid: 'source_platform_code',
  uniqueid: 'source_platform_code',
  iwellcode: 'source_platform_code',           // Wealth Elite primary code
  iwellcode2: 'source_platform_code',
  appcode: 'source_platform_code',
  username: 'source_username',

  // Family head linking
  familyhead: 'source_family_head',
  family: 'source_family_head',
  headofthefamily: 'source_family_head',
  primaryfamilyhead: 'source_family_head',
  // Skipped: familyheadusername — would override the human-readable
  // FAMILY HEAD name with an email address (longer-string wins rule).
  familyheadiwellcode: 'source_family_head_code',    // THE GRAPH LINK
  familyheadiwellcode2: 'source_family_head_code',

  // Address line 3 (Wealth Elite has 3 lines) + country
  address3: 'addr_line3',
  addressline3: 'addr_line3',
  addr3: 'addr_line3',
  country: 'addr_country',

  // Overseas address (NRI clients)
  osaddress1: 'addr_overseas_line1',
  osaddress2: 'addr_overseas_line2',
  osaddress3: 'addr_overseas_line2',
  overseasaddress: 'addr_overseas_line1',
  overseascity: 'addr_overseas_city',
  overseasstate: 'addr_overseas_state',
  overseascountry: 'addr_overseas_country',
  overseaspin: 'addr_overseas_pincode',
  overseaspincode: 'addr_overseas_pincode',
  overseaszip: 'addr_overseas_pincode',
  overseasmobile: 'mobile_overseas',
  overseasphone: 'phone_overseas',

  // RM + servicing
  relationshipmanager: 'rm_name',
  rm: 'rm_name',
  rmname: 'rm_name',
  relationshipmanagercode: 'rm_code',
  rmcode: 'rm_code',
  subbroker: 'sub_broker_name',
  subbrokercode: 'sub_broker_code',
  servicerm: 'service_rm_name',
  servicermcode: 'service_rm_code',
  referredby: 'referred_by',
  referrer: 'referred_by',

  // MFD-specific portfolio info (preserved in metadata)
  firstinvestmentdate: 'first_investment_date',
  lastreviewdate: 'last_review_date',
  clientrating: 'client_rating',
  rating: 'client_rating',
  aum: 'aum',
  targetsipamout: 'target_sip',     // typo present in WE export
  targetsipamount: 'target_sip',

  // KYC + identity (mostly metadata)
  nationality: 'nationality',
  placeofbirth: 'place_of_birth',
  countryofbirth: 'country_of_birth',
  fathername: 'father_name',
  mothername: 'mother_name',
  spouse: 'spouse_name',
  spousename: 'spouse_name',
  dateofdeath: 'date_of_death',
  jointholder1: 'joint_holder_1',
  jointholder2: 'joint_holder_2',
  guardianname: 'guardian_name',
  guardianpan: 'guardian_pan',
  attorneyname: 'attorney_name',
  attorneypan: 'attorney_pan',
  nomineedetails: 'nominee_details_raw',
  bankdetails: 'bank_details_raw',
  modeofholding: 'mode_of_holding',
  taxstatus: 'tax_status_raw',
  ckyc: 'ckyc_number',
  fatcacams: 'fatca_status',
  fatcakarvy: 'fatca_status',

  // Source / provenance
  source: 'source_onboarding_method',

  // GST billing (corporates / business clients)
  billstate: 'bill_state',
  billgstin: 'bill_gstin',
  gstin: 'bill_gstin',

  // Standard tags + notes
  tags: 'tags',
  category: 'tags',
  segment: 'tags',
  group: 'tags',

  notes: 'notes',
  remarks: 'notes',
  comments: 'notes',
  remark: 'notes',
};

// ─── Source-platform fingerprint detection ──────────────────
//
// Pick "investwell" if headers include their signature columns;
// "redvision" if signature is theirs; else "generic_rm". This drives
// nothing functionally but surfaces in UI ("Detected: Investwell
// export — 247 clients found") so RMs feel confident.

function detectSource(headers: string[]): ImportParseResult['detected_source'] {
  const set = new Set(headers.map(normHeader));
  const investwellSignatures = ['investorcode', 'investorname', 'holder1name', 'familyhead', 'taxstatus'];
  const redvisionSignatures = ['clientcode', 'investorprofile', 'kycstatus', 'wealthelite'];
  const iwHits = investwellSignatures.filter((s) => set.has(s)).length;
  const rvHits = redvisionSignatures.filter((s) => set.has(s)).length;
  if (iwHits >= 2 && iwHits > rvHits) return 'investwell';
  if (rvHits >= 2 && rvHits > iwHits) return 'redvision';
  // If we find core client master fields → it's a real client file, just generic
  if (set.has('name') || set.has('clientname') || set.has('investorname')) return 'generic_rm';
  return 'unknown';
}

// ─── Utilities ──────────────────────────────────────────────

function normHeader(s: string): string {
  return s.toLowerCase().replace(/[\s_\-./()&]/g, '').trim();
}

function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((s) => s.trim());
  // Naive CSV split — handles quoted-comma-inside-string only if there
  // are no nested escapes. For complex CSVs we'd add a real parser;
  // every MFD export we've seen uses tab or simple commas.
  const parts: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur.trim());
  return parts;
}

function parseDate(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  // DD/MM/YYYY (Indian default), DD-MM-YYYY, DD.MM.YYYY
  const m1 = t.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m1) {
    const [, d, mo, y] = m1;
    const fullY = y.length === 2 ? (Number(y) > 30 ? `19${y}` : `20${y}`) : y;
    if (Number(mo) > 12) return null; // not a valid month — bail
    return `${fullY}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // 1-Jan-1990 style
  const m2 = t.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})/);
  if (m2) {
    const [, d, monStr, y] = m2;
    const monMap: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const mo = monMap[monStr.slice(0, 3).toLowerCase()];
    if (!mo) return null;
    const fullY = y.length === 2 ? (Number(y) > 30 ? `19${y}` : `20${y}`) : y;
    return `${fullY}-${mo}-${d.padStart(2, '0')}`;
  }
  return null;
}

function normMobile(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.replace(/[\s\-()]/g, '').replace(/^\+91/, '').replace(/^91(?=\d{10}$)/, '');
  if (!s) return null;
  // Indian 10-digit mobile
  if (/^[6-9][0-9]{9}$/.test(s)) return `+91${s}`;
  // Foreign with + or 11+ digits
  if (/^\+?[0-9]{10,15}$/.test(raw.replace(/[\s\-()]/g, ''))) return raw.replace(/[\s\-()]/g, '');
  return null;
}

function normEmail(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function normPan(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase().replace(/[\s\-]/g, '');
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(s) ? s : null;
}

function normPincode(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.replace(/\D/g, '');
  return /^[1-9][0-9]{5}$/.test(s) ? s : null;
}

function normResidentialStatus(raw: string | null): ParsedClientRow['residential_status'] {
  if (!raw) return 'resident';
  const s = raw.toLowerCase();
  if (/nri|non.?resident|nre|nro/.test(s)) return 'nri';
  if (/foreign|fnr|fii|qfi/.test(s)) return 'foreign_national';
  if (/pio/.test(s)) return 'pio';
  if (/oci/.test(s)) return 'oci';
  // Wealth Elite values we've seen: INDIVIDUAL, INDIAN RESIDENT INDIVIDUAL,
  // HUF, SOLE PROPRIETORSHIP, PARTNERSHIP FIRM, COMPANY, SOCIETY,
  // ON BEHALF OF MINOR — all domestic. Default = resident.
  return 'resident';
}

/** Derive an entity-type tag from the WE Tax Status string. We don't have
 *  a column for entity_type yet, so this lands in tags as e.g. "huf",
 *  "minor", "partnership-firm". Helps with later filtering. */
function deriveEntityTag(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (/huf/.test(s)) return 'huf';
  if (/minor/.test(s)) return 'minor';
  if (/sole.?prop/.test(s)) return 'sole-proprietorship';
  if (/partnership/.test(s)) return 'partnership-firm';
  if (/^company\b|private limited|pvt\.? ltd|pvt limited/.test(s)) return 'company';
  if (/society/.test(s)) return 'society';
  if (/trust/.test(s)) return 'trust';
  if (/llp/.test(s)) return 'llp';
  return null;
}

/** Wealth Elite stores raw annual income as a rupee number (e.g. 660000).
 *  Bucket into the standard bands clients schema uses. */
function bandIncome(raw: string | null): string | null {
  if (!raw) return null;
  // If already a band like "5L-10L", pass through
  if (/[a-z]/i.test(raw)) return raw.trim();
  const n = Number(raw.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 500_000)    return '<5L';
  if (n < 1_000_000)  return '5L-10L';
  if (n < 2_500_000)  return '10L-25L';
  if (n < 5_000_000)  return '25L-50L';
  if (n < 10_000_000) return '50L-1Cr';
  return '1Cr+';
}

function normRiskProfile(raw: string | null): ParsedClientRow['risk_profile'] {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();
  if (/conserv|low|cautious|safe/.test(s)) return 'conservative';
  if (/aggress|high|growth/.test(s)) return 'aggressive';
  if (/moderate|balanced|medium/.test(s)) return 'moderate';
  return 'unknown';
}

function normMarital(raw: string | null): ParsedClientRow['marital_status'] {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();
  if (/single|unmarried|nev/.test(s)) return 'single';
  if (/married|spouse/.test(s)) return 'married';
  if (/divorced/.test(s)) return 'divorced';
  if (/widow/.test(s)) return 'widowed';
  if (/separat/.test(s)) return 'separated';
  return 'unknown';
}

function normGender(raw: string | null): ParsedClientRow['gender'] {
  if (!raw) return 'U';
  const s = raw.trim().toUpperCase();
  if (s === 'M' || s.startsWith('MALE')) return 'M';
  if (s === 'F' || s.startsWith('FEMALE')) return 'F';
  if (s === 'O' || /other|trans/i.test(s)) return 'O';
  return 'U';
}

function splitFullName(full: string, salutationHint?: string | null): {
  salutation: string | null;
  first: string;
  middle: string | null;
  last: string;
} {
  const sals = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Shri', 'Smt', 'Kumari', 'Master'];
  let salutation: string | null = salutationHint || null;
  let s = full.trim().replace(/\s+/g, ' ');
  for (const sal of sals) {
    const re = new RegExp(`^${sal}[.,]?\\s+`, 'i');
    if (re.test(s)) {
      salutation = salutation || sal;
      s = s.replace(re, '');
      break;
    }
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { salutation, first: '', middle: null, last: '' };
  if (parts.length === 1) return { salutation, first: parts[0], middle: null, last: parts[0] };
  if (parts.length === 2) return { salutation, first: parts[0], middle: null, last: parts[1] };
  // 3+ parts: first / middle...last / last
  return {
    salutation,
    first: parts[0],
    middle: parts.slice(1, -1).join(' '),
    last: parts[parts.length - 1],
  };
}

// ─── Header detection ──────────────────────────────────────

interface HeaderMatch {
  idx: number; // line index of header
  columnMap: Map<number, LogicalCol>;
  headerRaw: string[];
}

function detectHeader(lines: string[]): HeaderMatch | null {
  const REQUIRED_MIN = 3;
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const cells = splitLine(lines[i]);
    const columnMap = new Map<number, LogicalCol>();
    for (let c = 0; c < cells.length; c++) {
      const key = normHeader(cells[c]);
      if (HEADER_ALIASES[key]) {
        columnMap.set(c, HEADER_ALIASES[key]);
      }
    }
    const found = new Set(columnMap.values());
    const hasName = found.has('name_full') || (found.has('first_name') && found.has('last_name'));
    const hasContact = found.has('mobile_primary') || found.has('email_primary');
    const totalFound = found.size;
    if (hasName && totalFound >= REQUIRED_MIN && hasContact) {
      return { idx: i, columnMap, headerRaw: cells };
    }
  }
  return null;
}

// ─── Bytes → text ──────────────────────────────────────────

async function bytesToText(bytes: Buffer, file_name: string): Promise<{ text: string; format: ImportParseResult['source_format'] }> {
  const ext = file_name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  if (ext === 'csv' || ext === 'txt' || ext === 'tsv') {
    return { text: bytes.toString('utf-8'), format: (ext === 'csv' || ext === 'txt') ? (ext as 'csv' | 'txt') : 'csv' };
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(bytes, { type: 'buffer', cellDates: true });
    // Walk every sheet and pick the first non-empty one
    let bestText = '';
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
      if (csv.length > bestText.length) bestText = csv;
    }
    return { text: bestText, format: 'xlsx' };
  }
  if (ext === 'pdf') {
    try {
      const lib = await import('pdf-parse') as unknown as { default?: (b: Buffer) => Promise<{ text?: string }>; pdf?: (b: Buffer) => Promise<{ text?: string }> };
      const fn = lib.default || lib.pdf;
      if (!fn) return { text: '', format: 'pdf' };
      const data = await fn(bytes);
      return { text: data.text || '', format: 'pdf' };
    } catch {
      return { text: '', format: 'pdf' };
    }
  }
  return { text: '', format: 'unknown' };
}

// ─── Heuristic row builder ──────────────────────────────────

function buildRow(
  source_row: number,
  cells: string[],
  columnMap: Map<number, LogicalCol>,
): ParsedClientRow {
  const raw: Record<string, string> = {};
  for (const [colIdx, logical] of columnMap) {
    const v = cells[colIdx]?.trim() || '';
    if (v) {
      // If multiple source columns map to the same logical, keep the
      // longest non-empty (heuristic: longer == more complete).
      if (!raw[logical] || v.length > raw[logical].length) {
        raw[logical] = v;
      }
    }
  }

  // Name resolution: prefer full-name when available, else assemble
  let first = '', middle: string | null = null, last = '', salutation: string | null = null;
  if (raw.name_full) {
    const split = splitFullName(raw.name_full, raw.salutation);
    salutation = split.salutation;
    first = split.first;
    middle = split.middle;
    last = split.last;
  } else if (raw.first_name || raw.last_name) {
    salutation = raw.salutation || null;
    first = raw.first_name || '';
    middle = raw.middle_name || null;
    last = raw.last_name || (raw.first_name || ''); // if no last, use first as fallback so we don't throw on create
  }
  const display = `${salutation ? salutation + ' ' : ''}${first}${middle ? ' ' + middle : ''} ${last}`.trim() || '(unnamed)';

  const dob = raw.dob ? parseDate(raw.dob) : null;
  const mobile_primary = normMobile(raw.mobile_primary || null)
                       || normMobile(raw.mobile_overseas || null); // fallback to overseas mobile for NRIs
  const mobile_alt = normMobile(raw.mobile_alt || null)
                  || normMobile(raw.phone_overseas || null);
  const email_primary = normEmail(raw.email_primary || null);
  const email_alt = normEmail(raw.email_alt || null);
  const pan = normPan(raw.pan || null);
  const pincode = normPincode(raw.addr_pincode || null);

  // Concat address line 2 + 3 (clients schema has only 2 lines)
  const addrLine2Parts = [raw.addr_line2, raw.addr_line3].filter(Boolean);
  const addr_line2_combined = addrLine2Parts.length > 0 ? addrLine2Parts.join(' · ') : null;

  // Residential status: prefer explicit residential_status, fall back to
  // tax_status_raw which Wealth Elite uses ("NRI - REPATRIABLE (NRE)" etc.)
  const residential_status = normResidentialStatus(
    raw.residential_status || raw.tax_status_raw || null,
  );

  // Entity type derived from tax_status_raw → appended to tags
  const entityTag = deriveEntityTag(raw.tax_status_raw || null);
  let tags = raw.tags || null;
  if (entityTag) tags = tags ? `${tags},${entityTag}` : entityTag;

  // Income: prefer annual_income_band (already in band shape) OR
  // bucket the raw rupee number from annual_income_raw / annual_income_band.
  const incomeBand = bandIncome(raw.annual_income_band || raw.annual_income_raw || null);

  // Capture the "extras" — every logical col we DON'T store as a first-
  // class field, plus a few synthesized ones. These land in metadata.*
  // on the created client.
  const EXTRAS_KEYS: LogicalCol[] = [
    'source_username', 'source_onboarding_method',
    'rm_name', 'rm_code', 'sub_broker_name', 'sub_broker_code',
    'service_rm_name', 'service_rm_code',
    'first_investment_date', 'last_review_date', 'client_rating', 'aum', 'target_sip',
    'nationality', 'place_of_birth', 'country_of_birth',
    'father_name', 'mother_name', 'spouse_name', 'date_of_death',
    'joint_holder_1', 'joint_holder_2',
    'guardian_name', 'guardian_pan', 'attorney_name', 'attorney_pan',
    'nominee_details_raw', 'bank_details_raw',
    'mode_of_holding', 'tax_status_raw',
    'ckyc_number', 'fatca_status',
    'addr_country',
    'addr_overseas_line1', 'addr_overseas_line2', 'addr_overseas_city',
    'addr_overseas_state', 'addr_overseas_country', 'addr_overseas_pincode',
    'mobile_overseas', 'phone_overseas',
    'referred_by', 'bill_state', 'bill_gstin',
    'annual_income_raw',
  ];
  const extras: Record<string, string> = {};
  for (const k of EXTRAS_KEYS) {
    const v = raw[k];
    if (v && v.trim()) extras[k] = v.trim();
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  // Required: name + (mobile OR email)
  if (!first || !last) errors.push('Missing name (need first + last)');
  if (!mobile_primary && !email_primary) errors.push('No mobile or email — cannot dedupe / contact');
  // Soft warnings — won't block commit
  if (raw.pan && !pan) warnings.push(`PAN "${raw.pan}" failed format check (expected ABCDE1234F)`);
  if (raw.mobile_primary && !mobile_primary && !raw.mobile_overseas) warnings.push(`Mobile "${raw.mobile_primary}" failed format check`);
  if (raw.email_primary && !email_primary) warnings.push(`Email "${raw.email_primary}" failed format check`);
  if (raw.dob && !dob) warnings.push(`DOB "${raw.dob}" failed to parse`);
  if (raw.addr_pincode && !pincode) warnings.push(`Pincode "${raw.addr_pincode}" not 6 digits`);

  // Soft flag: deceased clients (DATE OF DEATH present). We still create
  // them, but the importer should auto-set status='archived' downstream.
  if (raw.date_of_death) {
    warnings.push(`Client has date of death (${raw.date_of_death}) — will be marked archived on commit`);
  }

  return {
    source_row,
    first_name: first,
    middle_name: middle,
    last_name: last,
    salutation,
    display_name: display,
    gender: normGender(raw.gender || null),
    dob,
    mobile_primary,
    mobile_alt,
    email_primary,
    email_alt,
    pan,
    aadhaar_full12: null,
    addr_current_line1: raw.addr_line1 || null,
    addr_current_line2: addr_line2_combined,
    addr_current_city: raw.addr_city || null,
    addr_current_state: raw.addr_state || null,
    addr_current_pincode: pincode,
    residential_status,
    occupation: raw.occupation || null,
    annual_income_band: incomeBand,
    risk_profile: normRiskProfile(raw.risk_profile || null),
    marital_status: normMarital(raw.marital_status || null),
    source_platform_code: raw.source_platform_code || null,
    source_family_head: raw.source_family_head || null,
    source_family_head_code: raw.source_family_head_code || null,
    extras,
    tags,
    notes: raw.notes || null,
    warnings,
    errors,
    raw,
  };
}

// ─── LLM fallback ──────────────────────────────────────────

const LLM_PROMPT = `You are extracting a CLIENT MASTER from an Indian insurance broker / mutual fund distributor's export file. The file may be from Investwell, Redvision Wealth Elite, or a relationship-manager's own spreadsheet.

Return ONLY JSON of the shape:
{
  "rows": [
    {
      "name_full": "string — full name as written, OR null if split below is used",
      "first_name": "string|null",
      "middle_name": "string|null",
      "last_name": "string|null",
      "salutation": "Mr|Mrs|Ms|Miss|Dr|Prof|null",
      "gender": "M|F|O|null",
      "dob": "YYYY-MM-DD|null",
      "mobile_primary": "10-digit Indian mobile or +country format|null",
      "mobile_alt": "string|null",
      "email_primary": "string|null",
      "email_alt": "string|null",
      "pan": "10-char PAN ABCDE1234F|null",
      "addr_line1": "string|null",
      "addr_line2": "string|null",
      "addr_city": "string|null",
      "addr_state": "string|null",
      "addr_pincode": "6-digit pincode|null",
      "residential_status": "resident|nri|foreign_national|pio|oci|null",
      "occupation": "string|null",
      "annual_income_band": "string|null",
      "risk_profile": "conservative|moderate|aggressive|null",
      "marital_status": "single|married|divorced|widowed|separated|null",
      "source_platform_code": "their internal client/investor code|null",
      "source_family_head": "name of family head if joint-holding|null",
      "tags": "comma-separated tags|null",
      "notes": "any extra freeform info|null"
    }
  ]
}

Rules:
- One row per UNIQUE client. Do NOT emit one row per policy or per holding.
- If the file lists multiple policies per client, deduplicate by name + mobile + pan.
- Strip ₹, commas from amounts; never invent fields.
- If the file is not a client list, return {"rows":[]}.
- No prose, no markdown. JSON only.`;

interface LlmRowShape {
  name_full?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  salutation?: string | null;
  gender?: string | null;
  dob?: string | null;
  mobile_primary?: string | null;
  mobile_alt?: string | null;
  email_primary?: string | null;
  email_alt?: string | null;
  pan?: string | null;
  addr_line1?: string | null;
  addr_line2?: string | null;
  addr_city?: string | null;
  addr_state?: string | null;
  addr_pincode?: string | null;
  residential_status?: string | null;
  occupation?: string | null;
  annual_income_band?: string | null;
  risk_profile?: string | null;
  marital_status?: string | null;
  source_platform_code?: string | null;
  source_family_head?: string | null;
  tags?: string | null;
  notes?: string | null;
}

async function llmExtract(text: string): Promise<LlmRowShape[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        temperature: 0,
        system: LLM_PROMPT,
        messages: [{ role: 'user', content: text.slice(0, 80_000) }],
      }),
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { content?: { type: string; text?: string }[] };
    const block = j.content?.find((b) => b.type === 'text');
    const raw = (block?.text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(raw) as { rows?: LlmRowShape[] };
    return Array.isArray(parsed.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function rowFromLlm(_idx: number, r: LlmRowShape): ParsedClientRow {
  const raw: Record<string, string> = {};
  Object.entries(r).forEach(([k, v]) => {
    if (v != null) raw[k] = String(v);
  });
  // Build name from either full or parts
  let salutation: string | null = r.salutation || null;
  let first = '', middle: string | null = null, last = '';
  if (r.name_full) {
    const split = splitFullName(r.name_full, salutation);
    salutation = split.salutation;
    first = split.first; middle = split.middle; last = split.last;
  } else {
    first = r.first_name || '';
    middle = r.middle_name || null;
    last = r.last_name || '';
  }
  const display = `${salutation ? salutation + ' ' : ''}${first}${middle ? ' ' + middle : ''} ${last}`.trim() || '(unnamed)';
  const dob = r.dob ? parseDate(r.dob) : null;
  const mobile_primary = normMobile(r.mobile_primary || null);
  const mobile_alt = normMobile(r.mobile_alt || null);
  const email_primary = normEmail(r.email_primary || null);
  const email_alt = normEmail(r.email_alt || null);
  const pan = normPan(r.pan || null);
  const pincode = normPincode(r.addr_pincode || null);
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!first || !last) errors.push('Missing name (need first + last)');
  if (!mobile_primary && !email_primary) errors.push('No mobile or email — cannot dedupe / contact');
  if (r.pan && !pan) warnings.push(`PAN "${r.pan}" failed format check`);
  return {
    source_row: _idx + 1,
    first_name: first,
    middle_name: middle,
    last_name: last,
    salutation,
    display_name: display,
    gender: normGender(r.gender || null),
    dob,
    mobile_primary, mobile_alt,
    email_primary, email_alt,
    pan,
    aadhaar_full12: null,
    addr_current_line1: r.addr_line1 || null,
    addr_current_line2: r.addr_line2 || null,
    addr_current_city: r.addr_city || null,
    addr_current_state: r.addr_state || null,
    addr_current_pincode: pincode,
    residential_status: normResidentialStatus(r.residential_status || null),
    occupation: r.occupation || null,
    annual_income_band: bandIncome(r.annual_income_band || null),
    risk_profile: normRiskProfile(r.risk_profile || null),
    marital_status: normMarital(r.marital_status || null),
    source_platform_code: r.source_platform_code || null,
    source_family_head: r.source_family_head || null,
    source_family_head_code: null, // LLM doesn't extract this — heuristic-only
    extras: {},
    tags: r.tags || null,
    notes: r.notes || null,
    warnings, errors,
    raw,
  };
}

// ─── Main entry ────────────────────────────────────────────

export async function parseClientImportFile(bytes: Buffer, file_name: string): Promise<ImportParseResult> {
  const { text, format } = await bytesToText(bytes, file_name);
  if (!text || text.length < 30) {
    return {
      rows: [], total: 0, valid_count: 0, error_count: 0,
      parsing_method: 'heuristic', detected_source: 'unknown', source_format: format,
      fatal: 'File appears empty or unreadable.',
    };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = detectHeader(lines);

  if (header) {
    const rows: ParsedClientRow[] = [];
    for (let i = header.idx + 1; i < lines.length; i++) {
      const cells = splitLine(lines[i]);
      if (cells.length === 0 || cells.every((c) => !c.trim())) continue;
      rows.push(buildRow(i + 1, cells, header.columnMap));
    }
    if (rows.length > 0) {
      const error_count = rows.filter((r) => r.errors.length > 0).length;
      const headerMappingDebug: Record<string, string> = {};
      for (const [colIdx, logical] of header.columnMap) {
        headerMappingDebug[header.headerRaw[colIdx] || `col_${colIdx}`] = logical;
      }
      return {
        rows,
        total: rows.length,
        valid_count: rows.length - error_count,
        error_count,
        parsing_method: 'heuristic',
        detected_source: detectSource(header.headerRaw),
        source_format: format,
        fatal: null,
        header_mapping_debug: headerMappingDebug,
      };
    }
  }

  // Heuristic couldn't find a usable header → LLM fallback
  const llmRows = await llmExtract(text);
  if (llmRows.length === 0) {
    return {
      rows: [], total: 0, valid_count: 0, error_count: 0,
      parsing_method: 'llm', detected_source: 'unknown', source_format: format,
      fatal: 'Could not detect client columns heuristically; LLM fallback returned no rows. Check the file format.',
    };
  }
  const rows = llmRows.map((r, i) => rowFromLlm(i, r));
  const error_count = rows.filter((r) => r.errors.length > 0).length;
  return {
    rows,
    total: rows.length,
    valid_count: rows.length - error_count,
    error_count,
    parsing_method: 'llm',
    detected_source: 'unknown',
    source_format: format,
    fatal: null,
  };
}

// ─── Convert parsed rows to CreateClientInput[] ─────────────

export function toCreateInputs(
  rows: ParsedClientRow[],
  actor: { user_id: number; email: string },
  onboardedVia: 'bulk_import' = 'bulk_import',
): CreateClientInput[] {
  return rows
    .filter((r) => r.errors.length === 0)
    .map((r) => ({
      first_name: r.first_name,
      middle_name: r.middle_name,
      last_name: r.last_name,
      salutation: r.salutation,
      gender: r.gender,
      dob: r.dob,
      marital_status: r.marital_status,
      mobile_primary: r.mobile_primary,
      mobile_alt: r.mobile_alt,
      email_primary: r.email_primary,
      email_alt: r.email_alt,
      pan: r.pan,
      // aadhaar_full12 deliberately NOT brought across (DPDPA safety)
      addr_current_line1: r.addr_current_line1,
      addr_current_line2: r.addr_current_line2,
      addr_current_city: r.addr_current_city,
      addr_current_state: r.addr_current_state,
      addr_current_pincode: r.addr_current_pincode,
      addr_permanent_same_as_current: true,
      residential_status: r.residential_status,
      occupation: r.occupation,
      annual_income_band: r.annual_income_band,
      risk_profile: r.risk_profile,
      onboarded_via: onboardedVia,
      tags: r.tags,
      notes: r.notes,
      metadata: {
        source_platform_code: r.source_platform_code,
        source_family_head: r.source_family_head,
        source_family_head_code: r.source_family_head_code,
        imported_at: 'will-be-set-server-side',
        ...r.extras,
      },
      actor,
    }));
}
