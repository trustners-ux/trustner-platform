/**
 * Model Portfolio PDF generator.
 *
 * Renders a clean, regulator-compliant 2-page PDF for a portfolio built on
 * /funds/portfolio-builder. Uses jsPDF directly (not html2canvas) so the file
 * is small (~80 KB) and prints cleanly.
 */

import { jsPDF } from 'jspdf';
import type { TrustnerCuratedFund } from '@/types/funds';
import type {
  PortfolioHolding,
  PortfolioMetrics,
  CategoryAllocation,
  CapBucket,
} from './portfolio-builder';

// ─── Color palette (matches site theme) ───
type RGB = [number, number, number];
const TEAL_700: RGB = [15, 118, 110];
const TEAL_50:  RGB = [240, 253, 244];
const NEUTRAL_50:  RGB = [250, 251, 252];
const NEUTRAL_100: RGB = [241, 245, 249];
const NEUTRAL_200: RGB = [226, 232, 240];
const NEUTRAL_500: RGB = [100, 116, 139];
const NEUTRAL_700: RGB = [51, 65, 85];
const NEUTRAL_900: RGB = [15, 23, 42];
const POSITIVE: RGB = [5, 150, 105];
const NEGATIVE: RGB = [220, 38, 38];
const ACCENT:   RGB = [232, 85, 58];

// Pie chart colours (match the site)
const PIE = [
  [15, 118, 110], [14, 165, 233], [245, 158, 11], [139, 92, 246], [236, 72, 153],
  [16, 185, 129], [239, 68, 68], [99, 102, 241], [20, 184, 166],
] as const;

// ─── Helpers ───
function setFill(p: jsPDF, c: RGB) { p.setFillColor(c[0], c[1], c[2]); }
function setText(p: jsPDF, c: RGB) { p.setTextColor(c[0], c[1], c[2]); }
function setDraw(p: jsPDF, c: RGB) { p.setDrawColor(c[0], c[1], c[2]); }

// jsPDF Helvetica doesn't support ₹ — replace with "Rs."
function safe(s: string): string { return s.replace(/₹/g, 'Rs.'); }

