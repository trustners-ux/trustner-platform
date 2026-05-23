import { LearningModule } from '@/types/learning';

export const internationalAdvancedModule: LearningModule = {
  id: 'international-advanced',
  title: 'International Investing — Advanced Practitioner',
  slug: 'international-advanced',
  icon: 'TrendingUp',
  description:
    'Advanced practitioner-grade module on international investing for Indian residents — covering currency hedging frameworks, multi-asset global portfolio construction, and the tax-and-estate complexities of cross-border holdings (Schedule FA, Black Money Act 2015, US estate tax under IRC §2103, RNOR transitions). Designed for sub-broker / IFA / CFP-grade advisors who must structure global allocation for HNIs with cross-border liabilities and succession exposure.',
  level: 'advanced',
  color: 'from-sky-800 to-indigo-700',
  estimatedTime: '50 min',
  track: 'international',
  sections: [
    {
      id: 'intl-currency-hedging',
      title: 'Currency Hedging & Forex Risk Framework',
      slug: 'currency-hedging-forex',
      content: {
        definition:
          'Currency hedging in the international investing context refers to the use of forward contracts, futures, swaps, or natural offsets to neutralise (fully or partially) the impact of USD/INR (or other foreign currency) movements on the INR-denominated returns of a global portfolio. For the Indian retail and HNI investor, the hedge-vs-leave-open decision is one of the most consequential portfolio choices once global allocation crosses single-digit percentages — and it interacts directly with the investor\'s liability profile, time horizon, and access route (Indian MF, GIFT IFSC, or LRS-based US brokerage).',
        explanation:
          'The starting point for the framework is the long-run INR depreciation trajectory. Between 2000 and 2025, the rupee depreciated against the US dollar at an annualised rate of approximately 3 to 3.5 percent — a tailwind for un-hedged USD-asset holders denominated in INR terms. The structural drivers are well-understood: India runs a persistent current account deficit financed by capital inflows, oil-price sensitivity (India imports approximately 85 percent of crude consumption), and a real productivity gap relative to the US that compounds into nominal currency drift over decades. Short-term volatility is significant — the rupee can move 5 to 8 percent in either direction within a year on RBI policy shifts, EM risk-off episodes, or oil shocks — but the structural trend has been remarkably consistent across multiple regimes. The practitioner must distinguish between short-horizon volatility (where hedging may add value) and long-term drift (where un-hedged exposure has historically been additive). In the Indian mutual fund universe, hedged international funds are extremely rare. The vast majority of international FoFs and direct international funds run un-hedged USD exposure, meaning the investor\'s INR return reflects the underlying USD asset performance plus or minus the USD/INR move over the same period. Forward currency contracts are not retail-accessible in India for this purpose; the LRS framework does not permit individual residents to enter standalone forward contracts to hedge personal portfolios. USD/INR forward premia — currently in the 1.5 to 2.5 percent annualised range depending on tenor — reflect the interest rate differential between the two currencies and the implicit carry cost of any institutional hedge. The framework for the practitioner is therefore: hedging makes sense when the time horizon is short (under 3 years) and the investor has an INR liability matched against the foreign asset; hedging works against the long-term wealth-compounding case when the horizon is 10+ years and the asset is genuinely a long-term equity allocation. GIFT IFSC USD-denominated products serve a distinct purpose — they act as a natural hedge for USD-denominated future liabilities such as US college fees, US property purchase, or planned retirement abroad. For these matched-liability cases, holding the foreign asset in USD form (via GIFT IFSC) eliminates the currency mismatch entirely.',
        realLifeExample:
          'Consider Rohan, a 48-year-old surgeon in Mumbai with two children planning US undergraduate study in 2031 and 2034. The expected USD bill is approximately USD 350,000 per child. The advisor frames the currency question explicitly: should the parental savings sit in INR-denominated international funds (un-hedged USD exposure converted at future spot) or in GIFT IFSC USD-denominated products that match the future liability currency? The advisor models both paths using a 3 percent annualised INR depreciation assumption. The GIFT IFSC route eliminates currency mismatch — the USD is locked in today (or accumulated over time) against a known USD liability. The Indian MF route benefits from the un-hedged tailwind if INR continues to depreciate but exposes the family to a 10-15 percent USD/INR reversal in a single year right before the bill is due. For the matched-liability portion (approximately 60 percent of the goal corpus), the advisor recommends GIFT IFSC USD products to neutralise the sequence-of-currency risk. For the remaining 40 percent — which will likely fund non-US life events — the advisor leaves the un-hedged Indian MF exposure in place to capture the structural INR-depreciation tailwind.',
        keyPoints: [
          'INR has depreciated against USD at approximately 3-3.5 percent annualised over 2000-2025 — a structural tailwind for un-hedged INR investors holding USD assets.',
          'Indian international funds are almost universally un-hedged; hedged variants are rare and forward contracts are not retail-accessible under LRS.',
          'USD/INR forward premia (1.5-2.5 percent annualised) reflect interest rate differentials and represent the implicit carry cost of any institutional hedge.',
          'Hedging adds value for short horizons (under 3 years) and INR-liability-matched portfolios; works against long-term wealth compounding for 10+ year horizons.',
          'GIFT IFSC USD-denominated products act as a natural hedge for USD-denominated future liabilities (US college, US property, retirement abroad).',
          'Short-term FX volatility (5-8 percent annual swings) is large enough to materially impact retiree withdrawal sequences — sequence-of-currency risk is real.',
          'The practitioner\'s framework: match currency to liability where horizon is short; leave un-hedged where horizon is long and asset is wealth-compounding.',
        ],
        faq: [
          {
            question: 'Why are hedged international mutual funds so rare in India?',
            answer:
              'Hedging adds operational complexity and explicit cost (forward premia of 1.5-2.5 percent annualised) that erodes long-term equity returns. Indian retail investors have historically benefited from un-hedged USD exposure due to persistent INR depreciation, and AMCs have not seen meaningful demand for hedged variants. Globally, equity funds rarely hedge currency for the same reason — the long-term equity premium exceeds the FX volatility cost. Hedging is more common in fixed-income international funds where currency volatility can dominate the underlying yield.',
          },
          {
            question: 'Can a retail investor hedge their personal USD portfolio under LRS?',
            answer:
              'No. The LRS framework permits remittance of USD up to USD 250,000 per financial year for permitted purposes (investment, education, travel) but does not permit individual residents to enter standalone forward currency contracts as a personal hedge against their own portfolio. Banks offer forward contracts for trade-related underlyings, not for personal portfolio hedging. The retail practitioner workaround is to use the GIFT IFSC USD-product route (where the asset itself is denominated in USD) or to accept the un-hedged exposure as a long-term feature.',
          },
          {
            question: 'How does the practitioner think about sequence-of-currency risk for retirees?',
            answer:
              'A retiree drawing INR-equivalent income from un-hedged international holdings faces meaningful sequence risk if a sharp USD/INR reversal coincides with the early years of retirement — even a structural 3-3.5 percent annualised depreciation contains 8-10 percent counter-trend years. The framework parallels equity sequence-of-returns risk: in the 5 years before and after retirement, the practitioner shifts a portion of international holdings into INR-hedged or domestic equivalents, or into GIFT IFSC USD products if retirement liabilities are USD-denominated. Long accumulation phases can absorb FX volatility; decumulation phases cannot.',
          },
          {
            question: 'Does the structural INR depreciation thesis still hold for the next 25 years?',
            answer:
              'The practitioner must hold this view with appropriate humility. The structural drivers (CAD, oil dependence, productivity gap) have been durable but are not immutable — India\'s services-export surplus, manufacturing localisation, and energy transition all create a counter-narrative where the depreciation rate could moderate to 1.5-2 percent or even temporarily reverse. Advisor responsibility is to communicate the historical tailwind without presenting it as a guarantee, and to size un-hedged exposure such that a 5-year period of zero or positive INR appreciation does not derail the goal plan.',
          },
        ],
        mcqs: [
          {
            question:
              'The historical annualised INR depreciation against USD over 2000-2025 has been approximately:',
            options: ['0.5-1 percent', '3-3.5 percent', '7-8 percent', '10-12 percent'],
            correctAnswer: 1,
            explanation:
              'INR has depreciated against USD at approximately 3-3.5 percent annualised over 2000-2025. This structural drift — driven by CAD, oil import dependence, and productivity gap — has been a meaningful tailwind for un-hedged Indian holders of USD-denominated assets.',
          },
          {
            question:
              'Currency hedging via forward contracts adds the most value when:',
            options: [
              'Time horizon is 15+ years and the asset is a long-term equity allocation',
              'Time horizon is short (under 3 years) and there is an INR-denominated liability matched against the asset',
              'Time horizon is short and the liability is USD-denominated',
              'Always — hedging is universally additive',
            ],
            correctAnswer: 1,
            explanation:
              'Hedging is most additive when the horizon is short (under 3 years) and the liability is INR-denominated — the FX volatility can dominate the asset return over short windows. For long-horizon equity wealth compounding or USD-matched liabilities, hedging works against the investor.',
          },
          {
            question:
              'GIFT IFSC USD-denominated products serve which primary practitioner purpose?',
            options: [
              'Aggressive currency speculation',
              'Natural hedge for USD-denominated future liabilities (US college, US retirement)',
              'Tax shelter for INR-denominated income',
              'Substitute for domestic equity allocation',
            ],
            correctAnswer: 1,
            explanation:
              'GIFT IFSC USD-denominated products eliminate currency mismatch for investors with USD-denominated future liabilities — US college, US property, planned retirement abroad. The asset and liability are both in USD, removing the sequence-of-currency risk.',
          },
        ],
        summaryNotes: [
          'INR-USD has structurally depreciated at 3-3.5 percent annualised; un-hedged exposure has been a long-term tailwind.',
          'Indian international funds are almost universally un-hedged; retail forward contracts under LRS are not available for personal portfolio hedging.',
          'Forward premia (1.5-2.5 percent annualised) reflect interest-rate differentials and represent the carry cost of any institutional hedge.',
          'Hedging adds value for short horizons and INR-liability matching; reduces long-term compounded returns when horizon exceeds 10 years.',
          'GIFT IFSC USD products are the practitioner\'s tool for USD-liability matching (US college, retirement abroad).',
          'Sequence-of-currency risk is real for retirees — practitioner reduces un-hedged exposure 5 years before/after retirement onset.',
        ],
        relatedTopics: [
          'international-foundation',
          'international-deep',
          'gift-advanced',
          'global-portfolio-construction',
        ],
      },
    },
    {
      id: 'intl-portfolio-construction',
      title: 'Portfolio Construction with Global Diversification',
      slug: 'global-portfolio-construction',
      content: {
        definition:
          'Global portfolio construction for Indian residents applies modern portfolio theory and the efficient frontier framework to a multi-asset, multi-geography opportunity set spanning Indian equity, US equity, broader developed-market equity, emerging-market equity ex-India, global bonds, and INR fixed income. The practitioner\'s task is to translate the residency, liability profile, time horizon, and tax framework of the Indian investor into a target weight matrix that is internally consistent, periodically rebalanced, and lifecycle-adjusted as the client\'s circumstances change.',
        explanation:
          'The starting input for the framework is the correlation matrix across regions. Over rolling 10-year windows, the India-US equity correlation has run in the 0.4 to 0.5 range, the India-EM correlation has been higher at 0.6 to 0.7 (reflecting shared EM-risk-on/risk-off flows), and the US-developed-market correlation has been the highest at 0.7 to 0.85. These correlations matter because diversification benefit accrues fastest when correlations are moderate — adding US equity to an Indian equity portfolio reduces portfolio volatility meaningfully, while adding broader EM offers less diversification per unit of risk. The efficient frontier for an Indian resident, when constructed with reasonable forward return assumptions (Indian equity 11-12 percent, US equity 8-9 percent in USD plus INR depreciation 3 percent yielding approximately 11-12 percent in INR, global bonds 4-5 percent in USD), generally produces three commonly-cited allocation regimes that practitioners use as anchor points. The 60/30/10 split — 60 percent Indian equity, 30 percent international equity, 10 percent fixed income or alternatives — suits a younger investor with high India-tilt conviction and moderate global diversification. The 70/20/10 split is more common in practice as the default conservative-default for Indian HNIs who maintain home bias. The 80/15/5 split represents the highest-domestic-tilt regime, often appropriate where the investor\'s liabilities are entirely INR-denominated and their non-portfolio wealth (real estate, business equity) is also INR-domiciled. Lifecycle adjustment overlays the static framework with horizon-dependent shifts. As an investor approaches retirement, the international allocation should rise materially if any portion of retirement consumption is foreign-currency-denominated — US visits, foreign property maintenance, support for children abroad, or relocation. Sequence-of-returns risk in the 5 years before and after retirement onset is amplified for international holdings due to the FX overlay. The practitioner addresses this through liability-matched currency allocation: each future cash outflow is mapped to its expected currency, and the asset side is shifted to match. This framework discipline survives rebalancing better than ad-hoc reallocation. Rebalancing across geographies typically uses tax-efficient bands — a target weight is set with a 4-5 percent tolerance band, and rebalancing is triggered when the actual weight drifts beyond the band. Tax-efficient implementation matters for international rebalancing post-FY24, as international fund redemptions trigger slab-rate STCG (under 24 months) or 12.5 percent LTCG (above 24 months) on the gain — the practitioner sequences redemptions across financial years and harvests losses where available.',
        realLifeExample:
          'Consider Anjali, age 45, a Delhi-based corporate executive with a current net worth of INR 4 crore — 60 percent in Indian mutual funds, 25 percent in real estate, 10 percent in domestic fixed income, 5 percent EPF/PPF. She has no international allocation and her two children (ages 14 and 12) are likely to study undergraduate in the US. The practitioner builds her allocation framework in three steps. First, the goal-side assessment: USD 700,000 of US college costs across 2030-2038, plus an aspirational US property purchase at age 60 estimated at USD 500,000. Second, the asset-side gap: zero existing USD allocation against approximately USD 1.2 million of expected USD outflows over 15 years. Third, the implementation plan: shift to a 65/25/10 framework over 24 months. The 25 percent international allocation is split as 18 percent US equity (Nasdaq 100 + S&P 500 mix via Indian FoFs and a GIFT IFSC USD position for college-matched portion) and 7 percent broad EM-ex-India and developed-ex-US for diversification. The practitioner sets rebalancing bands at plus or minus 4 percent on each leg and reviews allocation annually. For the matched-liability USD portion, GIFT IFSC products eliminate the currency mismatch on the goal-critical 60 percent of the college corpus. Over 5 years, the framework discipline survives two material market drawdowns and one INR-strengthening episode without ad-hoc deviation.',
        keyPoints: [
          'India-US equity correlation runs 0.4-0.5 over rolling 10-year windows; India-EM correlation is higher at 0.6-0.7 — diversification value differs by region.',
          'Three anchor allocation regimes: 60/30/10 (younger, less home bias), 70/20/10 (typical HNI default), 80/15/5 (high INR-tilt with significant non-portfolio INR wealth).',
          'Forward INR-return assumptions: Indian equity 11-12 percent, US equity 8-9 percent USD + 3 percent INR depreciation = 11-12 percent INR, global bonds 4-5 percent USD.',
          'Lifecycle adjustment: international allocation should rise as retirement approaches if any retirement consumption is foreign-currency-denominated.',
          'Liability-matched currency allocation: map each future outflow to its currency; align asset side accordingly.',
          'Rebalancing bands of 4-5 percent tolerance; tax-efficient sequencing across financial years post FY24 (12.5 percent LTCG above 24 months, slab STCG below).',
          'Sequence-of-returns risk amplified by FX overlay for international holdings — practitioner reduces un-hedged exposure 5 years pre-retirement.',
        ],
        faq: [
          {
            question: 'What is the right international allocation for a typical Indian HNI?',
            answer:
              'The practitioner-default range is 15-30 percent of investable financial assets (excluding real estate and business equity), with 20-25 percent being the most common anchor. Lower if the investor\'s liabilities, lifestyle, and family circumstances are entirely INR-domiciled and there is no foreseeable foreign-currency outflow. Higher if children are likely to study or settle abroad, or if retirement migration is on the table. The framework is liability-driven, not benchmark-driven.',
          },
          {
            question: 'How should the practitioner handle correlation regime shifts?',
            answer:
              'Correlation matrices are not stable — the India-US correlation rose to 0.7+ during the 2008 global financial crisis and the 2020 COVID drawdown, and fell back to 0.4-0.5 during normal periods. Crisis correlations matter for tail risk and liquidity planning; normal-regime correlations matter for long-term efficient frontier construction. The practitioner sizes international allocation using normal-regime correlations but stress-tests the portfolio assuming crisis correlations of 0.7+ to ensure the portfolio survives a global synchronised drawdown.',
          },
          {
            question: 'When does the 80/15/5 (high India tilt) framework actually make sense?',
            answer:
              'It makes sense when the investor has substantial non-portfolio INR wealth — primary residence, business equity, real estate — that already creates significant India concentration. In such cases, the financial portfolio can be more INR-tilted because the household balance sheet as a whole is already heavily India-exposed. Conversely, an investor whose primary income is INR-denominated salary and whose only non-portfolio asset is rented housing has a relatively diversifiable balance sheet and can support 25-30 percent international tilt without breaching prudent India-concentration limits.',
          },
          {
            question: 'How does the practitioner rebalance across geographies tax-efficiently?',
            answer:
              'Three rules. First, set tolerance bands of 4-5 percent on each major leg and rebalance only when bands are breached — not on calendar trigger. Second, rebalance using new contributions wherever possible — direct fresh SIP allocations to the under-weight region instead of redeeming the over-weight one. Third, when redemption-based rebalancing is unavoidable, sequence across financial years to spread STCG impact, harvest realised losses against gains within the same FY, and prioritise units held above 24 months (12.5 percent LTCG) over units held under 24 months (slab STCG) post FY24.',
          },
        ],
        mcqs: [
          {
            question:
              'Over rolling 10-year windows, the India-US equity correlation has typically run in which range?',
            options: ['0.05 to 0.15', '0.4 to 0.5', '0.7 to 0.85', '0.9 to 0.95'],
            correctAnswer: 1,
            explanation:
              'India-US equity correlation has averaged 0.4-0.5 over rolling 10-year windows — moderate enough to deliver meaningful diversification benefit when US equity is added to an Indian-equity-dominant portfolio. India-EM correlation is higher at 0.6-0.7.',
          },
          {
            question:
              'The practitioner-default international allocation for a typical Indian HNI (with no foreign liabilities) generally falls in which range?',
            options: ['0-5 percent', '15-30 percent', '50-60 percent', '70+ percent'],
            correctAnswer: 1,
            explanation:
              'The practitioner-default range is 15-30 percent of investable financial assets, with 20-25 percent as the most common anchor. The framework is liability-driven and lifecycle-adjusted, not benchmark-driven.',
          },
          {
            question:
              'Sequence-of-returns risk for international holdings is amplified relative to domestic equity because:',
            options: [
              'International funds have higher expense ratios',
              'The FX overlay (USD/INR volatility) compounds with the underlying asset volatility, particularly material in the 5-year window pre/post retirement',
              'International funds cannot be redeemed quickly',
              'There is no LTCG benefit on international funds',
            ],
            correctAnswer: 1,
            explanation:
              'The FX overlay adds another volatility layer on top of the underlying asset return. In the 5-year window before and after retirement onset, this combination amplifies sequence-of-returns risk — a sharp INR appreciation coinciding with an asset drawdown can permanently impair the retirement plan.',
          },
        ],
        summaryNotes: [
          'Correlation matrix: India-US ~0.4-0.5, India-EM ~0.6-0.7, US-DM ~0.7-0.85 over 10-year rolling windows.',
          'Three anchor regimes: 60/30/10, 70/20/10, 80/15/5 — chosen by lifecycle, liabilities, and non-portfolio wealth concentration.',
          'Forward INR-return assumptions roughly equal across Indian and US equity (~11-12 percent) when INR depreciation is overlaid on USD returns.',
          'Lifecycle: international allocation rises as foreign-currency liabilities approach; sequence-of-currency risk addressed via GIFT IFSC USD products or hedged exposure.',
          'Rebalancing: 4-5 percent tolerance bands, contribution-based rebalancing first, redemption-based sequenced across FYs for tax efficiency.',
          'Stress-test allocation under crisis correlations (0.7+) even if normal-regime correlations are lower.',
        ],
        relatedTopics: [
          'international-foundation',
          'international-deep',
          'currency-hedging-forex',
          'gift-advanced',
        ],
      },
    },
    {
      id: 'intl-cross-border-tax-estate',
      title: 'Tax Loss Harvesting & Estate Planning for Cross-Border Holdings',
      slug: 'cross-border-tax-estate',
      content: {
        definition:
          'Cross-border tax and estate planning for Indian residents holding international assets covers the FY24+ Indian tax framework on international mutual funds and direct foreign holdings, the mandatory disclosure regime under Schedule FA and the Black Money (Undisclosed Foreign Income and Assets) Act 2015, the US estate tax exposure under IRC §2103 and §2106 for non-resident aliens holding US-situs assets above the USD 60,000 threshold, and the lifecycle transitions (RNOR status, NRE/NRO reorganisation, succession across jurisdictions) that materially alter the planning frame.',
        explanation:
          'On the Indian tax side, the FY24+ regime applies to redemptions from international mutual funds. Holdings above 24 months attract long-term capital gains tax at 12.5 percent without indexation benefit (Section 112A and the post-Finance Act 2024 rationalisation). Holdings under 24 months are taxed at slab rate as short-term capital gains. Indexation benefit, which previously cushioned long-horizon international FoF investors, is no longer available for international funds. The practitioner uses tax loss harvesting within this framework — booked losses on under-water international holdings can offset gains on other international or domestic non-equity holdings within the same financial year, with carry-forward of unabsorbed losses for 8 assessment years subject to filing discipline. The harvesting calendar is FY-bound: the practitioner reviews unrealised gains and losses across the international book in February-March of each FY and books strategic redemptions and re-entries to crystallise losses. Wash-sale rules do not apply in India, so immediate re-entry into the same scheme is permitted, though the practitioner must consider exit load and re-entry friction. Disclosure under Schedule FA is mandatory and entirely separate from the tax computation. Every Indian resident must report all foreign assets and foreign-source income in Schedule FA of the income tax return, regardless of whether the asset has produced taxable income. This includes direct US brokerage holdings, foreign bank accounts, foreign mutual funds (held outside India), foreign property, foreign trusts, and any beneficial interest in foreign entities. The Black Money Act 2015 creates a separate penalty regime for undisclosed foreign assets — a flat 30 percent tax on the asset value plus a penalty of 90 percent of the value, plus prosecution exposure with imprisonment of 3 to 10 years for wilful concealment. The Schedule FA disclosure obligation applies even where the foreign asset has produced no income; the act of holding the asset undisclosed is itself the offence. Indian-domiciled international mutual funds (FoFs and direct international funds held through Indian AMCs) are not foreign assets for Schedule FA purposes — they are Indian mutual fund holdings. Direct US brokerage accounts, GIFT IFSC products, and offshore-domiciled funds held directly are foreign assets and trigger Schedule FA reporting. On the US estate-tax side, IRC §2103 imposes US federal estate tax on US-situs assets owned by non-resident aliens at death. The exemption for non-resident aliens is only USD 60,000 — far below the USD 13+ million exemption available to US citizens and residents. US-situs assets include direct holdings of US-listed stocks, US-listed ETFs, US real estate, and certain US-domiciled mutual funds. Above the USD 60,000 threshold, the marginal estate tax rate rises rapidly, reaching 40 percent on amounts above USD 1 million. For an Indian resident with a USD 500,000 direct US brokerage account, the US estate tax exposure on death is approximately USD 175,000-180,000. GIFT IFSC products structured as Indian-resident holdings of IFSC-domiciled funds avoid the US estate-tax exposure because the asset is not US-situs — the Indian investor holds an IFSC unit, not a US-listed security. Indian AMC international FoFs similarly avoid the US estate-tax exposure because the underlying US ETF is held by the Indian AMC, not the Indian investor. RNOR transition planning matters for returning NRIs. A Returning Resident with RNOR status enjoys a transitional period (typically 2-3 years) during which foreign income and foreign asset disposals are not taxed in India. The practitioner uses this window to reorganise foreign holdings — closing foreign brokerage positions with embedded gains, transitioning NRE deposits to NRO, simplifying foreign mutual fund holdings — before the resident-and-ordinarily-resident (ROR) status crystallises and global income becomes taxable in India. NRE/NRO reorganisation on return requires re-designation of accounts, rebalancing of currency exposure, and Schedule FA disclosure of any retained foreign accounts. Succession planning across jurisdictions is the most complex layer. A will executed in India does not automatically have effect over foreign assets; some jurisdictions require local probate, others recognise foreign wills with apostille, and a few (notably the US) require situs-state probate for real and tangible property. The practitioner coordinates with cross-border legal counsel to either consolidate foreign holdings into structures that bypass probate (e.g., trusts, joint holdings with rights of survivorship where permitted, beneficiary-designation structures) or to draft separate jurisdictional wills that operate consistently with the master Indian will.',
        realLifeExample:
          'Consider Vikram, age 56, a Pune-based pharma executive returning from an 8-year US assignment. His foreign holdings: a USD 380,000 US brokerage account (Apple, Microsoft, Vanguard ETFs), a USD 95,000 401(k), a USD 40,000 NRE deposit pool, and a USD 25,000 GIFT IFSC USD-fund position. He returns in April 2026, which gives him RNOR status until approximately FY 2028-29 depending on physical-presence patterns. The practitioner builds a 24-month transition plan. First, within the RNOR window, Vikram crystallises gains on his US brokerage holdings — selling appreciated US-listed stocks while foreign-source capital gains remain non-taxable in India under RNOR. Second, the US brokerage account is reduced from USD 380,000 to under USD 60,000 to eliminate US estate-tax exposure, with proceeds redirected into Indian AMC international FoFs and additional GIFT IFSC USD positions (both of which avoid US-situs treatment). Third, the 401(k) is left in place — early withdrawal triggers US 10 percent penalty plus US income tax — and the practitioner notes the future Schedule FA disclosure obligation continues. Fourth, the NRE deposits are matured and converted to NRO/resident accounts on the ROR transition, with full Schedule FA reporting going forward. Fifth, Vikram\'s estate plan is updated with an Indian will (covering all Indian-situs assets including IFSC and Indian MFs) and a US-state will or transfer-on-death designation covering the residual US brokerage and the 401(k) beneficiary structure. The transition saves an estimated USD 130,000 in potential US estate-tax exposure and eliminates Schedule FA non-compliance risk under the Black Money Act 2015.',
        keyPoints: [
          'FY24+ tax: 12.5 percent LTCG without indexation above 24 months, slab-rate STCG below 24 months, on international mutual fund redemptions (Section 112A and post-Finance Act 2024 framework).',
          'Schedule FA disclosure under Indian ITR is mandatory for all foreign assets (direct brokerage, foreign property, offshore funds) regardless of income — separate from tax computation.',
          'Black Money Act 2015 imposes 30 percent tax + 90 percent penalty + 3-10 years prosecution for undisclosed foreign assets — disclosure failure itself is the offence.',
          'Indian AMC international FoFs and GIFT IFSC products are NOT foreign assets for Schedule FA — only direct foreign holdings trigger reporting.',
          'US estate tax (IRC §2103, §2106) applies to US-situs assets above USD 60,000 for non-resident aliens — 40 percent marginal rate above USD 1 million.',
          'GIFT IFSC and Indian AMC FoFs avoid US estate-tax exposure because the Indian investor holds an Indian/IFSC unit, not a US-listed security.',
          'RNOR transition window (2-3 years post-return) allows tax-efficient reorganisation of foreign holdings before global income becomes taxable in India.',
          'Cross-jurisdictional succession requires coordinated wills or beneficiary structures — Indian will alone does not control US-situs property.',
        ],
        faq: [
          {
            question: 'Does Schedule FA disclosure apply if the foreign asset produced no income in the FY?',
            answer:
              'Yes — the disclosure obligation is asset-based, not income-based. Every Indian resident (other than RNOR/Not-Ordinarily-Resident with respect to that period) must disclose all foreign assets in Schedule FA of the ITR for every financial year the asset is held, regardless of whether the asset paid any income. Failure to disclose is itself an offence under the Black Money Act 2015 and triggers the 30 percent tax + 90 percent penalty regime even if there was no taxable income.',
          },
          {
            question: 'How does the practitioner approach US estate-tax mitigation for Indian residents with US brokerage accounts?',
            answer:
              'Three pathways. First, keep the US-situs asset balance below the USD 60,000 threshold — for small allocations this is the simplest solution. Second, reroute the global allocation through Indian AMC international FoFs or GIFT IFSC USD products, both of which avoid US-situs classification because the underlying US-listed security is held by the Indian fund, not the individual investor. Third, for HNI clients with substantial direct US holdings, consider non-US-domiciled funds (Ireland-domiciled UCITS ETFs accessible via institutional routes) that provide US equity exposure without US-situs treatment. The practitioner documents the structure choice and the estate-tax mitigation rationale in the IPS.',
          },
          {
            question: 'What should the returning NRI do with their 401(k) on relocation to India?',
            answer:
              'The 401(k) is generally retained in place during the RNOR transition. Early withdrawal triggers a US 10 percent penalty for accountholders under age 59.5 plus US ordinary income tax on the distribution, plus eventual Indian taxation once ROR status is reached. Most practitioners recommend leaving the 401(k) untouched, noting the future Schedule FA reporting obligation, and planning structured rollovers or systematic withdrawals after age 59.5 when the US penalty no longer applies. India-US DTAA provides relief on double taxation but the timing and characterisation of 401(k) distributions in the Indian return require careful CA review.',
          },
          {
            question: 'Can Indian residents create foreign trusts for succession planning?',
            answer:
              'Indian residents can be settlors of foreign trusts but the structure must be disclosed under Schedule FA, FEMA-compliant, and tax-efficient under the Indian taxation-of-trusts framework — which has tightened materially. Settlements made by Indian residents into discretionary foreign trusts can attract complex tax treatment, including settlor-tax characterisation in some cases. The practitioner does not structure foreign trusts for Indian-resident clients without specialist cross-border tax-and-estate counsel, and typically prefers domestic vehicles (Indian private discretionary trusts, family company structures, or beneficiary-designation contracts where permitted) for the bulk of succession planning.',
          },
        ],
        mcqs: [
          {
            question:
              'Schedule FA disclosure under Indian ITR applies to:',
            options: [
              'Only foreign assets that produced taxable income in the FY',
              'All foreign assets held by an Indian resident regardless of whether the asset produced income',
              'Only foreign assets above USD 100,000 in value',
              'Only foreign real estate',
            ],
            correctAnswer: 1,
            explanation:
              'Schedule FA disclosure is asset-based, not income-based. Every Indian resident (other than RNOR/Not-Ordinarily-Resident for that period) must disclose all foreign assets every FY they are held, regardless of income. Disclosure failure triggers the Black Money Act 2015 penalty regime.',
          },
          {
            question:
              'The US federal estate-tax exemption available to non-resident aliens (NRA) on US-situs assets is approximately:',
            options: ['USD 60,000', 'USD 1 million', 'USD 5 million', 'USD 13 million'],
            correctAnswer: 0,
            explanation:
              'Non-resident aliens have an estate-tax exemption of only USD 60,000 on US-situs assets under IRC §2102(b), versus the much higher USD 13+ million exemption for US citizens and domiciliaries. Above USD 60,000, the marginal rate rises rapidly to 40 percent above USD 1 million.',
          },
          {
            question:
              'Indian AMC international FoFs and GIFT IFSC products avoid US estate-tax exposure because:',
            options: [
              'The US-India DTAA exempts them',
              'The Indian investor holds an Indian-domiciled or IFSC-domiciled unit, not a US-listed security — the asset is not US-situs',
              'They are smaller than the threshold',
              'US estate tax does not apply to mutual funds at all',
            ],
            correctAnswer: 1,
            explanation:
              'These structures route the underlying US exposure through an Indian AMC or IFSC fund. The Indian investor holds the Indian/IFSC unit (not the underlying US-listed security), so the asset is not US-situs for IRC §2103 purposes and falls outside the US estate-tax net.',
          },
        ],
        summaryNotes: [
          'FY24+ tax framework: 12.5 percent LTCG above 24 months, slab STCG below — no indexation, applies to international fund redemptions.',
          'Schedule FA disclosure is mandatory for all foreign assets regardless of income; Black Money Act 2015 imposes 30+90 percent penalty plus prosecution for non-disclosure.',
          'Indian AMC FoFs and GIFT IFSC products are NOT foreign assets for Schedule FA — they sit inside the Indian MF wrapper.',
          'US estate tax under IRC §2103/§2106: NRA exemption only USD 60,000, 40 percent marginal rate above USD 1 million on US-situs assets.',
          'GIFT IFSC and Indian AMC FoFs avoid US-situs classification — the practitioner-preferred route for HNI global allocation.',
          'RNOR transition window (2-3 years) allows tax-efficient reorganisation of foreign holdings; cross-jurisdictional wills required for full succession coverage.',
        ],
        relatedTopics: [
          'international-foundation',
          'international-deep',
          'gift-advanced',
          'currency-hedging-forex',
        ],
      },
    },
  ],
};
