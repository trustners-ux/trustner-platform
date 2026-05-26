/**
 * Portfolio Diagnostic — Review Page
 *
 * Where L3/L4 reviewers analyze a submitted diagnostic, override
 * verdicts with justification, add comments, and approve/request-
 * changes/reject. Sortable holdings & SIP tables + threaded
 * comment thread.
 *
 * Route: /admin/portfolio-diagnostic/[id]/review
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Send,
  Edit2,
  Loader2,
  TrendingUp,
  Users,
  Repeat,
  Star,
  FileText,
  ClipboardCheck,
  FileSpreadsheet,
  Presentation,
  Mail,
  Eye,
  Clock,
  Trash2,
} from 'lucide-react';
import type {
  Verdict,
  HoldingSortField,
  SipSortField,
  SortDirection,
  AnalyzedHolding,
  AnalyzedSip,
} from '@/lib/portfolio-diagnostic/types';
import { NarrativeEditor } from './NarrativeEditor';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface DiagnosticDetail {
  id: number;
  documentId: string;
  familyName: string;
  status: string;
  uploadedByName: string;
  currentReviewerName: string | null;
  totalInvestedInr: number;
  currentValueInr: number;
  familyXirrPct: number | null;
  monthlySipFlowInr: number;
  numHoldings: number;
  numActiveSips: number;
  verdictCounts: Record<Verdict, number>;
  holdings: AnalyzedHolding[];
  sips: AnalyzedSip[];
  availableActions: string[];
}

interface Comment {
  id: number;
  authorName: string;
  authorRole: string;
  commentText: string;
  holdingId?: number;
  createdAt: string;
}

interface ShareHistoryItem {
  id: number;
  createdAt: string;
  actorName: string;
  actorEmail: string;
  deliverables: string[];
  recipients: string[];
  ccs: string[];
  hadCustomMessage: boolean;
  engagement?: {
    totalOpens: number;
    openedDeliverables: string[];
    deliverables: Array<{
      id: string;
      opens: number;
      firstOpenedAt: string | null;
      lastOpenedAt: string | null;
      expiresAt: string;
      revoked: boolean;
    }>;
  };
}

// Catalog mirrors src/lib/portfolio-diagnostic/send-client-share-email.ts
// (kept in sync — small enough that duplication is cheaper than an extra fetch).
const DELIVERABLE_CATALOG: Array<{
  id: 'one-pager' | 'full' | 'three-pager' | 'action' | 'xlsx' | 'pptx';
  label: string;
  desc: string;
  previewSuffix: string;
}> = [
  { id: 'one-pager',   label: '📋 One-Pager Snapshot',     desc: 'Single-page bottom-line summary',                          previewSuffix: 'one-pager'   },
  { id: 'full',        label: '📄 Full Portfolio Review',  desc: 'Detailed 2-page tier-by-tier verdict report',              previewSuffix: 'full'        },
  { id: 'three-pager', label: '📊 Three-Pager Diagnostic', desc: 'Methodology + holdings + wealth projection',               previewSuffix: 'three-pager' },
  { id: 'action',      label: '✅ Action Sheet',            desc: 'Sign-off ready execution plan with tax estimate',          previewSuffix: 'action'      },
  { id: 'xlsx',        label: '📈 Wealth Math Tracker',     desc: 'Excel workbook with stay-vs-realign math',                 previewSuffix: 'xlsx'        },
  { id: 'pptx',        label: '🎯 Family Meeting Deck',     desc: 'PowerPoint for the in-person review',                      previewSuffix: 'pptx'        },
];

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [diagnostic, setDiagnostic] = useState<DiagnosticDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort state
  const [holdingSort, setHoldingSort] = useState<{
    field: HoldingSortField;
    direction: SortDirection;
  }>({ field: 'verdict', direction: 'asc' });
  const [sipSort, setSipSort] = useState<{
    field: SipSortField;
    direction: SortDirection;
  }>({ field: 'monthlyAmountInr', direction: 'desc' });

  // UI state
  const [activeTab, setActiveTab] = useState<'holdings' | 'sips' | 'narrative' | 'comments'>('holdings');
  const [overrideOpen, setOverrideOpen] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Share-with-Client state — planner picks which deliverables to send
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSelected, setShareSelected] = useState<Record<string, boolean>>({
    'one-pager': false, full: false, 'three-pager': false,
    action: false, xlsx: false, pptx: false,
  });
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareCc, setShareCc] = useState('wecare@trustner.in');
  const [shareSubject, setShareSubject] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareIncludeKpi, setShareIncludeKpi] = useState(true);
  const [shareSending, setShareSending] = useState(false);
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);

  useEffect(() => {
    void loadDiagnostic();
    void loadShareHistory();
  }, [id]);

  async function loadDiagnostic() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error ?? `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setDiagnostic(data.diagnostic);
      setComments(data.comments ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadShareHistory() {
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}/share`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setShareHistory(data.shares ?? []);
    } catch {
      // Silent — history is a nice-to-have, not blocking
    }
  }

  async function sendShare() {
    const selectedIds = Object.entries(shareSelected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedIds.length === 0) {
      alert('Pick at least one report to share.');
      return;
    }
    const recipients = shareRecipient
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      alert('Add at least one recipient email.');
      return;
    }
    const ccs = shareCc
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setShareSending(true);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deliverableIds: selectedIds,
          recipientEmails: recipients,
          ccEmails: ccs,
          subject: shareSubject || undefined,
          message: shareMessage || undefined,
          includeKpiSnapshot: shareIncludeKpi,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Send failed: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      alert(`Sent ${selectedIds.length} report(s) to ${recipients.join(', ')}.`);
      // Reset selection but keep recipient + cc for follow-ups
      setShareSelected({
        'one-pager': false, full: false, 'three-pager': false,
        action: false, xlsx: false, pptx: false,
      });
      setShareSubject('');
      setShareMessage('');
      void loadShareHistory();
    } catch (e) {
      alert(`Send failed: ${(e as Error).message}`);
    } finally {
      setShareSending(false);
    }
  }

  // ── Workflow actions ─────────────────────────────────────────
  async function workflowAction(
    action: 'submit' | 'approve' | 'request-changes' | 'reject' | 'publish',
    comment?: string
  ) {
    setActionInProgress(action);
    try {
      const res = await fetch(
        `/api/admin/portfolio-diagnostic/${id}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ comment }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Action failed: ${errData.error ?? `HTTP ${res.status}`}`);
        return;
      }
      void loadDiagnostic();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionInProgress(null);
    }
  }

  // ── Verdict override ─────────────────────────────────────────
  async function overrideVerdict(
    holdingId: number,
    newVerdict: Verdict,
    reason: string
  ) {
    const res = await fetch(
      `/api/admin/portfolio-diagnostic/${id}/holdings/${holdingId}/override`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newVerdict, reason }),
      }
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(`Override failed: ${errData.error ?? `HTTP ${res.status}`}`);
      return;
    }
    setOverrideOpen(null);
    void loadDiagnostic();
  }

  // ── Add comment ──────────────────────────────────────────────
  async function addComment(commentText: string, holdingId?: number) {
    const res = await fetch(
      `/api/admin/portfolio-diagnostic/${id}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentText, holdingId }),
      }
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(`Comment failed: ${errData.error ?? `HTTP ${res.status}`}`);
      return;
    }
    void loadDiagnostic();
  }

  // ── Sort helpers ─────────────────────────────────────────────
  function toggleHoldingSort(field: HoldingSortField) {
    setHoldingSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  }
  function toggleSipSort(field: SipSortField) {
    setSipSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !diagnostic) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error loading diagnostic:</strong> {error ?? 'Unknown error'}
        <div className="mt-3">
          <Link
            href="/admin/portfolio-diagnostic"
            className="inline-flex items-center text-sm text-rose-700 hover:text-rose-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const sortedHoldings = [...diagnostic.holdings].sort((a, b) => {
    const cmp = compareHoldings(a, b, holdingSort.field);
    return holdingSort.direction === 'asc' ? cmp : -cmp;
  });
  const sortedSips = [...diagnostic.sips].sort((a, b) => {
    const cmp = compareSips(a, b, sipSort.field);
    return sipSort.direction === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-5">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/portfolio-diagnostic"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
        </Link>
        <span className="text-xs font-mono text-slate-400">{diagnostic.documentId}</span>
      </div>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-primary-700 truncate">
                {diagnostic.familyName}
              </h1>
              <StatusBadge status={diagnostic.status} />
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Uploaded by <strong>{diagnostic.uploadedByName}</strong></span>
              {diagnostic.currentReviewerName && (
                <span>Reviewer: <strong>{diagnostic.currentReviewerName}</strong></span>
              )}
            </div>
          </div>

          {/* Workflow actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {diagnostic.availableActions?.includes('REQUEST_CHANGES') && (
              <button
                onClick={() => {
                  const reason = prompt('What changes are needed?');
                  if (reason) void workflowAction('request-changes', reason);
                }}
                disabled={!!actionInProgress}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Request Changes
              </button>
            )}
            {diagnostic.availableActions?.includes('REJECT') && (
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection?');
                  if (reason) void workflowAction('reject', reason);
                }}
                disabled={!!actionInProgress}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            )}
            {diagnostic.availableActions?.includes('APPROVE') && (
              <button
                onClick={() => void workflowAction('approve')}
                disabled={!!actionInProgress}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionInProgress === 'approve' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
            )}
            {diagnostic.availableActions?.includes('PUBLISH') && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Mark this diagnostic as Published (internally final & ready)? ' +
                        'The client will NOT be auto-emailed — you choose which reports to share ' +
                        'from the "Share with Client" panel below.'
                    )
                  )
                    void workflowAction('publish');
                }}
                disabled={!!actionInProgress}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {actionInProgress === 'publish' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Mark Published
              </button>
            )}
          </div>
        </div>

        {/* Internal preview — advisor views all 6 formats privately to judge which to share */}
        {diagnostic.holdings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">INTERNAL PREVIEW (advisor only — client sees nothing until you Share)</span>
              </div>
              <span className="text-xs text-slate-500">
                HTML → Cmd+P → PDF · XLSX / PPTX download directly
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=one-pager`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <FileText className="h-3.5 w-3.5" />
                One-Pager Snapshot
              </a>
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=full`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800"
              >
                <FileText className="h-3.5 w-3.5" />
                Full Portfolio Review (2-page)
              </a>
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=three-pager`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-900 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-950"
              >
                <FileText className="h-3.5 w-3.5" />
                Three-Pager Report
              </a>
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=action`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Action Sheet
              </a>
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=xlsx`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Wealth Math Tracker (.xlsx)
              </a>
              <a
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=pptx`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-800"
              >
                <Presentation className="h-3.5 w-3.5" />
                Family Meeting Deck (.pptx)
              </a>
            </div>
          </div>
        )}

        {/* Snapshot tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <SnapshotTile icon={TrendingUp} label="Family AUM" value={formatInr(diagnostic.currentValueInr)} />
          <SnapshotTile icon={TrendingUp} label="Invested" value={formatInr(diagnostic.totalInvestedInr)} />
          <SnapshotTile icon={Users} label="Holdings" value={String(diagnostic.numHoldings)} />
          <SnapshotTile icon={Repeat} label="Active SIPs" value={`${diagnostic.numActiveSips} / ${formatInr(diagnostic.monthlySipFlowInr)}/mo`} />
          <SnapshotTile icon={Star} label="Family XIRR" value={diagnostic.familyXirrPct !== null ? `${diagnostic.familyXirrPct.toFixed(2)}%` : '—'} />
        </div>

        {/* Verdict pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-slate-500">Verdicts:</span>
          {(['STAR', 'KEEP', 'WATCH', 'SWAP', 'LIQUIDATE'] as Verdict[]).map((v) => (
            <VerdictPill key={v} verdict={v} count={diagnostic.verdictCounts?.[v] ?? 0} />
          ))}
          <span className="ml-auto flex items-center gap-3">
            <Link
              href={`/admin/audit/views?artefactType=portfolio_diagnostic&artefactId=${id}`}
              className="text-xs text-slate-500 hover:text-primary-600 inline-flex items-center gap-1"
              title="See who has viewed this diagnostic"
            >
              <Clock className="h-3 w-3" />
              View audit log
            </Link>
            <button
              onClick={async () => {
                const ok = confirm(
                  `Permanently delete this diagnostic?\n\n` +
                  `Family: ${diagnostic.familyName}\n` +
                  `Status: ${diagnostic.status}\n` +
                  `${diagnostic.numHoldings} holdings · ${diagnostic.numActiveSips} SIPs\n\n` +
                  `This will also delete:\n` +
                  `  • All comments and reviewer notes\n` +
                  `  • The LLM narrative draft (if any)\n` +
                  `  • Any active share links sent to the client\n\n` +
                  `This action cannot be undone. Admin only.`
                );
                if (!ok) return;
                const res = await fetch(`/api/admin/portfolio-diagnostic/${id}`, { method: 'DELETE', credentials: 'include' });
                if (res.ok) {
                  router.push('/admin/portfolio-diagnostic');
                } else {
                  const err = await res.json().catch(() => ({}));
                  alert(`Delete failed: ${err.error ?? res.status}`);
                }
              }}
              className="text-xs text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 border border-rose-200 rounded px-2 py-0.5 hover:bg-rose-50"
              title="Admin only — permanently delete this diagnostic"
            >
              <Trash2 className="h-3 w-3" />
              Delete diagnostic
            </button>
          </span>
        </div>
      </div>

      {/* ──── SHARE WITH CLIENT ─────────────────────────────────────
          Only visible once internally approved. Planner picks which
          reports to send — never auto-sends. Tracks history for audit. */}
      {['APPROVED', 'PUBLISHED'].includes(diagnostic.status) && (
        <div className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-700" />
              <h2 className="text-base font-bold text-teal-900">Share with Client</h2>
              <span className="text-xs text-slate-500">
                · You decide which reports go out, when, and to whom.
              </span>
            </div>
            <button
              onClick={() => setShareOpen((v) => !v)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              {shareOpen ? 'Hide' : `Compose share${shareHistory.length > 0 ? ` (${shareHistory.length} sent)` : ''}`}
            </button>
          </div>

          {shareOpen && (
            <div className="mt-4 space-y-4">
              {/* Pick reports */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                  1 · Pick reports to include
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DELIVERABLE_CATALOG.map((d) => (
                    <label
                      key={d.id}
                      className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition ${
                        shareSelected[d.id]
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={shareSelected[d.id]}
                        onChange={(e) =>
                          setShareSelected((prev) => ({ ...prev, [d.id]: e.target.checked }))
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{d.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{d.desc}</div>
                        <a
                          href={`/api/admin/portfolio-diagnostic/${id}/report?type=${d.previewSuffix}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-teal-700 hover:text-teal-900 mt-1 inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Preview
                        </a>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Tip: not every client needs all six. Retail clients usually value just
                  One-Pager + Action; HNI/UHNI families typically get Full + Meeting Deck.
                </div>
              </div>

              {/* Recipients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
                    2 · To (client email)
                  </label>
                  <input
                    type="text"
                    value={shareRecipient}
                    onChange={(e) => setShareRecipient(e.target.value)}
                    placeholder="client@example.com (comma-separate multiple)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
                    Cc (internal)
                  </label>
                  <input
                    type="text"
                    value={shareCc}
                    onChange={(e) => setShareCc(e.target.value)}
                    placeholder="wecare@trustner.in"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject + Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
                  3 · Subject (optional — defaults to portfolio report)
                </label>
                <input
                  type="text"
                  value={shareSubject}
                  onChange={(e) => setShareSubject(e.target.value)}
                  placeholder={`Your Portfolio Diagnostic Report — ${diagnostic.familyName}`}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
                  4 · Personal note (optional — replaces default intro paragraph)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={4}
                  placeholder="e.g. Dear Ramesh, I have completed a fresh review of your family portfolio. Before we meet on Friday, please review the Action Sheet — I have flagged 2 swaps that will save you ~₹38k in expense ratio annually..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Options */}
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={shareIncludeKpi}
                  onChange={(e) => setShareIncludeKpi(e.target.checked)}
                />
                Include KPI snapshot (Invested / Current / Gain / XIRR) at top of email
              </label>

              {/* Send */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">
                    {Object.values(shareSelected).filter(Boolean).length}
                  </span>{' '}
                  report(s) selected ·{' '}
                  <span className="font-semibold">
                    {shareRecipient.split(/[,;\n]/).filter((s) => s.trim()).length}
                  </span>{' '}
                  recipient(s)
                </div>
                <button
                  onClick={() => void sendShare()}
                  disabled={shareSending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {shareSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send to Client
                </button>
              </div>
            </div>
          )}

          {/* History timeline */}
          {shareHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-teal-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Share History ({shareHistory.length})
                </span>
              </div>
              <div className="space-y-2">
                {shareHistory.map((h) => (
                  <div key={h.id} className="text-xs text-slate-700 bg-white rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span>
                        <strong>{h.actorName}</strong> shared{' '}
                        <strong>
                          {h.deliverables.length} report{h.deliverables.length !== 1 ? 's' : ''}
                        </strong>{' '}
                        with <strong>{h.recipients.join(', ')}</strong>
                        {h.ccs.length > 0 && <span className="text-slate-500"> (cc {h.ccs.join(', ')})</span>}
                      </span>
                      <span className="text-slate-500">
                        {new Date(h.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {h.deliverables.join(' · ')}
                      {h.hadCustomMessage && ' · custom note'}
                    </div>
                    {/* Engagement signals — what the client actually opened */}
                    {h.engagement && h.engagement.totalOpens > 0 ? (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Eye className="h-2.5 w-2.5" />
                          {h.engagement.totalOpens} open{h.engagement.totalOpens !== 1 ? 's' : ''}
                        </span>
                        {h.engagement.deliverables.filter((d) => d.opens > 0).map((d) => (
                          <span key={d.id} className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                            {d.id}: {d.opens}×
                          </span>
                        ))}
                      </div>
                    ) : h.engagement ? (
                      <div className="mt-1.5 text-[10px] text-slate-400 italic">
                        Not yet opened by the client
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          <TabPill label={`Holdings (${diagnostic.holdings.length})`} active={activeTab === 'holdings'} onClick={() => setActiveTab('holdings')} />
          <TabPill label={`SIPs (${diagnostic.sips.length})`} active={activeTab === 'sips'} onClick={() => setActiveTab('sips')} />
          <TabPill label="✨ Narrative" active={activeTab === 'narrative'} onClick={() => setActiveTab('narrative')} />
          <TabPill label={`Comments (${comments.length})`} active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
        </nav>
      </div>

      {/* HOLDINGS TAB */}
      {activeTab === 'holdings' && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <SortableTH label="Verdict" field="verdict" current={holdingSort} onSort={toggleHoldingSort} />
                <SortableTH label="Fund" field="fundName" current={holdingSort} onSort={toggleHoldingSort} />
                <SortableTH label="Entity" field="entityName" current={holdingSort} onSort={toggleHoldingSort} />
                <SortableTH label="Category" field="category" current={holdingSort} onSort={toggleHoldingSort} />
                <SortableTH label="Invested" field="investedInr" current={holdingSort} onSort={toggleHoldingSort} numeric />
                <SortableTH label="Current" field="currentValueInr" current={holdingSort} onSort={toggleHoldingSort} numeric />
                <SortableTH label="XIRR" field="xirrPct" current={holdingSort} onSort={toggleHoldingSort} numeric />
                <SortableTH label="3Y" field="cagr3y" current={holdingSort} onSort={toggleHoldingSort} numeric />
                <SortableTH label="Score" field="compositeScore" current={holdingSort} onSort={toggleHoldingSort} numeric />
                <th className="px-3 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHoldings.map((h) => (
                <HoldingRow
                  key={h.id}
                  holding={h}
                  overrideOpen={overrideOpen === parseInt(h.id, 10)}
                  onToggleOverride={() => setOverrideOpen(overrideOpen === parseInt(h.id, 10) ? null : parseInt(h.id, 10))}
                  onOverride={(newVerdict, reason) =>
                    overrideVerdict(parseInt(h.id, 10), newVerdict, reason)
                  }
                  onComment={(text) => addComment(text, parseInt(h.id, 10))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SIPs TAB */}
      {activeTab === 'sips' && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <SortableTH label="Status" field="status" current={sipSort} onSort={toggleSipSort} />
                <SortableTH label="Fund" field="fundName" current={sipSort} onSort={toggleSipSort} />
                <SortableTH label="Entity" field="entityName" current={sipSort} onSort={toggleSipSort} />
                <SortableTH label="Monthly ₹" field="monthlyAmountInr" current={sipSort} onSort={toggleSipSort} numeric />
                <SortableTH label="Start" field="startDate" current={sipSort} onSort={toggleSipSort} />
                <SortableTH label="Age (mo)" field="ageInMonths" current={sipSort} onSort={toggleSipSort} numeric />
                <SortableTH label="5Y Inflow ₹" field="expected5YInflowInr" current={sipSort} onSort={toggleSipSort} numeric />
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSips.map((s) => (
                <SipRow key={s.id} sip={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NARRATIVE TAB — Phase-2 reviewer override UI for LLM narrative */}
      {activeTab === 'narrative' && (
        <NarrativeEditor diagnosticRunId={parseInt(id as string, 10)} />
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'comments' && (
        <CommentsThread comments={comments} onAddComment={(t) => addComment(t)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-50 text-blue-700',
    IN_REVIEW: 'bg-blue-100 text-blue-800',
    ESCALATED: 'bg-purple-100 text-purple-800',
    CHANGES_REQUESTED: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    PUBLISHED: 'bg-emerald-600 text-white',
    REJECTED: 'bg-rose-100 text-rose-800',
    ARCHIVED: 'bg-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? 'bg-slate-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function VerdictPill({ verdict, count }: { verdict: Verdict; count: number }) {
  if (count === 0) return null;
  const styles: Record<Verdict, string> = {
    STAR: 'bg-amber-50 text-amber-800 border-amber-200',
    KEEP: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    WATCH: 'bg-blue-50 text-blue-800 border-blue-200',
    SWAP: 'bg-rose-50 text-rose-800 border-rose-200',
    LIQUIDATE: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[verdict]}`}>
      {verdict} {count}
    </span>
  );
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
        active ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

function SnapshotTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-base font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

interface SortableTHProps<T extends string> {
  label: string;
  field: T;
  current: { field: T; direction: SortDirection };
  onSort: (field: T) => void;
  numeric?: boolean;
}

function SortableTH<T extends string>({ label, field, current, onSort, numeric }: SortableTHProps<T>) {
  const isActive = current.field === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`cursor-pointer select-none px-3 py-2 ${numeric ? 'text-right' : 'text-left'} font-semibold hover:bg-slate-100 transition`}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {isActive && (current.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </span>
    </th>
  );
}

// ─── Holding Row ────────────────────────────────────────────────

function HoldingRow({
  holding: h,
  overrideOpen,
  onToggleOverride,
  onOverride,
  onComment,
}: {
  holding: AnalyzedHolding;
  overrideOpen: boolean;
  onToggleOverride: () => void;
  onOverride: (v: Verdict, reason: string) => void;
  onComment: (text: string) => void;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50/40">
        <td className="px-3 py-2"><VerdictBadge verdict={h.verdict} /></td>
        <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate" title={h.fundName}>{h.fundName}</td>
        <td className="px-3 py-2 text-xs text-slate-600">{h.entityName}</td>
        <td className="px-3 py-2 text-xs text-slate-600">{h.category}</td>
        <td className="px-3 py-2 text-right text-xs">{formatInr(h.investedInr)}</td>
        <td className="px-3 py-2 text-right text-xs font-semibold">{formatInr(h.currentValueInr)}</td>
        <td className="px-3 py-2 text-right text-xs">{h.xirrPct !== null ? `${h.xirrPct.toFixed(1)}%` : '—'}</td>
        <td className="px-3 py-2 text-right text-xs">{h.cagr3y !== null ? `${h.cagr3y.toFixed(1)}%` : '—'}</td>
        <td className="px-3 py-2 text-right text-xs">{h.compositeScore !== null ? h.compositeScore.toFixed(2) : '—'}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleOverride}
              title="Override verdict"
              className="text-slate-400 hover:text-slate-700"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                const text = prompt('Add a comment on this holding:');
                if (text) onComment(text);
              }}
              title="Add comment"
              className="text-slate-400 hover:text-slate-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {overrideOpen && (
        <tr>
          <td colSpan={10} className="px-3 py-3 bg-amber-50/50 border-y border-amber-200">
            <OverrideForm
              currentVerdict={h.verdict}
              onSubmit={(v, reason) => onOverride(v, reason)}
              onCancel={onToggleOverride}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function OverrideForm({
  currentVerdict,
  onSubmit,
  onCancel,
}: {
  currentVerdict: Verdict;
  onSubmit: (v: Verdict, reason: string) => void;
  onCancel: () => void;
}) {
  const [newVerdict, setNewVerdict] = useState<Verdict>(currentVerdict);
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-amber-900">Override verdict</div>
      <div className="flex items-center gap-2">
        <select
          value={newVerdict}
          onChange={(e) => setNewVerdict(e.target.value as Verdict)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {(['STAR', 'KEEP', 'WATCH', 'SWAP', 'LIQUIDATE'] as Verdict[]).map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Justification (required)..."
          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          onClick={() => reason.length >= 5 && onSubmit(newVerdict, reason)}
          disabled={reason.length < 5}
          className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Save
        </button>
        <button onClick={onCancel} className="rounded-md border px-3 py-1 text-xs">Cancel</button>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    STAR: 'bg-amber-100 text-amber-800 border-amber-300',
    KEEP: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    WATCH: 'bg-blue-100 text-blue-800 border-blue-300',
    SWAP: 'bg-rose-100 text-rose-800 border-rose-300',
    LIQUIDATE: 'bg-slate-200 text-slate-700 border-slate-300',
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${styles[verdict]}`}>
      {verdict}
    </span>
  );
}

// ─── SIP Row ────────────────────────────────────────────────────

function SipRow({ sip: s }: { sip: AnalyzedSip }) {
  return (
    <tr className="hover:bg-slate-50/40">
      <td className="px-3 py-2"><SipStatusBadge status={s.status} /></td>
      <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate" title={s.fundName}>{s.fundName}</td>
      <td className="px-3 py-2 text-xs text-slate-600">{s.entityName}</td>
      <td className="px-3 py-2 text-right text-xs font-semibold">{formatInr(s.monthlyAmountInr)}/mo</td>
      <td className="px-3 py-2 text-xs">{s.startDate}</td>
      <td className="px-3 py-2 text-right text-xs">{s.ageInMonths} mo</td>
      <td className="px-3 py-2 text-right text-xs">{formatInr(s.expected5YInflowInr)}</td>
      <td className="px-3 py-2 text-xs">
        {s.recommendedAction && (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            s.recommendedAction === 'Continue' ? 'bg-emerald-50 text-emerald-800' :
            s.recommendedAction === 'Re-direct' ? 'bg-amber-50 text-amber-800' :
            s.recommendedAction === 'Stop' ? 'bg-rose-50 text-rose-800' :
            'bg-slate-100 text-slate-700'
          }`}>
            {s.recommendedAction}
          </span>
        )}
      </td>
    </tr>
  );
}

function SipStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-800',
    Paused: 'bg-amber-50 text-amber-800',
    Stopped: 'bg-rose-50 text-rose-800',
    Completed: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[status] ?? 'bg-slate-100'}`}>
      {status}
    </span>
  );
}

// ─── Comments thread ────────────────────────────────────────────

function CommentsThread({
  comments,
  onAddComment,
}: {
  comments: Comment[];
  onAddComment: (text: string) => void;
}) {
  const [newComment, setNewComment] = useState('');
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Comment Thread</h3>

      {comments.length === 0 ? (
        <div className="text-sm text-slate-500 italic py-4">No comments yet.</div>
      ) : (
        <ul className="space-y-3 mb-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">{c.authorName}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{c.authorRole}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{formatRelative(c.createdAt)}</span>
                {c.holdingId && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">on holding #{c.holdingId}</span>
                )}
              </div>
              <div className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap">{c.commentText}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => {
            if (newComment.trim()) {
              onAddComment(newComment.trim());
              setNewComment('');
            }
          }}
          disabled={!newComment.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Post
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SORT COMPARATORS
// ─────────────────────────────────────────────────────────────────

const VERDICT_ORDER: Record<Verdict, number> = {
  STAR: 1, KEEP: 2, WATCH: 3, SWAP: 4, LIQUIDATE: 5,
};

function compareHoldings(a: AnalyzedHolding, b: AnalyzedHolding, field: HoldingSortField): number {
  switch (field) {
    case 'fundName': return a.fundName.localeCompare(b.fundName);
    case 'category': return (a.category ?? '').localeCompare(b.category ?? '');
    case 'entityName': return a.entityName.localeCompare(b.entityName);
    case 'investedInr': return a.investedInr - b.investedInr;
    case 'currentValueInr': return a.currentValueInr - b.currentValueInr;
    case 'unrealisedGainInr': return a.unrealisedGainInr - b.unrealisedGainInr;
    case 'xirrPct': return (a.xirrPct ?? -Infinity) - (b.xirrPct ?? -Infinity);
    case 'cagr3y': return (a.cagr3y ?? -Infinity) - (b.cagr3y ?? -Infinity);
    case 'cagr5y': return (a.cagr5y ?? -Infinity) - (b.cagr5y ?? -Infinity);
    case 'categoryQuartile': return (a.categoryQuartile ?? 5) - (b.categoryQuartile ?? 5);
    case 'compositeScore': return (a.compositeScore ?? -Infinity) - (b.compositeScore ?? -Infinity);
    case 'verdict': return VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict];
    case 'holdingPeriodMonths': return a.holdingPeriodMonths - b.holdingPeriodMonths;
  }
}

function compareSips(a: AnalyzedSip, b: AnalyzedSip, field: SipSortField): number {
  switch (field) {
    case 'fundName': return a.fundName.localeCompare(b.fundName);
    case 'entityName': return a.entityName.localeCompare(b.entityName);
    case 'monthlyAmountInr': return a.monthlyAmountInr - b.monthlyAmountInr;
    case 'startDate': return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    case 'ageInMonths': return a.ageInMonths - b.ageInMonths;
    case 'status': return a.status.localeCompare(b.status);
    case 'nextInstallmentDate': {
      if (!a.nextInstallmentDate) return 1;
      if (!b.nextInstallmentDate) return -1;
      return new Date(a.nextInstallmentDate).getTime() - new Date(b.nextInstallmentDate).getTime();
    }
    case 'expected5YInflowInr': return a.expected5YInflowInr - b.expected5YInflowInr;
  }
}

// ─────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────

function formatInr(v: number): string {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)} K`;
  return `₹${v.toFixed(0)}`;
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}
