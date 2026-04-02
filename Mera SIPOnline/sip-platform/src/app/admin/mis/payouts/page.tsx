'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3, Percent, Users, TrendingUp, Shield, Layers,
  ChevronDown, Search, Plus, Edit3, Save, X, Loader2,
  CheckCircle, AlertTriangle, Calculator, Download, ArrowRight,
  IndianRupee, Building2, Truck, Car, Bike,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { AdminRole } from '@/lib/auth/config';
import type {
  POSPCategory,
  POSPCategoryConfig,
  POSPPayoutGrid,
  ChannelPayoutRule,
  POSPChannelType,
  IncentiveSlab,
} from '@/lib/mis/types';
import {
  POSP_CATEGORIES,
  DEFAULT_CHANNEL_RULES,
  DEFAULT_POSP_GRID,
  ALL_POSP_CATEGORIES,
  DST_SLABS,
  POSP_RM_SLABS,
} from '@/lib/mis/types';

// ─── Types ───
interface AuthUser {
  email: string;
  name: string;
  role: AdminRole;
}

type TabId = 'categories' | 'grid' | 'channels' | 'slabs' | 'simulator';

// ─── Toast ───
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

// ─── Category Color Map ───
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   badge: 'bg-slate-100 text-slate-700' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    badge: 'bg-teal-100 text-teal-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   badge: 'bg-green-100 text-green-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
};

function getCatColor(color: string) {
  return CATEGORY_COLORS[color] || CATEGORY_COLORS.slate;
}

// ─── Format currency short ───
function fmtINR(n: number): string {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
  return `\u20B9${n.toLocaleString('en-IN')}`;
}

// ─── POSP Category Approval Hierarchy ───
// CDM can assign up to D, Regional Manager up to E, CDO up to F1, Ram/Sangeeta for F2/F3
const CATEGORY_ORDER: POSPCategory[] = ['A', 'B', 'C', 'D', 'D+', 'E', 'E+', 'F1', 'F2', 'F3'];
const PAYOUT_APPROVER_EMAILS = ['ram@trustner.in', 'sangeeta@trustner.in'];

const DESIGNATION_LIMITS: Record<string, { maxCategory: POSPCategory; label: string }> = {
  'CDM': { maxCategory: 'D', label: 'CDM (up to Category D)' },
  'RM CDM': { maxCategory: 'D', label: 'CDM (up to Category D)' },
  'Regional Manager': { maxCategory: 'E', label: 'Regional Manager (up to Category E)' },
  'CDO': { maxCategory: 'F1', label: 'CDO (up to Category F1)' },
};

function getCategoryIndex(cat: POSPCategory): number {
  return CATEGORY_ORDER.indexOf(cat);
}

/** Check if a category change needs escalation (Ram/Sangeeta approval) */
function needsEscalation(targetCategory: POSPCategory): boolean {
  return getCategoryIndex(targetCategory) > getCategoryIndex('F1');
}

/** Get who can approve a given category */
function getApprovalAuthority(targetCategory: POSPCategory): string {
  const idx = getCategoryIndex(targetCategory);
  if (idx <= getCategoryIndex('D')) return 'CDM or above';
  if (idx <= getCategoryIndex('E')) return 'Regional Manager or above';
  if (idx <= getCategoryIndex('F1')) return 'CDO or above';
  return 'Super Admin (Ram Shah) / Admin (Sangeeta Shah)';
}

