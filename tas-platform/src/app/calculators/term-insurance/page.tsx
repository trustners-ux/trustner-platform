"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  Info,
  ChevronRight,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { calculateTermInsuranceNeed } from "@/lib/utils/financial-engine";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

type MethodTab = "hlv" | "income" | "expense";

export default function TermInsuranceCalculatorPage() {
  // Input state
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(7);
  const [discountRate, setDiscountRate] = useState(8);
  const [annualExpenses, setAnnualExpenses] = useState(600000);
  const [outstandingLoans, setOutstandingLoans] = useState(2000000);
  const [futureGoals, setFutureGoals] = useState(5000000);
  const [existingLifeCover, setExistingLifeCover] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<MethodTab>("hlv");

  // Calculation
  const result = useMemo(
    () =>
      calculateTermInsuranceNeed({
        annualIncome,
        currentAge,
        retirementAge: Math.max(retirementAge, currentAge + 1),
        incomeGrowthRate,
        discountRate,
        annualExpenses,
        outstandingLoans,
        futureGoals,
        existingLifeCover,
      }),
    [
      annualIncome,
      currentAge,
      retirementAge,
      incomeGrowthRate,
      discountRate,
      annualExpenses,
      outstandingLoans,
      futureGoals,
      existingLifeCover,
    ]
  );

  // Chart data
  const chartData = [
    {
      name: "Human Life Value",
      value: result.hlvMethod,
      color: "#0052CC",
    },
    {
      name: "Income Replacement",
      value: result.incomeReplacementMethod,
      color: "#00875A",
    },
    {
      name: "Expense Method",
      value: result.expenseMethod,
      color: "#6554C0",
    },
  ];

  const tabs: { key: MethodTab; label: string; icon: React.ReactNode }[] = [
    { key: "hlv", label: "Human Life Value", icon: <TrendingUp size={14} /> },
    { key: "income", label: "Income Replacement", icon: <Users size={14} /> },
    { key: "expense", label: "Expense Method", icon: <Wallet size={14} /> },
  ];

  // Method detail helpers
  const yearsToRetirement = Math.max(
    retirementAge - currentAge,
    1
  );
  const multiplier = currentAge >= 45 ? 10 : currentAge >= 35 ? 12 : 15;

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
        <div className="container-custom py-10">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/calculators" className="transition hover:text-white">
              Calculators
            </Link>
            <ChevronRight size={12} />
            <span className="text-white">Term Insurance</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Shield size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                Term Insurance Calculator
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Calculate the right life insurance cover for your family using 3
                proven methods — HLV, Income Replacement, and Expense-based
                analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ==================== LEFT PANEL: Inputs ==================== */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              {/* Current Age */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Current Age
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={currentAge}
                      onChange={(e) =>
                        setCurrentAge(
                          Math.max(18, Math.min(65, Number(e.target.value)))
                        )
                      }
                      className="w-16 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={18}
                  max={65}
                  step={1}
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>18 yrs</span>
                  <span>65 yrs</span>
                </div>
              </div>

              {/* Retirement Age */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Retirement Age
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={retirementAge}
                      onChange={(e) =>
                        setRetirementAge(
                          Math.max(45, Math.min(70, Number(e.target.value)))
                        )
                      }
                      className="w-16 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={45}
                  max={70}
                  step={1}
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>45 yrs</span>
                  <span>70 yrs</span>
                </div>
              </div>

              {/* Annual Income */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Annual Income
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) =>
                        setAnnualIncome(
                          Math.max(100000, Math.min(50000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={50000000}
                  step={100000}
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}1 L</span>
                  <span>{"\u20B9"}5 Cr</span>
                </div>
              </div>

              {/* Income Growth Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Income Growth Rate
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={incomeGrowthRate}
                      onChange={(e) =>
                        setIncomeGrowthRate(
                          Math.max(0, Math.min(15, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={incomeGrowthRate}
                  onChange={(e) => setIncomeGrowthRate(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>0%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Discount Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Discount Rate
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={discountRate}
                      onChange={(e) =>
                        setDiscountRate(
                          Math.max(5, Math.min(12, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={5}
                  max={12}
                  step={0.5}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>5%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Annual Family Expenses */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Annual Family Expenses
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={annualExpenses}
                      onChange={(e) =>
                        setAnnualExpenses(
                          Math.max(100000, Math.min(20000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}1 L</span>
                  <span>{"\u20B9"}2 Cr</span>
                </div>
              </div>

              {/* Outstanding Loans */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Outstanding Loans
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={outstandingLoans}
                      onChange={(e) =>
                        setOutstandingLoans(
                          Math.max(0, Math.min(50000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={outstandingLoans}
                  onChange={(e) => setOutstandingLoans(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}0</span>
                  <span>{"\u20B9"}5 Cr</span>
                </div>
              </div>

              {/* Future Goals */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Future Goals (Education, Wedding)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={futureGoals}
                      onChange={(e) =>
                        setFutureGoals(
                          Math.max(0, Math.min(50000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000000}
                  step={100000}
                  value={futureGoals}
                  onChange={(e) => setFutureGoals(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}0</span>
                  <span>{"\u20B9"}5 Cr</span>
                </div>
              </div>

              {/* Existing Life Cover */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Existing Life Cover
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={existingLifeCover}
                      onChange={(e) =>
                        setExistingLifeCover(
                          Math.max(0, Math.min(100000000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000000}
                  step={500000}
                  value={existingLifeCover}
                  onChange={(e) => setExistingLifeCover(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}0</span>
                  <span>{"\u20B9"}10 Cr</span>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Recommended Cover
                  </span>
                  <span className="text-lg font-extrabold text-primary-500">
                    {formatLakhsCrores(result.recommendedCover)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Existing Cover</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatLakhsCrores(result.existingCover)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      Insurance Gap
                    </span>
                    <span
                      className={`text-lg font-extrabold ${
                        result.gap > 0 ? "text-red-500" : "text-positive"
                      }`}
                    >
                      {result.gap > 0
                        ? `- ${formatLakhsCrores(result.gap)}`
                        : "Adequately Covered"}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/insurance/life"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Get Term Insurance Quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* ==================== RIGHT PANEL: Results ==================== */}
          <div className="space-y-6 lg:col-span-3">
            {/* Method Tabs */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="mb-6 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "hlv" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Human Life Value (HLV) Method
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Calculates the present value of your future income stream
                      until retirement, adjusted for growth and discounting.
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                      HLV Cover Needed
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-gray-900">
                      {formatLakhsCrores(result.hlvMethod)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Years to Retire</p>
                      <p className="text-lg font-bold text-gray-900">
                        {yearsToRetirement} yrs
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Current Income</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(annualIncome)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Income Growth</p>
                      <p className="text-lg font-bold text-gray-900">
                        {incomeGrowthRate}% p.a.
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Discount Rate</p>
                      <p className="text-lg font-bold text-gray-900">
                        {discountRate}% p.a.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    HLV represents the economic value you bring to your family.
                    It accounts for your expected income growth and discounts it
                    to today&apos;s value, giving the most comprehensive
                    estimate.
                  </p>
                </div>
              )}

              {activeTab === "income" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Income Replacement Method
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      A simple rule-of-thumb approach that multiplies your annual
                      income by a factor based on your age.
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Income Replacement Cover
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-gray-900">
                      {formatLakhsCrores(result.incomeReplacementMethod)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Annual Income</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(annualIncome)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Multiplier Used</p>
                      <p className="text-lg font-bold text-gray-900">
                        {multiplier}x
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                      Multiplier Guidelines
                    </p>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Age 18-34</span>
                        <span className="font-semibold">15x income</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Age 35-44</span>
                        <span className="font-semibold">12x income</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Age 45+</span>
                        <span className="font-semibold">10x income</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    This is the simplest method and provides a quick estimate.
                    Younger individuals need a higher multiplier as they have
                    more earning years ahead.
                  </p>
                </div>
              )}

              {activeTab === "expense" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Expense-Based Method
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Calculates the present value of your family&apos;s future
                      expenses, plus outstanding liabilities and future goals.
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                      Expense-Based Cover
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-gray-900">
                      {formatLakhsCrores(result.expenseMethod)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Annual Expenses</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(annualExpenses)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">
                        Outstanding Loans
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(outstandingLoans)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Future Goals</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(futureGoals)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Cover Period</p>
                      <p className="text-lg font-bold text-gray-900">
                        {yearsToRetirement} yrs
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    The expense method focuses on what your family actually needs
                    rather than what you earn. It includes the present value of
                    future living expenses, all outstanding debts, and planned
                    future goals like children&apos;s education and marriage.
                  </p>
                </div>
              )}
            </div>

            {/* Method Comparison Cards */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-5 text-lg font-bold text-gray-900">
                Method Comparison
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Human Life Value (HLV)",
                    value: result.hlvMethod,
                    color: "#0052CC",
                    bgColor: "bg-blue-50",
                    textColor: "text-blue-600",
                  },
                  {
                    label: "Income Replacement",
                    value: result.incomeReplacementMethod,
                    color: "#00875A",
                    bgColor: "bg-emerald-50",
                    textColor: "text-emerald-600",
                  },
                  {
                    label: "Expense Method",
                    value: result.expenseMethod,
                    color: "#6554C0",
                    bgColor: "bg-purple-50",
                    textColor: "text-purple-600",
                  },
                ].map((method) => {
                  const maxVal = Math.max(
                    result.hlvMethod,
                    result.incomeReplacementMethod,
                    result.expenseMethod,
                    1
                  );
                  const barWidth = (method.value / maxVal) * 100;
                  const isRecommended =
                    method.value === result.recommendedCover;

                  return (
                    <div
                      key={method.label}
                      className={`rounded-xl border p-4 ${
                        isRecommended
                          ? "border-primary-200 bg-primary-50/30"
                          : "border-gray-100"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {method.label}
                          </span>
                          {isRecommended && (
                            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-gray-900">
                          {formatLakhsCrores(method.value)}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: method.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bar Chart Comparison */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Visual Comparison
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v: number) =>
                      v >= 10000000
                        ? `${(v / 10000000).toFixed(1)} Cr`
                        : v >= 100000
                          ? `${(v / 100000).toFixed(0)} L`
                          : `${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [
                      formatINR(value),
                      "Cover Amount",
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Final Recommendation Card */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-emerald-400" />
                <h3 className="text-lg font-bold">Our Recommendation</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-400">Recommended Cover</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                    {formatLakhsCrores(result.recommendedCover)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-400">Existing Cover</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">
                    {formatLakhsCrores(result.existingCover)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-400">Gap to Fill</p>
                  <p
                    className={`mt-1 text-2xl font-extrabold ${
                      result.gap > 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {result.gap > 0
                      ? formatLakhsCrores(result.gap)
                      : "No Gap"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-300">
                Based on our analysis using all three methods, we recommend a
                minimum term insurance cover of{" "}
                <span className="font-bold text-white">
                  {formatLakhsCrores(result.recommendedCover)}
                </span>
                .{" "}
                {result.gap > 0
                  ? `You need an additional ${formatLakhsCrores(result.gap)} of coverage to adequately protect your family.`
                  : "Your existing coverage meets the recommended amount."}
              </p>

              <Link
                href="/insurance/life"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Get Term Insurance Quote <ArrowRight size={16} />
              </Link>
            </div>

            {/* Info Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Info
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-primary-500"
                />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">
                    Why Term Insurance is Important
                  </h4>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    Term insurance is the most affordable way to secure a high
                    life cover. It provides pure protection to your family in
                    case of your untimely demise, ensuring they can maintain
                    their lifestyle and meet financial obligations.
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Covers outstanding loans so your family isn&apos;t
                      burdened with debt
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Replaces your income to maintain your family&apos;s
                      standard of living
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Funds future goals like children&apos;s education and
                      marriage
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Premium paid qualifies for tax deduction under Section 80C
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Buy early for lower premiums — costs increase with age
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEBI Disclaimer */}
      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
