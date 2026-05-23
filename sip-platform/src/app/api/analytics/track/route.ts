import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/services/analytics-store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer } = body as { path?: string; referrer?: string };

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    // Skip admin pages and API routes from tracking
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    const userAgent = req.headers.get('user-agent') || '';

    // Skip bots
    if (/bot|crawl|spider|slurp|facebook|twitter|whatsapp|telegram|preview/i.test(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    await recordPageView({
      path,
      referrer: referrer || '',
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ ok: true }); // Fail silently
  }
}
