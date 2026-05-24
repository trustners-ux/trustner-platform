/**
 * Portfolio Diagnostic — Client-Facing Reports
 *
 * GET /api/admin/portfolio-diagnostic/[id]/report
 *   ?type=full       → Full Portfolio Review (2-page HTML)
 *   ?type=action     → Action Sheet (HTML)
 *   ?type=one-pager  → One-Pager Snapshot (1-page HTML)
 *   ?type=three-pager→ Three-Page Diagnostic Report (HTML)
 *   ?type=xlsx       → Wealth Math Tracker (.xlsx download)
 *   ?type=pptx       → Family Meeting Deck (.pptx download)
 *
 * HTML formats are print-ready (Cmd+P → Save as PDF in browser).
 * XLSX/PPTX formats return native files for direct download.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { loadReportData } from '@/lib/portfolio-diagnostic/report-data';
import { renderFullPortfolioReviewHtml } from '@/lib/portfolio-diagnostic/reports/full-portfolio-review';
import { renderActionSheetHtml } from '@/lib/portfolio-diagnostic/reports/action-sheet';
import { renderOnePagerHtml } from '@/lib/portfolio-diagnostic/reports/one-pager';
import { renderThreePagerHtml } from '@/lib/portfolio-diagnostic/reports/three-pager';
import { buildWealthTrackerXlsx } from '@/lib/portfolio-diagnostic/reports/xlsx-tracker';
import { buildFamilyMeetingDeckPptx } from '@/lib/portfolio-diagnostic/reports/pptx-deck';

// XLSX and PPTX generation can be CPU-heavy; allow up to 60s
export const maxDuration = 60;

type ReportType = 'full' | 'action' | 'one-pager' | 'three-pager' | 'xlsx' | 'pptx';

const VALID_TYPES: ReportType[] = ['full', 'action', 'one-pager', 'three-pager', 'xlsx', 'pptx'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get('type') ?? 'full').toLowerCase() as ReportType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Unknown report type: ${type}. Use ?type=full|action|one-pager|three-pager|xlsx|pptx.` },
      { status: 400 }
    );
  }

  const data = await loadReportData(numericId);
  if (!data) {
    return NextResponse.json(
      { error: 'Diagnostic not found or has no holdings' },
      { status: 404 }
    );
  }

  // ── HTML formats ──
  if (type === 'full' || type === 'action' || type === 'one-pager' || type === 'three-pager') {
    let html: string;
    if (type === 'full') html = renderFullPortfolioReviewHtml(data, { showPrintBar: true });
    else if (type === 'action') html = renderActionSheetHtml(data, { showPrintBar: true });
    else if (type === 'one-pager') html = renderOnePagerHtml(data, { showPrintBar: true });
    else html = renderThreePagerHtml(data, { showPrintBar: true });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  // ── XLSX format ──
  if (type === 'xlsx') {
    const buf = await buildWealthTrackerXlsx(data);
    const filename = `${data.familyName.replace(/[^\w\-]+/g, '_')}_Wealth_Tracker_${data.reportDateIso}.xlsx`;
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  // ── PPTX format ──
  if (type === 'pptx') {
    const buf = await buildFamilyMeetingDeckPptx(data);
    const filename = `${data.familyName.replace(/[^\w\-]+/g, '_')}_Meeting_Deck_${data.reportDateIso}.pptx`;
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return NextResponse.json({ error: 'Unhandled type' }, { status: 500 });
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return p.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return p.email;
  }
  return null;
}
