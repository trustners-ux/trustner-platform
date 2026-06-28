/**
 * Resolve a parsed holding/SIP row to an existing client_id.
 *
 * Resolution order (highest confidence first):
 *   1. client_code      → exact match on clients.code
 *   2. pan              → exact match on clients.pan
 *   3. folio_number     → check existing client_holdings for this folio
 *   4. client_name      → fuzzy match on clients.display_name (returns
 *                          candidates only, NOT auto-resolved — admin picks)
 *
 * Returns { client_id, confidence, reason } or null if no match.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

export type Confidence = 'exact_code' | 'exact_pan' | 'folio_match' | 'name_match' | 'none';

export interface Resolution {
  client_id: number | null;
  client_code: string | null;
  display_name: string | null;
  confidence: Confidence;
  reason: string;
  candidates?: { id: number; code: string; display_name: string }[];
}

interface Identifiers {
  client_code?: string;
  pan?: string;
  folio_number?: string;
  client_name?: string;
}

export async function resolveClient(ids: Identifiers): Promise<Resolution> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { client_id: null, client_code: null, display_name: null, confidence: 'none', reason: 'DB unavailable' };
  }

  // 1. Exact client_code
  if (ids.client_code) {
    const code = ids.client_code.trim();
    const { data } = await sb
      .from('clients')
      .select('id, code, display_name')
      .eq('code', code)
      .maybeSingle();
    if (data) {
      return { client_id: data.id, client_code: data.code, display_name: data.display_name, confidence: 'exact_code', reason: `matched code ${code}` };
    }
  }

  // 2. Exact PAN
  if (ids.pan) {
    const pan = ids.pan.trim().toUpperCase();
    if (/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
      const { data } = await sb
        .from('clients')
        .select('id, code, display_name')
        .eq('pan', pan)
        .maybeSingle();
      if (data) {
        return { client_id: data.id, client_code: data.code, display_name: data.display_name, confidence: 'exact_pan', reason: `matched PAN ${pan}` };
      }
    }
  }

  // 3. Folio match — look in client_holdings for an existing row with this folio
  if (ids.folio_number) {
    const folio = ids.folio_number.trim();
    const { data } = await sb
      .from('client_holdings')
      .select('client_id, clients!inner(id, code, display_name)')
      .eq('folio_number', folio)
      .limit(1)
      .maybeSingle();
    if (data) {
      const c = (data as unknown as { client_id: number; clients: { id: number; code: string; display_name: string } }).clients;
      return { client_id: c.id, client_code: c.code, display_name: c.display_name, confidence: 'folio_match', reason: `matched folio ${folio}` };
    }
  }

  // 4. Name match (fuzzy) — return CANDIDATES, do not auto-pick
  if (ids.client_name) {
    const name = ids.client_name.trim();
    const { data } = await sb
      .from('clients')
      .select('id, code, display_name')
      .ilike('display_name', `%${name}%`)
      .limit(5);
    const candidates = (data || []).map((c) => ({ id: c.id as number, code: c.code as string, display_name: c.display_name as string }));
    if (candidates.length === 1) {
      // Single fuzzy match — flag low confidence so admin can confirm
      const c = candidates[0];
      return { client_id: c.id, client_code: c.code, display_name: c.display_name, confidence: 'name_match', reason: `single fuzzy match on "${name}"`, candidates };
    }
    if (candidates.length > 1) {
      return { client_id: null, client_code: null, display_name: null, confidence: 'none', reason: `${candidates.length} fuzzy matches on "${name}"`, candidates };
    }
  }

  return { client_id: null, client_code: null, display_name: null, confidence: 'none', reason: 'no identifier resolved' };
}

/** Batch helper — resolve a list of identifier sets, preserving order. */
export async function resolveClientsBatch(rows: Identifiers[]): Promise<Resolution[]> {
  return Promise.all(rows.map((r) => resolveClient(r)));
}
