'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserPlus, Shield, Search, ChevronDown, ChevronRight,
  Edit3, Eye, X, Loader2, CheckCircle, AlertTriangle, Building2,
  ArrowUpRight, Network, Layers, Percent, UserCheck, GitBranch,
  Save, Power, Filter,
} from 'lucide-react';
import type { AdminRole } from '@/lib/auth/config';
import type {
  PartnerRecord, PartnerType, POSPCategory, FranchiseSubType,
  POSPCategoryConfig, PartnerManagedByType,
} from '@/lib/mis/types';
import {
  POSP_CATEGORIES,
  POSP_CATEGORY_ORDER,
  CATEGORY_APPROVAL_LIMITS,
  FRANCHISE_DEFAULTS,
  REFERRAL_DEFAULTS,
} from '@/lib/mis/types';

// ─── Types ───
interface AuthUser {
  email: string;
  name: string;
  role: AdminRole;
}

interface EmployeeSummary {
  id: number;
  name: string;
  employeeCode: string;
  designation: string;
  segment: string;
}

interface PartnerStats {
  total: number;
  active: number;
  byType: Record<PartnerType, number>;
  bqpCertifiedFranchises: number;
}

type TabId = 'directory' | 'categories' | 'franchise' | 'referral' | 'hierarchy';
type ModalType = 'create' | 'detail' | 'category_change' | null;

// ─── Toast Component ───
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── Color Maps ───
const TYPE_COLORS: Record<PartnerType, { badge: string; dot: string }> = {
  POSP: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  BQP: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  Franchise: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  Referral: { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   badge: 'bg-slate-100 text-slate-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    badge: 'bg-teal-100 text-teal-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   badge: 'bg-green-100 text-green-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-700' },
};

function getCatColor(color: string) {
  return CATEGORY_COLORS[color] || CATEGORY_COLORS.slate;
}

function getCategoryConfig(cat: POSPCategory): POSPCategoryConfig | undefined {
  return POSP_CATEGORIES.find((c) => c.category === cat);
}

function getCategoryIndex(cat: POSPCategory): number {
  return POSP_CATEGORY_ORDER.indexOf(cat);
}

// Approximate payout % per category for display
const CATEGORY_PCT: Record<POSPCategory, number> = {
  A: 30, B: 40, C: 50, D: 60, 'D+': 65, E: 70, 'E+': 75, F1: 80, F2: 90,
};

