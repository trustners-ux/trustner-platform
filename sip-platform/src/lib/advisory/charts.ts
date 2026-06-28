/**
 * Advisory Workbench — lightweight inline SVG charts for client deliverables.
 *
 * Pure string output (no deps) so charts render identically in browser preview
 * and headless print-to-PDF. Used by the Periodic Review note, Client Orientation
 * summary and Investment Proposal document to lift them to a premium standard.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * A clean donut chart (stroke-dasharray technique) with an optional centre label.
 */
export function donutSvg(
  segments: DonutSegment[],
  opts: { size?: number; stroke?: number; centerLabel?: string; centerSub?: string } = {}
): string {
  const size = opts.size ?? 156;
  const sw = opts.stroke ?? 26;
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const live = segments.filter((s) => s.value > 0);
  const total = live.reduce((s, x) => s + x.value, 0) || 1;

  let offset = 0;
  const arcs = live
    .map((s) => {
      const len = (s.value / total) * C;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += len;
      return el;
    })
    .join('');

  const center = opts.centerLabel
    ? `<text x="${cx}" y="${cy - 1}" text-anchor="middle" font-family="Georgia, serif" font-size="${(size * 0.17).toFixed(0)}" font-weight="700" fill="#15233B">${opts.centerLabel}</text>${opts.centerSub ? `<text x="${cx}" y="${cy + size * 0.13}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${(size * 0.075).toFixed(0)}" fill="#6B7280" letter-spacing="0.5">${opts.centerSub}</text>` : ''}`
    : '';

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Allocation donut">${arcs}${center}</svg>`;
}

/** A small legend (coloured dots + label + value) to sit beside a donut. */
export function donutLegend(segments: DonutSegment[], fmt: (v: number) => string = (v) => `${v}%`): string {
  return `<div style="display:flex;flex-direction:column;gap:3px">${segments
    .filter((s) => s.value > 0)
    .map(
      (s) =>
        `<div style="display:flex;align-items:center;gap:6px;font-size:8pt;color:#374151"><span style="width:9px;height:9px;border-radius:2px;background:${s.color};display:inline-block;flex:0 0 auto"></span><span style="flex:1">${s.label}</span><span style="font-weight:700;color:#15233B">${fmt(s.value)}</span></div>`
    )
    .join('')}</div>`;
}

/**
 * Two stacked horizontal bars comparing a start value to a current value
 * (proportional widths) — a "period growth" visual for the periodic review.
 */
export function compareBarSvg(
  startVal: number,
  currentVal: number,
  opts: { startLabel?: string; currentLabel?: string; fmt?: (v: number) => string } = {}
): string {
  const fmt = opts.fmt ?? ((v: number) => String(Math.round(v)));
  const max = Math.max(startVal, currentVal, 1);
  const up = currentVal >= startVal;
  const startW = Math.max(2, (startVal / max) * 100);
  const curW = Math.max(2, (currentVal / max) * 100);
  const row = (label: string, w: number, val: number, color: string) =>
    `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:8pt"><span style="width:42px;color:#6B7280;flex:0 0 auto">${label}</span><span style="flex:1;background:#EEF1F4;border-radius:3px;height:14px;position:relative"><span style="display:block;height:14px;width:${w}%;background:${color};border-radius:3px"></span></span><span style="width:72px;text-align:right;font-weight:700;color:#15233B;flex:0 0 auto">${fmt(val)}</span></div>`;
  return `<div style="margin:6px 0">${row(opts.startLabel ?? 'Start', startW, startVal, '#9CA8B8')}${row(opts.currentLabel ?? 'Now', curW, currentVal, up ? '#2F6F4F' : '#9B2C3A')}</div>`;
}

/** A small "as of <date>" provenance pill (Fortune-500 data-trust signal). */
export function provenanceChip(text: string): string {
  return `<span style="display:inline-block;font-size:7.5pt;color:#6B7280;background:#F4F6F8;border:1px solid #E5E7EB;border-radius:10px;padding:1px 8px;letter-spacing:0.2px">${text}</span>`;
}
