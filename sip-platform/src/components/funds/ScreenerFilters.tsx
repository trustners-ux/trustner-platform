'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { FUND_CATEGORIES } from '@/data/funds/categories';
import type { ScreenerFilterState, RiskLevel } from '@/lib/hooks/useScreener';

interface ScreenerFiltersProps {
  filters: ScreenerFilterState;
  onFilterChange: <K extends keyof ScreenerFilterState>(key: K, value: ScreenerFilterState[K]) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const RISK_LEVELS: RiskLevel[] = ['Low', 'Moderate', 'Moderately High', 'High', 'Very High'];

const CATEGORY_OPTIONS = FUND_CATEGORIES.map((c) => c.name);

export function ScreenerFilters({
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
}: ScreenerFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleRiskToggle = (risk: RiskLevel) => {
    const current = filters.riskLevels;
    if (current.includes(risk)) {
      onFilterChange('riskLevels', current.filter((r) => r !== risk));
    } else {
      onFilterChange('riskLevels', [...current, risk]);
    }
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Category */}
      <FilterSection title="Category">
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value || null)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </FilterSection>

      {/* AUM Range */}
      <FilterSection title="AUM Range (Crores)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.aumMin ?? ''}
            onChange={(e) => onFilterChange('aumMin', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
            min={0}
          />
          <span className="text-gray-400 text-xs flex-shrink-0">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.aumMax ?? ''}
            onChange={(e) => onFilterChange('aumMax', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
            min={0}
          />
        </div>
      </FilterSection>

      {/* Expense Ratio Max */}
      <FilterSection title="Max Expense Ratio (TER)">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {filters.expenseRatioMax !== null
                ? `Up to ${(filters.expenseRatioMax * 100).toFixed(1)}%`
                : 'Any'}
            </span>
            {filters.expenseRatioMax !== null && (
              <button
                onClick={() => onFilterChange('expenseRatioMax', null)}
                className="text-xs text-teal-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={10}
            value={filters.expenseRatioMax !== null ? filters.expenseRatioMax * 10000 : 300}
            onChange={(e) => {
              const val = Number(e.target.value);
              onFilterChange('expenseRatioMax', val >= 300 ? null : val / 10000);
            }}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0%</span>
            <span>1%</span>
            <span>2%</span>
            <span>3%</span>
          </div>
        </div>
      </FilterSection>

      {/* Min 3Y Return */}
      <FilterSection title="Min 3Y Return (CAGR)">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {filters.minThreeYearReturn !== null
                ? `At least ${(filters.minThreeYearReturn * 100).toFixed(0)}%`
                : 'Any'}
            </span>
            {filters.minThreeYearReturn !== null && (
              <button
                onClick={() => onFilterChange('minThreeYearReturn', null)}
                className="text-xs text-teal-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={filters.minThreeYearReturn !== null ? filters.minThreeYearReturn * 100 : 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              onFilterChange('minThreeYearReturn', val === 0 ? null : val / 100);
            }}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0%</span>
            <span>10%</span>
            <span>20%</span>
            <span>30%</span>
            <span>40%</span>
            <span>50%</span>
          </div>
        </div>
      </FilterSection>

      {/* Risk Level */}
      <FilterSection title="Risk Level">
        <div className="space-y-2">
          {RISK_LEVELS.map((risk) => (
            <label
              key={risk}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.riskLevels.includes(risk)}
                onChange={() => handleRiskToggle(risk)}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-teal-700 transition-colors">
                {risk}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
            </div>
            {activeFilterCount > 0 && (
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Mobile collapsible */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-gray-900 text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {mobileOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {mobileOpen && (
          <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 animate-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">Adjust filters to narrow results</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {filterContent}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Filter Section Wrapper ───

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </label>
      {children}
    </div>
  );
}
