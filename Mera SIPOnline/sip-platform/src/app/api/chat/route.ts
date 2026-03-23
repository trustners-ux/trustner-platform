import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ─────────────────────────────────────────────────────────
// Mera SIP Online — Hybrid AI SIP Assistant
// Tier 1: Keyword-based instant response (free, fast)
// Tier 2: Site content search + OpenAI gpt-4o-mini (intelligent, contextual)
// By Trustner Asset Services Pvt. Ltd.
// ─────────────────────────────────────────────────────────

/* ════════════════════════════════════════════════════════════
   TIER 1: KEYWORD-BASED KNOWLEDGE BASE (instant, free)
   ════════════════════════════════════════════════════════════ */

interface ResponseEntry {
  keywords: string[];
  response: string;
}

const KNOWLEDGE_BASE: ResponseEntry[] = [
  // ── SIP Basics ──────────────────────────────────────────
  {
    keywords: ['what is sip', 'sip meaning', 'sip kya hai', 'define sip', 'sip full form'],
    response:
      'SIP stands for Systematic Investment Plan. It\'s a method of investing a fixed amount regularly (monthly/weekly/daily) in mutual funds.\n\n' +
      '• How it works: A fixed amount is auto-debited from your bank and invested in your chosen mutual fund on a set date.\n' +
      '• Minimum: Start with as low as ₹500/month.\n' +
      '• Key benefits: Rupee cost averaging, power of compounding, and disciplined investing.\n\n' +
      '→ Explore our SIP Calculator at /calculators/sip to see how your money can grow!',
  },
  {
    keywords: ['how sip works', 'sip process', 'sip mechanism', 'how does sip work'],
    response:
      'Here\'s how a SIP works step by step:\n\n' +
      '1. Choose a mutual fund scheme (equity, debt, hybrid, etc.)\n' +
      '2. Decide your SIP amount (₹500 minimum) and date (1st-28th of month)\n' +
      '3. Set up auto-debit via bank mandate (OTM/NACH)\n' +
      '4. Every month, units are purchased at the current NAV\n' +
      '5. When NAV is low → you get more units. When high → fewer units\n' +
      '6. This averages your cost over time (Rupee Cost Averaging)\n\n' +
      'Over long periods, even small SIPs can create significant wealth through compounding! 📈',
  },
  {
    keywords: ['sip benefit', 'advantage of sip', 'why sip', 'sip advantages'],
    response:
      'Key benefits of SIP investing:\n\n' +
      '✅ Rupee Cost Averaging — Buy more units when markets are low, fewer when high\n' +
      '✅ Power of Compounding — Returns earn returns over time\n' +
      '✅ Discipline — Automates your investing habit\n' +
      '✅ Flexibility — Start, stop, increase, or pause anytime\n' +
      '✅ Low Entry — Begin with just ₹500/month\n' +
      '✅ No Timing Needed — No need to time the market\n' +
      '✅ Diversification — Spread risk across many stocks/bonds\n\n' +
      'A ₹10,000/month SIP at 12% for 20 years can grow to approximately ₹1 Crore!',
  },

  // ── SIP vs Lump Sum ────────────────────────────────────
  {
    keywords: ['sip vs lump', 'lumpsum vs sip', 'lump sum', 'one time invest', 'sip or lumpsum'],
    response:
      'SIP vs Lump Sum — Key Differences:\n\n' +
      '📊 SIP:\n' +
      '• Invest fixed amount regularly (monthly)\n' +
      '• Benefits from rupee cost averaging\n' +
      '• Lower risk — spreads investment over time\n' +
      '• Best for: Salaried individuals, regular income\n\n' +
      'Lump Sum:\n' +
      '• One-time large investment\n' +
      '• Works best when markets are undervalued\n' +
      '• Higher risk — all money enters at one NAV\n' +
      '• Best for: Windfall income, bonus, inheritance\n\n' +
      'Verdict: For most investors, SIP is better as it removes emotional decision-making. In a consistently rising market, lump sum may give slightly higher returns.\n\n' +
      '→ Compare both using our Lump Sum Calculator at /calculators/lumpsum',
  },

  // ── Step-Up SIP ────────────────────────────────────────
  {
    keywords: ['step up', 'step-up', 'sip increase', 'top up sip', 'increment sip', 'increasing sip'],
    response:
      'Step-Up SIP (also called Top-Up SIP) is a powerful strategy where you increase your SIP amount annually.\n\n' +
      '📈 How it works:\n' +
      '• Start with ₹10,000/month\n' +
      '• Increase by 10% each year\n' +
      '• Year 2: ₹11,000 → Year 3: ₹12,100 → and so on\n\n' +
      'Impact comparison (20 years, 12% returns):\n' +
      '• Fixed ₹10,000 SIP → ~₹1 Crore\n' +
      '• 10% Step-Up SIP → ~₹1.9 Crore (almost DOUBLE!)\n\n' +
      'This strategy aligns with your growing income and fights inflation effectively.\n\n' +
      '→ Try our Step-Up SIP Calculator at /calculators/step-up-sip',
  },

  // ── Compounding ────────────────────────────────────────
  {
    keywords: ['compound', 'compounding', 'power of compounding', 'compound interest'],
    response:
      'The Power of Compounding — Einstein called it the "8th Wonder of the World"!\n\n' +
      'How it works: Your returns earn their own returns, creating exponential growth over time.\n\n' +
      '📊 Example with ₹10,000/month SIP at 12%:\n' +
      '• After 5 years: ₹8.2 lakh (invested ₹6 lakh)\n' +
      '• After 10 years: ₹23.2 lakh (invested ₹12 lakh)\n' +
      '• After 20 years: ₹99.9 lakh (invested ₹24 lakh)\n' +
      '• After 30 years: ₹3.5 Crore (invested ₹36 lakh)\n\n' +
      '⏰ The key ingredient is TIME. Starting 5 years early can make a massive difference!\n\n' +
      '→ See the magic yourself at /calculators/sip',
  },

  // ── Rupee Cost Averaging ────────────────────────────────
  {
    keywords: ['rupee cost', 'cost averaging', 'averaging', 'rca', 'dca', 'dollar cost'],
    response:
      'Rupee Cost Averaging (RCA) is one of the biggest advantages of SIP.\n\n' +
      '📉 When market falls → Your SIP buys MORE units at lower price\n' +
      '📈 When market rises → Your SIP buys fewer units at higher price\n' +
      'Result → Your average cost per unit is LOWER than the average market price\n\n' +
      'Example with ₹5,000/month SIP:\n' +
      '• Month 1: NAV ₹50 → 100 units\n' +
      '• Month 2: NAV ₹40 → 125 units (market fell!)\n' +
      '• Month 3: NAV ₹45 → 111 units\n' +
      '• Total: 336 units for ₹15,000 → Avg cost: ₹44.6/unit\n\n' +
      'This is why SIP investors should NOT stop SIPs when markets fall — that\'s actually the best time to accumulate more units!',
  },

  // ── Types of Mutual Funds ──────────────────────────────
  {
    keywords: ['type of fund', 'fund type', 'fund categor', 'mutual fund type', 'kinds of fund', 'best fund type'],
    response:
      'Main types of mutual funds in India:\n\n' +
      '📊 By Asset Class:\n' +
      '• Equity Funds — Invest in stocks (higher risk, higher returns)\n' +
      '• Debt Funds — Invest in bonds/govt securities (lower risk)\n' +
      '• Hybrid Funds — Mix of equity + debt (balanced)\n' +
      '• Index Funds — Track indices like Nifty 50, Sensex\n' +
      '• ELSS — Tax-saving equity funds (80C benefit)\n\n' +
      'By Market Cap (Equity):\n' +
      '• Large Cap — Top 100 companies (stable)\n' +
      '• Mid Cap — 101-250 companies (moderate risk)\n' +
      '• Small Cap — 251+ companies (high risk, high potential)\n' +
      '• Flexi Cap — Invests across all market caps\n' +
      '• Multi Cap — Minimum 25% each in large, mid, small\n\n' +
      '→ Explore all categories in our Fund Explorer at /funds',
  },

  // ── Large Cap ──────────────────────────────────────────
  {
    keywords: ['large cap', 'largecap', 'blue chip', 'bluechip', 'big compan'],
    response:
      'Large Cap Funds invest in India\'s top 100 companies by market capitalization — think Reliance, TCS, HDFC Bank, Infosys.\n\n' +
      '✅ Advantages:\n' +
      '• Most stable among equity categories\n' +
      '• Well-established, profitable companies\n' +
      '• Good for beginners and conservative equity investors\n' +
      '• Historical returns: 10-13% CAGR over 10+ years\n\n' +
      '⚠️ Limitations:\n' +
      '• Lower growth potential vs mid/small caps\n' +
      '• May underperform in strong bull markets\n\n' +
      'Best for: First-time investors, moderate risk appetite, 5+ year horizon',
  },

  // ── Mid Cap & Small Cap ────────────────────────────────
  {
    keywords: ['mid cap', 'midcap', 'small cap', 'smallcap', 'micro cap'],
    response:
      'Mid Cap & Small Cap Funds:\n\n' +
      '📊 Mid Cap (companies ranked 101-250):\n' +
      '• Growing companies with expansion potential\n' +
      '• Historical returns: 12-16% CAGR\n' +
      '• Moderate to high risk\n' +
      '• Best for: 7+ year investment horizon\n\n' +
      'Small Cap (companies ranked 251+):\n' +
      '• Highest growth potential in equity space\n' +
      '• Historical returns: 14-18% CAGR\n' +
      '• High volatility — can drop 30-40% in corrections\n' +
      '• Best for: 10+ year horizon, high risk tolerance\n\n' +
      'Pro tip: Keep small cap allocation to max 15-20% of your portfolio. Combine with large cap for a balanced approach.',
  },

  // ── Index Funds ────────────────────────────────────────
  {
    keywords: ['index fund', 'nifty 50', 'sensex fund', 'passive fund', 'etf', 'nifty fund'],
    response:
      'Index Funds — Simple, Low-Cost Investing!\n\n' +
      '📊 What they are: Funds that replicate a market index (like Nifty 50 or Sensex) by buying the same stocks in the same proportion.\n\n' +
      '✅ Benefits:\n' +
      '• Very low expense ratio (0.1-0.5% vs 1-2% for active funds)\n' +
      '• No fund manager bias — you get market returns\n' +
      '• Transparent — you always know what\'s in the portfolio\n' +
      '• Hard to beat consistently over 10+ years\n\n' +
      '📈 Popular options:\n' +
      '• Nifty 50 Index Fund — Top 50 companies\n' +
      '• Nifty Next 50 — Companies ranked 51-100\n' +
      '• Nifty Midcap 150 — Mid-cap exposure\n' +
      '• Sensex Fund — Top 30 companies\n\n' +
      'Best for: Long-term wealth building, beginners who want simplicity',
  },

  // ── ELSS & Tax Saving ──────────────────────────────────
  {
    keywords: ['elss', 'tax sav', '80c', 'tax benefit', 'tax deduction', 'tax saving fund'],
    response:
      'ELSS (Equity Linked Saving Scheme) — Tax Saving + Wealth Building!\n\n' +
      'Key Features:\n' +
      '• Tax deduction up to ₹1.5 lakh under Section 80C\n' +
      '• Shortest lock-in among 80C options: just 3 years\n' +
      '• Invests primarily in equities — growth potential\n' +
      '• SIP allowed — invest ₹12,500/month for full ₹1.5L benefit\n\n' +
      'Comparison with other 80C options:\n' +
      '• PPF: 7.1% returns, 15-year lock-in\n' +
      '• NSC: 7.7% returns, 5-year lock-in\n' +
      '• FD: 6-7% returns, 5-year lock-in\n' +
      '• ELSS: 12-15% potential, 3-year lock-in ← Best combo!\n\n' +
      '→ Plan your tax savings at /calculators/tax-saving',
  },

  // ── Sector Funds ──────────────────────────────────────
  {
    keywords: ['sector fund', 'thematic fund', 'sector', 'pharma fund', 'banking fund', 'it fund', 'infra fund'],
    response:
      'Sectoral & Thematic Funds focus on specific sectors or themes:\n\n' +
      '📊 Popular sectors:\n' +
      '• Banking & Financial Services\n' +
      '• IT & Technology\n' +
      '• Pharma & Healthcare\n' +
      '• Infrastructure\n' +
      '• Manufacturing\n' +
      '• Consumption / FMCG\n\n' +
      '⚠️ Important: These are HIGH-RISK, HIGH-REWARD funds.\n' +
      '• Concentrated in one sector (no diversification)\n' +
      '• Cyclical — can underperform for years\n' +
      '• Best kept to max 10-15% of portfolio\n\n' +
      'Recommendation: For most investors, diversified equity funds (Flexi Cap, Multi Cap) are safer choices.',
  },

  // ── Direct vs Regular ──────────────────────────────────
  {
    keywords: ['direct vs regular', 'direct plan', 'regular plan', 'direct fund'],
    response:
      'Direct vs Regular Plans — Understanding the Difference:\n\n' +
      '📊 Direct Plan:\n' +
      '• No distributor commission included\n' +
      '• Lower expense ratio (0.3-0.5% less)\n' +
      '• You manage everything yourself — research, selection, rebalancing\n\n' +
      'Regular Plan (through MFD like Trustner):\n' +
      '• Includes distributor commission in expense ratio\n' +
      '• You get expert guidance, behavioral coaching, and hand-holding\n' +
      '• Portfolio reviews, rebalancing advice, crash support\n' +
      '• Goal planning, tax optimization, and estate planning\n\n' +
      '💡 The value of a good MFD far exceeds the commission difference:\n' +
      '• Preventing panic selling in crashes saves 15-30% of portfolio\n' +
      '• Goal-based planning ensures you reach targets\n' +
      '• Annual reviews keep your portfolio aligned\n\n' +
      'At Trustner (ARN-286886), we believe in transparency and trust-based relationships.',
  },

  // ── Taxation (LTCG/STCG) ──────────────────────────────
  {
    keywords: ['tax on mutual fund', 'ltcg', 'stcg', 'capital gain', 'mutual fund tax', 'tax rate mutual'],
    response:
      'Mutual Fund Taxation (FY 2025-26):\n\n' +
      '📊 Equity Funds (held >65% in equities):\n' +
      '• STCG (held < 12 months): 20% flat\n' +
      '• LTCG (held > 12 months): 12.5% above ₹1.25 lakh exemption\n\n' +
      'Debt Funds:\n' +
      '• All gains taxed at your income tax slab rate\n' +
      '• No indexation benefit (removed from April 2023)\n\n' +
      'Hybrid Funds:\n' +
      '• If equity allocation ≥ 65%: Treated as equity fund\n' +
      '• If equity allocation < 65%: Treated as debt fund\n\n' +
      '💡 Tax-saving tip: Harvest LTCG by selling and reinvesting up to ₹1.25 lakh annually to utilize the exemption.\n\n' +
      '→ Calculate your tax with /calculators/capital-gains-tax',
  },

  // ── SWP ────────────────────────────────────────────────
  {
    keywords: ['swp', 'systematic withdrawal', 'regular income', 'pension from mutual', 'withdrawal plan'],
    response:
      'SWP (Systematic Withdrawal Plan) — Create Your Own Pension!\n\n' +
      '📊 How it works:\n' +
      '• Invest a lump sum in a mutual fund\n' +
      '• Withdraw a fixed amount monthly/quarterly\n' +
      '• Remaining corpus continues to grow\n' +
      '• Tax-efficient compared to FD interest\n\n' +
      'Example: ₹50 lakh invested at 10% return\n' +
      '• Monthly SWP of ₹30,000\n' +
      '• After 20 years: You withdrew ₹72 lakh AND still have ₹40+ lakh!\n\n' +
      'Best for: Retirees, regular income needs, emergency corpus utilization\n\n' +
      '→ Try our SWP Calculator at /calculators/swp',
  },

  // ── STP ────────────────────────────────────────────────
  {
    keywords: ['stp', 'systematic transfer', 'transfer plan', 'debt to equity'],
    response:
      'STP (Systematic Transfer Plan) — Smart Way to Deploy Lump Sum!\n\n' +
      '📊 How it works:\n' +
      '• Park your lump sum in a debt/liquid fund\n' +
      '• Transfer a fixed amount to an equity fund periodically\n' +
      '• Combines safety of debt with growth of equity\n\n' +
      'Benefits:\n' +
      '• Rupee cost averaging on lump sum\n' +
      '• Parked money earns debt fund returns (~6-7%)\n' +
      '• Reduces timing risk\n' +
      '• Automatic — no manual intervention needed\n\n' +
      'Best for: Deploying inheritance, bonus, property sale proceeds into equity over 6-12 months.',
  },

  // ── NAV, AUM ──────────────────────────────────────────
  {
    keywords: ['nav', 'net asset value', 'aum', 'asset under management'],
    response:
      'NAV (Net Asset Value) & AUM (Assets Under Management):\n\n' +
      '📊 NAV = Total Assets - Liabilities / Total Outstanding Units\n' +
      '• NAV is the price per unit of a mutual fund\n' +
      '• Updated daily after market close (3:30 PM)\n' +
      '• Higher NAV ≠ Expensive fund (common myth!)\n\n' +
      '📊 AUM = Total market value of all investments in the fund\n' +
      '• Larger AUM → More investor confidence\n' +
      '• Very large AUM can reduce agility (especially in small caps)\n' +
      '• Check AUM alongside performance, not in isolation\n\n' +
      'Pro tip: Don\'t choose funds based on NAV. A ₹10 NAV fund is NOT "cheaper" than a ₹500 NAV fund — they represent different unit sizes.',
  },

  // ── Expense Ratio ──────────────────────────────────────
  {
    keywords: ['expense ratio', 'fund cost', 'ter', 'total expense'],
    response:
      'Expense Ratio (TER) — The Cost of Fund Management:\n\n' +
      '📊 What is it?\n' +
      '• Annual fee charged by the fund for management\n' +
      '• Deducted daily from NAV (not charged separately)\n' +
      '• Includes fund manager fees, admin costs, distribution\n\n' +
      'Typical ranges:\n' +
      '• Index Funds: 0.1-0.5%\n' +
      '• Large Cap Active: 1.0-1.5%\n' +
      '• Small/Mid Cap Active: 1.5-2.0%\n' +
      '• Liquid/Debt: 0.1-0.3%\n\n' +
      '💡 Impact: Even 0.5% difference compounds significantly over 20 years!\n' +
      '• ₹10,000/month at 12% for 20 years: ~₹99.9 lakh\n' +
      '• Same at 11.5% (0.5% higher expense): ~₹94.8 lakh\n' +
      '• Difference: ₹5.1 lakh!',
  },

  // ── How to Start ──────────────────────────────────────
  {
    keywords: ['how to start', 'start investing', 'beginner', 'first time', 'new to mutual', 'start sip', 'how to invest'],
    response:
      'Getting Started with Mutual Fund SIP — 5 Easy Steps:\n\n' +
      '1️⃣ Complete KYC (free, one-time)\n' +
      '   • PAN card + Aadhaar + Photo + Bank details\n' +
      '   • We do this digitally at Trustner — 10 minutes!\n\n' +
      '2️⃣ Choose your goal\n' +
      '   • Retirement, child education, home, emergency fund\n\n' +
      '3️⃣ Select the right fund(s)\n' +
      '   • Based on your risk profile and time horizon\n' +
      '   • Our team helps you choose the best fit\n\n' +
      '4️⃣ Set up SIP\n' +
      '   • Choose amount and date\n' +
      '   • Set up bank auto-debit (OTM/NACH)\n\n' +
      '5️⃣ Stay invested & review annually\n' +
      '   • Don\'t stop during market falls\n' +
      '   • Review and rebalance with your advisor\n\n' +
      '→ Sign up at trustner.investwell.app to start your investing journey!',
  },

  // ── Retirement Planning ────────────────────────────────
  {
    keywords: ['retire', 'pension', 'retirement plan', 'old age', 'after 60', 'retirement fund'],
    response:
      'Retirement Planning with Mutual Funds:\n\n' +
      '📊 The FIRE formula:\n' +
      '• Annual expenses × 25-30 = Your retirement corpus target\n' +
      '• Example: ₹50,000/month expenses → Target ₹1.5-1.8 Crore\n\n' +
      '🔑 Recommended strategy (age-based):\n' +
      '• Age 25-35: 80% equity, 20% debt (aggressive growth)\n' +
      '• Age 35-45: 70% equity, 30% debt (growth)\n' +
      '• Age 45-55: 50% equity, 50% debt (balanced)\n' +
      '• Age 55-60: 30% equity, 70% debt (capital preservation)\n\n' +
      'After retirement: Use SWP to create monthly income!\n\n' +
      '→ Try our Retirement Calculator at /calculators/retirement\n' +
      '→ Or our FIRE Calculator at /calculators/fire',
  },

  // ── Goal-Based Planning ────────────────────────────────
  {
    keywords: ['goal', 'child education', 'marriage', 'house', 'dream', 'financial goal', 'plan for'],
    response:
      'Goal-Based Investing — Plan for Every Life Stage:\n\n' +
      '🎯 Common financial goals:\n' +
      '• Child\'s Education (15-18 years) → Equity SIP\n' +
      '• Child\'s Marriage (15-20 years) → Equity + Hybrid SIP\n' +
      '• Home Down Payment (3-5 years) → Hybrid + Debt SIP\n' +
      '• Car Purchase (2-3 years) → Debt + Short-term funds\n' +
      '• Retirement (20-30 years) → Equity + Step-Up SIP\n' +
      '• Emergency Fund (build over 6 months) → Liquid fund\n\n' +
      '📊 Golden Rules:\n' +
      '• Match fund type to time horizon\n' +
      '• Use Step-Up SIP to accelerate\n' +
      '• Review annually and adjust\n\n' +
      '→ Use our Goal-Based SIP Calculator at /calculators/goal-based\n' +
      '→ Or take our FREE Financial Health Assessment at /financial-planning',
  },

  // ── Emergency Fund ────────────────────────────────────
  {
    keywords: ['emergency fund', 'liquid fund', 'overnight fund', 'rainy day', 'emergency'],
    response:
      'Emergency Fund — Your Financial Safety Net:\n\n' +
      '📊 How much to keep?\n' +
      '• 6-12 months of monthly expenses\n' +
      '• Example: ₹50,000/month expenses → ₹3-6 lakh fund\n\n' +
      'Where to park it:\n' +
      '• Liquid Funds (best!) — 5-6% returns, instant redemption up to ₹50,000\n' +
      '• Overnight Funds — Safest, 4-5% returns\n' +
      '• Savings Account — Easy access but low returns (3-4%)\n' +
      '• FD — Higher interest but premature withdrawal penalty\n\n' +
      '💡 Strategy: Keep 1 month in savings, rest in liquid fund for better returns with similar liquidity.\n\n' +
      '→ Calculate yours at /calculators/emergency-fund',
  },

  // ── Risk ──────────────────────────────────────────────
  {
    keywords: ['risk', 'safe', 'risky', 'loss', 'market crash', 'money safe', 'lose money'],
    response:
      'Understanding Risk in Mutual Funds:\n\n' +
      '📊 Risk levels by fund type:\n' +
      '• Very Low: Liquid, Overnight, Money Market\n' +
      '• Low: Short Duration, Banking & PSU Debt\n' +
      '• Moderate: Hybrid, Large Cap, Index\n' +
      '• High: Mid Cap, Flexi Cap\n' +
      '• Very High: Small Cap, Sectoral, Thematic\n\n' +
      '🔑 Risk management tips:\n' +
      '• Match fund risk to your time horizon (5+ years for equity)\n' +
      '• Diversify across fund types and AMCs\n' +
      '• Use SIP — it reduces timing risk\n' +
      '• Don\'t invest emergency money in equity\n' +
      '• Stay invested through market cycles\n\n' +
      '💡 Remember: In 20+ year periods, Indian equity has NEVER given negative returns. Time reduces risk dramatically!',
  },

  // ── Returns / Performance ──────────────────────────────
  {
    keywords: ['return', 'performance', 'cagr', 'xirr', 'how much return', 'expected return', 'profit'],
    response:
      'Mutual Fund Returns — What to Expect:\n\n' +
      '📊 Historical averages (10-15 year CAGR):\n' +
      '• Large Cap: 10-13%\n' +
      '• Mid Cap: 12-16%\n' +
      '• Small Cap: 14-18%\n' +
      '• Flexi Cap: 11-15%\n' +
      '• Debt Funds: 6-8%\n' +
      '• Hybrid: 9-12%\n\n' +
      'Important metrics:\n' +
      '• CAGR — Annualized returns for lump sum\n' +
      '• XIRR — True returns for SIP (accounts for timing)\n' +
      '• Rolling Returns — Consistency check over multiple periods\n\n' +
      '⚠️ Past returns don\'t guarantee future performance!\n' +
      '💡 Use 10-12% as a reasonable assumption for equity SIPs in your planning.\n\n' +
      '→ Explore historical data at /research/historical-returns',
  },

  // ── Fund Selection ────────────────────────────────────
  {
    keywords: ['which fund', 'best fund', 'fund select', 'choose fund', 'recommend fund', 'suggest fund', 'top fund'],
    response:
      'How to Choose the Right Mutual Fund:\n\n' +
      '📊 Selection Framework (5-point check):\n' +
      '1. Goal & Time Horizon → Equity (5+ yrs), Debt (<3 yrs), Hybrid (3-5 yrs)\n' +
      '2. Risk Tolerance → Conservative (large cap), Moderate (flexi), Aggressive (mid/small)\n' +
      '3. Fund Performance → Check 5-year, 7-year, 10-year returns + consistency\n' +
      '4. Fund Manager Track Record → Experience, other schemes managed\n' +
      '5. Expense Ratio → Lower is better (compare within category)\n\n' +
      '💡 Trustner\'s approach:\n' +
      '• We analyze 200+ parameters before recommending a fund\n' +
      '• Regular portfolio reviews and rebalancing\n' +
      '• Goal-aligned fund selection\n\n' +
      '→ Explore our curated Fund Selection at /funds/selection\n' +
      '→ Compare funds at /funds/compare',
  },

  // ── FD vs Mutual Fund ──────────────────────────────────
  {
    keywords: ['fd', 'fixed deposit', 'fd vs', 'bank fd', 'fd or mutual', 'sip vs fd'],
    response:
      'Fixed Deposit vs Mutual Fund SIP:\n\n' +
      '📊 Comparison:\n' +
      '• FD Returns: 6-7% (pre-tax) → 4.2-4.9% (post-tax @ 30% slab)\n' +
      '• Equity MF: 10-13% (historical average)\n' +
      '• Post inflation (6%), FD gives NEGATIVE real returns!\n\n' +
      'FD Advantages: Guaranteed returns, capital safety, suitable for short-term\n' +
      'MF Advantages: Higher returns, tax efficiency (LTCG), liquidity, inflation-beating\n\n' +
      '📈 ₹10,000/month for 20 years:\n' +
      '• FD at 6.5%: ~₹50 lakh (taxed annually!)\n' +
      '• SIP at 12%: ~₹1 Crore (tax only on redemption!)\n\n' +
      'Verdict: For 5+ year goals, equity MFs significantly outperform FDs.',
  },

  // ── Gold Investment ────────────────────────────────────
  {
    keywords: ['gold', 'gold fund', 'sgb', 'sovereign gold', 'gold etf', 'gold invest'],
    response:
      'Gold Investment Options:\n\n' +
      '📊 Ways to invest in gold:\n' +
      '• Sovereign Gold Bonds (SGB) — Best! Government-backed, 2.5% annual interest, tax-free on maturity\n' +
      '• Gold ETF — Exchange-traded, tracks gold price\n' +
      '• Gold Mutual Funds — Invest in gold ETFs (SIP available)\n' +
      '• Digital Gold — Buy physical gold online\n\n' +
      'Gold\'s role in portfolio:\n' +
      '• Hedge against inflation and currency depreciation\n' +
      '• Safe haven during market crashes\n' +
      '• Historical returns: 8-10% CAGR\n\n' +
      '💡 Recommended: Keep 5-10% of portfolio in gold via SGB or Gold Funds.',
  },

  // ── International Funds ────────────────────────────────
  {
    keywords: ['international', 'us fund', 'global fund', 'foreign fund', 'nasdaq', 's&p 500', 'overseas'],
    response:
      'International Fund Investing:\n\n' +
      '📊 Why invest globally?\n' +
      '• Diversify beyond India\n' +
      '• Access to global giants (Apple, Google, Amazon)\n' +
      '• Currency diversification (rupee depreciation benefits)\n\n' +
      'Options available:\n' +
      '• US-focused funds (S&P 500, Nasdaq 100)\n' +
      '• Global/World funds (developed markets)\n' +
      '• Emerging markets funds\n\n' +
      '⚠️ Note: SEBI has paused fresh investments in some international funds due to RBI\'s overseas investment limits.\n\n' +
      '💡 Recommendation: 5-10% global allocation for geographical diversification.',
  },

  // ── KYC ────────────────────────────────────────────────
  {
    keywords: ['kyc', 'know your customer', 'kyc process', 'pan card', 'aadhaar', 'document'],
    response:
      'KYC (Know Your Customer) — One-Time Process:\n\n' +
      '📄 Documents needed:\n' +
      '• PAN Card (mandatory)\n' +
      '• Aadhaar Card (for address + eKYC)\n' +
      '• Passport-size photo\n' +
      '• Bank account details (cancelled cheque/passbook)\n\n' +
      '📱 How to complete:\n' +
      '• eKYC — Online via Aadhaar OTP (5 minutes!)\n' +
      '• Full KYC — In-person verification (for higher limits)\n\n' +
      '✅ Once done through any SEBI intermediary, valid everywhere.\n' +
      '✅ Free of charge.\n\n' +
      'We at Trustner help you complete KYC digitally — reach us on WhatsApp: +91-6003903737',
  },

  // ── NPS ────────────────────────────────────────────────
  {
    keywords: ['nps', 'national pension', 'tier 1', 'tier 2', 'pension scheme'],
    response:
      'NPS (National Pension System):\n\n' +
      '📊 Key features:\n' +
      '• Government-backed retirement scheme\n' +
      '• Additional ₹50,000 tax deduction under 80CCD(1B)\n' +
      '• Choice of equity, corporate bonds, govt securities\n' +
      '• Very low expense ratio (0.01-0.09%)\n' +
      '• Lock-in until 60 (with partial withdrawal options)\n\n' +
      'Comparison with ELSS:\n' +
      '• NPS: Extra 80CCD(1B) benefit, but locked until 60\n' +
      '• ELSS: Only 80C benefit, but just 3-year lock-in\n\n' +
      '💡 Many investors use BOTH for maximum tax savings!',
  },

  // ── Debt Funds ────────────────────────────────────────
  {
    keywords: ['debt fund', 'bond fund', 'gilt fund', 'government bond', 'fixed income', 'short duration'],
    response:
      'Debt Mutual Funds — Stable Income Investing:\n\n' +
      '📊 Types (by duration):\n' +
      '• Overnight/Liquid (1 day - 3 months): Safest, 4-6%\n' +
      '• Ultra Short/Low Duration (3-12 months): 5-7%\n' +
      '• Short Duration (1-3 years): 6-8%\n' +
      '• Medium/Long Duration (3-7+ years): 7-9%\n' +
      '• Gilt Funds: Government securities, interest rate sensitive\n\n' +
      'Best for:\n' +
      '• Emergency fund → Liquid fund\n' +
      '• Short-term goals (1-3 years) → Short duration\n' +
      '• Parking lump sum before STP → Liquid/ultra short\n' +
      '• Retiree\'s stable allocation → Short/medium duration\n\n' +
      '⚠️ Tax: All gains taxed at slab rate (no indexation since April 2023)',
  },

  // ── Delay Cost ────────────────────────────────────────
  {
    keywords: ['delay', 'waiting', 'too late', 'start late', 'missed years', 'should i start now', 'cost of delay'],
    response:
      'The Cost of Delaying Your SIP — Don\'t Wait!\n\n' +
      '📊 ₹10,000/month SIP at 12% returns:\n' +
      '• Start at 25 (35 years): ₹6.5 Crore\n' +
      '• Start at 30 (30 years): ₹3.5 Crore\n' +
      '• Start at 35 (25 years): ₹1.9 Crore\n' +
      '• Start at 40 (20 years): ₹1.0 Crore\n\n' +
      '😱 Delaying by 5 years from age 25→30 costs you ₹3 CRORE!\n\n' +
      'Why? Because compounding works exponentially — the last 5-10 years contribute the MOST to your wealth.\n\n' +
      '💡 The best time to start was yesterday. The second-best time is TODAY.\n\n' +
      '→ See the impact at /calculators/delay-cost',
  },

  // ── About Mera SIP / Trustner ──────────────────────────
  {
    keywords: ['trustner', 'merasip', 'mera sip', 'about us', 'who are you', 'your company', 'about trustner'],
    response:
      'About Mera SIP Online by Trustner:\n\n' +
      '🏢 Trustner Asset Services Pvt. Ltd.\n' +
      '• AMFI Registered Mutual Fund Distributor\n' +
      '• ARN: 286886\n' +
      '• CIN: U66301AS2023PTC025505\n\n' +
      '🌟 What we offer:\n' +
      '• India\'s first FREE AI-powered CFP-grade Financial Planning tool\n' +
      '• 30+ smart calculators for every life decision\n' +
      '• 12-module NISM-aligned Learning Academy\n' +
      '• Curated Fund Selection based on 200+ parameters\n' +
      '• Research tools with historical data analysis\n\n' +
      '📍 Offices: Guwahati (HQ) | Bangalore | Kolkata | Hyderabad | Tezpur\n' +
      '📞 Contact: +91-6003903737 | wecare@merasip.com\n' +
      '🌐 Website: www.merasip.com',
  },

  // ── Financial Planning ────────────────────────────────
  {
    keywords: ['financial plan', 'plan my finance', 'money plan', 'financial health', 'cfp', 'comprehensive plan'],
    response:
      'FREE Financial Health Assessment by Mera SIP Online!\n\n' +
      '📊 What you get:\n' +
      '• Comprehensive financial health score\n' +
      '• Income vs. expense analysis\n' +
      '• Insurance adequacy check\n' +
      '• Retirement readiness assessment\n' +
      '• Emergency fund sufficiency\n' +
      '• Debt-to-income analysis\n' +
      '• Goal planning recommendations\n\n' +
      '🤖 Powered by AI — like having a CFP at your fingertips!\n' +
      '✅ Completely FREE | No login required | Instant report\n\n' +
      '→ Take the assessment now at /financial-planning',
  },

  // ── Calculator Reference ──────────────────────────────
  {
    keywords: ['calculator', 'calc', 'tool', 'planner', 'compute'],
    response:
      'Our Smart Calculators — 30+ Tools for Every Decision:\n\n' +
      '💰 Wealth & SIP:\n' +
      '• SIP Calculator, Step-Up SIP, Goal-Based, Retirement, FIRE\n' +
      '• SWP, Lumpsum, Cost of Delay, Lifeline Planner\n\n' +
      '🏠 Loan:\n' +
      '• EMI, Loan Prepayment, Car Loan vs Cash, Home Affordability\n\n' +
      '📋 Tax:\n' +
      '• Income Tax, Capital Gains, Tax Saving 80C/80D\n\n' +
      '🛡️ Insurance:\n' +
      '• Human Life Value, Term Insurance, Health Insurance\n' +
      '• Term Plan + SIP (Trustner Exclusive!)\n\n' +
      '📊 Life Decisions:\n' +
      '• Emergency Fund, Net Worth, Rent vs Buy, FD vs Loan\n\n' +
      '→ Explore all at /calculators',
  },

  // ── Market / Nifty / Sensex ────────────────────────────
  {
    keywords: ['market today', 'nifty today', 'sensex today', 'market news', 'stock market', 'market performance', 'market update'],
    response:
      'For live market updates and analysis:\n\n' +
      '📊 Check our Market Pulse page: /market-pulse\n' +
      '• Live Nifty 50 & Sensex data\n' +
      '• Sector performance heatmap\n' +
      '• Market news and insights\n\n' +
      '💡 As a SIP investor, daily market movements should NOT affect your investment decisions.\n' +
      'SIP works best when you stay invested through ups and downs — that\'s the power of rupee cost averaging!\n\n' +
      'If you\'re worried about market volatility, read our research:\n' +
      '→ /research/bull-vs-bear — SIP in bull vs bear markets\n' +
      '→ /research/volatility-simulator — Stress-test your SIP',
  },

  // ── Allocation ────────────────────────────────────────
  {
    keywords: ['allocation', 'portfolio allocation', 'how much equity', 'how to divide', 'asset allocation'],
    response:
      'Asset Allocation — The Foundation of Smart Investing:\n\n' +
      '📊 Rule of thumb: 100 - Age = Equity %\n' +
      '• Age 25 → 75% equity, 25% debt\n' +
      '• Age 40 → 60% equity, 40% debt\n' +
      '• Age 60 → 40% equity, 60% debt\n\n' +
      '🎯 Sample portfolio by risk profile:\n\n' +
      'Conservative:\n' +
      '• 40% Large Cap, 20% Hybrid, 30% Debt, 10% Gold\n\n' +
      'Moderate (Most common):\n' +
      '• 30% Large Cap, 20% Flexi, 15% Mid Cap, 25% Debt, 10% Gold\n\n' +
      'Aggressive:\n' +
      '• 25% Large Cap, 25% Mid Cap, 15% Small Cap, 20% Flexi, 10% Debt, 5% Gold\n\n' +
      '→ Get a personalized plan at /financial-planning',
  },

  // ── Glossary / Terminology ────────────────────────────
  {
    keywords: ['glossary', 'meaning of', 'term', 'definition', 'what does', 'full form'],
    response:
      'Our SIP Glossary has 48+ mutual fund terms explained simply!\n\n' +
      'Popular terms:\n' +
      '• NAV — Net Asset Value (price per unit)\n' +
      '• AUM — Assets Under Management\n' +
      '• ELSS — Tax-saving equity fund\n' +
      '• CAGR — Compound Annual Growth Rate\n' +
      '• XIRR — Accurate SIP return measure\n' +
      '• SWP — Systematic Withdrawal Plan\n' +
      '• TER — Total Expense Ratio\n\n' +
      '→ Browse all terms at /glossary',
  },

  // ── Market Timing ─────────────────────────────────────
  {
    keywords: ['timing', 'right time', 'when to invest', 'market high', 'market low', 'all time high', 'ath'],
    response:
      'Market Timing Myth — Why It Doesn\'t Work:\n\n' +
      '📊 Research shows:\n' +
      '• Missing just the 10 best market days in 20 years can halve your returns\n' +
      '• Nobody can consistently predict market tops and bottoms\n' +
      '• "Time IN the market" beats "TIMING the market"\n\n' +
      '💡 What if you invested at EVERY market peak (worst timing)?\n' +
      '• Even investing at every Nifty all-time-high since 2000\n' +
      '• You\'d still have 12-14% CAGR over 20+ years!\n\n' +
      'SIP is the answer: It removes timing stress completely. You invest automatically every month regardless of market levels.\n\n' +
      '→ See the proof at /research/bull-vs-bear',
  },

  // ── Catch-all: SIP ────────────────────────────────────
  {
    keywords: ['sip'],
    response:
      'SIP (Systematic Investment Plan) is one of the best ways to build wealth over time!\n\n' +
      'I can help you with:\n' +
      '• "What is SIP?" — Basics explained\n' +
      '• "Step-Up SIP" — Boost your returns\n' +
      '• "SIP vs Lump Sum" — Which is better\n' +
      '• "Tax on SIP" — LTCG/STCG explained\n' +
      '• "SIP for retirement" — Plan your future\n' +
      '• "SIP Calculator" — See your projected wealth\n\n' +
      'What aspect of SIP would you like to explore?',
  },

  // ── Catch-all: Mutual Fund ─────────────────────────────
  {
    keywords: ['mutual fund', 'mf'],
    response:
      'Mutual Funds — Your Investment Partner!\n\n' +
      'A mutual fund pools money from investors and invests in stocks, bonds, or both — managed by professional fund managers.\n\n' +
      'Key facts:\n' +
      '• Over ₹50 lakh crore AUM in Indian MF industry\n' +
      '• 44+ AMCs managing 2,500+ schemes\n' +
      '• Types: Equity, Debt, Hybrid, Index, ELSS, Sectoral\n' +
      '• Invest via SIP (monthly) or Lump Sum (one-time)\n' +
      '• Regulated by SEBI — your money is safe from fraud\n\n' +
      'What would you like to know more about?\n' +
      '• "Types of mutual funds" — Categories explained\n' +
      '• "How to start investing" — Step-by-step guide\n' +
      '• "Best fund types" — For your goals\n' +
      '• "Risk and returns" — What to expect\n' +
      '• "Tax on mutual funds" — LTCG, STCG explained\n\n' +
      '→ Explore our Fund Explorer at /funds',
  },
];

