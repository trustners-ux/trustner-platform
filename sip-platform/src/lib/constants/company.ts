export const COMPANY = {
  brand: 'Trustner',
  platform: 'Mera SIP Online',
  tagline: 'India\'s Most Intelligent SIP Learning & Research Hub',
  description:
    'Master the art of Systematic Investment Planning. Research-grade education, smart calculators, and data-driven insights to build long-term wealth.',

  group: {
    name: 'Trustner Group',
    tagline: 'Fintech-enabled financial services organization',
    founded: 2014,
    hq: 'Guwahati, Assam',
    teamSize: '100+',
  },

  offices: [
    { type: 'Registered & Head Office', city: 'Guwahati', state: 'Assam' },
    { type: 'Branch Office', city: 'Tezpur', state: 'Assam' },
    { type: 'Corporate Office', city: 'Bangalore', state: 'Karnataka' },
    { type: 'Regional Office', city: 'Kolkata', state: 'West Bengal' },
    { type: 'Branch', city: 'Hyderabad', state: 'Telangana' },
  ],

  mfEntity: {
    name: 'Trustner Asset Services Pvt. Ltd.',
    shortName: 'Trustner Asset Services',
    amfiArn: 'ARN-286886',
    euin: 'E092119',
    type: 'AMFI Registered Mutual Fund Distributor and SIF Distributor',
    typeExtended: 'AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor',
    cin: 'U66301AS2023PTC025505',
  },

  insuranceEntity: {
    name: 'Trustner Insurance Brokers Pvt. Ltd.',
    shortName: 'Trustner Insurance Brokers',
    irdaiLicense: '1067',
    type: 'IRDAI Licensed Direct Insurance Broker',
    services: 'Life, Health & General Insurance',
  },

  contact: {
    phone: '+91-6003903737',
    phoneDisplay: '6003903737',
    email: 'wecare@trustner.in',
    supportEmail: 'wecare@trustner.in',
    grievanceEmail: 'grievance@trustner.in',
    careersEmail: 'career@trustner.in',
    whatsapp: '+916003903737',
    whatsappDisplay: '6003903737',
    workingHours: 'Mon - Sat: 9:00 AM - 7:00 PM IST',
  },

  address: {
    line1: 'Sethi Trust Building, Unit 2, 4th Floor',
    line2: 'G S Road, Bhangagarh',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781005',
    country: 'India',
    full: 'Sethi Trust Building, Unit 2, 4th Floor, G S Road, Bhangagarh, Guwahati - 781005, Assam',
  },

  social: {
    linkedin: 'https://www.linkedin.com/company/trustner',
    instagram: 'https://www.instagram.com/trustner',
    twitter: 'https://twitter.com/trustner',
    youtube: 'https://www.youtube.com/@trustner',
    facebook: 'https://www.facebook.com/trustner',
  },

  stats: {
    modules: '50+',
    calculators: '12',
    topics: '200+',
    clients: '10,000+',
  },

  urls: {
    mainSite: 'https://www.merasip.com',
    sipPlatform: 'https://www.merasip.com',
  },
} as const;

export const DISCLAIMER = {
  mutual_fund:
    'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance does not guarantee future returns.',
  general:
    'The information provided on this platform is for educational purposes only and should not be considered as financial advice. Please consult a qualified financial professional before making investment decisions.',
  amfi: `AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor | ARN-286886`,
  irdai: `Insurance is the subject matter of solicitation. IRDAI does not involve itself in any approval or disapproval of the insurance products. Visitors are hereby informed that their information submitted on the website may be shared with insurers. | ${COMPANY.insuranceEntity.name} | IRDAI License No. ${COMPANY.insuranceEntity.irdaiLicense} | ${COMPANY.insuranceEntity.type} | Category: ${COMPANY.insuranceEntity.services}`,
  calculator:
    'Calculator results are for illustration purposes only. Actual returns may vary based on market conditions, fund performance, and other factors.',
  sebi_investor:
    'Investors are advised to deal only with SEBI Registered Mutual Fund Distributors. Please verify the registration status at www.amfiindia.com.',
  kyc:
    'KYC is one-time exercise while dealing in securities markets — once KYC is done through a SEBI registered intermediary (broker, DP, mutual fund), you need not undergo the same process again when you approach another intermediary.',
  grievance:
    'For investor grievances, please contact SEBI at https://scores.gov.in or toll-free number 1800-22-7575.',
  risk_factors:
    'The NAV of the schemes may go up or down depending upon the factors and forces affecting the securities market including the fluctuations in the interest rates. The past performance of the mutual funds is not necessarily indicative of future performance of the schemes.',
  no_guarantee:
    'There is no assurance or guarantee that the objectives of the scheme will be achieved. The portfolio of the schemes is subject to changes within the provisions of the Offer Document of the respective schemes.',
  complete: `Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance does not guarantee future returns. | ${COMPANY.mfEntity.name} | ${COMPANY.mfEntity.amfiArn} | CIN: ${COMPANY.mfEntity.cin} | AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor`,
} as const;

