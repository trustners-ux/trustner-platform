/**
 * GET /api/admin/portfolio-diagnostic/deleted
 *
 * Admin-only recovery view: lists soft-deleted diagnostic runs (most-recently
 * deleted first) with who/when/why so an admin can decide whether to restore.
 * Mirrors the DELETE endpoint's admin-token gate — reviewers never see this.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextResponse } from 'next/server';
import { getDeletedRuns } from '@/lib/portfolio-diagnostic/queries';
import { requirePdAdmin } from '@/lib/portfolio-diagnostic/access-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Same gate as DELETE / RESTORE — admin JWT or employee session for admins.
  const admin = await requirePdAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'The recycle bin is restricted to admin accounts.' },
      { status: 403 }
    );
  }

  const items = await getDeletedRuns(50);
  return NextResponse.json({ items });
}
