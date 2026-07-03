/**
 * Onboarding admin endpoints (HR only — requires can_access_onboarding).
 *
 * GET  /api/employee/hr/onboarding              — list onboarding records
 * POST /api/employee/hr/onboarding              — create invite (+ send WhatsApp)
 * PATCH /api/employee/hr/onboarding             — HR action: approve / reject / request changes
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { generateOnboardingToken } from '@/lib/hr/onboarding-tokens';
import { sendWhatsAppText } from '@/lib/messaging/whatsapp';
import { decryptPii } from '@/lib/security/pii-crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_onboarding ? actor : null;
}

export async function GET(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('hr_onboarding')
    .select('id, token, entity, candidate_name, email, phone, designation, status, date_of_joining, employment_type, probation_months, created_at, reviewed_by, reviewed_at, employee_id')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { entity, candidate_name, email, phone, designation, department, office_code, date_of_joining, employment_type, probation_months } = body;
  if (!entity || !candidate_name || !email) {
    return NextResponse.json({ error: 'entity, candidate_name, email required' }, { status: 400 });
  }
  // Validate employment_type (matches the CHECK constraint added in migration 023)
  const validTypes = ['permanent', 'fixed_term', 'intern', 'consultant'] as const;
  const empType = validTypes.includes(employment_type) ? employment_type : 'permanent';
  // Probation only meaningful for permanent + fixed_term; 0 for intern/consultant.
  const probMonths = (empType === 'intern' || empType === 'consultant')
    ? 0
    : Math.max(0, Math.min(24, Number(probation_months ?? 6)));

  const token = generateOnboardingToken();
  const { data, error } = await supabase
    .from('hr_onboarding')
    .insert({
      token, entity, candidate_name, email,
      phone: phone || null,
      designation: designation || null,
      department: department || null,
      office_code: office_code || null,
      date_of_joining: date_of_joining || null,
      employment_type: empType,
      probation_months: probMonths,
      created_by: actor.email,
    })
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Try sending WhatsApp invite (best-effort)
  if (phone) {
    const link = `https://www.merasip.com/onboarding/${token}`;
    const msg =
      `Hi ${candidate_name},\n\n` +
      `Welcome to Trustner Group! Please complete your onboarding by uploading the required documents at:\n\n${link}\n\n` +
      `This link is valid for 30 days. Please complete it before your date of joining.\n\n` +
      `_Trustner Asset Services · ARN-286886_`;
    sendWhatsAppText(phone, msg).catch(() => undefined);
  }

  return NextResponse.json({ onboarding: data, link: `https://www.merasip.com/onboarding/${token}` });
}

export async function PATCH(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action, note } = body as { id?: number; action?: 'approve' | 'reject' | 'request_changes'; note?: string };
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const { data: existing } = await supabase
    .from('hr_onboarding')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });

  let update: Record<string, unknown> = {
    reviewed_by: actor.email,
    reviewed_at: new Date().toISOString(),
  };
  let createdEmployeeId: number | null = null;

  if (action === 'approve') {
    // Auto-generate employee_code: <ENT>-<5-digit-seq>
    const { data: lastEmp } = await supabase
      .from('hr_employees')
      .select('employee_code')
      .like('employee_code', `${existing.entity}-%`)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextSeq = 1;
    if (lastEmp?.employee_code) {
      const m = lastEmp.employee_code.match(/(\d+)$/);
      if (m) nextSeq = parseInt(m[1], 10) + 1;
    }
    const employee_code = `${existing.entity}-${String(nextSeq).padStart(5, '0')}`;

    // Split candidate_name → first_name + last_name
    const parts = String(existing.candidate_name || '').trim().split(/\s+/);
    const first_name = parts[0] || 'Unknown';
    const last_name = parts.slice(1).join(' ') || '—';

    // Probation lifecycle defaults
    const empType = (existing.employment_type || 'permanent') as
      'permanent' | 'fixed_term' | 'intern' | 'consultant';
    const isProbationable = empType === 'permanent' || empType === 'fixed_term';
    const probMonths = isProbationable ? (existing.probation_months ?? 6) : 0;
    let probationEndDate: string | null = null;
    if (isProbationable && existing.date_of_joining && probMonths > 0) {
      const doj = new Date(existing.date_of_joining);
      doj.setMonth(doj.getMonth() + probMonths);
      probationEndDate = doj.toISOString().slice(0, 10);
    }
    const employmentStatus = isProbationable && probMonths > 0 ? 'probation' : 'confirmed';
    const confirmationDate = !isProbationable ? existing.date_of_joining : null;

    // ── Carry the full self-filled intake into the employee master ──
    // (Before migration 048 these all landed NULL; now the candidate's portal
    //  data becomes the system of record so HR never re-keys it.)
    const street = (l1?: string | null, l2?: string | null) =>
      [l1, l2].filter((x) => x && String(x).trim()).join(', ') || null;
    const fullAddr = (l1?: string | null, l2?: string | null, city?: string | null, state?: string | null, pin?: string | null) =>
      [street(l1, l2), [city, state].filter(Boolean).join(', '), pin].filter((x) => x && String(x).trim()).join('\n') || null;

    // Permanent address resolves "same as current" before persisting.
    const permSame = existing.perm_same === true;
    const permanentAddress = permSame
      ? fullAddr(existing.curr_address_line1, existing.curr_address_line2, existing.curr_city, existing.curr_state, existing.curr_pin)
      : fullAddr(existing.perm_address_line1, existing.perm_address_line2, existing.perm_city, existing.perm_state, existing.perm_pin);

    const rawAadhaar = decryptPii(existing.aadhaar);
    const aadhaarLast4 = rawAadhaar ? String(rawAadhaar).replace(/\D/g, '').slice(-4) || null : null;

    const { data: emp, error: empErr } = await supabase
      .from('hr_employees')
      .insert({
        employee_code,
        entity: existing.entity,
        first_name,
        last_name,
        email: existing.email,
        phone: existing.phone,
        designation: existing.designation,
        department: existing.department,
        office_code: existing.office_code,
        date_of_joining: existing.date_of_joining,
        // Contract shape — drives gratuity / notice / leave rule branching.
        employment_type: empType,
        // Lifecycle stage — drives leave entitlement gating + UI banners.
        employment_status: employmentStatus,
        probation_months: probMonths,
        probation_end_date: probationEndDate,
        confirmation_date: confirmationDate,
        status: 'new',
        // Personal (from candidate intake)
        parent_spouse_name: existing.father_spouse_name || null,
        dob: existing.dob || null,
        gender: existing.gender || null,
        marital_status: existing.marital_status || null,
        blood_group: existing.blood_group || null,
        whatsapp: existing.whatsapp || null,
        reporting_manager_name: existing.reporting_manager || null,
        // KYC (full PAN; only last-4 of Aadhaar persisted at rest per DPDP)
        pan: existing.pan || null,
        aadhaar_last4: aadhaarLast4,
        // Address (current street → current_address; city/state/pin to dedicated cols;
        //  full permanent address composed into permanent_address)
        current_address: street(existing.curr_address_line1, existing.curr_address_line2),
        city: existing.curr_city || null,
        state: existing.curr_state || null,
        pin: existing.curr_pin || null,
        permanent_address: permanentAddress,
        // Bank
        bank_name: existing.bank_name || null,
        bank_branch: existing.bank_branch || null,
        account_number_encrypted: decryptPii(existing.account_number) || null,
        ifsc: existing.ifsc || null,
        account_type: existing.account_type || null,
        // History (JSONB)
        education: existing.education ?? [],
        employment: existing.employment ?? [],
        emergency_contacts: existing.emergency_contacts ?? [],
      })
      .select('id')
      .single();
    if (empErr) {
      console.error('[Onboarding:approve]', empErr.message);
      return NextResponse.json({ error: 'Could not create employee record' }, { status: 500 });
    }
    createdEmployeeId = emp.id;
    update = { ...update, status: 'approved', employee_id: emp.id };
  } else if (action === 'reject') {
    update = { ...update, status: 'rejected', rejection_reason: note || 'Rejected by HR' };
  } else if (action === 'request_changes') {
    update = { ...update, status: 'changes_requested', changes_requested_note: note || 'Please re-upload requested documents.' };
  }

  const { data: updated, error } = await supabase
    .from('hr_onboarding')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ onboarding: updated, employee_id: createdEmployeeId });
}
