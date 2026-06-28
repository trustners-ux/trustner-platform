/**
 * Pure, provider-agnostic field extraction from OCR raw text.
 *
 * Any OCR provider (India-region Google Document AI, a future on-prem engine,
 * etc.) returns raw text; these helpers turn that text into the structured
 * PAN / Aadhaar fields the KYC flow needs. Kept pure (no I/O, no network) so
 * the extraction logic is unit-testable offline and identical across providers.
 *
 * SECURITY: the Aadhaar extractor NEVER returns the full 12-digit number — only
 * the last 4 digits — matching the at-rest policy (clients table stores last4 +
 * hash, not the full UID). See _security/SECURITY_AUDIT_2026-06-26.md (P0-2, P1-6).
 */

export interface PanFields {
  pan_number: string | null;
  name: string | null;
  father_name: string | null;
  dob: string | null;
  raw_text: string;
}

export interface AadhaarFields {
  aadhaar_last_4: string | null;
  name: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  raw_text: string;
}

export type IdFields = PanFields | AadhaarFields;

/** Normalise any DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD date to YYYY-MM-DD. */
function normaliseDob(text: string): string | null {
  // ISO first: 1990-01-31
  const iso = text.match(/\b(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (iso) return iso[0];
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = text.match(/\b(0[1-9]|[12]\d|3[01])[/\-.](0[1-9]|1[0-2])[/\-.]((?:19|20)\d{2})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
}

/** Extract structured fields from the raw text of an Indian PAN card. */
export function extractPanFields(rawText: string): PanFields {
  const text = rawText || '';
  const pan = text.toUpperCase().match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/);
  return {
    pan_number: pan ? pan[0] : null,
    name: null, // raw-text OCR can't reliably isolate the holder name; staff verifies.
    father_name: null,
    dob: normaliseDob(text),
    raw_text: text,
  };
}

/** Extract structured fields from the raw text of an Indian Aadhaar card. */
export function extractAadhaarFields(rawText: string): AadhaarFields {
  const text = rawText || '';
  // Aadhaar is 12 digits, usually printed "XXXX XXXX 1234". Capture ONLY the
  // final 4-digit group — the full UID is never retained.
  const grouped = text.match(/\b\d{4}\s\d{4}\s(\d{4})\b/);
  const last4 = grouped ? grouped[1] : (text.match(/\b\d{12}\b/)?.[0].slice(-4) ?? null);
  const gender = /\bfemale\b/i.test(text) ? 'F' : /\bmale\b/i.test(text) ? 'M' : null;
  return {
    aadhaar_last_4: last4,
    name: null,
    dob: normaliseDob(text),
    gender,
    address: null,
    raw_text: text,
  };
}
