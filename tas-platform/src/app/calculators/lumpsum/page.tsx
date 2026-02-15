'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp, IndianRupee, Info } from 'lucide-react';
import { calculateLumpsum } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function LumpsumCalculatorPage() {
  const [amount, setAmount] = useState(100000);
  const [returns, setReturns] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateLumpsum(amount, returns, years), [amount, returns, years]);

  const pieData = [
    { name: 'Invested', value: amount, color: '#0052CC' },
    { name: 'Returns', value: result.estimatedReturns, color: '#00875A' },
  ];

  const chartData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= years; y++) {
      const value = amount * Math.pow(1 + returns / 100, y);
      data.push({
        year: `Year ${y}`,
        invested: amount,
        value: Math.round(value),
      });
    }
    return data;
  }, [amount, returns, years]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-blue-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/calculators" className="hover:text-white">Calculators</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Lumpsum Calculator</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Lumpsum Investment Calculator</h1>
          <p className="text-blue-200 max-w-2xl">
            Calculate the future value of your one-time investment. See how compounding grows your wealth over time.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Investment Details</h2>
              <div className="space-y-8">
                {/* Amount */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Investment Amount</label>
                    <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                      <IndianRupee className="w-3 h-3 text-blue-600" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1000, Math.min(10000000, Number(e.target.value))))}
                        className="w-24 bg-transparent text-right text-blue-700 font-semibold text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={10000000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₹1,000</span><span>₹1 Cr</span>
                  </div>
                </div>

                {/* Returns */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Expected Annual Return (%)</label>
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                      <input
                        type="number"
                        value={returns}
                        onChange={(e) => setReturns(Math.max(1, Math.min(30, Number(e.target.value))))}
                        className="w-12 bg-transparent text-right text-green-700 font-semibold text-sm focus:outline-none"
                      />
                      <span className="text-green-600 text-sm ml-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={0.5}
                    value={returns}
                    onChange={(e) => setReturns(Number(e.target.value))}
                    className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1%</span><span>30%</span>
                  </div>
                </div>

                {/* Years */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Time Period (Years)</label>
                    <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
                      <input
                        type="number"
                        value={years}
                        onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                        className="w-12 bg-transparent text-right text-purple-700 font-semibold text-sm focus:outline-none"
                      />
                      <span className="text-purple-600 text-sm ml-1">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 Yr</span><span>40 Yr</span>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-8 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 text-white">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wider">Invested</p>
                    <p className="text-lg font-bold mt-1">{formatINR(amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-300 uppercase tracking-wider">Returns</p>
                    <p className="text-lg font-bold mt-1 text-green-400">{formatINR(result.estimatedReturns)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wider">Total Value</p>
                    <p className="text-lg font-bold mt-1">{formatINR(result.totalValue)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 text-center">
                  <p className="text-xs text-blue-300">Your money grows</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {(result.totalValue / amount).toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
              {/* Pie Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Investment Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatINR(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-2">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}: {formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Wealth Growth Over Time</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(value: number) => formatINR(value)} />
                      <Area type="monotone" dataKey="invested" stackId="1" stroke="#0052CC" fill="#0052CC" fillOpacity={0.3} name="Invested" />
                      <Area type="monotone" dataKey="value" stroke="#00875A" fill="#00875A" fillOpacity={0.15} name="Total Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">How Lumpsum Investment Works</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      A lumpsum investment is a one-time investment where you invest a fixed amount at once.
                      The power of compounding works on the entire amount from day one.
                    </p>
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Formula:</strong> FV = P × (1 + r)^n
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                      <li>FV = Future Value</li>
                      <li>P = Principal (investment amount)</li>
                      <li>r = Expected annual return rate</li>
                      <li>n = Number of years</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-3">
                      Note: The actual returns may vary based on market conditions. Past performance does not guarantee future results.
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
