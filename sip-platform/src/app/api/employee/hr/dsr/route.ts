/**
 * DSR (Daily Sales Report) API.
 *
 * GET   /api/employee/hr/dsr?scope=mine&days=14    — my last N days
 * GET   /api/employee/hr/dsr?scope=team&date=YYYY-MM-DD — manager team view
 * GET   /api/employee/hr/dsr?scope=audit            — HR/CEO audit view
 * POST  /api/employee/hr/dsr                        — submit today's DSR
 * PATCH /api/employee/hr/dsr                        — manager review
 *
 * Submission is allowed up to the day's EOD deadline. After that, an entry
 * is permitted but marked is_late=true and the manager must justify why
 * to avoid LOP via the misses cron.
 *
 * The integrity clause (Handbook §15): self-certification field is
 * mandatory — every submission asserts the data is genuine and will not
 * be padded/fabricated.
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

const CERT_TEXT =
  'I certify that all business entries, leads, pipeline data, and MIS submissions in this DSR ' +
  'are true, accurate, and reflective of actual customer interactions. I am not aware of any ' +
  'entry that is non-genuine, padded, fabricated, or otherwise misrepresentative. I understand ' +
  'that any false reporting shall constitute misconduct under the Confidentiality & Employment ' +
  'Agreement and the Handbook (§15).';

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') || 'mine';
  const days = Math.min(60, parseInt(url.searchParams.get('days') || '14', 10));

  if (scope === 'mine') {
    const { data: emp } = await supabase
      .from('hr_employees').select('id, grade_band, entity').eq('email', actor.email.toLowerCase()).maybeSingle();
    if (!emp) return NextResponse.json({ entries: [], required: false });

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from('hr_dsr_entries')
      .select('*')
      .eq('employee_id', emp.id)
      .gte('entry_date', since.toISOString().slice(0, 10))
      .order('entry_date', { ascending: false });

    // Look up DSR requirement
    const { data: settings } = await supabase
      .from('hr_dsr_settings').select('required_for_grades, eod_deadline')
      .or(`entity.is.null,entity.eq.${emp.entity}`)
      .limit(1).maybeSingle();
    const required = settings?.required_for_grades?.includes(emp.grade_band || '') ?? false;

    return NextResponse.json({
      entries: data ?? [],
      required,
      eod_deadline: settings?.eod_deadline,
      certification_text: CERT_TEXT,
    });
  }

  if (scope === 'team' || scope === 'audit') {
    const perms = await getEffectivePermissions(actor.email, actor.role);
    const isAuthorized = perms.can_view_team_data || perms.can_access_reports || perms.can_access_employees;
    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('hr_dsr_entries')
      .select('*, hr_employees(employee_code, full_name, designation, grade_band, entity, office_code)')
      .eq('entry_date', date)
      .order('submitted_at', { ascending: false });
    return NextResponse.json({ entries: data ?? [], date });
  }

  return NextResponse.json({ error: 'Unknown scope' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: emp } = await supabase
    .from('hr_employees').select('id, entity, grade_band')
    .eq('email', actor.email.toLowerCase()).maybeSingle();
  if (!emp) return NextResponse.json({ error: 'No employee record' }, { status: 400 });

  const body = await req.json();
  if (!body.certified_genuine) {
    return NextResponse.json({ error: 'You must certify the data is genuine to submit.' }, { status: 400 });
  }

  // Determine if this submission is past EOD
  const { data: settings } = await supabase
    .from('hr_dsr_settings').select('eod_deadline')
    .or(`entity.is.null,entity.eq.${emp.entity}`).limit(1).maybeSingle();
  const eodTime = settings?.eod_deadline || '20:00:00';
  const now = new Date();
  const todayEOD = new Date();
  const [hh, mm] = String(eodTime).split(':').map(Number);
  todayEOD.setHours(hh, mm, 0, 0);
  const entry_date = body.entry_date || now.toISOString().slice(0, 10);
  const isToday = entry_date === now.toISOString().slice(0, 10);
  const isLate = isToday && now > todayEOD;

  const xff = req.headers.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0].trim() : null;

  const payload = {
    employee_id: emp.id,
    entry_date,
    meetings_planned: Number(body.meetings_planned) || 0,
    meetings_done: Number(body.meetings_done) || 0,
    calls_made: Number(body.calls_made) || 0,
    new_leads_added: Number(body.new_leads_added) || 0,
    business_proposed_inr: Number(body.business_proposed_inr) || 0,
    business_booked_inr: Number(body.business_booked_inr) || 0,
    premium_collected_inr: Number(body.premium_collected_inr) || 0,
    aum_added_inr: Number(body.aum_added_inr) || 0,
    highlights: body.highlights || null,
    obstacles: body.obstacles || null,
    tomorrow_plan: body.tomorrow_plan || null,
    certified_genuine: true,
    certification_text: CERT_TEXT,
    is_late: isLate,
    submitted_at: now.toISOString(),
    submitted_ip: ip,
    submitted_user_agent: req.headers.get('user-agent'),
    status: 'submitted',
  };

  const { data, error } = await supabase
    .from('hr_dsr_entries')
    .upsert(payload, { onConflict: 'employee_id,entry_date' })
    .select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If a miss was previously recorded for this date, mark it resolved.
  await supabase
    .from('hr_dsr_misses')
    .update({ status: 'resolved', resolved_at: now.toISOString(), resolved_by: actor.email })
    .eq('employee_id', emp.id)
    .eq('miss_date', entry_date)
    .eq('status', 'pending');

  return NextResponse.json({ entry: data, is_late: isLate });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_view_team_data && !perms.can_access_employees) {
    return NextResponse.json({ error: 'Only managers / HR can review DSR' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action, notes } = body as { id?: number; action?: 'review' | 'flag' | 'reject'; notes?: string };
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const status = action === 'review' ? 'reviewed' : action === 'flag' ? 'flagged' : 'rejected';
  const { data, error } = await supabase
    .from('hr_dsr_entries')
    .update({
      status,
      manager_reviewed_by: actor.email,
      manager_reviewed_at: new Date().toISOString(),
      manager_notes: notes || null,
    })
    .eq('id', id)
    .select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
