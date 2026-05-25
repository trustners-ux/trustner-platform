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
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { loadReportData } from '@/lib/portfolio-diagnostic/report-data';
import { renderFullPortfolioReviewHtml } from '@/lib/portfolio-diagnostic/reports/full-portfolio-review';
import { renderActionSheetHtml } from '@/lib/portfolio-diagnostic/reports/action-sheet';
import { renderOnePagerHtml } from '@/lib/portfolio-diagnostic/reports/one-pager';
import { renderThreePagerHtml } from '@/lib/portfolio-diagnostic/reports/three-pager';
import { buildWealthTrackerXlsx } from '@/lib/portfolio-diagnostic/reports/xlsx-tracker';
import { buildFamilyMeetingDeckPptx } from '@/lib/portfolio-diagnostic/reports/pptx-deck';
import { renderNarrativeReviewHtml } from '@/lib/portfolio-diagnostic/reports/narrative-review';
import { renderMeetingNoteHtml } from '@/lib/portfolio-diagnostic/reports/meeting-note';
import { getOrGenerateNarrative } from '@/lib/portfolio-diagnostic/narrative-engine';

// XLSX, PPTX, and LLM-narrative generation can be slow; allow up to 60s
export const maxDuration = 60;

type ReportType = 'full' | 'action' | 'one-pager' | 'three-pager' | 'xlsx' | 'pptx' | 'narrative' | 'meeting-note';

const VALID_TYPES: ReportType[] = ['full', 'action', 'one-pager', 'three-pager', 'xlsx', 'pptx', 'narrative', 'meeting-note'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get('type') ?? 'full').toLowerCase() as ReportType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Unknown report type: ${type}. Use ?type=full|action|one-pager|three-pager|xlsx|pptx|narrative|meeting-note.` },
      { status: 400 }
    );
  }

  // Auth: either an admin/employee cookie OR a valid share token in ?token=...
  // Token path lets unauthenticated clients open the deliverable link
  // we emailed them. Tokens are bound to (run_id, deliverable_id) and
  // expire after the configured TTL (90 days by default).
  const shareToken = url.searchParams.get('token');
  let authMode: 'session' | 'token' = 'session';

  if (shareToken) {
    const tokenOk = await validateShareToken(shareToken, numericId, type);
    if (!tokenOk) {
      return NextResponse.json(
        { error: 'Share link is invalid, expired, or revoked. Please ask your advisor to resend.' },
        { status: 401 }
      );
    }
    authMode = 'token';
  } else {
    const email = await resolveEmployeeEmail();
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
  }
  // authMode is currently informational; could be used later to inject
  // a "Shared with you by your advisor" banner on client-only views.
  void authMode;

  const data = await loadReportData(numericId);
  if (!data) {
    return NextResponse.json(
      { error: 'Diagnostic not found or has no holdings' },
      { status: 404 }
    );
  }

  // ── Internal-only types — block share-token access ──
  // The meeting note is an advisor pre-call brief; never expose to clients
  // even when a valid share token is present for this diagnostic.
  if (type === 'meeting-note' && authMode === 'token') {
    return NextResponse.json(
      { error: 'Internal document. Not accessible via share links.' },
      { status: 403 }
    );
  }

  // ── LLM-generated narrative + meeting note ──
  // These call into the narrative-engine which may regenerate via Claude
  // if no cached narrative exists. Cached path is fast (<200ms).
  if (type === 'narrative' || type === 'meeting-note') {
    const result = await getOrGenerateNarrative(numericId);
    if (!result.ok || !result.narrative) {
      return NextResponse.json(
        {
          error: result.error ?? 'Could not generate narrative',
          hint: 'Make sure ANTHROPIC_API_KEY is configured on Vercel and the diagnostic has parsed holdings.',
        },
        { status: 500 }
      );
    }
    const html =
      type === 'narrative'
        ? renderNarrativeReviewHtml(data, result.narrative, { showPrintBar: true })
        : renderMeetingNoteHtml(data, result.narrative);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Narrative-From-Cache': result.fromCache ? '1' : '0',
        'X-Narrative-Generation-Ms': String(result.generationMs ?? 0),
      },
    });
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

/**
 * Validate a signed share token. Returns true if the token:
 *   - exists in pd_share_links
 *   - matches the requested diagnostic_run_id
 *   - matches the requested deliverable type (so a Full link cannot be
 *     used to fetch the Action sheet — strict deliverable binding)
 *   - is not expired
 *   - is not revoked
 *
 * Also (best-effort) increments open_count + sets last_opened_at for
 * engagement tracking. Tracking is fire-and-forget; never blocks the
 * download path.
 */
async function validateShareToken(
  token: string,
  runId: number,
  deliverableType: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: row } = await supabase
    .from('pd_share_links')
    .select(
      'id, diagnostic_run_id, deliverable_id, expires_at, revoked_at, open_count, first_opened_at'
    )
    .eq('token', token)
    .maybeSingle();

  if (!row) return false;
  if (row.diagnostic_run_id !== runId) return false;
  if (row.deliverable_id !== deliverableType) return false;
  if (row.revoked_at) return false;
  if (new Date(row.expires_at as string).getTime() < Date.now()) return false;

  // Engagement tracking (fire-and-forget)
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    last_opened_at: now,
    open_count: ((row.open_count as number) ?? 0) + 1,
  };
  if (!row.first_opened_at) updates.first_opened_at = now;
  void supabase.from('pd_share_links').update(updates).eq('id', row.id);

  return true;
}
