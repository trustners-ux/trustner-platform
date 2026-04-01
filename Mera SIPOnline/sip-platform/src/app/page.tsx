'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calculator, ArrowRight, ChevronDown, TrendingUp, Target,
  Shield, Sparkles, IndianRupee, Star, Quote, Heart,
  Phone, UserCheck, LineChart, Headphones, MessageCircle,
  Building2, Users, CalendarCheck, MapPin, Brain,
  BarChart3, Repeat, Clock,
} from 'lucide-react';
import { calculateSIP } from '@/lib/utils/calculators';
import { formatINR } from '@/lib/utils/formatters';
import { AMCPartners } from '@/components/sections/AMCPartners';
import { ComplianceBanner } from '@/components/sections/ComplianceBanner';
import { ExitIntentPopup } from '@/components/sections/ExitIntentPopup';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import LeadershipCarousel from '@/components/ui/LeadershipCarousel';
import { generateFAQSchema } from '@/lib/seo';

/* ─── FAQ DATA (used for rendering AND schema) ─── */
const FAQS = [
  { question: 'What is SIP and how does it work?', answer: 'SIP (Systematic Investment Plan) is a method of investing a fixed amount regularly in mutual funds. It automates your investment through monthly auto-debit, helping you build wealth through rupee cost averaging and the power of compounding.' },
  { question: 'How much should I invest monthly in SIP?', answer: 'You can start with as little as \u20B9500/month. The ideal amount depends on your financial goals, income, and expenses. Use our Goal-Based SIP Calculator to find the exact monthly SIP needed for your target amount.' },
  { question: 'Is SIP safe? Can I lose money?', answer: 'SIP invests in mutual funds which are subject to market risks. However, SIP reduces risk through rupee cost averaging \u2014 you buy more units when markets are low and fewer when high. Over 10+ year periods, equity SIPs have historically delivered strong positive returns.' },
  { question: 'Can I stop or pause my SIP anytime?', answer: 'Yes, SIPs can be paused, stopped, or modified anytime without any penalty. There is no lock-in period for most SIPs (except ELSS which has a 3-year lock-in). Your invested money remains in the fund even if you stop future installments.' },
  { question: 'What returns can I expect from SIP?', answer: 'Returns depend on market conditions and the type of fund. Historically, equity mutual fund SIPs have delivered 12-15% annualized returns over 10+ year periods. Use our SIP Calculator to model different return scenarios.' },
  { question: 'How is MeraSIP different from Groww, Zerodha, or other apps?', answer: 'MeraSIP is a fintech-powered distribution platform \u2014 not just a transaction app. We provide personalized goal-based planning, risk profiling, dedicated relationship managers, ongoing portfolio reviews, and education-first approach. You get human guidance alongside technology.' },
  { question: 'Is MeraSIP free to use?', answer: 'All educational content, calculators, and learning modules on MeraSIP are completely free. For investments, standard mutual fund charges (expense ratio) apply as per the fund house. There are no additional charges from Trustner for SIP setup or transactions.' },
  { question: 'How do I start investing through MeraSIP?', answer: 'Click "Start SIP" to create your account through our secure platform powered by InvestWell. Complete your KYC (one-time process), choose your funds with our guidance, and start your SIP. Our team is available to help at every step.' },
];

const faqSchema = generateFAQSchema(FAQS);

