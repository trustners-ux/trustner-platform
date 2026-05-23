import { LearningModule } from '@/types/learning';

export const aifAdvancedModule: LearningModule = {
  id: 'aif-advanced',
  title: 'AIF Advanced — Capital Calls, Waterfall, Vintage & Diligence',
  slug: 'aif-advanced',
  icon: 'GitBranch',
  description:
    'Advanced AIF mechanics: capital-call cycle planning, distribution waterfall computation, vintage and manager diversification strategy, and the diligence framework that separates institutional-quality AIFs from retail-pushed offerings.',
  level: 'advanced',
  color: 'from-fuchsia-800 to-pink-700',
  estimatedTime: '40 min',
  track: 'aif',
  sections: [
    {
      id: 'aif-capital-calls',
      title: 'Capital Calls — Mechanics & Liquidity Planning',
      slug: 'aif-capital-calls',
      content: {
        definition:
          'A capital call is the AIF\'s formal request to its LPs to transfer a portion of their committed capital to fund a specific investment opportunity. Most Cat I and Cat II AIFs use the capital-call structure rather than collecting full commitments upfront. Investors must maintain liquidity to meet calls within typically 7-10 days notice; failure to meet a call can result in default penalties and loss of prior commitments.',
        explanation:
          'A typical capital-call cycle: Day 0 — investor commits ₹2 crore to a Cat II PE Fund with 5-year investment period. Day 0 — initial capital call of 15-20% (₹30-40 lakh) to fund deployment over the first quarter. Months 6-60 — capital calls continue periodically (quarterly to semi-annually) as the AIF identifies investments. Total deployment: ₹2 crore across 8-15 capital calls. Each call has 7-10 day notice requirement; investor must transfer the called amount to the AIF\'s collection account by the deadline. Liquidity planning. Investors must maintain: (a) cash or liquid funds equal to at least 30-40% of remaining commitments — sufficient to meet 1-2 typical calls without disrupting other investments; (b) understanding of the AIF\'s historical deployment pattern (some AIFs deploy quickly in 18-24 months; others stretch over 4-5 years); (c) awareness of multiple AIF commitments — if the investor holds 3 AIF commitments simultaneously, calls may overlap requiring larger liquidity reserve. Default consequences are serious: SEBI permits AIFs to charge penalty interest, dilute the defaulting LP\'s share by allowing other LPs to absorb their portion, or in extreme cases declare a forfeiture event where the LP loses their already-paid capital. These are real risks for investors who over-commit relative to liquidity.',
        realLifeExample:
          'A UHNI family commits ₹6 crore across three AIFs in 2026: ₹2 cr Cat I VC, ₹2 cr Cat II PE, ₹2 cr Cat II Private Credit. Year 1 calls: VC fund calls ₹40 lakh for first 5 investments; PE calls ₹30 lakh for one bridge investment; Private Credit calls ₹50 lakh for two senior secured loans. Total Year 1 calls: ₹1.20 crore, well within their liquidity reserves. Year 2 calls: VC ₹60 lakh; PE ₹70 lakh; Private Credit ₹40 lakh. Total ₹1.70 crore. Liquidity drawn down further. Year 3 calls: VC ₹50 lakh, PE ₹100 lakh (large opportunistic deal), Private Credit ₹40 lakh. Total ₹1.90 crore. Liquidity reserves now stressed. The family must rebalance — drawing from a mutual fund redemption to fund the Year 3 calls. This is why disciplined liquidity planning before AIF commitments matters: total committed capital must align with expected deployment cycle plus 30-40% liquidity buffer.',
        keyPoints: [
          'Capital call = AIF\'s formal request for committed capital tranches.',
          'Typical pattern: 8-15 calls over 3-5 year investment period.',
          'Notice: 7-10 days; transfer required to AIF collection account.',
          'Liquidity reserve: 30-40% of remaining commitments in cash/liquid funds.',
          'Multiple simultaneous AIFs: calls may overlap, requiring larger reserve.',
          'Default consequences: penalty interest, dilution, or forfeiture event.',
          'Disciplined commitment sizing relative to liquidity is essential.',
        ],
        faq: [
          {
            question: 'How are capital calls communicated?',
            answer:
              'AIFs send formal call notices via email and registered post to LPs. The notice specifies the call amount, the underlying investment opportunity (typically described at high level for confidentiality), the transfer deadline, and the wire instructions. LPs are expected to respond within the notice window. Some AIFs offer auto-debit mandates for predictable Cat II Private Credit calls; for VC and PE, manual transfer per call is the norm.',
          },
          {
            question: 'Can I prepay my full commitment to avoid capital calls?',
            answer:
              'Some AIFs permit pre-funding (transferring full commitment upfront, with the AIF holding it in liquid funds until deployment). The trade-off: the investor loses the time-value benefit of the call structure (capital that would have been earning returns elsewhere is sitting at marginal rates in the AIF\'s liquid fund). Most sophisticated investors retain the call structure unless cash management is a bigger constraint than yield.',
          },
          {
            question: 'What if my financial circumstances change mid-cycle and I cannot meet calls?',
            answer:
              'Communicate proactively with the AIF Manager. Some funds permit secondary sale of the commitment to another qualified investor (typically at a 10-20% discount to NAV). Some funds may permit a partial release. In extreme cases, default consequences apply. Trustner\'s framework includes annual liquidity-stress review for clients with active AIF commitments, identifying potential stress before it materialises.',
          },
        ],
        mcqs: [
          {
            question: 'Liquidity reserve recommended for active AIF commitments is approximately:',
            options: [
              '5% of remaining commitments',
              '30-40% of remaining commitments',
              '100% of total commitments',
              'No reserve needed',
            ],
            correctAnswer: 1,
            explanation:
              '30-40% of remaining commitments in cash/liquid funds — sufficient to meet 1-2 typical calls without disrupting other investments. Multiple simultaneous AIF commitments may require even larger reserves.',
          },
          {
            question: 'A typical AIF capital-call notice period is:',
            options: ['Same day', '7-10 days', '90 days', '6 months'],
            correctAnswer: 1,
            explanation:
              'AIF capital calls typically have 7-10 day notice. The investor must transfer the called amount to the AIF\'s collection account within this window. Late transfers may incur penalty interest; non-payment can trigger default consequences.',
          },
          {
            question: 'A consequence of failing to meet an AIF capital call can include:',
            options: [
              'No consequence',
              'Penalty interest, dilution by other LPs, or forfeiture of prior capital',
              'Automatic exit at NAV',
              'SEBI fine of ₹10,000',
            ],
            correctAnswer: 1,
            explanation:
              'Default consequences are serious: SEBI permits AIFs to charge penalty interest, dilute the defaulting LP\'s share by allowing other LPs to absorb their portion, or declare a forfeiture event where the LP loses prior paid capital. Liquidity discipline is essential.',
          },
        ],
        summaryNotes: [
          'Capital calls fund deployment over 3-5 year investment period.',
          'Liquidity reserve: 30-40% of remaining commitments.',
          'Default consequences are serious — penalty, dilution, forfeiture.',
          'Disciplined commitment sizing protects against liquidity stress.',
        ],
        relatedTopics: ['aif-waterfall-distribution', 'aif-vintage-diversification', 'aif-tax-liquidity'],
      },
    },

    {
      id: 'aif-waterfall-distribution',
      title: 'Waterfall Distributions — How AIFs Pay Out',
      slug: 'aif-waterfall-distribution',
      content: {
        definition:
          'The AIF distribution waterfall defines the sequence in which proceeds from the fund\'s investments are paid back to LPs and the Manager. Standard four-tier waterfall: (1) Return of invested capital to LPs, (2) Preferred return (typically 8% IRR) to LPs on invested capital, (3) Manager catch-up, (4) Carried interest split (typically 80/20 LP/Manager) on remaining gains. Understanding the waterfall is essential for evaluating expected investor outcomes.',
        explanation:
          'Worked example: AIF with ₹500 cr committed, ₹500 cr deployed, generates ₹900 cr in distributions over fund life. Tier 1 (Return of capital): First ₹500 cr distributed back to LPs as return of their invested capital. Manager receives nothing. Tier 2 (Preferred return / "hurdle"): Next layer of distributions allocated to LPs to deliver them an 8% annualised IRR on their invested capital. Calculate: 8% IRR over assumed 7-year fund life requires LPs to receive approximately ₹356 cr beyond return of capital (so total LP receipts = ₹856 cr; gross IRR = 8% on ₹500 cr over 7 years). Of the remaining ₹900 cr - ₹500 cr - ₹356 cr = ₹44 cr, this is the "above-hurdle" pool. Tier 3 (Catch-up): Manager receives 100% of distributions until the Manager has received 20% of the cumulative profits. Cumulative profits = ₹900 cr - ₹500 cr = ₹400 cr. Manager 20% = ₹80 cr. Manager has received zero so far; needs ₹80 cr to "catch up". The catch-up provision allocates 100% of the next ₹80 cr to the Manager. But only ₹44 cr above-hurdle remains. So entire ₹44 cr goes to Manager as partial catch-up. Manager total: ₹44 cr. LP total: ₹856 cr. Tier 4 (Carry): Not reached because all ₹900 cr is distributed. In this example, LPs received ₹856 cr (1.71x multiple), gross IRR ~8.5%. Manager received ₹44 cr (less than 20% of profits because the deal economics were marginal). Different scenario with stronger returns: ₹1,200 cr distributions on ₹500 cr deployed. After Tier 1 (₹500 cr to LPs) and Tier 2 (₹356 cr to LPs for 8% IRR), remaining ₹344 cr is "above hurdle". Tier 3 catch-up: Manager gets first ₹140 cr (until Manager has 20% of the ₹700 cr cumulative profits). Tier 4 split: Remaining ₹204 cr split 80/20 between LPs and Manager → LPs ₹163 cr + Manager ₹41 cr. Final: LPs ₹1,019 cr (2.04x multiple), Manager ₹181 cr.',
        realLifeExample:
          'For a real Indian Cat I VC fund vintage: committed ₹1,000 cr, invested ₹950 cr (some uncalled), distributions ₹1,800 cr over 9 years. Tier 1: ₹950 cr return of capital to LPs. Tier 2: 8% × ₹950 cr × 9 years ≈ ₹855 cr (additional preferred return). Total LP receipts so far ₹1,805 cr, but only ₹1,800 cr distributed — LPs have actually slightly underperformed the 8% hurdle. Manager catch-up: zero (no above-hurdle distributions). LP final: ₹1,800 cr (1.89x multiple, ~7.5% IRR over 9 years). Manager: zero carry beyond the management fee. This represents a "below-hurdle" outcome where the Manager\'s carry rights provided no value. In the alternative scenario where the same fund returns ₹3,000 cr distributions: Tier 1 ₹950 cr, Tier 2 ₹855 cr → LP cumulative ₹1,805 cr, above-hurdle ₹1,195 cr. Catch-up to Manager: 20% of cumulative profits ₹2,050 cr = ₹410 cr; Manager catches up ₹410 cr from above-hurdle pool. Remaining ₹785 cr → 80/20 split: LPs ₹628 cr, Manager ₹157 cr. Total Manager ₹567 cr. Total LPs ₹2,433 cr (2.56x multiple, ~12% IRR). The waterfall structure rewards Managers when they outperform but provides no carry on below-hurdle returns.',
        keyPoints: [
          'Four-tier waterfall: return of capital → preferred return → catch-up → carry.',
          'Standard hurdle: 8% IRR; carry split: 20% Manager / 80% LP after catch-up.',
          'Catch-up allocates 100% to Manager until Manager has 20% of cumulative profits.',
          'Below-hurdle outcomes deliver zero carry to Manager.',
          'Above-hurdle outcomes split 80/20 LP/Manager after full catch-up.',
          'PPM defines the exact waterfall mechanics for each AIF — read carefully.',
          'Net-of-carry projections must include realistic assumptions about above-hurdle returns.',
        ],
        faq: [
          {
            question: 'What is "European" vs "American" waterfall?',
            answer:
              'European waterfall: carry calculated on the full fund\'s cumulative performance — Manager waits until all capital and hurdle is returned across the full fund before any carry is paid. American waterfall: carry calculated deal-by-deal — Manager can earn carry on a successful deal even before unsuccessful deals have completed. American is more favourable to Managers; European is more favourable to LPs. Most Indian AIFs use European or modified-European waterfall structures.',
          },
          {
            question: 'How is preferred return ("hurdle") different from a guaranteed return?',
            answer:
              'Hurdle is a threshold for carry calculation — the LP receives the hurdle return only if the fund generates enough profit to pay it. If the fund underperforms, LPs receive less than the hurdle. The hurdle is NOT a guaranteed return; it is a Manager-incentive threshold. Investors must understand this distinction.',
          },
          {
            question: 'Can the waterfall structure be customised for individual investors?',
            answer:
              'Generally no — the waterfall applies uniformly to all LPs in a single AIF. Fee structures (management fee rate, carry rate) may be negotiated for large LPs (₹10 cr+ commitments), but the core waterfall sequence is structural. If an investor wants different terms, they typically need to invest in a different AIF.',
          },
        ],
        mcqs: [
          {
            question: 'In a standard AIF waterfall, what comes FIRST?',
            options: [
              'Carried interest to Manager',
              'Return of invested capital to LPs',
              'Manager catch-up',
              'Preferred return to LPs',
            ],
            correctAnswer: 1,
            explanation:
              'The four-tier waterfall starts with return of invested capital to LPs — Manager receives nothing until LPs have been made whole on capital. Then preferred return, then catch-up, then carry split.',
          },
          {
            question: 'A typical preferred return ("hurdle") in Indian AIFs is approximately:',
            options: ['1%', '8%', '20%', '50%'],
            correctAnswer: 1,
            explanation:
              'Standard preferred return / hurdle is 8% annualised IRR — the LP receives this before any carry is paid to the Manager. Some AIFs use 7% or 10% hurdles; 8% is the typical Indian market norm.',
          },
          {
            question: 'A "below-hurdle" fund outcome means:',
            options: [
              'LPs lose all capital',
              'Manager receives zero carried interest; LPs receive whatever the fund generated',
              'SEBI investigates',
              'AIF is shut down',
            ],
            correctAnswer: 1,
            explanation:
              'When fund returns are below the hurdle (e.g., fund delivers 6% gross IRR vs 8% hurdle), Manager receives zero carry. LPs receive the full distributions. This is a direct alignment of Manager incentive with LP returns.',
          },
        ],
        summaryNotes: [
          'Four-tier waterfall: capital → hurdle → catch-up → carry.',
          'Standard hurdle 8%; carry 20%; LP-favourable structure when fund underperforms.',
          'European vs American waterfall affects carry timing.',
          'PPM defines exact mechanics — read carefully before commitment.',
        ],
        relatedTopics: ['aif-capital-calls', 'aif-tax-liquidity', 'aif-vintage-diversification'],
      },
    },

    {
      id: 'aif-vintage-diversification',
      title: 'Vintage & Manager Diversification Strategy',
      slug: 'aif-vintage-diversification',
      content: {
        definition:
          'Vintage diversification spreads AIF commitments across multiple fund vintages (years of fund launch) to smooth deployment and exit cycles. Manager diversification spreads commitments across multiple AIF Managers to reduce manager-specific risk. Together, vintage and manager diversification are the two structural protections against AIF concentration risk for UHNI portfolios.',
        explanation:
          'Single-vintage risk. A family committing ₹5 crore to one Cat I VC fund vintage 2026 has all venture exposure tied to companies funded in that specific 12-24 month window. If 2026-2028 is a difficult vintage (e.g., funding-environment tightening, valuation reset), the entire ₹5 crore VC allocation suffers. Solution: vintage ladder — committing ₹1 crore each in 2026, 2027, 2028, 2029, 2030, spreading exposure across 5 vintages and smoothing cyclical risk. Single-manager risk. A family committing ₹3 crore to one Cat II Private Credit AIF concentrates manager-specific decisions in that single allocation. If the AIF Manager misjudges credit decisions or experiences team turnover, the entire ₹3 crore commitment is exposed. Solution: split ₹3 crore across 2-3 Cat II Private Credit AIFs from different Managers, reducing manager risk through diversification. Combined: vintage + manager diversification. A sophisticated UHNI AIF allocation might include: 4 Cat I VC commitments across 4 vintages (2026, 2027, 2028, 2029) and 3 Managers; 3 Cat II Private Credit commitments across 2 vintages and 3 Managers; 2 Cat III Hedge commitments across 2 Managers. Total: 9 separate AIF commitments providing meaningful diversification across category, vintage, and Manager. Operational complexity is real (9 capital-call schedules, 9 K-1 statements annually, 9 quarterly NAV reviews), but the diversification benefit is structural. Trustner\'s family-office framework includes this multi-dimensional diversification analysis at the time of each new commitment.',
        realLifeExample:
          'A family office with ₹100 crore AUM allocates 30% (₹30 cr) to AIFs. Their structured approach: Year 2024 — committed ₹3 cr each to two Cat II Private Credit AIFs and ₹2 cr to one Cat I VC. Year 2025 — committed ₹3 cr to a Cat II PE Fund and ₹2 cr to a second Cat I VC (different Manager). Year 2026 — committed ₹3 cr to a Cat II Real Estate AIF and ₹2 cr to a third Cat I VC. Year 2027 — committed ₹3 cr to another Cat II Private Credit AIF and ₹2 cr to a Cat III Hedge. Year 2028 — committed ₹3 cr to a Cat II Special Situations and ₹2 cr to a fourth Cat I VC. Total: 12 separate commitments across 5 vintages, multiple Managers, and three Categories. Capital deployment across Years 2024-2032 (8 year window). Distributions begin Year 5+. Estimated portfolio gross IRR 13-16% with materially smoother annual cash flows than a single concentrated AIF allocation. This is the institutional-quality framework that Trustner aims to replicate at HNI scale.',
        keyPoints: [
          'Vintage diversification: spread commitments across 4-7 fund vintages.',
          'Manager diversification: spread across 3-5+ AIF Managers within each Category.',
          'Single-vintage VC risk: difficult macro window can compromise entire vintage.',
          'Single-manager Cat II Private Credit risk: team turnover or judgement error affects entire commitment.',
          'Combined approach: 8-12 AIF commitments for sophisticated UHNI allocation.',
          'Operational complexity scales with diversification — capital calls, K-1s, reviews.',
          'Trustner\'s family-office framework includes multi-dimensional diversification analysis.',
        ],
        faq: [
          {
            question: 'How do I evaluate the "right number" of AIF commitments?',
            answer:
              'Rough rule: each AIF commitment should be ₹1-3 crore (within minimum and reasonable per-AIF allocation). For ₹15 crore total AIF allocation: 5-15 commitments. For ₹50 crore: 15-30 commitments. Beyond 30 commitments, operational complexity outweighs diversification benefit. Trustner\'s family-office team handles 25-50 commitment portfolios as standard.',
          },
          {
            question: 'Should I diversify across AIF Categories or concentrate in one?',
            answer:
              'Diversify across Categories. Cat I (VC), Cat II (PE/Credit/RE), and Cat III (Hedge) have meaningfully different return profiles, liquidity characteristics, and tax treatments. Concentrating in one Category increases category-specific cyclical risk. Sophisticated UHNI allocations include all three Categories with balance reflecting investor objectives.',
          },
          {
            question: 'What happens if one of my many AIF Managers underperforms?',
            answer:
              'Diversification absorbs the impact. With 8-12 AIF commitments, one Manager\'s underperformance reduces overall portfolio return modestly — perhaps 0.5-1.5% on the overall AIF allocation rather than 5-10%. This is precisely the structural protection vintage and manager diversification provides.',
          },
        ],
        mcqs: [
          {
            question: 'Vintage diversification means spreading AIF commitments across:',
            options: [
              'Different countries',
              'Different fund vintages (years of launch)',
              'Different banks',
              'Different time-of-day investments',
            ],
            correctAnswer: 1,
            explanation:
              'Vintage diversification = committing to AIFs across multiple fund-launch years, smoothing cyclical risk. A vintage 2026 VC fund deploys into companies funded in 2026-2028; a 2028 VC fund deploys into 2028-2030 companies. Different vintages capture different macro environments.',
          },
          {
            question: 'A sophisticated UHNI AIF portfolio might include:',
            options: [
              '1 large AIF',
              '8-12 commitments across vintages, Managers, and Categories',
              '50+ commitments minimum',
              'Only Cat I',
            ],
            correctAnswer: 1,
            explanation:
              'Sophisticated UHNI allocation: 8-12 AIF commitments diversified across 4-7 vintages, 3-5 Managers per Category, and all three Categories. Operational complexity is real but diversification benefit is structural.',
          },
          {
            question: 'Single-manager risk in AIF investments is reduced by:',
            options: [
              'Investing in larger AIFs only',
              'Splitting commitments across 2-3 Managers within each Category',
              'Investing exclusively in Cat I',
              'Avoiding AIFs',
            ],
            correctAnswer: 1,
            explanation:
              'Splitting commitments across 2-3 Managers within each Category reduces manager-specific risk. If one Manager underperforms or experiences team turnover, others absorb the impact. Standard sophisticated practice for AIF portfolios above ₹10 crore.',
          },
        ],
        summaryNotes: [
          'Vintage + Manager diversification = structural AIF risk reduction.',
          'Sophisticated UHNI: 8-12 commitments across 4-7 vintages and 3-5 Managers per Category.',
          'Operational complexity scales but diversification benefit is real.',
          'Trustner\'s family-office framework integrates this analysis at each commitment.',
        ],
        relatedTopics: ['aif-capital-calls', 'aif-waterfall-distribution', 'aif-three-categories'],
      },
    },
  ],
};
