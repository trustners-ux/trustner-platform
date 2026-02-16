"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronRight,
  GitCompare,
  X,
  SlidersHorizontal,
  SearchX,
} from "lucide-react";
import { MOCK_TOP_FUNDS } from "@/data/mock-funds";
import {
  FUND_CATEGORY_GROUPS,
  FUND_CATEGORIES,
} from "@/lib/constants/fund-categories";
import { formatPercent } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import RiskOMeter from "./RiskOMeter";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

type SortField = "name" | "returns1Y" | "returns3Y" | "returns5Y" | "nav" | "aum";
type ViewMode = "card" | "table";

export default function FundExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("returns1Y");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [planType, setPlanType] = useState<"all" | "Direct" | "Regular">("all");
  const [compareFunds, setCompareFunds] = useState<number[]>([]);

  const filteredFunds = useMemo(() => {
    let funds = [...MOCK_TOP_FUNDS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      funds = funds.filter(
        (f) =>
          f.schemeName.toLowerCase().includes(q) ||
          f.amcName.toLowerCase().includes(q) ||
          f.subCategory.toLowerCase().includes(q)
      );
    }

    if (selectedGroup !== "all") {
      const groupCategories = FUND_CATEGORIES.filter(
        (c) => c.group === selectedGroup
      ).map((c) => c.name);
      funds = funds.filter(
        (f) =>
          f.category.toLowerCase() === selectedGroup ||
          groupCategories.some((gc) =>
            f.subCategory.toLowerCase().includes(gc.toLowerCase())
          )
      );
    }

    if (planType !== "all") {
      funds = funds.filter((f) => f.planType === planType);
    }

    funds.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case "returns1Y":
          aVal = a.returns?.oneYear || 0;
          bVal = b.returns?.oneYear || 0;
          break;
        case "returns3Y":
          aVal = a.returns?.threeYear || 0;
          bVal = b.returns?.threeYear || 0;
          break;
        case "returns5Y":
          aVal = a.returns?.fiveYear || 0;
          bVal = b.returns?.fiveYear || 0;
          break;
        case "nav":
          aVal = a.nav;
          bVal = b.nav;
          break;
        case "aum":
          aVal = a.aum || 0;
          bVal = b.aum || 0;
          break;
        default:
          return a.schemeName.localeCompare(b.schemeName) * (sortDir === "asc" ? 1 : -1);
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    return funds;
  }, [searchQuery, selectedGroup, selectedCategory, sortBy, sortDir, planType]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const toggleCompare = (code: number) => {
    setCompareFunds((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : prev.length < 4 ? [...prev, code] : prev
    );
  };

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Header with Search */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10 lg:py-14">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Mutual Funds</span>
          </div>
          <h1 className="mb-2 text-3xl font-extrabold lg:text-4xl">
            Explore Mutual Funds
          </h1>
          <p className="mb-8 max-w-xl text-gray-400">
            Compare and invest in 5000+ mutual funds across all SEBI categories. Find the right fund for your goals.
          </p>

          {/* Search Bar in Hero */}
          <div className="relative max-w-2xl">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by fund name, AMC, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 pl-14 pr-5 text-base text-white placeholder-gray-500 outline-none backdrop-blur-lg transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filter Row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Category Tabs */}
          <div className="flex flex-1 flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup("all")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                selectedGroup === "all"
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                  : "bg-white text-gray-600 shadow-card hover:bg-gray-50"
              )}
            >
              All Funds
            </button>
            {FUND_CATEGORY_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  selectedGroup === group.id
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                    : "bg-white text-gray-600 shadow-card hover:bg-gray-50"
                )}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Plan Type & View Toggle */}
          <div className="flex items-center gap-2">
            <select
              value={planType}
              onChange={(e) =>
                setPlanType(e.target.value as "all" | "Direct" | "Regular")
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-card outline-none"
            >
              <option value="all">All Plans</option>
              <option value="Direct">Direct</option>
              <option value="Regular">Regular</option>
            </select>

            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "p-2.5 transition",
                  viewMode === "card"
                    ? "bg-primary-500 text-white"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2.5 transition",
                  viewMode === "table"
                    ? "bg-primary-500 text-white"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Results & Sort Bar */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {filteredFunds.length}
            </span>{" "}
            funds
          </p>
          <div className="hidden items-center gap-1.5 sm:flex">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="mr-1 text-xs text-gray-400">Sort:</span>
            {(
              [
                ["returns1Y", "1Y Returns"],
                ["returns3Y", "3Y Returns"],
                ["returns5Y", "5Y Returns"],
                ["nav", "NAV"],
              ] as [SortField, string][]
            ).map(([field, label]) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  sortBy === field
                    ? "bg-primary-50 text-primary-500"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {label}
                {sortBy === field && <ArrowUpDown size={11} />}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredFunds.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
            <SearchX size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-bold text-gray-700">No funds found</h3>
            <p className="mb-4 text-sm text-gray-500">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGroup("all");
                setPlanType("all");
              }}
              className="text-sm font-bold text-primary-500 transition hover:text-primary-600"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === "card" ? (
          /* Card Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFunds.map((fund) => {
              const oneYr = fund.returns?.oneYear || 0;
              const threeYr = fund.returns?.threeYear || 0;
              const isComparing = compareFunds.includes(fund.schemeCode);

              return (
                <div
                  key={fund.schemeCode}
                  className={cn(
                    "group relative rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
                    isComparing ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-100"
                  )}
                >
                  {/* Compare Checkbox */}
                  <button
                    onClick={() => toggleCompare(fund.schemeCode)}
                    className={cn(
                      "absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border-2 text-xs font-bold transition-all",
                      isComparing
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-200 text-transparent hover:border-primary-300"
                    )}
                    title="Add to compare"
                  >
                    {isComparing && "✓"}
                  </button>

                  <Link href={`/mutual-funds/${fund.schemeCode}`}>
                    <div className="mb-3 pr-8">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-500">
                        {fund.amcName}
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-primary-500 line-clamp-2">
                        {fund.schemeName}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {fund.subCategory}
                        </span>
                        <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-500">
                          {fund.planType}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-gray-400">1Y</p>
                        <p className={cn("text-sm font-bold", oneYr >= 0 ? "text-positive" : "text-negative")}>
                          {formatPercent(oneYr)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-gray-400">3Y</p>
                        <p className={cn("text-sm font-bold", threeYr >= 0 ? "text-positive" : "text-negative")}>
                          {formatPercent(threeYr)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-gray-400">NAV</p>
                        <p className="text-sm font-bold text-gray-900">₹{fund.nav.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-gray-400">
                          AUM: ₹{((fund.aum || 0) / 100).toFixed(0)} Cr
                        </p>
                        {fund.riskLevel && (
                          <RiskOMeter level={fund.riskLevel} size="sm" showLabel={false} />
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary-500 opacity-0 transition group-hover:opacity-100">
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="w-8 py-3 pl-4">
                    <GitCompare size={14} className="text-gray-400" />
                  </th>
                  <th className="py-3 pl-2 pr-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Fund Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Category
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-primary-500"
                    onClick={() => toggleSort("returns1Y")}
                  >
                    <span className="inline-flex items-center gap-1">
                      1Y {sortBy === "returns1Y" && <ArrowUpDown size={10} />}
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-primary-500"
                    onClick={() => toggleSort("returns3Y")}
                  >
                    <span className="inline-flex items-center gap-1">
                      3Y {sortBy === "returns3Y" && <ArrowUpDown size={10} />}
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-primary-500"
                    onClick={() => toggleSort("nav")}
                  >
                    <span className="inline-flex items-center gap-1">
                      NAV {sortBy === "nav" && <ArrowUpDown size={10} />}
                    </span>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                    Risk
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund, idx) => {
                  const isComparing = compareFunds.includes(fund.schemeCode);
                  return (
                    <tr
                      key={fund.schemeCode}
                      className={cn(
                        "border-b border-gray-50 transition hover:bg-primary-50/30",
                        idx % 2 === 0 && "bg-gray-50/30",
                        isComparing && "bg-primary-50/50"
                      )}
                    >
                      <td className="py-3 pl-4">
                        <button
                          onClick={() => toggleCompare(fund.schemeCode)}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border-2 text-[10px] font-bold transition-all",
                            isComparing
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-gray-300 hover:border-primary-400"
                          )}
                        >
                          {isComparing && "✓"}
                        </button>
                      </td>
                      <td className="py-3.5 pl-2 pr-3">
                        <Link href={`/mutual-funds/${fund.schemeCode}`} className="hover:text-primary-500">
                          <p className="text-[10px] font-medium text-gray-400">{fund.amcName}</p>
                          <p className="font-semibold text-gray-900 line-clamp-1">{fund.schemeName}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
                          {fund.subCategory}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className={cn("font-bold", (fund.returns?.oneYear || 0) >= 0 ? "text-positive" : "text-negative")}>
                          {formatPercent(fund.returns?.oneYear || 0)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className={cn("font-bold", (fund.returns?.threeYear || 0) >= 0 ? "text-positive" : "text-negative")}>
                          {formatPercent(fund.returns?.threeYear || 0)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold text-gray-900">
                        ₹{fund.nav.toFixed(2)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-[10px] font-semibold text-gray-500">{fund.riskLevel}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <Link href={`/mutual-funds/${fund.schemeCode}`} className="text-xs font-bold text-primary-500 transition hover:text-primary-600">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Compare Bar */}
      {compareFunds.length >= 2 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 shadow-elevated backdrop-blur-lg">
          <div className="container-custom flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <GitCompare size={18} className="text-primary-500" />
              <span className="text-sm font-bold text-gray-900">
                {compareFunds.length} funds selected
              </span>
              <button
                onClick={() => setCompareFunds([])}
                className="text-xs font-medium text-gray-500 transition hover:text-negative"
              >
                Clear
              </button>
            </div>
            <Link
              href={`/mutual-funds/compare?funds=${compareFunds.join(",")}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600"
            >
              Compare Now <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