/* ─── SIP Calculator Component ─── */
function SIPCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(12);

  const result = calculateSIP(monthly, rate, years);
  const multiplier = (result.totalValue / result.totalInvested).toFixed(1);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* Inputs */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Monthly Investment</span>
            <span className="font-bold text-primary-700">{formatINR(monthly)}</span>
          </div>
          <input type="range" min={500} max={100000} step={500} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="slider-input w-full" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>&#8377;500</span><span>&#8377;1,00,000</span></div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Investment Duration</span>
            <span className="font-bold text-primary-700">{years} Years</span>
          </div>
          <input type="range" min={1} max={40} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="slider-input w-full" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>1 Yr</span><span>40 Yrs</span></div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Expected Annual Return</span>
            <span className="font-bold text-primary-700">{rate}%</span>
          </div>
          <input type="range" min={1} max={25} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="slider-input w-full" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>1%</span><span>25%</span></div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-elevated p-6 lg:p-8 card-accent-border">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-100 rounded-xl p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Invested</div>
            <div className="text-lg font-bold text-primary-700 tabular-nums">{formatINR(result.totalInvested)}</div>
          </div>
          <div className="bg-surface-100 rounded-xl p-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Estimated Returns</div>
            <div className="text-lg font-bold text-positive tabular-nums">{formatINR(result.estimatedReturns)}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-brand-50 to-teal-50 rounded-xl p-5 mb-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Wealth Created</div>
          <div className="text-3xl font-extrabold gradient-text tabular-nums">{formatINR(result.totalValue)}</div>
          <div className="text-xs text-brand font-medium mt-1">
            Your money grows {multiplier}x in {years} years
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-sm py-3 text-center">
            Start This SIP Now <ArrowRight className="w-4 h-4 ml-1 inline" />
          </a>
          <Link href="/calculators/sip" className="btn-secondary flex-1 text-sm py-3 text-center">
            Explore Full Calculator
          </Link>
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-3">{DISCLAIMER.calculator}</p>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function HomePage() {
  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-mesh-dark animate-mesh-float" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.07]" />
        <div className="container-custom relative z-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5 text-xs font-medium mb-6 backdrop-blur-sm border border-white/10 shadow-lg">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Powered by Trustner Group &middot; Serving investors since 2014</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Start Your SIP.{' '}
              <span className="text-amber-400">Build Your Wealth.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              MeraSIP is a digital initiative of {COMPANY.mfEntity.name} &mdash;
              your trusted partner for goal-based SIP planning, risk profiling,
              and wealth creation. Backed by 100+ professionals across India.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <a href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25">
                <IndianRupee className="w-4 h-4" />
                Start SIP
              </a>
              <a href="#sip-calculator" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg">
                <Calculator className="w-4 h-4" />
                Calculate SIP
              </a>
            </div>

            {/* Trust Signals Row */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-300" />
                <span>AMFI Registered &middot; {COMPANY.mfEntity.amfiArn}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-300" />
                <span>10,000+ Clients Guided</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-300" />
                <span>5 Offices Across India</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. SIP CALCULATOR (Interactive) ═══════════ */}
      <section id="sip-calculator" className="section-padding bg-surface-100 bg-[radial-gradient(circle,rgba(15,118,110,0.06)_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="container-custom">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-2 text-xs font-semibold text-brand mb-4 border border-brand-200/50 shadow-sm">
              <Calculator className="w-3.5 h-3.5" />
              Interactive SIP Calculator
            </div>
            <h2 className="text-display-sm text-primary-700 mb-3">See How Your SIP Grows Over Time</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Adjust monthly investment, duration, and expected return to see your potential wealth creation</p>
          </div>
          <SIPCalculator />
        </div>
      </section>

      {/* ═══════════ 3. WHY SIP? (4-Block Visual) ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-primary-700 mb-3">Why SIP is the Smartest Way to Invest</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Four fundamental reasons why millions of Indians choose SIP</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: 'Power of Compounding',
                desc: 'Your returns earn returns. Small investments grow exponentially over time.',
                color: 'bg-brand-50 text-brand',
              },
              {
                icon: Repeat,
                title: 'Rupee Cost Averaging',
                desc: 'Buy more units when prices are low, fewer when high. Timing the market becomes irrelevant.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: CalendarCheck,
                title: 'Disciplined Investing',
                desc: 'Auto-debit ensures you invest consistently every month without emotional decisions.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: IndianRupee,
                title: 'Low Entry Barrier',
                desc: 'Start with as little as \u20B9500/month. No large lumpsum needed to begin your wealth journey.',
                color: 'bg-secondary-50 text-secondary-600',
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 rounded-2xl border border-surface-300/60 hover:border-brand-200 hover:shadow-card transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-primary-700 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. WHY MERASIP IS DIFFERENT ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-2 text-xs font-semibold text-brand mb-4 border border-brand-200/50 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Why MeraSIP
            </div>
            <h2 className="text-display-sm text-primary-700 mb-3">Why MeraSIP is Different</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">We are not just another DIY app. MeraSIP is a fintech-enabled distribution platform backed by professionals who care about your financial goals.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: UserCheck, title: 'Risk Profiling First', desc: 'We assess your risk appetite and time horizon before recommending any product. No one-size-fits-all approach.' },
              { icon: Target, title: 'Goal-Based Planning', desc: 'Every recommendation is tied to your specific goals \u2014 retirement, education, home, or wealth creation.' },
              { icon: LineChart, title: 'Portfolio Review Support', desc: 'Regular portfolio monitoring, rebalancing suggestions, and performance reviews \u2014 not just a one-time investment.' },
              { icon: Headphones, title: 'Human Advisor Access', desc: 'A dedicated relationship manager for all your queries. Reach out via phone, WhatsApp, or email anytime.' },
              { icon: Brain, title: 'AI-Assisted Insights', desc: 'Smart calculators, data-driven research tools, and AI-powered recommendations to help you invest better.' },
              { icon: Shield, title: 'AMFI Registered & Compliant', desc: 'Fully regulated by SEBI/AMFI (ARN-286886). Your investments are safe, transparent, and compliant.' },
            ].map((item) => (
              <div key={item.title} className="card-base p-6 hover-lift">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brand-50 to-teal-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-primary-700 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. ABOUT TRUSTNER (Authority Section) ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 text-xs font-semibold text-amber-700 mb-4 border border-amber-200/50 shadow-sm">
              <Building2 className="w-3.5 h-3.5" />
              About Trustner
            </div>
            <h2 className="text-display-sm text-primary-700 mb-3">Backed by Trustner Asset Services</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">MeraSIP is a digital initiative of {COMPANY.mfEntity.name} &mdash; a fintech-enabled financial services organization serving investors across India.</p>
          </div>

          {/* Authority Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            {[
              { value: '100+', label: 'Team Members', icon: Users },
              { value: 'Since 2014', label: 'Serving Investors', icon: CalendarCheck },
              { value: '5 Cities', label: 'Office Presence', icon: MapPin },
              { value: '10,000+', label: 'Clients Guided', icon: Heart },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-5 rounded-xl bg-surface-100 border border-surface-300/60">
                <stat.icon className="w-5 h-5 text-brand mx-auto mb-2" />
                <div className="text-xl font-extrabold text-primary-700">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Founder Message — expanded ── */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="grid md:grid-cols-[220px_1fr] gap-8 lg:gap-10 items-center bg-gradient-to-br from-brand-50/50 to-surface-100 rounded-2xl p-6 lg:p-10 border border-brand-100/50">
              {/* Photo + Name */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Image
                    src="/team/ram-shah.jpeg"
                    alt="Ram Shah — Founder & CEO, Trustner Group"
                    width={200}
                    height={200}
                    className="w-40 h-40 md:w-44 md:h-44 rounded-2xl object-cover object-top border-4 border-white shadow-elevated ring-1 ring-brand-100"
                  />
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap tracking-wide">
                    Dil Se Honest &bull; With You Always
                  </div>
                </div>
                <div className="mt-5">
                  <div className="font-bold text-primary-700 text-lg">Ram Shah</div>
                  <div className="text-xs text-brand font-medium">Founder &amp; CEO, Trustner Group</div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Quote className="w-6 h-6 text-brand-200 mb-3" />
                <blockquote className="text-base lg:text-lg text-slate-700 leading-relaxed italic mb-4 border-l-4 border-brand-300 pl-5">
                  &ldquo;I founded Trustner with a simple belief &mdash; every Indian family deserves honest financial guidance,
                  regardless of how much they invest. Whether it is Rs. 500 or Rs. 5 Crore, the trust a client places
                  in us is the same, and so is our commitment.&rdquo;
                </blockquote>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  At Trustner, we don&apos;t just manage investments &mdash; we align them with your life&apos;s goals. A child&apos;s education,
                  a comfortable retirement, a dream home &mdash; our role is to bridge the gap between where you are today
                  and where you want to be, with discipline, transparency, and a <strong className="text-primary-700">Client First</strong> approach.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Heart, text: 'Client First' },
                    { icon: Shield, text: 'Zero Hidden Charges' },
                    { icon: BarChart3, text: 'Education Before Selling' },
                  ].map((tag) => (
                    <span key={tag.text} className="inline-flex items-center gap-1.5 bg-white text-brand-700 text-[11px] font-semibold px-3 py-1 rounded-full border border-brand-100">
                      <tag.icon className="w-3 h-3" />
                      {tag.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Leadership Team Carousel ── */}
          <div className="max-w-5xl mx-auto mb-10">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-primary-700">The Leaders Behind Trustner</h3>
              <p className="text-xs text-slate-500 mt-1">200+ years of combined experience across financial services, insurance &amp; technology</p>
            </div>

            <LeadershipCarousel
              members={[
                { name: 'Ram Shah', role: 'CEO & Founder', experience: '23 Years', initials: 'RS', photo: '/team/ram-shah.jpeg', color: 'from-brand-400 to-brand-600' },
                { name: 'Sangeeta Shah', role: 'Co-Founder & COO', experience: '23 Years', initials: 'SS', color: 'from-teal-400 to-teal-600' },
                { name: 'Ajanta Saikia', role: 'Director & Principal Officer', experience: '23 Years', initials: 'AS', color: 'from-purple-400 to-purple-600' },
                { name: 'Abir Das', role: 'Addl. Director & CDO', experience: '23 Years', initials: 'AD', color: 'from-sky-400 to-sky-600' },
                { name: 'Bhola Singh', role: 'Leading GI Team', experience: '22 Years', initials: 'BS', color: 'from-amber-400 to-amber-600' },
                { name: 'Subhasish Kar', role: 'Institutional Sales', experience: '30 Years', initials: 'SK', color: 'from-emerald-400 to-emerald-600' },
                { name: 'Rafiquddin Ahmed', role: 'Consultant — GI Team', experience: '38 Years', initials: 'RA', color: 'from-rose-400 to-rose-600' },
                { name: 'Tamanna Somani', role: 'Head HNI Division', experience: '21 Years', initials: 'TS', color: 'from-violet-400 to-violet-600' },
                { name: 'Raju Chakraborty', role: 'Regional Manager North East', experience: '25 Years', initials: 'RC', color: 'from-cyan-400 to-cyan-600' },
              ]}
              visibleCount={4}
              interval={3000}
            />
          </div>

          {/* Know More CTA */}
          <div className="text-center">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-100 transition-colors border border-brand-200/50 shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Know More About Trustner Group
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Initiative Line */}
          <p className="text-center text-xs text-slate-400 mt-6">
            MeraSIP is a digital initiative of {COMPANY.mfEntity.name} &middot; {COMPANY.mfEntity.amfiArn} &middot; {COMPANY.mfEntity.cin}
          </p>
        </div>
      </section>

      {/* ═══════════ 5.5 FINANCIAL PLANNING CTA ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-teal-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.05]" />
        <div className="container-custom relative z-10 py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs font-semibold mb-5 backdrop-blur-sm border border-white/10">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>100% Free &middot; AI-Powered &middot; CFP-Grade Analysis</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
                Know Your{' '}
                <span className="text-amber-400">Financial Health Score</span>
              </h2>
              <p className="text-lg text-teal-100 leading-relaxed mb-6 max-w-xl">
                India&apos;s first free AI-powered financial wellness assessment. Answer 50+ questions,
                get a personalized score out of 900, and receive a detailed 10-page PDF report.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-4">
                <span className="flex items-center gap-1.5 text-sm text-teal-200">
                  <Clock className="w-3.5 h-3.5" /> 8-10 minutes
                </span>
                <span className="flex items-center gap-1.5 text-sm text-teal-200">
                  <Shield className="w-3.5 h-3.5" /> Data not stored
                </span>
                <span className="flex items-center gap-1.5 text-sm text-teal-200">
                  <Target className="w-3.5 h-3.5" /> Personalized insights
                </span>
              </div>
            </div>
            {/* Right CTA */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <div className="text-5xl font-extrabold text-amber-400 mb-1">742</div>
                <div className="text-sm text-teal-200 mb-1">out of 900</div>
                <div className="text-xs font-bold text-teal-100 bg-teal-700/50 rounded-full px-3 py-1">Good Financial Health</div>
              </div>
              <Link
                href="/financial-planning"
                className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25"
              >
                <Brain className="w-4 h-4" />
                Start Free Assessment
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 6. TESTIMONIALS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 text-xs font-semibold text-amber-700 mb-4 border border-amber-200/50 shadow-sm">
              <Heart className="w-3.5 h-3.5" />
              Trusted by 10,000+ Clients
            </div>
            <h2 className="text-display-sm text-primary-700 mb-3">What Our Clients Say</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Trust is the foundation of every relationship we build. Hear from investors across India.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                role: 'IT Professional',
                city: 'Bengaluru',
                gradient: 'from-pink-500 to-rose-600',
                gender: 'female' as const,
                text: 'The SIP calculators on Mera SIP helped me plan my daughter\'s education fund. The step-up SIP calculator showed me exactly how increasing my SIP by 10% annually would make a huge difference. Trustner team guided me through every step.',
              },
              {
                name: 'Rajesh Kalita',
                role: 'Business Owner',
                city: 'Guwahati',
                gradient: 'from-amber-500 to-orange-600',
                gender: 'male' as const,
                text: 'As a business owner, my income is irregular. Trustner helped me understand how to use SIP with flexible amounts. The Life-Stage calculator is brilliant \u2014 it showed me I don\'t need to invest forever, just smartly for a few years.',
              },
              {
                name: 'Anita & Deepak Verma',
                role: 'Working Couple',
                city: 'Delhi NCR',
                gradient: 'from-teal-500 to-teal-700',
                gender: 'couple' as const,
                text: 'We started our SIP journey with Trustner 5 years ago with just \u20B95,000 each. Today our combined portfolio has grown beautifully. The transparency and education-first approach is what sets them apart.',
              },
              {
                name: 'Dr. Manish Borgohain',
                role: 'Doctor',
                city: 'Jorhat',
                gradient: 'from-indigo-500 to-indigo-700',
                gender: 'male' as const,
                text: 'I had no knowledge of mutual funds before meeting Trustner. Their learning modules and personal guidance made me confident about investing. Now I recommend them to all my colleagues.',
              },
              {
                name: 'Sneha Patil',
                role: 'Teacher',
                city: 'Pune',
                gradient: 'from-purple-500 to-violet-700',
                gender: 'female' as const,
                text: 'What I love about Mera SIP is the education content. Before investing a single rupee, I understood SIP, compounding, and risk. The MCQ quizzes actually helped me retain what I learned.',
              },
              {
                name: 'Arun Choudhury',
                role: 'Retired Govt. Officer',
                city: 'Guwahati',
                gradient: 'from-rose-500 to-rose-700',
                gender: 'male' as const,
                text: 'After retirement, I was worried about managing my corpus. Trustner\'s SWP calculator and the Life-Stage planner helped me plan systematic withdrawals. My money is working for me now.',
              },
            ].map((t, idx) => (
              <div key={idx} className="card-base p-6 relative">
                <Quote className="w-8 h-8 text-brand-100 absolute top-4 right-4" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-surface-300/50">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white overflow-hidden`}>
                    <svg viewBox="0 0 40 40" className="w-full h-full">
                      {t.gender === 'female' && (
                        <g fill="white" fillOpacity="0.9">
                          <circle cx="20" cy="14" r="7" />
                          <ellipse cx="20" cy="9" rx="8" ry="5.5" />
                          <path d="M14 12 Q12 8 14 5 Q16 3 20 2 Q18 4 17 7 Q15 10 14 12Z" />
                          <path d="M26 12 Q28 8 26 5 Q24 3 20 2 Q22 4 23 7 Q25 10 26 12Z" />
                          <path d="M20 21 Q28 21 33 27 Q36 31 36 40L4 40Q4 31 7 27 Q12 21 20 21Z" />
                        </g>
                      )}
                      {t.gender === 'male' && (
                        <g fill="white" fillOpacity="0.9">
                          <circle cx="20" cy="14" r="6.5" />
                          <path d="M13.5 12 Q13 8 16 5 Q18 3 20 2.5 Q22 3 24 5 Q27 8 26.5 12 Q25 9 23 7 Q21 5.5 20 5.5 Q19 5.5 17 7 Q15 9 13.5 12Z" />
                          <rect x="18" y="20" width="4" height="4" rx="1" />
                          <path d="M20 23 Q29 23 33 28 Q36 32 37 40L3 40Q4 32 7 28 Q11 23 20 23Z" />
                          <path d="M16 23 L14 30 L19 27Z" fillOpacity="0.15" />
                          <path d="M24 23 L26 30 L21 27Z" fillOpacity="0.15" />
                        </g>
                      )}
                      {t.gender === 'couple' && (
                        <g>
                          <g fill="white" fillOpacity="0.6">
                            <circle cx="15" cy="14" r="5.5" />
                            <path d="M15 19 Q9 20 6 25 Q4 29 3 40L25 40Q24 29 22 26 Q19 21 15 19Z" />
                          </g>
                          <g fill="white" fillOpacity="0.9">
                            <circle cx="25" cy="14.5" r="5.5" />
                            <path d="M19 11 Q18 7 21 4 Q23 2.5 25 2 Q27 2.5 29 4 Q32 7 31 11 Q30 8 28 6 Q26 5 25 5 Q24 5 22 6 Q20 8 19 11Z" />
                            <path d="M25 20 Q31 20 35 25 Q37 29 37 40L13 40Q13 30 15 26 Q19 21 25 20Z" />
                          </g>
                        </g>
                      )}
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-primary-700 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}, {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 7. FAQ SECTION ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 text-xs font-semibold text-amber-700 mb-4 border border-amber-200/50 shadow-sm">
              <MessageCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-display-sm text-primary-700 mb-3">Your SIP Questions, Answered</h2>
            <p className="text-slate-500">Common questions about SIP investing and the MeraSIP platform</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details key={index} className="group card-base overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-semibold text-primary-700 text-sm pr-4">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 8. FINAL CTA ═══════════ */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>Start Your Wealth Journey Today</h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Whether you invest &#8377;500 or &#8377;5,00,000 monthly &mdash; the principles are the same.
            Start planning, start investing, start building wealth with professional guidance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/25 text-sm animate-gentle-pulse hover:animate-none">
              <IndianRupee className="w-5 h-5" />
              Start SIP
            </a>
            <a href={`https://wa.me/916003903737?text=Hi%20Trustner%20team%2C%20I%20want%20to%20start%20my%20SIP%20investment%20journey.%20Please%20guide%20me.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20 text-sm">
              <Phone className="w-5 h-5" />
              Talk to Advisor
            </a>
          </div>
          <p className="text-xs text-white/50 mt-6">
            {COMPANY.mfEntity.amfiArn} &middot; EUIN: {COMPANY.mfEntity.euin} &middot; {COMPANY.mfEntity.name}
          </p>
        </div>
      </section>

      {/* ═══════════ AMC PARTNERS ═══════════ */}
      <AMCPartners />

      {/* ═══════════ COMPLIANCE BANNER ═══════════ */}
      <ComplianceBanner />

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund}
            {' '}{DISCLAIMER.general}
            {' '}AMFI Registered Mutual Fund Distributor | {COMPANY.mfEntity.amfiArn} | EUIN: {COMPANY.mfEntity.euin} | {COMPANY.mfEntity.name}
          </p>
        </div>
      </section>

      {/* ═══════════ EXIT INTENT POPUP ═══════════ */}
      <ExitIntentPopup />
    </>
  );
}
