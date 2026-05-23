'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCog, Search, Shield, ShieldCheck, ChevronDown, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, X, MapPin, Building2,
  ToggleLeft, ToggleRight, Filter, Users, Briefcase,
  Save, RotateCcw, Eye, EyeOff, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─────────────── Types ─────────────── */
interface PermissionModule {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface EmployeeWithPerms {
  id: number;
  name: string;
  email: string;
  designation: string;
  department: string;
  companyGroup: string;
  jobLocation: string;
  role: string;
  doj: string;
  canApproveResets: boolean;
  reportingHead: string;
  directReports: number;
  permissions: Record<string, boolean>;
  isEnabled: boolean;
  hasOverrides: boolean;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  bod: 'Board of Directors',
  cdo: 'CDO',
  regional_manager: 'Regional Manager',
  branch_head: 'Branch Head',
  cdm: 'CDM',
  manager: 'Manager',
  mentor: 'Mentor',
  sr_rm: 'Sr. RM',
  rm: 'RM',
  back_office: 'Back Office',
  support: 'Support',
};

const ROLE_COLORS: Record<string, string> = {
  bod: 'bg-purple-100 text-purple-700 border-purple-200',
  cdo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  regional_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  branch_head: 'bg-teal-100 text-teal-700 border-teal-200',
  cdm: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  mentor: 'bg-amber-100 text-amber-700 border-amber-200',
  sr_rm: 'bg-orange-100 text-orange-700 border-orange-200',
  rm: 'bg-slate-100 text-slate-600 border-slate-200',
  back_office: 'bg-gray-100 text-gray-600 border-gray-200',
  support: 'bg-stone-100 text-stone-600 border-stone-200',
};

const PERMISSION_CATEGORIES = ['Content', 'Operations', 'People', 'Learning', 'Admin'];

const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'blog_view', label: 'View Blog', description: 'Read blog posts', category: 'Content' },
  { key: 'blog_manage', label: 'Manage Blog', description: 'Create/edit/delete posts', category: 'Content' },
  { key: 'market_view', label: 'View Market Pulse', description: 'Read commentaries', category: 'Content' },
  { key: 'market_manage', label: 'Manage Market Pulse', description: 'Create/edit reports', category: 'Content' },
  { key: 'gallery_manage', label: 'Manage Gallery', description: 'Upload/delete media', category: 'Content' },
  { key: 'fund_view', label: 'View Fund Data', description: 'See fund lists', category: 'Content' },
  { key: 'fund_manage', label: 'Manage Funds', description: 'Upload/edit fund data', category: 'Content' },
  { key: 'dashboard_view', label: 'Dashboard', description: 'Admin overview', category: 'Operations' },
  { key: 'mis_view', label: 'View MIS', description: 'See MIS reports', category: 'Operations' },
  { key: 'mis_manage', label: 'Manage MIS', description: 'Edit entries/slabs', category: 'Operations' },
  { key: 'business_entry', label: 'Log Business', description: 'Create entries', category: 'Operations' },
  { key: 'payouts_view', label: 'View Payouts', description: 'See incentive data', category: 'Operations' },
  { key: 'payouts_manage', label: 'Manage Payouts', description: 'Approve payouts', category: 'Operations' },
  { key: 'reports_view', label: 'View Reports', description: 'See FP reports', category: 'Operations' },
  { key: 'reports_manage', label: 'Manage Reports', description: 'Approve/send reports', category: 'Operations' },
  { key: 'leads_view', label: 'View Leads', description: 'See lead data', category: 'People' },
  { key: 'leads_manage', label: 'Manage Leads', description: 'Assign/export leads', category: 'People' },
  { key: 'team_view', label: 'Team Directory', description: 'See employees', category: 'People' },
  { key: 'team_manage', label: 'Manage Team', description: 'Password resets', category: 'People' },
  { key: 'approvals', label: 'Approvals', description: 'Approve actions', category: 'People' },
  { key: 'mf_gyan_view', label: 'MF Gyan', description: 'Learning modules', category: 'Learning' },
  { key: 'mf_gyan_manage', label: 'Manage MF Gyan', description: 'Edit content', category: 'Learning' },
  { key: 'analytics', label: 'Analytics', description: 'Site analytics', category: 'Admin' },
  { key: 'user_management', label: 'User Management', description: 'This page', category: 'Admin' },
  { key: 'audit_log', label: 'Audit Log', description: 'System audit', category: 'Admin' },
  { key: 'settings', label: 'Settings', description: 'System config', category: 'Admin' },
];

const CATEGORY_ICONS: Record<string, string> = {
  Content: 'text-blue-600',
  Operations: 'text-emerald-600',
  People: 'text-purple-600',
  Learning: 'text-amber-600',
  Admin: 'text-red-600',
};

