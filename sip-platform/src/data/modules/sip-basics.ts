import { LearningModule } from '@/types/learning';

export const sipBasicsModule: LearningModule = {
  id: 'sip-basics',
  title: 'SIP Basics',
  slug: 'sip-basics',
  icon: 'BookOpen',
  description: 'Master the fundamentals of Systematic Investment Plans. Learn what SIP is, how it works, and why it is one of the most powerful wealth-building tools for Indian investors.',
  level: 'beginner',
  color: 'from-brand-500 to-brand-600',
  estimatedTime: '45 min',
  sections: [
    {
      id: 'what-is-sip',
      title: 'What is SIP?',
      slug: 'what-is-sip',
      content: {
        definition: 'A Systematic Investment Plan (SIP) is a method of investing a fixed amount of money at regular intervals (typically monthly) into a mutual fund scheme. It allows investors to buy units of a mutual fund on a pre-determined date each month, enabling disciplined and regular investing regardless of market conditions.',
        explanation: 'Think of SIP like a recurring deposit, but instead of putting money in a bank, you invest it in mutual funds. Every month, a fixed amount is automatically deducted from your bank account and invested in your chosen mutual fund. When the market is low, your fixed amount buys more units. When the market is high, it buys fewer units. Over time, this averages out your purchase cost — a concept called Rupee Cost Averaging. SIP removes the need to time the market and builds a habit of disciplined investing.',
        realLifeExample: 'Priya, a 28-year-old software engineer in Bangalore, earns ₹80,000/month. She starts a SIP of ₹10,000/month in an equity mutual fund. On the 5th of every month, ₹10,000 is auto-debited from her bank account. In month 1, when the NAV is ₹50, she gets 200 units. In month 2, the market drops and NAV falls to ₹40 — she gets 250 units. In month 3, NAV rises to ₹60 — she gets 166.67 units. After 3 months, she has invested ₹30,000 and holds 616.67 units at an average cost of ₹48.65 per unit — lower than both the starting and ending NAV.',
        keyPoints: [
          'SIP allows you to invest a fixed amount regularly in mutual funds',
          'It automates the investment process through bank auto-debit',
          'You can start with as little as ₹500 per month',
          'SIP works on the principle of Rupee Cost Averaging',
          'It removes the need to time the market',
          'SIP instills financial discipline and regular saving habit',
          'You can increase, decrease, pause, or stop SIP at any time',
          'No lock-in period for most SIP investments (except ELSS)',
        ],
        formula: 'FV = P × [(1+r)^n - 1] / r × (1+r)\nWhere:\nFV = Future Value\nP = Monthly SIP amount\nr = Monthly rate of return (annual return / 12)\nn = Total number of months',
        numericalExample: 'Monthly SIP: ₹10,000 | Expected Return: 12% p.a. | Duration: 20 years\n\nMonthly rate (r) = 12% / 12 = 1% = 0.01\nTotal months (n) = 20 × 12 = 240\n\nFV = 10,000 × [(1.01)^240 - 1] / 0.01 × (1.01)\nFV = 10,000 × [10.8926 - 1] / 0.01 × 1.01\nFV = 10,000 × 989.26 × 1.01\nFV = ₹99,91,479 ≈ ₹1 Crore\n\nTotal Invested: ₹24,00,000 (₹24 Lakhs)\nWealth Gained: ₹75,91,479 (₹75.9 Lakhs)\nTotal Value: ₹99,91,479 (≈ ₹1 Crore)',
        faq: [
          {
            question: 'What is the minimum amount to start a SIP?',
            answer: 'Most mutual fund companies allow SIPs starting from ₹500 per month. Some AMCs even offer SIPs starting at ₹100. There is no maximum limit for SIP investments.',
          },
          {
            question: 'Is SIP only for equity mutual funds?',
            answer: 'No. SIP can be done in any type of mutual fund — equity, debt, hybrid, gold ETFs, or international funds. The choice of fund depends on your financial goals and risk appetite.',
          },
          {
            question: 'Can I stop my SIP anytime?',
            answer: 'Yes, you can stop your SIP at any time without any penalty (except for ELSS funds which have a 3-year lock-in per installment). You can also pause and restart your SIP later.',
          },
          {
            question: 'Is SIP safe? Can I lose money?',
            answer: 'SIP is a method of investing, not an investment itself. The safety depends on the underlying mutual fund. Equity SIPs carry market risk in the short term, but historically have delivered strong returns over 7+ year periods. Debt SIPs are relatively safer but offer lower returns.',
          },
          {
            question: 'What happens if I miss a SIP payment?',
            answer: 'If the auto-debit fails due to insufficient balance, that month\'s SIP installment is simply skipped. There is no penalty. The SIP continues from the next month. However, if 3 consecutive installments are missed, some AMCs may cancel the SIP.',
          },
        ],
        mcqs: [
          {
            question: 'What does SIP stand for?',
            options: ['Systematic Investment Plan', 'Standard Investment Portfolio', 'Structured Income Plan', 'Secured Investment Product'],
            correctAnswer: 0,
            explanation: 'SIP stands for Systematic Investment Plan — a disciplined method of investing a fixed amount regularly in mutual funds.',
          },
          {
            question: 'What is the minimum SIP amount generally accepted by most AMCs?',
            options: ['₹100', '₹500', '₹1,000', '₹5,000'],
            correctAnswer: 1,
            explanation: 'Most AMCs accept SIP starting from ₹500/month. Some newer AMCs have reduced this to ₹100.',
          },
          {
            question: 'Which principle does SIP primarily work on?',
            options: ['Market Timing', 'Rupee Cost Averaging', 'Momentum Trading', 'Arbitrage'],
            correctAnswer: 1,
            explanation: 'SIP works on Rupee Cost Averaging — buying more units when prices are low and fewer when high, thus averaging out the cost.',
          },
        ],
        summaryNotes: [
          'SIP is a method, not a product — it is the disciplined way of investing in mutual funds',
          'Start early, invest regularly, stay invested for the long term',
          'SIP removes emotional decision-making from investing',
          'The power of SIP compounds over time — even small amounts grow significantly',
          'Choose your SIP amount based on your income, goals, and risk appetite',
        ],
        relatedTopics: ['how-sip-works', 'power-of-compounding', 'rupee-cost-averaging'],
      },
    },
    {
      id: 'how-sip-works',
      title: 'How SIP Works',
      slug: 'how-sip-works',
      content: {
        definition: 'SIP works through a systematic process: an investor selects a mutual fund, decides a fixed investment amount and date, provides a bank mandate for auto-debit, and the system automatically invests the amount each month by purchasing units at the prevailing NAV (Net Asset Value). The units accumulate over time, and the investment grows through both additional purchases and market appreciation.',
        explanation: 'When you set up a SIP, here is exactly what happens each month: (1) On your chosen date, the amount is auto-debited from your bank. (2) The mutual fund house receives the money and allots units based on that day\'s NAV. (3) If NAV is ₹100 and you invest ₹5,000, you get 50 units. (4) Next month, if NAV drops to ₹80, the same ₹5,000 buys you 62.5 units. (5) Your units keep accumulating in your folio. (6) When you decide to redeem, the total units × current NAV = your investment value. The beauty is that by investing regularly, you don\'t need to worry about whether the market is up or down — you benefit from both scenarios.',
        realLifeExample: 'Rajesh starts a ₹5,000/month SIP in a large-cap equity fund:\n\nMonth 1: NAV ₹100 → 50 units\nMonth 2: NAV ₹90 → 55.56 units (market dipped — got more units!)\nMonth 3: NAV ₹85 → 58.82 units (more units at lower price)\nMonth 4: NAV ₹95 → 52.63 units\nMonth 5: NAV ₹110 → 45.45 units (market recovered)\nMonth 6: NAV ₹120 → 41.67 units\n\nTotal invested: ₹30,000\nTotal units: 304.13\nAverage cost per unit: ₹98.64\nCurrent value (at ₹120 NAV): ₹36,496\nProfit: ₹6,496 (21.7%)\n\nNotice: Even though the market fell initially, Rajesh\'s SIP bought more units at lower prices, and when the market recovered, he made excellent returns.',
        keyPoints: [
          'SIP runs on auto-debit — completely automatic after setup',
          'Units are allotted based on the NAV on the date of investment',
          'Lower NAV = more units purchased (which is actually beneficial)',
          'Higher NAV = fewer units but existing units have appreciated',
          'The average cost of units tends to be lower than the average NAV',
          'SIP mandate is given through OTM (One Time Mandate) or NACH',
          'SIP date can be chosen (1st, 5th, 10th, 15th, 20th, 25th usually)',
          'Units are allotted T+1 (next business day) for equity funds',
        ],
        faq: [
          {
            question: 'What is NAV and how does it affect my SIP?',
            answer: 'NAV (Net Asset Value) is the price of one unit of a mutual fund. When you invest through SIP, the number of units you receive depends on the NAV on the day of investment. Lower NAV means more units, higher NAV means fewer units.',
          },
          {
            question: 'Which date should I choose for my SIP?',
            answer: 'Research shows that the SIP date has minimal impact on long-term returns. Choose a date that is convenient for you — ideally a few days after your salary is credited to ensure sufficient balance.',
          },
          {
            question: 'Can I have multiple SIPs in different funds?',
            answer: 'Yes, you can run multiple SIPs simultaneously in different mutual funds. This is actually recommended for diversification. You could have an equity SIP, a debt SIP, and an ELSS SIP running together.',
          },
          {
            question: 'How is SIP different from recurring deposit?',
            answer: 'Both involve regular investments, but SIP invests in mutual funds (market-linked, potentially higher returns) while RD invests in bank deposits (fixed returns, lower risk). SIP offers potential for wealth creation while RD offers capital protection.',
          },
        ],
        mcqs: [
          {
            question: 'When the market falls during a SIP, what happens to your units?',
            options: ['You get fewer units', 'You get more units', 'Unit allocation remains same', 'SIP automatically stops'],
            correctAnswer: 1,
            explanation: 'When the market falls, the NAV decreases, so your fixed SIP amount buys more units. This is the core benefit of Rupee Cost Averaging.',
          },
          {
            question: 'What is the typical unit allotment timeline for equity SIPs?',
            options: ['Same day', 'T+1 (Next business day)', 'T+3 (Three business days)', 'T+7 (One week)'],
            correctAnswer: 1,
            explanation: 'For equity mutual funds, units are typically allotted on T+1 basis, meaning the next business day after the investment date.',
          },
        ],
        summaryNotes: [
          'SIP automates investing — set it up once and let it run',
          'Units accumulate over time through regular purchases',
          'Market dips during SIP are opportunities, not threats',
          'The average purchase cost is usually lower than the average market price',
          'Consistency is key — the longer you stay invested, the better the results',
        ],
        relatedTopics: ['what-is-sip', 'rupee-cost-averaging', 'sip-myths-facts'],
      },
    },
    {
      id: 'sip-vs-lumpsum',
      title: 'SIP vs Lump Sum',
      slug: 'sip-vs-lumpsum',
      content: {
        definition: 'SIP (Systematic Investment Plan) involves investing a fixed amount at regular intervals, while Lump Sum investing means investing a large amount all at once. Both are methods of investing in mutual funds, but they differ in approach, risk profile, and suitability based on market conditions and investor circumstances.',
        explanation: 'The SIP vs Lump Sum debate is one of the most common in investing. SIP spreads your investment over time, reducing the risk of investing at a market peak. Lump Sum puts all money to work immediately, which can be beneficial in a rising market. In a falling or volatile market, SIP tends to perform better because of Rupee Cost Averaging. In a consistently rising market, Lump Sum tends to perform better because the money is invested for a longer duration. For most regular investors who earn monthly salaries, SIP is the natural and practical choice.',
        realLifeExample: 'Anita has ₹12,00,000 to invest. She considers two approaches:\n\nOption A — Lump Sum: Invest ₹12L at once\nOption B — SIP: Invest ₹1L/month for 12 months\n\nScenario 1 (Rising Market — 15% annual return):\nLump Sum after 1 year: ₹13,80,000\nSIP after 1 year: ₹13,02,000\nWinner: Lump Sum (by ₹78,000)\n\nScenario 2 (Volatile Market — market drops 20% then recovers):\nLump Sum after 1 year: ₹11,76,000 (small loss)\nSIP after 1 year: ₹12,85,000 (profit!)\nWinner: SIP (by ₹1,09,000)\n\nConclusion: If you can predict markets perfectly, Lump Sum wins. Since no one can, SIP is the safer and more reliable approach for most investors.',
        keyPoints: [
          'SIP reduces timing risk through rupee cost averaging',
          'Lump Sum can outperform in a consistently rising market',
          'SIP is ideal for salaried individuals with monthly income',
          'Lump Sum is suitable when you receive a large sum (bonus, inheritance)',
          'In volatile markets, SIP tends to outperform Lump Sum',
          'Both methods can be used together for optimal results',
          'SIP builds investing discipline; Lump Sum requires market conviction',
          'For long-term goals (10+ years), the difference narrows significantly',
        ],
        faq: [
          {
            question: 'Which gives better returns — SIP or Lump Sum?',
            answer: 'It depends on market conditions. In a steadily rising market, Lump Sum generally gives better returns. In volatile or falling markets, SIP tends to outperform. Over very long periods (15+ years), the difference is minimal.',
          },
          {
            question: 'Can I do both SIP and Lump Sum?',
            answer: 'Absolutely! A common strategy is to run regular SIPs and make additional lump sum investments when markets correct significantly (10-15% fall). This is called STP (Systematic Transfer Plan) approach.',
          },
          {
            question: 'I received a bonus. Should I invest lump sum or convert to SIP?',
            answer: 'If you have a large amount, consider investing 50% as lump sum immediately and converting the remaining 50% into a 6-12 month SIP. This balances the benefits of both approaches.',
          },
        ],
        mcqs: [
          {
            question: 'In which market condition does SIP typically outperform Lump Sum?',
            options: ['Consistently rising market', 'Volatile or falling market', 'Flat market', 'SIP always outperforms'],
            correctAnswer: 1,
            explanation: 'In volatile or falling markets, SIP benefits from Rupee Cost Averaging by purchasing more units at lower prices, typically outperforming Lump Sum in such conditions.',
          },
          {
            question: 'For a salaried individual with monthly income, which is more practical?',
            options: ['Lump Sum', 'SIP', 'Neither', 'Only FD'],
            correctAnswer: 1,
            explanation: 'SIP aligns naturally with monthly salary income, allowing regular and disciplined investing without the need for a large initial corpus.',
          },
        ],
        summaryNotes: [
          'Neither SIP nor Lump Sum is universally better — it depends on context',
          'SIP is better for regular income earners and risk-averse investors',
          'Lump Sum is better when you have idle money and markets are undervalued',
          'Combining both strategies often gives the best results',
          'For long-term wealth building, consistency matters more than method',
        ],
        relatedTopics: ['what-is-sip', 'how-sip-works', 'rupee-cost-averaging'],
      },
    },
    {
      id: 'power-of-compounding',
      title: 'Power of Compounding',
      slug: 'power-of-compounding',
      content: {
        definition: 'Compounding is the process where returns on an investment generate their own returns over time. In the context of SIP, compounding means that the returns you earn in one period are reinvested and start earning returns themselves, creating a snowball effect that accelerates wealth creation over long periods.',
        explanation: 'Albert Einstein reportedly called compound interest the "eighth wonder of the world." In a SIP, compounding works like this: Your ₹10,000 monthly SIP earns returns. Those returns are reinvested. Next month, your new ₹10,000 plus the previous investment plus the returns — all earn returns together. Over 5 years, this effect is moderate. Over 10 years, it becomes significant. Over 20-30 years, it becomes extraordinary. The key insight is that in the early years, your invested amount is larger than returns. But after a tipping point (usually 12-15 years), your returns start exceeding your total investment. This is when wealth multiplication truly kicks in.',
        realLifeExample: 'Three friends — Amit, Bharat, and Chitra — each invest ₹10,000/month SIP at 12% annual return:\n\nAmit starts at age 25, invests for 30 years (till 55):\nTotal invested: ₹36,00,000 (₹36 Lakhs)\nTotal value: ₹3,52,99,138 (₹3.53 Crore)\nWealth multiplier: 9.8x\n\nBharat starts at age 30, invests for 25 years (till 55):\nTotal invested: ₹30,00,000 (₹30 Lakhs)\nTotal value: ₹1,89,76,351 (₹1.90 Crore)\nWealth multiplier: 6.3x\n\nChitra starts at age 35, invests for 20 years (till 55):\nTotal invested: ₹24,00,000 (₹24 Lakhs)\nTotal value: ₹99,91,479 (₹1.00 Crore)\nWealth multiplier: 4.2x\n\nAmit invested just ₹6 Lakhs more than Bharat but got ₹1.63 Crore MORE. That is the power of starting early and letting compounding work.',
        keyPoints: [
          'Compounding turns small, regular investments into large wealth over time',
          'The earlier you start, the more powerful compounding becomes',
          'Time is the most critical ingredient in compounding',
          'After 12-15 years, returns typically exceed total investment',
          'Staying invested through market cycles is essential for compounding to work',
          'Compounding rewards patience and punishes frequent withdrawals',
          'Even a 5-year delay can reduce final wealth by 40-50%',
          'SIP + Compounding + Time = The most reliable wealth-building formula',
        ],
        formula: 'Compound Interest Formula:\nA = P(1 + r/n)^(nt)\n\nFor SIP:\nFV = P × [(1+r)^n - 1] / r × (1+r)\n\nThe "compounding magic" happens because each period\'s returns become part of the next period\'s principal.',
        numericalExample: '₹10,000/month SIP at 12% return:\n\nAfter 5 years: ₹8,24,867 (Invested: ₹6L, Returns: ₹2.25L)\nAfter 10 years: ₹23,23,391 (Invested: ₹12L, Returns: ₹11.23L)\nAfter 15 years: ₹50,45,760 (Invested: ₹18L, Returns: ₹32.45L) ← Returns exceed investment!\nAfter 20 years: ₹99,91,479 (Invested: ₹24L, Returns: ₹75.91L)\nAfter 25 years: ₹1,89,76,351 (Invested: ₹30L, Returns: ₹159.76L)\nAfter 30 years: ₹3,52,99,138 (Invested: ₹36L, Returns: ₹316.99L)\n\nNotice: From year 15 onwards, returns are growing much faster than investment.',
        faq: [
          {
            question: 'When does compounding really start showing results?',
            answer: 'The compounding effect becomes noticeable after 7-8 years and truly dramatic after 15+ years. The first 5 years feel slow, but patience is rewarded exponentially.',
          },
          {
            question: 'Does compounding work in SIP like it works in FD?',
            answer: 'In SIP, compounding works through market appreciation of accumulated units. While not as predictable as FD compound interest, equity SIP compounding has historically been far more powerful due to higher return rates.',
          },
          {
            question: 'What is the Rule of 72?',
            answer: 'The Rule of 72 estimates how long it takes to double your money. Divide 72 by the annual return rate. At 12% returns, money doubles every 6 years (72/12 = 6). At 15%, it doubles every 4.8 years.',
          },
        ],
        mcqs: [
          {
            question: 'At 12% return, approximately how many years does it take for SIP returns to exceed total investment?',
            options: ['5 years', '10 years', '12-15 years', '20 years'],
            correctAnswer: 2,
            explanation: 'At 12% annual return, the compounding tipping point (where accumulated returns exceed total investment) typically occurs around 12-15 years of SIP investing.',
          },
          {
            question: 'According to the Rule of 72, how long does it take to double money at 12% returns?',
            options: ['4 years', '6 years', '8 years', '12 years'],
            correctAnswer: 1,
            explanation: 'Rule of 72: 72 ÷ 12 = 6 years. At 12% annual return, your investment approximately doubles every 6 years.',
          },
        ],
        summaryNotes: [
          'Compounding is the single most powerful force in wealth creation',
          'Start SIP as early as possible — every year of delay costs significantly',
          'Stay invested for 15+ years to experience the full power of compounding',
          'Do not withdraw from SIP prematurely — you break the compounding chain',
          'The Rule of 72 helps estimate doubling time: 72 ÷ return rate = years to double',
        ],
        relatedTopics: ['what-is-sip', 'how-sip-works', 'sip-for-salaried'],
      },
    },
    {
      id: 'rupee-cost-averaging',
      title: 'Rupee Cost Averaging',
      slug: 'rupee-cost-averaging',
      content: {
        definition: 'Rupee Cost Averaging (RCA) is an investment strategy inherent to SIP where a fixed rupee amount is invested at regular intervals, automatically purchasing more units when prices are low and fewer units when prices are high. This results in the average cost per unit being lower than the average market price over the investment period.',
        explanation: 'Imagine you go to a market to buy mangoes every week, spending exactly ₹100 each time. One week mangoes cost ₹50/kg, you get 2 kg. Next week they cost ₹25/kg, you get 4 kg. Over two weeks, you spent ₹200 and got 6 kg. Your average cost is ₹33.33/kg — lower than the average market price of ₹37.50/kg. SIP works exactly like this. By investing the same amount every month regardless of market conditions, you naturally buy more units when prices are low and fewer when prices are high. Over time, this brings down your average cost and improves returns.',
        realLifeExample: 'Meera invests ₹10,000/month via SIP for 6 months:\n\nMonth 1: NAV ₹100, Units = 100.00\nMonth 2: NAV ₹80, Units = 125.00 (market dip)\nMonth 3: NAV ₹70, Units = 142.86 (further dip — most units!)\nMonth 4: NAV ₹85, Units = 117.65 (recovery)\nMonth 5: NAV ₹95, Units = 105.26\nMonth 6: NAV ₹110, Units = 90.91 (market high)\n\nTotal invested: ₹60,000\nTotal units: 681.68\nAverage cost/unit: ₹88.02\nAverage market NAV: ₹90.00\nCurrent value (at ₹110): ₹74,984\nProfit: ₹14,984 (25%)\n\nHer average cost (₹88.02) is lower than the average NAV (₹90.00). The dip in months 2-3 actually helped by allowing more unit accumulation.',
        keyPoints: [
          'RCA automatically buys more units at lower prices, fewer at higher prices',
          'Your average purchase cost is always lower than or equal to the average market price',
          'Market dips during SIP are actually beneficial for long-term investors',
          'RCA eliminates the need (and stress) of market timing',
          'The benefit of RCA increases with higher market volatility',
          'RCA is most effective in the accumulation phase (early years of investing)',
          'Combined with compounding, RCA creates a powerful wealth-building engine',
        ],
        faq: [
          {
            question: 'Does RCA guarantee profits?',
            answer: 'No. RCA reduces the average cost of investment but does not guarantee profits. If the market consistently falls and never recovers, you could still face losses. However, historically, markets have always recovered from downturns given enough time.',
          },
          {
            question: 'Is RCA better in volatile or stable markets?',
            answer: 'RCA provides greater benefit in volatile markets where prices fluctuate significantly. In a steadily rising market, RCA benefit is minimal, and a lump sum investment would actually perform better.',
          },
        ],
        mcqs: [
          {
            question: 'In Rupee Cost Averaging, when does an investor accumulate the most units?',
            options: ['When market is at peak', 'When market has fallen', 'Regardless of market', 'Only during recovery'],
            correctAnswer: 1,
            explanation: 'When the market falls and NAV decreases, the same fixed SIP amount purchases more units, which is the core mechanism of Rupee Cost Averaging.',
          },
        ],
        summaryNotes: [
          'RCA is a natural benefit of SIP — no extra effort required',
          'Market dips are your friend when you are investing via SIP',
          'RCA works best over longer investment periods with market volatility',
          'Do not stop SIP during market corrections — that is when RCA works hardest for you',
          'RCA removes the emotional aspect of investing decisions',
        ],
        relatedTopics: ['how-sip-works', 'sip-vs-lumpsum', 'volatile-markets'],
      },
    },
    {
      id: 'sip-myths-facts',
      title: 'SIP Myths vs Facts',
      slug: 'sip-myths-facts',
      content: {
        definition: 'Despite SIP being one of the most popular investment methods in India, several misconceptions persist among investors. Understanding the difference between SIP myths and facts is essential for making informed investment decisions and avoiding common pitfalls.',
        explanation: 'Many investors either avoid SIP due to myths or invest with unrealistic expectations. Some believe SIP guarantees returns (it does not). Others think SIP should be stopped during market crashes (the opposite is true). Some believe large SIPs are always better (consistency matters more). Let us bust the top myths with factual evidence.',
        realLifeExample: 'Suresh heard from a colleague that "SIP always makes money" and started investing ₹15,000/month in a sectoral fund (IT sector) in 2021. When the IT sector corrected 30% in 2022, Suresh panicked and stopped his SIP, booking a loss. His colleague Deepa, investing the same amount in a diversified fund, continued her SIP through the correction. By 2024, Deepa\'s average cost was much lower and she was in significant profit, while Suresh locked in his losses.',
        keyPoints: [
          'Myth: SIP guarantees returns. Fact: SIP is a method, returns depend on the fund and market.',
          'Myth: Stop SIP when markets crash. Fact: Market crashes are the best time for SIP — you get more units.',
          'Myth: SIP is only for small investors. Fact: Even HNIs use SIP for disciplined investing.',
          'Myth: Longer SIP always means better returns. Fact: Fund selection and asset allocation matter too.',
          'Myth: SIP date matters a lot. Fact: Over long periods, the date of SIP has negligible impact.',
          'Myth: You need to monitor SIP daily. Fact: Review quarterly or semi-annually — daily monitoring leads to panic decisions.',
          'Myth: SIP in the best-performing fund is ideal. Fact: Past performance does not guarantee future results.',
          'Myth: One SIP is enough. Fact: Diversify across fund categories for optimal risk-adjusted returns.',
        ],
        faq: [
          {
            question: 'Should I stop SIP during a market crash?',
            answer: 'Absolutely not. Market crashes are when SIP works best. Your fixed amount buys more units at lower prices. When markets recover, these extra units generate higher returns. Stopping SIP during a crash locks in losses and misses the recovery.',
          },
          {
            question: 'Is SIP completely risk-free?',
            answer: 'No investment is completely risk-free. SIP in equity funds carries market risk. However, SIP reduces risk through Rupee Cost Averaging and disciplined investing. Over long periods (7+ years), equity SIPs have historically delivered positive returns.',
          },
        ],
        mcqs: [
          {
            question: 'What should you do when the market crashes during your SIP?',
            options: ['Stop the SIP immediately', 'Continue the SIP as planned', 'Invest lump sum on top of SIP', 'Switch to FD'],
            correctAnswer: 1,
            explanation: 'Continuing SIP during market crashes is the best strategy. You accumulate more units at lower prices, which benefits you when markets recover.',
          },
        ],
        summaryNotes: [
          'SIP is not a guarantee — it is a disciplined investment method',
          'Never stop SIP in panic during market corrections',
          'Diversify across fund types instead of chasing past performance',
          'Review but do not obsess — quarterly reviews are sufficient',
          'Consistency and patience are the real secrets of SIP success',
        ],
        relatedTopics: ['what-is-sip', 'rupee-cost-averaging', 'volatile-markets'],
      },
    },
    {
      id: 'who-should-invest',
      title: 'Who Should Invest in SIP?',
      slug: 'who-should-invest',
      content: {
        definition: 'SIP is suitable for virtually every type of investor — from college students starting with ₹500/month to high-net-worth individuals investing lakhs. The flexibility, discipline, and accessibility of SIP make it the most inclusive wealth-building tool available in India today.',
        explanation: 'SIP is designed for everyone who wants to build wealth over time. The only prerequisite is a regular income (or savings) and a long-term mindset. Whether you earn ₹20,000 or ₹2,00,000 per month, SIP allows you to invest proportionally. The ideal SIP allocation is typically 20-30% of your monthly income after expenses and emergency fund contributions.',
        realLifeExample: 'Different investor profiles and their SIP strategies:\n\n1. Ravi (22, Fresh Graduate, ₹30,000 salary): Starts ₹3,000 SIP. In 30 years at 12% return → ₹1.06 Crore\n2. Neha (30, IT Professional, ₹1,50,000 salary): Starts ₹25,000 SIP. In 25 years → ₹4.74 Crore\n3. Suresh (40, Business Owner, variable income): Starts ₹50,000 SIP. In 20 years → ₹4.99 Crore\n4. Lakshmi (55, Pre-retiree, ₹2,00,000 salary): Starts ₹60,000 SIP in debt funds. In 5 years → ₹41.24 Lakhs (capital preservation)',
        keyPoints: [
          'Salaried individuals: SIP aligns perfectly with monthly income',
          'Business owners: SIP brings discipline to irregular income patterns',
          'Students and young professionals: Starting early maximizes compounding',
          'Parents: SIP is ideal for child education and marriage planning',
          'Pre-retirees: Debt SIPs help preserve and grow capital safely',
          'Women investors: SIP builds financial independence and security',
          'NRIs: SIP in Indian mutual funds for rupee-denominated wealth building',
          'First-time investors: SIP is the simplest way to start investing',
        ],
        faq: [
          {
            question: 'I earn only ₹20,000/month. Can I still do SIP?',
            answer: 'Absolutely! You can start a SIP with just ₹500/month. Even a small SIP, started early and continued consistently, can grow into significant wealth. The key is to start — no amount is too small.',
          },
          {
            question: 'Should I do SIP or repay my loans first?',
            answer: 'High-interest loans (credit cards, personal loans at 15%+) should be repaid first. For moderate interest loans (home loan at 8-9%), you can do SIP alongside loan repayment, as equity SIPs can potentially earn higher returns than the loan interest rate.',
          },
        ],
        mcqs: [
          {
            question: 'What percentage of monthly income is generally recommended for SIP?',
            options: ['5-10%', '20-30%', '50-60%', '80-90%'],
            correctAnswer: 1,
            explanation: 'Financial planners typically recommend investing 20-30% of monthly income in SIP, after accounting for essential expenses and emergency fund contributions.',
          },
        ],
        summaryNotes: [
          'SIP is for everyone — there is no minimum income requirement',
          'Start as early as possible, even with small amounts',
          'Increase SIP amount as income grows (step-up SIP)',
          'Clear high-interest debt before starting equity SIP',
          'SIP works best with a long-term horizon of 7+ years',
        ],
        relatedTopics: ['what-is-sip', 'sip-for-salaried', 'sip-for-business-owners'],
      },
    },
    {
      id: 'sip-for-salaried',
      title: 'SIP for Salaried Individuals',
      slug: 'sip-for-salaried',
      content: {
        definition: 'For salaried individuals, SIP is the most natural and effective investment method because it aligns perfectly with the regular monthly income cycle. By automating investments through auto-debit immediately after salary credit, salaried investors can build significant wealth over their working years.',
        explanation: 'As a salaried person, your biggest advantage is predictable monthly income. SIP leverages this by automatically investing a portion of your salary before you can spend it. The ideal approach is: Salary credited → SIP auto-debited (within 2-3 days) → Remaining amount for expenses. This "pay yourself first" strategy ensures consistent investing.',
        realLifeExample: 'Kavita, a 28-year-old marketing manager earning ₹75,000/month, structures her SIP portfolio:\n\n1. ELSS Fund SIP: ₹5,000/month (tax saving under 80C)\n2. Large Cap Fund SIP: ₹8,000/month (stability)\n3. Flexi Cap Fund SIP: ₹5,000/month (growth)\n4. International Fund SIP: ₹2,000/month (diversification)\nTotal: ₹20,000/month (27% of salary)\n\nShe sets auto-debit on the 3rd of every month (salary on 1st). In 25 years, at 12% average return, her portfolio could grow to approximately ₹3.80 Crore — from a total investment of just ₹60 Lakhs.',
        keyPoints: [
          'Set SIP auto-debit 2-3 days after salary credit date',
          'Follow the "Pay Yourself First" principle',
          'Allocate 20-30% of take-home salary to SIP',
          'Include ELSS SIP for tax saving under Section 80C',
          'Increase SIP by 10-15% annually when salary increases (step-up SIP)',
          'Maintain 6 months emergency fund before aggressive SIP',
          'Diversify across fund categories for balanced risk-return',
          'Use salary increments to boost SIP rather than lifestyle',
        ],
        faq: [
          {
            question: 'How should I allocate my salary for SIP?',
            answer: 'A good framework: 50% for needs (rent, bills, essentials), 20-30% for investments (SIP), 10-20% for wants (lifestyle). Of the investment portion, diversify across equity (60-70%), debt (20-30%), and gold (5-10%) based on age and goals.',
          },
          {
            question: 'Should I invest my entire bonus as lump sum or convert to SIP?',
            answer: 'A balanced approach works best: invest 50% as lump sum in your existing funds, and convert the remaining 50% into a 6-month SIP. This balances immediate market exposure with risk spreading.',
          },
        ],
        mcqs: [
          {
            question: 'What is the ideal approach for setting SIP auto-debit for salaried investors?',
            options: ['End of month', '2-3 days after salary credit', 'Middle of month', 'Any random date'],
            correctAnswer: 1,
            explanation: 'Setting SIP auto-debit 2-3 days after salary credit ensures sufficient balance and follows the "Pay Yourself First" principle.',
          },
        ],
        summaryNotes: [
          'Salaried individuals have the most natural advantage for SIP',
          'Automate everything — SIP should happen before discretionary spending',
          'Use salary hikes to increase SIP, not just lifestyle',
          'ELSS SIP provides dual benefit: wealth creation + tax saving',
          'Think of SIP as a non-negotiable monthly expense, not optional',
        ],
        relatedTopics: ['who-should-invest', 'step-up-sip', 'sip-taxation'],
      },
    },
    {
      id: 'sip-for-business-owners',
      title: 'SIP for Business Owners',
      slug: 'sip-for-business-owners',
      content: {
        definition: 'Business owners often face irregular income patterns, making SIP particularly valuable as a tool to bring investment discipline. By committing to a fixed monthly SIP based on minimum expected income, business owners can systematically build personal wealth separate from their business assets.',
        explanation: 'Unlike salaried individuals, business owners face variable income — some months are great, others not so much. SIP provides a framework: set a base SIP amount based on your lowest-income months, and make additional lump sum investments during high-income months. This hybrid approach ensures consistency while capitalizing on good months.',
        realLifeExample: 'Vijay runs a textile trading business. His monthly income varies from ₹2L to ₹10L. He structures his investing:\n\nBase SIP: ₹30,000/month (affordable even in worst months)\nBooster Lump Sum: ₹50,000-₹2,00,000 whenever monthly income exceeds ₹5L\n\nIn a year, his systematic investments total ₹3.6L (SIP) + ₹6-8L (lump sum) = ₹9.6L-₹11.6L. This approach ensures he invests consistently while capitalizing on good business months.',
        keyPoints: [
          'Set base SIP at an amount comfortable even during lowest-income months',
          'Add lump sum investments during high-income months',
          'Keep business and personal investment accounts separate',
          'Maintain a larger emergency fund (12 months vs 6 months for salaried)',
          'Consider SIP in liquid/debt funds for business contingency reserve',
          'Tax planning through ELSS SIP can reduce business tax liability',
          'Diversify personal wealth outside of business assets',
          'SIP provides forced savings discipline for entrepreneurial personalities',
        ],
        faq: [
          {
            question: 'My income is very irregular. How do I decide SIP amount?',
            answer: 'Calculate your average monthly income over the last 12 months, then set your SIP at 15-20% of this average. Ensure this amount is affordable even during your worst income months. Add lump sum investments during high-income months.',
          },
          {
            question: 'Should I invest business profits through SIP?',
            answer: 'Reinvest in business first if the ROI is higher. But also maintain personal SIPs for diversification — your personal wealth should not be entirely dependent on one business. A good balance is 60-70% business reinvestment, 30-40% personal investments.',
          },
        ],
        mcqs: [
          {
            question: 'How should business owners determine their SIP amount?',
            options: ['Based on best month income', 'Based on average income, affordable even in worst months', 'Whatever is left after business expenses', 'Fixed percentage of revenue'],
            correctAnswer: 1,
            explanation: 'Business owners should set SIP based on average income levels, ensuring it is sustainable even during low-income months, and supplement with lump sum investments during high-income periods.',
          },
        ],
        summaryNotes: [
          'SIP brings investment discipline to unpredictable business income',
          'Base SIP + opportunistic lump sum is the ideal strategy',
          'Personal wealth diversification is crucial for business owners',
          'Maintain larger emergency reserves than salaried individuals',
          'Separate business finances from personal investment strategy',
        ],
        relatedTopics: ['who-should-invest', 'sip-for-salaried', 'step-up-sip'],
      },
    },
  ],
};
