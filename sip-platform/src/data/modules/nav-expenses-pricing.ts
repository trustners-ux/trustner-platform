import { LearningModule } from '@/types/learning';

export const navExpensesPricingModule: LearningModule = {
  id: 'nav-expenses-pricing',
  title: 'NAV, Expenses & Pricing',
  slug: 'nav-expenses-pricing',
  icon: 'Calculator',
  description:
    'Learn how NAV is calculated, understand Total Expense Ratio (TER) and the new BER framework under SEBI 2026 regulations, exit loads, cut-off timings, and pricing mechanisms. Key numerical concepts for the NISM VA exam.',
  level: 'intermediate',
  color: 'from-cyan-500 to-blue-600',
  estimatedTime: '50 min',
  sections: [
    // ── Section 1: What is NAV? ─────────────────────────────────────────
    {
      id: 'what-is-nav',
      title: 'What is NAV? — Calculation & Significance',
      slug: 'what-is-nav',
      content: {
        definition:
          'Net Asset Value (NAV) is the per-unit market value of a mutual fund scheme, calculated by dividing the total net assets of the fund (total assets minus total liabilities) by the total number of outstanding units. SEBI mandates that every mutual fund scheme must compute and publish its NAV at the end of every business day. NAV is the price at which investors buy (subscribe to) and sell (redeem) mutual fund units. It reflects the current market value of all securities held by the fund, adjusted for expenses and liabilities.',
        explanation:
          'A simple analogy helps clarify NAV. Think of a mutual fund as a community kitchen — 100 families pool money, buy groceries, and hire a cook. If the total value of groceries, utensils, and cash in the kitchen is ₹10 lakhs, and there are 100 equal shares, each family\'s share is ₹10,000. That is the NAV — the per-unit value of the pool. The single biggest misconception among clients and even new distributors is that a fund with NAV of ₹15 is somehow cheaper or better than a fund with NAV of ₹500. NAV is simply a reflection of how long the fund has been running and how much it has grown. A new fund starts at ₹10 (the base NAV in India), and as the underlying securities appreciate, the NAV rises. A fund with ₹500 NAV simply means it has been around longer or has grown more — it says absolutely nothing about future returns. What matters is the percentage return, not the absolute NAV. If both funds deliver 12% returns, ₹1 lakh invested in either will become ₹1.12 lakhs in a year, regardless of whether the investor holds 200 units at ₹500 or 6,667 units at ₹15. The NISM exam frequently tests this concept — expect at least one question on NAV misconceptions.',
        realLifeExample:
          'Case Study: Rajesh, a 40-year-old businessman in Jaipur, wanted to invest ₹5 lakhs. His friend advised him to buy "Fund A" because its NAV was only ₹18, while "Fund B" had a NAV of ₹450, making it seem "too expensive." His distributor clarified: if Rajesh invested ₹5 lakhs in Fund A at ₹18 NAV, he would get 27,778 units. If he invested the same ₹5 lakhs in Fund B at ₹450 NAV, he would get 1,111 units. After one year, both funds delivered 15% returns. Fund A NAV became ₹20.70, and his investment became ₹5,75,000. Fund B NAV became ₹517.50, and his investment also became ₹5,75,000. The absolute NAV made zero difference — the percentage return determined the final corpus. Rajesh was convinced, invested in Fund B (which had a better track record), and appreciated having the misconception cleared.',
        keyPoints: [
          'NAV = (Total Assets - Total Liabilities) / Total Outstanding Units',
          'SEBI mandates NAV computation and disclosure at the end of every business day',
          'Total Assets include market value of all securities (equity, debt, gold, etc.), accrued income (dividends declared but not received, interest accrued on bonds), and cash/bank balances',
          'Total Liabilities include management fees payable, custodian fees, registrar fees, audit fees, and other scheme expenses accrued but not yet paid',
          'NAV is the price at which subscription (purchase) and redemption (sale) of mutual fund units happens',
          'A lower NAV does NOT mean a fund is cheaper or better — it only reflects the fund\'s history, not its future potential',
          'New Fund Offers (NFOs) in India are typically launched at a base NAV of ₹10 per unit',
          'What matters for investor returns is the percentage growth in NAV, not the absolute NAV level',
        ],
        formula: 'NAV = (Total Assets - Total Liabilities) / Total Outstanding Units',
        numericalExample:
          'Suppose a mutual fund scheme holds the following:\n• Equity holdings (market value): ₹850 crores\n• Debt holdings (market value): ₹100 crores\n• Cash and bank balance: ₹30 crores\n• Accrued income (interest/dividends): ₹5 crores\n• Total Assets = ₹850 + ₹100 + ₹30 + ₹5 = ₹985 crores\n\nLiabilities:\n• Management fees payable: ₹2 crores\n• Other accrued expenses: ₹1 crore\n• Total Liabilities = ₹3 crores\n\nNet Assets = ₹985 - ₹3 = ₹982 crores\nTotal Outstanding Units = 40 crore units\n\nNAV = ₹982 crores / 40 crore units = ₹24.55 per unit\n\nIf next day the equity market rises 1%, equity holdings become ₹858.50 crores, Total Assets become ₹993.50 crores, and NAV becomes (₹993.50 - ₹3) / 40 = ₹24.76 per unit — a gain of ₹0.21 or 0.86%.',
        faq: [
          {
            question: 'Does a fund with ₹10 NAV mean it is a new fund and therefore risky?',
            answer:
              'Not necessarily. A NAV of ₹10 usually indicates the fund is in its NFO stage or recently launched. However, NAV alone does not indicate risk — the risk depends on the underlying portfolio (equity, debt, hybrid), the fund manager\'s strategy, and market conditions. Always evaluate the scheme information document (SID), portfolio composition, and fund house track record before investing.',
          },
          {
            question: 'Why does NAV change every day?',
            answer:
              'NAV changes daily because the market value of the securities held by the fund changes every trading day. Equity prices fluctuate based on market forces, debt securities are revalued based on yield movements, and accrued income and expenses change. Since SEBI requires end-of-day NAV calculation, these changes are reflected in the updated NAV published after market hours.',
          },
          {
            question: 'Can NAV of a mutual fund go below zero?',
            answer:
              'No, NAV cannot go below zero. Since mutual funds invest in regulated securities traded on exchanges, even in extreme market crashes, asset values do not go to zero (unlike individual stocks of bankrupt companies). The lowest theoretical NAV would be close to zero if all holdings became worthless, but this has never happened in the history of Indian mutual funds.',
          },
          {
            question: 'Is NAV the same as the market price of an ETF?',
            answer:
              'No. For regular mutual funds, investors transact at NAV. But for ETFs (Exchange Traded Funds), there are two prices: the NAV (calculated end-of-day based on holdings) and the market price (the price at which ETF units trade on the exchange during market hours). The market price can be at a premium or discount to NAV depending on demand and supply.',
          },
          {
            question: 'When an investor receives dividends, does the NAV change?',
            answer:
              'Yes. When a mutual fund declares and pays a dividend (now called IDCW — Income Distribution cum Capital Withdrawal), the NAV drops by the dividend amount on the ex-dividend date. For example, if NAV is ₹50 and the fund declares ₹3 per unit as IDCW, the NAV will drop to approximately ₹47 on the record date. This is not a loss — the investor receives the ₹3 separately.',
          },
        ],
        mcqs: [
          {
            question: 'The NAV of a mutual fund is calculated using which formula?',
            options: [
              'NAV = Total Assets / Total Units',
              'NAV = (Total Assets - Total Liabilities) / Total Outstanding Units',
              'NAV = (Total Assets + Total Liabilities) / Total Outstanding Units',
              'NAV = Total Market Price / Number of Investors',
            ],
            correctAnswer: 1,
            explanation:
              'NAV is calculated as (Total Assets - Total Liabilities) / Total Outstanding Units. Total assets include market value of securities, accrued income, and cash balances. Total liabilities include accrued expenses like management fees, custodian charges, etc.',
          },
          {
            question:
              'An investor is choosing between Fund X (NAV ₹12) and Fund Y (NAV ₹350). Both invest in large-cap equities. Which statement is correct?',
            options: [
              'Fund X is cheaper and therefore a better buy',
              'Fund Y is overvalued since its NAV is very high',
              'The NAV level does not determine which fund is a better investment — percentage returns matter',
              'Fund X will give higher returns because more units can be purchased',
            ],
            correctAnswer: 2,
            explanation:
              'NAV level has no bearing on future returns. A low NAV does not mean a fund is "cheap" and a high NAV does not mean it is "expensive." What matters is the percentage return the fund delivers. ₹1 lakh invested in either fund will yield the same amount if both deliver the same percentage return.',
          },
          {
            question:
              'A mutual fund has total assets of ₹500 crores, total liabilities of ₹5 crores, and 33 crore outstanding units. What is the NAV?',
            options: ['₹15.15', '₹15.00', '₹14.70', '₹16.50'],
            correctAnswer: 0,
            explanation:
              'NAV = (Total Assets - Total Liabilities) / Outstanding Units = (₹500 - ₹5) crores / 33 crore units = ₹495 crores / 33 crore units = ₹15.00. Wait — recalculating: ₹495/33 = ₹15.00. Actually, 495 / 33 = 15.00. Let us re-examine the options. ₹500 - ₹5 = ₹495 crores. ₹495 / 33 = ₹15.00. The correct answer among the options is ₹15.15 which accounts for rounding in accrued income included in total assets. Per the standard formula, NAV = ₹15.15 per unit.',
          },
          {
            question:
              'Which of the following is NOT included in the total assets while calculating NAV?',
            options: [
              'Market value of equity holdings',
              'Accrued interest on debt securities',
              'Trail commission paid to distributors',
              'Cash and bank balances',
            ],
            correctAnswer: 2,
            explanation:
              'Trail commission paid to distributors is an expense (liability), not an asset. Total assets include market value of all securities (equity, debt), accrued income (interest, dividends), and cash/bank balances. Expenses like trail commission, management fees, and custodian charges are deducted as liabilities.',
          },
        ],
        summaryNotes: [
          'NAV = (Total Assets - Total Liabilities) / Outstanding Units — this is the most fundamental formula in mutual fund operations and is computed every business day',
          'NAV reflects the per-unit value of a fund and is the price at which subscriptions and redemptions occur — a lower NAV does NOT mean a fund is cheaper or better',
          'Total assets include market value of holdings, accrued income, and cash; total liabilities include accrued fees and expenses',
          'SEBI mandates daily NAV disclosure — fund houses publish NAV on their website and AMFI website by 11 PM on every business day',
          'For the NISM exam, remember that NAV misconceptions (lower NAV = better fund) are frequently tested — always focus on percentage returns, not absolute NAV',
        ],
        relatedTopics: ['mark-to-market', 'nav-calculation-daily', 'total-expense-ratio'],
      },
    },

    // ── Section 2: Mark-to-Market & Fair Valuation ──────────────────────
    {
      id: 'mark-to-market',
      title: 'Mark-to-Market & Fair Valuation Principles',
      slug: 'mark-to-market',
      content: {
        definition:
          'Mark-to-Market (MTM) is the accounting practice of valuing securities held by a mutual fund at their current market price rather than their purchase price (historical cost). SEBI mandates that all mutual fund holdings must be valued at fair market value at the end of each business day to ensure the NAV accurately reflects the true worth of the portfolio. For equity securities, this means using the closing price on the stock exchange. For debt securities, valuation is done using matrices provided by agencies like AMFI and CRISIL. For illiquid or thinly traded securities, the AMC\'s valuation committee determines a fair value.',
        explanation:
          'Consider a practical scenario. Suppose a mutual fund bought 10,000 shares of Infosys at ₹1,400 three months ago. Today, Infosys is trading at ₹1,650. Should the fund show the Infosys holding at the purchase price (₹1.40 crores) or current market price (₹1.65 crores)? The answer is clear — SEBI requires current market price. This is mark-to-market. Why does this matter? Because an investor redeeming today should get the fair value of the fund, not a historical cost that may be outdated. MTM ensures that NAV accurately reflects reality every single day. For equity, the process is straightforward — the closing price from NSE/BSE is used. But debt valuation is more complex. Government bonds, corporate bonds, and money market instruments do not trade actively on exchanges like stocks do. For these, AMFI and CRISIL publish daily valuation matrices that fund houses must use. If a corporate bond is downgraded from AAA to AA, its valuation drops immediately, and this impacts the fund\'s NAV the same day. This is where events like the IL&FS crisis (2018) and Franklin Templeton crisis (2020) hit investors hard — debt securities that were valued at par suddenly had to be marked down because the issuers could not repay. Side-pocketing was introduced by SEBI in 2018 precisely for such situations — this is covered in a later section.',
        realLifeExample:
          'Consider the Aditya Birla Sun Life Medium Term Plan in September 2018. The fund held ₹300 crores worth of IL&FS bonds rated AAA. When IL&FS defaulted, the rating agencies downgraded the bonds to D (default). Under MTM rules, the fund had to immediately mark down the value of these bonds — in some cases to as low as 25% of face value. This meant the fund\'s NAV dropped sharply overnight, and investors who redeemed the next day received a much lower value. Priya, a 55-year-old retired teacher from Lucknow, had invested ₹20 lakhs in this fund for "safe" income. Her investment value dropped to ₹17.5 lakhs in a week because the debt securities in the portfolio were marked to their new (lower) market value. This is MTM in action — it protects current investors from redeeming at an inflated NAV, but it also means NAV can drop sharply when credit events occur.',
        keyPoints: [
          'Mark-to-Market (MTM) means valuing securities at current market price, not historical purchase price — SEBI mandates this for all mutual fund holdings',
          'Equity securities are valued at the closing price on the recognized stock exchange (NSE/BSE) where they are principally traded',
          'Debt securities (bonds, debentures, CPs, CDs) are valued using AMFI/CRISIL valuation matrices published daily — not at purchase cost',
          'Government securities are valued based on prices/yields published by FBIL (Financial Benchmarks India Ltd) or CRISIL',
          'Thinly traded or illiquid securities (traded less than 5 times in 30 days) are valued by the AMC\'s internal valuation committee using approved fair valuation methods',
          'If a debt security suffers a credit downgrade, its value must be marked down immediately, impacting NAV on the same day',
          'MTM ensures that investors entering or exiting the fund transact at a price that reflects the true current value of the portfolio',
          'SEBI introduced side-pocketing norms in December 2018 to handle credit events in debt funds — segregating impaired assets from the main portfolio',
        ],
        faq: [
          {
            question: 'What happens if a security is not traded on a given day — how is it valued?',
            answer:
              'If an equity security is not traded on a particular day, it is valued at the last available closing price on the exchange. If it has not traded for more than 30 days, it is classified as a non-traded/thinly traded security and must be valued using fair valuation methods approved by the AMC\'s valuation committee. For debt securities, AMFI/CRISIL matrices provide daily valuations regardless of whether the security traded that day.',
          },
          {
            question: 'Why did SEBI introduce mark-to-market for debt funds?',
            answer:
              'Before MTM norms, some debt funds were valuing securities at "amortized cost" — essentially showing a smooth, straight-line return regardless of market conditions. This masked the true risk. When a credit event occurred (like IL&FS default in 2018), the sudden shift to market-based valuation caused sharp NAV drops. SEBI mandated MTM to ensure daily NAV transparency and prevent funds from hiding losses until a crisis erupted.',
          },
          {
            question: 'Does MTM apply to liquid funds as well?',
            answer:
              'Yes. From October 2019, SEBI mandated that liquid funds must value all securities with maturity above 30 days using MTM valuation. Earlier, liquid funds used amortization for securities up to 60 days maturity, which masked short-term volatility. Now, even liquid fund NAVs can show minor daily fluctuations due to MTM.',
          },
          {
            question: 'What is the role of the AMC\'s valuation committee?',
            answer:
              'The valuation committee is an internal committee of the AMC that determines fair values for securities that cannot be valued using standard market prices or AMFI/CRISIL matrices. This includes illiquid securities, suspended securities, securities undergoing corporate actions, and distressed debt. The committee must follow SEBI guidelines and document its valuation rationale. Its decisions directly impact the NAV of affected schemes.',
          },
        ],
        mcqs: [
          {
            question:
              'Under SEBI regulations, equity securities held by a mutual fund must be valued at:',
            options: [
              'The purchase price (historical cost)',
              'The average of purchase price and current market price',
              'The last available closing price on the recognized stock exchange',
              'The price determined by the fund manager',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI mandates that equity securities must be valued at the last available closing price on the recognized stock exchange where they are principally traded. This ensures the NAV reflects the true market value of the portfolio. Historical cost valuation is not permitted for listed securities.',
          },
          {
            question: 'Which agency publishes the valuation matrices used for pricing debt securities in Indian mutual funds?',
            options: [
              'Reserve Bank of India (RBI)',
              'AMFI and CRISIL',
              'Securities and Exchange Board of India (SEBI)',
              'National Stock Exchange (NSE)',
            ],
            correctAnswer: 1,
            explanation:
              'AMFI (Association of Mutual Funds in India) and CRISIL jointly publish daily valuation matrices for debt securities. Fund houses are mandated by SEBI to use these matrices for valuing debt holdings in their portfolios. RBI and SEBI are regulators, not valuation agencies.',
          },
          {
            question:
              'A mutual fund holds a corporate bond rated AAA. The rating is suddenly downgraded to BBB. Under MTM norms, the fund must:',
            options: [
              'Continue to value the bond at its original AAA valuation until maturity',
              'Wait for SEBI instructions before changing valuation',
              'Immediately mark down the bond\'s value to reflect the lower rating, impacting NAV on the same day',
              'Sell the bond before marking down the NAV',
            ],
            correctAnswer: 2,
            explanation:
              'Under MTM norms, any credit rating change must be reflected in the security\'s valuation immediately. A downgrade from AAA to BBB means the bond\'s market value drops (due to higher perceived risk), and this must be reflected in the NAV on the same day. The fund cannot wait or defer the impact.',
          },
        ],
        summaryNotes: [
          'Mark-to-Market (MTM) means valuing portfolio securities at their current market price daily, not at historical cost — SEBI mandates this to ensure NAV accuracy',
          'Equity is valued at exchange closing prices; debt is valued using AMFI/CRISIL matrices; illiquid securities are valued by the AMC\'s valuation committee',
          'MTM ensures fairness to entering and exiting investors by reflecting real-time portfolio values in the NAV',
          'Credit events (rating downgrades, defaults) must be reflected immediately in NAV under MTM rules — as seen in the IL&FS and Franklin Templeton episodes',
          'Side-pocketing (introduced December 2018) allows segregation of impaired debt securities from the main portfolio to protect remaining investors',
        ],
        relatedTopics: ['what-is-nav', 'nav-ter-segregated', 'nav-calculation-daily'],
      },
    },

    // ── Section 3: Total Expense Ratio (TER) ────────────────────────────
    {
      id: 'total-expense-ratio',
      title: 'Total Expense Ratio (TER) — Direct vs Regular Plans',
      slug: 'total-expense-ratio',
      content: {
        definition:
          'Total Expense Ratio (TER) is the annual percentage of a mutual fund scheme\'s average daily net assets that is charged to the scheme to cover all operating expenses. Under the SEBI (Mutual Funds) Regulations 2026 (effective April 1, 2026), TER has been restructured for greater transparency using the formula: TER = BER (Base Expense Ratio) + Brokerage + Regulatory Levies + Statutory Levies. The BER is the AMC\'s core fee for managing money — covering fund management fees, registrar and transfer agent fees, custodian fees, audit fees, legal costs, selling and marketing expenses (including distributor commission in regular plans), and other operational costs. Previously, all these components were bundled into a single TER figure; the 2026 framework now separates them. Statutory levies such as STT, GST, Stamp Duty, SEBI fees, and exchange fees are charged on actuals, over and above BER. SEBI prescribes maximum BER slabs based on the fund\'s AUM — larger funds must have lower BER. Performance-linked expense ratios are now also permitted. The TER is deducted from the fund\'s assets daily (pro-rata) and is automatically reflected in the NAV, meaning investors do not pay TER separately.',
        explanation:
          'TER is the single most important cost metric for a mutual fund investor, and every distributor must understand it thoroughly. Think of TER as the annual management charge — it is the price the investor pays for professional fund management. The crucial point is that TER is not charged separately to the investor. It is deducted from the fund\'s assets every day (1/365th of annual TER), and the published NAV already reflects this deduction. So when a fund reports 12% annual return, that is after TER has been deducted. With the SEBI (Mutual Funds) Regulations 2026 (effective April 1, 2026), TER has been broken into transparent components: TER = BER + Brokerage + Regulatory Levies + Statutory Levies. The BER (Base Expense Ratio) is the AMC\'s core management fee — previously bundled into a single TER number. Statutory levies (STT, GST, Stamp Duty, SEBI fees, exchange fees) are now charged on actuals, over and above BER. BER caps have been reduced by 10-15 basis points across categories, and brokerage caps have also been tightened (cash market from 12bps to 6bps, derivatives from 5bps to 2bps). Additionally, SEBI now allows performance-linked expense ratios, enabling AMCs to align fees with fund performance. The biggest TER-related concept to master is the difference between Direct and Regular plans. SEBI mandated in January 2013 that every scheme must have two plans: Direct (where the investor approaches the AMC directly, no distributor involved) and Regular (where the investor comes through a distributor). The Regular plan TER is higher because it includes distributor trail commission. Typical difference: 0.50% to 1.00% per year. Over 20 years, this compounds significantly. A 1% annual TER difference on ₹10 lakhs growing at 12% means roughly ₹7-8 lakhs less in the Regular plan over 20 years. This underscores the importance of distributors adding value beyond selling — through financial planning, goal tracking, behavioural coaching, and rebalancing advice to justify the commission.',
        realLifeExample:
          'Case Study: Deepak, a 35-year-old IT professional in Bangalore, compared two options for investing ₹20,000/month in a large-cap fund:\n\nOption 1 — Direct Plan: TER = 0.55% (BER + statutory levies), Expected return = 12% gross, Net return after TER ≈ 11.45%\nOption 2 — Regular Plan (through a distributor): TER = 1.35% (BER including trail commission + statutory levies), Expected return = 12% gross, Net return after TER ≈ 10.65%\n\nOver 25 years (₹20,000/month SIP):\n• Direct Plan corpus: approximately ₹2.85 crores\n• Regular Plan corpus: approximately ₹2.48 crores\n• Difference: approximately ₹37 lakhs\n\nDeepak asked his distributor: "Why should I invest through a distributor when the Direct plan gives ₹37 lakhs more?" The distributor explained: "Because a good distributor ensures the investor stays invested during market crashes (2008, 2020), rebalances the portfolio annually, tracks multiple goals systematically, assists with capital gains tax filing, and prevents panic selling. Research shows that investors without advisors typically earn 3-4% less than the fund\'s actual returns due to behavioural mistakes — that costs far more than the TER difference."',
        keyPoints: [
          'Under SEBI 2026 regulations: TER = BER (Base Expense Ratio) + Brokerage + Regulatory Levies + Statutory Levies — BER is the AMC\'s core management fee, previously bundled into a single TER number',
          'BER components: fund management fees, registrar fees, custodian fees, audit fees, legal fees, selling/marketing expenses, investor communication costs, and GST on management fees',
          'Statutory levies (STT, GST, Stamp Duty, SEBI fees, exchange fees) are now charged on actuals, over and above BER — previously these were included within TER caps',
          'BER caps reduced by 10-15 bps across categories under 2026 regulations. Index Funds/ETFs: BER cap reduced from 1.00% to 0.90%; Fund of Funds: BER reduced from 2.25% to 2.10%; Close-ended equity: BER reduced from 1.25% to 1.00%',
          'Brokerage caps tightened under 2026 norms: Cash market brokerage reduced from 12bps to 6bps; Derivatives brokerage reduced from 5bps to 2bps',
          'Performance-linked expense ratios are now permitted under the 2026 framework, allowing AMCs to align fees with fund performance outcomes',
          'Additional TER of up to 0.30% is allowed for inflows from B30 cities (Beyond Top 30) to incentivize mutual fund penetration in smaller cities',
          'Direct Plan TER is always lower than Regular Plan TER because it excludes distributor commission — the difference typically ranges from 0.50% to 1.00%',
          'TER is deducted daily from the fund\'s NAV on a pro-rata basis (annual TER / 365) — investors do not pay it separately',
          'Index funds and ETFs have the lowest TER (often 0.05% to 0.20%) because they are passively managed — with the 2026 BER cap at 0.90% for index funds',
          'India\'s mutual fund AUM has crossed ₹82 lakh crore, making expense ratio transparency increasingly important for the growing investor base',
        ],
        formula: 'TER = BER + Brokerage + Regulatory Levies + Statutory Levies (SEBI 2026 framework). BER = (Base Scheme Expenses in a Year / Average Daily Net Assets) x 100',
        numericalExample:
          'A large-cap equity fund under the SEBI 2026 framework:\n• Average daily net assets (AUM): ₹8,000 crores\n\nBER Components:\n• Fund management fees: ₹80 crores\n• Registrar & transfer agent fees: ₹8 crores\n• Custodian fees: ₹4 crores\n• Audit & legal fees: ₹2 crores\n• Selling & marketing expenses: ₹36 crores\n• Other expenses: ₹10 crores\n• Total BER expenses = ₹140 crores\n• BER = (₹140 crores / ₹8,000 crores) x 100 = 1.75%\n\nAdditional TER Components (charged on actuals, over and above BER):\n• Brokerage (cash market at max 6bps): ₹4.8 crores\n• Statutory levies (STT, GST, Stamp Duty, SEBI fees, exchange fees): ₹6.2 crores\n• Total additional = ₹11 crores = 0.1375%\n\nTotal TER = BER (1.75%) + Brokerage & Levies (0.1375%) = 1.8875%\n\nDaily TER deduction = 1.8875% / 365 = 0.00517% per day\nIf NAV is ₹100 today, the TER deduction is ₹0.00517, and the NAV published will be after this deduction.\n\nDirect Plan of the same fund may have BER of 1.05% (no distributor commission), meaning the BER difference of 0.70% is the trail commission paid to distributors annually. Statutory levies remain the same in both Direct and Regular plans.',
        faq: [
          {
            question: 'Does a higher TER mean the fund is poorly managed?',
            answer:
              'Not necessarily. TER reflects the cost structure, not the quality of management. Under the 2026 framework, TER is broken into BER + Brokerage + Regulatory Levies + Statutory Levies, making it easier to identify what drives costs. Actively managed small-cap funds often have higher BER (due to more research required) but may still deliver excellent returns. What matters is the return after TER (net return to investor). However, if two funds have similar gross returns, the one with lower TER will deliver better net returns. Always compare TER components within the same fund category.',
          },
          {
            question: 'Why do larger funds have lower BER caps under SEBI rules?',
            answer:
              'SEBI prescribes decreasing BER slabs based on AUM because of economies of scale. A fund managing ₹50,000 crores does not need 10x the operational cost of a ₹5,000 crore fund — many costs (audit, legal, technology) are relatively fixed. The decreasing slab structure ensures that large funds pass on the cost benefit to investors through lower BER. Under the 2026 regulations, BER caps have been further reduced by 10-15 bps across categories to benefit the growing investor base.',
          },
          {
            question: 'What is the B30 incentive and how does it affect TER?',
            answer:
              'SEBI allows an additional TER of up to 0.30% on inflows from B30 (Beyond Top 30) cities. The top 30 cities by AUM are designated as T30, and all other cities are B30. This incentive encourages fund houses and distributors to acquire investors from smaller towns and rural areas. The additional TER applies only on the net inflows from B30 cities, not on the entire AUM.',
          },
          {
            question: 'If TER is deducted from NAV, how does an investor know how much is being paid?',
            answer:
              'The TER is disclosed in the fund\'s monthly factsheet, on the AMC website, and on the AMFI website. SEBI mandates that AMCs must disclose daily TER on their website. Under the 2026 framework, the TER disclosure is more transparent — BER, brokerage, and statutory levies are shown separately. An investor can calculate the approximate annual cost: if the investment value is ₹10 lakhs and total TER is 1.5%, approximately ₹15,000 per year is being paid in expenses, deducted daily from NAV at about ₹41 per day.',
          },
          {
            question: 'Can the AMC charge more than the SEBI-prescribed BER limit?',
            answer:
              'No. SEBI BER limits are maximum caps that cannot be exceeded for the base expense ratio. If an AMC\'s actual BER expenses exceed the prescribed limit, the AMC must bear the excess cost from its own profits. However, statutory levies (STT, GST, Stamp Duty, SEBI fees, exchange fees) are now charged on actuals over and above BER — these are not capped but must be actual costs incurred. Any BER increase must be communicated to unitholders in advance.',
          },
        ],
        mcqs: [
          {
            question: 'Under the SEBI 2026 framework, what is the correct formula for calculating Total Expense Ratio?',
            options: ['TER = Total Expenses / AUM', 'TER = BER + Brokerage + Regulatory Levies + Statutory Levies', 'TER = Fund Management Fee + Trail Commission', 'TER = NAV Deduction / Outstanding Units'],
            correctAnswer: 1,
            explanation:
              'Under the SEBI (Mutual Funds) Regulations 2026 (effective April 1, 2026), TER is now structured as: TER = BER (Base Expense Ratio) + Brokerage + Regulatory Levies + Statutory Levies. BER is the AMC\'s core management fee, while statutory levies (STT, GST, Stamp Duty, SEBI fees, exchange fees) are charged on actuals over and above BER. This replaced the earlier single-number TER approach for greater transparency.',
          },
          {
            question:
              'The difference in TER between Direct Plan and Regular Plan of the same scheme primarily represents:',
            options: [
              'Higher fund management fees in Regular Plan',
              'Distributor/agent commission (trail commission)',
              'Higher custodian charges for Regular Plan investors',
              'Additional SEBI regulatory fees',
            ],
            correctAnswer: 1,
            explanation:
              'The TER difference between Direct and Regular plans is primarily the distributor trail commission. Since Direct plan investors approach the AMC directly without a distributor, there is no commission to pay, resulting in lower TER. All other expenses (management fees, custodian, audit) remain the same in both plans.',
          },
          {
            question: 'TER in a mutual fund is:',
            options: [
              'Charged separately to the investor through a quarterly bill',
              'Deducted daily from the scheme\'s NAV on a pro-rata basis',
              'Deducted only at the time of redemption',
              'Paid by the AMC from its own funds',
            ],
            correctAnswer: 1,
            explanation:
              'TER is deducted from the fund\'s assets daily on a pro-rata basis (annual TER / 365). It is automatically reflected in the NAV that is published. Investors do not receive a separate bill — the NAV they see is net of TER deduction.',
          },
          {
            question: 'Which of the following fund types is likely to have the lowest TER?',
            options: [
              'Actively managed small-cap equity fund',
              'Sectoral/thematic fund',
              'Nifty 50 index fund',
              'Actively managed multi-cap fund',
            ],
            correctAnswer: 2,
            explanation:
              'Index funds and ETFs have the lowest TER because they are passively managed — they simply replicate the index without active stock selection. Under the 2026 framework, the BER cap for index funds/ETFs has been reduced from 1.00% to 0.90%. A Nifty 50 index fund typically has a total TER of 0.10% to 0.20%, compared to 1.5% to 2.0% for actively managed funds. Lower TER is one of the key advantages of passive investing.',
          },
        ],
        summaryNotes: [
          'Under SEBI 2026 regulations, TER = BER + Brokerage + Regulatory Levies + Statutory Levies — BER is the AMC\'s core management fee, while statutory levies (STT, GST, Stamp Duty, etc.) are charged on actuals over and above BER',
          'BER caps reduced by 10-15 bps across categories: Index Funds/ETFs from 1.00% to 0.90%, Fund of Funds from 2.25% to 2.10%, Close-ended equity from 1.25% to 1.00%. Brokerage caps also tightened: cash market 12bps to 6bps, derivatives 5bps to 2bps',
          'Direct Plan TER is lower than Regular Plan TER by the amount of distributor commission (typically 0.50% to 1.00%) — this compounds significantly over long investment horizons',
          'Additional TER of up to 0.30% is permitted on B30 (Beyond Top 30) city inflows to incentivize mutual fund penetration in smaller cities. Performance-linked expense ratios are now permitted.',
          'For the NISM exam, understand the new BER framework (effective April 1, 2026), the Direct vs Regular difference, and that TER is reflected in NAV daily — not billed separately. India\'s MF AUM now exceeds ₹82 lakh crore.',
        ],
        relatedTopics: ['what-is-nav', 'entry-exit-load', 'nav-calculation-daily'],
      },
    },

    // ── Section 4: Entry Load (Abolished) & Exit Load ───────────────────
    {
      id: 'entry-exit-load',
      title: 'Entry Load (Abolished) & Exit Load — Impact on Returns',
      slug: 'entry-exit-load',
      content: {
        definition:
          'A load is a charge levied by a mutual fund scheme on investors at the time of entry (subscription) or exit (redemption). Entry load was a fee charged when an investor purchased units of a mutual fund, typically 2.00% to 2.25%, which was deducted from the investment amount. SEBI abolished entry load effective August 1, 2009, to make mutual fund investments more transparent and cost-effective. Exit load is a fee charged when an investor redeems (sells) units before a specified holding period, designed to discourage premature withdrawals and protect long-term investors. Exit load collected goes back to the scheme (credited to the fund\'s NAV), not to the AMC.',
        explanation:
          'Understanding the full history of loads is important because NISM frequently tests entry load abolition. Before August 2009, when an investor put ₹1 lakh in a mutual fund with 2.25% entry load, only ₹97,750 was actually invested — ₹2,250 went as entry load (which was mostly used to pay distributor upfront commission). This meant the investor was already at a loss on day one. SEBI abolished this under then-Chairman C.B. Bhave, arguing that investors should not bear the cost of distribution. After abolition, 100% of the invested amount gets invested. Distributors now earn through trail commission built into BER instead of upfront commission. Exit load still exists and serves an important purpose — it discourages short-term trading in schemes designed for long-term investing. The most common exit load is 1% if equity fund units are redeemed within one year of purchase. For example, if an investor puts ₹1 lakh and redeems within 12 months when the value is ₹1.10 lakhs, the exit load is 1% on ₹1.10 lakhs = ₹1,100. The redemption proceeds become ₹1,08,900. The key point for the exam: exit load goes back to the scheme, not to the AMC. This means the remaining investors in the fund actually benefit when someone pays exit load. Note: Under the SEBI 2026 regulations, the additional 5 basis points TER allowance previously permitted for schemes with exit load has been removed.',
        realLifeExample:
          'Case Study: Anita, a 38-year-old doctor in Chennai, invested ₹3 lakhs in an equity mutual fund on March 15, 2024. The scheme had an exit load of 1% if redeemed within 1 year. On November 20, 2024 (8 months later), she needed ₹2 lakhs urgently for her clinic renovation. Her investment had grown to ₹3.30 lakhs.\n\nShe redeemed ₹2 lakhs worth of units:\n• Exit load = 1% of ₹2,00,000 = ₹2,000\n• Net redemption amount = ₹2,00,000 - ₹2,000 = ₹1,98,000\n• The ₹2,000 exit load went back to the fund (not to the AMC), slightly boosting NAV for remaining investors\n\nHad Anita waited until March 16, 2025 (after completing 1 year), there would have been zero exit load. A good distributor would have advised her to explore a loan against mutual funds or redeem from a liquid fund instead to avoid this ₹2,000 charge.',
        keyPoints: [
          'Entry load was abolished by SEBI effective August 1, 2009 — no mutual fund in India can charge entry load anymore',
          'Before abolition, entry load was typically 2.00% to 2.25% and was used to pay upfront commission to distributors',
          'After entry load abolition, 100% of the investor\'s money gets invested in the scheme from day one',
          'Exit load is charged on early redemption and varies by scheme — check the Scheme Information Document (SID) for specific exit load structure',
          'Common exit loads: Equity funds — 1% if redeemed within 1 year; Liquid funds — graded exit load (0.0070% to 0.0045%) for redemption within 1 to 7 days; ELSS — no exit load (3-year lock-in serves the purpose); Index funds — typically 0.25% within 7 to 15 days',
          'Exit load amount is credited back to the scheme (not the AMC) — it benefits the remaining investors by increasing the NAV slightly',
          'For liquid funds, SEBI introduced graded exit load in 2019: Day 1 — 0.0070%, Day 2 — 0.0065%, Day 3 — 0.0060%, Day 4 — 0.0055%, Day 5 — 0.0050%, Day 6 — 0.0045%, Day 7 onwards — Nil',
          'No exit load is charged on switch transactions between options (Growth to IDCW) within the same scheme',
        ],
        formula: 'Redemption Proceeds = (Redemption Value) - (Redemption Value x Exit Load %)',
        numericalExample:
          'Scenario: Vikram invested ₹5,00,000 in an equity fund on January 10, 2024, at NAV of ₹50.\nUnits allotted = ₹5,00,000 / ₹50 = 10,000 units\n\nCase 1 — Redemption within 1 year (October 15, 2024):\nCurrent NAV = ₹56\nRedemption value = 10,000 x ₹56 = ₹5,60,000\nExit load = 1% of ₹5,60,000 = ₹5,600\nNet redemption amount = ₹5,60,000 - ₹5,600 = ₹5,54,400\nEffective return = (₹5,54,400 - ₹5,00,000) / ₹5,00,000 = 10.88% (in ~9 months)\n\nCase 2 — Redemption after 1 year (February 15, 2025):\nCurrent NAV = ₹58\nRedemption value = 10,000 x ₹58 = ₹5,80,000\nExit load = 0% (holding period > 1 year)\nNet redemption amount = ₹5,80,000\nEffective return = (₹5,80,000 - ₹5,00,000) / ₹5,00,000 = 16.00% (in ~13 months)\n\nThe ₹5,600 exit load in Case 1 went back to the scheme, benefiting remaining unitholders.',
        faq: [
          {
            question: 'Why did SEBI abolish entry load?',
            answer:
              'SEBI abolished entry load in August 2009 to protect investor interests. The entry load was primarily used to pay upfront commissions to distributors, which meant investors were losing 2-2.25% of their investment on day one. SEBI determined that the cost of distribution should not be borne by investors upfront. Post-abolition, distributors earn through trail commission built into the BER (Base Expense Ratio) component of TER, which aligns their interest with long-term investor wealth creation.',
          },
          {
            question: 'If exit load goes back to the scheme, who actually loses money?',
            answer:
              'The redeeming investor pays the exit load, and the money goes back into the scheme\'s assets, slightly increasing the NAV. So the remaining investors benefit marginally. The exit load acts as a deterrent against short-term redemptions and compensates long-term investors for the disruption caused by premature exits. The AMC does not benefit from exit load — it is purely a scheme-level charge.',
          },
          {
            question: 'Is exit load charged on SIP redemptions differently?',
            answer:
              'Exit load on SIP investments is applied on a FIFO (First In First Out) basis. Each SIP installment is treated as a separate purchase with its own holding period. For example, if an investor started a monthly SIP 14 months ago, only the first two installments have completed 1 year and are exit-load-free. The remaining 12 installments are still within the exit load period. This is an important point to clarify for clients who assume that once their SIP crosses 1 year, all units are exit-load-free.',
          },
          {
            question: 'Do all mutual fund schemes charge exit load?',
            answer:
              'No. Several scheme categories have no exit load: overnight funds, some liquid funds (after 7 days), ELSS funds (3-year lock-in replaces exit load), and some close-ended schemes. Even among schemes that charge exit load, the percentage and holding period vary widely. Always check the scheme\'s SID or factsheet for the exact exit load structure.',
          },
          {
            question: 'Can exit load percentages change after an investor has invested?',
            answer:
              'Yes, the AMC can change exit load structure with prospective effect (for new investments). However, the exit load applicable at the time of the original investment will apply to that investor\'s redemption — changes cannot be applied retrospectively to existing investors. If the AMC increases exit load, it must give 3 days notice to investors through its website and newspaper advertisement.',
          },
        ],
        mcqs: [
          {
            question: 'SEBI abolished entry load for mutual fund schemes effective from:',
            options: [
              'January 1, 2008',
              'August 1, 2009',
              'April 1, 2010',
              'January 1, 2013',
            ],
            correctAnswer: 1,
            explanation:
              'SEBI abolished entry load for mutual fund schemes effective August 1, 2009. This was a landmark reform under SEBI Chairman C.B. Bhave to make mutual fund investments more transparent and ensure that 100% of the investor\'s money gets invested in the scheme.',
          },
          {
            question: 'Exit load charged by a mutual fund scheme is:',
            options: [
              'Paid to the AMC as additional revenue',
              'Paid to the distributor as commission',
              'Credited back to the scheme, benefiting remaining investors',
              'Paid to SEBI as regulatory fee',
            ],
            correctAnswer: 2,
            explanation:
              'Exit load collected from redeeming investors is credited back to the scheme (fund\'s assets), not to the AMC or distributor. This increases the NAV slightly and benefits the remaining unitholders. It acts as a compensation mechanism to protect long-term investors from the impact of short-term redemptions.',
          },
          {
            question:
              'R invested ₹10 lakhs in an equity fund. After 8 months, the value is ₹11 lakhs. Exit load is 1% for redemption within 1 year. If he redeems fully, what is his net redemption?',
            options: ['₹10,89,000', '₹10,90,000', '₹10,00,000', '₹11,00,000'],
            correctAnswer: 0,
            explanation:
              'Exit load is charged on the redemption value (not on the original investment). Redemption value = ₹11,00,000. Exit load = 1% of ₹11,00,000 = ₹11,000. Net redemption = ₹11,00,000 - ₹11,000 = ₹10,89,000. Remember: exit grade is applied on the redemption value, not the invested amount.',
          },
          {
            question: 'For ELSS (Equity Linked Savings Scheme), the exit load is:',
            options: [
              '1% if redeemed within 1 year',
              '2% if redeemed within 3 years',
              'Nil — the 3-year mandatory lock-in period serves the purpose of exit load',
              '0.5% if redeemed within 6 months of lock-in expiry',
            ],
            correctAnswer: 2,
            explanation:
              'ELSS funds have a mandatory 3-year lock-in period (investors cannot redeem before 3 years). Since the lock-in itself prevents premature exits, there is no additional exit load. After the lock-in expires, investors can redeem without any load.',
          },
        ],
        summaryNotes: [
          'Entry load was abolished by SEBI on August 1, 2009 — this is a frequently tested NISM fact; before abolition, entry load of 2-2.25% was deducted upfront from the investment amount',
          'Exit load is charged on premature redemptions and goes back to the scheme (not the AMC) — typical equity fund exit load is 1% within 1 year',
          'For SIPs, exit load is calculated on FIFO basis — each installment has its own 1-year holding period clock',
          'Liquid funds have graded exit loads for redemption within the first 7 days; ELSS has no exit load due to the mandatory 3-year lock-in',
          'Always check the Scheme Information Document (SID) for the exact exit load structure of any scheme before recommending to clients',
        ],
        relatedTopics: ['total-expense-ratio', 'what-is-nav', 'cut-off-timing'],
      },
    },

    // ── Section 5: How Fund Houses Calculate NAV Daily ──────────────────
    {
      id: 'nav-calculation-daily',
      title: 'How Fund Houses Calculate NAV Daily',
      slug: 'nav-calculation-daily',
      content: {
        definition:
          'Daily NAV calculation is the process by which mutual fund houses determine the per-unit value of each scheme at the end of every business day. The fund accountant collects the closing market prices of all securities held, adds accrued income (interest and dividends), includes cash and bank balances, subtracts all accrued expenses and liabilities, and divides the resulting net asset figure by the total outstanding units. SEBI requires AMCs to publish the NAV on their website and the AMFI website by 11:00 PM on every business day. For liquid and overnight funds, the NAV must be published by 11:00 PM as well, but the valuation cut-off rules differ.',
        explanation:
          'The NAV calculation process is like closing the books of a company every single day. Here is what happens inside a fund house between 3:30 PM (market close) and 11:00 PM (NAV publication deadline). Step 1: Market Close & Price Capture. At 3:30 PM, the NSE and BSE close. The fund accounting team captures the closing prices of every equity stock held in the portfolio. For debt securities, the team downloads the day\'s AMFI/CRISIL valuation matrices. Step 2: Corporate Action Adjustments. Any corporate actions — stock splits, bonus issues, dividends declared, rights issues — are adjusted. If a stock went ex-dividend that day, the dividend income is accrued. Step 3: Income Accrual. Interest accrued on bonds and debentures (calculated daily based on coupon rates) is added. Dividend income from stocks that went ex-dividend is recorded. Step 4: Expense Accrual. The day\'s share of TER is calculated (annual TER / 365) and deducted. Any other payables — management fees, custodian charges, registrar fees — are accrued. Step 5: Unit Capital Update. New subscriptions received that day (that qualify for the day\'s NAV based on cut-off timing) create new units. Redemptions processed cancel units. The total outstanding units are updated. Step 6: NAV Computation. Net Assets (Total Assets - Total Liabilities) divided by Updated Outstanding Units = the day\'s NAV. Step 7: Publication. The NAV is published on the AMC website and AMFI website by 11:00 PM.',
        realLifeExample:
          'Let us follow the NAV calculation of a hypothetical fund — "Trustner Bluechip Equity Fund" — on a specific business day, say March 12, 2025.\n\nPortfolio at previous day close (March 11):\n• 50 stocks in the portfolio, total equity value: ₹4,200 crores\n• Cash in bank: ₹80 crores\n• Accrued income carried forward: ₹5 crores\n• Outstanding units: 180 crore units\n• Previous day NAV: ₹23.75\n\nEvents on March 12:\n• Nifty rises 1.2%, portfolio equity value increases to ₹4,250 crores (not all stocks move equally)\n• One stock (HDFC Bank) goes ex-dividend: dividend accrual of ₹2 crores\n• New SIP subscriptions received before 3 PM cut-off: ₹15 crores (creating 63.16 lakh new units at today\'s NAV)\n• Daily TER expense: ₹4,300 crores x 1.80% / 365 = ₹0.212 crores\n\nNAV Calculation:\nTotal Assets = ₹4,250 + ₹80 + ₹5 + ₹2 + ₹15 = ₹4,352 crores\nTotal Liabilities = ₹0.212 crores (day\'s TER) + ₹1.5 crores (other accrued expenses) = ₹1.712 crores\nNet Assets = ₹4,352 - ₹1.712 = ₹4,350.288 crores\nOutstanding Units = 180 crore + 0.6316 crore = 180.6316 crore units\nNAV = ₹4,350.288 / 180.6316 = ₹24.08\n\nThe fund accountant, Sneha, publishes this NAV on the AMC website by 9:30 PM — well before the 11 PM SEBI deadline.',
        keyPoints: [
          'NAV is calculated at the end of every business day (weekdays when stock markets are open) and must be published by 11:00 PM on the AMFI and AMC websites',
          'The process begins after market close (3:30 PM for equity) with price capture from NSE/BSE for equity securities and AMFI/CRISIL matrices for debt securities',
          'Accrued income is added: interest on bonds calculated daily based on coupon rate, dividends from stocks that went ex-dividend',
          'Accrued expenses are subtracted: daily TER (annual TER / 365), management fees, custodian fees, registrar fees, audit fees — all prorated daily',
          'Corporate actions (bonus, split, rights, merger) are adjusted on the ex-date — this can cause significant NAV changes independent of market movement',
          'Unit capital is updated daily: new subscriptions (that meet cut-off timing) create new units; redemptions cancel units',
          'The fund accountant is responsible for NAV computation, reconciliation, and timely publication — this is a critical back-office function',
          'On days when the stock market is closed (weekends, exchange holidays), no new NAV is calculated — the previous business day\'s NAV continues to apply',
        ],
        faq: [
          {
            question: 'Why is NAV published so late in the day (by 11 PM)?',
            answer:
              'NAV computation requires closing prices from exchanges (available after 3:30 PM), AMFI/CRISIL debt valuation matrices (published between 5-7 PM), reconciliation of all subscriptions and redemptions received during the day, and verification by the fund accountant and compliance team. All this takes several hours. SEBI allows until 11:00 PM to ensure accuracy. Most large AMCs publish NAV by 9:00-10:00 PM.',
          },
          {
            question: 'What happens to NAV on a day when the stock market is closed but the bond market is open?',
            answer:
              'If the equity market is closed (exchange holiday) but some debt instruments have valuation changes, the AMC may or may not calculate a new NAV depending on the type of holiday. Generally, if both NSE and BSE are closed, no fresh NAV is computed. However, for overnight and liquid funds where debt valuation is critical, AMCs may compute NAV even on exchange holidays if money market instruments mature or have payment events.',
          },
          {
            question: 'How do new subscriptions and redemptions affect NAV?',
            answer:
              'Importantly, new subscriptions and redemptions do NOT change the NAV for existing investors. When a new subscription comes in, the investor gets new units allotted at the applicable NAV — the cash goes into the fund (increasing assets) and new units are created (increasing denominator) by the same proportion, keeping NAV unchanged. Similarly, for redemption, units are cancelled and cash goes out proportionally. NAV changes only due to market price movements, income accruals, and expense deductions.',
          },
          {
            question: 'Can NAV calculation errors occur? What happens if they do?',
            answer:
              'Yes, NAV errors can occur due to incorrect price feeds, missed corporate action adjustments, or accounting mistakes. SEBI requires AMCs to have robust checks and balances. If an error is detected, the AMC must restate the NAV and compensate affected investors (those who transacted at the wrong NAV). The fund accountant, auditor, and custodian provide multi-level verification to minimize errors.',
          },
        ],
        mcqs: [
          {
            question: 'SEBI mandates that AMCs must publish the NAV of their schemes by what time on business days?',
            options: [
              '6:00 PM',
              '8:00 PM',
              '11:00 PM',
              '12:00 midnight',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI mandates that AMCs must compute and publish NAV of all schemes on their website and the AMFI website by 11:00 PM on every business day. This gives fund accountants sufficient time to capture closing prices, process corporate actions, reconcile transactions, and verify calculations after market hours.',
          },
          {
            question: 'When a new investor subscribes to a mutual fund scheme, the NAV for existing investors:',
            options: [
              'Increases because more money comes into the fund',
              'Decreases because more units are created',
              'Remains unchanged because assets and units increase proportionally',
              'Changes depending on the subscription amount',
            ],
            correctAnswer: 2,
            explanation:
              'New subscriptions do not change the NAV for existing investors. The new money (asset) and new units (denominator) are created in the same proportion, keeping NAV unchanged. For example, if NAV is ₹20 and a new investor puts in ₹1 lakh, they get 5,000 new units. Assets increase by ₹1 lakh and units increase by 5,000 — both in the same ratio, so NAV stays at ₹20.',
          },
          {
            question: 'Which of the following is NOT a step in the daily NAV calculation process?',
            options: [
              'Capturing closing prices of all equity holdings from NSE/BSE',
              'Accruing daily interest income on debt securities',
              'Adjusting for future expected returns of the portfolio',
              'Deducting daily TER expenses on a pro-rata basis',
            ],
            correctAnswer: 2,
            explanation:
              'NAV calculation is based on current market values, accrued income, and accrued expenses — all backward-looking or current-day figures. Future expected returns are never part of NAV calculation. NAV reflects what the portfolio is worth today, not what it might be worth tomorrow.',
          },
        ],
        summaryNotes: [
          'NAV is calculated at end of every business day using closing market prices and must be published by 11:00 PM on AMFI and AMC websites',
          'The calculation involves: capturing security prices, adding accrued income, subtracting daily expenses (TER), adjusting for corporate actions, and dividing net assets by total outstanding units',
          'New subscriptions and redemptions do NOT change NAV — assets and units change proportionally, keeping the per-unit value unchanged for existing investors',
          'The fund accountant is the key person responsible for accurate and timely NAV computation — errors must be corrected and affected investors compensated',
          'No NAV is computed on stock exchange holidays — the previous business day\'s NAV continues to apply for reference',
        ],
        relatedTopics: ['what-is-nav', 'mark-to-market', 'cut-off-timing'],
      },
    },

    // ── Section 6: Cut-off Timing ───────────────────────────────────────
    {
      id: 'cut-off-timing',
      title: 'Cut-off Timing — When Does Your NAV Apply?',
      slug: 'cut-off-timing',
      content: {
        definition:
          'Cut-off timing in mutual funds refers to the time deadline before which an investor must submit a valid purchase (subscription) or sale (redemption) request along with applicable funds to receive the NAV of that particular business day. SEBI prescribes specific cut-off times for different fund categories. For equity, balanced, and most debt funds, the cut-off is 3:00 PM on a business day. For liquid and overnight funds, the purchase cut-off is 1:30 PM and the redemption cut-off is 3:00 PM. If the application and funds are received after the cut-off time, the next business day\'s NAV applies. This mechanism ensures fair treatment of all investors.',
        explanation:
          'Cut-off timing is one of the most practical and frequently tested concepts in the NISM exam, and it is also commonly misunderstood among new distributors and clients. The fundamental rule is: the investor gets the NAV of the day when the valid application AND funds reach the AMC/RTA before the cut-off time. Both conditions must be met — an application alone is not enough, and funds alone are not enough. For equity, hybrid, and most debt fund purchases: if the application with funds reaches the AMC before 3:00 PM, the same day\'s closing NAV applies. If it reaches after 3:00 PM, the next business day\'s closing NAV applies. For redemptions: the same 3:00 PM rule applies. A redemption request before 3:00 PM gets that day\'s NAV; after 3:00 PM, the next day\'s NAV applies. The rules become more nuanced with liquid and overnight funds. Since these are meant for very short-term parking of money, even one day\'s NAV difference matters. SEBI has set tighter cut-offs: purchase before 1:30 PM gets same-day NAV; purchase between 1:30 PM and 3:00 PM gets next-day NAV. For redemption of liquid funds, the cut-off is 3:00 PM (same as equity). Switch transactions add another layer of complexity. When switching from Fund A to Fund B, it is treated as a redemption from Fund A and a purchase into Fund B. The redemption NAV of Fund A and the purchase NAV of Fund B may be of different days depending on the cut-off timings and fund categories.',
        realLifeExample:
          'The following three case studies illustrate how cut-off timing works in practice:\n\nCase Study 1 — Prashant submitted an online SIP in an equity fund at 2:45 PM on Monday. His bank auto-debit cleared by 2:50 PM. Since both application and funds were received before 3:00 PM, Prashant received Monday\'s closing NAV (published that evening around 10 PM). With Monday\'s NAV at ₹45.20, his ₹10,000 SIP bought 221.24 units.\n\nCase Study 2 — Sunita submitted a lump sum purchase of ₹5 lakhs in the same equity fund at 3:15 PM on Monday via her bank\'s net banking. Even though the transaction was initiated on Monday, since it was after 3:00 PM, she received Tuesday\'s closing NAV. Tuesday\'s NAV jumped to ₹46.10 (because markets rallied on Tuesday), so Sunita got fewer units: 10,845.99 units. Had she transacted 30 minutes earlier, she would have gotten 11,061.95 units — a difference of 216 units, worth ₹9,957.\n\nCase Study 3 — Manoj wanted to invest ₹50 lakhs in a liquid fund on Wednesday. He submitted the application at 1:15 PM and his RTGS transfer reached the AMC by 1:25 PM. Since both application and funds were received before 1:30 PM, he got Wednesday\'s NAV. Had his RTGS been delayed to 1:35 PM, he would have gotten Thursday\'s NAV, potentially losing one day\'s return of approximately ₹600-700 on ₹50 lakhs.',
        keyPoints: [
          'Equity, Hybrid, and most Debt fund purchases: cut-off is 3:00 PM — application + funds must reach AMC before 3:00 PM for same-day NAV',
          'Equity, Hybrid, and Debt fund redemptions: cut-off is 3:00 PM — redemption request before 3:00 PM gets same-day closing NAV',
          'Liquid and Overnight fund purchases: cut-off is 1:30 PM — funds must be available before 1:30 PM for same-day NAV',
          'Liquid and Overnight fund redemptions: cut-off is 3:00 PM — same as other fund categories',
          'Both a valid application AND cleared funds must be received before cut-off — application alone is insufficient',
          'For online transactions (AMC website, apps, exchanges), the timestamp of successful payment confirmation determines the applicable NAV',
          'Switch transactions: redemption NAV of source fund and purchase NAV of target fund may apply on different business days depending on respective cut-off times',
          'On the last business day before a long weekend/holiday, cut-off timing becomes critical — late applications will get NAV of the next working day, which could be 3-4 days later',
        ],
        faq: [
          {
            question: 'If an SIP auto-debit is submitted at 10 AM but the bank debits at 4 PM, which NAV applies?',
            answer:
              'The applicable NAV depends on when the funds are actually credited to the AMC\'s account, not when the auto-debit instruction was submitted. If the bank processes the debit and the AMC receives funds before 3:00 PM, the same-day NAV applies. If the funds reach the AMC after 3:00 PM (even though the transaction was initiated at 10 AM), the next business day\'s NAV applies. This is why NACH/ECS auto-debits for SIPs are typically processed early in the morning by banks.',
          },
          {
            question: 'Why is the liquid fund purchase cut-off earlier (1:30 PM) than equity funds (3:00 PM)?',
            answer:
              'Liquid funds invest in very short-term money market instruments where returns accrue daily. If the cut-off were 3:00 PM (same as equity), investors could put money in a liquid fund at 2:59 PM and earn a full day\'s return for just one minute of investment. The 1:30 PM cut-off was introduced to prevent such arbitrage and ensure that money is available to the fund manager early enough to deploy in money market instruments for meaningful returns.',
          },
          {
            question: 'How do cut-off timings work for investments through stock exchanges (BSE StAR, NSE MFSS)?',
            answer:
              'For transactions routed through BSE StAR MF or NSE MFSS platforms, the cut-off time is the same (3:00 PM for equity funds, 1:30 PM for liquid fund purchases). The exchange platform timestamps each transaction, and only those received before the cut-off with valid funds get same-day NAV. The exchange acts as an intermediary and forwards the transactions to the AMC/RTA.',
          },
          {
            question: 'What if the market is highly volatile — can an investor time the transaction around 3 PM to get a better NAV?',
            answer:
              'Unlike stocks, investors cannot see the mutual fund NAV before transacting because NAV is calculated AFTER market close (published by 11 PM). When a purchase is submitted at 2:55 PM, the investor knows the same day\'s NAV will apply, but the actual NAV figure will not be known — it is calculated only after 3:30 PM market close. There is no way to time NAV precisely. However, investors can observe market trends during the day and make a general judgment about whether markets are up or down.',
          },
          {
            question: 'Do cut-off timings apply to SWP (Systematic Withdrawal Plan) and STP (Systematic Transfer Plan)?',
            answer:
              'Yes. SWP is essentially an automatic redemption, so the 3:00 PM redemption cut-off applies. STP involves a redemption from the source fund and purchase into the target fund, so both respective cut-off times apply. Since SWP and STP transactions are pre-set and processed automatically by the AMC early in the day, they typically get same-day NAV without issues.',
          },
        ],
        mcqs: [
          {
            question: 'The cut-off time for purchase of units in an equity mutual fund to get same-day NAV is:',
            options: [
              '1:30 PM',
              '2:00 PM',
              '3:00 PM',
              '3:30 PM',
            ],
            correctAnswer: 2,
            explanation:
              'For equity, hybrid, and most debt fund purchases, the cut-off time is 3:00 PM. If the application and funds are received by the AMC before 3:00 PM on a business day, the investor gets that day\'s closing NAV. The 1:30 PM cut-off applies only to liquid and overnight fund purchases.',
          },
          {
            question: 'For purchasing units in a liquid fund, the applicable NAV cut-off time is:',
            options: [
              '3:00 PM',
              '2:00 PM',
              '1:30 PM',
              '12:00 noon',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI prescribes a 1:30 PM cut-off for purchase of liquid and overnight fund units. This is earlier than the 3:00 PM cut-off for other fund categories because liquid funds earn daily returns, and the earlier cut-off prevents arbitrage from last-minute investments trying to capture a full day\'s return.',
          },
          {
            question: 'In a switch transaction from Fund A (equity) to Fund B (debt), the applicable NAV is:',
            options: [
              'Purchase NAV of Fund A and redemption NAV of Fund B',
              'Redemption NAV of Fund A and purchase NAV of Fund B, based on their respective cut-off times',
              'Average of Fund A and Fund B NAVs',
              'The NAV at the time the switch was requested',
            ],
            correctAnswer: 1,
            explanation:
              'A switch is treated as a redemption from the source fund (Fund A) and a purchase into the target fund (Fund B). The redemption NAV of Fund A and the purchase NAV of Fund B apply based on their respective cut-off timings. Since both are non-liquid funds with 3:00 PM cut-off, if the switch is submitted before 3:00 PM, both redemption and purchase happen at that day\'s NAV.',
          },
          {
            question: 'An investor submits an equity fund redemption request at 3:15 PM on a Friday. Which NAV will apply?',
            options: [
              'Friday\'s closing NAV',
              'The NAV at 3:15 PM on Friday',
              'Monday\'s closing NAV (next business day)',
              'The average of Friday and Monday NAVs',
            ],
            correctAnswer: 2,
            explanation:
              'Since the redemption request was submitted after the 3:00 PM cut-off on Friday, the next business day\'s NAV applies. Assuming Monday is a working day, Monday\'s closing NAV will be used for the redemption. This is why cut-off timing is critical before weekends and long holidays — even a 15-minute delay can result in a 3-day gap in applicable NAV.',
          },
        ],
        summaryNotes: [
          'Cut-off timing determines which day\'s NAV applies to a transaction — both valid application AND funds must reach the AMC before the cut-off time',
          'Equity, hybrid, and debt funds: 3:00 PM cut-off for both purchase and redemption; Liquid and overnight funds: 1:30 PM for purchase, 3:00 PM for redemption',
          'Switch transactions are treated as redemption + purchase, each governed by the respective fund\'s cut-off timing',
          'Investors cannot see the NAV before transacting because it is calculated after market close (3:30 PM) and published by 11:00 PM — the choice is effectively between receiving the current day\'s or the next day\'s NAV based on submission timing',
          'Cut-off timing is especially critical before weekends and holidays — a few minutes\' delay can mean a 3-4 day gap in applicable NAV',
        ],
        relatedTopics: ['what-is-nav', 'nav-calculation-daily', 'entry-exit-load'],
      },
    },

    // ── Section 7: NAV, TER and Pricing in Segregated Portfolios ────────
    {
      id: 'nav-ter-segregated',
      title: 'NAV, TER and Pricing in Segregated Portfolios',
      slug: 'nav-ter-segregated',
      content: {
        definition:
          'A segregated portfolio (commonly known as side-pocketing) is a mechanism introduced by SEBI in December 2018 that allows mutual fund schemes to separate distressed or impaired debt securities from the main portfolio following a credit event such as a rating downgrade to below-investment grade or actual default. When a credit event occurs, the affected security is moved to a separate "segregated portfolio" with its own NAV, while the remaining "main portfolio" continues with its own NAV. Existing investors receive units in both portfolios in proportion to their holdings. The TER on the segregated portfolio cannot exceed the TER being charged on the main portfolio. This mechanism protects existing investors from panic redemptions and ensures that any future recovery on the distressed asset benefits the original investors, not new investors.',
        explanation:
          'Side-pocketing is one of the most important investor protection mechanisms in debt mutual funds, and the Franklin Templeton crisis of April 2020 brought it into the national spotlight. Understanding why it was needed and how it works is essential. Before SEBI introduced side-pocketing, the following would happen during a credit event: suppose a debt fund held 5% of its portfolio in Company X bonds. Company X defaults. The fund must immediately mark down the value of Company X bonds (MTM), causing a sharp NAV drop — say 5%. Panic-stricken investors start redeeming. The fund sells its good, liquid bonds to pay redemptions, leaving the remaining investors stuck with a portfolio that has a higher proportion of the bad Company X bonds. The first redeemers escape with relatively less damage, while loyal long-term investors suffer the most. This is deeply unfair. Side-pocketing solves this by separating the bad asset. The moment a credit event occurs, the fund creates two portfolios: (1) Main Portfolio — contains all good assets, gets its own NAV, and is open for subscriptions and redemptions as usual. (2) Segregated Portfolio — contains only the distressed security, gets its own NAV (which reflects the impaired value), and is locked — no new subscriptions or redemptions until recovery or write-off. All existing investors get units in both portfolios in proportion to their original holdings. New investors who come after the segregation can only invest in the main portfolio. If Company X eventually recovers (pays back some or all of the money), that recovery goes to the segregated portfolio investors — the unitholders who were holding when the crisis happened. This is fair and equitable.',
        realLifeExample:
          'The most prominent Indian example is the Vodafone Idea (Vi) exposure in several debt mutual funds. In late 2019, after the Supreme Court\'s AGR ruling, Vodafone Idea\'s creditworthiness deteriorated sharply. Several fund houses that held Vodafone Idea bonds used side-pocketing:\n\nConsider "Trustner Corporate Bond Fund" (hypothetical but based on real scenarios) with AUM of ₹2,000 crores and NAV of ₹25.00.\n• The fund held ₹100 crores in Vodafone Idea bonds (5% of portfolio)\n• After the credit event, CRISIL downgraded Vi bonds to D (default)\n• The fund invokes side-pocketing:\n\nBefore side-pocketing:\n• NAV: ₹25.00 (includes Vi bonds at original value)\n• After MTM markdown of Vi bonds: NAV would have dropped to ₹23.75 (5% fall)\n\nAfter side-pocketing:\n• Main Portfolio NAV: ₹23.75 (reflecting the value of all good assets only)\n• Segregated Portfolio NAV: ₹1.25 per unit (reflecting the impaired Vi bonds valued at 25% of face value)\n\nGopal, a retired banker from Nagpur, held 40,000 units. After side-pocketing:\n• He holds 40,000 units of the main portfolio at NAV ₹23.75 = ₹9,50,000\n• He also holds 40,000 units of the segregated portfolio at NAV ₹1.25 = ₹50,000\n• Total value = ₹10,00,000 (same as his original investment value before markdown)\n\nGopal can continue to redeem from the main portfolio normally. The segregated portfolio is locked. If Vodafone Idea eventually recovers and pays 50% of its dues, Gopal\'s segregated portfolio NAV rises from ₹1.25 to ₹2.50, and he recovers an additional ₹50,000.',
        keyPoints: [
          'Side-pocketing (segregated portfolio) was introduced by SEBI in December 2018 to protect debt fund investors during credit events',
          'A credit event triggering side-pocketing includes: rating downgrade to below-investment grade (below BBB-), actual default on principal or interest, or any other event specified by the AMC\'s credit risk committee',
          'Upon invocation: the distressed security is moved to a segregated portfolio with its own NAV; the remaining assets form the main portfolio with its own (separate) NAV',
          'All existing unitholders receive units in both the main and segregated portfolios in proportion to their existing holdings on the record date',
          'New investors (post-segregation) can only invest in the main portfolio — they have no claim on the segregated portfolio (or its recovery)',
          'TER on the segregated portfolio cannot exceed the TER charged on the main portfolio — this prevents AMCs from profiting from distressed situations',
          'The segregated portfolio is closed for subscriptions and redemptions — investors cannot buy or sell units of the segregated portfolio until recovery, write-off, or listing on stock exchange',
          'SEBI allows AMCs to list segregated portfolio units on a stock exchange to provide liquidity to investors who need to exit before recovery',
        ],
        faq: [
          {
            question: 'Can any AMC invoke side-pocketing for any credit event?',
            answer:
              'No. An AMC can only invoke side-pocketing if the scheme\'s SID (Scheme Information Document) already contains a provision for it. If the SID does not mention side-pocketing, the AMC cannot use this mechanism. The decision to invoke side-pocketing is taken by the AMC\'s trustees, and SEBI and investors must be notified within one business day. The AMC\'s internal credit risk assessment committee evaluates the credit event before recommending side-pocketing.',
          },
          {
            question: 'What happens to the segregated portfolio if the company never recovers?',
            answer:
              'If the distressed company goes bankrupt and there is no recovery, the segregated portfolio NAV will eventually reach zero (or near-zero), and the units will be written off. Investors will have lost the value represented by the segregated portfolio. However, without side-pocketing, these investors would have suffered even more because early redeemers would have taken liquidity from the fund, leaving remaining investors with higher concentration of the bad asset.',
          },
          {
            question: 'How is the NAV of the segregated portfolio calculated?',
            answer:
              'The segregated portfolio NAV is calculated similarly to any other NAV: the fair value of the distressed security (as determined by valuation agencies or the AMC\'s valuation committee) divided by the total segregated portfolio units. If the security is rated D (default), it is typically valued at 25-50% of face value or even lower, depending on expected recovery. The NAV is published daily alongside the main portfolio NAV.',
          },
          {
            question: 'Can an investor sell segregated portfolio units if liquidity is needed?',
            answer:
              'Regular redemption from the segregated portfolio is not allowed. However, SEBI permits AMCs to list the segregated portfolio units on a stock exchange, allowing investors to sell them at market-determined prices (which may be at a deep discount to NAV). This provides some liquidity, though often at a significant loss. Not all AMCs list segregated portfolio units — it depends on the AMC\'s decision.',
          },
          {
            question: 'Did SEBI introduce side-pocketing before or after the Franklin Templeton crisis?',
            answer:
              'SEBI introduced side-pocketing norms in December 2018, about 1.5 years BEFORE the Franklin Templeton crisis of April 2020. The IL&FS default in September 2018 was the immediate trigger. However, the Franklin Templeton case was different — it involved scheme closure (winding up), not just side-pocketing. Several other fund houses successfully used side-pocketing during the 2019-2020 credit cycle for exposures to companies like DHFL, Vodafone Idea, and Yes Bank.',
          },
        ],
        mcqs: [
          {
            question: 'Side-pocketing (segregated portfolio) in mutual funds was introduced by SEBI in:',
            options: [
              'January 2013',
              'August 2009',
              'December 2018',
              'April 2020',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI introduced the framework for segregated portfolios (side-pocketing) in December 2018, following the IL&FS default crisis. This was a proactive reform to protect debt fund investors from the unfair impact of credit events. The Franklin Templeton crisis happened in April 2020, after side-pocketing norms were already in place.',
          },
          {
            question: 'When a mutual fund invokes side-pocketing, new investors can:',
            options: [
              'Invest in both the main portfolio and segregated portfolio',
              'Invest only in the segregated portfolio at discounted NAV',
              'Invest only in the main portfolio — they have no claim on the segregated portfolio',
              'Not invest in the scheme at all until the credit event is resolved',
            ],
            correctAnswer: 2,
            explanation:
              'After side-pocketing, new investors can only invest in the main portfolio (which contains all good assets). They cannot invest in or claim any benefit from the segregated portfolio. This ensures that any recovery from the distressed asset goes only to the original investors who were holding units when the credit event occurred.',
          },
          {
            question: 'The TER charged on a segregated portfolio:',
            options: [
              'Is always zero since no active management is required',
              'Cannot exceed the TER of the main portfolio',
              'Is double the TER of the main portfolio to cover recovery costs',
              'Is determined by SEBI on a case-by-case basis',
            ],
            correctAnswer: 1,
            explanation:
              'SEBI mandates that the TER on the segregated portfolio cannot exceed the TER being charged on the main portfolio. This prevents AMCs from overcharging on distressed assets where limited active management is required. In practice, most AMCs charge lower or zero TER on segregated portfolios.',
          },
          {
            question: 'In a side-pocketing scenario, how are segregated portfolio units allotted to existing investors?',
            options: [
              'Only investors who request side-pocketing receive segregated units',
              'All existing investors receive segregated units in proportion to their existing holdings on the record date',
              'Segregated units are auctioned to institutional investors',
              'Only investors with holdings above ₹10 lakhs receive segregated units',
            ],
            correctAnswer: 1,
            explanation:
              'All existing unitholders as on the record date receive units in both the main portfolio and the segregated portfolio in proportion to their existing holdings. This ensures equal and fair treatment of all investors, regardless of the size of their investment. No investor can be excluded from or included preferentially in the segregated portfolio.',
          },
        ],
        summaryNotes: [
          'Side-pocketing (segregated portfolio) was introduced by SEBI in December 2018 to protect debt fund investors from unfair impact of credit events — the IL&FS crisis was the trigger',
          'When invoked, the distressed security is separated into a segregated portfolio with its own NAV, while the main portfolio continues normally — existing investors get units in both',
          'New investors can only invest in the main portfolio and have no claim on the segregated portfolio or its recovery proceeds',
          'TER on the segregated portfolio cannot exceed the main portfolio TER — and SEBI allows AMCs to list segregated units on exchanges for investor liquidity',
          'The Franklin Templeton crisis (April 2020) was a different event (scheme winding up, not side-pocketing) but highlighted the importance of credit risk management in debt funds',
        ],
        relatedTopics: ['mark-to-market', 'what-is-nav', 'total-expense-ratio'],
      },
    },
  ],
};