const CATEGORY_BG: Record<string, string> = {
  Content: 'bg-blue-50 border-blue-200',
  Operations: 'bg-emerald-50 border-emerald-200',
  People: 'bg-purple-50 border-purple-200',
  Learning: 'bg-amber-50 border-amber-200',
  Admin: 'bg-red-50 border-red-200',
};

/* ─────────────── Main Page ─────────────── */
export default function AdminUsersPage() {
  const [employees, setEmployees] = useState<EmployeeWithPerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Selected employee for permission editing
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [editedPerms, setEditedPerms] = useState<Record<string, boolean>>({});
  const [editedEnabled, setEditedEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Expand categories in permission editor
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(PERMISSION_CATEGORIES));

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users/permissions');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Select employee for editing
  const selectEmployee = (emp: EmployeeWithPerms) => {
    if (selectedEmpId === emp.id) {
      setSelectedEmpId(null);
      return;
    }
    setSelectedEmpId(emp.id);
    setEditedPerms({ ...emp.permissions });
    setEditedEnabled(emp.isEnabled);
    setDirty(false);
  };

  const togglePerm = (key: string) => {
    setEditedPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const toggleEnabled = () => {
    setEditedEnabled(prev => !prev);
    setDirty(true);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // Enable/disable all in a category
  const setCategoryAll = (cat: string, value: boolean) => {
    const catPerms = PERMISSION_MODULES.filter(m => m.category === cat);
    setEditedPerms(prev => {
      const next = { ...prev };
      for (const p of catPerms) next[p.key] = value;
      return next;
    });
    setDirty(true);
  };

  // Reset to role defaults
  const resetToDefaults = () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;
    // Refetch defaults by requesting fresh data
    setDirty(false);
    fetchEmployees().then(() => {
      const updated = employees.find(e => e.id === selectedEmpId);
      if (updated) {
        // Just close and reopen
        setSelectedEmpId(null);
        setTimeout(() => {
          setSelectedEmpId(emp.id);
        }, 100);
      }
    });
  };

  const savePermissions = async () => {
    if (!selectedEmpId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          permissions: editedPerms,
          isEnabled: editedEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setDirty(false);
        await fetchEmployees();
      } else {
        setToast({ message: data.error || 'Save failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Filter employees
  const filtered = employees.filter(emp => {
    if (search) {
      const q = search.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) &&
          !emp.email.toLowerCase().includes(q) &&
          !emp.designation.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
    if (locationFilter !== 'all' && emp.jobLocation !== locationFilter) return false;
    return true;
  });

  // Unique values for filters
  const departments = [...new Set(employees.map(e => e.department))].sort();
  const locations = [...new Set(employees.map(e => e.jobLocation))].sort();
  const roles = [...new Set(employees.map(e => e.role))];

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  // Stats
  const totalEnabled = employees.filter(e => e.isEnabled).length;
  const totalWithOverrides = employees.filter(e => e.hasOverrides).length;

  const enabledCount = (perms: Record<string, boolean>) =>
    Object.values(perms).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-elevated text-sm font-semibold animate-fade-in',
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-primary-700">User & Access Management</h1>
        <p className="text-sm text-slate-500">Manage employee access, permissions, and module controls</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-base p-3 text-center">
          <div className="text-2xl font-extrabold text-blue-700">{employees.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Total Employees</div>
        </div>
        <div className="card-base p-3 text-center">
          <div className="text-2xl font-extrabold text-emerald-700">{totalEnabled}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Active Access</div>
        </div>
        <div className="card-base p-3 text-center">
          <div className="text-2xl font-extrabold text-amber-700">{totalWithOverrides}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Custom Overrides</div>
        </div>
        <div className="card-base p-3 text-center">
          <div className="text-2xl font-extrabold text-purple-700">{employees.length - totalEnabled}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Disabled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, designation..."
            className="w-full border border-surface-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-surface-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none bg-white">
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="border border-surface-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none bg-white">
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="border border-surface-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-brand/20 outline-none bg-white">
          <option value="all">All Locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} employees</span>
      </div>

      {/* Two-panel layout: Employee List + Permission Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ─── LEFT: Employee List ─── */}
        <div className="lg:col-span-2 space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filtered.map((emp) => {
            const isSelected = selectedEmpId === emp.id;
            const permCount = enabledCount(emp.permissions);
            const totalPerms = Object.keys(emp.permissions).length;

            return (
              <button
                key={emp.id}
                onClick={() => selectEmployee(emp)}
                className={cn(
                  'w-full text-left card-base p-3 transition-all hover:shadow-sm',
                  isSelected && 'ring-2 ring-brand bg-brand-50/30',
                  !emp.isEnabled && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    emp.role === 'bod' ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' :
                    emp.role === 'cdo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white' :
                    'bg-slate-100 text-slate-600'
                  )}>
                    {emp.role === 'bod' ? <ShieldCheck className="w-4 h-4" /> :
                     emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{emp.name}</h4>
                      {!emp.isEnabled && <Lock className="w-3 h-3 text-red-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{emp.designation}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold border', ROLE_COLORS[emp.role] || ROLE_COLORS.rm)}>
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                      <span className="text-[9px] text-slate-400">{emp.department}</span>
                      {emp.hasOverrides && (
                        <span className="text-[9px] text-amber-600 font-bold">CUSTOM</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono font-bold text-slate-600">{permCount}/{totalPerms}</div>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-0.5">
                      <div
                        className={cn('h-full rounded-full', permCount === totalPerms ? 'bg-emerald-500' : permCount > totalPerms / 2 ? 'bg-blue-500' : 'bg-amber-500')}
                        style={{ width: `${(permCount / totalPerms) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <UserCog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No employees match filters</p>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Permission Editor ─── */}
        <div className="lg:col-span-3">
          {selectedEmp ? (
            <div className="card-base overflow-hidden sticky top-20">
              {/* Employee Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold',
                      selectedEmp.role === 'bod' ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' :
                      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    )}>
                      {selectedEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{selectedEmp.name}</h3>
                      <p className="text-xs text-slate-500">{selectedEmp.designation} | {selectedEmp.department}</p>
                      <p className="text-[10px] text-slate-400">{selectedEmp.email} | {selectedEmp.jobLocation}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmpId(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold border', ROLE_COLORS[selectedEmp.role])}>
                    {ROLE_LABELS[selectedEmp.role]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {selectedEmp.companyGroup}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {selectedEmp.jobLocation}
                  </span>
                  <span className="text-[10px] text-slate-400">Reports to: {selectedEmp.reportingHead}</span>
                  {selectedEmp.directReports > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-200">
                      {selectedEmp.directReports} direct reports
                    </span>
                  )}
                </div>

                {/* Master Toggle + Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                  <button onClick={toggleEnabled} className="flex items-center gap-2">
                    {editedEnabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-red-400" />
                    )}
                    <span className={cn('text-xs font-bold', editedEnabled ? 'text-emerald-700' : 'text-red-600')}>
                      {editedEnabled ? 'Account Active' : 'Account Disabled'}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <button
                        onClick={savePermissions}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Permission Categories */}
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                {PERMISSION_CATEGORIES.map((cat) => {
                  const catPerms = PERMISSION_MODULES.filter(m => m.category === cat);
                  const expanded = expandedCats.has(cat);
                  const enabledInCat = catPerms.filter(p => editedPerms[p.key]).length;

                  return (
                    <div key={cat} className="border-b border-slate-100 last:border-0">
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span className={cn('text-xs font-bold', CATEGORY_ICONS[cat])}>{cat}</span>
                          <span className="text-[10px] text-slate-400">{enabledInCat}/{catPerms.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setCategoryAll(cat, true); }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100"
                          >
                            All ON
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCategoryAll(cat, false); }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-bold hover:bg-red-100"
                          >
                            All OFF
                          </button>
                        </div>
                      </button>

                      {expanded && (
                        <div className="px-4 pb-3 space-y-1">
                          {catPerms.map((perm) => {
                            const isOn = editedPerms[perm.key];
                            return (
                              <div
                                key={perm.key}
                                className={cn(
                                  'flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer',
                                  isOn ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50/50 hover:bg-slate-50'
                                )}
                                onClick={() => togglePerm(perm.key)}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs font-semibold', isOn ? 'text-slate-800' : 'text-slate-400')}>{perm.label}</p>
                                  <p className="text-[10px] text-slate-400">{perm.description}</p>
                                </div>
                                <div className="shrink-0 ml-3">
                                  {isOn ? (
                                    <div className="w-8 h-4.5 bg-emerald-500 rounded-full flex items-center justify-end px-0.5">
                                      <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-4.5 bg-slate-200 rounded-full flex items-center justify-start px-0.5">
                                      <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              {selectedEmp.lastModifiedBy && (
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] text-slate-400">
                    Last modified by {selectedEmp.lastModifiedBy} on{' '}
                    {new Date(selectedEmp.lastModifiedAt!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card-base p-12 text-center sticky top-20">
              <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-600 mb-1">Select an Employee</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click any employee from the list to view and manage their module permissions, access controls, and account status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
