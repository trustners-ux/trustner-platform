/**
 * Portfolio Diagnostic — Scoring Runner (route)
 *
 * POST /api/admin/portfolio-diagnostic/[id]/score
 *
 * Thin authenticated wrapper around `scoreDiagnostic()` (score-runner.ts) —
 * the full pipeline lives there so the route and offline tooling share
 * IDENTICAL logic. Accepts an optional `{ riskProfile }` body to correct the
 * client's profile before scoring (edit-from-review); a plain re-score sends
 * no body.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { scoreDiagnostic, type RiskProfileInput } from '@/lib/portfolio-diagnostic/score-runner';
import { isPdRunInScope } from '@/lib/portfolio-diagnostic/run-scope';

// Large family runs (30+ holdings) fetch rolling returns per fund; headroom to
// the Vercel Pro ceiling so a big book scores without a gateway timeout (504).
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const diagnosticRunId = parseInt(id, 10);

  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // PRIVACY GATE (audit P0-4) — only re-score runs within the actor's scope.
  if (!(await isPdRunInScope(supabase, diagnosticRunId, { employeeEmail: email }))) {
    return NextResponse.json(
      { error: 'You do not have access to this diagnostic — it belongs to another relationship manager.' },
      { status: 403 }
    );
  }

  // Optional updated risk profile (edit-from-review). A plain re-score sends no body.
  let riskProfile: RiskProfileInput | null = null;
  try {
    const body = await request.json();
    if (body?.riskProfile && typeof body.riskProfile === 'object') riskProfile = body.riskProfile as RiskProfileInput;
  } catch { /* no body / not JSON — a plain re-score */ }

  const result = await scoreDiagnostic(supabase, diagnosticRunId, { riskProfile, actorEmail: email });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Scoring failed' }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    scored: result.scored,
    skipped: result.skipped,
    skipReasons: result.skipReasons,
    verdictCounts: result.verdictCounts,
  });
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}
