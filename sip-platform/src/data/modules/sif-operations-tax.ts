import { LearningModule } from '@/types/learning';

export const sifOperationsTaxModule: LearningModule = {
  id: 'sif-operations-tax',
  title: 'SIF Operations, Tax & Compliance',
  slug: 'sif-operations-tax',
  icon: 'Layers',
  description:
    'The operational lifecycle of a SIF investment — from subscription and KYC, through ongoing reporting, periodic redemption, tax computation under post-FY24 rules, and the distributor compliance framework that governs every transaction.',
  level: 'intermediate',
  color: 'from-indigo-600 to-purple-600',
  estimatedTime: '35 min',
  track: 'sif',
  sections: [
    {
      id: 'sif-subscription-kyc',
      title: 'SIF Subscription, KYC & Suitability Assessment',
      slug: 'sif-subscription-kyc',
      content: {
        definition:
          'SIF subscription requires the investor to complete KYC at the AMC, demonstrate eligibility through a suitability assessment confirming the ₹10 lakh investment is appropriate to their financial circumstances, and execute the subscription through an AMFI-registered SIF distributor or directly with the AMC. SEBI mandates a more rigorous suitability framework for SIFs than for standard mutual funds, given the strategic complexity and higher minimum.',
        explanation:
          'The SIF subscription process layers three checks on top of a standard mutual fund subscription. First, KYC verification — the investor\'s PAN, address proof, and bank-account proof are validated against the existing KYC registries (CKYCRR or CVL/KRA). For NRIs, FATCA and CRS declarations are additionally required. Second, suitability assessment — the AMC or distributor collects information on the investor\'s overall liquid wealth, prior investment experience with similar strategies (long-short, derivatives, hedge-style), risk tolerance through a structured questionnaire, and investment horizon. SEBI requires that the SIF distributor confirm in writing that the SIF is suitable for the investor\'s circumstances; over-concentration risk is the primary mis-sale flag (an investor with ₹15 lakh net wealth being subscribed to a ₹10 lakh SIF). Third, payout setup — the investor designates a bank account for redemption proceeds and confirms the payment mode for the subscription (wire transfer for amounts above ₹10 lakh, no cheque or cash). For Trustner-facilitated SIF subscriptions, the Relationship Manager handles all three steps as a single client-facing interaction, with documentation completed digitally where possible. The end-to-end onboarding takes 5-10 working days, depending on KYC status (existing KYC investors complete faster) and the AMC\'s operational efficiency. After subscription, the investor receives a Statement of Account (SoA) confirming the units allotted at the applicable NAV, and ongoing monthly factsheets and quarterly reports detailing portfolio composition, performance attribution, and risk metrics.',
        realLifeExample:
          'Take Rahul, 45, with ₹2.5 crore liquid wealth and 8 years of mutual fund + 3 years of PMS investing experience. He decides to subscribe ₹15 lakh to a long-short equity SIF through Trustner. Step 1: His existing KYC at CVL is current (last refreshed 2 years ago), so KYC validates instantly via the AMC\'s online portal. Step 2: His Trustner Relationship Manager runs the suitability assessment — captures his ₹2.5 crore total liquid wealth, his prior PMS experience, his moderate-aggressive risk profile, and his 5-7 year investment horizon. The ₹15 lakh SIF allocation is 6% of his liquid wealth — well within the recommended 10-20% range. Suitability documentation is completed digitally via a structured form. Step 3: ₹15 lakh wire transfer initiated to the AMC\'s collection account. Two working days later, units are allotted at the day\'s NAV, and Rahul receives the SoA via email. The Trustner RM schedules a quarterly review calendar entry. Total elapsed time from decision to allotment: 4 working days.',
        keyPoints: [
          'Three checks: KYC verification, suitability assessment, payout setup.',
          'KYC validation via CKYCRR or CVL/KRA; FATCA/CRS for NRIs.',
          'Suitability assessment: total wealth, prior experience, risk tolerance, horizon.',
          'Distributor confirms suitability in writing; over-concentration is primary mis-sale flag.',
          'Subscription mode: wire transfer for ₹10 lakh+; no cheque/cash.',
          'End-to-end onboarding: 5-10 working days typically (4 days for existing KYC).',
          'Post-subscription: SoA at allotment, monthly factsheets, quarterly reports.',
        ],
        faq: [
          {
            question: 'Can I refresh my KYC during SIF subscription?',
            answer:
              'Yes, if your KYC is more than 5 years old or your details (address, name, contact) have changed since last KYC. The AMC or distributor will process a KYC update concurrently with the subscription, adding 2-4 working days to the timeline. For investors with current and accurate KYC, no refresh is needed.',
          },
          {
            question: 'What documentation do I receive after subscription?',
            answer:
              'You receive: (a) Statement of Account (SoA) within 2 days of allotment confirming units allotted, NAV, and folio number; (b) Monthly factsheet with portfolio top holdings, sector allocation, and YTD performance; (c) Quarterly portfolio statement with full holdings (with regulatory lag), performance attribution, and risk metrics; (d) Annual capital gains statement for tax purposes; (e) Annual report and audited financials.',
          },
          {
            question: 'Can I subscribe to a SIF through a SIP?',
            answer:
              'Generally no — most SIFs require lumpsum subscription at the ₹10 lakh minimum. Some AMCs may offer staggered or systematic-transfer-plan (STP) options where the investor parks ₹10 lakh in a liquid fund and transfers periodically into the SIF, but this is scheme-specific. Standard SIPs (₹500-₹50,000 monthly) are not available for SIFs.',
          },
          {
            question: 'What happens if I fail the suitability assessment?',
            answer:
              'The distributor cannot facilitate the SIF subscription if the suitability assessment indicates clear over-concentration or lack of investor sophistication. In such cases, the Trustner Relationship Manager will recommend alternative structures (mutual funds, hybrid funds) that are suitable. SEBI rules explicitly prohibit pushing SIFs to investors who do not meet the suitability framework — this is a regulatory protection, not a sales obstacle.',
          },
        ],
        mcqs: [
          {
            question: 'The three onboarding checks for a SIF subscription are:',
            options: [
              'KYC, suitability, payout',
              'PAN, Aadhaar, photo',
              'Bank statement, salary slip, ITR',
              'Distributor agreement, scheme document, broker',
            ],
            correctAnswer: 0,
            explanation:
              'SIF onboarding layers three checks: KYC verification, suitability assessment confirming the SIF is appropriate to the investor\'s circumstances, and payout setup for redemption proceeds.',
          },
          {
            question: 'Suitability assessment for SIFs is primarily designed to flag:',
            options: ['Tax issues', 'Over-concentration risk', 'Distributor issues', 'NAV calculation errors'],
            correctAnswer: 1,
            explanation:
              'The primary mis-sale flag is over-concentration — an investor with insufficient overall liquid wealth being subscribed to a ₹10 lakh SIF that absorbs an inappropriately large share of their portfolio. Distributors are SEBI-mandated to flag this.',
          },
          {
            question: 'A standard SIP (₹500-₹50,000 monthly) is:',
            options: [
              'Available for all SIFs',
              'Generally NOT available for SIFs (which require lumpsum subscription at minimum)',
              'Only for large-cap SIFs',
              'Mandatory for all SIFs',
            ],
            correctAnswer: 1,
            explanation:
              'Standard mutual fund SIPs are generally not available for SIFs. SIFs require lumpsum subscription at the ₹10 lakh minimum. Some AMCs offer systematic-transfer-plan options as alternatives.',
          },
        ],
        summaryNotes: [
          'Three checks: KYC, suitability, payout setup.',
          'Onboarding: 4-10 working days; existing KYC investors faster.',
          'Documentation: SoA, monthly factsheet, quarterly portfolio, annual statements.',
          'No standard SIPs — lumpsum subscription at ₹10 lakh minimum.',
        ],
        relatedTopics: ['sif-tax-distribution', 'sif-redemption-liquidity', 'sif-tax-computation'],
      },
    },

    {
      id: 'sif-redemption-liquidity',
      title: 'SIF Redemption Mechanics & Liquidity Windows',
      slug: 'sif-redemption-liquidity',
      content: {
        definition:
          'SIF redemption mechanics and liquidity terms vary by scheme. Some SIFs offer T+2 redemption similar to open-ended mutual funds; others operate on a fortnightly, monthly, or quarterly redemption-window basis with prior notice requirements. The fund\'s underlying strategy and the inherent liquidity of long and short positions drive the choice of redemption framework, which is disclosed upfront in the offer document.',
        explanation:
          'For a SIF investor, redemption planning is a critical operational consideration that differs materially from a standard open-ended mutual fund. Three primary frameworks exist. First, daily-redemption SIFs operate similarly to open-ended mutual funds — the investor submits a redemption request, and the AMC processes the redemption at the day\'s NAV with proceeds credited to the registered bank account in T+2 working days. This works for SIFs whose underlying strategy is liquid (e.g., predominantly large-cap equity LS via futures, where positions can be unwound within a single trading day). Second, fortnightly or monthly redemption-window SIFs operate on a defined cycle — redemption requests are accepted only during specific notice periods (e.g., the 15th of every month) and processed on the redemption date (e.g., the last day of the month). The notice period gives the manager time to systematically unwind positions to meet redemption demand without market-impact pressure. Third, quarterly redemption-window SIFs operate on a longer cycle — quarterly redemption dates with 30-90 day prior notice. This applies to SIFs with strategies where positions take time to unwind (e.g., concentrated mid-cap longs, complex pair trades, or fixed-income spread positions). Investors must match their personal liquidity needs to the SIF\'s redemption framework. For a SIF with ₹15 lakh allocated, the investor must be comfortable that the entire ₹15 lakh is illiquid for the duration between redemption windows. Capital invested in a quarterly-redemption SIF cannot be accessed in a 1-month emergency without paying potentially significant exit penalties (where applicable) or simply waiting for the next window. Trustner\'s framework explicitly walks investors through this trade-off during the suitability assessment.',
        realLifeExample:
          'Compare two hypothetical SIFs. SIF Alpha is an Equity LS strategy primarily using stock futures and large-cap longs; positions can be unwound in 1 trading day. Redemption framework: T+2 daily, similar to mutual funds. SIF Beta is a Hybrid LS with 40% Debt LS using illiquid spread trades that require 5-10 days to unwind cleanly. Redemption framework: monthly window with 15-day notice, settlement on month-end. Investor Vikram allocates ₹15 lakh to SIF Alpha for tactical exposure he may need to unwind quickly; he allocates ₹25 lakh to SIF Beta for longer-term hedged exposure where he commits to monthly liquidity at most. After 8 months, his daughter\'s university fees come due unexpectedly. Vikram redeems ₹15 lakh from SIF Alpha (proceeds in 2 days). For the SIF Beta allocation, he submits a partial redemption notice on the 1st of the month; ₹10 lakh redeems on month-end (15-day notice satisfied). The remaining ₹15 lakh in SIF Beta stays invested. By matching his SIF allocations to the corresponding liquidity terms, Vikram avoids forced redemptions or unmet liquidity needs. This is the operationally correct framework.',
        keyPoints: [
          'Three redemption frameworks: daily T+2, monthly window, quarterly window.',
          'Daily T+2: works for liquid strategies (large-cap equity LS via futures).',
          'Monthly window: 15-30 day notice; settlement on month-end.',
          'Quarterly window: 30-90 day notice; settlement on quarter-end.',
          'Match personal liquidity needs to scheme\'s redemption framework before subscribing.',
          'Capital between redemption windows is genuinely illiquid — emergency access not available.',
          'Some SIFs charge exit loads on early/penalty redemptions; check offer document.',
        ],
        faq: [
          {
            question: 'Are SIF exit loads similar to mutual fund exit loads?',
            answer:
              'Concept is similar — a small percentage charged on redemption within a defined holding period. SIF exit loads vary by scheme but typically range from 0.5-2% if redemption occurs within the first 12-24 months, declining to zero thereafter. Some redemption-window SIFs additionally have penalties for redemptions executed outside the regular window. Always read the offer document\'s exit-load section.',
          },
          {
            question: 'Can I switch between two SIF schemes of the same AMC?',
            answer:
              'Some AMCs offer inter-scheme switching within their SIF range (similar to mutual fund switching), subject to scheme rules. The switch creates a tax event — the existing SIF unit is deemed redeemed and the proceeds reinvested in the new SIF. Tax on capital gains is triggered. Switching is operationally simpler than redemption-and-fresh-subscription but the tax implication is the same.',
          },
          {
            question: 'What if the SIF\'s NAV crashes between my redemption notice and settlement?',
            answer:
              'Redemption is processed at the NAV on the redemption settlement date — not the date you submitted the notice. If the NAV drops between notice and settlement (e.g., a 20-day notice period during which the market corrects 8%), you bear the loss as the NAV used for redemption reflects the lower value. This is the structural risk of notice-based redemption windows. Daily T+2 SIFs avoid this risk because settlement happens within 2 days.',
          },
          {
            question: 'Do redemption-window SIFs have higher returns to compensate for illiquidity?',
            answer:
              'Sometimes — illiquidity premium is a real concept. Strategies that require longer position-unwinding time can pursue thinner-traded opportunities and capture spreads that more liquid strategies cannot. However, this is not universal; some redemption-window SIFs have similar return profiles to daily-redemption SIFs because the manager simply prefers the operational discipline of windows. Evaluate each SIF on its merits — the redemption framework is one input, not a return guarantee.',
          },
        ],
        mcqs: [
          {
            question: 'A monthly-window redemption SIF typically requires:',
            options: [
              'No notice — daily redemption available',
              '15-30 day prior notice',
              '6 months prior notice',
              'Quarterly notice only',
            ],
            correctAnswer: 1,
            explanation:
              'Monthly-window SIFs typically require 15-30 days prior notice for redemption requests, with settlement on the month-end redemption date. This gives the manager time to unwind positions systematically.',
          },
          {
            question: 'In a notice-based redemption window, NAV used for settlement is:',
            options: [
              'NAV on the date of notice submission',
              'NAV on the redemption settlement date',
              'Average of notice date and settlement date',
              'Highest NAV during the period',
            ],
            correctAnswer: 1,
            explanation:
              'Redemption is processed at the NAV on the settlement date, not the notice date. If NAV moves during the notice period, the investor bears the gain or loss. This is a structural feature of notice-based windows.',
          },
          {
            question: 'Daily-redemption (T+2) SIFs typically run strategies with:',
            options: [
              'Highly illiquid pair trades',
              'Liquid underlying instruments (e.g., large-cap stock futures)',
              'Real estate exposure',
              'Concentrated micro-cap stocks',
            ],
            correctAnswer: 1,
            explanation:
              'Daily T+2 SIFs work when the underlying strategy holds liquid instruments (large-cap stocks, index futures, government bonds) that can be unwound within a single trading day. Illiquid strategies require longer redemption windows.',
          },
        ],
        summaryNotes: [
          'Three redemption frameworks: T+2 daily, monthly window, quarterly window.',
          'Match personal liquidity to scheme framework — capital between windows is illiquid.',
          'NAV at settlement date applies; notice-period market moves are borne by investor.',
          'Exit loads typically 0.5-2% within first 12-24 months.',
        ],
        relatedTopics: ['sif-subscription-kyc', 'sif-tax-computation', 'sif-tax-distribution'],
      },
    },

    {
      id: 'sif-tax-computation',
      title: 'SIF Tax Computation — Worked Examples',
      slug: 'sif-tax-computation',
      content: {
        definition:
          'SIF tax computation depends on the underlying asset mix per CBDT classification. Equity-classified SIFs (65%+ in domestic equity, including derivative exposure mapped to equity) attract STCG at 20% (units held under 12 months) and LTCG at 12.5% on gains exceeding ₹1.25 lakh per FY (units held over 12 months). Non-equity-classified SIFs attract slab-rate tax on capital gains regardless of holding period under post-FY24 rules.',
        explanation:
          'Tax computation follows the asset-mix classification disclosed in the SID and as actually maintained in practice. Worked example for an equity-classified Equity LS SIF: Investor subscribes ₹20 lakh in May 2026 at NAV ₹10, allotted 2,00,000 units. In May 2028 (24 months later), NAV is ₹12.50; investor redeems all units. Redemption proceeds: ₹25 lakh. Capital gain: ₹5 lakh. Holding period: 24 months — qualifies as LTCG. First ₹1.25 lakh of equity LTCG in the FY is exempt; remaining ₹3.75 lakh attracts 12.5% LTCG tax = ₹46,875 (excluding cess). Net realised: ₹25 lakh − ₹46,875 = ₹24,53,125. Comparison: same investor in a debt-classified Hybrid LS SIF at 30% slab would pay slab-rate tax on the entire ₹5 lakh gain regardless of holding period (post-FY24) = ₹1,50,000 (excluding cess). Net realised: ₹23,50,000. The tax delta between equity-classified and debt-classified is approximately ₹1,03,125 on a ₹5 lakh gain — material at scale. This is why investors should understand the SIF\'s tax classification before subscribing. Within the holding period, the SIF\'s monthly factsheet typically discloses the average asset mix to confirm whether the equity-classified threshold of 65%+ is being maintained. If a SIF crosses below 65% domestic equity for an extended period, its tax classification may change to non-equity, with slab-rate treatment from that point forward. For the investor, partial redemption mechanics also matter. If the investor redeems half the units after 14 months (qualifies as LTCG under equity-fund tax) and half after 24 months, each redemption is treated separately. The first ₹1.25 lakh exemption applies to the AGGREGATE equity LTCG in the financial year — not per redemption. Annual tax planning across multiple SIFs and mutual funds is therefore relevant; investors should consult their CA for FY-end review.',
        realLifeExample:
          'Worked example for a partial redemption: Investor subscribes ₹30 lakh to an equity-classified Equity LS SIF in April 2026 at NAV ₹100, allotted 30,000 units. In November 2027 (19 months later), NAV is ₹120; investor redeems 15,000 units (₹18 lakh proceeds). Cost basis: ₹15 lakh. LTCG: ₹3 lakh. In the same FY (FY28), investor also redeems ₹2 lakh of equity LTCG from a flexi-cap mutual fund. Aggregate equity LTCG for FY28: ₹5 lakh. Exemption: ₹1.25 lakh. Taxable: ₹3.75 lakh. LTCG @ 12.5% = ₹46,875. The Health and Education Cess @ 4% adds ₹1,875. Total tax: ₹48,750. The investor\'s net post-tax realisation across the two redemptions: ₹20 lakh (gross gains) − ₹48,750 (tax) = ₹19,51,250. Annual tax planning matters — staggering redemptions across financial years can preserve the ₹1.25 lakh exemption each year, optimising effective tax rate across multi-year horizons.',
        keyPoints: [
          'Equity-classified SIFs (65%+ domestic equity): STCG 20%, LTCG 12.5% over ₹1.25 lakh exemption.',
          'Non-equity-classified SIFs: slab-rate tax on gains regardless of holding period (post-FY24).',
          'Tax classification confirmed via SID and monthly factsheet asset-mix disclosure.',
          'Partial redemptions: each redemption separate; ₹1.25 lakh exemption is aggregate per FY.',
          'Annual tax planning: staggering redemptions across FYs preserves annual exemption.',
          'Health & Education Cess @ 4% applies on top of headline tax rates.',
          'Always reconcile capital gains statement with broker/AMC records before filing.',
        ],
        faq: [
          {
            question: 'Can I claim indexation benefit on a debt-classified SIF held for 5 years?',
            answer:
              'No — post-FY24 (Finance Act 2023), indexation is no longer available on non-equity-classified mutual funds and SIFs. Capital gains are taxed at slab rate regardless of holding period. The previous 36-month holding period for LTCG with indexation has been eliminated for these structures.',
          },
          {
            question: 'How is TDS handled on SIF redemptions?',
            answer:
              'For resident investors, no TDS is deducted on SIF redemptions — the investor reports capital gains directly in their personal tax return. For NRIs, TDS is deducted at the applicable LTCG/STCG rate (or slab rate for non-equity) at the time of redemption; the NRI claims this against their final tax liability.',
          },
          {
            question: 'What if the SIF distributes income (dividends) during the year?',
            answer:
              'Dividend distributions from a SIF are taxable in the investor\'s hands at slab rate, similar to mutual fund dividend distributions. This is in addition to the capital gains tax on redemption. SIFs that distribute regularly are typically less tax-efficient for high-bracket investors than growth-option SIFs that compound within the fund.',
          },
          {
            question: 'How are SIF capital gains reported in ITR?',
            answer:
              'Capital gains from SIFs are reported in Schedule CG of ITR-2 or ITR-3, separately for equity-classified (with LTCG/STCG split) and non-equity-classified (with slab-rate amounts). The annual capital gains statement provided by the AMC details each redemption transaction with cost basis, holding period, and gain category. CA support is recommended for investors with multiple SIF and mutual fund redemptions across the year.',
          },
        ],
        mcqs: [
          {
            question:
              'An investor in the 30% slab redeems ₹3 lakh of LTCG from a debt-classified SIF held 24 months. Tax is approximately:',
            options: ['₹37,500 (12.5% LTCG)', '₹90,000 (slab rate)', 'Zero', '₹15,000 (20% with indexation)'],
            correctAnswer: 1,
            explanation:
              'Post-FY24, debt-classified SIFs attract slab-rate tax on capital gains regardless of holding period. At 30% slab, ₹3 lakh of gain attracts ₹90,000 in tax (excluding cess and surcharge).',
          },
          {
            question: 'The annual ₹1.25 lakh equity LTCG exemption is:',
            options: [
              'Per redemption transaction',
              'Per fund / per scheme',
              'Aggregate across all equity LTCG in the financial year',
              'Per investor lifetime',
            ],
            correctAnswer: 2,
            explanation:
              'The ₹1.25 lakh equity LTCG exemption is an aggregate across all equity LTCG in the investor\'s financial year — not per redemption or per scheme. This is why annual tax planning across multiple equity holdings is important.',
          },
          {
            question: 'For NRIs redeeming SIF units, TDS is:',
            options: [
              'Not applicable',
              'Deducted by the AMC at applicable rate at time of redemption',
              'Deducted by the broker',
              'Self-declared by the NRI',
            ],
            correctAnswer: 1,
            explanation:
              'For NRIs, the AMC deducts TDS at the applicable LTCG/STCG rate (or slab rate for non-equity) at the time of redemption. The NRI then claims this against their final tax liability when filing their Indian tax return.',
          },
        ],
        summaryNotes: [
          'Equity-classified: STCG 20%, LTCG 12.5% over ₹1.25 lakh exemption.',
          'Non-equity-classified: slab-rate tax on gains regardless of holding period (post-FY24).',
          'Annual ₹1.25 lakh exemption is aggregate across equity LTCG in the FY.',
          'NRIs face TDS at redemption; residents self-report.',
          'Annual tax planning across SIFs and mutual funds preserves exemption efficiency.',
        ],
        relatedTopics: ['sif-tax-distribution', 'sif-redemption-liquidity', 'sif-subscription-kyc'],
      },
    },

    {
      id: 'sif-distributor-compliance',
      title: 'SIF Distributor Compliance Framework',
      slug: 'sif-distributor-compliance',
      content: {
        definition:
          'The SIF distributor compliance framework requires AMFI registration as a SIF Distributor (separate from standard mutual fund distribution registration), enhanced suitability assessment for every prospective subscriber, written disclosure of fees and conflicts to the investor, ongoing monitoring of investor portfolio composition for over-concentration risk, and submission of periodic reports to AMFI on distribution practice. Trustner Asset Services Pvt. Ltd. holds the SIF Distributor empanelment and operates within this compliance framework.',
        explanation:
          'Three regulatory layers govern SIF distribution. First, AMFI registration as a SIF Distributor — distinct from the standard ARN that covers mutual fund distribution. AMFI maintains separate eligibility criteria for SIF empanelment, including team experience requirements, infrastructure for suitability assessment, and demonstrated capability to handle the operational complexity. Trustner\'s registration confirms it has met these requirements. Second, SEBI-mandated enhanced suitability framework — every prospective SIF subscriber must complete a structured assessment covering total liquid wealth, prior investment experience with similar strategies, risk tolerance, and investment horizon. The distributor must document the suitability conclusion in writing and decline subscription if the investor does not meet the threshold. Third, SEBI-mandated transparency on distributor compensation — the investor must be informed in writing of the trail commission the distributor will receive, the upfront commission (if any), and any other compensation directly or indirectly tied to the subscription. This is an ongoing disclosure refreshed at each material change. For Trustner-distributed SIFs, the typical commission structure is a trail of 0.5-1.0% per annum on the SIF AUM — paid by the AMC out of the scheme\'s expense ratio (not directly by the investor). The investor receives this disclosure before subscription. Beyond regulatory compliance, Trustner\'s internal framework adds further layers — pre-empanelment due diligence on every SIF (manager track record, strategy consistency, fee structure, operational quality), ongoing monitoring of empanelled SIFs (quarterly review of performance, portfolio-construction discipline, regulatory standing), and client-portfolio-level review (ensuring no client has over-concentration across multiple SIF subscriptions). The framework is designed to ensure that when Trustner recommends a SIF, the recommendation reflects investor suitability and SIF quality, not distributor incentive.',
        realLifeExample:
          'Trustner\'s SIF distribution workflow for a typical client onboarding: Client meeting →  needs analysis (portfolio audit, identifying strategic gap) → suitability assessment (structured questionnaire) → SIF candidate shortlist (1-2 names from Trustner\'s pre-empanelled list, matched to gap) → SID and offer document review with client → fee disclosure (trail commission, fund expense ratio, performance fee, exit load) → client decision → KYC and subscription processing → SoA confirmation → quarterly review schedule established. End-to-end: typically 2-3 weeks from initial conversation to first SoA. Across the relationship, Trustner conducts quarterly review meetings tracking each SIF allocation against goals, monitors for over-concentration, and rotates clients out of underperforming SIFs (with appropriate tax planning) when warranted. The distributor compliance framework is operationally heavy compared to mutual fund distribution but is the SEBI-mandated baseline for SIF empanelment.',
        keyPoints: [
          'Three compliance layers: AMFI SIF empanelment, enhanced suitability framework, transparent fee disclosure.',
          'AMFI registration as SIF Distributor is separate from standard ARN — Trustner holds both.',
          'Suitability assessment mandatory and documented; over-concentration is primary mis-sale flag.',
          'Distributor compensation disclosed in writing to investor before subscription.',
          'Typical Trustner trail commission on SIFs: 0.5-1.0% per annum on AUM.',
          'Trustner internal framework adds pre-empanelment diligence and ongoing monitoring.',
          'Quarterly review meetings track SIF allocation against goals and over-concentration.',
        ],
        faq: [
          {
            question: 'Why are SIF distributor commissions higher than for mutual funds?',
            answer:
              'Three reasons: (1) SIFs are operationally heavier — suitability assessment, ongoing monitoring, and quarterly reviews require materially more distributor effort than monthly SIP setup; (2) SIF investor base is smaller, so per-client distributor revenue must be higher to make the business model viable; (3) AMC product-level economics — SIFs charge higher TER than mutual funds and can support higher distributor compensation. SEBI mandates disclosure of these commissions; investors should compare across distributors before subscribing.',
          },
          {
            question: 'Can I subscribe to a SIF directly with the AMC, bypassing the distributor?',
            answer:
              'Yes — direct-plan SIFs are available, similar to direct-plan mutual funds. The investor pays a lower TER (no distributor trail commission embedded) but handles their own KYC, suitability self-assessment, ongoing monitoring, and reporting. For investors with direct experience in long-short strategies and sufficient operational discipline, the direct route can offer lower-cost outcomes. For most investors, the distributor route adds value through curated empanelment, suitability discipline, and quarterly review.',
          },
          {
            question: 'What does "pre-empanelment diligence" mean?',
            answer:
              'Pre-empanelment diligence is Trustner\'s internal review of a SIF before it is added to the recommended list. The review covers: manager team\'s long-short track record (minimum 3-5 years preferred), AMC ownership and risk-management infrastructure, strategy consistency and discipline, fee structure relative to value-add, operational quality (timely statements, responsive RM), and references from other distributors and investors. Only SIFs that pass this diligence are recommended to clients.',
          },
          {
            question: 'How does Trustner handle over-concentration risk across multiple SIF subscriptions?',
            answer:
              'Trustner maintains a unified view of each client\'s overall liquid wealth and SIF allocation. If a client subscribed to two SIFs would exceed the recommended 20% allocation cap, the Relationship Manager flags this during the suitability discussion. In some cases, the recommendation may be to reduce a prior SIF allocation before adding a new one, or to defer the new subscription. This portfolio-level oversight is part of the structured Trustner client-management framework.',
          },
        ],
        mcqs: [
          {
            question: 'AMFI registration as a SIF Distributor is:',
            options: [
              'Same as standard mutual fund ARN',
              'Separate from standard ARN, with additional eligibility requirements',
              'Not required for SIF distribution',
              'Issued by SEBI, not AMFI',
            ],
            correctAnswer: 1,
            explanation:
              'SIF distribution requires a separate AMFI registration with additional eligibility requirements (team experience, suitability assessment infrastructure, operational capability), distinct from the standard mutual fund ARN.',
          },
          {
            question: 'Distributor compensation on SIFs is paid:',
            options: [
              'Directly by the investor',
              'By the AMC out of the scheme\'s expense ratio',
              'By SEBI',
              'Not paid at all',
            ],
            correctAnswer: 1,
            explanation:
              'SIF distributor compensation is paid by the AMC out of the scheme\'s expense ratio — not directly by the investor. The investor must be informed of the commission in writing before subscription. The trail commission affects the SIF\'s overall TER but is not a separate charge.',
          },
          {
            question: 'Trustner\'s pre-empanelment diligence on a SIF includes:',
            options: [
              'Only the AMC\'s name recognition',
              'Manager track record, strategy consistency, fee structure, operational quality, references',
              'Only the fund\'s historical returns',
              'No diligence — all SIFs are empanelled',
            ],
            correctAnswer: 1,
            explanation:
              'Trustner\'s diligence framework covers manager track record (3-5 years minimum), strategy consistency, AMC infrastructure, fee structure relative to value-add, operational quality, and references from other distributors and investors.',
          },
        ],
        summaryNotes: [
          'SIF distribution requires separate AMFI registration, enhanced suitability, transparent fee disclosure.',
          'Distributor commission paid by AMC out of TER; disclosed to investor in writing.',
          'Trustner adds pre-empanelment diligence + ongoing monitoring + quarterly client reviews.',
          'Direct-plan SIFs available for investors with sufficient operational discipline.',
        ],
        relatedTopics: ['sif-tax-distribution', 'sif-subscription-kyc', 'sif-tax-computation'],
      },
    },
  ],
};
