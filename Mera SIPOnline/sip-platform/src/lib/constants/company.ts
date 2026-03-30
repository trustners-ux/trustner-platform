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
    type: 'AMFI Registered Mutual Fund Distributor',
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
    email: 'wecare@merasip.com',
    supportEmail: 'wecare@merasip.com',
    grievanceEmail: 'grievance@trustner.in',
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
  amfi: `AMFI Registered Mutual Fund Distributor | ARN-286886`,
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
  complete: `Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance does not guarantee future returns. | ${COMPANY.mfEntity.name} | ${COMPANY.mfEntity.amfiArn} | CIN: ${COMPANY.mfEntity.cin} | AMFI Registered Mutual Fund Distributor`,
} as const;

export const AMC_PARTNERS = [
  { name: 'SBI Mutual Fund', shortName: 'SBI MF', initials: 'SBI', url: 'https://www.sbimf.com', color: '#00529B' },
  { name: 'HDFC Mutual Fund', shortName: 'HDFC MF', initials: 'HDFC', url: 'https://www.hdfcfund.com', color: '#004C8F' },
  { name: 'ICICI Prudential Mutual Fund', shortName: 'ICICI Pru MF', initials: 'ICICI', url: 'https://www.icicipruamc.com', color: '#F37B20' },
  { name: 'Axis Mutual Fund', shortName: 'Axis MF', initials: 'AXIS', url: 'https://www.axismf.com', color: '#97144D' },
  { name: 'Kotak Mutual Fund', shortName: 'Kotak MF', initials: 'KMF', url: 'https://www.kotakmf.com', color: '#ED1C24' },
  { name: 'Nippon India Mutual Fund', shortName: 'Nippon India MF', initials: 'NI', url: 'https://mf.nipponindiaim.com', color: '#E60012' },
  { name: 'Tata Mutual Fund', shortName: 'Tata MF', initials: 'TATA', url: 'https://www.tatamutualfund.com', color: '#486AAE' },
  { name: 'UTI Mutual Fund', shortName: 'UTI MF', initials: 'UTI', url: 'https://www.utimf.com', color: '#1B3C6E' },
  { name: 'Aditya Birla Sun Life Mutual Fund', shortName: 'ABSL MF', initials: 'ABSL', url: 'https://mutualfund.adityabirlacapital.com', color: '#ED1C24' },
  { name: 'DSP Mutual Fund', shortName: 'DSP MF', initials: 'DSP', url: 'https://www.dspim.com', color: '#003DA5' },
  { name: 'Mirae Asset Mutual Fund', shortName: 'Mirae Asset MF', initials: 'MA', url: 'https://www.miraeassetmf.co.in', color: '#002D6A' },
  { name: 'Motilal Oswal Mutual Fund', shortName: 'Motilal Oswal MF', initials: 'MO', url: 'https://www.motilaloswalmf.com', color: '#003B73' },
  { name: 'Franklin Templeton Mutual Fund', shortName: 'Franklin MF', initials: 'FT', url: 'https://www.franklintempletonindia.com', color: '#003D6B' },
  { name: 'Bandhan Mutual Fund', shortName: 'Bandhan MF', initials: 'BMF', url: 'https://www.bandhanmutual.com', color: '#ED1C24' },
  { name: 'Canara Robeco Mutual Fund', shortName: 'Canara Robeco MF', initials: 'CR', url: 'https://www.canararobeco.com', color: '#0066B3' },
  { name: 'Sundaram Mutual Fund', shortName: 'Sundaram MF', initials: 'SMF', url: 'https://www.sundarammutual.com', color: '#003D6B' },
  { name: 'HSBC Mutual Fund', shortName: 'HSBC MF', initials: 'HSBC', url: 'https://www.assetmanagement.hsbc.co.in', color: '#DB0011' },
  { name: 'Quant Mutual Fund', shortName: 'Quant MF', initials: 'QMF', url: 'https://www.quantmutual.com', color: '#1B365D' },
  { name: 'PPFAS Mutual Fund', shortName: 'PPFAS MF', initials: 'PP', url: 'https://amc.ppfas.com', color: '#2E4057' },
  { name: 'Edelweiss Mutual Fund', shortName: 'Edelweiss MF', initials: 'EW', url: 'https://www.edelweissmf.com', color: '#003366' },
] as const;
