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

interface V2GateRow { gate: string; status: string; detail: string }
interface V2Detail {
  qualityVerdict: string | null;
  gates: V2GateRow[] | null;
  suitability: string | null;
  fundRiskTier: string | null;
  forwardAum: string | null;
  forwardDownside: string | null;
  action: string | null;
  actionLabel: string | null;
  rationale: string | null;
  rolling3yPct: number | null;
}
interface BuyListMark {
  onList: boolean;
  status: string | null;
  conviction: string | null;
  replacement: { schemeName: string; manager: string | null; cagr5y: number | null; note: string | null } | null;
}
type HoldingWithV2 = AnalyzedHolding & { v2?: V2Detail; buyList?: BuyListMark };

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
  holdings: HoldingWithV2[];
  sips: AnalyzedSip[];
  availableActions: string[];
  engineVersion?: string;
  prePublishQa?: { ready: boolean; blockers: string[]; warnings: string[] } | null;
  riskProfileCaptured?: boolean;
  riskProfile?: {
    primaryAge: number | null; lifeStage: string; monthlyIncomeInr: number; monthlyExpenseInr: number;
    livingDependsOnThis: boolean; netWorthBufferInr: number; longestHorizonYears: number | null;
    statedPriority: string; pastDrawdownBehaviour: string; targetCorpusInr: number; yearsToGoal: number | null;
  };
  riskModel?: {
    capacityScore: number | null;
    toleranceScore: number | null;
    requiredReturnPct: number | null;
    bindingConstraint: string | null;
    targetEquityPct: number | null;
    ageRuleEquityPct: number | null;
    capacityOverrodeAge: boolean | null;
    withinEquityCeiling: string | null;
    profileLabel: string | null;
    clientPosture: string | null;
    rationale: string[];
  } | null;
  consolidation?: {
    groups: {
      subCategory: string; subKey: string; count: number;
      keep: { fundName: string; quality: string | null; suitability: string | null };
      consolidate: { fundName: string; currentValueInr: number }[];
      totalConsolidatableInr: number; confidence: 'high' | 'review'; rationale: string;
    }[];
    duplicateFundCount: number;
    totalConsolidatableInr: number;
  };
  stockLookThrough?: {
    totalFunds: number; coveredFunds: number; coveragePct: number;
    multiFundStocks: number; asOfDate: string | null;
    topStocks: { stock: string; sector: string | null; effectiveValueInr: number; effectivePctOfFamily: number; fundCount: number; funds: string[] }[];
    sectorConcentration: { sector: string; pctOfCovered: number }[];
  } | null;
  taxSummary?: {
    lines: { holdingId: number; fundName: string; gainInr: number; gainType: string; locked: boolean; estTaxInr: number | null; note: string }[];
    exitCount: number; totalGainInr: number; ltcgGainInr: number; stcgGainInr: number;
    ltcgExemptionUsedInr: number; estTotalTaxInr: number; hasLockedElss: boolean; hasDebtSlab: boolean; headline: string;
  } | null;
  trustnerBuyList?: {
    category: string; schemeName: string; manager: string | null; aumInrCr: number | null;
    cagr5y: number | null; ter: number | null; status: string; conviction: string | null; note: string | null;
  }[];
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
  id: 'client-deck' | 'premium' | 'docx' | 'one-pager' | 'full' | 'three-pager' | 'action' | 'proposal' | 'xlsx' | 'pptx';
  label: string;
  desc: string;
  previewSuffix: string;
}> = [
  { id: 'client-deck', label: '🗂️ Client Review Deck (PDF)', desc: 'Default client hand-out — easy-read landscape deck with 1Y/3Y/5Y returns & action plan', previewSuffix: 'client-deck' },
  { id: 'premium',     label: '⭐ Premium Review (PDF)',    desc: 'Detailed report for the file — tier-by-tier, kept for records',     previewSuffix: 'premium'     },
  { id: 'docx',        label: '📝 Editable Word (.docx)',   desc: 'Same review as an editable Word / Google Docs file',       previewSuffix: 'docx'        },
  { id: 'one-pager',   label: '📋 One-Pager Snapshot',     desc: 'Single-page bottom-line summary',                          previewSuffix: 'one-pager'   },
  { id: 'full',        label: '📄 Full Portfolio Review',  desc: 'Detailed 2-page tier-by-tier verdict report',              previewSuffix: 'full'        },
  { id: 'three-pager', label: '📊 Three-Pager Diagnostic', desc: 'Methodology + holdings + wealth projection',               previewSuffix: 'three-pager' },
  { id: 'action',      label: '✅ Action Sheet',            desc: 'Sign-off ready execution plan with tax estimate',          previewSuffix: 'action'      },
  { id: 'proposal',    label: '🎯 Investment Proposal',    desc: 'Forward plan — allocation gap, the moves, step-up SIP',     previewSuffix: 'proposal'    },
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
  const [expandedFolioGroups, setExpandedFolioGroups] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  // Share-with-Client state — planner picks which deliverables to send
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSelected, setShareSelected] = useState<Record<string, boolean>>({
    'client-deck': true, premium: false, docx: false,
    'one-pager': false, full: false, 'three-pager': false,
    action: false, proposal: false, xlsx: false, pptx: false,
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

  // Save a corrected client risk profile + re-run the engine in one call. The
  // score route persists the rp_* fields then re-scores against them.
  async function saveProfileAndRescore(rp: NonNullable<DiagnosticDetail['riskProfile']>) {
    setRescoring(true);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}/score`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskProfile: rp }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        setError(
          res.status === 504 || res.status === 408 || res.status === 502
            ? 'Re-scoring timed out (large book or slow fund-data source). Please try again — the second run is usually quick as the data gets cached.'
            : (err.error ?? `Re-score failed (HTTP ${res.status})`)
        );
        return;
      }
      setEditProfileOpen(false);
      await loadDiagnostic();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRescoring(false);
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
        premium: false, docx: false,
        'one-pager': false, full: false, 'three-pager': false,
        action: false, proposal: false, xlsx: false, pptx: false,
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
        if (Array.isArray(errData.blockers) && errData.blockers.length) {
          alert(`Cannot publish — fix these first:\n\n• ${errData.blockers.join('\n• ')}`);
        } else {
          alert(`Action failed: ${errData.error ?? `HTTP ${res.status}`}`);
        }
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

  // Group the SAME fund held across multiple folios by the SAME entity into one
  // collapsible row, so the table shows one line per fund (with a "× N folios ·
  // merge" summary) instead of N near-identical rows. Singletons stay normal
  // rows. Keeps sorted order by anchoring each group at its first appearance.
  const holdingGroups: { key: string; members: HoldingWithV2[] }[] = [];
  const folioGroupIndex = new Map<string, number>();
  for (const h of sortedHoldings) {
    const key = `${(h.amfiCode || h.fundName || '').toLowerCase()}|||${(h.entityName || '').toLowerCase()}`;
    const idx = folioGroupIndex.get(key);
    if (idx !== undefined) holdingGroups[idx].members.push(h);
    else { folioGroupIndex.set(key, holdingGroups.length); holdingGroups.push({ key, members: [h] }); }
  }
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

      {/* ── Risk profile: not-captured banner + edit / re-score ── */}
      {(() => {
        const editable = ['DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(diagnostic.status);
        return (
          <div className="space-y-2">
            {!diagnostic.riskProfileCaptured && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>⚠ Risk profile not captured.</strong> The verdicts below were generated against a
                generic <em>default</em> investor profile — not this client&apos;s actual risk profile, so they
                are <strong>not final</strong>. Capture the client&apos;s real profile (a personal conversation),
                then re-score.
                {editable && !editProfileOpen && (
                  <button onClick={() => setEditProfileOpen(true)}
                    className="ml-2 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700">
                    Enter risk profile
                  </button>
                )}
              </div>
            )}
            {editable && diagnostic.riskProfileCaptured && !editProfileOpen && (
              <div className="text-right">
                <button onClick={() => setEditProfileOpen(true)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  ✎ Edit risk profile &amp; re-score
                </button>
              </div>
            )}
            {editProfileOpen && editable && (
              <RiskProfileEditor
                initial={diagnostic.riskProfile}
                busy={rescoring}
                onCancel={() => setEditProfileOpen(false)}
                onSave={(rp) => void saveProfileAndRescore(rp)}
              />
            )}
          </div>
        );
      })()}

      {/* ── Pre-publish QA readiness ── */}
      {diagnostic.prePublishQa && (diagnostic.prePublishQa.blockers.length > 0 || diagnostic.prePublishQa.warnings.length > 0) && (
        <div className={`rounded-lg border p-3 text-sm ${diagnostic.prePublishQa.ready ? 'border-amber-300 bg-amber-50' : 'border-rose-300 bg-rose-50'}`}>
          <div className="mb-1 font-bold text-slate-800">
            {diagnostic.prePublishQa.ready ? '⚠ Pre-publish QA — warnings (you can still publish)' : '⛔ Pre-publish QA — must fix before this can be published'}
          </div>
          <ul className="space-y-0.5">
            {diagnostic.prePublishQa.blockers.map((b, i) => <li key={`qb${i}`} className="text-rose-800">• {b}</li>)}
            {diagnostic.prePublishQa.warnings.map((w, i) => <li key={`qw${i}`} className="text-amber-800">• {w}</li>)}
          </ul>
        </div>
      )}

      {/* ── Risk Model card (Verdict Engine v2) ── */}
      {diagnostic.riskModel && (
        <div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-extrabold text-emerald-800">Client Risk Model</span>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Verdict Engine v{diagnostic.engineVersion ?? '2.0.0'}</span>
            <span className="text-xs font-semibold text-slate-600">{diagnostic.riskModel.profileLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Capacity', value: diagnostic.riskModel.capacityScore != null ? `${diagnostic.riskModel.capacityScore}/100` : '—', sub: 'ability to take risk' },
              { label: 'Tolerance', value: diagnostic.riskModel.toleranceScore != null ? `${diagnostic.riskModel.toleranceScore}/100` : '—', sub: 'willingness' },
              { label: 'Target equity', value: diagnostic.riskModel.targetEquityPct != null ? `${diagnostic.riskModel.targetEquityPct}%` : '—', sub: diagnostic.riskModel.ageRuleEquityPct != null ? `100−age = ${diagnostic.riskModel.ageRuleEquityPct}%` : '' },
              { label: 'Equity ceiling', value: diagnostic.riskModel.withinEquityCeiling ?? '—', sub: 'max fund risk-tier' },
              { label: 'Binding', value: diagnostic.riskModel.bindingConstraint ?? '—', sub: 'constraint' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white/70 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{s.label}</div>
                <div className="mt-0.5 text-lg font-extrabold text-slate-900">{s.value}</div>
                {s.sub && <div className="text-[10px] text-slate-500">{s.sub}</div>}
              </div>
            ))}
          </div>
          {/* ── THE GAP: tolerated ceiling vs the risk the portfolio actually carries ── */}
          {(() => {
            const TIERS = ['Low', 'Low-Moderate', 'Moderate', 'High', 'Very High'];
            const rank = (t: string | null | undefined) => (t ? TIERS.indexOf(t) : -1);
            const ceiling = diagnostic.riskModel!.withinEquityCeiling;
            const tiers = diagnostic.holdings.map((h) => h.v2?.fundRiskTier).filter((t): t is string => !!t && rank(t) >= 0);
            if (!ceiling || rank(ceiling) < 0 || tiers.length === 0) return null;
            const ceilRank = rank(ceiling);
            const carried = tiers.reduce((m, t) => (rank(t) > rank(m) ? t : m), tiers[0]);
            const above = diagnostic.holdings.filter((h) => h.v2?.fundRiskTier && rank(h.v2.fundRiskTier) > ceilRank);
            const aligned = above.length === 0;
            return (
              <div className={`mt-3 rounded-md px-3 py-2 text-[11px] font-semibold ${aligned ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                <span className="uppercase tracking-wide">Risk alignment</span> — tolerated ceiling <b>{ceiling}</b> · portfolio currently carries <b>{carried}</b>{' '}
                {aligned ? (
                  <span>→ ALIGNED ✓ every holding sits at or below the client&apos;s ceiling.</span>
                ) : (
                  <span>→ MISMATCH: {above.length} holding{above.length > 1 ? 's' : ''} above the ceiling — <span className="font-normal">{above.map((h) => h.fundName).join(', ')}</span>. These are the &quot;great fund, wrong seat&quot; exits.</span>
                )}
              </div>
            );
          })()}
          {diagnostic.riskModel.capacityOverrodeAge && (
            <div className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
              ⚡ Capacity overrode age — this client&apos;s living is funded elsewhere, so the engine permits more equity than the naive 100−age rule.
            </div>
          )}
          {diagnostic.riskModel.rationale?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-emerald-700">Why this profile (reasoning trail)</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-slate-600">
                {diagnostic.riskModel.rationale.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* ── Consolidation Opportunities card (Verdict Engine v2 · Pillar 6) ── */}
      {diagnostic.consolidation && diagnostic.consolidation.groups.length > 0 && (
        <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-violet-50/40 p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-indigo-800">Consolidation Opportunities</span>
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">Pillar 6 · duplicate funds</span>
          </div>
          <p className="mb-3 text-xs text-slate-600">
            <b>{diagnostic.consolidation.duplicateFundCount}</b> duplicate fund{diagnostic.consolidation.duplicateFundCount !== 1 ? 's' : ''} across{' '}
            <b>{diagnostic.consolidation.groups.length}</b> categor{diagnostic.consolidation.groups.length !== 1 ? 'ies' : 'y'} ·{' '}
            <b>{formatInr(diagnostic.consolidation.totalConsolidatableInr)}</b> can be simplified with no loss of exposure.
          </p>
          <div className="space-y-2.5">
            {diagnostic.consolidation.groups.map((g) => (
              <div key={g.subKey} className={`rounded-lg border p-3 ${g.confidence === 'review' ? 'border-amber-200 bg-amber-50/60' : 'border-indigo-200 bg-white/70'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900">{g.subCategory}</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">{g.count} funds</span>
                  {g.confidence === 'review' && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">confirm — themes may differ</span>}
                  <span className="ml-auto text-[11px] font-bold text-indigo-700">{formatInr(g.totalConsolidatableInr)} to fold in</span>
                </div>
                <div className="mt-1.5 text-[11px]">
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">KEEP</span>{' '}
                  <span className="font-semibold text-slate-800">{g.keep.fundName}</span>
                  {g.keep.quality && <span className="text-slate-500"> ({g.keep.quality}{g.keep.suitability ? `, ${g.keep.suitability.toLowerCase()}` : ''})</span>}
                </div>
                <div className="mt-1 text-[11px]">
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">FOLD IN</span>{' '}
                  <span className="text-slate-700">{g.consolidate.map((c) => c.fundName).join(' · ')}</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{g.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock-Level Look-Through (Pillar 6 · true single-stock concentration) ── */}
      {diagnostic.stockLookThrough && diagnostic.stockLookThrough.topStocks.length > 0 && (
        <div className="rounded-lg border-2 border-sky-200 bg-gradient-to-r from-sky-50/70 to-cyan-50/40 p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-sky-900">Look-Through: What the Family Actually Owns</span>
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {diagnostic.stockLookThrough.asOfDate ?? 'latest disclosed'}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-700">
            Looked through <b>{diagnostic.stockLookThrough.coveredFunds}</b> of <b>{diagnostic.stockLookThrough.totalFunds}</b> funds
            ({diagnostic.stockLookThrough.coveragePct.toFixed(0)}% of corpus has disclosed holdings)
            {diagnostic.stockLookThrough.multiFundStocks > 0 && <> · <b>{diagnostic.stockLookThrough.multiFundStocks}</b> stocks reach the family through 2+ funds at once</>}.
            {diagnostic.stockLookThrough.coveragePct < 60 && (
              <span className="ml-1 text-slate-500">Upload more AMC monthly portfolios (Holdings page) to raise coverage.</span>
            )}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-sky-700">
                  <th className="px-2 py-1">Underlying stock</th>
                  <th className="px-2 py-1 text-right">Effective ₹</th>
                  <th className="px-2 py-1 text-right">% of family</th>
                  <th className="px-2 py-1 text-center">Via funds</th>
                </tr>
              </thead>
              <tbody>
                {diagnostic.stockLookThrough.topStocks.slice(0, 10).map((s, i) => (
                  <tr key={i} className="border-t border-sky-100">
                    <td className="px-2 py-1 text-slate-800">
                      {s.stock}
                      {s.sector && <span className="ml-1 text-[10px] text-slate-400">· {s.sector}</span>}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums text-slate-600">{formatInr(s.effectiveValueInr)}</td>
                    <td className="px-2 py-1 text-right font-bold tabular-nums text-sky-900">{s.effectivePctOfFamily.toFixed(1)}%</td>
                    <td className="px-2 py-1 text-center">
                      {s.fundCount >= 2
                        ? <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white" title={s.funds.join(', ')}>{s.fundCount}</span>
                        : <span className="text-slate-400">{s.fundCount}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {diagnostic.stockLookThrough.sectorConcentration.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-600">
              Sector tilt (of looked-through equity):{' '}
              {diagnostic.stockLookThrough.sectorConcentration.slice(0, 4).map((s) => `${s.sector} ${s.pctOfCovered.toFixed(0)}%`).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* ── Tax Impact of Recommended Exits (Verdict Engine v2) ── */}
      {diagnostic.taxSummary && diagnostic.taxSummary.exitCount > 0 && (
        <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50/70 to-orange-50/40 p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-amber-900">Tax Impact of Recommended Exits</span>
            <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">India FY25-26 · estimate</span>
          </div>
          <p className="mb-3 text-xs text-slate-700">{diagnostic.taxSummary.headline}</p>
          <div className="space-y-1.5">
            {diagnostic.taxSummary.lines.map((l) => {
              const tone = l.locked ? 'border-rose-200 bg-rose-50/60'
                : l.gainType === 'LOSS' ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-200 bg-white/70';
              const badge = l.locked ? 'bg-rose-600' : l.gainType === 'STCG' ? 'bg-orange-600' : l.gainType === 'LTCG' ? 'bg-amber-600' : l.gainType === 'SLAB' ? 'bg-slate-600' : 'bg-emerald-600';
              return (
                <div key={l.holdingId} className={`rounded border p-2 ${tone}`}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${badge}`}>{l.locked ? 'LOCKED' : l.gainType}</span>
                    <span className="font-semibold text-slate-800">{l.fundName}</span>
                    <span className="text-slate-500">gain {formatInr(l.gainInr)}</span>
                    {l.estTaxInr != null && l.estTaxInr > 0 && <span className="ml-auto font-bold text-amber-800">est. tax {formatInr(l.estTaxInr)}</span>}
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-slate-600">{l.note}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] italic text-slate-500">Estimates per FY2025-26 rules (equity LTCG 12.5% above ₹1.25L; STCG 20%; debt at slab; ELSS 3-yr lock-in). Informational only — confirm exact liability with your Chartered Accountant.</p>
        </div>
      )}

      {/* ── Trustner Approved Buy-List (reference) ── */}
      {diagnostic.trustnerBuyList && diagnostic.trustnerBuyList.length > 0 && (
        <details className="rounded-lg border-2 border-indigo-200 bg-indigo-50/40 p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-indigo-800">★ Trustner Approved Buy-List ({diagnostic.trustnerBuyList.length} schemes) — replacements draw from here</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="text-left text-indigo-700">
                <th className="px-2 py-1">Category</th><th className="px-2 py-1">Scheme</th><th className="px-2 py-1">Manager</th>
                <th className="px-2 py-1 text-right">AUM (₹Cr)</th><th className="px-2 py-1 text-right">5Y</th><th className="px-2 py-1">Status</th>
              </tr></thead>
              <tbody>
                {diagnostic.trustnerBuyList.map((e, i) => (
                  <tr key={i} className="border-t border-indigo-100">
                    <td className="px-2 py-1 text-slate-600">{e.category}</td>
                    <td className="px-2 py-1 font-semibold text-slate-800">{e.schemeName}{e.conviction === 'SATELLITE' ? ' ·sat' : ''}</td>
                    <td className="px-2 py-1 text-slate-600">{e.manager ?? '—'}</td>
                    <td className="px-2 py-1 text-right text-slate-600">{e.aumInrCr != null ? e.aumInrCr.toLocaleString('en-IN') : '—'}</td>
                    <td className="px-2 py-1 text-right text-slate-600">{e.cagr5y != null ? `${e.cagr5y}%` : '—'}</td>
                    <td className="px-2 py-1">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${e.status === 'APPROVED_OPEN' ? 'bg-emerald-100 text-emerald-800' : e.status === 'APPROVED_HOLD_ONLY' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                        {e.status === 'APPROVED_OPEN' ? 'OPEN' : e.status === 'APPROVED_HOLD_ONLY' ? 'HOLD-ONLY' : 'WATCH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] italic text-slate-500">Curated via Trustner&apos;s fund-selection process (Research-Backed Shortlist). SWAP/EXIT replacements are drawn only from OPEN-capacity, committee-approved schemes. Internal research — not investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013.</p>
          </div>
        </details>
      )}

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
                href={`/api/admin/portfolio-diagnostic/${id}/report?type=proposal`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800"
              >
                <FileText className="h-3.5 w-3.5" />
                Investment Proposal
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
                  `Delete this diagnostic?\n\n` +
                  `Family: ${diagnostic.familyName}\n` +
                  `Status: ${diagnostic.status}\n` +
                  `${diagnostic.numHoldings} holdings · ${diagnostic.numActiveSips} SIPs\n\n` +
                  `It will be removed from all queues. This is a SOFT-delete — nothing is ` +
                  `permanently lost (holdings, SIPs, comments, narrative and share links are ` +
                  `retained) and an admin can recover it. The action is recorded in the audit log.\n\n` +
                  `Admin only — reviewers should use Reject instead.`
                );
                if (!ok) return;
                const reason = prompt(
                  'Reason for deleting (e.g. "duplicate import", "wrong data captured"):',
                  ''
                );
                if (reason === null) return;
                const res = await fetch(`/api/admin/portfolio-diagnostic/${id}`, {
                  method: 'DELETE',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: reason.trim() || null }),
                });
                if (res.ok) {
                  router.push('/admin/portfolio-diagnostic');
                } else {
                  const err = await res.json().catch(() => ({}));
                  alert(err.error ?? `Delete failed: ${res.status}`);
                }
              }}
              className="text-xs text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 border border-rose-200 rounded px-2 py-0.5 hover:bg-rose-50"
              title="Admin only — soft-delete (recoverable, audit-logged)"
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
              {holdingGroups.map((g) => {
                const renderRow = (h: HoldingWithV2) => (
                  <HoldingRow
                    key={h.id}
                    holding={h}
                    overrideOpen={overrideOpen === parseInt(h.id, 10)}
                    onToggleOverride={() => setOverrideOpen(overrideOpen === parseInt(h.id, 10) ? null : parseInt(h.id, 10))}
                    onOverride={(newVerdict, reason) => overrideVerdict(parseInt(h.id, 10), newVerdict, reason)}
                    onComment={(text) => addComment(text, parseInt(h.id, 10))}
                  />
                );
                if (g.members.length === 1) return renderRow(g.members[0]);
                return (
                  <FolioGroupRows
                    key={g.key}
                    members={g.members}
                    expanded={expandedFolioGroups.has(g.key)}
                    onToggle={() => setExpandedFolioGroups((prev) => {
                      const n = new Set(prev);
                      if (n.has(g.key)) n.delete(g.key); else n.add(g.key);
                      return n;
                    })}
                    renderRow={renderRow}
                  />
                );
              })}
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

/**
 * Collapsible summary row for a fund held across multiple folios by the same
 * holder. Shows one line — fund, "× N folios · merge", combined invested/current
 * and the (now consistent) verdict — and expands to the individual folio rows
 * (each with its own override / comment controls). 10 columns to match the table.
 */
function FolioGroupRows({
  members,
  expanded,
  onToggle,
  renderRow,
}: {
  members: HoldingWithV2[];
  expanded: boolean;
  onToggle: () => void;
  renderRow: (h: HoldingWithV2) => React.ReactNode;
}) {
  const ordered = [...members].sort((a, b) => (b.currentValueInr || 0) - (a.currentValueInr || 0));
  const main = ordered[0];
  const totalInv = members.reduce((s, m) => s + (m.investedInr || 0), 0);
  const totalCur = members.reduce((s, m) => s + (m.currentValueInr || 0), 0);
  const consistent = new Set(members.map((m) => m.verdict)).size === 1;
  return (
    <>
      <tr className="bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer" onClick={onToggle}>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <span className={`inline-block text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
            <VerdictBadge verdict={main.verdict} />
          </div>
        </td>
        <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate" title={main.fundName}>
          {main.fundName}
          <span className="ml-2 align-middle rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">× {members.length} folios · merge</span>
          {!consistent && <span className="ml-1 align-middle rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">mixed</span>}
        </td>
        <td className="px-3 py-2 text-xs text-slate-600">{main.entityName}</td>
        <td className="px-3 py-2 text-xs text-slate-600">{main.category}</td>
        <td className="px-3 py-2 text-right text-xs">{formatInr(totalInv)}</td>
        <td className="px-3 py-2 text-right text-xs font-semibold">{formatInr(totalCur)}</td>
        <td className="px-3 py-2 text-right text-xs text-slate-400">—</td>
        <td className="px-3 py-2 text-right text-xs">{main.cagr3y !== null ? `${main.cagr3y.toFixed(1)}%` : '—'}</td>
        <td className="px-3 py-2 text-right text-xs">{main.compositeScore !== null ? main.compositeScore.toFixed(2) : '—'}</td>
        <td className="px-3 py-2 text-[10px] text-indigo-600">{expanded ? 'hide' : 'show'} folios</td>
      </tr>
      {expanded && ordered.map((h) => renderRow(h))}
    </>
  );
}

function HoldingRow({
  holding: h,
  overrideOpen,
  onToggleOverride,
  onOverride,
  onComment,
}: {
  holding: HoldingWithV2;
  overrideOpen: boolean;
  onToggleOverride: () => void;
  onOverride: (v: Verdict, reason: string) => void;
  onComment: (text: string) => void;
}) {
  const [scoreOpen, setScoreOpen] = useState(false);
  const hasV2 = !!(h.v2 && (h.v2.gates?.length || h.v2.qualityVerdict));
  return (
    <>
      <tr className="hover:bg-slate-50/40">
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            {hasV2 && (
              <button onClick={() => setScoreOpen((o) => !o)} title="Show 6-gate scorecard" className="text-slate-400 hover:text-emerald-700">
                <span className={`inline-block transition-transform ${scoreOpen ? 'rotate-90' : ''}`}>▸</span>
              </button>
            )}
            <VerdictBadge verdict={h.verdict} />
          </div>
        </td>
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
      {scoreOpen && h.v2 && (
        <tr>
          <td colSpan={10} className="px-4 py-3 bg-emerald-50/40 border-y border-emerald-200">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-emerald-800">Verdict Engine v2</span>
              {h.v2.actionLabel && <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">{h.v2.actionLabel}</span>}
              {h.v2.qualityVerdict && <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">Quality: {h.v2.qualityVerdict}</span>}
              {h.v2.suitability && <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">Suitability: {h.v2.suitability}{h.v2.fundRiskTier ? ` (${h.v2.fundRiskTier})` : ''}</span>}
              {h.v2.forwardAum && h.v2.forwardAum !== 'NA' && <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">AUM: {h.v2.forwardAum}</span>}
              {h.v2.rolling3yPct != null && <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">3Y rolling: {h.v2.rolling3yPct.toFixed(1)}%</span>}
              {h.buyList?.onList && <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">★ Trustner Buy-List{h.buyList.status === 'APPROVED_HOLD_ONLY' ? ' · hold-only' : h.buyList.conviction ? ` · ${h.buyList.conviction.toLowerCase()}` : ''}</span>}
              {!h.buyList?.onList && h.buyList?.replacement && <span className="rounded border border-indigo-300 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800">↪ Buy-List replacement: {h.buyList.replacement.schemeName}{h.buyList.replacement.cagr5y != null ? ` (5Y ~${h.buyList.replacement.cagr5y}%)` : ''}</span>}
            </div>
            {h.v2.gates && h.v2.gates.length > 0 && (
              <>
              <div className="mb-1.5 mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Trustner {h.v2.gates.length}-Point Fund Selection Checklist</div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {h.v2.gates.map((g, i) => {
                  const color = g.status === 'PASS' ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : g.status === 'FAIL' ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : g.status === 'FLAG' ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : g.status === 'MANUAL' ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500';
                  const label = g.status === 'PASS' ? '✓ PASS' : g.status === 'FAIL' ? '✗ FAIL'
                    : g.status === 'FLAG' ? '⚠ FLAG' : g.status === 'MANUAL' ? '☐ Manual DD' : '– N/A';
                  return (
                    <div key={i} className={`rounded-md border px-2 py-1 ${color}`} title={g.detail}>
                      <div className="text-[9.5px] font-bold tracking-wide">{g.gate}</div>
                      <div className="text-[10px] font-semibold">{label}</div>
                      <div className="text-[9px] opacity-80 leading-tight">{g.detail}</div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
            {h.v2.rationale && <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">{h.v2.rationale}</p>}
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

// Edit the client risk profile on an existing run, then re-score. Field set +
// enum values mirror the new-diagnostic wizard exactly (engine-accepted enums).
function RiskProfileEditor({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: DiagnosticDetail['riskProfile'];
  busy: boolean;
  onSave: (rp: NonNullable<DiagnosticDetail['riskProfile']>) => void;
  onCancel: () => void;
}) {
  const [rp, setRp] = useState({
    primaryAge: initial?.primaryAge ?? 45,
    lifeStage: initial?.lifeStage || 'accumulation',
    statedPriority: initial?.statedPriority || 'balanced',
    pastDrawdownBehaviour: initial?.pastDrawdownBehaviour || 'unknown',
    livingDependsOnThis: initial?.livingDependsOnThis ?? true,
    longestHorizonYears: initial?.longestHorizonYears ?? 15,
    monthlyIncomeInr: initial?.monthlyIncomeInr ?? 0,
    monthlyExpenseInr: initial?.monthlyExpenseInr ?? 0,
    netWorthBufferInr: initial?.netWorthBufferInr ?? 0,
    targetCorpusInr: initial?.targetCorpusInr ?? 0,
    yearsToGoal: initial?.yearsToGoal ?? 0,
  });
  const set = (k: keyof typeof rp, v: number | string | boolean) => setRp((p) => ({ ...p, [k]: v }));
  const cls = 'mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm';
  return (
    <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-4">
      <div className="mb-1 text-sm font-extrabold text-emerald-900">Client Risk Profile — capture from conversation</div>
      <p className="mb-3 text-xs text-slate-600">This drives every verdict. Enter the client&apos;s real situation — never guess. Saving re-runs the engine on the corrected profile.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">Primary age
          <input type="number" inputMode="numeric" min={0} value={rp.primaryAge || ''} onChange={(e) => set('primaryAge', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Life stage
          <select value={rp.lifeStage} onChange={(e) => set('lifeStage', e.target.value)} className={cls}>
            <option value="accumulation">Accumulation</option>
            <option value="pre_retirement">Pre-retirement</option>
            <option value="retirement">Retirement</option>
            <option value="legacy">Legacy</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">Priority
          <select value={rp.statedPriority} onChange={(e) => set('statedPriority', e.target.value)} className={cls}>
            <option value="capital_first">Capital first</option>
            <option value="balanced">Balanced</option>
            <option value="growth_first">Growth first</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">In a crash, they…
          <select value={rp.pastDrawdownBehaviour} onChange={(e) => set('pastDrawdownBehaviour', e.target.value)} className={cls}>
            <option value="unknown">Unknown</option>
            <option value="added_more">Added more</option>
            <option value="stayed_invested">Stayed invested</option>
            <option value="stopped_sip">Stopped SIP</option>
            <option value="panic_sold">Panic sold</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">Longest horizon (yrs)
          <input type="number" inputMode="numeric" min={0} value={rp.longestHorizonYears || ''} onChange={(e) => set('longestHorizonYears', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Monthly income (₹)
          <input type="number" inputMode="numeric" min={0} value={rp.monthlyIncomeInr || ''} onChange={(e) => set('monthlyIncomeInr', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Monthly expense (₹)
          <input type="number" inputMode="numeric" min={0} value={rp.monthlyExpenseInr || ''} onChange={(e) => set('monthlyExpenseInr', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Net-worth buffer (₹)
          <input type="number" inputMode="numeric" min={0} value={rp.netWorthBufferInr || ''} onChange={(e) => set('netWorthBufferInr', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Target corpus (₹, optional)
          <input type="number" inputMode="numeric" min={0} value={rp.targetCorpusInr || ''} onChange={(e) => set('targetCorpusInr', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="text-xs font-semibold text-slate-700">Years to goal (optional)
          <input type="number" inputMode="numeric" min={0} value={rp.yearsToGoal || ''} onChange={(e) => set('yearsToGoal', e.target.value === '' ? 0 : Number(e.target.value))} className={cls} />
        </label>
        <label className="flex items-center gap-2 self-end pb-1 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={rp.livingDependsOnThis} onChange={(e) => set('livingDependsOnThis', e.target.checked)} className="h-4 w-4" />
          Living depends on this money
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => onSave(rp)} disabled={busy}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
          {busy ? 'Saving & re-scoring…' : 'Save & re-score'}
        </button>
        <button onClick={onCancel} disabled={busy} className="rounded-md border px-3 py-1.5 text-xs">Cancel</button>
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
