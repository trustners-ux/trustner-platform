import { LearningModule } from '@/types/learning';

export const sifStrategiesDeepModule: LearningModule = {
  id: 'sif-strategies-deep',
  title: 'SIF Strategies — Deep Dive',
  slug: 'sif-strategies-deep',
  icon: 'Layers',
  description:
    'A working-level walk-through of the three SEBI-permitted SIF strategy archetypes — Equity Long-Short, Debt Long-Short, Hybrid Long-Short — with portfolio construction mechanics, expected drawdown profiles, fee structures and the typical investor decision tree for each.',
  level: 'intermediate',
  color: 'from-indigo-600 to-purple-600',
  estimatedTime: '40 min',
  track: 'sif',
  sections: [
    {
      id: 'sif-equity-long-short',
      title: 'Equity Long-Short Strategy — Mechanics',
      slug: 'sif-equity-long-short',
      content: {
        definition:
          'An Equity Long-Short SIF runs a portfolio of long equity positions (companies expected to outperform) alongside short equity positions (companies expected to underperform), implemented through stock futures, single-stock futures, and the SLB mechanism. Net equity exposure is dynamically managed, ranging from fully long to market-neutral, with the explicit objective of capital appreciation through stock-picking on both sides while reducing portfolio drawdowns during corrections.',
        explanation:
          'A typical Indian Equity Long-Short SIF maintains gross exposure of 130-170% of NAV (long book + absolute value of short book) with net exposure of 50-100%. For example, a fund with ₹100 NAV may hold ₹110 in long positions and ₹40 in short positions, giving net 70% long and gross 150%. The long book is built on bottom-up conviction picks — typically 25-40 stocks selected for quality, growth, valuation, or special-situation reasons. The short book is built around three thesis types: structural shorts (companies with deteriorating fundamentals or unsustainable business models), valuation shorts (companies trading at premium multiples relative to earnings power), and pair shorts (one stock shorted against another long stock in the same sector to express a relative view). The SEBI framework permits specific instruments — exchange-traded stock futures, index futures, options for hedging, and SLB-based cash shorts within position limits. Naked uncovered shorts and OTC derivatives are not permitted. Performance attribution typically splits into long-book alpha (active stock-picking on the long side), short-book alpha (active stock-picking on the short side), and beta-management alpha (sizing of net exposure through market cycles). A skilled long-short manager generates alpha across all three; a poor manager simply runs a long-only book with the short book acting as expensive insurance. Investors evaluating Indian Equity Long-Short SIFs should examine the manager\'s historical net-of-fee returns versus a benchmark blended for their typical net exposure (e.g., 70% Nifty 50 + 30% liquid fund returns is a fair benchmark for a 70% net-long fund).',
        realLifeExample:
          'Consider a hypothetical Equity Long-Short SIF managing ₹500 crore. The portfolio holds ₹540 crore long across 32 stocks (HDFC Bank, ICICI Bank, TCS, Reliance, Bajaj Finance, etc.) and ₹160 crore short across 18 stocks via stock futures. Gross exposure ₹700 crore (140%); net long ₹380 crore (76%). During a 12% Nifty correction, the long book falls 13% (-₹70 cr) but the short book gains 16% (+₹26 cr). Net portfolio loss: ₹44 cr or roughly 8.8% — versus 12% for a pure long-only fund. The manager has captured 73% of the downside instead of 100%. During a subsequent 18% recovery, long book gains 19% (+₹103 cr) while short book loses 11% (-₹18 cr). Net portfolio gain: ₹85 cr or 17% — versus 18% for the long-only fund. Across the cycle, the SIF delivered 8.0% net while the long-only delivered 5.0%, and the SIF\'s drawdown was materially shallower. This is the structural value proposition.',
        keyPoints: [
          'Equity LS SIFs target asymmetric returns through long-side stock picking + short-side hedging.',
          'Typical structure: 130-170% gross exposure, 50-100% net long.',
          'Three short thesis types: structural, valuation, pair shorts.',
          'Permitted instruments: stock futures, index futures, hedging options, SLB-based shorts.',
          'Performance attribution: long-book alpha + short-book alpha + beta-management alpha.',
          'Benchmark properly: blended (net-exposure × Nifty + remainder × liquid).',
          'Drawdown reduction is the structural benefit; outperformance vs long-only is fund-specific.',
        ],
        faq: [
          {
            question: 'Can an Equity LS SIF be net short?',
            answer:
              'Yes — SEBI permits net short positioning, though most Indian Equity LS SIFs maintain at least 30-50% net long as their typical posture. A genuinely market-neutral or net-short SIF would target absolute returns through pure stock-picking alpha. Investors should read the scheme\'s investment mandate to understand the net-exposure range.',
          },
          {
            question: 'What does "alpha" mean in a long-short context?',
            answer:
              'Alpha is the excess return generated by the manager\'s active decisions, beyond what a passive market exposure would deliver. In a long-short fund, alpha can come from: better-than-benchmark long picks (+long alpha), correctly-shorting underperformers (+short alpha), and well-timed adjustment of net exposure through market cycles (+beta-management alpha). High-quality long-short managers compound alpha across multiple years.',
          },
          {
            question: 'Are SIF short positions risky in violent rallies?',
            answer:
              'Yes. When markets rally sharply, the short book loses money while the long book gains — but if the long book gains less than the short book loses (or simultaneously the long picks lag the broader market), the fund underperforms. This is normal and expected; a well-constructed long-short fund accepts this risk in exchange for drawdown protection during corrections. The risk is most acute in sharp short-covering rallies where heavily-shorted stocks gap up.',
          },
          {
            question: 'How is fee structure typically set for Equity LS SIFs?',
            answer:
              'Indian Equity LS SIFs typically charge 2.0-2.5% fixed management fee plus 15-20% performance fee above an 8-10% hurdle, with high-water mark provisions. The total expense ratio (including performance fee in good years) can be 3-5% — materially higher than mutual funds. Net-of-fee returns must clear this hurdle for the structure to add value over a passive index alternative.',
          },
        ],
        mcqs: [
          {
            question: 'A typical Equity LS SIF holds gross exposure (long + short absolute) of:',
            options: ['Less than 50%', '80-100%', '130-170%', 'Above 200%'],
            correctAnswer: 2,
            explanation:
              'A typical Equity LS SIF maintains gross exposure of 130-170% (long book + absolute value of short book). Higher gross indicates more aggressive use of derivatives to express conviction views.',
          },
          {
            question: 'Performance attribution in a long-short fund typically separates:',
            options: [
              'Total return only',
              'Long-book alpha, short-book alpha, beta-management alpha',
              'Domestic vs international',
              'Equity vs debt',
            ],
            correctAnswer: 1,
            explanation:
              'Sophisticated performance attribution decomposes returns into long-book alpha (active long-side stock picking), short-book alpha (active short-side stock picking), and beta-management alpha (timing of net-exposure changes). Each is evaluated independently to assess true manager skill.',
          },
          {
            question: 'During a violent short-covering rally, an Equity LS SIF typically:',
            options: [
              'Outperforms long-only funds',
              'Underperforms long-only funds because the short book loses',
              'Has zero impact',
              'Doubles its returns',
            ],
            correctAnswer: 1,
            explanation:
              'When heavily-shorted stocks gap up in a short-covering rally, the short book loses money disproportionately, causing the long-short fund to underperform a long-only fund in that specific period. This is a known cyclical behaviour of long-short strategies.',
          },
        ],
        summaryNotes: [
          'Equity LS = long-conviction picks + short-side hedging via futures/SLB.',
          'Gross 130-170%, net 50-100% typical; structural drawdown reduction.',
          'Alpha decomposed across long, short, and beta-management.',
          'Fees are higher than MFs; net-of-fee outperformance is the test.',
        ],
        relatedTopics: ['sif-strategies', 'sif-debt-long-short', 'sif-hybrid-long-short'],
      },
    },

    {
      id: 'sif-debt-long-short',
      title: 'Debt Long-Short Strategy — Mechanics',
      slug: 'sif-debt-long-short',
      content: {
        definition:
          'A Debt Long-Short SIF takes long and short positions across the bond and yield-curve spectrum to generate absolute returns regardless of the broader interest rate cycle. The long book buys bonds expected to rally (price gains as yields fall) while the short book takes positions in bonds expected to underperform, typically through interest rate futures, bond futures, and curve-spread trades.',
        explanation:
          'Debt long-short strategies in India are still nascent — the bond market lacks the depth of equity for instrument-level shorting, but yield-curve trades, government bond futures (10Y G-Sec futures available at NSE), and credit spread positions offer the building blocks. A typical Indian Debt LS SIF expresses three trade types: (1) Duration bets — long short-duration + short long-duration when the yield curve is expected to flatten, or vice versa for steepening; (2) Credit spread trades — long higher-quality credit + short lower-quality credit, or pair trades within the same rating band; (3) Carry trades — buying high-yielding bonds and partially hedging duration through interest rate futures. The objective is absolute returns, typically targeting 8-12% gross IRR with materially lower volatility than long-only debt funds. The alpha comes from anticipating yield-curve shape changes, sector-level credit-spread movements, and relative-value opportunities. Importantly, Debt LS SIFs are NOT designed to outperform a long-only debt fund in a sharp rally cycle (where duration-heavy long-only debt funds rally substantially). Their value emerges in volatile or sideways yield environments, and during yield-curve inversions or credit dislocations where long-only managers have limited tools to express defensive views. The strategy is operationally complex and demands a manager with deep fixed-income institutional experience — typically ex-treasury or ex-bond-trading desks of large banks. Manager evaluation should focus on IRR consistency across multiple yield environments rather than single-year peak returns.',
        realLifeExample:
          'Consider a Debt LS SIF managing ₹300 crore during the 2024 yield-curve flattening. The manager holds long positions in 3-5 year G-Secs (yielding 7.0%) and shorts the 10-year G-Sec future (yielding 7.4%) when the spread reaches 40 bps and the manager expects flattening. As the 10Y rallies (yield falls from 7.4% to 7.1%), the long position appreciates with carry, and the short position loses money. But the spread compresses from 40 bps to 25 bps, generating ~0.5% spread-trade gain. Concurrently, the long book\'s carry of 7% × 0.5 yr = 3.5% adds substantial absolute return. Net: the fund earns ~5-7% over the half-year period, with low volatility, regardless of the absolute yield direction. A pure long-only debt fund focused on the 10Y might have earned 4-6% from price appreciation alone but with materially higher volatility through the period.',
        keyPoints: [
          'Debt LS SIFs target absolute returns regardless of broader rate cycle.',
          'Three trade types: duration, credit spread, carry-with-hedging.',
          'Use 10Y G-Sec futures (NSE), interest rate futures, SLB-based bond shorts where available.',
          'Target IRR 8-12% with materially lower volatility than long-only debt.',
          'Best in volatile / sideways / inverted yield environments.',
          'Underperforms long-only in sharp duration-rally cycles.',
          'Manager evaluation: IRR consistency across multiple yield environments.',
        ],
        faq: [
          {
            question: 'Can Debt LS SIFs profit when rates rise sharply?',
            answer:
              'Potentially yes — by being net short duration. A Debt LS SIF that anticipated a rate-rise cycle could position with longer-duration shorts and shorter-duration longs, profiting as long-duration bond prices fell. Long-only debt funds, by contrast, have limited tools to defend against rising rates beyond reducing duration. This is one of the structural advantages of the LS framework in fixed income.',
          },
          {
            question: 'What is "carry"?',
            answer:
              'Carry is the income earned from holding a position over time, separate from price appreciation. For bonds, carry is the coupon yield received during the holding period. A bond yielding 7.5% generates 7.5% annual carry from coupons regardless of price movement. Debt LS SIFs often combine high-carry long positions with hedging shorts to capture carry while neutralising duration risk.',
          },
          {
            question: 'Are Indian Debt LS SIFs as developed as US hedge fund equivalents?',
            answer:
              'No — the Indian fixed-income derivative market is materially less liquid than US Treasuries futures, US TIPS, or US credit derivatives. Indian Debt LS managers operate within a more constrained instrument universe. The strategy concept is similar but the execution sophistication and depth of expressible views is narrower. Indian Debt LS SIF returns will be more modest than the headline returns of established US fixed-income hedge funds.',
          },
          {
            question: 'How is a Debt LS SIF different from an Arbitrage Mutual Fund?',
            answer:
              'An arbitrage fund exploits price differences between cash and futures markets in equity (very small, typically 4-6% returns annually with minimal risk). A Debt LS SIF takes directional and relative-value positions in fixed income with material conviction-based bets. The arbitrage fund is mechanical and low-risk; the Debt LS SIF is active and conviction-driven, with higher target returns and higher risk.',
          },
        ],
        mcqs: [
          {
            question: 'A Debt LS SIF is most likely to outperform long-only debt funds:',
            options: [
              'In sharp rate-rally cycles',
              'In volatile, sideways, or inverted yield environments',
              'When equity markets are rallying',
              'When the rupee is strengthening',
            ],
            correctAnswer: 1,
            explanation:
              'Debt LS SIFs deliver their structural advantage in volatile, sideways, or inverted yield environments where long-only managers have limited tools. In sharp duration-rally cycles, long-only debt funds typically outperform.',
          },
          {
            question: '"Carry" in a debt long-short context refers to:',
            options: [
              'The fund\'s management fee',
              'Coupon income earned from holding bonds',
              'Forex hedging cost',
              'The transaction cost on bonds',
            ],
            correctAnswer: 1,
            explanation:
              'Carry is the coupon income earned from holding a bond position over time, independent of price movement. A bond yielding 7.5% generates 7.5% annual carry. Debt LS strategies often combine high-carry long positions with duration-hedging shorts.',
          },
          {
            question: 'A 10Y G-Sec future on NSE allows:',
            options: [
              'Only long positions',
              'Long and short positions on the 10-year government bond yield',
              'Only foreign investors',
              'Direct purchase of government bonds',
            ],
            correctAnswer: 1,
            explanation:
              'NSE\'s 10-year G-Sec futures contract permits both long and short positions on the 10-year government bond yield, providing one of the building blocks for Indian Debt LS strategies.',
          },
        ],
        summaryNotes: [
          'Debt LS = absolute return targeting through yield-curve, spread, and carry trades.',
          'Best-fit environments: volatile, sideways, or inverted yields.',
          'Builds on G-Sec futures, IRFs, SLB-based bond shorts.',
          'Manager evaluation: IRR consistency across yield environments.',
        ],
        relatedTopics: ['sif-equity-long-short', 'sif-hybrid-long-short', 'sif-strategies'],
      },
    },

    {
      id: 'sif-hybrid-long-short',
      title: 'Hybrid Long-Short Strategy — Mechanics',
      slug: 'sif-hybrid-long-short',
      content: {
        definition:
          'A Hybrid Long-Short SIF combines an Equity Long-Short book with a Debt Long-Short book within a single fund vehicle, typically in a 50/50 or 60/40 split with active rebalancing across the two sleeves based on the manager\'s view of relative risk-adjusted opportunity. The objective is a one-stop diversified absolute-return strategy with hedged exposure on both sides.',
        explanation:
          'Hybrid LS SIFs solve a portfolio construction question — instead of an investor having to allocate separately to an Equity LS SIF and a Debt LS SIF (with the corresponding double-fee burden and additional governance complexity), a Hybrid LS SIF delivers both in a single vehicle. The internal asset allocation is dynamic; in periods of rich equity valuations and tight credit spreads, the manager may tilt 70% to debt LS and 30% to equity LS. In oversold equity markets, the tilt may flip to 70% equity LS / 30% debt LS. The manager\'s value-add is twofold: (1) skilled execution within each sleeve (long-short stock picking on the equity side, yield-curve and credit-spread trades on the debt side); (2) skilled tactical asset allocation between the two sleeves through market cycles. A well-managed Hybrid LS SIF should deliver materially lower drawdowns than either pure LS strategy and competitive returns over multi-year periods. The trade-off is that during sharply trending markets in either equity or debt, a pure LS strategy in the trending direction will outperform — Hybrid LS is structurally diversified, accepting some upside dilution for downside protection. For investors who value simplicity (one allocation decision rather than two), one tax wrapper rather than two, and one operational interface rather than two, Hybrid LS is the structurally efficient choice. For investors who want to express specific views on equity-vs-debt allocation, two separate allocations to specialised LS SIFs is preferable.',
        realLifeExample:
          'Consider a Hybrid LS SIF managing ₹1,000 crore, targeting absolute returns of 10-13% with maximum drawdown under 8%. In Q1 of a year, the manager sees Indian equity at fair-to-rich valuations and credit spreads tight; the asset allocation tilts to 35% equity LS / 65% debt LS. In Q3, Indian equity corrects 14% and the manager sees opportunity in oversold mid-caps; the allocation rebalances to 60% equity LS / 40% debt LS. Through the full year, the equity LS sleeve generates 6% gross (after capturing 60% of the equity recovery), the debt LS sleeve generates 9% gross (steady carry-and-spread trades), and the dynamic asset allocation adds another 1.5% through tactical timing. Total gross 8.5%, net of 2.5% fees and 15% performance fee on the gain above 8% hurdle, the investor sees 7-7.5% net. Compare this to a Hybrid Mutual Fund running 65% equity / 35% debt long-only that may have delivered 4-6% in the same volatile year with much higher drawdown.',
        keyPoints: [
          'Hybrid LS combines Equity LS + Debt LS in a single SIF, typically 50/50 or 60/40.',
          'Dynamic asset allocation between sleeves is a key alpha source.',
          'Single fee, single tax wrapper, single operational interface — simplicity advantage.',
          'Lower drawdowns than pure equity or debt LS in most environments.',
          'Underperforms pure LS in sharply trending market in either asset class.',
          'Best for investors who value diversification and operational simplicity.',
          'Manager evaluation: skill in BOTH sleeves AND in tactical asset allocation.',
        ],
        faq: [
          {
            question: 'Should I prefer Hybrid LS or two separate LS SIFs?',
            answer:
              'For most investors below ₹50 lakh allocation, Hybrid LS is operationally simpler. For investors at ₹1 crore+ across LS strategies, two separate specialised LS SIFs (one equity, one debt) may deliver better outcomes if the investor wants to express explicit asset-allocation views. The Hybrid wrapper accepts the manager\'s asset-allocation view; specialised SIFs let the investor make that call.',
          },
          {
            question: 'How is performance attribution done for Hybrid LS?',
            answer:
              'Sophisticated investors evaluate Hybrid LS performance across three dimensions: (1) equity sleeve alpha vs Nifty + arbitrage benchmark, (2) debt sleeve alpha vs CRISIL Composite Bond Index, (3) asset-allocation alpha — the value added by tactical rebalancing between sleeves. Reporting in PMS- and SIF-level statements should provide this breakdown.',
          },
          {
            question: 'Are Hybrid LS expense ratios different from pure LS?',
            answer:
              'Generally similar — typical 2.0-2.5% fixed management fee plus 15-20% performance fee. Hybrid does not have lower fees just because it combines two strategies; the manager is doing more (running both sleeves + asset allocation) and the fee reflects that. Investors should compare fees across competing Hybrid LS funds carefully.',
          },
          {
            question: 'How is tax classification done for Hybrid LS SIFs?',
            answer:
              'Tax classification depends on the average asset mix per CBDT rules. If the Hybrid LS maintains 65%+ in domestic equity (including derivative exposure) on average, it qualifies for equity-fund tax. If equity exposure averages below 65% (which is typical for Hybrid LS with material debt sleeve), it falls under non-equity / slab-rate tax post-FY24. The SID discloses the expected tax classification.',
          },
        ],
        mcqs: [
          {
            question: 'A Hybrid LS SIF\'s primary alpha source includes:',
            options: [
              'Only equity stock-picking',
              'Equity LS alpha + Debt LS alpha + tactical asset-allocation alpha',
              'Only fixed-income carry',
              'Currency hedging',
            ],
            correctAnswer: 1,
            explanation:
              'Hybrid LS draws alpha from three sources: equity sleeve stock-picking, debt sleeve yield-curve/spread trades, and tactical asset allocation between sleeves. All three need skilled execution.',
          },
          {
            question: 'Hybrid LS structurally accepts upside dilution in exchange for:',
            options: [
              'Higher fees',
              'Daily liquidity',
              'Lower drawdowns through diversification',
              'Higher minimum investment',
            ],
            correctAnswer: 2,
            explanation:
              'Hybrid LS delivers lower drawdowns than pure LS strategies in volatile environments at the cost of upside dilution during sharply trending markets — a structural trade-off of diversification.',
          },
          {
            question: 'Tax classification of a Hybrid LS SIF depends on:',
            options: [
              'Whether it is open-ended or closed-ended',
              'The fund\'s name',
              'The average asset mix per CBDT rules',
              'Whether the manager is Indian',
            ],
            correctAnswer: 2,
            explanation:
              'Tax classification follows the average asset mix — 65%+ domestic equity (including derivative exposure) for equity-fund treatment; otherwise non-equity / slab-rate post-FY24. The SID discloses expected classification.',
          },
        ],
        summaryNotes: [
          'Hybrid LS = Equity LS + Debt LS in single SIF; dynamic asset allocation.',
          'Three alpha sources: equity sleeve, debt sleeve, asset-allocation tactical.',
          'Lower drawdowns vs pure LS; upside dilution in trending markets.',
          'Operational simplicity advantage at small-to-medium allocation sizes.',
        ],
        relatedTopics: ['sif-equity-long-short', 'sif-debt-long-short', 'sif-strategies'],
      },
    },

    {
      id: 'sif-portfolio-construction',
      title: 'Portfolio Construction Mechanics in SIFs',
      slug: 'sif-portfolio-construction',
      content: {
        definition:
          'Portfolio construction in a SIF follows a disciplined process — investment thesis identification, position sizing per conviction and liquidity, risk budgeting across long and short books, gross-and-net exposure management within the SEBI-permitted limits, and continuous rebalancing against changing market conditions. The framework is materially more sophisticated than a long-only mutual fund because of the additional dimensions (short book, leverage, derivatives) that must be managed simultaneously.',
        explanation:
          'A typical Equity LS SIF\'s portfolio construction begins with an opportunity-set screen — typically 200-300 stocks across large, mid, and small caps that meet the manager\'s minimum quality and liquidity thresholds. From this set, the manager identifies 30-50 long candidates and 15-25 short candidates based on independent fundamental analysis. Position sizing follows three principles: (1) Conviction-based — higher conviction picks get larger weights, with position-level caps (typically 6-8% maximum per single long position, 4-5% per single short); (2) Liquidity-adjusted — daily turnover constraints prevent positions where the SIF would be more than 5-10% of average daily volume, ensuring exit feasibility; (3) Risk-budgeted — sector, factor, and beta exposures are sized to keep total portfolio risk within the fund\'s mandate. Gross and net exposure are continuously monitored. The fund\'s mandate may permit gross exposure up to 200% (long + absolute short) and net exposure between 0% and 100%; the manager\'s tactical view on market direction adjusts these within the band. Risk monitoring uses standard tools — beta, factor decomposition, scenario analysis under historical stress events (2008 GFC, 2020 COVID, 2024 election volatility) — to ensure no single risk dimension drives the portfolio. Liquidity stress testing simulates exit at 25% of average daily volume to ensure the fund can liquidate even illiquid mid-cap shorts within 2-3 trading days under stress. Rebalancing happens dynamically, with major position changes typically requiring 2-4 days of execution to manage market impact. The discipline is operationally heavier than long-only fund management; this is why sophisticated long-short managers command higher fees than long-only managers.',
        realLifeExample:
          'A specific example: an Equity LS SIF identifies HDFC Bank as a conviction long after Q4 results. The fund holds ₹600 crore NAV with 70% net long mandate. Position sizing analysis: HDFC Bank average daily volume ₹2,500 crore, so a 5% position (₹30 crore) is well within the 5-10% of ADV threshold. Conviction tier: highest, so warrants 6% NAV weight. Final position: ₹36 crore long at average entry. Concurrent short identification: a struggling NBFC with deteriorating fundamentals; ADV ₹150 crore (much thinner), so position sized at ₹4 crore (just 2.7% of ADV) and 0.7% NAV weight despite high conviction — the liquidity constraint dominates conviction sizing for the short. The manager\'s position-level documentation explains the conviction, sizing, target price, stop loss, and expected holding period for each. After 4 months, HDFC Bank rallies 22% (long position contributes ₹8 cr to NAV) while the NBFC falls 18% (short position contributes ₹0.7 cr). Both views correct, but the long contribution dominates due to the larger position size — liquidity-adjusted sizing has materially shaped the realised P&L.',
        keyPoints: [
          'Portfolio construction is a disciplined multi-dimensional process unique to LS strategies.',
          'Position sizing principles: conviction, liquidity, risk-budgeted.',
          'Long position cap typically 6-8%; short position cap 4-5% of NAV.',
          'Liquidity constraint: positions limited to 5-10% of average daily volume.',
          'Gross exposure typically up to 200%; net exposure dynamically managed.',
          'Continuous risk monitoring: beta, factor decomp, historical-stress scenarios.',
          'Liquidity stress test: simulate exit at 25% of ADV for 2-3 trading days.',
          'Rebalancing executed over 2-4 days to manage market impact.',
        ],
        faq: [
          {
            question: 'Why are short positions typically smaller than long positions?',
            answer:
              'Three reasons: (1) Liquidity in short-able stocks (especially mid-caps) is typically lower than longs; (2) Risk asymmetry — the maximum loss on a long is the position size, but maximum loss on a short is theoretically unlimited (price can rise indefinitely); (3) Sizing discipline — short conviction is harder to hold through short-covering rallies, so position sizes are kept tighter to preserve the manager\'s ability to maintain the position.',
          },
          {
            question: 'What is a "factor exposure" in portfolio construction?',
            answer:
              'Factor exposure measures how much of the portfolio\'s return is driven by systematic factors — value vs growth, quality, momentum, low volatility, size (large vs small), country, etc. Sophisticated managers measure and manage factor exposures so the portfolio is not unintentionally taking large factor bets. A "factor-neutral" Equity LS SIF, for example, would maintain near-zero net factor exposure across all major factors, generating returns purely from idiosyncratic stock selection.',
          },
          {
            question: 'How does a SIF manage risk during sudden market volatility?',
            answer:
              'Through pre-defined risk-budget triggers. If the portfolio\'s realised volatility crosses a threshold (e.g., 15% annualised), the fund automatically reduces gross exposure (e.g., from 150% to 130%) by trimming positions. Stop-losses on individual positions provide additional defence. The manager\'s discretion within the framework determines how aggressively to reduce — some managers wait out volatility; others scale down systematically.',
          },
          {
            question: 'Can a SIF investor see the underlying positions?',
            answer:
              'Typically no — SIFs disclose top 10 holdings monthly and full portfolio quarterly with a 1-month lag, similar to mutual fund disclosure. Daily position-level transparency would expose the manager\'s strategy to front-running by other market participants. SIF investors trust the manager\'s framework and review aggregate disclosures rather than seeking real-time position visibility.',
          },
        ],
        mcqs: [
          {
            question: 'A typical maximum single long position weight in an Equity LS SIF is:',
            options: ['2-3%', '6-8%', '20-25%', 'No cap'],
            correctAnswer: 1,
            explanation:
              'Typical Equity LS SIFs cap single long positions at 6-8% of NAV. Higher concentration would expose the fund to single-stock idiosyncratic risk; lower would prevent expressing high-conviction views meaningfully.',
          },
          {
            question: 'Why are short positions sized smaller than long positions?',
            options: [
              'SEBI mandates this',
              'Liquidity constraints + risk asymmetry + short-covering rally risk',
              'Tax reasons',
              'No specific reason',
            ],
            correctAnswer: 1,
            explanation:
              'Three structural reasons: lower liquidity in short-able stocks, risk asymmetry (unlimited upside on shorts vs capped on longs), and the need to preserve the ability to hold positions through short-covering rallies.',
          },
          {
            question: 'A "factor-neutral" Equity LS SIF generates returns from:',
            options: [
              'Systematic factor bets',
              'Beta-driven market exposure',
              'Pure idiosyncratic stock selection alpha',
              'Currency arbitrage',
            ],
            correctAnswer: 2,
            explanation:
              'A factor-neutral SIF maintains near-zero net factor exposure (value, growth, quality, momentum, etc.), generating returns purely from idiosyncratic stock selection. This is a sophisticated structural choice; few Indian LS SIFs explicitly adopt strict factor-neutrality.',
          },
        ],
        summaryNotes: [
          'Portfolio construction follows conviction, liquidity, risk-budgeted sizing.',
          'Position caps: long 6-8%, short 4-5%, liquidity constraint 5-10% of ADV.',
          'Gross exposure up to 200% per SEBI; net managed dynamically.',
          'Continuous risk monitoring across beta, factor, and historical-stress dimensions.',
        ],
        relatedTopics: ['sif-strategies', 'sif-equity-long-short', 'sif-vs-mf-vs-pms'],
      },
    },
  ],
};
