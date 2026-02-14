'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, IndianRupee, Info, ArrowRightLeft } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function STPCalculatorPage() {
  const [totalAmount, setTotalAmount] = useState(1200000);
  const [monthlyTransfer, setMonthlyTransfer] = useState(100000);
  const [sourceReturn, setSourceReturn] = useState(7);
  const [targetReturn, setTargetReturn] = useState(14);
  const [months, setMonths] = useState(12);

  const result = useMemo(() => {
    const sourceMonthlyRate = sourceReturn / 12 / 100;
    const targetMonthlyRate = targetReturn / 12 / 100;

    let sourceBalance = totalAmount;
    let targetBalance = 0;
    const chartData = [{ month: 'M0', source: totalAmount, target: 0 }];

    for (let m = 1; m <= months; m++) {
      sourceBalance = sourceBalance * (1 + sourceMonthlyRate) - monthlyTransfer;
      if (sourceBalance < 0) sourceBalance = 0;
      targetBalance = (targetBalance + monthlyTransfer) * (1 + targetMonthlyRate);
      chartData.push({
        month: `M${m}`,
        source: Math.round(sourceBalance),
        target: Math.round(targetBalance),
      });
    }

    return {
      sourceBalance: Math.round(sourceBalance),
      targetBalance: Math.round(targetBalance),
      totalTransferred: monthlyTransfer * months,
      totalValue: Math.round(sourceBalance + targetBalance),
      chartData,
    };
  }, [totalAmount, monthlyTransfer, sourceReturn, targetReturn, months]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-violet-900 to-purple-800 text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-violet-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">STP Calculator</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8" /> STP Calculator
          </h1>
          <p className="text-violet-200 max-w-2xl">
            Plan your Systematic Transfer Plan. Transfer funds gradually from debt to equity funds to manage risk and optimize returns.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-xl font-bold text-gray-900 mb-6">STP Details</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Total Amount in Source Fund</label>
                    <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                      <IndianRupee className="w-3 h-3 text-blue-600" />
                      <input type="number" value={totalAmount}
                        onChange={(e) => setTotalAmount(Math.max(10000, Math.min(100000000, Number(e.target.value))))}
                        className="w-28 bg-transparent text-right text-blue-700 font-semibold text-sm focus:outline-none" />
                    </div>
                  </div>
                  <input type="range" min={10000} max={100000000} step={10000} value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Monthly Transfer Amount</label>
                    <div className="flex items-center bg-violet-50 border border-violet-200 rounded-lg px-3 py-1">
                      <IndianRupee className="w-3 h-3 text-violet-600" />
                      <input type="number" value={monthlyTransfer}
                        onChange={(e) => setMonthlyTransfer(Math.max(1000, Math.min(totalAmount, Number(e.target.value))))}
                        className="w-24 bg-transparent text-right text-violet-700 font-semibold text-sm focus:outline-none" />
                    </div>
                  </div>
                  <input type="range" min={1000} max={Math.min(totalAmount, 10000000)} step={1000} value={monthlyTransfer}
                    onChange={(e) => setMonthlyTransfer(Number(e.target.value))}
                    className="w-full h-2 bg-violet-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Source Fund Return (%)</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <input type="number" value={sourceReturn}
                        onChange={(e) => setSourceReturn(Math.max(1, Math.min(15, Number(e.target.value))))}
                        className="w-full bg-transparent text-gray-700 font-semibold text-sm focus:outline-none" />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Debt fund ~6-8%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Target Fund Return (%)</label>
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <input type="number" value={targetReturn}
                        onChange={(e) => setTargetReturn(Math.max(1, Math.min(25, Number(e.target.value))))}
                        className="w-full bg-transparent text-green-700 font-semibold text-sm focus:outline-none" />
                      <span className="text-green-500 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Equity fund ~12-15%</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Transfer Period (Months)</label>
                    <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
                      <input type="number" value={months}
                        onChange={(e) => setMonths(Math.max(1, Math.min(60, Number(e.target.value))))}
                        className="w-12 bg-transparent text-right text-purple-700 font-semibold text-sm focus:outline-none" />
                      <span className="text-purple-600 text-sm ml-1">M</span>
                    </div>
                  </div>
                  <input type="range" min={1} max={60} step={1} value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-br from-violet-900 to-purple-800 rounded-xl p-6 text-white">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-violet-200">Source Fund Balance</span>
                    <span className="font-bold">{formatINR(result.sourceBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-violet-200">Target Fund Balance</span>
                    <span className="font-bold text-green-400">{formatINR(result.targetBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-violet-200">Total Transferred</span>
                    <span className="font-bold">{formatINR(result.totalTransferred)}</span>
                  </div>
                  <div className="pt-3 border-t border-white/20 flex justify-between">
                    <span className="text-yellow-300 font-semibold">Combined Value</span>
                    <span className="font-bold text-yellow-300 text-lg">{formatINR(result.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Fund Balance Progression</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(value: number) => formatINR(value)} />
                      <Area type="monotone" dataKey="source" stroke="#6D28D9" fill="#6D28D9" fillOpacity={0.2} name="Source (Debt)" />
                      <Area type="monotone" dataKey="target" stroke="#00875A" fill="#00875A" fillOpacity={0.2} name="Target (Equity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-violet-50 rounded-xl border border-violet-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-violet-900 mb-2">What is STP?</h3>
                    <p className="text-sm text-violet-800 mb-3">
                      A Systematic Transfer Plan (STP) transfers a fixed amount from one mutual fund scheme to another
                      at regular intervals. It&apos;s commonly used to move money from a debt fund to an equity fund gradually.
                    </p>
                    <ul className="text-sm text-violet-700 space-y-1 ml-4 list-disc">
                      <li>Reduces market timing risk through rupee cost averaging</li>
                      <li>Source fund earns returns while waiting to be transferred</li>
                      <li>Better returns than keeping money in savings account</li>
                      <li>Ideal for deploying lumpsum into equity markets gradually</li>
                    </ul>
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
