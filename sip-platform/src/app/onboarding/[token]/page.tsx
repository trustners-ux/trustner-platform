'use client';

/**
 * PUBLIC candidate-facing onboarding page.
 * Token is in the URL — no login required. The candidate self-fills their full
 * joining intake (personal, KYC, address, bank, education, employment, emergency
 * contacts), uploads documents, accepts declarations, then submits for HR review.
 *
 * Mirrors the legacy "Trustner Joiner Portal" Google Apps Script form, but data
 * persists to hr_onboarding and flows into hr_employees on HR approval.
 */
import { useEffect, useState, use as usePromise } from 'react';
import { CheckCircle2, Upload, Loader2, AlertCircle, Send, Plus, Trash2, Save } from 'lucide-react';

interface EduRow { qualification: string; institution: string; board: string; year: string; score: string; }
interface EmpRow { company: string; designation: string; fromDate: string; toDate: string; lastCTC: string; reason: string; }
interface EmergencyContact { name: string; relationship: string; mobile: string; email: string; }

interface Onboarding {
  id: number;
  entity: 'TAS' | 'TIB';
  candidate_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  status: string;
  date_of_joining: string | null;
  changes_requested_note: string | null;
  // Personal
  father_spouse_name: string | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  marital_status: string | null;
  whatsapp: string | null;
  reporting_manager: string | null;
  // KYC
  pan: string | null;
  aadhaar: string | null;
  // Address
  curr_address_line1: string | null; curr_address_line2: string | null;
  curr_city: string | null; curr_state: string | null; curr_pin: string | null;
  perm_same: boolean | null;
  perm_address_line1: string | null; perm_address_line2: string | null;
  perm_city: string | null; perm_state: string | null; perm_pin: string | null;
  // Bank
  bank_name: string | null; bank_branch: string | null; account_number: string | null;
  ifsc: string | null; account_type: string | null;
  // History
  education: EduRow[] | null;
  is_fresher: boolean | null;
  employment: EmpRow[] | null;
  emergency_contacts: EmergencyContact[] | null;
  // Declarations
  related_party_yn: boolean | null;
  related_party_details: string | null;
  other_intermediary_yn: boolean | null;
  other_intermediary_details: string | null;
  nda_agreed_at: string | null;
  declaration_agreed_at: string | null;
  coi_agreed_at: string | null;
}

interface Doc { id: number; category: string; filename: string; uploaded_at: string; status: string; }

const REQUIRED_DOCS = [
  { key: 'pan',                          label: 'PAN Card',                            required: true },
  { key: 'aadhaar_front',                label: 'Aadhaar Card (Front)',                required: true },
  { key: 'aadhaar_back',                 label: 'Aadhaar Card (Back)',                 required: true },
  { key: 'photo',                        label: 'Passport-size photo',                 required: true },
  { key: 'cancelled_cheque',             label: 'Cancelled cheque / bank statement',   required: true },
  { key: 'education_10th',               label: '10th certificate',                    required: false },
  { key: 'education_12th',               label: '12th certificate',                    required: false },
  { key: 'education_grad',               label: 'Graduation degree',                   required: false },
  { key: 'education_pg',                 label: 'Post-graduation degree',              required: false },
  { key: 'prior_employment_relieving',   label: 'Previous employer relieving letter',  required: false },
  { key: 'prior_employment_salary_slip', label: 'Last 3 months salary slips',          required: false },
  { key: 'resume',                       label: 'Updated resume',                      required: false },
];

