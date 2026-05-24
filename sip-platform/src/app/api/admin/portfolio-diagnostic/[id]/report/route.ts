/**
 * Portfolio Diagnostic — Client-Facing Reports
 *
 * GET /api/admin/portfolio-diagnostic/[id]/report?type=full|action
 *
 * Returns a fully-styled, print-ready HTML document for the requested
 * report type. The user opens this in a new tab and uses the browser's
 * Print → Save as PDF dialog to produce the final PDF.
 *
 * This is the same workflow that produced the Rohit Jain Family
 * reference reports — server-rendered HTML + browser PDF.
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
  const type = (url.searchParams.get('type') ?? 'full').toLowerCase();
  if (type !== 'full' && type !== 'action') {
    return NextResponse.json(
      { error: `Unknown report type: ${type}. Use ?type=full or ?type=action.` },
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

  const html =
    type === 'action'
      ? renderActionSheetHtml(data, { showPrintBar: true })
      : renderFullPortfolioReviewHtml(data, { showPrintBar: true });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Always re-render — diagnostics may be re-scored
      'Cache-Control': 'no-store, max-age=0',
    },
  });
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
