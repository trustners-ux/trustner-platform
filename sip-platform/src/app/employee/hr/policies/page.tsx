'use client';

/**
 * Policy Documents — Employee Handbook + all HR policies.
 *
 * This is where Ram drops in the Employee Handbook (and the 92 DOCX
 * templates from the HR redesign brief). Categorized into 12 buckets.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Trash2, Loader2, Download, BookOpen, ShieldCheck } from 'lucide-react';

interface Policy {
  id: number;
  category: string;
  title: string;
  description: string | null;
  doc_code: string | null;
  version: string;
  effective_date: string | null;
  blob_url: string;
  filename: string;
  size_bytes: number | null;
  entities: string[];
  requires_acknowledgement: boolean;
  created_at: string;
}

const CATEGORIES: Array<{ key: string; label: string; icon: string }> = [
  { key: 'foundational',         label: 'A · Foundational',           icon: '📘' },
  { key: 'hiring_onboarding',    label: 'B · Hiring & Onboarding',    icon: '📝' },
  { key: 'compensation_benefits',label: 'C · Compensation',           icon: '💰' },
  { key: 'attendance_leave',     label: 'D · Attendance & Leave',     icon: '📆' },
  { key: 'performance_growth',   label: 'E · Performance',            icon: '📈' },
  { key: 'conduct_ethics',       label: 'F · Conduct & Ethics',       icon: '⚖️' },
  { key: 'data_it_security',     label: 'G · Data & IT Security',     icon: '🔐' },
  { key: 'disciplinary',         label: 'H · Disciplinary',           icon: '🚨' },
  { key: 'separation',           label: 'I · Separation',             icon: '👋' },
  { key: 'statutory',            label: 'J · Statutory & Regulatory', icon: '🏛️' },
  { key: 'engagement',           label: 'K · Engagement & Culture',   icon: '🎉' },
  { key: 'governance',           label: 'L · Governance',             icon: '🏢' },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState('');

  // Upload form state
  const [up, setUp] = useState({
    file: null as File | null,
    title: '',
    category: 'foundational',
    doc_code: '',
    version: '1.0',
    description: '',
    effective_date: '',
    requires_acknowledgement: false,
  });
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/policies')
      .then((r) => r.json())
      .then((j) => setPolicies(j.policies || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submitUpload = async () => {
    if (!up.file || !up.title) {
      alert('Pick a file and enter a title');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', up.file);
    fd.append('title', up.title);
    fd.append('category', up.category);
    if (up.doc_code) fd.append('doc_code', up.doc_code);
    fd.append('version', up.version || '1.0');
    if (up.description) fd.append('description', up.description);
    if (up.effective_date) fd.append('effective_date', up.effective_date);
    fd.append('requires_acknowledgement', up.requires_acknowledgement ? 'true' : 'false');
    try {
      const res = await fetch('/api/employee/hr/policies', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) {
        alert(`Upload failed: ${j.error}`);
        return;
      }
      setUploadOpen(false);
      setUp({ ...up, file: null, title: '', doc_code: '', description: '' });
      load();
    } finally {
      setUploading(false);
    }
  };

  const remove = async (p: Policy) => {
    if (!confirm(`Archive "${p.title}"? It will no longer appear in the employee view.`)) return;
    await fetch(`/api/employee/hr/policies?id=${p.id}`, { method: 'DELETE' });
    load();
  };

  const visible = filter ? policies.filter((p) => p.category === filter) : policies;
  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: visible.filter((p) => p.category === c.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Policy Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Employee Handbook · 12 categories · {policies.length} document(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button
            onClick={() => setUploadOpen(!uploadOpen)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
          >
            <Upload className="w-4 h-4" />
            Upload Policy
          </button>
        </div>
      </div>

      {/* Upload form */}
      {uploadOpen && (
        <div className="bg-white rounded-xl border-2 border-brand/40 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Upload Policy / Handbook</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">File (PDF or DOCX, max 25 MB)</label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setUp({ ...up, file: e.target.files?.[0] || null })}
                className="w-full text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title *</label>
              <input value={up.title} onChange={(e) => setUp({ ...up, title: e.target.value })} placeholder="Employee Handbook v2" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category *</label>
              <select value={up.category} onChange={(e) => setUp({ ...up, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doc Code (e.g. 01, 38)</label>
              <input value={up.doc_code} onChange={(e) => setUp({ ...up, doc_code: e.target.value })} placeholder="01" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Version</label>
              <input value={up.version} onChange={(e) => setUp({ ...up, version: e.target.value })} placeholder="1.0" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Effective Date</label>
              <input type="date" value={up.effective_date} onChange={(e) => setUp({ ...up, effective_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
              <input value={up.description} onChange={(e) => setUp({ ...up, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={up.requires_acknowledgement}
                  onChange={(e) => setUp({ ...up, requires_acknowledgement: e.target.checked })}
                />
                <span className="text-xs text-slate-700">Require employee acknowledgement on first view</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setUploadOpen(false)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button
              onClick={submitUpload}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Policies grouped by category */}
      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {grouped.length === 0 && !loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          No policies uploaded yet. Click <b>Upload Policy</b> to add the Employee Handbook
          or any of your 92 HR DOCX templates from the redesign brief.
        </div>
      )}

      {grouped.map((g) => (
        <div key={g.key} className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-base">{g.icon}</span>
            {g.label}
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {g.items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {p.doc_code && <span className="font-mono text-xs text-slate-500 mr-2">{p.doc_code}</span>}
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>v{p.version}</span>
                    {p.effective_date && <><span>·</span><span>Eff: {p.effective_date}</span></>}
                    <span>·</span>
                    <span>{p.entities.join(' / ')}</span>
                    {p.requires_acknowledgement && <><span>·</span><span className="text-amber-700 font-bold">requires ack</span></>}
                  </div>
                </div>
                {p.requires_acknowledgement && (
                  <Link
                    href={`/employee/hr/policies/${p.id}/sign`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sign with OTP
                  </Link>
                )}
                <a
                  href={p.blob_url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  View
                </a>
                <button
                  onClick={() => remove(p)}
                  className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                  title="Archive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
