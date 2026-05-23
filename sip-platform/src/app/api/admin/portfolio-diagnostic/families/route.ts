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

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
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

  // ILIKE search on family_name + primary_contact_name + primary_contact_mobile
  const { data, error } = await supabase
    .from('pd_client_families')
    .select('id, family_name, segment, total_aum_inr, primary_contact_name, primary_contact_mobile')
    .or(
      `family_name.ilike.%${q}%,primary_contact_name.ilike.%${q}%,primary_contact_mobile.ilike.%${q}%`
    )
    .limit(10);

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
  if (!(await isAuthenticated())) {
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
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ familyId: data?.id, familyCode });
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifyToken(adminToken))) return true;
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken && (await verifyEmployeeToken(empToken))) return true;
  return false;
}
