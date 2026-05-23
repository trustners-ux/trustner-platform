import { LearningModule } from '@/types/learning';

export const investorServicesModule: LearningModule = {
  id: 'investor-services',
  title: 'Investor Services & Transactions',
  slug: 'investor-services',
  icon: 'Users',
  description:
    'Master NFO processes, KYC requirements, transaction types, cut-off timings, account statements, and investor grievance mechanisms. The highest-weightage operational topic in NISM VA.',
  level: 'intermediate',
  color: 'from-violet-500 to-purple-600',
  estimatedTime: '65 min',
  sections: [
    // ─── Section 1: NFO Process ──────────────────────────────────────────
    {
      id: 'nfo-process',
      title: 'NFO Process — New Fund Offer Explained',
      slug: 'nfo-process',
      content: {
        definition:
          'A New Fund Offer (NFO) is the first-time subscription window during which an Asset Management Company (AMC) offers units of a newly launched mutual fund scheme to investors at a fixed face value, typically ₹10 per unit. The NFO period is regulated by SEBI and acts as the initial capital-raising phase before the scheme opens for ongoing subscriptions at NAV-based pricing.',
        explanation:
          'An NFO can be thought of as the "grand opening" of a new mutual fund scheme. When an AMC identifies a market opportunity — such as a new sectoral theme like electric vehicles or a regulatory change that enables a new category — the AMC designs a scheme, obtains SEBI approval, and then opens an NFO window for investors to subscribe. During the NFO period, every investor gets units at face value (typically ₹10). After the NFO closes, the fund manager deploys the collected corpus into the market, and the scheme reopens for purchase/redemption at NAV-based pricing. A critical mistake new distributors often make is selling NFOs like IPOs. An IPO can list at a premium because the stock price reflects market demand. However, a mutual fund NFO unit at ₹10 has no inherent advantage over an existing fund with NAV of ₹500 — the NAV is simply a per-unit accounting number. What matters is the portfolio quality and the fund manager, not the face value. SEBI mandates that the NFO period for an open-ended scheme must be a minimum of 15 days and a maximum of 15 days (effectively exactly 15 days). For close-ended schemes, it can extend up to 30 days. After the NFO closes, unit allotment must happen within 5 business days. Additionally, SEBI requires a minimum subscription of ₹10 crore for open-ended schemes and ₹20 crore for close-ended schemes for the NFO to be considered successful.',
        realLifeExample:
          'Consider the case of a sub-broker in Nashik whose AMC relationship manager informs him about a new Thematic Fund — "MF Green Energy Opportunities Fund." The NFO opens on March 1st and closes on March 15th. One of his clients, Sunita, invests ₹2,00,000 during the NFO at ₹10 per unit, receiving 20,000 units. Her neighbour Priya asks: "Is this like buying shares in an IPO? Will it list at ₹15?" The distributor explains that after the NFO closes and the fund manager invests the money, the NAV will be around ₹10 minus expenses — perhaps ₹9.95. There is no listing gain in mutual funds. The real value comes from how well the fund manager picks green energy stocks over the next 3-5 years. Two weeks after the NFO closes, Sunita receives her allotment confirmation — 20,000 units credited to her folio. The scheme reopens for continuous sale and repurchase at the prevailing NAV, which on day one of reopening is ₹9.97 (after NFO expense deductions).',
        keyPoints: [
          'NFO units are offered at face value, typically ₹10 per unit — this does NOT mean NFO units are "cheap" compared to existing funds with higher NAVs',
          'NFO period for open-ended schemes: minimum 15 days, maximum 15 days (effectively fixed at 15 days)',
          'NFO period for close-ended schemes: can extend up to 30 days',
          'Allotment of units must happen within 5 business days of NFO closure',
          'SEBI approval is mandatory before any AMC can launch an NFO — the Scheme Information Document (SID) must be filed and approved',
          'NFO is NOT like an IPO — there is no "listing gain" in mutual funds; NAV reflects actual portfolio value minus expenses',
          'The AMC must appoint a fund manager and disclose the investment objective, benchmark, and expense structure in the SID before the NFO opens',
          'Minimum subscription: ₹10 crore for open-ended schemes, ₹20 crore for close-ended schemes — failure to collect this triggers mandatory refund within 5 business days',
        ],
        faq: [
          {
            question: 'Should I recommend NFOs to my clients over existing funds?',
            answer:
              'Not automatically. An NFO makes sense only if it offers a genuinely new investment strategy or category not available in existing schemes. If a similar fund with a 5-year track record already exists, the existing fund is usually a better choice because it has a proven performance history. Distributors should avoid the common pitfall of pushing NFOs solely for higher initial commissions.',
          },
          {
            question: 'What happens if the NFO does not collect enough money?',
            answer:
              'SEBI requires a minimum subscription of ₹10 crore for open-ended schemes and ₹20 crore for close-ended schemes. If the AMC fails to collect this minimum amount during the NFO period, the entire amount collected must be refunded to investors within 5 business days. The scheme is then considered to have failed and does not launch.',
          },
          {
            question: 'Can I invest in an NFO through SIP?',
            answer:
              'No, SIP cannot be started during the NFO period. SIP can only begin after the scheme reopens for continuous sale and repurchase post-NFO. During the NFO window, only lumpsum investments are accepted.',
          },
          {
            question: 'Is there an exit load during the NFO period?',
            answer:
              'There is no exit load during the NFO period because redemptions are not allowed until the scheme reopens. For open-ended funds, once the scheme reopens (typically within 5 business days of allotment), the standard exit load structure applies as mentioned in the SID.',
          },
          {
            question: 'What is the difference between NFO price and NAV?',
            answer:
              'The NFO price is the fixed face value (₹10) at which units are offered during the subscription window. NAV (Net Asset Value) is the daily computed per-unit value once the scheme is operational. After the NFO, units are bought and sold at NAV, not face value. A fund with NAV ₹500 is not "expensive" — it simply means the fund has grown over time.',
          },
        ],
        mcqs: [
          {
            question:
              'The maximum NFO period for an open-ended mutual fund scheme as per SEBI regulations is:',
            options: ['10 days', '15 days', '30 days', '45 days'],
            correctAnswer: 1,
            explanation:
              'SEBI mandates that the NFO period for open-ended schemes must be exactly 15 days (minimum 15, maximum 15). For close-ended schemes, it can be up to 30 days. This is a frequently tested NISM question.',
          },
          {
            question:
              'After the closure of an NFO, allotment of units must be completed within:',
            options: [
              '3 business days',
              '5 business days',
              '7 business days',
              '10 business days',
            ],
            correctAnswer: 1,
            explanation:
              'SEBI requires that unit allotment after NFO closure must be completed within 5 business days. The minimum subscription amount is ₹10 crore for open-ended schemes and ₹20 crore for close-ended schemes. If these thresholds are not met, refunds must happen within 5 business days.',
          },
          {
            question:
              'Ramesh invested ₹50,000 in an NFO at ₹10 per unit. His friend Suresh invested ₹50,000 in an existing fund at NAV ₹250. Which statement is correct?',
            options: [
              'Ramesh got a better deal because he paid only ₹10 per unit',
              'Suresh got fewer units, so his investment is inferior',
              'Both investments are equivalent in value — ₹50,000 each — and future returns depend on portfolio performance, not the NAV or face value',
              'NFO investments always outperform because they start at face value',
            ],
            correctAnswer: 2,
            explanation:
              'The NAV or face value has no bearing on whether an investment is "cheap" or "expensive." Ramesh gets 5,000 units at ₹10 and Suresh gets 200 units at ₹250 — both have invested ₹50,000 and their returns depend entirely on portfolio performance. This is a classic NISM concept tested to bust the "low NAV = cheap" myth.',
          },
          {
            question: 'Which of the following is TRUE about an NFO?',
            options: [
              'NFO units can be redeemed during the NFO period itself',
              'SIP can be started during the NFO period',
              'SEBI approval is required before launching an NFO',
              'NFO always guarantees a listing premium like an IPO',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI approval is mandatory before any AMC can launch an NFO. The AMC must file the Scheme Information Document (SID) and Key Information Memorandum (KIM) with SEBI. NFO units cannot be redeemed during the NFO period, SIP cannot start during NFO, and there is no concept of a listing premium in mutual funds.',
          },
        ],
        summaryNotes: [
          'NFO = first-time subscription window at face value (₹10/unit) — not a "discount" or "cheap" entry point',
          'Open-ended NFO period is exactly 15 days; close-ended can go up to 30 days — memorize this for the exam',
          'Allotment within 5 business days of NFO closure; minimum subscription: ₹10 crore (open-ended), ₹20 crore (close-ended); refund within 5 days if not met',
          'SEBI approval mandatory before NFO launch — SID and KIM must be filed and approved',
          'NFO ≠ IPO: no listing gain in mutual funds; NAV reflects actual portfolio value, not market demand',
        ],
        relatedTopics: ['kyc-requirements', 'application-form', 'transaction-types'],
      },
    },

    // ─── Section 2: KYC Requirements ─────────────────────────────────────
    {
      id: 'kyc-requirements',
      title: 'KYC Requirements — CKYC, In-Person Verification',
      slug: 'kyc-requirements',
      content: {
        definition:
          'Know Your Customer (KYC) is the mandatory identity and address verification process that every mutual fund investor must complete before making their first investment. KYC is governed by SEBI regulations and the Prevention of Money Laundering Act (PMLA), and is facilitated through KYC Registration Agencies (KRAs) and the Central KYC (CKYC) registry maintained by CERSAI (Central Registry of Securitisation Asset Reconstruction and Security Interest of India).',
        explanation:
          'KYC is the gatekeeper of every mutual fund transaction — no KYC, no investment. With the evolution of CKYC and eKYC, the process has become far smoother than the paperwork-heavy system of earlier years, though compliance requirements are stricter than ever. Here is the complete picture. Every investor must be KYC-compliant before their first mutual fund purchase. The primary document is PAN (Permanent Account Number) — this is mandatory for all investments. However, there is an important exception: for investments below ₹50,000 in a rolling 12-month period, PAN is not required (PAN-exempt category). In such cases, any valid government-issued photo ID works. CKYC (Central KYC) is now the primary KYC mechanism for the financial sector. Once an investor completes KYC with any financial institution (bank, AMC, broker), the KYC record is uploaded to the CKYC registry maintained by CERSAI with a unique 14-digit KYC Identification Number (KIN). Any other financial entity can verify KYC using this KIN — no need to submit documents again. KRA-KYC (through KYC Registration Agencies like CAMS KRA, KFintech KRA) also remains in operation for the securities market. eKYC uses Aadhaar-based authentication (OTP or biometric) for quick verification, and SEBI permits eKYC investments of up to ₹50,000 per year per AMC for individuals. For higher amounts, full KYC is required. In-Person Verification (IPV) is an important step — it confirms that the person submitting the application is indeed the same person whose documents are attached. Notably, IPV can now be completed via video KYC as well, in addition to physical verification. SEBI allows AMFI-registered distributors to perform IPV, which is a significant operational advantage for MFDs and sub-brokers.',
        realLifeExample:
          'Consider the case of Deepak, a new MFD in Jaipur, onboarding his first client — Mrs. Kamla Sharma, a retired teacher who wants to invest ₹3,00,000 in a debt fund. Deepak collects her PAN card copy, Aadhaar card, a cancelled cheque, and a passport-size photo. He fills the KYC form and performs In-Person Verification (IPV) himself — verifying Mrs. Sharma\'s original documents, stamping "IPV done" on the form, signing it with his AMFI Registration Number (ARN), and noting the date. Alternatively, Deepak could complete IPV via video KYC if an in-person meeting is not feasible. The KYC application goes to the CKYC registry via the KRA (say, CAMS KRA). Within 2-3 days, her KYC is verified and a 14-digit KIN (KYC Identification Number) is generated. Now, if Mrs. Sharma wants to open a demat account or invest with another AMC, she simply provides her KIN — no need to submit documents again. Deepak also has a client, Ravi, a college student who wants to start a small SIP of ₹500/month. Since Ravi\'s total investment will be under ₹50,000 in the year, Deepak processes it as PAN-exempt using Ravi\'s Aadhaar card for eKYC.',
        keyPoints: [
          'KYC is mandatory for ALL mutual fund investors — no exceptions, no shortcuts',
          'PAN is the primary identification document; PAN exemption applies only for investments below ₹50,000 in a rolling 12-month period',
          'CKYC (Central KYC) provides a single KYC record across all financial sectors with a 14-digit KIN',
          'eKYC (Aadhaar-based) has an investment cap of ₹50,000 per year per AMC — beyond this, full KYC is required',
          'In-Person Verification (IPV) can be done by AMFI-registered distributors or via video KYC — this is a key operational benefit for MFDs',
          'KRA (KYC Registration Agency) processes and maintains KYC records — major KRAs include CAMS KRA, KFintech KRA, and NDML',
          'KYC must be completed BEFORE the first transaction — units cannot be allotted to a non-KYC-compliant investor',
          'For micro-SIPs (below ₹50,000 annually), simplified KYC with any government photo ID is sufficient',
        ],
        faq: [
          {
            question: 'Can I do KYC for my client or does the client have to do it themselves?',
            answer:
              'An AMFI-registered distributor can facilitate the KYC process — collecting documents, filling the form, and performing In-Person Verification (IPV), either physically or via video KYC. However, the client must sign the KYC form themselves. Distributors cannot forge or sign on behalf of the client. The IPV privilege is a significant advantage for distributors.',
          },
          {
            question: 'What is the difference between KRA KYC and CKYC?',
            answer:
              'KRA KYC is specific to the securities market (mutual funds, broking, etc.) and is maintained by KYC Registration Agencies like CAMS KRA or KFintech KRA. CKYC is a central registry that covers all financial sectors — banking, insurance, mutual funds, NBFCs — and is maintained by CERSAI. The industry is progressively moving towards CKYC as the unified standard.',
          },
          {
            question: 'What if a client has done KYC with a bank — do they need to do it again for mutual funds?',
            answer:
              'If the client has completed CKYC with their bank and has a KIN (KYC Identification Number), they do not need to redo the full KYC process. The AMC/RTA can pull their KYC record from the CKYC registry using the KIN. However, if only KRA KYC was done, it may need to be migrated or re-verified depending on the AMC\'s requirements.',
          },
          {
            question: 'Is Aadhaar mandatory for mutual fund KYC?',
            answer:
              'Aadhaar is not mandatory for full KYC — PAN is the primary mandatory document. However, for eKYC (Aadhaar-based electronic KYC), Aadhaar is required. eKYC is convenient but has the ₹50,000 per AMC per year investment cap. For large investments, full KYC with PAN, address proof, and IPV is recommended.',
          },
        ],
        mcqs: [
          {
            question:
              'An investor wants to invest ₹40,000 in a mutual fund through eKYC. Which of the following is correct?',
            options: [
              'eKYC is not allowed for mutual fund investments',
              'eKYC allows investment up to ₹50,000 per year per AMC — so ₹40,000 is within the limit',
              'eKYC has no investment limit',
              'eKYC is only for NRI investors',
            ],
            correctAnswer: 1,
            explanation:
              'SEBI allows eKYC (Aadhaar-based) for mutual fund investments up to ₹50,000 per year per AMC. Since ₹40,000 is within this limit, the investment can proceed through eKYC. For amounts exceeding ₹50,000, full KYC (with PAN, address proof, and IPV) is required.',
          },
          {
            question:
              'In-Person Verification (IPV) for mutual fund KYC can be performed by:',
            options: [
              'Only the AMC office',
              'Only the SEBI-registered RTA',
              'AMFI-registered mutual fund distributors',
              'Any individual with a valid PAN',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI allows AMFI-registered mutual fund distributors (MFDs) to perform In-Person Verification for their clients, either physically or via video KYC. This is a significant operational advantage that allows distributors to complete the KYC process at the investor\'s location without requiring a visit to the AMC or RTA office.',
          },
          {
            question: 'The CKYC system is maintained by:',
            options: ['SEBI', 'AMFI', 'CERSAI', 'Reserve Bank of India'],
            correctAnswer: 2,
            explanation:
              'The Central KYC (CKYC) registry is maintained by CERSAI (Central Registry of Securitisation Asset Reconstruction and Security Interest of India). CKYC was introduced to create a unified KYC system across all financial sectors — banking, insurance, securities, and NBFCs.',
          },
          {
            question:
              'For investments below ₹50,000 in a rolling 12-month period, which document is NOT mandatory?',
            options: [
              'Any valid government photo ID',
              'PAN card',
              'Aadhaar card',
              'Passport',
            ],
            correctAnswer: 1,
            explanation:
              'PAN is exempt for investments below ₹50,000 in a rolling 12-month period. In such cases, any valid government-issued photo ID (Aadhaar, voter ID, driving licence, passport) is sufficient. This PAN-exempt category was created to encourage small investors and micro-SIPs.',
          },
        ],
        summaryNotes: [
          'KYC = mandatory gatekeeper — PAN is primary document; PAN exempt only for investments under ₹50,000/year',
          'CKYC gives a 14-digit KIN valid across all financial sectors; maintained by CERSAI',
          'eKYC (Aadhaar-based) capped at ₹50,000 per AMC per year — beyond this, full KYC is mandatory',
          'Distributors with AMFI registration can perform IPV (physically or via video KYC) — a key operational advantage for sub-brokers',
          'KYC must be completed BEFORE the first transaction — no allotment to non-KYC investors',
        ],
        relatedTopics: ['application-form', 'special-categories', 'nfo-process'],
      },
    },

    // ─── Section 3: Application Form ─────────────────────────────────────
    {
      id: 'application-form',
      title: 'Application Form — How to Fill Correctly',
      slug: 'application-form',
      content: {
        definition:
          'The mutual fund application form is the official document (physical or digital) through which an investor subscribes to a mutual fund scheme. It captures essential investor details including personal identification, bank mandate, nomination, scheme selection, and plan/option preferences. Correct completion of this form is critical — even a small error can lead to rejection, delayed processing, or incorrect allotment.',
        explanation:
          'Hundreds of applications get rejected each year due to avoidable mistakes — wrong PAN format, missing bank details, or an unsigned nomination section. A distributor\'s job is not just selling the fund; it is ensuring the paperwork is flawless. Here is a field-by-field guide. The mandatory fields are: investor name (as per PAN), PAN number, date of birth, contact details (mobile + email), bank account details (account number, IFSC, bank name — for redemption credits), and nomination. For joint holdings, the first holder is the primary person for all purposes — tax liability, communication, and redemption proceeds go to the first holder. The second and third holders are essentially for succession purposes. SEBI has made nomination mandatory for all new folios. If a client does not want to nominate anyone, they must explicitly opt out by signing a declaration. For existing folios, investors must either add a nominee or formally opt out — this is now a regulatory requirement. Bank mandate is crucial because this is where redemption money will be credited. A mismatch between the investor name and bank account name is the number one reason for delayed redemption credits. The cancelled cheque should be verified carefully. Note that a stamp duty of 0.005% is applicable on all purchase transactions (effective since July 2020). Online applications through AMC websites, MFD platforms, BSE StAR MF, MFU (Mutual Fund Utility), or MFCentral have simplified the process significantly. Pre-populated fields, OTP verification, and digital signatures have reduced errors. However, the underlying data requirements remain the same.',
        realLifeExample:
          'For example, consider Amit, an MFD in Lucknow, who sits with his client Mr. Harish Gupta to fill a physical application form for an HDFC Balanced Advantage Fund. Amit goes through each section: (1) Name: "HARISH GUPTA" — exactly as printed on PAN card, not "H. Gupta" or "Harish K Gupta." (2) PAN: ABCPG1234H — Amit photocopies the PAN card and attaches it. (3) Bank details: Amit takes Harish\'s cancelled cheque — SBI account ending 4521, IFSC: SBIN0001234. (4) Nomination: Harish nominates his wife Sunita Gupta (100%). Amit ensures Harish signs the nomination section — this is now mandatory for all new folios per SEBI norms. (5) Mode: Growth option, Direct plan (Harish is investing through Amit\'s ARN, so it should be Regular plan — Amit catches this and selects Regular). (6) Amount: ₹5,00,000 lumpsum. A stamp duty of 0.005% (₹25) is applicable on this purchase. Amit double-checks everything, gets Harish\'s signature on all required places, stamps his ARN and EUIN, and submits to the AMC collection centre. Two days later, 4,975.12 units are allotted at NAV ₹100.50. Had Amit made even one error — say, writing the wrong IFSC code — Harish\'s future redemption would bounce back, causing frustration and erosion of trust.',
        keyPoints: [
          'Investor name must match PAN card exactly — even a minor mismatch (initials, middle name) can cause rejection',
          'First holder in joint accounts is responsible for all tax liabilities and receives all communication and redemption proceeds',
          'Bank mandate (account number + IFSC) is critical — mismatch between investor name and bank account name delays redemptions',
          'Nomination is mandatory for new folios as per SEBI — if client refuses, they must sign an explicit opt-out declaration',
          'Up to 3 nominees can be specified with percentage allocation (must total 100%)',
          'Common rejection reasons: unsigned form, PAN mismatch, missing bank details, incorrect scheme name, no nomination declaration',
          'Stamp duty of 0.005% is applicable on all purchase transactions (since July 2020)',
          'Online applications via BSE StAR MF, MFU, MFCentral, or AMC websites reduce errors through pre-population and validation',
          'Distributor must stamp ARN (AMFI Registration Number) and EUIN (Employee Unique Identification Number) on every application',
        ],
        faq: [
          {
            question: 'What if the client\'s name on PAN and Aadhaar are slightly different?',
            answer:
              'The name on the mutual fund application must match the PAN card exactly. If there is a discrepancy between PAN and Aadhaar, advise the client to get one of them corrected before applying. The RTA will cross-verify with PAN, and a mismatch will lead to KYC rejection or delayed processing.',
          },
          {
            question: 'Can a client have multiple folios with the same AMC?',
            answer:
              'Yes, a client can have multiple folios with the same AMC — for example, one for individual holding and another as joint holder with a spouse. However, AMCs prefer consolidation and may offer folio merging. Each folio is linked to the same PAN but can have different bank mandates and nominees.',
          },
          {
            question: 'What is the difference between Direct and Regular plan on the application form?',
            answer:
              'Direct plan means the investor is investing without a distributor — no ARN is stamped, and the expense ratio is lower. Regular plan includes distributor commission in the expense ratio and requires an ARN to be mentioned. A distributor\'s clients should always be in the Regular plan. If a client fills Direct plan on the distributor\'s form, the transaction goes through without the ARN and the distributor earns zero commission.',
          },
          {
            question: 'Is a wet signature still required on physical forms?',
            answer:
              'Yes, for physical application forms, a wet signature (original ink signature) is mandatory. Photocopied or digitally printed signatures are not accepted. For online applications, digital signatures (DSC or e-sign via Aadhaar OTP) are accepted as valid alternatives.',
          },
          {
            question: 'What happens if nomination is not filled in the application form?',
            answer:
              'As per SEBI regulations, nomination is mandatory for all new mutual fund folios. If the investor does not wish to nominate, they must explicitly sign the opt-out declaration section. Applications without either a nominee or a signed opt-out declaration will be rejected. For existing folios, SEBI now requires investors to either add a nominee or formally opt out — this is no longer optional. Additionally, SEBI has introduced a voluntary debit freeze facility for folios (effective April 30, 2026), allowing investors to freeze debits from their folio as an added security measure.',
          },
        ],
        mcqs: [
          {
            question:
              'In a joint holding mutual fund account, which holder is liable for tax on capital gains?',
            options: [
              'All holders equally',
              'The first (primary) holder',
              'The holder with the highest income',
              'The holder who initiated the investment',
            ],
            correctAnswer: 1,
            explanation:
              'In joint holding accounts, the first (primary) holder is responsible for all tax liabilities on capital gains. All communication, account statements, and redemption proceeds are also directed to the first holder. This is why the order of holders on the application form matters significantly.',
          },
          {
            question:
              'A mutual fund application form is rejected. The most likely reason could be:',
            options: [
              'The investor chose the Growth option instead of IDCW',
              'The investor\'s name on the form does not match the PAN card',
              'The investor is above 60 years of age',
              'The investment amount is more than ₹10,00,000',
            ],
            correctAnswer: 1,
            explanation:
              'Name mismatch with PAN is one of the most common reasons for application rejection. The RTA cross-verifies the investor name with PAN records during processing. Growth vs IDCW is a valid choice, age is not a barrier, and there is no maximum investment limit that causes rejection.',
          },
          {
            question:
              'As per SEBI regulations, nomination in mutual fund folios is:',
            options: [
              'Optional for all investors',
              'Mandatory for new folios — opt-out requires signed declaration',
              'Only required for investments above ₹10 lakh',
              'Only required for senior citizens',
            ],
            correctAnswer: 1,
            explanation:
              'SEBI has made nomination mandatory for all new mutual fund folios. If an investor does not wish to nominate anyone, they must explicitly sign the opt-out declaration on the form. This ensures clarity on unit transmission in case of the investor\'s death.',
          },
        ],
        summaryNotes: [
          'Name must match PAN exactly; bank details must match investor name — mismatches are the top rejection reasons',
          'First holder = tax liability + communication + redemption proceeds; order of holders matters',
          'Nomination is SEBI-mandatory for new folios — no nominee requires a signed opt-out declaration',
          'Always stamp ARN and EUIN on every application — missing ARN means zero commission for the distributor',
          'Stamp duty of 0.005% on all purchase transactions (since July 2020); SEBI voluntary debit freeze facility effective April 30, 2026',
          'Online platforms (BSE StAR MF, MFU, MFCentral) reduce errors but the data requirements remain the same',
        ],
        relatedTopics: ['kyc-requirements', 'transaction-types', 'non-financial-transactions'],
      },
    },

    // ─── Section 4: Transaction Types ────────────────────────────────────
    {
      id: 'transaction-types',
      title: 'Types of Transactions — Purchase, Redemption, Switch, STP',
      slug: 'transaction-types',
      content: {
        definition:
          'Mutual fund transactions are the operational actions through which investors buy, sell, or move their investments. The four primary transaction types are: Purchase (subscription of new units), Redemption (sale of existing units for cash), Switch (transfer from one scheme to another within the same AMC), and STP (Systematic Transfer Plan — automatic periodic switch from one scheme to another). Each transaction type has specific NAV applicability, settlement timelines, and tax implications.',
        explanation:
          'These four transaction types form the bread and butter of daily operations for any mutual fund distributor. Every client interaction ultimately results in one of these transactions, making thorough understanding essential. Purchase or Subscription is when an investor buys units — either as a lumpsum (one-time) or through SIP (recurring). The investor gets units at the applicable NAV based on cut-off time rules. A stamp duty of 0.005% applies to all purchase transactions. Redemption is when the investor sells units for cash. It can be full redemption (all units) or partial (either by specifying an amount or a number of units). Redemption proceeds for equity funds are credited within T+3 business days, and for liquid/overnight funds within T+1 business day. A Switch is essentially two transactions bundled together: redemption from the source scheme + purchase in the target scheme, both within the same AMC. A critical point that new distributors often miss is that a switch has TAX implications on BOTH legs. The redemption from the source scheme triggers capital gains tax, and the purchase in the target scheme starts a new holding period. STP (Systematic Transfer Plan) is an automated switch at regular intervals — usually used to move money gradually from a liquid/debt fund into an equity fund. Each STP installment is treated as a separate switch transaction for tax purposes. Redemption timelines are critical: equity and balanced funds settle within T+3 business days, liquid and overnight funds within T+1. ELSS funds have a mandatory 3-year lock-in — no redemption allowed before that.',
        realLifeExample:
          'Consider the case of Neeta, an MFD in Mumbai, who manages the portfolio of Mr. Vinod Mehta (age 58, planning for retirement in 2 years). Here are the transactions Neeta processes in one quarter:\n\n1. Purchase: Vinod invests ₹5,00,000 lumpsum in ICICI Prudential Balanced Advantage Fund. Units allotted: 10,204 at NAV ₹49.00. A stamp duty of 0.005% (₹25) is deducted.\n\n2. STP Setup: Vinod also parks ₹10,00,000 in Axis Liquid Fund and sets up a weekly STP of ₹50,000 into Axis Bluechip Fund. Every week, ₹50,000 worth of Axis Liquid units are redeemed and ₹50,000 is invested in Axis Bluechip — this will run for 20 weeks.\n\n3. Switch: Vinod wants to move his existing ₹3,00,000 from SBI Small Cap Fund to SBI Equity Hybrid Fund (both SBI AMC). Neeta processes a switch. Tax impact: the ₹3,00,000 in SBI Small Cap has grown from ₹2,00,000 — so ₹1,00,000 is long-term capital gain taxable at 12.5% (after ₹1.25 lakh exemption).\n\n4. Partial Redemption: Vinod needs ₹2,00,000 for a family function. Neeta redeems ₹2,00,000 from HDFC Flexi Cap Fund. The money reaches Vinod\'s bank in 2 business days (T+2, within the T+3 limit).\n\nNeeta informs Vinod that the switch and each STP installment are taxable events and advises him to share the transaction summary with his CA at year-end.',
        keyPoints: [
          'Purchase (Subscription): lumpsum or SIP — units allotted at applicable NAV based on cut-off time; stamp duty of 0.005% applies',
          'Redemption: full or partial (by amount or by units) — equity funds settle within T+3, liquid funds within T+1',
          'Switch: redemption of source scheme + purchase of target scheme within the SAME AMC — two transactions, two tax events',
          'STP: automated periodic switch — each installment is a separate transaction with separate tax implications',
          'Redemption proceeds are always credited to the registered bank account — no third-party payments allowed',
          'ELSS funds have a mandatory 3-year lock-in from the date of each installment — no premature redemption',
          'Exit load (if applicable) is deducted from redemption proceeds and credited back to the scheme, not the AMC',
          'For switch transactions, the total holding period restarts in the target scheme — critical for tax planning',
        ],
        faq: [
          {
            question: 'Is a switch between two schemes of the same AMC considered a taxable event?',
            answer:
              'Yes, absolutely. A switch is treated as redemption from the source scheme (triggering capital gains tax) and a fresh purchase in the target scheme. Many investors are unaware of this and get a tax shock at year-end. As a distributor, always warn clients about the tax impact before processing a switch.',
          },
          {
            question: 'Can I redeem from an ELSS fund before 3 years?',
            answer:
              'No. ELSS (Equity Linked Savings Scheme) has a mandatory 3-year lock-in period from the date of each investment. For SIP investments, each installment has its own 3-year lock-in. Units cannot be redeemed, switched, or pledged during the lock-in period.',
          },
          {
            question: 'What is the difference between STP and SIP?',
            answer:
              'SIP (Systematic Investment Plan) is a regular investment from the investor\'s bank account into a mutual fund. STP (Systematic Transfer Plan) is a regular transfer from one mutual fund scheme to another within the same AMC. STP source is a mutual fund; SIP source is a bank account. STP involves redemption + purchase (two tax events); SIP involves only purchase.',
          },
          {
            question: 'How long does it take to get redemption money in my bank account?',
            answer:
              'For equity and balanced/hybrid funds: within T+3 business days (typically T+2). For debt funds: within T+2 business days. For liquid and overnight funds: within T+1 business day. T is the transaction day (business day when redemption request is accepted at applicable NAV). Weekends and exchange holidays are excluded.',
          },
          {
            question: 'Can I switch from one AMC to another AMC?',
            answer:
              'No. A switch can only happen between two schemes of the SAME AMC. To move money from one AMC to another, the investor must redeem from the first AMC and then purchase in the second AMC — these are two separate transactions with separate settlement timelines.',
          },
        ],
        mcqs: [
          {
            question:
              'A switch transaction in mutual funds involves:',
            options: [
              'Only a purchase in the target scheme',
              'Only a redemption from the source scheme',
              'Redemption from the source scheme AND purchase in the target scheme — both with tax implications',
              'A transfer of units from one AMC to another',
            ],
            correctAnswer: 2,
            explanation:
              'A switch is a combination of two transactions: redemption from the source scheme and purchase in the target scheme, both within the same AMC. The redemption triggers capital gains tax, and the purchase starts a new holding period in the target scheme. This dual nature is frequently tested in NISM.',
          },
          {
            question:
              'Redemption proceeds from an equity mutual fund must be credited to the investor within:',
            options: [
              'T+1 business days',
              'T+2 business days',
              'T+3 business days',
              'T+5 business days',
            ],
            correctAnswer: 2,
            explanation:
              'SEBI mandates that redemption proceeds for equity and balanced/hybrid funds must be credited within T+3 business days. In practice, most AMCs credit within T+2. For liquid and overnight funds, the timeline is T+1 business day.',
          },
          {
            question:
              'Rajiv sets up an STP from Scheme A (liquid fund) to Scheme B (equity fund) for ₹25,000 per month for 12 months. How many taxable events does this create?',
            options: [
              '1 (the initial STP setup)',
              '12 (one for each monthly transfer)',
              '24 (redemption + purchase for each monthly transfer)',
              '0 (STP is not taxable)',
            ],
            correctAnswer: 2,
            explanation:
              'Each STP installment is a separate switch transaction involving a redemption from the source scheme and a purchase in the target scheme — that is 2 taxable events per installment. Over 12 months, this creates 24 taxable events (12 redemptions from the liquid fund + 12 purchases in the equity fund, though only the redemptions actually create tax liability if there are gains).',
          },
          {
            question:
              'Which of the following statements about ELSS lock-in is correct?',
            options: [
              'The 3-year lock-in applies from the date of the first SIP installment for all subsequent installments',
              'Each SIP installment has its own separate 3-year lock-in period',
              'ELSS can be redeemed after 1 year with an exit load',
              'The lock-in period is 5 years for ELSS funds',
            ],
            correctAnswer: 1,
            explanation:
              'Each ELSS SIP installment has its own 3-year lock-in from its specific date of investment. For example, January 2024 SIP can be redeemed from January 2027, February 2024 SIP from February 2027, and so on. The lock-in is not from the first SIP date for all installments — this is a very common NISM exam question.',
          },
        ],
        summaryNotes: [
          'Four transaction types: Purchase, Redemption, Switch, STP — each has distinct NAV applicability, settlement, and tax rules',
          'Switch = redemption + purchase within same AMC — TWO tax events; holding period resets in target scheme',
          'Redemption timelines: equity T+3, debt T+2, liquid/overnight T+1 business days',
          'Each STP/SIP installment is a separate transaction for tax purposes — each has its own holding period',
          'ELSS: 3-year lock-in per installment (not per folio) — no premature redemption, switch, or pledge allowed',
        ],
        relatedTopics: ['systematic-transactions', 'cut-off-time-stamping', 'nfo-process'],
      },
    },

    // ─── Section 5: Systematic Transactions ──────────────────────────────
    {
      id: 'systematic-transactions',
      title: 'Systematic Transactions — SIP, STP, SWP Setup & Operations',
      slug: 'systematic-transactions',
      content: {
        definition:
          'Systematic transactions are automated, periodic investment mechanisms offered by mutual funds that allow investors to invest (SIP), transfer (STP), or withdraw (SWP) fixed or variable amounts at pre-determined intervals. These transactions are set up through bank mandates (ECS, NACH, or e-mandate) and execute automatically without requiring the investor to initiate each transaction manually.',
        explanation:
          'If there is one thing that has transformed the mutual fund industry in India, it is the SIP. With over 10 crore active SIP accounts and the Indian mutual fund industry\'s AUM crossing ₹82 lakh crore (as of February 2026), SIPs have moved from a niche concept to the backbone of retail investing. Here is a breakdown of all three systematic mechanisms.\n\nSIP (Systematic Investment Plan) is the most popular — a fixed amount is auto-debited from the investor\'s bank account and invested in a chosen scheme at regular intervals (weekly, monthly, quarterly). Minimum SIP amounts range from ₹100 to ₹500 depending on the AMC. Each SIP installment buys units at the prevailing NAV, enabling rupee cost averaging.\n\nSTP (Systematic Transfer Plan) automates the transfer of a fixed amount from one scheme to another within the same AMC. The classic use case: park a lumpsum in a liquid fund and STP into an equity fund over 6-12 months. There are two types — Fixed STP (constant amount) and Capital Appreciation STP (only transfers the gains from the source fund, keeping the principal intact).\n\nSWP (Systematic Withdrawal Plan) is the reverse of SIP — a fixed amount is redeemed from the fund and credited to the investor\'s bank account at regular intervals. This is ideal for retirees who want regular income. SWP is more tax-efficient than the dividend/IDCW option because in SWP, only the capital gains portion is taxed, whereas IDCW is taxed at the investor\'s full income tax slab.\n\nFlex SIP or Variable SIP is a feature where the SIP amount varies based on market conditions — the investor puts in more when markets fall and less when markets rise. Different AMCs have different names for this feature.\n\nSetting up the bank mandate is the foundation. ECS (Electronic Clearing Service), NACH (National Automated Clearing House), and e-mandate (digital registration via net banking) are the three methods. NACH is the most common today and supports mandates up to ₹1 crore.',
        realLifeExample:
          'For example, consider Priyanka, an MFD in Bengaluru, who handles three clients with different needs:\n\n1. SIP Client — Rohit (age 28, software engineer): Rohit wants to build wealth for 15 years. Priyanka sets up a monthly SIP of ₹10,000 in Mirae Asset Large Cap Fund. She registers a NACH mandate on Rohit\'s HDFC Bank account for ₹15,000 (higher than SIP amount to allow future increases). The SIP debits on the 5th of every month. In the first month, NAV is ₹85.00, so Rohit gets 117.65 units. Next month, markets dip and NAV is ₹80.00 — he gets 125.00 units. This is rupee cost averaging in action.\n\n2. STP Client — Mrs. Lakshmi (age 55): She receives ₹25,00,000 from a fixed deposit maturity. Instead of investing the entire lumpsum in equity, Priyanka parks it in Kotak Liquid Fund and sets up a weekly STP of ₹1,00,000 into Kotak Flexicap Fund. Over 25 weeks, the entire amount moves from liquid to equity, averaging out the entry price.\n\n3. SWP Client — Mr. Rajan (age 62, retired): Rajan has ₹40,00,000 in ICICI Balanced Advantage Fund. He needs ₹30,000/month for living expenses. Priyanka sets up a monthly SWP of ₹30,000. Each month, units worth ₹30,000 are redeemed and credited to his bank. Priyanka explains that if the fund grows at 10% and the withdrawal rate is 9% per year (₹3.6 lakh on ₹40 lakh), the corpus will actually grow over time while providing regular income.',
        keyPoints: [
          'SIP: auto-debit from bank account into MF scheme — minimum ₹100-500 depending on AMC; enables rupee cost averaging',
          'STP: automated transfer from source scheme to target scheme within the same AMC — Fixed STP or Capital Appreciation STP',
          'SWP: automated redemption at regular intervals — ideal for retirees; more tax-efficient than IDCW option',
          'Each SIP installment is a SEPARATE transaction for tax purposes — each has its own purchase date and holding period',
          'NACH mandate is the most common method; supports mandates up to ₹1 crore; registration takes 15-30 days',
          'Flex SIP / Variable SIP: amount varies based on market levels — invests more in dips, less in peaks',
          'SWP advantage: only capital gains portion is taxed (not the principal portion of each withdrawal)',
          'STP from liquid to equity is the professional way to deploy a lumpsum — reduces timing risk over 6-12 months',
        ],
        faq: [
          {
            question: 'What is the minimum SIP amount in India?',
            answer:
              'The minimum SIP amount varies by AMC and scheme. Most AMCs allow SIPs starting from ₹500 per month. Some AMCs like SBI MF and Nippon India MF offer micro-SIPs starting from ₹100. Weekly and daily SIP frequencies are also available in select schemes. There is no maximum SIP amount — an investor can set up a SIP for ₹1 crore/month if the NACH mandate supports it.',
          },
          {
            question: 'How is SWP more tax-efficient than IDCW (dividend)?',
            answer:
              'When IDCW is received, the entire amount is added to the investor\'s income and taxed at slab rate. With SWP, each withdrawal consists of two parts: return of the original investment (principal) and capital gains. Only the capital gains portion is taxed — and if held for more than 1 year in equity funds, it qualifies for long-term capital gains tax at a lower rate with exemption benefits.',
          },
          {
            question: 'Can I change my SIP amount or date mid-way?',
            answer:
              'Most AMCs do not allow modification of an existing SIP. The standard process is to cancel the existing SIP and register a new one with the revised amount or date. Some newer platforms allow SIP modification, but this varies by AMC. The cancellation and new registration may take 15-30 days to process through NACH.',
          },
          {
            question: 'What happens if my SIP bounces due to insufficient bank balance?',
            answer:
              'If a SIP auto-debit fails due to insufficient balance, that particular installment is skipped. Most AMCs allow up to 3 consecutive SIP bounces before auto-cancelling the SIP mandate. The investor may also incur bank charges for the ECS/NACH bounce. As a distributor, always advise clients to maintain sufficient balance on SIP debit dates.',
          },
          {
            question: 'Is STP taxable even though the money stays in mutual funds?',
            answer:
              'Yes. Each STP installment involves a redemption from the source scheme — which triggers capital gains tax if there is a gain. Even though the money immediately goes into the target scheme, the redemption event is taxable. This is a commonly misunderstood aspect that NISM tests frequently.',
          },
        ],
        mcqs: [
          {
            question:
              'In a Systematic Transfer Plan (STP), the tax treatment of each transfer is:',
            options: [
              'Tax-free since money stays within the mutual fund system',
              'Taxed only when the final redemption is made from the target scheme',
              'Each transfer is a redemption from the source scheme and is taxable if there are capital gains',
              'Taxed at a flat rate of 10% regardless of holding period',
            ],
            correctAnswer: 2,
            explanation:
              'Each STP installment involves a redemption from the source scheme, which is a taxable event if there are capital gains. The purchase in the target scheme is not taxable but starts a new holding period. Many investors mistakenly believe STP is tax-free because the money stays in mutual funds — this is tested in NISM.',
          },
          {
            question:
              'Suman sets up a SIP of ₹5,000 per month in an ELSS fund starting January 2024. She can redeem the January 2024 installment starting from:',
            options: [
              'January 2025 (1-year lock-in)',
              'January 2027 (3-year lock-in from the first installment)',
              'January 2027 (3-year lock-in for that specific installment)',
              'April 2027 (3 years from end of financial year)',
            ],
            correctAnswer: 2,
            explanation:
              'Each ELSS SIP installment has its own 3-year lock-in from its specific investment date. The January 2024 installment can be redeemed from January 2027, February 2024 from February 2027, and so on. The lock-in is per installment, not per folio or per financial year.',
          },
          {
            question:
              'Which of the following best describes the advantage of SWP over IDCW (dividend) option for a retiree seeking regular income?',
            options: [
              'SWP provides guaranteed fixed returns while IDCW does not',
              'SWP is completely tax-free while IDCW is taxable',
              'In SWP, only the capital gains portion of each withdrawal is taxed; in IDCW, the entire payout is taxable at slab rate',
              'SWP can only be set up in equity funds while IDCW works in all funds',
            ],
            correctAnswer: 2,
            explanation:
              'SWP is more tax-efficient because each withdrawal consists of principal return + capital gains, and only the gains are taxed. In IDCW, the entire distribution is added to income and taxed at the investor\'s slab rate. SWP does not guarantee fixed returns — the withdrawal amount is fixed but returns depend on fund performance.',
          },
          {
            question:
              'The maximum number of consecutive SIP bounces typically allowed before auto-cancellation by most AMCs is:',
            options: ['1 bounce', '2 bounces', '3 bounces', '6 bounces'],
            correctAnswer: 2,
            explanation:
              'Most AMCs allow up to 3 consecutive SIP bounces before the SIP mandate is automatically cancelled. After 3 failures, the investor needs to re-register the SIP. Additionally, the bank may charge penalties for ECS/NACH bounce — typically ₹250-500 per bounce.',
          },
        ],
        summaryNotes: [
          'SIP = bank to MF (auto-invest); STP = MF to MF within same AMC (auto-switch); SWP = MF to bank (auto-withdraw)',
          'Each SIP/STP installment is a separate tax event with its own purchase date and holding period — critical for tax planning',
          'SWP is more tax-efficient than IDCW: only capital gains portion is taxed vs. full amount at slab rate for IDCW',
          'NACH mandate supports up to ₹1 crore; registration takes 15-30 days; most AMCs allow 3 bounces before auto-cancellation',
          'STP from liquid to equity over 6-12 months is the professional way to deploy lumpsum — reduces market timing risk',
        ],
        relatedTopics: ['transaction-types', 'cut-off-time-stamping', 'sip-basics'],
      },
    },

    // ─── Section 6: Cut-off Time & Time Stamping ─────────────────────────
    {
      id: 'cut-off-time-stamping',
      title: 'Cut-off Time & Time Stamping Rules',
      slug: 'cut-off-time-stamping',
      content: {
        definition:
          'Cut-off time is the SEBI-prescribed deadline by which a mutual fund transaction (purchase or redemption) must be received and validated to be eligible for that day\'s Net Asset Value (NAV). Time stamping is the process of recording the exact date and time of receipt of a transaction request, which determines the applicable NAV. The combination of cut-off time and time stamping rules ensures fair and uniform NAV applicability across all investors.',
        explanation:
          'This is one of the most exam-heavy topics in NISM VA, and for good reason — it directly impacts how much an investor pays for units or receives on redemption. Here is a thorough walkthrough of the rules.\n\nThe basic principle is straightforward: if a transaction reaches the AMC (and the money is realized in the AMC\'s bank account) before the cut-off time, the investor gets that day\'s NAV. If it arrives after the cut-off, the next business day\'s NAV applies.\n\nFor equity, balanced, and debt funds: the cut-off time is 3:00 PM for both purchase and redemption. For example, if an investor submits a ₹1,00,000 purchase order with a cheque that is deposited and realized before 3:00 PM on Monday, the investor gets Monday\'s NAV. If the cheque is deposited at 3:15 PM, Tuesday\'s NAV applies.\n\nFor liquid and overnight funds: the cut-off is different and tighter. For purchase, it is 1:30 PM. For redemption, it is 3:00 PM. This is because liquid funds invest in very short-term instruments and need earlier clarity on daily inflows.\n\nA critical nuance that is often overlooked: for purchase transactions of ₹2 lakh and above, NAV applicability is based on the date of REALIZATION of funds (when the money actually reaches the AMC\'s bank account), not the date of submission of the application. This means even if the form is submitted before 3 PM, if the cheque takes 2 days to clear, the NAV of the day the funds are realized applies.\n\nTime stamping is the proof mechanism. For physical transactions, the collection centre stamps the date and time on the acknowledgment slip. For online transactions, the system automatically records the timestamp. This timestamp serves as the evidence for which NAV applies — disputes are resolved based on this.',
        realLifeExample:
          'Meena, an MFD in Chennai, processes three transactions on the same day (Wednesday):\n\n1. Rajiv submits a purchase of ₹50,000 in Axis Bluechip Fund at 2:30 PM with a cheque. The cheque is deposited same day and clears by evening. Since the amount is less than ₹2 lakh AND the application was received before 3:00 PM, Rajiv gets Wednesday\'s NAV.\n\n2. Kavitha submits a purchase of ₹5,00,000 in HDFC Top 100 Fund at 2:45 PM via RTGS. The RTGS is initiated but reaches the AMC\'s bank only at 4:00 PM. Since the amount is ₹2 lakh and above, the applicable NAV is based on fund realization date. The money realized on Wednesday itself (even though after 3 PM), so she gets Wednesday\'s closing NAV.\n\n3. Gopal wants to invest ₹3,00,000 in ICICI Liquid Fund at 1:15 PM via NEFT. The NEFT reaches the AMC\'s bank at 2:00 PM. For liquid funds, the purchase cut-off is 1:30 PM. Since the application was received before 1:30 PM AND the amount is ₹2 lakh+, NAV depends on realization. The funds realized on Wednesday, so Gopal gets Wednesday\'s NAV for the liquid fund.\n\nMeena carefully time-stamps each acknowledgment slip and keeps copies. She knows that in any NAV dispute, the time stamp is the only evidence that matters.',
        keyPoints: [
          'Equity, Balanced, Debt funds: cut-off time is 3:00 PM for BOTH purchase and redemption',
          'Liquid and Overnight funds: purchase cut-off is 1:30 PM; redemption cut-off is 3:00 PM',
          'For purchases of ₹2 lakh and above: NAV is based on date of fund REALIZATION in AMC bank, not date of application',
          'For purchases below ₹2 lakh: NAV is based on time of application receipt (before or after cut-off)',
          'Time stamping on acknowledgment slip is mandatory for physical transactions — this is the proof for NAV applicability',
          'Online transactions use system-generated timestamps — no manual intervention possible',
          'During NFO period, units are allotted at face value regardless of time of application — cut-off rules apply only for ongoing schemes',
          'Business days exclude weekends and stock exchange holidays — a Friday after-3-PM transaction gets Monday NAV (if Monday is a business day)',
        ],
        faq: [
          {
            question: 'What if I submit the application before 3 PM but the cheque bounces?',
            answer:
              'If the cheque bounces (fails to clear), the transaction is void. No units will be allotted regardless of when the application was submitted. The RTA will cancel the transaction and notify the investor. This is why many distributors recommend RTGS, NEFT, or UPI for large transactions — instant or same-day realization eliminates bounce risk.',
          },
          {
            question: 'Does the ₹2 lakh realization rule apply to redemptions as well?',
            answer:
              'No. The ₹2 lakh fund realization rule applies only to PURCHASE transactions. For redemptions, the applicable NAV is based on the time of receipt of the redemption request (before or after the cut-off time), regardless of the amount. This asymmetry is a favorite NISM exam trap.',
          },
          {
            question: 'What is the cut-off time for online mutual fund transactions?',
            answer:
              'The cut-off times are the same for online and offline transactions: 3:00 PM for equity/debt fund purchases and redemptions, 1:30 PM for liquid fund purchases. The key difference is that online transactions with instant payment (UPI, net banking) have near-instant realization, making the time-of-application the effective trigger.',
          },
          {
            question: 'If I submit a SIP on a non-business day, which NAV do I get?',
            answer:
              'If the SIP debit date falls on a non-business day (weekend or exchange holiday), the SIP is processed on the next business day, and the NAV of that next business day applies. For example, if the SIP date is the 5th and the 5th is a Sunday, the SIP debits on Monday the 6th and the investor gets Monday\'s NAV.',
          },
        ],
        mcqs: [
          {
            question:
              'Priya invests ₹3,00,000 in an equity fund at 2:30 PM on Tuesday. The cheque is deposited same day but clears on Wednesday. The applicable NAV will be:',
            options: [
              'Tuesday\'s NAV (application received before 3 PM)',
              'Wednesday\'s NAV (date of fund realization)',
              'Thursday\'s NAV (T+1 of realization)',
              'The lower of Tuesday\'s or Wednesday\'s NAV',
            ],
            correctAnswer: 1,
            explanation:
              'For purchase transactions of ₹2 lakh and above, the applicable NAV is based on the date of fund realization (when money reaches the AMC\'s bank), not the date of application. Since the cheque clears on Wednesday, Wednesday\'s closing NAV applies. This ₹2 lakh realization rule is one of the most tested concepts in NISM.',
          },
          {
            question:
              'The cut-off time for purchase of units in a liquid fund is:',
            options: ['12:00 PM', '1:30 PM', '2:00 PM', '3:00 PM'],
            correctAnswer: 1,
            explanation:
              'The purchase cut-off for liquid and overnight funds is 1:30 PM, which is earlier than the 3:00 PM cut-off for equity and debt funds. This is because liquid funds invest in very short-term instruments and need earlier visibility on daily inflows. The redemption cut-off for liquid funds is 3:00 PM (same as other fund categories).',
          },
          {
            question:
              'The ₹2 lakh fund realization rule for NAV applicability applies to:',
            options: [
              'Both purchase and redemption transactions',
              'Only purchase transactions',
              'Only redemption transactions',
              'Only SIP transactions above ₹2 lakh',
            ],
            correctAnswer: 1,
            explanation:
              'The ₹2 lakh fund realization rule applies ONLY to purchase transactions. For redemptions, the applicable NAV is determined by the time of receipt of the redemption request (before or after cut-off), regardless of the amount. This is a classic NISM trick question — many candidates incorrectly assume it applies to both.',
          },
          {
            question:
              'An investor submits an online purchase order for ₹50,000 in an equity fund at 3:05 PM on a business day with instant payment. The applicable NAV is:',
            options: [
              'Same day\'s NAV (payment was instant)',
              'Next business day\'s NAV',
              'Average of same day and next day NAV',
              'The AMC decides on a case-by-case basis',
            ],
            correctAnswer: 1,
            explanation:
              'Even though the payment was instant, the transaction was received after the 3:00 PM cut-off for equity funds. Therefore, the next business day\'s NAV applies. Cut-off time is absolute — there are no exceptions for payment speed or transaction size (for amounts below ₹2 lakh).',
          },
        ],
        summaryNotes: [
          'Equity/Debt: 3:00 PM cut-off for both purchase and redemption; Liquid: 1:30 PM purchase, 3:00 PM redemption',
          'Purchase ≥ ₹2 lakh: NAV based on fund REALIZATION date; Purchase < ₹2 lakh: NAV based on application time vs cut-off',
          'Realization rule does NOT apply to redemptions — redemption NAV is always based on time of request receipt',
          'Time stamping on acknowledgment slip is mandatory and is the only evidence for NAV dispute resolution',
          'Non-business day transactions get processed on the next business day at that day\'s NAV',
        ],
        relatedTopics: ['transaction-types', 'systematic-transactions', 'account-statements'],
      },
    },

    // ─── Section 7: Account Statements ───────────────────────────────────
    {
      id: 'account-statements',
      title: 'Account Statement, CAS & Digital Records',
      slug: 'account-statements',
      content: {
        definition:
          'Account statements in mutual funds are official records that confirm investor transactions, unit holdings, NAV, and portfolio valuation. They come in two forms: individual AMC statements (issued by each AMC for its own schemes) and the Consolidated Account Statement (CAS) which aggregates holdings across ALL AMCs linked to an investor\'s PAN. CAS is generated by RTAs (CAMS and KFintech) and serves as the single-window view of an investor\'s entire mutual fund portfolio.',
        explanation:
          'The account statement is arguably the most under-appreciated document in the mutual fund ecosystem. Clients rarely read them, but when there is a dispute, a transmission claim, or a tax filing question, the account statement is the first document everyone reaches for.\n\nThere are two types of statements to understand:\n\n1. AMC-specific Account Statement: Every time a transaction is processed (purchase, redemption, switch, dividend payout), the AMC sends an account statement (usually via email) confirming the details — transaction date, NAV, units allotted/redeemed, and updated balance. This functions like a bank transaction SMS but with more detail.\n\n2. Consolidated Account Statement (CAS): This is the critical one. CAS is a single document that shows ALL mutual fund holdings across ALL AMCs, including both demat and non-demat holdings. It is generated jointly by CAMS and KFintech (the two major RTAs) and emailed to the investor monthly — but only if there has been at least one transaction during the month. If there are no transactions, a half-yearly CAS is sent (September and March). CAS also shows the commission paid to the distributor — a transparency initiative by SEBI. The CAS includes the distributor\'s ARN and the trail commission percentage and amount. Additionally, investors can now access their CAS through MFCentral, a centralized platform that allows investors to manage transactions and view holdings across AMCs.\n\neCAS is the electronic version emailed to investors. It is password-protected (typically with the PAN). Investors can also download CAS on demand from the MyCams portal, KFintech portal, or MFCentral.\n\nFor the NISM exam, the key takeaway is: CAS is the official document that provides a consolidated view, and it is the RTA\'s responsibility to generate and deliver it.',
        realLifeExample:
          'Mr. Suresh Iyer from Pune has investments across 5 AMCs: SBI MF (through CAMS), HDFC MF (through CAMS), ICICI Prudential MF (through CAMS), Nippon India MF (through KFintech), and Aditya Birla MF (through KFintech). Managing 5 separate account statements from 5 AMCs would be a nightmare.\n\nInstead, on the 10th of every month, Suresh receives a single CAS email from CAMS/KFintech. This CAS shows:\n- Folio numbers and scheme names across all 5 AMCs\n- Current market value of each holding\n- Transactions done during the month\n- Dividend/IDCW received\n- Commission paid to his distributor Meena (ARN-12345) — for example, 0.50% trail = ₹2,500 for the month\n- Total portfolio value: ₹48,75,000\n\nIn March (half-yearly CAS), even though Suresh did no transactions that month, he receives a detailed CAS showing all holdings with current valuations. He forwards this to his CA for ITR filing — the CAS is the single source of truth for capital gains computation.\n\nWhen Suresh\'s father passes away and Suresh needs to claim transmission of his father\'s MF units, the CAS becomes the key document. It shows all the father\'s holdings across all AMCs in one place, making the transmission process much smoother than tracking down 5 separate AMC statements.',
        keyPoints: [
          'AMC-specific statements are sent after every transaction — purchase, redemption, switch, dividend payout',
          'CAS (Consolidated Account Statement) shows ALL mutual fund holdings across ALL AMCs linked to a PAN',
          'CAS is generated jointly by CAMS and KFintech and emailed monthly (if transactions occurred during the month)',
          'Half-yearly CAS is sent even if there are no transactions — in September and March periods',
          'CAS includes both demat and non-demat mutual fund holdings in a single view',
          'CAS discloses distributor commission: ARN, trail commission percentage, and absolute amount — SEBI transparency mandate',
          'MFCentral portal allows investors to view holdings, request CAS, and manage transactions across all AMCs in one place',
          'eCAS is password-protected, typically using the investor\'s PAN as the password',
          'CAS is the primary document for tax filing, transmission claims, and portfolio reviews — distributors should educate clients to retain it',
        ],
        faq: [
          {
            question: 'How can an investor get CAS on demand instead of waiting for the monthly email?',
            answer:
              'Investors can request CAS on demand through the MyCams portal (for CAMS-serviced AMCs), KFintech portal (for KFintech-serviced AMCs), MFCentral portal (for holdings across all AMCs), or through the AMC website. Many AMC apps also provide real-time portfolio views. Additionally, investors can request CAS by sending an email to the RTA with their PAN and registered email address.',
          },
          {
            question: 'Does CAS show investments held in demat form?',
            answer:
              'Yes. CAS includes both demat and non-demat (physical/SOA) mutual fund holdings. It provides a truly consolidated view of all mutual fund investments linked to the investor\'s PAN, regardless of the holding mode. This makes CAS the most comprehensive portfolio document available.',
          },
          {
            question: 'Why does CAS show the commission paid to my distributor?',
            answer:
              'SEBI mandated commission disclosure in CAS to enhance transparency. The CAS shows the distributor\'s ARN, the trail commission percentage, and the absolute amount earned by the distributor from the investor\'s portfolio. This helps investors understand the cost of distribution and make informed decisions about Direct vs Regular plans.',
          },
          {
            question: 'Is the account statement a legal document for tax purposes?',
            answer:
              'Yes, the CAS and AMC account statements are accepted as valid documents for income tax filing. They contain all necessary information for capital gains computation — purchase date, purchase NAV, redemption date, redemption NAV, and units transacted. A CA can use CAS directly for ITR preparation.',
          },
        ],
        mcqs: [
          {
            question:
              'A Consolidated Account Statement (CAS) is generated by:',
            options: [
              'Each AMC for its own schemes only',
              'SEBI directly for all investors',
              'RTAs (CAMS and KFintech) jointly, covering holdings across all AMCs',
              'The investor\'s bank based on debit records',
            ],
            correctAnswer: 2,
            explanation:
              'CAS is generated jointly by the RTAs — CAMS and KFintech — and consolidates mutual fund holdings across ALL AMCs linked to the investor\'s PAN. It is not generated by individual AMCs (they send their own scheme-specific statements) or by SEBI.',
          },
          {
            question:
              'If an investor has no mutual fund transactions during a particular month, they will:',
            options: [
              'Not receive any CAS at all that year',
              'Receive a monthly CAS with zero transactions',
              'Receive a half-yearly CAS (for periods ending September and March)',
              'Need to request CAS manually from the RTA',
            ],
            correctAnswer: 2,
            explanation:
              'Monthly CAS is sent only if there are transactions during that month. If there are no transactions, the investor receives a half-yearly CAS for the periods ending September and March. This ensures every investor gets at least two portfolio snapshots per year even without any activity.',
          },
          {
            question:
              'The CAS includes which of the following information about the investor\'s distributor?',
            options: [
              'Only the distributor\'s name',
              'Distributor\'s ARN, trail commission percentage, and absolute commission amount',
              'Only the ARN number without commission details',
              'CAS does not include any distributor information',
            ],
            correctAnswer: 1,
            explanation:
              'As per SEBI\'s transparency mandate, CAS discloses the distributor\'s ARN (AMFI Registration Number), the trail commission percentage, and the absolute commission amount earned from the investor\'s portfolio. This was introduced to help investors understand the cost of distribution services.',
          },
        ],
        summaryNotes: [
          'CAS = single document, all AMCs, all holdings (demat + non-demat) linked to PAN — generated by CAMS + KFintech jointly',
          'Monthly CAS if transactions occurred; half-yearly CAS (Sep + Mar) if no transactions — minimum 2 per year guaranteed',
          'CAS discloses distributor commission (ARN, % trail, absolute ₹ amount) — SEBI transparency mandate',
          'eCAS is password-protected (PAN); available on-demand via MyCams, KFintech portal, MFCentral, or AMC websites',
          'CAS is the primary document for tax filing, transmission claims, and portfolio reviews — educate clients to save it',
        ],
        relatedTopics: ['non-financial-transactions', 'transaction-types', 'investor-grievance'],
      },
    },

    // ─── Section 8: Non-Financial Transactions ───────────────────────────
    {
      id: 'non-financial-transactions',
      title: 'Non-Financial Transactions — Nomination, Address Change, Transmission',
      slug: 'non-financial-transactions',
      content: {
        definition:
          'Non-financial transactions are mutual fund account modifications that do not involve the movement of money or units but update investor records, preferences, or account details. Common non-financial transactions include change of address, bank mandate update, nomination change, email/mobile update, transmission of units (on death of unitholder), minor-to-major transition, and Power of Attorney registration. These are processed by the RTA and do not affect the NAV or unit balance.',
        explanation:
          'Non-financial transactions are where distributors truly demonstrate their value. Processing a SIP is straightforward — but when a client\'s parent passes away and the family needs to transmit ₹30 lakh of mutual fund units, or when a client moves cities and needs all records updated across 5 AMCs — that is when a knowledgeable distributor becomes indispensable.\n\nHere is a breakdown of the key non-financial transactions:\n\nNomination: SEBI mandates nomination for all new folios. For existing folios, investors must now either add a nominee or formally opt out — this is no longer optional. An investor can nominate up to 3 persons with percentage allocation that must total 100%. Minor nominees must have a guardian specified. Nomination can be changed at any time by the investor (all holders must sign for joint accounts). SEBI has also introduced a voluntary debit freeze facility for folios (effective April 30, 2026), allowing investors to freeze debit transactions from their folio as an added security measure.\n\nTransmission: This is the transfer of mutual fund units from a deceased unitholder to the nominee or legal heir. If there is a nominee, the process is relatively straightforward — death certificate, KYC of nominee, transmission request form, and the nominee\'s bank details. Without a nominee, it becomes more complex — legal heir certificate or succession certificate is required, and the process can take months. For small folios below a certain threshold (typically ₹2-5 lakh depending on AMC), a simplified transmission process is available with an indemnity bond and affidavit.\n\nMinor-to-Major Transition: When a minor investor turns 18, the account must be converted from guardian-operated to self-operated. The investor (now an adult) must submit KYC, new bank mandate in their own name, and a fresh signature. Until this transition is completed, no transactions can be processed.\n\nChange of Bank Mandate: This is sensitive because redemption proceeds go to the registered bank. The AMC requires the old and new bank details, a cancelled cheque of the new bank, and a cooling period (typically 10-30 days) before the new bank becomes active for redemptions.\n\nPower of Attorney (PoA): A valid PoA holder can operate the mutual fund account on behalf of the investor. However, the PoA must be registered with the AMC, and there are restrictions — for example, a PoA holder cannot change the nominee or submit a transmission claim.',
        realLifeExample:
          'Anand, an MFD in Ahmedabad, handles three non-financial transactions in one week:\n\n1. Transmission: Mr. Patel (age 72) passes away. His son Chirag is the nominee on the MF folio (HDFC MF, ₹18,00,000 in units). Anand guides Chirag through the process: (a) Fill Transmission Request Form, (b) Attach death certificate (original or notarized copy), (c) Attach Chirag\'s KYC documents, (d) Provide Chirag\'s cancelled cheque for future redemptions, (e) Submit to the RTA. Within 10-12 business days, the units are transferred to Chirag\'s name. If Mr. Patel had not nominated Chirag, the family would have needed a succession certificate from court — potentially months of delay and legal costs.\n\n2. Minor-to-Major: Ria Sharma turns 18. Her mother Kavita was the guardian on her SBI MF folio (₹5,00,000 in units). Anand helps Ria: (a) Submit a "Change of Status" form from minor to major, (b) Complete Ria\'s KYC in her own name, (c) Provide Ria\'s bank account details and cancelled cheque, (d) Ria signs the new specimen signature card. Until this is processed, all SIPs and transactions on Ria\'s folio are frozen.\n\n3. Bank Change: Vinod Mehta switches from ICICI Bank to HDFC Bank. Anand submits a bank mandate change form with: (a) Old bank details, (b) HDFC Bank cancelled cheque, (c) Vinod\'s signature. There is a 10-day cooling period — during this time, redemptions will still go to the old ICICI account. After 10 days, the HDFC account becomes active.',
        keyPoints: [
          'Nomination: up to 3 nominees with percentage allocation totaling 100%; SEBI-mandatory for all new folios; existing folios must add nominee or opt out',
          'SEBI voluntary debit freeze facility (effective April 30, 2026): investors can freeze debit transactions from their folio as an added security measure',
          'Transmission: transfer of units on death of unitholder to nominee/legal heir — nominee makes the process faster; simplified process available for small folios below threshold limits',
          'Without a nominee, transmission requires succession certificate or legal heir certificate — much slower and costlier',
          'Documents for transmission: death certificate, KYC of nominee/heir, transmission request form, cancelled cheque of claimant',
          'Minor-to-Major transition at age 18: all transactions frozen until new KYC, bank mandate, and signature are submitted',
          'Bank mandate change has a cooling period (10-30 days) — redemptions go to old bank until the new mandate is active',
          'Power of Attorney: must be registered with AMC; PoA holder cannot change nominee or process transmission',
          'All non-financial transactions require signatures of ALL holders in joint accounts — not just the first holder',
        ],
        faq: [
          {
            question: 'What happens to mutual fund units if the investor dies without a nominee?',
            answer:
              'Without a nominee, the legal heirs must provide a succession certificate or legal heir certificate issued by a court to claim the units. This process can take months and involves legal costs. For small folios below a threshold (typically ₹2-5 lakh depending on AMC policy), a simplified transmission process is available where AMCs accept an indemnity bond, affidavit, and NOC from other legal heirs. This is exactly why distributors should always ensure nomination is completed for every folio.',
          },
          {
            question: 'Can a nominee sell the units immediately after transmission?',
            answer:
              'Yes. Once the transmission is completed and units are transferred to the nominee\'s folio, the nominee becomes the full owner and can redeem, switch, or continue holding the units. However, the nominee must be KYC-compliant and have their own bank mandate registered before any financial transaction can be processed.',
          },
          {
            question: 'What happens to SIPs when a minor turns 18?',
            answer:
              'All running SIPs are automatically stopped when the minor turns 18 (based on the date of birth on record). The guardian\'s authority ceases, and no new transactions can be processed until the minor-to-major transition is completed. Once the status is updated with new KYC, bank details, and signature, new SIPs can be registered.',
          },
          {
            question: 'Can I change the nomination on a joint holding account?',
            answer:
              'Yes, but the nomination change request must be signed by ALL holders (not just the first holder). This is a common point of confusion. In joint holdings, if one holder passes away, the surviving holder(s) become the default successors — nomination applies only when all joint holders have passed away.',
          },
          {
            question: 'How long does a typical transmission take?',
            answer:
              'With a nominee and complete documents, transmission typically takes 10-15 business days. Without a nominee, the process can take 2-6 months depending on how quickly the legal heir certificate or succession certificate is obtained. A distributor can expedite the process by ensuring all documents are complete and correctly attested before submission.',
          },
        ],
        mcqs: [
          {
            question:
              'An investor can nominate a maximum of how many persons in a mutual fund folio?',
            options: ['1 person', '2 persons', '3 persons', '5 persons'],
            correctAnswer: 2,
            explanation:
              'An investor can nominate up to 3 persons in a mutual fund folio. The percentage allocation across all nominees must total 100%. If a minor is nominated, a guardian must be specified for that nominee. This is a straightforward NISM factual question.',
          },
          {
            question:
              'When a minor investor turns 18, which of the following is TRUE?',
            options: [
              'The guardian continues to operate the account until the investor turns 21',
              'All transactions are frozen until the minor-to-major status change is completed with new KYC and bank mandate',
              'The account is automatically closed and units are redeemed',
              'Only redemption transactions are frozen; SIPs continue with the guardian\'s mandate',
            ],
            correctAnswer: 1,
            explanation:
              'When a minor turns 18, all transactions (including running SIPs) are frozen. The guardian\'s authority ceases. The investor must complete the minor-to-major transition by submitting fresh KYC documents, new bank mandate in their own name, and a specimen signature. Only after this is processed can transactions resume.',
          },
          {
            question:
              'For transmission of mutual fund units on death of a sole holder with a registered nominee, which of the following documents is NOT required?',
            options: [
              'Death certificate of the deceased holder',
              'KYC documents of the nominee',
              'Succession certificate from the court',
              'Transmission request form signed by the nominee',
            ],
            correctAnswer: 2,
            explanation:
              'When a nominee is registered, succession certificate is NOT required. The nominee can claim units by submitting the death certificate, their KYC documents, cancelled cheque, and a signed transmission request form. Succession certificate is required only when there is NO nominee — this is the key advantage of having a nomination in place.',
          },
          {
            question:
              'A Power of Attorney (PoA) holder operating a mutual fund account CANNOT:',
            options: [
              'Submit a purchase or redemption request',
              'Set up a new SIP on behalf of the investor',
              'Change the nomination on the folio',
              'Request an account statement',
            ],
            correctAnswer: 2,
            explanation:
              'A PoA holder can operate the account for financial transactions (purchase, redemption, SIP) and request information (statements). However, they CANNOT change the nominee, as nomination is a personal decision that must be made by the investor themselves. Similarly, PoA holders cannot process transmission claims.',
          },
        ],
        summaryNotes: [
          'Nomination: up to 3 persons, % must total 100%, SEBI-mandatory for new folios; existing folios must add nominee or opt out',
          'SEBI debit freeze facility (effective April 30, 2026): investors can voluntarily freeze debit transactions on their folio',
          'Transmission with nominee: 10-15 business days; without nominee: 2-6 months (needs succession certificate); simplified process for small folios',
          'Minor-to-Major at 18: all transactions frozen until new KYC, bank mandate, and signature submitted',
          'Bank mandate change: 10-30 day cooling period; old bank remains active for redemptions during this period',
          'PoA holder can transact but CANNOT change nominee or process transmission — limitations are NISM exam favorites',
        ],
        relatedTopics: ['application-form', 'investor-grievance', 'special-categories'],
      },
    },

    // ─── Section 9: Investor Grievance ───────────────────────────────────
    {
      id: 'investor-grievance',
      title: 'Investor Grievance Redressal — SCORES & Ombudsman',
      slug: 'investor-grievance',
      content: {
        definition:
          'Investor grievance redressal is the structured multi-tier complaint resolution mechanism established by SEBI to protect mutual fund investors. The framework ensures that every investor complaint — whether about wrong NAV application, delayed redemption, unauthorized transactions, or distributor misconduct — is addressed within prescribed timelines. The three tiers are: (1) AMC/RTA level resolution, (2) SEBI SCORES online complaint portal, and (3) Securities Market Ombudsman for unresolved disputes.',
        explanation:
          'The grievance redressal system has evolved significantly over the years — from a paper-based "write a letter and hope for the best" approach to a fully digital, time-bound process. Understanding this system is essential for distributors, as clients with complaints typically approach their distributor first.\n\nTier 1 — AMC/RTA Level: The first step is always to contact the AMC\'s customer service or the RTA (CAMS/KFintech). Most operational issues — wrong bank credit, missing units, incorrect NAV application — get resolved at this level. The AMC is expected to resolve complaints within 30 days. Every AMC has a designated Investor Relations Officer and a compliance officer responsible for grievance handling.\n\nTier 2 — SEBI SCORES 2.0: If the AMC does not resolve the complaint within 30 days, or if the investor is unsatisfied with the resolution, they can escalate to SEBI through SCORES 2.0 (SEBI Complaint Redressal System — the upgraded version with enhanced tracking and auto-escalation features). SCORES 2.0 is a completely online platform — the investor files a complaint, SEBI forwards it to the entity concerned (AMC, RTA, or distributor), and tracks the resolution. The entity must respond within 30 days. The entire trail is visible to the investor online. SCORES 2.0 includes auto-escalation to the designated body if the entity fails to respond within the stipulated timeline.\n\nTier 3 — SEBI Ombudsman: If SCORES does not yield a satisfactory resolution, the investor can approach the SEBI Ombudsman for mutual fund and securities market disputes. The Ombudsman is an independent authority that adjudicates investor complaints against securities market intermediaries. The Ombudsman\'s decision is binding on the entity but the investor can still approach courts if unsatisfied.\n\nAMFI also plays a facilitation role — providing a platform for investors to raise concerns and helping mediate between investors and AMCs.\n\nDistributors should note that SEBI takes complaints very seriously. A pattern of complaints against a specific distributor can lead to SEBI inquiry, ARN suspension, or even cancellation. Ethical conduct and transparency are regulatory requirements, not merely best practices.',
        realLifeExample:
          'Consider the case of Savita, a school teacher in Indore, who invests ₹1,00,000 in a mutual fund through her distributor. She submits the cheque at 2:30 PM on Monday (before the 3 PM cut-off), but notices that the units were allotted at Tuesday\'s NAV instead of Monday\'s — a difference of ₹0.50 per unit, meaning she received about 50 fewer units than she should have.\n\nStep 1 — AMC Level: Savita (with help from her distributor) writes to the AMC\'s customer service email with the time-stamped acknowledgment slip showing 2:30 PM Monday. The AMC acknowledges the complaint and says they will investigate within 15 days. After 20 days, the AMC responds saying the cheque was deposited after 3 PM according to their records. Savita disagrees — she has the time-stamped slip.\n\nStep 2 — SCORES 2.0: Savita logs into the SEBI SCORES 2.0 portal (scores.gov.in), files a complaint against the AMC, and uploads the time-stamped acknowledgment slip as evidence. SEBI forwards the complaint to the AMC with a 30-day deadline. The AMC reviews the case again, finds that the collection centre had indeed received the cheque at 2:30 PM but logged it incorrectly. The AMC rectifies the allotment to Monday\'s NAV and credits the additional units (approximately 50 units) to Savita\'s folio. Complaint closed.\n\nHad the AMC still not resolved it, Savita could have approached the SEBI Ombudsman as Tier 3. In practice, most complaints get resolved at Tier 1 or Tier 2.',
        keyPoints: [
          'Tier 1: Complain to AMC/RTA first — they must resolve within 30 days; every AMC has a designated Investor Relations Officer',
          'Tier 2: Escalate to SEBI through SCORES 2.0 (scores.gov.in) — upgraded online portal with complete tracking and auto-escalation; entity gets 30 days to respond',
          'Tier 3: SEBI Ombudsman — independent adjudicator for mutual fund and securities disputes; decision binding on the entity (AMC/distributor)',
          'SCORES 2.0 is completely online — investor can file complaints, track status, and upload documents digitally; auto-escalation if entity fails to respond',
          'AMCs must have a dedicated compliance officer and investor grievance redressal mechanism as per SEBI mandate',
          'AMFI facilitates complaint resolution between investors and AMCs — acts as a mediator',
          'Pattern of complaints against a distributor can lead to ARN suspension or cancellation by AMFI/SEBI',
          'Investor Protection Fund exists to compensate investors in case of intermediary default or fraud',
        ],
        faq: [
          {
            question: 'How do I file a complaint on SCORES?',
            answer:
              'Visit scores.gov.in (SCORES 2.0), register with email and mobile number, then file a complaint by selecting the category (Mutual Fund), the entity (AMC name), and describing the grievance. Supporting documents (acknowledgment slip, account statement, etc.) can be uploaded. SEBI assigns a unique complaint number for tracking. The entity gets 30 days to respond, and the response and status are visible online. SCORES 2.0 features auto-escalation if the entity fails to respond within the stipulated timeline.',
          },
          {
            question: 'Can a distributor be penalized based on investor complaints?',
            answer:
              'Yes. SEBI and AMFI take investor complaints seriously. If there is a pattern of complaints or evidence of mis-selling, AMFI can suspend or cancel the distributor\'s ARN (AMFI Registration Number). SEBI can also initiate enforcement action, impose penalties, or debar the distributor from the securities market. This is why ethical conduct is not just good practice — it is a regulatory requirement.',
          },
          {
            question: 'What types of complaints can be filed on SCORES?',
            answer:
              'SCORES handles complaints related to: wrong NAV application, delayed redemption proceeds, unauthorized transactions, non-receipt of account statements, mis-selling by distributors, non-updation of KYC/nomination/bank details, and any other grievance related to mutual fund operations. It does not handle complaints about fund performance or market losses — those are investment risks, not grievances.',
          },
          {
            question: 'Is there a time limit for filing a complaint?',
            answer:
              'While there is no strict statutory time limit for filing on SCORES, it is advisable to file within 3 years of the incident. Documentary evidence becomes harder to produce over time, and delays can weaken the case. The best practice is to escalate to SCORES within 30 days of the AMC failing to resolve the complaint.',
          },
          {
            question: 'What is the role of the Investor Protection Fund?',
            answer:
              'The Investor Protection Fund is maintained by stock exchanges and SEBI to compensate investors in cases where a market intermediary defaults or commits fraud, and investor funds are lost. It is a safety net of last resort. For mutual funds specifically, the trustee structure and custodian arrangement provide the primary protection — the Investor Protection Fund is an additional layer.',
          },
        ],
        mcqs: [
          {
            question:
              'The correct order of escalation for a mutual fund investor complaint is:',
            options: [
              'SCORES → AMC → Ombudsman',
              'Ombudsman → SCORES → AMC',
              'AMC/RTA → SEBI SCORES 2.0 → SEBI Ombudsman',
              'AMFI → SEBI → Supreme Court',
            ],
            correctAnswer: 2,
            explanation:
              'The correct escalation order is: (1) AMC/RTA level complaint first (30-day resolution timeline), (2) SEBI SCORES 2.0 if unresolved (another 30-day timeline, with auto-escalation), and (3) SEBI Ombudsman if still unresolved. Skipping tiers is not recommended — SCORES requires evidence of prior complaint to the AMC.',
          },
          {
            question:
              'SCORES stands for:',
            options: [
              'Securities Complaint Online Resolution and Escalation System',
              'SEBI Complaint Redressal System',
              'Standard Complaint Redressal and Escalation Service',
              'Securities Commission Online Regulatory Enforcement System',
            ],
            correctAnswer: 1,
            explanation:
              'SCORES stands for SEBI Complaint Redressal System. It is the online portal (scores.gov.in) where investors can file and track complaints against SEBI-registered entities including AMCs, RTAs, and distributors. This is a direct factual question frequently asked in NISM.',
          },
          {
            question:
              'An AMC is required to resolve investor complaints within:',
            options: ['7 days', '15 days', '30 days', '60 days'],
            correctAnswer: 2,
            explanation:
              'SEBI mandates that AMCs must resolve investor complaints within 30 days. If the complaint is not resolved within this period, the investor can escalate to SEBI through the SCORES portal. The 30-day timeline is consistently tested in NISM and is a key compliance requirement for AMCs.',
          },
          {
            question:
              'Which of the following complaints CANNOT be addressed through SCORES?',
            options: [
              'Wrong NAV applied to a transaction',
              'Delayed redemption proceeds',
              'Loss in investment value due to market decline',
              'Non-receipt of account statement',
            ],
            correctAnswer: 2,
            explanation:
              'SCORES handles operational and service-related grievances — wrong NAV, delayed redemptions, missing statements, unauthorized transactions, etc. It does NOT address complaints about investment losses due to market movements, as these are inherent investment risks disclosed in the scheme documents. This distinction is important for the NISM exam.',
          },
        ],
        summaryNotes: [
          'Three-tier grievance system: AMC/RTA (30 days) → SEBI SCORES 2.0 (30 days, with auto-escalation) → SEBI Ombudsman',
          'SCORES 2.0 = SEBI Complaint Redressal System (upgraded) — fully online at scores.gov.in; complaint tracking with unique ID; auto-escalation feature',
          'AMC must resolve complaints within 30 days; every AMC has a designated compliance officer and Investor Relations Officer',
          'SCORES does NOT handle complaints about market losses — only operational and service-related grievances',
          'Distributor misconduct complaints can lead to ARN suspension/cancellation — ethical conduct is a regulatory requirement',
        ],
        relatedTopics: ['account-statements', 'non-financial-transactions', 'kyc-requirements'],
      },
    },

    // ─── Section 10: Special Categories ──────────────────────────────────
    {
      id: 'special-categories',
      title: 'Special Categories — NRI, Minor, HUF, Trust, Corporate',
      slug: 'special-categories',
      content: {
        definition:
          'Special category investors are non-individual or non-resident investors whose mutual fund investments are governed by additional regulations beyond the standard individual investor norms. These categories include Non-Resident Indians (NRIs), Persons of Indian Origin (PIOs), Overseas Citizens of India (OCIs), minors, Hindu Undivided Families (HUFs), trusts, corporates, partnership firms, and small investors eligible for micro-SIP schemes. Each category has specific KYC requirements, documentation, operational rules, and regulatory restrictions.',
        explanation:
          'Distributors will encounter all these categories at some point in their practice. The most common special category is NRIs — and NRI transactions are where most distributors stumble. Here is a category-by-category breakdown.\n\nNRI (Non-Resident Indian): NRIs can invest in Indian mutual funds on a repatriation basis (can take money back abroad) or non-repatriation basis (money stays in India). For repatriation, an NRE (Non-Resident External) or FCNR (Foreign Currency Non-Resident) bank account is required. For non-repatriation, an NRO (Non-Resident Ordinary) account is used. Important restriction: NRIs from certain countries (USA and Canada primarily) face restrictions because of FATCA (Foreign Account Tax Compliance Act) compliance requirements — many AMCs do not accept investments from US/Canada-based NRIs due to the high compliance burden. Additionally, there are restrictions on NRI investments in certain sectoral and thematic funds. NRIs investing through the mutual fund route (as opposed to the FPI route) follow different regulations, and distributors must understand these distinctions.\n\nPIO (Person of Indian Origin) and OCI (Overseas Citizen of India): Treated similarly to NRIs for mutual fund investment purposes. They need valid PIO/OCI cards and follow the same NRE/NRO banking route.\n\nMinor: A minor (below 18 years) can invest in mutual funds through a guardian. The guardian must be a natural guardian (parent) or a court-appointed guardian. The guardian operates the account on the minor\'s behalf. At age 18, the minor-to-major transition must be completed — all transactions freeze until this is done.\n\nHUF (Hindu Undivided Family): The Karta (head of the HUF) operates the MF account. The HUF PAN is used (not the Karta\'s individual PAN). HUF has its own separate tax identity.\n\nTrust and Corporate: Require board resolution or trust deed authorizing the investment, along with list of authorized signatories, PAN of the entity, and KYC of the authorized persons. Operational procedures are more complex.\n\nMicro-SIP: For small investors who may not have PAN, SEBI allows investments up to ₹50,000 per year per AMC with simplified KYC. SIP amounts can be as low as ₹100. This was designed to bring financial inclusion to the masses. With the Indian MF industry now having over 27 crore folios and AUM exceeding ₹82 lakh crore (as of February 2026), initiatives like Micro-SIP play a vital role in expanding the investor base.',
        realLifeExample:
          'For example, consider Deepa, an MFD in Hyderabad, who handles three special category clients in one month:\n\n1. NRI Client — Vikram in Singapore: Vikram wants to invest ₹15,00,000 in Indian equity funds on a repatriation basis. Deepa facilitates the process: (a) Opening an NRE bank account with SBI (if not already done), (b) Completing KYC with NRI address proof (Singapore residence permit), (c) Signing the application with Vikram\'s PAN and Indian address proof (parents\' address), (d) Selecting repatriation basis on the form. Vikram transfers ₹15,00,000 from his Singapore account to his NRE account, and the investment is processed. Deepa verifies that Vikram is in Singapore, not USA/Canada, so there are no FATCA restrictions. Had Vikram been in the USA, most AMCs would have rejected his application. Deepa also notes that certain sectoral/thematic funds may have restrictions for NRI investors.\n\n2. Minor Client — 14-year-old Arjun: Arjun\'s father Mr. Sharma wants to start a SIP of ₹2,000/month in Arjun\'s name for his college fund. The process involves: (a) Arjun as the investor (minor), (b) Mr. Sharma as the guardian, (c) Arjun\'s birth certificate and Mr. Sharma\'s PAN, (d) Bank account must be a joint account (Arjun + Mr. Sharma) or Mr. Sharma\'s account, (e) When Arjun turns 18, the SIP will stop and he must complete the minor-to-major transition himself.\n\n3. Micro-SIP Client — Lakshmi (vegetable vendor): Lakshmi does not have a PAN card but wants to save ₹500/month. Deepa processes a Micro-SIP with Lakshmi\'s Aadhaar card and a passport-size photo. Total investment will stay under ₹50,000/year, so PAN-exempt simplified KYC is sufficient. This is financial inclusion at its best — a vegetable vendor building wealth through mutual funds.',
        keyPoints: [
          'NRI: can invest on repatriation basis (NRE/FCNR account) or non-repatriation basis (NRO account); FPI route vs MF route have different regulatory frameworks',
          'NRIs from USA/Canada face restrictions due to FATCA compliance — many AMCs do not accept investments from these countries; certain sectoral/thematic funds may have additional NRI restrictions',
          'PIO/OCI: treated similarly to NRIs for mutual fund investment purposes',
          'Minor: guardian (natural parent or court-appointed) operates the account; transition at age 18 freezes all transactions',
          'HUF: Karta is the first holder; HUF PAN is used (not Karta\'s individual PAN); separate tax identity',
          'Trust/Corporate: board resolution + authorized signatories + entity PAN + KYC of authorized persons required',
          'Micro-SIP: for small investors without PAN; up to ₹50,000/year per AMC; simplified KYC with any government photo ID',
          'KYC requirements are additional for special categories — NRI address proof, guardian documents, board resolutions etc.',
        ],
        faq: [
          {
            question: 'Can US-based NRIs invest in Indian mutual funds?',
            answer:
              'It is extremely limited. Due to FATCA (Foreign Account Tax Compliance Act) compliance requirements, most Indian AMCs do not accept investments from US-based NRIs. Only a few AMCs (like UTI, SBI MF, and a handful of others) offer limited access to US NRIs, and even they have a restricted list of eligible schemes. Canada-based NRIs face similar restrictions. This is one of the most frequently asked questions in practice.',
          },
          {
            question: 'What is the difference between repatriation and non-repatriation basis for NRI investments?',
            answer:
              'Repatriation basis means the NRI can take the investment proceeds (principal + gains) back to their country of residence. This requires an NRE or FCNR bank account. Non-repatriation basis means the investment proceeds remain in India — credited to an NRO account. The choice must be declared at the time of investment and is mentioned on the application form.',
          },
          {
            question: 'Can a minor open a mutual fund account without a parent as guardian?',
            answer:
              'Yes, but only with a court-appointed guardian. If the parents are alive, they are the natural guardians by default. If both parents are deceased or incapacitated, a court-appointed guardian can operate the minor\'s mutual fund account. The guardian appointment order must be submitted with the application.',
          },
          {
            question: 'What documents does a corporate need to invest in mutual funds?',
            answer:
              'A corporate entity needs: (a) Board resolution authorizing the investment, (b) List of authorized signatories with specimen signatures, (c) PAN of the company, (d) Certificate of Incorporation, (e) Memorandum and Articles of Association, (f) KYC of authorized signatories. The authorized persons specified in the board resolution are the only ones who can execute transactions.',
          },
          {
            question: 'What is a Micro-SIP and who is it designed for?',
            answer:
              'Micro-SIP is designed for small investors who may not have a PAN card. It allows investments up to ₹50,000 per year per AMC with SIP amounts as low as ₹100-500. Simplified KYC (Aadhaar or any government photo ID) is sufficient. This initiative was created by SEBI and AMFI to promote financial inclusion and bring low-income earners into the formal investment system.',
          },
        ],
        mcqs: [
          {
            question:
              'An NRI investing in Indian mutual funds on a repatriation basis should use which type of bank account?',
            options: [
              'NRO (Non-Resident Ordinary) account',
              'Regular savings account in an Indian bank',
              'NRE (Non-Resident External) or FCNR account',
              'Any foreign bank account in the country of residence',
            ],
            correctAnswer: 2,
            explanation:
              'For repatriation basis investments, the NRI must use an NRE (Non-Resident External) or FCNR (Foreign Currency Non-Resident) bank account. NRO accounts are used for non-repatriation basis investments. Regular savings accounts and foreign bank accounts are not applicable for NRI mutual fund investments in India.',
          },
          {
            question:
              'In a Hindu Undivided Family (HUF) mutual fund account, the person who operates the account is the:',
            options: [
              'Eldest member of the family',
              'Any coparcener authorized by the family',
              'Karta (head of the HUF)',
              'A SEBI-registered advisor appointed by the family',
            ],
            correctAnswer: 2,
            explanation:
              'The Karta (head of the Hindu Undivided Family) is the person who operates the HUF mutual fund account. The HUF PAN is used for the investment, not the Karta\'s individual PAN. The HUF has a separate tax identity and files a separate income tax return.',
          },
          {
            question:
              'Which of the following NRI categories faces the most restrictions in investing in Indian mutual funds?',
            options: [
              'NRIs based in Singapore',
              'NRIs based in the UAE',
              'NRIs based in the United States',
              'NRIs based in the United Kingdom',
            ],
            correctAnswer: 2,
            explanation:
              'US-based NRIs face the most restrictions due to FATCA (Foreign Account Tax Compliance Act) compliance. Most Indian AMCs do not accept investments from US-based NRIs because of the high compliance burden. Only a few AMCs offer limited access. NRIs in other countries (Singapore, UAE, UK, etc.) generally face no such restrictions.',
          },
          {
            question:
              'Micro-SIPs allow investments without PAN for amounts up to:',
            options: [
              '₹10,000 per year per AMC',
              '₹25,000 per year per AMC',
              '₹50,000 per year per AMC',
              '₹1,00,000 per year per AMC',
            ],
            correctAnswer: 2,
            explanation:
              'Micro-SIPs allow PAN-exempt investments up to ₹50,000 per year per AMC. Simplified KYC with any government-issued photo ID (Aadhaar, voter ID, driving licence) is sufficient. SIP amounts can be as low as ₹100. This was designed by SEBI and AMFI to promote financial inclusion among small investors.',
          },
        ],
        summaryNotes: [
          'NRI: repatriation (NRE/FCNR account) or non-repatriation (NRO account); US/Canada NRIs face FATCA restrictions; certain sectoral/thematic funds restricted for NRIs',
          'Minor: guardian-operated until 18; natural parent or court-appointed guardian; all transactions freeze at age 18 until transition',
          'HUF: Karta operates the account; HUF PAN used (not Karta\'s personal PAN); separate tax entity',
          'Trust/Corporate: board resolution + authorized signatories + entity PAN required — more documentation than individual investors',
          'Micro-SIP: PAN-exempt up to ₹50,000/year/AMC; SIP from ₹100; simplified KYC — financial inclusion at its best',
        ],
        relatedTopics: ['kyc-requirements', 'non-financial-transactions', 'application-form'],
      },
    },
  ],
};
