'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, IndianRupee, BarChart3, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine,
} from 'recharts';
import { calculateStepUpSIP, calculateSIP, calculateSIPBreakdown, calculateStepUpSIPWithGrowth } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  regular: '#0F766E',
  stepUp: '#D4A017',
  invested: '#64748B',
  returns: '#E8553A',
  growth: '#D97706',
};

export default function StepUpSIPCalculatorPage() {
  const [initialMonthly, setInitialMonthly] = useState(10000);
  const [stepUpPercent, setStepUpPercent] = useState(10);
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
  const stepUpResult = useMemo(
    () => calculateStepUpSIP(initialMonthly, stepUpPercent, returnRate, years),
    [initialMonthly, stepUpPercent, returnRate, years]
  );

  const regularResult = useMemo(
    () => calculateSIP(initialMonthly, returnRate, years),
    [initialMonthly, returnRate, years]
  );

  const regularBreakdown = useMemo(
    () => calculateSIPBreakdown(initialMonthly, returnRate, years),
    [initialMonthly, returnRate, years]
  );

  // Hybrid mode calculations
  const hybridStepUpResult = useMemo(
    () => calculateStepUpSIPWithGrowth(initialMonthly, stepUpPercent, returnRate, sipYears, totalYears),
    [initialMonthly, stepUpPercent, returnRate, sipYears, totalYears]
  );

  const hybridRegularResult = useMemo(
    () => calculateSIP(initialMonthly, returnRate, hybridEnabled ? sipYears : years),
    [initialMonthly, returnRate, sipYears, years, hybridEnabled]
  );

  // Choose which data to show based on hybrid mode
  const activeStepUp = hybridEnabled ? hybridStepUpResult : stepUpResult;
  const activeRegular = hybridEnabled ? hybridRegularResult : regularResult;
  const activeBreakdown = hybridEnabled ? hybridStepUpResult.growthBreakdown : stepUpResult.yearlyBreakdown.map((r) => ({ ...r, phase: 'SIP' as const }));
  const activeRegularBreakdown = hybridEnabled
    ? regularBreakdown.slice(0, sipYears)
    : regularBreakdown;

  const chartData = activeBreakdown.map((row, i) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    stepUpValue: row.value,
    regularValue: activeRegularBreakdown[i]?.value || (i > 0 ? activeRegularBreakdown[activeRegularBreakdown.length - 1]?.value : 0) || 0,
    stepUpInvested: row.invested,
    regularInvested: activeRegularBreakdown[i]?.invested || activeRegularBreakdown[activeRegularBreakdown.length - 1]?.invested || 0,
    phase: 'phase' in row ? (row as { phase: string }).phase : 'SIP',
  }));

  const comparisonData = [
    {
      metric: 'Total Invested',
      regular: activeRegular.totalInvested,
      stepUp: activeStepUp.totalInvested,
    },
    {
      metric: 'Portfolio Value',
      regular: activeRegular.totalValue,
      stepUp: activeStepUp.totalValue,
    },
    {
      metric: 'Returns',
      regular: activeRegular.estimatedReturns,
      stepUp: activeStepUp.estimatedReturns,
    },
  ];

  const extraWealth = activeStepUp.totalValue - activeRegular.totalValue;
  const extraPercent = activeRegular.totalValue > 0
    ? ((extraWealth / activeRegular.totalValue) * 100).toFixed(0)
    : '0';

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
              <TrendingUp className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Step-Up SIP Calculator</h1>
              <p className="text-slate-300 mt-1">See how increasing your SIP annually creates significantly more wealth</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Step-Up SIP</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                {/* Initial Monthly */}
                <NumberInput label="Starting Monthly SIP" value={initialMonthly} onChange={setInitialMonthly} prefix="₹" step={500} min={500} max={500000} />

                {/* Annual Step-Up */}
                <NumberInput label="Annual Step-Up" value={stepUpPercent} onChange={setStepUpPercent} suffix="%" step={1} min={1} max={50} />

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

              {/* Comparison Summary */}
              <div className="mt-8 space-y-4">
                <div className="bg-gradient-to-r from-amber-50 to-secondary-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Step-Up SIP Value</div>
                  <div className="text-2xl font-extrabold text-secondary-700">{formatINR(activeStepUp.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">Invested: {formatINR(activeStepUp.totalInvested)}</div>
                </div>

                <div className="bg-surface-100 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Regular SIP Value</div>
                  <div className="text-xl font-bold text-primary-700">{formatINR(activeRegular.totalValue)}</div>
                  <div className="text-xs text-slate-500 mt-1">Invested: {formatINR(activeRegular.totalInvested)}</div>
                </div>

                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Extra Wealth with Step-Up</div>
                  <div className="text-xl font-extrabold text-positive">{formatINR(extraWealth)}</div>
                  <div className="text-xs text-teal-600 font-medium mt-1">{extraPercent}% more than regular SIP</div>
                </div>

                {hybridEnabled && totalYears > sipYears && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-amber-700 uppercase tracking-wider font-medium">Growth Phase Gains</div>
                    <div className="text-lg font-extrabold text-amber-700">
                      {formatINR(
                        (hybridStepUpResult.growthBreakdown.find((b) => b.year === totalYears)?.value ?? 0) -
                        (hybridStepUpResult.growthBreakdown.find((b) => b.year === sipYears)?.value ?? 0)
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
                <DownloadPDFButton elementId="calculator-results" title="Step-Up SIP Calculator" fileName="step-up-sip-calculator" />
              </div>

              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} Step-Up SIP Plan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? `Age ${investorAge} \u2192 ${investorAge + (hybridEnabled ? totalYears : years)}`
                      : `${hybridEnabled ? totalYears : years} year investment journey`
                    }
                  </p>
                </div>
              )}

              {/* Comparison Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  {hybridEnabled ? 'Step-Up SIP Growth with Compounding' : 'Step-Up vs Regular SIP Growth'}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {hybridEnabled
                    ? `Step-Up SIP for ${sipYears} years, then compounding for ${totalYears - sipYears} more years`
                    : 'How annual increases compound your portfolio'}
                </p>

                {hybridEnabled && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#D4A017]" />
                      <span className="text-xs text-slate-600">Step-Up SIP Value</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#64748B]" />
                      <span className="text-xs text-slate-600">Amount Invested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-[#D97706] border-dashed border border-amber-600" />
                      <span className="text-xs text-slate-600">SIP Ends</span>
                    </div>
                  </div>
                )}

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradStepUp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.stepUp} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.stepUp} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRegular" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.regular} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.regular} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradStepGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="gradInvestedStep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            stepUpValue: 'Step-Up SIP Value',
                            regularValue: 'Regular SIP Value',
                            stepUpInvested: 'Amount Invested',
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
                      <Area type="monotone" dataKey="stepUpInvested" stroke={COLORS.invested} fill="url(#gradInvestedStep)" strokeWidth={2} name="stepUpInvested" />
                      {hybridEnabled ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="stepUpValue"
                            stroke={COLORS.stepUp}
                            fill="url(#gradStepGrowth)"
                            strokeWidth={2.5}
                            name="stepUpValue"
                            dot={(props: Record<string, unknown>) => {
                              const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                              if (index === sipYears - 1) {
                                return (
                                  <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={COLORS.growth} stroke="#fff" strokeWidth={2} />
                                );
                              }
                              return <circle key={`dot-${index}`} cx={0} cy={0} r={0} fill="none" />;
                            }}
                          />
                          {sipYears < totalYears && (
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
                        </>
                      ) : (
                        <>
                          <Area type="monotone" dataKey="regularValue" stroke={COLORS.regular} fill="url(#gradRegular)" strokeWidth={2} name="Regular SIP" />
                          <Area type="monotone" dataKey="stepUpValue" stroke={COLORS.stepUp} fill="url(#gradStepUp)" strokeWidth={2} name="Step-Up SIP" />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Comparison */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Side-by-Side Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Regular SIP vs Step-Up SIP metrics</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="regular" name="Regular SIP" fill={COLORS.regular} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="stepUp" name="Step-Up SIP" fill={COLORS.stepUp} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {hybridEnabled ? 'Monthly SIP increases each year during SIP phase, then corpus compounds' : 'Monthly SIP amount increases each year'}
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
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly SIP</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Total Invested</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Step-Up Value</th>
                        {!hybridEnabled && (
                          <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Regular Value</th>
                        )}
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          {hybridEnabled ? 'Growth' : 'Extra Gains'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBreakdown.map((row, i) => {
                        const phase = 'phase' in row ? (row as { phase: string }).phase : 'SIP';
                        const regValue = activeRegularBreakdown[i]?.value || 0;
                        const diff = hybridEnabled ? row.returns : row.value - regValue;
                        return (
                          <tr
                            key={row.year}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              hybridEnabled && phase === 'Growth' && 'bg-amber-50/30'
                            )}
                          >
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">Year {row.year}</td>
                            {hybridEnabled && (
                              <td className="py-3 px-2 sm:px-3">
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                                    phase === 'SIP'
                                      ? 'bg-brand-50 text-brand'
                                      : 'bg-amber-50 text-amber-700'
                                  )}
                                >
                                  {phase}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">
                              {row.monthlyAmount > 0 ? formatINR(row.monthlyAmount) : <span className="text-amber-600 text-xs font-medium">--</span>}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right font-semibold text-secondary-700">{formatINR(row.value)}</td>
                            {!hybridEnabled && (
                              <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(regValue)}</td>
                            )}
                            <td className="py-3 px-2 sm:px-3 text-right">
                              {hybridEnabled ? (
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  row.growthPercent > 100 ? 'bg-teal-50 text-teal-700' :
                                  row.growthPercent > 50 ? 'bg-brand-50 text-brand-700' :
                                  'bg-slate-100 text-slate-600'
                                )}>
                                  {row.growthPercent}%
                                </span>
                              ) : (
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  diff > 0 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                                )}>
                                  +{formatINR(diff)}
                                </span>
                              )}
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
