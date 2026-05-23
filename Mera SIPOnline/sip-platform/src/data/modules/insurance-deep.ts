import { LearningModule } from '@/types/learning';

export const insuranceDeepModule: LearningModule = {
  id: 'insurance-deep',
  title: 'Insurance — Deep Dive (Term, Health, Critical Illness)',
  slug: 'insurance-deep',
  icon: 'Heart',
  description:
    'An intermediate-level deep dive into the three protection products every Indian family needs. This module covers cover-sizing methodology, riders, claim settlement analytics, sub-limits and waiting periods, critical illness mechanics, and the tax architecture under Sections 80C, 80D and 10(10D) — at the level of detail an advisor needs to make insurer-agnostic recommendations.',
  level: 'intermediate',
  color: 'from-rose-700 to-red-600',
  estimatedTime: '45 min',
  track: 'insurance',
  sections: [
    {
      id: 'term-deep-dive',
      title: 'Term Insurance Deep Dive',
      slug: 'term-deep-dive',
      content: {
        definition:
          'Term insurance is a pure-risk life insurance contract under which the insurer pays a defined sum assured to the nominee on the death of the life insured during the policy term, with no maturity benefit if the insured survives the term. It is structurally the most efficient form of life cover because the premium funds only the mortality risk and a thin loading for expenses, with no investment component to dilute the cover-to-premium ratio.',
        explanation:
          'Sizing a term plan is the single most important decision in the protection plan. The four broad methodologies an advisor evaluates are (a) the income-replacement multiple — typically 15-20x annual gross income for a primary breadwinner in their 30s, scaling down with age as the residual earning years reduce; (b) the Human Life Value (HLV) approach mandated under IRDAI guidance, which discounts the future net contribution of the life insured to the family at an assumed real rate (typically 4-6%) over the residual working years; (c) the expense-replacement approach, which sizes a corpus that, deployed at a sustainable withdrawal rate, generates the family\'s ongoing expense obligation; and (d) the goal-and-debt approach, summing outstanding debt (home loan, education loan), specific future goals (children\'s higher education, marriage), and a residual income-replacement corpus. A defensible recommendation usually triangulates two or three of these. Riders modify the base contract: the Accidental Death Benefit rider doubles or triples the payout if death is by accident; the Permanent Disability rider waives future premiums and may pay an additional sum on total permanent disability; the Waiver of Premium rider waives future premiums on diagnosis of a critical illness or disability while keeping the cover in force; and the Critical Illness rider attaches a CI lump-sum to the term policy. Premium structures vary: level term keeps the sum assured constant; increasing term steps the cover up annually (typically 5-10%) to counter inflation; and return-of-premium term refunds premiums on survival but is usually 2-3x more expensive and rarely advisable. Premium payment terms include regular pay (premium payable across the full term), limited pay (premiums concentrated in the first 5-15 years), and single pay. Claim settlement ratio (CSR) — the proportion of claims paid by an insurer in a financial year as reported in the IRDAI Annual Report — is widely cited but should not be read in isolation; advisors look at three-year averages, claim repudiation reasons, average claim-processing time, and the insurer\'s solvency margin (regulatory minimum 1.5x). Tax treatment: premiums qualify for deduction under Section 80C up to ₹1.5 lakh aggregate, the death benefit is fully tax-free for the nominee under Section 10(10D), and GST is levied at 18% on the premium.',
        realLifeExample:
          'Consider Anjali, 38, a senior product manager in Bengaluru earning ₹32 lakh per annum. Husband earns ₹14 lakh, two children aged 8 and 5, outstanding home loan ₹65 lakh, planned education corpus ₹40 lakh per child. Income-replacement at 18x = ₹5.76 crore. Goal-and-debt build-up: home loan ₹65 lakh + education ₹80 lakh + 25-year expense corpus at ₹12 lakh per annum need = approximately ₹2 crore corpus, totalling ₹3.45 crore. The advisor recommends a ₹4 crore term plan with 25-year tenure, level cover, regular pay, with a Waiver-of-Premium rider and an Accidental Death rider. Annual premium approximately ₹38,000 (including 18% GST). She claims the premium under Section 80C (already largely consumed by EPF and ELSS, so the term premium is incremental but capped at the ₹1.5 lakh aggregate). On her death during the term, the ₹4 crore is paid tax-free to her nominee under Section 10(10D), with the rider topping up by ₹50 lakh in case of accidental death. Total annual cost: ~1.2% of household income for ₹4 crore of protection — a structurally efficient outcome.',
        keyPoints: [
          'Sizing methodologies: 15-20x income multiple, HLV, expense-replacement, goal-and-debt — triangulate two or more.',
          'Riders to evaluate: Accidental Death Benefit, Permanent Disability, Waiver of Premium, Critical Illness.',
          'Level term is the default; return-of-premium is usually inefficient at 2-3x the level-term cost.',
          'Limited-pay structures concentrate premium into earning years but raise per-year outflow — useful for a defined retirement timeline.',
          'Claim Settlement Ratio is necessary but not sufficient — review three-year averages, repudiation reasons, and solvency margin.',
          'Section 80C deduction up to ₹1.5 lakh aggregate; Section 10(10D) fully tax-free death benefit; 18% GST on premium.',
          'Disclose all material facts at proposal stage — non-disclosure is the single largest cause of claim repudiation.',
        ],
        faq: [
          {
            question: 'Should one choose level term or increasing term?',
            answer:
              'For most Indian households, level term is appropriate when the sum assured is sized adequately at the outset (factoring in inflation over the term). Increasing term is appropriate where the policyholder cannot afford the full sum assured today and wants to step it up over time, but it is materially more expensive. The Trustner team typically prefers a larger level term plan today over a smaller increasing-term plan.',
          },
          {
            question: 'How important is the Claim Settlement Ratio when picking an insurer?',
            answer:
              'The CSR is one input, not the only one. Advisors look at the three-year average rather than a single year, the claim-repudiation reasons (most repudiations are for non-disclosure rather than insurer behaviour), the average claim-processing time, and the insurer\'s solvency margin. An insurer with a 98% CSR but slow processing and weak solvency may be a worse choice than one at 96% with strong service metrics.',
          },
          {
            question: 'Is a Waiver-of-Premium rider worth the additional cost?',
            answer:
              'In most cases, yes. The rider waives all future premiums if the life insured suffers a permanent disability or, in some products, a listed critical illness, while keeping the full term cover in force. The premium loading is typically 5-10%, which is small relative to the protection it offers in a scenario where the insured\'s ability to pay future premiums is compromised.',
          },
          {
            question: 'Limited-pay or regular-pay term plan?',
            answer:
              'Regular-pay is the default and the cheapest in cumulative terms. Limited-pay (premiums concentrated in 5-15 years) suits individuals with a defined retirement age who want to be free of premium obligations post-retirement. The total nominal premium under limited-pay is higher, but no further outflow is required after the pay term. The advisor matches the structure to the policyholder\'s expected retirement timeline.',
          },
        ],
        mcqs: [
          {
            question: 'Under Section 10(10D) of the Income Tax Act, the death benefit on a term insurance policy is:',
            options: [
              'Taxable as income from other sources',
              'Taxable at the slab rate of the nominee',
              'Fully exempt from tax in the hands of the nominee',
              'Taxable only above ₹1 crore',
            ],
            correctAnswer: 2,
            explanation:
              'Section 10(10D) provides that the sum received under a life insurance policy, including the bonus thereon, is fully exempt from tax in the hands of the nominee on the death of the life insured, subject to the policy meeting the prescribed premium-to-sum-assured ratio.',
          },
          {
            question: 'A 35-year-old earning ₹20 lakh per annum with two dependents and a ₹50 lakh home loan is most appropriately advised to consider a sum assured of:',
            options: [
              '₹50 lakh (equal to the home loan)',
              '₹1 crore (5x annual income)',
              '₹3-4 crore (15-20x income plus debt and goals)',
              '₹10 crore irrespective of needs',
            ],
            correctAnswer: 2,
            explanation:
              'The triangulation approach (15-20x income multiple, plus debt clearance, plus goal funding, plus residual income corpus) leads to roughly ₹3-4 crore for this profile. Smaller covers leave the family materially under-protected.',
          },
          {
            question: 'Which of the following is NOT a generally recommended approach to sizing term insurance?',
            options: [
              'Human Life Value (HLV) approach',
              'Income-replacement multiple (15-20x)',
              'Buying the cheapest available premium regardless of cover',
              'Goal-and-debt build-up',
            ],
            correctAnswer: 2,
            explanation:
              'Sizing should be need-driven, not premium-driven. The cheapest premium often corresponds to an inadequate sum assured. The advisor first sizes the cover using HLV / income-multiple / goal build-up, then optimises premium across insurers for that sum assured.',
          },
        ],
        summaryNotes: [
          'Term insurance is the structurally most efficient form of life cover because the premium funds only mortality risk.',
          'Triangulate sizing using income multiple, HLV, expense replacement, and goal-and-debt build-up.',
          'Evaluate riders individually: Waiver of Premium and Accidental Death Benefit are commonly value-additive.',
          'Three-year average Claim Settlement Ratio matters more than a single annual figure.',
          'Section 80C deduction up to ₹1.5 lakh; Section 10(10D) tax-free death benefit; 18% GST on premium.',
          'Limited-pay suits a defined retirement timeline; regular-pay is the cheapest cumulative structure.',
        ],
        relatedTopics: ['why-insurance', 'health-deep-dive', 'critical-illness-pa', 'insurance-tax-riders'],
      },
    },
    {
      id: 'health-deep-dive',
      title: 'Health Insurance Deep Dive',
      slug: 'health-deep-dive',
      content: {
        definition:
          'Health insurance — known in IRDAI parlance as a hospitalisation indemnity policy — reimburses or directly pays the policyholder\'s hospitalisation expenses, subject to the sum insured, sub-limits, waiting periods, and policy terms. It is the protection product with the highest annual frequency of use for Indian families and the product where structural details (sub-limits, room-rent capping, copay, waiting periods) materially change the realised payout in a claim event.',
        explanation:
          'Sum-insured determination is the starting point. For Tier-1 metro residents (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Kolkata), the advisor typically recommends ₹10-25 lakh on an individual basis or ₹25 lakh+ on a family floater, often layered with a super top-up of ₹50 lakh-₹1 crore that activates above a defined deductible (typically ₹5-10 lakh). The super top-up is structurally efficient because it provides high overall cover at a fraction of the premium of a single large base policy. Sub-limits and capping are the most common claim-trap. A room-rent sub-limit (e.g., 1% of sum insured per day) caps not just the room charges but, under proportionate-deduction clauses, scales down every other charge in the bill in the same proportion — meaning a ₹5 lakh hospitalisation can settle as ₹3 lakh paid and ₹2 lakh out-of-pocket, even within a ₹10 lakh sum insured. Disease-specific sub-limits (cataract, knee replacement, hernia) cap the maximum reimbursable for that procedure. Copay clauses (typically 10-20%) shift a proportion of every claim to the policyholder. Pre-existing disease (PED) waiting periods historically ran 36-48 months but are trending shorter, with several IRDAI-approved products now offering 24-month or even 12-month PED waits. Specific-disease waiting periods (typically 24 months) apply to procedures the insurer expects to be elective. Maternity waiting is typically 24-48 months, with sub-limits on delivery and newborn cover. Restoration benefits reinstate the sum insured if it is exhausted in the policy year — useful for multi-claim families. No-Claim Bonus (NCB) increases the sum insured by 10-50% per claim-free year up to a ceiling (typically 100-200% of the base sum insured). Cashless claims occur at network hospitals via a Third-Party Administrator (TPA) pre-authorisation; reimbursement claims occur at non-network hospitals where the policyholder pays first and submits documents. The IRDAI publishes claim settlement data annually for health insurers, including incurred claim ratios and average claim-processing times. Modular plans allow the policyholder to add or drop specific covers (OPD, maternity, dental); comprehensive plans bundle them. OPD coverage is an emerging trend with most insurers now offering an OPD module covering doctor consultations, diagnostics, and pharmacy.',
        realLifeExample:
          'Vikram, 41, Mumbai, software architect, family of four. Existing employer cover ₹5 lakh family floater. He buys an individual base policy of ₹15 lakh family floater (premium ₹28,000 per annum) layered with a ₹50 lakh super top-up at a ₹10 lakh deductible (premium ₹9,000 per annum). Total annual outflow ₹37,000 for ₹65 lakh of effective family cover. Eighteen months later, his daughter is hospitalised for a complex paediatric procedure costing ₹14 lakh. The base policy of ₹15 lakh covers the entire ₹14 lakh as cashless at a network hospital. The super top-up does not trigger because the claim is below the ₹10 lakh deductible — but it remains intact for any future event. Had he relied only on the employer ₹5 lakh, the family would have funded ₹9 lakh out of savings or borrowing. Two key structural details made the difference: an adequately sized base policy (₹15 lakh, not ₹5 lakh) and absence of a punitive room-rent sub-limit on the chosen product, which the advisor flagged at proposal stage. He claims the ₹37,000 premium under Section 80D — within the ₹25,000 self/family limit and the additional ₹50,000 senior-parent limit if his parents are also covered.',
        keyPoints: [
          'Tier-1 metro family floater: ₹15-25 lakh base + ₹50 lakh-₹1 crore super top-up is structurally efficient.',
          'Room-rent sub-limit triggers proportionate-deduction across the entire bill — read the fine print.',
          'Pre-existing disease waiting period typically 24-48 months; trending shorter to 12-24 months on newer products.',
          'Maternity, knee replacement, cataract typically have 24-48 month specific waiting periods.',
          'Restoration benefit and No-Claim Bonus materially expand effective cover — both should be present.',
          'Network hospital cashless mechanics differ from non-network reimbursement — verify the network in advance.',
          'Section 80D: ₹25,000 self/family + ₹50,000 senior-parent + ₹5,000 preventive health check-up.',
        ],
        faq: [
          {
            question: 'Why does the advisor recommend a base policy plus super top-up rather than a single large policy?',
            answer:
              'A super top-up provides high effective cover (₹50 lakh-₹1 crore) at a fraction of the premium of an equivalent single-policy structure, because the top-up only pays above a deductible and therefore prices for the lower-frequency, high-severity claim segment. The base policy covers high-frequency, low-severity events; the top-up covers the catastrophic tail. Combined, the structure delivers more total cover per rupee of premium.',
          },
          {
            question: 'How does a room-rent sub-limit affect a claim?',
            answer:
              'Most products with a room-rent cap apply a proportionate-deduction clause: if the policyholder books a room above the cap, every other charge in the hospital bill (doctor fees, nursing, surgery, ICU, consumables) is scaled down in the same proportion. A ₹5 lakh bill on a 1% sub-limit policy in a ₹10 lakh sum insured can settle as ₹3 lakh paid, ₹2 lakh out-of-pocket. Advisors prefer products without room-rent capping for Tier-1 city residents.',
          },
          {
            question: 'What is the typical waiting period for pre-existing diseases (PED)?',
            answer:
              'Historically 36-48 months, but IRDAI has encouraged shorter waits and several products now offer 24-month or 12-month PED periods, often with a small premium loading. The advisor evaluates the PED clause carefully when the policyholder has a known diagnosis and matches the product to the policyholder\'s health profile.',
          },
          {
            question: 'What is the difference between cashless and reimbursement?',
            answer:
              'In a cashless claim at a network hospital, the insurer (via the TPA) pre-authorises the treatment and settles directly with the hospital — the policyholder pays only non-covered items. In a reimbursement claim at a non-network hospital, the policyholder pays the bill upfront and submits documents to the insurer for post-discharge reimbursement, typically within 15-30 days. Cashless is preferred where available; the network list should be verified at proposal stage.',
          },
        ],
        mcqs: [
          {
            question: 'A health insurance policy has a 1% room-rent sub-limit on a ₹10 lakh sum insured. The policyholder books a room costing ₹15,000 per day. The proportionate-deduction clause typically:',
            options: [
              'Reduces only the room-rent component to ₹10,000 per day',
              'Has no effect because the sum insured is ₹10 lakh',
              'Scales down every other charge in the bill in the same proportion as the room-rent excess',
              'Is illegal under IRDAI guidelines',
            ],
            correctAnswer: 2,
            explanation:
              'The proportionate-deduction clause is a standard feature of room-rent-capped policies and scales down all associated charges (doctor fees, surgery, ICU, etc.) in the same ratio as the room-rent excess, materially reducing the realised payout.',
          },
          {
            question: 'A super top-up health policy primarily covers:',
            options: [
              'The first ₹1 lakh of any claim',
              'Aggregate annual claims above a defined deductible',
              'Only outpatient consultations',
              'Maternity expenses only',
            ],
            correctAnswer: 1,
            explanation:
              'A super top-up activates when aggregate annual claims (rather than a single claim, as in a regular top-up) exceed a defined deductible. This makes it suitable for layering above a base policy.',
          },
          {
            question: 'Section 80D allows a deduction for health insurance premium for self/spouse/dependent children up to:',
            options: ['₹15,000', '₹25,000', '₹50,000', '₹1,00,000'],
            correctAnswer: 1,
            explanation:
              'Section 80D allows a deduction of up to ₹25,000 for premium on self/spouse/dependent children (₹50,000 if any of them is a senior citizen), with an additional ₹50,000 for senior-citizen parents and ₹5,000 for preventive health check-up within the overall limit.',
          },
        ],
        summaryNotes: [
          'Size to ₹15-25 lakh base + super top-up of ₹50 lakh-₹1 crore for Tier-1 city residents.',
          'Avoid room-rent sub-limits — proportionate deduction can materially reduce realised payouts.',
          'PED waiting periods typically 24-48 months; specific-disease waits 24 months; maternity 24-48 months.',
          'Restoration and No-Claim Bonus expand effective cover at no additional premium cost.',
          'Verify the network hospital list at proposal stage; cashless is preferred where available.',
          'Section 80D: ₹25k self/family + ₹50k senior-parent + ₹5k preventive check-up within overall limit.',
        ],
        relatedTopics: ['term-deep-dive', 'critical-illness-pa', 'insurance-tax-riders', 'why-insurance'],
      },
    },
    {
      id: 'critical-illness-pa',
      title: 'Critical Illness & Personal Accident',
      slug: 'critical-illness-pa',
      content: {
        definition:
          'Critical Illness (CI) insurance is a defined-benefit contract under which the insurer pays a lump sum on the diagnosis of a listed illness (subject to a survival period clause), independent of actual medical expenditure. Personal Accident (PA) insurance is a defined-benefit contract under which the insurer pays defined sums for accidental death (AD), permanent total disability (PTD), permanent partial disability (PPD), and temporary total disability (TTD) arising out of an accident. Both are designed to complement, not replace, hospitalisation indemnity (health) insurance.',
        explanation:
          'Critical Illness products operate on a listed-disease basis. The list typically covers 30-50 conditions, with the most common being cancer of specified severity, myocardial infarction (heart attack) of specified severity, stroke resulting in permanent neurological deficit, kidney failure requiring regular dialysis, major organ transplantation, coronary artery bypass graft, and multiple sclerosis. Severity definitions are increasingly important: the older "first-event-only, full-payout" structure is giving way to staged-payout products that pay 25-50% of sum insured on early-stage diagnosis (e.g., carcinoma in situ) and the residual on advanced-stage diagnosis. The survival period clause requires the insured to survive a specified period after diagnosis — typically 30 days — for the claim to crystallise. CI complements health insurance because health is a reimbursement product capped at actual hospitalisation expenses, whereas CI pays a lump sum that the policyholder can deploy against income loss during treatment, lifestyle adjustments, alternative therapies not covered by health, or simply to clear debt and reduce financial pressure during recovery. A standalone CI plan or a CI rider on a term policy are the two main forms; the standalone plan typically allows higher cover and is recommended where the family has a meaningful family history. Personal Accident covers a different risk: accidental injury and death. The base structure pays the sum insured on accidental death, the same sum on permanent total disability (loss of both eyes, both limbs, paralysis), a graded percentage on permanent partial disability (loss of one eye, one limb, hearing), and a weekly benefit on temporary total disability (typically 1% of sum insured per week, capped at 104 weeks). Coverage multipliers for accidental death are typically 5-10x annual income. Standard exclusions include suicide, drug or alcohol-related accidents, hazardous activities (mountaineering, motor racing) unless specifically covered, and war risk. Occupational risk classification grades the policyholder by job risk — a desk-bound IT professional pays a fraction of the premium that an offshore-rig technician pays for the same sum insured. Premium economics: CI premium for a 35-year-old non-smoker on ₹25 lakh sum insured is typically ₹4,000-7,000 per annum; PA premium for the same individual on ₹50 lakh AD cover is typically ₹2,000-3,500 per annum.',
        realLifeExample:
          'Suresh, 44, Hyderabad, manufacturing operations head, earns ₹28 lakh per annum. His father had a heart attack at 58; family history is a material risk factor. Existing cover: term ₹2.5 crore, family floater health ₹15 lakh. The advisor recommends an additional standalone Critical Illness plan of ₹35 lakh covering 40 conditions with staged-severity payouts, premium ₹9,500 per annum, plus a Personal Accident plan of ₹1.2 crore covering AD, PTD, PPD and TTD with weekly benefit, premium ₹4,200 per annum. Three years later, Suresh is diagnosed with early-stage colon cancer (carcinoma in situ). The CI policy pays 25% of sum insured = ₹8.75 lakh on diagnosis (after the 30-day survival period). His health insurance covers the actual hospitalisation cost of ₹6.5 lakh. The ₹8.75 lakh CI lump sum funds his loss of income during the six-month treatment-and-recovery window, an alternative therapy module not covered by health, and a buffer against lifestyle adjustments. The remaining ₹26.25 lakh of CI cover stays in force for any subsequent advanced-stage diagnosis. The combined cost of CI + PA — ₹13,700 per annum — is roughly 0.5% of his income for materially expanded protection.',
        keyPoints: [
          'CI covers 30-50 listed conditions with severity-based staged payouts on newer products.',
          'Survival period clause typically 30 days from diagnosis for claim to crystallise.',
          'CI complements health insurance by funding income loss, lifestyle adjustments, and uncovered therapies.',
          'PA covers accidental death (AD), permanent total disability (PTD), permanent partial disability (PPD), and temporary total disability (TTD).',
          'Coverage multipliers for accidental death typically 5-10x annual income.',
          'Standard exclusions: suicide, drug/alcohol-related accidents, hazardous activities, war risk.',
          'Occupational classification materially affects PA premium — desk roles are charged less than field roles.',
        ],
        faq: [
          {
            question: 'Should the policyholder buy a standalone CI plan or a CI rider on the term policy?',
            answer:
              'A rider is simpler and slightly cheaper but typically caps cover at the term sum assured and may have a less comprehensive disease list. A standalone CI plan typically allows higher cover, more conditions, and severity-based staged payouts. Where the policyholder has a meaningful family history or wants higher cover, a standalone plan is preferred. Where the requirement is modest and bundling is convenient, a rider is acceptable.',
          },
          {
            question: 'How is critical illness different from health insurance?',
            answer:
              'Health insurance reimburses actual hospitalisation expenses up to the sum insured. Critical illness pays a lump sum on diagnosis of a listed condition, regardless of actual medical expenditure. The two are complementary: health funds the medical bill, CI funds the income loss, lifestyle adjustments, and uncovered therapies during the recovery window.',
          },
          {
            question: 'What does the 30-day survival period mean?',
            answer:
              'The survival period clause requires the insured to survive a specified period after the diagnosis (typically 30 days) for the CI claim to crystallise. If the insured dies within the survival period, the CI claim does not arise — though the term life policy, if any, would respond to the death. This is a structural limitation worth flagging at proposal stage.',
          },
          {
            question: 'Does Personal Accident insurance cover the same events as the Accidental Death rider on a term plan?',
            answer:
              'They overlap on accidental death but diverge on disability. A term policy\'s AD rider typically pays only on accidental death. A standalone PA policy adds permanent total disability, permanent partial disability, and temporary total disability covers — covering income loss during disability, which is not covered by either term or health. For policyholders in mobility-intensive roles or with high income volatility, PA is materially additive.',
          },
        ],
        mcqs: [
          {
            question: 'A typical critical illness policy has a survival period clause of:',
            options: ['No survival period', '30 days from diagnosis', '180 days from diagnosis', '365 days from diagnosis'],
            correctAnswer: 1,
            explanation:
              'Most critical illness policies require the insured to survive 30 days from the date of diagnosis for the claim to crystallise. If death occurs within this period, the CI claim does not arise.',
          },
          {
            question: 'Critical illness insurance complements health insurance because:',
            options: [
              'It pays the same hospital bill twice',
              'Health reimburses medical expenses, while CI pays a lump sum that funds income loss and uncovered costs',
              'CI replaces health insurance entirely',
              'CI covers outpatient consultations',
            ],
            correctAnswer: 1,
            explanation:
              'Health insurance is an indemnity product reimbursing actual hospitalisation expenses; CI is a defined-benefit lump sum on diagnosis. The lump sum funds income loss, lifestyle adjustments, and therapies not covered by health insurance.',
          },
          {
            question: 'Which of the following is typically NOT covered under a Personal Accident policy?',
            options: [
              'Accidental death from a road traffic accident',
              'Permanent disability from a workplace accident',
              'Death from natural causes (illness)',
              'Temporary total disability from an accident',
            ],
            correctAnswer: 2,
            explanation:
              'Personal Accident insurance covers events arising from an accident only — accidental death, permanent total disability, permanent partial disability, and temporary total disability. Death from natural causes (illness) is covered by life insurance (term), not PA.',
          },
        ],
        summaryNotes: [
          'CI is a defined-benefit lump-sum product on diagnosis of a listed condition; covers 30-50 conditions.',
          'Severity-staged payouts (early/mid/late) are the emerging product standard.',
          'Survival period clause typically 30 days; without surviving the period, no CI claim arises.',
          'PA covers AD, PTD, PPD and TTD arising from an accident — not from illness.',
          'PA premium varies materially by occupational risk classification.',
          'CI and PA together typically cost 0.4-0.7% of annual income for meaningful protection.',
        ],
        relatedTopics: ['term-deep-dive', 'health-deep-dive', 'insurance-tax-riders', 'why-insurance'],
      },
    },
    {
      id: 'insurance-tax-riders',
      title: 'Insurance Tax Treatment & Riders',
      slug: 'insurance-tax-riders',
      content: {
        definition:
          'The tax architecture of insurance in India sits at the intersection of three Income Tax Act provisions — Section 80C (deduction for life insurance premium), Section 80D (deduction for health insurance premium), and Section 10(10D) (exemption of life insurance proceeds) — together with Goods and Services Tax (GST) levied on the premium. The realised pre-tax-versus-post-tax cost of an insurance plan and the tax treatment of its proceeds materially affect the product\'s overall efficiency, and therefore form part of any defensible recommendation.',
        explanation:
          'Section 80C permits a deduction of up to ₹1.5 lakh per assessment year on premium paid for life insurance covering self, spouse, and any child (whether dependent or not, married or not). The deduction is subject to a premium-to-sum-assured ratio: for policies issued on or after 1 April 2012, the premium in any year must not exceed 10% of the sum assured for the deduction (and the corresponding 10(10D) exemption) to apply; for policies issued before that date, the limit was 20%. For policyholders with a disability under Section 80U or a specified disease under Section 80DDB, the limit is 15% from FY13 onwards. The 80C limit of ₹1.5 lakh is shared with EPF, PPF, ELSS, principal repayment of home loan, and other listed instruments — most salaried professionals exhaust the limit before considering insurance premium. Section 80D covers health insurance premium and applies separately from 80C. The structure: ₹25,000 deduction for premium on self, spouse, and dependent children (₹50,000 if any of them is a senior citizen aged 60+); an additional ₹50,000 for premium on parents who are senior citizens (₹25,000 if non-senior); and a sub-limit of ₹5,000 for preventive health check-up included within the overall 80D ceiling. The maximum aggregate 80D deduction available to a non-senior policyholder with senior parents is therefore ₹75,000 (₹25,000 + ₹50,000); for a senior policyholder with senior parents it is ₹1 lakh. Section 10(10D) exempts the proceeds of a life insurance policy — including bonuses and the maturity benefit — from tax in the hands of the recipient, subject to the 10%/20% premium-to-sum-assured ratio mentioned above. ULIPs receive special treatment under amendments effective FY21-22: where the aggregate annual premium across all ULIPs of an individual exceeds ₹2.5 lakh, the maturity proceeds become taxable as capital gains. Death proceeds remain exempt regardless. GST is levied on the premium itself: 18% on health insurance premium (with input tax credit available to businesses paying the premium for their employees), 18% on term insurance premium, and a mixed structure on life insurance with an investment component — typically 4.5% on the first-year premium and 2.25% on renewals for endowment products, and a higher composite rate for ULIPs computed on the loaded portion. The pre-tax-versus-post-tax comparison: a 30% slab taxpayer paying ₹20,000 health premium earns a tax saving of approximately ₹6,240 under 80D, reducing the effective post-tax premium to ₹13,760. Riders — Waiver of Premium, Accidental Death Benefit, Permanent Disability, Critical Illness — attach to a base policy and follow the tax treatment of the base policy: the rider premium qualifies for 80C if the rider attaches to a life policy, and rider proceeds are typically tax-free under 10(10D), subject to the same premium-to-sum-assured ratio applying to the bundled premium.',
        realLifeExample:
          'Take Priya, 36, salaried, 30% tax slab, in Mumbai. Annual financial outflows on insurance: term insurance premium ₹26,000 (qualifies for 80C); ULIP started in 2018, annual premium ₹1.2 lakh, sum assured ₹15 lakh — the 10% ratio is breached (premium 8% of SA actually qualifies, so OK), 80C deduction available; family floater health premium ₹22,000 (qualifies for 80D under self/spouse/children); senior-parent health premium ₹38,000 (qualifies for 80D under senior parents); preventive check-up ₹4,500 (qualifies within 80D). Her 80C is already largely consumed by EPF (₹65,000), PPF (₹50,000), and home-loan principal (₹70,000) — totalling ₹1.85 lakh — so the term and ULIP premiums do not generate incremental 80C benefit beyond the ₹1.5 lakh cap, but they remain valid 80C-eligible instruments. Her 80D: ₹22,000 (self/family) + ₹38,000 (senior parents) + ₹4,500 (preventive, capped at ₹5,000) = ₹64,500 deduction, generating a tax saving of approximately ₹20,100 at the 30% slab. GST embedded in her premiums: 18% on the term portion, 18% on the health portion. On her death during the term, the ₹4 crore term sum assured is fully exempt under 10(10D); her ULIP, having maintained the 10% ratio and aggregate annual premium well below the ₹2.5 lakh ULIP cap, also enjoys exempt status on maturity or death.',
        keyPoints: [
          'Section 80C: up to ₹1.5 lakh aggregate for life insurance premium on self/spouse/children, subject to the 10% premium-to-SA ratio for post-Apr-2012 policies.',
          'Section 80D: ₹25,000 self/family + ₹50,000 senior parents + ₹5,000 preventive check-up within the overall ceiling.',
          'Section 10(10D): death and maturity proceeds tax-free for compliant policies; ULIPs with aggregate premium > ₹2.5 lakh per annum from FY21-22 lose maturity exemption.',
          '80C limit of ₹1.5 lakh is shared with EPF, PPF, ELSS, home-loan principal — most salaried taxpayers exhaust it before considering insurance.',
          'GST: 18% on term and health premium (input credit for businesses); 4.5%/2.25% on first-year/renewal endowment premium; composite rate on ULIPs.',
          'Riders follow base policy tax treatment — Waiver of Premium, ADB, CI, PD riders qualify for 80C if attaching to a life policy.',
          '30% slab taxpayer realises roughly 30% effective discount on every rupee of qualifying premium via 80C/80D.',
        ],
        faq: [
          {
            question: 'Why must the premium be at most 10% of the sum assured for the policy to qualify under Section 80C and Section 10(10D)?',
            answer:
              'For policies issued on or after 1 April 2012, Section 80C(3A) and Section 10(10D) require the premium in any year to be not more than 10% of the sum assured (15% for policies covering certain disabled persons or specified diseases). The objective is to ensure that the policy is genuinely a life insurance contract rather than an investment product structured as insurance. Policies that breach this ratio lose both the deduction and the exemption.',
          },
          {
            question: 'Are ULIP maturity proceeds always tax-free?',
            answer:
              'Not from FY21-22 onwards. Where the aggregate annual premium across all ULIPs of an individual exceeds ₹2.5 lakh, the maturity proceeds are taxed as capital gains under Section 112A (LTCG at 12.5% post-Budget 2024 above the ₹1.25 lakh annual exemption, subject to applicable equity/debt classification of the underlying ULIP fund). Death proceeds remain fully exempt regardless. Sub-₹2.5 lakh aggregate-premium ULIPs continue to enjoy 10(10D) exemption on maturity, subject to the 10% premium-to-SA ratio.',
          },
          {
            question: 'Does a business get input tax credit on health insurance premium paid for employees?',
            answer:
              'Generally no — Section 17(5) of the CGST Act blocks input tax credit on health insurance, life insurance, and similar inputs unless the employer is statutorily obligated to provide the benefit (for instance, under a specific labour law) or the same input is used to provide an outward taxable supply. Most corporate group health policies therefore are an absolute cost to the employer for GST purposes. The policyholder advisor should not rely on ITC unless the specific entity meets the carve-out conditions.',
          },
          {
            question: 'Do rider premiums qualify for 80C?',
            answer:
              'Rider premiums attaching to a life insurance policy generally qualify for 80C alongside the base premium, subject to the 10% premium-to-sum-assured ratio applied to the bundled premium and the bundled sum assured. Rider premiums on a health insurance policy qualify for 80D. Rider premiums on a standalone Personal Accident policy do not qualify under either section as PA premiums are not within the 80C or 80D ambit.',
          },
        ],
        mcqs: [
          {
            question: 'For a life insurance policy issued in 2020, the premium-to-sum-assured ratio that the policy must respect for Section 10(10D) exemption is:',
            options: ['Premium ≤ 5% of SA', 'Premium ≤ 10% of SA', 'Premium ≤ 20% of SA', 'No ratio applies'],
            correctAnswer: 1,
            explanation:
              'For policies issued on or after 1 April 2012, the premium in any year must not exceed 10% of the sum assured for Section 10(10D) exemption to apply. Policies issued before that date had a 20% ceiling.',
          },
          {
            question: 'Section 80D deduction available to a 40-year-old policyholder paying ₹22,000 for self/family health and ₹38,000 for senior-citizen parents (with ₹4,500 preventive) in a financial year is:',
            options: ['₹22,000', '₹46,500', '₹64,500', '₹75,000'],
            correctAnswer: 2,
            explanation:
              '₹22,000 (within the ₹25,000 self/family limit) + ₹38,000 (within the ₹50,000 senior-parent limit) + ₹4,500 (within the ₹5,000 preventive sub-limit) = ₹64,500. The maximum permissible would have been ₹25,000 + ₹50,000 = ₹75,000, with preventive falling within the ceiling.',
          },
          {
            question: 'GST on health insurance premium for an individual policyholder is:',
            options: ['Nil', '5%', '12%', '18%'],
            correctAnswer: 3,
            explanation:
              'GST on health insurance premium is currently levied at 18%. Input tax credit is generally blocked for individual policyholders and for businesses other than those meeting the Section 17(5) carve-out conditions.',
          },
        ],
        summaryNotes: [
          '80C: ₹1.5 lakh aggregate limit, shared with EPF/PPF/ELSS/home-loan principal — most salaried taxpayers exhaust before insurance.',
          '80D: ₹25k self/family + ₹50k senior parents + ₹5k preventive within the overall ceiling.',
          '10(10D): exempt death and maturity proceeds, subject to 10% premium-to-SA ratio for post-Apr-2012 policies.',
          'ULIPs from FY21-22: aggregate annual premium above ₹2.5 lakh loses maturity exemption; death proceeds remain exempt.',
          'GST: 18% on term and health premium; 4.5%/2.25% first-year/renewal on endowment; composite rate on ULIPs.',
          'Riders follow base-policy tax treatment — match the rider to the base policy type.',
        ],
        relatedTopics: ['term-deep-dive', 'health-deep-dive', 'critical-illness-pa', 'why-insurance'],
      },
    },
  ],
};
