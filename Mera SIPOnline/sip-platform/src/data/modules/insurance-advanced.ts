import { LearningModule } from '@/types/learning';

export const insuranceAdvancedModule: LearningModule = {
  id: 'insurance-advanced',
  title: 'Insurance Advanced — Practitioner & Underwriting',
  slug: 'insurance-advanced',
  icon: 'Award',
  description:
    'Practitioner-grade insurance education calibrated to IRDAI POSP and IC-38 certification depth. This advanced module unpacks the underwriting and claims framework, the mechanics of long-term and unit-linked products, and the use of insurance for estate planning and business continuity. Intended for distributors, paraplanners and serious advisors operating under IRDAI broker / agent / POSP frameworks.',
  level: 'advanced',
  color: 'from-rose-800 to-red-700',
  estimatedTime: '50 min',
  track: 'insurance',
  sections: [
    {
      id: 'underwriting-claims-framework',
      title: 'Underwriting & Claims Framework — Risk Pricing, Section 45 and Repudiation Grounds',
      slug: 'underwriting-claims-framework',
      content: {
        definition:
          'Underwriting is the process by which an insurer evaluates the risk represented by a proposer and decides (a) whether to accept the risk, (b) at what premium loading, and (c) under what exclusions or sub-limits. Claims management is the mirror discipline at the back-end — verifying that the loss event falls within the contract, that material disclosures were accurate, and that the insurer\'s liability is correctly quantified. Together, underwriting and claims form the actuarial-legal core of the insurance contract and are governed by the Insurance Act 1938 (as amended in 2015), IRDAI (Protection of Policyholders\' Interests) Regulations 2017 and supporting circulars.',
        explanation:
          'Life insurance underwriting blends three streams of evidence. Medical underwriting examines the health of the proposer through a graduated medical grid: declarations only at low sum assured, tele-underwriting for mid-band cases, and a full medical board (ECG, treadmill test, full pathology, lipid profile, HbA1c, urine routine, sometimes echo and TMT) typically triggered above ₹1 crore sum assured or at older ages. Lifestyle factors are loaded explicitly — smokers and tobacco users typically pay 1.5x to 2.0x the non-smoker premium, and consumption pattern (occasional vs. heavy) is captured in the proposal form and verified through cotinine tests where available. Body mass index outside the 18-30 band attracts a loading; existing chronic conditions (hypertension, diabetes, dyslipidaemia) are rated by sub-stage and control. Occupational underwriting layers a hazard rating on top — pilots, defence personnel, deep-sea divers, mine workers and chemical handlers attract occupational loadings or specific exclusions. Financial underwriting confirms that the cover requested is consistent with the proposer\'s human life value: insurers ask for the latest two to three years of Income Tax Returns, salary slips, bank statements or audited financials for self-employed proposers, and may require net-worth proof for sums assured beyond ₹2-5 crore. The combined output is a risk classification — preferred (super-healthy non-smokers), standard (the actuarial baseline), or sub-standard (rated lives carrying explicit loadings). On the claims side, the most consequential statute is Section 45 of the Insurance Act. Under the post-2015 amendment, no policy can be questioned on any ground after three years from the date of issuance, revival or rider addition — even for fraud. Within the three-year window, a claim can be repudiated only on the grounds of material non-disclosure, mis-statement of fact or fraud, with the burden of proof on the insurer and a written communication to the policyholder citing reasons. IRDAI\'s 2017 Protection of Policyholders\' Interests Regulations mandate claim settlement timelines: 30 days for life insurance death claims after receipt of all documents, with payment of penal interest at the prevailing bank rate plus 2% if delayed beyond 30 days due to insurer fault; for non-life claims, 30 days from receipt of survey report subject to specified exceptions for fraud investigation. Where a claim is repudiated, the policyholder has recourse to the insurer\'s grievance cell, then the Insurance Ombudsman (governed by the Insurance Ombudsman Rules 2017) for awards up to ₹50 lakh, and ultimately to consumer fora and civil courts. A practitioner must counsel the proposer to disclose every material fact — past hospitalisations, pre-existing conditions, family history of hereditary illness — because the cost of non-disclosure is paid by the surviving family.',
        realLifeExample:
          'A 42-year-old proposer in Bengaluru applies for ₹2 crore term cover. Tele-underwriting flags borderline hypertension; full medicals reveal HbA1c of 6.8 (pre-diabetic) and BMI of 31. The insurer issues a counter-offer at standard rates plus a 25% extra mortality loading, with annual review. The proposer accepts. Six years later, he dies of a cardiac event. Because the policy is past the three-year Section 45 window, the insurer cannot question it on any ground; the claim is settled within 18 days at the full sum assured. Contrast: a 38-year-old in Pune buys ₹1.5 crore cover online without disclosing a 2018 hospitalisation for chest pain. He dies in year two from a myocardial infarction. The insurer obtains hospital records during claim investigation, establishes material non-disclosure, and repudiates within the three-year window. The family appeals to the Ombudsman and recovers a partial settlement, but the lesson stands: disclosure protects the family.',
        keyPoints: [
          'Underwriting blends medical, occupational, lifestyle and financial assessment to classify risk as preferred, standard or sub-standard.',
          'Smoker/tobacco loadings of 1.5-2.0x are standard; BMI, occupational hazard and chronic conditions add explicit loadings.',
          'Full medical boards are typically triggered above ₹1 crore sum assured or at older ages; tele-underwriting handles mid-band cases.',
          'Financial underwriting requires ITRs, income proof and net-worth evidence to align cover with human life value.',
          'Section 45 of the Insurance Act 1938 (post-2015 amendment) bars all challenge to a policy after three years — even for fraud.',
          'IRDAI 2017 regulations mandate 30-day life claim settlement post documents, with penal interest for insurer-caused delay.',
          'Repudiation grounds are limited to material non-disclosure, mis-statement and fraud — with written reasons and Ombudsman recourse.',
        ],
        faq: [
          {
            question: 'What exactly does "material non-disclosure" mean for claim repudiation?',
            answer:
              'Material non-disclosure is the failure to disclose any fact that, if known to the insurer at the time of underwriting, would have caused it to either decline the risk, charge a higher premium, or apply specific exclusions. Pre-existing diabetes, prior hospitalisations, chronic medications, smoking status, hazardous hobbies (paragliding, motorsport) and certain occupations are classic material facts. The insurer must prove materiality and the non-disclosure in writing — the proposer is not penalised for innocent omission of trivia.',
          },
          {
            question: 'How does the Ombudsman process work for a repudiated life claim?',
            answer:
              'After the insurer\'s written repudiation, the claimant first approaches the insurer\'s grievance redressal officer. If unresolved within 30 days or if the response is unsatisfactory, the claimant files a complaint with the Insurance Ombudsman of the relevant jurisdiction within one year of the repudiation, in the prescribed Form P-II. The Ombudsman conducts a quasi-judicial proceeding and can issue awards up to ₹50 lakh that are binding on the insurer (the claimant retains the right to approach civil courts if dissatisfied). The process is free of cost for the claimant and is generally completed within three to six months.',
          },
          {
            question: 'Why do insurers ask for ITRs and income proof for term insurance?',
            answer:
              'This is financial underwriting. The principle of indemnity (and the doctrine of insurable interest) requires that the sum assured be calibrated to the proposer\'s economic value. A 30-year-old earning ₹6 lakh per annum applying for ₹5 crore cover would fail this test — the insurer suspects either over-insurance (encouraging moral hazard) or fraud. Income proof allows the underwriter to apply standard multiples (typically 15-25x annual income at younger ages, tapering with age) and reject or scale down disproportionate covers.',
          },
          {
            question: 'Does the three-year rule under Section 45 apply to suicide claims?',
            answer:
              'Section 45 deals with the insurer\'s ability to question a policy. Suicide is governed separately under standard policy terms — most modern term policies contain a suicide exclusion only in the first 12 months from inception or revival, after which suicide is fully covered. The post-2015 Section 45 amendment further reinforces the policyholder\'s position by barring rescission after three years on any ground. Together, the framework protects the family in the vast majority of unfortunate cases.',
          },
        ],
        mcqs: [
          {
            question: 'Section 45 of the Insurance Act 1938 (as amended in 2015) prevents the insurer from questioning a policy after:',
            options: ['One year from issuance', 'Two years from issuance', 'Three years from issuance, revival or rider addition', 'Five years from issuance'],
            correctAnswer: 2,
            explanation:
              'Post the 2015 amendment, Section 45 bars any challenge to a life policy on any ground — including fraud — after three years from the date of issuance, revival or addition of a rider. This is one of the strongest policyholder protections in Indian insurance law.',
          },
          {
            question: 'A typical smoker pays approximately what multiple of the non-smoker term insurance premium?',
            options: ['1.0x (no difference)', '1.1-1.2x', '1.5-2.0x', '5.0x'],
            correctAnswer: 2,
            explanation:
              'Smoker/tobacco loadings are standard across Indian life insurers and typically range between 1.5x and 2.0x the non-smoker premium, reflecting the actuarially-supported mortality differential. Cotinine testing during medicals is increasingly used to verify declarations.',
          },
          {
            question: 'Under IRDAI 2017 Protection of Policyholders\' Interests Regulations, the standard timeline for life insurance death claim settlement is:',
            options: [
              '7 days after intimation',
              '30 days after receipt of all required documents, with penal interest for insurer-caused delay',
              '90 days from death',
              'Within the financial year of the claim',
            ],
            correctAnswer: 1,
            explanation:
              'IRDAI mandates 30 days from receipt of all documents for life death claim settlement. Delay attributable to the insurer attracts penal interest at bank rate plus 2%. For non-life claims, 30 days from receipt of survey report applies, with specific exceptions where fraud investigation is warranted.',
          },
        ],
        summaryNotes: [
          'Risk classification — preferred, standard, sub-standard — drives the loaded or counter-offered premium.',
          'Lifestyle, occupation, BMI and chronic conditions are explicit underwriting inputs.',
          'Section 45 (post-2015) is the strongest statutory protection: three-year contestability cap.',
          'IRDAI 2017 regulations bind claim timelines and specify Ombudsman recourse up to ₹50 lakh.',
          'The practitioner\'s role: secure complete and accurate disclosure to protect the family\'s claim.',
        ],
        relatedTopics: ['insurance-foundation', 'term-insurance-essentials', 'ulip-endowment-mechanics'],
      },
    },

    {
      id: 'ulip-endowment-mechanics',
      title: 'Long-term Insurance & ULIP Mechanics — Charges, Tax Caps and Honest Comparisons',
      slug: 'ulip-endowment-mechanics',
      content: {
        definition:
          'Long-term insurance products in India fall broadly into two families: traditional participating endowment / money-back / whole-life plans, where the insurer pools premiums in a non-unit-linked fund and declares periodic reversionary and terminal bonuses; and Unit-Linked Insurance Plans (ULIPs), where the policyholder\'s investment portion is invested in unit-linked funds (equity, debt or balanced) and the policyholder bears the investment risk directly. Both wrap a life cover into a savings vehicle, but the disclosure regime, charge stack and tax treatment differ substantially. Understanding the precise mechanics is essential for any practitioner advising on bundled insurance-investment products.',
        explanation:
          'A ULIP\'s gross premium is decomposed into several heads. Premium Allocation Charge is deducted upfront from the premium before investment, typically front-loaded in the first one to three years. Mortality Charge is deducted monthly to fund the life cover and is computed on the sum-at-risk (sum assured minus fund value) using the insurer\'s mortality table. Fund Management Charge is capped by IRDAI at 1.35% per annum of fund value across all funds, deducted daily through NAV adjustment. Policy Administration Charge is a flat or escalating monthly deduction. Discontinuance Charges apply if premiums are stopped before the end of the five-year lock-in period — IRDAI caps these at ₹6,000 in year one, scaling down to nil by year five. The minimum sum assured floor — driven by Section 10(10D) of the Income Tax Act and IRDAI\'s 2010 product guidelines — is ten times the annualised premium for entrants below age 45 and seven times for older entrants, ensuring the insurance label is not a tax-free investment wrapper. Free fund switching (typically four to twelve switches per policy year) is permitted within the policy without tax incidence — a meaningful operational advantage. Partial withdrawal is allowed after the five-year lock-in, subject to a residual fund value floor. The Finance Act 2021 introduced a critical change: where annual ULIP premium exceeds ₹2.5 lakh (across all ULIPs of the same individual), maturity proceeds are taxable as capital gains, with equity-oriented ULIPs taxed similarly to equity mutual funds (10% LTCG above ₹1 lakh annual gain, post-Budget 2024 rate adjustments apply) — neutralising the tax arbitrage. Traditional endowment math is opaque by design. Bonuses are declared annually by the insurer based on the surplus of the participating fund: reversionary bonuses accrue and crystallise on death or maturity, and a terminal bonus may be paid on maturity or late-stage death. Surrender value before the lock-in is typically zero; post lock-in it is the higher of guaranteed surrender value (a small percentage of premiums paid) or special surrender value (insurer-discretionary). The practical IRR on a 20-25 year endowment, net of all charges, has historically been in the 4-6% band — well below long-term equity mutual fund returns and often below current government bond yields. The honest case where a ULIP can outperform a separate term-plus-mutual-fund construction is narrow: very long horizons (25+ years), policyholders who will demonstrably not maintain investment discipline outside a forced wrapper, those benefiting from the equity-debt switching tax advantage, or specific tax-bracket transitions where the bundled cover and the lock-in serve a behavioural purpose. For most disciplined investors, separate term insurance plus mutual fund SIPs remains the structurally superior combination — but the practitioner must understand the mechanics deeply enough to make this case rigorously rather than reflexively.',
        realLifeExample:
          'A 35-year-old buys a 20-year ULIP with ₹2 lakh annual premium, ₹20 lakh sum assured (10x floor), allocated 80% equity / 20% debt. In year one, premium allocation charge is 6% (₹12,000), mortality charge is approximately ₹1,800 (sum-at-risk ₹18 lakh times the age-35 mortality rate), policy admin charge is ₹1,200 annually, and fund management charge is 1.35% of fund value. Net invested in year one is roughly ₹1.85 lakh. Across 20 years, the cumulative drag of charges (heaviest in years one to five) suppresses the realised IRR to roughly 8-9% on an underlying equity gross return of 12%. The same family running a parallel construction — a ₹1 crore term plan at ₹15,000 annual premium plus ₹1.85 lakh into a direct or regular equity mutual fund SIP — achieves materially higher cover (₹1 crore vs ₹20 lakh) and a fund-management charge of 1.0-1.6% only, with no premium allocation or policy admin drag. Over 20 years, the mutual fund corpus typically exceeds the ULIP fund value by 25-40%. The exception: if the same family has annual premium below ₹2.5 lakh, holds the ULIP for 25+ years, and uses equity-to-debt switching as goals approach, the tax-free switching can partially close the gap — but the cover gap remains structural.',
        keyPoints: [
          'ULIP charge stack: premium allocation, mortality, fund management (1.35% IRDAI cap), policy admin, discontinuance.',
          'Five-year lock-in is statutory; partial withdrawal permitted thereafter, subject to residual value floor.',
          'Sum assured floor: 10x annualised premium (entry below age 45) for Section 10(10D) tax eligibility.',
          'Free fund switches (4-12/year typical) within policy without tax — a genuine operational advantage.',
          'Finance Act 2021: ULIP premium above ₹2.5 lakh per annum loses tax-free maturity status; gains taxed as capital gains.',
          'Traditional endowment IRR net of charges is typically 4-6% — below long-term equity mutual funds.',
          'Term plus mutual fund SIP is structurally superior for most disciplined investors; the ULIP case is narrow but real.',
        ],
        faq: [
          {
            question: 'Does the ₹2.5 lakh ULIP cap apply per policy or per individual?',
            answer:
              'It applies to the aggregate annual premium across all ULIPs of the same individual, as introduced by the Finance Act 2021 and codified through Section 10(10D) provisos. Holding multiple ULIPs each below ₹2.5 lakh but together exceeding the threshold also breaches the cap and the maturity proceeds become taxable as capital gains. The death benefit remains tax-free under Section 10(10D) regardless.',
          },
          {
            question: 'Are reversionary and terminal bonuses guaranteed once declared?',
            answer:
              'Reversionary bonuses, once declared, attach to the policy and become guaranteed payable on death or maturity — they cannot be revoked. Terminal bonuses are declared at the discretion of the insurer\'s board on a year-by-year basis and are not guaranteed in advance; they reflect the insurer\'s assessment of the participating fund\'s surplus at that point. A practitioner should set client expectations accordingly: illustrated bonuses in the benefit illustration are projections, not promises.',
          },
          {
            question: 'When does the structural ULIP-vs-term-plus-MF case actually favour the ULIP?',
            answer:
              'Three honest cases: (1) policyholders with chronic indiscipline who will not maintain SIPs voluntarily outside a forced wrapper — the inferior outcome inside a ULIP still beats no investment at all; (2) very long horizons (25+ years) combined with active equity-to-debt switching as the goal nears, leveraging tax-free intra-policy switching; (3) specific bundled-need scenarios for HNIs where insurance-trust structures and creditor-protection benefits combine with the investment outcome. In all three, full disclosure of charges and a side-by-side comparison with the separate construction is the practitioner\'s duty.',
          },
        ],
        mcqs: [
          {
            question: 'IRDAI caps the Fund Management Charge on a ULIP at:',
            options: ['0.5% per annum', '1.0% per annum', '1.35% per annum', '2.5% per annum'],
            correctAnswer: 2,
            explanation:
              'Under IRDAI ULIP product guidelines, the Fund Management Charge is capped at 1.35% per annum of fund value, deducted daily through NAV adjustment. This cap was introduced to address pre-2010 ULIPs where stacked charges suppressed realised returns substantially.',
          },
          {
            question: 'Under the Finance Act 2021, ULIP maturity proceeds lose Section 10(10D) tax exemption when annual premium exceeds:',
            options: ['₹1 lakh', '₹1.5 lakh', '₹2.5 lakh', '₹5 lakh'],
            correctAnswer: 2,
            explanation:
              'The Finance Act 2021 introduced a ₹2.5 lakh annual aggregate premium threshold (across all ULIPs of the same individual). Above this, maturity proceeds are taxed as capital gains — equity-oriented ULIPs at the equity LTCG rate, others at applicable rates. Death benefits remain tax-free regardless.',
          },
          {
            question: 'For a ULIP to qualify under Section 10(10D), the minimum sum assured for an entrant aged below 45 is:',
            options: ['5x annualised premium', '7x annualised premium', '10x annualised premium', '20x annualised premium'],
            correctAnswer: 2,
            explanation:
              'Post the 2010 IRDAI product guidelines and aligned with Section 10(10D) of the IT Act, the sum assured floor is 10x annualised premium for entrants below 45 (and 7x for older entrants). Failing this, premiums lose Section 80C eligibility and maturity loses 10(10D) exemption.',
          },
        ],
        summaryNotes: [
          'ULIP charges decompose into allocation, mortality, FMC (1.35% capped), admin and discontinuance.',
          'Five-year lock-in; partial withdrawals post lock-in; sum assured 10x floor for tax eligibility.',
          '₹2.5 lakh annual aggregate premium cap (FY 2021+) above which maturity is taxable.',
          'Endowment IRR net of charges typically 4-6% — below long-term equity benchmarks.',
          'Term + mutual fund SIP is the structurally superior default; ULIP exceptions are narrow but legitimate.',
        ],
        relatedTopics: ['insurance-foundation', 'ulip-honest-view', 'underwriting-claims-framework'],
      },
    },

    {
      id: 'insurance-estate-business',
      title: 'Insurance for Estate Planning & Business Continuity — MWP Act, Keyman and Trust Structures',
      slug: 'insurance-estate-business',
      content: {
        definition:
          'Beyond pure income protection, life insurance functions as an estate-planning and business-continuity instrument. Specific statutes — the Married Women\'s Property Act 1874, sections of the Insurance Act 1938 (especially Sections 6 and 39 as amended in 2015), and provisions of the Income Tax Act 1961 — enable insurance to be used as a creditor-protected asset for the spouse and children, as a buy-sell funding mechanism for partnerships and closely-held companies, and as a structuring tool inside private trusts for HNI succession. A practitioner must understand each construct\'s legal effect and tax consequence to advise responsibly.',
        explanation:
          'The Married Women\'s Property Act 1874 (MWP Act) creates one of the most powerful protective wrappers available in Indian estate planning. Section 6 of the MWP Act provides that a policy of life insurance effected by a married man on his own life, expressed on the face of it to be for the benefit of his wife, or his wife and children, or any of them, shall be deemed a trust for the benefit of those persons. The crucial consequence: such a policy is not part of the policyholder\'s estate, is not available to creditors of the policyholder, and is not subject to claims of the policyholder\'s heirs under personal succession law. The proceeds vest exclusively in the named beneficiaries through the deemed trust. The election under MWP Act must be made at policy inception (it cannot be added retrospectively), and once made, the policyholder loses the right to alter beneficiaries unilaterally, surrender the policy without trustee consent, or take a loan against it. For a businessperson with personal guarantees outstanding or a professional with malpractice exposure, an MWP-tagged term plan is the single most effective way to ring-fence financial protection for the family. Keyman insurance is a corporate-policyholder, key-employee-life-insured construct used to protect a business from the financial consequences of losing a critical person — typically a founder, CTO or rainmaker. The premium is deductible under Section 37(1) of the Income Tax Act if the policy is shown as a business expense and the insured has no personal beneficial interest, but the eventual claim or maturity proceeds become taxable in the hands of the company (without the Section 10(10D) exemption that applies to personal life insurance). Buy-sell agreements in partnerships and closely-held companies use cross-purchase or entity-purchase insurance: each partner takes a policy on the other partners\' lives (cross-purchase) or the entity holds policies on each partner (entity-purchase), funding the buy-out of a deceased partner\'s share at a pre-agreed valuation formula. This avoids forced-sale of the business and clean exit for the deceased partner\'s family at a fair price. Group term insurance schemes for employer-employee constructions are governed by IRDAI group insurance regulations and offer simplified underwriting at scale, with premiums deductible to the employer and the death benefit tax-free in the employee\'s family\'s hands under Section 10(10D). On the succession side, the Insurance Laws (Amendment) Act 2015 introduced the concept of a "beneficial nominee" — Section 39 of the Insurance Act now provides that where the nominee is a parent, spouse, child or specified relative, that person becomes the beneficial owner of the proceeds (not merely a custodian) and the proceeds do not flow into the policyholder\'s general estate. For HNI estate planning, an insurance trust structure is increasingly used: a private discretionary trust is created with the policyholder as settlor, the trust as policyholder, and family members as beneficiaries. The trust pays premiums (often funded by gifts from the settlor) and on death, proceeds vest in the trust corpus and are distributed per the trust deed. This structure delivers creditor protection, succession control beyond the lifetime of the settlor, and clean separation from probate. NRI proposers face additional considerations: residence at proposal, currency of premium and claim, FATCA / CRS reporting, and tax treatment of proceeds in the country of residence — typically requiring coordinated cross-border tax advice.',
        realLifeExample:
          'A 45-year-old promoter of a closely-held manufacturing business in Surat carries personal guarantees of ₹15 crore against bank facilities. He buys a ₹5 crore term plan and elects the MWP Act at inception, with his wife and two minor children as beneficiaries. Two years later, the business faces a downturn and the bank invokes guarantees against personal assets. The MWP-tagged term plan is statutorily insulated — it cannot be attached by the bank or any other creditor, and on his eventual death, the ₹5 crore vests in the family through the deemed trust regardless of any insolvency proceeding against his estate. Separately, the business itself takes a ₹10 crore Keyman policy on his life (premium deductible under Section 37(1)) to fund operational continuity if he were to die before succession is in place. His two co-founders enter a cross-purchase buy-sell agreement, each holding ₹3 crore policies on the other\'s lives, with a valuation formula of 5x trailing EBITDA. On his death, the co-founders receive ₹3 crore each, use the proceeds to buy out his stake from his wife at the formula price, and the family receives a clean monetised exit at a fair value rather than being forced into ongoing business participation.',
        keyPoints: [
          'MWP Act 1874 (Section 6): deemed-trust effect insulates policy proceeds from creditors and estate claims, vesting in spouse/children only.',
          'MWP election must be made at inception and cannot be reversed unilaterally; policyholder gives up some control in exchange for protection.',
          'Keyman insurance: premium deductible u/s 37(1); claim taxable in company\'s hands (no 10(10D) exemption).',
          'Buy-sell agreements (cross-purchase or entity-purchase) fund partnership succession at pre-agreed valuation.',
          'Insurance Laws Amendment 2015 — Section 39 — introduced "beneficial nominee" status for spouse, parent, child.',
          'HNI insurance trust structures: private discretionary trust as policyholder, gifts/loans fund premiums, succession control beyond settlor\'s life.',
          'NRI insurance: currency, residency, FATCA/CRS reporting and country-of-residence tax all matter — coordinated advice required.',
        ],
        faq: [
          {
            question: 'Can the MWP Act be invoked on an existing policy that did not originally elect it?',
            answer:
              'No. The MWP Act election must be made at the time of policy inception by signing the prescribed addendum or selecting the MWP option on the proposal form. It cannot be added to an existing policy retrospectively. For practitioners, this means MWP planning has to happen at the buying stage — a missed election cannot be cured later, even by endorsement.',
          },
          {
            question: 'Is the Keyman insurance claim really taxable in the company\'s hands?',
            answer:
              'Yes. Section 10(10D) of the IT Act expressly excludes Keyman insurance proceeds from its tax-exemption umbrella. The proceeds are treated as business income of the company and taxed at the applicable corporate rate. The Section 37(1) deduction on premium is the trade-off; the company chooses an after-tax economic outcome that still funds the operational gap. If the policy is later assigned to the keyman individual at a fair value, the tax character can change — but assignment must be at fair market value to avoid challenge.',
          },
          {
            question: 'How does a "beneficial nominee" differ from an ordinary nominee?',
            answer:
              'Pre-2015, a nominee was merely a custodian — the insurer paid the proceeds to the nominee, but the proceeds then flowed into the deceased\'s estate and were distributed per personal succession law (Hindu Succession Act, Indian Succession Act, etc.), exposing them to claims by other heirs. The 2015 amendment to Section 39 of the Insurance Act provides that where the nominee is a parent, spouse, child or specified close relative, the nominee becomes the beneficial owner of the proceeds — they do not flow into the general estate and other heirs cannot claim a share. This is a meaningful protection but is narrower than MWP — beneficial nominees still face creditor claims if the deceased had outstanding debts, whereas MWP proceeds are insulated even from creditors.',
          },
          {
            question: 'When is an insurance trust structure worth the complexity for an HNI?',
            answer:
              'Insurance trust structures (private discretionary trust as policyholder, premiums funded by gifts or interest-free loans from the settlor) make sense where the cover required is large (₹10 crore plus), where the family includes minor or special-needs beneficiaries requiring controlled distribution beyond the settlor\'s lifetime, where creditor protection beyond MWP is required, or where the family\'s assets warrant a unified succession architecture combining insurance, real estate and financial assets. The setup involves trust deed drafting, ongoing trustee duties and annual compliance — typically only economic above a certain threshold of cover and asset size.',
          },
        ],
        mcqs: [
          {
            question: 'Under the Married Women\'s Property Act 1874, a properly elected policy is:',
            options: [
              'Treated as a normal asset of the policyholder\'s estate',
              'Held in a deemed trust for the benefit of the wife and/or children, insulated from the policyholder\'s creditors and other heirs',
              'Owned by the wife from inception, with the policyholder as a mere premium-payer',
              'Surrendered automatically on the policyholder\'s remarriage',
            ],
            correctAnswer: 1,
            explanation:
              'Section 6 of the MWP Act creates a deemed trust — the proceeds vest in the named beneficiaries (wife and/or children), are not part of the policyholder\'s estate, and are insulated from creditors and other heirs. This is one of the most powerful family-protection structures available in Indian law.',
          },
          {
            question: 'For Keyman insurance taken by a company on a key employee, which statement is correct?',
            options: [
              'Premium is deductible u/s 37(1); claim is tax-free u/s 10(10D)',
              'Premium is deductible u/s 37(1); claim is taxable as business income of the company',
              'Premium is not deductible; claim is tax-free',
              'Premium is deductible u/s 80C; claim is taxable as capital gains',
            ],
            correctAnswer: 1,
            explanation:
              'The premium is deductible as a business expense under Section 37(1). However, Section 10(10D) explicitly excludes Keyman policies from its tax-free maturity/death-benefit umbrella, so the claim proceeds are taxable as business income in the company\'s hands. The trade-off is symmetric and is the structural design of the Keyman construct.',
          },
          {
            question: 'The "beneficial nominee" concept under the Insurance Laws (Amendment) Act 2015:',
            options: [
              'Applies to any nominee named on the policy',
              'Applies only where the nominee is a parent, spouse, child or specified close relative — making them the beneficial owner of proceeds',
              'Replaces the MWP Act',
              'Requires registration with IRDAI',
            ],
            correctAnswer: 1,
            explanation:
              'Section 39 of the Insurance Act, post the 2015 amendment, introduced beneficial nominee status only for specified close relatives (parent, spouse, child, etc.). Such a nominee is the beneficial owner of the proceeds — the proceeds bypass the deceased\'s general estate. It is narrower than MWP (no creditor protection) but useful where MWP is not appropriate or was not elected.',
          },
        ],
        summaryNotes: [
          'MWP Act 1874 Section 6 — deemed trust, creditor-protected, must be elected at inception.',
          'Keyman insurance — premium deductible u/s 37(1), claim taxable in company; funds business continuity.',
          'Buy-sell agreements (cross-purchase / entity-purchase) — fund partnership succession at pre-agreed valuation.',
          'Beneficial nominee (Section 39, post-2015) — bypasses estate but not creditors; narrower than MWP.',
          'HNI insurance trust structures — private discretionary trust as policyholder for unified succession architecture.',
        ],
        relatedTopics: ['insurance-foundation', 'ulip-endowment-mechanics', 'underwriting-claims-framework'],
      },
    },
  ],
};
