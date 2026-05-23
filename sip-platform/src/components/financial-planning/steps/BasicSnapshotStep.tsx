'use client';

import { PiggyBank, ShieldCheck } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BasicSnapshotData {
  mutualFunds: number;
  fixedDeposits: number;
  ppfEpf: number;
  termInsuranceCover: number;
  healthInsuranceCover: number;
  hasEmergencyFund: boolean;
  emergencyFundAmount: number;
}

interface Props {
  data: BasicSnapshotData;
  onUpdate: (updates: Partial<BasicSnapshotData>) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMERGENCY_FUND_OPTIONS = [
  { value: 'yes', label: 'Yes', description: 'I have an emergency fund set aside' },
  { value: 'no', label: 'No', description: 'I don\u2019t have one yet' },
];

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

export default function BasicSnapshotStep({ data, onUpdate }: Props) {
  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* A. Savings & Investments                                      */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<PiggyBank className="w-4 h-4 text-brand-600" />}
        title="Your Savings & Investments"
      />

      <p className="text-xs text-slate-400 -mt-2">
        Enter the current total value of each. Leave as 0 if not applicable.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Mutual Funds */}
        <CurrencyInput
          label="Mutual Funds"
          value={data.mutualFunds}
          onChange={(val) => onUpdate({ mutualFunds: val })}
          helpText="Total value of all your mutual fund investments"
        />

        {/* Fixed Deposits */}
        <CurrencyInput
          label="Fixed Deposits"
          value={data.fixedDeposits}
          onChange={(val) => onUpdate({ fixedDeposits: val })}
          helpText="Bank FDs, corporate FDs, post office deposits"
        />

        {/* PPF + EPF */}
        <CurrencyInput
          label="PPF + EPF"
          value={data.ppfEpf}
          onChange={(val) => onUpdate({ ppfEpf: val })}
          helpText="Combined balance of your PPF and EPF accounts"
        />
      </div>

      {/* ============================================================ */}
      {/* B. Protection                                                 */}
      {/* ============================================================ */}
      <SectionHeader
        icon={<ShieldCheck className="w-4 h-4 text-brand-600" />}
        title="Your Protection"
      />

      <p className="text-xs text-slate-400 -mt-2">
        Insurance cover amounts — how much your policy covers, not the premium you pay.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Term Insurance Cover */}
        <CurrencyInput
          label="Term Insurance Cover"
          value={data.termInsuranceCover}
          onChange={(val) => onUpdate({ termInsuranceCover: val })}
          helpText="Total life cover from all term insurance policies"
        />

        {/* Health Insurance Cover */}
        <CurrencyInput
          label="Health Insurance Cover"
          value={data.healthInsuranceCover}
          onChange={(val) => onUpdate({ healthInsuranceCover: val })}
          helpText="Sum insured of your health insurance (family floater or individual)"
        />
      </div>

      {/* Emergency Fund */}
      <div className="mt-2">
        <RadioCards
          label="Do you have an Emergency Fund?"
          value={data.hasEmergencyFund ? 'yes' : 'no'}
          onChange={(val) => {
            const has = val === 'yes';
            onUpdate({
              hasEmergencyFund: has,
              emergencyFundAmount: has ? data.emergencyFundAmount : 0,
            });
          }}
          options={EMERGENCY_FUND_OPTIONS}
          columns={2}
        />
      </div>

      {/* Conditional: Emergency Fund Amount */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          data.hasEmergencyFund
            ? 'max-h-[200px] opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        {data.hasEmergencyFund && (
          <CurrencyInput
            label="Emergency Fund Amount"
            value={data.emergencyFundAmount}
            onChange={(val) => onUpdate({ emergencyFundAmount: val })}
            helpText="Cash or liquid funds kept aside for emergencies (ideally 6 months of expenses)"
          />
        )}
      </div>
    </div>
  );
}