// Scalar fields the candidate edits (keys match hr_onboarding columns).
type ScalarForm = {
  father_spouse_name: string; dob: string; gender: string; blood_group: string;
  marital_status: string; whatsapp: string; reporting_manager: string;
  pan: string; aadhaar: string;
  curr_address_line1: string; curr_address_line2: string; curr_city: string; curr_state: string; curr_pin: string;
  perm_address_line1: string; perm_address_line2: string; perm_city: string; perm_state: string; perm_pin: string;
  bank_name: string; bank_branch: string; account_number: string; ifsc: string; account_type: string;
};
const EMPTY_SCALAR: ScalarForm = {
  father_spouse_name: '', dob: '', gender: '', blood_group: '', marital_status: '', whatsapp: '', reporting_manager: '',
  pan: '', aadhaar: '',
  curr_address_line1: '', curr_address_line2: '', curr_city: '', curr_state: '', curr_pin: '',
  perm_address_line1: '', perm_address_line2: '', perm_city: '', perm_state: '', perm_pin: '',
  bank_name: '', bank_branch: '', account_number: '', ifsc: '', account_type: '',
};
const BLANK_EDU: EduRow = { qualification: '', institution: '', board: '', year: '', score: '' };
const BLANK_EMP: EmpRow = { company: '', designation: '', fromDate: '', toDate: '', lastCTC: '', reason: '' };
const BLANK_EMERGENCY: EmergencyContact = { name: '', relationship: '', mobile: '', email: '' };

