/**
 * GET /api/funds/by-amfi/[amfi_code]/nav-history
 *
 * Proxies the MFAPI.in scheme-history feed. AMFI code is the same identifier
 * that MFAPI uses for its `/mf/<code>` endpoint, so this is a clean passthrough
 * with a 24-hour ISR/CDN cache.
 *
 * Response shape (verbatim from MFAPI):
 *   { meta: {...}, data: [{ date: 'DD-MM-YYYY', nav: '123.45' }, ...] }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400; // 24 hours

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ amfi_code: string }> }
) {
  const { amfi_code } = await params;

  if (!/^[0-9]{4,7}$/.test(amfi_code)) {
    return NextResponse.json(
      { error: 'Invalid amfi_code — expected 4-7 digit numeric' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`https://api.mfapi.in/mf/${amfi_code}`, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream MFAPI returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const json = await upstream.json();
    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to fetch NAV history',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
