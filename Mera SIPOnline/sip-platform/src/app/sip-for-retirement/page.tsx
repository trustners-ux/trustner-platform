import { Metadata } from 'next';
import Link from 'next/link';
import {
  Landmark, ChevronRight, BookOpen, Calculator, ArrowRight,
  CheckCircle2, TrendingUp, MessageCircle, Clock,
  Target, IndianRupee, ShieldCheck, BarChart3,
  Lightbulb, AlertTriangle, Wallet, Hourglass,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP for Retirement Planning: Build Your Retirement Corpus | Mera SIP',
  description:
    'Plan your retirement with SIP. Learn how to calculate your retirement corpus, the power of starting early, fund selection strategies, and how SWP provides post-retirement income.',
  path: '/sip-for-retirement',
  keywords: [
    'SIP for retirement',
    'retirement planning SIP',
    'retirement corpus',
    'retirement SIP calculator',
    'how to plan retirement with SIP',
    'SWP for retirement',
    'retirement investment plan',
  ],
});

const faqs = [
  {
    question: 'How much retirement corpus do I need?',
    answer:
      'A commonly used rule of thumb is the 25x rule: multiply your expected annual expenses at retirement by 25. For example, if you expect to need \u20B91 lakh per month (\u20B912 lakh per year) at retirement, you need approximately \u20B93 crore as your corpus. This assumes a safe withdrawal rate of 4% per year. However, the exact amount depends on inflation, your lifestyle, healthcare costs, and life expectancy.',
  },
  {
    question: 'What is the ideal age to start a retirement SIP?',
    answer:
      'The ideal time to start is as early as possible \u2014 ideally in your 20s when you begin earning. Starting at age 25 vs 35 can make a massive difference due to the power of compounding over an extra decade. However, it is never too late to start. Even if you are 40 or 45, a well-planned SIP with a step-up strategy can still build a substantial retirement corpus.',
  },
  {
    question: 'Should I invest only in equity SIP for retirement?',
    answer:
      'Not entirely. A common strategy is to start with a higher equity allocation (70-80%) when you are young and gradually shift to debt funds as you approach retirement. This is called a glide path strategy. In your 20s-30s, equity-heavy SIPs maximize growth. By your 50s, start moving to balanced and debt funds to protect the corpus from market volatility near retirement.',
  },
  {
    question: 'What is SWP and how does it provide retirement income?',
    answer:
      'SWP (Systematic Withdrawal Plan) is the reverse of SIP. After retirement, you keep your corpus invested in a mutual fund and withdraw a fixed amount every month. The remaining corpus continues to earn returns. For example, a \u20B93 crore corpus in a fund earning 8% can provide approximately \u20B92 lakh per month through SWP while the corpus lasts for 25+ years.',
  },
  {
    question: 'Can NPS and SIP work together for retirement?',
    answer:
      'Yes, combining NPS (National Pension System) and mutual fund SIPs is a popular retirement strategy. NPS offers additional tax deduction of \u20B950,000 under Section 80CCD(1B) and has low fund management charges. However, NPS has restrictions on withdrawal and mandatory annuity purchase at retirement. Mutual fund SIPs offer more flexibility. A balanced approach might allocate 30-40% to NPS for tax benefits and 60-70% to mutual fund SIPs for flexibility.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'SIP for Retirement', url: '/sip-for-retirement' },
];

export default function SIPForRetirementPage() {
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
            <span className="text-primary-700 font-medium">SIP for Retirement</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Landmark className="w-3.5 h-3.5 text-accent" />
              <span>Retirement Planning</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP for Retirement:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Build Your Corpus
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Retirement may seem far away, but the earlier you start investing through SIP,
              the less you need to invest each month. Learn how to plan a financially
              independent retirement.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            {/* Why Start Early */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Why Starting Your Retirement SIP Early Matters
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  The single most powerful factor in retirement planning is <strong className="text-primary-700">time</strong>.
                  Thanks to compound interest, even small amounts invested early can grow into substantial
                  wealth over decades. The difference between starting at age 25 versus 35 is not just
                  10 years of extra investing &mdash; it is an exponentially larger corpus due to compounding.
                </p>
              </div>

              <div className="card-base p-6 mt-6 mb-6 border-l-4 border-l-brand">
                <h3 className="font-bold text-primary-700 mb-4">The Power of Starting Early: Age 25 vs Age 35</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-positive-50 rounded-lg p-5">
                    <h4 className="font-bold text-positive mb-2">Starting at Age 25</h4>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>Monthly SIP: {'\u20B9'}10,000</p>
                      <p>Duration: 35 years (till age 60)</p>
                      <p>Total Invested: {'\u20B9'}42,00,000</p>
                      <p>Expected Return: 12% p.a.</p>
                      <p className="font-bold text-positive text-lg mt-2">
                        Corpus: ~{'\u20B9'}6.49 Crore
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-5">
                    <h4 className="font-bold text-amber-600 mb-2">Starting at Age 35</h4>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>Monthly SIP: {'\u20B9'}10,000</p>
                      <p>Duration: 25 years (till age 60)</p>
                      <p>Total Invested: {'\u20B9'}30,00,000</p>
                      <p>Expected Return: 12% p.a.</p>
                      <p className="font-bold text-amber-600 text-lg mt-2">
                        Corpus: ~{'\u20B9'}1.90 Crore
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4 bg-brand-50 rounded-lg p-3">
                  <strong className="text-primary-700">Impact:</strong> Starting just 10 years earlier
                  with the same monthly amount results in a corpus that is more than 3.4 times larger.
                  The extra {'\u20B9'}12 lakh invested (10 extra years x {'\u20B9'}1.2L/year) generates an
                  additional {'\u20B9'}4.59 crore through the power of compounding.
                </p>
              </div>
            </div>

            {/* How Much Corpus */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                How Much Retirement Corpus Do You Need?
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Estimating your retirement corpus is the first critical step. The widely used
                  <strong className="text-primary-700"> 25x rule</strong> provides a solid starting point:
                  multiply your expected annual expenses at retirement by 25. This is based on the
                  4% safe withdrawal rate theory, which suggests you can withdraw 4% of your corpus
                  annually without depleting it over a 30-year retirement.
                </p>
              </div>

              <div className="card-base p-6 mt-6">
                <h3 className="font-bold text-primary-700 mb-4">Corpus Estimation Framework</h3>
                <div className="space-y-4">
                  {[
                    {
                      step: '1',
                      title: 'Estimate your current monthly expenses',
                      desc: 'Include all living expenses: housing, food, utilities, healthcare, entertainment, travel. A typical middle-class family might spend \u20B950,000-\u20B975,000 per month today.',
                    },
                    {
                      step: '2',
                      title: 'Adjust for inflation',
                      desc: 'At 6% inflation, today\'s \u20B950,000/month becomes approximately \u20B91.6 lakh/month in 20 years or \u20B92.87 lakh/month in 30 years. Inflation is the silent eroder of purchasing power.',
                    },
                    {
                      step: '3',
                      title: 'Apply the 25x multiplier',
                      desc: 'If your inflation-adjusted monthly expense at retirement is \u20B92 lakh (\u20B924 lakh/year), your target corpus is \u20B924L x 25 = \u20B96 crore.',
                    },
                    {
                      step: '4',
                      title: 'Factor in healthcare and contingencies',
                      desc: 'Add 15-20% buffer for unexpected medical expenses and emergencies. Health insurance premiums also increase significantly with age. Your final target might be \u20B97-7.5 crore.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-700 text-sm">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculating Monthly SIP */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Calculating Your Monthly SIP for Retirement
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-6">
                <p>
                  Once you know your target corpus, you can calculate the required monthly SIP.
                  The key variables are your target amount, expected rate of return, and the number
                  of years until retirement. Here is an illustrative guide:
                </p>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-primary-700 text-white">
                      <th className="text-left p-3 font-semibold rounded-tl-lg">Target Corpus</th>
                      <th className="text-center p-3 font-semibold">20 Years</th>
                      <th className="text-center p-3 font-semibold">25 Years</th>
                      <th className="text-center p-3 font-semibold rounded-tr-lg">30 Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { target: '\u20B92 Crore', y20: '\u20B920,100', y25: '\u20B910,600', y30: '\u20B95,700' },
                      { target: '\u20B95 Crore', y20: '\u20B950,200', y25: '\u20B926,600', y30: '\u20B914,200' },
                      { target: '\u20B910 Crore', y20: '\u20B91,00,400', y25: '\u20B953,200', y30: '\u20B928,300' },
                    ].map((row, i) => (
                      <tr key={row.target} className={i % 2 === 0 ? 'bg-surface-100' : 'bg-white'}>
                        <td className="p-3 font-semibold text-primary-700">{row.target}</td>
                        <td className="p-3 text-center text-slate-600">{row.y20}/month</td>
                        <td className="p-3 text-center text-slate-600">{row.y25}/month</td>
                        <td className="p-3 text-center text-slate-600">{row.y30}/month</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> The above table assumes 12% annual returns, which is a
                    reasonable long-term equity return expectation. Actual returns will vary. Use a
                    step-up SIP to increase your investment as income grows, which significantly
                    reduces the required starting amount.
                  </p>
                </div>
              </div>
            </div>

            {/* Fund Selection */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Fund Selection Strategy for Retirement
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Your mutual fund selection should evolve as you move through different life stages.
                This is known as the &ldquo;glide path&rdquo; approach:
              </p>

              <div className="space-y-4">
                {[
                  {
                    age: 'Age 25-35',
                    title: 'Aggressive Growth Phase',
                    equity: '80%',
                    debt: '20%',
                    desc: 'Maximum equity allocation for growth. Focus on flexi-cap, mid-cap, and small-cap funds for higher return potential. Time is on your side to recover from market corrections.',
                    color: 'border-l-brand bg-brand-50/30',
                  },
                  {
                    age: 'Age 35-45',
                    title: 'Balanced Growth Phase',
                    equity: '70%',
                    debt: '30%',
                    desc: 'Gradually introduce large-cap and balanced funds. Begin building a debt component. Continue with equity-heavy portfolio but start moderating risk exposure.',
                    color: 'border-l-teal-500 bg-teal-50/30',
                  },
                  {
                    age: 'Age 45-55',
                    title: 'Capital Preservation Phase',
                    equity: '50%',
                    debt: '50%',
                    desc: 'Shift significantly towards large-cap equity and debt funds. The focus moves from aggressive growth to protecting the accumulated corpus while maintaining moderate growth.',
                    color: 'border-l-amber-500 bg-amber-50/30',
                  },
                  {
                    age: 'Age 55-60',
                    title: 'Pre-Retirement Phase',
                    equity: '30%',
                    debt: '70%',
                    desc: 'Maximize stability with debt-heavy allocation. Move to conservative hybrid, corporate bond, and short-duration debt funds. Protect the corpus from last-minute market crashes.',
                    color: 'border-l-secondary-500 bg-secondary-50/30',
                  },
                ].map((phase) => (
                  <div key={phase.age} className={`card-base p-5 border-l-4 ${phase.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-primary-700">{phase.age}: {phase.title}</h3>
                      <div className="text-xs font-semibold text-slate-500">
                        Equity {phase.equity} | Debt {phase.debt}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{phase.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SWP for Post-Retirement */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                SWP: Creating Post-Retirement Monthly Income
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  After building your retirement corpus through SIP, the next question is: how do I
                  generate regular income from it? This is where <strong className="text-primary-700">SWP
                  (Systematic Withdrawal Plan)</strong> comes in.
                </p>
                <p>
                  SWP is the reverse of SIP. You keep your retirement corpus invested in a mutual fund
                  (typically a conservative hybrid or balanced advantage fund) and set up automatic monthly
                  withdrawals. The remaining corpus continues to earn returns, potentially allowing your
                  money to last through a 25-30 year retirement.
                </p>
              </div>

              <div className="card-base p-6 mt-6 border-l-4 border-l-positive">
                <h3 className="font-bold text-primary-700 mb-3">How SWP Works in Retirement</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-surface-100 rounded-lg p-4 text-center">
                    <Wallet className="w-8 h-8 text-brand mx-auto mb-2" />
                    <div className="text-sm font-semibold text-primary-700">Corpus Remains Invested</div>
                    <p className="text-xs text-slate-500 mt-1">Your money continues earning 7-10% returns in balanced funds</p>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-4 text-center">
                    <IndianRupee className="w-8 h-8 text-brand mx-auto mb-2" />
                    <div className="text-sm font-semibold text-primary-700">Monthly Withdrawals</div>
                    <p className="text-xs text-slate-500 mt-1">Receive a fixed amount automatically every month into your bank</p>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-4 text-center">
                    <Hourglass className="w-8 h-8 text-brand mx-auto mb-2" />
                    <div className="text-sm font-semibold text-primary-700">Corpus Longevity</div>
                    <p className="text-xs text-slate-500 mt-1">Designed to last 25-30 years when withdrawal rate is sustainable</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Study */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Case Study: {'\u20B9'}10,000/Month SIP for 25 Years
              </h2>
              <div className="card-base p-6 bg-gradient-to-br from-brand-50/50 to-white">
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-primary-700 text-sm mb-2">Investment Phase (SIP)</h4>
                      <div className="space-y-1.5 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Monthly SIP:</span>
                          <span className="font-semibold">{'\u20B9'}10,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-semibold">25 years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expected Return:</span>
                          <span className="font-semibold">12% p.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Invested:</span>
                          <span className="font-semibold">{'\u20B9'}30,00,000</span>
                        </div>
                        <div className="flex justify-between border-t border-surface-200 pt-1.5 mt-1.5">
                          <span className="font-semibold text-primary-700">Estimated Corpus:</span>
                          <span className="font-bold text-brand text-lg">{'\u20B9'}1.90 Crore</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-700 text-sm mb-2">Withdrawal Phase (SWP)</h4>
                      <div className="space-y-1.5 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Corpus at Retirement:</span>
                          <span className="font-semibold">{'\u20B9'}1.90 Crore</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Post-Retirement Return:</span>
                          <span className="font-semibold">8% p.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Withdrawal:</span>
                          <span className="font-semibold">{'\u20B9'}1,20,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Withdrawal Duration:</span>
                          <span className="font-semibold">25+ years</span>
                        </div>
                        <div className="flex justify-between border-t border-surface-200 pt-1.5 mt-1.5">
                          <span className="font-semibold text-primary-700">Total Withdrawn:</span>
                          <span className="font-bold text-positive text-lg">{'\u20B9'}3.6+ Crore</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600">
                        <strong className="text-primary-700">Key Insight:</strong> By investing {'\u20B9'}30 lakh
                        over 25 years through SIP, you build a corpus of {'\u20B9'}1.9 crore. This corpus then
                        provides {'\u20B9'}1.2 lakh monthly income for 25+ years through SWP, totaling over
                        {'\u20B9'}3.6 crore in withdrawals. The magic of compounding turns {'\u20B9'}30 lakh
                        into a lifetime of financial independence.
                      </p>
                    </div>
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
            <h2 className="text-xl font-bold text-primary-700 mb-6">Plan Your Retirement</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/retirement" className="card-base p-5 hover-lift group">
                <Calculator className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Retirement Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate your exact retirement SIP requirement</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/swp" className="card-base p-5 hover-lift group">
                <Wallet className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SWP Calculator
                </h3>
                <p className="text-xs text-slate-500">Plan your post-retirement monthly income</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/calculators/life-stage" className="card-base p-5 hover-lift group">
                <BarChart3 className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Life-Stage Planner
                </h3>
                <p className="text-xs text-slate-500">Invest, grow, and withdraw lifecycle planning</p>
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
              <p className="text-slate-500 text-sm">Common questions about retirement planning with SIP</p>
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
            Start Building Your Retirement Corpus Today
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Every day you delay costs you lakhs in potential compounding gains.
            Start your retirement SIP now and secure your financial independence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <TrendingUp className="w-5 h-5" />
              Start Retirement SIP
            </a>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I want to plan my retirement through SIP. Please help me calculate my requirements.')}`}
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
