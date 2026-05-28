'use client';

/**
 * CasUploadWidget — optional CAS upload inside the Comprehensive wizard.
 *
 * Posts the PDF to /api/financial-planning/parse-cas, parses holdings,
 * and stores them via the onParsed callback. Privacy: PAN + investor
 * name are stripped server-side before the result is returned.
 *
 * UX: collapsed by default ("Upload your CAS — optional"). User
 * expands → drops file → optionally enters PAN-based password →
 * sees preview (count + total value) → can clear and re-upload.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Lock } from 'lucide-react';
import type { ExistingPortfolio, ExistingPortfolioHolding } from '@/types/financial-planning';

interface CasUploadResponse {
  success: boolean;
  error?: string;
  holdings?: Array<{
    fundName: string;
    amcName?: string;
    folioNumber?: string;
    units: number;
    currentValue: number;
    investedAmount: number;
    currentNav?: number;
    firstInvestmentDate?: string;
  }>;
}

interface Props {
  /** Current parsed existingPortfolio state (null/undefined = not yet uploaded). */
  value?: ExistingPortfolio;
  /** Called with the parsed portfolio summary; pass null to clear. */
  onParsed: (portfolio: ExistingPortfolio | null) => void;
}

function formatINR(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function CasUploadWidget({ value, onParsed }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = value && value.holdingsCount > 0;

  const submitParse = useCallback(
    async (file: File, pwd: string) => {
      setIsUploading(true);
      setError(null);

      const form = new FormData();
      form.append('file', file);
      if (pwd) form.append('password', pwd);

      try {
        const res = await fetch('/api/financial-planning/parse-cas', {
          method: 'POST',
          body: form,
        });
        const result = (await res.json()) as CasUploadResponse;

        if (!res.ok) {
          // 429 rate limit: surface specifically
          if (res.status === 429) {
            setError(result.error || 'Too many uploads. Please try again later.');
          } else {
            setError(result.error || 'Could not parse the file.');
          }
          setIsUploading(false);
          return;
        }

        if (!result.success) {
          if (result.error && /password/i.test(result.error)) {
            setNeedsPassword(true);
            setPendingFile(file);
            setError(null);
            setIsUploading(false);
            return;
          }
          setError(result.error || 'Could not parse this file. Is it a valid CAS or Trustner Valuation Report?');
          setIsUploading(false);
          return;
        }

        const rawHoldings = result.holdings || [];
        const holdings: ExistingPortfolioHolding[] = rawHoldings.map((h) => ({
          fundName: h.fundName,
          amcName: h.amcName,
          folioNumber: h.folioNumber,
          units: h.units,
          currentValueInr: h.currentValue,
          investedAmountInr: h.investedAmount,
          currentNav: h.currentNav,
          firstInvestmentDate: h.firstInvestmentDate,
        }));
        const totalValueInr = holdings.reduce((s, h) => s + (h.currentValueInr || 0), 0);
        const totalInvestedInr = holdings.reduce((s, h) => s + (h.investedAmountInr || 0), 0);

        onParsed({
          parsedAt: new Date().toISOString(),
          totalValueInr,
          totalInvestedInr,
          holdingsCount: holdings.length,
          holdings,
        });
        setNeedsPassword(false);
        setPassword('');
        setPendingFile(null);
      } catch (e) {
        setError(`Upload failed: ${(e as Error).message}`);
      } finally {
        setIsUploading(false);
      }
    },
    [onParsed],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large (max 5 MB).');
        return;
      }
      void submitParse(file, '');
    },
    [submitParse],
  );

  const handlePasswordSubmit = useCallback(() => {
    if (!pendingFile || !password.trim()) return;
    void submitParse(pendingFile, password.trim());
  }, [pendingFile, password, submitParse]);

  const handleClear = useCallback(() => {
    onParsed(null);
    setError(null);
    setNeedsPassword(false);
    setPassword('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onParsed]);

  // ── Collapsed state ─────────────────────────────────────────────────
  if (!expanded && !parsed) {
    return (
      <div className="border border-dashed border-surface-300 rounded-xl p-4 bg-brand-50/30">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-primary-700">Upload your CAS (optional)</p>
              <p className="text-[12px] text-slate-500">
                Get a more accurate plan by uploading your CAMS / Karvy CAS or Trustner Valuation Report.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-brand-600 font-semibold">Expand →</span>
        </button>
      </div>
    );
  }

  // ── Parsed (success) state ─────────────────────────────────────────
  if (parsed && value) {
    return (
      <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                ✓ {value.holdingsCount} holding{value.holdingsCount === 1 ? '' : 's'} parsed
              </p>
              <p className="text-[12px] text-emerald-700 mt-0.5">
                Current value <strong>{formatINR(value.totalValueInr)}</strong> &middot; Invested{' '}
                <strong>{formatINR(value.totalInvestedInr)}</strong>
                {value.totalInvestedInr > 0 && (
                  <>
                    {' '}&middot; Lifetime gain{' '}
                    <strong>
                      {(((value.totalValueInr - value.totalInvestedInr) / value.totalInvestedInr) * 100).toFixed(1)}%
                    </strong>
                  </>
                )}
              </p>
              <p className="text-[11px] text-emerald-700/70 mt-2">
                Your AI report will reference these holdings concretely in the Goal-by-Goal section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-slate-500 hover:text-slate-700 underline flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>
    );
  }

  // ── Expanded uploader state ────────────────────────────────────────
  return (
    <div className="border border-surface-300 rounded-xl p-5 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-primary-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            Upload your CAS / Valuation Report
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            Supports CAMS / KFintech CAS (password-protected — usually your PAN in CAPS) and Trustner Valuation Reports (no password).
          </p>
        </div>
        {!parsed && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!needsPassword ? (
        <>
          <label
            htmlFor="cas-upload"
            className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isUploading ? 'border-brand-300 bg-brand-50' : 'border-surface-300 hover:border-brand-300 hover:bg-brand-50/30'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-brand-700">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm font-medium">Parsing… this can take 10-20 seconds.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Drop a PDF here or click to browse</p>
                <p className="text-[11px] text-slate-500">PDF only &middot; up to 5 MB</p>
              </div>
            )}
            <input
              id="cas-upload"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            Your PAN and personal identifiers are stripped before the file leaves our server. We only store the
            holding-level summary (scheme names, units, current value) to personalise your plan.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-[12px] text-amber-800">
              <p className="font-semibold mb-1">This CAS is password-protected.</p>
              <p>
                For CAMS / KFintech files, the password is usually <strong>your PAN in CAPS</strong> (e.g. ABCDE1234F)
                or your date of birth in <strong>DDMMYYYY</strong> format.
              </p>
            </div>
          </div>
          <input
            type="password"
            placeholder="Enter password (case-sensitive)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:border-brand-400"
            disabled={isUploading}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={!password.trim() || isUploading}
              className="flex-1 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700"
            >
              {isUploading ? 'Parsing…' : 'Unlock & parse'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNeedsPassword(false);
                setPassword('');
                setPendingFile(null);
              }}
              className="px-4 py-2 border border-surface-300 text-sm rounded-lg hover:bg-surface-100"
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
