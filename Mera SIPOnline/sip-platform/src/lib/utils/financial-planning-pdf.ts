import { jsPDF } from 'jspdf';
import type { FinancialHealthReport, FinancialPlanningData, PillarScore } from '@/types/financial-planning';
import type {
  PlanTier,
  CashflowProjection,
  AssetAllocationMatrix,
  ExecutiveSummary,
  FinancialHealthReportV2,
} from '@/types/financial-planning-v2';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { formatINR } from '@/lib/utils/formatters';
import { LOGO_BASE64 } from '@/lib/constants/logo-base64';

// ─── Constants ───
const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const M = 12;   // margin
const CW = PW - M * 2; // content width
const HH = 16;  // header height
const FH = 12;  // footer height
const CSY = M + HH + 4; // content start Y

// ─── Colors ───
type RGB = [number, number, number];
const TEAL: RGB = [15, 118, 110];
const TEAL_LIGHT: RGB = [240, 253, 250];
const ORANGE: RGB = [232, 85, 58];
const S800: RGB = [30, 41, 59];
const S700: RGB = [51, 65, 85];
const S600: RGB = [71, 85, 105];
const S400: RGB = [148, 163, 184];
const S200: RGB = [226, 232, 240];
const S50: RGB = [248, 250, 252];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [185, 28, 28];
const AMBER: RGB = [217, 119, 6];
const GREEN: RGB = [21, 128, 61];
const BLUE: RGB = [29, 78, 216];
const PURPLE: RGB = [124, 58, 237];
const E50: RGB = [236, 253, 245];
const R50: RGB = [254, 242, 242];
const A50: RGB = [255, 251, 235];
const B50: RGB = [239, 246, 255];

const PILLAR_C: RGB[] = [TEAL, PURPLE, BLUE, ORANGE, AMBER];
const GRADE_C: Record<string, RGB> = {
  'Excellent': GREEN, 'Good': TEAL, 'Fair': AMBER, 'Needs Attention': ORANGE, 'Needs Improvement': ORANGE, 'Critical': RED,
};
const gc = (g: string): RGB => GRADE_C[g] || S600;

/** Sanitize text for Helvetica base font: replace ₹, smart punctuation, and any non-ASCII glyph
 *  that would otherwise render as (cid:0) boxes in jsPDF. */
const rs = (t: string): string => {
  if (!t) return '';
  return t
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')   // en-dash, em-dash
    .replace(/[‘’‚‛]/g, "'") // smart single quotes
    .replace(/[“”„‟]/g, '"') // smart double quotes
    .replace(/…/g, '...')         // ellipsis
    .replace(/ /g, ' ')           // non-breaking space
    .replace(/•/g, '-')           // bullet
    .replace(/[^\x20-\x7E\n\r\t]/g, ''); // strip remaining non-ASCII
};

// ─── Shared Helpers ───
function hdr(p: jsPDF, pg: number, dt: string, totalPages: number) {
  p.setFillColor(...TEAL); p.rect(0, 0, PW, HH, 'F');
  p.setFillColor(...ORANGE); p.rect(0, HH - 0.6, PW, 0.6, 'F');
  try { p.addImage(LOGO_BASE64, 'PNG', M, 2, 36, 12); } catch {
    p.setTextColor(255, 255, 255); p.setFontSize(9); p.setFont('helvetica', 'bold');
    p.text('TRUSTNER', M, 8);
  }
  p.setTextColor(204, 251, 241); p.setFontSize(7); p.setFont('helvetica', 'normal');
  p.text('Trustner Financial Health Report | merasip.com', M + 38, 8);
  p.setFontSize(6); p.text(`Page ${pg} of ${totalPages}`, PW - M, 7, { align: 'right' });
  p.setFontSize(5.5); p.text(`Generated: ${dt}`, PW - M, 10, { align: 'right' });
}

function ftr(p: jsPDF) {
  const y = PH - FH;
  p.setDrawColor(...TEAL); p.setLineWidth(0.2); p.line(M, y, PW - M, y);
  p.setTextColor(...S400); p.setFontSize(5); p.setFont('helvetica', 'normal');
  p.text(`${COMPANY.mfEntity.name} | ${COMPANY.mfEntity.type} | ${COMPANY.mfEntity.amfiArn} | CIN: ${COMPANY.mfEntity.cin}`, M, y + 3);
  p.setFontSize(4.5); p.text(DISCLAIMER.mutual_fund, M, y + 5.5);
  p.text('www.merasip.com', PW - M, y + 3, { align: 'right' });
}

function wm(p: jsPDF) {
  try {
    p.saveGraphicsState();
    const gs = (p as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;
    p.setGState(new gs({ opacity: 0.03 }));
    p.addImage(LOGO_BASE64, 'PNG', PW / 2 - 30, PH / 2 - 15, 60, 30);
    p.restoreGraphicsState();
  } catch { /* decorative — skip */ }
}

function secTitle(p: jsPDF, y: number, t: string): number {
  p.setFillColor(...TEAL); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(11); p.setFont('helvetica', 'bold');
  p.text(t, M + 5, y + 7); return y + 14;
}

function progBar(p: jsPDF, x: number, y: number, w: number, h: number, v: number, mx: number, c: RGB) {
  p.setFillColor(...S200); p.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
  const fw = Math.max(0, Math.min(w, (v / mx) * w));
  if (fw > 0) { p.setFillColor(...c); p.roundedRect(x, y, fw, h, h / 2, h / 2, 'F'); }
}

function kvRow(p: jsPDF, y: number, l: string, v: string, lc: RGB = S600, vc: RGB = S800): number {
  p.setTextColor(...lc); p.setFontSize(7); p.setFont('helvetica', 'normal'); p.text(l, M + 4, y);
  p.setTextColor(...vc); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text(rs(v), PW - M - 4, y, { align: 'right' });
  return y + 5;
}

// ─── Page 1: Cover ───
function p1(p: jsPDF, r: FinancialHealthReport, nm: string, dt: string, totalPages: number, tier: PlanTier = 'standard') {
  hdr(p, 1, dt, totalPages); wm(p);
  let y = 50;
  try { p.addImage(LOGO_BASE64, 'PNG', PW / 2 - 30, y, 60, 30); y += 38; } catch { y += 10; }

  // Tier badge near the top
  const tierLabels: Record<PlanTier, { label: string; color: RGB }> = {
    basic: { label: 'BASIC', color: S400 },
    standard: { label: 'STANDARD', color: TEAL },
    comprehensive: { label: 'COMPREHENSIVE', color: PURPLE },
  };
  const badge = tierLabels[tier];
  const badgeW = p.getStringUnitWidth(badge.label) * 7 / p.internal.scaleFactor + 14;
  p.setFillColor(...badge.color); p.roundedRect(PW / 2 - badgeW / 2, y - 2, badgeW, 8, 2, 2, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text(badge.label, PW / 2, y + 3.5, { align: 'center' }); y += 12;

  // Tier-aware title and subtitle
  const tierTitles: Record<PlanTier, { title: string; subtitle: string }> = {
    basic: { title: 'Financial Health Check', subtitle: 'Quick Scan Report' },
    standard: { title: 'Goal-Based Financial Plan', subtitle: 'Personalized Financial Strategy' },
    comprehensive: { title: 'Comprehensive Financial Blueprint', subtitle: 'Professional-Grade Financial Analysis' },
  };
  const titles = tierTitles[tier];

  p.setTextColor(...TEAL); p.setFontSize(22); p.setFont('helvetica', 'bold');
  p.text(titles.title, PW / 2, y, { align: 'center' }); y += 10;
  p.setTextColor(...S600); p.setFontSize(12); p.setFont('helvetica', 'normal');
  p.text(titles.subtitle, PW / 2, y, { align: 'center' }); y += 15;

  p.setFillColor(...TEAL_LIGHT); p.roundedRect(M + 20, y, CW - 40, 14, 3, 3, 'F');
  p.setDrawColor(...TEAL); p.setLineWidth(0.3); p.roundedRect(M + 20, y, CW - 40, 14, 3, 3, 'S');
  p.setTextColor(...TEAL); p.setFontSize(13); p.setFont('helvetica', 'bold');
  p.text(`Prepared for: ${nm}`, PW / 2, y + 9, { align: 'center' }); y += 22;

  p.setTextColor(...S400); p.setFontSize(9); p.setFont('helvetica', 'normal');
  p.text(`Assessment Date: ${dt}`, PW / 2, y, { align: 'center' }); y += 20;

  // Score gauge
  const cx = PW / 2, cy = y + 35, rad = 35, seg = 60;
  const ratio = Math.min(r.score.totalScore / 900, 1);
  const gCol = gc(r.score.grade);

  p.setDrawColor(...S200); p.setLineWidth(6);
  for (let i = 0; i < seg; i++) {
    const a1 = Math.PI - (i / seg) * Math.PI, a2 = Math.PI - ((i + 1) / seg) * Math.PI;
    p.line(cx + rad * Math.cos(a1), cy - rad * Math.sin(a1), cx + rad * Math.cos(a2), cy - rad * Math.sin(a2));
  }
  const filled = Math.floor(ratio * seg);
  if (filled > 0) {
    p.setDrawColor(...gCol); p.setLineWidth(6);
    for (let i = 0; i < filled; i++) {
      const a1 = Math.PI - (i / seg) * Math.PI, a2 = Math.PI - ((i + 1) / seg) * Math.PI;
      p.line(cx + rad * Math.cos(a1), cy - rad * Math.sin(a1), cx + rad * Math.cos(a2), cy - rad * Math.sin(a2));
    }
  }

  p.setTextColor(...gCol); p.setFontSize(28); p.setFont('helvetica', 'bold');
  p.text(`${r.score.totalScore}`, cx, cy - 5, { align: 'center' });
  p.setTextColor(...S400); p.setFontSize(9); p.setFont('helvetica', 'normal');
  p.text('out of 900', cx, cy + 3, { align: 'center' });

  p.setFillColor(...gCol);
  const gw = p.getStringUnitWidth(r.score.grade) * 10 / p.internal.scaleFactor + 12;
  p.roundedRect(cx - gw / 2, cy + 7, gw, 8, 2, 2, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text(r.score.grade, cx, cy + 13, { align: 'center' });

  p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
  p.text('0', cx - rad - 2, cy + 22, { align: 'center' });
  p.text('900', cx + rad + 2, cy + 22, { align: 'center' });

  const dy = PH - FH - 20;
  p.setFillColor(...S50); p.roundedRect(M + 10, dy, CW - 20, 12, 2, 2, 'F');
  p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
  const dl = p.splitTextToSize('This assessment is for educational purposes only. It does not constitute investment advice under SEBI regulations. Trustner Asset Services Pvt. Ltd. is an AMFI Registered MFD (ARN-286886).', CW - 28);
  p.text(dl, M + 14, dy + 5);
  ftr(p);
}

// ─── Page 2: Score Dashboard ───
function p2(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Your Financial Health Dashboard');

  p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
  p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text(`Overall Score: ${r.score.totalScore}/900`, M + 5, y + 6);
  const gCol = gc(r.score.grade);
  p.setFillColor(...gCol); p.roundedRect(PW - M - 30, y + 2, 26, 8, 2, 2, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(8); p.text(r.score.grade, PW - M - 17, y + 8, { align: 'center' });
  y += 20;

  const pillars: [string, PillarScore, RGB][] = [
    ['Cashflow Health', r.score.pillars.cashflow, PILLAR_C[0]],
    ['Protection & Insurance', r.score.pillars.protection, PILLAR_C[1]],
    ['Investments', r.score.pillars.investments, PILLAR_C[2]],
    ['Debt Management', r.score.pillars.debt, PILLAR_C[3]],
    ['Retirement Readiness', r.score.pillars.retirementReadiness, PILLAR_C[4]],
  ];

  for (const [nm, pl, col] of pillars) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 30, 2, 2, 'F');
    p.setDrawColor(...S200); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 30, 2, 2, 'S');
    p.setTextColor(...col); p.setFontSize(10); p.setFont('helvetica', 'bold'); p.text(nm, M + 5, y + 8);
    p.setTextColor(...S800); p.setFontSize(9); p.text(`${pl.score}/${pl.maxScore}`, PW - M - 5, y + 8, { align: 'right' });

    const pgc = gc(pl.grade);
    p.setFillColor(...pgc); p.roundedRect(PW - M - 45, y + 2, 24, 7, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.text(pl.grade, PW - M - 33, y + 7, { align: 'center' });

    progBar(p, M + 5, y + 13, CW - 10, 4, pl.score, pl.maxScore, col);
    p.setTextColor(...S600); p.setFontSize(7); p.setFont('helvetica', 'normal');
    const il = p.splitTextToSize(pl.keyInsight, CW - 14); p.text(il.slice(0, 2), M + 5, y + 23);
    y += 34;
  }
  ftr(p);
}

// ─── Page 3: Net Worth ───
function p3(p: jsPDF, r: FinancialHealthReport, d: FinancialPlanningData, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Net Worth Statement');
  const a = d.assetProfile, li = d.liabilityProfile;

  p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold'); p.text('Assets', M + 4, y + 5); y += 9;
  const aRows: [string, number][] = [
    ['Mutual Funds', a.mutualFunds || 0],
    ['Direct Equity / Stocks', a.stocks || 0], ['PPF / EPF', a.ppfEpf || 0], ['NPS', a.nps || 0],
    ['Fixed Deposits', a.fixedDeposits || 0], ['Gold / SGB', a.gold || 0],
    ['Real Estate (Non-residence)', a.realEstateInvestment || 0], ['Primary Residence', a.primaryResidenceValue || 0],
    ['Bank Savings', a.bankSavings || 0], ['Other Assets', a.otherAssets || 0],
  ];

  p.setFillColor(...TEAL); p.rect(M, y, CW, 6, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Asset Class', M + 4, y + 4); p.text('Value', PW - M - 4, y + 4, { align: 'right' }); y += 6;

  for (let i = 0; i < aRows.length; i++) {
    const [l, v] = aRows[i]; if (v <= 0) continue;
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 5.5, 'F');
    p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal'); p.text(l, M + 4, y + 4);
    p.setTextColor(...S800); p.setFont('helvetica', 'bold'); p.text(rs(formatINR(v)), PW - M - 4, y + 4, { align: 'right' }); y += 5.5;
  }
  p.setFillColor(...E50); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(...GREEN); p.setFontSize(7.5); p.setFont('helvetica', 'bold');
  p.text('Total Assets', M + 4, y + 5); p.text(rs(formatINR(r.netWorth.totalAssets)), PW - M - 4, y + 5, { align: 'right' }); y += 14;

  p.setTextColor(...RED); p.setFontSize(10); p.setFont('helvetica', 'bold'); p.text('Liabilities', M + 4, y + 5); y += 9;
  const lRows: [string, number][] = [
    ['Home Loan', li.homeLoan?.outstanding || 0], ['Car Loan', li.carLoan?.outstanding || 0],
    ['Personal Loan', li.personalLoan?.outstanding || 0], ['Education Loan', li.educationLoan?.outstanding || 0],
    ['Credit Card', li.creditCardDebt || 0], ['Other Loans', li.otherLoans || 0],
  ];

  p.setFillColor(...RED); p.rect(M, y, CW, 6, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Liability', M + 4, y + 4); p.text('Outstanding', PW - M - 4, y + 4, { align: 'right' }); y += 6;

  let hasLiab = false;
  for (let i = 0; i < lRows.length; i++) {
    const [l, v] = lRows[i]; if (v <= 0) continue; hasLiab = true;
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 5.5, 'F');
    p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal'); p.text(l, M + 4, y + 4);
    p.setTextColor(...S800); p.setFont('helvetica', 'bold'); p.text(rs(formatINR(v)), PW - M - 4, y + 4, { align: 'right' }); y += 5.5;
  }
  if (!hasLiab) {
    p.setFillColor(...E50); p.rect(M, y, CW, 5.5, 'F');
    p.setTextColor(...GREEN); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    p.text('No outstanding liabilities — debt free!', M + 4, y + 4); y += 5.5;
  }
  p.setFillColor(...R50); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(...RED); p.setFontSize(7.5); p.setFont('helvetica', 'bold');
  p.text('Total Liabilities', M + 4, y + 5); p.text(rs(formatINR(r.netWorth.totalLiabilities)), PW - M - 4, y + 5, { align: 'right' }); y += 14;

  const nwc = r.netWorth.netWorth >= 0 ? GREEN : RED;
  const nwBg = r.netWorth.netWorth >= 0 ? E50 : R50;
  p.setFillColor(...nwBg); p.roundedRect(M, y, CW, 18, 3, 3, 'F');
  p.setDrawColor(...nwc); p.setLineWidth(0.5); p.roundedRect(M, y, CW, 18, 3, 3, 'S');
  p.setTextColor(...nwc); p.setFontSize(12); p.setFont('helvetica', 'bold'); p.text('NET WORTH', M + 8, y + 8);
  p.setFontSize(16); p.text(rs(formatINR(r.netWorth.netWorth)), PW - M - 8, y + 12, { align: 'right' });
  y += 22;

  // ── Trustner Research Desk Note: Net Worth in context ──
  const advAge = d.personalProfile.age || 35;
  const advNW = r.netWorth.netWorth;
  const nwBoxH = 32;
  if (y + nwBoxH <= PH - FH - 5) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, nwBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, nwBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const nwLakhs = Math.round(advNW / 100000);
    const note = rs(
      `At age ${advAge}, a net worth of ${rs(formatINR(advNW))} places you in a meaningful wealth-building zone — most Indian households of comparable age sit between Rs. 30L and Rs. 1.2 Cr, so you are in or near the top quartile. The single most useful thing to remember is that the next Rs. 50 lakh of wealth typically comes 60-70% from compounding what you already own (equity MFs, EPF, NPS), and only 30-40% from fresh SIPs you add. That is why your asset-mix discipline (and resisting the urge to liquidate equity in a bad month) matters more than the rupee size of any new SIP. The figure of ${nwLakhs} lakh is not a finish line — it is the launchpad for the compounding curve to do its real work over the next 15-20 years.`
    );
    const lines = p.splitTextToSize(note, CW - 10);
    p.text(lines.slice(0, 5), M + 5, y + 11);
    y += nwBoxH + 2;
  }
  ftr(p);
}

// ─── Page 4: Retirement ───
function p4(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Retirement Readiness Analysis');
  const g = r.retirementGap;

  const mets = [
    { l: 'Required Corpus', v: rs(formatINR(g.requiredCorpus)), c: S800 },
    { l: 'Current Progress', v: rs(formatINR(g.currentProgress)), c: TEAL },
    { l: 'Gap Amount', v: g.gap > 0 ? rs(formatINR(g.gap)) : 'On Track!', c: g.gap > 0 ? RED : GREEN },
    { l: 'Years to Retirement', v: `${g.yearsToRetirement} years`, c: BLUE },
  ];
  const bw = (CW - 6) / 2;
  for (let i = 0; i < mets.length; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = M + col * (bw + 6), by = y + row * 22;
    p.setFillColor(...S50); p.roundedRect(bx, by, bw, 18, 2, 2, 'F');
    p.setDrawColor(...S200); p.setLineWidth(0.2); p.roundedRect(bx, by, bw, 18, 2, 2, 'S');
    p.setTextColor(...S400); p.setFontSize(7); p.setFont('helvetica', 'normal'); p.text(mets[i].l, bx + 5, by + 6);
    p.setTextColor(...mets[i].c); p.setFontSize(12); p.setFont('helvetica', 'bold'); p.text(mets[i].v, bx + 5, by + 14);
  }
  y += 50;

  p.setTextColor(...S800); p.setFontSize(9); p.setFont('helvetica', 'bold'); p.text('Required vs Current Progress', M + 4, y); y += 6;
  const mx = Math.max(g.requiredCorpus, g.currentProgress, 1);
  p.setTextColor(...S600); p.setFontSize(7); p.setFont('helvetica', 'normal');
  p.text('Required', M + 4, y + 4); progBar(p, M + 30, y, CW - 34, 5, g.requiredCorpus, mx, S600); y += 10;
  p.text('Current', M + 4, y + 4); progBar(p, M + 30, y, CW - 34, 5, g.currentProgress, mx, TEAL); y += 15;

  if (g.monthlyToClose > 0) {
    p.setFillColor(...A50); p.roundedRect(M, y, CW, 16, 2, 2, 'F');
    p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 16, 2, 2, 'S');
    p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text('Monthly SIP Needed to Bridge Gap', M + 5, y + 6);
    p.setFontSize(14); p.text(rs(formatINR(g.monthlyToClose)) + ' / month', M + 5, y + 13); y += 22;
  }

  // ── Trustner Research Desk Note: what a retirement-readiness number really means ──
  const retBoxH = 36;
  if (y + retBoxH <= PH - FH - 5) {
    const readinessPct = g.requiredCorpus > 0
      ? Math.min(100, Math.round((g.currentProgress / g.requiredCorpus) * 100))
      : 0;
    p.setFillColor(...B50); p.roundedRect(M, y, CW, retBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, retBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const note = rs(
      `A readiness of ${readinessPct}% does not mean you will run out at retirement; it means today's corpus, projected forward at 8-10%, would fund roughly ${readinessPct}% of the inflation-adjusted monthly need at age 60. EPF and NPS typically fill 25-35% of the required corpus on their own, so the headline gap is almost always smaller in practice than it first looks. When the gap is large, the single biggest non-painful lever is extending working years to 62-63 - each extra year of income adds ~7% to the corpus and removes one year of withdrawal, which is mathematically equivalent to a 12-15% bigger SIP today. We treat this number as a planning anchor that we revisit annually with you, not a verdict.`
    );
    const lines = p.splitTextToSize(note, CW - 10);
    p.text(lines.slice(0, 5), M + 5, y + 11);
    y += retBoxH + 3;
  }

  if (y + 18 <= PH - FH - 5) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 18, 2, 2, 'F');
    p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
    ['Assumptions: Inflation 6% p.a. | Life expectancy 85 years | Real return 3% post-retirement',
     'Projected growth: EPF/NPS at 8% CAGR, MF at 10% CAGR | Corpus calculated using annuity model',
     'These are indicative projections. Actual results may vary based on market conditions.'].forEach((l, i) => {
      p.text(l, M + 4, y + 4 + i * 4);
    });
  }
  ftr(p);
}

