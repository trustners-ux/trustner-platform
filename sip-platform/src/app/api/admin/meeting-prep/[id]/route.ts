/**
 * Meeting Prep — Get / Update single brief
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('mp_meeting_briefs')
    .select(
      `*,
       uploader:employees!mp_meeting_briefs_uploaded_by_employee_id_fkey(name, email),
       reviewer:employees!mp_meeting_briefs_current_reviewer_employee_id_fkey(name, email),
       approver:employees!mp_meeting_briefs_approved_by_employee_id_fkey(name, email),
       action_items:mp_action_items(*),
       talking_points:mp_talking_points(*),
       opportunities:mp_opportunities(*),
       qa:mp_anticipated_qa(*)`
    )
    .eq('id', numericId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  return NextResponse.json({ brief: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  // Whitelist editable scalar fields
  const editable: Record<string, string> = {
    meetingScheduledAt: 'meeting_scheduled_at',
    meetingDurationMinutes: 'meeting_duration_minutes',
    meetingFormat: 'meeting_format',
    meetingPurpose: 'meeting_purpose',
    customPurposeNote: 'custom_purpose_note',
    meetingLocation: 'meeting_location',
    clientSinceDate: 'client_since_date',
    yearsWithTrustner: 'years_with_trustner',
    lastMeetingDate: 'last_meeting_date',
    lastMeetingPurpose: 'last_meeting_purpose',
    relationshipQualityScore: 'relationship_quality_score',
    relationshipNotes: 'relationship_notes',
    totalAumInr: 'total_aum_inr',
    totalInvestedInr: 'total_invested_inr',
    unrealisedGainInr: 'unrealised_gain_inr',
    familyXirrPct: 'family_xirr_pct',
    numHoldings: 'num_holdings',
    numActiveSips: 'num_active_sips',
    monthlySipFlowInr: 'monthly_sip_flow_inr',
  };

  const update: Record<string, unknown> = {};
  for (const [k, dbCol] of Object.entries(editable)) {
    if (body[k] !== undefined) update[dbCol] = body[k];
  }

  // ── Sub-tables: replace-all on each update ──

  // Action items
  if (Array.isArray(body.actionItems)) {
    const items = body.actionItems as Array<{
      description: string;
      owner: 'Client' | 'RM' | 'Both';
      status: 'Open' | 'In Progress' | 'Blocked' | 'Completed';
      dueDate?: string;
      notes?: string;
    }>;
    const { data: existing } = await supabase
      .from('mp_meeting_briefs')
      .select('family_id')
      .eq('id', numericId)
      .maybeSingle();
    const familyId = existing?.family_id as number | undefined;

    await supabase.from('mp_action_items').delete().eq('brief_id', numericId);
    if (items.length > 0 && familyId) {
      await supabase.from('mp_action_items').insert(
        items.map((i) => ({
          brief_id: numericId,
          family_id: familyId,
          description: i.description,
          owner: i.owner,
          status: i.status,
          due_date: i.dueDate ?? null,
          notes: i.notes ?? null,
        }))
      );
    }
  }

  // Talking points
  if (Array.isArray(body.talkingPoints)) {
    const points = body.talkingPoints as Array<{
      orderIndex: number;
      topic: string;
      keyMessage: string;
      supportingData?: string;
    }>;
    await supabase.from('mp_talking_points').delete().eq('brief_id', numericId);
    if (points.length > 0) {
      await supabase.from('mp_talking_points').insert(
        points.map((p, idx) => ({
          brief_id: numericId,
          order_index: p.orderIndex ?? idx + 1,
          topic: p.topic,
          key_message: p.keyMessage,
          supporting_data: p.supportingData ?? null,
        }))
      );
    }
  }

  // Opportunities (cross-sell / upsell ideas)
  if (Array.isArray(body.opportunities)) {
    const opps = body.opportunities as Array<{
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
      estimatedAmountInr?: number;
    }>;
    await supabase.from('mp_opportunities').delete().eq('brief_id', numericId);
    if (opps.length > 0) {
      await supabase.from('mp_opportunities').insert(
        opps.map((o) => ({
          brief_id: numericId,
          title: o.title,
          description: o.description,
          priority: o.priority,
          estimated_amount_inr: o.estimatedAmountInr ?? null,
        }))
      );
    }
  }

  // Q&A
  if (Array.isArray(body.qa)) {
    const qaItems = body.qa as Array<{
      question: string;
      anticipatedAnswer: string;
      sensitivity?: 'Low' | 'Medium' | 'High';
    }>;
    await supabase.from('mp_anticipated_qa').delete().eq('brief_id', numericId);
    if (qaItems.length > 0) {
      await supabase.from('mp_anticipated_qa').insert(
        qaItems.map((q) => ({
          brief_id: numericId,
          question: q.question,
          anticipated_answer: q.anticipatedAnswer,
          sensitivity: q.sensitivity ?? 'Medium',
        }))
      );
    }
  }

  if (
    Object.keys(update).length === 0 &&
    !body.actionItems &&
    !body.talkingPoints &&
    !body.opportunities &&
    !body.qa
  ) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('mp_meeting_briefs')
    .update(update)
    .eq('id', numericId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
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
