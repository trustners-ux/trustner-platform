'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { FALLBACK_OFFICES, type Office } from '@/lib/hr/offices';

export default function NewInvitePage() {
  const router = useRouter();
  const [data, setData] = useState({
    entity: 'TIB',
    candidate_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    office_code: '',
    date_of_joining: '',
    employment_type: 'permanent' as 'permanent' | 'fixed_term' | 'intern' | 'consultant',
    probation_months: 6,
  });
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    fetch('/api/employee/hr/offices').then((r) => r.json()).then((j) => { if (j.offices?.length) setOffices(j.offices); });
  }, []);

  const send = async () => {
    if (!data.candidate_name || !data.email) {
      alert('Candidate name and email required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/employee/hr/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(`Failed: ${j.error}`);
        return;
      }
      setLink(j.link);
    } finally {
      setSending(false);
    }
  };

  if (link) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-emerald-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Invite Sent!</h1>
          <p className="text-sm text-slate-500 mb-5">
            {data.phone ? 'WhatsApp invite sent to ' + data.phone + '.' : ''}
            {' Share this link with the candidate:'}
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <input value={link} readOnly className="flex-1 bg-transparent text-xs font-mono outline-none" />
            <button
              onClick={() => { navigator.clipboard.writeText(link); }}
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="flex gap-2 justify-center">
            <Link href="/employee/hr/onboarding" className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to List
            </Link>
            <button
              onClick={() => { setLink(''); setData({ entity: 'TIB', candidate_name: '', email: '', phone: '', designation: '', department: '', office_code: '', date_of_joining: '', employment_type: 'permanent', probation_months: 6 }); }}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/onboarding" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900">New Onboarding Invite</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <p className="text-xs text-slate-500 mb-4">
          A tokenized link will be sent to the candidate&apos;s WhatsApp (if phone provided) and shown here for you to copy/email.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Entity *</label>
            <select value={data.entity} onChange={(e) => setData({ ...data, entity: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="TIB">TIB — Insurance Broking</option>
              <option value="TAS">TAS — Mutual Fund Distribution</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employment Type *</label>
            <select
              value={data.employment_type}
              onChange={(e) => setData({ ...data, employment_type: e.target.value as typeof data.employment_type })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="permanent">Probationary Employee → Permanent (full-time)</option>
              <option value="fixed_term">Fixed-Term Contract (probation + 1-3 yr term)</option>
              <option value="intern">Intern (stipend, no probation, no leave entitlement)</option>
              <option value="consultant">Consultant (professional services, no PF/ESI)</option>
            </select>
            <p className="mt-1 text-[10px] text-slate-500">Sets the contract shape. Permanent + Fixed-term hires begin on probation. Interns &amp; consultants are confirmed from Day 1.</p>
          </div>
          {(data.employment_type === 'permanent' || data.employment_type === 'fixed_term') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Probation Period (months)</label>
              <input
                type="number"
                min={0}
                max={24}
                value={data.probation_months}
                onChange={(e) => setData({ ...data, probation_months: Math.max(0, Math.min(24, Number(e.target.value) || 0)) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <p className="mt-1 text-[10px] text-slate-500">Default <b>6 months</b>. Admin can extend or confirm early any time. During probation no EL/SL/CL accrual; only LOP allowed.</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Joining</label>
            <input type="date" value={data.date_of_joining} onChange={(e) => setData({ ...data, date_of_joining: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Candidate Name *</label>
            <input value={data.candidate_name} onChange={(e) => setData({ ...data, candidate_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email *</label>
            <input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="candidate@example.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone (for WhatsApp)</label>
            <input type="tel" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="10 digits" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
            <input value={data.designation} onChange={(e) => setData({ ...data, designation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <input value={data.department} onChange={(e) => setData({ ...data, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Office</label>
            <select value={data.office_code} onChange={(e) => setData({ ...data, office_code: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="">— Select office —</option>
              {offices.map((o) => <option key={o.code} value={o.code}>{o.shortLabel}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/employee/hr/onboarding" className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</Link>
        <button onClick={send} disabled={sending} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Generate Invite
        </button>
      </div>
    </div>
  );
}
