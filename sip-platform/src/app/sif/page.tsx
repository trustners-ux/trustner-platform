import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, ShieldCheck, Layers, ArrowRight, ChevronRight, BookOpen,
  MessageCircle, Scale, GitCompareArrows, AlertTriangle, BadgeCheck,
  IndianRupee, Target, Building2, LineChart,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Specialized Investment Fund (SIF) in India — Complete Guide 2026',
  description:
    'What is a Specialized Investment Fund (SIF)? The new SEBI category (since April 2025) that bridges mutual funds and PMS — ₹10 lakh minimum, long-short and sector-rotation strategies. SIF vs MF vs PMS vs AIF, strategy categories, taxation, who should invest, and how to start with Trustner (AMFI-registered SIF Distributor, ARN-286886).',
  path: '/sif',
  keywords: [
    'specialized investment fund',
    'specialised investment fund',
    'what is SIF',
    'SIF full form',
    'SIF India',
    'SIF vs mutual fund',
    'SIF vs PMS',
    'SIF minimum investment',
    'long short fund India',
    'SIF strategy categories',
    'SIF distributor',
  ],
});

const faqs = [
  {
    question: 'What is the full form of SIF?',
    answer:
      'SIF stands for Specialized Investment Fund. It is a new category of pooled investment product introduced by SEBI, effective 1 April 2025, that sits between traditional mutual funds and Portfolio Management Services (PMS). SIFs let asset managers run more advanced, flexible strategies — such as long-short equity, sector rotation and active asset allocation — while remaining inside the mutual-fund regulatory and operational framework.',
  },
  {
    question: 'What is the minimum investment in a SIF?',
    answer:
      'The minimum investment in a SIF is ₹10 lakh per investor, per AMC, aggregated across all SIF strategies of that AMC (the PAN-level aggregation rule). This threshold is set by SEBI to keep SIFs aimed at informed, mass-affluent and HNI investors. Accredited investors may be exempt from the ₹10 lakh floor. This is the key reason a SIF is a different decision from a ₹500 SIP.',
  },
  {
    question: 'How is a SIF different from a mutual fund?',
    answer:
      'A SIF is regulated and operated like a mutual fund (daily NAV, an AMC, a custodian, SEBI oversight) but is allowed to use strategies a normal mutual fund cannot — most notably taking short positions through derivatives (long-short), concentrated or ex-top-100 portfolios, and tactical sector rotation. In exchange for that flexibility, the minimum ticket is ₹10 lakh (vs ₹500 for an SIP) and the strategies carry a different, often higher, risk and complexity profile.',
  },
  {
    question: 'How is a SIF different from PMS or an AIF?',
    answer:
      'PMS requires a ₹50 lakh minimum and gives you a separately-held portfolio in your own demat account; AIFs (Category I/II/III) typically require ₹1 crore and are less liquid, closed-structures. A SIF needs only ₹10 lakh, is a pooled fund with daily/periodic NAV like a mutual fund, and offers far better transparency and operational simplicity than PMS or AIF — which is exactly why it is described as the "bridge" between mutual funds and PMS.',
  },
  {
    question: 'What strategy categories of SIF does SEBI allow?',
    answer:
      'SEBI permits SIFs across a defined set of strategy types, including Equity Long-Short, Equity Ex-Top-100 Long-Short, Sector Rotation Long-Short, Hybrid Long-Short, and Active Asset Allocator Long-Short. Each AMC can run a limited number of strategies, and short exposure is taken through derivatives within SEBI-prescribed limits. Hybrid long-short strategies have attracted the largest share of early SIF assets.',
  },
  {
    question: 'How are SIFs taxed in India?',
    answer:
      'SIF taxation follows the tax character of the underlying portfolio — an equity-oriented SIF is taxed like an equity fund (LTCG and STCG rules for equity), while a debt-oriented or hybrid SIF is taxed per the applicable debt/hybrid rules. Because strategies vary and tax rules can change, the post-tax outcome should be confirmed with your chartered accountant before investing. Trustner can help map the structure, but tax filing advice should come from your CA.',
  },
  {
    question: 'Are SIFs safe, and do they have a track record?',
    answer:
      'SIFs are SEBI-regulated and subject to market risks like any market-linked product — and importantly, the category is new: most live SIF schemes launched between late 2025 and early 2026, so they have under one year of track record. Returns and risk metrics on such a short history are not indicative of future performance. SIFs use sophisticated, sometimes leveraged strategies and are intended for informed investors who understand them. Read all scheme-related documents and the riskometer carefully.',
  },
  {
    question: 'How do I invest in a SIF, and can Trustner help?',
    answer:
      'You invest in a SIF through an AMFI-registered distributor after completing KYC and meeting the ₹10 lakh minimum. Trustner Asset Services (ARN-286886) is a registered Mutual Fund and SIF Distributor and can help you understand the strategy categories, assess suitability for your goals and risk profile, and complete onboarding in the Regular plan with ongoing servicing. Trustner is a distributor, not a SEBI Registered Investment Adviser — the conversation is education and execution support, not investment advice.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'Specialized Investment Fund (SIF)', url: '/sif' },
];

const STRATEGIES = [
  { name: 'Equity Long-Short', icon: LineChart, desc: 'Holds a core of equities (long) while shorting overvalued stocks or the index via derivatives to manage downside and seek alpha in both directions.', risk: 'Very High' },
  { name: 'Hybrid Long-Short', icon: Scale, desc: 'Blends equity, debt and a long-short overlay — the most popular early SIF type, attracting the largest share of assets for its smoother ride.', risk: 'High' },
  { name: 'Equity Ex-Top-100 Long-Short', icon: TrendingUp, desc: 'Focuses on mid and small caps outside the top 100 by market cap, with a long-short overlay — higher return potential, higher volatility.', risk: 'Very High' },
  { name: 'Sector Rotation Long-Short', icon: GitCompareArrows, desc: 'Tactically rotates between sectors based on momentum and macro signals, using shorts to hedge or express negative views.', risk: 'Very High' },
  { name: 'Active Asset Allocator Long-Short', icon: Layers, desc: 'Dynamically shifts across asset classes (equity, debt, gold, derivatives) to adapt to changing markets — an all-weather mandate.', risk: 'High' },
];

export default function SIFPillarPage() {
  const faqSchema = generateFAQSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const wa = COMPANY.contact?.whatsapp?.replace('+', '') || '916003903737';
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent('Hi Trustner, I want to understand Specialized Investment Funds (SIF) and whether they fit my portfolio. Please guide me.')}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">Specialized Investment Fund (SIF)</span>
          </nav>
        </div>
      </div>

      {/* Hero — the "bridge" positioning */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <BadgeCheck className="w-3.5 h-3.5 text-accent" />
              <span>New SEBI category · live since 1 April 2025</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Specialized Investment Funds{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                (SIF)
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              You&rsquo;ve outgrown plain mutual funds. You&rsquo;re not yet at PMS scale.
              SIFs are the bridge in between &mdash; mutual-fund-grade regulation with PMS-style
              flexibility (long-short, sector rotation, active allocation), from a {'₹'}10 lakh minimum.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-amber-300 transition-colors text-sm">
                <MessageCircle className="w-4 h-4" /> Talk to Trustner about SIF
              </a>
              <Link href="/funds/sif"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors text-sm">
                <LineChart className="w-4 h-4" /> See all live SIFs &amp; NAVs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility strip */}
      <section className="bg-white border-b border-surface-200">
        <div className="container-custom py-4">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
              <ShieldCheck className="w-4 h-4 text-brand" /> {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'}
            </span>
            <span>AMFI-registered Mutual Fund &amp; SIF Distributor · {COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'}</span>
            <span className="text-slate-400">Reviewed by CA Ishika Bajaj · Last updated 14 June 2026</span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">What is a Specialized Investment Fund (SIF)?</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  A <strong className="text-primary-700">Specialized Investment Fund (SIF)</strong> is a new category of
                  pooled investment product introduced by SEBI, effective <strong>1 April 2025</strong>. It is purpose-built
                  to fill the long-standing gap between a traditional mutual fund (simple, {'₹'}500 minimum, limited
                  strategies) and Portfolio Management Services (sophisticated, but a {'₹'}50 lakh minimum).
                </p>
                <p>
                  A SIF is run and regulated <em>like a mutual fund</em> &mdash; there is an AMC, a custodian, daily or
                  periodic NAV, and SEBI oversight &mdash; but it is allowed to use strategies a normal mutual fund cannot.
                  Most importantly, a SIF can take <strong>short positions through derivatives</strong> (a
                  &ldquo;long-short&rdquo; strategy), run concentrated or ex-top-100 portfolios, and rotate tactically
                  between sectors and asset classes. In return for that flexibility, the minimum investment is
                  <strong> {'₹'}10 lakh</strong> &mdash; which is why a SIF is a fundamentally different decision from a SIP.
                </p>
                <p>
                  The category is growing quickly. As of May 2026, total SIF assets had reached roughly
                  <strong> {'₹'}13,800 crore across about 25 live schemes</strong> from around a dozen AMCs &mdash;
                  up from under {'₹'}3,000 crore six months earlier. That said, it remains a very young category:
                  most schemes have less than one year of history, so any returns shown elsewhere should be read with care.
                </p>
              </div>
            </div>

            {/* Strategy categories */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">The SIF strategy categories</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                SEBI permits SIFs across a defined set of strategy types. Each AMC may run a limited number of them.
                Short exposure is always taken through derivatives, within SEBI-prescribed limits.
              </p>
              <div className="space-y-4">
                {STRATEGIES.map((s, i) => (
                  <div key={s.name} className="flex items-start gap-4 card-base p-5">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand shrink-0">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-primary-700">{i + 1}. {s.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Risk: {s.risk}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison table */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">SIF vs Mutual Fund vs PMS vs AIF</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Where a SIF sits in the spectrum of pooled and managed products in India:
              </p>
              <div className="overflow-x-auto rounded-xl border border-surface-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary-700 text-white text-left">
                      <th className="px-3 py-2.5 font-semibold">Feature</th>
                      <th className="px-3 py-2.5 font-semibold">Mutual Fund</th>
                      <th className="px-3 py-2.5 font-semibold bg-brand">SIF</th>
                      <th className="px-3 py-2.5 font-semibold">PMS</th>
                      <th className="px-3 py-2.5 font-semibold">AIF</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    {[
                      ['Minimum investment', '₹500', '₹10 lakh', '₹50 lakh', '₹1 crore'],
                      ['Regulation', 'SEBI (MF Regs)', 'SEBI (MF framework)', 'SEBI (PMS Regs)', 'SEBI (AIF Regs)'],
                      ['Structure', 'Pooled', 'Pooled', 'Individual portfolio', 'Pooled (closed)'],
                      ['Strategy flexibility', 'Limited', 'High (long-short, sector rotation)', 'High', 'Very high'],
                      ['Short selling', 'No', 'Yes (via derivatives)', 'Limited', 'Yes'],
                      ['Transparency / NAV', 'Daily NAV', 'Daily/periodic NAV', 'Statements', 'Periodic'],
                      ['Liquidity', 'High', 'Moderate–High', 'Moderate', 'Low (lock-in)'],
                      ['Best for', 'Everyone', 'Mass-affluent / HNI', 'HNI', 'Sophisticated / UHNI'],
                    ].map((row, ri) => (
                      <tr key={ri} className={ri % 2 ? 'bg-surface-100' : 'bg-white'}>
                        <td className="px-3 py-2.5 font-semibold text-primary-700">{row[0]}</td>
                        <td className="px-3 py-2.5">{row[1]}</td>
                        <td className="px-3 py-2.5 bg-brand-50/60 font-medium text-primary-700">{row[2]}</td>
                        <td className="px-3 py-2.5">{row[3]}</td>
                        <td className="px-3 py-2.5">{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">Indicative; minimums and rules are set by SEBI and AMCs and may change. For reference only, not advice.</p>
            </div>

            {/* Who should consider */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">Who should consider a SIF?</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: IndianRupee, text: 'Mass-affluent and HNI investors who can commit the ₹10 lakh minimum and have surplus beyond their core goals.' },
                  { icon: Target, text: 'Investors who have outgrown plain mutual funds and want strategy flexibility, but aren’t yet at PMS scale or appetite.' },
                  { icon: ShieldCheck, text: 'Those who value the downside-management potential of a long-short or hybrid strategy in choppy markets.' },
                  { icon: Building2, text: 'Investors who want mutual-fund-grade regulation, custody and daily NAV transparency rather than a separately-managed PMS account.' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 bg-surface-100 rounded-lg p-4">
                    <item.icon className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  <strong>A SIF is not for everyone.</strong> The strategies are sophisticated and can use leverage and
                  short positions; the category is new with limited track record. Suitability depends on your goals, risk
                  capacity and existing portfolio. Trustner can help you assess fit &mdash; as your distributor, through
                  education and a structured suitability conversation, not investment advice.
                </p>
              </div>
            </div>

            {/* How to invest */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">How to invest in a SIF</h2>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Confirm eligibility', desc: 'The minimum is ₹10 lakh per AMC, aggregated across all that AMC’s SIF strategies (the PAN-level aggregation rule). Accredited investors may be exempt from the floor.' },
                  { step: '2', title: 'Complete KYC', desc: 'A one-time SEBI KYC with PAN, Aadhaar and bank details. Trustner can guide you through eKYC if you’re not already KYC-compliant.' },
                  { step: '3', title: 'Pick the right strategy', desc: 'Match a SIF strategy category to your goal and risk profile — hybrid long-short for a smoother ride, equity long-short or ex-top-100 for higher return potential, active allocator for an all-weather mandate.' },
                  { step: '4', title: 'Invest in the Regular plan with Trustner', desc: 'Onboard in the Regular plan so you get ongoing servicing, reviews and hand-holding through market cycles — the part a do-it-yourself comparison site cannot give you.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
                    <div className="card-base p-5 flex-1">
                      <h3 className="font-bold text-primary-700 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-primary-700 mb-6">Go deeper</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/blog/sif-specialized-investment-fund-india-next-big-thing-financial-planning-2026" className="card-base p-5 hover-lift group">
                <BookOpen className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">The full SIF deep-dive</h3>
                <p className="text-xs text-slate-500">Our 6,000-word breakdown of every live SIF and strategy</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/funds/universe" className="card-base p-5 hover-lift group">
                <LineChart className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">Fund Universe</h3>
                <p className="text-xs text-slate-500">Explore 4,200+ funds with live NAV and analytics</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/learn" className="card-base p-5 hover-lift group">
                <Layers className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">Learning Centre</h3>
                <p className="text-xs text-slate-500">Structured modules on SIF, PMS, AIF and mutual funds</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-primary-700 mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-sm">Common questions about Specialized Investment Funds</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card-base p-6">
                  <h3 className="font-bold text-primary-700 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Is a SIF right for your portfolio?</h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Talk to Trustner &mdash; an AMFI-registered Mutual Fund &amp; SIF Distributor. We&rsquo;ll walk you through
            the strategy categories, sense-check suitability for your goals, and help you onboard. No obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm">
              <MessageCircle className="w-5 h-5" /> Talk to Trustner about SIF
            </a>
            <Link href="/funds/universe"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg text-sm">
              <LineChart className="w-5 h-5" /> Explore Funds
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-surface-100 py-6">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">Important:</strong> Specialized Investment Funds are a new SEBI category;
              most live schemes have under one year of track record, and past performance is not indicative of future
              results. SIFs use sophisticated strategies including derivatives and short positions and are intended for
              informed investors. This page is for educational and comparison purposes and does <strong>not</strong>
              {' '}constitute investment advice under the SEBI (Investment Advisers) Regulations, 2013.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.mutual_fund}{' '}
              {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'} is an AMFI-registered Mutual Fund &amp; SIF
              Distributor ({COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'}) and recommends Regular plans only. It is not a
              SEBI Registered Investment Adviser. Read all scheme-related documents and the riskometer carefully before investing.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
