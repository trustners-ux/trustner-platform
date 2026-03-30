'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, TrendingUp, IndianRupee, Calendar, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine,
} from 'recharts';
import { calculateSIP, calculateSIPBreakdown, calculateSIPWithGrowth } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  invested: '#0F766E',
  returns: '#E8553A',
  value: '#D4A017',
  growth: '#D97706',
};

export default function SIPCalculatorPage() {
  const [monthly, setMonthly] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(20);
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  // Hybrid mode state
  const [hybridEnabled, setHybridEnabled] = useState(false);
  const [sipYears, setSipYears] = useState(10);
  const [totalYears, setTotalYears] = useState(20);

  // Ensure totalYears is always >= sipYears
  const handleSipYearsChange = (val: number) => {
    setSipYears(val);
    if (totalYears < val) {
      setTotalYears(val);
    }
  };

  const handleTotalYearsChange = (val: number) => {
    setTotalYears(Math.max(val, sipYears));
  };

  // Standard mode calculations
  const standardResult = useMemo(() => calculateSIP(monthly, returnRate, years), [monthly, returnRate, years]);
  const standardBreakdown = useMemo(() => calculateSIPBreakdown(monthly, returnRate, years), [monthly, returnRate, years]);

  // Hybrid mode calculations
  const hybridData = useMemo(
    () => calculateSIPWithGrowth(monthly, returnRate, sipYears, totalYears),
    [monthly, returnRate, sipYears, totalYears]
  );

  const result = hybridEnabled ? hybridData.result : standardResult;
  const breakdown = hybridEnabled ? hybridData.breakdown : standardBreakdown.map((r) => ({ ...r, phase: 'SIP' as const }));

  const chartData = breakdown.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    invested: row.invested,
    value: row.value,
    returns: row.returns,
    phase: row.phase,
  }));

  const pieData = [
    { name: 'Total Invested', value: result.totalInvested, color: COLORS.invested },
    { name: 'Estimated Returns', value: result.estimatedReturns, color: COLORS.returns },
  ];

  const wealthMultiplier = result.totalInvested > 0 ? (result.totalValue / result.totalInvested).toFixed(1) : '0';

  const effectiveYears = hybridEnabled ? totalYears : years;

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
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">SIP Future Value Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate how your monthly SIP grows with the power of compounding over time</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Your SIP</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                {/* Monthly Amount */}
                <NumberInput label="Monthly Investment" value={monthly} onChange={setMonthly} prefix="₹" step={500} min={500} max={500000} />

                {/* Return Rate */}
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />

                {/* Hybrid Mode Toggle */}
                <div className="border border-surface-300 rounded-xl p-4 bg-surface-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-slate-700">Growth Period (Hybrid)</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hybridEnabled}
                      onClick={() => setHybridEnabled(!hybridEnabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                        hybridEnabled ? 'bg-amber-500' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                          hybridEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Continue compounding after SIP stops
                  </p>

                  {hybridEnabled && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-surface-300">
                      {/* SIP Duration */}
                      <NumberInput label="SIP Duration" value={sipYears} onChange={handleSipYearsChange} suffix="Years" step={1} min={1} max={30} />

                      {/* Total Duration */}
                      <NumberInput label="Total Duration" value={totalYears} onChange={handleTotalYearsChange} suffix="Years" step={1} min={sipYears} max={40} />

                      <div className="flex gap-2">
                        <div className="flex-1 bg-brand-50 rounded-lg px-3 py-2 text-center">
                          <div className="text-[10px] text-brand font-medium uppercase">SIP Phase</div>
                          <div className="text-sm font-bold text-brand">{sipYears} Yrs</div>
                        </div>
                        <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
                          <div className="text-[10px] text-amber-700 font-medium uppercase">Growth Phase</div>
                          <div className="text-sm font-bold text-amber-700">{totalYears - sipYears} Yrs</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Standard Duration (only when hybrid is OFF) */}
                {!hybridEnabled && (
                  <NumberInput label="Investment Duration" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />
                )}
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-brand" />
                    <span className="text-sm text-slate-600">Total Invested</span>
                  </div>
                  <span className="font-bold text-primary-700">{formatINR(result.totalInvested)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-positive" />
                    <span className="text-sm text-slate-600">Estimated Returns</span>
                  </div>
                  <span className="font-bold text-positive">{formatINR(result.estimatedReturns)}</span>
                </div>

                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Value</div>
                  <div className="text-2xl font-extrabold gradient-text">{formatINR(result.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {investorName ? `${investorName}\u2019s` : 'Your'} money grows <span className="font-semibold text-brand">{wealthMultiplier}x</span>{investorAge !== null ? ` by age ${investorAge + effectiveYears}` : ` in ${effectiveYears} years`}
                  </div>
                </div>

                {hybridEnabled && totalYears > sipYears && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">Growth Phase Gains</div>
                    <div className="text-lg font-extrabold text-amber-700">
                      {formatINR(
                        (hybridData.breakdown.find((b) => b.year === totalYears)?.value ?? 0) -
                        (hybridData.breakdown.find((b) => b.year === sipYears)?.value ?? 0)
                      )}
                    </div>
                    <div className="text-[11px] text-amber-600 mt-1">
                      Extra wealth from {totalYears - sipYears} years of compounding without investing more
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* PDF Download Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="SIP Future Value Calculator" fileName="sip-calculator" />
              </div>

              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-teal-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} SIP Wealth Journey
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? `Age ${investorAge} \u2192 ${investorAge + effectiveYears} \u00b7 ${effectiveYears} years`
                      : `${effectiveYears} year investment journey`
                    }
                  </p>
                </div>
              )}

              {/* Growth Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Growth Over Time</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {hybridEnabled
                    ? `SIP for ${sipYears} years, then compounding for ${totalYears - sipYears} more years`
                    : 'Investment vs portfolio value year by year'}
                </p>

                {hybridEnabled && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#E8553A]" />
                      <span className="text-xs text-slate-600">SIP Phase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#D97706]" />
                      <span className="text-xs text-slate-600">Growth Phase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#0F766E]" />
                      <span className="text-xs text-slate-600">Invested</span>
                    </div>
                  </div>
                )}

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.returns} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.returns} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            invested: 'Amount Invested',
                            value: 'Portfolio Value',
                          };
                          return [formatINR(value), labels[name] || name];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelFormatter={(label) => {
                          if (!hybridEnabled) return label;
                          const item = chartData.find((d) => d.year === label);
                          return item ? `${label} — ${item.phase} Phase` : label;
                        }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="url(#gradInvested)" strokeWidth={2} name="invested" />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={hybridEnabled ? COLORS.returns : COLORS.returns}
                        fill={hybridEnabled ? 'url(#gradGrowth)' : 'url(#gradValue)'}
                        strokeWidth={2.5}
                        name="value"
                        dot={hybridEnabled ? (props: Record<string, unknown>) => {
                          const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                          if (index === sipYears - 1) {
                            return (
                              <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={COLORS.growth} stroke="#fff" strokeWidth={2} />
                            );
                          }
                          return <circle key={`dot-${index}`} cx={0} cy={0} r={0} fill="none" />;
                        } : false}
                      />
                      {hybridEnabled && sipYears < totalYears && (
                        <ReferenceLine
                          x={investorAge !== null ? `Age ${investorAge + sipYears}` : `Yr ${sipYears}`}
                          stroke={COLORS.growth}
                          strokeDasharray="6 3"
                          strokeWidth={2}
                          label={{
                            value: `\u2190 SIP Phase | Growth Phase \u2192`,
                            position: 'top',
                            fontSize: 10,
                            fill: COLORS.growth,
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Investment Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">Your money vs returns earned</p>
                <div className="h-72 flex items-center justify-center">
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

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {hybridEnabled ? 'Detailed breakdown showing SIP and growth phases' : 'Detailed investment growth trajectory'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        {hybridEnabled && (
                          <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Phase</th>
                        )}
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Value</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Returns</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((row) => (
                        <tr
                          key={row.year}
                          className={cn(
                            'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                            hybridEnabled && row.phase === 'Growth' && 'bg-amber-50/30'
                          )}
                        >
                          <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">Year {row.year}</td>
                          {hybridEnabled && (
                            <td className="py-3 px-2 sm:px-3">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                                  row.phase === 'SIP'
                                    ? 'bg-brand-50 text-brand'
                                    : 'bg-amber-50 text-amber-700'
                                )}
                              >
                                {row.phase}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.invested)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right font-semibold text-primary-700">{formatINR(row.value)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right text-positive font-medium">{formatINR(row.returns)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              row.growthPercent > 100 ? 'bg-teal-50 text-teal-700' :
                              row.growthPercent > 50 ? 'bg-brand-50 text-brand-700' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              {row.growthPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
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