/**
 * AMC Partner list — covers ~40 of the ~44 active AMCs in India (AMFI member list as of 2026).
 *
 * `logo` — optional path under /public/amcs/. When present, the component renders this image.
 * When absent (or image fails to load), the branded initial-circle fallback is shown.
 * To add a real logo: drop a square PNG/SVG (64×64 min) into public/amcs/ and set the path here.
 */
export const AMC_PARTNERS = [
  // Top 10 — largest by AUM
  { name: 'SBI Mutual Fund', shortName: 'SBI MF', initials: 'SBI', url: 'https://www.sbimf.com', color: '#00529B', logo: '/amcs/sbi.png' },
  { name: 'HDFC Mutual Fund', shortName: 'HDFC MF', initials: 'HDFC', url: 'https://www.hdfcfund.com', color: '#004C8F', logo: '/amcs/hdfc.svg' },
  { name: 'ICICI Prudential Mutual Fund', shortName: 'ICICI Pru MF', initials: 'ICICI', url: 'https://www.icicipruamc.com', color: '#F37B20', logo: '/amcs/icici-pru.jpg' },
  { name: 'Nippon India Mutual Fund', shortName: 'Nippon India MF', initials: 'NI', url: 'https://mf.nipponindiaim.com', color: '#E60012', logo: '/amcs/nippon-india.webp' },
  { name: 'Kotak Mutual Fund', shortName: 'Kotak MF', initials: 'KMF', url: 'https://www.kotakmf.com', color: '#ED1C24' },
  { name: 'Aditya Birla Sun Life Mutual Fund', shortName: 'ABSL MF', initials: 'ABSL', url: 'https://mutualfund.adityabirlacapital.com', color: '#ED1C24', logo: '/amcs/absl.webp' },
  { name: 'Axis Mutual Fund', shortName: 'Axis MF', initials: 'AXIS', url: 'https://www.axismf.com', color: '#97144D', logo: '/amcs/axis.svg' },
  { name: 'UTI Mutual Fund', shortName: 'UTI MF', initials: 'UTI', url: 'https://www.utimf.com', color: '#1B3C6E' },
  { name: 'Mirae Asset Mutual Fund', shortName: 'Mirae Asset MF', initials: 'MA', url: 'https://www.miraeassetmf.co.in', color: '#002D6A', logo: '/amcs/mirae-asset.jpg' },
  { name: 'DSP Mutual Fund', shortName: 'DSP MF', initials: 'DSP', url: 'https://www.dspim.com', color: '#003DA5', logo: '/amcs/dsp.jpg' },

  // Mid-tier & specialty
  { name: 'Tata Mutual Fund', shortName: 'Tata MF', initials: 'TATA', url: 'https://www.tatamutualfund.com', color: '#486AAE', logo: '/amcs/tata.svg' },
  { name: 'Motilal Oswal Mutual Fund', shortName: 'Motilal Oswal MF', initials: 'MO', url: 'https://www.motilaloswalmf.com', color: '#003B73' },
  { name: 'Franklin Templeton Mutual Fund', shortName: 'Franklin MF', initials: 'FT', url: 'https://www.franklintempletonindia.com', color: '#003D6B' },
  { name: 'Bandhan Mutual Fund', shortName: 'Bandhan MF', initials: 'BMF', url: 'https://www.bandhanmutual.com', color: '#ED1C24' },
  { name: 'Canara Robeco Mutual Fund', shortName: 'Canara Robeco MF', initials: 'CR', url: 'https://www.canararobeco.com', color: '#0066B3' },
  { name: 'Sundaram Mutual Fund', shortName: 'Sundaram MF', initials: 'SM', url: 'https://www.sundarammutual.com', color: '#003D6B', logo: '/amcs/sundaram.svg' },
  { name: 'HSBC Mutual Fund', shortName: 'HSBC MF', initials: 'HSBC', url: 'https://www.assetmanagement.hsbc.co.in', color: '#DB0011', logo: '/amcs/hsbc.jpg' },
  { name: 'Invesco Mutual Fund', shortName: 'Invesco MF', initials: 'IN', url: 'https://www.invescomutualfund.com', color: '#2B4B8C', logo: '/amcs/invesco.jpg' },
  { name: 'LIC Mutual Fund', shortName: 'LIC MF', initials: 'LIC', url: 'https://www.licmf.com', color: '#002F87', logo: '/amcs/lic.png' },
  { name: 'Baroda BNP Paribas Mutual Fund', shortName: 'Baroda BNP MF', initials: 'BBP', url: 'https://www.barodabnpparibasmf.in', color: '#005F91', logo: '/amcs/baroda-bnp.png' },

  // Specialty & boutique AMCs
  { name: 'Quant Mutual Fund', shortName: 'Quant MF', initials: 'QT', url: 'https://www.quantmutual.com', color: '#1B365D', logo: '/amcs/quant.png' },
  { name: 'PPFAS Mutual Fund', shortName: 'PPFAS MF', initials: 'PP', url: 'https://amc.ppfas.com', color: '#2E4057', logo: '/amcs/ppfas.png' },
  { name: 'Edelweiss Mutual Fund', shortName: 'Edelweiss MF', initials: 'EW', url: 'https://www.edelweissmf.com', color: '#003366' },
  { name: 'PGIM India Mutual Fund', shortName: 'PGIM MF', initials: 'PG', url: 'https://www.pgimindiamf.com', color: '#F68220', logo: '/amcs/pgim.png' },
  { name: 'Mahindra Manulife Mutual Fund', shortName: 'Mahindra MF', initials: 'MM', url: 'https://www.mahindramanulife.com', color: '#CD2027', logo: '/amcs/mahindra-manulife.png' },
  { name: 'Bajaj Finserv Mutual Fund', shortName: 'Bajaj MF', initials: 'BJ', url: 'https://www.bajajfinservmf.in', color: '#003A70' },
  { name: 'Union Mutual Fund', shortName: 'Union MF', initials: 'UN', url: 'https://www.unionmf.com', color: '#D71A21', logo: '/amcs/union.png' },
  { name: 'JM Financial Mutual Fund', shortName: 'JM Financial MF', initials: 'JM', url: 'https://www.jmfinancialmf.com', color: '#003A70' },
  { name: 'ITI Mutual Fund', shortName: 'ITI MF', initials: 'ITI', url: 'https://www.itimf.com', color: '#0066A2', logo: '/amcs/iti.svg' },
  { name: 'Quantum Mutual Fund', shortName: 'Quantum MF', initials: 'QN', url: 'https://www.quantumamc.com', color: '#006D77' },

  // New-age & niche
  { name: 'WhiteOak Capital Mutual Fund', shortName: 'WhiteOak MF', initials: 'WO', url: 'https://www.whiteoakamc.com', color: '#1A1A1A' },
  { name: 'NJ Mutual Fund', shortName: 'NJ MF', initials: 'NJ', url: 'https://www.njmutualfund.com', color: '#EE4036', logo: '/amcs/nj.png' },
  { name: 'Samco Mutual Fund', shortName: 'Samco MF', initials: 'SC', url: 'https://www.samcomf.com', color: '#F68220', logo: '/amcs/samco.png' },
  { name: 'Navi Mutual Fund', shortName: 'Navi MF', initials: 'NV', url: 'https://www.navi.com/mutual-fund', color: '#1E40AF', logo: '/amcs/navi.svg' },
  { name: 'Groww Mutual Fund', shortName: 'Groww MF', initials: 'GR', url: 'https://groww.in/mutual-funds', color: '#00D09C', logo: '/amcs/groww.png' },
  { name: 'Zerodha Mutual Fund', shortName: 'Zerodha MF', initials: 'ZD', url: 'https://zerodhafundhouse.com', color: '#387ED1', logo: '/amcs/zerodha.png' },
  { name: 'Helios Mutual Fund', shortName: 'Helios MF', initials: 'HL', url: 'https://www.helioscapital.in', color: '#B91C1C' },
  { name: 'Trust Mutual Fund', shortName: 'Trust MF', initials: 'TR', url: 'https://www.trustmf.com', color: '#064E3B' },
  { name: '360 ONE Mutual Fund', shortName: '360 ONE MF', initials: '360', url: 'https://www.360.one', color: '#1E1E1E', logo: '/amcs/360-one.svg' },
  { name: 'Shriram Mutual Fund', shortName: 'Shriram MF', initials: 'SH', url: 'https://www.shriramamc.com', color: '#CE1E2C' },
  { name: 'Old Bridge Mutual Fund', shortName: 'Old Bridge MF', initials: 'OB', url: 'https://www.oldbridgemf.com', color: '#1E3A8A', logo: '/amcs/old-bridge.svg' },
  { name: 'Taurus Mutual Fund', shortName: 'Taurus MF', initials: 'TS', url: 'https://www.taurusmutualfund.com', color: '#B45309', logo: '/amcs/taurus.png' },
] as const;
