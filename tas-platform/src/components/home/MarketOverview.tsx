"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { MOCK_TOP_FUNDS } from "@/data/mock-funds";
import { formatPercent } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

export default function MarketOverview() {
  const topPerformers = [...MOCK_TOP_FUNDS]
    .sort((a, b) => (b.returns?.oneYear || 0) - (a.returns?.oneYear || 0))
    .slice(0, 6);

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-positive-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-positive">
              Top Performers
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trending Mutual Funds
            </h2>
          </div>
          <Link
            href="/mutual-funds"
            className="hidden items-center gap-1 text-sm font-bold text-primary-500 transition hover:gap-2 sm:flex"
          >
            View All Funds <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topPerformers.map((fund) => {
            const oneYr = fund.returns?.oneYear || 0;
            const isPositive = oneYr >= 0;

            return (
              <Link
                key={fund.schemeCode}
                href={`/mutual-funds/${fund.schemeCode}`}
                className="card-hover group rounded-2xl border border-gray-100 bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400">
                      {fund.amcName}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary-500">
                      {fund.schemeName}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "ml-3 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold",
                      isPositive
                        ? "bg-positive-light text-positive"
                        : "bg-negative-light text-negative"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {formatPercent(oneYr)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-xs text-gray-400">NAV</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{fund.nav.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">3Y Returns</p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        (fund.returns?.threeYear || 0) >= 0
                          ? "text-positive"
                          : "text-negative"
                      )}
                    >
                      {formatPercent(fund.returns?.threeYear || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="text-xs font-semibold text-gray-600">
                      {fund.subCategory}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/mutual-funds"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary-500"
          >
            View All Funds <ArrowRight size={16} />
          </Link>
        </div>

        <p className="mt-6 text-center text-xs italic text-gray-400">
          Past performance is not indicative of future results.
        </p>
      </div>
    </section>
  );
}
