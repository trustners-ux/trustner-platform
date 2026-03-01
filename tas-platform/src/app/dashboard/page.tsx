'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  TrendingUp, Wallet, BarChart3, Target, Shield, Heart,
  Landmark, GraduationCap, Home, Car, Gem, Plane,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  ChevronDown, Sparkles, BadgeIndianRupee, MessageCircle,
  Activity, Zap,
} from 'lucide-react';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';
import { formatINR, formatLakhsCrores } from '@/lib/utils/formatters';
import { useFinancialPlanStore } from '@/store/financial-plan-store';
import { useAuth } from '@/hooks/useAuth';
import type { GoalType, ActionItem } from '@/types/financial-plan';

// ─── Dynamic import to avoid localStorage SSR issues ─────────────────────────
const DashboardContent = dynamic(() => Promise.resolve(DashboardInner), {
  ssr: false,
});

export default function DashboardPage() {
  return <DashboardContent />;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOCATION_COLORS: Record<string, string> = {
  equity: '#3B82F6',
  debt: '#10B981',
  gold: '#F59E0B',
  cash: '#6B7280',
  realEstate: '#8B5CF6',
};

const ALLOCATION_LABELS: Record<string, string> = {
  equity: 'Equity',
  debt: 'Debt',
  gold: 'Gold',
  cash: 'Cash',
  realEstate: 'Real Estate',
};

const PRIORITY_STYLES: Record<
  ActionItem['priority'],
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Urgent' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'High' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Medium' },
  low: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Low' },
};

const GOAL_ICONS: Record<GoalType, React.ElementType> = {
  retirement: Landmark,
  'child-education': GraduationCap,
  house: Home,
  car: Car,
  wedding: Gem,
  vacation: Plane,
  'emergency-fund': Shield,
  'wealth-creation': TrendingUp,
  custom: Target,
};

// Mock portfolio data (kept for demo section)
const MOCK_PORTFOLIO = {
  totalValue: 2458320,
  invested: 1850000,
  returns: 608320,
  xirr: 18.4,
  holdings: [
    { name: 'HDFC Mid-Cap Opportunities Fund', type: 'Equity - Mid Cap', invested: 500000, current: 685000, returns: 37.0, units: 1842.5 },
    { name: 'Axis Bluechip Fund', type: 'Equity - Large Cap', invested: 400000, current: 512000, returns: 28.0, units: 8421.3 },
    { name: 'Parag Parikh Flexi Cap Fund', type: 'Equity - Flexi Cap', invested: 350000, current: 462000, returns: 32.0, units: 6125.8 },
    { name: 'SBI Small Cap Fund', type: 'Equity - Small Cap', invested: 300000, current: 421320, returns: 40.4, units: 2156.7 },
    { name: 'ICICI Pru Corporate Bond Fund', type: 'Debt - Corporate Bond', invested: 200000, current: 224000, returns: 12.0, units: 7850.2 },
    { name: 'Kotak Liquid Fund', type: 'Debt - Liquid', invested: 100000, current: 154000, returns: 6.8, units: 34.2 },
  ],
  sips: [
    { name: 'HDFC Mid-Cap Opportunities', amount: 10000, date: '5th', status: 'Active' },
    { name: 'Axis Bluechip Fund', amount: 8000, date: '10th', status: 'Active' },
    { name: 'Parag Parikh Flexi Cap', amount: 7000, date: '15th', status: 'Active' },
    { name: 'SBI Small Cap Fund', amount: 5000, date: '5th', status: 'Active' },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score < 40) return '#DC2626';
  if (score < 70) return '#F59E0B';
  return '#059669';
}

function getScoreLabel(score: number): string {
  if (score < 40) return 'Needs Attention';
  if (score < 70) return 'Fair';
  return 'Excellent';
}

function getScoreBgClass(score: number): string {
  if (score < 40) return 'bg-red-50 text-red-700';
  if (score < 70) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

// ─── Recharts ────────────────────────────────────────────────────────────────
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Big circular score gauge */
function CircularScore({ score, size = 180, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-xs font-medium text-gray-400">out of 100</span>
      </div>
    </div>
  );
}

/** Custom tooltip for Recharts pie charts */
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.fill }} />
        <span className="text-xs font-semibold text-gray-700">{item.name}</span>
      </div>
      <p className="mt-0.5 text-sm font-bold text-gray-900">{item.value.toFixed(1)}%</p>
    </div>
  );
}

