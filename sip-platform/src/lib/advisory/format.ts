/**
 * Advisory Workbench — shared formatting helpers for client deliverables.
 *
 * Previously copy-pasted verbatim in periodic-review/note.ts,
 * client-orientation/summary.ts and investment-proposal/proposal-doc.ts.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

export function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function inrShort(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