// ─── Page 5: Goals ───
function p5(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Goal Funding Analysis');
  const goals = r.goalGaps;

  if (!goals || goals.length === 0) {
    p.setTextColor(...S600); p.setFontSize(10); p.setFont('helvetica', 'normal');
    p.text('No financial goals were specified during the assessment.', M + 5, y + 10);
    p.text('Setting clear financial goals is the first step to building wealth.', M + 5, y + 18);
    ftr(p); return;
  }

  // Recommended Monthly SIP summary box at top
  const tm = goals.reduce((s, g) => s + g.monthlyRequired, 0);
  p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 16, 2, 2, 'F');
  p.setDrawColor(...TEAL); p.setLineWidth(0.4); p.roundedRect(M, y, CW, 16, 2, 2, 'S');
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('Recommended Monthly SIP (All Goals Combined)', M + 5, y + 6);
  p.setFontSize(14); p.text(rs(formatINR(tm)) + ' / month', M + 5, y + 13);
  p.setFontSize(7); p.setFont('helvetica', 'normal'); p.setTextColor(...S600);
  p.text(`Across ${goals.length} goal(s)`, PW - M - 5, y + 10, { align: 'right' });
  y += 20;

  // Helper: suggest vehicle based on time horizon (years)
  const suggestVehicle = (yearsToGoal: number): string => {
    if (yearsToGoal <= 1) return 'Liquid Fund';
    if (yearsToGoal <= 3) return 'Short Duration Debt';
    if (yearsToGoal <= 5) return 'Balanced Advantage';
    if (yearsToGoal <= 10) return 'Flexi Cap / Large Cap';
    return 'Small/Mid Cap + Flexi Cap';
  };

  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
  p.text('Goal', M + 3, y + 5); p.text('Cost @ Target Yr', M + 42, y + 5);
  p.text('Progress', M + 68, y + 5); p.text('Monthly SIP', M + 92, y + 5);
  p.text('Suggested Vehicle', M + 118, y + 5);
  p.text('Status', PW - M - 4, y + 5, { align: 'right' }); y += 7;

  const fc: Record<string, RGB> = { 'on-track': GREEN, 'possible': TEAL, 'stretch': AMBER, 'unrealistic': RED };
  // Constructive, CFP-grade labels — never use the word "Unrealistic" on a client-facing page.
  const fLabel: Record<string, string> = {
    'on-track': 'On Track',
    'possible': 'Possible',
    'stretch': 'Stretch — Phase It',
    'unrealistic': 'Re-frame & Stage',
  };
  // Track stretch/unrealistic goals so we can render a coaching block after the table.
  let stretchCount = 0;
  let unrealisticCount = 0;

  for (let i = 0; i < goals.length; i++) {
    const gl = goals[i];
    if (gl.feasibility === 'stretch') stretchCount++;
    if (gl.feasibility === 'unrealistic') unrealisticCount++;
    // Estimate years to goal from future cost vs current progress (rough)
    const yearsToGoal = gl.futureCost > 0 && gl.currentProgress > 0
      ? Math.max(1, Math.ceil(Math.log(gl.futureCost / Math.max(gl.currentProgress, 1)) / Math.log(1.1)))
      : 5;
    const vehicle = suggestVehicle(yearsToGoal);

    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 8, 'F');
    p.setTextColor(...S800); p.setFontSize(6); p.setFont('helvetica', 'bold');
    p.text(rs(gl.goalName).substring(0, 18), M + 3, y + 5.5);
    p.setFont('helvetica', 'normal'); p.setTextColor(...S600);
    p.text(rs(formatINR(gl.futureCost)), M + 42, y + 5.5);
    p.text(rs(formatINR(gl.currentProgress)), M + 68, y + 5.5);
    p.text(gl.monthlyRequired > 0 ? rs(formatINR(gl.monthlyRequired)) : '-', M + 92, y + 5.5);
    p.setTextColor(...BLUE); p.setFontSize(5.5);
    p.text(vehicle, M + 118, y + 5.5);

    const fCol = fc[gl.feasibility] || S600;
    const fLbl = fLabel[gl.feasibility] || gl.feasibility.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    // Wider pill so longer label fits cleanly
    p.setFillColor(...fCol); p.roundedRect(PW - M - 28, y + 1.5, 26, 5, 1, 1, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
    p.text(fLbl, PW - M - 15, y + 5, { align: 'center' });
    y += 8;
  }

  // ── CFP-grade coaching block when goals are flagged stretch/unrealistic ──
  if (stretchCount + unrealisticCount > 0) {
    const _totFC = goals.reduce((s, g) => s + g.futureCost, 0);
    y += 4;
    const coachH = 36;
    p.setFillColor(...A50); p.roundedRect(M, y, CW, coachH, 2, 2, 'F');
    p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, coachH, 2, 2, 'S');
    p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text('Coach\'s Note — How To Reach The Goals That Look Out Of Reach Today', M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const coachLines = [
      'A goal flagged "Re-frame & Stage" or "Stretch" is not a failure — it is a signal that the current inputs (income, horizon, target, monthly savings)',
      'will not converge as-is. CFP practice prescribes four levers, in order of least disruption:',
      '1. EXTEND the horizon by 3-7 years where life flexibility allows (e.g. retire at 62 not 60). Compounding is your single biggest ally.',
      '2. RE-SIZE the target with the family — is 60-70% of ' + rs(formatINR(_totFC)).replace(/\s/g, '') + ' the realistic life-quality threshold rather than 100%?',
      '3. STAGE the goal — break a single big future cost into 3 sub-goals at years 7 / 12 / 19 with separate SIP buckets.',
      '4. STEP-UP your SIP 10-15% per year as income grows. Starting at ' + rs(formatINR(Math.round(tm * 0.55))).replace(/\s/g, '') + '/mo and stepping up converges to the ' + rs(formatINR(tm)).replace(/\s/g, '') + '/mo target.',
    ];
    for (let i = 0; i < coachLines.length; i++) {
      p.text(coachLines[i], M + 5, y + 11 + i * 4);
    }
    y += coachH + 2;
  }

  // Step-up SIP row
  y += 4;
  p.setFillColor(...A50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
  p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 14, 2, 2, 'S');
  p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text('With 10% Annual Step-up SIP', M + 5, y + 6);
  // Approximate: stepped SIP ~ flat SIP * 0.72 for 10-year goals
  const steppedSIP = Math.round(tm * 0.72);
  p.setFontSize(10); p.text(rs(formatINR(steppedSIP)) + ' / month (starting)', M + 5, y + 12);
  p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal');
  p.text('Increases 10% each year, reduces initial burden', PW - M - 5, y + 10, { align: 'right' });
  y += 18;

  // Summary box
  const tfc = goals.reduce((s, g) => s + g.futureCost, 0);
  p.setFillColor(...B50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
  p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text(`Total Goals: ${goals.length}`, M + 5, y + 6);
  p.text(`Combined Future Cost: ${rs(formatINR(tfc))}`, M + 5, y + 11);
  p.text(`Total Monthly SIP: ${rs(formatINR(tm))}`, PW - M - 5, y + 9, { align: 'right' });
  y += 18;

  // ── Trustner Research Desk Note: Why these vehicles (horizon-to-instrument mapping) ──
  const vehBoxH = 18;
  if (y + vehBoxH <= PH - FH - 14) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, vehBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, vehBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note - Why These Vehicles", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const vehNote = rs(
      'The vehicle for each goal is chosen by time horizon, not by what is "performing" today. Under 3 years, capital safety wins (Liquid / Short Duration). 3-7 years, volatility cushioning (Balanced Advantage). 7+ years, equity does the heavy lifting (Flexi Cap, with Small/Mid Cap for 10+ year horizons). Fund selection within each category is reviewed annually with you.'
    );
    const vehLines = p.splitTextToSize(vehNote, CW - 10);
    p.text(vehLines.slice(0, 2), M + 5, y + 11);
    y += vehBoxH + 2;
  }

  // Cost basis clarification — critical for client interpretation
  if (y + 12 <= PH - FH - 5) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, 12, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 12, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(6); p.setFont('helvetica', 'bold');
    p.text('How we read your goal numbers', M + 5, y + 4.5);
    p.setTextColor(...S700); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
    // rs() must run on the STRING first, then split — splitTextToSize
    // returns an array, and rs() expects a single string to call .replace on.
    const basisNote = p.splitTextToSize(
      rs('If you entered the target as TODAY\'S price, we inflated it to the target year using category defaults — Education 10%, Marriage 8%, Housing 7%, others 6% p.a. If you entered the target as a FUTURE budget, we used your number as-is. Reach out to the Trustner team if you want to switch any goal between these two modes.'),
      CW - 10
    );
    p.text(basisNote, M + 5, y + 8);
    y += 14;
  }

  // MFD note
  if (y + 10 <= PH - FH - 5) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
    p.setTextColor(...S600); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
    const mfdNote = p.splitTextToSize('All recommendations are for Regular plans through your MFD (ARN-286886). No direct plan recommendations. Vehicle suggestions are indicative and based on time horizon.', CW - 10);
    p.text(mfdNote, M + 5, y + 4);
  }
  ftr(p);
}

