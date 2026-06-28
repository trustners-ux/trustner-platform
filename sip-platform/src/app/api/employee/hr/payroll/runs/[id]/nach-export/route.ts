/**
 * GET /api/employee/hr/payroll/runs/:id/nach-export
 *
 * Builds an ICICI CIB / NACH-format salary upload CSV for the given run.
 * Distinct from the generic Bank Advice CSV at /slips?bank=1 — this one
 * is the 16-column ICICI corporate banking format ready to upload through
 * CIB → Bulk → Salary.
 *
 * Auth: employee-jwt cookie → can_access_payroll permission.
 * Status gate: run must be in 'approved' | 'disbursed' | 'locked'.
 * Env: ICICI_CIB_DEBIT_ACCOUNT (12-digit debit account). When unset,
 *      defaults to '000000000000' and logs a warning — the operator can
 *      still inspect the file but it cannot be uploaded as-is.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDecipheriv } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import {
  buildIciciSalaryCsv,
  type NachInputRow,
} from '@/lib/payroll/nach-icici';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_payroll ? actor : null;
}

/**
 * Best-effort decrypt of hr_employees.account_number_encrypted.
 * Schema says "encrypted at app layer", but no encryption helper exists
 * in the repo today. We support the AES-256-GCM "v1:<ivB64>:<ctB64>:<tagB64>"
 * envelope as a forward-compatible default. If the value is plain digits
 * (legacy / not-yet-encrypted), we pass it through unchanged.
 */
function tryDecryptAccount(stored: string | null | undefined): string {
  if (!stored) return '';
  const raw = String(stored).trim();
  if (!raw) return '';

  // Looks like a plain account number — pass through.
  if (/^[0-9A-Za-z]+$/.test(raw) && !raw.startsWith('v1:')) {
    return raw;
  }

  const key = process.env.HR_BANK_ENCRYPTION_KEY;
  if (!key) {
    console.warn('[nach-export] HR_BANK_ENCRYPTION_KEY not set — cannot decrypt account_number_encrypted');
    return '';
  }

  try {
    const parts = raw.split(':');
    if (parts[0] === 'v1' && parts.length === 4) {
      const iv = Buffer.from(parts[1], 'base64');
      const ct = Buffer.from(parts[2], 'base64');
      const tag = Buffer.from(parts[3], 'base64');
      const keyBuf = Buffer.from(key, key.length === 64 ? 'hex' : 'base64');
      const decipher = createDecipheriv('aes-256-gcm', keyBuf, iv);
      decipher.setAuthTag(tag);
      const out = Buffer.concat([decipher.update(ct), decipher.final()]);
      return out.toString('utf8');
    }
  } catch (e) {
    console.warn('[nach-export] decrypt failed for one account:', e instanceof Error ? e.message : e);
  }
  return '';
}

function inferBankName(ifsc: string | null | undefined): string {
  if (!ifsc) return '';
  const prefix = ifsc.slice(0, 4).toUpperCase();
  const lookup: Record<string, string> = {
    ICIC: 'ICICI Bank',
    HDFC: 'HDFC Bank',
    SBIN: 'State Bank of India',
    AXIS: 'Axis Bank',
    KKBK: 'Kotak Mahindra Bank',
    YESB: 'Yes Bank',
    PUNB: 'Punjab National Bank',
    UTIB: 'Axis Bank',
    IDFB: 'IDFC First Bank',
    IBKL: 'IDBI Bank',
    BARB: 'Bank of Baroda',
    CNRB: 'Canara Bank',
    UBIN: 'Union Bank of India',
    INDB: 'IndusInd Bank',
    RATN: 'RBL Bank',
    FDRL: 'Federal Bank',
  };
  return lookup[prefix] || '';
}

/** Build the 'MAY26' style token from a 'YYYY-MM' pay_month string. */
function payMonthToken(payMonth: string | null | undefined): string {
  if (!payMonth) return '';
  const m = /^(\d{4})-(\d{2})$/.exec(payMonth);
  if (!m) return payMonth.toUpperCase();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monIdx = Math.max(0, Math.min(11, Number(m[2]) - 1));
  const yy = m[1].slice(2);
  return `${months[monIdx]}${yy}`;
}

interface EmployeeRow {
  id: number;
  employee_code: string | null;
  full_name: string | null;
  email: string | null;
  mobile_personal: string | null;
  mobile_official: string | null;
  ifsc: string | null;
  bank_branch: string | null;
  account_number_encrypted: string | null;
}

interface SlipRow {
  id: number;
  employee_id: number;
  net_pay: number | string;
  hr_employees: EmployeeRow | EmployeeRow[] | null;
}

