/**
 * Lightweight in-memory rate limiter — token-bucket style.
 *
 * Vercel serverless instances are short-lived and per-region, so this is a
 * best-effort defence (one attacker hitting a cold region's first instance
 * gets a fresh bucket). Good enough to stop credential-stuffing /
 * password-lockout-spam from a single client. Upgrade to Vercel KV or
 * Upstash when we add cross-region durability.
 *
 * Usage:
 *   const rl = rateLimit({ windowMs: 60_000, max: 5 });
 *   const ok = rl.check(`login:${ip}:${email}`);
 *   if (!ok) return 429;
 */
type Bucket = { count: number; resetAt: number };
const STORE = new Map<string, Bucket>();
const MAX_STORE_SIZE = 10_000;

function gc(now: number) {
  if (STORE.size < MAX_STORE_SIZE) return;
  for (const [k, b] of STORE) {
    if (b.resetAt <= now) STORE.delete(k);
  }
}

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  return {
    /**
     * Returns true if the request is allowed, false if rate-limited.
     * Increments the counter on each call.
     */
    check(key: string): { ok: boolean; remaining: number; retryAfter: number } {
      const now = Date.now();
      gc(now);
      const b = STORE.get(key);
      if (!b || b.resetAt <= now) {
        STORE.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: max - 1, retryAfter: 0 };
      }
      if (b.count >= max) {
        return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
      }
      b.count += 1;
      return { ok: true, remaining: max - b.count, retryAfter: 0 };
    },
    /**
     * Read-only peek — useful when you want to consult the limit without
     * incrementing (e.g. log-only mode).
     */
    peek(key: string): { count: number; remaining: number } {
      const b = STORE.get(key);
      if (!b || b.resetAt <= Date.now()) return { count: 0, remaining: max };
      return { count: b.count, remaining: Math.max(0, max - b.count) };
    },
  };
}

/**
 * Extract a best-effort client identifier from request headers.
 * Vercel sets `x-forwarded-for` and `x-real-ip`; fall back to a fixed
 * sentinel so we still apply a (weaker) global ceiling.
 */
export function clientIp(req: Request): string {
  // Vercel's edge sets x-real-ip to the true client IP (not client-spoofable);
  // prefer it. For x-forwarded-for, take the LAST hop (the proxy-appended,
  // trustworthy entry) — never the FIRST, which any client can forge to evade
  // a per-IP rate limit.
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}