/* ════════════════════════════════════════════════════════════
   TIER 1: KEYWORD MATCHING (instant, free)
   ════════════════════════════════════════════════════════════ */

function getGreetingResponse(message: string): string | null {
  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|hii+|namaste|good\s?(morning|afternoon|evening))[\s!.?]*$/i.test(lower.trim()) ||
      lower.includes('hello') || lower.includes('namaste')) {
    const greetings = [
      'Hello! Welcome to Mera SIP Online. I\'m your AI-powered SIP & Mutual Fund assistant.\n\nI can help you learn about:\n• SIP basics & strategies\n• Mutual fund types & selection\n• Tax saving with ELSS\n• Goal-based planning\n• Calculators & tools\n• Current market insights\n\nWhat would you like to know? Or type a topic like "step-up SIP" or "tax saving"!',
      'Hi there! I\'m the Mera SIP Online AI assistant, ready to help you with SIP investing, mutual fund education, calculators, and financial planning.\n\nTry asking me about:\n• "What is SIP?"\n• "SIP vs FD"\n• "How to start investing"\n• "Tax saving options"\n• Or ask anything about investing!\n\nWhat interests you?',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  return null;
}

function getContactResponse(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('contact') || lower.includes('expert') || lower.includes('speak to') ||
      lower.includes('call') || lower.includes('whatsapp') || lower.includes('phone') ||
      lower.includes('email') || lower.includes('reach')) {
    return 'You can reach our team for personalized guidance:\n\n' +
      'WhatsApp: +91-6003903737 (tap the green button on bottom-right)\n' +
      'Email: wecare@merasip.com\n' +
      'Website: www.merasip.com\n\n' +
      'Trustner Asset Services Pvt. Ltd.\n' +
      '• AMFI ARN: 286886\n' +
      '• CIN: U66301AS2023PTC025505\n\n' +
      'Our team can help with fund selection, portfolio review, and goal planning!';
  }
  return null;
}

