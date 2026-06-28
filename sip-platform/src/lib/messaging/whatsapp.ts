/**
 * WhatsApp client — Direct Meta Cloud API.
 *
 * Uses the same Meta Business / Phone Number ID already provisioned for
 * Trustner via the trustner-hub project. Env vars on Vercel:
 *   - WHATSAPP_PHONE_NUMBER_ID
 *   - WHATSAPP_ACCESS_TOKEN
 *   - WHATSAPP_OTP_TEMPLATE (optional, defaults to 'verification_code')
 *
 * For inbound user actions (e.g. user taps "Verify" on the lead funnel,
 * triggering OTP send), Meta requires either:
 *   (a) the user has messaged you in the last 24h → plain text allowed
 *   (b) a pre-approved template message
 *
 * We try template first (most reliable for cold leads), fall back to
 * text (works for users already in the 24h service window).
 */

interface MetaApiResponse {
  messaging_product?: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: { message: string; type: string; code: number };
}

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN env var is missing');
  }
  return { phoneNumberId, accessToken };
}

/**
 * Normalize phone to E.164-ish WhatsApp format: digits only, India default
 * (91 prefix). Meta accepts the same shape Twilio does.
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

const META_API_VERSION = 'v22.0';

async function metaSend(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  let config;
  try {
    config = getConfig();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    const data = (await res.json()) as MetaApiResponse;
    if (!res.ok || data.error) {
      const msg = data.error?.message || `HTTP ${res.status}`;
      console.error('[WhatsApp] Meta send error:', msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    console.error('[WhatsApp] fetch error:', (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Send a plain text WhatsApp message.
 * Works ONLY inside the 24h service window (user messaged us recently).
 */
export async function sendWhatsAppText(phone: string, text: string): Promise<boolean> {
  const to = formatWhatsAppPhone(phone);
  const { ok } = await metaSend({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
  return ok;
}

/**
 * Send a pre-approved template message — required for OTP delivery to cold
 * leads (users who haven't messaged us in the last 24h).
 *
 * Template `verification_code` should have the body parameter {{1}} = OTP.
 * If your approved template uses a different name, set WHATSAPP_OTP_TEMPLATE.
 */
export async function sendWhatsAppOtpTemplate(
  phone: string,
  otp: string,
  templateName?: string,
  languageCode: string = 'en'
): Promise<boolean> {
  const to = formatWhatsAppPhone(phone);
  const template = templateName || process.env.WHATSAPP_OTP_TEMPLATE || 'verification_code';
  const { ok } = await metaSend({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: languageCode },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
        // OTP templates often have a button that auto-fills the code on tap.
        // Adding the button parameter is harmless if the template lacks one.
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  });
  return ok;
}

/**
 * Try template first (works for cold leads), fall back to text (works for
 * users in the 24h service window). Returns true on first success.
 */
export async function sendOtpViaWhatsApp(phone: string, otp: string): Promise<boolean> {
  // Try template message first — required for cold (non-24h-window) recipients
  const templateOk = await sendWhatsAppOtpTemplate(phone, otp);
  if (templateOk) return true;
  // Fallback to text — works if user messaged us in the last 24h
  return sendWhatsAppText(phone, buildOtpMessage(otp));
}

/**
 * Build a friendly OTP message body for the text-fallback path.
 */
export function buildOtpMessage(otp: string): string {
  return (
    `Your Trustner verification code is *${otp}*\n\n` +
    `This code is valid for 5 minutes. Do not share it with anyone.\n\n` +
    `_Trustner Asset Services · ARN-286886_`
  );
}
