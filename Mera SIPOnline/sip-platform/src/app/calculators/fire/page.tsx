'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, IndianRupee, Percent, TrendingUp, Calendar, Target, CheckCircle } from 'lucide-react';
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
  accumulation: '#059669',
  withdrawal: '#E8553A',
  fire: '#D97706',
  portfolio: '#2563EB',
  target: '#DC2626',
};

type FireType = 'regular' | 'lean' | 'fat';

const FIRE_TYPES: { key: FireType; label: string; multiplier: number; description: string }[] = [
  { key: 'regular', label: 'Regular FIRE', multiplier: 1, description: 'Standard 4% rule' },
  { key: 'lean', label: 'Lean FIRE', multiplier: 0.7, description: '70% of expenses' },
  { key: 'fat', label: 'Fat FIRE', multiplier: 1.5, description: '150% of expenses' },
];

export default function FIRECalculatorPage() {
  const [currentAge, setCurrentAge] = useState(30);
  const [targetRetireAge, setTargetRetireAge] = useState(45);
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(80000);
  const [currentSavings, setCurrentSavings] = useState(2000000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(50000);
  const [preReturnRate, setPreReturnRate] = useState(12);
  const [postReturnRate, setPostReturnRate] = useState(8);
  const [inflationRate, setInflationRate] = useState(6);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);
  const [fireType, setFireType] = useState<FireType>('regular');

  const fireTypeMultiplier = FIRE_TYPES.find(t => t.key === fireType)!.multiplier;

  const results = useMemo(() => {
    const yearsToRetire = Math.max(targetRetireAge - currentAge, 1);
    const annualExpenses = monthlyExpenses * 12 * fireTypeMultiplier;
    const inflatedExpenses = annualExpenses * Math.pow(1 + inflationRate / 100, yearsToRetire);
    const fireNumber = inflatedExpenses / (safeWithdrawalRate / 100);

    // Coast FIRE: how much you need NOW with zero future savings to reach FIRE number at retirement
    const coastFIRE = fireNumber / Math.pow(1 + preReturnRate / 100, yearsToRetire);

    // Year-by-year projection
    let portfolio = currentSavings;
    const totalYears = yearsToRetire + 35; // project 35 years into post-retirement
    const yearlyData: {
      year: number;
      age: number;
      portfolio: number;
      fireNumber: number;
      phase: 'Accumulation' | 'Withdrawal';
      annualFlow: number;
    }[] = [];

    for (let year = 0; year <= totalYears; year++) {
      if (year <= yearsToRetire) {
        // Accumulation phase
        const annualInvestment = year === 0 ? 0 : monthlyInvestment * 12;
        portfolio = (portfolio + annualInvestment) * (1 + preReturnRate / 100);
        yearlyData.push({
          year,
          age: currentAge + year,
          portfolio: Math.max(0, portfolio),
          fireNumber,
          phase: 'Accumulation',
          annualFlow: annualInvestment,
        });
      } else {
        // Withdrawal phase
        const yearsSinceStart = year;
        const withdrawal = annualExpenses * Math.pow(1 + inflationRate / 100, yearsSinceStart);
        portfolio = portfolio * (1 + postReturnRate / 100) - withdrawal;
        yearlyData.push({
          year,
          age: currentAge + year,
          portfolio: Math.max(0, portfolio),
          fireNumber,
          phase: 'Withdrawal',
          annualFlow: withdrawal,
        });
        if (portfolio <= 0) break;
      }
    }

    const portfolioAtRetirement = yearlyData[yearsToRetire]?.portfolio ?? 0;
    const fiAchieved = portfolioAtRetirement >= fireNumber;
    const progressPercent = Math.min(100, Math.round((portfolioAtRetirement / fireNumber) * 100));

    // Find when money runs out (post-retirement)
    const postRetirementData = yearlyData.filter(d => d.phase === 'Withdrawal');
    const depletedEntry = postRetirementData.find(d => d.portfolio <= 0);
    const moneyLastsUntilAge = depletedEntry ? depletedEntry.age : currentAge + totalYears;
    const moneyLastsYears = moneyLastsUntilAge - targetRetireAge;

    // Monthly withdrawal (inflation adjusted year 1 of retirement)
    const monthlyWithdrawalYear1 = (annualExpenses * Math.pow(1 + inflationRate / 100, yearsToRetire)) / 12;

    // Bar chart comparison data
    const totalInvestmentContribution = monthlyInvestment * 12 * yearsToRetire;
    const investmentReturns = Math.max(0, portfolioAtRetirement - currentSavings - totalInvestmentContribution);

    return {
      yearsToRetire,
      annualExpenses,
      inflatedExpenses,
      fireNumber,
      coastFIRE,
      yearlyData,
      portfolioAtRetirement,
      fiAchieved,
      progressPercent,
      moneyLastsUntilAge,
      moneyLastsYears,
      monthlyWithdrawalYear1,
      totalInvestmentContribution,
      investmentReturns,
    };
  }, [currentAge, targetRetireAge, monthlyExpenses, currentSavings, monthlyInvestment, preReturnRate, postReturnRate, inflationRate, safeWithdrawalRate, fireTypeMultiplier]);

  // Chart data: split by phase for area chart
  const areaChartData = results.yearlyData.map(d => ({
    age: d.age,
    accumulationPortfolio: d.phase === 'Accumulation' ? d.portfolio : undefined,
    withdrawalPortfolio: d.phase === 'Withdrawal' ? d.portfolio : undefined,
    // For the overlap point: last accumulation = first withdrawal
    portfolio: d.portfolio,
    fireNumber: results.fireNumber,
  }));

  // Ensure continuity: the first withdrawal point should also appear in accumulation
  const retireIndex = results.yearlyData.findIndex(d => d.phase === 'Withdrawal');
  if (retireIndex > 0) {
    areaChartData[retireIndex] = {
      ...areaChartData[retireIndex],
      accumulationPortfolio: areaChartData[retireIndex - 1]?.accumulationPortfolio,
    };
  }

  // Bar chart comparison data
  const barChartData = [
    { name: 'Current Savings', savings: currentSavings, contributions: 0, returns: 0, portfolio: 0, fireTarget: 0 },
    { name: 'Total Contributions', savings: 0, contributions: results.totalInvestmentContribution, returns: 0, portfolio: 0, fireTarget: 0 },
    { name: 'Investment Returns', savings: 0, contributions: 0, returns: results.investmentReturns, portfolio: 0, fireTarget: 0 },
    { name: 'Portfolio at Retire', savings: 0, contributions: 0, returns: 0, portfolio: results.portfolioAtRetirement, fireTarget: 0 },
    { name: 'FIRE Number', savings: 0, contributions: 0, returns: 0, portfolio: 0, fireTarget: results.fireNumber },
  ];

  // Table data
  const tableData = results.yearlyData;

  const handleCurrentAgeChange = (val: number) => {
    setCurrentAge(val);
    if (val >= targetRetireAge) setTargetRetireAge(val + 5);
  };

  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;

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
              <Flame className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Financial Independence</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">FIRE Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate your path to Financial Independence &amp; Early Retirement. Know your FIRE number and when you can stop working.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Input Panel (Left Sidebar) ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your FIRE Profile</h2>

              {/* FIRE Type Toggle */}
              <div className="mb-6">
                <label className="text-xs font-medium text-slate-600 mb-2 block">FIRE Type</label>
                <div className="flex gap-2">
                  {FIRE_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setFireType(t.key)}
                      className={cn(
                        'flex-1 text-[10px] font-semibold py-2 rounded-lg border transition-colors',
                        fireType === t.key
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  {FIRE_TYPES.find(t => t.key === fireType)!.description}
                </p>
              </div>

              {/* Core Inputs */}
              <div className="space-y-5">
                <NumberInput label="Current Age" value={currentAge} onChange={handleCurrentAgeChange} suffix="yrs" step={1} min={18} max={60} />
                <NumberInput label="Target Retirement Age" value={targetRetireAge} onChange={setTargetRetireAge} suffix="yrs" step={1} min={Math.max(currentAge + 1, 25)} max={70} />
                <NumberInput label="Current Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} prefix="₹" step={5000} min={10000} max={10000000} />
                <NumberInput label="Current Monthly Expenses" value={monthlyExpenses} onChange={setMonthlyExpenses} prefix="₹" step={5000} min={5000} max={10000000} />
                <NumberInput label="Current Savings/Investments" value={currentSavings} onChange={setCurrentSavings} prefix="₹" step={100000} min={0} max={1000000000} />
                <NumberInput label="Monthly Investment" value={monthlyInvestment} onChange={setMonthlyInvestment} prefix="₹" step={5000} min={0} max={5000000} />
                <NumberInput label="Expected Return (pre-retirement)" value={preReturnRate} onChange={setPreReturnRate} suffix="%" step={0.5} min={5} max={20} />
                <NumberInput label="Expected Return (post-retirement)" value={postReturnRate} onChange={setPostReturnRate} suffix="%" step={0.5} min={3} max={15} />
                <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="%" step={0.5} min={3} max={12} />
                <NumberInput label="Safe Withdrawal Rate" value={safeWithdrawalRate} onChange={setSafeWithdrawalRate} suffix="%" step={0.5} min={2} max={6} />
              </div>

              {/* Quick Stats */}
              <div className="mt-6 bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Savings Rate</div>
                <div className="text-2xl font-extrabold gradient-text">{savingsRate}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  Saving {formatINR(monthlyIncome - monthlyExpenses)}/month of {formatINR(monthlyIncome)} income
                </div>
              </div>
            </div>

            {/* ── Results Panel (Right) ── */}
            <div className="space-y-8">

              {/* Output Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* FIRE Number — large gradient card */}
                <div className="sm:col-span-2 lg:col-span-3 card-base p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border border-amber-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Your FIRE Number</div>
                        <div className="text-[10px] text-slate-400">
                          {FIRE_TYPES.find(t => t.key === fireType)!.label}
                        </div>
                      </div>
                    </div>
                    <DownloadPDFButton elementId="calculator-results" title="FIRE Calculator" fileName="fire-calculator" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 mt-2">{formatINR(results.fireNumber)}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    The corpus you need to retire at age {targetRetireAge} and sustain your lifestyle
                  </p>
                </div>

                {/* Years to FIRE */}
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Years to FIRE</div>
                  </div>
                  <div className="text-2xl font-extrabold text-primary-700">{results.yearsToRetire}</div>
                  <div className="text-xs text-slate-500">Age {currentAge} &rarr; {targetRetireAge}</div>
                </div>

                {/* Portfolio at Retirement */}
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-brand-500" />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Portfolio at Retirement</div>
                  </div>
                  <div className="text-2xl font-extrabold text-primary-700">{formatINR(results.portfolioAtRetirement)}</div>
                  <div className="text-xs text-slate-500">Projected corpus at age {targetRetireAge}</div>
                </div>

                {/* FIRE Status */}
                <div className={cn(
                  'card-base p-5 border-t-4',
                  results.fiAchieved ? 'border-emerald-500' : 'border-amber-500'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className={cn('w-4 h-4', results.fiAchieved ? 'text-emerald-500' : 'text-amber-500')} />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">FIRE Status</div>
                  </div>
                  <div className={cn(
                    'text-lg font-extrabold',
                    results.fiAchieved ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {results.fiAchieved ? 'FIRE Achieved!' : 'Not Yet'}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{results.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          results.fiAchieved ? 'bg-emerald-500' : results.progressPercent >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(100, results.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Withdrawal */}
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-4 h-4 text-amber-500" />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly Withdrawal</div>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700">{formatINR(results.monthlyWithdrawalYear1)}</div>
                  <div className="text-xs text-slate-500">Post-retirement, inflation adjusted (year 1)</div>
                </div>

                {/* Coast FIRE Number */}
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-indigo-500" />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Coast FIRE Number</div>
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-700">{formatINR(results.coastFIRE)}</div>
                  <div className="text-xs text-slate-500">Amount needed now to coast with no more savings</div>
                </div>

                {/* Money Lasts Until */}
                <div className="card-base p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Money Lasts Until</div>
                  </div>
                  <div className="text-2xl font-extrabold text-teal-700">
                    {results.moneyLastsYears > 30 ? 'Age 80+' : `Age ${results.moneyLastsUntilAge}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {results.moneyLastsYears > 30 ? 'Your corpus sustains 30+ years' : `${results.moneyLastsYears} years post-retirement`}
                  </div>
                </div>
              </div>

              {/* ── Area Chart: Portfolio Growth & Withdrawal ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Portfolio Projection</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Growth during accumulation and depletion during withdrawal &mdash; FIRE Number shown as reference line
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="fireAccGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.accumulation} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.accumulation} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fireWdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.withdrawal} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.withdrawal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="age"
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#94A3B8' }}
                      />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label =
                            name === 'accumulationPortfolio' ? 'Accumulation Portfolio' :
                            name === 'withdrawalPortfolio' ? 'Withdrawal Portfolio' :
                            'FIRE Number';
                          return [formatINR(value), label];
                        }}
                        labelFormatter={(label) => `Age ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Legend
                        iconType="circle"
                        formatter={(value: string) =>
                          value === 'accumulationPortfolio' ? 'Accumulation' :
                          value === 'withdrawalPortfolio' ? 'Withdrawal' :
                          'FIRE Number'
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="accumulationPortfolio"
                        stroke={COLORS.accumulation}
                        fill="url(#fireAccGrad)"
                        strokeWidth={2.5}
                        name="accumulationPortfolio"
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="withdrawalPortfolio"
                        stroke={COLORS.withdrawal}
                        fill="url(#fireWdGrad)"
                        strokeWidth={2.5}
                        name="withdrawalPortfolio"
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="fireNumber"
                        stroke={COLORS.fire}
                        fill="none"
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        name="fireNumber"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 rounded" style={{ background: COLORS.accumulation }} /> Accumulation Phase
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 rounded" style={{ background: COLORS.withdrawal }} /> Withdrawal Phase
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 rounded border-dashed border-t-2" style={{ borderColor: COLORS.fire }} /> FIRE Number
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" /> Retire at {targetRetireAge}
                  </span>
                </div>
              </div>

              {/* ── Bar Chart: Breakdown Comparison ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Breakdown vs FIRE Target</h3>
                <p className="text-sm text-slate-500 mb-6">
                  How your portfolio at retirement is composed, compared to your FIRE number
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label =
                            name === 'savings' ? 'Current Savings' :
                            name === 'contributions' ? 'Total Contributions' :
                            name === 'returns' ? 'Investment Returns' :
                            name === 'portfolio' ? 'Portfolio at Retirement' :
                            'FIRE Number';
                          return [formatINR(value), label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Bar dataKey="savings" name="savings" fill={COLORS.portfolio} radius={[6, 6, 0, 0]} stackId="a" />
                      <Bar dataKey="contributions" name="contributions" fill={COLORS.accumulation} radius={[6, 6, 0, 0]} stackId="a" />
                      <Bar dataKey="returns" name="returns" fill="#8B5CF6" radius={[6, 6, 0, 0]} stackId="a" />
                      <Bar dataKey="portfolio" name="portfolio" fill={COLORS.fire} radius={[6, 6, 0, 0]} stackId="a" />
                      <Bar dataKey="fireTarget" name="fireTarget" fill={COLORS.target} radius={[6, 6, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Year-by-Year Table ── */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Projection</h3>
                  <p className="text-sm text-slate-500 mb-4">Detailed breakdown across accumulation and withdrawal phases</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Age</th>
                        <th className="text-center py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Phase</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Annual Investment / Withdrawal</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Portfolio Value</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">vs FIRE Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row) => {
                        const deficit = row.portfolio - results.fireNumber;
                        const isRetireYear = row.age === targetRetireAge;
                        return (
                          <tr
                            key={row.year}
                            className={cn(
                              'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                              isRetireYear && 'bg-amber-50/50 border-amber-200',
                              row.portfolio <= 0 && 'bg-red-50/30'
                            )}
                          >
                            <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                              {row.age}
                              {isRetireYear && <span className="ml-1 text-[10px] text-amber-600 font-bold">(RETIRE)</span>}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-center">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                row.phase === 'Accumulation'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-orange-100 text-orange-700'
                              )}>
                                {row.phase === 'Accumulation' ? 'Save' : 'Withdraw'}
                              </span>
                            </td>
                            <td className={cn(
                              'py-3 px-2 sm:px-3 text-right font-medium',
                              row.phase === 'Accumulation' ? 'text-emerald-700' : 'text-orange-700'
                            )}>
                              {row.phase === 'Accumulation' ? '+' : '-'}{formatINR(row.annualFlow)}
                            </td>
                            <td className={cn(
                              'py-3 px-2 sm:px-3 text-right font-semibold',
                              row.portfolio > 0 ? 'text-primary-700' : 'text-red-600'
                            )}>
                              {formatINR(row.portfolio)}
                            </td>
                            <td className={cn(
                              'py-3 px-2 sm:px-3 text-right text-xs font-medium',
                              deficit >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}>
                              {deficit >= 0 ? '+' : ''}{formatINR(deficit)}
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
