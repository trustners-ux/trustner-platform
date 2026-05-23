'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart3, IndianRupee, Users, TrendingUp, Percent, Building2,
  Search, Plus, X, Loader2, CheckCircle, AlertTriangle,
  Shield, CheckCheck, Upload, FileSpreadsheet,
  ArrowUp, ArrowDown, User, Layers, Calculator,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import { TRAIL_RATES } from '@/lib/mis/types';
import type { AdminRole } from '@/lib/auth/config';
import type {
  TrailEntry, TrailSummary, EmployeeTrailSummary,
  SourceType, FundCategory, TrailStatus,
} from '@/lib/dal/trail-income';
import {
  SOURCE_TYPE_LABELS, FUND_CATEGORY_LABELS, FUND_TRAIL_RATE_DEFAULTS,
} from '@/lib/dal/trail-income';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface AuthUser { email: string; name: string; role: AdminRole }
interface EmployeeOption { id: number; name: string; employeeCode: string; department: string }

type TabId = 'overview' | 'entries' | 'employee' | 'data_entry';
type SortField = 'employeeName' | 'clientName' | 'currentAum' | 'monthlyTrailAmount' | 'rmMonthlyAmount' | 'status';
type SortDir = 'asc' | 'desc';

// ═══════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: string; icon: React.ElementType; color: string; subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </div>
  );
}

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} />;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// Style constants
const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
const selectCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors';

// Role helpers
function isAdmin(role: AdminRole): boolean { return ['super_admin', 'admin'].includes(role); }

// Format short INR
function fmtINR(n: number): string {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
  return `\u20B9${n.toLocaleString('en-IN')}`;
}

