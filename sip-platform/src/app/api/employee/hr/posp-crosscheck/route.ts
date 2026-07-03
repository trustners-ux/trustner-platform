/**
 * POSP Cross-Check API.
 *
 * POST   /api/employee/hr/posp-crosscheck     — run a cross-check on a candidate
 * GET    /api/employee/hr/posp-crosscheck     — list audit history (flagged + cleared)
 * PATCH  /api/employee/hr/posp-crosscheck     — compliance review action (approve_exception / reject)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { runPospCrossCheck } from '@/lib/hr/posp-crosscheck';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_compliance ? actor : null;
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden — need can_access_compliance' }, { status: 403 });

  const body = await req.json();
  const { pan, name, mobile, aadhaar_last4, dob, address } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  try {
    const result = await runPospCrossCheck({ pan, name, mobile, aadhaar_last4, dob, address });
    return NextResponse.json({ result });
  } catch (e) {
    console.error('[POSP crosscheck]', (e as Error).message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('hr_posp_crosschecks')
    .select('id, posp_candidate_pan, posp_candidate_name, posp_candidate_mobile, matched_employee_id, matched_family_id, match_type, match_score, status, reviewed_by, reviewed_at, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action, notes } = body as { id?: number; action?: 'approve_exception' | 'reject'; notes?: string };
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const { data, error } = await supabase
    .from('hr_posp_crosschecks')
    .update({
      status: action === 'approve_exception' ? 'approved_exception' : 'rejected',
      reviewed_by: actor.email,
      reviewed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ audit: data });
}
