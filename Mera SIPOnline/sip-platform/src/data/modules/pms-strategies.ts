import { LearningModule } from '@/types/learning';

export const pmsStrategiesModule: LearningModule = {
  id: 'pms-strategies',
  title: 'PMS Strategies & Manager Selection',
  slug: 'pms-strategies',
  icon: 'BriefcaseBusiness',
  description:
    'A working-level walk-through of common PMS strategy archetypes — large-cap quality, small-mid cap growth, multi-cap concentrated, value, sector-rotation — and the manager-selection framework that separates skill from luck.',
  level: 'intermediate',
  color: 'from-blue-700 to-cyan-600',
  estimatedTime: '40 min',
  track: 'pms',
  sections: [
    {
      id: 'pms-strategy-archetypes',
      title: 'Common PMS Strategy Archetypes',
      slug: 'pms-strategy-archetypes',
      content: {
        definition:
          'Indian PMS strategies fall into a small number of archetypes — large-cap quality, small-mid cap growth, multi-cap concentrated, value, sector-rotation, and theme-led — each defined by a clear investment philosophy, position-sizing discipline, and target investor profile. Understanding the archetype is the first step in PMS evaluation.',
        explanation:
          'Large-cap quality strategies hold 18-25 large-cap names with stable franchises (HDFC Bank, TCS, Infosys, Asian Paints, etc.), with portfolio turnover under 30% per year. The objective is steady compounding with low drawdowns, suitable for HNIs in the 50-65 age range nearing wealth-preservation phase. Typical 5-year CAGR target: Nifty 50 + 1-3% alpha. Small-mid cap growth strategies hold 22-32 mid-cap and small-cap names with high earnings growth potential, with higher turnover (40-60% annually) reflecting the more dynamic opportunity set. The objective is materially higher returns with materially higher drawdowns; suitable for HNIs in the 35-50 age range with 10+ year horizons. Typical 5-year CAGR target: Nifty 50 + 5-8% alpha (with 1.5x-2x the volatility). Multi-cap concentrated strategies hold 18-22 names across the cap spectrum (typically 50/30/20 across large/mid/small) with high conviction, with the manager exercising significant flexibility on cap allocation based on relative valuation. The objective is best-of-both — large-cap stability + mid/small-cap growth. Suitable for HNIs across age ranges. Typical 5-year CAGR target: Nifty 50 + 3-5% alpha. Value strategies tilt toward statistically cheap stocks (low P/E, low P/B, high dividend yield) and contrarian sectors, with longer holding periods (3-5 years per position). The objective is mean-reversion alpha; suitable for patient HNIs comfortable with multi-year underperformance during growth-led cycles. Sector-rotation strategies actively shift exposure across sectors based on macro and earnings-cycle views; high turnover (60%+ annually) and momentum-led decision-making. The objective is timing alpha; suitable for HNIs comfortable with active management complexity. Theme-led strategies (digital, manufacturing, ESG, etc.) concentrate in a defined macro theme — unsuitable for core allocation but viable as 5-10% portfolio satellites. Each archetype reflects a distinct philosophy and operational discipline. The investor must select an archetype consistent with their own portfolio gap, risk tolerance, and patience.',
        realLifeExample:
          'Three HNI investors choose three different archetypes. Sandeep (52, ₹3 cr liquid wealth, 8-year horizon to planned retirement) → large-cap quality PMS at ₹50 lakh. Stable compounding suits his life stage. Vivek (38, ₹4 cr liquid wealth, 20+ year horizon) → small-mid cap growth PMS at ₹50 lakh. Higher volatility acceptable for higher long-term return. Krishnan (60, ₹15 cr liquid wealth, mature wealth) → multi-cap concentrated PMS at ₹100 lakh + value PMS at ₹50 lakh. Diversification across two complementary archetypes. Each is the correct choice for the respective investor; mixing archetypes inappropriate to investor profile is the common mis-sale.',
        keyPoints: [
          'Six common archetypes: large-cap quality, small-mid growth, multi-cap concentrated, value, sector-rotation, theme.',
          'Large-cap quality: 18-25 names, low turnover, stable compounding; suits 50-65 age HNIs.',
          'Small-mid growth: 22-32 names, higher turnover, higher returns + drawdowns; suits 35-50 with 10+ year horizon.',
          'Multi-cap concentrated: 18-22 names across caps; flexibility-driven; suits broad HNI range.',
          'Value: contrarian, longer holds, mean-reversion alpha; needs patience for growth-cycle underperformance.',
          'Theme-led: 5-10% satellite max — unsuitable for core PMS allocation.',
          'Match archetype to investor profile, horizon, and portfolio gap.',
        ],
        faq: [
          {
            question: 'How do I know if my PMS manager is following the stated archetype?',
            answer:
              'Quarterly portfolio statements show the actual holdings, sector allocation, and turnover. Compare these against the archetype\'s expected pattern. A "large-cap quality" PMS holding 35% in mid-caps or running 70% turnover has drifted. Trustner\'s ongoing monitoring includes archetype-drift detection.',
          },
          {
            question: 'Are theme-led PMS strategies dangerous?',
            answer:
              'Not dangerous per se — but inappropriate for core allocation. A theme-led PMS concentrates in one macro narrative; if the narrative reverses, the entire allocation underperforms simultaneously. Use theme PMS only as a 5-10% portfolio satellite, not as the central allocation.',
          },
          {
            question: 'Should I have multiple PMS allocations across different archetypes?',
            answer:
              'For HNIs with ₹3+ crore liquid wealth, splitting PMS allocations across 2-3 archetypes (e.g., large-cap quality + multi-cap concentrated) reduces archetype risk and manager risk. Below ₹3 crore liquid wealth, a single PMS allocation is more practical.',
          },
        ],
        mcqs: [
          {
            question: 'A 38-year-old HNI with 20+ year horizon and ₹4 cr liquid wealth typically suits:',
            options: ['Large-cap quality PMS', 'Small-mid cap growth PMS', 'Theme-led ESG PMS', 'Sector-rotation PMS only'],
            correctAnswer: 1,
            explanation:
              'Small-mid cap growth PMS suits longer-horizon HNIs comfortable with higher volatility for higher long-term returns. Large-cap quality is more appropriate for nearer-retirement investors.',
          },
          {
            question: 'Theme-led PMS strategies should typically be:',
            options: ['Core allocation', 'Used only as 5-10% portfolio satellite', 'Avoided completely', 'Always 50% of allocation'],
            correctAnswer: 1,
            explanation:
              'Theme-led PMS concentrates in a single macro narrative and is inappropriate for core allocation. Limit to 5-10% portfolio satellite for diversification across themes.',
          },
          {
            question: 'A "large-cap quality" PMS\'s typical portfolio turnover is:',
            options: ['Above 80% annually', 'Under 30% annually', 'Exactly 50% annually', '0%'],
            correctAnswer: 1,
            explanation:
              'Large-cap quality strategies hold stable franchise companies for long durations, with portfolio turnover typically under 30% annually. High turnover would indicate strategy drift.',
          },
        ],
        summaryNotes: [
          'Six archetypes with distinct philosophies and target investor profiles.',
          'Match archetype to investor age, horizon, risk tolerance, portfolio gap.',
          'Multi-PMS allocation across complementary archetypes reduces concentration risk above ₹3 cr liquid wealth.',
          'Theme-led strategies only as 5-10% satellites.',
        ],
        relatedTopics: ['pms-types', 'pms-manager-evaluation', 'pms-portfolio-construction'],
      },
    },

    {
      id: 'pms-manager-evaluation',
      title: 'PMS Manager Evaluation Framework',
      slug: 'pms-manager-evaluation',
      content: {
        definition:
          'PMS manager evaluation systematically reviews five dimensions: 5+ year strategy-consistent track record, AMC infrastructure and ownership stability, operational quality of portfolio management and reporting, fee economics relative to delivered alpha, and reference quality from existing investors. The framework filters managers before allocation; quarterly review monitors empanelled managers thereafter.',
        explanation:
          'Track record analysis. Look for: (a) at least 5 years live track record on the specific strategy under the same PM team; (b) full bull-bear cycle coverage including 2020 COVID and 2022 rate-cycle drawdowns; (c) Calmar ratio above 0.7 (return-per-drawdown-unit indicator); (d) consistent performance attribution — beating index by 3-4% in 4 of 5 years is more meaningful than beating by 20% in one year and underperforming in four. AMC infrastructure. Ownership stability matters because PMS strategies depend on team retention. AMCs that have been acquired, restructured, or seen senior PM departures within 12 months warrant additional scrutiny. Risk management infrastructure includes: independent CRO who can override the PM, transparent compliance with SEBI investment norms, no recent SEBI/APMI advisory or enforcement history. Operational quality covers timely SoA delivery, quarterly portfolio statement accuracy, audit-quality compliance with the agreed strategy mandate, and responsive RM coverage for client queries. References. Speak to 2-3 existing PMS investors at similar wealth tier. Specific questions: how is RM responsiveness during market stress? Are quarterly statements timely and accurate? Has the manager ever drifted from stated strategy? How are conflicts (e.g., disagreements on positions) resolved? Fees. Fee economics is the gate — net-of-fee alpha is the test. A PMS charging 2.5% management + 20% performance over 10% hurdle costs ~3.5-4.5% in good years. Gross alpha (PMS gross return minus benchmark) must exceed 4-5% for net-of-fee value to materialise. Many India PMS managers have not delivered net-of-fee alpha over rolling 5-year periods; this is the hard truth Trustner\'s framework focuses on.',
        realLifeExample:
          'Evaluation summary for hypothetical "Alpha Multi-Cap PMS": (a) 6-year track record on strategy under same PM team; (b) 2020 COVID drawdown 28% vs Nifty 38% (relative defence); (c) 5-year annualised gross return 14.2% vs Nifty 50 11.8% (gross alpha 2.4%); (d) Calmar ratio 0.51 (decent); (e) AMC stable, no PM departures, no regulatory advisory; (f) 2 reference calls confirm operational quality; (g) Fee: 2.0% + 18% over 10% hurdle, all-in cost ~3.5% in good years. Net-of-fee 5-year return: 11.2% vs Nifty 11.8% (net alpha negative). Conclusion: Strategy is structurally sound but fees are absorbing the alpha. HOLD-don\'t-recommend until either fees compress or gross alpha widens consistently. This is the unforgiving math of PMS evaluation.',
        keyPoints: [
          'Five evaluation dimensions: track record, AMC infrastructure, operations, fees, references.',
          'Track record: 5+ years, full bull-bear cycle, Calmar > 0.7, consistent attribution.',
          'AMC: ownership stability, no recent senior departures, no regulatory advisory.',
          'Operations: timely SoA, accurate quarterly statements, responsive RM.',
          'References: 2-3 calls with existing investors at similar tier.',
          'Fees: net-of-fee alpha is the test; gross alpha must exceed all-in fee load.',
          'Many India PMS managers have not delivered net-of-fee alpha — empanelment must be selective.',
        ],
        faq: [
          {
            question: 'What if a PMS manager has only 3 years of track record?',
            answer:
              'For new launches, evaluate the PM team\'s prior track record at other AMCs. A PM with 12 years of strong AMC performance launching a new PMS at a fresh AMC may be evaluated based on the prior history. New PMs without any prior track record warrant 3-5 years observation before empanelment.',
          },
          {
            question: 'How do I detect "strategy drift" in a PMS?',
            answer:
              'Compare quarterly portfolio statements against the stated strategy mandate. Indicators: large-cap quality PMS holding 35%+ in mid-caps; sector-rotation PMS staying static in one sector for 6+ quarters; concentrated PMS suddenly running 35+ stocks. Trustner\'s ongoing monitoring includes drift detection.',
          },
          {
            question: 'Should I prefer Discretionary or Non-Discretionary PMS for evaluation purposes?',
            answer:
              'Discretionary PMS evaluation focuses on PM skill and execution. Non-Discretionary evaluation is more about advisory research quality. Discretionary is materially more common in retail PMS distribution. Either way, the evaluation framework principles (track record, attribution, drift detection) apply.',
          },
        ],
        mcqs: [
          {
            question: 'The most rigorous test of PMS manager skill is:',
            options: [
              'Single-year peak return',
              'Net-of-fee alpha over rolling 5-year periods',
              'Marketing material claims',
              'AUM growth',
            ],
            correctAnswer: 1,
            explanation:
              'Net-of-fee alpha — PMS net return minus benchmark return — over rolling 5-year periods is the rigorous test. Single-year peaks can be lucky; 5-year consistency reflects skill.',
          },
          {
            question: 'A Calmar ratio of 0.5 indicates:',
            options: [
              'The strategy is failing',
              'Annualised return is half the maximum drawdown — moderate risk-adjusted profile',
              'Excellent performance',
              'No information',
            ],
            correctAnswer: 1,
            explanation:
              'Calmar ratio = annualised return ÷ max drawdown. 0.5 means the strategy delivered half its worst drawdown as annualised return — a moderate risk-adjusted profile. Above 0.7 is favourable for long-only PMS strategies.',
          },
          {
            question: 'Reference calls with existing PMS investors should focus on:',
            options: [
              'AUM size',
              'RM responsiveness, statement accuracy, strategy drift, conflict resolution',
              'Marketing materials',
              'Fund manager photos',
            ],
            correctAnswer: 1,
            explanation:
              'Reference calls reveal operational reality the AMC marketing cannot show — RM responsiveness during market stress, statement accuracy, evidence of strategy drift, and conflict resolution practices.',
          },
        ],
        summaryNotes: [
          'Five-dimension framework: track record, AMC, operations, references, fees.',
          'Net-of-fee alpha over rolling 5-years is the ultimate test.',
          'Reference calls expose operational reality beyond marketing.',
          'Empanelment must be selective; many India PMS have not delivered net alpha.',
        ],
        relatedTopics: ['pms-strategy-archetypes', 'pms-portfolio-construction', 'pms-types'],
      },
    },

    {
      id: 'pms-portfolio-construction',
      title: 'PMS Portfolio Construction & Reporting',
      slug: 'pms-portfolio-construction',
      content: {
        definition:
          'PMS portfolio construction follows a disciplined process: stock selection per stated strategy and conviction, position sizing within concentration limits (typically max 8-10% per stock), continuous monitoring of risk and performance attribution, and ongoing rebalancing. Reporting to investors includes monthly factsheets, quarterly portfolio statements, annual capital gains statements, and an annual review meeting.',
        explanation:
          'Stock selection. The PM identifies opportunities consistent with the strategy mandate. Large-cap quality PMS focuses on franchise quality, ROE, capital efficiency, governance. Small-mid growth PMS focuses on revenue growth, margin expansion, operating leverage. Each strategy has its own selection lens. Position sizing. Concentration discipline is the structural feature of PMS — typical maximum single-position weight 8-10% (sometimes 5-7% for cautious managers, sometimes 12-15% for high-conviction concentrated strategies). Sector exposure also limited (typically max 30-35% in any single sector). Liquidity constraint applies — positions limited to a percentage of average daily volume to ensure exit feasibility. Risk monitoring. Continuous tracking of: factor exposures (value, growth, quality, momentum, beta), historical-stress simulations (2008 GFC, 2020 COVID, 2022 inflation drawdown), single-name concentration. Reporting. Monthly factsheet shows top 10 holdings, sector allocation, performance vs benchmark, key portfolio metrics. Quarterly portfolio statement shows full holdings (with regulatory lag), transactions during the quarter, performance attribution by stock and sector, and reconciliation to the demat account. Annual capital gains statement details every transaction during the year for tax purposes. Annual review meeting walks through full-year performance, strategy outlook, and any planned changes. Trustner\'s framework requires the Relationship Manager to attend the annual review meeting alongside the PMS manager and the client — three-way conversation that ensures the client\'s questions are answered and any concerns raised.',
        realLifeExample:
          'A multi-cap concentrated PMS portfolio review: 22 stocks at quarter-end (target 18-22). Top 5 positions: HDFC Bank 8.5%, Reliance 7.8%, ICICI Bank 7.2%, Tata Motors 6.5%, Asian Paints 6.0%. Sector allocation: Financials 28%, Energy 14%, IT 12%, Auto 11%, FMCG 10%, others 25%. Quarterly performance: portfolio +5.2%, Nifty 50 +4.1% (gross alpha +1.1%). Top 3 contributors: Tata Motors +1.4%, ICICI Bank +0.9%, Reliance +0.8%. Top 3 detractors: Asian Paints -0.6%, HUL -0.4%, ITC -0.3%. Quarterly turnover: 12% (added Mahindra & Mahindra at ~5% weight, exited HUL on margin concerns). Risk metrics: portfolio beta 0.96, factor exposures balanced, max drawdown in quarter -3.2% vs Nifty -4.1%. The quarterly statement enables the investor and Trustner RM to review actual execution against stated strategy.',
        keyPoints: [
          'Stock selection per strategy mandate (quality, growth, value, etc.).',
          'Position concentration: typical max 8-10% per stock; 30-35% per sector.',
          'Liquidity constraint: positions capped at percentage of average daily volume.',
          'Continuous risk monitoring: factor exposures, historical stress, concentration.',
          'Reporting: monthly factsheet, quarterly portfolio, annual capital gains, annual review.',
          'Annual review meeting: three-way (PMS manager + Trustner RM + client).',
          'Quarterly portfolio review enables drift and execution-quality detection.',
        ],
        faq: [
          {
            question: 'How quickly are PMS quarterly statements expected?',
            answer:
              'SEBI mandates statements within 30 days of quarter-end. Top-tier PMS managers deliver within 15-20 days. Beyond 30 days, the AMC is breach of regulatory requirement; this is an operational red flag warranting immediate clarification.',
          },
          {
            question: 'Can I see real-time positions in my PMS account?',
            answer:
              'You see actual transactions in your demat account immediately as they occur — every trade is visible the same day on your broker statement. The "PMS portfolio statement" with full holdings and analytics is provided quarterly with regulatory lag, but the underlying transactional transparency is immediate via your demat account.',
          },
          {
            question: 'What if the PMS manager makes a transaction I disagree with?',
            answer:
              'In a Discretionary PMS, the manager has authority via POA — the investor cannot retroactively reject transactions. The investor can: (a) raise the disagreement during the next review meeting; (b) request strategy clarification in writing; (c) if pattern of disagreement persists, redeem from the PMS and reallocate. In Non-Discretionary PMS, every transaction requires investor approval before execution.',
          },
        ],
        mcqs: [
          {
            question: 'PMS concentration typically caps single-stock weight at:',
            options: ['1-2%', '8-10%', '50-70%', 'No cap'],
            correctAnswer: 1,
            explanation:
              'PMS concentration discipline typically caps single-stock weight at 8-10% (sometimes 5-7% for cautious managers, 12-15% for high-conviction concentrated strategies). This balances conviction-led investing with single-stock risk management.',
          },
          {
            question: 'PMS quarterly portfolio statements are mandated by SEBI within:',
            options: ['7 days of quarter-end', '30 days of quarter-end', '90 days', '6 months'],
            correctAnswer: 1,
            explanation:
              'SEBI mandates PMS quarterly portfolio statements within 30 days of quarter-end. Top-tier PMS deliver within 15-20 days. Beyond 30 days is regulatory breach.',
          },
          {
            question: 'Annual review meetings for PMS clients should include:',
            options: [
              'Only the PMS manager',
              'PMS manager + Trustner Relationship Manager + client (three-way)',
              'Only the client and broker',
              'No formal review',
            ],
            correctAnswer: 1,
            explanation:
              'Trustner\'s framework requires three-way annual review: PMS manager + Trustner RM + client. This ensures questions are answered, concerns raised, and the client\'s overall portfolio context is considered alongside the PMS-specific discussion.',
          },
        ],
        summaryNotes: [
          'Stock selection per strategy + concentration discipline + liquidity constraint.',
          'Reporting: monthly factsheet, quarterly portfolio, annual capital gains, annual review.',
          'SEBI quarterly statement requirement: within 30 days of quarter-end.',
          'Annual review: three-way (PMS manager + RM + client).',
        ],
        relatedTopics: ['pms-strategy-archetypes', 'pms-manager-evaluation', 'pms-fees'],
      },
    },
  ],
};
