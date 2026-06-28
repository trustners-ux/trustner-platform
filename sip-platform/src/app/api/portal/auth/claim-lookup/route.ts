/**
 * GET  /api/portal/auth/claim-lookup?token=...
 *
 * Validates the magic-link token and returns the client's display name +
 * masked mobile/email so the claim page can prompt for OTP verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { lookupInvite } from '@/lib/portal/claim';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskMobile(m: string | null): string | null {
  if (!m) return null;
  // +91XXXXXX1234 → keep last 4
  const last4 = m.slice(-4);
  const head = m.slice(0, 3);
  return `${head}XXXXX${last4}`;
}
function maskEmail(e: string | null): string | null {
  if (!e) return null;
  const [u, d] = e.split('@');
  if (!d) return e;
  if (u.length <= 2) return `${u[0]}*@${d}`;
  return `${u.slice(0, 2)}***@${d}`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim();
  if (!token) return NextResponse.json({ ok: false, reason: 'token required' }, { status: 400 });
  const r = await lookupInvite(token);
  if (!r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({
    ok: true,
    invite_id: r.invite_id,
    client: {
      id: r.client.id,
      code: r.client.code,
      display_name: r.client.display_name,
      mobile_masked: maskMobile(r.client.mobile_primary),
      email_masked: maskEmail(r.client.email_primary),
      has_mobile: !!r.client.mobile_primary,
      has_email: !!r.client.email_primary,
    },
    expires_at: r.expires_at,
  });
}
