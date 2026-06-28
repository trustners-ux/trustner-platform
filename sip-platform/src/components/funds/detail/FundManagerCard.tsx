/**
 * FundManagerCard — fund-manager attribution.
 *
 * pd_fund_research_stats doesn't yet store a fund_manager column.
 * We render the AMC + a placeholder avatar with a "Managed by AMC team" line
 * until the fund-manager feed is wired up.
 */

import { UserCircle2 } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
  managerName?: string | null;
  managingSince?: string | null;
}

export function FundManagerCard({ fund, managerName, managingSince }: Props) {
  const displayName = managerName ?? 'Fund management team';

  return (
    <section className="py-8 bg-surface-100">
      <div className="container-custom">
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">
          Fund Manager
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 border border-brand-200/60 flex items-center justify-center text-brand-700 flex-shrink-0">
            <UserCircle2 className="w-10 h-10" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-slate-900">{displayName}</div>
            {fund.amc_name && (
              <div className="text-sm text-slate-600 mt-0.5">{fund.amc_name}</div>
            )}
            {managingSince && (
              <div className="text-xs text-slate-500 mt-1">
                Managing since {managingSince}
              </div>
            )}
            {!managerName && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Manager-level attribution is being added shortly. In the meantime, this scheme is
                run by the {fund.amc_name ?? 'AMC'} investment team under their stated investment
                process and benchmark.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
