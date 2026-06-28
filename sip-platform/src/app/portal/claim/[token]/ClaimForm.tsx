'use client';

import { useEffect, useState } from 'react';

interface LookupResult {
  ok: boolean;
  reason?: string;
  invite_id?: number;
  client?: {
    id: number;
    code: string;
    display_name: string;
    mobile_masked: string | null;
    email_masked: string | null;
    has_mobile: boolean;
    has_email: boolean;
  };
  expires_at?: string;
}

type Step = 'loading' | 'invalid' | 'pick-channel' | 'enter-otp' | 'set-pin' | 'done';

export default function ClaimForm({ token }: { token: string }) {
  const [step, setStep] = useState<Step>('loading');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [channel, setChannel] = useState<'mobile' | 'email' | null>(null);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [otpSentTarget, setOtpSentTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/portal/auth/claim-lookup?token=${encodeURIComponent(token)}`);
        const j = (await r.json()) as LookupResult;
        if (!r.ok || !j.ok) {
          setLookup(j);
          setStep('invalid');
          return;
        }
        setLookup(j);
        setStep('pick-channel');
      } catch {
        setLookup({ ok: false, reason: 'Could not reach server.' });
        setStep('invalid');
      }
    })();
  }, [token]);

  async function sendOtp() {
    if (!channel) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch('/api/portal/auth/send-claim-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, channel }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.reason || `HTTP ${r.status}`);
        return;
      }
      setOtpSentTarget(j.login_id_masked);
      setStep('enter-otp');
      setMsg(`Sent a 6-digit code to ${j.login_id_masked}. It expires in 5 minutes.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtpAndProceed() {
    setErr(null);
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErr('Enter the 6-digit code.');
      return;
    }
    setStep('set-pin');
  }

  async function finishClaim() {
    if (!channel) return;
    setBusy(true);
    setErr(null);
    if (pin) {
      if (!/^\d{4}$/.test(pin)) { setErr('PIN must be 4 digits.'); setBusy(false); return; }
      if (pin !== pinConfirm) { setErr('PINs don\'t match.'); setBusy(false); return; }
    }
    try {
      const r = await fetch('/api/portal/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, channel, otp, pin: pin || undefined }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.reason || `HTTP ${r.status}`);
        setStep('enter-otp');
        return;
      }
      setStep('done');
      setTimeout(() => { window.location.href = j.redirect || '/portal/home'; }, 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={brandHeaderStyle}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 1.5 }}>TRUSTNER · CLIENT PORTAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Claim your account</div>
        </div>
        <div style={{ padding: 22 }}>
          {step === 'loading' && <Loader />}

          {step === 'invalid' && (
            <div>
              <div style={errPanelStyle}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>This link can&apos;t be used</div>
                <div style={{ fontSize: 12.5 }}>{lookup?.reason || 'Unknown error'}</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>
                If you already have an account, <a href="/portal/login" style={linkStyle}>sign in</a>. Otherwise contact
                your Trustner relationship manager for a fresh invite.
              </div>
            </div>
          )}

          {step === 'pick-channel' && lookup?.client && (
            <div>
              <div style={hello}>👋 Welcome,</div>
              <div style={displayName}>{lookup.client.display_name}</div>
              <div style={codeChip}>Client code · {lookup.client.code}</div>

              <div style={subtle}>
                To finish setting up your portal, we&apos;ll send a 6-digit code. Pick where you&apos;d like
                to receive it.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {lookup.client.has_mobile && (
                  <button onClick={() => { setChannel('mobile'); }} style={channel === 'mobile' ? channelBtnActive : channelBtn}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>📱 WhatsApp to my mobile</div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{lookup.client.mobile_masked}</div>
                  </button>
                )}
                {lookup.client.has_email && (
                  <button onClick={() => { setChannel('email'); }} style={channel === 'email' ? channelBtnActive : channelBtn}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>✉️ Email me a code</div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{lookup.client.email_masked}</div>
                  </button>
                )}
              </div>

              {err && <ErrBanner>{err}</ErrBanner>}

              <button onClick={sendOtp} disabled={!channel || busy} style={primaryBtn}>
                {busy ? 'Sending…' : '▸ Send code'}
              </button>
            </div>
          )}

          {step === 'enter-otp' && lookup?.client && (
            <div>
              <div style={hello}>Almost there, {lookup.client.display_name.split(' ')[0]}!</div>
              <div style={subtle}>
                Enter the 6-digit code we sent to <b>{otpSentTarget || (channel === 'mobile' ? lookup.client.mobile_masked : lookup.client.email_masked)}</b>.
              </div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                inputMode="numeric"
                autoComplete="one-time-code"
                style={otpInputStyle}
              />
              {msg && <InfoBanner>{msg}</InfoBanner>}
              {err && <ErrBanner>{err}</ErrBanner>}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { setStep('pick-channel'); setOtp(''); setErr(null); }} disabled={busy} style={ghostBtn}>← Back</button>
                <button onClick={verifyOtpAndProceed} disabled={busy} style={{ ...primaryBtn, marginTop: 0, flex: 1 }}>
                  Continue
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>
                Didn&apos;t get it? <button onClick={sendOtp} style={linkBtn}>Send again</button>
              </div>
            </div>
          )}

          {step === 'set-pin' && (
            <div>
              <div style={hello}>One last step</div>
              <div style={subtle}>
                Set a 4-digit PIN you&apos;ll use to confirm sensitive actions later (you can skip this and add one later).
              </div>
              <label style={labelStyle}>4-digit PIN (optional)</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                inputMode="numeric"
                style={otpInputStyle}
              />
              <label style={labelStyle}>Confirm PIN</label>
              <input
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                inputMode="numeric"
                style={otpInputStyle}
              />
              {err && <ErrBanner>{err}</ErrBanner>}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { setPin(''); setPinConfirm(''); finishClaim(); }} disabled={busy} style={ghostBtn}>Skip for now</button>
                <button onClick={finishClaim} disabled={busy} style={{ ...primaryBtn, marginTop: 0, flex: 1 }}>
                  {busy ? 'Setting up…' : '✓ Finish setup'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46' }}>You&apos;re in!</div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 8 }}>Taking you to your portal…</div>
            </div>
          )}
        </div>
        <div style={footerNote}>
          Trustner Asset Services Pvt Ltd · <code>ARN-286886</code> · AMFI-registered Mutual Fund Distributor.<br />
          This portal does not constitute investment advice as defined under SEBI (Investment Advisers) Regulations, 2013.
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>Checking your invite link…</div>;
}
function ErrBanner({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>✗ {children}</div>;
}
function InfoBanner({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 10, background: '#ECFDF5', color: '#065F46', borderRadius: 8, fontSize: 12, marginTop: 10 }}>{children}</div>;
}

