'use client';

import { useState } from 'react';

type Step = 'enter-id' | 'enter-otp' | 'done';

export default function LoginForm() {
  const [step, setStep] = useState<Step>('enter-id');
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string | null>(null);

  async function sendOtp() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/portal/auth/login-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId.trim() }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.reason || `HTTP ${r.status}`);
        return;
      }
      setMaskedTarget(j.login_id_masked || null);
      setStep('enter-otp');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setBusy(false); }
  }

  async function verifyOtp() {
    setBusy(true); setErr(null);
    if (!/^\d{6}$/.test(otp)) { setErr('Enter the 6-digit code.'); setBusy(false); return; }
    try {
      const r = await fetch('/api/portal/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId.trim(), otp }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.reason || `HTTP ${r.status}`);
        return;
      }
      setStep('done');
      setTimeout(() => { window.location.href = j.redirect || '/portal/home'; }, 800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setBusy(false); }
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={brandHeaderStyle}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 1.5 }}>TRUSTNER · CLIENT PORTAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Sign in</div>
        </div>
        <div style={{ padding: 22 }}>
          {step === 'enter-id' && (
            <div>
              <div style={subtle}>Use the mobile or email registered with Trustner. We&apos;ll send a 6-digit code.</div>
              <label style={labelStyle}>Mobile or email</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="+91 9xxxxxxxxx  or  you@example.com"
                style={inputStyle}
                autoComplete="username"
              />
              {err && <ErrBanner>{err}</ErrBanner>}
              <button onClick={sendOtp} disabled={busy || loginId.trim().length < 3} style={primaryBtn}>
                {busy ? 'Sending…' : '▸ Send code'}
              </button>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 14, textAlign: 'center' }}>
                Don&apos;t have an account yet? Ask your Trustner RM for an invite link.
              </div>
            </div>
          )}

          {step === 'enter-otp' && (
            <div>
              <div style={subtle}>Enter the 6-digit code we sent to <b>{maskedTarget || loginId}</b>.</div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                inputMode="numeric"
                autoComplete="one-time-code"
                style={otpInputStyle}
              />
              {err && <ErrBanner>{err}</ErrBanner>}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { setStep('enter-id'); setOtp(''); setErr(null); }} disabled={busy} style={ghostBtn}>← Back</button>
                <button onClick={verifyOtp} disabled={busy} style={{ ...primaryBtn, marginTop: 0, flex: 1 }}>
                  {busy ? 'Verifying…' : 'Sign in'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>
                Didn&apos;t get it? <button onClick={sendOtp} style={linkBtn}>Send again</button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#065F46' }}>Signed in</div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 8 }}>Taking you to your portal…</div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', background: '#EFF6FF', borderTop: '1px solid #DBEAFE', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Not a Trustner client yet?</div>
          <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>
            Get a professional review of your mutual fund portfolio — free, no obligation.
          </div>
          <a href="/contact" style={{ display: 'inline-block', padding: '8px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none', marginRight: 8 }}>
            Request a free portfolio review
          </a>
          <a href="https://wa.me/916003903737?text=Hi%20Trustner%20team%2C%20I%20would%20like%20a%20review%20of%20my%20mutual%20fund%20portfolio." target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 18px', background: '#fff', color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
            WhatsApp us
          </a>
        </div>
        <div style={footerNote}>
          Trustner Asset Services Pvt Ltd · <code>ARN-286886</code> · AMFI-registered Mutual Fund Distributor.<br />
          This portal does not constitute investment advice as defined under SEBI (Investment Advisers) Regulations, 2013.
        </div>
      </div>
    </div>
  );
}

function ErrBanner({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>✗ {children}</div>;
}

const shellStyle: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(135deg,#0A1628 0%,#1E40AF 70%,#06B6D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.25)', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' };
const brandHeaderStyle: React.CSSProperties = { padding: '18px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF)', color: '#fff' };
const subtle: React.CSSProperties = { fontSize: 12.5, color: '#475569', lineHeight: 1.55 };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 14, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit' };
const otpInputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 12, padding: '14px 18px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 28, fontWeight: 700, letterSpacing: '10px', textAlign: 'center', fontFamily: 'ui-monospace, monospace' };
const primaryBtn: React.CSSProperties = { display: 'block', width: '100%', marginTop: 16, padding: '11px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const ghostBtn: React.CSSProperties = { padding: '11px 16px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1E40AF', fontWeight: 700, cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 };
const footerNote: React.CSSProperties = { padding: '12px 22px', background: '#F8FAFC', fontSize: 10, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 };