// ─────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────
export default function PayoutsPage() {
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Data state
  const [categories, setCategories] = useState<POSPCategoryConfig[]>(POSP_CATEGORIES);
  const [channelRules, setChannelRules] = useState<ChannelPayoutRule[]>(DEFAULT_CHANNEL_RULES);
  const [grid, setGrid] = useState<POSPPayoutGrid[]>(DEFAULT_POSP_GRID);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  // ─── Auth Check ───
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) {
          window.location.href = '/admin/login';
          return;
        }
        const data = await res.json();
        setUser({ email: data.email, name: data.name, role: data.role });
      } catch {
        window.location.href = '/admin/login';
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // ─── Load data from API ───
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/mis/payouts');
        if (res.ok) {
          const data = await res.json();
          if (data.categories) setCategories(data.categories);
          if (data.channels) setChannelRules(data.channels);
          if (data.grid) setGrid(data.grid);
        }
      } catch {
        // Use defaults
      }
    }
    if (user) loadData();
  }, [user]);

  // ─── API helper ───
  const apiPost = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/mis/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // ─── Tabs ───
  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'categories', label: 'POSP Categories', icon: Layers },
    { id: 'grid', label: 'Payout Grid', icon: BarChart3 },
    { id: 'channels', label: 'Channel Rules', icon: Users },
    { id: 'slabs', label: 'Incentive Slabs', icon: TrendingUp },
    { id: 'simulator', label: 'Simulator', icon: Calculator },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Percent className="w-6 h-6 text-teal-600" />
              POSP / Channel Payout Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage POSP categories, commission grids, channel payout rules, and incentive slabs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
            }`}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
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
        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            grid={grid}
            isSuperAdmin={isSuperAdmin}
            onSave={async (cat, updates) => {
              const result = await apiPost({
                action: 'update_category',
                section: 'categories',
                data: { category: cat, updates },
                title: `Update POSP Category ${cat} thresholds`,
                description: `Change thresholds for Category ${cat}`,
              });
              if (result.success || result.approval) {
                if (result.success) {
                  setCategories((prev) => prev.map((c) => c.category === cat ? { ...c, ...updates } : c));
                  showToast(`Category ${cat} updated successfully`);
                } else {
                  showToast('Change request submitted for approval', 'info');
                }
              } else {
                showToast(result.error || 'Failed to update', 'error');
              }
            }}
          />
        )}

        {activeTab === 'grid' && (
          <PayoutGridTab
            grid={grid}
            categories={categories}
            isSuperAdmin={isSuperAdmin}
            onEditRate={async (id, newRate) => {
              const result = await apiPost({
                action: 'update_grid_rate',
                section: 'grid',
                data: { id, updates: { commissionPct: newRate } },
                title: `Update payout grid rate #${id}`,
                description: `Change commission rate to ${newRate}%`,
              });
              if (result.success) {
                setGrid((prev) => prev.map((g) => g.id === id ? { ...g, commissionPct: newRate } : g));
                showToast('Rate updated');
              } else if (result.approval) {
                showToast('Change request submitted for approval', 'info');
              } else {
                showToast(result.error || 'Failed', 'error');
              }
            }}
            onAddProductLine={async (entries) => {
              const result = await apiPost({
                action: 'add_product_line',
                section: 'grid',
                data: { entries },
                title: `Add new product line: ${entries[0]?.productLine}`,
                description: `Add ${entries.length} grid entries for ${entries[0]?.productLine}`,
              });
              if (result.success) {
                setGrid((prev) => [...prev, ...(result.data as POSPPayoutGrid[])]);
                showToast('Product line added');
              } else if (result.approval) {
                showToast('Change request submitted for approval', 'info');
              } else {
                showToast(result.error || 'Failed', 'error');
              }
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelRulesTab
            rules={channelRules}
            isSuperAdmin={isSuperAdmin}
            onSave={async (id, updates) => {
              const result = await apiPost({
                action: 'update_channel',
                section: 'channels',
                data: { id, updates },
                title: `Update channel rule #${id}`,
                description: `Update ${updates.channelType || ''} payout rules`,
              });
              if (result.success) {
                setChannelRules((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
                showToast('Channel rule updated');
              } else if (result.approval) {
                showToast('Change request submitted for approval', 'info');
              } else {
                showToast(result.error || 'Failed', 'error');
              }
            }}
          />
        )}

        {activeTab === 'slabs' && <IncentiveSlabsTab />}

        {activeTab === 'simulator' && (
          <SimulatorTab
            grid={grid}
            categories={categories}
            channelRules={channelRules}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 1: POSP Categories Overview
// ─────────────────────────────────────────────────────
function CategoriesTab({
  categories,
  grid,
  isSuperAdmin,
  onSave,
}: {
  categories: POSPCategoryConfig[];
  grid: POSPPayoutGrid[];
  isSuperAdmin: boolean;
  onSave: (cat: string, updates: Partial<POSPCategoryConfig>) => Promise<void>;
}) {
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editMin, setEditMin] = useState(0);
  const [editMax, setEditMax] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function startEdit(cat: POSPCategoryConfig) {
    setEditingCat(cat.category);
    setEditMin(cat.minMonthlyBusiness);
    setEditMax(cat.maxMonthlyBusiness);
  }

  async function handleSave() {
    if (!editingCat) return;
    setSaving(true);
    await onSave(editingCat, { minMonthlyBusiness: editMin, maxMonthlyBusiness: editMax });
    setSaving(false);
    setEditingCat(null);
  }

  // Get sample commission range for each category from grid data
  function getSampleRates(cat: POSPCategory): { min: number; max: number } {
    const catEntries = grid.filter((g) => g.category === cat && g.isActive);
    if (catEntries.length === 0) return { min: 0, max: 0 };
    const rates = catEntries.map((e) => e.commissionPct);
    return { min: Math.min(...rates), max: Math.max(...rates) };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">POSP Category Configuration</h2>
          <p className="text-sm text-slate-500">10 categories from entry-level (A) to diamond (F3) with business thresholds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const colors = getCatColor(cat.color);
          const rates = getSampleRates(cat.category);
          const isEditing = editingCat === cat.category;

          return (
            <div
              key={cat.category}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-5 transition-shadow hover:shadow-md relative`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                  {cat.category}
                </span>
                <button
                  onClick={() => isEditing ? setEditingCat(null) : startEdit(cat)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isEditing ? 'bg-red-100 text-red-600' : 'hover:bg-white/60 text-slate-400'
                  }`}
                  title={isSuperAdmin ? 'Edit Thresholds' : 'Request Change'}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>

              <h3 className={`text-base font-bold ${colors.text} mb-1`}>{cat.description}</h3>

              {/* Threshold display / edit */}
              {isEditing ? (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Min Monthly Business</label>
                    <input
                      type="number"
                      value={editMin}
                      onChange={(e) => setEditMin(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Max Monthly Business</label>
                    <input
                      type="number"
                      value={editMax ?? ''}
                      onChange={(e) => setEditMax(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="No cap"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSuperAdmin ? 'Save' : 'Request Change'}
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">
                      {fmtINR(cat.minMonthlyBusiness)}
                      {cat.maxMonthlyBusiness ? ` \u2013 ${fmtINR(cat.maxMonthlyBusiness)}` : '+'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{cat.qualificationCriteria}</p>
                  {rates.max > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60">
                      <p className="text-xs text-slate-400 mb-1">Commission Range</p>
                      <p className={`text-sm font-bold ${colors.text}`}>
                        {rates.min === rates.max ? `${rates.min}%` : `${rates.min}% \u2013 ${rates.max}%`}
                      </p>
                    </div>
                  )}
                  {/* Approval Authority */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Approval Authority</p>
                    <p className={`text-xs font-medium ${needsEscalation(cat.category) ? 'text-amber-600' : 'text-slate-500'}`}>
                      {needsEscalation(cat.category) && '\u26a0 '}{getApprovalAuthority(cat.category)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-2">How Category Assignment Works</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          POSP partners are auto-categorized based on their rolling 3-month average business volume.
          Higher categories unlock better commission rates across all product lines. Category upgrade is
          immediate upon qualification; downgrade has a 1-month grace period. Super Admin can manually
          override a POSP&apos;s category for strategic partnerships.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 2: POSP Payout Grid
// ─────────────────────────────────────────────────────
function PayoutGridTab({
  grid,
  categories,
  isSuperAdmin,
  onEditRate,
  onAddProductLine,
  showToast,
}: {
  grid: POSPPayoutGrid[];
  categories: POSPCategoryConfig[];
  isSuperAdmin: boolean;
  onEditRate: (id: number, newRate: number) => Promise<void>;
  onAddProductLine: (entries: Omit<POSPPayoutGrid, 'id'>[]) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterInsurer, setFilterInsurer] = useState('');
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Derive unique filter options
  const vehicleTypes = useMemo(() => [...new Set(grid.map((g) => g.vehicleType))], [grid]);
  const regions = useMemo(() => [...new Set(grid.map((g) => g.region))], [grid]);
  const insurers = useMemo(() => [...new Set(grid.map((g) => g.insurer))], [grid]);

  // Filter grid
  const filtered = useMemo(() => {
    let result = grid.filter((g) => g.isActive);
    if (filterVehicle) result = result.filter((g) => g.vehicleType === filterVehicle);
    if (filterRegion) result = result.filter((g) => g.region === filterRegion);
    if (filterInsurer) result = result.filter((g) => g.insurer === filterInsurer);
    return result;
  }, [grid, filterVehicle, filterRegion, filterInsurer]);

  // Group by productLine + insurer for rows
  const productLines = useMemo(() => {
    const map = new Map<string, { productLine: string; insurer: string; vehicleType: string; region: string; rates: Map<POSPCategory, { id: number; pct: number }> }>();
    for (const g of filtered) {
      const key = `${g.productLine}||${g.insurer}`;
      if (!map.has(key)) {
        map.set(key, { productLine: g.productLine, insurer: g.insurer, vehicleType: g.vehicleType, region: g.region, rates: new Map() });
      }
      map.get(key)!.rates.set(g.category, { id: g.id, pct: g.commissionPct });
    }
    return Array.from(map.values());
  }, [filtered]);

  async function handleSaveRate() {
    if (editingCell === null) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0 || val > 100) {
      showToast('Invalid rate (must be 0-100)', 'error');
      return;
    }
    setSaving(true);
    await onEditRate(editingCell, val);
    setSaving(false);
    setEditingCell(null);
  }

  // Export to CSV
  function exportToCSV() {
    const header = ['Product Line', 'Insurer', 'Vehicle Type', 'Region', ...ALL_POSP_CATEGORIES];
    const rows = productLines.map((pl) => [
      pl.productLine,
      pl.insurer,
      pl.vehicleType,
      pl.region,
      ...ALL_POSP_CATEGORIES.map((cat) => pl.rates.get(cat)?.pct.toString() || ''),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `posp_payout_grid_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV');
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">POSP Payout Grid</h2>
          <p className="text-sm text-slate-500">Commission rates by product line and category (A-F3)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" /> Add Product Line
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 bg-white focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Vehicle Types</option>
          {vehicleTypes.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 bg-white focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterInsurer}
          onChange={(e) => setFilterInsurer(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 bg-white focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Insurers</option>
          {insurers.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        {(filterVehicle || filterRegion || filterInsurer) && (
          <button
            onClick={() => { setFilterVehicle(''); setFilterRegion(''); setFilterInsurer(''); }}
            className="px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Product Line</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[120px]">Insurer</th>
                {ALL_POSP_CATEGORIES.map((cat) => {
                  const catConfig = categories.find((c) => c.category === cat);
                  const colors = getCatColor(catConfig?.color || 'slate');
                  return (
                    <th key={cat} className="text-center px-2 py-3 min-w-[70px]">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colors.badge}`}>
                        {cat}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {productLines.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400">
                    No product lines found matching filters
                  </td>
                </tr>
              ) : (
                productLines.map((pl, idx) => (
                  <tr key={`${pl.productLine}-${pl.insurer}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-inherit z-10">
                      <div>{pl.productLine}</div>
                      <div className="text-xs text-slate-400">{pl.vehicleType} &middot; {pl.region}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{pl.insurer}</td>
                    {ALL_POSP_CATEGORIES.map((cat) => {
                      const entry = pl.rates.get(cat);
                      const isEditing = editingCell === entry?.id;

                      return (
                        <td key={cat} className="text-center px-2 py-3">
                          {entry ? (
                            isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.25"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-16 px-1 py-1 text-center text-xs border border-teal-400 rounded focus:ring-1 focus:ring-teal-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRate();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                />
                                <button
                                  onClick={handleSaveRate}
                                  disabled={saving}
                                  className="p-0.5 text-teal-600 hover:text-teal-800"
                                >
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingCell(entry.id);
                                  setEditValue(entry.pct.toString());
                                }}
                                className="px-2 py-1 rounded text-xs font-semibold hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer"
                                title={isSuperAdmin ? 'Click to edit' : 'Click to request change'}
                              >
                                {entry.pct}%
                              </button>
                            )
                          ) : (
                            <span className="text-slate-300">&mdash;</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Line Modal */}
      {showAddModal && (
        <AddProductLineModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddProductLine}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Add Product Line Modal ───
function AddProductLineModal({
  onClose,
  onAdd,
  showToast,
}: {
  onClose: () => void;
  onAdd: (entries: Omit<POSPPayoutGrid, 'id'>[]) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [productLine, setProductLine] = useState('');
  const [vehicleType, setVehicleType] = useState('Two Wheeler');
  const [region, setRegion] = useState('All India');
  const [insurer, setInsurer] = useState('ICICI Lombard');
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(ALL_POSP_CATEGORIES.map((c) => [c, '']))
  );
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!productLine.trim()) {
      showToast('Product line name is required', 'error');
      return;
    }
    const entries: Omit<POSPPayoutGrid, 'id'>[] = ALL_POSP_CATEGORIES
      .filter((cat) => rates[cat] && !isNaN(parseFloat(rates[cat])))
      .map((cat) => ({
        category: cat,
        productLine: productLine.trim(),
        vehicleType,
        region,
        insurer,
        commissionPct: parseFloat(rates[cat]),
        effectiveFrom: '2025-04-01',
        isActive: true,
      }));

    if (entries.length === 0) {
      showToast('Enter at least one commission rate', 'error');
      return;
    }

    setSaving(true);
    await onAdd(entries);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Add New Product Line</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Line Name</label>
              <input
                type="text"
                value={productLine}
                onChange={(e) => setProductLine(e.target.value)}
                placeholder="e.g., TW Comp Non-Metro"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Insurer</label>
              <select
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option>ICICI Lombard</option>
                <option>Bajaj Allianz</option>
                <option>HDFC ERGO</option>
                <option>New India</option>
                <option>United India</option>
                <option>Tata AIG</option>
                <option>SBI General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option>Two Wheeler</option>
                <option>Private Car</option>
                <option>Commercial Vehicle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option>All India</option>
                <option>Metro</option>
                <option>Non-Metro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Commission Rates by Category (%)</label>
            <div className="grid grid-cols-5 gap-2">
              {ALL_POSP_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label className="block text-xs text-slate-500 mb-1 text-center">{cat}</label>
                  <input
                    type="number"
                    step="0.25"
                    value={rates[cat]}
                    onChange={(e) => setRates((prev) => ({ ...prev, [cat]: e.target.value }))}
                    placeholder="%"
                    className="w-full px-2 py-1.5 rounded border border-slate-300 text-center text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Product Line
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 3: Channel Payout Rules
// ─────────────────────────────────────────────────────
function ChannelRulesTab({
  rules,
  isSuperAdmin,
  onSave,
}: {
  rules: ChannelPayoutRule[];
  isSuperAdmin: boolean;
  onSave: (id: number, updates: Partial<ChannelPayoutRule>) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPayout, setEditPayout] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(rule: ChannelPayoutRule) {
    setEditingId(rule.id);
    setEditPayout(rule.payoutPct);
    setEditNotes(rule.notes || '');
  }

  async function handleSave() {
    if (editingId === null) return;
    setSaving(true);
    const margin = 100 - editPayout;
    await onSave(editingId, {
      payoutPct: editPayout,
      companyMarginPct: margin,
      rmCreditPct: margin,
      notes: editNotes,
    });
    setSaving(false);
    setEditingId(null);
  }

  const CHANNEL_ICONS: Record<string, React.ElementType> = {
    POSP: Shield,
    BQP: Building2,
    Referral: Users,
    Employee: Users,
    'Sub-Broker': Percent,
    Franchise: Building2,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Channel Payout Rules</h2>
        <p className="text-sm text-slate-500">Define payout splits for each channel type (POSP, BQP, Referral, etc.)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => {
          const isEditing = editingId === rule.id;
          const Icon = CHANNEL_ICONS[rule.channelType] || Users;

          return (
            <div key={rule.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{rule.channelType}</h3>
                    <span className={`text-xs font-medium ${rule.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => isEditing ? setEditingId(null) : startEdit(rule)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isEditing ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Channel Payout %</label>
                    <input
                      type="number"
                      value={editPayout}
                      onChange={(e) => setEditPayout(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">Company Margin: {100 - editPayout}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSuperAdmin ? 'Save' : 'Request Change'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Visual Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Channel Payout</span>
                      <span>Company Margin</span>
                    </div>
                    <div className="h-6 rounded-full overflow-hidden flex">
                      <div
                        className="bg-teal-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${rule.payoutPct}%` }}
                      >
                        {rule.payoutPct > 10 ? `${rule.payoutPct}%` : ''}
                      </div>
                      <div
                        className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${rule.companyMarginPct}%` }}
                      >
                        {rule.companyMarginPct > 10 ? `${rule.companyMarginPct}%` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-teal-50">
                      <p className="text-xs text-teal-600">Payout</p>
                      <p className="text-lg font-bold text-teal-700">{rule.payoutPct}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50">
                      <p className="text-xs text-amber-600">Margin</p>
                      <p className="text-lg font-bold text-amber-700">{rule.companyMarginPct}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50">
                      <p className="text-xs text-blue-600">RM Credit</p>
                      <p className="text-lg font-bold text-blue-700">{rule.rmCreditPct}%</p>
                    </div>
                  </div>

                  {rule.notes && (
                    <p className="text-xs text-slate-400 mt-3 italic">{rule.notes}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 4: Incentive Slabs (DST + POSP_RM)
// ─────────────────────────────────────────────────────
function IncentiveSlabsTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Incentive Slab Tables</h2>
        <p className="text-sm text-slate-500">Side-by-side view of DST (Direct Sales) and POSP RM incentive slabs</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* DST Slabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              DST (Direct Sales Team)
            </h3>
            <p className="text-xs text-blue-600 mt-1">Applied to Direct Sales and FP Team segments</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Achievement</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Rate</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Multiplier</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Effective</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Label</th>
              </tr>
            </thead>
            <tbody>
              {DST_SLABS.map((slab, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {slab.achievementMin}% {slab.achievementMax ? `\u2013 ${slab.achievementMax}%` : '+'}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      slab.incentiveRate === 0 ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {slab.incentiveRate}%
                    </span>
                  </td>
                  <td className="text-center px-3 py-2.5 text-slate-600">{slab.multiplier}x</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`text-xs font-bold ${
                      slab.incentiveRate === 0 ? 'text-slate-400' : 'text-emerald-600'
                    }`}>
                      {(slab.incentiveRate * slab.multiplier).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{slab.slabLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* POSP RM Slabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 bg-teal-50 border-b border-teal-100">
            <h3 className="font-bold text-teal-800 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              POSP RM
            </h3>
            <p className="text-xs text-teal-600 mt-1">Applied to CDM/POSP RM and Area Manager segments</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Achievement</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Rate</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Multiplier</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600">Effective</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Label</th>
              </tr>
            </thead>
            <tbody>
              {POSP_RM_SLABS.map((slab, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {slab.achievementMin}% {slab.achievementMax ? `\u2013 ${slab.achievementMax}%` : '+'}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      slab.incentiveRate === 0 ? 'bg-slate-100 text-slate-500' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {slab.incentiveRate}%
                    </span>
                  </td>
                  <td className="text-center px-3 py-2.5 text-slate-600">{slab.multiplier}x</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`text-xs font-bold ${
                      slab.incentiveRate === 0 ? 'text-slate-400' : 'text-emerald-600'
                    }`}>
                      {(slab.incentiveRate * slab.multiplier).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{slab.slabLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievement Range Visualization */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Achievement Range Visualization</h3>
        <div className="space-y-3">
          {[
            { label: 'No Incentive', range: '0-80%', width: 40, color: 'bg-slate-300' },
            { label: 'Base', range: '80-100%', width: 10, color: 'bg-blue-400' },
            { label: 'Enhanced', range: '101-110%', width: 5, color: 'bg-teal-400' },
            { label: 'Super', range: '111-130%', width: 10, color: 'bg-emerald-400' },
            { label: 'Star', range: '131-150%', width: 10, color: 'bg-purple-400' },
            { label: 'Champion', range: '151%+', width: 25, color: 'bg-amber-400' },
          ].map((band) => (
            <div key={band.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-24 text-right">{band.label}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${band.color} rounded-full flex items-center px-2`}
                  style={{ width: `${band.width}%` }}
                >
                  <span className="text-[10px] text-white font-bold whitespace-nowrap">{band.range}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 5: Simulation Calculator
// ─────────────────────────────────────────────────────
function SimulatorTab({
  grid,
  categories,
  channelRules,
}: {
  grid: POSPPayoutGrid[];
  categories: POSPCategoryConfig[];
  channelRules: ChannelPayoutRule[];
}) {
  const [channelType, setChannelType] = useState<POSPChannelType>('POSP');
  const [pospCategory, setPospCategory] = useState<POSPCategory>('A');
  const [premiumAmount, setPremiumAmount] = useState(50000);
  const [productLine, setProductLine] = useState('');

  // Derive unique product lines
  const productLines = useMemo(() => [...new Set(grid.map((g) => `${g.productLine}||${g.insurer}`))], [grid]);

  // Calculate
  const result = useMemo(() => {
    const channel = channelRules.find((r) => r.channelType === channelType);
    if (!channel) return null;

    let commissionPct = 0;
    if (productLine) {
      const [pl, ins] = productLine.split('||');
      const gridEntry = grid.find((g) => g.productLine === pl && g.insurer === ins && g.category === pospCategory && g.isActive);
      if (gridEntry) commissionPct = gridEntry.commissionPct;
    }

    const grossCommission = premiumAmount * (commissionPct / 100);
    const pospEarning = grossCommission * (channel.payoutPct / 100);
    const companyMargin = grossCommission * (channel.companyMarginPct / 100);
    const rmCredit = premiumAmount * (channel.rmCreditPct / 100);

    const catConfig = categories.find((c) => c.category === pospCategory);

    return {
      commissionPct,
      grossCommission,
      pospEarning,
      companyMargin,
      rmCredit,
      channelPayoutPct: channel.payoutPct,
      companyMarginPct: channel.companyMarginPct,
      catConfig,
    };
  }, [channelType, pospCategory, premiumAmount, productLine, grid, channelRules, categories]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Payout Simulation Calculator</h2>
        <p className="text-sm text-slate-500">What-if analysis for evaluating payout economics before changing rates</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            Simulation Inputs
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Channel Type</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as POSPChannelType)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              >
                {channelRules.map((r) => (
                  <option key={r.channelType} value={r.channelType}>{r.channelType}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">POSP Category</label>
              <div className="grid grid-cols-5 gap-2">
                {ALL_POSP_CATEGORIES.map((cat) => {
                  const catConfig = categories.find((c) => c.category === cat);
                  const colors = getCatColor(catConfig?.color || 'slate');
                  return (
                    <button
                      key={cat}
                      onClick={() => setPospCategory(cat)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                        pospCategory === cat
                          ? `${colors.badge} ring-2 ring-teal-500 ring-offset-1`
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Premium Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">\u20B9</span>
                <input
                  type="number"
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[10000, 25000, 50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPremiumAmount(amt)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      premiumAmount === amt ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmtINR(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Line</label>
              <select
                value={productLine}
                onChange={(e) => setProductLine(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select a product line</option>
                {productLines.map((pl) => {
                  const [name, ins] = pl.split('||');
                  return <option key={pl} value={pl}>{name} ({ins})</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Simulation Results
          </h3>

          {result ? (
            <div className="space-y-4">
              {/* Category Info */}
              {result.catConfig && (
                <div className={`p-3 rounded-lg ${getCatColor(result.catConfig.color).bg} ${getCatColor(result.catConfig.color).border} border`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCatColor(result.catConfig.color).badge}`}>
                      {result.catConfig.category}
                    </span>
                    <span className={`text-sm font-medium ${getCatColor(result.catConfig.color).text}`}>
                      {result.catConfig.description}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{result.catConfig.qualificationCriteria}</p>
                </div>
              )}

              {/* Commission Rate */}
              <div className="p-4 rounded-lg bg-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-1">Commission Rate</p>
                <p className="text-3xl font-bold text-teal-400">
                  {result.commissionPct > 0 ? `${result.commissionPct}%` : 'N/A'}
                </p>
                {result.commissionPct === 0 && productLine && (
                  <p className="text-xs text-amber-400 mt-1">No rate defined for this category + product line</p>
                )}
                {!productLine && (
                  <p className="text-xs text-slate-500 mt-1">Select a product line above</p>
                )}
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="text-xs text-teal-600 font-medium">Gross Commission</p>
                  <p className="text-xl font-bold text-teal-800">{formatINR(Math.round(result.grossCommission))}</p>
                  <p className="text-xs text-teal-500">{result.commissionPct}% of {formatINR(premiumAmount)}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium">POSP/Channel Earning</p>
                  <p className="text-xl font-bold text-emerald-800">{formatINR(Math.round(result.pospEarning))}</p>
                  <p className="text-xs text-emerald-500">{result.channelPayoutPct}% of commission</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-600 font-medium">Company Margin</p>
                  <p className="text-xl font-bold text-amber-800">{formatINR(Math.round(result.companyMargin))}</p>
                  <p className="text-xs text-amber-500">{result.companyMarginPct}% of commission</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium">RM Credit (Weighted)</p>
                  <p className="text-xl font-bold text-blue-800">{formatINR(Math.round(result.rmCredit))}</p>
                  <p className="text-xs text-blue-500">{channelRules.find((r) => r.channelType === channelType)?.rmCreditPct}% of premium</p>
                </div>
              </div>

              {/* Waterfall */}
              <div className="p-4 bg-slate-800 rounded-lg text-xs font-mono space-y-1">
                <p className="text-slate-400">Payout Waterfall</p>
                <p className="text-green-400">Premium        : {formatINR(premiumAmount)}</p>
                <p className="text-green-400">Commission %   : {result.commissionPct}%</p>
                <p className="text-green-400">Gross Comm     : {formatINR(Math.round(result.grossCommission))}</p>
                <p className="text-teal-400">  Channel ({result.channelPayoutPct}%) : {formatINR(Math.round(result.pospEarning))}</p>
                <p className="text-amber-400">  Company ({result.companyMarginPct}%) : {formatINR(Math.round(result.companyMargin))}</p>
                <p className="text-blue-400">RM Credit      : {formatINR(Math.round(result.rmCredit))}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Configure inputs to see simulation results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
