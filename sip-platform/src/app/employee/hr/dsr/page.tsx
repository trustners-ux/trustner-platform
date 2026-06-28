'use client';

/**
 * DSR (Daily Sales Report) — employee submission.
 * Handbook §15: every Sales/Channel role up to CDM submits this each
 * working day. Self-certification mandatory.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, CheckCircle2, Loader2, AlertTriangle, Clock, Save } from 'lucide-react';

interface Entry {
  id: number;
  entry_date: string;
  meetings_planned: number;
  meetings_done: number;
  calls_made: number;
  new_leads_added: number;
  business_proposed_inr: number;
  business_booked_inr: number;
  premium_collected_inr: number;
  aum_added_inr: number;
  highlights: string | null;
  obstacles: string | null;
  tomorrow_plan: string | null;
  status: string;
  is_late: boolean;
  submitted_at: string;
  manager_reviewed_by: string | null;
  manager_notes: string | null;
}

interface Bundle {
  entries: Entry[];
  required: boolean;
  eod_deadline?: string;
  certification_text: string;
}

const STATUS_COLOR: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewed:  'bg-emerald-100 text-emerald-800',
  flagged:   'bg-rose-100 text-rose-800',
  rejected:  'bg-slate-200 text-slate-700',
};

export default function DsrPage() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const todayIso = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    entry_date: todayIso,
    meetings_planned: '',
    meetings_done: '',
    calls_made: '',
    new_leads_added: '',
    business_proposed_inr: '',
    business_booked_inr: '',
    premium_collected_inr: '',
    aum_added_inr: '',
    highlights: '',
    obstacles: '',
    tomorrow_plan: '',
    certified_genuine: false,
  });

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/dsr?scope=mine&days=14')
      .then((r) => r.json())
      .then(setBundle)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const todaysEntry = bundle?.entries.find((e) => e.entry_date === todayIso);

  const submit = async () => {
    if (!form.certified_genuine) {
      setMsg('You must tick the integrity certification to submit.');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch('/api/employee/hr/dsr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || 'Failed');
        return;
      }
      setMsg(j.is_late ? '⚠ Submitted but past EOD deadline' : '✅ DSR submitted');
      load();
    } finally { setSubmitting(false); }
  };

  const inr = (v: number) => v ? '₹ ' + Math.round(Number(v)).toLocaleString('en-IN') : '—';

  if (loading || !bundle) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/me" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Daily Sales Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Handbook §15 · EOD deadline {bundle.eod_deadline?.slice(0, 5) || '20:00'}
          </p>
        </div>
      </div>

      {!bundle.required && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-900 flex gap-2">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            DSR is not currently required for your grade. You may still submit one
            voluntarily — useful for portfolio reviews + appraisal evidence.
          </div>
        </div>
      )}

      {/* Today's submission */}
      {todaysEntry ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
              Today&apos;s DSR submitted{todaysEntry.is_late ? ' (late)' : ''}
            </h2>
          </div>
          <p className="text-sm text-emerald-900">
            Submitted at {new Date(todaysEntry.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.
            Status: <b>{todaysEntry.status}</b>.
            {todaysEntry.manager_notes && <span className="block mt-1 italic">Manager: {todaysEntry.manager_notes}</span>}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Submit Today&apos;s DSR</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meetings Planned</label><input type="number" value={form.meetings_planned} onChange={(e) => setForm({ ...form, meetings_planned: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meetings Done</label><input type="number" value={form.meetings_done} onChange={(e) => setForm({ ...form, meetings_done: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Calls Made</label><input type="number" value={form.calls_made} onChange={(e) => setForm({ ...form, calls_made: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Leads</label><input type="number" value={form.new_leads_added} onChange={(e) => setForm({ ...form, new_leads_added: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Business Proposed (₹)</label><input type="number" value={form.business_proposed_inr} onChange={(e) => setForm({ ...form, business_proposed_inr: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Business Booked (₹)</label><input type="number" value={form.business_booked_inr} onChange={(e) => setForm({ ...form, business_booked_inr: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Premium (TIB) (₹)</label><input type="number" value={form.premium_collected_inr} onChange={(e) => setForm({ ...form, premium_collected_inr: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">AUM Added (TAS) (₹)</label><input type="number" value={form.aum_added_inr} onChange={(e) => setForm({ ...form, aum_added_inr: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Today&apos;s Highlights</label><textarea rows={2} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="Key wins, customer feedback, breakthroughs…" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Obstacles / Help Needed</label><textarea rows={2} value={form.obstacles} onChange={(e) => setForm({ ...form, obstacles: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="Where you got stuck; what would unblock you" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tomorrow&apos;s Plan</label><textarea rows={2} value={form.tomorrow_plan} onChange={(e) => setForm({ ...form, tomorrow_plan: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="Top 3 priorities for next working day" /></div>
          </div>

          {/* Mandatory integrity certification */}
          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-amber-300 bg-amber-50 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={form.certified_genuine}
              onChange={(e) => setForm({ ...form, certified_genuine: e.target.checked })}
              className="mt-1"
            />
            <span className="text-xs text-amber-900 leading-relaxed">
              <b className="text-sm">Integrity Certification —</b><br />
              {bundle.certification_text}
            </span>
          </label>

          <div className="flex justify-end gap-2">
            {msg && <span className={`text-xs self-center mr-auto ${msg.startsWith('✅') ? 'text-emerald-700 font-bold' : msg.startsWith('⚠') ? 'text-amber-700 font-bold' : 'text-rose-700'}`}>{msg}</span>}
            <button onClick={submit} disabled={submitting || !form.certified_genuine} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Submit DSR
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-slate-700">
          Recent Submissions
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Meetings</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Leads</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Booked</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {bundle.entries.map((e, i) => (
              <tr key={e.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-3 py-2 font-mono text-xs">{e.entry_date}</td>
                <td className="px-3 py-2 text-right text-xs">{e.meetings_done}/{e.meetings_planned}</td>
                <td className="px-3 py-2 text-right text-xs">{e.new_leads_added}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{inr(e.business_booked_inr)}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[e.status]}`}>{e.status}</span>
                  {e.is_late && <AlertTriangle className="w-3 h-3 text-amber-600 inline ml-1" />}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {new Date(e.submitted_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {bundle.entries.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">No DSR submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
