'use client';

import Link from 'next/link';
import {
  BookOpen, Globe, ArrowRight, Shield, AlertTriangle, ChevronRight,
  Scale, IndianRupee, Flag, Calendar, Info, Users, FileText,
  Landmark, ArrowLeft, MapPin,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   NRI Mutual Fund Taxation Guide
   Comprehensive guide for Non-Resident Indians investing in Indian MFs
   ═══════════════════════════════════════════════════════════════════ */

export default function NRITaxationGuidePage() {
  return (
    <>
      {/* ═══════════ BREADCRUMB ═══════════ */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/resources/taxation" className="hover:text-brand transition-colors">Taxation Guide</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">NRI Taxation</span>
          </nav>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>NRI Investor Guide</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              NRI Mutual Fund{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Taxation Guide
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Complete tax guide for Non-Resident Indians investing in Indian mutual funds
              &mdash; US, Canada, Europe, UAE &amp; more. Understand TDS, DTAA, PFIC,
              and repatriation rules for FY 2025-26.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { label: 'US / Canada', target: 'us-citizens' },
                { label: 'UK / Europe', target: 'european-residents' },
                { label: 'UAE / GCC', target: 'uae-gcc' },
              ].map((btn) => (
                <button
                  key={btn.target}
                  onClick={() => document.getElementById(btn.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-4 py-2 text-xs cursor-pointer transition-colors"
                >
                  <Flag className="w-3 h-3" /> {btn.label}
                </button>
              ))}
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs">
                <Calendar className="w-3 h-3" /> Updated FY 2025-26
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TABLE OF CONTENTS ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="card-base p-6 lg:p-8">
              <h2 className="text-lg font-bold text-primary-700 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> What You Will Find in This Guide
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { num: '1', label: 'NRI Investment in Indian MFs — Basics', id: 'nri-basics' },
                  { num: '2', label: 'TDS for NRIs — The Key Difference', id: 'tds-nri' },
                  { num: '3', label: 'US Citizens & Green Card Holders (PFIC)', id: 'us-citizens' },
                  { num: '4', label: 'Canadian Residents', id: 'canadian-residents' },
                  { num: '5', label: 'European Residents (UK, Germany, France)', id: 'european-residents' },
                  { num: '6', label: 'UAE / GCC Residents', id: 'uae-gcc' },
                  { num: '7', label: 'DTAA — Double Tax Avoidance Agreements', id: 'dtaa' },
                  { num: '8', label: 'Practical Steps for NRI MF Investors', id: 'practical-steps' },
                  { num: '9', label: 'Recent Regulatory Changes', id: 'regulatory-changes' },
                ].map((item) => (
                  <button
                    key={item.num}
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary-700 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                      {item.num}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 1: NRI BASICS ═══════════ */}
      <section id="nri-basics" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">1</span>
              <h2 className="text-2xl font-bold text-primary-700">
                NRI Investment in Indian Mutual Funds — Basics
              </h2>
            </div>

            <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
              <p>
                <strong className="text-primary-700">Yes, NRIs can invest in Indian mutual funds.</strong>{' '}
                The Securities and Exchange Board of India (SEBI) permits Non-Resident Indians and Persons
                of Indian Origin (PIOs) to invest in mutual fund schemes in India, subject to certain
                conditions and compliance requirements.
              </p>
              <p>
                However, NRI mutual fund investment is not as straightforward as it is for resident Indians.
                There are KYC requirements, account restrictions, AMC-level limitations, and importantly,
                different taxation rules that every NRI investor must understand before deploying capital.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  icon: FileText,
                  title: 'KYC with NRI Status',
                  desc: 'NRIs must complete KYC specifically with NRI status (not as a resident Indian). This requires passport copy, overseas address proof, and PAN card. CKYC or KRA registration is mandatory.',
                },
                {
                  icon: Landmark,
                  title: 'NRE / NRO Account Required',
                  desc: 'Investments must be routed through an NRE (Non-Resident External) or NRO (Non-Resident Ordinary) bank account held with an Indian bank. Direct overseas bank transfers are not permitted.',
                },
                {
                  icon: Shield,
                  title: 'FATCA Compliance',
                  desc: 'Some AMCs do not accept investments from NRIs in the US or Canada due to FATCA (Foreign Account Tax Compliance Act) reporting burden. Always verify AMC acceptance before investing.',
                },
                {
                  icon: Users,
                  title: 'Power of Attorney',
                  desc: 'NRIs can appoint a resident Indian as their Power of Attorney (PoA) holder to manage mutual fund transactions on their behalf — useful for NRIs who cannot handle paperwork remotely.',
                },
              ].map((card) => (
                <div key={card.title} className="card-base p-5">
                  <card.icon className="w-5 h-5 text-primary-600 mb-3" />
                  <h3 className="font-semibold text-primary-700 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Repatriation Box */}
            <div className="card-base p-5 border-l-4 border-l-accent bg-amber-50/50">
              <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-accent" /> Repatriation Rules
              </h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  <strong>NRE Account:</strong> Investments made from NRE accounts are <strong>fully repatriable</strong>.
                  Both principal and gains can be transferred abroad without any limit, making NRE the preferred
                  route for most NRI investors.
                </p>
                <p>
                  <strong>NRO Account:</strong> Investments from NRO accounts have a repatriation limit of
                  <strong> up to USD 1 million per financial year</strong> (as per RBI&apos;s Liberalised Remittance Scheme).
                  A Chartered Accountant&apos;s certificate (Form 15CA/15CB) is required for repatriation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 2: TDS FOR NRIs ═══════════ */}
      <section id="tds-nri" className="section-padding bg-surface-100 scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">2</span>
              <h2 className="text-2xl font-bold text-primary-700">
                TDS for NRIs — The Key Difference
              </h2>
            </div>

            <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
              <p>
                The single most important distinction between resident and NRI mutual fund taxation is
                <strong className="text-primary-700"> TDS (Tax Deducted at Source)</strong>. For resident Indians,
                there is no TDS on mutual fund redemptions — they self-assess and pay tax when filing ITR.
                For NRIs, the AMC <strong>mandatorily deducts TDS</strong> at the time of redemption, before
                crediting the proceeds to your bank account.
              </p>
              <p>
                This means NRIs receive a lower redemption amount upfront. The TDS can be claimed as a
                credit when filing the Indian Income Tax Return, and any excess TDS can be claimed as a refund.
              </p>
            </div>

            {/* TDS Rate Table */}
            <div className="card-base overflow-hidden mb-8">
              <div className="bg-primary-700 text-white px-5 py-3">
                <h3 className="font-semibold text-sm">NRI TDS Rates on Mutual Fund Redemption — FY 2025-26</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-100 text-left">
                      <th className="px-5 py-3 font-semibold text-primary-700">Category</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Equity STCG</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Equity LTCG</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Debt Funds</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    <tr>
                      <td className="px-5 py-3 font-medium text-primary-700">Holding Period</td>
                      <td className="px-5 py-3 text-slate-600">&lt; 12 months</td>
                      <td className="px-5 py-3 text-slate-600">&ge; 12 months</td>
                      <td className="px-5 py-3 text-slate-600">Any period</td>
                    </tr>
                    <tr className="bg-surface-50">
                      <td className="px-5 py-3 font-medium text-primary-700">TDS Rate</td>
                      <td className="px-5 py-3 text-red-600 font-semibold">20%</td>
                      <td className="px-5 py-3 text-red-600 font-semibold">12.5%</td>
                      <td className="px-5 py-3 text-red-600 font-semibold">30% (or slab rate)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-medium text-primary-700">Exemption Limit</td>
                      <td className="px-5 py-3 text-slate-600">None</td>
                      <td className="px-5 py-3 text-slate-600">{'\u20B9'}1.25 lakh per FY</td>
                      <td className="px-5 py-3 text-slate-600">None</td>
                    </tr>
                    <tr className="bg-surface-50">
                      <td className="px-5 py-3 font-medium text-primary-700">Surcharge</td>
                      <td colSpan={3} className="px-5 py-3 text-slate-600">
                        Applicable based on total Indian income — 10% (above {'\u20B9'}50L), 15% (above {'\u20B9'}1Cr),
                        25% (above {'\u20B9'}2Cr). Plus 4% Health &amp; Education Cess on tax + surcharge.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important callouts */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="card-base p-5 border-l-4 border-l-red-500 bg-red-50/50">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> TDS Cannot Be Avoided
                </h4>
                <p className="text-sm text-slate-600">
                  Unlike resident Indians, NRIs <strong>cannot</strong> submit Form 15G/15H to avoid TDS.
                  TDS deduction is mandatory for all NRI mutual fund redemptions. The only way to reduce
                  the TDS rate is to obtain a lower deduction certificate from the Income Tax officer
                  under Section 197.
                </p>
              </div>
              <div className="card-base p-5 border-l-4 border-l-blue-500 bg-blue-50/50">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Claim Refund via ITR
                </h4>
                <p className="text-sm text-slate-600">
                  If the TDS deducted exceeds your actual tax liability (e.g., gains are below the LTCG
                  exemption threshold, or you have no other Indian income), you can file an Indian ITR
                  and claim a refund. The refund is typically processed within 4-6 months of filing.
                </p>
              </div>
            </div>

            <div className="card-base p-5 bg-amber-50/50 border-l-4 border-l-accent">
              <h4 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" /> Tax Certificate from AMC
              </h4>
              <p className="text-sm text-slate-600">
                After each financial year, the AMC issues a TDS certificate (Form 16A) to the NRI investor.
                This document is <strong>essential</strong> for claiming foreign tax credit in your country
                of residence. Keep this certificate safely — your overseas tax advisor will need it to
                apply the DTAA provisions and avoid double taxation.
              </p>
            </div>

            {/* Example */}
            <div className="card-base p-5 mt-6">
              <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Practical Example: Equity Fund Redemption by NRI
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  <strong>Scenario:</strong> An NRI in the UAE invested {'\u20B9'}10,00,000 in an equity mutual
                  fund 18 months ago. The current value is {'\u20B9'}13,50,000 — a gain of {'\u20B9'}3,50,000.
                </p>
                <p>
                  <strong>Tax Calculation:</strong> Since holding period &gt; 12 months, this is LTCG.
                  Exemption of {'\u20B9'}1,25,000 applies. Taxable LTCG = {'\u20B9'}3,50,000 &minus; {'\u20B9'}1,25,000 = {'\u20B9'}2,25,000.
                  Tax at 12.5% = {'\u20B9'}28,125. Plus 4% cess = {'\u20B9'}29,250.
                </p>
                <p>
                  <strong>TDS Deducted:</strong> The AMC deducts TDS at 12.5% on the <em>entire</em> gain of {'\u20B9'}3,50,000
                  = {'\u20B9'}43,750 + cess. The NRI receives {'\u20B9'}13,50,000 minus TDS. The excess TDS ({'\u20B9'}43,750 vs {'\u20B9'}28,125 actual liability)
                  can be claimed as refund by filing ITR in India.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 3: US CITIZENS & GREEN CARD HOLDERS ═══════════ */}
      <section id="us-citizens" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">3</span>
              <h2 className="text-2xl font-bold text-primary-700">
                US Citizens &amp; Green Card Holders
              </h2>
            </div>

            {/* Critical warning */}
            <div className="card-base p-5 border-l-4 border-l-red-600 bg-red-50/60 mb-8">
              <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Most Complex Jurisdiction for Indian MF Investment
              </h3>
              <p className="text-sm text-slate-600">
                US tax treatment of Indian mutual funds is by far the most complex of any country.
                Indian mutual funds are classified as <strong>PFICs (Passive Foreign Investment Companies)</strong> by the
                IRS, triggering punitive tax treatment. This section is critical reading for any US-based NRI
                considering Indian mutual fund investments.
              </p>
            </div>

            {/* FATCA */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary-700 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" /> FATCA Reporting
              </h3>
              <div className="text-slate-600 text-sm space-y-3 leading-relaxed">
                <p>
                  Under the <strong>Foreign Account Tax Compliance Act (FATCA)</strong>, all Indian mutual fund
                  houses are required to report details of US-person account holders to the IRS via the Indian
                  tax authorities. This means the IRS has visibility into your Indian MF holdings regardless of
                  whether you report them yourself.
                </p>
                <p>
                  Many Indian AMCs — including some of the largest fund houses — <strong>do not accept
                  investments from US/Canada-based NRIs</strong> because of the compliance burden FATCA places on them.
                  AMCs that do accept US NRIs include a limited set; always verify before initiating investment.
                </p>
              </div>
            </div>

            {/* PFIC - The big one */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> PFIC (Passive Foreign Investment Company) Classification
              </h3>
              <div className="text-slate-600 text-sm space-y-3 leading-relaxed mb-6">
                <p>
                  The IRS classifies Indian mutual funds as <strong>Passive Foreign Investment Companies (PFICs)</strong>.
                  A PFIC is any foreign corporation where (a) 75% or more of gross income is passive income, or
                  (b) 50% or more of assets produce passive income. Indian mutual funds meet both criteria.
                </p>
                <p>
                  PFIC classification triggers one of the <strong>most punitive tax regimes</strong> in the US tax code.
                  There are three methods to handle PFIC taxation, each with distinct trade-offs:
                </p>
              </div>

              <div className="space-y-4">
                {/* Default Method */}
                <div className="card-base p-5 border-l-4 border-l-red-500">
                  <h4 className="font-semibold text-red-700 mb-2">(a) Default &quot;Excess Distribution&quot; Method — Most Punitive</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>
                      If you take no special election, the default PFIC rules apply. Under this method, when you sell
                      your Indian mutual fund units or receive a distribution exceeding 125% of the average distributions
                      from the prior 3 years, the gain is treated as an <strong>&quot;excess distribution.&quot;</strong>
                    </p>
                    <p>
                      The excess distribution is allocated ratably over your entire holding period. The portion allocated to
                      prior years is taxed at the <strong>highest marginal tax rate</strong> that was in effect for each
                      of those years (currently 37%), <em>plus</em> an <strong>interest charge</strong> is added as if
                      you had underpaid tax in those years. Only the portion allocated to the current year is taxed at
                      your current ordinary income rate.
                    </p>
                    <p className="text-red-600 font-medium">
                      This can result in an effective tax rate exceeding 50-60% on your gains. It is widely considered
                      the worst possible tax outcome.
                    </p>
                  </div>
                </div>

                {/* QEF Election */}
                <div className="card-base p-5 border-l-4 border-l-amber-500">
                  <h4 className="font-semibold text-amber-700 mb-2">(b) QEF (Qualified Electing Fund) Election — Rarely Available</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>
                      A QEF election requires the foreign fund to provide an <strong>Annual Information Statement</strong> to
                      the US investor, breaking down its income into ordinary earnings and net capital gains.
                      The US investor then includes their pro-rata share of the fund&apos;s income in their US return annually,
                      even if no distribution was received.
                    </p>
                    <p>
                      <strong>The problem:</strong> Indian mutual funds do not provide QEF-compliant annual statements.
                      No Indian AMC, to our knowledge, is set up to issue the &quot;PFIC Annual Information Statement&quot;
                      required by the IRS. This makes the QEF election <strong>practically unavailable</strong> for
                      Indian mutual funds.
                    </p>
                  </div>
                </div>

                {/* Mark-to-Market */}
                <div className="card-base p-5 border-l-4 border-l-green-500">
                  <h4 className="font-semibold text-green-700 mb-2">(c) Mark-to-Market (MTM) Election — Best Available Option</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>
                      Under the Mark-to-Market election (Section 1296), you include the <strong>unrealized gain
                      or loss</strong> on your PFIC holdings in your US tax return each year. At each year-end,
                      you calculate the change in fair market value of your Indian MF units and include the
                      gain as ordinary income (or deduct the loss, subject to limits).
                    </p>
                    <p>
                      <strong>Pros:</strong> Avoids the punitive excess distribution regime. Gains are taxed at
                      ordinary income rates (not capital gains rates, which is a downside), but there is no interest
                      charge. Annual compliance is required but straightforward.
                    </p>
                    <p>
                      <strong>Cons:</strong> You pay tax on paper gains every year, even without selling. All gains
                      are treated as ordinary income (up to 37% federal rate), not long-term capital gains (20%).
                      You must file <strong>IRS Form 8621</strong> annually for each PFIC holding.
                    </p>
                    <p className="font-medium text-green-700">
                      This is generally the best option available for US NRIs who hold Indian mutual funds.
                      However, the annual compliance burden and ordinary income treatment make it suboptimal
                      compared to simply investing through US-domiciled funds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Double Taxation & DTAA */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary-700 mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5" /> Double Taxation Risk &amp; India-US DTAA
              </h3>
              <div className="text-slate-600 text-sm space-y-3 leading-relaxed">
                <p>
                  US NRIs face <strong>double taxation</strong> on Indian mutual fund gains: India deducts TDS at source
                  (12.5% LTCG / 20% STCG for equity; 30% for debt), and the US taxes the same income under PFIC rules
                  at ordinary income rates (up to 37% federal + state tax).
                </p>
                <p>
                  The <strong>India-US Double Tax Avoidance Agreement (DTAA)</strong> provides relief through
                  the <strong>Foreign Tax Credit</strong> mechanism. You can claim the Indian TDS as a credit
                  against your US tax liability by filing <strong>IRS Form 1116 (Foreign Tax Credit)</strong>.
                  This prevents the same income from being fully taxed in both countries.
                </p>
                <p>
                  <strong>Important:</strong> The foreign tax credit is limited to the US tax attributable to
                  the foreign income. If the Indian TDS rate is lower than your US effective rate, you pay the
                  difference to the IRS. If the Indian TDS is higher, the excess credit can be carried forward
                  for up to 10 years or carried back 1 year.
                </p>
              </div>
            </div>

            {/* FBAR */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary-700 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" /> FBAR &amp; FATCA Form 8938
              </h3>
              <div className="text-slate-600 text-sm space-y-3 leading-relaxed">
                <p>
                  <strong>FBAR (FinCEN Form 114):</strong> If the aggregate value of all your foreign financial
                  accounts (including Indian MF holdings, bank accounts, fixed deposits) exceeds <strong>$10,000
                  at any point during the year</strong>, you must file an FBAR electronically with FinCEN by
                  April 15 (with automatic extension to October 15). Penalty for non-filing can be up to
                  $10,000 per violation (non-willful) or $100,000 or 50% of account value (willful).
                </p>
                <p>
                  <strong>FATCA Form 8938:</strong> In addition to FBAR, you may need to file Form 8938
                  (Statement of Specified Foreign Financial Assets) with your tax return if the total value
                  of foreign financial assets exceeds $50,000 on the last day of the year or $75,000 at any
                  time during the year (thresholds are higher for those filing jointly or living abroad).
                </p>
              </div>
            </div>

            {/* Practical Recommendation */}
            <div className="card-base p-5 border-l-4 border-l-primary-600 bg-primary-50/50">
              <h4 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Practical Recommendation for US-Based NRIs
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  Due to the PFIC classification, annual Form 8621 filing requirement, Mark-to-Market
                  compliance burden, and ordinary income treatment of gains, <strong>many US-based NRIs
                  choose to avoid Indian mutual funds entirely</strong>.
                </p>
                <p>
                  <strong>Alternatives to consider:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>US-listed India ETFs</strong> (e.g., iShares MSCI India ETF — INDA, WisdomTree India
                    Earnings Fund — EPI) — these are US-domiciled and do not trigger PFIC issues
                  </li>
                  <li>
                    <strong>Direct equity investment</strong> in Indian stocks through a Portfolio Investment
                    Scheme (PIS) account — no PFIC classification for individual stocks
                  </li>
                  <li>
                    <strong>Indian NPS (National Pension System)</strong> — NRIs can invest; different tax treatment
                  </li>
                </ul>
                <p className="mt-2 text-xs text-slate-500 italic">
                  If you already hold Indian mutual funds as a US person, consult a cross-border tax specialist
                  (CPA with international tax experience) to determine the optimal election and filing strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 4: CANADIAN RESIDENTS ═══════════ */}
      <section id="canadian-residents" className="section-padding bg-surface-100 scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">4</span>
              <h2 className="text-2xl font-bold text-primary-700">
                Canadian Residents
              </h2>
            </div>

            <div className="text-slate-600 text-sm space-y-3 leading-relaxed mb-8">
              <p>
                Canada&apos;s tax treatment of Indian mutual funds is <strong>significantly simpler than the US</strong>.
                Canada does not have a PFIC-equivalent classification, making Indian MF investment more feasible
                for Canadian NRIs. However, there are still reporting requirements and tax implications to understand.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Foreign Property Reporting — Form T1135
                </h3>
                <p className="text-sm text-slate-600">
                  If the total cost of all your specified foreign property (including Indian mutual funds,
                  bank accounts, real estate, etc.) exceeds <strong>CAD 100,000</strong> at any time during
                  the year, you must report it on <strong>Form T1135</strong> (Foreign Income Verification
                  Statement) with your annual tax return. Failure to file can result in penalties of
                  $25/day (up to $2,500) plus potential additional penalties for gross negligence.
                </p>
              </div>

              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Taxation of Indian MF Gains in Canada
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    Indian mutual fund gains are treated as <strong>foreign income</strong> in Canada. Capital gains
                    from disposition of Indian MF units receive the standard Canadian capital gains treatment:
                    <strong> 50% inclusion rate</strong> — meaning only half the capital gain is added to your taxable income.
                  </p>
                  <p>
                    <strong>Note (2024 Budget):</strong> The 2024 Canadian Federal Budget proposed increasing the
                    capital gains inclusion rate to 66.67% for gains exceeding CAD 250,000 annually (for individuals).
                    As of early 2026, this proposal has faced legislative uncertainty. Verify the current inclusion
                    rate with your Canadian tax advisor.
                  </p>
                </div>
              </div>

              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> India-Canada DTAA
                </h3>
                <p className="text-sm text-slate-600">
                  The India-Canada DTAA allows Canadian residents to claim a <strong>foreign tax credit</strong> for
                  TDS deducted in India on mutual fund redemptions. You report the Indian MF gain as foreign income on
                  your Canadian return and claim the Indian TDS paid as a credit against Canadian tax on
                  <strong> Form T2209</strong> (Federal Foreign Tax Credits). This effectively avoids double taxation.
                </p>
              </div>

              <div className="card-base p-5 border-l-4 border-l-green-500 bg-green-50/30">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> No PFIC Equivalent
                </h3>
                <p className="text-sm text-slate-600">
                  Unlike the US, Canada does not classify Indian mutual funds as PFICs or any equivalent punitive
                  category. Indian MF gains are simply treated as foreign capital gains with the standard inclusion
                  rate. This makes Indian mutual fund investment <strong>significantly more practical</strong> for
                  Canadian NRIs than for their US-based counterparts.
                </p>
              </div>
            </div>

            <div className="card-base p-5 bg-amber-50/50 border-l-4 border-l-amber-500">
              <h4 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> AMC Restrictions for Canadian NRIs
              </h4>
              <p className="text-sm text-slate-600">
                Some Indian AMCs club US and Canada together when applying FATCA restrictions. As a Canadian
                NRI, you may face the same AMC-level rejections as US NRIs. Always confirm with the specific
                AMC or your distributor whether they accept investments from Canadian residents before
                initiating any transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 5: EUROPEAN RESIDENTS ═══════════ */}
      <section id="european-residents" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">5</span>
              <h2 className="text-2xl font-bold text-primary-700">
                European Residents (UK, Germany, France &amp; Others)
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              European countries generally have well-established DTAA frameworks with India, and most do not
              impose punitive regimes like the US PFIC on foreign fund holdings. However, each country has
              its own nuances. Indian mutual funds are classified as <strong>non-UCITS</strong> funds
              (they are not regulated under the EU&apos;s UCITS Directive), which may trigger higher tax
              rates or additional reporting in some jurisdictions.
            </p>

            <div className="space-y-6">
              {/* UK */}
              <div className="card-base p-5">
                <h3 className="text-lg font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Flag className="w-5 h-5" /> United Kingdom
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    Indian mutual fund gains are taxed as <strong>capital gains</strong> in the UK. The tax rate
                    depends on whether gains fall within the basic rate or higher rate band:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Basic rate taxpayer:</strong> 10% on gains (18% for residential property)</li>
                    <li><strong>Higher/additional rate taxpayer:</strong> 20% on gains (24% for property)</li>
                    <li><strong>Annual Exempt Amount:</strong> {'\u00A3'}3,000 per tax year (2024-25 onward, reduced from {'\u00A3'}6,000)</li>
                  </ul>
                  <p>
                    The <strong>India-UK DTAA</strong> allows you to claim the Indian TDS as a foreign tax credit
                    against your UK capital gains tax liability. Report Indian MF gains on the Capital Gains
                    pages of your Self Assessment tax return. Note: Indian MFs are treated as &quot;non-reporting
                    offshore funds&quot; in the UK, which means gains may be taxed as income (at higher rates) rather
                    than capital gains. Check the HMRC list of reporting funds.
                  </p>
                </div>
              </div>

              {/* Germany */}
              <div className="card-base p-5">
                <h3 className="text-lg font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Flag className="w-5 h-5" /> Germany
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    Germany applies its <strong>Investment Tax Act (Investmentsteuergesetz)</strong> to foreign fund
                    holdings, including Indian mutual funds. Key aspects:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Vorabpauschale (Advance Lump Sum):</strong> German tax law requires annual taxation
                      of a deemed minimum return on foreign fund holdings, even if you have not sold. This is
                      calculated using the German base interest rate multiplied by the fund&apos;s value at year-start.
                    </li>
                    <li>
                      <strong>Flat tax rate:</strong> Investment income (including fund gains) is taxed at a flat
                      <strong> 26.375%</strong> (25% Abgeltungsteuer + 5.5% Solidaritaetszuschlag), plus church tax
                      if applicable.
                    </li>
                    <li>
                      <strong>Teilfreistellung (Partial Exemption):</strong> Equity funds with &gt;51% equity allocation
                      qualify for a 30% partial exemption. Indian equity MFs with predominantly equity holdings
                      would likely qualify, effectively reducing the tax rate to approximately 18.5%.
                    </li>
                  </ul>
                  <p>
                    The India-Germany DTAA provides for foreign tax credit. Indian TDS can be credited against
                    German tax liability on the same income.
                  </p>
                </div>
              </div>

              {/* France */}
              <div className="card-base p-5">
                <h3 className="text-lg font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Flag className="w-5 h-5" /> France
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    France applies the <strong>PFU (Pr&eacute;l&egrave;vement Forfaitaire Unique)</strong>,
                    commonly known as the &quot;flat tax,&quot; to investment income:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Flat tax rate:</strong> 30% on investment income and capital gains (12.8% income tax +
                      17.2% social charges). This is the default treatment for Indian MF gains.
                    </li>
                    <li>
                      <strong>Progressive scale option:</strong> Taxpayers can opt to be taxed under the progressive
                      income tax scale instead of the flat tax if their marginal rate is below 12.8%. This election
                      applies to all investment income for the year.
                    </li>
                    <li>
                      <strong>No PFIC-like classification:</strong> France does not impose punitive regimes on
                      foreign fund holdings.
                    </li>
                  </ul>
                  <p>
                    The India-France DTAA provides for foreign tax credit. File the Indian TDS credit on
                    Form 2047 (D&eacute;claration des revenus encaiss&eacute;s &agrave; l&apos;&eacute;tranger).
                  </p>
                </div>
              </div>

              {/* UCITS Note */}
              <div className="card-base p-5 border-l-4 border-l-blue-500 bg-blue-50/30">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> UCITS vs Non-UCITS Classification
                </h4>
                <p className="text-sm text-slate-600">
                  Indian mutual funds are <strong>non-UCITS</strong> — they do not comply with the EU&apos;s
                  Undertakings for Collective Investment in Transferable Securities Directive. In some EU
                  countries, non-UCITS funds may face higher tax rates, limited loss offset rules, or
                  additional reporting requirements compared to UCITS-compliant funds. The impact varies
                  significantly by country — always consult a local tax advisor familiar with cross-border
                  fund taxation.
                </p>
              </div>

              {/* General EU */}
              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2">Other EU Countries</h3>
                <p className="text-sm text-slate-600">
                  Most EU countries tax foreign fund gains as capital gains or investment income. The key
                  provisions are generally consistent: (1) India deducts TDS on redemption, (2) the country
                  of residence taxes the global income, and (3) the DTAA between India and the specific country
                  provides for foreign tax credit to avoid double taxation. Countries with India DTAAs include
                  Netherlands, Belgium, Ireland, Italy, Spain, Sweden, Denmark, and many others. Always verify
                  the specific DTAA provisions for your country of residence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 6: UAE / GCC ═══════════ */}
      <section id="uae-gcc" className="section-padding bg-surface-100 scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">6</span>
              <h2 className="text-2xl font-bold text-primary-700">
                UAE / GCC Residents
              </h2>
            </div>

            {/* Key highlight */}
            <div className="card-base p-5 border-l-4 border-l-green-600 bg-green-50/40 mb-8">
              <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" /> No Personal Income Tax — But Indian TDS Still Applies
              </h3>
              <p className="text-sm text-slate-600">
                The UAE, Saudi Arabia, Qatar, Bahrain, Oman, and Kuwait do not levy personal income tax
                on individuals. However, this does <strong>not</strong> exempt you from Indian taxation.
                India taxes income earned within India (mutual fund gains are India-sourced income),
                and <strong>TDS is deducted at source by the AMC regardless of where you reside</strong>.
                The absence of local tax simply means there is no double taxation — but you still pay
                Indian tax in full.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Indian TDS — Full Impact
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    Since there is no local income tax in most GCC countries, there is no foreign tax credit
                    mechanism to offset the Indian TDS. This means the <strong>Indian TDS is your final tax cost</strong>.
                    The rates are:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Equity STCG (&lt; 12 months): 20% + surcharge + cess</li>
                    <li>Equity LTCG (&ge; 12 months): 12.5% + surcharge + cess (above {'\u20B9'}1.25L exemption)</li>
                    <li>Debt funds: 30% + surcharge + cess (at slab rate for NRIs)</li>
                  </ul>
                  <p>
                    Since GCC-based NRIs have no local tax liability, they should ensure they file an
                    Indian ITR to claim refund of any excess TDS. For instance, if your equity LTCG is
                    below {'\u20B9'}1.25 lakh, the entire TDS can be refunded.
                  </p>
                </div>
              </div>

              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> India-UAE DTAA Status
                </h3>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    India and the UAE have a <strong>limited DTAA</strong> that primarily covers exchange of
                    information and does not provide comprehensive relief for individual investors on capital gains.
                    As of FY 2025-26, there is <strong>no mechanism for UAE-based NRIs to claim Indian TDS as a
                    credit</strong> against any local tax (since there is none).
                  </p>
                  <p>
                    <strong>Key implication:</strong> GCC NRIs effectively bear the full burden of Indian TDS
                    with no offset. This makes it especially important to (a) utilize the LTCG exemption of
                    {'\u20B9'}1.25 lakh by staggering redemptions across financial years, and (b) file Indian ITR
                    to claim refund of excess TDS.
                  </p>
                </div>
              </div>

              <div className="card-base p-5">
                <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Repatriation from GCC
                </h3>
                <p className="text-sm text-slate-600">
                  Repatriation from NRE accounts is <strong>fully allowed without limit</strong>. Since most
                  GCC NRIs earn tax-free income locally, they typically invest through NRE accounts for
                  full repatriability. The NRE route is strongly recommended for GCC-based investors
                  planning to eventually repatriate funds.
                </p>
              </div>
            </div>

            {/* Country-wise GCC */}
            <div className="card-base overflow-hidden">
              <div className="bg-primary-700 text-white px-5 py-3">
                <h3 className="font-semibold text-sm">GCC Country-Wise Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-100 text-left">
                      <th className="px-5 py-3 font-semibold text-primary-700">Country</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Local Income Tax</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Indian TDS Applies?</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">DTAA with India</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {[
                      { country: 'UAE', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Limited scope' },
                      { country: 'Saudi Arabia', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Yes (limited)' },
                      { country: 'Qatar', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Yes' },
                      { country: 'Bahrain', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Yes' },
                      { country: 'Oman', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Yes' },
                      { country: 'Kuwait', localTax: 'Nil (0%)', tds: 'Yes, full rates', dtaa: 'Yes' },
                    ].map((row) => (
                      <tr key={row.country} className="hover:bg-surface-50">
                        <td className="px-5 py-3 font-medium text-primary-700">{row.country}</td>
                        <td className="px-5 py-3 text-green-600 font-medium">{row.localTax}</td>
                        <td className="px-5 py-3 text-red-600 font-medium">{row.tds}</td>
                        <td className="px-5 py-3 text-slate-600">{row.dtaa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Practical Example */}
            <div className="card-base p-5 mt-6">
              <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Practical Example: UAE NRI Equity MF Redemption
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  <strong>Scenario:</strong> A Dubai-based NRI invested {'\u20B9'}20,00,000 in an equity mutual
                  fund 3 years ago. Current value: {'\u20B9'}30,00,000 — gain of {'\u20B9'}10,00,000.
                </p>
                <p>
                  <strong>Indian Tax:</strong> LTCG (holding &gt; 12 months). Taxable gain = {'\u20B9'}10,00,000 &minus;
                  {'\u20B9'}1,25,000 (exemption) = {'\u20B9'}8,75,000. Tax at 12.5% = {'\u20B9'}1,09,375 + 4% cess = {'\u20B9'}1,13,750.
                </p>
                <p>
                  <strong>TDS Deducted:</strong> AMC deducts TDS at 12.5% on full gain of {'\u20B9'}10,00,000 = {'\u20B9'}1,25,000 + cess.
                </p>
                <p>
                  <strong>UAE Tax:</strong> {'\u20B9'}0 (no personal income tax).
                </p>
                <p>
                  <strong>Net Impact:</strong> The NRI files Indian ITR and claims refund of excess TDS
                  (difference between TDS on {'\u20B9'}10L and actual tax on {'\u20B9'}8.75L). No double taxation since
                  UAE does not tax. <strong>Effective tax cost: approximately {'\u20B9'}1,13,750 or 11.4% on gains.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 7: DTAA TABLE ═══════════ */}
      <section id="dtaa" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">7</span>
              <h2 className="text-2xl font-bold text-primary-700">
                DTAA (Double Tax Avoidance Agreements) — Key Countries
              </h2>
            </div>

            <div className="text-slate-600 text-sm space-y-3 leading-relaxed mb-8">
              <p>
                India has signed DTAAs with over 90 countries. These agreements determine which country has
                the right to tax specific types of income and provide mechanisms (primarily Foreign Tax Credits)
                to prevent the same income from being taxed twice. For NRI mutual fund investors, the DTAA
                provisions on <strong>capital gains</strong> and <strong>dividends</strong> are most relevant.
              </p>
            </div>

            <div className="card-base overflow-hidden mb-8">
              <div className="bg-primary-700 text-white px-5 py-3">
                <h3 className="font-semibold text-sm">DTAA Summary — Capital Gains &amp; Dividend Treatment</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-100 text-left">
                      <th className="px-4 py-3 font-semibold text-primary-700">Country</th>
                      <th className="px-4 py-3 font-semibold text-primary-700">DTAA</th>
                      <th className="px-4 py-3 font-semibold text-primary-700">Capital Gains Treatment</th>
                      <th className="px-4 py-3 font-semibold text-primary-700">Dividend Treatment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {[
                      {
                        country: 'USA',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, foreign tax credit in US (Form 1116)',
                        dividends: 'Taxed in India (10% TDS under treaty rate)',
                      },
                      {
                        country: 'Canada',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, foreign tax credit in Canada (Form T2209)',
                        dividends: '15% treaty rate',
                      },
                      {
                        country: 'UK',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, credit available in UK (Self Assessment)',
                        dividends: '15% treaty rate',
                      },
                      {
                        country: 'Singapore',
                        dtaa: 'Yes',
                        capGains: 'May be taxed only in country of residence (Article 13)',
                        dividends: '15% treaty rate',
                      },
                      {
                        country: 'UAE',
                        dtaa: 'Limited',
                        capGains: 'Taxed in India (no local tax to offset)',
                        dividends: 'Taxed in India (no local tax)',
                      },
                      {
                        country: 'Australia',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, credit in Australia (Foreign Income Tax Offset)',
                        dividends: '15% treaty rate',
                      },
                      {
                        country: 'Germany',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, credit in Germany (Anrechnung)',
                        dividends: '10% treaty rate',
                      },
                      {
                        country: 'France',
                        dtaa: 'Yes',
                        capGains: 'Taxed in India, credit in France (Form 2047)',
                        dividends: '10% treaty rate',
                      },
                    ].map((row) => (
                      <tr key={row.country} className="hover:bg-surface-50">
                        <td className="px-4 py-3 font-medium text-primary-700">{row.country}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            row.dtaa === 'Yes' ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {row.dtaa}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.capGains}</td>
                        <td className="px-4 py-3 text-slate-600">{row.dividends}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-base p-5 border-l-4 border-l-blue-500 bg-blue-50/30">
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> How to Claim DTAA Benefits
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  To claim DTAA benefits and avoid double taxation, NRI investors should:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Obtain <strong>TDS certificate (Form 16A)</strong> from the Indian AMC after each financial year</li>
                  <li>Report the Indian MF income on your <strong>country-of-residence tax return</strong> as foreign income</li>
                  <li>Claim the Indian TDS as a <strong>foreign tax credit</strong> using the appropriate form in your country</li>
                  <li>Obtain a <strong>Tax Residency Certificate (TRC)</strong> from your country if required by Indian authorities</li>
                  <li>Submit <strong>Form 10F</strong> to the Indian AMC to claim beneficial DTAA rates at the time of TDS deduction</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 8: PRACTICAL STEPS ═══════════ */}
      <section id="practical-steps" className="section-padding bg-surface-100 scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">8</span>
              <h2 className="text-2xl font-bold text-primary-700">
                Practical Steps for NRI Mutual Fund Investors
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Whether you are a first-time NRI investor or looking to optimize your existing Indian MF portfolio,
              follow this checklist to ensure you are compliant and tax-efficient.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  step: 1,
                  title: 'Complete KYC with NRI Status',
                  desc: 'Submit your KYC application specifically as an NRI (not resident). You will need: valid passport, overseas address proof, PAN card, and recent photograph. CKYC registration is now the standard. Many AMCs and platforms accept online KYC for NRIs.',
                  icon: FileText,
                },
                {
                  step: 2,
                  title: 'Open NRE / NRO Bank Account',
                  desc: 'Open an NRE account (for fully repatriable investments) or NRO account (for non-repatriable Indian income) with an Indian bank. Most major banks offer NRI account opening online or through overseas branches. NRE is recommended for most NRI investors.',
                  icon: Landmark,
                },
                {
                  step: 3,
                  title: 'Choose AMCs That Accept NRIs from Your Country',
                  desc: 'Not all AMCs accept NRIs from all countries. US/Canada NRIs face the most restrictions due to FATCA. Verify acceptance before investing. Your mutual fund distributor can help identify compliant AMCs for your specific country of residence.',
                  icon: MapPin,
                },
                {
                  step: 4,
                  title: 'Understand TDS Implications Before Investing',
                  desc: 'Know the TDS rates for your investment type (equity vs debt, STCG vs LTCG). Factor in the TDS cash flow impact — your redemption proceeds will be lower than expected. Plan redemptions to utilize the LTCG exemption of Rs 1.25 lakh per financial year.',
                  icon: IndianRupee,
                },
                {
                  step: 5,
                  title: 'Maintain Records for Foreign Tax Credit',
                  desc: 'Keep copies of all TDS certificates (Form 16A), investment statements, and transaction records. These are essential for claiming foreign tax credits in your country of residence. Digital record-keeping is recommended.',
                  icon: FileText,
                },
                {
                  step: 6,
                  title: 'File Indian ITR Every Year',
                  desc: 'If TDS has been deducted on your mutual fund redemptions, filing an Indian ITR is mandatory. Even if you have no refund to claim, filing ensures compliance and creates a documented trail. Use ITR-2 for NRIs with capital gains income.',
                  icon: Calendar,
                },
                {
                  step: 7,
                  title: 'Report Holdings in Country of Residence',
                  desc: 'FBAR (US), T1135 (Canada), Self Assessment (UK), and equivalent forms in other countries — report your Indian MF holdings as required. Non-reporting can result in severe penalties that far exceed any tax saving.',
                  icon: Globe,
                },
                {
                  step: 8,
                  title: 'Consult Both Indian CA and Local Tax Advisor',
                  desc: 'NRI taxation is inherently cross-border. You need an Indian Chartered Accountant familiar with NRI provisions AND a tax advisor in your country of residence who understands DTAA, foreign tax credits, and local reporting requirements. Do not rely on a single advisor.',
                  icon: Users,
                },
              ].map((item) => (
                <div key={item.step} className="card-base p-5 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-700 mb-1 flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-primary-500" /> {item.title}
                    </h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 9: REGULATORY CHANGES TIMELINE ═══════════ */}
      <section id="regulatory-changes" className="section-padding bg-white scroll-mt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">9</span>
              <h2 className="text-2xl font-bold text-primary-700">
                Recent Regulatory Changes Affecting NRI MF Investors
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              The Indian tax and regulatory landscape for NRI mutual fund investors has evolved significantly
              over the past decade. Here is a timeline of the most impactful changes:
            </p>

            <div className="relative border-l-2 border-primary-200 ml-5 space-y-8">
              {[
                {
                  year: 'FY 2025-26',
                  title: 'Updated TDS Rates Post-Budget 2024',
                  desc: 'Union Budget 2024 revised capital gains tax structure: Equity LTCG rate changed to 12.5% (from 10%), STCG to 20% (from 15%). LTCG exemption increased to Rs 1.25 lakh (from Rs 1 lakh). These changes apply to NRI TDS rates as well. Holding period for equity LTCG remains 12 months.',
                  color: 'bg-green-500',
                },
                {
                  year: 'FY 2023-24',
                  title: 'Debt Fund Indexation Benefit Removed',
                  desc: 'From April 2023, gains from debt mutual funds (with less than 65% equity) are taxed at the investor\'s slab rate regardless of holding period. The long-standing indexation benefit for long-term debt fund gains was eliminated. For NRIs, this means TDS at 30% (or applicable slab rate) on all debt fund gains.',
                  color: 'bg-red-500',
                },
                {
                  year: '2022',
                  title: 'Updated FATCA Reporting Requirements',
                  desc: 'Enhanced FATCA reporting standards implemented, requiring Indian AMCs to provide more detailed account-level information to the IRS and other treaty partners. This led some additional AMCs to stop accepting US/Canada NRI investments.',
                  color: 'bg-blue-500',
                },
                {
                  year: '2020',
                  title: 'DDT Removed — Dividends Now Taxed at NRI Slab with TDS',
                  desc: 'Until FY 2019-20, mutual fund dividends were subject to Dividend Distribution Tax (DDT) paid by the fund house. From FY 2020-21, dividends became taxable in the hands of the investor. For NRIs, this means TDS at 20% is deducted on all mutual fund dividend payments. DTAA rates may reduce this (e.g., 10-15% under most treaties).',
                  color: 'bg-amber-500',
                },
                {
                  year: '2017',
                  title: 'Aadhaar Linking Rules for NRIs',
                  desc: 'Aadhaar-PAN linking became mandatory for tax filing. NRIs who do not have Aadhaar were initially impacted, but subsequent clarifications confirmed that NRIs are exempt from Aadhaar requirements if they do not have one. PAN remains the primary identifier for NRI MF investments.',
                  color: 'bg-purple-500',
                },
                {
                  year: '2016',
                  title: 'FATCA / CRS Reporting Introduced',
                  desc: 'India adopted the Common Reporting Standard (CRS) and enhanced FATCA compliance. All financial institutions, including AMCs, began collecting and reporting information about account holders who are tax residents of other countries. NRI investors must now provide self-certification of tax residency status.',
                  color: 'bg-slate-500',
                },
              ].map((event) => (
                <div key={event.year} className="relative pl-8">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${event.color} border-2 border-white`} />
                  <div className="card-base p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-white bg-primary-700 px-2 py-0.5 rounded">{event.year}</span>
                      <h3 className="font-semibold text-primary-700">{event.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="card-base p-8 lg:p-10 text-center">
              <h2 className="text-2xl font-bold text-primary-700 mb-3">
                Need Help with NRI Mutual Fund Investments?
              </h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                Trustner Asset Services (ARN-286886) assists NRI investors across the US, Canada, UK, Europe,
                UAE, and GCC countries with mutual fund investments in India. Our team understands the
                cross-border taxation complexities and can help you invest efficiently.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-primary-800 transition-colors"
                >
                  Contact Our NRI Desk <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/resources/taxation"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-primary-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Indian Taxation Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <section className="section-padding bg-white border-t border-surface-200">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="card-base p-6 bg-amber-50/50 border border-amber-200">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Important Disclaimer
              </h3>
              <div className="text-xs text-amber-900/80 space-y-2">
                <p>
                  This guide is provided for <strong>educational and informational purposes only</strong>. It does
                  not constitute tax advice, legal advice, or financial advice. Tax laws and DTAA provisions are
                  complex, subject to change, and vary based on individual circumstances.
                </p>
                <p>
                  <strong>NRI investors must consult qualified professionals</strong> — an Indian Chartered Accountant
                  for Indian tax matters, and a CPA (US), CA (Canada), tax advisor (UK/EU), or equivalent professional
                  in their country of residence for local tax implications. The information in this guide is based
                  on tax laws and regulations as understood as of FY 2025-26 and may not reflect subsequent changes.
                </p>
                <p>
                  Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before
                  investing. Past performance is not indicative of future results.
                </p>
                <p>
                  <strong>Trustner Asset Services Pvt. Ltd.</strong> | AMFI Registered Mutual Fund Distributor |
                  ARN-286886 | EUIN: E092119
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
