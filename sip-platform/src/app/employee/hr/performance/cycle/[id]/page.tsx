'use client';

/**
 * Phase 9 — Cycle Detail (admin shell).
 *
 * Top-of-page status header + state-machine-gated transition buttons +
 * tab navigation. Each tab is a sibling route — this page renders only
 * the overview "Goals / Reviews / Calibration / 9-Box / Increment / PIP"
 * dispatcher row plus the "Seed goals from template" panel.
 */
import { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Target, Users, GitBranch, Grid3X3,
  TrendingUp, AlertOctagon, Wand2, ArrowRight,
} from 'lucide-react';
import type { CycleStatus, CycleType, HrCycleRow } from '@/lib/hr/performance';
import { KRA_TEMPLATES, type KraTemplate } from '@/data/hr/kra-templates';

const STATUS_LABEL: Record<CycleStatus, string> = {
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

const STATUS_COLOR: Record<CycleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  goals_open: 'bg-sky-100 text-sky-800',
  mid_year: 'bg-amber-100 text-amber-800',
  self_review_open: 'bg-indigo-100 text-indigo-800',
  manager_review_open: 'bg-violet-100 text-violet-800',
  skip_review_open: 'bg-fuchsia-100 text-fuchsia-800',
  calibration: 'bg-orange-100 text-orange-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-600',
};

const TYPE_LABEL: Record<CycleType, string> = {
  annual: 'Annual',
  mid_year: 'Mid-year',
  probation_confirmation: 'Probation',
};

/** State machine: which next status(es) are reachable from current. */
const TRANSITIONS: Record<CycleStatus, { next: CycleStatus; label: string }[]> = {
  draft:               [{ next: 'goals_open', label: 'Open goals' }],
  goals_open:          [{ next: 'mid_year', label: 'Open mid-year' }, { next: 'self_review_open', label: 'Skip mid-year → self-review' }],
  mid_year:            [{ next: 'self_review_open', label: 'Open self-review' }],
  self_review_open:    [{ next: 'manager_review_open', label: 'Open manager review' }],
  manager_review_open: [{ next: 'skip_review_open', label: 'Open skip-level review' }, { next: 'calibration', label: 'Skip → calibration' }],
  skip_review_open:    [{ next: 'calibration', label: 'Open calibration' }],
  calibration:         [{ next: 'published', label: 'Publish ratings + letters' }],
  published:           [{ next: 'archived', label: 'Archive cycle' }],
  archived:            [],
};

const TABS: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; sub: string }[] = [
  { key: 'goals',         label: 'Goals',         icon: Target,       sub: 'goals' },
  { key: 'midyear',       label: 'Mid-year',      icon: GitBranch,    sub: 'midyear' },
  { key: 'reviews',       label: 'Reviews',       icon: Users,        sub: 'reviews' },
  { key: 'calibration',   label: 'Calibration',   icon: TrendingUp,   sub: 'calibration' },
  { key: 'nine-box',      label: '9-Box',         icon: Grid3X3,      sub: 'nine-box' },
  { key: 'increment',     label: 'Increment',     icon: TrendingUp,   sub: 'increment-matrix' },
  { key: 'pip',           label: 'PIP',           icon: AlertOctagon, sub: '../../pip' },
];

interface CycleDetail extends HrCycleRow {
  counts?: {
    goals_locked: number;
    self_submitted: number;
    manager_submitted: number;
    ratings_locked: number;
    total_employees: number;
  };
}

