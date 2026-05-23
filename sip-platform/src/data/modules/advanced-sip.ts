import { LearningModule } from '@/types/learning';

export const advancedSIPModule: LearningModule = {
  id: 'advanced-sip',
  title: 'Advanced SIP Concepts',
  slug: 'advanced-sip',
  icon: 'GraduationCap',
  description: 'Go beyond the basics. Learn advanced SIP strategies like Step-up SIP, Trigger SIP, SIP taxation, and how to optimize your SIP for inflation and market volatility.',
  level: 'intermediate',
  color: 'from-brand-800 to-secondary-600',
  estimatedTime: '60 min',
  sections: [
    {
      id: 'step-up-sip',
      title: 'Step-up SIP',
      slug: 'step-up-sip',
      content: {
        definition: 'Step-up SIP (also called Top-up SIP) is a variant where the monthly SIP amount is automatically increased by a fixed percentage or fixed amount at regular intervals (usually annually). This mirrors the natural increase in income over time and significantly boosts the final corpus compared to a flat SIP.',
        explanation: 'A regular SIP of ₹10,000/month stays at ₹10,000 forever. But your salary increases every year. Step-up SIP captures this growth by automatically increasing your SIP. If you set a 10% annual step-up, your SIP grows from ₹10,000 to ₹11,000 in year 2, ₹12,100 in year 3, and so on. This approach can generate 50-70% more corpus compared to a flat SIP over 20+ years.',
        realLifeExample: 'Arjun starts a ₹10,000/month SIP with 10% annual step-up at 12% returns for 20 years:\n\nFlat SIP Result:\nTotal invested: ₹24,00,000\nFinal value: ₹99,91,479\n\nStep-up SIP Result:\nTotal invested: ₹68,73,000\nFinal value: ₹2,20,36,892\n\nThe step-up SIP generated ₹1.20 Crore MORE wealth. While Arjun invested ₹44.73L more, the extra returns were ₹75.72L — the step-up more than paid for itself through compounding on the increased amounts.',
        keyPoints: [
          'Step-up SIP increases investment amount periodically (usually annually)',
          'Aligns with natural salary growth trajectory',
          'Can boost final corpus by 50-70% vs flat SIP over 20 years',
          'Typical step-up: 10-15% annual increase',
          'Available through most AMCs and mutual fund platforms',
          'Can be amount-based (₹1,000 increase/year) or percentage-based (10%/year)',
          'Percentage-based step-up compounds better over long periods',
          'Ideal for young professionals expecting regular career growth',
        ],
        formula: 'Step-Up SIP calculation is iterative:\nFor each year y:\n  Monthly amount = Initial × (1 + stepUp%)^(y-1)\n  Accumulate 12 monthly contributions with monthly returns\n  Carry forward the corpus to next year',
        numericalExample: '₹10,000/month SIP with 10% annual step-up at 12% return:\n\nYear 1: ₹10,000/month → ₹1,28,093 corpus\nYear 5: ₹14,641/month → ₹10,03,784 corpus\nYear 10: ₹23,579/month → ₹36,97,283 corpus\nYear 15: ₹37,975/month → ₹98,51,203 corpus\nYear 20: ₹61,159/month → ₹2,20,36,892 corpus\n\nTotal invested over 20 years: ₹68,73,000\nTotal value: ₹2,20,36,892\nWealth multiplier: 3.2x',
        faq: [
          {
            question: 'What is the ideal step-up percentage?',
            answer: 'Match your expected annual salary increase. For most professionals, 10-15% annual step-up is realistic. If unsure, start with 10% — it is sustainable and significantly boosts returns.',
          },
          {
            question: 'Can I step up more than my salary increase?',
            answer: 'Only if you can sustain it. It is better to step up at a sustainable rate than to overcommit and stop SIP altogether. Consistency is more important than aggressive step-up.',
          },
          {
            question: 'How do I set up a Step-up SIP?',
            answer: 'Most mutual fund platforms and AMC websites offer step-up SIP option during registration. You specify the step-up amount/percentage and frequency. Some platforms call it "Top-up SIP."',
          },
        ],
        mcqs: [
          {
            question: 'By approximately how much can Step-up SIP boost final corpus vs flat SIP over 20 years?',
            options: ['10-20%', '30-40%', '50-70%', '100-200%'],
            correctAnswer: 2,
            explanation: 'With a 10% annual step-up, the final corpus can be 50-70% higher than a flat SIP over a 20-year period, primarily due to compounding on the increased amounts.',
          },
        ],
        summaryNotes: [
          'Step-up SIP is one of the most powerful SIP optimization strategies',
          'Match step-up percentage to your expected salary growth',
          'Even a modest 10% annual step-up creates dramatic long-term impact',
          'Start step-up SIP early to maximize the compounding benefit',
          'Review and adjust step-up rate based on actual income growth',
        ],
        relatedTopics: ['what-is-sip', 'power-of-compounding', 'sip-for-salaried'],
      },
    },
    {
      id: 'trigger-sip',
      title: 'Trigger SIP',
      slug: 'trigger-sip',
      content: {
        definition: 'Trigger SIP is a conditional SIP where investments are made only when certain pre-set market conditions are met — such as a specific index level, NAV threshold, or percentage market movement. It combines the discipline of SIP with tactical market-awareness.',
        explanation: 'Unlike regular SIP which invests on a fixed date regardless of market, Trigger SIP activates only when your conditions are met. For example: "Invest ₹10,000 whenever Nifty falls 3% from its recent high." This strategy can potentially improve entry points but requires more monitoring and market understanding.',
        realLifeExample: 'Prakash sets up a Trigger SIP: "Invest ₹20,000 in a Nifty index fund whenever Nifty falls 5% from its 52-week high." Over a year, instead of 12 fixed monthly investments, his trigger activated 6 times during market dips. His average NAV was significantly lower than someone investing on a fixed date.',
        keyPoints: [
          'Trigger SIP invests only when pre-set conditions are met',
          'Conditions can be based on index level, NAV, or percentage movement',
          'Potentially better entry points than regular SIP',
          'Not available on all platforms — limited AMC support',
          'Risk: If market keeps rising, no investments are made',
          'Best used as supplement to regular SIP, not replacement',
          'Requires understanding of market conditions and indicators',
          'May result in irregular investment pattern and missed months',
        ],
        faq: [
          {
            question: 'Is Trigger SIP better than regular SIP?',
            answer: 'Not necessarily. While Trigger SIP can get better entry points, it may also miss months of investing if the market keeps rising. Regular SIP is simpler and ensures consistent investing. Trigger SIP works best as a supplement to regular SIP.',
          },
        ],
        mcqs: [
          {
            question: 'What is the main risk of relying solely on Trigger SIP?',
            options: ['Higher fees', 'Missing investments during rising markets', 'Tax complications', 'Regulatory issues'],
            correctAnswer: 1,
            explanation: 'If the market keeps rising without meeting the trigger condition, no investments are made, causing the investor to miss the growth period entirely.',
          },
        ],
        summaryNotes: [
          'Trigger SIP adds tactical overlay to disciplined investing',
          'Best used as supplement, not replacement for regular SIP',
          'Risk of inaction during bull markets',
          'Requires market understanding to set effective triggers',
        ],
        relatedTopics: ['step-up-sip', 'volatile-markets', 'sip-vs-stp'],
      },
    },
    {
      id: 'perpetual-sip',
      title: 'Perpetual SIP',
      slug: 'perpetual-sip',
      content: {
        definition: 'A Perpetual SIP is a Systematic Investment Plan set up without a specific end date. Unlike time-bound SIPs that run for a fixed period (say 5 or 10 years), a perpetual SIP continues indefinitely until the investor explicitly stops or cancels it.',
        explanation: 'When you set up a SIP, you usually specify a start date and end date. A perpetual SIP has a start date but no end date — it runs "forever" (until you cancel). This is ideal for long-term wealth building because it removes the mental friction of renewing SIPs and ensures continuous compounding.',
        realLifeExample: 'Sunita started a perpetual SIP of ₹5,000/month in 2010. She never had to renew it. By 2025, without any intervention, her SIP ran for 15 years continuously. She invested ₹9,00,000 and her portfolio grew to approximately ₹25,48,000 at 12% CAGR. If she had set a 5-year SIP, she would have needed to renew twice and might have missed months during transitions.',
        keyPoints: [
          'No end date — runs until explicitly cancelled by investor',
          'Removes the hassle of SIP renewal every few years',
          'Ideal for open-ended goals like wealth creation',
          'Ensures continuous compounding without breaks',
          'Most AMCs default to perpetual SIP if no end date specified',
          'Can be stopped anytime without penalty',
          'Auto-debit mandate may need periodic renewal (every 5-10 years)',
          'Combine with step-up for maximum long-term impact',
        ],
        faq: [
          {
            question: 'What if I want to stop a perpetual SIP?',
            answer: 'You can stop a perpetual SIP anytime through your AMC or mutual fund platform. There is no penalty for stopping. Simply cancel the SIP mandate and the auto-debit will cease.',
          },
        ],
        mcqs: [
          {
            question: 'What is the key advantage of a Perpetual SIP over a fixed-tenure SIP?',
            options: ['Higher returns', 'No renewal needed, continuous investing', 'Tax benefits', 'Lower fees'],
            correctAnswer: 1,
            explanation: 'Perpetual SIP eliminates the need for periodic renewal, ensuring continuous investing and uninterrupted compounding.',
          },
        ],
        summaryNotes: [
          'Perpetual SIP = Set it and forget it approach',
          'Ideal for long-term wealth building with no specific end goal date',
          'Combines well with step-up SIP for optimal growth',
          'Check auto-debit mandate validity periodically',
        ],
        relatedTopics: ['what-is-sip', 'step-up-sip', 'power-of-compounding'],
      },
    },
    {
      id: 'sip-pause',
      title: 'SIP Pause',
      slug: 'sip-pause',
      content: {
        definition: 'SIP Pause is a facility that allows investors to temporarily halt their SIP contributions for a specified period (typically 1-6 months) without cancelling the SIP. After the pause period, the SIP automatically resumes from the next scheduled date.',
        explanation: 'Life is not always predictable. You might face a medical emergency, job change, or temporary cash crunch. Instead of permanently cancelling your SIP, you can pause it. This maintains your investment mandate and auto-resumes when the pause period ends. It is like pressing pause on a movie — you can continue exactly where you left off.',
        realLifeExample: 'Rahul lost his job in March 2024. He had SIPs worth ₹25,000/month. Instead of cancelling, he paused all SIPs for 3 months. By June, he found a new job and his SIPs automatically resumed. He avoided the hassle of setting up new SIPs and did not break his long-term investment journey.',
        keyPoints: [
          'Temporary halt without cancelling the SIP',
          'Typically allowed for 1-6 months',
          'SIP auto-resumes after pause period',
          'No penalty for pausing',
          'Better than cancelling and restarting',
          'Not all AMCs offer formal pause facility',
          'Alternative: reduce SIP to minimum amount during tough times',
          'Existing units continue to grow during the pause period',
        ],
        faq: [
          {
            question: 'Does pausing SIP affect my existing investments?',
            answer: 'No. Pausing SIP only stops new contributions. Your existing units remain invested and continue to grow/decline based on market movement. Only new unit accumulation stops during the pause.',
          },
        ],
        mcqs: [
          {
            question: 'What happens to existing mutual fund units when SIP is paused?',
            options: ['They are redeemed', 'They continue to grow/decline with market', 'They are frozen', 'They are transferred to savings'],
            correctAnswer: 1,
            explanation: 'Pausing SIP only stops new contributions. Existing units remain invested in the fund and continue to participate in market movements.',
          },
        ],
        summaryNotes: [
          'SIP pause is a temporary solution for financial crunches',
          'Always prefer pausing over cancelling SIP',
          'Existing investments continue to work during pause',
          'Auto-resume feature ensures continuity',
        ],
        relatedTopics: ['what-is-sip', 'perpetual-sip', 'sip-for-salaried'],
      },
    },
    {
      id: 'volatile-markets',
      title: 'SIP in Volatile Markets',
      slug: 'volatile-markets',
      content: {
        definition: 'Market volatility refers to rapid and significant price movements in both directions. SIP in volatile markets is one of the most misunderstood topics. While volatility causes anxiety, it is actually SIP\'s best friend — the mechanism of Rupee Cost Averaging works hardest during volatile periods, potentially generating superior long-term returns.',
        explanation: 'When markets are volatile, your SIP buys units at varying prices — some high, many low. This variation is exactly what makes Rupee Cost Averaging work. Historical data shows that SIPs started during or just before market corrections have generated some of the best long-term returns. The worst thing you can do is stop SIP during volatility.',
        realLifeExample: 'Two investors start ₹10,000/month SIP in January 2020 (just before COVID crash):\n\nInvestor A: Panics during March 2020 crash, stops SIP for 6 months\nInvestor B: Continues SIP through the crash\n\nBy December 2023:\nInvestor A: Invested ₹4.2L → Value ₹5.8L (38% return)\nInvestor B: Invested ₹4.8L → Value ₹7.6L (58% return)\n\nInvestor B\'s SIP bought units at rock-bottom prices in March-May 2020, which multiplied during the recovery. Those few months of "crash investing" accounted for most of the outperformance.',
        keyPoints: [
          'Volatility is SIP\'s best friend — not enemy',
          'Rupee Cost Averaging works hardest during volatile periods',
          'SIPs started before market crashes often outperform over long term',
          'Never stop SIP due to short-term market volatility',
          'Consider increasing SIP during significant market corrections',
          'Historical data: No 10-year SIP in Nifty has delivered negative returns',
          'Volatility is temporary; the trend of markets is upward over long periods',
          'Emotional control during volatility separates successful investors from unsuccessful ones',
        ],
        faq: [
          {
            question: 'Should I increase SIP during market crashes?',
            answer: 'If you have surplus funds and a long-term horizon, yes. Market corrections of 15-20% are excellent opportunities to increase SIP or make additional lump sum investments. However, only invest surplus funds — never borrow or compromise emergency funds.',
          },
          {
            question: 'Has any 10-year SIP in Nifty ever given negative returns?',
            answer: 'No. Historical data shows that no 10-year SIP in Nifty 50 has ever delivered negative returns, regardless of when it was started. The minimum 10-year SIP CAGR has been around 7-8%, and the average has been 12-15%.',
          },
        ],
        mcqs: [
          {
            question: 'How does market volatility affect SIP returns over the long term?',
            options: ['Always reduces returns', 'Has no effect', 'Can actually improve returns through better RCA', 'Makes SIP dangerous'],
            correctAnswer: 2,
            explanation: 'Market volatility enhances the Rupee Cost Averaging effect, allowing SIP investors to accumulate more units at lower prices during dips, which can improve long-term returns.',
          },
        ],
        summaryNotes: [
          'Embrace volatility — it is the engine that powers Rupee Cost Averaging',
          'Never make SIP decisions based on short-term market movements',
          'Market corrections are buying opportunities for SIP investors',
          'Stay invested through cycles — time in market beats timing the market',
        ],
        relatedTopics: ['rupee-cost-averaging', 'sip-myths-facts', 'sip-vs-lumpsum'],
      },
    },
    {
      id: 'sip-vs-stp',
      title: 'SIP vs STP',
      slug: 'sip-vs-stp',
      content: {
        definition: 'STP (Systematic Transfer Plan) involves investing a lump sum in one mutual fund (usually debt/liquid) and systematically transferring a fixed amount to another fund (usually equity) at regular intervals. While SIP invests fresh money from your bank, STP moves money between existing fund investments.',
        explanation: 'STP is used when you have a lump sum but want the benefits of staggered investing. Instead of investing ₹12 Lakhs directly in equity, you park it in a liquid fund and transfer ₹1 Lakh monthly to equity over 12 months. The money in liquid fund earns 5-7% while waiting, and you get Rupee Cost Averaging for equity investment.',
        realLifeExample: 'Dinesh receives ₹15 Lakhs as annual bonus. Instead of investing all at once in equity:\n\nStep 1: Invest entire ₹15L in a liquid fund (earning ~6.5% p.a.)\nStep 2: Set up STP of ₹1.25L/month from liquid to flexi-cap equity fund\nDuration: 12 months\n\nBenefit: The ₹15L earns approximately ₹48,750 in the liquid fund over the year while also getting systematically invested in equity with RCA benefit.',
        keyPoints: [
          'STP moves money between funds; SIP invests fresh money from bank',
          'STP is ideal for lump sum amounts you want to invest gradually',
          'Source fund (usually liquid/debt) earns returns while waiting',
          'Combines lump sum parking with systematic equity investing',
          'Tax implication: Each STP transfer is a redemption + purchase',
          'STP provides RCA benefit similar to SIP',
          'Duration of STP typically 6-12 months',
          'STP is not available across AMCs — both funds must be from same AMC',
        ],
        faq: [
          {
            question: 'When should I use STP instead of SIP?',
            answer: 'Use STP when you have a lump sum to invest (bonus, inheritance, property sale proceeds). Use SIP for regular monthly income-based investing. They serve different situations but provide similar benefits.',
          },
        ],
        mcqs: [
          {
            question: 'In an STP, what typically serves as the source fund?',
            options: ['Equity fund', 'Liquid/Debt fund', 'ELSS fund', 'International fund'],
            correctAnswer: 1,
            explanation: 'In STP, the lump sum is parked in a liquid or debt fund (source), which earns stable returns while systematic transfers are made to the target fund (usually equity).',
          },
        ],
        summaryNotes: [
          'STP is the lump sum equivalent of SIP',
          'Park lump sum in liquid fund, transfer systematically to equity',
          'Both source and target funds must be from the same AMC',
          'Each transfer has tax implications — plan accordingly',
        ],
        relatedTopics: ['sip-vs-lumpsum', 'sip-vs-swp', 'sip-taxation'],
      },
    },
    {
      id: 'sip-vs-swp',
      title: 'SIP vs SWP',
      slug: 'sip-vs-swp',
      content: {
        definition: 'SWP (Systematic Withdrawal Plan) is the reverse of SIP. While SIP systematically invests money into mutual funds, SWP systematically withdraws a fixed amount from mutual funds at regular intervals. SIP is for the accumulation phase; SWP is for the distribution phase — typically during retirement.',
        explanation: 'Think of SIP and SWP as two sides of the same coin. During your working years, you use SIP to build wealth. During retirement, you use SWP to generate regular income from your accumulated corpus. SWP allows your remaining corpus to stay invested and continue growing while you withdraw monthly income.',
        realLifeExample: 'Ramesh retires at 60 with a ₹2 Crore corpus in a hybrid mutual fund:\n\nSWP setup: ₹80,000/month withdrawal\nFund return: 9% p.a.\n\nYear 1: Withdraws ₹9.6L, corpus grows to ₹2.08 Crore\nYear 5: Total withdrawn ₹48L, corpus is still ₹1.94 Crore\nYear 10: Total withdrawn ₹96L, corpus is still ₹1.73 Crore\nYear 20: Total withdrawn ₹1.92 Crore, corpus is still ₹1.11 Crore\n\nRamesh withdrew almost his entire original investment but still has ₹1.11 Crore left. The remaining corpus continued to earn returns.',
        keyPoints: [
          'SWP is the withdrawal counterpart of SIP',
          'Used during retirement for regular income generation',
          'Remaining corpus stays invested and continues earning returns',
          'Tax-efficient compared to full redemption',
          'Withdrawal amount should be less than fund returns for corpus preservation',
          'Can be from any type of mutual fund',
          'Typical SWP: 6-8% of corpus annually for sustainable withdrawal',
          'Combine with inflation adjustment for real purchasing power maintenance',
        ],
        faq: [
          {
            question: 'What is a safe SWP withdrawal rate?',
            answer: 'Financial planners recommend withdrawing 4-6% of your corpus annually (the "4% rule"). For Indian conditions with higher inflation, 5-6% is commonly used. This allows the remaining corpus to grow and sustain withdrawals for 25-30 years.',
          },
        ],
        mcqs: [
          {
            question: 'SWP is most commonly used during which life phase?',
            options: ['Early career', 'Mid career', 'Retirement', 'Student years'],
            correctAnswer: 2,
            explanation: 'SWP is designed for the distribution/retirement phase when investors need regular income from their accumulated mutual fund corpus.',
          },
        ],
        summaryNotes: [
          'SIP builds wealth; SWP distributes it',
          'SWP is more tax-efficient than full redemption',
          'Keep SWP rate below fund returns for corpus preservation',
          'Plan your SIP years to build adequate corpus for SWP years',
        ],
        relatedTopics: ['sip-vs-stp', 'retirement', 'sip-taxation'],
      },
    },
    {
      id: 'sip-taxation',
      title: 'SIP Taxation',
      slug: 'sip-taxation',
      content: {
        definition: 'SIP investments are subject to capital gains tax when units are redeemed. The tax treatment depends on the type of fund (equity vs debt), the holding period (short-term vs long-term), and the applicable tax rates. Each SIP installment is treated as a separate investment for tax purposes.',
        explanation: 'In SIP, every monthly installment is a separate purchase. When you redeem, the holding period is calculated from the date of each installment, not the SIP start date. This means some installments may be taxed as short-term gains while others as long-term gains. For equity funds, gains up to ₹1.25 Lakh/year are tax-free (LTCG exemption). Understanding SIP taxation helps in tax-efficient redemption planning.',
        realLifeExample: 'Ananya started a ₹10,000/month equity SIP in January 2023. She redeems all units in March 2024:\n\nJan 2023 installment: Held for 14 months → LTCG (long-term, >12 months)\nFeb 2023 installment: Held for 13 months → LTCG\nMar 2023 installment: Held for 12 months → LTCG\nApr 2023 - Mar 2024 installments: Held for <12 months → STCG\n\nLTCG (Jan-Mar 2023 units): Taxed at 12.5% above ₹1.25L exemption\nSTCG (Apr 2023 onwards): Taxed at 20%\n\nTip: If Ananya waited till April 2024 to redeem, one more month of installments would have converted from STCG to LTCG, saving tax.',
        keyPoints: [
          'Each SIP installment has its own holding period for tax calculation',
          'Equity funds: LTCG after 12 months, STCG within 12 months',
          'Debt funds: All gains taxed at income tax slab rate (from April 2023)',
          'Equity LTCG: 12.5% above ₹1.25L annual exemption',
          'Equity STCG: 20% flat rate',
          'ELSS SIP: 3-year lock-in per installment, qualifies for 80C deduction',
          'First-in-first-out (FIFO) method for redemption tax calculation',
          'Tax harvesting: Redeem and reinvest to utilize annual LTCG exemption',
        ],
        formula: 'Equity Fund Tax (FY 2026-27):\nSTCG (held < 12 months): 20%\nLTCG (held > 12 months): 12.5% above ₹1.25L exemption\n\nDebt Fund Tax (from April 2023):\nAll gains: Taxed at investor\'s income tax slab rate\nNo indexation benefit',
        faq: [
          {
            question: 'What is LTCG tax harvesting in SIP?',
            answer: 'Each year, you can redeem equity mutual fund units with long-term gains up to ₹1.25 Lakh and reinvest immediately. This "resets" your purchase price and utilizes the annual LTCG exemption, effectively reducing future tax liability.',
          },
          {
            question: 'Is SIP in ELSS tax-free?',
            answer: 'SIP in ELSS qualifies for Section 80C deduction (up to ₹1.5L/year). However, the gains on redemption are taxed as equity LTCG — 12.5% on gains above ₹1.25L. Each installment has a separate 3-year lock-in period.',
          },
        ],
        mcqs: [
          {
            question: 'How is the holding period calculated for SIP investments in equity funds?',
            options: ['From the first SIP date', 'From each individual installment date', 'From the last SIP date', 'From the redemption date'],
            correctAnswer: 1,
            explanation: 'Each SIP installment is treated as a separate investment. The holding period for tax purposes is calculated individually from each installment date to the redemption date.',
          },
        ],
        summaryNotes: [
          'Each SIP installment has its own holding period for tax purposes',
          'Plan redemptions to maximize LTCG and minimize STCG',
          'Use annual LTCG exemption of ₹1.25L through tax harvesting',
          'ELSS SIP: Tax saving on investment + tax on gains at redemption',
          'Debt fund SIP gains now taxed at slab rate — no indexation benefit',
        ],
        relatedTopics: ['sip-vs-swp', 'sip-for-salaried', 'what-is-sip'],
      },
    },
    {
      id: 'inflation-adjusted',
      title: 'Inflation-Adjusted SIP Planning',
      slug: 'inflation-adjusted',
      content: {
        definition: 'Inflation-adjusted SIP planning accounts for the decrease in purchasing power of money over time. While your SIP corpus may grow to ₹1 Crore in 20 years, the real value of that ₹1 Crore (what it can buy) will be significantly less due to inflation. Planning for inflation ensures your future wealth actually meets your future needs.',
        explanation: 'If inflation is 6% per year, something that costs ₹100 today will cost ₹321 in 20 years. So if you need ₹50,000/month today for expenses, you will need ₹1,60,357/month in 20 years for the same lifestyle. Your SIP planning must account for this. The real return on your investment is: Nominal Return - Inflation Rate. If your fund returns 12% and inflation is 6%, your real return is approximately 6%.',
        realLifeExample: 'Sanjay plans for retirement in 20 years. Current monthly expense: ₹50,000.\n\nWithout inflation planning:\nTarget corpus at 12% return: ₹99.9 Lakhs (₹10,000/month SIP)\nThis seems enough... but it is NOT.\n\nWith 6% inflation planning:\nFuture monthly expense: ₹1,60,357\nCorpus needed for 25-year retirement: ₹3.20 Crore\nRequired monthly SIP: ₹32,000/month\n\nIf Sanjay only planned ₹10,000/month, he would face a retirement shortfall of over ₹2 Crore.',
        keyPoints: [
          'Inflation erodes purchasing power — ₹1 Crore in 20 years ≠ ₹1 Crore today',
          'India\'s average inflation: 5-7% over the last decade',
          'Real return = Nominal return - Inflation rate',
          'Always plan SIP goals in inflation-adjusted (real) terms',
          'Healthcare inflation in India: 10-15% (higher than general inflation)',
          'Education inflation in India: 10-12%',
          'Step-up SIP partially offsets inflation impact',
          'Use inflation-adjusted calculator for realistic goal planning',
        ],
        formula: 'Future Value with Inflation:\nFuture Cost = Present Cost × (1 + inflation)^years\n\nReal Rate of Return:\nReal Return = [(1 + Nominal Return) / (1 + Inflation)] - 1\n\nExample: Nominal 12%, Inflation 6%\nReal Return = (1.12 / 1.06) - 1 = 5.66%',
        faq: [
          {
            question: 'What inflation rate should I use for SIP planning?',
            answer: 'For general expenses, use 6-7%. For healthcare, use 10-12%. For education, use 10-12%. For retirement planning, use 7% as a conservative estimate. It is better to overestimate inflation than underestimate.',
          },
        ],
        mcqs: [
          {
            question: 'If nominal return is 12% and inflation is 6%, what is the approximate real return?',
            options: ['18%', '12%', '6%', '5.66%'],
            correctAnswer: 3,
            explanation: 'Real Return = [(1 + 0.12) / (1 + 0.06)] - 1 = 5.66%. The real return is always less than simply subtracting inflation from nominal return.',
          },
        ],
        summaryNotes: [
          'Never plan SIP goals without accounting for inflation',
          'Your actual wealth-building rate is the real return, not nominal',
          'Education and healthcare inflate faster than general prices',
          'Step-up SIP is essential to keep pace with inflation',
          'Review and increase SIP amounts annually to maintain purchasing power',
        ],
        relatedTopics: ['step-up-sip', 'retirement', 'wealth-creation'],
      },
    },
  ],
};
