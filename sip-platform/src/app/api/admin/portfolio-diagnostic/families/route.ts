/**
 * Portfolio Diagnostic — Client Family Search API
 *
 * GET ?q=<query> — fuzzy search on family name + primary contact name.
 * POST — create a new client family.
 *
 * Route: /api/admin/portfolio-diagnostic/families
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ families: [] });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // PRIVACY: an RM may only find THEIR OWN clients (assigned_rm / assigned_cfp
  // in their visibility scope). Without this an RM could search and run a
  // diagnostic on another RM's client (e.g. Bihani Family). Admins/approvers
  // (firm scope) see all.
  let allowedIds: number[] | null = null; // null = see all
  if (!actor.isAdminToken) {
    const { data: emp } = await supabase
      .from('employees').select('id').ilike('email', actor.email.trim()).maybeSingle();
    const empId = (emp?.id as number) ?? 0;
    const scope = await getVisibleEmployeeIds({ employeeId: empId, email: actor.email });
    if (!scope.includeAll) allowedIds = scope.employeeIds;
  }
  if (allowedIds !== null && allowedIds.length === 0) {
    return NextResponse.json({ families: [] });
  }

  let query = supabase
    .from('pd_client_families')
    .select('id, family_name, segment, total_aum_inr, primary_contact_name, primary_contact_mobile')
    .or(
      `family_name.ilike.%${q}%,primary_contact_name.ilike.%${q}%,primary_contact_mobile.ilike.%${q}%`
    );
  if (allowedIds !== null) {
    const ids = allowedIds.join(',');
    query = query.or(`assigned_rm_employee_id.in.(${ids}),assigned_cfp_employee_id.in.(${ids})`);
  }
  const { data, error } = await query.limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    families:
      data?.map((row) => ({
        id: row.id,
        familyName: row.family_name,
        segment: row.segment,
        totalAumInr: Number(row.total_aum_inr) || 0,
        primaryContactName: row.primary_contact_name,
        primaryContactMobile: row.primary_contact_mobile,
      })) ?? [],
  });
}

interface CreateFamilyBody {
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactMobile: string;
  primaryContactPan?: string;
  segment: 'Mass' | 'Affluent' | 'HNI' | 'UHNI';
  notes?: string;
}

export async function POST(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as CreateFamilyBody;

  if (!body.familyName || !body.primaryContactEmail) {
    return NextResponse.json(
      { error: 'familyName and primaryContactEmail are required' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Generate family code: first 3 letters of name + 4-digit random
  const familyCode = `${body.familyName.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Stamp the creating employee as the assigned RM so the family is THEIRS and
  // shows up in their own (scoped) search — and not in anyone else's.
  const { data: creator } = await supabase
    .from('employees').select('id').ilike('email', actor.email.trim()).maybeSingle();

  const { data, error } = await supabase
    .from('pd_client_families')
    .insert({
      family_code: familyCode,
      family_name: body.familyName,
      primary_contact_name: body.primaryContactName,
      primary_contact_email: body.primaryContactEmail,
      primary_contact_mobile: body.primaryContactMobile,
      primary_contact_pan_encrypted: body.primaryContactPan, // TODO: encrypt
      segment: body.segment,
      notes: body.notes,
      assigned_rm_employee_id: (creator?.id as number) ?? null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ familyId: data?.id, familyCode });
}

/** Resolve the caller's email + whether they hold a classic admin JWT (admins
 *  see all clients). Returns null if unauthenticated. */
async function resolveActor(): Promise<{ email: string; isAdminToken: boolean } | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return { email: p.email, isAdminToken: true };
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return { email: p.email, isAdminToken: false };
  }
  return null;
}
