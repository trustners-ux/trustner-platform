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
    featured: true,
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
