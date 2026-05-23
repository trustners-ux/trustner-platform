import { LearningModule } from '@/types/learning';

export const giftProductsDeepModule: LearningModule = {
  id: 'gift-products-deep',
  title: 'GIFT IFSC Products — Deep Dive',
  slug: 'gift-products-deep',
  icon: 'Globe2',
  description:
    'Working-level walk-through of each major GIFT IFSC product category — USD funds, USD fixed deposits, USD insurance, IFSC AIFs, NSE IFSC equity platform — with target investor profiles, return characteristics, and operational mechanics.',
  level: 'intermediate',
  color: 'from-emerald-700 to-teal-600',
  estimatedTime: '35 min',
  track: 'gift-city',
  sections: [
    {
      id: 'gift-usd-funds',
      title: 'USD Funds in GIFT IFSC',
      slug: 'gift-usd-funds',
      content: {
        definition:
          'USD-denominated mutual fund equivalents in GIFT IFSC are managed by IFSC subsidiaries of Indian AMCs (HDFC AMC IFSC, Nippon IFSC, ICICI Prudential IFSC, Edelweiss IFSC, others) and select international firms. They invest in global equities, fixed income, or hybrid strategies, publish daily NAV in USD, and accept subscriptions/redemptions in USD with operational mechanics similar to onshore mutual funds.',
        explanation:
          'USD equity funds in GIFT typically focus on US equities (S&P 500, Nasdaq 100), global equities (MSCI World), or thematic strategies (Global Tech, Global ESG). Operational structure: IFSC AMC subsidiary holds the underlying portfolio; daily NAV published in USD. Subscriptions accepted T+1 to T+3 depending on scheme. Redemptions process in USD; investors can repatriate to India (converting to INR at then-prevailing rate, with capital gains tax applying) or retain USD in the IFSC account for future deployment. USD bond/fixed-income funds invest in global investment-grade or high-yield bonds, USD-denominated emerging market debt, or short-duration money market. Target yields: 3-5% for IG bonds, 5-7% for high-yield, 4-6% for short-duration money market — reflecting US/global yield environment. Hybrid USD funds combine equity and debt with target asset mix similar to balanced advantage or aggressive hybrid mutual funds in INR. Subscription and redemption operate similarly to onshore funds — but in USD. Expense ratios are typically 0.6-1.2% for equity funds and 0.4-0.8% for debt funds — generally competitive with international FoF expense ratios for Indian retail investors. Tax treatment of USD fund redemptions for resident Indians: gains are foreign-source capital gains, classified per CBDT rules. Long-term gains (typically over 24 months for non-equity-classified) attract slab-rate tax post-FY24. Investors should not assume "tax-free" — the GIFT advantage is partial and product-specific.',
        realLifeExample:
          'A representative USD Global Equity Fund offered by an IFSC AMC: tracks MSCI World Index with active overlay, expense ratio 0.85%, daily NAV in USD, subscriptions T+2. Investor commits USD 50,000 in May 2026 within their LRS budget. NAV at subscription: USD 100. Units allotted: 500. Five years later, NAV is USD 165 (10.5% USD CAGR). Redemption: 500 units × USD 165 = USD 82,500. Repatriation to INR at rate 92 INR/USD: ₹75.9 lakh. Original investment in INR (at LRS rate ₹84/USD): ₹42 lakh. Gross INR gain: ₹33.9 lakh. The gain comprises USD asset appreciation + USD/INR depreciation effect. Tax computation in India: foreign-source capital gain ₹33.9 lakh, taxed at applicable rate based on classification. Net post-tax realisation depends on slab and classification. The investor has captured genuine USD asset growth + currency diversification benefit.',
        keyPoints: [
          'USD funds in GIFT: equity, debt, hybrid — managed by IFSC subsidiaries.',
          'Daily NAV in USD; T+1 to T+3 settlement; expense ratios competitive.',
          'Operational mechanics similar to onshore MFs but USD-denominated.',
          'Tax: foreign-source capital gains for residents; classification follows CBDT rules.',
          'GIFT tax advantage is partial and product-specific — not blanket "tax-free".',
          'Subscription and redemption flow through LRS for resident Indians.',
          'Genuine USD currency exposure; not just INR-denominated international tracking.',
        ],
        faq: [
          {
            question: 'Are GIFT USD fund expense ratios cheaper than Indian international FoFs?',
            answer:
              'Typically yes, when comparing the all-in cost. Indian international FoFs charge 0.5-1.0% on top of the underlying ETF\'s 0.03-0.20%. GIFT USD funds charge 0.6-1.2% all-in. The all-in cost is comparable; the GIFT advantage is more about USD denomination than fee economics.',
          },
          {
            question: 'How quickly does my LRS quota replenish?',
            answer:
              'LRS limit of USD 250,000 per individual is per financial year (April-March in India). The full annual quota replenishes on April 1 each year, regardless of how much was used in the prior FY. Sophisticated investors plan their GIFT investments around the FY calendar to maximise LRS deployment.',
          },
          {
            question: 'Can I do SIPs in GIFT USD funds?',
            answer:
              'Some IFSC AMCs offer monthly subscription mechanisms similar to SIPs. The investor sets up a recurring USD remittance via their bank, with each remittance treated as a subscription to the IFSC fund. Operationally heavier than INR SIPs (each remittance requires LRS A2 form and bank processing), so most investors prefer quarterly or semi-annual lumpsum subscriptions.',
          },
        ],
        mcqs: [
          {
            question: 'GIFT USD funds publish their NAV in:',
            options: ['INR only', 'USD daily, with INR equivalent for reference', 'EUR', 'Bitcoin'],
            correctAnswer: 1,
            explanation:
              'GIFT USD funds publish daily NAV in USD. The INR equivalent is shown for reference but the legal denomination and reporting currency is USD. Subscriptions, redemptions, and distributions are in USD.',
          },
          {
            question: 'Tax on a GIFT USD equity fund redemption for a resident Indian is:',
            options: [
              'Tax-free always',
              'Foreign-source capital gains, taxed per CBDT classification rules',
              'Only TDS deduction, no further tax',
              'Slab-rate on full proceeds',
            ],
            correctAnswer: 1,
            explanation:
              'Gains on GIFT USD fund redemptions are foreign-source capital gains for resident Indians. Classification (LTCG/STCG, equity/non-equity) follows CBDT rules. Tax rates apply per the classification — not a blanket "tax-free" treatment.',
          },
          {
            question: 'A representative GIFT USD equity fund expense ratio is approximately:',
            options: ['0.05%', '0.6-1.2%', '5-10%', 'No expenses'],
            correctAnswer: 1,
            explanation:
              'GIFT USD equity funds typically charge 0.6-1.2% expense ratio — competitive with Indian international FoF all-in costs (FoF + underlying ETF). Bond and money-market USD funds charge 0.4-0.8%.',
          },
        ],
        summaryNotes: [
          'GIFT USD funds: equity, debt, hybrid; managed by IFSC AMCs.',
          'Daily NAV in USD; expense ratios 0.4-1.2% depending on type.',
          'Tax: foreign-source capital gains per CBDT classification.',
          'Genuine USD currency exposure for resident Indians via LRS.',
        ],
        relatedTopics: ['gift-products', 'gift-tax-advantages', 'gift-usd-insurance'],
      },
    },

    {
      id: 'gift-usd-fds',
      title: 'USD Fixed Deposits at IFSC Banking Units',
      slug: 'gift-usd-fds',
      content: {
        definition:
          'USD Fixed Deposits (FDs) at IFSC banking units are foreign-currency deposits offered by Indian banks (HDFC, ICICI, SBI, Axis, Kotak) and select international banks operating in GIFT IFSC. Available to resident Indians via LRS and to NRIs directly. Yields reflect the prevailing USD interest-rate environment. Tenor options 6 months to 5 years.',
        explanation:
          'Yields. Current USD FD yields (as of mid-2026) range 4-5% depending on tenor and bank. 1-year FDs typically 4.5-5.0%; 3-year FDs 4.5-4.8% (slightly inverted curve reflecting expected rate cuts); 5-year FDs 4.3-4.6%. These yields exceed the 1-2% range available in US bank savings accounts, reflecting the IFSC operating premium plus the deposit-base concentration that IFSC banking units run. Compared to INR domestic FDs (currently 6.5-7.5% for major Indian banks), USD FDs deliver lower nominal yields but in USD denomination — meaningful for investors with future USD expenditure or seeking currency diversification. Tax treatment for resident Indians: interest income from USD FDs is taxable in India as foreign-source income at slab rates. There is no special tax exemption for IFSC USD FD interest — this is the same treatment as interest from any foreign-source FD. CA reporting in Schedule FSI (Foreign Source Income) of ITR-2 or ITR-3. Onboarding: investor approaches the IFSC banking unit\'s representative (typically through their existing Indian bank relationship or directly), completes KYC and FATCA/CRS forms, and remits USD via LRS to fund the FD. Documentation is digital where possible. Maturity: principal and accumulated interest can be repatriated to India (with INR tax at slab on the interest, no tax on principal) or retained in USD for future USD deployment.',
        realLifeExample:
          'An investor at age 50 with planned overseas travel and education funding over 5 years allocates USD 80,000 across three GIFT USD FDs: USD 30,000 in a 1-year FD at 4.8% (₹25.5 lakh INR equivalent at ₹85/USD), USD 30,000 in a 3-year FD at 4.6%, USD 20,000 in a 5-year FD at 4.4%. Annual interest: USD 1,440 + 1,380 + 880 = USD 3,700 (₹3.14 lakh INR). Tax treatment: interest taxable at slab; assume 30% slab → ₹94,200 INR tax annually. Net interest after tax: ₹2.20 lakh annually. The investor has built a USD-denominated income stream with predictability that an INR FD cannot deliver for future USD expenses.',
        keyPoints: [
          'USD FDs at IFSC banking units: 6 months to 5 years tenor.',
          'Current yields: 4.0-5.0% depending on tenor and bank.',
          'Higher than US bank savings accounts; lower than INR FDs (in nominal terms).',
          'Interest income for residents: foreign-source, slab-rate taxation, no special exemption.',
          'Subscription via LRS; principal repatriation via authorised dealer.',
          'Maturity: repatriate or retain in USD for future deployment.',
          'Operational simplicity — no offshore brokerage account needed.',
        ],
        faq: [
          {
            question: 'Are GIFT USD FDs FDIC or DICGC insured?',
            answer:
              'Neither. US FDIC insurance applies to deposits at US-domiciled FDIC-member banks. India\'s DICGC insurance applies to INR deposits at domestic banks. GIFT USD FDs are deposits at IFSC banking units which are governed by IFSCA — typically backed by the credit of the bank (most are major Indian banks). Investors should evaluate bank credit quality (typically AAA-rated parent banks) but should not assume formal deposit insurance.',
          },
          {
            question: 'Can I premature-withdraw a GIFT USD FD?',
            answer:
              'Yes — similar to domestic FDs, with applicable penalty. Premature withdrawal typically reduces the effective yield by 0.5-1.0% and may not be permitted in the initial 30-90 days. Read the specific FD terms carefully. For predictable liquidity needs, choose shorter tenors at slightly lower yields rather than longer tenors with premature-withdrawal penalty.',
          },
          {
            question: 'How does GIFT USD FD compare to NRI FCNR deposits?',
            answer:
              'FCNR deposits are USD/foreign-currency deposits at Indian banks for NRIs only — eligibility is the key difference. Yields, tenors, and bank-credit quality are similar. Resident Indians can access GIFT USD FDs but not FCNR. NRIs can choose either. For NRIs, tax treatment may differ — FCNR interest is tax-exempt for NRIs in India (under Section 10), while GIFT USD FD interest treatment depends on the specific scheme structure.',
          },
        ],
        mcqs: [
          {
            question: 'A current 1-year USD FD at an IFSC banking unit typically yields:',
            options: ['1.5-2%', '4.5-5.0%', '12%', '0%'],
            correctAnswer: 1,
            explanation:
              '1-year USD FDs at IFSC banking units currently yield approximately 4.5-5.0%, reflecting the prevailing USD interest-rate environment plus IFSC operating premium. Yields vary by bank and tenor.',
          },
          {
            question: 'Interest income from a GIFT USD FD for a resident Indian is taxed:',
            options: [
              'Tax-free always',
              'As foreign-source income at slab rate',
              'Flat 12.5% LTCG',
              'Only after 5 years',
            ],
            correctAnswer: 1,
            explanation:
              'Interest income from GIFT USD FDs is foreign-source income for resident Indians, taxable at applicable slab rate. There is no special exemption — the GIFT advantage applies more to capital-gain products than to interest-yielding products.',
          },
          {
            question: 'GIFT USD FDs are:',
            options: [
              'Insured by US FDIC',
              'Insured by Indian DICGC',
              'Backed by the issuing IFSC bank\'s credit; no formal deposit insurance equivalent',
              'Government-guaranteed',
            ],
            correctAnswer: 2,
            explanation:
              'Neither US FDIC nor Indian DICGC insurance applies. GIFT USD FDs are governed by IFSCA and backed by the credit of the issuing IFSC banking unit (typically a major Indian bank). Evaluate the parent bank\'s credit quality.',
          },
        ],
        summaryNotes: [
          'GIFT USD FDs: 4-5% yields; 6 months to 5 years; via LRS for residents.',
          'Interest taxable at slab as foreign-source income.',
          'No formal deposit insurance — bank credit quality matters.',
          'Useful for USD-denominated income streams matching future USD expenses.',
        ],
        relatedTopics: ['gift-products', 'gift-usd-funds', 'gift-tax-advantages'],
      },
    },

    {
      id: 'gift-usd-insurance',
      title: 'USD Life & Term Insurance in GIFT IFSC',
      slug: 'gift-usd-insurance',
      content: {
        definition:
          'USD-denominated life and term insurance offered by IFSC subsidiaries of Indian insurers (HDFC Life IFSC, ICICI Prudential IFSC, others) and select international insurers. Sum assured and premiums are in USD; payouts on death or maturity are in USD. Suited for families planning overseas USD expenses (children\'s education, retirement abroad) or seeking currency-matched protection.',
        explanation:
          'USD term insurance offers pure protection: investor pays USD premium for defined cover term (typically 20-40 years), receives USD sum assured on death within term. Premium for a 35-year-old non-smoker for USD 1 million sum assured (~₹85 lakh equivalent) typically ranges USD 800-1,200 annually depending on insurer and rider choices. Comparable to a similar INR term plan (₹15,000-25,000 for ₹1 crore cover) — but the USD denomination matches potential future USD-denominated family expenses. USD whole-life and endowment policies combine USD insurance with savings — pay USD premium, receive USD lump sum at maturity (typically with guaranteed and bonus components). These policies have similar structural critique as INR endowment (high embedded charges, sub-optimal returns) — generally not the best vehicle for combined insurance + investment, but the USD denomination may be the deciding factor for some families. Tax treatment of USD insurance for resident Indians: death proceeds typically tax-free (analogous to Section 10(10D) for INR life insurance, subject to specific conditions). Maturity proceeds may be tax-free if specific premium-to-sum-assured conditions are met (post-2021 tightened framework). Onboarding: medical underwriting via IFSC insurer\'s panel doctors (some accept Indian medical reports). Premium payment via LRS in USD. Policy issued in USD. Disclosure of overseas insurance assets in India\'s annual tax filing (Schedule FA). The right candidate for USD insurance: families with foreseeable USD expenses or international living plans where USD protection matches potential USD liabilities.',
        realLifeExample:
          'A 38-year-old IT executive in Mumbai with two children planning US universities allocates a portion of family insurance to USD policies. Existing protection: ₹1.5 crore INR term for 30 years. Adds: USD 500,000 GIFT IFSC term policy with 25-year tenure, premium USD 600/year (~₹50,000 INR). Combined cover: ₹1.5 crore INR + USD 500,000 (~₹42 lakh equivalent at current rate) = ~₹2 crore total protection, of which ₹50 lakh USD-denominated. If the breadwinner dies: family receives USD 500,000 directly in USD, can fund children\'s US education without currency conversion at potentially adverse rate. The structural value is currency-matched protection. The trade-off: USD term premiums are higher than INR equivalents because of the higher cost of USD-denominated mortality coverage in India\'s market.',
        keyPoints: [
          'USD term insurance: pure protection, USD-denominated cover and premium.',
          'USD whole-life / endowment: combined insurance + savings; structural critique applies.',
          'Premium: USD 800-1,200 annually for USD 1 million cover at age 35 (varies).',
          'Tax: death proceeds typically tax-free; maturity treatment per Section 10(10D) framework.',
          'Subscription via LRS in USD; medical underwriting via IFSC insurer panel.',
          'Disclosure required in Schedule FA (Foreign Assets) of Indian tax return.',
          'Suits families with foreseeable USD expenses or international living plans.',
        ],
        faq: [
          {
            question: 'Should I prefer USD term over INR term for cost reasons?',
            answer:
              'No — INR term is typically cheaper per ₹ of cover for an Indian resident due to insurer pricing dynamics. The case for USD term is currency-matched protection for future USD obligations, not cost optimisation. Most Indian families should hold primary protection in INR term and add USD term only as a supplement when USD expenses are foreseeable.',
          },
          {
            question: 'What is the medical underwriting process for GIFT USD insurance?',
            answer:
              'Most IFSC insurers accept Indian medical reports from their panel hospitals or doctors. The underwriting is similar to INR term plans — height, weight, BP, blood tests, ECG depending on age and sum assured. Some insurers may require additional tests for higher sum assured. Online and tele-medical underwriting is increasingly available for select sum-assured ranges.',
          },
          {
            question: 'How do GIFT USD policies compare to direct US insurance through companies like AIG or MetLife?',
            answer:
              'Direct US insurance from US-domiciled insurers requires US residence or physical presence — generally not available to Indian residents. International insurers operating through GIFT (e.g., Munich Re, select global names) may offer comparable products. The advantage of GIFT IFSC over direct US is regulatory familiarity (IFSCA jurisdiction), absence of US estate-tax exposure on the policy itself, and easier ongoing administration from India. The disadvantage is a smaller universe of insurers and product types.',
          },
        ],
        mcqs: [
          {
            question: 'A USD 1 million GIFT term insurance policy for a 35-year-old non-smoker typically costs annually:',
            options: [
              'USD 100',
              'USD 800-1,200',
              'USD 5,000+',
              'No premium',
            ],
            correctAnswer: 1,
            explanation:
              'A USD 1 million sum-assured term policy for a 35-year-old non-smoker typically costs USD 800-1,200 annually depending on insurer and riders. This is meaningfully higher per ₹ of cover than INR term plans due to insurer pricing dynamics.',
          },
          {
            question: 'Death proceeds from a GIFT USD term insurance for the nominee are typically:',
            options: [
              'Taxable at slab rate',
              'Tax-free in India (analogous to Section 10(10D))',
              'Subject to GST',
              'Subject to TCS only',
            ],
            correctAnswer: 1,
            explanation:
              'Death proceeds from GIFT USD term insurance are typically tax-free in India under provisions analogous to Section 10(10D) of the Income Tax Act, subject to specific conditions. Always confirm the specific tax treatment in the policy documentation.',
          },
          {
            question: 'GIFT USD insurance is best suited for:',
            options: [
              'Cost-optimisation over INR term',
              'Families with foreseeable USD expenses or international living plans',
              'Investors seeking maximum returns',
              'No specific use case',
            ],
            correctAnswer: 1,
            explanation:
              'GIFT USD insurance suits families with foreseeable USD expenses (children\'s overseas education, retirement abroad, second-home purchase) where currency-matched protection eliminates conversion risk at potentially adverse exchange rates. Cost optimisation favours INR term plans for residents.',
          },
        ],
        summaryNotes: [
          'GIFT USD insurance: term, whole-life, endowment in USD denomination.',
          'Term premiums higher than INR equivalents; case is currency-matching, not cost.',
          'Tax: death proceeds typically tax-free; report in Schedule FA.',
          'Suits families with foreseeable USD expenses or international plans.',
        ],
        relatedTopics: ['gift-products', 'gift-usd-funds', 'term-insurance-essentials'],
      },
    },
  ],
};
