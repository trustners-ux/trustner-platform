/**
 * Salary Slip PDF generator (server-side, no headless Chrome).
 *
 * Uses pdfkit to render a single-page A4 slip with:
 *   - Trustner branded header (entity name, CIN, ARN/IRDAI registration)
 *   - Employee block (code, name, designation, office, DOJ, PAN, account)
 *   - Pay period (month + paid days + LOP)
 *   - Earnings table (Basic, HRA, Special, Variable)
 *   - Deductions table (PF, ESI, PT, TDS, Other)
 *   - Net pay highlighted
 *   - Footer with ARN-286886 / IRDAI 1067 + computer-generated note
 *
 * Returns a Buffer that the caller can upload to Vercel Blob or
 * stream directly as the HTTP response.
 */
import PDFDocument from 'pdfkit';

export interface SlipInput {
  // Header / company
  entity: 'TAS' | 'TIB';
  // Employee
  employee_code: string;
  full_name: string;
  designation?: string | null;
  department?: string | null;
  office_city?: string | null;
  date_of_joining?: string | null;
  pan?: string | null;
  bank_branch?: string | null;
  ifsc?: string | null;
  // Period
  pay_month: string;       // 'YYYY-MM'
  paid_days?: number | null;
  lop_days?: number | null;
  // Earnings
  basic: number;
  hra: number;
  special_allowance: number;
  variable_pay: number;
  other_earnings: number;
  gross: number;
  // Deductions
  pf_employee: number;
  esi_employee: number;
  professional_tax: number;
  tds: number;
  loan_recovery: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
}

const ENTITY = {
  TAS: {
    name: 'Trustner Asset Services Pvt. Ltd.',
    cin: 'U66301AS2023PTC025505',
    reg: 'AMFI ARN-286886',
  },
  TIB: {
    name: 'Trustner Insurance Brokers Pvt. Ltd.',
    cin: '[CIN — TIB]',
    reg: 'IRDAI Licence No. 1067',
  },
};

const NAVY = '#1B3A5C';
const GOLD = '#C5A55A';
const SLATE = '#444';
const LIGHT_NAVY = '#eef3f8';
const LIGHT_GOLD = '#fbf6ea';

