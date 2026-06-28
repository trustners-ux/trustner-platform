/**
 * ICICI CIB / NACH Salary Upload — CSV builder.
 *
 * Produces the 16-column CSV that ICICI Corporate Internet Banking (CIB)
 * accepts for bulk salary disbursement. The file has NO header row, uses
 * CRLF line endings and is UTF-8 encoded.
 *
 * Field order (16 columns):
 *   1  Beneficiary Name            (32, alphanumeric + space)
 *   2  Debit Account No            (12, numeric — Trustner ICICI corp acct)
 *   3  Beneficiary Account No      (up to 34, alphanumeric)
 *   4  IFSC                        (11, /^[A-Z]{4}0[A-Z0-9]{6}$/)
 *   5  Amount                      (rupees with 2 decimals — toFixed(2))
 *   6  Network Type                (WIB | NFT | RTG | IMP)
 *   7  Payment Date                (DD/MM/YYYY)
 *   8  Debit Narration             (30, e.g. "SAL MAY26 TIB")
 *   9  Credit Narration            (30, e.g. "TRUSTNER SAL MAY26")
 *  10  Customer Reference No       (16, `${entity}R${runId}-${empId}` uppercased)
 *  11  Beneficiary Email           (50, optional)
 *  12  Beneficiary Mobile          (10, numeric, optional)
 *  13  Beneficiary Bank Name       (40, optional)
 *  14  Beneficiary Address         (blank)
 *  15  Payment Details 1           ("EMP${empId}")
 *  16  Payment Details 2           (blank)
 *
 * pickNetwork policy:
 *   - WIB  → if IFSC starts with 'ICIC' (intra-bank funds transfer)
 *   - RTG  → else if amount >= 2_00_000 (RTGS threshold)
 *   - NFT  → otherwise (NEFT)
 *   - IMP  → not selected automatically; reserved for manual override
 */

export type Network = 'WIB' | 'NFT' | 'RTG' | 'IMP';

export interface NachInputRow {
  /** Beneficiary employee id — used in ref no + payment details */
  employeeId: number | string;
  /** Beneficiary full name */
  beneficiaryName: string;
  /** Plaintext bank account number (decrypted from hr_employees) */
  beneficiaryAccount: string;
  /** Beneficiary IFSC, e.g. 'ICIC0000123' */
  ifsc: string;
  /** Net pay in rupees (NOT paise) */
  amount: number;
  /** Optional contact */
  email?: string | null;
  mobile?: string | null;
  beneficiaryBankName?: string | null;
}

export interface BuildArgs {
  /** Run identifier — drives filename + customer reference */
  runId: number | string;
  /** 'TAS' | 'TIB' — payer legal entity */
  entity: string;
  /** Pay month token, e.g. 'MAY26' (used in narration) */
  payMonthToken: string;
  /** 12-digit ICICI corporate debit account (Trustner) */
  debitAccountNo: string;
  /** Value date for the file; defaults to now */
  paymentDate?: Date;
  /** Rows to disburse */
  rows: NachInputRow[];
}

export interface BuildResult {
  filename: string;
  csv: string;
  rowCount: number;
  totalAmount: number;
  errors: Array<{ employeeId: number | string; errors: string[] }>;
}

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const RTGS_FLOOR = 200000;

