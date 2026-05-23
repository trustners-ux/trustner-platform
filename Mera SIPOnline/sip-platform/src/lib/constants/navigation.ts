export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  icon?: string;
  badge?: string;
}

export const NAVIGATION: NavItem[] = [
  {
    label: 'Learn',
    href: '/learn',
    children: [
      // ─── Top-level: 7 product-track foundation pages (NEW) ───
      { label: 'Mutual Funds Track', href: '/learn/track/mutual-funds' },
      { label: 'SIF Track', href: '/learn/track/sif', badge: 'New' },
      { label: 'PMS Track', href: '/learn/track/pms', badge: 'New' },
      { label: 'AIF Track', href: '/learn/track/aif', badge: 'New' },
      { label: 'GIFT City Track', href: '/learn/track/gift-city', badge: 'New' },
      { label: 'International Funds Track', href: '/learn/track/international', badge: 'New' },
      { label: 'Insurance Track', href: '/learn/track/insurance', badge: 'New' },
      // ─── Mutual Funds curriculum modules (existing) ───
      {
        label: 'Investment Landscape',
        href: '/learn/investment-landscape',
        children: [
          { label: 'Why People Invest', href: '/learn/investment-landscape/why-people-invest' },
          { label: 'Savings vs Investment', href: '/learn/investment-landscape/savings-vs-investment' },
          { label: 'Asset Classes Explained', href: '/learn/investment-landscape/asset-classes-explained' },
          { label: 'Power of Compounding', href: '/learn/investment-landscape/power-of-compounding' },
          { label: 'Inflation — The Destroyer', href: '/learn/investment-landscape/inflation-the-destroyer' },
          { label: 'Asset Allocation', href: '/learn/investment-landscape/asset-allocation' },
        ],
      },
      {
        label: 'What is a Mutual Fund?',
        href: '/learn/what-is-mutual-fund',
        children: [
          { label: 'Concept of a Mutual Fund', href: '/learn/what-is-mutual-fund/what-is-mutual-fund' },
          { label: 'How Mutual Funds Work', href: '/learn/what-is-mutual-fund/how-mutual-funds-work' },
          { label: 'MF Industry in India', href: '/learn/what-is-mutual-fund/mf-industry-india' },
          { label: 'Advantages of Mutual Funds', href: '/learn/what-is-mutual-fund/advantages-of-mf' },
          { label: 'MF Misconceptions', href: '/learn/what-is-mutual-fund/mf-misconceptions' },
        ],
      },
      {
        label: 'SIP Mastery',
        href: '/learn/sip-mastery',
        children: [
          { label: 'What is SIP & How It Works', href: '/learn/sip-mastery/what-is-sip' },
          { label: 'SIP vs Lump Sum', href: '/learn/sip-mastery/sip-vs-lumpsum' },
          { label: 'Rupee Cost Averaging', href: '/learn/sip-mastery/rupee-cost-averaging' },
          { label: 'Step-Up & Trigger SIP', href: '/learn/sip-mastery/step-up-trigger-sip' },
          { label: 'SIP Taxation', href: '/learn/sip-mastery/sip-taxation' },
          { label: 'Goal-Based SIP Planning', href: '/learn/sip-mastery/goal-based-sip' },
        ],
      },
      {
        label: 'Scheme Types',
        href: '/learn/scheme-types',
        children: [
          { label: 'SEBI 36 Categories', href: '/learn/scheme-types/sebi-categorization' },
          { label: 'Equity Funds', href: '/learn/scheme-types/equity-large-mid-small' },
          { label: 'Debt Funds', href: '/learn/scheme-types/debt-short-duration' },
          { label: 'Hybrid Funds', href: '/learn/scheme-types/hybrid-funds' },
          { label: 'Index Funds & ETFs', href: '/learn/scheme-types/index-etf-passive' },
        ],
      },
      {
        label: 'Fund Structure',
        href: '/learn/fund-structure',
        children: [
          { label: 'Sponsor, Trustee, AMC', href: '/learn/fund-structure/three-tier-structure' },
          { label: 'Custodian, RTA & Auditor', href: '/learn/fund-structure/custodian-rta-auditor' },
          { label: 'SEBI — The Regulator', href: '/learn/fund-structure/sebi-regulator' },
          { label: 'AMFI & ARN', href: '/learn/fund-structure/amfi-role' },
        ],
      },
      {
        label: 'Legal & Regulatory',
        href: '/learn/legal-regulatory',
        children: [
          { label: 'SEBI Regulations Overview', href: '/learn/legal-regulatory/sebi-regulations-overview' },
          { label: 'SID, SAI & KIM', href: '/learn/legal-regulatory/offer-document-sid-sai' },
          { label: 'Investor Rights', href: '/learn/legal-regulatory/investor-rights' },
          { label: 'Distributor Dos & Don\'ts', href: '/learn/legal-regulatory/distributor-dos-donts' },
        ],
      },
      {
        label: 'NAV & Expenses',
        href: '/learn/nav-expenses-pricing',
        children: [
          { label: 'What is NAV?', href: '/learn/nav-expenses-pricing/what-is-nav' },
          { label: 'Total Expense Ratio', href: '/learn/nav-expenses-pricing/total-expense-ratio' },
          { label: 'Entry & Exit Load', href: '/learn/nav-expenses-pricing/entry-exit-load' },
          { label: 'Cut-off Timing', href: '/learn/nav-expenses-pricing/cut-off-timing' },
        ],
      },
      {
        label: 'Taxation',
        href: '/learn/taxation',
        children: [
          { label: 'Equity vs Debt Tax', href: '/learn/taxation/equity-vs-debt-tax' },
          { label: 'STCG Rules', href: '/learn/taxation/stcg-rules' },
          { label: 'LTCG Rules', href: '/learn/taxation/ltcg-rules' },
          { label: 'ELSS & Section 80C', href: '/learn/taxation/elss-80c' },
        ],
      },
      {
        label: 'Distribution & Your Role',
        href: '/learn/distribution-role',
        children: [
          { label: 'Who is a Distributor?', href: '/learn/distribution-role/who-is-distributor' },
          { label: 'ARN & EUIN Registration', href: '/learn/distribution-role/becoming-distributor' },
          { label: 'Trail Commission Model', href: '/learn/distribution-role/revenue-model' },
          { label: 'Direct vs Regular Plan', href: '/learn/distribution-role/direct-vs-regular' },
        ],
      },
      {
        label: 'Investor Services',
        href: '/learn/investor-services',
        children: [
          { label: 'KYC Requirements', href: '/learn/investor-services/kyc-requirements' },
          { label: 'Transaction Types', href: '/learn/investor-services/transaction-types' },
          { label: 'SIP/STP/SWP Setup', href: '/learn/investor-services/systematic-transactions' },
          { label: 'Investor Grievance', href: '/learn/investor-services/investor-grievance' },
        ],
      },
      {
        label: 'Risk & Performance',
        href: '/learn/risk-return-performance',
        badge: 'Advanced',
        children: [
          { label: 'CAGR, XIRR, Rolling Returns', href: '/learn/risk-return-performance/measuring-returns' },
          { label: 'Sharpe Ratio & Beta', href: '/learn/risk-return-performance/risk-measures' },
          { label: 'Reading Factsheets', href: '/learn/risk-return-performance/reading-factsheets' },
          { label: 'Portfolio Analysis', href: '/learn/risk-return-performance/portfolio-analysis' },
        ],
      },
      {
        label: 'Scheme Selection',
        href: '/learn/scheme-selection-planning',
        badge: 'Advanced',
        children: [
          { label: 'Client Risk Profiling', href: '/learn/scheme-selection-planning/know-your-client' },
          { label: 'Model Portfolios', href: '/learn/scheme-selection-planning/model-portfolios' },
          { label: 'Financial Planning', href: '/learn/scheme-selection-planning/financial-planning-approach' },
          { label: 'Common Mistakes', href: '/learn/scheme-selection-planning/common-mistakes' },
        ],
      },
    ],
  },
  {
    label: 'Research',
    href: '/research',
    children: [
      { label: 'Historical SIP Returns', href: '/research/historical-returns' },
      { label: 'SIP in Bull vs Bear Markets', href: '/research/bull-vs-bear' },
      { label: 'Rolling Returns Study', href: '/research/rolling-returns' },
      { label: 'XIRR Explained', href: '/research/xirr-explained' },
      { label: 'SIP Case Studies', href: '/research/case-studies' },
      { label: 'Market Volatility Simulator', href: '/research/volatility-simulator', badge: 'New' },
    ],
  },
  {
    label: 'Calculators',
    href: '/calculators',
    children: [
      {
        label: 'Wealth & SIP',
        href: '/calculators#wealth',
        children: [
          { label: 'SIP Calculator', href: '/calculators/sip' },
          { label: 'Step-Up SIP', href: '/calculators/step-up-sip' },
          { label: 'Goal-Based SIP', href: '/calculators/goal-based' },
          { label: 'Daily SIP', href: '/calculators/daily-sip' },
          { label: 'SIP vs Lumpsum', href: '/calculators/sip-vs-lumpsum' },
          { label: 'Lumpsum Planner', href: '/calculators/lumpsum' },
          { label: 'Inflation Adjusted', href: '/calculators/inflation-adjusted' },
          { label: 'Cost of Delay', href: '/calculators/delay-cost' },
          { label: 'Duration Optimizer', href: '/calculators/duration-optimizer' },
          { label: 'Correction Impact', href: '/calculators/correction-impact' },
          { label: 'Life Stage Planner', href: '/calculators/life-stage' },
          { label: 'Retirement Planner', href: '/calculators/retirement' },
          { label: 'FIRE Calculator', href: '/calculators/fire' },
          { label: 'Lifeline Planner', href: '/calculators/lifeline' },
          { label: 'SWP Calculator', href: '/calculators/swp' },
          { label: 'Bucket Strategy', href: '/calculators/bucket-strategy' },
          { label: 'SIP Shield', href: '/calculators/sip-shield', badge: 'Trustner' },
          { label: 'PSU Retirement Benefits', href: '/calculators/psu-benefits', badge: 'New' },
        ],
      },
      {
        label: 'Family Goals',
        href: '/calculators#family',
        children: [
          { label: 'Child Education Planner', href: '/calculators/child-education', badge: 'New' },
          { label: 'Marriage Planner', href: '/calculators/marriage-planner', badge: 'New' },
          { label: 'Sukanya Samriddhi (SSY)', href: '/calculators/ssy-planner', badge: 'New' },
        ],
      },
      {
        label: 'Retirement & Post-Retirement',
        href: '/calculators#retirement-post',
        children: [
          { label: 'Senior Citizen Income', href: '/calculators/senior-income', badge: 'New' },
          { label: 'Reverse Mortgage', href: '/calculators/reverse-mortgage', badge: 'New' },
          { label: 'Safe Withdrawal Rate', href: '/calculators/safe-withdrawal-rate', badge: 'New' },
          { label: 'Annuity Decoder', href: '/calculators/annuity', badge: 'New' },
        ],
      },
      {
        label: 'Insurance',
        href: '/calculators#insurance',
        children: [
          { label: 'Human Life Value', href: '/calculators/human-life-value' },
          { label: 'Term Insurance', href: '/calculators/term-insurance' },
          { label: 'Health Insurance', href: '/calculators/health-insurance' },
          { label: 'Term Plan + SIP', href: '/calculators/term-plan-sip', badge: 'Exclusive' },
          { label: 'Insurance IRR/XIRR', href: '/calculators/insurance-irr', badge: 'Trustner' },
          { label: 'Surrender vs Continue', href: '/calculators/surrender-vs-continue', badge: 'New' },
          { label: 'MF vs ULIP (20-Year)', href: '/calculators/mf-vs-ulip', badge: 'New' },
          { label: 'ULIP IRR Analyzer', href: '/calculators/ulip-irr', badge: 'New' },
          { label: 'Critical Illness Cover', href: '/calculators/critical-illness', badge: 'New' },
        ],
      },
      {
        label: 'Tax',
        href: '/calculators#tax',
        children: [
          { label: 'Income Tax Calculator', href: '/calculators/income-tax' },
          { label: 'Capital Gains Tax', href: '/calculators/capital-gains-tax' },
          { label: 'Tax Saving 80C/80D', href: '/calculators/tax-saving' },
          { label: 'PPF vs ELSS vs NPS', href: '/calculators/ppf-vs-elss-vs-nps', badge: 'New' },
          { label: 'Home Loan Tax Shield', href: '/calculators/home-loan-tax-shield', badge: 'New' },
          { label: 'Advance Tax', href: '/calculators/advance-tax', badge: 'New' },
        ],
      },
      {
        label: 'Loan',
        href: '/calculators#loan',
        children: [
          { label: 'EMI Calculator', href: '/calculators/emi' },
          { label: 'Loan Prepayment', href: '/calculators/loan-prepayment' },
          { label: 'Car Loan vs Cash', href: '/calculators/car-loan-vs-cash' },
          { label: 'Home Affordability', href: '/calculators/home-affordability' },
        ],
      },
      {
        label: 'Life Decisions',
        href: '/calculators#life-decision',
        children: [
          { label: 'Emergency Fund', href: '/calculators/emergency-fund' },
          { label: 'Net Worth Tracker', href: '/calculators/net-worth' },
          { label: 'Rent vs Buy', href: '/calculators/rent-vs-buy' },
          { label: 'FD vs Loan', href: '/calculators/fd-vs-loan' },
          { label: 'Lifestyle Inflation', href: '/calculators/lifestyle-inflation' },
          { label: 'Real Estate Return', href: '/calculators/real-estate-return', badge: 'New' },
          { label: 'Asset Allocation Rebalancer', href: '/calculators/asset-rebalancer', badge: 'New' },
        ],
      },
      {
        label: 'NRI & Global',
        href: '/calculators#nri',
        children: [
          { label: 'NRE vs NRO vs FCNR', href: '/calculators/nre-nro-fcnr', badge: 'New' },
        ],
      },
    ],
  },
  {
    label: 'Funds',
    href: '/funds',
    children: [
      { label: 'Fund Explorer', href: '/funds' },
      { label: 'Trustner Fund Selection', href: '/funds/selection' },
      { label: 'Compare Funds', href: '/funds/compare' },
      { label: 'Model Portfolio Builder', href: '/funds/portfolio-builder', badge: 'New' },
    ],
  },
  {
    label: 'Financial Planning',
    href: '/financial-planning',
  },
  // NOTE: The "For MFDs" section (/mfd and sub-routes) is intentionally NOT exposed
  // in the top nav. MFD business tools (trail commission, AUM projections, sub-broker
  // scale, GST, valuation, LTV, cost ratio, churn, NFO tracker) are accessible only
  // via direct URL (merasip.com/mfd) so clients never see internal compensation math.
  // Do NOT add a nav entry here without explicit instruction from Ram.
  {
    label: 'Life Plans',
    href: '/life-plans',
    children: [
      {
        label: 'Salaried Professionals',
        href: '/life-plans#salaried',
        children: [
          { label: 'Doctors & Healthcare', href: '/life-plans/doctors-healthcare' },
          { label: 'IT & Software Engineers', href: '/life-plans/it-engineers' },
          { label: 'Defence Personnel', href: '/life-plans/defense-personnel' },
          { label: 'Government Employees', href: '/life-plans/government-employees' },
          { label: 'Lawyers & Legal', href: '/life-plans/lawyers-legal' },
          { label: 'Teachers & Educators', href: '/life-plans/teachers-educators' },
        ],
      },
      {
        label: 'Business & Entrepreneurs',
        href: '/life-plans#business',
        children: [
          { label: 'Small Business Owners', href: '/life-plans/small-business-owners' },
          { label: 'Startup Founders', href: '/life-plans/startup-founders' },
          { label: 'Freelancers & Gig Workers', href: '/life-plans/freelancers-gig-workers' },
        ],
      },
      {
        label: 'Life Stage',
        href: '/life-plans#life-stage',
        children: [
          { label: 'Homemakers', href: '/life-plans/homemakers' },
          { label: 'Students & Fresh Graduates', href: '/life-plans/students-fresh-graduates' },
          { label: 'Newly Married Couples', href: '/life-plans/newly-married-couples' },
          { label: 'Senior Citizens & Retirees', href: '/life-plans/senior-citizens-retirees' },
        ],
      },
      {
        label: 'Special Segments',
        href: '/life-plans#special',
        children: [
          { label: 'NRIs', href: '/life-plans/nri-financial-planning' },
          { label: 'Women Professionals', href: '/life-plans/women-professionals' },
        ],
      },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    children: [
      { label: 'Learning Academy', href: '/learn' },
      { label: 'SIP Glossary', href: '/glossary' },
      { label: 'Taxation Guide', href: '/resources/taxation', badge: 'New' },
      { label: 'NRI Taxation', href: '/resources/taxation/nri', badge: 'New' },
      { label: 'Blog', href: '/blog' },
      { label: 'Market Pulse', href: '/market-pulse' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
];

export const FOOTER_LINKS = {
  'Learning Academy': [
    { label: 'Investment Landscape', href: '/learn/investment-landscape' },
    { label: 'What is a Mutual Fund?', href: '/learn/what-is-mutual-fund' },
    { label: 'SIP Mastery', href: '/learn/sip-mastery' },
    { label: 'Scheme Types', href: '/learn/scheme-types' },
    { label: 'NAV & Expenses', href: '/learn/nav-expenses-pricing' },
    { label: 'Taxation', href: '/learn/taxation' },
    { label: 'Risk & Performance', href: '/learn/risk-return-performance' },
    { label: 'Scheme Selection', href: '/learn/scheme-selection-planning' },
    { label: 'All 12 Modules', href: '/learn' },
    { label: 'SIP Glossary', href: '/glossary' },
  ],
  Calculators: [
    { label: 'SIP Calculator', href: '/calculators/sip' },
    { label: 'FIRE Calculator', href: '/calculators/fire' },
    { label: 'EMI Calculator', href: '/calculators/emi' },
    { label: 'Income Tax Calculator', href: '/calculators/income-tax' },
    { label: 'Retirement Planner', href: '/calculators/retirement' },
    { label: 'Bucket Strategy', href: '/calculators/bucket-strategy' },
    { label: 'SIP Shield', href: '/calculators/sip-shield' },
    { label: 'Net Worth Tracker', href: '/calculators/net-worth' },
    { label: 'Rent vs Buy', href: '/calculators/rent-vs-buy' },
    { label: 'Emergency Fund', href: '/calculators/emergency-fund' },
    { label: 'Term Insurance', href: '/calculators/term-insurance' },
    { label: 'All 33+ Calculators', href: '/calculators' },
  ],
  Research: [
    { label: 'Historical Returns', href: '/research/historical-returns' },
    { label: 'Bull vs Bear Markets', href: '/research/bull-vs-bear' },
    { label: 'Rolling Returns', href: '/research/rolling-returns' },
    { label: 'Case Studies', href: '/research/case-studies' },
    { label: 'Volatility Simulator', href: '/research/volatility-simulator' },
  ],
  'Life Plans': [
    { label: 'Doctors & Healthcare', href: '/life-plans/doctors-healthcare' },
    { label: 'IT & Software Engineers', href: '/life-plans/it-engineers' },
    { label: 'Defense Personnel', href: '/life-plans/defense-personnel' },
    { label: 'Government Employees', href: '/life-plans/government-employees' },
    { label: 'Small Business Owners', href: '/life-plans/small-business-owners' },
    { label: 'Homemakers', href: '/life-plans/homemakers' },
    { label: 'Newly Married Couples', href: '/life-plans/newly-married-couples' },
    { label: 'NRIs', href: '/life-plans/nri-financial-planning' },
    { label: 'Women Professionals', href: '/life-plans/women-professionals' },
    { label: 'All 15 Life Plans', href: '/life-plans' },
  ],
  Explore: [
    { label: 'Financial Health Assessment', href: '/financial-planning' },
    { label: 'Fund Explorer', href: '/funds' },
    { label: 'Trustner Fund Selection', href: '/funds/selection' },
    { label: 'Compare Funds', href: '/funds/compare' },
    { label: 'MF Taxation Guide', href: '/resources/taxation' },
    { label: 'NRI Taxation Guide', href: '/resources/taxation/nri' },
    { label: 'Blog', href: '/blog' },
    { label: 'Market Pulse', href: '/market-pulse' },
    { label: 'Gallery', href: '/gallery' },
  ],
  Company: [
    { label: 'About Trustner', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Risk Disclosure', href: '/risk-disclosure' },
    { label: 'Grievance Redressal', href: '/grievance-redressal' },
    { label: 'Commission Disclosure', href: '/commission-disclosure' },
  ],
};
