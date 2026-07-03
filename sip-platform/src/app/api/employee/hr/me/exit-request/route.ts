/**
 * Employee-self exit-request endpoints.
 *
 * POST /api/employee/hr/me/exit-request
 *   Employee initiates resignation.
 *   Body:
 *     { resignation_date, intended_lwd, reason_primary, reason_secondary?,
 *       notes?, last_working_day_proposed }
 *   Creates hr_separation row (status='draft', initiated_by='employee_self'),
 *   seeds checklist, fires a best-effort email notification to HR + manager.
 *
 * GET /api/employee/hr/me/exit-request
 *   Returns the employee's active separation if any (else { row: null }).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { EXIT_CHECKLIST_TEMPLATE } from '@/data/hr/exit-checklist-template';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const ACTIVE_STATUSES = [
  'draft', 'manager_review', 'notice_active',
  'clearance_pending', 'fnf_pending', 'fnf_approved',
];

async function getEmployeeRow(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { error: 'Unauthenticated', status: 401 as const, actor: null, emp: null };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { error: 'Invalid session', status: 401 as const, actor: null, emp: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured', status: 503 as const, actor, emp: null };
  const { data: emp } = await supabase
    .from('hr_employees')
    .select(`
      id, employee_code, full_name, email, entity, status,
      notice_period_days_contractual, employment_type, line_manager_email
    `)
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();
  if (!emp) {
    return { error: 'No employee record found for current user', status: 404 as const, actor, emp: null };
  }
  return { error: null as null, status: 200 as const, actor, emp };
}

async function bestEffortNotifyHr(subject: string, body: string) {
  // Best-effort: surface the alert as a console log on Vercel. Wire to Resend
  // helper once it lands in @/lib/email/notify. We never want this to break
  // the actual exit-request flow.
  try {
    console.log('[HR_ALERT]', subject, '\n', body);
  } catch { /* ignore */ }
}

export async function GET(req: NextRequest) {
  const ctxAuth = await getEmployeeRow(req);
  if (ctxAuth.error || !ctxAuth.emp) {
    return NextResponse.json({ error: ctxAuth.error ?? 'No employee' }, { status: ctxAuth.status });
  }
  const emp = ctxAuth.emp;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('hr_separation')
    .select('*')
    .eq('employee_id', emp.id)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ row: data ?? null });
}

export async function POST(req: NextRequest) {
  const ctxAuth = await getEmployeeRow(req);
  if (ctxAuth.error || !ctxAuth.emp) {
    return NextResponse.json({ error: ctxAuth.error ?? 'No employee' }, { status: ctxAuth.status });
  }
  const emp = ctxAuth.emp;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    resignation_date,
    intended_lwd,
    reason_primary,
    reason_secondary,
    notes,
    last_working_day_proposed,
  } = body as {
    resignation_date?: string;
    intended_lwd?: string;
    reason_primary?: string;
    reason_secondary?: string;
    notes?: string;
    last_working_day_proposed?: string;
  };

  if (!resignation_date || !reason_primary) {
    return NextResponse.json(
      { error: 'resignation_date and reason_primary required' },
      { status: 400 },
    );
  }

  // Already an active case?
  const { data: existing } = await supabase
    .from('hr_separation')
    .select('id, case_code, status')
    .eq('employee_id', emp.id)
    .in('status', ACTIVE_STATUSES)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      {
        error: `You already have an active exit case (${existing.case_code}, status=${existing.status}).`,
        existing_case_id: existing.id,
      },
      { status: 409 },
    );
  }

  const entity = emp.entity || 'TAS';
  const year = new Date(resignation_date).getUTCFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const { count: yearCount } = await supabase
    .from('hr_separation')
    .select('id', { count: 'exact', head: true })
    .gte('intent_date', yearStart)
    .lte('intent_date', yearEnd);
  const seq = String((yearCount ?? 0) + 1).padStart(4, '0');
  const case_code = `SEP-${entity}-${year}-${seq}`;

  const insertRow = {
    case_code,
    employee_id: emp.id,
    separation_type: 'resignation',
    reason_category: reason_primary,
    reason_notes: [reason_secondary, notes].filter(Boolean).join('\n') || null,
    intent_date: resignation_date,
    requested_lwd: intended_lwd ?? last_working_day_proposed ?? null,
    notice_period_days_contractual: emp.notice_period_days_contractual ?? 60,
    notice_period_days_served: 0,
    notice_period_days_waived: 0,
    status: 'draft',
    initiated_by: 'employee_self',
    initiated_at: new Date().toISOString(),
  };

  const { data: sep, error: insErr } = await supabase
    .from('hr_separation').insert(insertRow).select('*').single();
  if (insErr || !sep) {
    if (insErr?.code === '23505') {
      return NextResponse.json(
        { error: 'You already have an active exit case (race).' },
        { status: 409 },
      );
    }
    if (insErr) console.error('[Exit request insert]', insErr.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Seed checklist (best-effort)
  const checklistRows = EXIT_CHECKLIST_TEMPLATE.map(item => ({
    separation_id: sep.id,
    category: item.category,
    item_label: item.item_label,
    item_order: item.item_order,
    status: 'pending',
    required: item.required,
  }));
  await supabase.from('hr_separation_checklist').insert(checklistRows);

  // Move employee to on_notice
  await supabase.from('hr_employees').update({ status: 'on_notice' }).eq('id', emp.id);

  // Best-effort notification
  void bestEffortNotifyHr(
    `Resignation submitted: ${emp.full_name} (${case_code})`,
    `${emp.full_name} (${emp.employee_code}) has submitted a resignation.\n` +
    `Case: ${case_code}\nResignation date: ${resignation_date}\nProposed LWD: ${insertRow.requested_lwd ?? '(unset)'}\n` +
    `Primary reason: ${reason_primary}\nNotes: ${notes ?? '(none)'}\n` +
    `Line manager: ${emp.line_manager_email ?? '(unknown)'}`,
  );

  return NextResponse.json({ row: sep, case_code });
}
