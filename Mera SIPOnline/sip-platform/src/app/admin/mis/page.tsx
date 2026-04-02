'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, TrendingUp, Target, IndianRupee, Award,
  Building2, Shield, ChevronDown, Search, ArrowUpRight, ArrowDownRight,
  Briefcase, Clock, AlertTriangle, CheckCircle, Star, Zap,
  Plus, Edit3, XCircle, Save, X, Loader2, UserPlus, Trash2, Layers
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { Employee, Product, IncentiveSlab, SlabTable } from '@/lib/mis/types';
import type { AdminRole } from '@/lib/auth/config';
import type { IncentiveSlabRow } from '@/lib/dal/incentive-slabs';
import type { ProductRow } from '@/lib/dal/products';

// ─── Types ───
interface AuthUser {
  email: string;
  name: string;
  role: AdminRole;
}

type TabId = 'overview' | 'employees' | 'incentive' | 'products' | 'slabs';

// ─── Toast ───
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

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

// ─── Stat Card ───
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
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ───
function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} />;
}

// ─── Role Helpers ───
function canEdit(role: AdminRole): boolean {
  return ['super_admin', 'admin', 'hr'].includes(role);
}
function isAdmin(role: AdminRole): boolean {
  return ['super_admin', 'admin'].includes(role);
}
function isSuperAdmin(role: AdminRole): boolean {
  return role === 'super_admin';
}

// ─── Modal Shell ───
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Field Input Component ───
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors';
const btnDanger = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors';

