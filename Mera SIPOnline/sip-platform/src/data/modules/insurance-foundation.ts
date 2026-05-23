import { LearningModule } from '@/types/learning';

export const insuranceFoundationModule: LearningModule = {
  id: 'insurance-foundation',
  title: 'Insurance Foundation',
  slug: 'insurance-foundation',
  icon: 'Shield',
  description:
    'Insurance is the financial product most Indian families buy first — and most often mis-buy. This foundation track covers what every family needs (term + health + critical illness), how to size each, why investment-linked insurance is rarely the right answer, and how Trustner Insurance Brokers Pvt. Ltd. (IRDAI Code 1067) approaches honest broker-led recommendations.',
  level: 'beginner',
  color: 'from-rose-700 to-red-600',
  estimatedTime: '40 min',
  track: 'insurance',
  sections: [
    {
      id: 'insurance-why',
      title: 'Why Insurance? Protection Before Wealth Creation',
      slug: 'why-insurance',
      content: {
        definition:
          'Insurance is the financial mechanism through which an individual pays a periodic premium to an insurance company in exchange for the insurer\'s commitment to pay a defined sum on the occurrence of a specified adverse event — typically death, hospitalisation, critical illness, disability, or property damage. The core purpose is to transfer financial catastrophic risks to the insurer\'s balance sheet, protecting the family\'s savings and goals from being depleted by an unexpected event.',
        explanation:
          'Indian families face three primary financial catastrophic risks. First, the loss of the breadwinner: if the primary earning member of a family dies in their working years, the family loses both immediate income and the capacity to fund major future goals (children\'s education, retirement, home loan repayment). Term insurance addresses this with a large sum assured paid to the family on the death of the insured. Second, hospitalisation cost: a single major hospitalisation in India today can run ₹3-30 lakh, and medical inflation runs 12-15% annually — far above general CPI. Health insurance addresses this by reimbursing or paying directly to the hospital. Third, critical illness: cancer, heart disease, organ failure, paralysis. The medical cost may be covered by health insurance, but the loss of income during treatment and recovery (often 6-24 months), plus lifestyle adjustments, requires a separate financial buffer. Critical Illness Insurance pays a lump sum on diagnosis of specified illnesses. These three together — term, health, critical illness — form the protection foundation. Every Indian family should have all three before allocating money to investment products. The reasoning is brutal but simple: an investment portfolio takes 15-20 years to compound to material wealth. A catastrophic event can wipe out 5-10 years of compounded gains in a few months. Protection is the moat around the wealth-creation engine. The mistake most Indian families make is buying ULIPs and endowment policies that mix investment and insurance, paying for both poorly. A typical ₹1 crore ULIP buys ₹3-5 lakh of life cover and a sub-optimal investment portfolio with high opaque charges. The same money split into a separate ₹1 crore term plan (₹15,000-25,000 annual premium) plus ₹98 lakh into mutual fund SIPs delivers 10x the cover and substantially higher returns. This "buy term + invest the difference" strategy is the single most important financial decision most Indian families can make.',
        realLifeExample:
          'Take Rajesh, a 35-year-old IT manager in Pune earning ₹18 lakh per annum. Wife is a homemaker. Two children aged 6 and 3. Outstanding home loan ₹40 lakh. Annual household expenses ₹9 lakh. If Rajesh dies tomorrow, his family needs (a) ₹40 lakh to clear the home loan, (b) ₹15-20 lakh for the children\'s school + college fees over the next 15 years, (c) ₹1 crore corpus that produces ~₹6 lakh annual income to cover ongoing expenses (assuming 6% sustainable withdrawal rate from a balanced corpus). Total need: approximately ₹1.5-1.8 crore. Rajesh\'s current life cover from his employer is ₹50 lakh — meaningfully short. He buys a ₹1.5 crore term plan with 30-year tenure at age 35, premium approximately ₹22,000 per year. Combined with employer cover, his family has ₹2 crore protection. Annual cost: ₹22,000 — about 1.2% of his salary. Cost relative to peace of mind: marginal. Cost of not having this cover, if catastrophe strikes: catastrophic. Rajesh also takes ₹15 lakh family floater health insurance (₹15,000 premium), and ₹25 lakh critical illness cover (₹6,000 premium). Total annual insurance spend: ₹43,000 — about 2.4% of his income. The remaining ~98% of his savings goes into mutual fund SIPs, EPF, and equity allocation. This is the textbook protection-first approach.',
        keyPoints: [
          'Three primary financial catastrophic risks: loss of breadwinner, hospitalisation, critical illness.',
          'Three core insurance products: term insurance, health insurance, critical illness insurance.',
          'Protection should be in place BEFORE serious investment allocation begins.',
          'Pure insurance is structurally efficient; investment-linked insurance (ULIP, endowment) typically is not.',
          'Buy term + invest the difference: 10x more cover, 2-3x more wealth, materially better outcomes.',
          'Total insurance premium for a typical family: 1.5-3% of annual income.',
          'Trustner Insurance Brokers Pvt. Ltd. (IRDAI Broker Code 1067) is empanelled with multiple insurers — recommendations are insurer-agnostic.',
        ],
        faq: [
          {
            question: 'How much life cover do I really need?',
            answer:
              'A common rule is 10-15x annual income, but a needs-based calculation is more accurate. Total need = outstanding loans + future major expenses (children\'s education, marriage, parent care) + corpus needed to generate replacement income for the family\'s residual needs. Use the Trustner Human Life Value calculator on merasip.com for a personalised estimate, or speak to your Relationship Manager for a guided needs assessment.',
          },
          {
            question: 'My employer provides ₹50 lakh group cover. Is that enough?',
            answer:
              'Almost certainly not for a primary breadwinner with dependents and a home loan. Employer cover is typically 1-2x annual salary and is contingent on continued employment — if you change jobs or are between employment, the cover may lapse. Use employer cover as a supplement, not as the primary cover. Buy an individual term plan with a sum assured calibrated to your full needs.',
          },
          {
            question: 'I am 28 and single. Do I need life insurance?',
            answer:
              'Probably not large life insurance — your dependents do not yet rely on your income. However, if you have parents or siblings financially dependent on you, or significant loans (education loan, business loan), term insurance is appropriate. Otherwise, focus on health insurance (always relevant) and critical illness (highly recommended). Buy life insurance when you have dependents — typically when you marry or have your first child. Term insurance is cheaper at younger ages, so a small foundation policy in your late 20s makes sense if affordable.',
          },
          {
            question: 'Why do you say ULIPs are usually bad?',
            answer:
              'ULIPs combine insurance and investment in a single product, but typically deliver poor outcomes on both. The insurance cover is small (₹3-5 lakh per ₹1 lakh annual premium for most products); the investment cost is high (premium allocation charges, mortality charges, fund management charges, policy admin charges all stacked). Net of all charges, the IRR after 10-15 years is often 5-7%, materially below mutual fund alternatives. The exception is for investors who genuinely will not maintain investment discipline outside of a forced-locked product — for them, the inferior outcome may still be better than no investment. For disciplined investors, separate term + mutual funds is structurally superior.',
          },
        ],
        mcqs: [
          {
            question: 'The "protection foundation" of three core insurance products consists of:',
            options: [
              'Term + Endowment + ULIP',
              'Term + Health + Critical Illness',
              'Health + Travel + Auto',
              'ULIP + Endowment + Money-Back',
            ],
            correctAnswer: 1,
            explanation:
              'The three core protection products every Indian family needs are: Term insurance (life cover), Health insurance (hospitalisation), and Critical Illness insurance (specific serious illnesses). These three address the primary financial catastrophic risks.',
          },
          {
            question: 'A common rule of thumb for life cover is:',
            options: ['1x annual income', '2-3x annual income', '10-15x annual income', '50x annual income'],
            correctAnswer: 2,
            explanation:
              'A common rule of thumb is 10-15x annual income, though needs-based calculation (using outstanding loans, future expenses, and required income replacement corpus) is more accurate. A 35-year-old earning ₹18 lakh would typically need ₹1.5-2 crore of cover.',
          },
          {
            question: 'The "buy term + invest the difference" strategy means:',
            options: [
              'Buy a term plan and invest separately in mutual funds',
              'Buy a ULIP for both purposes',
              'Buy multiple term plans',
              'Skip insurance and only invest',
            ],
            correctAnswer: 0,
            explanation:
              '"Buy term + invest the difference" means using a low-cost term plan for life cover (10-15x annual income) and investing the savings (compared to a more expensive ULIP) in mutual fund SIPs. This typically delivers materially better outcomes on both protection and wealth.',
          },
        ],
        summaryNotes: [
          'Three financial catastrophic risks: breadwinner loss, hospitalisation, critical illness.',
          'Three core products: term, health, critical illness.',
          'Protection-first principle: insurance before serious investment allocation.',
          '"Buy term + invest the difference" — superior structural outcome.',
          'Trustner Insurance Brokers (IRDAI 1067) is insurer-agnostic; recommendations follow client need.',
        ],
        relatedTopics: ['term-insurance-essentials', 'health-insurance-essentials', 'ulip-honest-view'],
      },
    },

    {
      id: 'term-insurance-essentials',
      title: 'Term Insurance — How Much, Until When, and What to Watch',
      slug: 'term-insurance-essentials',
      content: {
        definition:
          'Term insurance is the simplest and most cost-effective form of life insurance. The insured pays a periodic premium for a defined term (typically 25-40 years); if the insured dies during the term, the insurer pays the sum assured to the nominee. If the insured survives the term, no benefit is paid — the entire premium is "consumed" by the insurer (similar to motor or fire insurance). The simplicity is the strength: term insurance is pure protection at the lowest possible cost per ₹ of cover.',
        explanation:
          'Three decisions matter when buying term insurance. First, the sum assured. The right cover is a needs-based number — outstanding loans plus future major expenses plus residual income-replacement corpus. A simpler proxy is 10-15x annual income for a primary breadwinner with dependents. Most Indian families are dramatically under-insured; buying ₹50 lakh when ₹2 crore is appropriate is one of the most common — and most consequential — financial mistakes. Term insurance is cheap; the marginal premium for additional cover is small at ages 25-45. Second, the policy term. Choose a term that covers your earning years until self-sufficient retirement corpus accumulation. For most working professionals, a term ending at age 65-70 is appropriate. Beyond that age, the family\'s reliance on the insured\'s future income has diminished, and the children are typically self-supporting. Buying term cover beyond age 70 is usually unnecessary and the premiums rise sharply. Third, the riders. The most useful riders to evaluate: Critical Illness rider (lump sum on diagnosis of specified illnesses — though a separate Critical Illness policy is often more cost-effective), Accidental Death Benefit (additional payout on death by accident), Waiver of Premium on Disability (insurer pays remaining premiums if insured becomes disabled). Pure term-without-riders is the cleanest baseline; riders add cost and complexity that may or may not be justified depending on individual circumstances. On insurer selection, the key metric is the Claim Settlement Ratio (CSR) — published by IRDAI annually. CSR above 95% indicates that the insurer settles 95+% of claims received. Insurers below 90% should be avoided. Other considerations: insurer\'s claim-experience for online-purchased policies (some insurers settle online policies less reliably than agent-sold), insurer\'s solvency ratio (regulatory minimum 1.5x), and insurer\'s reputation for transparency at claim time. Trustner Insurance Brokers maintains comparative data across all major insurers and recommends based on a balanced view of premium, CSR, and operational reliability.',
        realLifeExample:
          'Vikram, 32, a Delhi-based business consultant earning ₹14 lakh per annum, has wife (homemaker), one child age 4, and a home loan of ₹35 lakh. He needs term insurance. Calculation: home loan ₹35 lakh + child\'s education and marriage corpus need ₹40 lakh + family income replacement corpus need ₹80 lakh (to generate ₹4-5 lakh per year sustainably) = total ₹1.55 crore. He buys a ₹1.5 crore term plan with 33-year tenure (covering until age 65). Annual premium at age 32 from a top-rated insurer: approximately ₹15,000-18,000 per year (depending on insurer and rider choices). Across the 33-year term, total premium paid would be approximately ₹5-6 lakh. If he dies at any point during the term, the family receives ₹1.5 crore — meaningfully more than 25x the cumulative premium. If he survives the term (most likely case), the premium is the cost of protection, similar to other types of insurance. He chooses to add a Waiver of Premium on Disability rider (₹500/year extra) and skips the Critical Illness rider in favour of a separate Critical Illness policy (more cost-effective). This is a textbook term-insurance buy.',
        keyPoints: [
          'Term insurance is pure protection: premium for cover, no maturity benefit.',
          'Three decisions: sum assured, policy term, riders.',
          'Sum assured: 10-15x annual income for primary breadwinner with dependents (or needs-based calculation).',
          'Policy term: cover earning years until age 65-70 typically.',
          'Riders: useful but optional — pure term-without-riders is cleanest baseline.',
          'Claim Settlement Ratio (CSR) >95% is critical when selecting insurer.',
          'Trustner Insurance Brokers compares across all major insurers — insurer-agnostic recommendations.',
        ],
        faq: [
          {
            question: 'Should I buy term insurance online or through an agent?',
            answer:
              'Online policies are usually 15-25% cheaper than agent-sold policies (no agent commission). However, ensure (a) the insurer has a strong online-policy claim track record, and (b) you complete medical underwriting fully and disclose all health information accurately — incomplete disclosure during online purchase is the leading cause of claim rejection. Trustner Insurance Brokers can assist with the application even for online policies, ensuring proper disclosure and choosing the right insurer for your profile.',
          },
          {
            question: 'Is "Return of Premium" term insurance worth it?',
            answer:
              'Generally no. Return-of-Premium term plans charge 2-3x the premium of pure term, in exchange for "returning" your premiums if you survive the term. Mathematically, this is a poor trade — you are effectively earning a 4-5% IRR on the extra premium, far below mutual fund SIP returns. Buy pure term and invest the saved premium in mutual funds; the wealth accumulated is materially higher.',
          },
          {
            question: 'Can I increase my term cover later if my income grows?',
            answer:
              'Some insurers offer "Cover Increase" options that allow you to increase sum assured at major life events (marriage, child birth, home purchase) without fresh medical underwriting. This is useful for younger applicants who expect future income growth. Alternatively, buy additional term policies as your income grows — premiums will be higher at older ages but the marginal cost is still acceptable. The mistake to avoid: postponing term insurance until you "have enough income" — premiums rise sharply with age, and you may become uninsurable if a health event intervenes.',
          },
          {
            question: 'I smoke. How much higher is my term insurance premium?',
            answer:
              'Smokers pay approximately 50-80% higher premium than non-smokers for the same cover. Concealing smoking status during application is a serious risk — insurers test for nicotine in medical underwriting, and concealment is grounds for claim rejection. Always declare smoking honestly. The premium increase reflects genuine higher mortality risk; the math still works in favour of buying term. If you quit smoking, after 2-3 years of confirmed non-smoking you can apply for premium reduction (some insurers offer this).',
          },
        ],
        mcqs: [
          {
            question: 'A 32-year-old breadwinner with ₹14 lakh annual income should typically aim for term cover of approximately:',
            options: ['₹25-50 lakh', '₹1.5-2 crore', '₹5-10 crore', 'No term cover needed'],
            correctAnswer: 1,
            explanation:
              'A 10-15x annual income guideline suggests ₹1.4-2.1 crore for a ₹14 lakh annual income. The exact number should be needs-based (loans + future expenses + income replacement corpus), but ₹1.5-2 crore is the appropriate range for most Indian primary breadwinners at this income level.',
          },
          {
            question: 'The most important metric to check when selecting a term insurance provider is:',
            options: [
              'Brand recognition',
              'Claim Settlement Ratio (CSR)',
              'Office location',
              'Marketing campaigns',
            ],
            correctAnswer: 1,
            explanation:
              'Claim Settlement Ratio (CSR) — published annually by IRDAI — is the most important metric. CSR above 95% indicates the insurer reliably settles claims; insurers below 90% should be avoided. The premium difference between top-CSR and bottom-CSR insurers is small relative to the value of reliable claim settlement.',
          },
          {
            question: 'Return-of-Premium term insurance:',
            options: [
              'Is the best form of term insurance',
              'Charges 2-3x the premium of pure term and is generally a poor trade-off',
              'Is required by IRDAI',
              'Has no charges',
            ],
            correctAnswer: 1,
            explanation:
              'Return-of-Premium term plans charge 2-3x the premium of pure term to "return" premiums on survival. Mathematically this is a 4-5% IRR on the extra premium — well below alternative mutual fund returns. Pure term + mutual fund investment is structurally superior.',
          },
        ],
        summaryNotes: [
          'Term insurance = pure protection, no maturity benefit, lowest cost per ₹ of cover.',
          'Sum assured: 10-15x annual income or needs-based calculation.',
          'Policy term: until age 65-70 typically.',
          'CSR >95% is critical when selecting insurer.',
          'Avoid Return-of-Premium and most riders; pure term + MF is structurally superior.',
        ],
        relatedTopics: ['why-insurance', 'health-insurance-essentials', 'ulip-honest-view'],
      },
    },

    {
      id: 'health-insurance-essentials',
      title: 'Health Insurance — Family Floater, Sum Assured, Top-Up',
      slug: 'health-insurance-essentials',
      content: {
        definition:
          'Health insurance reimburses or directly pays the hospital for medical expenses incurred during hospitalisation, day-care procedures, and (under some plans) outpatient treatment. The annual premium is paid in exchange for the insurer\'s commitment to cover qualifying medical expenses up to the sum assured. Indian health insurance comes in three main forms: Family Floater (single sum assured shared across family members), Individual (separate sum assured per member), and Top-Up / Super Top-Up (additional cover above a deductible threshold).',
        explanation:
          'Three decisions matter when buying health insurance. First, the sum assured. Indian medical inflation runs 12-15% annually — far above general CPI. A typical mid-tier private hospital admission for serious illness today costs ₹3-15 lakh; major surgery or extended ICU can exceed ₹25 lakh. The right family sum assured for most middle-class families is ₹10-25 lakh as the base coverage, with additional Top-Up of ₹50 lakh-₹1 crore beyond a deductible. Buying ₹3 lakh family floater (a common starter choice) is dramatically inadequate today and should be upgraded as a priority. Second, the structure. For most families, a Family Floater policy is the most cost-efficient — single sum assured shared across self, spouse, children. Premium for a family of four (2 adults age 35-40, 2 children) for ₹15 lakh sum assured is typically ₹15,000-25,000 per year, depending on insurer and city. The risk of a Family Floater is that if multiple members need hospitalisation in the same year, the sum assured may be exhausted by one large claim. The mitigation is adding a Top-Up policy: a Super Top-Up with ₹50 lakh sum assured above a ₹5 lakh deductible costs only ₹4,000-7,000 per year. Combined: ₹15 lakh base + ₹50 lakh top-up = ₹65 lakh available cover for ~₹22,000-30,000 annual premium for the family. Third, the policy features. Critical features to verify: (a) Pre-Existing Disease (PED) waiting period — typically 2-4 years; the shorter the better; (b) Room Rent capping — avoid sub-limits ("1% of sum assured per day") which restrict you to lower-tier rooms during admission; the better policies have no room-rent capping; (c) Co-payment — some policies impose 10-20% co-payment on claims, particularly for senior citizens; avoid where possible; (d) Network hospitals — verify that the insurer\'s network includes the leading hospitals in your city for cashless admission; (e) Claim Settlement Ratio and Incurred Claims Ratio — published by IRDAI; (f) Cumulative Bonus / No-Claim Bonus — many insurers increase the sum assured by 10-50% per claim-free year, often a meaningful long-term benefit. The mistake to avoid: focusing only on premium. The cheapest policy is rarely the right choice — the difference between a ₹20,000 and ₹28,000 annual premium for the same ₹15 lakh sum assured may reflect material differences in room-rent capping, sub-limits, and claim-settlement experience. Always compare like-for-like across features, not just headline premium.',
        realLifeExample:
          'Take Rahul, 38, IT manager in Hyderabad, with wife (33) and two children (8 and 4). He buys: (a) Family Floater ₹15 lakh sum assured from a top-rated insurer, premium ₹19,000/year; (b) Super Top-Up ₹50 lakh above ₹5 lakh deductible, premium ₹4,500/year. Total annual premium: ₹23,500. Total cover available: ₹65 lakh in any single policy year. Both policies have no room-rent capping, no sub-limits on major procedures, 3-year PED waiting (he discloses parental diabetes upfront), and good network hospital coverage in Hyderabad. Two years later, his father-in-law (covered separately) and child both have hospitalisation events totalling ₹4.5 lakh — well within the Family Floater alone. The ₹50 lakh top-up provides peace of mind for a major event (heart surgery, cancer, multi-week ICU). At his current age, his Cumulative Bonus has grown the sum assured from ₹15 lakh to ₹18 lakh (20% per claim-free year, capped), without any premium increase beyond the standard age-band adjustment. This is the textbook health insurance posture for an Indian middle-class family.',
        keyPoints: [
          'Indian medical inflation 12-15% annually — current adequate cover ≥₹15 lakh + top-up.',
          'Family Floater is most cost-efficient for couples and young families.',
          'Top-Up / Super Top-Up adds large cover above a deductible at very low premium.',
          'Critical features: no room-rent capping, no sub-limits, short PED waiting, no co-pay.',
          'Network hospital coverage in your city is essential for cashless admission.',
          'Claim Settlement Ratio and Incurred Claims Ratio (IRDAI) are key insurer metrics.',
          'Cumulative Bonus increases sum assured per claim-free year — meaningful long-term benefit.',
        ],
        faq: [
          {
            question: 'Should I rely on my employer health insurance or buy my own?',
            answer:
              'Buy your own. Employer cover is contingent on continued employment — if you change jobs, are laid off, or retire, the cover lapses immediately. Buy individual or family floater health insurance early in your career (premium is lower at younger ages and PED waiting is completed by the time you actually need claims at older ages). Employer cover should be supplementary, not primary.',
          },
          {
            question: 'Are Pre-Existing Diseases a problem for health insurance?',
            answer:
              'PEDs are not deal-breakers but require disclosure and acceptance of waiting periods. Standard waiting period is 2-4 years (shorter is better). Failing to disclose PEDs at application is the most common cause of claim rejection. Disclose honestly; the insurer\'s underwriting may add a small premium loading or accept the policy with standard PED waiting. This is dramatically better than non-disclosure leading to claim rejection later.',
          },
          {
            question: 'When should I increase my health insurance sum assured?',
            answer:
              'Most families should review and increase sum assured every 3-5 years to keep up with medical inflation. A ₹10 lakh policy bought 5 years ago has materially less purchasing power today. Top-up policies are the most cost-efficient way to add cover — adding ₹25-50 lakh above the base policy costs only ₹3,000-7,000 per year. Trustner Insurance Brokers conducts annual review meetings to recommend cover adjustments.',
          },
          {
            question: 'What is the difference between Top-Up and Super Top-Up?',
            answer:
              'A Top-Up requires the deductible to be met by a single claim in the policy year. A Super Top-Up aggregates multiple claims toward the deductible — once the cumulative claims in a policy year exceed the deductible threshold, the Super Top-Up kicks in. Super Top-Up is materially more useful for families with multiple potential claimants (parents, children, self). Always prefer Super Top-Up over Top-Up at similar premium.',
          },
        ],
        mcqs: [
          {
            question: 'Indian medical inflation runs at approximately:',
            options: ['2-3% annually', '5-7% annually', '12-15% annually', '25-30% annually'],
            correctAnswer: 2,
            explanation:
              'Indian medical inflation runs 12-15% annually — far above general CPI. This is why health insurance sum assured needs to be reviewed and increased periodically (every 3-5 years) to maintain real purchasing power.',
          },
          {
            question: 'A Family Floater policy means:',
            options: [
              'Each family member has separate sum assured',
              'Single sum assured shared across all family members',
              'Cover only for senior citizens',
              'Cover only for children',
            ],
            correctAnswer: 1,
            explanation:
              'A Family Floater policy provides a single sum assured shared across all covered family members. It is the most cost-efficient structure for couples and young families. The risk — that one large claim could exhaust the sum assured for all members — is typically mitigated by a Top-Up or Super Top-Up policy.',
          },
          {
            question: 'For a family of four, an adequate health insurance cover today is approximately:',
            options: ['₹3 lakh family floater', '₹15 lakh + ₹50 lakh Super Top-Up', '₹50,000 per person', 'No cover needed'],
            correctAnswer: 1,
            explanation:
              'Given Indian medical inflation and current hospitalisation costs, ₹15 lakh family floater + ₹50 lakh Super Top-Up (combined ~₹65 lakh) is an adequate baseline for most middle-class families. Total annual premium for this combination is typically ₹20,000-30,000.',
          },
        ],
        summaryNotes: [
          'Indian medical inflation 12-15% annually — review cover every 3-5 years.',
          'Family Floater + Super Top-Up = cost-efficient combo.',
          'Critical features: no room-rent capping, no sub-limits, short PED waiting, no co-pay.',
          'Disclose PEDs honestly; non-disclosure = claim rejection.',
          'Buy your own — do not rely solely on employer cover.',
        ],
        relatedTopics: ['why-insurance', 'term-insurance-essentials', 'critical-illness-essentials'],
      },
    },

    {
      id: 'critical-illness-essentials',
      title: 'Critical Illness Cover — Why It\'s Different From Health Insurance',
      slug: 'critical-illness-essentials',
      content: {
        definition:
          'A Critical Illness (CI) policy pays a lump sum to the insured upon first diagnosis of any of the specified critical illnesses listed in the policy — typically including cancer, heart attack, stroke, kidney failure, organ transplant, paralysis, and others. Unlike health insurance which reimburses medical expenses, the CI lump sum is paid directly to the insured (not the hospital) and can be used for any purpose — medical bills, income replacement during recovery, lifestyle adjustments, or family financial support.',
        explanation:
          'Critical illness cover addresses a financial gap that health insurance does not solve. A serious illness — Stage 3 cancer, major heart attack, stroke — can cost ₹15-50 lakh in direct medical expenses (mostly covered by health insurance), but it can ALSO cost: 6-24 months of lost income during treatment and recovery (₹10-50 lakh depending on income); home modifications for disability or extended care (₹2-10 lakh); lifestyle changes including dietary, household help, transportation costs (₹2-5 lakh per year ongoing). The total non-medical financial impact of a critical illness can be ₹20-75 lakh — an amount that health insurance does not address at all. CI lump sum bridges this gap. Sum assured of ₹25-50 lakh is the typical recommended range for a primary breadwinner; double-income couples often have ₹15-25 lakh each. The sum is paid in full on first diagnosis (subject to policy-specific definitions and survival period — typically 14-30 days after diagnosis). It is NOT contingent on medical expense levels, so it can be deployed flexibly — used to settle medical bills not covered by health insurance, to cover months of lost income, or to support the family. Three CI policy variants exist. A Standalone Critical Illness policy is dedicated CI cover, typically with 25-30 specified illnesses. A Critical Illness Rider on a term plan adds CI to the term insurance — usually cheaper than standalone but with more restrictive conditions (rider may pay only on death, or cap the CI payout). A Comprehensive Critical Illness policy bundles CI with a few additional benefits (hospital cash, income protection on disability). For most Indian families, a standalone Critical Illness policy with ₹25 lakh sum assured at ₹5,000-12,000 per year (depending on age and insurer) is the right fit. The marginal cost is small relative to the protection delivered. Indian families increasingly recognise the importance of CI — uptake has grown materially in 2024-2026 — but it remains under-purchased relative to need. Trustner Insurance Brokers typically includes CI cover discussion in every protection-planning conversation.',
        realLifeExample:
          'Anita, a 42-year-old chartered accountant in Mumbai, is diagnosed with breast cancer (Stage 2) in early 2026. Total treatment cost over 12 months: surgery ₹5 lakh, chemotherapy ₹8 lakh, radiation ₹3 lakh, follow-up scans ₹2 lakh — ₹18 lakh total medical expense, fully covered by her ₹15 lakh family floater + ₹50 lakh Super Top-Up. Beyond the medical bills, she loses 9 months of income — at her ₹2 crore annual income, that\'s ₹15 lakh of lost earnings. Her husband takes 3 months of unpaid leave to support her — another ₹6 lakh of family income loss. Home modifications, household help, and lifestyle adjustments cost an additional ₹4 lakh over the recovery year. Total non-medical financial impact: ₹25 lakh. Without a CI policy, this would have come from her family\'s savings and investments — depleting her retirement corpus. With her ₹35 lakh CI policy purchased 3 years prior at ₹9,500 annual premium, she received the full ₹35 lakh lump sum on diagnosis (after the 30-day survival period). The lump sum covered all non-medical financial impact and left ₹10 lakh as a buffer. Total premium paid over 3 years: ₹28,500. Cover received: ₹35 lakh. Cost-of-protection-vs-impact ratio: dramatically favourable.',
        keyPoints: [
          'Critical Illness pays a lump sum on diagnosis of specified illnesses, regardless of medical expenses.',
          'Addresses non-medical financial impact: lost income, home modifications, lifestyle changes.',
          'Recommended sum assured: ₹25-50 lakh for primary breadwinners.',
          'Three variants: Standalone CI, CI Rider on term, Comprehensive CI bundles.',
          'Standalone CI typically the cleanest — ₹25 lakh at ₹5,000-12,000 annual premium.',
          'Survival period (typically 14-30 days post-diagnosis) is a standard policy feature.',
          'Indian uptake has grown materially in 2024-2026 but remains under-purchased relative to need.',
        ],
        faq: [
          {
            question: 'How is Critical Illness different from health insurance?',
            answer:
              'Health insurance reimburses medical expenses (paid to the hospital or via cashless network). CI pays a lump sum on diagnosis directly to the insured, regardless of actual medical expense. Health insurance addresses medical bills; CI addresses the broader financial impact of a serious illness — lost income, home modifications, lifestyle changes. The two are complementary, not substitutes. Most Indian families need both.',
          },
          {
            question: 'How many illnesses should my CI policy cover?',
            answer:
              'Most quality CI policies cover 25-30 illnesses including cancer, heart attack, stroke, kidney failure, paralysis, organ transplant, multiple sclerosis, and others. The specific covered list and the policy\'s definitions matter — a policy that lists "cancer" but defines it narrowly to exclude Stage 1 or 2 may be substantially less useful. Always read the definitions carefully. Trustner Insurance Brokers maintains comparative definition data and recommends accordingly.',
          },
          {
            question: 'Can I claim CI multiple times during the policy term?',
            answer:
              'Standard CI policies pay once and the policy terminates upon claim. Some advanced policies offer "Multi-Claim Critical Illness" where the policy continues after a first-stage diagnosis pays partially, with subsequent claims for unrelated illnesses possible. These are more expensive and the trade-off should be evaluated. For most families, a single-claim CI policy with adequate sum assured is sufficient.',
          },
          {
            question: 'My health insurance covers ₹50 lakh. Do I still need CI?',
            answer:
              'Yes. Health insurance covers medical expenses; CI covers the broader financial impact of illness — lost income during treatment (often ₹10-30 lakh), home modifications, lifestyle adjustments. These are not addressed by health insurance. A CI policy of ₹25-35 lakh provides the income-replacement and lifestyle buffer that health insurance does not.',
          },
        ],
        mcqs: [
          {
            question: 'Critical Illness insurance pays:',
            options: [
              'Reimburses medical expenses to hospital',
              'A lump sum on diagnosis of specified illnesses',
              'Monthly income for life',
              'Only on death',
            ],
            correctAnswer: 1,
            explanation:
              'Critical Illness insurance pays a lump sum to the insured on first diagnosis of specified critical illnesses (subject to a survival period). The lump sum is paid regardless of actual medical expenses and can be used flexibly — for medical bills, lost income, lifestyle adjustments, or family support.',
          },
          {
            question: 'Recommended Critical Illness sum assured for a primary breadwinner is approximately:',
            options: ['₹2-5 lakh', '₹25-50 lakh', '₹5-10 crore', 'Not needed if health insurance is in place'],
            correctAnswer: 1,
            explanation:
              'For a primary breadwinner, ₹25-50 lakh CI sum assured is the typical recommended range. This reflects the non-medical financial impact of a serious illness: 6-24 months of lost income, home modifications, and lifestyle adjustments, which can total ₹20-75 lakh.',
          },
          {
            question: 'Critical Illness insurance is:',
            options: [
              'A substitute for health insurance',
              'Complementary to health insurance, addressing different financial gaps',
              'Required by law',
              'Only for senior citizens',
            ],
            correctAnswer: 1,
            explanation:
              'Critical Illness insurance is complementary to health insurance, not a substitute. Health insurance covers medical expenses; CI covers the broader financial impact of a serious illness (lost income, home modifications, lifestyle changes). Most Indian families need both.',
          },
        ],
        summaryNotes: [
          'CI = lump sum on diagnosis of specified illnesses; flexible use.',
          'Addresses non-medical financial impact: lost income, lifestyle, home modifications.',
          'Recommended sum assured: ₹25-50 lakh for primary breadwinners.',
          'Standalone CI typically cleanest — ₹5,000-12,000 annual premium for ₹25 lakh.',
          'Complementary to health insurance, not a substitute.',
        ],
        relatedTopics: ['why-insurance', 'health-insurance-essentials', 'term-insurance-essentials'],
      },
    },

    {
      id: 'ulip-honest-view',
      title: 'ULIPs and Endowment — An Honest Broker\'s View',
      slug: 'ulip-honest-view',
      content: {
        definition:
          'A Unit Linked Insurance Plan (ULIP) bundles life insurance with market-linked investment in a single product. An Endowment policy combines life insurance with a guaranteed maturity benefit. Both products charge significantly higher costs than separating insurance from investment ("buy term + invest the difference"), and for the vast majority of Indian families, the structurally inferior outcome — both lower insurance cover and lower investment returns — is the result.',
        explanation:
          'Indian insurance distribution has historically been heavily incentivised toward selling ULIPs and Endowment because these products pay distributors first-year commissions of 10-30% (versus 1-2% on term insurance). The result has been a generation of Indian families who own large quantities of ULIP and Endowment with negligible insurance cover and mediocre investment outcomes. The structural problem is the cost stack. A typical ULIP charges: (a) Premium Allocation Charge (5-10% of premium in early years, declining over time); (b) Mortality Charge (the actual cost of the insurance, typically ₹1,500-3,000 per year per ₹1 lakh of cover, depending on age); (c) Fund Management Charge (1-1.35% of fund value per year, similar to mutual fund); (d) Policy Administration Charge (₹100-500 per month, sometimes increasing with policy duration); (e) Various other charges (switching, partial withdrawal, surrender). Net of all charges, the IRR on a typical ULIP after 10-15 years is 5-7%. Compare this to a buy-term-and-invest-the-difference approach: ₹50,000 annual premium ULIP delivers ₹5-10 lakh life cover at 5-7% IRR; the same ₹50,000 split as ₹15,000 term premium for ₹1 crore cover plus ₹35,000 SIP into a multi-cap mutual fund at 12% IRR delivers materially superior outcomes — 10x the insurance cover and ~₹50-70 lakh more wealth at the 20-year mark. Endowment policies have similar dynamics with an additional dimension: the "guaranteed maturity benefit" is typically priced at 4-6% IRR — competitive with bank fixed deposits but well below mutual funds for long horizons. The exception cases where ULIP or Endowment may make sense: (a) investors with absolutely no investment discipline who will not maintain a separate SIP — for them, the inferior outcome of a forced product may still beat the worse outcome of no investment at all; (b) very specific tax-planning situations where the Section 10(10D) maturity exemption becomes valuable (this exemption was tightened materially post-2021 and now applies only when annual premium does not exceed ₹2.5 lakh); (c) specialised structures (Single Premium endowment for known short-horizon needs, NPS-replacement Pension ULIPs in some specific cases). For 95%+ of Indian families, however, the answer is simple: buy a separate term plan, buy a separate health and CI policy, invest the rest in mutual funds. Trustner Insurance Brokers explicitly does not push ULIPs or Endowment as a default recommendation; we discuss them only when specifically appropriate to the client\'s situation.',
        realLifeExample:
          'Compare two 30-year-old families investing ₹60,000 per year in protection-and-investment for 25 years. Family A buys a ULIP for the entire ₹60,000 — receives ₹6 lakh life cover and at 6% net IRR, ends with approximately ₹35 lakh corpus at age 55. Family B splits: ₹15,000 for ₹1 crore term insurance + ₹45,000 annual SIP into a flexi-cap mutual fund at 12% IRR (long-term post-tax) — ends with ₹1 crore life cover throughout the 25-year period and approximately ₹73 lakh corpus at age 55 (₹73 lakh in net post-tax wealth, calculated conservatively at 11.5% net for the SIP). Family B has ~17x more life cover during the 25 years AND ~2x the corpus at the end. The same ₹60,000 annual outflow, dramatically different outcomes. The mathematical case for "buy term + invest the difference" is unambiguous for disciplined investors. The exception — investors who genuinely will not maintain a separate SIP — should consider whether the inferior outcome of a ULIP is genuinely better than the alternative of no investment at all. For most Indian families, structured guidance and disciplined SIPs (not ULIPs) is the right answer. Trustner\'s Relationship Manager handles the discipline component through automatic SIP setup and quarterly reviews.',
        keyPoints: [
          'ULIPs combine insurance and investment with high stacked charges; net IRR typically 5-7%.',
          'Endowment offers guaranteed maturity at 4-6% IRR — competitive with FD, well below mutual funds for long horizons.',
          'Distributor incentives (10-30% first-year commission on ULIP/Endowment vs 1-2% on term) drive widespread mis-selling.',
          '"Buy term + invest the difference" delivers 10-20x more life cover AND 50-100% more wealth at retirement.',
          'Exceptions: investors with no investment discipline, specific tax-planning situations, specialised structures.',
          'Section 10(10D) maturity exemption tightened post-2021 — applies only when annual premium ≤ ₹2.5 lakh.',
          'Trustner\'s default recommendation: term + health + CI + mutual funds, not ULIPs.',
        ],
        faq: [
          {
            question: 'I already own a ULIP or Endowment. Should I surrender it?',
            answer:
              'Maybe — depends on the specific policy, surrender charges, and time elapsed. Generally: (a) if the policy is in early years (1-5) with high surrender charges, evaluate carefully — sometimes it is better to make the policy "paid-up" (stop paying further premiums but keep the small life cover) rather than surrender; (b) if the policy is past the high-charge years and 10+ years away from maturity, surrendering and redeploying into term + mutual funds is often financially superior; (c) if the policy is close to maturity (1-3 years), often best to hold to maturity. Trustner Insurance Brokers can run a personalised analysis comparing surrender-and-redeploy versus continue-and-hold for your specific policy.',
          },
          {
            question: 'What about ULIPs sold after the new regulations?',
            answer:
              'IRDAI has tightened ULIP regulations over the years, but the structural issue — high stacked charges that erode investment returns — remains. Even the "modern" ULIPs typically deliver IRR of 6-8% versus 11-12% for direct mutual fund investment over 15+ year horizons. The newer ULIPs are less egregious than older versions but still inferior to "buy term + invest the difference" for disciplined investors.',
          },
          {
            question: 'Why do agents push ULIPs so hard?',
            answer:
              'Because ULIP first-year commissions (10-30% of annual premium) are dramatically higher than term insurance commissions (1-2%). An agent\'s incentive structure rewards selling complex products. Trustner Insurance Brokers operates on a transparent broker model — we recommend based on client need and disclose any commission impact. Our Relationship Manager will explain the real cost of any product before recommending.',
          },
          {
            question: 'What about "Money-Back" policies?',
            answer:
              'Money-Back policies are a variant of Endowment that pays back a portion of the sum assured at periodic intervals during the policy term, with the balance plus bonus paid at maturity. They are heavily marketed as "regular income". Mathematically, they are equivalent to Endowment with higher cost — the periodic payouts are at low effective IRR. The same outcome can be achieved with much higher quality through SWP (Systematic Withdrawal Plan) from a balanced mutual fund. Money-Back policies are almost always inferior to alternatives.',
          },
        ],
        mcqs: [
          {
            question: 'Net IRR on a typical ULIP after 10-15 years is approximately:',
            options: ['12-14%', '5-7%', '20-25%', '0%'],
            correctAnswer: 1,
            explanation:
              'A typical ULIP delivers net IRR of 5-7% after all stacked charges (premium allocation, mortality, fund management, policy administration). This is materially below mutual fund alternatives (10-12% net) for long horizons.',
          },
          {
            question: '"Buy term + invest the difference" typically delivers:',
            options: [
              'Worse outcomes than ULIP',
              'Roughly equivalent outcomes to ULIP',
              '10-20x more life cover AND 50-100% more wealth at retirement',
              'Only useful for HNIs',
            ],
            correctAnswer: 2,
            explanation:
              '"Buy term + invest the difference" — splitting the same outflow between a low-cost term plan and mutual fund SIPs — typically delivers 10-20x the life cover (for the same premium budget) AND 50-100% more wealth at retirement (due to higher mutual fund net returns vs ULIP). This is the structurally superior approach for disciplined investors.',
          },
          {
            question: 'Distributor commissions on ULIPs vs term insurance differ by approximately:',
            options: [
              'Both same — IRDAI mandate',
              'ULIP 10-30% first-year vs Term 1-2%',
              'ULIP 1% vs Term 5%',
              'No commission on either',
            ],
            correctAnswer: 1,
            explanation:
              'ULIP first-year commissions are typically 10-30% of annual premium, while term insurance commissions are typically 1-2%. This commission differential creates a strong incentive for agents to push ULIPs over term insurance — a structural mis-selling driver in Indian insurance distribution.',
          },
        ],
        summaryNotes: [
          'ULIP/Endowment = bundled products with high stacked charges; structurally inferior outcomes.',
          'Net IRR on typical ULIP: 5-7%; Endowment: 4-6%.',
          '"Buy term + invest the difference" delivers 10-20x more cover AND 50-100% more wealth.',
          'Distributor commission differential drives mis-selling — Trustner does not push ULIPs by default.',
          'Exceptions exist (no-discipline investors, specific tax cases) but apply to <5% of families.',
        ],
        relatedTopics: ['why-insurance', 'term-insurance-essentials'],
      },
    },
  ],
};
