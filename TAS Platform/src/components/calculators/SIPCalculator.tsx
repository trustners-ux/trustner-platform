"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Calculator } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { calculateSIP, calculateSIPBreakdown } from "@/lib/utils/calculators";
import { formatINR } from "@/lib/utils/formatters";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export default function SIPCalculatorFull() {
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(15);

  const result = calculateSIP(monthlyAmount, returnRate, years);
  const breakdown = calculateSIPBreakdown(monthlyAmount, returnRate, years);

  const pieData = [
    { name: "Invested", value: result.totalInvested, color: "#0052CC" },
    { name: "Returns", value: result.estimatedReturns, color: "#00875A" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <div className="flex items-center gap-3 mb-2">
            <Calculator size={24} className="text-primary-500" />
            <h1 className="text-3xl font-extrabold text-gray-900">
              SIP Calculator
            </h1>
          </div>
          <p className="text-gray-500">
            Calculate how your monthly SIP investments can grow over time with
            the power of compounding.
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Input Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              {/* Monthly Amount */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Monthly Investment
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">₹</span>
                    <input
                      type="number"
                      value={monthlyAmount}
                      onChange={(e) =>
                        setMonthlyAmount(
                          Math.max(500, Math.min(1000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={500}
                  max={200000}
                  step={500}
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>₹500</span>
                  <span>₹2,00,000</span>
                </div>
              </div>

              {/* Return Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Expected Return Rate (p.a.)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={returnRate}
                      onChange={(e) =>
                        setReturnRate(
                          Math.max(1, Math.min(30, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full accent-positive"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>1%</span>
                  <span>30%</span>
                </div>
              </div>

              {/* Time Period */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Investment Period
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={years}
                      onChange={(e) =>
                        setYears(
                          Math.max(1, Math.min(40, Number(e.target.value)))
                        )
                      }
                      className="w-10 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>1 Year</span>
                  <span>40 Years</span>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Invested</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatINR(result.totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Est. Returns</span>
                  <span className="text-sm font-bold text-positive">
                    {formatINR(result.estimatedReturns)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      Total Value
                    </span>
                    <span className="text-xl font-extrabold text-primary-500">
                      {formatINR(result.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/mutual-funds"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Start SIP Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="space-y-6 lg:col-span-3">
            {/* Pie Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Investment Breakdown
              </h3>
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-[#0052CC]" />
                    <div>
                      <p className="text-xs text-gray-400">Total Invested</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatINR(result.totalInvested)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-[#00875A]" />
                    <div>
                      <p className="text-xs text-gray-400">Est. Returns</p>
                      <p className="text-lg font-bold text-positive">
                        {formatINR(result.estimatedReturns)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                      Wealth Multiplier
                    </p>
                    <p className="text-2xl font-extrabold text-primary-500">
                      {(result.totalValue / result.totalInvested).toFixed(1)}x
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Year-by-Year Growth
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={breakdown}>
                  <defs>
                    <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052CC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00875A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00875A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `Y${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `₹${(v / 10000000).toFixed(1)}Cr`
                        : v >= 100000
                        ? `₹${(v / 100000).toFixed(0)}L`
                        : `₹${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                    formatter={(value: number, name: string) => [
                      formatINR(value),
                      name === "invested" ? "Total Invested" : "Total Value",
                    ]}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00875A"
                    strokeWidth={2}
                    fill="url(#valueGrad)"
                    name="value"
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="#0052CC"
                    strokeWidth={2}
                    fill="url(#investedGrad)"
                    name="invested"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Year-by-Year Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Detailed Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">
                        Year
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Invested
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Total Value
                      </th>
                      <th className="pl-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Returns
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2.5 pr-4 font-semibold text-gray-900">
                          Year {row.year}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatINR(row.invested)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                          {formatINR(row.value)}
                        </td>
                        <td className="pl-4 py-2.5 text-right font-bold text-positive">
                          {formatINR(row.value - row.invested)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="mt-0.5 flex-shrink-0 text-primary-500" />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">
                    How SIP Works
                  </h4>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    A Systematic Investment Plan (SIP) allows you to invest a
                    fixed amount regularly in mutual funds. The power of
                    compounding and rupee cost averaging helps your investment
                    grow over time.
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Start with as little as ₹500 per month
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Benefit from rupee cost averaging in volatile markets
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      No need to time the market — invest regularly
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      ELSS SIP qualifies for tax deduction under Section 80C
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
