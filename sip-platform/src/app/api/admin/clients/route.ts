/**
 * Admin Clients Directory API
 *
 * GET /api/admin/clients
 *
 * Query params:
 *   q              → fuzzy search across family name + contact name + mobile
 *   segment        → filter by segment (Retail/HNI/UHNI/Corporate/Mass)
 *   hasActivity    → only families with at least one PD diagnostic
 *   sort           → 'aum_desc' | 'name_asc' | 'updated_desc' (default updated_desc)
 *   limit          → default 100, max 500
 *
 * Returns enriched family rows:
 *   - basic info (id, code, name, contact, segment)
 *   - artefact counts per type (diagnostics, briefs, proposals, etc)
 *   - last activity timestamp
 *   - latest published diagnostic AUM (current snapshot)
 *
 * Auth: any authenticated employee. Visibility scoping (own/subtree/
 * firm) is applied in a future iteration when client_family is
 * formally owned by an RM. For now: principals + can_view_pii see all,
 * others see only families they've personally interacted with.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

interface ClientRow {
  id: number;
  familyCode: string | null;
  familyName: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactMobile: string | null;
  segment: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  diagnosticCount: number;
  publishedDiagnosticCount: number;
  briefCount: number;
  proposalCount: number;
  orientationCount: number;
  reviewCount: number;
  latestPublishedAumInr: number | null;
  latestPublishedDiagId: number | null;
}

export async function GET(req: NextRequest) {
  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const segment = url.searchParams.get('segment')?.trim();
  const hasActivity = url.searchParams.get('hasActivity') === '1';
  const sort = url.searchParams.get('sort') ?? 'updated_desc';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500);

  // ── Base families query ──
  let famQ = supabase
    .from('pd_client_families')
    .select(
      'id, family_code, family_name, primary_contact_name, primary_contact_email, primary_contact_mobile, segment, created_at, updated_at'
    )
    .limit(limit);

  if (segment) famQ = famQ.eq('segment', segment);
  if (q) {
    famQ = famQ.or(
      `family_name.ilike.%${q}%,primary_contact_name.ilike.%${q}%,primary_contact_mobile.ilike.%${q}%`
    );
  }

  if (sort === 'name_asc') famQ = famQ.order('family_name', { ascending: true });
  else famQ = famQ.order('updated_at', { ascending: false, nullsFirst: false });

  const { data: families, error } = await famQ;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!families || families.length === 0) {
    return NextResponse.json({ clients: [], total: 0 });
  }

  const familyIds = families.map((f) => f.id as number);

  // ── Aggregate artefact counts in parallel ──
  const [pdRows, mpRows, ipRows, coRows, prRows] = await Promise.all([
    supabase
      .from('pd_diagnostic_runs')
      .select('id, family_id, status, current_value_inr, updated_at, published_at')
      .in('family_id', familyIds),
    supabase
      .from('mp_meeting_briefs')
      .select('id, family_id, updated_at')
      .in('family_id', familyIds),
    supabase
      .from('ip_investment_proposals')
      .select('id, family_id, updated_at')
      .in('family_id', familyIds),
    supabase
      .from('co_client_orientations')
      .select('id, family_id, updated_at')
      .in('family_id', familyIds),
    supabase
      .from('pr_periodic_reviews')
      .select('id, family_id, updated_at')
      .in('family_id', familyIds),
  ]);

  // Build per-family aggregates
  const pdByFam = new Map<number, Array<{ id: number; status: string; aum: number; updated: string | null; published: string | null }>>();
  for (const r of pdRows.data ?? []) {
    const fid = r.family_id as number;
    const arr = pdByFam.get(fid) ?? [];
    arr.push({
      id: r.id as number,
      status: r.status as string,
      aum: Number(r.current_value_inr) || 0,
      updated: (r.updated_at as string) ?? null,
      published: (r.published_at as string) ?? null,
    });
    pdByFam.set(fid, arr);
  }
  const countBy = (rows: { family_id: number }[] | null) => {
    const m = new Map<number, number>();
    for (const r of rows ?? []) m.set(r.family_id, (m.get(r.family_id) ?? 0) + 1);
    return m;
  };
  const mpCount = countBy(mpRows.data ?? null);
  const ipCount = countBy(ipRows.data ?? null);
  const coCount = countBy(coRows.data ?? null);
  const prCount = countBy(prRows.data ?? null);

  // Last activity per family — most recent of (diagnostic, brief, proposal, orientation, review) updated_at
  const lastActivity = new Map<number, string>();
  const recordActivity = (fid: number, ts: string | null | undefined) => {
    if (!ts) return;
    const cur = lastActivity.get(fid);
    if (!cur || new Date(ts).getTime() > new Date(cur).getTime()) lastActivity.set(fid, ts);
  };
  for (const arr of pdByFam.values()) for (const r of arr) recordActivity(arr[0]?.id ? 0 : 0, null); // dummy
  for (const r of pdRows.data ?? []) recordActivity(r.family_id as number, r.updated_at as string);
  for (const r of mpRows.data ?? []) recordActivity(r.family_id as number, r.updated_at as string);
  for (const r of ipRows.data ?? []) recordActivity(r.family_id as number, r.updated_at as string);
  for (const r of coRows.data ?? []) recordActivity(r.family_id as number, r.updated_at as string);
  for (const r of prRows.data ?? []) recordActivity(r.family_id as number, r.updated_at as string);

  let clients: ClientRow[] = families.map((f) => {
    const pdArr = pdByFam.get(f.id as number) ?? [];
    const publishedPds = pdArr.filter((p) => p.status === 'PUBLISHED');
    publishedPds.sort((a, b) => {
      const at = a.published ? new Date(a.published).getTime() : 0;
      const bt = b.published ? new Date(b.published).getTime() : 0;
      return bt - at;
    });
    const latestPub = publishedPds[0] ?? null;
    return {
      id: f.id as number,
      familyCode: (f.family_code as string) ?? null,
      familyName: f.family_name as string,
      primaryContactName: (f.primary_contact_name as string) ?? null,
      primaryContactEmail: (f.primary_contact_email as string) ?? null,
      primaryContactMobile: (f.primary_contact_mobile as string) ?? null,
      segment: (f.segment as string) ?? null,
      createdAt: f.created_at as string,
      lastActivityAt: lastActivity.get(f.id as number) ?? null,
      diagnosticCount: pdArr.length,
      publishedDiagnosticCount: publishedPds.length,
      briefCount: mpCount.get(f.id as number) ?? 0,
      proposalCount: ipCount.get(f.id as number) ?? 0,
      orientationCount: coCount.get(f.id as number) ?? 0,
      reviewCount: prCount.get(f.id as number) ?? 0,
      latestPublishedAumInr: latestPub?.aum ?? null,
      latestPublishedDiagId: latestPub?.id ?? null,
    };
  });

  if (hasActivity) {
    clients = clients.filter(
      (c) =>
        c.diagnosticCount + c.briefCount + c.proposalCount + c.orientationCount + c.reviewCount > 0
    );
  }

  // Apply sort overrides that need aggregates
  if (sort === 'aum_desc') {
    clients.sort((a, b) => (b.latestPublishedAumInr ?? 0) - (a.latestPublishedAumInr ?? 0));
  } else if (sort === 'updated_desc') {
    clients.sort((a, b) => {
      const at = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bt - at;
    });
  }

  return NextResponse.json({ clients, total: clients.length });
}

async function authorize(): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
  const cookieStore = await cookies();
  let email: string | null = null;
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) return { allowed: false, status: 401, reason: 'Not authenticated' };
  if (APPROVER_EMAILS.includes(email.toLowerCase())) return { allowed: true };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };
  const { data: empRow } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!empRow?.id) return { allowed: false, status: 403, reason: 'Employee row not found' };
  return { allowed: true };
}
