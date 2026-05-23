'use client';

import { useMemo } from 'react';
import { Briefcase, Wallet, Receipt } from 'lucide-react';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import SelectInput from '@/components/financial-planning/inputs/SelectInput';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CareerIncomeData {
  // Career
  employmentType: string;
  industry: string;
  yearsInCurrentJob: number;
  incomeStability: string;
  expectedRetirementAge: number;
  spouseWorks: boolean;
  expectedAnnualGrowth: number;
  // Income
  monthlyInHandSalary: number;
  annualBonus: number;
  rentalIncome: number;
  businessIncome: number;
  otherIncome: number;
  // Expenses
  monthlyHouseholdExpenses: number;
  monthlyEMIs: number;
  monthlyRent: number;
  monthlySIPsRunning: number;
  monthlyInsurancePremiums: number;
  annualDiscretionary: number;
}

interface Props {
  data: CareerIncomeData;
  onUpdate: (updates: Partial<CareerIncomeData>) => void;
  maritalStatus: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: 'Salaried', description: 'Fixed monthly salary' },
  { value: 'self-employed', label: 'Self-Employed', description: 'Freelance / consulting' },
  { value: 'business', label: 'Business Owner', description: 'Own business or firm' },
  { value: 'retired', label: 'Retired', description: 'Pension / investment income' },
  { value: 'homemaker', label: 'Homemaker', description: 'Not employed currently' },
];

const INDUSTRY_OPTIONS = [
  { value: 'it-software', label: 'IT / Software' },
  { value: 'banking-finance', label: 'Banking / Finance' },
  { value: 'government-psu', label: 'Government / PSU' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'retail', label: 'Retail' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'legal', label: 'Legal' },
  { value: 'others', label: 'Others' },
];

const STABILITY_OPTIONS = [
  {
    value: 'very-stable',
    label: 'Very Stable',
    description: 'Govt / PSU / Large MNC with high job security',
  },
  {
    value: 'stable',
    label: 'Stable',
    description: 'Large private company with predictable income',
  },
  {
    value: 'variable',
    label: 'Variable',
    description: 'Startup / freelance with some uncertainty',
  },
  {
    value: 'highly-variable',
    label: 'Highly Variable',
    description: 'Commission-based or project-based income',
  },
];

const SPOUSE_WORKS_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

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

