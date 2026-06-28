/*
 * MeraSIP service worker — v2, "always fresh".
 *
 * This is a logged-in workspace with live data: correctness beats offline
 * speed, and a stale cached bundle showing an old/broken UI is the worst
 * outcome. So this SW caches NOTHING except the offline fallback page and is
 * a pure NETWORK pass-through for everything else — it can never serve a stale
 * script or stale data. On activation it deletes ALL previously-created caches
 * (healing any client that picked up the older caching SW), then takes control.
 *
 * Bump VERSION on any future change to force every client to update.
 */
const VERSION = 'v2';
const SHELL = 'merasip-shell-' + VERSION;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Nuke EVERY cache (including the old v1 static cache) so no stale asset
    // can ever be served again, then take control of open pages immediately.
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigations → network-first; offline page only when truly offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  // Everything else (scripts, styles, images, RSC payloads) → straight to the
  // network. No caching ⇒ no possibility of a stale JS chunk breaking the UI.
});
