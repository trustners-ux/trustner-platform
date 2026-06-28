/**
 * Portfolio Diagnostic — Oversight assignment admin API.
 *
 * Manages pd_review_assignments: explicit "reviewer X can view + help person Y"
 * grants that sit OUTSIDE the HR reporting tree (migration 045). This is the
 * self-service replacement for editing the table by script.
 *
 *   GET    → { reviewers, subjects, assignments }   (everything needed to render)
 *   POST   → { reviewerEmployeeId, subjectEmployeeId, note? }  add/reactivate
 *   DELETE → { reviewerEmployeeId, subjectEmployeeId }         deactivate
 *
 * Admin-only (admin JWT), mirroring the DELETE/restore gate. Additive model: an
 * assignment only ever WIDENS what a reviewer can see (see getVisibleEmployeeIds).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requirePdAdmin as requireAdmin } from '@/lib/portfolio-diagnostic/access-admin';

export const dynamic = 'force-dynamic';

interface RoleRow {
  employee_id: number;
  can_access_pd: boolean | null;
  role: { name: string; can_review: boolean } | { name: string; can_review: boolean }[] | null;
  emp: { name: string; email: string } | { name: string; email: string }[] | null;
}
function pick<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Oversight management is admin-only.' }, { status: 403 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const { data: roles } = await sb
    .from('pd_employee_roles')
    .select('employee_id, can_access_pd, role:pd_roles(name, can_review), emp:employees(name, email)')
    .eq('is_active', true);

  const reviewers: { employeeId: number; name: string; roleName: string }[] = [];
  const subjects: { employeeId: number; name: string; roleName: string }[] = [];
  for (const r of (roles ?? []) as RoleRow[]) {
    const role = pick(r.role); const emp = pick(r.emp);
    if (!emp) continue;
    const entry = { employeeId: r.employee_id, name: emp.name, roleName: role?.name ?? '—' };
    if (r.can_access_pd !== false) subjects.push(entry);
    if (role?.can_review) reviewers.push(entry);
  }
  reviewers.sort((a, b) => a.name.localeCompare(b.name));
  subjects.sort((a, b) => a.name.localeCompare(b.name));

  const { data: a } = await sb
    .from('pd_review_assignments')
    .select('reviewer_employee_id, subject_employee_id, note')
    .eq('is_active', true);
  const assignments = (a ?? []).map((x) => ({
    reviewerEmployeeId: x.reviewer_employee_id as number,
    subjectEmployeeId: x.subject_employee_id as number,
    note: (x.note as string | null) ?? null,
  }));

  return NextResponse.json({ reviewers, subjects, assignments });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin-only.' }, { status: 403 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const reviewerEmployeeId = Number(body.reviewerEmployeeId);
  const subjectEmployeeId = Number(body.subjectEmployeeId);
  const note = (body.note as string | undefined)?.slice(0, 200) ?? null;
  if (!reviewerEmployeeId || !subjectEmployeeId) {
    return NextResponse.json({ error: 'reviewerEmployeeId and subjectEmployeeId are required' }, { status: 400 });
  }
  if (reviewerEmployeeId === subjectEmployeeId) {
    return NextResponse.json({ error: 'A reviewer cannot be assigned to oversee themselves.' }, { status: 400 });
  }

  const { data: actor } = await sb.from('employees').select('id').ilike('email', admin.email.trim()).maybeSingle();

  // Re-activate if a (possibly inactive) row already exists; else insert.
  const existing = (await sb
    .from('pd_review_assignments')
    .select('id')
    .eq('reviewer_employee_id', reviewerEmployeeId)
    .eq('subject_employee_id', subjectEmployeeId)
    .maybeSingle()).data;

  if (existing?.id) {
    const { error } = await sb.from('pd_review_assignments')
      .update({ is_active: true, note }).eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from('pd_review_assignments').insert({
      reviewer_employee_id: reviewerEmployeeId,
      subject_employee_id: subjectEmployeeId,
      assigned_by_employee_id: (actor?.id as number) ?? null,
      note,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin-only.' }, { status: 403 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const reviewerEmployeeId = Number(body.reviewerEmployeeId);
  const subjectEmployeeId = Number(body.subjectEmployeeId);
  if (!reviewerEmployeeId || !subjectEmployeeId) {
    return NextResponse.json({ error: 'reviewerEmployeeId and subjectEmployeeId are required' }, { status: 400 });
  }
  const { error } = await sb.from('pd_review_assignments')
    .update({ is_active: false })
    .eq('reviewer_employee_id', reviewerEmployeeId)
    .eq('subject_employee_id', subjectEmployeeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
