import { put } from '@vercel/blob';

const META_URL = 'https://t5fcpdqiy43k9qwb.public.blob.vercel-storage.com/gallery/metadata.json?t=' + Date.now();

// Fetch current metadata
const res = await fetch(META_URL, { cache: 'no-store' });
if (!res.ok) { console.error('Failed to fetch metadata:', res.status); process.exit(1); }
const meta = await res.json();

const target = 'gallery/team-1772728061964.jpg';
const before = meta[target]?.caption;
if (!before) {
  console.error('Target entry not found in metadata');
  process.exit(1);
}
console.log('Before:', JSON.stringify(before));

// MFD-compliant replacement — generic industry-recognition framing, no "Advisory"
meta[target].caption = 'Industry recognition received by Trustner at the annual awards ceremony';

console.log('After: ', JSON.stringify(meta[target].caption));

const blob = await put('gallery/metadata.json', JSON.stringify(meta, null, 2), {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json',
  cacheControlMaxAge: 30,
  token: process.env.BLOB_READ_WRITE_TOKEN,
});

console.log('Updated metadata.json at:', blob.url);
