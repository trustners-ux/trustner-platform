/**
 * Flexible Excel/CSV → ParsedHoldingRow + ParsedSipRow parser.
 *
 * Mirrors the Wealth Elite parser pattern (200+ column aliases) so any
 * vendor's export format works without code changes.
 *
 * Public API:
 *   - parseHoldingsRows(rows) → ParsedHoldingRow[]
 *   - parseSipRows(rows) → ParsedSipRow[]
 *   - detectSheetKind(rows) → 'holdings' | 'sips' | 'unknown'
 */

import type { ParsedHoldingRow, ParsedSipRow, SipMandateFrequency, SipMandateStatus } from './types';

/* ── Column alias maps (case-insensitive substring match) ──────────────────── */
const HOLDINGS_ALIASES: Record<keyof Omit<ParsedHoldingRow, 'raw'>, string[]> = {
  client_code:           ['client code', 'cust code', 'customer code', 'investor code', 'client id', 'msi code', 'client_code'],
  pan:                   ['pan', 'pan number', 'pan no', 'permanent account', 'pancard'],
  client_name:           ['client name', 'investor name', 'customer name', 'first holder', 'primary holder', 'name'],
  folio_number:          ['folio', 'folio no', 'folio number', 'folio_no', 'folio_number'],

  scheme_name:           ['scheme name', 'scheme', 'fund name', 'product name', 'plan name'],
  isin:                  ['isin', 'isin code', 'isin no'],
  amfi_code:             ['amfi code', 'amfi', 'amfi_code', 'scheme code'],
  amc_name:              ['amc', 'amc name', 'fund house', 'amc_name'],
  category:              ['category', 'asset class', 'scheme category'],
  sub_category:          ['sub category', 'subcategory', 'sub-category', 'morningstar category'],

  units:                 ['units', 'units held', 'closing units', 'balance units', 'no of units', 'unit balance'],
  avg_purchase_nav:      ['avg nav', 'average nav', 'avg cost', 'purchase nav', 'cost per unit', 'avg purchase nav'],
  current_nav:           ['current nav', 'latest nav', 'nav', 'mkt nav', 'market nav'],
  nav_date:              ['nav date', 'as on date', 'valuation date', 'as on'],

  total_invested:        ['invested', 'cost', 'cost basis', 'amount invested', 'total invested', 'purchase value', 'investment value'],
  current_value:         ['market value', 'current value', 'mv', 'mkt value', 'present value', 'mkt val', 'market val', 'current val'],

  absolute_return_pct:   ['absolute return', 'abs return', 'return %', 'return %', 'gain %', 'absolute return %'],
  xirr_pct:              ['xirr', 'xirr %', 'cagr', 'cagr %', 'irr', 'annualised return', 'annualized return'],

  feed_external_id:      ['transaction id', 'txn id', 'row id', 'external id', 'sr no', 'serial', 'sl no'],
};

const SIP_ALIASES: Record<string, string[]> = {
  client_code:       ['client code', 'cust code', 'customer code', 'investor code'],
  pan:               ['pan', 'pan number'],
  client_name:       ['client name', 'investor name', 'first holder'],
  folio_number:      ['folio', 'folio no', 'folio number'],

  scheme_name:       ['scheme name', 'scheme', 'fund name', 'plan name'],
  amfi_code:         ['amfi code', 'amfi', 'scheme code'],
  amc_name:          ['amc', 'amc name', 'fund house'],

  monthly_amount:    ['sip amount', 'monthly amount', 'amount', 'installment amount', 'instalment'],
  frequency:         ['frequency', 'freq', 'sip frequency'],
  sip_date:          ['sip date', 'instalment date', 'monthly date'],
  start_date:        ['start date', 'sip start date', 'first instalment'],
  next_due_date:     ['next due', 'next due date', 'next instalment date', 'next sip date'],
  end_date:          ['end date', 'sip end date', 'last instalment date'],
  installments_total:['total installments', 'no of installments', 'tenure', 'instalments'],
  installments_paid: ['paid installments', 'installments paid', 'completed instalments'],

  status:            ['status', 'sip status', 'mandate status'],
  mandate_id:        ['mandate id', 'umrn', 'mandate ref', 'mandate no', 'arn'],
  step_up_pct:       ['step up', 'step-up %', 'annual step up', 'topup %'],

  feed_external_id:  ['sip ref', 'sip id', 'reference no', 'transaction id'],
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Build lookup: normalized header → canonical field name */
function buildColumnLookup(
  headers: string[],
  aliases: Record<string, string[]>,
): Map<string, string> {
  const map = new Map<string, string>();
  const norm = (s: string) => s.toLowerCase().trim().replace(/[_\s.-]+/g, ' ');

  for (const [field, candidates] of Object.entries(aliases)) {
    for (const cand of candidates) {
      const target = norm(cand);
      const matchedHeader = headers.find((h) => norm(h) === target || norm(h).includes(target));
      if (matchedHeader && !map.has(matchedHeader)) {
        map.set(matchedHeader, field);
        break;
      }
    }
  }
  return map;
}

/** Parse a number from any text — strips ₹, commas, %, etc. Returns NaN if unparseable. */
export function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[₹,$%\s]/g, '').trim();
  if (!s || s === '-' || s === 'NA' || s === 'N/A') return NaN;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Parse a date — accepts DD/MM/YYYY, YYYY-MM-DD, ISO, Excel serial. */