// Get current YYYY-MM
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Month display
function fmtMonth(m: string): string {
  const [y, mo] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(mo) - 1]} ${y}`;
}

// Status badge
function StatusBadge({ status }: { status: TrailStatus }) {
  const styles: Record<TrailStatus, string> = {
    draft: 'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

// Source type to TRAIL_RATES display
const SOURCE_RATE_MAP: Record<SourceType, { rm: number; company: number }> = {
  self_new_pan: TRAIL_RATES.selfSourcedNewPan,
  self_existing: TRAIL_RATES.selfSourcedExisting,
  assigned_new: TRAIL_RATES.assignedNewBusiness,
  assigned_no_new: TRAIL_RATES.assignedNoNewBusiness,
  walk_in: TRAIL_RATES.officeWalkIn,
};

// ═══════════════════════════════════════════════════════
// HORIZONTAL BAR CHART
// ═══════════════════════════════════════════════════════

function HorizontalBar({ items, valueFormatter }: {
  items: { label: string; value: number; color: string }[];
  valueFormatter: (v: number) => string;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">{item.label}</span>
            <span className="text-xs font-bold text-slate-700">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ENTRY FORM (reused in Tab 4 + Create Modal)
// ═══════════════════════════════════════════════════════

interface EntryFormProps {
  employees: EmployeeOption[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
  month: string;
}

function TrailEntryForm({ employees, onSubmit, submitting, month }: EntryFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPan, setClientPan] = useState('');
  const [amcName, setAmcName] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [fundCategory, setFundCategory] = useState<FundCategory | ''>('');
  const [currentAum, setCurrentAum] = useState('');
  const [trailRatePct, setTrailRatePct] = useState('');
  const [sourceType, setSourceType] = useState<SourceType | ''>('');
  const [notes, setNotes] = useState('');

  // Auto-suggest trail rate when fund category changes
  useEffect(() => {
    if (fundCategory && !trailRatePct) {
      setTrailRatePct(String(FUND_TRAIL_RATE_DEFAULTS[fundCategory].default));
    }
  }, [fundCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live calculation preview
  const preview = useMemo(() => {
    const aum = parseFloat(currentAum) || 0;
    const rate = parseFloat(trailRatePct) || 0;
    const src = sourceType || 'self_new_pan';
    if (aum <= 0 || rate <= 0) return null;
    const annual = Math.round((aum * rate) / 100);
    const monthly = Math.round(annual / 12);
    const rates = SOURCE_RATE_MAP[src as SourceType] || { rm: 0, company: 100 };
    const rmAmount = Math.round((monthly * rates.rm) / 100);
    const companyAmount = monthly - rmAmount;
    return { annual, monthly, rmPct: rates.rm, rmAmount, companyPct: rates.company, companyAmount };
  }, [currentAum, trailRatePct, sourceType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      action: 'create',
      employeeId: Number(employeeId),
      clientName,
      clientPan: clientPan.toUpperCase(),
      amcName,
      schemeName,
      fundCategory,
      currentAum: parseFloat(currentAum),
      trailRatePct: parseFloat(trailRatePct),
      sourceType,
      month,
      notes: notes || undefined,
    });
    // Reset form
    setEmployeeId(''); setClientName(''); setClientPan(''); setAmcName('');
    setSchemeName(''); setFundCategory(''); setCurrentAum('');
    setTrailRatePct(''); setSourceType(''); setNotes('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee">
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className={selectCls} required>
            <option value="">Select employee...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
            ))}
          </select>
        </Field>
        <Field label="Source Type">
          <select value={sourceType} onChange={e => setSourceType(e.target.value as SourceType)} className={selectCls} required>
            <option value="">Select source...</option>
            {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map(s => (
              <option key={s} value={s}>{SOURCE_TYPE_LABELS[s]} (RM: {SOURCE_RATE_MAP[s].rm}%)</option>
            ))}
          </select>
        </Field>
        <Field label="Client Name">
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} required placeholder="Full name" />
        </Field>
        <Field label="Client PAN">
          <input type="text" value={clientPan} onChange={e => setClientPan(e.target.value.toUpperCase())} className={inputCls} required placeholder="ABCDE1234F" maxLength={10} pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" />
        </Field>
        <Field label="AMC Name">
          <input type="text" value={amcName} onChange={e => setAmcName(e.target.value)} className={inputCls} required placeholder="e.g., SBI Mutual Fund" />
        </Field>
        <Field label="Scheme Name">
          <input type="text" value={schemeName} onChange={e => setSchemeName(e.target.value)} className={inputCls} required placeholder="e.g., SBI Bluechip Fund - Growth" />
        </Field>
        <Field label="Fund Category">
          <select value={fundCategory} onChange={e => { setFundCategory(e.target.value as FundCategory); setTrailRatePct(''); }} className={selectCls} required>
            <option value="">Select category...</option>
            {(Object.keys(FUND_CATEGORY_LABELS) as FundCategory[]).map(c => (
              <option key={c} value={c}>{FUND_CATEGORY_LABELS[c]} ({FUND_TRAIL_RATE_DEFAULTS[c].min}%-{FUND_TRAIL_RATE_DEFAULTS[c].max}%)</option>
            ))}
          </select>
        </Field>
        <Field label="Current AUM" hint="Total assets under management for this scheme">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{'\u20B9'}</span>
            <input type="number" value={currentAum} onChange={e => setCurrentAum(e.target.value)} className={`${inputCls} pl-7`} required min="0" step="1" placeholder="0" />
          </div>
        </Field>
        <Field label="Trail Rate (%)" hint={fundCategory ? `Range: ${FUND_TRAIL_RATE_DEFAULTS[fundCategory].min}% - ${FUND_TRAIL_RATE_DEFAULTS[fundCategory].max}%` : 'Select fund category first'}>
          <input type="number" value={trailRatePct} onChange={e => setTrailRatePct(e.target.value)} className={inputCls} required min="0.01" max="5" step="0.01" placeholder="0.00" />
        </Field>
        <Field label="Notes (optional)">
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Any additional notes..." />
        </Field>
      </div>

      {/* Live Calculation Preview */}
      {preview && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Calculation Preview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Annual Trail</p>
              <p className="font-bold text-slate-700">{formatINR(preview.annual)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Monthly Trail</p>
              <p className="font-bold text-slate-700">{formatINR(preview.monthly)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">RM Share ({preview.rmPct}%)</p>
              <p className="font-bold text-emerald-600">{formatINR(preview.rmAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Company ({preview.companyPct}%)</p>
              <p className="font-bold text-blue-600">{formatINR(preview.companyAmount)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className={btnPrimary} disabled={submitting}>
          {submitting ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {submitting ? 'Creating...' : 'Create Trail Entry'}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════

export default function TrailIncomePage() {
  // ─── Auth State ───
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Tab State ───
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ─── Data State ───
  const [entries, setEntries] = useState<TrailEntry[]>([]);
  const [summary, setSummary] = useState<TrailSummary | null>(null);
  const [empSummary, setEmpSummary] = useState<EmployeeTrailSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Filter State ───
  const [month, setMonth] = useState(currentMonth());
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // ─── Sort State ───
  const [sortField, setSortField] = useState<SortField>('currentAum');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ─── Selection State ───
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ─── Modal State ───
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ─── Toast ───
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => setToast({ message, type }), []);

  // ─── Submitting ───
  const [submitting, setSubmitting] = useState(false);

  // ─── CSV Upload ───
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Auth fetch ───
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ─── Fetch employees ───
  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/mis/employees', { headers: { 'x-admin-email': user.email } })
      .then(r => r.json())
      .then(d => {
        if (d.employees) {
          setEmployees(d.employees.map((e: Record<string, unknown>) => ({
            id: e.id, name: e.name, employeeCode: e.employeeCode, department: e.department,
          })));
        }
      })
      .catch(() => {});
  }, [user]);

  // ─── Fetch trail data ───
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = { 'x-admin-email': user.email };

      // Fetch entries
      const params = new URLSearchParams({ month });
      if (filterEmployee !== 'all') params.set('employeeId', filterEmployee);
      if (filterSource !== 'all') params.set('sourceType', filterSource);
      if (filterCategory !== 'all') params.set('fundCategory', filterCategory);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const [entriesRes, summaryRes] = await Promise.all([
        fetch(`/api/admin/mis/trails?${params}`, { headers }),
        fetch(`/api/admin/mis/trails?view=summary&month=${month}`, { headers }),
      ]);

      const entriesData = await entriesRes.json();
      const summaryData = await summaryRes.json();

      if (entriesData.entries) setEntries(entriesData.entries);
      if (summaryData.summary) setSummary(summaryData.summary);
    } catch {
      showToast('Failed to fetch trail data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, month, filterEmployee, filterSource, filterCategory, filterStatus, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Fetch employee summary ───
  const fetchEmpSummary = useCallback(async () => {
    if (!user || !selectedEmpId) { setEmpSummary(null); return; }
    try {
      const res = await fetch(`/api/admin/mis/trails?view=employee_summary&employeeId=${selectedEmpId}&month=${month}`, {
        headers: { 'x-admin-email': user.email },
      });
      const data = await res.json();
      if (data.summary) setEmpSummary(data.summary);
    } catch {
      showToast('Failed to fetch employee summary', 'error');
    }
  }, [user, selectedEmpId, month, showToast]);

  useEffect(() => { if (activeTab === 'employee') fetchEmpSummary(); }, [activeTab, fetchEmpSummary]);

  // ─── API helpers ───
  async function apiPost(body: Record<string, unknown>, successMsg: string) {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mis/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user.email },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.entry)) {
        showToast(successMsg);
        fetchData();
        if (activeTab === 'employee') fetchEmpSummary();
        setShowCreateModal(false);
        setSelectedIds(new Set());
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: number) {
    await apiPost({ action: 'approve', id }, 'Entry approved');
  }

  async function handleBulkApprove() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await apiPost({ action: 'bulk_approve', ids }, `${ids.length} entries approved`);
  }

  async function handleCreateEntry(data: Record<string, unknown>) {
    await apiPost(data, 'Trail entry created');
  }

  // ─── CSV handlers ───
  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvErrors([]);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setCsvErrors(['CSV must have a header row and at least one data row']);
        return;
      }
      const rows = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      setCsvRows(rows);
    };
    reader.readAsText(file);
  }

  async function handleCsvUpload() {
    if (!user || csvRows.length < 2) return;
    setUploading(true);
    const errors: string[] = [];
    let imported = 0;

    const headers = csvRows[0].map(h => h.toLowerCase());
    const empIdx = headers.findIndex(h => h.includes('employee'));
    const clientIdx = headers.findIndex(h => h.includes('client'));
    const panIdx = headers.findIndex(h => h.includes('pan'));
    const amcIdx = headers.findIndex(h => h.includes('amc'));
    const schemeIdx = headers.findIndex(h => h.includes('scheme'));
    const aumIdx = headers.findIndex(h => h.includes('aum'));
    const rateIdx = headers.findIndex(h => h.includes('rate'));
    const sourceIdx = headers.findIndex(h => h.includes('source'));
    const categoryIdx = headers.findIndex(h => h.includes('categor') || h.includes('fund'));

    for (let i = 1; i < csvRows.length; i++) {
      const row = csvRows[i];
      try {
        const empName = empIdx >= 0 ? row[empIdx] : '';
        const emp = employees.find(e => e.name.toLowerCase().includes(empName.toLowerCase()));
        if (!emp) { errors.push(`Row ${i}: Employee "${empName}" not found`); continue; }

        const aum = aumIdx >= 0 ? parseFloat(row[aumIdx]) : 0;
        if (aum <= 0) { errors.push(`Row ${i}: Invalid AUM`); continue; }

        const rate = rateIdx >= 0 ? parseFloat(row[rateIdx]) : 0;
        if (rate <= 0) { errors.push(`Row ${i}: Invalid trail rate`); continue; }

        const sourceRaw = sourceIdx >= 0 ? row[sourceIdx]?.toLowerCase().replace(/\s+/g, '_') : 'self_new_pan';
        const validSources: SourceType[] = ['self_new_pan', 'self_existing', 'assigned_new', 'assigned_no_new', 'walk_in'];
        const source = validSources.includes(sourceRaw as SourceType) ? sourceRaw as SourceType : 'self_new_pan';

        const catRaw = categoryIdx >= 0 ? row[categoryIdx]?.toLowerCase().replace(/\s+/g, '_') : 'equity_active';
        const validCats: FundCategory[] = ['equity_active', 'equity_index', 'hybrid', 'debt', 'liquid'];
        const category = validCats.includes(catRaw as FundCategory) ? catRaw as FundCategory : 'equity_active';

        const res = await fetch('/api/admin/mis/trails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-email': user.email },
          body: JSON.stringify({
            action: 'create',
            employeeId: emp.id,
            clientName: clientIdx >= 0 ? row[clientIdx] : 'Unknown',
            clientPan: panIdx >= 0 ? row[panIdx]?.toUpperCase() : 'XXXXXX0000',
            amcName: amcIdx >= 0 ? row[amcIdx] : 'Unknown AMC',
            schemeName: schemeIdx >= 0 ? row[schemeIdx] : 'Unknown Scheme',
            fundCategory: category,
            currentAum: aum,
            trailRatePct: rate,
            sourceType: source,
            month,
          }),
        });
        if (res.ok) imported++; else errors.push(`Row ${i}: API error`);
      } catch {
        errors.push(`Row ${i}: Parse error`);
      }
    }

    setUploadResult({ imported, errors });
    setUploading(false);
    if (imported > 0) { showToast(`${imported} entries imported`); fetchData(); }
  }

  // ─── Filtered + sorted entries ───
  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.clientName.toLowerCase().includes(q) ||
        e.employeeName.toLowerCase().includes(q) ||
        e.schemeName.toLowerCase().includes(q) ||
        e.amcName.toLowerCase().includes(q) ||
        e.clientPan.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'employeeName': cmp = a.employeeName.localeCompare(b.employeeName); break;
        case 'clientName': cmp = a.clientName.localeCompare(b.clientName); break;
        case 'currentAum': cmp = a.currentAum - b.currentAum; break;
        case 'monthlyTrailAmount': cmp = a.monthlyTrailAmount - b.monthlyTrailAmount; break;
        case 'rmMonthlyAmount': cmp = a.rmMonthlyAmount - b.rmMonthlyAmount; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [entries, searchQuery, sortField, sortDir]);

  // ─── Toggle sort ───
  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUp className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary-600" /> : <ArrowDown className="w-3 h-3 text-primary-600" />;
  }

  // ─── Select all / toggle row ───
  function toggleSelectAll() {
    const approvable = filteredEntries.filter(e => e.status !== 'approved');
    if (selectedIds.size === approvable.length && approvable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(approvable.map(e => e.id)));
    }
  }
  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ─── Bar chart colors ───
  const barColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500'];

  // ─── Auth gate ───
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Please log in to access the Trail Income Dashboard</p>
        </div>
      </div>
    );
  }

  // ─── Tab config ───
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'entries', label: 'Trail Entries', icon: Layers },
    { id: 'employee', label: 'Employee Report', icon: User },
    { id: 'data_entry', label: 'MF Data Entry', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Trail Income Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">MF trail commission tracking for ARN-286886</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Month:</label>
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <button onClick={() => setShowCreateModal(true)} className={btnPrimary}>
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-[1px]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-white border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && !summary ? (
          <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : (
          <>
            {/* ═══ TAB 1: OVERVIEW ═══ */}
            {activeTab === 'overview' && summary && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total AUM" value={fmtINR(summary.totalAum)} icon={IndianRupee} color="bg-blue-600" subtext={`${summary.entryCount} schemes tracked`} />
                  <StatCard label="Monthly Trail Income" value={fmtINR(summary.totalMonthlyTrail)} icon={TrendingUp} color="bg-emerald-600" subtext={`Annual: ${fmtINR(summary.totalAnnualTrail)}`} />
                  <StatCard label="RM Share (Total)" value={fmtINR(summary.rmShare)} icon={Users} color="bg-purple-600" subtext="Distributed to RMs" />
                  <StatCard label="Company Share" value={fmtINR(summary.companyShare)} icon={Building2} color="bg-amber-600" subtext="Retained by Trustner" />
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By Source Type */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      Trail by Source Type
                    </h3>
                    <HorizontalBar
                      items={summary.bySourceType.map((s, i) => ({
                        label: s.label,
                        value: s.aum,
                        color: barColors[i % barColors.length],
                      }))}
                      valueFormatter={fmtINR}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {summary.bySourceType.map(s => (
                          <div key={s.sourceType} className="flex justify-between">
                            <span className="text-slate-500">{s.label}</span>
                            <span className="font-medium text-slate-700">{fmtINR(s.monthlyTrail)}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* By Fund Category */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      Trail by Fund Category
                    </h3>
                    <HorizontalBar
                      items={summary.byFundCategory.map((c, i) => ({
                        label: c.label,
                        value: c.aum,
                        color: barColors[i % barColors.length],
                      }))}
                      valueFormatter={fmtINR}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {summary.byFundCategory.map(c => (
                          <div key={c.category} className="flex justify-between">
                            <span className="text-slate-500">{c.label}</span>
                            <span className="font-medium text-slate-700">{c.entryCount} schemes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Leaderboard */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Employee Trail Portfolio — {fmtMonth(month)}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-3">#</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-3">Employee</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 px-3">AUM</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 px-3">Monthly Trail</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 px-3">RM Share</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 px-3">Company Share</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 px-3">Clients</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.byEmployee.map((emp, i) => (
                          <tr key={emp.employeeId} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-sm text-slate-400">{i + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
                                  {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{emp.employeeName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-sm font-mono text-slate-700">{fmtINR(emp.aum)}</td>
                            <td className="py-2.5 px-3 text-right text-sm font-mono text-slate-700">{formatINR(emp.monthlyTrail)}</td>
                            <td className="py-2.5 px-3 text-right text-sm font-mono text-emerald-600">{formatINR(emp.rmShare)}</td>
                            <td className="py-2.5 px-3 text-right text-sm font-mono text-blue-600">{formatINR(emp.companyShare)}</td>
                            <td className="py-2.5 px-3 text-right text-sm text-slate-500">{emp.clientCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Trail Rate Distribution Reference */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-400" />
                    RM vs Company Split Reference
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map(s => {
                      const rates = SOURCE_RATE_MAP[s];
                      return (
                        <div key={s} className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs font-medium text-slate-500 mb-2">{SOURCE_TYPE_LABELS[s]}</p>
                          <div className="flex items-center justify-center gap-2">
                            <div>
                              <p className="text-lg font-bold text-emerald-600">{rates.rm}%</p>
                              <p className="text-[10px] text-slate-400">RM</p>
                            </div>
                            <span className="text-slate-300">/</span>
                            <div>
                              <p className="text-lg font-bold text-blue-600">{rates.company}%</p>
                              <p className="text-[10px] text-slate-400">Company</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 2: TRAIL ENTRIES ═══ */}
            {activeTab === 'entries' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={`${inputCls} pl-9`}
                        placeholder="Search client, employee, scheme, AMC, PAN..."
                      />
                    </div>
                    <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className={`${selectCls} w-auto max-w-[180px]`}>
                      <option value="all">All Employees</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={`${selectCls} w-auto max-w-[180px]`}>
                      <option value="all">All Sources</option>
                      {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map(s => (
                        <option key={s} value={s}>{SOURCE_TYPE_LABELS[s]}</option>
                      ))}
                    </select>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${selectCls} w-auto max-w-[160px]`}>
                      <option value="all">All Categories</option>
                      {(Object.keys(FUND_CATEGORY_LABELS) as FundCategory[]).map(c => (
                        <option key={c} value={c}>{FUND_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${selectCls} w-auto max-w-[140px]`}>
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>

                  {/* Bulk actions */}
                  {isAdmin(user.role) && selectedIds.size > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                      <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
                      <button onClick={handleBulkApprove} className={btnPrimary} disabled={submitting}>
                        {submitting ? <Spinner className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
                        Approve Selected
                      </button>
                      <button onClick={() => setSelectedIds(new Set())} className={btnSecondary}>
                        <X className="w-4 h-4" /> Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{filteredEntries.length} entries for {fmtMonth(month)}</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          {isAdmin(user.role) && (
                            <th className="px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={selectedIds.size > 0 && selectedIds.size === filteredEntries.filter(e => e.status !== 'approved').length}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300"
                              />
                            </th>
                          )}
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('employeeName')}>
                            <span className="inline-flex items-center gap-1">Employee <SortIcon field="employeeName" /></span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('clientName')}>
                            <span className="inline-flex items-center gap-1">Client <SortIcon field="clientName" /></span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">PAN</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Scheme</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">AMC</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('currentAum')}>
                            <span className="inline-flex items-center gap-1 justify-end">AUM <SortIcon field="currentAum" /></span>
                          </th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Rate</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('monthlyTrailAmount')}>
                            <span className="inline-flex items-center gap-1 justify-end">Trail/Mo <SortIcon field="monthlyTrailAmount" /></span>
                          </th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('rmMonthlyAmount')}>
                            <span className="inline-flex items-center gap-1 justify-end">RM Share <SortIcon field="rmMonthlyAmount" /></span>
                          </th>
                          <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                            <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                          </th>
                          {isAdmin(user.role) && <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="text-center py-12 text-slate-400">
                              No trail entries found for {fmtMonth(month)}
                            </td>
                          </tr>
                        ) : (
                          filteredEntries.map(entry => (
                            <tr key={entry.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                              {isAdmin(user.role) && (
                                <td className="px-3 py-2.5">
                                  {entry.status !== 'approved' ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(entry.id)}
                                      onChange={() => toggleSelect(entry.id)}
                                      className="rounded border-slate-300"
                                    />
                                  ) : <span className="w-4 h-4 block" />}
                                </td>
                              )}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[9px] font-bold">
                                    {entry.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">{entry.employeeName}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-sm text-slate-600">{entry.clientName}</td>
                              <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{entry.clientPan}</td>
                              <td className="px-3 py-2.5 text-sm text-slate-600 max-w-[180px] truncate" title={entry.schemeName}>{entry.schemeName}</td>
                              <td className="px-3 py-2.5 text-sm text-slate-500">{entry.amcName}</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-700">{fmtINR(entry.currentAum)}</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-500">{entry.trailRatePct}%</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-700">{formatINR(entry.monthlyTrailAmount)}</td>
                              <td className="px-3 py-2.5 text-right text-sm font-mono text-emerald-600">{formatINR(entry.rmMonthlyAmount)}</td>
                              <td className="px-3 py-2.5 text-center"><StatusBadge status={entry.status} /></td>
                              {isAdmin(user.role) && (
                                <td className="px-3 py-2.5 text-center">
                                  {entry.status !== 'approved' ? (
                                    <button
                                      onClick={() => handleApprove(entry.id)}
                                      className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                                      title="Approve"
                                      disabled={submitting}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">Approved</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 3: EMPLOYEE TRAIL REPORT ═══ */}
            {activeTab === 'employee' && (
              <div className="space-y-5">
                {/* Employee Selector */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <Field label="Select Employee">
                    <select
                      value={selectedEmpId}
                      onChange={e => setSelectedEmpId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode}) — {emp.department}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {!selectedEmpId && (
                  <div className="text-center py-16">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">Select an employee above to view their trail portfolio</p>
                  </div>
                )}

                {selectedEmpId && !empSummary && (
                  <div className="flex items-center justify-center py-16"><Spinner className="w-8 h-8" /></div>
                )}

                {empSummary && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StatCard label="Total AUM Managed" value={fmtINR(empSummary.totalAum)} icon={IndianRupee} color="bg-blue-600" subtext={`${empSummary.clientCount} clients`} />
                      <StatCard label="Monthly RM Trail" value={formatINR(empSummary.totalRmShare)} icon={TrendingUp} color="bg-emerald-600" subtext={`Total trail: ${formatINR(empSummary.totalMonthlyTrail)}`} />
                      <StatCard label="Schemes Managed" value={String(empSummary.entries.length)} icon={Layers} color="bg-purple-600" subtext={`For ${fmtMonth(month)}`} />
                    </div>

                    {/* Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">By Source Type</h3>
                        {empSummary.bySourceType.length === 0 ? (
                          <p className="text-sm text-slate-400">No data</p>
                        ) : (
                          <div className="space-y-2">
                            {empSummary.bySourceType.map(s => (
                              <div key={s.sourceType} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">{s.label} ({s.count})</span>
                                <span className="font-mono text-slate-700">{fmtINR(s.aum)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">By Fund Category</h3>
                        {empSummary.byFundCategory.length === 0 ? (
                          <p className="text-sm text-slate-400">No data</p>
                        ) : (
                          <div className="space-y-2">
                            {empSummary.byFundCategory.map(c => (
                              <div key={c.category} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">{c.label} ({c.count})</span>
                                <span className="font-mono text-slate-700">{fmtINR(c.aum)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employee Entries Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700">{empSummary.employeeName} — Trail Entries ({fmtMonth(month)})</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Client</th>
                              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">PAN</th>
                              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Scheme</th>
                              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Source</th>
                              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Category</th>
                              <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">AUM</th>
                              <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Rate</th>
                              <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Trail/Mo</th>
                              <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">RM Share</th>
                              <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empSummary.entries.length === 0 ? (
                              <tr><td colSpan={10} className="text-center py-8 text-slate-400">No entries for this employee in {fmtMonth(month)}</td></tr>
                            ) : (
                              empSummary.entries.map(entry => (
                                <tr key={entry.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-3 py-2.5 text-sm text-slate-700 font-medium">{entry.clientName}</td>
                                  <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{entry.clientPan}</td>
                                  <td className="px-3 py-2.5 text-sm text-slate-600 max-w-[180px] truncate" title={entry.schemeName}>{entry.schemeName}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{SOURCE_TYPE_LABELS[entry.sourceType]?.split(' ').slice(0, 2).join(' ')}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">{FUND_CATEGORY_LABELS[entry.fundCategory]}</td>
                                  <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-700">{fmtINR(entry.currentAum)}</td>
                                  <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-500">{entry.trailRatePct}%</td>
                                  <td className="px-3 py-2.5 text-right text-sm font-mono text-slate-700">{formatINR(entry.monthlyTrailAmount)}</td>
                                  <td className="px-3 py-2.5 text-right text-sm font-mono text-emerald-600">{formatINR(entry.rmMonthlyAmount)}</td>
                                  <td className="px-3 py-2.5 text-center"><StatusBadge status={entry.status} /></td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══ TAB 4: MF DATA ENTRY ═══ */}
            {activeTab === 'data_entry' && (
              <div className="space-y-6">
                {/* Manual Entry Form */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-slate-400" />
                    Add Trail Entry — {fmtMonth(month)}
                  </h3>
                  <TrailEntryForm
                    employees={employees}
                    onSubmit={handleCreateEntry}
                    submitting={submitting}
                    month={month}
                  />
                </div>

                {/* CSV Bulk Upload */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-400" />
                    Bulk Upload (CSV)
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Upload a CSV file with columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">Employee, Client, PAN, AMC, Scheme, AUM, Rate, Source, Fund Category</code>
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFile}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {csvRows.length > 1 && (
                      <button onClick={() => { setCsvRows([]); setCsvErrors([]); setUploadResult(null); if (fileRef.current) fileRef.current.value = ''; }} className={btnSecondary}>
                        <X className="w-4 h-4" /> Clear
                      </button>
                    )}
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      {csvErrors.map((err, i) => <p key={i} className="text-xs text-red-600">{err}</p>)}
                    </div>
                  )}

                  {csvRows.length > 1 && (
                    <>
                      {/* Preview */}
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-slate-600 mb-2">{csvRows.length - 1} rows detected. Headers: {csvRows[0].join(', ')}</p>
                        <div className="overflow-x-auto max-h-48">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                {csvRows[0].map((h, i) => (
                                  <th key={i} className="text-left px-2 py-1 font-semibold text-slate-500 border-b border-slate-200">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.slice(1, 6).map((row, ri) => (
                                <tr key={ri} className="border-b border-slate-100">
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="px-2 py-1 text-slate-600">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {csvRows.length > 6 && <p className="text-xs text-slate-400 mt-1">...and {csvRows.length - 6} more rows</p>}
                        </div>
                      </div>

                      <button onClick={handleCsvUpload} className={btnPrimary} disabled={uploading}>
                        {uploading ? <Spinner className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                        {uploading ? 'Importing...' : `Import ${csvRows.length - 1} Entries`}
                      </button>
                    </>
                  )}

                  {uploadResult && (
                    <div className={`mt-3 p-3 rounded-lg border ${uploadResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className="text-sm font-medium text-slate-700">
                        {uploadResult.imported} entries imported successfully
                        {uploadResult.errors.length > 0 && `, ${uploadResult.errors.length} errors`}
                      </p>
                      {uploadResult.errors.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {uploadResult.errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-600">{err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AMC Trail Rate Reference */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-400" />
                    AMC Trail Rate Reference
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(Object.keys(FUND_CATEGORY_LABELS) as FundCategory[]).map(cat => {
                      const rates = FUND_TRAIL_RATE_DEFAULTS[cat];
                      return (
                        <div key={cat} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-700 mb-1">{FUND_CATEGORY_LABELS[cat]}</p>
                          <p className="text-lg font-bold text-primary-600">{rates.min}% — {rates.max}%</p>
                          <p className="text-[10px] text-slate-400">Default: {rates.default}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ CREATE ENTRY MODAL ═══ */}
      {showCreateModal && (
        <Modal title={`New Trail Entry — ${fmtMonth(month)}`} onClose={() => setShowCreateModal(false)} wide>
          <TrailEntryForm
            employees={employees}
            onSubmit={handleCreateEntry}
            submitting={submitting}
            month={month}
          />
        </Modal>
      )}
    </div>
  );
}
