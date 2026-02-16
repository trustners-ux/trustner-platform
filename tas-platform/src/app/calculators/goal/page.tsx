'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Target, GraduationCap, Home, Car, Heart, Sunset, IndianRupee, Info, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

const GOALS = [
  { id: 'education', label: 'Child Education', icon: GraduationCap, color: 'bg-blue-500', defaultTarget: 5000000, defaultYears: 15 },
  { id: 'retirement', label: 'Retirement', icon: Sunset, color: 'bg-amber-500', defaultTarget: 20000000, defaultYears: 25 },
  { id: 'house', label: 'House Purchase', icon: Home, color: 'bg-emerald-500', defaultTarget: 10000000, defaultYears: 10 },
  { id: 'car', label: 'Car', icon: Car, color: 'bg-purple-500', defaultTarget: 1500000, defaultYears: 3 },
  { id: 'wedding', label: 'Wedding', icon: Heart, color: 'bg-rose-500', defaultTarget: 3000000, defaultYears: 5 },
  { id: 'custom', label: 'Custom Goal', icon: Target, color: 'bg-gray-500', defaultTarget: 2000000, defaultYears: 10 },
];

export default function GoalPlanningCalculatorPage() {
  const [selectedGoal, setSelectedGoal] = useState('education');
  const [currentSavings, setCurrentSavings] = useState(100000);
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [years, setYears] = useState(15);
  const [expectedReturn, setExpectedReturn] = useState(12);

  const goal = GOALS.find(g => g.id === selectedGoal) || GOALS[0];

  const handleGoalSelect = (goalId: string) => {
    const g = GOALS.find(goal => goal.id === goalId);
    if (g) {
      setSelectedGoal(goalId);
      setTargetAmount(g.defaultTarget);
      setYears(g.defaultYears);
    }
  };

  const result = useMemo(() => {
    const monthlyRate = expectedReturn / 12 / 100;
    const totalMonths = years * 12;

    // Future value of current savings
    const futureValueOfSavings = currentSavings * Math.pow(1 + monthlyRate, totalMonths);

    // Remaining amount needed via SIP
    const remaining = Math.max(0, targetAmount - futureValueOfSavings);

    // PMT formula: SIP = remaining * r / ((1+r)^n - 1)
    let monthlySIP = 0;
    if (remaining > 0 && totalMonths > 0) {
      const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
      monthlySIP = denominator > 0 ? (remaining * monthlyRate) / denominator : remaining / totalMonths;
    }

    const totalInvested = currentSavings + Math.round(monthlySIP) * totalMonths;
    const totalValue = Math.round(futureValueOfSavings + (monthlySIP > 0 ? monthlySIP * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) : 0));

    // Chart data
    const chartData = [];
    let sipAccumulated = currentSavings;
    for (let y = 0; y <= years; y++) {
      const months = y * 12;
      const savingsGrowth = currentSavings * Math.pow(1 + monthlyRate, months);
      const sipGrowth = monthlySIP > 0 && months > 0
        ? monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        : 0;
      chartData.push({
        year: `Year ${y}`,
        value: Math.round(savingsGrowth + sipGrowth),
        target: targetAmount,
        invested: Math.round(currentSavings + monthlySIP * months),
      });
    }

    return {
      monthlySIP: Math.round(monthlySIP),
      totalInvested,
      totalValue,
      totalReturns: totalValue - totalInvested,
      chartData,
      futureValueOfSavings: Math.round(futureValueOfSavings),
    };
  }, [currentSavings, targetAmount, years, expectedReturn]);

  return (
    <div className="min-h-screen bg-surface-100">
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight size={14} />
            <Link href="/calculators" className="hover:text-white transition">Calculators</Link>
            <ChevronRight size={14} />
            <span className="text-white">Goal Planning</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Target size={20} className="text-amber-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold">Goal Planning Calculator</h1>
          </div>
          <p className="text-gray-400 max-w-xl">
            Plan for your financial goals. Calculate how much you need to invest monthly to reach your target amount.
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Goal Selector */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGoalSelect(g.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                selectedGoal === g.id
                  ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-card'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${g.color} text-white`}>
                <g.icon size={18} />
              </div>
              <span className={`text-xs font-semibold ${selectedGoal === g.id ? 'text-primary-500' : 'text-gray-600'}`}>
                {g.label}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Planning for: {goal.label}</h2>
            <div className="space-y-7">
              {/* Current Savings */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Current Savings</label>
                  <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                    <IndianRupee size={12} className="text-blue-600" />
                    <input type="number" value={currentSavings}
                      onChange={(e) => setCurrentSavings(Math.max(0, Math.min(100000000, Number(e.target.value))))}
                      className="w-28 bg-transparent text-right text-blue-700 font-semibold text-sm focus:outline-none" />
                  </div>
                </div>
                <input type="range" min={0} max={50000000} step={10000} value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))} className="w-full" />
              </div>

              {/* Target Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Target Amount</label>
                  <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                    <IndianRupee size={12} className="text-amber-600" />
                    <input type="number" value={targetAmount}
                      onChange={(e) => setTargetAmount(Math.max(10000, Math.min(1000000000, Number(e.target.value))))}
                      className="w-28 bg-transparent text-right text-amber-700 font-semibold text-sm focus:outline-none" />
                  </div>
                </div>
                <input type="range" min={100000} max={100000000} step={100000} value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))} className="w-full" />
              </div>

              {/* Timeline */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Timeline</label>
                  <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                    <input type="number" value={years}
                      onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                      className="w-10 bg-transparent text-right text-green-700 font-semibold text-sm focus:outline-none" />
                    <span className="text-green-600 text-sm ml-1">Yrs</span>
                  </div>
                </div>
                <input type="range" min={1} max={40} step={1} value={years}
                  onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
              </div>

              {/* Expected Return */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Expected Return (p.a.)</label>
                  <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1">
                    <input type="number" value={expectedReturn}
                      onChange={(e) => setExpectedReturn(Math.max(1, Math.min(25, Number(e.target.value))))}
                      className="w-10 bg-transparent text-right text-emerald-700 font-semibold text-sm focus:outline-none" />
                    <span className="text-emerald-600 text-sm ml-1">%</span>
                  </div>
                </div>
                <input type="range" min={1} max={25} step={0.5} value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            {/* Result Card */}
            <div className="mt-8 rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1a2d4a] p-6 text-white">
              <p className="text-sm text-gray-400 mb-1">Required Monthly SIP</p>
              <p className="text-3xl font-extrabold text-amber-400 mb-4">{formatINR(result.monthlySIP)}</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Target Amount</span>
                  <span className="font-semibold">{formatINR(targetAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Savings Growth</span>
                  <span className="font-semibold text-green-400">{formatINR(result.futureValueOfSavings)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total SIP Investment</span>
                  <span className="font-semibold">{formatINR(result.monthlySIP * years * 12)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/10 pt-2.5">
                  <span className="text-gray-400">Est. Total Returns</span>
                  <span className="font-semibold text-green-400">{formatINR(result.totalReturns)}</span>
                </div>
              </div>
            </div>

            <Link href="/contact" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600">
              Start Investing Toward Your Goal <ArrowRight size={16} />
            </Link>
          </div>

          {/* Charts & Info */}
          <div className="space-y-6">
            {/* Growth Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <h3 className="font-bold text-gray-900 mb-4">Growth Toward Your Goal</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.chartData}>
                    <defs>
                      <linearGradient id="goalValueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="goalInvestedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)}Cr` : `₹${(val / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(value: number) => formatINR(value)} />
                    <ReferenceLine y={targetAmount} stroke="#F59E0B" strokeDasharray="8 4" strokeWidth={2} label={{ value: 'Target', fill: '#F59E0B', fontSize: 11 }} />
                    <Area type="monotone" dataKey="value" stroke="#1E40AF" strokeWidth={2} fill="url(#goalValueGrad)" name="Portfolio Value" />
                    <Area type="monotone" dataKey="invested" stroke="#059669" strokeWidth={1.5} fill="url(#goalInvestedGrad)" name="Total Invested" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="mt-0.5 flex-shrink-0 text-primary-500" />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">Tips for Goal-Based Investing</h4>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Start early — even small SIPs grow significantly over long periods
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Review and increase your SIP amount annually as your income grows
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Choose equity funds for long-term goals ({'>'}5 years) and debt funds for short-term
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Account for inflation — your target amount should be inflation-adjusted
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    This calculator is for illustration purposes only. Actual returns may vary.
                    Past performance is not indicative of future results.
                  </p>
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