function pickEmployee(slip: SlipRow): EmployeeRow | null {
  const e = slip.hr_employees;
  if (!e) return null;
  return Array.isArray(e) ? e[0] ?? null : e;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const runId = Number(id);
  if (!Number.isFinite(runId)) {
    return NextResponse.json({ error: 'Invalid run id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // 1) Run + status gate
  const { data: run, error: runErr } = await supabase
    .from('hr_salary_runs')
    .select('id, fy, pay_month, entity, status, total_employees, total_net')
    .eq('id', runId)
    .maybeSingle();

  if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  const allowed = new Set(['approved', 'disbursed', 'locked']);
  if (!allowed.has(run.status)) {
    return NextResponse.json(
      {
        error: 'Run not ready for NACH export',
        status: run.status,
        required: Array.from(allowed),
      },
      { status: 409 },
    );
  }

  // 2) Slips + joined employee bank fields
  const { data: slips, error: slipsErr } = await supabase
    .from('hr_salary_slips')
    .select(
      'id, employee_id, net_pay, hr_employees(id, employee_code, full_name, email, mobile_personal, mobile_official, ifsc, bank_branch, account_number_encrypted)',
    )
    .eq('salary_run_id', runId)
    .order('id');

  if (slipsErr) return NextResponse.json({ error: slipsErr.message }, { status: 500 });
  if (!slips || slips.length === 0) {
    return NextResponse.json({ error: 'No slips on run' }, { status: 422 });
  }

  // 3) Map → NachInputRow[]
  const debitAccountNo = process.env.ICICI_CIB_DEBIT_ACCOUNT || '000000000000';
  if (!process.env.ICICI_CIB_DEBIT_ACCOUNT) {
    console.warn(
      '[nach-export] ICICI_CIB_DEBIT_ACCOUNT not set — emitting CSV with placeholder debit account "000000000000". File is for inspection only.',
    );
  }

  const rows: NachInputRow[] = [];
  const decryptMisses: number[] = [];
  for (const s of slips as unknown as SlipRow[]) {
    const emp = pickEmployee(s);
    if (!emp) continue;
    const acct = tryDecryptAccount(emp.account_number_encrypted);
    if (!acct) decryptMisses.push(emp.id);
    rows.push({
      employeeId: emp.id,
      beneficiaryName: emp.full_name || emp.employee_code || `EMP${emp.id}`,
      beneficiaryAccount: acct,
      ifsc: emp.ifsc || '',
      amount: Number(s.net_pay),
      email: emp.email,
      mobile: emp.mobile_personal || emp.mobile_official,
      beneficiaryBankName: inferBankName(emp.ifsc),
    });
  }

  // 4) Build CSV
  const result = buildIciciSalaryCsv({
    runId: run.id,
    entity: run.entity,
    payMonthToken: payMonthToken(run.pay_month),
    debitAccountNo,
    paymentDate: new Date(),
    rows,
  });

  if (result.errors.length > 0 && result.rowCount === 0) {
    return NextResponse.json(
      {
        error: 'All rows failed validation',
        rowsBlocked: result.errors.length,
        errors: result.errors,
        decryptMisses,
      },
      { status: 422 },
    );
  }

  // 5) Best-effort audit row in hr_payroll_disbursements (table is optional —
  //    swallow the failure if it doesn't exist yet, per recon).
  try {
    const auditRows = rows
      .filter((r) => !result.errors.find((e) => e.employeeId === r.employeeId))
      .map((r) => ({
        salary_run_id: run.id,
        employee_id: Number(r.employeeId),
        reference_no: `${(run.entity || 'TAS').toUpperCase()}R${run.id}-${r.employeeId}`.toUpperCase().slice(0, 16),
        amount: r.amount,
        status: 'file_generated',
        file_name: result.filename,
        generated_by: actor.email,
        generated_at: new Date().toISOString(),
      }));

    if (auditRows.length > 0) {
      const { error: auditErr } = await supabase
        .from('hr_payroll_disbursements')
        .upsert(auditRows, { onConflict: 'salary_run_id,employee_id' });
      if (auditErr && !/(does not exist|schema cache|relation .* does not exist)/i.test(auditErr.message)) {
        console.warn('[nach-export] audit upsert failed:', auditErr.message);
      }
    }
  } catch (e) {
    console.warn('[nach-export] audit table not available — skipping:', e instanceof Error ? e.message : e);
  }

  // 6) Stash filename on the run for traceability (best-effort).
  try {
    await supabase
      .from('hr_salary_runs')
      .update({ bank_advice_blob_url: `inline://${result.filename}` })
      .eq('id', run.id);
  } catch {
    /* non-fatal */
  }

  // 7) Stream CSV
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  if (debug) {
    return NextResponse.json({
      filename: result.filename,
      rowCount: result.rowCount,
      totalAmount: result.totalAmount,
      errors: result.errors,
      decryptMisses,
      sample: result.csv.split('\r\n').slice(0, 3),
    });
  }

  return new NextResponse(result.csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-NACH-Row-Count': String(result.rowCount),
      'X-NACH-Total-Amount': String(result.totalAmount),
      'X-NACH-Errors': String(result.errors.length),
    },
  });
}
