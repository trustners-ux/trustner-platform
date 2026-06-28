'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewSummary {
  id: number;
  documentId: string;
  familyName: string;
  status: string;
  createdAt: string;
  numHoldings: number;
  currentValueInr: number;
  totalInvestedInr: number;
  gainInr: number;
  verdicts: { star: number; keep: number; watch: number; swap: number; liquidate: number };
}

export default function UploadClient({ pastReviews }: { pastReviews: ReviewSummary[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    setError('');
    if (f && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }
    if (f && f.size > 15 * 1024 * 1024) {
      setError('File too large (max 15 MB)');
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('pdf', file);
      if (password.trim()) form.append('password', password.trim());

      const res = await fetch('/api/portal/me/portfolio-review/upload', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Upload failed. Please try again.');
        setUploading(false);
        return;
      }

      router.push(`/portal/portfolio-review/${data.diagnosticRunId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setUploading(false);
    }
  };

  const fmtInr = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
    return n.toLocaleString('en-IN');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Portfolio Health Check</h1>
      <p style={{ fontSize: 13, color: '#475569', margin: '0 0 22px' }}>
        Upload your Consolidated Account Statement (CAS) and get an instant, AI-powered analysis of every fund in your portfolio.
      </p>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1E40AF' : file ? '#059669' : '#CBD5E1'}`,
          borderRadius: 16,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#EFF6FF' : file ? '#F0FDF4' : '#FAFBFD',
          transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {file ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{file.name}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              {(file.size / 1024).toFixed(0)} KB — click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>
              Drop your CAS PDF here
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 6 }}>
              or click to browse. Download your CAS from{' '}
              <span style={{ fontWeight: 700 }}>mycams.camsonline.com</span> or{' '}
              <span style={{ fontWeight: 700 }}>kfintech.com</span>
            </div>
          </>
        )}
      </div>

      {/* Password field (CAS PDFs are usually password-protected with PAN) */}
      {file && (
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            PDF Password (usually your PAN)
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. ABCDE1234F"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: 1,
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
            Most CAS PDFs are password-protected with your PAN number. Leave blank if yours isn&apos;t.
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {file && (
        <button
          onClick={submit}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '14px',
            background: uploading ? '#94A3B8' : 'linear-gradient(135deg, #1E40AF, #06B6D4)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 800,
            cursor: uploading ? 'wait' : 'pointer',
            marginBottom: 14,
          }}
        >
          {uploading ? 'Analyzing your portfolio...' : 'Analyze My Portfolio'}
        </button>
      )}

      {uploading && (
        <div style={{ textAlign: 'center', padding: 12, color: '#475569', fontSize: 13 }}>
          <div style={{ display: 'inline-block', width: 18, height: 18, border: '3px solid #CBD5E1', borderTopColor: '#1E40AF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
          Reading your statement, matching funds, scoring each holding...
          <br />
          <span style={{ fontSize: 11, color: '#94A3B8' }}>This usually takes 10-20 seconds.</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Info box */}
      <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 18px', marginTop: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>What you&apos;ll get</div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12.5, color: '#1E3A5F', lineHeight: 2 }}>
          <li>Fund-by-fund health verdict (Excellent / Good / Monitor / Needs Change / Exit)</li>
          <li>Risk suitability check against your investor profile</li>
          <li>Duplicate fund detection &amp; consolidation suggestions</li>
          <li>Tax-aware exit strategy (LTCG / STCG estimates)</li>
          <li>SIP health check with redirect suggestions</li>
        </ul>
      </div>

      {/* Past reviews */}
      {pastReviews.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>
            Your past reviews
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pastReviews.map((r) => (
              <a
                key={r.id}
                href={`/portal/portfolio-review/${r.id}`}
                style={{
                  display: 'block',
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0A1628' }}>{r.familyName}</span>
                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: '#475569' }}>
                  <span>{r.numHoldings} holdings</span>
                  <span>Invested: {fmtInr(r.totalInvestedInr)}</span>
                  <span>Current: {fmtInr(r.currentValueInr)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {r.verdicts.star > 0 && <VerdictBadge count={r.verdicts.star} label="Excellent" color="#059669" bg="#ECFDF5" />}
                  {r.verdicts.keep > 0 && <VerdictBadge count={r.verdicts.keep} label="Good" color="#0D9488" bg="#F0FDFA" />}
                  {r.verdicts.watch > 0 && <VerdictBadge count={r.verdicts.watch} label="Monitor" color="#D97706" bg="#FFFBEB" />}
                  {r.verdicts.swap > 0 && <VerdictBadge count={r.verdicts.swap} label="Change" color="#EA580C" bg="#FFF7ED" />}
                  {r.verdicts.liquidate > 0 && <VerdictBadge count={r.verdicts.liquidate} label="Exit" color="#DC2626" bg="#FEF2F2" />}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictBadge({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, color, background: bg }}>
      {count} {label}
    </span>
  );
}
