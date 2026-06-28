/**
 * Client Orientation — Review (read-only + workflow actions)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, MessageSquare, Send, AlertTriangle, FileText,
} from 'lucide-react';

interface Orientation {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  risk_score: number | null;
  risk_category: string | null;
  monthly_household_income_inr: number | null;
  monthly_household_expenses_inr: number | null;
  num_dependents: number;
  pref_channel: string | null;
  pref_review_frequency: string | null;
  approved_at: string | null;
  published_at: string | null;
  uploader?: { name?: string } | { name?: string }[];
  reviewer?: { name?: string } | { name?: string }[];
  approver?: { name?: string } | { name?: string }[];
  risk_responses: Array<{ question_code: string; question_text: string; response_text: string; response_score: number }>;
  goals: Array<{
    id: number;
    goal_type: string;
    custom_goal_name: string | null;
    target_year: number;
    target_corpus_future_value_inr: number | null;
    required_monthly_sip_inr: number | null;
    existing_corpus_inr: number;
    priority: string;
  }>;
}

function extractName(emp: unknown): string {
  if (!emp) return '—';
  if (Array.isArray(emp)) return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? '—') : '—';
  if (typeof emp === 'object' && emp !== null && 'name' in emp) return (emp as { name?: string }).name ?? '—';
  return '—';
}

export default function ReviewOrientationPage() {
  const { id } = useParams<{ id: string }>();
  const [orient, setOrient] = useState<Orientation | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-orientation/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrient(data.orientation);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function performAction(slug: string, needsComment: boolean) {
    if (needsComment && comment.trim().length === 0) {
      setMessage({ type: 'error', text: 'Please add a comment for this action.' });
      return;
    }
    setActing(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/client-orientation/${id}/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? `${slug} failed` });
      } else {
        setMessage({ type: 'success', text: `Status updated to ${data.newStatus}` });
        setComment('');
        await load();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">Loading…</div>;
  }
  if (!orient) {
    return <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">Orientation not found.</div>;
  }

  const canApprove = ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(orient.status);
  const canPublish = orient.status === 'APPROVED';
  const surplus =
    (orient.monthly_household_income_inr ?? 0) - (orient.monthly_household_expenses_inr ?? 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/client-orientation" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{orient.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{orient.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {orient.num_dependents} dependents · {orient.pref_channel ?? '—'} · {orient.pref_review_frequency ?? '—'} reviews
            </p>
          </div>
          <StatusBadge status={orient.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Monthly Income" value={`₹${(orient.monthly_household_income_inr ?? 0).toLocaleString('en-IN')}`} />
          <Stat label="Monthly Expenses" value={`₹${(orient.monthly_household_expenses_inr ?? 0).toLocaleString('en-IN')}`} />
          <Stat label="Monthly Surplus" value={`₹${surplus.toLocaleString('en-IN')}`} />
          <Stat label="Risk Category" value={orient.risk_category ?? '—'} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <People label="Drafted by" name={extractName(orient.uploader)} />
          <People label="Current Reviewer" name={extractName(orient.reviewer)} />
          <People label="Approved by" name={extractName(orient.approver)} />
        </div>
      </div>

      {/* Risk responses */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Risk Profile Responses
          {orient.risk_score !== null && (
            <span className="ml-3 text-xs font-normal text-slate-500">
              Score: {orient.risk_score} · {orient.risk_category}
            </span>
          )}
        </h2>
        {(orient.risk_responses ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 italic">No risk responses captured.</p>
        ) : (
          <div className="space-y-2">
            {orient.risk_responses.map((r) => (
              <div key={r.question_code} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="text-sm text-slate-700">
                  <span className="text-xs font-mono text-slate-400 mr-2">{r.question_code}</span>
                  {r.question_text}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-medium text-slate-900">{r.response_text}</div>
                  <div className="text-[10px] text-slate-500">score {r.response_score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Financial Goals ({(orient.goals ?? []).length})
        </h2>
        {(orient.goals ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 italic">No goals captured.</p>
        ) : (
          <div className="space-y-2">
            {orient.goals.map((g) => (
              <div key={g.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {g.custom_goal_name ?? g.goal_type}
                    <span className="ml-2 text-xs font-normal text-slate-500">by {g.target_year}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Future value ₹{(g.target_corpus_future_value_inr ?? 0).toLocaleString('en-IN')}
                    {g.required_monthly_sip_inr !== null && ` · SIP ₹${g.required_monthly_sip_inr.toLocaleString('en-IN')}/mo`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${g.priority === 'High' ? 'bg-red-100 text-red-700' : g.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                  {g.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(canApprove || canPublish) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Action</h2>
          {canApprove && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Reviewer notes (required for Request Changes / Reject)…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 mb-3"
            />
          )}
          {message && (
            <div className={`rounded-lg border p-3 mb-3 flex items-start gap-2 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <a href={`/api/admin/client-orientation/${id}/summary`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
              <FileText className="w-4 h-4" /> Client Summary
            </a>
            {canApprove && (
              <>
                <button type="button" onClick={() => performAction('request-changes', true)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50">
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </button>
                <button type="button" onClick={() => performAction('reject', true)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm font-semibold hover:bg-red-100 disabled:opacity-50">
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button type="button" onClick={() => performAction('approve', false)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </>
            )}
            {canPublish && (
              <button type="button" onClick={() => performAction('publish', false)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
                Publish
              </button>
            )}
          </div>
        </div>
      )}

      {!canApprove && !canPublish && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          No reviewer action available in <strong>{orient.status}</strong> state.
          {orient.status === 'DRAFT' && (
            <>
              {' '}<Link href={`/admin/client-orientation/${orient.id}/edit`} className="text-brand-600 hover:underline font-medium">Open editor →</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    CHANGES_REQUESTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    PUBLISHED: 'bg-purple-100 text-purple-700',
    REJECTED: 'bg-red-100 text-red-700',
    ESCALATED: 'bg-pink-100 text-pink-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
function People({ label, name }: { label: string; name: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xs font-semibold text-slate-900 mt-0.5 truncate">{name}</div>
    </div>
  );
}
