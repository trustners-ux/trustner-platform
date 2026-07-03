/**
 * Periodic Review — Review page
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Send, AlertTriangle, FileText } from 'lucide-react';
import { ShareWithClientPanel } from '@/components/admin/ShareWithClientPanel';

interface Review {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  cadence: string;
  review_period_start: string;
  review_period_end: string;
  current_aum_inr: number | null;
  period_start_aum_inr: number | null;
  period_gain_inr: number | null;
  period_return_pct: number | null;
  family_xirr_pct: number | null;
  benchmark_return_pct: number | null;
  alpha_pct: number | null;
  top_contributor_1: string | null;
  top_contributor_1_contribution_inr: number | null;
  top_contributor_2: string | null;
  top_contributor_2_contribution_inr: number | null;
  top_detractor_1: string | null;
  top_detractor_1_contribution_inr: number | null;
  top_detractor_2: string | null;
  top_detractor_2_contribution_inr: number | null;
  num_active_goals: number;
  num_goals_on_track: number;
  num_goals_behind: number;
  market_summary: string | null;
  outlook_next_period: string | null;
  uploader?: { name?: string } | { name?: string }[];
  reviewer?: { name?: string } | { name?: string }[];
  approver?: { name?: string } | { name?: string }[];
  action_items: Array<{
    id: number;
    description: string;
    owner: string;
    status: string;
    due_date: string | null;
  }>;
}

function extractName(emp: unknown): string {
  if (!emp) return '—';
  if (Array.isArray(emp)) return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? '—') : '—';
  if (typeof emp === 'object' && emp !== null && 'name' in emp) return (emp as { name?: string }).name ?? '—';
  return '—';
}

export default function ReviewPeriodicReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/periodic-review/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function performAction(slug: string, needsComment: boolean) {
    if (needsComment && comment.trim().length === 0) {
      setMessage({ type: 'error', text: 'Please add a comment.' });
      return;
    }
    setActing(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/periodic-review/${id}/${slug}`, {
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

  if (loading) return <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">Loading…</div>;
  if (!review) return <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">Review not found.</div>;

  const canApprove = ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(review.status);
  const canPublish = review.status === 'APPROVED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/periodic-review" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{review.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{review.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {review.cadence} review · {review.review_period_start} → {review.review_period_end}
            </p>
          </div>
          <StatusBadge status={review.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Period Return" value={review.period_return_pct !== null ? `${review.period_return_pct.toFixed(2)}%` : '—'} />
          <Stat label="Benchmark" value={review.benchmark_return_pct !== null ? `${review.benchmark_return_pct.toFixed(2)}%` : '—'} />
          <Stat label="Excess vs Benchmark" value={review.alpha_pct !== null ? `${review.alpha_pct >= 0 ? '+' : ''}${review.alpha_pct.toFixed(2)}%` : '—'} accent={review.alpha_pct !== null && review.alpha_pct >= 0 ? 'green' : 'red'} />
          <Stat label="XIRR" value={review.family_xirr_pct !== null ? `${review.family_xirr_pct.toFixed(2)}%` : '—'} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <People label="Drafted by" name={extractName(review.uploader)} />
          <People label="Reviewer" name={extractName(review.reviewer)} />
          <People label="Approved by" name={extractName(review.approver)} />
        </div>
      </div>

      {/* AUM */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Start AUM" value={`₹${(review.period_start_aum_inr ?? 0).toLocaleString('en-IN')}`} />
        <Stat label="Current AUM" value={`₹${(review.current_aum_inr ?? 0).toLocaleString('en-IN')}`} />
        <Stat label="Period Gain" value={`₹${(review.period_gain_inr ?? 0).toLocaleString('en-IN')}`} accent={(review.period_gain_inr ?? 0) >= 0 ? 'green' : 'red'} />
      </div>

      {/* Contributors / detractors */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wider">Top Contributors</h3>
          <ContribDisplay name={review.top_contributor_1} amt={review.top_contributor_1_contribution_inr} accent="green" />
          <ContribDisplay name={review.top_contributor_2} amt={review.top_contributor_2_contribution_inr} accent="green" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wider">Top Detractors</h3>
          <ContribDisplay name={review.top_detractor_1} amt={review.top_detractor_1_contribution_inr} accent="red" />
          <ContribDisplay name={review.top_detractor_2} amt={review.top_detractor_2_contribution_inr} accent="red" />
        </div>
      </div>

      {/* Goals */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Goals Progress</h3>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Active" value={String(review.num_active_goals)} />
          <Stat label="On Track" value={String(review.num_goals_on_track)} accent="green" />
          <Stat label="Behind" value={String(review.num_goals_behind)} accent="red" />
        </div>
      </div>

      {/* Action items */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Action Items ({(review.action_items ?? []).length})</h3>
        {(review.action_items ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 italic">No action items.</p>
        ) : (
          <div className="space-y-1.5">
            {review.action_items.map((i) => (
              <div key={i.id} className="rounded-lg border border-slate-200 p-2.5 flex items-center justify-between text-sm">
                <span className="text-slate-700">{i.description}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">{i.owner}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    i.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    i.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                    i.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {i.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commentary */}
      {(review.market_summary || review.outlook_next_period) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          {review.market_summary && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Market Summary</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{review.market_summary}</p>
            </div>
          )}
          {review.outlook_next_period && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outlook Next Period</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{review.outlook_next_period}</p>
            </div>
          )}
        </div>
      )}

      {(canApprove || canPublish) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Action</h3>
          {canApprove && (
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Reviewer notes…" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 mb-3" />
          )}
          {message && (
            <div className={`rounded-lg border p-3 mb-3 flex items-start gap-2 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <a href={`/api/admin/periodic-review/${id}/note`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
              <FileText className="w-4 h-4" /> Client Note
            </a>
            {canApprove && (
              <>
                <button type="button" onClick={() => performAction('request-changes', true)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50">
                  <MessageSquare className="w-4 h-4" /> Request Changes
                </button>
                <button type="button" onClick={() => performAction('reject', true)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm font-semibold hover:bg-red-100 disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button type="button" onClick={() => performAction('approve', false)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </>
            )}
            {canPublish && (
              <button type="button" onClick={() => performAction('publish', false)} disabled={acting !== null} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                <Send className="w-4 h-4" /> Publish
              </button>
            )}
          </div>
        </div>
      )}

      {!canApprove && !canPublish && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          No reviewer action in <strong>{review.status}</strong>.
          {review.status === 'DRAFT' && (
            <> <Link href={`/admin/periodic-review/${review.id}/edit`} className="text-brand-600 hover:underline font-medium">Open editor →</Link></>
          )}
        </div>
      )}

      <ShareWithClientPanel
        shareEndpoint={`/api/admin/periodic-review/${id}/share`}
        label="Periodic Review"
        canShare={review.status === 'APPROVED' || review.status === 'PUBLISHED'}
      />
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const cls = accent === 'green' ? 'bg-emerald-50 text-emerald-900' : accent === 'red' ? 'bg-red-50 text-red-900' : 'bg-slate-50 text-slate-900';
  return (
    <div className={`rounded-lg px-3 py-2 ${cls}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
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

function ContribDisplay({ name, amt, accent }: { name: string | null; amt: number | null; accent: 'green' | 'red' }) {
  if (!name) return <div className="text-xs text-slate-400 py-1.5 italic">—</div>;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{name}</span>
      <span className={`text-sm font-semibold ${accent === 'green' ? 'text-emerald-700' : 'text-red-700'}`}>
        {amt !== null ? `₹${amt.toLocaleString('en-IN')}` : '—'}
      </span>
    </div>
  );
}
