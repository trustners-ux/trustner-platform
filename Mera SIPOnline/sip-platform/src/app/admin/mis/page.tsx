'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3, Users, TrendingUp, Target, IndianRupee, Award,
  Building2, Shield, ChevronDown, Search, ArrowUpRight, ArrowDownRight,
  Briefcase, Clock, AlertTriangle, CheckCircle, Star, Zap
} from 'lucide-react';
import { EMPLOYEES } from '@/lib/mis/employee-data';
import { formatINR } from '@/lib/mis/incentive-engine';
import { Employee, PerformanceStatus } from '@/lib/mis/types';

// ─── Summary Stats ───
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

// ─── Employee Row ───
function EmployeeRow({ emp, rank }: { emp: Employee; rank: number }) {
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
        {emp.grossSalary > 0 ? formatINR(emp.grossSalary) : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
        {emp.monthlyTarget > 0 ? formatINR(emp.monthlyTarget) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {emp.targetMultiplier > 0 ? `${emp.targetMultiplier}×` : '—'}
      </td>
    </tr>
  );
}

export default function MISPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | 'TIB' | 'TAS'>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'incentive' | 'products'>('overview');

  const filteredEmployees = useMemo(() => {
    return EMPLOYEES.filter(emp => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) && !emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (entityFilter !== 'all' && emp.entity !== entityFilter) return false;
      if (segmentFilter !== 'all' && emp.segment !== segmentFilter) return false;
      return true;
    });
  }, [searchQuery, entityFilter, segmentFilter]);

  const activeEmployees = EMPLOYEES.filter(e => e.isActive);
  const salesTeam = activeEmployees.filter(e => e.segment !== 'Support');
  const supportTeam = activeEmployees.filter(e => e.segment === 'Support');
  const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => sum + e.grossSalary, 0);
  const totalMonthlyTarget = salesTeam.reduce((sum, e) => sum + e.monthlyTarget, 0);
  const tibCount = activeEmployees.filter(e => e.entity === 'TIB').length;
  const tasCount = activeEmployees.filter(e => e.entity === 'TAS').length;

  const segments = [...new Set(EMPLOYEES.map(e => e.segment))];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Trustner MIS Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Incentive Management & Performance Tracking System | FY 2026-27
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Clock className="w-3 h-3 inline mr-1" />
            April 2026
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Phase 1 — Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'employees', label: 'Employee Master', icon: Users },
          { id: 'incentive', label: 'Incentive Calc', icon: IndianRupee },
          { id: 'products', label: 'Product Rules', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              value={totalMonthlyTarget > 0 ? `${Math.round((totalMonthlyPayroll / totalMonthlyTarget) * 100)}%` : '—'}
              icon={TrendingUp}
              color="bg-purple-500"
              subtext="Target: <40%"
            />
          </div>

          {/* Entity Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-700">TIB — Insurance Broking</h3>
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
                <h3 className="font-bold text-slate-700">TAS — Asset Services</h3>
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
              <p className="text-xs text-slate-400 mb-3">For Direct Sales & FP Team (margin ≥30%)</p>
              <div className="space-y-1.5">
                {[
                  { range: '<80%', rate: '0%', label: 'No Incentive', color: 'bg-red-50 text-red-600' },
                  { range: '80-100%', rate: '4%', label: 'Base', color: 'bg-yellow-50 text-yellow-700' },
                  { range: '101-110%', rate: '5%', label: 'Enhanced', color: 'bg-blue-50 text-blue-600' },
                  { range: '111-130%', rate: '6%', label: 'Super', color: 'bg-emerald-50 text-emerald-600' },
                  { range: '131-150%', rate: '7%', label: 'Star', color: 'bg-purple-50 text-purple-600' },
                  { range: '151%+', rate: '8%', label: 'Champion', color: 'bg-amber-50 text-amber-600' },
                ].map(s => (
                  <div key={s.range} className={`flex items-center justify-between px-3 py-2 rounded-lg ${s.color}`}>
                    <span className="text-xs font-medium">{s.range}</span>
                    <span className="text-xs font-bold">{s.rate} — {s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                POSP RM Slabs (Channel Team)
              </h3>
              <p className="text-xs text-slate-400 mb-3">For CDM/POSP RM managing sub-brokers (70/30 margin)</p>
              <div className="space-y-1.5">
                {[
                  { range: '<80%', rate: '0%', label: 'No Incentive', color: 'bg-red-50 text-red-600' },
                  { range: '80-100%', rate: '1.2%', label: 'Base', color: 'bg-yellow-50 text-yellow-700' },
                  { range: '101-110%', rate: '1.5%', label: 'Enhanced', color: 'bg-blue-50 text-blue-600' },
                  { range: '111-130%', rate: '1.8%', label: 'Super', color: 'bg-emerald-50 text-emerald-600' },
                  { range: '131-150%', rate: '2.1%', label: 'Star', color: 'bg-purple-50 text-purple-600' },
                  { range: '151%+', rate: '2.4%', label: 'Champion', color: 'bg-amber-50 text-amber-600' },
                ].map(s => (
                  <div key={s.range} className={`flex items-center justify-between px-3 py-2 rounded-lg ${s.color}`}>
                    <span className="text-xs font-medium">{s.range}</span>
                    <span className="text-xs font-bold">{s.rate} — {s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Employee Master Tab */}
      {activeTab === 'employees' && (
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
              {filteredEmployees.length} of {EMPLOYEES.length} employees
            </span>
          </div>

          {/* Table */}
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
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => (
                  <EmployeeRow key={emp.id} emp={emp} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incentive Calculator Tab */}
      {activeTab === 'incentive' && (
        <IncentiveSimulator />
      )}

      {/* Product Rules Tab */}
      {activeTab === 'products' && (
        <ProductRulesView />
      )}
    </div>
  );
}

// ─── Incentive Simulator ───
function IncentiveSimulator() {
  const salesEmployees = EMPLOYEES.filter(e => e.monthlyTarget > 0);
  const [selectedEmpId, setSelectedEmpId] = useState(salesEmployees[0]?.id || 0);
  const [rawBusiness, setRawBusiness] = useState(250000);
  const [sipClawback, setSipClawback] = useState(0);

  const employee = EMPLOYEES.find(e => e.id === selectedEmpId);
  if (!employee) return null;

  const slabTable = employee.segment === 'CDM/POSP RM' || employee.segment === 'Area Manager' ? 'POSP_RM' : 'DST';

  // Simple simulation (weighted = raw for direct, no channel adjustments)
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
                <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Raw Business (₹)
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
              SIP Clawback Debit (₹)
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
            <p><strong>Target Multiplier:</strong> {employee.targetMultiplier}×</p>
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
            <p>{/* Incentive Calculation Formula */}Incentive Calculation Formula</p>
            <p>Net Business = {formatINR(rawBusiness)} - {formatINR(sipClawback)} = {formatINR(netBusiness)}</p>
            <p>Achievement  = {formatINR(netBusiness)} / {formatINR(employee.monthlyTarget)} = {achievementPct}%</p>
            <p>Slab         = {currentSlab.label} ({currentSlab.rate}% × {currentSlab.mult}×)</p>
            <p>Incentive    = {formatINR(netBusiness)} × {currentSlab.rate}% × {currentSlab.mult} = <span className="text-amber-400 font-bold">{formatINR(Math.round(incentiveAmount))}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Rules View ───
function ProductRulesView() {
  const { PRODUCTS } = require('@/lib/mis/employee-data');

  const tierColors = {
    1: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    2: 'bg-blue-50 border-blue-200 text-blue-700',
    3: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const tierLabels = {
    1: 'Tier 1 (>30%)',
    2: 'Tier 2 (15-30%)',
    3: 'Tier 3 (<15%)',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-400" />
          Product Credit Rules & Tier Classification
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Every product is classified into 3 tiers based on the company&apos;s commission rate. Tier determines credit multiplier (100%/75%/50%).
        </p>
      </div>
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
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Tier Multiplier</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p: any, i: number) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-0">
                <td className="px-4 py-2.5 text-sm text-slate-400">{i + 1}</td>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{p.productName}</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{p.productCategory}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierColors[p.tier as 1|2|3]}`}>
                    {tierLabels[p.tier as 1|2|3]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{p.commissionRange}</td>
                <td className="px-4 py-2.5 text-sm font-bold text-slate-700">{p.creditPct}%</td>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-600">
                  {p.tier === 1 ? '100%' : p.tier === 2 ? '75%' : '50%'}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400">{p.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
