'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Landmark, ArrowLeft, IndianRupee, Percent, Clock, AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

const COLORS = {
  fd: '#0F766E',
  loan: '#E8553A',
  principal: '#2563EB',
  interest: '#DC2626',
  fee: '#D97706',
  savings: '#059669',
};

const TAX_BRACKETS = [0, 5, 10, 15, 20, 30];

export default function FDvsLoanCalculatorPage() {
  // FD Details
  const [fdAmount, setFdAmount] = useState(1000000);
  const [fdRate, setFdRate] = useState(7);
  const [fdRemainingTenure, setFdRemainingTenure] = useState(2);
  const [prematurePenalty, setPrematurePenalty] = useState(1);
  const [amountNeeded, setAmountNeeded] = useState(500000);

  // Loan Details
  const [loanRate, setLoanRate] = useState(11);
  const [loanTenure, setLoanTenure] = useState(2);
  const [processingFee, setProcessingFee] = useState(2);

  // Tax
  const [taxBracket, setTaxBracket] = useState(20);

  const result = useMemo(() => {
    const taxRate = taxBracket / 100;

    // --- OPTION A: Break FD ---
    // FD maturity value if held to full remaining tenure at original rate
    const fdMaturityValue = fdAmount * Math.pow(1 + fdRate / 100, fdRemainingTenure);
    const fdInterestAtMaturity = fdMaturityValue - fdAmount;
    const fdTaxOnInterest = fdInterestAtMaturity * taxRate;
    const fdNetInterest = fdInterestAtMaturity - fdTaxOnInterest;

    // Proportion of FD being broken
    const breakFraction = Math.min(amountNeeded / fdAmount, 1);

    // Interest lost by breaking (proportional to amount needed vs FD amount)
    const interestLostGross = fdInterestAtMaturity * breakFraction;
    const taxSavedOnLostInterest = interestLostGross * taxRate;
    const interestLostNet = interestLostGross - taxSavedOnLostInterest;

    // Penalty cost: the bank reduces rate by penalty%, so you also lose penalty interest on the broken portion
    // For the elapsed period (which we approximate as: whatever was earned is now at reduced rate)
    // Simplified: penalty cost = broken amount * penalty% * remaining tenure
    const penaltyCost = (fdAmount * breakFraction) * (prematurePenalty / 100) * fdRemainingTenure;

    // Total cost of breaking FD
    const costOfBreakingFD = interestLostNet + penaltyCost;

    // --- OPTION B: Take Loan ---
    const loanAmount = amountNeeded;
    const loanMonths = loanTenure * 12;
    const monthlyLoanRate = loanRate / 100 / 12;

    let emi = 0;
    if (loanAmount > 0 && monthlyLoanRate > 0 && loanMonths > 0) {
      emi = loanAmount * monthlyLoanRate * Math.pow(1 + monthlyLoanRate, loanMonths) /
        (Math.pow(1 + monthlyLoanRate, loanMonths) - 1);
    } else if (loanAmount > 0 && loanMonths > 0) {
      emi = loanAmount / loanMonths;
    }

    const totalLoanRepayment = emi * loanMonths;
    const totalLoanInterest = totalLoanRepayment - loanAmount;
    const processingFeeAmount = loanAmount * (processingFee / 100);
    const costOfTakingLoan = totalLoanInterest + processingFeeAmount;

    // --- VERDICT ---
    const verdict: 'break-fd' | 'take-loan' = costOfBreakingFD < costOfTakingLoan ? 'break-fd' : 'take-loan';
    const savings = Math.abs(costOfBreakingFD - costOfTakingLoan);

    // --- Chart data ---
    const comparisonBarData = [
      {
        option: 'Break FD',
        cost: Math.round(costOfBreakingFD),
      },
      {
        option: 'Take Loan',
        cost: Math.round(costOfTakingLoan),
      },
    ];

    const loanPieData = [
      { name: 'Principal', value: Math.round(loanAmount) },
      { name: 'Interest', value: Math.round(totalLoanInterest) },
      { name: 'Processing Fee', value: Math.round(processingFeeAmount) },
    ].filter((d) => d.value > 0);

    return {
      // FD values
      fdMaturityValue: Math.round(fdMaturityValue),
      fdInterestAtMaturity: Math.round(fdInterestAtMaturity),
      fdTaxOnInterest: Math.round(fdTaxOnInterest),
      fdNetInterest: Math.round(fdNetInterest),
      interestLostGross: Math.round(interestLostGross),
      interestLostNet: Math.round(interestLostNet),
      penaltyCost: Math.round(penaltyCost),
      costOfBreakingFD: Math.round(costOfBreakingFD),
      breakFraction,

      // Loan values
      emi: Math.round(emi),
      totalLoanRepayment: Math.round(totalLoanRepayment),
      totalLoanInterest: Math.round(totalLoanInterest),
      processingFeeAmount: Math.round(processingFeeAmount),
      costOfTakingLoan: Math.round(costOfTakingLoan),

      // Verdict
      verdict,
      savings: Math.round(savings),

      // Charts
      comparisonBarData,
      loanPieData,
    };
  }, [fdAmount, fdRate, fdRemainingTenure, prematurePenalty, amountNeeded, loanRate, loanTenure, processingFee, taxBracket]);

  const PIE_COLORS = [COLORS.principal, COLORS.interest, COLORS.fee];

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
              <Landmark className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Break FD vs Take Loan</h1>
              <p className="text-slate-300 mt-1">Should you break your FD or borrow? Let the numbers decide.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* Input Panel */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              {/* FD Details */}
              <h2 className="font-bold text-primary-700 mb-5 text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-600" /> FD Details
              </h2>

              <div className="space-y-5">
                <NumberInput label="FD Amount" value={fdAmount} onChange={setFdAmount} prefix="₹" step={10000} min={10000} max={100000000} />
                <NumberInput label="FD Interest Rate" value={fdRate} onChange={setFdRate} suffix="% p.a." step={0.1} min={3} max={10} />
                <NumberInput label="FD Remaining Tenure" value={fdRemainingTenure} onChange={setFdRemainingTenure} suffix="Years" step={0.5} min={0.5} max={10} />
                <NumberInput label="Premature Withdrawal Penalty" value={prematurePenalty} onChange={setPrematurePenalty} suffix="%" step={0.25} min={0} max={3} hint="Rate reduction applied by bank on early closure" />
                <NumberInput label="Amount Needed" value={amountNeeded} onChange={setAmountNeeded} prefix="₹" step={10000} min={10000} max={100000000} />
              </div>

              {/* Loan Details */}
              <div className="border-t border-surface-300 mt-6 pt-5">
                <h2 className="font-bold text-primary-700 mb-5 text-lg flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-red-500" /> Loan Details
                </h2>
                <div className="space-y-5">
                  <NumberInput label="Loan Interest Rate" value={loanRate} onChange={setLoanRate} suffix="% p.a." step={0.1} min={5} max={25} />
                  <NumberInput label="Loan Tenure" value={loanTenure} onChange={setLoanTenure} suffix="Years" step={0.5} min={0.5} max={10} />
                  <NumberInput label="Processing Fee" value={processingFee} onChange={setProcessingFee} suffix="%" step={0.25} min={0} max={5} />
                </div>
              </div>

              {/* Tax Bracket */}
              <div className="border-t border-surface-300 mt-6 pt-5">
                <h2 className="font-bold text-primary-700 mb-3 text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" /> Tax Bracket
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {TAX_BRACKETS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxBracket(rate)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-semibold transition-all border',
                        taxBracket === rate
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'bg-white text-slate-600 border-surface-300 hover:border-teal-300 hover:bg-teal-50'
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">FD Maturity Value</div>
                  <div className="text-lg font-extrabold text-teal-600">{formatINR(result.fdMaturityValue)}</div>
                </div>
                <div className="rounded-xl p-3 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Lost Interest (if broken)</div>
                  <div className="text-lg font-extrabold text-red-500">{formatINR(result.interestLostNet + result.penaltyCost)}</div>
                </div>
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Loan Interest + Fees</div>
                  <div className="text-lg font-extrabold text-red-500">{formatINR(result.costOfTakingLoan)}</div>
                </div>
                <div className="rounded-xl p-3 bg-surface-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly EMI (if loan)</div>
                  <div className="text-lg font-extrabold text-blue-600">{formatINR(result.emi)}</div>
                </div>
              </div>

              {/* Verdict Card */}
              <div className={cn(
                'mt-4 rounded-xl p-5 text-center',
                result.verdict === 'break-fd'
                  ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
              )}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className={cn('w-6 h-6', result.verdict === 'break-fd' ? 'text-teal-600' : 'text-orange-600')} />
                  <span className={cn('text-lg font-extrabold', result.verdict === 'break-fd' ? 'text-teal-700' : 'text-orange-700')}>
                    {result.verdict === 'break-fd' ? 'Break the FD' : 'Take the Loan'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">You save {formatINR(result.savings)} with this option</p>
              </div>
            </div>

            {/* Charts & Analysis */}
            <div className="space-y-8">
              <div className="flex justify-end">
                <DownloadPDFButton elementId="calculator-results" title="Break FD vs Take Loan Calculator" fileName="fd-vs-loan-calculator" />
              </div>

              {/* Verdict Banner */}
              <div className={cn(
                'rounded-xl p-6 text-center',
                result.verdict === 'break-fd'
                  ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
              )} data-pdf-keep-together>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Scale className={cn('w-8 h-8', result.verdict === 'break-fd' ? 'text-teal-600' : 'text-orange-600')} />
                  <span className={cn('text-2xl font-extrabold', result.verdict === 'break-fd' ? 'text-teal-700' : 'text-orange-700')}>
                    {result.verdict === 'break-fd'
                      ? 'Break the FD — It Costs Less'
                      : 'Take the Loan — Keep Your FD Growing'}
                  </span>
                </div>
                <p className="text-base text-slate-600">
                  {result.verdict === 'break-fd'
                    ? <>Breaking your FD saves you <strong>{formatINR(result.savings)}</strong> compared to taking a loan.</>
                    : <>Taking a loan saves you <strong>{formatINR(result.savings)}</strong> compared to breaking your FD.</>}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Cost of breaking FD: <strong>{formatINR(result.costOfBreakingFD)}</strong> | Cost of loan: <strong>{formatINR(result.costOfTakingLoan)}</strong>
                </p>
              </div>

              {/* Cost Comparison Bar Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Cost Comparison</h3>
                <p className="text-sm text-slate-500 mb-6">Total cost of each option side-by-side</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.comparisonBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="option" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Total Cost']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="cost" name="Total Cost" radius={[6, 6, 0, 0]}>
                        {result.comparisonBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.fd : COLORS.loan} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Loan Cost Breakdown Pie Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Loan Cost Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">How the loan amount is distributed across principal, interest, and fees</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={result.loanPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {result.loanPieData.map((_, index) => (
                          <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatINR(value), name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Comparison Table */}
              <div className="card-base overflow-hidden" data-pdf-keep-together>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">Detailed Comparison</h3>
                  <p className="text-sm text-slate-500 mb-4">Side-by-side breakdown of both options</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Parameter</th>
                        <th className="text-right py-3 px-6 font-semibold text-teal-600 text-xs uppercase tracking-wider">Break FD</th>
                        <th className="text-right py-3 px-6 font-semibold text-orange-600 text-xs uppercase tracking-wider">Take Loan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Amount Available / Borrowed</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(amountNeeded)}</td>
                        <td className="py-3 px-6 text-right text-slate-600">{formatINR(amountNeeded)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Interest Lost / Paid</td>
                        <td className="py-3 px-6 text-right text-red-500 font-semibold">{formatINR(result.interestLostNet)}</td>
                        <td className="py-3 px-6 text-right text-red-500 font-semibold">{formatINR(result.totalLoanInterest)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Tax Impact</td>
                        <td className="py-3 px-6 text-right text-slate-600">
                          <span className="text-green-600">Tax saved: {formatINR(result.interestLostGross - result.interestLostNet)}</span>
                        </td>
                        <td className="py-3 px-6 text-right text-slate-400">No tax benefit</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Penalty Cost</td>
                        <td className="py-3 px-6 text-right text-red-500 font-semibold">{formatINR(result.penaltyCost)}</td>
                        <td className="py-3 px-6 text-right text-slate-400">N/A</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Processing Fee</td>
                        <td className="py-3 px-6 text-right text-slate-400">N/A</td>
                        <td className="py-3 px-6 text-right text-amber-600 font-semibold">{formatINR(result.processingFeeAmount)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-bold text-primary-700">Total Cost</td>
                        <td className="py-3 px-6 text-right font-bold text-teal-700">{formatINR(result.costOfBreakingFD)}</td>
                        <td className="py-3 px-6 text-right font-bold text-orange-700">{formatINR(result.costOfTakingLoan)}</td>
                      </tr>
                      <tr className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-primary-700">Monthly Outflow</td>
                        <td className="py-3 px-6 text-right text-green-600 font-semibold">None</td>
                        <td className="py-3 px-6 text-right text-blue-600 font-semibold">{formatINR(result.emi)}/mo</td>
                      </tr>
                      <tr className="bg-surface-100">
                        <td className="py-3 px-6 font-bold text-primary-700">Verdict</td>
                        <td colSpan={2} className="py-3 px-6 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold',
                            result.verdict === 'break-fd'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-orange-100 text-orange-700'
                          )}>
                            <CheckCircle className="w-4 h-4" />
                            {result.verdict === 'break-fd' ? 'Break FD' : 'Take Loan'} saves {formatINR(result.savings)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insight Note */}
              <div className="card-base p-6 bg-gradient-to-r from-amber-50 to-orange-50" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> How This Works
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  This calculator compares the true cost of two ways to get money when you have an existing FD:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.fd }} />
                    <div>
                      <strong className="text-teal-700">Break FD:</strong>
                      <span className="text-slate-600"> Withdraw from your fixed deposit early. You lose the remaining interest you would have earned, plus pay a premature withdrawal penalty. However, you avoid any loan EMIs.</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS.loan }} />
                    <div>
                      <strong className="text-orange-700">Take Loan:</strong>
                      <span className="text-slate-600"> Borrow the amount you need at a given interest rate. You pay interest on the loan plus processing fees, but your FD continues to earn interest until maturity.</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  The verdict depends on whether the interest you would lose (plus penalty) by breaking the FD is more or less than the loan interest and fees.
                  Lower FD rates and higher loan rates favour breaking the FD; higher FD rates and lower loan rates favour keeping the FD and borrowing.
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
