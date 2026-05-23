/**
 * Client Orientation — Create Draft
 *
 * POST /api/admin/client-orientation/draft
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function POST(req: NextRequest) {
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { data: emp } = await supabase
    .from('employees')
    .select('id, name')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!emp) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }
  const employeeId = emp.id as number;

  const body = (await req.json().catch(() => null)) as {
    familyId: number;
    familyName: string;
    monthlyHouseholdIncomeInr?: number;
    monthlyHouseholdExpensesInr?: number;
    numDependents?: number;
    prefChannel?: string;
    prefReviewFrequency?: string;
    prefLanguage?: string;
  } | null;

  if (!body || !body.familyId || !body.familyName) {
    return NextResponse.json({ error: 'Missing required fields: familyId, familyName' }, { status: 400 });
  }

  const documentId = `CO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: row, error } = await supabase
    .from('co_client_orientations')
    .insert({
      document_id: documentId,
      family_id: body.familyId,
      family_name: body.familyName,
      methodology_version: '1.0.0',
      status: 'DRAFT',
      uploaded_by_employee_id: employeeId,
      monthly_household_income_inr: body.monthlyHouseholdIncomeInr ?? null,
      monthly_household_expenses_inr: body.monthlyHouseholdExpensesInr ?? null,
      num_dependents: body.numDependents ?? 0,
      pref_channel: body.prefChannel ?? null,
      pref_review_frequency: body.prefReviewFrequency ?? null,
      pref_language: body.prefLanguage ?? 'English',
    })
    .select('id, document_id')
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create draft' }, { status: 500 });
  }

  await supabase.from('pd_workflow_events').insert({
    entity_type: 'client_orientation',
    entity_id: row.id,
    from_status: null,
    to_status: 'DRAFT',
    action: 'CREATE',
    actor_employee_id: employeeId,
    actor_name: emp.name,
    actor_email: email,
    occurred_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, id: row.id, documentId: row.document_id });
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return p.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return p.email;
  }
  return null;
}
