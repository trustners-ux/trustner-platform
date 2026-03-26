'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Shield, Clock,
  CheckCircle2, XCircle, RefreshCw, Edit3, Save, Download,
  Sparkles, AlertTriangle, FileText, Activity, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReportQueueEntry } from '@/types/report-queue';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending_review: { label: 'Pending Review', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
  approved: { label: 'Approved', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: CheckCircle2 },
  sent: { label: 'Sent to User', bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: XCircle },
};

function gradeColor(grade: string): string {
  const c: Record<string, string> = {
    'Excellent': '#15803d', 'Good': '#0f766e', 'Fair': '#d97706',
    'Needs Improvement': '#ea580c', 'Needs Attention': '#ea580c', 'Critical': '#b91c1c',
  };
  return c[grade] || '#0f766e';
}

function formatAmount(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PILLAR_LABELS: Record<string, string> = {
  cashflow: 'Cashflow Health',
  protection: 'Protection',
  investments: 'Investments',
  debt: 'Debt Management',
  retirementReadiness: 'Retirement',
};

const PILLAR_COLORS: Record<string, string> = {
  cashflow: '#0F766E',
  protection: '#7C3AED',
  investments: '#2563EB',
  debt: '#EA580C',
  retirementReadiness: '#D97706',
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<ReportQueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Narrative editing
  const [editingNarrative, setEditingNarrative] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');

  // Admin notes
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports/${id}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setNarrativeText(data.report.editedNarrative || data.report.claudeNarrative);
        setAdminNotes(data.report.adminNotes || '');
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ---------- Actions ---------- */
  const handleSaveNarrative = async () => {
    if (!report) return;
    setActionLoading('save');
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedNarrative: narrativeText }),
      });
      if (res.ok) {
        setEditingNarrative(false);
        await fetchReport();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async () => {
    if (!report) return;
    setActionLoading('regenerate');
    try {
      const res = await fetch(`/api/admin/reports/${id}/regenerate`, { method: 'POST' });
      if (res.ok) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!report) return;
    setActionLoading('saveNotes');
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
        await fetchReport();
      }
    } catch (err) {
      console.error('Save notes failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!report) return;
    setActionLoading('approve');
    try {
      const res = await fetch(`/api/admin/reports/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          alert(`Approved with warning: ${data.warning}`);
        }
        await fetchReport();
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!report || !rejectReason.trim()) return;
    setActionLoading('reject');
    try {
      const res = await fetch(`/api/admin/reports/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason('');
        await fetchReport();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Loading State ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-sm text-slate-400">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Report not found</p>
        <button onClick={() => router.push('/admin/reports')} className="mt-4 text-brand text-sm font-semibold">
          ← Back to Reports
        </button>
      </div>
    );
  }

  const isPending = report.status === 'pending_review';
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending_review;
  const StatusIcon = statusCfg.icon;
  const currentNarrative = report.editedNarrative || report.claudeNarrative;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/reports')}
            className="p-2 rounded-lg text-slate-400 hover:bg-surface-100 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-primary-700">{report.userName}</h1>
            <p className="text-xs text-slate-400">{report.id}</p>
          </div>
        </div>
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold', statusCfg.bg, statusCfg.text)}>
          <StatusIcon className="w-4 h-4" />
          {statusCfg.label}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left panel — 3 cols */}
        <div className="lg:col-span-3 space-y-5">
          {/* User Info Card */}
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              User Profile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userPhone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.userCity}, Age {report.userAge}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{report.riskCategory}</span>
              </div>
            </div>
          </div>

          {/* Score + Pillars */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Financial Health Score</h3>
              <div className="text-center">
                <span className="text-3xl font-extrabold" style={{ color: gradeColor(report.grade) }}>
                  {report.totalScore}
                </span>
                <span className="text-slate-400 text-sm">/900</span>
                <div className="text-xs font-semibold mt-0.5" style={{ color: gradeColor(report.grade) }}>
                  {report.grade}
                </div>
              </div>
            </div>

            {/* Pillar bars */}
            <div className="space-y-3">
              {Object.entries(report.pillarScores).map(([key, pillar]) => {
                const percent = Math.round((pillar.score / 180) * 100);
                const color = PILLAR_COLORS[key] || '#0f766e';
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">{PILLAR_LABELS[key] || key}</span>
                      <span className="font-bold" style={{ color }}>
                        {pillar.score}/180 ({pillar.grade})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Net Worth */}
            <div className="mt-4 pt-4 border-t border-surface-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Net Worth</span>
              <span className="text-lg font-extrabold text-primary-700">{formatAmount(report.netWorth)}</span>
            </div>
          </div>

          {/* Top Actions */}
          {report.topActions.length > 0 && (
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Top Action Items</h3>
              <div className="space-y-2">
                {report.topActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-600">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* PDF Preview */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                PDF Report
              </h3>
              <a
                href={report.pdfBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
            <div className="aspect-[3/4] bg-slate-50">
              <iframe
                src={report.pdfBlobUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Section — Full width */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Narrative
            <span className="text-xs font-normal text-slate-400">v{report.narrativeVersion}</span>
            {report.editedNarrative && (
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                Edited
              </span>
            )}
          </h3>
          {isPending && (
            <div className="flex items-center gap-2">
              {!editingNarrative ? (
                <>
                  <button
                    onClick={() => setEditingNarrative(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={actionLoading === 'regenerate'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3 h-3', actionLoading === 'regenerate' && 'animate-spin')} />
                    Regenerate with AI
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveNarrative}
                    disabled={actionLoading === 'save'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNarrative(false);
                      setNarrativeText(currentNarrative);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {editingNarrative ? (
          <div>
            <textarea
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              rows={10}
              className="w-full p-3 text-sm text-slate-700 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
            />
            <div className="text-right mt-1 text-xs text-slate-400">{narrativeText.length} characters</div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{currentNarrative}</p>
        )}
      </div>

      {/* Admin Notes */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Admin Notes / Comments
            {report.adminNotes && !isPending && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Has notes
              </span>
            )}
          </h3>
          {isPending && (
            <button
              onClick={handleSaveNotes}
              disabled={actionLoading === 'saveNotes'}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {notesSaved ? 'Saved!' : actionLoading === 'saveNotes' ? 'Saving...' : 'Save Notes'}
            </button>
          )}
        </div>
        {isPending ? (
          <div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Add review comments or a personalized note for the user. Notes will be included in the report email as a message from the advisor..."
              className="w-full p-3 text-sm text-slate-700 border border-surface-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">
              These notes will appear in the email sent to the user under &quot;A note from your advisor&quot;.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {report.adminNotes ? (
              <span className="text-slate-600">{report.adminNotes}</span>
            ) : (
              <span className="text-slate-400 italic">No admin notes added</span>
            )}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="card-base p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading === 'approve' ? 'Sending...' : 'Approve & Send Report'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={!!actionLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Sent confirmation */}
      {report.status === 'sent' && (
        <div className="card-base p-5 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-700">Report Sent Successfully</p>
              <p className="text-xs text-green-600">
                Approved by {report.approvedBy} on {report.approvedAt ? formatDateTime(report.approvedAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected info */}
      {report.status === 'rejected' && (
        <div className="card-base p-5 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Report Rejected</p>
              <p className="text-xs text-red-600 mt-1">
                Reason: {report.rejectionReason}
              </p>
              <p className="text-xs text-red-500 mt-1">
                Rejected on {report.rejectedAt ? formatDateTime(report.rejectedAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {report.editHistory.length > 0 && (
        <div className="card-base p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Audit Trail
          </h3>
          <div className="space-y-3">
            {report.editHistory.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700">{entry.action.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400"> by {entry.adminEmail}</span>
                  <div className="text-slate-400">{formatDateTime(entry.timestamp)}</div>
                  {entry.details && <div className="text-slate-500 mt-0.5">{entry.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full p-6">
            <h3 className="text-base font-bold text-primary-700 mb-3">Reject Report</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejecting this report. The report will not be sent to the user.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full p-3 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === 'reject'}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
