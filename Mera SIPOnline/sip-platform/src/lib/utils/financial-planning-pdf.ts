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

/** Replace ₹ with Rs. for Helvetica compatibility */
const rs = (t: string): string => t.replace(/₹/g, 'Rs. ');

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
function p1(p: jsPDF, r: FinancialHealthReport, nm: string, dt: string, totalPages: number) {
  hdr(p, 1, dt, totalPages); wm(p);
  let y = 50;
  try { p.addImage(LOGO_BASE64, 'PNG', PW / 2 - 30, y, 60, 30); y += 38; } catch { y += 10; }

  p.setTextColor(...TEAL); p.setFontSize(22); p.setFont('helvetica', 'bold');
  p.text('Financial Health Report', PW / 2, y, { align: 'center' }); y += 10;
  p.setTextColor(...S600); p.setFontSize(12); p.setFont('helvetica', 'normal');
  p.text('Trustner Financial Wellness Assessment', PW / 2, y, { align: 'center' }); y += 15;

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

  y += 5;
  p.setFillColor(...S50); p.roundedRect(M, y, CW, 18, 2, 2, 'F');
  p.setTextColor(...S400); p.setFontSize(6); p.setFont('helvetica', 'normal');
  ['Assumptions: Inflation 6% p.a. | Life expectancy 85 years | Real return 3% post-retirement',
   'Projected growth: EPF/NPS at 8% CAGR, MF at 10% CAGR | Corpus calculated using annuity model',
   'These are indicative projections. Actual results may vary based on market conditions.'].forEach((l, i) => {
    p.text(l, M + 4, y + 4 + i * 4);
  });
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

  p.setFillColor(...TEAL); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6); p.setFont('helvetica', 'bold');
  p.text('Goal', M + 3, y + 5); p.text('Future Cost', M + 58, y + 5);
  p.text('Progress', M + 90, y + 5); p.text('Monthly SIP', M + 118, y + 5);
  p.text('Status', PW - M - 4, y + 5, { align: 'right' }); y += 7;

  const fc: Record<string, RGB> = { 'on-track': GREEN, 'possible': TEAL, 'stretch': AMBER, 'unrealistic': RED };

  for (let i = 0; i < goals.length; i++) {
    const gl = goals[i];
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 8, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
    p.text(gl.goalName.substring(0, 22), M + 3, y + 5.5);
    p.setFont('helvetica', 'normal'); p.setTextColor(...S600);
    p.text(rs(formatINR(gl.futureCost)), M + 58, y + 5.5);
    p.text(rs(formatINR(gl.currentProgress)), M + 90, y + 5.5);
    p.text(gl.monthlyRequired > 0 ? rs(formatINR(gl.monthlyRequired)) : '-', M + 118, y + 5.5);

    const fCol = fc[gl.feasibility] || S600;
    const fLbl = gl.feasibility.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    p.setFillColor(...fCol); p.roundedRect(PW - M - 22, y + 1.5, 20, 5, 1, 1, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5); p.setFont('helvetica', 'bold');
    p.text(fLbl, PW - M - 12, y + 5, { align: 'center' });
    y += 8;
  }

  y += 8;
  const tfc = goals.reduce((s, g) => s + g.futureCost, 0);
  const tm = goals.reduce((s, g) => s + g.monthlyRequired, 0);
  p.setFillColor(...B50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
  p.setTextColor(...BLUE); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text(`Total Goals: ${goals.length}`, M + 5, y + 6);
  p.text(`Combined Future Cost: ${rs(formatINR(tfc))}`, M + 5, y + 11);
  p.text(`Total Monthly SIP: ${rs(formatINR(tm))}`, PW - M - 5, y + 9, { align: 'right' });
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

  p.setFillColor(...S50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  const note = p.splitTextToSize('Insurance gap analysis is indicative. For personalized insurance recommendations, please consult a licensed insurance advisor. Trustner Insurance Brokers (IRDAI License #1067) can help you find the right policy.', CW - 10);
  p.text(note, M + 5, y + 5);
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
  const nar = r.claudeNarrative || 'Your personalized narrative will be generated soon.';
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
      const goalLines = p.splitTextToSize(`You want to: ${item.clientGoal}`, 60);
      p.text(goalLines.slice(0, 3), M + 30, y + 4);

      p.setTextColor(...S600); p.setFontSize(5.5);
      const recLines = p.splitTextToSize(`We recommend: ${item.recommendation}`, 60);
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
      p.setFillColor(...fCol); p.roundedRect(PW - M - 20, y + 2, 17, 5, 1, 1, 'F');
      p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
      p.text(gl.feasibility.toUpperCase().replace('-', ' '), PW - M - 11.5, y + 5.5, { align: 'center' });
      y += rowH;
    }
  }

  // Overall message
  y += 8;
  if (y < PH - FH - 30) {
    const msg = execSummary?.overallMessage || r.claudeNarrative?.substring(0, 300) || 'Your financial health assessment is complete. Please review the detailed pages for comprehensive analysis.';
    p.setFillColor(...TEAL_LIGHT); p.roundedRect(M, y, CW, 24, 2, 2, 'F');
    p.setDrawColor(...TEAL); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 24, 2, 2, 'S');
    p.setFillColor(...TEAL); p.rect(M, y, 3, 24, 'F');
    p.setTextColor(...TEAL); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text('Overall Assessment', M + 8, y + 6);
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'normal');
    const msgLines = p.splitTextToSize(msg, CW - 16);
    p.text(msgLines.slice(0, 4), M + 8, y + 12);
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
  const incRate = assumptions?.incomeGrowthRate ?? 8;
  const expRate = assumptions?.expenseInflationRate ?? 6;
  const sipRate = assumptions?.sipStepUpRate ?? 10;

  p.setFillColor(...A50); p.roundedRect(M, y, CW, 24, 2, 2, 'F');
  p.setDrawColor(...AMBER); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 24, 2, 2, 'S');
  p.setTextColor(...AMBER); p.setFontSize(8); p.setFont('helvetica', 'bold');
  p.text('Assumptions', M + 5, y + 6);
  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  p.text(`Income Growth Rate: ${incRate}% p.a.`, M + 5, y + 12);
  p.text(`Expense Inflation Rate: ${expRate}% p.a.`, M + 70, y + 12);
  p.text(`SIP Step-up Rate: ${sipRate}% p.a.`, M + 5, y + 17);
  p.text('EMI reduction assumed post Year 3 | Premium escalation at 5% p.a.', M + 70, y + 17);

  y += 30;
  p.setFillColor(...S50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
  p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
  p.text('These projections are indicative. Actual cashflows may vary based on income changes, lifestyle adjustments, and market conditions.', M + 4, y + 4);
  p.text('Consult your Trustner advisor for a personalized cashflow plan.', M + 4, y + 7.5);

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

  // Rebalancing note
  y += 10;
  if (y < PH - FH - 20) {
    const rebalFreq = allocationMatrix?.rebalancingFrequency || 'semi-annually';
    p.setFillColor(...B50); p.roundedRect(M, y, CW, 10, 2, 2, 'F');
    p.setTextColor(...BLUE); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(`Recommended Rebalancing: ${rebalFreq.charAt(0).toUpperCase() + rebalFreq.slice(1)}`, M + 5, y + 4);
    p.setTextColor(...S600); p.setFontSize(6); p.setFont('helvetica', 'normal');
    p.text('Rebalance your portfolio periodically to maintain target allocations and manage risk.', M + 5, y + 8);
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

  p.setFillColor(...RED); p.rect(M, y, CW, 7, 'F');
  p.setTextColor(255, 255, 255); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
  p.text('Loan Type', M + 3, y + 5);
  p.text('Outstanding', M + 55, y + 5);
  p.text('EMI/month', M + 95, y + 5);
  p.text('Remaining', PW - M - 4, y + 5, { align: 'right' });
  y += 7;

  const loans: [string, { outstanding: number; emi: number; remainingYears: number } | undefined][] = [
    ['Home Loan', li.homeLoan], ['Car Loan', li.carLoan],
    ['Personal Loan', li.personalLoan], ['Education Loan', li.educationLoan],
  ];

  let hasDebt = false;
  for (let i = 0; i < loans.length; i++) {
    const [name, loan] = loans[i];
    if (!loan || loan.outstanding <= 0) continue;
    hasDebt = true;
    p.setFillColor(...(i % 2 === 0 ? S50 : WHITE)); p.rect(M, y, CW, 7, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    p.text(name, M + 3, y + 5);
    p.text(rs(formatINR(loan.outstanding)), M + 55, y + 5);
    p.text(rs(formatINR(loan.emi)), M + 95, y + 5);
    p.text(`${loan.remainingYears} years`, PW - M - 4, y + 5, { align: 'right' });
    y += 7;
  }

  if (li.creditCardDebt > 0) {
    hasDebt = true;
    p.setFillColor(...R50); p.rect(M, y, CW, 7, 'F');
    p.setTextColor(...RED); p.setFontSize(6.5); p.setFont('helvetica', 'bold');
    p.text('Credit Card Debt', M + 3, y + 5);
    p.text(rs(formatINR(li.creditCardDebt)), M + 55, y + 5);
    p.text('Revolving', PW - M - 4, y + 5, { align: 'right' });
    y += 7;
  }

  if (li.otherLoans > 0) {
    hasDebt = true;
    p.setFillColor(...S50); p.rect(M, y, CW, 7, 'F');
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    p.text('Other Loans', M + 3, y + 5);
    p.text(rs(formatINR(li.otherLoans)), M + 55, y + 5);
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
function pCompTaxOptimization(
  p: jsPDF, r: FinancialHealthReport, d: FinancialPlanningData, dt: string,
  taxOpt: FinancialHealthReportV2['taxOptimization'], pg: number, totalPages: number
) {
  p.addPage(); hdr(p, pg, dt, totalPages); wm(p);
  let y = secTitle(p, CSY, 'Tax Optimization Strategy');

  const tax = d.taxProfile;

  // Old vs New Regime Comparison
  p.setTextColor(...S800); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Tax Regime Comparison', M + 4, y + 5); y += 10;

  // Two-column comparison
  const colW = (CW - 6) / 2;

  // Old Regime box
  const oldSelected = (taxOpt?.recommendedRegime || tax.taxRegime) === 'old';
  const newSelected = !oldSelected;

  p.setFillColor(...(oldSelected ? E50 : S50)); p.roundedRect(M, y, colW, 55, 2, 2, 'F');
  if (oldSelected) { p.setDrawColor(...GREEN); p.setLineWidth(0.5); p.roundedRect(M, y, colW, 55, 2, 2, 'S'); }
  p.setTextColor(...(oldSelected ? GREEN : S600)); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('Old Regime', M + 5, y + 8);
  if (oldSelected) {
    p.setFillColor(...GREEN); p.roundedRect(M + colW - 32, y + 3, 28, 6, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.text('RECOMMENDED', M + colW - 18, y + 7, { align: 'center' });
  }
  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  p.text('Allows deductions under:', M + 5, y + 16);
  p.text('Sec 80C, 80D, HRA, NPS, etc.', M + 5, y + 21);
  p.text('Better if deductions > Rs. 3.75L', M + 5, y + 26);

  if (taxOpt) {
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(`Tax: ${rs(formatINR(oldSelected ? taxOpt.optimizedTax : taxOpt.currentTax))}`, M + 5, y + 35);
  }

  // New Regime box
  const nrX = M + colW + 6;
  p.setFillColor(...(newSelected ? E50 : S50)); p.roundedRect(nrX, y, colW, 55, 2, 2, 'F');
  if (newSelected) { p.setDrawColor(...GREEN); p.setLineWidth(0.5); p.roundedRect(nrX, y, colW, 55, 2, 2, 'S'); }
  p.setTextColor(...(newSelected ? GREEN : S600)); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('New Regime', nrX + 5, y + 8);
  if (newSelected) {
    p.setFillColor(...GREEN); p.roundedRect(nrX + colW - 32, y + 3, 28, 6, 1.5, 1.5, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(5.5); p.text('RECOMMENDED', nrX + colW - 18, y + 7, { align: 'center' });
  }
  p.setTextColor(...S600); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
  p.text('Lower slab rates, no deductions', nrX + 5, y + 16);
  p.text('Standard deduction Rs. 75,000', nrX + 5, y + 21);
  p.text('Simpler, better if low deductions', nrX + 5, y + 26);

  if (taxOpt) {
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(`Tax: ${rs(formatINR(newSelected ? taxOpt.optimizedTax : taxOpt.currentTax))}`, nrX + 5, y + 35);
  }
  y += 62;

  // Tax savings highlight
  if (taxOpt && taxOpt.savings > 0) {
    p.setFillColor(...E50); p.roundedRect(M, y, CW, 14, 2, 2, 'F');
    p.setDrawColor(...GREEN); p.setLineWidth(0.3); p.roundedRect(M, y, CW, 14, 2, 2, 'S');
    p.setTextColor(...GREEN); p.setFontSize(10); p.setFont('helvetica', 'bold');
    p.text(`Potential Annual Tax Savings: ${rs(formatINR(taxOpt.savings))}`, M + 5, y + 9);
    y += 20;
  }

  // Current Deductions
  p.setTextColor(...PURPLE); p.setFontSize(10); p.setFont('helvetica', 'bold');
  p.text('Current Deductions Utilization', M + 4, y + 5); y += 10;

  const deductions: [string, string, number, number][] = [
    ['Section 80C', 'PPF, EPF, ELSS, LIC', tax.section80CUsed || 0, 150000],
    ['Section 80D', 'Health Insurance Premiums', tax.section80DUsed || 0, 75000],
    ['NPS (80CCD)', 'Additional NPS Contribution', tax.npsContribution || 0, 50000],
  ];

  for (const [sec, desc, used, limit] of deductions) {
    const utilPct = Math.min((used / limit) * 100, 100);
    const utilColor = utilPct >= 90 ? GREEN : utilPct >= 50 ? AMBER : RED;

    p.setFillColor(...S50); p.roundedRect(M, y, CW, 16, 1, 1, 'F');
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(sec, M + 4, y + 5);
    p.setTextColor(...S400); p.setFontSize(5.5); p.setFont('helvetica', 'normal');
    p.text(desc, M + 4, y + 9);
    p.setTextColor(...S800); p.setFontSize(7); p.setFont('helvetica', 'bold');
    p.text(`${rs(formatINR(used))} / ${rs(formatINR(limit))}`, PW - M - 4, y + 5, { align: 'right' });
    progBar(p, M + 4, y + 12, CW - 8, 2.5, used, limit, utilColor);
    y += 18;
  }

  // Recommendations
  y += 3;
  p.setTextColor(...TEAL); p.setFontSize(9); p.setFont('helvetica', 'bold');
  p.text('Recommended Actions', M + 4, y + 5); y += 10;

  const recs = taxOpt?.recommendations || [];
  const defaultRecs = recs.length > 0 ? recs : [
    tax.section80CUsed < 150000 ? `Invest ${rs(formatINR(150000 - tax.section80CUsed))} more in ELSS/PPF to maximize 80C deduction.` : '80C fully utilized - good job!',
    tax.section80DUsed < 25000 ? 'Consider health insurance for self and family to claim 80D deduction.' : 'Health insurance premium deductions are being claimed.',
    tax.npsContribution < 50000 ? 'Consider additional NPS contribution for extra Rs. 50,000 deduction under 80CCD(1B).' : 'NPS additional contribution is being maximized.',
  ];

  for (let i = 0; i < Math.min(defaultRecs.length, 4); i++) {
    if (y > PH - FH - 15) break;
    p.setTextColor(...TEAL); p.setFontSize(7); p.setFont('helvetica', 'bold'); p.text(`${i + 1}.`, M + 4, y);
    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    const recLines = p.splitTextToSize(defaultRecs[i], CW - 14);
    p.text(recLines.slice(0, 2), M + 12, y);
    y += recLines.length * 3.5 + 2;
  }

  ftr(p);
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

  // Render timeline
  for (let t = 0; t < timeline.length; t++) {
    if (y > PH - FH - 30) break;
    const entry = timeline[t];

    // Period label with colored left bar
    p.setFillColor(...S50); p.roundedRect(M, y, CW, 6 + entry.items.length * 6, 2, 2, 'F');
    p.setFillColor(...entry.color); p.rect(M, y, 3, 6 + entry.items.length * 6, 'F');

    p.setTextColor(...entry.color); p.setFontSize(8); p.setFont('helvetica', 'bold');
    p.text(entry.period, M + 8, y + 5);

    // Impact badge
    const impactLabel = t < 2 ? 'HIGH IMPACT' : t < 4 ? 'MEDIUM IMPACT' : t < 6 ? 'CONSOLIDATE' : 'REVIEW';
    p.setFillColor(...entry.color); p.roundedRect(PW - M - 28, y + 1.5, 24, 5, 1, 1, 'F');
    p.setTextColor(255, 255, 255); p.setFontSize(4.5); p.setFont('helvetica', 'bold');
    p.text(impactLabel, PW - M - 16, y + 4.5, { align: 'center' });

    p.setTextColor(...S800); p.setFontSize(6.5); p.setFont('helvetica', 'normal');
    for (let i = 0; i < entry.items.length; i++) {
      const itemLines = p.splitTextToSize(`- ${entry.items[i]}`, CW - 20);
      p.text(itemLines[0], M + 8, y + 10 + i * 6);
    }

    y += 8 + entry.items.length * 6 + 3;
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
    ['Inflation Rate', '6% p.a.', '-', 'CPI long-term average'],
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

  y += 5;
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
    p1(pdf, report, userName, date, totalPages);                       // Page 1: Cover
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
    p1(pdf, report, userName, date, totalPages);                                        // 1: Cover
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
    p1(pdf, report, userName, date, totalPages);
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
