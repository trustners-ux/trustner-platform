'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, IndianRupee, Info, TrendingDown } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SWPCalculatorPage() {
  const [totalInvestment, setTotalInvestment] = useState(5000000);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(25000);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [years, setYears] = useState(15);

  const { chartData, remainingBalance, totalWithdrawn } = useMemo(() => {
    const data = [];
    const monthlyRate = expectedReturn / 12 / 100;
    let balance = totalInvestment;
    for (let y = 0; y <= years; y++) {
      data.push({
        year: `Year ${y}`,
        balance: Math.round(Math.max(0, balance)),
        withdrawn: y * 12 * monthlyWithdrawal,
      });
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) - monthlyWithdrawal;
        if (balance < 0) balance = 0;
      }
    }
    return {
      chartData: data,
      remainingBalance: Math.round(Math.max(0, balance)),
      totalWithdrawn: monthlyWithdrawal * years * 12,
    };
  }, [totalInvestment, monthlyWithdrawal, expectedReturn, years]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-orange-900 to-amber-800 text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-orange-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">SWP Calculator</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">SWP Calculator</h1>
          <p className="text-orange-200 max-w-2xl">
            Plan your Systematic Withdrawal Plan. Calculate how long your investments will last with regular withdrawals.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-xl font-bold text-gray-900 mb-6">SWP Details</h2>
              <div className="space-y-8">
                {/* Total Investment */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Total Corpus</label>
                    <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                      <IndianRupee className="w-3 h-3 text-blue-600" />
                      <input
                        type="number"
                        value={totalInvestment}
                        onChange={(e) => setTotalInvestment(Math.max(100000, Math.min(100000000, Number(e.target.value))))}
                        className="w-28 bg-transparent text-right text-blue-700 font-semibold text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range" min={100000} max={100000000} step={100000}
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(Number(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₹1 Lakh</span><span>₹10 Cr</span>
                  </div>
                </div>

                {/* Monthly Withdrawal */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Monthly Withdrawal</label>
                    <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg px-3 py-1">
                      <IndianRupee className="w-3 h-3 text-orange-600" />
                      <input
                        type="number"
                        value={monthlyWithdrawal}
                        onChange={(e) => setMonthlyWithdrawal(Math.max(1000, Math.min(1000000, Number(e.target.value))))}
                        className="w-24 bg-transparent text-right text-orange-700 font-semibold text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range" min={1000} max={1000000} step={1000}
                    value={monthlyWithdrawal}
                    onChange={(e) => setMonthlyWithdrawal(Number(e.target.value))}
                    className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₹1,000</span><span>₹10 Lakh</span>
                  </div>
                </div>

                {/* Expected Return */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Expected Return (%)</label>
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                      <input
                        type="number"
                        value={expectedReturn}
                        onChange={(e) => setExpectedReturn(Math.max(1, Math.min(20, Number(e.target.value))))}
                        className="w-12 bg-transparent text-right text-green-700 font-semibold text-sm focus:outline-none"
                      />
                      <span className="text-green-600 text-sm ml-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range" min={1} max={20} step={0.5}
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>

                {/* Years */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Withdrawal Period (Years)</label>
                    <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
                      <input
                        type="number"
                        value={years}
                        onChange={(e) => setYears(Math.max(1, Math.min(30, Number(e.target.value))))}
                        className="w-12 bg-transparent text-right text-purple-700 font-semibold text-sm focus:outline-none"
                      />
                      <span className="text-purple-600 text-sm ml-1">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range" min={1} max={30} step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="mt-8 bg-gradient-to-br from-orange-900 to-amber-800 rounded-xl p-6 text-white">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-orange-200">Total Corpus</span>
                    <span className="font-bold">{formatINR(totalInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-200">Total Withdrawn</span>
                    <span className="font-bold">{formatINR(totalWithdrawn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-200">Remaining Balance</span>
                    <span className="font-bold text-yellow-400">{formatINR(remainingBalance)}</span>
                  </div>
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-xs text-orange-300 text-center">
                      {remainingBalance > 0
                        ? `Your corpus will last beyond ${years} years with ₹${remainingBalance.toLocaleString('en-IN')} remaining`
                        : 'Warning: Your corpus may deplete before the withdrawal period ends'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Corpus Balance Over Time</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(value: number) => formatINR(value)} />
                      <Area type="monotone" dataKey="balance" stroke="#EA580C" fill="#EA580C" fillOpacity={0.2} name="Remaining Balance" />
                      <Area type="monotone" dataKey="withdrawn" stroke="#0052CC" fill="#0052CC" fillOpacity={0.1} name="Total Withdrawn" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">What is SWP?</h3>
                    <p className="text-sm text-amber-800 mb-3">
                      A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount regularly from your mutual fund
                      investment while the remaining amount continues to earn returns.
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1 ml-4 list-disc">
                      <li>Ideal for regular income from investments</li>
                      <li>Remaining corpus continues to grow</li>
                      <li>Tax-efficient compared to FD interest</li>
                      <li>Flexible withdrawal amounts and frequency</li>
                    </ul>
                    <p className="text-xs text-amber-600 mt-3">
                      Note: Actual returns may vary. Past performance does not guarantee future results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
