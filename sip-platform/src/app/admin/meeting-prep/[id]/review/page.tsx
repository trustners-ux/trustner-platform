/**
 * Meeting Prep — Review
 *
 * Read-only view with Approve / Request Changes / Reject / Publish.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, MessageSquare, Send, AlertTriangle,
} from 'lucide-react';

interface Brief {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  meeting_scheduled_at: string;
  meeting_duration_minutes: number;
  meeting_format: string;
  meeting_purpose: string;
  custom_purpose_note: string | null;
  meeting_location: string | null;
  years_with_trustner: number | null;
  last_meeting_date: string | null;
  relationship_quality_score: number | null;
  relationship_notes: string | null;
  total_aum_inr: number | null;
  family_xirr_pct: number | null;
  num_holdings: number | null;
  num_active_sips: number | null;
  monthly_sip_flow_inr: number | null;
  uploader?: { name?: string } | { name?: string }[];
  reviewer?: { name?: string } | { name?: string }[];
  approver?: { name?: string } | { name?: string }[];
  action_items: Array<{ id: number; description: string; owner: string; status: string; due_date: string | null }>;
  talking_points: Array<{ id: number; order_index: number; topic: string; key_message: string; supporting_data: string | null }>;
  opportunities: Array<{ id: number; title: string; description: string; priority: string; estimated_amount_inr: number | null }>;
  qa: Array<{ id: number; question: string; anticipated_answer: string; sensitivity: string }>;
}

function extractName(emp: unknown): string {
  if (!emp) return '—';
  if (Array.isArray(emp)) return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? '—') : '—';
  if (typeof emp === 'object' && emp !== null && 'name' in emp) return (emp as { name?: string }).name ?? '—';
  return '—';
}

export default function ReviewMeetingPrepPage() {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/meeting-prep/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
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
      const res = await fetch(`/api/admin/meeting-prep/${id}/${slug}`, {
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
  if (!brief) return <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">Brief not found.</div>;

  const canApprove = ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(brief.status);
  const canPublish = brief.status === 'APPROVED';
  const meetingLabel = new Date(brief.meeting_scheduled_at).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
  const hoursUntil = (new Date(brief.meeting_scheduled_at).getTime() - Date.now()) / 3_600_000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/meeting-prep" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{brief.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{brief.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {brief.meeting_purpose} · {brief.meeting_format} · <strong>{meetingLabel}</strong> ({brief.meeting_duration_minutes} min)
            </p>
            {brief.meeting_location && <p className="text-xs text-slate-500 mt-0.5">📍 {brief.meeting_location}</p>}
          </div>
          <div className="text-right">
            <StatusBadge status={brief.status} />
            <div className={`text-xs mt-1 font-semibold ${hoursUntil < 24 ? 'text-red-600' : hoursUntil < 72 ? 'text-amber-600' : 'text-slate-500'}`}>
              {hoursUntil < 0 ? 'Meeting passed' : `in ${Math.round(hoursUntil)}h`}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total AUM" value={brief.total_aum_inr !== null ? `₹${(brief.total_aum_inr / 100000).toFixed(1)}L` : '—'} />
          <Stat label="XIRR" value={brief.family_xirr_pct !== null ? `${brief.family_xirr_pct.toFixed(2)}%` : '—'} />
          <Stat label="Holdings" value={String(brief.num_holdings ?? '—')} />
          <Stat label="Active SIPs" value={String(brief.num_active_sips ?? '—')} />
          <Stat label="Monthly SIP" value={brief.monthly_sip_flow_inr !== null ? `₹${brief.monthly_sip_flow_inr.toLocaleString('en-IN')}` : '—'} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <People label="Drafted by" name={extractName(brief.uploader)} />
          <People label="Reviewer" name={extractName(brief.reviewer)} />
          <People label="Approved by" name={extractName(brief.approver)} />
        </div>
      </div>

      {/* Relationship */}
      {(brief.years_with_trustner || brief.relationship_notes || brief.relationship_quality_score) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Relationship Snapshot</h3>
          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
            <Stat label="Years with Trustner" value={brief.years_with_trustner !== null ? `${brief.years_with_trustner} yr` : '—'} />
            <Stat label="Last Meeting" value={brief.last_meeting_date ?? '—'} />
            <Stat label="Quality Score" value={brief.relationship_quality_score !== null ? `${brief.relationship_quality_score}/5` : '—'} />
          </div>
          {brief.relationship_notes && (
            <p className="text-sm text-slate-700 italic">{brief.relationship_notes}</p>
          )}
        </div>
      )}

      {/* Talking Points */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Talking Points ({brief.talking_points?.length ?? 0})
        </h3>
        {(brief.talking_points ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 italic">No talking points captured.</p>
        ) : (
          <ol className="space-y-3">
            {brief.talking_points
              .sort((a, b) => a.order_index - b.order_index)
              .map((p) => (
                <li key={p.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="font-semibold text-slate-900 text-sm">{p.topic}</div>
                  <p className="text-sm text-slate-700 mt-1">{p.key_message}</p>
                  {p.supporting_data && (
                    <p className="text-xs text-slate-500 mt-1 italic">{p.supporting_data}</p>
                  )}
                </li>
              ))}
          </ol>
        )}
      </div>

      {/* Action Items */}
      {(brief.action_items ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Open Action Items ({brief.action_items.length})
          </h3>
          <div className="space-y-1.5">
            {brief.action_items.map((i) => (
              <div key={i.id} className="rounded border border-slate-200 p-2 flex items-center justify-between text-sm">
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
                  {i.due_date && <span className="text-slate-400">{i.due_date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {(brief.opportunities ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Opportunities ({brief.opportunities.length})
          </h3>
          <div className="space-y-2">
            {brief.opportunities.map((o) => (
              <div key={o.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{o.title}</div>
                    <p className="text-sm text-slate-700 mt-1">{o.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      o.priority === 'High' ? 'bg-red-100 text-red-700' :
                      o.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{o.priority}</span>
                    {o.estimated_amount_inr && (
                      <div className="text-xs text-slate-500 mt-1">₹{o.estimated_amount_inr.toLocaleString('en-IN')}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anticipated Q&A */}
      {(brief.qa ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Anticipated Q&amp;A ({brief.qa.length})
          </h3>
          <div className="space-y-3">
            {brief.qa.map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-3">
                <div className="text-sm">
                  <span className="font-bold text-blue-700">Q:</span>{' '}
                  <span className="font-semibold text-slate-900">{q.question}</span>
                  {q.sensitivity === 'High' && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">SENSITIVE</span>
                  )}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-bold text-emerald-700">A:</span>{' '}
                  <span className="text-slate-700">{q.anticipated_answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(canApprove || canPublish) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Action</h3>
          {canApprove && (
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Reviewer notes (required for Request Changes / Reject)…" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 mb-3" />
          )}
          {message && (
            <div className={`rounded-lg border p-3 mb-3 flex items-start gap-2 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 justify-end">
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
          No reviewer action in <strong>{brief.status}</strong>.
          {brief.status === 'DRAFT' && (
            <> <Link href={`/admin/meeting-prep/${brief.id}/edit`} className="text-brand-600 hover:underline font-medium">Open editor →</Link></>
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