// ─── Page 6: Insurance ───
function p6(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Insurance & Protection Analysis');
  const ins = r.insuranceGap;

  p.setTextColor(...PURPLE); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Life Insurance Coverage', M + 4, y + 5); y += 10;
  y = kvRow(p, y, 'Human Life Value (HLV)', rs(formatINR(ins.lifeInsuranceNeed)));
  y = kvRow(p, y, 'Current Life Cover', rs(formatINR(ins.currentLifeCover)));
  const lgc = ins.lifeInsuranceGap > 0 ? RED : GREEN;
  y = kvRow(p, y, 'Life Insurance Gap', ins.lifeInsuranceGap > 0 ? `${rs(formatINR(ins.lifeInsuranceGap))} shortfall` : 'Adequately covered', lgc, lgc);
  y += 3;
  const lmx = Math.max(ins.lifeInsuranceNeed, ins.currentLifeCover, 1);
  p.setTextColor(...S600); p.setFontSize(6.5);
  p.text('Needed', M + 4, y + 3); progBar(p, M + 25, y, CW - 29, 4, ins.lifeInsuranceNeed, lmx, S400); y += 8;
  p.text('Current', M + 4, y + 3); progBar(p, M + 25, y, CW - 29, 4, ins.currentLifeCover, lmx, ins.lifeInsuranceGap > 0 ? ORANGE : GREEN); y += 15;

  p.setTextColor(...BLUE); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Health Insurance Coverage', M + 4, y + 5); y += 10;
  y = kvRow(p, y, 'Recommended Cover (City-tier)', rs(formatINR(ins.healthInsuranceNeed)));
  y = kvRow(p, y, 'Current Health Cover', rs(formatINR(ins.currentHealthCover)));
  const hgc = ins.healthInsuranceGap > 0 ? RED : GREEN;
  y = kvRow(p, y, 'Health Insurance Gap', ins.healthInsuranceGap > 0 ? `${rs(formatINR(ins.healthInsuranceGap))} shortfall` : 'Adequately covered', hgc, hgc);
  y += 3;

  const adC: Record<string, RGB> = { 'adequate': GREEN, 'low': AMBER, 'critical': RED };
  const adB: Record<string, RGB> = { 'adequate': E50, 'low': A50, 'critical': R50 };
  p.setFillColor(...(adB[ins.healthAdequacy] || A50)); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
  p.setTextColor(...(adC[ins.healthAdequacy] || AMBER)); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text(`Health Cover Adequacy: ${ins.healthAdequacy.toUpperCase()}`, M + 5, y + 7); y += 18;

  // Recommended Action summary box
  const hasLifeGap = ins.lifeInsuranceGap > 0;
  const hasHealthGap = ins.healthInsuranceGap > 0;
  if (hasLifeGap || hasHealthGap) {
    p.setFillColor(...A50); p.roundedRect(M, y, CW, (hasLifeGap && hasHealthGap ? 22 : 14), 2, 2, 'F');
    p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, (hasLifeGap && hasHealthGap ? 22 : 14), 2, 2, 'S');
    p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text('Recommended Actions', M + 5, y + 6);
    let ay = y + 12;
    if (hasLifeGap) {
      p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
      p.text(`> Increase term cover by ${rs(formatINR(ins.lifeInsuranceGap))} via pure term plan`, M + 5, ay);
      ay += 5;
    }
    if (hasHealthGap) {
      p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
      p.text(`> Enhance health cover to ${rs(formatINR(ins.healthInsuranceNeed))} (consider super top-up)`, M + 5, ay);
      ay += 5;
    }
    y += (hasLifeGap && hasHealthGap ? 26 : 18);
  }

  // ── Trustner Research Desk Note: protection priority + super top-up structure ──
  const insBoxH = 32;
  if (y + insBoxH <= PH - FH - 18) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, insBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, insBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const advNote = rs(
      'Order of priority in Indian protection planning: health cover comes before topping up life cover, especially for clients with no dependents or already-adequate term insurance, because a single hospitalisation can wipe out years of equity gains. For a Rs. 25L health gap, the cost-effective Indian standard is a Rs. 5-10L base policy paired with a Rs. 50L super top-up that triggers above the base - the combined annual premium is typically 35-45% of buying a single Rs. 50L policy outright. Term cover should be pure-protection only (avoid ULIPs and endowment); HLV-based cover from a high-claim-ratio insurer is the right product, not the highest-commission one.'
    );
    const lines = p.splitTextToSize(advNote, CW - 10);
    p.text(lines.slice(0, 5), M + 5, y + 11);
    y += insBoxH + 2;
  }

  // IRDAI note
  if (y + 14 <= PH - FH - 5) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
    p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const note = p.splitTextToSize('Insurance gap analysis is indicative. For personalized insurance recommendations, please consult a licensed insurance advisor. Insurance recommendations via Trustner Insurance Brokers (IRDAI CA License #1067).', CW - 10);
    p.text(note, M + 5, y + 5);
  }
  ftr(p);
}