// ─── Main Page ───
export default function PartnersPage() {
  // Auth
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [stats, setStats] = useState<PartnerStats>({ total: 0, active: 0, byType: { POSP: 0, BQP: 0, Franchise: 0, Referral: 0 }, bqpCertifiedFranchises: 0 });

  // UI
  const [activeTab, setActiveTab] = useState<TabId>('directory');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<PartnerType | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [filterCity, setFilterCity] = useState('');
  const [filterRM, setFilterRM] = useState('');

  // Category change modal state
  const [catChangeLob, setCatChangeLob] = useState<'life' | 'health' | 'giNonMotor' | 'giMotor'>('life');
  const [catChangeNew, setCatChangeNew] = useState<POSPCategory>('A');
  const [catChangeComment, setCatChangeComment] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // ─── Auth Check ───
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) { window.location.href = '/admin/login'; return; }
        const data = await res.json();
        const u = data.user || data;
        setUser({ email: u.email, name: u.name, role: u.role });
      } catch { window.location.href = '/admin/login'; }
      finally { setLoading(false); }
    }
    checkAuth();
  }, []);

  // ─── Load Data ───
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mis/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
        setStats(data.stats || stats);
        setEmployees(data.employees || []);
      }
    } catch { /* silently fail — empty state shown */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // ─── API Post Helper ───
  const apiPost = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/mis/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }, []);

  // ─── Employee name resolver ───
  const getEmployeeName = useCallback((id: number): string => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : `Employee #${id}`;
  }, [employees]);

  const getPartnerName = useCallback((id: number): string => {
    const p = partners.find((pr) => pr.id === id);
    return p ? p.name : `Partner #${id}`;
  }, [partners]);

  const getManagedByLabel = useCallback((p: PartnerRecord): string => {
    if (p.managedByType === 'DST' || p.managedByType === 'CDM') {
      return getEmployeeName(p.managedById);
    }
    return getPartnerName(p.managedById);
  }, [getEmployeeName, getPartnerName]);

  // ─── Filtered Partners ───
  const filteredPartners = useMemo(() => {
    let result = [...partners];
    if (filterType) result = result.filter((p) => p.type === filterType);
    if (filterStatus === 'active') result = result.filter((p) => p.isActive);
    if (filterStatus === 'inactive') result = result.filter((p) => !p.isActive);
    if (filterCity) result = result.filter((p) => p.city?.toLowerCase().includes(filterCity.toLowerCase()));
    if (filterRM) {
      const q = filterRM.toLowerCase();
      result = result.filter((p) => {
        const mgr = getManagedByLabel(p);
        return mgr.toLowerCase().includes(q);
      });
    }
    return result;
  }, [partners, filterType, filterStatus, filterCity, filterRM, getManagedByLabel]);

  // ─── Partner subsets ───
  const pospPartners = useMemo(() => partners.filter((p) => p.type === 'POSP' && p.isActive), [partners]);
  const franchisePartners = useMemo(() => partners.filter((p) => p.type === 'Franchise'), [partners]);
  const referralPartners = useMemo(() => partners.filter((p) => p.type === 'Referral'), [partners]);

  // ─── Tabs ───
  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'directory', label: 'Partner Directory', icon: Users },
    { id: 'categories', label: 'POSP Categories', icon: Layers },
    { id: 'franchise', label: 'Franchise Mgmt', icon: Building2 },
    { id: 'referral', label: 'Referral Mgmt', icon: UserCheck },
    { id: 'hierarchy', label: 'Hierarchy View', icon: GitBranch },
  ];

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  if (!user) return null;

  // ═══════════════════════════════════════════════════════════
  // CREATE PARTNER MODAL
  // ═══════════════════════════════════════════════════════════
  function CreatePartnerModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
      type: 'POSP' as PartnerType,
      name: '',
      email: '',
      phone: '',
      location: '',
      city: '',
      managedByType: 'DST' as PartnerManagedByType,
      managedById: '',
      parentFranchiseId: '',
      franchiseSubType: 'Basic' as FranchiseSubType,
      agreementPct: FRANCHISE_DEFAULTS.defaultAgreementPct.toString(),
      referralPct: REFERRAL_DEFAULTS.defaultPayoutPct.toString(),
      notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const managingEmployees = useMemo(() => {
      if (form.managedByType === 'DST') return employees;
      if (form.managedByType === 'CDM') return employees.filter((e) => e.segment === 'CDM/POSP RM');
      return [];
    }, [form.managedByType]);

    const managingPartners = useMemo(() => {
      if (form.managedByType === 'Franchise') {
        return partners.filter((p) => p.type === 'Franchise' && p.isActive && p.franchiseSubType === 'BQP_Certified');
      }
      if (form.managedByType === 'BQP') {
        return partners.filter((p) => p.type === 'BQP' && p.isActive);
      }
      return [];
    }, [form.managedByType]);

    const isEmployeeManaged = form.managedByType === 'DST' || form.managedByType === 'CDM';

    const bqpFranchises = useMemo(
      () => partners.filter((p) => p.type === 'Franchise' && p.isActive && p.franchiseSubType === 'BQP_Certified'),
      []
    );

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          action: 'create',
          type: form.type,
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          location: form.location || undefined,
          city: form.city || undefined,
          managedByType: form.managedByType,
          managedById: form.managedById,
          notes: form.notes || undefined,
        };
        if (form.type === 'Franchise') {
          payload.franchiseSubType = form.franchiseSubType;
          payload.agreementPct = form.agreementPct;
        }
        if (form.type === 'Referral') {
          payload.agreementPct = form.referralPct;
        }
        if (form.type === 'POSP' && form.parentFranchiseId) {
          payload.parentFranchiseId = form.parentFranchiseId;
        }

        const result = await apiPost(payload);
        if (result.success) {
          showToast(`Partner ${result.partner.code} created successfully`);
          await loadData();
          onClose();
        } else {
          showToast(result.error || 'Failed to create partner', 'error');
        }
      } catch {
        showToast('Failed to create partner', 'error');
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              Add New Partner
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Partner Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Partner Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartnerType }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="POSP">POSP</option>
                <option value="BQP">BQP</option>
                <option value="Franchise">Franchise</option>
                <option value="Referral">Referral</option>
              </select>
            </div>

            {/* Name + Email row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Partner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Phone + City row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text" value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Guwahati"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Address</label>
              <input
                type="text" value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Office or area"
              />
            </div>

            {/* Managed By */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Managed By Type *</label>
                <select
                  value={form.managedByType}
                  onChange={(e) => setForm((f) => ({ ...f, managedByType: e.target.value as PartnerManagedByType, managedById: '' }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="DST">DST Employee</option>
                  <option value="CDM">CDM / POSP RM</option>
                  <option value="Franchise">Franchise (BQP)</option>
                  <option value="BQP">BQP Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Managing Entity *</label>
                <select
                  required value={form.managedById}
                  onChange={(e) => setForm((f) => ({ ...f, managedById: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  {isEmployeeManaged
                    ? managingEmployees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                      ))
                    : managingPartners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* POSP under Franchise */}
            {form.type === 'POSP' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Franchise (optional)</label>
                <select
                  value={form.parentFranchiseId}
                  onChange={(e) => setForm((f) => ({ ...f, parentFranchiseId: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">None (Direct)</option>
                  {bqpFranchises.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">If this POSP works under a BQP-certified Franchise, select it here</p>
              </div>
            )}

            {/* Franchise sub-type + agreement */}
            {form.type === 'Franchise' && (
              <div className="space-y-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">Franchise Sub-Type</label>
                    <select
                      value={form.franchiseSubType}
                      onChange={(e) => setForm((f) => ({ ...f, franchiseSubType: e.target.value as FranchiseSubType }))}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Basic">Basic</option>
                      <option value="BQP_Certified">BQP Certified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">Agreement % (default {FRANCHISE_DEFAULTS.defaultAgreementPct}%)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={FRANCHISE_DEFAULTS.minAgreementPct} max={FRANCHISE_DEFAULTS.maxAgreementPct}
                        value={form.agreementPct}
                        onChange={(e) => setForm((f) => ({ ...f, agreementPct: e.target.value }))}
                        className="flex-1 accent-amber-600"
                      />
                      <span className="text-sm font-bold text-amber-800 w-10 text-right">{form.agreementPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Referral payout */}
            {form.type === 'Referral' && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <label className="block text-sm font-medium text-purple-800 mb-1">
                  Payout % (default {REFERRAL_DEFAULTS.defaultPayoutPct}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={REFERRAL_DEFAULTS.minPayoutPct} max={REFERRAL_DEFAULTS.maxPayoutPct}
                    value={form.referralPct}
                    onChange={(e) => setForm((f) => ({ ...f, referralPct: e.target.value }))}
                    className="w-24 border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-purple-600">Changing from 60% requires Admin approval</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Optional notes..."
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button
                type="submit" disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Partner
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PARTNER DETAIL MODAL
  // ═══════════════════════════════════════════════════════════
  function PartnerDetailModal({ partner, onClose }: { partner: PartnerRecord; onClose: () => void }) {
    const pospsUnder = useMemo(() => partners.filter((p) => p.parentFranchiseId === partner.id && p.type === 'POSP'), [partner.id]);

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Partner Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div className="p-6 space-y-4">
            {/* Header card */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${TYPE_COLORS[partner.type].badge}`}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{partner.name}</h3>
                <p className="text-sm text-slate-500 font-mono">{partner.code}</p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[partner.type].badge}`}>
                {partner.type}
                {partner.franchiseSubType && ` (${partner.franchiseSubType === 'BQP_Certified' ? 'BQP' : 'Basic'})`}
              </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Status</p>
                <p className={`font-medium ${partner.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {partner.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Onboarded</p>
                <p className="font-medium text-slate-700">{partner.onboardingDate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Managed By</p>
                <p className="font-medium text-slate-700">{getManagedByLabel(partner)} ({partner.managedByType})</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">City</p>
                <p className="font-medium text-slate-700">{partner.city || 'N/A'}</p>
              </div>
              {partner.email && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-medium text-slate-700 truncate">{partner.email}</p>
                </div>
              )}
              {partner.phone && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium text-slate-700">{partner.phone}</p>
                </div>
              )}
              {(partner.type === 'Franchise' || partner.type === 'Referral') && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Agreement / Payout %</p>
                  <p className="font-medium text-slate-700">{partner.agreementPct}%</p>
                </div>
              )}
            </div>

            {/* POSP Categories */}
            {partner.categoryPerLOB && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">POSP Categories (by LOB)</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['life', 'health', 'giNonMotor', 'giMotor'] as const).map((lob) => {
                    const cat = partner.categoryPerLOB![lob];
                    const cfg = getCategoryConfig(cat);
                    const colors = getCatColor(cfg?.color || 'slate');
                    return (
                      <div key={lob} className={`p-2 rounded-lg text-center ${colors.bg}`}>
                        <p className="text-[10px] uppercase text-slate-500">{lob === 'giNonMotor' ? 'GI Non-Motor' : lob === 'giMotor' ? 'GI Motor' : lob}</p>
                        <p className={`text-lg font-bold ${colors.text}`}>{cat}</p>
                        <p className="text-[10px] text-slate-500">{CATEGORY_PCT[cat]}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upgrade History */}
            {partner.upgradedFrom && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">Upgraded from {partner.upgradedFrom} on {partner.upgradeDate}</p>
              </div>
            )}

            {/* BQP Cert Date */}
            {partner.bqpCertDate && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">BQP Certified: {partner.bqpCertDate}</p>
              </div>
            )}

            {/* POSPs under franchise */}
            {partner.type === 'Franchise' && pospsUnder.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">POSPs Under This Franchise ({pospsUnder.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pospsUnder.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="font-mono text-slate-500">{p.code}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Franchise pays differential: {partner.agreementPct}% - POSP&apos;s category payout = franchise profit per POSP
                </p>
              </div>
            )}

            {/* Notes */}
            {partner.notes && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{partner.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY CHANGE MODAL
  // ═══════════════════════════════════════════════════════════
  function CategoryChangeModal({ partner, onClose }: { partner: PartnerRecord; onClose: () => void }) {
    const currentCat = partner.categoryPerLOB?.[catChangeLob] || 'A';
    const newCfg = getCategoryConfig(catChangeNew);
    const canApprove = isAdmin || getCategoryIndex(catChangeNew) <= getCategoryIndex('C');

    // Determine the limit label for warnings
    const limitInfo = useMemo(() => {
      for (const limit of CATEGORY_APPROVAL_LIMITS) {
        if (getCategoryIndex(catChangeNew) <= getCategoryIndex(limit.maxCategory)) {
          return limit.label;
        }
      }
      return 'Super Admin only';
    }, []);

    async function handleSubmit() {
      setActionLoading(true);
      try {
        const result = await apiPost({
          action: 'update_category',
          partnerId: partner.id,
          lob: catChangeLob,
          newCategory: catChangeNew,
        });
        if (result.success) {
          showToast(`Category updated to ${catChangeNew} for ${partner.name}`);
          await loadData();
          onClose();
        } else {
          showToast(result.error || 'Failed to update category', 'error');
        }
      } catch {
        showToast('Failed to update category', 'error');
      } finally {
        setActionLoading(false);
      }
    }

    const lobLabels: Record<string, string> = {
      life: 'Life Insurance',
      health: 'Health Insurance',
      giNonMotor: 'GI Non-Motor',
      giMotor: 'GI Motor',
    };

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Change POSP Category
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">{partner.name}</p>
              <p className="text-xs text-slate-500 font-mono">{partner.code}</p>
            </div>

            {/* LOB Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Line of Business</label>
              <select
                value={catChangeLob}
                onChange={(e) => setCatChangeLob(e.target.value as typeof catChangeLob)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(lobLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v} (Current: {partner.categoryPerLOB?.[k as keyof typeof partner.categoryPerLOB] || 'A'})</option>
                ))}
              </select>
            </div>

            {/* Current → New */}
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-slate-100 rounded-lg text-center">
                <p className="text-xs text-slate-500">Current</p>
                <p className="text-2xl font-bold text-slate-700">{currentCat}</p>
                <p className="text-xs text-slate-500">{CATEGORY_PCT[currentCat]}%</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
              <div className={`flex-1 p-3 rounded-lg text-center ${newCfg ? getCatColor(newCfg.color).bg : 'bg-slate-100'}`}>
                <p className="text-xs text-slate-500">New</p>
                <p className={`text-2xl font-bold ${newCfg ? getCatColor(newCfg.color).text : 'text-slate-700'}`}>{catChangeNew}</p>
                <p className="text-xs text-slate-500">{CATEGORY_PCT[catChangeNew]}%</p>
              </div>
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Category</label>
              <select
                value={catChangeNew}
                onChange={(e) => setCatChangeNew(e.target.value as POSPCategory)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {POSP_CATEGORY_ORDER.map((cat) => {
                  const cfg = getCategoryConfig(cat);
                  return (
                    <option key={cat} value={cat}>
                      {cat} - {cfg?.description || ''} ({CATEGORY_PCT[cat]}%)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Approval warning */}
            {!canApprove && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Approval Required</p>
                  <p className="text-xs text-amber-600">Category {catChangeNew} requires approval from: {limitInfo}</p>
                </div>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
              <textarea
                value={catChangeComment}
                onChange={(e) => setCatChangeComment(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Reason for category change..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button
                onClick={handleSubmit} disabled={actionLoading || currentCat === catChangeNew}
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {canApprove ? 'Apply Change' : 'Request Approval'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ACTIONS: Deactivate, Upgrade, Agreement edit
  // ═══════════════════════════════════════════════════════════
  async function handleDeactivate(partner: PartnerRecord) {
    if (!confirm(`Deactivate ${partner.name} (${partner.code})?`)) return;
    setActionLoading(true);
    try {
      const result = await apiPost({ action: 'deactivate', partnerId: partner.id });
      if (result.success) {
        showToast(`${partner.name} deactivated`);
        await loadData();
      } else {
        showToast(result.error || 'Failed to deactivate', 'error');
      }
    } catch { showToast('Failed to deactivate', 'error'); }
    finally { setActionLoading(false); }
  }

  async function handleUpgrade(partner: PartnerRecord, newType: PartnerType) {
    if (!confirm(`Upgrade ${partner.name} from ${partner.type} to ${newType}?`)) return;
    setActionLoading(true);
    try {
      const result = await apiPost({ action: 'upgrade', partnerId: partner.id, newType });
      if (result.success) {
        showToast(`${partner.name} upgraded to ${newType}`);
        await loadData();
      } else {
        showToast(result.error || 'Failed to upgrade', 'error');
      }
    } catch { showToast('Failed to upgrade', 'error'); }
    finally { setActionLoading(false); }
  }

  async function handleUpgradeFranchiseBQP(partner: PartnerRecord) {
    if (!confirm(`Upgrade franchise ${partner.name} to BQP Certified?`)) return;
    setActionLoading(true);
    try {
      const result = await apiPost({ action: 'upgrade_to_bqp', partnerId: partner.id });
      if (result.success) {
        showToast(`${partner.name} is now BQP Certified`);
        await loadData();
      } else {
        showToast(result.error || 'Failed to upgrade', 'error');
      }
    } catch { showToast('Failed to upgrade', 'error'); }
    finally { setActionLoading(false); }
  }

  async function handleAgreementChange(partner: PartnerRecord, newPct: number) {
    setActionLoading(true);
    try {
      const result = await apiPost({ action: 'update_agreement', partnerId: partner.id, newAgreementPct: newPct });
      if (result.success) {
        showToast(`Agreement updated to ${newPct}%`);
        await loadData();
      } else {
        showToast(result.error || 'Failed to update agreement', 'error');
      }
    } catch { showToast('Failed to update', 'error'); }
    finally { setActionLoading(false); }
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 1: PARTNER DIRECTORY
  // ═══════════════════════════════════════════════════════════
  function DirectoryTab() {
    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Partners" value={stats.active} sub={`${stats.total} total`} color="teal" />
          <StatCard label="POSP" value={stats.byType.POSP} color="emerald" />
          <StatCard label="BQP" value={stats.byType.BQP} color="blue" />
          <StatCard label="Franchise" value={stats.byType.Franchise} color="amber" />
          <StatCard label="Referral" value={stats.byType.Referral} color="purple" />
          <StatCard label="BQP Franchises" value={stats.bqpCertifiedFranchises} color="rose" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              Filters:
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PartnerType | '')}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Types</option>
              <option value="POSP">POSP</option>
              <option value="BQP">BQP</option>
              <option value="Franchise">Franchise</option>
              <option value="Referral">Referral</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" placeholder="City..." value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-32"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" placeholder="Managing RM..." value={filterRM}
                onChange={(e) => setFilterRM(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-40"
              />
            </div>
            <button
              onClick={() => setModal('create')}
              className="ml-auto px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Partner
            </button>
          </div>
        </div>

        {/* Partner Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filteredPartners.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No partners found</p>
              <p className="text-sm text-slate-400 mt-1">
                {partners.length === 0 ? 'Click "Add Partner" to create the first partner' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Agreement%</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Managed By</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">City</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.type].badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[p.type].dot}`} />
                          {p.type}
                          {p.franchiseSubType === 'BQP_Certified' && ' (BQP)'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${p.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(p.type === 'Franchise' || p.type === 'Referral') ? `${p.agreementPct}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{getManagedByLabel(p)}</td>
                      <td className="px-4 py-3 text-slate-600">{p.city || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedPartner(p); setModal('detail'); }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-teal-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.type === 'POSP' && p.categoryPerLOB && (
                            <button
                              onClick={() => {
                                setSelectedPartner(p);
                                setCatChangeLob('life');
                                setCatChangeNew(p.categoryPerLOB?.life || 'A');
                                setCatChangeComment('');
                                setModal('category_change');
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600"
                              title="Edit Category"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && p.isActive && (
                            <button
                              onClick={() => handleDeactivate(p)}
                              disabled={actionLoading}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                              title="Deactivate"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2: POSP CATEGORIES (4-LOB VIEW)
  // ═══════════════════════════════════════════════════════════
  function CategoriesTab() {
    const lobKeys: ('life' | 'health' | 'giNonMotor' | 'giMotor')[] = ['life', 'health', 'giNonMotor', 'giMotor'];
    const lobLabels: Record<string, string> = {
      life: 'Life',
      health: 'Health',
      giNonMotor: 'GI Non-Motor',
      giMotor: 'GI Motor',
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">POSP Category Assignment by LOB</h3>
              <p className="text-sm text-slate-500">Click on any category cell to change it. Categories determine payout percentages.</p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-1.5">
              {POSP_CATEGORIES.map((cfg) => {
                const c = getCatColor(cfg.color);
                return (
                  <span key={cfg.category} className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.badge}`}>
                    {cfg.category} {CATEGORY_PCT[cfg.category]}%
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {pospPartners.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No POSP partners to display</p>
              <p className="text-sm text-slate-400 mt-1">Add POSP partners in the Directory tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    {lobKeys.map((lob) => (
                      <th key={lob} className="text-center px-4 py-3 font-medium text-slate-600">{lobLabels[lob]}</th>
                    ))}
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Managed By</th>
                  </tr>
                </thead>
                <tbody>
                  {pospPartners.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      {lobKeys.map((lob) => {
                        const cat = p.categoryPerLOB?.[lob] || 'A';
                        const cfg = getCategoryConfig(cat);
                        const colors = getCatColor(cfg?.color || 'slate');
                        return (
                          <td key={lob} className="px-2 py-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedPartner(p);
                                setCatChangeLob(lob);
                                setCatChangeNew(cat);
                                setCatChangeComment('');
                                setModal('category_change');
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:ring-2 hover:ring-teal-300 ${colors.badge}`}
                              title={`Click to change ${p.name}'s ${lobLabels[lob]} category`}
                            >
                              {cat} <span className="font-normal text-[10px] opacity-75">{CATEGORY_PCT[cat]}%</span>
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-xs text-slate-600">{getManagedByLabel(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3: FRANCHISE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  function FranchiseTab() {
    const [editingAgreement, setEditingAgreement] = useState<number | null>(null);
    const [agreementInput, setAgreementInput] = useState('');

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Franchises"
            value={franchisePartners.filter((f) => f.isActive).length}
            sub={`${franchisePartners.length} total`}
            color="amber"
          />
          <StatCard
            label="BQP Certified"
            value={franchisePartners.filter((f) => f.franchiseSubType === 'BQP_Certified' && f.isActive).length}
            color="blue"
          />
          <StatCard
            label="Basic"
            value={franchisePartners.filter((f) => f.franchiseSubType === 'Basic' && f.isActive).length}
            color="slate"
          />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {franchisePartners.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No franchise partners</p>
              <p className="text-sm text-slate-400 mt-1">Add a Franchise partner in the Directory tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Sub-Type</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Agreement %</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">POSPs Under</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {franchisePartners.map((f) => {
                    const pospsUnder = partners.filter((p) => p.parentFranchiseId === f.id && p.type === 'POSP');
                    const isEditing = editingAgreement === f.id;

                    return (
                      <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.code}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedPartner(f); setModal('detail'); }}
                            className="font-medium text-slate-800 hover:text-teal-600 text-left"
                          >
                            {f.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            f.franchiseSubType === 'BQP_Certified'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {f.franchiseSubType === 'BQP_Certified' ? 'BQP Certified' : 'Basic'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number" min={80} max={95} step={1}
                                value={agreementInput}
                                onChange={(e) => setAgreementInput(e.target.value)}
                                className="w-16 border border-teal-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                autoFocus
                              />
                              <button
                                onClick={async () => {
                                  await handleAgreementChange(f, parseFloat(agreementInput));
                                  setEditingAgreement(null);
                                }}
                                className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingAgreement(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isAdmin) { showToast('Only Admin can change agreement %', 'error'); return; }
                                setEditingAgreement(f.id);
                                setAgreementInput(String(f.agreementPct));
                              }}
                              className="font-bold text-amber-700 hover:underline"
                            >
                              {f.agreementPct}%
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <Users className="w-3 h-3" />
                            {pospsUnder.length}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${f.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {f.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && f.isActive && f.franchiseSubType === 'Basic' && (
                              <button
                                onClick={() => handleUpgradeFranchiseBQP(f)}
                                disabled={actionLoading}
                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                                title="Upgrade to BQP Certified"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                Upgrade BQP
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedPartner(f); setModal('detail'); }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-teal-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4: REFERRAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  function ReferralTab() {
    const [editingPayout, setEditingPayout] = useState<number | null>(null);
    const [payoutInput, setPayoutInput] = useState('');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Active Referrals"
            value={referralPartners.filter((r) => r.isActive).length}
            color="purple"
          />
          <StatCard
            label="Default Payout"
            value={`${REFERRAL_DEFAULTS.defaultPayoutPct}%`}
            color="slate"
          />
          <StatCard
            label="Total Referrals"
            value={referralPartners.length}
            color="slate"
          />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {referralPartners.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No referral partners</p>
              <p className="text-sm text-slate-400 mt-1">Add a Referral partner in the Directory tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Payout %</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Managed By</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">City</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referralPartners.map((r) => {
                    const isEditing = editingPayout === r.id;

                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number" min={50} max={90} step={5}
                                value={payoutInput}
                                onChange={(e) => setPayoutInput(e.target.value)}
                                className="w-16 border border-purple-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                              />
                              <button
                                onClick={async () => {
                                  await handleAgreementChange(r, parseFloat(payoutInput));
                                  setEditingPayout(null);
                                }}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingPayout(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isAdmin) { showToast('Only Admin can edit referral payout', 'error'); return; }
                                setEditingPayout(r.id);
                                setPayoutInput(String(r.agreementPct));
                              }}
                              className="font-bold text-purple-700 hover:underline"
                            >
                              {r.agreementPct}%
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{getManagedByLabel(r)}</td>
                        <td className="px-4 py-3 text-slate-600">{r.city || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${r.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && r.isActive && (
                              <>
                                <button
                                  onClick={() => handleUpgrade(r, 'POSP')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  POSP
                                </button>
                                <button
                                  onClick={() => handleUpgrade(r, 'BQP')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  BQP
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setSelectedPartner(r); setModal('detail'); }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-teal-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 5: HIERARCHY VIEW
  // ═══════════════════════════════════════════════════════════
  function HierarchyTab() {
    // Group by managing entity
    const hierarchy = useMemo(() => {
      const groups: {
        label: string;
        type: 'employee' | 'franchise';
        entityId: number;
        subType?: string;
        partners: PartnerRecord[];
      }[] = [];

      // 1. Employee-managed partners (DST / CDM)
      const empManaged = partners.filter((p) => (p.managedByType === 'DST' || p.managedByType === 'CDM') && p.isActive);
      const byEmployee = new Map<number, PartnerRecord[]>();
      empManaged.forEach((p) => {
        const list = byEmployee.get(p.managedById) || [];
        list.push(p);
        byEmployee.set(p.managedById, list);
      });
      byEmployee.forEach((pList, empId) => {
        const emp = employees.find((e) => e.id === empId);
        groups.push({
          label: emp ? `${emp.name} (${emp.designation})` : `Employee #${empId}`,
          type: 'employee',
          entityId: empId,
          subType: emp?.segment,
          partners: pList,
        });
      });

      // 2. Franchise-managed POSPs
      const franchiseManaged = partners.filter((p) => p.parentFranchiseId && p.isActive);
      const byFranchise = new Map<number, PartnerRecord[]>();
      franchiseManaged.forEach((p) => {
        const fId = p.parentFranchiseId!;
        const list = byFranchise.get(fId) || [];
        list.push(p);
        byFranchise.set(fId, list);
      });
      byFranchise.forEach((pList, fId) => {
        const franchise = partners.find((p) => p.id === fId);
        if (franchise) {
          groups.push({
            label: `${franchise.name} (${franchise.code})`,
            type: 'franchise',
            entityId: fId,
            subType: franchise.franchiseSubType === 'BQP_Certified' ? 'BQP Certified' : 'Basic',
            partners: pList,
          });
        }
      });

      return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partners, employees]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    function toggleGroup(key: string) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Network className="w-5 h-5 text-teal-600" />
            Partner Hierarchy
          </h3>
          <p className="text-sm text-slate-500">Organizational structure showing managing relationships</p>
        </div>

        {hierarchy.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 text-center py-16">
            <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hierarchy data to display</p>
            <p className="text-sm text-slate-400 mt-1">Add partners and assign managing entities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hierarchy.map((group) => {
              const key = `${group.type}-${group.entityId}`;
              const isExpanded = expandedGroups.has(key);

              return (
                <div key={key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(key)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      group.type === 'employee' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {group.type === 'employee' ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{group.label}</p>
                      <p className="text-xs text-slate-500">
                        {group.type === 'employee' ? group.subType : group.subType}
                        {' -- '}{group.partners.length} partner{group.partners.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-teal-600 mr-2">{group.partners.length}</span>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                      <div className="space-y-2 pl-4 border-l-2 border-slate-200 ml-4">
                        {group.partners.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            onClick={() => { setSelectedPartner(p); setModal('detail'); }}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[p.type].dot}`} />
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLORS[p.type].badge}`}>
                              {p.type}
                            </span>
                            <span className="font-mono text-xs text-slate-500">{p.code}</span>
                            <span className="text-sm font-medium text-slate-700">{p.name}</span>
                            {p.parentFranchiseId && group.type === 'franchise' && (
                              <span className="text-[10px] text-amber-600 ml-auto">Franchise pays differential</span>
                            )}
                            {p.categoryPerLOB && (
                              <div className="flex gap-0.5 ml-auto">
                                {(['life', 'health', 'giNonMotor', 'giMotor'] as const).map((lob) => {
                                  const cat = p.categoryPerLOB![lob];
                                  const cfg = getCategoryConfig(cat);
                                  return (
                                    <span key={lob} className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${getCatColor(cfg?.color || 'slate').badge}`}>
                                      {cat}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STAT CARD COMPONENT
  // ═══════════════════════════════════════════════════════════
  function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
    const colorMap: Record<string, string> = {
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      rose: 'bg-rose-50 border-rose-200 text-rose-700',
      slate: 'bg-slate-50 border-slate-200 text-slate-700',
    };
    return (
      <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.slate}`}>
        <p className="text-xs font-medium opacity-75">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modals */}
      {modal === 'create' && <CreatePartnerModal onClose={() => setModal(null)} />}
      {modal === 'detail' && selectedPartner && (
        <PartnerDetailModal partner={selectedPartner} onClose={() => { setModal(null); setSelectedPartner(null); }} />
      )}
      {modal === 'category_change' && selectedPartner && (
        <CategoryChangeModal partner={selectedPartner} onClose={() => { setModal(null); setSelectedPartner(null); }} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-600" />
              Partner / POSP Registry
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage POSP, BQP, Franchise, and Referral channel partners
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
            }`}>
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : user.role}
            </span>
            <span className="text-sm text-slate-500">{user.name}</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'directory' && <DirectoryTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'franchise' && <FranchiseTab />}
        {activeTab === 'referral' && <ReferralTab />}
        {activeTab === 'hierarchy' && <HierarchyTab />}
      </div>
    </div>
  );
}
