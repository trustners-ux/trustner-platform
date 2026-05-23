import { LearningModule } from '@/types/learning';

export const investmentLandscapeModule: LearningModule = {
  id: 'investment-landscape',
  title: 'Investment Landscape',
  slug: 'investment-landscape',
  icon: 'Compass',
  description: 'Understand why people invest, different asset classes, types of risk, and how to build a solid financial foundation. The starting point for every mutual fund distributor.',
  level: 'beginner',
  color: 'from-emerald-500 to-teal-600',
  estimatedTime: '45 min',
  sections: [
    // ── Section 1: Why People Invest ─────────────────────────────────
    {
      id: 'why-people-invest',
      title: 'Why People Invest — Needs vs Wants vs Goals',
      slug: 'why-people-invest',
      content: {
        definition: 'Investing is the act of deploying money into assets or instruments with the expectation of generating returns over time to meet specific financial goals. Unlike saving, which merely preserves capital, investing puts money to work so it grows faster than inflation. People invest because their future financial needs — children\'s education, a home, retirement — require amounts far beyond what monthly savings alone can accumulate. The fundamental reason anyone invests is the gap between what they earn today and what they will need tomorrow.',
        explanation: 'Across the Indian mutual fund industry — now managing over ₹82 lakh crore in assets with more than 27 crore folios — one question remains universally common among new investors: "Why should I invest? My salary is decent." The answer lies in understanding the crucial difference between needs, wants, and goals. Needs are non-negotiable expenses like food, housing, and healthcare. Wants are lifestyle upgrades like a bigger car or a vacation. Goals are specific future financial targets like a child\'s engineering seat at ₹25 lakhs in 15 years, or a retirement corpus of ₹3 crores in 25 years. Saving alone cannot bridge this gap because of one silent enemy: inflation. If inflation runs at 5-6% per year (India\'s CPI has averaged around 4-5% recently), the cost of things doubles roughly every 12 years. So that ₹25 lakh engineering seat will cost ₹50 lakhs in 12 years. Investors must invest — not just save — to stay ahead of this curve. Financial goals are broadly classified into three buckets: short-term (1-3 years) like an emergency fund or vacation; medium-term (3-7 years) like a car purchase or child\'s school admission donation; and long-term (7+ years) like retirement, child\'s higher education, or building a house. Each goal demands a different investment strategy, and this is where a mutual fund distributor adds tremendous value.',
        realLifeExample: 'Consider the case of Suresh, a 32-year-old bank manager in Pune earning ₹75,000/month. He has three goals: (1) Build an emergency fund of ₹4.5 lakhs (6 months expenses) in 1 year — short-term, so he uses a liquid fund SIP of ₹37,500/month. (2) Save ₹12 lakhs for his daughter Ananya\'s school admission in 5 years — medium-term, so he starts a ₹15,000/month SIP in a balanced advantage fund. (3) Build a retirement corpus of ₹3 crores in 28 years — long-term, so he starts a ₹10,000/month SIP in a flexi-cap equity fund. Without investing, Suresh would have only ₹33.6 lakhs in 28 years from savings. With a 12% equity return, his ₹10,000/month SIP alone can grow to over ₹1.5 crores. That is the power of goal-based investing.',
        keyPoints: [
          'Investing is about meeting future financial goals that savings alone cannot fulfil',
          'Financial goals fall into three categories: short-term (1-3 years), medium-term (3-7 years), and long-term (7+ years)',
          'Inflation at 6% doubles the cost of living approximately every 12 years',
          'Saving preserves capital; investing grows capital to beat inflation',
          'Every client must separate needs (essential), wants (lifestyle), and goals (future targets)',
          'Goal-based investing matches the right product to the right time horizon',
          'A distributor\'s first job is to help the client articulate and prioritize their goals',
          'The earlier an investor starts, the less they need to invest each month — time is the greatest asset',
        ],
        faq: [
          {
            question: 'Why can\'t I just save in a bank account for my goals?',
            answer: 'Bank savings accounts typically offer 3-4% interest, while CPI inflation in India averages around 4-5%. This means money in a savings account is actually losing purchasing power every year. Investing in mutual funds has historically delivered 10-15% returns in equity over long periods, helping investors stay ahead of inflation and build real wealth.',
          },
          {
            question: 'What if I don\'t have specific goals — should I still invest?',
            answer: 'Absolutely. Even if you don\'t have specific goals right now, you should invest for wealth creation and financial freedom. As life progresses, goals will emerge — marriage, children, house, retirement. Having a growing investment portfolio gives you options and security. Start with a simple diversified equity fund SIP.',
          },
          {
            question: 'How much should I invest every month?',
            answer: 'A good starting rule is the 50-30-20 formula: 50% of income for needs, 30% for wants, and 20% for savings and investments. As your income grows, try to increase the investment portion. For specific goals, work backwards — if you need ₹50 lakhs in 15 years, a SIP calculator will tell you the monthly amount needed.',
          },
          {
            question: 'Is investing risky? What if I lose my money?',
            answer: 'All investing carries some degree of risk, but the biggest risk is not investing at all and losing purchasing power to inflation. Risk can be managed through diversification, asset allocation, and staying invested for the long term. In India, equity mutual funds have never given negative returns over any 10-year rolling period historically.',
          },
          {
            question: 'What is the difference between trading and investing?',
            answer: 'Trading is buying and selling frequently to profit from short-term price movements — it requires skill, time, and carries high risk. Investing is buying quality assets and holding them for the long term to benefit from compounding and economic growth. For most people, systematic investing through SIPs is far more suitable than trading.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following best describes the primary reason individuals invest their money?',
            options: [
              'To keep money safe from theft',
              'To generate returns that outpace inflation and meet future financial goals',
              'To avoid paying taxes on income',
              'To maintain the same purchasing power as today',
            ],
            correctAnswer: 1,
            explanation: 'The primary purpose of investing is to generate returns that beat inflation and accumulate wealth to meet future financial goals such as retirement, education, and home purchase. Simply keeping money safe (savings) does not grow wealth.',
          },
          {
            question: 'A client wants to save for his daughter\'s wedding in 2 years. This is classified as a:',
            options: [
              'Long-term goal',
              'Medium-term goal',
              'Short-term goal',
              'Lifestyle want, not a goal',
            ],
            correctAnswer: 2,
            explanation: 'Goals with a time horizon of 1-3 years are classified as short-term goals. A wedding in 2 years falls in this category and should be funded through low-risk instruments like liquid funds or short-duration debt funds.',
          },
          {
            question: 'If inflation is 6% per annum, approximately how many years will it take for prices to double?',
            options: [
              '6 years',
              '10 years',
              '12 years',
              '18 years',
            ],
            correctAnswer: 2,
            explanation: 'Using the Rule of 72 (72 / inflation rate), at 6% inflation, prices double in approximately 72/6 = 12 years. This is a key concept tested in the NISM exam and essential for explaining the need for investing to clients.',
          },
          {
            question: 'The 50-30-20 budgeting rule suggests that what percentage of income should be allocated to savings and investments?',
            options: [
              '50%',
              '30%',
              '20%',
              '10%',
            ],
            correctAnswer: 2,
            explanation: 'The 50-30-20 rule recommends allocating 50% of income to needs, 30% to wants, and 20% to savings and investments. This provides a simple framework for clients who are unsure how much to invest.',
          },
        ],
        summaryNotes: [
          'People invest to bridge the gap between current earnings and future financial needs, which savings alone cannot fulfil',
          'Inflation is the primary enemy of idle money — at 6% inflation, costs double every 12 years (Rule of 72)',
          'Financial goals are categorized as short-term (1-3 years), medium-term (3-7 years), and long-term (7+ years), each requiring different investment approaches',
          'A distributor\'s first and most important job is helping clients identify, quantify, and prioritize their financial goals',
          'The earlier a client starts investing, the smaller the monthly commitment needed — time is the most powerful factor in wealth creation',
        ],
        relatedTopics: ['what-is-sip', 'what-is-mutual-fund', 'scheme-selection-needs', 'power-of-compounding'],
      },
    },

    // ── Section 2: Savings vs Investment ──────────────────────────────
    {
      id: 'savings-vs-investment',
      title: 'Savings vs Investment — The Critical Difference',
      slug: 'savings-vs-investment',
      content: {
        definition: 'Saving is the act of setting aside a portion of income for future use, typically in risk-free instruments like bank savings accounts and fixed deposits, where capital preservation is the primary objective. Investing, on the other hand, is deploying money into assets like equities, mutual funds, or real estate with the objective of capital appreciation — accepting some degree of risk in exchange for potentially higher returns. The critical difference lies in intent: savings protect your money, while investments grow your money.',
        explanation: 'A key principle that every mutual fund distributor should communicate from the outset: clients already know how to save — they have been doing it since childhood. The challenge is to demonstrate why saving alone is not enough. A bank FD giving 6.5-7% sounds safe, but after 30% tax (for someone in the highest bracket), the post-tax return is just about 4.5-4.9%. If inflation is 4-5%, the real return is near zero or even negative — savers are losing purchasing power every single year while feeling "safe." This is the savings trap. Investing, by contrast, means accepting short-term volatility for long-term wealth creation. An equity mutual fund that gives 12% per annum will double money in 6 years (Rule of 72), quadruple it in 12 years, and grow it 8x in 18 years. The NISM exam tests this distinction in depth. The risk-return tradeoff is the foundation of all financial planning: low risk gives low returns (savings), moderate risk gives moderate returns (balanced funds), and higher risk gives higher potential returns (equity). A distributor\'s role is to match the client\'s risk tolerance with the right product.',
        realLifeExample: 'Consider two friends, Meera and Kavita, both 25 years old, both investing ₹10,000 per month for 30 years until retirement at 55:\n\nMeera (the Saver): Puts ₹10,000/month in bank FD at 6.5% interest. After 30% tax, effective rate is 4.55%. After 30 years, her corpus is approximately ₹72 lakhs. Adjusted for 5% inflation, the real value is only about ₹16.5 lakhs in today\'s money.\n\nKavita (the Investor): Puts ₹10,000/month in a diversified equity mutual fund SIP averaging 12% returns. After 30 years, her corpus is approximately ₹3.53 crores. Even after LTCG tax (12.5% on gains above ₹1.25 lakh) and inflation adjustment, the real value is roughly ₹65 lakhs in today\'s money.\n\nSame monthly amount. Same discipline. But Kavita ends up with nearly 4x Meera\'s wealth in real terms, simply because she chose to invest rather than just save.',
        keyPoints: [
          'Saving = capital preservation (low risk, low return); Investing = capital growth (higher risk, higher potential return)',
          'Bank FD returns after tax often fall below the inflation rate, resulting in negative real returns',
          'The risk-return tradeoff is fundamental: higher potential returns require accepting higher short-term volatility',
          'Equity mutual funds have historically delivered 12-15% CAGR over long periods in India',
          'Post-tax returns matter more than pre-tax returns — always calculate the effective return after applicable taxes',
          'Time horizon determines whether an instrument is suitable — equity for long-term, debt for short-term',
          'Liquidity differs: savings accounts offer instant access, while some investments have exit loads or lock-in periods',
          'The NISM exam tests the concept of real return vs nominal return — know the formulas',
        ],
        formula: 'Real Return = Nominal Return - Inflation Rate\n(Approximate formula for quick calculation)\n\nPost-Tax Return = Pre-Tax Return × (1 - Tax Rate)\n\nFor precise real return:\nReal Return = ((1 + Nominal Return) / (1 + Inflation Rate)) - 1',
        numericalExample: 'Scenario: FD vs Equity Mutual Fund over 10 years\nInvestment: ₹1,00,000 lump sum\n\n--- Bank FD ---\nPre-tax return: 6.5% p.a. (typical bank FD rate as of early 2026)\nTax bracket: 30%\nPost-tax return: 6.5% × (1 - 0.30) = 4.55% p.a.\nAfter 10 years: ₹1,00,000 × (1.0455)^10 = ₹1,56,019\nInflation at 5%: Real value = ₹1,56,019 / (1.05)^10 = ₹95,773\nReal return: NEGATIVE. The investor actually lost purchasing power.\n\n--- Equity Mutual Fund ---\nAverage return: 12% p.a.\nLTCG tax: 12.5% on gains above ₹1.25 lakh (post Budget 2024)\nAfter 10 years: ₹1,00,000 × (1.12)^10 = ₹3,10,585\nGains: ₹2,10,585 | Taxable gains: ₹2,10,585 - ₹1,25,000 = ₹85,585\nTax: ₹85,585 × 12.5% = ₹10,698\nPost-tax value: ₹3,10,585 - ₹10,698 = ₹2,99,887\nInflation-adjusted: ₹2,99,887 / (1.05)^10 = ₹1,84,125\nReal return: POSITIVE. Purchasing power nearly doubled.',
        faq: [
          {
            question: 'Are fixed deposits completely risk-free?',
            answer: 'FDs are not entirely risk-free. While they carry very low credit risk (especially in large banks), they carry significant inflation risk and reinvestment risk. The DICGC insures deposits only up to ₹5 lakhs per depositor per bank. Additionally, if you break an FD early, you get a lower interest rate. The biggest hidden risk is inflation eroding your real returns.',
          },
          {
            question: 'If equity is better, why do people still prefer FDs?',
            answer: 'Many people prefer FDs because of familiarity, perceived safety, and guaranteed returns. They often do not see the impact of inflation and taxes on their real wealth. A distributor\'s role is to educate clients about real returns while respecting their risk comfort. The recommended approach is to start by suggesting a small equity allocation alongside their FDs.',
          },
          {
            question: 'What is the difference between nominal return and real return?',
            answer: 'Nominal return is the stated return before adjusting for inflation — for example, 7% FD interest. Real return is the nominal return minus inflation — if inflation is 6%, the real return is approximately 1%. For investments to truly grow wealth, the real return must be positive. The NISM exam frequently tests this concept.',
          },
          {
            question: 'Should I convert all my savings to investments?',
            answer: 'No. You need an emergency fund equivalent to 6 months of expenses in liquid, easily accessible savings (savings account or liquid fund). Beyond that emergency cushion, surplus money should be invested based on your goals and time horizon. Never invest money you might need in the next 6-12 months into equity.',
          },
          {
            question: 'How do taxes affect the comparison between savings and investments?',
            answer: 'FD interest is taxed at the investor\'s income tax slab rate (up to 30% + surcharge). Equity fund STCG (holdings under 1 year) is taxed at 20%, while equity LTCG (gains above ₹1.25 lakh on holdings over 1 year) is taxed at just 12.5% (post Budget 2024). Debt fund gains are taxed at the applicable slab rate. This tax efficiency makes equity mutual funds significantly more attractive for long-term wealth creation compared to FDs.',
          },
        ],
        mcqs: [
          {
            question: 'If a Fixed Deposit offers 7% interest and the investor is in the 30% tax bracket, what is the post-tax return?',
            options: [
              '7.0%',
              '5.6%',
              '4.9%',
              '3.5%',
            ],
            correctAnswer: 2,
            explanation: 'Post-tax return = Pre-tax return × (1 - Tax rate) = 7% × (1 - 0.30) = 7% × 0.70 = 4.9%. This is a frequently tested calculation in the NISM VA exam.',
          },
          {
            question: 'If the nominal return on an investment is 8% and inflation is 6%, what is the approximate real return?',
            options: [
              '14%',
              '8%',
              '6%',
              '2%',
            ],
            correctAnswer: 3,
            explanation: 'Approximate Real Return = Nominal Return - Inflation = 8% - 6% = 2%. The precise formula gives ((1.08)/(1.06)) - 1 = 1.887%, but the approximate method is acceptable in most contexts.',
          },
          {
            question: 'Which of the following statements about savings vs investments is CORRECT?',
            options: [
              'Savings always give higher returns than investments',
              'Investments guarantee capital protection',
              'Savings focus on capital preservation while investments focus on capital growth',
              'There is no risk in savings instruments',
            ],
            correctAnswer: 2,
            explanation: 'The fundamental distinction is that savings instruments prioritize capital preservation (low risk, low return), while investment instruments aim for capital growth (higher risk, higher potential return). Neither savings are completely risk-free (inflation risk) nor do investments guarantee returns.',
          },
          {
            question: 'An investor wants to beat inflation and create long-term wealth. Which instrument is most suitable?',
            options: [
              'Bank Savings Account',
              'Fixed Deposit',
              'Recurring Deposit',
              'Equity Mutual Fund SIP',
            ],
            correctAnswer: 3,
            explanation: 'Equity mutual funds have historically delivered 12-15% CAGR over long periods in India, significantly beating inflation (6-7%). SIP adds the benefit of rupee cost averaging and disciplined investing. The other instruments typically offer returns at or below the inflation rate after tax.',
          },
        ],
        summaryNotes: [
          'Saving preserves capital but often loses purchasing power after tax and inflation; investing grows capital to beat inflation over time',
          'Always calculate post-tax, inflation-adjusted (real) returns when comparing instruments — nominal returns are misleading',
          'FD at 6.5-7% in the 30% tax bracket yields only about 4.5-4.9% post-tax, which is close to or below the 4-5% CPI inflation rate — a near-zero or negative real return',
          'Equity mutual funds have historically outperformed all savings instruments over 7+ year periods in India',
          'Every client needs both: a savings cushion (emergency fund) AND an investment portfolio (goal-based wealth creation)',
        ],
        relatedTopics: ['what-is-sip', 'what-is-mutual-fund', 'debt-funds', 'measuring-returns'],
      },
    },

    // ── Section 3: Asset Classes Explained ────────────────────────────
    {
      id: 'asset-classes-explained',
      title: 'Asset Classes — Equity, Debt, Gold, Real Estate',
      slug: 'asset-classes-explained',
      content: {
        definition: 'An asset class is a grouping of financial instruments that share similar characteristics, behave similarly in the marketplace, and are subject to the same laws and regulations. The four major asset classes available to Indian investors are: Equity (stocks and equity mutual funds), Debt (bonds, FDs, debt mutual funds), Gold (physical gold, gold ETFs, sovereign gold bonds), and Real Estate (residential, commercial property, REITs). Each asset class has a different risk-return profile, liquidity characteristic, and role in a portfolio.',
        explanation: 'Think of asset classes as different vehicles — a bicycle, a car, a bus, and a train. Each gets investors to their destination, but at different speeds, comfort levels, and costs. History provides ample evidence of why concentration in a single asset class is dangerous. The 2008 crash wiped out equity-only portfolios. The real estate slowdown of 2015-2020 trapped investors who had 80% in property. But diversified portfolios recovered and thrived. With the Nifty 50 having crossed the 26,000 level and gold surging past ₹90,000 per 10 grams, India\'s $3.5+ trillion economy offers diverse investment opportunities across asset classes. Equity offers the highest long-term growth (12-15% CAGR) but comes with short-term volatility — ideal for goals 7+ years away. Debt provides stable, predictable returns (6-8%) with lower risk — perfect for short to medium-term goals. Gold is a hedge against inflation and currency depreciation — historically 8-10% returns in INR terms and acts as insurance during crises. Real estate provides rental income and capital appreciation but has low liquidity, high entry cost, and significant transaction charges. The NISM exam tests asset class characteristics extensively, and SEBI currently classifies mutual funds into 36 categories (expanding to 40 from April 2026 under the new SEBI (Mutual Funds) Regulations 2026).',
        realLifeExample: 'Consider the case of Prakash, a 40-year-old businessman in Jaipur, who had his entire ₹1.5 crore net worth split as: ₹80 lakhs in a commercial property (53%), ₹40 lakhs in FDs (27%), ₹20 lakhs in gold jewelry (13%), and ₹10 lakhs in a savings account (7%). Zero equity exposure. When COVID hit in 2020, his rental income stopped, he could not sell the property quickly, FD rates dropped to 5%, and he needed cash. After working with a distributor, he restructured: sold some gold jewelry and bought Sovereign Gold Bonds instead (earning 2.5% interest on gold). Moved ₹15 lakhs from FDs to equity mutual fund SIPs for long-term goals. Kept ₹10 lakhs in liquid funds as emergency reserves. Within 3 years, his equity portfolio grew by 45%, his gold bonds appreciated, and he had liquid reserves for any future emergency.',
        keyPoints: [
          'EQUITY: Ownership in companies. Historical returns 12-15% CAGR. High short-term volatility. Best for goals 7+ years away. Most tax-efficient (LTCG at 12.5% above ₹1.25L)',
          'DEBT: Lending to government or companies. Returns 6-8%. Low volatility. Suitable for 1-3 year goals. Taxed at slab rate for gains',
          'GOLD: Hedge against inflation and currency risk. Historical returns 8-10% in INR. Low correlation with equity. Allocate 5-10% of portfolio',
          'REAL ESTATE: Tangible asset with rental yield (2-3%) + appreciation. Very low liquidity. High entry cost. Heavy transaction taxes (stamp duty, registration)',
          'No single asset class outperforms in all market conditions — diversification across asset classes reduces portfolio risk',
          'Correlation between asset classes matters: equity and gold often move inversely, providing natural hedging',
          'REITs (Real Estate Investment Trusts) offer real estate exposure with mutual fund-like liquidity starting from ₹10,000-15,000',
          'The ideal portfolio includes exposure to at least 3 of the 4 asset classes based on the client\'s goals and risk profile',
        ],
        faq: [
          {
            question: 'Which asset class gives the highest return?',
            answer: 'Over the long term (10+ years), equity has historically provided the highest returns at 12-15% CAGR in India. However, this comes with higher short-term volatility. The key is matching the asset class to your time horizon — equity for long-term, debt for short-term, and gold as a strategic 5-10% allocation.',
          },
          {
            question: 'Is real estate a good investment compared to mutual funds?',
            answer: 'Real estate requires large capital (₹30 lakhs+), has low liquidity (selling takes months), incurs heavy transaction costs (stamp duty, brokerage, registration), and rental yields in India average just 2-3%. Equity mutual funds offer higher historical returns, complete liquidity, no maintenance hassles, and can be started with just ₹500/month via SIP. For most clients, mutual funds are the more practical choice.',
          },
          {
            question: 'Should I buy physical gold or gold mutual funds?',
            answer: 'For investment purposes, Sovereign Gold Bonds (SGBs) are the best option — they offer gold price appreciation plus 2.5% annual interest, and gains are tax-free if held till maturity (8 years). Gold ETFs and gold mutual funds offer liquidity without storage hassles. Physical gold has making charges (8-25%), storage risk, and impurity concerns. Keep gold as 5-10% of your portfolio.',
          },
          {
            question: 'What is the difference between systematic and unsystematic risk in different asset classes?',
            answer: 'Systematic risk (market risk) affects the entire market — like recession, inflation, or interest rate changes — and cannot be diversified away within one asset class. Unsystematic risk is specific to a company or sector and can be reduced through diversification. Asset allocation across different asset classes helps manage systematic risk because different asset classes respond differently to the same economic events.',
          },
          {
            question: 'How do I decide the percentage allocation to each asset class?',
            answer: 'A common starting framework is the age-based rule: subtract your age from 100 to get your equity percentage. A 30-year-old might have 70% equity, 20% debt, 10% gold. However, the ideal allocation depends on individual factors: risk tolerance, goals, time horizon, income stability, and existing assets. This is where professional advice and risk profiling add value.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following asset classes has historically provided the highest long-term returns in India?',
            options: [
              'Fixed Deposits',
              'Gold',
              'Equity',
              'Real Estate',
            ],
            correctAnswer: 2,
            explanation: 'Equity (stocks and equity mutual funds) has historically delivered 12-15% CAGR over long periods in India, outperforming all other asset classes. This higher return compensates for the higher short-term volatility associated with equity investments.',
          },
          {
            question: 'An investor looking for an asset class with low correlation to equity for portfolio hedging purposes should consider:',
            options: [
              'More equity funds from different AMCs',
              'Real estate in different cities',
              'Gold ETFs or Sovereign Gold Bonds',
              'Corporate fixed deposits',
            ],
            correctAnswer: 2,
            explanation: 'Gold historically shows low or negative correlation with equity — when equity markets fall, gold often rises as investors seek safe havens. This makes gold an effective portfolio hedge. Simply buying more equity funds or real estate does not provide the same hedging benefit.',
          },
          {
            question: 'Which of the following is NOT a characteristic of real estate as an asset class?',
            options: [
              'High entry cost',
              'High liquidity',
              'Rental income potential',
              'Heavy transaction costs like stamp duty',
            ],
            correctAnswer: 1,
            explanation: 'Real estate is characterized by LOW liquidity — selling a property can take months or even years. It does have high entry cost, rental income potential, and heavy transaction costs. REITs partially address the liquidity issue by allowing real estate exposure with stock-market-like liquidity.',
          },
          {
            question: 'Sovereign Gold Bonds (SGBs) are attractive because they offer:',
            options: [
              'Only gold price appreciation',
              'Gold price appreciation plus 2.5% annual interest, with tax-free maturity gains',
              'Guaranteed 10% annual returns',
              'Physical delivery of gold on maturity',
            ],
            correctAnswer: 1,
            explanation: 'SGBs offer dual benefits: gold price appreciation plus an additional 2.5% per annum interest paid semi-annually. Capital gains on maturity (after 8 years) are completely tax-free, making SGBs the most tax-efficient way to invest in gold.',
          },
        ],
        summaryNotes: [
          'The four major asset classes in India are Equity, Debt, Gold, and Real Estate — each with distinct risk, return, liquidity, and tax characteristics',
          'Equity delivers the highest long-term returns (12-15% CAGR) but with short-term volatility; suitable for goals 7+ years away',
          'Diversification across asset classes reduces overall portfolio risk because different asset classes respond differently to market conditions',
          'Gold should form 5-10% of a portfolio as a hedge against inflation and market downturns; SGBs are the most efficient gold investment',
          'A distributor must understand all asset classes thoroughly to recommend the right mix for each client\'s unique situation',
        ],
        relatedTopics: ['equity-funds', 'debt-funds', 'what-is-mutual-fund', 'sebi-categories'],
      },
    },

    // ── Section 4: Understanding Investment Risk ──────────────────────
    {
      id: 'understanding-risk',
      title: 'Understanding Investment Risk',
      slug: 'understanding-risk',
      content: {
        definition: 'Investment risk is the probability that actual returns from an investment will differ from expected returns. It encompasses the possibility of losing some or all of the original investment. Risk is inherent in every financial instrument — even so-called "safe" instruments carry inflation risk and opportunity cost. The major types of investment risk include market risk (systematic risk), credit risk (default risk), interest rate risk, inflation risk (purchasing power risk), liquidity risk, and concentration risk. Understanding risk is not about avoiding it but about managing it intelligently.',
        explanation: 'The NISM exam tests this topic heavily. In the Indian markets, two extremes are commonly observed: clients who are so afraid of risk they keep everything in FDs and lose to inflation, and clients who chase high returns without understanding the risks and panic-sell during market corrections. Both approaches destroy wealth. Each type of risk should be understood clearly. Market Risk (Systematic Risk) affects the entire market — events like COVID-19, the 2008 financial crisis, or RBI rate hikes impact all stocks. Market risk within a single asset class cannot be diversified away. Credit Risk is the risk that a bond issuer defaults — the IL&FS crisis of 2018, when even highly-rated bonds defaulted, remains a prominent example. Interest Rate Risk affects bond prices — when RBI raises rates, existing bond prices fall (and vice versa). Inflation Risk is the silent killer — a 6.5-7% FD earning a real return of near zero or negative after tax when CPI inflation runs at 4-5%. Liquidity Risk means an investment cannot be sold quickly without a significant price discount — real estate is the classic example. Concentration Risk is having too much money in one stock, one sector, or one asset class. The critical concept to understand is that risks are broadly classified into Systematic Risk (market-wide, cannot be diversified away) and Unsystematic Risk (company or sector-specific, CAN be reduced through diversification). A well-diversified mutual fund portfolio addresses unsystematic risk, while asset allocation across equity, debt, and gold manages systematic risk.',
        realLifeExample: 'In September 2018, the IL&FS group defaulted on its debt obligations. Several debt mutual funds that held IL&FS bonds saw their NAVs fall by 5-15% overnight. Consider the case of a retired colonel who had invested ₹40 lakhs entirely in a single credit-risk debt fund. When the IL&FS news broke, the fund\'s NAV dropped 12%, wiping out ₹4.8 lakhs of his retirement corpus in a week. The lesson was clear: he had taken on credit risk (by choosing a fund with lower-rated bonds for higher yield) AND concentration risk (by putting all his money in one fund). After restructuring with a financial advisor, his ₹35 lakhs was spread across 3 categories: ₹15 lakhs in a banking & PSU debt fund (high credit quality), ₹10 lakhs in an overnight fund (zero credit risk), and ₹10 lakhs in a balanced advantage fund (for growth). The portfolio was now diversified across credit risk levels and asset classes.',
        keyPoints: [
          'Market Risk (Systematic): Affects entire markets due to economic, political, or global events. Cannot be eliminated through diversification within one asset class',
          'Credit Risk (Default Risk): The risk that a bond or debt instrument issuer fails to pay interest or principal. Higher yield bonds carry higher credit risk',
          'Interest Rate Risk: Bond prices move inversely to interest rates. When RBI raises rates, existing bond prices fall — longer duration bonds are more affected',
          'Inflation Risk (Purchasing Power Risk): The risk that returns do not keep pace with inflation, eroding real wealth over time',
          'Liquidity Risk: The risk of not being able to sell an investment quickly without significant loss. Highly relevant in real estate and small-cap stocks',
          'Concentration Risk: Having too much exposure to one stock, sector, fund, or asset class. Diversification is the remedy',
          'Systematic risk is managed through asset allocation (across asset classes); Unsystematic risk is managed through diversification (within an asset class)',
          'The risk-return tradeoff principle: higher expected returns always come with higher risk — there are no shortcuts',
        ],
        faq: [
          {
            question: 'Can risk be completely eliminated from investing?',
            answer: 'No. All investments carry some form of risk. Even a bank savings account carries inflation risk and the risk of bank failure (DICGC covers only ₹5 lakhs). The goal is not to eliminate risk but to manage it through diversification, asset allocation, and matching investments to appropriate time horizons. As the saying goes: "Risk cannot be destroyed, only transformed."',
          },
          {
            question: 'What is the difference between systematic and unsystematic risk?',
            answer: 'Systematic risk (market risk) affects the entire market and cannot be diversified away — examples include recession, inflation, interest rate changes, and pandemics. Unsystematic risk is specific to a company or sector — like a CEO resigning or a product recall — and CAN be reduced through diversification. A well-diversified mutual fund automatically manages unsystematic risk.',
          },
          {
            question: 'How does diversification reduce risk?',
            answer: 'Diversification spreads investments across multiple securities, sectors, and asset classes so that poor performance of one holding is offset by good performance of others. A diversified equity fund holding 50-60 stocks across sectors will be far less volatile than a single stock. Adding debt and gold further reduces portfolio-level risk because these asset classes often move differently from equity.',
          },
          {
            question: 'Why do debt funds carry interest rate risk?',
            answer: 'Bond prices move inversely to interest rates. When RBI increases the repo rate, newly issued bonds offer higher coupon rates, making existing bonds (with lower coupons) less attractive — so their prices fall. Long-duration bonds are more sensitive to rate changes than short-duration bonds. This is measured by a concept called "modified duration." The NISM exam tests this concept frequently.',
          },
          {
            question: 'Is a high-return investment always a risky investment?',
            answer: 'Generally, yes — the risk-return tradeoff is a fundamental principle of finance. Higher expected returns come with higher risk. If someone offers "guaranteed high returns with zero risk," it is almost certainly a fraud. However, risk can be managed through time — equity is risky over 1 year but has never given negative returns over any 10-year period in Indian market history.',
          },
        ],
        mcqs: [
          {
            question: 'Which type of risk CANNOT be reduced through diversification within the same asset class?',
            options: [
              'Unsystematic risk',
              'Company-specific risk',
              'Systematic risk',
              'Sector-specific risk',
            ],
            correctAnswer: 2,
            explanation: 'Systematic risk (market risk) affects the entire market and cannot be diversified away by holding more stocks within the same asset class. Only asset allocation across different asset classes (equity, debt, gold) can help manage systematic risk. Unsystematic, company-specific, and sector-specific risks can all be reduced through diversification.',
          },
          {
            question: 'The IL&FS default of 2018 is an example of which type of risk?',
            options: [
              'Market risk',
              'Interest rate risk',
              'Credit risk',
              'Inflation risk',
            ],
            correctAnswer: 2,
            explanation: 'The IL&FS default was a classic case of credit risk — the company failed to meet its debt obligations (defaulted on bond payments). This impacted debt mutual funds that held IL&FS bonds. Credit risk is the risk that a borrower will not repay the principal or interest as promised.',
          },
          {
            question: 'When RBI increases the repo rate, what typically happens to existing bond prices?',
            options: [
              'Bond prices increase',
              'Bond prices decrease',
              'Bond prices remain unchanged',
              'Only government bond prices change',
            ],
            correctAnswer: 1,
            explanation: 'Bond prices and interest rates have an inverse relationship. When RBI raises the repo rate, new bonds are issued at higher coupon rates, making existing bonds with lower coupons less attractive. Therefore, existing bond prices fall. This is interest rate risk, and longer duration bonds are affected more.',
          },
          {
            question: 'A client has invested 100% of his portfolio in IT sector stocks. Which risk is he primarily exposed to?',
            options: [
              'Interest rate risk',
              'Inflation risk',
              'Concentration risk',
              'Credit risk',
            ],
            correctAnswer: 2,
            explanation: 'Having 100% of a portfolio in a single sector (IT stocks) is a classic example of concentration risk. If the IT sector faces headwinds (like reduced global tech spending), the entire portfolio suffers. Diversification across sectors and asset classes would significantly reduce this risk.',
          },
        ],
        summaryNotes: [
          'Investment risk is the possibility of actual returns differing from expected returns — it exists in every instrument, including "safe" ones like FDs',
          'Six key risk types: Market (systematic), Credit (default), Interest Rate, Inflation (purchasing power), Liquidity, and Concentration',
          'Systematic risk is market-wide and managed through asset allocation; unsystematic risk is specific and managed through diversification',
          'The risk-return tradeoff is a fundamental principle: higher expected returns always come with higher associated risk',
          'A distributor must educate clients that the goal is not to avoid risk but to manage it appropriately based on goals and time horizon',
        ],
        relatedTopics: ['what-is-mutual-fund', 'debt-funds', 'equity-funds', 'sebi-categories'],
      },
    },

    // ── Section 5: Risk Profiling — Know Your Client ──────────────────
    {
      id: 'risk-profiling',
      title: 'Risk Profiling — Know Your Client',
      slug: 'risk-profiling',
      content: {
        definition: 'Risk profiling is the process of assessing an investor\'s willingness and ability to take financial risk. It determines the appropriate investment strategy by evaluating factors such as age, income, financial obligations, investment experience, time horizon, and emotional tolerance for market fluctuations. Under SEBI and AMFI guidelines, every mutual fund distributor must perform a risk assessment before recommending any product. Risk profiles are broadly categorized into three types: Conservative (low risk tolerance), Moderate (balanced approach), and Aggressive (high risk tolerance).',
        explanation: 'Risk profiling is not just a compliance checkbox — it is the foundation of sound financial advice, and the NISM exam tests it thoroughly. Industry experience shows that the costliest mistakes happen when distributors skip this step. A conservative retiree put into a small-cap fund will panic and redeem at a loss during the first market correction. An aggressive young professional put into 100% debt funds will miss out on decades of equity wealth creation. The risk profile depends on two distinct dimensions: Risk Capacity (ability to take risk, based on objective factors) and Risk Appetite (willingness to take risk, based on psychological factors). For example, a young software engineer earning ₹2 lakhs/month with no dependents has HIGH risk capacity — she can afford to lose money in the short term. But if she panics and sells every time the market drops 5%, she has LOW risk appetite. Both dimensions must be assessed. Key factors that determine risk profile: Age (younger = higher capacity), Income stability (salaried = higher capacity than business), Dependents (fewer = higher capacity), Existing wealth and insurance coverage, Investment experience and financial literacy, Time horizon for goals, and Emotional response to losses. AMFI requires distributors to use a risk profiling questionnaire, but the best distributors go beyond the form — they have a genuine conversation to understand the client.',
        realLifeExample: 'Consider three different clients who visited a financial advisor on the same day:\n\nClient 1 — Rekha (Conservative): 58-year-old retired school teacher. Pension of ₹35,000/month. Savings of ₹50 lakhs from retirement benefits. Needs monthly income to supplement pension. Has a heart condition and worries about medical expenses. Recommendation: 70% in debt funds (₹20L in banking & PSU fund, ₹15L in short-duration fund), 20% in balanced advantage fund (₹10L), 10% in liquid fund as emergency reserve (₹5L). Start SWP of ₹15,000/month from the balanced fund.\n\nClient 2 — Vikram (Moderate): 38-year-old IT manager. Salary ₹1.8 lakhs/month. Wife works, earning ₹90,000/month. Two children (ages 8 and 5). Has term insurance and health cover. Needs to plan for children\'s education and retirement. Recommendation: 60% equity (multi-cap and flexi-cap SIPs), 25% debt (for education goal in 10 years), 10% gold ETF, 5% liquid fund for emergency. Total SIP of ₹45,000/month.\n\nClient 3 — Arjun (Aggressive): 27-year-old startup founder. No fixed salary but earning ₹3-5 lakhs/month. Single, no dependents. Already has ₹10 lakhs emergency fund. Wants to create ₹5 crore corpus in 20 years. Recommendation: 80% equity (small-cap, mid-cap, flexi-cap SIPs), 15% international equity fund, 5% gold. SIP of ₹50,000/month with annual step-up.',
        keyPoints: [
          'Risk profiling has two dimensions: Risk Capacity (objective ability) and Risk Appetite (subjective willingness) — both must be assessed',
          'Conservative investors prioritize capital preservation; suitable instruments include debt funds, FDs, and balanced advantage funds',
          'Moderate investors seek balanced growth; suitable instruments include hybrid funds, multi-cap funds, and a mix of equity and debt',
          'Aggressive investors seek maximum growth and can tolerate high volatility; suitable instruments include equity funds, small/mid-caps, and international funds',
          'Key factors: Age, income stability, dependents, insurance coverage, investment experience, time horizon, and emotional response to losses',
          'AMFI and SEBI mandate risk profiling before recommending any mutual fund product — it is both a regulatory requirement and best practice',
          'Risk profile is not static — it changes with life events like marriage, children, job change, retirement, or health issues',
          'Never recommend a product that does not match the client\'s assessed risk profile, even if the client demands it — document the mismatch',
        ],
        faq: [
          {
            question: 'Can a client\'s risk profile change over time?',
            answer: 'Yes, absolutely. Risk profile is dynamic and should be reviewed periodically (at least annually) and after major life events. A single person getting married, having children, receiving an inheritance, facing a job loss, or approaching retirement — all of these events can shift the risk profile. Regular reviews ensure the portfolio remains aligned with the client\'s current situation.',
          },
          {
            question: 'What if a client wants to invest aggressively but has a conservative risk profile?',
            answer: 'This is a common challenge. A distributor should explain the mismatch between the client\'s desire (greed) and their capacity (reality). The risk profile assessment and recommendation should be documented. If the client insists, a small "satellite" portion (10-15%) can be allocated to aggressive funds while keeping the core portfolio aligned with their actual risk capacity. Written acknowledgment should always be obtained.',
          },
          {
            question: 'Is the KYC risk assessment form sufficient for risk profiling?',
            answer: 'The KYC form captures basic identity and financial information, but it is not a comprehensive risk profiling tool. AMFI recommends using a separate risk profiling questionnaire that covers income, expenses, goals, experience, and behavioral aspects. Good distributors combine the formal questionnaire with an in-depth conversation to truly understand the client.',
          },
          {
            question: 'How does age affect risk profiling?',
            answer: 'Generally, younger investors have a longer time horizon to recover from market downturns, so they have higher risk capacity. The traditional rule of "100 minus age = equity percentage" provides a starting framework. A 30-year-old would have 70% in equity, while a 60-year-old would have 40%. However, this rule is just a starting point — actual allocation should consider all factors holistically.',
          },
          {
            question: 'What is the role of insurance in risk profiling?',
            answer: 'Adequate insurance (term life and health cover) is a prerequisite for investing. A client without insurance has a hidden financial risk that can derail all investment plans. For example, a single medical emergency costing ₹10 lakhs could force premature redemption of investments. Always ensure adequate insurance coverage before starting investment recommendations.',
          },
        ],
        mcqs: [
          {
            question: 'Risk profiling of a client assesses which two dimensions?',
            options: [
              'Past returns and future returns',
              'Risk capacity (ability) and risk appetite (willingness)',
              'Income level and expenditure level',
              'Short-term goals and long-term goals',
            ],
            correctAnswer: 1,
            explanation: 'Risk profiling evaluates both Risk Capacity (the objective ability to bear financial loss based on income, assets, and obligations) and Risk Appetite (the subjective willingness to accept volatility and potential losses). A complete risk assessment must consider both dimensions.',
          },
          {
            question: 'A 60-year-old retiree with pension income, no debts, and ₹1 crore savings would most likely be classified as:',
            options: [
              'Aggressive investor',
              'Conservative to Moderate investor',
              'High-risk trader',
              'Cannot be classified without more information',
            ],
            correctAnswer: 1,
            explanation: 'A 60-year-old retiree typically has lower risk capacity due to limited earning years remaining. However, having pension income, no debts, and significant savings provides some buffer. This profile usually maps to Conservative-to-Moderate, favoring capital preservation with some growth allocation.',
          },
          {
            question: 'Under AMFI guidelines, when must a mutual fund distributor perform risk profiling?',
            options: [
              'Only for first-time investors',
              'Only for investments above ₹5 lakhs',
              'Before recommending any mutual fund product',
              'Only when the client requests it',
            ],
            correctAnswer: 2,
            explanation: 'AMFI guidelines mandate that risk profiling must be done before recommending any mutual fund product to any client, regardless of investment amount or whether they are first-time or existing investors. This is a fundamental compliance requirement for all distributors.',
          },
          {
            question: 'Which factor does NOT typically affect an investor\'s risk capacity?',
            options: [
              'Age and time horizon',
              'Income stability and level',
              'Yesterday\'s stock market performance',
              'Number of financial dependents',
            ],
            correctAnswer: 2,
            explanation: 'Risk capacity is determined by objective, long-term factors like age, income, dependents, insurance coverage, and time horizon. Yesterday\'s stock market performance is a short-term event that might affect risk appetite (emotional willingness) but does not change risk capacity (objective ability to bear risk).',
          },
        ],
        summaryNotes: [
          'Risk profiling assesses two dimensions: Risk Capacity (objective ability based on finances) and Risk Appetite (subjective willingness based on temperament)',
          'Three broad profiles exist — Conservative (capital preservation), Moderate (balanced growth), and Aggressive (maximum growth) — but most clients fall on a spectrum',
          'Key determinants include age, income stability, dependents, insurance, investment experience, time horizon, and emotional response to losses',
          'Risk profiling is mandatory under AMFI/SEBI guidelines before any mutual fund recommendation — it protects both the client and the distributor',
          'Risk profiles are dynamic and must be reviewed annually and after major life events like marriage, children, job changes, or retirement',
        ],
        relatedTopics: ['scheme-selection-needs', 'what-is-mutual-fund', 'equity-funds', 'debt-funds'],
      },
    },

    // ── Section 6: Power of Compounding ───────────────────────────────
    {
      id: 'power-of-compounding',
      title: 'Power of Compounding — The 8th Wonder',
      slug: 'power-of-compounding',
      content: {
        definition: 'Compounding is the process where the returns earned on an investment generate their own returns over subsequent periods, creating an exponential growth curve. Albert Einstein reportedly called it the "eighth wonder of the world." In simple terms, you earn returns not just on your original investment (principal) but also on the accumulated returns from previous periods. The three critical ingredients for compounding to work are: a reasonable rate of return, consistent investment, and — most importantly — time. The longer your money stays invested, the more dramatic the compounding effect becomes.',
        explanation: 'Across India\'s ₹82+ lakh crore mutual fund industry, compounding has transformed ordinary middle-class families into crorepatis. But the catch is that compounding is a slow magic. In the first few years, it looks unimpressive. The real explosion happens in the later years. For illustration: an investor putting ₹10,000/month at 12% per annum would have about ₹23 lakhs after 10 years on an investment of ₹12 lakhs — a gain of ₹11 lakhs. After 20 years, the corpus reaches about ₹1 crore on ₹24 lakhs invested — a gain of ₹76 lakhs. And after 30 years, it grows to about ₹3.53 crores on just ₹36 lakhs invested — a gain of ₹3.17 crores. The pattern is striking: in the first 10 years, the money doubled. In the next 10, it grew 4x. In the final 10 years, it grew 3.5x more. The gain in the last 10 years (₹2.53 crores) was more than the total corpus of the first 20 years. This is the snowball effect of compounding. The NISM exam tests compound interest calculations, so the formula must be mastered. For a distributor, the most powerful tool is showing clients this exponential growth chart — it converts fence-sitters into committed SIP investors. With over 10 crore SIP accounts contributing ₹29,000-31,000 crore monthly in India, the power of compounding is at work for millions of investors.',
        realLifeExample: 'Consider two colleagues: Deepak (the Early Starter) and Ravi (the Late Starter). Both want to retire at 60 with a target corpus.\n\nDeepak starts a SIP of ₹10,000/month at age 25. He invests for 35 years at an assumed 12% annual return.\nTotal invested: ₹10,000 x 12 x 35 = ₹42 lakhs\nCorpus at 60: approximately ₹6.49 crores\nWealth gained from compounding: ₹6.07 crores\n\nRavi starts the same ₹10,000/month SIP at age 35. He invests for 25 years at the same 12% return.\nTotal invested: ₹10,000 x 12 x 25 = ₹30 lakhs\nCorpus at 60: approximately ₹1.90 crores\nWealth gained from compounding: ₹1.60 crores\n\nDeepak invested only ₹12 lakhs more than Ravi, but his corpus is ₹4.59 crores MORE. Those extra 10 years of compounding — not the extra ₹12 lakhs — created the massive difference. When financial advisors show this chart to a 25-year-old client, many start their SIP that very day.',
        keyPoints: [
          'Compounding means earning returns on both the principal AND on previously earned returns — it creates exponential, not linear, growth',
          'The three essential ingredients: rate of return, consistent investment, and TIME — time is the most powerful factor',
          'Rule of 72: Divide 72 by the annual return rate to find how many years it takes for money to double (e.g., 12% return doubles money in 6 years)',
          'The compounding effect is negligible in early years but becomes dramatic over time — the last 10 years create more wealth than the first 20',
          'Starting 10 years earlier can result in 2-3 times more wealth even with the same monthly investment and return',
          'SIP is the best vehicle for compounding because it ensures consistent, disciplined investing regardless of market conditions',
          'Step-up SIP (increasing SIP amount annually) supercharges compounding by adding more fuel to the growth engine each year',
          'Interrupting or stopping SIP during market downturns breaks the compounding chain and significantly reduces long-term wealth creation',
        ],
        formula: 'Compound Interest Formula:\nA = P(1 + r/n)^(nt)\n\nWhere:\nA = Final amount (maturity value)\nP = Principal (initial investment)\nr = Annual interest rate (in decimal)\nn = Number of times interest compounds per year\nt = Number of years\n\nFor SIP (Future Value of Annuity):\nFV = P x [((1 + r)^n - 1) / r] x (1 + r)\n\nWhere:\nP = Monthly SIP amount\nr = Monthly rate of return (annual return / 12)\nn = Total number of months\n\nRule of 72:\nYears to double = 72 / Annual Return Rate',
        numericalExample: 'SIP of ₹10,000/month at 12% annual return (1% monthly)\n\n--- After 10 years (120 months) ---\nFV = 10,000 x [((1.01)^120 - 1) / 0.01] x (1.01)\nFV = 10,000 x [(3.300 - 1) / 0.01] x 1.01\nFV = 10,000 x 230.0 x 1.01\nFV = ₹23,23,391\nTotal invested: ₹12,00,000\nWealth gain: ₹11,23,391\n\n--- After 20 years (240 months) ---\nFV = 10,000 x [((1.01)^240 - 1) / 0.01] x 1.01\nFV = ₹99,91,479 (approx ₹1 crore)\nTotal invested: ₹24,00,000\nWealth gain: ₹75,91,479\n\n--- After 30 years (360 months) ---\nFV = 10,000 x [((1.01)^360 - 1) / 0.01] x 1.01\nFV = ₹3,52,99,138 (approx ₹3.53 crores)\nTotal invested: ₹36,00,000\nWealth gain: ₹3,16,99,138\n\nNotice: Invested ₹12L more in the last decade, but gained ₹2.41 CRORES more. That is the power of compounding over time.',
        faq: [
          {
            question: 'What is the Rule of 72 and how do I use it?',
            answer: 'The Rule of 72 is a quick mental math shortcut: divide 72 by the annual rate of return to estimate how many years it takes for an investment to double. At 12% return, money doubles in 72/12 = 6 years. At 8% return, it doubles in 72/8 = 9 years. At 6% (FD rate), it doubles in 72/6 = 12 years. This is a powerful tool for client conversations and is commonly tested in the NISM exam.',
          },
          {
            question: 'Does compounding work in SIP the same way as in lump sum?',
            answer: 'Yes, compounding works in SIP, but each monthly installment starts compounding from its own investment date. The first month\'s SIP compounds for the longest period, and the last month\'s SIP for the shortest. The cumulative effect is still exponential over time. In fact, SIP may perform better than lump sum in volatile markets due to rupee cost averaging.',
          },
          {
            question: 'What happens to compounding if I stop my SIP for a year and restart?',
            answer: 'Stopping and restarting an SIP breaks the compounding chain for that period. The money already invested continues to compound, but the gap year means you miss out on buying units during that period and those missed investments lose years of future compounding. Even during market downturns, continuing your SIP is crucial — those units bought at low prices compound significantly when markets recover.',
          },
          {
            question: 'Is a 12% return assumption realistic for equity mutual funds?',
            answer: 'Historically, the Sensex has delivered approximately 14-15% CAGR since inception (1979), and diversified equity mutual funds have delivered 12-18% CAGR over 15+ year periods. Using 12% as a long-term assumption for equity SIPs is considered reasonable and slightly conservative. However, past performance does not guarantee future results. It is prudent to show clients multiple scenarios (10%, 12%, 15%) so expectations are grounded.',
          },
          {
            question: 'How does a step-up SIP enhance compounding?',
            answer: 'A step-up SIP increases your investment amount annually (typically by 10-15%). For example, starting with ₹10,000/month and increasing by 10% each year means you invest ₹11,000 in year 2, ₹12,100 in year 3, and so on. This dramatically accelerates wealth creation because each increased installment compounds for the remaining years. A 10% annual step-up can nearly double the final corpus compared to a flat SIP over 20 years.',
          },
        ],
        mcqs: [
          {
            question: 'Using the Rule of 72, approximately how long will it take for an investment to double at an annual return of 12%?',
            options: [
              '5 years',
              '6 years',
              '8 years',
              '12 years',
            ],
            correctAnswer: 1,
            explanation: 'Rule of 72: Years to double = 72 / Annual Return = 72 / 12 = 6 years. This is a frequently tested shortcut in the NISM exam and an invaluable tool for quick client conversations.',
          },
          {
            question: 'Which of the following is the MOST important factor for maximizing the power of compounding?',
            options: [
              'Choosing the fund with the highest past returns',
              'Starting to invest as early as possible',
              'Investing a large lump sum amount',
              'Switching funds every year for better returns',
            ],
            correctAnswer: 1,
            explanation: 'Time is the most critical factor in compounding. Starting early gives each rupee more years to compound. An investor who starts at 25 will create significantly more wealth than one who starts at 35 with the same monthly investment, because those extra 10 years of compounding create exponential growth.',
          },
          {
            question: 'If ₹1 lakh is invested at 12% compound interest, what will it grow to approximately in 12 years?',
            options: [
              '₹2 lakhs',
              '₹3 lakhs',
              '₹4 lakhs',
              '₹2.44 lakhs',
            ],
            correctAnswer: 2,
            explanation: 'At 12% annual return, money doubles every 6 years (Rule of 72). In 12 years, it doubles twice: ₹1L becomes ₹2L in 6 years, and ₹2L becomes ₹4L in 12 years. Precisely, ₹1,00,000 x (1.12)^12 = ₹3,89,598 which is approximately ₹4 lakhs.',
          },
          {
            question: 'In a SIP of ₹10,000/month at 12% return, the wealth gained between year 20 and year 30 is approximately:',
            options: [
              'Same as wealth gained in the first 10 years',
              'Double the wealth gained in the first 20 years',
              'More than 2.5 times the entire corpus at the end of year 20',
              'Less than the total invested amount in 30 years',
            ],
            correctAnswer: 2,
            explanation: 'At year 20, the corpus is approximately ₹1 crore. At year 30, it is approximately ₹3.53 crores. The wealth gained between year 20-30 is roughly ₹2.53 crores, which is more than 2.5 times the ₹1 crore corpus at year 20. This demonstrates the dramatic acceleration of compounding in later years.',
          },
        ],
        summaryNotes: [
          'Compounding creates exponential growth by earning returns on both principal and previously accumulated returns — it is the most powerful wealth creation force',
          'The three ingredients for compounding: reasonable rate of return, consistent investment, and TIME — with time being the most critical',
          'Rule of 72: Divide 72 by the annual return rate to estimate doubling time (12% return doubles in 6 years)',
          'Starting 10 years earlier can result in 2-3x more wealth than starting late, even with the same monthly investment amount',
          'Never interrupt a SIP during market downturns — the units bought at low prices create the most powerful compounding effect when markets recover',
        ],
        relatedTopics: ['what-is-sip', 'what-is-mutual-fund', 'measuring-returns', 'scheme-selection-needs'],
      },
    },

    // ── Section 7: Inflation — The Silent Wealth Destroyer ────────────
    {
      id: 'inflation-the-destroyer',
      title: 'Inflation — The Silent Wealth Destroyer',
      slug: 'inflation-the-destroyer',
      content: {
        definition: 'Inflation is the sustained increase in the general price level of goods and services in an economy over time, resulting in a decline in the purchasing power of money. In India, inflation is measured primarily by the Consumer Price Index (CPI). When inflation is 6%, an item costing ₹100 today will cost ₹106 next year, ₹179 in 10 years, and ₹321 in 20 years. For investors, inflation is the "silent wealth destroyer" because it erodes the real value of money even when nominal balances appear to grow. Any investment that delivers returns below the inflation rate is actually making the investor poorer in real terms.',
        explanation: 'The NISM exam tests inflation\'s impact on investments in depth. Historically, inflation has destroyed more wealth than market crashes ever did — because market crashes are visible and temporary, while inflation is invisible and permanent. The key concept investors must grasp: the ₹50 lakhs they think is enough for retirement will actually buy only ₹17 lakhs worth of goods in 20 years at 5% inflation (or just ₹14 lakhs at 6%). The real villain is not market volatility — it is the combination of inflation and taxes on "safe" investments. Consider this scenario: a senior citizen puts ₹50 lakhs in an FD at 6.5-7%. At 7%, he earns ₹3.5 lakhs per year. But in the 30% tax bracket, he keeps only ₹2.45 lakhs after tax, which is an effective 4.9% return. If CPI inflation is 4-5%, his REAL return is near zero or slightly negative. He is barely maintaining purchasing power while his bank passbook shows a growing balance. This is the cruel irony of "safe" investing. India has multiple types of inflation that affect different segments differently: Food inflation hits lower-income households hardest. Education inflation (10-12% per year) devastates parents saving for children\'s education. Healthcare inflation (12-15%) is the biggest threat to retirees. A distributor\'s role is to help clients invest in instruments that beat their specific inflation rate.',
        realLifeExample: 'Consider the case of Mr. Sharma, who retired in 2004 with ₹20 lakhs — a substantial sum at the time. He put everything in FDs because he believed equity was too risky. In 2004, his monthly expenses were ₹15,000. His FD interest of ₹14,000/month (at 7% on ₹20L) almost covered his expenses. Fast forward to 2024 — twenty years later. His monthly expenses had risen to ₹48,000 (at 6% annual inflation, expenses roughly tripled). His FD balance, after periodic withdrawals for living expenses and medical emergencies, had shrunk to ₹6 lakhs. The interest on ₹6 lakhs at 6.5% gave him just ₹3,250/month. He became financially dependent on his son. Had Mr. Sharma invested even 40% of his ₹20 lakhs in equity mutual funds (₹8 lakhs) in 2004 at 14% CAGR, that portion alone would have been worth approximately ₹1.07 crores in 2024 — enough to sustain him comfortably. The remaining ₹12 lakhs in debt funds would have provided stability. This is the real-life cost of ignoring inflation.',
        keyPoints: [
          'CPI (Consumer Price Index) is the primary measure of inflation in India; RBI targets CPI inflation at 4% with a tolerance band of 2-6%',
          'At 6% inflation, the cost of living approximately doubles every 12 years and triples every 19 years',
          'Education inflation in India runs at 10-12% per annum — significantly higher than general inflation',
          'Healthcare inflation runs at 12-15% per annum, making it the biggest financial threat for retirees',
          'Real Return = ((1 + Nominal Return) / (1 + Inflation)) - 1. FDs often deliver negative real returns after tax',
          'Equity is the only asset class that has consistently beaten inflation over long periods in India (12-15% CAGR vs 4-5% CPI inflation)',
          'Distributors must frame every financial conversation in real (inflation-adjusted) terms, not nominal terms',
          'Lifestyle inflation (increasing expenses as income grows) is a behavioral risk that compounds the problem — distributors should help clients control it',
        ],
        formula: 'Precise Real Return Formula:\nReal Return = ((1 + Nominal Return) / (1 + Inflation Rate)) - 1\n\nFuture Cost with Inflation:\nFuture Cost = Current Cost x (1 + Inflation Rate)^Years\n\nPurchasing Power Erosion:\nFuture Value of ₹100 = ₹100 / (1 + Inflation Rate)^Years',
        numericalExample: 'What will ₹100 be worth in 20 years at 5% inflation?\n\nPurchasing Power = ₹100 / (1.05)^20\nPurchasing Power = ₹100 / 2.6533\nPurchasing Power = ₹37.69\n\nToday\'s ₹100 will buy only ₹37.69 worth of goods in 20 years!\n\n--- Real Return Comparison ---\n\nFD at 6.5%, Tax bracket 30%, Inflation 5%:\nPost-tax return = 6.5% x (1 - 0.30) = 4.55%\nReal return = ((1.0455) / (1.05)) - 1 = -0.43%\nResult: NEGATIVE real return. Wealth is being destroyed.\n\nEquity Fund at 12%, LTCG tax 12.5% on gains above ₹1.25L (effective ~2%), Inflation 5%:\nEffective post-tax return = approx 10%\nReal return = ((1.10) / (1.05)) - 1 = +4.76%\nResult: POSITIVE real return. Wealth is being created.\n\n--- Education Cost Projection ---\nEngineering degree today: ₹10 lakhs\nEducation inflation: 10% per annum\nCost in 15 years: ₹10,00,000 x (1.10)^15 = ₹41,77,248\n\nAn investor needs ₹42 lakhs for a goal that costs ₹10 lakhs today!',
        faq: [
          {
            question: 'What is the current inflation rate in India?',
            answer: 'India\'s CPI inflation has recently been in the 4-5% range as of early 2026. The RBI targets 4% CPI inflation with a tolerance band of +/- 2% (i.e., 2% to 6%). However, specific categories like education (10-12%), healthcare (12-15%), and housing vary significantly. When planning for specific goals, the relevant category inflation rate should be used, not the headline CPI figure.',
          },
          {
            question: 'Why do FDs give negative real returns in higher tax brackets?',
            answer: 'An FD at 6.5% yields only about 4.55% after 30% tax. If CPI inflation is around 4-5%, the real return is approximately zero or slightly negative. The investor sees a growing bank balance but can actually buy the same or less with that money each year. This is the "money illusion" — feeling secure while purchasing power stagnates. It is worst for senior citizens in the 30% tax bracket who rely entirely on FD income.',
          },
          {
            question: 'How should I plan for education expenses given high education inflation?',
            answer: 'Education inflation at 10-12% is nearly double the general inflation rate. To plan: (1) Calculate the future cost using education-specific inflation. (2) Use equity SIPs for goals more than 7 years away — only equity can beat 10-12% inflation. (3) Start early to benefit from compounding. (4) Consider a step-up SIP to match increasing income. For a goal costing ₹10 lakhs today in 15 years, you will need approximately ₹42 lakhs at 10% education inflation.',
          },
          {
            question: 'Is gold a good hedge against inflation?',
            answer: 'Gold has historically been a reasonable inflation hedge in India, delivering 8-10% returns in INR terms over long periods. It tends to perform well during high-inflation periods and currency depreciation. However, gold does not generate income (unlike equity dividends or debt interest). Allocate 5-10% of the portfolio to gold (preferably through SGBs or gold ETFs) as an inflation hedge and crisis insurance.',
          },
          {
            question: 'What is the difference between CPI and WPI inflation?',
            answer: 'CPI (Consumer Price Index) measures retail price changes experienced by consumers and is used by RBI for monetary policy decisions and inflation targeting. WPI (Wholesale Price Index) measures price changes at the wholesale/producer level. CPI is more relevant for individual investors and financial planning because it reflects the actual cost of living. The NISM exam may test this distinction.',
          },
        ],
        mcqs: [
          {
            question: 'If inflation is 6% per annum, what will be the approximate purchasing power of ₹100 after 20 years?',
            options: [
              '₹100',
              '₹55',
              '₹31',
              '₹20',
            ],
            correctAnswer: 2,
            explanation: 'Purchasing power after 20 years = ₹100 / (1.06)^20 = ₹100 / 3.207 = ₹31.18. This means today\'s ₹100 will buy only about ₹31 worth of goods in 20 years at 6% inflation. This dramatic erosion illustrates why investing (not just saving) is essential.',
          },
          {
            question: 'A Fixed Deposit offers 6.5% interest. For an investor in the 30% tax bracket with inflation at 5%, the real post-tax return is approximately:',
            options: [
              '+1.5%',
              '+0.5%',
              '-0.4%',
              '-1.5%',
            ],
            correctAnswer: 2,
            explanation: 'Post-tax return = 6.5% x (1 - 0.30) = 4.55%. Real return = ((1.0455) / (1.05)) - 1 = -0.43%, approximately -0.4%. The investor is actually losing purchasing power despite earning "interest." This calculation is critical for client education and NISM exam preparation.',
          },
          {
            question: 'Which of the following types of inflation is typically the highest in India?',
            options: [
              'Food inflation',
              'Fuel inflation',
              'Education and healthcare inflation',
              'Housing inflation',
            ],
            correctAnswer: 2,
            explanation: 'Education inflation (10-12% per annum) and healthcare inflation (12-15% per annum) are significantly higher than general CPI inflation (5-6%) in India. This is crucial for planning education and retirement goals, as using general inflation rates would severely underestimate the future cost.',
          },
          {
            question: 'The RBI\'s current inflation targeting framework aims for CPI inflation of:',
            options: [
              '2% with a tolerance band of +/- 1%',
              '4% with a tolerance band of +/- 2%',
              '6% with a tolerance band of +/- 2%',
              '5% with no tolerance band',
            ],
            correctAnswer: 1,
            explanation: 'Under the flexible inflation targeting framework adopted in 2016, the RBI targets CPI inflation at 4% with a tolerance band of +/- 2% (i.e., 2% to 6%). This is an important NISM exam topic and helps understand RBI\'s monetary policy decisions that impact debt fund returns.',
          },
        ],
        summaryNotes: [
          'Inflation is the sustained rise in prices that erodes purchasing power — at 5-6%, costs double every 12-14 years and today\'s ₹100 becomes worth just ₹31-38 in 20 years',
          'FDs in higher tax brackets often deliver near-zero or NEGATIVE real returns — the investor feels safe but purchasing power stagnates or declines',
          'Education inflation (10-12%) and healthcare inflation (12-15%) are far higher than general CPI (4-5%) — use category-specific rates for goal planning',
          'Equity mutual funds are the only widely accessible asset class that has consistently beaten inflation over long periods in India',
          'Always present investment returns in real (inflation-adjusted, post-tax) terms to clients — nominal returns create a dangerous "money illusion"',
        ],
        relatedTopics: ['what-is-sip', 'debt-funds', 'measuring-returns', 'scheme-selection-needs'],
      },
    },

    // ── Section 8: Asset Allocation ───────────────────────────────────
    {
      id: 'asset-allocation',
      title: 'Asset Allocation — Don\'t Put All Eggs in One Basket',
      slug: 'asset-allocation',
      content: {
        definition: 'Asset allocation is the strategic distribution of an investment portfolio across different asset classes — primarily equity, debt, and gold — based on an investor\'s financial goals, risk tolerance, time horizon, and life stage. It is widely considered the single most important investment decision, with studies showing that asset allocation determines over 90% of a portfolio\'s long-term return variability. The core principle is that different asset classes perform differently under different market conditions, so a well-allocated portfolio delivers more consistent risk-adjusted returns than any single asset class alone.',
        explanation: 'Market experience consistently shows that brilliant stock-pickers can lose money because of poor asset allocation, while average investors build great wealth because they got their allocation right. The essential principle is that asset allocation is not about picking the "best" fund — it is about building a portfolio that can weather any market storm. The simplest starting framework is the age-based rule: "100 minus age equals equity percentage." So a 30-year-old would have 70% in equity and 30% in debt. A 55-year-old would have 45% in equity and 55% in debt. But this is just a starting point — the actual allocation should consider the full picture: goals, income stability, existing assets, insurance cover, and temperament. Beyond the age rule, goal-based allocation is more precise. Each goal gets its own asset allocation based on its time horizon: Goals less than 2 years away — 100% debt (liquid or ultra-short funds). Goals 2-5 years away — 30-40% equity, 60-70% debt. Goals 5-10 years away — 60-70% equity, 30-40% debt. Goals 10+ years away — 80-100% equity. An often-missed but critical component is rebalancing. Over time, if equity rallies, a 70:30 portfolio might drift to 80:20. Annual rebalancing — selling some equity and buying debt to restore the target allocation — enforces the discipline of "buy low, sell high." The NISM exam tests asset allocation concepts heavily, and in practice, it is the skill that separates good distributors from great ones.',
        realLifeExample: 'Here are two illustrative portfolio constructions:\n\nPortfolio A — Anita, age 30, IT professional earning ₹1.5 lakhs/month:\nGoals: Retirement at 55 (25 years), Child\'s education at 18 (15 years from now), Emergency fund (immediate).\nAsset Allocation: 75% Equity, 15% Debt, 10% Gold.\nActual portfolio: ₹25,000/month SIP in flexi-cap fund (equity), ₹10,000/month in mid-cap fund (equity), ₹5,000/month in international equity fund, ₹8,000/month in short-duration debt fund (for education goal), ₹4,000/month in Sovereign Gold Bond (gold), ₹3 lakhs in liquid fund (emergency reserve). Total monthly SIP: ₹48,000. Rebalancing annually.\n\nPortfolio B — Mr. Kulkarni, age 55, retiring next year:\nGoals: Monthly income post-retirement, Medical emergency fund, Legacy for children.\nAsset Allocation: 35% Equity, 50% Debt, 10% Gold, 5% Liquid.\nActual portfolio: ₹35 lakhs in balanced advantage fund (equity + debt dynamic), ₹25 lakhs in banking & PSU debt fund (stable income), ₹15 lakhs in corporate bond fund, ₹10 lakhs in Sovereign Gold Bonds, ₹5 lakhs in overnight fund (immediate liquidity). Total corpus: ₹90 lakhs. SWP of ₹30,000/month from balanced advantage fund for monthly income. Rebalancing semi-annually.\n\nBoth portfolios are diversified across asset classes but the proportions are completely different based on age, goals, and risk profile.',
        keyPoints: [
          'Asset allocation determines over 90% of long-term portfolio return variability — it matters more than individual fund selection',
          'Age-based rule (starting point): 100 minus age = equity %. A 30-year-old: 70% equity, 20% debt, 10% gold. A 55-year-old: 45% equity, 40% debt, 10% gold, 5% liquid',
          'Goal-based allocation: <2 years = 100% debt; 2-5 years = 30-40% equity; 5-10 years = 60-70% equity; 10+ years = 80-100% equity',
          'Rebalancing is the discipline of restoring target allocation periodically (annually or when allocation drifts beyond 5-10%) — it enforces buy low, sell high',
          'Strategic allocation (long-term target based on goals) vs Tactical allocation (short-term adjustments based on market valuations) — start with strategic',
          'Core-satellite approach: 70-80% in diversified core funds (large-cap, flexi-cap) + 20-30% in satellite funds (mid/small-cap, thematic) for alpha generation',
          'Model portfolio for a 30-year-old: 40% flexi-cap, 20% mid-cap, 10% international equity, 15% short-duration debt, 10% gold, 5% liquid/emergency',
          'Model portfolio for a 55-year-old: 20% balanced advantage, 15% large-cap equity, 25% banking & PSU debt, 15% corporate bond, 10% gold, 10% liquid, 5% overnight',
        ],
        faq: [
          {
            question: 'What is the "100 minus age" rule for asset allocation?',
            answer: 'The "100 minus age" rule is a simple starting framework for equity allocation. Subtract your age from 100 to get the percentage you should allocate to equity. A 30-year-old would put 70% in equity and 30% in debt/gold. A 50-year-old would put 50% in equity and 50% in debt/gold. This rule works because younger investors have more time to recover from market downturns. However, it is just a starting point — actual allocation should consider goals, income, risk tolerance, and other factors.',
          },
          {
            question: 'How often should I rebalance my portfolio?',
            answer: 'There are two common approaches: Calendar rebalancing (annually or semi-annually, regardless of market conditions) and Threshold rebalancing (when any asset class deviates more than 5-10% from its target allocation). Annual calendar rebalancing is the most practical for most clients. For example, if your target is 70% equity and equity rallies to 80%, sell enough equity and buy debt to restore the 70:30 ratio.',
          },
          {
            question: 'Should my asset allocation change as I get older?',
            answer: 'Yes, this is called a "glide path." As you approach your goal (like retirement), your equity allocation should gradually decrease and debt allocation should increase. This reduces portfolio volatility as you get closer to needing the money. Many target-date retirement funds automatically adjust allocation over time. A typical glide path: Age 30 (75% equity) -> Age 40 (65% equity) -> Age 50 (50% equity) -> Age 60 (35% equity).',
          },
          {
            question: 'What is the core-satellite approach to portfolio construction?',
            answer: 'The core-satellite approach splits the portfolio into two parts: the "core" (70-80%) consists of stable, diversified funds like large-cap or flexi-cap that provide market returns with lower risk. The "satellite" (20-30%) consists of higher-risk, potentially higher-return funds like mid-cap, small-cap, or sectoral funds that aim to generate alpha (excess returns). This approach balances stability with growth opportunity.',
          },
          {
            question: 'Can balanced advantage funds or multi-asset funds replace manual asset allocation?',
            answer: 'Balanced advantage funds (BAFs) and multi-asset funds do provide automatic asset allocation and rebalancing, making them excellent single-fund solutions, especially for new investors or those who want simplicity. However, they offer limited customization — you cannot control the exact equity-debt split or choose specific styles within each asset class. For larger portfolios (₹10 lakhs+), a customized multi-fund portfolio with periodic rebalancing typically offers better control and tax efficiency.',
          },
        ],
        mcqs: [
          {
            question: 'According to research, what percentage of a portfolio\'s long-term return variability is determined by asset allocation?',
            options: [
              'About 25%',
              'About 50%',
              'About 70%',
              'Over 90%',
            ],
            correctAnswer: 3,
            explanation: 'The landmark Brinson, Hood, and Beebower study found that asset allocation policy explains over 90% of the variability in a portfolio\'s returns over time. Individual stock or fund selection and market timing play a much smaller role. This underscores why getting asset allocation right is the most important investment decision.',
          },
          {
            question: 'Using the "100 minus age" rule, what should be the approximate equity allocation for a 40-year-old investor?',
            options: [
              '40%',
              '50%',
              '60%',
              '70%',
            ],
            correctAnswer: 2,
            explanation: 'Using the "100 minus age" rule: 100 - 40 = 60% in equity. The remaining 40% would be split between debt and gold/other asset classes. This is a starting framework that should be adjusted based on the individual\'s goals, risk tolerance, and overall financial situation.',
          },
          {
            question: 'A client has a goal that is 3 years away. What would be the most appropriate asset allocation?',
            options: [
              '100% equity mutual funds',
              '80% equity, 20% debt',
              '30-40% equity, 60-70% debt',
              '100% small-cap equity funds',
            ],
            correctAnswer: 2,
            explanation: 'For goals 2-5 years away, the recommended allocation is 30-40% equity and 60-70% debt. This provides some growth potential while protecting the capital needed in the near term. Pure equity is too volatile for a 3-year horizon, and 100% debt may not provide adequate returns to meet the goal.',
          },
          {
            question: 'Rebalancing a portfolio primarily helps an investor to:',
            options: [
              'Maximize short-term returns',
              'Maintain the target risk level and enforce disciplined buying low and selling high',
              'Avoid paying taxes on capital gains',
              'Eliminate all investment risk',
            ],
            correctAnswer: 1,
            explanation: 'Rebalancing restores the portfolio to its target asset allocation, ensuring the risk level stays aligned with the investor\'s profile. By selling outperforming assets (selling high) and buying underperforming assets (buying low), it enforces investment discipline. It does not eliminate risk or avoid taxes — in fact, rebalancing may trigger capital gains tax.',
          },
        ],
        summaryNotes: [
          'Asset allocation — not fund selection — is the most important investment decision, determining over 90% of long-term return variability',
          'The "100 minus age" rule provides a simple starting framework: a 30-year-old puts 70% in equity, a 55-year-old puts 45% — adjust based on individual factors',
          'Goal-based allocation aligns each goal with the right equity-debt mix based on time horizon: short-term (debt heavy), long-term (equity heavy)',
          'Annual rebalancing maintains the target allocation and enforces the discipline of buying undervalued assets and trimming overvalued ones',
          'A great distributor builds customized, diversified portfolios for each client rather than recommending the same "best fund" to everyone',
        ],
        relatedTopics: ['what-is-mutual-fund', 'equity-funds', 'debt-funds', 'sebi-categories', 'scheme-selection-needs'],
      },
    },
  ],
};