// ─── Page 7: Asset Allocation ───
function p7(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Asset Allocation Analysis');
  const cur = r.assetAllocation.current, rec = r.assetAllocation.recommended;
  const ac: Record<string, RGB> = { Equity: BLUE, Debt: TEAL, Gold: AMBER, 'Real Estate': ORANGE, Cash: S400 };
  const cats: [string, number, number][] = [
    ['Equity', cur.equity, rec.equity], ['Debt', cur.debt, rec.debt],
    ['Gold', cur.gold, rec.gold], ['Real Estate', cur.realEstate, rec.realEstate],
    ['Cash', cur.cash, rec.cash],
  ];

  const drawBar = (label: string, data: [string, number][]) => {
    p.setTextColor(...S800); p.setFontSize(10); p.setFont('helvetica', 'bold'); p.text(label, M + 4, y + 5); y += 10;
    let bx = M;
    for (const [n, pct] of data) {
      if (pct <= 0) continue;
      const w = (pct / 100) * CW;
      p.setFillColor(...(ac[n] || S400)); p.rect(bx, y, w, 12, 'F');
      if (w > 15) { p.setTextColor(255, 255, 255); p.setFontSize(6); p.setFont('helvetica', 'bold'); p.text(`${pct.toFixed(0)}%`, bx + w / 2, y + 8, { align: 'center' }); }
      bx += w;
    }
    y += 14;
  };

  drawBar('Current Allocation', cats.map(([n, c]) => [n, c]));
  let lx = M;
  for (const [n] of cats) {
    p.setFillColor(...(ac[n] || S400)); p.rect(lx, y, 4, 4, 'F');
    p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal'); p.text(n, lx + 6, y + 3.5);
    lx += 35;
  }
  y += 12;
  drawBar('Recommended Allocation', cats.map(([n, , r]) => [n, r]));
  y += 4;

  p.setFillColor(...TEAL); p.rect(M, y, CW, 6, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Asset Class', M + 4, y + 4); p.text('Current', M + 80, y + 4); p.text('Recommended', M + 110, y + 4);
  p.text('Action', PW - M - 4, y + 4, { align: 'right' }); y += 6;

  for (let i = 0; i < cats.length; i++) {
    const [n, c, rc] = cats[i];
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 6, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    p.text(n, M + 4, y + 4); p.text(`${c.toFixed(0)}%`, M + 80, y + 4); p.text(`${rc.toFixed(0)}%`, M + 110, y + 4);
    const d = rc - c;
    const aCol = d > 5 ? GREEN : d < -5 ? RED : S400;
    const aTxt = d > 5 ? `Increase ${d.toFixed(0)}%` : d < -5 ? `Reduce ${Math.abs(d).toFixed(0)}%` : 'Maintain';
    p.setTextColor(...aCol); p.setFont('helvetica', 'bold'); p.text(aTxt, PW - M - 4, y + 4, { align: 'right' });
    y += 6;
  }

  // ── Trustner Research Desk Note: pushing back on the formulaic 100-minus-age rule ──
  y += 6;
  const aaBoxH = 32;
  if (y + aaBoxH <= PH - FH - 5) {
    const eqNow = Math.round(cur.equity);
    p.setFillColor(...B50); p.roundedRect(M, y, CW, aaBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, aaBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const note = rs(
      `A current ${eqNow}% equity weight should be read against your real horizon, not a textbook "100 minus age" formula. With 19+ years to retirement and an HNI corpus that can absorb a 25-30% drawdown without altering lifestyle, a 55-65% equity weight is closer to right than the 35-40% the formula prescribes. The textbook rule was calibrated on a 1980s US retiree with no second-leg of NPS or rental income - it does not match Indian household reality. The bigger risk for clients in your segment is not equity volatility, it is dragging too much wealth into FDs and gold and watching real returns get eaten by inflation. We adjust the equity glide-path 5 years before retirement, not 19.`
    );
    const lines = p.splitTextToSize(note, CW - 10);
    p.text(lines.slice(0, 5), M + 5, y + 11);
  }

  ftr(p);
}

// ─── Page 8: Action Plan ───
function p8(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Your Action Plan');
  const acts = r.actionPlan;

  if (acts.length === 0) {
    p.setTextColor(...S600); p.setFontSize(10); p.text('No specific action items generated.', M + 5, y + 10);
    ftr(p); return;
  }

  p.setTextColor(...S600); p.setFontSize(8); p.setFont('helvetica', 'normal');
  p.text('Prioritized recommendations based on your financial health assessment:', M + 4, y + 3); y += 10;

  const ic: Record<string, RGB> = { high: RED, medium: AMBER, low: BLUE };
  const ib: Record<string, RGB> = { high: R50, medium: A50, low: B50 };

  for (let i = 0; i < acts.length; i++) {
    const a = acts[i];
    const bg = ib[a.impact] || S50, col = ic[a.impact] || S600;
    p.setFillColor(...bg); p.roundedRect(M, y, CW, 22, 2, 2, 'F');
    p.setFillColor(...col); p.rect(M, y, 3, 22, 'F');
    p.setFillColor(...col); p.circle(M + 10, y + 7, 4, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text(`${i + 1}`, M + 10, y + 9, { align: 'center' });

    p.setFillColor(...col); p.roundedRect(PW - M - 22, y + 3, 18, 6, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.text(a.impact.toUpperCase(), PW - M - 13, y + 7.5, { align: 'center' });

    p.setTextColor(...S800); p.setFontSize(8); p.setFont('helvetica', 'bold');
    const al = p.splitTextToSize(a.action, CW - 45); p.text(al.slice(0, 2), M + 18, y + 8);
    p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal'); p.text(a.category, M + 18, y + 18);
    y += 26;
  }
  ftr(p);
}

// ─── Page 9: AI Narrative ───
function p9(p: jsPDF, r: FinancialHealthReport, nm: string, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Personalized Assessment');
  const fn = nm.split(' ')[0];
  p.setTextColor(...TEAL); p.setFontSize(11); p.setFont('helvetica', 'bold');
  p.text(`Dear ${fn},`, M + 8, y + 5); y += 12;

  p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 140, 3, 3, 'F');
  p.setDrawColor(...TEAL); p.setLineWidth(0.5); p.roundedRect(M, y, CW, 140, 3, 3, 'S');
  p.setFillColor(...TEAL); p.rect(M, y, 3, 140, 'F');

  p.setTextColor(...S800); p.setFontSize(8); p.setFont('helvetica', 'normal');
  const nar = rs(r.claudeNarrative || 'Your personalized narrative will be generated soon.');
  const nl = p.splitTextToSize(nar, CW - 20); p.text(nl, M + 10, y + 8);
  y += 148;

  p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
  p.text("This narrative was generated using AI by Trustner's financial wellness engine.", M + 5, y); y += 8;

  p.setFillColor(...TEAL); p.roundedRect(M, y, CW, 20, 3, 3, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Ready to take the next step?', PW / 2, y + 8, { align: 'center' });
  p.setFontSize(8); p.setFont('helvetica', 'normal');
  p.text(`Call ${COMPANY.contact.phoneDisplay} | Visit merasip.com | Email ${COMPANY.contact.email}`, PW / 2, y + 15, { align: 'center' });
  ftr(p);
}

// ─── Page 10: Disclaimers ───
function p10(p: jsPDF, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Important Disclaimers & Regulatory Information');

  const secs: [string, string][] = [
    ['FINANCIAL WELLNESS ASSESSMENT DISCLAIMER', 'This Financial Health Report is for educational and informational purposes only. It does not constitute investment advice, tax advice, or financial planning advice under SEBI regulations. The assessment scores, projections, and recommendations are based on self-reported data and standard financial planning assumptions. Actual results may vary significantly.'],
    ['MUTUAL FUND DISCLAIMER', DISCLAIMER.mutual_fund + ' ' + DISCLAIMER.risk_factors],
    ['NO GUARANTEE', DISCLAIMER.no_guarantee],
    ['INSURANCE DISCLAIMER', 'Insurance gap analysis provided in this report is indicative and based on general guidelines. For personalized insurance recommendations, please consult a licensed insurance advisor. Trustner Insurance Brokers Pvt. Ltd. (IRDAI License #1067) provides insurance broking services.'],
    ['KYC COMPLIANCE', DISCLAIMER.kyc],
    ['INVESTOR AWARENESS', DISCLAIMER.sebi_investor + ' ' + DISCLAIMER.grievance],
  ];

  for (const [h, t] of secs) {
    if (y > PH - FH - 25) break;
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text(h, M + 2, y); y += 3.5;
    p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal');
    const ls = p.splitTextToSize(t, CW - 6); p.text(ls, M + 3, y); y += ls.length * 2.8 + 4;
  }

  y += 2; p.setDrawColor(...S200); p.setLineWidth(0.2); p.line(M, y, PW - M, y); y += 4;
  p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text('ABOUT THE DISTRIBUTOR', M + 2, y); y += 5;

  const dets: [string, string][] = [
    ['Firm Name', COMPANY.mfEntity.name], ['Type', COMPANY.mfEntity.type],
    ['AMFI ARN', COMPANY.mfEntity.amfiArn], ['CIN', COMPANY.mfEntity.cin],
    ['Offices', COMPANY.offices.map(o => o.city).join(' | ')],
    ['Contact', `${COMPANY.contact.phoneDisplay} | ${COMPANY.contact.email}`],
    ['Website', 'www.merasip.com | www.trustner.in'],
    ['Grievance', COMPANY.contact.grievanceEmail],
  ];
  for (const [l, v] of dets) {
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal'); p.text(`${l}:`, M + 3, y);
    p.setTextColor(...S600); p.setFont('helvetica', 'bold'); p.text(v, M + 28, y); y += 3.5;
  }

  y += 4;
  if (y < PH - FH - 15) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
    p.setTextColor(...BLUE); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
    p.text('SEBI INVESTOR CHARTER', M + 4, y + 4);
    p.setFont('helvetica', 'normal');
    p.text('For more details: www.sebi.gov.in | SCORES: scores.gov.in | Toll Free: 1800-22-7575', M + 4, y + 7.5);
  }
  ftr(p);
}

// ═══════════════════════════════════════════════════════════════════
// ─── BASIC TIER PAGES ───
// ═══════════════════════════════════════════════════════════════════

// ─── Basic Page 3: Quick Insights + Top Actions ───
function pBasicInsights(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Quick Insights & Top Actions');

  // Quick Insights section
  p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Key Findings', M + 4, y + 5); y += 10;

  const pillars: [string, PillarScore, RGB][] = [
    ['Cashflow Health', r.score.pillars.cashflow, PILLAR_C[0]],
    ['Protection & Insurance', r.score.pillars.protection, PILLAR_C[1]],
    ['Investments', r.score.pillars.investments, PILLAR_C[2]],
    ['Debt Management', r.score.pillars.debt, PILLAR_C[3]],
    ['Retirement Readiness', r.score.pillars.retirementReadiness, PILLAR_C[4]],
  ];

  for (const [nm, pl, col] of pillars) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
    p.setDrawColor(...S200); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 14, 2, 2, 'S');
    p.setTextColor(...col); p.setFontSize(8); p.setFont('helvetica', 'bold'); p.text(nm, M + 5, y + 6);
    p.setTextColor(...S800); p.setFontSize(8); p.text(`${pl.score}/${pl.maxScore}`, PW - M - 30, y + 6, { align: 'right' });
    const pgc = gc(pl.grade);
    p.setFillColor(...pgc); p.roundedRect(PW - M - 24, y + 2, 20, 6, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.text(pl.grade, PW - M - 14, y + 6, { align: 'center' });
    progBar(p, M + 5, y + 10, CW - 10, 2.5, pl.score, pl.maxScore, col);
    y += 17;
  }

  y += 5;
  // Top 3 Actions
  p.setTextColor(...ORANGE); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Top 3 Actions', M + 4, y + 5); y += 10;

  const ic: Record<string, RGB> = { high: RED, medium: AMBER, low: BLUE };
  const ib: Record<string, RGB> = { high: R50, medium: A50, low: B50 };
  const topActs = r.actionPlan.slice(0, 3);

  for (let i = 0; i < topActs.length; i++) {
    const a = topActs[i];
    const bg = ib[a.impact] || S50, col = ic[a.impact] || S600;
    p.setFillColor(...bg); p.roundedRect(M, y, CW, 16, 2, 2, 'F');
    p.setFillColor(...col); p.rect(M, y, 3, 16, 'F');
    p.setFillColor(...col); p.circle(M + 10, y + 6, 3.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(`${i + 1}`, M + 10, y + 7.5, { align: 'center' });
    p.setTextColor(...S800); p.setFontSize(7.5); p.setFont('helvetica', 'bold');
    const al = p.splitTextToSize(a.action, CW - 35); p.text(al.slice(0, 2), M + 18, y + 7);
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal'); p.text(a.category, M + 18, y + 13);
    y += 19;
  }

  ftr(p);
}

// ─── Basic Page 4: Disclaimers with Upgrade CTA ───
function pBasicDisclaimers(p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Important Disclaimers');

  // Abbreviated disclaimers
  const secs: [string, string][] = [
    ['FINANCIAL WELLNESS ASSESSMENT', 'This Financial Health Report is for educational and informational purposes only. It does not constitute investment advice, tax advice, or financial planning advice under SEBI regulations.'],
    ['MUTUAL FUND DISCLAIMER', DISCLAIMER.mutual_fund],
    ['INVESTOR AWARENESS', DISCLAIMER.sebi_investor + ' ' + DISCLAIMER.grievance],
  ];

  for (const [h, t] of secs) {
    if (y > PH - FH - 80) break;
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text(h, M + 2, y); y += 3.5;
    p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal');
    const ls = p.splitTextToSize(t, CW - 6); p.text(ls, M + 3, y); y += ls.length * 2.8 + 4;
  }

  // Distributor info
  y += 2; p.setDrawColor(...S200); p.setLineWidth(0.2); p.line(M, y, PW - M, y); y += 4;
  p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text('ABOUT THE DISTRIBUTOR', M + 2, y); y += 5;
  const dets: [string, string][] = [
    ['Firm Name', COMPANY.mfEntity.name], ['AMFI ARN', COMPANY.mfEntity.amfiArn],
    ['Contact', `${COMPANY.contact.phoneDisplay} | ${COMPANY.contact.email}`],
    ['Website', 'www.merasip.com | www.trustner.in'],
  ];
  for (const [l, v] of dets) {
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal'); p.text(`${l}:`, M + 3, y);
    p.setTextColor(...S600); p.setFont('helvetica', 'bold'); p.text(v, M + 28, y); y += 3.5;
  }

  // Upgrade CTA
  y += 10;
  p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 50, 3, 3, 'F');
  p.setDrawColor(...TEAL); p.setLineWidth(0.5); p.roundedRect(M, y, CW, 50, 3, 3, 'S');
  p.setFillColor(...TEAL); p.rect(M, y, 3, 50, 'F');

  p.setTextColor(...TEAL); p.setFontSize(12); p.setFont('helvetica', 'bold');
  p.text('Unlock Your Full Financial Report', M + 10, y + 10);

  p.setTextColor(...S600); p.setFontSize(8); p.setFont('helvetica', 'normal');
  const upgradeItems = [
    'Detailed Net Worth & Asset Breakdown',
    'Retirement Readiness Analysis with Gap Projections',
    'Goal-by-Goal Funding Analysis',
    'Insurance Coverage Gap Analysis',
    'Personalized Asset Allocation Recommendations',
    'AI-Powered Personalized Narrative',
  ];
  for (let i = 0; i < upgradeItems.length; i++) {
    p.setTextColor(...TEAL); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text('>', M + 10, y + 18 + i * 4.5);
    p.setTextColor(...S600); p.setFontSize(7); p.setFont('helvetica', 'normal'); p.text(upgradeItems[i], M + 16, y + 18 + i * 4.5);
  }

  y += 56;
  p.setFillColor(...TEAL); p.roundedRect(M + 20, y, CW - 40, 14, 3, 3, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Upgrade at merasip.com/financial-planning', PW / 2, y + 9, { align: 'center' });

  y += 20;
  p.setFillColor(...TEAL); p.roundedRect(M, y, CW, 20, 3, 3, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Ready to take the next step?', PW / 2, y + 8, { align: 'center' });
  p.setFontSize(8); p.setFont('helvetica', 'normal');
  p.text(`Call ${COMPANY.contact.phoneDisplay} | Visit merasip.com | Email ${COMPANY.contact.email}`, PW / 2, y + 15, { align: 'center' });

  ftr(p);
}

// ═══════════════════════════════════════════════════════════════════
// ─── COMPREHENSIVE TIER PAGES ───
// ═══════════════════════════════════════════════════════════════════

// ─── Comprehensive: Executive Summary ───
function pCompExecSummary(
  p: jsPDF, r: FinancialHealthReport, nm: string, dt: string,
  execSummary: ExecutiveSummary | undefined, pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Executive Summary \u2014 Your Goals & Our Recommendations');

  p.setTextColor(...S600); p.setFontSize(8); p.setFont('helvetica', 'normal');
  p.text(`${nm}, here is a summary of your financial goals and our recommended actions.`, M + 4, y + 3); y += 10;

  // Table header
  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Area', M + 3, y + 5);
  p.text('Your Goal', M + 30, y + 5);
  p.text('Our Recommendation', M + 95, y + 5);
  p.text('Priority', PW - M - 4, y + 5, { align: 'right' });
  y += 7;

  const prioC: Record<string, RGB> = { critical: RED, important: AMBER, 'nice-to-have': BLUE };

  if (execSummary && execSummary.items.length > 0) {
    for (let i = 0; i < execSummary.items.length; i++) {
      if (y > PH - FH - 25) break;
      const item = execSummary.items[i];
      const rowH = 14;
      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, rowH, 'F');

      p.setTextColor(...TEAL); p.setFontSize(6); p.setFont('helvetica', 'bold');
      p.text(item.area.substring(0, 15), M + 3, y + 5);

      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
      const goalLines = p.splitTextToSize(rs(`You want to: ${item.clientGoal}`), 60);
      p.text(goalLines.slice(0, 3), M + 30, y + 4);

      p.setTextColor(...S600); p.setFontSize(5.5);
      const recLines = p.splitTextToSize(rs(`We recommend: ${item.recommendation}`), 60);
      p.text(recLines.slice(0, 3), M + 95, y + 4);

      const pc = prioC[item.priority] || S400;
      p.setFillColor(...pc); p.roundedRect(PW - M - 20, y + 2, 17, 5, 1, 1, 'F');
      p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
      p.text(item.priority.toUpperCase(), PW - M - 11.5, y + 5.5, { align: 'center' });
      y += rowH;
    }
  } else {
    // Fallback: derive from goals + action plan
    const goals = r.goalGaps || [];
    for (let i = 0; i < goals.length; i++) {
      if (y > PH - FH - 25) break;
      const gl = goals[i];
      const rowH = 12;
      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, rowH, 'F');

      p.setTextColor(...TEAL); p.setFontSize(6); p.setFont('helvetica', 'bold');
      p.text(gl.goalName.substring(0, 15), M + 3, y + 5);

      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
      p.text(`You want to reach ${rs(formatINR(gl.futureCost))}`, M + 30, y + 5);

      p.setTextColor(...S600); p.setFontSize(5.5);
      const recText = gl.monthlyRequired > 0
        ? `We recommend SIP of ${rs(formatINR(gl.monthlyRequired))}/month`
        : 'You are on track - continue current strategy';
      p.text(recText, M + 95, y + 5);

      const fc: Record<string, RGB> = { 'on-track': GREEN, 'possible': TEAL, 'stretch': AMBER, 'unrealistic': RED };
      const fCol = fc[gl.feasibility] || S400;
      const fLbl: Record<string, string> = {
        'on-track': 'ON TRACK',
        'possible': 'POSSIBLE',
        'stretch': 'STRETCH',
        'unrealistic': 'RE-FRAME',
      };
      p.setFillColor(...fCol); p.roundedRect(PW - M - 22, y + 2, 19, 5, 1, 1, 'F');
      p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
      p.text(fLbl[gl.feasibility] || gl.feasibility.toUpperCase(), PW - M - 12.5, y + 5.5, { align: 'center' });
      y += rowH;
    }
  }

  // Overall Financial Health Summary box with score, grade, net worth
  y += 8;
  if (y < PH - FH - 55) {
    const gCol = gc(r.score.grade);
    const nwc = r.netWorth.netWorth >= 0 ? GREEN : RED;

    p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 48, 2, 2, 'F');
    p.setDrawColor(...TEAL); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 48, 2, 2, 'S');
    p.setFillColor(...TEAL); p.rect(M, y, 3, 48, 'F');

    p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
    p.text('Overall Financial Health Summary', M + 8, y + 7);

    // Score + Grade + Net Worth in a row
    const boxW = (CW - 24) / 3;

    // Score box
    p.setFillColor(...WHITE); p.roundedRect(M + 8, y + 11, boxW, 14, 2, 2, 'F');
    p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text('Financial Health Score', M + 10, y + 16);
    p.setTextColor(...gCol); p.setFontSize(12); p.setFont('helvetica', 'bold');
    p.text(`${r.score.totalScore} / 900`, M + 10, y + 23);

    // Grade box
    const gx = M + 8 + boxW + 4;
    p.setFillColor(...WHITE); p.roundedRect(gx, y + 11, boxW, 14, 2, 2, 'F');
    p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text('Grade', gx + 2, y + 16);
    p.setFillColor(...gCol); p.roundedRect(gx + 2, y + 18, 30, 6, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(r.score.grade, gx + 17, y + 22.5, { align: 'center' });

    // Net Worth box
    const nx = gx + boxW + 4;
    p.setFillColor(...WHITE); p.roundedRect(nx, y + 11, boxW, 14, 2, 2, 'F');
    p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text('Net Worth', nx + 2, y + 16);
    p.setTextColor(...nwc); p.setFontSize(10); p.setFont('helvetica', 'bold');
    p.text(rs(formatINR(r.netWorth.netWorth)), nx + 2, y + 23);

    // Overall message below
    const msg = rs(execSummary?.overallMessage || r.claudeNarrative?.substring(0, 300) || 'Your financial health assessment is complete. Please review the detailed pages for comprehensive analysis.');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const msgLines = p.splitTextToSize(msg, CW - 16);
    p.text(msgLines.slice(0, 4), M + 8, y + 31);
  }

  ftr(p);
}

// ─── Comprehensive: 5-Year Cashflow Projection ───
function pCompCashflow(
  p: jsPDF, r: FinancialHealthReport, d: FinancialPlanningData, dt: string,
  cashflow: CashflowProjection | undefined, pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, '5-Year Cashflow Projection');

  // Table header
  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
  const cols = ['Year', 'Age', 'Income', 'Expenses', 'EMIs', 'Premiums', 'SIPs', 'Surplus', 'Cumul.'];
  const colX = [M + 2, M + 14, M + 26, M + 50, M + 74, M + 96, M + 118, M + 138, M + 160];
  for (let i = 0; i < cols.length; i++) {
    p.text(cols[i], colX[i], y + 5);
  }
  y += 7;

  if (cashflow && cashflow.years.length > 0) {
    for (let i = 0; i < cashflow.years.length; i++) {
      const yr = cashflow.years[i];
      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 7, 'F');
      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
      p.text(`${yr.year}`, colX[0], y + 5);
      p.text(`${yr.age}`, colX[1], y + 5);
      p.text(rs(formatINR(yr.grossIncome)), colX[2], y + 5);
      p.text(rs(formatINR(yr.totalExpenses)), colX[3], y + 5);
      p.text(rs(formatINR(yr.totalEMIs)), colX[4], y + 5);
      p.text(rs(formatINR(yr.insurancePremiums)), colX[5], y + 5);
      p.text(rs(formatINR(yr.sipCommitments)), colX[6], y + 5);

      // Color-coded surplus
      const surplusColor = yr.surplus >= 0 ? GREEN : RED;
      p.setTextColor(...surplusColor); p.setFont('helvetica', 'bold');
      p.text(rs(formatINR(yr.surplus)), colX[7], y + 5);

      p.setTextColor(...S800); p.setFont('helvetica', 'normal');
      p.text(rs(formatINR(yr.cumulativeSavings)), colX[8], y + 5);
      y += 7;
    }
  } else {
    // Generate indicative projections from current data
    const inc = d.incomeProfile;
    const baseIncome = (inc.monthlyInHandSalary || 0) * 12 + (inc.annualBonus || 0) + (inc.rentalIncome || 0) * 12 + (inc.businessIncome || 0) * 12 + (inc.otherIncome || 0) * 12;
    const baseExpenses = (inc.monthlyHouseholdExpenses || 0) * 12 + (inc.annualDiscretionary || 0);
    const baseEMIs = (inc.monthlyEMIs || 0) * 12;
    const basePremiums = (inc.monthlyInsurancePremiums || 0) * 12;
    const baseSIPs = (inc.monthlySIPsRunning || 0) * 12;
    const incGrowth = 0.08; // 8% income growth
    const expInflation = 0.06; // 6% expense inflation
    const sipStepUp = 0.10; // 10% SIP step-up
    const currentAge = d.personalProfile.age || 30;
    const currentYear = new Date().getFullYear();
    let cumulative = 0;

    for (let i = 0; i < 5; i++) {
      const yearIncome = baseIncome * Math.pow(1 + incGrowth, i);
      const yearExpenses = baseExpenses * Math.pow(1 + expInflation, i);
      const yearEMIs = i < 3 ? baseEMIs : baseEMIs * 0.7; // EMIs reduce over time
      const yearPremiums = basePremiums * Math.pow(1.05, i); // 5% premium increase
      const yearSIPs = baseSIPs * Math.pow(1 + sipStepUp, i);
      const surplus = yearIncome - yearExpenses - yearEMIs - yearPremiums - yearSIPs;
      cumulative += surplus;

      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 7, 'F');
      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
      p.text(`${currentYear + i}`, colX[0], y + 5);
      p.text(`${currentAge + i}`, colX[1], y + 5);
      p.text(rs(formatINR(yearIncome)), colX[2], y + 5);
      p.text(rs(formatINR(yearExpenses)), colX[3], y + 5);
      p.text(rs(formatINR(yearEMIs)), colX[4], y + 5);
      p.text(rs(formatINR(yearPremiums)), colX[5], y + 5);
      p.text(rs(formatINR(yearSIPs)), colX[6], y + 5);

      const surplusColor = surplus >= 0 ? GREEN : RED;
      p.setTextColor(...surplusColor); p.setFont('helvetica', 'bold');
      p.text(rs(formatINR(surplus)), colX[7], y + 5);

      p.setTextColor(...S800); p.setFont('helvetica', 'normal');
      p.text(rs(formatINR(cumulative)), colX[8], y + 5);
      y += 7;
    }
  }

  // Assumptions box
  y += 8;
  const assumptions = cashflow?.assumptions;
  // Stored as decimals (0.08, 0.06, 0.10) — convert to percentages for display.
  // Defensive: if a future value is already > 1, treat it as already-pct.
  const toPct = (v: number | undefined, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    return v <= 1 ? Math.round(v * 1000) / 10 : v;
  };
  const incRate = toPct(assumptions?.incomeGrowthRate, 8);
  const expRate = toPct(assumptions?.expenseInflationRate, 6);
  const sipRate = toPct(assumptions?.sipStepUpRate, 10);

  p.setFillColor(...A50); p.roundedRect(M, y, CW, 24, 2, 2, 'F');
  p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 24, 2, 2, 'S');
  p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text('Assumptions', M + 5, y + 6);
  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  p.text(`Income Growth Rate: ${incRate}% p.a.`, M + 5, y + 12);
  p.text(`Expense Inflation Rate: ${expRate}% p.a.`, M + 70, y + 12);
  p.text(`SIP Step-up Rate: ${sipRate}% p.a.`, M + 5, y + 17);
  p.text('EMI reduction assumed post Year 3 | Premium escalation at 5% p.a.', M + 70, y + 17);

  // Cashflow warnings from V2 data
  y += 30;
  const warnings = cashflow?.warnings || [];
  if (warnings.length > 0 && y < PH - FH - 35) {
    p.setFillColor(...R50); p.roundedRect(M, y, CW, 6 + warnings.length * 5, 2, 2, 'F');
    p.setDrawColor(...RED); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 6 + warnings.length * 5, 2, 2, 'S');
    p.setTextColor(...RED); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text('Cashflow Warnings', M + 5, y + 5);
    for (let i = 0; i < Math.min(warnings.length, 3); i++) {
      p.setTextColor(...S800); p.setFontSize(6); p.setFont('helvetica', 'normal');
      p.text(rs(`! ${warnings[i].message}`), M + 5, y + 10 + i * 5);
    }
    y += 8 + warnings.length * 5;
  }

  // ── Trustner Research Desk Note: how to read a negative-surplus year ──
  const cfBoxH = 36;
  if (y + cfBoxH <= PH - FH - 5) {
    p.setFillColor(...B50); p.roundedRect(M, y, CW, cfBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, cfBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text("Trustner Research Desk Note", M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const note = rs(
      'A red surplus number does not mean you are running out of money - it means the model holds your income, EMIs, and SIPs roughly steady while expenses inflate at 6%. In real life, salaries typically grow 8-10% annually, EMIs end on schedule, and discretionary spends adjust naturally. So the projection is a stress-test, not a forecast. The three levers we revisit each year with you are: (1) timing the SIP step-up so it lags a salary raise by 60-90 days; (2) reviewing the top three discretionary line items quarterly; and (3) restructuring or pre-paying the highest-rate EMI when bonus or windfall arrives. Most clients move from a projected red Year 3 to a comfortable green within two annual reviews.'
    );
    const lines = p.splitTextToSize(note, CW - 10);
    p.text(lines.slice(0, 6), M + 5, y + 11);
    y += cfBoxH + 2;
  }

  if (y < PH - FH - 15) {
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
    p.text('These projections are indicative. Actual cashflows may vary based on income changes, lifestyle adjustments, and market conditions.', M + 4, y + 4);
    p.text('Discuss with the Trustner team for a personalised cashflow review.', M + 4, y + 7.5);
  }

  ftr(p);
}

// ─── Comprehensive: Asset Allocation Matrix ───
function pCompAllocationMatrix(
  p: jsPDF, r: FinancialHealthReport, dt: string,
  allocationMatrix: AssetAllocationMatrix | undefined, pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Asset Allocation Matrix \u2014 Goal-wise Recommendation');

  // Table header
  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(5); p.setFont('helvetica', 'bold');
  const headers = ['Goal', 'Horizon', 'Equity', 'Debt', 'Gold', 'Liquid', 'SIP/mo', 'Return', 'Vehicles'];
  const hx = [M + 2, M + 30, M + 48, M + 62, M + 76, M + 88, M + 102, M + 122, M + 140];
  for (let i = 0; i < headers.length; i++) {
    p.text(headers[i], hx[i], y + 5);
  }
  y += 7;

  const ac: Record<string, RGB> = { Equity: BLUE, Debt: TEAL, Gold: AMBER, Liquid: S400 };

  if (allocationMatrix && allocationMatrix.entries.length > 0) {
    for (let i = 0; i < allocationMatrix.entries.length; i++) {
      if (y > PH - FH - 40) break;
      const entry = allocationMatrix.entries[i];
      const rowH = 14;
      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, rowH, 'F');

      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
      p.text(entry.goalName.substring(0, 16), hx[0], y + 5);
      p.setFont('helvetica', 'normal');
      p.text(`${entry.timeHorizon}yr`, hx[1], y + 5);
      p.text(`${entry.equity}%`, hx[2], y + 5);
      p.text(`${entry.debt}%`, hx[3], y + 5);
      p.text(`${entry.gold}%`, hx[4], y + 5);
      p.text(`${entry.liquid}%`, hx[5], y + 5);
      p.setTextColor(...TEAL); p.setFont('helvetica', 'bold');
      p.text(rs(formatINR(entry.monthlySIP)), hx[6], y + 5);
      p.setTextColor(...S800); p.setFont('helvetica', 'normal');
      p.text(`${entry.expectedReturn}%`, hx[7], y + 5);

      // Stacked bar (mini)
      const barY = y + 8; const barH = 3; const barW = CW - 8;
      let bx = M + 4;
      const allocs: [string, number][] = [['Equity', entry.equity], ['Debt', entry.debt], ['Gold', entry.gold], ['Liquid', entry.liquid]];
      for (const [name, pct] of allocs) {
        if (pct <= 0) continue;
        const w = (pct / 100) * barW;
        p.setFillColor(...(ac[name] || S400)); p.rect(bx, barY, w, barH, 'F');
        bx += w;
      }

      // Vehicles (small text)
      p.setTextColor(...S400); p.setFontSize(4.5);
      const veh = entry.recommendedVehicles.slice(0, 2).join(', ');
      p.text(veh.substring(0, 35), hx[8], y + 5);

      y += rowH;
    }
  } else {
    // Derive from goal gaps + risk profile
    const goals = r.goalGaps || [];
    for (let i = 0; i < goals.length; i++) {
      if (y > PH - FH - 40) break;
      const gl = goals[i];
      const rowH = 12;
      p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, rowH, 'F');

      // Derive allocation from time horizon
      const yearsToGoal = gl.futureCost > 0 ? Math.max(1, Math.ceil(Math.log(gl.futureCost / Math.max(gl.currentProgress, 1)) / Math.log(1.1))) : 5;
      const eq = yearsToGoal > 7 ? 70 : yearsToGoal > 5 ? 60 : yearsToGoal > 3 ? 40 : 20;
      const debt = yearsToGoal > 5 ? 20 : 40;
      const gold = 10;
      const liquid = 100 - eq - debt - gold;

      p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
      p.text(gl.goalName.substring(0, 16), hx[0], y + 5);
      p.setFont('helvetica', 'normal');
      p.text(`${yearsToGoal}yr`, hx[1], y + 5);
      p.text(`${eq}%`, hx[2], y + 5);
      p.text(`${debt}%`, hx[3], y + 5);
      p.text(`${gold}%`, hx[4], y + 5);
      p.text(`${liquid}%`, hx[5], y + 5);
      p.setTextColor(...TEAL); p.setFont('helvetica', 'bold');
      p.text(gl.monthlyRequired > 0 ? rs(formatINR(gl.monthlyRequired)) : '-', hx[6], y + 5);
      p.setTextColor(...S800); p.setFont('helvetica', 'normal');
      const expRet = yearsToGoal > 7 ? 12 : yearsToGoal > 5 ? 10 : yearsToGoal > 3 ? 8 : 6;
      p.text(`${expRet}%`, hx[7], y + 5);

      // Mini stacked bar
      const barY = y + 8; const barH = 2.5; const barW = CW - 8; let bx = M + 4;
      const allocs: [string, number][] = [['Equity', eq], ['Debt', debt], ['Gold', gold], ['Liquid', liquid]];
      for (const [name, pct] of allocs) {
        if (pct <= 0) continue;
        const w = (pct / 100) * barW;
        p.setFillColor(...(ac[name] || S400)); p.rect(bx, barY, w, barH, 'F');
        bx += w;
      }

      y += rowH;
    }
  }

  // Legend
  y += 5;
  let lx = M;
  const legendItems: [string, RGB][] = [['Equity', BLUE], ['Debt', TEAL], ['Gold', AMBER], ['Liquid', S400]];
  for (const [n, c] of legendItems) {
    p.setFillColor(...c); p.rect(lx, y, 4, 4, 'F');
    p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal'); p.text(n, lx + 6, y + 3.5);
    lx += 35;
  }

  // ── Trustner Research Desk Note: rebalancing discipline + bucket behavioural payoff ──
  y += 8;
  const matBoxH = 28;
  if (y + matBoxH <= PH - FH - 5) {
    const rebalFreq = allocationMatrix?.rebalancingFrequency || 'semi-annually';
    p.setFillColor(...B50); p.roundedRect(M, y, CW, matBoxH, 2, 2, 'F');
    p.setDrawColor(...BLUE); p.setLineWidth(0.3); p.roundedRect(M, y, CW, matBoxH, 2, 2, 'S');
    p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text(`Trustner Research Desk Note - Rebalancing: ${rebalFreq.charAt(0).toUpperCase() + rebalFreq.slice(1)}`, M + 5, y + 5);
    p.setTextColor(...S700); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const note = rs(
      'Semi-annual rebalancing is enough for goal-bucket portfolios; rebalancing more often than that creates short-term capital-gains drag (15% or 20%) that quietly eats 0.4-0.6% of return per year. Just as important is the behavioural payoff of bucketing: when each goal lives in its own portfolio, a 25% equity drawdown in one bucket does not threaten the others, which is what allows clients to actually hold equity through a bad year. That discipline - not chasing top-ranked schemes - is where the real alpha lives.'
    );
    const lines = p.splitTextToSize(note, CW - 10);
    p.text(lines.slice(0, 4), M + 5, y + 11);
  }

  ftr(p);
}

