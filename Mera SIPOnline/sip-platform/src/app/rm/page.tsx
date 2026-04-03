'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Target, TrendingUp, IndianRupee, Award, ArrowUpRight, BarChart3,
  FileText, LogOut, Plus, Loader2, AlertCircle, CheckCircle,
  ChevronRight, Zap, Calendar, Briefcase, Star, Users,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { DashboardData } from '@/lib/mis/types';
import { PRODUCTS } from '@/lib/mis/employee-data';
import { RMNav } from '@/components/rm/RMNav';

interface UserInfo {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  entity: string;
  segment: string;
  role: string;
}

export default function RMDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Check auth
        const authRes = await fetch('/api/rm/auth');
        if (!authRes.ok) {
          router.push('/admin/login');
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        // Load dashboard
        const dashRes = await fetch('/api/mis/dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDashboard(dashData);
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Could not load your session</p>
          <Link href="/admin/login" className="text-emerald-600 text-sm font-medium mt-2 block">
            Try logging in again
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RMNav
          userName={user.name}
          designation={user.designation}
          entity={user.entity}
          onLogout={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Welcome, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Your MIS dashboard is being set up. Once your targets and profile are configured by the admin, your performance dashboard will appear here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/rm/learn"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Star className="w-4 h-4" /> Start Learning
              </Link>
              <Link
                href="/rm/business-entry"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Log Business Entry
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { currentMonth: calc, businessEntries, nextSlabInfo, performanceHistory } = dashboard;
  const achievementColor =
    calc.achievementPct >= 131 ? 'text-purple-600' :
    calc.achievementPct >= 100 ? 'text-emerald-600' :
    calc.achievementPct >= 80 ? 'text-amber-600' : 'text-red-600';

  const statusColors: Record<string, string> = {
    'Champion': 'bg-amber-100 text-amber-700 border-amber-200',
    'Star': 'bg-purple-100 text-purple-700 border-purple-200',
    'Achiever': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Below Target': 'bg-red-100 text-red-700 border-red-200',
    'No Incentive': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Tab Navigation */}
      <RMNav
        userName={user.name}
        designation={user.designation}
        entity={user.entity}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome + Month */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              April 2026 | {user.segment}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[calc.performanceStatus]}`}>
              {calc.performanceStatus === 'Champion' && <Star className="w-3 h-3 inline mr-1" />}
              {calc.performanceStatus}
            </span>
            <Link
              href="/rm/business-entry"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Log Business
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{calc.applicableSlab}</span>
            </div>
            <p className="text-xs text-slate-500">Monthly Target</p>
            <p className="text-lg font-bold text-slate-800">{formatINR(calc.monthlyTarget)}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{businessEntries.length} entries</span>
            </div>
            <p className="text-xs text-slate-500">Weighted Business</p>
            <p className="text-lg font-bold text-slate-800">{formatINR(calc.netWeightedBusiness)}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-xs text-slate-500">Achievement</p>
            <p className={`text-2xl font-bold ${achievementColor}`}>{calc.achievementPct}%</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{calc.slabLabel}</span>
            </div>
            <p className="text-xs text-slate-500">Estimated Incentive</p>
            <p className="text-lg font-bold text-amber-600">{formatINR(calc.totalPayout)}</p>
          </div>
        </div>

        {/* Achievement Meter + Next Slab */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Achievement Progress</h3>
            <span className={`text-sm font-bold ${achievementColor}`}>{calc.achievementPct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                calc.achievementPct >= 151 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                calc.achievementPct >= 131 ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                calc.achievementPct >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                calc.achievementPct >= 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${Math.min(calc.achievementPct, 200) / 2}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mb-3">
            <span>0%</span><span>80%</span><span>100%</span><span>130%</span><span>150%+</span>
          </div>

          {nextSlabInfo && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700">
                <strong>{formatINR(nextSlabInfo.amountNeeded)}</strong> more to reach{' '}
                <strong>{nextSlabInfo.nextSlabLabel}</strong> ({nextSlabInfo.achievementNeeded}%)
              </p>
            </div>
          )}
        </div>

        {/* Two columns: Recent Entries + Performance History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Business Entries */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Recent Business Entries
              </h3>
              <Link href="/rm/business-entry" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {businessEntries.slice(0, 6).map((entry) => {
                const product = PRODUCTS.find(p => p.id === entry.productId);
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {product?.productName || `Product #${entry.productId}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.clientName || 'N/A'}{entry.insurer ? ` | ${entry.insurer}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{formatINR(entry.rawAmount)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Weighted: {formatINR(entry.weightedAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {businessEntries.length === 0 && (
                <div className="p-8 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No entries this month</p>
                  <Link href="/rm/business-entry" className="text-xs text-emerald-600 font-medium mt-1 block">
                    Log your first entry
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Performance History */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                Performance History
              </h3>
              <Link href="/rm/performance" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-0.5">
                Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {performanceHistory.map((month) => {
                const barWidth = Math.min(month.achievementPct, 200) / 2;
                const barColor =
                  month.achievementPct >= 100 ? 'bg-emerald-500' :
                  month.achievementPct >= 80 ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <div key={month.month} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          month.achievementPct >= 100 ? 'text-emerald-600' :
                          month.achievementPct >= 80 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {month.achievementPct}%
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${statusColors[month.status]}`}>
                          {month.status}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
