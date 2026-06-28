'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch('/api/portal/auth/logout', { method: 'POST' });
      const j = await r.json();
      window.location.href = j.redirect || '/portal/login';
    } catch {
      window.location.href = '/portal/login';
    }
  }
  return (
    <button onClick={logout} disabled={busy} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
      {busy ? '…' : 'Sign out'}
    </button>
  );
}
