import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { FALLBACK_OFFICES } from '@/lib/hr/offices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!await verifyEmployeeToken(tok)) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ offices: FALLBACK_OFFICES });

  const { data, error } = await supabase
    .from('hr_offices')
    .select('code, name, city, state, entity, is_active')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data || data.length === 0) {
    // Fall back to in-code list if migration 019 hasn't run yet
    return NextResponse.json({ offices: FALLBACK_OFFICES, fallback: true });
  }

  const offices = data.map((o) => ({
    code: o.code,
    name: o.name,
    city: o.city,
    state: o.state,
    shortLabel: `${o.city} (${o.name.replace('Office', '').replace(/Head|Corporate|Regional|Branch/, (m: string) => m[0]).trim()})`,
  }));

  return NextResponse.json({ offices });
}
