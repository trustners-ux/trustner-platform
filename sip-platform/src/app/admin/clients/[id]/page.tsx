/**
 * Client Family Detail Page
 *
 * Route: /admin/clients/[id]
 *
 * Complete client picture: identity card, all 5 agent artefacts in
 * one timeline, and the audit trail of who has read this family's
 * data. The single source of truth for "what's happened with this
 * client" across the entire workbench.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, ClipboardList, FileText, Briefcase, CompassIcon,
  RefreshCw, Eye, Users, Phone, Mail, Shield,
} from 'lucide-react';

interface FamilyDetail {
  family: {
    id: number; familyCode: string | null; familyName: string;
    primaryContactName: string | null; primaryContactEmail: string | null; primaryContactMobile: string | null;
    segment: string | null; notes: string | null; createdAt: string; updatedAt: string;
  };
  entities: Array<{ id: number; name: string; type: string | null }>;
  diagnostics: Array<{
    id: number; documentId: string; status: string; createdAt: string;
    updatedAt: string; approvedAt: string | null; publishedAt: string | null;
    totalInvestedInr: number; currentValueInr: number; familyXirrPct: number | null;
    numHoldings: number; numActiveSips: number; verdictSwapCount: number;
    uploadedByName: string | null; reviewerName: string | null;
  }>;
  briefs: Array<{ id: number; createdAt: string; status: string | null; meetingDate: string | null }>;
  proposals: Array<{ id: number; createdAt: string; status: string | null; targetAumInr: number }>;
  orientations: Array<{ id: number; createdAt: string; status: string | null; completedAt: string | null }>;
  reviews: Array<{ id: number; createdAt: string; status: string | null; reviewPeriod: string | null }>;
  auditTrail: Array<{ id: number; viewedAt: string; viewerName: string; artefactType: string; artefactId: number }>;
}

function formatInr(n: number | null | undefined): string {
  if (!n || !Number.isFinite(n)) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<FamilyDetail | null>(null);
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
      const res = await fetch(`/api/admin/clients/${id}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? `HTTP ${res.status}`); return; }
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (error || !data) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error:</strong> {error ?? 'No data'}
        <div className="mt-3">
          <Link href="/admin/clients" className="inline-flex items-center text-sm text-rose-700 hover:text-rose-900">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to directory
          </Link>
        </div>
      </div>
    );
  }

  const { family, entities, diagnostics, briefs, proposals, orientations, reviews, auditTrail } = data;
  const latestPub = diagnostics.find((d) => d.status === 'PUBLISHED');

  return (
    <div className="space-y-5">
      <Link href="/admin/clients" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to directory
      </Link>

      {/* Identity card */}
      <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-primary-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-primary-700">{family.familyName}</h1>
            <div className="text-xs text-slate-500 mt-1">
              {family.familyCode ?? 'no code'} · created {new Date(family.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Contact</div>
                <div className="font-semibold mt-0.5">{family.primaryContactName ?? '—'}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Mobile
                </div>
                <div className="font-semibold mt-0.5">{family.primaryContactMobile ?? '—'}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </div>
                <div className="font-semibold mt-0.5 break-all">{family.primaryContactEmail ?? '—'}</div>
              </div>
            </div>
            {family.notes && (
              <div className="mt-3 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <strong>Notes:</strong> {family.notes}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {family.segment && (
              <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">{family.segment}</span>
            )}
            <Link
              href={`/admin/portfolio-diagnostic/new?familyId=${family.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
            >
              + New Diagnostic
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={ClipboardList} label="Latest AUM" value={formatInr(latestPub?.currentValueInr)} tone="teal" />
        <StatTile icon={Users} label="Entities" value={String(entities.length)} tone="primary" />
        <StatTile icon={RefreshCw} label="Total Artefacts" value={String(diagnostics.length + briefs.length + proposals.length + orientations.length + reviews.length)} tone="emerald" />
        <StatTile icon={Eye} label="Views in last 100" value={String(auditTrail.length)} tone="amber" />
      </div>

      {/* Entities */}
      {entities.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-700 mb-2">Family Entities ({entities.length})</h2>
          <div className="flex flex-wrap gap-2">
            {entities.map((e) => (
              <span key={e.id} className="inline-block px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                {e.name}{e.type ? ` · ${e.type}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All artefacts — grouped */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Diagnostics */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary-600" />
            Portfolio Diagnostics ({diagnostics.length})
          </h2>
          {diagnostics.length === 0 ? (
            <p className="text-sm text-slate-500">None yet.</p>
          ) : (
            <div className="space-y-2">
              {diagnostics.map((d) => (
                <Link key={d.id}
                  href={`/admin/portfolio-diagnostic/${d.id}/${d.status === 'DRAFT' || d.status === 'CHANGES_REQUESTED' ? 'edit' : 'review'}`}
                  className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{d.documentId}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      d.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                      d.status === 'APPROVED' ? 'bg-teal-100 text-teal-700' :
                      d.status === 'DRAFT' || d.status === 'CHANGES_REQUESTED' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{d.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {formatInr(d.currentValueInr)} · {d.numHoldings} holdings · {d.numActiveSips} SIPs · {d.verdictSwapCount} swaps
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {d.uploadedByName ? `Uploaded by ${d.uploadedByName}` : ''}
                    {d.reviewerName ? ` · Reviewer: ${d.reviewerName}` : ''}
                    {d.publishedAt ? ` · Published ${new Date(d.publishedAt).toLocaleDateString('en-IN')}` : ''}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Other artefacts */}
        <div className="space-y-3">
          <ArtefactBlock
            icon={FileText}
            tone="teal"
            label="Meeting Briefs"
            items={briefs.map((b) => ({
              id: b.id, label: `Brief #${b.id}`, status: b.status,
              subtitle: b.meetingDate ? `Meeting ${new Date(b.meetingDate).toLocaleDateString('en-IN')}` : new Date(b.createdAt).toLocaleDateString('en-IN'),
              href: `/admin/meeting-prep/${b.id}`,
            }))}
          />
          <ArtefactBlock
            icon={Briefcase}
            tone="amber"
            label="Investment Proposals"
            items={proposals.map((p) => ({
              id: p.id, label: `Proposal #${p.id}`, status: p.status,
              subtitle: `Target ${formatInr(p.targetAumInr)}`,
              href: `/admin/investment-proposal/${p.id}`,
            }))}
          />
          <ArtefactBlock
            icon={CompassIcon}
            tone="emerald"
            label="Client Orientations"
            items={orientations.map((o) => ({
              id: o.id, label: `Orientation #${o.id}`, status: o.status,
              subtitle: o.completedAt ? `Completed ${new Date(o.completedAt).toLocaleDateString('en-IN')}` : 'In progress',
              href: `/admin/client-orientation/${o.id}`,
            }))}
          />
          <ArtefactBlock
            icon={RefreshCw}
            tone="rose"
            label="Periodic Reviews"
            items={reviews.map((r) => ({
              id: r.id, label: `Review #${r.id}`, status: r.status,
              subtitle: r.reviewPeriod ?? new Date(r.createdAt).toLocaleDateString('en-IN'),
              href: `/admin/periodic-review/${r.id}`,
            }))}
          />
        </div>
      </div>

      {/* Audit trail */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-600" />
          Who has viewed this family&apos;s data ({auditTrail.length})
          <Link href={`/admin/audit/views?familyId=${family.id}`} className="ml-auto text-xs text-primary-600 hover:underline">
            Open full audit →
          </Link>
        </h2>
        {auditTrail.length === 0 ? (
          <p className="text-sm text-slate-500">No reads logged yet for this family.</p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {auditTrail.slice(0, 30).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs py-1.5 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900">{v.viewerName}</span>{' '}
                  <span className="text-slate-500">viewed</span>{' '}
                  <Link href={`/admin/portfolio-diagnostic/${v.artefactId}/review`} className="text-primary-600 hover:underline">
                    PD #{v.artefactId}
                  </Link>
                </div>
                <span className="text-slate-500">{new Date(v.viewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: 'primary' | 'teal' | 'amber' | 'emerald';
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  } as const;
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function ArtefactBlock({
  icon: Icon, label, tone, items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: 'teal' | 'amber' | 'emerald' | 'rose';
  items: Array<{ id: number; label: string; status: string | null; subtitle: string; href: string }>;
}) {
  const tones = {
    teal: 'text-teal-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
  } as const;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${tones[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
        {label} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None.</p>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 5).map((it) => (
            <Link key={it.id} href={it.href} className="block rounded px-2 py-1 hover:bg-slate-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{it.label}</span>
                {it.status && <span className="text-[10px] font-mono text-slate-500">{it.status}</span>}
              </div>
              <div className="text-[10px] text-slate-400">{it.subtitle}</div>
            </Link>
          ))}
          {items.length > 5 && <div className="text-[10px] text-slate-400 px-2">+ {items.length - 5} more</div>}
        </div>
      )}
    </div>
  );
}
