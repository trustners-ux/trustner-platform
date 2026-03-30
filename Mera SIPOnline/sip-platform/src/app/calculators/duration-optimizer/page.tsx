'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, Target, CalendarCheck, IndianRupee, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { optimizeSIPDuration, calculateSIPBreakdown } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  invested: '#0F766E',
  value: '#E8553A',
  target: '#D4A017',
};

export default function DurationOptimizerPage() {
  const [monthly, setMonthly] = useState(10000);
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [returnRate, setReturnRate] = useState(12);

  const result = useMemo(
    () => optimizeSIPDuration(monthly, targetAmount, returnRate),
    [monthly, targetAmount, returnRate]
  );

  const totalMonths = result.years * 12 + result.months;
  const displayDuration = result.months > 0
    ? `${result.years} Years ${result.months} Months`
    : `${result.years} Years`;

  // Generate breakdown for full years for charting
  const breakdownYears = Math.max(result.years + (result.months > 0 ? 1 : 0), 1);
  const breakdown = useMemo(
    () => calculateSIPBreakdown(monthly, returnRate, breakdownYears),
    [monthly, returnRate, breakdownYears]
  );

  const chartData = breakdown.map((row) => ({
    year: `Yr ${row.year}`,
    invested: row.invested,
    value: row.value,
    target: targetAmount,
  }));

  const pieData = [
    { name: 'Your Investment', value: result.totalInvested, color: COLORS.invested },
    { name: 'Market Returns', value: result.totalValue - result.totalInvested, color: COLORS.value },
  ];

  // Sensitivity analysis: how does changing return affect duration
  const sensitivityData = useMemo(() => {
    const rates = [8, 10, 12, 14, 16];
    return rates.map((rate) => {
      const opt = optimizeSIPDuration(monthly, targetAmount, rate);
      return {
        rate: `${rate}%`,
        years: opt.years + opt.months / 12,
        totalInvested: opt.totalInvested,
        displayYears: opt.years,
        displayMonths: opt.months,
      };
    });
  }, [monthly, targetAmount]);

  // Sensitivity: how does changing monthly amount affect duration
  const amountSensitivity = useMemo(() => {
    const amounts = [5000, 10000, 15000, 20000, 25000, 50000];
    return amounts.map((amt) => {
      const opt = optimizeSIPDuration(amt, targetAmount, returnRate);
      return {
        amount: formatINR(amt),
        years: opt.years + opt.months / 12,
        displayYears: opt.years,
        displayMonths: opt.months,
      };
    });
  }, [targetAmount, returnRate]);

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
              <Clock className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">SIP Duration Optimizer</h1>
              <p className="text-slate-300 mt-1">Find out exactly how long it takes to reach your target amount with a given SIP</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Set Your Parameters</h2>

              <div className="space-y-6">
                <NumberInput label="Monthly SIP Amount" value={monthly} onChange={setMonthly} prefix="₹" step={500} min={500} max={500000} />
                <NumberInput label="Target Amount" value={targetAmount} onChange={setTargetAmount} prefix="₹" step={50000} min={100000} max={100000000} />
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />
              </div>

              {/* Result */}
              <div className="mt-8 space-y-3">
                <div className="bg-gradient-to-r from-teal-50 to-teal-50/50 rounded-xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CalendarCheck className="w-5 h-5 text-teal-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Time to Reach Goal</span>
                  </div>
                  <div className="text-3xl font-extrabold text-teal-700">{displayDuration}</div>
                  <div className="text-xs text-slate-500 mt-2">{totalMonths} total months</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Invested</div>
                    <div className="text-sm font-bold text-primary-700">{formatINR(result.totalInvested)}</div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Value</div>
                    <div className="text-sm font-bold text-positive">{formatINR(result.totalValue)}</div>
                  </div>
                </div>

                <div className="bg-surface-100 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Wealth Multiplier</div>
                  <div className="text-lg font-bold text-brand">
                    {result.totalInvested > 0 ? (result.totalValue / result.totalInvested).toFixed(1) : '0'}x
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* Growth Chart */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">Growth Towards Target</h3>
                  <DownloadPDFButton elementId="calculator-results" title="SIP Duration Optimizer" fileName="duration-optimizer" />
                </div>
                <p className="text-sm text-slate-500 mb-6">Your portfolio value approaching the target of {formatINR(targetAmount)}</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="durGradInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="durGradValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.value} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.value} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'invested' ? 'Invested' : name === 'value' ? 'Portfolio Value' : 'Target',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="target" stroke={COLORS.target} fill="none" strokeWidth={1.5} strokeDasharray="8 4" name="Target" />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="url(#durGradInvested)" strokeWidth={2} name="Invested" />
                      <Area type="monotone" dataKey="value" stroke={COLORS.value} fill="url(#durGradValue)" strokeWidth={2} name="Portfolio Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Investment Composition</h3>
                <p className="text-sm text-slate-500 mb-6">Your money vs compounding returns</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sensitivity Analysis */}
              <div className="grid sm:grid-cols-2 gap-6" data-pdf-keep-together>
                <div className="card-base p-6">
                  <h3 className="font-bold text-primary-700 mb-1 text-sm">By Return Rate</h3>
                  <p className="text-xs text-slate-500 mb-4">How return rate affects duration at {formatINR(monthly)}/month</p>
                  <div className="space-y-2">
                    {sensitivityData.map((item) => (
                      <div key={item.rate} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100">
                        <span className="text-sm font-medium text-slate-600">{item.rate} return</span>
                        <span className="text-sm font-bold text-primary-700">
                          {item.displayYears}y {item.displayMonths}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-bold text-primary-700 mb-1 text-sm">By SIP Amount</h3>
                  <p className="text-xs text-slate-500 mb-4">How SIP amount affects duration at {returnRate}% return</p>
                  <div className="space-y-2">
                    {amountSensitivity.map((item) => (
                      <div key={item.amount} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100">
                        <span className="text-sm font-medium text-slate-600">{item.amount}/mo</span>
                        <span className="text-sm font-bold text-primary-700">
                          {item.displayYears}y {item.displayMonths}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Progress</h3>
                  <p className="text-sm text-slate-500 mb-4">How your portfolio approaches the target each year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Value</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Returns</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">% of Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((row) => {
                        const pct = targetAmount > 0 ? Math.round((row.value / targetAmount) * 100) : 0;
                        const reachedTarget = row.value >= targetAmount;
                        return (
                          <tr key={row.year} className={cn(
                            'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                            reachedTarget && 'bg-teal-50/50'
                          )}>
                            <td className="py-3 px-6 font-medium text-primary-700">
                              Year {row.year} {reachedTarget && <span className="text-positive text-xs ml-1">Target reached</span>}
                            </td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-primary-700">{formatINR(row.value)}</td>
                            <td className="py-3 px-6 text-right text-positive font-medium">{formatINR(row.returns)}</td>
                            <td className="py-3 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', reachedTarget ? 'bg-positive' : 'bg-brand')}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-600 w-12 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
