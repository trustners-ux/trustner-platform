'use client';

/**
 * HR Dashboard — Active appraisal cycle tile.
 * Surfaces the current (non-archived, non-published) cycle with status +
 * count of reviews still due. Calls the Performance API; falls back
 * gracefully if no cycle is open.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface CycleTileData {
  cycle_id: number;
  cycle_code: string;
  status: string;
  reviews_due: number;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  goals_open: 'Goals open',
  mid_year: 'Mid-year',
  self_review_open: 'Self-review open',
  manager_review_open: 'Manager review open',
  skip_review_open: 'Skip review open',
  calibration: 'Calibration',
  published: 'Published',
  archived: 'Archived',
};

export default function ActiveCycleTile() {
  const [data, setData] = useState<CycleTileData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/employee/hr/performance/cycles?active=1')
      .then((r) => r.json())
      .then((j) => {
        const rows = (j.rows || []) as Array<{
          id: number;
          cycle_code: string;
          status: string;
          reviews_due?: number;
        }>;
        const active = rows.find((r) => r.status !== 'archived' && r.status !== 'published');
        if (active) {
          setData({
            cycle_id: active.id,
            cycle_code: active.cycle_code,
            status: active.status,
            reviews_due: active.reviews_due ?? 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="block mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
        <div className="h-10" />
      </div>
    );
  }

  if (!data) {
    return (
      <Link
        href="/employee/hr/performance"
        className="block mb-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 p-4 transition group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Performance &amp; Appraisals
              </div>
              <div className="text-sm text-slate-700">
                No active cycle. <b className="underline">Start a new cycle</b> to open KRAs.
              </div>
            </div>
          </div>
          <div className="text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 text-xs font-bold">
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/employee/hr/performance/cycle/${data.cycle_id}`}
      className="block mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100 p-4 transition group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Active appraisal cycle
            </div>
            <div className="text-sm text-slate-800">
              <b>{data.cycle_code}</b>
              <span className="mx-2 text-slate-300">·</span>
              {STATUS_LABEL[data.status] || data.status}
              <span className="mx-2 text-slate-300">·</span>
              <b>{data.reviews_due}</b> reviews due
            </div>
          </div>
        </div>
        <div className="text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 text-xs font-bold">
          Open <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
