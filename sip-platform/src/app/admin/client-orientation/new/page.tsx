/**
 * Client Orientation — New Draft
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Search, AlertTriangle } from 'lucide-react';

interface Family {
  id: number;
  familyName: string;
  segment?: string;
  totalAumInr?: number;
  primaryContactName?: string;
  primaryContactMobile?: string;
}

export default function NewClientOrientationPage() {
  const router = useRouter();
  const [familyQuery, setFamilyQuery] = useState('');
  const [familyResults, setFamilyResults] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [monthlyIncomeInr, setMonthlyIncomeInr] = useState('');
  const [monthlyExpensesInr, setMonthlyExpensesInr] = useState('');
  const [numDependents, setNumDependents] = useState('0');
  const [prefChannel, setPrefChannel] = useState('Email');
  const [prefReviewFrequency, setPrefReviewFrequency] = useState('Half-Yearly');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchFamilies(q: string) {
    setFamilyQuery(q);
    if (q.length < 2) {
      setFamilyResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/portfolio-diagnostic/families?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setFamilyResults(data.families ?? []);
      }
    } catch {
      // silent
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedFamily) {
      setError('Please select a client family.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/client-orientation/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: selectedFamily.id,
          familyName: selectedFamily.familyName,
          monthlyHouseholdIncomeInr: parseInt(monthlyIncomeInr, 10) || undefined,
          monthlyHouseholdExpensesInr: parseInt(monthlyExpensesInr, 10) || undefined,
          numDependents: parseInt(numDependents, 10) || 0,
          prefChannel,
          prefReviewFrequency,
          prefLanguage: 'English',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create draft');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/client-orientation/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/client-orientation"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="rounded-lg bg-brand-50 p-2.5 flex-shrink-0">
            <UserPlus className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">New Client Orientation</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Onboarding pack — risk profile, cash flow, goals. After draft, you fill the
              8-question risk questionnaire and capture financial goals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Family */}
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
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFamily(null)}
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
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cash flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Monthly Income (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={monthlyIncomeInr}
                onChange={(e) => setMonthlyIncomeInr(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Monthly Expenses (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={monthlyExpensesInr}
                onChange={(e) => setMonthlyExpensesInr(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                # Dependents
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={numDependents}
                onChange={(e) => setNumDependents(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Preferred Channel
              </label>
              <select
                value={prefChannel}
                onChange={(e) => setPrefChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                <option>Email</option>
                <option>WhatsApp</option>
                <option>Phone</option>
                <option>In-Person</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Review Frequency
              </label>
              <select
                value={prefReviewFrequency}
                onChange={(e) => setPrefReviewFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                <option>Quarterly</option>
                <option>Half-Yearly</option>
                <option>Annual</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Risk profile + goals are captured in the editor after draft creation.
            </p>
            <button
              type="submit"
              disabled={submitting || !selectedFamily}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Draft…' : 'Create Draft → Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
