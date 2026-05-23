'use client';

import { useMemo } from 'react';
import { Shield, Heart, Activity } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import type { InsuranceProfile } from '@/types/financial-planning';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  data: InsuranceProfile;
  onUpdate: (updates: Partial<InsuranceProfile>) => void;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InsuranceStep({ data, onUpdate }: Props) {
  // ----- Computed summary -----
  const summary = useMemo(() => {
    const totalLifeCover = (data.termInsuranceCover || 0) + (data.lifeInsuranceCover || 0);
    const healthCover = data.healthInsuranceCover || 0;
    const totalAnnualPremium = (data.annualLifePremium || 0) + (data.annualHealthPremium || 0);

    return { totalLifeCover, healthCover, totalAnnualPremium };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* ================================================================
         A. Life Insurance
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Shield className="w-3.5 h-3.5" />
          </span>
          Life Insurance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Term Insurance Cover"
            value={data.termInsuranceCover}
            onChange={(v) => onUpdate({ termInsuranceCover: v })}
            min={0}
            step={100000}
            helpText="Pure life cover — no maturity benefit"
          />
          <CurrencyInput
            label="Life Insurance Cover (Endowment / ULIP)"
            value={data.lifeInsuranceCover}
            onChange={(v) => onUpdate({ lifeInsuranceCover: v })}
            min={0}
            step={100000}
            helpText="Endowment, ULIP, money-back policies"
          />
        </div>
      </section>

      {/* ================================================================
         B. Health & Protection
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Heart className="w-3.5 h-3.5" />
          </span>
          Health &amp; Protection
        </h3>

        <div className="space-y-4">
          <CurrencyInput
            label="Health Insurance Cover"
            value={data.healthInsuranceCover}
            onChange={(v) => onUpdate({ healthInsuranceCover: v })}
            min={0}
            step={100000}
            helpText="Family floater or individual health plan"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RadioCards
              label="Critical Illness Cover"
              value={data.hasCriticalIllnessCover ? 'yes' : 'no'}
              onChange={(v) => onUpdate({ hasCriticalIllnessCover: v === 'yes' })}
              options={[
                {
                  value: 'yes',
                  label: 'Yes',
                  description: 'Have a critical illness cover',
                },
                {
                  value: 'no',
                  label: 'No',
                  description: 'No cover for critical illness',
                },
              ]}
              columns={2}
            />
            <RadioCards
              label="Accidental Death Cover"
              value={data.hasAccidentalCover ? 'yes' : 'no'}
              onChange={(v) => onUpdate({ hasAccidentalCover: v === 'yes' })}
              options={[
                {
                  value: 'yes',
                  label: 'Yes',
                  description: 'Have an accidental death cover',
                },
                {
                  value: 'no',
                  label: 'No',
                  description: 'No accidental death cover',
                },
              ]}
              columns={2}
            />
          </div>
        </div>
      </section>

      {/* ================================================================
         C. Annual Premiums
         ================================================================ */}
      <section>
        <h3 className="text-[13px] font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center text-brand">
            <Activity className="w-3.5 h-3.5" />
          </span>
          Annual Premiums
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Annual Life Insurance Premium"
            value={data.annualLifePremium}
            onChange={(v) => onUpdate({ annualLifePremium: v })}
            min={0}
            step={1000}
            helpText="Total premium for all life policies per year"
          />
          <CurrencyInput
            label="Annual Health Insurance Premium"
            value={data.annualHealthPremium}
            onChange={(v) => onUpdate({ annualHealthPremium: v })}
            min={0}
            step={1000}
            helpText="Total premium for health policies per year"
          />
        </div>
      </section>

      {/* ================================================================
         Insurance Summary
         ================================================================ */}
      {(summary.totalLifeCover > 0 || summary.healthCover > 0 || summary.totalAnnualPremium > 0) && (
        <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 space-y-4">
          <h4 className="text-sm font-bold text-primary">Insurance Summary</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-white p-3 border border-surface-300">
              <p className="text-[11px] text-slate-500 font-medium">Total Life Cover</p>
              <p className="text-lg font-bold text-brand tabular-nums">
                {formatIndian(summary.totalLifeCover)}
              </p>
              {summary.totalLifeCover > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Term: {formatIndian(data.termInsuranceCover || 0)} + Traditional: {formatIndian(data.lifeInsuranceCover || 0)}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-white p-3 border border-surface-300">
              <p className="text-[11px] text-slate-500 font-medium">Health Cover</p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">
                {formatIndian(summary.healthCover)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-surface-300">
              <p className="text-[11px] text-slate-500 font-medium">Total Annual Premium</p>
              <p className="text-lg font-bold text-primary tabular-nums">
                {formatIndian(summary.totalAnnualPremium)}
              </p>
              {summary.totalAnnualPremium > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Life: {formatIndian(data.annualLifePremium || 0)} + Health: {formatIndian(data.annualHealthPremium || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Additional covers status */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  data.hasCriticalIllnessCover ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600">
                Critical Illness
              </span>
              <span className="text-[10px] text-slate-400">
                {data.hasCriticalIllnessCover ? 'Covered' : 'Not covered'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  data.hasAccidentalCover ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600">
                Accidental Death
              </span>
              <span className="text-[10px] text-slate-400">
                {data.hasAccidentalCover ? 'Covered' : 'Not covered'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {summary.totalLifeCover === 0 && summary.healthCover === 0 && summary.totalAnnualPremium === 0 && (
        <div className="rounded-xl border border-surface-300 bg-surface-100 p-5">
          <p className="text-xs text-slate-400 italic">
            Enter your insurance details above to see a summary of your protection coverage.
          </p>
        </div>
      )}
    </div>
  );
}
