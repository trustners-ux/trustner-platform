/**
 * Meeting Prep Agent — Employee Dashboard
 *
 * Pre-meeting briefing pack workbench. Same workflow pattern as
 * Portfolio Diagnostic — only the data model + UI tabs differ.
 *
 * Route: /admin/meeting-prep
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  Send,
  Plus,
  Clock,
  AlertTriangle,
  Users,
  ArrowRight,
  Star,
  Briefcase,
  Phone,
  Video,
  MessageCircle,
} from 'lucide-react';
import type {
  MeetingFormat,
  MeetingPurpose,
} from '@/lib/meeting-prep/types';
import type { AgentWorkflowStatus } from '@/lib/trustner-agent-platform/types';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface DashboardCounts {
  myDrafts: number;
  awaitingMyReview: number;
  approvedNotYetPublished: number;
  upcomingMeetingsThisWeek: number;
  meetingsTomorrow: number;
}

interface MeetingPrepListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: AgentWorkflowStatus;
  meetingScheduledAt: string;
  meetingPurpose: MeetingPurpose;
  meetingFormat: MeetingFormat;
  hoursUntilMeeting: number;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  numOpenActionItems: number;
  numOpportunities: number;
  createdAt: string;
  updatedAt: string;
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

export default function MeetingPrepDashboard() {
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [myDrafts, setMyDrafts] = useState<MeetingPrepListItem[]>([]);
  const [awaiting, setAwaiting] = useState<MeetingPrepListItem[]>([]);
  const [approvedPending, setApprovedPending] = useState<MeetingPrepListItem[]>([]);
  const [meetingsTomorrow, setMeetingsTomorrow] = useState<MeetingPrepListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/meeting-prep/dashboard', {
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
      setMeetingsTomorrow(data.meetingsTomorrow ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-sm text-slate-400">
          Loading meeting prep workbench...
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
              You don&apos;t have a role assigned for the Trustner Advisory
              Workbench yet. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canUpload = employee.role.canUpload;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">
            Meeting Prep Workbench
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

        {canUpload && (
          <Link
            href="/admin/meeting-prep/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <Plus className="h-4 w-4" />
            New Meeting Brief
          </Link>
        )}
      </div>

      {/* Urgent: Tomorrow's meetings without prep */}
      {meetingsTomorrow.length > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold text-rose-900">
              {meetingsTomorrow.length} meeting{meetingsTomorrow.length > 1 ? 's' : ''} tomorrow without published brief
            </h3>
          </div>
          <p className="text-xs text-rose-800">
            Each meeting prep should be drafted &amp; published 24h before the meeting.
            Click below to fast-track.
          </p>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile
          label="My Drafts"
          value={counts?.myDrafts ?? 0}
          icon={ClipboardList}
          color="text-amber-700 bg-amber-50"
          href="#my-drafts"
        />
        <KpiTile
          label="Awaiting My Review"
          value={counts?.awaitingMyReview ?? 0}
          icon={Briefcase}
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
          label="Meetings Tomorrow"
          value={counts?.meetingsTomorrow ?? 0}
          icon={Calendar}
          color="text-rose-700 bg-rose-50"
          urgent={(counts?.meetingsTomorrow ?? 0) > 0}
        />
        <KpiTile
          label="This Week"
          value={counts?.upcomingMeetingsThisWeek ?? 0}
          icon={Send}
          color="text-primary-700 bg-primary-50"
        />
      </div>

      {/* My Drafts */}
      {canUpload && (
        <QueueSection
          id="my-drafts"
          title="My Drafts"
          subtitle="Meeting briefs you're preparing."
          items={myDrafts}
          emptyState="No drafts. Click 'New Meeting Brief' to start one."
          actionHref={(item) => `/admin/meeting-prep/${item.id}/edit`}
          actionLabel="Continue editing"
        />
      )}

      {/* Awaiting My Review */}
      {employee.role.canReview && (
        <QueueSection
          id="awaiting"
          title="Awaiting My Review"
          subtitle="Briefs assigned to you for review and sign-off."
          items={awaiting}
          emptyState="Nothing in your review queue."
          actionHref={(item) => `/admin/meeting-prep/${item.id}/review`}
          actionLabel="Open for review"
          urgent
        />
      )}

      {/* Pending Publish */}
      {employee.role.canPublish && (
        <QueueSection
          id="approved-pending"
          title="Approved — Pending Publish"
          subtitle="Click to publish — the briefing PDF will be emailed to the RM."
          items={approvedPending}
          emptyState="Nothing waiting to publish."
          actionHref={(item) => `/admin/meeting-prep/${item.id}/publish`}
          actionLabel="Review & publish"
          accent="emerald"
        />
      )}

      {/* Footer */}
      <div className="text-xs text-slate-400 pt-4 border-t border-slate-200">
        Internal output &middot; Briefing pack PDFs go to the assigned RM, not to clients &middot;{' '}
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
        urgent && value > 0 ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {urgent && value > 0 && (
          <span className="text-[10px] font-semibold text-rose-600 animate-pulse">
            Urgent
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
  items: MeetingPrepListItem[];
  emptyState: string;
  actionHref: (item: MeetingPrepListItem) => string;
  actionLabel: string;
  urgent?: boolean;
  accent?: 'default' | 'emerald' | 'slate';
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
}: QueueSectionProps) {
  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-200'
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
            <li key={item.id} className="px-5 py-3 hover:bg-slate-50/60 transition">
              <Link href={actionHref(item)} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">
                      {item.familyName}
                    </span>
                    <FormatIcon format={item.meetingFormat} />
                    <StatusBadge status={item.status} />
                    <PurposeBadge purpose={item.meetingPurpose} />
                    {item.hoursUntilMeeting < 24 && item.hoursUntilMeeting > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        <Clock className="h-2.5 w-2.5" />
                        {Math.round(item.hoursUntilMeeting)}h to meeting
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="font-mono">{item.documentId}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatMeetingTime(item.meetingScheduledAt)}
                    </span>
                    {item.numOpenActionItems > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ClipboardList className="h-3 w-3" />
                        {item.numOpenActionItems} open action
                        {item.numOpenActionItems > 1 ? 's' : ''}
                      </span>
                    )}
                    {item.numOpportunities > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Users className="h-3 w-3" />
                        {item.numOpportunities} opportunit
                        {item.numOpportunities > 1 ? 'ies' : 'y'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <span>{actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AgentWorkflowStatus }) {
  const map: Record<AgentWorkflowStatus, { label: string; cls: string }> = {
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

function PurposeBadge({ purpose }: { purpose: MeetingPurpose }) {
  const cls: Record<MeetingPurpose, string> = {
    'Quarterly Review': 'bg-teal-50 text-teal-700',
    'Annual Review': 'bg-indigo-50 text-indigo-700',
    'New Investment Discussion': 'bg-emerald-50 text-emerald-700',
    'SIP Step-Up': 'bg-emerald-50 text-emerald-700',
    'Grievance / Concern': 'bg-rose-50 text-rose-700',
    'Onboarding Kickoff': 'bg-amber-50 text-amber-700',
    'Retention Conversation': 'bg-rose-100 text-rose-800',
    'Family Wealth Planning': 'bg-purple-50 text-purple-700',
    Other: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls[purpose]}`}>
      {purpose}
    </span>
  );
}

function FormatIcon({ format }: { format: MeetingFormat }) {
  const icon = {
    'In-Person': Users,
    Phone: Phone,
    Video: Video,
    WhatsApp: MessageCircle,
  }[format];
  const Icon = icon;
  return <Icon className="h-3.5 w-3.5 text-slate-500" />;
}

// ─────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────

function formatMeetingTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
