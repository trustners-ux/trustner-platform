'use client';

import { useMemo } from 'react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import type { AssetProfile } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  data: AssetProfile;
  onUpdate: (updates: Partial<AssetProfile>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as "X L" or "X Cr" for Indian shorthand. */
function formatIndian(value: number): string {
  if (value <= 0) return '\u20B90';
  if (value >= 1_00_00_000) {
    const cr = value / 1_00_00_000;
    return `\u20B9${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 1_00_000) {
    const l = value / 1_00_000;
    return `\u20B9${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
  }
  return `\u20B9${value.toLocaleString('en-IN')}`;
}

// Allocation categories with color mapping
const CATEGORIES = [
  { key: 'equity', label: 'Equity', color: 'bg-blue-500', textColor: 'text-blue-600', dotColor: 'bg-blue-500' },
  { key: 'debt', label: 'Debt', color: 'bg-emerald-500', textColor: 'text-emerald-600', dotColor: 'bg-emerald-500' },
  { key: 'gold', label: 'Gold', color: 'bg-amber-400', textColor: 'text-amber-600', dotColor: 'bg-amber-400' },
  { key: 'realEstate', label: 'Real Estate', color: 'bg-purple-500', textColor: 'text-purple-600', dotColor: 'bg-purple-500' },
  { key: 'cash', label: 'Cash', color: 'bg-slate-400', textColor: 'text-slate-500', dotColor: 'bg-slate-400' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssetsInvestmentsStep({ data, onUpdate }: Props) {
  // ----- Computed allocation totals -----
  const allocation = useMemo(() => {
    const equity = (data.mutualFunds || 0) + (data.stocks || 0);
    const debt = (data.fixedDeposits || 0) + (data.ppfEpf || 0) + (data.nps || 0);
    const gold = data.gold || 0;
    const realEstate = (data.realEstateInvestment || 0) + (data.primaryResidenceValue || 0);
    const cash = data.bankSavings || 0;
    const other = data.otherAssets || 0;

    const totalFinancial =
      (data.bankSavings || 0) +
      (data.fixedDeposits || 0) +
      (data.mutualFunds || 0) +
      (data.stocks || 0) +
      (data.ppfEpf || 0) +
      (data.nps || 0) +
      (data.gold || 0) +
      (data.realEstateInvestment || 0) +
      (data.otherAssets || 0);

    const totalIncludingProperty = totalFinancial + (data.primaryResidenceValue || 0);

    // For the stacked bar, include "other" in equity bucket (market-linked approximation)
    const barEquity = equity + other;
    const barTotal = barEquity + debt + gold + realEstate + cash;

    return {
      equity,
      debt,
      gold,
      realEstate,
      cash,
      other,
      totalFinancial,
      totalIncludingProperty,
      barEquity,
      barTotal,
      percentages: barTotal > 0
        ? {
            equity: (barEquity / barTotal) * 100,
            debt: (debt / barTotal) * 100,
            gold: (gold / barTotal) * 100,
            realEstate: (realEstate / barTotal) * 100,
            cash: (cash / barTotal) * 100,
          }
        : { equity: 0, debt: 0, gold: 0, realEstate: 0, cash: 0 },
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* ================================================================
         A. Bank & Fixed Income
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand text-[11px] font-extrabold">
            A
          </span>
          Bank &amp; Fixed Income
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Savings Account Balance"
            value={data.bankSavings}
            onChange={(v) => onUpdate({ bankSavings: v })}
            min={0}
          />
          <CurrencyInput
            label="Fixed Deposits"
            value={data.fixedDeposits}
            onChange={(v) => onUpdate({ fixedDeposits: v })}
            min={0}
          />
          <CurrencyInput
            label="PPF / EPF Balance"
            value={data.ppfEpf}
            onChange={(v) => onUpdate({ ppfEpf: v })}
            min={0}
            helpText="Combined PPF + Employee Provident Fund"
          />
          <CurrencyInput
            label="NPS Investment"
            value={data.nps}
            onChange={(v) => onUpdate({ nps: v })}
            min={0}
            helpText="National Pension System"
          />
        </div>
      </section>

      {/* ================================================================
         B. Market-Linked Investments
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand text-[11px] font-extrabold">
            B
          </span>
          Market-Linked Investments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Mutual Fund Investments"
            value={data.mutualFunds}
            onChange={(v) => onUpdate({ mutualFunds: v })}
            min={0}
            helpText="Current value of all MF holdings"
          />
          <CurrencyInput
            label="Direct Equity / Stocks"
            value={data.stocks}
            onChange={(v) => onUpdate({ stocks: v })}
            min={0}
          />
        </div>
      </section>

      {/* ================================================================
         C. Physical & Other Assets
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand text-[11px] font-extrabold">
            C
          </span>
          Physical &amp; Other Assets
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Gold Investments"
            value={data.gold}
            onChange={(v) => onUpdate({ gold: v })}
            min={0}
            helpText="Physical gold, Gold ETF, SGB combined"
          />
          <CurrencyInput
            label="Real Estate (Investment)"
            value={data.realEstateInvestment}
            onChange={(v) => onUpdate({ realEstateInvestment: v })}
            min={0}
            helpText="Excluding your primary residence"
          />
          <CurrencyInput
            label="Primary Residence Value"
            value={data.primaryResidenceValue}
            onChange={(v) => onUpdate({ primaryResidenceValue: v })}
            min={0}
            helpText="Approximate market value of home you live in"
          />
          <CurrencyInput
            label="Other Assets"
            value={data.otherAssets}
            onChange={(v) => onUpdate({ otherAssets: v })}
            min={0}
            helpText="Crypto, art, collectibles, other investments"
          />
        </div>
      </section>

      {/* ================================================================
         Total Assets Summary
         ================================================================ */}
      <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-4">
        <h4 className="text-sm font-bold text-primary">Total Assets Summary</h4>

        {/* Headline numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white p-3 border border-surface-300">
            <p className="text-[11px] text-slate-500 font-medium">Total Financial Assets</p>
            <p className="text-lg font-bold text-brand tabular-nums">
              {formatIndian(allocation.totalFinancial)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-surface-300">
            <p className="text-[11px] text-slate-500 font-medium">Total Including Property</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {formatIndian(allocation.totalIncludingProperty)}
            </p>
          </div>
        </div>

        {/* Stacked horizontal bar */}
        {allocation.barTotal > 0 && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Asset Allocation
            </p>

            {/* The bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-surface-200">
              {CATEGORIES.map((cat) => {
                const pct = allocation.percentages[cat.key];
                if (pct <= 0) return null;
                return (
                  <div
                    key={cat.key}
                    className={`${cat.color} transition-all duration-500 ease-smooth first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${pct}%` }}
                    title={`${cat.label}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {CATEGORIES.map((cat) => {
                const pct = allocation.percentages[cat.key];
                if (pct <= 0) return null;
                const rawValue =
                  cat.key === 'equity'
                    ? allocation.barEquity
                    : cat.key === 'debt'
                      ? allocation.debt
                      : cat.key === 'gold'
                        ? allocation.gold
                        : cat.key === 'realEstate'
                          ? allocation.realEstate
                          : allocation.cash;

                return (
                  <div key={cat.key} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColor}`} />
                    <span className={`text-[11px] font-semibold ${cat.textColor}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {pct.toFixed(0)}% &middot; {formatIndian(rawValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allocation.barTotal === 0 && (
          <p className="text-xs text-slate-400 italic">
            Enter your asset values above to see your allocation breakdown.
          </p>
        )}
      </div>
    </div>
  );
}
