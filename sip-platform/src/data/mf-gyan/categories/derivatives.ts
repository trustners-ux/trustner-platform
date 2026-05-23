import { GyanCategory } from '@/types/mf-gyan';

export const DERIVATIVES: GyanCategory = {
  id: 'derivatives',
  title: 'Derivatives',
  description:
    'Options, futures, and hedging — understanding derivative instruments and how they work in real markets.',
  icon: 'Layers',
  color: 'text-purple-600',
  bgColor: 'bg-purple-50',
  gradientFrom: 'from-purple-500',
  gradientTo: 'to-purple-700',
  topics: [
    /* ──────────────────────────────────────────────────── 1 ── */
    {
      id: 'call-option',
      title: 'Call Option',
      description: 'The right to buy — explained through a farmer and baker story.',
      readTime: '4 min',
      content: [
        'Let us start with a simple story. Ramesh is a baker in a small town. He needs 100 kg of wheat every month to keep his bakery running. Right now wheat costs Rs 30 per kg, which works perfectly for his business. But the monsoon forecast is uncertain this year and prices could shoot up to Rs 45 by July. Ramesh is worried.',

        'So Ramesh goes to Suresh, a wheat farmer, and says — "I will pay you Rs 2 per kg today as a fee. In return, give me the right to buy 100 kg of wheat from you at Rs 32 per kg anytime in the next three months." Suresh agrees. He pockets the Rs 200 fee immediately and is happy because he thinks Rs 32 is a fair price.',

        'Fast forward to July. Wheat prices have indeed jumped to Rs 44 per kg in the open market. Ramesh smiles and exercises his right — he buys from Suresh at Rs 32 as agreed. His total cost is Rs 34 per kg (Rs 32 price + Rs 2 premium he paid earlier). He saves Rs 10 per kg compared to the market price. That is a call option in action.',

        'Now imagine instead that the monsoon was great and wheat prices actually fell to Rs 25. Ramesh simply does not exercise his right. Why would he buy at Rs 32 when the market is selling at Rs 25? He lets the agreement expire and loses only the Rs 200 premium. That is the beauty of a call option — your downside is limited to the premium you paid, but your upside is theoretically unlimited.',

        'In the stock market it works identically. When you buy a Nifty call option at a strike price of 23,000 by paying a premium of Rs 200, you get the right (not obligation) to buy Nifty at 23,000 before expiry. If Nifty goes to 23,500, your option is worth Rs 500 and you pocket the difference minus premium. If Nifty stays below 23,000, you lose only the Rs 200 premium. Simple.',
      ],
      keyTakeaways: [
        'A call option gives you the RIGHT to buy at a fixed price — there is no obligation.',
        'The maximum you can lose is the premium you paid upfront.',
        'Call options are useful when you expect prices to go UP.',
        'The seller (writer) of the call keeps the premium but takes on unlimited risk if prices rise.',
        'In India, stock and index options settle in cash on NSE — no physical delivery of Nifty!',
      ],
    },

    /* ──────────────────────────────────────────────────── 2 ── */
    {
      id: 'put-option',
      title: 'Put Option',
      description: 'The right to sell — insurance for your portfolio.',
      readTime: '4 min',
      content: [
        'If a call option is the right to buy, a put option is the right to sell. Think of it from the seller\'s perspective this time. Meena grows tomatoes and sells them at the local mandi. Tomato prices are wildly volatile — Rs 80 per kg one week, Rs 15 the next. She needs some certainty to plan her finances.',

        'Meena approaches a trader and says — "I will pay you Rs 5 per kg as a fee. In return, guarantee that I can sell my tomatoes to you at Rs 40 per kg anytime in the next two months." The trader agrees, pocketing the premium. If market prices stay above Rs 40, Meena will just sell in the open market and the trader keeps the Rs 5 fee. If prices crash to Rs 12, Meena exercises her right and sells at Rs 40.',

        'This is exactly how a put option works in the stock market. Say you hold Reliance shares currently trading at Rs 1,300. You are worried about a potential correction. You buy a put option with a strike price of Rs 1,250 by paying a premium of Rs 30. If Reliance drops to Rs 1,100, you can sell at Rs 1,250 using your put. Your effective selling price is Rs 1,220 (Rs 1,250 minus Rs 30 premium). Without the put, you would have been stuck at Rs 1,100.',

        'Put options are essentially insurance policies for your holdings. Just like you pay a car insurance premium hoping you never need to use it, you pay a put premium hoping the market does not crash. But if it does, you are protected. In April 2026, with Nifty hovering around the 23,000 level and global uncertainty from trade wars, many institutional investors routinely buy Nifty puts as portfolio insurance.',

        'One important nuance — the put buyer has limited risk (just the premium) but the put seller has significant risk. If the market crashes hard, the put seller must buy at the strike price even though the asset is worth much less. This is why put selling requires margin money and is typically done by experienced traders or institutions.',
      ],
      keyTakeaways: [
        'A put option gives you the RIGHT to sell at a fixed price — it is portfolio insurance.',
        'Put buyers profit when prices FALL — they can sell at a higher strike price.',
        'Maximum loss for the put buyer is limited to the premium paid.',
        'Put sellers collect premium but face significant risk if markets crash.',
        'Buying puts on your existing holdings is called a "protective put" strategy.',
      ],
    },

    /* ──────────────────────────────────────────────────── 3 ── */
    {
      id: 'commodity-hedging',
      title: 'Commodity Hedging',
      description: 'How businesses protect themselves from unpredictable raw material prices.',
      readTime: '4 min',
      content: [
        'Imagine you run a jewellery business. Gold is your primary raw material and its price swings can make or break your margins. In January you promised a customer a wedding set at a fixed price for delivery in April. If gold prices jump 10% between now and then, your entire profit margin evaporates. This is exactly the kind of risk commodity hedging solves.',

        'Hedging simply means taking a position in the derivatives market that is opposite to your position in the physical market. As a jeweller who needs to BUY gold in the future, you would go LONG on gold futures today. You lock in today\'s price. If gold rises, your futures position makes money that offsets the higher purchase cost. If gold falls, your futures position loses money but you buy the physical gold cheaper. Either way, your effective cost is roughly what you planned for.',

        'This is not speculation — it is risk management. Airlines hedge jet fuel costs. Food companies hedge wheat and sugar. Indian oil marketing companies hedge crude oil. In April 2026, with crude oil trading around $70-75 per barrel, Indian refiners like IOC and BPCL actively use MCX crude futures and international Brent contracts to lock in their input costs months in advance.',

        'The key point is that hedging does not make you extra profit. It removes uncertainty. The jeweller who hedged will not benefit if gold prices fall dramatically — the hedge works both ways. But the business can plan confidently, quote fixed prices to customers, and sleep peacefully. For most businesses, predictable margins are worth more than the chance of windfall gains.',

        'In India, commodity derivatives are traded on MCX (Multi Commodity Exchange) and NCDEX. Gold, silver, crude oil, natural gas, and agricultural commodities like cotton and castor seed have active futures markets. SEBI regulates these exchanges and has gradually expanded the range of tradeable commodities over the years.',
      ],
      keyTakeaways: [
        'Hedging means taking an opposite position in derivatives to protect against price movements in physical goods.',
        'It removes uncertainty — not a way to make extra profit but a way to lock in planned margins.',
        'Airlines hedge fuel, jewellers hedge gold, food companies hedge grains — it is a universal practice.',
        'In India, MCX and NCDEX are the main commodity derivatives exchanges regulated by SEBI.',
        'Hedging works both ways — it caps your losses but also limits windfall gains.',
      ],
    },

    /* ──────────────────────────────────────────────────── 4 ── */
    {
      id: 'currency-derivatives',
      title: 'Currency Derivatives',
      description: 'Managing forex risk — how importers and exporters protect their bottom line.',
      readTime: '4 min',
      content: [
        'India imports over $700 billion worth of goods annually — crude oil, electronics, gold, machinery. Every single one of these transactions involves converting rupees to dollars (or euros, yen, etc.). When the rupee weakens from 84 to 86 against the dollar, an importer paying $1 million suddenly needs Rs 2 lakh more. That is a real hit to the bottom line with no change in the actual business.',

        'Currency derivatives help manage this risk. An importer who needs to pay $1 million in three months can buy a USD/INR futures contract on NSE today. Say the current rate is Rs 85 and the three-month futures are trading at Rs 85.40 (the slight premium reflects interest rate differentials). The importer locks in Rs 85.40 and knows exactly what the payment will cost, regardless of where the spot rate goes.',

        'Exporters face the opposite problem. An IT company billing clients in dollars worries about the rupee strengthening. If the rupee moves from 85 to 83, every dollar of revenue converts to fewer rupees. So exporters sell USD/INR futures to lock in their conversion rate. In April 2026, with USD/INR hovering around Rs 85, Indian IT giants like TCS and Infosys routinely hedge a portion of their expected dollar revenues.',

        'Beyond futures, currency options are also popular. An importer might buy a USD/INR call option — paying a small premium for the right to buy dollars at a fixed rate. If the rupee weakens sharply, the option protects them. If the rupee actually strengthens, they let the option expire and buy dollars cheaper in the spot market. Options cost more (the premium) but offer more flexibility than futures.',

        'RBI actively monitors the currency derivatives market and sometimes intervenes in the forex market to prevent excessive volatility. India\'s forex reserves of approximately $650 billion as of early 2026 give RBI significant firepower to manage rupee fluctuations. But for individual businesses, relying on RBI intervention is not a strategy — proper hedging through derivatives is.',
      ],
      keyTakeaways: [
        'Currency derivatives help importers and exporters lock in exchange rates and remove forex uncertainty.',
        'Importers buy USD/INR futures to protect against rupee weakening; exporters sell them to protect against rupee strengthening.',
        'Currency options offer more flexibility than futures — you pay a premium but can walk away if the rate moves in your favour.',
        'NSE offers USD/INR, EUR/INR, GBP/INR, and JPY/INR currency derivatives.',
        'With USD/INR around Rs 85 in April 2026, hedging is especially important for businesses with large forex exposures.',
      ],
    },

    /* ──────────────────────────────────────────────────── 5 ── */
    {
      id: 'derivative-market',
      title: 'Derivative Market',
      description: 'An overview of the marketplace where derivative instruments are traded.',
      readTime: '4 min',
      content: [
        'A derivative is a financial contract whose value is derived from something else — a stock, an index, a commodity, a currency, or even an interest rate. The "something else" is called the underlying asset. The derivative market is simply the marketplace where these contracts are bought and sold. In India, this market has grown enormously over the past two decades.',

        'There are two types of derivative markets. Exchange-traded derivatives are standardised contracts traded on recognised exchanges like NSE, BSE, and MCX. Everything is transparent — contract sizes, expiry dates, margin requirements — and a clearing corporation guarantees settlement. Over-the-counter (OTC) derivatives are customised contracts negotiated privately between two parties, common among banks and large institutions for interest rate swaps and currency forwards.',

        'India\'s derivative market is dominated by index options, particularly Nifty and Bank Nifty options on NSE. In fact, NSE is consistently among the top derivative exchanges globally by number of contracts traded. On a typical trading day in April 2026, Nifty options alone see notional turnover of several lakh crore rupees. This massive volume provides excellent liquidity for hedgers and traders.',

        'The key participants in the derivative market are hedgers (who want to reduce risk, like the jeweller or importer we discussed), speculators (who take directional bets hoping to profit from price movements), and arbitrageurs (who exploit tiny price differences between markets for risk-free profit). All three are essential — hedgers need speculators to take the other side of their trades, and arbitrageurs keep prices efficient.',

        'SEBI regulates India\'s derivative market and has introduced several reforms over the years — peak margin rules, position limits, and restrictions on certain expiry-day strategies. If you are an investor using mutual funds, you may never directly trade derivatives. But understanding how this market works helps you appreciate how fund managers hedge risk and why market volatility behaves the way it does.',
      ],
      keyTakeaways: [
        'Derivatives derive their value from an underlying asset — stocks, indices, commodities, or currencies.',
        'Exchange-traded derivatives (NSE, MCX) are standardised and guaranteed; OTC derivatives are customised and private.',
        'India\'s NSE is among the world\'s largest derivative exchanges by contract volume.',
        'Three key participants: hedgers (reduce risk), speculators (bet on direction), and arbitrageurs (exploit price gaps).',
        'SEBI actively regulates derivative markets with margin rules, position limits, and trading restrictions.',
      ],
    },

    /* ──────────────────────────────────────────────────── 6 ── */
    {
      id: 'derivatives-vs-cash-market',
      title: 'Derivatives vs Cash Market',
      description: 'Key differences between buying the actual asset and trading derivative contracts.',
      readTime: '4 min',
      content: [
        'When you buy shares of Reliance on NSE and they land in your demat account, you are operating in the cash market (also called the spot market or equity market). You own the shares outright. You can hold them for a day or for twenty years. You receive dividends and can vote in shareholder meetings. This is straightforward ownership.',

        'In the derivatives market, you do not own the underlying asset. You hold a contract that references the asset. A Reliance futures contract gives you exposure to Reliance\'s price movement, but you do not actually own Reliance shares. You cannot receive dividends and you have no shareholder rights. The contract has an expiry date — in India, monthly or weekly — after which it ceases to exist.',

        'The biggest practical difference is leverage. To buy Rs 10 lakh worth of Reliance shares in the cash market, you need Rs 10 lakh. To take a Rs 10 lakh position in Reliance futures, you only need to put up margin money — roughly Rs 1.5 to 2 lakh depending on SEBI\'s margin requirements. This leverage amplifies both gains and losses. A 5% move in Reliance means a 5% gain or loss on your cash market investment, but it could mean a 25-30% gain or loss on your futures position.',

        'Settlement is another key difference. Cash market trades in India settle on a T+1 basis — you pay today and get shares tomorrow. Derivative contracts are marked-to-market daily. Your profit or loss is calculated every evening and credited or debited from your margin account. If losses eat into your margin beyond a threshold, you get a margin call and must deposit more money immediately or your position gets squared off.',

        'For long-term wealth building through mutual funds and SIPs, the cash market is your world. Derivatives serve specific purposes — hedging, short-term trading, portfolio insurance. They are powerful tools but not meant for building a retirement corpus. Understanding the difference helps you appreciate why your mutual fund SIP invests in actual stocks and bonds, not derivative contracts.',
      ],
      keyTakeaways: [
        'Cash market = buying the actual asset with full payment; Derivatives = contracts referencing the asset with margin.',
        'Derivatives offer leverage — smaller capital controls larger positions, amplifying both gains and losses.',
        'Cash market positions have no expiry; derivative contracts expire weekly or monthly.',
        'Derivatives are marked-to-market daily and can trigger margin calls if losses mount.',
        'For long-term wealth creation via SIPs, the cash market is appropriate — derivatives are for hedging and trading.',
      ],
    },

    /* ──────────────────────────────────────────────────── 7 ── */
    {
      id: 'futures-contract',
      title: 'Futures Contract',
      description: 'An obligation to buy or sell at a predetermined price on a future date.',
      readTime: '4 min',
      content: [
        'A futures contract is an agreement between two parties to buy or sell a specific asset at a specific price on a specific future date. Unlike an option (which gives you the right but not the obligation), a futures contract is a binding commitment. Both the buyer and the seller MUST honour the contract at expiry. This is the fundamental distinction.',

        'Let us say Nifty is at 23,000 today and you buy a Nifty April futures contract at 23,050 (the slight premium over spot price is called the "cost of carry" and reflects interest rates and dividends). You are now obligated to buy Nifty at 23,050 on the expiry date. If Nifty goes to 23,500 by expiry, you make Rs 450 per unit. If Nifty drops to 22,500, you lose Rs 550 per unit. There is no walking away.',

        'Futures contracts are standardised by the exchange. On NSE, a Nifty futures lot size is a specific number of units (it changes periodically — check the current lot size on NSE\'s website). The contract has a fixed expiry — the last Thursday of the month. There are always three monthly contracts available: current month, next month, and the month after. In addition, weekly expiry contracts are available for Nifty and other select indices.',

        'The margin system makes futures accessible. Instead of paying the full contract value, you deposit initial margin (set by the exchange based on volatility — typically 10-15% for index futures). Profits and losses are settled daily through mark-to-market. If your position moves against you and margin falls below the maintenance level, you must top up immediately. This daily settlement means you cannot simply "hold and hope" like you might with stocks.',

        'Who uses futures? A portfolio manager expecting a market correction might sell Nifty futures to hedge the portfolio without actually selling any stocks. An arbitrageur might buy stocks in the cash market and sell futures simultaneously if the futures are trading at a premium. A speculator might buy Bank Nifty futures anticipating strong banking results. Each participant uses the same instrument for a different purpose.',
      ],
      keyTakeaways: [
        'Futures are binding contracts — both buyer and seller MUST settle at expiry, unlike options where the buyer can walk away.',
        'The futures price includes a "cost of carry" premium over the spot price reflecting interest rates.',
        'Margin requirements make futures capital-efficient but also introduce leverage risk.',
        'Daily mark-to-market settlement means profits and losses are realised every day, not just at expiry.',
        'Futures serve hedgers, speculators, and arbitrageurs — same instrument, different purposes.',
      ],
    },

    /* ──────────────────────────────────────────────────── 8 ── */
    {
      id: 'margin-money',
      title: 'Margin Money',
      description: 'Initial and maintenance margin — the collateral that keeps derivative markets running.',
      readTime: '4 min',
      content: [
        'When you buy shares in the cash market, you pay the full amount. When you trade derivatives, you only put up a fraction of the contract value as a good-faith deposit. This deposit is called margin money. It ensures that both parties have skin in the game and can honour their commitments. Without margins, the derivative market would be built on promises with no backing.',

        'There are two key types of margin. Initial margin is the amount you must deposit when you first enter a position. For Nifty futures, this is typically around 10-12% of the contract value. So if a Nifty futures contract is worth Rs 11.5 lakh (23,000 x lot size), you might need to deposit around Rs 1.3-1.4 lakh as initial margin. This margin is calculated using sophisticated models (SPAN + exposure margin) that factor in volatility and worst-case price moves.',

        'Maintenance margin is the minimum balance you must maintain in your margin account. When daily mark-to-market losses reduce your margin below this threshold, you receive a margin call — a demand to deposit additional funds immediately. If you fail to meet the margin call, your broker will forcibly close your position to limit further losses. In volatile markets, margin calls can come thick and fast.',

        'SEBI introduced peak margin rules starting in 2021, which require traders to maintain adequate margin throughout the trading day, not just at the end. This was a major shift from the earlier practice where intraday traders could take large positions with minimal margin and square off before the end of the day. Peak margin has made the system safer but has also increased the capital required for active derivative trading.',

        'For mutual fund investors, understanding margin helps explain why derivative strategies in certain schemes (like arbitrage funds or some dynamic asset allocation funds) work the way they do. The fund manager puts up margin to take futures positions, and the remaining capital earns returns in debt instruments. The margin system is the invisible plumbing that makes the entire derivative market function safely.',
      ],
      keyTakeaways: [
        'Margin money is a collateral deposit — typically 10-15% of contract value for index futures.',
        'Initial margin is paid when entering a position; maintenance margin is the minimum ongoing balance required.',
        'Failing to meet a margin call results in forced closure of your position by the broker.',
        'SEBI\'s peak margin rules require adequate margin throughout the day, not just at day-end.',
        'Arbitrage funds and certain MF strategies use the margin-plus-debt structure to generate returns.',
      ],
    },

    /* ──────────────────────────────────────────────────── 9 ── */
    {
      id: 'options-basics',
      title: 'Options Basics',
      description: 'Calls, puts, premiums, and the essential vocabulary of options trading.',
      readTime: '5 min',
      content: [
        'An option is a contract that gives you the right, but not the obligation, to buy or sell an underlying asset at a specified price before or on a specific date. There are only two types — a call option (right to buy) and a put option (right to sell). Every option has four key elements: the underlying asset (what you are trading), the strike price (the price at which you can buy/sell), the expiry date (when the right expires), and the premium (the price you pay for this right).',

        'The premium is determined by the market through supply and demand, but broadly depends on two components. Intrinsic value is the real, tangible value — if Nifty is at 23,200 and you hold a 23,000 call option, the intrinsic value is Rs 200 because you can buy at 23,000 and immediately sell at 23,200. Time value is the extra amount people are willing to pay for the possibility that the option could become more valuable before expiry. An option with 30 days to expiry has more time value than one with 3 days.',

        'Options can be "in the money" (ITM), "at the money" (ATM), or "out of the money" (OTM). A 23,000 call is ITM when Nifty is at 23,200 (positive intrinsic value), ATM when Nifty is around 23,000, and OTM when Nifty is at 22,800 (no intrinsic value — only time value). OTM options are cheaper because there is a lower probability of them becoming profitable, but they also offer higher percentage returns if the market makes a big move.',

        'In India, most actively traded options are European-style, meaning they can only be exercised at expiry, not before. However, you can always sell the option back in the market before expiry. Nifty weekly options expire every Thursday, providing very short-term trading opportunities. The massive liquidity in Nifty options — with bid-ask spreads often as tight as Rs 0.05 — makes NSE one of the most efficient options markets in the world.',

        'A common mistake beginners make is thinking options are "cheap" because the premium seems small. A Rs 100 premium on an OTM option may seem trivial, but if the option expires worthless (which happens more often than not for OTM options), you lose 100% of your investment. Data consistently shows that the majority of options expire worthless. Options are sophisticated instruments — powerful for hedging and strategic use, but treacherous for uninformed speculation.',
      ],
      keyTakeaways: [
        'Options give you the RIGHT (not obligation) to buy (call) or sell (put) at a fixed strike price.',
        'Premium = Intrinsic Value + Time Value. Time value decays as expiry approaches (theta decay).',
        'ITM options have intrinsic value, ATM are near the current price, OTM have only time value.',
        'Most options expire worthless — option buying seems cheap but has a high failure rate.',
        'India\'s Nifty options on NSE are among the most liquid in the world with weekly and monthly expiries.',
      ],
    },

    /* ──────────────────────────────────────────────────── 10 ── */
    {
      id: 'weather-derivatives',
      title: 'Weather Derivatives',
      description: 'Hedging against the unpredictable — how businesses manage weather-related financial risk.',
      readTime: '4 min',
      content: [
        'Not all risks are about stock prices or interest rates. For many businesses, weather is the single biggest variable affecting revenues and costs. An umbrella manufacturer thrives in a rainy monsoon but suffers in a dry year. An ice cream company\'s sales soar in a hot summer and slump during a cool one. A power utility faces massive demand spikes during heat waves. Weather derivatives were created to manage exactly these kinds of risks.',

        'A weather derivative is a financial contract whose payout is based on a measurable weather index — typically temperature, rainfall, snowfall, or wind speed. For example, a power company in Delhi might buy a "cooling degree day" contract for June-July. If the average temperature exceeds a specified threshold (meaning more AC usage and higher power demand), the company receives a payout to offset its increased fuel costs. If temperatures are mild, the contract expires worthless and the company only loses the premium.',

        'These instruments originated in the late 1990s in the US energy sector. Enron (before its scandal) was actually a pioneer in weather derivatives trading. Today, the Chicago Mercantile Exchange (CME) lists standardised weather futures and options based on temperature indices for major cities. The market is relatively small compared to equity or commodity derivatives, but it fills a crucial niche.',

        'In India, weather derivatives are still nascent but the potential is enormous given our dependence on the monsoon. Agriculture, power generation, tourism, and consumer goods are all heavily weather-sensitive. SEBI and commodity exchanges have explored weather-based contracts, and as India\'s financial markets mature, we are likely to see more development in this space. Some insurance companies already offer weather-indexed crop insurance, which is conceptually similar.',

        'The fundamental idea is powerful — if a risk can be measured objectively and independently (temperature data from IMD, for instance), it can be turned into a tradeable financial contract. This separates weather risk management from traditional insurance, which requires proof of actual loss. With a derivative, the payout is automatic once the weather index crosses the trigger. No claims process, no adjuster visits, no delays.',
      ],
      keyTakeaways: [
        'Weather derivatives pay out based on measurable weather indices — temperature, rainfall, wind speed.',
        'They help businesses whose revenues or costs are directly affected by weather conditions.',
        'Unlike insurance, payouts are triggered automatically when the index crosses a threshold — no claims process needed.',
        'CME lists standardised weather futures globally; India is still developing this market.',
        'India\'s monsoon dependency makes weather derivatives potentially very relevant for agriculture and power sectors.',
      ],
    },

    /* ──────────────────────────────────────────────────── 11 ── */
    {
      id: 'option-strategies',
      title: 'Option Strategies',
      description: 'Basic strategies — covered call, protective put, and how to combine options for different payoffs.',
      readTime: '5 min',
      content: [
        'Individual call and put options are building blocks. The real power of options emerges when you combine them into strategies tailored to specific market views. You do not always need to bet on the market going up or down — options let you profit from sideways markets, high volatility, low volatility, and even from the passage of time itself. Let us look at the most fundamental strategies.',

        'The covered call is probably the most conservative option strategy. You own shares of a stock (say 250 shares of Reliance at Rs 1,300) and you sell a call option at a higher strike price (say Rs 1,400) for a premium of Rs 20. If Reliance stays below Rs 1,400 by expiry, the option expires worthless and you keep the Rs 20 premium as extra income on top of your shareholding. If Reliance goes above Rs 1,400, your shares get called away at Rs 1,400 — you miss out on further upside but still profit. This strategy is ideal for generating income from stocks you hold for the long term, in a market you expect to move sideways or slightly upward.',

        'The protective put is essentially buying insurance for your stock holdings. You own shares and buy a put option at a strike price below the current market price. If the stock crashes, the put increases in value and offsets your loss. If the stock rises, you benefit from the upside and the put expires worthless — you lose only the premium. Think of it like paying car insurance premium every year. Most of the time you do not need it, but when you do, you are glad you had it.',

        'A bull call spread involves buying a call at one strike price and simultaneously selling a call at a higher strike price. This reduces your net premium cost (the sold call partially finances the bought call) but also caps your maximum profit. For example, with Nifty at 23,000, you buy a 23,000 call for Rs 200 and sell a 23,200 call for Rs 120. Net cost is Rs 80. Maximum profit is Rs 120 (the Rs 200 spread minus Rs 80 cost). This works well when you are moderately bullish but do not want to pay a high premium.',

        'A straddle involves buying both a call and a put at the same strike price and expiry. You profit if the market makes a big move in EITHER direction. The catch is that you pay two premiums, so the move needs to be big enough to cover both costs. Traders use straddles before major events — budget announcements, RBI policy decisions, election results — when they expect volatility but are unsure about the direction. If the market barely moves, both options lose value and you lose both premiums. Strategies like these demonstrate why options are called instruments of precision — the payoff matches your exact market view.',
      ],
      keyTakeaways: [
        'Covered call: own the stock + sell a call = generate extra income in sideways markets.',
        'Protective put: own the stock + buy a put = insurance against a sharp decline.',
        'Bull call spread: buy a lower strike call + sell a higher strike call = limited cost, limited profit, moderately bullish.',
        'Straddle: buy call + put at same strike = profit from big moves in either direction, loses if market stays flat.',
        'Option strategies let you express precise market views beyond just "up" or "down".',
      ],
    },
  ],
};
