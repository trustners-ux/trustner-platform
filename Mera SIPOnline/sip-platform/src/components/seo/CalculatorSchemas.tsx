const BASE_URL = 'https://www.merasip.com';

const provider = {
  '@type': 'Organization' as const,
  name: 'Trustner Asset Services Pvt. Ltd.',
  url: BASE_URL,
};

const freeOffer = {
  '@type': 'Offer' as const,
  price: '0',
  priceCurrency: 'INR',
};

function buildCalculatorSchema(name: string, description: string, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${BASE_URL}/calculators/${slug}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: freeOffer,
    provider,
  };
}

export const calculatorSchemas: Record<string, object> = {
  sip: buildCalculatorSchema(
    'SIP Future Value Calculator',
    'Calculate how much your monthly SIP will grow over time with the power of compounding. See year-by-year breakdown and growth charts.',
    'sip',
  ),
  'step-up-sip': buildCalculatorSchema(
    'Step-Up SIP Calculator',
    'Model the impact of increasing your SIP amount annually. Compare regular SIP vs step-up SIP to see the wealth difference.',
    'step-up-sip',
  ),
  'goal-based': buildCalculatorSchema(
    'Goal-Based SIP Calculator',
    'Have a financial goal? Find out the exact monthly SIP you need. Get 3-scenario analysis with conservative, moderate, and aggressive projections.',
    'goal-based',
  ),
  'inflation-adjusted': buildCalculatorSchema(
    'Inflation-Adjusted SIP Calculator',
    'Understand the real value of your SIP after accounting for inflation. See how inflation erodes your purchasing power over time.',
    'inflation-adjusted',
  ),
  retirement: buildCalculatorSchema(
    'Retirement SIP Planner',
    'Plan your retirement corpus with precision. Calculate the monthly SIP needed based on your age, expenses, and inflation expectations.',
    'retirement',
  ),
  swp: buildCalculatorSchema(
    'SWP Calculator',
    'Plan systematic withdrawals from your corpus. See how long your money lasts with regular monthly withdrawals at expected returns.',
    'swp',
  ),
  'sip-vs-lumpsum': buildCalculatorSchema(
    'SIP vs Lumpsum Comparison',
    'Should you invest monthly or all at once? Compare both strategies side-by-side with detailed charts and year-wise breakdown.',
    'sip-vs-lumpsum',
  ),
  'duration-optimizer': buildCalculatorSchema(
    'SIP Duration Optimizer',
    'Find out exactly how long it takes to reach your target amount with a given monthly SIP. Optimize your investment timeline.',
    'duration-optimizer',
  ),
  'correction-impact': buildCalculatorSchema(
    'Market Correction Impact Simulator',
    'Simulate a market crash during your SIP tenure. See how corrections affect your portfolio and why SIP investors benefit from volatility.',
    'correction-impact',
  ),
  'life-stage': buildCalculatorSchema(
    'Life-Stage Planner',
    'Plan your financial journey through 3 life stages — Invest with SIP, let your corpus Grow, then Withdraw systematically. See how your wealth builds and sustains through each phase.',
    'life-stage',
  ),
  lifeline: buildCalculatorSchema(
    'Lifeline Financial Planner',
    'Plan your complete financial lifeline like a CFP. Add SIPs, lump sum investments, SWP withdrawals, and one-time withdrawals at any year of your planning horizon.',
    'lifeline',
  ),
  'daily-sip': buildCalculatorSchema(
    'Daily SIP Calculator',
    'Calculate returns on daily investments - choose between calendar days (30/month) or working days (Mon-Fri, 22/month). Perfect for micro-investing and business SIPs.',
    'daily-sip',
  ),
  'bucket-strategy': buildCalculatorSchema(
    'Retirement Bucket Strategy Calculator',
    'Plan your retirement income using the 5-bucket strategy. Allocate your corpus across emergency, short-term, medium-term, growth, and equity buckets for maximum safety and returns. Free CFP-grade calculator.',
    'bucket-strategy',
  ),
  'sip-shield': buildCalculatorSchema(
    'SIP Shield Calculator',
    "India's first SIP Shield calculator. See how a systematic SIP investment can build corpus to pay your term plan premiums, loan EMIs, and insurance costs — so you never pay from pocket again.",
    'sip-shield',
  ),
  lumpsum: buildCalculatorSchema(
    'Lumpsum Investment Planner',
    'Plan lump sum investments and withdrawals over time. Visualize corpus growth with multiple cash flow events and see how your wealth evolves year by year.',
    'lumpsum',
  ),
  emi: buildCalculatorSchema(
    'EMI Calculator',
    'Free online EMI calculator for home loan, car loan, and personal loan. Get monthly EMI, total interest, amortization schedule with interactive charts.',
    'emi',
  ),
  fire: buildCalculatorSchema(
    'FIRE Calculator',
    'Calculate your FIRE number, years to financial independence, and safe withdrawal rate. Plan your early retirement with detailed projections and charts.',
    'fire',
  ),
  'delay-cost': buildCalculatorSchema(
    'Cost of Delay Calculator',
    'See the real cost of delaying your investments by 1, 3, 5, or 10 years. Visualize how procrastination destroys wealth with powerful compound interest charts.',
    'delay-cost',
  ),
  'emergency-fund': buildCalculatorSchema(
    'Emergency Fund Calculator',
    'Calculate your ideal emergency fund based on monthly expenses, dependents, job stability, and income type. Get personalized 3-12 month recommendations with savings plan.',
    'emergency-fund',
  ),
  'net-worth': buildCalculatorSchema(
    'Net Worth Calculator',
    'Calculate your net worth by adding assets and liabilities. Get liquid net worth, debt-to-asset ratio, and wealth score with interactive charts.',
    'net-worth',
  ),
  'income-tax': buildCalculatorSchema(
    'Income Tax Calculator',
    'Compare income tax under Old and New regimes. Calculate tax, deductions, and find which regime saves you more. Updated for FY 2026-27 tax slabs.',
    'income-tax',
  ),
  'capital-gains-tax': buildCalculatorSchema(
    'Capital Gains Tax Calculator',
    'Calculate capital gains tax on stocks, mutual funds, property, and gold. Know STCG vs LTCG classification, tax rates, and indexation benefits.',
    'capital-gains-tax',
  ),
  'tax-saving': buildCalculatorSchema(
    'Tax Saving Calculator',
    'Plan your tax-saving investments under Section 80C, 80D, and 80CCD. Track utilization, find remaining limits, and maximize your deductions.',
    'tax-saving',
  ),
  'health-insurance': buildCalculatorSchema(
    'Health Insurance Calculator',
    'Calculate adequate health insurance coverage based on your city tier, family size, age, hospital preference, and medical inflation. Find the right health cover for your family in India.',
    'health-insurance',
  ),
  'term-insurance': buildCalculatorSchema(
    'Term Insurance Calculator',
    'Calculate your ideal term insurance sum assured based on family expenses, loans, education needs, and existing coverage. Free needs-based term plan calculator for India.',
    'term-insurance',
  ),
  'human-life-value': buildCalculatorSchema(
    'Human Life Value Calculator',
    'Calculate your Human Life Value (HLV) based on income, expenses, liabilities, and future goals. Find out exactly how much life insurance coverage you need to protect your family.',
    'human-life-value',
  ),
  'rent-vs-buy': buildCalculatorSchema(
    'Rent vs Buy Calculator',
    'Compare the total cost of renting vs buying a house over your time horizon. Find the break-even year, factor in appreciation, rent increases, and opportunity cost.',
    'rent-vs-buy',
  ),
  'home-affordability': buildCalculatorSchema(
    'Home Loan Affordability Calculator',
    'Calculate the maximum property price you can afford based on your income, existing EMIs, and loan terms. Get comfortable, manageable, and stretch recommendations.',
    'home-affordability',
  ),
  'loan-prepayment': buildCalculatorSchema(
    'Loan Prepayment Calculator',
    'Calculate how much interest you save and how many years you cut by prepaying your loan. Compare with and without prepayment scenarios.',
    'loan-prepayment',
  ),
  'fd-vs-loan': buildCalculatorSchema(
    'Break FD vs Take Loan Calculator',
    'Should you break your fixed deposit or take a loan? Compare the net cost of breaking an FD (with penalty and tax) vs taking a personal or gold loan.',
    'fd-vs-loan',
  ),
  'car-loan-vs-cash': buildCalculatorSchema(
    'Car Loan vs Paying Cash Calculator',
    'Should you take a car loan or pay cash? Compare the total cost of financing vs the opportunity cost of paying upfront. Data-driven verdict.',
    'car-loan-vs-cash',
  ),
  'lifestyle-inflation': buildCalculatorSchema(
    'Lifestyle Inflation Calculator',
    'See how lifestyle inflation silently erodes your savings rate over time. Model income growth vs expense growth and find the year your savings hit zero.',
    'lifestyle-inflation',
  ),
  'term-plan-sip': buildCalculatorSchema(
    'Term Plan Regular Pay + SIP vs Limited Pay Calculator',
    'Unique calculator proving Regular Pay Term Plan + SIP beats Limited Pay. See how premium savings invested in SIP can fund future premiums and create a bonus corpus at maturity.',
    'term-plan-sip',
  ),
};
