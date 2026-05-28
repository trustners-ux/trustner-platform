/**
 * Financial Planning — Public CAS PDF Parse API
 *
 * Accepts a multipart form with a CAS PDF and optional password from the
 * Comprehensive wizard. NO admin auth required — this is part of the public
 * questionnaire flow. The user uploading their own CAS is implicit consent.
 *
 * Differences from /api/admin/portfolio-diagnostic/parse-cas:
 *   - No auth check
 *   - Smaller size cap (5 MB vs 10 MB) to discourage abuse
 *   - Basic per-IP rate limit (10 parses / hour)
 *   - Strips PAN from response before returning (privacy)
 *
 * Route: POST /api/financial-planning/parse-cas
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseCasPdf } from '@/lib/portfolio-diagnostic/cas-parser';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — tighter than admin (10 MB)

// ─── Naive in-memory IP rate limiter ──────────────────────────────────────
// 10 parses per IP per rolling hour. State resets on cold start; that's an
// acceptable tradeoff since this isn't a security-critical limit, just an
// abuse damper. For production-grade rate limiting we'd want Upstash / KV.
interface RateLimitEntry { count: number; firstHitAt: number }
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.firstHitAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstHitAt: now });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetMs: RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, resetMs: RATE_LIMIT_WINDOW_MS - (now - entry.firstHitAt) };
  }
  entry.count += 1;
  return { ok: true, remaining: RATE_LIMIT_MAX - entry.count, resetMs: RATE_LIMIT_WINDOW_MS - (now - entry.firstHitAt) };
}

function clientIp(request: NextRequest): string {
  // Vercel sets x-forwarded-for / x-real-ip. Fall back to a constant key
  // (which effectively makes the limit global — fine for cold-start scenarios).
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many parse requests. Try again in ${Math.ceil(rl.resetMs / 60000)} minutes.`,
      },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 5 MB for the public wizard).' },
        { status: 400 },
      );
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'File must be a PDF' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const trimmedPassword = (password ?? '').trim();
    const result = await parseCasPdf({
      pdfBuffer,
      password: trimmedPassword.length > 0 ? trimmedPassword : undefined,
    });

    // Privacy: strip PAN from response. The wizard doesn't need it — we only
    // care about holdings + SIPs. Also strip investorName since the user
    // is already providing that separately on the form.
    if (result.success) {
      return NextResponse.json({
        ...result,
        pan: undefined,
        investorName: undefined,
      });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: `Server error: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
