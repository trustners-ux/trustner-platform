'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, IndianRupee, Users, GraduationCap, Home, HeartPulse, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  expenses: '#2563EB',
  education: '#7C3AED',
  marriage: '#DB2777',
  homeLoan: '#EA580C',
  otherLoans: '#D97706',
  offset: '#0F766E',
  gap: '#DC2626',
};

const PIE_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#D97706'];

type CoverageStatus = 'adequate' | 'review' | 'critical';

function getStatus(gap: number, totalNeed: number): CoverageStatus {
  if (gap <= 0) return 'adequate';
  const ratio = gap / totalNeed;
  if (ratio < 0.3) return 'review';
  return 'critical';
}

const STATUS_CONFIG: Record<CoverageStatus, { label: string; color: string; bg: string; border: string; text: string }> = {
  adequate: { label: 'Adequately Covered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Your existing coverage and savings are sufficient to protect your family.' },
  review: { label: 'Needs Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', text: 'You have partial coverage but should consider increasing your term insurance.' },
  critical: { label: 'Critically Under-Covered', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', text: 'There is a significant coverage gap. Getting adequate term insurance should be a priority.' },
};

export default function TermInsuranceCalculatorPage() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
  const [dependents, setDependents] = useState(3);
  const [yearsToSupport, setYearsToSupport] = useState(25);
  const [inflationRate, setInflationRate] = useState(6);
  const [returnRate, setReturnRate] = useState(8);
  const [educationFund, setEducationFund] = useState(2500000);
  const [marriageFund, setMarriageFund] = useState(1500000);
  const [homeLoan, setHomeLoan] = useState(3000000);
  const [otherLoans, setOtherLoans] = useState(500000);
  const [existingInsurance, setExistingInsurance] = useState(0);
  const [existingSavings, setExistingSavings] = useState(1000000);
  const [spouseIncome, setSpouseIncome] = useState(0);

  const result = useMemo(() => {
    const annualExpenses = monthlyExpenses * 12;
    const inflRate = inflationRate / 100;
    const retRate = returnRate / 100;

    // Real rate of return (Fisher equation)
    const realRate = (1 + retRate) / (1 + inflRate) - 1;

    // PV of annuity for family expenses
    let pvExpenses: number;
    if (realRate === 0) {
      pvExpenses = annualExpenses * yearsToSupport;
    } else {
      pvExpenses = annualExpenses * ((1 - Math.pow(1 + realRate, -yearsToSupport)) / realRate);
    }

    // PV of spouse income offset
    let pvSpouseIncome: number;
    if (spouseIncome <= 0) {
      pvSpouseIncome = 0;
    } else if (realRate === 0) {
      pvSpouseIncome = spouseIncome * yearsToSupport;
    } else {
      pvSpouseIncome = spouseIncome * ((1 - Math.pow(1 + realRate, -yearsToSupport)) / realRate);
    }

    // Total need components
    const totalNeedExpenses = Math.round(pvExpenses);
    const totalNeedEducation = educationFund;
    const totalNeedMarriage = marriageFund;
    const totalNeedHomeLoan = homeLoan;
    const totalNeedOtherLoans = otherLoans;

    const totalNeed = totalNeedExpenses + totalNeedEducation + totalNeedMarriage + totalNeedHomeLoan + totalNeedOtherLoans;

    // Offsets
    const totalOffset = existingInsurance + existingSavings + Math.round(pvSpouseIncome);

    // Required coverage
    const requiredCoverage = Math.max(0, totalNeed - totalOffset);
    const coverageGap = totalNeed - totalOffset;
    const status = getStatus(coverageGap, totalNeed);
    const gapPercent = totalNeed > 0 ? Math.min(100, Math.max(0, ((totalNeed - totalOffset) / totalNeed) * 100)) : 0;

    return {
      requiredCoverage,
      totalNeed,
      totalOffset,
      coverageGap,
      status,
      gapPercent,
      components: {
        expenses: totalNeedExpenses,
        education: totalNeedEducation,
        marriage: totalNeedMarriage,
        homeLoan: totalNeedHomeLoan,
        otherLoans: totalNeedOtherLoans,
      },
      offsets: {
        insurance: existingInsurance,
        savings: existingSavings,
        spouseIncome: Math.round(pvSpouseIncome),
      },
    };
  }, [monthlyExpenses, yearsToSupport, inflationRate, returnRate, educationFund, marriageFund, homeLoan, otherLoans, existingInsurance, existingSavings, spouseIncome]);

  const barChartData = [
    { name: 'Family Expenses', need: result.components.expenses, color: COLORS.expenses },
    { name: 'Education', need: result.components.education, color: COLORS.education },
    { name: 'Marriage / Events', need: result.components.marriage, color: COLORS.marriage },
    { name: 'Home Loan', need: result.components.homeLoan, color: COLORS.homeLoan },
    { name: 'Other Loans', need: result.components.otherLoans, color: COLORS.otherLoans },
  ];

  const pieData = [
    { name: 'Family Expenses', value: result.components.expenses },
    { name: 'Education Fund', value: result.components.education },
    { name: 'Marriage Fund', value: result.components.marriage },
    { name: 'Home Loan', value: result.components.homeLoan },
    { name: 'Other Loans', value: result.components.otherLoans },
  ].filter((d) => d.value > 0);

  const statusConfig = STATUS_CONFIG[result.status];

  const tips = [
    { icon: Shield, text: 'Review your term insurance coverage every 3 years or after any major life event like marriage, childbirth, or home purchase.' },
    { icon: Users, text: `With ${dependents} dependent${dependents !== 1 ? 's' : ''}, ensure your coverage accounts for each family member\'s long-term needs.` },
    { icon: HeartPulse, text: 'Buy term insurance early when you are young and healthy -- premiums are significantly lower and easier to qualify for.' },
    { icon: Lightbulb, text: 'Consider a combination of term plans from different insurers to diversify risk and optimise premium costs.' },
  ];

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
              <h1 className="text-3xl sm:text-4xl font-extrabold">Term Insurance Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate your ideal term insurance coverage based on your family&apos;s financial needs</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Coverage Needs</h2>

              <div className="space-y-5">
                {/* Family Expenses Section */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Family Expenses</p>
                  <div className="space-y-4">
                    <NumberInput label="Monthly Family Expenses" value={monthlyExpenses} onChange={setMonthlyExpenses} prefix="₹" step={5000} min={10000} max={500000} />
                    <NumberInput label="Number of Dependents" value={dependents} onChange={(v) => setDependents(Math.round(v))} step={1} min={0} max={10} />
                    <NumberInput label="Years to Support Family" value={yearsToSupport} onChange={(v) => setYearsToSupport(Math.round(v))} suffix="Years" step={1} min={5} max={40} hint="Until youngest child becomes independent" />
                  </div>
                </div>

                {/* Rate Assumptions */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Rate Assumptions</p>
                  <div className="space-y-4">
                    <NumberInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} suffix="% p.a." step={0.5} min={3} max={10} />
                    <NumberInput label="Expected Investment Return" value={returnRate} onChange={setReturnRate} suffix="% p.a." step={0.5} min={6} max={12} />
                  </div>
                </div>

                {/* Future Obligations */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Future Obligations</p>
                  <div className="space-y-4">
                    <NumberInput label="Children Education Fund" value={educationFund} onChange={setEducationFund} prefix="₹" step={500000} min={0} max={10000000} />
                    <NumberInput label="Marriage / Major Events Fund" value={marriageFund} onChange={setMarriageFund} prefix="₹" step={500000} min={0} max={5000000} />
                  </div>
                </div>

                {/* Outstanding Liabilities */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Outstanding Liabilities</p>
                  <div className="space-y-4">
                    <NumberInput label="Outstanding Home Loan" value={homeLoan} onChange={setHomeLoan} prefix="₹" step={500000} min={0} max={20000000} />
                    <NumberInput label="Outstanding Other Loans" value={otherLoans} onChange={setOtherLoans} prefix="₹" step={100000} min={0} max={5000000} />
                  </div>
                </div>

                {/* Existing Resources */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Existing Resources</p>
                  <div className="space-y-4">
                    <NumberInput label="Existing Term Insurance" value={existingInsurance} onChange={setExistingInsurance} prefix="₹" step={1000000} min={0} max={50000000} />
                    <NumberInput label="Existing Savings & Investments" value={existingSavings} onChange={setExistingSavings} prefix="₹" step={1000000} min={0} max={50000000} />
                    <NumberInput label="Spouse's Annual Income" value={spouseIncome} onChange={setSpouseIncome} prefix="₹" step={100000} min={0} max={5000000} hint="Reduces coverage need" />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Term Insurance Calculator" fileName="term-insurance-calculator" />
              </div>

              {/* Recommended Sum Assured - Hero Card */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-500">Recommended Sum Assured</span>
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold gradient-text mb-4">
                  {formatINR(result.requiredCoverage)}
                </div>
                <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold', statusConfig.bg, statusConfig.border, statusConfig.color)}>
                  {result.status === 'adequate' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {statusConfig.label}
                </div>
                <p className="text-sm text-slate-500 mt-3">{statusConfig.text}</p>
              </div>

              {/* Component Breakdown Cards */}
              <div className="grid sm:grid-cols-2 gap-4" data-pdf-keep-together>
                <div className="card-base p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Expenses Coverage</span>
                  </div>
                  <div className="text-xl font-extrabold text-blue-700">{formatINR(result.components.expenses)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">PV of {yearsToSupport} years of family expenses</p>
                </div>

                <div className="card-base p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Education Fund</span>
                  </div>
                  <div className="text-xl font-extrabold text-purple-700">{formatINR(result.components.education)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Children&apos;s higher education corpus</p>
                </div>

                <div className="card-base p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="w-4 h-4 text-pink-600" />
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Marriage / Events</span>
                  </div>
                  <div className="text-xl font-extrabold text-pink-700">{formatINR(result.components.marriage)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Major life events fund</p>
                </div>

                <div className="card-base p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Loans</span>
                  </div>
                  <div className="text-xl font-extrabold text-orange-700">{formatINR(result.components.homeLoan + result.components.otherLoans)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Home loan + other outstanding liabilities</p>
                </div>
              </div>

              {/* Coverage Gap Indicator */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Gap Analysis</h3>
                <p className="text-sm text-slate-500 mb-4">How much of your total need is covered by existing resources</p>

                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 font-medium">Total Need: {formatINR(result.totalNeed)}</span>
                  <span className="text-slate-600 font-medium">Existing Cover: {formatINR(result.totalOffset)}</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-5 bg-surface-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      result.status === 'adequate' ? 'bg-emerald-500' : result.status === 'review' ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, 100 - result.gapPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('font-semibold', statusConfig.color)}>
                    {result.coverageGap <= 0 ? 'Fully Covered' : `Gap: ${formatINR(result.requiredCoverage)}`}
                  </span>
                  <span className="text-slate-400">
                    {result.coverageGap <= 0 ? '100%' : `${(100 - result.gapPercent).toFixed(0)}%`} covered
                  </span>
                </div>
              </div>

              {/* Horizontal Bar Chart - Needs Breakdown */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Needs Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">Each component contributing to your total coverage requirement</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} width={120} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Amount Needed']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="need" name="Coverage Need" radius={[0, 6, 6, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart - Coverage Composition */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Coverage Composition</h3>
                <p className="text-sm text-slate-500 mb-6">Proportion of each need in your total sum assured</p>
                <div className="h-80">
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
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Needs vs Resources Summary</h3>
                  <p className="text-sm text-slate-500 mb-4">Detailed comparison of your coverage needs against available resources</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Component</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Amount</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Family Expenses (PV)</td>
                        <td className="py-3 px-6 text-right font-medium text-blue-600">{formatINR(result.components.expenses)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">NEED</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Children Education</td>
                        <td className="py-3 px-6 text-right font-medium text-purple-600">{formatINR(result.components.education)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">NEED</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Marriage / Major Events</td>
                        <td className="py-3 px-6 text-right font-medium text-pink-600">{formatINR(result.components.marriage)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">NEED</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Home Loan Outstanding</td>
                        <td className="py-3 px-6 text-right font-medium text-orange-600">{formatINR(result.components.homeLoan)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">NEED</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Other Loans Outstanding</td>
                        <td className="py-3 px-6 text-right font-medium text-amber-600">{formatINR(result.components.otherLoans)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">NEED</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 bg-blue-50/40 font-semibold">
                        <td className="py-3 px-6 text-primary-700">Total Need</td>
                        <td className="py-3 px-6 text-right text-primary-700">{formatINR(result.totalNeed)}</td>
                        <td className="py-3 px-6 text-right" />
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-teal-700">Existing Term Insurance</td>
                        <td className="py-3 px-6 text-right font-medium text-teal-600">{formatINR(result.offsets.insurance)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">OFFSET</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-teal-700">Savings & Investments</td>
                        <td className="py-3 px-6 text-right font-medium text-teal-600">{formatINR(result.offsets.savings)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">OFFSET</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-teal-700">Spouse Income (PV)</td>
                        <td className="py-3 px-6 text-right font-medium text-teal-600">{formatINR(result.offsets.spouseIncome)}</td>
                        <td className="py-3 px-6 text-right"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">OFFSET</span></td>
                      </tr>
                      <tr className="border-b border-surface-200 bg-emerald-50/40 font-semibold">
                        <td className="py-3 px-6 text-teal-800">Total Offset</td>
                        <td className="py-3 px-6 text-right text-teal-800">{formatINR(result.totalOffset)}</td>
                        <td className="py-3 px-6 text-right" />
                      </tr>
                      <tr className={cn('font-bold', result.status === 'adequate' ? 'bg-emerald-50' : 'bg-red-50')}>
                        <td className={cn('py-4 px-6', result.status === 'adequate' ? 'text-emerald-800' : 'text-red-800')}>
                          {result.coverageGap <= 0 ? 'Surplus' : 'Coverage Gap'}
                        </td>
                        <td className={cn('py-4 px-6 text-right text-lg', result.status === 'adequate' ? 'text-emerald-700' : 'text-red-700')}>
                          {formatINR(result.requiredCoverage)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', result.status === 'adequate' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                            {result.status === 'adequate' ? 'COVERED' : 'GAP'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips Section */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-4">Expert Tips</h3>
                <div className="space-y-4">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <tip.icon className="w-4 h-4 text-brand" />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{tip.text}</p>
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
