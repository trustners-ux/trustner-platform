'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Car, ArrowLeft, IndianRupee, Percent, TrendingUp, Scale, CheckCircle, XCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  loan: '#2563EB',
  cash: '#0F766E',
  interest: '#E8553A',
  returns: '#10B981',
};

export default function CarLoanVsCashCalculatorPage() {
  const [carPrice, setCarPrice] = useState(1200000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanRate, setLoanRate] = useState(9);
  const [tenure, setTenure] = useState(5);
  const [investReturnRate, setInvestReturnRate] = useState(12);

  const result = useMemo(() => {
    const downPayment = carPrice * (downPaymentPct / 100);
    const loanAmount = carPrice - downPayment;
    const months = tenure * 12;
    const monthlyLoanRate = loanRate / 100 / 12;
    const monthlyInvestRate = investReturnRate / 100 / 12;

    // --- EMI calculation ---
    let emi = 0;
    if (loanAmount > 0 && monthlyLoanRate > 0 && months > 0) {
      emi = loanAmount * monthlyLoanRate * Math.pow(1 + monthlyLoanRate, months) /
        (Math.pow(1 + monthlyLoanRate, months) - 1);
    } else if (loanAmount > 0 && months > 0) {
      emi = loanAmount / months;
    }

    const totalLoanPaid = emi * months + downPayment;
    const totalInterest = totalLoanPaid - carPrice;

    // --- LOAN PATH ---
    // Pay down payment, take loan (EMI monthly).
    // The remaining cash (carPrice - downPayment = loanAmount) stays invested as lumpsum.
    // Lumpsum grows at investReturnRate for tenure years.
    const loanPathLumpsumFV = loanAmount * Math.pow(1 + investReturnRate / 100, tenure);
    // Net wealth (loan path) = investment corpus - total loan cost (excluding down payment already accounted)
    // Total out of pocket in loan path = downPayment + EMI * months
    // Investment corpus = loanAmount invested as lumpsum
    const loanPathWealth = loanPathLumpsumFV;
    const loanPathCost = totalLoanPaid; // downPayment + EMI * months

    // --- CASH PATH ---
    // Pay full car price upfront. No EMI burden.
    // Invest EMI amount monthly as SIP for tenure years.
    let cashPathSIPFV = 0;
    if (monthlyInvestRate > 0 && months > 0) {
      cashPathSIPFV = emi * ((Math.pow(1 + monthlyInvestRate, months) - 1) / monthlyInvestRate) *
        (1 + monthlyInvestRate);
    } else {
      cashPathSIPFV = emi * months;
    }
    const cashPathWealth = cashPathSIPFV;
    const cashPathCost = carPrice; // paid upfront

    // Opportunity cost of cash = what full car price would have earned
    const opportunityCostCash = carPrice * Math.pow(1 + investReturnRate / 100, tenure) - carPrice;

    // --- Net comparison ---
    // Loan path net = wealth accumulated - extra cost paid over car price
    // Cash path net = wealth accumulated (SIP of EMI)
    // But to truly compare: both paths end up owning the car.
    // Loan path final position = loanPathLumpsumFV - totalInterest (extra cost of loan)
    // Cash path final position = cashPathSIPFV (no extra cost, but opportunity cost is implicit)
    // Better comparison: Net financial position = wealth - total money spent beyond car price
    const loanNetPosition = loanPathLumpsumFV - totalInterest;
    const cashNetPosition = cashPathSIPFV;

    const advantage = Math.abs(loanNetPosition - cashNetPosition);
    const verdict: 'loan' | 'cash' = loanNetPosition > cashNetPosition ? 'loan' : 'cash';

    // --- Break-even return rate (binary search) ---
    let breakEvenRate = 0;
    let lo = 0, hi = 50;
    for (let iter = 0; iter < 100; iter++) {
      const mid = (lo + hi) / 2;
      const midMonthly = mid / 100 / 12;

      // Loan path at mid rate
      const lumpFV = loanAmount * Math.pow(1 + mid / 100, tenure);
      const loanNet = lumpFV - totalInterest;

      // Cash path at mid rate
      let sipFV = 0;
      if (midMonthly > 0 && months > 0) {
        sipFV = emi * ((Math.pow(1 + midMonthly, months) - 1) / midMonthly) * (1 + midMonthly);
      } else {
        sipFV = emi * months;
      }
      const cashNet = sipFV;

      if (loanNet > cashNet) {
        hi = mid;
      } else {
        lo = mid;
      }
      breakEvenRate = mid;
    }

    // --- Year-by-year trajectory ---
    const yearlyData = [];
    for (let y = 1; y <= tenure; y++) {
      const m = y * 12;

      // Loan path: lumpsum growth
      const lumpAtY = loanAmount * Math.pow(1 + investReturnRate / 100, y);
      // Total paid so far in loan path
      const loanPaidAtY = downPayment + emi * m;
      const loanWealthAtY = lumpAtY - (loanPaidAtY - carPrice); // subtract extra paid over car price

      // Cash path: SIP growth
      let sipAtY = 0;
      const mr = monthlyInvestRate;
      if (mr > 0 && m > 0) {
        sipAtY = emi * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr);
      } else {
        sipAtY = emi * m;
      }

      yearlyData.push({
        year: `Year ${y}`,
        loanWealth: Math.round(lumpAtY),
        cashWealth: Math.round(sipAtY),
        loanNet: Math.round(loanWealthAtY),
        cashNet: Math.round(sipAtY),
      });
    }

    return {
      downPayment,
      loanAmount,
      emi: Math.round(emi),
      totalLoanPaid: Math.round(totalLoanPaid),
      totalInterest: Math.round(totalInterest),
      opportunityCostCash: Math.round(opportunityCostCash),
      loanPathWealth: Math.round(loanPathLumpsumFV),
      cashPathWealth: Math.round(cashPathSIPFV),
      loanNetPosition: Math.round(loanNetPosition),
      cashNetPosition: Math.round(cashNetPosition),
      advantage: Math.round(advantage),
      verdict,
      breakEvenRate: Math.round(breakEvenRate * 10) / 10,
      yearlyData,
    };
  }, [carPrice, downPaymentPct, loanRate, tenure, investReturnRate]);

  const barData = [
    {
      metric: 'Total Paid',
      loan: result.totalLoanPaid,
      cash: carPrice,
    },
    {
      metric: 'Investment Corpus',
      loan: result.loanPathWealth,
      cash: result.cashPathWealth,
    },
    {
      metric: 'Net Position',
      loan: result.loanNetPosition,
      cash: result.cashNetPosition,
    },
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
              <Car className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Car Loan vs Paying Cash</h1>
              <p className="text-slate-300 mt-1">Should you finance or pay upfront? Let the numbers decide.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-6 text-lg">Configure Scenario</h2>

              <div className="space-y-5">
                <NumberInput label="Car Price" value={carPrice} onChange={setCarPrice} prefix="₹" step={50000} min={300000} max={10000000} />
                <NumberInput label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} suffix="%" step={5} min={0} max={50} />
                <NumberInput label="Loan Interest Rate" value={loanRate} onChange={setLoanRate} suffix="%" step={0.1} min={5} max={18} />
                <NumberInput label="Loan Tenure" value={tenure} onChange={setTenure} suffix="Years" step={1} min={1} max={7} />

                <div className="border-t border-surface-300 pt-5">
                  <NumberInput
                    label="Investment Return Rate"
                    value={investReturnRate}
                    onChange={setInvestReturnRate}
                    suffix="%"
                    step={0.5}
                    min={6}
                    max={20}
                    hint="What your money could earn if invested instead"
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly EMI</div>
                  <div className="text-lg font-extrabold text-blue-600">{formatINR(result.emi)}</div>
                </div>
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Interest</div>
                  <div className="text-lg font-extrabold text-red-500">{formatINR(result.totalInterest)}</div>
                </div>
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Loan Path Corpus</div>
                  <div className="text-lg font-extrabold text-blue-600">{formatINR(result.loanPathWealth)}</div>
                </div>
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cash Path Corpus</div>
                  <div className="text-lg font-extrabold text-teal-600">{formatINR(result.cashPathWealth)}</div>
                </div>
              </div>

              {/* Verdict Card */}
              <div className={cn(
                'mt-4 rounded-xl p-5 text-center',
                result.verdict === 'loan'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                  : 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200'
              )}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className={cn('w-6 h-6', result.verdict === 'loan' ? 'text-blue-600' : 'text-teal-600')} />
                  <span className={cn('text-lg font-extrabold', result.verdict === 'loan' ? 'text-blue-700' : 'text-teal-700')}>
                    {result.verdict === 'loan' ? 'Take the Loan' : 'Pay Cash'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">You save {formatINR(result.advantage)} over {tenure} years</p>
                <p className="text-xs text-slate-400 mt-1">Loan wins when investments earn above {result.breakEvenRate}% p.a.</p>
              </div>
            </div>

            {/* Charts & Analysis */}
            <div className="space-y-8">
              <div className="flex justify-end">
                <DownloadPDFButton elementId="calculator-results" title="Car Loan vs Cash Calculator" fileName="car-loan-vs-cash-calculator" />
              </div>

              {/* Verdict Banner */}
              <div className={cn(
                'rounded-xl p-6 text-center',
                result.verdict === 'loan'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                  : 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200'
              )} data-pdf-keep-together>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <CheckCircle className={cn('w-8 h-8', result.verdict === 'loan' ? 'text-blue-600' : 'text-teal-600')} />
                  <span className={cn('text-2xl font-extrabold', result.verdict === 'loan' ? 'text-blue-700' : 'text-teal-700')}>
                    {result.verdict === 'loan' ? 'Take the Loan & Invest the Difference' : 'Pay Cash — You Save More'}
                  </span>
                </div>
                <p className="text-base text-slate-600">
                  The {result.verdict === 'loan' ? 'loan' : 'cash'} path puts you ahead by <strong>{formatINR(result.advantage)}</strong> over {tenure} years.
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Break-even: Loan becomes better when your investments earn above <strong>{result.breakEvenRate}%</strong> p.a.
                </p>
              </div>

              {/* Wealth Comparison Bar Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Wealth Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Total paid, investment corpus, and net position for each path</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'loan' ? 'Loan Path' : 'Cash Path',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="loan" name="Loan Path" fill={COLORS.loan} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cash" name="Cash Path" fill={COLORS.cash} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wealth Trajectory Area Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Wealth Trajectory</h3>
                <p className="text-sm text-slate-500 mb-6">Year-by-year investment growth in each scenario</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradLoan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.loan} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.loan} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatINR(value),
                          name === 'loanWealth' ? 'Loan Path Investment' : 'Cash Path SIP',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="loanWealth" stroke={COLORS.loan} fill="url(#gradLoan)" strokeWidth={2} name="loanWealth" />
                      <Area type="monotone" dataKey="cashWealth" stroke={COLORS.cash} fill="url(#gradCash)" strokeWidth={2} name="cashWealth" />
                      <Legend
                        iconType="circle"
                        formatter={(value: string) => value === 'loanWealth' ? 'Loan Path (Lumpsum)' : 'Cash Path (SIP)'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Detailed Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">Side-by-side breakdown of both paths</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Metric</th>
                        <th className="text-right py-3 px-6 font-semibold text-blue-600 text-xs uppercase tracking-wider">Loan Path</th>
                        <th className="text-right py-3 px-6 font-semibold text-teal-600 text-xs uppercase tracking-wider">Cash Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Car Price</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(carPrice)}</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(carPrice)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Down Payment</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(result.downPayment)}</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(carPrice)} (full)</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Loan Amount</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(result.loanAmount)}</td>
                        <td className="py-3 px-6 text-right text-slate-400">N/A</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Monthly EMI</td>
                        <td className="py-3 px-6 text-right text-blue-600 font-semibold">{formatINR(result.emi)}</td>
                        <td className="py-3 px-6 text-right text-slate-400">None</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Total Amount Paid</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(result.totalLoanPaid)}</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(carPrice)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Interest Paid on Loan</td>
                        <td className="py-3 px-6 text-right text-red-500 font-semibold">{formatINR(result.totalInterest)}</td>
                        <td className="py-3 px-6 text-right text-green-600">₹0</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Investment Strategy</td>
                        <td className="py-3 px-6 text-right text-slate-600 text-xs">Loan amount as lumpsum</td>
                        <td className="py-3 px-6 text-right text-slate-600 text-xs">EMI amount as monthly SIP</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Investment Corpus</td>
                        <td className="py-3 px-6 text-right text-blue-600 font-semibold">{formatINR(result.loanPathWealth)}</td>
                        <td className="py-3 px-6 text-right text-teal-600 font-semibold">{formatINR(result.cashPathWealth)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Net Financial Position</td>
                        <td className="py-3 px-6 text-right font-bold text-blue-700">{formatINR(result.loanNetPosition)}</td>
                        <td className="py-3 px-6 text-right font-bold text-teal-700">{formatINR(result.cashNetPosition)}</td>
                      </tr>
                      <tr className="bg-surface-100">
                        <td className="py-3 px-6 font-bold text-primary-700">Verdict</td>
                        <td colSpan={2} className="py-3 px-6 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold',
                            result.verdict === 'loan'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-teal-100 text-teal-700'
                          )}>
                            <CheckCircle className="w-4 h-4" />
                            {result.verdict === 'loan' ? 'Loan Path Wins' : 'Cash Path Wins'} by {formatINR(result.advantage)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Year-by-Year Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Year-by-Year Wealth Growth</h3>
                  <p className="text-sm text-slate-500 mb-4">Investment corpus trajectory for each path</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Year</th>
                        <th className="text-right py-3 px-6 font-semibold text-blue-600 text-xs uppercase tracking-wider">Loan Path Corpus</th>
                        <th className="text-right py-3 px-6 font-semibold text-teal-600 text-xs uppercase tracking-wider">Cash Path Corpus</th>
                        <th className="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyData.map((row) => {
                        const diff = row.loanWealth - row.cashWealth;
                        return (
                          <tr key={row.year} className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                            <td className="py-3 px-6 font-medium text-primary-700">{row.year}</td>
                            <td className="py-3 px-6 text-right font-semibold text-blue-600">{formatINR(row.loanWealth)}</td>
                            <td className="py-3 px-6 text-right font-semibold text-teal-600">{formatINR(row.cashWealth)}</td>
                            <td className="py-3 px-6 text-right">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                diff > 0 ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
                              )}>
                                {diff > 0 ? '+' : ''}{formatINR(diff)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insight Note */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="font-bold text-primary-700 mb-2">How This Works</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  This calculator compares two paths to buying the same car:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.loan }} />
                    <div>
                      <strong className="text-blue-700">Loan Path:</strong>
                      <span className="text-slate-600"> Pay down payment, take a car loan, and invest the remaining cash (loan amount) as a lumpsum. The investment grows while you pay EMIs.</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.cash }} />
                    <div>
                      <strong className="text-teal-700">Cash Path:</strong>
                      <span className="text-slate-600"> Pay the full car price upfront. Since you have no EMI burden, invest the EMI amount monthly as a SIP.</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  The verdict depends on whether lumpsum growth (loan path) beats SIP growth (cash path) minus the loan interest cost.
                  Higher investment returns favour the loan path; lower returns favour paying cash.
                </p>
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
