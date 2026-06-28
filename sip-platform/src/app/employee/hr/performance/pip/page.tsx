'use client';

/**
 * Phase 9 — PIP Register.
 *
 * Lists all open Performance Improvement Plans across cycles. Per PIP:
 * 30/60/90 milestone status + outcome action (extend / close as succeeded
 * / close as failed → hands off to Phase 8 Exit).
 *
 * Endpoints:
 *  GET  /api/employee/hr/performance/pip
 *  POST /api/employee/hr/performance/pip/:id/outcome
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertOctagon, Loader2, Check, X, RotateCw, LogOut } from 'lucide-react';
import type { HrPipRow, HrPipMilestone, PipOutcome } from '@/lib/hr/performance';

interface PipRow extends HrPipRow {
  employee_code: string;
  full_name: string;
  designation: string | null;
  cycle_code: string;
}

const OUTCOME_COLOR: Record<PipOutcome, string> = {
  open:      'bg-amber-100 text-amber-800',
  succeeded: 'bg-emerald-100 text-emerald-800',
  extended:  'bg-sky-100 text-sky-800',
  failed:    'bg-rose-100 text-rose-800',
};

const OUTCOME_LABEL: Record<PipOutcome, string> = {
  open: 'Open',
  succeeded: 'Succeeded',
  extended: 'Extended',
  failed: 'Failed',
};

export default function PipRegisterPage() {
  const [rows, setRows] = useState<PipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'open' | 'closed' | 'all'>('open');
  const [actingId, setActingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/performance/pip')
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return rows;
    if (tab === 'open') return rows.filter((r) => r.outcome === 'open' || r.outcome === 'extended');
    return rows.filter((r) => r.outcome === 'succeeded' || r.outcome === 'failed');
  }, [rows, tab]);

  const act = async (pipId: number, outcome: PipOutcome) => {
    const labels: Record<PipOutcome, string> = {
      open: '',
      succeeded: 'Mark this PIP as SUCCEEDED and close?',
      extended: 'Extend this PIP by 30 days?',
      failed: 'Mark this PIP as FAILED? This will open a separation case.',
    };
    if (!confirm(labels[outcome])) return;
    setActingId(pipId);
    try {
      const res = await fetch(`/api/employee/hr/performance/pip/${pipId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Action failed'); return; }
      if (outcome === 'failed' && j.separation_id) {
        if (confirm(`Separation case created. Open it now?`)) {
          window.location.href = `/employee/hr/exits/${j.separation_id}`;
          return;
        }
      }
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">PIP Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            30 / 60 / 90 day milestones. Failed PIPs flow into the separation pipeline.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4 flex flex-wrap gap-1">
        {(['open', 'closed', 'all'] as const).map((t) => {
          const count = t === 'all'
            ? rows.length
            : t === 'open'
              ? rows.filter((r) => r.outcome === 'open' || r.outcome === 'extended').length
              : rows.filter((r) => r.outcome === 'succeeded' || r.outcome === 'failed').length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${active ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              {t === 'open' ? 'Active' : t === 'closed' ? 'Closed' : 'All'}
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((p) => (
          <PipCard key={p.id} pip={p} acting={actingId === p.id} onAct={(o) => act(p.id, o)} />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            No PIPs in this view.
          </div>
        )}
      </div>
    </div>
  );
}

function PipCard({ pip, acting, onAct }: { pip: PipRow; acting: boolean; onAct: (o: PipOutcome) => void }) {
  const closed = pip.outcome === 'succeeded' || pip.outcome === 'failed';
  const milestones: Array<{ key: 'm30' | 'm60' | 'm90'; label: string; date: string | null; note: string | null }> = [
    { key: 'm30', label: 'Day 30', date: pip.m30_review_at, note: pip.m30_note },
    { key: 'm60', label: 'Day 60', date: pip.m60_review_at, note: pip.m60_note },
    { key: 'm90', label: 'Day 90', date: pip.m90_review_at, note: pip.m90_note },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${OUTCOME_COLOR[pip.outcome]}`}>
              {OUTCOME_LABEL[pip.outcome]}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
              {pip.cycle_code}
            </span>
          </div>
          <div className="font-bold text-slate-900">{pip.full_name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{pip.employee_code} · {pip.designation || '—'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Opened {pip.opened_at?.slice(0, 10)} · Manager {pip.manager_email || '—'}
          </div>
        </div>

        {!closed && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAct('extended')}
              disabled={acting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-60"
            >
              <RotateCw className="w-3 h-3" /> Extend +30
            </button>
            <button
              onClick={() => onAct('succeeded')}
              disabled={acting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
            >
              <Check className="w-3 h-3" /> Close: succeeded
            </button>
            <button
              onClick={() => onAct('failed')}
              disabled={acting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60"
            >
              <LogOut className="w-3 h-3" /> Close: failed → exit
            </button>
          </div>
        )}
        {closed && pip.separation_id && (
          <Link
            href={`/employee/hr/exits/${pip.separation_id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300"
          >
            View separation <X className="w-3 h-3 opacity-0" />
          </Link>
        )}
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {milestones.map((m) => (
          <div key={m.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{m.label}</div>
            <div className="text-xs font-mono text-slate-700">{m.date?.slice(0, 10) || '—'}</div>
            {m.note && <div className="text-[11px] text-slate-600 mt-1 leading-snug">{m.note}</div>}
          </div>
        ))}
      </div>

      {/* Expected outcomes */}
      {Array.isArray(pip.expected_outcomes) && pip.expected_outcomes.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Expected outcomes</div>
          <ul className="space-y-1">
            {pip.expected_outcomes.map((eo: HrPipMilestone, i: number) => (
              <li key={i} className="text-xs flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${eo.status === 'done' ? 'bg-emerald-500' : eo.status === 'missed' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                <span className="text-slate-700">{eo.milestone}</span>
                <span className="text-[10px] text-slate-500 font-mono">{eo.target_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