// ─── Employee Row ───
function EmployeeRow({ emp, rank, canEditRow, onEdit, onDeactivate }: {
  emp: Employee; rank: number; canEditRow: boolean;
  onEdit: (emp: Employee) => void; onDeactivate: (emp: Employee) => void;
}) {
  const segmentColor: Record<string, string> = {
    'Direct Sales': 'bg-blue-100 text-blue-700',
    'FP Team': 'bg-purple-100 text-purple-700',
    'CDM/POSP RM': 'bg-amber-100 text-amber-700',
    'Area Manager': 'bg-emerald-100 text-emerald-700',
    'Support': 'bg-slate-100 text-slate-600',
  };

  const entityColor = emp.entity === 'TIB'
    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
    : emp.entity === 'TAS'
    ? 'bg-teal-50 text-teal-600 border-teal-200'
    : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-sm text-slate-400 font-mono">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{emp.name}</p>
            <p className="text-xs text-slate-400">{emp.employeeCode}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{emp.designation}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${entityColor}`}>
          {emp.entity}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{emp.department}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${segmentColor[emp.segment] || 'bg-slate-100 text-slate-600'}`}>
          {emp.segment}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-mono text-slate-600">{emp.levelCode}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
        {emp.grossSalary > 0 ? formatINR(emp.grossSalary) : '\u2014'}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
        {emp.monthlyTarget > 0 ? formatINR(emp.monthlyTarget) : '\u2014'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {emp.targetMultiplier > 0 ? `${emp.targetMultiplier}\u00d7` : '\u2014'}
      </td>
      {canEditRow && (
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button onClick={() => onEdit(emp)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Edit">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {emp.isActive && (
              <button onClick={() => onDeactivate(emp)} className="p-1 rounded hover:bg-red-50 text-red-500" title="Deactivate">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

// =====================================================================
// ─── MAIN PAGE COMPONENT ───
// =====================================================================

export default function MISPage() {
  // ─── Auth State ───
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Tab State ───
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ─── Data State ───
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [slabs, setSlabs] = useState<IncentiveSlabRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSlabs, setLoadingSlabs] = useState(true);

  // ─── Filter State ───
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | 'TIB' | 'TAS'>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  // ─── Modal State ───
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showAddSlab, setShowAddSlab] = useState(false);
  const [editingSlabId, setEditingSlabId] = useState<number | null>(null);

  // ─── Toast ───
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // ─── Submitting state ───
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch Auth ───
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ─── Fetch Employees ───
  const fetchEmployees = useCallback(() => {
    setLoadingEmployees(true);
    fetch('/api/admin/mis/employees')
      .then(r => r.json())
      .then(d => { if (d.employees) setEmployees(d.employees); })
      .catch(() => showToast('Failed to load employees', 'error'))
      .finally(() => setLoadingEmployees(false));
  }, [showToast]);

  // ─── Fetch Products ───
  const fetchProducts = useCallback(() => {
    setLoadingProducts(true);
    fetch('/api/admin/mis/products')
      .then(r => r.json())
      .then(d => { if (d.products) setProducts(d.products); })
      .catch(() => showToast('Failed to load products', 'error'))
      .finally(() => setLoadingProducts(false));
  }, [showToast]);

  // ─── Fetch Slabs ───
  const fetchSlabs = useCallback(() => {
    setLoadingSlabs(true);
    fetch('/api/admin/mis/slabs')
      .then(r => r.json())
      .then(d => { if (d.slabs) setSlabs(d.slabs); })
      .catch(() => showToast('Failed to load slabs', 'error'))
      .finally(() => setLoadingSlabs(false));
  }, [showToast]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchSlabs(); }, [fetchSlabs]);

  // ─── Derived data ───
  const activeEmployees = useMemo(() => employees.filter(e => e.isActive), [employees]);
  const salesTeam = useMemo(() => activeEmployees.filter(e => e.segment !== 'Support'), [activeEmployees]);
  const supportTeam = useMemo(() => activeEmployees.filter(e => e.segment === 'Support'), [activeEmployees]);
  const totalMonthlyPayroll = useMemo(() => activeEmployees.reduce((sum, e) => sum + e.grossSalary, 0), [activeEmployees]);
  const totalMonthlyTarget = useMemo(() => salesTeam.reduce((sum, e) => sum + e.monthlyTarget, 0), [salesTeam]);
  const tibCount = useMemo(() => activeEmployees.filter(e => e.entity === 'TIB').length, [activeEmployees]);
  const tasCount = useMemo(() => activeEmployees.filter(e => e.entity === 'TAS').length, [activeEmployees]);
  const segments = useMemo(() => [...new Set(employees.map(e => e.segment))], [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) && !emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (entityFilter !== 'all' && emp.entity !== entityFilter) return false;
      if (segmentFilter !== 'all' && emp.segment !== segmentFilter) return false;
      return true;
    });
  }, [employees, searchQuery, entityFilter, segmentFilter]);

  const dstSlabs = useMemo(() => slabs.filter(s => s.slabTableName === 'DST'), [slabs]);
  const pospSlabs = useMemo(() => slabs.filter(s => s.slabTableName === 'POSP_RM'), [slabs]);

  // ─── API helper to submit change requests ───
  async function submitChangeRequest(
    url: string,
    body: Record<string, unknown>,
    successMsg: string
  ) {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user.email },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(successMsg);
      } else {
        showToast(data.error || 'Request failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Employee handlers ───
  function handleAddEmployee(formData: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/employees', {
      action: 'add',
      employee: formData,
      title: `Add employee: ${formData.name}`,
      description: `Request to add new employee ${formData.name} (${formData.employeeCode})`,
    }, 'Change request submitted for approval').then(() => setShowAddEmployee(false));
  }

  function handleEditEmployee(emp: Employee, updates: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/employees', {
      action: 'edit',
      id: emp.id,
      updates,
      previousData: emp,
      title: `Edit employee: ${emp.name}`,
      description: `Request to edit employee ${emp.name} (${emp.employeeCode})`,
    }, 'Change request submitted for approval').then(() => setEditingEmployee(null));
  }

  function handleDeactivateEmployee(emp: Employee) {
    if (!confirm(`Are you sure you want to deactivate ${emp.name}?`)) return;
    submitChangeRequest('/api/admin/mis/employees', {
      action: 'deactivate',
      id: emp.id,
      previousData: emp,
      title: `Deactivate employee: ${emp.name}`,
      description: `Request to deactivate employee ${emp.name} (${emp.employeeCode})`,
    }, 'Deactivation request submitted for approval');
  }

  // ─── Product handlers ───
  function handleAddProduct(formData: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/products', {
      action: 'insert',
      product: formData,
      title: `Add product: ${formData.productName}`,
      description: `Request to add new product ${formData.productName}`,
    }, 'Change request submitted for Super Admin approval').then(() => setShowAddProduct(false));
  }

  function handleEditProduct(product: ProductRow, updates: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/products', {
      action: 'update',
      id: product.id,
      updates,
      previousData: product,
      title: `Edit product: ${product.productName}`,
      description: `Request to update product ${product.productName}`,
    }, 'Change request submitted for Super Admin approval').then(() => setEditingProductId(null));
  }

  // ─── Slab handlers ───
  function handleAddSlab(formData: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/slabs', {
      action: 'insert',
      slab: formData,
      title: `Add slab: ${formData.slabLabel} (${formData.slabTableName})`,
      description: `Request to add new incentive slab`,
    }, 'Change request submitted for approval').then(() => setShowAddSlab(false));
  }

  function handleEditSlab(slab: IncentiveSlabRow, updates: Record<string, unknown>) {
    submitChangeRequest('/api/admin/mis/slabs', {
      action: 'update',
      id: slab.id,
      updates,
      previousData: slab,
      title: `Edit slab: ${slab.slabLabel} (${slab.slabTableName})`,
      description: `Request to update incentive slab ${slab.slabLabel}`,
    }, 'Change request submitted for approval').then(() => setEditingSlabId(null));
  }

  // ─── Loading Guard ───
  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const userRole = user?.role || 'viewer';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Trustner MIS Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Incentive Management &amp; Performance Tracking System | FY 2026-27
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {user.name} ({user.role.replace('_', ' ')})
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Clock className="w-3 h-3 inline mr-1" />
            April 2026
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Phase 1 &mdash; Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit overflow-x-auto">
        {([
          { id: 'overview' as TabId, label: 'Overview', icon: BarChart3 },
          { id: 'employees' as TabId, label: 'Employee Master', icon: Users },
          { id: 'incentive' as TabId, label: 'Incentive Calc', icon: IndianRupee },
          { id: 'products' as TabId, label: 'Product Rules', icon: Shield },
          { id: 'slabs' as TabId, label: 'Incentive Slabs', icon: Layers },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Overview */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-20"><Spinner className="w-8 h-8" /></div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                  label="Total Employees"
                  value={String(activeEmployees.length)}
                  icon={Users}
                  color="bg-blue-500"
                  subtext={`TIB: ${tibCount} | TAS: ${tasCount}`}
                />
                <StatCard
                  label="Monthly Payroll"
                  value={formatINR(totalMonthlyPayroll)}
                  icon={IndianRupee}
                  color="bg-emerald-500"
                  subtext={`Annual: ${formatINR(totalMonthlyPayroll * 12)}`}
                />
                <StatCard
                  label="Monthly Target"
                  value={formatINR(totalMonthlyTarget)}
                  icon={Target}
                  color="bg-amber-500"
                  subtext={`${salesTeam.length} sales team members`}
                />
                <StatCard
                  label="Cost-to-Income"
                  value={totalMonthlyTarget > 0 ? `${Math.round((totalMonthlyPayroll / totalMonthlyTarget) * 100)}%` : '\u2014'}
                  icon={TrendingUp}
                  color="bg-purple-500"
                  subtext="Target: <40%"
                />
                <StatCard
                  label="Business Summary"
                  value={formatINR(totalMonthlyTarget)}
                  icon={Award}
                  color="bg-rose-500"
                  subtext="This month's target capacity"
                />
              </div>

              {/* Entity Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-700">TIB &mdash; Insurance Broking</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">IRDAI</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Employees</span>
                      <span className="font-semibold text-slate-700">{tibCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monthly Payroll</span>
                      <span className="font-semibold text-slate-700">{formatINR(activeEmployees.filter(e => e.entity === 'TIB').reduce((s, e) => s + e.grossSalary, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monthly Target</span>
                      <span className="font-semibold text-emerald-600">{formatINR(salesTeam.filter(e => e.entity === 'TIB').reduce((s, e) => s + e.monthlyTarget, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Products</span>
                      <span className="font-semibold text-slate-700">Life, Health, GI Motor, GI Non-Motor</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-teal-500" />
                    <h3 className="font-bold text-slate-700">TAS &mdash; Asset Services</h3>
                    <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">SEBI MFD</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Employees</span>
                      <span className="font-semibold text-slate-700">{tasCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monthly Payroll</span>
                      <span className="font-semibold text-slate-700">{formatINR(activeEmployees.filter(e => e.entity === 'TAS').reduce((s, e) => s + e.grossSalary, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monthly Target</span>
                      <span className="font-semibold text-emerald-600">{formatINR(salesTeam.filter(e => e.entity === 'TAS').reduce((s, e) => s + e.monthlyTarget, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Products</span>
                      <span className="font-semibold text-slate-700">MF SIP, MF Lumpsum, STP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  Team Segment Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {segments.map(seg => {
                    const count = activeEmployees.filter(e => e.segment === seg).length;
                    const target = activeEmployees.filter(e => e.segment === seg).reduce((s, e) => s + e.monthlyTarget, 0);
                    const colors: Record<string, string> = {
                      'Direct Sales': 'border-blue-200 bg-blue-50/50',
                      'FP Team': 'border-purple-200 bg-purple-50/50',
                      'CDM/POSP RM': 'border-amber-200 bg-amber-50/50',
                      'Area Manager': 'border-emerald-200 bg-emerald-50/50',
                      'Support': 'border-slate-200 bg-slate-50/50',
                    };
                    return (
                      <div key={seg} className={`rounded-lg border p-3 ${colors[seg] || 'border-slate-200'}`}>
                        <p className="text-xs font-semibold text-slate-500 mb-1">{seg}</p>
                        <p className="text-lg font-bold text-slate-700">{count}</p>
                        {target > 0 && (
                          <p className="text-xs text-emerald-600 font-medium mt-1">
                            Target: {formatINR(target)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Incentive Slab Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    DST Slabs (Direct Sales Team)
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">For Direct Sales &amp; FP Team (margin &ge;30%)</p>
                  <div className="space-y-1.5">
                    {dstSlabs.map(s => {
                      const color = s.incentiveRate === 0 ? 'bg-red-50 text-red-600'
                        : s.incentiveRate <= 4 ? 'bg-yellow-50 text-yellow-700'
                        : s.incentiveRate <= 5 ? 'bg-blue-50 text-blue-600'
                        : s.incentiveRate <= 6 ? 'bg-emerald-50 text-emerald-600'
                        : s.incentiveRate <= 7 ? 'bg-purple-50 text-purple-600'
                        : 'bg-amber-50 text-amber-600';
                      return (
                        <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
                          <span className="text-xs font-medium">{s.achievementMin}%{s.achievementMax ? `\u2013${s.achievementMax}%` : '+'}</span>
                          <span className="text-xs font-bold">{s.incentiveRate}% &mdash; {s.slabLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    POSP RM Slabs (Channel Team)
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">For CDM/POSP RM managing sub-brokers (70/30 margin)</p>
                  <div className="space-y-1.5">
                    {pospSlabs.map(s => {
                      const color = s.incentiveRate === 0 ? 'bg-red-50 text-red-600'
                        : s.incentiveRate <= 1.2 ? 'bg-yellow-50 text-yellow-700'
                        : s.incentiveRate <= 1.5 ? 'bg-blue-50 text-blue-600'
                        : s.incentiveRate <= 1.8 ? 'bg-emerald-50 text-emerald-600'
                        : s.incentiveRate <= 2.1 ? 'bg-purple-50 text-purple-600'
                        : 'bg-amber-50 text-amber-600';
                      return (
                        <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
                          <span className="text-xs font-medium">{s.achievementMin}%{s.achievementMax ? `\u2013${s.achievementMax}%` : '+'}</span>
                          <span className="text-xs font-bold">{s.incentiveRate}% &mdash; {s.slabLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Employee Master (ENHANCED with maker-checker) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'employees' && (
        <>
          {/* Add Employee Modal */}
          {showAddEmployee && (
            <EmployeeFormModal
              title="Add New Employee"
              onClose={() => setShowAddEmployee(false)}
              onSubmit={handleAddEmployee}
              submitting={submitting}
            />
          )}
          {/* Edit Employee Modal */}
          {editingEmployee && (
            <EmployeeFormModal
              title={`Edit Employee: ${editingEmployee.name}`}
              employee={editingEmployee}
              onClose={() => setEditingEmployee(null)}
              onSubmit={(data) => handleEditEmployee(editingEmployee, data)}
              submitting={submitting}
            />
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value as typeof entityFilter)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Entities</option>
                <option value="TIB">TIB (Insurance)</option>
                <option value="TAS">TAS (MF)</option>
              </select>
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Segments</option>
                {segments.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-slate-400 font-medium">
                {filteredEmployees.length} of {employees.length} employees
              </span>
              {canEdit(userRole) && (
                <button onClick={() => setShowAddEmployee(true)} className={btnPrimary}>
                  <UserPlus className="w-4 h-4" /> Add Employee
                </button>
              )}
            </div>

            {/* Table */}
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-20"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entity</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segment</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Salary</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Multiplier</th>
                      {canEdit(userRole) && (
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, i) => (
                      <EmployeeRow
                        key={emp.id}
                        emp={emp}
                        rank={i + 1}
                        canEditRow={canEdit(userRole)}
                        onEdit={(e) => setEditingEmployee(e)}
                        onDeactivate={handleDeactivateEmployee}
                      />
                    ))}
                  </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-400">No employees match your filters.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Incentive Calculator (kept as-is) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'incentive' && (
        <IncentiveSimulator employees={employees} />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Product Rules (ENHANCED with editing) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <>
          {showAddProduct && (
            <ProductFormModal
              onClose={() => setShowAddProduct(false)}
              onSubmit={handleAddProduct}
              submitting={submitting}
            />
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-400" />
                  Product Credit Rules &amp; Tier Classification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Every product is classified into 3 tiers based on the company&apos;s commission rate. Tier determines credit multiplier (100%/75%/50%).
                </p>
              </div>
              {isAdmin(userRole) && (
                <button onClick={() => setShowAddProduct(true)} className={btnPrimary}>
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              )}
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-20"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Tier</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Commission Range</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Credit %</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Referral %</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Motor</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Active</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Notes</th>
                      {isAdmin(userRole) && (
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <ProductRowEditable
                        key={p.id}
                        product={p}
                        index={i}
                        isEditing={editingProductId === p.id}
                        canEditRow={isAdmin(userRole)}
                        onStartEdit={() => setEditingProductId(p.id)}
                        onCancelEdit={() => setEditingProductId(null)}
                        onSave={(updates) => handleEditProduct(p, updates)}
                        submitting={submitting}
                      />
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-400">No products found.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 5: Incentive Slabs (NEW) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'slabs' && (
        <>
          {showAddSlab && (
            <SlabFormModal
              onClose={() => setShowAddSlab(false)}
              onSubmit={handleAddSlab}
              submitting={submitting}
            />
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-400" />
                Incentive Slab Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Achievement-based incentive rate tables. {isSuperAdmin(userRole) ? 'You can edit slabs directly.' : isAdmin(userRole) ? 'You can request changes for Super Admin approval.' : 'View only.'}
              </p>
            </div>
            {isAdmin(userRole) && (
              <button onClick={() => setShowAddSlab(true)} className={btnPrimary}>
                <Plus className="w-4 h-4" /> Add Slab
              </button>
            )}
          </div>

          {loadingSlabs ? (
            <div className="flex items-center justify-center py-20"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DST Slabs */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-blue-50/50">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    DST &mdash; Direct Sales Team
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">For Direct Sales &amp; FP Team</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Achievement Range</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Rate</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Multiplier</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Label</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Effective</th>
                        {isAdmin(userRole) && (
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {dstSlabs.map(slab => (
                        <SlabRowEditable
                          key={slab.id}
                          slab={slab}
                          isEditing={editingSlabId === slab.id}
                          canEdit={isAdmin(userRole)}
                          isSuperAdmin={isSuperAdmin(userRole)}
                          onStartEdit={() => setEditingSlabId(slab.id)}
                          onCancelEdit={() => setEditingSlabId(null)}
                          onSave={(updates) => handleEditSlab(slab, updates)}
                          submitting={submitting}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POSP_RM Slabs */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-amber-50/50">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    POSP_RM &mdash; Channel Team
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">For CDM/POSP RM &amp; Area Managers</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Achievement Range</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Rate</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Multiplier</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Label</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Effective</th>
                        {isAdmin(userRole) && (
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pospSlabs.map(slab => (
                        <SlabRowEditable
                          key={slab.id}
                          slab={slab}
                          isEditing={editingSlabId === slab.id}
                          canEdit={isAdmin(userRole)}
                          isSuperAdmin={isSuperAdmin(userRole)}
                          onStartEdit={() => setEditingSlabId(slab.id)}
                          onCancelEdit={() => setEditingSlabId(null)}
                          onSave={(updates) => handleEditSlab(slab, updates)}
                          submitting={submitting}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =====================================================================
// ─── EMPLOYEE FORM MODAL ───
// =====================================================================
function EmployeeFormModal({ title, employee, onClose, onSubmit, submitting }: {
  title: string;
  employee?: Employee;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    employeeCode: employee?.employeeCode || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    designation: employee?.designation || '',
    department: employee?.department || '',
    entity: employee?.entity || 'TAS',
    segment: employee?.segment || 'Direct Sales',
    levelCode: employee?.levelCode || 'L1',
    grossSalary: employee?.grossSalary || 0,
    monthlyTarget: employee?.monthlyTarget || 0,
    location: employee?.location || '',
  });

  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={e => update('name', e.target.value)} />
          </Field>
          <Field label="Employee Code">
            <input className={inputCls} value={form.employeeCode} onChange={e => update('employeeCode', e.target.value)} disabled={!!employee} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={e => update('email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={e => update('phone', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Designation">
            <input className={inputCls} value={form.designation} onChange={e => update('designation', e.target.value)} />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={e => update('department', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Entity">
            <select className={inputCls} value={form.entity} onChange={e => update('entity', e.target.value)}>
              <option value="TAS">TAS</option>
              <option value="TIB">TIB</option>
              <option value="Vendor">Vendor</option>
            </select>
          </Field>
          <Field label="Segment">
            <select className={inputCls} value={form.segment} onChange={e => update('segment', e.target.value)}>
              <option value="Direct Sales">Direct Sales</option>
              <option value="FP Team">FP Team</option>
              <option value="CDM/POSP RM">CDM/POSP RM</option>
              <option value="Area Manager">Area Manager</option>
              <option value="Support">Support</option>
            </select>
          </Field>
          <Field label="Level Code">
            <select className={inputCls} value={form.levelCode} onChange={e => update('levelCode', e.target.value)}>
              {['L1','L2','L3','L4','L5','L6','L7'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Gross Salary">
            <input className={inputCls} type="number" value={form.grossSalary} onChange={e => update('grossSalary', Number(e.target.value))} />
          </Field>
          <Field label="Monthly Target">
            <input className={inputCls} type="number" value={form.monthlyTarget} onChange={e => update('monthlyTarget', Number(e.target.value))} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={form.location} onChange={e => update('location', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={submitting || !form.name || !form.employeeCode}
            className={btnPrimary}
          >
            {submitting ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Submit for Approval
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================================
// ─── PRODUCT ROW (EDITABLE INLINE) ───
// =====================================================================
function ProductRowEditable({ product, index, isEditing, canEditRow, onStartEdit, onCancelEdit, onSave, submitting }: {
  product: ProductRow;
  index: number;
  isEditing: boolean;
  canEditRow: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    tier: product.tier || 1,
    creditPct: product.creditPct,
    referralCreditPct: product.referralCreditPct,
    commissionRange: product.commissionRange || '',
    notes: product.notes || '',
  });

  const tierColors: Record<number, string> = {
    1: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    2: 'bg-blue-50 border-blue-200 text-blue-700',
    3: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const tierLabels: Record<number, string> = {
    1: 'Tier 1 (>30%)',
    2: 'Tier 2 (15-30%)',
    3: 'Tier 3 (<15%)',
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 border-b border-slate-100">
        <td className="px-4 py-2.5 text-sm text-slate-400">{index + 1}</td>
        <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{product.productName}</td>
        <td className="px-4 py-2.5 text-sm text-slate-600">{product.productCategory}</td>
        <td className="px-4 py-2.5">
          <select className="px-2 py-1 text-xs border border-slate-300 rounded" value={form.tier} onChange={e => setForm(p => ({ ...p, tier: Number(e.target.value) }))}>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
          </select>
        </td>
        <td className="px-4 py-2.5">
          <input className="w-24 px-2 py-1 text-xs border border-slate-300 rounded" value={form.commissionRange} onChange={e => setForm(p => ({ ...p, commissionRange: e.target.value }))} />
        </td>
        <td className="px-4 py-2.5">
          <input className="w-16 px-2 py-1 text-xs border border-slate-300 rounded" type="number" value={form.creditPct} onChange={e => setForm(p => ({ ...p, creditPct: Number(e.target.value) }))} />
        </td>
        <td className="px-4 py-2.5">
          <input className="w-16 px-2 py-1 text-xs border border-slate-300 rounded" type="number" value={form.referralCreditPct} onChange={e => setForm(p => ({ ...p, referralCreditPct: Number(e.target.value) }))} />
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-500">{product.isMotor ? 'Yes' : 'No'}</td>
        <td className="px-4 py-2.5 text-xs text-slate-500">{product.isActive ? 'Yes' : 'No'}</td>
        <td className="px-4 py-2.5">
          <input className="w-28 px-2 py-1 text-xs border border-slate-300 rounded" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </td>
        <td className="px-4 py-2.5">
          <div className="flex gap-1">
            <button onClick={() => onSave(form)} disabled={submitting} className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              {submitting ? <Spinner className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onCancelEdit} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 last:border-0">
      <td className="px-4 py-2.5 text-sm text-slate-400">{index + 1}</td>
      <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{product.productName}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{product.productCategory}</td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierColors[product.tier || 1]}`}>
          {tierLabels[product.tier || 1]}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{product.commissionRange || '\u2014'}</td>
      <td className="px-4 py-2.5 text-sm font-bold text-slate-700">{product.creditPct}%</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{product.referralCreditPct}%</td>
      <td className="px-4 py-2.5 text-xs text-slate-500">{product.isMotor ? 'Yes' : 'No'}</td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${product.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-slate-400">{product.notes || '\u2014'}</td>
      {canEditRow && (
        <td className="px-4 py-2.5">
          <button onClick={onStartEdit} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Edit">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}

// =====================================================================
// ─── PRODUCT FORM MODAL (for adding new product) ───
// =====================================================================
function ProductFormModal({ onClose, onSubmit, submitting }: {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    productName: '',
    productCategory: 'MF',
    tier: 1,
    commissionRange: '',
    creditPct: 100,
    referralCreditPct: 0,
    isMotor: false,
    isActive: true,
    notes: '',
  });
  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Modal title="Add New Product" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Product Name">
          <input className={inputCls} value={form.productName} onChange={e => update('productName', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className={inputCls} value={form.productCategory} onChange={e => update('productCategory', e.target.value)}>
              <option value="MF">MF</option>
              <option value="Life">Life</option>
              <option value="Health">Health</option>
              <option value="GI Motor">GI Motor</option>
              <option value="GI Non-Motor">GI Non-Motor</option>
            </select>
          </Field>
          <Field label="Tier">
            <select className={inputCls} value={form.tier} onChange={e => update('tier', Number(e.target.value))}>
              <option value={1}>Tier 1 (&gt;30%)</option>
              <option value={2}>Tier 2 (15-30%)</option>
              <option value={3}>Tier 3 (&lt;15%)</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Commission Range">
            <input className={inputCls} value={form.commissionRange} onChange={e => update('commissionRange', e.target.value)} placeholder="e.g. 15-25%" />
          </Field>
          <Field label="Credit %">
            <input className={inputCls} type="number" value={form.creditPct} onChange={e => update('creditPct', Number(e.target.value))} />
          </Field>
          <Field label="Referral Credit %">
            <input className={inputCls} type="number" value={form.referralCreditPct} onChange={e => update('referralCreditPct', Number(e.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Motor Product?">
            <select className={inputCls} value={form.isMotor ? 'yes' : 'no'} onChange={e => update('isMotor', e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={e => update('notes', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={submitting || !form.productName}
            className={btnPrimary}
          >
            {submitting ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Submit for Approval
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================================
// ─── SLAB ROW (EDITABLE INLINE) ───
// =====================================================================
function SlabRowEditable({ slab, isEditing, canEdit: canEditSlab, isSuperAdmin: isSA, onStartEdit, onCancelEdit, onSave, submitting }: {
  slab: IncentiveSlabRow;
  isEditing: boolean;
  canEdit: boolean;
  isSuperAdmin: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    achievementMin: slab.achievementMin,
    achievementMax: slab.achievementMax,
    incentiveRate: slab.incentiveRate,
    multiplier: slab.multiplier,
    slabLabel: slab.slabLabel,
  });

  const slabColor = slab.incentiveRate === 0 ? 'text-red-600'
    : slab.multiplier <= 1 ? 'text-yellow-700'
    : slab.multiplier <= 1.25 ? 'text-blue-600'
    : slab.multiplier <= 1.5 ? 'text-emerald-600'
    : slab.multiplier <= 1.75 ? 'text-purple-600'
    : 'text-amber-600';

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 border-b border-slate-100">
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <input className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded" type="number" value={form.achievementMin} onChange={e => setForm(p => ({ ...p, achievementMin: Number(e.target.value) }))} />
            <span className="text-xs text-slate-400">-</span>
            <input className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded" type="number" value={form.achievementMax ?? ''} onChange={e => setForm(p => ({ ...p, achievementMax: e.target.value ? Number(e.target.value) : null }))} placeholder="null" />
          </div>
        </td>
        <td className="px-3 py-2">
          <input className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded" type="number" step="0.1" value={form.incentiveRate} onChange={e => setForm(p => ({ ...p, incentiveRate: Number(e.target.value) }))} />
        </td>
        <td className="px-3 py-2">
          <input className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded" type="number" step="0.25" value={form.multiplier} onChange={e => setForm(p => ({ ...p, multiplier: Number(e.target.value) }))} />
        </td>
        <td className="px-3 py-2">
          <input className="w-28 px-1 py-0.5 text-xs border border-slate-300 rounded" value={form.slabLabel} onChange={e => setForm(p => ({ ...p, slabLabel: e.target.value }))} />
        </td>
        <td className="px-3 py-2 text-[10px] text-slate-400">{slab.effectiveFrom}</td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={() => onSave(form)} disabled={submitting} className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              {submitting ? <Spinner className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            </button>
            <button onClick={onCancelEdit} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
              <X className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 last:border-0">
      <td className="px-3 py-2 text-xs font-medium text-slate-600">
        {slab.achievementMin}%{slab.achievementMax ? `\u2013${slab.achievementMax}%` : '+'}
      </td>
      <td className={`px-3 py-2 text-xs font-bold ${slabColor}`}>{slab.incentiveRate}%</td>
      <td className="px-3 py-2 text-xs font-medium text-slate-600">{slab.multiplier}\u00d7</td>
      <td className="px-3 py-2 text-xs font-semibold text-slate-700">{slab.slabLabel}</td>
      <td className="px-3 py-2">
        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{slab.effectiveFrom}</span>
      </td>
      {canEditSlab && (
        <td className="px-3 py-2">
          <button
            onClick={onStartEdit}
            className="p-1 rounded hover:bg-blue-50 text-blue-600"
            title={isSA ? 'Edit slab' : 'Request change'}
          >
            {isSA ? <Edit3 className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
          </button>
        </td>
      )}
    </tr>
  );
}

// =====================================================================
// ─── SLAB FORM MODAL (for adding new slab) ───
// =====================================================================
function SlabFormModal({ onClose, onSubmit, submitting }: {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    slabTableName: 'DST' as SlabTable,
    achievementMin: 0,
    achievementMax: 80 as number | null,
    incentiveRate: 0,
    multiplier: 0,
    slabLabel: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: null as string | null,
    version: 'v1.0',
  });
  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Modal title="Add Incentive Slab" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slab Table">
            <select className={inputCls} value={form.slabTableName} onChange={e => update('slabTableName', e.target.value)}>
              <option value="DST">DST (Direct Sales Team)</option>
              <option value="POSP_RM">POSP_RM (Channel Team)</option>
            </select>
          </Field>
          <Field label="Slab Label">
            <input className={inputCls} value={form.slabLabel} onChange={e => update('slabLabel', e.target.value)} placeholder="e.g. Base 4%" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Achievement Min (%)">
            <input className={inputCls} type="number" value={form.achievementMin} onChange={e => update('achievementMin', Number(e.target.value))} />
          </Field>
          <Field label="Achievement Max (%)">
            <input className={inputCls} type="number" value={form.achievementMax ?? ''} onChange={e => update('achievementMax', e.target.value ? Number(e.target.value) : null)} placeholder="Leave empty for unlimited" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Incentive Rate (%)">
            <input className={inputCls} type="number" step="0.1" value={form.incentiveRate} onChange={e => update('incentiveRate', Number(e.target.value))} />
          </Field>
          <Field label="Multiplier">
            <input className={inputCls} type="number" step="0.25" value={form.multiplier} onChange={e => update('multiplier', Number(e.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Effective From">
            <input className={inputCls} type="date" value={form.effectiveFrom} onChange={e => update('effectiveFrom', e.target.value)} />
          </Field>
          <Field label="Version">
            <input className={inputCls} value={form.version} onChange={e => update('version', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={submitting || !form.slabLabel}
            className={btnPrimary}
          >
            {submitting ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Submit for Approval
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================================
// ─── INCENTIVE SIMULATOR (kept from original, now takes employees prop) ───
// =====================================================================
function IncentiveSimulator({ employees }: { employees: Employee[] }) {
  const salesEmployees = useMemo(() => employees.filter(e => e.monthlyTarget > 0), [employees]);
  const [selectedEmpId, setSelectedEmpId] = useState(salesEmployees[0]?.id || 0);
  const [rawBusiness, setRawBusiness] = useState(250000);
  const [sipClawback, setSipClawback] = useState(0);

  const employee = employees.find(e => e.id === selectedEmpId);

  // Update selection when employees load
  useEffect(() => {
    if (salesEmployees.length > 0 && !salesEmployees.find(e => e.id === selectedEmpId)) {
      setSelectedEmpId(salesEmployees[0].id);
    }
  }, [salesEmployees, selectedEmpId]);

  if (!employee) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
        {employees.length === 0 ? (
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        ) : (
          'No sales employees available for simulation.'
        )}
      </div>
    );
  }

  const slabTable = employee.segment === 'CDM/POSP RM' || employee.segment === 'Area Manager' ? 'POSP_RM' : 'DST';

  const netBusiness = Math.max(0, rawBusiness - sipClawback);
  const achievementPct = employee.monthlyTarget > 0
    ? Math.round((netBusiness / employee.monthlyTarget) * 10000) / 100
    : 0;

  const slabs = slabTable === 'DST'
    ? [
        { min: 0, max: 80, rate: 0, mult: 0, label: 'No Incentive' },
        { min: 80, max: 100, rate: 4, mult: 1.0, label: 'Base 4%' },
        { min: 101, max: 110, rate: 5, mult: 1.25, label: 'Enhanced 5%' },
        { min: 111, max: 130, rate: 6, mult: 1.5, label: 'Super 6%' },
        { min: 131, max: 150, rate: 7, mult: 1.75, label: 'Star 7%' },
        { min: 151, max: 999, rate: 8, mult: 2.0, label: 'Champion 8%' },
      ]
    : [
        { min: 0, max: 80, rate: 0, mult: 0, label: 'No Incentive' },
        { min: 80, max: 100, rate: 1.2, mult: 1.0, label: 'Base 1.2%' },
        { min: 101, max: 110, rate: 1.5, mult: 1.25, label: 'Enhanced 1.5%' },
        { min: 111, max: 130, rate: 1.8, mult: 1.5, label: 'Super 1.8%' },
        { min: 131, max: 150, rate: 2.1, mult: 1.75, label: 'Star 2.1%' },
        { min: 151, max: 999, rate: 2.4, mult: 2.0, label: 'Champion 2.4%' },
      ];

  const currentSlab = slabs.reduce((best, s) => achievementPct >= s.min ? s : best, slabs[0]);
  const incentiveAmount = netBusiness * (currentSlab.rate / 100) * currentSlab.mult;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
        <IndianRupee className="w-5 h-5 text-emerald-500" />
        Incentive Simulator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {salesEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name} &mdash; {e.designation}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Raw Business (&pound;)
            </label>
            <input
              type="number"
              value={rawBusiness}
              onChange={(e) => setRawBusiness(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="range"
              min={0}
              max={employee.monthlyTarget * 2 || 1000000}
              step={10000}
              value={rawBusiness}
              onChange={(e) => setRawBusiness(Number(e.target.value))}
              className="w-full mt-2 accent-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SIP Clawback Debit
            </label>
            <input
              type="number"
              value={sipClawback}
              onChange={(e) => setSipClawback(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
            <p><strong>Segment:</strong> {employee.segment}</p>
            <p><strong>Slab Table:</strong> {slabTable}</p>
            <p><strong>Salary:</strong> {formatINR(employee.grossSalary)}</p>
            <p><strong>Target Multiplier:</strong> {employee.targetMultiplier}&times;</p>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-2">
          {/* Achievement Meter */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Achievement</span>
              <span className={`text-2xl font-bold ${achievementPct >= 100 ? 'text-emerald-600' : achievementPct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                {achievementPct}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  achievementPct >= 151 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                  achievementPct >= 131 ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                  achievementPct >= 111 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                  achievementPct >= 100 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  achievementPct >= 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${Math.min(achievementPct, 200) / 2}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-400">
              <span>0%</span><span>80%</span><span>100%</span><span>130%</span><span>150%</span><span>200%</span>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium">Monthly Target</p>
              <p className="text-xl font-bold text-blue-800">{formatINR(employee.monthlyTarget)}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">Net Weighted Business</p>
              <p className="text-xl font-bold text-emerald-800">{formatINR(netBusiness)}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium">Current Slab</p>
              <p className="text-lg font-bold text-purple-800">{currentSlab.label}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Estimated Incentive</p>
              <p className="text-xl font-bold text-amber-800">{formatINR(Math.round(incentiveAmount))}</p>
            </div>
          </div>

          {/* Formula Display */}
          <div className="p-4 bg-slate-800 rounded-lg text-green-400 font-mono text-xs space-y-1">
            <p>Incentive Calculation Formula</p>
            <p>Net Business = {formatINR(rawBusiness)} - {formatINR(sipClawback)} = {formatINR(netBusiness)}</p>
            <p>Achievement  = {formatINR(netBusiness)} / {formatINR(employee.monthlyTarget)} = {achievementPct}%</p>
            <p>Slab         = {currentSlab.label} ({currentSlab.rate}% &times; {currentSlab.mult}&times;)</p>
            <p>Incentive    = {formatINR(netBusiness)} &times; {currentSlab.rate}% &times; {currentSlab.mult} = <span className="text-amber-400 font-bold">{formatINR(Math.round(incentiveAmount))}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
