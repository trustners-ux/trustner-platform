'use client';

/**
 * My Profile — employee views their own master record.
 * Most fields are read-only. Whitelisted fields (address, phone, marital
 * status) are editable by the employee themselves; HR controls the rest.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, Save, Loader2, Lock, CheckCircle2 } from 'lucide-react';

interface Profile {
  id: number;
  employee_code: string;
  entity: string;
  full_name: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  department: string | null;
  grade_band: string | null;
  office_code: string | null;
  date_of_joining: string | null;
  email: string;
  phone: string | null;
  status: string;
  pan: string | null;
  aadhaar_last4: string | null;
  bank_branch: string | null;
  ifsc: string | null;
  current_address: string | null;
  permanent_address: string | null;
  city: string | null;
  state: string | null;
  pin: string | null;
  dob: string | null;
  gender: string | null;
  marital_status: string | null;
  reporting_manager_name: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState({
    current_address: '', permanent_address: '', city: '', state: '', pin: '',
    phone: '', marital_status: '',
  });

  const load = () => {
    fetch('/api/employee/hr/me').then((r) => r.json()).then((j) => {
      if (j.profile) {
        setProfile(j.profile);
        setDraft({
          current_address: j.profile.current_address ?? '',
          permanent_address: j.profile.permanent_address ?? '',
          city: j.profile.city ?? '',
          state: j.profile.state ?? '',
          pin: j.profile.pin ?? '',
          phone: j.profile.phone ?? '',
          marital_status: j.profile.marital_status ?? '',
        });
      }
    });
  };
  useEffect(load, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/employee/hr/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || 'Failed');
        return;
      }
      setMsg('✓ Saved');
      setEditing(false);
      load();
    } finally { setSaving(false); }
  };

  if (!profile) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const Field = ({ label, value, locked = true }: { label: string; value: string | null; locked?: boolean }) => (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
        {label}
        {locked && <Lock className="w-2.5 h-2.5" />}
      </div>
      <div className="text-sm font-semibold text-slate-900 mt-0.5">{value || <span className="text-slate-400 font-normal italic">—</span>}</div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/employee/hr/me" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        {!editing && (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Edit3 className="w-4 h-4" /> Edit my details
          </button>
        )}
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 mb-1">My Profile</h1>
      <p className="text-xs text-slate-500 mb-5">
        <Lock className="w-3 h-3 inline mr-1" />
        Locked fields are HR-controlled. Contact wecare@trustner.in for corrections.
      </p>

      {/* Identity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Identity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Employee Code" value={profile.employee_code} />
          <Field label="Entity" value={profile.entity} />
          <Field label="Status" value={profile.status} />
          <Field label="Full Name" value={profile.full_name} />
          <Field label="DOB" value={profile.dob} />
          <Field label="Gender" value={profile.gender} />
        </div>
      </div>

      {/* Role */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Designation" value={profile.designation} />
          <Field label="Department" value={profile.department} />
          <Field label="Grade / Band" value={profile.grade_band} />
          <Field label="Reporting Manager" value={profile.reporting_manager_name} />
          <Field label="Date of Joining" value={profile.date_of_joining} />
          <Field label="Office Code" value={profile.office_code} />
        </div>
      </div>

      {/* Editable section — contact + address */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Contact &amp; Address</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone</label>
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marital Status</label>
              <select value={draft.marital_status} onChange={(e) => setDraft({ ...draft, marital_status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                <option value="">—</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Address</label>
              <textarea value={draft.current_address} onChange={(e) => setDraft({ ...draft, current_address: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Permanent Address</label>
              <textarea value={draft.permanent_address} onChange={(e) => setDraft({ ...draft, permanent_address: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label><input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label><input value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PIN</label><input value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              {msg && <span className={`text-xs self-center mr-auto ${msg.startsWith('✓') ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>{msg}</span>}
              <button onClick={() => { setEditing(false); setMsg(''); }} className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" value={profile.email} />
            <Field label="Phone" value={profile.phone} locked={false} />
            <Field label="Marital Status" value={profile.marital_status} locked={false} />
            <div></div>
            <div className="sm:col-span-2"><Field label="Current Address" value={profile.current_address} locked={false} /></div>
            <div className="sm:col-span-2"><Field label="Permanent Address" value={profile.permanent_address} locked={false} /></div>
            <Field label="City" value={profile.city} locked={false} />
            <Field label="State" value={profile.state} locked={false} />
            <Field label="PIN" value={profile.pin} locked={false} />
            {msg && (
              <div className="sm:col-span-2 text-emerald-700 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {msg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KYC + Bank — locked */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">KYC &amp; Bank</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="PAN" value={profile.pan} />
          <Field label="Aadhaar (last 4)" value={profile.aadhaar_last4} />
          <Field label="Bank &amp; Branch" value={profile.bank_branch} />
          <Field label="IFSC" value={profile.ifsc} />
        </div>
      </div>
    </div>
  );
}
