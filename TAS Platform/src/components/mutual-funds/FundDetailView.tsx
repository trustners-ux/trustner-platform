"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
  BarChart3,
  FileText,
  ArrowLeft,
  ExternalLink,
  GitCompare,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MOCK_TOP_FUNDS } from "@/data/mock-funds";
import { formatPercent, formatINR, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import RiskOMeter from "./RiskOMeter";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";
import { REGULATORY } from "@/lib/constants/regulatory";

// Generate mock NAV history
function generateNAVHistory(currentNAV: number, days: number) {
  const data = [];
  let nav = currentNAV * 0.7;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    nav = nav * (1 + (Math.random() - 0.45) * 0.02);
    data.push({
      date: date.toISOString().split("T")[0],
      nav: Math.round(nav * 100) / 100,
    });
  }
  // Ensure last point matches current NAV
  if (data.length > 0) data[data.length - 1].nav = currentNAV;
  return data;
}

const PERIOD_OPTIONS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "3Y", days: 1095 },
  { label: "5Y", days: 1825 },
  { label: "MAX", days: 3650 },
];

export default function FundDetailView({ schemeCode }: { schemeCode: string }) {
  const fund = MOCK_TOP_FUNDS.find(
    (f) => f.schemeCode === Number(schemeCode)
  );
  const [selectedPeriod, setSelectedPeriod] = useState("1Y");

  const navHistory = useMemo(() => {
    if (!fund) return [];
    const period = PERIOD_OPTIONS.find((p) => p.label === selectedPeriod);
    return generateNAVHistory(fund.nav, period?.days || 365);
  }, [fund, selectedPeriod]);

  if (!fund) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Fund Not Found
          </h2>
          <p className="mb-4 text-gray-500">
            The fund you are looking for does not exist.
          </p>
          <Link
            href="/mutual-funds"
            className="text-sm font-bold text-primary-500"
          >
            Browse All Funds
          </Link>
        </div>
      </div>
    );
  }

  const oneYr = fund.returns?.oneYear || 0;
  const dayChange = (Math.random() - 0.4) * 2;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom flex items-center gap-2 py-3 text-sm text-gray-400">
          <Link href="/mutual-funds" className="hover:text-primary-500">
            <ArrowLeft size={16} className="inline" /> Mutual Funds
          </Link>
          <span>/</span>
          <span className="text-gray-600">{fund.amcName}</span>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Fund Header */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-1 text-sm font-semibold text-primary-500">
                {fund.amcName}
              </p>
              <h1 className="mb-3 text-2xl font-extrabold text-gray-900 lg:text-3xl">
                {fund.schemeName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {fund.category}
                </span>
                <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {fund.subCategory}
                </span>
                <span className="rounded-lg bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-500">
                  {fund.planType} Plan
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">
                NAV as on {formatDate(fund.navDate)}
              </p>
              <p className="text-3xl font-extrabold text-gray-900">
                ₹{fund.nav.toFixed(2)}
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold",
                  dayChange >= 0
                    ? "bg-positive-light text-positive"
                    : "bg-negative-light text-negative"
                )}
              >
                {dayChange >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {dayChange >= 0 ? "+" : ""}
                {dayChange.toFixed(2)} ({formatPercent(dayChange)})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              Start SIP
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-xl border-2 border-primary-500 px-6 py-3 text-sm font-bold text-primary-500 transition hover:bg-primary-50"
            >
              Invest Lumpsum
            </Link>
            <Link
              href={`/mutual-funds/compare?funds=${fund.schemeCode}`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              <GitCompare size={16} /> Compare
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* NAV Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">NAV History</h2>
                <div className="flex gap-1">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSelectedPeriod(p.label)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        selectedPeriod === p.label
                          ? "bg-primary-500 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={navHistory}>
                  <defs>
                    <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052CC" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `₹${v}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, "NAV"]}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="nav"
                    stroke="#0052CC"
                    strokeWidth={2}
                    fill="url(#navGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Returns Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Returns (Annualized)
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {[
                  ["1M", fund.returns?.oneMonth],
                  ["3M", fund.returns?.threeMonth],
                  ["1Y", fund.returns?.oneYear],
                  ["3Y", fund.returns?.threeYear],
                  ["5Y", fund.returns?.fiveYear],
                ].map(([period, value]) => (
                  <div
                    key={period as string}
                    className="rounded-xl bg-gray-50 p-4 text-center"
                  >
                    <p className="mb-1 text-xs font-semibold text-gray-400">
                      {period as string}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-extrabold",
                        value !== undefined
                          ? (value as number) >= 0
                            ? "text-positive"
                            : "text-negative"
                          : "text-gray-300"
                      )}
                    >
                      {value !== undefined ? formatPercent(value as number) : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                {REGULATORY.PAST_PERFORMANCE.split(".")[0]}.
              </p>
            </div>

            {/* Portfolio Holdings (Mock) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Top Holdings
              </h2>
              <div className="space-y-3">
                {[
                  { name: "HDFC Bank Ltd.", pct: 8.5, sector: "Banking" },
                  { name: "Infosys Ltd.", pct: 7.2, sector: "IT" },
                  { name: "ICICI Bank Ltd.", pct: 6.8, sector: "Banking" },
                  { name: "Reliance Industries", pct: 6.1, sector: "Oil & Gas" },
                  { name: "TCS Ltd.", pct: 5.4, sector: "IT" },
                  { name: "Bharti Airtel", pct: 4.8, sector: "Telecom" },
                  { name: "Kotak Mahindra Bank", pct: 4.2, sector: "Banking" },
                  { name: "HUL", pct: 3.9, sector: "FMCG" },
                  { name: "L&T", pct: 3.5, sector: "Infrastructure" },
                  { name: "Axis Bank", pct: 3.1, sector: "Banking" },
                ].map((holding, i) => (
                  <div
                    key={holding.name}
                    className="flex items-center justify-between rounded-lg py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {holding.name}
                        </p>
                        <p className="text-xs text-gray-400">{holding.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${holding.pct * 10}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-bold text-gray-900">
                        {holding.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk-O-Meter */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Riskometer
              </h3>
              <RiskOMeter level={fund.riskLevel || "High"} size="lg" />
              <p className="mt-2 text-[10px] text-gray-400">
                As per SEBI categorization
              </p>
            </div>

            {/* Fund Info */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Fund Information
              </h3>
              <div className="space-y-3">
                {[
                  ["Fund Manager", fund.fundManager || "N/A"],
                  ["Benchmark", fund.benchmark || "Nifty 50 TRI"],
                  ["Expense Ratio", `${fund.expenseRatio || 0}%`],
                  ["Min Investment", formatINR(fund.minInvestment || 5000)],
                  ["Min SIP", formatINR(fund.minSipAmount || 500)],
                  ["Exit Load", fund.exitLoad || "1% for 1 year"],
                  ["Launch Date", fund.launchDate || "01 Jan 2013"],
                  [
                    "AUM",
                    `₹${((fund.aum || 0) / 100).toFixed(0)} Cr`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0"
                  >
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheme Documents */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Scheme Documents
              </h3>
              <div className="space-y-2">
                {[
                  "Scheme Information Document (SID)",
                  "Statement of Additional Information (SAI)",
                  "Key Information Memorandum (KIM)",
                  "Factsheet",
                ].map((doc) => (
                  <a
                    key={doc}
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-primary-500"
                  >
                    <FileText size={14} />
                    {doc}
                    <ExternalLink size={10} className="ml-auto opacity-50" />
                  </a>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <SEBIDisclaimer variant="inline" />
            <p className="text-[10px] leading-relaxed text-gray-400">
              {REGULATORY.DISTRIBUTOR_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
