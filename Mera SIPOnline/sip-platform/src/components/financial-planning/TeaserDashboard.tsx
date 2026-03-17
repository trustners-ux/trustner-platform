'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Shield, Wallet, PiggyBank, CreditCard, Clock, ArrowRight, Phone } from 'lucide-react';
import Link from 'next/link';
import ScoreGauge from './ScoreGauge';
import type { TeaserData } from '@/types/financial-planning';

interface TeaserDashboardProps {
  data: TeaserData;
  userName: string;
  userEmail: string;
}

const PILLAR_CONFIG = [
  { key: 'cashflow' as const, label: 'Cashflow Health', icon: Wallet, color: '#0F766E' },
  { key: 'protection' as const, label: 'Protection', icon: Shield, color: '#7C3AED' },
  { key: 'investments' as const, label: 'Investments', icon: PiggyBank, color: '#2563EB' },
  { key: 'debt' as const, label: 'Debt Management', icon: CreditCard, color: '#EA580C' },
  { key: 'retirementReadiness' as const, label: 'Retirement', icon: Clock, color: '#D97706' },
];

function formatAmount(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function TeaserDashboard({ data, userName, userEmail }: TeaserDashboardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const firstName = userName.split(' ')[0] || 'there';

  return (
    <div className={`max-w-3xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-2">
          {firstName}, here&apos;s your Financial Health Score
        </h1>
        <p className="text-slate-500 text-sm">
          Based on your responses, we&apos;ve assessed your financial wellness across 5 key areas
        </p>
      </div>

      {/* Score Gauge */}
      <div className="flex justify-center mb-8">
        <ScoreGauge score={data.score.totalScore} grade={data.score.grade} size="lg" animate={true} />
      </div>

      {/* 5 Pillar Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {PILLAR_CONFIG.map((pillar) => {
          const pillarData = data.score.pillars[pillar.key];
          const percent = Math.round((pillarData.score / 180) * 100);
          return (
            <div key={pillar.key} className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
              <pillar.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: pillar.color }} />
              <div className="text-[11px] text-slate-500 mb-1">{pillar.label}</div>
              <div className="text-lg font-extrabold" style={{ color: pillar.color }}>
                {pillarData.score}
                <span className="text-[10px] text-slate-400 font-normal">/180</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percent}%`, backgroundColor: pillar.color }}
                />
              </div>
              <div className="text-[10px] mt-1 font-medium" style={{ color: pillar.color }}>
                {pillarData.grade}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-primary mb-3">Key Insights</h3>
        <div className="space-y-2.5">
          {data.quickInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                i < data.topStrengths.length ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {i < data.topStrengths.length ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
              </div>
              <p className="text-sm text-slate-600">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Net Worth Quick Stat */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-gradient-to-br from-brand-50 to-teal-50 rounded-xl p-4 border border-brand-100">
          <div className="text-[10px] text-brand-600 font-medium uppercase tracking-wider">Net Worth</div>
          <div className="text-xl font-extrabold text-brand-800 mt-1">{formatAmount(data.netWorth)}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="text-[10px] text-amber-700 font-medium uppercase tracking-wider">Retirement Ready</div>
          <div className="text-xl font-extrabold text-amber-800 mt-1">{data.retirementGapPercent}%</div>
          <div className="text-[10px] text-amber-600">of required corpus</div>
        </div>
      </div>

      {/* Report Coming Banner */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-xl p-6 text-white mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold mb-1">Your Detailed Report is Being Reviewed!</h3>
            <p className="text-sm text-teal-100 mb-3">
              Your comprehensive 10-page Financial Health Report with AI-powered personalized
              recommendations is being reviewed by our expert team. It will be delivered to <strong className="text-white">{userEmail}</strong> shortly — our advisors personally review every report to ensure accuracy.
            </p>
            <div className="text-xs text-teal-200">
              Includes: Net Worth Analysis • Retirement Gap • Insurance Check • Goal Planning • Action Plan
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl border-2 border-brand-200 p-5 text-center">
        <h3 className="text-base font-bold text-primary mb-2">Want to Discuss Your Financial Plan?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Our expert advisors can help you implement the recommendations from your report
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="tel:+916003903737"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us: 6003903737
          </a>
          <Link
            href="/calculators"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Explore Calculators
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
        This Financial Wellness Assessment is for educational purposes only. Trustner Asset Services Pvt. Ltd.
        (ARN-286886) is an AMFI Registered Mutual Fund Distributor and does not provide investment advisory
        services under SEBI (Investment Advisers) Regulations, 2013.
      </p>
    </div>
  );
}
