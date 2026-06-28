/**
 * POST /api/admin/client-master/import?action=parse   — upload file, returns preview rows
 * POST /api/admin/client-master/import?action=commit  — body { rows }, creates clients
 *
 * Parse + commit are separate calls so the wizard can show a preview-
 * with-edits before any client is created. Dedup checks (PAN, mobile,
 * email) happen at commit time per-row so partial success is possible.
 *
 * Auth: canWriteClients (editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import {
  parseClientImportFile,
  type ParsedClientRow,
} from '@/lib/client-master/import-parser';
import {
  createClient,
  findByMobile,
  findByEmail,
  updateClient,
} from '@/lib/client-master/clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_ROWS_PER_COMMIT = 10000;

export async function POST(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role for clients.write' }, { status: 403 });
  }

  const action = req.nextUrl.searchParams.get('action') || 'parse';

  // ── PARSE ──────────────────────────────────────────────────────
  if (action === 'parse') {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Multipart parse failed' }, { status: 400 });
    }
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'file field required' }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_BYTES} bytes)` }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      const result = await parseClientImportFile(bytes, file.name);

      // Decorate each parsed row with a dedup signal — checked BEFORE
      // commit so the RM can review duplicates and decide skip vs.
      // create-anyway.
      const decoratedRows = await Promise.all(
        result.rows.map(async (r) => {
          const dupes: { by: string; existing_id: number; existing_code: string; existing_name: string }[] = [];
          if (r.mobile_primary) {
            for (const c of await findByMobile(r.mobile_primary)) {
              dupes.push({ by: 'mobile', existing_id: c.id, existing_code: c.code, existing_name: c.display_name });
            }
          }
          if (r.email_primary) {
            for (const c of await findByEmail(r.email_primary)) {
              if (!dupes.some((d) => d.existing_id === c.id)) {
                dupes.push({ by: 'email', existing_id: c.id, existing_code: c.code, existing_name: c.display_name });
              }
            }
          }
          return { ...r, duplicate_candidates: dupes };
        }),
      );

      if (result.fatal) {
        return NextResponse.json({ ok: false, ...result, rows: decoratedRows }, { status: 400 });
      }
      return NextResponse.json({ ok: true, ...result, rows: decoratedRows });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Parse failed' },
        { status: 400 },
      );
    }
  }

  // ── COMMIT ─────────────────────────────────────────────────────
  if (action === 'commit') {
    let body: { rows?: (ParsedClientRow & { skip?: boolean })[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 });
    }
    if (body.rows.length === 0) {
      return NextResponse.json({ error: 'No rows to commit' }, { status: 400 });
    }
    if (body.rows.length > MAX_ROWS_PER_COMMIT) {
      return NextResponse.json(
        { error: `Too many rows (${body.rows.length}). Max ${MAX_ROWS_PER_COMMIT} per import — split the file.` },
        { status: 413 },
      );
    }

    const results: {
      source_row: number;
      ok: boolean;
      skipped?: boolean;
      client?: { id: number; code: string; display_name: string };
      error?: string;
    }[] = [];
    let created = 0, skipped = 0, failed = 0;

    for (const r of body.rows) {
      if (r.skip) {
        skipped++;
        results.push({ source_row: r.source_row, ok: false, skipped: true });
        continue;
      }
      if (r.errors && r.errors.length > 0) {
        failed++;
        results.push({ source_row: r.source_row, ok: false, error: r.errors.join('; ') });
        continue;
      }
      try {
        const extras = ((r as ParsedClientRow & { extras?: Record<string, string> }).extras) || {};
        const isDeceased = !!(extras.date_of_death
          || (r.warnings || []).some((w: string) => /date of death/i.test(w)));
        const created_row = await createClient({
          first_name: r.first_name,
          middle_name: r.middle_name,
          last_name: r.last_name,
          salutation: r.salutation,
          gender: r.gender,
          dob: r.dob,
          marital_status: r.marital_status,
          pan: r.pan,
          // aadhaar_full12 NEVER from imports (DPDPA)
          mobile_primary: r.mobile_primary,
          mobile_alt: r.mobile_alt,
          email_primary: r.email_primary,
          email_alt: r.email_alt,
          addr_current_line1: r.addr_current_line1,
          addr_current_line2: r.addr_current_line2,
          addr_current_city: r.addr_current_city,
          addr_current_state: r.addr_current_state,
          addr_current_pincode: r.addr_current_pincode,
          addr_permanent_same_as_current: true,
          residential_status: r.residential_status,
          occupation: r.occupation,
          annual_income_band: r.annual_income_band,
          risk_profile: r.risk_profile,
          onboarded_via: 'bulk_import',
          tags: r.tags,
          notes: r.notes,
          metadata: {
            source_platform_code: r.source_platform_code,
            source_family_head: r.source_family_head,
            source_family_head_code: (r as ParsedClientRow & { source_family_head_code?: string | null }).source_family_head_code ?? null,
            imported_by_email: a.actor.email,
            imported_at: new Date().toISOString(),
            archived_on_import_reason: isDeceased ? 'date_of_death present in source' : undefined,
            ...extras,
          },
          actor: a.actor,
        });
        if (isDeceased) {
          await updateClient(
            created_row.id,
            {
              status: 'archived',
              notes: (created_row.notes || '') + '\nArchived on import — date of death present in source.',
            },
            a.actor,
          );
        }
        created++;
        results.push({
          source_row: r.source_row,
          ok: true,
          client: { id: created_row.id, code: created_row.code, display_name: created_row.display_name },
        });
      } catch (err) {
        failed++;
        results.push({
          source_row: r.source_row,
          ok: false,
          error: err instanceof Error ? err.message : 'Create failed',
        });
      }
    }

    return NextResponse.json({ ok: true, created, skipped, failed, results });
  }

  return NextResponse.json({ error: 'Unknown action — use ?action=parse or ?action=commit' }, { status: 400 });
}
