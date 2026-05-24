/**
 * Admin Client Family Detail API
 *
 * GET /api/admin/clients/[id]
 *
 * Returns the family + complete artefact timeline (all PD diagnostics,
 * meeting briefs, investment proposals, client orientations, periodic
 * reviews) AND the most recent 100 audit-views of any of those
 * artefacts.
 *
 * Auth: same as /api/admin/clients (any authenticated employee for now;
 * full visibility scoping comes later when families have owner RMs).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const familyId = parseInt(id, 10);
  if (Number.isNaN(familyId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Base family record
  const { data: family } = await supabase
    .from('pd_client_families')
    .select('*')
    .eq('id', familyId)
    .maybeSingle();
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // All artefacts
  const [diagnostics, briefs, proposals, orientations, reviews, entities] = await Promise.all([
    supabase
      .from('pd_diagnostic_runs')
      .select(
        `id, document_id, status, created_at, updated_at, approved_at, published_at,
         total_invested_inr, current_value_inr, family_xirr_pct, num_holdings,
         num_active_sips, verdict_swap_count,
         uploader:employees!pd_diagnostic_runs_uploaded_by_employee_id_fkey(name),
         reviewer:employees!pd_diagnostic_runs_current_reviewer_employee_id_fkey(name)`
      )
      .eq('family_id', familyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('mp_meeting_briefs')
      .select('id, created_at, updated_at, status, meeting_date')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('ip_investment_proposals')
      .select('id, created_at, updated_at, status, target_aum_inr')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('co_client_orientations')
      .select('id, created_at, updated_at, status, completed_at')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pr_periodic_reviews')
      .select('id, created_at, updated_at, status, review_period')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pd_family_entities')
      .select('id, entity_name, entity_type')
      .eq('family_id', familyId),
  ]);

  // Audit log — who viewed this family's artefacts
  const pdIds = (diagnostics.data ?? []).map((d) => d.id as number);
  let auditTrail: Array<{
    id: number;
    viewedAt: string;
    viewerName: string;
    artefactType: string;
    artefactId: number;
  }> = [];
  if (pdIds.length > 0) {
    const { data: views } = await supabase
      .from('app_artefact_views')
      .select(
        `id, viewed_at, artefact_type, artefact_id,
         viewer:employees!app_artefact_views_viewer_employee_id_fkey(name)`
      )
      .eq('artefact_type', 'portfolio_diagnostic')
      .in('artefact_id', pdIds)
      .order('viewed_at', { ascending: false })
      .limit(100);
    auditTrail = (views ?? []).map((v) => {
      const viewerObj = (v as { viewer?: unknown }).viewer;
      const viewer = Array.isArray(viewerObj) ? viewerObj[0] : viewerObj;
      return {
        id: v.id as number,
        viewedAt: v.viewed_at as string,
        viewerName: (viewer as { name?: string } | undefined)?.name ?? '—',
        artefactType: v.artefact_type as string,
        artefactId: v.artefact_id as number,
      };
    });
  }

  const extractName = (e: unknown): string | null => {
    if (!e) return null;
    const o = Array.isArray(e) ? e[0] : e;
    return (o as { name?: string } | undefined)?.name ?? null;
  };

  return NextResponse.json({
    family: {
      id: family.id,
      familyCode: family.family_code,
      familyName: family.family_name,
      primaryContactName: family.primary_contact_name,
      primaryContactEmail: family.primary_contact_email,
      primaryContactMobile: family.primary_contact_mobile,
      segment: family.segment,
      notes: family.notes,
      createdAt: family.created_at,
      updatedAt: family.updated_at,
    },
    entities: (entities.data ?? []).map((e) => ({
      id: e.id, name: e.entity_name, type: e.entity_type,
    })),
    diagnostics: (diagnostics.data ?? []).map((d) => ({
      id: d.id,
      documentId: d.document_id,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      approvedAt: d.approved_at,
      publishedAt: d.published_at,
      totalInvestedInr: Number(d.total_invested_inr) || 0,
      currentValueInr: Number(d.current_value_inr) || 0,
      familyXirrPct: d.family_xirr_pct,
      numHoldings: d.num_holdings,
      numActiveSips: d.num_active_sips,
      verdictSwapCount: d.verdict_swap_count,
      uploadedByName: extractName(d.uploader),
      reviewerName: extractName(d.reviewer),
    })),
    briefs: (briefs.data ?? []).map((b) => ({
      id: b.id, createdAt: b.created_at, status: b.status, meetingDate: b.meeting_date,
    })),
    proposals: (proposals.data ?? []).map((p) => ({
      id: p.id, createdAt: p.created_at, status: p.status,
      targetAumInr: Number(p.target_aum_inr) || 0,
    })),
    orientations: (orientations.data ?? []).map((o) => ({
      id: o.id, createdAt: o.created_at, status: o.status, completedAt: o.completed_at,
    })),
    reviews: (reviews.data ?? []).map((r) => ({
      id: r.id, createdAt: r.created_at, status: r.status, reviewPeriod: r.review_period,
    })),
    auditTrail,
  });
}

async function authorize(): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
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
  if (APPROVER_EMAILS.includes(email.toLowerCase())) return { allowed: true };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };
  const { data: empRow } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!empRow?.id) return { allowed: false, status: 403, reason: 'Employee row not found' };
  return { allowed: true };
}
