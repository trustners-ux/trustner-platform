/**
 * Weekly Market Brief newsletter archive.
 *
 * Newest entry first. Each issue is a 3-page magazine-style PDF covering
 * 14 market sections, published every Sunday for the previous week.
 */

export interface NewsletterIssue {
  id: string;
  issueNumber: number;
  volume: number;
  title: string;
  weekRange: string;
  publishDate: string; // ISO date
  summary: string;
  pdfPath: string; // relative to /public, served as /newsletters/<file>.pdf
  fileSize: string; // human readable, e.g. "720 KB"
  highlights: string[]; // 3-4 quick bullets to preview the issue
  featured?: boolean; // set true on the latest issue
}

export const newsletters: NewsletterIssue[] = [
  {
    id: 'week-2026-06-28',
    issueNumber: 17,
    volume: 1,
    title:
      'The Quiet Win — A Holiday-Shortened Week Drifts to a Third Straight Gain as Volatility Hits a 5-Month Low; Nifty +0.18% to 24,056, Sensex +0.4% to 77,100',
    weekRange: 'June 22 - June 28, 2026',
    publishDate: '2026-06-28',
    summary:
      'A quiet, holiday-shortened week — and a notably calm one. Indian markets traded only four sessions (shut Friday 26 June for Muharram) and still extended their winning run to a third consecutive week, the longest such streak in about seven months. After a firm Monday, a Tuesday wobble saw the Nifty slip 1.16% to 23,824 on profit-taking, before a steady two-day recovery (Wednesday +0.83% to 24,021.65, Thursday +0.14% to 24,056.00) carried the week back into the green. The benchmarks closed marginally higher — the Nifty 50 added 0.18% to 24,056.00 and the Sensex about 0.4% to 77,100.47. The defining feature was the calm: India VIX eased to roughly 13.0, a five-month low, as soft crude (Brent near $72-73/bbl) and a dovish RBI — Governor Sanjay Malhotra ruling out near-term rate hikes — kept the mood steady. Leadership rotated to autos (Nifty Auto +2.25%) and defensives (FMCG, realty, pharma), while metals, oil & gas and IT lagged; large-caps edged ahead of a slightly softer broader market. Domestic institutions did the heavy lifting on flows — the SIP-and-insurance floor again out-buying modest foreign interest. There was no single dominant geopolitical driver this week: markets simply drifted gently higher on an absence of bad news. The companion blog explains why these quiet, uneventful weeks are exactly where long-term wealth is built. (Figures are as of the Thursday 25 June close; items that could not be independently cross-verified are stated approximately or omitted.)',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-June-27-2026.pdf',
    fileSize: '820 KB',
    highlights: [
      'Nifty +0.18% WoW to 24,056.00 · Sensex +0.4% to 77,100.47 — a third straight weekly gain in a 4-session week (shut Fri 26 Jun for Muharram)',
      'A Tuesday dip (Nifty −1.16% to 23,824) gave way to a steady two-day recovery; India VIX eased to ~13.0, a five-month low',
      'Autos led (Nifty Auto +2.25%) with FMCG/realty/pharma firm; metals, oil & gas and IT lagged — a low-conviction, rotational week',
      'Domestic institutions did the buying (SIP floor) vs modest foreign interest · soft Brent ~$72-73 + dovish RBI (no near-term hikes) kept the calm',
    ],
    featured: true,
  },
  {
    id: 'week-2026-06-21',
    issueNumber: 16,
    volume: 1,
    title: 'A Strong Week with a Friday Reminder — Nifty +1.65% to 24,013, Sensex +1.69%; US-Iran Peace Crashes Oil ~8%, Then an Accenture-Led IT Rout',
    weekRange: 'June 15 - June 21, 2026',
    publishDate: '2026-06-21',
    summary:
      'A strong week, with a sharp reminder tucked into the last session. Indian equities rallied for five straight sessions from Monday to Thursday — the Nifty peaking near 24,168 — before giving back part of the gains on Friday. The week still closed firmly higher: the Nifty 50 added 1.65% to 24,013.10 (+390 points) and the Sensex rose 1.69% to 76,802.90 (+1,275 points). The rally\'s engine was a sharp easing of Middle-East tension — the prospect of a formalised US-Iran peace framework, with the Strait of Hormuz reopening to Iranian exports — which crashed crude oil by roughly 8% to near $80/bbl, a clean tailwind for an economy that imports over 80% of its oil; defence stocks surged on reported India-Vietnam BrahMos deal news. Then came Friday\'s reminder: a single corporate headline — Accenture cutting its FY27 revenue guidance — triggered an IT sell-off that pulled the Nifty down 0.64% and the Sensex 0.78% on the day, with Infosys, TCS and Tech Mahindra the biggest drags (Nifty IT was the only major sector down for the week, −1.3%). The broader market shrugged it off — Midcaps +2.9% and Smallcaps +3.2% beat the large-caps — and India VIX eased ~12% to 12.97. Encouragingly, foreign investors turned net buyers on the cash tape (~+₹3,386 Cr provisional) while DIIs added ~+₹7,108 Cr, though the broader NSDL FPI measure still shows heavy 2026 selling. A hawkish US Fed (holding rates but hinting at a possible 2026 hike) lifted the dollar, pushed gold to a third straight weekly fall, and the rupee firmed to ~₹94.6. The week\'s lesson, in one line: a market never falls without a reason — and on Friday, the reason simply arrived. The companion blog explains why short-term volatility should never move a long-term investor.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-June-20-2026.pdf',
    fileSize: '1.0 MB',
    highlights: [
      'Nifty +1.65% WoW to 24,013.10 · Sensex +1.69% to 76,802.90 — 5 up sessions, then a Friday IT pullback',
      'US-Iran peace prospect + Strait of Hormuz reopening crashed Brent ~8% to ~$80; defence stocks led (+6.6%)',
      'Friday IT rout on Accenture\'s FY27 guidance cut — Infosys/TCS/Tech Mahindra fell; Nifty IT only weekly loser (−1.3%)',
      'FII turned net buyer (~+₹3,386 Cr cash) · DII ~+₹7,108 Cr · Midcaps +2.9% / Smallcaps +3.2% · VIX −12% to 12.97',
    ],
  },
  {
    id: 'week-2026-06-14',
    issueNumber: 15,
    volume: 1,
    title: 'A Friday V-Recovery on US-Iran Peace Hopes Crashes Oil ~6% — Nifty +1.10% WoW to 23,623, Sensex +1.67%, Domestic Money Out-Buys Foreign Selling',
    weekRange: 'June 8 - June 14, 2026',
    publishDate: '2026-06-14',
    summary:
      'The week traced a clean V. Indian equities spent Monday-to-Thursday under pressure on soft global and technology cues, then a powerful Friday rally flipped the week firmly positive. On Friday June 12 the Nifty 50 surged +1.99% to close at 23,622.90 and the Sensex jumped +2.30% to 75,527.95 — the Sensex out-rallying the Nifty on the day purely on index composition (its heavier weights in the big rallying financials and L&T). On a week-on-week basis the Nifty added 1.10% (from 23,366.70) and the Sensex about 1.67% (from ~74,286). The single trigger was a sharp de-escalation in the Middle East: US President Trump signalled an imminent US-Iran peace framework, including a possible reopening of the Strait of Hormuz, which crashed Brent crude roughly 6% on the week to ~$86.9/bbl and revived global risk appetite — an across-the-board tailwind for a country that imports over 80% of its oil. The broader market led the charge: Midcaps (+2.4%) and Smallcaps (+2.8%) outpaced large-caps on Friday with a roughly 5-to-1 advance-decline ratio. Realty, defence, autos and financials led; IT was the relative laggard. Foreign investors kept selling — but in shrinking daily size (about -₹15,300 Cr for the week, taking 2026 outflows past ~₹2.6 lakh crore) — and were more than fully absorbed by domestic institutions (~+₹24,000 Cr), the SIP-and-insurance floor once again doing exactly its job. AMFI\'s May data confirmed that floor: monthly SIP contributions held above ₹30,000 Cr for a third straight month at ₹30,954 Cr, even as lump-sum-driven net equity inflows cooled to a one-year low of ~₹22,900 Cr. The week\'s real lesson was behavioural: an investor who panicked on the four soft sessions would have missed Friday\'s surge entirely. The companion blog unpacks the comparison trap — why a falling headline return can hide a growing fortune, and the quiet, full-time value of a mentor who keeps you anchored to your goal.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-June-13-2026.pdf',
    fileSize: '540 KB',
    highlights: [
      'Nifty +1.10% WoW to 23,622.90 · Sensex +1.67% to 75,527.95 — a sharp Friday V-recovery (+1.99% / +2.30%)',
      'Trigger: Trump signals US-Iran peace + Strait of Hormuz reopening → Brent crashes ~6% on the week to ~$86.9',
      'FII -₹15,300 Cr (selling, but shrinking daily) · DII +₹24,000 Cr — domestic money out-buys foreign by ~₹8,700 Cr',
      'SIP held above ₹30,000 Cr (₹30,954 Cr, May) · Midcaps +2.4% / Smallcaps +2.8% led Friday · IT lagged',
    ],
  },
  {
    id: 'week-2026-06-07',
    issueNumber: 14,
    volume: 1,
    title: 'RBI Holds Repo at 5.25% (Neutral) — Nifty Eases to 23,367 (-0.77% WoW), IT Leads as Domestic Money Absorbs Foreign Selling',
    weekRange: 'June 1 - June 7, 2026',
    publishDate: '2026-06-07',
    summary:
      'A quiet headline masked a busy week. Nifty 50 closed at 23,366.70 (-181.05 pts / -0.77% WoW from 23,547.75) and Sensex at 74,286 (-489.74 pts / -0.66% WoW from 74,775.74), both drifting lower into Friday\'s policy. The defining event was the June 5 RBI Monetary Policy Committee meeting: the MPC unanimously held the repo rate at 5.25% with a neutral stance, raised its inflation forecast (a soft rupee near ₹95 and sticky food keep the imported-inflation channel warm) and trimmed its FY growth projection — a wait-and-watch signal that gave the tape little fresh fuel. Foreign investors stayed net sellers (about -₹4,447 Cr in the week, taking 2026 outflows past ₹2.3 lakh crore — already heavier than all of 2025), but domestic institutions remained the dominant buyer, with DIIs absorbing ₹82,600 Cr in May alone — the structural SIP-and-insurance floor doing exactly its job. Information Technology was the standout, surging 4%+ mid-week on a softer dollar and resilient deal pipeline; FMCG (-2.3%), Realty, PSU Banks and Autos lagged. Brent crude eased to ~$92.9/bbl from ~$96.4, a welcome cooling for a net oil importer; the rupee held a soft ₹94.8-95.9 band, closing ~₹95.19. The week\'s most sobering story was Rajesh Exports — SEBI barred promoter-CEO Rajesh Mehta over an alleged ₹15.15 lakh-crore revenue misrepresentation across FY21-FY25 and fund diversion; the stock hit successive lower circuits and is now down ~45% in six months. A diversified mutual-fund investor felt none of it; a concentrated direct-equity holder felt all of it. The companion blog unpacks why single-name blow-ups are temporary speed-breakers for the goal-based investor.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-June-6-2026.pdf',
    fileSize: '332 KB',
    highlights: [
      'Nifty 23,366.70 (-0.77% WoW) · Sensex 74,286 (-0.66%) — drifted into Friday\'s RBI policy',
      'RBI MPC held repo at 5.25% (neutral) — inflation forecast raised, GDP trimmed; rate floor likely in',
      'FII -₹4,447 Cr (2026 YTD > ₹2.3 lakh cr) · DII absorbed ₹82,600 Cr in May — domestic money holds the line',
      'IT led (+4%+) on softer dollar · Brent eased to ~$92.9 · Rupee ~₹95.2 · Rajesh Exports -45% on SEBI fraud action',
    ],
  },
  {
    id: 'week-2026-05-31',
    issueNumber: 13,
    volume: 1,
    title: 'MSCI Rebalance Triggers ₹21,000 Cr FII Outflow on Friday — Nifty -1.5% to 23,548, Bank Nifty Marks 18 Months Flat',
    weekRange: 'May 25 - May 31, 2026',
    publishDate: '2026-05-31',
    summary:
      'A heavy MSCI Global Standard Index rebalance and US-Iran deal jitters dragged Indian equities sharply lower on Friday, dominating an otherwise mixed week. Nifty 50 closed at 23,547.75 (-359.40 pts / -1.50% on Friday; -171.55 pts / -0.72% WoW from 23,719.30). Sensex 74,775.74 (-1,092.06 pts / -1.44% Friday; -639.61 pts / -0.85% WoW from 75,415.35). Bank Nifty fell ~1.8% on the week — and crucially, the index is now broadly flat over the last 18-20 months from its September 2024 peak of ~61,765, a level of fatigue not seen since the 2018-19 NBFC-stress cycle. Friday\'s single-day FII outflow of ₹21,105.86 Cr was the heaviest of 2026 and the bulk of it was MSCI-mechanical: the May 2026 quarterly rebalance triggered ~$800 million-$1 billion in passive selling from Indian large-caps. DIIs absorbed ₹16,764.14 Cr — covering ~80% of FII selling in a single session — pushing structural domestic inflows further. Brent crude held near $103/bbl on Iran-deal uncertainty after Trump pulled back from the 14-point MoU framework. Rupee traded in a narrower ₹95.40-95.70 band after the prior week\'s RBI defence. Bank Nifty\'s 18-month flat trace is this week\'s headline behavioural risk; the companion blog explains the historical precedent and why this is cyclical, not structural.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-May-31-2026.pdf',
    fileSize: '447 KB',
    highlights: [
      'Nifty 23,547.75 (-0.72% WoW) · Sensex 74,775.74 (-0.85%) — sharp -1.5% Friday on MSCI rebalance',
      'FII outflow ₹21,106 Cr Friday (heaviest of 2026, $800m-1b MSCI-passive) · DII absorbed ₹16,764 Cr',
      'Bank Nifty now flat 18 months from Sep-24 peak of 61,765 — same pattern as 2018-19 NBFC-stress cycle',
      'Brent ~$103/bbl on Iran-deal jitters · Rupee ₹95.40-95.70 holding after last week\'s RBI defence',
    ],
  },
  {
    id: 'week-2026-05-23',
    issueNumber: 12,
    volume: 1,
    title: 'Rupee Hits Lifetime Low ₹96.90 Before RBI Burns $8 Bn — Nifty Holds Flat at 23,719, Bank Nifty -2.9%',
    weekRange: 'May 17 - May 23, 2026',
    publishDate: '2026-05-24',
    summary:
      'Indian equities ended a tumultuous week broadly flat on the headline but with rupee fireworks underneath. Nifty 50 closed at 23,719.30 (+0.32% WoW from 23,643.50) and Sensex at 75,415.35 (+0.24% WoW from 75,238). The defining story was the rupee: on Tuesday May 20 it broke to a fresh all-time low of ₹96.90/USD, prompting heavy RBI dollar selling that drained $8 billion from forex reserves but pulled the currency back to ₹95.59 by Friday close. Brent crude remained elevated at $103.94/bbl (+1.33% on Friday), keeping the imported-inflation channel hot. Bank Nifty was the week\'s weakest segment at 53,710 (-2.89% WoW) even though private banks rallied Friday. FIIs sold ₹4,440 Cr in cash on Friday alone, taking YTD outflows to ₹1.92 lakh crore (already > full 2025); DIIs absorbed with ₹6,003 Cr Friday buying, pushing YTD inflows to ₹1.7 lakh crore. Tech Mahindra (+4.85% on May 18), Infosys, Bharti Airtel, Trent, and Wipro led; Tata Steel (-3.15%), Power Grid (-2.93%), NTPC (-2.62%), SBI (-2.53%) lagged. Sectoral: Energy (+1.48%) and metals led Friday; Media (-1.45%) and FMCG (-0.71%) lagged.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-May-23-2026.pdf',
    fileSize: '410 KB',
    highlights: [
      'Nifty 23,719.30 (+0.32% WoW) · Sensex 75,415.35 (+0.24%) — flat on top, turbulent underneath',
      'Rupee fireworks: All-time low ₹96.90 on Tuesday → RBI burned $8 bn forex → bounced to ₹95.59 Friday',
      'Bank Nifty -2.89% WoW to 53,710 — worst-performing major segment despite Friday rally in private banks',
      'FII YTD outflow ₹1.92 lakh Cr (now > full 2025) · DII YTD inflow ₹1.7 lakh Cr absorbing ~90% via SIPs',
    ],
  },
  {
    id: 'week-2026-05-16',
    issueNumber: 11,
    volume: 1,
    title: 'Brutal Monday Crash Wipes ₹10-16 Lakh Crore, IT Hits 52-Week Lows — Nifty Ends Week -2.2% at 23,643',
    weekRange: 'May 10 - May 16, 2026',
    publishDate: '2026-05-17',
    summary:
      'Indian equities snapped their two-week winning run with a brutal -2.2% weekly decline. Nifty 50 fell from 24,176.15 to 23,643.50 (-532.65 pts) and Sensex from 77,328 to 75,238 (-2,090 pts / -2.7%). Monday May 12 was the week\'s defining session — Sensex crashed 1,500 pts, Nifty touched 23,379.55, IT stocks hit 52-week lows (TCS, Infosys) on OpenAI\'s $4B deployment venture fears, and the rupee touched a lifetime low of ~₹95.7. A sharp mid-week recovery followed — Sensex +789 pts on Wednesday as Pharma (+2.74%) and IT (+2.2%) rebounded, FIIs turned net buyer at ₹187 Cr, and DIIs added ₹684 Cr. Friday saw profit-booking with metals and energy dragging. Brent crude surged to ~$109/bbl as Trump called the Iran ceasefire "on massive life support". FII YTD outflows hit ₹1.92 lakh crore, already eclipsing full 2025 outflows of ₹1.66 lakh crore. April SIP flows steady at ₹31,115 crore.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-May-16-2026.pdf',
    fileSize: '780 KB',
    highlights: [
      'Nifty -2.2% to 23,643.50 · Sensex -2.7% to 75,238 — snapped two-week winning streak',
      'Monday crash: Sensex -1,500 pts, IT hit 52-week lows · ₹10-16 lakh crore wealth wiped in 4 days',
      'Brent surges to ~$109/bbl · Rupee at lifetime low ~₹95.7 · Trump: Iran ceasefire "on life support"',
      'FII YTD outflow ₹1.92 lakh crore (eclipses full 2025) · DII YTD inflow ₹1.7 lakh crore absorbing ~90%',
    ],
  },
  {
    id: 'week-2026-05-09',
    issueNumber: 10,
    volume: 1,
    title: 'Brent Crashes 7% to $101 on Iran 14-Point MoU Hopes — Smallcaps Hit 4th ATH, Nifty Gains 0.75%',
    weekRange: 'May 3 - May 9, 2026',
    publishDate: '2026-05-10',
    summary:
      'Indian equities recorded a second consecutive weekly gain, with Nifty 50 +0.75% WoW closing at 24,176.15 and Sensex at 77,328.19. The story is the decoupling: Brent crude crashed ~7% from $126 to ~$101/bbl on Trump\'s 14-point one-page MoU draft to end the Iran war, the rupee pared losses from ₹95.32 to RBI ref ₹94.44, and India VIX cooled to the 17-18 band. Mid- and Smallcap indices made fresh all-time highs (Smallcap 100 — 4th consecutive ATH; Midcap 100 hit 61,911). FIIs sold ₹5,835 Cr on May 6 (concentrated in PSU banks/financials); DIIs absorbed ₹6,837 Cr — the largest single-day buy in two weeks. Bajaj Auto Q4 PAT +48% YoY (₹150/share dividend) and Bajaj Finance AUM crossing ₹5.1 lakh crore (+22% YoY) anchored the earnings narrative.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-May-9-2026.pdf',
    fileSize: '752 KB',
    highlights: [
      'Nifty +0.75% to 24,176.15 — second consecutive weekly gain · Sensex 77,328.19',
      'Smallcap 100 4th consecutive ATH · Midcap 100 fresh ATH at 61,911',
      'Brent -7% from $126 → ~$101 on Trump\'s 14-point Iran MoU · Rupee back to ₹94.48',
      'DII +₹6,837 Cr (biggest single-day buy in 2 weeks) · FII -₹5,835 Cr (May 6)',
    ],
  },
  {
    id: 'week-2026-05-02',
    issueNumber: 9,
    volume: 1,
    title: 'Sector Rotation Hides Behind a Flat Nifty: Pharma Surges, Banks Crack as Brent Hits $126 & Rupee Sets Record Low',
    weekRange: 'Apr 26 - May 2, 2026',
    publishDate: '2026-05-03',
    summary:
      'Nifty 50 closed at 23,997.55 and Sensex at 76,913.50 — both broadly flat for the week — but the spread between Sun Pharma (+7.6%) and Axis Bank (-7.4%) was 15 percentage points in five trading days. Brent crude touched $126.41/bbl (highest since June 2022) on stalled US-Iran talks, the rupee hit a record low of ₹95.32, and the US Fed held rates at 3.50-3.75% with an 8-4 dissent — the most divided FOMC since October 1992. Energy/Oil & Gas/Pharma led; Banking, IT and Financial Services lagged sharply. Smallcaps gained 1.6% — the quiet domestic resilience signal.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-May-2-2026.pdf',
    fileSize: '1.0 MB',
    highlights: [
      'Nifty 23,997.55 / Sensex 76,913.50 — flat WoW but with 15-pt sector spread',
      'Brent $126.41 (peak since Jun \'22) · Rupee record low ₹95.32 · India VIX 18.46',
      'Top gainers: Sun Pharma +7.6%, Coal India +6.8%, Reliance +6.5%, ONGC +4.6%',
      'Top losers: Axis Bank -7.4%, Shriram Finance -7.1%, ICICI Bank -6.3%, HCL Tech -6.1%',
    ],
  },
  {
    id: 'week-2026-04-25',
    issueNumber: 8,
    volume: 1,
    title: 'IT Meltdown & Oil Shock: Sensex Loses 1,829 Points as Hormuz Tensions Resume',
    weekRange: 'Apr 19 - Apr 25, 2026',
    publishDate: '2026-04-26',
    summary:
      'Indian equities posted their worst week in months as the Nifty 50 lost 1.9% (-455 pts) to 23,897.95 and the Sensex shed 2.3% (-1,829 pts) to 76,664.21. The IT sector cracked over 5% on weak Q4 prints — TCS recorded its first annual revenue dip in 20+ years. US-Iran talks stalled, Hormuz disruption resumed, Brent surged 16% to $105, rupee weakened to ₹94.26, and FIIs dumped ₹8,827 Cr on Friday alone.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-April-25-2026.pdf',
    fileSize: '1.0 MB',
    highlights: [
      'Nifty -1.9% to 23,897.95 · Sensex -2.3% to 76,664.21 — worst week in months',
      'IT bloodbath: HCL Tech -16.6%, Infosys -12.4%, TCS -7.2%, Tech Mahindra -10.1%',
      'Brent surges 16% to $105 · Rupee weakens to ₹94.26 · India VIX +14.6% to 19.70',
      'ICICI Bank Q4 strong: PAT ₹14,755 Cr (+9.2% YoY), ₹12/share dividend',
    ],
  },
  {
    id: 'week-2026-04-18',
    issueNumber: 7,
    volume: 1,
    title: 'Hormuz Reopens, VIX Slides to 17, Q4 Earnings Begin',
    weekRange: 'Apr 12 - Apr 18, 2026',
    publishDate: '2026-04-19',
    summary:
      'Indian equities logged a second consecutive weekly gain as Iran reopened the Strait of Hormuz, Brent crude fell 9% intraday, India VIX slid to 17.21, and Q4 FY26 earnings season kicked off with HDFC Bank reporting on April 18.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-April-18-2026.pdf',
    fileSize: '1.0 MB',
    highlights: [
      'Nifty +1.26% to 24,353.55 · Sensex ~78,493 in a 4-day week',
      'Brent crashed 9% intraday to $90.38/bbl on Hormuz reopening',
      'India VIX at 17.21 — lowest since pre-Hormuz crisis',
      'Q4 earnings begin: HDFC Bank on Apr 18, ICICI & Infosys next',
    ],
  },
  {
    id: 'week-2026-04-11',
    issueNumber: 6,
    volume: 1,
    title: 'Ceasefire Rally: Nifty Surges 6% in Sharpest Weekly Gain in 5 Years',
    weekRange: 'Apr 5 - Apr 11, 2026',
    publishDate: '2026-04-12',
    summary:
      'US-Iran two-week ceasefire brokered by Pakistan triggered the sharpest weekly equity rally since February 2021. Nifty surged ~6% to 24,050, Brent crashed 14%, RBI held repo at 5.25%, and AMFI reported record SIP inflows of ₹32,087 crore.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-April-11-2026.pdf',
    fileSize: '710 KB',
    highlights: [
      'Nifty +6% to 24,050.60 — sharpest weekly gain since Feb 2021',
      'Brent crashed ~14% from $111.69 to $96.48/bbl on ceasefire',
      'RBI held repo at 5.25%; FY27 GDP projected at 6.9%',
      'Record SIP inflows of ₹32,087 Cr in March (AMFI)',
    ],
  },
  {
    id: 'week-2026-04-04',
    issueNumber: 5,
    volume: 1,
    title: 'Sixth Straight Weekly Loss: Oil Crosses $110, Rupee Recovers to 92.73',
    weekRange: 'Mar 29 - Apr 4, 2026',
    publishDate: '2026-04-05',
    summary:
      'Markets extended their losing streak to six consecutive weeks in a 4-day Good Friday-shortened week. Nifty fell 2.5% to 22,713, Brent crossed $110/bbl, and Manufacturing PMI hit a 4-year low. Rupee staged a surprise recovery on RBI intervention ahead of the April 6-8 MPC meeting.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-April-4-2026.pdf',
    fileSize: '719 KB',
    highlights: [
      'Nifty -2.5% to 22,713 — sixth consecutive weekly loss',
      'Brent breached $110/bbl; March saw biggest monthly crude gain ever',
      'Rupee recovered from 94.46 to 92.73 on RBI intervention',
      'Manufacturing PMI fell to 4-year low of 53.9',
    ],
  },
  {
    id: 'week-2026-03-28',
    issueNumber: 4,
    volume: 1,
    title: 'Goldman Cuts India to Market Weight, Oil Near $108 & Rupee Breaches 94',
    weekRange: 'Mar 22 - Mar 28, 2026',
    publishDate: '2026-03-29',
    summary:
      'Fifth consecutive weekly loss in a 3-day holiday week (Ram Navami). Goldman Sachs triple-blow: GDP forecast cut to 5.9%, equities downgraded to market weight, 50bps hike flagged. Brent touched $108, rupee breached 94 for the first time, and India VIX surged to 26.80.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-March-28-2026.pdf',
    fileSize: '704 KB',
    highlights: [
      'Nifty -1.28% to 22,819 — fifth consecutive weekly loss',
      'Goldman Sachs: GDP cut to 5.9%, India equities to market weight',
      'Rupee hit record low of 94.46, breaching 94 for the first time',
      'FII outflows ₹8,315 Cr; DIIs absorbed ₹14,000 Cr',
    ],
  },
  {
    id: 'week-2026-03-21',
    issueNumber: 3,
    volume: 1,
    title: 'Markets Survive Mid-Week Crash, End Flat as Fed Holds & Hormuz Escalates',
    weekRange: 'Mar 15 - Mar 21, 2026',
    publishDate: '2026-03-22',
    summary:
      'Rollercoaster week: Sensex plunged 2,497 points on March 19 (biggest single-day crash in ~2 years) as Saudi refinery fires pushed Brent to $119.50 intraday and the Fed signalled only 1 rate cut for 2026. Markets still ended nearly flat, proving self-correction. FIIs sold ₹29,900 Cr; DIIs bought ₹30,642 Cr.',
    pdfPath: '/newsletters/Trustner-Weekly-Market-Brief-March-15-21-2026.pdf',
    fileSize: '423 KB',
    highlights: [
      'March 19: biggest single-day crash in ~2 years (-3.26%)',
      'Brent touched $119.50 intraday on Saudi refinery fires',
      'US Fed held rates; dot plot signals only 1 cut in 2026',
      'Rupee hit new record low of 93.77',
    ],
  },
];

export function getLatestNewsletter(): NewsletterIssue {
  return newsletters[0];
}

export function getArchivedNewsletters(): NewsletterIssue[] {
  return newsletters.slice(1);
}

export function getAllNewsletters(): NewsletterIssue[] {
  return newsletters;
}
