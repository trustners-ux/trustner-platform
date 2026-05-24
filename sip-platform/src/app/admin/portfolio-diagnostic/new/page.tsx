/**
 * Portfolio Diagnostic — New Diagnostic Upload
 *
 * 3-tab UI:
 *   1. Family — link to existing or create new client family
 *   2. Holdings — CAS PDF upload OR manual entry
 *   3. SIPs — active SIP commitments capture
 *
 * Saves drafts to localStorage every 30s while editing, then commits
 * to the database via /api/admin/portfolio-diagnostic/draft on Save.
 *
 * Route: /admin/portfolio-diagnostic/new
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  Users,
  Repeat,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import type {
  RawHolding,
  RawSip,
  EntityType,
  SipFrequency,
  ClientSegment,
} from '@/lib/portfolio-diagnostic/types';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type Tab = 'family' | 'holdings' | 'sips' | 'review';

interface FamilyForm {
  familyId?: number;                    // set if linking to existing
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactMobile: string;
  primaryContactPan?: string;
  segment: ClientSegment;
  notes?: string;
}

interface ExistingFamilyOption {
  id: number;
  familyName: string;
  segment: ClientSegment;
  totalAumInr: number;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function NewDiagnosticPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('family');

  // Form state
  const [family, setFamily] = useState<FamilyForm>({
    familyName: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactMobile: '',
    segment: 'Mass',
  });
  const [holdings, setHoldings] = useState<RawHolding[]>([]);
  const [sips, setSips] = useState<RawSip[]>([]);

  // CAS upload state
  const [casUploading, setCasUploading] = useState(false);
  const [casParseError, setCasParseError] = useState<string | null>(null);
  const [casParseSuccess, setCasParseSuccess] = useState<string | null>(null);

  // Save / submit state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save to localStorage every 30s
  useEffect(() => {
    const id = setInterval(() => {
      localStorage.setItem(
        'pd-new-diagnostic-draft',
        JSON.stringify({ family, holdings, sips, savedAt: new Date().toISOString() })
      );
    }, 30_000);
    return () => clearInterval(id);
  }, [family, holdings, sips]);

  // Restore from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('pd-new-diagnostic-draft');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.family) setFamily(parsed.family);
        if (parsed.holdings) setHoldings(parsed.holdings);
        if (parsed.sips) setSips(parsed.sips);
      } catch {
        // ignore
      }
    }
  }, []);

  // ── CAS upload handler ─────────────────────────────────────
  async function handleCasUpload(file: File, password: string) {
    setCasUploading(true);
    setCasParseError(null);
    setCasParseSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);

    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/parse-cas', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        setCasParseError(err.error ?? `HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setCasParseError(data.error ?? 'Parse failed');
        return;
      }

      // Merge parsed data
      if (data.investorName && !family.primaryContactName) {
        setFamily((f) => ({
          ...f,
          primaryContactName: data.investorName,
          familyName: f.familyName || `${data.investorName} Family`,
          primaryContactPan: data.pan,
        }));
      }
      setHoldings(data.holdings ?? []);
      setSips(data.sips ?? []);
      setCasParseSuccess(
        `Parsed ${data.holdings.length} holdings + ${data.sips.length} SIPs from ${data.totalAmcsFound} AMCs`
      );
      setActiveTab('holdings');
    } catch (e) {
      setCasParseError((e as Error).message);
    } finally {
      setCasUploading(false);
    }
  }

  // ── Save draft to DB ───────────────────────────────────────
  async function handleSaveDraft() {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/admin/portfolio-diagnostic/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ family, holdings, sips }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }));
        // Session expired (24h admin / 12h employee TTL) — bounce to login.
        // The draft is preserved in localStorage so nothing is lost; user
        // returns here after signing in.
        if (res.status === 401) {
          setSaveError(
            'Your session has expired. Redirecting to login… (your draft is auto-saved locally and will be here when you return)'
          );
          setTimeout(() => {
            const next = encodeURIComponent('/admin/portfolio-diagnostic/new');
            window.location.href = `/admin/login?next=${next}`;
          }, 1500);
          return;
        }
        setSaveError(err.error ?? `HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      // Clear localStorage draft on successful save
      localStorage.removeItem('pd-new-diagnostic-draft');
      // Navigate to the diagnostic detail page
      router.push(`/admin/portfolio-diagnostic/${data.diagnosticRunId}/edit`);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Validation ─────────────────────────────────────────────
  // Email is OPTIONAL — many real clients don't have an email on file.
  // Phone is sufficient as a contact identifier.
  const isFamilyValid = Boolean(
    family.familyName.trim() &&
      family.primaryContactName.trim() &&
      (family.primaryContactEmail.trim() || family.primaryContactMobile?.trim())
  );
  // SIPs are OPTIONAL — clients with only lump-sum investments are common.
  // The diagnostic just needs SOMETHING (holdings OR sips).
  const hasData = holdings.length > 0 || sips.length > 0;
  const canSubmit = isFamilyValid && hasData;

  // Specific blocker reason (for UI hint)
  const blockerReason: string | null = !family.familyName.trim()
    ? 'Family name required (Tab 1)'
    : !family.primaryContactName.trim()
    ? 'Primary contact name required (Tab 1)'
    : !family.primaryContactEmail.trim() && !family.primaryContactMobile?.trim()
    ? 'Either email or mobile required for primary contact (Tab 1)'
    : !hasData
    ? 'Add at least one holding (Tab 2) — SIPs are optional'
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/portfolio-diagnostic"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">New Portfolio Diagnostic</h1>
          <p className="text-sm text-slate-500 mt-1">
            Step through the 3 tabs below. Auto-saves locally every 30s.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSaveDraft}
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={blockerReason ?? 'Save the diagnostic draft'}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>
          {blockerReason && (
            <p className="text-xs text-amber-600 max-w-[280px] text-right">
              {blockerReason}
            </p>
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          <strong>Save error:</strong> {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2">
          <TabButton
            label="1. Family"
            icon={Users}
            active={activeTab === 'family'}
            onClick={() => setActiveTab('family')}
            done={isFamilyValid}
          />
          <TabButton
            label="2. Holdings"
            icon={FileText}
            active={activeTab === 'holdings'}
            onClick={() => setActiveTab('holdings')}
            count={holdings.length}
          />
          <TabButton
            label="3. SIPs"
            icon={Repeat}
            active={activeTab === 'sips'}
            onClick={() => setActiveTab('sips')}
            count={sips.length}
          />
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'family' && (
          <FamilyTab
            family={family}
            onChange={setFamily}
            onNext={() => setActiveTab('holdings')}
          />
        )}
        {activeTab === 'holdings' && (
          <HoldingsTab
            holdings={holdings}
            onChange={setHoldings}
            casUploading={casUploading}
            casParseError={casParseError}
            casParseSuccess={casParseSuccess}
            onCasUpload={handleCasUpload}
            onNext={() => setActiveTab('sips')}
          />
        )}
        {activeTab === 'sips' && (
          <SipsTab sips={sips} onChange={setSips} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB BUTTON
// ─────────────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  done?: boolean;
  count?: number;
  onClick: () => void;
}

function TabButton({ label, icon: Icon, active, done, count, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'border-brand text-brand'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {done && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          {count}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// FAMILY TAB
// ─────────────────────────────────────────────────────────────────

interface FamilyTabProps {
  family: FamilyForm;
  onChange: (f: FamilyForm) => void;
  onNext: () => void;
}

function FamilyTab({ family, onChange, onNext }: FamilyTabProps) {
  const [existingFamilies, setExistingFamilies] = useState<ExistingFamilyOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.length < 2) {
      setExistingFamilies([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/portfolio-diagnostic/families?q=${encodeURIComponent(searchQuery)}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          setExistingFamilies(data.families ?? []);
        }
      } catch {
        // silent
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function linkExisting(opt: ExistingFamilyOption) {
    onChange({
      ...family,
      familyId: opt.id,
      familyName: opt.familyName,
      segment: opt.segment,
    });
    setSearchQuery('');
    setExistingFamilies([]);
  }

  return (
    <div className="space-y-6">
      {/* Existing family search */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Link to existing family
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Search by family name or primary contact — saves you re-entering KYC details.
        </p>
        <input
          type="search"
          placeholder="Start typing family name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {existingFamilies.length > 0 && (
          <ul className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100">
            {existingFamilies.map((opt) => (
              <li key={opt.id}>
                <button
                  onClick={() => linkExisting(opt)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold">{opt.familyName}</div>
                  <div className="text-xs text-slate-500">
                    {opt.segment} &middot; ₹{(opt.totalAumInr / 100000).toFixed(2)} L AUM
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <hr className="flex-1 border-slate-200" />
        OR
        <hr className="flex-1 border-slate-200" />
      </div>

      {/* New family form */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          {family.familyId ? 'Linked Family' : 'Create New Family'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Family Name *" required>
            <input
              value={family.familyName}
              onChange={(e) => onChange({ ...family, familyName: e.target.value })}
              placeholder="e.g. Rohit Jain Family"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </FormField>

          <FormField label="Segment *">
            <select
              value={family.segment}
              onChange={(e) => onChange({ ...family, segment: e.target.value as ClientSegment })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Mass">Mass (&lt; ₹10 L)</option>
              <option value="Affluent">Affluent (₹10 L - ₹50 L)</option>
              <option value="HNI">HNI (₹50 L - ₹5 Cr)</option>
              <option value="UHNI">UHNI (&gt; ₹5 Cr)</option>
            </select>
          </FormField>

          <FormField label="Primary Contact Name *" required>
            <input
              value={family.primaryContactName}
              onChange={(e) => onChange({ ...family, primaryContactName: e.target.value })}
              placeholder="Full name as per PAN"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </FormField>

          <FormField label="PAN">
            <input
              value={family.primaryContactPan ?? ''}
              onChange={(e) => onChange({ ...family, primaryContactPan: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </FormField>

          <FormField label="Email" hint="Either email or mobile is required">
            <input
              type="email"
              value={family.primaryContactEmail}
              onChange={(e) => onChange({ ...family, primaryContactEmail: e.target.value })}
              placeholder="rohit@example.com (optional if mobile filled)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </FormField>

          <FormField label="Mobile" hint="Either email or mobile is required">
            <input
              type="tel"
              value={family.primaryContactMobile}
              onChange={(e) => onChange({ ...family, primaryContactMobile: e.target.value })}
              placeholder="+91 9876543210 (optional if email filled)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Notes (optional)">
              <textarea
                value={family.notes ?? ''}
                onChange={(e) => onChange({ ...family, notes: e.target.value })}
                rows={3}
                placeholder="Any context about this family — referral source, special concerns, multi-generational notes..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Next: Holdings
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700 mb-1 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && (
        <span className="text-[10px] text-slate-500 mt-1 block">{hint}</span>
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOLDINGS TAB
// ─────────────────────────────────────────────────────────────────

interface HoldingsTabProps {
  holdings: RawHolding[];
  onChange: (h: RawHolding[]) => void;
  casUploading: boolean;
  casParseError: string | null;
  casParseSuccess: string | null;
  onCasUpload: (file: File, password: string) => void;
  onNext: () => void;
}

function HoldingsTab({
  holdings,
  onChange,
  casUploading,
  casParseError,
  casParseSuccess,
  onCasUpload,
  onNext,
}: HoldingsTabProps) {
  const [mode, setMode] = useState<'cas' | 'manual'>('cas');
  const [casPassword, setCasPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the parent reports an encrypted-PDF error, surface the
  // password prompt. Otherwise hide it on success.
  useEffect(() => {
    if (casParseError && /password|encrypted|protected/i.test(casParseError)) {
      setPasswordPromptVisible(true);
    } else if (casParseSuccess) {
      setPasswordPromptVisible(false);
      setSelectedFile(null);
      setCasPassword('');
    }
  }, [casParseError, casParseSuccess]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset state, then try without password first.
    setSelectedFile(file);
    setPasswordPromptVisible(false);
    setCasPassword('');
    onCasUpload(file, '');
  }

  function addManualHolding() {
    onChange([
      ...holdings,
      {
        entityName: '',
        fundName: '',
        units: 0,
        currentValue: 0,
        investedAmount: 0,
      },
    ]);
  }

  function updateHolding(idx: number, field: keyof RawHolding, value: unknown) {
    const next = [...holdings];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  }

  function deleteHolding(idx: number) {
    onChange(holdings.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => setMode('cas')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            mode === 'cas' ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upload CAS PDF
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
            mode === 'manual' ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* CAS upload mode */}
      {mode === 'cas' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            Upload Consolidated Account Statement (CAS) or Trustner Valuation Report
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Drop the PDF here. <strong>No password needed for Trustner reports</strong> —
            we&apos;ll ask only if the file turns out to be password-protected (typical for
            CAMS / Karvy CAS, which use the investor&apos;s PAN as the password).
          </p>

          {/* Selected-file pill — shown after a file is chosen */}
          {selectedFile && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-700 truncate">
                <FileText className="inline w-4 h-4 mr-1.5 text-slate-400" />
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPasswordPromptVisible(false);
                  setCasPassword('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Remove
              </button>
            </div>
          )}

          {/* Password prompt — only shown when parse failed with encrypted-PDF error */}
          {passwordPromptVisible && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <strong>This PDF is password-protected.</strong> Enter the password
                  (usually the investor&apos;s PAN in uppercase) and we&apos;ll retry.
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={casPassword}
                  onChange={(e) => setCasPassword(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  autoFocus
                  className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFile && casPassword.trim()) {
                      onCasUpload(selectedFile, casPassword.trim());
                    }
                  }}
                  disabled={casUploading || casPassword.trim().length === 0}
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {casUploading ? 'Trying…' : 'Retry'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={casUploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {casUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {casUploading
              ? 'Parsing...'
              : passwordPromptVisible
              ? 'Choose Different PDF'
              : selectedFile
              ? 'Choose Different PDF'
              : 'Choose CAS / Valuation PDF'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {casParseError && !passwordPromptVisible && (
            <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Parse error:</strong> {casParseError}
              </div>
            </div>
          )}

          {casParseSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Parsed successfully:</strong> {casParseSuccess}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual entry mode */}
      {mode === 'manual' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Enter holdings manually:</p>
          <button
            onClick={addManualHolding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Holding
          </button>
        </div>
      )}

      {/* Holdings table */}
      {holdings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Entity / PAN</th>
                  <th className="px-3 py-2 text-left">Fund Name</th>
                  <th className="px-3 py-2 text-right">Units</th>
                  <th className="px-3 py-2 text-right">Invested ₹</th>
                  <th className="px-3 py-2 text-right">Current ₹</th>
                  <th className="px-3 py-2 text-left">SIP Start</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holdings.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-1.5">
                      <input
                        value={h.entityName}
                        onChange={(e) => updateHolding(idx, 'entityName', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={h.fundName}
                        onChange={(e) => updateHolding(idx, 'fundName', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={h.units}
                        onChange={(e) => updateHolding(idx, 'units', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs text-right border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={h.investedAmount}
                        onChange={(e) => updateHolding(idx, 'investedAmount', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs text-right border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={h.currentValue}
                        onChange={(e) => updateHolding(idx, 'currentValue', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs text-right border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="date"
                        value={h.firstInvestmentDate ?? ''}
                        onChange={(e) => updateHolding(idx, 'firstInvestmentDate', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => deleteHolding(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-xs">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    <strong>Total ({holdings.length} holdings)</strong>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ₹{holdings.reduce((s, h) => s + h.investedAmount, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ₹{holdings.reduce((s, h) => s + h.currentValue, 0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {holdings.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Next: SIPs
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SIPs TAB
// ─────────────────────────────────────────────────────────────────

interface SipsTabProps {
  sips: RawSip[];
  onChange: (s: RawSip[]) => void;
}

function SipsTab({ sips, onChange }: SipsTabProps) {
  function addSip() {
    onChange([
      ...sips,
      {
        entityName: '',
        fundName: '',
        monthlyAmountInr: 0,
        actualAmountInr: 0,
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        hasStepUp: false,
      },
    ]);
  }

  function updateSip(idx: number, field: keyof RawSip, value: unknown) {
    const next = [...sips];
    next[idx] = { ...next[idx], [field]: value };
    // Auto-update monthly equivalent
    if (field === 'actualAmountInr' || field === 'frequency') {
      const sip = next[idx];
      next[idx].monthlyAmountInr = normaliseSipToMonthly(
        sip.actualAmountInr,
        sip.frequency
      );
    }
    onChange(next);
  }

  function deleteSip(idx: number) {
    onChange(sips.filter((_, i) => i !== idx));
  }

  const totalMonthly = sips
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => sum + s.monthlyAmountInr, 0);

  return (
    <div className="space-y-4">
      {/* Optional notice */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-start gap-2">
        <span className="font-bold text-emerald-900">Optional:</span>
        <span>
          SIPs are not required to save the diagnostic. Skip this tab if the
          client has only lump-sum holdings — click <strong>Save Draft</strong>{' '}
          at the top right to proceed.
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Active SIPs</h3>
          <p className="text-xs text-slate-500">
            Forward cash flows. Total monthly outflow: <strong>₹{totalMonthly.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <button
          onClick={addSip}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add SIP
        </button>
      </div>

      {sips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
          <Repeat className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No SIPs added yet. {sips.length === 0 && holdings_no_sip_hint()}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Entity</th>
                  <th className="px-3 py-2 text-left">Fund</th>
                  <th className="px-3 py-2 text-right">Amount ₹</th>
                  <th className="px-3 py-2 text-left">Frequency</th>
                  <th className="px-3 py-2 text-left">Start Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-center">Step-Up</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sips.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-1.5">
                      <input
                        value={s.entityName}
                        onChange={(e) => updateSip(idx, 'entityName', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={s.fundName}
                        onChange={(e) => updateSip(idx, 'fundName', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={s.actualAmountInr}
                        onChange={(e) => updateSip(idx, 'actualAmountInr', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs text-right border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={s.frequency}
                        onChange={(e) => updateSip(idx, 'frequency', e.target.value as SipFrequency)}
                        className="w-full bg-transparent px-1 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="date"
                        value={s.startDate}
                        onChange={(e) => updateSip(idx, 'startDate', e.target.value)}
                        className="w-full bg-transparent px-1.5 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={s.status}
                        onChange={(e) => updateSip(idx, 'status', e.target.value as RawSip['status'])}
                        className="w-full bg-transparent px-1 py-1 text-xs border border-transparent focus:border-slate-300 rounded"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Stopped">Stopped</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={s.hasStepUp}
                        onChange={(e) => updateSip(idx, 'hasStepUp', e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => deleteSip(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-xs">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    <strong>Total monthly ({sips.filter((s) => s.status === 'Active').length} active)</strong>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ₹{totalMonthly.toLocaleString('en-IN')}/mo
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function holdings_no_sip_hint() {
  return 'CAS PDF parse already extracts active SIPs — they should appear here automatically. You can add more manually.';
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function normaliseSipToMonthly(amount: number, frequency: SipFrequency): number {
  switch (frequency) {
    case 'Monthly': return amount;
    case 'Quarterly': return amount / 3;
    case 'Weekly': return amount * 4.33;
    case 'Daily': return amount * 21;
    case 'One-Time-STP': return 0;
  }
}
