/**
 * Employee Master API.
 *
 * GET    /api/employee/hr/employees?q=&entity=&status=&page=&pageSize=
 * POST   /api/employee/hr/employees                  (create)
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

const EMPLOYEE_FIELDS = [
  'id','employee_code','entity','first_name','last_name','full_name',
  'parent_spouse_name','dob','gender','marital_status',
  'pan','aadhaar_last4','passport_or_dl',
  'current_address','permanent_address','city','state','pin',
  'bank_branch','ifsc',
  'designation','department','grade_band','reporting_manager_name',
  'location','office_code','date_of_joining',
  'status','exit_date',
  'basic_monthly','hra_monthly','special_allowance_monthly','pf_monthly',
  'variable_pay_monthly','total_ctc_monthly',
  'email','phone',
  'created_at','updated_at',
].join(',');

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_employees) {
    return NextResponse.json({ error: 'Need can_access_employees permission' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const entity = url.searchParams.get('entity');
  const status = url.searchParams.get('status');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize') || '50', 10));

  let query = supabase
    .from('hr_employees')
    .select(EMPLOYEE_FIELDS, { count: 'exact' })
    .order('full_name');

  if (entity) query = query.eq('entity', entity);
  if (status) query = query.eq('status', status);
  if (q) query = query.or(`full_name.ilike.%${q}%,employee_code.ilike.%${q}%,email.ilike.%${q}%,pan.ilike.%${q}%`);

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_employees) {
    return NextResponse.json({ error: 'Need can_access_employees permission' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { employee_code, entity, first_name, last_name } = body;
  if (!employee_code || !entity || !first_name || !last_name) {
    return NextResponse.json(
      { error: 'employee_code, entity, first_name, last_name required' },
      { status: 400 }
    );
  }

  // Strip any client-supplied id / timestamps / computed cols
  const { id: _id, full_name: _fn, total_ctc_monthly: _tc, created_at: _ca, updated_at: _ua, ...payload } = body;
  void _id; void _fn; void _tc; void _ca; void _ua;

  const { data, error } = await supabase
    .from('hr_employees')
    .insert(payload)
    .select(EMPLOYEE_FIELDS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}
