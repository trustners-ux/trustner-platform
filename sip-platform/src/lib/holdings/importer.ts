/**
 * Commit parsed + resolved rows into client_holdings / client_sip_mandates.
 *
 * Strategy:
 *   - UPSERT by (client_id, scheme_name, folio_number) for holdings.
 *   - UPSERT by (client_id, scheme_name, mandate_id) for SIPs.
 *   - Capture a point-in-time snapshot per affected client in
 *     client_holdings_snapshots (one row per client_id × snapshot_date).
 *   - Compute simple absolute return % at commit time. XIRR computation
 *     deferred until transaction history is available.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type {
  ParsedHoldingRow,
  ParsedSipRow,
  HoldingsImportSource,
} from './types';
import { simpleXirr } from './xirr';

export interface CommitResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

/**
 * Commit holdings to the DB.
 * @param rows  parsed rows WITH resolved client_id attached (`resolved_client_id` field)
 */
export async function commitHoldings(
  rows: (ParsedHoldingRow & { resolved_client_id: number | null })[],
  source: HoldingsImportSource = 'csv_upload',
): Promise<CommitResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { inserted: 0, updated: 0, skipped: rows.length, errors: [{ row: -1, reason: 'DB unavailable' }] };

  const result: CommitResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  const snapshotAccum = new Map<number, { invested: number; value: number; count: number }>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.resolved_client_id) {
      result.skipped++;
      continue;
    }

    // Derive market value if missing: units × current_nav
    let currentValue = r.current_value;
    if (currentValue == null && r.units && r.current_nav) {
      currentValue = r.units * r.current_nav;
    }

    // Derive absolute return if missing
    let absReturn = r.absolute_return_pct;
    if (absReturn == null && r.total_invested && currentValue && r.total_invested > 0) {
      absReturn = ((currentValue - r.total_invested) / r.total_invested) * 100;
    }

    // Derive XIRR — only if we know nav_date as a rough proxy for "investment age".
    // For real XIRR we need transaction history; this is just a placeholder.
    let xirr = r.xirr_pct;
    if (xirr == null && r.total_invested && currentValue && r.nav_date) {
      // Assume invested 3 years before nav_date as a rough estimate
      const invDate = new Date(r.nav_date);
      invDate.setFullYear(invDate.getFullYear() - 3);
      const navDate = new Date(r.nav_date);
      const x = simpleXirr(r.total_invested, currentValue, invDate, navDate);
      if (x !== null) xirr = x * 100;
    }

    const row = {
      client_id: r.resolved_client_id,
      amfi_code: r.amfi_code ?? null,
      scheme_name: r.scheme_name,
      isin: r.isin ?? null,
      folio_number: r.folio_number ?? null,
      amc_name: r.amc_name ?? null,
      category: r.category ?? null,
      sub_category: r.sub_category ?? null,
      units: r.units,
      avg_purchase_nav: r.avg_purchase_nav ?? null,
      current_nav: r.current_nav ?? null,
      nav_date: r.nav_date ?? null,
      total_invested: r.total_invested ?? 0,
      current_value: currentValue ?? 0,
      absolute_return_pct: absReturn ?? null,
      xirr_pct: xirr ?? null,
      feed_source: source,
      feed_external_id: r.feed_external_id ?? null,
      feed_raw: r.raw,
      last_imported_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('client_holdings')
      .upsert(row, { onConflict: 'client_id,scheme_name,folio_number' })
      .select('id')
      .maybeSingle();

    if (error) {
      result.errors.push({ row: i, reason: error.message });
      continue;
    }
    if (data) result.inserted++; // upsert: treat as inserted

    // Accumulate snapshot
    const acc = snapshotAccum.get(r.resolved_client_id) ?? { invested: 0, value: 0, count: 0 };
    acc.invested += r.total_invested ?? 0;
    acc.value += currentValue ?? 0;
    acc.count += 1;
    snapshotAccum.set(r.resolved_client_id, acc);
  }

  // Write snapshots — one per client_id
  const today = new Date().toISOString().slice(0, 10);
  for (const [client_id, agg] of snapshotAccum.entries()) {
    await sb.from('client_holdings_snapshots').upsert(
      {
        client_id,
        snapshot_date: today,
        total_invested: agg.invested,
        total_current_value: agg.value,
        scheme_count: agg.count,
        feed_source: source,
      },
      { onConflict: 'client_id,snapshot_date' },
    );
  }

  return result;
}

/**
 * Commit SIP mandates to the DB.
 */
export async function commitSips(
  rows: (ParsedSipRow & { resolved_client_id: number | null })[],
  source: HoldingsImportSource = 'csv_upload',
): Promise<CommitResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { inserted: 0, updated: 0, skipped: rows.length, errors: [{ row: -1, reason: 'DB unavailable' }] };

  const result: CommitResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.resolved_client_id) {
      result.skipped++;
      continue;
    }

    const row = {
      client_id: r.resolved_client_id,
      amfi_code: r.amfi_code ?? null,
      scheme_name: r.scheme_name,
      folio_number: r.folio_number ?? null,
      amc_name: r.amc_name ?? null,
      monthly_amount: r.monthly_amount,
      frequency: r.frequency ?? 'monthly',
      sip_date: r.sip_date ?? null,
      start_date: r.start_date ?? null,
      next_due_date: r.next_due_date ?? null,
      end_date: r.end_date ?? null,
      installments_total: r.installments_total ?? null,
      installments_paid: r.installments_paid ?? 0,
      status: r.status ?? 'active',
      mandate_id: r.mandate_id ?? null,
      step_up_pct: r.step_up_pct ?? null,
      feed_source: source,
      feed_external_id: r.feed_external_id ?? null,
      feed_raw: r.raw,
      last_imported_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from('client_sip_mandates')
      .upsert(row, { onConflict: 'client_id,scheme_name,mandate_id' });

    if (error) {
      result.errors.push({ row: i, reason: error.message });
      continue;
    }
    result.inserted++;
  }

  return result;
}
