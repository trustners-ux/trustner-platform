import { put } from '@vercel/blob';
// Use the known direct blob URL with cache-buster instead of list+fetch (which timed out)
const url = 'https://t5fcpdqiy43k9qwb.public.blob.vercel-storage.com/reports/queue/rpt-1777445293712-0vkgye.json?t=' + Date.now();
const res = await fetch(url, { cache: 'no-store' });
if (!res.ok) { console.error('fetch failed:', res.status); process.exit(1); }
const d = await res.json();
console.log('Current status:', d.status, 'version:', d.narrativeVersion);
d._origStatus = d.status;
d.status = 'pending_review';
const blob = await put('reports/queue/rpt-1777445293712-0vkgye.json', JSON.stringify(d), {
  access: 'public', addRandomSuffix: false, allowOverwrite: true,
  contentType: 'application/json', cacheControlMaxAge: 30,
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log('Rolled back. URL:', blob.url);