/** Strip everything that isn't a–z, A–Z, 0–9 or space, then collapse spaces and trim. */
function sanitizeName(name: string): string {
  return (name || '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Right-truncate to max length. */
function clip(value: string, max: number): string {
  if (!value) return '';
  return value.length <= max ? value : value.slice(0, max);
}

/** CSV-escape: wrap in quotes if value contains comma / quote / newline. */
function csvEscape(value: string): string {
  if (value == null) return '';
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function formatDDMMYYYY(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatFilenameDate(d: Date): string {
  return `${pad2(d.getDate())}${pad2(d.getMonth() + 1)}${d.getFullYear()}`;
}

function formatFilenameTime(d: Date): string {
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

export function pickNetwork(ifsc: string, amount: number): Network {
  const code = (ifsc || '').toUpperCase();
  if (code.startsWith('ICIC')) return 'WIB';
  if (amount >= RTGS_FLOOR) return 'RTG';
  return 'NFT';
}

export function validateRow(payload: NachInputRow): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const name = sanitizeName(payload.beneficiaryName || '');
  if (!name) errors.push('beneficiary_name_empty');
  if (name.length > 32) errors.push('beneficiary_name_too_long');

  const acct = (payload.beneficiaryAccount || '').trim();
  if (!acct) errors.push('account_number_missing');
  else if (!/^[A-Za-z0-9]+$/.test(acct)) errors.push('account_number_non_alnum');
  else if (acct.length > 34) errors.push('account_number_too_long');

  const ifsc = (payload.ifsc || '').toUpperCase().trim();
  if (!ifsc) errors.push('ifsc_missing');
  else if (!IFSC_RE.test(ifsc)) errors.push('ifsc_format_invalid');

  const amt = Number(payload.amount);
  if (!Number.isFinite(amt)) errors.push('amount_not_a_number');
  else if (amt <= 0) errors.push('amount_non_positive');
  else if (amt > 1_00_00_00_000) errors.push('amount_implausibly_large');

  if (payload.mobile) {
    const m = String(payload.mobile).replace(/\D+/g, '');
    if (m && m.length !== 10) errors.push('mobile_not_10_digits');
  }

  if (payload.email && payload.email.length > 50) errors.push('email_too_long');

  return { ok: errors.length === 0, errors };
}

export function buildIciciSalaryCsv(args: BuildArgs): BuildResult {
  const {
    runId,
    entity,
    payMonthToken,
    debitAccountNo,
    paymentDate = new Date(),
    rows,
  } = args;

  const entityCode = (entity || 'TAS').toUpperCase().replace(/[^A-Z]/g, '') || 'TAS';
  const monthTok = (payMonthToken || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const dateStr = formatDDMMYYYY(paymentDate);

  const debitNarration = clip(`SAL ${monthTok} ${entityCode}`.trim(), 30);
  const creditNarration = clip(`TRUSTNER SAL ${monthTok}`.trim(), 30);

  const csvLines: string[] = [];
  const errors: BuildResult['errors'] = [];
  let totalAmount = 0;
  let rowCount = 0;

  for (const row of rows) {
    const check = validateRow(row);
    if (!check.ok) {
      errors.push({ employeeId: row.employeeId, errors: check.errors });
      continue;
    }

    const name = clip(sanitizeName(row.beneficiaryName), 32);
    const acct = clip((row.beneficiaryAccount || '').trim(), 34);
    const ifsc = (row.ifsc || '').toUpperCase().trim();
    const amount = Number(row.amount);
    const network = pickNetwork(ifsc, amount);

    const refRaw = `${entityCode}R${runId}-${row.employeeId}`.toUpperCase();
    const refNo = clip(refRaw, 16);

    const email = clip((row.email || '').trim(), 50);
    const mobile = clip(String(row.mobile || '').replace(/\D+/g, ''), 10);
    const bankName = clip((row.beneficiaryBankName || '').trim(), 40);

    const fields = [
      name,                                        // 1
      debitAccountNo,                              // 2
      acct,                                        // 3
      ifsc,                                        // 4
      amount.toFixed(2),                           // 5
      network,                                     // 6
      dateStr,                                     // 7
      debitNarration,                              // 8
      creditNarration,                             // 9
      refNo,                                       // 10
      email,                                       // 11
      mobile,                                      // 12
      bankName,                                    // 13
      '',                                          // 14 — address (blank)
      `EMP${row.employeeId}`,                      // 15
      '',                                          // 16
    ].map(csvEscape);

    csvLines.push(fields.join(','));
    totalAmount += amount;
    rowCount += 1;
  }

  const filename = `${entityCode}_SAL_${formatFilenameDate(paymentDate)}_${formatFilenameTime(paymentDate)}.csv`;
  const csv = csvLines.join('\r\n') + (csvLines.length ? '\r\n' : '');

  return {
    filename,
    csv,
    rowCount,
    totalAmount: Math.round(totalAmount * 100) / 100,
    errors,
  };
}
