'use client';

import { useMemo } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BasicMoneyFlowData {
  monthlyInHandSalary: number;
  monthlyHouseholdExpenses: number;
  monthlySIPsRunning: number;
  monthlyEMIs: number;
}

interface Props {
  data: BasicMoneyFlowData;
  onUpdate: (updates: Partial<BasicMoneyFlowData>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} L`;
  }
  return amount.toLocaleString('en-IN');
}

// ---------------------------------------------------------------------------
// Sub-section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="pt-6 pb-2 border-t border-slate-100 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
          {title}
        </h3>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BasicMoneyFlowStep({ data, onUpdate }: Props) {
  // ---------- Savings Summary ----------
  const summary = useMemo(() => {
    const monthlyIncome = data.monthlyInHandSalary;
    const monthlyOutflow =
      data.monthlyHouseholdExpenses +
      data.monthlySIPsRunning +
      data.monthlyEMIs;

    const surplus = monthlyIncome - monthlyOutflow;
    const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

    return { monthlyIncome, monthlyOutflow, surplus, savingsRate };
  }, [
    data.monthlyInHandSalary,
    data.monthlyHouseholdExpenses,
    data.monthlySIPsRunning,
    data.monthlyEMIs,
  ]);

  const savingsRateColor =
    summary.savingsRate >= 30
      ? 'text-positive'
      : summary.savingsRate >= 15
        ? 'text-accent-600'
        : 'text-negative';

  const surplusColor = summary.surplus >= 0 ? 'text-positive' : 'text-negative';

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* A. Monthly Income                                             */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<Wallet className="w-4 h-4 text-brand-600" />}
        title="Monthly Income"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Monthly In-Hand Salary */}
        <div className="sm:col-span-2">
          <CurrencyInput
            label="Monthly In-Hand Salary"
            value={data.monthlyInHandSalary}
            onChange={(val) => onUpdate({ monthlyInHandSalary: val })}
            helpText="Your take-home salary after deductions (PF, tax, etc.)"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* B. Monthly Expenses                                           */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<Receipt className="w-4 h-4 text-brand-600" />}
        title="Monthly Expenses"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Household Expenses */}
        <CurrencyInput
          label="Household Expenses"
          value={data.monthlyHouseholdExpenses}
          onChange={(val) => onUpdate({ monthlyHouseholdExpenses: val })}
          helpText="Rent, groceries, utilities, transport, school fees, etc."
        />

        {/* Running SIPs */}
        <CurrencyInput
          label="SIPs Running"
          value={data.monthlySIPsRunning}
          onChange={(val) => onUpdate({ monthlySIPsRunning: val })}
          helpText="Total of all your running SIP investments"
        />

        {/* EMIs */}
        <CurrencyInput
          label="Loan EMIs"
          value={data.monthlyEMIs}
          onChange={(val) => onUpdate({ monthlyEMIs: val })}
          helpText="Home loan, car loan, personal loan — all combined"
        />
      </div>

      {/* ============================================================ */}
      {/* Savings Summary Card                                          */}
      {/* ============================================================ */}
      {summary.monthlyIncome > 0 && (
        <div className="mt-6 p-5 rounded-xl bg-surface-100 border border-surface-300 shadow-card">
          <h4 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Quick Summary
          </h4>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            {/* Total Monthly Income */}
            <div className="text-slate-500">Monthly Income</div>
            <div className="text-right font-semibold text-primary-700">
              {formatCurrency(Math.round(summary.monthlyIncome))}
            </div>

            {/* Total Monthly Outflow */}
            <div className="text-slate-500">Monthly Outflow</div>
            <div className="text-right font-semibold text-primary-700">
              {formatCurrency(Math.round(summary.monthlyOutflow))}
            </div>

            {/* Divider */}
            <div className="col-span-2 border-t border-slate-200 my-1" />

            {/* Monthly Surplus */}
            <div className="text-slate-500">Monthly Surplus</div>
            <div className={`text-right font-bold ${surplusColor}`}>
              {summary.surplus < 0 ? '-' : ''}
              {formatCurrency(Math.abs(Math.round(summary.surplus)))}
            </div>

            {/* Savings Rate */}
            <div className="text-slate-500">Savings Rate</div>
            <div className={`text-right font-bold ${savingsRateColor}`}>
              {summary.savingsRate.toFixed(1)}%
            </div>
          </div>

          {/* Color-coded insight */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            {summary.savingsRate >= 30 && (
              <p className="text-xs text-positive font-medium">
                Excellent! You are saving more than 30% of your income. This is a strong foundation for wealth building.
              </p>
            )}
            {summary.savingsRate >= 15 && summary.savingsRate < 30 && (
              <p className="text-xs text-accent-600 font-medium">
                Good start. Try to increase your savings rate to 30%+ for faster goal achievement.
              </p>
            )}
            {summary.savingsRate >= 0 && summary.savingsRate < 15 && (
              <p className="text-xs text-negative font-medium">
                Your savings rate is below 15%. We will help you find ways to improve this in your plan.
              </p>
            )}
            {summary.savingsRate < 0 && (
              <p className="text-xs text-negative font-medium">
                Your expenses exceed your income. This needs immediate attention — we will prioritise this in your plan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
