'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, TrendingUp, TrendingDown, CheckCircle2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const marketPhases = [
  { phase: '2003-2008\n(Bull Run)', sipReturn: 28.5, lumpsumReturn: 35.2, label: 'Bull Market' },
  { phase: '2008-2009\n(Global Crisis)', sipReturn: -8.2, lumpsumReturn: -52.0, label: 'Bear Market' },
  { phase: '2009-2014\n(Recovery)', sipReturn: 18.4, lumpsumReturn: 22.1, label: 'Recovery' },
  { phase: '2015-2016\n(Consolidation)', sipReturn: 5.8, lumpsumReturn: 2.1, label: 'Consolidation' },
  { phase: '2017-2019\n(Mixed)', sipReturn: 9.2, lumpsumReturn: 7.5, label: 'Mixed' },
  { phase: '2020\n(COVID Crash)', sipReturn: -3.5, lumpsumReturn: -23.0, label: 'Crash' },
  { phase: '2020-2021\n(Recovery)', sipReturn: 25.6, lumpsumReturn: 68.0, label: 'V-Recovery' },
];

export default function BullVsBearPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">SIP in Bull vs Bear Markets</h1>
          <p className="text-slate-300 max-w-2xl">How SIP behaves differently across market cycles and why crashes are actually beneficial for long-term SIP investors.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          {/* Key Insight */}
          <div className="bg-positive-50 border border-positive-100 rounded-xl p-6 mb-10 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-positive shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-primary-700 mb-1">Bear Markets Are SIP&apos;s Best Friend</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                SIPs started during or just before bear markets have historically delivered 20-30% better long-term returns
                than those started during bull markets. This is because Rupee Cost Averaging accumulates more units at lower prices during crashes.
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-1">SIP vs Lump Sum Returns Across Market Phases</h2>
            <p className="text-xs text-slate-500 mb-6">Approximate annualized returns during each market phase (Nifty 50 based)</p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketPhases} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="sipReturn" name="SIP Return" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lumpsumReturn" name="Lump Sum Return" fill="#D4A017" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="card-base p-6 border-l-4 border-l-positive">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-positive" />
                <h3 className="font-bold text-primary-700">Bull Market Behavior</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-positive rounded-full mt-2 shrink-0" />Lump sum tends to outperform SIP in sustained bull runs</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-positive rounded-full mt-2 shrink-0" />SIP buys fewer units at higher prices, diluting average returns</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-positive rounded-full mt-2 shrink-0" />SIP still delivers solid returns — just not as high as lump sum</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-positive rounded-full mt-2 shrink-0" />SIP protects against the risk of investing at the absolute peak</li>
              </ul>
            </div>
            <div className="card-base p-6 border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-primary-700">Bear Market Behavior</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-red-500 rounded-full mt-2 shrink-0" />SIP significantly outperforms lump sum in bear markets</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-red-500 rounded-full mt-2 shrink-0" />More units accumulated at lower prices = better recovery returns</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-red-500 rounded-full mt-2 shrink-0" />SIP loss is much smaller (e.g., -8% vs -52% lump sum in 2008)</li>
                <li className="flex items-start gap-2"><span className="w-1 h-1 bg-red-500 rounded-full mt-2 shrink-0" />Continuing SIP during crashes is the single best action</li>
              </ul>
            </div>
          </div>

          {/* Takeaways */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4">Key Takeaways</h2>
            <div className="space-y-3">
              {[
                'SIP protects against downside risk — your losses in bear markets are much smaller than lump sum',
                'In bull markets, SIP may underperform lump sum, but it still delivers strong positive returns',
                'Over a full market cycle (bull + bear), SIP and lump sum returns tend to converge',
                'The real power of SIP emerges over 10+ year periods spanning multiple cycles',
                'Never stop SIP during bear markets — those are the months that generate highest future returns',
                'For most investors, SIP is the safer and more practical choice regardless of market direction',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Note:</strong> Returns shown are approximate and based on historical Nifty 50 data.
              Actual returns depend on specific funds, market conditions, and investment timing. This analysis is for educational purposes only.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
