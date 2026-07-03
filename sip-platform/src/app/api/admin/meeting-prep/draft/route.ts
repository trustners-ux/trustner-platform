/**
 * Meeting Prep — Create Draft
 *
 * POST /api/admin/meeting-prep/draft
 *
 * Body: { familyId, familyName, meetingScheduledAt, meetingFormat,
 *         meetingPurpose, customPurposeNote?, meetingDurationMinutes?,
 *         meetingLocation? }
 *
 * Creates a new row in mp_meeting_briefs with status DRAFT. The full
 * brief content (action items, talking points, etc.) is filled in via
 * the edit page.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { writeAuditEvent } from '@/lib/trustner-agent-platform/workflow-actions';

type MeetingFormat = 'In-Person' | 'Phone' | 'Video' | 'WhatsApp';
type MeetingPurpose =
  | 'Quarterly Review'
  | 'Annual Review'
  | 'New Investment Discussion'
  | 'SIP Step-Up'
  | 'Grievance / Concern'
  | 'Onboarding Kickoff'
  | 'Retention Conversation'
  | 'Family Wealth Planning'
  | 'Other';

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
    meetingScheduledAt: string;    // ISO datetime
    meetingFormat: MeetingFormat;
    meetingPurpose: MeetingPurpose;
    customPurposeNote?: string;
    meetingDurationMinutes?: number;
    meetingLocation?: string;
  } | null;

  if (!body || !body.familyId || !body.familyName || !body.meetingScheduledAt || !body.meetingFormat || !body.meetingPurpose) {
    return NextResponse.json(
      { error: 'Missing required fields: familyId, familyName, meetingScheduledAt, meetingFormat, meetingPurpose' },
      { status: 400 }
    );
  }

  const documentId = `MP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Best-effort: pull the family's latest portfolio snapshot for the
  // "Section 2" denormalised numbers (total_aum, num_holdings, etc.).
  // If unavailable, leave NULL — the brief editor will let the RM
  // capture the data manually.
  let snapshot: Record<string, number | null> = {};
  try {
    const { data: latestRun } = await supabase
      .from('pd_diagnostic_runs')
      .select('id, current_value_inr, total_invested_inr, family_xirr_pct, num_holdings, num_active_sips, monthly_sip_flow_inr, created_at')
      .eq('family_id', body.familyId)
      .in('status', ['APPROVED', 'PUBLISHED'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestRun) {
      snapshot = {
        total_aum_inr: (latestRun.current_value_inr as number) ?? null,
        total_invested_inr: (latestRun.total_invested_inr as number) ?? null,
        family_xirr_pct: (latestRun.family_xirr_pct as number) ?? null,
        num_holdings: (latestRun.num_holdings as number) ?? null,
        num_active_sips: (latestRun.num_active_sips as number) ?? null,
        monthly_sip_flow_inr: (latestRun.monthly_sip_flow_inr as number) ?? null,
        last_diagnostic_run_id: latestRun.id as number,
      };
      if (snapshot.total_aum_inr !== null && snapshot.total_invested_inr !== null) {
        snapshot.unrealised_gain_inr = (snapshot.total_aum_inr ?? 0) - (snapshot.total_invested_inr ?? 0);
      }
    }
  } catch {
    // Snapshot is opportunistic — failure is non-fatal
  }

  const { data: row, error } = await supabase
    .from('mp_meeting_briefs')
    .insert({
      document_id: documentId,
      family_id: body.familyId,
      family_name: body.familyName,
      status: 'DRAFT',
      uploaded_by_employee_id: employeeId,
      meeting_scheduled_at: body.meetingScheduledAt,
      meeting_format: body.meetingFormat,
      meeting_purpose: body.meetingPurpose,
      custom_purpose_note: body.customPurposeNote ?? null,
      meeting_duration_minutes: body.meetingDurationMinutes ?? 60,
      meeting_location: body.meetingLocation ?? null,
      ...snapshot,
    })
    .select('id, document_id')
    .single();

  if (error || !row) {
    console.error(error?.message ?? 'Failed to create meeting-prep draft');
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }

  await writeAuditEvent({
    entityType: 'meeting_prep',
    entityId: row.id,
    fromStatus: null,
    toStatus: 'DRAFT',
    action: 'CREATE',
    actorEmployeeId: employeeId,
    actorName: emp.name,
    actorEmail: email,
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
