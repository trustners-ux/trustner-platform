import { GyanCategory } from '@/types/mf-gyan';

export const FINANCIAL_RATIO: GyanCategory = {
  id: 'financial-ratio',
  title: 'Financial Ratios',
  description:
    'The numbers that tell the story — PE ratio, Sharpe ratio, debt-equity, and other metrics that drive investment decisions.',
  icon: 'Calculator',
  color: 'text-indigo-600',
  bgColor: 'bg-indigo-50',
  gradientFrom: 'from-indigo-500',
  gradientTo: 'to-indigo-700',
  topics: [
    /* ──────────────────────────── 1 ──────────────────────────── */
    {
      id: 'pe-ratio',
      title: 'PE Ratio',
      description: 'Price-to-earnings — the most widely used stock valuation metric.',
      readTime: '5 min',
      content: [
        'You are comparing two stocks: TCS at Rs 4,200 per share and a lesser-known IT company at Rs 150 per share. Which is "cheaper"? The share price alone tells you nothing — you need to compare the price relative to what the company earns. That is exactly what the PE ratio does. PE (Price-to-Earnings) = Share Price / Earnings Per Share. If TCS earns Rs 150 per share annually, its PE is 4,200 / 150 = 28. If the smaller company earns Rs 5 per share, its PE is 150 / 5 = 30. Despite its lower share price, the smaller company is actually more "expensive" on a PE basis.',

        'There are two versions of PE. Trailing PE uses the last four quarters of actual reported earnings — it is backward-looking but factual. Forward PE uses analyst estimates of next year\'s earnings — it is forward-looking but based on projections that may be wrong. Most screeners show trailing PE by default. As of April 2026, the Nifty 50 trailing PE is around 21, which is near its long-term average. TCS trades at about 28x trailing PE, HDFC Bank at around 18-19x, and Reliance at about 25x.',

        'How do you use PE? First, compare with the company\'s own historical PE. If HDFC Bank has traded between 16-24x PE over the last decade and currently trades at 19x, it is in the middle of its range — neither cheap nor expensive. If it drops to 15x, it might be a bargain; at 25x, it might be overvalued. Second, compare with sector peers. If TCS trades at 28x and Infosys at 24x, either TCS deserves a premium (perhaps it is growing faster or has better margins) or TCS is relatively overvalued. Third, compare with the market. A stock trading at 40x when the Nifty is at 21x needs to have significantly superior growth to justify that premium.',

        'The biggest trap with PE is applying it blindly. PE does not work well for cyclical companies (as we discussed in the cyclicals topic — profits peak at cycle tops, making PE deceptively low). It does not work for loss-making companies (you cannot divide by zero or negative earnings). It does not work for companies with one-time extraordinary gains or losses. And a low PE is not always a buy — sometimes a stock is cheap because the business is genuinely deteriorating. The market is not always wrong when it assigns a low PE.',

        'For mutual fund advisors, PE is relevant at two levels. At the stock level, it helps you understand whether a fund manager is buying expensive or cheap stocks — a fund with a portfolio PE of 35 is betting on high-growth stocks, while one at 18 is playing the value game. At the market level, the Nifty PE gives you a temperature check: below 18 is historically cheap (good time for aggressive equity allocation), 18-22 is fair value, and above 22-24 signals expensive markets where caution is warranted. Use the Nifty PE as one input (among many) when advising clients on lump-sum deployments or tactical allocation shifts.'
      ],
      keyTakeaways: [
        'PE Ratio = Share Price / EPS — it tells you how many rupees investors pay for every rupee of earnings.',
        'Trailing PE uses actual past earnings; forward PE uses estimated future earnings — both have pros and cons.',
        'Nifty 50 PE of ~21 (April 2026) is near long-term average; TCS ~28x, HDFC Bank ~19x are sector benchmarks.',
        'Always compare PE with the company\'s own history, its sector peers, and the broader market — never evaluate PE in isolation.',
        'PE fails for cyclical, loss-making, and turnaround companies — use it as one tool among many, not a standalone buy/sell signal.'
      ],
    },

    /* ──────────────────────────── 2 ──────────────────────────── */
    {
      id: 'peg-ratio',
      title: 'PEG Ratio',
      description: 'Adjusting PE for growth to find stocks that are cheap relative to their growth rate.',
      readTime: '4 min',
      content: [
        'A stock with a PE of 40 looks expensive. But what if the company is growing earnings at 40% per year? Suddenly, 40x PE does not seem unreasonable — you are paying a fair price for exceptional growth. Conversely, a stock with PE of 12 looks cheap, but if earnings are growing at only 5%, it is actually expensive relative to its growth. The PEG ratio captures this relationship: PEG = PE / Earnings Growth Rate. A PE of 40 with 40% growth gives PEG = 1.0. A PE of 12 with 5% growth gives PEG = 2.4. The "expensive" stock is actually the better deal.',

        'The legendary investor Peter Lynch popularized the PEG ratio. His rule of thumb: a PEG below 1.0 means the stock is undervalued relative to its growth, PEG around 1.0 is fairly valued, and PEG above 1.5-2.0 is overvalued. In the Indian market, finding PEG below 1.0 among quality companies is rare in April 2026 because the market is reasonably valued. But during corrections, quality stocks can briefly dip to PEG below 1.0 — those are moments to deploy.',

        'Let us apply this to real Indian stocks in April 2026. Say Bajaj Finance has a PE of 30 and is growing earnings at 25% annually — PEG = 1.2. HDFC Bank has a PE of 19 and is growing at 18% — PEG = 1.06. A small-cap tech company has PE of 45 but is growing at 50% — PEG = 0.9. On a PEG basis, the small-cap is the cheapest of the three. Of course, the small-cap carries higher risk — the 50% growth may not sustain, while HDFC Bank\'s 18% growth is far more dependable. PEG does not account for the quality or sustainability of growth.',

        'The limitations of PEG are important. It uses a single growth rate, but growth is never linear — a company growing at 30% today might slow to 15% in three years. It does not account for the quality of earnings (cash-backed vs accounting-driven). It ignores debt — a highly leveraged company can show high earnings growth that is unsustainable. And it does not differentiate between different types of growth (organic vs inorganic). Use PEG as a screening tool to shortlist stocks, then do deeper analysis on business quality, management integrity, and cash flow sustainability.'
      ],
      keyTakeaways: [
        'PEG = PE / Earnings Growth Rate — it adjusts the PE ratio for the company\'s growth speed.',
        'PEG below 1.0 suggests the stock is undervalued relative to growth; above 1.5-2.0 suggests overvaluation.',
        'PEG is useful for comparing companies with different growth rates — a high PE is justified if growth is proportionally high.',
        'PEG ignores growth sustainability, quality of earnings, debt levels, and whether growth is organic or acquired.',
        'Use PEG as a screening tool, not a final verdict — follow up with deep analysis on cash flows, management, and business quality.'
      ],
    },

    /* ──────────────────────────── 3 ──────────────────────────── */
    {
      id: 'price-to-book-ratio',
      title: 'Price-to-Book Ratio',
      description: 'Comparing market price to net asset value per share.',
      readTime: '4 min',
      content: [
        'Imagine a company that owns land, buildings, machinery, inventory, and cash worth Rs 1,000 crore, and has debts of Rs 300 crore. Its net worth (book value) is Rs 700 crore. If it has 10 crore shares outstanding, the book value per share is Rs 70. If the stock trades at Rs 196 in the market, the Price-to-Book (P/B) ratio is 196 / 70 = 2.8. Investors are paying Rs 2.80 for every Rs 1 of net assets. Why would anyone pay more than book value? Because the market is pricing in the company\'s future earning power, brand value, management quality, and growth potential — intangibles that do not appear on the balance sheet.',

        'P/B is especially useful for valuing financial companies — banks, NBFCs, and insurance companies. This is because a bank\'s primary assets are financial (loans, investments) that are already marked close to fair value on the balance sheet, making book value a meaningful reference point. HDFC Bank trades at around 2.8x P/B as of April 2026, reflecting the market\'s confidence in its asset quality and growth potential. SBI trades at about 1.5-1.8x P/B — lower because of historical NPA issues and public sector perception. A distressed bank might trade below 1.0x P/B, meaning the market values it at less than its stated net assets.',

        'P/B below 1.0 can mean one of two things: either the market believes the book value is overstated (hidden bad loans, obsolete inventory, or impaired assets that have not been written down), or the stock is genuinely undervalued. For asset-heavy companies like real estate developers or commodity producers, P/B below 1.0 sometimes signals value — the company\'s land, plant, or mineral reserves are worth more than the market is giving credit for.',

        'P/B has limitations for asset-light businesses. A company like TCS or Infosys has most of its value in human capital, client relationships, and brand — none of which appear as "assets" on the balance sheet. TCS might have a P/B of 15-16x, which looks absurdly high, but it is simply because the balance sheet does not capture the company\'s true value drivers. For such companies, PE, PEG, or EV/EBITDA are more meaningful valuation metrics. Use P/B primarily for banks, NBFCs, insurance companies, and asset-heavy industries like real estate and metals.'
      ],
      keyTakeaways: [
        'P/B Ratio = Market Price / Book Value per Share — it compares what investors pay to the company\'s net asset value.',
        'P/B is most useful for financial companies (banks, NBFCs) where book value closely approximates fair asset value.',
        'HDFC Bank P/B ~2.8x reflects premium quality; distressed banks may trade below 1.0x P/B (April 2026).',
        'P/B below 1.0 can signal either genuine undervaluation or that the market believes book value is overstated.',
        'P/B is misleading for asset-light businesses (IT, FMCG) — use PE, PEG, or EV/EBITDA for those sectors instead.'
      ],
    },

    /* ──────────────────────────── 4 ──────────────────────────── */
    {
      id: 'earnings-per-share',
      title: 'Earnings Per Share (EPS)',
      description: 'A company\'s profit allocated to each outstanding share.',
      readTime: '4 min',
      content: [
        'Two companies both report Rs 500 crore in net profit. Company A has 10 crore shares outstanding; Company B has 50 crore shares. Which is "earning" more per share? Company A: Rs 500 crore / 10 crore shares = Rs 50 per share. Company B: Rs 500 crore / 50 crore shares = Rs 10 per share. Company A earns five times more per share despite identical total profits. Earnings Per Share (EPS) normalizes a company\'s profit on a per-share basis, making it directly comparable and forming the denominator of the PE ratio.',

        'There are two versions of EPS. Basic EPS uses the current number of outstanding shares. Diluted EPS assumes all convertible instruments (stock options, warrants, convertible bonds) are converted into equity shares, increasing the share count and reducing EPS. Diluted EPS is always equal to or less than basic EPS. SEBI requires companies to report both. Always use diluted EPS for analysis because it reflects the worst-case dilution scenario — if all options and convertibles are exercised, your per-share earnings shrink accordingly.',

        'EPS growth is one of the most important metrics for stock investors. If a company\'s EPS grows at 20% per year consistently, and the market maintains the same PE ratio, the stock price should also grow at 20% per year. In reality, PE ratios expand and contract based on sentiment, but over long periods, EPS growth is the primary driver of stock price appreciation. Indian IT companies like TCS and Infosys have delivered 12-15% EPS CAGR over the last decade, which (combined with PE expansion) has translated into 14-18% stock return CAGR.',

        'Watch out for EPS manipulation. Companies can artificially boost EPS by buying back shares (reducing the denominator), by reporting one-time extraordinary gains, or by capitalizing expenses that should be on the income statement. Always look at the quality of earnings behind EPS — is the profit coming from core operations (sustainable) or from asset sales, tax write-backs, or accounting adjustments (one-time)? Operating EPS, which strips out exceptional items, gives a cleaner picture. For MFDs evaluating fund portfolios, the weighted average EPS growth of the portfolio stocks indicates the fund\'s fundamental growth trajectory.'
      ],
      keyTakeaways: [
        'EPS = Net Profit / Number of Outstanding Shares — it normalizes earnings on a per-share basis for comparison.',
        'Diluted EPS accounts for potential share dilution from stock options, warrants, and convertibles — always use diluted EPS for analysis.',
        'Consistent EPS growth (15-20% CAGR) is the primary long-term driver of stock price appreciation.',
        'Scrutinize EPS quality — buybacks reduce the denominator, one-time gains inflate the numerator; operating EPS is a cleaner metric.',
        'Portfolio weighted-average EPS growth indicates a mutual fund\'s fundamental growth trajectory.'
      ],
    },

    /* ──────────────────────────── 5 ──────────────────────────── */
    {
      id: 'dividend-yield-ratio',
      title: 'Dividend Yield Ratio',
      description: 'Measuring the cash income a stock generates relative to its price.',
      readTime: '4 min',
      content: [
        'Your retired client wants stocks that pay regular cash income. You screen for dividend yield — the annual dividend per share divided by the stock price. If Coal India pays Rs 25 per share as annual dividend and the stock trades at Rs 400, the dividend yield is 25 / 400 = 6.25%. Compare this with Infosys paying Rs 65 dividend at Rs 1,600 share price — yield of 4.06%. Coal India offers a higher income stream per rupee invested, but the question is whether the dividend is sustainable.',

        'Dividend yield is the income investor\'s primary metric. In India, high-dividend-yield stocks are typically found in mature, cash-generating businesses — PSUs like Coal India, ONGC, Power Grid, and REC; private sector giants like ITC, HCL Technologies, and Infosys. As of April 2026, the Nifty Dividend Opportunities 50 index has a yield of about 3.5-4%, compared to the overall Nifty 50 yield of about 1.3-1.5%. Banks generally have lower dividend yields because they retain profits to fund loan growth.',

        'There is a classic value investing trap called the "high yield trap." A stock\'s dividend yield might be high not because the dividend is generous, but because the stock price has crashed. If a company paid Rs 10 dividend when the stock was at Rs 200 (5% yield), and the stock drops to Rs 80 due to business problems, the yield jumps to 12.5%. But if the business is deteriorating, the next year\'s dividend might be cut to Rs 3 or eliminated entirely. Always check the dividend payout ratio (dividends / net profit) — if it exceeds 70-80%, the company might be paying more than it can sustain.',

        'Tax matters for dividend investors. Post-2020, dividends are taxed in the hands of the investor at their income tax slab rate. For someone in the 30% bracket, a 5% pre-tax dividend yield becomes only 3.5% post-tax. This has made dividend investing less attractive compared to growth investing, where capital gains tax (12.5% LTCG for equity) is lower. For MFDs advising income-seeking clients, Systematic Withdrawal Plans (SWPs) from growth-oriented equity or hybrid funds often provide more tax-efficient "income" than dividend-paying stocks or dividend options of mutual funds.'
      ],
      keyTakeaways: [
        'Dividend Yield = Annual Dividend Per Share / Share Price — it measures cash income per rupee invested.',
        'High-yield sectors in India: PSU energy, utilities, and ITC/HCL Tech among private companies (April 2026).',
        'Beware the "high yield trap" — a crashed stock price inflates yield, but the dividend may be unsustainable.',
        'Check dividend payout ratio: above 70-80% of net profit may signal unsustainable dividend levels.',
        'Post-2020 taxation makes SWPs from growth funds often more tax-efficient than dividend income for high-bracket investors.'
      ],
    },

    /* ──────────────────────────── 6 ──────────────────────────── */
    {
      id: 'debt-equity-ratio',
      title: 'Debt-Equity Ratio',
      description: 'How leveraged a company is — measuring debt relative to shareholder equity.',
      readTime: '4 min',
      content: [
        'Imagine two real estate developers. Company A has Rs 500 crore of equity and Rs 2,000 crore of debt — a debt-equity (D/E) ratio of 4.0. Company B has Rs 500 crore of equity and Rs 300 crore of debt — D/E of 0.6. Both are building apartments, but Company A is four times more leveraged. If the real estate market booms, Company A makes outsized returns on equity because it has invested borrowed money alongside its own. But if the market slumps, Company A still has to pay interest on Rs 2,000 crore of debt regardless of sales — it could go bankrupt. Company B, with less debt, has a much larger margin of safety.',

        'Debt-Equity Ratio = Total Debt / Shareholders\' Equity. It measures financial leverage — how much a company relies on borrowed money versus its own capital. A D/E of 0 means the company has no debt (rare and not always optimal). A D/E of 1.0 means equal debt and equity. Above 1.5-2.0 for non-financial companies is generally considered high leverage in the Indian context. For banks and NBFCs, D/E ratios are naturally high (8-12x) because their entire business model is borrowing money (deposits) and lending it out — you cannot compare a bank\'s D/E with a manufacturing company\'s.',

        'In India, the best wealth creators tend to have low D/E ratios. Asian Paints, TCS, Pidilite, and Bajaj Finance (adjusting for the financial sector norm) have all maintained conservative leverage. The exceptions are capital-intensive businesses — infrastructure, real estate, telecom, and power — where high debt is a structural feature of the industry because building assets requires massive upfront capital. Adani Green Energy has a high D/E because building solar plants costs billions, with returns spread over 25 years. The key question is: can the business generate enough cash flow to service this debt comfortably?',

        'For stock analysis, always look at D/E alongside the interest coverage ratio (EBIT / Interest Expense). A company with D/E of 2.0 but interest coverage of 5x is comfortable — it earns five times what it needs to pay in interest. A company with D/E of 1.5 but interest coverage of just 1.5x is skating on thin ice. When evaluating mutual fund portfolios, check the weighted average D/E of the portfolio stocks. A fund with portfolio D/E above 1.5 is taking significant leverage risk, which may amplify both gains and losses.'
      ],
      keyTakeaways: [
        'D/E Ratio = Total Debt / Shareholders\' Equity — it measures how leveraged a company is relative to its own capital.',
        'D/E above 1.5-2.0 is generally high for non-financial companies in India; banks naturally have D/E of 8-12x.',
        'India\'s best long-term wealth creators (Asian Paints, TCS, Pidilite) typically maintain low D/E ratios.',
        'Always pair D/E with interest coverage ratio — high D/E with strong coverage is manageable; high D/E with weak coverage is dangerous.',
        'A mutual fund portfolio\'s weighted-average D/E indicates the aggregate leverage risk across all holdings.'
      ],
    },

    /* ──────────────────────────── 7 ──────────────────────────── */
    {
      id: 'debt-service-ratio',
      title: 'Debt Service Ratio',
      description: 'Measuring whether a company (or borrower) can comfortably service its debt obligations.',
      readTime: '4 min',
      content: [
        'A bank evaluating a home loan application for your client does not just check their salary — they check the Debt Service Ratio (also called DSCR or debt service coverage ratio). If your client earns Rs 1,50,000 per month and the new EMI will be Rs 50,000, while existing EMIs total Rs 20,000, the total debt obligation is Rs 70,000. The DSCR is Rs 1,50,000 / Rs 70,000 = 2.14. Banks typically want this ratio above 1.5-2.0 for home loans — meaning income should be 1.5 to 2 times the total EMI burden.',

        'For companies, the DSCR formula is: Net Operating Income / Total Debt Service. Total debt service includes both interest payments and principal repayments (not just interest, as in the interest coverage ratio). If a company generates Rs 200 crore in operating cash flow and its annual debt service (interest + principal) is Rs 80 crore, the DSCR is 2.5. This means the company earns 2.5 times what it needs to pay its lenders. A DSCR below 1.0 means the company cannot cover its debt obligations from operations — it would need to sell assets, raise fresh capital, or default.',

        'DSCR is critical in project finance — infrastructure projects, power plants, highways, and real estate developments. When a bank lends Rs 5,000 crore for a highway project, it builds financial projections showing what the DSCR will be over the next 20 years as the highway earns toll revenue. The loan covenant might specify a minimum DSCR of 1.3x — if it falls below that, the company must deposit extra cash as security or halt dividend payments. A declining DSCR trend is a red flag for credit analysts.',

        'For personal finance clients, the individual version is the Fixed Obligation to Income Ratio (FOIR), which RBI guidelines cap at 50-60% for unsecured lending. If a client\'s total EMIs (housing loan + car loan + credit card dues) exceed 50% of their gross income, most banks will reject new loan applications. As an MFD, when planning SIP investments for clients with loans, always check their FOIR first. It makes no sense to start a Rs 25,000 SIP if the client is struggling to meet Rs 80,000 in monthly EMIs on a Rs 1.5 lakh salary — get the debt under control first, then invest.'
      ],
      keyTakeaways: [
        'DSCR = Net Operating Income / Total Debt Service (interest + principal) — it measures ability to meet all debt obligations.',
        'DSCR above 1.5x is comfortable; below 1.0x means the entity cannot cover debt payments from operations.',
        'Project finance lenders set minimum DSCR covenants (often 1.3x) — breach triggers penalty clauses.',
        'For individuals, FOIR (Fixed Obligation to Income Ratio) should stay below 50% — banks use this to approve/reject loans.',
        'Before starting SIPs for clients with loans, verify their FOIR is healthy — investing while drowning in EMIs is counterproductive.'
      ],
    },

    /* ──────────────────────────── 8 ──────────────────────────── */
    {
      id: 'liquidity-ratio',
      title: 'Liquidity Ratio',
      description: 'Current ratio and quick ratio — can the company pay its short-term bills?',
      readTime: '4 min',
      content: [
        'A company might be profitable on paper but still go bankrupt if it cannot pay tomorrow\'s bills. This is the difference between profitability and liquidity. Liquidity ratios measure whether a company has enough short-term assets (cash, receivables, inventory) to cover its short-term liabilities (trade payables, short-term loans, salaries due). The two most important liquidity ratios are the current ratio and the quick ratio.',

        'The current ratio = Current Assets / Current Liabilities. If a company has Rs 500 crore in current assets (cash Rs 50 crore, receivables Rs 200 crore, inventory Rs 250 crore) and Rs 300 crore in current liabilities (payables Rs 180 crore, short-term debt Rs 120 crore), the current ratio is 500 / 300 = 1.67. This means the company has Rs 1.67 of short-term assets for every Rs 1 of short-term obligations. A current ratio above 1.5 is generally healthy; below 1.0 means the company might struggle to meet near-term obligations.',

        'The quick ratio (or acid test ratio) is more conservative: Quick Ratio = (Current Assets - Inventory) / Current Liabilities. It excludes inventory because inventory is the least liquid current asset — it cannot always be converted to cash quickly at full value. Using the same example: (500 - 250) / 300 = 0.83. The quick ratio is below 1.0, meaning if the company cannot sell its inventory, it might face a cash crunch. For trading companies with fast-moving inventory, a quick ratio below 1.0 is less concerning. For a manufacturer with slow-moving inventory, it is a red flag.',

        'Liquidity ratios are especially important when analyzing NBFCs and financial companies, where the business model involves borrowing short and lending long. An NBFC with a poor liquidity position can face a "run" — lenders and depositors demanding their money back simultaneously. The 2018 IL&FS crisis and the subsequent NBFC liquidity crunch in India demonstrated how quickly liquidity problems can turn into solvency problems. For MFDs, when evaluating debt mutual funds, check the credit quality of NBFC and corporate bonds in the portfolio — a bond from a company with poor liquidity ratios carries higher default risk, which can hit the fund\'s NAV if the bond has to be marked down.'
      ],
      keyTakeaways: [
        'Current Ratio = Current Assets / Current Liabilities — measures overall short-term solvency. Above 1.5 is generally healthy.',
        'Quick Ratio = (Current Assets - Inventory) / Current Liabilities — a stricter test that excludes hard-to-liquidate inventory.',
        'A current ratio below 1.0 means the company may not be able to meet immediate obligations from current assets alone.',
        'Liquidity ratios are critical for NBFCs and financial companies — the 2018 IL&FS crisis showed how liquidity problems cascade.',
        'When evaluating debt funds, check the liquidity ratios of underlying NBFC/corporate bond issuers to assess default risk.'
      ],
    },

    /* ──────────────────────────── 9 ──────────────────────────── */
    {
      id: 'savings-ratio',
      title: 'Savings Ratio',
      description: 'A personal finance metric — what percentage of income gets saved and invested.',
      readTime: '4 min',
      content: [
        'Here is a simple truth that many financial professionals overlook: the savings ratio is more important than the return on investment for the first 10-15 years of a client\'s investment journey. If a 25-year-old earns Rs 8 lakh per year and saves 30% (Rs 2.4 lakh), they invest Rs 20,000 per month. Even at a modest 10% return, they accumulate Rs 41 lakh in 10 years. But if they save only 10% (Rs 6,667/month), even at a stellar 15% return, they accumulate only Rs 18.5 lakh. The savings rate dominated the outcome.',

        'The savings ratio is calculated as: Savings / Gross Income x 100. "Savings" here means money that is actually invested or set aside — not the leftover after spending. The global benchmark for a healthy savings ratio is 20-30% of gross income. India\'s household savings rate has historically been around 30% of GDP (one of the highest globally), but this includes physical savings (gold, real estate). The financial savings rate — money going into bank deposits, mutual funds, insurance, and stocks — is lower, around 10-12% for many families.',

        'For MFDs, the savings ratio is the first number to calculate in any financial planning exercise. Before recommending funds, first understand: what is the client\'s income, what are their non-negotiable expenses (rent, EMIs, insurance premiums, children\'s school fees), and what is realistically available for investment? A client earning Rs 1.5 lakh per month with Rs 80,000 in EMIs and Rs 40,000 in essential expenses has only Rs 30,000 available — a savings ratio of 20%. Pushing a Rs 40,000 SIP on this client sets them up for failure.',

        'The power move is to increase the savings ratio over time. When a client gets a salary hike of Rs 15,000, the natural tendency is to upgrade their lifestyle by Rs 15,000. Your job as a financial advisor is to help them allocate at least Rs 10,000 of that hike to additional SIPs (the step-up SIP concept). If a client starts at a 20% savings ratio and increases it by 2% each year, by the time they are in their peak earning years, they could be saving 35-40% of income — dramatically accelerating wealth creation. The savings ratio is the lever that the client controls completely, unlike market returns.'
      ],
      keyTakeaways: [
        'Savings Ratio = (Savings / Gross Income) x 100 — a healthy target is 20-30% of gross income.',
        'In the early years of investing, the savings rate matters more than the rate of return for wealth accumulation.',
        'Calculate the realistic savings ratio first before recommending SIP amounts — overstretching leads to SIP stoppage.',
        'Use salary hikes to boost the savings ratio via step-up SIPs — allocate at least 60-70% of each hike to investments.',
        'India\'s household savings rate is ~30% of GDP, but financial savings (MFs, stocks, deposits) are only 10-12% — a massive opportunity for MFDs.'
      ],
    },

    /* ──────────────────────────── 10 ──────────────────────────── */
    {
      id: 'sharpe-ratio',
      title: 'Sharpe Ratio',
      description: 'Measuring risk-adjusted return — how much return you earn per unit of risk.',
      readTime: '5 min',
      content: [
        'Imagine two mutual funds that both delivered 15% returns last year. Fund A did it with steady, low-volatility performance — smooth upward trajectory with small dips. Fund B was a roller coaster — up 40% in three months, down 25% the next quarter, recovering to end at +15%. Both gave you 15%, but Fund A gave you a far better ride. The Sharpe ratio captures this distinction — it measures how much excess return you earned for each unit of volatility (risk) you endured.',

        'The formula: Sharpe Ratio = (Fund Return - Risk-Free Rate) / Standard Deviation of Fund Returns. The risk-free rate is typically the return on government securities (around 7% in India as of April 2026). If Fund A returned 15% with a standard deviation of 10%, its Sharpe is (15 - 7) / 10 = 0.80. If Fund B returned 15% with a standard deviation of 20%, its Sharpe is (15 - 7) / 20 = 0.40. Fund A delivered the same return with half the volatility — its Sharpe ratio is twice as good. Higher Sharpe ratio = better risk-adjusted performance.',

        'What constitutes a "good" Sharpe ratio? In the Indian equity mutual fund context, a Sharpe ratio above 0.50 over a 3-year period is decent, above 0.75 is good, and above 1.0 is excellent. Most large-cap funds have Sharpe ratios of 0.40-0.70. Flexi-cap funds from good AMCs might show 0.60-0.90. Small-cap funds, despite higher absolute returns, often have lower Sharpe ratios because their volatility is also much higher. Debt funds, with lower returns but also much lower volatility, can have attractive Sharpe ratios.',

        'For MFDs comparing mutual funds, the Sharpe ratio is one of the most useful metrics. When a client says "Fund X gave 22% and Fund Y gave only 18%, let us switch to X," check the Sharpe ratios. If Fund X achieved 22% with extremely high volatility (Sharpe 0.45) while Fund Y achieved 18% with low volatility (Sharpe 0.85), Fund Y is actually the better-managed fund. It delivered more return per unit of risk. Fund X just happened to take on excessive risk that paid off this time — but the next year, that same risk could produce a -15% return.',

        'One caveat: the Sharpe ratio assumes returns are normally distributed and that volatility (both upside and downside) is equally bad. But investors do not mind upside volatility — they mind downside losses. If a fund shoots up 40% in a month (high upside volatility), the Sharpe ratio penalizes it the same as if it fell 40%. For a metric that only penalizes downside risk, see the Sortino ratio (the next topic). Use Sharpe as a primary screening tool and Sortino for a more nuanced view.'
      ],
      keyTakeaways: [
        'Sharpe Ratio = (Return - Risk-Free Rate) / Standard Deviation — it measures excess return earned per unit of total volatility.',
        'Higher Sharpe = better risk-adjusted performance. Above 0.75 is good; above 1.0 is excellent for Indian equity funds.',
        'Two funds with identical returns can have vastly different Sharpe ratios — always compare risk-adjusted, not just absolute returns.',
        'Sharpe penalizes both upside and downside volatility equally, which is a limitation for equity investors who welcome upside surprises.',
        'Use Sharpe ratio alongside absolute returns, rolling returns, and the Sortino ratio for a complete picture of fund quality.'
      ],
    },

    /* ──────────────────────────── 11 ──────────────────────────── */
    {
      id: 'sortino-ratio',
      title: 'Sortino Ratio',
      description: 'A refined risk-adjusted measure that only penalizes downside volatility.',
      readTime: '4 min',
      content: [
        'We just discussed how the Sharpe ratio treats all volatility as "risk" — including upside volatility, which investors actually like. The Sortino ratio fixes this by replacing standard deviation with downside deviation in the denominator. It only penalizes the fund for volatility that hurts you (negative returns or returns below a target), not volatility that helps you (strong positive returns).',

        'The formula: Sortino Ratio = (Fund Return - Risk-Free Rate) / Downside Deviation. Downside deviation is calculated using only the negative returns (or returns below the minimum acceptable return). Consider two funds: Fund A had monthly returns of +5%, +3%, -1%, +6%, +2%, -2%. Fund B had returns of +1%, +1%, +1%, +1%, +1%, +1%. Both average about 2.17% per month. Standard deviation is higher for Fund A. But Fund A\'s downside deviation is quite low (only two small negative months), while its upside months are very strong. The Sortino ratio would favor Fund A over Fund B because the "extra volatility" is all on the upside.',

        'In practice, for Indian equity mutual funds, the Sortino ratio is always higher than the Sharpe ratio (because downside deviation is a subset of total deviation, so the denominator is smaller). A fund with a Sharpe of 0.70 might have a Sortino of 1.1 or higher. As with Sharpe, compare Sortino ratios within the same fund category — a small-cap fund should be compared with other small-cap funds, not with a liquid fund. Look at 3-year rolling Sortino for meaningful comparison.',

        'For MFDs, the Sortino ratio is particularly useful when advising risk-averse clients. A conservative client does not mind if their fund suddenly gains 5% in a month — they mind if it loses 5%. By using the Sortino ratio, you can identify funds that avoid sharp drawdowns while still capturing upside. Fund factsheets from most AMCs now include the Sortino ratio alongside Sharpe. When presenting fund comparisons to a client who has experienced past losses and is nervous about re-entering equity, the Sortino ratio tells a more reassuring story than Sharpe because it focuses on what they actually fear: downside.'
      ],
      keyTakeaways: [
        'Sortino Ratio = (Return - Risk-Free Rate) / Downside Deviation — it penalizes only harmful (negative) volatility, not upside surprises.',
        'Sortino is always higher than Sharpe because downside deviation is smaller than total standard deviation.',
        'Sortino is better suited for equity funds where investors welcome upside volatility but fear drawdowns.',
        'Compare Sortino within the same fund category and use 3-year rolling periods for meaningful analysis.',
        'For risk-averse clients, Sortino tells a more relevant story than Sharpe — it focuses on the downside risk they actually care about.'
      ],
    },

    /* ──────────────────────────── 12 ──────────────────────────── */
    {
      id: 'treynor-ratio',
      title: 'Treynor Ratio',
      description: 'Measuring return per unit of systematic (market) risk using beta.',
      readTime: '5 min',
      content: [
        'The Sharpe ratio uses total volatility (standard deviation) as the risk measure. But financial theory says that investors who hold a diversified portfolio have already eliminated company-specific (unsystematic) risk. The only risk they are left with is market risk (systematic risk), measured by beta. The Treynor ratio says: given that you are a diversified investor, let us measure how much excess return you earned per unit of systematic risk. Treynor Ratio = (Fund Return - Risk-Free Rate) / Beta.',

        'Let us compare. Fund A returned 16% with a beta of 1.2. Fund B returned 14% with a beta of 0.8. Risk-free rate is 7%. Fund A Treynor = (16 - 7) / 1.2 = 7.5. Fund B Treynor = (14 - 7) / 0.8 = 8.75. Despite Fund A having higher absolute returns, Fund B delivered more return per unit of market risk. Fund B\'s manager generated better returns relative to the market risk they took on. If you could leverage Fund B (by borrowing at the risk-free rate and investing more), you would earn higher returns than Fund A at any given level of market risk.',

        'When should you use Treynor vs Sharpe? Treynor is more appropriate when the fund is part of a larger diversified portfolio — because the client\'s total portfolio already eliminates unsystematic risk, and you want to evaluate the fund\'s contribution to the portfolio\'s risk-return profile. Sharpe is better when the fund IS the portfolio (like a client who has only one mutual fund). For most retail MFD clients who hold 3-5 funds plus other investments, Treynor gives a more theoretically sound comparison.',

        'In practice, for Indian mutual funds, Treynor ratio is reported less frequently than Sharpe on fund factsheets. You may need to calculate it using the fund\'s beta (available on Morningstar, Value Research, or the AMC factsheet) and the fund\'s return. A higher Treynor ratio means the fund manager is generating more "alpha" — excess return above what the market exposure (beta) alone would predict. For MFDs, when a client holds multiple funds, the Treynor ratio of each fund helps identify which funds are genuinely adding value through stock selection versus which ones are simply riding market beta.',

        'A practical tip: if two funds have similar Sharpe ratios but different Treynor ratios, the one with the higher Treynor is generating more stock-selection alpha (less market-driven, more skill-driven returns). This is the fund you want in a diversified portfolio because its returns are less correlated with the market, improving overall portfolio diversification.'
      ],
      keyTakeaways: [
        'Treynor Ratio = (Return - Risk-Free Rate) / Beta — it measures excess return per unit of systematic (market) risk.',
        'Use Treynor when the fund is part of a diversified portfolio; use Sharpe when the fund is the entire portfolio.',
        'Higher Treynor = more alpha from stock selection skill, less dependence on market direction.',
        'In a multi-fund portfolio, Treynor helps identify which funds add genuine value versus which just ride market beta.',
        'Similar Sharpe but higher Treynor indicates better stock-selection skill and lower correlation with market movements.'
      ],
    },
  ],
};
