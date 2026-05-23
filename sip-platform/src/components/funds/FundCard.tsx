'use client';

import Link from 'next/link';
import { StarRating } from './StarRatingShared';
import { LiveFundSummary } from '@/types/live-fund';

interface FundCardProps {
  fund: LiveFundSummary;
  selected?: boolean;
  onToggleCompare?: (schemeCode: number) => void;
  showCompare?: boolean;
}

function formatReturn(value: number | null): { text: string; color: string } {
  if (value === null || value === undefined) {
    return { text: 'N/A', color: 'text-gray-400' };
  }
  // Returns from LiveFundSummary are decimal (CAGR), e.g. 0.15 = 15%
  const pct = value * 100;
  const text = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const color = pct >= 0 ? 'text-green-600' : 'text-red-500';
  return { text, color };
}

function formatAUM(aum: number | null): string {
  if (aum === null || aum === undefined) return 'N/A';
  return `\u20B9${new Intl.NumberFormat('en-IN').format(Math.round(aum))} Cr`;
}

function formatExpenseRatio(ratio: number | null): string {
  if (ratio === null || ratio === undefined) return 'N/A';
  // Expense ratio stored as decimal (e.g. 0.0045 = 0.45%)
  return `${(ratio * 100).toFixed(2)}%`;
}

function formatNav(nav: number): string {
  return `\u20B9${nav.toFixed(2)}`;
}

export function FundCard({
  fund,
  selected = false,
  onToggleCompare,
  showCompare = false,
}: FundCardProps) {
  const oneY = formatReturn(fund.returns.oneYear);
  const threeY = formatReturn(fund.returns.threeYear);
  const fiveY = formatReturn(fund.returns.fiveYear);

  return (
    <div
      className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
        selected ? 'border-teal-600 ring-2 ring-teal-100' : 'border-gray-200'
      }`}
    >
      {/* Top row: Name + Category + Compare checkbox */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0 flex-1">
          <Link
            href={`/funds/${fund.slug}`}
            className="font-semibold text-sm text-gray-900 hover:text-teal-700 transition-colors line-clamp-2"
          >
            {fund.schemeName}
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {fund.category}
          </span>
          {showCompare && onToggleCompare && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleCompare(fund.schemeCode)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              title="Add to compare"
            />
          )}
        </div>
      </div>

      {/* Fund house */}
      <p className="text-xs text-gray-500 mb-2">{fund.fundHouse}</p>

      {/* Star rating */}
      {fund.rating !== null && fund.rating > 0 && (
        <div className="mb-3">
          <StarRating rating={fund.rating} size="sm" />
        </div>
      )}

      {/* Returns grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">1Y Return</div>
          <div className={`text-sm font-semibold ${oneY.color}`}>
            {oneY.text}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">3Y Return</div>
          <div className={`text-sm font-semibold ${threeY.color}`}>
            {threeY.text}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">5Y Return</div>
          <div className={`text-sm font-semibold ${fiveY.color}`}>
            {fiveY.text}
          </div>
        </div>
      </div>

      {/* Bottom row: AUM, Expense Ratio, NAV */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div>
          <span className="text-gray-400">AUM </span>
          <span className="font-medium text-gray-700">
            {formatAUM(fund.aum)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">TER </span>
          <span className="font-medium text-gray-700">
            {formatExpenseRatio(fund.expenseRatio)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">NAV </span>
          <span className="font-medium text-gray-700">
            {formatNav(fund.currentNav)}
          </span>
        </div>
      </div>
    </div>
  );
}