function getThankYouResponse(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('tq') || lower.includes('dhanyavad')) {
    return 'You\'re welcome! Happy to help with your SIP & mutual fund queries.\n\n' +
      'If you have more questions, just ask! You can also:\n' +
      '• Try our calculators at /calculators\n' +
      '• Learn at /learn\n' +
      '• Research funds at /funds\n' +
      '• WhatsApp us: +91-6003903737\n\n' +
      'Happy investing!';
  }
  return null;
}

function getKeywordResponse(message: string): string | null {
  const lower = message.toLowerCase();

  const greetingResp = getGreetingResponse(message);
  if (greetingResp) return greetingResp;

  const thankResp = getThankYouResponse(message);
  if (thankResp) return thankResp;

  const contactResp = getContactResponse(message);
  if (contactResp) return contactResp;

  // Search knowledge base — require strong keyword match
  // Score each entry: multi-word keyword matches score higher
  const messageWords = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch: { entry: ResponseEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        // Multi-word keywords (like "what is sip") are strong signals
        const wordCount = keyword.split(/\s+/).length;
        score += wordCount >= 3 ? 5 : wordCount >= 2 ? 3 : 1;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  // Only return static response for strong matches (score >= 3)
  // This means either: a multi-word keyword matched, or multiple single keywords matched
  // Weaker matches (score 1-2) fall through to OpenAI with context injection
  if (bestMatch && bestMatch.score >= 3) {
    return bestMatch.entry.response;
  }

  return null; // No strong match — escalate to Tier 2 (OpenAI with context)
}

/* ════════════════════════════════════════════════════════════
   TIER 2: SITE CONTENT SEARCH (build context for OpenAI)
   Search learning modules, glossary, and blog for relevant content
   ════════════════════════════════════════════════════════════ */

// Import glossary for context retrieval
import { GLOSSARY } from '@/data/glossary';

/**
 * Search glossary terms for relevant definitions.
 * Returns matching definitions as context string.
 */
function searchGlossary(query: string): string {
  const lower = query.toLowerCase();
  const matches = GLOSSARY.filter((term) =>
    lower.includes(term.term.toLowerCase()) ||
    lower.includes(term.slug) ||
    term.definition.toLowerCase().includes(lower)
  );

  if (matches.length === 0) return '';

  return matches.slice(0, 5).map((t) =>
    `${t.term}: ${t.definition}`
  ).join('\n');
}

/**
 * Search the knowledge base for partial/related matches to build context.
 * Returns top relevant entries even if they didn't match exactly.
 */
function searchKnowledgeBaseContext(query: string): string {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 2);

  const scored: { entry: ResponseEntry; score: number }[] = [];
  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      for (const word of words) {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 1;
        }
      }
    }
    // Also check if response content is relevant
    for (const word of words) {
      if (entry.response.toLowerCase().includes(word)) {
        score += 0.3;
      }
    }
    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.entry.response).join('\n\n---\n\n');
}

