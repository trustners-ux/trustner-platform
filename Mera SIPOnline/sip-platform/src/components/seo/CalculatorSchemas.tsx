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
};
