/**
 * GET /api/admin/portfolio-diagnostic/insights
 *
 * Admin-facing analytics for the PD: the verdict-override feedback loop (which
 * engine calls reviewers change most — the engine-tuning signal) + the latest
 * data-health snapshot. Auth: admin or employee JWT.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getOverrideInsights, getDataHealth } from '@/lib/portfolio-diagnostic/analytics';

export const dynamic = 'force-dynamic';

async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  const a = c.get(COOKIE_NAME)?.value;
  if (a && (await verifyToken(a))) return true;
  const e = c.get(EMPLOYEE_COOKIE)?.value;
  if (e && (await verifyEmployeeToken(e))) return true;
  return false;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const [overrides, dataHealth] = await Promise.all([
    getOverrideInsights(supabase),
    getDataHealth(supabase, new Date().toISOString().slice(0, 10)),
  ]);
  return NextResponse.json({ overrides, dataHealth });
}
