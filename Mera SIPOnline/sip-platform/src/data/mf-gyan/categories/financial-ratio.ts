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
      title: 'PE Ratio — Price to Earnings',
      description: 'The most popular valuation yardstick — what investors pay for every rupee of profit.',
      readTime: '5 min',
      content: [
        'Imagine you are buying a chai stall. The owner tells you it earns Rs 2 lakh profit every year and he wants Rs 20 lakh for it. You are essentially paying 10 times its annual earnings — a PE ratio of 10. Now apply the same logic to stocks. If TCS trades at Rs 4,200 per share and its earnings per share over the last twelve months were Rs 150, the PE ratio is 4,200 / 150 = 28. You are paying Rs 28 for every rupee of TCS\'s annual profit. The PE ratio — Price to Earnings — is the single most widely used valuation metric in equity markets worldwide.',

        'There are two flavours of PE. Trailing PE uses actual reported earnings from the past four quarters. Forward PE uses analyst estimates for the next four quarters. As of April 2026, the Nifty 50 trailing PE hovers around 21, which is near its long-term average. TCS trades at a trailing PE of about 28, HDFC Bank around 19, and a high-growth stock like Zomato might sport a PE north of 100. The number alone means nothing — context is everything. A mature, slow-growing FMCG company with a PE of 60 is expensive; a fast-growing fintech with a PE of 60 might actually be reasonable if earnings are doubling every two years.',

        'Why should MFDs care about PE? When a client asks "is the market overvalued?", the Nifty PE gives you a quick sanity check. Historically, buying the Nifty when its PE is below 18 has delivered strong 3-5 year returns, while buying above 25 has often led to muted returns or drawdowns. This does not mean you stop SIPs when PE is high — rupee cost averaging handles that. But it helps you set expectations: "The market is richly valued right now, so near-term returns may be modest, but your 10-year SIP will ride through multiple cycles."',

        'A common trap is comparing PE ratios across sectors. Banking stocks in India typically trade at 12-20 PE because their earnings are cyclical and tied to credit quality. IT services companies trade at 25-35 PE because they generate high free cash flow with asset-light models. Comparing HDFC Bank\'s PE of 19 with Infosys\'s PE of 27 and concluding HDFC Bank is "cheaper" misses the point entirely — they are in different industries with different growth profiles, margins, and risk characteristics. Always compare a company\'s PE with its own historical average and with peers in the same sector.',

        'One more nuance: PE can be misleading when earnings are temporarily depressed or inflated. If a cyclical steel company has a bad year with near-zero profits, its PE shoots to 200+ — that does not mean it is expensive. Conversely, a company that had a one-time windfall gain shows an artificially low PE. For such situations, analysts use the PEG ratio (next topic), or look at EV/EBITDA as a cleaner valuation metric. For MFDs evaluating equity mutual funds, the weighted average PE of the fund\'s portfolio — available in the fund factsheet — tells you whether the fund manager is buying growth-oriented or value-oriented stocks.'
      ],
      keyTakeaways: [
        'PE Ratio = Market Price per Share / Earnings per Share — it tells you how much investors pay for each rupee of profit.',
        'Nifty 50 PE around 21 (April 2026) is near the long-term average; below 18 is historically attractive, above 25 signals caution.',
        'Always compare PE within the same sector — banking PEs (12-20) are structurally lower than IT PEs (25-35).',
        'Trailing PE uses past earnings while Forward PE uses analyst estimates — both have limitations during unusual profit cycles.',
        'Check the weighted average PE of a mutual fund\'s portfolio in its factsheet to understand the fund manager\'s valuation stance.'
      ],
    },

    /* ──────────────────────────── 2 ──────────────────────────── */
    {
      id: 'peg-ratio',
      title: 'PEG Ratio — PE Adjusted for Growth',
      description: 'Dividing PE by earnings growth rate to find stocks that are priced fairly for their growth.',
      readTime: '4 min',
      content: [
        'The PE ratio has one major blind spot — it ignores how fast a company is growing. Consider two IT companies: Company A has a PE of 30 and is growing earnings at 30% per year. Company B also has a PE of 30 but is growing at only 10%. Clearly, Company A offers better value for the same PE. The PEG ratio — Price/Earnings to Growth — captures this by dividing the PE ratio by the annual earnings growth rate. Company A\'s PEG is 30/30 = 1.0. Company B\'s PEG is 30/10 = 3.0. A PEG of 1 or below generally signals fair value; above 2 suggests you are overpaying for the growth on offer.',

        'Peter Lynch, the legendary Fidelity fund manager, popularized the PEG ratio in his 1989 book "One Up on Wall Street." His rule of thumb: a fairly priced company should have a PEG close to 1. In the Indian context, a stock like Bajaj Finance with a PE of 35 and expected earnings growth of 25% has a PEG of 1.4 — somewhat premium but not outrageous for a dominant franchise. Compare that with a PSU bank trading at PE 8 but with earnings growth of only 5% — PEG of 1.6, actually more expensive on a growth-adjusted basis than Bajaj Finance.',

        'For MFDs, PEG is a great concept to explain during client conversations. When a client says "this small-cap fund has a PE of 40, isn\'t that too expensive?", you can point out that the portfolio companies might be growing earnings at 35-40% annually, giving a PEG near 1. Conversely, a value fund with portfolio PE of 15 might hold slow-growers with 8% earnings growth — PEG of 1.9. The "cheap-looking" fund is not necessarily the better deal. Growth-at-a-reasonable-price (GARP) fund managers specifically target PEG ratios between 0.8 and 1.5.',

        'PEG has limitations too. It relies on future earnings growth estimates, which are exactly that — estimates. Analysts can be wildly off, especially during economic transitions. A company projected to grow at 25% might deliver only 10% if demand slows. PEG also does not work well for companies with negative earnings or cyclical businesses where growth rates swing dramatically. For stable compounders — think Asian Paints, Pidilite, HDFC Bank — PEG is a reliable compass. For turnaround stories or commodity plays, stick with other metrics like EV/EBITDA or price-to-book.'
      ],
      keyTakeaways: [
        'PEG Ratio = PE Ratio / Annual Earnings Growth Rate — it adjusts valuation for how fast the company is growing.',
        'A PEG near 1.0 suggests fair value; below 1 is potentially undervalued; above 2 means you are paying a steep premium for growth.',
        'A low-PE stock with low growth can have a higher PEG than a high-PE stock with rapid growth — PE alone can mislead.',
        'PEG works best for stable compounders and GARP strategies; it is less reliable for cyclicals, turnarounds, or loss-making companies.',
        'Use PEG to help clients understand why a growth-oriented fund\'s higher portfolio PE may still represent fair value.'
      ],
    },

    /* ──────────────────────────── 3 ──────────────────────────── */
    {
      id: 'price-to-book',
      title: 'Price-to-Book Ratio',
      description: 'Comparing market price to net asset value on the balance sheet — a value investor\'s favourite tool.',
      readTime: '5 min',
      content: [
        'Suppose you want to buy a flat in Mumbai. The builder quotes Rs 2 crore, but the government\'s circle rate values it at only Rs 1.2 crore. You are paying 1.67 times the "official" book value. The Price-to-Book ratio (P/B) works the same way for stocks. It divides the market price per share by the book value per share — where book value is the company\'s total assets minus total liabilities, divided by the number of shares outstanding. If HDFC Bank trades at Rs 1,750 and its book value per share is Rs 625, the P/B ratio is 1,750 / 625 = 2.8.',

        'Book value represents the accounting net worth — what shareholders would theoretically receive if the company liquidated all assets and paid off all debts today. For banks and NBFCs, P/B is the primary valuation metric because their assets (loans) and liabilities (deposits) are already marked close to market value. A well-run bank like HDFC Bank commands a P/B of 2.5-3.0 because the market trusts its asset quality and growth. A struggling PSU bank with high NPAs might trade at P/B of 0.7 — below book value — because investors fear that its reported book value includes bad loans that will need to be written off.',

        'Value investors love fishing for stocks trading below book value (P/B < 1), but this requires caution. A stock might trade below book because the market rightly suspects its assets are overstated — think of a real estate company that values its land bank at 2010 prices. Or a company with obsolete inventory sitting on the balance sheet at cost. Benjamin Graham\'s famous "net-net" strategy — buying stocks trading below net current asset value — worked in the 1930s-50s but is very rare in today\'s efficient Indian market. When you do find genuine P/B bargains, they tend to be in PSU banks, capital goods companies, or holding companies with unlisted subsidiaries.',

        'For asset-light businesses — IT services, FMCG, pharma — P/B is almost meaningless. Infosys has a P/B above 8 because its real value lies in brand, talent, and client relationships — none of which appear on the balance sheet. Asian Paints trades at P/B of 15+ because its distribution network and brand equity are worth far more than its physical assets. For these businesses, PE, PEG, or EV/EBITDA are more appropriate valuation lenses.',

        'As an MFD, P/B is most useful when discussing banking and financial sector funds. If a banking fund factsheet shows a weighted average P/B of 1.5, the manager is leaning towards PSU or mid-tier private banks (value tilt). If the P/B is 3.0+, the fund is loaded with premium private banks like HDFC Bank, Kotak, and Bajaj Finance. Neither is inherently better — it depends on where you are in the credit cycle. After an NPA cleanup, low P/B banking stocks can deliver explosive returns. During periods of asset quality stress, high-quality banks with higher P/B tend to hold up better.'
      ],
      keyTakeaways: [
        'Price-to-Book = Market Price per Share / Book Value per Share — it compares market valuation to accounting net worth.',
        'P/B is the primary valuation metric for banks and NBFCs, where assets and liabilities are close to market value.',
        'A P/B below 1 can signal a bargain or a value trap — always investigate whether reported book value is reliable.',
        'P/B is less useful for asset-light companies (IT, FMCG) whose real value — brand, talent, IP — does not appear on the balance sheet.',
        'HDFC Bank P/B of ~2.8 (April 2026) reflects market confidence in its asset quality and consistent return on equity.'
      ],
    },

    /* ──────────────────────────── 4 ──────────────────────────── */
    {
      id: 'earnings-per-share',
      title: 'Earnings Per Share (EPS)',
      description: 'The profit attributable to each share — the building block behind PE and most valuation ratios.',
      readTime: '4 min',
      content: [
        'If a company earns Rs 10,000 crore in net profit and has 100 crore shares outstanding, each share "earned" Rs 100. That is Earnings Per Share — EPS. It is the most fundamental profitability metric and the denominator of the PE ratio. When TCS reports quarterly results and announces an EPS of Rs 38, it means each share of TCS generated Rs 38 of profit that quarter. Multiply by four quarters and you get the annual trailing EPS, which drives the stock\'s valuation.',

        'There are two versions: Basic EPS and Diluted EPS. Basic EPS simply divides net profit by the number of shares outstanding. Diluted EPS accounts for all potential shares that could come into existence — from stock options (ESOPs), convertible bonds, or warrants. If a startup-turned-listed-company has granted generous ESOPs to employees, the diluted share count might be 10-15% higher than the basic count, making diluted EPS meaningfully lower. Always look at diluted EPS for a more conservative and realistic picture.',

        'EPS growth is what drives stock prices over the long term. If a company\'s EPS grows from Rs 50 to Rs 100 over five years — a 15% CAGR — and the market maintains the same PE multiple, the stock price doubles. If the market also re-rates the PE upward (say from 20 to 25 because growth accelerated), the stock could go up 2.5x. This twin engine of earnings growth plus PE re-rating is how multibagger returns are generated. Indian IT bellwethers like TCS and Infosys have compounded EPS at 12-15% over the past decade, and their stocks have delivered similar long-term CAGR plus dividend yield on top.',

        'For MFDs, EPS matters when evaluating fund factsheets and explaining fund performance to clients. A fund manager who consistently picks stocks with accelerating EPS growth — quarter after quarter beating estimates — is likely to deliver superior returns. When reviewing a fund\'s top holdings, a quick check of those companies\' EPS trajectory over 3-5 years tells you whether the portfolio is filled with genuine earners or speculative stories. Quality-focused fund managers like those at PPFAS or Parag Parikh prioritize sustainable EPS compounders over momentum-driven stocks.'
      ],
      keyTakeaways: [
        'EPS = Net Profit / Number of Shares Outstanding — it measures the profit attributable to each share.',
        'Diluted EPS includes potential shares from ESOPs, convertibles, and warrants — it gives a more conservative picture than Basic EPS.',
        'Long-term stock returns are driven by EPS growth plus any change in PE multiple — the twin engine of compounding.',
        'Check EPS growth trajectory of a fund\'s top holdings to judge whether the portfolio is built on real earnings or speculation.'
      ],
    },

    /* ──────────────────────────── 5 ──────────────────────────── */
    {
      id: 'dividend-yield',
      title: 'Dividend Yield Ratio',
      description: 'Annual dividends as a percentage of stock price — the income investor\'s go-to metric.',
      readTime: '4 min',
      content: [
        'Your grandfather probably invested in Coal India or NTPC not because he expected the stock price to double, but because they paid handsome dividends every year — like clockwork, rain or shine. Dividend Yield is the annual dividend per share divided by the current market price, expressed as a percentage. If ITC pays Rs 15 per share annually and the stock trades at Rs 450, the dividend yield is 15/450 = 3.33%. This tells you that just by holding the stock, you earn 3.33% per year in cash — before any price appreciation.',

        'In India, dividend yield has become less attractive since the 2020 budget change that shifted taxation from Dividend Distribution Tax (paid by the company) to taxing dividends as income in the hands of the investor. For someone in the 30% tax bracket, a 3% dividend yield effectively becomes about 2.1% post-tax. Despite this, dividend yield stocks serve an important purpose in portfolios — they tend to be mature, cash-rich businesses with stable earnings. Companies like Coal India (yield ~6%), Power Grid (yield ~4%), and ITC (yield ~3%) provide a cushion during market downturns because the dividend acts as a floor for the stock price.',

        'For mutual fund investors, dividend yield funds (now technically called IDCW — Income Distribution cum Capital Withdrawal plans) focus on high-yield stocks. But here is the critical distinction MFDs must explain to clients: when a mutual fund declares a "dividend," it is paying out from the fund\'s own NAV — the NAV drops by the dividend amount. It is not free money; it is your own capital being returned. The growth option reinvests all profits, letting compounding work uninterrupted. For most investors, especially those not in the withdrawal phase, the growth option is far superior.',

        'Dividend yield is also a useful valuation signal. When the Nifty\'s dividend yield rises above 2%, it often coincides with market bottoms — high yields mean stock prices have fallen relative to dividends. When the yield compresses below 1%, markets may be overheated. As of April 2026, the Nifty dividend yield is around 1.2%, reflecting the bull market and the fact that many growth companies prefer buybacks over dividends. For clients seeking regular income — especially retirees — a combination of debt funds with SWP (Systematic Withdrawal Plan) and a small allocation to dividend yield funds can provide a tax-efficient cash flow stream.'
      ],
      keyTakeaways: [
        'Dividend Yield = Annual Dividend per Share / Market Price per Share x 100 — it measures cash income as a percentage of investment.',
        'Since 2020, dividends are taxed in the investor\'s hands at their slab rate — reducing the after-tax appeal for high-income investors.',
        'Mutual fund "dividends" (IDCW) are paid from NAV, not extra income — the growth option is better for long-term compounding.',
        'High Nifty dividend yield (>2%) often signals undervaluation; low yield (<1%) may signal an expensive market.',
        'For retirees needing income, a debt fund SWP is usually more tax-efficient than a dividend yield fund\'s IDCW option.'
      ],
    },

    /* ──────────────────────────── 6 ──────────────────────────── */
    {
      id: 'debt-equity-ratio',
      title: 'Debt-Equity Ratio — Leverage',
      description: 'How much borrowed money a company uses versus its own capital — a key risk indicator.',
      readTime: '5 min',
      content: [
        'Think of two friends starting restaurants. Priya invests Rs 50 lakh of her own money and borrows nothing. Rahul invests Rs 20 lakh of his own money and borrows Rs 80 lakh from the bank. Both restaurants earn Rs 15 lakh in annual profit. Priya\'s return on equity is 30% — solid. Rahul\'s return on equity is a stunning 75% (Rs 15 lakh profit on Rs 20 lakh of his own capital, ignoring interest for simplicity). Leverage has amplified Rahul\'s returns. But here is the catch: if the restaurant has a bad year and earns only Rs 5 lakh, Rahul still owes Rs 8 lakh in interest payments. He is in trouble. Leverage amplifies both gains and losses. The Debt-Equity ratio — total debt divided by shareholders\' equity — measures this risk.',

        'In the Indian corporate world, a D/E ratio below 1.0 is generally considered conservative — the company has more equity than debt. HDFC Bank, for instance, has equity capital that comfortably backs its operations. Infrastructure and capital-intensive companies like Adani Group entities or JSW Steel often carry D/E ratios of 1.5-3.0 because their projects require massive upfront capital that equity alone cannot fund. FMCG companies like HUL and Nestlé typically have D/E ratios near zero — they generate so much cash that they rarely need to borrow.',

        'The debt-equity ratio is crucial when evaluating companies in a fund\'s portfolio, especially during rising interest rate environments. When the RBI raises the repo rate — as it did during 2022-23 — heavily leveraged companies see their interest costs balloon, squeezing profit margins. A real estate company with D/E of 3.0 might see its interest cost jump by Rs 200 crore annually for every 100 basis point rate hike. Zero-debt or low-debt companies are largely insulated. This is why during rate-hike cycles, quality-focused fund managers tilt portfolios towards low-leverage businesses.',

        'For MFDs, understanding leverage helps during client conversations about sector funds. An infrastructure fund will naturally hold companies with higher D/E ratios — that is the nature of the sector, and clients should be prepared for higher volatility. A consumption or FMCG fund will hold low-leverage stocks and tend to be more stable. When reviewing a fund factsheet, check the top holdings for debt levels. If a flexi-cap fund\'s top ten holdings are all debt-heavy, the fund is making a concentrated bet on favourable interest rates and economic growth — higher risk, potentially higher reward, but not suitable for a conservative client.',

        'One nuance: for banks and NBFCs, the debt-equity ratio works differently. Their business is borrowing money (deposits, bonds) and lending it out — so a bank with D/E of 8 is not reckless; it is just leveraging its balance sheet as banks are designed to do. For financial companies, the relevant metric is Capital Adequacy Ratio (CAR) — the ratio of the bank\'s own capital to its risk-weighted assets. SEBI and RBI have strict norms here. For non-financial companies, though, D/E remains the go-to leverage indicator.'
      ],
      keyTakeaways: [
        'Debt-Equity Ratio = Total Debt / Shareholders\' Equity — it measures how much leverage a company employs.',
        'D/E below 1.0 is conservative; infrastructure and capital-intensive sectors routinely operate at 1.5-3.0.',
        'Rising interest rates hurt high-leverage companies disproportionately — their interest costs balloon, squeezing margins.',
        'For banks and NBFCs, D/E is structurally high by design — use Capital Adequacy Ratio (CAR) instead.',
        'Check a fund\'s top holdings for debt levels to gauge the portfolio\'s sensitivity to interest rate changes and economic cycles.'
      ],
    },

    /* ──────────────────────────── 7 ──────────────────────────── */
    {
      id: 'debt-service-ratio',
      title: 'Debt Service Ratio',
      description: 'Can a company comfortably pay its loan EMIs? This ratio checks if earnings cover debt obligations.',
      readTime: '4 min',
      content: [
        'Before a bank sanctions your home loan, it checks whether your monthly income comfortably covers the EMI. If you earn Rs 1 lakh per month and the EMI is Rs 40,000, your debt service ratio is 40%. Banks typically want this below 50% — leaving you enough for living expenses. The same logic applies to companies. The Debt Service Coverage Ratio (DSCR) divides a company\'s operating income (EBITDA or net operating income) by its total debt obligations (principal repayment plus interest) for the period. A DSCR of 1.5 means the company earns 1.5 times what it needs to service its debt — a comfortable cushion.',

        'A DSCR below 1.0 is a red flag — the company is not generating enough operating cash to meet its loan obligations. It will have to dip into reserves, sell assets, or take on new debt to repay old debt — a dangerous spiral. During the 2018-20 NBFC crisis in India, many infrastructure-focused NBFCs like IL&FS had DSCRs that slipped below 1, triggering defaults that cascaded through the financial system. On the other hand, a company like Infosys with zero debt has an infinitely high DSCR — it has no debt to service.',

        'For MFDs, DSCR is particularly relevant when clients ask about credit risk funds or corporate bond funds. These debt mutual funds invest in lower-rated bonds (A or BBB rated) that offer higher yields. The DSCR of the issuing companies directly determines whether those bonds will be repaid on time. The Franklin Templeton debt fund crisis in April 2020 was partly because the fund held bonds of companies with deteriorating DSCRs — Vodafone Idea, Yes Bank group companies — and when those companies could not service their debt, the bonds became illiquid.',

        'In personal finance, the debt service ratio is equally important. When you build a financial plan for a client, add up all their EMIs — home loan, car loan, personal loan, credit card minimum payments — and divide by their gross monthly income. If it exceeds 40%, the client is over-leveraged and should focus on debt reduction before increasing investments. As an MFD, recommending more SIPs to a client who is drowning in EMIs is poor advice. Fix the liability side first, then build the asset side.'
      ],
      keyTakeaways: [
        'Debt Service Coverage Ratio (DSCR) = Operating Income / Total Debt Service (Principal + Interest) — it checks if earnings cover loan repayments.',
        'DSCR above 1.5 is comfortable; below 1.0 means the company cannot service debt from operations — a serious red flag.',
        'Credit risk and corporate bond funds carry exposure to companies with varying DSCRs — lower DSCR means higher default risk.',
        'For personal finance clients, a debt service ratio above 40% of income signals over-leverage — prioritize debt reduction before new SIPs.'
      ],
    },

    /* ──────────────────────────── 8 ──────────────────────────── */
    {
      id: 'liquidity-ratio',
      title: 'Liquidity Ratio — Current Ratio & Quick Ratio',
      description: 'Can a company pay its short-term bills? These ratios measure near-term financial health.',
      readTime: '5 min',
      content: [
        'Imagine running a kirana store. You have Rs 5 lakh worth of stock on the shelves, Rs 1 lakh cash in the drawer, and Rs 2 lakh owed to you by customers who buy on credit. Your current assets total Rs 8 lakh. But you owe Rs 4 lakh to your wholesaler (due within 30 days) and Rs 1 lakh in rent and salaries (also due this month). Your current liabilities are Rs 5 lakh. Your current ratio — current assets divided by current liabilities — is 8/5 = 1.6. You can pay your short-term bills with room to spare. A current ratio above 1.5 is generally healthy for most industries.',

        'The quick ratio (also called the acid-test ratio) is a stricter version. It strips out inventory from current assets because inventory cannot always be converted to cash quickly — especially if it is slow-moving or perishable. In our kirana example, quick assets = Rs 1 lakh cash + Rs 2 lakh receivables = Rs 3 lakh. Quick ratio = 3/5 = 0.6. That is below 1.0, which means without selling inventory, the store cannot cover its immediate obligations. For manufacturing companies sitting on large raw material or finished goods inventory, the gap between current ratio and quick ratio can be enormous — and the quick ratio tells the truer story.',

        'In the Indian market, different sectors have structurally different liquidity profiles. IT companies like TCS and Infosys boast current ratios above 2.5 — they collect cash from global clients and have minimal inventory. Auto companies like Maruti carry moderate current ratios of 1.2-1.5 because they hold significant vehicle and parts inventory. Real estate companies often have current ratios that look high on paper (unsold inventory is classified as current asset) but quick ratios that are alarmingly low — the "current assets" are unsold flats that may take months or years to convert to cash.',

        'Liquidity ratios matter for debt fund selection. When a liquid fund or ultra-short-term fund holds commercial paper or certificates of deposit issued by a company, that company\'s liquidity ratios determine whether it can repay the instrument on maturity. After the IL&FS crisis, SEBI tightened norms for liquid funds — they must hold at least 20% in liquid assets (cash, government securities, repo). But the underlying credit quality of the remaining 80% still depends on the issuing companies\' liquidity positions.',

        'For MFDs advising clients, liquidity ratios are also a useful personal finance analogy. Ask your client: "If you lost your income today, how many months could you sustain your household expenses from liquid savings alone?" If the answer is less than 6 months, they need an emergency fund before committing to equity SIPs. A client\'s personal liquidity ratio — liquid assets divided by monthly expenses — should ideally be 6-12 before taking on any illiquidity risk through equity or real estate investments.'
      ],
      keyTakeaways: [
        'Current Ratio = Current Assets / Current Liabilities — measures ability to pay short-term obligations; above 1.5 is generally healthy.',
        'Quick Ratio = (Current Assets - Inventory) / Current Liabilities — a stricter test that excludes hard-to-liquidate inventory.',
        'IT companies have high liquidity ratios (2.5+); real estate firms may show inflated current ratios due to unsold inventory.',
        'Debt fund safety depends partly on the liquidity ratios of the companies whose instruments the fund holds.',
        'Personal liquidity ratio (liquid savings / monthly expenses) should be 6-12 months before clients commit heavily to equity SIPs.'
      ],
    },

    /* ──────────────────────────── 9 ──────────────────────────── */
    {
      id: 'savings-ratio',
      title: 'Savings Ratio — Personal Finance Metric',
      description: 'What percentage of income you save — the foundation number for every financial plan.',
      readTime: '4 min',
      content: [
        'Every financial plan starts with one simple question: how much of your income do you save? The savings ratio — total savings divided by gross income, expressed as a percentage — is the foundation upon which all investment planning rests. If a young professional in Bengaluru earns Rs 1,00,000 per month, pays Rs 25,000 in taxes, Rs 50,000 on rent, food, transport, and lifestyle, and saves Rs 25,000, their savings ratio is 25%. That Rs 25,000 is what an MFD can work with to build a portfolio of SIPs across equity, debt, and gold.',

        'India\'s gross domestic savings rate hovers around 30% of GDP — one of the highest in the world — but the distribution is uneven. Salaried professionals in metros with high rents and EMIs often save 15-20%, while double-income households in Tier 2 cities with family-owned homes may save 40-50%. The savings ratio tends to follow a lifecycle: low in the 20s (entry-level salaries, lifestyle spending), peaks in the 40s-50s (higher income, lower relative expenses as loans get paid off), and declines after retirement as savings are drawn down.',

        'For MFDs, the savings ratio is the starting point of every client conversation. Before recommending any fund, ask: "What is your monthly take-home pay, and how much can you consistently set aside for investments?" If the client says Rs 50,000, but they already have Rs 30,000 in EMIs and Rs 10,000 in insurance premiums, the investable surplus is only Rs 10,000. Starting SIPs beyond that capacity leads to frequent pauses or cancellations — which hurts the client\'s compounding and your trail revenue. Be realistic, not aspirational.',

        'A practical rule of thumb: aim for a savings ratio of at least 20% in your 20s, 30% in your 30s, and 35-40% in your 40s and 50s. The "pay yourself first" strategy — setting up SIPs on salary day before discretionary spending happens — is the most effective way to maintain the savings ratio. As an MFD, positioning the SIP as a non-negotiable expense (like rent or EMI) in the client\'s mental accounting dramatically improves SIP persistency. Clients who treat SIPs as optional — investing "whatever is left" — rarely build meaningful wealth.'
      ],
      keyTakeaways: [
        'Savings Ratio = Total Savings / Gross Income x 100 — it measures what percentage of income is retained for future use.',
        'India\'s domestic savings rate is ~30% of GDP, but individual rates vary widely based on income, city, lifestyle, and life stage.',
        'Always determine a client\'s realistic investable surplus before recommending SIP amounts — overcommitting leads to SIP stoppages.',
        'Target savings ratio: 20% in 20s, 30% in 30s, 35-40% in 40s-50s — "pay yourself first" on salary day is the best strategy.',
        'Position SIPs as a fixed monthly obligation (like rent) in the client\'s mind — this dramatically improves persistency and long-term wealth creation.'
      ],
    },

    /* ──────────────────────────── 10 ──────────────────────────── */
    {
      id: 'sharpe-ratio',
      title: 'Sharpe Ratio — Risk-Adjusted Return',
      description: 'How much extra return a fund delivers per unit of total risk — the gold standard of performance measurement.',
      readTime: '5 min',
      content: [
        'Two friends compare their mutual fund returns. Anil\'s fund delivered 18% last year. Vikram\'s fund delivered 15%. Anil brags about beating Vikram. But here is what Anil does not mention: his fund\'s NAV swung wildly — up 8% one month, down 6% the next — while Vikram\'s fund delivered steady, consistent returns with barely any stomach-churning drops. Who actually had the better experience? The Sharpe ratio answers this by measuring return per unit of risk. Developed by Nobel laureate William Sharpe in 1966, it remains the gold standard for evaluating risk-adjusted performance.',

        'The formula is straightforward: Sharpe Ratio = (Fund Return - Risk-Free Rate) / Standard Deviation of Fund Returns. The risk-free rate in India is typically the 91-day T-bill yield, currently around 6.5%. If Anil\'s fund returned 18% with a standard deviation of 20%, its Sharpe ratio is (18 - 6.5) / 20 = 0.575. Vikram\'s fund returned 15% with a standard deviation of 8%, giving a Sharpe of (15 - 6.5) / 8 = 1.0625. Vikram\'s fund delivered far more return per unit of risk. A Sharpe ratio above 1.0 is considered good; above 1.5 is excellent; below 0.5 suggests the risk taken was not adequately compensated.',

        'For MFDs, the Sharpe ratio is the single most important number on a fund factsheet — more important than raw returns. When comparing two large-cap funds that both delivered 14% CAGR over 5 years, the one with the higher Sharpe ratio achieved those returns with less volatility and smaller drawdowns. This matters enormously for client behavior: investors in the low-Sharpe fund experienced bigger drops during corrections and were more likely to panic-sell. The high-Sharpe fund kept investors calm and invested, which is half the battle in wealth creation.',

        'Morningstar, Value Research, and AMFI all publish Sharpe ratios for mutual funds. When building a client portfolio, compare Sharpe ratios within the same category — do not compare a large-cap fund\'s Sharpe with a small-cap fund\'s Sharpe, as small caps are inherently more volatile. A large-cap fund with a 3-year Sharpe of 0.9 is doing well. A small-cap fund with a 3-year Sharpe of 0.7 might also be doing well for its category. Context always matters.',

        'One caveat: the Sharpe ratio treats all volatility equally — both upside and downside. A fund that occasionally shoots up 10% in a month (upside volatility) gets penalized the same as one that drops 10% (downside volatility). For investors who do not mind upside surprises but hate downside drops, the Sortino ratio (next topic) is a better fit. Still, for an overall risk-adjusted performance snapshot, the Sharpe ratio is where every analysis should start.'
      ],
      keyTakeaways: [
        'Sharpe Ratio = (Fund Return - Risk-Free Rate) / Standard Deviation — it measures extra return earned per unit of total risk.',
        'A Sharpe above 1.0 is good, above 1.5 is excellent — always compare within the same fund category.',
        'Higher Sharpe means smoother returns and fewer gut-wrenching drops — leading to better investor behavior and lower panic-selling.',
        'The Sharpe ratio penalizes both upside and downside volatility equally — for downside-only risk, use the Sortino ratio.',
        'When two funds have similar returns, always recommend the one with the higher Sharpe ratio — the client\'s experience will be far better.'
      ],
    },

    /* ──────────────────────────── 11 ──────────────────────────── */
    {
      id: 'sortino-ratio',
      title: 'Sortino Ratio — Downside Risk Adjusted',
      description: 'Like Sharpe but only penalizes bad volatility — the ratio that investors actually care about.',
      readTime: '4 min',
      content: [
        'Imagine two cricketers. Batsman A scores 50, 20, 80, 10, 60 across five innings — an average of 44 with wild swings. Batsman B scores 50, 45, 80, 40, 60 — an average of 55 with much less downside. Both have some big scores (upside volatility), but Batsman B rarely fails. The Sortino ratio captures exactly this difference for mutual funds. While the Sharpe ratio penalizes all volatility (up and down), the Sortino ratio only penalizes downside deviation — returns that fall below a target or minimum acceptable return. Because no investor complains about unexpected gains, the Sortino ratio is arguably the more intuitive measure.',

        'The formula: Sortino Ratio = (Fund Return - Target Return) / Downside Deviation. The target return is usually the risk-free rate (around 6.5% in India) or zero. Downside deviation is calculated by looking only at periods where returns fell below the target — ignoring all positive periods. If a fund returned 16% with downside deviation of 7%, the Sortino ratio is (16 - 6.5) / 7 = 1.36. Compare that with another fund that returned 16% but with downside deviation of 12% — Sortino of 0.79. The first fund protects capital far better during bad months.',

        'For MFDs, the Sortino ratio is the perfect metric to discuss with risk-averse clients — especially those who say, "I am okay with decent returns, but I cannot handle big drops." A fund with a high Sortino ratio delivers the experience these clients need: it participates in rallies but limits damage during corrections. Balanced advantage funds (BAFs) and large-cap funds from quality-focused AMCs tend to have the highest Sortino ratios because their fund managers actively manage downside by raising cash or shifting to defensive sectors during market stress.',

        'Not all fund research platforms prominently display the Sortino ratio — you might need to check Morningstar or dedicated analytics tools. But when you do find it, it is incredibly revealing. During the 2020 COVID crash, funds with high historical Sortino ratios (say, 1.2+) fell less than their category average and recovered faster. Their investors were less likely to panic-redeem, which meant the fund manager did not have to sell holdings at the worst time. This virtuous cycle — good downside management attracts patient investors who further enable good management — is why Sortino-leading funds tend to stay at the top over multiple cycles.'
      ],
      keyTakeaways: [
        'Sortino Ratio = (Fund Return - Target Return) / Downside Deviation — it only penalizes negative volatility, not upside surprises.',
        'A higher Sortino means the fund protects capital better during downturns while still capturing upside during rallies.',
        'Sortino is more intuitive than Sharpe for risk-averse clients who fear losses but welcome positive surprises.',
        'Balanced advantage funds and quality large-cap funds typically have the highest Sortino ratios in their categories.',
        'During market crashes, high-Sortino funds fall less and recover faster — creating a virtuous cycle of investor confidence.'
      ],
    },

    /* ──────────────────────────── 12 ──────────────────────────── */
    {
      id: 'treynor-ratio',
      title: 'Treynor Ratio — Systematic Risk Adjusted Return',
      description: 'Return per unit of market risk (beta) — ideal for evaluating funds within a diversified portfolio.',
      readTime: '5 min',
      content: [
        'The Sharpe ratio measures return per unit of total risk (standard deviation). But if an investor holds a diversified portfolio of multiple funds, much of the individual fund\'s volatility gets diversified away. What remains is systematic risk — the fund\'s sensitivity to overall market movements, measured by beta. The Treynor ratio, developed by Jack Treynor in 1965, divides excess return by beta instead of standard deviation. It answers the question: "For every unit of market risk this fund carries, how much extra return does it deliver?"',

        'The formula: Treynor Ratio = (Fund Return - Risk-Free Rate) / Beta. If a large-cap fund returned 15%, the risk-free rate is 6.5%, and the fund\'s beta is 0.9, the Treynor ratio is (15 - 6.5) / 0.9 = 9.44. Another fund returned 17% with a beta of 1.3: Treynor = (17 - 6.5) / 1.3 = 8.08. Despite delivering higher raw returns, the second fund actually generated less return per unit of market risk. The first fund is more efficient — it achieved nearly the same return without taking on excess market exposure.',

        'Beta itself deserves a quick explanation. A fund with beta 1.0 moves exactly in line with the benchmark (say Nifty 50). Beta 1.2 means the fund moves 20% more than the market — if Nifty rises 10%, the fund is expected to rise 12%, but if Nifty falls 10%, the fund falls 12%. Beta 0.8 means the fund is less volatile than the market. Aggressive small-cap and sectoral funds typically have betas above 1.2. Defensive large-cap and balanced funds have betas of 0.7-1.0. The Treynor ratio helps you see if that extra beta is actually being rewarded with proportionally higher returns.',

        'For MFDs building multi-fund portfolios, the Treynor ratio is more relevant than the Sharpe ratio. Here is why: when you combine a large-cap fund, a mid-cap fund, a debt fund, and a gold fund in a client\'s portfolio, the unsystematic risk (stock-specific volatility) gets diversified across funds. What drives the portfolio\'s overall return is each fund\'s systematic risk exposure and how well it is compensated. A high-Treynor large-cap fund paired with a high-Treynor mid-cap fund creates an efficient portfolio core.',

        'In practice, you will find the Treynor ratio on advanced fund analytics platforms and some Morningstar fund pages. It is less commonly discussed than the Sharpe ratio, but it is the theoretically correct measure for evaluating any fund that is part of a broader portfolio. Use the Sharpe ratio when evaluating a standalone fund investment. Use the Treynor ratio when evaluating how a fund contributes to a diversified multi-asset portfolio. Both tell you about risk-adjusted performance, but they measure different types of risk — and knowing the difference puts you a notch above most MFDs in the industry.'
      ],
      keyTakeaways: [
        'Treynor Ratio = (Fund Return - Risk-Free Rate) / Beta — it measures excess return per unit of systematic (market) risk.',
        'Unlike the Sharpe ratio which uses total volatility, Treynor uses beta — making it ideal for funds within a diversified portfolio.',
        'Beta above 1.0 means the fund amplifies market moves; below 1.0 means it dampens them — Treynor checks if the extra beta is rewarded.',
        'Use Sharpe for standalone fund evaluation; use Treynor when assessing a fund\'s contribution to a multi-fund portfolio.',
        'A fund with lower raw returns but a higher Treynor ratio is more efficient — it generates more return per unit of market risk taken.'
      ],
    },
  ],
};
