/**
 * Canonical PD-report styling — single source of truth.
 *
 * Every client-facing HTML report (three-pager, full review, action sheet,
 * one-pager, proposal, narrative) imports these blocks so the holdings table,
 * verdict badges, tier headers and brand palette are IDENTICAL across the
 * whole family. Editing the look in one place keeps the deliverables
 * consistent — no per-report drift.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

/** Brand palette tokens (kept in one place so colours stay coherent).
 *  Institutional system (locked Jun 21 2026): deep navy ink + a single
 *  restrained GOLD accent + warm greys — Morgan-Stanley / private-wealth feel.
 *  No saturated fills anywhere; tier colours are MUTED and used only as thin
 *  rules / small text, never as block backgrounds. */
export const BRAND = {
  navy: '#15233B',        // primary ink-navy — headers, figures, table head
  navyDeep: '#0F1A2E',
  teal: '#2F6F4F',        // (legacy key) now a muted forest green
  gold: '#9A7B4F',        // the single restrained accent
  goldDeep: '#8A6A40',
  ink: '#1F2937',
  slate: '#374151',
  slateMute: '#6B7280',
  line: '#E5E7EB',
  zebra: '#F9FAFB',
  panel: '#F4F6F8',
  pos: '#1E6B43',
  neg: '#9B2C3A',
  // tier accents — muted, used as a thin rule / small label only
  star: '#9A7B4F',
  keep: '#2F6F4F',
  watch: '#B07A2E',
  swap: '#9B2C3A',
  liq: '#6B7280',
  // Asset-allocation donut sleeves (Investment Proposal) that need more than the
  // tier-accent set above — three genuinely new, muted tones consistent with the
  // "no saturated fills" system; the other seven sleeves reuse the tokens above.
  sleeve: {
    smallCap: '#5B4A6B',       // muted plum
    hybrid: '#6B5B3E',         // muted bronze/khaki
    international: '#3E5B5B',  // muted teal-slate
  },
} as const;

/**
 * Holdings table + verdict badges + %-cells. The ONE definition shared by
 * every report so the "Why"/"Reason" column and row rhythm are pixel-identical
 * regardless of which deliverable the client opens. Dense, premium, print-safe.
 */
export const REPORT_TABLE_CSS = `
  table { width: 100%; border-collapse: collapse; font-size: 7pt; margin: 2px 0; }
  th { background: ${BRAND.navy}; color: white; padding: 4px 6px; text-align: left; font-weight: 600; font-size: 6.6pt; letter-spacing: 0.3px; border: 1px solid ${BRAND.navy}; }
  td { padding: 4px 6px; border: 1px solid ${BRAND.line}; vertical-align: top; line-height: 1.3; }
  tr:nth-child(even) td { background: ${BRAND.zebra}; }
  .amt { text-align: right; white-space: nowrap; font-weight: 600; color: ${BRAND.navy}; }
  .ctr { text-align: center; }
  .pct-pos { color: ${BRAND.pos}; font-weight: 700; }
  .pct-neg { color: ${BRAND.neg}; font-weight: 700; }
  .pct-neu { color: ${BRAND.slateMute}; }
  .nm { color: #9CA3AF; font-style: italic; }
  /* Verdict pills — soft, cohesive tints (no loud fills) */
  .verdict { text-align: center; font-weight: 700; font-size: 6.6pt; padding: 1px 4px; border-radius: 2px; display: inline-block; width: 58px; }
  .v-star  { background: #F5EFE3; color: ${BRAND.goldDeep}; border: 1px solid #D8C7A6; }
  .v-keep  { background: #E8F1EC; color: ${BRAND.keep}; border: 1px solid #B9D4C5; }
  .v-watch { background: #F6EEDF; color: ${BRAND.watch}; border: 1px solid #E0C99E; }
  .v-swap  { background: #F6E6E9; color: ${BRAND.swap}; border: 1px solid #DDB3BB; }
  .v-liq   { background: #EEF0F2; color: ${BRAND.slate}; border: 1px solid #D1D5DB; }
`;
