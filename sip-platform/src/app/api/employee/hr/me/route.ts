/**
 * GET /api/employee/hr/me
 * Returns the full ESS bundle for the signed-in actor:
 *   - profile          : their hr_employees row
 *   - office           : their office's display info
 *   - leave_balances   : current FY balances
 *   - pending_acks     : policies requiring acknowledgement that they haven't signed yet
 *   - recent_payslips  : last 6 months of slips
 *   - my_letters       : last 10 letters generated for them
 *   - my_documents     : HR-uploaded personal docs (hr_documents)
 *
 * One round-trip so the personal dashboard renders without a fetch waterfall.
 *
 * PUT /api/employee/hr/me
 * Allows the actor to update a SHORTLIST of fields on their own record:
 *   current_address, permanent_address, phone, emergency contact (notes)
 * Everything else (designation/grade/comp/etc.) requires HR.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

const CURRENT_FY = (() => {
  const now = new Date();
  const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `FY${fyYear}`;
})();

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // 1. Profile
  const { data: profile } = await supabase
    .from('hr_employees')
    .select('id, employee_code, entity, full_name, first_name, last_name, designation, department, grade_band, office_code, location, date_of_joining, email, phone, status, pan, aadhaar_last4, bank_branch, ifsc, current_address, permanent_address, city, state, pin, dob, gender, marital_status, reporting_manager_name')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();

  if (!profile) {
    // Employee record doesn't exist yet — return a stub so the dashboard
    // can render an "Ask HR to onboard you" prompt instead of crashing.
    return NextResponse.json({
      profile: null,
      auth_email: actor.email,
      note: 'No employee record on file yet. HR will onboard you shortly.',
    });
  }

  // 2. Office display info
  let office: { code: string; name: string; city: string; state: string } | null = null;
  if (profile.office_code) {
    const { data: o } = await supabase
      .from('hr_offices')
      .select('code, name, city, state')
      .eq('code', profile.office_code)
      .maybeSingle();
    office = o ?? null;
  }

  // 3. Leave balances
  const { data: leave_balances } = await supabase
    .from('hr_leave_balances')
    .select('credited, carried_forward, used, available, fy, hr_leave_types(code, name)')
    .eq('employee_id', profile.id)
    .eq('fy', CURRENT_FY);

  // 4. Pending policy acknowledgements
  // Find policies needing ack that this employee hasn't signed (for current version).
  const { data: requiresAck } = await supabase
    .from('hr_policies')
    .select('id, title, version, category, doc_code, blob_url, effective_date')
    .eq('status', 'active')
    .eq('requires_acknowledgement', true);
  const { data: myAcks } = await supabase
    .from('hr_policy_acknowledgements')
    .select('policy_id, policy_version')
    .eq('employee_id', profile.id);
  const signedSet = new Set(
    (myAcks || []).map((a) => `${a.policy_id}::${a.policy_version}`)
  );
  const pending_acks = (requiresAck || []).filter(
    (p) => !signedSet.has(`${p.id}::${p.version}`)
  );

  // 5. Recent payslips (last 6 months across all runs)
  const { data: recent_payslips } = await supabase
    .from('hr_salary_slips')
    .select('id, gross, net_pay, total_deductions, paid_days, lop_days, status, hr_salary_runs(pay_month, entity)')
    .eq('employee_id', profile.id)
    .order('id', { ascending: false })
    .limit(6);

  // 6. My letters
  const { data: my_letters } = await supabase
    .from('hr_letter_archive')
    .select('id, letter_type, entity, serial_number, status, generated_at')
    .eq('employee_id', profile.id)
    .order('generated_at', { ascending: false })
    .limit(10);

  // 7. My uploaded HR documents
  const { data: my_documents } = await supabase
    .from('hr_documents')
    .select('id, category, filename, blob_url, status, created_at')
    .eq('employee_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    profile,
    office,
    leave_balances: leave_balances ?? [],
    pending_acks,
    recent_payslips: recent_payslips ?? [],
    my_letters: my_letters ?? [],
    my_documents: my_documents ?? [],
    fy: CURRENT_FY,
  });
}

const SELF_EDITABLE = new Set([
  'current_address',
  'permanent_address',
  'city',
  'state',
  'pin',
  'phone',
  'marital_status',
]);

export async function PUT(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: profile } = await supabase
    .from('hr_employees')
    .select('id')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: 'No employee record for your email' }, { status: 400 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (SELF_EDITABLE.has(k)) patch[k] = body[k];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No allowed fields in payload' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hr_employees')
    .update(patch)
    .eq('id', profile.id)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ profile: data });
}
