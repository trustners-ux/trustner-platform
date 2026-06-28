/**
 * Portal-side holdings + SIP fetchers.
 *
 * Used by /portal/holdings (server component) to show the logged-in
 * client's own holdings + family-consolidated view. Server-only —
 * uses SUPABASE_SERVICE_ROLE_KEY.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { ClientHolding, ClientSipMandate, ClientAumSummary, FamilyAumSummary } from '@/lib/holdings/types';

export interface PortalHoldingsView {
  summary: ClientAumSummary | null;
  holdings: ClientHolding[];
  active_sips: ClientSipMandate[];
  family_summary: FamilyAumSummary | null;
  family_members: { id: number; client_id: number; display_name: string; relationship: string; total_aum: number }[];
}

/**
 * Get the logged-in client's holdings + active SIPs + family roll-up.
 * If the client is part of a family (Phase A family_members), also
 * pull the family-level totals + sibling list.
 */
export async function getPortalHoldingsView(client_id: number): Promise<PortalHoldingsView | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // 1. Per-client AUM summary
  const { data: summaryRow } = await sb
    .from('client_aum_summary')
    .select('*')
    .eq('client_id', client_id)
    .maybeSingle();

  // 2. Holdings — sorted by current value desc
  const { data: holdings } = await sb
    .from('client_holdings')
    .select('*')
    .eq('client_id', client_id)
    .order('current_value', { ascending: false });

  // 3. Active SIPs — sorted by next_due_date
  const { data: sips } = await sb
    .from('client_sip_mandates')
    .select('*')
    .eq('client_id', client_id)
    .eq('status', 'active')
    .order('next_due_date', { ascending: true });

  // 4. Family lookup — is this client in any family?
  const { data: fm } = await sb
    .from('family_members')
    .select('family_id, role')
    .eq('client_id', client_id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  let family_summary: FamilyAumSummary | null = null;
  let family_members: PortalHoldingsView['family_members'] = [];

  if (fm) {
    // 5. Family-level totals
    const { data: famSum } = await sb
      .from('family_aum_summary')
      .select('*')
      .eq('family_id', fm.family_id)
      .maybeSingle();
    family_summary = (famSum as unknown as FamilyAumSummary | null) ?? null;

    // 6. Sibling list with their individual totals
    const { data: siblings } = await sb
      .from('family_members')
      .select('id, role, clients!inner(id, display_name)')
      .eq('family_id', fm.family_id)
      .eq('is_active', true);

    if (siblings) {
      const sibClientIds = siblings.map((s) => (s as unknown as { clients: { id: number } }).clients.id);
      const { data: sibAums } = await sb
        .from('client_aum_summary')
        .select('client_id, total_aum')
        .in('client_id', sibClientIds);
      const aumLookup = new Map((sibAums || []).map((s) => [s.client_id as number, s.total_aum as number]));

      family_members = siblings.map((s) => {
        const node = s as unknown as { id: number; role: string; clients: { id: number; display_name: string } };
        return {
          id: node.id,
          client_id: node.clients.id,
          display_name: node.clients.display_name,
          relationship: node.role,
          total_aum: aumLookup.get(node.clients.id) ?? 0,
        };
      });
    }
  }

  return {
    summary: (summaryRow as unknown as ClientAumSummary | null) ?? null,
    holdings: (holdings as unknown as ClientHolding[] | null) ?? [],
    active_sips: (sips as unknown as ClientSipMandate[] | null) ?? [],
    family_summary,
    family_members,
  };
}
