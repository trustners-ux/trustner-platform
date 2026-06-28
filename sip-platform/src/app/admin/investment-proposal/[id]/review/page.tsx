/**
 * Investment Proposal — Review
 *
 * Read-only view for approvers with Approve / Request Changes / Reject / Publish buttons.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, MessageSquare, Send, AlertTriangle, FileText,
} from 'lucide-react';

interface Proposal {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  purpose: string;
  custom_purpose_note: string | null;
  proposed_amount_inr: number;
  proposed_lump_sum_inr: number;
  proposed_monthly_sip_inr: number;
  horizon: string;
  risk_profile: string;
  goal_statement: string | null;
  alloc_large_cap_pct: number;
  alloc_mid_cap_pct: number;
  alloc_small_cap_pct: number;
  alloc_flexi_cap_pct: number;
  alloc_multi_cap_pct: number;
  alloc_large_and_mid_pct: number;
  alloc_hybrid_pct: number;
  alloc_debt_pct: number;
  alloc_international_pct: number;
  alloc_gold_pct: number;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  uploader?: { name?: string } | { name?: string }[];
  reviewer?: { name?: string } | { name?: string }[];
  approver?: { name?: string } | { name?: string }[];
}

const ALLOC_LABELS: { label: string; col: keyof Proposal }[] = [
  { label: 'Large Cap',         col: 'alloc_large_cap_pct' },
  { label: 'Mid Cap',           col: 'alloc_mid_cap_pct' },
  { label: 'Small Cap',         col: 'alloc_small_cap_pct' },
  { label: 'Flexi Cap',         col: 'alloc_flexi_cap_pct' },
  { label: 'Multi Cap',         col: 'alloc_multi_cap_pct' },
  { label: 'Large & Mid Cap',   col: 'alloc_large_and_mid_pct' },
  { label: 'Hybrid',            col: 'alloc_hybrid_pct' },
  { label: 'Debt',              col: 'alloc_debt_pct' },
  { label: 'International',     col: 'alloc_international_pct' },
  { label: 'Gold',              col: 'alloc_gold_pct' },
];

function extractName(emp: unknown): string {
  if (!emp) return '—';
  if (Array.isArray(emp)) {
    return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? '—') : '—';
  }
  if (typeof emp === 'object' && emp !== null && 'name' in emp) {
    return (emp as { name?: string }).name ?? '—';
  }
  return '—';
}

export default function ReviewInvestmentProposalPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/investment-proposal/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function performAction(slug: string, needsComment: boolean) {
    if (needsComment && comment.trim().length === 0) {
      setMessage({ type: 'error', text: 'Please add a comment for this action.' });
      return;
    }
    setActing(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/investment-proposal/${id}/${slug}`, {
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
    return (
      <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">
        Loading proposal…
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        Proposal not found.
      </div>
    );
  }

  const allocTotal = ALLOC_LABELS.reduce(
    (s, l) => s + Number(proposal[l.col] ?? 0),
    0
  );

  const canApprove = ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(proposal.status);
  const canPublish = proposal.status === 'APPROVED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/investment-proposal"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{proposal.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{proposal.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {proposal.purpose} · {proposal.risk_profile} · {proposal.horizon}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="12mo Proposed" value={`₹${proposal.proposed_amount_inr.toLocaleString('en-IN')}`} />
          <Stat label="Lump Sum" value={`₹${proposal.proposed_lump_sum_inr.toLocaleString('en-IN')}`} />
          <Stat label="Monthly SIP" value={`₹${proposal.proposed_monthly_sip_inr.toLocaleString('en-IN')}`} />
          <Stat label="Horizon" value={proposal.horizon} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <People label="Drafted by" name={extractName(proposal.uploader)} />
          <People label="Current Reviewer" name={extractName(proposal.reviewer)} />
          <People label="Approved by" name={extractName(proposal.approver)} />
        </div>

        {proposal.goal_statement && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <strong>Goal:</strong> {proposal.goal_statement}
          </div>
        )}
      </div>

      {/* Allocation read-only */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Recommended Allocation
        </h2>
        <div className="space-y-1.5">
          {ALLOC_LABELS.filter((l) => Number(proposal[l.col]) > 0).map((l) => {
            const pct = Number(proposal[l.col]);
            return (
              <div key={l.label} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 w-32 flex-shrink-0">{l.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${Math.min(100, pct * 2)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900 w-14 text-right">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Total</span>
          <span
            className={`font-bold ${
              Math.abs(allocTotal - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {allocTotal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Comment + Actions */}
      {(canApprove || canPublish) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Action
          </h2>
          {canApprove && (
            <>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Comment <span className="text-slate-400">(required for Request Changes / Reject)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Reviewer notes — what changed, why, what should the drafter do…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 mb-3"
              />
            </>
          )}

          {message && (
            <div
              className={`rounded-lg border p-3 mb-3 flex items-start gap-2 ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <a href={`/api/admin/investment-proposal/${id}/document`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
              <FileText className="w-4 h-4" /> Proposal PDF
            </a>
            {canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => performAction('request-changes', true)}
                  disabled={acting !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => performAction('reject', true)}
                  disabled={acting !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => performAction('approve', false)}
                  disabled={acting !== null || Math.abs(allocTotal - 100) > 0.01}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </>
            )}
            {canPublish && (
              <button
                type="button"
                onClick={() => performAction('publish', false)}
                disabled={acting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Publish
              </button>
            )}
          </div>
        </div>
      )}

      {!canApprove && !canPublish && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          No reviewer action available in <strong>{proposal.status}</strong> state.
          {proposal.status === 'DRAFT' && (
            <>
              {' '}This proposal is still in draft — only the drafter can edit and submit.{' '}
              <Link href={`/admin/investment-proposal/${proposal.id}/edit`} className="text-brand-600 hover:underline font-medium">
                Open editor →
              </Link>
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
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
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
