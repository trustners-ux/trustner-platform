/**
 * Advisory Workbench — shared HTML shell for client deliverables.
 *
 * Periodic Review, Client Orientation and Investment Proposal each built
 * their own ~90%-identical CSS block + masthead markup independently (23
 * near-duplicate lines across all three). This factors that out into one
 * place — sourced from the mature PD report family's BRAND palette
 * (portfolio-diagnostic/reports/_shared-styles.ts) — so a brand change only
 * has to happen once, and adds the gold accent-rule + KPI/typography sizes
 * those reports already carry.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { BRAND } from '@/lib/portfolio-diagnostic/reports/_shared-styles';
import { esc } from './format';

export const DELIVERABLE_SHELL_CSS = `
  @page { size: A4; margin: 15mm 18mm 14mm 18mm; }
  @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } html { background: white; } }
  @media screen { html { background: #EDEFF2; min-height: 100vh; } html body { max-width: 210mm; margin: 16px auto; padding: 15mm 18mm; box-shadow: 0 6px 28px rgba(21,35,59,0.12); } }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; line-height: 1.4; font-size: 9pt; margin: 0; background: white; }
  .no-print-bar { position: sticky; top: 0; background: ${BRAND.navy}; color: #fff; padding: 8px 16px; margin: -15mm -18mm 8mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; }
  .no-print-bar button { background: ${BRAND.gold}; color: #fff; border: 0; padding: 6px 14px; font-weight: 700; border-radius: 3px; cursor: pointer; font-size: 10pt; }
  .header { border-bottom: 1px solid ${BRAND.navy}; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header .firm { font-family: Georgia, 'Times New Roman', serif; color: ${BRAND.navy}; font-weight: 700; font-size: 13.5pt; }
  .header .sub { color: ${BRAND.slateMute}; font-size: 7.5pt; margin-top: 1px; letter-spacing: .3px; }
  .header-right { text-align: right; font-size: 8pt; color: ${BRAND.slateMute}; }
  .header-right .label { font-family: Georgia, serif; font-size: 9pt; color: ${BRAND.gold}; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
  .accent-rule { height: 2px; width: 60px; background: ${BRAND.gold}; margin: 8px 0 0; }
  .doc-title { font-family: Georgia, 'Times New Roman', serif; color: ${BRAND.navy}; font-size: 16pt; font-weight: 700; margin: 12px 0 1px; }
  .for-line { font-size: 8.5pt; color: ${BRAND.slateMute}; margin: 0 0 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .kpi-tile { background: #fff; border: 1px solid ${BRAND.line}; border-top: 2px solid ${BRAND.navy}; padding: 9px 10px; }
  .kpi-tile .lbl { font-size: 6.6pt; color: ${BRAND.slateMute}; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
  .kpi-tile .val { font-family: Georgia, serif; font-size: 16pt; font-weight: 700; color: ${BRAND.navy}; line-height: 1.05; margin-top: 4px; }
  .kpi-tile .val.pos { color: ${BRAND.pos}; }
  .kpi-tile .val.neg { color: ${BRAND.neg}; }
  .sec-title { font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 11pt; font-weight: 700; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid ${BRAND.line}; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: ${BRAND.navy}; color: #fff; padding: 4px 7px; text-align: left; font-weight: 600; font-size: 7pt; }
  td { padding: 4px 7px; border: 1px solid ${BRAND.line}; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; }
  .pos { color: ${BRAND.pos}; }
  .neg { color: ${BRAND.neg}; }
  .prose { font-size: 9pt; color: #374151; line-height: 1.5; margin: 4px 0 0; }
`;

/** Standard navy/gold masthead + gold accent-rule shared by every deliverable. */
export function renderMasthead(opts: {
  firmName: string;
  arn: string;
  docLabel: string;
  docId: string;
}): string {
  return `<div class="header">
  <div>
    <div class="firm">${esc(opts.firmName)}</div>
    <div class="sub">AMFI Registered Mutual Fund Distributor · ${esc(opts.arn)}</div>
  </div>
  <div class="header-right">
    <div class="label">${esc(opts.docLabel)}</div>
    <div>${esc(opts.docId)}</div>
  </div>
</div>
<div class="accent-rule"></div>`;
}
