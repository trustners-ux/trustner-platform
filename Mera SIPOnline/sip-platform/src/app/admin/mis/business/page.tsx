'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Loader2, CheckCircle, IndianRupee, FileText, AlertCircle,
  Calendar, Package, Building2, User, Hash, ToggleLeft, ToggleRight,
  Upload, X, FileSpreadsheet, Check, Trash2, ChevronDown, Filter,
  Download, AlertTriangle, ArrowUpDown,
} from 'lucide-react';
import { PRODUCTS } from '@/lib/mis/employee-data';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { MonthlyBusinessEntry } from '@/lib/mis/types';
import type { ColumnMapping, SystemField, FileFormat } from '@/lib/utils/csv-parser';

interface EmployeeOption {
  id: number;
  employeeCode: string;
  name: string;
  designation: string;
  entity: string;
  segment: string;
}

interface PreviewRow {
  rowIndex: number;
  employeeName?: string;
  employeeCode?: string;
  employeeId?: number;
  productName?: string;
  productId?: number;
  amount?: number;
  clientName?: string;
  policyNumber?: string;
  insurer?: string;
  channelPayoutPct?: number;
  fpRoute?: boolean;
  raw: string[];
  error?: string;
}

interface UploadPreview {
  format: FileFormat;
  headers: string[];
  columnMapping: ColumnMapping;
  preview: PreviewRow[];
  totalRows: number;
  stats: { total: number; valid: number; invalid: number };
  month: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface BusinessEntryExt extends MonthlyBusinessEntry {
  status?: string;
  employeeName?: string;
}

// ─── Helper: Current month in YYYY-MM ───
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── System fields for column mapping dropdown ───
const SYSTEM_FIELDS: { value: SystemField; label: string }[] = [
  { value: 'ignore', label: '-- Ignore --' },
  { value: 'employeeName', label: 'Employee Name' },
  { value: 'employeeCode', label: 'Employee Code' },
  { value: 'product', label: 'Product' },
  { value: 'amount', label: 'Amount / Premium' },
  { value: 'clientName', label: 'Client Name' },
  { value: 'policyNumber', label: 'Policy / Folio No' },
  { value: 'insurer', label: 'Insurer / AMC' },
  { value: 'channelPayoutPct', label: 'Channel Payout %' },
  { value: 'fpRoute', label: 'FP Route' },
  { value: 'date', label: 'Date (ignored)' },
  { value: 'status', label: 'Status (ignored)' },
];

export default function AdminBusinessPage() {
  // ─── Employees ───
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // ─── Manual Entry Form ───
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(0);
  const [entryMonth, setEntryMonth] = useState(getCurrentMonth());
  const [productId, setProductId] = useState(0);
  const [rawAmount, setRawAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurer, setInsurer] = useState('');
  const [channelPayoutPct, setChannelPayoutPct] = useState(0);
  const [isFpRoute, setIsFpRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // ─── CSV Upload ───
  const [uploadStep, setUploadStep] = useState<'idle' | 'preview' | 'importing' | 'done'>('idle');
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadMonth, setUploadMonth] = useState(getCurrentMonth());
  const [uploadEmployeeId, setUploadEmployeeId] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // ─── Business Table ───
  const [entries, setEntries] = useState<BusinessEntryExt[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [tableMonth, setTableMonth] = useState(getCurrentMonth());
  const [tableEmployeeId, setTableEmployeeId] = useState(0);
  const [tableCategory, setTableCategory] = useState('');
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // ─── Tab ───
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');

  // ─── Load employees on mount ───
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch('/api/mis/business-entries?_employees=1');
        // We'll use a dedicated employees endpoint if it exists, otherwise fetch from entries API
      } catch { /* ignore */ }

      // Fallback: fetch employee list from a simple endpoint
      try {
        const res = await fetch('/api/admin/mis/business/upload', { method: 'OPTIONS' });
        // This won't work; instead load from entries API param
      } catch { /* ignore */ }

      // Load employees from the entries endpoint with admin privileges
      try {
        const res = await fetch('/api/mis/business-entries?month=' + getCurrentMonth());
        if (res.ok) {
          // We have admin access
        }
      } catch { /* ignore */ }

      setLoadingEmployees(false);
    }

