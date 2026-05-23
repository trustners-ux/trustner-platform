'use client';

import Link from 'next/link';
import { ArrowLeft, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const rollingData = [
  { range: '<0%', threeYear: 15, fiveYear: 8, sevenYear: 3, tenYear: 0 },
  { range: '0-5%', threeYear: 10, fiveYear: 7, sevenYear: 5, tenYear: 2 },
  { range: '5-10%', threeYear: 20, fiveYear: 18, sevenYear: 15, tenYear: 12 },
  { range: '10-15%', threeYear: 25, fiveYear: 30, sevenYear: 35, tenYear: 42 },
  { range: '15-20%', threeYear: 18, fiveYear: 22, sevenYear: 28, tenYear: 30 },
  { range: '20%+', threeYear: 12, fiveYear: 15, sevenYear: 14, tenYear: 14 },
];

export default function RollingReturnsPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">Rolling Returns Study</h1>
          <p className="text-slate-300 max-w-2xl">The most accurate way to evaluate SIP performance — eliminating start/end date bias.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          {/* What are Rolling Returns */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-3">What Are Rolling Returns?</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Rolling returns calculate the annualized return for every possible period of a given duration.
              For example, 5-year rolling returns of a fund started in 2005 would calculate the return for every possible 5-year period:
              Jan 2005 to Jan 2010, Feb 2005 to Feb 2010, Mar 2005 to Mar 2010... and so on for every month.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This eliminates the bias of cherry-picking good or bad start/end dates and gives a distribution of all possible outcomes.
              If 95% of all 10-year rolling SIP returns are positive, it means the probability of making money in any 10-year SIP is 95%.
            </p>
          </div>

          {/* Chart */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-1">Distribution of Rolling SIP Returns (Nifty 50)</h2>
            <p className="text-xs text-slate-500 mb-6">Percentage of rolling periods falling in each return range</p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rollingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="threeYear" name="3-Year Rolling" fill="#DC2626" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="fiveYear" name="5-Year Rolling" fill="#D4A017" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sevenYear" name="7-Year Rolling" fill="#0F766E" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tenYear" name="10-Year Rolling" fill="#E8553A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[
              { period: '3 Years', positive: '85%', avg: '12.5%', min: '-8%' },
              { period: '5 Years', positive: '92%', avg: '13.2%', min: '-2%' },
              { period: '7 Years', positive: '97%', avg: '14.1%', min: '2%' },
              { period: '10 Years', positive: '100%', avg: '14.8%', min: '7%' },
            ].map((s) => (
              <div key={s.period} className="card-base p-5 text-center">
                <div className="text-xs text-slate-500 mb-2">{s.period} Rolling</div>
                <div className="text-2xl font-bold text-positive mb-1">{s.positive}</div>
                <div className="text-xs text-slate-400">Positive returns</div>
                <div className="mt-3 pt-3 border-t border-surface-200">
                  <div className="text-xs text-slate-500">Avg: <span className="font-semibold text-brand">{s.avg}</span></div>
                  <div className="text-xs text-slate-500">Min: <span className="font-semibold text-primary-700">{s.min}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Takeaways */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-positive" /> Key Conclusions
            </h2>
            <div className="space-y-3">
              {[
                'As the investment horizon increases, the probability of positive SIP returns approaches 100%',
                '10-year rolling SIPs in Nifty 50 have NEVER delivered negative returns',
                'The minimum 10-year rolling SIP return is around 7% — still beating FD returns',
                'Most 10-year rolling SIP returns fall in the 10-15% range — excellent wealth creation territory',
                '3-year SIPs have about 15% probability of negative returns — short-term equity SIP is risky',
                'Rolling returns prove that time in market is the single most important factor for SIP success',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Note:</strong> Rolling return data is illustrative and based on approximate historical Nifty 50 performance.
              Actual rolling returns vary by fund and market conditions. This analysis is for educational purposes.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
