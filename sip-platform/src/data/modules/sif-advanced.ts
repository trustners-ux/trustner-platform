import { LearningModule } from '@/types/learning';

export const sifAdvancedModule: LearningModule = {
  id: 'sif-advanced',
  title: 'SIF Advanced Topics — Manager Selection & Due Diligence',
  slug: 'sif-advanced',
  icon: 'Layers',
  description:
    'Advanced material covering manager evaluation, due-diligence frameworks, performance attribution, peer comparison methodology, allocation sizing decisions, and red-flag detection in SIF distribution. Aimed at sophisticated investors and Trustner sub-broker team members preparing for higher-stakes client conversations.',
  level: 'advanced',
  color: 'from-indigo-700 to-purple-700',
  estimatedTime: '45 min',
  track: 'sif',
  sections: [
    {
      id: 'sif-manager-evaluation',
      title: 'Manager Evaluation Framework',
      slug: 'sif-manager-evaluation',
      content: {
        definition:
          'A SIF manager evaluation framework systematically assesses the strategy team across six dimensions: track record (5-year strategy-consistent performance), team stability and depth, AMC infrastructure and risk management, strategy clarity and replicability, fee economics versus expected gross alpha, and operational quality. Manager skill is the dominant variable in long-short returns; disciplined evaluation is therefore the dominant input to SIF allocation decisions.',
        explanation:
          'Track record analysis goes beyond single-period returns. The right framework examines: (a) full-cycle performance through at least one bull-bear cycle (ideally 5+ years); (b) drawdown profile during stress events (2020 COVID, 2022 yield-cycle inflation, 2024 mid-cycle volatility); (c) Calmar ratio (annualised return divided by max drawdown) — a value above 1.0 indicates the manager has generated meaningful return per unit of drawdown risk; (d) hit rate (percentage of months with positive returns); (e) consistency between long-book alpha and short-book alpha — managers strong on the long side but weak on the short side may not justify the long-short fee load over a long-only alternative. Team stability matters because long-short skill is tacit and cumulative — the senior portfolio managers who have generated alpha across multiple cycles cannot be easily replaced. The evaluation should include team tenure (PMs ideally 5+ years on the strategy), succession planning, and any recent senior-level departures. AMC infrastructure includes: independent risk management (CRO who can override the PM in stress), robust execution platform (low-slippage execution across futures, SLB, options), and operational reliability (timely SoA, quarterly statements, audit-quality reporting). Strategy clarity tests whether the investor understands what the manager does and how returns are generated. A genuinely good strategy can be explained in 10 minutes; if after a careful read of the SID and a meeting with the PM, the strategy remains opaque, that is a yellow flag. Fee economics evaluates whether the gross alpha potential justifies the all-in fee load. A SIF with 2.5% management + 20% performance over 8% hurdle costs ~3.5-4.5% in good years; the gross alpha must exceed this materially for the structure to add value over a passive index alternative. Operational quality is the unglamorous but critical final dimension — quality SoA delivery, responsive RM coverage, audit-quality reporting, and zero history of operational errors signal a well-run AMC.',
        realLifeExample:
          'A representative manager evaluation: SIF "Alpha LS Fund" managed by AMC X. (a) 5-year track record: 14.2% annualised gross return vs Nifty 50 11.8%; alpha 2.4%; max drawdown 18% (vs Nifty 32% in 2020); Calmar ratio 0.79; hit rate 67%. (b) Team: PM has 12 years on strategy, two senior analysts each with 6+ years; no senior departures in 3 years. (c) AMC infrastructure: independent CRO with veto authority; STAR platform for execution; clean operational record with no material errors in 5 years. (d) Strategy clarity: clearly articulated bottom-up + paired-shorts framework; understandable to a sophisticated investor in a 30-min discussion. (e) Fees: 2.25% management + 18% performance over 9% hurdle, with high-water mark; investor net-of-fee return over 5 years was 11.8% — beating Nifty by 0.0% (no net alpha). (f) Operational quality: high. Conclusion: Strategy is well-structured but historical net-of-fee performance has not justified the fee load. The fund is HOLD-don\'t-recommend until evidence of consistent net alpha emerges. This kind of evaluation is the foundation of Trustner\'s pre-empanelment diligence.',
        keyPoints: [
          'Six evaluation dimensions: track record, team, AMC infrastructure, strategy clarity, fees, operational quality.',
          'Track record: full cycle (5+ years), drawdown profile, Calmar ratio, hit rate, long/short attribution.',
          'Team stability: PM tenure, succession, no recent senior departures.',
          'AMC infrastructure: independent CRO, robust execution platform, clean operational record.',
          'Strategy clarity: explicable in 10 minutes; opaque strategies are yellow flags.',
          'Fee economics: gross alpha must exceed all-in fee load; net-of-fee alpha is the test.',
          'Operational quality: timely statements, responsive RM, audit-quality reporting.',
        ],
        faq: [
          {
            question: 'What is the Calmar ratio?',
            answer:
              'Calmar ratio = annualised return ÷ maximum drawdown. It measures return per unit of drawdown risk. Value above 1.0 indicates the strategy generates more return than its worst drawdown — generally favourable. Long-short funds aiming for absolute returns target Calmar above 0.7-1.0; long-only funds typically have lower Calmar ratios because their drawdowns are larger.',
          },
          {
            question: 'How important is the AMC\'s overall reputation versus the specific PM?',
            answer:
              'For long-short strategies, the specific PM and senior team matter more than the AMC name. Long-short skill is portable — a strong PM moving to a different AMC may continue delivering, while a new PM at a strong AMC may not replicate the prior team\'s results. Pay attention to PM-specific track records, not just AMC-aggregate performance.',
          },
          {
            question: 'What does "hit rate" mean?',
            answer:
              'Hit rate is the percentage of months (or quarters) in which the fund generated positive returns. A hit rate of 65-70% is typical for skilled long-short managers — meaning roughly 7-8 out of every 12 months are positive, with the rest being losses or flat. Higher hit rates indicate more consistent monthly returns; lower hit rates indicate higher variability.',
          },
          {
            question: 'Why is "strategy clarity" important?',
            answer:
              'Investor behaviour depends on understanding the strategy. When markets test the strategy (e.g., short-covering rallies hurting the short book), an investor who understands WHY the temporary underperformance is occurring stays the course. An investor who never understood the strategy panics and redeems at the worst possible time. Trustner\'s framework is to recommend only strategies the investor can articulate back in their own words after the onboarding conversation.',
          },
        ],
        mcqs: [
          {
            question: 'A Calmar ratio above 1.0 indicates:',
            options: [
              'Negative returns',
              'Annualised return exceeds maximum drawdown — favourable risk-adjusted profile',
              'High volatility',
              'Low fees',
            ],
            correctAnswer: 1,
            explanation:
              'Calmar ratio = annualised return ÷ maximum drawdown. Above 1.0 means the strategy has generated more return than its worst drawdown — generally favourable. Long-short funds targeting absolute returns aim for Calmar above 0.7-1.0.',
          },
          {
            question: 'A strong long-only PM with weak short-side skill running a long-short SIF would typically:',
            options: [
              'Outperform a long-only fund consistently',
              'Underperform a long-only fund net-of-fee, because the short book drag exceeds the alpha contribution',
              'Generate symmetric returns',
              'Have no impact on returns',
            ],
            correctAnswer: 1,
            explanation:
              'A long-short fund with strong long-side skill but weak short-side skill typically underperforms a comparable long-only fund net-of-fee — the short book acts as expensive insurance without delivering alpha. Manager evaluation must verify both long and short skill.',
          },
          {
            question: 'In SIF manager evaluation, the most important fee-related test is:',
            options: [
              'Lowest absolute management fee',
              'Net-of-fee alpha — gross alpha must exceed all-in fee load',
              'Highest performance fee',
              'No fees',
            ],
            correctAnswer: 1,
            explanation:
              'The right fee test is net-of-fee alpha. A high-fee fund delivering high gross alpha may net-of-fee outperform a low-fee fund with mediocre gross. The investor pays for what is delivered; gross alpha must exceed the all-in fee load by a meaningful margin to justify SIF over passive alternatives.',
          },
        ],
        summaryNotes: [
          'Six-dimension framework: track record, team, AMC, clarity, fees, operations.',
          'Calmar ratio + hit rate + long/short attribution decompose true skill.',
          'Net-of-fee alpha is the ultimate test — not gross or absolute returns.',
          'Strategy clarity preserves investor behaviour through stress periods.',
        ],
        relatedTopics: ['sif-due-diligence', 'sif-portfolio-construction', 'sif-strategies'],
      },
    },

    {
      id: 'sif-due-diligence',
      title: 'Due Diligence Process for SIF Empanelment',
      slug: 'sif-due-diligence',
      content: {
        definition:
          'A SIF due diligence process systematically reviews offer documents, manager references, AMC operational standing, regulatory history, and strategy back-tests before adding the SIF to a distributor\'s recommended list. Trustner\'s framework includes 5-7 working days of structured review per SIF, refreshed quarterly, with formal sign-off by the head of distribution before any client recommendation.',
        explanation:
          'The due diligence process operates at three levels. Level 1 — Document review: Scheme Information Document (SID), Statement of Additional Information (SAI), Key Information Memorandum (KIM), and the latest annual report and audited financials. The reviewer specifically checks: (a) the strategy mandate and stated objectives — must be clear and unambiguous; (b) investment universe and instrument permissions — verify alignment with SEBI SIF framework; (c) fee structure and high-water-mark mechanics — calculate worst-case fee load on hypothetical scenarios; (d) liquidity and redemption terms; (e) tax classification expectations. Level 2 — Manager and AMC engagement: structured 60-90 minute meetings with the PM, CIO, and CRO covering strategy nuances, risk management framework, recent stress-event handling, and forward outlook. Reference checks are done with at least 3 other distributors who have empanelled the SIF, with specific questions on operational reliability, RM responsiveness, and any client-level disputes. Level 3 — Independent verification: cross-checking the manager\'s claimed track record against publicly available data (where applicable), reviewing any SEBI/AMFI advisory or warning history of the AMC, and assessing the AMC\'s solvency and ownership stability. Output of the process is a structured empanelment memo documenting the findings, the recommendation (empanel / hold / reject), and the suitability profile (which client wealth tiers and risk profiles the SIF is appropriate for). Empanelled SIFs are reviewed quarterly; any material change (PM departure, strategy drift, regulatory action) triggers an immediate review and potentially de-empanelment. Clients holding de-empanelled SIFs are notified and supported with managed exit if appropriate (factoring in tax planning and exit loads).',
        realLifeExample:
          'A representative due-diligence cycle: SIF "Beta Equity LS" submitted by AMC Y for empanelment review. Day 1-2: SID, SAI, KIM review. Strategy mandate clear. Fee: 2.25% + 18% over 9% hurdle. Liquidity: monthly window with 15-day notice. Tax: equity-classified expected. Day 3: Reference calls with 3 distributors. Two report excellent operational quality, one mentions RM communication delays during 2024 volatility. Day 4: 75-min meeting with PM and CRO. Strategy framework articulated clearly. Risk management: independent CRO with override authority. Recent stress event (2024 March-April correction): fund handled cleanly, 9% drawdown vs Nifty 14%. Day 5: Independent verification of track record. AMC has zero SEBI/AMFI warnings in 5-year window. Solvency strong. Day 6-7: Memo drafted, head of distribution sign-off. Recommendation: empanel for clients with ₹50 lakh+ liquid wealth, moderate-aggressive risk profile, 3-5 year horizon, and no prior allocation to similar long-short strategies. Memo logs the RM communication concern as monitoring point — to be reviewed in next quarterly cycle.',
        keyPoints: [
          'Three-level diligence: document review, manager engagement, independent verification.',
          'Document review: SID/SAI/KIM, annual report, audited financials.',
          'Manager engagement: 60-90 min meetings + 3+ distributor references.',
          'Independent verification: track record cross-check, regulatory history, solvency.',
          'Output: structured empanelment memo with recommendation and suitability profile.',
          'Quarterly review of empanelled SIFs; material changes trigger immediate review.',
          'De-empanelment process protects existing clients with managed exit.',
        ],
        faq: [
          {
            question: 'Why are reference calls with other distributors important?',
            answer:
              'AMC marketing materials and PM presentations naturally emphasise positives. Independent distributors who have managed client relationships in the SIF for 12+ months provide unfiltered feedback on operational reality — RM responsiveness, statement quality, conflict resolution, and client experience during stress events. Three-distributor minimum reduces individual bias. This is a critical input that no document review can substitute for.',
          },
          {
            question: 'What triggers immediate de-empanelment outside the quarterly cycle?',
            answer:
              'Several trigger events: (a) Senior PM departure (especially the lead PM); (b) AMC ownership change with strategic implication; (c) SEBI/AMFI advisory or enforcement action against the AMC; (d) Material strategy drift (e.g., a long-short SIF effectively running long-only); (e) Operational failures (delayed reporting, NAV errors, custodian issues); (f) Material drawdown beyond stated risk parameters with inadequate explanation. Any of these triggers an emergency review and potentially de-empanelment within 1-2 weeks.',
          },
          {
            question: 'How does Trustner handle clients invested in a de-empanelled SIF?',
            answer:
              'Clients are notified of the de-empanelment with the underlying reasoning. The Relationship Manager schedules a review meeting to discuss options: (a) hold to existing redemption window if the fund remains operationally functional; (b) phased exit factoring tax implications; (c) immediate exit if the fund\'s operational integrity is compromised. Trustner does NOT charge an additional fee for managing exit from a de-empanelled SIF — this is part of the integrated client relationship.',
          },
          {
            question: 'Are AIF and PMS due diligence processes similar to SIF?',
            answer:
              'The frameworks are similar in structure (document review, manager engagement, independent verification) but the depth and emphasis differ. AIF diligence is heavier on legal documentation and capital-call mechanics. PMS diligence emphasises portfolio construction discipline and demat-account-level operational quality. SIF diligence emphasises long-short strategy clarity and fee economics. Trustner maintains separate diligence frameworks for each structure type.',
          },
        ],
        mcqs: [
          {
            question: 'Reference calls with other distributors are valuable because:',
            options: [
              'They provide unfiltered feedback on operational reality the AMC marketing cannot show',
              'They are required by SEBI',
              'They reduce diligence cost',
              'They guarantee performance',
            ],
            correctAnswer: 0,
            explanation:
              'Independent distributor references provide unfiltered, real-world feedback on RM responsiveness, statement quality, conflict resolution, and stress-event handling — perspectives no AMC marketing can show. Three-reference minimum reduces individual bias.',
          },
          {
            question: 'Which event would trigger immediate (non-cyclical) review of an empanelled SIF?',
            options: [
              'Routine NAV publication',
              'Senior PM departure',
              'Quarterly review meeting',
              'Annual TER update',
            ],
            correctAnswer: 1,
            explanation:
              'Senior PM departure (especially the lead PM) immediately triggers a review because long-short skill is tacit and team-specific. Other immediate triggers include AMC ownership change, regulatory action, material strategy drift, and operational failures.',
          },
          {
            question: 'When a SIF is de-empanelled, Trustner\'s approach to existing client allocations is:',
            options: [
              'Force immediate redemption',
              'Notify clients and schedule managed exit considering tax and operational factors',
              'Take no action until next year',
              'Charge an exit-management fee',
            ],
            correctAnswer: 1,
            explanation:
              'Trustner notifies clients of the de-empanelment, schedules a review meeting, and supports a managed exit factoring tax implications, exit loads, and operational integrity. No additional fee is charged; this is part of the integrated client relationship.',
          },
        ],
        summaryNotes: [
          'Three-level diligence: documents, manager engagement, independent verification.',
          '5-7 working days per SIF; quarterly cycle; immediate review on material change.',
          'Reference calls (3+ distributors) provide unfiltered operational feedback.',
          'De-empanelment triggers managed client exit with tax and operations factored.',
        ],
        relatedTopics: ['sif-manager-evaluation', 'sif-distributor-compliance', 'sif-portfolio-construction'],
      },
    },

    {
      id: 'sif-allocation-sizing',
      title: 'Allocation Sizing & Portfolio Integration',
      slug: 'sif-allocation-sizing',
      content: {
        definition:
          'Allocation sizing for SIFs follows three principles: SIF allocation as a percentage of overall liquid wealth (recommended 10-20%), per-SIF sizing within the bucket (split across 2-3 SIFs above ₹50 lakh allocation), and integration with the broader portfolio (mutual funds 60-70%, SIF 10-20%, PMS/AIF if applicable, cash/liquid 10-15%). The sizing decision sits within a holistic portfolio framework, not in isolation.',
        explanation:
          'The starting point is the investor\'s overall portfolio context. A typical balanced HNI portfolio at ₹2 crore liquid wealth might look like: ₹1.4 crore (70%) in diversified mutual funds, ₹30 lakh (15%) across 1-2 SIFs, ₹20 lakh (10%) in liquid funds, ₹10 lakh (5%) in gold or international FoF. The SIF bucket of 10-20% is sized so that even a 30% drawdown on the SIF allocation (worst-case scenario) impacts overall wealth by no more than 6%. Within the SIF bucket, sub-allocation across 2-3 SIFs reduces single-manager risk. A typical ₹30 lakh SIF allocation might split as: ₹15 lakh in an Equity LS SIF + ₹15 lakh in a Hybrid LS SIF, or two specialised LS SIFs with different strategy emphasis. Single-SIF allocations above ₹50 lakh begin to concentrate manager risk inappropriately; investors crossing this threshold should split rather than scale up. Integration with the broader portfolio considers correlation. SIF returns are expected to be partially uncorrelated with mutual funds (the LS structure dampens market-driven beta returns). The SIF\'s addition therefore reduces overall portfolio volatility without proportionate return reduction — the diversification benefit. However, if the SIF\'s long book mirrors the investor\'s mutual fund holdings, the diversification benefit is reduced; the SIF should ideally hold a different set of stocks or apply different selection criteria. Trustner\'s framework includes a portfolio-overlap review at each SIF subscription — verifying that the SIF\'s top long positions don\'t materially duplicate the investor\'s existing mutual fund exposures. Goal-mapping is the final integration layer. Investors with specific 3-7 year goals (down payment, child\'s education) should typically not allocate those goal-linked funds to SIFs — the strategy mandate may not align with the goal\'s liquidity needs and the investor faces forced redemption at potentially adverse points. SIF allocation comes from the long-term wealth bucket (10+ year horizon), where the strategy\'s return-and-drawdown profile can compound through cycles.',
        realLifeExample:
          'A representative allocation analysis: Vivek, 48, ₹4 crore liquid wealth. Existing portfolio: ₹2.4 crore in mutual funds (60%, mostly flexi-cap and multi-cap), ₹50 lakh in liquid funds (12.5%), ₹20 lakh in gold ETF (5%), ₹90 lakh in cash. Trustner recommendation: increase equity exposure by deploying ₹60 lakh from cash into SIFs (15% allocation total) split as: ₹30 lakh in Equity LS SIF A, ₹30 lakh in Hybrid LS SIF B. Total SIF allocation: 15% of liquid wealth, split across 2 specialist managers, with strategies meaningfully different from his mutual fund holdings (his MF is 100% long-only large/mid cap; the SIFs add LS layering). Goal alignment: SIF allocation linked to his 12+ year retirement bucket (he is 12 years from planned retirement at 60). Post-deployment portfolio: 60% MF + 15% SIF + 12.5% liquid + 5% gold + 7.5% cash (down from 22.5%). Expected outcome: similar long-term return with materially lower drawdown and better behaviour during market stress events.',
        keyPoints: [
          'SIF allocation as percentage of liquid wealth: 10-20% recommended.',
          'Sub-allocation: split across 2-3 SIFs above ₹50 lakh allocation; single-SIF cap at ₹50 lakh.',
          'Portfolio integration: typical balanced HNI = 60-70% MF + 10-20% SIF + 10-15% liquid + small gold.',
          'Correlation matters: SIF should reduce overall volatility through partial decorrelation.',
          'Portfolio-overlap review: ensure SIF longs don\'t duplicate mutual fund holdings.',
          'Goal-mapping: SIF allocation comes from long-term (10+ year) wealth bucket.',
          'Worst-case framing: 30% SIF drawdown ≤ 6% overall wealth impact at 20% SIF allocation.',
        ],
        faq: [
          {
            question: 'Should I allocate to SIF before or after maxing out PMS?',
            answer:
              'SIF and PMS are complements, not sequential steps. Both can co-exist in the same portfolio. The choice depends on the strategic gap: SIF for long-short / hedged exposure, PMS for concentrated / customised long-only. An investor might run 12% in SIF and 15% in PMS simultaneously. The right framework is to identify each portfolio gap and select the appropriate vehicle for each, rather than thinking in a sequence.',
          },
          {
            question: 'How do I evaluate if my SIF reduces portfolio correlation?',
            answer:
              'Compare the SIF\'s monthly return series against your overall mutual fund return series over a 24-month period. Calculate the correlation coefficient. A correlation of 0.5 or below suggests meaningful diversification benefit. A correlation above 0.8 suggests the SIF is largely tracking your mutual fund book — and the diversification benefit is limited. Trustner\'s annual review can run this analysis with you using anonymised position data.',
          },
          {
            question: 'Can I allocate goal-linked funds (e.g., 5-year child education) to SIFs?',
            answer:
              'Generally no. SIF strategies typically have 5+ year horizons to demonstrate their structural value, and redemption may occur at adverse NAV points if the goal date is fixed. For 3-7 year goal-linked funds, balanced advantage funds, multi-asset funds, or hybrid funds (in the mutual fund universe) are typically better fits. SIF allocation should come from the long-term (10+ year) wealth bucket where the strategy can compound through cycles.',
          },
          {
            question: 'What is "portfolio-overlap review"?',
            answer:
              'It is a structured comparison of the SIF\'s top long positions against the investor\'s existing mutual fund holdings. If the investor\'s mutual fund book holds 6% in HDFC Bank and the SIF\'s long book also holds 6% HDFC Bank, the effective HDFC Bank exposure is 12% across the combined portfolio. Trustner\'s framework reviews this overlap to ensure the SIF adds genuine new exposure rather than duplicating existing holdings.',
          },
        ],
        mcqs: [
          {
            question: 'Recommended SIF allocation as a percentage of liquid wealth is:',
            options: ['Up to 5%', '10-20%', '50-70%', 'Whatever is available'],
            correctAnswer: 1,
            explanation:
              'Recommended SIF allocation is 10-20% of overall liquid wealth, sized so even a 30% drawdown on the SIF impacts overall wealth by no more than 6%. Above 30% becomes over-concentration risk; below 5% provides marginal diversification benefit.',
          },
          {
            question: 'Single-SIF allocation should typically not exceed:',
            options: ['₹10 lakh', '₹50 lakh', '₹2 crore', 'No cap'],
            correctAnswer: 1,
            explanation:
              'Single-SIF allocation above ₹50 lakh concentrates manager risk inappropriately. Investors crossing this threshold should split across 2-3 SIFs to manage idiosyncratic manager risk.',
          },
          {
            question: 'A portfolio-overlap review checks:',
            options: [
              'Whether the SIF\'s long positions duplicate the investor\'s existing mutual fund holdings',
              'Whether the SIF has high fees',
              'Whether the SIF is open-ended',
              'The SIF manager\'s tenure',
            ],
            correctAnswer: 0,
            explanation:
              'Portfolio-overlap review compares the SIF\'s top long positions against the investor\'s existing mutual fund holdings to ensure the SIF adds genuine new exposure rather than duplicating existing positions and concentrating single-stock risk.',
          },
        ],
        summaryNotes: [
          'SIF allocation: 10-20% of liquid wealth.',
          'Single-SIF cap ~₹50 lakh; above this, split across 2-3 managers.',
          'Portfolio integration: 60-70% MF + 10-20% SIF + 10-15% liquid; goal-mapped to long-term bucket.',
          'Portfolio-overlap review preserves diversification benefit.',
        ],
        relatedTopics: ['sif-manager-evaluation', 'sif-due-diligence', 'sif-who-should-invest'],
      },
    },

    {
      id: 'sif-red-flags',
      title: 'Red Flags & Mis-Sale Detection',
      slug: 'sif-red-flags',
      content: {
        definition:
          'A SIF mis-sale or product-level red flag is a warning signal that warrants additional scrutiny or a hold-recommendation before subscription. Common red flags include over-concentration risk for the investor, opaque strategy explanation, fee structures misaligned with delivered alpha, manager team instability, and aggressive marketing that emphasises return potential over risk realities.',
        explanation:
          'Investor-level red flags. Over-concentration is the most common — an investor with ₹15-25 lakh net wealth being subscribed to a ₹10 lakh SIF (40-67% allocation). Trustner\'s suitability framework explicitly declines such subscriptions. A second red flag is investor literacy mismatch — an investor unable to articulate the strategy back in their own words after a 60-minute discussion is unlikely to hold the SIF through stress events. A third red flag is misaligned horizon — an investor with a 2-year liquidity need investing in a SIF with 5-year strategy compounding requirement. Product-level red flags. Opaque strategy is the most common — a SIF whose offer document mentions "proprietary alpha generation" without explaining the actual mechanism warrants skepticism. A second red flag is fee structure asymmetric to risk — a 2.5% management + 25% performance over 6% hurdle indicates the AMC is extracting alpha-share before the investor sees meaningful return. A third red flag is recent senior team departure within 12 months — the strategy may not yet have stabilised under new leadership. A fourth is short track record (less than 3 years) — there is insufficient history to evaluate consistency. A fifth is regulatory advisory or enforcement history — even minor SEBI advisories warrant additional scrutiny. Marketing red flags. Headline-rate emphasis (e.g., "delivered 24% in 2024") without context (Nifty 50 also delivered 22% that year, so the SIF\'s alpha was just 2% before fees) is misleading. Backtested performance presentations without live track record warrant skepticism. Marketing comparison to inappropriate benchmarks (e.g., comparing a long-short fund to a debt index to make returns look strong) signals integrity issues. Trustner\'s framework explicitly trains the Relationship Manager team to flag these red flags during the diligence process and to decline empanelment when material concerns surface. The investor\'s long-term outcome depends on the discipline of the recommendation process, not on aggressive sales tactics.',
        realLifeExample:
          'A specific red-flag case study: SIF "Gamma Equity LS" approached for empanelment. Track record: 18 months live (red flag — too short for full evaluation). Fee structure: 2.5% management + 25% performance over 5% hurdle (red flag — performance fee triggers too early). Lead PM departed 4 months ago for a competitor; replaced by junior PM with 2 years on the strategy (red flag — team instability). Marketing materials emphasise "delivered 28% in last 12 months" without contextualising that Nifty 50 returned 26% — the alpha is just 2% before fees, and net of 2.5% management fee, the investor\'s net return was below Nifty (red flag — misleading marketing). Conclusion: HOLD-don\'t-empanel until track record extends, lead PM replacement stabilises, and net-of-fee alpha can be evaluated. Trustner does not recommend this SIF to clients despite AMC marketing efforts. This is the kind of disciplined declination that protects long-term client outcomes.',
        keyPoints: [
          'Investor-level red flags: over-concentration, literacy mismatch, misaligned horizon.',
          'Product-level red flags: opaque strategy, asymmetric fees, recent team departure, short track record, regulatory history.',
          'Marketing red flags: headline-rate emphasis, backtested-only performance, inappropriate benchmark comparison.',
          'Suitability declination is the right outcome when red flags surface — not soft accommodation.',
          'Disciplined recommendation process > aggressive sales tactics for long-term client outcomes.',
          'Trustner\'s RM team is trained to flag red flags during onboarding conversations.',
          'SEBI/AMFI advisory or enforcement history is a material flag for empanelment review.',
        ],
        faq: [
          {
            question: 'How do I tell if a SIF\'s strategy explanation is opaque or genuine?',
            answer:
              'A genuine strategy can be explained in 10 minutes using everyday language. The PM can describe a specific recent trade: what was bought, what was shorted, why, and how it played out. An opaque strategy uses vague phrases ("proprietary alpha", "rigorous research process", "experienced team") without specifics. If after a careful read of the SID and a meeting, you cannot explain the strategy back in your own words, that is the opacity flag.',
          },
          {
            question: 'Is a 18-month live track record disqualifying?',
            answer:
              'Not absolutely — it is a flag, not a binary disqualifier. Some highly skilled managers launch new SIFs with shorter track records, where their prior PMS or AIF history demonstrates skill. The right framework is to require 3+ years live track record OR a longer-track-record at the prior structure to be empanelled. New launches with no track record at any structure are typically held for the first 18-24 months.',
          },
          {
            question: 'What if Trustner\'s diligence finds no red flags but the SIF later underperforms?',
            answer:
              'Underperformance is a possible outcome even of disciplined investments — manager skill is not always realised in every period. Trustner\'s framework is to monitor empanelled SIFs quarterly and de-empanel if 3-year rolling underperformance, drawdown beyond stated risk parameters, or material strategy drift becomes evident. Diligence reduces but does not eliminate the probability of underperformance.',
          },
          {
            question: 'Can clients override Trustner\'s declination and invest in a SIF anyway?',
            answer:
              'A client always has the right to invest in a non-empanelled SIF directly with the AMC. Trustner will not facilitate the subscription nor receive distributor commission, but the client\'s independent decision is respected. The Relationship Manager will document the conversation including the declination reasoning and the client\'s independent decision, for clarity in the relationship.',
          },
        ],
        mcqs: [
          {
            question: 'A SIF with 25% performance fee triggering above a 5% hurdle is a red flag because:',
            options: [
              'Performance fees are illegal',
              'The hurdle is too low — the AMC extracts alpha-share before the investor sees meaningful return',
              'Performance fees are always wrong',
              '5% is the SEBI maximum',
            ],
            correctAnswer: 1,
            explanation:
              'A 5% hurdle is too low — barely matching liquid fund returns. The AMC extracts alpha-share above 5%, before the investor sees materially better returns than alternatives. A 8-10% hurdle is the typical reasonable threshold; below 7% warrants scrutiny.',
          },
          {
            question: 'Marketing claiming "delivered 28% in 12 months" without benchmark context is a red flag because:',
            options: [
              'Returns are not accurate',
              'It misses the comparable benchmark; Nifty also returned 26% so alpha may be marginal',
              'Performance numbers are illegal',
              '28% is too high to be true',
            ],
            correctAnswer: 1,
            explanation:
              'Headline returns without benchmark context are misleading. If the broader market delivered similar returns, the SIF\'s alpha was marginal. Net-of-fee comparison against the appropriate benchmark is the right evaluation framework.',
          },
          {
            question: 'When Trustner identifies red flags, the appropriate action is:',
            options: [
              'Soft accommodation to keep the AMC relationship',
              'Suitability declination — protecting long-term client outcomes',
              'Charge a higher fee to compensate for risk',
              'Always proceed but with smaller allocation',
            ],
            correctAnswer: 1,
            explanation:
              'Suitability declination is the right outcome when material red flags surface. Long-term client outcomes depend on disciplined recommendation processes, not on accommodating AMC pressure or pursuing distributor commission.',
          },
        ],
        summaryNotes: [
          'Three red-flag categories: investor-level, product-level, marketing-level.',
          'Suitability declination is the right answer when material flags surface.',
          'Disciplined process protects long-term client outcomes.',
          'Quarterly monitoring catches post-empanelment changes (drift, drawdown, departures).',
        ],
        relatedTopics: ['sif-manager-evaluation', 'sif-due-diligence', 'sif-allocation-sizing'],
      },
    },
  ],
};
