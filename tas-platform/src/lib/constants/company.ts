export const COMPANY = {
  brand: "Trustner",
  tagline: "Your Trusted Investment & Insurance Partner",
  description:
    "Trustner helps you make smarter financial decisions. We offer expert mutual fund distribution and insurance broking services to help you achieve your financial goals.",

  mfEntity: {
    name: "Trustner Asset Services Pvt. Ltd.",
    shortName: "Trustner Asset Services",
    amfiArn: "ARN-286886",
    type: "AMFI Registered Mutual Fund Distributor",
    cin: "U66301AS2023PTC025505",
  },

  insuranceEntity: {
    name: "Trustner Insurance Brokers Private Limited",
    shortName: "Trustner Insurance Brokers",
    type: "IRDAI Licensed Insurance Broker",
    irdaiLicense: "1067",
    cin: "U66220AS2024PTC025948",
  },

  contact: {
    phone: "+91-6003903737",
    phoneDisplay: "6003903737",
    email: "wecare@wealthyhub.in",
    supportEmail: "wecare@wealthyhub.in",
    whatsapp: "+916003903737",
    whatsappDisplay: "6003903737",
    workingHours: "Mon - Sat: 9:00 AM - 7:00 PM IST",
  },

  address: {
    line1: "Sethi Trust Building, Unit 2, 4th Floor",
    line2: "G S Road, Bhangagarh",
    city: "Guwahati",
    state: "Assam",
    pincode: "781005",
    country: "India",
    full: "Sethi Trust Building, Unit 2, 4th Floor, G S Road, Bhangagarh, Guwahati - 781005, Assam",
  },

  branches: [
    { city: "Guwahati", state: "Assam", type: "head-office" as const },
    { city: "Tezpur", state: "Assam", type: "branch" as const },
    { city: "Kolkata", state: "West Bengal", type: "branch" as const },
    { city: "Bangalore", state: "Karnataka", type: "branch" as const },
    { city: "Hyderabad", state: "Telangana", type: "branch" as const },
    { city: "Ranchi", state: "Jharkhand", type: "coming-soon" as const },
    { city: "Mumbai", state: "Maharashtra", type: "coming-soon" as const },
  ],

  social: {
    linkedin: "https://www.linkedin.com/company/trustner",
    instagram: "https://www.instagram.com/trustner",
    twitter: "https://twitter.com/trustner",
    youtube: "https://www.youtube.com/@trustner",
    facebook: "https://www.facebook.com/trustner",
  },

  stats: {
    clients: "10,000+",
    amcPartners: "40+",
    insurancePartners: "30+",
    aumManaged: "₹100 Cr+",
    claimSettlement: "98%",
    yearsExperience: "5+",
  },
} as const;
