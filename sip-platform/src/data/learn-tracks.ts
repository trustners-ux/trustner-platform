import type { LearnTrack, LearnTrackInfo } from '@/types/learning';

/**
 * All seven Learn segments offered on merasip.com.
 *
 * Foundation-level modules (investor education) are what we ship today.
 * Each track has an Advanced Curriculum reserved for certification-grade
 * material — currently a placeholder, surfaced through "Go to Advanced
 * Learning" CTAs.
 *
 * Compliance metadata (regulator, minimums, empanelment flags) is the
 * source of truth for headers, disclosures, and CTAs across the site.
 */
export const LEARN_TRACKS: LearnTrackInfo[] = [
  {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    shortName: 'MF',
    description:
      'India\'s most accessible wealth-building vehicle. SEBI-regulated, AMFI-supervised pooled investments suited for SIPs from ₹500/month to disciplined goal funding over decades.',
    icon: 'PiggyBank',
    gradient: 'from-brand-600 to-teal-600',
    accentColor: 'brand',
    audienceFoundation:
      'Retail investors building wealth through SIPs and goal-based investing.',
    audienceAdvanced:
      'NISM Series V-A candidates, sub-broker onboarding, ARN/EUIN aspirants.',
    minimumInvestment: 'From ₹500 SIP / ₹5,000 lumpsum',
    regulator: 'SEBI / AMFI',
    trustnerEmpanelled: true,
  },
  {
    id: 'sif',
    name: 'Specialized Investment Funds',
    shortName: 'SIF',
    description:
      'A new SEBI category bridging mutual funds and PMS. SIFs allow long-short strategies and limited derivatives use, with a ₹10 lakh minimum — designed for upper-mass-affluent investors seeking sophisticated strategies without the ₹50 lakh PMS threshold.',
    icon: 'Layers',
    gradient: 'from-indigo-600 to-purple-600',
    accentColor: 'indigo',
    audienceFoundation:
      'Affluent investors with ₹10 lakh+ ticket sizes seeking strategies beyond plain mutual funds.',
    audienceAdvanced:
      'NISM XXI-A SIF Distributor candidates and sub-brokers handling HNI portfolios.',
    minimumInvestment: '₹10 lakh per investor',
    regulator: 'SEBI / AMFI',
    trustnerEmpanelled: true,
  },
  {
    id: 'pms',
    name: 'Portfolio Management Services',
    shortName: 'PMS',
    description:
      'Tailored portfolios held in the investor\'s own demat account, managed by a SEBI-registered Portfolio Manager. Suited for HNIs with ₹50 lakh+ ticket sizes who want concentrated, conviction-led equity exposure with full transparency on holdings.',
    icon: 'BriefcaseBusiness',
    gradient: 'from-blue-700 to-cyan-600',
    accentColor: 'blue',
    audienceFoundation:
      'HNI investors with ₹50 lakh+ minimum considering professionally managed concentrated equity portfolios.',
    audienceAdvanced:
      'NISM Series XXI Portfolio Manager Distributors Examination, APMI certification candidates.',
    minimumInvestment: '₹50 lakh per investor',
    regulator: 'SEBI / APMI',
    trustnerEmpanelled: true,
  },
  {
    id: 'aif',
    name: 'Alternative Investment Funds',
    shortName: 'AIF',
    description:
      'Privately pooled vehicles for sophisticated investors — venture capital, private equity, real estate, hedge-style long-short, structured credit. SEBI regulates three categories with a ₹1 crore minimum. AIFs unlock asset classes and strategies unavailable to mutual fund investors.',
    icon: 'GitBranch',
    gradient: 'from-fuchsia-700 to-pink-600',
    accentColor: 'fuchsia',
    audienceFoundation:
      'Ultra-HNI investors with ₹1 crore+ ticket sizes seeking exposure to private markets, hedge strategies, or specialised asset classes.',
    audienceAdvanced:
      'NISM AIF Distributors Examination candidates, family-office and IFA team members handling Cat I/II/III AIFs.',
    minimumInvestment: '₹1 crore per investor',
    regulator: 'SEBI',
    trustnerEmpanelled: true,
  },
  {
    id: 'gift-city',
    name: 'GIFT City (IFSC)',
    shortName: 'GIFT IFSC',
    description:
      'India\'s International Financial Services Centre at Gandhinagar — a separate jurisdiction regulated by IFSCA. Resident Indians can invest USD-denominated funds via the LRS route, accessing global equities, fixed income, insurance, and AIFs with material tax advantages over standard offshore structures.',
    icon: 'Globe2',
    gradient: 'from-emerald-700 to-teal-600',
    accentColor: 'emerald',
    audienceFoundation:
      'Resident Indians seeking USD-denominated international diversification within LRS limits, plus NRIs and HNIs reorganising offshore wealth.',
    audienceAdvanced:
      'IFSCA distributor empanelment candidates, family-office cross-border specialists.',
    minimumInvestment: 'Fund-specific (typically USD 10,000-25,000)',
    regulator: 'IFSCA',
    trustnerEmpanelled: true,
  },
  {
    id: 'international',
    name: 'International Funds',
    shortName: 'Intl Funds',
    description:
      'Indian mutual fund schemes that invest in global equities — US tech, Nasdaq 100, China, Japan, emerging markets. Accessed in INR through your existing folio, no LRS friction. Tax treatment was reset in FY24; understanding the new rules is critical before allocating.',
    icon: 'Plane',
    gradient: 'from-orange-600 to-rose-600',
    accentColor: 'orange',
    audienceFoundation:
      'Indian retail and HNI investors seeking US/global diversification through INR-denominated mutual fund route, without LRS paperwork.',
    audienceAdvanced:
      'Distributors handling cross-border allocation, NRI taxation specialists.',
    minimumInvestment: 'From ₹500 SIP / ₹5,000 lumpsum',
    regulator: 'SEBI / AMFI',
    trustnerEmpanelled: true,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    shortName: 'Insurance',
    description:
      'Term, health, critical illness, ULIP, endowment, and money-back policies. The first financial product most Indian families buy — and the one most often mis-sold. Honest education on what to buy, what to avoid, and how to separate protection from investment.',
    icon: 'Shield',
    gradient: 'from-rose-700 to-red-600',
    accentColor: 'rose',
    audienceFoundation:
      'Every Indian household making decisions on life cover, health cover, critical illness, and the ULIP-vs-MF debate.',
    audienceAdvanced:
      'IRDAI POSP / Insurance Broker certification candidates, IC-38 study material.',
    minimumInvestment: 'Premium-based (varies by product)',
    regulator: 'IRDAI',
    trustnerEmpanelled: true,
  },
];

export function getTrackInfo(id: LearnTrack): LearnTrackInfo | undefined {
  return LEARN_TRACKS.find((t) => t.id === id);
}

export function getAllTracks(): LearnTrackInfo[] {
  return LEARN_TRACKS;
}
