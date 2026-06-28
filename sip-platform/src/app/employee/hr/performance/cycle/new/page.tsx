'use client';

/**
 * Phase 9 — Create new appraisal cycle.
 *
 * POST /api/employee/hr/performance/cycles → redirect to cycle detail.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import type { CycleType } from '@/lib/hr/performance';

const CYCLE_TYPES: { value: CycleType; label: string }[] = [
  { value: 'annual',                 label: 'Annual' },
  { value: 'mid_year',               label: 'Mid-year' },
  { value: 'probation_confirmation', label: 'Probation Confirmation' },
];

const DEFAULT_DIST = { 1: 5, 2: 10, 3: 60, 4: 20, 5: 5 };

function fyDefault(d: Date): string {
  const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
  const next = (y + 1).toString().slice(2);
  return `FY${y}-${next}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewCyclePage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [fiscalYear, setFiscalYear] = useState<string>(fyDefault(new Date()));
  const [cycleType, setCycleType] = useState<CycleType>('annual');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(addDays(today, 365));
  const [goalsDue, setGoalsDue] = useState<string>(addDays(today, 30));
  const [midyearDue, setMidyearDue] = useState<string>(addDays(today, 182));
  const [selfDue, setSelfDue] = useState<string>(addDays(today, 350));
  const [mgrDue, setMgrDue] = useState<string>(addDays(today, 360));
  const [skipDue, setSkipDue] = useState<string>(addDays(today, 365));
  const [calibDue, setCalibDue] = useState<string>(addDays(today, 370));

  const [enforceDist, setEnforceDist] = useState(false);
  const [dist, setDist] = useState<Record<number, number>>(DEFAULT_DIST);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mid-year cycles get a shorter footprint
  useEffect(() => {
    if (cycleType === 'mid_year') {
      setEndDate(addDays(startDate, 182));
      setGoalsDue(addDays(startDate, 14));
      setSelfDue(addDays(startDate, 170));
      setMgrDue(addDays(startDate, 175));
      setCalibDue(addDays(startDate, 180));
    } else if (cycleType === 'probation_confirmation') {
      setEndDate(addDays(startDate, 180));
      setGoalsDue(addDays(startDate, 7));
      setSelfDue(addDays(startDate, 165));
      setMgrDue(addDays(startDate, 170));
      setCalibDue(addDays(startDate, 175));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleType]);

  const distSum = Object.values(dist).reduce((a, b) => a + b, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (enforceDist && distSum !== 100) {
      setError(`Distribution curve must sum to 100 (current ${distSum}).`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employee/hr/performance/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          cycle_type: cycleType,
          start_date: startDate,
          end_date: endDate,
          goals_due_date: goalsDue || null,
          midyear_due_date: cycleType === 'annual' ? midyearDue || null : null,
          self_review_due_date: selfDue || null,
          manager_review_due_date: mgrDue || null,
          skip_review_due_date: skipDue || null,
          calibration_due_date: calibDue || null,
          enforce_distribution: enforceDist,
          distribution_curve: enforceDist ? dist : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Failed to create cycle');
        setSubmitting(false);
        return;
      }
      router.push(`/employee/hr/performance/cycle/${j.id || j.row?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cycle');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/employee/hr/performance" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
          <ArrowLeft className="w-3 h-3" /> Back to Performance
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">New Appraisal Cycle</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cycle code is auto-generated server-side from FY + type.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* FY + type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fiscal Year *</label>
            <input
              type="text"
              required
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="FY2026-27"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cycle Type *</label>
            <select
              value={cycleType}
              onChange={(e) => setCycleType(e.target.value as CycleType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {CYCLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Window */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date *</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date *</label>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
        </div>

        {/* Due dates */}
        <div className="border-t border-slate-100 pt-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Due Dates</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DueInput label="Goals lock" v={goalsDue} set={setGoalsDue} />
            {cycleType === 'annual' && <DueInput label="Mid-year check-in" v={midyearDue} set={setMidyearDue} />}
            <DueInput label="Self-review submit" v={selfDue} set={setSelfDue} />
            <DueInput label="Manager review submit" v={mgrDue} set={setMgrDue} />
            <DueInput label="Skip-level review" v={skipDue} set={setSkipDue} />
            <DueInput label="Calibration close" v={calibDue} set={setCalibDue} />
          </div>
        </div>

        {/* Distribution */}
        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
            <input
              type="checkbox"
              checked={enforceDist}
              onChange={(e) => setEnforceDist(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            Enforce forced distribution at calibration
          </label>
          {enforceDist && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">Target % by rating</div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <div key={r}>
                    <label className="block text-[10px] text-amber-900 mb-1">Rating {r}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={dist[r] ?? 0}
                      onChange={(e) => setDist({ ...dist, [r]: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border border-amber-300 text-sm text-center bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className={`mt-2 text-[11px] font-medium ${distSum === 100 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Sum: {distSum}% {distSum === 100 ? '✓' : '(must be 100)'}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Cycle
          </button>
          <Link href="/employee/hr/performance" className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function DueInput({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
      <input type="date" value={v} onChange={(e) => set(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
    </div>
  );
}
