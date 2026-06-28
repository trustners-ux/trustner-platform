/**
 * Trustner Verdict Engine v2 — APPROVED BUY-LIST
 * ==============================================
 * Loads the firm's curated, committee-approved scheme shortlist (pd_trustner_buylist,
 * seeded from the Research-Backed Shortlist) so the PD can:
 *   1. flag which of a client's holdings are already on the Trustner Buy-List,
 *   2. draw SWAP/EXIT replacements ONLY from APPROVED_OPEN funds (within capacity),
 *      keeping every review consistent with the house view and faster to produce.
 *
 * All access is graceful: if the table is missing/empty the engine simply behaves
 * as before (no buy-list annotations). Trustner is an AMFI MFD (ARN-286886).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type BuyListStatus = 'APPROVED_OPEN' | 'APPROVED_HOLD_ONLY' | 'WATCH';
export interface BuyListEntry {
  category: string;
  subKey: string;
  amfiCode: string | null;
  schemeName: string;
  manager: string | null;
  managerTenureYrs: number | null;
  aumInrCr: number | null;
  ter: number | null;
  cagr5y: number | null;
  status: BuyListStatus;
  conviction: string | null;   // CORE | SATELLITE
  note: string | null;
}
export interface BuyList {
  entries: BuyListEntry[];
  byAmfi: Map<string, BuyListEntry>;
  bySubKey: Map<string, BuyListEntry[]>;
}

const EMPTY: BuyList = { entries: [], byAmfi: new Map(), bySubKey: new Map() };

// Token set for fuzzy name matching — keep distinguishing words (growth/cap/multi/
// small/mid/flexi etc.), drop only plan-wrapper noise. This prevents "Nippon India
// Multi Cap" from matching "Nippon India Growth Fund".
const NOISE = new Set(['plan', 'regular', 'direct', 'option', 'the', 'of', 'idcw', 'payout', 'reinvestment', 'dividend']);
const tokenSet = (s: string | null | undefined) =>
  new Set((s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w && !NOISE.has(w)));
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Load the active buy-list. Returns an empty list (never throws) if the table is absent. */
export async function loadBuyList(sb: SupabaseClient): Promise<BuyList> {
  try {
    const { data, error } = await sb
      .from('pd_trustner_buylist')
      .select('category, sub_key, amfi_code, scheme_name, manager, manager_tenure_yrs, aum_inr_cr, ter, cagr_5y, status, conviction, note')
      .eq('active', true);
    if (error || !data || !data.length) return EMPTY;
    const entries: BuyListEntry[] = data.map((r) => ({
      category: r.category as string,
      subKey: r.sub_key as string,
      amfiCode: (r.amfi_code as string | null) ?? null,
      schemeName: r.scheme_name as string,
      manager: (r.manager as string | null) ?? null,
      managerTenureYrs: r.manager_tenure_yrs != null ? Number(r.manager_tenure_yrs) : null,
      aumInrCr: r.aum_inr_cr != null ? Number(r.aum_inr_cr) : null,
      ter: r.ter != null ? Number(r.ter) : null,
      cagr5y: r.cagr_5y != null ? Number(r.cagr_5y) : null,
      status: (r.status as BuyListStatus) ?? 'WATCH',
      conviction: (r.conviction as string | null) ?? null,
      note: (r.note as string | null) ?? null,
    }));
    const byAmfi = new Map<string, BuyListEntry>();
    const bySubKey = new Map<string, BuyListEntry[]>();
    for (const e of entries) {
      if (e.amfiCode) byAmfi.set(e.amfiCode, e);
      (bySubKey.get(e.subKey) ?? bySubKey.set(e.subKey, []).get(e.subKey)!).push(e);
    }
    return { entries, byAmfi, bySubKey };
  } catch {
    return EMPTY;
  }
}

/** Is a holding on the buy-list? Exact AMFI match first, else a STRICT token-Jaccard
 *  name match (≥0.7) so near-name funds (e.g. Multi Cap vs Growth Fund) don't collide. */
export function matchBuyList(bl: BuyList, amfi: string | null, schemeName: string): BuyListEntry | null {
  if (amfi && bl.byAmfi.has(amfi)) return bl.byAmfi.get(amfi)!;
  const t = tokenSet(schemeName);
  if (t.size < 2) return null;
  let best: BuyListEntry | null = null, bestJ = 0;
  for (const e of bl.entries) {
    const j = jaccard(t, tokenSet(e.schemeName));
    if (j > bestJ) { bestJ = j; best = e; }
  }
  return bestJ >= 0.7 ? best : null;
}

/** Best APPROVED_OPEN replacement in a sub-category (CORE first, then 5Y CAGR), excluding a fund. */
export function bestOpenReplacement(bl: BuyList, subKey: string, excludeAmfi: string | null): BuyListEntry | null {
  const cands = (bl.bySubKey.get(subKey) ?? []).filter(
    (e) => e.status === 'APPROVED_OPEN' && (!excludeAmfi || e.amfiCode !== excludeAmfi),
  );
  if (!cands.length) return null;
  return cands.sort((a, b) =>
    (a.conviction === 'CORE' ? 0 : 1) - (b.conviction === 'CORE' ? 0 : 1) ||
    (b.cagr5y ?? -99) - (a.cagr5y ?? -99),
  )[0];
}
