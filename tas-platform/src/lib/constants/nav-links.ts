export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  badge?: string;
}

export const NAV_LINKS: NavItem[] = [
  {
    label: "Mutual Funds",
    href: "/mutual-funds",
    children: [
      { label: "Explore All Funds", href: "/mutual-funds" },
      { label: "Equity Funds", href: "/mutual-funds?category=equity" },
      { label: "Debt Funds", href: "/mutual-funds?category=debt" },
      { label: "Hybrid Funds", href: "/mutual-funds?category=hybrid" },
      { label: "ELSS (Tax Saver)", href: "/mutual-funds?category=elss" },
      { label: "Index Funds & ETFs", href: "/mutual-funds?category=index" },
      { label: "Compare Funds", href: "/mutual-funds/compare" },
    ],
  },
  {
    label: "Insurance",
    href: "/insurance",
    children: [
      { label: "Health Insurance", href: "/insurance/health" },
      { label: "Life Insurance", href: "/insurance/life" },
      { label: "Motor Insurance", href: "/insurance/motor" },
      { label: "Travel Insurance", href: "/insurance/travel" },
    ],
  },
  {
    label: "Investments",
    href: "/investments",
    children: [
      { label: "National Pension System (NPS)", href: "/investments/nps" },
      { label: "Sovereign Gold Bonds", href: "/investments/sgb" },
      { label: "Digital Gold", href: "/investments/digital-gold" },
      { label: "PPF", href: "/investments/ppf" },
      { label: "Fixed Deposits", href: "/investments/fixed-deposits" },
      { label: "GIFT City Funds", href: "/gift-city", badge: "Coming Soon" },
    ],
  },
  {
    label: "Calculators",
    href: "/calculators",
    children: [
      { label: "SIP Calculator", href: "/calculators/sip" },
      { label: "Lumpsum Calculator", href: "/calculators/lumpsum" },
      { label: "SWP Calculator", href: "/calculators/swp" },
      { label: "STP Calculator", href: "/calculators/stp" },
      { label: "Tax Calculator", href: "/calculators/tax" },
    ],
  },
  {
    label: "Blog",
    href: "/blog",
  },
];

export const FOOTER_LINKS = {
  mutualFunds: [
    { label: "Explore Funds", href: "/mutual-funds" },
    { label: "SIP Investment", href: "/calculators/sip" },
    { label: "ELSS Tax Saving", href: "/mutual-funds?category=elss" },
    { label: "Compare Funds", href: "/mutual-funds/compare" },
    { label: "Top Performing Funds", href: "/mutual-funds?sort=returns" },
  ],
  insurance: [
    { label: "Health Insurance", href: "/insurance/health" },
    { label: "Life Insurance", href: "/insurance/life" },
    { label: "Motor Insurance", href: "/insurance/motor" },
    { label: "Travel Insurance", href: "/insurance/travel" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/about#careers" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Investor Charter", href: "https://www.amfiindia.com/investor-corner/investor-charter" },
  ],
} as const;
