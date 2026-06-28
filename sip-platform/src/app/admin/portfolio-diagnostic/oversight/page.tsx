/**
 * PD Oversight — admin management of reviewer → subject assignments.
 *
 * Lets an admin decide who can VIEW + HELP whom in the Portfolio Diagnostic,
 * independent of the HR reporting tree (e.g. CA Ishika ↔ her 13 salespeople).
 * Backed by /api/admin/portfolio-diagnostic/oversight (pd_review_assignments).
 *
 * Route: /admin/portfolio-diagnostic/oversight  (admin-only)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Plus, X, Users, Loader2, Info } from 'lucide-react';

interface Person { employeeId: number; name: string; roleName: string; }
interface Assignment { reviewerEmployeeId: number; subjectEmployeeId: number; note: string | null; }

export default function OversightPage() {
  const [reviewers, setReviewers] = useState<Person[]>([]);
  const [subjects, setSubjects] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<number | null>(null);
  const [addSubjectId, setAddSubjectId] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/oversight', { credentials: 'include' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error ?? `HTTP ${res.status}`);
        return;
      }
      const d = await res.json();
      setReviewers(d.reviewers ?? []);
      setSubjects(d.subjects ?? []);
      setAssignments(d.assignments ?? []);
      setSelectedReviewer((prev) => prev ?? (d.reviewers?.[0]?.employeeId ?? null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const nameOf = (id: number) => subjects.find((s) => s.employeeId === id)?.name
    ?? reviewers.find((r) => r.employeeId === id)?.name ?? `#${id}`;

  const mySubjects = useMemo(
    () => assignments.filter((a) => a.reviewerEmployeeId === selectedReviewer),
    [assignments, selectedReviewer]
  );

  // Subjects available to add (not self, not already assigned).
  const addable = useMemo(() => {
    const taken = new Set(mySubjects.map((a) => a.subjectEmployeeId));
    return subjects
      .filter((s) => s.employeeId !== selectedReviewer && !taken.has(s.employeeId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, mySubjects, selectedReviewer]);

  async function addAssignment() {
    if (!selectedReviewer || !addSubjectId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/oversight', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmployeeId: selectedReviewer, subjectEmployeeId: Number(addSubjectId) }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error ?? 'Failed to add'); return; }
      setAddSubjectId('');
      await load();
    } finally { setBusy(false); }
  }

  async function removeAssignment(subjectEmployeeId: number) {
    if (!selectedReviewer) return;
    if (!confirm(`Stop ${nameOf(selectedReviewer)} from overseeing ${nameOf(subjectEmployeeId)}?`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/oversight', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmployeeId: selectedReviewer, subjectEmployeeId }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error ?? 'Failed to remove'); return; }
      await load();
    } finally { setBusy(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error:</strong> {error}
        <div className="mt-2"><Link href="/admin/portfolio-diagnostic" className="text-rose-700 underline">← Back to PD</Link></div>
      </div>
    );
  }

  const assignmentCount = (id: number) => assignments.filter((a) => a.reviewerEmployeeId === id).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/portfolio-diagnostic" className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
            <Shield className="h-6 w-6" /> PD Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Decide who can <strong>view &amp; help</strong> whom in the Portfolio Diagnostic — independent of the HR reporting line.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          This only <strong>widens</strong> visibility — it never hides a person from their own manager or from super-admins
          (Ram &amp; Sangeeta always see everything). Use it for central helpers like CA Ishika. Removing an assignment takes
          effect immediately.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reviewers list */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">Reviewers</div>
          <ul className="divide-y divide-slate-100 max-h-[28rem] overflow-auto">
            {reviewers.map((r) => (
              <li key={r.employeeId}>
                <button
                  onClick={() => setSelectedReviewer(r.employeeId)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center justify-between ${selectedReviewer === r.employeeId ? 'bg-primary-50' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="font-medium text-slate-900 block truncate">{r.name}</span>
                    <span className="text-[11px] text-slate-500 capitalize">{r.roleName.replace('_', ' ')}</span>
                  </span>
                  {assignmentCount(r.employeeId) > 0 && (
                    <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2 py-0.5">
                      {assignmentCount(r.employeeId)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Selected reviewer's subjects */}
        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">
              {selectedReviewer ? `${nameOf(selectedReviewer)} can view & help:` : 'Select a reviewer'}
            </span>
          </div>

          {selectedReviewer && (
            <div className="p-4 space-y-3">
              {/* Add */}
              <div className="flex items-center gap-2">
                <select
                  value={addSubjectId}
                  onChange={(e) => setAddSubjectId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Add a person to oversee…</option>
                  {addable.map((s) => (
                    <option key={s.employeeId} value={s.employeeId}>
                      {s.name} ({s.roleName.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <button
                  onClick={addAssignment}
                  disabled={!addSubjectId || busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                </button>
              </div>

              {/* Current */}
              {mySubjects.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">
                  No one assigned yet. This reviewer only sees their own work (+ direct reports, per their role).
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                  {mySubjects
                    .slice()
                    .sort((a, b) => nameOf(a.subjectEmployeeId).localeCompare(nameOf(b.subjectEmployeeId)))
                    .map((a) => (
                      <li key={a.subjectEmployeeId} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-slate-800">{nameOf(a.subjectEmployeeId)}</span>
                        <button
                          onClick={() => removeAssignment(a.subjectEmployeeId)}
                          disabled={busy}
                          title="Remove"
                          className="text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded p-1 disabled:opacity-40"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