export function parseDate(v: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;

  // Excel serial date (number 30000-60000 range typically)
  if (typeof v === 'number' && v > 10000 && v < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = v * 86400000;
    return new Date(excelEpoch.getTime() + ms).toISOString().slice(0, 10);
  }

  const s = String(v).trim();
  if (!s) return undefined;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yyyy = y.length === 2 ? '20' + y : y;
    return `${yyyy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD or ISO
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: try Date parse
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return undefined;
}

/** Normalize SIP frequency string to enum. */
function normFrequency(v: unknown): SipMandateFrequency | undefined {
  if (!v) return undefined;
  const s = String(v).toLowerCase().trim();
  if (s.startsWith('mon')) return 'monthly';
  if (s.startsWith('quart')) return 'quarterly';
  if (s.startsWith('half') || s.includes('semi')) return 'half_yearly';
  if (s.startsWith('year') || s === 'annual') return 'yearly';
  if (s.startsWith('week')) return 'weekly';
  if (s.startsWith('dai')) return 'daily';
  return undefined;
}

/** Normalize SIP status. */
function normStatus(v: unknown): SipMandateStatus | undefined {
  if (!v) return undefined;
  const s = String(v).toLowerCase().trim();
  if (s.includes('active') || s === 'a' || s === 'live') return 'active';
  if (s.includes('paus') || s.includes('hold')) return 'paused';
  if (s.includes('cancel') || s.includes('stop') || s.includes('terminat')) return 'cancelled';
  if (s.includes('complet') || s.includes('matur')) return 'completed';
  return undefined;
}

/* ── Public parsers ───────────────────────────────────────────────────────── */

/** Auto-detect whether a sheet is holdings, SIPs, or unknown. */
export function detectSheetKind(rows: Record<string, unknown>[]): 'holdings' | 'sips' | 'unknown' {
  if (rows.length === 0) return 'unknown';
  const headers = Object.keys(rows[0]);
  const lc = headers.map((h) => h.toLowerCase());

  const hasUnits = lc.some((h) => /units|balance units|closing units/.test(h));
  const hasNav = lc.some((h) => /\bnav\b/.test(h));
  const hasMarketValue = lc.some((h) => /market value|current value|mkt val/.test(h));
  const hasSipAmount = lc.some((h) => /sip amount|monthly amount|installment amount/.test(h));
  const hasFrequency = lc.some((h) => /frequency|freq/.test(h));
  const hasNextDue = lc.some((h) => /next due|next sip|next instalment/.test(h));

  const holdingsScore = (hasUnits ? 1 : 0) + (hasNav ? 1 : 0) + (hasMarketValue ? 1 : 0);
  const sipScore      = (hasSipAmount ? 1 : 0) + (hasFrequency ? 1 : 0) + (hasNextDue ? 1 : 0);

  if (holdingsScore >= 2 && holdingsScore > sipScore) return 'holdings';
  if (sipScore >= 1 && sipScore >= holdingsScore) return 'sips';
  return 'unknown';
}

/** Parse holdings rows from a raw sheet. */
export function parseHoldingsRows(rows: Record<string, unknown>[]): ParsedHoldingRow[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const cols = buildColumnLookup(headers, HOLDINGS_ALIASES);

  const out: ParsedHoldingRow[] = [];
  for (const row of rows) {
    // Re-map to canonical fields
    const mapped: Record<string, unknown> = {};
    for (const [orig, canonical] of cols.entries()) {
      mapped[canonical] = row[orig];
    }

    const scheme = String(mapped.scheme_name ?? '').trim();
    if (!scheme) continue; // skip rows without scheme

    const units = parseNum(mapped.units);
    if (!Number.isFinite(units) || units <= 0) continue; // skip empty/zero rows

    out.push({
      client_code:    mapped.client_code != null ? String(mapped.client_code).trim() : undefined,
      pan:            mapped.pan != null ? String(mapped.pan).trim().toUpperCase() : undefined,
      client_name:    mapped.client_name != null ? String(mapped.client_name).trim() : undefined,
      folio_number:   mapped.folio_number != null ? String(mapped.folio_number).trim() : undefined,

      scheme_name:    scheme,
      isin:           mapped.isin != null ? String(mapped.isin).trim().toUpperCase() : undefined,
      amfi_code:      mapped.amfi_code != null ? String(mapped.amfi_code).trim() : undefined,
      amc_name:       mapped.amc_name != null ? String(mapped.amc_name).trim() : undefined,
      category:       mapped.category != null ? String(mapped.category).trim() : undefined,
      sub_category:   mapped.sub_category != null ? String(mapped.sub_category).trim() : undefined,

      units,
      avg_purchase_nav: Number.isFinite(parseNum(mapped.avg_purchase_nav)) ? parseNum(mapped.avg_purchase_nav) : undefined,
      current_nav:      Number.isFinite(parseNum(mapped.current_nav)) ? parseNum(mapped.current_nav) : undefined,
      nav_date:         parseDate(mapped.nav_date),

      total_invested:   Number.isFinite(parseNum(mapped.total_invested)) ? parseNum(mapped.total_invested) : undefined,
      current_value:    Number.isFinite(parseNum(mapped.current_value)) ? parseNum(mapped.current_value) : undefined,

      absolute_return_pct: Number.isFinite(parseNum(mapped.absolute_return_pct)) ? parseNum(mapped.absolute_return_pct) : undefined,
      xirr_pct:            Number.isFinite(parseNum(mapped.xirr_pct)) ? parseNum(mapped.xirr_pct) : undefined,

      feed_external_id: mapped.feed_external_id != null ? String(mapped.feed_external_id).trim() : undefined,
      raw: row,
    });
  }

  return out;
}

/** Parse SIP rows from a raw sheet. */
export function parseSipRows(rows: Record<string, unknown>[]): ParsedSipRow[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const cols = buildColumnLookup(headers, SIP_ALIASES);

  const out: ParsedSipRow[] = [];
  for (const row of rows) {
    const mapped: Record<string, unknown> = {};
    for (const [orig, canonical] of cols.entries()) {
      mapped[canonical] = row[orig];
    }

    const scheme = String(mapped.scheme_name ?? '').trim();
    const amt = parseNum(mapped.monthly_amount);
    if (!scheme || !Number.isFinite(amt) || amt <= 0) continue;

    out.push({
      client_code:    mapped.client_code != null ? String(mapped.client_code).trim() : undefined,
      pan:            mapped.pan != null ? String(mapped.pan).trim().toUpperCase() : undefined,
      client_name:    mapped.client_name != null ? String(mapped.client_name).trim() : undefined,
      folio_number:   mapped.folio_number != null ? String(mapped.folio_number).trim() : undefined,

      scheme_name:    scheme,
      amfi_code:      mapped.amfi_code != null ? String(mapped.amfi_code).trim() : undefined,
      amc_name:       mapped.amc_name != null ? String(mapped.amc_name).trim() : undefined,

      monthly_amount: amt,
      frequency:      normFrequency(mapped.frequency) ?? 'monthly',
      sip_date:       Number.isFinite(parseNum(mapped.sip_date)) ? Math.floor(parseNum(mapped.sip_date)) : undefined,
      start_date:     parseDate(mapped.start_date),
      next_due_date:  parseDate(mapped.next_due_date),
      end_date:       parseDate(mapped.end_date),
      installments_total: Number.isFinite(parseNum(mapped.installments_total)) ? Math.floor(parseNum(mapped.installments_total)) : undefined,
      installments_paid:  Number.isFinite(parseNum(mapped.installments_paid)) ? Math.floor(parseNum(mapped.installments_paid)) : 0,

      status:    normStatus(mapped.status) ?? 'active',
      mandate_id: mapped.mandate_id != null ? String(mapped.mandate_id).trim() : undefined,
      step_up_pct: Number.isFinite(parseNum(mapped.step_up_pct)) ? parseNum(mapped.step_up_pct) : undefined,

      feed_external_id: mapped.feed_external_id != null ? String(mapped.feed_external_id).trim() : undefined,
      raw: row,
    });
  }

  return out;
}
