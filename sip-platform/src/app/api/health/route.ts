/**
 * Platform Health Check — Live Diagnosis
 *
 * GET /api/health
 *
 * Returns the current state of:
 *   - Every required env var (set / missing / malformed)
 *   - Supabase admin client connectivity (can we actually hit the DB?)
 *   - Database — can we run a trivial SELECT?
 *
 * Why this exists: when something silently breaks in production (the
 * canonical example: env var with a trailing \n), this endpoint
 * surfaces the exact diagnosis in 2 seconds instead of an hour of
 * digging.
 *
 * Auth: admin or employee JWT required. We don't expose env state
 * publicly — even with names-only it would tell a probe-attacker which
 * features are off.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  envSnapshot,
  validateServerEnv,
} from '@/lib/config/required-env';

export async function GET() {
  // ── Auth ─────────────────────────────────────────────────────
  const cookieStore = await cookies();
  let authenticated = false;
  let actorEmail: string | null = null;

  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      authenticated = true;
      actorEmail = payload.email;
    }
  }
  if (!authenticated) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload) {
        authenticated = true;
        actorEmail = payload.email;
      }
    }
  }
  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Env validation ───────────────────────────────────────────
  const envResult = validateServerEnv();
  const envRows = envSnapshot();

  // ── DB connectivity probe ────────────────────────────────────
  // Try a cheap SELECT — if this fails, the URL/key is wrong.
  const dbProbe = await probeDatabase();

  // ── Build aggregate health ───────────────────────────────────
  const ok = envResult.ok && dbProbe.ok;
  const httpStatus = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      checkedBy: actorEmail,
      summary: ok
        ? '✓ All systems operational.'
        : `✗ ${envResult.summary} ${dbProbe.ok ? '' : 'Database unreachable.'}`.trim(),
      env: {
        ok: envResult.ok,
        summary: envResult.summary,
        criticalMissing: envResult.critical_missing,
        criticalMalformed: envResult.critical_malformed,
        nonCriticalMissing: envResult.non_critical_missing,
        nonCriticalMalformed: envResult.non_critical_malformed,
        vars: envRows,
      },
      db: dbProbe,
    },
    { status: httpStatus }
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function probeDatabase(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
  employeeRowCount?: number;
}> {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        ok: false,
        error:
          'getSupabaseAdmin() returned null — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.',
      };
    }
    // Cheapest possible read — count of one tiny table
    const { count, error } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true });
    const latencyMs = Date.now() - start;
    if (error) {
      return { ok: false, latencyMs, error: error.message };
    }
    return { ok: true, latencyMs, employeeRowCount: count ?? 0 };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
