'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, BarChart3, IndianRupee, Target,
  TrendingUp, Award, Calendar, LogOut, Star, Zap,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { DashboardData } from '@/lib/mis/types';
import { PRODUCTS } from '@/lib/mis/employee-data';

export default function PerformancePage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const authRes = await fetch('/api/rm/auth');
        if (!authRes.ok) { router.push('/rm/login'); return; }

        const dashRes = await fetch('/api/mis/dashboard');
        if (dashRes.ok) {
          setDashboard(await dashRes.json());
        }
      } catch {
        router.push('/rm/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/rm/login');
  };

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const { employee, currentMonth: calc, businessEntries, performanceHistory } = dashboard;

  // Product-wise breakdown
  const productBreakdown = new Map<number, { rawAmount: number; weightedAmount: number; count: number }>();
  for (const entry of businessEntries) {
    const existing = productBreakdown.get(entry.productId) || { rawAmount: 0, weightedAmount: 0, count: 0 };
    productBreakdown.set(entry.productId, {
      rawAmount: existing.rawAmount + entry.rawAmount,
      weightedAmount: existing.weightedAmount + entry.weightedAmount,
      count: existing.count + 1,
    });
  }

  const statusColors: Record<string, string> = {
    'Champion': 'bg-amber-100 text-amber-700',
    'Star': 'bg-purple-100 text-purple-700',
    'Achiever': 'bg-emerald-100 text-emerald-700',
    'Below Target': 'bg-red-100 text-red-700',
    'No Incentive': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/rm" className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-bold text-slate-700">My Performance</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Employee Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold">
                {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{employee.name}</h2>
                <p className="text-xs text-slate-500">{employee.designation} | {employee.entity} | {employee.department}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Code: {employee.employeeCode} | Level: {employee.levelCode} | Segment: {employee.segment}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                Target: {formatINR(employee.monthlyTarget)}/mo
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                {employee.targetMultiplier}x Multiplier
              </span>
            </div>
          </div>
        </div>

        {/* Current Month Detailed Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            April 2026 — Detailed Breakdown
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Target</p>
              <p className="text-lg font-bold text-blue-800">{formatINR(calc.monthlyTarget)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Net Business</p>
              <p className="text-lg font-bold text-emerald-800">{formatINR(calc.netWeightedBusiness)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-[10px] text-purple-600 font-bold uppercase">Achievement</p>
              <p className="text-lg font-bold text-purple-800">{calc.achievementPct}%</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-[10px] text-amber-600 font-bold uppercase">Incentive</p>
              <p className="text-lg font-bold text-amber-800">{formatINR(calc.totalPayout)}</p>
            </div>
          </div>

          {/* Incentive Calculation Breakdown */}
          <div className="p-4 bg-slate-800 rounded-lg text-green-400 font-mono text-xs space-y-1 mb-6">
            <p className="text-slate-500">{'// Incentive Calculation Breakdown'}</p>
            <p>Raw Business    = {formatINR(calc.totalRawBusiness)}</p>
            <p>Weighted Biz    = {formatINR(calc.totalWeightedBusiness)}</p>
            <p>SIP Clawback    = -{formatINR(calc.sipClawbackDebit)}</p>
            <p>Net Business    = {formatINR(calc.netWeightedBusiness)}</p>
            <p>Achievement     = {calc.netWeightedBusiness} / {calc.monthlyTarget} = <span className="text-cyan-400">{calc.achievementPct}%</span></p>
            <p>Slab            = {calc.slabLabel} ({calc.incentiveRate}% x {calc.slabMultiplier}x)</p>
            <p>Gross Incentive = {formatINR(calc.netWeightedBusiness)} x {calc.incentiveRate}% x {calc.slabMultiplier} = {formatINR(calc.grossIncentive)}</p>
            <p>Compliance      = x {calc.complianceFactor}</p>
            <p className="text-amber-400 font-bold">Net Incentive   = {formatINR(calc.netIncentive)}</p>
            {calc.trailIncome > 0 && <p>+ Trail Income  = {formatINR(calc.trailIncome)}</p>}
            <p className="text-amber-400 font-bold border-t border-slate-600 pt-1">Total Payout    = {formatINR(calc.totalPayout)}</p>
          </div>

          {/* Product-wise Contribution */}
          <h4 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Product-wise Contribution</h4>
          <div className="space-y-2">
            {Array.from(productBreakdown.entries()).map(([prodId, data]) => {
              const product = PRODUCTS.find(p => p.id === prodId);
              const pctOfTotal = calc.totalWeightedBusiness > 0
                ? Math.round((data.weightedAmount / calc.totalWeightedBusiness) * 100)
                : 0;
              return (
                <div key={prodId} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-slate-600 truncate">
                    {product?.productName || `#${prodId}`}
                  </div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                  <div className="text-right w-28">
                    <span className="text-xs font-mono font-semibold text-slate-700">{formatINR(data.weightedAmount)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({pctOfTotal}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Performance History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Monthly Performance History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Month</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Achievement</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Payout</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Progress</th>
                </tr>
              </thead>
              <tbody>
                {/* Current month */}
                <tr className="border-b border-slate-100 bg-emerald-50/30">
                  <td className="px-3 py-3 text-sm font-medium text-slate-700">
                    {calc.month} <span className="text-[10px] text-emerald-600 font-bold">(Current)</span>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-right text-emerald-600">{calc.achievementPct}%</td>
                  <td className="px-3 py-3 text-sm font-semibold text-right text-slate-700">{formatINR(calc.totalPayout)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[calc.performanceStatus]}`}>
                      {calc.performanceStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(calc.achievementPct, 200) / 2}%` }} />
                    </div>
                  </td>
                </tr>
                {/* Historical months */}
                {performanceHistory.map((m) => (
                  <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                    <td className="px-3 py-3 text-sm font-medium text-slate-600">{m.month}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-slate-600">{m.achievementPct}%</td>
                    <td className="px-3 py-3 text-sm font-semibold text-right text-slate-600">{formatINR(m.totalPayout)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.achievementPct >= 100 ? 'bg-emerald-500' : m.achievementPct >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(m.achievementPct, 200) / 2}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
