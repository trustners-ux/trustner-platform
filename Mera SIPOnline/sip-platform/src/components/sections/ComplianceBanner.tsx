'use client';

import { Shield, ExternalLink } from 'lucide-react';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export function ComplianceBanner() {
  return (
    <section className="bg-primary-700 text-white py-6">
      <div className="container-custom">
        {/* SEBI / AMFI Regulatory Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold">{COMPANY.mfEntity.type}</div>
              <div className="text-xs text-slate-400">{COMPANY.mfEntity.amfiArn} | CIN: {COMPANY.mfEntity.cin}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
              AMFI India <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
              SEBI <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
              SCORES <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Key Compliance Messages */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Mutual Funds:</strong> {DISCLAIMER.mutual_fund}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">KYC:</strong> {DISCLAIMER.kyc}
            </p>
          </div>
        </div>

        <div className="mt-3 bg-white/5 rounded-lg p-3">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            <strong className="text-slate-300">Investor Grievance:</strong> {DISCLAIMER.grievance}
            {' | '}<strong className="text-slate-300">Investor Notice:</strong> {DISCLAIMER.sebi_investor}
          </p>
        </div>
      </div>
    </section>
  );
}
