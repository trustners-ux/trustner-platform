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
 * Security audit P0-1 (Jun 2026). See _security/SECURITY_AUDIT_2026-06-26.md.
 */
import { get } from '@vercel/blob';

/** Read a PRIVATE blob as JSON. Returns null if missing or unreadable. */
export async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  try {
    const res = await get(pathname, { access: 'private', useCache: false });
    if (!res) return null;
    return (await new Response(res.stream).json()) as T;
  } catch {
    return null;
  }
}
