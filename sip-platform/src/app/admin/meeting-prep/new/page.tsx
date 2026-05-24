/**
 * Meeting Prep — New Draft
 *
 * Single-page intake: family + meeting context. Auto-pulls portfolio
 * snapshot from the family's latest published Portfolio Diagnostic
 * (server-side). Routes to /edit on success.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Search, AlertTriangle, MapPin } from 'lucide-react';

const MEETING_PURPOSES = [
  'Quarterly Review',
  'Annual Review',
  'New Investment Discussion',
  'SIP Step-Up',
  'Grievance / Concern',
  'Onboarding Kickoff',
  'Retention Conversation',
  'Family Wealth Planning',
  'Other',
] as const;

const MEETING_FORMATS = ['In-Person', 'Phone', 'Video', 'WhatsApp'] as const;

interface Family {
  id: number;
  familyName: string;
  segment?: string;
  totalAumInr?: number;
  primaryContactName?: string;
  primaryContactMobile?: string;
}

function defaultMeetingDateTime(): string {
  // Default to tomorrow 11:00 AM IST in datetime-local format
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewMeetingPrepPage() {
  const router = useRouter();
  const [familyQuery, setFamilyQuery] = useState('');
  const [familyResults, setFamilyResults] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [searching, setSearching] = useState(false);

  const [meetingScheduledAt, setMeetingScheduledAt] = useState(defaultMeetingDateTime());
  const [meetingFormat, setMeetingFormat] = useState<(typeof MEETING_FORMATS)[number]>('In-Person');
  const [meetingPurpose, setMeetingPurpose] = useState<(typeof MEETING_PURPOSES)[number]>('Quarterly Review');
  const [customPurposeNote, setCustomPurposeNote] = useState('');
  const [meetingDurationMinutes, setMeetingDurationMinutes] = useState('60');
  const [meetingLocation, setMeetingLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!meetingScheduledAt) {
      setError('Please set a meeting date and time.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/meeting-prep/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: selectedFamily.id,
          familyName: selectedFamily.familyName,
          // Convert datetime-local to ISO (browser local TZ → UTC)
          meetingScheduledAt: new Date(meetingScheduledAt).toISOString(),
          meetingFormat,
          meetingPurpose,
          customPurposeNote: customPurposeNote || undefined,
          meetingDurationMinutes: parseInt(meetingDurationMinutes, 10) || 60,
          meetingLocation: meetingLocation || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create brief');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/meeting-prep/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/meeting-prep"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="rounded-lg bg-brand-50 p-2.5 flex-shrink-0">
            <Calendar className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">New Meeting Brief</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Capture the meeting context now. Talking points, action items, and
              opportunities are filled in on the edit screen — portfolio snapshot
              auto-pulls from the latest diagnostic.
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
                {searching && <div className="text-xs text-slate-500 mt-1">Searching…</div>}
              </div>
            )}
          </div>

          {/* Date + Duration + Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Date &amp; Time <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={meetingScheduledAt}
                onChange={(e) => setMeetingScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                step={15}
                value={meetingDurationMinutes}
                onChange={(e) => setMeetingDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Format <span className="text-red-600">*</span>
              </label>
              <select
                value={meetingFormat}
                onChange={(e) => setMeetingFormat(e.target.value as (typeof MEETING_FORMATS)[number])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              >
                {MEETING_FORMATS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Purpose <span className="text-red-600">*</span>
            </label>
            <select
              value={meetingPurpose}
              onChange={(e) => setMeetingPurpose(e.target.value as (typeof MEETING_PURPOSES)[number])}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
            >
              {MEETING_PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          {meetingPurpose === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Specify Purpose
              </label>
              <input
                type="text"
                value={customPurposeNote}
                onChange={(e) => setCustomPurposeNote(e.target.value)}
                placeholder="e.g. Estate planning follow-up, NRI tax discussion…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {/* Location (only for in-person) */}
          {meetingFormat === 'In-Person' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="e.g. Trustner office / Client home / Café Coffee Day, Andheri"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Portfolio snapshot (AUM, XIRR, SIPs) auto-fills from the family&apos;s latest
              published diagnostic.
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
