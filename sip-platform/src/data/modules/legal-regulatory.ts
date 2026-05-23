import { LearningModule } from '@/types/learning';

export const legalRegulatoryModule: LearningModule = {
  id: 'legal-regulatory',
  title: 'Legal & Regulatory Framework',
  slug: 'legal-regulatory',
  icon: 'Scale',
  description: 'Master the SEBI (Mutual Funds) Regulations 2026 (replacing the 1996 framework from April 1, 2026), offer documents (SID, SAI, KIM), investor rights, and advertisement guidelines. Highest weightage topic in the NISM VA exam.',
  level: 'intermediate',
  color: 'from-red-500 to-rose-600',
  estimatedTime: '60 min',
  sections: [
    // ─── Section 1: SEBI (Mutual Funds) Regulations — Overview ───
    {
      id: 'sebi-regulations-overview',
      title: 'SEBI (Mutual Funds) Regulations — Overview',
      slug: 'sebi-regulations-overview',
      content: {
        definition: 'The SEBI (Mutual Funds) Regulations form the principal legal framework governing the establishment, operation, and management of mutual funds in India. Issued under the Securities and Exchange Board of India Act, 1992, these regulations provide comprehensive rules covering registration of mutual funds, constitution of AMCs and trustees, launch and management of schemes, investment restrictions, accounting and valuation norms, and investor protection mechanisms. The original SEBI (Mutual Funds) Regulations, 1996 — which replaced the earlier 1993 guidelines — served as the foundation for nearly three decades. Effective April 1, 2026, SEBI is replacing the 1996 Regulations with the new SEBI (Mutual Funds) Regulations, 2026, a streamlined framework condensed from 162 pages to 88 pages, with word count reduced by 54% and provisos cut from 59 to fewer than 15. Every mutual fund in India — whether sponsored by a bank, financial institution, or private entity — must comply with these regulations in their entirety. The industry now manages over ₹82 lakh crore in AUM across 27+ crore folios.',
        explanation: 'The mutual fund industry in India has transformed dramatically since the early days when UTI was the sole significant player and regulatory oversight was minimal. SEBI\'s introduction of the 1996 Regulations was a watershed moment that professionalized the industry. Now, with the SEBI (Mutual Funds) Regulations, 2026 taking effect from April 1, 2026, the framework has been modernized and streamlined while retaining robust investor protections. These regulations serve as the constitution of the mutual fund industry. They cover everything from how a mutual fund is established (registration) to how it is wound up. The key chapters that NISM VA exam candidates must know include: Registration, Constitution and Management, Schemes, Investment Restrictions, Fees/Accounting/Valuation, and Inspections and Penalties. Among the notable changes in the 2026 Regulations: the new TER framework now separates Base Expense Ratio (BER), Brokerage, and Regulatory/Statutory levies. Brokerage caps have been reduced (Cash market from 12bps to 6bps, Derivatives from 5bps to 2bps). The additional 5bps exit load allowance has been removed. Performance-linked expense ratios are now permitted. Scheme categories expand from 36 to 40, adding Life-Cycle Funds and Sectoral Debt Funds, while Solution-Oriented Schemes are being discontinued. Portfolio overlap caps of 50% have been introduced for thematic/sectoral funds, with mandatory monthly disclosure of category-wise overlap. SEBI has also introduced a voluntary debit freeze facility for folios, effective April 30, 2026. Over the years, SEBI has issued hundreds of circulars amending and updating these regulations — TER limits, risk-o-meter, side-pocketing, categorization norms — all building on the regulatory framework. Distributors do not need to memorize every regulation number, but understanding the spirit and structure of these rules is essential because they directly affect how products are sold, serviced, and recommended to clients.',
        realLifeExample: 'Consider Rajesh, a new mutual fund distributor in Chennai, who wants to understand why an individual cannot simply start an AMC. The answer lies squarely in the regulations: To set up a mutual fund, a sponsor (such as a bank or financial institution) with a minimum net worth of ₹5 crore is required, along with a 5-year track record in financial services and positive net worth in at least 3 of the last 5 years. The sponsor must contribute at least 40% of the AMC\'s net worth. Additionally, a board of trustees (at least 4 members, with two-thirds being independent), an AMC registered with SEBI (with a minimum net worth of ₹50 crore), and a custodian to hold the assets are all mandatory. This explains why there are only about 44 AMCs in India — the entry barriers are deliberately high to protect investors. When a client asks, "Is my money safe?" a distributor can confidently explain this multi-layered regulatory structure: sponsor → trustees → AMC → custodian, all under SEBI\'s oversight.',
        keyPoints: [
          'SEBI (Mutual Funds) Regulations, 1996 is being replaced by the SEBI (Mutual Funds) Regulations, 2026, effective April 1, 2026 — streamlined from 162 pages to 88 pages',
          'The 2026 framework introduces a new TER structure: Base Expense Ratio (BER) + Brokerage + Regulatory/Statutory levies, with reduced brokerage caps (Cash 6bps, Derivatives 2bps)',
          'A mutual fund in India has a three-tier structure mandated by these regulations: Sponsor → Trustee → AMC',
          'The sponsor must have a minimum net worth of ₹5 crore and contribute at least 40% of the AMC\'s net worth',
          'The AMC must maintain a minimum net worth of ₹50 crore at all times',
          'At least two-thirds of the trustees must be independent — they act as watchdogs protecting investor interests',
          'Scheme categories expand from 36 to 40 under the 2026 Regulations (adding Life-Cycle Funds, Sectoral Debt Funds; discontinuing Solution-Oriented Schemes)',
          'India\'s mutual fund industry now manages ₹82+ lakh crore AUM across 27+ crore folios',
        ],
        faq: [
          {
            question: 'Why were the 1993 guidelines replaced with the 1996 regulations, and why is the 1996 framework now being replaced by the 2026 Regulations?',
            answer: 'The 1993 guidelines were basic and did not provide adequate investor protection or operational standards. The 1996 Regulations brought in mandatory registration, trustee oversight, investment restrictions, and detailed disclosure requirements. Now, after nearly 30 years, the 2026 Regulations replace the 1996 framework with a streamlined, modern rulebook — reduced from 162 pages to 88 pages, provisos cut from 59 to fewer than 15, and updated provisions covering new TER structures, expanded categories, portfolio overlap caps, and performance-linked fees.',
          },
          {
            question: 'What is the difference between a regulation and a SEBI circular?',
            answer: 'Regulations are the primary law — the foundational framework. SEBI circulars are directives that interpret, clarify, or modify specific aspects of the regulations. Both are legally binding. For example, the regulations set the framework for expense ratios, while SEBI circulars specified exact TER slabs based on AUM. Under the 2026 Regulations, the new BER + Brokerage + Levies structure replaces the earlier all-inclusive TER approach. In the NISM exam, candidates may be tested on both regulations and key circulars.',
          },
          {
            question: 'Can a mutual fund operate without SEBI registration?',
            answer: 'No. The regulations explicitly state that no person shall set up or operate a mutual fund without obtaining a certificate of registration from SEBI. Operating without registration is a criminal offence under the SEBI Act, punishable with imprisonment and fines. This is a straightforward exam question — the answer is always NO.',
          },
          {
            question: 'How do these regulations protect a small investor?',
            answer: 'Multiple layers: (1) Mandatory registration ensures only qualified entities operate mutual funds, (2) Independent trustees oversee AMC activities, (3) Investment restrictions prevent reckless risk-taking, (4) Daily NAV disclosure ensures transparency, (5) The custodian holds assets separately from the AMC, (6) Detailed offer documents provide complete information, (7) SEBI can inspect and penalize any non-compliance, and (8) The new voluntary debit freeze facility (effective April 30, 2026) allows investors to freeze their folios against unauthorized transactions.',
          },
          {
            question: 'What happens if an AMC violates SEBI regulations?',
            answer: 'SEBI has extensive powers under the regulations: it can issue warning letters, impose monetary penalties (up to ₹25 crore for certain violations), suspend or cancel registration, bar individuals from the securities market, and even initiate criminal prosecution. In practice, SEBI regularly issues show-cause notices and penalty orders against AMCs and individuals for violations.',
          },
        ],
        mcqs: [
          {
            question: 'The SEBI (Mutual Funds) Regulations, 1996 replaced which earlier set of guidelines?',
            options: [
              'SEBI (Mutual Funds) Regulations, 1991',
              'SEBI (Mutual Funds) Guidelines, 1993',
              'RBI Mutual Fund Guidelines, 1994',
              'AMFI Code of Conduct, 1995',
            ],
            correctAnswer: 1,
            explanation: 'The SEBI (Mutual Funds) Regulations, 1996 replaced the earlier SEBI (Mutual Funds) Guidelines of 1993. The 1993 guidelines were the first attempt at regulating mutual funds after SEBI was established, but the 1996 Regulations provided a far more comprehensive and enforceable framework. Note: The 1996 Regulations are now being replaced by the SEBI (Mutual Funds) Regulations, 2026, effective April 1, 2026.',
          },
          {
            question: 'What is the minimum net worth requirement for an Asset Management Company (AMC) as per SEBI Regulations?',
            options: [
              '₹10 crore',
              '₹25 crore',
              '₹50 crore',
              '₹100 crore',
            ],
            correctAnswer: 2,
            explanation: 'As per SEBI (Mutual Funds) Regulations, the AMC must maintain a minimum net worth of ₹50 crore at all times. This is a frequently tested fact in the NISM VA exam. Do not confuse this with the sponsor\'s minimum net worth requirement of ₹5 crore.',
          },
          {
            question: 'What proportion of trustees of a mutual fund must be independent of the sponsor?',
            options: [
              'At least one-half',
              'At least two-thirds',
              'At least three-fourths',
              'All trustees must be independent',
            ],
            correctAnswer: 1,
            explanation: 'At least two-thirds of the trustees must be independent of the sponsor or the AMC. This ensures that the majority of the trustee board acts as an independent watchdog protecting investor interests, without being influenced by the sponsor or AMC management.',
          },
          {
            question: 'The sponsor of a mutual fund is required to contribute at least _____ of the net worth of the AMC.',
            options: [
              '25%',
              '40%',
              '51%',
              '75%',
            ],
            correctAnswer: 1,
            explanation: 'The sponsor must contribute at least 40% of the net worth of the AMC. This ensures the sponsor has significant financial stake and commitment to the mutual fund business. This is a classic NISM exam question — remember the number 40%.',
          },
        ],
        summaryNotes: [
          'SEBI (Mutual Funds) Regulations, 1996 is being replaced by the 2026 Regulations effective April 1, 2026 — streamlined from 162 to 88 pages with provisos reduced from 59 to <15',
          'Three-tier structure: Sponsor (sets up) → Trustees (oversee) → AMC (manages) — each layer has specific SEBI-mandated requirements',
          'Key numbers to memorize: AMC net worth ₹50 crore, Sponsor net worth ₹5 crore, Sponsor contribution 40%, Independent trustees two-thirds',
          'New 2026 TER framework: BER + Brokerage (Cash 6bps, Derivatives 2bps) + Regulatory/Statutory levies; performance-linked expense ratios now allowed',
          'Industry scale: ₹82+ lakh crore AUM, 27+ crore folios, 44 AMCs, categories expanding from 36 to 40',
        ],
        relatedTopics: ['sponsor-trustee-amc', 'offer-document-sid-sai', 'investor-rights'],
      },
    },

    // ─── Section 2: Offer Document — SID, SAI & KIM Explained ──────────
    {
      id: 'offer-document-sid-sai',
      title: 'Offer Document — SID, SAI & KIM Explained',
      slug: 'offer-document-sid-sai',
      content: {
        definition: 'The Offer Document of a mutual fund scheme is the comprehensive legal document that provides all material information a prospective investor needs to make an informed investment decision. It consists of two parts: the Scheme Information Document (SID), which contains scheme-specific details like investment objective, asset allocation, risk factors, and fee structure; and the Statement of Additional Information (SAI), which contains AMC-level information like financial statements, key personnel details, and legal disclosures. Together, SID and SAI form the complete Offer Document. A shorter version called the Key Information Memorandum (KIM) is also prepared for quick reference.',
        explanation: 'The Offer Document functions like a comprehensive product manual. The SID is the operational handbook — it describes everything about the specific scheme: what it invests in, how risky it is, what fees apply, when investors can exit, and what benchmark it tracks. The SAI is the organizational manual — it covers the AMC, the sponsor, the trustees, and the financial history. Together, they provide the complete picture. In practice, relatively few retail investors read the entire Offer Document cover to cover. However, distributors are professionally and legally obligated to read it. SEBI and AMFI hold distributors responsible for understanding the products they recommend. If a client complains that they were not informed about exit loads or risks, and the information was clearly mentioned in the SID, the regulatory burden falls on the distributor. Under the SEBI (Mutual Funds) Regulations, 2026, the new TER framework now separates Base Expense Ratio (BER), Brokerage, and Regulatory/Statutory levies — all of which must be disclosed in the SID. The Offer Document must be filed with SEBI at least 21 days before the NFO (New Fund Offer) opens — this gives SEBI time to review and raise objections. After launch, the SID and SAI must be updated at least once a year.',
        realLifeExample: 'Consider Priya, a new MFD in Hyderabad, preparing to recommend a large-cap equity fund to her client Venkat. Before doing so, she downloads the SID from the AMC website and reviews the key details: Investment Objective — long-term capital appreciation by investing in large-cap stocks. Asset Allocation — 80-100% in equity of large-cap companies, 0-20% in debt and money market instruments. Benchmark — Nifty 100 TRI. Exit Load — 1% if redeemed within 1 year. Expense Ratio — disclosed under the new BER + Brokerage + Levies framework. Risk-o-meter — Very High. She then checks the SAI and notes the AMC\'s net worth, sponsor credentials, and the fund manager\'s experience. Armed with this information, Priya explains to Venkat the fund\'s investment mandate, risk level, exit load implications, and fee structure. This is exactly how a professional distributor should use offer documents — as a foundation for transparent client communication.',
        keyPoints: [
          'Offer Document = SID + SAI — these two documents together form the complete legal disclosure for any mutual fund scheme',
          'SID (Scheme Information Document) covers scheme-specific details: investment objective, asset allocation, risk factors, loads, TER, benchmark',
          'SAI (Statement of Additional Information) covers AMC-level details: sponsor info, trustee details, AMC financials, key personnel, legal structure',
          'The Offer Document must be filed with SEBI at least 21 days before the New Fund Offer (NFO) opens',
          'Both SID and SAI must be updated at least once a year — updated versions are available on the AMC website',
          'KIM (Key Information Memorandum) is the abridged version of SID and must accompany every application form',
          'Distributors are legally expected to read and understand the Offer Document before recommending any scheme',
          'Any change in fundamental attributes mentioned in the SID requires unitholder approval and provides exit option',
        ],
        faq: [
          {
            question: 'What is the difference between SID and SAI?',
            answer: 'SID is scheme-specific — it covers one particular scheme (its objective, risks, fees, benchmark). SAI is AMC-specific — it covers the AMC managing that scheme (sponsor details, trustee board, AMC financials, legal information). One AMC has one SAI but multiple SIDs — one for each scheme it manages. Together they form the Offer Document.',
          },
          {
            question: 'Why must the Offer Document be filed 21 days before the NFO?',
            answer: 'The 21-day advance filing gives SEBI time to review the document and raise any objections or require modifications. If SEBI does not communicate any observations within 21 working days, the AMC can proceed with the NFO. This pre-launch review is a crucial investor protection mechanism — it ensures no misleading or non-compliant scheme reaches investors.',
          },
          {
            question: 'Can an AMC launch a scheme without filing an Offer Document?',
            answer: 'Absolutely not. Filing the Offer Document (SID + SAI) with SEBI is mandatory before launching any scheme, whether it is an NFO or a change in an existing scheme\'s fundamental attributes. Launching without proper documentation is a serious regulatory violation that can result in penalties and cancellation of AMC registration.',
          },
          {
            question: 'How often must the Offer Document be updated?',
            answer: 'The SID and SAI must be updated at least once every year. Additionally, any material change — like a change in fund manager, expense ratio, exit load, or benchmark — must be communicated to unitholders and updated in the documents promptly. The latest versions are always available on the AMC website and AMFI portal.',
          },
          {
            question: 'As a distributor, am I legally required to read the Offer Document?',
            answer: 'Yes. AMFI code of conduct and SEBI regulations require distributors to understand the products they recommend. If a client later complains that they were not informed about risks, exit loads, or other material facts that were clearly stated in the SID, the regulatory and legal consequences fall on both the AMC and the distributor. Reading the SID before recommending any scheme is not optional — it is a professional duty.',
          },
        ],
        mcqs: [
          {
            question: 'The Offer Document of a mutual fund scheme consists of:',
            options: [
              'SID and KIM',
              'SID and SAI',
              'SAI and KIM',
              'SID, SAI, and KIM',
            ],
            correctAnswer: 1,
            explanation: 'The Offer Document consists of the Scheme Information Document (SID) and the Statement of Additional Information (SAI). KIM is a separate abridged document derived from the SID — it is not part of the Offer Document itself. This is a classic trick question in the NISM exam.',
          },
          {
            question: 'How many days before the NFO must the Offer Document be filed with SEBI?',
            options: [
              '15 days',
              '21 days',
              '30 days',
              '45 days',
            ],
            correctAnswer: 1,
            explanation: 'The Offer Document must be filed with SEBI at least 21 days (working days) before the launch of the New Fund Offer. This gives SEBI adequate time to review the document and raise objections if necessary. Remember: 21 days for Offer Document filing.',
          },
          {
            question: 'Which document contains information about the AMC\'s financial statements and sponsor details?',
            options: [
              'Scheme Information Document (SID)',
              'Key Information Memorandum (KIM)',
              'Statement of Additional Information (SAI)',
              'Annual Report of the scheme',
            ],
            correctAnswer: 2,
            explanation: 'The SAI (Statement of Additional Information) contains AMC-level information including sponsor details, trustee information, AMC financial statements, key personnel, and legal disclosures. The SID focuses on scheme-specific details. Do not confuse SAI with SID — the exam loves this distinction.',
          },
          {
            question: 'How frequently must the SID and SAI be updated?',
            options: [
              'Every quarter',
              'Every 6 months',
              'At least once a year',
              'Only when there is a material change',
            ],
            correctAnswer: 2,
            explanation: 'SEBI mandates that both SID and SAI must be updated at least once a year. However, material changes (like change in fund manager or exit load) must be updated promptly and communicated to investors. The annual update is the minimum requirement, not the only requirement.',
          },
        ],
        summaryNotes: [
          'Offer Document = SID + SAI — never include KIM as part of the Offer Document in the exam; KIM is a separate abridged document',
          'SID = scheme-specific (what the scheme does); SAI = AMC-specific (who manages it) — one SAI per AMC, one SID per scheme',
          'Filing with SEBI: 21 days before NFO — this number appears frequently in the exam',
          'Annual update is mandatory for both SID and SAI — material changes require immediate disclosure',
          'Reading the SID is a distributor\'s professional duty — ignorance of scheme details is not a valid defence',
        ],
        relatedTopics: ['kim-explained', 'sid-deep-dive', 'sebi-regulations-overview'],
      },
    },

    // ─── Section 3: Key Information Memorandum — What to Check ──────────
    {
      id: 'kim-explained',
      title: 'Key Information Memorandum — What to Check',
      slug: 'kim-explained',
      content: {
        definition: 'The Key Information Memorandum (KIM) is a concise, abridged version of the Scheme Information Document (SID) that provides the most essential information about a mutual fund scheme in a quick-reference format. SEBI mandates that a KIM must accompany every application form — whether physical or digital. It serves as the investor\'s first point of reference, containing the investment objective, risk factors, asset allocation pattern, benchmark, minimum investment amount, fund manager details, load structure, and performance data. The KIM is not a substitute for the SID but rather a convenient summary designed to help investors make quick comparisons between schemes.',
        explanation: 'In practical terms, the KIM is the document most retail investors will actually read. While the SID can span 60-100 pages, the KIM is typically 2-4 pages — concise, clear, and designed for easy comparison. For distributors, mastering the KIM is essential professional practice. When a client asks about a scheme, a distributor should be able to walk through the KIM systematically, covering each critical section. The KIM must contain the scheme\'s investment objective in plain language, the asset allocation table showing where the money will go, the risk-o-meter classification, benchmark index, minimum application amounts for lump sum and SIP, current NAV, fund manager name and experience, loads (entry and exit), expense ratio details (now structured as BER + Brokerage + Levies under the 2026 Regulations), and the scheme\'s past performance versus benchmark. When an application form is submitted, the KIM accompanies it. SEBI made this mandatory precisely so that no investor can claim they were not informed about the basics. A distributor\'s responsibility is to highlight the critical parts — especially the risk level, exit load, and expense ratio — before the client signs.',
        realLifeExample: 'Consider the case of Meena, an MFD in Jaipur, meeting her client Arun, a 45-year-old government school teacher who wants to invest ₹3,00,000 lumpsum from his GPF partial withdrawal. Meena uses the KIM of a midcap equity fund to walk Arun through the key details systematically: Investment Objective — long-term capital appreciation by investing in midcap companies. Asset Allocation — 65-100% in midcap equity, 0-35% in other equities and debt. Risk-o-meter — Very High, meaning the fund can see sharp declines of 20-30% in a bad year. Benchmark — S&P BSE Midcap 150 TRI. Exit Load — 1% if redeemed within 1 year. Expense structure — disclosed under the new BER framework. Fund Manager — a professional with over two decades of experience. Past performance versus benchmark over standard periods. Arun now has a clear picture in under 5 minutes and makes an informed investment decision with a commitment to stay invested for at least 5 years. This is exactly how the KIM should be used — as a structured guided conversation tool between distributor and client.',
        keyPoints: [
          'KIM is the abridged version of SID — it is a concise 2-4 page summary of the most critical scheme information',
          'SEBI mandates that a KIM must accompany every mutual fund application form — physical or digital',
          'Key contents of KIM: investment objective, asset allocation, risk-o-meter level, benchmark, loads, TER, minimum investment, fund manager details',
          'KIM must include past performance data of the scheme versus its benchmark over standard periods (1, 3, 5 years and since inception)',
          'The KIM is NOT a substitute for the SID — it is a quick-reference document that supplements the full Offer Document',
          'Distributors should use the KIM as the primary presentation tool when explaining a scheme to clients',
          'KIM must be updated whenever there is a material change in scheme details like exit load, TER, or fund manager',
          'Every KIM must carry the standard disclaimer: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully"',
        ],
        faq: [
          {
            question: 'Is the KIM part of the Offer Document?',
            answer: 'No. The Offer Document consists of SID + SAI only. The KIM is a separate abridged document derived from the SID. This is a very important distinction for the NISM exam — many candidates confuse this. Think of KIM as the "cheat sheet" version of the SID, not a component of the Offer Document.',
          },
          {
            question: 'Can an investor invest without receiving the KIM?',
            answer: 'Technically, every application form must be accompanied by the KIM. In digital/online transactions, the KIM is made available on the platform. However, an investor can sign a declaration stating they have read and understood the SID/KIM and proceed with the investment even if they have not physically received a printed copy. The key is that the AMC/distributor must ensure the KIM was made available.',
          },
          {
            question: 'What should a distributor highlight from the KIM when presenting to a client?',
            answer: 'Five critical items should be highlighted: (1) Risk-o-meter level — is the client comfortable with this level of risk? (2) Exit load — does the client understand the lock-in implications? (3) Expense structure (BER + Brokerage + Levies under the 2026 framework) — what is the total annual cost? (4) Investment objective and asset allocation — does it match the client\'s goal? (5) Past performance vs benchmark — is the fund delivering on its mandate? Walking the client through these five items takes under 5 minutes and fulfils the distributor\'s disclosure obligations.',
          },
          {
            question: 'How is KIM different from a factsheet?',
            answer: 'The KIM is a regulatory document mandated by SEBI with specific required contents. A factsheet is a marketing document published monthly by the AMC with more detailed portfolio information, sector allocation, top holdings, and market commentary. The KIM is static between updates, while the factsheet changes monthly. Both are useful for distributors, but only the KIM is legally mandated to accompany application forms.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following is TRUE about the Key Information Memorandum (KIM)?',
            options: [
              'KIM is a part of the Offer Document along with SID and SAI',
              'KIM is an abridged version of the SAI',
              'KIM must accompany every mutual fund application form',
              'KIM is optional for direct plan investors',
            ],
            correctAnswer: 2,
            explanation: 'KIM must accompany every mutual fund application form as mandated by SEBI. Option A is wrong because the Offer Document consists only of SID + SAI (KIM is separate). Option B is wrong because KIM is an abridged version of SID, not SAI. Option D is wrong because KIM is mandatory for all investors regardless of plan type.',
          },
          {
            question: 'The KIM of a mutual fund scheme does NOT typically include:',
            options: [
              'Investment objective and asset allocation pattern',
              'Detailed financial statements of the AMC',
              'Exit load and expense ratio information',
              'Fund manager name and past performance data',
            ],
            correctAnswer: 1,
            explanation: 'Detailed financial statements of the AMC are part of the SAI (Statement of Additional Information), not the KIM. The KIM focuses on scheme-specific essentials like investment objective, asset allocation, risk level, loads, TER, and fund manager details. This is a distinction the NISM exam frequently tests.',
          },
          {
            question: 'The standard disclaimer "Mutual Fund investments are subject to market risks..." must appear on:',
            options: [
              'Only the SID and SAI',
              'Only television advertisements',
              'All scheme-related documents including KIM, advertisements, and application forms',
              'Only the KIM and application form',
            ],
            correctAnswer: 2,
            explanation: 'This standard risk disclaimer is mandatory on ALL scheme-related documents, advertisements (print, TV, digital), KIM, application forms, and any sales literature. SEBI requires this universal disclosure to ensure no investor can claim they were not warned about market risks.',
          },
        ],
        summaryNotes: [
          'KIM = abridged SID, NOT part of the Offer Document — this distinction is frequently tested and can determine exam marks',
          'Must accompany every application form (physical or digital) — this is a SEBI mandate, not an optional practice',
          'Five things to always highlight from KIM: risk-o-meter, exit load, TER, asset allocation, and past performance vs benchmark',
          'KIM is a distributor\'s most effective sales tool — mastering a 5-minute walkthrough for clients is essential practice',
          'Updated whenever material changes occur — do not use outdated KIMs with clients',
        ],
        relatedTopics: ['offer-document-sid-sai', 'sid-deep-dive', 'advertisement-guidelines'],
      },
    },

    // ─── Section 4: Scheme Information Document — Deep Dive ─────────────
    {
      id: 'sid-deep-dive',
      title: 'Scheme Information Document — Deep Dive',
      slug: 'sid-deep-dive',
      content: {
        definition: 'The Scheme Information Document (SID) is the primary and most detailed disclosure document for a mutual fund scheme. It contains exhaustive information about the scheme\'s investment objective, asset allocation pattern, investment strategy, risk factors (both standard and scheme-specific), fees and expenses (including Total Expense Ratio), load structure, benchmark index, fund manager details, tax implications, and the fundamental attributes of the scheme. The SID is legally binding — the AMC must operate the scheme within the parameters disclosed in the SID. Any deviation from the stated fundamental attributes requires prior approval from unitholders and SEBI, making the SID the investor\'s primary legal safeguard.',
        explanation: 'A critical point that distinguishes the SID from a mere compliance document is its legal nature — it functions as a binding contract between the AMC and the investor. When the SID states that the fund will invest 65-100% in equity, the fund manager cannot unilaterally shift 80% into bonds. When the SID specifies a 1% exit load for 1 year, the AMC cannot change it to 2% for 2 years without following a formal process. This is what makes the SID a powerful investor protection tool. The concept that is absolutely essential for the NISM exam is "fundamental attributes." These are the core characteristics of a scheme that define its identity — the investment objective (growth vs income), asset allocation type (equity vs debt), investment pattern (large-cap vs mid-cap), and fee structure. Under the SEBI (Mutual Funds) Regulations, 2026, fee disclosures in the SID now follow the new structure of Base Expense Ratio (BER) + Brokerage + Regulatory/Statutory levies. If the AMC wants to change any fundamental attributes, it must: (1) send a written notice to all unitholders, (2) publish the notice in newspapers, (3) give unitholders at least 30 days to exit at prevailing NAV without any exit load, and (4) obtain approval from SEBI. This 30-day no-load exit window is one of the most important investor rights, and the NISM exam tests it regularly. Additionally, under the 2026 Regulations, portfolio overlap caps of 50% apply for thematic/sectoral funds, with monthly disclosure of category-wise overlap now mandatory — information that must be reflected in scheme documents.',
        realLifeExample: 'For example, when SEBI mandated mutual fund scheme recategorization in 2018, many AMCs had to change the fundamental attributes of their schemes. Consider a fund originally called "XYZ Opportunities Fund" — a multi-cap fund that invested freely across market caps. Under the SEBI categorization norms, the AMC decided to convert it into a "Large Cap Fund" with a mandate to invest at least 80% in large-cap stocks. This constituted a change in fundamental attributes — the investment pattern was fundamentally altered. The AMC sent letters to all 4.5 lakh unitholders explaining the change in mandate and providing a 30-day window to exit at current NAV without paying any exit load. A distributor with 200 clients in this scheme personally contacted each one, explained the implications, and helped 35 clients who wanted mid-cap exposure switch to a proper multi-cap fund during the exit window. Under the 2026 Regulations, with scheme categories expanding from 36 to 40 and Solution-Oriented Schemes being discontinued, similar fundamental attribute changes may occur — making it essential for distributors to understand this process thoroughly.',
        keyPoints: [
          'SID is the most comprehensive disclosure document for a mutual fund scheme — typically 60-100 pages',
          'It is legally binding: the AMC must operate the scheme strictly within the parameters stated in the SID',
          'Key sections of SID: Investment Objective, Asset Allocation, Risk Factors, Fees/Expenses, Load Structure, Tax Treatment, Fundamental Attributes',
          'Fundamental attributes include: investment objective, asset allocation pattern, investment type (equity/debt/hybrid), and terms of issue (fees, loads)',
          'Change in fundamental attributes requires: written notice to unitholders + newspaper publication + 30-day no-load exit window + SEBI approval',
          'Risk factors in the SID are of two types: Standard Risk Factors (common to all MFs) and Scheme-Specific Risk Factors (unique to that scheme)',
          'The SID must disclose the Total Expense Ratio (TER) — the annual fee the AMC charges, which is deducted from NAV',
          'Distributors must read and understand the SID before recommending any scheme — professional negligence is no excuse',
        ],
        faq: [
          {
            question: 'What exactly are "fundamental attributes" of a mutual fund scheme?',
            answer: 'Fundamental attributes are the core defining characteristics of a scheme as stated in the SID. They include: (1) the investment objective (e.g., capital appreciation vs regular income), (2) the asset allocation pattern (e.g., 80-100% equity), (3) the type/category of the scheme (e.g., large-cap equity), and (4) the terms of issue including fee structure and load pattern. These attributes collectively define "what the scheme is" — changing any of them fundamentally alters the scheme\'s identity.',
          },
          {
            question: 'What happens if a fund manager deviates from the SID without approval?',
            answer: 'If a fund manager invests outside the parameters stated in the SID — for example, investing in small-caps when the SID says large-cap only — it is a regulatory violation. The trustees are supposed to catch such deviations through regular monitoring. If caught, SEBI can impose penalties on the AMC, the fund manager, and even the trustees for failure to supervise. The investors can also seek legal remedy for any losses caused by such unauthorized deviations.',
          },
          {
            question: 'How is the 30-day exit window calculated for fundamental attribute changes?',
            answer: 'When the AMC announces a change in fundamental attributes, it must give unitholders at least 30 days from the date of the notice to exit at the prevailing NAV without any exit load. This means even if the scheme normally has a 1% exit load for redemptions within 1 year, during this 30-day window, all unitholders can redeem without any exit load. The 30-day period starts from the date the written communication is dispatched to unitholders.',
          },
          {
            question: 'Does the SID cover tax implications for investors?',
            answer: 'Yes, the SID includes a section on tax implications covering capital gains tax (short-term and long-term), dividend distribution tax (now abolished — dividends are taxed in the hands of investors), TDS provisions, and stamp duty. However, the SID typically includes a disclaimer that tax laws are subject to change and investors should consult their tax advisors for personalized advice.',
          },
          {
            question: 'Can an AMC change the fund manager without changing fundamental attributes?',
            answer: 'Yes. A change in fund manager is not considered a change in fundamental attributes. However, SEBI requires the AMC to inform unitholders about the change. While this may not trigger the 30-day exit window, it is material information — if a star fund manager leaves, many investors may want to reconsider their investment. Distributors who proactively inform clients about fund manager changes build stronger trust relationships.',
          },
        ],
        mcqs: [
          {
            question: 'When a mutual fund AMC changes the fundamental attributes of a scheme, unitholders must be given at least _____ days to exit without exit load.',
            options: [
              '15 days',
              '21 days',
              '30 days',
              '45 days',
            ],
            correctAnswer: 2,
            explanation: 'Unitholders must be given at least 30 days to exit at the prevailing NAV without any exit load when the fundamental attributes of a scheme are changed. This is one of the most frequently tested facts in the NISM VA exam. Remember: 21 days for filing Offer Document with SEBI, 30 days for unitholder exit window.',
          },
          {
            question: 'Which of the following is NOT a fundamental attribute of a mutual fund scheme?',
            options: [
              'Investment objective',
              'Asset allocation pattern',
              'Name of the fund manager',
              'Type/category of the scheme',
            ],
            correctAnswer: 2,
            explanation: 'The name of the fund manager is NOT a fundamental attribute. Fundamental attributes include the investment objective, asset allocation pattern, type/category of scheme, and terms of issue (fee and load structure). A fund manager change does not trigger the formal fundamental attribute change process, though it must be disclosed to unitholders.',
          },
          {
            question: 'Risk factors disclosed in the SID are of:',
            options: [
              'One type only — market risk',
              'Two types — Standard Risk Factors and Scheme-Specific Risk Factors',
              'Three types — market, credit, and liquidity risk only',
              'No specific categorization is required by SEBI',
            ],
            correctAnswer: 1,
            explanation: 'The SID must disclose two categories of risk factors: Standard Risk Factors (common to all mutual fund schemes, like market risk and NAV fluctuation) and Scheme-Specific Risk Factors (unique to the particular scheme based on its investment strategy, like concentration risk for a sectoral fund or credit risk for a debt fund).',
          },
          {
            question: 'A change in which of the following would trigger the process for change in fundamental attributes?',
            options: [
              'Replacement of the fund manager',
              'Change in the registrar and transfer agent',
              'Modification of the scheme\'s investment objective from growth to income',
              'Change in the custodian of the fund',
            ],
            correctAnswer: 2,
            explanation: 'Modification of the investment objective (e.g., from growth/capital appreciation to income/dividend focus) is a change in fundamental attributes. This triggers the full process: unitholder notice, newspaper publication, 30-day no-load exit window, and SEBI approval. Changes in fund manager, RTA, or custodian are operational changes, not fundamental attribute changes.',
          },
        ],
        summaryNotes: [
          'SID is a legal contract between AMC and investor — the AMC must operate within SID parameters or face regulatory action',
          'Fundamental attributes = investment objective + asset allocation + scheme type + terms of issue (fee/load) — memorize these four',
          'Change in fundamental attributes triggers: notice to unitholders + newspaper publication + 30-day no-load exit + SEBI approval',
          'Two types of risk factors: Standard (common to all MFs) and Scheme-Specific (unique to that scheme) — exam loves this distinction',
          'Fund manager change is NOT a fundamental attribute change — but it is material information that must be disclosed',
        ],
        relatedTopics: ['offer-document-sid-sai', 'kim-explained', 'investor-rights'],
      },
    },

    // ─── Section 5: Investor Rights & Obligations ──────────────────────
    {
      id: 'investor-rights',
      title: 'Investor Rights & Obligations',
      slug: 'investor-rights',
      content: {
        definition: 'Investor rights in the context of mutual funds are the legally enforceable entitlements that SEBI (Mutual Funds) Regulations guarantee to every unitholder of a mutual fund scheme. Under the SEBI (Mutual Funds) Regulations, 2026 (replacing the 1996 framework from April 1, 2026), these include the right to receive complete scheme information (via SID, SAI, KIM), the right to receive dividend or income distribution as declared, the right to redeem units at NAV-based prices, the right to vote on fundamental changes to the scheme, the right to receive a no-load exit window when fundamental attributes are altered, and the right to approach SEBI or the courts for grievance redressal. The 2026 Regulations also introduce a voluntary debit freeze facility for folios (effective April 30, 2026), adding an additional layer of investor protection against unauthorized transactions. Correspondingly, investors have obligations including providing accurate personal and financial information, complying with KYC requirements, and fulfilling tax obligations on their mutual fund gains.',
        explanation: 'Industry experience consistently shows that most investor grievances arise from unitholders not knowing their rights and distributors not informing them adequately. The rights that matter most in practice are as follows. First, the right to information: every investor has the right to receive the SID, SAI, KIM, annual report, half-yearly unaudited financial results, and portfolio disclosure. AMCs now publish full portfolios every month, providing an unprecedented level of transparency. Second, the right to redemption: this is a fundamental entitlement. No AMC can refuse to redeem units (except in specific cases like segregated portfolios during credit events). Redemption must be processed at the applicable NAV and proceeds credited within the prescribed timeline — T+3 for equity, T+2 for debt, T+1 for liquid funds. Third, the voting right: when fundamental attributes change, unitholders can vote. Each unit equals one vote. If a majority disagrees with the change, it cannot proceed. Fourth, the exit right during fundamental changes: this 30-day no-load exit window serves as the investor\'s safety valve. Under the 2026 Regulations, SEBI has also introduced a voluntary debit freeze facility (effective April 30, 2026) allowing investors to freeze their folios against unauthorized debits — a significant new protection mechanism. However, rights come with responsibilities. Investors must complete KYC, provide accurate information (including tax residency and FATCA declarations), and cannot hold the AMC or distributor liable for market losses that are clearly disclosed as risks in the SID.',
        realLifeExample: 'Consider the case of Gopal, a retired bank officer in Nagpur, who invested ₹15,00,000 in a debt fund. The fund held bonds of a company that defaulted on its payments. The AMC created a "side pocket" — segregating the defaulted bonds into a separate portfolio. Gopal\'s rights as an investor were fully protected through this process: (1) He received units in both the main portfolio (liquid, tradeable) and the segregated portfolio (frozen until recovery). (2) The AMC was legally required to inform him in writing about the side-pocketing. (3) He could redeem from the main portfolio at any time at the revised NAV. (4) When the defaulted company eventually repaid, the recovery amount would be distributed to holders of the segregated units. (5) If the AMC were negligent, he could file a complaint with SEBI\'s SCORES portal. Gopal exercised his right to redeem ₹12,00,000 from the main portfolio (the portion not affected by the default) and chose to wait for recovery on the segregated portion. Two years later, the company partially repaid, and Gopal received ₹1,80,000 from the segregated units. This case illustrates how investor rights are protected at every step through the regulatory framework.',
        keyPoints: [
          'Right to Information: investors can demand SID, SAI, KIM, annual reports, portfolio disclosures, and account statements at any time',
          'Right to Redemption: units must be redeemed at NAV-based prices within prescribed timelines (T+3 equity, T+2 debt, T+1 liquid)',
          'Right to Income Distribution: when the AMC declares a dividend/IDCW, every unitholder on the record date receives their proportionate share',
          'Right to Vote: unitholders can vote on changes to fundamental attributes — one unit equals one vote',
          'Right to Exit Without Load: when fundamental attributes change, unitholders get 30 days to exit at NAV without exit load',
          'Right to Grievance Redressal: investors can file complaints on SEBI SCORES portal, approach the ombudsman, or take legal action',
          'Investor Obligation: must complete KYC before investing and provide accurate personal, financial, and tax residency information',
          'Investor Obligation: must comply with tax laws — capital gains tax, TDS, and FATCA/CRS declarations are the investor\'s responsibility',
          'New under 2026 Regulations: voluntary debit freeze facility for folios (effective April 30, 2026) — investors can freeze folios to prevent unauthorized debits',
        ],
        faq: [
          {
            question: 'Can an AMC refuse to redeem mutual fund units?',
            answer: 'Under normal circumstances, no. The right to redeem is fundamental. However, there are rare exceptions: (1) During a temporary suspension of redemption ordered by SEBI in extreme market conditions, (2) In a segregated portfolio (side pocket) — the segregated units are frozen until recovery, (3) In close-ended schemes during the lock-in period. But even in these cases, the AMC must follow proper regulatory procedures and inform investors. Arbitrary refusal to redeem is illegal.',
          },
          {
            question: 'What is SEBI SCORES and how can investors use it?',
            answer: 'SCORES (SEBI Complaints Redress System) is an online portal where investors can lodge complaints against mutual funds, AMCs, distributors, or other market intermediaries. The complaint is forwarded to the concerned entity, which must respond within 30 days. If unresolved, SEBI takes further action. Distributors should be familiar with this portal and guide clients to use it for legitimate grievances that cannot be resolved through other channels.',
          },
          {
            question: 'What are the tax obligations of a mutual fund investor?',
            answer: 'Investors must pay capital gains tax on profits from mutual fund redemptions — short-term or long-term depending on the holding period. For equity funds: STCG (under 1 year) at 20%, LTCG (over 1 year) at 12.5% above ₹1.25 lakh. For debt funds: all gains taxed at slab rate regardless of holding period (post-2023 rules). Investors must also comply with TDS provisions, file FATCA/CRS self-declarations (for foreign tax residency), and include mutual fund gains in their income tax returns.',
          },
          {
            question: 'Can an investor hold the distributor responsible for losses?',
            answer: 'An investor cannot hold a distributor responsible for market losses that are inherent to the scheme\'s risk profile and clearly disclosed in the SID. However, if the distributor misled the investor — for example, guaranteeing returns, hiding risk information, recommending unsuitable products, or churning the portfolio for commissions — the investor can file a complaint with AMFI, SEBI, or take legal action. This is why proper documentation and suitability assessment are critical for every distributor. Under the 2026 Regulations, with enhanced disclosure requirements and the new voluntary debit freeze facility, investor protection mechanisms are further strengthened.',
          },
          {
            question: 'What is the significance of the "record date" for dividends?',
            answer: 'The record date is the cut-off date set by the AMC to determine which unitholders are eligible for the declared dividend/IDCW. Only investors who hold units in the scheme on or before the record date receive the dividend. If an investor redeems before the record date, no dividend is received. If an investor purchases after the record date, no dividend is received for that distribution. This is a frequently tested concept — ownership on the record date determines dividend eligibility.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following is an investor\'s RIGHT under SEBI Mutual Fund Regulations?',
            options: [
              'Right to guaranteed returns from the AMC',
              'Right to appoint the fund manager of their choice',
              'Right to vote on changes in fundamental attributes of the scheme',
              'Right to choose which securities the fund manager buys',
            ],
            correctAnswer: 2,
            explanation: 'Investors have the right to vote on changes in fundamental attributes. They do NOT have the right to guaranteed returns (no mutual fund can guarantee returns), appoint fund managers (that is the AMC\'s prerogative), or direct security selection (that is the fund manager\'s job). Voting rights on fundamental changes is one of the most important investor protections in the regulations.',
          },
          {
            question: 'Within how many business days must redemption proceeds of an equity mutual fund be credited to the investor?',
            options: [
              'T+1 business days',
              'T+2 business days',
              'T+3 business days',
              'T+5 business days',
            ],
            correctAnswer: 2,
            explanation: 'Redemption proceeds for equity mutual funds must be credited within T+3 business days (where T is the date of redemption request acceptance). For debt funds it is T+2 and for liquid/overnight funds it is T+1. These timelines are SEBI-mandated and frequently tested. AMCs that delay beyond these timelines must pay penal interest at 15% per annum to the investor.',
          },
          {
            question: 'An investor\'s obligation under mutual fund regulations includes:',
            options: [
              'Monitoring the fund manager\'s daily trading activity',
              'Completing KYC requirements and providing accurate information',
              'Attending all AMC board meetings',
              'Approving every investment decision made by the fund manager',
            ],
            correctAnswer: 1,
            explanation: 'Investors are obligated to complete KYC (Know Your Customer) requirements and provide accurate personal, financial, and tax-related information. They are NOT required to monitor daily trading, attend board meetings, or approve investment decisions — those responsibilities lie with the trustees, AMC management, and fund manager respectively.',
          },
          {
            question: 'If an AMC delays redemption proceeds beyond the prescribed timeline, the investor is entitled to:',
            options: [
              'Full refund of all investments with guaranteed 12% returns',
              'Penal interest at 15% per annum for the period of delay',
              'Free switching to any other scheme without load',
              'Automatic cancellation of the AMC\'s SEBI registration',
            ],
            correctAnswer: 1,
            explanation: 'If an AMC delays crediting redemption proceeds beyond the prescribed timeline, it must pay the investor penal interest at 15% per annum for the period of delay. This provision ensures AMCs process redemptions on time. Note: the investor does not get guaranteed returns or free switching — the remedy is specifically penal interest for the delay period.',
          },
        ],
        summaryNotes: [
          'Key investor rights: information, redemption at NAV, dividend on record date, vote on fundamental changes, 30-day no-load exit, grievance redressal via SCORES',
          'Redemption timelines to memorize: T+3 (equity), T+2 (debt), T+1 (liquid/overnight) — delay attracts 15% per annum penal interest',
          'One unit = one vote on fundamental attribute changes — majority decides whether the change proceeds',
          'Investor obligations: complete KYC, provide accurate information, comply with tax laws, file FATCA/CRS declarations',
          'Distributors cannot be held liable for market losses but CAN be held liable for mis-selling, guaranteeing returns, or hiding risk information',
          'New 2026 protection: voluntary debit freeze facility (effective April 30, 2026) allows investors to freeze folios against unauthorized transactions',
        ],
        relatedTopics: ['sid-deep-dive', 'sebi-regulations-overview', 'distributor-dos-donts'],
      },
    },

    // ─── Section 6: Advertisement & Sales Literature Guidelines ────────
    {
      id: 'advertisement-guidelines',
      title: 'Advertisement & Sales Literature Guidelines',
      slug: 'advertisement-guidelines',
      content: {
        definition: 'The SEBI Advertisements Code for Mutual Funds lays down comprehensive rules governing how mutual fund schemes can be promoted through any medium — print, television, radio, digital platforms, social media, or in-person sales presentations. The core principle is that no advertisement shall be misleading, contain false or exaggerated statements, or create unrealistic expectations about returns. Every advertisement must prominently display standard risk disclaimers, carry the SEBI registration number, and present past performance data only in the prescribed format with mandatory disclaimer that past performance does not guarantee future returns. The code applies equally to the AMC, its authorized distributors, and any third party acting on behalf of the mutual fund.',
        explanation: 'This section is critical because violations of advertisement guidelines are the fastest way for a distributor to lose their ARN and face SEBI penalties. Common violations include distributors creating WhatsApp messages or social media posts that promise specific returns — these constitute regulatory violations regardless of the medium. The key rules are as follows. First, no advertisement can guarantee or assure returns — not even by implication. Stating "XYZ Fund has given 18% returns in the last 5 years" is permissible (it is factual past performance). Stating "Invest in XYZ Fund and earn 18% returns" is illegal (it implies future performance). Second, every advertisement must carry the standard disclaimer: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully." For audio-visual media, this must be spoken clearly and not rushed. Third, past performance data must be shown for standard periods — 1 year, 3 years, 5 years, and since inception — as CAGR (Compounded Annual Growth Rate), and must include benchmark comparison. Fourth, star ratings and rankings from external agencies can be mentioned but must include the name of the rating agency, the period, and a disclaimer that ratings are not a guarantee. Fifth, and increasingly important in the digital age, social media posts by distributors are treated as advertisements and must comply with all the same rules. A WhatsApp forward claiming "best fund guaranteed 20% return" is as much a regulatory violation as a newspaper ad saying the same thing.',
        realLifeExample: 'Consider Karthik, a distributor in Bengaluru who runs a popular Instagram page about mutual funds with 15,000 followers. He posts a reel showing: "Top 5 Mutual Funds That Gave 25%+ Returns in 2025!" — with dramatic music and flashing green numbers. A compliance review identifies five regulatory violations: (1) No disclaimer about past performance not guaranteeing future returns. (2) No mention of the period for which returns are calculated. (3) Returns shown as absolute, not CAGR for periods over 1 year. (4) No benchmark comparison alongside the returns. (5) No standard risk disclaimer at the end. The corrected version reads: "These 5 large-cap funds delivered above-benchmark CAGR returns over 3 years ending December 2025 (Source: AMFI website). Past performance may or may not be sustained. Returns are CAGR. Benchmark: Nifty 100 TRI. Mutual Fund investments are subject to market risks, read all scheme related documents carefully." The corrected version is compliant and still informative. This illustrates the balance every distributor must maintain between engaging content and regulatory compliance.',
        keyPoints: [
          'No advertisement shall be misleading, contain false statements, or guarantee/assure returns — not even by implication',
          'Standard disclaimer mandatory on ALL advertisements: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully"',
          'Past performance must be shown as CAGR for periods over 1 year, with benchmark comparison and the disclaimer that past performance does not guarantee future returns',
          'Performance data must be shown for standard periods: 1 year, 3 years, 5 years, and since inception',
          'Star ratings and rankings can be used but must include the rating agency name, period, and disclaimer that ratings are not a guarantee',
          'Social media posts (WhatsApp, Instagram, Facebook, YouTube, Twitter) by distributors are treated as advertisements and must comply with all SEBI rules',
          'Audio-visual advertisements must have the disclaimer spoken clearly — not mumbled or flashed for a split second',
          'The SEBI registration number of the mutual fund must appear on every advertisement',
        ],
        faq: [
          {
            question: 'Can a distributor share past performance of a fund on WhatsApp with clients?',
            answer: 'Yes, but advertisement guidelines must be followed. Returns should be shown as CAGR for periods over 1 year, with benchmark comparison, source and time period mentioned, and the standard risk disclaimer included. A casual WhatsApp message saying "this fund gave 25% last year, invest now!" without proper disclaimers is technically a regulatory violation. Proper formatting ensures compliance.',
          },
          {
            question: 'Can a distributor use the word "guaranteed" or "assured" in any communication about mutual funds?',
            answer: 'Never. The words "guaranteed," "assured," "certain," or any similar term implying certainty of returns are strictly prohibited in mutual fund advertisements and communications. Even phrases like "sure to give good returns" or "will not lose money" are violations. The only exception is fixed maturity plans (FMPs) and capital protection-oriented schemes that can describe their structure, but even they cannot guarantee returns.',
          },
          {
            question: 'What is the correct format for showing past performance in an advertisement?',
            answer: 'For periods over 1 year, returns must be shown as CAGR (Compounded Annual Growth Rate). For periods of 1 year or less, returns are shown as absolute returns. Performance must be shown for standard periods: 1 year, 3 years, 5 years, and since inception. Benchmark returns for the same periods must be shown alongside. The date as of which performance is calculated must be mentioned. And the disclaimer "Past performance may or may not be sustained in future" must be included.',
          },
          {
            question: 'Can a distributor endorse or recommend specific schemes on social media?',
            answer: 'A distributor can share factual information about schemes on social media but must comply with all advertisement guidelines — including disclaimers, proper performance format, and no guarantees. Personal recommendations must be based on suitability assessment of the individual investor, not broadcast to a general audience. Broadcasting "Buy XYZ Fund now!" to all followers is problematic because it does not consider individual risk profiles and goals.',
          },
          {
            question: 'What are the rules for using star ratings in advertisements?',
            answer: 'Star ratings and rankings from recognized agencies (like CRISIL, Value Research, Morningstar) can be used in advertisements but must include: (1) the name of the rating/ranking agency, (2) the period for which the rating applies, (3) the methodology reference, and (4) a disclaimer that ratings are not a guarantee of future performance. Self-assigned ratings or cherry-picked ratings from a favourable period while ignoring current ratings are not permissible.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following statements in a mutual fund advertisement would be a regulatory violation?',
            options: [
              '"This scheme has delivered 14.5% CAGR over the last 5 years as of March 2024"',
              '"Invest in this scheme for guaranteed high returns and zero risk"',
              '"Past performance may or may not be sustained in future. Read scheme documents carefully"',
              '"The scheme benchmark is Nifty 50 TRI and it has outperformed the benchmark over 3 and 5 year periods"',
            ],
            correctAnswer: 1,
            explanation: 'Saying "guaranteed high returns and zero risk" is a clear violation of SEBI Advertisement Code. No mutual fund advertisement can guarantee returns or claim zero risk. Options A, C, and D are compliant — they show factual past performance with proper context and disclaimers.',
          },
          {
            question: 'For periods exceeding one year, mutual fund returns in advertisements must be shown as:',
            options: [
              'Absolute returns',
              'Simple annualized returns',
              'Compounded Annual Growth Rate (CAGR)',
              'Point-to-point returns only',
            ],
            correctAnswer: 2,
            explanation: 'SEBI mandates that for periods exceeding one year, mutual fund returns must be shown as CAGR (Compounded Annual Growth Rate). For periods of one year or less, absolute returns are used. This prevents misleading representation — for example, a 50% absolute return over 5 years looks impressive but translates to only about 8.4% CAGR.',
          },
          {
            question: 'Social media posts about mutual fund schemes by a distributor are:',
            options: [
              'Exempt from advertisement guidelines since they are personal posts',
              'Subject to all SEBI advertisement guidelines just like print or TV ads',
              'Only regulated if they are paid promotions',
              'Not regulated by SEBI as social media falls outside securities laws',
            ],
            correctAnswer: 1,
            explanation: 'Social media posts by distributors about mutual fund schemes are treated as advertisements and must comply with ALL SEBI advertisement guidelines — including disclaimers, proper return format, no guarantees, and benchmark comparison. Personal social media accounts do not provide exemption. This is an increasingly important area that the NISM exam now tests.',
          },
          {
            question: 'Which of the following is mandatory in every mutual fund advertisement?',
            options: [
              'NAV of the scheme on the date of advertisement',
              'Name and photograph of the fund manager',
              'Standard risk disclaimer and SEBI registration number',
              'Comparison with Fixed Deposit rates',
            ],
            correctAnswer: 2,
            explanation: 'Every mutual fund advertisement must carry the standard risk disclaimer ("Mutual Fund investments are subject to market risks...") and the SEBI registration number of the mutual fund. NAV disclosure, fund manager photos, and FD comparisons are not mandatory in advertisements (though some of these may appear voluntarily).',
          },
        ],
        summaryNotes: [
          'Golden rule: no guarantees, no assured returns, no misleading claims — ever, in any medium, including WhatsApp and Instagram',
          'Past performance format: CAGR for periods over 1 year, absolute for 1 year or less, always with benchmark comparison',
          'Every advertisement needs: standard risk disclaimer + SEBI registration number + proper return format with source and period',
          'Social media = advertisements in SEBI\'s eyes — an Instagram reel must comply with the same rules as a newspaper ad',
          'Star ratings are allowed but must include: agency name, period, methodology reference, and "not a guarantee" disclaimer',
        ],
        relatedTopics: ['distributor-dos-donts', 'kim-explained', 'sebi-regulations-overview'],
      },
    },

    // ─── Section 7: Dos and Don'ts for Mutual Fund Distributors ────────
    {
      id: 'distributor-dos-donts',
      title: 'Dos and Don\'ts for Mutual Fund Distributors',
      slug: 'distributor-dos-donts',
      content: {
        definition: 'The Dos and Don\'ts for Mutual Fund Distributors is a comprehensive code of conduct established by AMFI (Association of Mutual Funds in India) under SEBI\'s direction, governing the professional behaviour and ethical standards of every AMFI-registered distributor (ARN holder). This code covers commission disclosure, prohibition of return guarantees, ban on commission rebating, mandatory KYC compliance, suitability assessment requirements, documentation standards, and anti-mis-selling provisions. Violation of these rules can result in suspension or cancellation of the distributor\'s ARN registration, monetary penalties, and legal action. Every NISM VA candidate must know these rules thoroughly because they form the backbone of professional conduct in the mutual fund distribution industry.',
        explanation: 'These Dos and Don\'ts are not theoretical — they are the rules that protect a distributor\'s livelihood and clients\' wealth. Numerous distributors have lost their ARN registrations for violating these straightforward rules. The critical DOs are as follows. DO: always complete KYC before processing any transaction — no exceptions, including for family members. DO: disclose commission structure to clients when asked — transparency builds trust. DO: maintain written records of all advice provided — if a client later claims an unsuitable product was recommended, written records serve as the primary defence. DO: recommend products based on the client\'s risk profile, goals, and time horizon — not based on which scheme pays the highest commission. The critical DON\'Ts are equally important. DON\'T ever guarantee or promise returns — even verbally, even casually. If a complaint alleges a return guarantee and SEBI investigates, the distributor risks losing their ARN. DON\'T rebate commission back to investors — this means no cashbacks, gifts, discounts, or any incentive funded from commissions. SEBI banned this to ensure distributors recommend products based on suitability, not price competition. DON\'T churn portfolios — repeatedly switching clients between schemes to earn fresh commissions is a serious violation. DON\'T make false or exaggerated claims about any scheme. And DON\'T execute transactions without proper authorization from the client.',
        realLifeExample: 'Two contrasting case studies illustrate the importance of following the code. Case 1 (Compliant): Deepak, a distributor in Ahmedabad, had a client Shreya, a 28-year-old IT professional wanting to invest ₹50,000/month. Deepak completed her KYC, assessed her risk profile (aggressive — 25-year horizon), and documented the recommendation in writing: "Recommended 60% in flexi-cap equity, 25% in mid-cap, 15% in international equity fund based on long-term wealth creation goal and high risk tolerance." Shreya signed the recommendation letter. When markets fell 15%, Shreya panicked and complained that she had not been warned about risks. Deepak produced the signed recommendation letter showing the "Very High Risk" designation and explanation of potential drawdowns. The complaint was dismissed. Case 2 (Non-Compliant): Amit, a distributor in Delhi, told his client Prakash, a 60-year-old retiree, to invest his ₹40 lakh retirement corpus in a small-cap fund, verbally stating it would "give 20% returns easily." No KYC was completed, no risk assessment done, and no written documentation maintained. He also rebated ₹20,000 from his commission as a "joining bonus." When the small-cap fund fell 30%, Prakash lost ₹12 lakhs and filed a complaint with AMFI. Investigation revealed: no documentation, verbal return guarantee, commission rebating, and unsuitable product recommendation. Result: Amit\'s ARN was suspended for 2 years, and he was required to pay compensation to Prakash.',
        keyPoints: [
          'DO: Complete KYC for every investor before processing any transaction — this is non-negotiable and applies to all categories of investors',
          'DO: Disclose all commissions and trail fees to clients when asked — SEBI mandates full transparency in distributor remuneration',
          'DO: Maintain written records of all investment advice and recommendations — signed by the client where possible',
          'DO: Recommend products based on suitability assessment — consider the client\'s risk profile, financial goals, time horizon, and existing portfolio',
          'DON\'T: Guarantee or promise returns in any form — verbal, written, or implied — this is the most commonly violated rule',
          'DON\'T: Rebate commission back to investors directly or indirectly — no cashbacks, gifts, discounts, or incentives from commission',
          'DON\'T: Churn portfolios — switching clients between schemes frequently to earn fresh upfront commissions is a serious violation',
          'DON\'T: Make false, misleading, or exaggerated statements about any scheme, AMC, or investment product',
        ],
        faq: [
          {
            question: 'Can a distributor give a gift to a client as a festival gesture?',
            answer: 'This is a grey area. Small festive gifts (sweets, calendars) funded from the distributor\'s own pocket — not from commissions — are generally acceptable as a business courtesy. However, expensive gifts, cashbacks, gold coins, or any incentive that is effectively a return of commission to the investor is prohibited. The test is: would this gift influence the client\'s investment decision? If yes, it is likely a violation. The prudent approach is to keep gifts modest and clearly separate from commissions.',
          },
          {
            question: 'What happens if a distributor is caught rebating commissions?',
            answer: 'Commission rebating is a serious violation. AMFI can suspend or cancel the distributor\'s ARN registration. SEBI can impose monetary penalties and bar individuals from the securities market. The AMC can terminate the distributor\'s empanelment. In practice, SEBI and AMFI have been increasingly vigilant about this — especially digital cashback schemes and discount brokers masquerading as distributors. If a client reports that a distributor offered to return part of the commission, an investigation will follow.',
          },
          {
            question: 'How should a distributor document investment recommendations?',
            answer: 'Best practice: create a simple one-page document for each client interaction that includes: (1) Client name and folio number, (2) Date of conversation, (3) Client\'s stated goals and risk tolerance, (4) The specific recommendation with rationale, (5) Risk factors highlighted, (6) Client\'s signature or email acknowledgement. These documents should be retained for at least 5 years. Many distributors use CRM software that logs interactions automatically. In case of a complaint, this documentation serves as the strongest defence.',
          },
          {
            question: 'Can a distributor recommend a scheme that pays higher commission if it also suits the client?',
            answer: 'If the scheme genuinely suits the client\'s risk profile, goals, and time horizon, the commission differential is not inherently wrong. However, if a distributor consistently recommends higher-commission products over equally suitable lower-cost alternatives, it raises suitability concerns. The AMFI code expects distributors to prioritize the client\'s interest. A good practice is to present 2-3 suitable options and let the client choose. When asked about commission differences, honest disclosure is expected.',
          },
          {
            question: 'What is "churning" and how is it identified?',
            answer: 'Churning is the practice of frequently switching a client\'s investments between schemes primarily to earn fresh upfront commissions, without any genuine benefit to the client. AMFI and AMCs monitor for churning by tracking switch frequency, holding periods, and commission patterns. Red flags include: switches within 3-6 months, switches between similar scheme categories, and a pattern of always moving to schemes with higher upfront commissions. If identified, it can lead to ARN suspension and clawback of commissions.',
          },
        ],
        mcqs: [
          {
            question: 'A mutual fund distributor is prohibited from doing which of the following?',
            options: [
              'Disclosing commission earned to the investor upon request',
              'Recommending a scheme based on the client\'s risk profile and financial goals',
              'Rebating part of the commission back to the investor as a cashback or discount',
              'Maintaining written records of investment advice given to clients',
            ],
            correctAnswer: 2,
            explanation: 'Rebating commission back to investors — directly or indirectly through cashbacks, discounts, gifts, or any other incentive — is strictly prohibited under AMFI/SEBI guidelines. Options A, B, and D are all things distributors SHOULD do (disclosure, suitability-based recommendation, documentation). The commission rebating rule is one of the most frequently tested items in the NISM VA exam.',
          },
          {
            question: 'Before processing any mutual fund transaction, a distributor must ensure:',
            options: [
              'The client has a demat account',
              'The client\'s KYC (Know Your Customer) is completed',
              'The client has invested at least ₹5,000 previously',
              'The client has a relationship of at least 6 months with the distributor',
            ],
            correctAnswer: 1,
            explanation: 'KYC completion is mandatory before processing ANY mutual fund transaction. A demat account is NOT required for mutual fund investments (it is needed only for ETF trading). There is no minimum previous investment or relationship duration requirement. KYC — including PAN verification, address proof, and in-person verification or video KYC — must be completed first.',
          },
          {
            question: 'Which of the following actions by a distributor would constitute "churning"?',
            options: [
              'Recommending a SIP in a fund the client holds for 10 years',
              'Frequently switching a client between similar schemes to earn upfront commissions',
              'Suggesting a portfolio rebalance once a year based on market conditions',
              'Helping a client switch from a regular plan to a direct plan',
            ],
            correctAnswer: 1,
            explanation: 'Churning involves frequently switching a client between schemes — especially similar ones — primarily to earn fresh upfront commissions without genuine benefit to the client. A long-term SIP, annual rebalancing, and moving to a direct plan all have legitimate client benefits. Churning is identified by short holding periods, frequent switches, and a pattern of moving to higher-commission products.',
          },
          {
            question: 'A distributor tells a prospective client: "I personally guarantee that this fund will give you at least 12% annual returns." This statement is:',
            options: [
              'Acceptable if the fund has historically given 12% returns',
              'Acceptable if the distributor puts it in writing',
              'A violation of AMFI/SEBI code — distributors cannot guarantee returns',
              'Acceptable if the client signs a waiver acknowledging the guarantee',
            ],
            correctAnswer: 2,
            explanation: 'Guaranteeing or promising returns — in any form, verbal or written, regardless of past performance — is a strict violation of AMFI/SEBI code of conduct. No waiver or acknowledgement can make a return guarantee compliant. Even casual statements like "you will definitely get 12%" are violations. The exam tests this concept in various formats — the answer is always: return guarantees are prohibited.',
          },
        ],
        summaryNotes: [
          'Top 3 DON\'Ts: no return guarantees, no commission rebating, no portfolio churning — violation of any of these can result in ARN suspension',
          'Top 3 DOs: complete KYC before every transaction, document all recommendations in writing, disclose commissions when asked',
          'Suitability is king: recommend based on client\'s risk profile, goals, and time horizon — not commission structures',
          'Written documentation is the distributor\'s best defence: in any complaint, the distributor with records prevails; the distributor without records is vulnerable',
          'Social media, WhatsApp, verbal conversations — ALL are subject to SEBI/AMFI code; there is no "off the record" in distribution',
        ],
        relatedTopics: ['advertisement-guidelines', 'investor-rights', 'sebi-regulations-overview'],
      },
    },

    // ─── Section 8: SEBI Circulars — Recent Important Changes ──────────
    {
      id: 'sebi-circulars-recent',
      title: 'SEBI Circulars — Recent Important Changes',
      slug: 'sebi-circulars-recent',
      content: {
        definition: 'SEBI circulars are regulatory directives issued by the Securities and Exchange Board of India that amend, clarify, or supplement the mutual fund regulatory framework. These circulars carry the same legal force as the parent regulations and must be complied with by all mutual funds, AMCs, trustees, and distributors. The most significant recent development is the SEBI (Mutual Funds) Regulations, 2026, which replaces the 1996 Regulations effective April 1, 2026 — a complete overhaul streamlined from 162 pages to 88 pages. In addition, SEBI has issued several landmark circulars in recent years that have fundamentally transformed the industry — including TER rationalization (now replaced by the new BER + Brokerage + Levies framework), risk-o-meter implementation, side-pocketing framework, mandatory nomination, pool account prohibition, digital transaction facilitation, portfolio overlap caps, and the voluntary debit freeze facility. Understanding these regulatory changes is critical for the NISM VA exam because questions frequently test knowledge of current developments.',
        explanation: 'The foundational regulations serve as the constitution of the mutual fund industry, while SEBI circulars are the living, evolving amendments that keep the framework current. In the last 5-7 years, the industry has undergone more regulatory changes than in the previous two decades combined — culminating in the complete replacement of the 1996 Regulations with the SEBI (Mutual Funds) Regulations, 2026 (effective April 1, 2026). The most important regulatory developments are as follows. New TER Framework (2026 Regulations): The earlier all-inclusive TER structure has been replaced by a three-component framework — Base Expense Ratio (BER) + Brokerage + Regulatory/Statutory levies. Brokerage caps have been significantly reduced: Cash market from 12bps to 6bps, Derivatives from 5bps to 2bps. The additional 5bps exit load allowance has been removed. Notably, performance-linked expense ratios are now permitted for the first time. Category Expansion: Scheme categories expand from 36 to 40, adding Life-Cycle Funds and Sectoral Debt Funds, while Solution-Oriented Schemes are being discontinued. Portfolio overlap caps of 50% apply for thematic/sectoral funds, with mandatory monthly disclosure of category-wise overlap. Voluntary Debit Freeze: SEBI has introduced a voluntary debit freeze facility for folios (effective April 30, 2026), allowing investors to protect their holdings against unauthorized transactions. Risk-o-meter (2021): Every scheme must display a risk-o-meter showing risk level from "Low" to "Very High" based on actual portfolio holdings, evaluated monthly. Side-pocketing: When a debt instrument faces a credit event (default or downgrade below investment grade), the AMC can segregate it into a separate portfolio, protecting remaining investors. Nomination became mandatory for all new individual folios from October 2023. Pool accounts were prohibited for distributors — client money must go directly from the investor\'s bank account to the AMC. Digital signatures, e-KYC, and online transactions have been officially recognized. The industry now manages over ₹82 lakh crore in AUM across 27+ crore folios.',
        realLifeExample: 'Consider how these regulatory changes affect daily distribution practice. Anita, an MFD in Kolkata, has a client Rajiv who invested ₹20,00,000 in a credit risk fund. One of the bonds in the fund — issued by a real estate company — defaulted, and the AMC invoked side-pocketing. Rajiv\'s holdings were split into two: the main portfolio (all healthy securities, worth about ₹17,50,000 at the time) and the segregated portfolio (the defaulted bond, book value ₹2,50,000 but market value near zero). Rajiv could freely redeem from the main portfolio, but the segregated units were frozen. The concept functions like a quarantine — the impaired bond is isolated so it does not affect the rest of the portfolio. Two years later, through NCLT proceedings, the company repaid 40 cents on the dollar. Rajiv received approximately ₹1,00,000 from the segregated portfolio — not a full recovery, but significantly better than zero. Meanwhile, his main portfolio had grown to ₹21,00,000. Without side-pocketing, the entire fund NAV would have crashed by 12-15%, triggering panic redemptions and hurting all investors. Under the 2026 Regulations, with the new BER framework and enhanced disclosure requirements, distributors must also understand how the separated expense components (BER + Brokerage + Levies) affect the overall cost to investors, and how the voluntary debit freeze facility can provide additional protection for client folios.',
        keyPoints: [
          'SEBI (Mutual Funds) Regulations, 2026: replaces the 1996 framework from April 1, 2026 — streamlined from 162 to 88 pages, provisos reduced from 59 to <15',
          'New TER Framework (2026): Base Expense Ratio (BER) + Brokerage (Cash 6bps, Derivatives 2bps) + Regulatory/Statutory levies; additional 5bps exit load allowance removed; performance-linked expense ratios now allowed',
          'Category Expansion: from 36 to 40 categories (new: Life-Cycle Funds, Sectoral Debt Funds); Solution-Oriented Schemes being discontinued; portfolio overlap caps of 50% for thematic/sectoral funds',
          'Voluntary Debit Freeze (effective April 30, 2026): investors can freeze folios against unauthorized debit transactions',
          'Risk-o-meter (2021): schemes must display risk level (Low, Low to Moderate, Moderate, Moderately High, High, Very High) based on actual portfolio holdings, evaluated monthly',
          'Side-pocketing: allows AMCs to segregate defaulted/downgraded securities into a separate portfolio, protecting remaining investors from the credit event impact',
          'Mandatory Nomination (2023): all new individual mutual fund folios must have a nominee or a signed opt-out declaration',
          'Pool Account Prohibition: distributors cannot collect investor money in their own bank accounts — funds must flow directly from investor to AMC',
          'Monthly disclosure of category-wise portfolio overlap is now mandatory under the 2026 Regulations',
          'SEBI circulars and the new 2026 Regulations are legally binding — non-compliance carries significant penalties',
        ],
        faq: [
          {
            question: 'How does the new TER framework under the 2026 Regulations affect distributor commissions?',
            answer: 'Under the 2026 Regulations, the new TER framework separates Base Expense Ratio (BER), Brokerage, and Regulatory/Statutory levies. Brokerage caps have been reduced (Cash market from 12bps to 6bps, Derivatives from 5bps to 2bps), and the additional 5bps exit load allowance has been removed. This means the commission pool is more tightly regulated. However, the industry\'s growth to ₹82+ lakh crore AUM has partially offset the per-unit reduction. Distributors are best served by building a large book of business through SIPs and long-term client relationships rather than depending on high per-transaction commissions. Trail commissions on a growing AUM base remain the sustainable model.',
          },
          {
            question: 'What exactly does the risk-o-meter show and how often is it updated?',
            answer: 'The risk-o-meter displays the scheme\'s risk level on a scale of six categories: Low, Low to Moderate, Moderate, Moderately High, High, and Very High. Unlike the earlier static classification based on scheme category, the new risk-o-meter is based on the actual portfolio holdings and is evaluated monthly. If the risk level changes (e.g., from "High" to "Very High"), the AMC must inform all unitholders. This monthly evaluation was a 2021 SEBI circular mandate. It gives investors a realistic, current view of how risky their investment actually is.',
          },
          {
            question: 'When can an AMC invoke side-pocketing?',
            answer: 'Side-pocketing can be invoked when a debt or money market instrument in the scheme\'s portfolio faces a "credit event" — defined as a default on principal or interest payment, or a downgrade to below investment grade by a recognized rating agency. The AMC must get trustee approval and inform SEBI and all unitholders. Side-pocketing cannot be used for market losses or NAV declines — it is strictly for credit events. This was introduced to prevent a repeat of the 2018-19 credit crisis situations.',
          },
          {
            question: 'Why were pool accounts banned for mutual fund distributors?',
            answer: 'Pool accounts allowed distributors to collect money from multiple investors in their own bank account and then invest on their behalf. This created serious risks: (1) misuse of client funds, (2) delayed investments, (3) lack of audit trail, and (4) potential for fraud. SEBI banned pool accounts to ensure that money flows directly from the investor\'s bank account to the AMC — creating a clean, auditable trail. Now, all payments must be made through recognized payment modes (NACH, UPI, net banking, cheque) directly from the investor\'s registered bank account.',
          },
          {
            question: 'Is nomination really mandatory now? What if a client refuses?',
            answer: 'Since October 2023, every new individual mutual fund folio must have either a nominee or a signed declaration explicitly opting out of nomination. The investor must make an active choice — they cannot simply leave it blank. If a client refuses to nominate AND refuses to sign the opt-out declaration, the folio cannot be opened. Distributors should explain to clients that nomination simplifies the claim process for legal heirs and strongly encourage nomination rather than opting out.',
          },
        ],
        mcqs: [
          {
            question: 'Under the SEBI (Mutual Funds) Regulations, 2026, the new expense framework for mutual fund schemes consists of:',
            options: [
              'A single all-inclusive Total Expense Ratio (TER)',
              'Base Expense Ratio (BER) + Brokerage + Regulatory/Statutory levies',
              'Management fee + Performance fee only',
              'Flat fee regardless of AUM size',
            ],
            correctAnswer: 1,
            explanation: 'Under the 2026 Regulations, the earlier all-inclusive TER structure has been replaced by a three-component framework: Base Expense Ratio (BER) + Brokerage + Regulatory/Statutory levies. This separates AMC management fees from brokerage costs and statutory charges, providing greater transparency. Brokerage caps have been reduced (Cash market from 12bps to 6bps, Derivatives from 5bps to 2bps). Performance-linked expense ratios are now also permitted.',
          },
          {
            question: 'The risk-o-meter for mutual fund schemes is evaluated based on:',
            options: [
              'The scheme category alone (e.g., large-cap, mid-cap)',
              'The actual portfolio holdings, evaluated on a monthly basis',
              'The past 3-year return of the scheme',
              'The fund manager\'s subjective assessment of risk',
            ],
            correctAnswer: 1,
            explanation: 'The risk-o-meter is based on the actual portfolio holdings and is evaluated monthly — not based on scheme category alone or subjective assessment. If the underlying holdings change in a way that alters the risk profile (e.g., a balanced fund increases its equity allocation), the risk-o-meter must be updated and investors informed. This 2021 circular made risk disclosure dynamic and real.',
          },
          {
            question: 'Side-pocketing in a mutual fund scheme can be invoked when:',
            options: [
              'The NAV falls by more than 10% in a single day',
              'A debt instrument in the portfolio defaults or is downgraded below investment grade',
              'The stock market experiences a circuit breaker',
              'The fund manager wants to protect high-performing securities',
            ],
            correctAnswer: 1,
            explanation: 'Side-pocketing can only be invoked when there is a "credit event" — a default on payment (principal or interest) by a debt issuer or a downgrade of a debt instrument to below investment grade by a recognized rating agency. It cannot be used for general market declines, NAV drops, or to protect performing securities. The purpose is specifically to isolate credit-impaired instruments.',
          },
          {
            question: 'The prohibition of pool accounts for mutual fund distributors means:',
            options: [
              'Distributors cannot open bank accounts for their business',
              'Client investment money must flow directly from the investor\'s bank account to the AMC, not through the distributor\'s account',
              'Distributors cannot receive commissions in their bank accounts',
              'AMCs cannot maintain separate accounts for different schemes',
            ],
            correctAnswer: 1,
            explanation: 'Pool account prohibition means that investment money must flow directly from the investor\'s registered bank account to the AMC — the distributor cannot collect money in their own bank account and then forward it to the AMC. This prevents potential misuse, delays, and fraud. Distributors CAN still receive commissions in their bank accounts — the prohibition applies only to client investment money.',
          },
        ],
        summaryNotes: [
          '2026 Regulations (effective April 1, 2026): replaces 1996 framework; new TER = BER + Brokerage (Cash 6bps, Derivatives 2bps) + Levies; performance-linked fees now allowed',
          'Categories: 36 → 40 (adds Life-Cycle Funds, Sectoral Debt Funds; discontinues Solution-Oriented Schemes); portfolio overlap caps 50% for thematic/sectoral',
          'Risk-o-meter: 6 levels (Low to Very High), based on actual portfolio holdings, evaluated monthly — dynamic, not static',
          'Side-pocketing: only for credit events (default/downgrade below investment grade), not for market losses — requires trustee approval',
          'Mandatory nomination since October 2023; voluntary debit freeze facility effective April 30, 2026; pool accounts banned; industry AUM ₹82+ lakh crore',
        ],
        relatedTopics: ['sebi-regulations-overview', 'investor-rights', 'nav-calculation'],
      },
    },
  ],
};
