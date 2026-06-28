/**
 * Heuristic family-linker — best-effort family grouping when the source
 * export (Wealth Elite, Investwell) doesn't carry an explicit family
 * graph.
 *
 * Strategy:
 *   1. Group clients by `(normalized_last_name, addr_current_pincode,
 *      addr_line1_prefix(20))` — same household.
 *   2. Group clients by `mobile_primary` — joint account holders sharing
 *      a single number (common for couples / parent-child).
 *   3. Skip groups that contain a client already in a family.
 *   4. For each new group, pick the OLDEST client (or first by id) as
 *      the head and create a family with role-guessed memberships.
 *
 * Idempotent — re-running adds NEW groups but never disturbs existing
 * families.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { ClientsActor, FamilyRole } from './types';

interface LinkerClientRow {
  id: number;
  display_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age_years: number | null;
  marital_status: string;
  gender: string;
  mobile_primary: string | null;
  addr_current_line1: string | null;
  addr_current_pincode: string | null;
}

export interface HeuristicLinkResult {
  scanned_clients: number;
  excluded_already_in_family: number;
  household_groups: number;
  household_families_created: number;
  household_members_added: number;
  shared_mobile_groups: number;
  shared_mobile_families_created: number;
  shared_mobile_members_added: number;
  /** Sample sizes for debugging the heuristic */
  example_groups: { kind: string; key: string; members: { id: number; name: string }[] }[];
}

function normLastName(s: string | null): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/[^a-z]/g, '');
}

function normAddrPrefix(s: string | null, len = 20): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, len);
}

function normMobile(s: string | null): string {
  if (!s) return '';
  return s.replace(/\D/g, '').slice(-10);
}

function guessRole(head: LinkerClientRow, member: LinkerClientRow): FamilyRole {
  if (head.age_years != null && member.age_years != null) {
    const diff = head.age_years - member.age_years;
    if (diff > 16 && diff < 60) return 'child';
    if (diff < -16) return 'parent';
    if (Math.abs(diff) <= 16 && head.gender !== member.gender && head.marital_status === 'married') return 'spouse';
  }
  return 'other_dependent';
}

async function fetchAllClients(): Promise<LinkerClientRow[]> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');
  const out: LinkerClientRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (offset < 100000) {
    const { data, error } = await sb
      .from('clients')
      .select('id, display_name, first_name, middle_name, last_name, age_years, marital_status, gender, mobile_primary, addr_current_line1, addr_current_pincode')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`fetch clients failed at offset ${offset}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) out.push(r as LinkerClientRow);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

async function fetchClientsAlreadyInFamily(): Promise<Set<number>> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');
  const set = new Set<number>();
  const PAGE = 1000;
  let offset = 0;
  while (offset < 100000) {
    const { data, error } = await sb
      .from('family_members')
      .select('client_id')
      .eq('is_active', true)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`fetch family_members failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) set.add((r as { client_id: number }).client_id);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return set;
}

/**
 * Insert a family + its memberships. Returns members_added.
 * If something fails, returns 0 and logs (so the caller's totals stay
 * consistent and partial success is possible).
 */
async function insertFamily(
  members: LinkerClientRow[],
  description: string,
  actor: ClientsActor,
): Promise<{ created: boolean; members_added: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');
  if (members.length < 2) return { created: false, members_added: 0 };

  // Head = oldest by age_years (tiebreak by lowest id) — if no age data, just lowest id
  const sorted = members.slice().sort((a, b) => {
    if (a.age_years != null && b.age_years != null) return b.age_years - a.age_years;
    if (a.age_years != null) return -1;
    if (b.age_years != null) return 1;
    return a.id - b.id;
  });
  const head = sorted[0];

  const familyName = `${head.last_name || head.display_name} family`;
  const { data: fam, error: famErr } = await sb
    .from('families')
    .insert({
      name: familyName,
      head_client_id: head.id,
      description,
      created_by_user_id: actor.user_id,
    })
    .select('id')
    .single();

  if (famErr || !fam) {
    console.error(`[heuristic-linker] family insert failed for head=${head.id}: ${famErr?.message}`);
    return { created: false, members_added: 0 };
  }
  const family_id = (fam as { id: number }).id;

  // Insert head + members
  let added = 0;
  for (const m of sorted) {
    const role: FamilyRole = m.id === head.id ? 'head' : guessRole(head, m);
    const { error: mErr } = await sb
      .from('family_members')
      .insert({ family_id, client_id: m.id, role, is_active: true });
    if (!mErr) added++;
  }
  return { created: true, members_added: added };
}

