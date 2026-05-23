import { put } from '@vercel/blob';
import fs from 'fs';
const data = fs.readFileSync('/tmp/randeep-fixed.json', 'utf8');
const blob = await put('reports/data/rpt-1777445293712-0vkgye.json', data, {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json',
  cacheControlMaxAge: 30,
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log('Uploaded:', blob.url);
