import { LearningModule } from '@/types/learning';

export const giftAdvancedModule: LearningModule = {
  id: 'gift-advanced',
  title: 'GIFT City Advanced — LRS, Tax & Compliance',
  slug: 'gift-advanced',
  icon: 'ShieldCheck',
  description:
    'Advanced capstone for the GIFT City track covering LRS compliance under FEMA Schedule III, IFSCA tax incentives stacking and optimisation, and the operational distributor workflow for empanelment, KYC, FATCA/CRS, and USD remittance. Designed for sub-broker / certification-level preparation.',
  level: 'advanced',
  color: 'from-emerald-800 to-teal-700',
  estimatedTime: '45 min',
  track: 'gift-city',
  sections: [
    {
      id: 'lrs-compliance-deep',
      title: 'LRS Compliance Deep Dive',
      slug: 'lrs-compliance-deep',
      content: {
        definition:
          'The Liberalised Remittance Scheme (LRS) operates under Schedule III of the Foreign Exchange Management (Current Account Transactions) Rules, 2000, read with FEMA Notification 1/2000-RB, and permits resident individuals to remit up to USD 250,000 per individual per financial year (April-March) for permissible current and capital account transactions, including investments into GIFT IFSC entities. All LRS remittances must be channelled through an Authorised Dealer (AD) Category-I bank against a duly executed Form A2.',
        explanation:
          'LRS is the foundational regulatory pipe through which resident Indian individuals fund GIFT IFSC products, and distributors must understand its mechanics with precision. The USD 250,000 ceiling is per individual, per financial year, and resets on April 1 each year — unutilised quota does not carry forward. Each LRS remittance requires the remitter to submit Form A2 (declaration cum application) to the AD bank, with PAN mandatory for all remittances. The AD bank performs source-of-funds verification, KYC re-validation, and reports the remittance to the RBI through the Liberalised Remittance Scheme reporting framework. Tax Collected at Source (TCS) under section 206C(1G) of the Income-tax Act applies as follows post-October 2023: for non-education and non-medical LRS remittances, TCS is levied at 20% on amounts exceeding ₹7 lakh per FY; for education financed by an education loan from a specified institution, TCS is 0.5% above the ₹7 lakh threshold; for other education and medical remittances, TCS is 5% above ₹7 lakh. TCS is collected by the AD bank at the time of remittance and is creditable against the remitter\'s income-tax liability in the relevant FY. Form 15CA is required to be filed online for most LRS remittances; Form 15CB (CA certificate) is generally not required for LRS remittances within Schedule III where the bank holds the supporting declaration. Prohibited LRS uses include: margin or margin call payments to overseas exchanges, purchase of FCCBs of Indian companies abroad, trading in foreign exchange abroad, purchase of lottery tickets or sweepstakes, and capital account remittances to FATF-flagged or non-cooperative jurisdictions. Real estate purchase abroad is permitted under LRS, but investors should note specific reporting nuances. Family LRS aggregation: each adult family member has an independent USD 250,000 quota, allowing strategic family-level capital deployment into GIFT — but each member must independently sign Form A2 and remit from their own bank account; pooling another individual\'s quota into one person\'s account is not permitted. Common compliance pitfalls include: under-reporting in foreign asset Schedule FA of ITR, missing the OPI (Overseas Portfolio Investment) reporting obligation, failing to credit TCS in advance tax computations, and incorrect classification of remittance purpose code on Form A2.',
        realLifeExample:
          'A 45-year-old resident professional plans to invest USD 100,000 in a GIFT IFSC USD equity fund in June 2026. He approaches his AD bank with Form A2, PAN, and source-of-funds documents. INR equivalent at ₹84/USD: ₹84,00,000. TCS computation: aggregate LRS in FY 2026-27 so far is nil; threshold ₹7 lakh; taxable amount above threshold ₹77 lakh; TCS at 20% = ₹15.4 lakh, collected by the bank in addition to the remittance amount. Total INR debited from his account: ₹84 lakh remitted + ₹15.4 lakh TCS = ₹99.4 lakh. The TCS appears in his Form 26AS and Annual Information Statement; he claims it as advance tax credit while filing his ITR for AY 2027-28. Separately, his spouse (also a resident) uses her independent LRS quota to remit USD 50,000 the same FY into a different GIFT product. Both remittances are reported individually; both must be disclosed in Schedule FA when filing ITR.',
        keyPoints: [
          'LRS ceiling: USD 250,000 per individual per FY under Schedule III of FEMA.',
          'Form A2 + PAN mandatory for every LRS remittance through AD Category-I bank.',
          'TCS 20% above ₹7 lakh for non-education/non-medical post-October 2023; creditable against income tax.',
          'Quota does not carry forward; resets each April 1.',
          'Each adult family member has an independent quota — pooling is not permitted.',
          'Prohibited uses: margin trading abroad, lottery, certain real estate categories, FATF-flagged jurisdictions.',
          'Schedule FA of ITR disclosure mandatory for foreign assets held; non-disclosure attracts Black Money Act consequences.',
        ],
        faq: [
          {
            question: 'Does the TCS of 20% apply on the very first rupee remitted under LRS?',
            answer:
              'No. For non-education and non-medical LRS remittances post-October 2023, TCS at 20% applies only on the aggregate amount exceeding ₹7 lakh in a financial year. Up to ₹7 lakh per FY, TCS is nil for these categories. For education financed by a specified loan, TCS is 0.5% above ₹7 lakh.',
          },
          {
            question: 'Can a Hindu Undivided Family (HUF) use LRS to invest in GIFT?',
            answer:
              'No. The Liberalised Remittance Scheme is available only to resident individuals. HUFs, partnership firms, and companies have separate FEMA routes (such as the ODI framework or specific RBI approvals) for overseas remittance, and these typically have different limits and reporting requirements.',
          },
          {
            question: 'How is TCS reflected in the remitter\'s tax return?',
            answer:
              'TCS collected by the AD bank under section 206C(1G) is reported in Form 26AS and the Annual Information Statement against the remitter\'s PAN. The remitter claims it as advance tax credit in the ITR for the relevant assessment year, which can result in a refund if total tax liability is lower than aggregate TCS.',
          },
          {
            question: 'Is Schedule FA disclosure required for GIFT IFSC investments?',
            answer:
              'Yes. Although GIFT IFSC is geographically within India, the units of GIFT-domiciled entities held by resident Indians are treated as foreign assets for ITR Schedule FA disclosure purposes by most practitioners, given the IFSC special-zone status. Investors should consult their tax advisor; under-disclosure can attract Black Money Act penalties.',
          },
        ],
        mcqs: [
          {
            question: 'The annual LRS limit per resident individual under Schedule III of FEMA is:',
            options: ['USD 100,000', 'USD 250,000', 'USD 500,000', 'No limit'],
            correctAnswer: 1,
            explanation:
              'The LRS ceiling is USD 250,000 per resident individual per financial year. The quota resets on April 1 and does not carry forward.',
          },
          {
            question: 'TCS at 20% on non-education LRS remittances applies on amounts exceeding:',
            options: ['Nil — first rupee', '₹2 lakh per FY', '₹7 lakh per FY', '₹50 lakh per FY'],
            correctAnswer: 2,
            explanation:
              'Post-October 2023, TCS at 20% under section 206C(1G) applies on aggregate non-education and non-medical LRS remittances exceeding ₹7 lakh per FY. TCS is creditable against the remitter\'s income tax liability.',
          },
          {
            question: 'Which of the following is NOT a permissible use of LRS?',
            options: [
              'Investment in GIFT IFSC USD funds',
              'Overseas education fees',
              'Margin trading on a foreign exchange',
              'Gift to a relative abroad within limit',
            ],
            correctAnswer: 2,
            explanation:
              'Margin or margin-call payments to overseas exchanges are explicitly prohibited under LRS. Permissible uses include investments, education, medical treatment, gifts within limit, and travel.',
          },
        ],
        summaryNotes: [
          'LRS = USD 250,000 per resident individual per FY through AD Category-I bank with Form A2.',
          'TCS 20% above ₹7 lakh threshold for non-education/non-medical remittances; creditable.',
          'Quota does not carry forward; family members have independent quotas.',
          'Schedule FA disclosure and proper purpose-code classification are common audit pinch-points.',
          'Distributors must educate clients on TCS cash-flow impact at remittance time, even though it is recoverable.',
        ],
        relatedTopics: ['what-is-gift-city', 'gift-products-lrs', 'gift-usd-funds', 'gift-distributor-workflow'],
      },
    },
    {
      id: 'gift-tax-optimization',
      title: 'GIFT IFSC Tax Optimization',
      slug: 'gift-tax-optimization',
      content: {
        definition:
          'GIFT IFSC tax incentives are a stacked framework spanning the Income-tax Act, 1961 (sections 80LA, 47, 10(4D), 10(4E), 10(4F), 10(4G)), the Securities Transaction Tax (STT) and Commodities Transaction Tax (CTT) exemptions, and Goods and Services Tax (GST) zero-rating on services rendered to and within the IFSC. The framework is designed to make GIFT competitive with Singapore, Mauritius, and Dubai for fund management, banking, insurance, and securities-market activities.',
        explanation:
          'The cornerstone tax incentive for IFSC units is section 80LA of the Income-tax Act, which permits a 100% tax holiday on business income for any 10 consecutive assessment years out of a 15-year window beginning with the year in which the unit obtains its IFSCA registration. This allows IFSC AMCs, banking units, and insurance carriers to operate at near-zero corporate tax during the holiday window — a structural cost advantage they can pass through to investors via lower expense ratios or higher net yields. STT and CTT are statutorily zero on transactions executed on IFSC stock exchanges (NSE IFSC and India INX), eliminating a meaningful drag that exists on domestic exchanges. GST is zero-rated for services rendered by IFSC units to non-residents and for inter-IFSC transactions, reducing the effective cost of fund administration, custody, and advisory services. For non-resident investors, capital gains on certain IFSC instruments — including bonds listed on IFSC exchanges, derivative contracts, and units of Category-III AIFs in IFSC investing primarily in non-Indian assets — are exempt under sections 47(viiab), 10(4D), and related provisions, making GIFT a genuinely competitive fund-management jurisdiction. Surcharge rules: the 37% peak surcharge that applies to high-income resident individuals does not apply to capital gains arising from IFSC instruments held by non-residents under most treaty positions; for resident investors, surcharge applies as per regular rates. Dividend treatment: dividends from IFSC entities to non-residents are taxed at concessional rates (typically 10% under section 115AC variants) where applicable; resident investors are taxed at slab rates with TDS implications. Holding-period rules for USD-denominated assets follow the underlying classification — equity-classified instruments need over 12 months for LTCG, non-equity-classified need over 24 months. A subtle but important point: capital gain or loss for a resident Indian on a USD-denominated GIFT instrument is computed in INR terms using the prescribed conversion methodology — meaning USD/INR movement is part of the taxable gain. Treaty considerations: GIFT is geographically within India, so Indian DTAA treaties apply to non-resident investors investing through GIFT; the much-discussed Mauritius and Singapore routes have lost much of their grandfathered tax advantage post-2017 protocol amendments, making GIFT increasingly competitive on a like-for-like basis. Investors and distributors must remember that the 80LA holiday benefits the IFSC entity, not the underlying investor — investor-level taxation continues to apply per their residency status and the instrument classification.',
        realLifeExample:
          'A representative IFSC AMC is in Year 4 of its section 80LA tax holiday, paying nil corporate tax on its asset-management business income. It runs a USD Global Equity Fund with expense ratio 0.85% — competitive with Indian international fund-of-funds at 1.0-1.5% all-in. A non-resident investor (NRI based in Singapore) subscribes USD 200,000 in May 2026; five years later redeems at USD 320,000 (USD gain USD 120,000). Under section 10(4D) read with the relevant IFSC capital-gains exemption framework, his capital gain is exempt from Indian tax at the IFSC level for the qualifying portion. He repatriates net of any treaty-residual tax to his Singapore account. Compare with a resident Indian investor in the same fund: his gain is taxable as foreign-source capital gain in INR-converted terms, with surcharge per slab — illustrating that the GIFT tax advantage is structurally tilted toward non-residents. The MFD\'s role in such cases is to position GIFT for resident investors based on currency diversification and product access, not on a tax-arbitrage premise.',
        keyPoints: [
          'Section 80LA: 100% tax holiday for IFSC units for any 10 of 15 years from IFSCA registration.',
          'Zero STT/CTT on IFSC exchange transactions; GST zero-rating on IFSC services to non-residents.',
          'Capital gains exemptions under section 47(viiab), 10(4D), 10(4E), 10(4F), 10(4G) for specified non-resident transactions.',
          'Resident investor: USD/INR conversion is part of taxable gain; classification follows underlying instrument.',
          'Tax holiday benefits the IFSC entity (lower fees passed to investors), not investor-level taxation.',
          'Post-2017 treaty amendments: Mauritius/Singapore grandfathering largely exhausted, levelling the field for GIFT.',
          'Distributors should not market GIFT as "tax-free" to residents — the advantage is partial and product-specific.',
        ],
        faq: [
          {
            question: 'Does section 80LA make my returns from a GIFT IFSC fund tax-free?',
            answer:
              'No. Section 80LA is a tax holiday for the IFSC unit (the AMC, banking unit, or insurer) on its business income. It allows the entity to operate at lower cost, which can translate into lower expense ratios for investors. Investor-level capital gains tax is determined separately by the investor\'s residency and the instrument\'s classification.',
          },
          {
            question: 'How does GIFT compare with Singapore for a non-resident Indian investor?',
            answer:
              'For an NRI, GIFT now offers comparable tax treatment to Singapore on many product categories — exempt capital gains on specified IFSC instruments, no STT/CTT, and access to USD-denominated Indian-managed funds. Operational ease (Indian-managed entities, Indian KYC familiarity, INR redemption optionality) often tilts the comparison toward GIFT.',
          },
          {
            question: 'Is the surcharge cap of 15% on capital gains applicable in GIFT?',
            answer:
              'For resident investors, surcharge on capital gains follows regular rules including any applicable caps for listed equity LTCG. For non-residents on exempt IFSC instruments, the question is moot since the gain itself is exempt. Investors should verify with their tax advisor for their specific instrument and residency.',
          },
          {
            question: 'How is USD/INR currency movement taxed for a resident Indian on GIFT redemption?',
            answer:
              'For a resident Indian, capital gain on a USD-denominated GIFT instrument is computed by converting both cost and sale value to INR using the prescribed methodology. The currency-driven portion of the gain is part of the taxable amount — there is no separate carve-out for forex movement.',
          },
        ],
        mcqs: [
          {
            question: 'Section 80LA provides a tax holiday for IFSC units for how many years?',
            options: [
              '5 consecutive years',
              '10 consecutive years out of 15 from IFSCA registration',
              '20 years unconditionally',
              'Lifetime exemption',
            ],
            correctAnswer: 1,
            explanation:
              'Section 80LA permits a 100% tax holiday on business income for any 10 consecutive assessment years out of a 15-year window beginning with the year of IFSCA registration. It is a unit-level benefit, not investor-level.',
          },
          {
            question: 'STT on transactions executed on NSE IFSC or India INX is:',
            options: [
              'Same as domestic exchanges',
              'Higher than domestic',
              'Zero',
              'Variable based on volume',
            ],
            correctAnswer: 2,
            explanation:
              'STT and CTT are statutorily zero on transactions executed on IFSC stock exchanges. This is a structural cost advantage versus domestic exchanges where STT applies on equity delivery, F&O, and other transactions.',
          },
          {
            question: 'For a resident Indian, capital gain on a GIFT USD fund is computed in:',
            options: [
              'USD only — no INR conversion',
              'INR using prescribed conversion methodology, including currency effect',
              'A 50/50 USD-INR blend',
              'Whichever is lower',
            ],
            correctAnswer: 1,
            explanation:
              'For residents, capital gain or loss on USD-denominated foreign-source assets is computed in INR using the prescribed conversion rules. Currency-driven gain is part of the taxable amount.',
          },
        ],
        summaryNotes: [
          'IFSC tax framework is layered — entity-level (80LA) + transaction-level (zero STT/CTT, GST zero-rating) + instrument-specific (exemptions for non-residents).',
          'Resident investors get partial advantage primarily through lower fund expense ratios; they do not get a blanket "tax-free" treatment.',
          'Non-resident investors get the deepest exemptions on specified instruments — making GIFT competitive with Singapore/Dubai.',
          'USD/INR movement is part of taxable capital gain for residents — distributors must explain this clearly.',
          'Always recommend consulting a qualified CA for instrument-specific tax computation; avoid generic tax-arbitrage marketing.',
        ],
        relatedTopics: ['what-is-gift-city', 'gift-products-lrs', 'gift-usd-funds', 'lrs-compliance-deep'],
      },
    },
    {
      id: 'gift-distributor-workflow',
      title: 'GIFT Product Selection & Distributor Workflow',
      slug: 'gift-distributor-workflow',
      content: {
        definition:
          'The GIFT distributor workflow is the end-to-end operational chain by which an MFD or empanelled distributor sources, KYC-onboards, advises, executes, and post-trade services GIFT IFSC products for resident and non-resident clients. It spans empanelment with IFSCA-registered AMCs, banking units (IBUs), and insurance carriers; FATCA/CRS-compliant client onboarding; suitability assessment; LRS-routed USD remittance through AD banks; ongoing reporting; and redemption/repatriation pathway management.',
        explanation:
          'Empanelment is the first operational gate. An MFD seeking to distribute GIFT products must execute distribution agreements with each IFSC AMC, IFSC Banking Unit (IBU), or IFSC insurance carrier whose products it intends to offer; the MFD must also obtain IFSCA-recognised distributor status where applicable, and ensure that the underlying ARN (in Trustner\'s case, ARN-286886) and KYD compliance are current. Some IFSC entities additionally require the distributor to complete product-specific certification or training before granting empanelment. KYC for GIFT products is a stacked KYC: standard SEBI/CKYC for the Indian investor identity, supplemented by FATCA self-declaration (Form W-9 for US persons / W-8 BEN equivalent for non-US persons), CRS self-certification for tax-residency disclosure, and additional source-of-funds documentation for high-ticket commitments. The distributor must verify and retain all KYC artefacts for the regulatory retention period; gaps here are the most common audit finding. Suitability assessment is a critical professional step: the distributor must document why a GIFT product is appropriate for the client compared with domestic or other international alternatives. Suitability factors include: (i) goal currency — GIFT USD products fit USD-goal liabilities like overseas education, foreign property, NRI inheritance planning; (ii) risk profile — USD equity volatility plus currency risk requires higher risk tolerance than domestic equity for the same notional; (iii) liquidity horizon — most GIFT products are best deployed for 5+ year horizons; (iv) tax residency — non-residents capture the deepest tax benefits, residents get partial. The distributor should produce a written suitability rationale and have it acknowledged by the client. USD remittance mechanics: the distributor coordinates with the client and the AD bank to execute Form A2-driven LRS remittance to the IFSC entity\'s designated account; subscription confirmation comes from the IFSC entity post-credit; units are allotted at the applicable NAV per the scheme\'s cut-off mechanics. Redemption and repatriation: redemption proceeds are paid in USD to the investor\'s designated USD account (which can be an IFSC investment account or onshore foreign-currency account); the investor either retains USD for future deployment or repatriates to INR through the AD bank, with capital gains tax computation triggered. Ongoing compliance reporting: the distributor must support clients with information needed for Schedule FA disclosure, OPI reporting where applicable, and TCS reconciliation in advance tax filing. Common operational issues include: subscription delays due to source-of-funds queries from AD banks, NAV cut-off mismatches between LRS remittance settlement and IFSC subscription dates, FATCA classification errors leading to subscription rejection, and reconciliation gaps between USD redemption proceeds and INR conversion at repatriation. Trustner positions GIFT distribution as a value-added service layered on its ARN-286886 MFD practice — clients receive integrated domestic, GIFT, and goal-planning advisory through a single relationship, with the MFD trail commission structure preserving alignment of advisor incentives with long-term investor outcomes.',
        realLifeExample:
          'Trustner empanels with IFSC AMC "X" in early 2026. A client (resident Indian, age 42) approaches Trustner in May 2026 with a goal of USD 75,000 over 8 years for his daughter\'s overseas undergraduate fees. Workflow: (1) Suitability — Trustner documents that USD denomination matches the USD liability, 8-year horizon supports equity-heavy allocation, client risk profile permits USD equity exposure, LRS quota available; (2) KYC — existing CKYC verified; FATCA self-declaration captured (non-US person); CRS captured (sole tax residency: India); source-of-funds documented; (3) Product selection — recommended a 70:30 USD Global Equity : USD Global Bond mix across two GIFT funds totalling USD 60,000 initial commitment, balance to be added in tranches; (4) Execution — Form A2 prepared with the AD bank; TCS computed (₹84/USD, ₹50.4 lakh remittance, TCS at 20% on ₹43.4 lakh = ₹8.68 lakh, creditable); subscription confirmed at T+2; (5) Ongoing — quarterly performance reviews, annual rebalancing, FY-end Schedule FA disclosure support; (6) Year 8 — staggered redemption over 12-18 months pre-fee-deadline to manage USD/INR risk; pay fees directly from the IFSC USD account where the university accepts USD wires, minimising conversion drag. End-to-end the MFD relationship covers domestic + GIFT + goal advisory under one trail-commission structure.',
        keyPoints: [
          'Empanelment with each IFSC AMC/IBU/insurer + IFSCA distributor recognition where applicable.',
          'Stacked KYC: SEBI/CKYC + FATCA + CRS + source-of-funds for high-ticket commitments.',
          'Suitability documentation must justify GIFT vs domestic vs other international alternatives.',
          'LRS execution via Form A2 through AD bank; TCS cash-flow impact must be flagged to client.',
          'Redemption in USD; investor decides retain-USD vs repatriate-INR with tax implications.',
          'Distributor supports Schedule FA, OPI reporting, and TCS reconciliation at year-end.',
          'Trail-commission structure on regular plans aligns advisor incentives with long-term investor outcomes.',
        ],
        faq: [
          {
            question: 'Does an MFD need a separate licence to distribute GIFT products?',
            answer:
              'The MFD operates under its existing AMFI ARN for the relationship, but each GIFT IFSC entity (AMC, IBU, insurer) requires its own empanelment agreement, and IFSCA may require distributor recognition for certain product categories. Trustner (ARN-286886) maintains active empanelments with the IFSC entities whose products it distributes.',
          },
          {
            question: 'What if a client is a US person — can they invest through GIFT?',
            answer:
              'US-person status (citizenship, green card, or substantial-presence test) triggers FATCA reporting and many IFSC entities decline US-person subscriptions to avoid FATCA Form 8966 reporting complexity. The distributor must capture FATCA self-declaration upfront and route the client to a US-person-friendly product or decline with clear documentation.',
          },
          {
            question: 'How does the distributor get paid on GIFT products?',
            answer:
              'Distribution economics on GIFT products typically follow trail-commission structures embedded in the regular plan expense ratio, similar to onshore mutual funds. Trustner positions clients in the regular plan structure to maintain ongoing advisory engagement — service quality (rebalancing, behavioural coaching, tax support, repatriation planning) is the value the trail commission funds.',
          },
          {
            question: 'What is the most common operational error in GIFT subscriptions?',
            answer:
              'NAV cut-off mismatches — the client\'s LRS remittance settles in the IFSC entity\'s account on T+1 or T+2, but the entity\'s NAV cut-off may have been crossed for that day, pushing the allotment to a later NAV. Distributors should pre-check cut-off timings with the AD bank and the IFSC entity to align remittance timing with desired NAV.',
          },
        ],
        mcqs: [
          {
            question: 'Which document is the foundational instrument for an LRS remittance to a GIFT entity?',
            options: ['Form 15CA only', 'Form A2 with the AD bank', 'A general consent letter', 'No documentation needed'],
            correctAnswer: 1,
            explanation:
              'Form A2 is the foundational LRS remittance application submitted to the AD Category-I bank, accompanied by PAN and supporting documents. Form 15CA may also be required online but A2 is the primary instrument.',
          },
          {
            question: 'FATCA self-declaration is captured during GIFT onboarding to:',
            options: [
              'Determine TCS rate',
              'Identify US-person status and determine FATCA reportability',
              'Set the LRS limit',
              'Compute GST',
            ],
            correctAnswer: 1,
            explanation:
              'FATCA self-declaration captures the client\'s US-person status (or non-US-person status). US persons trigger reporting under the India-US IGA, and many IFSC entities decline US-person subscriptions to avoid the reporting burden.',
          },
          {
            question: 'A resident Indian client redeems a GIFT USD fund. The proceeds are credited:',
            options: [
              'Automatically to the client\'s INR account',
              'In USD to a designated USD account; investor decides retain-USD or repatriate-INR',
              'Held in escrow indefinitely',
              'Forfeited if not claimed in 24 hours',
            ],
            correctAnswer: 1,
            explanation:
              'Redemption proceeds are paid in USD to the investor\'s designated USD account (IFSC investment account or onshore foreign-currency account). The investor then chooses to retain USD for future deployment or repatriate to INR through the AD bank, with capital gains tax applying.',
          },
        ],
        summaryNotes: [
          'Distributor workflow = Empanelment + Stacked KYC + Suitability + LRS execution + Ongoing reporting + Redemption.',
          'Each step has audit pinch-points; documentation discipline is the difference between a clean practice and a regulatory finding.',
          'MFD trail commission on GIFT regular plans funds the long-term service relationship — behavioural coaching, rebalancing, tax support, repatriation planning.',
          'Distributors should document a written suitability rationale for every GIFT recommendation.',
          'Trustner (ARN-286886) integrates GIFT distribution within its broader MFD advisory framework — single relationship, multi-jurisdiction reach.',
        ],
        relatedTopics: ['what-is-gift-city', 'gift-products-lrs', 'lrs-compliance-deep', 'gift-tax-optimization'],
      },
    },
  ],
};