export async function runHeuristicFamilyLinker(actor: ClientsActor): Promise<HeuristicLinkResult> {
  const clients = await fetchAllClients();
  const inFamily = await fetchClientsAlreadyInFamily();

  // ── Pass 1: same household (last_name + pincode + addr prefix) ─────────────
  const householdByKey = new Map<string, LinkerClientRow[]>();
  for (const c of clients) {
    const ln = normLastName(c.last_name);
    const pin = (c.addr_current_pincode || '').trim();
    const addr = normAddrPrefix(c.addr_current_line1);
    if (!ln || !pin || !addr) continue;
    const key = `${ln}|${pin}|${addr}`;
    const arr = householdByKey.get(key) || [];
    arr.push(c);
    householdByKey.set(key, arr);
  }

  const result: HeuristicLinkResult = {
    scanned_clients: clients.length,
    excluded_already_in_family: inFamily.size,
    household_groups: 0,
    household_families_created: 0,
    household_members_added: 0,
    shared_mobile_groups: 0,
    shared_mobile_families_created: 0,
    shared_mobile_members_added: 0,
    example_groups: [],
  };

  // Track clients that we just added in this run (so a single client doesn't
  // get put in TWO different heuristic families)
  const justLinked = new Set<number>();

  for (const [key, members] of householdByKey) {
    // Only count as a group if there are 2+ distinct clients
    if (members.length < 2) continue;
    result.household_groups++;
    // Filter out clients already in a family OR already linked in this run
    const fresh = members.filter((m) => !inFamily.has(m.id) && !justLinked.has(m.id));
    if (fresh.length < 2) continue;
    const desc = `Auto-linked by heuristic: household match (last_name=${members[0].last_name}, pincode=${members[0].addr_current_pincode}). Created by ${actor.email}.`;
    const r = await insertFamily(fresh, desc, actor);
    if (r.created) {
      result.household_families_created++;
      result.household_members_added += r.members_added;
      for (const m of fresh) justLinked.add(m.id);
      if (result.example_groups.length < 8) {
        result.example_groups.push({
          kind: 'household',
          key,
          members: fresh.map((m) => ({ id: m.id, name: m.display_name })),
        });
      }
    }
  }

  // ── Pass 2: shared mobile_primary ──────────────────────────────────────────
  const mobileByKey = new Map<string, LinkerClientRow[]>();
  for (const c of clients) {
    const mob = normMobile(c.mobile_primary);
    if (!mob || mob.length < 10) continue;
    const arr = mobileByKey.get(mob) || [];
    arr.push(c);
    mobileByKey.set(mob, arr);
  }

  for (const [mob, members] of mobileByKey) {
    if (members.length < 2) continue;
    result.shared_mobile_groups++;
    const fresh = members.filter((m) => !inFamily.has(m.id) && !justLinked.has(m.id));
    if (fresh.length < 2) continue;
    const desc = `Auto-linked by heuristic: shared mobile ${mob}. Created by ${actor.email}.`;
    const r = await insertFamily(fresh, desc, actor);
    if (r.created) {
      result.shared_mobile_families_created++;
      result.shared_mobile_members_added += r.members_added;
      for (const m of fresh) justLinked.add(m.id);
      if (result.example_groups.length < 16) {
        result.example_groups.push({
          kind: 'shared_mobile',
          key: mob,
          members: fresh.map((m) => ({ id: m.id, name: m.display_name })),
        });
      }
    }
  }

  return result;
}
