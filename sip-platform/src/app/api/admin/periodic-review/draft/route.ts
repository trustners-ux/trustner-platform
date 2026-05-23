/**
 * Periodic Review — Create Draft
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { computePeriodWindow } from '@/lib/periodic-review/types';
import type { ReviewCadence } from '@/lib/periodic-review/types';

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
    cadence: ReviewCadence;
    reviewPeriodEnd?: string;
  } | null;

  if (!body || !body.familyId || !body.familyName || !body.cadence) {
    return NextResponse.json(
      { error: 'Missing required fields: familyId, familyName, cadence' },
      { status: 400 }
    );
  }

  const endDate = body.reviewPeriodEnd ? new Date(body.reviewPeriodEnd) : new Date();
  const window = computePeriodWindow(body.cadence, endDate);

  const documentId = `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: row, error } = await supabase
    .from('pr_periodic_reviews')
    .insert({
      document_id: documentId,
      family_id: body.familyId,
      family_name: body.familyName,
      methodology_version: '1.0.0',
      status: 'DRAFT',
      uploaded_by_employee_id: employeeId,
      cadence: body.cadence,
      review_period_start: window.start,
      review_period_end: window.end,
      num_active_goals: 0,
      num_goals_on_track: 0,
      num_goals_behind: 0,
      num_action_items_completed: 0,
      num_action_items_new: 0,
      num_action_items_pending: 0,
    })
    .select('id, document_id')
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create draft' }, { status: 500 });
  }

  await supabase.from('pd_workflow_events').insert({
    entity_type: 'periodic_review',
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
