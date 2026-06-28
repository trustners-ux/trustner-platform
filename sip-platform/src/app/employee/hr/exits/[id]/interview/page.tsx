'use client';

/**
 * Phase 8 — HR-side exit interview form.
 *
 * 12 questions sourced from EXIT_INTERVIEW_QUESTIONS.
 * Save draft → POST /exit-interview with status='draft'; Final submit sets status='final'.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessagesSquare, ArrowLeft, Loader2, Save, Send, Star } from 'lucide-react';
import {
  EXIT_INTERVIEW_QUESTIONS,
  type ExitInterviewAnswers,
  type ExitInterviewQuestion,
} from '@/data/hr/exit-interview-questions';

type Mode = 'self_serve' | 'hr_assisted' | 'phone';

interface InterviewRow {
  id: number;
  mode: Mode;
  answers: ExitInterviewAnswers;
  would_rejoin: 'yes' | 'no' | 'maybe' | null;
  would_recommend: 'yes' | 'no' | null;
  overall_rating: number | null;
  learnings: string | null;
  status: 'draft' | 'final';
  submitted_at: string | null;
}

export default function ExitInterviewPage() {
  const { id } = useParams() as { id: string };
  const [existing, setExisting] = useState<InterviewRow | null>(null);
  const [mode, setMode] = useState<Mode>('hr_assisted');
  const [answers, setAnswers] = useState<ExitInterviewAnswers>({});
  const [learnings, setLearnings] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employee/hr/exits/${id}/exit-interview`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        const row: InterviewRow | null = j?.row || j || null;
        if (row) {
          setExisting(row);
          setMode(row.mode || 'hr_assisted');
          setAnswers(row.answers || {});
          setLearnings(row.learnings || '');
        }
      })
      .catch(() => {/* no existing */})
      .finally(() => setLoading(false));
  }, [id]);

  const setAnswer = (qid: string, v: string | number | string[] | boolean | null) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  };

  const ratings = (['q7_rate_management', 'q8_rate_culture', 'q9_rate_growth'] as const)
    .map((k) => (typeof answers[k] === 'number' ? (answers[k] as number) : null))
    .filter((v): v is number => v != null);
  const computedOverall = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  const wouldRejoin = answers['q10_would_rejoin'] as 'yes' | 'no' | 'maybe' | undefined;
  const wouldRecommend = answers['q11_would_recommend'] as 'yes' | 'no' | undefined;

  const submit = async (final: boolean) => {
    setError(null);
    setOkMsg(null);
    if (final) {
      const missing = EXIT_INTERVIEW_QUESTIONS
        .filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === ''))
        .map((q) => q.id);
      if (missing.length) {
        setError(`Required answers missing: ${missing.join(', ')}`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/exit-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          answers,
          would_rejoin: wouldRejoin || null,
          would_recommend: wouldRecommend || null,
          overall_rating: computedOverall,
          learnings: learnings || null,
          status: final ? 'final' : 'draft',
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Save failed'); return; }
      setOkMsg(final ? 'Submitted ✓' : 'Draft saved ✓');
      setExisting(j.row || existing);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const finalised = existing?.status === 'final';

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/employee/hr/exits/${id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to case
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          <MessagesSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Exit Interview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {finalised ? 'Submitted — read-only' : 'Capture candid feedback · stays with HR + founders'}
          </p>
        </div>
      </div>

      {/* Mode picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Interview mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          disabled={finalised}
          className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white disabled:bg-slate-50"
        >
          <option value="hr_assisted">HR-assisted (in person)</option>
          <option value="self_serve">Self-serve (employee filled link)</option>
          <option value="phone">Phone interview</option>
        </select>
      </div>

      <div className="space-y-4">
        {EXIT_INTERVIEW_QUESTIONS.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
            disabled={finalised}
          />
        ))}

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-xs font-bold text-slate-800 mb-1">HR learnings / action items (internal)</label>
          <p className="text-[11px] text-slate-500 mb-2">
            Notes for HR + founders to act on. Never tied back to the employee record.
          </p>
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            rows={3}
            disabled={finalised}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
          />
        </div>

        {computedOverall != null && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
            <span className="text-slate-500">Computed overall rating (avg of Q7/Q8/Q9):</span>{' '}
            <b className="text-slate-900">{computedOverall} / 5</b>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm mt-4">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm mt-4">
          {okMsg}
        </div>
      )}

      {!finalised && (
        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => submit(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold hover:bg-slate-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit final
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  q, value, onChange, disabled,
}: {
  q: ExitInterviewQuestion;
  value: string | number | string[] | boolean | null | undefined;
  onChange: (v: string | number | string[] | boolean | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q{q.order}</div>
          <h3 className="text-sm font-bold text-slate-900">
            {q.prompt} {q.required && <span className="text-rose-600">*</span>}
          </h3>
          {q.helpText && <p className="text-[11px] text-slate-500 mt-0.5">{q.helpText}</p>}
        </div>
      </div>
      {renderInput(q, value, onChange, disabled)}
    </div>
  );
}

function renderInput(
  q: ExitInterviewQuestion,
  value: string | number | string[] | boolean | null | undefined,
  onChange: (v: string | number | string[] | boolean | null) => void,
  disabled?: boolean,
) {
  switch (q.type) {
    case 'open_text':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
          rows={3}
          disabled={disabled}
          className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50"
        />
      );
    case 'multi_select': {
      const selected = Array.isArray(value) ? value as string[] : [];
      return (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(q.options || []).map((opt) => {
            const on = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs cursor-pointer ${
                  on ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 hover:bg-slate-50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt);
                    onChange(next);
                  }}
                  className="w-3 h-3 rounded border-slate-300"
                />
                {opt.replace(/_/g, ' ')}
              </label>
            );
          })}
        </div>
      );
    }
    case 'yes_no':
    case 'yes_no_maybe': {
      const opts = q.options || (q.type === 'yes_no' ? ['yes', 'no'] : ['yes', 'no', 'maybe']);
      return (
        <div className="flex gap-2 mt-2">
          {opts.map((o) => {
            const on = value === o;
            return (
              <button
                key={o}
                type="button"
                disabled={disabled}
                onClick={() => onChange(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  on
                    ? o === 'yes' ? 'bg-emerald-600 text-white border-emerald-600' :
                      o === 'no' ? 'bg-rose-600 text-white border-rose-600' :
                                   'bg-amber-500 text-white border-amber-500'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    case 'rating_1_5': {
      const r = typeof value === 'number' ? value : 0;
      return (
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                r >= n ? 'bg-amber-400 border-amber-500 text-white' : 'border-slate-300 text-slate-400 hover:bg-slate-50'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              title={String(n)}
            >
              <Star className="w-4 h-4" />
            </button>
          ))}
          {r > 0 && <span className="ml-2 self-center text-xs text-slate-500">{r} / 5</span>}
        </div>
      );
    }
    default:
      return null;
  }
}
