'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, TrendingUp, IndianRupee, Award, Shield,
  FileText, Download, Loader2, AlertTriangle, CheckCircle, X,
  Calendar, Target, Building2, ChevronDown, Search, Layers,
  ArrowUpRight, ArrowDownRight, Percent,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import { EMPLOYEES, PRODUCTS } from '@/lib/mis/employee-data';
import type { AdminRole } from '@/lib/auth/config';

// ─── Types ───
interface AuthUser { email: string; name: string; role: AdminRole; }
type TabId = 'monthly' | 'partners' | 'channels' | 'trails' | 'export';

interface EmployeeSummary {
  employeeId: number;
  name: string;
  raw: number;
  weighted: number;
  count: number;
  target: number;
  achievementPct: number;
}

interface MonthlySummary {
  month: string;
  totalEntries: number;
  totalRawBusiness: number;
  totalWeightedBusiness: number;
  activeEmployees: number;
  topPerformers: EmployeeSummary[];
  bottomPerformers: EmployeeSummary[];
  byEmployee: EmployeeSummary[];
}

interface ChannelData {
  volume: number;
  count: number;
  payout: number;
}

// ─── Toast ───
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
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
        <div className={`p-2.5 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </div>
  );
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(mo)]} ${y}`;
}

function generateMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('monthly');
  const [month, setMonth] = useState(generateMonthOptions()[0]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Data
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [channels, setChannels] = useState<Record<string, ChannelData> | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) { window.location.href = '/admin/login'; return; }
        const data = await res.json();
        setUser(data);
      } catch { window.location.href = '/admin/login'; }
      finally { setLoading(false); }
    }
    checkAuth();
  }, []);

  const fetchMonthlySummary = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/admin/mis/reports?report=monthly_summary&month=${month}`);
      if (res.ok) setSummary(await res.json());
    } catch { /* ignore */ }
    finally { setDataLoading(false); }
  }, [month]);

  const fetchChannels = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/admin/mis/reports?report=channel_comparison&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
      }
    } catch { /* ignore */ }
    finally { setDataLoading(false); }
  }, [month]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'monthly') fetchMonthlySummary();
    if (activeTab === 'channels') fetchChannels();
  }, [user, activeTab, month, fetchMonthlySummary, fetchChannels]);

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'monthly', label: 'Monthly Summary', icon: Calendar },
    { id: 'partners', label: 'Partner Performance', icon: Users },
    { id: 'channels', label: 'Channel Comparison', icon: Layers },
    { id: 'trails', label: 'Trail Report', icon: TrendingUp },
    { id: 'export', label: 'Export Center', icon: Download },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-slate-400" /> MIS Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive reports across all MIS modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            {monthOptions.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}>
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {dataLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* ═══ Monthly Summary ═══ */}
      {activeTab === 'monthly' && !dataLoading && (
        <div className="space-y-6">
          {summary ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Business" value={formatINR(summary.totalRawBusiness)} icon={IndianRupee} color="bg-emerald-500" subtext={`${summary.totalEntries} entries`} />
                <StatCard label="Weighted Business" value={formatINR(summary.totalWeightedBusiness)} icon={Target} color="bg-blue-500" />
                <StatCard label="Active Employees" value={String(summary.activeEmployees)} icon={Users} color="bg-amber-500" />
                <StatCard label="Avg Achievement" value={
                  summary.byEmployee.length > 0
                    ? `${Math.round(summary.byEmployee.reduce((s, e) => s + e.achievementPct, 0) / summary.byEmployee.length)}%`
                    : '—'
                } icon={Award} color="bg-purple-500" />
              </div>

              {/* Top Performers */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Top Performers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Employee</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Achievement</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Weighted Biz</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Target</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Entries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.topPerformers.map((emp, i) => (
                        <tr key={emp.employeeId} className="border-t border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-bold text-slate-400">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{emp.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              emp.achievementPct > 150 ? 'bg-purple-100 text-purple-700' :
                              emp.achievementPct > 100 ? 'bg-emerald-100 text-emerald-700' :
                              emp.achievementPct > 80 ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {emp.achievementPct > 100 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {emp.achievementPct}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(emp.weighted)}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{formatINR(emp.target)}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">{emp.count}</td>
                        </tr>
                      ))}
                      {summary.topPerformers.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No data for {formatMonth(month)}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Below Target */}
              {summary.bottomPerformers.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <div className="p-4 border-b border-amber-200 bg-amber-50">
                    <h3 className="font-bold text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Below Target ({`<80%`})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-amber-50/50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600">Employee</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600">Achievement</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600">Gap to 80%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.bottomPerformers.map(emp => (
                          <tr key={emp.employeeId} className="border-t border-amber-100">
                            <td className="px-4 py-3 font-medium text-slate-700">{emp.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{emp.achievementPct}%</span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                              {formatINR(Math.round(emp.target * 0.8 - emp.weighted))} needed
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a month to view summary</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Partner Performance ═══ */}
      {activeTab === 'partners' && !dataLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total POSP" value={String(EMPLOYEES.filter(e => e.segment === 'CDM/POSP RM').length)} icon={Users} color="bg-emerald-500" />
            <StatCard label="Total BQP" value="0" icon={Shield} color="bg-blue-500" />
            <StatCard label="Total Franchise" value="0" icon={Building2} color="bg-amber-500" />
            <StatCard label="Total Referral" value="0" icon={FileText} color="bg-purple-500" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 mb-2">Partner Performance Report</h3>
            <p className="text-sm text-slate-500 mb-4">
              As partners are onboarded through the Partner Registry module, their performance data will appear here.
              Track POSP, BQP, Franchise, and Referral performance across LOBs.
            </p>
            <a href="/admin/mis/partners" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Go to Partner Registry <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ═══ Channel Comparison ═══ */}
      {activeTab === 'channels' && !dataLoading && (
        <div className="space-y-6">
          {channels ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(channels).map(([ch, data]) => {
                  const margin = data.volume > 0 ? Math.round((data.volume - data.payout) / data.volume * 100) : 0;
                  const colors: Record<string, string> = {
                    Direct: 'bg-emerald-500', POSP: 'bg-blue-500', BQP: 'bg-purple-500',
                    Franchise: 'bg-amber-500', Referral: 'bg-rose-500',
                  };
                  return (
                    <div key={ch} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${colors[ch] || 'bg-slate-400'}`} />
                        <p className="text-xs font-bold text-slate-700 uppercase">{ch}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-800">{formatINR(data.volume)}</p>
                      <p className="text-[10px] text-slate-400">{data.count} policies</p>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-500">Payout</span>
                          <span className="text-[10px] font-medium text-slate-600">{formatINR(data.payout)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-500">Margin</span>
                          <span className="text-[10px] font-bold text-emerald-600">{margin}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" /> Detailed Channel Comparison — {formatMonth(month)}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Channel</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Volume</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Policies</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Payout</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Retention</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(channels).map(([ch, data]) => {
                        const retention = data.volume - data.payout;
                        const margin = data.volume > 0 ? Math.round(retention / data.volume * 100) : 0;
                        return (
                          <tr key={ch} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">{ch}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(data.volume)}</td>
                            <td className="px-4 py-3 text-center text-slate-500">{data.count}</td>
                            <td className="px-4 py-3 text-right text-red-600">{formatINR(data.payout)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">{formatINR(retention)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                margin > 30 ? 'bg-emerald-100 text-emerald-700' :
                                margin > 15 ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{margin}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Loading channel data...</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Trail Report ═══ */}
      {activeTab === 'trails' && !dataLoading && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 mb-2">Trail Income Report</h3>
            <p className="text-sm text-slate-500 mb-4">
              Detailed trail income analytics are available in the Trail Income dashboard.
              View AUM breakdowns, RM share calculations, and fund category analysis.
            </p>
            <a href="/admin/mis/trails" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Go to Trail Income Dashboard <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ═══ Export Center ═══ */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-slate-400" /> Available Reports
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Monthly Payout Summary', desc: 'Employee-wise payout breakdown for selected month', icon: Calendar },
                { name: 'Employee Incentive Detail', desc: 'Detailed incentive calculation per employee', icon: Users },
                { name: 'Partner Performance', desc: 'POSP/BQP/Franchise business volumes and payouts', icon: Shield },
                { name: 'Channel Comparison', desc: 'Side-by-side channel margin analysis', icon: Layers },
                { name: 'Trail Income Statement', desc: 'MF trail income with RM/Company split', icon: TrendingUp },
                { name: 'Business Entry Register', desc: 'All business entries with status and amounts', icon: FileText },
              ].map(report => (
                <div key={report.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <report.icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (report.name === 'Monthly Payout Summary' && summary) {
                        downloadCSV(
                          `Trustner_Payout_Summary_${month}.csv`,
                          ['Employee', 'Raw Business', 'Weighted Business', 'Target', 'Achievement%', 'Entries'],
                          summary.byEmployee.map(e => [e.name, String(e.raw), String(e.weighted), String(e.target), String(e.achievementPct), String(e.count)])
                        );
                        setToast({ message: 'Report downloaded', type: 'success' });
                      } else if (report.name === 'Channel Comparison' && channels) {
                        downloadCSV(
                          `Trustner_Channel_Comparison_${month}.csv`,
                          ['Channel', 'Volume', 'Policies', 'Payout', 'Retention', 'Margin%'],
                          Object.entries(channels).map(([ch, d]) => [ch, String(d.volume), String(d.count), String(d.payout), String(d.volume - d.payout), String(d.volume > 0 ? Math.round((d.volume - d.payout) / d.volume * 100) : 0)])
                        );
                        setToast({ message: 'Report downloaded', type: 'success' });
                      } else {
                        setToast({ message: 'Load the report data first by visiting the relevant tab', type: 'info' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600">
              <strong>Tip:</strong> Visit the Monthly Summary or Channel Comparison tabs first to load data, then come to Export Center to download.
              Reports are generated from the data currently loaded in your session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