// ─── Comprehensive: Debt Management Strategy ───
function pCompDebtStrategy(
  p: jsPDF, r: FinancialHealthReport, d: FinancialPlanningData, dt: string,
  debtStrategy: FinancialHealthReportV2['debtStrategy'], pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Debt Management Strategy');

  const li = d.liabilityProfile;
  const inc = d.incomeProfile;

  // Debt-to-Income Ratio
  const dtiRatio = r.debtManagement.debtToIncomeRatio;
  const dtiColor = dtiRatio < 30 ? GREEN : dtiRatio < 50 ? AMBER : RED;
  const dtiBg = dtiRatio < 30 ? E50 : dtiRatio < 50 ? A50 : R50;

  p.setFillColor(...dtiBg); p.roundedRect(M, y, CW, 18, 3, 3, 'F');
  p.setDrawColor(...dtiColor); p.setLineWidth(0.5); p.roundedRect(M, y, CW, 18, 3, 3, 'S');
  p.setTextColor(...dtiColor); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Debt-to-Income Ratio', M + 8, y + 7);
  p.setFontSize(16); p.text(`${dtiRatio.toFixed(1)}%`, PW - M - 8, y + 12, { align: 'right' });
  p.setFontSize(7); p.setFont('helvetica', 'normal');
  const dtiAssessment = dtiRatio < 30 ? 'Healthy - Well within recommended limits'
    : dtiRatio < 50 ? 'Moderate - Consider reducing debt exposure'
    : 'High - Debt reduction should be a priority';
  p.text(dtiAssessment, M + 8, y + 14);
  y += 24;

  // Loan details table
  p.setTextColor(...S800); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Outstanding Loans', M + 4, y + 5); y += 10;

  // Priority ranking label
  p.setTextColor(...S400); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  p.text('Sorted by payoff priority (Avalanche method: highest interest rate first)', M + 4, y + 3); y += 7;

  p.setFillColor(...RED); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
  p.text('#', M + 3, y + 5);
  p.text('Loan Type', M + 10, y + 5);
  p.text('Outstanding', M + 48, y + 5);
  p.text('EMI/month', M + 80, y + 5);
  p.text('Est. Rate', M + 110, y + 5);
  p.text('Remaining', M + 138, y + 5);
  p.text('Interest Cost', PW - M - 4, y + 5, { align: 'right' });
  y += 7;

  // Build loan list with estimated interest rates for sorting by avalanche method
  const loanList: { name: string; outstanding: number; emi: number; remainingYears: number; rate: number; totalInterest: number }[] = [];

  const loanEntries: [string, { outstanding: number; emi: number; remainingYears: number } | undefined, number][] = [
    ['Credit Card Debt', li.creditCardDebt > 0 ? { outstanding: li.creditCardDebt, emi: Math.round(li.creditCardDebt * 0.05), remainingYears: 0 } : undefined, 36],
    ['Personal Loan', li.personalLoan, 14],
    ['Car Loan', li.carLoan, 9],
    ['Education Loan', li.educationLoan, 8.5],
    ['Home Loan', li.homeLoan, 8],
  ];

  for (const [name, loan, estRate] of loanEntries) {
    if (!loan || loan.outstanding <= 0) continue;
    const totalInterest = loan.remainingYears > 0
      ? (loan.emi * loan.remainingYears * 12) - loan.outstanding
      : loan.outstanding * 0.3; // CC: ~30% annual interest estimate
    loanList.push({ name, outstanding: loan.outstanding, emi: loan.emi, remainingYears: loan.remainingYears, rate: estRate, totalInterest: Math.max(0, totalInterest) });
  }

  // Add other loans
  if (li.otherLoans > 0) {
    loanList.push({ name: 'Other Loans', outstanding: li.otherLoans, emi: 0, remainingYears: 0, rate: 12, totalInterest: 0 });
  }

  // Already sorted by rate descending (avalanche) due to insertion order above
  let hasDebt = false;
  for (let i = 0; i < loanList.length; i++) {
    if (y > PH - FH - 60) break;
    const loan = loanList[i];
    hasDebt = true;
    const isCC = loan.name === 'Credit Card Debt';
    p.setFillColor(...(isCC ? R50 : i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 7, 'F');
    p.setTextColor(...(isCC ? RED : S800)); p.setFontSize(5.5); p.setFont(isCC ? 'helvetica' : 'helvetica', isCC ? 'bold' : 'normal');
    p.text(`${i + 1}`, M + 3, y + 5);
    p.text(loan.name, M + 10, y + 5);
    p.text(rs(formatINR(loan.outstanding)), M + 48, y + 5);
    p.text(loan.emi > 0 ? rs(formatINR(loan.emi)) : 'Revolving', M + 80, y + 5);
    p.setTextColor(...(loan.rate >= 15 ? RED : loan.rate >= 10 ? AMBER : S800));
    p.text(`~${loan.rate}%`, M + 110, y + 5);
    p.setTextColor(...S800); p.setFont('helvetica', 'normal');
    p.text(loan.remainingYears > 0 ? `${loan.remainingYears} yrs` : '-', M + 138, y + 5);
    p.setTextColor(...RED); p.setFontSize(5.5);
    p.text(loan.totalInterest > 0 ? rs(formatINR(loan.totalInterest)) : '-', PW - M - 4, y + 5, { align: 'right' });
    y += 7;
  }

  if (!hasDebt) {
    p.setFillColor(...E50); p.rect(M, y, CW, 7, 'F');
    p.setTextColor(...GREEN); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text('Congratulations! You are debt free.', M + 4, y + 5); y += 7;
  }

  // Total
  const totalDebt = r.netWorth.totalLiabilities;
  const totalEMI = inc.monthlyEMIs || 0;
  y += 3;
  p.setFillColor(...R50); p.rect(M, y, CW, 8, 'F');
  p.setTextColor(...RED); p.setFontSize(7.5); p.setFont('helvetica', 'bold');
  p.text('Total Debt', M + 4, y + 5.5);
  p.text(rs(formatINR(totalDebt)), M + 55, y + 5.5);
  p.text(`${rs(formatINR(totalEMI))}/mo`, M + 95, y + 5.5);
  y += 14;

  // Prepayment Recommendations
  p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Prepayment Recommendations', M + 4, y + 5); y += 10;

  if (debtStrategy && debtStrategy.prepaymentRecommendations.length > 0) {
    for (let i = 0; i < debtStrategy.prepaymentRecommendations.length; i++) {
      if (y > PH - FH - 20) break;
      const rec = debtStrategy.prepaymentRecommendations[i];
      p.setFillColor(...(i % 2 === 0 ? E50 : S50)); p.roundedRect(M, y, CW, 10, 1, 1, 'F');
      p.setTextColor(...TEAL); p.setFontSize(7); p.setFont('helvetica', 'bold');
      p.text(`${i + 1}.`, M + 4, y + 6);
      p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
      const recLines = p.splitTextToSize(rec, CW - 16);
      p.text(recLines.slice(0, 2), M + 12, y + 5);
      y += 10;
    }

    if (debtStrategy.interestSavings > 0) {
      y += 3;
      p.setFillColor(...E50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
      p.setTextColor(...GREEN); p.setFontSize(8); p.setFont('helvetica', 'bold');
      p.text(`Potential Interest Savings: ${rs(formatINR(debtStrategy.interestSavings))}`, M + 5, y + 7);
    }
  } else {
    // Default recommendations based on data
    const defaultRecs = [];
    if (li.creditCardDebt > 0) defaultRecs.push('Priority: Clear credit card debt immediately - high-cost revolving debt erodes wealth fastest.');
    if (li.personalLoan && li.personalLoan.outstanding > 0) defaultRecs.push('Consider prepaying personal loan with surplus funds - unsecured loans carry higher interest.');
    if (li.homeLoan && li.homeLoan.outstanding > 0) defaultRecs.push('Home loan: Make annual lump-sum prepayments (using bonus) to reduce tenure and save interest.');
    if (defaultRecs.length === 0) defaultRecs.push('You have minimal or no debt - continue building your investment portfolio.');

    for (let i = 0; i < defaultRecs.length; i++) {
      p.setFillColor(...(i % 2 === 0 ? E50 : S50)); p.roundedRect(M, y, CW, 10, 1, 1, 'F');
      p.setTextColor(...TEAL); p.setFontSize(7); p.setFont('helvetica', 'bold');
      p.text(`${i + 1}.`, M + 4, y + 6);
      p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
      const recLines = p.splitTextToSize(defaultRecs[i], CW - 16);
      p.text(recLines.slice(0, 2), M + 12, y + 5);
      y += 10;
    }
  }

  ftr(p);
}

// ─── Comprehensive: Tax Optimization Strategy ───
// Restructured into 5 blocks under Finance Act 2024:
//   Block 1 — Regime math table (actual numbers behind the recommendation)
//   Block 2 — Capital Gains Strategy (LTCG harvesting, debt-fund post-Apr2023, hybrid <65% rule)
//   Block 3 — Deductions Utilization (with new sections: 80CCD(2), 80EEA, 80TTA/TTB)
//   Block 4 — Tactical FY Considerations (act-before-March-31 items)
//   Block 5 — 5-year tax projection (status-quo vs. with considerations applied)
//
// Every directive softened to "Consideration for review" — Trustner is an MFD,
// not a tax adviser. Final filings always on a CA's advice.
//
// Spreads across 2 pages because the content depth requires it (~580 lines of
// PDF instructions in the old version, ~720 in this version).
function pCompTaxOptimization(
  p: jsPDF, r: FinancialHealthReport, d: FinancialPlanningData, dt: string,
  taxOpt: FinancialHealthReportV2['taxOptimization'], pg: number, totalPages: number,
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Tax Optimization Strategy — Finance Act 2024');

  const tax = d.taxProfile;
  const income = d.incomeProfile;

  // Compute gross income (annualised)
  const grossAnnual = (income.monthlyInHandSalary || 0) * 12
    + (income.annualBonus || 0)
    + (income.rentalIncome || 0) * 12
    + (income.businessIncome || 0) * 12
    + (income.otherIncome || 0) * 12;

  // Estimate HRA (35% of salary if hasHRA)
  const hraEst = tax.hasHRA ? (income.monthlyInHandSalary || 0) * 12 * 0.35 : 0;
  const section80C = Math.min(tax.section80CUsed || 0, 150000);
  const section80D = Math.min(tax.section80DUsed || 0, 75000);
  const npsExtra = Math.min(tax.npsContribution || 0, 50000);

  // ── BLOCK 1 — Regime Math Comparison ────────────────────────────────────
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('1. Income Tax Regime — The Math Behind Our Suggestion', M + 4, y + 5); y += 9;

  // Compute taxable income + tax for both regimes (FY26 slabs)
  const oldStdDed = 50000;
  const newStdDed = 75000;
  const oldDeductions = section80C + section80D + npsExtra + hraEst + oldStdDed;
  const oldTaxable = Math.max(0, grossAnnual - oldDeductions);
  const newTaxable = Math.max(0, grossAnnual - newStdDed);

  const oldTaxAmt = computeOldRegimeTax(oldTaxable);
  const newTaxAmt = computeNewRegimeTax(newTaxable);
  const oldRecommended = oldTaxAmt < newTaxAmt;
  const taxSavings = Math.abs(oldTaxAmt - newTaxAmt);

  // Mini ledger table
  const ledger: Array<[string, string, string]> = [
    ['Line item', 'Old Regime', 'New Regime'],
    ['Gross income (annualised)', formatINR(grossAnnual), formatINR(grossAnnual)],
    ['Standard deduction', `-${formatINR(oldStdDed)}`, `-${formatINR(newStdDed)}`],
    ['Section 80C utilised', `-${formatINR(section80C)}`, '—'],
    ['Section 80D utilised', `-${formatINR(section80D)}`, '—'],
    ['NPS 80CCD(1B)', `-${formatINR(npsExtra)}`, '—'],
    ['HRA exemption (est)', tax.hasHRA ? `-${formatINR(Math.round(hraEst))}` : '—', '—'],
    ['Taxable income', formatINR(Math.round(oldTaxable)), formatINR(Math.round(newTaxable))],
    ['Tax + cess (FY26)', formatINR(Math.round(oldTaxAmt)), formatINR(Math.round(newTaxAmt))],
  ];

  // Header row
  p.setFillColor(...TEAL); p.rect(M, y, CW, 6, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6); p.setFont('helvetica', 'bold');
  p.text(ledger[0][0], M + 3, y + 4);
  p.text(ledger[0][1], M + CW * 0.5, y + 4, { align: 'right' });
  p.text(ledger[0][2], PW - M - 4, y + 4, { align: 'right' });
  y += 6;

  // Body rows
  for (let i = 1; i < ledger.length; i++) {
    const isTotal = ledger[i][0].startsWith('Tax + cess') || ledger[i][0].startsWith('Taxable');
    p.setFillColor(...(isTotal ? E50 : i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 5, 'F');
    p.setTextColor(...S800); p.setFontSize(5.8); p.setFont('helvetica', isTotal ? 'bold' : 'normal');
    p.text(rs(ledger[i][0]), M + 3, y + 3.5);
    p.setTextColor(...(oldRecommended && isTotal ? GREEN : S700));
    p.text(rs(ledger[i][1]), M + CW * 0.5, y + 3.5, { align: 'right' });
    p.setTextColor(...(!oldRecommended && isTotal ? GREEN : S700));
    p.text(rs(ledger[i][2]), PW - M - 4, y + 3.5, { align: 'right' });
    y += 5;
  }

  // Verdict + framing
  y += 2;
  p.setFillColor(...E50); p.roundedRect(M, y, CW, 12, 1.5, 1.5, 'F');
  p.setDrawColor(...GREEN); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 12, 1.5, 1.5, 'S');
  p.setTextColor(...GREEN); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text(`The math suggests ${oldRecommended ? 'Old' : 'New'} Regime is more efficient by approximately ${formatINR(Math.round(taxSavings))} this FY.`, M + 4, y + 5);
  p.setTextColor(...S700); p.setFontSize(5.5); p.setFont('helvetica', 'italic');
  p.text(rs('A calculation, not advice. Final filing call to be made with your tax consultant — surcharge / cess specifics may apply.'), M + 4, y + 9);
  y += 16;

  // ── BLOCK 2 — Capital Gains Strategy under Finance Act 2024 ──────────────
  if (y > PH - FH - 60) { ftr(p); p.addPage(); hdr(p, pg, dt, totalPages); wm(p); y = CSY; }
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('2. Capital Gains Strategy — Finance Act 2024', M + 4, y + 5); y += 9;

  // Estimate current MF/equity exposure
  const mfHoldings = (d.assetProfile.mutualFunds || 0) + (d.assetProfile.stocks || 0);
  const debtHoldings = (d.assetProfile.fixedDeposits || 0);

  // Equity bucket
  p.setFillColor(...B50); p.roundedRect(M, y, CW, 24, 1.5, 1.5, 'F');
  p.setDrawColor(...BLUE); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 24, 1.5, 1.5, 'S');
  p.setTextColor(...BLUE); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text('Equity-oriented MF / Hybrid >=65% equity', M + 4, y + 4);
  p.setTextColor(...S700); p.setFontSize(5.8); p.setFont('helvetica', 'normal');
  p.text(`Approximate holdings (MF + direct stocks): ${formatINR(mfHoldings)}`, M + 4, y + 8.5);
  p.text(`LTCG @ 12.5% above Rs. 1.25L exemption/FY (units held >12 months); STCG @ 20% under 12 months.`, M + 4, y + 12.5);
  p.setTextColor(...GREEN); p.setFontSize(5.8); p.setFont('helvetica', 'bold');
  p.text('Consideration for review:', M + 4, y + 17);
  p.setTextColor(...S700); p.setFont('helvetica', 'normal');
  const ltcgLines = p.splitTextToSize(rs('Harvest Rs. 1.25L of LTCG every FY tax-free by selling-and-immediately-rebuying the same units. Cumulative tax shield on Rs. 50L equity over 10 years: approx Rs. 1.56L (Rs. 1.25L x 10 x 12.5%).'), CW - 50);
  p.text(ltcgLines.slice(0, 2), M + 40, y + 17);
  y += 28;

  // Debt bucket
  p.setFillColor(...S50); p.roundedRect(M, y, CW, 20, 1.5, 1.5, 'F');
  p.setDrawColor(...PURPLE); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 20, 1.5, 1.5, 'S');
  p.setTextColor(...PURPLE); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text('Debt MF (units purchased on/after 1 Apr 2023)', M + 4, y + 4);
  p.setTextColor(...S700); p.setFontSize(5.8); p.setFont('helvetica', 'normal');
  p.text(rs(`Approximate fixed-income holdings (FDs as proxy): ${formatINR(debtHoldings)}`), M + 4, y + 8.5);
  p.text(rs('All gains taxed at SLAB rate. No LTCG benefit. No indexation under Finance Act 2024.'), M + 4, y + 12.5);
  p.setTextColor(...GREEN); p.setFontSize(5.8); p.setFont('helvetica', 'bold');
  p.text('Consideration for review:', M + 4, y + 16.5);
  p.setTextColor(...S700); p.setFont('helvetica', 'normal');
  p.text(rs('Compare net-of-tax IRR vs Arbitrage Funds (taxed as equity @ 12.5% LTCG) for rebalancing sleeve.'), M + 40, y + 16.5);
  y += 24;

  // Hybrid bucket
  p.setFillColor(...S50); p.roundedRect(M, y, CW, 16, 1.5, 1.5, 'F');
  p.setDrawColor(...AMBER); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 16, 1.5, 1.5, 'S');
  p.setTextColor(...AMBER); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text('Hybrid (<65% equity) — BAF, Multi-Asset, etc.', M + 4, y + 4);
  p.setTextColor(...S700); p.setFontSize(5.8); p.setFont('helvetica', 'normal');
  p.text(rs('LTCG @ 12.5% after 24 months. STCG at slab rate below 24 months. Plan de-risk windows accordingly.'), M + 4, y + 8.5);
  p.setTextColor(...GREEN); p.setFont('helvetica', 'bold');
  p.text('Consideration:', M + 4, y + 12.5);
  p.setTextColor(...S700); p.setFont('helvetica', 'normal');
  p.text(rs('Hold hybrid units for 24+ months before redemption to access LTCG rate over slab.'), M + 26, y + 12.5);
  y += 20;

  // ── BLOCK 3 — Deductions Utilization (expanded) ──────────────────────────
  if (y > PH - FH - 50) { ftr(p); p.addPage(); hdr(p, pg, dt, totalPages); wm(p); y = CSY; }
  p.setTextColor(...PURPLE); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('3. Deductions Utilization (Old Regime only, unless noted)', M + 4, y + 5); y += 9;

  const deductions: Array<[string, string, number, number, string]> = [
    ['Section 80C', 'PPF, EPF, ELSS, LIC, Tuition (Old regime only)', tax.section80CUsed || 0, 150000, 'old'],
    ['Section 80D', 'Health Insurance — Self + Parents (Old regime only)', tax.section80DUsed || 0, 75000, 'old'],
    ['NPS 80CCD(1B)', 'Additional NPS (Old regime only, over 80C)', tax.npsContribution || 0, 50000, 'old'],
    ['NPS 80CCD(2)', 'Employer NPS — up to 10% of basic (Old AND New regime)', 0, 200000, 'both'],
    ['Section 80EEA', 'First-time home loan interest, affordable housing (Old only)', 0, 150000, 'old'],
    ['Section 80TTA/TTB', 'Savings interest exempt — Rs.10K (under 60) / Rs.50K (senior)', 0, 50000, 'old'],
  ];

  for (const [sec, desc, used, limit, regime] of deductions) {
    if (y > PH - FH - 14) break;
    const utilPct = Math.min((used / limit) * 100, 100);
    const utilColor = utilPct >= 90 ? GREEN : utilPct >= 50 ? AMBER : RED;
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 11, 1, 1, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
    p.text(sec, M + 4, y + 4);
    if (regime === 'both') {
      p.setFillColor(...GREEN); p.roundedRect(M + 32, y + 1.5, 18, 3.5, 0.8, 0.8, 'F');
      p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.text('OLD + NEW', M + 41, y + 4, { align: 'center' });
    }
    p.setTextColor(...S400); p.setFontSize(5); p.setFont('helvetica', 'normal');
    p.text(rs(desc), M + 4, y + 7);
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
    p.text(`${rs(formatINR(used))} / ${rs(formatINR(limit))}`, PW - M - 4, y + 4, { align: 'right' });
    progBar(p, M + 4, y + 9, CW - 8, 1.5, used, limit, utilColor);
    y += 13;
  }

  // ── BLOCK 4 — Tactical FY Considerations ─────────────────────────────────
  if (y > PH - FH - 40) { ftr(p); p.addPage(); hdr(p, pg, dt, totalPages); wm(p); y = CSY; }
  y += 3;
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('4. Tactical Considerations for This FY (before 31 March)', M + 4, y + 5); y += 9;

  const tacticalConsiderations: string[] = [];
  if (section80C < 150000) {
    tacticalConsiderations.push(`80C headroom: Rs. ${formatINR(150000 - section80C)} remaining. ELSS Regular plan SIP offers the shortest 80C lock-in (3 yrs); consideration for review with the Trustner team before March 31.`);
  }
  if (section80D < 75000) {
    tacticalConsiderations.push(`80D headroom: Rs. ${formatINR(75000 - section80D)} remaining. Health insurance covering self + parents (>=60) unlocks the full Rs. 75K deduction.`);
  }
  if (npsExtra < 50000) {
    tacticalConsiderations.push(`NPS 80CCD(1B) headroom: Rs. ${formatINR(50000 - npsExtra)} remaining. The marginal tax saving at your slab is the entire deduction x your marginal rate.`);
  }
  tacticalConsiderations.push(`LTCG harvest: book Rs. 1.25L of long-term equity gains before March 31 to lock the FY exemption. Sell + immediately re-buy the same scheme — the gain is realised tax-free, the cost basis resets up.`);
  tacticalConsiderations.push(`Tax-loss harvest: if any equity holding shows a short-term LOSS, booking it (and re-entering after 30 days) can offset other STCG @ 20%. STCL can be carried forward 8 years.`);

  for (let i = 0; i < Math.min(tacticalConsiderations.length, 4); i++) {
    if (y > PH - FH - 12) break;
    p.setTextColor(...TEAL); p.setFontSize(6.5); p.setFont('helvetica', 'bold'); p.text(`${i + 1}.`, M + 4, y + 3);
    p.setTextColor(...S800); p.setFontSize(5.8); p.setFont('helvetica', 'normal');
    const recLines = p.splitTextToSize(rs(tacticalConsiderations[i]), CW - 12);
    p.text(recLines.slice(0, 3), M + 10, y + 3);
    y += Math.min(recLines.length, 3) * 3.2 + 3;
  }

  // ── BLOCK 5 — 5-Year Tax Projection ──────────────────────────────────────
  if (y > PH - FH - 50) { ftr(p); p.addPage(); hdr(p, pg, dt, totalPages); wm(p); y = CSY; }
  y += 2;
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('5. 5-Year Tax Lens — Status Quo vs With Considerations Applied', M + 4, y + 5); y += 9;

  // Assume 8% income growth, current vs optimised tax
  const growthRate = 0.08;
  const optimisedTax = Math.min(oldTaxAmt, newTaxAmt);
  const currentTax = (oldRecommended && tax.taxRegime === 'new') || (!oldRecommended && tax.taxRegime === 'old')
    ? Math.max(oldTaxAmt, newTaxAmt)
    : optimisedTax;

  // Headers
  p.setFillColor(...TEAL); p.rect(M, y, CW, 6, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(5.8); p.setFont('helvetica', 'bold');
  p.text('FY', M + 3, y + 4);
  const yearW = (CW - 35) / 5;
  for (let i = 0; i < 5; i++) {
    p.text(`FY${26 + i}`, M + 35 + yearW * i + yearW / 2, y + 4, { align: 'center' });
  }
  y += 6;

  // Rows: income (growing 8% p.a.), status-quo tax, optimised tax, difference
  const rowsData: Array<[string, (yr: number) => string, RGB]> = [
    ['Income', (yr) => formatINR(Math.round(grossAnnual * Math.pow(1 + growthRate, yr))), S700],
    ['Tax — status quo', (yr) => formatINR(Math.round(currentTax * Math.pow(1 + growthRate, yr))), S700],
    ['Tax — with considerations', (yr) => formatINR(Math.round(optimisedTax * Math.pow(1 + growthRate, yr))), GREEN],
    ['Annual saving', (yr) => formatINR(Math.round((currentTax - optimisedTax) * Math.pow(1 + growthRate, yr))), GREEN],
  ];

  for (let ri = 0; ri < rowsData.length; ri++) {
    const [label, fn, col] = rowsData[ri];
    p.setFillColor(...(ri % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 5.5, 'F');
    p.setTextColor(...S800); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
    p.text(rs(label), M + 3, y + 4);
    p.setTextColor(...col); p.setFont('helvetica', 'normal');
    for (let i = 0; i < 5; i++) {
      p.text(rs(fn(i)), M + 35 + yearW * i + yearW / 2, y + 4, { align: 'center' });
    }
    y += 5.5;
  }

  // 5-year cumulative
  const cumulativeSaving = Array.from({ length: 5 }, (_, i) => (currentTax - optimisedTax) * Math.pow(1 + growthRate, i)).reduce((a, b) => a + b, 0);
  y += 2;
  p.setFillColor(...E50); p.roundedRect(M, y, CW, 9, 1.5, 1.5, 'F');
  p.setDrawColor(...GREEN); p.setLineWidth(0.2); p.roundedRect(M, y, CW, 9, 1.5, 1.5, 'S');
  p.setTextColor(...GREEN); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text(`5-year cumulative savings (regime + deductions) : ~${formatINR(Math.round(cumulativeSaving))}`, M + 4, y + 6);
  y += 13;

  // Footer disclaimer
  if (y > PH - FH - 14) { ftr(p); p.addPage(); hdr(p, pg, dt, totalPages); wm(p); y = CSY; }
  p.setFillColor(...S50); p.roundedRect(M, y, CW, 12, 1.5, 1.5, 'F');
  p.setTextColor(...S700); p.setFontSize(5.5); p.setFont('helvetica', 'italic');
  const disclaimerLines = p.splitTextToSize(
    rs('This section presents tax considerations for review with your tax consultant. Trustner Asset Services is an AMFI-registered Mutual Fund Distributor (ARN-286886) and not a tax adviser. Capital gains rates quoted are per Finance Act 2024 (STCG 20%, LTCG 12.5%, Rs. 1.25L exemption/FY for equity-oriented schemes; debt MF gains taxed at slab post-Apr 2023). Final filings must be made on a qualified CA s advice.'),
    CW - 8,
  );
  p.text(disclaimerLines.slice(0, 3), M + 4, y + 4);

  ftr(p);
}

// ─── FY26 (Finance Act 2024) tax computation helpers ─────────────────────
// Old regime slabs (no cess on first Rs. 5L due to rebate u/s 87A up to 5L):
function computeOldRegimeTax(taxable: number): number {
  let t = 0;
  if (taxable <= 250000) t = 0;
  else if (taxable <= 500000) t = (taxable - 250000) * 0.05;
  else if (taxable <= 1000000) t = 12500 + (taxable - 500000) * 0.2;
  else t = 112500 + (taxable - 1000000) * 0.3;
  // Rebate u/s 87A if taxable income <= 5L (old regime)
  if (taxable <= 500000) t = 0;
  // 4% cess
  return t * 1.04;
}
// New regime (Finance Act 2024) slabs — wider brackets, 75K standard deduction:
function computeNewRegimeTax(taxable: number): number {
  let t = 0;
  if (taxable <= 300000) t = 0;
  else if (taxable <= 700000) t = (taxable - 300000) * 0.05;
  else if (taxable <= 1000000) t = 20000 + (taxable - 700000) * 0.10;
  else if (taxable <= 1200000) t = 50000 + (taxable - 1000000) * 0.15;
  else if (taxable <= 1500000) t = 80000 + (taxable - 1200000) * 0.20;
  else t = 140000 + (taxable - 1500000) * 0.30;
  // Rebate u/s 87A in new regime up to 7L taxable income
  if (taxable <= 700000) t = 0;
  // 4% cess
  return t * 1.04;
}

// ─── Comprehensive: 12-Month Action Timeline ───
function pCompActionTimeline(
  p: jsPDF, r: FinancialHealthReport, dt: string, pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Your 12-Month Action Plan');

  p.setTextColor(...S600); p.setFontSize(8); p.setFont('helvetica', 'normal');
  p.text('A prioritized, time-bound plan to improve your financial health over the next 12 months.', M + 4, y + 3);
  y += 10;

  const actions = r.actionPlan || [];
  const ic: Record<string, RGB> = { high: RED, medium: AMBER, low: BLUE };

  // Month-by-month for months 1-6
  const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
  const quarterLabels = ['Q3 (Months 7-9)', 'Q4 (Months 10-12)'];

  // Distribute actions across timeline
  const highPriority = actions.filter(a => a.impact === 'high');
  const medPriority = actions.filter(a => a.impact === 'medium');
  const lowPriority = actions.filter(a => a.impact === 'low');

  // Build timeline items
  const timeline: { period: string; items: string[]; color: RGB }[] = [];

  // Months 1-2: High priority
  for (let m = 0; m < 2; m++) {
    const items: string[] = [];
    if (highPriority[m]) items.push(highPriority[m].action);
    if (m === 0) items.push('Review and organize all financial documents');
    if (m === 1) items.push('Set up automated SIP payments');
    timeline.push({ period: months[m], items, color: RED });
  }

  // Months 3-4: Medium priority
  for (let m = 2; m < 4; m++) {
    const items: string[] = [];
    const hIdx = m;
    const mIdx = m - 2;
    if (highPriority[hIdx]) items.push(highPriority[hIdx].action);
    else if (medPriority[mIdx]) items.push(medPriority[mIdx].action);
    if (m === 2) items.push('Review insurance coverage gaps');
    if (m === 3) items.push('Optimize tax-saving investments');
    timeline.push({ period: months[m], items, color: AMBER });
  }

  // Months 5-6: Consolidation
  for (let m = 4; m < 6; m++) {
    const items: string[] = [];
    const mIdx = m - 2;
    if (medPriority[mIdx]) items.push(medPriority[mIdx].action);
    else if (lowPriority[m - 4]) items.push(lowPriority[m - 4].action);
    if (m === 4) items.push('Review portfolio performance and rebalance');
    if (m === 5) items.push('Mid-year financial health check');
    timeline.push({ period: months[m], items, color: TEAL });
  }

  // Q3 and Q4
  timeline.push({
    period: quarterLabels[0],
    items: [
      lowPriority[2]?.action || 'Annual insurance policy review',
      'Review goal progress and adjust SIP amounts',
      'Explore additional income/investment opportunities',
    ],
    color: BLUE,
  });
  timeline.push({
    period: quarterLabels[1],
    items: [
      'Year-end tax planning and investment booking',
      'Annual financial health reassessment',
      'Set goals and budget for next financial year',
    ],
    color: PURPLE,
  });

  // Render timeline with vertical line and dots
  const lineX = M + 6; // x position for vertical timeline line

  for (let t = 0; t < timeline.length; t++) {
    if (y > PH - FH - 30) break;
    const entry = timeline[t];
    const blockH = 8 + entry.items.length * 6;

    // Vertical connecting line (drawn behind)
    if (t < timeline.length - 1) {
      p.setDrawColor(...S200); p.setLineWidth(0.5);
      p.line(lineX, y + 5, lineX, y + blockH + 3);
    }

    // Timeline dot
    p.setFillColor(...entry.color); p.circle(lineX, y + 4, 2.5, 'F');
    p.setFillColor(...WHITE); p.circle(lineX, y + 4, 1.2, 'F');
    p.setFillColor(...entry.color); p.circle(lineX, y + 4, 0.7, 'F');

    // Content card offset to the right of the timeline
    const cardX = M + 14;
    const cardW = CW - 14;
    p.setFillColor(...S50); p.roundedRect(cardX, y, cardW, blockH, 2, 2, 'F');
    p.setFillColor(...entry.color); p.rect(cardX, y, 2, blockH, 'F');

    p.setTextColor(...entry.color); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text(entry.period, cardX + 5, y + 5);

    // Impact badge
    const impactLabel = t < 2 ? 'HIGH IMPACT' : t < 4 ? 'MEDIUM IMPACT' : t < 6 ? 'CONSOLIDATE' : 'REVIEW';
    p.setFillColor(...entry.color); p.roundedRect(PW - M - 28, y + 1.5, 24, 5, 1, 1, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
    p.text(impactLabel, PW - M - 16, y + 4.5, { align: 'center' });

    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    for (let i = 0; i < entry.items.length; i++) {
      const itemLines = p.splitTextToSize(`- ${entry.items[i]}`, cardW - 14);
      p.text(itemLines[0], cardX + 5, y + 10 + i * 6);
    }

    y += blockH + 3;
  }

  ftr(p);
}

// ─── Comprehensive: Assumptions & Methodology ───
function pCompAssumptions(
  p: jsPDF, dt: string, pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Assumptions & Methodology');

  // Return Rates Used
  p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Return Rates Used in Projections', M + 4, y + 5); y += 10;

  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Asset Class', M + 4, y + 5);
  p.text('Expected Return', M + 70, y + 5);
  p.text('Risk Level', M + 120, y + 5);
  p.text('Basis', PW - M - 4, y + 5, { align: 'right' }); y += 7;

  const rates: [string, string, string, string][] = [
    ['Large Cap Equity', '12% CAGR', 'High', '20-year Nifty 50 average'],
    ['Mid/Small Cap Equity', '14-16% CAGR', 'Very High', '15-year mid-cap index avg'],
    ['Debt / Fixed Income', '7-8% CAGR', 'Low', 'AAA corporate bond yields'],
    ['Gold / Sovereign Gold Bond', '8-10% CAGR', 'Moderate', '15-year gold price trend'],
    ['PPF / EPF', '7.1-8.25%', 'Very Low', 'Government declared rates'],
    ['NPS (Balanced)', '9-10% CAGR', 'Moderate', 'Historical NPS returns'],
    ['General Inflation', '6% p.a.', '-', 'CPI long-term average'],
    ['Education Inflation', '10% p.a.', '-', 'Historical education cost trend'],
    ['Medical Inflation', '12% p.a.', '-', 'Healthcare cost escalation'],
    ['Post-retirement Real Return', '3% p.a.', '-', 'Conservative estimate'],
  ];

  for (let i = 0; i < rates.length; i++) {
    const [asset, ret, risk, basis] = rates[i];
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 6, 'F');
    p.setTextColor(...S800); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text(asset, M + 4, y + 4);
    p.setTextColor(...TEAL); p.setFont('helvetica', 'bold'); p.text(ret, M + 70, y + 4);
    p.setTextColor(...S600); p.setFont('helvetica', 'normal'); p.text(risk, M + 120, y + 4);
    p.text(basis, PW - M - 4, y + 4, { align: 'right' });
    y += 6;
  }

  y += 8;

  // Scoring Methodology
  p.setTextColor(...PURPLE); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Scoring Methodology', M + 4, y + 5); y += 10;

  p.setFillColor(...B50); p.roundedRect(M, y, CW, 36, 2, 2, 'F');
  p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold');
  p.text('5-Pillar Assessment Framework', M + 5, y + 6);

  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  const scoringItems: [string, string, RGB][] = [
    ['Cashflow Health (180 pts)', 'Income, expenses, savings rate, emergency fund', PILLAR_C[0]],
    ['Protection & Insurance (180 pts)', 'Life, health, critical illness coverage adequacy', PILLAR_C[1]],
    ['Investments (180 pts)', 'Asset allocation, diversification, growth trajectory', PILLAR_C[2]],
    ['Debt Management (180 pts)', 'Debt-to-income ratio, loan structure, prepayment', PILLAR_C[3]],
    ['Retirement Readiness (180 pts)', 'Corpus progress, monthly shortfall, timeline', PILLAR_C[4]],
  ];

  let itemY = y + 12;
  for (const [title, desc, col] of scoringItems) {
    p.setFillColor(...col); p.circle(M + 8, itemY + 1, 2, 'F');
    p.setTextColor(...col); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
    p.text(title, M + 14, itemY + 2);
    p.setTextColor(...S600); p.setFont('helvetica', 'normal');
    p.text(desc, M + 62, itemY + 2);
    itemY += 5;
  }

  y += 42;

  // Grading scale
  p.setTextColor(...S800); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text('Grading Scale', M + 4, y + 5); y += 8;

  const grades: [string, string, RGB][] = [
    ['Excellent (750-900)', 'Top-tier financial health', GREEN],
    ['Good (600-749)', 'Above average, minor improvements needed', TEAL],
    ['Fair (450-599)', 'Average, significant room for improvement', AMBER],
    ['Needs Attention (300-449)', 'Below average, action required', ORANGE],
    ['Critical (0-299)', 'Immediate intervention recommended', RED],
  ];

  for (const [grade, desc, col] of grades) {
    p.setFillColor(...col); p.roundedRect(M, y, 55, 5, 1, 1, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.setFont('helvetica', 'bold');
    p.text(grade, M + 2, y + 3.5);
    p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text(desc, M + 60, y + 3.5);
    y += 7;
  }

  // Planning Assumptions
  y += 5;
  if (y < PH - FH - 50) {
    p.setTextColor(...TEAL); p.setFontSize(10); p.setFont('helvetica', 'bold');
    p.text('Planning Assumptions', M + 4, y + 5); y += 10;

    p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 28, 2, 2, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const planAssumptions: [string, string][] = [
      ['Income Growth Rate', '8% p.a. (moderate scenario)'],
      ['SIP Step-up', '10% annual increase'],
      ['Life Expectancy', '85 years'],
      ['Retirement Age', '60 years (or as specified by user)'],
      ['Tax Regime', 'Based on user selection; compared both old and new'],
    ];
    for (let i = 0; i < planAssumptions.length; i++) {
      const [label, value] = planAssumptions[i];
      p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
      p.text(label + ':', M + 5, y + 5 + i * 5);
      p.setTextColor(...S800); p.setFont('helvetica', 'normal');
      p.text(value, M + 60, y + 5 + i * 5);
    }
    y += 32;
  }

  // Data Sources
  if (y < PH - FH - 20) {
    p.setTextColor(...S800); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text('Data Sources & Disclaimers', M + 4, y + 5); y += 8;
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
    const sources = [
      'Return assumptions based on historical data from NSE, BSE, AMFI, RBI. Past performance does not guarantee future results.',
      'Insurance coverage recommendations follow IRDAI guidelines and industry benchmarks.',
      'Tax calculations based on Income Tax Act provisions for FY 2026-27. Consult a CA for personalized tax advice.',
      'All projections use self-reported data. Accuracy depends on data quality provided during assessment.',
    ];
    for (const src of sources) {
      if (y > PH - FH - 10) break;
      const srcLines = p.splitTextToSize(src, CW - 8);
      p.text(srcLines, M + 4, y);
      y += srcLines.length * 2.8 + 2;
    }
  }

  ftr(p);
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main Export ───
// ═══════════════════════════════════════════════════════════════════

export function generateFinancialReport(
  report: FinancialHealthReport,
  data: FinancialPlanningData,
  userName: string,
  tier?: PlanTier,
  cashflowProjection?: CashflowProjection,
  allocationMatrix?: AssetAllocationMatrix,
): Buffer {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const effectiveTier = tier || 'standard';

  // Cast for V2 fields if available
  const reportV2 = report as Partial<FinancialHealthReportV2>;

  if (effectiveTier === 'basic') {
    // ─── BASIC: 4 pages ───
    const totalPages = 4;
    p1(pdf, report, userName, date, totalPages, 'basic');              // Page 1: Cover
    p2(pdf, report, date, 2, totalPages);                              // Page 2: Dashboard
    pBasicInsights(pdf, report, date, 3, totalPages);                  // Page 3: Quick Insights + Top Actions
    pBasicDisclaimers(pdf, report, date, 4, totalPages);               // Page 4: Disclaimers + Upgrade CTA

  } else if (effectiveTier === 'comprehensive') {
    // ─── COMPREHENSIVE: ~17 pages ───
    const totalPages = 17;

    // Resolve optional data from V2 report or function params
    const execSummary = reportV2.executiveSummary;
    const cfProjection = cashflowProjection || reportV2.cashflowProjection;
    const allocMatrix = allocationMatrix || reportV2.allocationMatrix;
    const debtStrat = reportV2.debtStrategy;
    const taxOpt = reportV2.taxOptimization;

    let pg = 1;
    p1(pdf, report, userName, date, totalPages, 'comprehensive');                       // 1: Cover
    pCompExecSummary(pdf, report, userName, date, execSummary, ++pg, totalPages);        // 2: Executive Summary
    p2(pdf, report, date, ++pg, totalPages);                                            // 3: Dashboard
    p3(pdf, report, data, date, ++pg, totalPages);                                      // 4: Net Worth
    p4(pdf, report, date, ++pg, totalPages);                                            // 5: Retirement
    p5(pdf, report, date, ++pg, totalPages);                                            // 6: Goals
    pCompCashflow(pdf, report, data, date, cfProjection, ++pg, totalPages);             // 7: Cashflow Projection
    pCompAllocationMatrix(pdf, report, date, allocMatrix, ++pg, totalPages);            // 8: Allocation Matrix
    p6(pdf, report, date, ++pg, totalPages);                                            // 9: Insurance
    pCompDebtStrategy(pdf, report, data, date, debtStrat, ++pg, totalPages);            // 10: Debt Strategy
    pCompTaxOptimization(pdf, report, data, date, taxOpt, ++pg, totalPages);            // 11: Tax Optimization
    p7(pdf, report, date, ++pg, totalPages);                                            // 12: Asset Allocation
    p8(pdf, report, date, ++pg, totalPages);                                            // 13: Action Plan
    pCompActionTimeline(pdf, report, date, ++pg, totalPages);                           // 14: 12-Month Timeline
    p9(pdf, report, userName, date, ++pg, totalPages);                                  // 15: AI Narrative
    pCompAssumptions(pdf, date, ++pg, totalPages);                                      // 16: Assumptions
    p10(pdf, date, ++pg, totalPages);                                                   // 17: Disclaimers

  } else {
    // ─── STANDARD: 10 pages (existing flow) ───
    const totalPages = 10;
    p1(pdf, report, userName, date, totalPages, 'standard');
    p2(pdf, report, date, 2, totalPages);
    p3(pdf, report, data, date, 3, totalPages);
    p4(pdf, report, date, 4, totalPages);
    p5(pdf, report, date, 5, totalPages);
    p6(pdf, report, date, 6, totalPages);
    p7(pdf, report, date, 7, totalPages);
    p8(pdf, report, date, 8, totalPages);
    p9(pdf, report, userName, date, 9, totalPages);
    p10(pdf, date, 10, totalPages);
  }

  return Buffer.from(pdf.output('arraybuffer'));
}
