'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Search, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Result {
  audit_id: number;
  status: 'no_match' | 'flagged_soft' | 'flagged_strong' | 'flagged_hard';
  match_type: string;
  match_score: number;
  matched_label: string;
  recommendation: string;
}

export default function PospCrossCheckPage() {
  const [candidate, setCandidate] = useState({ pan: '', name: '', mobile: '', aadhaar_last4: '', dob: '', address: '' });
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!candidate.name) {
      alert('Name is required at minimum');
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/employee/hr/posp-crosscheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(`Failed: ${j.error}`);
        return;
      }
      setResult(j.result);
    } finally {
      setRunning(false);
    }
  };

  const statusBg: Record<string, string> = {
    no_match:        'bg-emerald-50 border-emerald-200 text-emerald-900',
    flagged_soft:    'bg-amber-50 border-amber-200 text-amber-900',
    flagged_strong:  'bg-orange-50 border-orange-200 text-orange-900',
    flagged_hard:    'bg-rose-50 border-rose-200 text-rose-900',
  };

  const statusIcon: Record<string, React.ReactNode> = {
    no_match:       <CheckCircle2 className="w-5 h-5" />,
    flagged_soft:   <AlertTriangle className="w-5 h-5" />,
    flagged_strong: <AlertTriangle className="w-5 h-5" />,
    flagged_hard:   <XCircle className="w-5 h-5" />,
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/compliance" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Compliance
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">POSP Cross-Check</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Run before issuing any POSP code. Catches related-party arrangements and dual-coding by employees.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Candidate Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PAN (most reliable)</label>
            <input value={candidate.pan} onChange={(e) => setCandidate({ ...candidate, pan: e.target.value.toUpperCase() })} placeholder="AAAAA0000A" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile</label>
            <input value={candidate.mobile} onChange={(e) => setCandidate({ ...candidate, mobile: e.target.value })} placeholder="10 digits" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
            <input value={candidate.name} onChange={(e) => setCandidate({ ...candidate, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aadhaar (last 4)</label>
            <input value={candidate.aadhaar_last4} onChange={(e) => setCandidate({ ...candidate, aadhaar_last4: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DOB</label>
            <input type="date" value={candidate.dob} onChange={(e) => setCandidate({ ...candidate, dob: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address (for fuzzy comparison)</label>
            <input value={candidate.address} onChange={(e) => setCandidate({ ...candidate, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Run Cross-Check
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl border-2 p-5 ${statusBg[result.status]}`}>
          <div className="flex items-start gap-3">
            {statusIcon[result.status]}
            <div className="flex-1">
              <div className="text-xs uppercase font-bold tracking-wider mb-1">
                {result.status === 'no_match' ? '✓ CLEAR' : '⚠️ FLAGGED'} · {result.match_type} · {result.match_score}% match
              </div>
              <div className="text-sm font-bold mb-2">{result.matched_label}</div>
              <div className="text-sm leading-relaxed">{result.recommendation}</div>
              <div className="text-[11px] mt-3 opacity-70">
                Audit log ID: <span className="font-mono">{result.audit_id}</span> · This check has been logged for compliance review.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
