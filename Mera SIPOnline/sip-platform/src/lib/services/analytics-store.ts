import { put, list } from '@vercel/blob';

/* ─── Types ─── */
export interface PageView {
  path: string;
  referrer: string;
  userAgent: string;
  timestamp: number; // ms epoch
  date: string; // YYYY-MM-DD
}

export interface DailyStats {
  date: string;
  totalViews: number;
  uniquePaths: number;
  pages: Record<string, number>; // path -> count
  referrers: Record<string, number>;
  devices: { desktop: number; mobile: number; tablet: number };
  topPages: { path: string; views: number }[];
}

/* ─── Constants ─── */
const BLOB_PREFIX = 'analytics';
const BATCH_SIZE = 50; // Flush buffer every N views
const FLUSH_INTERVAL_MS = 60_000; // Or every 60 seconds

/* ─── In-memory buffer for batching writes ─── */
let viewBuffer: PageView[] = [];
let lastFlush = Date.now();

function detectDevice(ua: string): 'desktop' | 'mobile' | 'tablet' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|opera m(ob|in)i/i.test(ua)) return 'mobile';
  return 'desktop';
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ─── Record a page view ─── */
export async function recordPageView(view: Omit<PageView, 'timestamp' | 'date'>): Promise<void> {
  const pv: PageView = {
    ...view,
    timestamp: Date.now(),
    date: todayKey(),
  };

  viewBuffer.push(pv);

  // Flush if buffer is large enough or enough time has passed
  if (viewBuffer.length >= BATCH_SIZE || Date.now() - lastFlush > FLUSH_INTERVAL_MS) {
    await flushBuffer();
  }
}

/* ─── Flush buffer to Vercel Blob ─── */
async function flushBuffer(): Promise<void> {
  if (viewBuffer.length === 0) return;

  const toFlush = [...viewBuffer];
  viewBuffer = [];
  lastFlush = Date.now();

  // Group views by date
  const byDate: Record<string, PageView[]> = {};
  for (const pv of toFlush) {
    if (!byDate[pv.date]) byDate[pv.date] = [];
    byDate[pv.date].push(pv);
  }

  // Merge into existing daily stats for each date
  for (const [date, views] of Object.entries(byDate)) {
    const blobName = `${BLOB_PREFIX}/daily/${date}.json`;

    // Try to read existing stats
    let stats: DailyStats;
    try {
      const existing = await fetchBlobJson<DailyStats>(blobName);
      stats = existing || createEmptyStats(date);
    } catch {
      stats = createEmptyStats(date);
    }

    // Merge new views
    for (const pv of views) {
      stats.totalViews++;
      stats.pages[pv.path] = (stats.pages[pv.path] || 0) + 1;

      // Referrer
      const refDomain = extractDomain(pv.referrer);
      if (refDomain) {
        stats.referrers[refDomain] = (stats.referrers[refDomain] || 0) + 1;
      }

      // Device
      const device = detectDevice(pv.userAgent);
      stats.devices[device]++;
    }

    // Rebuild top pages
    stats.uniquePaths = Object.keys(stats.pages).length;
    stats.topPages = Object.entries(stats.pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, views: count }));

    // Write back
    await put(blobName, JSON.stringify(stats), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
  }
}

/* ─── Get stats for a date range ─── */
export async function getAnalytics(
  days: number = 30
): Promise<{ daily: DailyStats[]; summary: AnalyticsSummary }> {
  const dailyStats: DailyStats[] = [];
  const today = new Date();

  // Flush any pending views first
  await flushBuffer();

  // Fetch daily stats for the requested range
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const blobName = `${BLOB_PREFIX}/daily/${dateStr}.json`;

    try {
      const stats = await fetchBlobJson<DailyStats>(blobName);
      if (stats) dailyStats.push(stats);
    } catch {
      // No data for this day — skip
    }
  }

  // Build summary
  const summary = buildSummary(dailyStats);

  return { daily: dailyStats.sort((a, b) => a.date.localeCompare(b.date)), summary };
}

export interface AnalyticsSummary {
  totalViews: number;
  todayViews: number;
  yesterdayViews: number;
  thisWeekViews: number;
  thisMonthViews: number;
  avgDailyViews: number;
  topPages: { path: string; views: number }[];
  topReferrers: { domain: string; visits: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  trend: number; // % change vs previous period
}

function buildSummary(dailyStats: DailyStats[]): AnalyticsSummary {
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Weekly boundary
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  // Monthly boundary
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  let totalViews = 0;
  let todayViews = 0;
  let yesterdayViews = 0;
  let thisWeekViews = 0;
  let thisMonthViews = 0;
  const allPages: Record<string, number> = {};
  const allReferrers: Record<string, number> = {};
  const devices = { desktop: 0, mobile: 0, tablet: 0 };

  for (const s of dailyStats) {
    totalViews += s.totalViews;
    if (s.date === today) todayViews = s.totalViews;
    if (s.date === yesterdayStr) yesterdayViews = s.totalViews;
    if (s.date >= weekAgoStr) thisWeekViews += s.totalViews;
    if (s.date >= monthAgoStr) thisMonthViews += s.totalViews;

    for (const [path, count] of Object.entries(s.pages)) {
      allPages[path] = (allPages[path] || 0) + count;
    }
    for (const [ref, count] of Object.entries(s.referrers)) {
      allReferrers[ref] = (allReferrers[ref] || 0) + count;
    }
    devices.desktop += s.devices.desktop;
    devices.mobile += s.devices.mobile;
    devices.tablet += s.devices.tablet;
  }

  // Trend: compare last 7 days vs previous 7 days
  const last7 = dailyStats
    .filter((s) => s.date >= weekAgoStr)
    .reduce((sum, s) => sum + s.totalViews, 0);
  const prev7Ago = new Date();
  prev7Ago.setDate(prev7Ago.getDate() - 14);
  const prev7AgoStr = prev7Ago.toISOString().slice(0, 10);
  const prev7 = dailyStats
    .filter((s) => s.date >= prev7AgoStr && s.date < weekAgoStr)
    .reduce((sum, s) => sum + s.totalViews, 0);
  const trend = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

  return {
    totalViews,
    todayViews,
    yesterdayViews,
    thisWeekViews,
    thisMonthViews,
    avgDailyViews: dailyStats.length > 0 ? Math.round(totalViews / dailyStats.length) : 0,
    topPages: Object.entries(allPages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, views]) => ({ path, views })),
    topReferrers: Object.entries(allReferrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, visits]) => ({ domain, visits })),
    deviceBreakdown: devices,
    trend,
  };
}

/* ─── Helpers ─── */
function createEmptyStats(date: string): DailyStats {
  return {
    date,
    totalViews: 0,
    uniquePaths: 0,
    pages: {},
    referrers: {},
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    topPages: [],
  };
}

function extractDomain(referrer: string): string {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    // Skip own domain
    if (url.hostname.includes('merasip.com')) return '';
    return url.hostname.replace('www.', '');
  } catch {
    return 'Direct';
  }
}

async function fetchBlobJson<T>(blobName: string): Promise<T | null> {
  try {
    const blobs = await list({ prefix: blobName });
    if (blobs.blobs.length === 0) return null;
    const response = await fetch(blobs.blobs[0].url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