export default function CareerIncomeStep({
  data,
  onUpdate,
  maritalStatus,
}: Props) {
  const isSalaried = data.employmentType === 'salaried';
  const isSelfEmployedOrBusiness =
    data.employmentType === 'self-employed' || data.employmentType === 'business';
  const isRetiredOrHomemaker =
    data.employmentType === 'retired' || data.employmentType === 'homemaker';
  const isMarried = maritalStatus === 'married';

  // ---------- Savings Summary ----------
  const summary = useMemo(() => {
    // Always sum every income source the user has actually filled — this lets
    // retired / homemaker users (who may have rental + other income but no salary)
    // see a non-zero income summary, and prevents accidental double-counting if
    // someone enters a salary then later flips employment type.
    const monthlyIncome =
      (isSalaried ? data.monthlyInHandSalary : 0) +
      (isSelfEmployedOrBusiness ? data.businessIncome : 0) +
      (isRetiredOrHomemaker
        ? // Retired / homemaker: count business income too (e.g. retired professionals
          // who do consulting on the side) plus rental + other
          data.businessIncome
        : 0) +
      data.rentalIncome +
      data.otherIncome +
      data.annualBonus / 12;

    const monthlyOutflow =
      data.monthlyHouseholdExpenses +
      data.monthlyEMIs +
      data.monthlyRent +
      data.monthlySIPsRunning +
      data.monthlyInsurancePremiums +
      data.annualDiscretionary / 12;

    const surplus = monthlyIncome - monthlyOutflow;
    const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

    return { monthlyIncome, monthlyOutflow, surplus, savingsRate };
  }, [
    data.monthlyInHandSalary,
    data.annualBonus,
    data.rentalIncome,
    data.businessIncome,
    data.otherIncome,
    data.monthlyHouseholdExpenses,
    data.monthlyEMIs,
    data.monthlyRent,
    data.monthlySIPsRunning,
    data.monthlyInsurancePremiums,
    data.annualDiscretionary,
    isSalaried,
    isSelfEmployedOrBusiness,
    isRetiredOrHomemaker,
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
      {/* A. Career & Stability                                        */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<Briefcase className="w-4 h-4 text-brand-600" />}
        title="Career & Stability"
      />

      {/* 1. Employment Type */}
      <RadioCards
        label="Employment Type"
        value={data.employmentType}
        onChange={(val) => onUpdate({ employmentType: val })}
        options={EMPLOYMENT_OPTIONS}
        columns={3}
      />

      {/* 2. Industry */}
      <SelectInput
        label="Industry"
        value={data.industry}
        onChange={(val) => onUpdate({ industry: val })}
        options={INDUSTRY_OPTIONS}
        placeholder="Select your industry"
      />

      {/* 3. Years of Experience */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
          Years of Experience
        </label>
        <input
          type="number"
          value={data.yearsInCurrentJob || ''}
          onChange={(e) =>
            onUpdate({
              yearsInCurrentJob: Math.min(50, Math.max(0, Number(e.target.value))),
            })
          }
          min={0}
          max={50}
          placeholder="e.g. 8"
          className={INPUT_CLASS}
        />
      </div>

      {/* 4. Income Stability */}
      <RadioCards
        label="Income Stability"
        value={data.incomeStability}
        onChange={(val) => onUpdate({ incomeStability: val })}
        options={STABILITY_OPTIONS}
        columns={2}
      />

      {/* 5. Expected Retirement Age */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
          Expected Retirement Age
        </label>
        <input
          type="number"
          value={data.expectedRetirementAge || ''}
          onChange={(e) =>
            onUpdate({
              expectedRetirementAge: Math.min(75, Math.max(45, Number(e.target.value))),
            })
          }
          min={45}
          max={75}
          placeholder="60"
          className={INPUT_CLASS}
        />
        <p className="text-xs text-slate-400 mt-1">
          Between 45 and 75 years. Default is 60.
        </p>
      </div>

      {/* 6. Does Spouse Work? — only if married */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isMarried ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isMarried && (
          <RadioCards
            label="Does Your Spouse Work?"
            value={data.spouseWorks ? 'yes' : 'no'}
            onChange={(val) => onUpdate({ spouseWorks: val === 'yes' })}
            options={SPOUSE_WORKS_OPTIONS}
            columns={2}
          />
        )}
      </div>

      {/* 7. Expected Annual Income Growth */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
          Expected Annual Income Growth (%)
        </label>
        <input
          type="number"
          value={data.expectedAnnualGrowth || ''}
          onChange={(e) =>
            onUpdate({
              expectedAnnualGrowth: Math.min(25, Math.max(0, Number(e.target.value))),
            })
          }
          min={0}
          max={25}
          step={0.5}
          placeholder="8"
          className={INPUT_CLASS}
        />
        <p className="text-xs text-slate-400 mt-1">
          Typical range: 5-12% for salaried professionals.
        </p>
      </div>

      {/* ============================================================ */}
      {/* B. Monthly Income                                             */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<Wallet className="w-4 h-4 text-brand-600" />}
        title="Monthly Income"
      />

      {/* 8. Monthly In-Hand Salary — only if salaried */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isSalaried ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isSalaried && (
          <CurrencyInput
            label="Monthly In-Hand Salary"
            value={data.monthlyInHandSalary}
            onChange={(val) => onUpdate({ monthlyInHandSalary: val })}
          />
        )}
      </div>

      {/* 9. Annual Bonus / Variable Pay */}
      <CurrencyInput
        label="Annual Bonus / Variable Pay"
        value={data.annualBonus}
        onChange={(val) => onUpdate({ annualBonus: val })}
        helpText="Include all bonuses, commissions, and variable pay per year"
      />

      {/* 10. Monthly Business / Consulting Income — for self-employed, business, or retired */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isSelfEmployedOrBusiness || data.employmentType === 'retired'
            ? 'max-h-[200px] opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        {(isSelfEmployedOrBusiness || data.employmentType === 'retired') && (
          <CurrencyInput
            label={
              data.employmentType === 'retired'
                ? 'Monthly Pension / Consulting Income'
                : 'Monthly Business Income'
            }
            value={data.businessIncome}
            onChange={(val) => onUpdate({ businessIncome: val })}
            helpText={
              data.employmentType === 'retired'
                ? 'Pension, annuity payouts, or any active consulting / advisory income'
                : 'Average monthly take-home from your business'
            }
          />
        )}
      </div>

      {/* 11. Rental Income */}
      <CurrencyInput
        label="Monthly Rental Income"
        value={data.rentalIncome}
        onChange={(val) => onUpdate({ rentalIncome: val })}
        helpText="Leave as 0 if not applicable"
      />

      {/* 12. Other Income */}
      <CurrencyInput
        label="Other Monthly Income"
        value={data.otherIncome}
        onChange={(val) => onUpdate({ otherIncome: val })}
        helpText="Dividends, interest, freelance side income, etc."
      />

      {/* ============================================================ */}
      {/* C. Monthly Expenses                                           */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<Receipt className="w-4 h-4 text-brand-600" />}
        title="Monthly Expenses"
      />

      {/* 13. Household Expenses */}
      <CurrencyInput
        label="Monthly Household Expenses"
        value={data.monthlyHouseholdExpenses}
        onChange={(val) => onUpdate({ monthlyHouseholdExpenses: val })}
        helpText="Include groceries, utilities, transport, school fees, etc."
      />

      {/* 14. Monthly EMIs */}
      <CurrencyInput
        label="Monthly EMIs"
        value={data.monthlyEMIs}
        onChange={(val) => onUpdate({ monthlyEMIs: val })}
        helpText="Total of all loan EMIs (home, car, personal, education)"
      />

      {/* 15. Monthly Rent — only if residential status is rent */}
      <CurrencyInput
        label="Monthly Rent"
        value={data.monthlyRent}
        onChange={(val) => onUpdate({ monthlyRent: val })}
        helpText="Leave as 0 if you own your home or live with family"
      />

      {/* 16. Monthly SIPs */}
      <CurrencyInput
        label="Monthly SIPs Running"
        value={data.monthlySIPsRunning}
        onChange={(val) => onUpdate({ monthlySIPsRunning: val })}
        helpText="Total of all running SIP investments"
      />

      {/* 17. Insurance Premiums */}
      <CurrencyInput
        label="Monthly Insurance Premiums"
        value={data.monthlyInsurancePremiums}
        onChange={(val) => onUpdate({ monthlyInsurancePremiums: val })}
        helpText="Monthly life + health insurance premiums"
      />

      {/* 18. Annual Discretionary Spending */}
      <CurrencyInput
        label="Annual Discretionary Spending"
        value={data.annualDiscretionary}
        onChange={(val) => onUpdate({ annualDiscretionary: val })}
        helpText="Vacations, gadgets, dining out, shopping per year"
      />

      {/* ============================================================ */}
      {/* Savings Summary Card                                          */}
      {/* ============================================================ */}
      {summary.monthlyIncome > 0 && (
        <div className="mt-6 p-5 rounded-xl bg-surface-100 border border-surface-300 shadow-card">
          <h4 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Savings Summary
          </h4>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            {/* Total Monthly Income */}
            <div className="text-slate-500">Total Monthly Income</div>
            <div className="text-right font-semibold text-primary-700">
              {formatCurrency(Math.round(summary.monthlyIncome))}
            </div>

            {/* Total Monthly Outflow */}
            <div className="text-slate-500">Total Monthly Outflow</div>
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
                Your expenses exceed your income. This needs immediate attention — we will prioritize this in your plan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
