'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Resolution {
  client_id: number | null;
  client_code: string | null;
  display_name: string | null;
  confidence: 'exact_code' | 'exact_pan' | 'folio_match' | 'name_match' | 'none';
  reason: string;
}

interface ResolvedHolding {
  client_code?: string;
  pan?: string;
  client_name?: string;
  folio_number?: string;
  scheme_name: string;
  amfi_code?: string;
  units: number;
  total_invested?: number;
  current_value?: number;
  current_nav?: number;
  resolved_client_id: number | null;
  resolution: Resolution;
  raw: Record<string, unknown>;
}

interface ResolvedSip {
  client_code?: string;
  pan?: string;
  client_name?: string;
  scheme_name: string;
  monthly_amount: number;
  frequency?: string;
  status?: string;
  next_due_date?: string;
  resolved_client_id: number | null;
  resolution: Resolution;
  raw: Record<string, unknown>;
}

interface SheetReport { name: string; rows: number; kind: 'holdings' | 'sips' | 'unknown' }

interface ParseResponse {
  ok: boolean;
  sheets: SheetReport[];
  holdings: ResolvedHolding[];
  sips: ResolvedSip[];
  summary: { total_holdings: number; matched_holdings: number; total_sips: number; matched_sips: number };
}

export default function HoldingsImportWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'committing' | 'done'>('upload');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResponse | null>(null);
  const [commitResult, setCommitResult] = useState<{ holdings: { inserted: number; skipped: number; errors: { row: number; reason: string }[] }; sips: { inserted: number; skipped: number; errors: { row: number; reason: string }[] } } | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const file = fileRef.current?.files?.[0];
    if (!file) { setErr('Please choose a file.'); return; }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/client-master/holdings-import?action=parse', { method: 'POST', body: fd });
      const j = (await r.json()) as ParseResponse | { error?: string };
      if (!r.ok || !(j as ParseResponse).ok) {
        setErr((j as { error?: string }).error || `HTTP ${r.status}`);
        return;
      }
      setParsed(j as ParseResponse);
      setStep('preview');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    if (!parsed) return;
    setBusy(true);
    setStep('committing');
    try {
      const r = await fetch('/api/admin/client-master/holdings-import?action=commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: parsed.holdings.filter((r) => r.resolved_client_id),
          sips: parsed.sips.filter((r) => r.resolved_client_id),
          source: 'excel_upload',
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); setStep('preview'); return; }
      setCommitResult({ holdings: j.holdings, sips: j.sips });
      setStep('done');
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Commit failed');
      setStep('preview');
    } finally {
      setBusy(false);
    }
  }

  // ── UPLOAD ──
  if (step === 'upload') {
    return (
      <div style={card}>
        <h2 style={hdr}>Step 1 — Upload file</h2>
        <p style={hint}>
          Accepts .xlsx, .xls, .csv. Multiple sheets supported — the system auto-detects
          which sheet is holdings vs SIPs. The file you upload should contain columns like
          <code style={code}>Scheme Name</code>, <code style={code}>Folio Number</code>,
          <code style={code}>Units</code>, <code style={code}>Current NAV</code>,
          <code style={code}>Market Value</code>. SIP sheets need <code style={code}>SIP Amount</code>,
          <code style={code}>Frequency</code>, <code style={code}>Next Due Date</code>.
        </p>
        <form onSubmit={handleUpload} style={{ marginTop: 16 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={busy}
            style={{ display: 'block', marginBottom: 14 }}
          />
          <button type="submit" disabled={busy} style={primaryBtn}>
            {busy ? 'Parsing…' : 'Upload &amp; Preview →'}
          </button>
        </form>
        {err && <div style={errBox}>{err}</div>}
      </div>
    );
  }

  // ── PREVIEW ──
  if (step === 'preview' && parsed) {
    const unmatchedH = parsed.holdings.filter((r) => !r.resolved_client_id);
    const unmatchedS = parsed.sips.filter((r) => !r.resolved_client_id);

    return (
      <div>
        <div style={card}>
          <h2 style={hdr}>Step 2 — Review</h2>

          {/* Sheet summary */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Sheets detected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {parsed.sheets.map((s, i) => (
                <span key={i} style={{
                  background: s.kind === 'holdings' ? '#DBEAFE' : s.kind === 'sips' ? '#FEF3C7' : '#F1F5F9',
                  color: s.kind === 'holdings' ? '#1E40AF' : s.kind === 'sips' ? '#92400E' : '#475569',
                  padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                }}>
                  {s.name} · {s.rows} rows · {s.kind}
                </span>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <Stat label="Holdings rows" value={parsed.summary.total_holdings} sub={`${parsed.summary.matched_holdings} matched`} tone="info" />
            <Stat label="SIP rows" value={parsed.summary.total_sips} sub={`${parsed.summary.matched_sips} matched`} tone="warn" />
            <Stat label="Unmatched" value={unmatchedH.length + unmatchedS.length} sub="will be skipped" tone={unmatchedH.length + unmatchedS.length > 0 ? 'bad' : 'good'} />
          </div>

          {err && <div style={errBox}>{err}</div>}

          {/* Preview tables (compact) */}
          {parsed.holdings.length > 0 && (
            <details open={true} style={{ marginTop: 16 }}>
              <summary style={summaryStyle}>Holdings preview ({parsed.holdings.length} rows)</summary>
              <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 8 }}>
                <table style={tbl}>
                  <thead><tr style={{ background: '#F8FAFC' }}>
                    <th style={th}>Client</th><th style={th}>Scheme</th><th style={th}>Folio</th>
                    <th style={{ ...th, textAlign: 'right' }}>Units</th><th style={{ ...th, textAlign: 'right' }}>Invested</th><th style={{ ...th, textAlign: 'right' }}>Mkt Value</th>
                  </tr></thead>
                  <tbody>
                    {parsed.holdings.slice(0, 100).map((r, i) => (
                      <tr key={i} style={{ background: r.resolved_client_id ? '#fff' : '#FEF2F2' }}>
                        <td style={td}>
                          {r.resolved_client_id ? (
                            <span><b>{r.resolution.display_name}</b><br /><code style={{ fontSize: 10 }}>{r.resolution.client_code}</code></span>
                          ) : (
                            <span style={{ color: '#B91C1C' }}>✗ {r.client_code || r.pan || r.client_name || 'no identifier'}</span>
                          )}
                        </td>
                        <td style={td}>{r.scheme_name}</td>
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: 10.5 }}>{r.folio_number || '—'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{r.units.toFixed(3)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{r.total_invested ? `₹${r.total_invested.toLocaleString('en-IN')}` : '—'}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{r.current_value ? `₹${r.current_value.toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.holdings.length > 100 && <p style={{ padding: 8, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>Showing first 100 of {parsed.holdings.length} rows.</p>}
              </div>
            </details>
          )}

          {parsed.sips.length > 0 && (
            <details style={{ marginTop: 14 }}>
              <summary style={summaryStyle}>SIP mandates preview ({parsed.sips.length} rows)</summary>
              <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 8 }}>
                <table style={tbl}>
                  <thead><tr style={{ background: '#F8FAFC' }}>
                    <th style={th}>Client</th><th style={th}>Scheme</th><th style={{ ...th, textAlign: 'right' }}>Amount</th><th style={th}>Freq</th><th style={th}>Next Due</th><th style={th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {parsed.sips.slice(0, 100).map((r, i) => (
                      <tr key={i} style={{ background: r.resolved_client_id ? '#fff' : '#FEF2F2' }}>
                        <td style={td}>
                          {r.resolved_client_id ? (
                            <span><b>{r.resolution.display_name}</b><br /><code style={{ fontSize: 10 }}>{r.resolution.client_code}</code></span>
                          ) : (
                            <span style={{ color: '#B91C1C' }}>✗ {r.client_code || r.pan || r.client_name || 'no identifier'}</span>
                          )}
                        </td>
                        <td style={td}>{r.scheme_name}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>₹{r.monthly_amount.toLocaleString('en-IN')}</td>
                        <td style={td}>{r.frequency || 'monthly'}</td>
                        <td style={td}>{r.next_due_date || '—'}</td>
                        <td style={td}>{r.status || 'active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('upload')} disabled={busy} style={cancelBtn}>← Upload different file</button>
            <button onClick={handleCommit} disabled={busy || (parsed.summary.matched_holdings + parsed.summary.matched_sips === 0)} style={primaryBtn}>
              {busy ? 'Committing…' : `✓ Commit ${parsed.summary.matched_holdings + parsed.summary.matched_sips} rows`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DONE ──
  if (step === 'done' && commitResult) {
    return (
      <div style={card}>
        <h2 style={hdr}>✓ Import complete</h2>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Stat label="Holdings inserted/updated" value={commitResult.holdings.inserted} sub={`${commitResult.holdings.skipped} skipped`} tone="good" />
          <Stat label="SIPs inserted/updated" value={commitResult.sips.inserted} sub={`${commitResult.sips.skipped} skipped`} tone="good" />
          <Stat label="Errors" value={commitResult.holdings.errors.length + commitResult.sips.errors.length} sub="see logs" tone={(commitResult.holdings.errors.length + commitResult.sips.errors.length) > 0 ? 'bad' : 'good'} />
        </div>
        {(commitResult.holdings.errors.length + commitResult.sips.errors.length) > 0 && (
          <details style={{ marginTop: 14 }}>
            <summary style={summaryStyle}>View errors</summary>
            <ul style={{ fontSize: 11.5, color: '#B91C1C', marginTop: 8, paddingLeft: 16 }}>
              {commitResult.holdings.errors.map((e, i) => <li key={`h${i}`}>Holdings row {e.row}: {e.reason}</li>)}
              {commitResult.sips.errors.map((e, i) => <li key={`s${i}`}>SIP row {e.row}: {e.reason}</li>)}
            </ul>
          </details>
        )}
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button onClick={() => { setStep('upload'); setParsed(null); setCommitResult(null); }} style={primaryBtn}>Upload another file</button>
          <Link href="/admin/client-master" style={{ ...cancelBtn, display: 'inline-block', textDecoration: 'none' }}>← Back to client master</Link>
        </div>
      </div>
    );
  }

  if (step === 'committing') {
    return <div style={card}><h2 style={hdr}>Committing…</h2><p style={hint}>Hang tight — large imports may take a moment.</p></div>;
  }

  return null;
}

function Stat({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone: 'good' | 'warn' | 'bad' | 'info' }) {
  const tints: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#ECFDF5', fg: '#065F46' }, warn: { bg: '#FEF3C7', fg: '#92400E' },
    bad: { bg: '#FEE2E2', fg: '#991B1B' }, info: { bg: '#DBEAFE', fg: '#1E40AF' },
  };
  const t = tints[tone];
  return (
    <div style={{ background: t.bg, borderRadius: 10, padding: 14, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.fg, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value.toLocaleString('en-IN')}</div>
      {sub && <div style={{ fontSize: 10.5, color: t.fg, marginTop: 2, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, marginTop: 18 };
const hdr: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: '#0A1628', margin: '0 0 10px' };
const hint: React.CSSProperties = { fontSize: 12.5, color: '#64748B', lineHeight: 1.6 };
const code: React.CSSProperties = { background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'ui-monospace, monospace', margin: '0 2px' };
const primaryBtn: React.CSSProperties = { padding: '9px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { padding: '9px 14px', background: '#F1F5F9', color: '#0A1628', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const errBox: React.CSSProperties = { padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, marginTop: 8 };
const summaryStyle: React.CSSProperties = { cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0A1628' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 11.5 };
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' };
const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
