import { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap, ChevronRight, BookOpen, Calculator, ArrowRight,
  CheckCircle2, AlertTriangle, TrendingUp, Target, IndianRupee,
  MessageCircle, Clock, ShieldCheck, BarChart3, Lightbulb, Users,
  XCircle, Zap,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP for Beginners: How to Start Your First SIP Investment | Mera SIP',
  description:
    'Complete beginner guide to SIP investing. Learn how to start your first SIP, how much to invest, common mistakes to avoid, and the best fund types for beginners.',
  path: '/sip-for-beginners',
  keywords: [
    'SIP for beginners',
    'how to start SIP',
    'first SIP investment',
    'beginner SIP guide',
    'SIP investment for beginners',
    'how to invest in SIP',
    'SIP starting guide',
  ],
});

const faqs = [
  {
    question: 'How much money do I need to start my first SIP?',
    answer:
      'You can start a SIP with as little as \u20B9500 per month in most mutual fund schemes. Some funds even allow SIPs starting at \u20B9100. As a beginner, the key is to start early rather than wait to accumulate a large amount. You can always increase your SIP as your income grows.',
  },
  {
    question: 'Which is the best mutual fund for a first-time SIP investor?',
    answer:
      'For beginners, large-cap index funds (like Nifty 50 or Sensex index funds) are generally recommended as a starting point because they offer broad market exposure, lower costs, and eliminate fund manager risk. Balanced advantage or hybrid funds are also suitable as they automatically manage equity-debt allocation. Consult a financial advisor for personalized recommendations.',
  },
  {
    question: 'Is it safe to invest in SIP during a market crash?',
    answer:
      'Yes, continuing your SIP during a market downturn is actually beneficial. When markets fall, the NAV of your fund drops, which means your fixed SIP amount buys more units at lower prices. This is rupee cost averaging in action. Historically, investors who continued SIPs through market corrections saw better long-term returns than those who stopped and restarted.',
  },
  {
    question: 'What documents do I need to start a SIP?',
    answer:
      'To start a SIP in India, you need: (1) PAN card for KYC compliance, (2) Aadhaar card for identity verification, (3) Bank account details and a cancelled cheque for setting up auto-debit, (4) Passport-size photograph, and (5) Address proof. The entire KYC process can now be completed online through eKYC in just a few minutes.',
  },
  {
    question: 'Should I choose a direct plan or regular plan SIP as a beginner?',
    answer:
      'Regular plans are recommended for beginners because they come with advisor support and guidance. While direct plans have a lower expense ratio (by 0.5-1%), beginners benefit greatly from having a qualified mutual fund distributor who can help with fund selection, goal planning, portfolio review, and behavioral coaching during market volatility. The advisory value often exceeds the cost difference.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'SIP for Beginners', url: '/sip-for-beginners' },
];

export default function SIPForBeginnersPage() {
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
            <span className="text-primary-700 font-medium">SIP for Beginners</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <GraduationCap className="w-3.5 h-3.5 text-accent" />
              <span>Beginner&apos;s Guide</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP for Beginners:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Start Your First SIP
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              New to investing? SIP is the perfect starting point. Learn the step-by-step
              process to set up your first SIP, decide how much to invest, and avoid
              common beginner mistakes.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            {/* Why SIP is Perfect for Beginners */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Why SIP is Perfect for Beginners
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  If you are new to investing, the stock market can seem intimidating. Which stocks to buy?
                  When to enter? How to handle a crash? SIP eliminates most of these worries by offering a
                  structured, automatic, and low-barrier entry into the world of mutual fund investing.
                </p>
                <p>
                  Unlike direct stock investing where you need market knowledge and constant monitoring, SIP
                  delegates the investment decisions to professional fund managers while you simply commit to
                  a regular investment amount. This makes it ideal for people who want to grow their wealth
                  but do not have the time or expertise to manage individual stocks.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: IndianRupee, title: 'Low Entry Barrier', desc: 'Start with just \u20B9500/month. No need for a large capital base to begin investing.' },
                  { icon: ShieldCheck, title: 'Professional Management', desc: 'Expert fund managers handle your money. You do not need to pick individual stocks.' },
                  { icon: Clock, title: 'Set It & Forget It', desc: 'Auto-debit means your investments happen automatically. No manual effort needed each month.' },
                ].map((item) => (
                  <div key={item.title} className="card-base p-5 text-center hover-lift">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Step-by-Step Guide to Starting Your First SIP
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Follow these four simple steps to go from zero to your first SIP investment. The
                entire process can be completed online within 15-20 minutes.
              </p>

              <div className="space-y-6">
                {[
                  {
                    step: '1',
                    title: 'Complete Your KYC (One-Time Process)',
                    desc: 'KYC (Know Your Customer) is mandatory for all mutual fund investments in India. You need your PAN card, Aadhaar, and a bank account. The eKYC process is online and takes just a few minutes. Once done, your KYC is valid for all mutual fund investments across all fund houses.',
                    icon: CheckCircle2,
                    color: 'bg-brand',
                  },
                  {
                    step: '2',
                    title: 'Choose the Right Fund for Your Goal',
                    desc: 'As a beginner, stick to well-established fund categories. Large-cap index funds are the safest entry point into equities. If you want a balanced approach, consider hybrid or balanced advantage funds that automatically shift between equity and debt. Avoid sectoral or thematic funds until you gain more experience.',
                    icon: Target,
                    color: 'bg-teal-600',
                  },
                  {
                    step: '3',
                    title: 'Decide Your Monthly SIP Amount',
                    desc: 'A good starting point is 10-20% of your monthly take-home salary. If your salary is \u20B940,000, aim for \u20B94,000-\u20B98,000 in SIP. However, even \u20B91,000-\u20B92,000 is a solid start. The most important thing is to begin \u2014 you can always increase later using a step-up SIP strategy.',
                    icon: IndianRupee,
                    color: 'bg-amber-500',
                  },
                  {
                    step: '4',
                    title: 'Set Up Auto-Debit & Start Investing',
                    desc: 'Select your preferred SIP date (many investors choose the 1st, 5th, or 10th of the month \u2014 right after salary credit). Register a NACH/ECS mandate with your bank for auto-debit. Once set up, your SIP amount is automatically invested each month without any manual intervention.',
                    icon: Zap,
                    color: 'bg-secondary-500',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                      {item.step}
                    </div>
                    <div className="card-base p-5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className="w-5 h-5 text-brand" />
                        <h3 className="font-bold text-primary-700">{item.title}</h3>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How Much Should You Invest */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                How Much Should You Invest in SIP?
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-6">
                <p>
                  One of the most common questions beginners ask is: how much should I invest? The answer
                  depends on your income, expenses, and financial goals. Here are some practical guidelines:
                </p>
              </div>

              <div className="card-base p-6 mb-6">
                <h3 className="font-bold text-primary-700 mb-4">The 50-30-20 Budgeting Rule</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-surface-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand">50%</div>
                    <div className="text-sm font-semibold text-primary-700 mt-1">Needs</div>
                    <p className="text-xs text-slate-500 mt-1">Rent, groceries, EMIs, insurance</p>
                  </div>
                  <div className="bg-surface-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">30%</div>
                    <div className="text-sm font-semibold text-primary-700 mt-1">Wants</div>
                    <p className="text-xs text-slate-500 mt-1">Entertainment, dining, shopping</p>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-4 text-center border-2 border-brand-200">
                    <div className="text-2xl font-bold text-brand">20%</div>
                    <div className="text-sm font-semibold text-primary-700 mt-1">Savings & SIP</div>
                    <p className="text-xs text-slate-500 mt-1">At least 10-20% towards SIP investments</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-50 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 font-semibold mb-1">Practical Tip</p>
                    <p className="text-sm text-slate-600">
                      If {'\u20B9'}500/month is all you can start with, that is perfectly fine. The habit of
                      investing regularly matters more than the amount. A {'\u20B9'}500 monthly SIP at 12%
                      return for 30 years grows to approximately {'\u20B9'}17.6 lakh &mdash; that is the power
                      of starting early and staying consistent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Mistakes */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Common Mistakes Beginners Make
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Avoid these pitfalls that many first-time SIP investors fall into:
              </p>

              <div className="space-y-4">
                {[
                  {
                    mistake: 'Stopping SIP during market dips',
                    fix: 'Market dips are actually when SIP works best. You buy more units at lower prices. Continuing through volatility is what makes SIP powerful. Stopping and restarting defeats the purpose of rupee cost averaging.',
                  },
                  {
                    mistake: 'Chasing past returns when selecting funds',
                    fix: 'A fund that returned 50% last year may not repeat that performance. Look at consistent 5-10 year track records, fund category, expense ratio, and fund house reputation instead of just recent returns.',
                  },
                  {
                    mistake: 'Investing without a clear goal',
                    fix: 'Every SIP should be linked to a specific goal with a target amount and timeline. Goal-based investing helps you choose the right fund category and stay committed during market fluctuations.',
                  },
                  {
                    mistake: 'Having too many SIPs across too many funds',
                    fix: 'Over-diversification dilutes returns. For beginners, 2-3 well-chosen funds covering different categories (large-cap, flexi-cap, hybrid) are sufficient. Adding more funds does not necessarily reduce risk.',
                  },
                  {
                    mistake: 'Redeeming too early before goals are met',
                    fix: 'SIPs need time to deliver compounding benefits. Withdrawing in 1-2 years rarely gives meaningful returns. Equity SIPs should ideally run for at least 5-7 years to achieve their potential.',
                  },
                ].map((item, index) => (
                  <div key={index} className="card-base p-5">
                    <div className="flex items-start gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-negative shrink-0 mt-0.5" />
                      <h3 className="font-bold text-primary-700 text-sm">{item.mistake}</h3>
                    </div>
                    <div className="flex items-start gap-3 ml-8">
                      <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-500 leading-relaxed">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Funds for Beginners */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Best Fund Categories for SIP Beginners
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                While specific fund recommendations should come from a qualified advisor based on your
                individual situation, here are the fund categories generally considered suitable for beginners:
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Large Cap / Index Funds',
                    risk: 'Moderate',
                    riskColor: 'text-amber-600 bg-amber-50',
                    desc: 'Invest in top 100 companies (Nifty 50, Sensex). Lowest risk in equity category. Index funds track the market passively with minimal expense ratios. Best for absolute beginners.',
                    ideal: '3+ years horizon',
                  },
                  {
                    title: 'Balanced Advantage Funds',
                    risk: 'Moderate-Low',
                    riskColor: 'text-positive bg-positive-50',
                    desc: 'Automatically balance between equity and debt based on market conditions. Built-in risk management reduces volatility. Good for investors who want exposure to equities but with a safety cushion.',
                    ideal: '3-5 years horizon',
                  },
                  {
                    title: 'Flexi Cap Funds',
                    risk: 'Moderate-High',
                    riskColor: 'text-secondary bg-secondary-50',
                    desc: 'Invest across large, mid, and small cap stocks as the fund manager sees fit. Offer diversification across market segments. Suitable once you are comfortable with basic market movements.',
                    ideal: '5+ years horizon',
                  },
                ].map((fund) => (
                  <div key={fund.title} className="card-base p-5 hover-lift">
                    <h3 className="font-bold text-primary-700 text-sm mb-2">{fund.title}</h3>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${fund.riskColor} mb-3`}>
                      Risk: {fund.risk}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{fund.desc}</p>
                    <div className="text-xs text-brand font-semibold">
                      Ideal: {fund.ideal}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Important:</strong> The above are general fund categories, not specific fund
                    recommendations. Past performance of any fund does not guarantee future results. Please
                    consult a qualified financial advisor before making investment decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Monitoring Your SIP */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Monitoring Your SIP: What to Do (and Not Do)
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Once your SIP is running, resist the urge to check it daily. Markets fluctuate, and
                  daily monitoring creates unnecessary anxiety. Here is a healthy monitoring approach:
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="card-base p-5">
                  <h3 className="font-bold text-positive text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Do This
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Review portfolio once every quarter (every 3 months)',
                      'Compare fund performance against its benchmark, not other fund categories',
                      'Increase SIP amount annually as your income grows (step-up SIP)',
                      'Rebalance between equity and debt once a year if needed',
                      'Stay invested for the full duration of your goal timeline',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-positive shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-base p-5">
                  <h3 className="font-bold text-negative text-sm mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Avoid This
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Checking NAV and returns every day or week',
                      'Stopping SIP during market downturns out of fear',
                      'Switching funds frequently based on short-term performance',
                      'Comparing your equity SIP returns with FD rates in short periods',
                      'Making emotional decisions based on market news or social media tips',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                        <XCircle className="w-3.5 h-3.5 text-negative shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
            <h2 className="text-xl font-bold text-primary-700 mb-6">Continue Learning</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/sip" className="card-base p-5 hover-lift group">
                <Calculator className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">See how much your SIP can grow over time</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/what-is-sip" className="card-base p-5 hover-lift group">
                <BookOpen className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  What is SIP?
                </h3>
                <p className="text-xs text-slate-500">Deep dive into SIP concepts and mechanics</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/learn" className="card-base p-5 hover-lift group">
                <GraduationCap className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  Learning Modules
                </h3>
                <p className="text-xs text-slate-500">Structured courses on SIP and mutual funds</p>
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
              <p className="text-slate-500 text-sm">Common questions from first-time SIP investors</p>
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
            Take the First Step Today
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Every successful investor started somewhere. Begin your SIP journey now
            and let the power of compounding work for you over the years.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <TrendingUp className="w-5 h-5" />
              Start Your First SIP
            </a>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I am a beginner and want to start my first SIP. Please guide me.')}`}
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