const shellStyle: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(135deg,#0A1628 0%,#1E40AF 70%,#06B6D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.25)', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' };
const brandHeaderStyle: React.CSSProperties = { padding: '18px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF)', color: '#fff' };
const hello: React.CSSProperties = { fontSize: 13, color: '#64748B', fontWeight: 600 };
const displayName: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: '#0A1628', marginTop: 2 };
const codeChip: React.CSSProperties = { display: 'inline-block', marginTop: 8, padding: '3px 9px', background: '#F1F5F9', borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: '#475569', fontFamily: 'ui-monospace, monospace' };
const subtle: React.CSSProperties = { fontSize: 12.5, color: '#475569', marginTop: 14, lineHeight: 1.55 };
const channelBtn: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', textAlign: 'left', color: '#0A1628' };
const channelBtnActive: React.CSSProperties = { ...channelBtn, background: '#EFF6FF', border: '1.5px solid #1E40AF' };
const primaryBtn: React.CSSProperties = { display: 'block', width: '100%', marginTop: 16, padding: '11px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const ghostBtn: React.CSSProperties = { padding: '11px 16px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const otpInputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 12, padding: '14px 18px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 28, fontWeight: 700, letterSpacing: '10px', textAlign: 'center', fontFamily: 'ui-monospace, monospace' };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 14, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' };
const linkStyle: React.CSSProperties = { color: '#1E40AF', fontWeight: 700 };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1E40AF', fontWeight: 700, cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 };
const errPanelStyle: React.CSSProperties = { padding: 14, background: '#FEE2E2', color: '#B91C1C', borderRadius: 10 };
const footerNote: React.CSSProperties = { padding: '12px 22px', background: '#F8FAFC', fontSize: 10, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 };
