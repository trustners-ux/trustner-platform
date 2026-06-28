'use client';

import { useEffect, useState } from 'react';

interface Doc {
  id: number;
  doc_type: string;
  file_name: string;
  file_size_bytes: number;
  file_mime: string;
  verification_status: string;
  ocr_status: string;
  ocr_mismatch_flags: Record<string, boolean> | null;
  uploaded_via: string;
  uploaded_at: string;
}

const DOC_TYPE_LABELS: Record<string, { emoji: string; label: string; hint: string }> = {
  aadhaar:                { emoji: '🪪', label: 'Aadhaar',                     hint: 'Front side. Only last 4 digits stored.' },
  pan:                    { emoji: '🆔', label: 'PAN card',                    hint: 'Clear image with PAN number visible.' },
  passport:               { emoji: '🛂', label: 'Passport',                    hint: 'Photo page.' },
  driving_license:        { emoji: '🚗', label: 'Driving license',             hint: 'Front side.' },
  voter_id:               { emoji: '🗳️', label: 'Voter ID',                    hint: 'Front side.' },
  photo:                  { emoji: '📸', label: 'Photograph',                  hint: 'Passport-style photo.' },
  signature:              { emoji: '✍️', label: 'Signature',                   hint: 'Specimen signature on white paper.' },
  address_proof_current:  { emoji: '🏠', label: 'Address proof (current)',     hint: 'Utility bill, rent agreement, etc.' },
  address_proof_permanent:{ emoji: '🏡', label: 'Address proof (permanent)',   hint: '' },
  income_proof:           { emoji: '💰', label: 'Income proof',                hint: 'Salary slip or ITR.' },
  bank_proof:             { emoji: '🏦', label: 'Bank proof',                  hint: 'Cancelled cheque or bank statement.' },
  cancelled_cheque:       { emoji: '📃', label: 'Cancelled cheque',            hint: 'Crossed CANCELLED across the front.' },
  other:                  { emoji: '📎', label: 'Other',                       hint: '' },
};

export default function DocumentsClient() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState<string>('pan');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/portal/me/documents');
      const j = await r.json();
      if (j.ok) setDocs(j.documents || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setErr(null);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      const r = await fetch('/api/portal/me/documents', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); return; }
      setMsg(`✓ Uploaded ${file.name}.${(docType === 'pan' || docType === 'aadhaar') ? ' We’ll verify the contents shortly.' : ''}`);
      setFile(null);
      setShowUpload(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function download(id: number, fname: string) {
    try {
      const r = await fetch(`/api/portal/me/documents/${id}/download`);
      const j = await r.json();
      if (!r.ok || !j.ok) { alert(j.error || `HTTP ${r.status}`); return; }
      const a = document.createElement('a');
      a.href = j.signed_url;
      a.download = fname;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Documents</h1>
          <p style={{ fontSize: 12.5, color: '#475569', margin: '4px 0 0' }}>
            Upload your KYC documents securely. All files are encrypted in transit and stored privately —
            only Trustner staff with KYC permissions can view them.
          </p>
        </div>
        <button onClick={() => { setShowUpload(true); setErr(null); setMsg(null); }} style={primaryBtn}>↑ Upload a document</button>
      </div>

      {msg && <div style={{ padding: 10, background: '#ECFDF5', color: '#065F46', borderRadius: 8, fontSize: 12.5, marginTop: 12 }}>{msg}</div>}

      {loading ? (
        <div style={{ padding: 20, color: '#94A3B8', fontSize: 12.5 }}>Loading…</div>
      ) : docs.length === 0 ? (
        <div style={{ marginTop: 18, padding: 22, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          📁 You haven&apos;t uploaded any documents yet. Click <b>Upload a document</b> to add your PAN, Aadhaar, photo, or signature.
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          {docs.map((d) => {
            const meta = DOC_TYPE_LABELS[d.doc_type] || { emoji: '📎', label: d.doc_type, hint: '' };
            return (
              <div key={d.id} style={docRow}>
                <div style={{ fontSize: 28 }}>{meta.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{meta.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.file_name} · {Math.round(d.file_size_bytes / 1024)} KB · uploaded {d.uploaded_at?.slice(0, 10)}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Pill tone={d.verification_status === 'verified' ? 'good' : d.verification_status === 'rejected' ? 'bad' : 'warn'}>
                      {d.verification_status === 'verified' ? '✓ verified' : d.verification_status === 'rejected' ? '✗ rejected' : '⌛ pending review'}
                    </Pill>
                    {d.ocr_status === 'queued' && <Pill tone="info">⏳ ocr queued</Pill>}
                    {d.ocr_status === 'running' && <Pill tone="info">🔄 ocr in progress</Pill>}
                    {d.ocr_status === 'done' && <Pill tone="good">✓ ocr done</Pill>}
                    {d.ocr_status === 'failed' && <Pill tone="bad">ocr failed</Pill>}
                    {d.ocr_mismatch_flags && Object.entries(d.ocr_mismatch_flags).some(([, v]) => v) && (
                      <Pill tone="warn">⚠ data mismatch</Pill>
                    )}
                  </div>
                </div>
                <button onClick={() => download(d.id, d.file_name)} style={downloadBtn}>↓</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
             onClick={(e) => e.target === e.currentTarget && !uploading && setShowUpload(false)}>
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.3)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg,#0A1628,#1E40AF,#06B6D4)', color: '#fff', fontSize: 15, fontWeight: 800 }}>
              Upload a document
            </div>
            <div style={{ padding: 22 }}>
              <label style={labelStyle}>What kind of document?</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} style={inputStyle}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
              {DOC_TYPE_LABELS[docType]?.hint && (
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{DOC_TYPE_LABELS[docType].hint}</p>
              )}

              <label style={labelStyle}>Pick a file</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12 }}
              />
              {file && <div style={{ fontSize: 11.5, color: '#475569', marginTop: 6 }}>{file.name} · {Math.round(file.size / 1024)} KB</div>}

              {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginTop: 12 }}>✗ {err}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                <button onClick={() => !uploading && setShowUpload(false)} disabled={uploading} style={ghostBtn}>Cancel</button>
                <button onClick={upload} disabled={uploading || !file} style={primaryBtn}>
                  {uploading ? 'Uploading…' : '✓ Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ tone, children }: { tone: 'good' | 'warn' | 'bad' | 'info'; children: React.ReactNode }) {
  const tints: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#ECFDF5', fg: '#065F46' },
    warn: { bg: '#FEF3C7', fg: '#92400E' },
    bad: { bg: '#FEE2E2', fg: '#991B1B' },
    info: { bg: '#DBEAFE', fg: '#1E40AF' },
  };
  const t = tints[tone];
  return <span style={{ background: t.bg, color: t.fg, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{children}</span>;
}

const docRow: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 8 };
const primaryBtn: React.CSSProperties = { padding: '8px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { padding: '8px 16px', background: '#F1F5F9', color: '#0A1628', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const downloadBtn: React.CSSProperties = { padding: '6px 12px', background: '#F1F5F9', color: '#1E40AF', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: 'pointer' };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 14, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 };