function inr(v: number | null | undefined): string {
  const n = typeof v === 'number' ? v : 0;
  if (n === 0) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Render a single salary slip and return a Buffer of the PDF bytes.
 */
export async function renderSalarySlip(slip: SlipInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (e) => reject(e));

    const ent = ENTITY[slip.entity];

    // ── Header ────────────────────────────────────────────────
    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
       .text(ent.name, { align: 'left' });
    doc.fillColor(SLATE).fontSize(8).font('Helvetica')
       .text(`CIN: ${ent.cin} · ${ent.reg}`, { align: 'left' });
    doc.text('Registered Office: Sethi Trust Building, Unit 2, 4th Floor, GS Road, Bhangagarh, Dispur, Kamrup (Metro), Assam – 781005');
    doc.moveDown(0.5);

    // Title bar
    doc.rect(36, doc.y, 523, 22).fill(NAVY);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
       .text(`Pay Slip · ${monthLabel(slip.pay_month)}`, 36, doc.y - 16, { align: 'center', width: 523 });
    doc.moveDown(2);

    // ── Employee block ────────────────────────────────────────
    const y0 = doc.y;
    doc.fontSize(9).fillColor(SLATE).font('Helvetica');
    const leftCol = (label: string, val: string, y: number) => {
      doc.font('Helvetica').fillColor(SLATE).text(label, 36, y, { width: 100 });
      doc.font('Helvetica-Bold').fillColor('black').text(val || '—', 140, y, { width: 130 });
    };
    const rightCol = (label: string, val: string, y: number) => {
      doc.font('Helvetica').fillColor(SLATE).text(label, 300, y, { width: 110 });
      doc.font('Helvetica-Bold').fillColor('black').text(val || '—', 410, y, { width: 150 });
    };
    leftCol('Employee Code',  slip.employee_code,             y0);
    rightCol('PAN',           slip.pan || '—',                y0);
    leftCol('Name',           slip.full_name,                 y0 + 13);
    rightCol('Bank',          slip.bank_branch || '—',        y0 + 13);
    leftCol('Designation',    slip.designation || '—',        y0 + 26);
    rightCol('IFSC',          slip.ifsc || '—',               y0 + 26);
    leftCol('Department',     slip.department || '—',         y0 + 39);
    rightCol('Date of Joining', slip.date_of_joining || '—',  y0 + 39);
    leftCol('Office',         slip.office_city || '—',        y0 + 52);
    rightCol('Paid Days',
      `${slip.paid_days ?? '—'}${slip.lop_days ? ` (LOP: ${slip.lop_days})` : ''}`,
      y0 + 52);

    doc.y = y0 + 72;

    // ── Earnings + Deductions side by side ────────────────────
    const tableY = doc.y;
    const tableTop = (x: number, w: number, label: string) => {
      doc.rect(x, tableY, w, 16).fill(NAVY);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text(label, x + 6, tableY + 3, { width: w - 12 });
    };
    tableTop(36, 256, 'Earnings');
    tableTop(304, 255, 'Deductions');

    const earnRows: Array<[string, number]> = [
      ['Basic',                       slip.basic],
      ['House Rent Allowance',        slip.hra],
      ['Special Allowance',           slip.special_allowance],
      ['Variable Pay',                slip.variable_pay],
      ['Other Earnings',              slip.other_earnings],
    ];
    const dedRows: Array<[string, number]> = [
      ['Provident Fund (EE)',         slip.pf_employee],
      ['ESI (EE)',                    slip.esi_employee],
      ['Professional Tax',            slip.professional_tax],
      ['TDS (Income Tax)',            slip.tds],
      ['Loan Recovery',               slip.loan_recovery],
      ['Other Deductions',            slip.other_deductions],
    ];

    const startY = tableY + 16;
    const rowH = 16;
    const drawRow = (rows: Array<[string, number]>, baseX: number, w: number) => {
      rows.forEach((r, i) => {
        const yy = startY + i * rowH;
        if (i % 2 === 0) {
          doc.fillColor(LIGHT_NAVY).rect(baseX, yy, w, rowH).fill();
        }
        doc.fillColor('black').font('Helvetica').fontSize(9)
           .text(r[0], baseX + 6, yy + 4, { width: w - 80 });
        doc.font('Helvetica-Bold')
           .text('₹ ' + inr(r[1]), baseX + w - 74, yy + 4, { width: 68, align: 'right' });
      });
    };
    drawRow(earnRows, 36, 256);
    drawRow(dedRows, 304, 255);

    const maxRows = Math.max(earnRows.length, dedRows.length);
    const totalsY = startY + maxRows * rowH;

    // Earnings total
    doc.fillColor(LIGHT_GOLD).rect(36, totalsY, 256, 18).fill();
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
       .text('Gross Earnings', 42, totalsY + 5, { width: 170 });
    doc.text('₹ ' + inr(slip.gross), 36 + 256 - 80, totalsY + 5, { width: 74, align: 'right' });

    // Deductions total
    doc.fillColor(LIGHT_GOLD).rect(304, totalsY, 255, 18).fill();
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
       .text('Total Deductions', 310, totalsY + 5, { width: 170 });
    doc.text('₹ ' + inr(slip.total_deductions), 304 + 255 - 80, totalsY + 5, { width: 74, align: 'right' });

    // ── Net Pay banner ────────────────────────────────────────
    const netY = totalsY + 30;
    doc.fillColor(NAVY).rect(36, netY, 523, 36).fill();
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
       .text('NET PAY', 42, netY + 6, { width: 180 });
    doc.fillColor(GOLD).fontSize(9).font('Helvetica')
       .text(`In words: Rupees ${inWords(slip.net_pay)} only`, 42, netY + 22, { width: 400 });
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
       .text('₹ ' + inr(slip.net_pay), 36, netY + 7, { width: 523 - 12, align: 'right' });

    // ── Footer ────────────────────────────────────────────────
    const footY = 800;
    doc.fillColor(SLATE).fontSize(7).font('Helvetica')
       .text(
         'This is a computer-generated payslip and does not require a signature. For any clarification, contact HR at wecare@trustner.in. ' +
         'Trustner Asset Services Pvt. Ltd. · AMFI ARN-286886. Trustner Insurance Brokers Pvt. Ltd. · IRDAI Licence No. 1067.',
         36, footY, { width: 523, align: 'center' }
       );

    doc.end();
  });
}

/** Tiny INR-to-words helper. Covers up to crores; sufficient for payroll. */
function inWords(amount: number): string {
  const n = Math.round(amount || 0);
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const twoDigit = (x: number): string => {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  };
  const threeDigit = (x: number): string => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigit(r) : '');
  };
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thou = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  let out = '';
  if (crore) out += twoDigit(crore) + ' Crore ';
  if (lakh) out += twoDigit(lakh) + ' Lakh ';
  if (thou) out += twoDigit(thou) + ' Thousand ';
  if (rest) out += threeDigit(rest);
  return out.trim();
}
