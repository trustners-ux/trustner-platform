/**
 * Preferred Swap Pairs CRUD API
 *
 *   GET    — list all pairs (default active=true). Supports ?all=1 to
 *            include deactivated rows.
 *   POST   — create a new pair. Body: { exit_amfi_code, recommended_amfi_code, rationale }.
 *            The scheme_name fields are looked up from pd_fund_master.
 *   PATCH  — body: { id, rationale?, recommended_amfi_code? } — edit
 *            an existing pair. Use the deactivate route for soft-delete.
 *
 * The engine reads active=true rows when assigning replacement
 * recommendations for SWAP-tier holdings (Phase 4 wiring).
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

export async function GET(req: NextRequest) {
  const auth = await resolveAuth();
  if (!auth.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(req.url);
  const includeAll = url.searchParams.get('all') === '1';

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  let q = supabase
    .from('pd_preferred_swaps')
    .select('id, exit_amfi_code, exit_scheme_name, recommended_amfi_code, recommended_scheme_name, rationale, approved_by_email, approved_at, active, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (!includeAll) q = q.eq('active', true);

  const { data, error } = await q;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuth();
  if (!auth.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    exit_amfi_code?: string;
    recommended_amfi_code?: string;
    rationale?: string;
  };

  if (!body.exit_amfi_code || !body.recommended_amfi_code || !body.rationale) {
    return NextResponse.json(
      { error: 'exit_amfi_code, recommended_amfi_code, and rationale are required' },
      { status: 400 }
    );
  }
  if (body.exit_amfi_code === body.recommended_amfi_code) {
    return NextResponse.json(
      { error: 'A fund cannot be its own replacement' },
      { status: 400 }
    );
  }
  if (body.rationale.trim().length < 10) {
    return NextResponse.json(
      { error: 'Rationale must be at least 10 characters — explain why this swap is recommended' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Resolve scheme names from fund_master
  const { data: funds } = await supabase
    .from('pd_fund_master')
    .select('amfi_code, scheme_name')
    .in('amfi_code', [body.exit_amfi_code, body.recommended_amfi_code]);
  const byCode = new Map((funds ?? []).map((f) => [f.amfi_code as string, f.scheme_name as string]));
  const exitName = byCode.get(body.exit_amfi_code);
  const recName = byCode.get(body.recommended_amfi_code);
  if (!exitName || !recName) {
    return NextResponse.json(
      { error: 'One of the AMFI codes was not found in fund_master' },
      { status: 400 }
    );
  }

  // Look up employee_id if applicable
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('email', auth.email)
    .maybeSingle();

  // Deactivate any existing active recommendation for this exit fund
  // (the partial unique index would reject otherwise)
  await supabase
    .from('pd_preferred_swaps')
    .update({ active: false, deactivated_at: new Date().toISOString() })
    .eq('exit_amfi_code', body.exit_amfi_code)
    .eq('active', true);

  const { data: row, error } = await supabase
    .from('pd_preferred_swaps')
    .insert({
      exit_amfi_code: body.exit_amfi_code,
      exit_scheme_name: exitName,
      recommended_amfi_code: body.recommended_amfi_code,
      recommended_scheme_name: recName,
      rationale: body.rationale.trim(),
      approved_by_employee_id: emp?.id ?? null,
      approved_by_email: auth.email,
    })
    .select('id')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ success: true, id: row?.id });
}

export async function PATCH(req: NextRequest) {
  const auth = await resolveAuth();
  if (!auth.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    rationale?: string;
    active?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const update: Record<string, unknown> = {};
  if (typeof body.rationale === 'string') {
    if (body.rationale.trim().length < 10) {
      return NextResponse.json({ error: 'Rationale must be at least 10 characters' }, { status: 400 });
    }
    update.rationale = body.rationale.trim();
  }
  if (typeof body.active === 'boolean') {
    update.active = body.active;
    if (!body.active) update.deactivated_at = new Date().toISOString();
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await supabase.from('pd_preferred_swaps').update(update).eq('id', body.id);
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ success: true });
}

async function resolveAuth(): Promise<{ email: string | null }> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return { email: p.email };
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return { email: p.email };
  }
  return { email: null };
}
