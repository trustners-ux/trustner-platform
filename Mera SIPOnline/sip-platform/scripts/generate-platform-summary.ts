import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// ── Brand colours & layout constants ──────────────────────────────
const TEAL = "#0F766E";
const SLATE = "#1E293B";
const LIGHT_GRAY = "#E2E8F0";
const WHITE = "#FFFFFF";
const MARGIN = 56;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ── Helper: draw a horizontal rule ───────────────────────────────
function hr(doc: InstanceType<typeof PDFDocument>, y?: number) {
  const yPos = y ?? doc.y;
  doc
    .strokeColor(LIGHT_GRAY)
    .lineWidth(1)
    .moveTo(MARGIN, yPos)
    .lineTo(PAGE_WIDTH - MARGIN, yPos)
    .stroke();
  doc.y = yPos + 12;
}

// ── Helper: section header ───────────────────────────────────────
function sectionHeader(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(TEAL)
    .text(text, MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  hr(doc);
}

// ── Helper: sub-header ──────────────────────────────────────────
function subHeader(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(TEAL)
    .text(text, MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.25);
}

// ── Helper: body text ───────────────────────────────────────────
function body(doc: InstanceType<typeof PDFDocument>, text: string, indent = 0) {
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(SLATE)
    .text(text, MARGIN + indent, doc.y, { width: CONTENT_WIDTH - indent, lineGap: 3 });
  doc.moveDown(0.15);
}

// ── Helper: bullet item ────────────────────────────────────────
function bullet(doc: InstanceType<typeof PDFDocument>, text: string, indent = 16) {
  const bulletX = MARGIN + indent;
  const textX = bulletX + 14;
  const textW = CONTENT_WIDTH - indent - 14;
  const startY = doc.y;
  doc.font("Helvetica").fontSize(10.5).fillColor(SLATE);
  doc.text("\u2022", bulletX, startY, { width: 14 });
  doc.text(text, textX, startY, { width: textW, lineGap: 3 });
  doc.moveDown(0.2);
}

// ── Helper: page footer with page number ────────────────────────
let pageNumber = 0;
function addPageNumber(doc: InstanceType<typeof PDFDocument>) {
  pageNumber++;
  if (pageNumber === 1) return; // skip cover page number
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94A3B8")
    .text(`MeraSIP.com \u2014 Platform Summary  |  Page ${pageNumber}`, MARGIN, PAGE_HEIGHT - 40, {
      width: CONTENT_WIDTH,
      align: "center",
    });
}

// ── Helper: safe new page with footer ───────────────────────────
function newPage(doc: InstanceType<typeof PDFDocument>) {
  addPageNumber(doc);
  doc.addPage();
}

// ── Helper: table row (for competitive positioning) ─────────────
function tableRow(
  doc: InstanceType<typeof PDFDocument>,
  cols: string[],
  widths: number[],
  isHeader = false
) {
  const startY = doc.y;
  const font = isHeader ? "Helvetica-Bold" : "Helvetica";
  const fontSize = isHeader ? 10 : 9.5;
  const fg = isHeader ? WHITE : SLATE;
  const cellPadding = 6;

  // Measure max height
  let maxH = 0;
  cols.forEach((col, i) => {
    const h = doc.font(font).fontSize(fontSize).heightOfString(col, { width: widths[i] - 12 });
    if (h > maxH) maxH = h;
  });
  const rowH = Math.max(maxH + cellPadding * 2, 24);

  // Draw background
  if (isHeader) {
    doc.rect(MARGIN, startY, CONTENT_WIDTH, rowH).fill(TEAL);
  } else {
    // alternating gray
    doc.rect(MARGIN, startY, CONTENT_WIDTH, rowH).fill(startY % 2 === 0 ? "#F8FAFC" : WHITE);
    // border bottom
    doc.strokeColor(LIGHT_GRAY).lineWidth(0.5).moveTo(MARGIN, startY + rowH).lineTo(PAGE_WIDTH - MARGIN, startY + rowH).stroke();
  }

  // Draw text
  let x = MARGIN + 6;
  cols.forEach((col, i) => {
    doc.font(font).fontSize(fontSize).fillColor(fg).text(col, x, startY + cellPadding, { width: widths[i] - 12 });
    x += widths[i];
  });

  doc.y = startY + rowH + 1;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN — Generate the PDF
// ══════════════════════════════════════════════════════════════════
function main() {
  const outputPath = path.resolve(
    __dirname,
    "../public/merasip-platform-summary.pdf"
  );

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: "MeraSIP.com \u2014 Platform Summary & Strategic Vision",
      Author: "Trustner Asset Services Pvt Ltd",
      Subject: "Platform Summary",
    },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ────────────────────────────────────────────────────────────────
  // COVER PAGE
  // ────────────────────────────────────────────────────────────────
  // Top accent bar
  doc.rect(0, 0, PAGE_WIDTH, 6).fill(TEAL);

  // Centred title block
  doc.moveDown(8);
  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(TEAL)
    .text("MeraSIP.com", MARGIN, doc.y, { width: CONTENT_WIDTH, align: "center" });
  doc.moveDown(0.4);
  doc
    .font("Helvetica")
    .fontSize(16)
    .fillColor(SLATE)
    .text("Platform Summary & Strategic Vision", MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "center",
    });

  doc.moveDown(1.5);
  // Decorative line
  const lineY = doc.y;
  doc
    .strokeColor(TEAL)
    .lineWidth(2)
    .moveTo(PAGE_WIDTH / 2 - 80, lineY)
    .lineTo(PAGE_WIDTH / 2 + 80, lineY)
    .stroke();
  doc.moveDown(1.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(SLATE)
    .text("Trustner Asset Services Pvt Ltd", MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "center",
    });
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#64748B")
    .text("ARN-286886  |  AMFI Registered Mutual Fund Distributor", MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "center",
    });
  doc.moveDown(1.5);

  doc
    .font("Helvetica-BoldOblique")
    .fontSize(12)
    .fillColor(TEAL)
    .text("\"India's First Free AI-Powered Financial Planning Platform\"", MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "center",
    });

  doc.moveDown(3);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#94A3B8")
    .text("March 2026", MARGIN, doc.y, { width: CONTENT_WIDTH, align: "center" });

  // Bottom accent bar on cover
  doc.rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6).fill(TEAL);

  // ────────────────────────────────────────────────────────────────
  // PAGE 2: EXECUTIVE SUMMARY
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Executive Summary");
  doc.moveDown(0.3);

  const execPoints = [
    "MeraSIP.com is the most feature-rich free financial planning platform for any Mutual Fund Distributor (MFD) in India.",
    "Built on a modern tech stack \u2014 Next.js 15, React 19, TypeScript \u2014 and deployed on Vercel for instant global performance.",
    "114 production pages encompassing 30+ financial calculators, an AI-powered financial health scoring engine, live fund data, an education academy, and a full admin dashboard.",
    "The platform follows a trust-first approach: users come to learn and plan, build confidence in the tools, and convert naturally into long-term SIP clients \u2014 the modern MFD growth playbook.",
  ];
  execPoints.forEach((p) => bullet(doc, p));

  doc.moveDown(0.6);

  // Key metrics box
  const boxY = doc.y;
  doc.rect(MARGIN, boxY, CONTENT_WIDTH, 100).lineWidth(1).strokeColor(TEAL).fillAndStroke("#F0FDFA", TEAL);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEAL)
    .text("Key Platform Metrics", MARGIN + 20, boxY + 14, { width: CONTENT_WIDTH - 40 });

  const metrics = [
    ["114", "Production Pages"],
    ["30+", "Financial Calculators"],
    ["10,000+", "Mutual Fund Schemes (Live NAV)"],
    ["11", "Financial Dimensions Scored"],
    ["5", "AI Scoring Pillars (out of 900)"],
  ];

  let metricY = boxY + 36;
  metrics.forEach(([num, label]) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEAL).text(num, MARGIN + 24, metricY, { continued: false });
    doc.font("Helvetica").fontSize(10).fillColor(SLATE).text(label, MARGIN + 90, metricY);
    metricY += 13;
  });

  doc.y = boxY + 110;

  // ────────────────────────────────────────────────────────────────
  // PAGE 3: CORE FEATURES
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "What We've Built \u2014 Core Features");
  doc.moveDown(0.2);

  // Feature 1
  subHeader(doc, "1. Financial Planning Engine (6 Phases Complete)");
  [
    "8-step wizard collecting 100+ data points across 11 financial dimensions",
    "OTP-gated access (email + SMS ready) for secure report delivery",
    "AI scoring across 5 pillars \u2014 Cashflow, Protection, Investments, Debt, Retirement \u2014 scored out of 900",
    "Claude AI-generated narrative + professional 10-page PDF report",
    "Maker-checker admin workflow \u2014 AI generates, human reviews before delivery",
    "State \u2192 City cascading location selector with 200+ Indian cities",
  ].forEach((t) => bullet(doc, t, 24));

  doc.moveDown(0.5);

  // Feature 2
  subHeader(doc, "2. 30+ Financial Calculators");
  [
    "SIP, Lumpsum, Step-up SIP, SWP, Daily SIP, Goal-Based, Retirement, FIRE",
    "EMI, Loan Prepayment, FD vs Loan, Rent vs Buy, Home Affordability",
    "Income Tax, Capital Gains Tax, Tax Saving (80C)",
    "Term Insurance, Health Insurance, Human Life Value",
    "Net Worth, Emergency Fund, Lifestyle Inflation, Life Stage, Lifeline, Correction Impact",
  ].forEach((t) => bullet(doc, t, 24));

  doc.moveDown(0.5);

  // Feature 3
  subHeader(doc, "3. Mutual Fund Research Hub");
  [
    "Live NAV data for 10,000+ schemes sourced from AMFI",
    "Fund screener, comparison tool, and top performers ranking",
    "Selection methodology page explaining Trustner's fund evaluation process",
  ].forEach((t) => bullet(doc, t, 24));

  doc.moveDown(0.5);

  // Feature 4
  subHeader(doc, "4. Education & Content");
  [
    "Learning Academy with structured modules and MCQ assessments",
    "200+ term financial glossary for investor education",
    "MDX-powered blog with SEO-optimised articles",
    "AI Chat Advisor for interactive financial guidance",
    "Research tools: Historical returns, Rolling returns, Bull vs Bear analysis, Volatility simulator",
  ].forEach((t) => bullet(doc, t, 24));

  doc.moveDown(0.5);

  // Feature 5
  subHeader(doc, "5. Lead Capture & Admin Dashboard");
  [
    "4-point lead capture system: modal (timed), inline forms, AI gate, floating CTA",
    "Full admin dashboard \u2014 leads, reports, users, gallery, blog, and fund management",
    "Excel export for all data tables and lead lists",
  ].forEach((t) => bullet(doc, t, 24));

  // ────────────────────────────────────────────────────────────────
  // PAGE 4: WHAT MAKES MERASIP UNIQUE
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "What Makes MeraSIP Unique");
  doc.moveDown(0.3);

  const uniquePoints: [string, string][] = [
    [
      "1. No Other MFD Offers Free CFP-Grade Financial Planning",
      "Something that costs Rs 5,000\u201325,000 from a Certified Financial Planner is available completely free on MeraSIP. This alone is a massive competitive moat.",
    ],
    [
      "2. Score-Based Approach (Like CIBIL for Financial Health)",
      "\"What's your financial health score?\" is immediately relatable. Just as CIBIL changed how people think about credit, we are creating a new behaviour around financial wellness scoring.",
    ],
    [
      "3. 30+ Calculators in One Place",
      "Most MFDs offer 2\u20133 basic calculators. MeraSIP has 30+ covering every conceivable financial planning need \u2014 SIP, insurance, tax, retirement, net worth, and more.",
    ],
    [
      "4. AI-Powered but Human-Reviewed",
      "Our maker-checker workflow ensures every AI-generated report is reviewed by a human before delivery. This builds institutional trust that pure robo-advisors lack.",
    ],
    [
      "5. Education-First, Not Product-Push",
      "Users come to learn, stay to plan, and convert to clients. This trust-first funnel has significantly higher retention than aggressive product-push models.",
    ],
  ];

  uniquePoints.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 5: COMPETITIVE POSITIONING
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Competitive Positioning");
  doc.moveDown(0.3);

  body(
    doc,
    "MeraSIP occupies a unique position in the Indian wealth-tech landscape \u2014 offering CFP-grade planning for free while maintaining the personal touch of an MFD relationship."
  );
  doc.moveDown(0.6);

  const colWidths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.35, CONTENT_WIDTH * 0.43];

  tableRow(doc, ["Competitor", "What They Do", "Trustner's Edge"], colWidths, true);
  tableRow(
    doc,
    ["Groww / Zerodha", "Direct plans, DIY investing", "Guidance + regular plans with behavioural coaching & crash hand-holding"],
    colWidths
  );
  tableRow(
    doc,
    ["ET Money", "Calculators + direct plans", "Deeper financial planning + human review of every report"],
    colWidths
  );
  tableRow(
    doc,
    ["Scripbox / Kuvera", "Robo-advisory, automated", "Free platform + personal MFD touch & relationship"],
    colWidths
  );
  tableRow(
    doc,
    ["Traditional MFDs", "Offline, no technology", "Full digital platform with 30+ tools & AI scoring"],
    colWidths
  );
  tableRow(
    doc,
    ["CFPs (Rs 15\u201325K)", "Paid financial planning", "Same quality output, completely free for the investor"],
    colWidths
  );

  doc.moveDown(1);
  body(
    doc,
    "Our core thesis: In a market where direct platforms are commoditising execution, the value of an MFD lies in planning, guidance, and behavioural coaching. MeraSIP makes that value visible and accessible."
  );

  // ────────────────────────────────────────────────────────────────
  // PAGE 6: ROADMAP — Phase A
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Strategic Roadmap \u2014 Phase A: Engagement (Months 1\u20132)");
  doc.moveDown(0.3);

  body(
    doc,
    "The immediate focus is deepening user engagement and creating habitual usage patterns."
  );
  doc.moveDown(0.3);

  const phaseAItems: [string, string][] = [
    ["WhatsApp Integration", "Send financial health reports, SIP reminders, and market updates via WhatsApp Business API \u2014 meeting users where they already are."],
    ["User Dashboard", "Logged-in experience with score history, goal tracking, and annual financial health updates."],
    ["Push Notifications", "Market alerts, SIP date reminders, and goal-nudges to maintain engagement between visits."],
    ["Referral System", "\"Share your score, challenge your friends\" \u2014 a viral loop that leverages the innate shareability of scores."],
  ];

  phaseAItems.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 7: ROADMAP — Phase B
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Strategic Roadmap \u2014 Phase B: Revenue (Months 2\u20134)");
  doc.moveDown(0.3);

  body(
    doc,
    "With engagement established, Phase B focuses on converting trust into AUM through seamless transaction infrastructure."
  );
  doc.moveDown(0.3);

  const phaseBItems: [string, string][] = [
    ["Direct SIP Onboarding", "BSE StAR MF / MF Utilities integration for one-click SIP registration directly from the financial plan."],
    ["Goal-Linked Portfolio Builder", "AI-generated fund portfolios mapped to each goal identified in the financial plan \u2014 retirement, education, emergency, etc."],
    ["E-KYC Integration", "CDSL/CAMS in-app KYC completion for new investors, eliminating drop-off from external KYC flows."],
    ["Commission Transparency Dashboard", "Show clients exactly what Trustner earns on their portfolio \u2014 radical transparency that builds long-term trust."],
  ];

  phaseBItems.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 8: ROADMAP — Phase C
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Strategic Roadmap \u2014 Phase C: Platform Expansion (Months 4\u20138)");
  doc.moveDown(0.3);

  body(
    doc,
    "Expanding beyond mutual funds to become a comprehensive financial wellness platform."
  );
  doc.moveDown(0.3);

  const phaseCItems: [string, string][] = [
    ["Insurance Marketplace", "Term insurance and health insurance comparison engine with lead generation for partner insurers."],
    ["NPS / PPF / SSY Tracking", "Government scheme tracking integrated into the portfolio view for a complete financial picture."],
    ["Tax Filing Assistant", "Auto-generate tax-saving recommendations from financial planning data \u2014 connecting plans to action."],
    ["Family Financial Planning", "Multi-member household planning to capture family AUM, not just individual portfolios."],
  ];

  phaseCItems.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 9: ROADMAP — Phase D
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Strategic Roadmap \u2014 Phase D: Scale & Brand (Months 8\u201312)");
  doc.moveDown(0.3);

  body(
    doc,
    "Scaling the platform across channels, languages, and business models."
  );
  doc.moveDown(0.3);

  const phaseDItems: [string, string][] = [
    ["Mobile App (React Native)", "Native mobile experience with biometric login, offline access, and push notifications."],
    ["Sub-Broker Platform", "White-label version of MeraSIP tools for other MFDs and IFAs \u2014 a B2B revenue stream."],
    ["Video Learning Academy", "Short 3\u20135 minute video modules for each financial concept, increasing engagement and accessibility."],
    ["Regional Language Support", "Hindi, Marathi, Tamil, Bengali, and Gujarati \u2014 unlocking Tier 2/3 city adoption."],
    ["SEBI RIA Application", "Strategic move from MFD to Registered Investment Advisor for fee-based advisory capability."],
  ];

  phaseDItems.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 10: ROADMAP — Phase E
  // ────────────────────────────────────────────────────────────────
  newPage(doc);
  sectionHeader(doc, "Strategic Roadmap \u2014 Phase E: Fintech Differentiation");
  doc.moveDown(0.3);

  body(
    doc,
    "Long-term plays that position Trustner as a fintech platform, not just a distribution business."
  );
  doc.moveDown(0.3);

  const phaseEItems: [string, string][] = [
    ["API Platform", "Open APIs for calculators and financial health scoring \u2014 freemium model for developers, fintechs, and corporates."],
    ["Corporate Wellness", "Financial planning as an employee benefit (B2B2C). Employers pay, employees get free financial health checkups."],
    ["Annual Financial Health Checkup", "Yearly reassessment with year-over-year comparison \u2014 creating an annual ritual like health checkups."],
    ["AI Advisor V2", "Voice-based financial advisor in Hindi and English \u2014 making financial planning accessible to non-digital-native users."],
  ];

  phaseEItems.forEach(([title, desc]) => {
    subHeader(doc, title);
    body(doc, desc, 8);
    doc.moveDown(0.4);
  });

  // Final note
  doc.moveDown(1);
  hr(doc);
  doc.moveDown(0.5);
  doc
    .font("Helvetica-BoldOblique")
    .fontSize(11)
    .fillColor(TEAL)
    .text(
      "MeraSIP.com is already the most feature-rich free financial planning platform in India for an MFD. The foundation is solid. The next step is conversion infrastructure to turn free users into AUM.",
      MARGIN,
      doc.y,
      { width: CONTENT_WIDTH, align: "center", lineGap: 4 }
    );

  // Add page number to the last page
  addPageNumber(doc);

  doc.end();

  stream.on("finish", () => {
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log("PDF generated successfully!");
    console.log("  Path: " + outputPath);
    console.log("  Size: " + sizeKB + " KB");
    console.log("  Pages: " + pageNumber);
  });
}

main();