function fmtINR(n: number): string {
  if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(0)} K`;
  return `Rs. ${n.toFixed(0)}`;
}

function fmtPct(decimal: number, dp = 2): string {
  return `${(decimal * 100).toFixed(dp)}%`;
}

// ─── Logo loader ───
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/Trustner Logo-blue.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function createWhiteLogo(logoBase64: string): Promise<string | null> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoBase64;
    });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 30) { px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; }
    }
    ctx.putImageData(imageData, 0, 0);
    return c.toDataURL('image/png');
  } catch { return null; }
}

// ─── Public API ───

export interface PortfolioPDFInput {
  portfolioName: string;
  goalAmount: number;
  horizonYears: number;
  requiredMonthlySIP: number;
  futureValueAtSIP: number;
  holdings: PortfolioHolding[];
  fundLookup: Map<string, TrustnerCuratedFund>;
  metrics: PortfolioMetrics;
  categoryAlloc: CategoryAllocation[];
  capBuckets: CapBucket[];
}

export async function generatePortfolioPDF(input: PortfolioPDFInput): Promise<void> {
  const {
    portfolioName, goalAmount, horizonYears, requiredMonthlySIP, futureValueAtSIP,
    holdings, fundLookup, metrics, categoryAlloc, capBuckets,
  } = input;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const headerHeight = 18;
  const footerHeight = 14;
  const contentWidth = pageWidth - margin * 2;
  const contentStartY = margin + headerHeight + 4;

  // Load logos
  const logoBase64 = await loadLogoBase64();
  let whiteLogoBase64: string | null = null;
  let logoNaturalWidth = 0;
  let logoNaturalHeight = 0;
  if (logoBase64) {
    whiteLogoBase64 = await createWhiteLogo(logoBase64);
    const tmp = new Image();
    await new Promise<void>((resolve) => {
      tmp.onload = () => resolve();
      tmp.onerror = () => resolve();
      tmp.src = logoBase64;
    });
    logoNaturalWidth = tmp.width;
    logoNaturalHeight = tmp.height;
  }

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  let totalPages = 2; // computed: cover + content + disclaimer

  // ─── Header drawer ───
  function drawHeader(pageNum: number) {
    setFill(pdf, [10, 22, 40]);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    setFill(pdf, ACCENT);
    pdf.rect(0, headerHeight - 0.8, pageWidth, 0.8, 'F');

    let textStartX = margin;
    if (whiteLogoBase64 && logoNaturalWidth > 0) {
      try {
        const logoMaxH = headerHeight - 4;
        const aspect = logoNaturalWidth / logoNaturalHeight;
        const logoW = logoMaxH * aspect;
        pdf.addImage(whiteLogoBase64, 'PNG', margin, 2, logoW, logoMaxH);
        textStartX = margin + logoW + 3;
      } catch { /* ignore */ }
    }

    setText(pdf, [255, 255, 255]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Model Portfolio Report', textStartX, 8);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, [204, 251, 241]);
    pdf.text('Trustner Asset Services Pvt. Ltd. | merasip.com', textStartX, 12);

    setText(pdf, [204, 251, 241]);
    pdf.setFontSize(7);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 8, { align: 'right' });
    pdf.setFontSize(6);
    pdf.text(`Generated: ${generatedDate}`, pageWidth - margin, 12, { align: 'right' });
  }

  function drawFooter() {
    const y = pageHeight - footerHeight;
    setDraw(pdf, TEAL_700);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    setText(pdf, NEUTRAL_500);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      'Trustner Asset Services Pvt. Ltd. | AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor',
      margin, y + 3,
    );
    pdf.text('ARN-286886 | CIN: U66301AS2023PTC025505', margin, y + 5.5);
    setText(pdf, [148, 163, 184]);
    pdf.setFontSize(5);
    pdf.text(
      'Mutual fund/SIF/PMS investments are subject to market risks. Read all scheme-related documents carefully.',
      margin, y + 8,
    );
    setText(pdf, NEUTRAL_500);
    pdf.text('www.merasip.com', pageWidth - margin, y + 3, { align: 'right' });
  }

  function drawWatermark() {
    if (!logoBase64) return;
    pdf.saveGraphicsState();
    const pdfObj = pdf as unknown as { GState: new (opts: { opacity: number }) => unknown };
    pdf.setGState(new pdfObj.GState({ opacity: 0.04 }));
    const cx = pageWidth / 2, cy = pageHeight / 2;
    const wmH = 55;
    const wmW = wmH * (logoNaturalWidth / (logoNaturalHeight || 1));
    try { pdf.addImage(logoBase64, 'PNG', cx - wmW / 2, cy - wmH / 2, wmW, wmH); }
    catch { /* ignore */ }
    pdf.restoreGraphicsState();
  }

  // ═══════════ PAGE 1: Portfolio overview ═══════════
  drawHeader(1);
  drawWatermark();
  let y = contentStartY;

  // Title banner
  setFill(pdf, TEAL_50);
  pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  setDraw(pdf, [167, 243, 208]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');
  setText(pdf, TEAL_700);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text(safe(portfolioName), margin + 5, y + 8);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  setText(pdf, NEUTRAL_500);
  pdf.text(
    `Goal: ${fmtINR(goalAmount)}  •  Horizon: ${horizonYears} years  •  ${holdings.length} fund${holdings.length === 1 ? '' : 's'}`,
    margin + 5, y + 14,
  );
  y += 24;

  // ─── KPI strip ───
  const kpiH = 16;
  const kpiW = (contentWidth - 6) / 4;
  const kpis: { label: string; value: string }[] = [
    { label: 'REQUIRED SIP', value: `${fmtINR(requiredMonthlySIP)} /mo` },
    { label: 'EXPECTED 5Y CAGR', value: fmtPct(metrics.weightedReturn5Y, 2) },
    { label: 'AVG TER', value: fmtPct(metrics.weightedTER, 2) },
    { label: 'STD DEVIATION', value: fmtPct(metrics.weightedStdDev, 2) },
  ];
  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + 2);
    setFill(pdf, NEUTRAL_50);
    pdf.roundedRect(x, y, kpiW, kpiH, 1.5, 1.5, 'F');
    setDraw(pdf, NEUTRAL_200);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(x, y, kpiW, kpiH, 1.5, 1.5, 'S');
    setText(pdf, [148, 163, 184]);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.label, x + 2.5, y + 5);
    setText(pdf, NEUTRAL_900);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(safe(kpi.value), x + 2.5, y + 12);
  });
  y += kpiH + 6;

  // ─── Holdings table ───
  setText(pdf, NEUTRAL_700);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Portfolio Holdings', margin, y);
  y += 4;

  // Header row
  setFill(pdf, NEUTRAL_100);
  pdf.rect(margin, y, contentWidth, 6, 'F');
  setText(pdf, NEUTRAL_500);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FUND', margin + 2, y + 4);
  pdf.text('CATEGORY', margin + 100, y + 4);
  pdf.text('1Y', margin + 130, y + 4, { align: 'right' });
  pdf.text('3Y', margin + 145, y + 4, { align: 'right' });
  pdf.text('5Y', margin + 160, y + 4, { align: 'right' });
  pdf.text('WEIGHT', margin + contentWidth - 2, y + 4, { align: 'right' });
  y += 7;

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');

  // Sort holdings by weight descending for the table
  const sortedHoldings = [...holdings].sort((a, b) => b.weight - a.weight);
  for (let i = 0; i < sortedHoldings.length; i++) {
    const h = sortedHoldings[i];
    const f = fundLookup.get(h.fundId);
    if (!f) continue;
    if (i % 2 === 1) {
      setFill(pdf, NEUTRAL_50);
      pdf.rect(margin, y - 3.5, contentWidth, 6, 'F');
    }
    const colorIdx = holdings.findIndex((x) => x.fundId === h.fundId) % PIE.length;
    setFill(pdf, [...PIE[colorIdx]] as RGB);
    pdf.circle(margin + 2.5, y, 1.2, 'F');
    setText(pdf, NEUTRAL_900);
    pdf.setFont('helvetica', 'bold');
    // Truncate fund name to fit
    let name = f.name;
    if (pdf.getTextWidth(name) > 90) {
      while (pdf.getTextWidth(name + '…') > 90 && name.length > 0) {
        name = name.slice(0, -1);
      }
      name = name + '…';
    }
    pdf.text(safe(name), margin + 6, y + 0.5);
    pdf.setFont('helvetica', 'normal');
    setText(pdf, NEUTRAL_500);
    pdf.text(f.category, margin + 100, y + 0.5);

    const r1 = f.returns.oneYear * 100;
    const r3 = f.returns.threeYear * 100;
    const r5 = f.returns.fiveYear * 100;
    setText(pdf, r1 >= 0 ? POSITIVE : NEGATIVE);
    pdf.text(`${r1 >= 0 ? '+' : ''}${r1.toFixed(1)}%`, margin + 130, y + 0.5, { align: 'right' });
    setText(pdf, r3 >= 0 ? POSITIVE : NEGATIVE);
    pdf.text(`${r3 >= 0 ? '+' : ''}${r3.toFixed(1)}%`, margin + 145, y + 0.5, { align: 'right' });
    setText(pdf, r5 >= 0 ? POSITIVE : NEGATIVE);
    pdf.text(`${r5 >= 0 ? '+' : ''}${r5.toFixed(1)}%`, margin + 160, y + 0.5, { align: 'right' });

    setText(pdf, NEUTRAL_900);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${h.weight.toFixed(1)}%`, margin + contentWidth - 2, y + 0.5, { align: 'right' });
    y += 6;
  }

  // Total row
  setFill(pdf, TEAL_50);
  pdf.rect(margin, y - 3.5, contentWidth, 6, 'F');
  setText(pdf, TEAL_700);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('Total', margin + 6, y + 0.5);
  pdf.text(`${metrics.totalWeight.toFixed(1)}%`, margin + contentWidth - 2, y + 0.5, { align: 'right' });
  y += 10;

  // ─── Goal projection ───
  setFill(pdf, [240, 248, 255]);
  setDraw(pdf, [191, 219, 254]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');
  setText(pdf, [30, 64, 175]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GOAL PROJECTION', margin + 4, y + 6);

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  setText(pdf, NEUTRAL_700);
  pdf.text(`Target corpus`, margin + 4, y + 12);
  pdf.text(`Time horizon`, margin + 4, y + 17);
  pdf.text(`Required monthly SIP`, margin + 4, y + 22);

  pdf.setFont('helvetica', 'bold');
  setText(pdf, NEUTRAL_900);
  pdf.text(safe(fmtINR(goalAmount)), margin + 70, y + 12);
  pdf.text(`${horizonYears} years`, margin + 70, y + 17);
  setText(pdf, TEAL_700);
  pdf.text(safe(`${fmtINR(requiredMonthlySIP)}/month`), margin + 70, y + 22);

  pdf.setFont('helvetica', 'normal');
  setText(pdf, NEUTRAL_500);
  pdf.setFontSize(7);
  pdf.text(`Future value at this SIP: ${safe(fmtINR(futureValueAtSIP))}`, margin + contentWidth - 4, y + 22, { align: 'right' });
  pdf.text(`Expected return: ${fmtPct(metrics.weightedReturn5Y, 2)} p.a. (5Y blended CAGR)`, margin + contentWidth - 4, y + 17, { align: 'right' });

  y += 32;

  // ─── Allocation breakdown (two columns) ───
  const colW = (contentWidth - 6) / 2;

  // Category mix
  setText(pdf, NEUTRAL_700);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Category Mix', margin, y);
  pdf.text('Cap Allocation (estimated)', margin + colW + 6, y);
  y += 4;

  const startY = y;
  // Left column: categories
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  for (let i = 0; i < categoryAlloc.length && i < 8; i++) {
    const c = categoryAlloc[i];
    setFill(pdf, [...PIE[i % PIE.length]] as RGB);
    pdf.rect(margin, y - 2, 2, 2, 'F');
    setText(pdf, NEUTRAL_700);
    pdf.text(c.category, margin + 4, y);
    setText(pdf, NEUTRAL_900);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${c.weight.toFixed(1)}%`, margin + colW - 2, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    y += 5;
  }

  // Right column: cap buckets
  let yR = startY;
  for (let i = 0; i < capBuckets.length; i++) {
    const b = capBuckets[i];
    setText(pdf, NEUTRAL_700);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(b.bucket, margin + colW + 6, yR);
    // Bar
    setFill(pdf, NEUTRAL_100);
    pdf.rect(margin + colW + 30, yR - 2, colW - 38, 2.5, 'F');
    setFill(pdf, [...PIE[i % PIE.length]] as RGB);
    pdf.rect(margin + colW + 30, yR - 2, ((colW - 38) * b.weight) / 100, 2.5, 'F');
    setText(pdf, NEUTRAL_900);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${b.weight.toFixed(1)}%`, margin + contentWidth - 2, yR, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    yR += 5;
  }
  y = Math.max(y, yR) + 3;

  drawFooter();

  // ═══════════ PAGE 2: Disclaimers + about ═══════════
  pdf.addPage();
  drawHeader(2);
  drawWatermark();
  let dy = contentStartY;

  // Disclaimer banner
  setFill(pdf, [254, 242, 242]);
  setDraw(pdf, [252, 165, 165]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, dy, contentWidth, 12, 2, 2, 'FD');
  setText(pdf, [153, 27, 27]);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Important Disclaimers & Regulatory Information', margin + 5, dy + 8);
  dy += 18;

  function section(heading: string, text: string) {
    setText(pdf, NEUTRAL_700);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(heading, margin, dy);
    dy += 4;
    setText(pdf, NEUTRAL_500);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth - 4);
    pdf.text(lines, margin + 2, dy);
    dy += lines.length * 3 + 3;
  }

  section(
    'NATURE OF THIS DOCUMENT',
    'This Model Portfolio is a planning illustration generated by the user on merasip.com using publicly available fund data. It is NOT a personalised investment recommendation, NOT investment advice, and NOT a guarantee of future returns. The portfolio represents the user\'s own selection of mutual fund schemes; Trustner Asset Services Pvt. Ltd. has not assessed the user\'s financial situation, tax status, or investment objectives in producing this document.',
  );

  section(
    'CALCULATIONS & ASSUMPTIONS',
    'Weighted returns, weighted TER, and weighted standard deviation are simple weight-sum aggregations of historical fund metrics. Standard deviation is computed without regard to inter-fund covariance and therefore approximates rather than precisely measures portfolio risk. The required SIP and future value figures use the formula FV = SIP x [((1+r)^n-1)/r] with end-of-month compounding at the portfolio\'s historical 5-year CAGR. Past performance is not indicative of future returns.',
  );

  section(
    'MUTUAL FUND, SIF & PMS RISK DISCLAIMER',
    'Investments in securities, mutual funds, Specialized Investment Funds (SIF) and Portfolio Management Services (PMS) are subject to market risks. Read all scheme-related and offer documents carefully before investing. Past performance is not indicative of future results. The Mutual Fund/SIF/PMS does not guarantee or assure any returns or dividends under any scheme. The NAV of the schemes may go up or down depending on factors and forces affecting the securities market including fluctuations in interest rates.',
  );

  section(
    'NO GUARANTEE',
    'There is no assurance or guarantee that the objectives of any scheme included in this portfolio will be achieved. The portfolio of any scheme is subject to changes within the provisions of the respective Offer Document. Investors are requested to review prospectuses carefully and obtain expert professional advice on specific legal, tax and financial implications of the investment.',
  );

  section(
    'KYC & DISTRIBUTOR ROLE',
    'KYC is a one-time exercise while dealing in securities markets — once KYC is done through a SEBI-registered intermediary, you need not undergo the same process again. Trustner Asset Services Pvt. Ltd. (ARN-286886) is an AMFI Registered Mutual Fund Distributor and SIF Distributor, and an APMI Registered PMS Distributor. Trustner Asset Services Pvt. Ltd. acts only as a distributor and not as an investment advisor; commission earnings, if any, accrue to the distributor entity for facilitating client onboarding and ongoing servicing.',
  );

  section(
    'INVESTOR AWARENESS',
    'Investors are advised to deal only with SEBI Registered Mutual Fund Distributors. Verify registration status at www.amfiindia.com. For grievances, contact SEBI at scores.sebi.gov.in or toll-free 1800-22-7575. Insurance is the subject matter of solicitation; Trustner Insurance Brokers Pvt. Ltd. (IRDAI Broker Code: 1067) acts as an insurance broker.',
  );

  // Separator
  setDraw(pdf, NEUTRAL_200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, dy, pageWidth - margin, dy);
  dy += 5;

  // About company
  setText(pdf, NEUTRAL_900);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('About the Distributor', margin, dy);
  dy += 5;

  const companyDetails: [string, string][] = [
    ['Firm Name',   'Trustner Asset Services Pvt. Ltd.'],
    ['Registered',  'AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor'],
    ['AMFI ARN',    'ARN-286886'],
    ['CIN',         'U66301AS2023PTC025505'],
    ['Offices',     'Guwahati (HQ) | Bangalore | Kolkata | Hyderabad | Tezpur'],
    ['Contact',     '6003903737 | wecare@trustner.in'],
    ['Website',     'www.merasip.com | www.trustner.in'],
    ['Grievance',   'grievance@trustner.in'],
  ];

  pdf.setFontSize(7);
  for (const [label, value] of companyDetails) {
    setText(pdf, [148, 163, 184]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${label}:`, margin + 2, dy);
    setText(pdf, NEUTRAL_700);
    pdf.setFont('helvetica', 'bold');
    const lines = pdf.splitTextToSize(value, contentWidth - 35);
    pdf.text(lines, margin + 32, dy);
    dy += Math.max(lines.length * 3, 3.5);
  }
  dy += 4;

  // SEBI banner
  setFill(pdf, [239, 246, 255]);
  setDraw(pdf, [191, 219, 254]);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(margin, dy, contentWidth, 14, 2, 2, 'FD');
  setText(pdf, [30, 64, 175]);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SEBI INVESTOR CHARTER', margin + 4, dy + 4.5);
  setText(pdf, [59, 130, 246]);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    'For more details: https://www.sebi.gov.in  |  SCORES: scores.sebi.gov.in  |  Toll Free: 1800-22-7575  |  Smart ODR: smartodr.in',
    margin + 4, dy + 9,
  );

  drawFooter();

  // Save
  const safeFile = portfolioName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  pdf.save(`Trustner-Model-Portfolio-${safeFile}.pdf`);
}
