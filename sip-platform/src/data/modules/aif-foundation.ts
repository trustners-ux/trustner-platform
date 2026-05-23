import { LearningModule } from '@/types/learning';

export const aifFoundationModule: LearningModule = {
  id: 'aif-foundation',
  title: 'AIF Foundation',
  slug: 'aif-foundation',
  icon: 'GitBranch',
  description:
    'Alternative Investment Funds (AIF) are SEBI-regulated privately pooled vehicles that unlock asset classes and strategies unavailable in the public-securities universe — venture capital, private equity, private credit, real estate, and hedge-style long-short strategies. This foundation track covers the three SEBI categories, who AIFs suit, tax treatment, and how Trustner positions AIF allocation within an Ultra-HNI plan.',
  level: 'beginner',
  color: 'from-fuchsia-700 to-pink-600',
  estimatedTime: '40 min',
  track: 'aif',
  sections: [
    {
      id: 'aif-what-is',
      title: 'What is an Alternative Investment Fund (AIF)?',
      slug: 'what-is-aif',
      content: {
        definition:
          'An Alternative Investment Fund (AIF) is a SEBI-regulated privately pooled investment vehicle that collects funds from sophisticated investors — Indian or foreign — to invest in asset classes and strategies that fall outside the regulated public-securities universe. SEBI mandates a minimum investment of ₹1 crore per investor (₹25 lakh for employees of the investment manager) and classifies AIFs into three categories based on the underlying strategy and economic role.',
        explanation:
          'AIFs were introduced by SEBI in 2012 to formalise the private pooled investment industry that had previously operated under various exemptions. The structure is fundamentally different from a mutual fund or PMS in three ways. First, the investor base is restricted: AIFs cannot be marketed to retail investors and the ₹1 crore minimum is a regulatory floor that classifies investors as financially capable of bearing higher complexity, illiquidity, and drawdowns. Second, the asset universe is broader: AIFs can invest in unlisted companies (venture capital and private equity), private debt, real estate projects, distressed assets, and run hedge-style strategies — none of which are accessible through mutual funds. Third, the structure is typically closed-ended: most Cat I and Cat II AIFs commit investor capital for 5-10 years with periodic distributions back to investors as the underlying assets mature. Cat III AIFs are often open-ended with quarterly windows but can also have lock-ins. Operationally, AIFs require investors to handle capital calls (the AIF draws down committed capital in tranches as opportunities arise rather than collecting all upfront), distribution waterfalls (returns are paid back per a defined sequence — return of capital first, then preferred return, then carried interest), and complex annual tax reporting. AIFs are appropriate only for Ultra-HNIs, family offices, and institutions that can absorb illiquidity, complexity, and the capital-call commitment cycle.',
        realLifeExample:
          'Take an investor who commits ₹2 crore to a Cat II AIF investing in private credit (mid-market debt). The AIF has a 7-year fund life with 5-year investment period and 2-year harvest period. Day 1: the investor has a ₹2 crore commitment but transfers only ₹40 lakh (the first capital call) to start. Over the next 5 years, additional capital calls bring the cumulative deployment to ₹2 crore as the AIF identifies investments. Year 4 onwards, distributions begin — the AIF returns capital plus interest as the underlying loans mature. By year 7, the investor has received approximately ₹2.6 crore back across 12-15 distribution events (cumulative return ~30% over 7 years, or ~3.8% IRR after fees and tax). The exact return depends on credit quality and recovery rates. The AIF charges 2% management fee on committed capital and 20% performance fee above an 8% hurdle. This is a representative cash-flow profile — the actual experience depends entirely on the AIF\'s strategy, vintage, and market conditions.',
        keyPoints: [
          'AIF is SEBI-regulated, ₹1 crore minimum (₹25 lakh for IM employees).',
          'Three SEBI categories (Cat I, Cat II, Cat III) covered in the next section.',
          'Cannot be marketed to retail; targets sophisticated / accredited investors.',
          'Asset universe broader than MF/PMS: private equity, private credit, real estate, hedge strategies.',
          'Most Cat I/II AIFs are closed-ended with 5-10 year fund life and capital-call cycle.',
          'Distributions paid via waterfall: return of capital → preferred return → carried interest.',
          'Operational complexity (capital calls, K-1 style annual reports, complex tax) requires Ultra-HNI infrastructure.',
        ],
        faq: [
          {
            question: 'What does "₹25 lakh for IM employees" mean?',
            answer:
              'SEBI permits employees of the AIF\'s Investment Manager (the AMC equivalent for AIFs) to invest at a reduced minimum of ₹25 lakh, alongside outside investors at ₹1 crore. This aligns interests — the team managing the fund has skin in the game.',
          },
          {
            question: 'What is a "capital call"?',
            answer:
              'Most Cat I and Cat II AIFs do not collect the full committed capital upfront. Instead, they "call" capital in tranches as investment opportunities arise. An investor with a ₹2 crore commitment may transfer ₹30-50 lakh on day 1, then receive call notices over the next 3-5 years to fund additional opportunities. This is operationally different from mutual funds (where money is invested immediately) and requires investors to maintain liquidity for future calls.',
          },
          {
            question: 'Can I exit an AIF before the fund\'s end?',
            answer:
              'For Cat I and Cat II closed-ended AIFs, secondary exits are possible but limited — the AIF Manager may permit an investor to sell their commitment to another investor, subject to documentation and the existing investor base. Forced exits (mandatory redemption) are not available. This is fundamentally different from mutual funds and is why illiquidity is the headline risk of AIFs.',
          },
          {
            question: 'How does a "distribution waterfall" work?',
            answer:
              'When the AIF generates returns, distributions follow a sequenced "waterfall": (1) return of invested capital to investors, (2) preferred return (often 8-10% IRR) on the invested capital, (3) catch-up to the Manager (allowing the Manager to "catch up" to an agreed share of profits), (4) carried interest split between investors and Manager (typically 80/20). The exact waterfall is defined in the AIF\'s Private Placement Memorandum (PPM).',
          },
        ],
        mcqs: [
          {
            question: 'What is the SEBI-mandated minimum investment for an AIF?',
            options: ['₹10 lakh', '₹50 lakh', '₹1 crore', '₹5 crore'],
            correctAnswer: 2,
            explanation:
              'SEBI mandates a minimum investment of ₹1 crore per investor for AIFs. Employees of the Investment Manager can invest at a reduced ₹25 lakh minimum.',
          },
          {
            question: 'Which of the following is a key structural feature of most Cat II AIFs?',
            options: [
              'Daily liquidity like mutual funds',
              'Closed-ended structure with 5-10 year fund life',
              'Securities held in investor\'s own demat',
              'Maximum ₹50 lakh ticket size',
            ],
            correctAnswer: 1,
            explanation:
              'Most Cat I and Cat II AIFs are closed-ended with 5-10 year fund life. Capital is called in tranches, and distributions return to investors as underlying assets mature. Daily liquidity is not available.',
          },
          {
            question: 'In an AIF distribution waterfall, what comes first?',
            options: [
              'Carried interest to the Manager',
              'Return of invested capital to investors',
              'Preferred return to investors',
              'Performance fee',
            ],
            correctAnswer: 1,
            explanation:
              'The waterfall starts with return of invested capital to investors (1), then preferred return (2), Manager catch-up (3), and finally carried interest split (4). Investors are made whole on capital before any profit-sharing.',
          },
        ],
        summaryNotes: [
          'AIF = SEBI-regulated, ₹1 crore minimum, sophisticated-investor product.',
          'Three categories (next section). Closed-ended for Cat I/II; Cat III often open-ended.',
          'Asset universe: private markets, hedge strategies, real estate, distressed.',
          'Capital calls + waterfall distributions + complex tax — Ultra-HNI operational requirement.',
        ],
        relatedTopics: ['aif-three-categories', 'aif-tax-liquidity', 'aif-who-should-invest'],
      },
    },

    {
      id: 'aif-three-categories',
      title: 'The Three SEBI AIF Categories — Cat I, Cat II, Cat III',
      slug: 'aif-three-categories',
      content: {
        definition:
          'SEBI classifies AIFs into three categories based on the underlying investment strategy and the economic role the AIF plays. Cat I AIFs invest in start-ups, infrastructure, social ventures, and SMEs. Cat II AIFs are private equity, private credit, and real estate funds (the largest category by AUM). Cat III AIFs run hedge-style long-short equity, derivatives strategies, and absolute-return mandates.',
        explanation:
          'Cat I AIFs are SEBI-favoured because they channel capital into segments the regulator wants to support: venture capital funds (early-stage start-ups), infrastructure funds (highways, ports, renewable energy), social venture funds (impact investing), and SME funds (small-to-mid sized companies). Cat I receives certain tax incentives and regulatory advantages. The strategy is typically multi-year, illiquid, and high-risk-high-return — start-up VC funds may have 60% of investments fail and 5% deliver 50x returns to make the math work. Cat II AIFs are the workhorse of Indian alternative investing. They include private equity (buyout and growth equity in unlisted companies), private credit (lending to mid-market companies, real-estate developers, distressed borrowers), real estate funds, debt funds, and similar structures that do not fit Cat I or Cat III. Cat II is the largest by AUM and has seen the most retail-HNI participation in recent years. Strategies range from low-risk private credit (8-12% target IRR with reasonable downside) to high-risk venture-style growth equity. Cat III AIFs run strategies that use leverage, complex derivatives, or short positions — long-short equity hedge funds, market-neutral debt strategies, multi-strategy funds. Cat III taxes at the AIF level (the fund pays tax, not the investor) which simplifies investor reporting but materially impacts net returns. Cat III is also the only AIF category where open-ended structures are common (with quarterly redemption windows). The right category depends on the strategic objective. An investor wanting venture capital exposure picks Cat I. An investor wanting private credit (mid-market debt at 10-13% target IRR) picks Cat II. An investor wanting hedged equity or absolute-return strategies picks Cat III.',
        realLifeExample:
          'Consider a family office with ₹50 crore liquid wealth. Their AIF allocation is ₹15 crore (30%), split as: ₹3 crore to a Cat I VC fund (10-year horizon, exposure to 25-30 early-stage start-ups), ₹6 crore to two Cat II private credit AIFs (7-year horizon, 11-13% target IRR, monthly cash flow distributions), and ₹6 crore to two Cat III multi-strategy AIFs (open-ended, hedged equity and arbitrage strategies for absolute returns). This split delivers: VC for asymmetric upside, private credit for steady cash yield with real-asset backing, and Cat III for downside protection during equity drawdowns. The AIF allocation complements the family office\'s mutual fund (₹20 crore for liquidity) and PMS (₹10 crore for direct equity) holdings.',
        keyPoints: [
          'Cat I: VC, infrastructure, social venture, SME funds. SEBI-favoured with tax/regulatory incentives.',
          'Cat II: PE, private credit, real estate, debt funds. Largest AIF category by AUM.',
          'Cat III: hedge funds, long-short equity, derivatives strategies. Open-ended common.',
          'Cat I & II receive pass-through tax (investor pays tax on income share).',
          'Cat III pays tax at the fund level (simplifies investor reporting, impacts net returns).',
          'Each category targets different return profiles: Cat I (asymmetric upside), Cat II (steady cash yield), Cat III (absolute return).',
        ],
        faq: [
          {
            question: 'Which AIF category is best for steady income?',
            answer:
              'Cat II private credit AIFs typically target 10-13% IRR with quarterly or semi-annual cash distributions, making them the closest AIF equivalent to a "steady income" strategy. The risk profile is higher than bank fixed deposits or debt mutual funds because the underlying borrowers are mid-market companies, not government bonds. Diligence on the AIF Manager\'s credit track record is essential.',
          },
          {
            question: 'Why are Cat III AIFs taxed at the fund level?',
            answer:
              'Cat III AIFs typically use complex strategies (derivatives, shorting, leverage) that generate income types (such as F&O gains) which are administratively complex to allocate to investors. Taxing at the fund level simplifies the structure. The trade-off: net-of-tax returns are lower than they would be in a pass-through structure, and investors cannot offset Cat III losses against personal capital gains.',
          },
          {
            question: 'Are Cat I AIFs only for institutional investors?',
            answer:
              'No. Cat I AIFs accept retail HNI investors at the standard ₹1 crore minimum. The "preferred" categorisation refers to the regulatory and tax incentives, not investor restrictions. Many Cat I VC funds in India today have 30-40% of capital from family offices and HNIs.',
          },
          {
            question: 'Can I invest in multiple AIFs across categories?',
            answer:
              'Yes — and for Ultra-HNIs this is the norm. A typical sophisticated AIF allocation spreads across 4-8 AIFs (mix of Cat I, II, III) to diversify manager risk, vintage risk, and strategy risk. Each AIF\'s ₹1 crore commitment is independent.',
          },
        ],
        mcqs: [
          {
            question: 'A venture capital fund focusing on early-stage start-ups falls under which category?',
            options: ['Cat I', 'Cat II', 'Cat III', 'None — VC is regulated separately'],
            correctAnswer: 0,
            explanation:
              'Cat I AIFs include venture capital funds, infrastructure funds, social venture funds, and SME funds. SEBI categorises VC under Cat I and provides certain regulatory and tax incentives.',
          },
          {
            question: 'Which AIF category most commonly uses leverage and short positions?',
            options: ['Cat I', 'Cat II', 'Cat III', 'All categories equally'],
            correctAnswer: 2,
            explanation:
              'Cat III AIFs are the category designed for hedge-style strategies including leverage, derivatives, and short positions. Cat I and II do not use these instruments to the same degree.',
          },
          {
            question: 'How are Cat I and Cat II AIFs taxed?',
            options: [
              'At the AIF level, like a corporation',
              'Pass-through to investors at their personal slab/capital-gains rate',
              'No tax until exit',
              'GST only',
            ],
            correctAnswer: 1,
            explanation:
              'Cat I and Cat II AIFs receive pass-through tax treatment — the AIF itself is not taxed; investors pay tax on their share of the AIF\'s income at their personal rate. Cat III AIFs are taxed at the AIF level.',
          },
        ],
        summaryNotes: [
          'Cat I (VC, infra, social, SME), Cat II (PE, private credit, real estate), Cat III (hedge, derivatives).',
          'Cat I/II = pass-through tax; Cat III = fund-level tax.',
          'Each category has distinct return/risk/liquidity profiles.',
          'Sophisticated portfolios use multiple categories and vintages.',
        ],
        relatedTopics: ['what-is-aif', 'aif-tax-liquidity', 'aif-who-should-invest'],
      },
    },

    {
      id: 'aif-tax-liquidity',
      title: 'AIF Tax Treatment & Liquidity Considerations',
      slug: 'aif-tax-liquidity',
      content: {
        definition:
          'AIF tax treatment varies materially by category. Cat I and Cat II AIFs receive pass-through tax treatment — the AIF itself is not taxed, and investors pay tax on their proportionate share of the AIF\'s income at their applicable personal tax rate. Cat III AIFs are taxed at the fund level, with the post-tax distributions reaching investors. Liquidity is constrained for Cat I/II (closed-ended) and partially available for Cat III (often open-ended with quarterly windows).',
        explanation:
          'For Cat I and Cat II AIFs, the pass-through structure means each investor receives an annual statement (similar to a U.S. K-1) detailing their share of the AIF\'s capital gains, interest income, dividend income, business income, and other categories. The investor reports each income type on their personal tax return at the applicable rate — capital gains at LTCG/STCG rates, interest at slab rate, dividends at slab rate, etc. This requires CA support but provides tax efficiency where the investor\'s slab is favourable. For Cat III AIFs, the fund pays tax on its income at the fund level — at the maximum marginal rate (currently 30% plus surcharge and cess) for most income types. Distributions to investors are then largely tax-free in the investor\'s hands (since tax has already been paid). The simplicity is real but the cost is high — Cat III pre-tax returns must be substantial for net-of-tax returns to be competitive. Liquidity is the second critical consideration. Cat I AIFs typically have 10-year fund lives with 5-7 year investment periods. Investors cannot redeem; they receive distributions as the AIF exits investments. Cat II AIFs typically have 5-7 year fund lives with periodic distributions as private credit matures or PE investments are exited. Cat III AIFs are often open-ended (some closed-ended) and offer quarterly redemption windows with notice periods. Lock-in periods of 12-36 months are common even in open-ended Cat III. Investors must match their AIF allocation to liquidity needs — committing ₹2 crore to a Cat I VC fund means that capital is locked for 8-10 years with no early exit. Trustner\'s framework includes an explicit liquidity-bucketing exercise before any AIF allocation: identify the investor\'s short-term (0-2 yr), medium-term (2-7 yr), and long-term (7+ yr) liquidity needs separately, then allocate AIF only from the long-term bucket.',
        realLifeExample:
          'An investor in the 30% slab commits ₹3 crore to a Cat II private credit AIF with 7-year fund life and 12% target IRR (gross of fees, post fund-level expenses). Year 4: cumulative distributions ₹40 lakh have flowed back. The annual K-1 shows ₹15 lakh of interest income that year (taxed at 30% slab = ₹4.5 lakh tax) plus ₹2 lakh of capital gains (taxed at LTCG 12.5% = ₹25,000 tax). The investor reports each category in their tax return. Net of tax across years 1-7, the IRR drops from 12% gross to approximately 7-8% net — illustrating why pre-tax IRR alone is misleading for AIF evaluation. By contrast, an investor in a Cat III long-short AIF receives distributions that are largely tax-free in their hands because the AIF has already paid tax at 30%+. Net-of-fund-tax returns matter more than the headline IRR figure.',
        keyPoints: [
          'Cat I & II: pass-through tax — investor pays at personal rate on each income category.',
          'Cat III: fund-level tax — distributions largely tax-free in investor\'s hands.',
          'Net-of-tax returns differ materially across categories — gross IRR alone is misleading.',
          'Liquidity: Cat I (10-yr lock), Cat II (5-7 yr with periodic distributions), Cat III (open-ended common, with lock-ins).',
          'AIF allocation should come only from the investor\'s long-term (7+ yr) liquidity bucket.',
          'Annual K-1 style reports require CA support for accurate tax computation.',
        ],
        faq: [
          {
            question: 'How are AIF returns reported on my income tax return?',
            answer:
              'For Cat I and Cat II AIFs, you receive an annual statement (similar to a K-1) breaking down your share of the AIF\'s income by category — capital gains, interest, dividends, business income, etc. You report each category in the corresponding section of ITR-2 or ITR-3 (typically ITR-3 for AIF investors due to business-income classification). For Cat III AIFs, the fund pays tax and distributions are reported as exempt or capital-gain in your hands, depending on the specific income type. CA support is essential.',
          },
          {
            question: 'Can I claim tax loss from an AIF against my other capital gains?',
            answer:
              'For Cat I and Cat II pass-through AIFs, your share of the AIF\'s capital gains/losses is reported in your personal return and follows the standard set-off rules. Long-term losses can be set off against long-term gains; short-term losses against short or long-term gains. For Cat III fund-level taxed AIFs, losses incurred at the fund level cannot be passed through to investors for set-off against personal gains — the fund-level tax structure does not allow this.',
          },
          {
            question: 'Is there a way to exit a Cat II AIF early if I need the money?',
            answer:
              'Limited. Some Cat II AIFs permit secondary sales — the investor sells their commitment to another qualified investor, subject to AIF Manager approval, documentation, and (often) discount to NAV. Forced redemption is not available. This is why AIF allocation must come only from the investor\'s long-term liquidity bucket — capital you genuinely will not need for 5-10 years.',
          },
          {
            question: 'What happens if a Cat I VC fund has no successful exits in 10 years?',
            answer:
              'The fund returns whatever capital remains in investments (often nothing or modest amounts) to investors. Cat I VC funds are explicitly high-risk; the venture model assumes a small number of large winners cover the losses on the larger number of failures. The investor must be capable of absorbing a total loss on a portion of their committed capital, with the upside coming from the few outsized exits.',
          },
        ],
        mcqs: [
          {
            question: 'Cat III AIFs are taxed at:',
            options: ['Investor level (pass-through)', 'AIF / fund level', 'No tax', 'Slab rate only'],
            correctAnswer: 1,
            explanation:
              'Cat III AIFs are taxed at the fund level — the AIF pays tax on its income, and distributions to investors are largely tax-free in the investor\'s hands. This contrasts with Cat I and II AIFs which use pass-through tax treatment.',
          },
          {
            question: 'A Cat II AIF\'s typical fund life is:',
            options: ['1-2 years', '5-10 years (closed-ended)', 'Open-ended with daily liquidity', 'Defined by the investor'],
            correctAnswer: 1,
            explanation:
              'Cat II AIFs typically have 5-10 year fund lives with capital-call commitment cycle and periodic distributions. They are not open-ended; investors cannot redeem early at will.',
          },
          {
            question: 'Which liquidity bucket should AIF allocations come from?',
            options: ['Emergency fund', 'Short-term (0-2 yr) goals', 'Medium-term (2-7 yr) goals', 'Long-term (7+ yr) capital'],
            correctAnswer: 3,
            explanation:
              'AIF allocations must come only from the long-term (7+ yr) liquidity bucket — capital the investor genuinely will not need for 7-10+ years. AIFs are not appropriate for emergency, short-term, or even medium-term needs due to the closed-ended structure and capital-call cycle.',
          },
        ],
        summaryNotes: [
          'Cat I & II: pass-through tax; Cat III: fund-level tax.',
          'Liquidity: Cat I/II closed-ended for years; Cat III often open-ended with lock-ins.',
          'Net-of-tax returns matter — gross IRR is misleading.',
          'Allocate AIF only from long-term liquidity bucket; CA support is essential.',
        ],
        relatedTopics: ['what-is-aif', 'aif-three-categories', 'aif-who-should-invest'],
      },
    },

    {
      id: 'aif-who-should-invest',
      title: 'Who Should Invest in an AIF',
      slug: 'aif-who-should-invest',
      content: {
        definition:
          'An AIF is suitable for investors who comfortably exceed the ₹1 crore minimum, have a total liquid wealth of approximately ₹5 crore or more (so the AIF allocation does not over-concentrate the portfolio), can absorb the operational complexity (capital calls, K-1 reports, illiquidity), and have a clear strategic reason to seek private-market exposure or hedge strategies that mutual funds, SIFs, and PMS cannot deliver.',
        explanation:
          'The AIF mis-sale risk is the most consequential of all three high-minimum structures. An investor with ₹2 crore in liquid wealth committing ₹1 crore to a Cat II AIF has 50% of their portfolio locked into a 7-10 year illiquid commitment with capital-call obligations they may not be able to meet if their financial situation changes. The right wealth threshold for AIF is approximately ₹5 crore liquid wealth, where ₹1 crore is 20% of the portfolio and the investor maintains liquidity flexibility for the capital-call cycle. Sophistication and operational readiness are the second filter. AIF investors must understand: capital-call mechanics (committing now but funding gradually), waterfall distributions (not all distributions are profit — much is return of capital), tax K-1 reporting (annual income breakdown across categories requires CA support), and illiquidity (genuinely no exit for 5-10 years on most Cat I/II structures). Strategic clarity is the third filter. AIFs should solve a specific gap. The right AIF answers a specific question: "I want venture capital exposure" → Cat I VC fund. "I want private credit yielding 11-13% with quarterly cash flow" → Cat II private credit AIF. "I want hedged equity for absolute return" → Cat III long-short AIF. If the investor cannot articulate the gap, the allocation is not justified. Trustner\'s AIF framework involves a pre-allocation diligence on the Manager\'s strategy, vintage track record, fee economics, and references from other LPs. AIF allocation is never a "first product" recommendation — it follows mature mutual fund + PMS allocations.',
        realLifeExample:
          'Three case studies. Case 1 (correct fit): Vivek, 55, with ₹15 crore liquid wealth. He has ₹6 crore in mutual funds, ₹3 crore across two PMS managers, ₹3 crore in cash and gold. He wants to add private credit for steady cash yield and hedged equity for downside protection. He commits ₹2 crore to a Cat II private credit AIF and ₹1 crore to a Cat III long-short AIF. Total AIF allocation: 20% of liquid wealth, split across categories and managers. Operationally, he engages a CA who handles 5-7 family offices to manage the K-1 reporting. Case 2 (mis-sale): Anjali, 42, with ₹2.5 crore liquid wealth, was sold a Cat I VC fund at ₹1 crore by an aggressive distributor pitching "10x returns from Indian start-ups". The allocation absorbs 40% of her liquid wealth into a 10-year illiquid commitment with capital-call obligations. Three years in, the VC fund has called ₹65 lakh, none of the underlying start-ups have exited, and she has no visibility into when distributions will start. The mis-sale: AIF was structurally inappropriate at her wealth level. Diversified mutual funds and a small SIF allocation would have given her growth exposure without the illiquidity trap. Case 3 (sophisticated fit): Krishnan family office, ₹100 crore AUM. AIF allocation is ₹35 crore (35% of liquid AUM) split across 8 AIFs — 3 Cat I VC, 3 Cat II (private credit, real estate, distressed), 2 Cat III (long-short). Each commitment is ₹3-5 crore. Vintage diversification across 2024, 2025, 2026 fund vintages. Manager diversification across 8 distinct teams. This is the operationally and strategically correct AIF posture for an Ultra-HNI family office.',
        keyPoints: [
          'AIF is suitable for investors with approximately ₹5 crore+ liquid wealth (so ₹1 crore allocation is ≤20%).',
          'Investors below ₹5 crore liquid wealth should generally stay with MF + SIF + PMS.',
          'Operational readiness for capital calls, K-1 reports, and illiquidity is essential — CA support required.',
          'Each AIF allocation should solve a specific strategic gap (venture exposure, private credit, hedged equity, etc.).',
          'Recommended AIF allocation: 15-30% of liquid wealth for UHNIs, split across 3-8 AIFs and vintages.',
          'AIF is never a first-product recommendation — it follows mature MF + PMS allocations.',
          'Manager and vintage diversification within AIF allocation is critical to manage idiosyncratic risk.',
        ],
        faq: [
          {
            question: 'I have ₹2 crore in savings and an aggressive distributor is pitching a Cat II AIF. Should I invest?',
            answer:
              'No — this is a textbook AIF mis-sale risk. A ₹1 crore commitment at the ₹2 crore wealth level concentrates 50% of your liquid corpus into an illiquid 5-10 year commitment. Stay with mutual funds and consider SIF or PMS as you cross the ₹50 lakh and ₹2 crore liquid wealth thresholds respectively. Revisit AIF only when liquid wealth comfortably exceeds ₹5 crore.',
          },
          {
            question: 'Can the same Investment Manager run multiple AIF schemes?',
            answer:
              'Yes. A single Investment Manager (IM) can run multiple AIF schemes across categories — for example, a Cat II PE fund and a Cat III long-short fund. Each scheme operates with its own PPM, fee structure, and investor base. The investor evaluates each scheme separately even from the same IM.',
          },
          {
            question: 'Is AIF more risky than PMS?',
            answer:
              'Not categorically. Risk depends on the strategy. A Cat II private credit AIF investing in senior-secured loans to mid-market companies may have lower drawdown risk than a long-only equity PMS in a market correction. A Cat I VC fund has materially higher risk than any PMS strategy. The right comparison is "AIF strategy A vs PMS strategy B" — at the strategy level, not the structure level.',
          },
          {
            question: 'How does Trustner select which AIFs to recommend?',
            answer:
              'Trustner\'s AIF framework evaluates: (a) the IM\'s vintage track record across at least one full fund cycle (5+ years); (b) the strategy\'s differentiation from public-market alternatives; (c) the fee economics (management + carried interest) versus expected gross IRR; (d) reference checks with existing LPs; (e) operational quality (timely K-1 reporting, responsive RM, fund administration); (f) regulatory compliance posture. Trustner surfaces 1-2 AIF candidates per identified portfolio gap.',
          },
        ],
        mcqs: [
          {
            question: 'Which investor profile is the LEAST suitable AIF candidate?',
            options: [
              'A 55-year-old with ₹15 crore liquid wealth, allocating ₹2 crore to a Cat II AIF',
              'A 42-year-old with ₹2.5 crore liquid wealth, considering ₹1 crore in a Cat I VC fund',
              'A family office with ₹100 crore AUM, allocating ₹30 crore across 8 AIFs',
              'A 60-year-old with ₹10 crore, allocating ₹2 crore to two Cat II AIFs',
            ],
            correctAnswer: 1,
            explanation:
              'The 42-year-old with ₹2.5 crore liquid wealth would be putting 40% of her portfolio into a single illiquid 10-year commitment. AIF is structurally inappropriate at this wealth level. Diversified mutual funds and a small SIF would be appropriate alternatives.',
          },
          {
            question: 'What is the recommended AIF allocation as a percentage of liquid wealth for UHNIs?',
            options: ['Up to 5%', '15-30%', '50-70%', 'Whatever the IM permits'],
            correctAnswer: 1,
            explanation:
              'The recommended AIF allocation for UHNIs is 15-30% of liquid wealth, split across 3-8 AIFs and multiple vintages to manage manager risk and concentration risk.',
          },
          {
            question: 'AIF is appropriate as which step in an investor\'s wealth journey?',
            options: [
              'First product when starting investing',
              'After mutual funds',
              'After mutual funds and PMS, with mature liquid wealth',
              'Only for institutional investors',
            ],
            correctAnswer: 2,
            explanation:
              'AIF is never a first-product recommendation. It is appropriate after the investor has built mature mutual fund and PMS allocations and has liquid wealth comfortably exceeding ₹5 crore so a ₹1 crore commitment fits a 15-25% allocation.',
          },
        ],
        summaryNotes: [
          'AIF suits investors with ₹5 crore+ liquid wealth — not ₹2 crore.',
          'Operational readiness (capital calls, K-1, illiquidity) is essential.',
          'Recommended allocation: 15-30% for UHNIs, split across categories, managers, vintages.',
          'AIF is a sophistication layer — never a first product.',
          'Trustner\'s pre-empanelment diligence covers vintage, fees, references, operations.',
        ],
        relatedTopics: ['what-is-aif', 'aif-three-categories', 'aif-tax-liquidity'],
      },
    },
  ],
};
