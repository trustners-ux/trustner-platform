export const REGULATORY = {
  // AMFI Details
  AMFI_ARN: "ARN-286886",
  AMFI_ARN_NUMBER: "286886",

  // Entity Names
  MF_ENTITY: "Trustner Asset Services Pvt. Ltd.",
  INSURANCE_ENTITY: "Trustner Insurance Brokers Private Limited",

  // Core SEBI Disclaimers
  SEBI_MUTUAL_FUND_DISCLAIMER:
    "Mutual fund investments are subject to market risks. Read all scheme related documents carefully before investing.",

  PAST_PERFORMANCE:
    "Past performance is not indicative of future returns. Past performance may or may not be sustained in future and should not be used as a basis for comparison with other investments.",

  NAV_DISCLAIMER:
    "NAV of the schemes may go up or down depending upon the factors and forces affecting the securities market.",

  NO_GUARANTEE:
    "There is no assurance or guarantee that the objectives of the scheme will be achieved.",

  TAX_DISCLAIMER:
    "Tax benefits are as per the Income Tax Act, 1961, and are subject to amendments made thereto from time to time. Please consult your tax advisor for details.",

  DISTRIBUTOR_DISCLAIMER:
    "Trustner Asset Services Pvt. Ltd. (ARN-286886) is a AMFI registered Mutual Fund Distributor and not an Investment Advisor. The information provided herein is for general informational purposes only and should not be construed as investment advice.",

  // KYC & Compliance
  KYC_NOTICE:
    "KYC is one time exercise while dealing in securities markets - once KYC is done through a SEBI registered intermediary (Broker, DP, Mutual Fund, etc.), you need not undergo the same process again when you approach another intermediary.",

  FATCA_CRS:
    "As per the provisions of the Foreign Account Tax Compliance Act (FATCA) and Common Reporting Standards (CRS), investors are required to provide self-certification regarding their tax residency status.",

  NOMINATION_NOTICE:
    "Nomination is mandatory for all mutual fund investments as per SEBI regulations. Investors can opt-out of nomination by signing the declaration form.",

  // Grievance Redressal
  SEBI_SCORES: {
    text: "In case of any grievance, investors may reach out to SEBI through SCORES portal",
    url: "https://scores.sebi.gov.in/",
  },

  AMFI_INVESTOR_CHARTER: {
    text: "Refer to Investor Charter for Mutual Fund Distributors",
    url: "https://www.amfiindia.com/investor-corner/investor-charter",
  },

  AMFI_WEBSITE: {
    text: "AMFI",
    url: "https://www.amfiindia.com",
  },

  // Insurance Disclaimers
  INSURANCE_DISCLAIMER:
    "Insurance is the subject matter of solicitation. For more details on risk factors, terms & conditions, please read the sales brochure carefully before concluding a sale.",

  IRDAI_LICENSE: "IRDAI License No. [To be updated]",

  // Compliance Officer
  COMPLIANCE_OFFICER: {
    name: "[Compliance Officer Name]",
    email: "compliance@trustner.in",
    phone: "[Phone Number]",
  },

  // Company Registration
  CIN_MF: "CIN: [To be updated]",
  CIN_INSURANCE: "CIN: [To be updated]",

  // Privacy
  DPDPA_NOTICE:
    "We collect and process your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDPA). Please refer to our Privacy Policy for details.",

  // Data Attribution
  DATA_DISCLAIMER:
    "Market data and NAV information is sourced from AMFI and other reliable sources. Data is for informational purposes only. Please verify with the official source before making investment decisions.",
} as const;

// Named exports for convenience
export const AMFI_ARN = REGULATORY.AMFI_ARN;
export const MF_ENTITY = REGULATORY.MF_ENTITY;
export const INSURANCE_ENTITY = REGULATORY.INSURANCE_ENTITY;
export const SEBI_MUTUAL_FUND_DISCLAIMER = REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER;
export const PAST_PERFORMANCE = REGULATORY.PAST_PERFORMANCE;
export const NAV_DISCLAIMER = REGULATORY.NAV_DISCLAIMER;
export const NO_GUARANTEE = REGULATORY.NO_GUARANTEE;
export const TAX_DISCLAIMER = REGULATORY.TAX_DISCLAIMER;
export const DISTRIBUTOR_DISCLAIMER = REGULATORY.DISTRIBUTOR_DISCLAIMER;
export const KYC_NOTICE = REGULATORY.KYC_NOTICE;
export const FATCA_CRS = REGULATORY.FATCA_CRS;
export const NOMINATION_NOTICE = REGULATORY.NOMINATION_NOTICE;
export const INSURANCE_DISCLAIMER = REGULATORY.INSURANCE_DISCLAIMER;
export const IRDAI_LICENSE = REGULATORY.IRDAI_LICENSE;
export const DPDPA_NOTICE = REGULATORY.DPDPA_NOTICE;
export const DATA_DISCLAIMER = REGULATORY.DATA_DISCLAIMER;
