'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, IndianRupee, TrendingUp, Landmark, GraduationCap, Heart, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  income: '#0F766E',
  liabilities: '#E8553A',
  goals: '#7C3AED',
  existingCover: '#2563EB',
  savings: '#0EA5E9',
  gap: '#DC2626',
  adequate: '#16A34A',
};

const PIE_COLORS = ['#0F766E', '#E8553A', '#7C3AED', '#F59E0B'];

export default function HumanLifeValueCalculatorPage() {
  // Personal details
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [annualIncome, setAnnualIncome] = useState(1000000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(8);
  const [personalExpenses, setPersonalExpenses] = useState(300000);

  // Outstanding liabilities
  const [homeLoan, setHomeLoan] = useState(0);
  const [carLoan, setCarLoan] = useState(0);
  const [otherLoans, setOtherLoans] = useState(0);

  // Future goals
  const [educationFund, setEducationFund] = useState(2000000);
  const [marriageFund, setMarriageFund] = useState(1000000);

  // Existing coverage
  const [existingLifeCover, setExistingLifeCover] = useState(0);
  const [existingSavings, setExistingSavings] = useState(0);

  // Discount rate
  const [discountRate, setDiscountRate] = useState(8);

  const result = useMemo(() => {
    const workingYears = retirementAge - currentAge;
    const growthFactor = 1 + incomeGrowthRate / 100;
    const discountFactor = 1 + discountRate / 100;

    // Calculate PV of future net income contributions
    let pvFutureIncome = 0;
    const yearlyProjection: {
      year: number;
      age: number;
      grossIncome: number;
      netContribution: number;
      presentValue: number;
    }[] = [];

    for (let y = 1; y <= workingYears; y++) {
      const grossIncome = annualIncome * Math.pow(growthFactor, y - 1);
      const netContribution = Math.max(0, grossIncome - personalExpenses);
      const pv = netContribution / Math.pow(discountFactor, y);
      pvFutureIncome += pv;

      yearlyProjection.push({
        year: y,
        age: currentAge + y,
        grossIncome: Math.round(grossIncome),
        netContribution: Math.round(netContribution),
        presentValue: Math.round(pv),
      });
    }

    pvFutureIncome = Math.round(pvFutureIncome);

    const totalLiabilities = homeLoan + carLoan + otherLoans;
    const totalGoals = educationFund + marriageFund;
    const totalExisting = existingLifeCover + existingSavings;

    const grossHLV = pvFutureIncome + totalLiabilities + totalGoals;
    const hlv = Math.max(0, grossHLV - totalExisting);
    const coverageGap = hlv;
    const isAdequate = hlv === 0;

    // Income multiple (how many times current income is the HLV)
    const incomeMultiple = annualIncome > 0 ? (hlv / annualIncome).toFixed(1) : '0';

    return {
      pvFutureIncome,
      totalLiabilities,
      totalGoals,
      totalExisting,
      grossHLV,
      hlv,
      coverageGap,
      isAdequate,
      incomeMultiple,
      yearlyProjection,
      workingYears,
    };
  }, [currentAge, retirementAge, annualIncome, incomeGrowthRate, personalExpenses, homeLoan, carLoan, otherLoans, educationFund, marriageFund, existingLifeCover, existingSavings, discountRate]);

  // Chart data: HLV components vs offsets
  const barChartData = [
    { name: 'Future Income (PV)', value: result.pvFutureIncome, fill: COLORS.income },
    { name: 'Liabilities', value: result.totalLiabilities, fill: COLORS.liabilities },
    { name: 'Future Goals', value: result.totalGoals, fill: COLORS.goals },
    { name: 'Existing Cover', value: -existingLifeCover, fill: COLORS.existingCover },
    { name: 'Savings', value: -existingSavings, fill: COLORS.savings },
  ];

  // Pie chart for HLV composition (only positive components)
  const pieData = [
    { name: 'Future Income (PV)', value: result.pvFutureIncome, color: PIE_COLORS[0] },
    { name: 'Liabilities', value: result.totalLiabilities, color: PIE_COLORS[1] },
    { name: 'Future Goals', value: result.totalGoals, color: PIE_COLORS[2] },
  ].filter((d) => d.value > 0);

  // Year-by-year display: first 5 and last 5
  const displayYears = useMemo(() => {
    const proj = result.yearlyProjection;
    if (proj.length <= 10) return proj;
    return [...proj.slice(0, 5), ...proj.slice(-5)];
  }, [result.yearlyProjection]);

  const showEllipsis = result.yearlyProjection.length > 10;

  // Insights
  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (result.isAdequate) {
      items.push({
        icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />,
        text: `Your existing coverage and savings of ${formatINR(result.totalExisting)} adequately cover your family's financial needs. Review annually as circumstances change.`,
        color: 'bg-green-50 border-green-200',
      });
    } else {
      items.push({
        icon: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />,
        text: `Your coverage gap is ${formatINR(result.coverageGap)}. Consider a term life insurance plan of at least this amount to protect your family.`,
        color: 'bg-red-50 border-red-200',
      });
    }

    items.push({
      icon: <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />,
      text: `Your recommended cover is ${result.incomeMultiple}x your current annual income. Financial experts typically recommend 10-15x annual income as life cover.`,
      color: 'bg-blue-50 border-blue-200',
    });

    if (result.totalLiabilities > 0) {
      items.push({
        icon: <Landmark className="w-5 h-5 text-orange-600 shrink-0" />,
        text: `Outstanding liabilities of ${formatINR(result.totalLiabilities)} add to your coverage need. Ensure your term plan covers at least the outstanding loan amounts.`,
        color: 'bg-orange-50 border-orange-200',
      });
    }

    items.push({
      icon: <Target className="w-5 h-5 text-purple-600 shrink-0" />,
      text: `Review your HLV every 2-3 years or whenever there is a major life event (marriage, child birth, home purchase) to keep your coverage adequate.`,
      color: 'bg-purple-50 border-purple-200',
    });

    return items;
  }, [result]);

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
              <ShieldCheck className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Human Life Value Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate how much life insurance you need based on income, expenses, liabilities &amp; goals</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ─── Input Panel ─── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Your Details</h2>

              <div className="space-y-5">
                {/* Personal Details */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Personal Details</label>
                  <div className="space-y-4">
                    <NumberInput label="Current Age" value={currentAge} onChange={setCurrentAge} suffix="Years" step={1} min={18} max={65} />
                    <NumberInput label="Retirement Age" value={retirementAge} onChange={setRetirementAge} suffix="Years" step={1} min={45} max={70} />
                    <NumberInput label="Annual Income" value={annualIncome} onChange={setAnnualIncome} prefix="₹" step={50000} min={100000} max={20000000} />
                    <NumberInput label="Annual Income Growth Rate" value={incomeGrowthRate} onChange={setIncomeGrowthRate} suffix="%" step={0.5} min={0} max={15} />
                    <NumberInput label="Annual Personal Expenses" value={personalExpenses} onChange={setPersonalExpenses} prefix="₹" step={25000} min={50000} max={10000000} hint="Expenses that stop if you are not around" />
                  </div>
                </div>

                {/* Outstanding Liabilities */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Outstanding Liabilities</label>
                  <div className="space-y-4">
                    <NumberInput label="Home Loan" value={homeLoan} onChange={setHomeLoan} prefix="₹" step={100000} min={0} max={20000000} />
                    <NumberInput label="Car Loan" value={carLoan} onChange={setCarLoan} prefix="₹" step={100000} min={0} max={5000000} />
                    <NumberInput label="Other Loans" value={otherLoans} onChange={setOtherLoans} prefix="₹" step={100000} min={0} max={5000000} />
                  </div>
                </div>

                {/* Future Goals */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Future Goals</label>
                  <div className="space-y-4">
                    <NumberInput label="Children Education Fund" value={educationFund} onChange={setEducationFund} prefix="₹" step={500000} min={0} max={10000000} />
                    <NumberInput label="Children Marriage Fund" value={marriageFund} onChange={setMarriageFund} prefix="₹" step={500000} min={0} max={5000000} />
                  </div>
                </div>

                {/* Existing Coverage */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Existing Coverage</label>
                  <div className="space-y-4">
                    <NumberInput label="Existing Life Cover" value={existingLifeCover} onChange={setExistingLifeCover} prefix="₹" step={1000000} min={0} max={50000000} />
                    <NumberInput label="Existing Savings / Investments" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={1000000} min={0} max={50000000} />
                  </div>
                </div>

                {/* Discount Rate */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-3 uppercase tracking-wider">Assumptions</label>
                  <NumberInput label="Discount Rate" value={discountRate} onChange={setDiscountRate} suffix="% p.a." step={0.5} min={5} max={12} hint="Rate to discount future income to present value" />
                </div>
              </div>

              {/* Hero Metric */}
              <div className="mt-8 space-y-3">
                <div className={cn(
                  'rounded-xl p-4',
                  result.isAdequate
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                    : 'bg-gradient-to-r from-brand-50 to-secondary-50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className={cn('w-4 h-4', result.isAdequate ? 'text-green-600' : 'text-blue-600')} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Recommended Life Insurance Cover</span>
                  </div>
                  <div className={cn(
                    'text-2xl font-extrabold',
                    result.isAdequate ? 'text-green-700' : 'gradient-text'
                  )}>
                    {formatINR(result.hlv)}
                  </div>
                  {result.isAdequate && (
                    <p className="text-xs text-green-600 mt-1 font-medium">You are adequately covered!</p>
                  )}
                </div>

                {/* Coverage Gap Indicator */}
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  result.isAdequate ? 'bg-green-50' : 'bg-red-50'
                )}>
                  <div className="flex items-center gap-2">
                    {result.isAdequate
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertTriangle className="w-4 h-4 text-red-500" />
                    }
                    <span className="text-[11px] text-slate-500 font-medium">Coverage Gap</span>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    result.isAdequate ? 'text-green-700' : 'text-red-600'
                  )}>
                    {result.isAdequate ? 'Nil' : formatINR(result.coverageGap)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">PV of Future Income</span>
                  </div>
                  <span className="text-sm font-bold text-teal-700">{formatINR(result.pvFutureIncome)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Liabilities</span>
                  </div>
                  <span className="text-sm font-bold text-orange-700">{formatINR(result.totalLiabilities)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Future Goals</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">{formatINR(result.totalGoals)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Existing Cover + Savings</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{formatINR(result.totalExisting)}</span>
                </div>
              </div>
            </div>

            {/* ─── Charts & Results ─── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Human Life Value Calculator" fileName="hlv-calculator" />
              </div>

              {/* Coverage Adequacy Gauge */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Adequacy</h3>
                <p className="text-sm text-slate-500 mb-6">How your existing coverage compares to your total insurance need</p>
                <div className="relative h-8 bg-surface-200 rounded-full overflow-hidden">
                  {(() => {
                    const total = result.grossHLV > 0 ? result.grossHLV : 1;
                    const coveredPct = Math.min(100, (result.totalExisting / total) * 100);
                    return (
                      <>
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                            coveredPct >= 100 ? 'bg-green-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${coveredPct}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-700">
                          {coveredPct.toFixed(0)}% Covered
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-slate-500">
                  <span>Existing: {formatINR(result.totalExisting)}</span>
                  <span>Needed: {formatINR(result.grossHLV)}</span>
                </div>
              </div>

              {/* Stacked Bar Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">HLV Components Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">Positive values add to your insurance need, negative values reduce it</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tickFormatter={(v: number) => formatINR(Math.abs(v))} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={130} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(Math.abs(value)), value < 0 ? 'Offset' : 'Need']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">HLV Composition</h3>
                <p className="text-sm text-slate-500 mb-6">Proportional breakdown of your total insurance need (before offsets)</p>
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

              {/* Year-by-Year Income Projection Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Income Projection</h3>
                  <p className="text-sm text-slate-500 mb-4">Projected gross income, net contribution, and present value for each working year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-center py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Age</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Gross Income</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Contribution</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Present Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayYears.map((row, idx) => (
                        <>
                          {showEllipsis && idx === 5 && (
                            <tr key="ellipsis" className="border-b border-surface-200">
                              <td colSpan={5} className="py-3 px-6 text-center text-slate-400 text-xs font-medium tracking-wider">
                                ... {result.yearlyProjection.length - 10} more years ...
                              </td>
                            </tr>
                          )}
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">Year {row.year}</td>
                            <td className="py-3 px-6 text-center text-slate-600">{row.age}</td>
                            <td className="py-3 px-6 text-right text-slate-600">{formatINR(row.grossIncome)}</td>
                            <td className="py-3 px-6 text-right font-medium text-teal-700">{formatINR(row.netContribution)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-primary-700">{formatINR(row.presentValue)}</td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Actionable Insights</h3>
                <div className="space-y-3">
                  {insights.map((item, idx) => (
                    <div key={idx} className={cn('flex items-start gap-3 p-4 rounded-lg border', item.color)}>
                      {item.icon}
                      <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
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
