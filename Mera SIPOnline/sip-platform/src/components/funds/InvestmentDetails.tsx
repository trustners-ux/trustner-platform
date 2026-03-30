'use client';

import { Shield, IndianRupee, CheckCircle2, XCircle, Clock, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { LiveFundDetail } from '@/types/live-fund';

interface InvestmentDetailsProps {
  fund: LiveFundDetail;
}

function formatINR(value: number | null): string {
  if (value === null || value === undefined) return '--';
  return `\u20B9${value.toLocaleString('en-IN')}`;
}

export function InvestmentDetails({ fund }: InvestmentDetailsProps) {
  const enriched = fund.enriched;

  if (!enriched) {
    return (
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-brand" />
            <h2 className="text-display-sm text-primary-700">Investment Details</h2>
          </div>
          <div className="bg-surface-100 rounded-xl border border-surface-300/70 p-8 text-center">
            <p className="text-sm text-slate-400">
              Detailed investment data is unavailable for this fund at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const details = [
    {
      label: 'Min SIP Amount',
      value: formatINR(enriched.sipMin),
      icon: IndianRupee,
    },
    {
      label: 'Min Lumpsum',
      value: formatINR(enriched.lumpMin),
      icon: IndianRupee,
    },
    {
      label: 'SIP Available',
      value: enriched.sipAvailable ? 'Yes' : 'No',
      icon: enriched.sipAvailable ? CheckCircle2 : XCircle,
      valueClass: enriched.sipAvailable ? 'text-positive' : 'text-red-500',
    },
    {
      label: 'Lock-in Period',
      value: enriched.lockInPeriod
        ? `${enriched.lockInPeriod} ${enriched.lockInPeriod === 1 ? 'Year' : 'Years'}`
        : 'None',
      icon: Clock,
    },
    {
      label: 'Exit Load',
      value: enriched.lockInPeriod && enriched.lockInPeriod > 0
        ? 'Subject to lock-in'
        : 'As per scheme document',
      icon: DoorOpen,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-brand" />
          <h2 className="text-display-sm text-primary-700">Investment Details</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {details.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.label}
                className="bg-surface-100 rounded-xl border border-surface-300/70 p-4 shadow-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-brand" />
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                    {d.label}
                  </span>
                </div>
                <div className={cn('text-base font-bold text-primary-700', d.valueClass)}>
                  {d.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Investment objective if available */}
        {enriched.investmentObjective && (
          <div className="mt-6 bg-surface-100 rounded-xl border border-surface-300/70 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Investment Objective
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {enriched.investmentObjective}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
