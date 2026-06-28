'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Form state
  const [salutation, setSalutation] = useState('Mr');
  const [first_name, setFirstName] = useState('');
  const [middle_name, setMiddleName] = useState('');
  const [last_name, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'O' | 'U'>('U');
  const [dob, setDob] = useState('');
  const [mobile_primary, setMobile] = useState('');
  const [email_primary, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar_full12, setAadhaar] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [whatsapp_opt_in, setWhatsappOptIn] = useState(false);
  const [sms_opt_in, setSmsOptIn] = useState(false);
  const [email_opt_in, setEmailOptIn] = useState(false);
  const [marketing_opt_in, setMarketingOptIn] = useState(false);
  const [notes, setNotes] = useState('');

  function reset() {
    setSalutation('Mr');
    setFirstName(''); setMiddleName(''); setLastName('');
    setGender('U'); setDob('');
    setMobile(''); setEmail(''); setPan(''); setAadhaar('');
    setCity(''); setState('');
    setWhatsappOptIn(false); setSmsOptIn(false); setEmailOptIn(false); setMarketingOptIn(false);
    setNotes(''); setErr(null); setMsg(null);
  }

  async function submit() {
    setErr(null); setMsg(null);
    if (!first_name.trim() || !last_name.trim()) {
      setErr('First and last name are mandatory.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/client-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salutation, first_name, middle_name: middle_name || null, last_name,
          gender, dob: dob || null,
          mobile_primary: mobile_primary || null,
          email_primary: email_primary || null,
          pan: pan ? pan.toUpperCase() : null,
          aadhaar_full12: aadhaar_full12 || null,
          addr_current_city: city || null,
          addr_current_state: state || null,
          whatsapp_opt_in, sms_opt_in, email_opt_in, marketing_opt_in,
          consent_source: 'manual entry — admin UI',
          notes: notes || null,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setMsg(`✓ Created ${j.client.display_name} (${j.client.code}).`);
      router.refresh();
      setTimeout(() => { reset(); setOpen(false); }, 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => { reset(); setOpen(true); }} style={btnPrimary}>+ New client</button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && !busy && setOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF,#06B6D4)', color: '#fff', fontSize: 15, fontWeight: 800, position: 'sticky', top: 0 }}>
              New client
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 10, opacity: 0.8 }}>
                Only the name is mandatory. Everything else can be filled progressively.
              </span>
            </div>
            <div style={{ padding: 22 }}>
              <Row>
                <Field label="Salutation" w={90}>
                  <select value={salutation} onChange={(e) => setSalutation(e.target.value)} style={input}>
                    <option>Mr</option><option>Mrs</option><option>Ms</option>
                    <option>Miss</option><option>Dr</option><option>Prof</option><option>—</option>
                  </select>
                </Field>
                <Field label="First name *">
                  <input value={first_name} onChange={(e) => setFirstName(e.target.value)} style={input} />
                </Field>
                <Field label="Middle">
                  <input value={middle_name} onChange={(e) => setMiddleName(e.target.value)} style={input} />
                </Field>
                <Field label="Last name *">
                  <input value={last_name} onChange={(e) => setLastName(e.target.value)} style={input} />
                </Field>
              </Row>
              <Row>
                <Field label="Gender" w={110}>
                  <select value={gender} onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'O' | 'U')} style={input}>
                    <option value="U">Unspecified</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </Field>
                <Field label="Date of birth" w={160}>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={input} />
                </Field>
                <Field label="Mobile (primary)">
                  <input value={mobile_primary} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9xxxxxxxxx" style={input} />
                </Field>
              </Row>
              <Row>
                <Field label="Email (primary)">
                  <input value={email_primary} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={input} />
                </Field>
              </Row>
              <Row>
                <Field label="PAN" w={180}>
                  <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} style={input} />
                </Field>
                <Field label="Aadhaar (12 digits — last-4 + hash stored only)">
                  <input value={aadhaar_full12} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="full 12 digits" maxLength={12} style={input} />
                </Field>
              </Row>
              <Row>
                <Field label="City">
                  <input value={city} onChange={(e) => setCity(e.target.value)} style={input} />
                </Field>
                <Field label="State">
                  <input value={state} onChange={(e) => setState(e.target.value)} style={input} />
                </Field>
              </Row>
              <div style={{ marginTop: 12, marginBottom: 8, padding: 10, background: '#FEF3C7', borderRadius: 8, fontSize: 11, color: '#92400E' }}>
                <b>DPDPA consent</b> — tick only what the client agreed to. Each change is recorded in the consent log with timestamp + your user ID for audit.
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                <Check label="WhatsApp" v={whatsapp_opt_in} onChange={setWhatsappOptIn} />
                <Check label="SMS" v={sms_opt_in} onChange={setSmsOptIn} />
                <Check label="Email" v={email_opt_in} onChange={setEmailOptIn} />
                <Check label="Marketing" v={marketing_opt_in} onChange={setMarketingOptIn} />
              </div>
              <Field label="Notes (optional)">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...input, minHeight: 50, fontFamily: 'inherit' }} placeholder="e.g. 'Referred by Sanjay Patel, interested in family floater health.'" />
              </Field>
              {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>✗ {err}</div>}
              {msg && <div style={{ padding: 10, background: '#ECFDF5', color: '#065F46', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{msg}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => !busy && setOpen(false)} disabled={busy} style={btnGhost}>Cancel</button>
                <button onClick={submit} disabled={busy} style={btnPrimary}>
                  {busy ? 'Creating…' : '+ Create client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>{children}</div>;
}
function Field({ label, w, children }: { label: string; w?: number; children: React.ReactNode }) {
  return (
    <div style={{ flex: w ? `0 0 ${w}px` : 1, minWidth: 130 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#475569', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
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
const btnPrimary: React.CSSProperties = { padding: '8px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { padding: '8px 18px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
