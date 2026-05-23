/**
 * Report Queue Store — Vercel Blob-backed storage for maker-checker workflow.
 * Each report has 3 blobs: queue/{id}.json, pdfs/{id}.pdf, data/{id}.json
 */

import { put, list } from '@vercel/blob';
import type { ReportQueueEntry, ReportStatus } from '@/types/report-queue';
import type { FinancialPlanningData } from '@/types/financial-planning';

// ─── ID Generator ───
function generateReportId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `rpt-${ts}-${rand}`;
}

// ─── Create Queue Entry ───
export async function createReportQueueEntry(
  params: {
    userName: string;
    userEmail: string;
    userPhone: string;
    userAge: number;
    userCity: string;
    riskCategory: string;
    totalScore: number;
    grade: string;
    netWorth: number;
    pillarScores: ReportQueueEntry['pillarScores'];
    topActions: string[];
    claudeNarrative: string;
    tier?: ReportQueueEntry['tier'];
  },
  pdfBuffer: Buffer,
  planningData: FinancialPlanningData
): Promise<ReportQueueEntry> {
  const id = generateReportId();

  // Upload PDF to Blob
  const pdfBlob = await put(`reports/pdfs/${id}.pdf`, pdfBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/pdf',
  });

  // Upload planning data to Blob
  const dataBlob = await put(
    `reports/data/${id}.json`,
    JSON.stringify(planningData),
    {
      access: 'public',
      addRandomSuffix: false,
    allowOverwrite: true,
      contentType: 'application/json',
    }
  );

  // Build queue entry
  const entry: ReportQueueEntry = {
    id,
    status: 'pending_review',
    tier: params.tier || 'standard',
    userName: params.userName,
    userEmail: params.userEmail,
    userPhone: params.userPhone,
    userAge: params.userAge,
    userCity: params.userCity,
    riskCategory: params.riskCategory,
    totalScore: params.totalScore,
    grade: params.grade,
    netWorth: params.netWorth,
    pillarScores: params.pillarScores,
    topActions: params.topActions,
    claudeNarrative: params.claudeNarrative,
    editedNarrative: null,
    narrativeVersion: 1,
    pdfBlobUrl: pdfBlob.url,
    dataBlobUrl: dataBlob.url,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    approvedAt: null,
    sentAt: null,
    rejectedAt: null,
    reviewedBy: null,
    approvedBy: null,
    rejectionReason: null,
    adminNotes: null,
    editHistory: [],
    remindersSent: 0,
    lastReminderAt: null,
  };

  // Upload queue entry JSON
  await put(`reports/queue/${id}.json`, JSON.stringify(entry), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  return entry;
}

// ─── List Queue Entries ───
export async function getReportQueue(filter?: {
  status?: ReportStatus;
  search?: string;
}): Promise<ReportQueueEntry[]> {
  const entries: ReportQueueEntry[] = [];

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await list({
      prefix: 'reports/queue/',
      cursor,
      limit: 100,
    });

    for (const blob of result.blobs) {
      try {
        const res = await fetch(blob.url);
        if (!res.ok) continue;
        const entry = (await res.json()) as ReportQueueEntry;
        entries.push(entry);
      } catch {
        console.error(`[ReportQueue] Failed to parse ${blob.pathname}`);
      }
    }

    hasMore = result.hasMore;
    cursor = result.cursor;
  }

  // Apply filters
  let filtered = entries;

  if (filter?.status) {
    filtered = filtered.filter((e) => e.status === filter.status);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.userName.toLowerCase().includes(q) ||
        e.userEmail.toLowerCase().includes(q) ||
        e.userPhone.includes(q)
    );
  }

  // Sort by createdAt descending (newest first)
  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return filtered;
}

// ─── Get Single Entry ───
export async function getReportEntry(
  id: string
): Promise<ReportQueueEntry | null> {
  try {
    const result = await list({ prefix: `reports/queue/${id}.json`, limit: 1 });
    if (result.blobs.length === 0) return null;

    // CRITICAL: cache: 'no-store' + cache-buster to bypass both the platform
    // fetch cache and the Vercel Blob CDN edge cache. Without this, after
    // updateReportEntry writes new JSON to the same path, the next fetch
    // returns the previously-cached JSON for up to 1 year — silently
    // serving the OLD pdfBlobUrl and OLD totalScore even though the entry
    // was correctly updated server-side.
    const bust = `?t=${Date.now()}`;
    const res = await fetch(result.blobs[0].url + bust, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ReportQueueEntry;
  } catch {
    console.error(`[ReportQueue] Failed to get entry ${id}`);
    return null;
  }
}

// ─── Update Entry ───
export async function updateReportEntry(
  id: string,
  updates: Partial<ReportQueueEntry>
): Promise<ReportQueueEntry | null> {
  const entry = await getReportEntry(id);
  if (!entry) return null;

  const updated: ReportQueueEntry = { ...entry, ...updates, id: entry.id };

  // cacheControlMaxAge: 30 → CDN re-validates every 30s instead of
  // holding the JSON for the 1-year default. Combined with the
  // no-store/cache-buster on reads, this gives near-immediate consistency.
  await put(`reports/queue/${id}.json`, JSON.stringify(updated), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 30,
  });

  return updated;
}

