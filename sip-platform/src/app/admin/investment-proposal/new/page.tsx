/**
 * Investment Proposal — New Draft
 *
 * Single-page intake form. Saves a DRAFT and routes to /edit/[id].
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, Search, AlertTriangle } from 'lucide-react';

const PURPOSES = [
  'New Investment',
  'SIP Step-Up',
  'Lump Sum Top-Up',
  'Goal-Based Plan',
  'Tax-Saver (ELSS)',
  'Other',
] as const;

const RISK_PROFILES = [
  'Conservative',
  'Moderate',
  'Moderately Aggressive',
  'Aggressive',
  'Very Aggressive',
] as const;

const HORIZONS = [
  '< 1 year',
  '1-3 years',
  '3-5 years',
  '5-7 years',
  '7-10 years',
  '> 10 years',
] as const;

interface Family {
  id: number;
  familyName: string;
  segment?: string;
  totalAumInr?: number;
  primaryContactName?: string;
  primaryContactMobile?: string;
}

export default function NewInvestmentProposalPage() {
  const router = useRouter();
  const [familyQuery, setFamilyQuery] = useState('');
  const [familyResults, setFamilyResults] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [searching, setSearching] = useState(false);
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>('New Investment');
  const [customPurposeNote, setCustomPurposeNote] = useState('');
  const [riskProfile, setRiskProfile] = useState<(typeof RISK_PROFILES)[number]>('Moderate');
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>('5-7 years');
  const [lumpSumInr, setLumpSumInr] = useState('');
  const [monthlySipInr, setMonthlySipInr] = useState('');
  const [goalStatement, setGoalStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposedAmountInr =
    (parseInt(lumpSumInr || '0', 10) || 0) +
    (parseInt(monthlySipInr || '0', 10) || 0) * 12;

  async function searchFamilies(q: string) {
    setFamilyQuery(q);
    if (q.length < 2) {
      setFamilyResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/families?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setFamilyResults(data.families ?? []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedFamily) {
      setError('Please select a client family.');
      return;
    }
    if (proposedAmountInr <= 0) {
      setError('Enter either a lump-sum amount or a monthly SIP (or both).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/investment-proposal/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: selectedFamily.id,
          familyName: selectedFamily.familyName,
          purpose,
          customPurposeNote: customPurposeNote || undefined,
          riskProfile,
          horizon,
          proposedAmountInr,
          proposedLumpSumInr: parseInt(lumpSumInr || '0', 10) || 0,
          proposedMonthlySipInr: parseInt(monthlySipInr || '0', 10) || 0,
          goalStatement: goalStatement || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create draft');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/investment-proposal/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/investment-proposal"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="rounded-lg bg-brand-50 p-2.5 flex-shrink-0">
            <Briefcase className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">New Investment Proposal</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Draft a client-facing investment recommendation. Saves as DRAFT — you can edit
              recommendations and submit for review on the next screen.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Family picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Client Family <span className="text-red-600">*</span>
            </label>
            {selectedFamily ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div>
                  <div className="font-semibold text-emerald-900">{selectedFamily.familyName}</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    {selectedFamily.primaryContactName ?? '—'}
                    {selectedFamily.segment ? ` · ${selectedFamily.segment}` : ''}
                    {selectedFamily.totalAumInr
                      ? ` · AUM ₹${(selectedFamily.totalAumInr / 100000).toFixed(1)}L`
                      : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFamily(null);
                    setFamilyResults([]);
                    setFamilyQuery('');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={familyQuery}
                    onChange={(e) => searchFamilies(e.target.value)}
                    placeholder="Search by family name, contact name, or mobile…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                {familyResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                    {familyResults.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedFamily(f);
                          setFamilyResults([]);
                          setFamilyQuery('');
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <div className="font-medium text-slate-900 text-sm">{f.familyName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {f.primaryContactName ?? '—'}
                          {f.segment ? ` · ${f.segment}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && (
                  <div className="text-xs text-slate-500 mt-1">Searching…</div>
                )}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Purpose <span className="text-red-600">*</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as (typeof PURPOSES)[number])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Risk Profile <span className="text-red-600">*</span>
              </label>
              <select
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value as (typeof RISK_PROFILES)[number])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                {RISK_PROFILES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {purpose === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Specify Purpose
              </label>
              <input
                type="text"
                value={customPurposeNote}
                onChange={(e) => setCustomPurposeNote(e.target.value)}
                placeholder="e.g. Bonus deployment, NRI repatriation buffer…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {/* Horizon + Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Horizon <span className="text-red-600">*</span>
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as (typeof HORIZONS)[number])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                {HORIZONS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Lump Sum (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={lumpSumInr}
                onChange={(e) => setLumpSumInr(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Monthly SIP (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={monthlySipInr}
                onChange={(e) => setMonthlySipInr(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {proposedAmountInr > 0 && (
            <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-sm text-brand-900">
              <strong>12-month proposed deployment: ₹{proposedAmountInr.toLocaleString('en-IN')}</strong>{' '}
              {parseInt(monthlySipInr || '0', 10) > 0 && (
                <span className="text-brand-700">
                  ({parseInt(lumpSumInr || '0', 10) > 0 ? '₹' + parseInt(lumpSumInr, 10).toLocaleString('en-IN') + ' lump + ' : ''}
                  ₹{parseInt(monthlySipInr, 10).toLocaleString('en-IN')}/mo × 12)
                </span>
              )}
            </div>
          )}

          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Goal / Context (optional)
            </label>
            <textarea
              value={goalStatement}
              onChange={(e) => setGoalStatement(e.target.value)}
              placeholder="e.g. Daughter's UG education target ₹40L by 2034"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Default allocation will be applied based on the risk profile. You can override
              fund-level recommendations on the next screen.
            </p>
            <button
              type="submit"
              disabled={submitting || !selectedFamily}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating Draft…' : 'Create Draft → Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
