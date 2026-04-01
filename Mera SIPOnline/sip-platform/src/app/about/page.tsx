'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, Globe, Briefcase, CheckCircle2, Landmark,
  BookOpen, Calculator, Shield, Award, Users, Target,
  ArrowRight, MapPin, Phone, Mail, Clock, ExternalLink,
  GraduationCap, TrendingUp, Eye, Handshake, Building2,
  Sparkles, Scale, FileCheck, Star, Layers, Monitor,
  Lock, BarChart3, FileText, Rocket,
} from 'lucide-react';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import LeadershipCarousel from '@/components/ui/LeadershipCarousel';

const OFFICE_ICONS: Record<string, string> = {
  'Guwahati': 'from-brand-50 to-brand-100',
  'Tezpur': 'from-sky-50 to-sky-100',
  'Bangalore': 'from-teal-50 to-teal-100',
  'Kolkata': 'from-amber-50 to-orange-100',
  'Hyderabad': 'from-secondary-50 to-amber-100',
};

export default function AboutPage() {
  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="container-custom relative z-10 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-elevated">
                  <Image
                    src="/Trustner Logo-blue.png"
                    alt="Trustner Group"
                    width={80}
                    height={80}
                    className="w-16 h-16 lg:w-20 lg:h-20 object-contain brightness-0 invert"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Rocket className="w-3.5 h-3.5 text-accent" />
              <span>Fintech-Enabled Financial Services Organization</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-display font-extrabold leading-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Trustner Group
              </span>
              <br />
              <span className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 block">
                Company Profile
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
              AMFI registered mutual fund distributor and IRDAI licensed insurance broker.
              One platform for investments and insurance — serving 10,000+ clients across India.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-7 py-3.5 rounded-lg font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25">
                <Phone className="w-4 h-4" />
                Talk to Us
              </Link>
              <Link href="/learn" className="inline-flex items-center gap-2 bg-white text-primary-700 px-7 py-3.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg">
                <BookOpen className="w-4 h-4" />
                Explore Mera SIP Online
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ COMPANY PROFILE ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-xs font-semibold text-brand mb-4">
                <Building2 className="w-3.5 h-3.5" />
                About Trustner Group
              </div>
              <h2 className="text-display-sm text-primary-700 mb-4">Who We Are</h2>
            </div>

            <div className="space-y-5 text-slate-600 leading-relaxed">
              <p className="text-lg">
                <strong className="text-primary-700">Trustner Group</strong> is a fintech-enabled financial services
                organization committed to delivering structured, transparent, and compliance-driven financial
                solutions across India.
              </p>
              <p>
                Founded in 2014 and headquartered in Guwahati, Assam, Trustner was built with a long-term vision to become a
                nationally respected and globally relevant financial services brand rooted in ethics and
                disciplined distribution practices. From its origin in the North East, the Group has steadily
                expanded its footprint and today operates with a 100+ member professional team across 5 cities.
              </p>
              <p>
                We believe every citizen deserves expert financial guidance — whether they invest Rs.500 or Rs.5 Crore per month.
                Through our dual-entity structure covering both mutual funds and insurance, we provide a one-stop platform
                for clients to protect and grow their wealth with unbiased guidance and technology-driven execution.
              </p>
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { value: '2014', label: 'Founded' },
                { value: '10,000+', label: 'Clients Served' },
                { value: '100+', label: 'Team Members' },
                { value: '40+', label: 'AMC Partners' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-100 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MISSION & VISION ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mission */}
            <div className="card-base p-8 border-t-4 border-t-brand hover-lift">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold text-primary-700">Our Mission</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Democratizing financial product access across India. We believe every citizen deserves
                expert guidance regardless of their investment size. Our mission is to simplify investing
                through education, technology, and unbiased guidance — making wealth creation accessible
                to every Indian household.
              </p>
            </div>

            {/* Vision */}
            <div className="card-base p-8 border-t-4 border-t-amber-500 hover-lift">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-primary-700">Our Vision</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                To become India&apos;s most trusted fintech platform where every household can access
                the right financial products through unbiased advice and cutting-edge technology. We aspire
                to build a globally respected financial services brand known for ethical standards, disciplined
                execution, and enduring client trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDER MESSAGE ═══════════ */}
      <section className="section-padding bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-50/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                From the Founder&apos;s Desk
              </div>
              <h2 className="text-display-sm text-primary-700">A Message of Purpose</h2>
            </div>

            <div className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-center">
              {/* Founder Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-52 h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shadow-elevated border-4 border-white ring-1 ring-brand-100">
                    <Image
                      src="/team/ram-shah.jpeg"
                      alt="Ram Shah — Founder & CEO, Trustner Group"
                      width={320}
                      height={320}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  {/* Tagline badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap tracking-wide">
                    Dil Se Honest &bull; With You Always
                  </div>
                </div>
                <div className="text-center mt-6">
                  <div className="font-bold text-primary-700 text-lg">Ram Shah</div>
                  <div className="text-sm text-brand font-medium">Founder &amp; CEO</div>
                  <div className="text-xs text-slate-400 mt-0.5">Trustner Group | Since 2014</div>
                </div>
              </div>

              {/* Founder Message */}
              <div className="space-y-5">
                <blockquote className="text-lg lg:text-xl text-slate-700 leading-relaxed font-medium italic border-l-4 border-brand-300 pl-6">
                  &ldquo;I founded Trustner with a simple belief — every Indian family deserves honest financial guidance,
                  regardless of how much they invest. Whether it is Rs. 500 or Rs. 5 Crore, the trust a client places
                  in us is the same, and so is our commitment.&rdquo;
                </blockquote>

                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    At Trustner, we don&apos;t just manage investments — we align them with your life&apos;s goals.
                    A child&apos;s education, a comfortable retirement, a dream home — these are not just financial targets,
                    they are your aspirations. Our role is to bridge the gap between where you are today and where you
                    want to be, with discipline, transparency, and a <strong className="text-primary-700">Client First</strong> approach.
                  </p>
                  <p>
                    We believe in democratising investment access. Technology should simplify, education should empower,
                    and advice should always put your interest first. That is why we built <strong className="text-primary-700">Mera SIP Online</strong> —
                    to make financial planning tools, research, and calculators freely available to every investor.
                  </p>
                  <p className="text-sm text-slate-500 italic">
                    Our promise is not to be the largest — but to be the most trusted name in financial services.
                    Growth follows trust, and trust is built one honest conversation at a time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { icon: Heart, text: 'Client First Approach' },
                    { icon: Shield, text: 'Zero Hidden Charges' },
                    { icon: GraduationCap, text: 'Education Before Selling' },
                  ].map((item) => (
                    <div key={item.text} className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LEADERSHIP TEAM ═══════════ */}
      <section className="section-padding bg-surface-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
        <div className="container-custom relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-xs font-semibold text-brand mb-4">
              <Users className="w-3.5 h-3.5" />
              Our People
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">The Leaders Behind Trustner</h2>
            <p className="text-slate-500 max-w-3xl mx-auto">
              A team of experienced professionals with decades of combined expertise in financial services,
              institutional sales, insurance, and technology — driving Trustner&apos;s mission across India.
            </p>
          </div>

          {/* Leadership Carousel — 4 at a time, auto-scrolling */}
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
            interval={3500}
          />

          {/* Team Summary */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-6 bg-white rounded-2xl px-8 py-4 shadow-sm border border-surface-300/50">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">100+</div>
                <div className="text-[11px] text-slate-500">Team Members</div>
              </div>
              <div className="w-px h-10 bg-surface-300" />
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">5</div>
                <div className="text-[11px] text-slate-500">Cities</div>
              </div>
              <div className="w-px h-10 bg-surface-300" />
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">200+</div>
                <div className="text-[11px] text-slate-500">Years Combined Exp.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OUR PRESENCE ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-secondary-50 rounded-full px-4 py-1.5 text-xs font-semibold text-secondary-700 mb-4">
              <MapPin className="w-3.5 h-3.5" />
              Our Presence
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Growing Across India</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              From our roots in Northeast India, we are steadily expanding into strategic cities across the country.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
            {COMPANY.offices.map((office) => (
              <div key={office.city} className="card-base p-6 text-center hover-lift">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${OFFICE_ICONS[office.city] || 'from-slate-50 to-slate-100'} flex items-center justify-center mx-auto mb-4`}>
                  <MapPin className="w-6 h-6 text-brand" />
                </div>
                <div className="font-bold text-primary-700 mb-1">{office.city}</div>
                <div className="text-xs text-slate-500">{office.type}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{office.state}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 italic">
            Coming soon: Ranchi &amp; Mumbai. Ongoing expansion into additional strategic cities across India.
          </p>
        </div>
      </section>

      {/* ═══════════ TWO ENTITIES ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 text-xs font-semibold text-teal-700 mb-4">
              <Layers className="w-3.5 h-3.5" />
              Our Entities
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Two Principal Entities</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Trustner Group operates through two regulated entities to serve the complete financial needs of clients across India.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* TAS */}
            <div className="card-base p-8 hover-lift border-t-4 border-t-brand">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-700 text-lg">TAS</h3>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Mutual Fund Distribution</p>
                </div>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">{COMPANY.mfEntity.name}</h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                An AMFI-registered Mutual Fund Distributor engaged in mutual fund distribution and
                need-based financial planning facilitation.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-slate-500">Registration</span>
                  <span className="font-semibold text-primary-700">{COMPANY.mfEntity.amfiArn}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-slate-500">Type</span>
                  <span className="font-semibold text-primary-700 text-xs text-right">{COMPANY.mfEntity.type}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">CIN</span>
                  <span className="font-mono font-semibold text-primary-700 text-xs">{COMPANY.mfEntity.cin}</span>
                </div>
              </div>
            </div>

            {/* TIB */}
            <div className="card-base p-8 hover-lift border-t-4 border-t-teal-500">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-700 text-lg">TIB</h3>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Insurance Broking</p>
                </div>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">{COMPANY.insuranceEntity.name}</h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                An IRDAI-licensed Direct Insurance Broker providing life, health, and general insurance
                solutions across insurers.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-slate-500">Regulator</span>
                  <span className="font-semibold text-primary-700">IRDAI</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-slate-500">License No.</span>
                  <span className="font-semibold text-primary-700">{COMPANY.insuranceEntity.irdaiLicense}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-slate-500">Type</span>
                  <span className="font-semibold text-primary-700 text-xs text-right">{COMPANY.insuranceEntity.type}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Services</span>
                  <span className="font-semibold text-primary-700 text-xs text-right">{COMPANY.insuranceEntity.services}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OUR PHILOSOPHY ═══════════ */}
      <section className="section-padding bg-mesh">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Our Philosophy
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Built on a Powerful Foundation</h2>
            <p className="text-slate-500 max-w-3xl mx-auto">
              In an era where financial markets are complex and trust deficit is a growing concern,
              Trustner was built on a simple yet powerful foundation: integrity, suitability, and
              long-term relationship orientation. We believe that scale must never compromise ethics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-base p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mx-auto mb-6">
                <Handshake className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-xl font-bold text-primary-700 mb-3">Integrity</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We operate with complete transparency. No hidden charges, no misleading projections,
                no pressure tactics. We earn trust through honest conversations and by always putting
                our clients&apos; interests ahead of our own.
              </p>
            </div>

            <div className="card-base p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-positive-50 to-teal-100 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-positive" />
              </div>
              <h3 className="text-xl font-bold text-primary-700 mb-3">Suitability</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Every recommendation is aligned with the client&apos;s risk profile, financial goals,
                and time horizon. We facilitate risk-appropriate products with structured distribution
                processes and documentation discipline.
              </p>
            </div>

            <div className="card-base p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-50 to-amber-100 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-700 mb-3">Long-term Relationships</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We do not chase short-term trends. Our focus is on building enduring client relationships
                through disciplined execution, transparent communication, and sustained performance
                discipline over the years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OPERATING MODEL ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-xs font-semibold text-brand mb-4">
              <Briefcase className="w-3.5 h-3.5" />
              Operating Model
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">How We Operate</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our operating model is built around five core pillars that ensure every client interaction
              meets the highest standards of professionalism.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { icon: FileText, title: 'Structured Processes', desc: 'Documented processes for every client engagement', color: 'bg-brand-50 text-brand' },
              { icon: Shield, title: 'Risk-Appropriate', desc: 'Products matched to client risk profile', color: 'bg-teal-50 text-teal-600' },
              { icon: Scale, title: 'Compliance First', desc: 'Regulatory compliance and documentation discipline', color: 'bg-amber-50 text-amber-600' },
              { icon: Eye, title: 'Transparent', desc: 'Clear, honest communication at every step', color: 'bg-secondary-50 text-secondary-600' },
              { icon: Monitor, title: 'Tech-Enabled', desc: 'Digital execution and real-time reporting', color: 'bg-rose-50 text-rose-600' },
            ].map((pillar) => (
              <div key={pillar.title} className="card-base p-5 text-center hover-lift">
                <div className={`w-11 h-11 rounded-xl ${pillar.color} flex items-center justify-center mx-auto mb-3`}>
                  <pillar.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary-700 text-sm mb-1.5">{pillar.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINTECH CAPABILITIES ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 text-xs font-semibold text-teal-700 mb-4">
              <Monitor className="w-3.5 h-3.5" />
              Fintech-Enabled
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Process-Driven & Technology-Enabled</h2>
            <p className="text-slate-500 max-w-3xl mx-auto">
              Trustner integrates digital platforms, secure transaction systems, and real-time reporting
              tools to ensure efficient execution and seamless client experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Digital Onboarding',
                desc: 'Seamless client onboarding with digital KYC, e-signatures, and paperless documentation for faster account setup.',
                color: 'bg-brand-50 text-brand',
              },
              {
                icon: Lock,
                title: 'Secure Transaction Processing',
                desc: 'All transactions processed through BSE StAR MF and other authorized platforms with bank-grade security protocols.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: BarChart3,
                title: 'Portfolio Monitoring & Reporting',
                desc: 'Real-time portfolio tracking, performance reports, and consolidated investment views for complete transparency.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: FileCheck,
                title: 'Structured Process Documentation',
                desc: 'Every recommendation documented with risk assessment, suitability analysis, and client consent for full audit trail.',
                color: 'bg-secondary-50 text-secondary-600',
              },
            ].map((capability) => (
              <div key={capability.title} className="card-base p-7 flex gap-5 hover-lift">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${capability.color}`}>
                  <capability.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-700 mb-2">{capability.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{capability.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8 max-w-2xl mx-auto italic">
            While our roots are regional, our operational standards are national in outlook and global in aspiration.
          </p>
        </div>
      </section>

      {/* ═══════════ VISION ═══════════ */}
      <section className="section-padding bg-hero-pattern text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Star className="w-3.5 h-3.5 text-accent" />
              Our Vision
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Globally Respected. Ethically Grounded.
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Trustner&apos;s long-term vision is to evolve into a globally respected financial services brand
              known for ethical standards, disciplined execution, and enduring client trust.
            </p>
            <p className="text-base text-slate-400 leading-relaxed">
              Our name reflects our philosophy &mdash; relationships built on trust, reinforced by process,
              and sustained by performance discipline.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ WHAT WE DO ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-xs font-semibold text-brand mb-4">
              <Briefcase className="w-3.5 h-3.5" />
              What We Do
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Comprehensive Financial Services</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              From mutual fund distribution to insurance broking, we provide structured solutions for
              clients to protect and grow their wealth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Landmark,
                title: 'Mutual Fund Distribution',
                desc: `As an AMFI registered distributor (${COMPANY.mfEntity.amfiArn}), we help clients invest across all major AMCs in India. We assist with new folios, SIP setup, redemptions, switches, and ongoing portfolio management.`,
                color: 'bg-brand-50 text-brand',
              },
              {
                icon: Shield,
                title: 'Insurance Broking',
                desc: 'Through our IRDAI-licensed insurance broking entity, we provide need-based life, health, and general insurance solutions across multiple insurers for comprehensive risk protection.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: BookOpen,
                title: 'SIP Education Platform',
                desc: 'Mera SIP Online (merasip.com) is our flagship digital initiative offering structured learning modules, research-grade articles, and interactive content for investors.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Target,
                title: 'Goal-Based Financial Planning',
                desc: 'Whether retirement, children\'s education, home purchase, or emergency fund, we help clients calculate exact needs and create personalized investment roadmaps.',
                color: 'bg-secondary-50 text-secondary-600',
              },
            ].map((service) => (
              <div key={service.title} className="card-base p-7 flex gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${service.color}`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-700 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY FAMILIES TRUST US ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-positive-50 rounded-full px-4 py-1.5 text-xs font-semibold text-positive mb-4">
              <Heart className="w-3.5 h-3.5" />
              Why Clients Trust Us
            </div>
            <h2 className="text-display-sm text-primary-700 mb-4">Numbers That Reflect Our Commitment</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
            {[
              { value: '10,000+', label: 'Clients Served', icon: Users, color: 'from-brand-50 to-brand-100' },
              { value: '12', label: 'Smart Calculators', icon: Calculator, color: 'from-teal-50 to-teal-100' },
              { value: '40+', label: 'AMC Partners', icon: BookOpen, color: 'from-amber-50 to-orange-100' },
              { value: COMPANY.mfEntity.amfiArn, label: 'AMFI Registered', icon: Award, color: 'from-secondary-50 to-amber-100' },
            ].map((stat) => (
              <div key={stat.label} className="card-base p-6 text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-6 h-6 text-brand" />
                </div>
                <div className="text-2xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { text: 'No hidden charges', icon: CheckCircle2 },
              { text: 'Complete transparency', icon: CheckCircle2 },
              { text: 'Education before selling', icon: CheckCircle2 },
              { text: 'Personal attention to every client', icon: CheckCircle2 },
            ].map((promise) => (
              <div key={promise.text} className="flex items-center gap-3 bg-white rounded-lg p-4 border border-surface-300/50">
                <promise.icon className="w-5 h-5 text-positive shrink-0" />
                <span className="text-sm font-medium text-primary-700">{promise.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REGULATORY & COMPLIANCE ═══════════ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600 mb-4">
                <Scale className="w-3.5 h-3.5" />
                Regulatory & Compliance
              </div>
              <h2 className="text-display-sm text-primary-700 mb-4">Operating with Full Regulatory Compliance</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                We adhere to all regulatory standards set by SEBI, AMFI, and IRDAI.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="card-base p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="font-bold text-primary-700">AMFI Registration</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">ARN Number</span>
                    <span className="font-semibold text-primary-700">{COMPANY.mfEntity.amfiArn}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Entity Type</span>
                    <span className="font-semibold text-primary-700 text-right text-xs">{COMPANY.mfEntity.type}</span>
                  </div>
                </div>
              </div>

              <div className="card-base p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-primary-700">Company Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Entity Name</span>
                    <span className="font-semibold text-primary-700 text-right text-xs">{COMPANY.mfEntity.shortName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">CIN</span>
                    <span className="font-mono font-semibold text-primary-700 text-xs">{COMPANY.mfEntity.cin}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="font-bold text-primary-700 mb-4">Important Regulatory Links</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-surface-100 rounded-lg p-4 hover:bg-surface-200 transition-colors group">
                  <div>
                    <div className="font-semibold text-primary-700 text-sm">AMFI India</div>
                    <div className="text-xs text-slate-400">Verify distributor registration</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                </a>
                <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-surface-100 rounded-lg p-4 hover:bg-surface-200 transition-colors group">
                  <div>
                    <div className="font-semibold text-primary-700 text-sm">SEBI</div>
                    <div className="text-xs text-slate-400">Securities regulator of India</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                </a>
                <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-surface-100 rounded-lg p-4 hover:bg-surface-200 transition-colors group">
                  <div>
                    <div className="font-semibold text-primary-700 text-sm">SCORES</div>
                    <div className="text-xs text-slate-400">Investor grievance portal</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                </a>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>KYC Compliance:</strong> {DISCLAIMER.kyc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT INFO ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-1.5 text-xs font-semibold text-brand mb-4">
                <Phone className="w-3.5 h-3.5" />
                Get in Touch
              </div>
              <h2 className="text-display-sm text-primary-700 mb-4">We Would Love to Hear From You</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Whether you have questions about SIPs, insurance, or simply want to learn
                more about how we can help you &mdash; reach out to us.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href={`tel:${COMPANY.contact.phone}`} className="card-interactive p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-brand" />
                </div>
                <div className="font-bold text-primary-700 mb-1">{COMPANY.contact.phoneDisplay}</div>
                <div className="text-xs text-slate-500">Call us directly</div>
              </a>

              <a href={`mailto:${COMPANY.contact.email}`} className="card-interactive p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-teal-600" />
                </div>
                <div className="font-bold text-primary-700 mb-1 text-sm">{COMPANY.contact.email}</div>
                <div className="text-xs text-slate-500">Email us anytime</div>
              </a>

              <div className="card-base p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="font-bold text-primary-700 mb-1 text-sm">{COMPANY.contact.workingHours}</div>
                <div className="text-xs text-slate-500">Working hours</div>
              </div>

              <div className="card-base p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-secondary-600" />
                </div>
                <div className="font-bold text-primary-700 mb-1 text-sm">{COMPANY.address.city}</div>
                <div className="text-xs text-slate-500">{COMPANY.address.state}, India</div>
              </div>
            </div>

            <div className="mt-6 card-base p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-700 mb-1">Registered Office</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {COMPANY.mfEntity.name}<br />
                    {COMPANY.address.line1}<br />
                    {COMPANY.address.line2}<br />
                    {COMPANY.address.city} - {COMPANY.address.pincode}, {COMPANY.address.state}, {COMPANY.address.country}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
            <Image src="/Trustner Logo-blue.png" alt="Trustner" width={80} height={24} className="h-5 w-auto brightness-0 invert" />
            <span>Powered by Trustner Group</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Start Your Financial Journey?
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Join 10,000+ clients who trust Trustner with their wealth-building and risk protection goals.
            Start with education, invest with confidence, and build lasting financial security.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/calculators/sip"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm"
            >
              <Calculator className="w-5 h-5" />
              Try SIP Calculator
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg text-sm"
            >
              <BookOpen className="w-5 h-5" />
              Start Learning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-brand-200 mt-8">
            {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