    // Directly fetch employee list
    fetchEmployees();
    fetchEntries(tableMonth, tableEmployeeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEmployees() {
    try {
      setLoadingEmployees(true);
      // Use the MIS business entries endpoint which checks admin auth
      // We need a dedicated employees API - let's call the business entries API
      // The admin middleware sets x-admin-email header, so we're authenticated
      const res = await fetch('/api/admin/mis/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      // fallback empty
    } finally {
      setLoadingEmployees(false);
    }
  }

  const fetchEntries = useCallback(async (month: string, empId: number) => {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (empId) params.set('employeeId', String(empId));
      const res = await fetch(`/api/mis/business-entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(tableMonth, tableEmployeeId);
  }, [tableMonth, tableEmployeeId, fetchEntries]);

  // ─── Products grouped by category ───
  const productsByCategory = useMemo(() => {
    const groups: Record<string, typeof PRODUCTS> = {};
    for (const p of PRODUCTS) {
      if (!groups[p.productCategory]) groups[p.productCategory] = [];
      groups[p.productCategory].push(p);
    }
    return groups;
  }, []);

  const selectedProduct = PRODUCTS.find(p => p.id === productId);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const isChannelRM = selectedEmployee?.segment === 'CDM/POSP RM' || selectedEmployee?.segment === 'Area Manager';

  // ─── Summary calculations ───
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (tableCategory) {
      const catProductIds = PRODUCTS.filter(p => p.productCategory === tableCategory).map(p => p.id);
      result = result.filter(e => catProductIds.includes(e.productId));
    }
    return result;
  }, [entries, tableCategory]);

  const summaryStats = useMemo(() => {
    const totalRaw = filteredEntries.reduce((s, e) => s + e.rawAmount, 0);
    const totalWeighted = filteredEntries.reduce((s, e) => s + e.weightedAmount, 0);
    const byCategory: Record<string, { raw: number; weighted: number; count: number }> = {};
    for (const entry of filteredEntries) {
      const product = PRODUCTS.find(p => p.id === entry.productId);
      const cat = product?.productCategory || 'Unknown';
      if (!byCategory[cat]) byCategory[cat] = { raw: 0, weighted: 0, count: 0 };
      byCategory[cat].raw += entry.rawAmount;
      byCategory[cat].weighted += entry.weightedAmount;
      byCategory[cat].count++;
    }
    return { totalRaw, totalWeighted, count: filteredEntries.length, byCategory };
  }, [filteredEntries]);

  // ─── Manual Entry Submit ───
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !productId || !rawAmount) return;

    setSaving(true);
    setFormSuccess('');
    setFormError('');

    try {
      const res = await fetch('/api/mis/business-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          month: entryMonth,
          productId,
          rawAmount: parseFloat(rawAmount),
          clientName: clientName || undefined,
          policyNumber: policyNumber || undefined,
          insurer: insurer || undefined,
          channelPayoutPct: isChannelRM ? channelPayoutPct : 0,
          isFpRoute,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const { entry } = await res.json();
      setFormSuccess(`Entry saved! Weighted: ${formatINR(entry.weightedAmount)}`);

      // Reset form (keep employee + month)
      setProductId(0);
      setRawAmount('');
      setClientName('');
      setPolicyNumber('');
      setInsurer('');
      setChannelPayoutPct(0);
      setIsFpRoute(false);

      // Refresh table
      fetchEntries(tableMonth, tableEmployeeId);

      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setFormError(msg);
      setTimeout(() => setFormError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // ─── CSV Upload Handlers ───
  const handleFileSelect = async (file: File) => {
    setUploadError('');
    setUploadLoading(true);
    setUploadStep('idle');
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', uploadMonth);
      if (uploadEmployeeId) {
        formData.append('employeeId', String(uploadEmployeeId));
      }

      const res = await fetch('/api/admin/mis/business/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const preview = await res.json() as UploadPreview;
      setUploadPreview(preview);
      setUploadStep('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleMappingChange = (header: string, field: SystemField) => {
    if (!uploadPreview) return;
    setUploadPreview({
      ...uploadPreview,
      columnMapping: { ...uploadPreview.columnMapping, [header]: field },
    });
  };

  const handleExecuteImport = async () => {
    if (!uploadPreview) return;

    setUploadStep('importing');
    setUploadError('');

    try {
      // Only send valid rows
      const validRows = uploadPreview.preview.filter(r => !r.error);

      const res = await fetch('/api/admin/mis/business/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows,
          month: uploadPreview.month,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const result = await res.json() as ImportResult;
      setImportResult(result);
      setUploadStep('done');

      // Refresh table
      fetchEntries(tableMonth, tableEmployeeId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setUploadError(msg);
      setUploadStep('preview');
    }
  };

  const resetUpload = () => {
    setUploadStep('idle');
    setUploadPreview(null);
    setImportResult(null);
    setUploadError('');
  };

  // ─── Table Actions ───
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    setDeletingIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/mis/business-entries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    } catch { /* ignore */ } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Render ───
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Business Data Entry</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage MF and Insurance business entries for all employees
          </p>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Entries</p>
            <p className="text-lg font-bold text-slate-700">{summaryStats.count}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Raw Business</p>
            <p className="text-lg font-bold text-slate-700">{formatINR(summaryStats.totalRaw)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Weighted Business</p>
            <p className="text-lg font-bold text-emerald-600">{formatINR(summaryStats.totalWeighted)}</p>
          </div>
          {/* Category breakdown */}
          {Object.entries(summaryStats.byCategory).map(([cat, data]) => (
            <div key={cat} className="hidden sm:block border-l border-slate-200 pl-4">
              <p className="text-[10px] text-slate-400 uppercase font-bold">{cat}</p>
              <p className="text-sm font-semibold text-slate-600">
                {formatINR(data.weighted)} <span className="text-[10px] text-slate-400">({data.count})</span>
              </p>
            </div>
          ))}
          <div className="ml-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar className="w-3 h-3 inline mr-1" />
              {tableMonth}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Manual Entry | CSV Upload */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-1.5" />Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-1.5" />CSV Upload
        </button>
      </div>

      {/* ─── Section A: Manual Entry ─── */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" />
            New Business Entry (Admin)
          </h2>

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">{formSuccess}</p>
            </div>
          )}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <User className="w-3 h-3 inline mr-1" />Employee *
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value={0}>Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode}) — {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />Month *
              </label>
              <input
                type="month"
                value={entryMonth}
                onChange={(e) => setEntryMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Package className="w-3 h-3 inline mr-1" />Product *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value={0}>Select product...</option>
                {Object.entries(productsByCategory).map(([cat, prods]) => (
                  <optgroup key={cat} label={cat}>
                    {prods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.productName} (Credit: {p.creditPct}%)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedProduct && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Tier {selectedProduct.tier} | Credit: {selectedProduct.creditPct}% | Multiplier: {selectedProduct.tier === 1 ? '100%' : selectedProduct.tier === 2 ? '75%' : '50%'}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <IndianRupee className="w-3 h-3 inline mr-1" />Premium / Amount *
              </label>
              <input
                type="number"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                min={1}
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <User className="w-3 h-3 inline mr-1" />Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Policy Number */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Hash className="w-3 h-3 inline mr-1" />Policy / Folio Number
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Policy number"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Insurer */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Building2 className="w-3 h-3 inline mr-1" />Insurer / AMC
              </label>
              <input
                type="text"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                placeholder="e.g. TATA AIA, Star Health, SBI MF"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Channel Payout */}
            {isChannelRM && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Channel Payout %
                </label>
                <select
                  value={channelPayoutPct}
                  onChange={(e) => setChannelPayoutPct(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value={0}>Direct (0% payout)</option>
                  <option value={60}>Sub-broker (60%)</option>
                  <option value={70}>POSP Normal (70%)</option>
                  <option value={80}>POSP Higher Pay / Digital (80%)</option>
                  <option value={85}>Franchise (85%)</option>
                </select>
              </div>
            )}

            {/* FP Route Toggle */}
            <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <div>
                <p className="text-xs font-medium text-purple-700">FP Route (125% bonus)</p>
                <p className="text-[10px] text-purple-500">Complete Financial Plan done?</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFpRoute(!isFpRoute)}
                className="text-purple-600"
              >
                {isFpRoute ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedEmployeeId || !productId || !rawAmount}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="w-4 h-4" /> Add Entry</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─── Section B: CSV Upload ─── */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            Bulk CSV Upload
          </h2>

          {uploadStep === 'idle' && (
            <>
              {/* Pre-upload options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />Month
                  </label>
                  <input
                    type="month"
                    value={uploadMonth}
                    onChange={(e) => setUploadMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <User className="w-3 h-3 inline mr-1" />Override Employee (optional)
                  </label>
                  <select
                    value={uploadEmployeeId}
                    onChange={(e) => setUploadEmployeeId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={0}>Auto-detect from CSV</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Set this to assign all rows to one employee
                  </p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {uploadLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-slate-600 font-medium">Parsing file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <p className="text-sm text-slate-600 font-medium">
                      Drop a CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports MF statements, Insurance MIS, or generic business data
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{uploadError}</p>
                </div>
              )}
            </>
          )}

          {/* Preview Step */}
          {uploadStep === 'preview' && uploadPreview && (
            <div className="space-y-4">
              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-medium text-slate-600">
                  Format: <span className="font-bold text-blue-600 uppercase">{uploadPreview.format}</span>
                </span>
                <span className="text-xs font-medium text-slate-600">
                  Total rows: <span className="font-bold">{uploadPreview.stats.total}</span>
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  <Check className="w-3 h-3 inline mr-0.5" />Valid: {uploadPreview.stats.valid}
                </span>
                <span className="text-xs font-medium text-red-600">
                  <AlertTriangle className="w-3 h-3 inline mr-0.5" />Invalid: {uploadPreview.stats.invalid}
                </span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={resetUpload}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <X className="w-3 h-3 inline mr-1" />Cancel
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={uploadPreview.stats.valid === 0}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    Import {uploadPreview.stats.valid} rows
                  </button>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 mb-2">Column Mapping</h3>
                <div className="flex flex-wrap gap-2">
                  {uploadPreview.headers.map(header => (
                    <div key={header} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1.5">
                      <span className="text-[10px] font-medium text-slate-500 max-w-[100px] truncate" title={header}>
                        {header}
                      </span>
                      <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                      <select
                        value={uploadPreview.columnMapping[header] || 'ignore'}
                        onChange={(e) => handleMappingChange(header, e.target.value as SystemField)}
                        className="text-[10px] border border-slate-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-emerald-500"
                      >
                        {SYSTEM_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Row</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Employee</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Product</th>
                      <th className="px-2 py-2 text-right font-bold text-slate-500">Amount</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Client</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Policy/Folio</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Insurer</th>
                      <th className="px-2 py-2 text-left font-bold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.preview.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`border-t border-slate-100 ${row.error ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-2 py-1.5 text-slate-400">{row.rowIndex}</td>
                        <td className="px-2 py-1.5">
                          {row.employeeId ? (
                            <span className="text-slate-700 font-medium">{row.employeeName}</span>
                          ) : (
                            <span className="text-red-500">{row.employeeName || row.employeeCode || '?'}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.productId ? (
                            <span className="text-slate-700">{row.productName}</span>
                          ) : (
                            <span className="text-red-500">{row.productName || '?'}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {row.amount ? formatINR(row.amount) : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{row.clientName || '—'}</td>
                        <td className="px-2 py-1.5 text-slate-600">{row.policyNumber || '—'}</td>
                        <td className="px-2 py-1.5 text-slate-600">{row.insurer || '—'}</td>
                        <td className="px-2 py-1.5">
                          {row.error ? (
                            <span className="text-[10px] text-red-600 font-medium">{row.error}</span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <Check className="w-3 h-3" />OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {uploadPreview.totalRows > 100 && (
                <p className="text-[10px] text-slate-400 text-center">
                  Showing first 100 of {uploadPreview.totalRows} rows
                </p>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{uploadError}</p>
                </div>
              )}
            </div>
          )}

          {/* Importing */}
          {uploadStep === 'importing' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">Importing entries...</p>
            </div>
          )}

          {/* Done */}
          {uploadStep === 'done' && importResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <p className="text-lg font-bold text-slate-700">Import Complete</p>
                <div className="flex gap-6 text-sm">
                  <span className="text-emerald-600 font-bold">
                    {importResult.imported} imported
                  </span>
                  {importResult.skipped > 0 && (
                    <span className="text-amber-600 font-bold">
                      {importResult.skipped} skipped
                    </span>
                  )}
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-700 mb-2">Errors ({importResult.errors.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-amber-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Section C: Business Overview Table ─── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Business Entries
          </h2>

          <div className="flex items-center gap-2 ml-auto">
            {/* Month filter */}
            <input
              type="month"
              value={tableMonth}
              onChange={(e) => setTableMonth(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
            />
            {/* Employee filter */}
            <select
              value={tableEmployeeId}
              onChange={(e) => setTableEmployeeId(Number(e.target.value))}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 max-w-[180px]"
            >
              <option value={0}>All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            {/* Category filter */}
            <select
              value={tableCategory}
              onChange={(e) => setTableCategory(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Products</option>
              <option value="Life">Life</option>
              <option value="Health">Health</option>
              <option value="GI Motor">GI Motor</option>
              <option value="GI Non-Motor">GI Non-Motor</option>
              <option value="MF">MF</option>
            </select>
          </div>
        </div>

        {loadingEntries ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No entries found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing the filters above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Employee</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Product</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Client</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Insurer</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Raw Amt</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Credit %</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Weighted</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => {
                  const product = PRODUCTS.find(p => p.id === entry.productId);
                  const emp = employees.find(e => e.id === entry.employeeId);
                  return (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                      <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-slate-700">{emp?.name || `ID: ${entry.employeeId}`}</p>
                        <p className="text-[10px] text-slate-400">{emp?.employeeCode}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-slate-700">{product?.productName || '—'}</p>
                        <p className="text-[10px] text-slate-400">
                          Tier {product?.tier} | {entry.isFpRoute ? 'FP Route' : 'Standard'}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{entry.clientName || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{entry.insurer || '—'}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-right text-slate-700">{formatINR(entry.rawAmount)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-slate-500">{entry.productCreditPct}%</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-right font-semibold text-emerald-600">{formatINR(entry.weightedAmount)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingIds.has(entry.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingIds.has(entry.id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={5} className="px-3 py-3 text-xs font-bold text-slate-600">TOTAL ({filteredEntries.length} entries)</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-slate-700">{formatINR(summaryStats.totalRaw)}</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-emerald-600">{formatINR(summaryStats.totalWeighted)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
