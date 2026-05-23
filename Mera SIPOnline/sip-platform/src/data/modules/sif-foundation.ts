import { LearningModule } from '@/types/learning';

export const sifFoundationModule: LearningModule = {
  id: 'sif-foundation',
  title: 'SIF Foundation',
  slug: 'sif-foundation',
  icon: 'Layers',
  description:
    'Specialized Investment Funds (SIF) are SEBI\'s newest investment vehicle category — engineered to bridge the gap between retail mutual funds and HNI-only PMS. This foundation track covers what SIFs are, the strategies they enable, who they suit, and how Trustner positions SIF allocation within a balanced wealth plan.',
  level: 'beginner',
  color: 'from-indigo-600 to-purple-600',
  estimatedTime: '40 min',
  track: 'sif',
  sections: [
    // ─── 1. What is a SIF ───
    {
      id: 'sif-what-is',
      title: 'What is a Specialized Investment Fund?',
      slug: 'what-is-sif',
      content: {
        definition:
          'A Specialized Investment Fund (SIF) is a SEBI-regulated pooled investment vehicle introduced as a distinct category in 2024 to occupy the structural gap between traditional mutual funds and Portfolio Management Services (PMS). SIFs allow Asset Management Companies to launch strategies that go beyond plain long-only equity or debt — including long-short equity, derivatives-based strategies, and concentrated portfolios — while keeping the minimum investment at ₹10 lakh per investor (versus ₹50 lakh for PMS and ₹500 SIP for mutual funds).',
        explanation:
          'For two decades, Indian investors faced a structural cliff. Mutual funds were retail-friendly but rule-bound — no derivatives beyond hedging, no shorting, no leverage. PMS was sophisticated but locked behind a ₹50 lakh minimum that most upper-middle-class families could not justify for a single allocation. SIF is the bridge SEBI built. With SIFs, an asset manager can run a long-short equity strategy that protects capital during bear markets, or a market-neutral debt strategy that aims for absolute returns regardless of yield curve direction — products that were previously available only through PMS or hedge-fund-style AIFs. Crucially, the ₹10 lakh minimum brings these capabilities to the affluent retail investor without requiring the ₹50 lakh PMS commitment. Operationally, SIFs use the mutual fund infrastructure — daily NAV publication, RTA-managed transactions, AMFI distributor framework — making them familiar to existing MF investors.',
        realLifeExample:
          'Consider Anjali, a 38-year-old senior product manager in Bangalore with ₹2 crore in liquid assets across mutual funds and bank deposits. She wants exposure to a strategy that can short overvalued mid-caps while staying long quality large-caps — to protect her capital during corrections. Pre-SIF, her only option was PMS at ₹50 lakh minimum, which would have concentrated 25% of her wealth in one strategy. With SIF, she allocates ₹10 lakh to a long-short equity SIF, retaining diversification across her overall portfolio. She gets daily NAV, monthly factsheets, redemption flexibility (subject to the SIF\'s liquidity terms), and pays 22.88% capital gains tax (post FY24 rules for non-equity-classified funds, depending on the SIF\'s underlying asset mix).',
        keyPoints: [
          'SIF is a SEBI-regulated pooled vehicle introduced in 2024, sitting between mutual funds and PMS.',
          'Minimum investment is ₹10 lakh per investor — designed for upper-mass-affluent and HNI segments.',
          'SIFs can run strategies unavailable to mutual funds — long-short equity, derivatives, concentrated portfolios.',
          'Operationally similar to mutual funds: daily NAV, RTA-managed, AMFI distribution framework.',
          'Distribution requires AMFI registration as a SIF Distributor — Trustner Asset Services holds this empanelment.',
          'Three primary SIF strategy categories: Equity Long-Short, Debt Long-Short, and Hybrid Long-Short.',
          'Tax treatment depends on the underlying asset mix per SEBI/CBDT classification.',
        ],
        faq: [
          {
            question: 'How is a SIF different from a regular mutual fund?',
            answer:
              'A regular mutual fund can only take long positions and use derivatives strictly for hedging. A SIF can short securities, use derivatives strategically, and run more concentrated portfolios. The SIF was created precisely to enable strategies that mutual funds are structurally prohibited from running.',
          },
          {
            question: 'Why is the minimum ₹10 lakh — can it be lowered?',
            answer:
              'SEBI set ₹10 lakh as the threshold to ensure that SIF investors are financially capable of absorbing the higher complexity and potential drawdowns of these strategies. The threshold also helps AMCs maintain a smaller, more sophisticated investor base. The ₹10 lakh minimum applies per investor across all schemes of a single SIF — not per scheme.',
          },
          {
            question: 'Can NRIs invest in SIFs?',
            answer:
              'Yes, NRIs can invest in SIFs subject to FEMA rules and the specific SIF scheme\'s offer document terms. The investment is treated similarly to NRI mutual fund investments, and the ₹10 lakh minimum applies in INR terms.',
          },
          {
            question: 'Is liquidity available in SIFs the same as mutual funds?',
            answer:
              'Liquidity terms vary by SIF scheme. Some SIFs offer T+2 redemption like open-ended mutual funds; others may have fortnightly or monthly liquidity windows because of the underlying strategy (e.g., long-short positions take time to unwind). Always read the offer document for the specific scheme.',
          },
        ],
        mcqs: [
          {
            question: 'What is the minimum investment threshold for a SIF?',
            options: ['₹500 (SIP)', '₹50,000', '₹10 lakh', '₹50 lakh'],
            correctAnswer: 2,
            explanation:
              'SEBI mandates a minimum investment of ₹10 lakh per investor for SIFs. This is lower than PMS (₹50 lakh) but materially higher than retail mutual funds (₹500 SIP).',
          },
          {
            question: 'Which body primarily regulates SIFs in India?',
            options: ['IRDAI', 'RBI', 'SEBI', 'IFSCA'],
            correctAnswer: 2,
            explanation:
              'SIFs are regulated by SEBI under a dedicated framework introduced in 2024, with AMFI providing self-regulatory oversight on distribution and disclosures.',
          },
          {
            question: 'Which of the following can a SIF do that a regular mutual fund cannot?',
            options: [
              'Publish daily NAV',
              'Be sold by AMFI-registered distributors',
              'Take short positions in equities',
              'Charge an expense ratio',
            ],
            correctAnswer: 2,
            explanation:
              'A defining feature of SIFs is the ability to take short positions and run long-short strategies. Regular mutual funds in India can only use derivatives for hedging and cannot short securities outright.',
          },
        ],
        summaryNotes: [
          'SIF is a distinct SEBI category, introduced in 2024, sitting between mutual funds and PMS.',
          '₹10 lakh minimum, three primary strategy types: Equity LS, Debt LS, Hybrid LS.',
          'Operationally similar to mutual funds (daily NAV, RTA, AMFI distribution) but with PMS-level strategic flexibility.',
          'Trustner Asset Services Pvt. Ltd. is empanelled as an AMFI Registered SIF Distributor.',
        ],
        relatedTopics: ['sif-vs-mf-vs-pms', 'sif-strategies', 'sif-who-should-invest'],
      },
    },

    // ─── 2. SIF vs MF vs PMS ───
    {
      id: 'sif-vs-mf-vs-pms',
      title: 'SIF vs Mutual Funds vs PMS — How to Choose',
      slug: 'sif-vs-mf-vs-pms',
      content: {
        definition:
          'The choice between mutual funds, Specialized Investment Funds (SIF), and Portfolio Management Services (PMS) depends on three primary factors: the investor\'s ticket size, the desired strategic flexibility, and the operational preferences around transparency and tax treatment.',
        explanation:
          'A mutual fund is the right answer for the vast majority of Indian investors. It offers daily liquidity, ₹500 minimums, professional management, full SEBI regulation, and the ability to build a diversified portfolio with as little as ₹2,500 spread across five funds. The trade-off is regulatory simplicity — no shorting, limited derivative use, mandatory diversification rules, no concentrated bets. A PMS, at the other end, offers complete tailoring. Each investor\'s portfolio sits in their own demat account, the manager runs concentrated 15-30 stock portfolios, and the strategy can be customised. The trade-off is the ₹50 lakh minimum, which often means a single PMS allocation absorbs 20-30% of an HNI\'s liquid wealth — unsuitable for testing or for clients who have not yet accumulated sufficient capital. The SIF is precisely positioned for the middle. At ₹10 lakh, an investor with a ₹50 lakh-₹2 crore liquid corpus can comfortably allocate 5-15% to a single SIF strategy without compromising diversification. The strategic flexibility (long-short, concentrated, hedged) sits closer to PMS than to mutual funds. For an investor who wants downside-protected equity exposure or absolute-return debt, SIF often becomes the most efficient vehicle on a risk-adjusted, tax-adjusted, and complexity-adjusted basis.',
        realLifeExample:
          'Take three investors at different stages. Rohit, 26, with ₹50,000 to invest monthly: mutual fund SIPs into a flexi-cap and a multi-cap are right for him — capital, complexity, and required diversification all match. Priya, 42, with ₹80 lakh of liquid wealth: she allocates ₹40 lakh across mutual funds, ₹15 lakh to a long-short equity SIF for downside protection, ₹15 lakh to a Multi-Asset SIF, and keeps ₹10 lakh in liquid funds. SIF becomes her sophistication layer without the ₹50 lakh PMS commitment. Vikram, 55, with ₹6 crore: he runs ₹2 crore in mutual funds (core), ₹2 crore in a multi-strategy PMS (concentrated equity bets), ₹1 crore in a Cat II AIF (private credit), and ₹1 crore across two SIFs (long-short and hedged debt). All three choices are correct — the structure follows the wallet, the time horizon, and the strategic need.',
        keyPoints: [
          'Mutual funds: ₹500-₹5,000 minimums, daily liquidity, mass-market, regulated against shorting and concentration.',
          'SIF: ₹10 lakh minimum, near-MF operations, PMS-level strategic flexibility (shorting, derivatives, concentration).',
          'PMS: ₹50 lakh minimum, full customisation, securities held in investor\'s own demat, fees often performance-linked.',
          'SIF was designed for the affluent retail / lower-HNI segment that previously had no good middle-ground product.',
          'Tax treatment differs across the three depending on holding period and the underlying asset classification.',
          'Distribution: MF + SIF use AMFI registration; PMS uses APMI registration. Trustner Asset Services holds both.',
        ],
        faq: [
          {
            question: 'Can I get the same long-short strategy in a mutual fund?',
            answer:
              'No. Indian mutual funds cannot run net-short positions. Some "Equity Savings" or arbitrage funds use derivatives for hedged positions, but they cannot directly short equities to express a negative view. That capability is unique to SIFs and AIFs in Cat III, and to PMS strategies that explicitly permit it.',
          },
          {
            question: 'Is the tax on SIFs better or worse than mutual funds?',
            answer:
              'Tax depends on the underlying asset mix. An SIF with predominantly Indian equity exposure may qualify for equity-fund tax treatment (LTCG above ₹1.25 lakh at 12.5% beyond 12 months). An SIF with debt or international exposure may attract slab-rate tax on gains under post-FY24 rules. Always read the offer document and consult your tax advisor.',
          },
          {
            question: 'Do PMS portfolios hold actual stocks in my name?',
            answer:
              'Yes. In a PMS, the securities sit in the investor\'s own demat account. The investor receives direct corporate-action benefits (dividends, bonuses, rights). In contrast, mutual funds and SIFs pool investor money into a fund vehicle, which holds the securities. Investors hold units, not the underlying stocks.',
          },
          {
            question: 'Is a SIF safer than a PMS?',
            answer:
              'Safety is not directly tied to the structure — both are SEBI-regulated. Risk depends on the strategy mandate. A long-short equity SIF can have risk comparable to or lower than a long-only equity PMS (because it hedges). Read the strategy mandate and historical drawdown profile before deciding.',
          },
        ],
        mcqs: [
          {
            question: 'Which vehicle has the lowest minimum investment threshold?',
            options: ['SIF (₹10 lakh)', 'PMS (₹50 lakh)', 'AIF (₹1 crore)', 'Mutual Fund (₹500 SIP)'],
            correctAnswer: 3,
            explanation:
              'Mutual funds have the lowest entry barrier at ₹500 SIP / ₹5,000 lumpsum, making them the most accessible regulated investment vehicle in India.',
          },
          {
            question: 'In which structure does the investor directly own the underlying securities?',
            options: ['Mutual Fund', 'SIF', 'PMS', 'AIF'],
            correctAnswer: 2,
            explanation:
              'PMS portfolios are held in the investor\'s own demat account — the investor is the legal owner of the underlying securities. Mutual funds, SIFs, and AIFs are pooled vehicles where investors hold units.',
          },
          {
            question:
              'An investor with ₹80 lakh liquid wealth wants downside-protected equity exposure to a long-short strategy. What is the most capital-efficient choice?',
            options: [
              'Allocate the full ₹50 lakh to a long-short PMS',
              'Use an "equity savings" mutual fund category',
              'Allocate ₹10-15 lakh to a long-short SIF and keep the balance in MF + cash',
              'Wait until she has ₹1 crore and use an AIF',
            ],
            correctAnswer: 2,
            explanation:
              'A SIF allocation at ₹10-15 lakh delivers the long-short strategy without absorbing ₹50 lakh (60%+ of her wealth) into a single PMS. This preserves diversification across her portfolio while still accessing the sophisticated strategy.',
          },
        ],
        summaryNotes: [
          'Three structures cover the Indian investor spectrum: MF (retail), SIF (affluent), PMS (HNI), AIF (UHNI).',
          'SIF\'s ₹10 lakh threshold democratises strategies that were previously PMS-only.',
          'Choice depends on ticket size, strategy need, transparency preference, and tax positioning.',
          'Trustner is empanelled to distribute MF, SIF, and PMS — a single Relationship Manager covers the full ladder.',
        ],
        relatedTopics: ['what-is-sif', 'sif-strategies', 'pms-foundation'],
      },
    },

    // ─── 3. SIF Strategies ───
    {
      id: 'sif-strategies',
      title: 'The Three SIF Strategy Categories',
      slug: 'sif-strategies',
      content: {
        definition:
          'SEBI\'s SIF framework permits three primary strategy categories: Equity Long-Short, Debt Long-Short, and Hybrid Long-Short. Each category targets a distinct risk-return objective and uses long and short positions, derivatives, and concentrated bets in different proportions to deliver outcomes unavailable in traditional mutual funds.',
        explanation:
          'An Equity Long-Short SIF holds a portfolio of long equity positions (companies the manager expects to outperform) alongside short positions (companies expected to underperform). The net equity exposure can range from fully long (100% net long) to market-neutral (zero net long). The objective is asymmetric — to participate in equity upside while cushioning drawdowns. A typical implementation might hold ₹100 in long positions and ₹40 in short positions, leaving ₹60 of net equity exposure. During a 20% market correction, the short book gains while the long book falls, materially reducing the drawdown versus a long-only fund. A Debt Long-Short SIF runs a similar concept on the bond and yield-curve side. The manager goes long bonds expected to rally (or yield-curve segments expected to flatten) and shorts bonds expected to underperform. Such SIFs target absolute returns regardless of whether the broader interest rate cycle is rising or falling — useful for investors uncomfortable with the duration risk in traditional debt funds. A Hybrid Long-Short SIF combines both — typically a 50/50 or 60/40 split between equity and debt long-short books — delivering a one-stop diversified strategy with hedged exposure on both sides. Each strategy has its own behaviour through market cycles, and each makes sense for different investor profiles.',
        realLifeExample:
          'In the early-2026 rate-cycle uncertainty, where Indian equities were volatile and bond yields swung between 6.7% and 7.1%, an Equity Long-Short SIF holding 80% net long would have absorbed roughly 60-70% of the equity drawdown during the late-March correction — versus a long-only flexi-cap fund that took the full hit. A Debt Long-Short SIF holding short positions in long-duration bonds while staying long short-duration would have delivered 6-7% returns even in a year where the duration-heavy bond fund index moved sideways. A Hybrid Long-Short SIF combining both would have delivered 8-9% with materially lower volatility than a balanced fund. None of these outcomes are guaranteed — they depend entirely on the manager\'s skill and the strategy execution — but the strategic flexibility that SIFs provide simply does not exist in the mutual fund universe.',
        keyPoints: [
          'Three primary SIF strategy categories: Equity LS, Debt LS, Hybrid LS.',
          'Equity LS: long quality stocks, short overvalued / weakening stocks. Net exposure 0-100%.',
          'Debt LS: long bonds expected to rally, short bonds expected to underperform. Targets absolute returns.',
          'Hybrid LS: combines both, typically 50/50 or 60/40 split.',
          'All three use derivatives, leverage (within SEBI limits), and concentrated bets when the strategy mandates.',
          'Performance depends heavily on manager skill — historical returns of the underlying team are the primary diligence input.',
        ],
        faq: [
          {
            question: 'How is "shorting" implemented in a SIF?',
            answer:
              'SIFs short securities through stock futures, single-stock futures, index futures, or by borrowing-and-selling via the securities lending and borrowing (SLB) mechanism. The exact mix depends on the strategy and is disclosed in the offer document.',
          },
          {
            question: 'How much can an SIF leverage?',
            answer:
              'SEBI permits SIFs gross exposure (long + short combined) up to 200% of net assets in most cases, with strict risk-management triggers. The exact leverage limits are scheme-specific and disclosed in the SID (Scheme Information Document).',
          },
          {
            question: 'Are SIF returns guaranteed or absolute?',
            answer:
              'No — SIF returns are NOT guaranteed and are NOT absolute. The phrase "absolute return strategy" describes the goal (positive returns regardless of market direction) but not the outcome. SIFs can lose money, particularly when the manager\'s long and short calls both move against the position simultaneously.',
          },
          {
            question: 'Should an SIF replace my mutual fund SIPs?',
            answer:
              'No. SIF is a complement, not a replacement. The recommended approach is to keep mutual fund SIPs as the diversified core (60-80% of equity allocation) and add SIF as a sophistication / hedging layer (10-20%). Speak to your Trustner Relationship Manager for a personalised allocation plan.',
          },
        ],
        mcqs: [
          {
            question: 'What is the primary objective of an Equity Long-Short SIF?',
            options: [
              'To maximise upside through full long-only exposure',
              'To hedge equity exposure and reduce drawdowns through short positions',
              'To trade short-term equity momentum',
              'To invest only in government bonds',
            ],
            correctAnswer: 1,
            explanation:
              'An Equity Long-Short SIF\'s primary objective is asymmetric — to participate in equity upside via long positions while cushioning drawdowns through short positions. The net equity exposure is deliberately variable and managed.',
          },
          {
            question: 'A Hybrid Long-Short SIF typically combines:',
            options: [
              'Indian equity and US equity',
              'Equity LS and Debt LS strategies',
              'Gold and silver positions',
              'Only large-cap and mid-cap stocks',
            ],
            correctAnswer: 1,
            explanation:
              'A Hybrid Long-Short SIF combines an Equity Long-Short book with a Debt Long-Short book, typically in a 50/50 or 60/40 split, to deliver hedged exposure across both asset classes.',
          },
          {
            question: 'Which of the following is true about SIF returns?',
            options: [
              'SIF returns are guaranteed by SEBI',
              'Absolute-return strategies always deliver positive returns',
              'SIF returns depend on manager skill and can be negative',
              'SIFs always outperform mutual funds',
            ],
            correctAnswer: 2,
            explanation:
              'SIF returns are not guaranteed and depend on manager skill in executing the strategy. Even "absolute-return" SIFs can lose money when long and short calls both move against the position simultaneously.',
          },
        ],
        summaryNotes: [
          'Three strategy categories: Equity LS, Debt LS, Hybrid LS — each with distinct risk-return profiles.',
          'Long-short = long quality positions + short weak / overvalued positions to dampen drawdowns.',
          'SIFs use derivatives, SLB, and (within SEBI limits) leverage to execute strategies.',
          'Returns are not guaranteed; manager skill is the dominant variable.',
        ],
        relatedTopics: ['what-is-sif', 'sif-vs-mf-vs-pms', 'sif-who-should-invest'],
      },
    },

    // ─── 4. Who Should Invest in SIF ───
    {
      id: 'sif-who-should-invest',
      title: 'Who Should Invest in a SIF',
      slug: 'sif-who-should-invest',
      content: {
        definition:
          'A SIF is suitable for investors who meet the ₹10 lakh minimum, have a sufficiently large overall liquid corpus that a ₹10 lakh allocation does not over-concentrate the portfolio, possess intermediate-to-high investment literacy to understand long-short strategies, and have a clear strategic reason to access capabilities unavailable in mutual funds.',
        explanation:
          'The single most common SIF mis-sale risk is putting an investor with ₹15-20 lakh of total liquid wealth into a SIF — that ₹10 lakh allocation absorbs 50-70% of their portfolio in one strategy, defeating diversification. SIFs are NOT for investors at the ₹10 lakh capital level; they are for investors at the ₹50 lakh+ liquid wealth level, where ₹10 lakh represents a manageable 10-20% allocation. Investor literacy is the second filter. SIFs use long-short positioning, derivatives, and at times concentrated portfolios. An investor must understand that the strategy can underperform a long-only fund during sharp bull markets (because the short book drags), and equally that the strategy can outperform during corrections. Without this conceptual clarity, the investor is likely to redeem at exactly the wrong time. Strategic reason is the third filter. An SIF should solve a specific portfolio problem — downside protection, absolute return targeting, or access to a manager with a unique skill. If the investor cannot articulate why a SIF rather than another diversified mutual fund, the allocation likely is not justified. The recommended approach is a structured conversation with your Trustner Relationship Manager: map the existing portfolio, identify the gap, and only then evaluate which SIF (if any) fills that gap.',
        realLifeExample:
          'Sandeep, 48, a senior partner at a consulting firm with ₹3 crore in liquid wealth, has 70% in equity mutual funds, 20% in PMS, and 10% in liquid funds. He observed that his portfolio took a 12% drawdown during the late-March 2026 correction. He approaches Trustner saying he wants a hedged equity allocation. The Relationship Manager evaluates two options: (a) reallocate 10% from his equity MF bucket to a long-short equity SIF, capping the drawdown; (b) increase his liquid fund allocation. Option (a) preserves equity participation while introducing a hedged layer. The ₹30 lakh allocation across two SIFs (one equity LS, one hybrid LS) keeps his portfolio diversified and addresses the specific drawdown concern. By contrast, his colleague Megha, 32, with ₹35 lakh in liquid wealth, would not be a fit for SIFs at this stage — a ₹10 lakh allocation would absorb nearly 30% of her portfolio in one strategy. For her, a Balanced Advantage Fund or Multi-Asset Fund mutual fund would deliver similar volatility-dampening at a fraction of the concentration risk.',
        keyPoints: [
          'SIFs are designed for investors with ₹50 lakh+ liquid wealth, where a ₹10 lakh allocation is 10-20% of portfolio.',
          'Investors below ₹50 lakh liquid wealth should generally stay with diversified mutual funds.',
          'Intermediate-to-high investment literacy is essential — understand long-short, derivatives, drawdown risk.',
          'Each SIF allocation should solve a specific portfolio problem (downside protection, absolute return, manager skill access).',
          'A typical SIF allocation is 10-20% of overall liquid wealth, not the entire investment plan.',
          'A structured conversation with a Relationship Manager is the recommended starting point.',
        ],
        faq: [
          {
            question: 'I have ₹20 lakh in savings. Should I put ₹10 lakh into a SIF?',
            answer:
              'No, this is a textbook mis-sale risk. A ₹10 lakh SIF allocation at the ₹20 lakh wealth level concentrates 50% of your liquid corpus in one strategy. Stay with diversified mutual funds (a flexi-cap, a multi-cap, and a debt allocation) until your liquid wealth comfortably exceeds ₹50 lakh.',
          },
          {
            question: 'Are SIF redemptions T+2 like mutual funds?',
            answer:
              'It depends on the SIF\'s liquidity terms. Some SIFs offer T+2 redemption like open-ended mutual funds; others have fortnightly or monthly liquidity windows because of the strategy\'s holding-period requirements. Always read the offer document.',
          },
          {
            question: 'How does Trustner select which SIF to recommend?',
            answer:
              'Trustner\'s research framework evaluates: (a) the strategy\'s historical drawdown control; (b) the fund manager\'s long-short experience and tenure; (c) the AMC\'s risk management infrastructure; (d) the scheme\'s liquidity terms; (e) fee structure including performance fees if any; (f) tax positioning. We surface the top 1-2 candidates that match your portfolio gap.',
          },
          {
            question: 'Can I switch between SIFs like switching between mutual funds?',
            answer:
              'Switching across SIFs of different AMCs is not direct — it requires a redemption from one and a fresh subscription into another, with the corresponding tax event. Within the same AMC, some SIFs offer inter-scheme switches subject to scheme rules. This is one operational difference from open-ended mutual funds.',
          },
        ],
        mcqs: [
          {
            question:
              'Which investor profile is the LEAST suitable candidate for a SIF allocation?',
            options: [
              'A 45-year-old with ₹2 crore liquid wealth, allocating ₹15 lakh to a long-short SIF',
              'A 35-year-old with ₹25 lakh total savings, considering ₹10 lakh in a SIF',
              'A 55-year-old with ₹80 lakh, allocating ₹10 lakh to a hybrid LS SIF',
              'A 50-year-old with ₹5 crore, splitting ₹50 lakh across three SIFs',
            ],
            correctAnswer: 1,
            explanation:
              'The 35-year-old with only ₹25 lakh total savings would be putting 40% of liquid wealth into a single SIF — over-concentration. Diversified mutual funds are the right vehicle until liquid wealth comfortably exceeds ₹50 lakh.',
          },
          {
            question: 'What is the recommended SIF allocation as a percentage of liquid wealth?',
            options: ['Up to 5%', '10-20%', '50-70%', 'Whatever the AMC permits'],
            correctAnswer: 1,
            explanation:
              'The recommended SIF allocation is 10-20% of overall liquid wealth, ensuring diversification across multiple strategies and structures. The remainder typically sits in mutual funds, PMS (if appropriate), and cash/liquid.',
          },
          {
            question: 'Before allocating to a SIF, an investor should be able to articulate:',
            options: [
              'Which AMC has the lowest TER',
              'The specific portfolio gap the SIF will fill',
              'Which star rating the fund holds',
              'Whether the fund manager appears in business news',
            ],
            correctAnswer: 1,
            explanation:
              'A SIF allocation should solve a specific portfolio problem — downside protection, absolute return targeting, or access to a unique manager skill. If the investor cannot articulate the gap, the allocation is not yet justified.',
          },
        ],
        summaryNotes: [
          'SIFs suit investors with ₹50 lakh+ liquid wealth, not ₹10 lakh wealth.',
          'Each SIF allocation must solve a specific portfolio gap.',
          'Recommended allocation: 10-20% of liquid wealth, not the core.',
          'Always start with a portfolio review, not a product pitch.',
        ],
        relatedTopics: ['what-is-sif', 'sif-strategies', 'sif-tax-distribution'],
      },
    },

    // ─── 5. Tax & Distribution Framework ───
    {
      id: 'sif-tax-distribution',
      title: 'SIF Tax Treatment & Distribution Framework',
      slug: 'sif-tax-distribution',
      content: {
        definition:
          'The tax treatment of a Specialized Investment Fund depends on the underlying asset mix per SEBI/CBDT classification rules. The distribution framework requires distributors to hold AMFI registration as a SIF Distributor, with specific disclosure and suitability requirements above and beyond standard mutual fund distribution.',
        explanation:
          'On the tax side, the post-FY24 Finance Act rationalised mutual fund taxation across categories. For SIFs, the tax treatment follows the underlying asset mix at the scheme level. A SIF whose portfolio holds 65% or more in domestic equities (including derivatives that map to domestic equity exposure) qualifies for equity-fund taxation: short-term capital gains (STCG, on units held under 12 months) are taxed at 20%, and long-term capital gains (LTCG, units held over 12 months) are taxed at 12.5% on gains exceeding ₹1.25 lakh per financial year. A SIF with predominantly debt or international exposure attracts slab-rate taxation on gains regardless of holding period (post the FY24 changes for non-equity-classified funds). The investor must read the scheme\'s tax categorisation disclosure in the SID before allocation. On the distribution side, SEBI requires AMFI registration as a SIF Distributor — which is a separate empanelment from standard mutual fund distribution. Trustner Asset Services Pvt. Ltd. holds this empanelment as part of its broader registration. Distributors must complete additional suitability assessment (the investor\'s wealth threshold, prior investment experience, and articulated strategic need) before facilitating a SIF subscription. This is to prevent the mis-sale risks that retail-pushing of complex strategies has historically caused in India.',
        realLifeExample:
          'Take an investor who allocates ₹15 lakh to a long-short equity SIF in May 2026 and redeems at ₹20 lakh in May 2027 (held for 12 months). The gain is ₹5 lakh. Assuming the SIF qualifies for equity-fund tax treatment (65%+ domestic equity exposure on average), LTCG applies. The first ₹1.25 lakh of equity LTCG in the financial year is exempt; the remaining ₹3.75 lakh attracts 12.5% LTCG = ₹46,875 tax. Net realised: ₹5,00,000 − ₹46,875 = ₹4,53,125. If the same investor had been in a debt-classified SIF and held for 12 months, the entire ₹5 lakh gain would be taxed at the investor\'s slab rate (assume 30% slab) = ₹1.5 lakh tax. Net realised: ₹3.5 lakh. The tax delta is material — and depends entirely on the underlying asset mix, which is disclosed upfront in the offer document.',
        keyPoints: [
          'SIF tax treatment depends on the underlying asset mix per SEBI/CBDT classification.',
          'Equity-classified SIFs (65%+ domestic equity): STCG 20% (under 12 months), LTCG 12.5% beyond ₹1.25 lakh exemption.',
          'Debt-classified SIFs: slab-rate tax on gains regardless of holding period, post-FY24 rules.',
          'Distribution requires separate AMFI SIF Distributor empanelment — Trustner holds this.',
          'Distributors must complete enhanced suitability assessment before facilitating a SIF subscription.',
          'Investors must read the scheme\'s tax categorisation in the SID before allocation.',
        ],
        faq: [
          {
            question: 'How do I know my SIF\'s tax treatment in advance?',
            answer:
              'The Scheme Information Document (SID) of every SIF discloses the asset allocation range and the resulting tax category (equity-classified or debt-classified). Your Trustner Relationship Manager will share the relevant disclosures before you commit. If the asset mix can vary materially over time, the worst-case tax treatment is also disclosed.',
          },
          {
            question: 'Are SIF distributor commissions different from mutual fund commissions?',
            answer:
              'SIF distribution typically attracts a comparable trail-commission structure to mutual funds, paid by the AMC out of the scheme\'s expenses. The investor does not pay the distributor directly. Specific commission rates vary by AMC and scheme. SEBI mandates that any commission paid is disclosed to the investor in writing.',
          },
          {
            question: 'Can my Trustner Relationship Manager give tax advice on SIFs?',
            answer:
              'Trustner Asset Services Pvt. Ltd. is an AMFI Registered Mutual Fund Distributor and SIF Distributor (ARN-286886) — not a registered tax advisor. Your Relationship Manager will share the scheme\'s SID-disclosed tax categorisation and high-level scenarios, but the precise tax computation for your situation should be confirmed with your tax consultant or chartered accountant.',
          },
          {
            question: 'Is GST applicable on SIF investments?',
            answer:
              'GST does not apply to SIF subscription or redemption itself. GST is embedded in the management fee that the AMC charges as part of the scheme\'s expense ratio — this is reflected in the daily NAV automatically, no separate GST is levied on the investor.',
          },
        ],
        mcqs: [
          {
            question:
              'A SIF holds 70% in domestic equity and 30% in equity derivatives mapped to domestic equity. How is it likely classified for tax?',
            options: [
              'Debt-classified — slab-rate tax',
              'Equity-classified — LTCG at 12.5% beyond ₹1.25 lakh',
              'International fund — slab-rate tax',
              'Hybrid — separate tax treatment',
            ],
            correctAnswer: 1,
            explanation:
              'When the SIF holds 65%+ in domestic equity (including equity derivative exposure that maps to domestic equity), it typically qualifies for equity-fund taxation. The SID disclosure confirms the exact classification.',
          },
          {
            question: 'For a SIF Distributor empanelment, what is required?',
            options: [
              'Only an ARN (mutual fund registration)',
              'Separate AMFI registration as a SIF Distributor',
              'IRDAI broker license',
              'No additional registration beyond an ARN',
            ],
            correctAnswer: 1,
            explanation:
              'SIF distribution requires a separate AMFI registration as a SIF Distributor, in addition to the standard ARN for mutual fund distribution. This ensures distributors meet the enhanced suitability framework SEBI mandates for SIFs.',
          },
          {
            question:
              'An investor in the 30% slab redeems ₹5 lakh of LTCG from a debt-classified SIF held for 18 months. The tax (post-FY24 rules) is approximately:',
            options: ['₹62,500', '₹1,50,000', '₹46,875', 'Zero (LTCG exemption)'],
            correctAnswer: 1,
            explanation:
              'Post-FY24, debt-classified funds attract slab-rate tax on capital gains regardless of holding period. At 30% slab, ₹5 lakh of gains attracts ₹1.5 lakh in tax (excluding cess and surcharge).',
          },
        ],
        summaryNotes: [
          'SIF tax depends on the underlying asset mix per CBDT classification.',
          'Equity-classified: STCG 20%, LTCG 12.5% beyond ₹1.25 lakh.',
          'Debt-classified: slab-rate tax on gains, post-FY24.',
          'Distribution requires AMFI SIF Distributor empanelment — Trustner holds this.',
          'Always confirm tax positioning via the SID and your tax consultant.',
        ],
        relatedTopics: ['what-is-sif', 'sif-vs-mf-vs-pms', 'sif-who-should-invest'],
      },
    },
  ],
};
