import { LearningModule } from '@/types/learning';

export const pmsFoundationModule: LearningModule = {
  id: 'pms-foundation',
  title: 'PMS Foundation',
  slug: 'pms-foundation',
  icon: 'BriefcaseBusiness',
  description:
    'Portfolio Management Services (PMS) is the SEBI-regulated route through which High Net Worth Individuals access concentrated, professionally managed equity portfolios held in their own demat account. This foundation track covers the structure, the three PMS types, fee economics, and how to choose between PMS, mutual funds, and SIFs.',
  level: 'beginner',
  color: 'from-blue-700 to-cyan-600',
  estimatedTime: '45 min',
  track: 'pms',
  sections: [
    // ─── 1. What is PMS ───
    {
      id: 'pms-what-is',
      title: 'What is Portfolio Management Services (PMS)?',
      slug: 'what-is-pms',
      content: {
        definition:
          'Portfolio Management Services (PMS) is a SEBI-regulated investment service in which a licensed Portfolio Manager constructs and manages a customised securities portfolio on behalf of a single investor. Unlike mutual funds where investor money is pooled and the investor holds units, in a PMS each investor\'s securities are held directly in the investor\'s own demat account. The minimum investment threshold is ₹50 lakh per investor.',
        explanation:
          'PMS represents the customised, transparent, professionally managed end of the Indian wealth-management spectrum. Three structural features distinguish PMS from every other vehicle. First, the demat account: the securities are owned by the investor, not by a fund. The investor receives all corporate action benefits — dividends, bonuses, rights — directly. Second, the portfolio is concentrated. While mutual funds typically hold 50-200 stocks (driven by SEBI diversification rules), a PMS portfolio usually holds 15-30 stocks. The Portfolio Manager takes higher-conviction bets. Third, the strategy is customisable within the manager\'s mandate. While the standard practice is for the Portfolio Manager to run a defined "model portfolio" and replicate it across client demat accounts, individual customisation (excluding certain sectors, accommodating concentrated holdings already owned, etc.) is possible. The trade-off is the ₹50 lakh minimum, which means a single PMS allocation typically represents 10-30% of an HNI\'s liquid wealth — making PMS inappropriate for investors whose liquid corpus is below approximately ₹2 crore. Distribution of PMS requires registration with APMI (Association of Portfolio Managers in India), separate from AMFI registration. Trustner Asset Services Pvt. Ltd. holds APMI registration as a PMS Distributor.',
        realLifeExample:
          'Take Ravi, 52, a Bangalore-based founder who has just exited his startup and has ₹4 crore in liquid wealth. He wants concentrated exposure to Indian small and mid-caps managed by a manager with a 15-year track record. He allocates ₹50 lakh to a Discretionary PMS focused on quality small-mid caps. In his demat account, the Portfolio Manager (over the next 30 days) buys 22 stocks at the Manager\'s chosen weights. The stocks sit in Ravi\'s name. When TVS Motor declares a 50% bonus, Ravi receives the bonus shares directly. When Apar Industries pays ₹50/share dividend, the dividend lands in Ravi\'s bank account directly. He receives quarterly portfolio statements, monthly newsletters, and an annual review meeting with the Portfolio Manager. He pays a 2% fixed management fee plus 10% performance fee above a 12% hurdle rate (these structures vary by PMS). After three years, his portfolio has grown to ₹95 lakh. The Portfolio Manager has executed approximately 35 buy-sell transactions over those three years; each transaction is a separate tax event (LTCG/STCG) on Ravi\'s books.',
        keyPoints: [
          'PMS is SEBI-regulated, with a minimum investment of ₹50 lakh per investor.',
          'Securities are held in the investor\'s own demat account — direct ownership.',
          'Portfolios are concentrated (typically 15-30 stocks) and conviction-led.',
          'Three PMS types: Discretionary, Non-Discretionary, Advisory.',
          'Fees typically combine fixed management fee (1-2.5%) and performance fee (10-20% over hurdle).',
          'Distribution requires APMI registration — Trustner Asset Services holds this empanelment.',
          'Each portfolio transaction is a separate tax event — operationally heavier than mutual funds.',
        ],
        faq: [
          {
            question: 'Why is the PMS minimum ₹50 lakh?',
            answer:
              'SEBI set ₹50 lakh as the threshold to ensure PMS is accessed only by investors who can afford the operational complexity (separate demat, transaction-by-transaction tax, individual reporting) and absorb the higher concentration risk. The threshold also supports the Portfolio Manager\'s economic viability — managing customised portfolios for ₹10 lakh tickets would not be cost-effective.',
          },
          {
            question: 'Do I receive dividends and corporate actions directly?',
            answer:
              'Yes. Because the securities sit in your own demat account, all dividends, bonus issues, rights, buybacks, and other corporate actions accrue directly to you, on the same terms as if you held the stocks yourself. This is one of the structural differences from mutual funds, where these benefits accrue to the fund and are reflected in the NAV.',
          },
          {
            question: 'Can I see what the PMS is buying and selling in real time?',
            answer:
              'You receive transaction confirmations through your broker (since the trades happen in your demat account), and the Portfolio Manager provides quarterly portfolio statements with detailed positioning. You will not see real-time alerts on every trade, but you have full transparency on holdings and transactions through your demat account at any time.',
          },
          {
            question: 'How does PMS differ from a mutual fund operationally?',
            answer:
              'The most important operational difference: in a mutual fund, you hold units and the fund holds the securities. The fund\'s buy-sell activity is invisible to you (you only see the NAV). In a PMS, you hold the securities directly, so every Portfolio Manager transaction reflects in your demat — and creates a tax event on your books. This means PMS portfolios typically generate more granular tax reporting than mutual funds.',
          },
        ],
        mcqs: [
          {
            question: 'What is the SEBI-mandated minimum investment for a PMS?',
            options: ['₹10 lakh', '₹25 lakh', '₹50 lakh', '₹1 crore'],
            correctAnswer: 2,
            explanation:
              'SEBI mandates a minimum investment of ₹50 lakh per investor for PMS. This is the highest threshold among the three retail-accessible structures (₹500 SIP for MF, ₹10 lakh for SIF, ₹50 lakh for PMS).',
          },
          {
            question: 'In a PMS, who legally owns the underlying securities?',
            options: ['The Portfolio Manager', 'The investor', 'SEBI', 'The custodian'],
            correctAnswer: 1,
            explanation:
              'In a PMS, securities are held directly in the investor\'s own demat account. The investor is the legal owner. The Portfolio Manager has the discretion (in the case of Discretionary PMS) to buy and sell on behalf of the investor.',
          },
          {
            question: 'Distribution of PMS in India requires registration with:',
            options: ['IRDAI', 'AMFI', 'APMI', 'RBI'],
            correctAnswer: 2,
            explanation:
              'PMS distribution requires registration with APMI (Association of Portfolio Managers in India), the SRO for Portfolio Managers. AMFI registration covers mutual fund and SIF distribution, but not PMS.',
          },
        ],
        summaryNotes: [
          'PMS = SEBI-regulated, ₹50 lakh minimum, securities held in investor\'s demat.',
          'Concentrated portfolios (15-30 stocks), conviction-led, customisable.',
          'Three types: Discretionary, Non-Discretionary, Advisory (covered next section).',
          'Distribution: APMI registration required — Trustner holds this.',
        ],
        relatedTopics: ['pms-types', 'pms-fees', 'pms-vs-mf-vs-aif'],
      },
    },

    // ─── 2. Three Types of PMS ───
    {
      id: 'pms-types',
      title: 'Three Types of PMS — Discretionary, Non-Discretionary, Advisory',
      slug: 'pms-types',
      content: {
        definition:
          'SEBI classifies Portfolio Management Services into three types based on the degree of decision-making authority delegated to the Portfolio Manager: Discretionary PMS (Manager makes all buy-sell decisions independently), Non-Discretionary PMS (Manager recommends, investor approves each transaction), and Advisory PMS (Manager only advises; investor executes through their own broker).',
        explanation:
          'In a Discretionary PMS, the investor signs a Power of Attorney that grants the Portfolio Manager full discretion to buy and sell securities in the demat account without seeking approval for each transaction. This is the most common form in India today (over 90% of PMS AUM) because it removes execution friction and allows the Manager to act on conviction quickly. The investor sees holdings and transactions through quarterly reports but is not consulted on individual trades. In a Non-Discretionary PMS, the Manager recommends each transaction but the investor must approve before execution. This suits investors who want to retain final decision-making — typically founders, business owners, or sophisticated investors who view the Manager as a research partner rather than a delegate. The operational friction (every trade requires a call or email) means few firms offer this structure today, and it is often slower in execution. In an Advisory PMS, the Manager only provides research and recommendations; the investor executes through their own broker. The Manager does not have access to the investor\'s demat. This is the lightest-touch structure — the investor pays for advisory expertise but bears all execution responsibility. It is also the least common in retail PMS distribution; most Advisory PMS arrangements are bespoke for ultra-HNI clients or family offices. The choice depends on three factors: the investor\'s desire for involvement, the Manager\'s value proposition (some Managers are pure stock-pickers; others add execution discipline), and operational practicality at the investor\'s wealth scale.',
        realLifeExample:
          'Three investors at the same liquid wealth level (₹3 crore each) make different PMS choices. Aniket, a 50-year-old senior banker in Mumbai, prefers Discretionary — he travels frequently for work and wants the Portfolio Manager to act without waiting for his approval. He signs the POA, allocates ₹50 lakh, and reviews the quarterly statements with his Relationship Manager. Sandeep, a 55-year-old tech entrepreneur in Bangalore, runs Non-Discretionary — he was a public-equity investor for 15 years before his startup years and wants to remain involved in stock-level decisions. He receives daily emails of recommended trades and approves or declines each. The Manager\'s strategy is more constrained because of his approval cycle, but Sandeep values the involvement. Krishnan, a 60-year-old former CFO with ₹15 crore liquid wealth and a personal broker network of 20 years, chooses Advisory — he pays the Manager a flat ₹5 lakh annual research fee for ideas, executes through his own broker, and integrates the Manager\'s ideas with his own research. Each structure suits a different investor — the choice is not about which is "best" but which fits the investor\'s personal involvement level and total ticket size.',
        keyPoints: [
          'Discretionary PMS: Manager has full execution authority via POA. Most common in retail PMS.',
          'Non-Discretionary PMS: Manager recommends, investor approves each trade. Suits hands-on investors.',
          'Advisory PMS: Manager only advises; investor executes through their own broker. Suits ultra-HNIs.',
          'Choice depends on involvement preference, Manager\'s value-add, and ticket size.',
          'Discretionary is simpler operationally; Advisory is leanest on Manager fees but heaviest on investor effort.',
          'A Power of Attorney (POA) is signed by the investor for Discretionary PMS — read it carefully.',
        ],
        faq: [
          {
            question: 'Is Discretionary PMS riskier because the Manager makes decisions independently?',
            answer:
              'Not necessarily. The Manager operates within a SEBI-mandated investment framework and the strategy disclosed in the Disclosure Document. The POA grants execution authority but not unlimited risk-taking. The investor reviews holdings quarterly and can withdraw at any time. The greater "risk" of Discretionary is psychological — investors must accept that they will not approve every trade.',
          },
          {
            question: 'Can I switch from Discretionary to Non-Discretionary in the same PMS?',
            answer:
              'Generally no — these are distinct service types under SEBI rules and require different agreements. Switching usually means redeeming from one and re-subscribing to the other, with the corresponding tax events.',
          },
          {
            question: 'In Advisory PMS, who is responsible if the recommended trade goes wrong?',
            answer:
              'The investor — because the investor executes the trade. The Advisory Portfolio Manager provides recommendations but does not bear execution risk. This is one reason Advisory is suitable only for sophisticated investors who can independently evaluate recommendations.',
          },
          {
            question: 'How is the POA structured in a Discretionary PMS?',
            answer:
              'The Power of Attorney is limited — it authorises the Portfolio Manager to buy and sell securities specifically within the agreed strategy and demat account, and does NOT permit fund transfers, account closures, or other transactions outside the investment mandate. Always read the POA carefully and consult your legal advisor before signing.',
          },
        ],
        mcqs: [
          {
            question: 'In a Discretionary PMS, who executes individual trades?',
            options: [
              'The investor approves and executes',
              'The Portfolio Manager executes via POA',
              'SEBI executes',
              'The custodian decides',
            ],
            correctAnswer: 1,
            explanation:
              'In a Discretionary PMS, the investor signs a Power of Attorney granting the Portfolio Manager authority to execute trades within the agreed strategy. The Manager executes; the investor reviews quarterly.',
          },
          {
            question: 'Which PMS type is most common in retail Indian distribution?',
            options: ['Advisory', 'Non-Discretionary', 'Discretionary', 'Hybrid'],
            correctAnswer: 2,
            explanation:
              'Discretionary PMS represents over 90% of PMS AUM in India because it removes execution friction. The investor delegates execution, freeing the Manager to act on conviction.',
          },
          {
            question: 'In Advisory PMS, who bears execution responsibility?',
            options: [
              'The Portfolio Manager',
              'The investor',
              'The custodian',
              'SEBI',
            ],
            correctAnswer: 1,
            explanation:
              'In Advisory PMS, the Manager provides recommendations but does not have demat access. The investor executes through their own broker and bears full execution responsibility.',
          },
        ],
        summaryNotes: [
          'Three PMS types vary by execution authority: Discretionary, Non-Discretionary, Advisory.',
          'Discretionary is most common; choice depends on investor\'s involvement preference.',
          'POA in Discretionary is limited to the agreed investment mandate — not unrestricted authority.',
        ],
        relatedTopics: ['what-is-pms', 'pms-fees', 'pms-who-should-invest'],
      },
    },

    // ─── 3. PMS Fees ───
    {
      id: 'pms-fees',
      title: 'PMS Fee Structures — Fixed, Variable, and Hurdle Rate',
      slug: 'pms-fees',
      content: {
        definition:
          'PMS fees in India typically combine three components: a fixed management fee (annual percentage of AUM), an optional performance fee (a share of returns above a hurdle rate), and direct expenses (brokerage, custodian, audit). SEBI mandates that all fees and expenses must be transparently disclosed to the investor, and every PMS must offer at least one "fixed fee only" option without performance fees.',
        explanation:
          'A typical Discretionary PMS in India today charges between 1.5% and 2.5% per annum as a fixed management fee, calculated as a percentage of average daily AUM. For an investor with ₹50 lakh allocated, this works out to roughly ₹75,000 to ₹1.25 lakh per year, deducted from the demat account quarterly or monthly. On top of this, many PMS schemes offer a performance-fee option — typically structured as 10-20% of returns above a hurdle rate of 8-12% per annum, with a high-water mark provision to ensure the Manager is not paid twice for the same gains. For example, a PMS charging 2% fixed plus 15% performance over 10% hurdle: in a year where the portfolio returns 18%, the Manager keeps the 2% management fee plus 15% × (18% − 10%) = 1.2% performance fee, totalling 3.2% in fees. In a year where the portfolio returns only 6%, the Manager keeps the 2% management fee but no performance fee. The high-water mark means that if the portfolio loses 10% in year 1, the Manager must first earn back that 10% in year 2 before any new performance fee can accrue. SEBI requires every PMS to offer at least one option where the investor can choose pure fixed-fee with no performance component — the investor decides whether to opt for the fixed-only or the fixed-plus-performance structure. Beyond management and performance fees, the investor also pays brokerage on every transaction the Manager executes (typically 5-15 bps per trade), custodian fees (₹5,000-15,000 per year), and audit/compliance fees. These are pass-through and are paid out of the demat account directly. Total annual cost of a PMS, including all fees and expenses, typically ranges from 2.5% to 4.5% per annum, materially higher than a mutual fund\'s 0.5%-2.0% TER.',
        realLifeExample:
          'Take an investor with ₹1 crore allocated to a Discretionary PMS that charges 2% fixed plus 15% performance over a 10% hurdle, with high-water mark. Year 1: portfolio returns 22%, ending value (gross) ₹1.22 crore. Management fee: 2% of ₹1.10 crore (avg AUM) = ₹2.2 lakh. Performance fee: 15% × (22% − 10%) × ₹1 crore = ₹1.8 lakh. Total fees: ₹4 lakh (4% of opening AUM, but only 1.8% on the gross gains). Net to investor: ₹22 lakh − ₹4 lakh = ₹18 lakh = 18% net return. Year 2: portfolio returns -10%, ending value ₹1.04 crore (down from ₹1.22 crore high-water mark). Management fee: 2% of ₹1.13 crore (avg AUM) = ₹2.26 lakh. Performance fee: zero (below high-water mark). Year 3: portfolio returns 30%, gross value back to ₹1.35 crore. The Manager must first earn back the dip from ₹1.22 crore to ₹1.04 crore (i.e., reach ₹1.22 crore high-water mark) before any new performance fee. Once the portfolio crosses ₹1.22 crore, the performance fee applies only on the gain above ₹1.22 crore — i.e., 15% × (₹1.35 crore − ₹1.22 crore) = ₹1.95 lakh. The investor reviews this calculation each year as part of the audited statement.',
        keyPoints: [
          'PMS fees combine three components: fixed management, optional performance, direct expenses.',
          'Fixed management fee: typically 1.5-2.5% of AUM per annum.',
          'Performance fee: typically 10-20% over a 8-12% hurdle, with high-water mark.',
          'SEBI mandates a "fixed-fee only" option must be offered alongside any performance-fee option.',
          'Total all-in cost: 2.5-4.5% per annum, materially higher than mutual fund TER.',
          'High-water mark prevents double-charging on recovered drawdowns.',
          'All fees and expenses are disclosed in the Disclosure Document and audited statements.',
        ],
        faq: [
          {
            question: 'Can I negotiate PMS fees?',
            answer:
              'Yes — fee negotiation is common at higher ticket sizes. A typical PMS may have a published fee card of 2% fixed plus 15% performance, but for ticket sizes above ₹2 crore, negotiation to 1.75% / 12% is common. For ₹5 crore+ tickets, further negotiation is possible. Trustner\'s Relationship Manager handles fee negotiation on the investor\'s behalf as part of the empanelment process.',
          },
          {
            question: 'Are PMS fees tax-deductible against capital gains?',
            answer:
              'PMS fees paid out of the demat are generally not deductible against capital gains under current Indian tax rules. Brokerage and STT directly tied to a specific transaction reduce the cost basis or sale proceeds for capital gains computation. Always consult your tax advisor for the precise treatment in your situation.',
          },
          {
            question: 'What is a "high-water mark" and why does it matter?',
            answer:
              'High-water mark is the highest portfolio value at which a performance fee was previously paid. It ensures that if the portfolio falls and then recovers, the Manager only earns a new performance fee on gains above the previous peak — not on the recovery to the peak. This protects the investor from paying performance fees twice on the same gains.',
          },
          {
            question: 'Should I choose fixed-fee only or fixed-plus-performance?',
            answer:
              'It depends on your view of the Manager\'s skill. If you believe the Manager will materially outperform a benchmark, fixed-plus-performance can be more cost-effective in good years (you pay only when they deliver). If you prefer cost predictability, fixed-only is simpler. Trustner\'s research framework includes back-tested fee comparison across both structures for each empanelled PMS.',
          },
        ],
        mcqs: [
          {
            question: 'Typical fixed management fee in an Indian Discretionary PMS is approximately:',
            options: ['0.5-1% p.a.', '1.5-2.5% p.a.', '5-7% p.a.', '10-12% p.a.'],
            correctAnswer: 1,
            explanation:
              'A typical Discretionary PMS in India charges 1.5-2.5% per annum as the fixed management fee, calculated on average AUM and deducted periodically from the demat account.',
          },
          {
            question: 'What is the purpose of a "high-water mark" provision?',
            options: [
              'It sets the minimum investment size',
              'It prevents the Manager from earning performance fees twice on the same recovered gains',
              'It defines the SEBI compliance threshold',
              'It is the maximum drawdown allowed',
            ],
            correctAnswer: 1,
            explanation:
              'High-water mark ensures that after a portfolio drawdown and subsequent recovery, the Manager earns performance fees only on gains above the previous peak — protecting the investor from paying twice on the same recovery.',
          },
          {
            question: 'Total annual all-in cost of a typical Indian PMS is:',
            options: [
              '0.5%-1.5% p.a. (similar to mutual funds)',
              '2.5%-4.5% p.a.',
              '7%-9% p.a.',
              'Less than 0.5% p.a.',
            ],
            correctAnswer: 1,
            explanation:
              'Total annual cost (management + performance + brokerage + custodian + audit) typically ranges 2.5-4.5% p.a. — materially higher than a mutual fund\'s 0.5-2.0% TER. Higher costs are justified only if the Manager delivers commensurate alpha.',
          },
        ],
        summaryNotes: [
          'Fees: fixed (1.5-2.5%) + performance (10-20% over hurdle) + direct expenses.',
          'High-water mark is critical for fair performance-fee accrual.',
          'Total cost: 2.5-4.5% p.a. — higher than MF, must be justified by alpha.',
          'Fees can be negotiated at higher ticket sizes.',
        ],
        relatedTopics: ['what-is-pms', 'pms-types', 'pms-vs-mf-vs-aif'],
      },
    },

    // ─── 4. PMS vs MF vs AIF ───
    {
      id: 'pms-vs-mf-vs-aif',
      title: 'PMS vs Mutual Funds vs AIF — Choosing the Right Structure',
      slug: 'pms-vs-mf-vs-aif',
      content: {
        definition:
          'The structural choice between mutual funds, PMS, and AIF depends on the investor\'s ticket size, asset class focus, regulatory access, transparency preferences, and tax positioning. Each vehicle is designed for a distinct wealth tier and strategic objective.',
        explanation:
          'The simplest way to think about this: mutual funds democratise investing (₹500 SIP minimum), PMS personalises it (₹50 lakh minimum, securities in your demat), and AIF accesses asset classes and strategies that the regulated public-securities universe cannot reach (₹1 crore minimum). Mutual funds are right for the vast majority of Indian investors. They offer daily liquidity, professional management, full SEBI regulation, and the ability to construct a diversified portfolio with as little as ₹2,500 spread across five funds. The trade-off is regulatory simplicity — mandatory diversification rules, no shorting, limited derivative use, no concentrated bets. PMS is right for HNIs (typically ₹2 crore+ liquid wealth) who want concentrated, conviction-led equity portfolios held in their own name with full transparency on holdings. The minimum is ₹50 lakh; the operational complexity (separate demat, transaction-by-transaction tax, individual reporting) is real. The Manager runs a 15-30 stock concentrated portfolio and can pursue strategies like multi-cap concentration, long-only growth, or value-tilt that are difficult to express through mutual funds. AIF is right for Ultra-HNIs (typically ₹5 crore+ liquid wealth) who want exposure to private markets (venture capital, private equity, private credit), hedge-style long-short, real estate, or structured strategies. The minimum is ₹1 crore. AIF is the only legal Indian vehicle for many of these strategies. The trade-off is illiquidity (most Cat I and II AIFs are closed-ended with 5-10 year horizons), limited transparency (quarterly NAV at best, often just annual), and complex tax treatment that requires specialised CA support. The right structure follows the strategic need. An investor who wants a long-only large-cap equity portfolio should likely use a mutual fund — paying for PMS or AIF to access the same exposure is wasteful. An investor who wants a concentrated multi-cap or sector-rotation portfolio managed by a high-conviction manager should consider PMS. An investor who wants private credit exposure to mid-market companies should look at Cat II AIF.',
        realLifeExample:
          'Six investors at six wealth levels make six different correct choices. Rohan (₹50,000/month income, ₹3 lakh savings): pure mutual fund SIPs. Priya (₹40 lakh liquid wealth): mutual funds + a small SIF if she crosses the ₹50 lakh threshold. Sandeep (₹2 crore liquid wealth): mutual funds (60%) + one PMS allocation of ₹50 lakh + small SIF allocation. Vikram (₹6 crore liquid wealth): MFs (40%) + two PMS allocations (₹100 lakh) + one Cat II AIF (₹1 crore for private credit) + some SIF and liquid. Megha (₹15 crore liquid wealth, family business): MFs (₹3 crore for liquidity) + diversified PMS (₹6 crore across three managers) + Cat II AIF (₹2 crore) + Cat III hedge fund AIF (₹2 crore) + cash and gold (₹2 crore). Krishnan (₹100 crore family office): bespoke advisory + AIFs across categories + direct equity through PMS + alternative assets including offshore. Each layer of wealth unlocks more vehicles and more strategic flexibility — but also requires more sophisticated decision-making, more advisor support, and more diligence on each manager.',
        keyPoints: [
          'Mutual fund: ₹500 SIP, daily liquid, mass-market, regulated against concentration.',
          'PMS: ₹50 lakh, securities in demat, concentrated 15-30 stock portfolio, customisable.',
          'AIF: ₹1 crore, accesses private markets and hedge strategies, three SEBI categories.',
          'Choice = ticket size + strategic need + transparency preference + tax positioning + liquidity tolerance.',
          'For most Indian investors below ₹2 crore liquid wealth, mutual funds (with optional SIF) are the right answer.',
          'Above ₹2 crore: blend MF + PMS. Above ₹5 crore: add AIFs.',
          'Each structure complements rather than replaces — a sophisticated portfolio uses several layers.',
        ],
        faq: [
          {
            question: 'Should I exit mutual funds once I qualify for PMS?',
            answer:
              'No. Even at ₹2 crore+ liquid wealth, mutual funds remain the right vehicle for liquidity, daily NAV transparency, and the lowest-cost diversified core. PMS is added as a sophistication layer, typically alongside an existing 50-70% mutual fund allocation. Replacing the entire mutual fund book with PMS would create concentration risk and operational complexity without commensurate benefit.',
          },
          {
            question: 'Is AIF tax better or worse than PMS?',
            answer:
              'It depends on the AIF category. Cat I and II AIFs receive pass-through tax treatment (the AIF itself is not taxed; investors pay tax on their share of returns at their personal slab rate or capital gains rate). Cat III AIFs are taxed at the AIF level. PMS taxation depends on each individual transaction in the demat account — capital gains on each sale. Both are operationally heavier than mutual funds, which have a single tax event at redemption.',
          },
          {
            question: 'Can the same Portfolio Manager run both PMS and AIF?',
            answer:
              'Yes. Many top Portfolio Managers in India run a Discretionary PMS strategy AND a Cat III AIF (or Cat II AIF) using overlapping research processes but different mandates. The PMS suits HNIs at ₹50 lakh; the AIF suits UHNIs at ₹1 crore+ and may use more aggressive instruments (leverage, derivatives, shorting) that PMS cannot.',
          },
          {
            question: 'Why is AIF illiquid?',
            answer:
              'Most AIFs (especially Cat I and II) invest in private companies, private credit, real estate, or other illiquid asset classes. The fund\'s structure mirrors the underlying liquidity — typically 5-10 year closed-ended life with periodic distributions. Cat III AIFs are often open-ended with quarterly redemption windows but can also have lock-in periods. Investors must match their AIF allocation to their liquidity needs.',
          },
        ],
        mcqs: [
          {
            question:
              'Which structure is most appropriate for an investor with ₹40 lakh liquid wealth seeking diversified equity exposure?',
            options: ['Allocate full ₹40 lakh to a single PMS', 'Wait for ₹1 crore and use AIF', 'Diversified mutual funds', 'Cat III hedge fund AIF'],
            correctAnswer: 2,
            explanation:
              'At ₹40 lakh liquid wealth, mutual funds are the right vehicle. The investor does not yet meet PMS or AIF minimums, and even when they do, mutual funds remain the recommended diversified core.',
          },
          {
            question: 'Cat II AIFs typically receive what tax treatment?',
            options: [
              'Tax at the AIF level',
              'Pass-through to investors at their slab/capital gains rate',
              'GST only',
              'No tax',
            ],
            correctAnswer: 1,
            explanation:
              'Cat I and Cat II AIFs receive pass-through tax treatment — the AIF itself is not taxed; investors pay tax on their share of income at their personal rate. Cat III AIFs are taxed at the AIF level.',
          },
          {
            question: 'In what scenario would AIF be the right choice rather than PMS?',
            options: [
              'When the investor has ₹50 lakh and wants concentrated equity exposure',
              'When the investor wants private credit exposure to mid-market companies',
              'When the investor wants daily liquidity',
              'When the investor wants the lowest expense ratio',
            ],
            correctAnswer: 1,
            explanation:
              'AIF is the right structure when the strategy requires access to private markets (private credit, venture capital, private equity, real estate) or hedge strategies that PMS and mutual funds cannot run.',
          },
        ],
        summaryNotes: [
          'MF (₹500), PMS (₹50L), AIF (₹1Cr) — three wealth tiers, three different strategic uses.',
          'Vehicles complement each other; sophisticated portfolios use multiple layers.',
          'Mutual funds remain the diversified core even for HNIs.',
          'PMS adds concentration and customisation; AIF adds access to private markets and hedge strategies.',
        ],
        relatedTopics: ['what-is-pms', 'pms-types', 'pms-fees', 'aif-foundation'],
      },
    },

    // ─── 5. Who Should Invest in PMS ───
    {
      id: 'pms-who-should-invest',
      title: 'Who Should Invest in a PMS',
      slug: 'pms-who-should-invest',
      content: {
        definition:
          'A PMS is suitable for investors who comfortably exceed the ₹50 lakh minimum, have a total liquid wealth of approximately ₹2 crore or more (so the PMS allocation does not over-concentrate the portfolio), are willing to accept transaction-by-transaction tax reporting, and have a clear strategic reason to seek concentrated, customised equity management beyond what mutual funds and SIFs offer.',
        explanation:
          'The single most common PMS mis-sale risk is identical to the SIF mis-sale risk: putting an investor with ₹70 lakh of total liquid wealth into a PMS — that ₹50 lakh allocation absorbs 70%+ of their portfolio in one strategy. The right wealth threshold for PMS is approximately ₹2 crore liquid (so a ₹50 lakh PMS allocation is 25% of the portfolio) and ideally higher (₹3-5 crore) so multiple PMS managers can be diversified across. Operational readiness is the second filter. A PMS requires the investor to handle quarterly portfolio statements, transaction-by-transaction tax computation, demat account management, and direct corporate-action receipts. This requires either a willing investor (often founders/CXOs comfortable with operational complexity) or a robust support structure (a wealth manager and a CA partner). Strategic clarity is the third filter. A PMS should solve a specific problem — concentrated multi-cap exposure, sector-rotation strategies, or access to a particular Manager\'s skill — that the investor cannot get from a mutual fund or SIF. If the same exposure is available through a flexi-cap or multi-cap mutual fund at 0.6% TER versus 3% all-in PMS cost, the PMS allocation is not justified. Trustner\'s framework for PMS recommendation involves a portfolio audit, identification of the strategic gap, and surfacing of 1-2 PMS candidates that match the gap. A pre-empanelment review of the Manager\'s 5-year track record, strategy consistency, fee structure, and operational quality is conducted before any PMS is added to Trustner\'s recommendation list.',
        realLifeExample:
          'Three case studies that highlight when PMS does and does not fit. Case 1 (good fit): Vivek, 50, with ₹4 crore liquid wealth, is a senior tech executive. He has been investing through mutual funds for 20 years and now seeks concentrated Indian small-mid cap exposure managed by a manager with a strong long-only growth track record. He allocates ₹50 lakh to a small-mid cap PMS, keeping ₹3.5 crore in mutual funds and liquid funds. The PMS gives him concentrated exposure (the manager runs only 22 stocks, versus 80+ in his small-cap mutual fund); the ₹50 lakh is 12.5% of his liquid wealth — well-diversified. Case 2 (poor fit): Anjali, 38, with ₹85 lakh liquid wealth, was sold a PMS at ₹50 lakh by an aggressive distributor. The allocation absorbs 59% of her wealth. After the first 6 months, the PMS underperforms the broader market; she becomes anxious and considers redeeming. The mis-sale: PMS is structurally inappropriate at this wealth level. Diversified mutual funds (a flexi-cap, a multi-cap, a small-cap fund) would have given comparable exposure with materially better diversification and lower stress. Case 3 (sophisticated fit): Sanjay, 55, with ₹15 crore liquid wealth and a family business, runs ₹3 crore in mutual funds, ₹2 crore across two PMS managers (one large-cap quality, one small-mid cap growth), ₹1 crore in a Cat II AIF for private credit, and the rest in liquid funds and gold. His PMS allocation of ₹2 crore is 13% of his liquid wealth and is split across two managers to diversify manager risk. This is the operationally and strategically correct PMS posture for an HNI.',
        keyPoints: [
          'PMS is suitable for investors with approximately ₹2 crore+ liquid wealth (so ₹50 lakh allocation is ≤25%).',
          'Investors below ₹2 crore liquid wealth should generally stay with mutual funds (and optionally SIF).',
          'Operational readiness for transaction-by-transaction tax and direct corporate-action handling is essential.',
          'Each PMS allocation should solve a specific strategic gap — concentration, customisation, or unique manager skill.',
          'Recommended PMS allocation: 10-25% of liquid wealth, ideally split across 2-3 managers above ₹3 crore liquid.',
          'Pre-empanelment diligence: 5-year track record, strategy consistency, fee structure, operational quality.',
        ],
        faq: [
          {
            question: 'I have ₹70 lakh in savings. Should I move ₹50 lakh into a PMS?',
            answer:
              'No. This is a textbook PMS mis-sale risk. A ₹50 lakh allocation at the ₹70 lakh wealth level concentrates 71% of your liquid corpus into a single strategy. Stay with diversified mutual funds, and revisit PMS only when liquid wealth comfortably exceeds ₹2 crore.',
          },
          {
            question: 'Should I split my PMS allocation across multiple managers?',
            answer:
              'For investors with liquid wealth above ₹3 crore, splitting the PMS allocation across 2-3 managers reduces single-manager risk. For example, an investor with a ₹100 lakh PMS budget might allocate ₹50 lakh to a quality-large-cap PMS and ₹50 lakh to a small-mid cap growth PMS. Below ₹3 crore liquid wealth, a single PMS allocation is more practical.',
          },
          {
            question: 'How long should I commit to a PMS before evaluating performance?',
            answer:
              'Equity PMS strategies need a minimum 3-year evaluation horizon, ideally 5 years, to assess through a market cycle. Reviewing performance every 6-12 months is fine for monitoring, but redemption decisions based on under-3-year underperformance are typically premature. Align your PMS commitment with the strategy\'s natural evaluation window.',
          },
          {
            question: 'How does Trustner select which PMS to recommend?',
            answer:
              'Trustner\'s research framework evaluates: (a) the Manager\'s 5-year strategy-consistent track record; (b) the AMC\'s ownership and risk-management infrastructure; (c) the strategy\'s differentiation versus available mutual funds; (d) fee structure and negotiation flexibility; (e) operational quality (timely statements, responsive Relationship Manager); (f) tax positioning. Trustner surfaces the top 1-2 candidates aligned to the investor\'s identified portfolio gap.',
          },
        ],
        mcqs: [
          {
            question:
              'Which investor profile is the LEAST suitable candidate for a PMS allocation?',
            options: [
              'A 50-year-old with ₹3 crore liquid wealth, allocating ₹50 lakh to one PMS',
              'A 38-year-old with ₹85 lakh liquid wealth, considering ₹50 lakh in a PMS',
              'A 55-year-old with ₹6 crore, splitting ₹100 lakh across two PMS managers',
              'A 60-year-old with ₹10 crore, allocating ₹150 lakh across three PMS managers',
            ],
            correctAnswer: 1,
            explanation:
              'The 38-year-old with ₹85 lakh liquid wealth would be putting 59% of her portfolio into a single PMS — over-concentration. Diversified mutual funds are the right vehicle until liquid wealth comfortably exceeds ₹2 crore.',
          },
          {
            question: 'What is the minimum recommended evaluation horizon for an equity PMS strategy?',
            options: ['3 months', '12 months', '3 years (ideally 5)', 'Whenever the market falls'],
            correctAnswer: 2,
            explanation:
              'Equity PMS strategies need a minimum 3-year window, ideally 5 years, to be evaluated through a market cycle. Redemption decisions based on under-3-year underperformance are typically premature.',
          },
          {
            question:
              'For an investor with ₹4 crore liquid wealth, what is the recommended PMS allocation as a percentage?',
            options: ['Up to 5%', '10-25%', '70-80%', 'Whatever the Manager pitches'],
            correctAnswer: 1,
            explanation:
              'The recommended PMS allocation is 10-25% of liquid wealth, ensuring diversification across mutual funds, PMS, AIF (if applicable), and liquid. Splitting across 2-3 managers above ₹3 crore liquid wealth is also recommended.',
          },
        ],
        summaryNotes: [
          'PMS suits investors with ₹2 crore+ liquid wealth — not ₹70 lakh.',
          'Each PMS allocation must solve a specific strategic gap.',
          'Recommended allocation: 10-25% of liquid wealth.',
          'Diligence on Manager\'s 5-year track record and strategy consistency is essential.',
          'Trustner\'s pre-empanelment framework filters managers before recommendations.',
        ],
        relatedTopics: ['what-is-pms', 'pms-fees', 'pms-vs-mf-vs-aif'],
      },
    },
  ],
};
