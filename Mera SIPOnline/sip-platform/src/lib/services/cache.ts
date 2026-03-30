/* ─────────────────────────────────────────────────────────
   Generic TTL Cache for Vercel Serverless

   In-memory Map-based cache with configurable TTL per
   namespace. Each namespace has its own store, so fund
   detail cache doesn't collide with search cache, etc.

   Note: In serverless, each instance has its own cache.
   This is intentional — it reduces API calls within a
   single instance's lifetime without needing Redis/KV.
   ───────────────────────────────────────────────────────── */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

/** Map of namespace -> (key -> entry) */
const stores = new Map<string, Map<string, CacheEntry<unknown>>>();

/** Get or create a cache store for a given namespace */
function getStore(namespace: string): Map<string, CacheEntry<unknown>> {
  if (!stores.has(namespace)) stores.set(namespace, new Map());
  return stores.get(namespace)!;
}

// ─── TTL Constants (milliseconds) ───

export const CACHE_TTL = {
  fundDetail: 6 * 60 * 60 * 1000,     // 6 hours
  search: 30 * 60 * 1000,              // 30 min
  navHistory: 24 * 60 * 60 * 1000,     // 24 hours
  topPerformers: 12 * 60 * 60 * 1000,  // 12 hours
  categories: 24 * 60 * 60 * 1000,     // 24 hours
} as const;

/**
 * Retrieve a cached value if it exists and hasn't expired.
 * Returns null on cache miss or expiry.
 */
export function cacheGet<T>(namespace: string, key: string, ttl: number): T | null {
  const store = getStore(namespace);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store a value in the cache. Automatically evicts the
 * oldest entry if the store exceeds 5000 entries to
 * prevent unbounded memory growth in long-lived instances.
 */
export function cacheSet<T>(namespace: string, key: string, data: T): void {
  const store = getStore(namespace);
  store.set(key, { data, ts: Date.now() });
  // Evict oldest entry if store gets too large (prevent memory leak)
  if (store.size > 5000) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
}
