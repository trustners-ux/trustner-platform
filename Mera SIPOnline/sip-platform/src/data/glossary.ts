import { GlossaryTerm } from '@/types/learning';

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'AMC', slug: 'amc', definition: 'Asset Management Company — the entity that manages mutual fund schemes. Examples: HDFC AMC, SBI Mutual Fund, ICICI Prudential.', category: 'Fund Management', relatedTerms: ['mutual-fund', 'nav', 'aum'] },
  { term: 'AMFI', slug: 'amfi', definition: 'Association of Mutual Funds in India — the self-regulatory body for mutual funds in India. Regulates distributors and promotes investor education.', category: 'Regulatory', relatedTerms: ['sebi', 'amc', 'arn'] },
  { term: 'ARN', slug: 'arn', definition: 'AMFI Registration Number — a unique ID assigned to registered mutual fund distributors. Required to distribute mutual fund products in India.', category: 'Regulatory', relatedTerms: ['amfi', 'distributor'] },
  { term: 'AUM', slug: 'aum', definition: 'Assets Under Management — the total market value of all investments managed by a mutual fund scheme or AMC.', category: 'Fund Management', relatedTerms: ['amc', 'nav', 'mutual-fund'] },
  { term: 'Balanced Fund', slug: 'balanced-fund', definition: 'A hybrid mutual fund that invests in both equity and debt instruments, providing a balance of growth and income with moderate risk.', category: 'Fund Types', relatedTerms: ['hybrid-fund', 'equity-fund', 'debt-fund'] },
  { term: 'Benchmark', slug: 'benchmark', definition: 'A standard index (like Nifty 50, Sensex) against which a mutual fund\'s performance is compared to evaluate the fund manager\'s effectiveness.', category: 'Performance', relatedTerms: ['nifty', 'sensex', 'alpha'] },
  { term: 'CAGR', slug: 'cagr', definition: 'Compound Annual Growth Rate — the annualized rate of return that smooths out year-to-year fluctuations. Used to compare fund performance over different periods.', category: 'Performance', relatedTerms: ['xirr', 'absolute-return', 'rolling-return'] },
  { term: 'Corpus', slug: 'corpus', definition: 'The total accumulated value of your mutual fund investment at any given point. Also refers to the target amount in goal-based investing.', category: 'Investment', relatedTerms: ['nav', 'units', 'portfolio'] },
  { term: 'Debt Fund', slug: 'debt-fund', definition: 'A mutual fund that invests primarily in fixed-income securities like bonds, government securities, and corporate deposits. Lower risk and lower returns than equity funds.', category: 'Fund Types', relatedTerms: ['equity-fund', 'hybrid-fund', 'gilt-fund'] },
  { term: 'Dividend Option', slug: 'dividend-option', definition: 'Now called IDCW (Income Distribution cum Capital Withdrawal) — a fund option where profits are distributed to investors periodically instead of being reinvested.', category: 'Fund Options', relatedTerms: ['growth-option', 'idcw', 'nav'] },
  { term: 'ELSS', slug: 'elss', definition: 'Equity Linked Savings Scheme — a type of equity mutual fund that qualifies for tax deduction under Section 80C (up to ₹1.5L/year). Has a mandatory 3-year lock-in period.', category: 'Fund Types', relatedTerms: ['section-80c', 'equity-fund', 'tax-saving'] },
  { term: 'Entry Load', slug: 'entry-load', definition: 'A fee charged when purchasing mutual fund units. SEBI abolished entry load in August 2009. No mutual fund in India charges entry load today.', category: 'Fees', relatedTerms: ['exit-load', 'expense-ratio', 'nav'] },
  { term: 'Equity Fund', slug: 'equity-fund', definition: 'A mutual fund that invests primarily (minimum 65%) in stocks/shares of companies. Categories include large cap, mid cap, small cap, flexi cap, and sector funds.', category: 'Fund Types', relatedTerms: ['debt-fund', 'hybrid-fund', 'large-cap'] },
  { term: 'Exit Load', slug: 'exit-load', definition: 'A fee charged when redeeming mutual fund units before a specified period (usually 1 year for equity funds). Typically 1% if redeemed within 12 months.', category: 'Fees', relatedTerms: ['entry-load', 'expense-ratio', 'redemption'] },
  { term: 'Expense Ratio', slug: 'expense-ratio', definition: 'The annual fee charged by a mutual fund for managing the fund, expressed as a percentage of AUM. Includes fund management fees, administrative costs, and distribution expenses.', category: 'Fees', relatedTerms: ['aum', 'exit-load', 'direct-plan'] },
  { term: 'FIFO', slug: 'fifo', definition: 'First In, First Out — the method used for calculating capital gains tax on mutual fund redemptions. Units purchased first are considered sold first.', category: 'Taxation', relatedTerms: ['ltcg', 'stcg', 'capital-gains'] },
  { term: 'Flexi Cap Fund', slug: 'flexi-cap', definition: 'A mutual fund that can invest across all market capitalizations (large, mid, small) without any fixed allocation mandate, giving the fund manager maximum flexibility.', category: 'Fund Types', relatedTerms: ['large-cap', 'mid-cap', 'multi-cap'] },
  { term: 'Folio Number', slug: 'folio-number', definition: 'A unique account number assigned to each mutual fund investor by the AMC. Used to identify and track all transactions and holdings.', category: 'Account', relatedTerms: ['amc', 'units', 'portfolio'] },
  { term: 'Growth Option', slug: 'growth-option', definition: 'A fund option where all profits are reinvested back into the fund, compounding the investment over time. Preferred for long-term wealth creation via SIP.', category: 'Fund Options', relatedTerms: ['dividend-option', 'compounding', 'nav'] },
  { term: 'Hybrid Fund', slug: 'hybrid-fund', definition: 'A mutual fund that invests in a mix of equity and debt instruments. Types include Aggressive Hybrid, Balanced Advantage, Conservative Hybrid, and Multi-Asset.', category: 'Fund Types', relatedTerms: ['balanced-fund', 'equity-fund', 'debt-fund'] },
  { term: 'Index Fund', slug: 'index-fund', definition: 'A mutual fund that replicates a specific market index (like Nifty 50). Passively managed with lower expense ratios than actively managed funds.', category: 'Fund Types', relatedTerms: ['nifty', 'etf', 'passive-investing'] },
  { term: 'Large Cap Fund', slug: 'large-cap', definition: 'A mutual fund that invests minimum 80% in the top 100 companies by market capitalization. Lower risk and moderate returns compared to mid/small cap.', category: 'Fund Types', relatedTerms: ['mid-cap', 'small-cap', 'flexi-cap'] },
  { term: 'LTCG', slug: 'ltcg', definition: 'Long Term Capital Gains — gains from selling equity funds held for more than 12 months. Taxed at 12.5% above ₹1.25 Lakh annual exemption.', category: 'Taxation', relatedTerms: ['stcg', 'capital-gains', 'fifo'] },
  { term: 'Lump Sum', slug: 'lump-sum', definition: 'A one-time investment of a large amount in a mutual fund, as opposed to SIP which invests small amounts regularly.', category: 'Investment', relatedTerms: ['sip', 'stp', 'nav'] },
  { term: 'Mid Cap Fund', slug: 'mid-cap', definition: 'A mutual fund investing minimum 65% in companies ranked 101st to 250th by market capitalization. Higher growth potential but more volatile than large cap.', category: 'Fund Types', relatedTerms: ['large-cap', 'small-cap', 'flexi-cap'] },
  { term: 'Mutual Fund', slug: 'mutual-fund', definition: 'A professionally managed investment vehicle that pools money from many investors to invest in securities like stocks, bonds, and other assets.', category: 'Fund Management', relatedTerms: ['amc', 'nav', 'sip'] },
  { term: 'NACH', slug: 'nach', definition: 'National Automated Clearing House — the payment system used for SIP auto-debit from bank accounts. Replaced the older ECS system.', category: 'Process', relatedTerms: ['sip', 'otm', 'auto-debit'] },
  { term: 'NAV', slug: 'nav', definition: 'Net Asset Value — the per-unit price of a mutual fund, calculated by dividing total net assets by the number of units outstanding. NAV changes daily based on market value of holdings.', category: 'Fund Management', relatedTerms: ['units', 'aum', 'redemption'] },
  { term: 'Nifty 50', slug: 'nifty', definition: 'India\'s benchmark stock market index comprising the top 50 companies listed on the National Stock Exchange (NSE), representing about 66% of free-float market capitalization.', category: 'Markets', relatedTerms: ['sensex', 'benchmark', 'index-fund'] },
  { term: 'OTM', slug: 'otm', definition: 'One Time Mandate — a bank authorization for SIP auto-debit. OTM allows the mutual fund to debit a specified maximum amount from your bank account periodically.', category: 'Process', relatedTerms: ['nach', 'sip', 'auto-debit'] },
  { term: 'Portfolio', slug: 'portfolio', definition: 'The collection of all your investments across different mutual funds, stocks, and other assets. Diversification across your portfolio reduces risk.', category: 'Investment', relatedTerms: ['asset-allocation', 'diversification', 'corpus'] },
  { term: 'Redemption', slug: 'redemption', definition: 'The process of selling (withdrawing) mutual fund units. Units are redeemed at the prevailing NAV, and proceeds are credited to your bank account.', category: 'Process', relatedTerms: ['nav', 'exit-load', 'capital-gains'] },
  { term: 'Rolling Returns', slug: 'rolling-return', definition: 'The annualized returns calculated for every possible period of a given duration. For example, 5-year rolling returns show every possible 5-year return from the fund\'s inception.', category: 'Performance', relatedTerms: ['cagr', 'xirr', 'benchmark'] },
  { term: 'Rupee Cost Averaging', slug: 'rupee-cost-averaging', definition: 'The investment principle behind SIP — investing a fixed amount regularly results in buying more units when prices are low and fewer when high, lowering the average cost per unit.', category: 'Strategy', relatedTerms: ['sip', 'nav', 'units'] },
  { term: 'SEBI', slug: 'sebi', definition: 'Securities and Exchange Board of India — the regulatory authority for the Indian securities market, including mutual funds. SEBI protects investor interests and regulates market participants.', category: 'Regulatory', relatedTerms: ['amfi', 'amc'] },
  { term: 'Sensex', slug: 'sensex', definition: 'S&P BSE Sensex — India\'s oldest stock market index comprising 30 leading companies listed on the Bombay Stock Exchange (BSE).', category: 'Markets', relatedTerms: ['nifty', 'benchmark', 'index-fund'] },
  { term: 'SIP', slug: 'sip', definition: 'Systematic Investment Plan — a method of investing a fixed amount at regular intervals (monthly) in a mutual fund. It enables disciplined investing and benefits from Rupee Cost Averaging.', category: 'Strategy', relatedTerms: ['rupee-cost-averaging', 'step-up-sip', 'nav'] },
  { term: 'Small Cap Fund', slug: 'small-cap', definition: 'A mutual fund investing minimum 65% in companies ranked 251st and below by market capitalization. Highest growth potential but highest volatility and risk.', category: 'Fund Types', relatedTerms: ['large-cap', 'mid-cap', 'flexi-cap'] },
  { term: 'STCG', slug: 'stcg', definition: 'Short Term Capital Gains — gains from selling equity funds held for 12 months or less. Taxed at 20% flat rate for equity funds.', category: 'Taxation', relatedTerms: ['ltcg', 'capital-gains', 'fifo'] },
  { term: 'Step-Up SIP', slug: 'step-up-sip', definition: 'A SIP variant where the monthly investment amount is automatically increased by a fixed percentage or amount at regular intervals (usually annually), mirroring income growth.', category: 'Strategy', relatedTerms: ['sip', 'top-up-sip', 'compounding'] },
  { term: 'STP', slug: 'stp', definition: 'Systematic Transfer Plan — transferring a fixed amount from one mutual fund to another at regular intervals. Used to stagger lump sum investments from debt to equity.', category: 'Strategy', relatedTerms: ['sip', 'swp', 'lump-sum'] },
  { term: 'SWP', slug: 'swp', definition: 'Systematic Withdrawal Plan — withdrawing a fixed amount from a mutual fund at regular intervals. Used during retirement for regular income generation.', category: 'Strategy', relatedTerms: ['sip', 'stp', 'retirement'] },
  { term: 'Units', slug: 'units', definition: 'The measurement of your holding in a mutual fund. When you invest, you receive units at the prevailing NAV. Total value = Number of units × Current NAV.', category: 'Fund Management', relatedTerms: ['nav', 'folio-number', 'redemption'] },
  { term: 'XIRR', slug: 'xirr', definition: 'Extended Internal Rate of Return — the most accurate method to calculate SIP returns as it accounts for the timing and amount of each cash flow (installment). Standard for SIP return calculation.', category: 'Performance', relatedTerms: ['cagr', 'rolling-return', 'absolute-return'] },
];

export function getGlossaryByLetter(): Record<string, GlossaryTerm[]> {
  const grouped: Record<string, GlossaryTerm[]> = {};
  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  sorted.forEach((term) => {
    const letter = term.term.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  });
  return grouped;
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return GLOSSARY.filter(
    (term) =>
      term.term.toLowerCase().includes(q) ||
      term.definition.toLowerCase().includes(q) ||
      term.category.toLowerCase().includes(q)
  );
}
