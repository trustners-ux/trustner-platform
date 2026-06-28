'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LinkResult {
  scanned_clients: number;
  excluded_already_in_family: number;
  household_groups: number;
  household_families_created: number;
  household_members_added: number;
  shared_mobile_groups: number;
  shared_mobile_families_created: number;
  shared_mobile_members_added: number;
  example_groups: { kind: string; key: string; members: { id: number; name: string }[] }[];
}

export default function HeuristicLinkButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<LinkResult | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/client-master/heuristic-link-families', {
        method: 'POST',
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setResult(j as LinkResult);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setResult(null); setErr(null); }} style={triggerBtn}>
        🔗 Heuristic family linker
      </button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && !busy && setOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 680, width: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF,#06B6D4)', color: '#fff', fontSize: 15, fontWeight: 800, position: 'sticky', top: 0 }}>
              Heuristic family linker
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 10, opacity: 0.85 }}>
                Groups clients by household + shared mobile
              </span>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.55, marginBottom: 14 }}>
                Wealth Elite&apos;s family graph isn&apos;t in this export. This linker uses two best-effort
                heuristics to group clients that the source data doesn&apos;t link:
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li><b>Same household</b> — same last name + same pincode + same address line 1 (first 20 chars)</li>
                  <li><b>Shared mobile</b> — two or more clients with the same primary mobile (joint accounts, spouses)</li>
                </ul>
                Clients already in any family (from the Wealth Elite auto-link or manual) are <b>skipped</b>.
                Re-running this is safe — only NEW groups will be linked.
              </div>

              {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>✗ {err}</div>}

              {result ? (
                <div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46', marginBottom: 8 }}>✓ Done</div>
                    <table style={{ width: '100%', fontSize: 12, color: '#065F46' }}>
                      <tbody>
                        <tr><td>Scanned clients</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{result.scanned_clients}</td></tr>
                        <tr><td>Already in a family (skipped)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{result.excluded_already_in_family}</td></tr>
                        <tr><td style={{ paddingTop: 8 }}><b>Household match:</b></td><td /></tr>
                        <tr><td>&nbsp;&nbsp;Groups found</td><td style={{ textAlign: 'right' }}>{result.household_groups}</td></tr>
                        <tr><td>&nbsp;&nbsp;Families created</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{result.household_families_created}</td></tr>
                        <tr><td>&nbsp;&nbsp;Members added</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{result.household_members_added}</td></tr>
                        <tr><td style={{ paddingTop: 8 }}><b>Shared-mobile match:</b></td><td /></tr>
                        <tr><td>&nbsp;&nbsp;Groups found</td><td style={{ textAlign: 'right' }}>{result.shared_mobile_groups}</td></tr>
                        <tr><td>&nbsp;&nbsp;Families created</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{result.shared_mobile_families_created}</td></tr>
                        <tr><td>&nbsp;&nbsp;Members added</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{result.shared_mobile_members_added}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  {result.example_groups.length > 0 && (
                    <details style={{ background: '#F8FAFC', borderRadius: 10, padding: 12 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#0A1628' }}>
                        Example groups created ({result.example_groups.length})
                      </summary>
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569' }}>
                        {result.example_groups.map((g, i) => (
                          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 700, color: '#0A1628' }}>{g.kind} — {g.key}</div>
                            <div>{g.members.map((m) => m.name).join(' · ')}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => !busy && setOpen(false)} disabled={busy} style={btnGhost}>Cancel</button>
                  <button onClick={run} disabled={busy} style={btnPrimary}>
                    {busy ? 'Linking…' : '▸ Run linker now'}
                  </button>
                </div>
              )}

              {result && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button onClick={() => setOpen(false)} style={btnPrimary}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const triggerBtn: React.CSSProperties = {
  padding: '8px 18px',
  background: '#fff',
  color: '#7C3AED',
  border: '1.5px solid #7C3AED',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 18px',
  background: 'linear-gradient(135deg,#1E40AF,#06B6D4)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const btnGhost: React.CSSProperties = {
  padding: '8px 18px',
  background: '#F1F5F9',
  color: '#0A1628',
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
