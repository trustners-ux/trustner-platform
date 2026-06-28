'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES: { value: string; label: string; emoji: string; example: string }[] = [
  { value: 'address_change',    emoji: '🏠', label: 'Address change',          example: 'I moved to a new address …' },
  { value: 'contact_update',    emoji: '📞', label: 'Contact / consent update', example: 'Please update my email to …' },
  { value: 'nominee_change',    emoji: '👥', label: 'Nominee change',           example: 'I want to update my nominee …' },
  { value: 'kyc_update',        emoji: '🪪', label: 'KYC update',               example: 'I have a new PAN / Aadhaar …' },
  { value: 'statement_request', emoji: '📊', label: 'Statement request',       example: 'I need a statement for FY 2025-26' },
  { value: 'withdrawal_request',emoji: '💰', label: 'Withdrawal',               example: 'I want to redeem my SIPs …' },
  { value: 'bank_change',       emoji: '🏦', label: 'Bank change',              example: 'I have a new bank account …' },
  { value: 'sip_change',        emoji: '🔄', label: 'SIP change',               example: 'Please increase my SIP by …' },
  { value: 'redemption_request',emoji: '📤', label: 'Redemption',               example: 'I want to redeem from scheme …' },
  { value: 'complaint',         emoji: '⚠️', label: 'Complaint',                example: 'I am not happy with …' },
  { value: 'other',             emoji: '📎', label: 'Other',                    example: '' },
];

export default function NewRequestForm({ initialCategory }: { initialCategory: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const meta = CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];

  async function submit() {
    setBusy(true);
    setErr(null);
    if (!subject.trim()) { setErr('Subject is required.'); setBusy(false); return; }
    try {
      const r = await fetch('/api/portal/me/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject: subject.trim(), description: description.trim(), priority }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); return; }
      router.push(`/portal/requests/${j.request.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setBusy(false); }
  }

  return (
    <div>
      <Link href="/portal/requests" style={{ fontSize: 12, color: '#1E40AF', textDecoration: 'none' }}>← Back to requests</Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 4px' }}>New service request</h1>
      <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 18px' }}>Tell us what you need help with and we&apos;ll get back to you within 1-2 business days.</p>

      <div style={card}>
        <label style={labelStyle}>What can we help with?</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
          ))}
        </select>

        <label style={labelStyle}>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={`e.g. ${meta.example || 'Quick summary of your request'}`} style={inputStyle} maxLength={200} />

        <label style={labelStyle}>Tell us more (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Any additional context will help us resolve this faster…" style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />

        <label style={labelStyle}>Priority</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPriority('normal')} style={priority === 'normal' ? priBtnActive : priBtn}>Normal</button>
          <button onClick={() => setPriority('urgent')} style={priority === 'urgent' ? priBtnUrgent : priBtn}>🚨 Urgent</button>
        </div>

        {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginTop: 12 }}>✗ {err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Link href="/portal/requests" style={ghostBtn}>Cancel</Link>
          <button onClick={submit} disabled={busy} style={primaryBtn}>
            {busy ? 'Submitting…' : '✓ Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 14, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 };
const priBtn: React.CSSProperties = { padding: '8px 14px', background: '#fff', color: '#475569', border: '1.5px solid #CBD5E1', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const priBtnActive: React.CSSProperties = { ...priBtn, background: '#EFF6FF', borderColor: '#1E40AF', color: '#1E40AF' };
const priBtnUrgent: React.CSSProperties = { ...priBtn, background: '#FEE2E2', borderColor: '#DC2626', color: '#7F1D1D' };
const primaryBtn: React.CSSProperties = { padding: '8px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { padding: '8px 16px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'none' };
