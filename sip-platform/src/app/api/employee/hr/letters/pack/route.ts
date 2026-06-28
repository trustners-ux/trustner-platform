/**
 * POST /api/employee/hr/letters/pack
 *   One-click joining-letter pack. Body: { employee_id, entity? }.
 *   Renders every letter in the entity's standard pack from the employee's
 *   record and saves each as a draft in hr_letter_archive. Generate-only —
 *   HR reviews, downloads (.doc) and sends. Gated by can_access_letters.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { getLetterPack } from '@/lib/hr/letter-templates';
import { recomputeComp } from '@/lib/hr/letter-fields';
import { employeeToLetterData } from '@/lib/hr/letter-prefill';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_letters ? actor : null;
}

export async function POST(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const employeeId = Number(body.employee_id);
  if (!employeeId) return NextResponse.json({ error: 'employee_id required' }, { status: 400 });

  const { data: emp, error: empErr } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('id', employeeId)
    .single();
  if (empErr || !emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const entity: 'TAS' | 'TIB' = body.entity === 'TAS' || body.entity === 'TIB'
    ? body.entity
    : (emp.entity === 'TAS' ? 'TAS' : 'TIB');

  const base = recomputeComp({ ...employeeToLetterData(emp), entity });
  const pack = getLetterPack(entity);

  const recipientName = String(base.candidate_name || emp.full_name || '');
  const rows = pack.map((tpl) => ({
    employee_id: employeeId,
    letter_type: tpl.id,
    entity,
    recipient_name: recipientName,
    data_snapshot: { ...base },
    generated_html: tpl.render({ ...base }),
    generated_by: actor.email,
    serial_number: null,
    status: 'draft' as const,
  }));

  const { data: inserted, error } = await supabase
    .from('hr_letter_archive')
    .insert(rows)
    .select('id, letter_type, entity, recipient_name, status, generated_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ created: inserted ?? [], count: inserted?.length ?? 0, entity });
}
