/**
 * Portfolio Diagnostic — Edit Draft Page
 *
 * Where L2 reviews the just-uploaded draft, triggers scoring,
 * adds/edits/removes holdings or SIPs, and submits for review.
 *
 * Route: /admin/portfolio-diagnostic/[id]/edit
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Eye,
  TrendingUp,
  Users,
  Repeat,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Verdict } from '@/lib/portfolio-diagnostic/types';

interface Holding {
  id: string;
  entityName: string;
  fundName: string;
  category: string;
  units: number;
  investedInr: number;
  currentValueInr: number;
  xirrPct: number | null;
  cagr3y: number | null;
  compositeScore: number | null;
  verdict: Verdict;
  verdictRationale: string;
}

interface Sip {
  id: string;
  entityName: string;
  fundName: string;
  monthlyAmountInr: number;
  status: string;
  ageInMonths: number;
  expected5YInflowInr: number;
  recommendedAction?: string;
}

interface DiagnosticDetail {
  id: number;
  documentId: string;
  familyName: string;
  status: string;
  totalInvestedInr: number;
  currentValueInr: number;
  numHoldings: number;
  numActiveSips: number;
  monthlySipFlowInr: number;
  verdictCounts: Record<Verdict, number>;
  holdings: Holding[];
  sips: Sip[];
  availableActions: string[];
}

export default function EditDiagnosticPage() {
  const params = useParams();
  const id = params.id as string;

  const [diagnostic, setDiagnostic] = useState<DiagnosticDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ scored: number; skipped: number; skipReasons: string[] } | null>(null);

  useEffect(() => {
    void loadDiagnostic();
  }, [id]);

  async function loadDiagnostic() {
    setLoading(true);
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runScoring() {
    setScoring(true);
    setScoreResult(null);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}/score`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Scoring failed: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      setScoreResult({
        scored: data.scored,
        skipped: data.skipped,
        skipReasons: data.skipReasons ?? [],
      });
      void loadDiagnostic();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setScoring(false);
    }
  }

  async function submitForReview() {
    // Note: replaced native confirm() with inline action — re-add a
    // React modal later if a confirmation step is desired.
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Submit failed: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      void loadDiagnostic();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
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
        <strong>Error:</strong> {error ?? 'Unknown error'}
        <div className="mt-3">
          <Link href="/admin/portfolio-diagnostic" className="text-rose-700 hover:text-rose-900">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isDraftLike = ['DRAFT', 'CHANGES_REQUESTED'].includes(diagnostic.status);
  const allScored = diagnostic.holdings.every((h) => h.verdict !== 'WATCH' || h.compositeScore !== null);

  return (
    <div className="space-y-5">
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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-primary-700">{diagnostic.familyName}</h1>
              <StatusBadge status={diagnostic.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isDraftLike
                ? 'Draft — review the data, run scoring, then submit for review.'
                : 'This diagnostic is no longer editable from here.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={runScoring}
              disabled={scoring || !isDraftLike}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
            >
              {scoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Run Scoring
            </button>
            <Link
              href={`/admin/portfolio-diagnostic/${id}/review`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Review View
            </Link>
            {isDraftLike && (
              <button
                onClick={submitForReview}
                disabled={submitting || diagnostic.holdings.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit for Review
              </button>
            )}
          </div>
        </div>

        {/* Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <SnapshotTile icon={TrendingUp} label="Family AUM" value={formatInr(diagnostic.currentValueInr)} />
          <SnapshotTile icon={TrendingUp} label="Invested" value={formatInr(diagnostic.totalInvestedInr)} />
          <SnapshotTile icon={Users} label="Holdings" value={String(diagnostic.numHoldings)} />
          <SnapshotTile
            icon={Repeat}
            label="SIPs / monthly"
            value={`${diagnostic.numActiveSips} · ${formatInr(diagnostic.monthlySipFlowInr)}/mo`}
          />
        </div>

        {/* Verdict summary (after scoring) */}
        {Object.values(diagnostic.verdictCounts ?? {}).some((c) => c > 0) && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-xs text-slate-500">Verdicts:</span>
            {(['STAR', 'KEEP', 'WATCH', 'SWAP', 'LIQUIDATE'] as Verdict[]).map((v) => (
              <VerdictPill key={v} verdict={v} count={diagnostic.verdictCounts?.[v] ?? 0} />
            ))}
          </div>
        )}
      </div>

      {/* Score result banner */}
      {scoreResult && (
        <div className={`rounded-lg border p-4 text-sm ${
          scoreResult.skipped > 0
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            {scoreResult.skipped > 0 ? <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            <div>
              <strong>Scoring complete:</strong> {scoreResult.scored} holdings scored
              {scoreResult.skipped > 0 && `, ${scoreResult.skipped} skipped (no matching fund in master)`}.
              {scoreResult.skipReasons.length > 0 && (
                <details className="mt-1 text-xs">
                  <summary className="cursor-pointer">Show skipped funds</summary>
                  <ul className="list-disc list-inside mt-1">
                    {scoreResult.skipReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Holdings ({diagnostic.holdings.length})</h2>
          {!allScored && diagnostic.holdings.length > 0 && (
            <span className="text-xs text-amber-700">Not yet scored — click <strong>Run Scoring</strong>.</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Verdict</th>
                <th className="px-3 py-2 text-left">Fund</th>
                <th className="px-3 py-2 text-left">Entity</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-right">Invested</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">3Y CAGR</th>
                <th className="px-3 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {diagnostic.holdings.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/40">
                  <td className="px-3 py-2"><VerdictBadge verdict={h.verdict} /></td>
                  <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate" title={h.fundName}>{h.fundName}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{h.entityName}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{h.category || '—'}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatInr(h.investedInr)}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold">{formatInr(h.currentValueInr)}</td>
                  <td className="px-3 py-2 text-right text-xs">{h.cagr3y !== null ? `${h.cagr3y.toFixed(1)}%` : '—'}</td>
                  <td className="px-3 py-2 text-right text-xs">{h.compositeScore !== null ? h.compositeScore.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIPs table */}
      {diagnostic.sips.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Active SIPs ({diagnostic.sips.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Fund</th>
                  <th className="px-3 py-2 text-left">Entity</th>
                  <th className="px-3 py-2 text-right">Monthly ₹</th>
                  <th className="px-3 py-2 text-right">Age</th>
                  <th className="px-3 py-2 text-right">5Y Inflow</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diagnostic.sips.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-3 py-2 text-xs">{s.status}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate" title={s.fundName}>{s.fundName}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{s.entityName}</td>
                    <td className="px-3 py-2 text-right text-xs font-semibold">{formatInr(s.monthlyAmountInr)}</td>
                    <td className="px-3 py-2 text-right text-xs">{s.ageInMonths} mo</td>
                    <td className="px-3 py-2 text-right text-xs">{formatInr(s.expected5YInflowInr)}</td>
                    <td className="px-3 py-2 text-xs">{s.recommendedAction ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state — no holdings yet */}
      {diagnostic.holdings.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600 mb-3">
            This draft has no holdings yet. Go back and add some via the new-diagnostic flow.
          </p>
          <Link
            href={`/admin/portfolio-diagnostic/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add holdings
          </Link>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (lightweight versions of the review-page ones)
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

function formatInr(v: number): string {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)} K`;
  return `₹${v.toFixed(0)}`;
}
