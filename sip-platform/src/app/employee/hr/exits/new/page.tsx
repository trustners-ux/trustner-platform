'use client';

/**
 * Phase 8 — Create new separation case.
 *
 * On submit: POST /api/employee/hr/exits → redirect to /employee/hr/exits/:id
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ArrowLeft, Loader2, Search } from 'lucide-react';

interface EmployeeOption {
  id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
  notice_period_days_contractual?: number | null;
}

const SEPARATION_TYPES: { value: string; label: string }[] = [
  { value: 'resignation',                 label: 'Resignation' },
  { value: 'termination_with_cause',      label: 'Termination — with cause' },
  { value: 'termination_without_cause',   label: 'Termination — without cause' },
  { value: 'retirement',                  label: 'Retirement' },
  { value: 'death',                       label: 'Death' },
  { value: 'permanent_disability',        label: 'Permanent disability' },
  { value: 'contract_end',                label: 'End of contract' },
  { value: 'abandonment',                 label: 'Abandonment' },
  { value: 'mutual_separation',           label: 'Mutual separation' },
];

const REASON_PRIMARY: { value: string; label: string }[] = [
  { value: 'better_opportunity',  label: 'Better opportunity' },
  { value: 'compensation',        label: 'Compensation' },
  { value: 'work_life_balance',   label: 'Work-life balance' },
  { value: 'growth',              label: 'Growth' },
  { value: 'manager',             label: 'Manager / team fit' },
  { value: 'role_fit',            label: 'Role fit' },
  { value: 'relocation',          label: 'Relocation' },
  { value: 'family',              label: 'Family / personal' },
  { value: 'health',              label: 'Health' },
  { value: 'misconduct',          label: 'Misconduct (HR)' },
  { value: 'performance',         label: 'Performance (HR)' },
  { value: 'redundancy',          label: 'Redundancy / restructure' },
  { value: 'other',               label: 'Other' },
];

const TERMINATION_GROUNDS = [
  'misconduct', 'fraud', 'performance', 'redundancy', 'policy_breach', 'integrity_failure', 'other',
];

export default function NewSeparationPage() {
  const router = useRouter();

  // Employee picker state
  const [empQuery, setEmpQuery] = useState('');
  const [empOptions, setEmpOptions] = useState<EmployeeOption[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeOption | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [separationType, setSeparationType] = useState<string>('resignation');
  const [intentDate, setIntentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [requestedLwd, setRequestedLwd] = useState<string>('');
  const [noticeDays, setNoticeDays] = useState<number>(60);
  const [reasonPrimary, setReasonPrimary] = useState<string>('');
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [terminationGround, setTerminationGround] = useState<string>('');
  const [misconductFlag, setMisconductFlag] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTermination = separationType.startsWith('termination_');

  // Employee search
  useEffect(() => {
    if (!empQuery || empQuery.length < 2) {
      setEmpOptions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/employee/hr/employees?q=${encodeURIComponent(empQuery)}&status=active`)
        .then((r) => r.json())
        .then((j) => setEmpOptions((j.rows || []).slice(0, 8)))
        .catch(() => setEmpOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [empQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!dropRef.current) return;
      if (!dropRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // When employee chosen, default notice period from their contract
  useEffect(() => {
    if (selectedEmp?.notice_period_days_contractual != null) {
      setNoticeDays(selectedEmp.notice_period_days_contractual);
    }
  }, [selectedEmp]);

  // Auto-compute requested LWD = intentDate + noticeDays
  useEffect(() => {
    if (!intentDate || noticeDays == null) return;
    const d = new Date(intentDate);
    d.setDate(d.getDate() + Number(noticeDays || 0));
    setRequestedLwd(d.toISOString().slice(0, 10));
  }, [intentDate, noticeDays]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEmp) { setError('Pick an employee.'); return; }
    if (!intentDate) { setError('Intent date is required.'); return; }
    if (!reasonPrimary) { setError('Pick a primary reason.'); return; }
    if (isTermination && !terminationGround) { setError('Termination ground is required.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/employee/hr/exits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          separation_type: separationType,
          intent_date: intentDate,
          requested_lwd: requestedLwd,
          notice_period_days_contractual: noticeDays,
          reason_category: reasonPrimary,
          reason_notes: reasonNotes || null,
          termination_ground: isTermination ? terminationGround : null,
          misconduct_flag: misconductFlag,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Failed to create case');
        setSubmitting(false);
        return;
      }
      router.push(`/employee/hr/exits/${j.id || j.row?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/employee/hr/exits" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
          <ArrowLeft className="w-3 h-3" /> Back to Exits
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">New Separation</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Seed the case → checklist + F&amp;F workflow auto-spawn.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* Employee picker */}
        <div ref={dropRef} className="relative">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee *</label>
          {selectedEmp ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <div>
                <div className="text-sm font-medium text-slate-900">{selectedEmp.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {selectedEmp.employee_code} · {selectedEmp.designation || '—'}
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedEmp(null); setEmpQuery(''); }} className="text-xs text-slate-500 hover:text-rose-600 font-medium">
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search name, code or email…"
                  value={empQuery}
                  onChange={(e) => { setEmpQuery(e.target.value); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none"
                />
              </div>
              {showDrop && empOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {empOptions.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => { setSelectedEmp(e); setShowDrop(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="text-sm font-medium text-slate-900">{e.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{e.employee_code} · {e.designation || '—'}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Separation type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Separation Type *</label>
            <select value={separationType} onChange={(e) => setSeparationType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              {SEPARATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Intent / Resignation Date *</label>
            <input type="date" required value={intentDate} onChange={(e) => setIntentDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notice Period (days)</label>
            <input
              type="number"
              min={0}
              value={noticeDays}
              onChange={(e) => setNoticeDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Default from employee contract; HR may override.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Intended Last Working Day</label>
            <input
              type="date"
              value={requestedLwd}
              onChange={(e) => setRequestedLwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">Auto-computed = intent + notice.</p>
          </div>
        </div>

        {/* Reasons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason — Primary *</label>
            <select value={reasonPrimary} onChange={(e) => setReasonPrimary(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="">— Pick reason —</option>
              {REASON_PRIMARY.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {isTermination && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Termination Ground *</label>
              <select value={terminationGround} onChange={(e) => setTerminationGround(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                <option value="">— Pick ground —</option>
                {TERMINATION_GROUNDS.map((g) => (
                  <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason — Secondary / Notes</label>
          <textarea
            value={reasonNotes}
            onChange={(e) => setReasonNotes(e.target.value)}
            rows={3}
            placeholder="Optional context — kept internal to HR + founders."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={misconductFlag}
            onChange={(e) => setMisconductFlag(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          Flag this case for misconduct review (affects gratuity, relieving, bonus clauses).
        </label>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Case
          </button>
          <Link href="/employee/hr/exits" className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
