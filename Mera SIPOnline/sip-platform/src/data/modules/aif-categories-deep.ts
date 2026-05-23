import { LearningModule } from '@/types/learning';

export const aifCategoriesDeepModule: LearningModule = {
  id: 'aif-categories-deep',
  title: 'AIF Categories — Deep Dive',
  slug: 'aif-categories-deep',
  icon: 'GitBranch',
  description:
    'Detailed walk-through of each SEBI AIF category — Cat I (VC, infra, social, SME), Cat II (PE, private credit, real estate, debt), Cat III (hedge, long-short) — covering strategy mechanics, return profiles, vintage diversification, and capital deployment cycles.',
  level: 'intermediate',
  color: 'from-fuchsia-700 to-pink-600',
  estimatedTime: '40 min',
  track: 'aif',
  sections: [
    {
      id: 'aif-cat-1-deep',
      title: 'Cat I AIFs — VC, Infrastructure, SME, Social Venture',
      slug: 'aif-cat-1-deep',
      content: {
        definition:
          'Category I AIFs invest in start-ups, infrastructure projects, SMEs, and social-impact ventures — economically prioritised segments where SEBI provides tax and regulatory incentives. Cat I includes Venture Capital Funds, Angel Funds, Infrastructure Funds, SME Funds, and Social Venture Funds. Returns are typically asymmetric (small number of large winners cover many failures) with 7-10 year fund lives.',
        explanation:
          'Venture Capital Funds (most common Cat I) invest in early-stage start-ups across seed, Series A, and Series B rounds. Typical fund: ₹500-2,000 crore committed capital, deploys across 25-40 portfolio companies, 7-10 year fund life. Return profile: 60-70% of investments fail or return less than capital; 25-30% deliver 2-5x; 5-10% deliver 10x+ outsized returns that drive portfolio IRR. Target IRR 18-25% gross; 15-20% net of fees. The "power-law" return distribution means manager skill in identifying outsized winners is the primary alpha driver. Reference IRRs of top-tier Indian VC managers (Sequoia, Accel, Matrix etc.) over completed fund cycles range 18-30% net. Infrastructure Funds invest in roads, ports, renewable energy, telecom infrastructure. Lower-risk, lower-return profile than VC: target IRR 12-16%, 8-12 year fund lives, more predictable cash flows from operating assets. SME Funds focus on small-mid cap unlisted companies with revenue ₹50-500 crore. Cross between PE and VC; target IRR 14-18%. Social Venture Funds combine financial returns with measurable social impact — typically 8-12% IRR with explicit impact metrics. Vintage diversification matters in Cat I — single-vintage investments concentrate cyclical exposure. Sophisticated UHNI families build a "vintage ladder" with new commitments every 1-2 years across 5-7 years to smooth deployment and exit cycles. The illiquidity is genuine — Cat I AIFs typically have no secondary market exit until fund termination, requiring 7-10 year capital lock-up.',
        realLifeExample:
          'A representative VC fund: ₹1,200 crore committed across 50 LP investors. Investment period 5 years deploying across 30 start-ups. Of 30 portfolio companies after 8 years: 18 failed or returned <1x; 9 returned 2-4x; 3 returned 15-30x (the "power-law" winners). Aggregate gross multiple: 2.4x over 8 years. Gross IRR ~12%. Net of 2% management fee + 20% carry above 8% hurdle: net IRR ~9-10% to LPs. The 3 outsized winners drove the bulk of returns; the 18 failures absorbed capital but were necessary to find the winners. This return distribution is structurally the same as global VC, with dispersion across managers. Top-quartile India VC managers historically delivered 18-22% net IRR; bottom-quartile managers delivered <5% or negative. Manager selection is therefore the primary alpha decision in Cat I.',
        keyPoints: [
          'Cat I sub-categories: VC, Angel, Infrastructure, SME, Social Venture.',
          'VC Funds: 25-40 portfolio companies, 7-10 year life, target 15-20% net IRR.',
          'Power-law returns: 60-70% fail, 25-30% deliver 2-5x, 5-10% deliver 10x+.',
          'Infrastructure: lower-risk operating assets, target 12-16% IRR.',
          'Vintage diversification: stagger commitments across 5-7 years.',
          'Genuine illiquidity: no secondary market until fund termination.',
          'Manager selection is the primary alpha decision; dispersion is wide.',
        ],
        faq: [
          {
            question: 'How is "power-law return distribution" relevant?',
            answer:
              'In VC, a small number of outsized winners (10x+) drive portfolio returns. The math: a fund with 30 investments, 25 returning <1x, 4 returning 3x, and 1 returning 30x can still deliver 2-3x net depending on weight. This is fundamentally different from public-equity returns where outliers are rare. Manager skill is identifying which 1-3 of 30 will be the winners — extraordinarily difficult and the source of wide manager dispersion.',
          },
          {
            question: 'Are Cat I tax incentives meaningful?',
            answer:
              'Cat I AIFs receive certain pass-through tax benefits and regulatory advantages. The key implication for investors: capital gains and other income flow through to investors at their personal rates, with specific exemptions for certain Cat I segments (e.g., Social Venture Funds in some structures). Always read the AIF\'s PPM and consult a CA on the specific tax position.',
          },
          {
            question: 'Can I invest in multiple VC funds across vintages?',
            answer:
              'Yes — and for sophisticated UHNI families, this is the recommended approach. A "vintage ladder" of 4-5 VC commitments (e.g., one in 2024, one in 2026, one in 2028) smooths the deployment and exit cycles. Each commitment is independent at ₹1 crore minimum. Total VC allocation across vintages typically 15-25% of family AIF allocation.',
          },
        ],
        mcqs: [
          {
            question: 'A typical Cat I VC fund has fund life of:',
            options: ['1-2 years', '7-10 years', '25 years', 'No defined end'],
            correctAnswer: 1,
            explanation:
              'Cat I VC funds typically have 7-10 year fund lives with 5-year investment periods and 2-5 year harvest periods. Capital is genuinely locked for the full duration; secondary exits before fund termination are rare and discounted.',
          },
          {
            question: '"Power-law return distribution" in VC means:',
            options: [
              'All investments return similarly',
              'Small number of outsized winners drive portfolio returns; majority underperform',
              'Returns follow a normal distribution',
              'Returns are random',
            ],
            correctAnswer: 1,
            explanation:
              'VC returns follow a power-law: a small number (5-10%) of outsized 10x+ winners drive portfolio returns; the majority of investments fail or return marginal multiples. Manager skill is identifying the future winners.',
          },
          {
            question: 'Vintage ladder strategy for VC means:',
            options: [
              'All commitments in one year',
              'Stagger commitments across 5-7 years to smooth deployment and exit cycles',
              'Only commit during bull markets',
              'Avoid VC entirely',
            ],
            correctAnswer: 1,
            explanation:
              'Vintage diversification — staggering commitments across 5-7 years — smooths the deployment cycle (different funds invest in different macro environments) and the exit cycle (mature funds returning capital while new funds deploy). Standard practice for sophisticated UHNI VC allocations.',
          },
        ],
        summaryNotes: [
          'Cat I covers VC, Angel, Infrastructure, SME, Social Venture.',
          'VC: 7-10 yr life, power-law returns, 15-20% net IRR target.',
          'Infrastructure: 12-16% IRR, lower-risk operating assets.',
          'Vintage diversification + manager selection are critical.',
        ],
        relatedTopics: ['aif-three-categories', 'aif-cat-2-deep', 'aif-cat-3-deep'],
      },
    },

    {
      id: 'aif-cat-2-deep',
      title: 'Cat II AIFs — PE, Private Credit, Real Estate',
      slug: 'aif-cat-2-deep',
      content: {
        definition:
          'Category II AIFs are the largest by AUM and include Private Equity Funds (buyout and growth equity), Private Credit Funds (mid-market lending, distressed credit), Real Estate Funds (residential, commercial, REITs), and Debt Funds. SEBI classifies Cat II as "AIFs that do not fall in Cat I or Cat III" — a residual but commercially the dominant category.',
        explanation:
          'Private Equity Funds invest in mature unlisted companies through buyout (control transactions) or growth equity (minority investments). Typical fund: ₹2,000-10,000 crore committed, 6-10 portfolio investments, 5-8 year hold per investment, 8-10 year fund life. Target IRR 15-20% gross, 12-16% net. PE manager skill is in identifying undervalued or growth-constrained companies, executing operational improvements, and exiting at value-accretion multiples (3-5x typical). Private Credit Funds lend to mid-market Indian companies that are too large for banks and too small for capital markets. Sub-strategies: senior secured (lower-risk, 10-12% target IRR), mezzanine (mid-risk, 13-15% target IRR), and distressed/special-situations (higher-risk, 18-22% target IRR but higher loss potential). Cash distribution is more frequent than PE — typically quarterly or semi-annual coupons plus final principal. Real Estate Funds invest in commercial buildings, residential developments, or yield-bearing real estate assets. Target IRR 12-16% with mix of operating yield and capital appreciation. REITs (Real Estate Investment Trusts) listed on exchanges are a related but distinct structure with daily liquidity. Debt Funds (corporate bonds, distressed debt, special situations) overlap with Private Credit but include more public-market debt and structured opportunities. For most HNI families considering Cat II, Private Credit is the most accessible entry point — relatively predictable cash flows, shorter fund lives (5-7 years), and target IRRs that materially exceed bank fixed deposits or domestic debt funds.',
        realLifeExample:
          'A representative Cat II Private Credit AIF: ₹3,000 crore committed across 80 LP investors at average ₹3-5 crore commitment. Fund deploys across 15-20 mid-market Indian companies as senior-secured lending at 11-13% interest rates. Fund life 7 years (5 year investment + 2 year harvest). Quarterly cash flow distributions to LPs from interest receipts. Year 4 onwards: principal repayments returning capital. Across 7 years: gross IRR ~12-13% (after credit losses and recoveries); net of 2% management + 15% carry over 8% hurdle: net IRR 9-10%. This compares favourably to a debt mutual fund (post-FY24 slab-rate tax) on a net basis for high-bracket investors. Cat II Private Credit is structurally the most "fixed-income-like" of all AIFs — predictable cash flow with credit risk borne by the fund.',
        keyPoints: [
          'Cat II: largest category by AUM. Includes PE, Private Credit, Real Estate, Debt.',
          'PE: 6-10 investments, 5-8 yr holds, 8-10 yr fund life, target 12-16% net IRR.',
          'Private Credit: senior-secured (10-12%), mezzanine (13-15%), distressed (18-22%).',
          'Real Estate: 12-16% IRR, mix of operating yield + capital appreciation.',
          'REITs: separate listed structure with daily liquidity.',
          'Cat II AIFs receive pass-through tax — investor pays at personal rate.',
          'Most HNI families enter Cat II via Private Credit (predictable cash + tax-favourable vs debt funds).',
        ],
        faq: [
          {
            question: 'How does Private Credit AIF compare to a corporate bond mutual fund?',
            answer:
              'Private Credit AIFs invest in non-listed mid-market loans with 10-13% target yields and credit-due-diligence-led risk management. Corporate bond mutual funds invest in listed corporate bonds at 7-9% yields. Private Credit\'s additional 3-5% yield reflects credit risk, illiquidity, and the manager\'s ability to negotiate terms. For HNI investors comfortable with 5-7 year illiquidity, Private Credit AIF often delivers materially better risk-adjusted returns than corporate bond MFs.',
          },
          {
            question: 'What is "carried interest" in PE/AIF context?',
            answer:
              'Carried interest is the AIF Manager\'s share of profits, typically 20% of gains above an 8% hurdle rate. So a fund returning 18% gross IRR pays the Manager 20% × (18% − 8%) = 2% per year as carry. The investor receives 16% gross before management fees. Carry aligns Manager interests with investors but caps the investor\'s upside.',
          },
          {
            question: 'How is real estate via AIF different from buying property directly?',
            answer:
              'AIF gives institutional-grade exposure across multiple properties (diversification), professional management (no operational responsibility), and structured exit (5-7 years vs decades-long direct holdings). The trade-off is the ₹1 crore AIF minimum and illiquidity. Direct property ownership offers direct control, generational wealth transfer, and unlimited holding — but requires capital, operational involvement, and concentrated single-property risk.',
          },
        ],
        mcqs: [
          {
            question: 'Cat II AIFs include which strategy categories?',
            options: [
              'VC and Angel only',
              'PE, Private Credit, Real Estate, Debt',
              'Hedge and Long-Short only',
              'Mutual Funds',
            ],
            correctAnswer: 1,
            explanation:
              'Cat II AIFs include Private Equity (buyout + growth), Private Credit (mid-market lending), Real Estate Funds, and Debt Funds. SEBI defines Cat II residually as "AIFs not falling in Cat I or Cat III".',
          },
          {
            question: 'Target net IRR for Cat II Private Credit (senior-secured) AIFs is typically:',
            options: ['3-5%', '10-12%', '25-30%', 'Negative'],
            correctAnswer: 1,
            explanation:
              'Senior-secured Cat II Private Credit AIFs typically target 10-12% net IRR (after fund-level fees). This compares favourably to corporate bond MFs (7-9%) and bank FDs (4-6%) for HNI investors comfortable with 5-7 year illiquidity.',
          },
          {
            question: '"Carried interest" in AIF context refers to:',
            options: [
              'The interest rate on bonds',
              'Manager\'s share of profits, typically 20% above an 8% hurdle',
              'Coupon payment frequency',
              'A type of debt instrument',
            ],
            correctAnswer: 1,
            explanation:
              'Carried interest (or "carry") is the AIF Manager\'s share of profits — typically 20% of gains above an 8% hurdle rate. It aligns Manager interests with investor outcomes while capping investor upside.',
          },
        ],
        summaryNotes: [
          'Cat II = largest AIF category. PE, Private Credit, Real Estate, Debt.',
          'PE: 12-16% net IRR target, 8-10 yr life.',
          'Private Credit: 10-12% (senior), 13-15% (mezz), 18-22% (distressed).',
          'Real Estate: 12-16% IRR with operating yield + appreciation.',
          'Cat II receives pass-through tax — investor pays at personal rate.',
        ],
        relatedTopics: ['aif-cat-1-deep', 'aif-cat-3-deep', 'aif-three-categories'],
      },
    },

    {
      id: 'aif-cat-3-deep',
      title: 'Cat III AIFs — Hedge & Long-Short Strategies',
      slug: 'aif-cat-3-deep',
      content: {
        definition:
          'Category III AIFs run hedge fund-style strategies in India — long-short equity, market-neutral, derivatives-driven, multi-strategy. Cat III is the only AIF category permitted to use leverage and complex derivatives strategically. SEBI taxes Cat III at the fund level (not pass-through), simplifying investor reporting but reducing post-tax returns relative to similar pass-through structures.',
        explanation:
          'Cat III strategies include Long-Short Equity (similar concept to SIF Equity LS but with greater leverage and instrument flexibility), Market-Neutral Equity (zero-net-equity-exposure strategies seeking pure stock-selection alpha), Derivatives-Driven Strategies (volatility-based, options-overlay, event-driven), and Multi-Strategy (combining several approaches in a single fund). Cat III differs from SIF Equity LS in three ways: (1) higher leverage permitted (up to 200% gross via SEBI norms vs SIF\'s ~150-200% limit); (2) broader derivative instrument universe; (3) typically open-ended with quarterly redemption windows (vs SIF\'s mix of frameworks). Cat III pays tax at the fund level. The fund\'s realised gains from F&O, equity short-term and long-term trades are taxed within the AIF before distribution. Distributions to investors are largely tax-free in their hands. The trade-off: net-of-fund-tax returns are materially lower than equivalent gross returns. A Cat III AIF generating 18% gross might net 12-13% after fund-level tax + Manager fees — comparable to a SIF Equity LS strategy with pass-through. Investors choose between SIF and Cat III based on: (a) investment minimum (₹10 lakh vs ₹1 crore); (b) required strategy sophistication (Cat III may pursue more complex derivatives strategies); (c) tax preference (some investors prefer fund-level tax simplicity vs personal-level computation). For most Indian HNIs, SIF is operationally simpler and more accessible. Cat III suits UHNIs and family offices who specifically want exposure to strategies that exceed SIF\'s instrument or leverage permissions.',
        realLifeExample:
          'A representative Cat III multi-strategy AIF: ₹1,500 crore AUM. Strategy mix: 40% long-short equity (long 70% / short 30% net 40%), 30% volatility/derivatives overlay (selling options for premium income), 20% event-driven (M&A arbitrage, special situations), 10% market-neutral pair trades. Open-ended with quarterly redemption windows and 12-month lock-in. Target gross 18-22% IRR. Fees: 2.5% management + 20% performance over 8% hurdle (high-water mark). Year 1 fund returns 16% gross. After fund-level tax (~25-30% on F&O and short-term gains): ~11.5% post-tax. After 2.5% management fee: 9% to investors. Compare to SIF equivalent: gross 14%, pass-through tax (investor at 30% slab) on capital gains for non-equity portions: ~11% net. Outcomes are similar; structure preference depends on investor wealth tier and operational considerations.',
        keyPoints: [
          'Cat III = hedge fund-style strategies; leverage and derivatives permitted.',
          'Strategy types: Long-Short Equity, Market-Neutral, Derivatives-Driven, Multi-Strategy.',
          'Higher leverage and broader instrument universe vs SIF Equity LS.',
          'Often open-ended with quarterly redemption windows + 12-24 month lock-ins.',
          'TAX: fund-level (not pass-through), reducing investor reporting complexity.',
          'Net-of-fund-tax returns materially lower than equivalent gross.',
          'Cat III suits UHNIs and family offices wanting strategies beyond SIF\'s permissions.',
        ],
        faq: [
          {
            question: 'How does Cat III long-short differ from SIF long-short equity?',
            answer:
              'Three differences: (1) Minimum investment — Cat III ₹1 crore vs SIF ₹10 lakh; (2) Strategy flexibility — Cat III permits higher leverage and broader derivatives use; (3) Tax — Cat III taxed at fund level vs SIF pass-through. For investors below ₹50 lakh allocation, SIF is operationally more practical. For UHNIs needing complex derivative strategies (volatility selling, event-driven), Cat III offers structural advantages.',
          },
          {
            question: 'Why does Cat III pay tax at fund level?',
            answer:
              'Cat III strategies generate complex income types — F&O gains (treated as business income), short-term capital gains, dividends, etc. Allocating these accurately to many LPs at their individual rates is administratively complex. SEBI/CBDT designed fund-level taxation as a simplification — the AIF pays tax once, distributions to investors are largely tax-free. The trade-off: net-of-fund-tax returns are lower than would be in pass-through; investors cannot offset Cat III losses against personal capital gains.',
          },
          {
            question: 'Is Cat III appropriate for first-time alternative investors?',
            answer:
              'Generally no. Cat III strategies are operationally and conceptually more complex than long-only equity or even SIF-style long-short. First-time alternative investors typically should start with SIF (lower minimum, simpler operation) or Cat II Private Credit (predictable cash flow). Cat III suits investors who have already navigated alternative investments and seek specific strategy capabilities only Cat III can deliver.',
          },
        ],
        mcqs: [
          {
            question: 'Cat III AIFs are taxed at:',
            options: ['Investor level (pass-through)', 'AIF/fund level', 'No tax', 'Slab rate only on dividends'],
            correctAnswer: 1,
            explanation:
              'Cat III AIFs are taxed at the fund level — the AIF pays tax on its income and distributions to investors are largely tax-free. This simplifies investor reporting but reduces net-of-tax returns compared to pass-through structures.',
          },
          {
            question: 'A typical Cat III AIF\'s minimum lock-in period is:',
            options: ['No lock-in', '12-24 months', '10 years', 'Based on investor age'],
            correctAnswer: 1,
            explanation:
              'Cat III AIFs are often open-ended with quarterly redemption windows but typically include a 12-24 month minimum lock-in to ensure capital stability for the strategy. After lock-in, redemptions are subject to quarterly windows.',
          },
          {
            question: 'For an HNI choosing between SIF Equity LS and Cat III long-short equity, the determining factor is:',
            options: [
              'Returns (always identical)',
              'Wealth tier (₹10 lakh SIF vs ₹1 crore Cat III), strategy complexity preference, tax structure',
              'Marketing materials',
              'Manager popularity',
            ],
            correctAnswer: 1,
            explanation:
              'The choice depends on wealth tier (₹10 lakh SIF accessibility vs ₹1 crore Cat III commitment), required strategy complexity (Cat III permits broader derivatives), and tax structure preference (pass-through SIF vs fund-level Cat III).',
          },
        ],
        summaryNotes: [
          'Cat III = hedge strategies; leverage and derivatives flexibility.',
          'Tax at fund level (not pass-through); simplified investor reporting.',
          'Net-of-fund-tax returns lower than equivalent gross.',
          'Cat III suits UHNIs needing complex strategies beyond SIF permissions.',
        ],
        relatedTopics: ['aif-cat-1-deep', 'aif-cat-2-deep', 'sif-equity-long-short'],
      },
    },
  ],
};