export default function CandidateOnboarding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────────
  const [f, setF] = useState<ScalarForm>(EMPTY_SCALAR);
  const [permSame, setPermSame] = useState(false);
  const [education, setEducation] = useState<EduRow[]>([{ ...BLANK_EDU }]);
  const [isFresher, setIsFresher] = useState(false);
  const [employment, setEmployment] = useState<EmpRow[]>([{ ...BLANK_EMP }]);
  const [emergency, setEmergency] = useState<EmergencyContact[]>([{ ...BLANK_EMERGENCY }, { ...BLANK_EMERGENCY }]);
  // Declarations
  const [rpYn, setRpYn] = useState('');
  const [rpDetails, setRpDetails] = useState('');
  const [oiYn, setOiYn] = useState('');
  const [oiDetails, setOiDetails] = useState('');
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [declAgreed, setDeclAgreed] = useState(false);
  const [coiAgreed, setCoiAgreed] = useState(false);

  const set = (k: keyof ScalarForm, v: string) => setF((p) => ({ ...p, [k]: v }));

  const load = () => {
    fetch(`/api/onboarding/${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) { setError(j.error); return; }
        const o: Onboarding = j.onboarding;
        setOnboarding(o);
        setDocs(j.documents ?? []);
        setF({
          father_spouse_name: o.father_spouse_name ?? '', dob: o.dob ?? '', gender: o.gender ?? '',
          blood_group: o.blood_group ?? '', marital_status: o.marital_status ?? '', whatsapp: o.whatsapp ?? '',
          reporting_manager: o.reporting_manager ?? '',
          pan: o.pan ?? '', aadhaar: o.aadhaar ?? '',
          curr_address_line1: o.curr_address_line1 ?? '', curr_address_line2: o.curr_address_line2 ?? '',
          curr_city: o.curr_city ?? '', curr_state: o.curr_state ?? '', curr_pin: o.curr_pin ?? '',
          perm_address_line1: o.perm_address_line1 ?? '', perm_address_line2: o.perm_address_line2 ?? '',
          perm_city: o.perm_city ?? '', perm_state: o.perm_state ?? '', perm_pin: o.perm_pin ?? '',
          bank_name: o.bank_name ?? '', bank_branch: o.bank_branch ?? '', account_number: o.account_number ?? '',
          ifsc: o.ifsc ?? '', account_type: o.account_type ?? '',
        });
        setPermSame(!!o.perm_same);
        setEducation(o.education?.length ? o.education : [{ ...BLANK_EDU }]);
        setIsFresher(!!o.is_fresher);
        setEmployment(o.employment?.length ? o.employment : [{ ...BLANK_EMP }]);
        const ec = o.emergency_contacts ?? [];
        setEmergency([ec[0] ?? { ...BLANK_EMERGENCY }, ec[1] ?? { ...BLANK_EMERGENCY }]);
        if (o.related_party_yn !== null) setRpYn(o.related_party_yn ? 'yes' : 'no');
        if (o.related_party_details) setRpDetails(o.related_party_details);
        if (o.other_intermediary_yn !== null) setOiYn(o.other_intermediary_yn ? 'yes' : 'no');
        if (o.other_intermediary_details) setOiDetails(o.other_intermediary_details);
        setNdaAgreed(!!o.nda_agreed_at);
        setDeclAgreed(!!o.declaration_agreed_at);
        setCoiAgreed(!!o.coi_agreed_at);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const buildBody = () => {
    const perm = permSame
      ? {
          perm_same: true,
          perm_address_line1: f.curr_address_line1, perm_address_line2: f.curr_address_line2,
          perm_city: f.curr_city, perm_state: f.curr_state, perm_pin: f.curr_pin,
        }
      : {
          perm_same: false,
          perm_address_line1: f.perm_address_line1, perm_address_line2: f.perm_address_line2,
          perm_city: f.perm_city, perm_state: f.perm_state, perm_pin: f.perm_pin,
        };
    return {
      father_spouse_name: f.father_spouse_name, dob: f.dob || null, gender: f.gender,
      blood_group: f.blood_group, marital_status: f.marital_status, whatsapp: f.whatsapp,
      reporting_manager: f.reporting_manager,
      pan: f.pan, aadhaar: f.aadhaar,
      curr_address_line1: f.curr_address_line1, curr_address_line2: f.curr_address_line2,
      curr_city: f.curr_city, curr_state: f.curr_state, curr_pin: f.curr_pin,
      ...perm,
      bank_name: f.bank_name, bank_branch: f.bank_branch, account_number: f.account_number,
      ifsc: f.ifsc, account_type: f.account_type,
      education: education.filter((e) => e.qualification || e.institution),
      is_fresher: isFresher,
      employment: isFresher ? [] : employment.filter((e) => e.company || e.designation),
      emergency_contacts: emergency.filter((e) => e.name || e.mobile),
      related_party_yn: rpYn === 'yes',
      related_party_details: rpYn === 'yes' ? rpDetails : null,
      other_intermediary_yn: oiYn === 'yes',
      other_intermediary_details: oiYn === 'yes' ? oiDetails : null,
      nda_agreed: ndaAgreed,
      declaration_agreed: declAgreed,
      coi_agreed: coiAgreed,
    };
  };

  const saveProgress = async (silent = false) => {
    if (!silent) setSaving(true);
    try {
      await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildBody(), status: 'in_progress' }),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const upload = async (category: string, file: File) => {
    setUploadingFor(category);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    try {
      const res = await fetch(`/api/onboarding/${token}/upload`, { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) { alert(`Upload failed: ${j.error || res.status}`); return; }
      load();
    } finally {
      setUploadingFor(null);
    }
  };

  const submitFinal = async () => {
    if (!confirm('Submit your onboarding for HR review? You can still update details until HR approves.')) return;
    setSubmitting(true);
    try {
      await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildBody(), status: 'submitted' }),
      });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Onboarding Link Issue</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <p className="text-xs text-slate-400 mt-4">Need help? Email <a href="mailto:wecare@trustner.in" className="text-brand">wecare@trustner.in</a></p>
        </div>
      </div>
    );
  }
  if (!onboarding) return null;

  const locked = onboarding.status === 'submitted' || onboarding.status === 'under_review';
  const docsByCategory = new Map(docs.map((d) => [d.category, d]));
  const allRequiredUploaded = REQUIRED_DOCS.filter((d) => d.required).every((d) => docsByCategory.has(d.key));
  const declarationsComplete = rpYn && (onboarding.entity !== 'TIB' || oiYn) && ndaAgreed && declAgreed && coiAgreed;
  const coreComplete = !!(f.pan && f.curr_address_line1 && f.curr_city && f.curr_pin && f.bank_name && f.account_number && f.ifsc);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <div className="inline-block bg-brand text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Trustner {onboarding.entity}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3">Welcome, {onboarding.candidate_name}!</h1>
          <p className="text-sm text-slate-600 mt-2">
            Position: <b>{onboarding.designation || '—'}</b>{onboarding.date_of_joining ? ` · DOJ: ${onboarding.date_of_joining}` : ''}
          </p>
        </div>

        {/* Status banner */}
        <div className={`rounded-xl p-4 mb-6 ${
          locked ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : onboarding.status === 'changes_requested' ? 'bg-amber-50 border border-amber-200 text-amber-900'
            : 'bg-blue-50 border border-blue-200 text-blue-900'
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1">Status: {onboarding.status.replace(/_/g, ' ')}</div>
          {onboarding.status === 'changes_requested' && onboarding.changes_requested_note && (
            <p className="text-sm">HR has requested: {onboarding.changes_requested_note}</p>
          )}
          {locked && <p className="text-sm">Your submission is with HR. We&apos;ll reach out shortly.</p>}
          {(onboarding.status === 'invited' || onboarding.status === 'in_progress') && (
            <p className="text-sm">Fill in your details, upload the documents below, and submit when ready. Your progress is saved.</p>
          )}
        </div>

        {/* ── Personal details ── */}
        <Section title="Personal Details">
          <Grid>
            <Field label="Full Name"><ReadOnly>{onboarding.candidate_name}</ReadOnly></Field>
            <Input label="Father's / Spouse's Name" value={f.father_spouse_name} onChange={(v) => set('father_spouse_name', v)} disabled={locked} />
            <Input label="Date of Birth" type="date" value={f.dob} onChange={(v) => set('dob', v)} disabled={locked} />
            <Select label="Gender" value={f.gender} onChange={(v) => set('gender', v)} disabled={locked} options={['Male', 'Female', 'Other']} />
            <Select label="Blood Group" value={f.blood_group} onChange={(v) => set('blood_group', v)} disabled={locked} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
            <Select label="Marital Status" value={f.marital_status} onChange={(v) => set('marital_status', v)} disabled={locked} options={['Single', 'Married', 'Other']} />
            <Field label="Email"><ReadOnly>{onboarding.email}</ReadOnly></Field>
            <Field label="Mobile"><ReadOnly>{onboarding.phone || '—'}</ReadOnly></Field>
            <Input label="WhatsApp Number" value={f.whatsapp} onChange={(v) => set('whatsapp', v)} disabled={locked} />
          </Grid>
        </Section>

        {/* ── Joining details (HR-set, mostly read-only) ── */}
        <Section title="Joining Details">
          <Grid>
            <Field label="Entity"><ReadOnly>Trustner {onboarding.entity}</ReadOnly></Field>
            <Field label="Date of Joining"><ReadOnly>{onboarding.date_of_joining || '—'}</ReadOnly></Field>
            <Field label="Designation"><ReadOnly>{onboarding.designation || '—'}</ReadOnly></Field>
            <Field label="Department"><ReadOnly>{onboarding.department || '—'}</ReadOnly></Field>
            <Input label="Reporting Manager" value={f.reporting_manager} onChange={(v) => set('reporting_manager', v)} disabled={locked} />
          </Grid>
        </Section>

        {/* ── Identity ── */}
        <Section title="Identity Documents">
          <Grid>
            <Input label="PAN Number" value={f.pan} onChange={(v) => set('pan', v.toUpperCase())} disabled={locked} placeholder="ABCDE1234F" />
            <Input label="Aadhaar Number" value={f.aadhaar} onChange={(v) => set('aadhaar', v)} disabled={locked} placeholder="12-digit Aadhaar" />
          </Grid>
        </Section>

        {/* ── Current address ── */}
        <Section title="Current Address">
          <Grid>
            <Input label="Address Line 1" value={f.curr_address_line1} onChange={(v) => set('curr_address_line1', v)} disabled={locked} wide />
            <Input label="Address Line 2" value={f.curr_address_line2} onChange={(v) => set('curr_address_line2', v)} disabled={locked} wide />
            <Input label="City" value={f.curr_city} onChange={(v) => set('curr_city', v)} disabled={locked} />
            <Input label="State" value={f.curr_state} onChange={(v) => set('curr_state', v)} disabled={locked} />
            <Input label="PIN Code" value={f.curr_pin} onChange={(v) => set('curr_pin', v)} disabled={locked} />
          </Grid>
        </Section>

        {/* ── Permanent address ── */}
        <Section title="Permanent Address">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={permSame} onChange={(e) => setPermSame(e.target.checked)} disabled={locked} />
            <span className="text-sm text-slate-700">Same as current address</span>
          </label>
          {!permSame && (
            <Grid>
              <Input label="Address Line 1" value={f.perm_address_line1} onChange={(v) => set('perm_address_line1', v)} disabled={locked} wide />
              <Input label="Address Line 2" value={f.perm_address_line2} onChange={(v) => set('perm_address_line2', v)} disabled={locked} wide />
              <Input label="City" value={f.perm_city} onChange={(v) => set('perm_city', v)} disabled={locked} />
              <Input label="State" value={f.perm_state} onChange={(v) => set('perm_state', v)} disabled={locked} />
              <Input label="PIN Code" value={f.perm_pin} onChange={(v) => set('perm_pin', v)} disabled={locked} />
            </Grid>
          )}
        </Section>

        {/* ── Bank ── */}
        <Section title="Bank Details">
          <Grid>
            <Input label="Bank Name" value={f.bank_name} onChange={(v) => set('bank_name', v)} disabled={locked} />
            <Input label="Branch" value={f.bank_branch} onChange={(v) => set('bank_branch', v)} disabled={locked} />
            <Input label="Account Number" value={f.account_number} onChange={(v) => set('account_number', v)} disabled={locked} />
            <Input label="IFSC Code" value={f.ifsc} onChange={(v) => set('ifsc', v.toUpperCase())} disabled={locked} />
            <Select label="Account Type" value={f.account_type} onChange={(v) => set('account_type', v)} disabled={locked} options={['Savings', 'Current']} />
          </Grid>
        </Section>

        {/* ── Education history ── */}
        <Section title="Education History">
          {education.map((row, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">Qualification #{i + 1}</span>
                {education.length > 1 && !locked && (
                  <button onClick={() => setEducation(education.filter((_, x) => x !== i))} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <Grid>
                <Input label="Qualification" value={row.qualification} onChange={(v) => setEducation(education.map((r, x) => x === i ? { ...r, qualification: v } : r))} disabled={locked} placeholder="e.g. B.Com" />
                <Input label="Institution" value={row.institution} onChange={(v) => setEducation(education.map((r, x) => x === i ? { ...r, institution: v } : r))} disabled={locked} />
                <Input label="Board / University" value={row.board} onChange={(v) => setEducation(education.map((r, x) => x === i ? { ...r, board: v } : r))} disabled={locked} />
                <Input label="Year of Passing" value={row.year} onChange={(v) => setEducation(education.map((r, x) => x === i ? { ...r, year: v } : r))} disabled={locked} />
                <Input label="Score / %" value={row.score} onChange={(v) => setEducation(education.map((r, x) => x === i ? { ...r, score: v } : r))} disabled={locked} />
              </Grid>
            </div>
          ))}
          {!locked && (
            <button onClick={() => setEducation([...education, { ...BLANK_EDU }])} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:opacity-80"><Plus className="w-4 h-4" /> Add qualification</button>
          )}
        </Section>

        {/* ── Employment history ── */}
        <Section title="Employment History">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={isFresher} onChange={(e) => setIsFresher(e.target.checked)} disabled={locked} />
            <span className="text-sm text-slate-700">I am a fresher (this is my first job)</span>
          </label>
          {!isFresher && (
            <>
              {employment.map((row, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500">Employer #{i + 1}</span>
                    {employment.length > 1 && !locked && (
                      <button onClick={() => setEmployment(employment.filter((_, x) => x !== i))} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <Grid>
                    <Input label="Company" value={row.company} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, company: v } : r))} disabled={locked} />
                    <Input label="Designation" value={row.designation} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, designation: v } : r))} disabled={locked} />
                    <Input label="From" type="date" value={row.fromDate} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, fromDate: v } : r))} disabled={locked} />
                    <Input label="To" type="date" value={row.toDate} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, toDate: v } : r))} disabled={locked} />
                    <Input label="Last CTC (₹/yr)" value={row.lastCTC} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, lastCTC: v } : r))} disabled={locked} />
                    <Input label="Reason for Leaving" value={row.reason} onChange={(v) => setEmployment(employment.map((r, x) => x === i ? { ...r, reason: v } : r))} disabled={locked} wide />
                  </Grid>
                </div>
              ))}
              {!locked && (
                <button onClick={() => setEmployment([...employment, { ...BLANK_EMP }])} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:opacity-80"><Plus className="w-4 h-4" /> Add employer</button>
              )}
            </>
          )}
        </Section>

        {/* ── Emergency contacts ── */}
        <Section title="Emergency Contacts">
          {emergency.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 mb-3">
              <span className="text-xs font-bold text-slate-500">Contact #{i + 1}</span>
              <Grid>
                <Input label="Name" value={c.name} onChange={(v) => setEmergency(emergency.map((r, x) => x === i ? { ...r, name: v } : r))} disabled={locked} />
                <Input label="Relationship" value={c.relationship} onChange={(v) => setEmergency(emergency.map((r, x) => x === i ? { ...r, relationship: v } : r))} disabled={locked} />
                <Input label="Mobile" value={c.mobile} onChange={(v) => setEmergency(emergency.map((r, x) => x === i ? { ...r, mobile: v } : r))} disabled={locked} />
                <Input label="Email" value={c.email} onChange={(v) => setEmergency(emergency.map((r, x) => x === i ? { ...r, email: v } : r))} disabled={locked} />
              </Grid>
            </div>
          ))}
        </Section>

        {/* ── Document upload grid ── */}
        <Section title="Required Documents">
          <p className="text-xs text-slate-500 mb-4">PDF or image (JPG/PNG). Maximum 10 MB per file.</p>
          <div className="space-y-2">
            {REQUIRED_DOCS.map((d) => {
              const uploaded = docsByCategory.get(d.key);
              const isUploading = uploadingFor === d.key;
              return (
                <div key={d.key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      {d.label}
                      {d.required && <span className="text-rose-600 text-xs">*</span>}
                      {uploaded && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    {uploaded && <div className="text-[11px] text-slate-500 mt-0.5">{uploaded.filename}</div>}
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(d.key, file); }}
                      className="hidden" disabled={isUploading || locked} />
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                      uploaded ? 'bg-slate-100 text-slate-700' : 'bg-brand text-white'
                    } ${isUploading ? 'opacity-60' : 'hover:opacity-80'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploaded ? 'Re-upload' : 'Upload'}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Declarations ── */}
        <Section title="Mandatory Declarations">
          <p className="text-xs text-slate-500 mb-4">Required for SEBI/IRDAI compliance and Trustner&apos;s conflict-of-interest framework.</p>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Is any of your relatives engaged with Trustner as a POSP, agent, advisor, or in any other revenue-generating capacity?
            </label>
            <div className="flex gap-3 mb-2">
              {['no', 'yes'].map((v) => (
                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={rpYn === v} onChange={() => setRpYn(v)} disabled={locked} />
                  <span className="text-sm">{v === 'no' ? 'No' : 'Yes — disclose below'}</span>
                </label>
              ))}
            </div>
            {rpYn === 'yes' && (
              <textarea value={rpDetails} onChange={(e) => setRpDetails(e.target.value)} disabled={locked}
                placeholder="Name · Relation · Capacity · POSP code (if any) · Period" rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            )}
          </div>

          {onboarding.entity === 'TIB' && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Do you currently hold any insurance intermediary code (POSP, agent, specified person) with any other entity?
              </label>
              <div className="flex gap-3 mb-2">
                {['no', 'yes'].map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={oiYn === v} onChange={() => setOiYn(v)} disabled={locked} />
                    <span className="text-sm">{v === 'no' ? 'No' : 'Yes — disclose below'}</span>
                  </label>
                ))}
              </div>
              {oiYn === 'yes' && (
                <textarea value={oiDetails} onChange={(e) => setOiDetails(e.target.value)} disabled={locked}
                  placeholder="Entity · Code · Type · Period" rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <Consent checked={ndaAgreed} onChange={setNdaAgreed} disabled={locked}
              text="I agree to the Non-Disclosure obligations and will keep Trustner's confidential and client information secure." />
            <Consent checked={declAgreed} onChange={setDeclAgreed} disabled={locked}
              text="I declare that the information and documents provided above are true and correct to the best of my knowledge." />
            <Consent checked={coiAgreed} onChange={setCoiAgreed} disabled={locked}
              text="I have disclosed any conflict of interest and agree to abide by Trustner's Code of Conduct and COI policy." />
          </div>
        </Section>

        {/* ── Save / Submit ── */}
        {!locked && (
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => saveProgress()} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save progress
            </button>
            {savedAt && <span className="text-xs text-slate-400">Saved at {savedAt}</span>}
          </div>
        )}

        <div className="bg-white rounded-xl border border-brand/30 p-5 text-center">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Ready to Submit?</h2>
          <p className="text-xs text-slate-500 mb-4">
            {coreComplete ? '✅ Core details filled.' : '⚠️ Fill PAN, current address & bank details.'}{' '}
            {allRequiredUploaded ? '✅ Required documents uploaded.' : '⚠️ Some required documents are missing.'}{' '}
            {declarationsComplete ? '✅ Declarations complete.' : '⚠️ Declarations not yet complete.'}
          </p>
          <button onClick={submitFinal}
            disabled={
              submitting ||
              !coreComplete || !allRequiredUploaded || !declarationsComplete ||
              (onboarding.status !== 'invited' && onboarding.status !== 'in_progress' && onboarding.status !== 'changes_requested')
            }
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit for HR Review
          </button>
          {!locked && (!coreComplete || !allRequiredUploaded || !declarationsComplete) && (
            <p className="text-[11px] text-slate-400 mt-2">Complete the required fields, documents, and declarations above to enable submission.</p>
          )}
        </div>

        <div className="text-center mt-6 text-[11px] text-slate-400">
          Trustner {onboarding.entity === 'TIB' ? 'Insurance Brokers' : 'Asset Services'} Pvt. Ltd. ·{' '}
          {onboarding.entity === 'TIB' ? 'IRDAI Licence 1067' : 'ARN-286886'} ·{' '}
          <a href="https://www.merasip.com/privacy" className="underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

// ── Small presentational helpers ───────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
function ReadOnly({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{children}</div>;
}
function Input({ label, value, onChange, disabled, type = 'text', placeholder, wide }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string; placeholder?: string; wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 disabled:text-slate-500" />
    </div>
  );
}
function Select({ label, value, onChange, disabled, options }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; options: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500">
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Consent({ checked, onChange, disabled, text }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; text: string }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="mt-0.5" />
      <span className="text-sm text-slate-700">{text}</span>
    </label>
  );
}
