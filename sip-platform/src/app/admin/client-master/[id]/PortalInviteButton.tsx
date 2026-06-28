'use client';

import { useState } from 'react';

interface Props {
  clientId: number;
  clientName: string;
  hasMobile: boolean;
  hasEmail: boolean;
}

interface InviteResult {
  id: number;
  token: string;
  magic_link: string;
  expires_at: string;
  will_send_whatsapp: boolean;
  will_send_email: boolean;
  send_dispatched: boolean;
  phase_a_note: string;
}

export default function PortalInviteButton({ clientName, hasMobile, hasEmail, clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendWa, setSendWa] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [expiresIn, setExpiresIn] = useState(14);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/client-master/${clientId}/portal-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_whatsapp: sendWa,
          send_email: sendEmail,
          expires_in_days: expiresIn,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setResult(j.invite as InviteResult);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.magic_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  function close() {
    setOpen(false);
    setTimeout(() => { setResult(null); setErr(null); setCopied(false); }, 300);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerBtn}>📨 Portal invite</button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && !busy && close()}
        >
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF,#06B6D4)', color: '#fff', fontSize: 15, fontWeight: 800, position: 'sticky', top: 0 }}>
              📨 Send portal invite — {clientName}
            </div>
            <div style={{ padding: 22 }}>
              {!result ? (
                <>
                  <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.55, marginBottom: 14 }}>
                    Generates a single-use magic link the client can use to claim their portal account
                    (Phase B). For now, the link is generated and stored — you can copy it and share
                    manually. Auto-dispatch over WhatsApp + email lands in Phase B.
                  </div>
                  <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 10, fontSize: 11, color: '#92400E', marginBottom: 12 }}>
                    <b>Available channels:</b>{' '}
                    {hasMobile ? '✓ WhatsApp ready' : '⚠ No mobile on file'} ·{' '}
                    {hasEmail ? '✓ Email ready' : '⚠ No email on file'}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                      Channels to record for this invite
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <label style={chipLabel}>
                        <input type="checkbox" checked={sendWa} onChange={(e) => setSendWa(e.target.checked)} disabled={!hasMobile} />
                        WhatsApp
                      </label>
                      <label style={chipLabel}>
                        <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} disabled={!hasEmail} />
                        Email
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                      Link expires in
                    </div>
                    <select value={expiresIn} onChange={(e) => setExpiresIn(Number(e.target.value))} style={input}>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days (default)</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                    </select>
                  </div>

                  {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>✗ {err}</div>}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={close} disabled={busy} style={btnGhost}>Cancel</button>
                    <button onClick={generate} disabled={busy} style={btnPrimary}>
                      {busy ? 'Generating…' : '▸ Generate invite link'}
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>✓ Invite created</div>
                    <div style={{ fontSize: 11.5, color: '#065F46', marginTop: 4 }}>
                      Expires {new Date(result.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    Magic link (copy & share)
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input readOnly value={result.magic_link} style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }} />
                    <button onClick={copyLink} style={btnPrimary}>{copied ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <div style={{ marginTop: 14, padding: 10, background: '#FEF3C7', borderRadius: 8, fontSize: 11.5, color: '#92400E', lineHeight: 1.5 }}>
                    ⚠ {result.phase_a_note}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                    <button onClick={close} style={btnPrimary}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const triggerBtn: React.CSSProperties = { padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const input: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' };
const chipLabel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#475569', cursor: 'pointer', padding: '4px 8px', background: '#F1F5F9', borderRadius: 6 };
const btnPrimary: React.CSSProperties = { padding: '8px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { padding: '8px 18px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
