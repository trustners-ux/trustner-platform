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
    contentType: 'application/pdf',
  });

  // Upload planning data to Blob
  const dataBlob = await put(
    `reports/data/${id}.json`,
    JSON.stringify(planningData),
    {
      access: 'public',
      addRandomSuffix: false,
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

    const res = await fetch(result.blobs[0].url);
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

  await put(`reports/queue/${id}.json`, JSON.stringify(updated), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
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

    const res = await fetch(result.blobs[0].url);
    if (!res.ok) return null;
    return (await res.json()) as FinancialPlanningData;
  } catch {
    console.error(`[ReportQueue] Failed to get planning data for ${id}`);
    return null;
  }
}

// ─── Get PDF Buffer ───
export async function getReportPdf(id: string): Promise<Buffer | null> {
  try {
    const result = await list({ prefix: `reports/pdfs/${id}.pdf`, limit: 1 });
    if (result.blobs.length === 0) return null;

    const res = await fetch(result.blobs[0].url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    console.error(`[ReportQueue] Failed to get PDF for ${id}`);
    return null;
  }
}

// ─── Update PDF in Blob ───
export async function updateReportPdf(
  id: string,
  pdfBuffer: Buffer
): Promise<string> {
  const blob = await put(`reports/pdfs/${id}.pdf`, pdfBuffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/pdf',
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
