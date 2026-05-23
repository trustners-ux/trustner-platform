/**
 * Investment Proposal — Edit Draft
 *
 * Show all proposal fields, allow editing the allocation, then submit for review.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Send, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Proposal {
  id: number;
  document_id: string;
  family_id: number;
  family_name: string;
  status: string;
  purpose: string;
  custom_purpose_note: string | null;
  proposed_amount_inr: number;
  proposed_lump_sum_inr: number;
  proposed_monthly_sip_inr: number;
  horizon: string;
  risk_profile: string;
  goal_statement: string | null;
  alloc_large_cap_pct: number;
  alloc_mid_cap_pct: number;
  alloc_small_cap_pct: number;
  alloc_flexi_cap_pct: number;
  alloc_multi_cap_pct: number;
  alloc_large_and_mid_pct: number;
  alloc_hybrid_pct: number;
  alloc_debt_pct: number;
  alloc_international_pct: number;
  alloc_gold_pct: number;
  created_at: string;
  updated_at: string;
}

const ALLOC_LABELS: { key: string; label: string; col: string }[] = [
  { key: 'largeCap',     label: 'Large Cap',         col: 'alloc_large_cap_pct' },
  { key: 'midCap',       label: 'Mid Cap',           col: 'alloc_mid_cap_pct' },
  { key: 'smallCap',     label: 'Small Cap',         col: 'alloc_small_cap_pct' },
  { key: 'flexiCap',     label: 'Flexi Cap',         col: 'alloc_flexi_cap_pct' },
  { key: 'multiCap',     label: 'Multi Cap',         col: 'alloc_multi_cap_pct' },
  { key: 'largeAndMid',  label: 'Large & Mid Cap',   col: 'alloc_large_and_mid_pct' },
  { key: 'hybrid',       label: 'Hybrid',            col: 'alloc_hybrid_pct' },
  { key: 'debt',         label: 'Debt',              col: 'alloc_debt_pct' },
  { key: 'international',label: 'International',     col: 'alloc_international_pct' },
  { key: 'gold',         label: 'Gold',              col: 'alloc_gold_pct' },
];

export default function EditInvestmentProposalPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<Record<string, number>>({});
  const [goalStatement, setGoalStatement] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/investment-proposal/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
        setGoalStatement(data.proposal.goal_statement ?? '');
        const a: Record<string, number> = {};
        ALLOC_LABELS.forEach((l) => {
          a[l.key] = Number(data.proposal[l.col] ?? 0);
        });
        setAllocation(a);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const allocTotal = Object.values(allocation).reduce((s, v) => s + (Number(v) || 0), 0);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/investment-proposal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation, goalStatement: goalStatement || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Save failed' });
      } else {
        setMessage({ type: 'success', text: 'Draft saved' });
        load();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetAllocation() {
    if (!proposal) return;
    const res = await fetch(`/api/admin/investment-proposal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetAllocationFromTemplate: true, riskProfile: proposal.risk_profile }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: 'Reset to template default' });
      load();
    }
  }

  async function handleSubmit() {
    if (Math.abs(allocTotal - 100) > 0.01) {
      setMessage({ type: 'error', text: `Allocation must total 100% (currently ${allocTotal.toFixed(1)}%)` });
      return;
    }
    setSubmitting(true);
    try {
      // Save first — abort if save fails (don't submit stale data)
      const saveRes = await fetch(`/api/admin/investment-proposal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation, goalStatement: goalStatement || null }),
      });
      if (!saveRes.ok) {
        const saveData = await saveRes.json().catch(() => ({}));
        setMessage({ type: 'error', text: saveData.error ?? 'Save failed before submit' });
        setSubmitting(false);
        return;
      }
      // Then submit
      const res = await fetch(`/api/admin/investment-proposal/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Submit failed' });
        setSubmitting(false);
        return;
      }
      router.push('/admin/investment-proposal');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">
        Loading proposal…
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        Proposal not found.
      </div>
    );
  }

  const readOnly = proposal.status !== 'DRAFT' && proposal.status !== 'CHANGES_REQUESTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/investment-proposal"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{proposal.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{proposal.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {proposal.purpose} · {proposal.risk_profile} · {proposal.horizon}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Proposed (12mo)" value={`₹${proposal.proposed_amount_inr.toLocaleString('en-IN')}`} />
          <Stat label="Lump Sum" value={`₹${proposal.proposed_lump_sum_inr.toLocaleString('en-IN')}`} />
          <Stat label="Monthly SIP" value={`₹${proposal.proposed_monthly_sip_inr.toLocaleString('en-IN')}`} />
          <Stat label="Horizon" value={proposal.horizon} />
        </div>

        {proposal.custom_purpose_note && (
          <div className="mt-3 text-sm text-slate-700 italic">
            Note: {proposal.custom_purpose_note}
          </div>
        )}
      </div>

      {/* Goal */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Goal / Context
        </h2>
        <textarea
          value={goalStatement}
          onChange={(e) => setGoalStatement(e.target.value)}
          disabled={readOnly}
          rows={2}
          placeholder="Goal context — what the client is trying to achieve"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Allocation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Asset Allocation
          </h2>
          {!readOnly && (
            <button
              onClick={handleResetAllocation}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to {proposal.risk_profile} default
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALLOC_LABELS.map((l) => (
            <div key={l.key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{l.label}</label>
              <div className="relative">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  disabled={readOnly}
                  value={allocation[l.key] ?? 0}
                  onChange={(e) =>
                    setAllocation((a) => ({ ...a, [l.key]: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full pr-7 pl-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-brand-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span
            className={`text-lg font-bold ${
              Math.abs(allocTotal - 100) < 0.01
                ? 'text-emerald-600'
                : allocTotal > 100
                ? 'text-red-600'
                : 'text-amber-600'
            }`}
          >
            {allocTotal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg border p-3 flex items-start gap-2 ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Allocation must total 100% before submitting for review.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || Math.abs(allocTotal - 100) > 0.01}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This proposal is in <strong>{proposal.status}</strong> state — view-only. Use the
          review page if you need to take action.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    CHANGES_REQUESTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    PUBLISHED: 'bg-purple-100 text-purple-700',
    REJECTED: 'bg-red-100 text-red-700',
    ESCALATED: 'bg-pink-100 text-pink-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
