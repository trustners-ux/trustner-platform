'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Target, ArrowLeft, IndianRupee, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { calculateGoalSIP, calculateGoalSIPWithStepUp, calculateSIPBreakdown, calculateScenarios } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  invested: '#0F766E',
  returns: '#E8553A',
  conservative: '#D4A017',
  moderate: '#0F766E',
  aggressive: '#D4A017',
};

const goalPresets = [
  { label: 'Emergency Fund', value: 500000 },
  { label: 'Car Purchase', value: 1000000 },
  { label: 'Home Down Payment', value: 2500000 },
  { label: 'Child Education', value: 5000000 },
  { label: 'Retirement Corpus', value: 10000000 },
  { label: 'Financial Freedom', value: 50000000 },
];

export default function GoalBasedSIPCalculatorPage() {
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);
  const [goalAmount, setGoalAmount] = useState(5000000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(15);
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'amount'>('percentage');
  const [stepUpValue, setStepUpValue] = useState(10);

  const handleStepUpTypeChange = (type: 'percentage' | 'amount') => {
    setStepUpType(type);
    setStepUpValue(type === 'percentage' ? 10 : 1000);
  };

  const baseResult = useMemo(
    () => calculateGoalSIP(goalAmount, returnRate, years),
    [goalAmount, returnRate, years]
  );

  const stepUpResult = useMemo(
    () => stepUpEnabled ? calculateGoalSIPWithStepUp(goalAmount, returnRate, years, stepUpType, stepUpValue) : null,
    [goalAmount, returnRate, years, stepUpEnabled, stepUpType, stepUpValue]
  );

  const result = stepUpEnabled && stepUpResult ? stepUpResult : baseResult;

  const breakdown = useMemo(
    () => {
      if (stepUpEnabled && stepUpResult) {
        return stepUpResult.yearlyBreakdown;
      }
      return calculateSIPBreakdown(baseResult.requiredMonthly, returnRate, years);
    },
    [stepUpEnabled, stepUpResult, baseResult.requiredMonthly, returnRate, years]
  );

  // Step-up preview: calculate what the SIP would be in years 1, 5, and 10
  const stepUpPreview = useMemo(() => {
    if (!stepUpEnabled) return null;
    const startAmount = stepUpResult?.startingMonthly ?? baseResult.requiredMonthly;
    const yr5 = Math.min(years, 5);
    const yr10 = Math.min(years, 10);
    let amtYr5 = startAmount;
    let amtYr10 = startAmount;
    for (let i = 1; i < yr5; i++) {
      amtYr5 = stepUpType === 'percentage' ? amtYr5 * (1 + stepUpValue / 100) : amtYr5 + stepUpValue;
    }
    for (let i = 1; i < yr10; i++) {
      amtYr10 = stepUpType === 'percentage' ? amtYr10 * (1 + stepUpValue / 100) : amtYr10 + stepUpValue;
    }
    return { yr1: startAmount, yr5: amtYr5, yr10: amtYr10, yr5Num: yr5, yr10Num: yr10 };
  }, [stepUpEnabled, stepUpResult, baseResult.requiredMonthly, stepUpType, stepUpValue, years]);

  const scenarios = useMemo(
    () => {
      const conservativeGoal = calculateGoalSIP(goalAmount, 8, years);
      const moderateGoal = calculateGoalSIP(goalAmount, 12, years);
      const aggressiveGoal = calculateGoalSIP(goalAmount, 15, years);
      return [
        { scenario: 'Conservative (8%)', monthly: conservativeGoal.requiredMonthly, totalInvested: conservativeGoal.totalInvested, color: COLORS.conservative },
        { scenario: 'Moderate (12%)', monthly: moderateGoal.requiredMonthly, totalInvested: moderateGoal.totalInvested, color: COLORS.moderate },
        { scenario: 'Aggressive (15%)', monthly: aggressiveGoal.requiredMonthly, totalInvested: aggressiveGoal.totalInvested, color: COLORS.aggressive },
      ];
    },
    [goalAmount, years]
  );

  const chartData = breakdown.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    invested: row.invested,
    value: row.value,
    target: goalAmount,
  }));

  const pieData = [
    { name: 'Your Investment', value: result.totalInvested, color: COLORS.invested },
    { name: 'Returns Earned', value: result.estimatedReturns, color: COLORS.returns },
  ];

  const scenarioBarData = scenarios.map((s) => ({
    scenario: s.scenario,
    monthly: s.monthly,
    totalInvested: s.totalInvested,
  }));

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
              <Target className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Goal-Based SIP Calculator</h1>
              <p className="text-slate-300 mt-1">Find out the exact monthly SIP you need to reach your financial goal</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Define Your Goal</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Priya"
              />

              {/* Goal Presets */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-600 mb-2 block">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {goalPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setGoalAmount(preset.value)}
                      className={cn(
                        'text-xs py-2 px-3 rounded-lg border transition-all text-left',
                        goalAmount === preset.value
                          ? 'border-brand bg-brand-50 text-brand font-medium'
                          : 'border-surface-300 text-slate-500 hover:border-brand/30'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <NumberInput label="Target Amount" value={goalAmount} onChange={setGoalAmount} prefix="₹" step={100000} min={100000} max={100000000} />
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={30} />
                <NumberInput label="Time to Achieve Goal" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={40} />
              </div>

              {/* Step-Up SIP Toggle */}
              <div className="mt-6 border border-surface-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-primary-700">Step-Up SIP</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stepUpEnabled}
                    onClick={() => setStepUpEnabled(!stepUpEnabled)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      stepUpEnabled ? 'bg-brand' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                      stepUpEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">
                  {stepUpEnabled ? 'SIP increases annually — start lower, reach the same goal' : 'Enable to increase your SIP amount every year'}
                </p>

                {stepUpEnabled && (
                  <div className="space-y-3 animate-in">
                    {/* Type Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStepUpTypeChange('percentage')}
                        className={cn(
                          'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                          stepUpType === 'percentage'
                            ? 'bg-brand text-white border-brand'
                            : 'bg-surface-100 text-slate-500 border-surface-300 hover:border-brand/30'
                        )}
                      >
                        Percentage +%
                      </button>
                      <button
                        onClick={() => handleStepUpTypeChange('amount')}
                        className={cn(
                          'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                          stepUpType === 'amount'
                            ? 'bg-brand text-white border-brand'
                            : 'bg-surface-100 text-slate-500 border-surface-300 hover:border-brand/30'
                        )}
                      >
                        Fixed +₹
                      </button>
                    </div>

                    {/* Step-Up Value Input */}
                    <NumberInput
                      label={stepUpType === 'percentage' ? 'Annual Increase' : 'Annual Increase Amount'}
                      value={stepUpValue}
                      onChange={setStepUpValue}
                      prefix={stepUpType === 'amount' ? '₹' : undefined}
                      suffix={stepUpType === 'percentage' ? '%' : undefined}
                      step={stepUpType === 'percentage' ? 1 : 500}
                      min={stepUpType === 'percentage' ? 1 : 500}
                      max={stepUpType === 'percentage' ? 50 : 50000}
                    />

                    {/* Live Preview */}
                    {stepUpPreview && (
                      <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand">
                        Yr 1: {formatINR(stepUpPreview.yr1)}
                        {years >= 5 && <> → Yr {stepUpPreview.yr5Num}: {formatINR(stepUpPreview.yr5)}</>}
                        {years >= 10 && <> → Yr {stepUpPreview.yr10Num}: {formatINR(stepUpPreview.yr10)}</>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="mt-8 space-y-3">
                <div className="bg-gradient-to-r from-teal-50 to-teal-50/50 rounded-xl p-5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    {stepUpEnabled ? 'Starting Monthly SIP' : 'Required Monthly SIP'}
                  </div>
                  <div className="text-3xl font-extrabold text-positive">{formatINR(result.requiredMonthly)}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {stepUpEnabled ? `starting amount, increases ${stepUpType === 'percentage' ? `${stepUpValue}%` : formatINR(stepUpValue)} yearly` : `per month for ${years} years`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">You Invest</div>
                    <div className="text-sm font-bold text-primary-700">{formatINR(result.totalInvested)}</div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Returns</div>
                    <div className="text-sm font-bold text-positive">{formatINR(result.estimatedReturns)}</div>
                  </div>
                </div>

                {/* Step-Up Comparison Card */}
                {stepUpEnabled && stepUpResult && (
                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-brand-500 uppercase tracking-wider mb-1">Step-Up Advantage</div>
                    <div className="text-xs text-brand-700">
                      Start with <span className="font-bold">{formatINR(stepUpResult.startingMonthly)}</span>/month
                      {' '}(vs <span className="font-bold">{formatINR(baseResult.requiredMonthly)}</span> constant SIP)
                    </div>
                    {stepUpResult.startingMonthly < baseResult.requiredMonthly && (
                      <div className="text-[10px] text-teal-600 font-medium mt-1">
                        You start {formatINR(baseResult.requiredMonthly - stepUpResult.startingMonthly)} lower per month
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* Personalized Banner */}
              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-teal-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}'s` : 'Your'} Goal: {formatINR(goalAmount)}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? `Target by age ${investorAge + years} (${years} years from now)`
                      : `Target in ${years} years`
                    }
                    {' '}&middot; {formatINR(result.requiredMonthly)}/month SIP needed
                  </p>
                </div>
              )}

              {/* Growth Towards Goal */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">Path to Your Goal</h3>
                  <DownloadPDFButton elementId="calculator-results" title="Goal-Based SIP Calculator" fileName="goal-based-calculator" />
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  How {investorName ? `${investorName}'s` : 'your'} investments grow towards {formatINR(goalAmount)}
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="goalGradInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.invested} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.invested} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="goalGradValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.returns} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.returns} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name === 'invested' ? 'Invested' : name === 'value' ? 'Portfolio Value' : 'Target']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="invested" stroke={COLORS.invested} fill="url(#goalGradInvested)" strokeWidth={2} name="Invested" />
                      <Area type="monotone" dataKey="value" stroke={COLORS.returns} fill="url(#goalGradValue)" strokeWidth={2} name="Portfolio Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3-Scenario Analysis */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">3-Scenario Analysis</h3>
                <p className="text-sm text-slate-500 mb-6">Monthly SIP needed under different return assumptions</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {scenarios.map((s) => (
                    <div key={s.scenario} className="text-center p-4 rounded-xl bg-surface-100">
                      <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.scenario}</div>
                      <div className="text-lg font-extrabold text-primary-700">{formatINR(s.monthly)}</div>
                      <div className="text-[10px] text-slate-400 mt-1">/month</div>
                    </div>
                  ))}
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scenarioBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="monthly" name="Monthly SIP" fill={COLORS.moderate} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalInvested" name="Total Investment" fill={COLORS.conservative} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdown Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Investment vs Returns</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How much is {investorName ? `${investorName}'s` : 'your'} money vs how much the market earns {investorName ? 'for them' : 'for you'}
                </p>
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

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Progress</h3>
                  <p className="text-sm text-slate-500 mb-4">Track your journey towards {formatINR(goalAmount)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        {stepUpEnabled && (
                          <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly SIP</th>
                        )}
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Invested</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Value</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Returns</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">% of Goal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((row) => {
                        const goalPercent = goalAmount > 0 ? Math.round((row.value / goalAmount) * 100) : 0;
                        return (
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">Year {row.year}</td>
                            {stepUpEnabled && 'monthlyAmount' in row && (
                              <td className="py-3 px-2 sm:px-3 text-right text-brand font-medium">{formatINR((row as { monthlyAmount: number }).monthlyAmount)}</td>
                            )}
                            <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.invested)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right font-semibold text-primary-700">{formatINR(row.value)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right text-positive font-medium">{formatINR(row.returns)}</td>
                            <td className="py-3 px-2 sm:px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand rounded-full transition-all"
                                    style={{ width: `${Math.min(goalPercent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-600 w-10 text-right">{goalPercent}%</span>
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
