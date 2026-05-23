/**
 * Client Orientation Agent — Employee Dashboard
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ClipboardList, CheckCircle2, Send, Plus, AlertTriangle, Star, UserPlus, ArrowRight } from 'lucide-react';

interface ListItem {
  id: number; documentId: string; familyId: number; familyName: string;
  status: string; riskCategory: string | null; numGoals: number;
  clientSigned: boolean; uploadedByName: string | null; currentReviewerName: string | null;
  createdAt: string; updatedAt: string;
}

interface Employee {
  id: number; name: string; email: string;
  role: { name: string; level: number; canUpload: boolean; canReview: boolean; canApprove: boolean; canPublish: boolean };
  certifications: string[];
}

export default function ClientOrientationDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [counts, setCounts] = useState<{ myDrafts: number; awaitingMyReview: number; approvedNotYetPublished: number; publishedThisMonth: number } | null>(null);
  const [myDrafts, setMyDrafts] = useState<ListItem[]>([]);
  const [awaiting, setAwaiting] = useState<ListItem[]>([]);
  const [approvedPending, setApprovedPending] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/client-orientation/dashboard', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setEmployee(d.employee); setCounts(d.counts);
        setMyDrafts(d.myDrafts ?? []); setAwaiting(d.awaiting ?? []); setApprovedPending(d.approvedPending ?? []);
      }
    } finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-96 text-sm text-slate-400">Loading…</div>;
  if (!employee) return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
      <div><h3 className="font-semibold text-amber-900">No Workbench Role Assigned</h3><p className="text-sm text-amber-800 mt-1">Contact admin.</p></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Client Orientation Workbench</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employee.name} · <span className="capitalize">{employee.role.name.replace('_', ' ')}</span> (L{employee.role.level})
            {employee.certifications.length > 0 && <span className="text-emerald-700 ml-2">· <Star className="h-3 w-3 inline" /> {employee.certifications.join(', ')}</span>}
          </p>
        </div>
        {employee.role.canUpload && (
          <Link href="/admin/client-orientation/new" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New Orientation
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="My Drafts" value={counts?.myDrafts ?? 0} icon={FileText} color="text-amber-700 bg-amber-50" />
        <KpiTile label="Awaiting My Review" value={counts?.awaitingMyReview ?? 0} icon={ClipboardList} color="text-blue-700 bg-blue-50" urgent={(counts?.awaitingMyReview ?? 0) > 0} />
        <KpiTile label="Pending Publish" value={counts?.approvedNotYetPublished ?? 0} icon={CheckCircle2} color="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Published This Month" value={counts?.publishedThisMonth ?? 0} icon={Send} color="text-primary-700 bg-primary-50" />
      </div>

      {employee.role.canUpload && <Queue title="My Drafts" items={myDrafts} hrefFn={(i) => `/admin/client-orientation/${i.id}/edit`} />}
      {employee.role.canReview && <Queue title="Awaiting My Review" items={awaiting} hrefFn={(i) => `/admin/client-orientation/${i.id}/review`} />}
      {employee.role.canPublish && <Queue title="Approved — Pending Publish" items={approvedPending} hrefFn={(i) => `/admin/client-orientation/${i.id}/review`} />}
    </div>
  );
}

function KpiTile({ label, value, icon: Icon, color, urgent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; urgent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${urgent && value > 0 ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function Queue({ title, items, hrefFn }: { title: string; items: ListItem[]; hrefFn: (i: ListItem) => string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <div className="text-sm text-slate-400">{items.length}</div>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Nothing here yet.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3 hover:bg-slate-50/60">
              <Link href={hrefFn(item)} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">{item.familyName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{item.status.replace('_', ' ')}</span>
                    {item.riskCategory && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{item.riskCategory}</span>}
                    {item.clientSigned && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Signed</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="font-mono">{item.documentId}</span>
                    <span><UserPlus className="h-3 w-3 inline" /> {item.numGoals} goals</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
