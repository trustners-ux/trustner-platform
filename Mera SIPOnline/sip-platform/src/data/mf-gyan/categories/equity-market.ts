import { GyanCategory } from '@/types/mf-gyan';

export const EQUITY_MARKET: GyanCategory = {
  id: 'equity-market',
  title: 'Equity Market',
  description:
    'Stocks, mutual funds, market indices, and equity investment concepts every financial professional must know.',
  icon: 'TrendingUp',
  color: 'text-emerald-600',
  bgColor: 'bg-emerald-50',
  gradientFrom: 'from-emerald-500',
  gradientTo: 'to-emerald-700',
  topics: [
    /* ──────────────────────────── 1 ──────────────────────────── */
    {
      id: 'what-are-mutual-funds',
      title: 'What Are Mutual Funds',
      description: 'Pooled investment vehicles managed by professionals — NAV, types, and how they work.',
      readTime: '5 min',
      content: [
        'Imagine ten friends who each have Rs 10,000 to invest but none of them has the time or expertise to pick individual stocks. They pool their money — Rs 1,00,000 in total — and hire a professional fund manager to invest it on their behalf. That, in its simplest form, is a mutual fund. An Asset Management Company (AMC) collects money from thousands of investors, and a SEBI-registered fund manager deploys it across equities, bonds, or other securities according to the scheme\'s stated objective.',

        'The price of one unit of a mutual fund is called its Net Asset Value (NAV). Every evening, after the market closes, the AMC adds up the current value of every security the fund holds, subtracts liabilities and expenses, and divides by the total number of units outstanding. If a fund holds stocks worth Rs 500 crore, has liabilities of Rs 2 crore, and 10 crore units are outstanding, the NAV is (500 - 2) / 10 = Rs 49.80. When you invest Rs 10,000 in that fund, you receive roughly 200.8 units. Your returns depend entirely on how the NAV moves from the day you bought to the day you redeem.',

        'SEBI classifies mutual funds into five broad groups: Equity schemes (invest at least 65% in stocks), Debt schemes (invest in bonds, T-bills, and other fixed-income instruments), Hybrid schemes (a mix of equity and debt), Solution-oriented schemes (retirement or children\'s education funds with a lock-in), and Other schemes (index funds, ETFs, fund of funds). Within equity alone, there are sub-categories — large cap, mid cap, small cap, multi cap, flexi cap, ELSS, sectoral, and thematic — each with SEBI-mandated asset allocation rules introduced in October 2017.',

        'Why do mutual funds matter for MFDs? As of April 2026, the Indian mutual fund industry manages over Rs 68 lakh crore in assets. SIP inflows alone cross Rs 25,000 crore per month. For a distributor registered with AMFI (like Trustner, ARN-286886), mutual funds are the backbone of client portfolios. Every SIP you start, every lump sum you facilitate, earns a trail commission that builds a recurring revenue stream — and more importantly, it gives your client access to professional portfolio management at a fraction of what a PMS would charge.',

        'A common misconception is that a low NAV means a fund is "cheap" and a high NAV means it is "expensive." NAV has nothing to do with how cheap or dear a fund is — it simply reflects the accumulated value of underlying holdings per unit. A fund with NAV of Rs 500 is not more expensive than one with NAV of Rs 15; what matters is the portfolio quality and the consistency of returns. Always evaluate a fund on its rolling returns, consistency, risk-adjusted performance, and the fund manager\'s track record — not the NAV number.'
      ],
      keyTakeaways: [
        'A mutual fund pools money from many investors and is managed by a professional fund manager under SEBI regulations.',
        'NAV = (Total Assets - Total Liabilities) / Number of Units Outstanding — it is calculated daily after market close.',
        'SEBI classifies mutual funds into Equity, Debt, Hybrid, Solution-oriented, and Other categories, each with defined asset allocation rules.',
        'India\'s MF industry manages over Rs 68 lakh crore (April 2026), with monthly SIP inflows exceeding Rs 25,000 crore.',
        'Never judge a fund by its NAV alone — evaluate rolling returns, risk-adjusted metrics, and fund manager track record instead.'
      ],
    },

    /* ──────────────────────────── 2 ──────────────────────────── */
    {
      id: 'systematic-investment-plan',
      title: 'Systematic Investment Plan (SIP)',
      description: 'Rupee cost averaging, discipline, and why SIPs are the backbone of retail investing.',
      readTime: '5 min',
      content: [
        'Picture two colleagues — Aarav and Meera — who both decide to invest Rs 60,000 in an equity mutual fund. Aarav invests the entire amount as a lump sum on January 1st when the NAV is Rs 100. Meera sets up a monthly SIP of Rs 5,000 for twelve months. Over the year, the NAV fluctuates: Rs 100 in January, dips to Rs 80 in March during a correction, drops further to Rs 70 in June, recovers to Rs 95 by September, and ends the year at Rs 105. Aarav\'s 600 units are now worth Rs 63,000. But Meera? Because she bought more units when the NAV was low and fewer when it was high, she ends up with roughly 680 units worth Rs 71,400. That is the magic of rupee cost averaging.',

        'A Systematic Investment Plan is simply an instruction to your AMC: "Deduct Rs X from my bank account on a fixed date each month and buy units of this fund at the prevailing NAV." There is no separate SIP product — it is a method of investing in the same mutual fund scheme. SIPs can be weekly, fortnightly, monthly, or quarterly. Most investors choose monthly, aligned to their salary credit date. The minimum can be as low as Rs 100 for some schemes, though Rs 500 and Rs 1,000 are more common entry points.',

        'The real power of SIP is behavioral, not just mathematical. Markets are emotional places — when the Nifty falls from 22,500 to 19,000, panic sets in and investors want to redeem. But a SIP investor is actually buying more units at lower prices during that fall. The discipline of a standing instruction removes the temptation to time the market. Over 15-20 year horizons, SIP investors in diversified equity funds have historically earned 12-15% CAGR in India, handsomely beating inflation and fixed deposits.',

        'As an MFD, SIPs are your most powerful tool. Each SIP generates trail commission every month for as long as it stays active. A client who starts a Rs 10,000 monthly SIP today and continues for 20 years will invest Rs 24 lakh — and if the fund delivers 12% annualized returns, the corpus grows to roughly Rs 1 crore. Your job is not just to start the SIP but to ensure the client does not stop it during market downturns. Hand-holding during crashes is where the MFD earns their commission many times over.',

        'A few SIP best practices: (1) Step-up SIP — increase the SIP amount by 10-15% every year in line with salary growth. This dramatically improves the final corpus. (2) SIP across categories — don\'t put all SIPs in one fund; spread across large cap, flexi cap, and mid cap. (3) Never stop a SIP during a downturn — that is exactly when you accumulate more units cheaply. (4) Use SIP triggers or top-ups during sharp corrections for clients with surplus cash.'
      ],
      keyTakeaways: [
        'SIP is a method of investing, not a separate product — it buys mutual fund units at regular intervals at prevailing NAV.',
        'Rupee cost averaging ensures you buy more units when markets are low and fewer when markets are high, lowering average cost.',
        'The biggest SIP advantage is behavioral: it removes the temptation to time the market and enforces investing discipline.',
        'Step-up SIPs (increasing amount by 10-15% annually) can dramatically improve the long-term corpus.',
        'As an MFD, your role during market crashes is to prevent clients from stopping SIPs — that hand-holding justifies your trail commission.'
      ],
    },

    /* ──────────────────────────── 3 ──────────────────────────── */
    {
      id: 'exchange-traded-funds',
      title: 'Exchange Traded Funds (ETFs)',
      description: 'How ETFs trade on exchanges, their structure, and how they differ from mutual funds.',
      readTime: '5 min',
      content: [
        'Think of a mutual fund that you can buy and sell on the stock exchange just like a share of Reliance or TCS. That is essentially an ETF — an Exchange Traded Fund. Like a regular index mutual fund, an ETF holds a basket of securities (say, the 50 Nifty stocks in exactly the same proportion as the index). But unlike a mutual fund where you transact at end-of-day NAV, an ETF trades throughout market hours at a real-time price determined by supply and demand on the exchange.',

        'The creation and redemption mechanism is what keeps an ETF\'s market price close to its NAV. Large institutional players called Authorized Participants (APs) can create new ETF units by depositing the underlying basket of stocks with the AMC, or redeem ETF units by returning them and receiving the stocks back. If the ETF trades at a premium to NAV, APs create new units (pushing the price down). If it trades at a discount, APs redeem units (pushing the price up). This arbitrage keeps the price tethered to fair value — at least in theory.',

        'In practice, Indian ETFs — especially those tracking less liquid indices — can trade at significant premiums or discounts. A Nifty 50 ETF from a large AMC will trade tight to NAV because the underlying stocks are highly liquid. But a gold ETF or a Nifty Next 50 ETF might show 1-2% deviation. Always check the iNAV (indicative NAV) published in real time before placing an order. Also check the bid-ask spread: a wide spread means poor liquidity and higher trading cost.',

        'How do ETFs compare to index mutual funds? An ETF has a lower expense ratio (often 0.05-0.10% vs 0.20-0.50% for index funds) and allows intraday trading. But it requires a demat account, you pay brokerage, and the market price may deviate from NAV. An index fund is simpler — you invest via an AMC at exact NAV, no demat needed, and SIPs are easy to set up. For long-term SIP investors, an index mutual fund is usually more convenient. ETFs are better for large lump-sum investors or tactical allocators who want intraday flexibility.',

        'For MFDs, ETFs pose a structural challenge: since they are bought on the exchange, there is no distributor trail commission on ETF purchases. Clients who buy ETFs directly are outside your revenue stream. However, you can add value by guiding clients on which ETFs have adequate liquidity, low tracking error, and tight bid-ask spreads — and by building a broader portfolio that includes regular mutual funds where you do earn trail.'
      ],
      keyTakeaways: [
        'An ETF holds a basket of securities like an index fund but trades on the stock exchange at real-time market prices.',
        'Authorized Participants keep ETF prices close to NAV through the creation/redemption mechanism.',
        'Always check iNAV and bid-ask spread before trading an ETF — illiquid ETFs can trade at premiums or discounts.',
        'For SIP investors, index mutual funds are often more practical than ETFs since they require no demat account and trade at exact NAV.',
        'ETFs do not generate distributor trail commission — MFDs add value through guidance on liquidity, tracking error, and portfolio construction.'
      ],
    },

    /* ──────────────────────────── 4 ──────────────────────────── */
    {
      id: 'index-funds',
      title: 'Index Funds',
      description: 'Passive investing, tracking error, and where index funds fit in a portfolio.',
      readTime: '5 min',
      content: [
        'An index fund is a mutual fund whose only job is to replicate a specific market index — say the Nifty 50, Sensex, or Nifty Next 50 — as closely as possible. The fund manager does not pick stocks based on research or conviction. Instead, they hold the same stocks in the same proportion as the index. If Reliance Industries has a 10.2% weight in Nifty 50, the index fund holds Reliance at roughly 10.2% too. The goal is not to beat the market but to match it.',

        'The key metric for judging an index fund is tracking error — the standard deviation of the difference between the fund\'s return and the index\'s return over time. A good Nifty 50 index fund should have a tracking error below 0.10%. What causes tracking error? Cash drag (the fund holds some cash for redemptions), expense ratio (higher TER means more underperformance vs index), corporate actions (dividends, bonus issues that temporarily misalign weights), and rebalancing costs when the index reconstitutes.',

        'Why have index funds become popular in India? As the market matures and more stocks get actively covered by analysts, it becomes harder for active fund managers to consistently beat the benchmark. Data from April 2026 shows that over a 5-year rolling period, roughly 60-65% of large cap active funds have underperformed the Nifty 50 Total Return Index. This is the case for outperformance in large caps. However, in mid-cap and small-cap segments, active managers still tend to add significant alpha because those segments are less efficiently researched — which is why blanket statements like "just buy index funds" need nuance.',

        'For a Trustner client portfolio, index funds serve as a solid core holding — especially Nifty 50 or Nifty 500 index funds — around which you can build satellite positions in well-chosen active mid-cap or flexi-cap funds. This core-satellite approach gives the client low-cost broad market exposure at the center, with active management where it can genuinely add value.',

        'A practical note on expense ratios: Regular plan index funds typically charge 0.30-0.50% TER, while direct plans may charge 0.10-0.20%. The gap matters more in index funds than in active funds because the fund is not trying to generate alpha — every basis point of expense is a direct drag on returns. As an MFD, be transparent with clients about this. Your value is not in the fund selection for index products — it is in the overall asset allocation, behavioral coaching, and keeping the client invested through volatility.'
      ],
      keyTakeaways: [
        'An index fund replicates a market index by holding the same stocks in the same proportions — no active stock picking.',
        'Tracking error measures how closely the fund mirrors the index; look for sub-0.10% for large cap index funds.',
        'About 60-65% of large cap active funds underperform Nifty 50 TRI over 5 years, but active managers still add alpha in mid and small cap segments.',
        'Core-satellite strategy: use index funds for the core and well-chosen active funds for satellites in mid/small cap.',
        'The MFD\'s value in index fund portfolios lies in asset allocation, behavioral coaching, and keeping clients invested through downturns.'
      ],
    },

    /* ──────────────────────────── 5 ──────────────────────────── */
    {
      id: 'large-mid-small-cap',
      title: 'Large Cap, Mid Cap, Small Cap',
      description: 'SEBI market cap classification and what each segment means for risk and return.',
      readTime: '5 min',
      content: [
        'Walk into any MFD\'s office and you\'ll hear phrases like "we need more mid-cap exposure" or "the client is overweight small caps." But what exactly do these terms mean? SEBI introduced a precise classification in October 2017. Every six months, AMFI publishes a list of all stocks ranked by full market capitalization. The top 100 companies by market cap are classified as large cap, companies ranked 101 to 250 are mid cap, and everything from 251 onwards is small cap. As of April 2026, this means a company needs roughly Rs 75,000 crore market cap to be considered large cap.',

        'Large cap stocks — think Reliance, TCS, HDFC Bank, Infosys — are the giants. They are well-researched, highly liquid, and relatively stable. When the Nifty 50 is at ~22,500 and the Sensex at ~74,000, these are the stocks driving most of the index movement. Large cap mutual funds must invest at least 80% of their corpus in these top 100 companies. The trade-off? They are less likely to give you 30-40% annual returns, but they also rarely fall 50% in a year. They are the bedrock of a conservative or moderate portfolio.',

        'Mid cap stocks sit in the sweet spot — established enough to have a business track record, but growing fast enough to deliver significant upside. Companies ranked 101-250 include names like Persistent Systems, Indian Hotels, or Coforge. Mid cap funds must invest at least 65% in these stocks. Historically, mid caps have outperformed large caps over 7-10 year periods in India, but with meaningfully higher volatility. A 30-40% drawdown in a bad year is not unusual for mid cap indices.',

        'Small cap stocks (rank 251 and beyond) are where the thrill and the danger coexist. These are companies with market caps often below Rs 15,000-20,000 crore — some are future multi-baggers, others are value traps that go nowhere for a decade. Small cap funds (minimum 65% in small caps) delivered extraordinary returns during 2020-2024 but also saw sharp corrections. A 50-60% fall from peak is historically normal for small cap indices. Only clients with a 7+ year horizon and genuine risk appetite should have meaningful small cap allocation.',

        'For portfolio construction, a common rule of thumb is: clients under 35 can have 50-60% in large cap, 25-30% in mid cap, and 10-20% in small cap. As age increases, tilt more toward large cap and reduce small cap. But this is just a starting point — always factor in the client\'s actual risk tolerance, income stability, existing assets, and financial goals. An MFD who builds a well-diversified multi-cap portfolio and hand-holds the client through market cycles is worth every rupee of trail commission.'
      ],
      keyTakeaways: [
        'SEBI defines large cap as top 100 by market cap, mid cap as 101-250, and small cap as 251 onwards — updated semi-annually by AMFI.',
        'Large caps offer stability and liquidity; mid caps offer a growth-stability balance; small caps offer high growth potential with high volatility.',
        'Mid caps have historically outperformed large caps over 7-10 year periods in India, but with significantly higher drawdowns.',
        'Small cap allocation should only be for clients with 7+ year horizons and genuine risk appetite — 50-60% falls from peak are normal.',
        'Good portfolio construction across cap segments, combined with behavioral coaching during crashes, is the MFD\'s core value proposition.'
      ],
    },

    /* ──────────────────────────── 6 ──────────────────────────── */
    {
      id: 'balanced-hybrid-funds',
      title: 'Balanced / Hybrid Funds',
      description: 'Equity-debt mix funds for moderate investors who want growth with stability.',
      readTime: '4 min',
      content: [
        'Imagine a client who wants equity-like returns but cannot stomach the kind of 30% drops that pure equity funds can deliver. The solution is often a hybrid fund — a mutual fund that holds both equity and debt instruments in a pre-defined ratio. It is like ordering a thali instead of a single dish: you get a balanced meal without having to order each item separately.',

        'SEBI classifies hybrid funds into several sub-categories based on their equity-debt allocation. The most important ones are: (1) Aggressive Hybrid Funds — invest 65-80% in equity and 20-35% in debt. Because equity exceeds 65%, they enjoy equity taxation, making them very tax-efficient. These are your go-to recommendation for moderate-risk clients. (2) Conservative Hybrid Funds — invest 10-25% in equity and 75-90% in debt. Designed for retirees or ultra-conservative investors. (3) Balanced Advantage Funds (BAFs) — dynamically shift between equity and debt based on market valuations. When markets are expensive, they reduce equity and increase debt; when markets are cheap, they go overweight equity.',

        'Balanced Advantage Funds have become incredibly popular in India, with several schemes crossing Rs 30,000-50,000 crore in AUM. The appeal is simple: the fund manager takes the asset allocation decision away from the investor. When the Nifty PE ratio is above 22-23, the fund automatically reduces equity exposure; when it drops below 18-19, equity allocation goes up. For a client who panics during crashes, a BAF can be a much better experience because the fund itself is buying more equity when prices are low.',

        'One practical tip: when recommending hybrid funds, always check whether the fund uses derivative strategies to maintain its equity taxation status. Some BAFs use equity derivatives (futures and options) to keep the gross equity exposure above 65% even when the actual stock holdings are lower. This is perfectly legal and tax-efficient, but the client should understand that the fund\'s effective equity exposure might be lower than what the classification suggests.'
      ],
      keyTakeaways: [
        'Hybrid funds combine equity and debt in a single portfolio, offering moderate risk-return for investors who want both growth and stability.',
        'Aggressive Hybrid Funds (65-80% equity) enjoy equity taxation, making them tax-efficient for moderate-risk clients.',
        'Balanced Advantage Funds dynamically shift equity-debt allocation based on market valuations — reducing emotion-driven decisions.',
        'Check if a BAF uses derivative strategies to maintain equity taxation status — effective equity exposure may differ from gross exposure.',
        'Hybrid funds are ideal for first-time equity investors, retirees with some risk appetite, and clients who panic during market corrections.'
      ],
    },

    /* ──────────────────────────── 7 ──────────────────────────── */
    {
      id: 'bonus-shares-vs-stock-split',
      title: 'Bonus Shares vs Stock Split',
      description: 'Two corporate actions that increase share count without changing company value.',
      readTime: '4 min',
      content: [
        'Your client calls in a panic: "The share price of my stock just dropped by half overnight! What happened?" You check and realize the company announced a 1:1 bonus issue. The client had 100 shares at Rs 2,000 each (value: Rs 2,00,000). After the bonus, they have 200 shares at Rs 1,000 each (value: still Rs 2,00,000). Nothing actually changed in value — they just got more slices of the same pizza.',

        'A bonus issue is when a company issues additional shares to existing shareholders free of cost, in a specified ratio (like 1:1, 2:1, or 1:2). The company uses its reserves (accumulated profits) to fund this. When a company declares a 1:1 bonus, it transfers money from reserves to share capital. The share price adjusts proportionally. A bonus issue signals that the company is confident about its future and has healthy reserves. Companies like TCS, Infosys, and Wipro have given bonus issues multiple times over the years.',

        'A stock split, on the other hand, divides the face value of the share. If a company with a face value of Rs 10 does a 1:2 split, the face value becomes Rs 5 and the shareholder gets two shares for every one they held. Again, the total value does not change. The main purpose of a stock split is to improve liquidity by making the share price more affordable. When MRF trades above Rs 1,20,000 per share, retail investors find it hard to buy even one share. A split would make it accessible to more people.',

        'The key difference: a bonus issue capitalizes reserves (moves money from reserves to share capital on the balance sheet), while a stock split simply divides the existing face value without affecting any balance sheet item. In both cases, the shareholder\'s total value remains unchanged immediately after the event. However, both are generally considered positive signals — bonus issues indicate healthy reserves, and stock splits indicate the company wants broader retail participation.'
      ],
      keyTakeaways: [
        'Bonus shares give additional shares for free from reserves; stock splits divide existing shares by reducing face value.',
        'Neither bonus issues nor stock splits change the total value of your holding — they increase share count while proportionally reducing price.',
        'Bonus issues capitalize reserves on the balance sheet; stock splits have no balance sheet impact.',
        'Both are generally positive signals — bonus shows healthy reserves, split shows intent to improve retail liquidity.',
        'Educate clients to not panic when share price "drops" after a bonus or split — their total value is unchanged.'
      ],
    },

    /* ──────────────────────────── 8 ──────────────────────────── */
    {
      id: 'buyback-of-shares',
      title: 'Buyback of Shares',
      description: 'Why companies repurchase their own shares and what it means for investors.',
      readTime: '4 min',
      content: [
        'Imagine a company sitting on a large pile of cash — say Rs 10,000 crore — with no immediate need for expansion or acquisitions. What should it do? It could declare a dividend, but dividends are taxed in the hands of the shareholder. Instead, the company announces a buyback: it will purchase its own shares from existing shareholders at a premium to the market price. This reduces the number of outstanding shares, effectively increasing each remaining shareholder\'s ownership percentage.',

        'Why do companies buy back shares? First, it is often more tax-efficient than dividends, especially after the 2020 changes that taxed dividends fully in shareholders\' hands. The company pays a buyback tax of 23.296% (as of April 2026), but the effective tax for shareholders participating in the buyback through the tender offer route has historically been lower than dividend tax for high-income investors. Second, a buyback signals management confidence — they believe the shares are undervalued and are willing to invest the company\'s own cash in buying them. Third, it improves EPS (Earnings Per Share) because the same profit is now divided among fewer shares.',

        'SEBI regulates buybacks in India. A company cannot buy back more than 25% of its paid-up capital and free reserves. The buyback must be completed within one year from the date of the board resolution (or shareholder resolution, depending on the method). The two methods are: (1) Tender offer — the company makes an open offer to all shareholders at a fixed price (usually 15-25% premium to market). Shareholders can choose to tender their shares. (2) Open market — the company buys shares from the secondary market over time. Tender offers are more common in India.',

        'For investors and MFD clients, buybacks present an opportunity. If a client holds shares of a company announcing a buyback at Rs 5,000 when the market price is Rs 4,200, they can tender their shares and earn an immediate 19% return. However, long-term investors might choose not to tender — if they believe in the company\'s future, holding on means their remaining shares represent a larger ownership stake in the same business. The decision depends on the client\'s view of the company\'s prospects and their liquidity needs.'
      ],
      keyTakeaways: [
        'Buyback is when a company repurchases its own shares, reducing outstanding share count and increasing ownership % for remaining shareholders.',
        'Buybacks are often more tax-efficient than dividends and signal management\'s confidence that shares are undervalued.',
        'SEBI limits buybacks to 25% of paid-up capital and free reserves, to be completed within one year.',
        'Tender offer buybacks at a premium give shareholders a chance for immediate return above market price.',
        'EPS improves after a buyback because the same profit is divided among fewer outstanding shares.'
      ],
    },

    /* ──────────────────────────── 9 ──────────────────────────── */
    {
      id: 'arbitrage',
      title: 'Arbitrage',
      description: 'Exploiting price differences across markets for near-riskless profit.',
      readTime: '4 min',
      content: [
        'Suppose you find that Infosys is trading at Rs 1,580 on the NSE and Rs 1,583 on the BSE at the exact same moment. If you buy on NSE and simultaneously sell on BSE, you pocket Rs 3 per share with virtually zero risk. That is arbitrage — profiting from the price difference of the same asset in two different markets. In theory, the profit is riskless because you are buying and selling the same thing at the same time, just in different places.',

        'In practice, pure arbitrage opportunities in cash markets are tiny and vanish within milliseconds — high-frequency trading algorithms sniff them out before a human can react. The more common form of arbitrage in Indian markets is cash-futures arbitrage. If Reliance Industries trades at Rs 2,950 in the cash market and its one-month futures contract trades at Rs 2,975, an arbitrageur buys the stock in cash and sells the futures. At expiry, both prices converge, and the arbitrageur earns Rs 25 per share (minus transaction costs). This is the basis of how arbitrage mutual funds work.',

        'Arbitrage mutual funds are classified as equity funds (because they maintain 65%+ gross equity exposure through their cash-futures positions) and enjoy equity taxation — long-term capital gains tax of 12.5% after one year, with a Rs 1.25 lakh annual exemption. Yet their risk profile is closer to a liquid fund because the positions are hedged. Returns typically range from 6-8% annualized, similar to short-term debt funds, but with far superior tax treatment for investors in the 30% tax bracket.',

        'For MFDs, arbitrage funds are a powerful tool in the advisory toolkit. They are ideal for parking short-to-medium-term money (3-12 months) where the client wants better post-tax returns than a fixed deposit or liquid fund but does not want equity market risk. Think of money earmarked for a house down payment six months away, or surplus business funds awaiting deployment. The caveat: returns depend on the spread between cash and futures prices, which narrows in low-volatility markets. When India VIX is low (below 12-13), arbitrage opportunities shrink and fund returns may dip.'
      ],
      keyTakeaways: [
        'Arbitrage is profiting from price differences of the same asset across different markets simultaneously.',
        'Cash-futures arbitrage is the most common form in India — buying in cash market, selling in futures, and earning the spread at expiry.',
        'Arbitrage mutual funds enjoy equity taxation (12.5% LTCG after 1 year) despite having a risk profile closer to liquid funds.',
        'Ideal for parking short-to-medium-term money where post-tax returns matter more than raw returns.',
        'Returns depend on market volatility — when India VIX is low, arbitrage spreads narrow and returns dip.'
      ],
    },

    /* ──────────────────────────── 10 ──────────────────────────── */
    {
      id: 'contra-fund-investing',
      title: 'Contra Fund Investing',
      description: 'Going against market sentiment to find undervalued opportunities.',
      readTime: '4 min',
      content: [
        'In 2020, when the world was in the grip of a pandemic, aviation and hospitality stocks were being sold off like they would never recover. An investor who bought InterGlobe Aviation (IndiGo) at Rs 900 in April 2020 saw it cross Rs 4,500 by 2024. That is contrarian investing in action — buying what the crowd is selling and selling what the crowd is buying. A contra fund is a mutual fund that follows this philosophy systematically.',

        'SEBI defines a contra fund as an equity scheme that follows a contrarian investment strategy. Only one contra fund is allowed per AMC. The fund manager actively seeks out stocks that are unloved, beaten down, or out of favor with the market — but have sound fundamentals that suggest the market is mispricing them. The reasoning is simple: markets are driven by emotions in the short term. When fear dominates, good companies get dragged down with bad ones. A contrarian fund manager picks up these babies thrown out with the bathwater.',

        'How is a contra fund different from a value fund? Both buy "cheap" stocks, but the approach is subtly different. A value fund looks for stocks trading below intrinsic value based on financial metrics (low PE, low P/B, high dividend yield). A contra fund looks for stocks where market sentiment is negative — the stock might not be "cheap" on traditional metrics but is being unfairly punished because of a temporary problem, industry headwind, or market narrative. In practice, there is significant overlap between the two strategies.',

        'Contra funds require patience — they can underperform the broader market for years before their thesis plays out. A contra fund that loaded up on PSU banks in 2018-2019 would have looked terrible for two years before delivering outstanding returns from 2021 onwards. For MFDs, the key is managing client expectations. Position contra funds as a 5-7 year allocation, not a quick-return play. Pair them with a mainstream flexi-cap or large-cap fund so the portfolio does not feel "wrong" during the years when the contrarian bets are still gestating.'
      ],
      keyTakeaways: [
        'Contra funds buy stocks that are out of market favor, betting that sentiment-driven mispricing will correct over time.',
        'SEBI allows only one contra fund per AMC — it must follow a contrarian investment strategy.',
        'Contra differs from value: value uses financial metrics (low PE, P/B); contra focuses on negative market sentiment and narrative-driven mispricing.',
        'Contra funds require 5-7 year patience and may underperform for extended periods before their thesis plays out.',
        'Pair contra funds with mainstream large-cap or flexi-cap funds in client portfolios to balance short-term performance expectations.'
      ],
    },

    /* ──────────────────────────── 11 ──────────────────────────── */
    {
      id: 'cyclical-stocks',
      title: 'Cyclical Stocks',
      description: 'Companies whose fortunes rise and fall with the economic cycle.',
      readTime: '4 min',
      content: [
        'Think about steel. When the economy is booming — infrastructure projects are flying, housing construction is at a peak, auto sales are strong — demand for steel surges, prices rise, and companies like Tata Steel and JSW Steel report record profits. But when a slowdown hits, demand drops, prices crash, and those same companies struggle. These are cyclical stocks — companies whose revenues and profits are closely tied to the economic cycle.',

        'Cyclical sectors in India include metals and mining, real estate, automobiles, cement, capital goods, and banking (to some extent). The opposite of cyclical is defensive — sectors like FMCG, pharmaceuticals, utilities, and IT services, whose revenues are relatively stable regardless of economic conditions. People buy toothpaste and medicines in a recession too, but they postpone buying a new car or a house.',

        'The tricky part about cyclical stocks is that they look cheapest (low PE ratios) when they are most expensive, and most expensive (high PE ratios) when they are cheapest. Here is why: at the peak of the cycle, profits are inflated, so the PE ratio is low even though the stock price is high. At the bottom, profits collapse or turn negative, making the PE ratio appear astronomical even though the stock price is low and it is actually a good time to buy. This is the "PE trap" that catches many novice investors.',

        'For MFDs advising clients, cyclical stocks and cyclical funds (like infrastructure or banking sector funds) should be positioned as tactical, time-bound allocations rather than permanent portfolio holdings. When India\'s GDP growth is accelerating (as it has been at 6.5-7% in FY26), cyclical sectors tend to outperform. When growth slows, they underperform. If a client insists on cyclical exposure, use it as a 15-20% satellite allocation with a clear review timeline, not as a core holding.',

        'One smart approach is to invest in cyclicals through diversified multi-cap or flexi-cap funds where the fund manager dynamically adjusts cyclical exposure based on economic indicators. This way, the professional manager handles the timing — which is notoriously difficult for retail investors — while the client gets the benefit of cyclical upswings without the risk of being stuck in a downturn.'
      ],
      keyTakeaways: [
        'Cyclical stocks are tied to economic cycles — metals, real estate, autos, cement, and capital goods rise in booms and fall in slowdowns.',
        'Defensive stocks (FMCG, pharma, IT) have stable revenues regardless of economic conditions.',
        'The PE trap: cyclicals appear cheapest (low PE) at cycle peaks when profits are inflated, and expensive (high PE) at bottoms when profits collapse.',
        'Position cyclical exposure as tactical (15-20%) with a review timeline, not as a permanent core holding.',
        'Flexi-cap and multi-cap funds let the fund manager dynamically adjust cyclical exposure based on economic indicators.'
      ],
    },

    /* ──────────────────────────── 12 ──────────────────────────── */
    {
      id: 'how-sensex-is-calculated',
      title: 'How Sensex Is Calculated',
      description: 'Free-float market cap methodology behind India\'s oldest stock index.',
      readTime: '5 min',
      content: [
        'The Sensex — short for Sensitive Index — is India\'s oldest stock market index, maintained by BSE (Bombay Stock Exchange). It comprises 30 of the largest, most liquid, and financially sound companies across key sectors. As of April 2026, the Sensex hovers around 74,000. But how exactly is that number calculated? The answer lies in the free-float market capitalization methodology.',

        'Let us break it down step by step. First, what is market capitalization? It is simply the share price multiplied by the total number of shares. If a company has 100 crore shares and the price is Rs 2,500, the market cap is Rs 2,50,000 crore. But not all 100 crore shares are available for public trading — the promoter might hold 50%, government might hold 10%, and strategic investors another 15%. Only the remaining 25% (the "free float") is actually available for trading in the market.',

        'BSE assigns each Sensex company a free-float factor based on the proportion of shares available for trading. If a company has 75% of shares locked up with promoters and strategic investors, its free-float factor is 0.25. The free-float market cap is then: Share Price x Total Shares x Free-Float Factor. The Sensex value is calculated by dividing the aggregate free-float market cap of all 30 companies by a number called the Index Divisor, which is adjusted for corporate actions (bonus, splits, rights issues) to maintain continuity.',

        'The formula: Sensex = (Sum of Free-Float Market Cap of 30 stocks) / Index Divisor. The Index Divisor is the crucial element that keeps the Sensex comparable over time. When a company in the Sensex issues bonus shares, the divisor is adjusted so that the Sensex does not jump or drop just because of the corporate action. The divisor was set at the base year value in 1978-79 (base = 100) and has been adjusted thousands of times since.',

        'Why does this matter for a financial professional? Because weight in the index is determined by free-float market cap, not total market cap. This means a company like Reliance Industries, despite being India\'s largest by total market cap, might not have the highest Sensex weight if its promoter holding is large. Similarly, when you tell a client that "the market fell 500 points," the Sensex is heavily influenced by its top 5-7 stocks. A bad day for HDFC Bank, Reliance, Infosys, and ICICI Bank alone can move the Sensex by hundreds of points even if other stocks are flat.'
      ],
      keyTakeaways: [
        'Sensex is calculated using the free-float market capitalization methodology — only publicly tradable shares are counted.',
        'Free-float factor excludes promoter holdings, government stakes, and strategic investor shares from the calculation.',
        'Sensex = (Sum of Free-Float Market Cap of 30 stocks) / Index Divisor — the divisor adjusts for corporate actions to maintain continuity.',
        'Weight in the Sensex depends on free-float market cap, so the top 5-7 stocks can move the index by hundreds of points.',
        'The base year is 1978-79 (Sensex = 100); as of April 2026, it is around 74,000 — reflecting decades of market and economic growth.'
      ],
    },

    /* ──────────────────────────── 13 ──────────────────────────── */
    {
      id: 'real-estate-investment-trusts',
      title: 'Real Estate Investment Trusts (REITs)',
      description: 'Own a piece of commercial real estate without buying an entire building.',
      readTime: '5 min',
      content: [
        'A client says, "I want to invest in real estate but I don\'t have Rs 2 crore to buy a commercial property." Enter REITs — Real Estate Investment Trusts. A REIT is a company (structured as a trust) that owns, operates, or finances income-producing real estate. It pools money from many investors and invests in a portfolio of commercial properties — office buildings, malls, warehouses, or hotels. Investors buy units of the REIT on the stock exchange, just like shares or ETFs.',

        'India currently has a handful of listed REITs — Embassy Office Parks REIT, Mindspace Business Parks REIT, and Brookfield India REIT being the main ones. These hold millions of square feet of Grade A office space leased to companies like Google, JP Morgan, Amazon, and Infosys. The rental income flows to unit holders as distributions, typically quarterly. SEBI requires REITs to distribute at least 90% of their net distributable income to investors.',

        'The appeal is straightforward: you get exposure to commercial real estate with (1) low ticket size — you can buy a single unit for Rs 300-400, (2) liquidity — you can sell on the exchange anytime, unlike physical property which takes months to sell, (3) diversification — one REIT owns dozens of buildings across cities, spreading the risk, and (4) regular income — quarterly distributions typically yielding 6-8% annually, plus potential capital appreciation of the units.',

        'The taxation of REITs is a bit nuanced. Distributions have three components: interest income (taxed at your slab rate), dividend (taxed at slab rate post-2020), and return of capital (reduces your cost of acquisition, and hence increases capital gains when you eventually sell). Capital gains on selling REIT units follow the listed securities tax rules — 12.5% LTCG after one year (above Rs 1.25 lakh exemption). Always help clients understand this mixed taxation.',

        'For MFDs, REITs are a good diversification tool for clients who are overweight in equities and want some real estate exposure without the hassles of property management, tenant issues, and illiquidity. However, note that REITs are interest-rate sensitive — when RBI raises rates, REIT prices can fall because their distributions become less attractive relative to fixed deposits. Also, unlike mutual funds, REITs do not offer SIP options (though some platforms now allow fractional buying), and there is no trail commission for distributors. Your value lies in portfolio-level advice.'
      ],
      keyTakeaways: [
        'REITs pool investor money to own and operate income-producing commercial real estate, traded on the stock exchange.',
        'SEBI mandates that REITs distribute at least 90% of net distributable income — typical yield is 6-8% annually.',
        'REITs offer low ticket size, exchange liquidity, diversification across buildings and cities, and regular quarterly income.',
        'REIT distributions have three tax components: interest (slab rate), dividend (slab rate), and return of capital (reduces cost basis).',
        'REITs are interest-rate sensitive — rising rates can reduce REIT attractiveness relative to fixed-income alternatives.'
      ],
    },

    /* ──────────────────────────── 14 ──────────────────────────── */
    {
      id: 'underwriting',
      title: 'Underwriting',
      description: 'How investment banks help companies raise money through IPOs.',
      readTime: '4 min',
      content: [
        'When a company like Swiggy or Hyundai India decides to list on the stock exchange, it does not just wake up and start selling shares. It hires investment banks — called underwriters — to manage the entire process. Underwriting is essentially a guarantee: the underwriter promises to buy any shares that the public does not subscribe to, ensuring the company raises its target amount. In return, the underwriter earns a fee (typically 2-7% of the issue size).',

        'The IPO process begins long before listing day. The company and its underwriters (often called Book Running Lead Managers or BRLMs in India) prepare a Draft Red Herring Prospectus (DRHP) and file it with SEBI. After SEBI review, they conduct a roadshow — meeting institutional investors, mutual funds, and analysts to gauge demand. Based on this feedback, they set a price band (say Rs 350-370 per share). The book-building process then opens: investors bid within this range, and the final issue price is determined based on demand.',

        'There are two types of underwriting. In firm commitment underwriting, the underwriter guarantees the full issue — if investors subscribe to only 80% of the IPO, the underwriter must buy the remaining 20% from their own pocket. This is the more common form for large IPOs. In best efforts underwriting, the underwriter agrees to do their best to sell the shares but does not guarantee the full amount. If the issue is undersubscribed, unsold shares go back to the company. Firm commitment carries more risk for the underwriter but provides certainty to the issuing company.',

        'For financial professionals, understanding underwriting helps when advising clients on IPO investments. When marquee underwriters like Kotak, ICICI Securities, or Goldman Sachs are attached to an IPO, it lends credibility (though not a guarantee of post-listing performance). The "grey market premium" (GMP) that retail investors track before listing is essentially the market\'s expectation of listing gains, and it is influenced by how aggressively institutions bid during the book-building phase. Always remind clients: IPO investing is speculative, and many IPOs trade below issue price within six months of listing.'
      ],
      keyTakeaways: [
        'Underwriting is a guarantee by investment banks (BRLMs) to buy unsold shares in an IPO, ensuring the company raises its target amount.',
        'Firm commitment underwriting guarantees the full issue amount; best efforts underwriting does not guarantee full subscription.',
        'The IPO process involves DRHP filing with SEBI, roadshows, price band setting, and book-building to determine the final issue price.',
        'Marquee underwriters add credibility but do not guarantee post-listing performance — many IPOs trade below issue price within months.',
        'Underwriting fees typically range from 2-7% of the issue size, making it a lucrative business for investment banks.'
      ],
    },

    /* ──────────────────────────── 15 ──────────────────────────── */
    {
      id: 'differential-voting-rights',
      title: 'Differential Voting Rights (DVR)',
      description: 'Shares with different voting power — why they exist and what they mean.',
      readTime: '4 min',
      content: [
        'In a standard company, one share equals one vote. If you own 10% of a company\'s shares, you have 10% of the voting power at shareholder meetings. But what if a visionary founder wants to raise capital from the public without giving up control? Enter Differential Voting Rights (DVR) shares — a class of shares where the voting rights are different from ordinary shares.',

        'DVR shares can have either superior voting rights (more votes per share) or inferior voting rights (fewer votes per share). In India, Tata Motors was the pioneer — it issued DVR shares in 2008 that carry one-tenth the voting rights of ordinary shares (1 vote for every 10 shares instead of 1 vote per share). In exchange, DVR holders receive 5% higher dividends. The trade-off is clear: you give up voting power in return for a slightly better income stream. Tata Motors DVR shares have historically traded at a 35-45% discount to ordinary shares.',

        'In the US, dual-class share structures with superior voting rights are very common in tech companies. Google (Alphabet) has Class A shares (1 vote each), Class B shares (10 votes each, held by founders), and Class C shares (zero votes). This lets founders like Larry Page and Sergey Brin maintain control despite owning a small economic stake. In India, SEBI introduced a framework for shares with Superior Voting Rights (SR shares) in 2019, specifically for technology companies doing an IPO. The SR shares can have up to 10 votes each and can only be held by promoters who are actively involved in the company.',

        'Why should a financial professional care about DVRs? Two reasons. First, DVR shares often trade at a significant discount to ordinary shares — which creates an opportunity for value-conscious investors. If you believe Tata Motors\' business will do well, buying DVR at a 40% discount means you get the same economic exposure (same earnings, slightly higher dividend) at a much lower price. The risk is that the discount may persist or even widen. Second, when evaluating governance, understanding voting structures helps you assess whether minority shareholders have adequate protection — companies where founders hold disproportionate voting control may make decisions that benefit founders at the expense of public shareholders.'
      ],
      keyTakeaways: [
        'DVR shares carry different voting rights than ordinary shares — either superior (more votes) or inferior (fewer votes) per share.',
        'Tata Motors DVR has 1/10th voting rights but 5% higher dividend; it historically trades at a 35-45% discount to ordinary shares.',
        'SEBI\'s 2019 SR (Superior Voting Rights) framework allows tech company founders to hold shares with up to 10 votes each.',
        'DVR shares at a discount can offer value investors the same economic exposure at a lower price — but the discount may persist.',
        'Understanding voting structures helps evaluate corporate governance and whether minority shareholders are adequately protected.'
      ],
    },
  ],
};