// ─── Main Inner Component (rendered with SSR disabled) ───────────────────────

function DashboardInner() {
  // Zustand store -- safe to access localStorage here because ssr: false via dynamic()
  const { plan, isComplete, loadPlanFromBackend } = useFinancialPlanStore();
  const { isAuthenticated } = useAuth();

  const analysis = plan?.analysis;
  const hasPlan = isComplete && analysis;

  const [demoOpen, setDemoOpen] = useState(false);

  // Backend sync: recover plan from Supabase if authenticated but no local plan
  useEffect(() => {
    if (isAuthenticated && !hasPlan) {
      loadPlanFromBackend().catch(console.error);
    }
  }, [isAuthenticated, hasPlan, loadPlanFromBackend]);

  // Derived data
  const netWorthValue = (plan?.netWorth?.totalAssets ?? 0) - (plan?.netWorth?.totalLiabilities ?? 0);
  const monthlySurplus = plan?.expenses?.monthlySurplus ?? 0;

  const goalsOnTrack = useMemo(() => {
    if (!analysis?.goalFeasibility) return 0;
    return analysis.goalFeasibility.filter((g) => g.isOnTrack).length;
  }, [analysis?.goalFeasibility]);

  const totalGoals = analysis?.goalFeasibility?.length ?? 0;
  const pendingActions = analysis?.actionItems?.length ?? 0;

  const currentAllocationData = useMemo(() => {
    if (!analysis?.currentAllocation) return [];
    return Object.entries(analysis.currentAllocation)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({ name: ALLOCATION_LABELS[key] || key, value: val, fill: ALLOCATION_COLORS[key] || '#94A3B8' }));
  }, [analysis?.currentAllocation]);

  const recommendedAllocationData = useMemo(() => {
    if (!analysis?.recommendedAllocation) return [];
    return Object.entries(analysis.recommendedAllocation)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({ name: ALLOCATION_LABELS[key] || key, value: val, fill: ALLOCATION_COLORS[key] || '#94A3B8' }));
  }, [analysis?.recommendedAllocation]);

  const sortedActions = useMemo(() => {
    if (!analysis?.actionItems) return [];
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...analysis.actionItems].sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
  }, [analysis?.actionItems]);

  // 80C and 80D tax utilization
  const section80CUsed = plan?.tax?.section80C ?? 0;
  const section80CLimit = 150000;
  const section80DUsed = plan?.tax?.section80D ?? 0;
  const section80DLimit = 75000; // max for senior citizen; commonly 25000/50000/75000

  // ─── If no plan data: show CTA ─────────────────────────────────────────────
  if (!hasPlan) {
    return (
      <div className="min-h-screen bg-surface-100">
        {/* Hero CTA */}
        <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Financial Planning
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Your Financial Command Centre
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-blue-200/80 sm:text-lg">
              Create a comprehensive financial plan in 15 minutes. No registration needed.
            </p>
            <Link
              href="/ai-planner"
              className="mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" /> Create My Free Financial Plan <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Feature icons row */}
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { icon: Wallet, label: 'Net Worth Tracking', desc: 'Assets & liabilities at a glance' },
                { icon: Target, label: 'Goal Planning', desc: 'Track every financial goal' },
                { icon: Shield, label: 'Insurance Gap Analysis', desc: 'Life & health coverage gaps' },
                { icon: BadgeIndianRupee, label: 'Tax Optimization', desc: '80C, 80D & more' },
              ].map((feature) => (
                <div key={feature.label} className="flex flex-col items-center gap-2.5 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                    <feature.icon className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{feature.label}</p>
                    <p className="mt-0.5 text-xs text-blue-200/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Demo Portfolio */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => setDemoOpen(!demoOpen)}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Demo Portfolio</h3>
                <p className="text-xs text-gray-500">Sample mutual fund portfolio with mock data</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
          </button>

          {demoOpen && (
            <div className="mt-4 space-y-4">
              {/* Demo summary cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current Value</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{formatINR(MOCK_PORTFOLIO.totalValue)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Invested</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{formatINR(MOCK_PORTFOLIO.invested)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Returns</p>
                  <p className="mt-1 text-xl font-extrabold text-green-600">+{formatINR(MOCK_PORTFOLIO.returns)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">XIRR</p>
                  <p className="mt-1 text-xl font-extrabold text-yellow-600">{MOCK_PORTFOLIO.xirr}%</p>
                </div>
              </div>

              {/* Demo holdings table */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">Fund</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-400">Current</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-400">Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PORTFOLIO.holdings.map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{h.name}</p>
                          <p className="text-xs text-gray-500">{h.type}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(h.current)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${h.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {h.returns >= 0 ? '+' : ''}{h.returns}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> This is a demo portfolio with sample data. Create your financial plan to see personalized insights.
                </p>
              </div>
            </div>
          )}
        </div>

        <SEBIDisclaimer />
      </div>
    );
  }

  // ─── Plan data exists: full Financial Command Centre ───────────────────────

  return (
    <div className="min-h-screen bg-surface-100 pb-16">
      {/* ================================================================== */}
      {/* Header with Health Score                                           */}
      {/* ================================================================== */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
            {/* Left */}
            <div className="text-center lg:text-left">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-sm">
                <Activity className="w-3.5 h-3.5" /> Financial Command Centre
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                {plan?.personal?.name ? `${plan.personal.name}'s Dashboard` : 'My Financial Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-blue-200/60">
                Plan last updated {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'today'}
              </p>
            </div>
            {/* Right: Score Circle */}
            <div className="flex flex-col items-center">
              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm">
                <CircularScore score={analysis.overallScore} size={160} />
              </div>
              <span className={`mt-3 rounded-full px-4 py-1.5 text-xs font-bold ${getScoreBgClass(analysis.overallScore)}`}>
                {getScoreLabel(analysis.overallScore)}
              </span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Net Worth */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
              <div className="mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-300" />
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/70">Net Worth</p>
              </div>
              <p className="text-xl font-extrabold sm:text-2xl">{formatLakhsCrores(netWorthValue)}</p>
              <p className="text-[11px] text-blue-200/50">
                Assets {formatLakhsCrores(plan?.netWorth?.totalAssets ?? 0)} - Liabilities {formatLakhsCrores(plan?.netWorth?.totalLiabilities ?? 0)}
              </p>
            </div>
            {/* Monthly Surplus */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/70">Monthly Surplus</p>
              </div>
              <p className="text-xl font-extrabold sm:text-2xl">{formatINR(monthlySurplus)}</p>
              <p className="text-[11px] text-blue-200/50">Available for investments</p>
            </div>
            {/* Goals On Track */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
              <div className="mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-300" />
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/70">Goals On Track</p>
              </div>
              <p className="text-xl font-extrabold sm:text-2xl">
                {goalsOnTrack}<span className="text-base font-bold text-blue-200/50"> / {totalGoals}</span>
              </p>
              <p className="text-[11px] text-blue-200/50">{totalGoals - goalsOnTrack > 0 ? `${totalGoals - goalsOnTrack} need${totalGoals - goalsOnTrack === 1 ? 's' : ''} attention` : 'All goals on track'}</p>
            </div>
            {/* Pending Actions */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
              <div className="mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-300" />
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/70">Pending Actions</p>
              </div>
              <p className="text-xl font-extrabold sm:text-2xl">{pendingActions}</p>
              <p className="text-[11px] text-blue-200/50">{sortedActions.filter(a => a.priority === 'urgent').length > 0 ? `${sortedActions.filter(a => a.priority === 'urgent').length} urgent` : 'No urgent items'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Dashboard Body                                                     */}
      {/* ================================================================== */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">

        {/* ================================================================ */}
        {/* Net Worth Breakdown - Stacked Horizontal Bar                     */}
        {/* ================================================================ */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 text-base font-extrabold text-gray-900">Net Worth Breakdown</h2>
          <div className="space-y-3">
            {/* Assets bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Total Assets</span>
                <span className="font-bold text-gray-900">{formatLakhsCrores(plan?.netWorth?.totalAssets ?? 0)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, netWorthValue > 0 ? ((plan?.netWorth?.totalAssets ?? 0) / ((plan?.netWorth?.totalAssets ?? 0) + (plan?.netWorth?.totalLiabilities ?? 0) || 1)) * 100 : 100)}%`,
                  }}
                />
              </div>
            </div>
            {/* Liabilities bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Total Liabilities</span>
                <span className="font-bold text-red-600">{formatLakhsCrores(plan?.netWorth?.totalLiabilities ?? 0)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (plan?.netWorth?.totalLiabilities ?? 0) > 0 ? ((plan?.netWorth?.totalLiabilities ?? 0) / ((plan?.netWorth?.totalAssets ?? 0) + (plan?.netWorth?.totalLiabilities ?? 0) || 1)) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>
            {/* Net worth summary */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-extrabold text-gray-900">Net Worth</span>
              <span className={`text-lg font-extrabold ${netWorthValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatLakhsCrores(netWorthValue)}
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Asset Allocation - Current vs Recommended                        */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-4 text-base font-extrabold text-gray-900">Asset Allocation</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-sm font-extrabold text-gray-900">Current Allocation</h3>
              <p className="mb-4 text-xs text-gray-400">Based on your existing portfolio</p>
              {currentAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={currentAllocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                      {currentAllocationData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">No allocation data</div>
              )}
              {/* Legend */}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {currentAllocationData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-medium text-gray-600">{item.name} ({item.value.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-sm font-extrabold text-gray-900">Recommended Allocation</h3>
              <p className="mb-4 text-xs text-gray-400">Based on your risk profile & goals</p>
              {recommendedAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={recommendedAllocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                      {recommendedAllocationData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">No allocation data</div>
              )}
              {/* Legend with diff */}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {recommendedAllocationData.map((item) => {
                  const currentVal = currentAllocationData.find(c => c.name === item.name)?.value ?? 0;
                  const diff = item.value - currentVal;
                  return (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-medium text-gray-600">{item.name} ({item.value.toFixed(1)}%)</span>
                      {diff !== 0 && (
                        <span className={`text-[10px] font-bold ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Goal Progress Grid                                               */}
        {/* ================================================================ */}
        {analysis.goalFeasibility && analysis.goalFeasibility.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-extrabold text-gray-900">Goal Progress</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analysis.goalFeasibility.map((goal) => {
                const GoalIcon = GOAL_ICONS[goal.goalType] || GOAL_ICONS.custom;
                const progress = goal.inflatedTarget > 0 ? Math.min(100, Math.round((goal.currentProjection / goal.inflatedTarget) * 100)) : 0;
                return (
                  <div key={goal.goalId} className="rounded-2xl border border-gray-100 bg-white p-5">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                          <GoalIcon className="w-[18px] h-[18px] text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900">{goal.goalName}</h4>
                          <span className="text-[11px] font-medium text-gray-400">{goal.yearsRemaining} year{goal.yearsRemaining !== 1 ? 's' : ''} remaining</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${goal.isOnTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {goal.isOnTrack ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        {goal.isOnTrack ? 'On Track' : 'Needs Attention'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Projected: {formatLakhsCrores(goal.currentProjection)}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${goal.isOnTrack ? 'bg-emerald-500' : 'bg-red-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">Target: {formatLakhsCrores(goal.inflatedTarget)}</p>
                    </div>

                    {/* Required SIP */}
                    <div className="flex items-center justify-between rounded-xl bg-blue-50/50 px-3 py-2">
                      <span className="text-xs text-gray-500">Required SIP</span>
                      <span className="text-sm font-bold text-blue-600">{formatINR(goal.requiredMonthlySIP)}/mo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* Insurance Coverage Summary                                       */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-4 text-base font-extrabold text-gray-900">Insurance Coverage</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Term Life Insurance */}
            <div className={`rounded-2xl border p-6 ${analysis.termInsuranceGap > 0 ? 'border-red-100 bg-red-50/20' : 'border-gray-100 bg-white'}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${analysis.termInsuranceGap > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <Shield className={`w-5 h-5 ${analysis.termInsuranceGap > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Term Life Insurance</h3>
                  {analysis.termInsuranceGap > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle className="w-3 h-3" /> Gap: {formatLakhsCrores(analysis.termInsuranceGap)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Adequately covered</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recommended</span>
                  <span className="font-bold text-gray-900">{formatLakhsCrores(analysis.recommendedTermCover)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current</span>
                  <span className="font-bold text-gray-900">{formatLakhsCrores(analysis.recommendedTermCover - analysis.termInsuranceGap)}</span>
                </div>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${analysis.termInsuranceGap > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, analysis.recommendedTermCover > 0 ? ((analysis.recommendedTermCover - analysis.termInsuranceGap) / analysis.recommendedTermCover) * 100 : 0)}%` }}
                />
              </div>
            </div>

            {/* Health Insurance */}
            <div className={`rounded-2xl border p-6 ${analysis.healthInsuranceGap > 0 ? 'border-red-100 bg-red-50/20' : 'border-gray-100 bg-white'}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${analysis.healthInsuranceGap > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <Heart className={`w-5 h-5 ${analysis.healthInsuranceGap > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Health Insurance</h3>
                  {analysis.healthInsuranceGap > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle className="w-3 h-3" /> Gap: {formatLakhsCrores(analysis.healthInsuranceGap)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Adequately covered</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recommended</span>
                  <span className="font-bold text-gray-900">{formatLakhsCrores(analysis.recommendedHealthCover)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current</span>
                  <span className="font-bold text-gray-900">{formatLakhsCrores(analysis.recommendedHealthCover - analysis.healthInsuranceGap)}</span>
                </div>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${analysis.healthInsuranceGap > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, analysis.recommendedHealthCover > 0 ? ((analysis.recommendedHealthCover - analysis.healthInsuranceGap) / analysis.recommendedHealthCover) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Tax Savings Progress                                             */}
        {/* ================================================================ */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 text-base font-extrabold text-gray-900">Tax Savings Progress</h2>
          <div className="space-y-5">
            {/* Section 80C */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">80C</span>
                  <span className="text-sm font-semibold text-gray-700">Section 80C</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatINR(section80CUsed)} / {formatINR(section80CLimit)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (section80CUsed / section80CLimit) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {section80CUsed >= section80CLimit
                  ? 'Fully utilized'
                  : `${formatINR(section80CLimit - section80CUsed)} remaining`}
              </p>
            </div>

            {/* Section 80D */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">80D</span>
                  <span className="text-sm font-semibold text-gray-700">Section 80D</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatINR(section80DUsed)} / {formatINR(section80DLimit)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (section80DUsed / section80DLimit) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {section80DUsed >= section80DLimit
                  ? 'Fully utilized'
                  : `${formatINR(section80DLimit - section80DUsed)} remaining`}
              </p>
            </div>

            {/* Potential savings callout */}
            {analysis.potentialTaxSavings > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                <BadgeIndianRupee className="w-5 h-5 text-emerald-600" />
                <p className="text-sm">
                  <span className="font-bold text-emerald-700">Potential tax savings: {formatINR(analysis.potentialTaxSavings)}</span>
                  <span className="text-emerald-600"> with {analysis.recommendedRegime === 'old' ? 'Old' : 'New'} regime</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Action Items                                                     */}
        {/* ================================================================ */}
        {sortedActions.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-extrabold text-gray-900">Action Items</h2>
            <div className="space-y-3">
              {sortedActions.map((action) => {
                const style = PRIORITY_STYLES[action.priority];
                return (
                  <div key={action.id} className="rounded-2xl border border-gray-100 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900">{action.title}</h4>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-500">{action.description}</p>
                        {action.impact && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <TrendingUp className="w-3 h-3" /> {action.impact}
                          </p>
                        )}
                      </div>
                      {action.cta && (
                        <Link
                          href={action.cta.href}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          {action.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* Quick Actions                                                    */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-4 text-base font-extrabold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Start SIP', href: '/mutual-funds', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Get Insurance', href: '/insurance', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Book Advisor', href: '/contact', icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Update Plan', href: '/ai-planner', icon: Sparkles, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-5 text-center transition hover:border-gray-200 hover:shadow-sm"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-bold text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* SEBI Disclaimer */}
      <div className="mt-12">
        <SEBIDisclaimer />
      </div>
    </div>
  );
}
