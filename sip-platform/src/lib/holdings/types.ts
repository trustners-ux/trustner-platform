/**
 * Holdings + SIP types — Phase D.
 *
 * Owner: powered by /portal/holdings + /admin/client-master/holdings/import.
 *
 * Naming discipline: NEVER expose third-party feed brand names in UI.
 * Raw vendor data lives in `feed_raw` (JSONB) at rest; public-facing
 * fields use generic names like scheme_name, units, current_nav.
 */

export type SipMandateStatus = 'active' | 'paused' | 'cancelled' | 'completed';

export type SipMandateFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly'
  | 'weekly'
  | 'daily';

export type HoldingsImportSource =
  | 'csv_upload'
  | 'excel_upload'
  | 'feed_api'
  | 'manual_entry';

/** Row shape in `client_holdings` table (DB → app). */
export interface ClientHolding {
  id: number;
  client_id: number;

  amfi_code: string | null;
  scheme_name: string;
  isin: string | null;
  folio_number: string | null;

  amc_name: string | null;
  category: string | null;
  sub_category: string | null;

  units: number;
  avg_purchase_nav: number | null;
  current_nav: number | null;
  nav_date: string | null;

  total_invested: number;
  current_value: number;

  absolute_return_pct: number | null;
  xirr_pct: number | null;

  feed_source: HoldingsImportSource;
  feed_external_id: string | null;
  feed_raw: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
  last_imported_at: string;
}

/** Row shape in `client_sip_mandates`. */
export interface ClientSipMandate {
  id: number;
  client_id: number;

  amfi_code: string | null;
  scheme_name: string;
  folio_number: string | null;
  amc_name: string | null;

  monthly_amount: number;
  frequency: SipMandateFrequency;
  sip_date: number | null;
  start_date: string | null;
  next_due_date: string | null;
  end_date: string | null;
  installments_total: number | null;
  installments_paid: number;

  status: SipMandateStatus;
  mandate_id: string | null;
  step_up_pct: number | null;

  feed_source: HoldingsImportSource;
  feed_external_id: string | null;
  feed_raw: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
  last_imported_at: string;
}

/** Aggregated view rows from `client_aum_summary`. */
export interface ClientAumSummary {
  client_id: number;
  client_code: string;
  display_name: string;
  scheme_count: number;
  total_aum: number;
  total_invested: number;
  absolute_gain: number;
  absolute_return_pct: number | null;
  last_updated_at: string | null;
}

/** Aggregated view rows from `family_aum_summary`. */
export interface FamilyAumSummary {
  family_id: number;
  family_code: string;
  family_name: string;
  head_display_name: string;
  member_count: number;
  scheme_count: number;
  total_aum: number;
  total_invested: number;
  absolute_gain: number;
  absolute_return_pct: number | null;
  last_updated_at: string | null;
}

/** Parsed row from an Excel/CSV import — pre-validation. */
export interface ParsedHoldingRow {
  // Identity (one of these MUST resolve to a client)
  client_code?: string;
  pan?: string;
  client_name?: string;
  folio_number?: string;

  // Scheme
  scheme_name: string;
  isin?: string;
  amfi_code?: string;
  amc_name?: string;
  category?: string;
  sub_category?: string;

  // Position
  units: number;
  avg_purchase_nav?: number;
  current_nav?: number;
  nav_date?: string; // ISO

  // Money
  total_invested?: number;
  current_value?: number;

  // Returns
  absolute_return_pct?: number;
  xirr_pct?: number;

  // Provenance
  feed_external_id?: string;
  raw: Record<string, unknown>; // the full original row
}

/** Parsed SIP mandate row from import. */
export interface ParsedSipRow {
  client_code?: string;
  pan?: string;
  client_name?: string;
  folio_number?: string;

  scheme_name: string;
  amfi_code?: string;
  amc_name?: string;

  monthly_amount: number;
  frequency?: SipMandateFrequency;
  sip_date?: number;
  start_date?: string;
  next_due_date?: string;
  end_date?: string;
  installments_total?: number;
  installments_paid?: number;

  status?: SipMandateStatus;
  mandate_id?: string;
  step_up_pct?: number;

  feed_external_id?: string;
  raw: Record<string, unknown>;
}

/** Result of import: row-by-row outcome for the preview table. */
export interface ImportOutcome {
  total_rows: number;
  matched_rows: number;     // client successfully resolved
  unmatched_rows: number;
  errors: number;
  warnings: string[];
}
