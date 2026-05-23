'use client';

import { useEffect, useMemo } from 'react';
import { LifeBuoy, Calculator, Wallet, IndianRupee } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import type { EmergencyProfile, TaxProfile } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  emergencyData: EmergencyProfile;
  taxData: TaxProfile;
  onUpdateEmergency: (updates: Partial<EmergencyProfile>) => void;
  onUpdateTax: (updates: Partial<TaxProfile>) => void;
  monthlyExpenses: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAX_REGIME_OPTIONS = [
  {
    value: 'old',
    label: 'Old Tax Regime',
    description:
      'Allows deductions under 80C, 80D, HRA, NPS etc. Better if you have high deductions.',
  },
  {
    value: 'new',
    label: 'New Tax Regime',
    description:
      'Lower tax rates with minimal deductions. Better if your total deductions are low.',
  },
];

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmergencyTaxStep({
  emergencyData,
  taxData,
  onUpdateEmergency,
  onUpdateTax,
  monthlyExpenses,
}: Props) {
  // ----- Auto-calculate months of expenses covered -----
  const months = useMemo(() => {
    if (monthlyExpenses <= 0) return 0;
    return Math.round((emergencyData.emergencyFundAmount / monthlyExpenses) * 10) / 10;
  }, [emergencyData.emergencyFundAmount, monthlyExpenses]);

  useEffect(() => {
    if (emergencyData.monthsOfExpensesCovered !== months) {
      onUpdateEmergency({ monthsOfExpensesCovered: months });
    }
  }, [months, emergencyData.monthsOfExpensesCovered, onUpdateEmergency]);

  // ----- Months indicator colour -----
  const monthsColor = useMemo(() => {
    if (months >= 6) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (months >= 3) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  }, [months]);

  // ----- Tax deduction summary (old regime) -----
  const taxSummary = useMemo(() => {
    const total80C = taxData.section80CUsed || 0;
    const total80D = taxData.section80DUsed || 0;
    const nps = taxData.npsContribution || 0;
    const totalDeductions = total80C + total80D + nps;
    return { total80C, total80D, nps, totalDeductions };
  }, [taxData.section80CUsed, taxData.section80DUsed, taxData.npsContribution]);

  return (
    <div className="space-y-6">
      {/* ================================================================
         A. Emergency Preparedness
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <LifeBuoy className="w-3.5 h-3.5" />
          </span>
          Emergency Preparedness
        </h3>

        <div className="space-y-4">
          {/* Q1: Has emergency fund? */}
          <RadioCards
            label="Do you have an emergency fund?"
            value={emergencyData.hasEmergencyFund ? 'yes' : 'no'}
            onChange={(v) => onUpdateEmergency({ hasEmergencyFund: v === 'yes' })}
            options={YES_NO_OPTIONS}
            columns={2}
          />

          {/* Q2: Emergency fund amount — only if hasEmergencyFund */}
          {emergencyData.hasEmergencyFund && (
            <CurrencyInput
              label="Emergency Fund Amount"
              value={emergencyData.emergencyFundAmount}
              onChange={(v) => onUpdateEmergency({ emergencyFundAmount: v })}
              min={0}
              step={10000}
              placeholder="0"
              helpText="Total liquid savings earmarked for emergencies"
            />
          )}

          {/* Q3: Months of expenses covered indicator */}
          {emergencyData.hasEmergencyFund && monthlyExpenses > 0 && (
            <div className={`rounded-xl border ${monthsColor.border} ${monthsColor.bg} p-4 space-y-2`}>
              <div className="flex items-center gap-2">
                <Wallet className={`w-4 h-4 ${monthsColor.text}`} />
                <p className={`text-sm font-bold ${monthsColor.text} tabular-nums`}>
                  Covers {months.toFixed(1)} months of expenses
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Your monthly household expenses: {formatIndian(monthlyExpenses)} /month
              </p>
              <p className="text-[10px] text-slate-400 italic">
                CFPs recommend 6-12 months of expenses as emergency fund
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-surface-300" />

      {/* ================================================================
         B. Tax Planning
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Calculator className="w-3.5 h-3.5" />
          </span>
          Tax Planning
        </h3>

        <div className="space-y-4">
          {/* Q4: Tax Regime */}
          <RadioCards
            label="Tax Regime"
            value={taxData.taxRegime}
            onChange={(v) => onUpdateTax({ taxRegime: v as 'old' | 'new' })}
            options={TAX_REGIME_OPTIONS}
            columns={2}
          />

          {/* Q5: Annual Taxable Income */}
          <CurrencyInput
            label="Annual Taxable Income"
            value={taxData.annualTaxableIncome}
            onChange={(v) => onUpdateTax({ annualTaxableIncome: v })}
            min={0}
            step={50000}
            helpText="Gross income before deductions"
          />

          {/* Old regime-specific deduction fields */}
          {taxData.taxRegime === 'old' && (
            <>
              {/* Q6: Section 80C Used */}
              <CurrencyInput
                label="Section 80C Used"
                value={taxData.section80CUsed}
                onChange={(v) => onUpdateTax({ section80CUsed: v })}
                min={0}
                max={150000}
                step={10000}
                helpText="PPF, ELSS, LIC, tuition fees etc. Max \u20B91.5L"
              />

              {/* Q7: Section 80D Used */}
              <CurrencyInput
                label="Section 80D Used"
                value={taxData.section80DUsed}
                onChange={(v) => onUpdateTax({ section80DUsed: v })}
                min={0}
                max={100000}
                step={5000}
                helpText="Health insurance premiums. Max \u20B925K-\u20B91L depending on age"
              />

              {/* Q8: Do you claim HRA? */}
              <RadioCards
                label="Do you claim HRA?"
                value={taxData.hasHRA ? 'yes' : 'no'}
                onChange={(v) => onUpdateTax({ hasHRA: v === 'yes' })}
                options={YES_NO_OPTIONS}
                columns={2}
              />

              {/* Q9: NPS Contribution */}
              <CurrencyInput
                label="NPS Contribution"
                value={taxData.npsContribution}
                onChange={(v) => onUpdateTax({ npsContribution: v })}
                min={0}
                max={200000}
                step={5000}
                helpText="Additional \u20B950K deduction under 80CCD(1B)"
              />
            </>
          )}

          {/* Tax Deduction Summary — Old Regime only */}
          {taxData.taxRegime === 'old' && taxSummary.totalDeductions > 0 && (
            <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-4">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-brand" />
                Tax Deduction Summary
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 border border-surface-300">
                  <p className="text-[11px] text-slate-500 font-medium">Section 80C</p>
                  <p className="text-lg font-bold text-brand tabular-nums">
                    {formatIndian(taxSummary.total80C)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    of {formatIndian(150000)} limit
                  </p>
                  {/* 80C utilization bar */}
                  <div className="w-full h-1.5 rounded-full bg-surface-200 mt-1.5">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min((taxSummary.total80C / 150000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 border border-surface-300">
                  <p className="text-[11px] text-slate-500 font-medium">Section 80D</p>
                  <p className="text-lg font-bold text-emerald-600 tabular-nums">
                    {formatIndian(taxSummary.total80D)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Health insurance deduction
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-surface-300">
                  <p className="text-[11px] text-slate-500 font-medium">NPS (80CCD 1B)</p>
                  <p className="text-lg font-bold text-purple-600 tabular-nums">
                    {formatIndian(taxSummary.nps)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    of {formatIndian(200000)} limit
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-brand-200 bg-brand-50/30">
                  <p className="text-[11px] text-slate-500 font-medium">Total Deductions Used</p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {formatIndian(taxSummary.totalDeductions)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tax savings potential utilised
                  </p>
                </div>
              </div>

              {/* HRA status */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    taxData.hasHRA ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-600">HRA Claim</span>
                <span className="text-[10px] text-slate-400">
                  {taxData.hasHRA ? 'Yes — claiming HRA benefit' : 'Not claiming HRA'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
         Final step note
         ================================================================ */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-center">
        <p className="text-xs font-semibold text-brand-700">
          Almost done! Click &lsquo;Get My Score&rsquo; below to see your Financial Health Score.
        </p>
      </div>
    </div>
  );
}
