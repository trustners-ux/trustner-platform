/**
 * Holidays API.
 *
 * GET    /api/employee/hr/holidays?fy=FY2026[&office=HO_GHY]
 *   List holidays for the FY, optionally filtered to a single office.
 *   When `office` is set, returns only holidays that apply to that office:
 *     - office_codes IS NULL  (applies to all offices)
 *     - office_codes contains the given office code
 *
 * POST   /api/employee/hr/holidays  (admin only)
 *   Create a new holiday with optional office_codes array.
 *
 * PUT    /api/employee/hr/holidays  (admin only)
 *   Update an existing holiday.
 *
 * DELETE /api/employee/hr/holidays?id=N  (admin only)
 *   Remove a holiday.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

async function requireAdmin(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return { error: 'Unauthenticated', status: 401 as const, actor: null };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_leave_admin) {
    return { error: 'Admin only — need can_access_leave_admin', status: 403 as const, actor };
  }
  return { actor, error: null };
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const fy = url.searchParams.get('fy') || 'FY2026';
  const office = url.searchParams.get('office');

  let query = supabase
    .from('hr_holidays')
    .select('id, fy, holiday_date, name, type, entity, state, office_location, office_codes, description')
    .eq('fy', fy)
    .order('holiday_date');

  if (office) {
    // Holiday is applicable when office_codes is NULL/empty OR contains this office
    // Supabase doesn't have a "is null OR contains" composite filter, so we
    // fetch both sets and merge below.
    const [{ data: all }, { data: scoped }] = await Promise.all([
      supabase
        .from('hr_holidays')
        .select('id, fy, holiday_date, name, type, entity, state, office_location, office_codes, description')
        .eq('fy', fy)
        .is('office_codes', null),
      supabase
        .from('hr_holidays')
        .select('id, fy, holiday_date, name, type, entity, state, office_location, office_codes, description')
        .eq('fy', fy)
        .contains('office_codes', [office]),
    ]);
    const seen = new Set<number>();
    const merged = [...(all ?? []), ...(scoped ?? [])]
      .filter((h) => {
        if (seen.has(h.id)) return false;
        seen.add(h.id);
        return true;
      })
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    return NextResponse.json({ holidays: merged });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holidays: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { fy, holiday_date, name, type, office_codes, state, entity, description } = body as {
    fy?: string; holiday_date?: string; name?: string; type?: string;
    office_codes?: string[] | null; state?: string | null;
    entity?: 'TAS' | 'TIB' | null; description?: string | null;
  };
  if (!fy || !holiday_date || !name || !type) {
    return NextResponse.json({ error: 'fy, holiday_date, name, type required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hr_holidays')
    .insert({
      fy, holiday_date, name, type,
      office_codes: office_codes && office_codes.length > 0 ? office_codes : null,
      state: state || null,
      entity: entity || null,
      description: description || null,
      created_by: guard.actor!.email,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holiday: data });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, ...patch } = body as { id?: number } & Record<string, unknown>;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Normalize empty arrays to NULL so "all offices" is canonical
  if (Array.isArray(patch.office_codes) && (patch.office_codes as string[]).length === 0) {
    patch.office_codes = null;
  }

  const { data, error } = await supabase
    .from('hr_holidays')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holiday: data });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('hr_holidays').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
