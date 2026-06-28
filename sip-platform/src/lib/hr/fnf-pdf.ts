/**
 * Full & Final settlement statement PDF generator.
 *
 * Mirrors the pdfkit pattern in salary-slip-pdf.ts (no headless Chrome needed
 * on Vercel). Single A4 page with:
 *   - Trustner branded letterhead
 *   - Employee block (code, name, designation, DOJ, LWD, PAN, bank)
 *   - Separation block (case code, type, tenure, paid/lop days)
 *   - Earnings table (final salary components, bonus, EL encash, gratuity, reimbursement)
 *   - Deductions table (PF, ESI, PT, TDS, loan, notice shortfall, asset, other)
 *   - NET PAYABLE prominent
 *   - "Payable by" date (LWD + 45 days)
 *   - Signature block: HR + Employee + CEO
 *   - SEBI / AMFI compliance footer
 */

import PDFDocument from 'pdfkit';
import type { FnFOutput } from './fnf-engine';

export interface FnFPdfInput {
  fnf: FnFOutput;
  entity: 'TAS' | 'TIB';
  case_code: string;
  separation_type: string;
  employee_code: string;
  full_name: string;
  designation?: string | null;
  department?: string | null;
  date_of_joining: string;            // ISO
  pan?: string | null;
  bank_branch?: string | null;
  ifsc?: string | null;
  tenure_years_exact?: number;        // for display
  /** Optional name strings for the signature block. */
  hr_signatory_name?: string;
  ceo_signatory_name?: string;
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
const ROSE = '#be123c';
const LIGHT_NAVY = '#eef3f8';
const LIGHT_GOLD = '#fbf6ea';

function inr(v: number | null | undefined): string {
  const n = typeof v === 'number' ? v : 0;
  if (n === 0) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

function isoToDDMonYYYY(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prettyType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function renderFnFStatement(input: FnFPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { fnf } = input;
    const ent = ENTITY[input.entity];

    // ── Header ──────────────────────────────────────────────────
    doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
       .text(ent.name, { align: 'left' });
    doc.fillColor(SLATE).fontSize(8).font('Helvetica')
       .text(`CIN: ${ent.cin} · ${ent.reg}`, { align: 'left' });
    doc.text('Registered Office: Sethi Trust Building, Unit 2, 4th Floor, GS Road, Bhangagarh, Dispur, Kamrup (Metro), Assam – 781005');
    doc.moveDown(0.4);

    // Title bar
    const tbY = doc.y;
    doc.rect(36, tbY, 523, 24).fill(NAVY);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
       .text(`Full & Final Settlement Statement`, 36, tbY + 6, { align: 'center', width: 523 });
    doc.fillColor('white').fontSize(8).font('Helvetica')
       .text(`Case ${input.case_code} · Settlement Month ${fnf.fnf_month}`,
             36, tbY + 30, { align: 'center', width: 523 });
    doc.moveDown(3.4);

    // ── Employee + Separation block (two columns) ───────────────
    const y0 = doc.y;
    doc.fontSize(9);
    const leftCol = (label: string, val: string, y: number) => {
      doc.font('Helvetica').fillColor(SLATE).text(label, 36, y, { width: 100 });
      doc.font('Helvetica-Bold').fillColor('black').text(val || '—', 140, y, { width: 140 });
    };
    const rightCol = (label: string, val: string, y: number) => {
      doc.font('Helvetica').fillColor(SLATE).text(label, 300, y, { width: 110 });
      doc.font('Helvetica-Bold').fillColor('black').text(val || '—', 410, y, { width: 150 });
    };

    leftCol('Employee Code',  input.employee_code,                              y0);
    rightCol('PAN',           input.pan || '—',                                 y0);
    leftCol('Name',           input.full_name,                                  y0 + 13);
    rightCol('Bank Branch',   input.bank_branch || '—',                         y0 + 13);
    leftCol('Designation',    input.designation || '—',                         y0 + 26);
    rightCol('IFSC',          input.ifsc || '—',                                y0 + 26);
    leftCol('Department',     input.department || '—',                          y0 + 39);
    rightCol('Date of Joining', isoToDDMonYYYY(input.date_of_joining),          y0 + 39);
    leftCol('Separation Type', prettyType(input.separation_type),               y0 + 52);
    rightCol('Last Working Day', isoToDDMonYYYY(fnf.lwd),                       y0 + 52);
    leftCol('Tenure (yrs)',
      (input.tenure_years_exact ?? 0).toFixed(2),                               y0 + 65);
    rightCol('Paid Days',
      `${fnf.paid_days}${fnf.lop_days ? ` (LOP: ${fnf.lop_days})` : ''}`,       y0 + 65);

    doc.y = y0 + 86;

    // ── Earnings + Deductions tables side by side ───────────────
    const tableY = doc.y;
    const tableTop = (x: number, w: number, label: string) => {
      doc.rect(x, tableY, w, 16).fill(NAVY);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text(label, x + 6, tableY + 3, { width: w - 12 });
    };
    tableTop(36, 256, 'Earnings');
    tableTop(304, 255, 'Deductions');

    const earnRows: Array<[string, number]> = [
      ['Basic (final period)',        fnf.final_basic],
      ['HRA (final period)',          fnf.final_hra],
      ['Special Allowance',           fnf.final_special],
      ['Variable Pay',                fnf.final_variable],
      ['Bonus (offer-letter clause)', fnf.bonus_prorate],
      [`EL Encashment (${fnf.el_balance_days} days)`, fnf.el_encash_amount],
      [`Gratuity (${fnf.gratuity_years} yrs)`,        fnf.gratuity_amount],
      ['Reimbursements Pending',      fnf.reimbursement_pending],
    ];
    const dedRows: Array<[string, number]> = [
      ['Provident Fund',              fnf.pf_deduction],
      ['ESI',                          fnf.esi_deduction],
      ['Professional Tax',            fnf.pt_deduction],
      ['TDS (Income Tax)',            fnf.tds_deduction],
      ['Loan / Advance Recovery',     fnf.loan_recovery],
      ['Notice Shortfall Recovery',   fnf.notice_shortfall_recovery],
      ['Asset Recovery',              fnf.asset_recovery],
      ['Other Recovery',              fnf.other_recovery],
    ];

    const rowH = 14;
    const drawRows = (xCol: number, wCol: number, rows: Array<[string, number]>) => {
      let y = tableY + 18;
      doc.fontSize(9);
      rows.forEach(([label, val], i) => {
        if (i % 2 === 0) {
          doc.rect(xCol, y, wCol, rowH).fill(LIGHT_NAVY);
        }
        doc.fillColor(SLATE).font('Helvetica').text(label, xCol + 6, y + 3, { width: wCol - 80 });
        doc.fillColor('black').font('Helvetica-Bold').text(
          inr(val), xCol + wCol - 74, y + 3, { width: 68, align: 'right' }
        );
        y += rowH;
      });
      return y;
    };
    const earnEnd = drawRows(36, 256, earnRows);
    const dedEnd  = drawRows(304, 255, dedRows);

    const tableBottom = Math.max(earnEnd, dedEnd) + 4;

    // Subtotal rows
    doc.rect(36, tableBottom, 256, 18).fill(GOLD);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text('Gross Payable', 42, tableBottom + 4, { width: 160 });
    doc.text(`₹ ${inr(fnf.gross_payable)}`, 36 + 256 - 90, tableBottom + 4,
             { width: 84, align: 'right' });

    doc.rect(304, tableBottom, 255, 18).fill(ROSE);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text('Total Deductions', 310, tableBottom + 4, { width: 160 });
    doc.text(`₹ ${inr(fnf.breakup.deductions.total_deductions)}`,
             304 + 255 - 90, tableBottom + 4, { width: 84, align: 'right' });

    // ── Gratuity breakup note (if applicable) ──────────────────
    let cursorY = tableBottom + 28;
    if (fnf.gratuity_applicable && fnf.gratuity_amount > 0) {
      doc.fontSize(8).fillColor(SLATE).font('Helvetica')
         .text(
           `Gratuity formula: (last basic + DA) × 15 / 26 × ${fnf.gratuity_years} completed year(s)` +
           (fnf.gratuity_taxable_excess > 0
             ? ` · Taxable excess over ₹20,00,000 cap: ₹${inr(fnf.gratuity_taxable_excess)}`
             : ' · Fully exempt under IT Act s.10(10)(ii)'),
           36, cursorY, { width: 523 }
         );
      cursorY += 14;
    }

    // ── NET PAYABLE banner ─────────────────────────────────────
    doc.rect(36, cursorY, 523, 32).fill(NAVY);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
       .text('NET PAYABLE', 42, cursorY + 5, { width: 200 });
    doc.fontSize(8).font('Helvetica')
       .text(`Payable by: ${isoToDDMonYYYY(fnf.payable_by_date)} (LWD + 45 days)`,
             42, cursorY + 19, { width: 280 });
    doc.fontSize(16).font('Helvetica-Bold')
       .text(`₹ ${inr(fnf.net_payable)}`,
             36 + 523 - 200, cursorY + 8, { width: 192, align: 'right' });
    cursorY += 42;

    // ── Signature block ────────────────────────────────────────
    const sigY = cursorY + 30;
    const sigCol = (x: number, label: string, name: string) => {
      doc.moveTo(x, sigY).lineTo(x + 140, sigY).strokeColor(SLATE).stroke();
      doc.fontSize(8).fillColor(SLATE).font('Helvetica')
         .text(label, x, sigY + 4, { width: 140 });
      doc.fontSize(9).fillColor('black').font('Helvetica-Bold')
         .text(name, x, sigY + 14, { width: 140 });
    };
    sigCol(36,  'Authorized HR Signatory', input.hr_signatory_name || 'HR · Trustner');
    sigCol(214, 'Employee Acknowledgement', input.full_name);
    sigCol(392, 'CEO / Director',          input.ceo_signatory_name || 'Ram Shah, CFP™');

    // ── Footer ─────────────────────────────────────────────────
    const footerY = 790;
    doc.fontSize(7).fillColor(SLATE).font('Helvetica')
       .text(
         `${ent.name} · ${ent.reg} · CIN: ${ent.cin}\n` +
         `This is a computer-generated F&F statement. Settlement is processed per company policy and applicable labour law (Payment of Gratuity Act 1972 / Code on Social Security 2020). ` +
         `Disputes, if any, must be raised in writing within 30 days of receipt.`,
         36, footerY, { width: 523, align: 'center' }
       );

    doc.end();
  });
}
