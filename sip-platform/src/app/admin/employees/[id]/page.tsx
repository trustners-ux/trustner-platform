/**
 * Employee Performance Dashboard
 *
 * Route: /admin/employees/[id]
 *
 * Per-employee drill-down: KPI tiles, status breakdown, in-flight
 * review queue, recent activity feed. Visible to: principals, anyone
 * with can_manage_users, OR the employee themselves.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, ClipboardList, CheckCircle2, Mail, Clock,
  TrendingUp, AlertCircle, Activity,
} from 'lucide-react';

interface PerformanceData {
  employee: {
    id: number;
    employeeCode: string;
    name: string;
    email: string | null;
    designation: string | null;
    entity: string | null;
    levelCode: string | null;
    doj: string | null;
    isActive: boolean;
  };
  diagnostics: {
    uploadedTotal: number;
    uploadedAumInr: number;
    statusBreakdown: Record<string, number>;
    approvedTotal: number;
    approvedAumInr: number;
    currentlyAssignedForReview: Array<{
      id: number; familyName: string; status: string; createdAt: string;
    }>;
  };
  reviews: {
    avgTurnaroundHours: number | null;
    turnaroundSampleCount: number;
  };
  shares: {
    total: number;
    lastShareAt: string | null;
  };
  activity: {
    lastEventAt: string | null;
    lastEventAction: string | null;
    lastEventDiagId: number | null;
    recentEvents: Array<{
      id: number;
      action: string;
      fromStatus: string | null;
      toStatus: string | null;
      createdAt: string;
      diagnosticId: number;
    }>;
  };
}

function formatInr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function EmployeePerformancePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}/performance`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error:</strong> {error ?? 'No data'}
        <div className="mt-3">
          <Link href="/admin/employees" className="inline-flex items-center text-sm text-rose-700 hover:text-rose-900">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to team
          </Link>
        </div>
      </div>
    );
  }

  const { employee, diagnostics, reviews, shares, activity } = data;

  return (
    <div className="space-y-5">
      <Link href="/admin/employees" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to team
      </Link>

      {/* Identity card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-primary-700">{employee.name}</h1>
            <div className="text-sm text-slate-600 mt-1">
              {employee.designation ?? '—'} · {employee.entity} · {employee.levelCode}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {employee.employeeCode} · {employee.email ?? 'no email on file'}
              {employee.doj && ` · joined ${new Date(employee.doj).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}
            </div>
          </div>
          <div>
            {employee.isActive ? (
              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span>
            ) : (
              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600">Inactive</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          icon={ClipboardList}
          label="Diagnostics Uploaded"
          primary={String(diagnostics.uploadedTotal)}
          secondary={formatInr(diagnostics.uploadedAumInr) + ' total AUM'}
          tone="primary"
        />
        <KpiTile
          icon={CheckCircle2}
          label="Approved by them"
          primary={String(diagnostics.approvedTotal)}
          secondary={formatInr(diagnostics.approvedAumInr) + ' signed off'}
          tone="emerald"
        />
        <KpiTile
          icon={Clock}
          label="Avg Review TAT"
          primary={reviews.avgTurnaroundHours !== null ? `${reviews.avgTurnaroundHours.toFixed(1)}h` : '—'}
          secondary={reviews.turnaroundSampleCount > 0 ? `over ${reviews.turnaroundSampleCount} reviews` : 'no samples yet'}
          tone="amber"
        />
        <KpiTile
          icon={Mail}
          label="Client Shares"
          primary={String(shares.total)}
          secondary={shares.lastShareAt ? `last ${new Date(shares.lastShareAt).toLocaleDateString('en-IN')}` : 'no shares yet'}
          tone="teal"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Diagnostic Status Breakdown
          </h2>
          {Object.keys(diagnostics.statusBreakdown).length === 0 ? (
            <p className="text-sm text-slate-500">No diagnostics uploaded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(diagnostics.statusBreakdown).map(([status, count]) => (
                  <tr key={status} className="border-t border-slate-100">
                    <td className="py-2 font-mono text-xs">{status}</td>
                    <td className="py-2 text-right font-bold">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* In-flight review queue */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Currently In Their Queue ({diagnostics.currentlyAssignedForReview.length})
          </h2>
          {diagnostics.currentlyAssignedForReview.length === 0 ? (
            <p className="text-sm text-slate-500">No assigned reviews right now.</p>
          ) : (
            <div className="space-y-2">
              {diagnostics.currentlyAssignedForReview.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/portfolio-diagnostic/${r.id}/review`}
                  className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{r.familyName}</span>
                    <span className="text-xs font-mono text-amber-700">{r.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Submitted {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          Recent Activity (last 20)
        </h2>
        {activity.recentEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No actions logged yet.</p>
        ) : (
          <div className="space-y-1">
            {activity.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-700">{e.action}</span>
                  {e.fromStatus && e.toStatus && (
                    <span className="text-slate-500">{e.fromStatus} → {e.toStatus}</span>
                  )}
                  <Link href={`/admin/portfolio-diagnostic/${e.diagnosticId}/review`} className="text-primary-600 hover:underline">
                    PD #{e.diagnosticId}
                  </Link>
                </div>
                <span className="text-slate-500">
                  {new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function KpiTile({
  icon: Icon, label, primary, secondary, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary: string;
  secondary: string;
  tone: 'primary' | 'emerald' | 'amber' | 'teal';
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    teal:    'bg-teal-50 text-teal-700 border-teal-200',
  } as const;
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-extrabold">{primary}</div>
      <div className="text-[11px] mt-0.5 opacity-80">{secondary}</div>
    </div>
  );
}
