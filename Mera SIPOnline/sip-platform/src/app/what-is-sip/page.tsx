import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, Repeat, ShieldCheck, Zap, Clock, IndianRupee,
  ArrowRight, ChevronRight, CheckCircle2, BookOpen, Calculator,
  MessageCircle, Users, Target, BarChart3, Layers,
} from 'lucide-react';
import { generateSEOMetadata, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

export const metadata: Metadata = generateSEOMetadata({
  title: 'What is SIP? Complete Guide to Systematic Investment Plans | Mera SIP',
  description:
    'Learn what SIP (Systematic Investment Plan) is, how it works, key benefits like compounding and rupee cost averaging, types of SIP, and how to start your first SIP investment.',
  path: '/what-is-sip',
  keywords: [
    'what is SIP',
    'SIP meaning',
    'SIP full form',
    'systematic investment plan',
    'SIP investment',
    'how does SIP work',
    'benefits of SIP',
    'types of SIP',
  ],
});

const faqs = [
  {
    question: 'What is the full form of SIP?',
    answer:
      'SIP stands for Systematic Investment Plan. It is a method of investing a fixed amount regularly (usually monthly) into a mutual fund scheme. SIP allows investors to build wealth gradually through disciplined, periodic investments rather than investing a large sum at once.',
  },
  {
    question: 'What is the minimum amount required to start a SIP?',
    answer:
      'Most mutual fund houses in India allow you to start a SIP with as little as \u20B9500 per month. Some funds even offer SIPs starting at \u20B9100. This low entry barrier makes SIP accessible to virtually everyone, including students and early-career professionals.',
  },
  {
    question: 'Is SIP risk-free?',
    answer:
      'No, SIP investments in mutual funds are subject to market risks. However, SIP reduces timing risk through rupee cost averaging \u2014 you buy more units when prices are low and fewer when prices are high. Over the long term (7+ years), equity SIPs have historically delivered inflation-beating returns, but past performance does not guarantee future results.',
  },
  {
    question: 'Can I stop or pause my SIP anytime?',
    answer:
      'Yes, you can stop or pause your SIP at any time without any penalty. There is no lock-in period for regular mutual fund SIPs (except ELSS funds which have a 3-year lock-in). You can also modify your SIP amount, change the date, or switch to a different fund as your financial situation evolves.',
  },
  {
    question: 'What is the difference between SIP and mutual fund?',
    answer:
      'A mutual fund is an investment product that pools money from many investors to invest in stocks, bonds, or other securities. SIP is a method or mode of investing in mutual funds. You can invest in mutual funds either through SIP (regular fixed installments) or through lump sum (one-time investment). SIP is the route; mutual fund is the vehicle.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'What is SIP?', url: '/what-is-sip' },
];

export default function WhatIsSIPPage() {
  const faqSchema = generateFAQSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* JSON-LD Schemas */}
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
            <span className="text-primary-700 font-medium">What is SIP?</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Complete Guide</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              What is SIP?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Systematic Investment Plan
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              SIP is the smartest way to invest in mutual funds. Learn how SIP works,
              why millions of Indians use it, and how you can start building wealth
              with as little as {'\u20B9'}500 per month.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">

            {/* What is SIP */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                What is SIP (Systematic Investment Plan)?
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  A <strong className="text-primary-700">Systematic Investment Plan (SIP)</strong> is a
                  disciplined method of investing a fixed amount of money at regular intervals &mdash;
                  typically monthly &mdash; into a mutual fund scheme. Instead of trying to time the market
                  with a large one-time investment, SIP allows you to invest small, consistent amounts over
                  time, making wealth creation accessible to everyone.
                </p>
                <p>
                  Think of SIP as a recurring deposit for mutual funds. Just as you set aside money every
                  month in a bank RD, a SIP automatically invests your chosen amount into your selected
                  mutual fund on a predetermined date each month. The amount is auto-debited from your bank
                  account, making the process completely seamless.
                </p>
                <p>
                  In India, SIP has become the most popular way to invest in mutual funds. According to
                  AMFI data, monthly SIP contributions have crossed {'\u20B9'}20,000 crore, with over 8.5 crore
                  active SIP accounts. This growth reflects the trust that Indian investors place in the
                  SIP approach to long-term wealth building.
                </p>
              </div>
            </div>

            {/* How Does SIP Work */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                How Does SIP Work?
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                The SIP mechanism is straightforward. Once you set up a SIP, here is what happens
                every month automatically:
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    step: '1',
                    icon: IndianRupee,
                    title: 'Auto-Debit',
                    desc: 'A fixed amount is debited from your bank account on your chosen SIP date each month.',
                  },
                  {
                    step: '2',
                    icon: BarChart3,
                    title: 'NAV-Based Allocation',
                    desc: 'Your money buys mutual fund units at the current Net Asset Value (NAV) of the scheme.',
                  },
                  {
                    step: '3',
                    icon: Layers,
                    title: 'Units Accumulate',
                    desc: 'Each month you accumulate more units. When NAV is low, you get more units; when high, fewer units.',
                  },
                  {
                    step: '4',
                    icon: TrendingUp,
                    title: 'Wealth Grows',
                    desc: 'Over time, your accumulated units grow in value as the underlying investments appreciate.',
                  },
                ].map((item) => (
                  <div key={item.step} className="card-base p-5 text-center hover-lift">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 text-sm font-bold text-brand">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-brand mx-auto mb-2" />
                    <h3 className="font-bold text-primary-700 text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand-50 rounded-lg p-5">
                <p className="text-sm text-slate-700">
                  <strong className="text-primary-700">Example:</strong> If you invest {'\u20B9'}10,000 per month
                  and the fund NAV is {'\u20B9'}50, you get 200 units. Next month, if NAV drops to {'\u20B9'}40,
                  the same {'\u20B9'}10,000 buys 250 units. Over time, this averaging effect (called rupee cost averaging)
                  works in your favor by reducing the average purchase cost of your units.
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Key Benefits of SIP
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                SIP offers several powerful advantages that make it the preferred investment
                method for both beginners and experienced investors:
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Power of Compounding',
                    desc: 'Your returns earn returns. A \u20B910,000 monthly SIP at 12% for 20 years grows to approximately \u20B91 crore, even though you invest only \u20B924 lakh. The remaining \u20B976 lakh is generated through compounding alone.',
                    color: 'bg-brand-50 text-brand',
                  },
                  {
                    icon: Repeat,
                    title: 'Rupee Cost Averaging',
                    desc: 'By investing a fixed amount regularly, you automatically buy more units when markets are down and fewer when markets are up. This averages out your purchase cost over time, reducing the impact of market volatility.',
                    color: 'bg-teal-50 text-teal-600',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Financial Discipline',
                    desc: 'SIP automates your investment habit. Since the amount is auto-debited each month, you build a consistent savings discipline without having to remember or actively decide to invest each time.',
                    color: 'bg-amber-50 text-amber-600',
                  },
                  {
                    icon: Zap,
                    title: 'Flexibility & Convenience',
                    desc: 'Start with as little as \u20B9500/month. Increase, decrease, pause, or stop anytime. No lock-in (except ELSS). Switch between funds freely. SIP adapts to your changing financial situation.',
                    color: 'bg-secondary-50 text-secondary-600',
                  },
                ].map((benefit) => (
                  <div key={benefit.title} className="card-base p-6 hover-lift">
                    <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-primary-700 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Types of SIP */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Types of SIP
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Mutual fund houses offer several variations of SIP to suit different investor needs
                and financial goals:
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Regular SIP',
                    desc: 'The standard SIP where you invest a fixed amount every month. This is the most common type and is ideal for beginners who want simplicity. The amount, date, and fund remain the same until you modify them.',
                  },
                  {
                    title: 'Step-Up SIP (Top-Up SIP)',
                    desc: 'This SIP automatically increases your investment amount at regular intervals (usually annually) by a fixed percentage or amount. For example, you can start at \u20B910,000/month and increase by 10% every year. This is ideal for salaried individuals whose income grows over time.',
                  },
                  {
                    title: 'Flexible SIP',
                    desc: 'Allows you to change your SIP amount based on your cash flow situation. If you receive a bonus or have extra funds, you can invest more. If money is tight, you can invest less. The fund house sets a minimum, but you can vary the amount each month.',
                  },
                  {
                    title: 'Perpetual SIP',
                    desc: 'A SIP with no end date. It continues indefinitely until you explicitly choose to stop it. Most SIPs are set with a specific tenure, but perpetual SIP is perfect for long-term goals like retirement where the investment horizon is decades away.',
                  },
                ].map((type, index) => (
                  <div key={type.title} className="flex items-start gap-4 card-base p-5">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-700 mb-1">{type.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{type.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Should Invest */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                Who Should Invest in SIP?
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                SIP is suitable for virtually every category of investor. Here is who benefits the most:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Users, text: 'Salaried professionals who earn a regular monthly income and can set aside a fixed amount' },
                  { icon: Target, text: 'Goal-oriented investors saving for specific targets like retirement, education, or a home purchase' },
                  { icon: Clock, text: 'First-time investors who want to start small and learn about mutual funds gradually' },
                  { icon: TrendingUp, text: 'Long-term wealth builders who understand that patience and consistency are the keys to compounding' },
                  { icon: ShieldCheck, text: 'Risk-conscious investors who prefer averaging out market volatility rather than timing the market' },
                  { icon: Zap, text: 'Busy professionals who want a set-it-and-forget-it approach to investing with auto-debit convenience' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 bg-surface-100 rounded-lg p-4">
                    <item.icon className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Start */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                How to Start Your First SIP
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Starting a SIP is straightforward and can be completed entirely online. Follow these steps:
              </p>

              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Complete Your KYC',
                    desc: 'KYC (Know Your Customer) is a one-time verification process required by SEBI. You need your PAN card, Aadhaar, and bank details. eKYC can be done online in minutes.',
                  },
                  {
                    step: '2',
                    title: 'Choose Your Mutual Fund',
                    desc: 'Select a fund based on your goal, risk appetite, and investment horizon. For beginners, large-cap index funds or balanced advantage funds are generally recommended as starting points.',
                  },
                  {
                    step: '3',
                    title: 'Decide Your SIP Amount',
                    desc: 'Start with an amount you can comfortably invest every month. A good rule of thumb is 10-20% of your monthly income. You can always increase later with a step-up SIP.',
                  },
                  {
                    step: '4',
                    title: 'Set Up Auto-Debit & Start',
                    desc: 'Choose your SIP date, set up bank auto-debit (ECS/NACH mandate), and start your SIP. The investment will happen automatically each month without any manual intervention.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
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

      {/* ═══════════ INTERNAL LINKS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-primary-700 mb-6">Explore More</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/calculators/sip" className="card-base p-5 hover-lift group">
                <Calculator className="w-8 h-8 text-brand mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate your SIP returns with our free tool</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/learn" className="card-base p-5 hover-lift group">
                <BookOpen className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP Learning Modules
                </h3>
                <p className="text-xs text-slate-500">In-depth courses on SIP basics and strategies</p>
                <ArrowRight className="w-4 h-4 text-brand mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/sip-for-beginners" className="card-base p-5 hover-lift group">
                <Users className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-primary-700 text-sm mb-1 group-hover:text-brand transition-colors">
                  SIP for Beginners
                </h3>
                <p className="text-xs text-slate-500">Step-by-step guide to starting your first SIP</p>
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
              <p className="text-slate-500 text-sm">Common questions about Systematic Investment Plans</p>
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
            Ready to Start Your SIP Journey?
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who are building wealth through the discipline
            of Systematic Investment Plans. Start with as little as {'\u20B9'}500 per month.
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
              href={`https://wa.me/${COMPANY.contact.whatsapp?.replace('+', '') || '916003903737'}?text=${encodeURIComponent('Hi Trustner, I want to learn more about starting a SIP. Please guide me.')}`}
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
