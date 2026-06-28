/**
 * Advisory Workbench — shared client-deliverable compliance layer.
 *
 * One source of truth for the MFD-safe disclosure block + the SEBI riskometer
 * that EVERY client-facing workbench deliverable (Periodic Review note, Client
 * Orientation summary, Investment Proposal) must carry. Built on the firm's
 * COMPANY / DISCLAIMER constants and the PD report's proven compliance copy.
 *
 * Pure string output (HTML + inline SVG) so it drops into the existing
 * HTML→PDF report pipeline. No "advisor/advisory" framing — Trustner is an
 * AMFI distributor (ARN-286886), not a SEBI RIA.
 */
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';

// ───────────────────────────────────────────────────────────────────
// SEBI RISKOMETER
// ───────────────────────────────────────────────────────────────────

/** The six SEBI riskometer bands, low → high. */
export const RISKOMETER_LEVELS = [
  'Low',
  'Low to Moderate',
  'Moderate',
  'Moderately High',
  'High',
  'Very High',
] as const;

export type RiskometerLevel = (typeof RISKOMETER_LEVELS)[number];

const BAND_COLORS = ['#1a9850', '#91cf60', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027'];

/**
 * Map an internal risk label (Client-Orientation category, PD risk tier, or an
 * investment-proposal RiskProfile) to the nearest SEBI riskometer band. Lenient
 * substring match; defaults to 'Moderately High' (the typical equity-MF band).
 */
export function toRiskometerLevel(label: string | null | undefined): RiskometerLevel {
  const s = (label || '').toLowerCase();
  if (!s) return 'Moderately High';
  if (s.includes('very') && (s.includes('aggress') || s.includes('high'))) return 'Very High';
  if (s.includes('conservative') || s.includes('low risk')) return 'Low to Moderate';
  if (s.includes('moderately aggressive') || s.includes('moderately high')) return 'Moderately High';
  if (s.includes('aggressive') || s === 'high' || s.includes('very high')) return 'High';
  if (s.includes('moderate') || s.includes('balanced')) return 'Moderate';
  if (s.includes('low')) return 'Low to Moderate';
  return 'Moderately High';
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

/**
 * Inline SVG SEBI riskometer — a 180° gauge with six coloured bands and a needle
 * at the supplied level. Self-contained (no external fonts/refs) so it renders
 * identically in browser preview and headless PDF.
 */
export function buildRiskometerSvg(level: RiskometerLevel, opts?: { width?: number }): string {
  const w = opts?.width ?? 260;
  const h = Math.round(w * 0.66);
  const cx = w / 2;
  const cy = Math.round(h * 0.92);
  const rOuter = w * 0.42;
  const rInner = w * 0.26;
  const idx = Math.max(0, RISKOMETER_LEVELS.indexOf(level));

  // Six 30° bands spanning 180° (left=180° → right=0°).
  const bands = BAND_COLORS.map((color, i) => {
    const a0 = 180 - i * 30;
    const a1 = 180 - (i + 1) * 30;
    const [ox0, oy0] = polar(cx, cy, rOuter, a0);
    const [ox1, oy1] = polar(cx, cy, rOuter, a1);
    const [ix1, iy1] = polar(cx, cy, rInner, a1);
    const [ix0, iy0] = polar(cx, cy, rInner, a0);
    const active = i === idx;
    return `<path d="M ${ox0.toFixed(1)} ${oy0.toFixed(1)} A ${rOuter} ${rOuter} 0 0 1 ${ox1.toFixed(1)} ${oy1.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${rInner} ${rInner} 0 0 0 ${ix0.toFixed(1)} ${iy0.toFixed(1)} Z" fill="${color}" opacity="${active ? 1 : 0.35}" stroke="#fff" stroke-width="1"/>`;
  }).join('');

  // Needle to the centre of the active band.
  const needleDeg = 180 - idx * 30 - 15;
  const [nx, ny] = polar(cx, cy, rOuter * 0.96, needleDeg);
  const needle = `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="#0f172a"/>`;

  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Riskometer: ${level} risk">
    ${bands}${needle}
    <text x="${cx}" y="${cy - rOuter - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">RISKOMETER</text>
    <text x="${cx}" y="${h - 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#0f172a">${level} Risk</text>
  </svg>`;
}

// ───────────────────────────────────────────────────────────────────
// COMPLIANCE FOOTER
// ───────────────────────────────────────────────────────────────────

/** CSS for the shared compliance footer + riskometer caption. Inject once per document. */
export const COMPLIANCE_CSS = `
.tas-riskometer { text-align:center; margin: 8px 0 4px; }
.tas-riskometer .cap { font-size:10px; color:#475569; margin-top:2px; line-height:1.4; }
.tas-compliance { margin-top:18px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:9.5px; line-height:1.55; color:#64748b; }
.tas-compliance .firm { font-weight:700; color:#334155; }
.tas-compliance p { margin:0 0 5px; }
`;

export interface ComplianceFooterOpts {
  /** Risk level to render the riskometer for (omit to hide the riskometer). */
  riskometerLevel?: RiskometerLevel;
  /** What the riskometer reflects, e.g. "this portfolio" or "the proposed allocation". */
  riskometerCaption?: string;
  /** Assumed return for any forward projection in the document (e.g. 12). Adds the illustrative-projection line when set. */
  assumedReturnPct?: number;
  /** Set true when the document contains tax estimates → adds the tax-indicative line. */
  hasTaxEstimates?: boolean;
  /** Preparer (Relationship Manager) name + document id/date, shown above the disclosure. */
  preparedBy?: string;
  documentId?: string;
  reportDate?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The full MFD-safe disclosure block (+ optional riskometer) for a client
 * deliverable. Returns HTML; pair with COMPLIANCE_CSS.
 */
export function buildComplianceFooter(opts: ComplianceFooterOpts = {}): string {
  const mf = COMPANY.mfEntity;
  const riskometer = opts.riskometerLevel
    ? `<div class="tas-riskometer">${buildRiskometerSvg(opts.riskometerLevel)}<div class="cap">${esc(opts.riskometerCaption || 'Product risk level (SEBI riskometer).')}</div></div>`
    : '';

  const prepared =
    opts.preparedBy || opts.documentId
      ? `<p>${opts.preparedBy ? `Prepared by: ${esc(opts.preparedBy)} (Relationship Manager). ` : ''}${opts.documentId ? `Document: ${esc(opts.documentId)}${opts.reportDate ? ` · ${esc(opts.reportDate)}` : ''}.` : ''}</p>`
      : '';

  const projectionLine =
    opts.assumedReturnPct != null
      ? `Any corpus projection or required-SIP figure shown is an illustrative calculation based on an assumed constant return of ${opts.assumedReturnPct}% p.a.; actual returns will vary and are not guaranteed. `
      : '';

  const taxLine = opts.hasTaxEstimates ? `${DISCLAIMER.calculator} ${COMPLIANCE_TAX} ` : '';

  return `${riskometer}
<div class="tas-compliance">
  ${prepared}
  <p>${DISCLAIMER.mutual_fund}</p>
  <p>${projectionLine}${taxLine}This document reflects Trustner's house analytical and distribution view as an AMFI-registered Mutual Fund Distributor. It does <strong>not</strong> constitute investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013. Trustner is not a SEBI-Registered Investment Adviser. Final investment decisions rest with each PAN holder.</p>
  <p>${DISCLAIMER.sebi_investor}</p>
  <p class="firm">${esc(mf.name)} · ${mf.amfiArn} · CIN: ${mf.cin} · AMFI Registered Mutual Fund Distributor and SIF Distributor; APMI Registered PMS Distributor.</p>
</div>`;
}

const COMPLIANCE_TAX =
  'Tax estimates are indicative — please confirm the final liability with your Chartered Accountant before acting.';