/* ════════════════════════════════════════════════════════════
   TIER 3: OPENAI GPT-4O-MINI (intelligent fallback with context)
   ════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are the SIP Assistant for Mera SIP Online (www.merasip.com), an AI-powered financial education chatbot by Trustner Asset Services Pvt. Ltd.

ABOUT TRUSTNER:
• AMFI Registered Mutual Fund Distributor (MFD)
• ARN: 286886 | CIN: U66301AS2023PTC025505
• Offices: Guwahati (HQ), Bangalore, Kolkata, Hyderabad, Tezpur
• Contact: +91-6003903737 | wecare@merasip.com
• Website: www.merasip.com | www.trustner.in

YOUR ROLE:
• Educate users about SIP, mutual funds, financial planning, taxation, and investing
• Be helpful, accurate, and encouraging about long-term investing
• Use simple language with Indian examples (₹, lakh, crore)
• When relevant, suggest Mera SIP tools: calculators (/calculators), learning modules (/learn), fund explorer (/funds), financial planning (/financial-planning), glossary (/glossary)

CRITICAL BUSINESS RULES:
• Trustner is an MFD selling REGULAR mutual fund plans (earns trail commission)
• NEVER promote direct plans as better than regular plans
• Position MFD commission as valuable (behavioral coaching, crash hand-holding, goal planning)
• Recommend "Growth option" — never say "choose direct" or "switch from regular to direct"
• Index funds: position as ONE option, not the best option; Indian market rewards active management too
• NEVER give specific stock tips or fund recommendations — suggest consulting Trustner team
• Always add disclaimer for investment advice: "Mutual fund investments are subject to market risks"

FORMATTING:
• Use bullet points (•) and numbered lists for clarity
• Use emojis sparingly (📊 💡 ✅ 🎯) for visual appeal
• Keep responses concise (150-300 words max)
• End with a relevant Mera SIP tool link when applicable
• If the user asks in Hindi, respond in Hindi (Devanagari or Hinglish)

LIMITATIONS:
• Do NOT provide specific investment advice or guaranteed returns
• Do NOT share portfolio allocations with exact fund names
• For complex/personalized queries, suggest contacting Trustner team on WhatsApp: +91-6003903737
• Clearly state you are an AI assistant, not a certified financial advisor`;

async function getOpenAIResponse(
  userMessage: string,
  conversationHistory: { role: string; text: string }[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return getFallbackResponse();
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Build context from site content
    const glossaryContext = searchGlossary(userMessage);
    const kbContext = searchKnowledgeBaseContext(userMessage);

    // Build context injection
    let contextBlock = '';
    if (glossaryContext || kbContext) {
      contextBlock = '\n\n--- RELEVANT CONTENT FROM MERASIP.COM ---\n';
      if (glossaryContext) {
        contextBlock += '\nGLOSSARY TERMS:\n' + glossaryContext;
      }
      if (kbContext) {
        contextBlock += '\n\nRELATED KNOWLEDGE BASE:\n' + kbContext;
      }
      contextBlock += '\n--- END SITE CONTENT ---\n\nUse the above context to inform your answer when relevant. Prioritize this content over general knowledge.';
    }

    // Build messages array with conversation history (last 6 messages for context)
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
    ];

    // Add recent conversation history for multi-turn context
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return getFallbackResponse();

    return reply;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('OpenAI API error:', errMsg);
    // If it's a rate limit or quota error, indicate that
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('insufficient')) {
      return 'I\'m currently experiencing high demand. Let me share some helpful resources instead:\n\n' +
        '• Explore our Learning Modules at /learn\n' +
        '• Try our 30+ Calculators at /calculators\n' +
        '• Browse the Glossary at /glossary\n\n' +
        'For personalized help, reach us on WhatsApp: +91-6003903737';
    }
    return getFallbackResponse();
  }
}

function getFallbackResponse(): string {
  return 'Great question! I\'d love to help you with that.\n\n' +
    'Here are some topics I can help with right away:\n' +
    '• "What is SIP?" — SIP basics explained\n' +
    '• "Types of mutual funds" — Fund categories\n' +
    '• "Step-Up SIP" — Boost your returns\n' +
    '• "Tax saving ELSS" — Section 80C benefits\n' +
    '• "SIP Calculator" — Our 30+ smart tools\n\n' +
    'For personalized guidance, reach us on WhatsApp: +91-6003903737\n\n' +
    '→ Or explore our learning modules at /learn';
}

/* ════════════════════════════════════════════════════════════
   API ROUTE HANDLER
   ════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // ── TIER 1: Keyword match (instant, free) ──
    const keywordReply = getKeywordResponse(trimmedMessage);
    if (keywordReply) {
      return NextResponse.json({
        reply: keywordReply,
        source: 'knowledge-base',
        timestamp: new Date().toISOString(),
      });
    }

    // ── TIER 2+3: Site content search + OpenAI (intelligent) ──
    const aiReply = await getOpenAIResponse(trimmedMessage, history);

    return NextResponse.json({
      reply: aiReply,
      source: 'ai',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
