'use client';

/**
 * ESS — Full self-review form.
 *
 * Per-goal: actual + self-rating 1–5 + self-note.
 * Three narrative fields: strengths, areas to improve, career aspirations.
 *
 * Workflow:
 *   1. Save draft → PATCH /api/employee/hr/me/appraisal/self-review (action=draft)
 *   2. Submit → opens OTP modal → sends OTP to registered phone/email
 *      → user enters 6-digit code → POST /api/employee/hr/me/appraisal/self-review
 *      with otp + tnc_agreed=true. On success the row is locked.
 *
 * Endpoints degrade gracefully if not yet wired (toast + retry).
 *
 * Tone: supportive but matter-of-fact. Reminds the employee that a
 * self-review is a candid stocktake, not a sales pitch.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, ArrowLeft, Loader2, Save, Send, CheckCircle2,
  AlertTriangle, ShieldCheck, Star,
} from 'lucide-react';

interface Goal {
  id: number;
  kra_category: 'business' | 'operational' | 'behavioural' | 'learning' | 'compliance';
  goal_title: string;
  goal_description: string | null;
  weight: number;
  target_value: number | null;
  target_unit: string | null;
  actual_value: number | null;
  self_rating: number | null;
  self_note: string | null;
}

interface SelfReview {
  id: number | null;
  status: 'draft' | 'submitted' | 'locked' | null;
  narrative_strengths: string | null;
  narrative_improvement: string | null;
  narrative_career: string | null;
  overall_self_rating: number | null;
}

interface Bundle {
  cycle: { id: number; cycle_code: string; status: string; self_review_due_date: string | null } | null;
  goals: Goal[];
  self_review: SelfReview;
}

const CATEGORY_LABEL: Record<Goal['kra_category'], string> = {
  business: 'Business',
  operational: 'Operational',
  behavioural: 'Behavioural',
  learning: 'Learning',
  compliance: 'Compliance',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RatingStars({
  value, onChange, disabled,
}: { value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`p-0.5 ${disabled ? 'cursor-not-allowed' : 'hover:scale-110'} transition`}
          title={['Below expectations', 'Needs improvement', 'Meets expectations', 'Exceeds expectations', 'Outstanding'][n - 1]}
        >
          <Star
            className={`w-5 h-5 ${value && n <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-mono font-bold text-slate-600">{value ?? '—'}/5</span>
    </div>
  );
}

export default function SelfReviewForm() {
  const [data, setData] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { actual: string; rating: number | null; note: string }>>({});
  const [narrative, setNarrative] = useState({ strengths: '', improvement: '', career: '' });
  const [saving, setSaving] = useState<'idle' | 'draft'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  // OTP modal state
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpAgreed, setOtpAgreed] = useState(false);
  const [otpInfo, setOtpInfo] = useState<{ channel: string; target_masked: string; expires_in: number } | null>(null);
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState<'idle' | 'send' | 'verify'>('idle');
  const [otpMsg, setOtpMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/employee/hr/me/appraisal/self-review')
      .then(async (r) => {
        if (!r.ok) {
          setData({
            cycle: null, goals: [],
            self_review: { id: null, status: null, narrative_strengths: null, narrative_improvement: null, narrative_career: null, overall_self_rating: null },
          });
          return;
        }
        return r.json();
      })
      .then((j) => {
        if (j) {
          setData(j);
          const seed: Record<number, { actual: string; rating: number | null; note: string }> = {};
          for (const g of j.goals ?? []) {
            seed[g.id] = {
              actual: g.actual_value != null ? String(g.actual_value) : '',
              rating: g.self_rating,
              note: g.self_note ?? '',
            };
          }
          setDrafts(seed);
          setNarrative({
            strengths: j.self_review?.narrative_strengths ?? '',
            improvement: j.self_review?.narrative_improvement ?? '',
            career: j.self_review?.narrative_career ?? '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // OTP countdown
  useEffect(() => {
    if (!otpInfo || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpInfo, secondsLeft]);

  const update = (gid: number, field: 'actual' | 'rating' | 'note', val: string | number | null) => {
    setDrafts((d) => ({ ...d, [gid]: { ...d[gid], [field]: val as never } }));
  };

  const isLocked = data?.self_review?.status === 'locked' || data?.self_review?.status === 'submitted';

  const buildPayload = () => ({
    cycle_id: data!.cycle!.id,
    goals: Object.entries(drafts).map(([id, v]) => ({
      goal_id: Number(id),
      actual_value: v.actual.trim() === '' ? null : Number(v.actual),
      self_rating: v.rating,
      self_note: v.note.trim() || null,
    })),
    narrative_strengths: narrative.strengths.trim() || null,
    narrative_improvement: narrative.improvement.trim() || null,
    narrative_career: narrative.career.trim() || null,
  });

  const saveDraft = async () => {
    if (!data?.cycle) return;
    setSaving('draft');
    setMsg(null);
    try {
      const res = await fetch('/api/employee/hr/me/appraisal/self-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), action: 'draft' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(j.error || 'Could not save draft. Please retry.');
        return;
      }
      setMsg('Draft saved.');
    } finally {
      setSaving('idle');
    }
  };

  // Submit flow → opens OTP modal
  const openSubmit = () => {
    // Light validation
    const missingRating = Object.values(drafts).find((d) => d.rating == null);
    if (missingRating) {
      setMsg('Please rate yourself on every goal (1 – 5) before submitting.');
      return;
    }
    if (!narrative.strengths.trim() || !narrative.improvement.trim() || !narrative.career.trim()) {
      setMsg('Please fill in all three narrative sections before submitting.');
      return;
    }
    setMsg(null);
    setOtpOpen(true);
    setOtpAgreed(false);
    setOtp('');
    setOtpInfo(null);
    setOtpMsg('');
  };

  const sendOtp = async () => {
    setOtpBusy('send');
    setOtpMsg('');
    try {
      const res = await fetch('/api/employee/hr/me/appraisal/self-review?action=send_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle_id: data!.cycle!.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpMsg(j.error || 'Could not send OTP. Please retry.');
        return;
      }
      setOtpInfo({
        channel: j.delivery_channel,
        target_masked: j.delivery_target_masked,
        expires_in: j.expires_in_seconds,
      });
      setSecondsLeft(j.expires_in_seconds);
    } finally {
      setOtpBusy('idle');
    }
  };

  const verifyAndSubmit = async () => {
    if (otp.length !== 6) {
      setOtpMsg('Enter the 6-digit OTP.');
      return;
    }
    setOtpBusy('verify');
    setOtpMsg('');
    try {
      const res = await fetch('/api/employee/hr/me/appraisal/self-review?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          otp,
          tnc_agreed: true,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpMsg(j.error || 'Verification failed.');
        return;
      }
      setOtpOpen(false);
      setSubmitted(true);
    } finally {
      setOtpBusy('idle');
    }
  };

  if (loading || !data) {
    return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!data.cycle || data.cycle.status !== 'self_review_open') {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-extrabold text-amber-900">Self-review window is not open</h1>
            <p className="text-sm text-amber-900 mt-1">
              Self-review opens after the mid-year check-in window closes. You&apos;ll see it here when it&apos;s your turn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted || isLocked) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
        </Link>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 flex items-start gap-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-700 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-extrabold text-emerald-900">Self-review submitted</h1>
            <p className="text-sm text-emerald-900 mt-1">
              Your self-review is now with your manager. You can&apos;t edit it once submitted —
              if anything needs correction, please reach out to HR at <a href="mailto:wecare@trustner.in" className="font-bold underline">wecare@trustner.in</a>.
            </p>
            <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-800 font-bold underline">
              Return to appraisal hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/employee/hr/me/appraisal" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to My Appraisal
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-6 h-6 text-slate-700" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Cycle {data.cycle.cycle_code} · self-review
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">My self-review</h1>
          <p className="text-sm text-slate-600 mt-1">
            Be candid. A self-review is a stocktake — strengths, gaps, and what you want next.
            Due <b>{fmtDate(data.cycle.self_review_due_date)}</b>. You&apos;ll OTP-sign on submit; once submitted, it locks.
          </p>
        </div>
      </div>

      {/* Goals */}
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Goal-level ratings</h2>
      <div className="space-y-3 mb-6">
        {data.goals.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {CATEGORY_LABEL[g.kra_category]} · weight {Number(g.weight).toFixed(0)}%
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">{g.goal_title}</div>
                {g.goal_description && (
                  <div className="text-xs text-slate-600 mt-1">{g.goal_description}</div>
                )}
                {g.target_value != null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Target: <span className="font-mono font-bold text-slate-700">
                      {g.target_value}{g.target_unit ? ' ' + g.target_unit : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Final actual {g.target_unit && <span className="text-slate-400">({g.target_unit})</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={drafts[g.id]?.actual ?? ''}
                  onChange={(e) => update(g.id, 'actual', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded text-sm font-mono"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  My rating
                </label>
                <div className="mt-1">
                  <RatingStars
                    value={drafts[g.id]?.rating ?? null}
                    onChange={(v) => update(g.id, 'rating', v)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Short note (optional)
                </label>
                <textarea
                  value={drafts[g.id]?.note ?? ''}
                  onChange={(e) => update(g.id, 'note', e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
                  placeholder="Context, caveats, evidence."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Narrative */}
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your narrative</h2>
      <div className="space-y-3 mb-6">
        <NarrativeField
          label="What worked — your strengths this cycle"
          value={narrative.strengths}
          onChange={(v) => setNarrative({ ...narrative, strengths: v })}
          placeholder="Be specific. Outcomes, behaviours, examples — what would you point to as your best work?"
        />
        <NarrativeField
          label="Where you fell short — areas to improve"
          value={narrative.improvement}
          onChange={(v) => setNarrative({ ...narrative, improvement: v })}
          placeholder="Honest is best. What missed the mark, why, and what would help you close the gap?"
        />
        <NarrativeField
          label="Career aspirations — what do you want next?"
          value={narrative.career}
          onChange={(v) => setNarrative({ ...narrative, career: v })}
          placeholder="What role, skill, or stretch do you want to work towards in the next 12-18 months?"
        />
      </div>

      {msg && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 mb-3">{msg}</div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={saveDraft}
          disabled={saving !== 'idle'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {saving === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save draft
        </button>
        <button
          onClick={openSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
        >
          <Send className="w-4 h-4" />
          Submit final (locks)
        </button>
      </div>

      {/* OTP modal */}
      {otpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Confirm and sign</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Once submitted, your self-review locks. You won&apos;t be able to edit it.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-800 mb-4">
              <input
                type="checkbox"
                checked={otpAgreed}
                onChange={(e) => setOtpAgreed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm the self-review above is my own honest assessment and I authorise it to be
                shared with my manager and HR. I understand this digital signature, supported by OTP
                verification, is legally equivalent to a hand signature.
              </span>
            </label>

            {!otpInfo ? (
              <button
                onClick={sendOtp}
                disabled={!otpAgreed || otpBusy === 'send'}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {otpBusy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send OTP
              </button>
            ) : (
              <>
                <div className="text-xs text-slate-700 mb-2">
                  OTP sent via <b className="capitalize">{otpInfo.channel}</b> to <b>{otpInfo.target_masked}</b>.
                  Valid for {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}.
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-lg font-mono tracking-widest text-center mb-3"
                  placeholder="• • • • • •"
                />
                <button
                  onClick={verifyAndSubmit}
                  disabled={otpBusy === 'verify' || otp.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {otpBusy === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify and submit
                </button>
              </>
            )}

            {otpMsg && <div className="text-xs text-rose-700 mt-3">{otpMsg}</div>}

            <button
              onClick={() => setOtpOpen(false)}
              className="mt-3 text-xs text-slate-500 hover:text-slate-900 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NarrativeField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2">
        {label} <span className="text-rose-600">*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={2000}
        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
        placeholder={placeholder}
      />
      <div className="text-[10px] text-slate-400 mt-0.5 text-right">{value.length} / 2000</div>
    </div>
  );
}
