'use client';

import { useState, useMemo } from 'react';
import { Home, Car, User, GraduationCap, CreditCard, ChevronDown, PartyPopper, AlertTriangle } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import type { LiabilityProfile, LoanDetail } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  data: LiabilityProfile;
  onUpdate: (updates: Partial<LiabilityProfile>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Determine if the user actually has non-zero loan data already filled in. */
function hasExistingDebt(data: LiabilityProfile): boolean {
  const loans: LoanDetail[] = [data.homeLoan, data.carLoan, data.personalLoan, data.educationLoan];
  const hasLoanData = loans.some((l) => l.outstanding > 0 || l.emi > 0);
  return hasLoanData || data.creditCardDebt > 0 || data.otherLoans > 0;
}

// ---------------------------------------------------------------------------
// Loan Section Configuration
// ---------------------------------------------------------------------------

interface LoanConfig {
  key: 'homeLoan' | 'carLoan' | 'personalLoan' | 'educationLoan';
  label: string;
  icon: React.ReactNode;
  accentBg: string;
  accentBorder: string;
  accentIcon: string;
  helpText?: string;
}

const LOAN_CONFIGS: LoanConfig[] = [
  {
    key: 'homeLoan',
    label: 'Home Loan',
    icon: <Home className="w-4 h-4" />,
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200 hover:border-teal-400',
    accentIcon: 'bg-teal-100 text-teal-600',
  },
  {
    key: 'carLoan',
    label: 'Car Loan',
    icon: <Car className="w-4 h-4" />,
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200 hover:border-blue-400',
    accentIcon: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'personalLoan',
    label: 'Personal Loan',
    icon: <User className="w-4 h-4" />,
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200 hover:border-amber-400',
    accentIcon: 'bg-amber-100 text-amber-600',
    helpText: 'Includes salary advance, consumer durable loans',
  },
  {
    key: 'educationLoan',
    label: 'Education Loan',
    icon: <GraduationCap className="w-4 h-4" />,
    accentBg: 'bg-purple-50',
    accentBorder: 'border-purple-200 hover:border-purple-400',
    accentIcon: 'bg-purple-100 text-purple-600',
  },
];

// ---------------------------------------------------------------------------
// Collapsible Loan Card
// ---------------------------------------------------------------------------

function LoanCard({
  config,
  loanData,
  expanded,
  onToggle,
  onLoanUpdate,
}: {
  config: LoanConfig;
  loanData: LoanDetail;
  expanded: boolean;
  onToggle: () => void;
  onLoanUpdate: (updates: Partial<LoanDetail>) => void;
}) {
  const hasValues = loanData.outstanding > 0 || loanData.emi > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        expanded ? config.accentBorder.replace('hover:', '') : config.accentBorder
      } ${expanded ? config.accentBg : 'bg-white'}`}
    >
      {/* Header — click to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.accentIcon}`}>
            {config.icon}
          </div>
          <div>
            <span className="text-sm font-semibold text-primary-700">{config.label}</span>
            {hasValues && !expanded && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Outstanding: {formatIndian(loanData.outstanding)} &middot; EMI: {formatIndian(loanData.emi)}
              </p>
            )}
            {config.helpText && !hasValues && !expanded && (
              <p className="text-[10px] text-slate-400 mt-0.5">{config.helpText}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded fields */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-slide-down">
          {config.helpText && (
            <p className="text-[11px] text-slate-400 -mt-1">{config.helpText}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyInput
              label="Outstanding Amount"
              value={loanData.outstanding}
              onChange={(v) => onLoanUpdate({ outstanding: v })}
              min={0}
            />
            <CurrencyInput
              label="Monthly EMI"
              value={loanData.emi}
              onChange={(v) => onLoanUpdate({ emi: v })}
              min={0}
            />
          </div>

          {/* Remaining Years — plain number input */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Remaining Years
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={loanData.remainingYears || ''}
              onChange={(e) => {
                const val = Math.min(30, Math.max(0, Number(e.target.value) || 0));
                onLoanUpdate({ remainingYears: val });
              }}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm font-semibold text-primary-700 outline-none transition-all focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LiabilitiesStep({ data, onUpdate }: Props) {
  // Determine initial toggle state from existing data
  const [hasLoans, setHasLoans] = useState<string>(
    hasExistingDebt(data) ? 'yes' : ''
  );
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  // ----- Computed summary -----
  const summary = useMemo(() => {
    const loans: LoanDetail[] = [data.homeLoan, data.carLoan, data.personalLoan, data.educationLoan];
    const totalOutstanding =
      loans.reduce((sum, l) => sum + (l.outstanding || 0), 0) +
      (data.creditCardDebt || 0) +
      (data.otherLoans || 0);
    const totalEMI = loans.reduce((sum, l) => sum + (l.emi || 0), 0);

    // Simple severity heuristic based on total outstanding
    let severity: 'manageable' | 'moderate' | 'heavy' = 'manageable';
    if (totalOutstanding > 50_00_000) severity = 'heavy';
    else if (totalOutstanding > 10_00_000) severity = 'moderate';

    return { totalOutstanding, totalEMI, severity };
  }, [data]);

  // ----- Handler to update a nested loan -----
  const updateLoan = (key: LoanConfig['key'], updates: Partial<LoanDetail>) => {
    onUpdate({
      [key]: { ...data[key], ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* ================================================================
         Opening Question
         ================================================================ */}
      <RadioCards
        label="Do you have any outstanding loans or debts?"
        value={hasLoans}
        onChange={(v) => setHasLoans(v)}
        options={[
          {
            value: 'yes',
            label: 'Yes, I have loans',
            icon: <CreditCard className="w-5 h-5" />,
          },
          {
            value: 'no',
            label: "No, I'm debt-free",
            icon: <PartyPopper className="w-5 h-5" />,
          },
        ]}
        columns={2}
      />

      {/* ================================================================
         Debt-Free Congratulations
         ================================================================ */}
      {hasLoans === 'no' && (
        <div className="rounded-xl border border-positive-100 bg-positive-50 p-5 flex items-start gap-3 animate-fade-up">
          <div className="w-10 h-10 rounded-xl bg-positive-100 flex items-center justify-center text-positive shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-positive">Congratulations!</p>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Being debt-free is a strong financial position. This gives you maximum
              flexibility to invest and build wealth for your goals.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
         Loan Details (shown when "Yes")
         ================================================================ */}
      {hasLoans === 'yes' && (
        <div className="space-y-3 animate-fade-up">
          {/* Collapsible loan cards */}
          {LOAN_CONFIGS.map((config) => (
            <LoanCard
              key={config.key}
              config={config}
              loanData={data[config.key]}
              expanded={expandedLoan === config.key}
              onToggle={() =>
                setExpandedLoan((prev) => (prev === config.key ? null : config.key))
              }
              onLoanUpdate={(updates) => updateLoan(config.key, updates)}
            />
          ))}

          {/* Standalone fields */}
          <div className="pt-2 space-y-4">
            <CurrencyInput
              label="Credit Card Outstanding"
              value={data.creditCardDebt}
              onChange={(v) => onUpdate({ creditCardDebt: v })}
              min={0}
              helpText="Total revolving credit card balance. Pay this off first!"
            />
            <CurrencyInput
              label="Other Loans"
              value={data.otherLoans}
              onChange={(v) => onUpdate({ otherLoans: v })}
              min={0}
            />
          </div>

          {/* ==============================================================
             Debt Summary
             ============================================================== */}
          {summary.totalOutstanding > 0 && (
            <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-4">
              <h4 className="text-sm font-bold text-primary">Debt Summary</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 border border-surface-300">
                  <p className="text-[11px] text-slate-500 font-medium">Total Outstanding</p>
                  <p className="text-lg font-bold text-negative tabular-nums">
                    {formatIndian(summary.totalOutstanding)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 border border-surface-300">
                  <p className="text-[11px] text-slate-500 font-medium">Total Monthly EMIs</p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {formatIndian(summary.totalEMI)}
                  </p>
                </div>
              </div>

              {/* Severity indicator */}
              <div className="flex items-center gap-2">
                {summary.severity === 'manageable' && (
                  <>
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Manageable Debt
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      — Your debt levels appear reasonable
                    </span>
                  </>
                )}
                {summary.severity === 'moderate' && (
                  <>
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">
                      Moderate Debt
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      — A structured repayment plan will help
                    </span>
                  </>
                )}
                {summary.severity === 'heavy' && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">
                      Heavy Debt
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      — Debt reduction should be a top priority
                    </span>
                  </>
                )}
              </div>

              {/* Credit card warning */}
              {data.creditCardDebt > 0 && (
                <div className="rounded-lg bg-negative-50 border border-negative-100 p-3 flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-negative shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    <strong>Tip:</strong> Credit card debt usually carries 30-42% interest.
                    Prioritize clearing this before investing.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
