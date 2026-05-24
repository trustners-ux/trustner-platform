/**
 * Client Master CSV Import — UI
 *
 * Route: /admin/clients/import
 *
 * Three-step flow:
 *   1. Upload CSV/XLSX → preview (dry run) showing column mapping +
 *      per-row validation + in-file and in-DB duplicate detection.
 *   2. Confirm conflict-handling (skip/update/createNew).
 *   3. Commit → server inserts/updates rows, audit-logs the import,
 *      and returns per-row outcomes.
 *
 * DPDP-aligned: prominent banner reminds the user that they're
 * importing Personal Data; PII masking on preview (PAN shown as
 * XXX1234F); strict role gate enforced server-side.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, Download, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, ArrowLeft, FileText, RefreshCw, Eye,
} from 'lucide-react';

interface PreviewRow {
  rowNumber: number;
  familyName: string | null;
  primaryContactName: string | null;
  primaryContactMobile: string | null;
  primaryContactEmail: string | null;
  primaryContactPan: string | null; // already masked in preview
  segment: string | null;
  familyCode: string | null;
  notes: string | null;
  errors: string[];
  warnings: string[];
}

interface PreviewResult {
  ok: boolean;
  dryRun: true;
  columnMap: Record<string, string>;
  unmappedHeaders: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  existingMobiles: string[];
  rows: PreviewRow[];
}

interface CommitResult {
  ok: boolean;
  dryRun: false;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  outcomes: Array<{ rowNumber: number; outcome: string; familyId?: number; reason?: string }>;
}

export default function ClientImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onConflict, setOnConflict] = useState<'skip' | 'update' | 'createNew'>('skip');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(f: File | null) {
    setFile(f);
    setPreview(null);
    setCommitResult(null);
    setError(null);
    if (!f) return;
    await runPreview(f);
  }

  async function runPreview(f: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('dryRun', 'true');
      const res = await fetch('/api/admin/clients/import', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fatalError ?? data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPreview(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    if (!file || !preview) return;
    if (preview.validRows === 0) {
      alert('No valid rows to import. Fix errors and re-upload.');
      return;
    }
    const summary = `Commit ${preview.validRows} client(s)?\n\n` +
      `${preview.duplicatesInDb} would match existing records — they will be ${onConflict === 'skip' ? 'SKIPPED' : onConflict === 'update' ? 'UPDATED in place' : 'created as NEW additional families'}.\n\n` +
      `This action is audit-logged for DPDP compliance.`;
    if (!confirm(summary)) return;

    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('dryRun', 'false');
      form.append('onConflict', onConflict);
      const res = await fetch('/api/admin/clients/import', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setCommitResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCommitResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/clients" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to directory
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Import Client Master Data
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload your existing CSV/Excel file. Trustner accepts the most common header variants so you don&apos;t have to reformat.
        </p>
      </div>

      {/* DPDP compliance banner */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-900">DPDP Act 2023 reminder.</strong>{' '}
            <span className="text-amber-800">
              Client master data is Personal Data under the DPDP Act. You may import it only if:
            </span>
            <ul className="list-disc ml-5 mt-1 text-amber-800 text-xs space-y-0.5">
              <li>You have a lawful basis (consent / contract) to process this data</li>
              <li>The data subject (client) has been informed about the purpose</li>
              <li>You are an authorised Trustner employee with admin role</li>
              <li>Every import is logged for audit by the Data Protection Officer (Ram Shah)</li>
            </ul>
            <span className="text-amber-700 text-xs mt-1 block">
              Only admins and roles with <code>can_manage_users</code> can use this page. Other employees will see a 403.
            </span>
          </div>
        </div>
      </div>

      {/* Template download */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Step 1: Download the template (optional)</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pre-formatted CSV with all 8 fields + 2 example rows. Open in Excel, paste your data, save and re-upload below.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/clients/template"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download template.csv
          </a>
        </div>
      </div>

      {/* Upload */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900 mb-2">Step 2: Upload your file</h2>
        <p className="text-xs text-slate-600 mb-3">
          CSV, XLS, or XLSX. Max 10 MB. We accept these column-header variants automatically:
        </p>
        <ul className="text-[11px] text-slate-600 space-y-0.5 mb-4 bg-slate-50 rounded p-2">
          <li>• <strong>Family Name</strong> — accepts: family, family name, household, client name, investor name, group name, name</li>
          <li>• <strong>Contact Name</strong> — accepts: contact name, primary contact, contact person, kyc name, full name</li>
          <li>• <strong>Mobile</strong> — accepts: mobile, phone, contact, cell, whatsapp (10 digits, strips +91, 0)</li>
          <li>• <strong>Email</strong> — accepts: email, e-mail, mail, email id, contact email</li>
          <li>• <strong>PAN</strong> — accepts: pan, pan number, pan card, permanent account number</li>
          <li>• <strong>Segment</strong> — Mass / Retail / HNI / UHNI / Corporate (or variants like &quot;ultra hni&quot;)</li>
          <li>• <strong>Family Code</strong> — optional unique code, e.g. SHA-2026-001</li>
          <li>• <strong>Notes</strong> — any free-text remarks</li>
        </ul>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => void handleFileSelect(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:font-semibold hover:file:bg-primary-700"
        />
        {file && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
            <button onClick={reset} className="ml-2 text-rose-600 hover:underline">Reset</button>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 inline" />
          <div className="text-sm text-slate-500 mt-2">Parsing your file…</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Import error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && !commitResult && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryTile label="Total rows" value={preview.totalRows} tone="slate" />
            <SummaryTile label="Valid rows" value={preview.validRows} tone="emerald" />
            <SummaryTile label="Invalid rows" value={preview.invalidRows} tone={preview.invalidRows > 0 ? 'rose' : 'slate'} />
            <SummaryTile label="In-file dupes" value={preview.duplicatesInFile} tone={preview.duplicatesInFile > 0 ? 'amber' : 'slate'} />
            <SummaryTile label="Already in DB" value={preview.duplicatesInDb} tone={preview.duplicatesInDb > 0 ? 'amber' : 'slate'} />
          </div>

          {/* Column mapping */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-bold text-slate-900 mb-2">Column mapping (auto-detected)</h2>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Your column header</th>
                  <th className="text-left px-3 py-2">Mapped to</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(preview.columnMap).map(([orig, mapped]) => (
                  <tr key={orig} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 font-mono">{orig}</td>
                    <td className="px-3 py-1.5">
                      {mapped === 'IGNORED' ? (
                        <span className="text-amber-700 text-[11px]">⚠ Not recognized — column will be ignored</span>
                      ) : (
                        <span className="font-bold text-emerald-700">{mapped}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.unmappedHeaders.length > 0 && (
              <div className="mt-2 text-xs text-amber-800 bg-amber-50 rounded p-2">
                <strong>Note:</strong> We couldn&apos;t map {preview.unmappedHeaders.length} column(s):{' '}
                <code>{preview.unmappedHeaders.join(', ')}</code>. They&apos;ll be ignored. If any of these contain important data,
                rename the header to match one of the accepted variants above and re-upload.
              </div>
            )}
          </div>

          {/* Row preview */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Preview ({preview.rows.length} rows)</h2>
              <p className="text-xs text-slate-500 mt-0.5">PAN values are masked in preview (XXX1234F). Mobile + email are shown for verification.</p>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Family</th>
                  <th className="text-left px-3 py-2">Contact</th>
                  <th className="text-left px-3 py-2">Mobile</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">PAN</th>
                  <th className="text-left px-3 py-2">Segment</th>
                  <th className="text-left px-3 py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 200).map((r) => (
                  <tr key={r.rowNumber} className={`border-t border-slate-100 ${r.errors.length > 0 ? 'bg-rose-50' : r.warnings.length > 0 ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-1.5 text-slate-500">{r.rowNumber}</td>
                    <td className="px-3 py-1.5">
                      {r.errors.length > 0
                        ? <XCircle className="h-3.5 w-3.5 text-rose-600 inline" />
                        : r.warnings.length > 0
                        ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600 inline" />
                        : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />}
                    </td>
                    <td className="px-3 py-1.5 font-semibold">{r.familyName ?? <span className="text-rose-600">—</span>}</td>
                    <td className="px-3 py-1.5">{r.primaryContactName ?? '—'}</td>
                    <td className="px-3 py-1.5 font-mono">{r.primaryContactMobile ?? '—'}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px]">{r.primaryContactEmail ?? '—'}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px]">{r.primaryContactPan ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.segment ?? '—'}</td>
                    <td className="px-3 py-1.5 text-[10px]">
                      {[...r.errors, ...r.warnings].map((m, i) => (
                        <div key={i} className={r.errors.includes(m) ? 'text-rose-700' : 'text-amber-700'}>
                          {m}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {preview.rows.length > 200 && (
                  <tr><td colSpan={9} className="text-center text-slate-500 py-2 text-[11px]">… + {preview.rows.length - 200} more rows (preview limited to 200)</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Commit controls */}
          {preview.validRows > 0 && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
              <h2 className="font-bold text-primary-900 mb-2">Step 3: Commit to database</h2>
              <p className="text-xs text-primary-800 mb-3">
                {preview.duplicatesInDb > 0
                  ? `${preview.duplicatesInDb} row(s) match existing clients (by mobile or email). Choose how to handle these:`
                  : 'No conflicts with existing clients. All valid rows will be inserted as new families.'}
              </p>
              {preview.duplicatesInDb > 0 && (
                <div className="mb-3 space-y-2">
                  <label className="flex items-start gap-2 text-xs">
                    <input type="radio" name="conflict" checked={onConflict === 'skip'} onChange={() => setOnConflict('skip')} className="mt-0.5" />
                    <div>
                      <strong>Skip duplicates</strong>{' '}
                      <span className="text-slate-600">(safest — keep existing records as-is; recommended for first run)</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 text-xs">
                    <input type="radio" name="conflict" checked={onConflict === 'update'} onChange={() => setOnConflict('update')} className="mt-0.5" />
                    <div>
                      <strong>Update existing</strong>{' '}
                      <span className="text-slate-600">(overwrite name/email/segment with new values where provided)</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 text-xs">
                    <input type="radio" name="conflict" checked={onConflict === 'createNew'} onChange={() => setOnConflict('createNew')} className="mt-0.5" />
                    <div>
                      <strong>Create as new families</strong>{' '}
                      <span className="text-slate-600">(careful — will create duplicates; use only if you know what you&apos;re doing)</span>
                    </div>
                  </label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void commit()}
                  disabled={loading || preview.validRows === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Commit {preview.validRows} client(s)
                </button>
                <button onClick={reset} className="text-xs text-slate-600 hover:text-slate-900">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Commit result */}
      {commitResult && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-5">
          <h2 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Import complete
          </h2>
          <div className="grid grid-cols-4 gap-3 mt-3">
            <SummaryTile label="Inserted" value={commitResult.inserted} tone="emerald" />
            <SummaryTile label="Updated" value={commitResult.updated} tone="teal" />
            <SummaryTile label="Skipped" value={commitResult.skipped} tone="slate" />
            <SummaryTile label="Failed" value={commitResult.failed} tone={commitResult.failed > 0 ? 'rose' : 'slate'} />
          </div>
          {commitResult.failed > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-rose-700 font-semibold">Show {commitResult.failed} failed row(s)</summary>
              <div className="mt-2 space-y-1">
                {commitResult.outcomes.filter((o) => o.outcome.includes('failed')).map((o) => (
                  <div key={o.rowNumber} className="text-rose-700">
                    Row {o.rowNumber}: {o.reason}
                  </div>
                ))}
              </div>
            </details>
          )}
          <div className="mt-4 flex gap-2">
            <Link href="/admin/clients" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700">
              <Eye className="h-3.5 w-3.5" />
              View imported clients
            </Link>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-3.5 w-3.5" />
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'rose' | 'amber' | 'teal' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  } as const;
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold mt-0.5">{value.toLocaleString('en-IN')}</div>
    </div>
  );
}
