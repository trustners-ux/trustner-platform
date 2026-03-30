import { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale, ChevronRight, BookOpen, Calculator, ArrowRight,
  CheckCircle2, TrendingUp, MessageCircle, BarChart3,
  Clock, Repeat, Zap, Target, ArrowDown, ArrowUp,
  Lightbulb, IndianRupee,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP vs Lump Sum: Which Investment Strategy is Better? | Mera SIP',
  description:
    'Compare SIP vs lump sum investment strategies. Understand when SIP is better, when lump sum wins, and how a hybrid approach can optimize your mutual fund returns.',
  path: '/sip-vs-lumpsum',
  keywords: [
    'SIP vs lumpsum',
    'SIP or lumpsum which is better',
    'SIP vs lump sum comparison',
    'lump sum vs SIP returns',
    'SIP vs one time investment',
    'when to invest lump sum',
    'SIP vs lumpsum calculator',
  ],
});

const faqs = [
  {
    question: 'Is SIP always better than lump sum?',
    answer:
      'No, SIP is not always better. In a consistently rising (bull) market, lump sum typically generates higher returns because the entire amount starts compounding from day one. SIP works better in volatile or declining markets due to rupee cost averaging. The best approach depends on market conditions, your cash flow, and investment horizon.',
  },
  {
    question: 'Can I do both SIP and lump sum in the same mutual fund?',
    answer:
      'Yes, absolutely. Many investors use a hybrid approach \u2014 they run a regular monthly SIP for disciplined investing and add lump sum top-ups when they receive bonuses, tax refunds, or when markets correct significantly. This combination offers the best of both strategies.',
  },
  {
    question: 'What if I have a large amount but markets seem expensive?',
    answer:
      'If you have a large sum and are unsure about market levels, consider a Systematic Transfer Plan (STP). Park the lump sum in a liquid or ultra-short-term debt fund, and set up a weekly or monthly STP that transfers a fixed amount into an equity fund. This gives you rupee cost averaging benefits while the remaining amount earns debt fund returns.',
  },
  {
    question: 'How do I compare SIP and lump sum returns accurately?',
    answer:
      'For SIP, use XIRR (Extended Internal Rate of Return) as it accounts for the timing of each installment. For lump sum, CAGR (Compound Annual Growth Rate) is appropriate. Comparing CAGR of SIP with CAGR of lump sum is incorrect because SIP cash flows happen at different times. Use our SIP vs Lumpsum calculator for an accurate side-by-side comparison.',
  },
  {
    question: 'Which strategy is better for tax-saving ELSS investments?',
    answer:
      'For ELSS (Equity Linked Saving Schemes), SIP is generally more practical because it spreads your tax-saving investment across the year instead of a last-minute rush. Each SIP installment in ELSS has its own 3-year lock-in period from the date of that particular investment, so earlier installments become available for redemption sooner.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'SIP vs Lump Sum', url: '/sip-vs-lumpsum' },
];

export default function SIPvsLumpsumPage() {
  const faqSchema = generateFAQSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ═══════════ BREADCRUMB ═══════════ */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">SIP vs Lump Sum</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Scale className="w-3.5 h-3.5 text-accent" />
              <span>Strategy Comparison</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP vs Lump Sum:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Which is Better?
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Both SIP and lump sum have their advantages. Learn when each strategy works best
              and how combining them can optimize your investment returns.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            {/* Understanding SIP vs Lump Sum */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Understanding SIP vs Lump Sum
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-primary-700">SIP (Systematic Investment Plan)</strong> involves
                  investing a fixed amount at regular intervals &mdash; typically monthly &mdash; into a
                  mutual fund. This spreads your investment over time, reducing the impact of market
                  timing and volatility.
                </p>
                <p>
                  <strong className="text-primary-700">Lump Sum</strong> investment is when you deploy a
                  significant amount of money into a mutual fund in a single transaction. The entire
                  investment begins compounding from day one, potentially generating higher returns in
                  a rising market.
                </p>
                <p>
                  The debate between SIP and lump sum is one of the most common questions in mutual fund
                  investing. The truth is that neither is universally superior &mdash; the better choice
                  depends on your financial situation, market conditions, and investment goals.
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Key Differences: SIP vs Lump Sum
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary-700 text-white">
                      <th className="text-left p-4 text-sm font-semibold rounded-tl-lg">Parameter</th>
                      <th className="text-left p-4 text-sm font-semibold">SIP</th>
                      <th className="text-left p-4 text-sm font-semibold rounded-tr-lg">Lump Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        param: 'Investment Mode',
                        sip: 'Fixed amount at regular intervals (monthly)',
                        lump: 'Entire amount invested at once',
                      },
                      {
                        param: 'Minimum Amount',
                        sip: '\u20B9500/month in most funds',
                        lump: '\u20B95,000 one-time in most funds',
                      },
                      {
                        param: 'Market Timing Risk',
                        sip: 'Low \u2014 averages out entry points over time',
                        lump: 'High \u2014 entry point determines returns',
                      },
                      {
                        param: 'Rupee Cost Averaging',
                        sip: 'Yes \u2014 automatically buys more units when markets are low',
                        lump: 'No \u2014 all units purchased at a single NAV',
                      },
                      {
                        param: 'Best In',
                        sip: 'Volatile or declining markets',
                        lump: 'Consistently rising (bull) markets',
                      },
                      {
                        param: 'Cash Flow Requirement',
                        sip: 'Small regular amounts from monthly income',
                        lump: 'Large amount available upfront',
                      },
                      {
                        param: 'Compounding Advantage',
                        sip: 'Gradual \u2014 each installment has different compounding period',
                        lump: 'Maximum \u2014 entire amount compounds from day one',
                      },
                      {
                        param: 'Emotional Discipline',
                        sip: 'High \u2014 automated, removes emotional bias',
                        lump: 'Lower \u2014 requires conviction to invest a large amount',
                      },
                      {
                        param: 'Ideal For',
                        sip: 'Salaried professionals with regular income',
                        lump: 'Investors with windfall gains or accumulated savings',
                      },
                    ].map((row, index) => (
                      <tr key={row.param} className={index % 2 === 0 ? 'bg-surface-100' : 'bg-white'}>
                        <td className="p-4 text-sm font-semibold text-primary-700">{row.param}</td>
                        <td className="p-4 text-sm text-slate-600">{row.sip}</td>
                        <td className="p-4 text-sm text-slate-600">{row.lump}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* When SIP is Better */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                When SIP is the Better Choice
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                SIP tends to outperform lump sum in the following scenarios:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: BarChart3,
                    title: 'Volatile or Falling Markets',
                    desc: 'In choppy markets, SIP buys units across different price levels, averaging out your cost. When the market eventually recovers, the units bought at lower prices generate superior returns.',
                    color: 'bg-brand-50 text-brand',
                  },
                  {
                    icon: Repeat,
                    title: 'Regular Income Earners',
                    desc: 'If your primary income source is a monthly salary, SIP aligns perfectly with your cash flow. You can invest right after each salary credit without accumulating and timing a large investment.',
                    color: 'bg-teal-50 text-teal-600',
                  },
                  {
                    icon: Clock,
                    title: 'Long-Term Goals (7+ Years)',
                    desc: 'For distant goals like retirement or children\'s education, SIP ensures consistent investment over many years. The discipline of regular investing is more important than getting the perfect entry point.',
                    color: 'bg-amber-50 text-amber-600',
                  },
                  {
                    icon: Target,
                    title: 'First-Time Equity Investors',
                    desc: 'If you are new to equity markets, SIP provides a comfortable way to build exposure gradually. You experience both ups and downs in smaller doses, building confidence and understanding over time.',
                    color: 'bg-secondary-50 text-secondary-600',
                  },
                ].map((item) => (
                  <div key={item.title} className="card-base p-5 hover-lift">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* When Lump Sum is Better */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                When Lump Sum is the Better Choice
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Lump sum investment has the edge in these situations:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: ArrowDown,
                    title: 'After a Significant Market Correction',
                    desc: 'When markets have fallen 20-30% or more from their peak, deploying a lump sum can be highly rewarding. You enter at depressed valuations, and the recovery multiplies your returns significantly.',
                    color: 'bg-brand-50 text-brand',
                  },
                  {
                    icon: IndianRupee,
                    title: 'Windfall Income or Inheritance',
                    desc: 'If you receive a large sum from a bonus, property sale, inheritance, or matured investment, deploying it as lump sum (potentially via STP) puts the entire capital to work immediately rather than leaving it idle.',
                    color: 'bg-teal-50 text-teal-600',
                  },
                  {
                    icon: ArrowUp,
                    title: 'In a Sustained Bull Market',
                    desc: 'In a market that is trending consistently upward, each SIP installment buys units at progressively higher prices. A lump sum deployed at the beginning captures the full upside from the start.',
                    color: 'bg-amber-50 text-amber-600',
                  },
                  {
                    icon: Clock,
                    title: 'Short-Term Debt Fund Investments',
                    desc: 'For debt fund investments with a 1-3 year horizon, lump sum often makes more sense as these funds are less volatile. The entire amount starts earning returns immediately without the averaging overhead.',
                    color: 'bg-secondary-50 text-secondary-600',
                  },
                ].map((item) => (
                  <div key={item.title} className="card-base p-5 hover-lift">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hybrid Approach */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                The Hybrid Approach: Best of Both Worlds
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-6">
                <p>
                  Experienced investors often combine both strategies for optimal results. The hybrid
                  approach uses SIP as the foundation for regular investing and lump sum for tactical
                  opportunities.
                </p>
              </div>

              <div className="card-base p-6 mb-6 border-l-4 border-l-brand">
                <h3 className="font-bold text-primary-700 mb-3">How the Hybrid Strategy Works</h3>
                <div className="space-y-3">
                  {[
                    'Maintain a regular monthly SIP as your core investment strategy \u2014 this builds discipline and ensures consistent investing.',
                    'When you receive bonuses, incentives, or surplus income, invest lump sum amounts as top-ups into your existing or new funds.',
                    'During significant market corrections (15-20%+ fall), increase your SIP amount or make additional lump sum investments to buy at lower prices.',
                    'Use STP (Systematic Transfer Plan) for large sums \u2014 park in a liquid fund and transfer to equity fund weekly or monthly over 3-6 months.',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-50 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 font-semibold mb-1">Practical Example</p>
                    <p className="text-sm text-slate-600">
                      Invest {'\u20B9'}15,000/month through SIP across 2-3 funds. When your annual bonus
                      of {'\u20B9'}2 lakh arrives, invest {'\u20B9'}1 lakh as lump sum in equities and keep
                      {'\u20B9'}1 lakh as emergency fund in a liquid fund. If markets correct 20%, deploy
                      additional {'\u20B9'}50,000 from your tactical reserve. This approach captures both
                      disciplined investing and market opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Performance */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Historical Performance Comparison
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Historical data from Indian equity markets shows that lump sum investments have
                  outperformed SIP about 60-65% of the time over 10-year rolling periods. This is
                  because markets tend to rise more often than they fall over the long term &mdash; making
                  early full deployment advantageous.
                </p>
                <p>
                  However, the advantage of SIP is not just in returns. SIP significantly reduces the risk
                  of poor timing. The worst-case scenario for SIP is much less severe than the worst case
                  for lump sum. If you had invested a lump sum at a market peak before a crash, your
                  recovery time would be much longer compared to an SIP investor who continued buying
                  through the downturn.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="card-base p-5 border-t-4 border-t-brand">
                  <h3 className="font-bold text-primary-700 mb-3">SIP Advantage</h3>
                  <div className="space-y-2">
                    {[
                      'Lower downside risk in volatile markets',
                      'Better risk-adjusted returns (lower volatility)',
                      'No regret of bad timing decisions',
                      'Behaviorally easier to stick with',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-base p-5 border-t-4 border-t-amber-500">
                  <h3 className="font-bold text-primary-700 mb-3">Lump Sum Advantage</h3>
                  <div className="space-y-2">
                    {[
                      'Higher absolute returns in rising markets',
                      'Full compounding from day one',
                      'Better for deploying windfall income',
                      'Simpler execution (one-time decision)',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ INTERNAL LINKS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-primary-700 mb-6">Compare & Calculate</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/sip-vs-lumpsum" className="card-base p-5 hover-lift group">
                <Scale className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP vs Lumpsum Calculator
                </h3>
                <p className="text-xs text-slate-500">Side-by-side return comparison</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/research/historical-returns" className="card-base p-5 hover-lift group">
                <BarChart3 className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Historical Returns
                </h3>
                <p className="text-xs text-slate-500">How SIP performed over the decades</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/sip" className="card-base p-5 hover-lift group">
                <Calculator className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate your SIP growth projections</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-primary-700 mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-sm">Common questions about SIP vs lump sum investing</p>
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

      {/* ═══════════ CTA ═══════════ */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Not Sure Which Strategy to Choose?
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Our advisors can help you create a personalized investment plan that combines
            SIP and lump sum strategies based on your unique financial situation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <TrendingUp className="w-5 h-5" />
              Start SIP Now
            </a>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I need help deciding between SIP and lump sum. Please advise.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Talk to Advisor
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <section className="bg-surface-100 py-6">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.mutual_fund}{' '}
              {DISCLAIMER.general} | {COMPANY.mfEntity.name} | {COMPANY.mfEntity.amfiArn}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
