'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Loader2, FileText, ExternalLink } from 'lucide-react';

interface EduRow { qualification?: string; institution?: string; board?: string; year?: string; score?: string; }
interface EmpRow { company?: string; designation?: string; fromDate?: string; toDate?: string; lastCTC?: string; reason?: string; }
interface EmergencyContact { name?: string; relationship?: string; mobile?: string; email?: string; }

interface Onboarding {
  id: number;
  token: string;
  entity: 'TAS' | 'TIB';
  candidate_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  office_code: string | null;
  status: string;
  date_of_joining: string | null;
  related_party_yn: boolean | null;
  related_party_details: string | null;
  other_intermediary_yn: boolean | null;
  other_intermediary_details: string | null;
  changes_requested_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  employee_id: number | null;
  created_at: string;
  // Candidate-supplied intake
  father_spouse_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  marital_status?: string | null;
  whatsapp?: string | null;
  reporting_manager?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  curr_address_line1?: string | null; curr_address_line2?: string | null;
  curr_city?: string | null; curr_state?: string | null; curr_pin?: string | null;
  perm_same?: boolean | null;
  perm_address_line1?: string | null; perm_address_line2?: string | null;
  perm_city?: string | null; perm_state?: string | null; perm_pin?: string | null;
  bank_name?: string | null; bank_branch?: string | null; account_number?: string | null;
  ifsc?: string | null; account_type?: string | null;
  education?: EduRow[] | null;
  is_fresher?: boolean | null;
  employment?: EmpRow[] | null;
  emergency_contacts?: EmergencyContact[] | null;
  nda_agreed_at?: string | null;
  declaration_agreed_at?: string | null;
  coi_agreed_at?: string | null;
}

interface Doc {
  id: number;
  category: string;
  filename: string;
  blob_url?: string;
  uploaded_at: string;
  status: string;
}

