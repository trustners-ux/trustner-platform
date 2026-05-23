import { LearningModule } from '@/types/learning';

export const pmsAdvancedModule: LearningModule = {
  id: 'pms-advanced',
  title: 'PMS Advanced — Manager Risk, Performance Attribution & Exit Decisions',
  slug: 'pms-advanced',
  icon: 'BriefcaseBusiness',
  description:
    'Advanced material covering manager-level risk decomposition, attribution analysis, fee-justification math, and the exit decision framework for PMS allocations that have lost their strategic fit.',
  level: 'advanced',
  color: 'from-blue-800 to-cyan-700',
  estimatedTime: '35 min',
  track: 'pms',
  sections: [
    {
      id: 'pms-attribution-analysis',
      title: 'Performance Attribution — Decomposing Manager Skill',
      slug: 'pms-attribution-analysis',
      content: {
        definition:
          'PMS performance attribution decomposes total returns into stock selection (security-level alpha), sector allocation (over/underweight calls), and timing (entry/exit decisions vs benchmark). Disciplined attribution separates lucky streaks from durable skill, and identifies which alpha sources are repeatable versus circumstantial.',
        explanation:
          'Three-factor attribution. (a) Stock selection alpha: portfolio return minus benchmark return holding sector weights constant. Measures the manager\'s skill in picking stocks within each sector. (b) Sector allocation alpha: difference attributable to over/underweighting sectors vs benchmark. Measures the manager\'s top-down sector calls. (c) Timing alpha: difference attributable to entry/exit decisions (buying low, selling high relative to benchmark). Measures market-timing and execution skill. A skilled manager generates alpha across at least two of the three; a manager generating alpha only from one source has narrow skill that may not persist. Attribution discipline: review at year-end across the past 3-5 years. Look for consistency — managers showing positive stock-selection alpha in 4 of 5 years are more credible than those showing 80% alpha one year and -30% the next. The pattern of rolling 3-year attribution often surfaces concerns that headline returns hide.',
        realLifeExample:
          'A multi-cap PMS\'s 5-year attribution: stock selection +2.1% annualised (consistent across years), sector allocation +0.8% (variable, sometimes negative), timing -0.4% (negative — the manager is a poor market timer). Net alpha 2.5% before fees; fees absorb 3.5%; net-of-fee alpha is -1.0%. Attribution identifies that the manager\'s strength is bottom-up stock picking, but fees absorb the entire alpha. Recommendation: hold position, monitor for fee compression OR alpha widening; do not add to allocation.',
        keyPoints: [
          'Three-factor attribution: stock selection, sector allocation, timing.',
          'Skilled managers generate alpha across at least two factors.',
          'Single-factor alpha may not persist — narrow skill warning.',
          'Review across rolling 3-5 year periods, not single year.',
          'Net-of-fee alpha (after subtracting fees) is the structural test.',
          'Pattern matters: consistency > lucky-year peaks.',
          'Trustner\'s framework includes annual attribution review per empanelled PMS.',
        ],
        faq: [
          {
            question: 'How is sector allocation alpha calculated?',
            answer:
              'Calculate the return contribution of holding each sector at portfolio weight, with stocks held at benchmark proportions within each sector. Subtract this from total portfolio return; the residual is stock selection alpha. The sector allocation contribution is what the manager added (or lost) by overweighting/underweighting sectors relative to benchmark.',
          },
          {
            question: 'Can I do attribution myself, or do I need the AMC to provide it?',
            answer:
              'AMCs provide attribution in their quarterly portfolio statements. For independent verification, sophisticated investors can run their own attribution using the disclosed positions and benchmark data. Trustner\'s annual review includes attribution discussion using both AMC-provided and independently-verified analysis.',
          },
          {
            question: 'What if a manager\'s alpha all comes from timing?',
            answer:
              'Caution. Timing alpha is the most volatile and least repeatable. Managers who appear to consistently time markets often had a few lucky calls that drove headline numbers. Sustained timing alpha across 5+ years is rare; unless the manager has exceptional macro-research infrastructure, expect timing alpha to mean-revert toward zero.',
          },
        ],
        mcqs: [
          {
            question: 'A manager showing alpha only from timing across 5 years is:',
            options: [
              'Highly reliable',
              'A warning — timing alpha is the least repeatable',
              'Equivalent to other alpha sources',
              'Banned by SEBI',
            ],
            correctAnswer: 1,
            explanation:
              'Timing alpha is the most volatile and least repeatable of the three attribution factors. Managers showing alpha primarily from timing should be evaluated cautiously; expect mean-reversion unless the manager has exceptional macro-research infrastructure.',
          },
          {
            question: 'Net-of-fee alpha is calculated as:',
            options: [
              'Gross alpha + fees',
              'Gross alpha − all-in fee load',
              'Manager\'s gross return only',
              'Benchmark return',
            ],
            correctAnswer: 1,
            explanation:
              'Net-of-fee alpha = gross alpha (manager return minus benchmark) minus all-in fee load (management fee + performance fee + brokerage etc.). This is the test of whether the manager is genuinely adding value to the investor net of costs.',
          },
          {
            question: 'Three-factor PMS attribution decomposes returns into:',
            options: [
              'Domestic, international, gold',
              'Stock selection, sector allocation, timing',
              'Equity, debt, cash',
              'Long, short, hedge',
            ],
            correctAnswer: 1,
            explanation:
              'Standard three-factor attribution: stock selection (security-level alpha), sector allocation (over/underweight calls), timing (entry/exit decisions). Each factor is evaluated separately to identify which alpha sources are repeatable.',
          },
        ],
        summaryNotes: [
          'Three-factor attribution: stock selection, sector allocation, timing.',
          'Net-of-fee alpha is the structural test, not gross headline returns.',
          'Consistent multi-factor alpha > single-factor lucky year.',
          'Trustner\'s framework reviews attribution annually per empanelled PMS.',
        ],
        relatedTopics: ['pms-manager-evaluation', 'pms-fees', 'pms-portfolio-construction'],
      },
    },

    {
      id: 'pms-exit-framework',
      title: 'When to Exit a PMS — Decision Framework',
      slug: 'pms-exit-framework',
      content: {
        definition:
          'Exit decisions for PMS allocations follow five triggers: persistent net-of-fee underperformance over 3+ years, strategy drift from stated mandate, senior PM departure, regulatory or operational integrity failure, and material change in investor circumstances (wealth, horizon, goals). Exit must be planned with tax and operational factors in mind — not made reactively.',
        explanation:
          'Persistent net-of-fee underperformance: the most common exit trigger. If a PMS has not generated meaningful net alpha over rolling 3-year windows (and gross alpha attribution shows no recovery path), continued allocation is no longer justified. Exit and redeploy. Strategy drift: a large-cap quality PMS now holding 35%+ in mid-caps, or a sector-rotation PMS staying static for 6+ quarters, signals strategy abandonment. The investor allocated to the original mandate; if the manager has changed approach, the allocation no longer matches the investor\'s portfolio gap. Senior PM departure: the lead PM exiting (especially with a substantial team) eliminates the skill that justified empanelment. Even if the AMC continues operating the strategy, the new team takes 2-3 years to demonstrate skill — too long to wait for an existing allocation. Regulatory or operational integrity failure: SEBI/APMI advisory or enforcement, recurring quarterly statement delays, custodian issues, audit-quality problems. These are immediate de-empanelment triggers; client allocations should exit promptly even at marginal tax cost. Investor circumstance change: an investor approaching retirement may need to reduce equity volatility, shifting from concentrated PMS to diversified mutual funds. Or a client crossing the family-office wealth tier may want to shift PMS allocation into AIF for higher portfolio efficiency. Exit planning: tax-loss harvesting opportunities at year-end can offset gains in other holdings; coordinating exit timing with concentrated tax events optimises post-tax outcomes. Trustner\'s annual review explicitly addresses each PMS allocation against these five exit triggers; any single trigger meeting a high-confidence threshold initiates a structured exit conversation with the client.',
        realLifeExample:
          'Three exit decisions illustrating the framework. Case 1: A quality PMS allocation of ₹75 lakh, 4-year track record, generated -1.5% rolling 3-year net alpha. Trigger: persistent net underperformance. Decision: exit and redeploy across 2 mutual funds + new PMS. Tax: ₹2.5 lakh STCG generated; offset against ₹3 lakh STCL from other holdings. Net tax impact: minimal. Case 2: A multi-cap PMS where the lead PM departed 6 months ago. Trigger: senior departure. Decision: gradual exit over 3 quarters allowing capital gains realisation across two financial years to optimise tax. New allocation deployed to alternative empanelled PMS. Case 3: A small-mid cap PMS allocation where the investor (now 62) is nearing retirement. Trigger: investor circumstance change (reduced volatility tolerance). Decision: phased exit over 12 months into balanced mutual funds. Tax planning: spread realisation across two FYs to use ₹1.25 lakh annual exemption efficiently.',
        keyPoints: [
          'Five exit triggers: persistent net underperformance, strategy drift, PM departure, regulatory/operational integrity, investor circumstance change.',
          'Persistent net-of-fee underperformance over 3+ years = primary exit trigger.',
          'Strategy drift identified through quarterly position reviews.',
          'Senior PM departure: even continued AMC operation cannot replicate prior team skill.',
          'Regulatory/operational integrity = immediate exit at marginal tax cost.',
          'Investor circumstance change: age, wealth, horizon, goals.',
          'Tax planning: time exits to use annual exemption and offset losses.',
          'Trustner\'s annual review addresses each PMS against these five triggers.',
        ],
        faq: [
          {
            question: 'How long should I give a new PMS allocation before evaluating exit?',
            answer:
              'Minimum 3 years to evaluate strategy through partial market cycle. Premature exit (under 18 months) often reflects investor anxiety rather than manager underperformance. The exception is if a clear trigger (PM departure, strategy drift, regulatory issue) emerges in the first 18 months — these warrant exit regardless of duration.',
          },
          {
            question: 'How do I avoid tax inefficiency when exiting a PMS?',
            answer:
              'Plan exit across 2-3 financial years. Use the ₹1.25 lakh annual equity LTCG exemption per FY by staggering redemptions. Offset realised STCG/LTCG with STCL/LTCL from other holdings (booked at year-end). Coordinate with your CA. The tax-optimisation can save 1-2% of exit proceeds in many cases — meaningful at PMS-tier wealth.',
          },
          {
            question: 'Can I switch from one PMS to another within the same AMC?',
            answer:
              'Most AMCs require redemption from one PMS strategy and fresh subscription to another, even within the same AMC. This creates a tax event (like an exit and re-entry). Some AMCs offer "intra-AMC switch" mechanisms with reduced friction; check the AMC\'s offering. Tax treatment is the same regardless.',
          },
        ],
        mcqs: [
          {
            question: 'The most common PMS exit trigger is:',
            options: [
              'Investor anxiety',
              'Persistent net-of-fee underperformance over 3+ years',
              'Random review',
              'Marketing campaigns',
            ],
            correctAnswer: 1,
            explanation:
              'Persistent net-of-fee underperformance over 3+ rolling years is the primary structural exit trigger. The investor allocated to the PMS for net-of-fee alpha; if alpha has not materialised over a meaningful period, redeploy.',
          },
          {
            question: 'Senior PM departure as an exit trigger reflects:',
            options: [
              'AMC bankruptcy',
              'The new team takes years to demonstrate skill, eliminating the rationale for the original allocation',
              'SEBI requirement',
              'Marketing concern',
            ],
            correctAnswer: 1,
            explanation:
              'Senior PM departure removes the skill that justified empanelment. Even with continued AMC operation, the new team takes 2-3 years to demonstrate skill — too long for existing allocations to wait. Structured exit is the right response.',
          },
          {
            question: 'Tax-efficient PMS exit planning involves:',
            options: [
              'Single-day liquidation',
              'Spreading exits across 2-3 FYs to use annual exemption + offset losses',
              'Avoiding all gains',
              'Only year-end exits',
            ],
            correctAnswer: 1,
            explanation:
              'Spreading exit across 2-3 financial years uses the ₹1.25 lakh annual equity LTCG exemption per FY and allows offsetting realised gains against booked losses. Tax optimisation can save 1-2% of exit proceeds at PMS-tier wealth.',
          },
        ],
        summaryNotes: [
          'Five exit triggers: net underperformance, drift, PM departure, integrity, investor change.',
          'Plan exits with tax + operational coordination.',
          'Spread across FYs for ₹1.25 lakh exemption efficiency.',
          'Trustner\'s annual review explicitly addresses exit decisions.',
        ],
        relatedTopics: ['pms-attribution-analysis', 'pms-manager-evaluation', 'pms-tax-computation'],
      },
    },

    {
      id: 'pms-fee-justification',
      title: 'Fee Justification Math — When PMS Fees Make Sense',
      slug: 'pms-fee-justification',
      content: {
        definition:
          'PMS fee structures (typically 2-2.5% management + 15-20% performance over 8-12% hurdle) are economically justified when the PMS\'s gross alpha exceeds the all-in fee load over rolling 5-year windows. The math is unforgiving — a typical PMS must deliver 4-5% gross alpha for net-of-fee value to materialise. Many India PMS managers do not consistently meet this bar.',
        explanation:
          'Worked example: PMS with 2.0% management + 18% performance over 10% hurdle, high-water mark. Year scenarios: Year 1 portfolio returns 22% (Nifty 12%) → gross alpha 10%. Management fee 2.0%, performance fee 18% × (22%-10%) = 2.16%. Total cost 4.16%. Net to investor 17.84%. Net alpha vs Nifty 5.84%. Year 2 portfolio returns 8% (Nifty 6%) → gross alpha 2%. Management fee 2.0%, performance fee zero (below hurdle). Net to investor 6%. Net alpha vs Nifty zero. Year 3 portfolio returns -10% (Nifty -8%) → gross alpha -2%. Management fee 2.0%, performance fee zero. Net to investor -12%. Net alpha vs Nifty -4%. Across 3 years: cumulative gross 18%, cumulative fees 4.5%, cumulative Nifty 9.5%. Net cumulative for investor 13.5%. Net alpha vs Nifty 4.0% over 3 years = 1.3% annualised. Decision: marginal — fees nearly absorbed gross alpha. The PMS must consistently deliver gross alpha above the fee load; even a single year of zero or negative gross alpha materially compresses cumulative net alpha. The alternative is a low-cost diversified mutual fund (TER 0.5-1.0% for direct plans) which only requires beating Nifty by 1% to deliver competitive net outcomes. PMS fee justification math therefore requires gross alpha 4-5% — a high bar most managers do not consistently clear. This is the structural reason many India PMS allocations have been disappointing on a net basis. Trustner\'s framework explicitly walks investors through the fee math before subscription, ensuring they understand the bar that must be cleared for net value.',
        realLifeExample:
          'Two competing PMS managers in the same archetype, ₹50 lakh allocation each, 5-year evaluation period. PMS A: gross 14.5% annualised, all-in fee 3.5%, net 11.0%. Nifty 11.0%. Net alpha zero. PMS B: gross 16.8% annualised, all-in fee 3.8%, net 13.0%. Nifty 11.0%. Net alpha +2.0% annualised. Across 5 years on ₹50 lakh: PMS A net wealth ~₹84 lakh; PMS B net wealth ~₹92 lakh. PMS B\'s additional ₹8 lakh wealth — over 5 years — illustrates why selecting managers who deliver gross alpha well above fees matters. PMS A\'s headline gross of 14.5% sounds attractive, but the fee absorption leaves nothing net of benchmark. PMS B has the same archetype but better gross — and the fee load similar — so net delivered value is meaningful.',
        keyPoints: [
          'PMS all-in fee load: typical 3.0-4.5% in good years (mgmt + performance + brokerage).',
          'Gross alpha must exceed fee load for net value; 4-5% gross alpha is the typical bar.',
          'Single year of zero gross alpha materially compresses cumulative net alpha.',
          'Low-cost mutual fund alternative: TER 0.5-1.0% direct plans.',
          'Many India PMS managers do not consistently clear the 4-5% gross alpha bar.',
          'Worked example illustration: side-by-side competing managers, identical archetype, different gross alpha, materially different net outcomes.',
          'Trustner walks investors through fee math before every PMS subscription.',
        ],
        faq: [
          {
            question: 'Can I negotiate PMS fees down?',
            answer:
              'Yes — fee negotiation is common at higher ticket sizes. Above ₹2 crore allocation, negotiation to 1.75% management or 12% performance hurdle is achievable. Above ₹5 crore, further compression is possible. Trustner negotiates fees on the investor\'s behalf during empanelment discussions.',
          },
          {
            question: 'Should I prefer fixed-fee or fixed-plus-performance PMS?',
            answer:
              'Depends on view of manager skill. If the manager will materially outperform, fixed-plus-performance is more cost-efficient (you pay only when they deliver). If preferring cost predictability, fixed-only is simpler. Trustner\'s framework includes back-tested fee comparison across both structures for empanelled PMS.',
          },
          {
            question: 'What is the right benchmark to compare PMS net alpha against?',
            answer:
              'For multi-cap PMS: Nifty 500 TRI. For large-cap PMS: Nifty 50 TRI. For small-mid: Nifty Smallcap 250 TRI. For sector-specific: appropriate sector index. Always use Total Return Index (including dividends), not Price Return. The benchmark choice can change the alpha calculation by 1-2% — selecting honestly matters.',
          },
        ],
        mcqs: [
          {
            question: 'A typical Indian PMS\'s all-in fee load in a good year is approximately:',
            options: ['0.5-1.0%', '3.0-4.5%', '8-10%', '15%'],
            correctAnswer: 1,
            explanation:
              'Typical PMS all-in cost is 3.0-4.5% in good years (management + performance + brokerage + custodian). This compares to mutual fund direct-plan TER of 0.5-1.0%. The PMS must deliver materially higher gross to produce net-of-fee value.',
          },
          {
            question: 'For PMS fees to be economically justified, gross alpha typically needs to exceed:',
            options: ['0.5%', '4-5%', '0%', '20%'],
            correctAnswer: 1,
            explanation:
              'Gross alpha (PMS gross return minus benchmark) needs to exceed approximately 4-5% to produce meaningful net-of-fee value, since fees absorb ~3.5-4% in good years. Many India PMS managers do not consistently clear this bar.',
          },
          {
            question: 'When comparing PMS net alpha to benchmark, the right benchmark is:',
            options: [
              'Always Nifty 50',
              'Total Return Index of the appropriate market cap and strategy mandate',
              'Always Nifty Smallcap',
              'Whatever the AMC reports',
            ],
            correctAnswer: 1,
            explanation:
              'Use the Total Return Index appropriate to the strategy mandate — Nifty 50 TRI for large-cap PMS, Nifty 500 TRI for multi-cap, Nifty Smallcap 250 TRI for small-mid cap, etc. Total Return (with dividends) is the right comparison; Price Return understates the benchmark.',
          },
        ],
        summaryNotes: [
          'All-in PMS fee 3-4.5% in good years; 4-5% gross alpha needed for net value.',
          'Fee negotiation possible at higher ticket sizes.',
          'Always benchmark against TRI (Total Return Index) of appropriate strategy.',
          'Trustner walks fee math through with investors before every subscription.',
        ],
        relatedTopics: ['pms-attribution-analysis', 'pms-fees', 'pms-manager-evaluation'],
      },
    },
  ],
};
