/**
 * AES-256-GCM encryption for PII at rest (Aadhaar, bank account numbers).
 *
 * Uses `PII_ENCRYPTION_KEY` env var (64-char hex = 32 bytes).
 * When the key is unset, encrypt() returns plaintext and decrypt() passes
 * through — so existing data doesn't break before the key is provisioned.
 * Once set, all new writes are encrypted; a one-time migration encrypts
 * existing plaintext rows.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const PREFIX = 'enc:';

function getKey(): Buffer | null {
  const hex = process.env.PII_ENCRYPTION_KEY;
  if (!hex) return null;
  if (hex.length !== 64) {
    console.error('[pii-crypto] PII_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
    return null;
  }
  return Buffer.from(hex, 'hex');
}

export function encryptPii(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: enc:<iv>:<tag>:<ciphertext> — all base64
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptPii(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const key = getKey();
  if (!key) {
    console.error('[pii-crypto] Cannot decrypt: PII_ENCRYPTION_KEY not set');
    return null;
  }

  const parts = stored.slice(PREFIX.length).split(':');
  if (parts.length !== 3) {
    console.error('[pii-crypto] Malformed encrypted value');
    return null;
  }

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const ciphertext = Buffer.from(parts[2], 'base64');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}
