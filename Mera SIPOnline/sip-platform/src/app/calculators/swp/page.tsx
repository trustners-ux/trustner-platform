'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { IndianRupee, ArrowLeft, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { calculateSWP } from '@/lib/utils/calculators';
import { formatINR, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

const COLORS = {
  corpus: '#0F766E',
  withdrawn: '#D4A017',
  interest: '#E8553A',
  depleted: '#EF4444',
};

export default function SWPCalculatorPage() {
  const [corpus, setCorpus] = useState(10000000);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(50000);
  const [returnRate, setReturnRate] = useState(8);
  const [years, setYears] = useState(30);
  const [investorName, setInvestorName] = useState('');
  const [investorAge, setInvestorAge] = useState<number | null>(null);

  // Step-up withdrawal state
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'amount'>('percentage');
  const [stepUpValue, setStepUpValue] = useState(6);

  const result = useMemo(
    () => calculateSWP(corpus, monthlyWithdrawal, returnRate, years, stepUpEnabled, stepUpType, stepUpValue),
    [corpus, monthlyWithdrawal, returnRate, years, stepUpEnabled, stepUpType, stepUpValue]
  );

  const corpusSustainable = result.finalCorpus > 0;

  // Last year's monthly withdrawal for display
  const lastYearMonthly = result.yearlyData.length > 0
    ? result.yearlyData[result.yearlyData.length - 1].monthlyWithdrawal
    : monthlyWithdrawal;

  const chartData = result.yearlyData.map((row) => ({
    year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
    remaining: row.remaining,
    withdrawn: row.withdrawn,
    interest: row.interest,
  }));

  const cumulativeWithdrawal = result.yearlyData.reduce((acc, row) => {
    acc.push({
      year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
      totalWithdrawn: (acc.length > 0 ? acc[acc.length - 1].totalWithdrawn : 0) + row.withdrawn,
      remaining: row.remaining,
    });
    return acc;
  }, [] as { year: string; totalWithdrawn: number; remaining: number }[]);

  const pieData = [
    { name: 'Total Withdrawn', value: result.totalWithdrawn, color: COLORS.withdrawn },
    { name: 'Remaining Corpus', value: result.finalCorpus, color: COLORS.corpus },
  ];

  const withdrawalRate = corpus > 0 ? ((monthlyWithdrawal * 12 / corpus) * 100).toFixed(1) : '0';

  // Step-up preview calculation
  const previewYear = Math.min(years, 10);
  const previewMonthly = stepUpType === 'percentage'
    ? monthlyWithdrawal * Math.pow(1 + stepUpValue / 100, previewYear - 1)
    : monthlyWithdrawal + stepUpValue * (previewYear - 1);

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
              <IndianRupee className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">SWP Calculator</h1>
              <p className="text-slate-300 mt-1">Plan systematic withdrawals from your corpus and see how long it lasts</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure SWP</h2>

              <PersonalInfoBar
                name={investorName}
                onNameChange={setInvestorName}
                age={investorAge}
                onAgeChange={setInvestorAge}
                ageLabel="Current Age"
                namePlaceholder="e.g., Ram"
              />

              <div className="space-y-6">
                {/* Corpus */}
                <NumberInput label="Total Corpus" value={corpus} onChange={setCorpus} prefix="₹" step={500000} min={500000} max={100000000} />

                {/* Monthly Withdrawal */}
                <NumberInput label="Monthly Withdrawal" value={monthlyWithdrawal} onChange={setMonthlyWithdrawal} prefix="₹" step={5000} min={5000} max={500000} />

                {/* Return Rate */}
                <NumberInput label="Expected Annual Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={1} max={20} />

                {/* Duration */}
                <NumberInput label="Withdrawal Period" value={years} onChange={setYears} suffix="Years" step={1} min={1} max={50} />

                {/* Step-Up Withdrawal Toggle */}
                <div className="pt-3 border-t border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      Annual Withdrawal Step-Up
                    </label>
                    <button
                      role="switch"
                      aria-checked={stepUpEnabled}
                      onClick={() => setStepUpEnabled(!stepUpEnabled)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        stepUpEnabled ? 'bg-amber-500' : 'bg-slate-300'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                        stepUpEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      )} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">
                    {stepUpEnabled
                      ? 'Withdrawals increase annually to maintain purchasing power'
                      : 'Fixed withdrawal every month (no inflation adjustment)'}
                  </div>

                  {stepUpEnabled && (
                    <div className="space-y-3 mt-2 animate-in fade-in duration-200">
                      {/* Percentage vs Fixed Amount Toggle */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStepUpType('percentage')}
                          className={cn(
                            'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                            stepUpType === 'percentage'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                          )}
                        >
                          Percentage +%
                        </button>
                        <button
                          onClick={() => setStepUpType('amount')}
                          className={cn(
                            'flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-colors',
                            stepUpType === 'amount'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
                          )}
                        >
                          Fixed Amount +₹
                        </button>
                      </div>

                      {/* Step-up Value Input */}
                      <NumberInput
                        label={stepUpType === 'percentage' ? 'Annual Increase Rate' : 'Annual Increase Amount'}
                        value={stepUpValue}
                        onChange={setStepUpValue}
                        prefix={stepUpType === 'amount' ? '₹' : undefined}
                        suffix={stepUpType === 'percentage' ? '%' : undefined}
                        step={stepUpType === 'percentage' ? 1 : 500}
                        min={stepUpType === 'percentage' ? 4 : 500}
                        max={stepUpType === 'percentage' ? 12 : 50000}
                      />

                      {/* Preview: Year 1 → Year N */}
                      <div className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200/50">
                        <div className="font-semibold mb-0.5">Withdrawal Preview</div>
                        <div>Yr 1: {formatINR(monthlyWithdrawal)}/mo → Yr {previewYear}: {formatINR(previewMonthly)}/mo</div>
                        {years > 10 && (
                          <div className="mt-0.5 text-amber-600">
                            Yr {years}: {formatINR(
                              stepUpType === 'percentage'
                                ? monthlyWithdrawal * Math.pow(1 + stepUpValue / 100, years - 1)
                                : monthlyWithdrawal + stepUpValue * (years - 1)
                            )}/mo
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="mt-8 space-y-3">
                <div className={cn(
                  'rounded-xl p-4 flex items-start gap-3',
                  corpusSustainable ? 'bg-teal-50' : 'bg-red-50'
                )}>
                  {corpusSustainable
                    ? <CheckCircle2 className="w-5 h-5 text-positive shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Corpus Status</div>
                    {corpusSustainable ? (
                      <>
                        <div className="text-lg font-extrabold text-positive">Sustainable</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Remaining after {years} years: {formatINR(result.finalCorpus)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-extrabold text-red-600">Corpus Depletes</div>
                        <div className="text-xs text-red-500 mt-1">
                          Runs out in ~{result.corpusLasts} years
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={cn('grid gap-3', stepUpEnabled ? 'grid-cols-1' : 'grid-cols-2')}>
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Withdrawn</div>
                    <div className="text-sm font-bold text-secondary-700">{formatINR(result.totalWithdrawn)}</div>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Initial Withdrawal Rate</div>
                    <div className="text-sm font-bold text-primary-700">{withdrawalRate}% p.a.</div>
                  </div>
                  {stepUpEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] text-amber-500 uppercase tracking-wider">Year 1 Monthly</div>
                        <div className="text-sm font-bold text-amber-700">{formatINR(monthlyWithdrawal)}</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] text-amber-500 uppercase tracking-wider">Final Year Monthly</div>
                        <div className="text-sm font-bold text-amber-700">{formatINR(lastYearMonthly)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* PDF Download Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="SWP Calculator" fileName="swp-calculator" />
              </div>

              {/* Personalized Banner */}
              {(investorName || investorAge !== null) && (
                <div className="bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-5 border border-brand-200/30">
                  <h3 className="text-lg font-extrabold text-primary-700">
                    {investorName ? `${investorName}\u2019s` : 'Your'} Systematic Withdrawal Plan
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {investorAge !== null
                      ? stepUpEnabled
                        ? `Starting at ${formatINR(monthlyWithdrawal)}/mo from age ${investorAge}, increasing ${stepUpType === 'percentage' ? `${stepUpValue}%` : formatINR(stepUpValue)} annually`
                        : `Monthly income of ${formatINR(monthlyWithdrawal)} from age ${investorAge} to ${investorAge + years}`
                      : stepUpEnabled
                        ? `Starting at ${formatINR(monthlyWithdrawal)}/mo, increasing ${stepUpType === 'percentage' ? `${stepUpValue}%` : formatINR(stepUpValue)} annually for ${years} years`
                        : `Monthly income of ${formatINR(monthlyWithdrawal)} for ${years} years`
                    }
                  </p>
                </div>
              )}

              {/* Corpus Depletion Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Over Time</h3>
                <p className="text-sm text-slate-500 mb-6">How {investorName ? `${investorName}\u2019s` : 'your'} corpus changes with {stepUpEnabled ? 'inflation-adjusted' : 'regular'} withdrawals</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="swpGradCorpus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.corpus} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.corpus} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'remaining' ? 'Remaining Corpus' : name === 'withdrawn' ? 'Year Withdrawn' : 'Interest Earned',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="remaining" stroke={COLORS.corpus} fill="url(#swpGradCorpus)" strokeWidth={2} name="Remaining Corpus" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Withdrawal vs Remaining */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cumulative Withdrawals vs Remaining</h3>
                <p className="text-sm text-slate-500 mb-6">Track total money withdrawn against remaining corpus</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeWithdrawal} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="remaining" stroke={COLORS.corpus} fill="none" strokeWidth={2} name="Remaining Corpus" />
                      <Area type="monotone" dataKey="totalWithdrawn" stroke={COLORS.withdrawn} fill="none" strokeWidth={2} name="Total Withdrawn" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual Withdrawal Bar Chart — Only when step-up is on */}
              {stepUpEnabled && (
                <div className="card-base p-6" data-pdf-keep-together>
                  <h3 className="font-bold text-primary-700 mb-1">Annual Withdrawal Growth</h3>
                  <p className="text-sm text-slate-500 mb-6">How your yearly withdrawal increases to maintain purchasing power</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.yearlyData.map((row) => ({
                        year: investorAge !== null ? `Age ${investorAge + row.year}` : `Yr ${row.year}`,
                        withdrawn: row.withdrawn,
                        monthlyWithdrawal: row.monthlyWithdrawal,
                      }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatINR(value),
                            name === 'withdrawn' ? 'Annual Withdrawal' : 'Monthly Withdrawal',
                          ]}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        />
                        <Bar dataKey="withdrawn" fill="#D4A017" radius={[4, 4, 0, 0]} name="Annual Withdrawal" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Distribution Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Final Distribution</h3>
                <p className="text-sm text-slate-500 mb-6">After {years} years of systematic withdrawal</p>
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
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year SWP Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {stepUpEnabled ? 'Inflation-adjusted withdrawals, interest, and remaining corpus each year' : 'Withdrawals, interest, and remaining corpus each year'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        {stepUpEnabled && (
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Monthly</th>
                        )}
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Yr Withdrawn</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Interest</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Remaining</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => (
                        <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-primary-700">
                            {investorAge !== null ? `Age ${investorAge + row.year}` : `Year ${row.year}`}
                          </td>
                          {stepUpEnabled && (
                            <td className="py-3 px-4 text-right text-amber-600 font-medium text-xs">{formatINR(row.monthlyWithdrawal)}/mo</td>
                          )}
                          <td className="py-3 px-4 text-right text-secondary-700 font-medium">{formatINR(row.withdrawn)}</td>
                          <td className="py-3 px-4 text-right text-positive">{formatINR(row.interest)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-primary-700">{formatINR(row.remaining)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              row.remaining > corpus * 0.5 ? 'bg-teal-50 text-teal-700' :
                              row.remaining > 0 ? 'bg-amber-50 text-amber-700' :
                              'bg-red-50 text-red-700'
                            )}>
                              {row.remaining > corpus * 0.5 ? 'Healthy' : row.remaining > 0 ? 'Declining' : 'Depleted'}
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