export default function CycleDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;
  const router = useRouter();

  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [seedRoleFamily, setSeedRoleFamily] = useState<KraTemplate['role_family']>('sales_rm');
  const [seedRunning, setSeedRunning] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}`)
      .then((r) => r.json())
      .then((j) => setCycle(j.row || null))
      .catch(() => setCycle(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cycleId]);

  const nextTransitions = useMemo(
    () => (cycle ? TRANSITIONS[cycle.status] : []),
    [cycle]
  );

  const doTransition = async (next: CycleStatus) => {
    if (!cycle) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: next }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Transition failed');
        setTransitioning(false);
        return;
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const seedTemplate = async () => {
    setSeedRunning(true);
    setSeedResult(null);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/seed-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_family: seedRoleFamily }),
      });
      const j = await res.json();
      if (!res.ok) {
        setSeedResult(`Error: ${j.error || 'seed failed'}`);
        return;
      }
      setSeedResult(`Seeded ${j.created || 0} goal rows across ${j.employees || 0} employees.`);
    } catch (err) {
      setSeedResult(`Error: ${err instanceof Error ? err.message : 'seed failed'}`);
    } finally {
      setSeedRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!cycle) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Cycle not found.</p>
        <Link href="/employee/hr/performance" className="text-brand text-sm font-bold">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <Link href="/employee/hr/performance" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Performance
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[cycle.status]}`}>
              {STATUS_LABEL[cycle.status]}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {TYPE_LABEL[cycle.cycle_type]}
            </span>
            {cycle.enforce_distribution && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Forced Dist
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-mono">{cycle.cycle_code}</h1>
          <div className="text-sm text-slate-500">
            FY {cycle.fiscal_year} · {cycle.start_date?.slice(0, 10)} → {cycle.end_date?.slice(0, 10)}
          </div>
        </div>

        {/* Transition buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {nextTransitions.length === 0 && (
            <span className="text-xs text-slate-500 italic">No further transitions</span>
          )}
          {nextTransitions.map((t) => (
            <button
              key={t.next}
              onClick={() => doTransition(t.next)}
              disabled={transitioning}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-60"
            >
              {transitioning && <Loader2 className="w-3 h-3 animate-spin" />}
              {t.label} <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Counts strip */}
      {cycle.counts && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <KpiTile label="Employees" n={cycle.counts.total_employees} />
          <KpiTile label="Goals locked" n={cycle.counts.goals_locked} total={cycle.counts.total_employees} />
          <KpiTile label="Self submitted" n={cycle.counts.self_submitted} total={cycle.counts.total_employees} />
          <KpiTile label="Manager submitted" n={cycle.counts.manager_submitted} total={cycle.counts.total_employees} />
          <KpiTile label="Ratings locked" n={cycle.counts.ratings_locked} total={cycle.counts.total_employees} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const href = t.sub.startsWith('../')
            ? `/employee/hr/performance/${t.sub.replace(/^\.\.\/\.\.\//, '')}`
            : `/employee/hr/performance/cycle/${cycleId}/${t.sub}`;
          return (
            <Link
              key={t.key}
              href={href}
              className="px-3 py-2 text-sm font-medium border-b-2 -mb-px border-transparent text-slate-600 hover:text-brand inline-flex items-center gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </Link>
          );
        })}
      </div>

      {/* Seed goals from template */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-violet-600" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Seed goals from template</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Pre-fills KRAs for every active employee in the chosen role family. Existing goals are
          left untouched — the API skips employees who already have rows in this cycle.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={seedRoleFamily}
            onChange={(e) => setSeedRoleFamily(e.target.value as KraTemplate['role_family'])}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            {KRA_TEMPLATES.map((tpl) => (
              <option key={tpl.role_family} value={tpl.role_family}>{tpl.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={seedTemplate}
            disabled={seedRunning || cycle.status === 'archived' || cycle.status === 'published'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-60"
          >
            {seedRunning && <Loader2 className="w-3 h-3 animate-spin" />}
            Seed goals
          </button>
          {seedResult && (
            <span className={`text-xs ${seedResult.startsWith('Error') ? 'text-rose-600' : 'text-emerald-700'}`}>
              {seedResult}
            </span>
          )}
        </div>
      </div>

      {/* Quick tab links as cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const href = t.sub.startsWith('../')
            ? `/employee/hr/performance/${t.sub.replace(/^\.\.\/\.\.\//, '')}`
            : `/employee/hr/performance/cycle/${cycleId}/${t.sub}`;
          return (
            <Link
              key={t.key}
              href={href}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand hover:shadow-sm transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand/10 text-brand">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{t.label}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function KpiTile({ label, n, total }: { label: string; n: number; total?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xl font-extrabold text-slate-900">
        {n}
        {total != null && <span className="text-slate-400 font-normal text-sm"> / {total}</span>}
      </div>
    </div>
  );
}
