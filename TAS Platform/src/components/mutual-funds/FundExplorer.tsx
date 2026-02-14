"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronRight,
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

  const filteredFunds = useMemo(() => {
    let funds = [...MOCK_TOP_FUNDS];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      funds = funds.filter(
        (f) =>
          f.schemeName.toLowerCase().includes(q) ||
          f.amcName.toLowerCase().includes(q) ||
          f.subCategory.toLowerCase().includes(q)
      );
    }

    // Category group filter
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

    // Plan type filter
    if (planType !== "all") {
      funds = funds.filter((f) => f.planType === planType);
    }

    // Sort
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
            Explore Mutual Funds
          </h1>
          <p className="text-gray-500">
            Compare and invest in 5000+ mutual funds across all SEBI categories
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by fund name, AMC, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={planType}
              onChange={(e) =>
                setPlanType(e.target.value as "all" | "Direct" | "Regular")
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none"
            >
              <option value="all">All Plans</option>
              <option value="Direct">Direct</option>
              <option value="Regular">Regular</option>
            </select>

            <div className="flex rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "rounded-l-xl p-3 transition",
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
                  "rounded-r-xl p-3 transition",
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

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGroup("all")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              selectedGroup === "all"
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
            )}
          >
            All Funds
          </button>
          {FUND_CATEGORY_GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                selectedGroup === group.id
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
              )}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {filteredFunds.length}
            </span>{" "}
            funds
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by:</span>
            {(
              [
                ["returns1Y", "1Y Returns"],
                ["returns3Y", "3Y Returns"],
                ["nav", "NAV"],
              ] as [SortField, string][]
            ).map(([field, label]) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition",
                  sortBy === field
                    ? "bg-primary-50 text-primary-500"
                    : "hover:bg-gray-100"
                )}
              >
                {label}
                {sortBy === field && (
                  <ArrowUpDown size={12} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fund Cards Grid */}
        {viewMode === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFunds.map((fund) => {
              const oneYr = fund.returns?.oneYear || 0;
              const threeYr = fund.returns?.threeYear || 0;
              const fiveYr = fund.returns?.fiveYear || 0;

              return (
                <Link
                  key={fund.schemeCode}
                  href={`/mutual-funds/${fund.schemeCode}`}
                  className="card-hover group rounded-2xl border border-gray-100 bg-white p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary-500">
                        {fund.amcName}
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-primary-500">
                        {fund.schemeName}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {fund.subCategory}
                        </span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {fund.planType}
                        </span>
                      </div>
                    </div>
                    {fund.riskLevel && (
                      <RiskOMeter level={fund.riskLevel} size="sm" showLabel={false} />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-gray-400">
                        1Y Returns
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          oneYr >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {formatPercent(oneYr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-gray-400">
                        3Y Returns
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          threeYr >= 0 ? "text-positive" : "text-negative"
                        )}
                      >
                        {formatPercent(threeYr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-gray-400">
                        NAV
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        ₹{fund.nav.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      AUM: ₹{((fund.aum || 0) / 100).toFixed(0)} Cr
                    </p>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary-500 opacity-0 transition group-hover:opacity-100">
                      View Details <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 pl-5 pr-3 text-left text-xs font-bold uppercase text-gray-500">
                    Fund Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase text-gray-500">
                    Category
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase text-gray-500"
                    onClick={() => toggleSort("returns1Y")}
                  >
                    1Y Returns
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase text-gray-500"
                    onClick={() => toggleSort("returns3Y")}
                  >
                    3Y Returns
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right text-xs font-bold uppercase text-gray-500"
                    onClick={() => toggleSort("nav")}
                  >
                    NAV
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase text-gray-500">
                    Risk
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund) => (
                  <tr
                    key={fund.schemeCode}
                    className="border-b border-gray-50 transition hover:bg-primary-50/30"
                  >
                    <td className="py-4 pl-5 pr-3">
                      <Link
                        href={`/mutual-funds/${fund.schemeCode}`}
                        className="hover:text-primary-500"
                      >
                        <p className="text-xs font-medium text-gray-400">
                          {fund.amcName}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {fund.schemeName}
                        </p>
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                        {fund.subCategory}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <span
                        className={cn(
                          "font-bold",
                          (fund.returns?.oneYear || 0) >= 0
                            ? "text-positive"
                            : "text-negative"
                        )}
                      >
                        {formatPercent(fund.returns?.oneYear || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <span
                        className={cn(
                          "font-bold",
                          (fund.returns?.threeYear || 0) >= 0
                            ? "text-positive"
                            : "text-negative"
                        )}
                      >
                        {formatPercent(fund.returns?.threeYear || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-semibold text-gray-900">
                      ₹{fund.nav.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-xs font-medium text-gray-500">
                        {fund.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/mutual-funds/${fund.schemeCode}`}
                        className="text-xs font-bold text-primary-500"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
