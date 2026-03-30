/* ─────────────────────────────────────────────────────────
   Fund Slug Utilities

   Generates URL-safe slugs from fund names and scheme codes.
   Format: {schemeCode}-{sanitized-name}
   Example: 106235-nippon-india-large-cap-fund-growth
   ───────────────────────────────────────────────────────── */

/**
 * Generate a URL-friendly slug from scheme code and name.
 * Removes special characters, normalizes whitespace, and caps at 60 chars
 * for the name portion to keep URLs reasonable.
 */
export function generateFundSlug(schemeCode: number, schemeName: string): string {
  const safeName = schemeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${schemeCode}-${safeName}`;
}

/**
 * Extract the scheme code from a fund slug.
 * Returns null if the slug format is invalid.
 */
export function parseSlugCode(slug: string): number | null {
  const parts = slug.split('-');
  const code = parseInt(parts[0], 10);
  return isNaN(code) ? null : code;
}
