'use client';

/**
 * Phase 8 — Separation clearance checklist.
 *
 * Items grouped by category, kanban-style.
 * POSP handover row is amber-bordered + flagged as REQUIRED FOR CLEARANCE.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ClipboardCheck, ArrowLeft, Loader2, CheckCircle2, Upload, AlertTriangle,
  Circle, XCircle, ShieldAlert,
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  category: string;
  name: string;
  description: string | null;
  owner: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'not_applicable' | 'failed';
  proof_blob_url: string | null;
  recovery_amount: number | null;
  is_posp_handover: boolean;
  required_for_clearance: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-slate-100 text-slate-700',
  in_progress:     'bg-amber-100 text-amber-800',
  done:            'bg-emerald-100 text-emerald-800',
  not_applicable:  'bg-slate-200 text-slate-500',
  failed:          'bg-rose-100 text-rose-800',
};

const STATUS_OPTIONS: { value: ChecklistItem['status']; label: string }[] = [
  { value: 'pending',        label: 'Pending' },
  { value: 'in_progress',    label: 'In Progress' },
  { value: 'done',           label: 'Done' },
  { value: 'not_applicable', label: 'N/A' },
  { value: 'failed',         label: 'Failed' },
];

export default function SeparationChecklistPage() {
  const { id } = useParams() as { id: string };
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/exits/${id}/checklist`)
      .then((r) => r.json())
      .then((j) => setItems(j.rows || j.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = async (itemId: number, patch: Partial<ChecklistItem>) => {
    setUpdating(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/employee/hr/exits/${id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Update failed'); return; }
      load();
    } finally { setUpdating(null); }
  };

  const bulkConfirm = async () => {
    if (!confirm('Mark every PENDING item as DONE? HR-admin action — audited.')) return;
    setError(null);
    const pending = items.filter((i) => i.status === 'pending');
    for (const it of pending) {
      await fetch(`/api/employee/hr/exits/${id}/checklist/${it.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
    }
    load();
  };

  // Group by category
  const groups: Record<string, ChecklistItem[]> = {};
  for (const it of items) {
    const k = it.category || 'Uncategorised';
    if (!groups[k]) groups[k] = [];
    groups[k].push(it);
  }

  const totalCount = items.length;
  const doneCount = items.filter((i) => i.status === 'done' || i.status === 'not_applicable').length;
  const pospItem = items.find((i) => i.is_posp_handover);

  return (
    <div className="p-8 max-w-6xl">
      <Link href={`/employee/hr/exits/${id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to case
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Clearance Checklist</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {doneCount} of {totalCount} items complete
            </p>
          </div>
        </div>
        <button
          onClick={bulkConfirm}
          disabled={loading || items.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
        >
          <CheckCircle2 className="w-3 h-3" /> Bulk Confirm Pending
        </button>
      </div>

      {pospItem && pospItem.status !== 'done' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-900">POSP handover not complete</div>
            <p className="text-xs text-amber-900/80 mt-0.5">
              Relieving letter and final F&amp;F disbursal are blocked until the POSP cross-check row is marked DONE with proof attached.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No checklist items yet. They will auto-seed when the case moves to manager_review.
        </div>
      ) : (
        Object.entries(groups).map(([cat, list]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((item) => {
                const posp = item.is_posp_handover;
                const isUpdating = updating === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border p-4 ${
                      posp ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                          {posp && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                              Required for Clearance
                            </span>
                          )}
                          {item.required_for_clearance && !posp && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              Required
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[item.status]}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                      <div>
                        <div className="text-slate-500">Owner</div>
                        <div className="font-medium text-slate-800">{item.owner || '—'}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Recovery ₹</div>
                        <div className="font-mono font-bold text-slate-800">
                          {item.recovery_amount != null ? Math.round(item.recovery_amount).toLocaleString('en-IN') : '—'}
                        </div>
                      </div>
                      {item.completed_by && (
                        <div className="col-span-2">
                          <div className="text-slate-500">Completed</div>
                          <div className="text-emerald-700">{item.completed_by} · {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      <select
                        value={item.status}
                        onChange={(e) => updateItem(item.id, { status: e.target.value as ChecklistItem['status'] })}
                        disabled={isUpdating}
                        className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const url = prompt('Proof URL or blob path:', item.proof_blob_url || '');
                          if (url === null) return;
                          updateItem(item.id, { proof_blob_url: url || null });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs text-slate-700"
                      >
                        <Upload className="w-3 h-3" /> {item.proof_blob_url ? 'Update proof' : 'Attach proof'}
                      </button>
                      {item.status !== 'done' && (
                        <button
                          onClick={() => updateItem(item.id, { status: 'done' })}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Mark done
                        </button>
                      )}
                      {item.proof_blob_url && (
                        <a
                          href={item.proof_blob_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          View proof ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <div className="mt-6 text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1"><Circle className="w-3 h-3" /> Pending</span>
        <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> In progress</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done</span>
        <span className="inline-flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-600" /> Failed / required for clearance</span>
      </div>
    </div>
  );
}
