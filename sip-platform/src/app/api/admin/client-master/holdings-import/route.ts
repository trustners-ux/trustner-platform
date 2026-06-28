/**
 * POST /api/admin/client-master/holdings-import?action=parse  — file upload → preview
 * POST /api/admin/client-master/holdings-import?action=commit — body { holdings, sips }
 *
 * Parse + commit are separate so the admin can review the preview before
 * any DB write. The parse step resolves each row to a client_id (or marks
 * as unresolved) and returns the full preview payload.
 *
 * Auth: canWriteClients (editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import {
  parseHoldingsRows,
  parseSipRows,
  detectSheetKind,
} from '@/lib/holdings/import-parser';
import { resolveClient } from '@/lib/holdings/resolver';
import { commitHoldings, commitSips } from '@/lib/holdings/importer';
import type { ParsedHoldingRow, ParsedSipRow, HoldingsImportSource } from '@/lib/holdings/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024;

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

    // Load XLSX dynamically (matches client-master pattern)
    const XLSX = await import('xlsx');
    const wb = XLSX.read(bytes, { type: 'buffer', cellDates: true });

    const allHoldings: ParsedHoldingRow[] = [];
    const allSips: ParsedSipRow[] = [];
    const sheetReport: { name: string; rows: number; kind: 'holdings' | 'sips' | 'unknown' }[] = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        raw: true,
      });
      if (rows.length === 0) {
        sheetReport.push({ name: sheetName, rows: 0, kind: 'unknown' });
        continue;
      }
      const kind = detectSheetKind(rows);
      sheetReport.push({ name: sheetName, rows: rows.length, kind });

      if (kind === 'holdings') {
        const parsed = parseHoldingsRows(rows);
        allHoldings.push(...parsed);
      } else if (kind === 'sips') {
        const parsed = parseSipRows(rows);
        allSips.push(...parsed);
      }
    }

    // Resolve clients for each row
    const resolvedHoldings = await Promise.all(
      allHoldings.map(async (r) => {
        const res = await resolveClient({
          client_code: r.client_code,
          pan: r.pan,
          folio_number: r.folio_number,
          client_name: r.client_name,
        });
        return { ...r, resolved_client_id: res.client_id, resolution: res };
      }),
    );

    const resolvedSips = await Promise.all(
      allSips.map(async (r) => {
        const res = await resolveClient({
          client_code: r.client_code,
          pan: r.pan,
          folio_number: r.folio_number,
          client_name: r.client_name,
        });
        return { ...r, resolved_client_id: res.client_id, resolution: res };
      }),
    );

    return NextResponse.json({
      ok: true,
      sheets: sheetReport,
      holdings: resolvedHoldings,
      sips: resolvedSips,
      summary: {
        total_holdings: resolvedHoldings.length,
        matched_holdings: resolvedHoldings.filter((r) => r.resolved_client_id).length,
        total_sips: resolvedSips.length,
        matched_sips: resolvedSips.filter((r) => r.resolved_client_id).length,
      },
    });
  }

  // ── COMMIT ─────────────────────────────────────────────────────
  if (action === 'commit') {
    type ResolvedHolding = ParsedHoldingRow & { resolved_client_id: number | null };
    type ResolvedSip = ParsedSipRow & { resolved_client_id: number | null };

    let body: { holdings?: ResolvedHolding[]; sips?: ResolvedSip[]; source?: HoldingsImportSource };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
    }

    const holdings = Array.isArray(body.holdings) ? body.holdings : [];
    const sips = Array.isArray(body.sips) ? body.sips : [];
    const source = body.source ?? 'csv_upload';

    const holdingsResult = await commitHoldings(holdings, source);
    const sipsResult = await commitSips(sips, source);

    return NextResponse.json({
      ok: true,
      holdings: holdingsResult,
      sips: sipsResult,
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
