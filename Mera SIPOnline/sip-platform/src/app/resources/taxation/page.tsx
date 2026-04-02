'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  ArrowRight,
  Shield,
  AlertTriangle,
  ChevronRight,
  Scale,
  Receipt,
  IndianRupee,
  Globe,
  Calendar,
  Info,
  Clock,
  Users,
  FileText,
  Landmark,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { DISCLAIMER } from '@/lib/constants/company';

/* ─── Quick Nav Items ─── */
const NAV_ITEMS = [
  { id: 'equity', label: 'Equity Fund Tax', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'debt', label: 'Debt Fund Tax', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'hybrid', label: 'Hybrid Fund Tax', icon: Scale, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'sip-tax', label: 'SIP Taxation', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'dividend', label: 'Dividend Tax', icon: IndianRupee, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'elss', label: 'ELSS / Sec 80C', icon: Shield, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'tds', label: 'TDS Rules', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'harvesting', label: 'Tax-Loss Harvesting', icon: Calculator, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'timeline', label: 'Tax Changes Timeline', icon: Clock, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'due-dates', label: 'Key Due Dates', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export default function TaxationGuidePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-brand-700 text-white">
        <div className="absolute inset-0 bg-hero-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container-custom relative z-10 py-14 sm:py-20 lg:py-28">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-5 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              Investor Resource
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Mutual Fund{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-blue-200 to-accent">
                Taxation Guide
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 max-w-2xl">
              Complete A-to-Z tax guide for Indian mutual fund investors — updated for{' '}
              <span className="font-semibold text-white">FY 2026-27 (AY 2027-28)</span>. Covers
              equity, debt, hybrid funds, SIP taxation, ELSS, NRI rules, and recent budget changes.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#equity"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-white/90 transition"
              >
                Start Reading <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/calculators/capital-gains-tax"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-5 py-2.5 text-sm hover:bg-white/20 transition"
              >
                <Calculator className="w-4 h-4" /> Capital Gains Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUICK NAVIGATION ===== */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="card-base flex flex-col items-center gap-2 p-4 text-center hover:shadow-md transition group"
              >
                <div className={`${item.bg} ${item.color} p-2.5 rounded-xl`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-primary-600 transition">
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              href="/resources/taxation/nri"
              className="card-base flex items-center gap-3 p-4 hover:shadow-md transition group flex-1"
            >
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition">
                  NRI Mutual Fund Taxation Guide
                </p>
                <p className="text-xs text-slate-500">Separate comprehensive guide for NRI investors</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1: EQUITY MF TAXATION ===== */}
      <section id="equity" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">1. Equity Mutual Fund Taxation</h2>
              <p className="text-sm text-slate-500">Funds with 65% or more equity allocation</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Equity mutual funds (including equity-oriented hybrid funds with &ge;65% equity allocation) enjoy
            preferential tax treatment compared to debt funds. The holding period threshold is{' '}
            <strong>12 months</strong> — units held beyond 12 months qualify as long-term capital assets.
          </p>

          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Holding Period</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Tax Rate</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Key Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-emerald-700">LTCG</td>
                  <td className="p-3 text-slate-600">&gt; 12 months</td>
                  <td className="p-3 text-slate-800 font-semibold">12.5%</td>
                  <td className="p-3 text-slate-600">
                    Exempt up to Rs 1.25 lakh per financial year. No indexation benefit. Surcharge
                    and cess applicable above threshold.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-amber-700">STCG</td>
                  <td className="p-3 text-slate-600">&le; 12 months</td>
                  <td className="p-3 text-slate-800 font-semibold">20%</td>
                  <td className="p-3 text-slate-600">
                    Flat rate regardless of income slab. Plus applicable surcharge and 4% health &
                    education cess.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">STT</td>
                  <td className="p-3 text-slate-600">On redemption</td>
                  <td className="p-3 text-slate-800 font-semibold">0.001%</td>
                  <td className="p-3 text-slate-600">
                    Securities Transaction Tax on the sell side. Deducted automatically from
                    redemption proceeds.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Budget 2024 callout */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Budget 2024 Change</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Prior to the Union Budget 2024 (July 2024), equity LTCG was taxed at{' '}
                  <strong>10% above Rs 1 lakh exemption</strong>, and STCG was taxed at{' '}
                  <strong>15%</strong>. The new rates of 12.5% LTCG (with Rs 1.25L exemption) and
                  20% STCG apply to all transfers on or after <strong>23 July 2024</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Practical example */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Example</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  You invested Rs 5,00,000 in an equity fund in January 2024 and redeemed at
                  Rs 7,50,000 in March 2026 (held &gt;12 months). Your gain = Rs 2,50,000. LTCG
                  tax = 12.5% of (2,50,000 - 1,25,000) = 12.5% of Rs 1,25,000 ={' '}
                  <strong>Rs 15,625</strong> (plus cess).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: DEBT MF TAXATION ===== */}
      <section id="debt" className="section-padding bg-slate-50 scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">2. Debt Mutual Fund Taxation</h2>
              <p className="text-sm text-slate-500">Post-April 2023 rules for debt & money market funds</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            The Finance Act 2023 brought a landmark change for debt mutual fund taxation. For units
            purchased <strong>on or after 1 April 2023</strong>, there is no separate LTCG/STCG
            distinction — all gains are taxed at the investor&apos;s income tax slab rate, regardless
            of holding period. The indexation benefit has been removed for these units.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Purchase Date</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Holding Period</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Tax Rate</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Indexation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">On or after 1 Apr 2023</td>
                  <td className="p-3 text-slate-600">Any period</td>
                  <td className="p-3 text-slate-800 font-semibold">Slab rate</td>
                  <td className="p-3 text-red-600 font-medium">Not available</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700" rowSpan={2}>
                    Before 1 Apr 2023 (grandfathered)
                  </td>
                  <td className="p-3 text-slate-600">&le; 24 months</td>
                  <td className="p-3 text-slate-800 font-semibold">Slab rate</td>
                  <td className="p-3 text-red-600 font-medium">Not available</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-600">&gt; 24 months</td>
                  <td className="p-3 text-slate-800 font-semibold">12.5% (w/o indexation)</td>
                  <td className="p-3 text-red-600 font-medium">
                    Not available (removed by Budget 2024)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Important: Applies to Specified Mutual Funds</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  This rule applies to &quot;specified mutual funds&quot; — funds where equity exposure
                  is less than 65% of total assets. This includes debt funds, liquid funds, money
                  market funds, gold fund of funds, international fund of funds, and conservative
                  hybrid funds. <strong>Note:</strong> From FY 2025-26 onwards, Gold ETFs and Silver
                  ETFs listed on stock exchanges are <strong>excluded</strong> from &quot;specified
                  mutual funds&quot; — they now qualify for LTCG at 12.5% after 12 months holding
                  (like equity funds).
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Example</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  You invested Rs 10,00,000 in a debt fund in June 2023. After 2 years, you redeem
                  at Rs 11,60,000 (gain of Rs 1,60,000). Since the purchase was after April 2023,
                  this entire gain is added to your income and taxed at your slab rate. If you are in
                  the 30% bracket, tax = Rs 48,000 (plus cess). No indexation benefit is available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: HYBRID FUND TAXATION ===== */}
      <section id="hybrid" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-violet-100 text-violet-700 p-2.5 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">3. Hybrid Fund Taxation</h2>
              <p className="text-sm text-slate-500">Taxation depends on equity allocation percentage</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Hybrid funds are taxed based on their equity allocation. The critical threshold is{' '}
            <strong>65% equity</strong>. Funds that maintain 65% or more in domestic equities are
            treated as equity funds for tax purposes; those below 65% follow debt fund taxation rules.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Fund Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Equity %</th>
                  <th className="text-left p-3 font-semibold text-slate-700">LTCG Threshold</th>
                  <th className="text-left p-3 font-semibold text-slate-700">LTCG Rate</th>
                  <th className="text-left p-3 font-semibold text-slate-700">STCG Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">Aggressive Hybrid / Equity Savings (&ge;65%)</td>
                  <td className="p-3 text-slate-600">&ge; 65%</td>
                  <td className="p-3 text-slate-600">12 months</td>
                  <td className="p-3 text-slate-800 font-semibold">12.5% (above Rs 1.25L)</td>
                  <td className="p-3 text-slate-800 font-semibold">20%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Conservative Hybrid / Debt-oriented (&lt;65%)</td>
                  <td className="p-3 text-slate-600">&lt; 65%</td>
                  <td className="p-3 text-slate-600">N/A (post Apr 2023)</td>
                  <td className="p-3 text-slate-800 font-semibold">Slab rate</td>
                  <td className="p-3 text-slate-800 font-semibold">Slab rate</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Balanced Advantage / Dynamic Asset Allocation</td>
                  <td className="p-3 text-slate-600">Varies</td>
                  <td className="p-3 text-slate-600">12 months (if &ge;65%)</td>
                  <td className="p-3 text-slate-800 font-semibold" colSpan={2}>
                    Check scheme document — most BAFs maintain &ge;65% equity to qualify as equity-oriented
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 mb-1">Tip for BAF / Dynamic Funds</p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Most Balanced Advantage Funds (BAFs) are structured to maintain at least 65% gross
                  equity exposure (including arbitrage positions and equity derivatives) to qualify
                  for equity taxation. Always check the scheme&apos;s SID (Scheme Information
                  Document) to confirm the fund&apos;s classification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: SIP-SPECIFIC TAXATION ===== */}
      <section id="sip-tax" className="section-padding bg-slate-50 scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">4. SIP-Specific Taxation</h2>
              <p className="text-sm text-slate-500">Each SIP installment is a separate purchase</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            This is one of the most commonly misunderstood aspects of mutual fund taxation. When you
            invest via SIP, <strong>each monthly installment is treated as a separate purchase</strong>.
            On redemption, the FIFO (First In, First Out) method is used — units bought earliest are
            sold first.
          </p>

          <div className="card-base p-5 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Worked Example: SIP Redemption</h3>
            <p className="text-sm text-slate-600 mb-4">
              Suppose you start a monthly SIP of <strong>Rs 10,000</strong> in an equity fund from{' '}
              <strong>January 2024</strong>. You decide to redeem all units in{' '}
              <strong>February 2025</strong>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-2.5 font-semibold text-slate-700">SIP Month</th>
                    <th className="text-left p-2.5 font-semibold text-slate-700">Purchase Date</th>
                    <th className="text-left p-2.5 font-semibold text-slate-700">Holding Period (as of Feb 2025)</th>
                    <th className="text-left p-2.5 font-semibold text-slate-700">Tax Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-emerald-50/50">
                    <td className="p-2.5 text-slate-700">Jan 2024</td>
                    <td className="p-2.5 text-slate-600">~5 Jan 2024</td>
                    <td className="p-2.5 text-slate-600">13 months</td>
                    <td className="p-2.5 font-medium text-emerald-700">LTCG (12.5%)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-700">Feb 2024</td>
                    <td className="p-2.5 text-slate-600">~5 Feb 2024</td>
                    <td className="p-2.5 text-slate-600">12 months</td>
                    <td className="p-2.5 font-medium text-amber-700">STCG (20%)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-700">Mar 2024</td>
                    <td className="p-2.5 text-slate-600">~5 Mar 2024</td>
                    <td className="p-2.5 text-slate-600">11 months</td>
                    <td className="p-2.5 font-medium text-amber-700">STCG (20%)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-700">Apr 2024 onwards</td>
                    <td className="p-2.5 text-slate-600">~5 Apr 2024+</td>
                    <td className="p-2.5 text-slate-600">&le; 10 months</td>
                    <td className="p-2.5 font-medium text-amber-700">STCG (20%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Only the January 2024 installment qualifies for LTCG. All other installments are
              short-term and taxed at 20%.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Switching = Taxable Event</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    Switching from one fund to another (even within the same AMC) is treated as a
                    redemption from Fund A + fresh purchase in Fund B. Capital gains tax applies on
                    the switch-out.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">STP = Same as Switch</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    A Systematic Transfer Plan (STP) triggers a taxable event on{' '}
                    <strong>each transfer</strong>. Every monthly/weekly transfer out of the source
                    fund is a redemption and attracts capital gains tax.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Pro Tip: Partial Redemption Strategy</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Instead of redeeming all units at once, consider redeeming only those SIP
                  installments that have completed 12 months (for equity funds). This way, you
                  benefit from LTCG rates and the Rs 1.25 lakh annual exemption on all redeemed
                  units.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: DIVIDEND TAXATION ===== */}
      <section id="dividend" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">5. Dividend Taxation</h2>
              <p className="text-sm text-slate-500">Dividends are taxable in investor hands since April 2020</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Since <strong>1 April 2020</strong>, mutual fund dividends (now officially called
            &quot;Income Distribution cum Capital Withdrawal&quot; or IDCW) are added to the
            investor&apos;s total income and taxed at the applicable slab rate. The earlier system
            where the fund house paid Dividend Distribution Tax (DDT) was abolished.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Aspect</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Current Rule (Post April 2020)</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Earlier Rule (Pre April 2020)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">Who pays tax?</td>
                  <td className="p-3 text-slate-600">Investor (at slab rate)</td>
                  <td className="p-3 text-slate-600">Fund house (DDT)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Tax rate</td>
                  <td className="p-3 text-slate-600">As per investor&apos;s income slab (0%–30%+)</td>
                  <td className="p-3 text-slate-600">
                    Equity: 10% DDT; Debt: 25%/29.12% DDT
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">TDS</td>
                  <td className="p-3 text-slate-600">
                    10% TDS if total dividend from one fund house exceeds Rs 5,000/year
                  </td>
                  <td className="p-3 text-slate-600">No TDS (DDT was at source)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Impact on NAV</td>
                  <td className="p-3 text-slate-600">NAV reduces by dividend amount</td>
                  <td className="p-3 text-slate-600">Same — NAV reduced</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Why Growth Option Is Usually Better</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Under the current tax regime, the IDCW (dividend) option is tax-inefficient for
                  most investors. Dividends are taxed at your marginal slab rate (up to 30%+
                  surcharge), whereas long-term capital gains in growth option are taxed at just
                  12.5% for equity. We recommend the <strong>Growth option</strong> for most
                  investors for better tax efficiency and compounding.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Example</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  You hold units in an equity fund that declares a dividend of Rs 8,000 in FY
                  2025-26. Since this exceeds Rs 5,000, the fund house deducts TDS of 10% (Rs 800)
                  and pays you Rs 7,200. The full Rs 8,000 is added to your total income. If your
                  slab rate is 30%, actual tax = Rs 2,400. You claim Rs 800 TDS credit, so
                  additional tax payable = Rs 1,600 (plus cess).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: ELSS / SECTION 80C ===== */}
      <section id="elss" className="section-padding bg-slate-50 scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-100 text-teal-700 p-2.5 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">6. Tax-Saving Investments (Section 80C)</h2>
              <p className="text-sm text-slate-500">ELSS: Equity Linked Savings Scheme</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            ELSS (Equity Linked Savings Scheme) is the only mutual fund category that qualifies for
            tax deduction under <strong>Section 80C</strong> of the Income Tax Act. It offers the{' '}
            <strong>shortest lock-in period</strong> among all 80C investments (3 years vs 5 years
            for tax-saving FD, 15 years for PPF).
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Feature</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">Deduction limit</td>
                  <td className="p-3 text-slate-600">Up to Rs 1,50,000 per FY under Section 80C (old regime)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Lock-in period</td>
                  <td className="p-3 text-slate-600">3 years from date of allotment of each unit</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Tax on redemption</td>
                  <td className="p-3 text-slate-600">
                    Equity taxation — LTCG at 12.5% (above Rs 1.25L exemption)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">SIP in ELSS</td>
                  <td className="p-3 text-slate-600">
                    Each SIP installment is locked for 3 years individually. Jan 2024 SIP unlocks
                    in Jan 2027, Feb 2024 SIP unlocks in Feb 2027, and so on.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">New tax regime</td>
                  <td className="p-3 text-slate-600">
                    Section 80C deduction is <strong>not available</strong> under the new tax regime
                    (Section 115BAC). ELSS loses its tax-saving advantage if you opt for the new
                    regime.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 mb-1">ELSS SIP Lock-in Visual</p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  If you do a monthly ELSS SIP of Rs 12,500 (total Rs 1.5L/year), your January 2024
                  SIP is locked until January 2027. But your December 2024 SIP is locked until
                  December 2027 — that is 11 months extra compared to a lump sum investment in
                  January 2024. Despite this, SIP in ELSS is recommended for rupee-cost averaging
                  benefits.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Old vs New Tax Regime</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  From FY 2024-25 onwards, the new tax regime (Section 115BAC) is the default regime.
                  Under this regime, most deductions including 80C are not available. If you plan to
                  invest in ELSS for tax savings, ensure you opt for the old regime while filing your
                  ITR (salaried individuals can inform their employer at the start of the FY).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: TDS ON MUTUAL FUNDS ===== */}
      <section id="tds" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 text-orange-700 p-2.5 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">7. TDS on Mutual Funds</h2>
              <p className="text-sm text-slate-500">Resident and NRI TDS rules</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            TDS (Tax Deducted at Source) rules differ significantly between resident Indians and NRIs.
            Understanding these rules helps you plan your cash flows and avoid surprises at the time
            of redemption.
          </p>

          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            <Users className="w-5 h-5 inline mr-2 text-slate-500" />
            Resident Indians
          </h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Transaction</th>
                  <th className="text-left p-3 font-semibold text-slate-700">TDS Applicable?</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Rate</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">Dividend (IDCW)</td>
                  <td className="p-3 text-slate-600">Yes</td>
                  <td className="p-3 text-slate-800 font-semibold">10%</td>
                  <td className="p-3 text-slate-600">If dividend &gt; Rs 5,000 from one fund house in a FY</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Capital Gains (Redemption)</td>
                  <td className="p-3 text-emerald-600 font-medium">No TDS</td>
                  <td className="p-3 text-slate-600">—</td>
                  <td className="p-3 text-slate-600">Self-assessment — pay via advance tax</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            <Globe className="w-5 h-5 inline mr-2 text-slate-500" />
            NRI Investors
          </h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Fund Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700">STCG TDS</th>
                  <th className="text-left p-3 font-semibold text-slate-700">LTCG TDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">Equity Funds</td>
                  <td className="p-3 text-slate-800 font-semibold">20% + surcharge + cess</td>
                  <td className="p-3 text-slate-800 font-semibold">12.5% + surcharge + cess</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Debt Funds (post Apr 2023)</td>
                  <td className="p-3 text-slate-800 font-semibold">30% + surcharge + cess (slab rate)</td>
                  <td className="p-3 text-slate-800 font-semibold">30% + surcharge + cess (slab rate)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">Dividends</td>
                  <td className="p-3 text-slate-800 font-semibold" colSpan={2}>
                    20% TDS (no threshold — TDS on all dividends)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">NRI Refund Process</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  NRIs can claim a refund of excess TDS by filing an Income Tax Return (ITR) in
                  India. If the actual tax liability is lower than TDS deducted (e.g., when gains
                  fall below the basic exemption limit or DTAA benefit applies), the excess is
                  refunded. DTAA (Double Taxation Avoidance Agreement) between India and the NRI&apos;s
                  country of residence may provide additional relief.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: TAX-LOSS HARVESTING ===== */}
      <section id="harvesting" className="section-padding bg-slate-50 scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-cyan-100 text-cyan-700 p-2.5 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">8. Tax-Loss Harvesting</h2>
              <p className="text-sm text-slate-500">Strategically book losses to reduce tax liability</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Tax-loss harvesting is a strategy where you intentionally book losses on underperforming
            investments to offset gains on profitable ones. This is entirely legal and a smart way to
            reduce your capital gains tax bill.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700">Loss Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Can Offset Against</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Cannot Offset Against</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Carry Forward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-amber-700">Short-term Capital Loss (STCL)</td>
                  <td className="p-3 text-emerald-600">Both STCG and LTCG (any asset)</td>
                  <td className="p-3 text-red-600">Salary, business, rental, or other income</td>
                  <td className="p-3 text-slate-600">8 assessment years</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-emerald-700">Long-term Capital Loss (LTCL)</td>
                  <td className="p-3 text-emerald-600">Only LTCG (any asset)</td>
                  <td className="p-3 text-red-600">STCG, salary, business, or other income</td>
                  <td className="p-3 text-slate-600">8 assessment years</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Practical Example</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  In FY 2026-27, you have LTCG of Rs 2,00,000 from Fund A (equity). You also hold
                  Fund B which is at a loss of Rs 50,000 (held &gt;12 months). If you redeem Fund B,
                  you book an LTCL of Rs 50,000. Net LTCG = Rs 2,00,000 - Rs 50,000 = Rs 1,50,000.
                  After Rs 1,25,000 exemption, taxable LTCG = Rs 25,000. Tax = 12.5% of Rs 25,000 =
                  Rs 3,125. Without harvesting, tax would have been 12.5% of Rs 75,000 = Rs 9,375.
                  You save <strong>Rs 6,250</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-800 mb-2">Do&apos;s</p>
              <ul className="text-sm text-emerald-700 space-y-1.5 list-disc list-inside">
                <li>Book losses before 31 March to use them in the current FY</li>
                <li>Re-invest the proceeds in the same or similar fund after redeeming</li>
                <li>Keep track of all transactions for ITR filing</li>
                <li>File ITR before due date to carry forward losses</li>
              </ul>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800 mb-2">Don&apos;ts</p>
              <ul className="text-sm text-red-700 space-y-1.5 list-disc list-inside">
                <li>Don&apos;t sell a good fund just for tax harvesting if it disrupts your goals</li>
                <li>Don&apos;t forget — exit load may apply if redeemed within 1 year</li>
                <li>Don&apos;t miss the ITR filing deadline — uncarried losses cannot be carried forward</li>
                <li>India has no &quot;wash sale&quot; rule, but don&apos;t abuse the spirit of the law</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: TAX CHANGES TIMELINE ===== */}
      <section id="timeline" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 text-pink-700 p-2.5 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">9. Key Tax Changes Timeline</h2>
              <p className="text-sm text-slate-500">Major mutual fund tax changes over the years</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Mutual fund taxation in India has undergone significant changes over the past two decades.
            Here is a chronological view of the most impactful changes every investor should know.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700 w-36">When</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Change</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-rose-50/50">
                  <td className="p-3 font-medium text-slate-700">July 2024</td>
                  <td className="p-3 text-slate-600">
                    Budget 2024: Equity LTCG rate 10% &rarr; 12.5%, exemption Rs 1L &rarr; Rs 1.25L,
                    STCG 15% &rarr; 20%. <strong>Indexation benefit removed</strong> for all asset
                    classes (except immovable property with transitional relief). Holding period
                    for debt/other assets simplified from 36 to 24 months. Gold &amp; Silver ETFs
                    excluded from &quot;specified mutual funds&quot; from FY 2025-26.
                  </td>
                  <td className="p-3 text-slate-600">
                    Higher equity tax rates offset by higher exemption. Debt fund grandfathered
                    units (pre-Apr 2023) now get 12.5% LTCG after 24 months but without indexation.
                    Gold/Silver ETF investors benefit from LTCG treatment at 12.5%.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">April 2023</td>
                  <td className="p-3 text-slate-600">
                    &quot;Specified mutual funds&quot; (debt, liquid, gold FoFs, etc.) purchased from
                    1 Apr 2023 — all gains at slab rate regardless of holding period (Section 50AA).
                    Pre-April 2023 units grandfathered under old regime (later modified by Budget 2024)
                  </td>
                  <td className="p-3 text-slate-600">
                    Massive negative for high-income debt fund investors. Debt MFs lost tax edge
                    over FDs for new purchases. Gold/Silver ETFs later excluded from FY 2025-26.
                  </td>
                </tr>
                <tr className="bg-rose-50/50">
                  <td className="p-3 font-medium text-slate-700">April 2020</td>
                  <td className="p-3 text-slate-600">
                    DDT abolished. Dividends now taxed in investor hands at slab rate
                  </td>
                  <td className="p-3 text-slate-600">
                    High-income investors in 30% slab now pay more on dividends. Growth option
                    became more attractive
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">February 2018</td>
                  <td className="p-3 text-slate-600">
                    Equity LTCG reintroduced at 10% above Rs 1L (Budget 2018). Grandfathering of
                    gains up to 31 Jan 2018
                  </td>
                  <td className="p-3 text-slate-600">
                    Equity LTCG was tax-free since 2004 — this was a major change. Gains accrued
                    until 31 Jan 2018 were protected
                  </td>
                </tr>
                <tr className="bg-rose-50/50">
                  <td className="p-3 font-medium text-slate-700">October 2004</td>
                  <td className="p-3 text-slate-600">
                    Equity LTCG made tax-free; STT (Securities Transaction Tax) introduced
                  </td>
                  <td className="p-3 text-slate-600">
                    Huge boost for equity investors. STT at 0.001% was negligible compared to
                    LTCG tax saved
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">2003</td>
                  <td className="p-3 text-slate-600">
                    ELSS introduced under Section 80C with 3-year lock-in
                  </td>
                  <td className="p-3 text-slate-600">
                    Shortest lock-in among 80C options, making ELSS very popular for tax-saving
                  </td>
                </tr>
                <tr className="bg-rose-50/50">
                  <td className="p-3 font-medium text-slate-700">1997</td>
                  <td className="p-3 text-slate-600">
                    DDT introduced — fund houses started paying tax on dividends at source
                  </td>
                  <td className="p-3 text-slate-600">
                    Simplified things for investors but was regressive (same rate for all income
                    levels). Abolished in 2020
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">What to Expect Going Forward</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  The government has been simplifying the tax structure but also increasing effective
                  tax rates on capital gains. The new tax regime (115BAC) does not offer 80C
                  deductions, so ELSS loses its appeal for those opting for the new regime. Keep
                  watching Union Budget announcements each July for potential changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: KEY DUE DATES ===== */}
      <section id="due-dates" className="section-padding bg-slate-50 scroll-mt-20">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">10. Key Due Dates for MF Investors</h2>
              <p className="text-sm text-slate-500">FY 2026-27 (AY 2027-28) tax calendar</p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            Missing tax deadlines can result in penalties, interest, and inability to carry forward
            losses. Here are the critical dates every mutual fund investor should mark on their
            calendar.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700 w-40">Date</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Event</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Relevance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-slate-700">15 June 2026</td>
                  <td className="p-3 text-slate-600">Advance Tax — 1st installment (15% of total)</td>
                  <td className="p-3 text-slate-600">
                    If capital gains exceed Rs 10,000 in a year, advance tax is mandatory
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">15 September 2026</td>
                  <td className="p-3 text-slate-600">Advance Tax — 2nd installment (cumulative 45%)</td>
                  <td className="p-3 text-slate-600">
                    Pay 45% of estimated annual tax minus amount already paid
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">15 December 2026</td>
                  <td className="p-3 text-slate-600">Advance Tax — 3rd installment (cumulative 75%)</td>
                  <td className="p-3 text-slate-600">
                    Important if you booked large gains in Oct-Dec quarter
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">15 March 2027</td>
                  <td className="p-3 text-slate-600">Advance Tax — 4th installment (cumulative 100%)</td>
                  <td className="p-3 text-slate-600">
                    Last chance to pay advance tax. Interest u/s 234B &amp; 234C for shortfall
                  </td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="p-3 font-medium text-amber-800">31 March 2027</td>
                  <td className="p-3 text-slate-600 font-medium">End of FY 2026-27</td>
                  <td className="p-3 text-slate-600">
                    Last date for tax-loss harvesting, 80C investments (ELSS), and booking LTCG
                    within Rs 1.25L exemption
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">15 June 2026</td>
                  <td className="p-3 text-slate-600">TDS certificates (Form 16A) from AMCs</td>
                  <td className="p-3 text-slate-600">
                    AMCs issue TDS certificates for dividends. Check Form 26AS for credits
                  </td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="p-3 font-medium text-amber-800">31 July 2026</td>
                  <td className="p-3 text-slate-600 font-medium">ITR filing due date (non-audit)</td>
                  <td className="p-3 text-slate-600">
                    File before this date to carry forward capital losses. Late filing attracts
                    penalty of Rs 5,000 (Rs 1,000 if income &lt; Rs 5L)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">31 October 2026</td>
                  <td className="p-3 text-slate-600">ITR filing due date (if audit required)</td>
                  <td className="p-3 text-slate-600">
                    For business owners whose accounts require audit
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-700">31 December 2026</td>
                  <td className="p-3 text-slate-600">Belated/revised ITR filing deadline</td>
                  <td className="p-3 text-slate-600">
                    Last chance to file belated return. Losses cannot be carried forward in belated
                    returns
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Critical: File ITR Before Due Date</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  If you have capital losses to carry forward, you <strong>must</strong> file your
                  ITR before the original due date (31 July for most individuals). Filing a belated
                  return after this date means you lose the right to carry forward losses for future
                  set-off. This is one of the most commonly missed rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section-padding bg-gradient-to-br from-primary-700 via-primary-600 to-brand-700 text-white">
        <div className="container-custom max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Calculate Your Mutual Fund Tax
          </h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Use our free Capital Gains Tax Calculator to compute your exact tax liability on
            mutual fund redemptions. Or explore the NRI taxation guide for rules specific to
            non-resident investors.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/calculators/capital-gains-tax"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold rounded-full px-6 py-3 text-sm hover:bg-white/90 transition"
            >
              <Calculator className="w-4 h-4" />
              Capital Gains Tax Calculator
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/resources/taxation/nri"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-6 py-3 text-sm hover:bg-white/20 transition"
            >
              <Globe className="w-4 h-4" />
              NRI Taxation Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== DISCLAIMER ===== */}
      <section className="section-padding bg-slate-50 border-t border-slate-200">
        <div className="container-custom max-w-4xl">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-700 mb-2">Disclaimer</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  {DISCLAIMER.general}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  Tax laws are subject to change. The information on this page is based on the
                  Income Tax Act, 1961 as amended by the Finance (No. 2) Act, 2024 and applicable
                  for FY 2026-27 (AY 2027-28). All rates are post-Budget 2024 (effective 23 July
                  2024). Rates mentioned are exclusive of surcharge and 4% health &amp; education
                  cess unless stated otherwise. Please consult your Chartered Accountant or tax
                  professional for advice specific to your situation.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {DISCLAIMER.mutual_fund} | {DISCLAIMER.amfi}
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Last updated: April 2026 | Content reviewed for FY 2026-27 (AY 2027-28)
          </p>
        </div>
      </section>
    </>
  );
}
