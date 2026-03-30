'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, IndianRupee, Users, Briefcase, Home, Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

/* ─── Constants ─── */

const COLORS = {
  rent: '#2563EB',
  groceries: '#0F766E',
  utilities: '#7C3AED',
  insurance: '#E8553A',
  other: '#D97706',
  savings: '#059669',
  gap: '#DC2626',
};

const PIE_COLORS = [COLORS.rent, COLORS.groceries, COLORS.utilities, COLORS.insurance, COLORS.other];

type JobStability = 'govt' | 'corporate' | 'startup' | 'freelance';

const JOB_STABILITY_OPTIONS: { key: JobStability; label: string; months: number }[] = [
  { key: 'govt', label: 'Govt/Stable', months: 3 },
  { key: 'corporate', label: 'Corporate', months: 6 },
  { key: 'startup', label: 'Startup', months: 9 },
  { key: 'freelance', label: 'Freelance/Business', months: 12 },
];

const DEPENDENT_OPTIONS = [0, 1, 2, 3, 4, 5];

/* ─── Component ─── */

export default function EmergencyFundCalculatorPage() {
  const [rent, setRent] = useState(25000);
  const [groceries, setGroceries] = useState(15000);
  const [utilities, setUtilities] = useState(5000);
  const [insurancePremiums, setInsurancePremiums] = useState(3000);
  const [otherExpenses, setOtherExpenses] = useState(10000);
  const [dependents, setDependents] = useState(2);
  const [jobStability, setJobStability] = useState<JobStability>('corporate');
  const [existingSavings, setExistingSavings] = useState(100000);
  const [monthlySavingsCapacity, setMonthlySavingsCapacity] = useState(15000);

  const result = useMemo(() => {
    const totalMonthlyExpenses = rent + groceries + utilities + insurancePremiums + otherExpenses;

    // Recommended months based on job stability
    const jobOption = JOB_STABILITY_OPTIONS.find((j) => j.key === jobStability)!;
    let recommendedMonths = jobOption.months;

    // Add 1 month per dependent beyond 1
    if (dependents > 1) {
      recommendedMonths += dependents - 1;
    }

    const recommendedFund = totalMonthlyExpenses * recommendedMonths;
    const gap = Math.max(0, recommendedFund - existingSavings);
    const monthsToBuild = monthlySavingsCapacity > 0 ? Math.ceil(gap / monthlySavingsCapacity) : 0;
    const adequacyPercent = recommendedFund > 0 ? (existingSavings / recommendedFund) * 100 : 0;

    // Savings timeline (month-by-month until gap is filled, max 36 rows)
    const savingsTimeline: {
      month: number;
      monthlySaving: number;
      cumulative: number;
      remainingGap: number;
    }[] = [];

    if (gap > 0 && monthlySavingsCapacity > 0) {
      let cumulative = 0;
      const maxRows = Math.min(monthsToBuild, 36);
      for (let m = 1; m <= maxRows; m++) {
        cumulative += monthlySavingsCapacity;
        const remaining = Math.max(0, gap - cumulative);
        savingsTimeline.push({
          month: m,
          monthlySaving: monthlySavingsCapacity,
          cumulative: Math.min(cumulative, gap),
          remainingGap: remaining,
        });
      }
    }

    // Expense breakdown for pie chart
    const expenseBreakdown = [
      { name: 'Rent/EMI', value: rent, color: COLORS.rent },
      { name: 'Groceries', value: groceries, color: COLORS.groceries },
      { name: 'Utilities', value: utilities, color: COLORS.utilities },
      { name: 'Insurance', value: insurancePremiums, color: COLORS.insurance },
      { name: 'Other', value: otherExpenses, color: COLORS.other },
    ].filter((item) => item.value > 0);

    // Bar chart: current savings vs recommended
    const comparisonData = [
      { name: 'Current Savings', value: existingSavings, fill: COLORS.savings },
      { name: 'Recommended Fund', value: recommendedFund, fill: COLORS.rent },
    ];

    return {
      totalMonthlyExpenses,
      recommendedMonths,
      recommendedFund,
      gap,
      monthsToBuild,
      adequacyPercent,
      savingsTimeline,
      expenseBreakdown,
      comparisonData,
    };
  }, [rent, groceries, utilities, insurancePremiums, otherExpenses, dependents, jobStability, existingSavings, monthlySavingsCapacity]);

  const adequacyStatus = result.adequacyPercent >= 100
    ? { label: 'Fully Funded', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> }
    : result.adequacyPercent >= 50
      ? { label: 'Partially Funded', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> }
      : { label: 'Under-Funded', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> };

  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/calculators" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Emergency Fund Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate your ideal emergency fund based on expenses, dependents, and job stability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ─── Input Panel (Sticky Left) ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Your Expenses</h2>

              <div className="space-y-5">
                <NumberInput label="Monthly Rent / EMI" value={rent} onChange={setRent} prefix="₹" step={1000} min={0} max={500000} />
                <NumberInput label="Groceries & Essentials" value={groceries} onChange={setGroceries} prefix="₹" step={1000} min={0} max={200000} />
                <NumberInput label="Utilities & Bills" value={utilities} onChange={setUtilities} prefix="₹" step={500} min={0} max={50000} />
                <NumberInput label="Insurance Premiums" value={insurancePremiums} onChange={setInsurancePremiums} prefix="₹" step={500} min={0} max={50000} />
                <NumberInput label="Other Monthly Expenses" value={otherExpenses} onChange={setOtherExpenses} prefix="₹" step={1000} min={0} max={200000} />
              </div>

              {/* Number of Dependents */}
              <div className="mt-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Number of Dependents</label>
                <div className="grid grid-cols-6 gap-2">
                  {DEPENDENT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDependents(num)}
                      className={cn(
                        'text-center py-2 rounded-lg border transition-colors text-[11px] font-semibold',
                        dependents === num
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                      )}
                    >
                      {num === 5 ? '5+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Stability */}
              <div className="mt-5">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Job Stability</label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_STABILITY_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setJobStability(option.key)}
                      className={cn(
                        'text-center py-2 px-1 rounded-lg border transition-colors',
                        jobStability === option.key
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                      )}
                    >
                      <span className="block text-[10px] font-semibold">{option.label}</span>
                      <span className="block text-[9px] opacity-75">{option.months} months</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <NumberInput label="Existing Emergency Savings" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={10000} min={0} max={10000000} />
                <NumberInput label="Monthly Savings Capacity" value={monthlySavingsCapacity} onChange={setMonthlySavingsCapacity} prefix="₹" step={1000} min={0} max={500000} />
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                {/* Total Monthly Expenses - Big Gradient Card */}
                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Monthly Expenses</span>
                  </div>
                  <div className="text-2xl font-extrabold gradient-text">{formatINR(result.totalMonthlyExpenses)}</div>
                </div>

                {/* Recommended Fund */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Recommended Fund</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-700">{formatINR(result.recommendedFund)}</span>
                    <span className="block text-[9px] text-slate-400">{result.recommendedMonths} months</span>
                  </div>
                </div>

                {/* Current Savings */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Current Savings</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{formatINR(existingSavings)}</span>
                </div>

                {/* Gap to Fill */}
                {result.gap > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-[11px] text-slate-500 font-medium">Gap to Fill</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatINR(result.gap)}</span>
                  </div>
                )}

                {/* Months to Build */}
                {result.gap > 0 && monthlySavingsCapacity > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span className="text-[11px] text-slate-500 font-medium">Months to Build</span>
                    </div>
                    <span className="text-sm font-bold text-purple-700">{result.monthsToBuild} months</span>
                  </div>
                )}

                {/* Adequacy Status Badge */}
                <div className={cn('flex items-center justify-between p-3 rounded-lg border', adequacyStatus.bg, adequacyStatus.border)}>
                  <div className="flex items-center gap-2">
                    {adequacyStatus.icon}
                    <span className="text-[11px] text-slate-500 font-medium">Adequacy Status</span>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-sm font-bold', adequacyStatus.color)}>{adequacyStatus.label}</span>
                    <span className="block text-[9px] text-slate-400">{result.adequacyPercent.toFixed(0)}% funded</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Charts & Results (Right Panel) ─── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Emergency Fund Calculator" fileName="emergency-fund-calculator" />
              </div>

              {/* Expense Breakdown Pie Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Monthly Expense Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">How your monthly expenses are distributed across categories</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={result.expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {result.expenseBreakdown.map((entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Monthly']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Current Savings vs Recommended Fund Bar Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Current Savings vs Recommended Fund</h3>
                <p className="text-sm text-slate-500 mb-6">How your existing savings compare to the recommended emergency fund</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} width={140} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Amount']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36}>
                        {result.comparisonData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Adequacy Progress Indicator */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Emergency Fund Adequacy</h3>
                <p className="text-sm text-slate-500 mb-6">Visual gauge showing how close you are to your recommended emergency fund</p>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full h-8 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          result.adequacyPercent >= 100 ? 'bg-emerald-500' : result.adequacyPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(100, result.adequacyPercent)}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {result.adequacyPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Scale markers */}
                  <div className="flex justify-between text-[10px] text-slate-400 px-1">
                    <span>0%</span>
                    <span className="text-red-400">Under-Funded</span>
                    <span className="text-amber-500">50%</span>
                    <span className="text-amber-400">Partially Funded</span>
                    <span className="text-emerald-500">100%</span>
                  </div>

                  {/* Summary Row */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border', adequacyStatus.bg, adequacyStatus.border, adequacyStatus.color)}>
                      {adequacyStatus.icon}
                      {adequacyStatus.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Timeline Table */}
              {result.savingsTimeline.length > 0 && (
                <div className="card-base overflow-hidden">
                  <div className="p-6 pb-0">
                    <h3 className="font-bold text-primary-700 mb-1">Savings Plan Timeline</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Month-by-month plan to build your emergency fund with {formatINR(monthlySavingsCapacity)}/month savings
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-300 bg-surface-100">
                          <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Month</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly Saving</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cumulative</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Remaining Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.savingsTimeline.map((row) => (
                          <tr key={row.month} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">Month {row.month}</td>
                            <td className="py-3 px-6 text-right text-emerald-600 font-medium">{formatINR(row.monthlySaving)}</td>
                            <td className="py-3 px-6 text-right font-medium text-blue-600">{formatINR(row.cumulative)}</td>
                            <td className="py-3 px-6 text-right font-semibold">
                              {row.remainingGap > 0 ? (
                                <span className="text-red-500">{formatINR(row.remainingGap)}</span>
                              ) : (
                                <span className="text-emerald-600 flex items-center justify-end gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Done
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              <div className="card-base p-6 border-l-4 border-l-blue-400" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-primary-700 mb-2">Why Emergency Funds Matter</h4>
                    <div className="space-y-3">
                      {[
                        {
                          icon: <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />,
                          title: 'Protection Against Job Loss',
                          desc: `With ${result.recommendedMonths} months of expenses saved, you can handle unexpected unemployment without financial stress.`,
                        },
                        {
                          icon: <Users className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />,
                          title: 'Family Security',
                          desc: dependents > 0
                            ? `With ${dependents} dependent${dependents > 1 ? 's' : ''}, having a robust emergency fund ensures your family is protected against unforeseen expenses.`
                            : 'Even without dependents, an emergency fund prevents you from dipping into long-term investments during crises.',
                        },
                        {
                          icon: <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />,
                          title: 'Avoid Debt Traps',
                          desc: 'Without an emergency fund, unexpected expenses often lead to high-interest personal loans or credit card debt.',
                        },
                      ].map((tip) => (
                        <div key={tip.title} className="flex gap-3">
                          {tip.icon}
                          <div>
                            <p className="text-sm font-semibold text-primary-700">{tip.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.general}
          </p>
        </div>
      </section>
    </>
  );
}
