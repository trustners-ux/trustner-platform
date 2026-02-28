"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Info,
  TrendingUp,
  Clock,
  Wallet,
  PiggyBank,
  ChevronRight,
} from "lucide-react";
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
import { calculateRetirementCorpus } from "@/lib/utils/financial-engine";
import { formatINR, formatLakhsCrores } from "@/lib/utils/formatters";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export default function RetirementCalculatorPage() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [currentMonthlyExpenses, setCurrentMonthlyExpenses] = useState(50000);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [preRetirementReturn, setPreRetirementReturn] = useState(12);
  const [postRetirementReturn, setPostRetirementReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(6);
  const [pensionIncome, setPensionIncome] = useState(0);
  const [sipStepUpRate, setSipStepUpRate] = useState(10);

  const result = useMemo(
    () =>
      calculateRetirementCorpus({
        currentAge,
        retirementAge: Math.max(currentAge + 1, retirementAge),
        lifeExpectancy: Math.max(retirementAge + 1, lifeExpectancy),
        currentMonthlyExpenses,
        inflationRate,
        preRetirementReturn,
        postRetirementReturn,
        currentSavings,
        pensionIncome,
        sipStepUpRate,
      }),
    [
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentMonthlyExpenses,
      inflationRate,
      preRetirementReturn,
      postRetirementReturn,
      currentSavings,
      pensionIncome,
      sipStepUpRate,
    ]
  );

  const yearsToRetire = Math.max(1, retirementAge - currentAge);

  const pieData = [
    {
      name: "Current Savings Growth",
      value: result.futureValueOfCurrentSavings,
      color: "#0052CC",
    },
    {
      name: "SIP Contribution Needed",
      value: Math.max(0, result.gap),
      color: "#00875A",
    },
  ];

  // Prepare chart data from yearlyBreakdown
  const chartData = useMemo(() => {
    return result.yearlyBreakdown.map((entry) => ({
      age: entry.age,
      corpus: entry.corpus,
      phase: entry.phase,
      accumulation: entry.phase === "accumulation" ? entry.corpus : undefined,
      retirement: entry.phase === "retirement" ? entry.corpus : undefined,
    }));
  }, [result.yearlyBreakdown]);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
        <div className="container-custom py-8 lg:py-12">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href="/calculators"
              className="transition hover:text-white"
            >
              Calculators
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">Retirement</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <PiggyBank size={28} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white lg:text-4xl">
                Retirement Calculator
              </h1>
              <p className="mt-1 text-gray-400">
                Plan your retirement corpus, estimate future expenses, and find
                out how much you need to invest monthly to retire comfortably.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Input Panel */}
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
                          Math.max(18, Math.min(70, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={18}
                  max={70}
                  step={1}
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>18 Yrs</span>
                  <span>70 Yrs</span>
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
                          Math.max(40, Math.min(80, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={40}
                  max={80}
                  step={1}
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>40 Yrs</span>
                  <span>80 Yrs</span>
                </div>
              </div>

              {/* Life Expectancy */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Life Expectancy
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={lifeExpectancy}
                      onChange={(e) =>
                        setLifeExpectancy(
                          Math.max(60, Math.min(100, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  step={1}
                  value={lifeExpectancy}
                  onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>60 Yrs</span>
                  <span>100 Yrs</span>
                </div>
              </div>

              {/* Current Monthly Expenses */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Current Monthly Expenses
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={currentMonthlyExpenses}
                      onChange={(e) =>
                        setCurrentMonthlyExpenses(
                          Math.max(5000, Math.min(500000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={500000}
                  step={1000}
                  value={currentMonthlyExpenses}
                  onChange={(e) =>
                    setCurrentMonthlyExpenses(Number(e.target.value))
                  }
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}5,000</span>
                  <span>{"\u20B9"}5,00,000</span>
                </div>
              </div>

              {/* Current Retirement Savings */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Current Savings
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={currentSavings}
                      onChange={(e) =>
                        setCurrentSavings(
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
                  step={50000}
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}0</span>
                  <span>{"\u20B9"}10 Cr</span>
                </div>
              </div>

              {/* Pre-Retirement Return */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Pre-Retirement Return (p.a.)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={preRetirementReturn}
                      onChange={(e) =>
                        setPreRetirementReturn(
                          Math.max(6, Math.min(18, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={6}
                  max={18}
                  step={0.5}
                  value={preRetirementReturn}
                  onChange={(e) =>
                    setPreRetirementReturn(Number(e.target.value))
                  }
                  className="w-full accent-positive"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>6%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Post-Retirement Return */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Post-Retirement Return (p.a.)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={postRetirementReturn}
                      onChange={(e) =>
                        setPostRetirementReturn(
                          Math.max(4, Math.min(12, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={0.5}
                  value={postRetirementReturn}
                  onChange={(e) =>
                    setPostRetirementReturn(Number(e.target.value))
                  }
                  className="w-full accent-positive"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>4%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Inflation Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Inflation Rate (p.a.)
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={inflationRate}
                      onChange={(e) =>
                        setInflationRate(
                          Math.max(3, Math.min(10, Number(e.target.value)))
                        )
                      }
                      className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                    <span className="ml-1 text-sm text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  step={0.5}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>3%</span>
                  <span>10%</span>
                </div>
              </div>

              {/* Monthly Pension Income */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Monthly Pension Income
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="mr-1 text-sm text-gray-400">{"\u20B9"}</span>
                    <input
                      type="number"
                      value={pensionIncome}
                      onChange={(e) =>
                        setPensionIncome(
                          Math.max(0, Math.min(200000, Number(e.target.value)))
                        )
                      }
                      className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={1000}
                  value={pensionIncome}
                  onChange={(e) => setPensionIncome(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>{"\u20B9"}0</span>
                  <span>{"\u20B9"}2,00,000</span>
                </div>
              </div>

              {/* Annual SIP Step-up Rate */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">
                    Annual SIP Step-up Rate
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <input
                      type="number"
                      value={sipStepUpRate}
                      onChange={(e) =>
                        setSipStepUpRate(
                          Math.max(0, Math.min(20, Number(e.target.value)))
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
                  max={20}
                  step={1}
                  value={sipStepUpRate}
                  onChange={(e) => setSipStepUpRate(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Corpus Needed</span>
                  <span className="text-sm font-bold text-primary-500">
                    {formatLakhsCrores(result.corpusNeeded)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Expenses at Retirement
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatINR(result.monthlyExpensesAtRetirement)}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Gap to Fill</span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatLakhsCrores(result.gap)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      Required Monthly SIP
                    </span>
                    <span className="text-xl font-extrabold text-primary-500">
                      {formatINR(result.requiredMonthlySIP)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/investments/nps"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600"
              >
                Explore NPS for Retirement <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="space-y-6 lg:col-span-3">
            {/* Big Result Card */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
              <div className="p-6 lg:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Total Corpus Needed
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-white lg:text-4xl">
                      {formatLakhsCrores(result.corpusNeeded)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      To sustain {lifeExpectancy - retirementAge} years of
                      retirement from age {retirementAge}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Required Monthly SIP
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-emerald-400 lg:text-4xl">
                      {formatINR(result.requiredMonthlySIP)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {sipStepUpRate > 0
                        ? `Starting SIP with ${sipStepUpRate}% annual step-up`
                        : "Fixed monthly SIP for the next " +
                          yearsToRetire +
                          " years"}
                    </p>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                      Current Savings Growth
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-400">
                      {formatLakhsCrores(result.futureValueOfCurrentSavings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                      Gap to Bridge
                    </p>
                    <p className="mt-1 text-lg font-bold text-amber-400">
                      {formatLakhsCrores(result.gap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                      Inflation Impact
                    </p>
                    <p className="mt-1 text-lg font-bold text-rose-400">
                      {(
                        result.monthlyExpensesAtRetirement /
                        currentMonthlyExpenses
                      ).toFixed(1)}
                      x
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart - Corpus Composition */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Corpus Composition at Retirement
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
                      <p className="text-xs text-gray-400">
                        Current Savings Growth
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatLakhsCrores(
                          result.futureValueOfCurrentSavings
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-[#00875A]" />
                    <div>
                      <p className="text-xs text-gray-400">
                        SIP Contribution Needed
                      </p>
                      <p className="text-lg font-bold text-positive">
                        {formatLakhsCrores(result.gap)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                      Total Corpus Target
                    </p>
                    <p className="text-2xl font-extrabold text-primary-500">
                      {formatLakhsCrores(result.corpusNeeded)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                Corpus Growth Projection
              </h3>
              <p className="mb-4 text-xs text-gray-400">
                Accumulation phase (green) and retirement drawdown phase
                (amber)
              </p>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="accumulationGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#00875A"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#00875A"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="retirementGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#F59E0B"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#F59E0B"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${v}`}
                    label={{
                      value: "Age",
                      position: "insideBottomRight",
                      offset: -5,
                      style: { fontSize: 11, fill: "#9ca3af" },
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `\u20B9${(v / 10000000).toFixed(1)}Cr`
                        : v >= 100000
                          ? `\u20B9${(v / 100000).toFixed(0)}L`
                          : `\u20B9${(v / 1000).toFixed(0)}K`
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
                      name === "accumulation"
                        ? "Corpus (Accumulation)"
                        : "Corpus (Retirement)",
                    ]}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="accumulation"
                    stroke="#00875A"
                    strokeWidth={2}
                    fill="url(#accumulationGrad)"
                    name="accumulation"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="retirement"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#retirementGrad)"
                    name="retirement"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Clock size={20} className="text-primary-500" />
                </div>
                <p className="text-xs font-medium text-gray-400">
                  Years to Retire
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  {yearsToRetire}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Age {currentAge} to {retirementAge}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Wallet size={20} className="text-amber-500" />
                </div>
                <p className="text-xs font-medium text-gray-400">
                  Monthly Expenses at Retirement
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatLakhsCrores(result.monthlyExpensesAtRetirement)}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {(
                    result.monthlyExpensesAtRetirement / currentMonthlyExpenses
                  ).toFixed(1)}
                  x of today&apos;s expenses
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-gray-400">
                  Current Savings will grow to
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatLakhsCrores(result.futureValueOfCurrentSavings)}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  From {formatLakhsCrores(currentSavings)} at{" "}
                  {preRetirementReturn}% p.a.
                </p>
              </div>
            </div>

            {/* Year-by-Year Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Year-by-Year Projection
              </h3>
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left text-xs font-bold uppercase text-gray-400">
                        Age
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Phase
                      </th>
                      <th className="pl-4 py-2 text-right text-xs font-bold uppercase text-gray-400">
                        Corpus
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyBreakdown
                      .filter(
                        (_, i) =>
                          i % 5 === 0 ||
                          i === result.yearlyBreakdown.length - 1
                      )
                      .map((row) => (
                        <tr
                          key={row.year}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2.5 pr-4 font-semibold text-gray-900">
                            {row.age}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                row.phase === "accumulation"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {row.phase === "accumulation"
                                ? "Building"
                                : "Spending"}
                            </span>
                          </td>
                          <td
                            className={`pl-4 py-2.5 text-right font-bold ${
                              row.phase === "accumulation"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {formatLakhsCrores(row.corpus)}
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
                <Info
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-primary-500"
                />
                <div>
                  <h4 className="mb-2 font-bold text-gray-900">
                    Retirement Planning Tips
                  </h4>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">
                    Retirement planning is one of the most important financial
                    goals. The earlier you start, the less you need to invest
                    each month thanks to the power of compounding.
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Start early -- even small amounts grow massively over 30+
                      years
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Use SIP step-up to increase investments as your income
                      grows
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      NPS offers extra {"\u20B9"}50,000 tax deduction under
                      Section 80CCD(1B)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Diversify across equity, debt, and NPS for balanced
                      growth
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      Account for inflation -- today&apos;s {"\u20B9"}50,000
                      may need {"\u20B9"}
                      {Math.round(
                        50000 * Math.pow(1 + inflationRate / 100, 30)
                      ).toLocaleString("en-IN")}{" "}
                      in 30 years at {inflationRate}% inflation
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