// ─── Get Planning Data (for regeneration) ───
export async function getReportPlanningData(
  id: string
): Promise<FinancialPlanningData | null> {
  try {
    const result = await list({ prefix: `reports/data/${id}.json`, limit: 1 });
    if (result.blobs.length === 0) return null;

    // Cache-buster + no-store to bypass BOTH the platform fetch cache and
    // the Vercel Blob CDN edge cache. The blob URL stays the same across
    // overwrites (no random suffix), so without this the read returns
    // pre-Apply JSON for hours, silently ignoring the scenario override.
    const bust = `?t=${Date.now()}`;
    const res = await fetch(result.blobs[0].url + bust, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as FinancialPlanningData;
  } catch {
    console.error(`[ReportQueue] Failed to get planning data for ${id}`);
    return null;
  }
}

// ─── Update Planning Data (for what-if scenario editing) ───
export async function saveReportPlanningData(
  id: string,
  data: FinancialPlanningData
): Promise<void> {
  await put(`reports/data/${id}.json`, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 30,
  });
}

// ─── Get PDF Buffer ───
//
// Returns the LATEST PDF for this report. Versioned PDFs are stored at
// `reports/pdfs/<id>-v<N>-<timestamp>.pdf`, and the original (pre-versioning)
// is at `reports/pdfs/<id>.pdf`. We list everything under the `<id>` prefix
// and pick the newest by `uploadedAt`. The fetch uses `cache: 'no-store'`
// + a cache-buster to bypass the Vercel Blob CDN edge cache.
export async function getReportPdf(id: string): Promise<Buffer | null> {
  try {
    const result = await list({ prefix: `reports/pdfs/${id}`, limit: 50 });
    // Keep only .pdf files (in case anything else slipped under the prefix)
    const pdfs = result.blobs.filter((b) => b.pathname.endsWith('.pdf'));
    if (pdfs.length === 0) return null;
    // Newest first
    pdfs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    const latest = pdfs[0];

    const bust = `?t=${Date.now()}`;
    const res = await fetch(latest.url + bust, { cache: 'no-store' });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    console.error(`[ReportQueue] Failed to get PDF for ${id}`);
    return null;
  }
}

// ─── Update PDF in Blob ───
//
// IMPORTANT: We write each regenerated PDF to a VERSIONED path
// (`reports/pdfs/<id>-v<N>-<ts>.pdf`) instead of overwriting the same
// `<id>.pdf`. Reason: Vercel Blob serves public files with a long-lived
// CDN cache, and even with `allowOverwrite: true` the CDN can keep
// returning the previously-cached bytes for hours. Versioning the path
// guarantees a brand-new URL on every regenerate, so the admin (and the
// client, once shared) ALWAYS see the freshly rendered PDF.
//
// We also set `cacheControlMaxAge: 60` so even the new URL refreshes
// quickly if it ever gets overwritten by an in-flight retry.
export async function updateReportPdf(
  id: string,
  pdfBuffer: Buffer,
  versionTag?: string,
): Promise<string> {
  const tag = versionTag || `v${Date.now()}`;
  const path = `reports/pdfs/${id}-${tag}.pdf`;
  const blob = await put(path, pdfBuffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/pdf',
    cacheControlMaxAge: 60,
  });
  return blob.url;
}

// ─── Get Stale Reports (for reminders) ───
export async function getStaleReports(
  thresholdMinutes: number
): Promise<ReportQueueEntry[]> {
  const all = await getReportQueue({ status: 'pending_review' });
  const now = Date.now();

  return all.filter((entry) => {
    const age = (now - new Date(entry.createdAt).getTime()) / (1000 * 60);
    return age > thresholdMinutes && entry.remindersSent < 3;
  });
}
