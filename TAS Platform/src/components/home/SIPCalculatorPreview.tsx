"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { calculateSIP } from "@/lib/utils/calculators";
import { formatINR } from "@/lib/utils/formatters";

export default function SIPCalculatorPreview() {
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [years, setYears] = useState(10);
  const [returnRate, setReturnRate] = useState(12);

  const result = calculateSIP(monthlyAmount, returnRate, years);

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
          <div className="grid lg:grid-cols-2">
            {/* Calculator Side */}
            <div className="p-8 lg:p-12">
              <div className="mb-2 flex items-center gap-2">
                <Calculator size={20} className="text-primary-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-500">
                  SIP Calculator
                </span>
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Plan Your Wealth Journey
              </h2>
              <p className="mb-8 text-sm text-gray-500">
                See how small, regular investments can grow into a large corpus
                over time.
              </p>

              {/* Monthly Investment Slider */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Monthly Investment
                  </label>
                  <span className="rounded-lg bg-primary-50 px-3 py-1 text-sm font-bold text-primary-500">
                    {formatINR(monthlyAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={100000}
                  step={500}
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>₹500</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Return Rate Slider */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Expected Returns (p.a.)
                  </label>
                  <span className="rounded-lg bg-positive-light px-3 py-1 text-sm font-bold text-positive">
                    {returnRate}%
                  </span>
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
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1%</span>
                  <span>30%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Time Period
                  </label>
                  <span className="rounded-lg bg-accent-light px-3 py-1 text-sm font-bold text-accent">
                    {years} Years
                  </span>
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
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1 Year</span>
                  <span>40 Years</span>
                </div>
              </div>

              <Link
                href="/calculators/sip"
                className="group inline-flex items-center gap-2 text-sm font-bold text-primary-500 transition hover:gap-3"
              >
                Try Advanced Calculator <ArrowRight size={16} />
              </Link>
            </div>

            {/* Results Side */}
            <div className="flex flex-col justify-center bg-gradient-to-br from-primary to-primary-700 p-8 text-white lg:p-12">
              <div className="mb-8">
                <p className="mb-1 text-sm font-medium text-primary-200">
                  Estimated Total Value
                </p>
                <p className="text-4xl font-extrabold sm:text-5xl">
                  {formatINR(result.totalValue)}
                </p>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-1 text-sm text-primary-300">
                    Total Invested
                  </p>
                  <p className="text-xl font-bold">
                    {formatINR(result.totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-primary-300">
                    Estimated Returns
                  </p>
                  <p className="text-xl font-bold text-green-400">
                    {formatINR(result.estimatedReturns)}
                  </p>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="mb-4">
                <div className="h-4 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (result.estimatedReturns / result.totalValue) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-primary-300">
                  <span>Invested</span>
                  <span>
                    Wealth Gain:{" "}
                    {(
                      (result.estimatedReturns / result.totalInvested) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>

              <Link
                href="/mutual-funds"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary transition hover:bg-gray-100"
              >
                Start SIP Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
