'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Loader2, CheckCircle, IndianRupee, FileText, AlertCircle,
  Calendar, Package, Building2, User, Hash, ToggleLeft, ToggleRight,
  Upload, X, FileSpreadsheet, Check, Trash2, ChevronDown, Filter,
  Download, AlertTriangle, ArrowUpDown, BarChart3, TrendingUp,
  TrendingDown, Target, Shield, Search, ChevronLeft, ChevronRight,
  Eye, XCircle, Flag, Briefcase, ArrowDown, ArrowUp, LayoutDashboard,
  Table, PenLine, UploadCloud, BadgeAlert, Clock, CheckCheck,
  Users, Layers, Percent, Award,
} from 'lucide-react';
import { PRODUCTS } from '@/lib/mis/employee-data';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { MonthlyBusinessEntry } from '@/lib/mis/types';
import type { ColumnMapping, SystemField, FileFormat } from '@/lib/utils/csv-parser';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

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
  employeeName?: string;
}

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  label: string;
}

type TabKey = 'dashboard' | 'entries' | 'manual' | 'upload';
type SortDir = 'asc' | 'desc';
type SortField = 'transactionDate' | 'employeeName' | 'rawAmount' | 'weightedAmount' | 'status' | 'productName';

// ═══════════════════════════════════════════════════════
// INDIAN FY HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/** Get current Indian Financial Year as "YYYY-YY" string */
function getCurrentFY(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  if (month >= 3) { // Apr onwards
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/** Parse FY string "2026-27" -> { startYear: 2026, endYear: 2027 } */
function parseFY(fy: string): { startYear: number; endYear: number } {
  const parts = fy.split('-');
  const startYear = parseInt(parts[0]);
  const endYear = startYear + 1;
  return { startYear, endYear };
}

/** Get full FY date range */
function getFY(fy: string): DateRange {
  const { startYear, endYear } = parseFY(fy);
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
    label: `FY ${fy}`,
  };
}

/** Get FY quarter date range. Q1=AMJ, Q2=JAS, Q3=OND, Q4=JFM */
function getFYQuarter(q: 1 | 2 | 3 | 4, fy?: string): DateRange {
  const { startYear, endYear } = parseFY(fy || getCurrentFY());
  const labels = ['Q1 (AMJ)', 'Q2 (JAS)', 'Q3 (OND)', 'Q4 (JFM)'];
  switch (q) {
    case 1: return { start: `${startYear}-04-01`, end: `${startYear}-06-30`, label: labels[0] };
    case 2: return { start: `${startYear}-07-01`, end: `${startYear}-09-30`, label: labels[1] };
    case 3: return { start: `${startYear}-10-01`, end: `${startYear}-12-31`, label: labels[2] };
    case 4: return { start: `${endYear}-01-01`, end: `${endYear}-03-31`, label: labels[3] };
  }
}

/** Get FY half date range. H1=Apr-Sep, H2=Oct-Mar */
function getFYHalf(h: 1 | 2, fy?: string): DateRange {
  const { startYear, endYear } = parseFY(fy || getCurrentFY());
  if (h === 1) return { start: `${startYear}-04-01`, end: `${startYear}-09-30`, label: 'H1 (Apr-Sep)' };
  return { start: `${startYear}-10-01`, end: `${endYear}-03-31`, label: 'H2 (Oct-Mar)' };
}

/** Get current month range */
function getThisMonth(): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const ms = String(m).padStart(2, '0');
  return {
    start: `${y}-${ms}-01`,
    end: `${y}-${ms}-${lastDay}`,
    label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

/** Get last month range */
function getLastMonth(): DateRange {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const ms = String(m).padStart(2, '0');
  return {
    start: `${y}-${ms}-01`,
    end: `${y}-${ms}-${lastDay}`,
    label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

/** Format date for display: "01 Apr 2026" */
function formatDateDisplay(d: string): string {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Get current month in YYYY-MM */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const CATEGORY_COLORS: Record<string, string> = {
  'Life': 'bg-purple-100 text-purple-700 border-purple-200',
  'Health': 'bg-blue-100 text-blue-700 border-blue-200',
  'GI Motor': 'bg-amber-100 text-amber-700 border-amber-200',
  'GI Non-Motor': 'bg-teal-100 text-teal-700 border-teal-200',
  'MF': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  'Life': 'bg-purple-500',
  'Health': 'bg-blue-500',
  'GI Motor': 'bg-amber-500',
  'GI Non-Motor': 'bg-teal-500',
  'MF': 'bg-emerald-500',
};

const STATUS_BADGES: Record<string, string> = {
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
  'submitted': 'bg-amber-100 text-amber-700 border-amber-200',
  'approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'rejected': 'bg-red-100 text-red-700 border-red-200',
  'error': 'bg-orange-100 text-orange-700 border-orange-200',
};

const PREMIUM_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹10K', min: 0, max: 10000 },
  { label: '₹10K-50K', min: 10000, max: 50000 },
  { label: '₹50K-1L', min: 50000, max: 100000 },
  { label: '₹1L-5L', min: 100000, max: 500000 },
  { label: '₹5L-10L', min: 500000, max: 1000000 },
  { label: 'Above ₹10L', min: 1000000, max: Infinity },
];

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

const PAGE_SIZE = 25;

// ═══════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastIdCounter = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error' ? 'bg-red-600 text-white' :
            'bg-slate-700 text-white'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className || ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function AdminBusinessPage() {
  // ─── Date Range ───
  const [dateRange, setDateRange] = useState<DateRange>(getThisMonth);
  const [activePreset, setActivePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // ─── Filters ───
  const [statusFilter, setStatusFilter] = useState('');
  const [premiumRangeIdx, setPremiumRangeIdx] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [specialFlag, setSpecialFlag] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Tab ───
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // ─── Employees ───
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // ─── Entries ───
  const [entries, setEntries] = useState<BusinessEntryExt[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // ─── Table sort + pagination ───
  const [sortField, setSortField] = useState<SortField>('rawAmount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ─── Action states ───
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [rejectReasonId, setRejectReasonId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkActioning, setBulkActioning] = useState(false);

  // ─── Manual Entry Form ───
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(0);
  const [entryMonth, setEntryMonth] = useState(getCurrentMonth());
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [productId, setProductId] = useState(0);
  const [rawAmount, setRawAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurer, setInsurer] = useState('');
  const [channelPayoutPct, setChannelPayoutPct] = useState(0);
  const [isCrossSale, setIsCrossSale] = useState(false);
  const [isBusinessLoss, setIsBusinessLoss] = useState(false);
  const [lossReason, setLossReason] = useState('');
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

  // ─── Toasts ───
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ═══════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
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
  }, []);

  const fetchEntries = useCallback(async (range: DateRange) => {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      params.set('startDate', range.start);
      params.set('endDate', range.end);
      // Also pass month for backward compatibility
      const startMonth = range.start.substring(0, 7);
      params.set('month', startMonth);
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
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEntries(dateRange);
  }, [dateRange, fetchEntries]);

  // Close employee dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node)) {
        setShowEmployeeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ═══════════════════════════════════════════════════
  // DERIVED DATA
  // ═══════════════════════════════════════════════════

  const productsByCategory = useMemo(() => {
    const groups: Record<string, typeof PRODUCTS> = {};
    for (const p of PRODUCTS) {
      if (!groups[p.productCategory]) groups[p.productCategory] = [];
      groups[p.productCategory].push(p);
    }
    return groups;
  }, []);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (premiumRangeIdx > 0) count++;
    if (categoryFilter) count++;
    if (entityFilter) count++;
    if (specialFlag) count++;
    if (employeeFilter) count++;
    return count;
  }, [statusFilter, premiumRangeIdx, categoryFilter, entityFilter, specialFlag, employeeFilter]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (statusFilter) {
      result = result.filter(e => (e.status || 'draft') === statusFilter);
    }
    if (premiumRangeIdx > 0) {
      const range = PREMIUM_RANGES[premiumRangeIdx];
      result = result.filter(e => e.rawAmount >= range.min && e.rawAmount < range.max);
    }
    if (categoryFilter) {
      const catProductIds = PRODUCTS.filter(p => p.productCategory === categoryFilter).map(p => p.id);
      result = result.filter(e => catProductIds.includes(e.productId));
    }
    if (entityFilter) {
      const entityEmpIds = employees.filter(emp => emp.entity === entityFilter).map(emp => emp.id);
      result = result.filter(e => entityEmpIds.includes(e.employeeId));
    }
    if (specialFlag === 'cross_sale') {
      result = result.filter(e => e.isCrossSale);
    } else if (specialFlag === 'business_loss') {
      result = result.filter(e => e.isBusinessLoss);
    }
    if (employeeFilter) {
      result = result.filter(e => e.employeeId === employeeFilter);
    }

    return result;
  }, [entries, statusFilter, premiumRangeIdx, categoryFilter, entityFilter, specialFlag, employeeFilter, employees]);

  // Sorted entries
  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rawAmount': cmp = a.rawAmount - b.rawAmount; break;
        case 'weightedAmount': cmp = a.weightedAmount - b.weightedAmount; break;
        case 'status': cmp = (a.status || '').localeCompare(b.status || ''); break;
        case 'employeeName': cmp = (a.employeeName || '').localeCompare(b.employeeName || ''); break;
        case 'transactionDate': cmp = (a.transactionDate || '').localeCompare(b.transactionDate || ''); break;
        case 'productName': {
          const pa = PRODUCTS.find(p => p.id === a.productId)?.productName || '';
          const pb = PRODUCTS.find(p => p.id === b.productId)?.productName || '';
          cmp = pa.localeCompare(pb);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredEntries, sortField, sortDir]);

  // Paginated entries
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedEntries.slice(start, start + PAGE_SIZE);
  }, [sortedEntries, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, premiumRangeIdx, categoryFilter, entityFilter, specialFlag, employeeFilter, dateRange]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalRaw = filteredEntries.reduce((s, e) => s + e.rawAmount, 0);
    const totalWeighted = filteredEntries.reduce((s, e) => s + e.weightedAmount, 0);
    const pendingCount = filteredEntries.filter(e => e.status === 'submitted').length;
    const errorCount = filteredEntries.filter(e => e.status === 'error').length;
    const lossCount = filteredEntries.filter(e => e.isBusinessLoss).length;
    const approvedCount = filteredEntries.filter(e => e.status === 'approved').length;
    const crossSaleCount = filteredEntries.filter(e => e.isCrossSale).length;
    const crossSaleAmount = filteredEntries.filter(e => e.isCrossSale).reduce((s, e) => s + e.weightedAmount, 0);
    const lossAmount = filteredEntries.filter(e => e.isBusinessLoss).reduce((s, e) => s + e.rawAmount, 0);
    const avgPremium = filteredEntries.length > 0 ? totalRaw / filteredEntries.length : 0;

    const byCategory: Record<string, { raw: number; weighted: number; count: number }> = {};
    for (const entry of filteredEntries) {
      const product = PRODUCTS.find(p => p.id === entry.productId);
      const cat = product?.productCategory || 'Unknown';
      if (!byCategory[cat]) byCategory[cat] = { raw: 0, weighted: 0, count: 0 };
      byCategory[cat].raw += entry.rawAmount;
      byCategory[cat].weighted += entry.weightedAmount;
      byCategory[cat].count++;
    }

    // By status
    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const entry of filteredEntries) {
      const st = entry.status || 'draft';
      if (!byStatus[st]) byStatus[st] = { count: 0, amount: 0 };
      byStatus[st].count++;
      byStatus[st].amount += entry.rawAmount;
    }

    // By employee (top performers)
    const byEmployee: Record<number, { name: string; weighted: number; count: number }> = {};
    for (const entry of filteredEntries) {
      if (!byEmployee[entry.employeeId]) {
        const emp = employees.find(e => e.id === entry.employeeId);
        byEmployee[entry.employeeId] = { name: emp?.name || `ID: ${entry.employeeId}`, weighted: 0, count: 0 };
      }
      byEmployee[entry.employeeId].weighted += entry.weightedAmount;
      byEmployee[entry.employeeId].count++;
    }
    const topPerformers = Object.entries(byEmployee)
      .map(([id, data]) => ({ employeeId: Number(id), ...data }))
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5);

    // By product (top products)
    const byProduct: Record<number, { name: string; category: string; weighted: number; count: number }> = {};
    for (const entry of filteredEntries) {
      if (!byProduct[entry.productId]) {
        const prod = PRODUCTS.find(p => p.id === entry.productId);
        byProduct[entry.productId] = { name: prod?.productName || '?', category: prod?.productCategory || '?', weighted: 0, count: 0 };
      }
      byProduct[entry.productId].weighted += entry.weightedAmount;
      byProduct[entry.productId].count++;
    }
    const topProducts = Object.entries(byProduct)
      .map(([id, data]) => ({ productId: Number(id), ...data }))
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5);

    // Premium range distribution
    const premiumDist = PREMIUM_RANGES.slice(1).map(range => {
      const count = filteredEntries.filter(e => e.rawAmount >= range.min && e.rawAmount < range.max).length;
      return { label: range.label, count };
    });

    return {
      totalRaw, totalWeighted, count: filteredEntries.length,
      pendingCount, errorCount, lossCount, approvedCount,
      crossSaleCount, crossSaleAmount, lossAmount, avgPremium,
      byCategory, byStatus, topPerformers, topProducts, premiumDist,
      collectionRate: filteredEntries.length > 0 ? (approvedCount / filteredEntries.length) * 100 : 0,
    };
  }, [filteredEntries, employees]);

  // Employee filter with search
  const filteredEmployeeOptions = useMemo(() => {
    if (!employeeSearch) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(e => e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q));
  }, [employees, employeeSearch]);

  const selectedProduct = PRODUCTS.find(p => p.id === productId);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const isChannelRM = selectedEmployee?.segment === 'CDM/POSP RM' || selectedEmployee?.segment === 'Area Manager';

  // ═══════════════════════════════════════════════════
  // DATE RANGE HANDLERS
  // ═══════════════════════════════════════════════════

  function applyPreset(preset: string) {
    setActivePreset(preset);
    setShowCustomRange(false);
    const fy = getCurrentFY();
    switch (preset) {
      case 'this_month': setDateRange(getThisMonth()); break;
      case 'last_month': setDateRange(getLastMonth()); break;
      case 'q1': setDateRange(getFYQuarter(1, fy)); break;
      case 'q2': setDateRange(getFYQuarter(2, fy)); break;
      case 'q3': setDateRange(getFYQuarter(3, fy)); break;
      case 'q4': setDateRange(getFYQuarter(4, fy)); break;
      case 'h1': setDateRange(getFYHalf(1, fy)); break;
      case 'h2': setDateRange(getFYHalf(2, fy)); break;
      case 'fy_current': setDateRange(getFY(fy)); break;
      case 'fy_prev': {
        const parts = fy.split('-');
        const prevFY = `${parseInt(parts[0]) - 1}-${String(parseInt(parts[0])).slice(2)}`;
        setDateRange(getFY(prevFY));
        break;
      }
      case 'custom': setShowCustomRange(true); break;
    }
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      addToast('Custom range cannot exceed 60 days', 'error');
      return;
    }
    if (diffDays < 0) {
      addToast('End date must be after start date', 'error');
      return;
    }
    setDateRange({
      start: customStart,
      end: customEnd,
      label: `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`,
    });
    setShowCustomRange(false);
  }

  function clearAllFilters() {
    setStatusFilter('');
    setPremiumRangeIdx(0);
    setCategoryFilter('');
    setEntityFilter('');
    setSpecialFlag('');
    setEmployeeFilter(0);
    setEmployeeSearch('');
  }

  // ═══════════════════════════════════════════════════
  // ENTRY ACTIONS
  // ═══════════════════════════════════════════════════

  const handleApprove = useCallback(async (id: number) => {
    setApprovingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/mis/business-entries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e));
        addToast('Entry approved');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to approve', 'error');
      }
    } catch {
      addToast('Failed to approve', 'error');
    } finally {
      setApprovingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [addToast]);

  const handleReject = useCallback(async (id: number, reason: string) => {
    setRejectingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/mis/business-entries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', reason }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const, rejectionReason: reason } : e));
        addToast('Entry rejected');
        setRejectReasonId(null);
        setRejectReason('');
      } else {
        addToast('Failed to reject', 'error');
      }
    } catch {
      addToast('Failed to reject', 'error');
    } finally {
      setRejectingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [addToast]);

  const handleFlagError = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/mis/business-entries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'flag_error' }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'error' as const } : e));
        addToast('Entry flagged as error');
      }
    } catch {
      addToast('Failed to flag error', 'error');
    }
  }, [addToast]);

  const handleMarkLoss = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/mis/business-entries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_loss' }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isBusinessLoss: true } : e));
        addToast('Entry marked as business loss');
      }
    } catch {
      addToast('Failed to mark as loss', 'error');
    }
  }, [addToast]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/mis/business-entries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== id));
        addToast('Entry deleted');
      }
    } catch {
      addToast('Failed to delete', 'error');
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [addToast]);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActioning(true);
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/mis/business-entries`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'approve' }),
        });
        if (res.ok) {
          setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e));
          successCount++;
        }
      } catch { /* continue */ }
    }
    addToast(`${successCount} entries approved`);
    setSelectedIds(new Set());
    setBulkActioning(false);
  }, [selectedIds, addToast]);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const reason = prompt('Enter rejection reason for all selected entries:');
    if (!reason) return;
    setBulkActioning(true);
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/mis/business-entries`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'reject', reason }),
        });
        if (res.ok) {
          setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const, rejectionReason: reason } : e));
          successCount++;
        }
      } catch { /* continue */ }
    }
    addToast(`${successCount} entries rejected`);
    setSelectedIds(new Set());
    setBulkActioning(false);
  }, [selectedIds, addToast]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['#', 'Employee', 'Employee Code', 'Product', 'Category', 'Client', 'Insurer', 'Policy No', 'Raw Amount', 'Weighted Amount', 'Credit %', 'Status', 'Cross Sale', 'Business Loss', 'Transaction Date'];
    const rows = sortedEntries.map((entry, i) => {
      const product = PRODUCTS.find(p => p.id === entry.productId);
      const emp = employees.find(e => e.id === entry.employeeId);
      return [
        i + 1,
        emp?.name || '',
        emp?.employeeCode || '',
        product?.productName || '',
        product?.productCategory || '',
        entry.clientName || '',
        entry.insurer || '',
        entry.policyNumber || '',
        entry.rawAmount,
        entry.weightedAmount,
        entry.productCreditPct,
        entry.status || 'draft',
        entry.isCrossSale ? 'Yes' : 'No',
        entry.isBusinessLoss ? 'Yes' : 'No',
        entry.transactionDate || '',
      ];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business_entries_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported');
  }, [sortedEntries, employees, dateRange, addToast]);

  // Toggle sort
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  // Select all on current page
  function toggleSelectAll() {
    const pageIds = paginatedEntries.map(e => e.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // MANUAL ENTRY
  // ═══════════════════════════════════════════════════

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
          isCrossSale,
          isBusinessLoss,
          lossReason: isBusinessLoss ? lossReason : undefined,
          transactionDate: transactionDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const { entry } = await res.json();
      setFormSuccess(`Entry saved! Weighted: ${formatINR(entry.weightedAmount)}`);
      addToast(`Entry saved: ${formatINR(entry.weightedAmount)}`);

      // Reset form (keep employee + month)
      setProductId(0);
      setRawAmount('');
      setClientName('');
      setPolicyNumber('');
      setInsurer('');
      setChannelPayoutPct(0);
      setIsCrossSale(false);
      setIsBusinessLoss(false);
      setLossReason('');

      // Refresh entries
      fetchEntries(dateRange);

      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setFormError(msg);
      addToast(msg, 'error');
      setTimeout(() => setFormError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // CSV UPLOAD HANDLERS
  // ═══════════════════════════════════════════════════

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
      const validRows = uploadPreview.preview.filter(r => !r.error);
      const res = await fetch('/api/admin/mis/business/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows, month: uploadPreview.month }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const result = await res.json() as ImportResult;
      setImportResult(result);
      setUploadStep('done');
      addToast(`Imported ${result.imported} entries`);
      fetchEntries(dateRange);
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

  // ═══════════════════════════════════════════════════
  // RENDER: HEADER + QUICK STATS
  // ═══════════════════════════════════════════════════

  function renderHeader() {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Business Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Showing: {formatDateDisplay(dateRange.start)} - {formatDateDisplay(dateRange.end)}
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Total Business</p>
              <p className="text-lg font-bold text-slate-800">{formatINR(summaryStats.totalRaw)}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Weighted Business</p>
              <p className="text-lg font-bold text-emerald-600">{formatINR(summaryStats.totalWeighted)}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Entries</p>
              <p className="text-lg font-bold text-slate-700">{summaryStats.count}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Pending</p>
              <p className="text-lg font-bold text-amber-600 flex items-center gap-1 justify-center sm:justify-start">
                {summaryStats.pendingCount}
                {summaryStats.pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-100 text-amber-700 font-bold">!</span>
                )}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Errors</p>
              <p className="text-lg font-bold text-red-500 flex items-center gap-1 justify-center sm:justify-start">
                {summaryStats.errorCount}
                {summaryStats.errorCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-red-100 text-red-700 font-bold">!</span>
                )}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Business Loss</p>
              <p className="text-lg font-bold text-red-600">{summaryStats.lossCount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: DATE RANGE PICKER
  // ═══════════════════════════════════════════════════

  function renderDateRangePicker() {
    const fy = getCurrentFY();
    const fyParts = fy.split('-');
    const prevFY = `${parseInt(fyParts[0]) - 1}-${String(parseInt(fyParts[0])).slice(2)}`;

    const presets = [
      { key: 'this_month', label: 'This Month' },
      { key: 'last_month', label: 'Last Month' },
      { key: 'q1', label: 'Q1 (AMJ)' },
      { key: 'q2', label: 'Q2 (JAS)' },
      { key: 'q3', label: 'Q3 (OND)' },
      { key: 'q4', label: 'Q4 (JFM)' },
      { key: 'h1', label: 'H1 (Apr-Sep)' },
      { key: 'h2', label: 'H2 (Oct-Mar)' },
      { key: 'fy_prev', label: `FY ${prevFY}` },
      { key: 'fy_current', label: `FY ${fy}` },
      { key: 'custom', label: 'Custom Range' },
    ];

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-700">Date Range</h2>
          <span className="ml-auto text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
            {formatDateDisplay(dateRange.start)} - {formatDateDisplay(dateRange.end)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                activePreset === p.key
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {showCustomRange && (
          <div className="mt-3 flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <button
              onClick={applyCustomRange}
              className="px-4 py-1.5 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              Apply
            </button>
            <p className="text-[10px] text-slate-400">Max 60 days</p>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: FILTER PANEL
  // ═══════════════════════════════════════════════════

  function renderFilters() {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-700">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="error">Error</option>
                </select>
              </div>

              {/* Premium Range */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Premium Range</label>
                <select
                  value={premiumRangeIdx}
                  onChange={(e) => setPremiumRangeIdx(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  {PREMIUM_RANGES.map((r, i) => (
                    <option key={i} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All</option>
                  <option value="Life">Life Insurance</option>
                  <option value="Health">Health Insurance</option>
                  <option value="GI Motor">GI Motor</option>
                  <option value="GI Non-Motor">GI Non-Motor</option>
                  <option value="MF">Mutual Fund</option>
                </select>
              </div>

              {/* Entity */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Entity</label>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All</option>
                  <option value="TAS">TAS (Trustner Asset Services)</option>
                  <option value="TIB">TIB (Trustner Insurance Brokers)</option>
                </select>
              </div>

              {/* Special Flags */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Special Flags</label>
                <select
                  value={specialFlag}
                  onChange={(e) => setSpecialFlag(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">None</option>
                  <option value="cross_sale">Cross Sale Only</option>
                  <option value="business_loss">Business Loss Only</option>
                  <option value="fp_route">FP Route Only</option>
                </select>
              </div>

              {/* Employee (searchable) */}
              <div className="relative" ref={employeeDropdownRef}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee</label>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={employeeFilter ? employees.find(e => e.id === employeeFilter)?.name || 'Search...' : 'Search employee...'}
                    value={employeeSearch}
                    onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                  />
                  {employeeFilter > 0 && (
                    <button
                      onClick={() => { setEmployeeFilter(0); setEmployeeSearch(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
                {showEmployeeDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <button
                      onClick={() => { setEmployeeFilter(0); setEmployeeSearch(''); setShowEmployeeDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-500"
                    >
                      All Employees
                    </button>
                    {filteredEmployeeOptions.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { setEmployeeFilter(emp.id); setEmployeeSearch(''); setShowEmployeeDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-teal-50 ${employeeFilter === emp.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
                      >
                        {emp.name} <span className="text-slate-400">({emp.employeeCode})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear All */}
              <div className="flex items-end">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear All ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: TAB BAR
  // ═══════════════════════════════════════════════════

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'entries', label: 'Entries', icon: <Table className="w-4 h-4" /> },
    { key: 'manual', label: 'Manual Entry', icon: <PenLine className="w-4 h-4" /> },
    { key: 'upload', label: 'CSV / Excel Upload', icon: <UploadCloud className="w-4 h-4" /> },
  ];

  function renderTabs() {
    return (
      <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-xl px-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === t.key
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'entries' && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                {filteredEntries.length}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: DASHBOARD TAB
  // ═══════════════════════════════════════════════════

  function renderDashboard() {
    if (loadingEntries) return <DashboardSkeleton />;

    const maxPerformerWeighted = summaryStats.topPerformers.length > 0 ? summaryStats.topPerformers[0].weighted : 1;
    const maxProductWeighted = summaryStats.topProducts.length > 0 ? summaryStats.topProducts[0].weighted : 1;
    const maxPremiumDist = Math.max(...summaryStats.premiumDist.map(d => d.count), 1);

    return (
      <div className="space-y-6">
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">Raw Business</p>
            </div>
            <p className="text-xl font-bold text-slate-800">{formatINR(summaryStats.totalRaw)}</p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 p-4 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[10px] text-emerald-500 uppercase font-bold">Weighted Business</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatINR(summaryStats.totalWeighted)}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Premium</p>
            </div>
            <p className="text-xl font-bold text-slate-700">{formatINR(Math.round(summaryStats.avgPremium))}</p>
          </div>

          <div className="bg-white rounded-xl border border-blue-200 p-4 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] text-blue-500 uppercase font-bold">Cross Sale</p>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {formatINR(summaryStats.crossSaleAmount)}
            </p>
            <p className="text-[10px] text-blue-400 mt-0.5">{summaryStats.crossSaleCount} entries</p>
          </div>

          <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <p className="text-[10px] text-red-500 uppercase font-bold">Business Loss</p>
            </div>
            <p className="text-xl font-bold text-red-600">{formatINR(summaryStats.lossAmount)}</p>
            <p className="text-[10px] text-red-400 mt-0.5">{summaryStats.lossCount} entries</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">Collection Rate</p>
            </div>
            <p className="text-xl font-bold text-slate-700">{summaryStats.collectionRate.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{summaryStats.approvedCount} / {summaryStats.count}</p>
          </div>
        </div>

        {/* Row 2: Category Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-500" />
              Category Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Category</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Entries</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Raw Business</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Weighted Business</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">% of Total</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Avg Premium</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summaryStats.byCategory).map(([cat, data]) => (
                  <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-slate-700">{data.count}</td>
                    <td className="px-4 py-3 text-xs text-right font-mono text-slate-700">{formatINR(data.raw)}</td>
                    <td className="px-4 py-3 text-xs text-right font-mono font-semibold text-emerald-600">{formatINR(data.weighted)}</td>
                    <td className="px-4 py-3 text-xs text-right text-slate-500">
                      {summaryStats.totalWeighted > 0 ? ((data.weighted / summaryStats.totalWeighted) * 100).toFixed(1) : '0'}%
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-mono text-slate-600">
                      {data.count > 0 ? formatINR(Math.round(data.raw / data.count)) : '-'}
                    </td>
                  </tr>
                ))}
                {Object.keys(summaryStats.byCategory).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No data for selected period</td></tr>
                )}
              </tbody>
              {Object.keys(summaryStats.byCategory).length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-3 text-xs font-bold text-slate-600">TOTAL</td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-slate-700">{summaryStats.count}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold font-mono text-slate-700">{formatINR(summaryStats.totalRaw)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold font-mono text-emerald-600">{formatINR(summaryStats.totalWeighted)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-slate-600">100%</td>
                    <td className="px-4 py-3 text-xs text-right font-bold font-mono text-slate-600">
                      {summaryStats.count > 0 ? formatINR(Math.round(summaryStats.totalRaw / summaryStats.count)) : '-'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Row 3: Premium Range Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            Premium Range Distribution
          </h3>
          <div className="space-y-3">
            {summaryStats.premiumDist.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-600 font-medium text-right shrink-0">{d.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${maxPremiumDist > 0 ? (d.count / maxPremiumDist) * 100 : 0}%` }}
                  />
                  {d.count > 0 && (
                    <span className="absolute inset-0 flex items-center px-3 text-[10px] font-bold text-white drop-shadow">
                      {d.count}
                    </span>
                  )}
                </div>
                <span className="w-10 text-xs text-slate-400 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Status Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-teal-500" />
            Status Pipeline
          </h3>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {/* Draft */}
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-4 border border-slate-200 min-w-[120px]">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                <PenLine className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-lg font-bold text-slate-700">{summaryStats.byStatus['draft']?.count || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Draft</p>
              <p className="text-[10px] text-slate-500 mt-1">{formatINR(summaryStats.byStatus['draft']?.amount || 0)}</p>
            </div>

            <ArrowDown className="w-5 h-5 text-slate-300 rotate-[-90deg] hidden sm:block" />

            {/* Submitted */}
            <div className="flex flex-col items-center bg-blue-50 rounded-xl p-4 border border-blue-200 min-w-[120px]">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-700">{summaryStats.byStatus['submitted']?.count || 0}</p>
              <p className="text-[10px] text-blue-500 uppercase font-bold">Submitted</p>
              <p className="text-[10px] text-blue-500 mt-1">{formatINR(summaryStats.byStatus['submitted']?.amount || 0)}</p>
            </div>

            <ArrowDown className="w-5 h-5 text-slate-300 rotate-[-90deg] hidden sm:block" />

            {/* Approved */}
            <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-4 border border-emerald-200 min-w-[120px]">
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center mb-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-emerald-700">{summaryStats.byStatus['approved']?.count || 0}</p>
              <p className="text-[10px] text-emerald-500 uppercase font-bold">Approved</p>
              <p className="text-[10px] text-emerald-600 mt-1">{formatINR(summaryStats.byStatus['approved']?.amount || 0)}</p>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-16 bg-slate-200 mx-2" />

            {/* Rejected */}
            <div className="flex flex-col items-center bg-red-50 rounded-xl p-4 border border-red-200 min-w-[100px]">
              <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center mb-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-lg font-bold text-red-600">{summaryStats.byStatus['rejected']?.count || 0}</p>
              <p className="text-[10px] text-red-400 uppercase font-bold">Rejected</p>
            </div>

            {/* Error */}
            <div className="flex flex-col items-center bg-orange-50 rounded-xl p-4 border border-orange-200 min-w-[100px]">
              <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center mb-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-orange-600">{summaryStats.byStatus['error']?.count || 0}</p>
              <p className="text-[10px] text-orange-400 uppercase font-bold">Error</p>
            </div>
          </div>
        </div>

        {/* Row 5 + 6: Top Performers and Top Products side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              Top 5 Performers
            </h3>
            {summaryStats.topPerformers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No data</p>
            ) : (
              <div className="space-y-3">
                {summaryStats.topPerformers.map((perf, i) => (
                  <div key={perf.employeeId} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="w-28 text-xs font-medium text-slate-700 truncate shrink-0">{perf.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          i === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                          i === 1 ? 'bg-gradient-to-r from-slate-500 to-slate-400' :
                          'bg-gradient-to-r from-teal-500 to-teal-400'
                        }`}
                        style={{ width: `${(perf.weighted / maxPerformerWeighted) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-xs font-mono font-semibold text-emerald-600 text-right shrink-0">
                      {formatINR(Math.round(perf.weighted))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-teal-500" />
              Top 5 Products
            </h3>
            {summaryStats.topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No data</p>
            ) : (
              <div className="space-y-3">
                {summaryStats.topProducts.map((prod, i) => (
                  <div key={prod.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{prod.name}</p>
                      <span className={`inline-flex px-1.5 py-0 text-[8px] font-bold rounded border ${CATEGORY_COLORS[prod.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {prod.category}
                      </span>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${CATEGORY_BAR_COLORS[prod.category] || 'bg-slate-400'}`}
                        style={{ width: `${(prod.weighted / maxProductWeighted) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-xs font-mono font-semibold text-emerald-600 text-right shrink-0">
                      {formatINR(Math.round(prod.weighted))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: ENTRIES TAB
  // ═══════════════════════════════════════════════════

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-teal-500 ml-1" />
      : <ArrowDown className="w-3 h-3 text-teal-500 ml-1" />;
  }

  function renderEntries() {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Business Entries
            <span className="text-slate-400 font-normal">({sortedEntries.length})</span>
          </h2>

          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-medium text-slate-500">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkActioning}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {bulkActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Approve
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkActioning}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              </div>
            )}

            {/* Export */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>

        {loadingEntries ? (
          <TableSkeleton />
        ) : sortedEntries.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No entries found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the date range or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left">
                      <input
                        type="checkbox"
                        checked={paginatedEntries.length > 0 && paginatedEntries.every(e => selectedIds.has(e.id))}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">#</th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('transactionDate')}
                    >
                      <span className="inline-flex items-center">Date{renderSortIcon('transactionDate')}</span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('employeeName')}
                    >
                      <span className="inline-flex items-center">Employee{renderSortIcon('employeeName')}</span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('productName')}
                    >
                      <span className="inline-flex items-center">Product{renderSortIcon('productName')}</span>
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Client</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Insurer</th>
                    <th
                      className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('rawAmount')}
                    >
                      <span className="inline-flex items-center justify-end">Raw Amt{renderSortIcon('rawAmount')}</span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('weightedAmount')}
                    >
                      <span className="inline-flex items-center justify-end">Weighted{renderSortIcon('weightedAmount')}</span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none hover:text-teal-600"
                      onClick={() => toggleSort('status')}
                    >
                      <span className="inline-flex items-center">Status{renderSortIcon('status')}</span>
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">Flags</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry, i) => {
                    const product = PRODUCTS.find(p => p.id === entry.productId);
                    const emp = employees.find(e => e.id === entry.employeeId);
                    const status = entry.status || 'draft';
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + i + 1;

                    return (
                      <tr key={entry.id} className={`border-b border-slate-50 hover:bg-slate-50/50 last:border-0 ${entry.isBusinessLoss ? 'bg-red-50/30' : ''}`}>
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => {
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                if (next.has(entry.id)) next.delete(entry.id);
                                else next.add(entry.id);
                                return next;
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">{globalIdx}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600">
                          {entry.transactionDate || entry.month || '-'}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium text-slate-700">{emp?.name || entry.employeeName || `ID: ${entry.employeeId}`}</p>
                          <p className="text-[10px] text-slate-400">{emp?.employeeCode}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium text-slate-700">{product?.productName || '-'}</p>
                          <span className={`inline-flex px-1.5 py-0 text-[8px] font-bold rounded border ${CATEGORY_COLORS[product?.productCategory || ''] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {product?.productCategory || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[120px] truncate">{entry.clientName || '-'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600">{entry.insurer || '-'}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-right text-slate-700">{formatINR(entry.rawAmount)}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-right font-semibold text-emerald-600">{formatINR(entry.weightedAmount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_BADGES[status] || STATUS_BADGES['draft']}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.isCrossSale && (
                              <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-blue-100 text-blue-600 border border-blue-200" title="Cross Sale">XS</span>
                            )}
                            {entry.isBusinessLoss && (
                              <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-red-100 text-red-600 border border-red-200" title="Business Loss">BL</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-0.5">
                            {(status === 'submitted' || status === 'draft') && (
                              <button
                                onClick={() => handleApprove(entry.id)}
                                disabled={approvingIds.has(entry.id)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
                                title="Approve"
                              >
                                {approvingIds.has(entry.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {(status === 'submitted' || status === 'draft') && (
                              <>
                                {rejectReasonId === entry.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder="Reason..."
                                      className="w-24 px-1.5 py-0.5 text-[10px] border border-slate-300 rounded"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleReject(entry.id, rejectReason)}
                                      disabled={!rejectReason || rejectingIds.has(entry.id)}
                                      className="p-0.5 rounded text-red-500 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      {rejectingIds.has(entry.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => { setRejectReasonId(null); setRejectReason(''); }} className="p-0.5">
                                      <X className="w-3 h-3 text-slate-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setRejectReasonId(entry.id)}
                                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleFlagError(entry.id)}
                              className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                              title="Flag as Error"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                            {!entry.isBusinessLoss && (
                              <button
                                onClick={() => handleMarkLoss(entry.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                                title="Mark as Business Loss"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingIds.has(entry.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingIds.has(entry.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={7} className="px-3 py-3 text-xs font-bold text-slate-600">
                      TOTAL ({sortedEntries.length} entries)
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-right font-mono text-slate-700">{formatINR(summaryStats.totalRaw)}</td>
                    <td className="px-3 py-3 text-xs font-bold text-right font-mono text-emerald-600">{formatINR(summaryStats.totalWeighted)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedEntries.length)} of {sortedEntries.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg border transition-colors ${
                          currentPage === page
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: MANUAL ENTRY TAB
  // ═══════════════════════════════════════════════════

  function renderManualEntry() {
    return (
      <form onSubmit={handleManualSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-500" />
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value={0}>Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) -- {emp.designation}
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />Transaction Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value={0}>Direct (0% payout)</option>
                <option value={60}>Sub-broker (60%)</option>
                <option value={70}>POSP Normal (70%)</option>
                <option value={80}>POSP Higher Pay / Digital (80%)</option>
                <option value={85}>Franchise (85%)</option>
              </select>
            </div>
          )}

          {/* Cross Sale Toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <div>
              <p className="text-xs font-medium text-blue-700">Cross Sale</p>
              <p className="text-[10px] text-blue-500">Product from different category?</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCrossSale(!isCrossSale)}
              className="text-blue-600"
            >
              {isCrossSale ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
            </button>
          </div>

          {/* Business Loss Toggle */}
          <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
            <div>
              <p className="text-xs font-medium text-red-700">Business Loss</p>
              <p className="text-[10px] text-red-500">Cancellation / Lapse / Surrender?</p>
            </div>
            <button
              type="button"
              onClick={() => setIsBusinessLoss(!isBusinessLoss)}
              className="text-red-600"
            >
              {isBusinessLoss ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
            </button>
          </div>

          {/* Loss Reason */}
          {isBusinessLoss && (
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-red-600 mb-1">
                Loss Reason *
              </label>
              <input
                type="text"
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="e.g. Policy surrendered, SIP stopped, Premium not paid"
                className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/30"
                required={isBusinessLoss}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving || !selectedEmployeeId || !productId || !rawAmount || (isBusinessLoss && !lossReason)}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Entry</>
            )}
          </button>
        </div>
      </form>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: CSV UPLOAD TAB
  // ═══════════════════════════════════════════════════

  function renderUpload() {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          Bulk Upload (CSV / Excel)
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <User className="w-3 h-3 inline mr-1" />Override Employee (optional)
                </label>
                <select
                  value={uploadEmployeeId}
                  onChange={(e) => setUploadEmployeeId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value={0}>Auto-detect from file</option>
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
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              {uploadLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  <p className="text-sm text-slate-600 font-medium">Parsing file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm text-slate-600 font-medium">
                    Drop a CSV or Excel file here, or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports .csv, .xlsx, .xls — MF statements, Insurance MIS, or generic business data
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
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5"
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
                      className="text-[10px] border border-slate-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-teal-500"
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
                        {row.amount ? formatINR(row.amount) : '-'}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">{row.clientName || '-'}</td>
                      <td className="px-2 py-1.5 text-slate-600">{row.policyNumber || '-'}</td>
                      <td className="px-2 py-1.5 text-slate-600">{row.insurer || '-'}</td>
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
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
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
    );
  }

  // ═══════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {renderHeader()}
      {renderDateRangePicker()}
      {renderFilters()}
      {renderTabs()}

      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'entries' && renderEntries()}
        {activeTab === 'manual' && renderManualEntry()}
        {activeTab === 'upload' && renderUpload()}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
