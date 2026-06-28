'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ClientGender,
  MaritalStatus,
  ResidentialStatus,
  RiskProfile,
  ClientStatus,
} from '@/lib/client-master/types';

interface ClientSlice {
  id: number;
  salutation: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: ClientGender;
  dob: string | null;
  marital_status: MaritalStatus;

  pan: string | null;
  aadhaar_last4: string | null;

  mobile_primary: string | null;
  mobile_alt: string | null;
  email_primary: string | null;
  email_alt: string | null;

  addr_current_line1: string | null;
  addr_current_line2: string | null;
  addr_current_city: string | null;
  addr_current_state: string | null;
  addr_current_pincode: string | null;
  addr_current_country: string;

  residential_status: ResidentialStatus;
  occupation: string | null;
  employer: string | null;
  annual_income_band: string | null;
  risk_profile: RiskProfile;

  whatsapp_opt_in: boolean;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  marketing_opt_in: boolean;

  preferred_language: string;
  tags: string | null;
  notes: string | null;
  status: ClientStatus;
}

interface Props {
  client: ClientSlice;
  canEditKyc: boolean;
}

export default function EditClientButton({ client, canEditKyc }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<ClientSlice & { aadhaar_full12: string }>({
    ...client,
    aadhaar_full12: '',
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      // Build patch — only send fields that actually changed.
      const patch: Record<string, unknown> = {};
      const keys: (keyof ClientSlice)[] = [
        'salutation', 'first_name', 'middle_name', 'last_name',
        'gender', 'dob', 'marital_status',
        'mobile_primary', 'mobile_alt', 'email_primary', 'email_alt',
        'addr_current_line1', 'addr_current_line2', 'addr_current_city',
        'addr_current_state', 'addr_current_pincode', 'addr_current_country',
        'residential_status', 'occupation', 'employer',
        'annual_income_band', 'risk_profile',
        'whatsapp_opt_in', 'sms_opt_in', 'email_opt_in', 'marketing_opt_in',
        'preferred_language', 'tags', 'notes', 'status',
      ];
      for (const k of keys) {
        if (form[k] !== client[k]) patch[k] = form[k];
      }
      if (canEditKyc) {
        if (form.pan !== client.pan) patch.pan = form.pan;
        if (form.aadhaar_full12.trim()) patch.aadhaar_full12 = form.aadhaar_full12.trim();
      }
      if (Object.keys(patch).length === 0) {
        setMsg('No changes to save.');
        return;
      }
      const r = await fetch(`/api/admin/client-master/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setMsg('✓ Saved.');
      router.refresh();
      setTimeout(() => setOpen(false), 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerBtn}>✎ Edit</button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && !busy && setOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 880, width: '100%', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF,#06B6D4)', color: '#fff', fontSize: 15, fontWeight: 800, position: 'sticky', top: 0, zIndex: 1 }}>
              Edit client — {client.first_name} {client.last_name}
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 10, opacity: 0.85 }}>
                Changes go to the audit log
              </span>
            </div>
            <div style={{ padding: 22 }}>
              <Section title="Name & identity">
                <Row>
                  <Field label="Salutation" w={90}>
                    <select value={form.salutation || ''} onChange={(e) => set('salutation', e.target.value || null)} style={input}>
                      <option value="">—</option>
                      <option>Mr</option><option>Mrs</option><option>Ms</option>
                      <option>Miss</option><option>Dr</option><option>Prof</option>
                    </select>
                  </Field>
                  <Field label="First name">
                    <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} style={input} />
                  </Field>
                  <Field label="Middle">
                    <input value={form.middle_name || ''} onChange={(e) => set('middle_name', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Last name">
                    <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} style={input} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Gender" w={130}>
                    <select value={form.gender} onChange={(e) => set('gender', e.target.value as ClientGender)} style={input}>
                      <option value="U">Unspecified</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </Field>
                  <Field label="DOB" w={160}>
                    <input type="date" value={form.dob || ''} onChange={(e) => set('dob', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Marital status" w={160}>
                    <select value={form.marital_status} onChange={(e) => set('marital_status', e.target.value as MaritalStatus)} style={input}>
                      <option value="unknown">Unknown</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                    </select>
                  </Field>
                </Row>
              </Section>

              <Section title="Contact">
                <Row>
                  <Field label="Mobile (primary)">
                    <input value={form.mobile_primary || ''} onChange={(e) => set('mobile_primary', e.target.value || null)} placeholder="+919xxxxxxxxx" style={input} />
                  </Field>
                  <Field label="Mobile (alt)">
                    <input value={form.mobile_alt || ''} onChange={(e) => set('mobile_alt', e.target.value || null)} style={input} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Email (primary)">
                    <input value={form.email_primary || ''} onChange={(e) => set('email_primary', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Email (alt)">
                    <input value={form.email_alt || ''} onChange={(e) => set('email_alt', e.target.value || null)} style={input} />
                  </Field>
                </Row>
              </Section>

              {canEditKyc && (
                <Section title="Identity & KYC (admin only)" tint="#FEF3C7">
                  <Row>
                    <Field label="PAN" w={200}>
                      <input value={form.pan || ''} onChange={(e) => set('pan', e.target.value.toUpperCase() || null)} maxLength={10} placeholder="ABCDE1234F" style={input} />
                    </Field>
                    <Field label={`Aadhaar (only when changing — current ends in ${form.aadhaar_last4 || '—'})`}>
                      <input value={form.aadhaar_full12} onChange={(e) => setForm((f) => ({ ...f, aadhaar_full12: e.target.value.replace(/\D/g, '').slice(0, 12) }))} maxLength={12} placeholder="leave blank to keep" style={input} />
                    </Field>
                  </Row>
                </Section>
              )}

              <Section title="Address — current">
                <Row>
                  <Field label="Line 1">
                    <input value={form.addr_current_line1 || ''} onChange={(e) => set('addr_current_line1', e.target.value || null)} style={input} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Line 2">
                    <input value={form.addr_current_line2 || ''} onChange={(e) => set('addr_current_line2', e.target.value || null)} style={input} />
                  </Field>
                </Row>
                <Row>
                  <Field label="City" w={200}>
                    <input value={form.addr_current_city || ''} onChange={(e) => set('addr_current_city', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="State" w={160}>
                    <input value={form.addr_current_state || ''} onChange={(e) => set('addr_current_state', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Pincode" w={100}>
                    <input value={form.addr_current_pincode || ''} onChange={(e) => set('addr_current_pincode', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Country" w={120}>
                    <input value={form.addr_current_country} onChange={(e) => set('addr_current_country', e.target.value)} style={input} />
                  </Field>
                </Row>
              </Section>

              <Section title="Profile">
                <Row>
                  <Field label="Residential status" w={170}>
                    <select value={form.residential_status} onChange={(e) => set('residential_status', e.target.value as ResidentialStatus)} style={input}>
                      <option value="resident">Resident</option>
                      <option value="nri">NRI</option>
                      <option value="foreign_national">Foreign National</option>
                      <option value="pio">PIO</option>
                      <option value="oci">OCI</option>
                    </select>
                  </Field>
                  <Field label="Risk profile" w={160}>
                    <select value={form.risk_profile} onChange={(e) => set('risk_profile', e.target.value as RiskProfile)} style={input}>
                      <option value="unknown">Unknown</option>
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </Field>
                  <Field label="Status" w={140}>
                    <select value={form.status} onChange={(e) => set('status', e.target.value as ClientStatus)} style={input}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="dormant">Dormant</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Occupation">
                    <input value={form.occupation || ''} onChange={(e) => set('occupation', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Employer">
                    <input value={form.employer || ''} onChange={(e) => set('employer', e.target.value || null)} style={input} />
                  </Field>
                  <Field label="Income band" w={140}>
                    <input value={form.annual_income_band || ''} onChange={(e) => set('annual_income_band', e.target.value || null)} placeholder="e.g. 10L-25L" style={input} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Tags (comma-separated)">
                    <input value={form.tags || ''} onChange={(e) => set('tags', e.target.value || null)} style={input} />
                  </Field>
                </Row>
              </Section>

              <Section title="DPDPA consent" tint="#FEF3C7">
                <div style={{ fontSize: 11, color: '#92400E', marginBottom: 8 }}>
                  Each change is logged with timestamp + your user id for audit.
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Check label="WhatsApp" v={form.whatsapp_opt_in} onChange={(b) => set('whatsapp_opt_in', b)} />
                  <Check label="SMS" v={form.sms_opt_in} onChange={(b) => set('sms_opt_in', b)} />
                  <Check label="Email" v={form.email_opt_in} onChange={(b) => set('email_opt_in', b)} />
                  <Check label="Marketing" v={form.marketing_opt_in} onChange={(b) => set('marketing_opt_in', b)} />
                </div>
              </Section>

              <Section title="Notes">
                <Field label="Free-text notes">
                  <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value || null)} rows={3} style={{ ...input, minHeight: 70, fontFamily: 'inherit' }} />
                </Field>
              </Section>

              {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>✗ {err}</div>}
              {msg && <div style={{ padding: 10, background: '#ECFDF5', color: '#065F46', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => !busy && setOpen(false)} disabled={busy} style={btnGhost}>Cancel</button>
                <button onClick={save} disabled={busy} style={btnPrimary}>
                  {busy ? 'Saving…' : '✓ Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children, tint }: { title: string; children: React.ReactNode; tint?: string }) {
  return (
    <div style={{ marginBottom: 14, padding: 12, background: tint || '#F8FAFC', borderRadius: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>{children}</div>;
}
function Field({ label, w, children }: { label: string; w?: number; children: React.ReactNode }) {
  return (
    <div style={{ flex: w ? `0 0 ${w}px` : 1, minWidth: 130 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
function Check({ label, v, onChange }: { label: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#475569', cursor: 'pointer' }}>
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}
const input: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' };
const triggerBtn: React.CSSProperties = { padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { padding: '8px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { padding: '8px 18px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
