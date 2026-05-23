import { GyanCategory } from '@/types/mf-gyan';

export const FINANCIAL_ANALYSIS: GyanCategory = {
  id: 'financial-analysis',
  title: 'Financial Analysis',
  description:
    'Key analytical concepts — from asset allocation to volatility — that help you evaluate investments and advise clients.',
  icon: 'BarChart3',
  color: 'text-amber-600',
  bgColor: 'bg-amber-50',
  gradientFrom: 'from-amber-500',
  gradientTo: 'to-amber-700',
  topics: [
    /* ──────────────────────────── 1 ──────────────────────────── */
    {
      id: 'asset-allocation',
      title: 'Asset Allocation',
      description: 'Spreading investments across asset classes to balance risk and return.',
      readTime: '5 min',
      content: [
        'There is a famous study from the 1980s by Brinson, Hood, and Beebower that found over 90% of a portfolio\'s return variability comes not from which stocks you pick, but from how you divide your money across asset classes — equity, debt, gold, real estate, and cash. That single insight is why asset allocation is considered the most important investment decision you will ever make. It is the investment equivalent of not putting all your eggs in one basket.',

        'Let us make it tangible. Imagine two investors with Rs 50 lakh each in April 2026. Investor A puts everything in the Nifty 50 index. Investor B splits it: 50% in Nifty 50, 30% in a short-duration debt fund, 10% in gold ETF, and 10% in a liquid fund. In a great year where Nifty returns 18%, Investor A earns Rs 9 lakh. Investor B earns roughly Rs 6.5 lakh — less, but still excellent. But in a year where Nifty crashes 25%, Investor A loses Rs 12.5 lakh. Investor B loses only about Rs 5.5 lakh (equity loses Rs 6.25 lakh, but debt earns Rs 1.05 lakh, gold rises Rs 75,000 in a crash, and liquid fund earns Rs 35,000). The diversified portfolio survives the crash with far less damage.',

        'The right asset allocation depends on three factors: time horizon, risk tolerance, and financial goals. A 28-year-old saving for retirement 30 years away can afford 80% equity because they have decades to ride out crashes. A 58-year-old two years from retirement needs 70-80% in debt and liquid instruments because they cannot afford a 30% equity drawdown right before they need the money. A common rule of thumb is "100 minus age = equity percentage," but this is just a starting point — actual allocation should be customized.',

        'For MFDs, asset allocation is where you add the most value. Any client can pick a top-rated fund from a screener. But constructing a portfolio that balances growth with stability, rebalancing it annually, and preventing the client from abandoning the plan during a crash — that requires professional guidance. Rebalancing is particularly powerful: when equity has a great year and grows from 60% to 70% of the portfolio, you sell some equity and buy debt to bring it back to 60%. This systematically forces "sell high, buy low" behavior.',

        'A practical framework for Indian investors in April 2026: Conservative (retirees, 1-3 year goals) — 20% equity, 60% debt, 10% gold, 10% liquid. Moderate (5-7 year goals, mid-career professionals) — 50-60% equity, 25-30% debt, 10% gold. Aggressive (10+ year goals, young earners) — 70-80% equity, 10-15% debt, 5-10% gold. Always review and rebalance once a year, and revisit the allocation when the client\'s life circumstances change — marriage, children, job loss, inheritance, or retirement.'
      ],
      keyTakeaways: [
        'Over 90% of portfolio return variability comes from asset allocation decisions, not individual stock or fund selection.',
        'Diversification across equity, debt, gold, and cash reduces drawdown severity in market crashes.',
        'Time horizon, risk tolerance, and financial goals determine the right asset allocation — "100 minus age" is a starting point, not a rule.',
        'Annual rebalancing systematically enforces "sell high, buy low" behavior across asset classes.',
        'The MFD\'s highest-value service is constructing, rebalancing, and protecting the asset allocation plan through market cycles.'
      ],
    },

    /* ──────────────────────────── 2 ──────────────────────────── */
    {
      id: 'beta',
      title: 'Beta',
      description: 'Measuring a stock\'s sensitivity to overall market movements.',
      readTime: '4 min',
      content: [
        'You are evaluating two stocks for a client\'s portfolio. Stock A moves almost in lockstep with the Nifty — when the Nifty goes up 2%, Stock A goes up about 2%. Stock B is more dramatic — when the Nifty goes up 2%, Stock B jumps 4%, but when the Nifty falls 2%, Stock B drops 4%. The number that captures this sensitivity is called beta. Stock A has a beta of 1.0 (moves with the market), while Stock B has a beta of 2.0 (moves twice as much as the market in either direction).',

        'Mathematically, beta is the covariance of a stock\'s returns with the market\'s returns, divided by the variance of the market\'s returns. But you do not need to calculate it yourself — every stock screener and mutual fund factsheet provides beta. A beta of 1.0 means the stock moves in line with the market. Beta above 1.0 means the stock is more volatile than the market (amplifies market moves). Beta below 1.0 means it is less volatile (dampens market moves). A beta of 0 would mean no correlation with the market at all.',

        'Different sectors have characteristically different betas. Banking and financial stocks in India tend to have betas of 1.1-1.4 — they amplify market moves because they are leveraged businesses sensitive to economic cycles. IT stocks like TCS and Infosys often have betas of 0.6-0.8 — partly because their revenues are in USD, which acts as a natural hedge when Indian markets fall (rupee weakens, boosting their earnings). FMCG stocks like HUL and Nestle typically have betas of 0.5-0.7 — defensive businesses with stable demand.',

        'For portfolio construction, beta helps you control overall portfolio volatility. If a client wants a moderate-risk portfolio, aim for a weighted portfolio beta close to 0.8-0.9. If they want an aggressive portfolio, a beta of 1.1-1.3 makes sense. During market downturns, a low-beta portfolio will lose less, but during bull runs, it will also gain less. There is no free lunch — lower beta means lower volatility in both directions. The key is matching portfolio beta to the client\'s actual risk capacity, not just their stated risk appetite.'
      ],
      keyTakeaways: [
        'Beta measures a stock\'s sensitivity to market movements — beta of 1.0 means it moves with the market.',
        'Beta above 1.0 amplifies market moves (more volatile); below 1.0 dampens them (less volatile).',
        'Banking stocks typically have high beta (1.1-1.4); IT and FMCG stocks have low beta (0.5-0.8) in India.',
        'Portfolio beta = weighted average of individual stock betas — use it to match portfolio volatility to client risk capacity.',
        'Low beta reduces losses in downturns but also limits gains in bull markets — there is no free lunch.'
      ],
    },

    /* ──────────────────────────── 3 ──────────────────────────── */
    {
      id: 'time-value-of-money',
      title: 'Time Value of Money',
      description: 'Why Rs 100 today is worth more than Rs 100 a year from now.',
      readTime: '4 min',
      content: [
        'If someone offers you a choice — Rs 1,00,000 today or Rs 1,00,000 one year from now — which would you pick? The answer is obviously today. But why? Three reasons: (1) Inflation erodes purchasing power — at 5% inflation, Rs 1,00,000 next year buys what Rs 95,238 buys today. (2) Opportunity cost — you could invest that Rs 1,00,000 today in a fixed deposit at 7% and have Rs 1,07,000 next year. (3) Uncertainty — who knows what will happen in a year? Money in hand eliminates risk. This concept — that money available today is worth more than the same amount in the future — is the Time Value of Money (TVM).',

        'TVM is the foundation of virtually all financial calculations. When you calculate SIP returns, you are applying TVM. When a company evaluates a new factory investment, it uses TVM. When a bond is priced, TVM is at work. The core formula is: Future Value = Present Value x (1 + r)^n, where r is the rate of return and n is the number of periods. If you invest Rs 1,00,000 at 12% for 10 years: FV = 1,00,000 x (1.12)^10 = Rs 3,10,585. Your money more than triples.',

        'The reverse calculation is equally important: Present Value = Future Value / (1 + r)^n. This tells you what a future sum is worth today. If a client needs Rs 1 crore for retirement in 15 years and you assume a 12% return, the present value is: 1,00,00,000 / (1.12)^15 = Rs 18,27,000. That means the client needs to invest a lump sum of Rs 18.27 lakh today (or set up equivalent SIPs) to reach their goal. This is the basis of all goal-based financial planning.',

        'The power of compounding — often called the eighth wonder of the world — is TVM in action. A Rs 10,000 monthly SIP at 12% CAGR for 10 years gives Rs 23.2 lakh. Extend it to 20 years and you get Rs 99.9 lakh. Double the time, but quadruple the corpus. The extra 10 years do not just add more principal — they compound the returns on earlier returns. This is why starting early is the single most powerful financial decision. An investor who starts at 25 needs to invest roughly half of what someone starting at 35 needs to accumulate the same retirement corpus.',

        'For MFDs, TVM is the language of client conversations. When a client says "I\'ll start investing next year," show them the cost of delay: even a one-year delay on a Rs 15,000 monthly SIP reduces the 25-year corpus by Rs 18-20 lakh at 12% returns. When they ask "why not just keep money in FD?", show them how a 7% FD barely beats 5% inflation, giving only 2% real return, while equity at 12% gives 7% real return — a massive difference over 20 years.'
      ],
      keyTakeaways: [
        'Money today is worth more than the same amount in the future due to inflation, opportunity cost, and uncertainty.',
        'Future Value = PV x (1 + r)^n; Present Value = FV / (1 + r)^n — these formulas underpin all financial planning.',
        'Compounding turns time into a wealth multiplier: doubling the investment period can quadruple the corpus.',
        'Starting a SIP even one year earlier can add Rs 18-20 lakh to a 25-year corpus — always show clients the cost of delay.',
        'Real return (nominal return minus inflation) is what matters — a 7% FD at 5% inflation gives only 2% real return.'
      ],
    },

    /* ──────────────────────────── 4 ──────────────────────────── */
    {
      id: 'net-present-value',
      title: 'Net Present Value (NPV)',
      description: 'Discounting future cash flows to decide if an investment is worth making.',
      readTime: '4 min',
      content: [
        'Imagine a client is considering investing Rs 50 lakh in a commercial property that is expected to generate rental income of Rs 4 lakh per year for 10 years and can be sold for Rs 70 lakh at the end. Should they do it? The answer depends on the Net Present Value — the sum of all future cash flows discounted back to today\'s value, minus the initial investment.',

        'Here is the logic: that Rs 4 lakh rental income received in year 5 is not worth Rs 4 lakh today. If the discount rate (the return the client could earn elsewhere, say 10%) is applied, Rs 4 lakh in year 5 is worth Rs 4,00,000 / (1.10)^5 = Rs 2,48,369 today. You apply this discounting to every future cash flow — each year\'s rent and the final sale price — and add them up. If the total exceeds Rs 50 lakh (the initial investment), the NPV is positive and the investment makes financial sense. If it is less, the NPV is negative and the client is better off investing elsewhere.',

        'NPV is used extensively in corporate finance. When Tata Steel evaluates whether to build a new steel plant, or when Reliance decides whether to invest in a new retail store, they calculate the NPV of all expected future cash flows from that project. If NPV is positive, the project creates value. If negative, it destroys value. The discount rate used is typically the company\'s Weighted Average Cost of Capital (WACC) — the blended cost of its debt and equity financing.',

        'For mutual fund professionals, NPV thinking is relevant in two ways. First, when doing goal-based planning, you are essentially doing an NPV calculation in reverse — figuring out how much to invest today (present value) to achieve a future goal (future value) at a given rate of return. Second, when comparing two investment options for a client — say a rental property vs a mutual fund SIP — NPV gives you a rigorous framework to compare apples to apples. Always discount at the client\'s opportunity cost of capital, not at an arbitrary rate.'
      ],
      keyTakeaways: [
        'NPV = Sum of discounted future cash flows minus initial investment — positive NPV means the investment creates value.',
        'Every future cash flow must be discounted to its present value using the appropriate discount rate.',
        'Companies use NPV (with WACC as discount rate) to evaluate capital projects — positive NPV projects get approved.',
        'Goal-based financial planning is essentially reverse NPV — calculating how much to invest today to reach a future target.',
        'When comparing different investment options for clients, NPV provides a rigorous apples-to-apples framework.'
      ],
    },

    /* ──────────────────────────── 5 ──────────────────────────── */
    {
      id: 'mark-to-market',
      title: 'Mark-to-Market Accounting',
      description: 'Valuing assets at current market price rather than purchase cost.',
      readTime: '4 min',
      content: [
        'Your client bought 500 shares of HDFC Bank at Rs 1,400 three years ago. Today, the stock trades at Rs 1,750. The historical cost of the holding is Rs 7,00,000, but the current market value is Rs 8,75,000. Which number matters? In mark-to-market (MTM) accounting, the answer is the current market value. MTM means revaluing an asset to its current market price, reflecting what it is actually worth today rather than what was originally paid.',

        'Mutual fund NAVs are calculated using mark-to-market principles every single day. When the AMC computes the NAV at the end of the day, every stock in the portfolio is valued at its closing market price, and every bond is valued based on current yields (which we will discuss shortly). This is why your SIP units show different values every day — the underlying portfolio is being marked to market daily.',

        'Mark-to-market became a hot topic in India\'s debt mutual fund space after the Franklin Templeton crisis in 2020. Debt funds hold bonds that may not trade every day. When a bond does not trade, its value must be estimated based on current interest rates, credit quality, and similar bonds. If credit quality deteriorates (say, a company is downgraded), the bond must be marked down even if the fund has not actually sold it. This "paper loss" reduces the NAV. The Franklin funds held several illiquid, lower-rated bonds that had to be sharply marked down when credit conditions worsened, leading to NAV drops that alarmed investors.',

        'SEBI now mandates stricter MTM norms for debt funds, requiring bonds above 30-day maturity to be marked to market daily based on valuation from agencies like CRISIL, ICRA, or AMFI. Only overnight and liquid fund holdings under 30 days can be valued on an amortization basis (spreading the income evenly over the holding period). For MFDs, understanding MTM is essential when explaining debt fund NAV volatility to clients. A short-term NAV dip in a debt fund due to MTM is not the same as an actual default — it is a temporary accounting adjustment that reverses if the bond is held to maturity and the issuer pays as promised.'
      ],
      keyTakeaways: [
        'Mark-to-market values assets at current market price, not historical purchase cost — reflecting real-time worth.',
        'Mutual fund NAVs are calculated daily using MTM principles for all underlying securities.',
        'Debt fund MTM can cause temporary NAV dips when bond yields rise or credit ratings are downgraded — this is not the same as a default.',
        'SEBI mandates daily MTM for bonds above 30-day maturity; only overnight instruments can use amortization-based valuation.',
        'Educate clients that short-term MTM-driven NAV dips in debt funds often reverse if bonds are held to maturity and issuers pay on time.'
      ],
    },

    /* ──────────────────────────── 6 ──────────────────────────── */
    {
      id: 'top-down-vs-bottom-up',
      title: 'Top Down vs Bottom Up Investing',
      description: 'Two contrasting approaches to stock selection and portfolio construction.',
      readTime: '4 min',
      content: [
        'Imagine two fund managers sitting across the table, both tasked with building an Indian equity portfolio. The first says, "India\'s GDP is growing at 7%, the government is spending heavily on infrastructure, and interest rates are likely to come down. I should overweight capital goods, cement, and banking stocks." That is top-down investing — starting with the macro picture and drilling down to sectors and then specific stocks.',

        'The second fund manager says, "I don\'t care what the economy does. I found this mid-cap chemical company with 25% ROCE, zero debt, strong cash flows, and a PE of just 18. The business will do well regardless of macro conditions." That is bottom-up investing — starting with individual company analysis and building a portfolio one stock at a time based on business quality and valuation, regardless of sector or macro trends.',

        'Both approaches have merit, and most successful fund managers use a blend. Pure top-down can lead you to invest in mediocre companies just because they are in the "right" sector. If you decide banking is the best sector but invest in a poorly managed bank, sector tailwinds will not save you. Pure bottom-up can lead you to build a portfolio that is inadvertently concentrated — if you pick stocks purely on merit, you might end up with 40% in one sector without realizing it.',

        'For MFDs evaluating mutual fund managers, understanding their approach helps set expectations. A top-down manager\'s fund will be highly sensitive to macro calls — if their view on interest rates or government spending is wrong, the fund underperforms. A bottom-up manager\'s fund tends to be more consistent because individual company quality is less dependent on macro factors. In India, many of the best-performing flexi-cap and multi-cap fund managers lean bottom-up with a top-down overlay — they pick great companies first, but check that the overall portfolio does not have excessive sector concentration or macro risk.'
      ],
      keyTakeaways: [
        'Top-down starts with macro (GDP, rates, policy) and drills down to sectors and stocks; bottom-up starts with individual company analysis.',
        'Pure top-down risks investing in mediocre companies in the "right" sector; pure bottom-up risks unintentional sector concentration.',
        'Most successful fund managers blend both approaches — bottom-up stock selection with top-down macro awareness.',
        'Top-down funds are sensitive to macro call accuracy; bottom-up funds tend to be more consistent across market conditions.',
        'Understanding a fund manager\'s approach helps MFDs set proper client expectations about when the fund will shine and when it may lag.'
      ],
    },

    /* ──────────────────────────── 7 ──────────────────────────── */
    {
      id: 'price-discovery',
      title: 'Price Discovery in Stock Market',
      description: 'How buyers and sellers arrive at a stock\'s market price.',
      readTime: '4 min',
      content: [
        'At any given moment during market hours, the NSE order book for a stock like Infosys might show: buyers willing to pay Rs 1,578, 1,577, 1,576 (bids), and sellers willing to sell at Rs 1,579, 1,580, 1,581 (asks). The gap between the highest bid and the lowest ask — Rs 1,578 vs Rs 1,579 in this case — is the bid-ask spread. When a buyer agrees to pay Rs 1,579 or a seller agrees to accept Rs 1,578, a trade happens and that becomes the "last traded price." This continuous process of buyers and sellers negotiating through their orders is called price discovery.',

        'Price discovery is the stock market\'s fundamental function. Every piece of information — quarterly results, management commentary, global events, RBI policy, sector trends, analyst reports — gets processed by millions of participants and translated into buy or sell orders. When TCS announces better-than-expected earnings, buyers rush in, pushing the price up. When a company\'s auditor flags concerns, sellers dominate and the price drops. The resulting price, at any point, is the market\'s collective assessment of what the company is worth.',

        'In India, stock exchanges use an electronic order-matching system. The NSE\'s matching engine processes orders based on price-time priority — the best price gets matched first, and among orders at the same price, the earliest order gets priority. Market orders (buy/sell at whatever the current price is) execute immediately. Limit orders (buy at Rs 1,575 or less, sell at Rs 1,582 or more) sit in the order book until a matching counter-order arrives. The pre-open session (9:00-9:08 AM) uses a call auction mechanism to determine the opening price, collecting orders for 8 minutes and then calculating the price that maximizes traded volume.',

        'For financial professionals, understanding price discovery explains many phenomena. Why do stock prices gap up or gap down at open? Because overnight news creates a supply-demand imbalance that the pre-open auction resolves at a different price from the previous close. Why do small cap stocks show higher volatility? Because fewer participants mean less liquidity, so a single large order can move the price significantly. Why do ETFs sometimes trade at a premium or discount to NAV? Because the ETF\'s price is determined by exchange supply-demand, which may temporarily diverge from the underlying basket value.'
      ],
      keyTakeaways: [
        'Price discovery is the continuous process of buyers and sellers negotiating through orders to arrive at a stock\'s market price.',
        'The bid-ask spread (gap between highest buy and lowest sell order) reflects market liquidity — tighter spreads mean more liquid stocks.',
        'India\'s exchanges use electronic price-time priority matching; the pre-open call auction determines the opening price.',
        'Stock prices reflect the market\'s collective processing of all available information — earnings, policy, global events, and sentiment.',
        'Low liquidity (common in small caps) means fewer participants and wider spreads, leading to higher volatility and price impact.'
      ],
    },

    /* ──────────────────────────── 8 ──────────────────────────── */
    {
      id: 'roce',
      title: 'Return on Capital Employed (ROCE)',
      description: 'How efficiently a company uses its total capital to generate operating profit.',
      readTime: '4 min',
      content: [
        'Imagine two companies, each with Rs 100 crore of capital (equity plus long-term debt). Company A generates Rs 20 crore in operating profit (EBIT). Company B generates Rs 12 crore. Which business is more efficient? Company A, obviously — it earns Rs 20 for every Rs 100 of capital employed, giving a ROCE of 20%. Company B earns only 12%. ROCE tells you how well a company converts its total invested capital into operating earnings.',

        'The formula is: ROCE = EBIT / Capital Employed, where Capital Employed = Total Assets minus Current Liabilities (or equivalently, Equity + Long-term Debt). EBIT (Earnings Before Interest and Tax) is used instead of net profit because ROCE measures operational efficiency independent of the company\'s financing structure or tax rate. A company funded entirely by equity and one funded 50% by debt can be compared on an apples-to-apples basis using ROCE.',

        'What constitutes a "good" ROCE? In India, a ROCE above 15% is generally considered healthy. Companies like Asian Paints, Pidilite, or Bajaj Finance consistently deliver ROCE above 20-25%, which is why they command premium valuations. Capital-intensive businesses like steel, power, and telecom tend to have lower ROCE (8-12%) because they need massive fixed assets relative to the profits they generate. When comparing ROCE, always compare within the same industry — comparing Asian Paints\' ROCE with Tata Steel\'s would be misleading.',

        'For stock analysis, look for companies with high and improving ROCE. A company that has grown ROCE from 12% to 18% over five years is becoming more efficient — perhaps through better working capital management, higher-margin products, or operating leverage. Conversely, a declining ROCE (even if profits are rising) might mean the company is deploying capital into low-return projects. Many of India\'s best wealth-creating stocks — Page Industries, Nestle India, HDFC Bank — have maintained ROCE above 20% for over a decade. ROCE consistency is as important as the absolute level.'
      ],
      keyTakeaways: [
        'ROCE = EBIT / Capital Employed — it measures how efficiently a company uses its total capital to generate operating profit.',
        'EBIT is used (not net profit) to compare companies regardless of financing structure or tax rates.',
        'ROCE above 15% is generally healthy in India; premium companies like Asian Paints and Bajaj Finance deliver 20-25%+.',
        'Always compare ROCE within the same industry — capital-intensive sectors naturally have lower ROCE than asset-light businesses.',
        'Consistent ROCE above 20% over a decade is a hallmark of India\'s best wealth-creating stocks.'
      ],
    },

    /* ──────────────────────────── 9 ──────────────────────────── */
    {
      id: 'ronw-roe',
      title: 'Return on Net Worth (RONW / ROE)',
      description: 'Measuring how much profit a company generates per rupee of shareholder equity.',
      readTime: '4 min',
      content: [
        'If ROCE tells you how well a company uses all its capital, Return on Net Worth (RONW) — also called Return on Equity (ROE) — tells you how well it uses specifically the shareholders\' money. The formula is simple: ROE = Net Profit / Shareholders\' Equity. If a company has Rs 500 crore of equity and earns Rs 75 crore in net profit, its ROE is 15%. For every Rs 100 the shareholders have invested, the company generates Rs 15 of profit.',

        'ROE is arguably the single most important metric for equity investors because it directly measures the return generated on your ownership stake. Warren Buffett has said he looks for companies with consistently high ROE (above 20%) as his primary screening criterion. In India, companies like Nestle (ROE ~100%+), Bajaj Finance (~20-22%), TCS (~45-50%), and Asian Paints (~25-30%) are perennial ROE champions. Notice the range — it varies massively by industry and capital structure.',

        'Here is where it gets nuanced. A company can artificially boost ROE by taking on more debt. If a company has Rs 100 crore equity, Rs 400 crore debt, and earns Rs 30 crore net profit, its ROE is 30%. But the high ROE is partly because the equity base is small relative to total capital — the company is highly leveraged. This is why you should always look at ROE alongside the debt-equity ratio. High ROE with low debt is genuinely impressive. High ROE with high debt is potentially risky.',

        'The DuPont decomposition breaks ROE into three components: ROE = Net Profit Margin x Asset Turnover x Equity Multiplier. This tells you whether high ROE comes from (1) high margins (the company earns a lot of profit per rupee of revenue), (2) high asset turnover (the company generates a lot of revenue per rupee of assets), or (3) high leverage (the company uses a lot of debt relative to equity). For a sustainable investment, you want ROE driven by margins and asset efficiency, not leverage. A company with 25% ROE driven by 15% margins and 1.67x asset turnover is far more attractive than one with 25% ROE driven by 4x leverage.'
      ],
      keyTakeaways: [
        'ROE = Net Profit / Shareholders\' Equity — it measures how efficiently a company generates returns on shareholder investment.',
        'Consistently high ROE (above 15-20%) is a hallmark of quality companies, but always check alongside debt levels.',
        'DuPont analysis decomposes ROE into margin, asset turnover, and leverage — ROE driven by margins is more sustainable than ROE driven by debt.',
        'Compare ROE within sectors: capital-light businesses (IT, FMCG) naturally have higher ROE than capital-intensive ones (steel, power).',
        'High ROE with low debt-equity ratio is the ideal combination — it signals genuine business quality, not financial engineering.'
      ],
    },

    /* ──────────────────────────── 10 ──────────────────────────── */
    {
      id: 'indexation',
      title: 'Indexation',
      description: 'Adjusting purchase cost for inflation to reduce capital gains tax.',
      readTime: '5 min',
      content: [
        'Your client invested Rs 10 lakh in a debt mutual fund in April 2020 and redeemed it in April 2023 for Rs 13 lakh. Without indexation, the capital gain is Rs 3 lakh, taxed at 20%. With indexation, you adjust the purchase cost using the Cost Inflation Index (CII) published by the government. If CII was 301 in 2020-21 and 348 in 2023-24, the indexed cost becomes Rs 10,00,000 x (348/301) = Rs 11,56,146. The taxable gain drops to Rs 1,43,854, and the tax is just Rs 28,771 instead of Rs 60,000. That is a 52% reduction in tax — the power of indexation.',

        'Indexation works by acknowledging that inflation erodes the real value of your investment. The CII is a number published by the Income Tax Department each year that approximates the general price level. By adjusting your purchase cost upward for inflation, indexation ensures you are taxed only on the real gain (above inflation) rather than the nominal gain. This made long-term debt fund investments significantly more tax-efficient than fixed deposits, where the entire interest is taxed at your slab rate.',

        'Now, here is the critical update for April 2026: the Union Budget 2024 fundamentally changed the indexation landscape. For debt mutual funds purchased after April 1, 2023, indexation benefit is NO LONGER available. These are now taxed at the investor\'s income tax slab rate regardless of holding period. This was a major blow to the debt fund industry. However, for investments made before April 1, 2023, and held for more than 3 years, the old 20% with indexation benefit continues to apply. Many advisors rushed clients into debt fund investments before March 31, 2023, to lock in the indexation benefit.',

        'For real estate, indexation still applies as of April 2026. If a property is sold after holding for more than 2 years, the purchase cost can be indexed using CII, reducing the long-term capital gains tax significantly. This is often a crucial calculation for clients selling inherited property, where the original purchase was decades ago and the CII adjustment dramatically reduces the taxable gain.',

        'For MFDs advising in April 2026, the practical implications are: (1) For new debt fund investments, the tax advantage over FDs has narrowed considerably — focus on other benefits like liquidity, systematic withdrawal plans, and professional management. (2) For clients with pre-April 2023 debt fund investments, advise them to consider the indexation benefit when deciding whether to hold or redeem. (3) For real estate transactions, always calculate the indexed cost — it can save clients lakhs in taxes. (4) For equity investments, indexation is not relevant as LTCG is taxed at a flat 12.5% after the Rs 1.25 lakh exemption.'
      ],
      keyTakeaways: [
        'Indexation adjusts purchase cost for inflation using the Cost Inflation Index, reducing taxable capital gains to reflect only real (above-inflation) gains.',
        'Budget 2024 removed indexation for debt mutual funds purchased after April 1, 2023 — they are now taxed at slab rate regardless of holding period.',
        'Pre-April 2023 debt fund investments held 3+ years still get the 20% with indexation benefit — advise clients to factor this before redeeming.',
        'Real estate indexation still applies (April 2026) — indexed cost can save significant tax, especially on inherited property held for decades.',
        'For equity investments, indexation is irrelevant — LTCG is taxed at a flat 12.5% above Rs 1.25 lakh annual exemption.'
      ],
    },

    /* ──────────────────────────── 11 ──────────────────────────── */
    {
      id: 'base-effect',
      title: 'Base Effect',
      description: 'How the reference period\'s size dramatically affects growth percentage calculations.',
      readTime: '4 min',
      content: [
        'In April 2021, India reported GDP growth of over 20% for Q1 FY22. Headlines screamed "India\'s economy roaring back!" But was it really that spectacular? Not quite. The previous year\'s Q1 (April-June 2020) saw GDP contract by nearly 24% due to the COVID lockdown. Growing 20% over a deeply depressed base is very different from growing 20% over a normal base. This is the base effect — the phenomenon where growth percentages are distorted by an unusually high or low reference period.',

        'Let us simplify with a mutual fund example. A fund\'s NAV drops from Rs 100 to Rs 60 in a crash year (a 40% fall). The next year, it recovers from Rs 60 to Rs 84 — a 40% gain. The marketing team says "Our fund delivered 40% returns!" But the investor is still down from Rs 100 to Rs 84. The 40% gain on a low base of Rs 60 does not recover the 40% loss on the higher base of Rs 100. This is why percentages can be misleading without understanding the base.',

        'The base effect is crucial when analyzing economic data, corporate earnings, and mutual fund performance. When you see a company report "50% profit growth," always ask: what was the base? If last year\'s profit was depressed due to a one-time charge, asset write-off, or cyclical downturn, the 50% growth is flattering but not indicative of sustainable performance. Similarly, when comparing mutual fund 1-year returns, check what the market was doing a year ago — a fund showing 25% annual return in April 2026 is partly because April 2025 was a relatively low point.',

        'For MFDs, the practical application is in how you present performance data to clients. Always show rolling returns (3-year, 5-year, 7-year) rather than point-to-point returns, because rolling returns average out the base effect. If a client asks "why did my fund give only 8% this year when it gave 25% last year?", explain the base effect — the strong 25% was partly because the previous year was weak. Long-term CAGR is the most honest measure of performance because it smooths out base-effect distortions over the entire holding period.'
      ],
      keyTakeaways: [
        'Base effect distorts growth percentages when the reference period is unusually high or low.',
        'A 40% loss followed by a 40% gain does NOT return you to breakeven — understanding the base is critical.',
        'Always ask "what was the base?" when evaluating impressive growth numbers in GDP, corporate earnings, or fund returns.',
        'Use rolling returns (3-year, 5-year) rather than point-to-point returns to neutralize base effect distortions.',
        'Long-term CAGR is the most honest performance measure because it smooths base-effect noise over the holding period.'
      ],
    },

    /* ──────────────────────────── 12 ──────────────────────────── */
    {
      id: 'organic-vs-inorganic-growth',
      title: 'Organic vs Inorganic Growth',
      description: 'Growing from within versus growing through acquisitions and mergers.',
      readTime: '4 min',
      content: [
        'HDFC Bank grew its loan book from Rs 5 lakh crore to Rs 25 lakh crore over 15 years by expanding branches, acquiring new customers, and deepening existing relationships. That is organic growth — expanding the business through internal efforts, using existing capabilities and resources. Contrast this with the HDFC-HDFC Bank merger in 2023, where HDFC Bank\'s balance sheet doubled overnight by absorbing HDFC Ltd\'s entire mortgage portfolio. That is inorganic growth — expanding through acquisitions, mergers, or joint ventures.',

        'Organic growth is generally considered higher quality because it demonstrates that the business model itself is strong enough to expand naturally. A company growing revenue at 15% organically is building genuine customer demand, operational capability, and market share. The growth is sustainable and usually comes with better profit margins because there is no acquisition premium or integration cost. Think of companies like Asian Paints or Pidilite — decades of steady organic growth through product innovation, distribution expansion, and brand building.',

        'Inorganic growth is faster but riskier. When a company acquires another, it pays a premium (often 30-50% above market price), takes on integration complexity, and faces cultural challenges. Many acquisitions destroy value — studies show that 50-70% of M&A deals fail to deliver the expected synergies. In India, examples of successful inorganic growth include Tata Consultancy acquiring CMC and later integrating it seamlessly, and Bharti Airtel\'s acquisition of Zain Africa. Examples of troubled acquisitions include Tata Steel\'s Corus acquisition and the challenges Vodafone-Idea faced post-merger.',

        'For financial analysis, when a company reports strong revenue growth, always check how much is organic and how much is inorganic. A tech company that "grew revenue 40%" but did it entirely by acquiring another company has not proven organic demand for its products. Look at same-store sales growth (for retail), like-for-like revenue growth, or the company\'s disclosure of organic vs acquired revenue. As an MFD, when evaluating a mutual fund\'s portfolio, prefer funds that invest in companies with strong organic growth — these businesses are more likely to sustain their growth trajectory over the long term.'
      ],
      keyTakeaways: [
        'Organic growth comes from internal expansion (new products, customers, markets); inorganic growth comes from acquisitions and mergers.',
        'Organic growth is generally higher quality — it demonstrates genuine business model strength and is more sustainable.',
        'Inorganic growth is faster but riskier; 50-70% of M&A deals fail to deliver expected synergies.',
        'When analyzing revenue growth, always distinguish between organic and acquired components for a true picture of business momentum.',
        'Prefer companies and funds that demonstrate strong organic growth — it signals sustainable competitive advantage.'
      ],
    },

    /* ──────────────────────────── 13 ──────────────────────────── */
    {
      id: 'sweat-equity',
      title: 'Sweat Equity',
      description: 'Shares issued in exchange for non-cash contributions like expertise and effort.',
      readTime: '4 min',
      content: [
        'A startup founder has a brilliant idea and the technical expertise to build a product, but no cash to invest. The company needs the founder to work full-time for two years to build the platform. Instead of paying a salary, the company issues shares to the founder — these are sweat equity shares. The "sweat" (effort, intellectual property, know-how) is the consideration instead of cash. The Companies Act, 2013, specifically recognizes sweat equity as shares issued at a discount or for consideration other than cash.',

        'Sweat equity is common in startups but is also used by established companies. Under Section 54 of the Companies Act, a company can issue sweat equity shares to employees and directors who have contributed intellectual property rights, know-how, or made value additions. However, there are restrictions: the total sweat equity issued cannot exceed 15% of existing paid-up equity capital in a year (or Rs 5 crore, whichever is higher), and the cumulative sweat equity cannot exceed 25% of paid-up equity capital at any time.',

        'From a tax perspective, sweat equity is treated as a perquisite in the hands of the employee/director. The fair market value of the shares on the date of exercise, minus any amount actually paid by the employee, is taxed as salary income. For example, if sweat equity shares have a fair market value of Rs 500 each and the employee paid Rs 10 per share, Rs 490 per share is taxable as a perquisite. This can create a significant tax burden, especially if the shares are of an unlisted company where the fair market value is determined by a registered valuer.',

        'For financial professionals, sweat equity matters in two contexts. First, when analyzing a company\'s equity structure, a large sweat equity component might indicate that a significant portion of shares were issued without cash inflow — this dilutes other shareholders without bringing in capital. Second, when advising startup founders or senior executives, help them understand the tax implications of sweat equity. Many founders are surprised when they receive a large tax bill on shares they never sold. Planning for this tax liability in advance is crucial.'
      ],
      keyTakeaways: [
        'Sweat equity shares are issued for non-cash contributions — intellectual property, expertise, or value additions — instead of money.',
        'Companies Act limits: 15% of paid-up capital per year and 25% cumulative cap on total sweat equity outstanding.',
        'Sweat equity is taxed as a perquisite — the difference between fair market value and amount paid is treated as salary income.',
        'Large sweat equity components dilute existing shareholders without bringing cash into the company.',
        'Startup founders should plan for the tax liability on sweat equity in advance — the bill can be substantial even before shares are sold.'
      ],
    },

    /* ──────────────────────────── 14 ──────────────────────────── */
    {
      id: 'neft-rtgs-upi',
      title: 'NEFT, RTGS, UPI & IMPS',
      description: 'India\'s payment systems explained — from traditional bank transfers to real-time UPI.',
      readTime: '5 min',
      content: [
        'India\'s digital payment infrastructure is arguably the most advanced in the world as of April 2026, with UPI processing over 18 billion transactions per month. But the system has layers, each serving a different purpose. Let us understand each one, because as a financial professional, your clients will ask about the best way to move money — whether it is a Rs 500 SIP or a Rs 5 crore property transaction.',

        'NEFT (National Electronic Funds Transfer) is an electronic fund transfer system managed by RBI. It works in half-hourly batches — transactions are collected and settled every 30 minutes, 24x7 (since December 2019). If you initiate an NEFT transfer at 10:15 AM, it goes into the 10:30 AM batch. There is no minimum or maximum limit. Banks can charge up to Rs 2.50 for transfers above Rs 10 lakh, but many banks now offer NEFT free. NEFT is ideal for non-urgent transfers where you do not need instant settlement.',

        'RTGS (Real Time Gross Settlement) is for high-value transfers — the minimum amount is Rs 2 lakh, and there is no upper limit. Unlike NEFT, RTGS settles transactions individually and in real time (not in batches). It is available 24x7 since December 2020. RTGS is the preferred mode for large transactions: property purchases, business payments, mutual fund lump sum investments above Rs 2 lakh. The speed and certainty of real-time settlement makes it indispensable for high-value transfers.',

        'IMPS (Immediate Payment Service) was launched by NPCI in 2010 as the first real-time, 24x7 payment system in India. It works through mobile banking, internet banking, or even SMS. The transfer limit is Rs 5 lakh per transaction (though some banks set lower limits). IMPS charges are typically Rs 5-15 per transaction. Before UPI became dominant, IMPS was the go-to for instant transfers. It still processes significant volumes, especially for bank-to-bank transfers initiated through mobile banking apps.',

        'UPI (Unified Payments Interface) has revolutionized Indian payments since its launch in 2016. Built on the IMPS infrastructure by NPCI, UPI allows instant money transfer using a Virtual Payment Address (VPA like name@bankname) — no need to share bank account numbers or IFSC codes. The standard per-transaction limit is Rs 1 lakh, though SEBI has allowed UPI for mutual fund investments up to Rs 5 lakh, and UPI limits for tax payments go up to Rs 5 lakh. UPI is free for users (zero charges), processes over 18 billion transactions monthly as of early 2026, and has expanded internationally to Singapore, UAE, France, and other countries. For MFDs, UPI is how most retail clients now pay SIP installments and make lump sum mutual fund investments through platforms like MF Central, MFU, and BSE StAR MF.'
      ],
      keyTakeaways: [
        'NEFT settles in half-hourly batches (24x7), no min/max limit — ideal for non-urgent transfers at low or zero cost.',
        'RTGS settles individually in real time (24x7), minimum Rs 2 lakh — the standard for high-value transactions.',
        'IMPS provides instant 24x7 transfers up to Rs 5 lakh — the underlying infrastructure that powers UPI.',
        'UPI processes 18 billion+ transactions per month (April 2026), free for users, limit Rs 1 lakh (Rs 5 lakh for MF investments).',
        'For MFDs, most retail clients now use UPI for SIP mandates and lump sum mutual fund investments — ensure familiarity with the process.'
      ],
    },

    /* ──────────────────────────── 15 ──────────────────────────── */
    {
      id: 'india-vix',
      title: 'Volatility Index (India VIX)',
      description: 'The market\'s fear gauge — what India VIX tells you about expected volatility.',
      readTime: '4 min',
      content: [
        'On a calm market day in March 2026, the India VIX might be sitting around 12-13. Then a geopolitical shock hits — say, unexpected trade war escalation — and within two days, the VIX jumps to 25. The Nifty might have fallen only 3%, but the VIX has nearly doubled. What is this number, and why does it move so dramatically? India VIX is a volatility index computed by the NSE that measures the market\'s expectation of near-term volatility over the next 30 days. It is often called the "fear gauge" because it spikes when uncertainty and fear increase.',

        'The VIX is calculated using the prices of Nifty options (both calls and puts) across various strike prices. When investors are nervous, they buy more put options (insurance against market falls), driving up option prices. Higher option prices mean higher implied volatility, which translates to a higher VIX. Conversely, in calm, rising markets, option demand drops, implied volatility falls, and VIX decreases. The VIX does not predict direction — it predicts the magnitude of expected movement. A VIX of 20 means the market expects the Nifty to move about 20% annualized (roughly 5.8% in the next 30 days, up or down).',

        'Historical VIX levels give context. India VIX has typically ranged between 10-20 during normal markets. During the COVID crash of March 2020, it spiked above 80 — the highest ever recorded. During the 2022 Russia-Ukraine uncertainty, it touched 30-35. As of April 2026, a VIX around 12-14 indicates relatively low expected volatility and a complacent market. When VIX is very low (below 12), some contrarian investors actually become cautious — extreme complacency can precede sharp corrections because the market is not pricing in risk.',

        'For MFDs, VIX is a practical tool. When India VIX is elevated (above 20-22), arbitrage fund spreads widen, making arbitrage funds more attractive for short-term parking. When VIX spikes sharply (above 25-30), it often coincides with market panic — historically, these have been excellent times to deploy fresh lump sum money into equity funds because fear creates bargain prices. When VIX is very low (below 12), it might be time to review client portfolios for over-concentration in equities and ensure adequate debt/gold allocation. The VIX does not give buy/sell signals, but it provides valuable context for making allocation decisions.'
      ],
      keyTakeaways: [
        'India VIX measures the market\'s expectation of Nifty volatility over the next 30 days — higher VIX means higher expected price swings.',
        'VIX is calculated from Nifty option prices — high put demand (fear/hedging) drives VIX up; low demand (complacency) brings it down.',
        'Normal range: 10-20; elevated: 20-30; panic: 30+. COVID 2020 saw VIX spike above 80.',
        'High VIX (25+) historically coincides with good lump-sum entry points; very low VIX (below 12) may signal complacency before a correction.',
        'Arbitrage fund returns improve when VIX is elevated because cash-futures spreads widen — useful for short-term parking decisions.'
      ],
    },
  ],
};
