/**
 * Fund Search — lightweight autocomplete endpoint used by the
 * Preferred Swaps form to pick funds by partial scheme name.
 *
 * GET ?q=<query> → up to 20 matching funds from pd_fund_master
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  let ok = false;
  if (adminToken && (await verifyToken(adminToken))) ok = true;
  if (!ok && empToken && (await verifyEmployeeToken(empToken))) ok = true;
  if (!ok) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ rows: [] });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { data, error } = await supabase
    .from('pd_fund_master')
    .select('amfi_code, scheme_name, amc_name, category, cagr_3y, trustner_preferred')
    .ilike('scheme_name', `%${q}%`)
    .order('trustner_preferred', { ascending: false })
    .order('cagr_3y', { ascending: false, nullsFirst: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
