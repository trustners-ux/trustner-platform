'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, IndianRupee, Percent, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  income: '#059669',
  expenses: '#E8553A',
  savings: '#2563EB',
  disciplined: '#0F766E',
  aggressive: '#7C3AED',
  danger: '#DC2626',
};

const SCENARIOS = [
  { label: 'Your Plan', sub: '' },
  { label: 'Disciplined', sub: '6% inflation' },
  { label: 'Aggressive Saver', sub: '0% inflation' },
];

function computeProjection(
  monthlyIncome: number,
  monthlyExpenses: number,
  incomeGrowth: number,
  lifestyleInflation: number,
  projectionYears: number,
) {
  const yearlyData: {
    year: number;
    annualIncome: number;
    annualExpenses: number;
    annualSavings: number;
    savingsRate: number;
    cumulativeSavings: number;
  }[] = [];
  let cumulativeSavings = 0;
  let crossoverYear: number | null = null;

  for (let year = 0; year <= projectionYears; year++) {
    const annualIncome = monthlyIncome * 12 * Math.pow(1 + incomeGrowth / 100, year);
    const annualExpenses = monthlyExpenses * 12 * Math.pow(1 + lifestyleInflation / 100, year);
    const annualSavings = annualIncome - annualExpenses;
    const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;
    cumulativeSavings += annualSavings;

    if (annualExpenses >= annualIncome && crossoverYear === null && year > 0) {
      crossoverYear = year;
    }

    yearlyData.push({ year, annualIncome, annualExpenses, annualSavings, savingsRate, cumulativeSavings });
  }

  return { yearlyData, crossoverYear };
}

export default function LifestyleInflationCalculatorPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(60000);
  const [incomeGrowth, setIncomeGrowth] = useState(8);
  const [lifestyleInflation, setLifestyleInflation] = useState(12);
  const [projectionYears, setProjectionYears] = useState(20);
  const [scenario, setScenario] = useState(0);

  const effectiveLifestyleInflation = scenario === 1 ? 6 : scenario === 2 ? 0 : lifestyleInflation;

  // Compute all three scenarios
  const { yearlyData, crossoverYear: userCrossover } = useMemo(
    () => computeProjection(monthlyIncome, monthlyExpenses, incomeGrowth, lifestyleInflation, projectionYears),
    [monthlyIncome, monthlyExpenses, incomeGrowth, lifestyleInflation, projectionYears],
  );

  const { yearlyData: disciplinedData } = useMemo(
    () => computeProjection(monthlyIncome, monthlyExpenses, incomeGrowth, 6, projectionYears),
    [monthlyIncome, monthlyExpenses, incomeGrowth, projectionYears],
  );

  const { yearlyData: aggressiveData } = useMemo(
    () => computeProjection(monthlyIncome, monthlyExpenses, incomeGrowth, 0, projectionYears),
    [monthlyIncome, monthlyExpenses, incomeGrowth, projectionYears],
  );

  // Active data based on scenario
  const activeData = scenario === 0 ? yearlyData : scenario === 1 ? disciplinedData : aggressiveData;
  const activeCrossover = useMemo(() => {
    const { crossoverYear } = computeProjection(monthlyIncome, monthlyExpenses, incomeGrowth, effectiveLifestyleInflation, projectionYears);
    return crossoverYear;
  }, [monthlyIncome, monthlyExpenses, incomeGrowth, effectiveLifestyleInflation, projectionYears]);

  // Summary values
  const currentSavingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
  const year1Data = activeData[1]; // year=1 is index 1
  const finalYearData = activeData[activeData.length - 1];

  // Cumulative savings for each scenario (final year)
  const yoursCumulativeSavings = yearlyData[yearlyData.length - 1]?.cumulativeSavings ?? 0;
  const disciplinedCumulativeSavings = disciplinedData[disciplinedData.length - 1]?.cumulativeSavings ?? 0;
  const aggressiveCumulativeSavings = aggressiveData[aggressiveData.length - 1]?.cumulativeSavings ?? 0;

  const disciplinedAdvantage = disciplinedCumulativeSavings - yoursCumulativeSavings;
  const currentGapMonthly = monthlyIncome - monthlyExpenses;

  // Chart data: income vs expenses (skip year 0 for charting)
  const incomeExpenseChartData = activeData.filter(r => r.year > 0).map((row) => ({
    year: `Yr ${row.year}`,
    Income: row.annualIncome,
    Expenses: row.annualExpenses,
  }));

  // Savings rate chart data
  const savingsRateChartData = activeData.filter(r => r.year > 0).map((row) => ({
    year: `Yr ${row.year}`,
    'Savings Rate': parseFloat(row.savingsRate.toFixed(1)),
  }));

  // Scenario comparison data
  const scenarioComparisonData = [
    { name: 'Your Plan', savings: yoursCumulativeSavings, fill: COLORS.expenses },
    { name: 'Disciplined (6%)', savings: disciplinedCumulativeSavings, fill: COLORS.disciplined },
    { name: 'Aggressive (0%)', savings: aggressiveCumulativeSavings, fill: COLORS.aggressive },
  ];

  // Dynamic sub for "Your Plan" scenario button
  const scenariosWithDynamicSub = SCENARIOS.map((s, i) =>
    i === 0 ? { ...s, sub: `${lifestyleInflation}% inflation` } : s,
  );

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
              <h1 className="text-3xl sm:text-4xl font-extrabold">Lifestyle Inflation Calculator</h1>
              <p className="text-slate-300 mt-1">See how lifestyle creep silently erodes your savings rate over time</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Left: Inputs + Summary */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Inputs</h2>

              <div className="space-y-6">
                <NumberInput label="Current Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} prefix="₹" step={5000} min={10000} max={10000000} />
                <NumberInput label="Current Monthly Expenses" value={monthlyExpenses} onChange={setMonthlyExpenses} prefix="₹" step={5000} min={5000} max={10000000} />
                <NumberInput label="Annual Income Growth" value={incomeGrowth} onChange={setIncomeGrowth} suffix="%" step={0.5} min={0} max={30} />
                <NumberInput label="Annual Lifestyle Inflation" value={lifestyleInflation} onChange={setLifestyleInflation} suffix="%" step={0.5} min={0} max={30} />
                <NumberInput label="Projection Years" value={projectionYears} onChange={setProjectionYears} suffix="yrs" step={1} min={5} max={40} />
              </div>

              {/* Scenario Toggles */}
              <div className="mt-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Scenario</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {scenariosWithDynamicSub.map((s, i) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setScenario(i)}
                      className={cn(
                        'px-2 py-2.5 rounded-xl text-center transition-all border text-xs font-semibold',
                        scenario === i
                          ? 'bg-brand-50 border-brand-400 text-brand-700 shadow-sm'
                          : 'bg-white border-surface-300 text-slate-500 hover:border-brand-300',
                      )}
                    >
                      <div className="leading-tight">{s.label}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                {/* Current Savings Rate */}
                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current Savings Rate</div>
                  <div className="text-2xl font-extrabold gradient-text">{currentSavingsRate.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Saving {formatINR((monthlyIncome - monthlyExpenses) * 12)} / year
                  </div>
                </div>

                {/* Year 1 Annual Savings */}
                <div className="bg-white rounded-xl p-4 border border-surface-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Year 1 Annual Savings</div>
                      <div className="text-lg font-extrabold text-primary-700">{formatINR(year1Data?.annualSavings ?? 0)}</div>
                    </div>
                    <IndianRupee className="w-5 h-5 text-slate-300" />
                  </div>
                </div>

                {/* Final Year Monthly Income */}
                <div className="bg-white rounded-xl p-4 border border-surface-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Final Year Monthly Income</div>
                      <div className="text-lg font-extrabold text-positive">{formatINR((finalYearData?.annualIncome ?? 0) / 12)}</div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  </div>
                </div>

                {/* Final Year Monthly Expenses */}
                <div className="bg-white rounded-xl p-4 border border-surface-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Final Year Monthly Expenses</div>
                      <div className="text-lg font-extrabold text-red-600">{formatINR((finalYearData?.annualExpenses ?? 0) / 12)}</div>
                    </div>
                    <ArrowDownRight className="w-5 h-5 text-red-400" />
                  </div>
                </div>

                {/* Final Year Savings Rate */}
                <div className={cn(
                  'rounded-xl p-4 border',
                  (finalYearData?.savingsRate ?? 0) > 20 ? 'bg-green-50 border-green-200' :
                  (finalYearData?.savingsRate ?? 0) > 5 ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200',
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Final Year Savings Rate</div>
                      <div className={cn(
                        'text-lg font-extrabold',
                        (finalYearData?.savingsRate ?? 0) > 20 ? 'text-green-700' :
                        (finalYearData?.savingsRate ?? 0) > 5 ? 'text-amber-700' :
                        'text-red-700',
                      )}>
                        {(finalYearData?.savingsRate ?? 0).toFixed(1)}%
                      </div>
                    </div>
                    {(finalYearData?.savingsRate ?? 0) > 20 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (finalYearData?.savingsRate ?? 0) > 5 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Crossover Year */}
                <div className={cn(
                  'rounded-xl p-4 flex items-start gap-3',
                  activeCrossover ? 'bg-red-50' : 'bg-green-50',
                )}>
                  <AlertTriangle className={cn('w-5 h-5 shrink-0 mt-0.5', activeCrossover ? 'text-red-500' : 'text-green-500')} />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Expense Crossover Year</div>
                    <div className={cn('text-lg font-extrabold', activeCrossover ? 'text-red-600' : 'text-green-700')}>
                      {activeCrossover ? `Year ${activeCrossover}` : `Never (within ${projectionYears} yrs)`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeCrossover ? 'Expenses overtake income!' : 'Income stays ahead of expenses'}
                    </div>
                  </div>
                </div>

                {/* Cumulative Savings / Deficit */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {(finalYearData?.cumulativeSavings ?? 0) >= 0 ? 'Cumulative Savings' : 'Cumulative Deficit'}
                  </div>
                  <div className={cn(
                    'text-2xl font-extrabold',
                    (finalYearData?.cumulativeSavings ?? 0) >= 0 ? 'text-blue-700' : 'text-red-600',
                  )}>
                    {(finalYearData?.cumulativeSavings ?? 0) < 0 ? '-' : ''}{formatINR(Math.abs(finalYearData?.cumulativeSavings ?? 0))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Over {projectionYears} years ({scenario === 0 ? 'your plan' : scenario === 1 ? 'disciplined' : 'aggressive saver'})
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Charts, Insights, Table */}
            <div className="space-y-8">
              {/* Income vs Expenses AreaChart */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-primary-700">Income vs Expenses</h3>
                  <DownloadPDFButton elementId="calculator-results" title="Lifestyle Inflation Calculator" fileName="lifestyle-inflation-calculator" />
                </div>
                <p className="text-sm text-slate-500 mb-6">Watch the gap between income and expenses over time ({effectiveLifestyleInflation}% lifestyle inflation)</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={incomeExpenseChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="liGradIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="liGradExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.expenses} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.expenses} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Income" stroke={COLORS.income} fill="url(#liGradIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Expenses" stroke={COLORS.expenses} fill="url(#liGradExpenses)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Savings Rate AreaChart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Savings Rate Over Time</h3>
                <p className="text-sm text-slate-500 mb-6">How your savings rate evolves year by year</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsRateChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="liGradSavingsRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.savings} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.savings} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis
                        tickFormatter={(v: number) => `${v}%`}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={50}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, 'Savings Rate']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="Savings Rate" stroke={COLORS.savings} fill="url(#liGradSavingsRate)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scenario Comparison BarChart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Scenario Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Cumulative savings across different lifestyle inflation rates over {projectionYears} years</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scenarioComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Cumulative Savings']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="savings" radius={[8, 8, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insight Box */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg" data-pdf-keep-together>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-amber-800 text-sm">Key Insights</h4>
                    {userCrossover && (
                      <p className="text-sm text-amber-900">
                        Your expenses will overtake your income in <span className="font-bold">Year {userCrossover}</span>. After that point, you will be spending more than you earn.
                      </p>
                    )}
                    {disciplinedAdvantage > 0 && (
                      <p className="text-sm text-amber-900">
                        A disciplined saver (6% inflation) would accumulate <span className="font-bold">{formatINR(disciplinedAdvantage)}</span> more than you over {projectionYears} years.
                      </p>
                    )}
                    <p className="text-sm text-amber-900">
                      Current gap: <span className="font-bold">{formatINR(Math.abs(currentGapMonthly))}/month</span> savings
                    </p>
                    {!userCrossover && (
                      <p className="text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                        Your income growth stays ahead of your lifestyle inflation within the {projectionYears}-year horizon. Keep it up!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Breakdown</h3>
                  <p className="text-sm text-slate-500 mb-4">Detailed income, expenses, and savings projection</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Income</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Expenses</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Savings</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Savings Rate</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cumulative Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeData.filter(r => r.year > 0).map((row) => (
                        <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-6 font-medium text-primary-700">Year {row.year}</td>
                          <td className="py-3 px-6 text-right font-semibold text-green-700">{formatINR(row.annualIncome)}</td>
                          <td className="py-3 px-6 text-right font-semibold text-red-600">{formatINR(row.annualExpenses)}</td>
                          <td className="py-3 px-6 text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              row.annualSavings >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
                            )}>
                              {row.annualSavings >= 0 ? '' : '-'}{formatINR(Math.abs(row.annualSavings))}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              row.savingsRate > 20 ? 'bg-green-50 text-green-700' :
                              row.savingsRate > 5 ? 'bg-amber-50 text-amber-700' :
                              'bg-red-50 text-red-600',
                            )}>
                              {row.savingsRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className={cn(
                              'font-semibold',
                              row.cumulativeSavings >= 0 ? 'text-blue-700' : 'text-red-600',
                            )}>
                              {row.cumulativeSavings >= 0 ? '' : '-'}{formatINR(Math.abs(row.cumulativeSavings))}
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
