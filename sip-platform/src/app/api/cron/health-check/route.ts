/**
 * Weekly Health Check Cron
 *
 * Vercel cron hits this endpoint weekly. Calls /api/health internally
 * via the same code path (validateServerEnv + DB probe), then:
 *   - If everything OK: returns 200, logs to function logs.
 *   - If degraded: emails Ram + Sangeeta via Resend (if configured).
 *
 * Auth: Vercel cron sets Authorization: Bearer <CRON_SECRET>. We
 * verify this so the endpoint can't be hammered publicly.
 *
 * Schedule: every Monday 04:00 UTC (~09:30 IST) — defined in
 * vercel.json.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { validateServerEnv, envSnapshot } from '@/lib/config/required-env';

const APPROVER_RECIPIENTS = ['ram@trustner.in', 'sangeeta@trustner.in'];

export async function GET(req: NextRequest) {
  // ── Auth: Vercel cron header ──
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Env validation ──
  const envResult = validateServerEnv();

  // ── DB probe ──
  let dbOk = false;
  let dbError: string | undefined;
  let dbLatencyMs: number | undefined;
  let employeeCount: number | undefined;
  try {
    const start = Date.now();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      dbError = 'getSupabaseAdmin() returned null';
    } else {
      const { count, error } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true });
      dbLatencyMs = Date.now() - start;
      if (error) dbError = error.message;
      else {
        dbOk = true;
        employeeCount = count ?? 0;
      }
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const ok = envResult.ok && dbOk;

  // Always log to function logs for passive visibility
  console.log(
    `[health-cron] ${ok ? 'OK' : 'DEGRADED'} env=${envResult.ok ? 'ok' : 'bad'} db=${dbOk ? 'ok' : 'bad'}` +
      (dbLatencyMs !== undefined ? ` latency=${dbLatencyMs}ms` : '') +
      (employeeCount !== undefined ? ` employees=${employeeCount}` : '') +
      (envResult.critical_missing.length > 0
        ? ` missing=[${envResult.critical_missing.join(',')}]`
        : '')
  );

  // If degraded → try to notify principals via Resend
  let notified = false;
  if (!ok && process.env.RESEND_API_KEY) {
    try {
      const subject = `[Trustner Platform] Weekly health check — DEGRADED`;
      const envRows = envSnapshot();
      const html = `
<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #b91c1c;">Weekly health check found issues</h2>
  <p style="font-size: 14px;">Automated check on <strong>${new Date().toLocaleString('en-IN')}</strong></p>
  <h3 style="margin-top: 24px;">Database</h3>
  <p style="font-family: monospace; font-size: 13px;">
    ${dbOk ? `✓ OK · latency ${dbLatencyMs}ms · ${employeeCount} employees` : `✗ FAILED · ${dbError}`}
  </p>
  <h3 style="margin-top: 24px;">Environment</h3>
  <p style="font-family: monospace; font-size: 13px;">${envResult.summary}</p>
  ${envResult.critical_missing.length > 0 ? `<p><strong>Missing critical:</strong> ${envResult.critical_missing.join(', ')}</p>` : ''}
  ${envResult.critical_malformed.length > 0 ? `<p><strong>Malformed critical:</strong> ${envResult.critical_malformed.map((m) => `${m.name} — ${m.reason}`).join('; ')}</p>` : ''}
  ${envResult.non_critical_missing.length > 0 ? `<p style="color: #6b7280;"><em>Non-critical (degraded): ${envResult.non_critical_missing.join(', ')}</em></p>` : ''}
  <h3 style="margin-top: 24px;">All variables</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
    <tr style="background: #f3f4f6;"><th style="text-align: left; padding: 6px;">Name</th><th style="text-align: left; padding: 6px;">Status</th></tr>
    ${envRows.map((v) => `<tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 6px; font-family: monospace;">${v.name}</td><td style="padding: 6px; color: ${v.status === 'set' ? '#15803d' : '#b91c1c'};">${v.status}${v.reason ? ` (${v.reason})` : ''}</td></tr>`).join('')}
  </table>
  <p style="margin-top: 24px; font-size: 13px;">
    <a href="https://www.merasip.com/admin/health" style="color: #0f766e;">Open the live health dashboard →</a>
  </p>
</body></html>`;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Trustner Platform <reports@merasip.com>',
          to: APPROVER_RECIPIENTS,
          subject,
          html,
        }),
      });
      notified = res.ok;
      if (!res.ok) console.warn('[health-cron] Resend send failed:', await res.text().catch(() => ''));
    } catch (e) {
      console.warn('[health-cron] Resend send threw:', e);
    }
  }

  return NextResponse.json({
    ok,
    env: { ok: envResult.ok, summary: envResult.summary },
    db: { ok: dbOk, latencyMs: dbLatencyMs, employees: employeeCount, error: dbError },
    notified,
    checkedAt: new Date().toISOString(),
  });
}