export default function OnboardingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [onb, setOnb] = useState<Onboarding | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState('');

  const load = () => {
    // The admin list gives us the row + token; the public token GET returns the
    // full self-filled record + documents. (The token GET 409s once approved/
    // rejected — in that case we still render the list row so the page isn't blank.)
    fetch(`/api/employee/hr/onboarding`)
      .then((r) => r.json())
      .then((j) => {
        const row = (j.rows || []).find((r: { id: number }) => r.id === Number(id));
        if (!row) return;
        fetch(`/api/onboarding/${row.token}`)
          .then((r2) => r2.json())
          .then((j2) => {
            if (j2.onboarding) {
              setOnb({ ...row, ...j2.onboarding });
              setDocs(j2.documents || []);
            } else {
              setOnb(row);
              setDocs([]);
            }
          })
          .catch(() => { setOnb(row); setDocs([]); });
      });
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const act = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (action !== 'approve' && !note.trim()) {
      alert('Please provide a note explaining the action.');
      return;
    }
    setActing(true);
    try {
      const res = await fetch('/api/employee/hr/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), action, note }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(`Failed: ${j.error}`);
        return;
      }
      if (action === 'approve' && j.employee_id) {
        router.push(`/employee/hr/employees/${j.employee_id}`);
        return;
      }
      load();
    } finally {
      setActing(false);
    }
  };

  if (!onb) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/employee/hr/onboarding" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{onb.candidate_name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{onb.entity} · {onb.designation || '—'} · DOJ {onb.date_of_joining || '—'}</p>
          </div>
        </div>
        <a href={`/onboarding/${onb.token}`} target="_blank" rel="noopener" className="text-sm text-brand font-semibold inline-flex items-center gap-1 hover:underline">
          Open candidate link <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><div className="text-[10px] uppercase font-bold text-slate-500">Status</div><div className="font-bold text-slate-900">{onb.status.replace(/_/g, ' ')}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-slate-500">Email</div><div>{onb.email}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-slate-500">Phone</div><div>{onb.phone || '—'}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-slate-500">Created</div><div>{new Date(onb.created_at).toLocaleDateString('en-IN')}</div></div>
        </div>
      </div>

      {/* Candidate-provided details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Candidate-Provided Details</h2>

        <Block title="Personal & KYC">
          <KV label="Father's / Spouse's Name" value={onb.father_spouse_name} />
          <KV label="Date of Birth" value={onb.dob} />
          <KV label="Gender" value={onb.gender} />
          <KV label="Blood Group" value={onb.blood_group} />
          <KV label="Marital Status" value={onb.marital_status} />
          <KV label="WhatsApp" value={onb.whatsapp} />
          <KV label="Reporting Manager" value={onb.reporting_manager} />
          <KV label="PAN" value={onb.pan} />
          <KV label="Aadhaar" value={onb.aadhaar} />
        </Block>

        <Block title="Current Address">
          <KV label="Line 1" value={onb.curr_address_line1} />
          <KV label="Line 2" value={onb.curr_address_line2} />
          <KV label="City" value={onb.curr_city} />
          <KV label="State" value={onb.curr_state} />
          <KV label="PIN" value={onb.curr_pin} />
        </Block>

        <Block title="Permanent Address">
          {onb.perm_same ? (
            <div className="text-sm text-slate-600 italic">Same as current address.</div>
          ) : (
            <>
              <KV label="Line 1" value={onb.perm_address_line1} />
              <KV label="Line 2" value={onb.perm_address_line2} />
              <KV label="City" value={onb.perm_city} />
              <KV label="State" value={onb.perm_state} />
              <KV label="PIN" value={onb.perm_pin} />
            </>
          )}
        </Block>

        <Block title="Bank Details">
          <KV label="Bank" value={onb.bank_name} />
          <KV label="Branch" value={onb.bank_branch} />
          <KV label="Account Number" value={onb.account_number} />
          <KV label="IFSC" value={onb.ifsc} />
          <KV label="Account Type" value={onb.account_type} />
        </Block>

        {/* Education */}
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Education History</div>
          {(onb.education?.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-400 italic">Not provided.</p>
          ) : (
            <div className="space-y-1.5">
              {onb.education!.map((e, i) => (
                <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                  <b>{e.qualification || '—'}</b> · {e.institution || '—'} · {e.board || '—'} · {e.year || '—'} · {e.score || '—'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employment */}
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Employment History</div>
          {onb.is_fresher ? (
            <p className="text-sm text-slate-700">Fresher (first job).</p>
          ) : (onb.employment?.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-400 italic">Not provided.</p>
          ) : (
            <div className="space-y-1.5">
              {onb.employment!.map((e, i) => (
                <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                  <b>{e.company || '—'}</b> · {e.designation || '—'} · {e.fromDate || '—'} → {e.toDate || '—'}
                  {e.lastCTC ? ` · CTC ${e.lastCTC}` : ''}{e.reason ? ` · ${e.reason}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency contacts */}
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Emergency Contacts</div>
          {(onb.emergency_contacts?.filter((c) => c.name || c.mobile).length ?? 0) === 0 ? (
            <p className="text-xs text-slate-400 italic">Not provided.</p>
          ) : (
            <div className="space-y-1.5">
              {onb.emergency_contacts!.filter((c) => c.name || c.mobile).map((c, i) => (
                <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                  <b>{c.name || '—'}</b> ({c.relationship || '—'}) · {c.mobile || '—'}{c.email ? ` · ${c.email}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consents */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
          <Consent label="NDA" at={onb.nda_agreed_at} />
          <Consent label="Declaration" at={onb.declaration_agreed_at} />
          <Consent label="COI / Code of Conduct" at={onb.coi_agreed_at} />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          Documents ({docs.length})
        </h2>
        {docs.length === 0 ? (
          <p className="text-xs text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-2 p-2.5 rounded border border-slate-200">
                <FileText className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 uppercase">{d.category.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-slate-500 truncate">{d.filename}</div>
                </div>
                {d.blob_url && (
                  <a href={`/api/employee/hr/onboarding/document/${d.id}`} target="_blank" rel="noopener" className="text-[11px] text-brand font-semibold hover:underline">View</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Declarations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Candidate Declarations</h2>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Related-party POSP / agent / advisor?</div>
            <div className="font-semibold text-slate-900">
              {onb.related_party_yn === null ? '—' : onb.related_party_yn ? 'YES' : 'No'}
            </div>
            {onb.related_party_details && <div className="text-xs text-slate-600 italic mt-1">{onb.related_party_details}</div>}
          </div>
          {onb.entity === 'TIB' && (
            <div>
              <div className="text-xs text-slate-500">Other intermediary code held?</div>
              <div className="font-semibold text-slate-900">
                {onb.other_intermediary_yn === null ? '—' : onb.other_intermediary_yn ? 'YES' : 'No'}
              </div>
              {onb.other_intermediary_details && <div className="text-xs text-slate-600 italic mt-1">{onb.other_intermediary_details}</div>}
            </div>
          )}
        </div>
      </div>

      {/* HR action */}
      {['submitted', 'under_review', 'changes_requested', 'in_progress'].includes(onb.status) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">HR Action</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the candidate (required for Reject / Request Changes)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-3"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => act('approve')}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve &amp; Create Employee
            </button>
            <button
              onClick={() => act('request_changes')}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              Request Changes
            </button>
            <button
              onClick={() => act('reject')}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {onb.status === 'approved' && onb.employee_id && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
          ✅ Approved by {onb.reviewed_by} on {new Date(onb.reviewed_at!).toLocaleString('en-IN')}.{' '}
          <Link href={`/employee/hr/employees/${onb.employee_id}`} className="font-bold underline">Open employee record →</Link>
        </div>
      )}
    </div>
  );
}

// ── Review display helpers ──────────────────────────────────────────
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">{children}</div>
    </div>
  );
}
function KV({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value && String(value).trim() ? value : '—'}</div>
    </div>
  );
}
function Consent({ label, at }: { label: string; at?: string | null }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      at ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
    }`}>
      {at ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}{at ? ` · ${new Date(at).toLocaleDateString('en-IN')}` : ' · not signed'}
    </span>
  );
}
