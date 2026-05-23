import { LearningModule } from '@/types/learning';

export const fundStructureModule: LearningModule = {
  id: 'fund-structure',
  title: 'Fund Structure & Key Players',
  slug: 'fund-structure',
  icon: 'Building2',
  description: 'Understand the three-tier mutual fund structure in India — Sponsor, Trustee, and AMC — plus the roles of custodian, RTA, SEBI, and AMFI. Essential NISM exam knowledge.',
  level: 'intermediate',
  color: 'from-amber-500 to-orange-600',
  estimatedTime: '35 min',
  sections: [
    // ─── Section 1: Three-Tier Structure ─────────────────────────────────
    {
      id: 'three-tier-structure',
      title: 'Three-Tier Structure — Sponsor, Trustee, AMC',
      slug: 'three-tier-structure',
      content: {
        definition: 'A mutual fund in India is constituted as a trust under the Indian Trusts Act, 1882, and is registered with SEBI under the SEBI (Mutual Funds) Regulations, 1996 (note: SEBI has notified new SEBI (Mutual Funds) Regulations, 2026, effective from April 1, 2026, streamlined from 162 pages to 88 pages). Every mutual fund must have three separate legal entities — the Sponsor (who establishes the trust), the Trustee (who holds the assets on behalf of unitholders), and the Asset Management Company or AMC (who manages the investments). This three-tier structure exists to protect investor interests through clear separation of ownership, oversight, and management.',
        explanation: 'The three-tier structure is widely regarded as the single most tested concept in the NISM VA exam — and yet most candidates treat it like a boring formality. Understanding why it matters in practice is essential: the entire reason investor money is safe even if an AMC goes bankrupt is this three-tier separation. A useful analogy is a family business. The Sponsor is the patriarch who founded the family trust and put in the initial capital. The Trustee is the family elder who watches over everything and ensures the rules are followed. The AMC is the professional manager hired to run the day-to-day business. The patriarch does not manage daily operations. The elder does not pick stocks. The manager cannot run away with the money because it is held in the trust, not in a personal account. This structural separation is what makes mutual funds fundamentally safer than corporate FDs, chit funds, or unregulated investment schemes. It is worth noting that SEBI designed this structure after studying global best practices specifically to prevent the kind of fraud that plagued India\'s investment landscape in the 1990s. Every single regulatory crisis — from the UTI US-64 debacle to the Franklin Templeton debt fund episode — has led to further strengthening of this three-tier wall.',
        realLifeExample: 'Consider how this works with a real AMC — HDFC Mutual Fund. The Sponsor is Housing Development Finance Corporation Limited (now merged with HDFC Bank). HDFC Ltd established the mutual fund trust back in 2000. The Trustee is HDFC Trustee Company Limited — a separate company whose sole job is to ensure that HDFC AMC manages investor money according to SEBI regulations and each scheme\'s stated objectives. The AMC is HDFC Asset Management Company Limited — the entity that employs the fund managers, analysts, and operations team that actually run the ₹7+ lakh crore AUM business. The critical point for exam purposes: if HDFC AMC were to face financial difficulties tomorrow, investor money is NOT at risk. Why? Because the mutual fund assets are held in the trust (overseen by the trustee), not on the AMC\'s balance sheet. SEBI would simply appoint another AMC to manage those assets. This happened in practice when Morgan Stanley handed over its mutual fund business to HDFC AMC in 2014 — investor money remained safe throughout the transition.',
        keyPoints: [
          'A mutual fund in India is a trust established under the Indian Trusts Act, 1882 — not a company or partnership',
          'Every mutual fund must be registered with SEBI under SEBI (Mutual Funds) Regulations, 1996 (being replaced by the new 2026 regulations from April 1, 2026)',
          'Three distinct entities: Sponsor (promoter/founder), Trustee (guardian/overseer), AMC (professional manager)',
          'The Sponsor establishes the trust and appoints the Trustee — similar to a promoter setting up a company',
          'The Trustee holds the mutual fund property on behalf of unitholders — they are the legal custodians of investor interests',
          'The AMC is appointed by the Trustee (with SEBI approval) to manage the fund\'s investments day-to-day',
          'This three-tier separation ensures that investor assets are protected even if the AMC faces financial trouble',
          'NISM exam favorite: the relationship flows as Sponsor → establishes Trust → appoints Trustee → Trustee appoints AMC → AMC manages funds',
        ],
        faq: [
          {
            question: 'Why does India use a trust structure for mutual funds instead of a company structure?',
            answer: 'India follows the trust route (similar to the UK model) because a trust is a fiduciary arrangement where the trustee is legally bound to act in the best interest of beneficiaries (unitholders). In a company structure (used in the US), shareholders\' interests could conflict with investors\' interests. The trust structure provides an additional layer of protection — the trustee\'s sole purpose is to safeguard investor money, and they are personally liable for any breach of fiduciary duty.',
          },
          {
            question: 'Can the same entity be the Sponsor, Trustee, and AMC?',
            answer: 'Absolutely not. SEBI mandates that these three entities must be legally separate. The Sponsor cannot be the Trustee. The AMC is a separate company from the Trustee. While the Sponsor typically holds equity in the AMC, the Trustee must have independent directors (at least 2/3rd) to prevent conflicts of interest. This separation is the cornerstone of investor protection in the mutual fund structure.',
          },
          {
            question: 'What happens to an investor\'s money if the AMC shuts down?',
            answer: 'Investor money remains safe because it is held in the mutual fund trust, not on the AMC\'s books. If an AMC shuts down, SEBI would either transfer the management of the schemes to another AMC or wind up the schemes and return money to investors at prevailing NAV. This has happened in practice — when Pioneer ITI MF was taken over by Franklin Templeton, and when Sahara MF\'s schemes were transferred, investor money was protected throughout.',
          },
          {
            question: 'Is this three-tier structure unique to India?',
            answer: 'The trust structure is common in countries following the UK model (India, UK, Australia). The US uses a corporate structure where the mutual fund is a company and investors are shareholders. The European model uses a contractual structure. Each has pros and cons, but India\'s trust model with SEBI regulation is considered one of the more investor-protective frameworks globally.',
          },
          {
            question: 'How is the three-tier structure tested in the NISM exam?',
            answer: 'NISM loves testing the relationships between the three entities. Common questions include: who appoints whom, what are the eligibility criteria for the Sponsor, how many trustees must be independent, what is the minimum net worth for an AMC, and what happens if the AMC violates regulations. Memorize the flow: Sponsor establishes Trust → appoints Trustee → Trustee appoints AMC (with SEBI approval). Also remember the key numbers: 40% minimum sponsor contribution, 2/3rd independent trustees, ₹50 crore AMC net worth.',
          },
        ],
        mcqs: [
          {
            question: 'A mutual fund in India is constituted as a:',
            options: ['Company under the Companies Act', 'Trust under the Indian Trusts Act, 1882', 'Partnership under the Partnership Act', 'Cooperative Society under the Cooperative Societies Act'],
            correctAnswer: 1,
            explanation: 'In India, a mutual fund is constituted as a trust under the Indian Trusts Act, 1882. It must be registered with SEBI under the SEBI (Mutual Funds) Regulations, 1996 (new 2026 regulations take effect from April 1, 2026). This trust structure provides fiduciary protection to unitholders.',
          },
          {
            question: 'In the three-tier structure of a mutual fund, the correct hierarchy is:',
            options: ['AMC establishes Trust, Sponsor appoints Trustee', 'Sponsor establishes Trust, Trustee appoints AMC', 'Trustee establishes Trust, AMC appoints Sponsor', 'SEBI establishes Trust, Sponsor appoints AMC'],
            correctAnswer: 1,
            explanation: 'The correct flow is: Sponsor establishes the mutual fund Trust → appoints Trustee → Trustee appoints AMC (with SEBI approval) → AMC manages the fund. This is one of the most frequently asked questions in the NISM VA exam.',
          },
          {
            question: 'The primary purpose of the three-tier structure in Indian mutual funds is to:',
            options: ['Maximize fund returns', 'Create more employment opportunities', 'Protect investor interests through separation of ownership, oversight, and management', 'Reduce the tax burden on investors'],
            correctAnswer: 2,
            explanation: 'The three-tier structure separates the Sponsor (ownership), Trustee (oversight), and AMC (management) to ensure that investor assets are protected. Even if the AMC faces financial difficulties, investor money in the trust remains safe.',
          },
          {
            question: 'Mutual funds in India have historically been registered under which SEBI regulation?',
            options: ['SEBI (Mutual Funds) Regulations, 1993', 'SEBI (Mutual Funds) Regulations, 1996', 'SEBI (Portfolio Managers) Regulations, 2020', 'SEBI (Investment Advisers) Regulations, 2013'],
            correctAnswer: 1,
            explanation: 'Mutual funds in India were registered and regulated under the SEBI (Mutual Funds) Regulations, 1996. While initial regulations were introduced in 1993, the comprehensive 1996 regulations governed the industry. Note: SEBI has notified new SEBI (Mutual Funds) Regulations, 2026, effective April 1, 2026, which streamline the framework from 162 pages to 88 pages.',
          },
        ],
        summaryNotes: [
          'Mutual fund = Trust under Indian Trusts Act, 1882 + registered with SEBI under SEBI (MF) Regulations, 1996 (new 2026 regulations effective April 1, 2026) — memorize both laws',
          'Three-tier flow: Sponsor (establishes trust) → Trustee (oversees on behalf of unitholders) → AMC (manages investments) — a critical NISM concept',
          'The separation ensures investor assets are safe even if the AMC goes bankrupt — money is in the trust, not on the AMC\'s books',
          'Real-world example: HDFC Ltd (Sponsor) → HDFC Trustee Company (Trustee) → HDFC AMC (Asset Manager) — three separate legal entities',
          'Every regulatory crisis in Indian MF history has only strengthened this three-tier wall — it is the bedrock of investor protection',
        ],
        relatedTopics: ['sponsor-trustee-role', 'amc-role', 'sebi-regulator', 'what-is-mutual-fund'],
      },
    },

    // ─── Section 2: Role of the Sponsor & Trustee ────────────────────────
    {
      id: 'sponsor-trustee-role',
      title: 'Role of the Sponsor & Trustee',
      slug: 'sponsor-trustee-role',
      content: {
        definition: 'The Sponsor is the entity that establishes the mutual fund trust, contributes a minimum of 40% of the net worth of the AMC, and must have at least 5 years of experience in financial services with positive net worth in all preceding 5 years. The Trustee — either a Board of Trustees or a Trustee Company — is appointed by the Sponsor to hold the mutual fund property on behalf of the unitholders and to oversee the functioning of the AMC. At least two-thirds of the trustees must be independent of the Sponsor, and trustees bear fiduciary responsibility for protecting investor interests.',
        explanation: 'The Sponsor and Trustee are the invisible shield that investors never see but always benefit from. The Sponsor is like the founder of a school. They set it up, put in the initial money, hire the principal (AMC), and appoint the governing board (Trustee). But once the school is running, the founder does not teach classes or grade exams. Their key contribution was vision, capital, and credibility. SEBI is very strict about who can be a Sponsor. The entity needs at least 5 years in financial services — a newcomer cannot simply decide to start a mutual fund. Positive net worth in all 5 preceding years is required — no loss-making entities allowed. And a minimum of 40% of the AMC\'s net worth must be contributed — ensuring skin in the game. The Trustee is the most underappreciated role in the entire structure. Industry observers have noted multiple instances where trustees have caught irregularities that would have cost investors crores. The trustee reviews every scheme before launch, monitors AMC compliance quarterly, and can even terminate the AMC if serious violations are found. At least 2/3rd of trustees must be independent — meaning they have no financial relationship with the Sponsor. This independence is critical. The trustee is the investor\'s representative in the boardroom.',
        realLifeExample: 'Consider SBI Mutual Fund — India\'s largest AMC by AUM (managing over ₹11 lakh crore as of early 2026). The Sponsor is State Bank of India, which is one of the most financially sound institutions in the country with over 100 years of financial services experience. SBI contributed 40% of the AMC\'s initial net worth. The Trustee is SBI Mutual Fund Trustee Company Private Limited. A real-world example of trustee oversight in action: when the Franklin Templeton debt fund crisis hit in April 2020 — where 6 schemes were abruptly wound up — it was the trustee\'s role that came under scrutiny. SEBI and the Supreme Court examined whether the trustees had adequately monitored the AMC\'s risk-taking. This led to enhanced trustee oversight regulations. The trustees at Franklin Templeton were expected to have flagged the concentration of illiquid bonds much earlier. After this episode, SEBI strengthened the trustee\'s quarterly reporting requirements and made it mandatory for trustees to report any scheme risk escalation to SEBI directly. As the industry saying goes: the trustee is the watchdog that is not heard barking — until something goes wrong, and then investors are grateful the watchdog was there.',
        keyPoints: [
          'Sponsor must have minimum 5 years of experience in financial services — SEBI does not allow newcomers to start mutual funds',
          'Sponsor must show positive net worth in all 5 preceding years — financial stability is a prerequisite',
          'Sponsor must contribute minimum 40% of the AMC\'s net worth — ensures "skin in the game"',
          'Trustee can be either a Board of Trustees (individuals) or a Trustee Company (corporate entity)',
          'Minimum 2/3rd of trustees must be independent — they cannot be associated with the Sponsor',
          'Trustee responsibilities: approve new schemes, ensure AMC compliance, report to SEBI, protect unitholder interests',
          'Trustee must hold meetings at least once every two months — minimum 6 meetings per year',
          'Trustee can terminate the AMC if serious violations are found — the ultimate check on AMC power',
        ],
        faq: [
          {
            question: 'Can a Sponsor be an individual person?',
            answer: 'No. A Sponsor must be a body corporate (company, bank, or financial institution). An individual cannot be a Sponsor of a mutual fund. The Sponsor entity must have the financial track record, net worth, and regulatory credibility that SEBI demands. For example, HDFC Ltd, SBI, ICICI Bank, Aditya Birla Group — all are established corporate entities.',
          },
          {
            question: 'What does "independent trustee" mean?',
            answer: 'An independent trustee is one who is not associated with the Sponsor in any capacity — not an employee, director, or shareholder of the Sponsor or its group companies. SEBI requires at least 2/3rd of trustees to be independent. This ensures that trustee decisions are not influenced by the Sponsor\'s business interests and remain aligned with unitholder protection.',
          },
          {
            question: 'What happens if the Sponsor sells its stake in the AMC?',
            answer: 'A change in Sponsor (or a significant change in Sponsor shareholding) requires prior SEBI approval. The new Sponsor must meet all eligibility criteria — 5 years of financial services experience, positive net worth, and 40% contribution. This is what happens during major AMC acquisitions. For example, when Nippon Life increased its stake in Reliance Nippon AMC (now Nippon India MF), SEBI approval was required at multiple stages.',
          },
          {
            question: 'Can the Trustee directly manage the fund\'s investments?',
            answer: 'No. The Trustee\'s role is oversight, not management. The Trustee appoints the AMC to manage the investments. The Trustee monitors, reviews, and ensures compliance — but they do not pick stocks or bonds. Think of the Trustee as the school governing board that supervises the principal but does not teach students.',
          },
          {
            question: 'How often does the Trustee review the AMC\'s activities?',
            answer: 'The Trustee must meet at least once every two months (minimum 6 meetings per year). During these meetings, they review: compliance with regulations, scheme performance, risk management, investor grievance redressal, and any deviation from the scheme\'s investment objective. Post the Franklin Templeton episode, SEBI has made these reviews more rigorous with mandatory escalation protocols.',
          },
        ],
        mcqs: [
          {
            question: 'The Sponsor of a mutual fund must contribute at least what percentage of the AMC\'s net worth?',
            options: ['25%', '30%', '40%', '51%'],
            correctAnswer: 2,
            explanation: 'As per SEBI (Mutual Funds) Regulations, the Sponsor must contribute a minimum of 40% of the net worth of the AMC. This ensures the Sponsor has significant "skin in the game" and a financial stake in the AMC\'s proper functioning.',
          },
          {
            question: 'What is the minimum proportion of independent trustees required on the Board of Trustees?',
            options: ['One-half (50%)', 'Two-thirds (66.67%)', 'Three-fourths (75%)', 'All trustees must be independent'],
            correctAnswer: 1,
            explanation: 'SEBI mandates that at least two-thirds of the trustees must be independent — meaning they have no association with the Sponsor. This ensures that trustee oversight is not compromised by Sponsor influence.',
          },
          {
            question: 'Which of the following is a mandatory eligibility criterion for a Sponsor?',
            options: ['Minimum 10 years of experience in any business', 'Positive net worth in all preceding 5 years and minimum 5 years in financial services', 'Must be a government entity', 'Must have minimum ₹100 crore net worth'],
            correctAnswer: 1,
            explanation: 'SEBI requires the Sponsor to have at least 5 years of experience in financial services and positive net worth in all 5 preceding years. These criteria ensure that only financially sound and experienced entities can establish mutual funds.',
          },
          {
            question: 'The Trustee of a mutual fund must hold meetings at least:',
            options: ['Once a month', 'Once every two months', 'Once a quarter', 'Once every six months'],
            correctAnswer: 1,
            explanation: 'As per SEBI regulations, Trustees must meet at least once every two months, which means a minimum of 6 meetings per year. During these meetings, they review the AMC\'s compliance, scheme performance, and investor grievance redressal.',
          },
        ],
        summaryNotes: [
          'Sponsor eligibility: 5 years in financial services + positive net worth in last 5 years + 40% of AMC net worth — the three magic numbers for NISM',
          'Trustee is the investor\'s invisible guardian — approves schemes, monitors AMC, can even terminate the AMC for serious violations',
          'At least 2/3rd trustees must be independent of the Sponsor — this ensures unbiased oversight',
          'Trustee meetings: minimum once every two months (6 per year) — they are not honorary positions, they carry real fiduciary liability',
          'The Franklin Templeton crisis taught the industry that strong trustee oversight is not optional — SEBI has since enhanced trustee accountability requirements',
        ],
        relatedTopics: ['three-tier-structure', 'amc-role', 'sebi-regulator', 'mf-industry-india'],
      },
    },

    // ─── Section 3: Role of the AMC ──────────────────────────────────────
    {
      id: 'amc-role',
      title: 'Role of the AMC (Asset Management Company)',
      slug: 'amc-role',
      content: {
        definition: 'The Asset Management Company (AMC) is the entity appointed by the Trustee, with the approval of SEBI, to manage the mutual fund\'s investments. The AMC employs fund managers, research analysts, and operational staff to manage the portfolio according to each scheme\'s stated investment objective. The AMC must maintain a minimum net worth of ₹50 crore, have at least 50% independent directors on its board, and is restricted to portfolio management, advisory, and related financial services. The AMC earns revenue through management fees, which form part of the scheme\'s Total Expense Ratio (TER).',
        explanation: 'The AMC is the engine room of the mutual fund — this is where the action happens. Over the past two decades, AMCs have evolved from small, opaque organizations to sophisticated, technology-driven asset managers. India now has 44+ AMCs managing a combined AUM of over ₹82 lakh crore (as of February 2026), serving 27+ crore folios. The AMC is essentially the "hired professional manager." It does not own the fund\'s assets (those belong to the trust), it does not oversee itself (that is the trustee\'s job), and it did not set up the fund (that is the sponsor\'s role). The AMC\'s job is singular: manage the money well, within the rules, and earn a fee for doing so. The net worth requirement was increased from ₹10 crore to ₹50 crore — SEBI wants AMCs to have serious financial muscle, not just intellectual capacity. This increase filtered out weak players and raised the entry bar significantly. An important point often overlooked in standard training: the AMC can only engage in portfolio management and advisory services. It cannot run a restaurant, build real estate, or start a tech company on the side. This restriction exists because SEBI does not want AMC management distracted from their primary job — managing investor money. The 50% independent director requirement on the AMC board adds another governance layer. These independent directors are expected to challenge the management, question risk-taking decisions, and represent the interests of unitholders in the boardroom.',
        realLifeExample: 'Consider a comparison of two AMCs to see how this works in practice. ICICI Prudential AMC has a net worth well above the ₹50 crore minimum — they manage over ₹9 lakh crore in AUM (as of early 2026). They employ some of India\'s most experienced fund managers, including individuals with 20+ years of market experience. Their research team covers hundreds of companies across sectors. The AMC charges a management fee that forms part of the TER — for example, an ICICI Prudential equity fund might charge a TER of 1.5-1.8% for the regular plan, of which the AMC\'s management fee might be around 0.8-1.0%. Now consider a smaller AMC like PPFAS Mutual Fund (Parag Parikh). Despite being much smaller (around ₹85,000 crore AUM), they meet all SEBI requirements — ₹50 crore net worth, 50% independent board, restricted to fund management. Their flagship Parag Parikh Flexi Cap Fund has consistently outperformed many larger AMC schemes. This shows that AMC size does not guarantee performance — what matters is the quality of the fund management team, the investment process, and adherence to the scheme mandate. Distributors should evaluate the AMC\'s track record, investment philosophy, and governance standards — not just brand name.',
        keyPoints: [
          'AMC is appointed by the Trustee with SEBI approval — it is the professional investment manager of the mutual fund',
          'Minimum net worth requirement: ₹50 crore (increased from ₹10 crore) — SEBI wants financially strong AMCs',
          'At least 50% of the AMC board must be independent directors — ensuring governance and accountability',
          'AMC can ONLY engage in portfolio management, advisory services, and management of offshore funds — no other business allowed',
          'The AMC employs fund managers, research analysts, compliance officers, and operations staff',
          'AMC earns management fees as part of the Total Expense Ratio (TER) — this is their revenue model',
          'The AMC does not own the fund\'s assets — those are held in the trust under trustee oversight',
          'One AMC can manage multiple schemes across equity, debt, hybrid, and other categories',
        ],
        faq: [
          {
            question: 'Why was the AMC net worth requirement increased from ₹10 crore to ₹50 crore?',
            answer: 'SEBI increased the minimum net worth to ₹50 crore to ensure that AMCs have adequate financial resources to invest in technology, talent, risk management systems, and compliance infrastructure. A higher net worth also acts as a buffer against operational risks and ensures that only serious, well-capitalized entities enter the mutual fund business. This change raised the entry barrier and improved overall industry quality.',
          },
          {
            question: 'Can an AMC manage more than one mutual fund?',
            answer: 'No. An AMC can manage only one mutual fund. However, within that one mutual fund, the AMC can launch and manage multiple schemes across different categories — equity, debt, hybrid, solution-oriented, etc. For example, SBI Funds Management manages SBI Mutual Fund (one fund) with over 100 schemes under it.',
          },
          {
            question: 'What is the difference between AMC management fee and TER?',
            answer: 'The management fee is what the AMC charges for managing the fund — it is a component of the Total Expense Ratio (TER). TER includes the management fee PLUS other expenses like custodian fees, audit fees, registrar fees, marketing expenses, and distributor commissions (in regular plans). So TER = Management fee + Other operating expenses + Distribution costs. SEBI caps the maximum TER based on AUM slabs.',
          },
          {
            question: 'Can the AMC invest in its own schemes?',
            answer: 'Yes, an AMC can invest in its own schemes, and SEBI has actually encouraged this through the "skin in the game" circular. SEBI mandated that a certain percentage of key employees\' compensation must be invested in the schemes they manage, with a lock-in period. This aligns the interests of fund managers and other key personnel with those of investors.',
          },
          {
            question: 'What happens if the AMC violates SEBI regulations?',
            answer: 'SEBI can take a range of actions: issue a warning, impose monetary penalties (which can run into crores), suspend the AMC\'s registration, or in extreme cases, cancel the registration. The Trustee can also terminate the AMC. For example, SEBI has penalized several AMCs for front-running violations, mis-selling, and inadequate risk management. These penalties serve as a deterrent and protect investor interests.',
          },
        ],
        mcqs: [
          {
            question: 'What is the minimum net worth required for an AMC as per current SEBI regulations?',
            options: ['₹10 crore', '₹25 crore', '₹50 crore', '₹100 crore'],
            correctAnswer: 2,
            explanation: 'SEBI has mandated a minimum net worth of ₹50 crore for AMCs. This was increased from the earlier requirement of ₹10 crore to ensure that only financially strong entities manage investor money.',
          },
          {
            question: 'What percentage of the AMC board must comprise independent directors?',
            options: ['At least 25%', 'At least 33%', 'At least 50%', 'At least 75%'],
            correctAnswer: 2,
            explanation: 'SEBI mandates that at least 50% (half) of the AMC\'s board of directors must be independent directors. This ensures good corporate governance and protects investor interests by providing an independent check on the AMC management.',
          },
          {
            question: 'An AMC is permitted to engage in which of the following businesses?',
            options: ['Real estate development and portfolio management', 'Only portfolio management, advisory services, and management of offshore funds', 'Any business approved by its board of directors', 'Banking and portfolio management'],
            correctAnswer: 1,
            explanation: 'An AMC can only engage in portfolio management, advisory services, and management of offshore funds. It is explicitly prohibited from carrying on any other business. This restriction ensures that the AMC\'s management bandwidth remains focused on managing investor money.',
          },
          {
            question: 'Who appoints the AMC to manage a mutual fund?',
            options: ['SEBI directly', 'The Sponsor', 'The Trustee, with SEBI approval', 'The unitholders through voting'],
            correctAnswer: 2,
            explanation: 'The Trustee appoints the AMC with the approval of SEBI. This ensures that both the trustee (acting on behalf of unitholders) and the regulator are satisfied with the AMC\'s credentials before it is entrusted with managing investor money.',
          },
        ],
        summaryNotes: [
          'AMC = professional fund manager appointed by Trustee with SEBI approval — it manages money but does not own the assets',
          'Key numbers for NISM: ₹50 crore minimum net worth, 50% independent directors, ONLY portfolio management and advisory business allowed',
          'AMC revenue comes from management fees (part of TER) — TER is capped by SEBI based on AUM slabs',
          'One AMC manages one mutual fund with multiple schemes — do not confuse fund with scheme',
          'SEBI\'s "skin in the game" circular requires key AMC employees to invest in the schemes they manage — aligning interests with investors',
        ],
        relatedTopics: ['three-tier-structure', 'sponsor-trustee-role', 'custodian-rta-auditor', 'advantages-of-mf'],
      },
    },

    // ─── Section 4: Role of Custodian, RTA & Auditor ─────────────────────
    {
      id: 'custodian-rta-auditor',
      title: 'Role of Custodian, RTA & Auditor',
      slug: 'custodian-rta-auditor',
      content: {
        definition: 'The Custodian is a SEBI-registered entity that holds the securities (stocks, bonds, government securities) in the mutual fund\'s portfolio in safekeeping and handles the settlement of trades. The Registrar and Transfer Agent (RTA) maintains all investor records, processes transactions (purchases, redemptions, switches), and generates account statements. The Auditor independently audits the AMC\'s books and each scheme\'s accounts separately to ensure financial accuracy and regulatory compliance. Together, these three entities form the operational backbone that supports the AMC\'s investment management function.',
        explanation: 'While most people know about the AMC and SEBI, many are unaware of the critical roles played by the Custodian, RTA, and Auditor. Yet these are the entities that ensure investor money is actually safe, properly recorded, and honestly reported. A helpful analogy: the AMC is the pilot, but the Custodian is the aircraft maintenance crew that keeps the plane safe, the RTA is the air traffic control that tracks every flight, and the Auditor is the aviation safety inspector who checks that everyone is following the rules. The Custodian holds all the securities purchased by the fund — the actual shares and bonds sit with the custodian, not the AMC. This is a critical safety feature. SEBI mandates that the custodian cannot be associated with the Sponsor — another wall of separation. In India, major custodians include subsidiaries of stock exchanges and depository participants. An important point about RTAs: CAMS and KFin Technologies (KFintech) together handle approximately 99% of all mutual fund transactions in India. When an investor transacts through any platform — whether it is an AMC website, a distributor portal, or a fintech app — the transaction ultimately flows through the RTA. They are the single source of truth for who owns how many units of which scheme.',
        realLifeExample: 'Consider how these three entities work together with a real transaction. Suppose an investor named Priya invests ₹1,00,000 in Axis Bluechip Fund (a large-cap equity fund).\n\nStep 1 — Transaction Processing: Priya places the order through a distributor\'s MFD platform. The order flows to CAMS (Axis MF\'s RTA). CAMS verifies her KYC, processes the transaction, allots units at the day\'s NAV, and updates her folio.\n\nStep 2 — Securities Custody: The fund manager at Axis AMC decides to deploy this money by buying shares of Reliance Industries (₹30,000), HDFC Bank (₹25,000), Infosys (₹20,000), and TCS (₹25,000). These shares are purchased on the stock exchange and settled through the custodian — say, Deutsche Bank AG (custodian for Axis MF). The shares sit in the custodian\'s demat account in the name of the mutual fund scheme — not in Axis AMC\'s name.\n\nStep 3 — Audit Trail: At the end of the financial year, the scheme auditor independently verifies that the portfolio reported by Axis AMC matches what is actually held by the custodian. They also verify that NAV calculations are accurate, expenses are within SEBI-mandated TER limits, and all SEBI regulations have been followed. The AMC accounts and each scheme\'s accounts are audited separately.\n\nThis three-way verification — RTA confirming investor records, custodian confirming asset holdings, and auditor confirming everything matches — is what makes the Indian mutual fund system one of the most robust in the world.',
        keyPoints: [
          'Custodian holds all fund securities in safekeeping — shares and bonds sit with the custodian, NOT the AMC',
          'Custodian cannot be associated with the Sponsor — SEBI mandates this separation to prevent conflicts of interest',
          'Major custodians in India are typically subsidiaries of banks or depository institutions',
          'RTA (Registrar & Transfer Agent) processes all investor transactions — purchases, redemptions, switches, and SIP registrations',
          'Two major RTAs dominate India: CAMS (Computer Age Management Services) and KFin Technologies — together handling approximately 99% of all MF transactions',
          'RTA maintains the definitive record of who owns how many units — they generate the folio number and CAS',
          'Auditor audits AMC accounts and each scheme\'s accounts separately — ensuring financial accuracy and SEBI compliance',
          'The three-way verification (RTA records + custodian holdings + auditor confirmation) is the gold standard of operational integrity',
        ],
        faq: [
          {
            question: 'Why can\'t the custodian be associated with the Sponsor?',
            answer: 'SEBI mandates this separation to prevent any conflict of interest. If the custodian were controlled by the Sponsor, there is a theoretical risk that securities could be misrepresented or mishandled to benefit the Sponsor at the expense of investors. An independent custodian provides an additional layer of verification and protection — they have no incentive to collude with the AMC or Sponsor.',
          },
          {
            question: 'What is the difference between CAMS and KFin Technologies?',
            answer: 'Both are SEBI-registered RTAs that provide the same services — transaction processing, record-keeping, statement generation, and investor servicing. The difference is which AMC uses which RTA. For example, HDFC MF, ICICI Prudential MF, and Axis MF use CAMS, while SBI MF and Nippon India MF use KFin Technologies. Investors and distributors interact with both through their respective portals (MyCams and KFintech) or through the consolidated CAS.',
          },
          {
            question: 'What exactly does the scheme auditor verify?',
            answer: 'The scheme auditor independently verifies: (1) NAV calculations are accurate, (2) portfolio holdings reported by the AMC match securities held by the custodian, (3) expenses charged to the scheme are within SEBI-mandated TER limits, (4) income distribution and capital gains are correctly computed, (5) all SEBI regulations related to the scheme have been followed. The AMC\'s own accounts are audited separately from each scheme — this prevents any cross-subsidization.',
          },
          {
            question: 'Can investors access MF records directly from the RTA without going through the AMC?',
            answer: 'Yes, absolutely. Investors can access their mutual fund records directly through the RTA portals — MyCams (mycams.in) for CAMS-serviced AMCs and KFintech (kfintech.com) for KFin-serviced AMCs. A Consolidated Account Statement (CAS) is available from either RTA showing all MF holdings across all AMCs linked to the investor\'s PAN. Many experienced investors prefer the RTA portal for a unified view.',
          },
        ],
        mcqs: [
          {
            question: 'Which of the following entities holds the securities in a mutual fund\'s portfolio?',
            options: ['The AMC', 'The Sponsor', 'The Custodian', 'The Trustee'],
            correctAnswer: 2,
            explanation: 'The Custodian is a SEBI-registered entity that holds all securities (stocks, bonds, government securities) in the mutual fund\'s portfolio in safekeeping. The securities are held in the custodian\'s demat account in the name of the scheme — not in the AMC\'s name. This separation protects investor assets.',
          },
          {
            question: 'Which two RTAs together handle approximately 99% of mutual fund transactions in India?',
            options: ['NSDL and CDSL', 'CAMS and KFin Technologies', 'BSE and NSE', 'CRISIL and ICRA'],
            correctAnswer: 1,
            explanation: 'CAMS (Computer Age Management Services) and KFin Technologies are the two dominant RTAs in India, together processing approximately 99% of all mutual fund transactions. They maintain investor records, process purchases/redemptions, and generate account statements.',
          },
          {
            question: 'The custodian of a mutual fund scheme cannot be associated with:',
            options: ['The AMC', 'The Sponsor', 'The RTA', 'Any of the above'],
            correctAnswer: 1,
            explanation: 'SEBI mandates that the custodian cannot be associated with the Sponsor of the mutual fund. This separation prevents conflicts of interest and ensures independent safekeeping of investor assets. The custodian must be a separate, SEBI-registered entity.',
          },
          {
            question: 'The auditor of a mutual fund is required to audit:',
            options: ['Only the AMC\'s books', 'Only the scheme accounts', 'AMC accounts and each scheme\'s accounts separately', 'Only the trustee company\'s accounts'],
            correctAnswer: 2,
            explanation: 'The auditor must audit the AMC\'s own accounts and each mutual fund scheme\'s accounts separately. This ensures that there is no cross-subsidization between the AMC\'s finances and the scheme\'s assets, and that each scheme\'s expenses are within the SEBI-mandated TER limits.',
          },
        ],
        summaryNotes: [
          'Custodian = safe-keeper of securities, RTA = record-keeper of investors, Auditor = verifier of everything — three pillars of operational integrity',
          'Custodian CANNOT be associated with the Sponsor — another SEBI-mandated wall of separation for investor protection',
          'CAMS + KFin Technologies (KFintech) = ~99% of all MF transaction processing — they are the operational backbone of the industry',
          'AMC accounts and scheme accounts are audited SEPARATELY — this prevents the AMC from dipping into scheme money',
          'The three-way verification (RTA confirming investors, custodian confirming assets, auditor confirming accuracy) makes Indian MFs one of the most transparent investment vehicles globally',
        ],
        relatedTopics: ['three-tier-structure', 'amc-role', 'how-mutual-funds-work', 'sebi-regulator'],
      },
    },

    // ─── Section 5: Role of SEBI — The Regulator ─────────────────────────
    {
      id: 'sebi-regulator',
      title: 'Role of SEBI — The Regulator',
      slug: 'sebi-regulator',
      content: {
        definition: 'The Securities and Exchange Board of India (SEBI) is the statutory regulator of the entire mutual fund industry in India, established under the SEBI Act, 1992. SEBI has historically regulated mutual funds through the SEBI (Mutual Funds) Regulations, 1996, and has now notified the new SEBI (Mutual Funds) Regulations, 2026 — effective from April 1, 2026 — which streamline the regulatory framework from 162 pages to 88 pages. These regulations govern every aspect — from registration and structure to operations, disclosures, expense ratios, and investor protection. Key SEBI powers include granting and revoking AMC registrations, conducting inspections and investigations, imposing penalties, and protecting investor interests through platforms like SCORES. Recent SEBI initiatives include TER rationalization, risk-o-meter implementation, side-pocketing regulations, and expanding mutual fund scheme categories from 36 to 40 (effective April 2026).',
        explanation: 'Over the years, SEBI has evolved from a relatively passive regulator to one of the most proactive securities regulators in the world. SEBI is to mutual funds what the RBI is to banks — the supreme authority whose word is law. Every single thing an AMC does — launching a new scheme, charging expenses, publishing NAV, hiring a fund manager, changing the scheme\'s mandate — needs SEBI\'s framework or approval. SEBI\'s power over the mutual fund industry is comprehensive and far-reaching. It registers the AMC, approves the trustee, sets TER caps, defines scheme categories (currently 36, expanding to 40 from April 2026), mandates disclosures, handles investor complaints, and can even shut down an AMC if needed. An important perspective often missed in standard training: the regulatory framework in place today was built brick by brick after every crisis. The UTI US-64 crisis led to restructuring regulations. The Franklin Templeton wind-up led to enhanced trustee oversight and side-pocketing rules. Every crisis has made SEBI stronger and investor protection better. Distributors benefit directly from SEBI\'s vigilance — it is the reason investors trust the mutual fund system enough to invest their hard-earned money. The industry now manages over ₹82 lakh crore in AUM across 44+ AMCs, with 27+ crore folios — a testament to the confidence SEBI\'s regulatory framework inspires. The SCORES platform (SEBI Complaint Redress System) is particularly important for distributors. If a client has a complaint against an AMC that is not resolved within 30 days, they can escalate it to SEBI through SCORES. SEBI treats these complaints seriously — AMCs that do not resolve SCORES complaints face regulatory consequences.',
        realLifeExample: 'Here are three real examples of SEBI\'s regulatory impact that changed the industry:\n\nExample 1 — TER Rationalization (2018): Before 2018, AMCs charged high expense ratios — some equity funds had TERs of 2.5-3%. SEBI issued a circular reducing the TER slabs significantly. For equity funds with AUM above ₹50,000 crore, the maximum TER dropped to about 1.05%. This saved investors thousands of crores annually. An investor deploying ₹10 lakh in a fund with TER reduced from 2.5% to 1.5% saves approximately ₹10,000 per year — compounded over 20 years, this is a substantial amount.\n\nExample 2 — Risk-o-Meter (2020): SEBI introduced the "Riskometer" — a visual gauge that classifies every mutual fund scheme into one of six risk categories: Low, Low to Moderate, Moderate, Moderately High, High, and Very High. AMCs must update the riskometer monthly based on portfolio composition. This made it simple for investors to understand the risk level of their investments at a glance.\n\nExample 3 — Side-Pocketing (2018): After the IL&FS and DHFL credit events, SEBI introduced side-pocketing rules allowing AMCs to segregate distressed assets into a separate portfolio. This protects existing investors from forced selling at distressed prices. When a bond in a debt fund gets downgraded, the AMC can create a "side pocket" — investors retain their units in the main portfolio while the distressed asset is managed separately for recovery.',
        keyPoints: [
          'SEBI was established under the SEBI Act, 1992 — it is the statutory regulator for all securities markets in India including mutual funds',
          'Mutual funds have been regulated under SEBI (Mutual Funds) Regulations, 1996 — now being replaced by the new SEBI (MF) Regulations, 2026, effective April 1, 2026 (streamlined from 162 to 88 pages)',
          'SEBI powers include: registration/deregistration of AMCs, inspection, investigation, imposing penalties, and investor protection',
          'SEBI SCORES (Complaint Redress System) is the online platform for investor complaints — AMCs must resolve complaints within 30 days',
          'TER rationalization (2018) significantly reduced expense ratios, saving investors thousands of crores annually',
          'Risk-o-meter classifies schemes into 6 risk categories (Low to Very High) — updated monthly based on portfolio composition',
          'Side-pocketing allows segregation of distressed assets to protect existing investors from forced selling',
          'SEBI\'s mutual fund categorization circular (2017) organized all schemes into 36 clearly defined categories — one scheme per category per AMC; expanding to 40 categories from April 2026',
        ],
        faq: [
          {
            question: 'What is SEBI SCORES and how does it help investors?',
            answer: 'SEBI SCORES (Complaint Redress System) is an online platform at scores.sebi.gov.in where investors can lodge complaints against market intermediaries including AMCs. Once a complaint is filed, the AMC must respond within 30 days. If the response is unsatisfactory, the investor can escalate it. SEBI tracks resolution rates and AMCs with poor complaint resolution can face regulatory action. Distributors who educate their clients about SCORES build stronger trust.',
          },
          {
            question: 'How does the SEBI risk-o-meter work?',
            answer: 'The risk-o-meter classifies every scheme into one of six categories based on portfolio composition: Low, Low to Moderate, Moderate, Moderately High, High, and Very High. SEBI mandates that AMCs evaluate and update the riskometer on a monthly basis. If the risk level changes, investors must be informed via email or SMS. The riskometer helps investors make informed decisions and must be prominently displayed in scheme factsheets and marketing material.',
          },
          {
            question: 'What is side-pocketing and when is it used?',
            answer: 'Side-pocketing is a mechanism that allows AMCs to segregate distressed assets (typically bonds that have been downgraded to below investment grade) from a scheme\'s main portfolio. When a bond in a debt fund defaults or gets sharply downgraded, the AMC can create a "side pocket." Investors in the main portfolio are protected from the distressed asset\'s impact, while units equivalent to the distressed asset are placed in a separate side pocket for eventual recovery. This prevents forced selling and panic redemptions.',
          },
          {
            question: 'What are the maximum TER limits set by SEBI?',
            answer: 'SEBI caps TER on a slab basis linked to daily net assets. For equity-oriented schemes: up to ₹500 crore AUM — maximum 2.25% for regular plans; above ₹50,000 crore — approximately 1.05%. For other-than-equity (debt) schemes, the limits are slightly lower. Direct plans are charged 0.25-1% less than regular plans since they exclude distributor commissions. These TER caps ensure that investors are not overcharged by AMCs.',
          },
          {
            question: 'Can SEBI shut down an AMC?',
            answer: 'Yes. SEBI has the power to suspend or cancel an AMC\'s registration for serious violations. While this is an extreme step, SEBI has used it in the past — for instance, Sahara Mutual Fund\'s registration was cancelled due to regulatory non-compliance. In such cases, SEBI ensures that investor money is protected by transferring scheme management to another AMC or winding up the schemes at prevailing NAV.',
          },
        ],
        mcqs: [
          {
            question: 'SEBI regulates mutual funds under which legislation?',
            options: ['SEBI Act, 1992 only', 'SEBI (Mutual Funds) Regulations, 1996 (being replaced by 2026 regulations)', 'Indian Trusts Act, 1882', 'Companies Act, 2013'],
            correctAnswer: 1,
            explanation: 'While SEBI derives its authority from the SEBI Act, 1992, mutual funds have been specifically regulated under the SEBI (Mutual Funds) Regulations, 1996. SEBI has notified the new SEBI (Mutual Funds) Regulations, 2026, effective from April 1, 2026, streamlined from 162 pages to 88 pages. These regulations cover every aspect of mutual fund operations — from registration to disclosures to investor protection.',
          },
          {
            question: 'The SEBI risk-o-meter classifies mutual fund schemes into how many risk categories?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 3,
            explanation: 'The SEBI risk-o-meter classifies schemes into 6 risk categories: Low, Low to Moderate, Moderate, Moderately High, High, and Very High. This classification must be updated monthly based on the actual portfolio composition.',
          },
          {
            question: 'What is the purpose of side-pocketing in mutual funds?',
            options: ['To increase fund returns', 'To segregate distressed assets from the main portfolio to protect existing investors', 'To avoid paying taxes on gains', 'To hide losses from investors'],
            correctAnswer: 1,
            explanation: 'Side-pocketing allows AMCs to segregate distressed assets (such as downgraded bonds) from the main portfolio. This protects existing investors from the impact of distressed assets and prevents panic redemptions. The distressed asset is managed separately for recovery.',
          },
          {
            question: 'SEBI SCORES is a platform for:',
            options: ['Rating mutual fund schemes', 'Processing mutual fund transactions', 'Investor complaint redressal', 'Publishing daily NAV'],
            correctAnswer: 2,
            explanation: 'SEBI SCORES (Complaint Redress System) is an online platform where investors can lodge complaints against market intermediaries including AMCs. It is SEBI\'s primary mechanism for investor grievance redressal, with mandated resolution timelines.',
          },
        ],
        summaryNotes: [
          'SEBI = supreme regulator of mutual funds under SEBI Act, 1992 + SEBI (MF) Regulations, 1996 (new 2026 regulations from April 1, 2026) — they register, regulate, inspect, and penalize',
          'SCORES (scores.sebi.gov.in) is the investor complaint platform — AMCs must resolve complaints within 30 days or face consequences',
          'TER rationalization (2018) dramatically cut expense ratios — saving investors thousands of crores annually across the industry',
          'Risk-o-meter (6 levels: Low to Very High) must be updated monthly and displayed prominently — helps investors understand scheme risk at a glance',
          'Side-pocketing (2018) protects investors when bonds default — distressed assets are separated, main portfolio continues normally',
        ],
        relatedTopics: ['three-tier-structure', 'amfi-role', 'mf-industry-india', 'advantages-of-mf'],
      },
    },

    // ─── Section 6: Role of AMFI ─────────────────────────────────────────
    {
      id: 'amfi-role',
      title: 'Role of AMFI — Industry Association & ARN',
      slug: 'amfi-role',
      content: {
        definition: 'AMFI (Association of Mutual Funds in India) is the industry body representing all SEBI-registered Asset Management Companies. AMFI is NOT a regulator — it is a self-regulatory organization (SRO) that promotes ethical business practices, investor awareness, and professional standards across the mutual fund industry. All AMCs are members of AMFI. Key AMFI functions include ARN (AMFI Registration Number) registration for mutual fund distributors, coordination of the NISM certification exam, publishing daily NAV on amfiindia.com, running the "Mutual Funds Sahi Hai" investor awareness campaign, and issuing the EUIN (Employee Unique Identification Number) for all sales personnel.',
        explanation: 'A key distinction that the NISM exam tests repeatedly and many candidates get wrong: AMFI is NOT a regulator. SEBI is the regulator. AMFI is an industry association — like CII (Confederation of Indian Industry) is for businesses or NASSCOM is for the IT industry. But AMFI has some quasi-regulatory powers delegated by SEBI, especially around distributor registration and code of conduct. AMFI plays a central role in every distributor\'s professional life. The ARN number — which every MF distributor must have — is issued by AMFI. There are currently over 1.3 lakh ARN holders registered with AMFI across India. The NISM VA exam that candidates need to pass to get an ARN? AMFI coordinates that too. The AMFI website (amfiindia.com) publishes NAVs for every scheme of every AMC, every single day. An important fact about AMFI: the "Mutual Funds Sahi Hai" campaign launched in March 2017 was arguably the single most impactful marketing initiative in Indian financial services history. Before this campaign, mutual funds were seen as risky and complicated by the average Indian. The campaign\'s simple messaging — across TV, digital, radio, and print — fundamentally changed public perception. The campaign cost is borne by AMCs collectively through AMFI, funded by a small charge from each scheme\'s TER. Distributors directly benefit from the awareness this campaign creates. When a client walks in already aware of mutual funds and SIPs, the distributor\'s job becomes education and recommendation rather than basic awareness-building.',
        realLifeExample: 'Consider the ARN and EUIN system that directly affects every distributor\'s career.\n\nRajesh wants to become a mutual fund distributor. Here is his journey:\n\nStep 1 — NISM Exam: Rajesh registers for the NISM Series VA (Mutual Fund Distributors) exam through the NISM website. The exam has 100 questions, 2-hour duration, and he needs 50% to pass. Fee is approximately ₹1,500.\n\nStep 2 — ARN Registration: After passing NISM VA, Rajesh applies for an ARN (AMFI Registration Number) through AMFI. He submits his NISM certificate, KYC documents, and pays the registration fee. AMFI issues ARN-123456 — this is his unique identity as a mutual fund distributor, making him one of the 1.3+ lakh ARN holders across India.\n\nStep 3 — EUIN: If Rajesh works for a distributor firm (like a bank or national distributor), the firm issues him an EUIN (Employee Unique Identification Number) — say E123456. This EUIN must be mentioned in every transaction Rajesh processes. It links each transaction to the specific sales person, ensuring accountability.\n\nStep 4 — Renewal: Rajesh\'s NISM certificate is valid for 3 years. He must pass the NISM exam again (or complete CPE — Continuing Professional Education) before expiry to continue distributing mutual funds. His ARN must also be renewed periodically.\n\nAs a real-world example, when an investor complaint arises — say, the investor claims they were mis-sold a fund — SEBI and AMFI can trace it back to the specific distributor (ARN) and specific sales person (EUIN) who processed the transaction. This accountability framework protects both investors and honest distributors.\n\nThe AMFI website (amfiindia.com) is also the authoritative source for daily NAV of all schemes across all 44+ AMCs. When there is a dispute about which NAV was applicable for a transaction, the AMFI-published NAV is the reference point.',
        keyPoints: [
          'AMFI is the industry body (Association of Mutual Funds in India) — it is NOT a regulator like SEBI',
          'All SEBI-registered AMCs are members of AMFI — it represents the collective voice of the MF industry',
          'ARN (AMFI Registration Number) is mandatory for all mutual fund distributors — no one can distribute MFs without an ARN',
          'EUIN (Employee Unique Identification Number) is mandatory for all sales personnel working under a distributor — ensures individual accountability',
          'AMFI coordinates the NISM Series VA exam — the qualifying exam for mutual fund distributors',
          'amfiindia.com publishes daily NAV for every scheme of every AMC — the authoritative source for NAV data',
          'The "Mutual Funds Sahi Hai" campaign (launched March 2017) by AMFI transformed public perception of mutual funds in India',
          'AMFI\'s Code of Conduct for intermediaries sets ethical standards for distributors — violations can lead to ARN suspension',
        ],
        faq: [
          {
            question: 'What is the difference between AMFI and SEBI?',
            answer: 'SEBI is the statutory regulator — it makes the rules, enforces them, and has legal powers to penalize violators. AMFI is an industry association — it represents AMCs, promotes best practices, and performs some delegated functions like ARN registration. Think of it this way: SEBI is the traffic police, AMFI is the automobile manufacturers\' association. Both want safe roads, but only the police can issue challans.',
          },
          {
            question: 'How do I get an ARN number?',
            answer: 'Step 1: Pass the NISM Series VA (Mutual Fund Distributors) exam. Step 2: Apply for ARN through AMFI by submitting the NISM certificate, KYC documents, PAN card, and registration fee. Step 3: AMFI verifies the documents and issues the ARN — typically within 2-3 weeks. The ARN is valid as long as the NISM certification is valid (3 years, renewable through re-exam or CPE). Without a valid ARN, a distributor cannot earn commissions from any AMC.',
          },
          {
            question: 'What is EUIN and why is it important?',
            answer: 'EUIN (Employee Unique Identification Number) is a unique identification assigned to every individual who sells mutual funds under a distributor entity. If the ARN is like the company\'s registration number, the EUIN is like the employee ID within that company. SEBI mandates that every MF transaction must carry both the ARN and EUIN. This ensures that if there is any mis-selling complaint, the specific individual responsible can be identified and held accountable — not just the distributor firm.',
          },
          {
            question: 'What happens if a distributor\'s NISM certification expires?',
            answer: 'If a distributor\'s NISM Series VA certificate expires (it is valid for 3 years) and is not renewed through re-examination or CPE (Continuing Professional Education), the ARN becomes inactive. This means the distributor cannot process any new mutual fund transactions and will not earn commissions. However, trail commission on existing folios may continue for a limited period. The renewal process is straightforward — either pass the NISM VA exam again or complete the required CPE hours before the certificate expires.',
          },
          {
            question: 'What is the "Mutual Funds Sahi Hai" campaign?',
            answer: 'Launched by AMFI in March 2017, this is India\'s largest investor awareness campaign for mutual funds. It uses simple, relatable messaging across TV commercials, digital platforms, radio, and print media to educate Indians about the benefits of mutual fund investing and SIPs. The campaign\'s cost is funded collectively by AMCs through a portion of the scheme TER. It is widely credited with accelerating retail participation — monthly SIP flows grew from about ₹4,500 crore in 2017 to over ₹26,000 crore by early 2026, partly driven by the awareness this campaign created.',
          },
        ],
        mcqs: [
          {
            question: 'AMFI is best described as:',
            options: ['The statutory regulator of mutual funds', 'An industry body representing all AMCs in India', 'A government department under the Ministry of Finance', 'A stock exchange for mutual fund units'],
            correctAnswer: 1,
            explanation: 'AMFI (Association of Mutual Funds in India) is an industry body — not a regulator. All SEBI-registered AMCs are members of AMFI. SEBI is the statutory regulator. This distinction is frequently tested in the NISM VA exam.',
          },
          {
            question: 'ARN stands for:',
            options: ['Asset Registration Number', 'AMFI Registration Number', 'Annual Returns Notification', 'Authorized Representative Number'],
            correctAnswer: 1,
            explanation: 'ARN stands for AMFI Registration Number. It is the unique identification number issued by AMFI to mutual fund distributors after they pass the NISM Series VA exam. No person can distribute mutual funds without a valid ARN.',
          },
          {
            question: 'EUIN is mandatory for:',
            options: ['All mutual fund investors', 'Only AMC employees', 'All individual sales personnel involved in mutual fund distribution', 'Only online distribution platforms'],
            correctAnswer: 2,
            explanation: 'EUIN (Employee Unique Identification Number) is mandatory for every individual who sells or advises on mutual fund products under a distributor entity. It ensures individual accountability for each transaction and helps trace mis-selling complaints to the specific person responsible.',
          },
          {
            question: 'The "Mutual Funds Sahi Hai" campaign was launched by:',
            options: ['SEBI', 'RBI', 'AMFI', 'Ministry of Finance'],
            correctAnswer: 2,
            explanation: 'The "Mutual Funds Sahi Hai" investor awareness campaign was launched by AMFI in March 2017. It is funded collectively by all AMCs through a small allocation from scheme TER. It is widely credited with increasing retail participation and SIP adoption in India.',
          },
        ],
        summaryNotes: [
          'AMFI ≠ SEBI — AMFI is the industry body (like NASSCOM for IT), SEBI is the regulator (like the traffic police) — never confuse the two in the NISM exam',
          'ARN (AMFI Registration Number) is the license to distribute mutual funds — no ARN means no commissions, period',
          'EUIN tracks every sales person individually — both ARN and EUIN must appear on every MF transaction for accountability',
          'NISM Series VA is the qualifying exam for MF distributors — 100 questions, 2 hours, 50% passing score, valid for 3 years',
          '"Mutual Funds Sahi Hai" (AMFI, 2017) is the most successful financial awareness campaign in India — it drove SIP flows from ₹4,500 crore/month to ₹26,000+ crore/month by early 2026',
        ],
        relatedTopics: ['sebi-regulator', 'three-tier-structure', 'mf-industry-india', 'mf-misconceptions'],
      },
    },
  ],
};
