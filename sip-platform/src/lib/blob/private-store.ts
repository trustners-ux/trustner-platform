/**
 * Private Vercel Blob helpers.
 *
 * PII (leads, client report data/metadata) must NOT live in `access:'public'`
 * blobs: their URLs are guessable from a deterministic path + the store id,
 * and the store id leaks through legitimately-public blobs (gallery, NAV).
 * These helpers read blobs written with `access:'private'`, which require the
 * BLOB_READ_WRITE_TOKEN to fetch — so an external URL guess can no longer read
 * them. `useCache:false` also fetches fresh from origin, which removes the
 * CDN-stale-read problem the old public path fought with cache-busters.
 *
 * IMPORTANT: this project's original Blob store ("gallery-store") was created
 * public-access-only — Vercel rejects `access:'private'` writes against a
 * public store outright. The original P0-1 fix (Jun 26 2026) assumed private
 * writes would just work and shipped without catching this, so every private
 * write since has been silently failing (caught by callers' try/catch),
 * freezing the leads/report-data blobs at their last pre-fix state. Fixed
 * Jul 1 2026 by provisioning a second, genuinely private-access store
 * ("sip-platform-private") and routing all private reads/writes through its
 * dedicated token (env `PRIVATE_BLOB_READ_WRITE_TOKEN`) instead of the
 * default `BLOB_READ_WRITE_TOKEN`, which is bound to the public store.
 *
 * Security audit P0-1 (Jun 2026), storage-architecture fix (Jul 2026). See
 * _security/SECURITY_AUDIT_2026-06-26.md.
 */
import { get, put } from '@vercel/blob';

const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

/** Read a PRIVATE blob as JSON. Returns null if missing or unreadable. */
export async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  try {
    const res = await get(pathname, { access: 'private', useCache: false, token: PRIVATE_TOKEN });
    if (!res) return null;
    return (await new Response(res.stream).json()) as T;
  } catch {
    return null;
  }
}

/** Write JSON to a PRIVATE blob at a fixed pathname (overwriting any prior value). */
export async function writePrivateJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token: PRIVATE_TOKEN,
  });
}
