/**
 * Preferred-Funds Management API
 *
 *   GET    — paginated list of pd_fund_master rows, searchable by name,
 *            filterable by category / AMC / preferred-only. Returns the
 *            data the /admin/funds/preferred-list UI binds to.
 *
 *   PATCH  — body: { amfi_code, trustner_preferred } — flip the flag
 *            on one fund. Audit-logged.
 *
 * Why this exists: methodology v1.1.0 added a "Trustner-preferred"
 * floor that lifts any flagged fund's verdict to KEEP at minimum.
 * This API lets the CFP committee curate which funds carry that flag
 * without going to Supabase directly.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const auth = await resolveAuth();
  if (!auth.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get('q') ?? '').trim();
  const category = (url.searchParams.get('category') ?? '').trim();
  const amc = (url.searchParams.get('amc') ?? '').trim();
  const preferredOnly = url.searchParams.get('preferred') === '1';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  let query = supabase
    .from('pd_fund_master')
    .select(
      'amfi_code, scheme_name, amc_name, category, sub_category, cagr_3y, cagr_5y, category_rank_3y, category_total, trustner_preferred',
      { count: 'exact' }
    );

  if (search) query = query.ilike('scheme_name', `%${search}%`);
  if (category) query = query.eq('category', category);
  if (amc) query = query.ilike('amc_name', `%${amc}%`);
  if (preferredOnly) query = query.eq('trustner_preferred', true);

  // Order: preferred-first then by CAGR descending (so top performers
  // surface at the top of each search)
  query = query
    .order('trustner_preferred', { ascending: false })
    .order('cagr_3y', { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also fetch the distinct categories for the filter dropdown — only
  // on page 1 to save round-trips
  let categories: string[] = [];
  let preferredCount = 0;
  if (page === 1) {
    const { data: cats } = await supabase
      .from('pd_fund_master')
      .select('category')
      .not('category', 'is', null)
      .limit(1000);
    categories = Array.from(new Set((cats ?? []).map((c) => c.category as string).filter(Boolean))).sort();

    const { count: prefCount } = await supabase
      .from('pd_fund_master')
      .select('amfi_code', { count: 'exact', head: true })
      .eq('trustner_preferred', true);
    preferredCount = prefCount ?? 0;
  }

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    categories,
    preferredCount,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await resolveAuth();
  if (!auth.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    amfi_code?: string;
    trustner_preferred?: boolean;
  };
  if (!body.amfi_code) {
    return NextResponse.json({ error: 'amfi_code required' }, { status: 400 });
  }
  if (typeof body.trustner_preferred !== 'boolean') {
    return NextResponse.json({ error: 'trustner_preferred must be boolean' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { error } = await supabase
    .from('pd_fund_master')
    .update({ trustner_preferred: body.trustner_preferred })
    .eq('amfi_code', body.amfi_code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log (best-effort)
  void supabase.from('app_artefact_views').insert({
    artefact_type: body.trustner_preferred ? 'fund_preferred_set' : 'fund_preferred_unset',
    artefact_id: 0,
    actor_email: auth.email,
    view_count: 1,
  });

  return NextResponse.json({ success: true, amfi_code: body.amfi_code, trustner_preferred: body.trustner_preferred });
}

async function resolveAuth(): Promise<{ email: string | null; viaAdmin: boolean }> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return { email: p.email, viaAdmin: true };
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return { email: p.email, viaAdmin: false };
  }
  return { email: null, viaAdmin: false };
}
