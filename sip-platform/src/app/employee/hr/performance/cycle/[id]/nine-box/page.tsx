'use client';

/**
 * Phase 9 — 9-Box Grid.
 *
 * Visual 3×3 grid (perf X potential). Each cell lists the employees in
 * that quadrant. Click an employee to recalibrate (jumps to calibration
 * row, scrolls into view).
 *
 * Endpoint: GET /api/employee/hr/performance/cycles/:id/nine-box
 */
import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Grid3X3, Loader2 } from 'lucide-react';
import { mapNineBox, NINE_BOX_LABELS, NINE_BOX_ACTION, type NineBoxQuadrant } from '@/lib/hr/performance';

interface NineBoxRow {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
  performance_rating: number;
  potential_rating: number;
  quadrant: NineBoxQuadrant | null;
}

const QUADRANT_TONE: Record<NineBoxQuadrant, string> = {
  star:           'bg-emerald-50 border-emerald-200',
  high_pro:       'bg-sky-50 border-sky-200',
  effective:      'bg-cyan-50 border-cyan-200',
  growth:         'bg-violet-50 border-violet-200',
  core:           'bg-amber-50 border-amber-200',
  rising:         'bg-yellow-50 border-yellow-200',
  enigma:         'bg-fuchsia-50 border-fuchsia-200',
  solid:          'bg-orange-50 border-orange-200',
  underperformer: 'bg-rose-50 border-rose-200',
};

const QUAD_BY_POS: Record<string, NineBoxQuadrant> = {
  // row=performance (high/med/low), col=potential (low/med/high)
  'high-low':  'effective',
  'high-med':  'high_pro',
  'high-high': 'star',
  'med-low':   'rising',
  'med-med':   'core',
  'med-high':  'growth',
  'low-low':   'underperformer',
  'low-med':   'solid',
  'low-high':  'enigma',
};

export default function NineBoxPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [rows, setRows] = useState<NineBoxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/nine-box`)
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [cycleId]);

  const byQuadrant = useMemo(() => {
    const m = new Map<NineBoxQuadrant, NineBoxRow[]>();
    for (const r of rows) {
      const q = r.quadrant || mapNineBox(r.performance_rating, r.potential_rating);
      const arr = m.get(q) || [];
      arr.push(r);
      m.set(q, arr);
    }
    return m;
  }, [rows]);

  const rowLabels = ['High', 'Med', 'Low'] as const; // perf
  const colLabels = ['Low', 'Med', 'High'] as const; // potential
  const rowKeys = ['high', 'med', 'low'] as const;
  const colKeys = ['low', 'med', 'high'] as const;

  return (
    <div className="p-8 max-w-7xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
          <Grid3X3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">9-Box Grid</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Performance × Potential. Click an employee to recalibrate.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {/* Header row */}
          <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 mb-1">
            <div />
            {colLabels.map((cl) => (
              <div key={cl} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Potential · {cl}
              </div>
            ))}
          </div>

          {rowKeys.map((rk, ri) => (
            <div key={rk} className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 mb-2">
              <div className="flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Perf · {rowLabels[ri]}
              </div>
              {colKeys.map((ck) => {
                const q = QUAD_BY_POS[`${rk}-${ck}`];
                const cell = byQuadrant.get(q) || [];
                return (
                  <div key={ck} className={`rounded-lg border ${QUADRANT_TONE[q]} p-2 min-h-[120px]`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                      {NINE_BOX_LABELS[q]}
                    </div>
                    <div className="text-[10px] text-slate-500 italic mb-1.5 leading-tight">
                      {NINE_BOX_ACTION[q]}
                    </div>
                    <div className="space-y-0.5">
                      {cell.map((r) => (
                        <Link
                          key={r.employee_id}
                          href={`/employee/hr/performance/cycle/${cycleId}/calibration#emp-${r.employee_id}`}
                          className="block px-1.5 py-1 rounded bg-white/80 hover:bg-white border border-white/0 hover:border-slate-300 text-xs"
                        >
                          <div className="font-medium text-slate-900 truncate">{r.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            P{r.performance_rating} · Pot{r.potential_rating}
                          </div>
                        </Link>
                      ))}
                      {cell.length === 0 && (
                        <div className="text-[10px] text-slate-400 italic px-1">empty</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(NINE_BOX_LABELS) as NineBoxQuadrant[]).map((q) => (
          <div key={q} className={`rounded-lg border ${QUADRANT_TONE[q]} p-3`}>
            <div className="text-xs font-bold text-slate-800">{NINE_BOX_LABELS[q]}</div>
            <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{NINE_BOX_ACTION[q]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
