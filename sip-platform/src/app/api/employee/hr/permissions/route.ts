/**
 * GET  /api/employee/hr/permissions       — list all (admin only)
 * GET  /api/employee/hr/permissions?email=x — get one
 * PUT  /api/employee/hr/permissions        — upsert (admin only)
 *
 * Used by the admin user-management UI to control HRMS module access.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { DEFAULT_PERMISSIONS, type HrPermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const SUPER_ADMIN_EMAIL = 'ram@trustner.in';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

function isAdmin(email: string, role?: string) {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL || role === 'super_admin' || role === 'admin';
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const email = url.searchParams.get('email');

  if (email) {
    const { data, error } = await supabase
      .from('hr_user_permissions')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
    return NextResponse.json({ permissions: data ?? { ...DEFAULT_PERMISSIONS, email } });
  }

  // List — admin only
  if (!isAdmin(actor.email, actor.role)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { data, error } = await supabase
    .from('hr_user_permissions')
    .select('*')
    .order('email');
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ rows: data ?? [] });
}

export async function PUT(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!isAdmin(actor.email, actor.role)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { email, permissions } = body as { email?: string; permissions?: Partial<HrPermissions> };
  if (!email || !permissions) {
    return NextResponse.json({ error: 'email and permissions required' }, { status: 400 });
  }

  const upsertRow = {
    email: email.toLowerCase(),
    ...DEFAULT_PERMISSIONS,
    ...permissions,
    updated_by: actor.email,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('hr_user_permissions')
    .upsert(upsertRow, { onConflict: 'email' })
    .select('*')
    .single();

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ permissions: data });
}
