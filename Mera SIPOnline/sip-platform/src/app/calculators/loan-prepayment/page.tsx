'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, IndianRupee, Percent, Clock, TrendingDown, Scissors, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  withoutPrepay: '#E8553A',
  withPrepay: '#0F766E',
  interest: '#D97706',
  saved: '#10B981',
};

type PrepayType = 'one-time' | 'yearly';

interface AmortizationRow {
  year: number;
  opening: number;
  principal: number;
  interest: number;
  prepayment: number;
  closing: number;
}

export default function LoanPrepaymentCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [prepayAmount, setPrepayAmount] = useState(200000);
  const [prepayType, setPrepayType] = useState<PrepayType>('one-time');
  const [prepayStartYear, setPrepayStartYear] = useState(2);

  const result = useMemo(() => {
    const P = loanAmount;
    const annualRate = interestRate / 100;
    const monthlyRate = annualRate / 12;
    const totalMonths = tenureYears * 12;

    // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = monthlyRate > 0
      ? P * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : P / totalMonths;

    // ── Without prepayment amortization (year-by-year) ──
    const withoutSchedule: AmortizationRow[] = [];
    let balanceNoPrepay = P;
    let totalInterestWithout = 0;
    let monthsWithout = 0;

    for (let yr = 1; yr <= tenureYears; yr++) {
      const yearOpening = balanceNoPrepay;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        if (balanceNoPrepay <= 0) break;
        const monthInterest = balanceNoPrepay * monthlyRate;
        const monthPrincipal = Math.min(emi - monthInterest, balanceNoPrepay);
        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        balanceNoPrepay -= monthPrincipal;
        totalInterestWithout += monthInterest;
        monthsWithout++;
        if (balanceNoPrepay < 1) { balanceNoPrepay = 0; break; }
      }

      withoutSchedule.push({
        year: yr,
        opening: yearOpening,
        principal: yearPrincipal,
        interest: yearInterest,
        prepayment: 0,
        closing: Math.max(0, balanceNoPrepay),
      });

      if (balanceNoPrepay <= 0) break;
    }

    // ── With prepayment amortization (year-by-year) ──
    const withSchedule: AmortizationRow[] = [];
    let balanceWithPrepay = P;
    let totalInterestWith = 0;
    let monthsWith = 0;

    for (let yr = 1; yr <= tenureYears + 5; yr++) {
      if (balanceWithPrepay <= 0) break;

      // Apply prepayment at start of year
      let yearPrepayment = 0;
      if (prepayType === 'one-time' && yr === prepayStartYear) {
        yearPrepayment = Math.min(prepayAmount, balanceWithPrepay);
        balanceWithPrepay -= yearPrepayment;
      } else if (prepayType === 'yearly' && yr >= prepayStartYear) {
        yearPrepayment = Math.min(prepayAmount, balanceWithPrepay);
        balanceWithPrepay -= yearPrepayment;
      }

      if (balanceWithPrepay <= 0) {
        withSchedule.push({
          year: yr,
          opening: yearPrepayment,
          principal: 0,
          interest: 0,
          prepayment: yearPrepayment,
          closing: 0,
        });
        break;
      }

      const yearOpening = balanceWithPrepay + yearPrepayment;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        if (balanceWithPrepay <= 0) break;
        const monthInterest = balanceWithPrepay * monthlyRate;
        let monthPrincipal = emi - monthInterest;
        if (monthPrincipal > balanceWithPrepay) monthPrincipal = balanceWithPrepay;
        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        balanceWithPrepay -= monthPrincipal;
        totalInterestWith += monthInterest;
        monthsWith++;
        if (balanceWithPrepay < 1) { balanceWithPrepay = 0; break; }
      }

      withSchedule.push({
        year: yr,
        opening: yearOpening,
        principal: yearPrincipal,
        interest: yearInterest,
        prepayment: yearPrepayment,
        closing: Math.max(0, balanceWithPrepay),
      });

      if (balanceWithPrepay <= 0) break;
    }

    const interestSaved = totalInterestWithout - totalInterestWith;
    const monthsSaved = monthsWithout - monthsWith;
    const yearsSaved = Math.floor(monthsSaved / 12);
    const remainingMonthsSaved = monthsSaved % 12;

    const totalPaidWithout = P + totalInterestWithout;
    const totalPrepaymentsMade = withSchedule.reduce((sum, row) => sum + row.prepayment, 0);
    const totalPaidWith = P + totalInterestWith;

    return {
      emi,
      totalInterestWithout,
      totalInterestWith,
      interestSaved,
      monthsWithout,
      monthsWith,
      monthsSaved,
      yearsSaved,
      remainingMonthsSaved,
      totalPaidWithout,
      totalPaidWith,
      totalPrepaymentsMade,
      withoutSchedule,
      withSchedule,
    };
  }, [loanAmount, interestRate, tenureYears, prepayAmount, prepayType, prepayStartYear]);

  // Chart data: outstanding balance over years
  const balanceChartData = useMemo(() => {
    const maxYears = Math.max(result.withoutSchedule.length, result.withSchedule.length);
    const data: { year: string; without: number; with: number }[] = [];

    // Year 0 = loan start
    data.push({ year: 'Yr 0', without: loanAmount, with: loanAmount });

    for (let i = 0; i < maxYears; i++) {
      const yr = i + 1;
      const withoutRow = result.withoutSchedule[i];
      const withRow = result.withSchedule[i];
      data.push({
        year: `Yr ${yr}`,
        without: withoutRow ? withoutRow.closing : 0,
        with: withRow ? withRow.closing : 0,
      });
    }
    return data;
  }, [result.withoutSchedule, result.withSchedule, loanAmount]);

  // Chart data: year-by-year interest comparison
  const interestChartData = useMemo(() => {
    const maxYears = Math.max(result.withoutSchedule.length, result.withSchedule.length);
    const data: { year: string; without: number; with: number }[] = [];

    for (let i = 0; i < maxYears; i++) {
      const yr = i + 1;
      const withoutRow = result.withoutSchedule[i];
      const withRow = result.withSchedule[i];
      data.push({
        year: `Yr ${yr}`,
        without: withoutRow ? Math.round(withoutRow.interest) : 0,
        with: withRow ? Math.round(withRow.interest) : 0,
      });
    }
    return data;
  }, [result.withoutSchedule, result.withSchedule]);

  const tenureWithoutStr = `${Math.floor(result.monthsWithout / 12)} Yrs ${result.monthsWithout % 12} Mo`;
  const tenureWithStr = `${Math.floor(result.monthsWith / 12)} Yrs ${result.monthsWith % 12} Mo`;
  const tenureSavedStr = result.yearsSaved > 0
    ? `${result.yearsSaved} Year${result.yearsSaved > 1 ? 's' : ''} ${result.remainingMonthsSaved > 0 ? `${result.remainingMonthsSaved} Month${result.remainingMonthsSaved > 1 ? 's' : ''}` : ''}`
    : `${result.remainingMonthsSaved} Month${result.remainingMonthsSaved > 1 ? 's' : ''}`;

  const prepayLabel = prepayType === 'one-time'
    ? `A one-time prepayment of ${formatINR(prepayAmount)} in Year ${prepayStartYear}`
    : `An annual prepayment of ${formatINR(prepayAmount)} starting Year ${prepayStartYear}`;

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
              <Scissors className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">Loan Optimizer</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Loan Prepayment Calculator</h1>
              <p className="text-slate-300 mt-1">See how much interest you save and how many years you cut by making smart prepayments on your loan.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* ── Input Panel ── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Loan Details</h2>

              <div className="space-y-5">
                <NumberInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} prefix="₹" step={50000} min={100000} max={100000000} />
                <NumberInput label="Interest Rate" value={interestRate} onChange={setInterestRate} suffix="% p.a." step={0.1} min={1} max={25} />
                <NumberInput label="Loan Tenure" value={tenureYears} onChange={(v) => { setTenureYears(v); if (prepayStartYear > v) setPrepayStartYear(Math.max(1, v)); }} suffix="Years" step={1} min={1} max={30} />
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-surface-300" />

              <h3 className="font-bold text-primary-700 mb-4 text-sm">Prepayment Strategy</h3>

              {/* Prepayment type toggle */}
              <div className="mb-5">
                <label className="text-xs font-medium text-slate-600 mb-2 block">Prepayment Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrepayType('one-time')}
                    className={cn('flex-1 text-xs font-semibold py-2.5 rounded-lg border transition-colors',
                      prepayType === 'one-time' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                    )}
                  >One-Time</button>
                  <button
                    onClick={() => setPrepayType('yearly')}
                    className={cn('flex-1 text-xs font-semibold py-2.5 rounded-lg border transition-colors',
                      prepayType === 'yearly' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                    )}
                  >Every Year</button>
                </div>
              </div>

              <div className="space-y-5">
                <NumberInput label="Prepayment Amount" value={prepayAmount} onChange={setPrepayAmount} prefix="₹" step={10000} min={10000} max={100000000} />
                <NumberInput label="Prepayment Start Year" value={prepayStartYear} onChange={setPrepayStartYear} suffix={`of ${tenureYears}`} step={1} min={1} max={tenureYears} />
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Monthly EMI</span>
                  </div>
                  <span className="font-bold text-primary-700">{formatINR(result.emi)}</span>
                </div>

                {/* Hero metric: Interest Saved */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Interest Saved</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">{formatINR(result.interestSaved)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    by prepaying {formatINR(result.totalPrepaymentsMade)} total
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-slate-600">Tenure Reduction</span>
                  </div>
                  <span className="font-bold text-teal-700">{tenureSavedStr}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-slate-600">Interest Without</span>
                  </div>
                  <span className="font-bold text-red-600">{formatINR(result.totalInterestWithout)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-slate-600">Interest With</span>
                  </div>
                  <span className="font-bold text-emerald-700">{formatINR(result.totalInterestWith)}</span>
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="space-y-8">
              {/* PDF Download */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="Loan Prepayment Calculator" fileName="loan-prepayment" />
              </div>

              {/* Key Insight Box */}
              <div className="card-base p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-teal-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-700 mb-1">Key Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {prepayLabel} saves you <span className="font-semibold text-emerald-700">{formatINR(result.interestSaved)}</span> in interest
                      and reduces your loan tenure by <span className="font-semibold text-teal-700">{tenureSavedStr}</span>.
                      Your total repayment drops from <span className="font-semibold text-red-600">{formatINR(result.totalPaidWithout)}</span> to
                      {' '}<span className="font-semibold text-emerald-700">{formatINR(result.totalPaidWith)}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-base p-5 border-t-4 border-emerald-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Interest Saved</div>
                  <div className="text-xl font-extrabold text-emerald-700">{formatINR(result.interestSaved)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {((result.interestSaved / result.totalInterestWithout) * 100).toFixed(1)}% less interest paid
                  </div>
                </div>
                <div className="card-base p-5 border-t-4 border-teal-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tenure Reduced</div>
                  <div className="text-xl font-extrabold text-teal-700">{tenureSavedStr}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {tenureWithStr} instead of {tenureWithoutStr}
                  </div>
                </div>
                <div className="card-base p-5 border-t-4 border-amber-500">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly EMI</div>
                  <div className="text-xl font-extrabold text-amber-700">{formatINR(result.emi)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    EMI stays same, tenure reduces
                  </div>
                </div>
              </div>

              {/* ── Outstanding Balance Chart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Outstanding Loan Balance</h3>
                <p className="text-sm text-slate-500 mb-6">See how your balance drops faster with prepayment</p>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.withoutPrepay }} />
                    <span className="text-slate-600">Without Prepayment</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.withPrepay }} />
                    <span className="text-slate-600">With Prepayment</span>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.withoutPrepay} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.withoutPrepay} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradWith" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.withPrepay} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={COLORS.withPrepay} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label = name === 'without' ? 'Without Prepayment' : 'With Prepayment';
                          return [formatINR(value), label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600, color: '#334155' }}
                      />
                      <Area type="monotone" dataKey="without" stroke={COLORS.withoutPrepay} fill="url(#gradWithout)" strokeWidth={2.5} name="without" />
                      <Area type="monotone" dataKey="with" stroke={COLORS.withPrepay} fill="url(#gradWith)" strokeWidth={2.5} name="with" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Interest Comparison BarChart ── */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Interest Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Interest paid each year with and without prepayment</p>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interestChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label = name === 'without' ? 'Without Prepayment' : 'With Prepayment';
                          return [formatINR(value), label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend
                        iconType="circle"
                        formatter={(value: string) => value === 'without' ? 'Without Prepayment' : 'With Prepayment'}
                      />
                      <Bar dataKey="without" name="without" fill={COLORS.withoutPrepay} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="with" name="with" fill={COLORS.withPrepay} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Comparison Summary Table ── */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Comparison Summary</h3>
                  <p className="text-sm text-slate-500 mb-4">Side-by-side: Without vs With Prepayment</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Metric</th>
                        <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: COLORS.withoutPrepay }}>Without Prepayment</th>
                        <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: COLORS.withPrepay }}>With Prepayment</th>
                        <th className="text-right py-3 px-4 font-semibold text-emerald-600 text-xs uppercase tracking-wider">Benefit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-primary-700">Total Interest Paid</td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">{formatINR(result.totalInterestWithout)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatINR(result.totalInterestWith)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatINR(result.interestSaved)} saved</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-primary-700">Total Amount Paid</td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">{formatINR(result.totalPaidWithout)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatINR(result.totalPaidWith)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatINR(result.totalPaidWithout - result.totalPaidWith)} less</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-primary-700">Loan Tenure</td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">{tenureWithoutStr}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-medium">{tenureWithStr}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">{tenureSavedStr} saved</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-primary-700">Monthly EMI</td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">{formatINR(result.emi)}</td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">{formatINR(result.emi)}</td>
                        <td className="py-3 px-4 text-right text-slate-400 text-xs">Same EMI</td>
                      </tr>
                      <tr className="bg-surface-100">
                        <td className="py-3 px-4 font-medium text-primary-700">Total Prepayment</td>
                        <td className="py-3 px-4 text-right text-slate-400">---</td>
                        <td className="py-3 px-4 text-right text-teal-700 font-medium">{formatINR(result.totalPrepaymentsMade)}</td>
                        <td className="py-3 px-4 text-right text-teal-600 text-xs font-semibold">
                          {((result.interestSaved / result.totalPrepaymentsMade) * 100).toFixed(0)}% return on prepayment
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Amortization Table (with prepayment) ── */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Amortization</h3>
                  <p className="text-sm text-slate-500 mb-4">With prepayment schedule showing principal, interest, and prepayments</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Opening</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Principal</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Interest</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-emerald-600 text-xs uppercase tracking-wider">Prepaid</th>
                        <th className="text-right py-3 px-2 sm:px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.withSchedule.map((row) => (
                        <tr
                          key={row.year}
                          className={cn(
                            'border-b border-surface-200 hover:bg-surface-100/50 transition-colors',
                            row.prepayment > 0 && 'bg-emerald-50/30'
                          )}
                        >
                          <td className="py-3 px-2 sm:px-3 font-medium text-primary-700">
                            <div className="flex items-center gap-1.5">
                              Yr {row.year}
                              {row.prepayment > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">Prepaid</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right text-slate-600">{formatINR(row.opening)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right text-brand-700 font-medium">{formatINR(row.principal)}</td>
                          <td className="py-3 px-2 sm:px-3 text-right text-amber-700 font-medium">{formatINR(row.interest)}</td>
                          <td className={cn('py-3 px-2 sm:px-3 text-right font-medium', row.prepayment > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                            {row.prepayment > 0 ? formatINR(row.prepayment) : '---'}
                          </td>
                          <td className={cn(
                            'py-3 px-2 sm:px-3 text-right font-semibold',
                            row.closing === 0 ? 'text-emerald-600' : 'text-primary-700'
                          )}>
                            {row.closing === 0 ? 'Loan Closed' : formatINR(row.closing)}
                          </td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="bg-surface-100 font-bold">
                        <td className="py-3 px-2 sm:px-3 text-primary-700">Total</td>
                        <td className="py-3 px-2 sm:px-3 text-right text-slate-400">---</td>
                        <td className="py-3 px-2 sm:px-3 text-right text-brand-700">
                          {formatINR(result.withSchedule.reduce((s, r) => s + r.principal, 0))}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-amber-700">
                          {formatINR(result.totalInterestWith)}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-emerald-700">
                          {formatINR(result.totalPrepaymentsMade)}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-right text-primary-700">---</td>
                      </tr>
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
