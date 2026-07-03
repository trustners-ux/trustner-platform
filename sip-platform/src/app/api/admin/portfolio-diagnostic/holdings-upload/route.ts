/**
 * POST /api/admin/portfolio-diagnostic/holdings-upload
 *
 * Admin/employee uploads an AMC monthly portfolio-disclosure workbook (.xlsx/.xls
 * — the SEBI full-scheme month-end portfolio). It is split per-scheme, each scheme
 * is fuzzy-matched to its Regular-plan amfi_code, and the equity holdings are
 * upserted into pd_fund_holdings. This is the RELIABLE refresh path: a human
 * downloads the file through the AMC's (JS-gated) dropdown and uploads it here, so
 * stock-level look-through stays fresh regardless of the auto-resolver.
 *
 * multipart/form-data: { file, asOfDate?(yyyy-mm-dd), source?, equityOnly?('true'|'false') }
 * Returns the ingest report (matched / unmatched / rowsUpserted).
 *
 * Auth: admin JWT or employee JWT cookie required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { ingestAmcWorkbook } from '@/lib/portfolio-diagnostic/holdings/ingest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const maxDuration = 120;

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30 MB — consolidated AMC files run large

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifyToken(adminToken))) return true;
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken && (await verifyEmployeeToken(empToken))) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const t0 = Date.now();
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    // ZIP-of-workbooks (e.g. ICICI) is not yet supported — guide the user.
    if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && /\.zip$/i.test(file.name) && !/\.xlsx?$/i.test(file.name)) {
      return NextResponse.json({
        error: 'This looks like a ZIP of per-scheme files. Unzip it and upload the individual .xlsx files (ZIP ingestion is on the roadmap).',
      }, { status: 400 });
    }
    // Reject non-spreadsheets early. XLSX (PK = 50 4B) and legacy XLS (D0 CF) are ok.
    const isPk = buf[0] === 0x50 && buf[1] === 0x4b;
    const isOle = buf[0] === 0xd0 && buf[1] === 0xcf;
    if (!isPk && !isOle) {
      return NextResponse.json({ error: 'Please upload an Excel workbook (.xlsx or .xls).' }, { status: 400 });
    }

    const asOfDate = ((form.get('asOfDate') as string | null) || '').trim() || undefined;
    if (asOfDate && !/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
      return NextResponse.json({ error: 'asOfDate must be yyyy-mm-dd.' }, { status: 400 });
    }
    const sourceRaw = ((form.get('source') as string | null) || '').trim();
    const source = sourceRaw || `upload:${file.name.replace(/\.[^.]+$/, '').slice(0, 30)}`;
    const equityOnly = (form.get('equityOnly') as string | null) !== 'false';

    const result = await ingestAmcWorkbook(buf, { asOfDate, source, equityOnly });

    return NextResponse.json({
      success: result.errors.length === 0,
      fileName: file.name,
      asOfDate: result.asOfDate,
      schemesParsed: result.schemesParsed,
      matchedCount: result.matched.length,
      unmatchedCount: result.unmatched.length,
      rowsUpserted: result.rowsUpserted,
      elapsedSec: Math.round((Date.now() - t0) / 1000),
      matched: result.matched.slice(0, 60),
      unmatchedSample: result.unmatched.slice(0, 30),
      errors: result.errors.slice(0, 10),
    });
  } catch (e) {
    console.error((e as Error).message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
