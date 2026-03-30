'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, IndianRupee, Percent, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  principal: '#0F766E',
  interest: '#E8553A',
  emi: '#2563EB',
  balance: '#7C3AED',
};

const LOAN_PRESETS = [
  { label: 'Home Loan', amount: 5000000, rate: 8.5, tenure: 20 },
  { label: 'Car Loan', amount: 800000, rate: 9, tenure: 5 },
  { label: 'Personal Loan', amount: 500000, rate: 12, tenure: 3 },
  { label: 'Education Loan', amount: 1000000, rate: 10, tenure: 7 },
];

export default function EMICalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [activePreset, setActivePreset] = useState(0);

  const applyPreset = (index: number) => {
    const preset = LOAN_PRESETS[index];
    setLoanAmount(preset.amount);
    setInterestRate(preset.rate);
    setTenure(preset.tenure);
    setActivePreset(index);
  };

  const result = useMemo(() => {
    const P = loanAmount;
    const annualRate = interestRate;
    const r = annualRate / 12 / 100;
    const n = tenure * 12;

    // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const pow = Math.pow(1 + r, n);
    const emi = r > 0 ? (P * r * pow) / (pow - 1) : P / n;
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;
    const interestToRatio = P > 0 ? ((totalInterest / P) * 100) : 0;

    // Year-by-year amortization
    const yearlyData: {
      year: number;
      openingBalance: number;
      emiPaid: number;
      principalPaid: number;
      interestPaid: number;
      closingBalance: number;
    }[] = [];

    let balance = P;

    for (let y = 1; y <= tenure; y++) {
      const opening = balance;
      let yearPrincipal = 0;
      let yearInterest = 0;
      const monthsInYear = y === tenure ? n - (y - 1) * 12 : 12;

      for (let m = 0; m < monthsInYear; m++) {
        const monthInterest = balance * r;
        const monthPrincipal = emi - monthInterest;
        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        balance -= monthPrincipal;
      }

      if (balance < 0) balance = 0;

      yearlyData.push({
        year: y,
        openingBalance: Math.round(opening),
        emiPaid: Math.round(emi * monthsInYear),
        principalPaid: Math.round(yearPrincipal),
        interestPaid: Math.round(yearInterest),
        closingBalance: Math.round(balance),
      });
    }

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      interestToRatio: interestToRatio.toFixed(1),
      yearlyData,
    };
  }, [loanAmount, interestRate, tenure]);

  const chartData = result.yearlyData.map((row) => ({
    year: `Yr ${row.year}`,
    principal: row.principalPaid,
    interest: row.interestPaid,
  }));

  const pieData = [
    { name: 'Principal', value: loanAmount, color: COLORS.principal },
    { name: 'Total Interest', value: result.totalInterest, color: COLORS.interest },
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
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">EMI Calculator</h1>
              <p className="text-slate-300 mt-1">Calculate your loan EMI, total interest, and view detailed amortization schedule</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure EMI</h2>

              {/* Loan Type Presets */}
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">Loan Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOAN_PRESETS.map((preset, index) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(index)}
                      className={cn(
                        'flex-1 text-[10px] font-semibold py-2 rounded-lg border transition-colors',
                        activePreset === index
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <NumberInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} prefix="₹" step={50000} min={100000} max={100000000} />
                <NumberInput label="Interest Rate" value={interestRate} onChange={setInterestRate} suffix="% p.a." step={0.1} min={1} max={25} />
                <NumberInput label="Loan Tenure" value={tenure} onChange={setTenure} suffix="Years" step={1} min={1} max={30} />
              </div>

              {/* Summary Cards */}
              <div className="mt-8 space-y-3">
                {/* EMI - Large Gradient Card */}
                <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Monthly EMI</span>
                  </div>
                  <div className="text-2xl font-extrabold gradient-text">{formatINR(result.emi)}</div>
                </div>

                {/* Other summary cards */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-red-500" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Interest</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatINR(result.totalInterest)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Total Amount</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">{formatINR(result.totalPayment)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <span className="text-[11px] text-slate-500 font-medium">Interest / Principal</span>
                  </div>
                  <span className="text-sm font-bold text-teal-700">{result.interestToRatio}%</span>
                </div>
              </div>
            </div>

            {/* Charts & Table */}
            <div className="space-y-8">
              {/* PDF Download Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-700">Results</h3>
                <DownloadPDFButton elementId="calculator-results" title="EMI Calculator" fileName="emi-calculator" />
              </div>

              {/* Principal vs Interest Area Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Principal vs Interest Paid Per Year</h3>
                <p className="text-sm text-slate-500 mb-6">How your EMI splits between principal repayment and interest over the loan tenure</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="emiGradPrincipal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.principal} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.principal} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="emiGradInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.interest} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.interest} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'principal' ? 'Principal Paid' : 'Interest Paid',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="principal" stroke={COLORS.principal} fill="url(#emiGradPrincipal)" strokeWidth={2} name="Principal Paid" />
                      <Area type="monotone" dataKey="interest" stroke={COLORS.interest} fill="url(#emiGradInterest)" strokeWidth={2} name="Interest Paid" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart - Principal vs Interest Split */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Principal vs Interest Split</h3>
                <p className="text-sm text-slate-500 mb-6">Overall breakup of total amount paid over {tenure} years</p>
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

              {/* Amortization Table */}
              <div className="card-base overflow-hidden">
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Amortization Schedule</h3>
                  <p className="text-sm text-slate-500 mb-4">Detailed breakdown of principal, interest, and outstanding balance each year</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Opening Balance</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">EMI Paid</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Principal</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Interest</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => (
                        <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                          <td className="py-3 px-6 font-medium text-primary-700">Year {row.year}</td>
                          <td className="py-3 px-6 text-right text-slate-600">{formatINR(row.openingBalance)}</td>
                          <td className="py-3 px-6 text-right font-medium text-blue-600">{formatINR(row.emiPaid)}</td>
                          <td className="py-3 px-6 text-right text-positive font-medium">{formatINR(row.principalPaid)}</td>
                          <td className="py-3 px-6 text-right text-red-500">{formatINR(row.interestPaid)}</td>
                          <td className="py-3 px-6 text-right font-semibold text-primary-700">{formatINR(row.closingBalance)}</td>
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
