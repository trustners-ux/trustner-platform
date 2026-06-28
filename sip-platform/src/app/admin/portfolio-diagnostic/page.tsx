/**
 * Portfolio Diagnostic — Employee Dashboard
 *
 * Landing page for the Trustner Portfolio Diagnostic Workbench.
 * Shows three queues (My Drafts / Awaiting Me / Approved Pending Publish)
 * plus a feed of recently published diagnostics.
 *
 * Route: /admin/portfolio-diagnostic
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  Send,
  Plus,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight,
  Star,
  RefreshCw,
  Trash2,
  RotateCcw,
  ChevronDown,
  Shield,
  Layers,
} from 'lucide-react';
import type { WorkflowStatus } from '@/lib/portfolio-diagnostic/types';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface DashboardCounts {
  myDrafts: number;
  awaitingMyReview: number;
  approvedNotYetPublished: number;
  publishedThisMonth: number;
  totalThisMonth: number;
}

interface DiagnosticListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: WorkflowStatus;
  totalInvestedInr: number;
  currentValueInr: number;
  familyXirrPct: number | null;
  numHoldings: number;
  numActiveSips: number;
  verdictSwapCount: number;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DeletedListItem extends DiagnosticListItem {
  deletedAt: string | null;
  deletedByName: string | null;
  deletionReason: string | null;
}

interface CurrentEmployee {
  id: number;
  name: string;
  email: string;
  role: {
    name: string;
    level: number;
    canUpload: boolean;
    canReview: boolean;
    canApprove: boolean;
    canPublish: boolean;
  };
  certifications: string[];
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function PortfolioDiagnosticDashboard() {
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [myDrafts, setMyDrafts] = useState<DiagnosticListItem[]>([]);
  const [awaiting, setAwaiting] = useState<DiagnosticListItem[]>([]);
  const [approvedPending, setApprovedPending] = useState<DiagnosticListItem[]>([]);
  const [recent, setRecent] = useState<DiagnosticListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [binOpen, setBinOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState<DeletedListItem[]>([]);
  const [binLoading, setBinLoading] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/dashboard', {
        credentials: 'include',
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEmployee(data.employee);
      setCounts(data.counts);
      setMyDrafts(data.myDrafts ?? []);
      setAwaiting(data.awaiting ?? []);
      setApprovedPending(data.approvedPending ?? []);
      setRecent(data.recent ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Admin-only soft-delete. Removes the run from every queue (is_deleted=true)
  // but nothing is physically deleted — fully recoverable + audit-logged. Used
  // for duplicate or wrong-data captures (e.g. a double-imported family).
  async function handleDelete(item: DiagnosticListItem) {
    const ok = window.confirm(
      `Delete the diagnostic for "${item.familyName}" (${item.documentId})?\n\n` +
        `This removes it from all queues. It is a soft-delete — nothing is permanently lost ` +
        `and an admin can recover it. The action is recorded in the audit log.`
    );
    if (!ok) return;
    const reason = window.prompt(
      'Reason for deleting (e.g. "duplicate import", "wrong data captured"):',
      ''
    );
    if (reason === null) return; // cancelled the reason prompt
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? 'Could not delete this diagnostic.');
        return;
      }
      await loadDashboard();
      if (binOpen) await loadDeleted();
    } catch {
      alert('Network error — could not delete this diagnostic.');
    }
  }

  // Recycle bin — admin-only list of soft-deleted runs, with restore.
  async function loadDeleted() {
    setBinLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/deleted', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDeletedItems(data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setBinLoading(false);
    }
  }

  function toggleBin() {
    const next = !binOpen;
    setBinOpen(next);
    if (next) void loadDeleted();
  }

  async function handleRestore(item: DeletedListItem) {
    const ok = window.confirm(
      `Restore the diagnostic for "${item.familyName}" (${item.documentId})?\n\n` +
        `It will return to its previous status (${item.status}) and reappear in the queues. ` +
        `The restore is recorded in the audit log.`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/${item.id}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? 'Could not restore this diagnostic.');
        return;
      }
      await Promise.all([loadDeleted(), loadDashboard()]);
    } catch {
      alert('Network error — could not restore this diagnostic.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-sm text-slate-400">
          Loading workbench...
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">
              No Workbench Role Assigned
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              You don&apos;t have a role assigned for the Portfolio Diagnostic
              Workbench yet. Please contact your administrator to be added to
              the role hierarchy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canUpload = employee.role.canUpload;
  // Delete is admin-only (matches the DELETE endpoint's admin-token gate).
  const isAdmin = employee.role.name === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">
            Portfolio Diagnostic Workbench
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {employee.name} &middot;{' '}
            <span className="font-medium capitalize text-slate-700">
              {employee.role.name.replace('_', ' ')}
            </span>{' '}
            (L{employee.role.level})
            {employee.certifications.length > 0 && (
              <>
                {' '}
                &middot;{' '}
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Star className="h-3 w-3" />
                  {employee.certifications.join(', ')}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/portfolio-diagnostic/oversight"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Shield className="h-4 w-4" />
              Oversight
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/portfolio-diagnostic/insights"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <TrendingUp className="h-4 w-4" />
              Insights
            </Link>
          )}
          {canUpload && (
            <Link
              href="/admin/portfolio-diagnostic/holdings"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Upload AMC monthly portfolios to power stock-level look-through"
            >
              <Layers className="h-4 w-4" />
              Holdings
            </Link>
          )}
          {canUpload && (
            <Link
              href="/admin/portfolio-diagnostic/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
            >
              <Plus className="h-4 w-4" />
              New Diagnostic
            </Link>
          )}
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="My Drafts"
          value={counts?.myDrafts ?? 0}
          icon={FileText}
          color="text-amber-700 bg-amber-50"
          href="#my-drafts"
        />
        <KpiTile
          label="Awaiting My Review"
          value={counts?.awaitingMyReview ?? 0}
          icon={ClipboardList}
          color="text-blue-700 bg-blue-50"
          urgent={(counts?.awaitingMyReview ?? 0) > 0}
          href="#awaiting"
        />
        <KpiTile
          label="Pending Publish"
          value={counts?.approvedNotYetPublished ?? 0}
          icon={CheckCircle2}
          color="text-emerald-700 bg-emerald-50"
          href="#approved-pending"
        />
        <KpiTile
          label="Published This Month"
          value={counts?.publishedThisMonth ?? 0}
          icon={Send}
          color="text-primary-700 bg-primary-50"
          href="#published"
        />
      </div>

      {/* My Drafts */}
      {canUpload && (
        <QueueSection
          id="my-drafts"
          title="My Drafts"
          subtitle="Diagnostics you're preparing. Click to continue editing."
          items={myDrafts}
          emptyState="No drafts. Click 'New Diagnostic' to start one."
          actionHref={(item) => `/admin/portfolio-diagnostic/${item.id}/edit`}
          actionLabel="Continue editing"
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* Awaiting My Review */}
      {employee.role.canReview && (
        <QueueSection
          id="awaiting"
          title="Awaiting My Review"
          subtitle="Diagnostics assigned to you for analysis and sign-off."
          items={awaiting}
          emptyState="Nothing in your review queue."
          actionHref={(item) => `/admin/portfolio-diagnostic/${item.id}/review`}
          actionLabel="Open for review"
          urgent
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* Approved Pending Publish */}
      {employee.role.canPublish && (
        <QueueSection
          id="approved-pending"
          title="Approved — Pending Publish"
          subtitle="One-click publish to generate the 4 client PDFs and queue delivery."
          items={approvedPending}
          emptyState="Nothing waiting to publish."
          actionHref={(item) => `/admin/portfolio-diagnostic/${item.id}/review`}
          actionLabel="Review & publish"
          accent="emerald"
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* Recently Published */}
      <QueueSection
        id="published"
        title="Recently Published"
        subtitle="Last 20 published diagnostics across the team."
        items={recent}
        emptyState="No published diagnostics yet."
        actionHref={(item) => `/admin/portfolio-diagnostic/${item.id}/review`}
        actionLabel="View"
        accent="slate"
        isAdmin={isAdmin}
        onDelete={handleDelete}
      />

      {/* Recycle Bin — admin-only recovery for soft-deleted runs */}
      {isAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={toggleBin}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-slate-500" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recycle Bin</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Soft-deleted diagnostics. Restore any of them — nothing is permanently lost.
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${binOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {binOpen && (
            <div className="border-t border-slate-100">
              {binLoading ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Loading deleted diagnostics…
                </div>
              ) : deletedItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  The recycle bin is empty.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {deletedItems.map((item) => (
                    <li key={item.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate">
                            {item.familyName}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="font-mono">{item.documentId}</span>
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatInr(item.currentValueInr)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.numHoldings} holdings
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-600">
                            <Trash2 className="h-3 w-3" />
                            {item.deletedAt ? formatRelative(item.deletedAt) : '—'}
                            {item.deletedByName ? ` by ${item.deletedByName}` : ''}
                          </span>
                          {item.deletionReason && (
                            <span className="italic">“{item.deletionReason}”</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                        title="Restore this diagnostic"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* Footer info */}
      <div className="text-xs text-slate-400 pt-4 border-t border-slate-200">
        Methodology version: <span className="font-mono">v1.1.0</span> &middot;{' '}
        Trustner Asset Services Pvt. Ltd. &middot; ARN-286886
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  urgent?: boolean;
  href?: string;
}

function KpiTile({ label, value, icon: Icon, color, urgent, href }: KpiTileProps) {
  const content = (
    <div
      className={`group rounded-lg border bg-white p-4 transition hover:shadow-md ${
        urgent && value > 0 ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {urgent && value > 0 && (
          <span className="text-xs font-semibold text-blue-600 animate-pulse">
            Action needed
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}

// ─────────────────────────────────────────────────────────────────

interface QueueSectionProps {
  id: string;
  title: string;
  subtitle: string;
  items: DiagnosticListItem[];
  emptyState: string;
  actionHref: (item: DiagnosticListItem) => string;
  actionLabel: string;
  urgent?: boolean;
  accent?: 'default' | 'emerald' | 'slate';
  isAdmin?: boolean;
  onDelete?: (item: DiagnosticListItem) => void;
}

function QueueSection({
  id,
  title,
  subtitle,
  items,
  emptyState,
  actionHref,
  actionLabel,
  urgent,
  accent = 'default',
  isAdmin,
  onDelete,
}: QueueSectionProps) {
  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-200'
      : accent === 'slate'
      ? 'border-slate-200'
      : urgent
      ? 'border-blue-200'
      : 'border-slate-200';

  return (
    <section id={id} className={`rounded-lg border bg-white ${accentBorder}`}>
      <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-sm text-slate-400">{items.length}</div>
      </header>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          {emptyState}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3 hover:bg-slate-50/60 transition flex items-center gap-2">
              <Link href={actionHref(item)} className="flex flex-1 min-w-0 items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">
                      {item.familyName}
                    </span>
                    <StatusBadge status={item.status} />
                    {item.verdictSwapCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        <RefreshCw className="h-2.5 w-2.5" />
                        {item.verdictSwapCount} swap
                        {item.verdictSwapCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="font-mono">{item.documentId}</span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatInr(item.currentValueInr)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.numHoldings} holdings &middot; {item.numActiveSips} SIPs
                    </span>
                    {item.familyXirrPct !== null && (
                      <span>XIRR {item.familyXirrPct.toFixed(2)}%</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(item.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <span>{actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
              {isAdmin && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  title="Delete (admin) — soft-delete, recoverable, audit-logged"
                  aria-label={`Delete diagnostic for ${item.familyName}`}
                  className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const map: Record<WorkflowStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-700' },
    SUBMITTED: { label: 'Submitted', cls: 'bg-blue-50 text-blue-700' },
    IN_REVIEW: { label: 'In Review', cls: 'bg-blue-100 text-blue-800' },
    ESCALATED: { label: 'Escalated', cls: 'bg-purple-100 text-purple-800' },
    CHANGES_REQUESTED: { label: 'Changes Requested', cls: 'bg-amber-100 text-amber-800' },
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
    PUBLISHED: { label: 'Published', cls: 'bg-emerald-600 text-white' },
    REJECTED: { label: 'Rejected', cls: 'bg-rose-100 text-rose-800' },
    ARCHIVED: { label: 'Archived', cls: 'bg-slate-200 text-slate-600' },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────

function formatInr(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`;
  return `₹${value.toFixed(0)}`;
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
  if (diffDay < 30) return `${Math.round(diffDay / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
