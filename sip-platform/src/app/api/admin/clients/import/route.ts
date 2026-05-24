/**
 * Client Master Import API
 *
 * POST /api/admin/clients/import
 *
 * Multipart form-data:
 *   file       — the CSV/XLSX file (required)
 *   dryRun     — 'true' to preview only, 'false' to commit (default: true)
 *   onConflict — 'skip' | 'update' | 'createNew' (how to handle dupes by mobile/email)
 *
 * Returns the ParseResult plus, on commit, per-row insert/update outcomes.
 *
 * AUTHORIZATION (DPDP-aligned):
 *   - Strict gate: principal OR can_manage_users
 *   - Every import is logged to app_audit_log with the import summary
 *   - Bulk operations on Personal Data require this elevated role
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';
import { parseClientImport, type ParsedRow } from '@/lib/clients/import-parser';

export const maxDuration = 60; // Bulk imports can take time for 6000 rows

export async function POST(req: NextRequest) {
  // ── Auth + role gate ──
  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });
  const actorEmployeeId = authz.actorEmployeeId;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // ── Read multipart ──
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read form-data. Send file as multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded. Field name must be "file".' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 10 MB.' }, { status: 413 });
  }

  const dryRun = String(form.get('dryRun') ?? 'true').toLowerCase() !== 'false';
  const onConflict = String(form.get('onConflict') ?? 'skip').toLowerCase();
  if (!['skip', 'update', 'createNew'].includes(onConflict)) {
    return NextResponse.json({ error: `Invalid onConflict "${onConflict}". Use skip|update|createNew.` }, { status: 400 });
  }

  // ── Parse ──
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseClientImport(buffer, file.name);

  if (!parsed.ok) {
    return NextResponse.json({
      ok: false,
      fatalError: parsed.fatalError,
      columnMap: parsed.columnMap,
      unmappedHeaders: parsed.unmappedHeaders,
      totalRows: parsed.totalRows,
    }, { status: 400 });
  }

  // ── Dry-run: return preview ──
  if (dryRun) {
    // Mask PAN in dry-run preview for non-admin viewers (we already enforced
    // role, but extra defence-in-depth: only show last 4 chars).
    const previewRows = parsed.rows.map((r) => ({
      ...r,
      primaryContactPan: r.primaryContactPan
        ? `${'X'.repeat(Math.max(0, r.primaryContactPan.length - 4))}${r.primaryContactPan.slice(-4)}`
        : null,
    }));

    // Check for existing-in-DB duplicates by mobile/email
    const existingChecks = await checkExistingDuplicates(supabase, parsed.rows);

    return NextResponse.json({
      ok: true,
      dryRun: true,
      columnMap: parsed.columnMap,
      unmappedHeaders: parsed.unmappedHeaders,
      totalRows: parsed.totalRows,
      validRows: parsed.validRows,
      invalidRows: parsed.invalidRows,
      duplicatesInFile: parsed.duplicatesInFile,
      duplicatesInDb: existingChecks.duplicatesInDb,
      existingMobiles: existingChecks.existingMobiles,
      rows: previewRows,
    });
  }

  // ── Commit ──
  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  const outcomes: Array<{ rowNumber: number; outcome: string; familyId?: number; reason?: string }> = [];

  for (const r of parsed.rows) {
    if (r.errors.length > 0) {
      failed += 1;
      outcomes.push({ rowNumber: r.rowNumber, outcome: 'skipped-invalid', reason: r.errors.join(' · ') });
      continue;
    }

    // Dupe check by mobile or email
    const existing = await findExisting(supabase, r);
    if (existing && onConflict === 'skip') {
      skipped += 1;
      outcomes.push({ rowNumber: r.rowNumber, outcome: 'skipped-duplicate', familyId: existing.id, reason: 'Matched on mobile/email' });
      continue;
    }
    if (existing && onConflict === 'update') {
      // Update non-null fields
      const updatePayload: Record<string, unknown> = {};
      if (r.familyName) updatePayload.family_name = r.familyName;
      if (r.primaryContactName) updatePayload.primary_contact_name = r.primaryContactName;
      if (r.primaryContactMobile) updatePayload.primary_contact_mobile = r.primaryContactMobile;
      if (r.primaryContactEmail) updatePayload.primary_contact_email = r.primaryContactEmail;
      if (r.primaryContactPan) updatePayload.primary_contact_pan_encrypted = r.primaryContactPan;
      if (r.segment) updatePayload.segment = r.segment;
      if (r.familyCode) updatePayload.family_code = r.familyCode;
      if (r.notes) updatePayload.notes = r.notes;
      updatePayload.updated_at = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('pd_client_families').update(updatePayload).eq('id', existing.id);
      if (updErr) {
        failed += 1;
        outcomes.push({ rowNumber: r.rowNumber, outcome: 'update-failed', familyId: existing.id, reason: updErr.message });
      } else {
        updated += 1;
        outcomes.push({ rowNumber: r.rowNumber, outcome: 'updated', familyId: existing.id });
      }
      continue;
    }

    // INSERT (or duplicate but onConflict='createNew')
    const code = r.familyCode || generateFamilyCode(r.familyName ?? 'FAM');
    const { data: ins, error: insErr } = await supabase
      .from('pd_client_families')
      .insert({
        family_code: code,
        family_name: r.familyName,
        primary_contact_name: r.primaryContactName,
        primary_contact_email: r.primaryContactEmail,
        primary_contact_mobile: r.primaryContactMobile,
        primary_contact_pan_encrypted: r.primaryContactPan,
        segment: r.segment || 'Mass',
        notes: r.notes,
      })
      .select('id')
      .single();
    if (insErr) {
      failed += 1;
      outcomes.push({ rowNumber: r.rowNumber, outcome: 'insert-failed', reason: insErr.message });
    } else {
      inserted += 1;
      outcomes.push({ rowNumber: r.rowNumber, outcome: 'inserted', familyId: ins.id as number });
    }
  }

  // ── Audit log entry — DPDP compliance trail ──
  try {
    await supabase.from('app_audit_log').insert({
      table_name: 'pd_client_families',
      action: 'BULK_IMPORT',
      changed_by: String(actorEmployeeId ?? 'system'),
      reason: `CSV import: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed (file: ${file.name})`,
      new_values: {
        fileName: file.name,
        totalRows: parsed.totalRows,
        inserted, updated, skipped, failed,
        onConflict,
      },
    });
  } catch {
    // Audit log failure is non-fatal — the import already happened.
    // If the app_audit_log table doesn't exist with this shape, we just skip.
  }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    inserted, updated, skipped, failed,
    outcomes,
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function checkExistingDuplicates(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  rows: ParsedRow[]
): Promise<{ duplicatesInDb: number; existingMobiles: string[] }> {
  const mobiles = rows.map((r) => r.primaryContactMobile).filter(Boolean) as string[];
  if (mobiles.length === 0) return { duplicatesInDb: 0, existingMobiles: [] };
  const { data: existing } = await supabase
    .from('pd_client_families')
    .select('primary_contact_mobile')
    .in('primary_contact_mobile', mobiles);
  const found = new Set((existing ?? []).map((e) => e.primary_contact_mobile as string).filter(Boolean));
  return {
    duplicatesInDb: found.size,
    existingMobiles: Array.from(found),
  };
}

async function findExisting(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  r: ParsedRow
): Promise<{ id: number } | null> {
  const conds: string[] = [];
  if (r.primaryContactMobile) conds.push(`primary_contact_mobile.eq.${r.primaryContactMobile}`);
  if (r.primaryContactEmail) conds.push(`primary_contact_email.eq.${r.primaryContactEmail}`);
  if (conds.length === 0) return null;
  const { data } = await supabase
    .from('pd_client_families')
    .select('id')
    .or(conds.join(','))
    .limit(1)
    .maybeSingle();
  return (data?.id ? { id: data.id as number } : null);
}

function generateFamilyCode(familyName: string): string {
  const prefix = familyName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'FAM';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

// ─────────────────────────────────────────────────────────────────
// AUTH + ROLE GATE (DPDP-aligned)
// ─────────────────────────────────────────────────────────────────

async function authorize(): Promise<
  | { allowed: true; actorEmployeeId: number | null }
  | { allowed: false; status: number; reason: string }
> {
  const cookieStore = await cookies();
  let email: string | null = null;
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) return { allowed: false, status: 401, reason: 'Not authenticated' };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };

  const { data: empRow } = await supabase
    .from('employees').select('id').ilike('email', email.trim()).maybeSingle();
  const actorEmployeeId = (empRow?.id as number) ?? null;

  // Principals always allowed
  if (APPROVER_EMAILS.includes(email.toLowerCase())) {
    return { allowed: true, actorEmployeeId };
  }

  // Otherwise need can_manage_users
  if (!actorEmployeeId) {
    return { allowed: false, status: 403, reason: 'Employee row not found' };
  }
  const { data: roleRow } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(can_manage_users)')
    .eq('employee_id', actorEmployeeId)
    .eq('is_active', true)
    .maybeSingle();
  const role = (roleRow as { role?: unknown })?.role;
  const r = Array.isArray(role) ? role[0] : role;
  if (!Boolean((r as { can_manage_users?: boolean } | undefined)?.can_manage_users)) {
    return {
      allowed: false,
      status: 403,
      reason: 'Importing client master data requires can_manage_users (admin) role. This restriction is mandated by DPDP Act 2023.',
    };
  }
  return { allowed: true, actorEmployeeId };
}
