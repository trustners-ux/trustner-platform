import { LearningModule } from '@/types/learning';

export const pmsTaxOperationsModule: LearningModule = {
  id: 'pms-tax-operations',
  title: 'PMS Tax & Operations',
  slug: 'pms-tax-operations',
  icon: 'BriefcaseBusiness',
  description:
    'PMS tax computation operates on a transaction-by-transaction basis in the investor\'s own demat account. This module covers capital gains tax mechanics, fee deductibility, dividend handling, and the operational workflow that runs across the year.',
  level: 'intermediate',
  color: 'from-blue-700 to-cyan-600',
  estimatedTime: '30 min',
  track: 'pms',
  sections: [
    {
      id: 'pms-tax-computation',
      title: 'PMS Tax Computation — Transaction-Level Mechanics',
      slug: 'pms-tax-computation',
      content: {
        definition:
          'PMS tax operates on each individual transaction in the investor\'s demat account. Long-term capital gains (held over 12 months) on listed equity attract 12.5% tax above the ₹1.25 lakh annual exemption; short-term capital gains (held under 12 months) attract 20% tax. Each Buy and each Sell creates a separate cost basis and gain calculation, computed by FIFO methodology.',
        explanation:
          'Unlike a mutual fund where tax events occur only on redemption, a PMS portfolio creates tax events on every transaction the manager executes. A typical PMS with 30-50% annual turnover generates 50-100 buy-sell transactions per year per investor. Each Sell transaction\'s cost basis is computed using First-In-First-Out (FIFO) — the earliest-bought lot of that stock is matched against the sold quantity. The holding period is computed from the original purchase date of those specific shares to the sale date. This granularity creates complexity in tax computation and reporting. The PMS manager\'s annual capital gains statement details every transaction with: date of buy, date of sell, quantity, cost basis (FIFO-matched), sale value, gain/loss, holding period (LTCG or STCG classification). The investor reports this in Schedule CG of ITR-2 or ITR-3 with appropriate aggregation. The ₹1.25 lakh annual equity LTCG exemption applies aggregate across all sources — PMS LTCG + mutual fund LTCG + direct stock LTCG combined — not per source. CA support is recommended given the volume and granularity. Trustner\'s framework includes coordination with the client\'s CA at year-end.',
        realLifeExample:
          'A representative annual PMS tax statement for a ₹50 lakh investment with 38% turnover: 64 buy transactions and 47 sell transactions during the year. Of the 47 sells: 12 qualified as STCG (held under 12 months), aggregate gain ₹1.85 lakh, tax @ 20% = ₹37,000. 35 qualified as LTCG (held over 12 months), aggregate gain ₹4.20 lakh. The investor\'s total equity LTCG for the FY (PMS + mutual fund + direct stocks) is ₹5.10 lakh; first ₹1.25 lakh exempt, balance ₹3.85 lakh taxable @ 12.5% = ₹48,125. Add cess @ 4% on each = total tax ₹85,125 + cess ₹3,405 = ₹88,530. Net realised: ₹6.05 lakh gross gains − ₹88,530 tax = ₹5.16 lakh post-tax. The CA reconciles the PMS statement against the demat account broker statement to ensure no discrepancy before filing.',
        keyPoints: [
          'Each transaction = separate tax event; FIFO methodology for cost basis.',
          'LTCG (>12 months held) on listed equity: 12.5% above ₹1.25 lakh annual exemption.',
          'STCG (<12 months held) on listed equity: 20%.',
          'Annual ₹1.25 lakh exemption is aggregate across all equity sources.',
          'PMS annual capital gains statement details every transaction with FIFO cost basis.',
          'CA reconciles PMS statement against demat broker statement.',
          'Operational complexity is materially higher than mutual fund tax reporting.',
        ],
        faq: [
          {
            question: 'Can I claim PMS management fees as a deduction against capital gains?',
            answer:
              'PMS management fees are generally not deductible against capital gains under current Indian tax rules. Brokerage and STT directly tied to specific transactions reduce the cost basis or sale proceeds for capital gains computation. Always consult your CA for the precise treatment.',
          },
          {
            question: 'How are dividends from PMS holdings taxed?',
            answer:
              'Dividends are paid directly to the investor (since securities sit in their demat). Dividend income is taxable at the investor\'s slab rate. The PMS\'s annual reporting includes dividend income alongside capital gains for completeness, but the dividend amounts also appear in the investor\'s Form 26AS. Both must reconcile.',
          },
          {
            question: 'What if the FIFO cost basis is unclear because of stock splits or bonuses?',
            answer:
              'Corporate actions are reflected in the PMS\'s cost-basis tracking automatically — the system adjusts FIFO records when the action occurs. The annual capital gains statement reflects post-action quantities and adjusted cost bases. CA review confirms the math; rare edge cases (very early-vintage holdings before AMC system upgrades) may need manual verification.',
          },
        ],
        mcqs: [
          {
            question: 'PMS tax events occur:',
            options: [
              'Only on PMS exit (redemption)',
              'On every individual transaction the manager executes',
              'Once per year',
              'Only on dividends',
            ],
            correctAnswer: 1,
            explanation:
              'Unlike mutual funds (tax only at redemption), PMS creates tax events on every Sell transaction during the year. A PMS with 38% annual turnover may generate 50-100 transactions creating tax events.',
          },
          {
            question: 'Cost basis matching for FIFO methodology means:',
            options: [
              'Last-bought lot is matched first',
              'Earliest-bought lot is matched first',
              'Cheapest lot is matched first',
              'Random matching',
            ],
            correctAnswer: 1,
            explanation:
              'First-In-First-Out (FIFO) means the earliest-bought lot of that stock is matched against the sold quantity for cost basis. This is the standard methodology for Indian PMS tax computation.',
          },
          {
            question: 'PMS management fees are typically:',
            options: [
              'Deductible against capital gains',
              'Not deductible against capital gains under current Indian rules',
              'Refunded by SEBI',
              'Tax-exempt',
            ],
            correctAnswer: 1,
            explanation:
              'PMS management fees are generally not deductible against capital gains. Direct brokerage and STT tied to transactions reduce cost basis or sale proceeds, but management fees separately paid out of demat are not deductible.',
          },
        ],
        summaryNotes: [
          'Each transaction = separate tax event; FIFO cost basis.',
          'LTCG 12.5% above ₹1.25 lakh; STCG 20%.',
          'Annual exemption is aggregate across equity sources.',
          'CA support essential given volume and granularity.',
        ],
        relatedTopics: ['pms-fees', 'pms-portfolio-construction', 'pms-vs-mf-vs-aif'],
      },
    },

    {
      id: 'pms-operational-workflow',
      title: 'PMS Operational Workflow Across the Year',
      slug: 'pms-operational-workflow',
      content: {
        definition:
          'The PMS operational workflow follows a defined annual cadence: subscription and account opening (one-time), monthly factsheet review (ongoing), quarterly portfolio statement and review meeting (quarterly), capital gains aggregation (annual), and the annual review meeting with manager and Relationship Manager (annual). Trustner\'s framework integrates each touchpoint into client coverage to ensure operational quality and continuous fit assessment.',
        explanation:
          'Subscription and onboarding takes 4-6 weeks end-to-end. KYC, demat account opening (if not existing), POA execution for Discretionary PMS, fee disclosure, suitability assessment, ₹50 lakh wire transfer, and initial position deployment by the manager (typically over 30-60 days to manage market impact). Monthly factsheet review is the lightest-touch monthly task — verify the factsheet arrived on time, scan top holdings and sector allocation against expectations, note any material changes. Quarterly portfolio statement is the core ongoing review. Trustner\'s RM and the client jointly review: holdings vs strategy mandate (drift detection), performance vs benchmark, transaction-level rationale, risk metrics. A quarterly call (15-30 min) discusses any concerns or questions. Capital gains aggregation happens at year-end (typically January-February). The PMS sends the annual capital gains statement; the client\'s CA aggregates with mutual fund and direct stock LTCG/STCG for ITR filing. Trustner coordinates as needed. Annual review meeting is the strategic touchpoint — typically September-November — covering full-year performance, strategy outlook, fee structure review, and assessment of continued fit. The client decides whether to add, redeem, or stay. Through the year, ad-hoc events may trigger out-of-cycle conversations: significant market events, regulatory changes, manager team departures, or client liquidity needs.',
        realLifeExample:
          'A typical PMS year for a ₹50 lakh allocation: April (T-onboarding): subscription, KYC, POA signed, deployment begins. Month 1-2: deployment phase, factsheet shows partial allocation building. Month 3: full deployment. June quarterly statement: 22 stocks held, sector mix balanced, performance +3.2% vs Nifty +2.8%, gross alpha +0.4%. Quarterly call addresses one position the manager had to reduce due to liquidity constraints. October quarterly statement: 24 stocks held, performance +9.5% YTD vs Nifty +6.5%, gross alpha +3.0%. Annual review meeting in November: discussion of three new positions, two exits, factor outlook for the next 12 months. December: ad-hoc call when a key holding announces a takeover; manager explains decision-making rationale. January: capital gains statement for the FY. CA reconciles. The PMS continues into next year. This operational rhythm is labour-intensive but correct for HNI-tier structures.',
        keyPoints: [
          'Onboarding: 4-6 weeks for KYC, demat, POA, fee disclosure, deployment.',
          'Monthly factsheet review: top holdings, sector allocation, drift detection.',
          'Quarterly portfolio statement and review call (15-30 min).',
          'Capital gains aggregation at year-end via CA.',
          'Annual review meeting: full-year performance, outlook, fit assessment.',
          'Ad-hoc events trigger out-of-cycle conversations.',
          'Trustner integrates each touchpoint into client coverage.',
        ],
        faq: [
          {
            question: 'How is PMS deployment phased over 30-60 days?',
            answer:
              'When ₹50 lakh of capital arrives, the PMS manager does NOT buy 22 stocks at full target weight on day 1. Doing so would create market impact, especially in mid-cap or small-cap names. Instead, positions are built over 30-60 days through laddered orders managing average price and volume impact. The investor sees gradual position-building in their demat as orders execute.',
          },
          {
            question: 'When is the annual review meeting typically scheduled?',
            answer:
              'September-November is common — far enough into the financial year to assess performance, before the busy year-end PMS reporting cycle. Trustner schedules these meetings 4-6 weeks in advance to ensure the PMS manager, RM, and client can all attend.',
          },
          {
            question: 'What if my PMS misses the SEBI-mandated 30-day quarterly statement deadline?',
            answer:
              'It is a regulatory breach — the AMC must address the delay and report. Trustner\'s framework treats this as an operational red flag and triggers an immediate review of the AMC\'s operational standing. Repeated delays warrant de-empanelment consideration, with managed exit for existing client allocations.',
          },
        ],
        mcqs: [
          {
            question: 'PMS onboarding (subscription, KYC, deployment) typically takes:',
            options: ['1 day', '4-6 weeks', '6 months', '1 year'],
            correctAnswer: 1,
            explanation:
              'PMS onboarding takes 4-6 weeks: KYC (1-2 weeks if new), demat account opening (1 week if new), POA execution (1 week), fee disclosure and suitability documentation (1 week), and gradual deployment over 30-60 days following subscription receipt.',
          },
          {
            question: 'A PMS manager building a ₹50 lakh portfolio over 30-60 days does so to:',
            options: [
              'Take longer for complacency',
              'Manage market impact and average price across volume-traded ladders',
              'SEBI requires this delay',
              'Charge higher fees',
            ],
            correctAnswer: 1,
            explanation:
              'Phased deployment over 30-60 days manages market impact, especially for mid-cap and small-cap positions where larger orders would move prices unfavourably. This is standard PMS operational practice.',
          },
          {
            question: 'The annual PMS review meeting typically includes:',
            options: [
              'Only the manager',
              'PMS manager + Trustner RM + client (three-way)',
              'Only the client',
              'No formal review',
            ],
            correctAnswer: 1,
            explanation:
              'Trustner\'s framework requires a three-way annual review including PMS manager, Trustner RM, and client. This ensures the client\'s broader portfolio context is integrated into the discussion, alongside the PMS-specific outlook and performance review.',
          },
        ],
        summaryNotes: [
          'Annual cadence: onboarding → monthly factsheets → quarterly statements + calls → annual review.',
          'Onboarding 4-6 weeks; deployment phased 30-60 days.',
          'Quarterly drift detection vs strategy mandate.',
          'Annual review: three-way (manager, RM, client).',
        ],
        relatedTopics: ['pms-tax-computation', 'pms-portfolio-construction', 'pms-fees'],
      },
    },

    {
      id: 'pms-vs-aif-decision',
      title: 'When PMS, When AIF — The Wealth-Tier Decision',
      slug: 'pms-vs-aif-decision',
      content: {
        definition:
          'For investors with sufficient wealth to consider both PMS and AIF, the decision depends on three factors: the strategic gap (concentrated equity vs private market exposure), the liquidity tolerance (PMS retains relative liquidity; AIF is genuinely illiquid for years), and the wealth tier (PMS suits ₹2-5 cr liquid wealth; AIF requires ₹5+ cr).',
        explanation:
          'PMS and AIF complement rather than replace each other. PMS delivers concentrated, customised equity exposure with quarterly transparency and demat-level ownership. AIF accesses private markets, hedge strategies, real estate, and asset classes that mutual funds and PMS structurally cannot reach. Wealth-tier alignment matters. PMS suits investors with ₹2-5 crore liquid wealth where ₹50 lakh-₹100 lakh PMS allocation is 10-25% of portfolio. AIF requires ₹5 crore+ liquid wealth for the ₹1 crore commitment to fit a 15-25% allocation. Below ₹5 crore, AIF allocations create over-concentration. Strategic gap analysis. Common gaps and right vehicles: (a) Concentrated multi-cap equity exposure → multi-cap concentrated PMS; (b) Private credit yielding 10-13% → Cat II AIF; (c) Sector or theme exposure → theme PMS or Cat II AIF; (d) Hedged equity for downside protection → SIF or Cat III AIF; (e) Venture capital exposure → Cat I AIF only. The "right" structure follows the gap, not investor preference. Liquidity tolerance is the third filter. PMS portfolios can be redeemed any time (typically within 30-90 days), making PMS a reasonable choice when liquidity is a soft constraint. AIFs are typically locked for 5-10 years with capital-call structure — appropriate only for long-term capital. For UHNI portfolios at ₹15+ crore, the typical structure includes 30-40% mutual funds, 15-25% PMS (across 2-3 managers), 15-30% AIFs (across 3-5 across categories), and 10-15% liquid. This structural diversification across vehicles creates portfolio resilience while allowing each vehicle to deliver its specific strategic value.',
        realLifeExample:
          'Three UHNI investors illustrate the decision matrix. Sandeep (₹3 cr liquid wealth): allocates ₹50 lakh to multi-cap concentrated PMS. AIF is not appropriate at this wealth tier. Vivek (₹6 cr liquid wealth): allocates ₹100 lakh across two PMS managers (large-cap quality + small-mid growth) + ₹100 lakh in Cat II private credit AIF. PMS for equity concentration; AIF for private credit yield exposure. Krishnan (₹15 cr liquid wealth): allocates ₹3 cr across three PMS managers (different archetypes) + ₹3 cr across four AIFs (Cat I VC, two Cat II credit/RE, one Cat III hedged equity). Each layer addresses a distinct strategic gap. Below ₹3 crore, PMS is the right HNI structure. Above ₹6 crore, both PMS and AIF combine. Above ₹15 crore, multiple PMS + multiple AIF + cross-category diversification becomes the family-office posture.',
        keyPoints: [
          'PMS and AIF complement; choice follows strategic gap.',
          'Wealth-tier alignment: PMS at ₹2-5 cr liquid; AIF at ₹5+ cr liquid.',
          'PMS: concentrated equity, quarterly transparency, demat ownership.',
          'AIF: private markets, hedge strategies, asset classes unavailable elsewhere.',
          'PMS liquidity: redeemable within 30-90 days; AIF: locked for years.',
          'Below ₹5 cr liquid wealth → PMS only; above → PMS + AIF combined.',
          'Family office structures: 3-5 PMS + 4-8 AIFs across categories at ₹15 cr+ wealth.',
        ],
        faq: [
          {
            question: 'Can I add a Cat II AIF to my PMS allocation if I have ₹4 cr liquid wealth?',
            answer:
              'Marginal — possible but tight. A ₹1 crore Cat II AIF at ₹4 cr wealth is 25% of portfolio, on the upper edge of acceptable. Combined with a ₹50 lakh PMS (12.5%), AIF + PMS together would be 37.5% — meaningful concentration. Consider whether the AIF gap is genuinely critical at this wealth level. Below ₹4 cr, AIF is generally not appropriate.',
          },
          {
            question: 'Should I prefer a Cat III AIF or a SIF for hedged equity exposure?',
            answer:
              'Both target similar outcomes (long-short equity for downside protection). SIF minimum is ₹10 lakh; Cat III AIF minimum is ₹1 crore. For investors below ₹10 cr liquid wealth, SIF is operationally more practical. For UHNIs above ₹10 cr, Cat III AIF may offer additional strategy flexibility (more aggressive leverage, broader instrument universe) at the cost of ₹1 crore commitment vs ₹10 lakh.',
          },
          {
            question: 'How do I decide between two competing PMS managers in the same archetype?',
            answer:
              'Run the Trustner manager evaluation framework on each: 5+ year track record, AMC infrastructure, operations, references, fees, and net-of-fee alpha. Whichever scores higher across these dimensions wins the empanelment. Trustner\'s framework provides side-by-side scoring on competing PMS in the same archetype.',
          },
        ],
        mcqs: [
          {
            question: 'For an investor with ₹4 cr liquid wealth, the structurally appropriate combination is:',
            options: [
              'PMS only — AIF requires more wealth',
              '50% AIF + 50% PMS',
              'Only AIF',
              'Only mutual funds',
            ],
            correctAnswer: 0,
            explanation:
              'At ₹4 cr liquid wealth, PMS is the right HNI vehicle — typically 12-25% allocation across 1-2 managers. AIF\'s ₹1 cr minimum would be 25% of portfolio, on the upper edge. AIF becomes structurally comfortable above ₹5 cr liquid wealth.',
          },
          {
            question: 'PMS and AIF differ most fundamentally on:',
            options: [
              'Both are identical',
              'Liquidity (PMS redeemable in 30-90 days; AIF locked for years)',
              'Tax (both same)',
              'Manager skill (both same)',
            ],
            correctAnswer: 1,
            explanation:
              'The structural difference is liquidity. PMS portfolios can be redeemed within 30-90 days. Most Cat I and Cat II AIFs are closed-ended with 5-10 year fund lives and capital-call commitment cycles — genuinely illiquid for years.',
          },
          {
            question: 'Strategic gap "venture capital exposure" is best filled by:',
            options: ['Multi-cap PMS', 'Cat I AIF (VC)', 'Mutual fund FoF', 'SIF'],
            correctAnswer: 1,
            explanation:
              'Cat I AIFs include venture capital funds — the only Indian regulated structure that provides genuine VC exposure. PMS, mutual funds, and SIFs cannot invest in private unlisted equity at the structural depth required for VC strategies.',
          },
        ],
        summaryNotes: [
          'Decision = strategic gap + wealth tier + liquidity tolerance.',
          'Wealth-tier: PMS at ₹2-5 cr; AIF at ₹5+ cr.',
          'Match strategic gap to vehicle: equity → PMS; private markets/hedge → AIF.',
          'Family office: 3-5 PMS + 4-8 AIF at ₹15 cr+ wealth.',
        ],
        relatedTopics: ['pms-vs-mf-vs-aif', 'pms-strategy-archetypes', 'aif-three-categories'],
      },
    },
  ],
};
