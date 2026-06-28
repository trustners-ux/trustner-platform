'use client';

/**
 * The 3-step bulk-import wizard.
 * Upload → Preview (edit + dedup review) → Commit (per-row result).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DupeCandidate {
  by: 'mobile' | 'email' | 'pan';
  existing_id: number;
  existing_code: string;
  existing_name: string;
}

interface ParsedRow {
  source_row: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  salutation: string | null;
  display_name: string;
  gender: 'M' | 'F' | 'O' | 'U';
  dob: string | null;
  mobile_primary: string | null;
  mobile_alt: string | null;
  email_primary: string | null;
  email_alt: string | null;
  pan: string | null;
  addr_current_line1: string | null;
  addr_current_line2: string | null;
  addr_current_city: string | null;
  addr_current_state: string | null;
  addr_current_pincode: string | null;
  residential_status: 'resident' | 'nri' | 'foreign_national' | 'pio' | 'oci';
  occupation: string | null;
  annual_income_band: string | null;
  risk_profile: 'conservative' | 'moderate' | 'aggressive' | 'unknown';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';
  source_platform_code: string | null;
  source_family_head: string | null;
  tags: string | null;
  notes: string | null;
  warnings: string[];
  errors: string[];
  duplicate_candidates: DupeCandidate[];
  skip?: boolean;
}

interface ParseResponse {
  ok: boolean;
  rows: ParsedRow[];
  total: number;
  valid_count: number;
  error_count: number;
  parsing_method: 'heuristic' | 'llm' | 'mixed';
  detected_source: 'investwell' | 'redvision' | 'generic_rm' | 'unknown';
  source_format: 'csv' | 'xlsx' | 'pdf' | 'txt' | 'unknown';
  header_mapping_debug?: Record<string, string>;
  fatal?: string | null;
  error?: string;
}

interface CommitResult {
  source_row: number;
  ok: boolean;
  skipped?: boolean;
  client?: { id: number; code: string; display_name: string };
  error?: string;
}
interface CommitResponse {
  ok: boolean;
  created: number;
  skipped: number;
  failed: number;
  results: CommitResult[];
  error?: string;
}

export default function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'preview' | 'committing' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParseResponse | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [showHeader, setShowHeader] = useState(false);
  const [commitResp, setCommitResp] = useState<CommitResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setStep('upload');
    setFile(null);
    setParsing(false);
    setPreview(null);
    setRows([]);
    setShowHeader(false);
    setCommitResp(null);
    setErr(null);
  }

  async function parse() {
    if (!file) return;
    setErr(null);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/client-master/import?action=parse', { method: 'POST', body: fd });
      const j = (await r.json()) as ParseResponse;
      if (!r.ok || j.error) {
        setErr(j.error || j.fatal || `HTTP ${r.status}`);
        if (j.rows && j.rows.length > 0) {
          // Show what was parsed even though there was an error
          setPreview(j);
          setRows(j.rows);
          setStep('preview');
        }
        return;
      }
      if (!j.rows || j.rows.length === 0) {
        setErr(j.fatal || 'No rows parsed — check the file format.');
        return;
      }
      // Auto-mark duplicates as skip by default
      const seeded = j.rows.map((r) => ({
        ...r,
        skip: r.errors.length > 0 || r.duplicate_candidates.length > 0,
      }));
      setPreview(j);
      setRows(seeded);
      setStep('preview');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network error');
    } finally {
      setParsing(false);
    }
  }

  function updateRow(idx: number, patch: Partial<ParsedRow>) {
    setRows((curr) => {
      const next = curr.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function toggleSkip(idx: number) {
    setRows((curr) => {
      const next = curr.slice();
      next[idx] = { ...next[idx], skip: !next[idx].skip };
      return next;
    });
  }

  async function commit() {
    setErr(null);
    setStep('committing');
    try {
      const toSend = rows.map((r) => ({
        ...r,
        // The server only checks `errors.length`, `skip`, and the
        // create payload. We don't need to re-include duplicate
        // candidates in the body.
        duplicate_candidates: undefined,
      }));
      const r = await fetch('/api/admin/client-master/import?action=commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: toSend }),
      });
      const j = (await r.json()) as CommitResponse;
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        setStep('preview');
        return;
      }
      setCommitResp(j);
      setStep('done');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
      setStep('preview');
    }
  }

  const toCommit = rows.filter((r) => !r.skip && r.errors.length === 0).length;
  const willSkip = rows.filter((r) => r.skip).length;
  const blockedByError = rows.filter((r) => !r.skip && r.errors.length > 0).length;

  // ── STEP 1: Upload ───────────────────────────────────────
  if (step === 'upload') {
    return (
      <div>
        <Stepper current={1} />
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #CBD5E1', padding: 36, textAlign: 'center', marginTop: 18 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0A1628', marginBottom: 6 }}>Pick an export file</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            XLSX · CSV · PDF · XLS · TXT &nbsp;·&nbsp; Max 25 MB &nbsp;·&nbsp; Up to 5000 rows per file
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13 }}
          />
          {file && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: '#475569' }}>
              <code>{file.name}</code> &nbsp;·&nbsp; {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <button onClick={parse} disabled={!file || parsing} style={btnPrimary}>
              {parsing ? 'Parsing…' : '↓ Parse + preview'}
            </button>
          </div>
          {err && <Banner tone="error">✗ {err}</Banner>}
        </div>
        <Tip>
          The parser tries a fast heuristic first (column-name matching for
          200+ known aliases across Investwell, Redvision, and generic
          formats). Tricky files fall back to Claude — slower (~30s) but
          handles weird custom layouts.
        </Tip>
      </div>
    );
  }

  // ── STEP 2: Preview ──────────────────────────────────────
  if (step === 'preview' || step === 'committing') {
    return (
      <div>
        <Stepper current={2} />
        {preview && (
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, marginTop: 14, marginBottom: 14, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}>
            <span><b>{preview.total}</b> total rows</span>
            <span style={{ color: '#065F46' }}><b>{toCommit}</b> will create</span>
            <span style={{ color: '#92400E' }}><b>{willSkip}</b> skipped</span>
            <span style={{ color: '#991B1B' }}><b>{blockedByError}</b> errored (blocked)</span>
            <span>Parser: <code>{preview.parsing_method}</code></span>
            <span>Detected: <code>{preview.detected_source}</code></span>
            {preview.header_mapping_debug && (
              <button onClick={() => setShowHeader((v) => !v)} style={linkBtn}>
                {showHeader ? '↑ Hide' : '↓ Show'} column mapping ({Object.keys(preview.header_mapping_debug).length})
              </button>
            )}
          </div>
        )}
        {showHeader && preview?.header_mapping_debug && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 11.5 }}>
            <b style={{ display: 'block', marginBottom: 6 }}>Header mapping (source column → logical field)</b>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {Object.entries(preview.header_mapping_debug).map(([src, logical]) => (
                  <tr key={src}>
                    <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', color: '#475569' }}>{src}</td>
                    <td style={{ padding: '3px 8px', color: '#94A3B8' }}>→</td>
                    <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', color: '#1E40AF' }}>{logical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {err && <Banner tone="error">✗ {err}</Banner>}

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'auto', maxHeight: '60vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Commit?</th>
                <th style={th}>Name</th>
                <th style={th}>DOB</th>
                <th style={th}>Mobile</th>
                <th style={th}>Email</th>
                <th style={th}>PAN</th>
                <th style={th}>City</th>
                <th style={th}>Source code</th>
                <th style={th}>Issues</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const dupe = r.duplicate_candidates.length > 0;
                const bg = r.skip ? '#FAFBFC' : dupe ? '#FEF3C7' : r.errors.length ? '#FEE2E2' : 'transparent';
                return (
                  <tr key={idx} style={{ background: bg, opacity: r.skip ? 0.55 : 1 }}>
                    <td style={td}>{r.source_row}</td>
                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={!r.skip}
                        onChange={() => toggleSkip(idx)}
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <input
                        value={r.display_name}
                        onChange={(e) => updateRow(idx, { display_name: e.target.value })}
                        style={cellInput}
                        disabled={step === 'committing'}
                      />
                      {r.salutation && <span style={{ color: '#94A3B8', fontSize: 10, marginLeft: 4 }}>({r.salutation})</span>}
                    </td>
                    <td style={td}>
                      <input
                        value={r.dob ?? ''}
                        onChange={(e) => updateRow(idx, { dob: e.target.value || null })}
                        style={{ ...cellInput, width: 90 }}
                        placeholder="YYYY-MM-DD"
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <input
                        value={r.mobile_primary ?? ''}
                        onChange={(e) => updateRow(idx, { mobile_primary: e.target.value || null })}
                        style={{ ...cellInput, width: 130 }}
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <input
                        value={r.email_primary ?? ''}
                        onChange={(e) => updateRow(idx, { email_primary: e.target.value || null })}
                        style={{ ...cellInput, width: 180 }}
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <input
                        value={r.pan ?? ''}
                        onChange={(e) => updateRow(idx, { pan: e.target.value.toUpperCase() || null })}
                        maxLength={10}
                        style={{ ...cellInput, width: 100, fontFamily: 'ui-monospace, monospace' }}
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <input
                        value={r.addr_current_city ?? ''}
                        onChange={(e) => updateRow(idx, { addr_current_city: e.target.value || null })}
                        style={{ ...cellInput, width: 100 }}
                        disabled={step === 'committing'}
                      />
                    </td>
                    <td style={td}>
                      <code style={{ fontSize: 10 }}>{r.source_platform_code || '—'}</code>
                    </td>
                    <td style={td}>
                      {r.errors.length > 0 && (
                        <div style={{ color: '#991B1B', fontSize: 10.5 }}>
                          <b>✗ {r.errors.length} error{r.errors.length > 1 ? 's' : ''}:</b>
                          <ul style={{ margin: '2px 0', paddingLeft: 14 }}>
                            {r.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.duplicate_candidates.length > 0 && (
                        <div style={{ color: '#92400E', fontSize: 10.5, marginTop: 2 }}>
                          <b>⚠ Possible dupe:</b>
                          <ul style={{ margin: '2px 0', paddingLeft: 14 }}>
                            {r.duplicate_candidates.map((d, i) => (
                              <li key={i}>
                                by {d.by}: {d.existing_name} (<code>{d.existing_code}</code>)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.warnings.length > 0 && (
                        <div style={{ color: '#92400E', fontSize: 10.5, marginTop: 2 }}>
                          <ul style={{ margin: 0, paddingLeft: 14 }}>
                            {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.errors.length === 0 && r.duplicate_candidates.length === 0 && r.warnings.length === 0 && (
                        <span style={{ color: '#065F46', fontSize: 10 }}>✓ clean</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 14 }}>
          <button onClick={reset} disabled={step === 'committing'} style={btnGhost}>← Cancel + start over</button>
          <button onClick={commit} disabled={step === 'committing' || toCommit === 0} style={btnPrimary}>
            {step === 'committing' ? 'Creating…' : `✓ Create ${toCommit} client${toCommit === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3: Done ─────────────────────────────────────────
  return (
    <div>
      <Stepper current={3} />
      {commitResp && (
        <div style={{ marginTop: 18, padding: 18, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#065F46', marginBottom: 6 }}>
            ✓ Import complete
          </div>
          <div style={{ display: 'flex', gap: 22, fontSize: 13, color: '#065F46', marginTop: 10, flexWrap: 'wrap' }}>
            <span><b>{commitResp.created}</b> clients created</span>
            <span><b>{commitResp.skipped}</b> skipped</span>
            <span><b>{commitResp.failed}</b> failed</span>
          </div>
        </div>
      )}
      {commitResp && commitResp.created > 0 && <FamilyAutoLinkButton />}
      {commitResp && commitResp.results.some((r) => !r.ok && !r.skipped) && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0A1628' }}>Per-row results</h3>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={th}>Source row</th>
                  <th style={th}>Status</th>
                  <th style={th}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {commitResp.results.filter((r) => !r.ok && !r.skipped).map((r) => (
                  <tr key={r.source_row}>
                    <td style={td}>{r.source_row}</td>
                    <td style={td}><span style={{ color: '#991B1B', fontWeight: 700, fontSize: 10.5 }}>✗ FAILED</span></td>
                    <td style={td}>{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
        <button onClick={reset} style={btnGhost}>Import another file</button>
        <Link href="/admin/client-master" style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-block' }}>View clients →</Link>
      </div>
    </div>
  );
}

function FamilyAutoLinkButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    scanned_clients: number;
    families_created: number;
    families_existing: number;
    members_added: number;
    orphan_heads: { head_code: string; member_count: number }[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/admin/client-master/auto-link-families', { method: 'POST' });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setResult(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 18, padding: 16, border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF', marginBottom: 6 }}>
        🔗 Auto-link families (Wealth Elite / Investwell graph)
      </div>
      <div style={{ fontSize: 12, color: '#475569', marginBottom: 10, maxWidth: 760, lineHeight: 1.55 }}>
        If the imported source had <code>FAMILY HEAD IWELL CODE</code> (or
        Investwell equivalent), we can rebuild the family tree right now —
        every member with a known head gets linked to the right family unit.
        Idempotent: re-running won&apos;t duplicate.
      </div>
      <button onClick={go} disabled={busy || !!result} style={btnAutoLink}>
        {busy ? 'Linking…' : result ? '✓ Linked' : '↪ Run family linker'}
      </button>
      {err && <div style={{ marginTop: 8, color: '#991B1B', fontSize: 12 }}>✗ {err}</div>}
      {result && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
          <div>Scanned <b>{result.scanned_clients}</b> clients · created <b>{result.families_created}</b> new
          families · merged into <b>{result.families_existing}</b> existing · added <b>{result.members_added}</b> memberships</div>
          {result.orphan_heads.length > 0 && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer', color: '#92400E' }}>
                ⚠ {result.orphan_heads.length} orphan head{result.orphan_heads.length === 1 ? '' : 's'} (member listed a head we don&apos;t have in our DB yet)
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18, color: '#92400E' }}>
                {result.orphan_heads.slice(0, 20).map((o, i) => (
                  <li key={i}><code>{o.head_code}</code> — {o.member_count} member{o.member_count === 1 ? '' : 's'} waiting</li>
                ))}
                {result.orphan_heads.length > 20 && <li>… and {result.orphan_heads.length - 20} more</li>}
              </ul>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                Import the heads&apos; client rows and re-run this linker — they&apos;ll be picked up.
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Upload file' },
    { n: 2, label: 'Preview + edit' },
    { n: 3, label: 'Done' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      {steps.map((s) => (
        <div key={s.n} style={{
          flex: 1, padding: '10px 14px', borderRadius: 8,
          background: s.n <= current ? '#1E40AF' : '#F1F5F9',
          color: s.n <= current ? '#fff' : '#64748B',
          fontSize: 12.5, fontWeight: 700,
        }}>
          {s.n}. {s.label}
        </div>
      ))}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18, padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11.5, color: '#475569' }}>
      💡 {children}
    </div>
  );
}
function Banner({ tone, children }: { tone: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 10, marginTop: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 600,
      background: tone === 'ok' ? '#ECFDF5' : '#FEE2E2',
      color: tone === 'ok' ? '#065F46' : '#B91C1C',
    }}>{children}</div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', padding: '8px 10px', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
const cellInput: React.CSSProperties = { width: '100%', padding: '3px 5px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11.5, fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { padding: '9px 18px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1E40AF', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 };
const btnAutoLink: React.CSSProperties = { padding: '8px 16px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' };
