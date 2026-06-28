'use client';

/**
 * ESS — My Appraisal hub.
 *
 * Single landing page for the signed-in employee's performance cycle.
 * Renders four distinct stages based on `cycle.status`:
 *
 *   1. goals_open / mid_year / self_review_open  → action banner +
 *      goals card with weights, targets, actuals, and (when in
 *      self-review window) the employee's own rating column.
 *   2. manager_review_open / skip_review_open / calibration → "in flight"
 *      banner; goals card visible read-only.
 *   3. published → final rating card with 9-box quadrant, narrative,
 *      increment %, increment amount, new designation (if promoted).
 *      An e-sign acknowledgement section appears if the rating has been
 *      viewed but not yet acknowledged.
 *   4. draft / archived / no active cycle → calm empty state.
 *
 * Tone: supportive but matter-of-fact. SEBI-compliant MFD language only —
 * Trustner is an AMFI-registered Mutual Fund Distributor.
 *
 * Backend endpoint (best-effort): GET /api/employee/hr/me/appraisal
 * returns { cycle, goals, self_review, rating, pip, acknowledgement }.
 * If the endpoint is not yet wired the page renders a friendly
 * "no cycle in flight" view instead of crashing.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Loader2, ArrowLeft, ArrowRight, Target, CheckCircle2,
  Sparkles, Award, AlertTriangle, ShieldCheck, ClipboardList, Calendar,
  Compass,
} from 'lucide-react';

type CycleStatus =
  | 'draft' | 'goals_open' | 'mid_year' | 'self_review_open'
  | 'manager_review_open' | 'skip_review_open' | 'calibration'
  | 'published' | 'archived';

type NineBox =
  | 'underperformer' | 'effective' | 'rising' | 'core' | 'solid'
  | 'high_pro' | 'enigma' | 'growth' | 'star';

interface Cycle {
  id: number;
  cycle_code: string;
  fiscal_year: string;
  cycle_type: 'annual' | 'mid_year' | 'probation_confirmation';
  status: CycleStatus;
  goals_due_date: string | null;
  midyear_due_date: string | null;
  self_review_due_date: string | null;
  manager_review_due_date: string | null;
  calibration_due_date: string | null;
  published_at: string | null;
}

interface Goal {
  id: number;
  kra_category: 'business' | 'operational' | 'behavioural' | 'learning' | 'compliance';
  goal_title: string;
  goal_description: string | null;
  weight: number;
  target_metric: string | null;
  target_value: number | null;
  target_unit: string | null;
  actual_value: number | null;
  midyear_actual: number | null;
  self_rating: number | null;
  manager_rating: number | null;
  final_rating: number | null;
  auto_source: string | null;
}

interface Rating {
  id: number;
  final_performance_rating: number;
  final_potential_rating: number | null;
  nine_box_quadrant: NineBox | null;
  compliance_capped: boolean;
  compliance_cap_reason: string | null;
  recommended_increment_pct: number | null;
  final_increment_pct: number | null;
  increment_amount: number | null;
  promoted: boolean;
  new_designation: string | null;
  pip_required: boolean;
  published_at: string | null;
  narrative_summary: string | null;
}

interface AppraisalBundle {
  cycle: Cycle | null;
  goals: Goal[];
  rating: Rating | null;
  has_active_pip: boolean;
  acknowledgement_id: number | null;
  acknowledged_at: string | null;
}

const CATEGORY_LABEL: Record<Goal['kra_category'], string> = {
  business: 'Business',
  operational: 'Operational',
  behavioural: 'Behavioural',
  learning: 'Learning',
  compliance: 'Compliance',
};

const CATEGORY_COLOR: Record<Goal['kra_category'], string> = {
  business: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  operational: 'bg-blue-50 text-blue-700 border-blue-200',
  behavioural: 'bg-violet-50 text-violet-700 border-violet-200',
  learning: 'bg-amber-50 text-amber-700 border-amber-200',
  compliance: 'bg-rose-50 text-rose-700 border-rose-200',
};

const NINE_BOX_LABELS: Record<NineBox, string> = {
  star: 'Star',
  high_pro: 'High Professional',
  effective: 'Effective',
  growth: 'Growth Employee',
  core: 'Core Player',
  rising: 'Rising',
  enigma: 'Enigma',
  solid: 'Solid Contributor',
  underperformer: 'Underperformer',
};

const NINE_BOX_COLOR: Record<NineBox, string> = {
  star: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  high_pro: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  effective: 'bg-blue-50 border-blue-200 text-blue-800',
  growth: 'bg-amber-50 border-amber-300 text-amber-900',
  core: 'bg-slate-50 border-slate-300 text-slate-800',
  rising: 'bg-slate-50 border-slate-200 text-slate-700',
  enigma: 'bg-amber-50 border-amber-200 text-amber-800',
  solid: 'bg-amber-50 border-amber-200 text-amber-800',
  underperformer: 'bg-rose-50 border-rose-200 text-rose-800',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function inr(v: number | null | undefined) {
  if (v == null) return '—';
  return '₹ ' + Math.round(Number(v)).toLocaleString('en-IN');
}

function StageBanner({
  cycle,
  hasActivePip,
  pendingAck,
}: { cycle: Cycle; hasActivePip: boolean; pendingAck: boolean }) {
  const s = cycle.status;

  if (s === 'goals_open') {
    return (
      <Banner
        tone="brand"
        icon={Target}
        kicker={`Cycle ${cycle.cycle_code} · ${cycle.fiscal_year}`}
        title="Goals window is open"
        body={`Review the goals your manager has set, raise any concerns, and lock them in by ${fmtDate(cycle.goals_due_date)}. If a goal has an automatic data feed (DSR or attendance), the actual value will fill in on its own.`}
      />
    );
  }
  if (s === 'mid_year') {
    return (
      <Banner
        tone="amber"
        icon={Compass}
        kicker={`Cycle ${cycle.cycle_code} · mid-year check-in`}
        title="Time for your mid-year check-in"
        body={`Note the actual progress and a short reflection per goal by ${fmtDate(cycle.midyear_due_date)}. This is not the final review — it's a course-correction moment.`}
        cta={{ href: '/employee/hr/me/appraisal/midyear', label: 'Open mid-year form' }}
      />
    );
  }
  if (s === 'self_review_open') {
    return (
      <Banner
        tone="brand"
        icon={ClipboardList}
        kicker={`Cycle ${cycle.cycle_code} · self-review`}
        title="Self-review is open"
        body={`Rate yourself on each goal, share strengths and areas to improve, and submit before ${fmtDate(cycle.self_review_due_date)}. Your input goes to your manager next.`}
        cta={{ href: '/employee/hr/me/appraisal/self-review', label: 'Open self-review' }}
      />
    );
  }
  if (s === 'manager_review_open') {
    return (
      <Banner
        tone="slate"
        icon={Loader2}
        kicker={`Cycle ${cycle.cycle_code}`}
        title="With your manager"
        body={`Your self-review is in. Your manager is working on the assessment now and will share it after calibration. Expected by ${fmtDate(cycle.manager_review_due_date)}.`}
      />
    );
  }
  if (s === 'skip_review_open') {
    return (
      <Banner
        tone="slate"
        icon={Loader2}
        kicker={`Cycle ${cycle.cycle_code}`}
        title="Skip-level review in progress"
        body="Your manager's recommendation is being reviewed by their manager. Nothing for you to do — we'll let you know once the cycle is published."
      />
    );
  }
  if (s === 'calibration') {
    return (
      <Banner
        tone="slate"
        icon={Loader2}
        kicker={`Cycle ${cycle.cycle_code}`}
        title="Calibration in progress"
        body={`Leadership is calibrating ratings across the organisation. Final ratings will be published by ${fmtDate(cycle.calibration_due_date)}.`}
      />
    );
  }
  if (s === 'published') {
    if (hasActivePip) {
      return (
        <Banner
          tone="amber"
          icon={AlertTriangle}
          kicker={`Cycle ${cycle.cycle_code} · published`}
          title="Your rating is published — a development plan is in motion"
          body="A Performance Improvement Plan has been opened with you. See the PIP page for the 30/60/90 milestones."
          cta={{ href: '/employee/hr/me/appraisal/pip', label: 'View my PIP' }}
        />
      );
    }
    if (pendingAck) {
      return (
        <Banner
          tone="brand"
          icon={Sparkles}
          kicker={`Cycle ${cycle.cycle_code} · published`}
          title="Your rating is ready — please acknowledge"
          body={`Published ${fmtDate(cycle.published_at)}. Please review and digitally sign acknowledgement below.`}
        />
      );
    }
    return (
      <Banner
        tone="emerald"
        icon={Award}
        kicker={`Cycle ${cycle.cycle_code} · published`}
        title="Your rating is published"
        body={`Published ${fmtDate(cycle.published_at)} and acknowledged. See the breakdown below.`}
      />
    );
  }
  // draft / archived
  return (
    <Banner
      tone="slate"
      icon={Calendar}
      kicker={`Cycle ${cycle.cycle_code}`}
      title="Cycle not yet open"
      body="Your current appraisal cycle is being set up. Nothing for you to do right now — we'll notify you when goals are ready."
    />
  );
}

function Banner({
  tone, icon: Icon, kicker, title, body, cta,
}: {
  tone: 'brand' | 'amber' | 'emerald' | 'slate';
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  const toneCls = {
    brand: 'bg-slate-900 text-white border-slate-900',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    slate: 'bg-white text-slate-900 border-slate-200',
  }[tone];
  const iconCls = {
    brand: 'bg-white/10 text-white',
    amber: 'bg-white text-amber-700 border border-amber-200',
    emerald: 'bg-white text-emerald-700 border border-emerald-200',
    slate: 'bg-slate-100 text-slate-700',
  }[tone];
  const ctaCls = tone === 'brand'
    ? 'bg-white text-slate-900 hover:bg-slate-100'
    : 'bg-slate-900 text-white hover:bg-slate-800';
  return (
    <div className={`rounded-xl border-2 ${toneCls} p-5 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] uppercase tracking-wider font-bold ${tone === 'brand' ? 'text-slate-300' : 'opacity-70'}`}>
            {kicker}
          </div>
          <h2 className="text-lg font-extrabold mt-0.5">{title}</h2>
          <p className={`text-sm mt-1 leading-relaxed ${tone === 'brand' ? 'text-slate-200' : 'opacity-90'}`}>{body}</p>
          {cta && (
            <Link
              href={cta.href}
              className={`inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-sm font-bold ${ctaCls}`}
            >
              {cta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalsCard({ goals, cycleStatus }: { goals: Goal[]; cycleStatus: CycleStatus }) {
  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-700" />
          My Goals
        </h2>
        <div className="text-xs text-slate-500">
          No goals have been set yet for this cycle. Your manager will add them when the goals window opens.
        </div>
      </div>
    );
  }
  const totalWeight = goals.reduce((s, g) => s + Number(g.weight || 0), 0);
  const showSelf = cycleStatus === 'self_review_open' || cycleStatus === 'manager_review_open'
    || cycleStatus === 'skip_review_open' || cycleStatus === 'calibration' || cycleStatus === 'published';
  const showFinal = cycleStatus === 'published';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-700" />
          My Goals
        </h2>
        <div className="text-xs text-slate-500">
          {goals.length} goal{goals.length === 1 ? '' : 's'} · total weight {totalWeight}%
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2 font-semibold">Goal</th>
              <th className="py-2 px-2 font-semibold w-16 text-right">Weight</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Target</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Actual</th>
              {showSelf && <th className="py-2 px-2 font-semibold w-16 text-center">Self</th>}
              {showFinal && <th className="py-2 px-2 font-semibold w-16 text-center">Final</th>}
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => (
              <tr key={g.id} className="border-b border-slate-100">
                <td className="py-3 pr-2">
                  <div className="flex items-start gap-2">
                    <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${CATEGORY_COLOR[g.kra_category]}`}>
                      {CATEGORY_LABEL[g.kra_category]}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{g.goal_title}</div>
                      {g.goal_description && <div className="text-slate-500 mt-0.5">{g.goal_description}</div>}
                      {g.auto_source && g.auto_source !== 'manual' && (
                        <div className="text-[10px] text-emerald-700 mt-0.5 inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Auto-populated from {g.auto_source.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold">{Number(g.weight).toFixed(0)}%</td>
                <td className="py-3 px-2 text-right font-mono">
                  {g.target_value != null ? `${g.target_value}${g.target_unit ? ' ' + g.target_unit : ''}` : '—'}
                </td>
                <td className="py-3 px-2 text-right font-mono">
                  {g.actual_value != null ? `${g.actual_value}${g.target_unit ? ' ' + g.target_unit : ''}` : '—'}
                </td>
                {showSelf && (
                  <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                    {g.self_rating ?? '—'}
                  </td>
                )}
                {showFinal && (
                  <td className="py-3 px-2 text-center font-mono font-bold text-emerald-700">
                    {g.final_rating ?? '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RatingCard({ rating }: { rating: Rating }) {
  const quad = rating.nine_box_quadrant;
  return (
    <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 mb-6">
      <h2 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
        <Award className="w-4 h-4" />
        Final Rating
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Performance</div>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1">
            {rating.final_performance_rating}<span className="text-base text-emerald-700">/5</span>
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Potential</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {rating.final_potential_rating ?? '—'}<span className="text-base text-slate-500">{rating.final_potential_rating ? '/5' : ''}</span>
          </div>
        </div>
        <div className={`rounded-lg border p-4 ${quad ? NINE_BOX_COLOR[quad] : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">9-Box Quadrant</div>
          <div className="text-xl font-extrabold mt-1">{quad ? NINE_BOX_LABELS[quad] : '—'}</div>
        </div>
      </div>

      {rating.narrative_summary && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Manager narrative</div>
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{rating.narrative_summary}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Increment</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {rating.final_increment_pct != null ? `${Number(rating.final_increment_pct).toFixed(1)}%` : '—'}
          </div>
          {rating.compliance_capped && (
            <div className="text-[10px] text-rose-700 mt-1 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Compliance cap applied
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Increment amount</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inr(rating.increment_amount)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">per annum</div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Designation</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
            {rating.promoted && rating.new_designation ? rating.new_designation : 'No change'}
          </div>
          {rating.promoted && (
            <div className="text-[10px] text-emerald-700 mt-0.5 font-bold inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Promoted
            </div>
          )}
        </div>
      </div>

      {rating.compliance_capped && rating.compliance_cap_reason && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
          <b>Compliance cap reason:</b> {rating.compliance_cap_reason}
        </div>
      )}
    </div>
  );
}

function AcknowledgeCard({
  cycleId, onSigned,
}: { cycleId: number; onSigned: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const sign = async () => {
    if (!agreed) {
      setMsg('Please tick the acknowledgement box to continue.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/employee/hr/me/appraisal/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_id: cycleId,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(j.error || 'Could not record acknowledgement. Please retry.');
        return;
      }
      onSigned();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-6 mb-6">
      <h2 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Acknowledge your rating
      </h2>
      <p className="text-sm text-slate-700 mb-4">
        Please confirm you have read and understood the final rating, narrative
        and compensation decision. Acknowledgement is recorded with timestamp,
        IP and user-agent as an audit-grade entry — equivalent to a digital
        signature. It does not mean you agree with every point, only that you
        have seen and understood it.
      </p>
      <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-800 mb-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span>
          I confirm I have read and understood my final rating and the
          accompanying narrative for this cycle.
        </span>
      </label>
      {msg && <div className="text-xs text-rose-700 mb-3">{msg}</div>}
      <button
        onClick={sign}
        disabled={busy || !agreed}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        E-sign acknowledgement
      </button>
    </div>
  );
}

export default function MyAppraisalHub() {
  const [data, setData] = useState<AppraisalBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/me/appraisal')
      .then(async (r) => {
        if (!r.ok) {
          // 404 / 500 — degrade gracefully
          setData({ cycle: null, goals: [], rating: null, has_active_pip: false, acknowledgement_id: null, acknowledged_at: null });
          return;
        }
        return r.json();
      })
      .then((j) => { if (j) setData(j); })
      .catch(() => setError('Could not load your appraisal. Please retry.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading || !data) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/employee/hr/me" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to My Dashboard
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-slate-700" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">My Appraisal</h1>
          <p className="text-sm text-slate-600 mt-1">
            Goals, mid-year check-in, self-review and your final rating — all in one place.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-800 mb-6">
          {error}
        </div>
      )}

      {!data.cycle ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No appraisal cycle in flight</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            There isn&apos;t an active performance cycle for you right now. When HR opens the next cycle,
            you&apos;ll see your goals, mid-year check-in and self-review here.
          </p>
        </div>
      ) : (
        <>
          <StageBanner
            cycle={data.cycle}
            hasActivePip={data.has_active_pip}
            pendingAck={data.cycle.status === 'published' && !data.acknowledged_at}
          />

          <GoalsCard goals={data.goals} cycleStatus={data.cycle.status} />

          {data.cycle.status === 'published' && data.rating && (
            <>
              <RatingCard rating={data.rating} />
              {!data.acknowledged_at && (
                <AcknowledgeCard cycleId={data.cycle.id} onSigned={load} />
              )}
              {data.acknowledged_at && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-900">Acknowledgement recorded</div>
                    <div className="text-xs text-emerald-800">
                      Signed on {fmtDate(data.acknowledged_at)}.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {data.has_active_pip && (
            <Link
              href="/employee/hr/me/appraisal/pip"
              className="block bg-white rounded-xl border-2 border-amber-200 p-5 hover:border-amber-300 mb-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-amber-900">Performance Improvement Plan in motion</div>
                    <div className="text-xs text-amber-800 mt-0.5">
                      View the 30 / 60 / 90 day milestones and manager notes.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </div>
            </Link>
          )}

          <div className="text-xs text-slate-500 leading-relaxed">
            Questions about your appraisal? Reach out to your line manager or HR at{' '}
            <a href="mailto:wecare@trustner.in" className="text-brand font-semibold hover:underline">wecare@trustner.in</a>.
          </div>
        </>
      )}
    </div>
  );
}
