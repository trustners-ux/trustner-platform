/**
 * OCR provider seam (audit P0-2, cross-border data residency).
 *
 * KYC Aadhaar/PAN card images are the most sensitive PII we hold. They must NOT
 * leave India by default. This module dispatches OCR to a configured provider
 * via the `OCR_PROVIDER` env var and returns RAW TEXT only — structured field
 * extraction happens in the pure, provider-agnostic `ocr-extract.ts`.
 *
 *   OCR_PROVIDER unset / 'disabled'  → OCR is OFF. Returns null → staff enters
 *                                      PAN/Aadhaar manually. NO data leaves India.
 *   OCR_PROVIDER = 'google_docai'    → India-region Google Document AI
 *                                      (region-pinned, default asia-south1/Mumbai).
 *   OCR_PROVIDER = 'anthropic_us'    → LEGACY US path. Explicit opt-in only;
 *                                      logs a cross-border warning every call.
 *                                      Do NOT set this for Aadhaar workloads.
 *
 * Default-OFF is deliberate: it guarantees that until an India-region provider
 * is provisioned, no Aadhaar/PAN image is shipped abroad. See
 * _security/SECURITY_AUDIT_2026-06-26.md.
 */

import { SignJWT, importPKCS8 } from 'jose';

export type OcrDocType = 'pan' | 'aadhaar';

export interface OcrInput {
  imageUrl: string; // short-lived signed URL to the document image
  mimeType: string; // e.g. image/jpeg, image/png
  docType: OcrDocType;
}

/** Result of an OCR attempt. `disabled` distinguishes "off by policy" from a real error. */
export type OcrResult =
  | { ok: true; rawText: string }
  | { ok: false; disabled: true; reason: string }
  | { ok: false; disabled: false; reason: string };

function provider(): string {
  return (process.env.OCR_PROVIDER || 'disabled').trim().toLowerCase();
}

export function ocrProviderName(): string {
  return provider();
}

export async function runOcr(input: OcrInput): Promise<OcrResult> {
  switch (provider()) {
    case 'google_docai':
      return googleDocAiOcr(input);
    case 'anthropic_us':
      return anthropicUsOcr(input);
    case 'disabled':
    default:
      return {
        ok: false,
        disabled: true,
        reason:
          'Automated OCR is disabled by data-residency policy. Set OCR_PROVIDER=google_docai with India-region credentials to enable it. Enter PAN/Aadhaar fields manually for now.',
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider: Google Document AI (India region)
// Env:
//   GOOGLE_DOCAI_SA_KEY       service-account JSON (string) — client_email + private_key
//   GOOGLE_DOCAI_PROJECT      GCP project id
//   GOOGLE_DOCAI_PROCESSOR_ID Document AI processor id (an OCR processor)
//   GOOGLE_DOCAI_LOCATION     region, default 'asia-south1' (Mumbai). Pinned to India.
// ─────────────────────────────────────────────────────────────────────────────
async function googleDocAiOcr(input: OcrInput): Promise<OcrResult> {
  const saKeyRaw = process.env.GOOGLE_DOCAI_SA_KEY;
  const project = process.env.GOOGLE_DOCAI_PROJECT;
  const processorId = process.env.GOOGLE_DOCAI_PROCESSOR_ID;
  const location = (process.env.GOOGLE_DOCAI_LOCATION || 'asia-south1').trim();

  if (!saKeyRaw || !project || !processorId) {
    return {
      ok: false,
      disabled: true,
      reason:
        'OCR_PROVIDER=google_docai but GOOGLE_DOCAI_SA_KEY / GOOGLE_DOCAI_PROJECT / GOOGLE_DOCAI_PROCESSOR_ID are not all set. OCR stays off (no data leaves India).',
    };
  }
  // Guardrail: refuse non-India regions so a mis-set env can't reintroduce the
  // cross-border leak. Document AI India regions live under asia-south*.
  if (!location.startsWith('asia-south')) {
    return {
      ok: false,
      disabled: false,
      reason: `Refusing to run OCR: GOOGLE_DOCAI_LOCATION='${location}' is not an India region (expected asia-south1/asia-south2).`,
    };
  }

  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(saKeyRaw);
  } catch {
    return { ok: false, disabled: false, reason: 'GOOGLE_DOCAI_SA_KEY is not valid JSON.' };
  }

  // 1) Mint a Google OAuth2 access token from the service account (RS256 JWT-bearer).
  const accessToken = await mintGoogleAccessToken(sa);

  // 2) Fetch the image bytes from the signed URL and base64-encode them.
  const imgRes = await fetch(input.imageUrl);
  if (!imgRes.ok) {
    return { ok: false, disabled: false, reason: `Could not fetch document image (HTTP ${imgRes.status}).` };
  }
  const bytes = Buffer.from(await imgRes.arrayBuffer());
  const content = bytes.toString('base64');

  // 3) Process the document, region-pinned to India.
  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${project}/locations/${location}/processors/${processorId}:process`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ skipHumanReview: true, rawDocument: { content, mimeType: input.mimeType } }),
  });
  const j = (await res.json()) as { document?: { text?: string }; error?: { message?: string } };
  if (!res.ok) {
    return { ok: false, disabled: false, reason: `Document AI HTTP ${res.status}: ${j.error?.message || 'unknown'}` };
  }
  const text = j.document?.text?.trim();
  if (!text) return { ok: false, disabled: false, reason: 'Document AI returned no text.' };
  return { ok: true, rawText: text };
}

async function mintGoogleAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const key = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/cloud-platform' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const j = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !j.access_token) {
    throw new Error(`Google token exchange failed: ${j.error_description || res.status}`);
  }
  return j.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider: Anthropic (US) — LEGACY, opt-in only. Cross-border; do not use for
// Aadhaar. Retained so the capability isn't lost, but never the default.
// ─────────────────────────────────────────────────────────────────────────────
const US_PROMPT =
  'Extract ALL visible text from this Indian ID card image. Return ONLY the raw text, every line, newline-separated. No commentary.';

async function anthropicUsOcr(input: OcrInput): Promise<OcrResult> {
  console.warn(
    `[OCR] CROSS-BORDER: OCR_PROVIDER=anthropic_us is sending a ${input.docType} image to api.anthropic.com (US). This contradicts the India-region policy — switch to google_docai.`,
  );
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, disabled: false, reason: 'ANTHROPIC_API_KEY not set.' };
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: input.imageUrl } },
            { type: 'text', text: US_PROMPT },
          ],
        },
      ],
    }),
  });
  const j = (await r.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!r.ok) return { ok: false, disabled: false, reason: `Claude HTTP ${r.status}: ${j.error?.message || 'unknown'}` };
  const text = j.content?.find((b) => b.type === 'text')?.text?.trim();
  if (!text) return { ok: false, disabled: false, reason: 'Claude returned no text.' };
  return { ok: true, rawText: text };
}
